import ProjectForm from "@/app/components/admin/ProjectForm";
import { requireAdminPage } from "@/lib/admin/session";

export default async function NewProjectPage() {
  await requireAdminPage();
  return (
    <div>
      <h1 className="text-2xl font-medium text-paper">New project</h1>
      <p className="mt-1 text-sm text-paper-muted">
        Do not describe the relationship to Dr. Virgil Beasley until it&rsquo;s confirmed — leave
        the draft placeholder as-is if unsure.
      </p>
      <div className="mt-8">
        <ProjectForm mode="create" />
      </div>
    </div>
  );
}
