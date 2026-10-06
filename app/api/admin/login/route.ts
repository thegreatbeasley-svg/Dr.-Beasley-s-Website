import { NextResponse } from "next/server";
import { verifyAdminCredentials, createAdminSession, isAdminEmailAllowed } from "@/lib/admin/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseSessionClient } from "@/lib/supabase/server-auth";
import { clean } from "@/lib/validation";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    const email = clean(body.email, 320);
    const password = clean(body.password, 200);
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const supabase = await createSupabaseSessionClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    // A valid Supabase account is not enough on its own — immediately
    // undo the session if this email isn't on the explicit allowlist, so
    // no authenticated-but-unauthorized cookie is ever left behind.
    if (!isAdminEmailAllowed(data.user.email)) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "This account isn't authorized for admin access." }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  }

  const username = clean(body.username, 200);
  const password = clean(body.password, 200);

  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ success: true });
}
