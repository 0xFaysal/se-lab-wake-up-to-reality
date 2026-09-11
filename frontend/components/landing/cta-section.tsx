import Link from "next/link";
import { Search, PlusCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaSection() {
  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#064E3B] px-6 py-16 sm:px-12 sm:py-20 text-center shadow-xl">
          {/* Subtle background circles */}
          <div className="absolute -left-12 -top-12 size-64 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -right-12 -bottom-12 size-64 rounded-full bg-white/5 blur-2xl" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl font-heading">
              Your next parking space could already be waiting.
            </h2>
            <p className="text-base sm:text-lg text-emerald-50/90 leading-relaxed max-w-2xl mx-auto">
              Find secure hourly parking near your destination, or list your vacant
              daytime parking space to generate steady passive income.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/parking"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full sm:w-auto bg-white text-[#064E3B] hover:bg-emerald-50 hover:text-[#002117] font-bold text-sm gap-2 shadow-lg px-8 py-3 rounded-lg transition-all"
                )}
              >
                <Search className="size-4" />
                Find Parking
              </Link>
              <Link
                href="/register?role=owner"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full sm:w-auto border-2 border-white/80 text-white bg-white/10 hover:bg-white hover:text-[#064E3B] font-bold text-sm gap-2 px-8 py-3 rounded-lg transition-all"
                )}
              >
                <PlusCircle className="size-4" />
                List Your Space
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
