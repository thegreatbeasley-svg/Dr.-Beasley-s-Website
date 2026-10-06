import Link from "next/link";
import { listAllBooksAdmin } from "@/lib/books/queries";
import { getBookStatusLabel } from "@/lib/books/cover";
import AdminPublishTable from "@/app/components/admin/AdminPublishTable";

export const dynamic = "force-dynamic";

export default async function AdminBooksPage() {
  const books = await listAllBooksAdmin();
  const items = books.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: `/${b.slug} · ${getBookStatusLabel(b.status)}`,
    badge: b.kind[0].toUpperCase() + b.kind.slice(1),
    published: b.published,
    featured: b.featured,
  }));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-paper">Books &amp; Body of Work</h1>
          <p className="mt-1 text-sm text-paper-muted">
            Books, frameworks, research, and programmes. Information and CTA only — no payments yet.
          </p>
        </div>
        <Link
          href="/admin/books/new"
          className="rounded-full bg-tangerine px-5 py-3 text-xs font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
        >
          New entry
        </Link>
      </div>
      <AdminPublishTable items={items} apiBase="/api/admin/books" editBase="/admin/books" emptyLabel="No books or body-of-work entries yet." />
    </div>
  );
}
