import Image from "next/image";
import { Search, ShieldCheck, CalendarCheck, QrCode, CheckCircle2 } from "lucide-react";

import stepSearchMapImg from "@/assets/step-search-map.jpg";
import stepGuaranteeSlotsImg from "@/assets/step-guarantee-slots.jpg";
import stepReserveQuoteImg from "@/assets/step-reserve-quote.jpg";
import stepAccessQrImg from "@/assets/step-access-qr.jpg";

const STEPS = [
  {
    step: "1",
    title: "Search",
    subtitle: "Spot near your destination",
    image: stepSearchMapImg,
    icon: Search,
  },
  {
    step: "2",
    title: "Guarantee",
    subtitle: "5-minute hold on parking space",
    image: stepGuaranteeSlotsImg,
    icon: ShieldCheck,
  },
  {
    step: "3",
    title: "Reserve",
    subtitle: "Lock arrival time & clear fee quote",
    image: stepReserveQuoteImg,
    icon: CalendarCheck,
  },
  {
    step: "4",
    title: "Access",
    subtitle: "QR code scan on arrival",
    image: stepAccessQrImg,
    icon: QrCode,
  },
];

export function HowItWorksFourSteps() {
  return (
    <section className="py-20 bg-background border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
            Overview
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading leading-tight">
            From destination to parked in four simple steps.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            A frictionless workflow designed to get you off the road and into a guaranteed spot in minutes.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="group relative rounded-2xl border border-border bg-card p-4 shadow-2xs transition-all duration-300 hover:shadow-lg hover:border-primary/40 flex flex-col justify-between urban-card-shadow"
              >
                <div>
                  {/* Thumbnail Image Container */}
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-muted/40 border border-border/80 mb-5">
                    <Image
                      src={step.image}
                      alt={`${step.title} illustration`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Centered Step Info */}
                  <div className="text-center space-y-2 px-2 pb-2">
                    <div className="mx-auto flex size-9 items-center justify-center rounded-full bg-primary text-white shadow-xs">
                      <Icon className="size-4" />
                    </div>

                    <h3 className="text-lg font-bold text-foreground font-heading">
                      {step.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {step.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span className="text-primary font-bold">Step 0{step.step}</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="size-3.5" /> Verified
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
