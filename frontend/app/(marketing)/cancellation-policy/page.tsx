import type { Metadata } from "next";
import {
  RotateCcw,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Zap,
  CloudLightning,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description:
    "Learn about ParkEase BD driver cancellations, no-show rules, traffic grace periods, host penalties, and refund policies.",
};

export default function CancellationPolicyPage() {
  return (
    <div className="py-12 md:py-16 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <article className="rounded-3xl border border-border bg-card p-6 sm:p-12 shadow-sm space-y-8 text-foreground">
          <header className="border-b border-border pb-6">
            <span className="text-xs font-bold tracking-wider text-primary uppercase font-heading bg-primary/10 px-3 py-1 rounded-full">
              Policies & Guarantees
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl font-heading">
              Cancellation & Refund Policy
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Last Updated: August 2026 | Effective for all bookings
            </p>
          </header>

          <p className="text-sm leading-relaxed text-muted-foreground">
            Our cancellation and refund policies are designed to protect both the Drivers&apos;
            time and the Host&apos;s earning potential while acknowledging the urban realities
            of Dhaka traffic.
          </p>

          {/* Section 1: Driver Cancellations */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 font-heading">
              <RotateCcw className="size-5 text-primary" />
              1. Driver Cancellations
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              ParkEase BD uses a fair, graduated sliding scale based on how far in advance of the scheduled reservation start time you cancel. The refund percentage applies to the base parking charge:
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                <span className="text-xs font-bold text-primary">≥ 12 hours before start</span>
                <p className="mt-1 text-lg font-extrabold text-foreground">100% Refund</p>
                <p className="text-xs text-muted-foreground">Full refund of base parking charge</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                <span className="text-xs font-bold text-primary">6 to &lt; 12 hours</span>
                <p className="mt-1 text-lg font-extrabold text-foreground">90% Refund</p>
                <p className="text-xs text-muted-foreground">90% of base charge refunded</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                <span className="text-xs font-bold text-primary">3 to &lt; 6 hours</span>
                <p className="mt-1 text-lg font-extrabold text-foreground">75% Refund</p>
                <p className="text-xs text-muted-foreground">75% of base charge refunded</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                <span className="text-xs font-bold text-primary">1 to &lt; 3 hours</span>
                <p className="mt-1 text-lg font-extrabold text-foreground">50% Refund</p>
                <p className="text-xs text-muted-foreground">50% of base charge refunded</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                <span className="text-xs font-bold text-muted-foreground">&lt; 1 hour</span>
                <p className="mt-1 text-lg font-extrabold text-foreground">0% Refund</p>
                <p className="text-xs text-muted-foreground">Non-refundable within 60 minutes</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Security Deposit:</strong> The security deposit is <strong>100% refunded</strong> upon cancellation regardless of when you cancel.
              </p>
              <p>
                <strong className="text-foreground">Platform Fee:</strong> Non-refundable once a booking is confirmed, covering reservation processing and digital access pass infrastructure.
              </p>
              <p>
                <strong className="text-foreground">Instant Wallet Credit:</strong> All refundable amounts (base refund + full security deposit) are credited instantly to your registered ParkEase BD Driver wallet.
              </p>
            </div>
          </section>

          {/* Section 2: No-Show Policy */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 font-heading">
              <AlertTriangle className="size-5 text-primary" />
              2. No-Show Policy
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              ParkEase BD is not responsible for missed bookings. If a Driver fails to
              arrive and does not cancel in advance (No-Show), no refunds will be issued.
            </p>
          </section>

          {/* Section 3: Grace Period */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 font-heading">
              <Clock className="size-5 text-primary" />
              3. Grace Period & Traffic Buffers
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>Traffic Buffer:</strong> Acknowledging the unpredictability of Dhaka
                city traffic, Drivers are granted a <strong>15-minute grace period</strong>{" "}
                after their booking expires to exit the premises before overstay penalties
                are triggered.
              </p>
              <p>
                <strong>Late Arrival:</strong> Drivers may arrive after their scheduled start
                time, but the booking will still conclude at the originally reserved end time.
              </p>
            </div>
          </section>

          {/* Section 4: Host-Initiated Cancellations & Denied Entry */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 font-heading">
              <ShieldCheck className="size-5 text-primary" />
              4. Host-Initiated Cancellations & Denied Entry
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>Denied Entry:</strong> If a Driver arrives with a valid confirmed
                booking but is denied entry at the gate, they must report the issue
                immediately via the app or support. Upon verification, the Driver receives a{" "}
                <strong>100% full refund</strong>.
              </p>
              <p>
                <strong>Host Penalty:</strong> The Host&apos;s account will be temporarily
                suspended from accepting new bookings until the conflict is reviewed and
                resolved.
              </p>
            </div>
          </section>

          {/* Section 5: Overstay Charges */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 font-heading">
              <Zap className="size-5 text-primary" />
              5. Overstay Charges
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              If a Driver occupies the parking space beyond their booked time slot (and the
              15-minute grace period), the system will automatically deduct an Overstay
              Penalty from the security deposit or charge the registered account.
            </p>
          </section>

          {/* Section 6: Force Majeure & Severe Disruptions */}
          <section className="space-y-3 border-t border-border pt-6">
            <h2 className="text-xl font-bold flex items-center gap-2 font-heading">
              <CloudLightning className="size-5 text-primary" />
              6. Force Majeure & Severe Disruptions
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong>Uncontrollable Events:</strong> In the event of severe political
              unrest (hartals), extreme waterlogging/flooding, or government-mandated
              curfews that physically prevent a Driver from reaching the parking space,
              Drivers may contact support within 24 hours to request an emergency refund.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
