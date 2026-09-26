import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import safetyGarageImg from "@/assets/safety-garage.jpg";

const LOCAL_POINTS = [
  {
    title: "Built for Dhaka Realities",
    desc: "Designed specifically around local residential gate rules, guard cultures, and neighborhood security committees.",
  },
  {
    title: "Traffic Buffer in Mind",
    desc: "Automatic 15-minute departure grace period acknowledging Dhaka's unpredictable road congestion and rush hours.",
  },
  {
    title: "Guard-Assisted Verification",
    desc: "Streamlined 1-tap mobile portal requiring zero technical expertise from on-duty building security guards.",
  },
  {
    title: "Neighborhood Privacy Protection",
    desc: "Exact building addresses and provider details are strictly masked until a confirmed booking is in place.",
  },
];

export function AboutLocalApproach() {
  return (
    <section className="py-20 bg-background border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left: Dhaka Garage Photo */}
          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-2.5 shadow-xl shadow-black/5 ring-1 ring-border">
              <Image
                src={safetyGarageImg}
                alt="Local residential parking approach in Dhaka"
                className="w-full h-auto rounded-2xl object-cover"
                priority
              />
            </div>
          </div>

          {/* Right: Content Checklist */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
                A Dhaka-First Design
              </span>

              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading leading-tight">
                Local parking needs a local approach.
              </h2>

              <p className="text-base text-muted-foreground leading-relaxed">
                Parking systems from Western cities fail in Dhaka because they ignore
                manned gates, local traffic realities, and security guard workflows.
                ParkEase BD is built natively for Dhaka.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {LOCAL_POINTS.map((pt) => (
                <div
                  key={pt.title}
                  className="rounded-2xl border border-border bg-card p-4 shadow-2xs urban-card-shadow space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <h4 className="text-sm font-bold text-foreground font-heading">
                      {pt.title}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pt.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
