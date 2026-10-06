import { notFound } from "next/navigation";
import Link from "next/link";
import ResourceDetail from "@/app/components/resources/ResourceDetail";
import { getPublishedResourceBySlug } from "@/lib/resources/queries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = await getPublishedResourceBySlug(slug);
  if (!resource) return buildMetadata({ title: "Resource not found", description: "", path: `/resources/${slug}`, index: false });

  return buildMetadata({
    title: `${resource.title} — Dr. Virgil Beasly`,
    description: resource.short_description,
    path: `/resources/${resource.slug}`,
  });
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = await getPublishedResourceBySlug(slug);

  if (!resource) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      <Link
        href="/knowledge"
        className="text-sm font-medium text-gold underline-offset-4 hover:underline"
      >
        &larr; Back to the Knowledge Hub
      </Link>
      <div className="mt-8">
        <ResourceDetail resource={resource} />
      </div>
    </div>
  );
}
