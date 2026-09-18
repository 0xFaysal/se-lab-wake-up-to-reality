import Image from "next/image";
import heroDevicesImg from "@/assets/hero-devices.jpg";

export function AboutNetworkBanner() {
  return (
    <section className="py-20 bg-background border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#064E3B] p-8 sm:p-12 lg:p-16 text-white shadow-xl">
          {/* Background glows */}
          <div className="absolute -right-20 -top-20 size-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 size-80 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left: Text */}
            <div className="lg:col-span-6 space-y-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-100 backdrop-blur-sm border border-white/20 font-heading">
                A Unified System
              </span>

              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-[1.15] font-heading">
                A more organized parking network for Dhaka.
              </h2>

              <p className="text-base sm:text-lg text-emerald-50/90 leading-relaxed">
                By connecting fragmented residential garages into a shared digital map,
                we reduce roadside congestion, protect private properties, and make urban
                commutes in Dhaka significantly smoother.
              </p>
            </div>

            {/* Right: Mockup */}
            <div className="lg:col-span-6 relative">
              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-card/10 backdrop-blur-md p-2.5 shadow-2xl">
                <Image
                  src={heroDevicesImg}
                  alt="ParkEase BD Network in Dhaka"
                  className="w-full h-auto rounded-xl object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
