import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, PlusCircle, BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ownerDashboardImg from "@/assets/provider-dashboard.jpg";

const HOST_PERKS = [
  "Set your own schedule, operating hours & vehicle rules",
  "Automated gate guard verification with purpose-bound codes",
  "Transparent earnings tracking with reviewed withdrawal requests",
  "Dedicated dispute mediation & platform liability safeguards",
  "Real-time parking slot occupancy & utilization insights",
];

export function HostShowcaseSection() {
  return (
    <section className="py-20 bg-background border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#064E3B] p-8 sm:p-12 lg:p-16 text-white shadow-xl">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -top-20 size-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 size-80 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left: Text & Benefits */}
            <div className="lg:col-span-6 space-y-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-100 backdrop-blur-sm border border-white/20">
                For Parking Providers & Hosts
              </span>

              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-[1.15] font-heading">
                Turn your unused parking space into an opportunity.
              </h2>

              <p className="text-base sm:text-lg text-emerald-50/90 leading-relaxed font-normal">
                Monetize vacant residential garage bays, building slots, or driveways
                during work hours. Maintain full control while earning reliable passive income.
              </p>

              <ul className="space-y-3.5 pt-2">
                {HOST_PERKS.map((perk, idx) => (
                  <li key={idx} className="flex items-start gap-3.5 text-sm sm:text-base text-white font-medium">
                    <CheckCircle2 className="size-5 text-emerald-300 shrink-0 mt-0.5" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              {/* Action Buttons with high contrast and smooth hover */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/register?role=owner"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "bg-white text-[#064E3B] hover:bg-emerald-50 hover:text-[#002117] font-bold text-sm gap-2 shadow-lg rounded-lg transition-all"
                  )}
                >
                  <PlusCircle className="size-4" />
                  List Your Space
                </Link>
                <Link
                  href="/how-it-works"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-2 border-white/80 text-white bg-white/10 hover:bg-white hover:text-[#064E3B] font-bold text-sm rounded-lg transition-all gap-2"
                  )}
                >
                  <BookOpen className="size-4" />
                  Learn How It Works
                </Link>
              </div>
            </div>

            {/* Right: Dashboard Mockup */}
            <div className="lg:col-span-6 relative">
              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-card/10 backdrop-blur-md p-2.5 shadow-2xl">
                <Image
                  src={ownerDashboardImg}
                  alt="ParkEase BD Parking Provider Dashboard"
                  className="w-full h-auto rounded-xl object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
