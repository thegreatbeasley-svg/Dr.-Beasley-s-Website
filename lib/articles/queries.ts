import "server-only";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { deleteCoverImage } from "@/lib/resources/storage";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient, unwrap, unwrapNullable } from "@/lib/supabase/admin";
import { toArticle, type Article, type ArticleRow, type ArticleContentType } from "./types";

function nowIso() {
  return new Date().toISOString();
}

// ============================================================
// PUBLIC reads
// ============================================================

export async function listPublishedArticles(): Promise<Article[]> {
  if (isSupabaseConfigured()) {
    const rows = unwrap(
      await createSupabaseAdminClient()
        .from("articles")
        .select("*")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
    ) as ArticleRow[];
    return rows.map(toArticle);
  }
  const rows = getDb()
    .prepare(`SELECT * FROM articles WHERE published = 1 ORDER BY featured DESC, created_at DESC`)
    .all() as ArticleRow[];
  return rows.map(toArticle);
}

export async function getPublishedArticleBySlug(slug: string): Promise<Article | null> {
  if (isSupabaseConfigured()) {
    const row = unwrapNullable(
      await createSupabaseAdminClient()
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle()
    ) as ArticleRow | null;
    return row ? toArticle(row) : null;
  }
  const row = getDb()
    .prepare(`SELECT * FROM articles WHERE slug = ? AND published = 1`)
    .get(slug) as ArticleRow | undefined;
  return row ? toArticle(row) : null;
}

// ============================================================
// ADMIN
// ============================================================

export async function listAllArticlesAdmin(): Promise<Article[]> {
  if (isSupabaseConfigured()) {
    const rows = unwrap(
      await createSupabaseAdminClient().from("articles").select("*").order("created_at", { ascending: false })
    ) as ArticleRow[];
    return rows.map(toArticle);
  }
  const rows = getDb()
    .prepare(`SELECT * FROM articles ORDER BY created_at DESC`)
    .all() as ArticleRow[];
  return rows.map(toArticle);
}

export async function getArticleById(id: string): Promise<Article | null> {
  if (isSupabaseConfigured()) {
    const row = unwrapNullable(
      await createSupabaseAdminClient().from("articles").select("*").eq("id", id).maybeSingle()
    ) as ArticleRow | null;
    return row ? toArticle(row) : null;
  }
  const row = getDb().prepare(`SELECT * FROM articles WHERE id = ?`).get(id) as
    | ArticleRow
    | undefined;
  return row ? toArticle(row) : null;
}

export async function isArticleSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    let query = createSupabaseAdminClient().from("articles").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const row = unwrapNullable(await query.maybeSingle());
    return Boolean(row);
  }
  const db = getDb();
  const row = excludeId
    ? db.prepare(`SELECT id FROM articles WHERE slug = ? AND id != ?`).get(slug, excludeId)
    : db.prepare(`SELECT id FROM articles WHERE slug = ?`).get(slug);
  return Boolean(row);
}

export type ArticleInput = {
  title: string;
  slug: string;
  short_description: string;
  body: string;
  topic?: string | null;
  content_type: ArticleContentType | string;
  cover_image_path?: string | null;
  is_demo_content?: boolean;
  published: boolean;
  featured?: boolean;
};

export async function createArticle(input: ArticleInput): Promise<Article> {
  const id = crypto.randomUUID();
  const timestamp = nowIso();

  if (isSupabaseConfigured()) {
    unwrap(
      await createSupabaseAdminClient()
        .from("articles")
        .insert({
          id,
          title: input.title,
          slug: input.slug,
          short_description: input.short_description,
          body: input.body,
          topic: input.topic ?? null,
          content_type: input.content_type,
          cover_image_path: input.cover_image_path ?? null,
          is_demo_content: input.is_demo_content !== false,
          published: Boolean(input.published),
          featured: Boolean(input.featured),
          created_at: timestamp,
          updated_at: timestamp,
        })
        .select()
    );
    return (await getArticleById(id))!;
  }

  getDb()
    .prepare(
      `INSERT INTO articles
        (id, title, slug, short_description, body, topic, content_type, cover_image_path,
         is_demo_content, published, featured, created_at, updated_at)
       VALUES (@id, @title, @slug, @short_description, @body, @topic, @content_type, @cover_image_path,
         @is_demo_content, @published, @featured, @created_at, @updated_at)`
    )
    .run({
      id,
      title: input.title,
      slug: input.slug,
      short_description: input.short_description,
      body: input.body,
      topic: input.topic ?? null,
      content_type: input.content_type,
      cover_image_path: input.cover_image_path ?? null,
      is_demo_content: input.is_demo_content === false ? 0 : 1,
      published: input.published ? 1 : 0,
      featured: input.featured ? 1 : 0,
      created_at: timestamp,
      updated_at: timestamp,
    });
  return (await getArticleById(id))!;
}

export type ArticleUpdateInput = Partial<ArticleInput>;

export async function updateArticle(id: string, input: ArticleUpdateInput): Promise<Article> {
  const existing = await getArticleById(id);
  if (!existing) throw new Error("Article not found");

  const merged = {
    title: input.title ?? existing.title,
    slug: input.slug ?? existing.slug,
    short_description: input.short_description ?? existing.short_description,
    body: input.body ?? existing.body,
    topic: input.topic !== undefined ? input.topic : existing.topic,
    content_type: input.content_type ?? existing.content_type,
    cover_image_path:
      input.cover_image_path !== undefined ? input.cover_image_path : existing.cover_image_path,
    is_demo_content: input.is_demo_content !== undefined ? input.is_demo_content : existing.is_demo_content,
    published: input.published !== undefined ? input.published : existing.published,
    featured: input.featured !== undefined ? input.featured : existing.featured,
    updated_at: nowIso(),
  };

  if (isSupabaseConfigured()) {
    unwrap(await createSupabaseAdminClient().from("articles").update(merged).eq("id", id).select());
    return (await getArticleById(id))!;
  }

  getDb()
    .prepare(
      `UPDATE articles SET
        title = @title, slug = @slug, short_description = @short_description, body = @body,
        topic = @topic, content_type = @content_type, cover_image_path = @cover_image_path,
        is_demo_content = @is_demo_content, published = @published, featured = @featured,
        updated_at = @updated_at
       WHERE id = @id`
    )
    .run({
      ...merged,
      is_demo_content: merged.is_demo_content ? 1 : 0,
      published: merged.published ? 1 : 0,
      featured: merged.featured ? 1 : 0,
      id,
    });

  return (await getArticleById(id))!;
}

export async function replaceArticleCoverImage(articleId: string, coverPath: string) {
  const existing = await getArticleById(articleId);
  if (!existing) throw new Error("Article not found");
  await updateArticle(articleId, { cover_image_path: coverPath });
  await deleteCoverImage(existing.cover_image_path);
}
