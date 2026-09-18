import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { OwnerKycForm } from "@/components/owner/owner-kyc-form";

export const metadata: Metadata = {
  title: "Host KYC Verification — ParkEase BD",
  description: "Verify your national identity and property credentials to enable automated earnings withdrawals.",
};

export default function OwnerKycPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/owner/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="size-3.5" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-6 text-[#064E3B]" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
            Host KYC Verification
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Submit your government identity documents to comply with Bangladesh financial regulations and unlock bank/MFS payout withdrawals.
        </p>
      </div>

      {/* KYC Form Card */}
      <OwnerKycForm />
    </div>
  );
}
