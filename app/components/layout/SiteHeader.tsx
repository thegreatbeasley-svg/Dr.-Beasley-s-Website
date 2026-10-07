"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/about", label: "About" },
  { href: "/knowledge", label: "Knowledge Hub" },
  { href: "/questions", label: "Questions" },
  { href: "/books", label: "Books" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function SiteHeader({ isLocalDemo = false }: { isLocalDemo?: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-wide text-paper">
          Dr. Virgil Beasly
          {isLocalDemo && (
            <span className="ml-2 hidden text-xs font-normal uppercase tracking-widest text-paper-muted sm:inline">
              Local demo
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={`text-sm font-medium transition-colors ${
                isActive(pathname, item.href)
                  ? "text-tangerine"
                  : "text-paper-muted hover:text-paper"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-paper md:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            {menuOpen ? (
              <path
                d="M1 1L15 15M15 1L1 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M1 2.5H15M1 8H15M1 13.5H15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav id="mobile-nav" aria-label="Primary mobile" className="border-t border-white/10 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive(pathname, item.href)
                    ? "bg-ink-elevated text-tangerine"
                    : "text-paper-muted hover:bg-ink-elevated hover:text-paper"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
