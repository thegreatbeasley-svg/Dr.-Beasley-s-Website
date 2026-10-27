import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/session";
import { createBook, isBookSlugTaken } from "@/lib/books/queries";
import { parseBookForm, resolveBookCover, resolveVideoChange, UploadError, type VideoChange } from "@/lib/books/input";
import { deleteBookVideo, deleteCoverImage } from "@/lib/resources/storage";

export async function POST(req: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const { values, fieldErrors, videoMode, externalVideo } = parseBookForm(formData);

  if (Object.keys(fieldErrors).length === 0 && (await isBookSlugTaken(values.slug))) {
    fieldErrors.slug = "That slug is already in use.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors }, { status: 400 });
  }

  // Verify every upload BEFORE creating the record.
  let cover = null;
  try {
    cover = await resolveBookCover(formData);
  } catch (error) {
    const message = error instanceof UploadError ? error.message : "Could not save the cover image.";
    return NextResponse.json({ error: "Invalid submission", fieldErrors: { cover: message } }, { status: 400 });
  }

  let video: VideoChange;
  try {
    video = await resolveVideoChange(formData, videoMode, externalVideo, null);
  } catch (error) {
    if (cover) await deleteCoverImage(cover.path);
    const message = error instanceof UploadError ? error.message : "Could not save the video.";
    return NextResponse.json({ error: "Invalid submission", fieldErrors: { video: message } }, { status: 400 });
  }

  try {
    const book = await createBook({
      ...values,
      cover_image_path: cover?.path ?? null,
      cover_width: cover?.width ?? null,
      cover_height: cover?.height ?? null,
      ...video.patch,
    });
    return NextResponse.json({ success: true, book });
  } catch (error) {
    // The row was never created — don't leave the just-uploaded files behind.
    if (cover) await deleteCoverImage(cover.path);
    await deleteBookVideo(video.newUpload);
    const message = error instanceof Error ? error.message : "Could not save the book.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
