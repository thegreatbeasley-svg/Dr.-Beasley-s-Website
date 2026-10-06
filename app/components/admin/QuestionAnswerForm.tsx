"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { QUESTION_STATUSES } from "@/lib/questions/types";
import type { Question } from "@/lib/questions/types";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-gold focus:outline-none";
const labelClass = "mb-2 block text-sm text-paper-muted";

export default function QuestionAnswerForm({ question }: { question: Question }) {
  const router = useRouter();
  const [answerBody, setAnswerBody] = React.useState(question.answer_body ?? "");
  const [status, setStatus] = React.useState(question.status);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    try {
      const res = await fetch(`/api/admin/questions/${question.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerBody, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFieldErrors(data.fieldErrors || {});
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push("/admin/questions");
      router.refresh();
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="rounded-2xl border border-white/10 bg-ink-elevated p-5">
        <p className="text-xs uppercase tracking-wider text-paper-muted">Submitted by (not public)</p>
        <p className="mt-1 text-paper">
          {question.submitter_name || "Anonymous"} — {question.submitter_email}
        </p>
      </div>

      <div>
        <label htmlFor="answer_body" className={labelClass}>
          Answer
        </label>
        <textarea
          id="answer_body"
          value={answerBody}
          onChange={(e) => setAnswerBody(e.target.value)}
          className={inputClass}
          rows={10}
          maxLength={20000}
        />
        {fieldErrors.answerBody && (
          <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.answerBody}</p>
        )}
      </div>

      <div>
        <label htmlFor="status" className={labelClass}>
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={inputClass}
        >
          {QUESTION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        {fieldErrors.status && <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.status}</p>}
        <p className="mt-1 text-xs text-paper-muted">
          Only &ldquo;Published&rdquo; is visible on the public Q&amp;A page.
        </p>
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
        {submitting ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
