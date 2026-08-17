import type { Metadata } from "next";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";
import { AppLogo } from "@/components/common/app-logo";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in or create your ParkEase BD account.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left 50%: Visuals & Background Gate Image */}
      <AuthVisualPanel />

      {/* Right 50%: Centered Form Container */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md space-y-6">
          {/* Mobile-only Logo */}
          <div className="mb-6 flex justify-center lg:hidden">
            <AppLogo size="lg" />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
