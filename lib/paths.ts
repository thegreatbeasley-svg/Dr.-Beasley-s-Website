import path from "node:path";

/**
 * Central place for every local-storage path this demo touches. Nothing
 * here is committed to version control (see .gitignore) and nothing here
 * is served directly from /public — gated files go through a controlled
 * route handler instead (see app/api/resources/download).
 */
export const DATA_DIR = path.join(process.cwd(), "data");
export const DB_PATH = path.join(DATA_DIR, "app.db");

// Gated resource PDFs. Never exposed under /public.
export const RESOURCE_FILES_DIR = path.join(process.cwd(), "private-storage", "resources");

// Admin-uploaded cover images. Not sensitive, but still not committed —
// served from /public/uploads/covers at runtime.
export const COVER_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "covers");
export const COVER_PUBLIC_PREFIX = "/uploads/covers";
