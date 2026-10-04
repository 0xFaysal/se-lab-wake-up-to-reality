import { Search, ShieldCheck, QrCode, ArrowRight } from "lucide-react";
import Link from "next/link";

const THREE_STEPS = [
  {
    step: "01",
    title: "Search",
    subtitle: "Find verified spots across Dhaka",
    desc: "Enter your destination to instantly discover verified residential parking spaces with live hourly pricing.",
    icon: Search,
    mockupType: "search",
  },
  {
    step: "02",
    title: "Book",
    subtitle: "Instant 5-minute hold protection",
    desc: "Lock your chosen parking slot conflict-free while reviewing pricing details and completing payment.",
    icon: ShieldCheck,
    mockupType: "book",
  },
  {
    step: "03",
    title: "Park",
    subtitle: "Gate verification via QR or OTP",
    desc: "Arrive at the gate and present your entry QR or access credential to the assigned building security guard.",
    icon: QrCode,
    mockupType: "park",
  },
];

export function ThreeStepsOverview() {
  return (
    <section className="py-20 bg-background border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading">
            From search to parked in three simple steps.
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            A frictionless, reliable shared parking experience designed specifically for Dhaka&apos;s urban pace.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {THREE_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-7 shadow-2xs transition-all duration-300 hover:shadow-lg hover:border-primary/40 urban-card-shadow"
              >
                <div>
                  {/* Step Number & Icon Header */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm shadow-xs font-mono">
                      {step.step}
                    </span>
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                      <Icon className="size-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-foreground font-heading">
                    {step.title}
                  </h3>
                  <p className="text-sm font-semibold text-primary mt-1">
                    {step.subtitle}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                </div>

                {/* UI Graphic Mockup Container */}
                <div className="mt-6 rounded-xl border border-border/70 bg-muted/30 p-4 space-y-2">
                  {step.mockupType === "search" && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between bg-card p-2.5 rounded-lg border border-border/80">
                        <span className="font-medium text-foreground">Dhanmondi Rd 27</span>
                        <span className="font-bold text-primary">৳60/hr</span>
                      </div>
                      <div className="flex items-center justify-between bg-card p-2.5 rounded-lg border border-border/80">
                        <span className="font-medium text-foreground">Gulshan Circle-1</span>
                        <span className="font-bold text-primary">৳80/hr</span>
                      </div>
                    </div>
                  )}

                  {step.mockupType === "book" && (
                    <div className="space-y-2 text-xs">
                      <div className="bg-card p-2.5 rounded-lg border border-border/80 flex items-center justify-between">
                        <span className="text-muted-foreground">Hold timer:</span>
                        <span className="font-mono font-bold text-primary">04:59 active</span>
                      </div>
                      <div className="bg-primary/5 p-2 rounded-lg border border-primary/20 text-center font-bold text-primary text-xs">
                        Slot Reserved For You
                      </div>
                    </div>
                  )}

                  {step.mockupType === "park" && (
                    <div className="space-y-2 text-xs">
                      <div className="bg-card p-2.5 rounded-lg border border-dashed border-primary/40 text-center">
                        <span className="text-xs font-mono font-bold text-primary tracking-wider">
                          Access pass • Assigned gate
                        </span>
                      </div>
                      <div className="bg-emerald-600/10 p-2 rounded text-center text-xs font-semibold text-emerald-800">
                        ✓ Guard Verified Entry
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            Explore Complete How It Works Workflow <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
