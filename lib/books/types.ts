import { parseStoredRetailers, type BookRetailer } from "./retailers";

export const BOOK_KINDS = ["book", "framework", "research", "programme"] as const;
export type BookKind = (typeof BOOK_KINDS)[number];

export const BOOK_STATUSES = ["draft", "coming_soon", "available"] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  draft: "Draft",
  coming_soon: "Coming soon",
  available: "Available",
};

/** Full record — admin use only. Never pass this to public pages or client components. */
export type Book = {
  id: string;
  title: string;
  slug: string;
  kind: string;
  subtitle: string | null;
  /** The short description (kept under its original column name). */
  description: string;
  long_description: string | null;
  publication_year: number | null;
  status: string;
  /** Legacy single call-to-action — superseded by `retailers`, no longer editable. */
  cta_label: string | null;
  cta_url: string | null;
  cover_image_path: string | null;
  cover_width: number | null;
  cover_height: number | null;
  retailers: BookRetailer[];
  /** "upload" | "youtube" | "vimeo" — null when the book has no promo video. */
  video_source: string | null;
  video_url: string | null;
  sort_order: number;
  /** Reserved for a future payments phase — unused. */
  price_cents: number | null;
  stripe_price_id: string | null;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type BookRow = Omit<Book, "published" | "featured" | "retailers"> & {
  published: number | boolean;
  featured: number | boolean;
  /** JSON text in SQLite, a parsed array from Supabase. */
  retailers: unknown;
};

export function toBook(row: BookRow): Book {
  return {
    ...row,
    published: Boolean(row.published),
    featured: Boolean(row.featured),
    retailers: parseStoredRetailers(row.retailers),
  };
}

/**
 * Exactly what the public site may see. Public queries select ONLY these
 * columns, so draft state, pricing/Stripe fields, legacy CTA fields and
 * admin ordering never reach public HTML, RSC payloads or metadata.
 */
export const PUBLIC_BOOK_COLUMNS = [
  "id",
  "title",
  "slug",
  "subtitle",
  "description",
  "long_description",
  "publication_year",
  "status",
  "cover_image_path",
  "cover_width",
  "cover_height",
  "retailers",
  "video_source",
  "video_url",
  "updated_at",
] as const;

export type PublicBook = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string;
  long_description: string | null;
  publication_year: number | null;
  status: string;
  cover_image_path: string | null;
  cover_width: number | null;
  cover_height: number | null;
  retailers: BookRetailer[];
  video_source: string | null;
  video_url: string | null;
  updated_at: string;
};

/** Picks only the public fields — works for a public row or a full admin record (preview). */
export function toPublicBook(row: Record<string, unknown>): PublicBook {
  const pick = <K extends keyof PublicBook>(key: K) => row[key] as PublicBook[K];
  return {
    id: pick("id"),
    title: pick("title"),
    slug: pick("slug"),
    subtitle: pick("subtitle") ?? null,
    description: pick("description"),
    long_description: pick("long_description") ?? null,
    publication_year: pick("publication_year") ?? null,
    status: pick("status"),
    cover_image_path: pick("cover_image_path") ?? null,
    cover_width: pick("cover_width") ?? null,
    cover_height: pick("cover_height") ?? null,
    retailers: parseStoredRetailers(row.retailers),
    video_source: pick("video_source") ?? null,
    video_url: pick("video_url") ?? null,
    updated_at: pick("updated_at"),
  };
}
