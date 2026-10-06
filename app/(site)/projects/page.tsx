import Link from "next/link";
import { listPublishedProjects } from "@/lib/projects/queries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Projects — Dr. Virgil Beasly",
  description: "Related initiatives connected to Dr. Virgil Beasly.",
  path: "/projects",
});

export default async function ProjectsPage() {
  const projects = await listPublishedProjects();

  return (
    <div className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">Projects</p>
        <h1 className="mt-5 text-3xl font-medium text-paper sm:text-4xl">Related initiatives</h1>
        <p className="mt-4 text-base leading-relaxed text-paper-muted">
          A few related projects, with Dr. Virgil Beasly&rsquo;s relationship to each noted
          explicitly.
        </p>
      </div>

      {projects.length === 0 ? (
        <p className="mt-16 text-center text-paper-muted">
          Nothing is published here yet. Check back soon.
        </p>
      ) : (
        <ul className="mt-12 space-y-4">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.slug}`}
                className="block rounded-2xl border border-white/10 bg-ink-elevated p-6 transition-colors hover:border-gold/40"
              >
                <h2 className="text-lg font-medium text-paper">{project.name}</h2>
                <p className="mt-2 text-xs font-medium uppercase tracking-wider text-gold">
                  {project.relationship_note}
                </p>
                {project.description && (
                  <p className="mt-2 text-sm text-paper-muted">{project.description}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
