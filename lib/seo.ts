/**
 * Central SEO/discoverability helpers. One source of truth for the site
 * origin and for building canonical/OG metadata, so every public page's
 * `metadata`/`generateMetadata` stays consistent and a future domain
 * change is a one-line edit here.
 *
 * Kept deliberately factual: no invented org/person claims are added to
 * any metadata or structured data built from this file.
 */
import type { Metadata } from "next";

export const SITE_NAME = "Dr. Virgil Beasly";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  /** Set false for pages that shouldn't be indexed (e.g. admin-adjacent). */
  index?: boolean;
};

export function buildMetadata({ title, description, path, index = true }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

/** Local demo note repeated in a few places — single source of truth. */
export const DEMO_DISCLAIMER =
  "This is a local, working demo. Nothing on this site is a verified biography, and no content here should be treated as a live, production website.";
