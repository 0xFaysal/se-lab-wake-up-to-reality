import { DriverHeader } from "@/components/layout/driver-header";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { RoleGuard } from "@/components/auth/role-guard";

export default function DriverLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DriverHeader />
      <main className="flex-1 py-8 sm:py-12"><RoleGuard roles={["DRIVER"]}>{children}</RoleGuard></main>
      <MarketingFooter />
    </div>
  );
}
