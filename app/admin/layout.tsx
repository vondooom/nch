import { requireSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/shell";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireSession();
  return <AdminShell user={user}>{children}</AdminShell>;
}
