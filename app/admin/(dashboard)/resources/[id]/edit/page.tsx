import { notFound } from "next/navigation";
import { getResourceById } from "@/lib/resources/queries";
import ResourceForm from "@/app/components/admin/ResourceForm";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = await getResourceById(id);
  if (!resource) notFound();

  return (
    <div>
      <h1 className="text-2xl font-medium text-paper">Edit resource</h1>
      <p className="mt-1 text-sm text-paper-muted">{resource.title}</p>
      <div className="mt-8">
        <ResourceForm mode="edit" resourceId={resource.id} initial={resource} />
      </div>
    </div>
  );
}
