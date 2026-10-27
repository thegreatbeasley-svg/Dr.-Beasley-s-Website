"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BOOK_STATUS_LABELS } from "@/lib/books/types";
import type { Book } from "@/lib/books/types";
import { MAX_RETAILERS, MAX_RETAILER_NAME_LENGTH } from "@/lib/books/retailers";
import { checkExternalVideoUrl, MAX_VIDEO_BYTES } from "@/lib/books/video";
import { readJson, statusHint, uploadDirectly } from "./direct-upload";
import FormattingHint from "./FormattingHint";

type Props = {
  mode: "create" | "edit";
  bookId?: string;
  initial?: Book;
  /**
   * True only in Supabase mode (decided server-side by the page). The cover
   * and video then go straight to Supabase Storage via signed URLs, because
   * Vercel rejects request bodies over 4.5MB.
   */
  directUpload?: boolean;
};

type RetailerRow = { id: number; name: string; url: string };
type VideoMode = "none" | "upload" | "external";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-gold focus:outline-none";
const labelClass = "mb-2 block text-sm text-paper-muted";
const smallButton =
  "rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-paper-muted transition-colors hover:border-gold hover:text-paper disabled:cursor-not-allowed disabled:opacity-40";
const sectionClass = "space-y-6 border-t border-white/10 pt-8";
const headingClass = "text-lg font-medium text-paper";

const COVER_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const SHORT_LIMIT = 1000;
const VIDEO_MB = Math.round(MAX_VIDEO_BYTES / (1024 * 1024));

// Legacy "draft" availability (from before publish state was separate) shows as Available.
const AVAILABILITY_OPTIONS = ["available", "coming_soon"] as const;

let rowCounter = 0;
const newRow = (r?: Partial<RetailerRow>): RetailerRow => ({ id: ++rowCounter, name: "", url: "", ...r });

function initialVideoMode(book?: Book): VideoMode {
  if (book?.video_source === "upload") return "upload";
  if (book?.video_source === "youtube" || book?.video_source === "vimeo") return "external";
  return "none";
}

