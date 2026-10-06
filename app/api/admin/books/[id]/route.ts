import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/session";
import {
  getBookById,
  isBookSlugTaken,
  updateBook,
  replaceBookCoverImage,
} from "@/lib/books/queries";
import { slugify } from "@/lib/slug";
import { saveCoverImage, UploadError } from "@/lib/resources/storage";
import { BOOK_KINDS, BOOK_STATUSES } from "@/lib/books/types";
import { clean } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Context) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getBookById(id);
  if (!existing) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const patch: { published?: boolean; featured?: boolean } = {};
  if (typeof body.published === "boolean") patch.published = body.published;
  if (typeof body.featured === "boolean") patch.featured = body.featured;

  const book = await updateBook(id, patch);
  return NextResponse.json({ success: true, book });
}

export async function PUT(req: Request, { params }: Context) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getBookById(id);
  if (!existing) return NextResponse.json({ error: "Book not found" }, { status: 404 });

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

  if (await isBookSlugTaken(slug, id)) {
    return NextResponse.json(
      { error: "Invalid submission", fieldErrors: { slug: "That slug is already in use." } },
      { status: 400 }
    );
  }

  await updateBook(id, {
    title,
    slug,
    kind,
    description,
    status,
    cta_label: ctaLabel || null,
    cta_url: ctaUrl || null,
    published,
    featured,
  });

  if (cover instanceof File && cover.size > 0) {
    try {
      const saved = await saveCoverImage(cover);
      await replaceBookCoverImage(id, saved.path);
    } catch (error) {
      const message = error instanceof UploadError ? error.message : "Could not save the cover image.";
      return NextResponse.json({ error: "Invalid submission", fieldErrors: { cover: message } }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true, book: await getBookById(id) });
}
