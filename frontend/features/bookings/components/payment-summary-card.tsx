import { CreditCard, CheckCircle2 } from "lucide-react";
import { PaymentSummary } from "@/types/driver";

interface PaymentSummaryCardProps {
  payment: PaymentSummary;
}

export function PaymentSummaryCard({ payment }: PaymentSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-border/50 urban-card-shadow space-y-4">
      <h3 className="text-lg font-bold text-foreground font-heading">
        Payment Summary
      </h3>

      <div className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Base Fee ({payment.durationHours} hours)</span>
          <span className="font-medium text-foreground font-mono">
            ৳ {payment.baseFee}
          </span>
        </div>

        <div className="flex items-center justify-between text-muted-foreground">
          <span>Service Fee</span>
          <span className="font-medium text-foreground font-mono">
            ৳ {payment.serviceFee}
          </span>
        </div>

        <div className="flex items-center justify-between text-muted-foreground">
          <span>VAT (10%)</span>
          <span className="font-medium text-foreground font-mono">
            ৳ {payment.vatAmount}
          </span>
        </div>

        <div className="border-t border-border pt-3 flex items-center justify-between">
          <span className="text-base font-bold text-foreground font-heading">
            Total Paid
          </span>
          <span className="text-xl font-black text-primary font-mono">
            ৳ {payment.totalPaid}
          </span>
        </div>
      </div>

      {/* Payment Method Pill */}
      <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 border border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-pink-50 text-pink-700 font-black text-xs">
            {payment.paymentMethod === "bKash" ? "bK" : "CC"}
          </div>
          <span className="text-xs font-bold text-foreground font-heading">
            {payment.paymentMethod}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-bold">
          <CheckCircle2 className="size-3" /> Paid
        </span>
      </div>
    </div>
  );
}
