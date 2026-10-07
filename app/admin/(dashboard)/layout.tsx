import { requireAdminPage } from "@/lib/admin/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import AdminShell from "@/app/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <AdminShell isLocalDemo={!isSupabaseConfigured()}>{children}</AdminShell>;
}
