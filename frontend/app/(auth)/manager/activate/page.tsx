import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { ManagerActivationForm } from "@/components/auth/manager-activation-form";

export const metadata: Metadata = {
  title: "Activate Manager Account — ParkEase BD",
  description: "Complete your manager account activation and configure access credentials.",
};

export default function ManagerActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[#064E3B]" />
        </div>
      }
    >
      <ManagerActivationForm />
    </Suspense>
  );
}
