"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ARTICLE_CONTENT_TYPES, ARTICLE_CONTENT_TYPE_LABELS } from "@/lib/articles/types";
import type { Article } from "@/lib/articles/types";

type Props = {
  mode: "create" | "edit";
  articleId?: string;
  initial?: Article;
};

const inputClass =
  "w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-gold focus:outline-none";
const labelClass = "mb-2 block text-sm text-paper-muted";

export default function ArticleForm({ mode, articleId, initial }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(Boolean(initial?.slug));
  const [shortDescription, setShortDescription] = React.useState(initial?.short_description ?? "");
  const [body, setBody] = React.useState(initial?.body ?? "");
  const [topic, setTopic] = React.useState(initial?.topic ?? "");
  const [contentType, setContentType] = React.useState(initial?.content_type ?? ARTICLE_CONTENT_TYPES[0]);
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
    formData.set("short_description", shortDescription);
    formData.set("body", body);
    formData.set("topic", topic);
    formData.set("content_type", contentType);
    formData.set("published", String(published));
    formData.set("featured", String(featured));
    if (cover) formData.set("cover", cover);

    try {
      const res = await fetch(
        mode === "create" ? "/api/admin/articles" : `/api/admin/articles/${articleId}`,
        { method: mode === "create" ? "POST" : "PUT", body: formData }
      );
      const data = await res.json();
      if (!res.ok) {
        setFieldErrors(data.fieldErrors || {});
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push("/admin/articles");
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
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className={inputClass}
          required
        />
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

      <div>
        <label htmlFor="content_type" className={labelClass}>
          Content type
        </label>
        <select
          id="content_type"
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          className={inputClass}
        >
          {ARTICLE_CONTENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {ARTICLE_CONTENT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        {fieldErrors.content_type && (
          <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.content_type}</p>
        )}
      </div>

      <div>
        <label htmlFor="topic" className={labelClass}>
          Topic <span className="text-paper-muted/60">(optional — powers future filtering)</span>
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="short_description" className={labelClass}>
          Short description
        </label>
        <textarea
          id="short_description"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          className={inputClass}
          rows={2}
          maxLength={500}
          required
        />
        {fieldErrors.short_description && (
          <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.short_description}</p>
        )}
      </div>

      <div>
        <label htmlFor="body" className={labelClass}>
          Body <span className="text-paper-muted/60">(plain text — separate paragraphs with a blank line)</span>
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={inputClass}
          rows={12}
          maxLength={20000}
          required
        />
        {fieldErrors.body && <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.body}</p>}
      </div>

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
        <p className="mt-1 text-xs text-paper-muted">
          Without a cover, a typographic cover is generated automatically from the title and type.
        </p>
        {fieldErrors.cover && <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.cover}</p>}
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 accent-tangerine"
          />
          <span className="text-sm text-paper">Published (visible on the public site)</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 accent-tangerine"
          />
          <span className="text-sm text-paper">Featured</span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-tangerine-hover" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving…" : mode === "create" ? "Create article" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
