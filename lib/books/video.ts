/**
 * Promotional video for a book — at most one, either an uploaded MP4 or a
 * YouTube/Vimeo link. Safe to import from client components.
 *
 * Stored on the book as two columns:
 *   video_source: "upload" | "youtube" | "vimeo"
 *   video_url:    public storage URL (upload) or the normalized watch URL.
 *
 * Only these two providers are ever accepted, and embed URLs are rebuilt
 * from the validated id — a stored URL is never embedded as-is.
 */

export const VIDEO_SOURCES = ["upload", "youtube", "vimeo"] as const;
export type VideoSource = (typeof VIDEO_SOURCES)[number];
export type ExternalVideoSource = Exclude<VideoSource, "upload">;

export type ExternalVideo = { source: ExternalVideoSource; url: string };

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);

export type ExternalVideoCheck = { ok: true; video: ExternalVideo } | { ok: false; error: string };

/** Validates a pasted YouTube or Vimeo link and returns its normalized form. */
export function checkExternalVideoUrl(input: unknown): ExternalVideoCheck {
  const text = typeof input === "string" ? input.trim() : "";
  if (!text) return { ok: false, error: "Paste a YouTube or Vimeo link." };
  if (text.length > 300) return { ok: false, error: "That link is too long." };

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, error: "That isn't a valid link (include https://)." };
  }
  if (url.protocol !== "https:") return { ok: false, error: "The link must start with https://." };
  if (url.username || url.password || url.port) return { ok: false, error: "That link isn't a standard YouTube or Vimeo address." };
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  // ---- YouTube
  let youtubeId: string | null = null;
  if (host === "youtu.be") {
    youtubeId = segments[0] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (segments[0] === "watch") youtubeId = url.searchParams.get("v");
    else if (["embed", "shorts", "live", "v"].includes(segments[0])) youtubeId = segments[1] ?? null;
  }
  if (youtubeId !== null) {
    if (!YOUTUBE_ID.test(youtubeId)) return { ok: false, error: "That doesn't look like a link to a single YouTube video." };
    return { ok: true, video: { source: "youtube", url: `https://www.youtube.com/watch?v=${youtubeId}` } };
  }

  // ---- Vimeo
  if (VIMEO_HOSTS.has(host)) {
    // vimeo.com/123456789 · vimeo.com/123456789/abcdef1234 (unlisted) · vimeo.com/channels/x/123456789
    // · player.vimeo.com/video/123456789?h=abcdef1234
    const numeric = segments.findIndex((s) => /^\d{5,12}$/.test(s));
    if (numeric !== -1 && (host !== "player.vimeo.com" || segments[0] === "video")) {
      const id = segments[numeric];
      const hash = segments[numeric + 1] ?? url.searchParams.get("h") ?? "";
      if (hash && !/^[a-f0-9]{8,16}$/i.test(hash)) return { ok: false, error: "That Vimeo link has an unexpected format." };
      return { ok: true, video: { source: "vimeo", url: `https://vimeo.com/${id}${hash ? `/${hash}` : ""}` } };
    }
    return { ok: false, error: "That doesn't look like a link to a single Vimeo video." };
  }

  return { ok: false, error: "Only YouTube and Vimeo links are supported." };
}

export type VideoEmbed =
  | { kind: "file"; src: string }
  | { kind: "external"; provider: "YouTube" | "Vimeo"; embedUrl: string };

/**
 * What the public page may render for a book's video, or null.
 * Rebuilt from validated parts; stored URLs are never trusted as-is.
 */
export function getVideoEmbed(book: { video_source: string | null; video_url: string | null }): VideoEmbed | null {
  if (!book.video_source || !book.video_url) return null;

  if (book.video_source === "upload") {
    try {
      const u = new URL(book.video_url, "http://local.invalid");
      // Same-site upload path (local demo) or an https storage URL.
      const local = book.video_url.startsWith("/") && !book.video_url.startsWith("//");
      if (!local && u.protocol !== "https:" && u.protocol !== "http:") return null;
      if (!/\.mp4$/i.test(u.pathname)) return null;
      return { kind: "file", src: book.video_url };
    } catch {
      return null;
    }
  }

  const check = checkExternalVideoUrl(book.video_url);
  if (!check.ok || check.video.source !== book.video_source) return null;
  if (check.video.source === "youtube") {
    const id = new URL(check.video.url).searchParams.get("v")!;
    return { kind: "external", provider: "YouTube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0` };
  }
  const [id, hash] = new URL(check.video.url).pathname.split("/").filter(Boolean);
  return {
    kind: "external",
    provider: "Vimeo",
    embedUrl: `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}&dnt=1` : "?dnt=1"}`,
  };
}

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // matches Supabase's free-plan per-file ceiling
