import { RoleGuard } from "@/components/auth/role-guard";
import { DriverShell } from "@/components/layout/driver-shell";

export default function DriverLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuard roles={["DRIVER"]}><DriverShell>{children}</DriverShell></RoleGuard>
  );
}
