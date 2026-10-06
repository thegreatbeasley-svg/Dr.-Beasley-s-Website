import Link from "next/link";
import type { Book } from "@/lib/books/types";
import { getBookCoverUrl, getBookStatusLabel } from "@/lib/books/cover";
import ContentCard from "@/app/components/ui/ContentCard";

export default function BodyOfWorkHighlights({ books }: { books: Book[] }) {
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">Body of work</p>
            <h2 className="mt-3 text-3xl font-medium text-paper">Books &amp; programmes</h2>
          </div>
          <Link href="/books" className="text-sm font-medium text-gold underline-offset-4 hover:underline">
            See all →
          </Link>
        </div>

        {books.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-white/10 bg-ink-elevated p-6 text-paper-muted">
            Books and programmes will appear here once published.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    </section>
  );
}
