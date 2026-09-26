import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, PlusCircle, BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ownerDashboardImg from "@/assets/provider-dashboard.jpg";

const OWNER_BENEFITS = [
  "Set your own schedule, hours & vehicle rules",
  "Automated gate guard verification with single-use codes",
  "Transparent earnings tracking & direct digital payouts",
  "Dedicated dispute resolution & platform safeguards",
  "Real-time parking slot occupancy & utilization insights",
];

export function OwnerFeatureSection() {
  return (
    <section className="py-20 bg-background border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left: Text & Bullet Points */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
                For Parking Providers
              </span>

              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading leading-tight">
                Turn unused parking space into managed availability.
              </h2>

              <p className="text-base text-muted-foreground leading-relaxed">
                Monetize empty residential garages, building driveways, or commercial
                parking bays during vacant daytime hours with full control.
              </p>
            </div>

            <ul className="space-y-3.5 pt-1">
              {OWNER_BENEFITS.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3.5 text-sm sm:text-base text-foreground font-medium">
                  <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pt-3">
              <Link
                href="/register?role=owner"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-primary text-white hover:bg-primary/90 gap-2 font-bold text-sm rounded-lg shadow-xs"
                )}
              >
                <PlusCircle className="size-4" />
                List Your Space
              </Link>
              <Link
                href="/about"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-border font-bold text-sm rounded-lg hover:bg-muted/50 gap-2"
                )}
              >
                <BookOpen className="size-4" />
                Learn More About Hosting
              </Link>
            </div>
          </div>

          {/* Right: Dashboard Laptop Image */}
          <div className="lg:col-span-6 relative">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-2.5 shadow-xl shadow-black/5 ring-1 ring-border">
              <Image
                src={ownerDashboardImg}
                alt="ParkEase BD Parking Provider Dashboard"
                className="w-full h-auto rounded-2xl object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
