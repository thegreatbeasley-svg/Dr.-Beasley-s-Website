import Link from "next/link";

export type FeaturedKnowledgeItem = {
  key: string;
  href: string;
  coverUrl: string;
  badge: string;
  title: string;
  description: string;
  cta: string;
  isDemo: boolean;
};

/**
 * Curated presentation of the homepage's featured knowledge — not the
 * filterable catalogue grid used on /knowledge. The first (most
 * featured/newest) item is shown large; the rest sit alongside it as
 * smaller companions, so the section reads as an edited selection rather
 * than a download listing.
 */
export default function FeaturedKnowledge({ items }: { items: FeaturedKnowledgeItem[] }) {
  if (items.length === 0) return null;
  const [dominant, ...rest] = items;

  return (
    <section className="border-b border-white/10 bg-ink-elevated/30">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">
              From the Knowledge Hub
            </p>
            <h2 className="mt-3 text-3xl font-medium text-paper sm:text-4xl">
              Ideas to carry with you
            </h2>
          </div>
          <Link href="/knowledge" className="text-sm font-medium text-gold underline-offset-4 hover:underline">
            Explore the Knowledge Hub →
          </Link>
        </div>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-paper-muted">
          Explore selected writing, thoughtful answers and practical resources from Dr.
          Beasly&rsquo;s growing body of work.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Link
            href={dominant.href}
            className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-elevated transition-colors hover:border-gold/40 lg:col-span-3 lg:flex-row"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden lg:aspect-auto lg:w-1/2">
              {/* eslint-disable-next-line @next/next/no-img-element -- server-generated / admin-uploaded cover */}
              <img
                src={dominant.coverUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-7">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full border border-gold/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold">
                  {dominant.badge}
                </span>
                {dominant.isDemo && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-paper-muted/70">
                    Demo content
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-medium leading-snug text-paper">{dominant.title}</h3>
              <p className="flex-1 text-sm leading-relaxed text-paper-muted">{dominant.description}</p>
              <span className="mt-2 inline-flex w-fit items-center justify-center gap-2 rounded-full bg-tangerine px-5 py-3 text-xs font-semibold uppercase tracking-widest text-tangerine-ink transition-colors group-hover:bg-tangerine-hover">
                {dominant.cta}
              </span>
            </div>
          </Link>

          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
              {rest.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="group flex flex-1 items-center gap-4 rounded-2xl border border-white/10 bg-ink-elevated p-5 transition-colors hover:border-gold/40"
                >
                  <div className="relative h-20 w-16 flex-none overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element -- server-generated / admin-uploaded cover */}
                    <img
                      src={item.coverUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gold">
                      {item.badge}
                    </span>
                    <h3 className="mt-1 truncate text-base font-medium text-paper">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-paper-muted">
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
