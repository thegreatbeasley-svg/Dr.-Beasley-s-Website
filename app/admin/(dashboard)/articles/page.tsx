import Link from "next/link";
import { listAllArticlesAdmin } from "@/lib/articles/queries";
import { ARTICLE_CONTENT_TYPE_LABELS } from "@/lib/articles/types";
import AdminPublishTable from "@/app/components/admin/AdminPublishTable";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const articles = await listAllArticlesAdmin();
  const items = articles.map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: `/${a.slug}`,
    badge:
      ARTICLE_CONTENT_TYPE_LABELS[a.content_type as keyof typeof ARTICLE_CONTENT_TYPE_LABELS] ??
      a.content_type,
    published: a.published,
    featured: a.featured,
  }));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-paper">Articles</h1>
          <p className="mt-1 text-sm text-paper-muted">
            Knowledge Hub content: articles, guides, videos, and publications.
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="rounded-full bg-tangerine px-5 py-3 text-xs font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
        >
          New article
        </Link>
      </div>
      <AdminPublishTable items={items} apiBase="/api/admin/articles" editBase="/admin/articles" emptyLabel="No articles yet." />
    </div>
  );
}
