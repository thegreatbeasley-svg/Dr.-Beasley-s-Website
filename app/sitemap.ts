import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { listPublishedResources } from "@/lib/resources/queries";
import { listPublishedArticles } from "@/lib/articles/queries";
import { listPublishedQuestions } from "@/lib/questions/queries";
import { listPublishedBooks } from "@/lib/books/queries";
import { listPublishedProjects } from "@/lib/projects/queries";

/**
 * Lists only published content — nothing in draft/pending state, and
 * nothing under /admin, ever appears here.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "/",
    "/about",
    "/knowledge",
    "/questions",
    "/books",
    "/projects",
    "/contact",
  ].map((path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date() }));

  const [resources, articles, questions, books, projects] = await Promise.all([
    listPublishedResources(),
    listPublishedArticles(),
    listPublishedQuestions(),
    listPublishedBooks(),
    listPublishedProjects(),
  ]);

  const resourceRoutes = resources.map((r) => ({
    url: `${SITE_URL}/resources/${r.slug}`,
    lastModified: new Date(r.updated_at),
  }));

  const articleRoutes = articles.map((a) => ({
    url: `${SITE_URL}/knowledge/${a.slug}`,
    lastModified: new Date(a.updated_at),
  }));

  const questionRoutes = questions
    .filter((q) => q.slug)
    .map((q) => ({
      url: `${SITE_URL}/questions/${q.slug}`,
      lastModified: new Date(q.answered_at ?? q.created_at),
    }));

  const bookRoutes = books.map((b) => ({
    url: `${SITE_URL}/books/${b.slug}`,
    lastModified: new Date(b.updated_at),
  }));

  const projectRoutes = projects.map((p) => ({
    url: `${SITE_URL}/projects/${p.slug}`,
    lastModified: new Date(p.updated_at),
  }));

  return [
    ...staticRoutes,
    ...resourceRoutes,
    ...articleRoutes,
    ...questionRoutes,
    ...bookRoutes,
    ...projectRoutes,
  ];
}
