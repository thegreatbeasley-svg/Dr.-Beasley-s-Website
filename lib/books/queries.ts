import "server-only";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient, unwrap, unwrapNullable } from "@/lib/supabase/admin";
import { PUBLIC_BOOK_COLUMNS, toBook, toPublicBook, type Book, type BookRow, type PublicBook } from "./types";
import type { BookRetailer } from "./retailers";

function nowIso() {
  return new Date().toISOString();
}

const PUBLIC_SELECT = PUBLIC_BOOK_COLUMNS.join(", ");

// ============================================================
// PUBLIC — published books only, public columns only
// ============================================================

export async function listPublishedBooks(): Promise<PublicBook[]> {
  if (isSupabaseConfigured()) {
    const rows = unwrap(
      await createSupabaseAdminClient()
        .from("books")
        .select(PUBLIC_SELECT)
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
    ) as unknown as Record<string, unknown>[];
    return rows.map(toPublicBook);
  }
  const rows = getDb()
    .prepare(`SELECT ${PUBLIC_SELECT} FROM books WHERE published = 1 ORDER BY sort_order ASC, created_at ASC`)
    .all() as Record<string, unknown>[];
  return rows.map(toPublicBook);
}

export async function getPublishedBookBySlug(slug: string): Promise<PublicBook | null> {
  if (isSupabaseConfigured()) {
    const row = unwrapNullable(
      await createSupabaseAdminClient()
        .from("books")
        .select(PUBLIC_SELECT)
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle()
    ) as unknown as Record<string, unknown> | null;
    return row ? toPublicBook(row) : null;
  }
  const row = getDb()
    .prepare(`SELECT ${PUBLIC_SELECT} FROM books WHERE slug = ? AND published = 1`)
    .get(slug) as Record<string, unknown> | undefined;
  return row ? toPublicBook(row) : null;
}

// ============================================================
// ADMIN — full records, including drafts. Callers must authenticate first.
// ============================================================

export async function listAllBooksAdmin(): Promise<Book[]> {
  if (isSupabaseConfigured()) {
    const rows = unwrap(
      await createSupabaseAdminClient()
        .from("books")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
    ) as BookRow[];
    return rows.map(toBook);
  }
  const rows = getDb()
    .prepare(`SELECT * FROM books ORDER BY sort_order ASC, created_at ASC`)
    .all() as BookRow[];
  return rows.map(toBook);
}

export async function getBookById(id: string): Promise<Book | null> {
  if (isSupabaseConfigured()) {
    const row = unwrapNullable(
      await createSupabaseAdminClient().from("books").select("*").eq("id", id).maybeSingle()
    ) as BookRow | null;
    return row ? toBook(row) : null;
  }
  const row = getDb().prepare(`SELECT * FROM books WHERE id = ?`).get(id) as BookRow | undefined;
  return row ? toBook(row) : null;
}

export async function isBookSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    let query = createSupabaseAdminClient().from("books").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const row = unwrapNullable(await query.maybeSingle());
    return Boolean(row);
  }
  const db = getDb();
  const row = excludeId
    ? db.prepare(`SELECT id FROM books WHERE slug = ? AND id != ?`).get(slug, excludeId)
    : db.prepare(`SELECT id FROM books WHERE slug = ?`).get(slug);
  return Boolean(row);
}

async function nextSortOrder(): Promise<number> {
  if (isSupabaseConfigured()) {
    const rows = unwrap(
      await createSupabaseAdminClient()
        .from("books")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
    ) as { sort_order: number }[];
    return (rows[0]?.sort_order ?? 0) + 1;
  }
  const row = getDb().prepare(`SELECT COALESCE(MAX(sort_order), 0) AS m FROM books`).get() as { m: number };
  return row.m + 1;
}

export type BookInput = {
  title: string;
  slug: string;
  subtitle?: string | null;
  description: string;
  long_description?: string | null;
  publication_year?: number | null;
  status: string;
  retailers?: BookRetailer[];
  cover_image_path?: string | null;
  cover_width?: number | null;
  cover_height?: number | null;
  video_source?: string | null;
  video_url?: string | null;
  published: boolean;
};

