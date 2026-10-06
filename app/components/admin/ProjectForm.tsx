"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_RELATIONSHIP_NOTE } from "@/lib/projects/types";
import type { Project } from "@/lib/projects/types";

type Props = {
  mode: "create" | "edit";
  projectId?: string;
  initial?: Project;
};

const inputClass =
  "w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-gold focus:outline-none";
const labelClass = "mb-2 block text-sm text-paper-muted";

export default function ProjectForm({ mode, projectId, initial }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const [name, setName] = React.useState(initial?.name ?? "");
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(Boolean(initial?.slug));
  const [relationshipNote, setRelationshipNote] = React.useState(
    initial?.relationship_note ?? DEFAULT_RELATIONSHIP_NOTE
  );
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [url, setUrl] = React.useState(initial?.url ?? "");
  const [published, setPublished] = React.useState(initial?.published ?? false);
  const [featured, setFeatured] = React.useState(initial?.featured ?? false);

  const handleNameChange = (value: string) => {
    setName(value);
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
    formData.set("name", name);
    formData.set("slug", slug);
    formData.set("relationship_note", relationshipNote);
    formData.set("description", description);
    formData.set("url", url);
    formData.set("published", String(published));
    formData.set("featured", String(featured));

    try {
      const res = await fetch(mode === "create" ? "/api/admin/projects" : `/api/admin/projects/${projectId}`, {
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
      router.push("/admin/projects");
      router.refresh();
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <label htmlFor="name" className={labelClass}>
          Name
        </label>
        <input id="name" type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} className={inputClass} required />
        {fieldErrors.name && <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.name}</p>}
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
        <label htmlFor="relationship_note" className={labelClass}>
          Relationship to Dr. Virgil Beasly
        </label>
        <textarea
          id="relationship_note"
          value={relationshipNote}
          onChange={(e) => setRelationshipNote(e.target.value)}
          className={inputClass}
          rows={2}
          maxLength={500}
        />
        <p className="mt-1 text-xs text-paper-muted">
          Keep this as a draft placeholder until the real relationship is confirmed — don&rsquo;t
          describe it from assumption.
        </p>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description <span className="text-paper-muted/60">(optional)</span>
        </label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={4} maxLength={2000} />
      </div>

      <div>
        <label htmlFor="url" className={labelClass}>
          External URL <span className="text-paper-muted/60">(optional)</span>
        </label>
        <input id="url" type="text" value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} placeholder="https://…" />
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
        {submitting ? "Saving…" : mode === "create" ? "Create project" : "Save changes"}
      </button>
    </form>
  );
}
