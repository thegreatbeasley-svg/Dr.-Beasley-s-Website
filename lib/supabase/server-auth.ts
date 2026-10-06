import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { requireSupabaseConfig } from "./config";

/**
 * Cookie-bound Supabase client using the PUBLISHABLE key — this is the
 * visitor's own session (the signed-in admin), not a privileged client.
 * It is used only to manage the admin's login session via Supabase Auth;
 * every actual content read/write still goes through the separate
 * service-role client in ./admin.ts. The secret key never touches this
 * file or the browser.
 */
export async function createSupabaseSessionClient() {
  const { url, publishableKey } = requireSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component that can't set cookies — safe to
          // ignore as long as proxy.ts is also refreshing the session.
        }
      },
    },
  });
}