export async function createBook(input: BookInput): Promise<Book> {
  const id = crypto.randomUUID();
  const timestamp = nowIso();
  const sortOrder = await nextSortOrder();
  const retailers = input.retailers ?? [];

  if (isSupabaseConfigured()) {
    unwrap(
      await createSupabaseAdminClient()
        .from("books")
        .insert({
          id,
          title: input.title,
          slug: input.slug,
          kind: "book",
          subtitle: input.subtitle ?? null,
          description: input.description,
          long_description: input.long_description ?? null,
          publication_year: input.publication_year ?? null,
          status: input.status,
          retailers,
          cover_image_path: input.cover_image_path ?? null,
          cover_width: input.cover_width ?? null,
          cover_height: input.cover_height ?? null,
          video_source: input.video_source ?? null,
          video_url: input.video_url ?? null,
          sort_order: sortOrder,
          published: Boolean(input.published),
          created_at: timestamp,
          updated_at: timestamp,
        })
        .select()
    );
    return (await getBookById(id))!;
  }

  getDb()
    .prepare(
      `INSERT INTO books
        (id, title, slug, kind, subtitle, description, long_description, publication_year, status,
         retailers, cover_image_path, cover_width, cover_height, video_source, video_url, sort_order, published, featured,
         created_at, updated_at)
       VALUES (@id, @title, @slug, 'book', @subtitle, @description, @long_description, @publication_year, @status,
         @retailers, @cover_image_path, @cover_width, @cover_height, @video_source, @video_url, @sort_order, @published, 0,
         @created_at, @updated_at)`
    )
    .run({
      id,
      title: input.title,
      slug: input.slug,
      subtitle: input.subtitle ?? null,
      description: input.description,
      long_description: input.long_description ?? null,
      publication_year: input.publication_year ?? null,
      status: input.status,
      retailers: JSON.stringify(retailers),
      cover_image_path: input.cover_image_path ?? null,
      cover_width: input.cover_width ?? null,
      cover_height: input.cover_height ?? null,
      video_source: input.video_source ?? null,
      video_url: input.video_url ?? null,
      sort_order: sortOrder,
      published: input.published ? 1 : 0,
      created_at: timestamp,
      updated_at: timestamp,
    });
  return (await getBookById(id))!;
}

export type BookUpdateInput = Partial<BookInput> & { featured?: boolean };

export async function updateBook(id: string, input: BookUpdateInput): Promise<Book> {
  const existing = await getBookById(id);
  if (!existing) throw new Error("Book not found");

  const pick = <T>(next: T | undefined, current: T): T => (next !== undefined ? next : current);
  const merged = {
    title: pick(input.title, existing.title),
    slug: pick(input.slug, existing.slug),
    subtitle: pick(input.subtitle, existing.subtitle),
    description: pick(input.description, existing.description),
    long_description: pick(input.long_description, existing.long_description),
    publication_year: pick(input.publication_year, existing.publication_year),
    status: pick(input.status, existing.status),
    retailers: pick(input.retailers, existing.retailers),
    cover_image_path: pick(input.cover_image_path, existing.cover_image_path),
    cover_width: pick(input.cover_width, existing.cover_width),
    cover_height: pick(input.cover_height, existing.cover_height),
    video_source: pick(input.video_source, existing.video_source),
    video_url: pick(input.video_url, existing.video_url),
    published: pick(input.published, existing.published),
    featured: pick(input.featured, existing.featured),
    updated_at: nowIso(),
  };

  if (isSupabaseConfigured()) {
    unwrap(await createSupabaseAdminClient().from("books").update(merged).eq("id", id).select());
    return (await getBookById(id))!;
  }

  getDb()
    .prepare(
      `UPDATE books SET
        title = @title, slug = @slug, subtitle = @subtitle, description = @description,
        long_description = @long_description, publication_year = @publication_year, status = @status,
        retailers = @retailers, cover_image_path = @cover_image_path, cover_width = @cover_width,
        cover_height = @cover_height, video_source = @video_source, video_url = @video_url,
        published = @published, featured = @featured,
        updated_at = @updated_at
       WHERE id = @id`
    )
    .run({
      ...merged,
      retailers: JSON.stringify(merged.retailers),
      published: merged.published ? 1 : 0,
      featured: merged.featured ? 1 : 0,
      id,
    });

  return (await getBookById(id))!;
}

export class ReorderError extends Error {}

/**
 * Persists a new display order. `ids` must be exactly the set of existing
 * books (a stale list from another tab is rejected rather than half-applied).
 */
export async function reorderBooks(ids: string[]): Promise<void> {
  const existing = (await listAllBooksAdmin()).map((b) => b.id);
  const unique = new Set(ids);
  if (unique.size !== ids.length || ids.length !== existing.length || !existing.every((id) => unique.has(id))) {
    throw new ReorderError("The list of books has changed. Reload the page and try again.");
  }

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseAdminClient();
    for (const [index, id] of ids.entries()) {
      unwrap(await supabase.from("books").update({ sort_order: index + 1 }).eq("id", id).select("id"));
    }
    return;
  }
  const db = getDb();
  const update = db.prepare(`UPDATE books SET sort_order = ? WHERE id = ?`);
  db.transaction(() => {
    ids.forEach((id, index) => update.run(index + 1, id));
  })();
}
