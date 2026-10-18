import Link from "next/link";

/**
 * First-person introduction directly beneath the hero. Deliberately
 * editorial rather than a credentials block — short measure, generous
 * leading and a slightly lifted background to separate it from the hero.
 */
export default function Manifesto() {
  return (
    <section className="border-b border-white/10 bg-ink-elevated/50">
      <div className="mx-auto max-w-2xl px-6 py-16 text-center sm:py-20">
        <h2 className="text-balance font-display text-3xl font-medium leading-snug text-paper sm:text-4xl">
          I&rsquo;ve Spent a Lifetime Studying What Makes Life Worth Living.
        </h2>
        <p className="mt-8 text-lg leading-relaxed text-paper-muted">
          As a psychologist, I&rsquo;ve spent decades exploring how people think, connect, struggle,
          and grow. As an entrepreneur, I&rsquo;ve experienced the challenges of building something
          meaningful. And as a prostate cancer survivor, I&rsquo;ve learned firsthand that surviving
          a difficult chapter and learning to live fully afterward are two very different things.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-paper">
          These experiences have shaped one conviction: whatever life brings, there is always
          something more to discover, create, or become.
        </p>
        <Link
          href="/about"
          className="mt-9 inline-block text-sm font-semibold uppercase tracking-widest text-gold underline-offset-4 hover:underline"
        >
          Discover My Story →
        </Link>
      </div>
    </section>
  );
}
