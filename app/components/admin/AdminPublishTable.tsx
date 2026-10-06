"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type AdminPublishRow = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  published: boolean;
  featured: boolean;
};

type Props = {
  items: AdminPublishRow[];
  /** e.g. "/api/admin/articles" — PATCH {id} toggles published/featured. */
  apiBase: string;
  /** e.g. "/admin/articles" — used for the per-row Edit link and the empty-state CTA. */
  editBase: string;
  emptyLabel: string;
};

/**
 * Shared list+publish+feature+edit table used by every simple content
 * domain (Articles, Books, Projects). Resources keeps its own
 * AdminResourcesTable (it also shows a request count column and predates
 * this generalization) — left as-is rather than risk the one flow that's
 * already been fully verified end to end.
 */
export default function AdminPublishTable({ items, apiBase, editBase, emptyLabel }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const togglePatch = async (id: string, patch: Record<string, boolean>) => {
    setPendingId(id);
    setError("");
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not update this item.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please check your connection.");
    } finally {
      setPendingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <p className="text-paper-muted">
        {emptyLabel}{" "}
        <Link href={`${editBase}/new`} className="text-gold underline-offset-4 hover:underline">
          Create the first one
        </Link>
        .
      </p>
    );
  }

  return (
    <div>
      {error && (
        <p className="mb-4 text-sm text-tangerine-hover" role="alert">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-ink-elevated text-xs uppercase tracking-wider text-paper-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 font-medium">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-paper">{item.title}</div>
                  <div className="text-xs text-paper-muted">{item.subtitle}</div>
                </td>
                <td className="px-4 py-3 text-paper-muted">{item.badge}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={pendingId === item.id}
                    onClick={() => togglePatch(item.id, { published: !item.published })}
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                      item.published
                        ? "bg-tangerine text-tangerine-ink"
                        : "border border-white/20 text-paper-muted"
                    }`}
                  >
                    {item.published ? "Published" : "Draft"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={pendingId === item.id}
                    onClick={() => togglePatch(item.id, { featured: !item.featured })}
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                      item.featured
                        ? "border border-gold text-gold"
                        : "border border-white/20 text-paper-muted"
                    }`}
                  >
                    {item.featured ? "Featured" : "Standard"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`${editBase}/${item.id}/edit`}
                    className="text-gold underline-offset-4 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
