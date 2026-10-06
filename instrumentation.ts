/**
 * Runs once when the Next.js server starts (dev and prod alike).
 *
 * SQLite mode (default/demo): makes sure the local SQLite database exists
 * and is migrated, then seeds a few demonstration resources on first run
 * only. See lib/db.ts and lib/seed.ts.
 *
 * Supabase mode: does nothing. lib/db.ts (better-sqlite3) and lib/seed.ts
 * are never imported — on Vercel the deployment filesystem is read-only
 * outside /tmp, so even just opening/creating data/app.db there throws
 * (ENOENT: mkdir '/var/task/data'). Nothing in Supabase mode needs local
 * SQLite, so the fix is to never reach these imports at all, not merely
 * to skip calling the functions.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { isSupabaseConfigured } = await import("@/lib/supabase/config");
  if (isSupabaseConfigured()) return;

  const { getDb } = await import("@/lib/db");
  const { seedDatabaseIfEmpty } = await import("@/lib/seed");
  getDb();
  await seedDatabaseIfEmpty();
}
