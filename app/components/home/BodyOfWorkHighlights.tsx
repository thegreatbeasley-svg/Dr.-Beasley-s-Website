import Link from "next/link";
import type { Book } from "@/lib/books/types";
import { getBookCoverUrl, getBookStatusLabel } from "@/lib/books/cover";
import ContentCard from "@/app/components/ui/ContentCard";

export default function BodyOfWorkHighlights({ books }: { books: Book[] }) {
  if (books.length === 0) return null;

  return (
    <section className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">
              Books &amp; Body of Work
            </p>
            <h2 className="mt-3 text-3xl font-medium text-paper">Ideas developed over a lifetime</h2>
          </div>
          <Link href="/books" className="text-sm font-medium text-gold underline-offset-4 hover:underline">
            Explore the Body of Work →
          </Link>
        </div>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-paper-muted">
          Explore the books, frameworks and longer-form work through which Dr. Beasly&rsquo;s
          thinking continues to take shape.
        </p>

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
      </div>
    </section>
  );
}
