"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  /** e.g. "/api/admin/resources/<id>" */
  apiPath: string;
  /** e.g. "/admin/resources" */
  listPath: string;
  /** Singular noun shown to the admin, e.g. "resource". */
  itemLabel: string;
  itemName: string;
  /** Extra consequence line, e.g. which files are removed. */
  consequence: string;
};

export default function DangerZone({ apiPath, listPath, itemLabel, itemName, consequence }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [warnings, setWarnings] = React.useState<string[]>([]);

  const confirmed = typed === "DELETE";

  const handleDelete = async () => {
    if (!confirmed || deleting) return;
    setDeleting(true);
    setError("");
    let res: Response;
    try {
      res = await fetch(apiPath, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: typed }),
      });
    } catch {
      setError("Could not reach the server, so nothing was deleted. Check your connection and try again.");
      setDeleting(false);
      return;
    }
    let data: { error?: string; warnings?: string[] } = {};
    try {
      data = await res.json();
    } catch {
      // non-JSON platform error page — fall through to the status message
    }
    if (!res.ok) {
      setError(
        data.error ||
          (res.status === 401
            ? "Your admin session has expired — sign in again. Nothing was deleted."
            : `The deletion failed (HTTP ${res.status}). Nothing was deleted.`)
      );
      setDeleting(false);
      return;
    }
    if (data.warnings && data.warnings.length > 0) {
      // The record is gone but a storage cleanup failed — surface it
      // instead of silently redirecting.
      setWarnings(data.warnings);
      setDeleting(false);
      return;
    }
    router.push(`${listPath}?deleted=${encodeURIComponent(itemName)}`);
    router.refresh();
  };

  if (warnings.length > 0) {
    return (
      <section className="mt-16 max-w-2xl rounded-2xl border border-gold/40 bg-gold/5 p-6">
        <h2 className="text-lg font-medium text-paper">Deleted, with a cleanup warning</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-paper-muted">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <Link href={listPath} className="mt-5 inline-block text-sm text-gold underline">
          Back to the list
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-16 max-w-2xl rounded-2xl border border-tangerine-hover/40 bg-tangerine-hover/5 p-6">
      <h2 className="text-lg font-medium text-tangerine-hover">Danger zone</h2>
      <p className="mt-2 text-sm text-paper-muted">
        Permanently delete this {itemLabel}. {consequence} This cannot be undone.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 rounded-full border border-tangerine-hover/60 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-tangerine-hover transition-colors hover:bg-tangerine-hover/10"
        >
          Delete this {itemLabel}…
        </button>
      ) : (
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="delete-confirm" className="mb-2 block text-sm text-paper-muted">
              Type <span className="font-semibold text-paper">DELETE</span> to confirm deleting
              &ldquo;{itemName}&rdquo;
            </label>
            <input
              id="delete-confirm"
              type="text"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-tangerine-hover focus:outline-none"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-tangerine-hover">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!confirmed || deleting}
              className="rounded-full bg-tangerine-hover px-5 py-3 text-xs font-semibold uppercase tracking-widest text-tangerine-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting ? "Deleting…" : `Permanently delete ${itemLabel}`}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
                setError("");
              }}
              disabled={deleting}
              className="rounded-full border border-white/15 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-paper-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
