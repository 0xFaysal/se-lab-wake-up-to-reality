import { RoleGuard } from "@/components/auth/role-guard";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["ADMIN"]}><AdminShell>{children}</AdminShell></RoleGuard>;
}
