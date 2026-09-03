import { Suspense } from "react";
import type { Metadata } from "next";
import { OtpVerificationForm } from "@/components/auth/otp-verification-form";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Verify Security Code",
  description: "Enter the OTP verification code sent to your phone or email.",
};

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      }
    >
      <OtpVerificationForm />
    </Suspense>
  );
}
