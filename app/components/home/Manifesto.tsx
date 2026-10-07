import Link from "next/link";

/**
 * The philosophical foundation of the site, not an "About" summary — the
 * approved manifesto copy, rendered deliberately (short line length, a
 * highlighted closing clause) so it reads as a statement of intent rather
 * than a biography paragraph. See /about for the fuller story.
 */
export default function Manifesto() {
  return (
    <section className="border-b border-white/10 bg-ink-elevated/40">
      <div className="mx-auto max-w-2xl px-6 py-24 text-center sm:py-28">
        <p className="font-display text-xl leading-relaxed text-paper sm:text-2xl">
          Dr. Virgil Beasly has devoted his life to helping people live more fully
          <span className="text-paper-muted">
            —through deeper intimacy, greater self-understanding, meaningful enterprise and a
            belief that growing older should open possibilities, not close them.
          </span>
        </p>
        <p className="mt-8 font-display text-xl leading-relaxed text-paper-muted sm:text-2xl">
          As a psychologist, entrepreneur, prostate cancer survivor and cultivator, his work asks a
          defining question:{" "}
          <span className="text-gold">not simply how life is, but what it could become.</span>
        </p>
        <Link
          href="/about"
          className="mt-10 inline-block text-sm font-medium text-gold underline-offset-4 hover:underline"
        >
          Discover his story →
        </Link>
      </div>
    </section>
  );
}
