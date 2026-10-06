import { notFound } from "next/navigation";
import { getBookById } from "@/lib/books/queries";
import BookForm from "@/app/components/admin/BookForm";

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = getBookById(id);
  if (!book) notFound();

  return (
    <div>
      <h1 className="text-2xl font-medium text-paper">Edit book entry</h1>
      <p className="mt-1 text-sm text-paper-muted">{book.title}</p>
      <div className="mt-8">
        <BookForm mode="edit" bookId={book.id} initial={book} />
      </div>
    </div>
  );
}
