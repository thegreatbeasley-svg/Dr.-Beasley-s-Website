import Link from "next/link";
import type { PublishedQuestion } from "@/lib/questions/types";

export default function FeaturedQuestion({ question }: { question: PublishedQuestion | null }) {
  return (
    <section className="border-t border-white/10 bg-ink-elevated/30">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-24">
        <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">Questions &amp; Answers</p>
        {question ? (
          <>
            <h2 className="mt-5 text-2xl font-medium text-paper sm:text-3xl">{question.question_text}</h2>
            {question.answer_body && (
              <p className="mx-auto mt-4 line-clamp-3 max-w-xl text-base leading-relaxed text-paper-muted">
                {question.answer_body}
              </p>
            )}
            <Link
              href={`/questions/${question.slug}`}
              className="mt-6 inline-block text-sm font-medium text-gold underline-offset-4 hover:underline"
            >
              Read the full answer →
            </Link>
          </>
        ) : (
          <>
            <h2 className="mt-5 text-2xl font-medium text-paper sm:text-3xl">Reader questions, answered</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-paper-muted">
              Published questions and answers will appear here. Have one of your own?
            </p>
          </>
        )}
        <div className="mt-6">
          <Link
            href="/questions"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/30 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gold transition-colors hover:border-gold/60"
          >
            Ask a question
          </Link>
        </div>
      </div>
    </section>
  );
}
