import { NextResponse } from "next/server";
import { verifyAdminCredentials, createAdminSession } from "@/lib/admin/session";
import { clean } from "@/lib/validation";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const username = clean(body.username, 200);
  const password = clean(body.password, 200);

  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ success: true });
}
