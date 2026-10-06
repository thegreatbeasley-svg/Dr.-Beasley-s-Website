import "server-only";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { DATA_DIR, DB_PATH, RESOURCE_FILES_DIR, COVER_UPLOADS_DIR } from "@/lib/paths";

/**
 * A single local SQLite database is the entire persistence layer for this
 * demo: resources, leads, resource requests and admin sessions all live
 * here so everything survives a restart with zero external services.
 *
 * Swapping this file's connection for a hosted Postgres/MySQL client (or
 * an ORM pointed at one) is the whole migration path to a real database —
 * every query in lib/resources and lib/admin goes through `getDb()`.
 */

declare global {
   
  var __beaslyDb: Database.Database | undefined;
}

function migrate(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      short_description TEXT NOT NULL,
      long_description TEXT,
      resource_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      cover_image_path TEXT,
      is_demo_content INTEGER NOT NULL DEFAULT 1,
      published INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT,
      email TEXT NOT NULL UNIQUE,
      updates_opt_in INTEGER NOT NULL DEFAULT 0,
      updates_opt_in_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resource_requests (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id),
      resource_id TEXT NOT NULL REFERENCES resources(id),
      opted_in_this_request INTEGER NOT NULL DEFAULT 0,
      requested_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    -- Knowledge Hub: on-page long-form content (not a gated download, unlike
    -- resources). Topic/content_type power the hub's filters.
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      short_description TEXT NOT NULL,
      body TEXT NOT NULL,
      topic TEXT,
      content_type TEXT NOT NULL DEFAULT 'article',
      cover_image_path TEXT,
      is_demo_content INTEGER NOT NULL DEFAULT 1,
      published INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Reader-submitted questions. status starts 'pending' and only ever
    -- becomes publicly visible once an admin sets it to 'published' —
    -- there is no auto-publish path anywhere in the app.
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      question_text TEXT NOT NULL,
      submitter_name TEXT,
      submitter_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      answer_body TEXT,
      slug TEXT UNIQUE,
      created_at TEXT NOT NULL,
      answered_at TEXT
    );

    -- Books & Body of Work. price_cents/stripe_price_id are reserved for a
    -- later payments phase and are unused for now (info + CTA only).
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      kind TEXT NOT NULL DEFAULT 'book',
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      cta_label TEXT,
      cta_url TEXT,
      cover_image_path TEXT,
      price_cents INTEGER,
      stripe_price_id TEXT,
      published INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Related initiatives. relationship_note deliberately defaults to a
    -- draft placeholder — never auto-filled with an assumed description.
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      relationship_note TEXT NOT NULL DEFAULT 'Draft — relationship to be confirmed.',
      description TEXT,
      url TEXT,
      logo_path TEXT,
      published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Contact form submissions. Admin-viewable only, same local-storage
    -- model as leads.
    CREATE TABLE IF NOT EXISTS contact_enquiries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      topic TEXT NOT NULL DEFAULT 'general',
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_resource_requests_resource ON resource_requests(resource_id);
    CREATE INDEX IF NOT EXISTS idx_resource_requests_lead ON resource_requests(lead_id);
    CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
  `);
}

function ensureDirectories() {
  for (const dir of [DATA_DIR, RESOURCE_FILES_DIR, COVER_UPLOADS_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function openDb() {
  ensureDirectories();
  const db = new Database(DB_PATH);
  migrate(db);
  return db;
}

export function getDb(): Database.Database {
  if (!global.__beaslyDb) {
    global.__beaslyDb = openDb();
  }
  return global.__beaslyDb;
}

export function resolveResourceFilePath(fileName: string) {
  return path.join(RESOURCE_FILES_DIR, fileName);
}
