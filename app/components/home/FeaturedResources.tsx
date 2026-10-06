import Link from "next/link";
import type { Resource } from "@/lib/resources/types";
import { getResourceCoverUrl } from "@/lib/resources/cover";
import ContentCard from "@/app/components/ui/ContentCard";

export default function FeaturedResources({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) return null;

  return (
    <section className="border-t border-white/10 bg-ink-elevated/30">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">Start here</p>
            <h2 className="mt-3 text-3xl font-medium text-paper">Three resources to begin with</h2>
          </div>
          <Link href="/knowledge" className="text-sm font-medium text-gold underline-offset-4 hover:underline">
            Browse the full Knowledge Hub →
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <ContentCard
              key={r.id}
              href={`/resources/${r.slug}`}
              coverUrl={getResourceCoverUrl(r)}
              badge={r.resource_type}
              title={r.title}
              description={r.short_description}
              cta="Get the free guide"
              isDemo={r.is_demo_content}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
