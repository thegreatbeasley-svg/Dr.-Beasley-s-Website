import { ARTICLE_CONTENT_TYPE_LABELS } from "./types";

/**
 * Same generated-cover endpoint used by resources (app/api/resources/cover
 * is a generic title/type → image renderer, not resource-specific) — reused
 * here rather than duplicating the image-generation route.
 */
export function getArticleCoverUrl(article: {
  cover_image_path: string | null;
  title: string;
  content_type: string;
}) {
  if (article.cover_image_path) return article.cover_image_path;
  const label =
    ARTICLE_CONTENT_TYPE_LABELS[article.content_type as keyof typeof ARTICLE_CONTENT_TYPE_LABELS] ??
    article.content_type;
  const params = new URLSearchParams({ title: article.title, type: label });
  return `/api/resources/cover?${params.toString()}`;
}
