/**
 * Read-only-by-default audit for the direct-to-Supabase-Storage upload
 * flow (see lib/resources/storage.ts's createUploadSlot/verifyUploadedObject
 * and app/api/admin/resources/*). The only orphan risk that flow cannot
 * fully close is: the browser uploads successfully, then the tab is closed
 * (or the network drops) before the follow-up finalize request reaches our
 * server — leaving a storage object with no resources row pointing at it.
 *
 *   npm run check:orphans              Lists candidate orphans. Deletes
 *                                       nothing. Safe to run any time.
 *   npm run check:orphans -- --delete  Deletes only objects that are BOTH
 *                                       unreferenced by any resources row
 *                                       AND older than the grace period
 *                                       below (so an upload mid-finalize
 *                                       right now is never touched).
 *
 * Only run against the real project (needs DATA_BACKEND=supabase and the
 * three Supabase env vars). Prints object names (server-generated random
 * UUIDs — not PII) and ages only; never row content.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

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

const GRACE_PERIOD_MS = 60 * 60 * 1000; // 1 hour
const shouldDelete = process.argv.includes("--delete");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error("[orphans] ERROR: Supabase env vars are missing. This tool only runs in Supabase mode.");
  process.exit(1);
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false } });

type Bucket = { id: string; referencedPathsColumn: "file_path" | "cover_image_path" };
const BUCKETS: Bucket[] = [
  { id: "resource-files", referencedPathsColumn: "file_path" },
  { id: "cover-images", referencedPathsColumn: "cover_image_path" },
];

async function main() {
  const { data: resources, error: resourcesError } = await supabase
    .from("resources")
    .select("file_path, cover_image_path");
  if (resourcesError) {
    console.error(`[orphans] ERROR: could not read resources table: ${resourcesError.message}`);
    process.exit(1);
  }

  const referencedFilePaths = new Set((resources ?? []).map((r) => r.file_path).filter(Boolean));
  // cover_image_path is stored as a full public URL; an object is
  // referenced if some row's URL ends with "/<objectName>".
  const referencedCoverUrls = (resources ?? [])
    .map((r) => r.cover_image_path)
    .filter((v): v is string => Boolean(v));

  let totalObjects = 0;
  let totalOrphans = 0;
  let totalDeleted = 0;

  for (const bucket of BUCKETS) {
    const { data: objects, error: listError } = await supabase.storage.from(bucket.id).list("", { limit: 1000 });
    if (listError) {
      console.error(`[orphans] ERROR: could not list bucket "${bucket.id}": ${listError.message}`);
      process.exit(1);
    }

    const candidates = (objects ?? []).filter((obj) => {
      const isReferenced =
        bucket.id === "resource-files"
          ? referencedFilePaths.has(obj.name)
          : referencedCoverUrls.some((u) => u.endsWith(`/${obj.name}`));
      return !isReferenced;
    });

    const now = Date.now();
    const orphans = candidates.filter((obj) => {
      const createdAt = obj.created_at ? new Date(obj.created_at).getTime() : 0;
      return now - createdAt > GRACE_PERIOD_MS;
    });

    totalObjects += objects?.length ?? 0;
    totalOrphans += orphans.length;

    console.log(`[orphans] ${bucket.id}: ${objects?.length ?? 0} objects, ${orphans.length} orphan candidate(s)`);
    for (const obj of orphans) {
      const ageMinutes = obj.created_at ? Math.round((now - new Date(obj.created_at).getTime()) / 60000) : -1;
      console.log(`  - ${obj.name} (age ~${ageMinutes}min)`);
    }

    if (shouldDelete && orphans.length > 0) {
      const { error: removeError } = await supabase.storage.from(bucket.id).remove(orphans.map((o) => o.name));
      if (removeError) {
        console.error(`[orphans] ERROR: could not delete orphans in "${bucket.id}": ${removeError.message}`);
        process.exit(1);
      }
      totalDeleted += orphans.length;
      console.log(`[orphans] Deleted ${orphans.length} object(s) from "${bucket.id}".`);
    }
  }

  console.log(
    `[orphans] Summary: ${totalObjects} total objects, ${totalOrphans} orphan candidate(s)` +
      (shouldDelete ? `, ${totalDeleted} deleted.` : ". Re-run with --delete to remove them.")
  );
}

main();
