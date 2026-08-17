import type { Metadata } from "next";
import { ShieldCheck, MapPin, Sparkles, Navigation } from "lucide-react";
import { HeroSearchForm } from "@/components/landing/hero-search-form";
import { TrustStrip } from "@/components/landing/trust-strip";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CtaSection } from "@/components/landing/cta-section";

export const metadata: Metadata = {
  title: "ParkEase BD — Smart Shared Parking Marketplace in Dhaka",
  description:
    "Find, book, and verify hourly residential parking in Dhaka. Avoid roadside parking hassle in Dhanmondi, Gulshan, Banani, and beyond.",
};

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background py-12 lg:py-24 border-b">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content & Quick Search */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3.5 py-1 text-xs font-semibold text-foreground">
                <Sparkles className="size-3.5 text-primary" />
                <span>Transforming Dhaka's Parking Crisis</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.1]">
                Find secure parking{" "}
                <span className="text-primary underline decoration-primary/30 decoration-wavy underline-offset-8">
                  near your destination
                </span>{" "}
                in Dhaka.
              </h1>

              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
                Connect with residential property owners renting out vacant daytime
                parking spaces. Reserve by the hour, enter with QR/OTP, and avoid
                congested roadside parking.
              </p>

              {/* Quick Search Form */}
              <div className="pt-2">
                <HeroSearchForm />
              </div>
            </div>

            {/* Right Illustration / Visual Graphic */}
            <div className="relative flex justify-center lg:col-span-5">
              <div className="relative w-full max-w-md">
                {/* Decorative glow */}
                <div className="absolute -top-6 -left-6 size-48 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-6 -right-6 size-48 rounded-full bg-primary/10 blur-3xl" />

                {/* Minimalist Graphic Card Mockup */}
                <div className="relative rounded-3xl border bg-card p-6 shadow-2xl shadow-black/10 ring-1 ring-border">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="size-3 rounded-full bg-destructive/70" />
                      <div className="size-3 rounded-full bg-amber-400" />
                      <div className="size-3 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-xs font-mono font-medium text-muted-foreground flex items-center gap-1">
                      <Navigation className="size-3 text-primary" /> Dhaka Live Grid
                    </span>
                  </div>

                  {/* Mock Map Preview Area */}
                  <div className="mt-4 rounded-2xl bg-muted/40 p-5 border border-dashed flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          Dhanmondi Road 27
                        </span>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                        Available Now
                      </span>
                    </div>

                    <div className="h-28 rounded-xl bg-gradient-to-tr from-muted to-background border flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(#eb4925_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
                      <div className="z-10 text-center">
                        <div className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                          <ShieldCheck className="size-5" />
                        </div>
                        <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
                          Guard-Verified Resident Gate
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-muted-foreground">Rate: <strong className="text-foreground">৳60/hr</strong></span>
                      <span className="text-muted-foreground">Distance: <strong className="text-foreground">0.8 km</strong></span>
                    </div>
                  </div>

                  {/* Secondary Mock Notification */}
                  <div className="mt-4 rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">
                        QR
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Instant Entry Pass</p>
                        <p className="text-[10px] text-muted-foreground">Auto-generated upon booking</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-primary uppercase">Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <TrustStrip />

      {/* How it Works Section */}
      <HowItWorks />

      {/* Call to Action Section */}
      <CtaSection />
    </div>
  );
}
