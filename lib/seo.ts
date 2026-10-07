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

/**
 * TEMPORARY LAUNCH GATE — the site is publicly reachable but not yet
 * announced, so every page stays out of search results until there is an
 * explicit decision to launch. Flip this to `false` (and nothing else) to
 * open the site back up to indexing; `app/robots.ts` carries the matching
 * site-wide disallow and should be reverted in the same change.
 */
export const PRE_LAUNCH_NOINDEX = true;

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  /** Set false for pages that shouldn't be indexed (e.g. admin-adjacent). */
  index?: boolean;
};

export function buildMetadata({ title, description, path, index = true }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const shouldIndex = index && !PRE_LAUNCH_NOINDEX;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: shouldIndex ? { index: true, follow: true } : { index: false, follow: false },
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
