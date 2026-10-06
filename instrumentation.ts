/**
 * Runs once when the Next.js server starts (dev and prod alike): makes
 * sure the local SQLite database exists and migrated, then seeds a few
 * demonstration resources on first run only. See lib/db.ts and lib/seed.ts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getDb } = await import("@/lib/db");
    const { seedDatabaseIfEmpty } = await import("@/lib/seed");
    getDb();
    await seedDatabaseIfEmpty();
  }
}
