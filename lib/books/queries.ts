import "server-only";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { deleteCoverImage } from "@/lib/resources/storage";
import { toBook, type Book, type BookRow } from "./types";

function nowIso() {
  return new Date().toISOString();
}

// ============================================================
// PUBLIC
// ============================================================

export function listPublishedBooks(): Book[] {
  const rows = getDb()
    .prepare(`SELECT * FROM books WHERE published = 1 ORDER BY featured DESC, created_at DESC`)
    .all() as BookRow[];
  return rows.map(toBook);
}

export function getPublishedBookBySlug(slug: string): Book | null {
  const row = getDb().prepare(`SELECT * FROM books WHERE slug = ? AND published = 1`).get(slug) as
    | BookRow
    | undefined;
  return row ? toBook(row) : null;
}

// ============================================================
// ADMIN
// ============================================================

export function listAllBooksAdmin(): Book[] {
  const rows = getDb().prepare(`SELECT * FROM books ORDER BY created_at DESC`).all() as BookRow[];
  return rows.map(toBook);
}

export function getBookById(id: string): Book | null {
  const row = getDb().prepare(`SELECT * FROM books WHERE id = ?`).get(id) as BookRow | undefined;
  return row ? toBook(row) : null;
}

export function isBookSlugTaken(slug: string, excludeId?: string): boolean {
  const db = getDb();
  const row = excludeId
    ? db.prepare(`SELECT id FROM books WHERE slug = ? AND id != ?`).get(slug, excludeId)
    : db.prepare(`SELECT id FROM books WHERE slug = ?`).get(slug);
  return Boolean(row);
}

export type BookInput = {
  title: string;
  slug: string;
  kind: string;
  description: string;
  status: string;
  cta_label?: string | null;
  cta_url?: string | null;
  cover_image_path?: string | null;
  published: boolean;
  featured?: boolean;
};

export function createBook(input: BookInput): Book {
  const id = crypto.randomUUID();
  const timestamp = nowIso();
  getDb()
    .prepare(
      `INSERT INTO books
        (id, title, slug, kind, description, status, cta_label, cta_url, cover_image_path,
         published, featured, created_at, updated_at)
       VALUES (@id, @title, @slug, @kind, @description, @status, @cta_label, @cta_url, @cover_image_path,
         @published, @featured, @created_at, @updated_at)`
    )
    .run({
      id,
      title: input.title,
      slug: input.slug,
      kind: input.kind,
      description: input.description,
      status: input.status,
      cta_label: input.cta_label ?? null,
      cta_url: input.cta_url ?? null,
      cover_image_path: input.cover_image_path ?? null,
      published: input.published ? 1 : 0,
      featured: input.featured ? 1 : 0,
      created_at: timestamp,
      updated_at: timestamp,
    });
  return getBookById(id)!;
}

export type BookUpdateInput = Partial<BookInput>;

export function updateBook(id: string, input: BookUpdateInput): Book {
  const existing = getBookById(id);
  if (!existing) throw new Error("Book not found");

  const merged = {
    title: input.title ?? existing.title,
    slug: input.slug ?? existing.slug,
    kind: input.kind ?? existing.kind,
    description: input.description ?? existing.description,
    status: input.status ?? existing.status,
    cta_label: input.cta_label !== undefined ? input.cta_label : existing.cta_label,
    cta_url: input.cta_url !== undefined ? input.cta_url : existing.cta_url,
    cover_image_path:
      input.cover_image_path !== undefined ? input.cover_image_path : existing.cover_image_path,
    published: input.published !== undefined ? (input.published ? 1 : 0) : existing.published ? 1 : 0,
    featured: input.featured !== undefined ? (input.featured ? 1 : 0) : existing.featured ? 1 : 0,
    updated_at: nowIso(),
  };

  getDb()
    .prepare(
      `UPDATE books SET
        title = @title, slug = @slug, kind = @kind, description = @description, status = @status,
        cta_label = @cta_label, cta_url = @cta_url, cover_image_path = @cover_image_path,
        published = @published, featured = @featured, updated_at = @updated_at
       WHERE id = @id`
    )
    .run({ ...merged, id });

  return getBookById(id)!;
}

export async function replaceBookCoverImage(bookId: string, coverPath: string) {
  const existing = getBookById(bookId);
  if (!existing) throw new Error("Book not found");
  updateBook(bookId, { cover_image_path: coverPath });
  await deleteCoverImage(existing.cover_image_path);
}
