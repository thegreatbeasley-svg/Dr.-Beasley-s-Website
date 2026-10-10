import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/session";
import { createResource, isSlugTaken, slugify } from "@/lib/resources/queries";
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
import { newUploadRequestId, logUploadStage, errorClass } from "@/lib/resources/upload-log";

export async function POST(req: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = newUploadRequestId();
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

  if (await isSlugTaken(slug)) {
    return NextResponse.json(
      { error: "Invalid submission", fieldErrors: { slug: "That slug is already in use." } },
      { status: 400 }
    );
  }

  const supabaseMode = isSupabaseConfigured();
  let fileName: string;
  let fileSize: number;
  let coverImagePath: string | null = null;
  let coverObjectPath: string | null = null; // raw storage path, for cleanup only

  if (supabaseMode) {
    // The browser already uploaded the PDF (and optional cover) directly
    // to Supabase Storage; the form sends back only the raw storage
    // paths. Nothing is trusted from that upload until it's independently
    // re-verified here against the object Supabase actually stored.
    const filePath = clean(formData.get("file_path"), 200);
    if (!filePath) {
      // A multipart "file" arriving here means the form ran in server
      // upload mode against a Supabase backend (directUpload was false).
      logUploadStage({
        stage: formData.get("file") ? "finalize:mode-mismatch" : "finalize:no-file-path",
        requestId,
        status: 400,
        mode: "direct",
      });
      return NextResponse.json(
        { error: "Invalid submission", fieldErrors: { file: "A PDF file is required." } },
        { status: 400 }
      );
    }
    try {
      const verified = await verifyUploadedObject("resource-pdf", filePath);
      fileName = filePath;
      fileSize = verified.size;
      logUploadStage({ stage: "finalize:verified", requestId, kind: "resource-pdf", mode: "direct" });
    } catch (error) {
      logUploadStage({ stage: "finalize:verify-failed", requestId, status: 400, kind: "resource-pdf", errorClass: errorClass(error) });
      const message = error instanceof UploadError ? error.message : "Could not verify the uploaded file.";
      return NextResponse.json({ error: "Invalid submission", fieldErrors: { file: message } }, { status: 400 });
    }

    const coverPath = clean(formData.get("cover_path"), 200);
    if (coverPath) {
      try {
        await verifyUploadedObject("resource-cover", coverPath);
        coverObjectPath = coverPath;
        coverImagePath = getUploadedCoverPublicUrl(coverPath);
      } catch (error) {
        await deleteUploadedObject("resource-pdf", fileName);
        const message = error instanceof UploadError ? error.message : "Could not verify the uploaded cover image.";
        return NextResponse.json({ error: "Invalid submission", fieldErrors: { cover: message } }, { status: 400 });
      }
    }
  } else {
    try {
      const saved = await saveResourceFile(file as File);
      fileName = saved.fileName;
      fileSize = saved.size;
    } catch (error) {
      const message = error instanceof UploadError ? error.message : "Could not save the uploaded file.";
      return NextResponse.json({ error: "Invalid submission", fieldErrors: { file: message } }, { status: 400 });
    }

    if (cover instanceof File && cover.size > 0) {
      try {
        const saved = await saveCoverImage(cover);
        coverImagePath = saved.path;
      } catch (error) {
        const message = error instanceof UploadError ? error.message : "Could not save the cover image.";
        return NextResponse.json({ error: "Invalid submission", fieldErrors: { cover: message } }, { status: 400 });
      }
    }
  }

  try {
    const resource = await createResource({
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
    logUploadStage({ stage: "finalize:created", requestId, status: 200, mode: supabaseMode ? "direct" : "server" });
    return NextResponse.json({ success: true, resource });
  } catch (error) {
    logUploadStage({ stage: "finalize:create-failed", requestId, status: 500, errorClass: errorClass(error) });
    // The row was never created — remove only the objects uploaded for
    // THIS attempt so a failed finalization never leaves an orphan.
    if (supabaseMode) {
      await deleteUploadedObject("resource-pdf", fileName);
      if (coverObjectPath) await deleteUploadedObject("resource-cover", coverObjectPath);
    }
    const message = error instanceof Error ? error.message : "Could not save the resource.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
