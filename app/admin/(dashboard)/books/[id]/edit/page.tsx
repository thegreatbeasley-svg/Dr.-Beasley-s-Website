import Link from "next/link";
import DangerZone from "@/app/components/admin/DangerZone";
import { notFound } from "next/navigation";
import { getBookById } from "@/lib/books/queries";
import BookForm from "@/app/components/admin/BookForm";
import { requireAdminPage } from "@/lib/admin/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const book = await getBookById(id);
  if (!book) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-paper">Edit book</h1>
          <p className="mt-1 text-sm text-paper-muted">{book.title}</p>
        </div>
        <Link href={`/admin/books/${book.id}/preview`} className="text-sm text-gold underline-offset-4 hover:underline">
          Preview the saved version →
        </Link>
      </div>
      <div className="mt-8">
        <BookForm mode="edit" bookId={book.id} initial={book} directUpload={isSupabaseConfigured()} />
      </div>
      <DangerZone
        apiPath={`/api/admin/books/${book.id}`}
        listPath="/admin/books"
        itemLabel="book"
        itemName={book.title}
        consequence="Its cover image and any uploaded video are removed from storage too."
      />
    </div>
  );
}
