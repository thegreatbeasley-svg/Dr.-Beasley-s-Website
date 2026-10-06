import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";

/**
 * Demo-grade admin auth: a single allow-listed username/password from env
 * vars, backed by an opaque server-side session token stored in SQLite and
 * handed to the browser as an httpOnly cookie.
 *
 * This intentionally has NO real user system, password hashing at rest, or
 * account recovery — see README.md "Production work remaining" for what a
 * real deployment needs instead (proper hashed credentials or a hosted
 * auth provider, HTTPS-only cookies, rate limiting, etc).
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

export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME ?? "";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!expectedUsername || !expectedPassword) return false;
  return (
    timingSafeStringEqual(username, expectedUsername) &&
    timingSafeStringEqual(password, expectedPassword)
  );
}

function pruneExpiredSessions() {
  getDb().prepare(`DELETE FROM admin_sessions WHERE expires_at < ?`).run(new Date().toISOString());
}

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
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    getDb().prepare(`DELETE FROM admin_sessions WHERE token = ?`).run(token);
  }
  cookieStore.delete(COOKIE_NAME);
}

/** True server-side check: looks the cookie's token up in SQLite every time. */
export async function isAdminAuthenticated(): Promise<boolean> {
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
