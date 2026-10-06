import { listEnquiriesAdmin } from "@/lib/contact/queries";
import { ENQUIRY_TOPIC_LABELS, type EnquiryTopic } from "@/lib/contact/types";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminEnquiriesPage() {
  const enquiries = listEnquiriesAdmin();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-paper">Contact enquiries</h1>
          <p className="mt-1 text-sm text-paper-muted">
            {enquiries.length} enquir{enquiries.length === 1 ? "y" : "ies"} submitted via the
            Contact page.
          </p>
        </div>
        <a
          href="/api/admin/enquiries/export"
          className="rounded-full bg-tangerine px-5 py-3 text-xs font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
        >
          Export CSV
        </a>
      </div>

      {enquiries.length === 0 ? (
        <p className="text-paper-muted">No enquiries yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-ink-elevated text-xs uppercase tracking-wider text-paper-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Topic</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {enquiries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-paper">{e.name}</td>
                  <td className="px-4 py-3 text-paper-muted">{e.email}</td>
                  <td className="px-4 py-3 text-paper-muted">
                    {ENQUIRY_TOPIC_LABELS[e.topic as EnquiryTopic] ?? e.topic}
                  </td>
                  <td className="max-w-sm px-4 py-3 text-paper-muted">
                    <span className="line-clamp-2">{e.message}</span>
                  </td>
                  <td className="px-4 py-3 text-paper-muted">{formatDate(e.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
