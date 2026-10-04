import {
  CheckCircle2,
  Receipt,
  QrCode,
  MapPin,
  ShieldCheck,
  Flag,
} from "lucide-react";

const TIMELINE_STEPS = [
  {
    num: "01",
    title: "Booking confirmed",
    desc: "Your requested spot is locked and reservation confirmed in real time.",
    icon: CheckCircle2,
  },
  {
    num: "02",
    title: "Payment recorded",
    desc: "Transaction logged securely with full refund & deposit protection.",
    icon: Receipt,
  },
  {
    num: "03",
    title: "Access credentials generated",
    desc: "Entry credentials issued for verification by the assigned guard.",
    icon: QrCode,
  },
  {
    num: "04",
    title: "Driver arrives",
    desc: "Navigate directly to the residential property entrance in Dhaka.",
    icon: MapPin,
  },
  {
    num: "05",
    title: "Guard verifies & confirms",
    desc: "Building security guard matches vehicle plate number and scans QR/OTP.",
    icon: ShieldCheck,
  },
  {
    num: "06",
    title: "Parking session completed",
    desc: "Guard-verified checkout settles parking and overtime using the booked offer's grace period.",
    icon: Flag,
  },
];

export function StatusTimelineSection() {
  return (
    <section className="py-20 bg-muted/20 border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left: Mobile App Visual Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-md shadow-black/5 ring-1 ring-border relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-bold text-foreground font-heading">
                    Active Reservation
                  </span>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary font-heading">
                  Confirmed
                </span>
              </div>

              {/* Booking Pass Mockup */}
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-muted/40 p-4 border border-border space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground font-heading">
                        Gulshan Circle-1 Residence
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Road 103, House 14 • Spot #B-04
                      </p>
                    </div>
                    <span className="text-sm font-extrabold text-primary font-mono">
                      ৳80/hr
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2.5 border-t border-border/80 text-muted-foreground">
                    <span>Vehicle: <strong className="text-foreground">DHK-METRO-GA 25-1049</strong></span>
                    <span>Type: <strong className="text-foreground">Sedan</strong></span>
                  </div>
                </div>

                {/* Entry Code Box */}
                <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-5 text-center space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary font-heading">
                    Entry Verification Pass
                  </span>
                  <div className="text-3xl font-mono font-black tracking-widest text-primary">
                    7 4 9 2
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Present OTP or QR code to gate security upon arrival
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Timeline List */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
                Real-Time Status
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading leading-tight">
                Know what happens before you arrive.
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                From reservation hold to checkout, every transition is logged and verified
                for complete peace of mind.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {TIMELINE_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.num}
                    className="flex items-start gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-2xs urban-card-shadow"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-primary font-mono">
                          {step.num}.
                        </span>
                        <h4 className="text-sm font-bold text-foreground font-heading">
                          {step.title}
                        </h4>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {step.desc}
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
