import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Search, PlusCircle, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { HowItWorksFourSteps } from "@/components/landing/how-it-works-four-steps";
import { StatusTimelineSection } from "@/components/landing/status-timeline-section";
import { TrustFeatureGrid } from "@/components/landing/trust-feature-grid";
import { OwnerFeatureSection } from "@/components/landing/owner-feature-section";
import { GuardFeatureSection } from "@/components/landing/guard-feature-section";
import { LifecycleRibbon } from "@/components/landing/lifecycle-ribbon";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";

import heroDevicesImg from "@/assets/hero-devices.jpg";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how ParkEase BD connects drivers with verified residential parking in Dhaka. 4-step booking, gate guard verification, and 5-minute hold protection.",
};

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-background py-14 lg:py-24 border-b border-border/80">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left: Headline & Introduction */}
            <div className="space-y-6 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="size-4 text-primary" />
                <span>Smart Shared Parking Workflow</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.12] font-heading">
                Parking in Dhaka,{" "}
                <span className="text-primary underline decoration-primary/40 decoration-wavy underline-offset-8">
                  without the uncertainty.
                </span>
              </h1>

              <p className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                Find parking near your destination, reserve a guaranteed space with
                instant 5-minute hold protection, and verify your arrival with building gate security.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/parking"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "bg-primary text-white hover:bg-primary/90 font-bold text-sm gap-2 shadow-xs px-8 py-3 rounded-lg"
                  )}
                >
                  <Search className="size-4" />
                  Find Parking
                </Link>
                <Link
                  href="/register?role=owner"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-border font-bold text-sm gap-2 hover:bg-muted/50 px-8 py-3 rounded-lg"
                  )}
                >
                  <PlusCircle className="size-4" />
                  List Your Space
                </Link>
              </div>
            </div>

            {/* Right: Mockup Illustration */}
            <div className="relative flex justify-center lg:col-span-6">
              <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card p-2.5 shadow-2xl shadow-black/5 ring-1 ring-border">
                <Image
                  src={heroDevicesImg}
                  alt="ParkEase BD Multi-Platform Web and Mobile Architecture"
                  className="w-full h-auto rounded-2xl object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4-Step Process */}
      <HowItWorksFourSteps />

      {/* 3. Real-Time Status & Lifecycle Timeline */}
      <StatusTimelineSection />

      {/* 4. Value Props: Verified Parking. Controlled Access. */}
      <TrustFeatureGrid />

      {/* 5. Property Owner Pitch */}
      <OwnerFeatureSection />

      {/* 6. Security Guard Verification Section */}
      <GuardFeatureSection />

      {/* 7. End-to-End Lifecycle Ribbon */}
      <LifecycleRibbon />

      {/* 8. Frequently Asked Questions */}
      <FaqSection />

      {/* 9. Bottom Call to Action */}
      <CtaSection />
    </div>
  );
}
