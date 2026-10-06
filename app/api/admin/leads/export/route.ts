import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/session";
import { listLeadsAdmin } from "@/lib/resources/queries";
import { toCsv } from "@/lib/csv";

export async function GET() {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await listLeadsAdmin();
  const csv = toCsv(
    ["Name", "City", "Email", "Updates opt-in", "Requested resources", "First seen", "Last updated"],
    leads.map((lead) => [
      lead.name,
      lead.city ?? "",
      lead.email,
      lead.updates_opt_in ? "Yes" : "No",
      lead.requests.map((r) => r.resource_title).join("; "),
      lead.created_at,
      lead.updated_at,
    ])
  );

  const fileName = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
