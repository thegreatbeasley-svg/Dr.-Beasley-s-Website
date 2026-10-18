import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      {/* Soft ambient glow — decorative only, hidden from assistive tech. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-10%] h-[520px] w-[520px] rounded-full bg-tangerine/20 blur-[140px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-[-10%] h-[420px] w-[420px] rounded-full bg-gold/10 blur-[130px]"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 py-16 sm:py-20 md:flex-row md:items-center md:gap-16 md:py-24">
        <div className="flex-1 text-center md:text-left">
          <span aria-hidden="true" className="mx-auto block h-px w-12 bg-gold md:mx-0" />
          <p className="mt-5 text-xs font-semibold tracking-[0.35em] text-gold uppercase">
            Dr. Virgil Beasley
          </p>
          <h1 className="mt-6 text-balance text-4xl font-medium leading-[1.1] text-paper sm:text-5xl md:text-6xl">
            Life Doesn&rsquo;t End When Everything Changes.
          </h1>
          <p className="mt-4 font-display text-base italic text-gold/90 sm:text-lg">
            Architect of a Life Well Lived
          </p>
          <div className="mx-auto mt-7 max-w-xl space-y-4 text-base leading-relaxed text-paper-muted sm:text-lg md:mx-0">
            <p>
              Sometimes life changes without asking our permission. Illness. Aging. Loss.
              Unexpected transitions. What matters isn&rsquo;t simply what happens to us, but what
              we choose to build afterward.
            </p>
            <p>
              I&rsquo;m Dr. Virgil Beasley. Psychologist, entrepreneur, author, and prostate cancer
              survivor. My work explores how we rebuild intimacy, rediscover purpose, and create a
              meaningful life&mdash;even when the future looks nothing like we imagined.
            </p>
          </div>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4 md:justify-start">
            <Link
              href="/knowledge"
              className="inline-flex items-center gap-2 rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
            >
              Explore My Work
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-gold transition-colors hover:border-gold/60"
            >
              Meet Dr. Beasley
            </Link>
          </div>
        </div>

        <div className="flex-1 md:flex md:justify-end">
          <div className="relative mx-auto aspect-square w-56 overflow-hidden rounded-full ring-1 ring-gold/40 shadow-[0_0_60px_-10px_rgba(226,121,58,0.45)] sm:w-64 md:aspect-[4/5] md:w-80 md:rounded-[2.5rem]">
            <Image
              src="/dr-virgil-beasly-portrait.jpg"
              alt="Portrait of Dr. Virgil Beasley, wearing an orange shirt, against a dark background"
              fill
              priority
              sizes="(min-width: 768px) 320px, 256px"
              className="object-cover object-[50%_20%]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/5 md:rounded-[2.5rem]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
