import { listPublishedResources } from "@/lib/resources/queries";
import { getResourceCoverUrl } from "@/lib/resources/cover";
import { listPublishedArticles } from "@/lib/articles/queries";
import { getArticleCoverUrl } from "@/lib/articles/cover";
import { ARTICLE_CONTENT_TYPE_LABELS } from "@/lib/articles/types";
import KnowledgeGrid, { type KnowledgeItem } from "@/app/components/knowledge/KnowledgeGrid";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Knowledge Hub — Dr. Virgil Beasly",
  description:
    "Guides, worksheets, books, and articles from Dr. Virgil Beasly's resource library, in one browsable, filterable hub.",
  path: "/knowledge",
});

export default async function KnowledgeHubPage() {
  const [resources, articles] = await Promise.all([listPublishedResources(), listPublishedArticles()]);

  const items: KnowledgeItem[] = [
    ...resources.map((r) => ({
      key: `resource:${r.id}`,
      href: `/resources/${r.slug}`,
      coverUrl: getResourceCoverUrl(r),
      badge: r.resource_type,
      title: r.title,
      description: r.short_description,
      cta: "Get the free guide",
      isDemo: r.is_demo_content,
    })),
    ...articles.map((a) => ({
      key: `article:${a.id}`,
      href: `/knowledge/${a.slug}`,
      coverUrl: getArticleCoverUrl(a),
      badge:
        ARTICLE_CONTENT_TYPE_LABELS[a.content_type as keyof typeof ARTICLE_CONTENT_TYPE_LABELS] ??
        a.content_type,
      title: a.title,
      description: a.short_description,
      cta: "Read more",
      isDemo: a.is_demo_content,
    })),
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">Knowledge Hub</p>
        <h1 className="mt-5 text-3xl font-medium text-paper sm:text-4xl">
          Guides, articles, and resources
        </h1>
        <p className="mt-4 text-base leading-relaxed text-paper-muted">
          Everything Dr. Virgil Beasly has gathered in one place — browse by type below, or use the
          filters to find what you need.
        </p>
      </div>

      <KnowledgeGrid items={items} />
    </div>
  );
}
