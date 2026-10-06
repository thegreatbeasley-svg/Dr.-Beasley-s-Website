import Link from "next/link";

export default function FinalCta() {
  return (
    <section className="border-t border-white/10 bg-ink-elevated/30">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-24">
        <h2 className="text-3xl font-medium text-paper sm:text-4xl">Take the next step</h2>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-paper-muted">
          Browse the full collection of guides, articles, and books — or get in touch directly.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/knowledge"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
          >
            Browse the Knowledge Hub
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/30 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-gold transition-colors hover:border-gold/60"
          >
            Get in touch
          </Link>
        </div>
      </div>
    </section>
  );
}