export default function BookForm({ mode, bookId, initial, directUpload = false }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [progress, setProgress] = React.useState("");
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  // 1 — Book information
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(Boolean(initial?.slug));
  const [subtitle, setSubtitle] = React.useState(initial?.subtitle ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [longDescription, setLongDescription] = React.useState(initial?.long_description ?? "");
  const [year, setYear] = React.useState(initial?.publication_year ? String(initial.publication_year) : "");
  const [status, setStatus] = React.useState<string>(initial?.status === "coming_soon" ? "coming_soon" : "available");

  // 2 — Cover
  const [cover, setCover] = React.useState<File | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);

  // 3 — Where to buy (always starts with one row so "Add Another Retailer" reads naturally)
  const [retailers, setRetailers] = React.useState<RetailerRow[]>(() => {
    const rows = (initial?.retailers ?? []).map((r) => newRow({ name: r.name, url: r.url }));
    return rows.length > 0 ? rows : [newRow()];
  });

  // 4 — Video
  const [videoMode, setVideoMode] = React.useState<VideoMode>(initialVideoMode(initial));
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [videoPreview, setVideoPreview] = React.useState<string | null>(null);
  const [externalUrl, setExternalUrl] = React.useState(initial?.video_source && initial.video_source !== "upload" ? (initial.video_url ?? "") : "");

  // 5 — Publication
  const [published, setPublished] = React.useState(initial?.published ?? false);

  // Frees temporary preview URLs when they change or the form unmounts.
  React.useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);
  React.useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [videoPreview]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) {
      setSlug(
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
      );
    }
  };

  const setFieldError = (name: string, message: string) => setFieldErrors((prev) => ({ ...prev, [name]: message }));

  const handleCoverChange = (file: File | null) => {
    setFieldError("cover", "");
    if (file && !COVER_TYPES.includes(file.type)) {
      setFieldError("cover", "Cover images must be PNG, JPEG, or WebP.");
      setCover(null);
      setCoverPreview(null);
      return;
    }
    if (file && file.size > MAX_COVER_BYTES) {
      setFieldError("cover", "Cover images must be 5MB or smaller.");
      setCover(null);
      setCoverPreview(null);
      return;
    }
    setCover(file);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleVideoChange = (file: File | null) => {
    setFieldError("video", "");
    if (file && file.type !== "video/mp4") {
      setFieldError("video", "Only MP4 videos are accepted.");
      setVideoFile(null);
      setVideoPreview(null);
      return;
    }
    if (file && file.size > MAX_VIDEO_BYTES) {
      setFieldError("video", `Videos must be ${VIDEO_MB}MB or smaller.`);
      setVideoFile(null);
      setVideoPreview(null);
      return;
    }
    setVideoFile(file);
    setVideoPreview(file ? URL.createObjectURL(file) : null);
  };

  const updateRow = (id: number, patch: Partial<RetailerRow>) =>
    setRetailers((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const moveRow = (index: number, delta: number) =>
    setRetailers((rows) => {
      const next = [...rows];
      const target = index + delta;
      if (target < 0 || target >= next.length) return rows;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const externalCheck = externalUrl.trim() ? checkExternalVideoUrl(externalUrl) : null;
  const existingUpload = initial?.video_source === "upload" ? initial.video_url : null;

  const submit = async (andPreview: boolean) => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    const formData = new FormData();
    formData.set("title", title);
    formData.set("slug", slug);
    formData.set("subtitle", subtitle);
    formData.set("description", description);
    formData.set("long_description", longDescription);
    formData.set("publication_year", year);
    formData.set("status", status);
    formData.set("published", String(published));
    formData.set("retailers", JSON.stringify(retailers.map((r) => ({ name: r.name, url: r.url }))));
    formData.set("video_mode", videoMode);
    if (videoMode === "external") formData.set("video_external_url", externalUrl);

    try {
      if (cover) {
        if (directUpload) formData.set("cover_path", await uploadDirectly("book-cover", cover, setProgress));
        else formData.set("cover", cover);
      }
      if (videoMode === "upload" && videoFile) {
        if (directUpload) formData.set("video_path", await uploadDirectly("book-video", videoFile, setProgress));
        else formData.set("video", videoFile);
      }
      setProgress("Saving…");
      const res = await fetch(mode === "create" ? "/api/admin/books" : `/api/admin/books/${bookId}`, {
        method: mode === "create" ? "POST" : "PUT",
        body: formData,
      });
      const data = await readJson(res);
      if (!res.ok) {
        setFieldErrors(data.fieldErrors || {});
        setError(data.error || `Saving failed (${statusHint(res.status)}).`);
        setSubmitting(false);
        setProgress("");
        return;
      }
      const savedId = (data as { book?: { id?: string } }).book?.id ?? bookId;
      router.push(andPreview && savedId ? `/admin/books/${savedId}/preview` : "/admin/books");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Something went wrong. Please check your connection and try again."
      );
      setSubmitting(false);
      setProgress("");
    }
  };

  const shownCover = coverPreview ?? initial?.cover_image_path ?? null;
  const fieldError = (name: string) =>
    fieldErrors[name] ? <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors[name]}</p> : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit(false);
      }}
      className="max-w-2xl space-y-10"
    >
      {/* 1 — Book information */}
      <section className="space-y-6" aria-labelledby="sec-info">
        <h2 id="sec-info" className={headingClass}>
          1. Book information
        </h2>
        <div>
          <label htmlFor="title" className={labelClass}>
            Title
          </label>
          <input id="title" type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} className={inputClass} required maxLength={200} />
          {fieldError("title")}
        </div>

        <div>
          <label htmlFor="subtitle" className={labelClass}>
            Subtitle <span className="text-paper-muted/60">(optional)</span>
          </label>
          <input id="subtitle" type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inputClass} maxLength={200} />
          {fieldError("subtitle")}
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Short description
          </label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={4} maxLength={SHORT_LIMIT} required />
          <p className="mt-1 text-xs text-paper-muted">
            Shown on the Books page and in search/social previews. {description.length}/{SHORT_LIMIT}
          </p>
          {fieldError("description")}
        </div>

        <div>
          <label htmlFor="long_description" className={labelClass}>
            Longer description <span className="text-paper-muted/60">(optional)</span>
          </label>
          <textarea id="long_description" value={longDescription} onChange={(e) => setLongDescription(e.target.value)} className={inputClass} rows={9} maxLength={20000} />
          <FormattingHint headings={false} />
          <p className="mt-1 text-xs text-paper-muted">Shown on the book&rsquo;s own page, after the short description.</p>
          {fieldError("long_description")}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="year" className={labelClass}>
              Publication year <span className="text-paper-muted/60">(optional)</span>
            </label>
            <input id="year" type="text" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} className={inputClass} placeholder="e.g. 2019" maxLength={4} />
            {fieldError("publication_year")}
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>
              Availability
            </label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              {AVAILABILITY_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {BOOK_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            {fieldError("status")}
          </div>
        </div>

        <div>
          <label htmlFor="slug" className={labelClass}>
            Page address
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-paper-muted">/books/</span>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className={inputClass}
              required
            />
          </div>
          {fieldError("slug")}
        </div>
      </section>

      {/* 2 — Cover */}
      <section className={sectionClass} aria-labelledby="sec-cover">
        <h2 id="sec-cover" className={headingClass}>
          2. Book cover
        </h2>
        <div>
          <label htmlFor="cover" className={labelClass}>
            Cover image <span className="text-paper-muted/60">(PNG, JPEG or WebP, up to 5MB, at least 200px per side)</span>
          </label>
          <div className="flex flex-wrap items-start gap-6">
            {shownCover ? (
              <div className="w-32 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-side preview of an arbitrary upload */}
                <img src={shownCover} alt={coverPreview ? "Preview of the selected cover" : "Current cover"} className="w-full rounded-sm border border-white/15 shadow-lg" />
                <p className="mt-2 text-xs text-paper-muted">{coverPreview ? "New cover (not saved yet)" : "Current cover"}</p>
              </div>
            ) : (
              <div className="flex h-44 w-32 shrink-0 items-center justify-center rounded-sm border border-dashed border-white/20 px-3 text-center text-xs text-paper-muted">
                No cover yet
              </div>
            )}
            <div className="min-w-0 flex-1">
              <input
                id="cover"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleCoverChange(e.target.files?.[0] ?? null)}
                className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-gold/20 file:px-4 file:py-2 file:text-paper`}
              />
              <p className="mt-2 text-xs text-paper-muted">
                {initial?.cover_image_path
                  ? "Choose a file to replace the current cover. The old file is removed once the new one is saved."
                  : "The cover is shown at its original proportions."}
              </p>
              {fieldError("cover")}
            </div>
          </div>
        </div>
      </section>

      {/* 3 — Where to buy */}
      <section className={sectionClass} aria-labelledby="sec-buy">
        <div>
          <h2 id="sec-buy" className={headingClass}>
            3. Where to buy
          </h2>
          <p className="mt-1 text-sm text-paper-muted">
            Add any store, platform or bookshop that sells this book — anywhere in the world. Type its name as you want
            it shown and paste the direct https link to the book. Only what you enter here is displayed, in this order.
          </p>
        </div>

        <ul className="space-y-4">
          {retailers.map((row, index) => (
            <li key={row.id} className="rounded-xl border border-white/10 bg-ink-elevated p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`rname-${row.id}`} className="mb-1 block text-xs text-paper-muted">
                    Retailer / platform name
                  </label>
                  <input
                    id={`rname-${row.id}`}
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Kobo"
                    maxLength={MAX_RETAILER_NAME_LENGTH}
                  />
                </div>
                <div>
                  <label htmlFor={`rurl-${row.id}`} className="mb-1 block text-xs text-paper-muted">
                    Book URL
                  </label>
                  <input
                    id={`rurl-${row.id}`}
                    type="text"
                    inputMode="url"
                    value={row.url}
                    onChange={(e) => updateRow(row.id, { url: e.target.value })}
                    className={inputClass}
                    placeholder="https://…"
                    maxLength={500}
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={smallButton} onClick={() => moveRow(index, -1)} disabled={index === 0} aria-label={`Move retailer ${index + 1} up`}>
                  ↑ Up
                </button>
                <button type="button" className={smallButton} onClick={() => moveRow(index, 1)} disabled={index === retailers.length - 1} aria-label={`Move retailer ${index + 1} down`}>
                  ↓ Down
                </button>
                <button type="button" className={smallButton} onClick={() => setRetailers((rows) => rows.filter((r) => r.id !== row.id))} aria-label={`Remove retailer ${index + 1}`}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
        {retailers.length < MAX_RETAILERS ? (
          <button type="button" className={smallButton} onClick={() => setRetailers((rows) => [...rows, newRow()])}>
            + {retailers.length === 0 ? "Add a Retailer" : "Add Another Retailer"}
          </button>
        ) : (
          <p className="text-xs text-paper-muted">You&rsquo;ve reached the limit of {MAX_RETAILERS} retailers.</p>
        )}
        {fieldError("retailers")}
      </section>

      {/* 4 — Promotional video */}
      <section className={sectionClass} aria-labelledby="sec-video">
        <div>
          <h2 id="sec-video" className={headingClass}>
            4. Promotional video <span className="text-sm font-normal text-paper-muted">(optional)</span>
          </h2>
          <p className="mt-1 text-sm text-paper-muted">
            One video per book, shown below its details. It never plays automatically.
          </p>
        </div>

        <fieldset className="space-y-3">
          <legend className="sr-only">Video source</legend>
          {(
            [
              ["none", "No video"],
              ["upload", `Upload an MP4 (up to ${VIDEO_MB}MB)`],
              ["external", "Use a YouTube or Vimeo link"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-3">
              <input type="radio" name="video_mode" value={value} checked={videoMode === value} onChange={() => { setVideoMode(value); setFieldError("video", ""); }} className="h-4 w-4 accent-tangerine" />
              <span className="text-sm text-paper">{label}</span>
            </label>
          ))}
        </fieldset>

        {videoMode === "none" && existingUpload && (
          <p className="text-xs text-tangerine-hover">The current uploaded video will be removed when you save.</p>
        )}
        {videoMode === "none" && initial?.video_source && initial.video_source !== "upload" && (
          <p className="text-xs text-tangerine-hover">The current video link will be removed when you save.</p>
        )}

        {videoMode === "upload" && (
          <div>
            {(videoPreview || existingUpload) && (
              <div className="mb-4 max-w-md">
                <video controls preload="metadata" src={videoPreview ?? existingUpload ?? undefined} className="aspect-video w-full rounded-sm bg-black ring-1 ring-white/15" />
                <p className="mt-2 text-xs text-paper-muted">{videoPreview ? "New video (not saved yet)" : "Current video"}</p>
              </div>
            )}
            <label htmlFor="video" className={labelClass}>
              {existingUpload ? "Replace the video" : "MP4 file"}
            </label>
            <input
              id="video"
              type="file"
              accept="video/mp4"
              onChange={(e) => handleVideoChange(e.target.files?.[0] ?? null)}
              className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-gold/20 file:px-4 file:py-2 file:text-paper`}
            />
            <p className="mt-2 text-xs text-paper-muted">
              MP4 (H.264) only, up to {VIDEO_MB}MB.{" "}
              {existingUpload ? "Leave empty to keep the current video." : ""}
            </p>
          </div>
        )}

        {videoMode === "external" && (
          <div>
            <label htmlFor="video_url" className={labelClass}>
              YouTube or Vimeo link
            </label>
            <input id="video_url" type="text" inputMode="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} className={inputClass} placeholder="https://www.youtube.com/watch?v=…  or  https://vimeo.com/…" maxLength={300} />
            {externalCheck?.ok && (
              <p className="mt-2 text-xs text-gold">
                {externalCheck.video.source === "youtube" ? "YouTube" : "Vimeo"} video recognised.
              </p>
            )}
            {externalCheck && !externalCheck.ok && <p className="mt-2 text-xs text-tangerine-hover">{externalCheck.error}</p>}
          </div>
        )}
        {fieldError("video")}
      </section>

      {/* 5 — Publication */}
      <section className={sectionClass} aria-labelledby="sec-pub">
        <h2 id="sec-pub" className={headingClass}>
          5. Publication
        </h2>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-4">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="mt-1 h-4 w-4 accent-tangerine" />
          <span>
            <span className="block text-sm text-paper">Published — visible on the public Books page</span>
            <span className="block text-xs text-paper-muted">
              Leave unticked to keep this book as a draft that only you can see. Use &ldquo;Save and preview&rdquo; to
              check exactly how it will look before publishing.
            </span>
          </span>
        </label>

        {error && (
          <p className="text-sm text-tangerine-hover" role="alert">
            {error}
          </p>
        )}
        {submitting && progress && (
          <p className="text-sm text-paper-muted" role="status">
            {progress}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : mode === "create" ? (published ? "Create and publish" : "Save as draft") : "Save changes"}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit(true)}
            className="rounded-full border border-gold px-8 py-4 text-sm font-semibold uppercase tracking-widest text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save and preview
          </button>
        </div>
      </section>
    </form>
  );
}
