import { Calendar, Key, ShieldCheck, Car, LogOut } from "lucide-react";

const TIMELINE_STEPS = [
  {
    num: "01",
    title: "Reserve",
    desc: "Lock your space with conflict-free 5-minute database hold protection.",
    icon: Calendar,
  },
  {
    num: "02",
    title: "Issue Credentials",
    desc: "Single-use entry QR pass and 4-digit OTP generated for the assigned gate.",
    icon: Key,
  },
  {
    num: "03",
    title: "Gate Verification",
    desc: "Guard matches vehicle license plate and confirms valid entry credentials.",
    icon: ShieldCheck,
  },
  {
    num: "04",
    title: "Park",
    desc: "Guaranteed parking bay with 15-minute buffer for Dhaka traffic delays.",
    icon: Car,
  },
  {
    num: "05",
    title: "Verified Exit",
    desc: "Guard logs vehicle departure to safely complete the parking session.",
    icon: LogOut,
  },
];

export function SafetyTimeline() {
  return (
    <section className="py-20 bg-background border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
            Live Reservation Security
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading">
            Your reservation stays connected to your arrival.
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Every step of your parking journey is validated in real time to eliminate
            ambiguity and protect driver safety.
          </p>
        </div>

        {/* 5-Step Connected Timeline */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {TIMELINE_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative rounded-2xl border border-border bg-card p-6 shadow-2xs transition-all duration-300 hover:shadow-lg hover:border-primary/40 flex flex-col justify-between urban-card-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm shadow-xs font-mono">
                      {step.num}
                    </span>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-foreground font-heading">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-border/80 text-[11px] font-bold text-primary uppercase tracking-wider font-heading">
                  Verified Step
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
