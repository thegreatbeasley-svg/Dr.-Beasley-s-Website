"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ResourceWithRequestCount } from "@/lib/resources/types";

type Props = {
  resources: ResourceWithRequestCount[];
};

export default function AdminResourcesTable({ resources }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const togglePatch = async (id: string, patch: Record<string, boolean>) => {
    setPendingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not update the resource.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please check your connection.");
    } finally {
      setPendingId(null);
    }
  };

  if (resources.length === 0) {
    return (
      <p className="text-paper-muted">
        No resources yet.{" "}
        <Link href="/admin/resources/new" className="text-gold underline-offset-4 hover:underline">
          Create your first one
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
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-ink-elevated text-xs uppercase tracking-wider text-paper-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Requests</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 font-medium">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {resources.map((resource) => (
              <tr key={resource.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-paper">{resource.title}</div>
                  <div className="text-xs text-paper-muted">/{resource.slug}</div>
                </td>
                <td className="px-4 py-3 text-paper-muted">{resource.resource_type}</td>
                <td className="px-4 py-3 text-paper-muted">{resource.request_count}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={pendingId === resource.id}
                    onClick={() => togglePatch(resource.id, { published: !resource.published })}
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                      resource.published
                        ? "bg-tangerine text-tangerine-ink"
                        : "border border-white/20 text-paper-muted"
                    }`}
                  >
                    {resource.published ? "Published" : "Draft"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={pendingId === resource.id}
                    onClick={() => togglePatch(resource.id, { featured: !resource.featured })}
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                      resource.featured
                        ? "border border-gold text-gold"
                        : "border border-white/20 text-paper-muted"
                    }`}
                  >
                    {resource.featured ? "Featured" : "Standard"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/resources/${resource.id}/edit`}
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
