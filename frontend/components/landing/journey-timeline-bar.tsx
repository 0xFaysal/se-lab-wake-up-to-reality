import { Search, Clock, CreditCard, QrCode, Car } from "lucide-react";

const TIMELINE_STEPS = [
  {
    num: "1",
    label: "Search & Compare",
    detail: "Choose area & vehicle type",
    icon: Search,
  },
  {
    num: "2",
    label: "5-Min Hold",
    detail: "Lock spot conflict-free",
    icon: Clock,
  },
  {
    num: "3",
    label: "Secure Checkout",
    detail: "Instant digital transaction",
    icon: CreditCard,
  },
  {
    num: "4",
    label: "Access Pass",
    detail: "Single-use QR or OTP",
    icon: QrCode,
  },
  {
    num: "5",
    label: "Verified Parking",
    detail: "Guard checks & confirms entry",
    icon: Car,
  },
];

export function JourneyTimelineBar() {
  return (
    <section className="py-16 bg-background border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
            Driver Journey
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl font-heading">
            Easy and transparent booking in every step.
          </h2>
        </div>

        {/* Horizontal Process Bar */}
        <div className="relative flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
          {TIMELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="flex-1 min-w-[140px] flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-bold text-xs shadow-xs">
                  <Icon className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground font-heading">
                    {step.label}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.detail}
                  </p>
                </div>

                {idx < TIMELINE_STEPS.length - 1 && (
                  <div className="hidden lg:block ml-auto mr-2 h-0.5 w-6 bg-border" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
