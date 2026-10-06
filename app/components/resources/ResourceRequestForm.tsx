"use client";

import React from "react";

type Props = {
  resourceSlug: string;
  resourceTitle: string;
  /** Lets the parent (e.g. a modal) move focus to the success message. */
  onSuccess?: () => void;
};

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResourceRequestForm({ resourceSlug, resourceTitle, onSuccess }: Props) {
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [resultName, setResultName] = React.useState("");

  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [optIn, setOptIn] = React.useState(false);

  const nameId = React.useId();
  const cityId = React.useId();
  const emailId = React.useId();
  const optInId = React.useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;

    setFieldErrors({});
    setErrorMessage("");

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Name is required.";
    if (!city.trim()) errors.city = "City is required.";
    if (!email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email.trim())) errors.email = "Enter a valid email address.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/resources/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim(),
          email: email.trim(),
          updatesOptIn: optIn,
          resourceSlug,
          website: "", // honeypot — left blank by real visitors
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setErrorMessage(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setDownloadUrl(data.downloadUrl);
      setResultName(data.name || name.trim());
      setStatus("success");
      onSuccess?.();
    } catch {
      setErrorMessage("Something went wrong. Please check your connection and try again.");
      setStatus("error");
    }
  };

  if (status === "success" && downloadUrl) {
    return (
      <div className="space-y-5" role="status">
        <h3 className="text-2xl font-medium text-paper">Your resource is ready</h3>
        <p className="text-paper-muted">
          Thanks{resultName ? `, ${resultName}` : ""} — your copy of{" "}
          <span className="italic">{resourceTitle}</span> is ready to download.
        </p>
        <a
          href={downloadUrl}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
        >
          Download now
        </a>
        <p className="text-xs text-paper-muted/70">
          This demo saves your request locally. Email delivery is not connected yet.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Honeypot — hidden from real visitors, catches simple bots. */}
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
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? `${nameId}-error` : undefined}
        />
        {fieldErrors.name && (
          <p id={`${nameId}-error`} className="mt-1 text-sm text-tangerine-hover">
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={cityId} className="mb-2 block text-sm text-paper-muted">
          City
        </label>
        <input
          id={cityId}
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-gold focus:outline-none"
          autoComplete="address-level2"
          aria-invalid={Boolean(fieldErrors.city)}
          aria-describedby={fieldErrors.city ? `${cityId}-error` : undefined}
        />
        {fieldErrors.city && (
          <p id={`${cityId}-error`} className="mt-1 text-sm text-tangerine-hover">
            {fieldErrors.city}
          </p>
        )}
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
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
        />
        {fieldErrors.email && (
          <p id={`${emailId}-error`} className="mt-1 text-sm text-tangerine-hover">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <label htmlFor={optInId} className="flex cursor-pointer items-start gap-3">
        <input
          id={optInId}
          type="checkbox"
          checked={optIn}
          onChange={(e) => setOptIn(e.target.checked)}
          className="mt-1 h-4 w-4 accent-tangerine"
        />
        <span className="text-sm leading-relaxed text-paper-muted">
          I&rsquo;d also like to receive new resources and updates from Dr. Virgil Beasly.
        </span>
      </label>

      {errorMessage && (
        <p className="text-sm text-tangerine-hover" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Get my free resource"}
      </button>

      <p className="text-xs text-paper-muted/70">
        This demo saves your request locally. Email delivery is not connected yet.
      </p>
    </form>
  );
}
