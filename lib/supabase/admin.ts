import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "./config";

export function createSupabaseAdminClient() {
  const { url, secretKey } = requireSupabaseConfig();
  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("Supabase returned no data.");
  return result.data;
}

/**
 * Same as unwrap(), but null is a legitimate result (e.g. .maybeSingle()
 * finding no row) rather than an error — used for every "get by slug/id,
 * or null if not found" query.
 */
export function unwrapNullable<T>(result: { data: T | null; error: { message: string } | null }): T | null {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
