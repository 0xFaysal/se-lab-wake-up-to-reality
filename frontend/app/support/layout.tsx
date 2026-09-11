import { DriverHeader } from "@/components/layout/driver-header";
import { MarketingFooter } from "@/components/layout/marketing-footer";

export default function SupportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DriverHeader />
      <main className="flex-1 py-8 sm:py-12">{children}</main>
      <MarketingFooter />
    </div>
  );
}
