import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { ManagerActivationForm } from "@/components/auth/manager-activation-form";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";
import { AppLogo } from "@/components/common/app-logo";

export const metadata: Metadata = {
  title: "Activate Manager Account — ParkEase BD",
  description: "Complete your manager account activation and configure access credentials.",
};

export default function AuthManagerActivatePage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-[#f9f9ff]">
      {/* Left visual panel */}
      <AuthVisualPanel />

      {/* Right form container */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="mb-6 flex justify-center lg:hidden">
            <AppLogo size="lg" />
          </div>

          <Suspense
            fallback={
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-[#064E3B]" />
              </div>
            }
          >
            <ManagerActivationForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
