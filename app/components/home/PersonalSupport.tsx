import Link from "next/link";

/**
 * Conversion section: a gentle invitation to a personal conversation.
 * No booking system is configured, so this routes to the existing
 * /contact form rather than an invented scheduling URL.
 */
export default function PersonalSupport() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-ink-elevated to-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-[640px] -translate-x-1/2 rounded-full bg-tangerine/10 blur-[120px]"
      />
      <div className="relative mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
        <h2 className="text-balance font-display text-3xl font-medium leading-snug text-paper sm:text-4xl">
          Sometimes, Reading Isn&rsquo;t Enough. Sometimes, You Need a Conversation.
        </h2>
        <div className="mx-auto mt-7 max-w-xl space-y-4 text-base leading-relaxed text-paper-muted sm:text-lg">
          <p>Understanding a problem is one thing. Finding your way through it is another.</p>
          <p>
            If you&rsquo;re navigating changes in intimacy, relationships, identity, or life after
            prostate cancer, you don&rsquo;t have to figure everything out alone.
          </p>
          <p>
            Dr. Beasley offers a personal, compassionate space to explore what you&rsquo;re
            experiencing and discover practical ways forward.
          </p>
        </div>
        <div className="mt-9">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-tangerine px-8 py-4 text-center text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
          >
            Schedule a Complimentary Conversation
          </Link>
        </div>
      </div>
    </section>
  );
}
