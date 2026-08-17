import type { Metadata } from "next";
import { ShieldCheck, Lock, Eye, AlertTriangle, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Trust & Safety",
  description:
    "Learn about our property verification, guard authentication, and privacy safeguards.",
};

export default function SafetyPage() {
  return (
    <article className="space-y-8 text-foreground">
      <header className="border-b pb-6">
        <span className="text-xs font-semibold tracking-wider text-primary uppercase">
          Security & Standards
        </span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Trust & Safety at ParkEase BD
        </h1>
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">
          Safety and accountability are embedded into every layer of our platform.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          Rigorous Property Verification
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Before any parking space becomes searchable on our platform, our team
          reviews the property submission. We verify the location, entrance photos,
          gate security capabilities, and building ownership or authorization to ensure
          a safe environment for visiting drivers.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2">
        <div className="rounded-xl border bg-muted/20 p-5 space-y-2">
          <Lock className="size-5 text-primary" />
          <h3 className="text-sm font-semibold">Purpose-Bound QR/OTP Codes</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Entry and exit credentials are single-use, time-limited, and purpose-bound.
            An entry code cannot be reused for exit, and expired credentials are
            instantly invalidated.
          </p>
        </div>

        <div className="rounded-xl border bg-muted/20 p-5 space-y-2">
          <Eye className="size-5 text-primary" />
          <h3 className="text-sm font-semibold">Privacy By Design</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Exact residential addresses, gate codes, and building entrance specifics
            are strictly hidden from the public map and only revealed to drivers with a
            confirmed, paid booking.
          </p>
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CheckCircle className="size-5 text-primary" />
          Building Community Guidelines
        </h2>
        <ul className="space-y-2.5 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong>Clean & Safe Vehicles:</strong> Drivers must ensure vehicles are
              not leaking fluids or hazardous chemicals that could harm the host property.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong>Zero Tolerance for Cash Deals:</strong> All transactions must occur
              through ParkEase BD to maintain automated insurance protection, receipts,
              and dispute coverage.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong>Controlled Security Guard Access:</strong> Guards can only view
              vehicle registration numbers and arrival times for their assigned property.
            </span>
          </li>
        </ul>
      </section>
    </article>
  );
}
