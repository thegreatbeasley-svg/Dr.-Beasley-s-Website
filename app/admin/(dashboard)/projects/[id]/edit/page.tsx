import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/projects/queries";
import ProjectForm from "@/app/components/admin/ProjectForm";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) notFound();

  return (
    <div>
      <h1 className="text-2xl font-medium text-paper">Edit project</h1>
      <p className="mt-1 text-sm text-paper-muted">{project.name}</p>
      <div className="mt-8">
        <ProjectForm mode="edit" projectId={project.id} initial={project} />
      </div>
    </div>
  );
}
