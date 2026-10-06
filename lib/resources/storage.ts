import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {
  RESOURCE_FILES_DIR,
  COVER_UPLOADS_DIR,
  COVER_PUBLIC_PREFIX,
} from "@/lib/paths";

const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_COVER_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_COVER_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

export class UploadError extends Error {}

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
  // COVER_UPLOADS_DIR is a fixed constant (public/uploads/covers) and
  // fileName is always our own server-generated UUID — this is not a
  // user-controlled path. The ignore comment stops Turbopack from
  // defensively tracing (and bundling) the entire /public folder because
  // this write target happens to live under it.
  await fs.writeFile(path.join(/* turbopackIgnore: true */ COVER_UPLOADS_DIR, fileName), buffer);
  return { path: `${COVER_PUBLIC_PREFIX}/${fileName}` };
}

export async function deleteResourceFile(fileName: string) {
  try {
    await fs.unlink(path.join(RESOURCE_FILES_DIR, fileName));
  } catch {
    // Best-effort cleanup; a missing file is not a failure for the caller.
  }
}

export async function deleteCoverImage(coverPath: string | null) {
  if (!coverPath || !coverPath.startsWith(COVER_PUBLIC_PREFIX)) return;
  const fileName = coverPath.slice(COVER_PUBLIC_PREFIX.length + 1);
  // Guard against a stray ".." even though these paths are always
  // server-generated — belt and suspenders for a function that deletes.
  if (fileName.includes("..") || fileName.includes("/")) return;
  try {
    await fs.unlink(path.join(COVER_UPLOADS_DIR, fileName));
  } catch {
    // Best-effort cleanup.
  }
}

// getResourceCoverUrl lives in ./cover.ts — it's pure (no fs/server-only)
// so client components can import it without pulling this file in too.
