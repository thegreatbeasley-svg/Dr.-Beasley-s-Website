import { BOOK_STATUS_LABELS, type BookStatus } from "./types";

/** Reuses the same generated-cover endpoint as resources/articles. */
export function getBookCoverUrl(book: { cover_image_path: string | null; title: string; kind: string }) {
  if (book.cover_image_path) return book.cover_image_path;
  const label = book.kind.charAt(0).toUpperCase() + book.kind.slice(1);
  const params = new URLSearchParams({ title: book.title, type: label });
  return `/api/resources/cover?${params.toString()}`;
}

export function getBookStatusLabel(status: string) {
  return BOOK_STATUS_LABELS[status as BookStatus] ?? status;
}
