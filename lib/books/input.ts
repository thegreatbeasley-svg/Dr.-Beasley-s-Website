import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { slugify } from "@/lib/slug";
import { clean, cleanText } from "@/lib/validation";
import { saveBookCover, saveBookVideo, verifyUploadedCover, verifyUploadedVideo, UploadError } from "@/lib/resources/storage";
import { BOOK_STATUSES, type Book } from "./types";
import { MAX_RETAILERS, validateRetailers, type BookRetailer } from "./retailers";
import { checkExternalVideoUrl, type ExternalVideo } from "./video";

/** What the admin asked to do with the book's promo video. "keep" = field not sent. */
export type VideoMode = "keep" | "none" | "upload" | "external";

export type ParsedBookForm = {
  videoMode: VideoMode;
  externalVideo: ExternalVideo | null;
  values: {
    title: string;
    slug: string;
    subtitle: string | null;
    description: string;
    long_description: string | null;
    publication_year: number | null;
    status: string;
    retailers: BookRetailer[];
    published: boolean;
  };
  fieldErrors: Record<string, string>;
};

/** Parses and validates the admin book form (shared by create and update). */
export function parseBookForm(formData: FormData): ParsedBookForm {
  const fieldErrors: Record<string, string> = {};

  const title = clean(formData.get("title"), 200);
  const slug = slugify(clean(formData.get("slug"), 200) || title);
  const subtitle = clean(formData.get("subtitle"), 200);
  const description = cleanText(formData.get("description"), 1000);
  const longDescription = cleanText(formData.get("long_description"), 20000);
  const status = clean(formData.get("status"), 20);
  const published = formData.get("published") === "true";

  if (!title) fieldErrors.title = "Title is required.";
  if (!slug) fieldErrors.slug = "Slug is required.";
  if (!description) fieldErrors.description = "A short description is required.";
  if (!BOOK_STATUSES.includes(status as (typeof BOOK_STATUSES)[number])) {
    fieldErrors.status = "Choose an availability.";
  }

  let publicationYear: number | null = null;
  const yearText = clean(formData.get("publication_year"), 10);
  if (yearText) {
    const year = Number(yearText);
    if (!/^\d{4}$/.test(yearText) || year < 1000 || year > 2100) {
      fieldErrors.publication_year = "Enter a four-digit year, e.g. 2019.";
    } else {
      publicationYear = year;
    }
  }

  let retailers: BookRetailer[] = [];
  const retailersText = formData.get("retailers");
  if (typeof retailersText === "string" && retailersText.trim()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(retailersText);
    } catch {
      parsed = null;
    }
    const result = validateRetailers(parsed);
    retailers = result.retailers;
    if (result.errors.length > 0) fieldErrors.retailers = result.errors.join(" ");
  }
  if (retailers.length > MAX_RETAILERS) fieldErrors.retailers = `Add at most ${MAX_RETAILERS} retailers.`;

  let videoMode: VideoMode = "keep";
  let externalVideo: ExternalVideo | null = null;
  const modeText = clean(formData.get("video_mode"), 20);
  if (modeText) {
    if (modeText === "none" || modeText === "upload" || modeText === "external") {
      videoMode = modeText;
    } else {
      fieldErrors.video = "Choose how to add the video.";
    }
  }
  if (videoMode === "external") {
    const check = checkExternalVideoUrl(formData.get("video_external_url"));
    if (check.ok) externalVideo = check.video;
    else fieldErrors.video = check.error;
  }

  return {
    videoMode,
    externalVideo,
    values: {
      title,
      slug,
      subtitle: subtitle || null,
      description,
      long_description: longDescription || null,
      publication_year: publicationYear,
      status,
      retailers,
      published,
    },
    fieldErrors,
  };
}

export type ResolvedCover = { path: string; width: number; height: number };

/**
 * Resolves the cover submitted with the form, if any.
 *  - Supabase mode: the browser uploaded straight to storage and sends back
 *    `cover_path`, which is re-verified (size, type, real bytes) here.
 *  - Otherwise (or if a file still arrives through the route): the file is
 *    inspected and stored server-side.
 * Throws UploadError with a message safe to show the admin.
 */
export async function resolveBookCover(formData: FormData): Promise<ResolvedCover | null> {
  const coverPath = clean(formData.get("cover_path"), 200);
  if (coverPath && isSupabaseConfigured()) {
    // Signed-upload paths are always a server-generated "<uuid>.<ext>".
    if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}\.(png|jpg|webp)$/.test(coverPath)) {
      throw new UploadError("The uploaded cover reference is invalid. Please upload it again.");
    }
    const verified = await verifyUploadedCover(coverPath);
    return { path: verified.publicUrl, width: verified.width, height: verified.height };
  }
  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    return saveBookCover(cover);
  }
  return null;
}

export type VideoChange = {
  /** Columns to write; empty when the video is left as it is. */
  patch: { video_source?: string | null; video_url?: string | null };
  /** A newly stored upload — delete it again if the record then fails to save. */
  newUpload: string | null;
  /** The previous uploaded file, to delete once the record points elsewhere. */
  oldUpload: string | null;
};

/**
 * Turns the admin's video choice into column changes, verifying any new
 * MP4 BEFORE the record is touched. Throws UploadError (safe to show).
 *  - keep:     nothing changes
 *  - none:     clears the video (and later deletes an uploaded file)
 *  - external: stores the validated YouTube/Vimeo link
 *  - upload:   a new verified file replaces the current video; with no new
 *              file the current uploaded video is kept, otherwise it's an error
 */
export async function resolveVideoChange(
  formData: FormData,
  mode: VideoMode,
  external: ExternalVideo | null,
  existing: Pick<Book, "video_source" | "video_url"> | null
): Promise<VideoChange> {
  const existingUpload = existing?.video_source === "upload" ? existing.video_url : null;

  if (mode === "keep") return { patch: {}, newUpload: null, oldUpload: null };
  if (mode === "none") {
    if (!existing?.video_source) return { patch: {}, newUpload: null, oldUpload: null };
    return { patch: { video_source: null, video_url: null }, newUpload: null, oldUpload: existingUpload };
  }
  if (mode === "external" && external) {
    return {
      patch: { video_source: external.source, video_url: external.url },
      newUpload: null,
      oldUpload: existingUpload,
    };
  }

  // mode === "upload"
  let uploaded: string | null = null;
  const videoPath = clean(formData.get("video_path"), 200);
  if (videoPath && isSupabaseConfigured()) {
    if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}\.mp4$/.test(videoPath)) {
      throw new UploadError("The uploaded video reference is invalid. Please upload it again.");
    }
    uploaded = (await verifyUploadedVideo(videoPath)).publicUrl;
  } else {
    const file = formData.get("video");
    if (file instanceof File && file.size > 0) uploaded = (await saveBookVideo(file)).path;
  }
  if (uploaded) {
    return { patch: { video_source: "upload", video_url: uploaded }, newUpload: uploaded, oldUpload: existingUpload };
  }
  if (existingUpload) return { patch: {}, newUpload: null, oldUpload: null };
  throw new UploadError("Choose an MP4 file to upload.");
}

export { UploadError };
