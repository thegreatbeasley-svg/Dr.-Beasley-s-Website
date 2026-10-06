import Link from "next/link";
import { listAllResourcesAdmin } from "@/lib/resources/queries";
import AdminResourcesTable from "@/app/components/admin/AdminResourcesTable";

export const dynamic = "force-dynamic";

export default function AdminResourcesPage() {
  const resources = listAllResourcesAdmin();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-paper">Resources</h1>
          <p className="mt-1 text-sm text-paper-muted">
            Create, publish, and feature the resources visitors can request.
          </p>
        </div>
        <Link
          href="/admin/resources/new"
          className="rounded-full bg-tangerine px-5 py-3 text-xs font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
        >
          New resource
        </Link>
      </div>
      <AdminResourcesTable resources={resources} />
    </div>
  );
}
