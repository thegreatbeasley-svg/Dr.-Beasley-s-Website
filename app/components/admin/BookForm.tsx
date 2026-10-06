"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BOOK_KINDS, BOOK_STATUSES, BOOK_STATUS_LABELS } from "@/lib/books/types";
import type { Book } from "@/lib/books/types";

type Props = {
  mode: "create" | "edit";
  bookId?: string;
  initial?: Book;
};

const inputClass =
  "w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-gold focus:outline-none";
const labelClass = "mb-2 block text-sm text-paper-muted";

export default function BookForm({ mode, bookId, initial }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(Boolean(initial?.slug));
  const [kind, setKind] = React.useState(initial?.kind ?? BOOK_KINDS[0]);
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [status, setStatus] = React.useState(initial?.status ?? "draft");
  const [ctaLabel, setCtaLabel] = React.useState(initial?.cta_label ?? "");
  const [ctaUrl, setCtaUrl] = React.useState(initial?.cta_url ?? "");
  const [published, setPublished] = React.useState(initial?.published ?? false);
  const [featured, setFeatured] = React.useState(initial?.featured ?? false);
  const [cover, setCover] = React.useState<File | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    const formData = new FormData();
    formData.set("title", title);
    formData.set("slug", slug);
    formData.set("kind", kind);
    formData.set("description", description);
    formData.set("status", status);
    formData.set("cta_label", ctaLabel);
    formData.set("cta_url", ctaUrl);
    formData.set("published", String(published));
    formData.set("featured", String(featured));
    if (cover) formData.set("cover", cover);

    try {
      const res = await fetch(mode === "create" ? "/api/admin/books" : `/api/admin/books/${bookId}`, {
        method: mode === "create" ? "POST" : "PUT",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setFieldErrors(data.fieldErrors || {});
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push("/admin/books");
      router.refresh();
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input id="title" type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} className={inputClass} required />
        {fieldErrors.title && <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.title}</p>}
      </div>

      <div>
        <label htmlFor="slug" className={labelClass}>
          Slug
        </label>
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
        {fieldErrors.slug && <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.slug}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="kind" className={labelClass}>
            Kind
          </label>
          <select id="kind" value={kind} onChange={(e) => setKind(e.target.value)} className={inputClass}>
            {BOOK_KINDS.map((k) => (
              <option key={k} value={k}>
                {k[0].toUpperCase() + k.slice(1)}
              </option>
            ))}
          </select>
          {fieldErrors.kind && <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.kind}</p>}
        </div>
        <div>
          <label htmlFor="status" className={labelClass}>
            Availability status
          </label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            {BOOK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {BOOK_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          {fieldErrors.status && <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.status}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={5} maxLength={4000} required />
        {fieldErrors.description && <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="cta_label" className={labelClass}>
            CTA label <span className="text-paper-muted/60">(optional)</span>
          </label>
          <input id="cta_label" type="text" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className={inputClass} placeholder="e.g. Join the waitlist" />
        </div>
        <div>
          <label htmlFor="cta_url" className={labelClass}>
            CTA link <span className="text-paper-muted/60">(optional)</span>
          </label>
          <input id="cta_url" type="text" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className={inputClass} placeholder="/contact" />
        </div>
      </div>
      <p className="-mt-3 text-xs text-paper-muted">
        Payment is not wired up yet — this is an informational call to action only (e.g. link to the
        Contact page). Stripe fields exist in the database for later but aren&rsquo;t used here.
      </p>

      <div>
        <label htmlFor="cover" className={labelClass}>
          Cover image <span className="text-paper-muted/60">(optional — PNG, JPEG, or WebP)</span>
        </label>
        <input
          id="cover"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setCover(e.target.files?.[0] ?? null)}
          className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-gold/20 file:px-4 file:py-2 file:text-paper`}
        />
        {fieldErrors.cover && <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.cover}</p>}
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-tangerine" />
          <span className="text-sm text-paper">Published (visible on the public site)</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-tangerine" />
          <span className="text-sm text-paper">Featured</span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-tangerine-hover" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Saving…" : mode === "create" ? "Create book entry" : "Save changes"}
      </button>
    </form>
  );
}
