import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseSessionClient } from "@/lib/supabase/server-auth";

/**
 * Two admin auth modes, selected by isSupabaseConfigured():
 *
 * - SQLite (default/demo): a single allow-listed username/password from env
 *   vars, backed by an opaque server-side session token stored in SQLite and
 *   handed to the browser as an httpOnly cookie. No real user system,
 *   password hashing at rest, or account recovery — demo-grade by design.
 *
 * - Supabase: real Supabase Auth (email/password), session held in
 *   httpOnly cookies managed by @supabase/ssr (see lib/supabase/
 *   server-auth.ts + proxy.ts for the refresh side). Access is further
 *   restricted to a single allow-listed ADMIN_EMAIL — a valid Supabase
 *   account alone is not enough.
 *
 * Every exported function keeps the same signature regardless of mode, so
 * no call site (admin pages, API routes) needs to know which is active.
 */

const COOKIE_NAME = "beasly_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function timingSafeStringEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still run a comparison of equal length to avoid an obvious
    // early-exit timing signal on length alone.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/** SQLite-mode login only — Supabase mode authenticates via signInWithPassword instead. */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME ?? "";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!expectedUsername || !expectedPassword) return false;
  return (
    timingSafeStringEqual(username, expectedUsername) &&
    timingSafeStringEqual(password, expectedPassword)
  );
}

/**
 * Supabase-mode allowlist: a valid Supabase Auth session is necessary but
 * not sufficient — the signed-in email must also match ADMIN_EMAIL
 * (comma-separated for more than one address), checked case-insensitively.
 */
export function isAdminEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowlist.length === 0) return false;
  return allowlist.includes(email.toLowerCase());
}

function pruneExpiredSessions() {
  getDb().prepare(`DELETE FROM admin_sessions WHERE expires_at < ?`).run(new Date().toISOString());
}

/** SQLite-mode only — call after verifyAdminCredentials() succeeds. */
export async function createAdminSession(): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  pruneExpiredSessions();
  getDb()
    .prepare(`INSERT INTO admin_sessions (token, created_at, expires_at) VALUES (?, ?, ?)`)
    .run(token, now.toISOString(), expiresAt.toISOString());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // demo runs on plain http://localhost
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroyAdminSession() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseSessionClient();
    await supabase.auth.signOut();
    return;
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    getDb().prepare(`DELETE FROM admin_sessions WHERE token = ?`).run(token);
  }
  cookieStore.delete(COOKIE_NAME);
}

/** True server-side check, re-verified on every call — never trusts the client. */
export async function isAdminAuthenticated(): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return isAdminEmailAllowed(user?.email);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const row = getDb()
    .prepare(`SELECT expires_at FROM admin_sessions WHERE token = ?`)
    .get(token) as { expires_at: string } | undefined;

  if (!row) return false;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    getDb().prepare(`DELETE FROM admin_sessions WHERE token = ?`).run(token);
    return false;
  }
  return true;
}

/** Server Component / layout guard. */
export async function requireAdminPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin");
}

/** Route handler guard — returns true/false instead of redirecting. */
export async function requireAdminApi(): Promise<boolean> {
  return isAdminAuthenticated();
}
