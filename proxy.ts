import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase Auth session cookie on admin requests so it
 * doesn't silently expire mid-session. This is an *optimistic* check only
 * (per both Next's and Supabase's guidance) — it never makes an
 * authorization decision itself. The real, authoritative check happens
 * server-side on every protected page/route via lib/admin/session.ts.
 *
 * A no-op entirely in SQLite mode (no Supabase env vars configured) or if
 * DATA_BACKEND isn't "supabase" — the local demo login never touches this.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (process.env.DATA_BACKEND !== "supabase" || !url || !publishableKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Triggers a silent token refresh (and cookie rewrite above) if needed.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
