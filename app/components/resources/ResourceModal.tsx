"use client";

import React from "react";
import type { Resource } from "@/lib/resources/types";
import ResourceDetail from "./ResourceDetail";

type Props = {
  resource: Resource | null;
  onClose: () => void;
};

/**
 * Built on the native <dialog> element: it gives us a real modal (focus
 * trapping, Escape-to-close, a ::backdrop, and correct
 * accessibility-tree behavior) without hand-rolling a focus trap.
 */
export default function ResourceModal({ resource, onClose }: Props) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const headingId = React.useId();

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (resource) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [resource]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  };

  // Belt-and-suspenders focus trap: native <dialog> focus containment is
  // inconsistent across browsers (in testing, Tab could briefly move focus
  // to <body>/<dialog> between the last field and wrapping back to the
  // close button). This guarantees Tab/Shift+Tab never leaves the dialog.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);

    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      aria-labelledby={resource ? headingId : undefined}
      className="m-auto w-[min(760px,92vw)] max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-ink-elevated p-0 text-paper backdrop:bg-ink/80 backdrop:backdrop-blur-sm"
    >
      {resource && (
        <div className="relative p-6 sm:p-8">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="absolute right-4 top-4 rounded-full border border-white/15 p-2 text-paper-muted transition-colors hover:border-gold/50 hover:text-paper"
            aria-label="Close dialog"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M1 1L15 15M15 1L1 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <ResourceDetail resource={resource} headingId={headingId} />
        </div>
      )}
    </dialog>
  );
}
