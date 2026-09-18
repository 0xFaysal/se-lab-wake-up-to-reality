import Link from "next/link";
import { Car, Building2, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

const ROLES = [
  {
    role: "For Drivers",
    tagline: "Find and reserve parking with zero friction.",
    icon: Car,
    features: [
      "Instant area search & real-time slot booking",
      "5-minute conflict-free database hold lock",
      "Single-use OTP & QR code gate access pass",
      "Transparent hourly pricing & zero hidden fees",
      "15-minute traffic buffer for Dhaka congestion",
    ],
    actionLink: "/parking",
    actionText: "Find Parking",
  },
  {
    role: "For Property Owners",
    tagline: "Turn available parking into managed inventory.",
    icon: Building2,
    features: [
      "Full control over schedule, hours & vehicle types",
      "Automated gate guard verification system",
      "Transparent earnings tracking with direct payouts",
      "Dedicated dispute mediation & platform safeguards",
      "Real-time parking slot occupancy & utilization insights",
    ],
    actionLink: "/register?role=owner",
    actionText: "List Your Space",
  },
  {
    role: "For Security Guards",
    tagline: "Verify assigned parking arrivals instantly.",
    icon: ShieldCheck,
    features: [
      "Single-tap 1-second QR scan or 4-digit OTP entry",
      "Instant vehicle license plate number matching",
      "Vehicle type & model confirmation on screen",
      "Overstay alerts & departure grace tracking",
      "Zero phone setup hassle — locked to assigned gate",
    ],
    actionLink: null,
    actionText: null,
    footerNote: "Guard accounts are assigned directly by property owners.",
  },
];

export function AboutRoles() {
  return (
    <section className="py-20 bg-muted/20 border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
            Who It&apos;s For
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading">
            Built around the people who actually use parking.
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Every feature on ParkEase BD is engineered specifically for Dhaka&apos;s
            drivers, property owners, and on-site building security personnel.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.role}
                className="rounded-2xl border border-border bg-card p-7 shadow-2xs transition-all duration-300 hover:shadow-lg hover:border-primary/40 flex flex-col justify-between urban-card-shadow"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-xs font-bold text-primary uppercase tracking-wider font-heading">
                      {role.role}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground font-heading mb-4">
                    {role.tagline}
                  </h3>

                  <ul className="space-y-3 pt-2">
                    {role.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground">
                        <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-5 border-t border-border/80">
                  {role.actionLink ? (
                    <Link
                      href={role.actionLink}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline font-heading"
                    >
                      {role.actionText} <ArrowRight className="size-4" />
                    </Link>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      {role.footerNote}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
