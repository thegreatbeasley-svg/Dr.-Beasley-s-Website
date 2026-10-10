import DangerZone from "@/app/components/admin/DangerZone";
import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/projects/queries";
import ProjectForm from "@/app/components/admin/ProjectForm";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  return (
    <div>
      <h1 className="text-2xl font-medium text-paper">Edit project</h1>
      <p className="mt-1 text-sm text-paper-muted">{project.name}</p>
      <div className="mt-8">
        <ProjectForm mode="edit" projectId={project.id} initial={project} />
      </div>
      <DangerZone
        apiPath={`/api/admin/projects/${project.id}`}
        listPath="/admin/projects"
        itemLabel="project"
        itemName={project.name}
        consequence="The record is removed from the site."
      />
    </div>
  );
}
