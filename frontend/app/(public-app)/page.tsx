import type { Metadata } from "next";
import Image from "next/image";
import { Sparkles, MapPin } from "lucide-react";
import { HeroSearchForm } from "@/components/landing/hero-search-form";
import { TrustStrip } from "@/components/landing/trust-strip";
import { ThreeStepsOverview } from "@/components/landing/three-steps-overview";
import { DhakaMapSection } from "@/components/landing/dhaka-map-section";
import { HostShowcaseSection } from "@/components/landing/host-showcase-section";
import { FeaturedLocationsGrid } from "@/components/landing/featured-locations-grid";
import { JourneyTimelineBar } from "@/components/landing/journey-timeline-bar";
import { CtaSection } from "@/components/landing/cta-section";
import { BrandIcon } from "@/components/common/app-logo";

import heroDevicesImg from "@/assets/hero-devices.jpg";
import garageEntranceImg from "@/assets/garage-entrance.jpg";

export const metadata: Metadata = {
  title: "ParkEase BD — Smart Shared Parking in Dhaka",
  description:
    "Find secure, affordable hourly residential parking near your destination in Dhaka. Reserve in Dhanmondi, Gulshan, Banani, Uttara, and beyond.",
};

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-background py-14 lg:py-24 border-b border-border/80">
        {/* Subtle architectural background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: col-span-7 for comfortable headline line wrapping */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="size-4 text-primary" />
                <span>Transforming Dhaka&apos;s Parking Experience</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.12] font-heading">
                Find secure parking{" "}
                <span className="whitespace-nowrap text-primary underline decoration-primary/40 decoration-wavy underline-offset-8">
                  near your destination
                </span>{" "}
                in Dhaka.
              </h1>

              <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                Connect with residential property owners renting out vacant daytime
                parking spaces. Reserve by the hour, enter with QR/OTP, and avoid
                congested roadside parking.
              </p>

              {/* Wide Quick Search Card */}
              <div className="pt-2">
                <HeroSearchForm />
              </div>
            </div>

            {/* Right Column: col-span-5 Overlapping Mockup Composition */}
            <div className="relative flex justify-center lg:col-span-5">
              <div className="relative w-full max-w-md lg:max-w-none">
                {/* Main Hero Devices Image */}
                <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-2 shadow-2xl shadow-black/5 ring-1 ring-border">
                  <Image
                    src={heroDevicesImg}
                    alt="ParkEase BD Multi-Device Web Application"
                    className="w-full h-auto rounded-2xl object-cover"
                    priority
                  />

                  {/* Floating Emerald Parking Marker */}
                  <BrandIcon size={36} className="absolute left-12 top-10 hidden size-9 animate-bounce rounded-full border-2 border-white shadow-lg duration-1000 sm:block" />
                </div>

                {/* Floating Spotlight Card */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[92%] sm:w-[88%] rounded-2xl border border-border bg-card/95 backdrop-blur-md p-4 shadow-2xl shadow-black/10 ring-1 ring-border flex items-center gap-3.5">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border">
                    <Image
                      src={garageEntranceImg}
                      alt="Dhanmondi Residential Parking"
                      className="size-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-foreground truncate font-heading">
                        Dhanmondi Residential Parking
                      </h4>
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
                        P
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-bold text-primary">৳60/hour</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="size-3.5 text-primary shrink-0" />
                        Near Dhanmondi 27
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Trust Strip */}
      <TrustStrip />

      {/* 3. How It Works: 3 Simple Steps Grid */}
      <ThreeStepsOverview />

      {/* 4. Interactive Dhaka Map Coverage Section */}
      <DhakaMapSection />

      {/* 5. Host Showcase Section (Deep Emerald Block) */}
      <HostShowcaseSection />

      {/* 6. Featured Dhaka Locations (3x2 Grid) */}
      <FeaturedLocationsGrid />

      {/* 7. Driver Journey Timeline Bar */}
      <JourneyTimelineBar />

      {/* 8. Call to Action Banner */}
      <CtaSection />
    </div>
  );
}
