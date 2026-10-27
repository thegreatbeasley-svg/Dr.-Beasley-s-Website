import { BOOK_STATUS_LABELS, type BookStatus } from "./types";

export type BookCover = {
  src: string;
  /** Null for covers uploaded before dimensions were recorded. */
  width: number | null;
  height: number | null;
  alt: string;
};

/**
 * The book's actual uploaded cover, or null. There is deliberately no
 * generated or placeholder cover for books — without an upload, the public
 * layout simply omits the image.
 */
export function getBookCover(book: {
  title: string;
  cover_image_path: string | null;
  cover_width: number | null;
  cover_height: number | null;
}): BookCover | null {
  if (!book.cover_image_path) return null;
  return {
    src: book.cover_image_path,
    width: book.cover_width,
    height: book.cover_height,
    alt: `Cover of ${book.title}, by Dr. Virgil Beasley`,
  };
}

export function getBookStatusLabel(status: string) {
  return BOOK_STATUS_LABELS[status as BookStatus] ?? status;
}
