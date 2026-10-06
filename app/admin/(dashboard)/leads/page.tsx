import { listLeadsAdmin, getLeadStats } from "@/lib/resources/queries";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminLeadsPage() {
  const [leads, stats] = await Promise.all([listLeadsAdmin(), getLeadStats()]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-paper">Leads</h1>
          <p className="mt-1 text-sm text-paper-muted">
            {stats.totalLeads} lead{stats.totalLeads === 1 ? "" : "s"} · {stats.totalRequests}{" "}
            request{stats.totalRequests === 1 ? "" : "s"} · {stats.optIns} opted in to updates
          </p>
        </div>
        <a
          href="/api/admin/leads/export"
          className="rounded-full bg-tangerine px-5 py-3 text-xs font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
        >
          Export CSV
        </a>
      </div>

      {leads.length === 0 ? (
        <p className="text-paper-muted">No leads yet. Requests submitted on the public site will appear here.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-ink-elevated text-xs uppercase tracking-wider text-paper-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Updates</th>
                <th className="px-4 py-3 font-medium">Requested resources</th>
                <th className="px-4 py-3 font-medium">First seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-4 py-3 text-paper">{lead.name}</td>
                  <td className="px-4 py-3 text-paper-muted">{lead.city || "—"}</td>
                  <td className="px-4 py-3 text-paper-muted">{lead.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                        lead.updates_opt_in
                          ? "border border-gold text-gold"
                          : "border border-white/20 text-paper-muted"
                      }`}
                    >
                      {lead.updates_opt_in ? "Opted in" : "Not opted in"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-paper-muted">
                    {lead.requests.map((r) => r.resource_title).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-paper-muted">{formatDate(lead.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
