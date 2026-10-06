"use client";

import React from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function QuestionSubmitForm() {
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [questionText, setQuestionText] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");

  const questionId = React.useId();
  const nameId = React.useId();
  const emailId = React.useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    setFieldErrors({});
    setErrorMessage("");

    const errors: Record<string, string> = {};
    if (!questionText.trim()) errors.questionText = "Enter your question.";
    if (!email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email.trim())) errors.email = "Enter a valid email address.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: questionText.trim(),
          name: name.trim(),
          email: email.trim(),
          website: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setErrorMessage(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setQuestionText("");
      setName("");
      setEmail("");
      setStatus("success");
    } catch {
      setErrorMessage("Something went wrong. Please check your connection and try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-gold/30 bg-ink-elevated p-6" role="status">
        <h3 className="text-lg font-medium text-paper">Thanks for your question</h3>
        <p className="mt-2 text-sm text-paper-muted">
          It&rsquo;s been saved for review. Published answers appear on this page — no answer is
          posted automatically, and nothing here is emailed to you.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-medium text-gold underline-offset-4 hover:underline"
        >
          Ask another question
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-2xl border border-white/10 bg-ink-elevated p-6">
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <h3 className="text-lg font-medium text-paper">Ask a question</h3>
      <p className="text-sm text-paper-muted">
        Submitted questions go into a review queue. They&rsquo;re only published here once an
        answer has been written — your email is never shown publicly.
      </p>

      <div>
        <label htmlFor={questionId} className="mb-2 block text-sm text-paper-muted">
          Your question
        </label>
        <textarea
          id={questionId}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={4}
          maxLength={2000}
          className="w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-gold focus:outline-none"
        />
        {fieldErrors.questionText && (
          <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.questionText}</p>
        )}
      </div>

      <div>
        <label htmlFor={nameId} className="mb-2 block text-sm text-paper-muted">
          Name <span className="text-paper-muted/60">(optional)</span>
        </label>
        <input
          id={nameId}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-gold focus:outline-none"
          autoComplete="name"
        />
      </div>

      <div>
        <label htmlFor={emailId} className="mb-2 block text-sm text-paper-muted">
          Email
        </label>
        <input
          id={emailId}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-gold focus:outline-none"
          autoComplete="email"
        />
        {fieldErrors.email && <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.email}</p>}
      </div>

      {errorMessage && (
        <p className="text-sm text-tangerine-hover" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Submit question"}
      </button>
    </form>
  );
}
