import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Search, PlusCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { AboutPillars } from "@/components/about/about-pillars";
import { AboutRoles } from "@/components/about/about-roles";
import { LifecycleRibbon } from "@/components/landing/lifecycle-ribbon";
import { AboutLocalApproach } from "@/components/about/about-local-approach";
import { AboutPrinciples } from "@/components/about/about-principles";
import { AboutNetworkBanner } from "@/components/about/about-network-banner";
import { CtaSection } from "@/components/landing/cta-section";

import safetyGarageImg from "@/assets/safety-garage.jpg";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about ParkEase BD's mission to solve Dhaka's parking crisis through shared residential spaces, verified guard access, and transparent technology.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-background py-14 lg:py-24 border-b border-border/80">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left: Headline & Story */}
            <div className="space-y-6 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="size-4 text-primary" />
                <span>Our Mission</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.12] font-heading">
                Making parking in Dhaka{" "}
                <span className="text-primary underline decoration-primary/40 decoration-wavy underline-offset-8">
                  easier to find, manage, and trust.
                </span>
              </h1>

              <p className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                A location-based shared parking platform built to transform unused
                residential space into safe, accessible parking for drivers and
                reliable income for parking providers.
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
                  href="/register?role=provider"
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

            {/* Right: Modern Parking Garage Image */}
            <div className="relative flex justify-center lg:col-span-6">
              <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card p-2.5 shadow-2xl shadow-black/5 ring-1 ring-border">
                <Image
                  src={safetyGarageImg}
                  alt="Modern residential parking facility in Dhaka"
                  className="w-full h-auto rounded-2xl object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Three Pillars */}
      <AboutPillars />

      {/* 3. Role Cards (For Drivers, For Providers, For Security Guards) */}
      <AboutRoles />

      {/* 4. Connected Journey Ribbon */}
      <LifecycleRibbon />

      {/* 5. A Dhaka-First Design & Local Approach */}
      <AboutLocalApproach />

      {/* 6. Core Principles (Transparency, Control, Fairness, Accountability) */}
      <AboutPrinciples />

      {/* 7. Organized Network Banner */}
      <AboutNetworkBanner />

      {/* 8. Call to Action Banner */}
      <CtaSection />
    </div>
  );
}
