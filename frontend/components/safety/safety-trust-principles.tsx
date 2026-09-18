import { ShieldCheck, Lock, UserCheck, EyeOff } from "lucide-react";

const TRUST_PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: "Verified Properties",
    desc: "Rigorous onboarding security checks on entrance gates, lighting, CCTV coverage, and driveway clearance.",
  },
  {
    icon: Lock,
    title: "Booking-Locked Access",
    desc: "Slots are exclusively locked for your scheduled window with database hold protection against double booking.",
  },
  {
    icon: UserCheck,
    title: "Guard-Assisted Verification",
    desc: "Trained on-duty security guards verify vehicle license plates and single-use entry QR/OTP credentials.",
  },
  {
    icon: EyeOff,
    title: "Privacy-Conscious Details",
    desc: "Exact residential addresses and building gate directions are revealed only after a confirmed booking.",
  },
];

export function SafetyTrustPrinciples() {
  return (
    <section className="py-20 bg-background border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
            Core Trust Principles
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading">
            Every reservation is protected by our four-pillar security system.
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Built from the ground up to protect property hosts and provide complete peace of mind for drivers.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_PRINCIPLES.map((principle) => {
            const Icon = principle.icon;
            return (
              <div
                key={principle.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-2xs transition-all duration-300 hover:shadow-lg hover:border-primary/40 flex flex-col justify-between urban-card-shadow"
              >
                <div>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground font-heading">
                    {principle.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {principle.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
