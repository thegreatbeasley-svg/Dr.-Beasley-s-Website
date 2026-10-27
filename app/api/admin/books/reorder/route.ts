import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/session";
import { reorderBooks, ReorderError } from "@/lib/books/queries";

/** Body: { ids: string[] } — every book id, in the new display order. */
export async function POST(req: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const ids = body.ids;
  if (!Array.isArray(ids) || ids.length > 500 || !ids.every((id) => typeof id === "string" && id.length <= 100)) {
    return NextResponse.json({ error: "ids must be a list of book ids." }, { status: 400 });
  }

  try {
    await reorderBooks(ids as string[]);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ReorderError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not save the new order." }, { status: 500 });
  }
}
