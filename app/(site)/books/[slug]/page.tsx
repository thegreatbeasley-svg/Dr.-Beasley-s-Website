import { notFound } from "next/navigation";
import Link from "next/link";
import BookFeature from "@/app/components/books/BookFeature";
import { getPublishedBookBySlug } from "@/lib/books/queries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getPublishedBookBySlug(slug);
  if (!book) {
    return buildMetadata({ title: "Not found", description: "", path: `/books/${slug}`, index: false });
  }
  return buildMetadata({
    title: `${book.title} — Dr. Virgil Beasley`,
    description: book.description,
    path: `/books/${book.slug}`,
  });
}

export default async function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getPublishedBookBySlug(slug);
  if (!book) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
      <Link href="/books" className="text-sm font-medium text-gold underline-offset-4 hover:underline">
        &larr; All books
      </Link>
      <div className="mt-10 sm:mt-14">
        <BookFeature book={book} variant="detail" priority />
      </div>
    </div>
  );
}
