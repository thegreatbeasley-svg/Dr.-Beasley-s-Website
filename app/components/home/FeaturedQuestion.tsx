import Link from "next/link";
import type { PublishedQuestion } from "@/lib/questions/types";

export default function FeaturedQuestion({ question }: { question: PublishedQuestion | null }) {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-16 sm:py-20 md:grid-cols-2 md:items-center md:gap-16">
        <div className="text-center md:text-left">
          <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">
            A Living Conversation
          </p>
          <h2 className="mt-4 text-balance text-3xl font-medium leading-snug text-paper sm:text-4xl">
            Some Questions Are Too Important to Keep to Yourself.
          </h2>
          <div className="mx-auto mt-5 max-w-md space-y-4 text-base leading-relaxed text-paper-muted md:mx-0">
            <p>
              Life has a way of presenting questions we never expected to ask. About relationships,
              intimacy, aging, identity, purpose, or simply what comes next.
            </p>
            <p>If something is weighing on your mind, ask me.</p>
            <p>
              Your question may be personal, but chances are you&rsquo;re not the only one asking
              it. Every question is reviewed privately. Your question will not be published without
              your explicit permission.
            </p>
          </div>
          <ul className="mx-auto mt-6 max-w-md space-y-2 border-l border-gold/30 pl-4 text-left font-display text-sm italic text-paper-muted/90 md:mx-0">
            <li>&ldquo;Will intimacy ever feel natural again after prostate cancer?&rdquo;</li>
            <li>&ldquo;How do I talk to my partner when I don&rsquo;t know what to say?&rdquo;</li>
            <li>&ldquo;How do I find purpose when life hasn&rsquo;t turned out as expected?&rdquo;</li>
          </ul>
          <div className="mt-8">
            <Link
              href="/questions"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
            >
              Ask Dr. Beasley
            </Link>
            <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-paper-muted/70 md:mx-0">
              Your name and email are never shown publicly. A personal reply isn&rsquo;t
              guaranteed.
            </p>
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
