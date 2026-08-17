import type { Metadata } from "next";
import { Building, Target, Users, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about ParkEase BD's mission to alleviate traffic congestion and optimize parking spaces in Dhaka.",
};

export default function AboutPage() {
  return (
    <article className="space-y-8 text-foreground">
      <header className="border-b pb-6">
        <span className="text-xs font-semibold tracking-wider text-primary uppercase">
          Our Story & Mission
        </span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          About ParkEase BD
        </h1>
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">
          Pioneering a shared-economy model to transform unused private residential
          spaces into a decentralized urban parking network for Dhaka.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Target className="size-5 text-primary" />
          The Problem We Are Solving
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Dhaka faces severe traffic congestion, exacerbated by drivers parking
          vehicles along major roads near shopping malls, hospitals, commercial
          zones, and educational institutions. At the exact same time, thousands of
          residential garage and driveway spaces sit empty during the daytime as
          residents commute to work.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          ParkEase BD bridges this mismatch. We empower residential property owners
          and apartment building managers to monetize vacant daytime capacity while
          providing drivers with guaranteed, hourly-reserved, secure parking.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-4">
        <div className="rounded-xl border bg-muted/20 p-5">
          <Building className="size-6 text-primary mb-3" />
          <h3 className="text-base font-semibold">For Property Owners</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Generate steady passive revenue from unused daytime garage slots with
            full control over operating hours, vehicle size allowances, and
            automated guard-assisted entry.
          </p>
        </div>

        <div className="rounded-xl border bg-muted/20 p-5">
          <Users className="size-6 text-primary mb-3" />
          <h3 className="text-base font-semibold">For Drivers & Commuters</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Find nearby parking within seconds, check live hourly prices, reserve a
            guaranteed slot, and access properties effortlessly via single-use QR or
            OTP codes.
          </p>
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shield className="size-5 text-primary" />
          Our Core Values
        </h2>
        <div className="space-y-3">
          <div className="border-l-2 border-primary pl-4">
            <h4 className="text-sm font-semibold">Trust & Verification</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Every property on ParkEase BD undergoes rigorous verification before
              becoming searchable.
            </p>
          </div>
          <div className="border-l-2 border-primary pl-4">
            <h4 className="text-sm font-semibold">Urban Efficiency</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              We leverage existing physical infrastructure rather than requiring new
              commercial parking mega-structures.
            </p>
          </div>
          <div className="border-l-2 border-primary pl-4">
            <h4 className="text-sm font-semibold">Fairness & Transparency</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              No surge traps, clear dispute resolution policies, and automated
              overtime safeguards with a 15-minute traffic grace period.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
