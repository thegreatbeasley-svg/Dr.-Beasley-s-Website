import Link from "next/link";

export default function FinalCta() {
  return (
    <section className="bg-ink-elevated/30">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
        <h2 className="font-display text-3xl font-medium text-paper sm:text-4xl">
          A life well lived is never a finished work.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-paper-muted">
          Continue exploring, follow a question or return whenever you are ready to see what might
          be possible next.
        </p>
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
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  );
}
