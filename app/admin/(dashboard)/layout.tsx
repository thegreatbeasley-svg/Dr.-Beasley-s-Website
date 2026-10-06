import { requireAdminPage } from "@/lib/admin/session";
import AdminShell from "@/app/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <AdminShell>{children}</AdminShell>;
}
