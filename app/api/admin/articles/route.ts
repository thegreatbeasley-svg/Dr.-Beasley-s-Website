import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/session";
import { createArticle, isArticleSlugTaken } from "@/lib/articles/queries";
import { slugify } from "@/lib/slug";
import { saveCoverImage, UploadError } from "@/lib/resources/storage";
import { ARTICLE_CONTENT_TYPES } from "@/lib/articles/types";
import { clean } from "@/lib/validation";

export async function POST(req: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();

  const title = clean(formData.get("title"), 200);
  const slugInput = clean(formData.get("slug"), 200);
  const shortDescription = clean(formData.get("short_description"), 500);
  const body = clean(formData.get("body"), 20000);
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
  if (!body) errors.body = "Body is required.";
  if (!ARTICLE_CONTENT_TYPES.includes(contentType as (typeof ARTICLE_CONTENT_TYPES)[number])) {
    errors.content_type = "Choose a content type.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors: errors }, { status: 400 });
  }

  if (await isArticleSlugTaken(slug)) {
    return NextResponse.json(
      { error: "Invalid submission", fieldErrors: { slug: "That slug is already in use." } },
      { status: 400 }
    );
  }

  let coverImagePath: string | null = null;
  if (cover instanceof File && cover.size > 0) {
    try {
      const saved = await saveCoverImage(cover);
      coverImagePath = saved.path;
    } catch (error) {
      const message = error instanceof UploadError ? error.message : "Could not save the cover image.";
      return NextResponse.json({ error: "Invalid submission", fieldErrors: { cover: message } }, { status: 400 });
    }
  }

  const article = await createArticle({
    title,
    slug,
    short_description: shortDescription,
    body,
    topic: topic || null,
    content_type: contentType,
    cover_image_path: coverImagePath,
    is_demo_content: false,
    published,
    featured,
  });

  return NextResponse.json({ success: true, article });
}
