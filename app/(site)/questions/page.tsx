import Link from "next/link";
import { listPublishedQuestions } from "@/lib/questions/queries";
import QuestionSubmitForm from "@/app/components/questions/QuestionSubmitForm";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Questions & Answers — Dr. Virgil Beasly",
  description: "Reader-submitted questions, answered and published here over time.",
  path: "/questions",
});

export default function QuestionsPage() {
  const questions = listPublishedQuestions();

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">Questions &amp; Answers</p>
        <h1 className="mt-5 text-3xl font-medium text-paper sm:text-4xl">Ask, and find answers here</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-paper-muted">
          A growing, public record of reader questions and their answers. Submit a question below —
          it&rsquo;s reviewed before anything is published.
        </p>
      </div>

      <div className="mt-14">
        {questions.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-ink-elevated p-6 text-center text-paper-muted">
            No questions have been published yet. Be the first to ask one below.
          </p>
        ) : (
          <ul className="space-y-4">
            {questions.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/questions/${q.slug}`}
                  className="block rounded-2xl border border-white/10 bg-ink-elevated p-6 transition-colors hover:border-gold/40"
                >
                  <h2 className="text-lg font-medium text-paper">{q.question_text}</h2>
                  {q.answer_body && (
                    <p className="mt-2 line-clamp-2 text-sm text-paper-muted">{q.answer_body}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-14">
        <QuestionSubmitForm />
      </div>
    </div>
  );
}
