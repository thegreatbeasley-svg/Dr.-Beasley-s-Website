import { createClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client used ONLY to PUT file bytes straight to
 * Supabase Storage via a short-lived signed upload URL (see
 * lib/resources/storage.ts's createUploadSlot). It holds the publishable
 * key only — the same value already sent to every visitor's browser as
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — which on its own cannot write to
 * either storage bucket. The actual permission for a given upload comes
 * from the single-use token minted server-side, not from this key.
 *
 * Never used for reading or writing any application data — that stays on
 * the server-only, secret-key client in lib/supabase/admin.ts.
 */
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publishableKey) {
      throw new Error("Supabase browser environment variables are missing.");
    }
    client = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
