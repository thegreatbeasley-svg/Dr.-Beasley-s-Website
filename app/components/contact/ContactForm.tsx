"use client";

import React from "react";
import { ENQUIRY_TOPICS, ENQUIRY_TOPIC_LABELS } from "@/lib/contact/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm({ isLocalDemo = false }: { isLocalDemo?: boolean }) {
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [topic, setTopic] = React.useState<string>(ENQUIRY_TOPICS[3]);
  const [message, setMessage] = React.useState("");

  const nameId = React.useId();
  const emailId = React.useId();
  const topicId = React.useId();
  const messageId = React.useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    setFieldErrors({});
    setErrorMessage("");

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email.trim())) errors.email = "Enter a valid email address.";
    if (!message.trim()) errors.message = "Enter a message.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), topic, message: message.trim(), website: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setErrorMessage(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setName("");
      setEmail("");
      setMessage("");
      setStatus("success");
    } catch {
      setErrorMessage("Something went wrong. Please check your connection and try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-gold/30 bg-ink-elevated p-6" role="status">
        <h3 className="text-lg font-medium text-paper">Thanks — your message is saved</h3>
        <p className="mt-2 text-sm text-paper-muted">
          {isLocalDemo
            ? "This demo saves enquiries locally; no email is sent. In production this would reach the team directly."
            : "Your message has been saved. Email delivery isn't connected yet, so please allow some time for a direct reply."}
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-medium text-gold underline-offset-4 hover:underline"
        >
          Send another message
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

      <div>
        <label htmlFor={nameId} className="mb-2 block text-sm text-paper-muted">
          Name
        </label>
        <input
          id={nameId}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-gold focus:outline-none"
          autoComplete="name"
        />
        {fieldErrors.name && <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.name}</p>}
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

      <div>
        <label htmlFor={topicId} className="mb-2 block text-sm text-paper-muted">
          Topic
        </label>
        <select
          id={topicId}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-gold focus:outline-none"
        >
          {ENQUIRY_TOPICS.map((t) => (
            <option key={t} value={t}>
              {ENQUIRY_TOPIC_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={messageId} className="mb-2 block text-sm text-paper-muted">
          Message
        </label>
        <textarea
          id={messageId}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={4000}
          className="w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-gold focus:outline-none"
        />
        {fieldErrors.message && <p className="mt-1 text-sm text-tangerine-hover">{fieldErrors.message}</p>}
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
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
