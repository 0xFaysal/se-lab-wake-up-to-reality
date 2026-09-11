import { ShieldCheck, Clock, CreditCard, Lock } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SafetyConfirmationPreview() {
  return (
    <section className="py-20 bg-muted/20 border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left: Text & Features */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
                Financial & Access Transparency
              </span>

              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading leading-tight">
                Know what you are confirming.
              </h2>

              <p className="text-base text-muted-foreground leading-relaxed">
                No hidden fees, surprise surge charges, or ambiguous gate policies.
                Every fee and rule is itemized upfront before you pay.
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-2xs urban-card-shadow">
                <CreditCard className="size-5 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-foreground font-heading">
                    Transparent Hourly Pricing
                  </h4>
                  <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                    Clear rate calculation based on your selected start and end hours with zero surprise charges.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-2xs urban-card-shadow">
                <Clock className="size-5 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-foreground font-heading">
                    Automated 15-Min Buffer
                  </h4>
                  <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                    Complimentary 15-minute departure grace period after your scheduled booking ends.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-2xs urban-card-shadow">
                <ShieldCheck className="size-5 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-foreground font-heading">
                    Intermediary Protection & Escrow
                  </h4>
                  <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                    Payments are safely escrowed and released to hosts only after successful guard-verified entry.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Booking Summary Invoice Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl shadow-black/5 ring-1 ring-border space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider font-heading">
                    Booking Summary
                  </span>
                  <h3 className="text-base font-bold text-foreground font-heading mt-0.5">
                    Dhanmondi Residential Parking
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Road 27, House 42 • Spot #A-02
                  </p>
                </div>
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary font-mono">
                  ৳60/hr
                </span>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Duration (2 Hours):</span>
                  <span className="font-medium text-foreground">৳120.00</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Platform Service Fee:</span>
                  <span className="font-medium text-foreground">৳10.00</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 font-bold text-base text-foreground">
                  <span>Total Amount:</span>
                  <span className="text-primary font-mono font-black text-lg">৳130.00</span>
                </div>
              </div>

              {/* Security Shield Tag */}
              <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3 text-xs text-primary border border-primary/15 font-medium">
                <Lock className="size-4 shrink-0" />
                <span>Encrypted SSLCOMMERZ / bKash Checkout</span>
              </div>

              <Link
                href="/parking"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full bg-primary text-white hover:bg-primary/90 font-bold text-sm rounded-lg shadow-xs"
                )}
              >
                Search & Reserve Spots
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
