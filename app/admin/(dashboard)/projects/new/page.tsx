import ProjectForm from "@/app/components/admin/ProjectForm";

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="text-2xl font-medium text-paper">New project</h1>
      <p className="mt-1 text-sm text-paper-muted">
        Do not describe the relationship to Dr. Virgil Beasly until it&rsquo;s confirmed — leave
        the draft placeholder as-is if unsure.
      </p>
      <div className="mt-8">
        <ProjectForm mode="create" />
      </div>
    </div>
  );
}
