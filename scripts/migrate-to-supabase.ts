/**
 * One-time SQLite -> Supabase migration tool. NOT part of the app runtime
 * (never imported by anything under app/ or lib/) — run manually via the
 * npm scripts below. Independent of DATA_BACKEND; only needs the three
 * Supabase env vars to be present to run for real.
 *
 *   npm run migrate:supabase:dry-run   Local-only validation. Never
 *                                      contacts Supabase. Safe to run any
 *                                      time.
 *   npm run migrate:supabase           Writes rows + uploads files to the
 *                                      real project. Idempotent (safe to
 *                                      rerun) — upserts by id, uploads
 *                                      with upsert:true.
 *   npm run migrate:supabase:verify    Read-only row-count comparison
 *                                      between SQLite and Supabase. Writes
 *                                      nothing.
 *
 * Privacy: never logs row contents (names, emails, messages, tokens,
 * keys) — only table/file counts and sanitized error messages. Opens
 * SQLite strictly read-only and never deletes or modifies local data or
 * files.
 */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------
// Env + paths (duplicated from lib/paths.ts rather than imported — this
// script must run standalone under tsx, outside the Next.js module graph,
// and lib/supabase/admin.ts pulls in "server-only" which only behaves
// correctly inside a bundler).
// ---------------------------------------------------------------------

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

const DB_PATH = path.join(process.cwd(), "data", "app.db");
const RESOURCE_FILES_DIR = path.join(process.cwd(), "private-storage", "resources");
const COVER_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "covers");
const COVER_PUBLIC_PREFIX = "/uploads/covers";

const RESOURCE_FILES_BUCKET = "resource-files";
const COVER_IMAGES_BUCKET = "cover-images";

const mode: "dry-run" | "verify" | "migrate" = process.argv.includes("--dry-run")
  ? "dry-run"
  : process.argv.includes("--verify")
    ? "verify"
    : "migrate";

let exitCode = 0;
function fail(message: string) {
  console.error(`[migrate] ERROR: ${message}`);
  exitCode = 1;
}

// ---------------------------------------------------------------------
// Supabase client — only constructed for modes that actually need it.
// ---------------------------------------------------------------------

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) return null;
  return { url, secretKey };
}

