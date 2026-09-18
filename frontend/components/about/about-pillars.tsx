import { Search, ShieldCheck, Lock } from "lucide-react";

const PILLARS = [
  {
    icon: Search,
    title: "Find it Fast",
    desc: "Location-first search with live rates, walking distances, and vehicle-specific compatibility across Dhaka's key hubs.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Capacity",
    desc: "Residential building slots vetted for gate access, lighting, security personnel, and clear driveway clearance.",
  },
  {
    icon: Lock,
    title: "Guaranteed Access",
    desc: "5-minute hold protection and purpose-bound gate credentials ensure your reserved space is waiting for you.",
  },
];

export function AboutPillars() {
  return (
    <section className="py-20 bg-background border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
            Our Purpose
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading">
            Parking should not begin with uncertainty.
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Dhaka&apos;s roads are heavily congested, yet thousands of residential parking
            bays sit vacant during work hours. We bridge that gap with verified access and technology.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-2xl border border-border bg-card p-7 shadow-2xs transition-all duration-300 hover:shadow-lg hover:border-primary/40 flex flex-col justify-between urban-card-shadow"
              >
                <div>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground font-heading">
                    {pillar.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {pillar.desc}
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
