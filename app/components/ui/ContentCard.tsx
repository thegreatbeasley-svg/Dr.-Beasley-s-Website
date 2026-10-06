import Link from "next/link";

type Props = {
  href: string;
  coverUrl: string;
  badge: string;
  title: string;
  description: string;
  cta: string;
  isDemo?: boolean;
};

/**
 * Shared card shape for every content listing (Knowledge Hub, Books,
 * Projects). Unlike ResourceCard (which opens the request modal),
 * this always links straight to the item's own page — every one of
 * these content types is browsable/indexable on its own URL.
 */
export default function ContentCard({ href, coverUrl, badge, title, description, cta, isDemo }: Props) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-elevated transition-colors hover:border-gold/40"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- server-generated / admin-uploaded cover */}
        <img
          src={coverUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full border border-gold/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold">
            {badge}
          </span>
          {isDemo && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-paper-muted/70">
              Demo content
            </span>
          )}
        </div>

        <h3 className="text-lg font-medium leading-snug text-paper">{title}</h3>
        <p className="flex-1 text-sm leading-relaxed text-paper-muted">{description}</p>

        <span className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-tangerine px-5 py-3 text-xs font-semibold uppercase tracking-widest text-tangerine-ink transition-colors group-hover:bg-tangerine-hover">
          {cta}
        </span>
      </div>
    </Link>
  );
}
