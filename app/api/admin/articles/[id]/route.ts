import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/session";
import {
  getArticleById,
  isArticleSlugTaken,
  updateArticle,
  replaceArticleCoverImage,
} from "@/lib/articles/queries";
import { slugify } from "@/lib/slug";
import { saveCoverImage, UploadError } from "@/lib/resources/storage";
import { ARTICLE_CONTENT_TYPES } from "@/lib/articles/types";
import { clean } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

/** Quick toggles from the articles table: publish/unpublish, feature/unfeature. */
export async function PATCH(req: Request, { params }: Context) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getArticleById(id);
  if (!existing) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const patch: { published?: boolean; featured?: boolean } = {};
  if (typeof body.published === "boolean") patch.published = body.published;
  if (typeof body.featured === "boolean") patch.featured = body.featured;

  const article = await updateArticle(id, patch);
  return NextResponse.json({ success: true, article });
}

/** Full edit form: fields plus an optional replacement cover. */
export async function PUT(req: Request, { params }: Context) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getArticleById(id);
  if (!existing) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const formData = await req.formData();

  const title = clean(formData.get("title"), 200);
  const slugInput = clean(formData.get("slug"), 200);
  const shortDescription = clean(formData.get("short_description"), 500);
  const bodyText = clean(formData.get("body"), 20000);
  const topic = clean(formData.get("topic"), 100);
  const contentType = clean(formData.get("content_type"), 40);
  const published = formData.get("published") === "true";
  const featured = formData.get("featured") === "true";
  const cover = formData.get("cover");

  const slug = slugify(slugInput || title);

  const errors: Record<string, string> = {};
  if (!title) errors.title = "Title is required.";
  if (!slug) errors.slug = "Slug is required.";
  if (!shortDescription) errors.short_description = "Short description is required.";
  if (!bodyText) errors.body = "Body is required.";
  if (!ARTICLE_CONTENT_TYPES.includes(contentType as (typeof ARTICLE_CONTENT_TYPES)[number])) {
    errors.content_type = "Choose a content type.";
  }
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors: errors }, { status: 400 });
  }

  if (await isArticleSlugTaken(slug, id)) {
    return NextResponse.json(
      { error: "Invalid submission", fieldErrors: { slug: "That slug is already in use." } },
      { status: 400 }
    );
  }

  await updateArticle(id, {
    title,
    slug,
    short_description: shortDescription,
    body: bodyText,
    topic: topic || null,
    content_type: contentType,
    published,
    featured,
  });

  if (cover instanceof File && cover.size > 0) {
    try {
      const saved = await saveCoverImage(cover);
      await replaceArticleCoverImage(id, saved.path);
    } catch (error) {
      const message = error instanceof UploadError ? error.message : "Could not save the cover image.";
      return NextResponse.json({ error: "Invalid submission", fieldErrors: { cover: message } }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true, article: await getArticleById(id) });
}
