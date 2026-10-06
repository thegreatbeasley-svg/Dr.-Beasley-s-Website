export const ARTICLE_CONTENT_TYPES = ["article", "guide", "video", "publication"] as const;
export type ArticleContentType = (typeof ARTICLE_CONTENT_TYPES)[number];

export const ARTICLE_CONTENT_TYPE_LABELS: Record<ArticleContentType, string> = {
  article: "Article",
  guide: "Guide",
  video: "Video",
  publication: "Publication",
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  body: string;
  topic: string | null;
  content_type: string;
  cover_image_path: string | null;
  is_demo_content: boolean;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type ArticleRow = Omit<Article, "is_demo_content" | "published" | "featured"> & {
  is_demo_content: number;
  published: number;
  featured: number;
};

export function toArticle(row: ArticleRow): Article {
  return {
    ...row,
    is_demo_content: Boolean(row.is_demo_content),
    published: Boolean(row.published),
    featured: Boolean(row.featured),
  };
}
