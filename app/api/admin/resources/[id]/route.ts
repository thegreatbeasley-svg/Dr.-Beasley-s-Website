import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/session";
import {
  getResourceById,
  isSlugTaken,
  slugify,
  updateResource,
  replaceResourceFile,
  replaceCoverImage,
} from "@/lib/resources/queries";
import {
  saveResourceFile,
  saveCoverImage,
  verifyUploadedObject,
  deleteUploadedObject,
  getUploadedCoverPublicUrl,
  UploadError,
} from "@/lib/resources/storage";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { RESOURCE_TYPES } from "@/lib/resources/types";
import { clean } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

/** Quick toggles from the resources table: publish/unpublish, feature/unfeature. */
export async function PATCH(req: Request, { params }: Context) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getResourceById(id);
  if (!existing) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
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

  const resource = await updateResource(id, patch);
  return NextResponse.json({ success: true, resource });
}

/** Full edit form: fields plus an optional replacement file and/or cover. */
export async function PUT(req: Request, { params }: Context) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getResourceById(id);
  if (!existing) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
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

  if (await isSlugTaken(slug, id)) {
    return NextResponse.json(
      { error: "Invalid submission", fieldErrors: { slug: "That slug is already in use." } },
      { status: 400 }
    );
  }

  await updateResource(id, {
    title,
    slug,
    short_description: shortDescription,
    long_description: longDescription || null,
    resource_type: resourceType,
    file_name: `${slug}.pdf`,
    published,
    featured,
  });

  if (isSupabaseConfigured()) {
    // The browser already uploaded any replacement file/cover directly to
    // Supabase Storage; the form sends back raw storage paths, which are
    // independently re-verified here before the existing file is ever
    // replaced. The OLD object is only deleted once replaceResourceFile /
    // replaceCoverImage has successfully pointed the row at the new one.
    const filePath = clean(formData.get("file_path"), 200);
    if (filePath) {
      try {
        const verified = await verifyUploadedObject("resource-pdf", filePath);
        await replaceResourceFile(id, filePath, verified.size);
      } catch (error) {
        await deleteUploadedObject("resource-pdf", filePath);
        const message = error instanceof UploadError ? error.message : "Could not save the uploaded file.";
        return NextResponse.json({ error: "Invalid submission", fieldErrors: { file: message } }, { status: 400 });
      }
    }

    const coverPath = clean(formData.get("cover_path"), 200);
    if (coverPath) {
      try {
        await verifyUploadedObject("resource-cover", coverPath);
        await replaceCoverImage(id, getUploadedCoverPublicUrl(coverPath));
      } catch (error) {
        await deleteUploadedObject("resource-cover", coverPath);
        const message = error instanceof UploadError ? error.message : "Could not save the cover image.";
        return NextResponse.json({ error: "Invalid submission", fieldErrors: { cover: message } }, { status: 400 });
      }
    }
  } else {
    if (file instanceof File && file.size > 0) {
      try {
        const saved = await saveResourceFile(file);
        await replaceResourceFile(id, saved.fileName, saved.size);
      } catch (error) {
        const message = error instanceof UploadError ? error.message : "Could not save the uploaded file.";
        return NextResponse.json({ error: "Invalid submission", fieldErrors: { file: message } }, { status: 400 });
      }
    }

    if (cover instanceof File && cover.size > 0) {
      try {
        const saved = await saveCoverImage(cover);
        await replaceCoverImage(id, saved.path);
      } catch (error) {
        const message = error instanceof UploadError ? error.message : "Could not save the cover image.";
        return NextResponse.json({ error: "Invalid submission", fieldErrors: { cover: message } }, { status: 400 });
      }
    }
  }

  return NextResponse.json({ success: true, resource: await getResourceById(id) });
}
