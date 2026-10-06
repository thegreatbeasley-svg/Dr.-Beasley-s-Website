import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin/resources");
  }

  const backend = isSupabaseConfigured() ? "supabase" : "sqlite";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-paper">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
          {backend === "supabase" ? "Admin" : "Local demo"}
        </p>
        <h1 className="mt-3 text-2xl font-medium">Admin sign in</h1>
        <p className="mt-2 max-w-sm text-sm text-paper-muted">
          {backend === "supabase"
            ? "Sign in with the Supabase account authorized for admin access."
            : "This is a local demo login, not production authentication. See README.md for the demo credentials and what a real deployment would need instead."}
        </p>
      </div>
      <AdminLoginForm backend={backend} />
    </div>
  );
}
