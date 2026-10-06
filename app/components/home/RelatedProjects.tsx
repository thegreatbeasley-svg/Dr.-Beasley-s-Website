import Link from "next/link";
import type { Project } from "@/lib/projects/types";

export default function RelatedProjects({ projects }: { projects: Project[] }) {
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">Connections</p>
          <h2 className="mt-3 text-3xl font-medium text-paper">Related projects</h2>
        </div>

        {projects.length === 0 ? (
          <p className="mx-auto mt-10 max-w-md rounded-2xl border border-white/10 bg-ink-elevated p-6 text-center text-paper-muted">
            Related initiatives will appear here once published.
          </p>
        ) : (
          <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="block rounded-2xl border border-white/10 bg-ink-elevated p-6 transition-colors hover:border-gold/40"
                >
                  <h3 className="text-base font-medium text-paper">{project.name}</h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gold">
                    {project.relationship_note}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
