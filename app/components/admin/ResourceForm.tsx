"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { RESOURCE_TYPES } from "@/lib/resources/types";
import type { Resource } from "@/lib/resources/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Props = {
  mode: "create" | "edit";
  resourceId?: string;
  initial?: Resource;
  /**
   * True only in Supabase mode (decided server-side by the page that
   * renders this form). When true, the PDF/cover are uploaded directly to
   * Supabase Storage via a short-lived signed URL instead of through our
   * own API route — Vercel's serverless functions reject any request body
   * over 4.5MB, which a 25MB PDF would otherwise always exceed.
   */
  directUpload?: boolean;
};

/**
 * Reads a JSON error body without throwing when the platform (e.g. Vercel's
 * 413/504 pages) answers with HTML or an empty body, and names the HTTP
 * status so a failure is never collapsed into a generic message.
 */
async function readJson(res: Response): Promise<{
  error?: string;
  fieldErrors?: Record<string, string>;
  token?: string;
  path?: string;
  bucket?: string;
}> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function statusHint(status: number) {
  if (status === 401) return "your admin session has expired — please sign in again";
  if (status === 413) return "the request was too large for the server";
  return `HTTP ${status}`;
}

async function uploadDirectly(
  kind: "resource-pdf" | "resource-cover",
  file: File,
  onProgress: (message: string) => void
): Promise<string> {
  onProgress(kind === "resource-pdf" ? "Preparing PDF upload…" : "Preparing cover upload…");
  let signRes: Response;
  try {
    signRes = await fetch("/api/admin/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, contentType: file.type, size: file.size }),
    });
  } catch {
    throw new Error("Could not reach the server to prepare the upload (network error at the signing step).");
  }
  const signData = await readJson(signRes);
  if (!signRes.ok || !signData.token || !signData.path || !signData.bucket) {
    throw new Error(
      signData.error ||
        `Could not prepare the upload (signing step failed: ${statusHint(signRes.status)}).`
    );
  }

  onProgress(kind === "resource-pdf" ? "Uploading PDF…" : "Uploading cover…");
  let storageError: { message: string } | null;
  try {
    ({ error: storageError } = await getSupabaseBrowserClient()
      .storage.from(signData.bucket)
      .uploadToSignedUrl(signData.path, signData.token, file));
  } catch (caught) {
    throw new Error(
      `Upload to storage failed (storage step): ${caught instanceof Error ? caught.message : "network error"}`
    );
  }
  if (storageError) {
    throw new Error(`Upload to storage failed (storage step): ${storageError.message}`);
  }

  return signData.path as string;
}

const inputClass =
  "w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-gold focus:outline-none";
const labelClass = "mb-2 block text-sm text-paper-muted";

export default function ResourceForm({ mode, resourceId, initial, directUpload = false }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [progress, setProgress] = React.useState("");
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(Boolean(initial?.slug));
  const [shortDescription, setShortDescription] = React.useState(initial?.short_description ?? "");
  const [longDescription, setLongDescription] = React.useState(initial?.long_description ?? "");
  const [resourceType, setResourceType] = React.useState(initial?.resource_type ?? RESOURCE_TYPES[0]);
  const [published, setPublished] = React.useState(initial?.published ?? false);
  const [featured, setFeatured] = React.useState(initial?.featured ?? false);
  const [file, setFile] = React.useState<File | null>(null);
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

    if (mode === "create" && !file) {
      setFieldErrors({ file: "A PDF file is required." });
      return;
    }

    setSubmitting(true);
    setError("");
    setFieldErrors({});
    setProgress("");

    const formData = new FormData();
    formData.set("title", title);
    formData.set("slug", slug);
    formData.set("short_description", shortDescription);
    formData.set("long_description", longDescription);
    formData.set("resource_type", resourceType);
    formData.set("published", String(published));
    formData.set("featured", String(featured));

    try {
      if (directUpload) {
        if (file) formData.set("file_path", await uploadDirectly("resource-pdf", file, setProgress));
        if (cover) formData.set("cover_path", await uploadDirectly("resource-cover", cover, setProgress));
      } else {
        if (file) formData.set("file", file);
        if (cover) formData.set("cover", cover);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload the file.");
      setSubmitting(false);
      setProgress("");
      return;
    }

    setProgress("Saving…");
    try {
      const res = await fetch(
        mode === "create" ? "/api/admin/resources" : `/api/admin/resources/${resourceId}`,
        { method: mode === "create" ? "POST" : "PUT", body: formData }
      );
      const data = await readJson(res);
      if (!res.ok) {
        setFieldErrors(data.fieldErrors || {});
        setError(
          data.error ||
            `Saving failed (${directUpload ? "direct" : "server"} upload mode, ${statusHint(res.status)}).`
        );
        setSubmitting(false);
        setProgress("");
        return;
      }
      router.push("/admin/resources");
      router.refresh();
    } catch {
      setError(
        directUpload
          ? "The file uploaded, but saving the resource failed. Please check your connection and try again."
          : "Something went wrong. Please check your connection and try again. (server upload mode)"
      );
      setSubmitting(false);
      setProgress("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-upload-mode={directUpload ? "direct" : "server"}
      className="max-w-2xl space-y-6"
    >
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
        <label htmlFor="resource_type" className={labelClass}>
          Type
        </label>
        <select
          id="resource_type"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          className={inputClass}
        >
          {RESOURCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {fieldErrors.resource_type && (
          <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.resource_type}</p>
        )}
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
        <label htmlFor="long_description" className={labelClass}>
          Long description <span className="text-paper-muted/60">(optional)</span>
        </label>
        <textarea
          id="long_description"
          value={longDescription}
          onChange={(e) => setLongDescription(e.target.value)}
          className={inputClass}
          rows={5}
          maxLength={4000}
        />
      </div>

      <div>
        <label htmlFor="file" className={labelClass}>
          PDF file {mode === "edit" && <span className="text-paper-muted/60">(leave empty to keep current file)</span>}
        </label>
        <input
          id="file"
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-gold/20 file:px-4 file:py-2 file:text-paper`}
        />
        {mode === "edit" && initial && (
          <p className="mt-1 text-xs text-paper-muted">
            Current file: {initial.file_name} ({Math.round(initial.file_size / 1024)} KB)
          </p>
        )}
        {fieldErrors.file && <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.file}</p>}
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

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving…" : mode === "create" ? "Create resource" : "Save changes"}
        </button>
        {submitting && progress && <span className="text-sm text-paper-muted">{progress}</span>}
      </div>
    </form>
  );
}
