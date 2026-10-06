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
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "/",
    "/about",
    "/knowledge",
    "/questions",
    "/books",
    "/projects",
    "/contact",
  ].map((path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date() }));

  const resourceRoutes = listPublishedResources().map((r) => ({
    url: `${SITE_URL}/resources/${r.slug}`,
    lastModified: new Date(r.updated_at),
  }));

  const articleRoutes = listPublishedArticles().map((a) => ({
    url: `${SITE_URL}/knowledge/${a.slug}`,
    lastModified: new Date(a.updated_at),
  }));

  const questionRoutes = listPublishedQuestions()
    .filter((q) => q.slug)
    .map((q) => ({
      url: `${SITE_URL}/questions/${q.slug}`,
      lastModified: new Date(q.answered_at ?? q.created_at),
    }));

  const bookRoutes = listPublishedBooks().map((b) => ({
    url: `${SITE_URL}/books/${b.slug}`,
    lastModified: new Date(b.updated_at),
  }));

  const projectRoutes = listPublishedProjects().map((p) => ({
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
