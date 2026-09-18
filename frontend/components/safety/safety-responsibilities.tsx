import { Car, Building2, ShieldCheck, CheckCircle2 } from "lucide-react";

const ROLES = [
  {
    role: "Drivers",
    icon: Car,
    responsibilities: [
      "Arrive strictly within your confirmed reservation schedule",
      "Display your registered vehicle license plate clearly",
      "Follow building speed limits (max 10 km/h) & parking lines",
      "Exit within the 15-minute traffic grace buffer",
    ],
  },
  {
    role: "Property Owners",
    icon: Building2,
    responsibilities: [
      "Ensure clear, unobstructed driveway and gate access",
      "Provide accurate navigation instructions and gate contact",
      "Maintain adequate lighting and functional gate barriers",
      "Notify platform immediately of any unexpected slot conflict",
    ],
  },
  {
    role: "Security Guards",
    icon: ShieldCheck,
    responsibilities: [
      "Verify vehicle plate and 4-digit OTP before opening gate",
      "Direct driver to their specific designated parking bay",
      "Log check-in and departure timestamps on guard portal",
      "Report unauthorized vehicles or prolonged overstays",
    ],
  },
];

export function SafetyResponsibilities() {
  return (
    <section className="py-20 bg-background border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
            Shared Responsibility
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading">
            Safer parking depends on everyone following the process.
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Community trust and security succeed when drivers, property owners, and
            security guards adhere to standard procedures.
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
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground font-heading">
                      {role.role}
                    </h3>
                  </div>

                  <ul className="space-y-3.5">
                    {role.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-foreground">
                        <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-border text-xs font-semibold text-primary font-heading">
                  Standard Operating Protocol
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
