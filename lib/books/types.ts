export const BOOK_KINDS = ["book", "framework", "research", "programme"] as const;
export type BookKind = (typeof BOOK_KINDS)[number];

export const BOOK_STATUSES = ["draft", "coming_soon", "available"] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  draft: "Draft",
  coming_soon: "Coming soon",
  available: "Available",
};

export type Book = {
  id: string;
  title: string;
  slug: string;
  kind: string;
  description: string;
  status: string;
  cta_label: string | null;
  cta_url: string | null;
  cover_image_path: string | null;
  /** Reserved for a future payments phase — unused for now (info/CTA only). */
  price_cents: number | null;
  stripe_price_id: string | null;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type BookRow = Omit<Book, "published" | "featured"> & {
  published: number;
  featured: number;
};

export function toBook(row: BookRow): Book {
  return { ...row, published: Boolean(row.published), featured: Boolean(row.featured) };
}
