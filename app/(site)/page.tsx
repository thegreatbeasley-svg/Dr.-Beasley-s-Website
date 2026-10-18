import Hero from "@/app/components/Hero";
import Manifesto from "@/app/components/home/Manifesto";
import FeaturedKnowledge, { type FeaturedKnowledgeItem } from "@/app/components/home/FeaturedKnowledge";
import PersonalSupport from "@/app/components/home/PersonalSupport";
import FeaturedQuestion from "@/app/components/home/FeaturedQuestion";
import FinalCta from "@/app/components/home/FinalCta";
import { listPublishedResources } from "@/lib/resources/queries";
import { getResourceCoverUrl } from "@/lib/resources/cover";
import { listPublishedArticles } from "@/lib/articles/queries";
import { getArticleCoverUrl } from "@/lib/articles/cover";
import { ARTICLE_CONTENT_TYPE_LABELS } from "@/lib/articles/types";
import { listPublishedQuestions } from "@/lib/questions/queries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Dr. Virgil Beasley | Architect of a Life Well Lived",
  description:
    "Explore the work of Dr. Virgil Beasley—clinical psychologist, entrepreneur and cultivator of human possibility—across intimacy, wellbeing and purposeful living.",
  path: "/",
});

/**
 * Merges the two Knowledge Hub content types into one featured selection,
 * ordered the same way each already is individually (featured first, then
 * newest) so the homepage and /knowledge agree on what "featured" means.
 */
function buildFeaturedKnowledge(
  resources: Awaited<ReturnType<typeof listPublishedResources>>,
  articles: Awaited<ReturnType<typeof listPublishedArticles>>
): FeaturedKnowledgeItem[] {
  const items = [
    ...resources.map((r) => ({
      key: `resource:${r.id}`,
      href: `/resources/${r.slug}`,
      coverUrl: getResourceCoverUrl(r),
      badge: "Free Guide",
      title: r.title,
      description: r.short_description,
      cta: "Get the free guide",
      isDemo: r.is_demo_content,
      featured: r.featured,
      created_at: r.created_at,
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
      cta: a.content_type === "article" ? "Read article" : "Read more",
      isDemo: a.is_demo_content,
      featured: a.featured,
      created_at: a.created_at,
    })),
  ];

  return items
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.created_at.localeCompare(a.created_at))
    .slice(0, 3)
    .map((item) => ({
      key: item.key,
      href: item.href,
      coverUrl: item.coverUrl,
      badge: item.badge,
      title: item.title,
      description: item.description,
      cta: item.cta,
      isDemo: item.isDemo,
    }));
}

export default async function HomePage() {
  const [resources, articles, questions] = await Promise.all([
    listPublishedResources(),
    listPublishedArticles(),
    listPublishedQuestions(),
  ]);

  const featuredKnowledge = buildFeaturedKnowledge(resources, articles);

  return (
    <>
      <Hero />
      <Manifesto />
      <FeaturedKnowledge items={featuredKnowledge} />
      <PersonalSupport />
      <FeaturedQuestion question={questions[0] ?? null} />
      <FinalCta />
    </>
  );
}
