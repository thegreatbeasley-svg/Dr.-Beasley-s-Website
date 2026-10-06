import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/session";
import { createBook, isBookSlugTaken } from "@/lib/books/queries";
import { slugify } from "@/lib/slug";
import { saveCoverImage, UploadError } from "@/lib/resources/storage";
import { BOOK_KINDS, BOOK_STATUSES } from "@/lib/books/types";
import { clean } from "@/lib/validation";

export async function POST(req: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();

  const title = clean(formData.get("title"), 200);
  const slugInput = clean(formData.get("slug"), 200);
  const kind = clean(formData.get("kind"), 40);
  const description = clean(formData.get("description"), 4000);
  const status = clean(formData.get("status"), 20);
  const ctaLabel = clean(formData.get("cta_label"), 60);
  const ctaUrl = clean(formData.get("cta_url"), 500);
  const published = formData.get("published") === "true";
  const featured = formData.get("featured") === "true";
  const cover = formData.get("cover");

  const slug = slugify(slugInput || title);

  const errors: Record<string, string> = {};
  if (!title) errors.title = "Title is required.";
  if (!slug) errors.slug = "Slug is required.";
  if (!description) errors.description = "Description is required.";
  if (!BOOK_KINDS.includes(kind as (typeof BOOK_KINDS)[number])) errors.kind = "Choose a kind.";
  if (!BOOK_STATUSES.includes(status as (typeof BOOK_STATUSES)[number])) errors.status = "Choose a status.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors: errors }, { status: 400 });
  }

  if (await isBookSlugTaken(slug)) {
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

  const book = await createBook({
    title,
    slug,
    kind,
    description,
    status,
    cta_label: ctaLabel || null,
    cta_url: ctaUrl || null,
    cover_image_path: coverImagePath,
    published,
    featured,
  });

  return NextResponse.json({ success: true, book });
}
