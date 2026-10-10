import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {
  RESOURCE_FILES_DIR,
  COVER_UPLOADS_DIR,
  COVER_PUBLIC_PREFIX,
} from "@/lib/paths";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_COVER_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_COVER_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

export class UploadError extends Error {}

// ============================================================
// Direct-to-Supabase-Storage uploads (Supabase mode only)
//
// Large PDFs exceed Vercel's hard 4.5MB serverless function request-body
// limit if they're streamed through our own API route. Instead, in
// Supabase mode, the browser uploads straight to Supabase Storage using a
// short-lived, single-path, single-use signed upload URL that our server
// mints — the request body our Vercel function ever sees is just a few
// bytes of JSON, never the file itself.
//
// The bucket, storage path, permitted MIME types, and byte ceiling are
// always chosen here, server-side, from a fixed "upload kind" — never
// from anything the browser sends. The browser only ever says *which*
// kind of file it's about to upload.
// ============================================================

export type UploadKind = "resource-pdf" | "resource-cover";

type UploadKindConfig = {
  bucket: string;
  maxBytes: number;
  allowedTypes: Record<string, string>; // contentType -> file extension
};

const UPLOAD_KINDS: Record<UploadKind, UploadKindConfig> = {
  "resource-pdf": {
    bucket: "resource-files",
    maxBytes: MAX_PDF_BYTES,
    allowedTypes: { "application/pdf": ".pdf" },
  },
  "resource-cover": {
    bucket: "cover-images",
    maxBytes: MAX_COVER_BYTES,
    allowedTypes: ALLOWED_COVER_TYPES,
  },
};

function uploadKindConfig(kind: string): UploadKindConfig {
  const config = UPLOAD_KINDS[kind as UploadKind];
  if (!config) throw new UploadError("Unknown upload kind.");
  return config;
}

/**
 * Mints a short-lived, single-use signed upload URL for one specific,
 * server-generated storage path. No database row exists yet at this
 * point — if the admin abandons the upload here, nothing was ever
 * written anywhere, so there is nothing to clean up.
 */
export async function createUploadSlot(kind: string, contentType: string, claimedSize: number) {
  const config = uploadKindConfig(kind);
  if (!Number.isFinite(claimedSize) || claimedSize <= 0 || claimedSize > config.maxBytes) {
    throw new UploadError(`That file exceeds the ${Math.round(config.maxBytes / (1024 * 1024))}MB limit.`);
  }
  const extension = config.allowedTypes[contentType];
  if (!extension) {
    throw new UploadError("That file type isn't allowed.");
  }

  const path = safeFileName(extension);
  const { data, error } = await createSupabaseAdminClient()
    .storage.from(config.bucket)
    .createSignedUploadUrl(path);
  if (error || !data) {
    throw new UploadError(`Could not prepare the upload: ${error?.message ?? "unknown error"}`);
  }
  return { bucket: config.bucket, path, token: data.token };
}

/**
 * Finalization-time check: re-reads the object's *actual* stored size and
 * content type from Supabase Storage itself — never trusts whatever the
 * browser claimed when requesting the upload slot. Also sniffs the real
 * file bytes for PDFs, since a client-supplied MIME type is just a label.
 * On any failure the just-uploaded object is deleted so a failed
 * verification never leaves an orphaned file behind.
 */
export async function verifyUploadedObject(
  kind: string,
  objectPath: string
): Promise<{ size: number; contentType: string }> {
  const config = uploadKindConfig(kind);
  const supabase = createSupabaseAdminClient();

  const { data: listing, error: listError } = await supabase.storage
    .from(config.bucket)
    .list("", { search: objectPath, limit: 1 });
  if (listError) {
    throw new UploadError(`Could not verify the uploaded file: ${listError.message}`);
  }
  const object = listing?.find((entry) => entry.name === objectPath);
  if (!object) {
    throw new UploadError("The uploaded file could not be found. Please try uploading it again.");
  }

  const size = object.metadata?.size as number | undefined;
  const contentType = object.metadata?.mimetype as string | undefined;

  const reject = async (message: string): Promise<never> => {
    await supabase.storage.from(config.bucket).remove([objectPath]);
    throw new UploadError(message);
  };

  if (!size || size <= 0 || size > config.maxBytes) {
    return reject(`The uploaded file is invalid or exceeds the ${Math.round(config.maxBytes / (1024 * 1024))}MB limit.`);
  }
  if (!contentType || !config.allowedTypes[contentType]) {
    return reject("The uploaded file's type is not allowed.");
  }

  if (kind === "resource-pdf") {
    const { data: signed, error: signError } = await supabase.storage
      .from(config.bucket)
      .createSignedUrl(objectPath, 60);
    if (signError || !signed) {
      return reject("Could not verify the uploaded file.");
    }
    const head = await fetch(signed.signedUrl, { headers: { Range: "bytes=0-4" } });
    const headBytes = Buffer.from(await head.arrayBuffer());
    if (headBytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return reject("That file doesn't look like a valid PDF.");
    }
  }

  return { size, contentType };
}

