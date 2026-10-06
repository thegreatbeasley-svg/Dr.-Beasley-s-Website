"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/leads", label: "Leads" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-ink text-paper">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Local demo admin
            </p>
            <p className="text-sm text-paper-muted">Dr. Virgil Beasly — Resource Library</p>
          </div>
          <nav className="flex items-center gap-6" aria-label="Admin">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium ${
                  pathname.startsWith(item.href)
                    ? "text-tangerine"
                    : "text-paper-muted hover:text-paper"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/"
              className="text-sm font-medium text-paper-muted hover:text-paper"
              target="_blank"
            >
              View site ↗
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-paper-muted transition-colors hover:border-gold/40 hover:text-paper disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
