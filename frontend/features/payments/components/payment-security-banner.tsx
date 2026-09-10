import Link from "next/link";
import { Shield } from "lucide-react";

export function PaymentSecurityBanner() {
  return (
    <div className="rounded-2xl bg-blue-50/70 border border-blue-100/90 p-4 sm:p-5 flex items-start gap-3.5 text-xs sm:text-sm text-blue-950 shadow-2xs urban-card-shadow">
      <Shield className="size-5 text-blue-700 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <h4 className="font-bold text-blue-900 font-heading">
          Payment Security
        </h4>
        <p className="text-blue-800/90 leading-relaxed text-xs">
          Your payment information is processed securely. We do not store your
          full card details or mobile wallet PINs on our servers.{" "}
          <Link
            href="/privacy"
            className="font-semibold text-blue-900 underline underline-offset-2 hover:text-primary transition-colors"
          >
            Read our Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
