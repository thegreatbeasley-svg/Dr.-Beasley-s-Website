import Link from "next/link";
import RichText from "@/app/components/RichText";
import type { PublicBook } from "@/lib/books/types";
import { getVideoEmbed } from "@/lib/books/video";
import BookCover from "./BookCover";
import RetailerLinks from "./RetailerLinks";
import VideoPlayer from "./VideoPlayer";

type Props = {
  book: PublicBook;
  /** "shelf" = one entry on /books; "detail" = the book's own page. */
  variant?: "shelf" | "detail";
  /** Position on the shelf — odd entries put the cover on the right (desktop). */
  index?: number;
  priority?: boolean;
};

function yearLine(book: PublicBook) {
  if (!book.publication_year) return null;
  return book.status === "coming_soon" ? `Expected ${book.publication_year}` : `Published ${book.publication_year}`;
}

export default function BookFeature({ book, variant = "shelf", index = 0, priority = false }: Props) {
  const detail = variant === "detail";
  const hasCover = Boolean(book.cover_image_path);
  const flip = !detail && index % 2 === 1;
  const year = yearLine(book);
  const comingSoon = book.status === "coming_soon";
  const video = getVideoEmbed(book);

  const Heading = detail ? "h1" : "h2";
  const headingClass = detail
    ? "mt-4 text-balance font-display text-4xl font-medium leading-[1.1] text-paper sm:text-5xl"
    : "mt-4 text-balance font-display text-3xl font-medium leading-[1.12] text-paper sm:text-4xl";
  const coverSizes = "(min-width: 1024px) 380px, (min-width: 768px) 38vw, 70vw";

  return (
    <article aria-labelledby={`book-${book.slug}`}>
      <div className={`grid items-center gap-10 md:gap-14 ${hasCover ? "md:grid-cols-12" : ""}`}>
        {hasCover && (
          <div
            className={`mx-auto w-56 sm:w-64 md:mx-0 md:w-full md:max-w-sm md:col-span-5 ${flip ? "md:order-2 md:justify-self-end" : "md:justify-self-start"}`}
          >
            {detail ? (
              <BookCover book={book} priority={priority} sizes={coverSizes} />
            ) : (
              <Link href={`/books/${book.slug}`} aria-label={`${book.title} — book page`} className="block">
                <BookCover book={book} priority={priority} sizes={coverSizes} />
              </Link>
            )}
          </div>
        )}

        <div className={`${hasCover ? "md:col-span-7" : "mx-auto max-w-2xl"} ${flip ? "md:order-1" : ""}`}>
          <span aria-hidden="true" className="block h-px w-12 bg-gold" />
          {(comingSoon || year) && (
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              {[comingSoon ? "Coming soon" : null, year].filter(Boolean).join(" · ")}
            </p>
          )}
          <Heading id={`book-${book.slug}`} className={headingClass}>
            {detail ? (
              book.title
            ) : (
              <Link href={`/books/${book.slug}`} className="transition-colors hover:text-gold">
                {book.title}
              </Link>
            )}
          </Heading>
          {book.subtitle && (
            <p className="mt-3 font-display text-xl italic leading-snug text-gold/90 sm:text-2xl">{book.subtitle}</p>
          )}

          <RichText text={book.description} className="mt-6 text-base leading-[1.8] text-paper-muted sm:text-lg" />
          {detail && book.long_description && (
            <RichText text={book.long_description} className="mt-5 text-base leading-[1.8] text-paper-muted sm:text-lg" />
          )}

          {(book.retailers.length > 0 || (!detail && book.long_description)) && (
            <div className="mt-8 space-y-6">
              <RetailerLinks retailers={book.retailers} />
              {!detail && book.long_description && (
                <Link
                  href={`/books/${book.slug}`}
                  className="inline-block text-sm font-medium text-gold underline-offset-4 hover:underline"
                >
                  More about this book →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {video && (
        <div className="mx-auto mt-14 max-w-3xl md:mt-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">Watch</p>
          <div className="mt-4">
            <VideoPlayer video={video} title={book.title} />
          </div>
        </div>
      )}
    </article>
  );
}