/** Deletes a just-uploaded object that a failed finalization must not keep. */
export async function deleteUploadedObject(kind: string, objectPath: string) {
  const config = UPLOAD_KINDS[kind as UploadKind];
  if (!config) return;
  await createSupabaseAdminClient().storage.from(config.bucket).remove([objectPath]);
}

/** Converts a verified cover-images object path into its stored public URL form. */
export function getUploadedCoverPublicUrl(objectPath: string) {
  const { data } = createSupabaseAdminClient().storage.from("cover-images").getPublicUrl(objectPath);
  return data.publicUrl;
}

/**
 * Every uploaded file gets a fresh, server-generated name — the visitor's
 * original filename and any path segments in it are discarded entirely.
 * This is what actually prevents path traversal and collisions; it does
 * not depend on "sanitizing" the untrusted name.
 */
function safeFileName(extension: string) {
  return `${crypto.randomUUID()}${extension}`;
}

export async function saveResourceFile(file: File): Promise<{ fileName: string; size: number }> {
  if (!(file instanceof File) || file.size === 0) {
    throw new UploadError("A PDF file is required.");
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new UploadError("The resource file must be 25MB or smaller.");
  }
  const looksLikePdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!looksLikePdf) {
    throw new UploadError("Only PDF files are accepted for resources.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // Confirm the actual bytes are a PDF (starts with %PDF-) rather than
  // trusting the browser-supplied MIME type or file extension alone.
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new UploadError("That file doesn't look like a valid PDF.");
  }

  const fileName = safeFileName(".pdf");
  if (isSupabaseConfigured()) {
    const { error } = await createSupabaseAdminClient().storage
      .from("resource-files")
      .upload(fileName, buffer, { contentType: "application/pdf", upsert: false });
    if (error) throw new UploadError(`Could not store the PDF: ${error.message}`);
    return { fileName, size: buffer.byteLength };
  }
  await fs.writeFile(path.join(RESOURCE_FILES_DIR, fileName), buffer);
  return { fileName, size: buffer.byteLength };
}

export async function saveCoverImage(file: File): Promise<{ path: string }> {
  if (!(file instanceof File) || file.size === 0) {
    throw new UploadError("Cover image is empty.");
  }
  if (file.size > MAX_COVER_BYTES) {
    throw new UploadError("Cover images must be 5MB or smaller.");
  }
  const extension = ALLOWED_COVER_TYPES[file.type];
  if (!extension) {
    throw new UploadError("Cover images must be PNG, JPEG, or WebP.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = safeFileName(extension);
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage
      .from("cover-images")
      .upload(fileName, buffer, { contentType: file.type, upsert: false });
    if (error) throw new UploadError(`Could not store the cover: ${error.message}`);
    const { data } = supabase.storage.from("cover-images").getPublicUrl(fileName);
    return { path: data.publicUrl };
  }
  // COVER_UPLOADS_DIR is a fixed constant (public/uploads/covers) and
  // fileName is always our own server-generated UUID — this is not a
  // user-controlled path. The ignore comment stops Turbopack from
  // defensively tracing (and bundling) the entire /public folder because
  // this write target happens to live under it.
  await fs.writeFile(path.join(/* turbopackIgnore: true */ COVER_UPLOADS_DIR, fileName), buffer);
  return { path: `${COVER_PUBLIC_PREFIX}/${fileName}` };
}

/** Returns false (never throws) if the object could not be removed. */
export async function deleteResourceFile(fileName: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await createSupabaseAdminClient().storage.from("resource-files").remove([fileName]);
    return !error;
  }
  try {
    await fs.unlink(path.join(RESOURCE_FILES_DIR, fileName));
    return true;
  } catch (error) {
    // Best-effort cleanup; a file that is already gone is not a failure.
    return (error as NodeJS.ErrnoException).code === "ENOENT";
  }
}

/** Returns false (never throws) if a cover we own could not be removed. */
export async function deleteCoverImage(coverPath: string | null): Promise<boolean> {
  if (isSupabaseConfigured()) {
    if (!coverPath) return true;
    const marker = "/cover-images/";
    const markerIndex = coverPath.indexOf(marker);
    if (markerIndex === -1) return true; // not an object we own
    const objectPath = coverPath.slice(markerIndex + marker.length);
    if (!objectPath || objectPath.includes("..")) return true;
    const { error } = await createSupabaseAdminClient().storage.from("cover-images").remove([objectPath]);
    return !error;
  }
  if (!coverPath || !coverPath.startsWith(COVER_PUBLIC_PREFIX)) return true;
  const fileName = coverPath.slice(COVER_PUBLIC_PREFIX.length + 1);
  // Guard against a stray ".." even though these paths are always
  // server-generated — belt and suspenders for a function that deletes.
  if (fileName.includes("..") || fileName.includes("/")) return true;
  try {
    await fs.unlink(path.join(COVER_UPLOADS_DIR, fileName));
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ENOENT";
  }
}

// getResourceCoverUrl lives in ./cover.ts — it's pure (no fs/server-only)
// so client components can import it without pulling this file in too.
