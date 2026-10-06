import { notFound } from "next/navigation";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import ResourceDetail from "@/app/components/resources/ResourceDetail";
import { getPublishedResourceBySlug } from "@/lib/resources/queries";

export const dynamic = "force-dynamic";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = getPublishedResourceBySlug(slug);

  if (!resource) notFound();

  return (
    <>
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <Link
            href="/#library"
            className="text-sm font-medium text-gold underline-offset-4 hover:underline"
          >
            &larr; Back to the library
          </Link>
          <div className="mt-8">
            <ResourceDetail resource={resource} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
