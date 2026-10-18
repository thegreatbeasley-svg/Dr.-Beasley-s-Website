import Link from "next/link";

export default function FinalCta() {
  return (
    <section className="bg-ink-elevated/30">
      <div className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
        <h2 className="font-display text-3xl font-medium text-paper sm:text-4xl">
          A life well lived is never a finished work.
        </h2>
        <div className="mx-auto mt-6 max-w-xl space-y-4 text-base leading-relaxed text-paper-muted sm:text-lg">
          <p>
            Whatever brought you here&mdash;a question, a challenge, a moment of uncertainty, or
            simply curiosity&mdash;I hope you&rsquo;ve found something worth exploring.
          </p>
          <p>
            Life continues to offer possibilities, even when it takes us somewhere unexpected.
          </p>
          <p className="text-paper">The next chapter is still yours to write.</p>
        </div>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/knowledge"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
          >
            Explore the Knowledge Hub
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/30 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-gold transition-colors hover:border-gold/60"
          >
            Start a Conversation
          </Link>
        </div>
      </div>
    </section>
  );
}
