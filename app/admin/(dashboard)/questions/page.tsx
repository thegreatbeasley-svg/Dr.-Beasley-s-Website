import Link from "next/link";
import { listAllQuestionsAdmin, getQuestionStats } from "@/lib/questions/queries";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const STATUS_STYLES: Record<string, string> = {
  pending: "border border-white/20 text-paper-muted",
  published: "bg-tangerine text-tangerine-ink",
  rejected: "border border-tangerine-hover/60 text-tangerine-hover",
};

export default async function AdminQuestionsPage() {
  const [questions, stats] = await Promise.all([listAllQuestionsAdmin(), getQuestionStats()]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-paper">Questions</h1>
        <p className="mt-1 text-sm text-paper-muted">
          {stats.pending} pending · {stats.published} published · {stats.rejected} rejected.
          Nothing is published automatically — write an answer and set status to Published.
        </p>
      </div>

      {questions.length === 0 ? (
        <p className="text-paper-muted">No questions submitted yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-ink-elevated text-xs uppercase tracking-wider text-paper-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Question</th>
                <th className="px-4 py-3 font-medium">Submitted by</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {questions.map((q) => (
                <tr key={q.id}>
                  <td className="max-w-sm px-4 py-3 text-paper">
                    <span className="line-clamp-2">{q.question_text}</span>
                  </td>
                  <td className="px-4 py-3 text-paper-muted">
                    {q.submitter_name || "—"}
                    <div className="text-xs">{q.submitter_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${STATUS_STYLES[q.status] ?? "border border-white/20 text-paper-muted"}`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-paper-muted">{formatDate(q.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/questions/${q.id}`} className="text-gold underline-offset-4 hover:underline">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
