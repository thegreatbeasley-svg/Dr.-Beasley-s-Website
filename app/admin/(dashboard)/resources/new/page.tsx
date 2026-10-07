import ResourceForm from "@/app/components/admin/ResourceForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function NewResourcePage() {
  return (
    <div>
      <h1 className="text-2xl font-medium text-paper">New resource</h1>
      <p className="mt-1 text-sm text-paper-muted">
        Upload a PDF, add a description, and choose whether it&rsquo;s visible on the public site.
      </p>
      <div className="mt-8">
        <ResourceForm mode="create" directUpload={isSupabaseConfigured()} />
      </div>
    </div>
  );
}
