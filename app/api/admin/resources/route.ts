import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/session";
import { createResource, isSlugTaken, slugify } from "@/lib/resources/queries";
import { saveResourceFile, saveCoverImage, UploadError } from "@/lib/resources/storage";
import { RESOURCE_TYPES } from "@/lib/resources/types";
import { clean } from "@/lib/validation";

export async function POST(req: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();

  const title = clean(formData.get("title"), 200);
  const slugInput = clean(formData.get("slug"), 200);
  const shortDescription = clean(formData.get("short_description"), 500);
  const longDescription = clean(formData.get("long_description"), 4000);
  const resourceType = clean(formData.get("resource_type"), 40);
  const published = formData.get("published") === "true";
  const featured = formData.get("featured") === "true";
  const file = formData.get("file");
  const cover = formData.get("cover");

  const slug = slugify(slugInput || title);

  const errors: Record<string, string> = {};
  if (!title) errors.title = "Title is required.";
  if (!slug) errors.slug = "Slug is required.";
  if (!shortDescription) errors.short_description = "Short description is required.";
  if (!RESOURCE_TYPES.includes(resourceType as (typeof RESOURCE_TYPES)[number])) {
    errors.resource_type = "Choose a resource type.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors: errors }, { status: 400 });
  }

  if (isSlugTaken(slug)) {
    return NextResponse.json(
      { error: "Invalid submission", fieldErrors: { slug: "That slug is already in use." } },
      { status: 400 }
    );
  }

  let fileName: string;
  let fileSize: number;
  try {
    const saved = await saveResourceFile(file as File);
    fileName = saved.fileName;
    fileSize = saved.size;
  } catch (error) {
    const message = error instanceof UploadError ? error.message : "Could not save the uploaded file.";
    return NextResponse.json({ error: "Invalid submission", fieldErrors: { file: message } }, { status: 400 });
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

  const resource = createResource({
    title,
    slug,
    short_description: shortDescription,
    long_description: longDescription || null,
    resource_type: resourceType,
    file_path: fileName,
    file_name: `${slug}.pdf`,
    file_size: fileSize,
    cover_image_path: coverImagePath,
    is_demo_content: false,
    published,
    featured,
  });

  return NextResponse.json({ success: true, resource });
}
