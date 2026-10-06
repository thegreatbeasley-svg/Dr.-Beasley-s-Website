import type { Resource } from "@/lib/resources/types";
import { getResourceCoverUrl } from "@/lib/resources/cover";

type Props = {
  resource: Resource;
  onOpen: (slug: string) => void;
};

export default function ResourceCard({ resource, onOpen }: Props) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-elevated transition-colors hover:border-gold/40">
      <button
        type="button"
        onClick={() => onOpen(resource.slug)}
        className="relative block aspect-[3/4] w-full overflow-hidden text-left"
        aria-label={`View details for ${resource.title}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- server-generated / admin-uploaded cover, not a static asset next/image can optimize reliably */}
        <img
          src={getResourceCoverUrl(resource)}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </button>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full border border-gold/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold">
            {resource.resource_type}
          </span>
          {resource.is_demo_content && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-paper-muted/70">
              Demo content
            </span>
          )}
        </div>

        <h3 className="text-lg font-medium leading-snug text-paper">{resource.title}</h3>
        <p className="flex-1 text-sm leading-relaxed text-paper-muted">
          {resource.short_description}
        </p>

        <button
          type="button"
          onClick={() => onOpen(resource.slug)}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-tangerine px-5 py-3 text-xs font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
        >
          Get the free guide
        </button>
      </div>
    </article>
  );
}
