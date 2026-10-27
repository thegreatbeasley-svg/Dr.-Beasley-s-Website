import { NextResponse } from "next/server";
import { handleDelete } from "@/lib/admin/delete";
import { requireAdminApi } from "@/lib/admin/session";
import { getBookById, isBookSlugTaken, updateBook } from "@/lib/books/queries";
import { parseBookForm, resolveBookCover, resolveVideoChange, UploadError, type VideoChange } from "@/lib/books/input";
import { deleteBookVideo, deleteCoverImage } from "@/lib/resources/storage";

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

  const patch: { published?: boolean } = {};
  if (typeof body.published === "boolean") patch.published = body.published;

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
  const { values, fieldErrors, videoMode, externalVideo } = parseBookForm(formData);

  if (Object.keys(fieldErrors).length === 0 && (await isBookSlugTaken(values.slug, id))) {
    fieldErrors.slug = "That slug is already in use.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors }, { status: 400 });
  }

  // Verify any new cover BEFORE touching the record, so a rejected upload
  // leaves the book (and its current cover) exactly as it was.
  let cover = null;
  try {
    cover = await resolveBookCover(formData);
  } catch (error) {
    const message = error instanceof UploadError ? error.message : "Could not save the cover image.";
    return NextResponse.json({ error: "Invalid submission", fieldErrors: { cover: message } }, { status: 400 });
  }

  let video: VideoChange;
  try {
    video = await resolveVideoChange(formData, videoMode, externalVideo, existing);
  } catch (error) {
    if (cover) await deleteCoverImage(cover.path);
    const message = error instanceof UploadError ? error.message : "Could not save the video.";
    return NextResponse.json({ error: "Invalid submission", fieldErrors: { video: message } }, { status: 400 });
  }

  try {
    await updateBook(id, {
      ...values,
      ...(cover
        ? { cover_image_path: cover.path, cover_width: cover.width, cover_height: cover.height }
        : {}),
      ...video.patch,
    });
  } catch (error) {
    if (cover) await deleteCoverImage(cover.path);
    await deleteBookVideo(video.newUpload);
    const message = error instanceof Error ? error.message : "Could not save the book.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Only now that the record points at the new files, remove the old ones.
  if (cover && existing.cover_image_path && existing.cover_image_path !== cover.path) {
    await deleteCoverImage(existing.cover_image_path);
  }
  if (video.oldUpload && video.oldUpload !== video.patch.video_url) {
    await deleteBookVideo(video.oldUpload);
  }

  return NextResponse.json({ success: true, book: await getBookById(id) });
}

export async function DELETE(req: Request, { params }: Context) {
  const { id } = await params;
  return handleDelete(req, "books", id);
}
