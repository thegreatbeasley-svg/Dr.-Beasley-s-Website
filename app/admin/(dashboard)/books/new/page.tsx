import BookForm from "@/app/components/admin/BookForm";
import { requireAdminPage } from "@/lib/admin/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function NewBookPage() {
  await requireAdminPage();
  return (
    <div>
      <h1 className="text-2xl font-medium text-paper">New book</h1>
      <p className="mt-1 text-sm text-paper-muted">
        Save it as a draft first, use Preview to check how it looks, then publish when you&rsquo;re ready.
      </p>
      <div className="mt-8">
        <BookForm mode="create" directUpload={isSupabaseConfigured()} />
      </div>
    </div>
  );
}
