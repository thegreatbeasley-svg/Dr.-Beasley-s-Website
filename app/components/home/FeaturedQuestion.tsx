import Link from "next/link";
import type { PublishedQuestion } from "@/lib/questions/types";

export default function FeaturedQuestion({ question }: { question: PublishedQuestion | null }) {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-20 sm:py-24 md:grid-cols-2 md:items-center md:gap-16">
        <div className="text-center md:text-left">
          <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">
            A Living Conversation
          </p>
          <h2 className="mt-4 text-3xl font-medium leading-snug text-paper sm:text-4xl">
            Every meaningful answer begins with a better question.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-paper-muted md:mx-0">
            Ask Dr. Beasly a question about intimacy, resilience, wellbeing, purposeful living or
            the possibilities that come with change. Selected questions may become part of the
            public collection, allowing one person&rsquo;s curiosity to help many others.
          </p>
          <div className="mt-8">
            <Link
              href="/questions"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
            >
              Ask Dr. Beasly
            </Link>
          </div>
        </div>

        {question && (
          <div className="rounded-2xl border border-white/10 bg-ink-elevated p-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">
              A question, answered
            </p>
            <h3 className="mt-4 text-xl font-medium leading-snug text-paper">
              {question.question_text}
            </h3>
            {question.answer_body && (
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-paper-muted">
                {question.answer_body}
              </p>
            )}
            <Link
              href={`/questions/${question.slug}`}
              className="mt-5 inline-block text-sm font-medium text-gold underline-offset-4 hover:underline"
            >
              Read the full answer →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
