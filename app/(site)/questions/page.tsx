import Link from "next/link";
import { listPublishedQuestions } from "@/lib/questions/queries";
import QuestionSubmitForm from "@/app/components/questions/QuestionSubmitForm";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Questions & Answers — Dr. Virgil Beasley",
  description:
    "Ask Dr. Virgil Beasley a question about intimacy, relationships, prostate cancer recovery, aging or purposeful living, and explore the questions shared here.",
  path: "/questions",
});

const STEPS = [
  {
    number: "01",
    title: "Ask Your Question",
    body: "Share what\u2019s on your mind. Whether it\u2019s about intimacy, relationships, confidence, aging, or life\u2019s unexpected changes, your question begins privately.",
  },
  {
    number: "02",
    title: "Explore the Possibilities",
    body: "Your question is reviewed. You may discover that a similar question has already been explored, or your experience may bring something new to the conversation.",
  },
  {
    number: "03",
    title: "Help Someone Else",
    body: "Your question may help others navigating similar experiences. With your explicit permission, selected questions and answers may become part of our growing community knowledge library.",
  },
];

const primaryButton =
  "inline-flex items-center justify-center rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover";
const secondaryButton =
  "inline-flex items-center justify-center rounded-full border border-gold/30 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-gold transition-colors hover:border-gold/60";

export default async function QuestionsPage() {
  const questions = await listPublishedQuestions();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full bg-tangerine/15 blur-[140px]"
        />
        <div className="relative mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">
            Questions &amp; Answers
          </p>
          <h1 className="mt-5 text-balance text-4xl font-medium leading-[1.1] text-paper sm:text-5xl">
            Your Question Could Help Someone Else Find Their Answer.
          </h1>
          <div className="mx-auto mt-6 max-w-xl space-y-4 text-base leading-relaxed text-paper-muted sm:text-lg">
            <p>
              Sometimes the questions we hesitate to ask are the very ones others are struggling
              with, too.
            </p>
            <p>
              Whether you&rsquo;re navigating intimacy after prostate cancer, rebuilding a
              relationship, finding purpose, or simply wondering what comes next, you&rsquo;re
              welcome to ask Dr. Beasley.
            </p>
            <p className="text-paper">Every meaningful conversation begins with a question.</p>
          </div>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a href="#ask" className={primaryButton}>
              Ask Dr. Beasley
            </a>
            <a href="#questions" className={secondaryButton}>
              Explore the Questions
            </a>
          </div>
        </div>
      </section>

      {/* A shared journey */}
      <section className="border-b border-white/10 bg-ink-elevated/50">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center sm:py-20">
          <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">
            A Shared Journey
          </p>
          <h2 className="mt-4 text-balance text-3xl font-medium leading-snug text-paper sm:text-4xl">
            One Question. A Conversation. Something Worth Sharing.
          </h2>
          <div className="mt-7 space-y-4 text-base leading-relaxed text-paper-muted sm:text-lg">
            <p>
              Life has a way of presenting challenges we never expected. Sometimes we find answers
              in books or articles. Other times, we need to ask a question that feels deeply
              personal.
            </p>
            <p>
              Dr. Beasley believes that sharing our experiences can help others feel less alone.
              That&rsquo;s why this space exists.
            </p>
            <p>
              Questions begin privately. Some may lead to existing resources, while others may
              inspire new conversations and answers.
            </p>
            <p>
              And when someone chooses to share their experience, their question may help another
              person find clarity, reassurance, or a different way forward. Over time, these
              contributions can become a growing collection of real questions and thoughtful
              answers.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-center text-3xl font-medium text-paper sm:text-4xl">How It Works</h2>
          <ol className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step) => (
              <li key={step.number} className="border-t border-gold/30 pt-5">
                <span className="font-display text-sm text-gold/80">{step.number}</span>
                <h3 className="mt-2 text-xl font-medium text-paper">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-paper-muted">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-12 max-w-xl text-center text-sm leading-relaxed text-paper-muted">
            Every question is reviewed privately. Your question will not be published without your explicit permission.
          </p>
        </div>
      </section>

      {/* Public collection */}
      <section id="questions" className="scroll-mt-20 border-b border-white/10">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">
              Community Questions
            </p>
            <h2 className="mt-4 text-balance text-3xl font-medium text-paper sm:text-4xl">
              Questions Worth Exploring Together.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-paper-muted">
              Every question represents a real experience, a moment of uncertainty, or a desire to
              understand something more deeply. Explore the conversations that have been shared
              here.
            </p>
          </div>

          <div className="mt-10">
            {questions.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-ink-elevated p-8 text-center">
                <h3 className="font-display text-2xl text-paper">Every Conversation Has a Beginning.</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-paper-muted">
                  This collection is just getting started. Your question could help shape the
                  conversations that follow.
                </p>
                <a href="#ask" className={`${primaryButton} mt-6`}>
                  Ask a Question
                </a>
              </div>
            ) : (
              <ul className="space-y-4">
                {questions.map((q) => (
                  <li key={q.id}>
                    <Link
                      href={`/questions/${q.slug}`}
                      className="block rounded-2xl border border-white/10 bg-ink-elevated p-6 transition-colors hover:border-gold/40"
                    >
                      <h3 className="text-lg font-medium text-paper">{q.question_text}</h3>
                      {q.answer_body && (
                        <p className="mt-2 line-clamp-2 text-sm text-paper-muted">{q.answer_body}</p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Submission */}
      <section id="ask" className="scroll-mt-20 bg-ink-elevated/30">
        <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">
              Start a Conversation
            </p>
            <h2 className="mt-4 text-3xl font-medium text-paper sm:text-4xl">
              What&rsquo;s On Your Mind?
            </h2>
            <div className="mx-auto mt-5 max-w-lg space-y-3 text-base leading-relaxed text-paper-muted">
              <p>
                You don&rsquo;t need to have the perfect words or know exactly what you&rsquo;re
                looking for. Sometimes simply putting a question into words is the beginning of
                finding a way forward.
              </p>
              <p className="text-paper">Share what&rsquo;s on your mind with Dr. Beasley.</p>
            </div>
          </div>
          <div className="mt-10">
            <QuestionSubmitForm />
          </div>
        </div>
      </section>
    </>
  );
}
