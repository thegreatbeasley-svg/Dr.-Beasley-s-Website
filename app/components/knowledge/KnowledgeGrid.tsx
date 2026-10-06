"use client";

import React from "react";
import ContentCard from "@/app/components/ui/ContentCard";

export type KnowledgeItem = {
  key: string;
  href: string;
  coverUrl: string;
  badge: string;
  title: string;
  description: string;
  cta: string;
  isDemo: boolean;
};

export default function KnowledgeGrid({ items }: { items: KnowledgeItem[] }) {
  const [activeType, setActiveType] = React.useState("All");

  const types = React.useMemo(() => ["All", ...new Set(items.map((i) => i.badge))], [items]);
  const filtered = React.useMemo(
    () => (activeType === "All" ? items : items.filter((i) => i.badge === activeType)),
    [items, activeType]
  );

  if (items.length === 0) {
    return (
      <p className="mt-16 text-center text-paper-muted">
        Nothing is published here yet. Check back soon.
      </p>
    );
  }

  return (
    <div>
      {types.length > 2 && (
        <div
          className="mt-10 flex flex-wrap justify-center gap-2"
          role="group"
          aria-label="Filter by type"
        >
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
        <p className="mt-16 text-center text-paper-muted">Nothing matches that filter yet.</p>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ContentCard
              key={item.key}
              href={item.href}
              coverUrl={item.coverUrl}
              badge={item.badge}
              title={item.title}
              description={item.description}
              cta={item.cta}
              isDemo={item.isDemo}
            />
          ))}
        </div>
      )}
    </div>
  );
}
