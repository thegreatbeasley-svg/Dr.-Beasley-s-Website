import type { Resource } from "@/lib/resources/types";
import { getResourceCoverUrl } from "@/lib/resources/cover";
import ResourceRequestForm from "./ResourceRequestForm";

type Props = {
  resource: Resource;
  headingId?: string;
  onFormSuccess?: () => void;
};

export default function ResourceDetail({ resource, headingId, onFormSuccess }: Props) {
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,220px)_1fr] md:gap-10">
      <div className="mx-auto w-40 sm:w-48 md:mx-0 md:w-full">
        <div className="overflow-hidden rounded-xl border border-white/10 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element -- dynamic/admin-uploaded cover */}
          <img
            src={getResourceCoverUrl(resource)}
            alt=""
            className="aspect-[3/4] w-full object-cover"
          />
        </div>
      </div>

      <div>
        <span className="inline-block rounded-full border border-gold/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold">
          {resource.resource_type}
        </span>
        <h2 id={headingId} className="mt-3 text-2xl font-medium text-paper sm:text-3xl">
          {resource.title}
        </h2>
        {resource.long_description ? (
          <p className="mt-4 text-base leading-relaxed text-paper-muted">
            {resource.long_description}
          </p>
        ) : (
          <p className="mt-4 text-base leading-relaxed text-paper-muted">
            {resource.short_description}
          </p>
        )}
        {resource.is_demo_content && (
          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-paper-muted/70">
            Demonstration content — not authored by Dr. Virgil Beasly.
          </p>
        )}

        <div className="mt-8 rounded-2xl border border-white/10 bg-ink/60 p-6">
          <h3 className="text-lg font-medium text-paper">Your resource is one step away</h3>
          <p className="mt-2 text-sm text-paper-muted">
            To receive a free download, simply share your name, city, and email.
          </p>
          <div className="mt-4">
            <ResourceRequestForm
              resourceSlug={resource.slug}
              resourceTitle={resource.title}
              onSuccess={onFormSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
