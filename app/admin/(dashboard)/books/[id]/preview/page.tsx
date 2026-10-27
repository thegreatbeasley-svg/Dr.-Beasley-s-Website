import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookFeature from "@/app/components/books/BookFeature";
import { getBookById } from "@/lib/books/queries";
import { toPublicBook } from "@/lib/books/types";
import { requireAdminPage } from "@/lib/admin/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview book", robots: { index: false, follow: false } };

/**
 * Admin-only preview of a book — draft or published — using the exact
 * components the public site uses. Authenticates before reading anything.
 */
export default async function PreviewBookPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const book = await getBookById(id);
  if (!book) notFound();
  const preview = toPublicBook(book as unknown as Record<string, unknown>);

  return (
    <div>
      <div
        role="status"
        className={`rounded-xl border px-5 py-4 text-sm ${
          book.published ? "border-gold/40 bg-gold/10 text-paper" : "border-tangerine/50 bg-tangerine/10 text-paper"
        }`}
      >
        <strong className="font-semibold">{book.published ? "Published" : "Draft"}</strong>
        {" — "}
        {book.published
          ? "this book is live on the public Books page."
          : "this book is not visible to the public. Tick “Published” on the edit page when you're ready."}
        <span className="ml-4 inline-flex gap-4">
          <Link href={`/admin/books/${book.id}/edit`} className="text-gold underline-offset-4 hover:underline">
            Edit
          </Link>
          <Link href="/admin/books" className="text-gold underline-offset-4 hover:underline">
            All books
          </Link>
        </span>
      </div>
      {!book.cover_image_path && (
        <p className="mt-4 text-sm text-paper-muted">
          No cover has been uploaded yet, so the public page shows this book without an image.
        </p>
      )}

      <p className="mt-10 text-xs font-semibold uppercase tracking-[0.3em] text-paper-muted">On the Books page</p>
      <div className="mt-6 rounded-2xl border border-white/10 px-6 py-12 sm:px-10">
        <BookFeature book={preview} variant="shelf" />
      </div>

      <p className="mt-12 text-xs font-semibold uppercase tracking-[0.3em] text-paper-muted">
        On its own page (/books/{book.slug})
      </p>
      <div className="mt-6 rounded-2xl border border-white/10 px-6 py-12 sm:px-10">
        <BookFeature book={preview} variant="detail" />
      </div>
    </div>
  );
}
