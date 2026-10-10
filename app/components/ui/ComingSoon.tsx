import Link from "next/link";

type Props = {
  title: string;
  message: string;
  ctaHref: string;
  ctaLabel: string;
};

/**
 * Shown on a public listing page only when the live published dataset is
 * empty. Purely presentational — it never reads or implies any content.
 */
export default function ComingSoon({ title, message, ctaHref, ctaLabel }: Props) {
  return (
    <section
      aria-labelledby="coming-soon-heading"
      className="mx-auto mt-14 max-w-2xl rounded-3xl border border-gold/30 bg-ink-elevated px-6 py-14 text-center sm:px-12 sm:py-16"
    >
      <div aria-hidden className="mx-auto mb-6 h-px w-16 bg-gold/60" />
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-tangerine">Coming soon</p>
      <h2 id="coming-soon-heading" className="mt-5 text-2xl font-medium text-paper sm:text-3xl">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-paper-muted">{message}</p>
      <Link
        href={ctaHref}
        className="mt-8 inline-block rounded-full border border-gold/50 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gold transition-colors hover:border-gold hover:bg-gold/10"
      >
        {ctaLabel}
      </Link>
    </section>
  );
}
