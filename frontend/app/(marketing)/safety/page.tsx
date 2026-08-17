import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { SafetyTrustPrinciples } from "@/components/safety/safety-trust-principles";
import { SafetyKnowBefore } from "@/components/safety/safety-know-before";
import { SafetyTimeline } from "@/components/safety/safety-timeline";
import { GuardFeatureSection } from "@/components/landing/guard-feature-section";
import { SafetyConfirmationPreview } from "@/components/safety/safety-confirmation-preview";
import { SafetyResponsibilities } from "@/components/safety/safety-responsibilities";
import { SafetyFaq } from "@/components/safety/safety-faq";
import { CtaSection } from "@/components/landing/cta-section";

import garageEntranceImg from "@/assets/garage-entrance.jpg";

export const metadata: Metadata = {
  title: "Trust & Safety",
  description:
    "Explore ParkEase BD's comprehensive trust and safety measures in Dhaka. Guard-verified gate access, single-use OTP credentials, and property standards.",
};

export default function SafetyPage() {
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
                <ShieldCheck className="size-4 text-primary" />
                <span>Security-First Shared Parking</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.12] font-heading">
                Parking you can trust,{" "}
                <span className="text-primary underline decoration-primary/40 decoration-wavy underline-offset-8">
                  from booking to exit.
                </span>
              </h1>

              <p className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                A security-first shared parking platform connecting drivers and
                residential spaces with guard-verified access, digital audit trails,
                and transparent booking safeguards.
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
                  href="/how-it-works"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-border font-bold text-sm gap-2 hover:bg-muted/50 px-8 py-3 rounded-lg"
                  )}
                >
                  How It Works
                </Link>
              </div>
            </div>

            {/* Right: Residential Gate Image */}
            <div className="relative flex justify-center lg:col-span-6">
              <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card p-2.5 shadow-2xl shadow-black/5 ring-1 ring-border">
                <Image
                  src={garageEntranceImg}
                  alt="Verified residential gate security in Dhaka"
                  className="w-full h-auto rounded-2xl object-cover"
                  priority
                />

                {/* Floating Verified Badge */}
                <div className="absolute top-6 right-6 flex items-center gap-2 rounded-full bg-primary/95 text-white px-3.5 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md border border-white/20">
                  <ShieldCheck className="size-4" />
                  <span>100% Guard Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Trust Principles (4 Cards) */}
      <SafetyTrustPrinciples />

      {/* 3. Know More Before You Park (Split Section with Indoor Garage Photo) */}
      <SafetyKnowBefore />

      {/* 4. Connected Arrival Timeline (5 Circular Steps) */}
      <SafetyTimeline />

      {/* 5. On-Site Guard Verification Section */}
      <GuardFeatureSection />

      {/* 6. Pricing & Confirmation Transparency */}
      <SafetyConfirmationPreview />

      {/* 7. Shared Responsibilities (3 Columns: Drivers, Owners, Guards) */}
      <SafetyResponsibilities />

      {/* 8. Common Safety Questions */}
      <SafetyFaq />

      {/* 9. Call to Action Banner */}
      <CtaSection />
    </div>
  );
}
