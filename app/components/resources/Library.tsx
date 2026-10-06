"use client";

import React from "react";
import type { Resource } from "@/lib/resources/types";
import ResourceCard from "./ResourceCard";
import ResourceModal from "./ResourceModal";

type Props = {
  resources: Resource[];
};

export default function Library({ resources }: Props) {
  const [activeType, setActiveType] = React.useState<string>("All");
  const [selectedSlug, setSelectedSlug] = React.useState<string | null>(null);

  const types = React.useMemo(() => {
    const set = new Set(resources.map((r) => r.resource_type));
    return ["All", ...Array.from(set)];
  }, [resources]);

  const filtered = React.useMemo(
    () => (activeType === "All" ? resources : resources.filter((r) => r.resource_type === activeType)),
    [resources, activeType]
  );

  const selectedResource = React.useMemo(
    () => resources.find((r) => r.slug === selectedSlug) ?? null,
    [resources, selectedSlug]
  );

  return (
    <section id="library" className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-medium text-paper sm:text-4xl">Find your next resource</h2>
        <p className="mt-4 text-base leading-relaxed text-paper-muted">
          Browse the collection and choose what speaks to you. To receive a free download, simply
          share your name, city, and email.
        </p>
      </div>

      {types.length > 2 && (
        <div className="mt-10 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter resources by type">
          {types.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              aria-pressed={activeType === type}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
                activeType === type
                  ? "border-tangerine bg-tangerine text-tangerine-ink"
                  : "border-white/15 text-paper-muted hover:border-gold/40 hover:text-paper"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-paper-muted">
          No resources are published yet. Check back soon.
        </p>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} onOpen={setSelectedSlug} />
          ))}
        </div>
      )}

      <ResourceModal resource={selectedResource} onClose={() => setSelectedSlug(null)} />
    </section>
  );
}
