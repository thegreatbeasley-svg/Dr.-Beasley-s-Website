import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedBookBySlug } from "@/lib/books/queries";
import { getBookCoverUrl, getBookStatusLabel } from "@/lib/books/cover";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getPublishedBookBySlug(slug);
  if (!book) {
    return buildMetadata({ title: "Not found", description: "", path: `/books/${slug}`, index: false });
  }
  return buildMetadata({
    title: `${book.title} — Dr. Virgil Beasly`,
    description: book.description,
    path: `/books/${book.slug}`,
  });
}

export default async function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getPublishedBookBySlug(slug);
  if (!book) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      <Link href="/books" className="text-sm font-medium text-gold underline-offset-4 hover:underline">
        &larr; Back to Books &amp; Body of Work
      </Link>

      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,220px)_1fr] md:gap-10">
        <div className="mx-auto w-40 sm:w-48 md:mx-0 md:w-full">
          <div className="overflow-hidden rounded-xl border border-white/10 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic/admin-uploaded cover */}
            <img src={getBookCoverUrl(book)} alt="" className="aspect-[3/4] w-full object-cover" />
          </div>
        </div>

        <div>
          <span className="inline-block rounded-full border border-gold/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold">
            {getBookStatusLabel(book.status)}
          </span>
          <h1 className="mt-3 text-2xl font-medium text-paper sm:text-3xl">{book.title}</h1>
          <p className="mt-4 text-base leading-relaxed text-paper-muted">{book.description}</p>

          {book.cta_label && (
            <div className="mt-8">
              <Link
                href={book.cta_url || "/contact"}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
              >
                {book.cta_label}
              </Link>
            </div>
          )}

          <p className="mt-6 text-xs text-paper-muted/70">
            Purchasing isn&rsquo;t connected in this demo. This page is informational only.
          </p>
        </div>
      </div>
    </div>
  );
}
