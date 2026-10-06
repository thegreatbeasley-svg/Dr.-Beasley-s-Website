"use client";

import React from "react";
import { useRouter } from "next/navigation";

type Props = {
  backend: "sqlite" | "supabase";
};

export default function AdminLoginForm({ backend }: Props) {
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          backend === "supabase"
            ? { email: identifier, password }
            : { username: identifier, password }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect sign-in details.");
        setLoading(false);
        return;
      }
      router.push("/admin/resources");
      router.refresh();
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
      <div>
        <label htmlFor="identifier" className="mb-2 block text-sm text-paper-muted">
          {backend === "supabase" ? "Email" : "Username"}
        </label>
        <input
          id="identifier"
          type={backend === "supabase" ? "email" : "text"}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-gold focus:outline-none"
          autoComplete={backend === "supabase" ? "email" : "username"}
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm text-paper-muted">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-ink px-4 py-3 text-paper focus:border-gold focus:outline-none"
          autoComplete="current-password"
        />
      </div>
      {error && (
        <p className="text-sm text-tangerine-hover" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
