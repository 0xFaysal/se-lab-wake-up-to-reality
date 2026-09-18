import { Check, CreditCard, Smartphone, Wallet } from "lucide-react";
import { SavedPaymentMethod } from "../types";

interface PaymentMethodsSidebarProps {
  defaultMethod?: SavedPaymentMethod;
}

export function PaymentMethodsSidebar({
  defaultMethod,
}: PaymentMethodsSidebarProps) {
  function renderDefaultIcon() {
    if (!defaultMethod) return <Wallet className="size-4 text-primary" />;
    if (defaultMethod.type === "CARD") {
      return <CreditCard className="size-4 text-primary" />;
    }
    if (defaultMethod.type === "BKASH") {
      return <Smartphone className="size-4 text-pink-600" />;
    }
    return <Wallet className="size-4 text-amber-600" />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Why save a payment method? */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs urban-card-shadow space-y-4">
        <h3 className="text-lg font-bold text-foreground font-heading">
          Why save a payment method?
        </h3>

        <div className="space-y-4 text-xs sm:text-sm">
          {/* Item 1 */}
          <div className="flex items-start gap-3">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
              <Check className="size-3 stroke-[3]" />
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-foreground block font-heading">
                Faster Checkout
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Book parking spots instantly without re-entering details.
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex items-start gap-3">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
              <Check className="size-3 stroke-[3]" />
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-foreground block font-heading">
                Flexible Payments
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Switch between multiple methods seamlessly.
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="flex items-start gap-3">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
              <Check className="size-3 stroke-[3]" />
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-foreground block font-heading">
                Secure Processing
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Industry-standard encryption for all transactions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Default Payment Box */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs urban-card-shadow space-y-3">
        <h3 className="text-lg font-bold text-foreground font-heading">
          Default Payment
        </h3>

        {defaultMethod ? (
          <div className="rounded-xl border border-border bg-muted/40 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card border border-border/80">
                {renderDefaultIcon()}
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-foreground font-heading block truncate">
                  {defaultMethod.title}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono block">
                  {defaultMethod.subtitle}
                </span>
              </div>
            </div>

            <div className="size-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0" />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No default payment method selected.
          </p>
        )}

        <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
          This method will be used for auto-renewing reservations and quick
          bookings.
        </p>
      </div>
    </div>
  );
}
