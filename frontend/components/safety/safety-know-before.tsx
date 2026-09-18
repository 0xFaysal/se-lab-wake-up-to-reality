import Image from "next/image";
import { Shield, Eye, Lightbulb, Video } from "lucide-react";
import safetyGarageImg from "@/assets/safety-garage.jpg";

const SAFETY_CHECKS = [
  {
    icon: Shield,
    title: "Verified Gates & Physical Access",
    desc: "Properties feature physical barrier arms, boom gates, or manned residential iron gates with on-duty security staff.",
  },
  {
    icon: Lightbulb,
    title: "Adequate Illumination",
    desc: "Well-lit indoor basement bays, ramps, and surface driveways ensuring safe navigation during evening and nighttime hours.",
  },
  {
    icon: Video,
    title: "CCTV & Physical Security Presence",
    desc: "Trained residential guards or continuous 24/7 CCTV surveillance monitoring parking bays and building perimeters.",
  },
  {
    icon: Eye,
    title: "Clear Entry & Exit Instructions",
    desc: "Comprehensive navigation notes, gate contact details, and assigned spot numbers provided instantly upon booking confirmation.",
  },
];

export function SafetyKnowBefore() {
  return (
    <section className="py-20 bg-muted/20 border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left: Garage Interior Photo */}
          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-2.5 shadow-xl shadow-black/5 ring-1 ring-border">
              <Image
                src={safetyGarageImg}
                alt="Well-lit verified residential parking garage in Dhaka with security staff"
                className="w-full h-auto rounded-2xl object-cover"
                priority
              />
            </div>
          </div>

          {/* Right: Checklist Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
                Property Verification Standards
              </span>

              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading leading-tight">
                Know more before you park.
              </h2>

              <p className="text-base text-muted-foreground leading-relaxed">
                Every residential building undergoes standard physical and security
                checks before being approved for driver bookings on ParkEase BD.
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              {SAFETY_CHECKS.map((check) => {
                const Icon = check.icon;
                return (
                  <div
                    key={check.title}
                    className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-2xs urban-card-shadow"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground font-heading">
                        {check.title}
                      </h4>
                      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                        {check.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
