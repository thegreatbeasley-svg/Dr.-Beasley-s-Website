import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/session";
import { listEnquiriesAdmin } from "@/lib/contact/queries";
import { toCsv } from "@/lib/csv";

export async function GET() {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enquiries = listEnquiriesAdmin();
  const csv = toCsv(
    ["Name", "Email", "Topic", "Message", "Received"],
    enquiries.map((e) => [e.name, e.email, e.topic, e.message, e.created_at])
  );

  const fileName = `enquiries-export-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
