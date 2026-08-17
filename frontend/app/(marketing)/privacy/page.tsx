import type { Metadata } from "next";
import {
  ShieldAlert,
  FileText,
  Lock,
  Scale,
  AlertOctagon,
  Truck,
  Ban,
  Car,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service & Privacy Policy",
  description:
    "Review the ParkEase BD Terms of Service, Privacy Policy, Intermediary Role, and Park At Your Own Risk liability clauses.",
};

export default function PrivacyPage() {
  return (
    <div className="py-12 md:py-16 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <article className="rounded-3xl border border-border bg-card p-6 sm:p-12 shadow-sm space-y-8 text-foreground">
          <header className="border-b border-border pb-6">
            <span className="text-xs font-bold tracking-wider text-primary uppercase font-heading bg-primary/10 px-3 py-1 rounded-full">
              Legal & Privacy Policies
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl font-heading">
              Terms of Service & Privacy Policy
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Last Updated: August 2026 | Effective Date: Immediate
            </p>
          </header>

          {/* Critical Liability Alert */}
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <AlertOctagon className="size-6 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h3 className="text-sm sm:text-base font-bold text-destructive font-heading">
                  Important: Intermediary Role & Park At Your Own Risk Notice
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  ParkEase BD operates exclusively as a digital platform and intermediary
                  connecting Drivers with private property space Hosts. We do not own,
                  operate, or inspect individual physical parking facilities. Vehicles and
                  personal belongings are parked strictly at the Driver&apos;s own risk.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Role of Platform */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 font-heading">
              <Scale className="size-5 text-primary" />
              1. Role of ParkEase BD
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              ParkEase BD operates exclusively as a digital intermediary connecting
              individuals who have vacant parking spaces (Hosts) with individuals seeking
              temporary parking (Drivers).
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground pl-2">
              <li>ParkEase BD does not own, operate, or manage any parking facilities.</li>
              <li>
                ParkEase BD is not a party to the rental agreement between the Host and the
                Driver.
              </li>
            </ul>
          </section>

          {/* Section 2: Liability & Security */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 font-heading">
              <ShieldAlert className="size-5 text-primary" />
              2. Liability & Security Policy
            </h2>
            <div className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>Platform Indemnification:</strong> ParkEase BD is not liable for any
                vehicle damage, theft, loss of personal belongings, or personal injury that
                occurs on the Host&apos;s property.
              </p>
              <p>
                <strong>Park At Your Own Risk:</strong> Drivers acknowledge that they are
                utilizing private residential spaces. Vehicles are parked entirely at the
                Driver&apos;s own risk.
              </p>
              <p>
                <strong>Host Responsibility:</strong> Hosts are responsible for providing the
                parking space exactly as described. Hosts are not acting as private security
                guards and are not financially liable for third-party criminal acts (e.g.,
                theft), unless the damage was directly caused by the Host&apos;s gross
                negligence.
              </p>
            </div>
          </section>

          {/* Section 3: Sub-Leasing & Tenant Policy */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 font-heading">
              <FileText className="size-5 text-primary" />
              3. Sub-Leasing & Tenant Policy
            </h2>
            <div className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>Mandatory Consent:</strong> A tenant (Renter) may only list a
                parking space if they have explicit, written consent from the property owner
                (Landlord) or the Flat Owners&apos; Association.
              </p>
              <p>
                <strong>Conflict Resolution:</strong> If a Driver is denied entry by the
                Landlord (due to an unauthorized listing by a Renter), the Driver receives a
                full refund, and the Host&apos;s (Renter&apos;s) account will be temporarily
                blocked pending verification.
              </p>
            </div>
          </section>

          {/* Section 4: Vehicle Condition & Prohibited Items */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 font-heading">
              <Car className="size-5 text-primary" />
              4. Vehicle Condition & Prohibited Items
            </h2>
            <div className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>Clean & Safe Vehicles:</strong> Drivers must ensure their vehicles
                are not leaking fluids (oil, coolant) that could damage the Host&apos;s
                property. Hosts reserve the right to deny entry to heavily damaged or
                leaking vehicles.
              </p>
              <p>
                <strong>Hazardous Materials:</strong> It is strictly prohibited to store
                illegal items, flammable materials, or hazardous chemicals in parked
                vehicles.
              </p>
            </div>
          </section>

          {/* Section 5: Platform Abuse & Anti-Circumvention */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 font-heading">
              <Ban className="size-5 text-primary" />
              5. Platform Abuse & Anti-Circumvention
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong>No Cash Deals:</strong> All payments must be processed through the
              ParkEase BD platform. If a Host and Driver are found bypassing the platform to
              arrange direct cash payments and avoid platform commissions, both accounts
              will be permanently banned.
            </p>
          </section>

          {/* Section 6: Emergency & Towing Rights */}
          <section className="space-y-3 border-t border-border pt-6">
            <h2 className="text-xl font-bold flex items-center gap-2 font-heading">
              <Truck className="size-5 text-primary" />
              6. Emergency & Towing Rights
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong>Abandoned Vehicles:</strong> If a Driver leaves their vehicle in a
              space for more than 24 hours past the booking expiration without contacting
              support, the Host reserves the right to contact local authorities to have the
              vehicle towed at the Driver&apos;s expense.
            </p>
          </section>

          {/* Section 7: Privacy Policy Summary */}
          <section className="space-y-3 border-t border-border pt-6">
            <h2 className="text-xl font-bold flex items-center gap-2 font-heading">
              <Lock className="size-5 text-primary" />
              7. Privacy Policy Summary
            </h2>
            <div className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>Data Collection & Usage:</strong> We collect vehicle registration
                numbers, user contact information, and location data required to provide
                booking and navigation services.
              </p>
              <p>
                <strong>Security Guard Access:</strong> Building security guards are only
                provided with the vehicle plate number and OTP/QR code. Personal phone
                numbers and addresses remain masked.
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
