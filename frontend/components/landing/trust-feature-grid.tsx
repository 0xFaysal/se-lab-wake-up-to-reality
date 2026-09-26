import { ShieldCheck, Lock, UserCheck, EyeOff } from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified Properties",
    desc: "Rigorous onboarding checks on building entrance security and gate infrastructure across Dhaka.",
  },
  {
    icon: Lock,
    title: "Booking-Locked Access",
    desc: "Slots are reserved exclusively for your confirmed booking window to eliminate double-booking.",
  },
  {
    icon: UserCheck,
    title: "Guard-Assisted Verification",
    desc: "Trained on-duty security guards verify vehicle registration plates and single-use entry QR/OTP.",
  },
  {
    icon: EyeOff,
    title: "Privacy-Conscious Details",
    desc: "Exact residential addresses and gate directions are revealed only after a confirmed reservation.",
  },
];

export function TrustFeatureGrid() {
  return (
    <section className="py-20 bg-background border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
            Built For Dhaka
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Verified parking. Controlled access.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Engineered to safeguard parking providers while guaranteeing secure parking for drivers.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="rounded-2xl border bg-card p-6 shadow-2xs transition-all hover:shadow-md hover:border-primary/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {feat.desc}
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
