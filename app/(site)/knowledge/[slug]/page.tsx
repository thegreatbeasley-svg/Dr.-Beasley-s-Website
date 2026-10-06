import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedArticleBySlug } from "@/lib/articles/queries";
import { getArticleCoverUrl } from "@/lib/articles/cover";
import { ARTICLE_CONTENT_TYPE_LABELS } from "@/lib/articles/types";
import { buildMetadata, absoluteUrl, SITE_NAME } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getPublishedArticleBySlug(slug);
  if (!article) {
    return buildMetadata({
      title: "Not found",
      description: "",
      path: `/knowledge/${slug}`,
      index: false,
    });
  }
  return buildMetadata({
    title: `${article.title} — Dr. Virgil Beasly`,
    description: article.short_description,
    path: `/knowledge/${article.slug}`,
  });
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getPublishedArticleBySlug(slug);
  if (!article) notFound();

  const label =
    ARTICLE_CONTENT_TYPE_LABELS[article.content_type as keyof typeof ARTICLE_CONTENT_TYPE_LABELS] ??
    article.content_type;
  const paragraphs = article.body.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  // Minimal, factual Article structured data — title/description/dates and
  // the site's own attribution only, no invented credentials.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.short_description,
    datePublished: article.created_at,
    dateModified: article.updated_at,
    author: { "@type": "Person", name: SITE_NAME },
    mainEntityOfPage: absoluteUrl(`/knowledge/${article.slug}`),
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <Link href="/knowledge" className="text-sm font-medium text-gold underline-offset-4 hover:underline">
        &larr; Back to the Knowledge Hub
      </Link>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic/admin-uploaded cover */}
        <img src={getArticleCoverUrl(article)} alt="" className="aspect-[21/9] w-full object-cover" />
      </div>

      <span className="mt-8 inline-block rounded-full border border-gold/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold">
        {label}
        {article.topic ? ` · ${article.topic}` : ""}
      </span>
      <h1 className="mt-3 text-3xl font-medium text-paper sm:text-4xl">{article.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-paper-muted">{article.short_description}</p>

      {article.is_demo_content && (
        <p className="mt-3 text-xs font-medium uppercase tracking-wider text-paper-muted/70">
          Demonstration content — not a verified publication.
        </p>
      )}

      <div className="mt-10 space-y-5 text-base leading-relaxed text-paper">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  );
}
