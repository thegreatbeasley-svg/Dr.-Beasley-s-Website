import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createUploadSlot, UploadError } from "@/lib/resources/storage";

/**
 * Mints a short-lived, single-use Supabase Storage signed upload URL so
 * the browser can upload a resource PDF or cover image directly to
 * storage — bypassing Vercel's 4.5MB serverless function request-body
 * limit entirely, since the file bytes never pass through this route.
 *
 * The bucket, storage path, permitted MIME types, and byte ceiling are
 * all chosen server-side from `kind`; the client only says which kind of
 * file it's about to upload. SQLite mode has no such platform limit and
 * never calls this route — the admin form keeps using its existing
 * direct multipart upload there.
 */
export async function POST(req: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Direct upload is only available in Supabase mode." }, { status: 400 });
  }

  let body: { kind?: unknown; contentType?: unknown; size?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const kind = typeof body.kind === "string" ? body.kind : "";
  const contentType = typeof body.contentType === "string" ? body.contentType : "";
  const size = typeof body.size === "number" ? body.size : NaN;

  try {
    const slot = await createUploadSlot(kind, contentType, size);
    return NextResponse.json({ success: true, ...slot });
  } catch (error) {
    const message = error instanceof UploadError ? error.message : "Could not prepare the upload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
