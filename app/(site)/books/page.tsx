import { listPublishedBooks } from "@/lib/books/queries";
import { getBookCoverUrl, getBookStatusLabel } from "@/lib/books/cover";
import ContentCard from "@/app/components/ui/ContentCard";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Books & Body of Work — Dr. Virgil Beasly",
  description: "Books, frameworks, research, and programmes from Dr. Virgil Beasly.",
  path: "/books",
});

export default async function BooksPage() {
  const books = await listPublishedBooks();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">Body of Work</p>
        <h1 className="mt-5 text-3xl font-medium text-paper sm:text-4xl">Books &amp; body of work</h1>
        <p className="mt-4 text-base leading-relaxed text-paper-muted">
          Books, frameworks, research, and programmes. This section is informational for now —
          purchasing isn&rsquo;t connected yet.
        </p>
      </div>

      {books.length === 0 ? (
        <p className="mt-16 text-center text-paper-muted">
          Nothing is published here yet. Check back soon.
        </p>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <ContentCard
              key={book.id}
              href={`/books/${book.slug}`}
              coverUrl={getBookCoverUrl(book)}
              badge={getBookStatusLabel(book.status)}
              title={book.title}
              description={book.description}
              cta="Learn more"
            />
          ))}
        </div>
      )}
    </div>
  );
}
