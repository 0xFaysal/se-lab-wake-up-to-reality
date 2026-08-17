import type { Metadata } from "next";
import Link from "next/link";
import { Search, Clock, QrCode, CheckCircle2, ShieldCheck, Wallet, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn step-by-step how to find, reserve, and park with ParkEase BD or monetize your empty parking space.",
};

export default function HowItWorksPage() {
  return (
    <article className="space-y-10 text-foreground">
      <header className="border-b pb-6">
        <span className="text-xs font-semibold tracking-wider text-primary uppercase">
          Step-by-Step Guide
        </span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          How ParkEase BD Works
        </h1>
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">
          A seamless experience designed specifically for Dhaka's urban dynamics.
        </p>
      </header>

      {/* Driver Journey */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-bold text-white uppercase">
            Driver Workflow
          </span>
          <h2 className="text-2xl font-bold">Reserving Parking</h2>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4 items-start">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="text-base font-semibold">Search by Location & Vehicle</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Enter your destination area (e.g., Dhanmondi, Gulshan, Uttara),
                arrival date, start/end time, and vehicle category (Motorcycle, Sedan,
                SUV, Microbus). Filter by CCTV, covered parking, or security guard.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="text-base font-semibold">Instant Quote & 5-Minute Hold</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Review transparent pricing including hourly rates and refundable
                security deposit. Once requested, your selected spot is locked in a
                5-minute hold to prevent double-booking while you complete checkout.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="text-base font-semibold">Single-Use QR/OTP Entry</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Upon arrival at the property gate, present your purpose-bound entry QR
                code or 4-digit OTP to the on-duty security guard. Once verified,
                your parking session begins.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              4
            </div>
            <div>
              <h3 className="text-base font-semibold">Exit & Automated Settlement</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Request checkout when ready. The guard confirms physical exit. A
                15-minute grace period protects you from traffic delays before any
                overtime fees apply.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Owner Journey */}
      <section className="space-y-6 border-t pt-8">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-foreground px-2.5 py-1 text-xs font-bold text-background uppercase">
            Owner Workflow
          </span>
          <h2 className="text-2xl font-bold">Listing Your Parking Space</h2>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4 items-start">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="text-base font-semibold">Register & Add Property</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Submit property details, entrance photos, and parking dimensions. Our
                team verifies the location to maintain strict platform safety.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="text-base font-semibold">Configure Weekly Schedules</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Define the days and hours your parking space is vacant (e.g. Sunday to
                Thursday, 8:00 AM – 6:00 PM). Add custom blackout exceptions anytime.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="text-base font-semibold">Receive Earnings</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Track occupied hours, completed sessions, and earnings through your
                dedicated dashboard. Withdraw directly to bKash, Nagad, or your bank.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-6 border-t flex flex-col sm:flex-row gap-4">
        <Link
          href="/register?role=driver"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          Get Started as a Driver
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/register?role=owner"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}
        >
          Register as Property Owner
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
