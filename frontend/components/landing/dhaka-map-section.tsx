import Link from "next/link";
import { MapPin, Navigation, CheckCircle2, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DhakaMapSection() {
  return (
    <section className="py-20 bg-muted/20 border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left: De-saturated Stylized Map Graphic */}
          <div className="lg:col-span-6 relative">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm ring-1 ring-border/50">
              {/* De-saturated Urban Map Canvas */}
              <div className="relative h-80 sm:h-96 w-full rounded-2xl bg-[#f0f2f5] overflow-hidden border border-border/60">
                {/* SVG Stylized Dhaka Street Grid */}
                <svg
                  className="absolute inset-0 size-full opacity-60"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Major Road Arteries */}
                  <path
                    d="M 20 50 Q 150 120 280 80 T 450 200"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 80 320 Q 200 200 320 280 T 480 120"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 200 10 L 220 380"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="4"
                  />
                </svg>

                {/* Deep Emerald Parking Pins across Key Dhaka Hubs */}
                <div className="absolute top-1/4 left-1/4 group cursor-pointer">
                  <div className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-white text-[11px] font-bold shadow-md ring-2 ring-white">
                    <MapPin className="size-3" />
                    <span>Dhanmondi • ৳60/h</span>
                  </div>
                </div>

                <div className="absolute top-1/3 right-1/4 group cursor-pointer">
                  <div className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-white text-[11px] font-bold shadow-md ring-2 ring-white">
                    <MapPin className="size-3" />
                    <span>Gulshan • ৳80/h</span>
                  </div>
                </div>

                <div className="absolute bottom-1/4 left-1/3 group cursor-pointer">
                  <div className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-white text-[11px] font-bold shadow-md ring-2 ring-white">
                    <MapPin className="size-3" />
                    <span>Banani • ৳70/h</span>
                  </div>
                </div>

                <div className="absolute top-12 right-12 group cursor-pointer">
                  <div className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-white text-[11px] font-bold shadow-md ring-2 ring-white">
                    <MapPin className="size-3" />
                    <span>Uttara • ৳40/h</span>
                  </div>
                </div>

                {/* Bottom Overlay Label */}
                <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-card/95 backdrop-blur-md p-3 border border-border/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Navigation className="size-4 text-primary" />
                    <span className="font-bold text-foreground">Dhaka Verified Hubs</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Live GPS Coverage</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Descriptive Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
                Dhaka Wide Coverage
              </span>

              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl leading-tight font-heading">
                Locating and reserving parking spaces made easier in Dhaka.
              </h2>

              <p className="text-base text-muted-foreground leading-relaxed">
                Never circle busy roads in Dhanmondi, Gulshan, or Uttara hoping for an
                empty curbside spot. ParkEase BD maps out secure, privately verified
                residential garage slots ready for reservation.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-xs sm:text-sm text-foreground">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <span>Real-time availability mapped near major medical and commercial zones</span>
              </div>
              <div className="flex items-start gap-3 text-xs sm:text-sm text-foreground">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <span>Exact gate instructions and entrance GPS revealed upon booking</span>
              </div>
              <div className="flex items-start gap-3 text-xs sm:text-sm text-foreground">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <span>15-minute traffic buffer protection for unpredictable Dhaka delays</span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/parking"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-primary text-white hover:bg-primary/90 gap-2 font-bold px-6 shadow-xs rounded-lg"
                )}
              >
                Search Parking Near You
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
