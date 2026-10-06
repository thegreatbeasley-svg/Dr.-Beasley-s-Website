import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedProjectBySlug } from "@/lib/projects/queries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) {
    return buildMetadata({ title: "Not found", description: "", path: `/projects/${slug}`, index: false });
  }
  return buildMetadata({
    title: `${project.name} — Dr. Virgil Beasly`,
    description: project.description || project.relationship_note,
    path: `/projects/${project.slug}`,
  });
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <Link href="/projects" className="text-sm font-medium text-gold underline-offset-4 hover:underline">
        &larr; Back to Projects
      </Link>

      <h1 className="mt-8 text-2xl font-medium text-paper sm:text-3xl">{project.name}</h1>
      <p className="mt-3 inline-block rounded-full border border-gold/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
        {project.relationship_note}
      </p>

      {project.description && (
        <p className="mt-6 text-base leading-relaxed text-paper-muted">{project.description}</p>
      )}

      {project.url && (
        <div className="mt-8">
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-tangerine px-8 py-4 text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
          >
            Visit {project.name} ↗
          </a>
        </div>
      )}
    </div>
  );
}
