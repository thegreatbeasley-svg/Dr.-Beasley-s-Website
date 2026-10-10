import Link from "next/link";
import DeletedBanner from "@/app/components/admin/DeletedBanner";
import { listAllProjectsAdmin } from "@/lib/projects/queries";
import AdminPublishTable from "@/app/components/admin/AdminPublishTable";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string | string[] }>;
}) {
  const projects = await listAllProjectsAdmin();
  const items = projects.map((p) => ({
    id: p.id,
    title: p.name,
    subtitle: `/${p.slug}`,
    badge: "Project",
    published: p.published,
    featured: p.featured,
  }));

  return (
    <div>
      <DeletedBanner searchParams={searchParams} />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-paper">Projects</h1>
          <p className="mt-1 text-sm text-paper-muted">
            Related initiatives. Keep the relationship note a draft until confirmed.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="rounded-full bg-tangerine px-5 py-3 text-xs font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
        >
          New project
        </Link>
      </div>
      <AdminPublishTable items={items} apiBase="/api/admin/projects" editBase="/admin/projects" emptyLabel="No related projects yet." />
    </div>
  );
}