function createAdminClient(): SupabaseClient {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Supabase credentials are not configured (.env.local).");
  }
  return createClient(config.url, config.secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------
// Table definitions: name, boolean columns (SQLite 0/1 -> real boolean),
// and migration order (parents before children, for resource_requests'
// foreign keys).
// ---------------------------------------------------------------------

type TableDef = { name: string; boolCols: string[] };

const TABLES: TableDef[] = [
  { name: "resources", boolCols: ["is_demo_content", "published", "featured"] },
  { name: "articles", boolCols: ["is_demo_content", "published", "featured"] },
  { name: "books", boolCols: ["published", "featured"] },
  { name: "projects", boolCols: ["published", "featured"] },
  { name: "leads", boolCols: ["updates_opt_in"] },
  { name: "resource_requests", boolCols: ["opted_in_this_request"] },
  { name: "questions", boolCols: [] },
  { name: "contact_enquiries", boolCols: [] },
];

function toSupabaseRow(row: Record<string, unknown>, boolCols: string[]) {
  const out: Record<string, unknown> = { ...row };
  for (const col of boolCols) {
    if (col in out) out[col] = Boolean(out[col]);
  }
  return out;
}

// ---------------------------------------------------------------------
// File migration: resource PDFs (always local -> bucket, name preserved)
// and cover images (only when cover_image_path is a local /uploads/covers
// path; already-migrated or absent covers are left alone).
// ---------------------------------------------------------------------

type FileStats = { uploaded: number; missing: number; skipped: number };

async function uploadResourceFiles(
  supabase: SupabaseClient | null,
  resourceRows: Record<string, unknown>[],
  dryRun: boolean
): Promise<FileStats> {
  const stats: FileStats = { uploaded: 0, missing: 0, skipped: 0 };

  for (const row of resourceRows) {
    const fileName = row.file_path as string;
    const localPath = path.join(RESOURCE_FILES_DIR, fileName);

    if (!fs.existsSync(localPath)) {
      console.warn(`[migrate] resources: missing local file for id=${row.id} (${fileName})`);
      stats.missing += 1;
      continue;
    }

    if (dryRun) {
      stats.uploaded += 1; // "would upload"
      continue;
    }

    try {
      const buffer = fs.readFileSync(localPath);
      const { error } = await supabase!
        .storage.from(RESOURCE_FILES_BUCKET)
        .upload(fileName, buffer, { contentType: "application/pdf", upsert: true });
      if (error) throw new Error(error.message);
      stats.uploaded += 1;
    } catch (err) {
      fail(`resource file upload failed for id=${row.id}: ${(err as Error).message}`);
    }
  }

  return stats;
}

/**
 * Handles cover_image_path for any of the three tables that have one
 * (resources, articles, books). Mutates nothing — returns the path value
 * each row should be written with (rewritten to a public Supabase URL
 * when a local file was uploaded, unchanged otherwise).
 */
async function migrateCover(
  supabase: SupabaseClient | null,
  coverPath: string | null,
  idForLog: string,
  dryRun: boolean,
  stats: FileStats
): Promise<string | null> {
  if (!coverPath) return null;
  if (!coverPath.startsWith(COVER_PUBLIC_PREFIX)) {
    // Already a remote URL (e.g. from a prior migration run) — nothing to do.
    stats.skipped += 1;
    return coverPath;
  }

  const fileName = coverPath.slice(COVER_PUBLIC_PREFIX.length + 1);
  const localPath = path.join(COVER_UPLOADS_DIR, fileName);

  if (!fs.existsSync(localPath)) {
    console.warn(`[migrate] cover: missing local file for id=${idForLog} (${fileName})`);
    stats.missing += 1;
    return coverPath; // leave as-is rather than losing the reference
  }

  if (dryRun) {
    stats.uploaded += 1;
    return coverPath;
  }

  const ext = path.extname(fileName).toLowerCase();
  const contentType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

  const buffer = fs.readFileSync(localPath);
  const { error } = await supabase!
    .storage.from(COVER_IMAGES_BUCKET)
    .upload(fileName, buffer, { contentType, upsert: true });
  if (error) {
    fail(`cover upload failed for id=${idForLog}: ${error.message}`);
    return coverPath;
  }
  stats.uploaded += 1;
  const { data } = supabase!.storage.from(COVER_IMAGES_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

// ---------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------

async function runDryRun(db: Database.Database) {
  console.log("[migrate] Mode: dry-run (local validation only, Supabase is never contacted)\n");

  const resourceRows = db.prepare(`SELECT * FROM resources`).all() as Record<string, unknown>[];
  const fileStats = await uploadResourceFiles(null, resourceRows, true);

  const coverStats: FileStats = { uploaded: 0, missing: 0, skipped: 0 };
  for (const table of ["resources", "articles", "books"]) {
    const rows = db.prepare(`SELECT id, cover_image_path FROM ${table}`).all() as {
      id: string;
      cover_image_path: string | null;
    }[];
    for (const row of rows) {
      await migrateCover(null, row.cover_image_path, row.id, true, coverStats);
    }
  }

  console.log("Table counts (source):");
  for (const table of TABLES) {
    const { count } = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as {
      count: number;
    };
    console.log(`  ${table.name}: ${count}`);
  }

  console.log("\nResource PDF files:");
  console.log(`  would upload: ${fileStats.uploaded}`);
  console.log(`  missing locally: ${fileStats.missing}`);

  console.log("\nCover images:");
  console.log(`  would upload: ${coverStats.uploaded}`);
  console.log(`  missing locally: ${coverStats.missing}`);
  console.log(`  already remote (skipped): ${coverStats.skipped}`);

  const supabaseConfigured = Boolean(getSupabaseConfig());
  console.log(
    `\nSupabase credentials present in .env.local: ${supabaseConfigured ? "yes" : "no"} (not contacted in dry-run)`
  );

  if (fileStats.missing > 0 || coverStats.missing > 0) {
    console.warn(
      "\n[migrate] Some local files are missing. A real run would still migrate the row data for them and report the same count — the file itself would not be uploaded."
    );
  }
}

async function runMigrate(db: Database.Database) {
  console.log("[migrate] Mode: migrate (writes to the real Supabase project)\n");
  const supabase = createAdminClient();

  const summary: Record<string, { source: number; migrated: number }> = {};

  for (const table of TABLES) {
    const rows = db.prepare(`SELECT * FROM ${table.name}`).all() as Record<string, unknown>[];
    summary[table.name] = { source: rows.length, migrated: 0 };
    if (rows.length === 0) continue;

    const payload = rows.map((r) => toSupabaseRow(r, table.boolCols));
    try {
      const { error } = await supabase.from(table.name).upsert(payload, { onConflict: "id" });
      if (error) throw new Error(error.message);
      summary[table.name].migrated = rows.length;
    } catch (err) {
      fail(`${table.name}: upsert failed — ${(err as Error).message}`);
    }
  }

  // Files, after row data so the storage objects always have a matching
  // (already-upserted) metadata row.
  const resourceRows = db.prepare(`SELECT id, file_path FROM resources`).all() as Record<
    string,
    unknown
  >[];
  const fileStats = await uploadResourceFiles(supabase, resourceRows, false);

  const coverStats: FileStats = { uploaded: 0, missing: 0, skipped: 0 };
  for (const table of ["resources", "articles", "books"] as const) {
    const rows = db.prepare(`SELECT id, cover_image_path FROM ${table}`).all() as {
      id: string;
      cover_image_path: string | null;
    }[];
    for (const row of rows) {
      const newPath = await migrateCover(supabase, row.cover_image_path, row.id, false, coverStats);
      if (newPath && newPath !== row.cover_image_path) {
        const { error } = await supabase.from(table).update({ cover_image_path: newPath }).eq("id", row.id);
        if (error) fail(`${table}: failed to update migrated cover path for id=${row.id} — ${error.message}`);
      }
    }
  }

  console.log("\nTable migration summary (source rows -> migrated):");
  for (const table of TABLES) {
    const s = summary[table.name];
    console.log(`  ${table.name}: ${s.source} -> ${s.migrated}`);
  }
  console.log("\nResource PDF files:");
  console.log(`  uploaded: ${fileStats.uploaded}`);
  console.log(`  missing locally (skipped): ${fileStats.missing}`);
  console.log("\nCover images:");
  console.log(`  uploaded: ${coverStats.uploaded}`);
  console.log(`  missing locally (skipped): ${coverStats.missing}`);
  console.log(`  already remote (skipped): ${coverStats.skipped}`);
}

async function runVerify(db: Database.Database) {
  console.log("[migrate] Mode: verify (read-only count comparison)\n");
  const supabase = createAdminClient();

  console.log("table                 source  supabase  match");
  console.log("--------------------  ------  --------  -----");
  for (const table of TABLES) {
    const { count: sourceCount } = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as {
      count: number;
    };
    const { count: supabaseCount, error } = await supabase
      .from(table.name)
      .select("*", { count: "exact", head: true });
    if (error) {
      fail(`${table.name}: count query failed — ${error.message}`);
      continue;
    }
    const match = sourceCount === (supabaseCount ?? -1) ? "yes" : "NO";
    if (match === "NO") exitCode = 1;
    console.log(
      `${table.name.padEnd(22)}${String(sourceCount).padEnd(8)}${String(supabaseCount ?? "?").padEnd(10)}${match}`
    );
  }
}

// ---------------------------------------------------------------------

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    fail(`SQLite database not found at ${DB_PATH}.`);
    process.exitCode = 1;
    return;
  }

  if (mode !== "dry-run" && !getSupabaseConfig()) {
    fail(
      "Supabase credentials are missing from .env.local (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY). Run with --dry-run to validate locally without them."
    );
    process.exitCode = 1;
    return;
  }

  // Read-only, and never closed-and-reopened for write — this script
  // cannot modify the source database by construction.
  const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });

  try {
    if (mode === "dry-run") await runDryRun(db);
    else if (mode === "verify") await runVerify(db);
    else await runMigrate(db);
  } finally {
    db.close();
  }

  process.exitCode = exitCode;
}

main().catch((err) => {
  console.error(`[migrate] Unexpected failure: ${(err as Error).message}`);
  process.exitCode = 1;
});
