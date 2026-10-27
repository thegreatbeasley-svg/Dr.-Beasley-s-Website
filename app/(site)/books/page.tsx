import { listPublishedBooks } from "@/lib/books/queries";
import BookFeature from "@/app/components/books/BookFeature";
import ComingSoon from "@/app/components/ui/ComingSoon";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const INTRO =
  "Stories, insights, and practical guidance for navigating life’s most difficult transitions—and discovering what comes next.";

export const metadata = buildMetadata({
  title: "Books by Dr. Virgil Beasley",
  description: INTRO,
  path: "/books",
});

export default async function BooksPage() {
  const books = await listPublishedBooks();

  return (
    <>
      <section aria-labelledby="books-heading" className="relative overflow-hidden border-b border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-gold/10 blur-[140px]"
        />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
          <span aria-hidden="true" className="mx-auto block h-px w-12 bg-gold" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.35em] text-gold">Books</p>
          <h1
            id="books-heading"
            className="mt-6 text-balance font-display text-4xl font-medium leading-[1.12] text-paper sm:text-5xl"
          >
            Books by Dr. Virgil Beasley
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty font-display text-lg italic leading-relaxed text-paper-muted sm:text-xl">
            {INTRO}
          </p>
        </div>
      </section>

      {books.length === 0 ? (
        <div className="mx-auto max-w-6xl px-6 pb-24">
          <ComingSoon
            title="Books"
            message="Dr. Beasley’s books will be listed here soon."
            ctaHref="/knowledge"
            ctaLabel="Visit the Knowledge Hub"
          />
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-6">
          {books.map((book, index) => (
            <div key={book.id} className="border-b border-white/10 py-16 last:border-b-0 sm:py-24">
              <BookFeature book={book} index={index} priority={index === 0} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
