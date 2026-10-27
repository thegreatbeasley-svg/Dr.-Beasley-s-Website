import Link from "next/link";
import DeletedBanner from "@/app/components/admin/DeletedBanner";
import { listAllBooksAdmin } from "@/lib/books/queries";
import { getBookStatusLabel } from "@/lib/books/cover";
import AdminPublishTable from "@/app/components/admin/AdminPublishTable";
import { requireAdminPage } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string | string[] }>;
}) {
  await requireAdminPage();
  const books = await listAllBooksAdmin();
  const items = books.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: `/books/${b.slug}${b.subtitle ? ` · ${b.subtitle}` : ""}`,
    badge: getBookStatusLabel(b.status === "draft" ? "available" : b.status),
    published: b.published,
    featured: b.featured,
  }));

  return (
    <div>
      <DeletedBanner searchParams={searchParams} />
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-paper">Books</h1>
          <p className="mt-1 text-sm text-paper-muted">
            Dr. Beasley&rsquo;s books, shown on the public Books page in the order below. Click Draft/Published to
            change visibility, and use the arrows to reorder.
          </p>
        </div>
        <Link
          href="/admin/books/new"
          className="shrink-0 rounded-full bg-tangerine px-5 py-3 text-xs font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
        >
          New book
        </Link>
      </div>
      <AdminPublishTable
        items={items}
        apiBase="/api/admin/books"
        editBase="/admin/books"
        emptyLabel="No books yet."
        reorderUrl="/api/admin/books/reorder"
        previewBase="/admin/books"
        showFeatured={false}
      />
    </div>
  );
}
