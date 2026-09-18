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
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 font-heading">
              <RotateCcw className="size-5 text-primary" />
              1. Driver Cancellations
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground pl-2">
              <li>
                <strong>Advance Cancellation:</strong> If a Driver cancels a booking at
                least <strong>1 hour</strong> before the scheduled start time, they are
                eligible for a <strong>100% full refund</strong>.
              </li>
              <li>
                <strong>Late Cancellation:</strong> Cancellations made less than 1 hour
                before the scheduled start time are non-refundable.
              </li>
            </ul>
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
