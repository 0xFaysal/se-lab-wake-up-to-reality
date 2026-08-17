import type { Metadata } from "next";
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
    <div className="flex min-h-full flex-1">
      {/* Left Brand Panel — hidden on mobile */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center bg-foreground lg:flex">
        {/* Decorative grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="relative z-10 flex flex-col items-center gap-6 px-12 text-center">
          <AppLogo size="lg" linkTo="/" className="text-white [&_span]:text-white [&_span:last-child]:text-primary" />
          <h2 className="max-w-md text-2xl font-semibold leading-snug text-white">
            Secure hourly parking,{" "}
            <span className="text-primary">anywhere in Dhaka.</span>
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-white/60">
            Join thousands of drivers and parking owners making urban parking
            accessible. Verified spaces, transparent pricing, instant booking.
          </p>
        </div>

        {/* Decorative accent */}
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <AppLogo size="lg" />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
