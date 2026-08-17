import Link from "next/link";
import { Car, Building2, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaSection() {
  return (
    <section className="py-20 bg-muted/40 border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to solve parking in Dhaka?
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Join the community transforming unused residential spaces into an
            organized, smart urban parking network.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Driver CTA */}
          <div className="flex flex-col justify-between rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg hover:border-primary/50">
            <div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
                <Car className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                I Need Parking
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Never circle congested Dhaka roads again. Reserve verified, secure
                parking spots near hospitals, offices, universities, and malls.
              </p>
            </div>
            <div className="mt-8">
              <Link
                href="/register?role=driver"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full justify-center gap-2"
                )}
              >
                Sign Up as Driver
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Owner CTA */}
          <div className="flex flex-col justify-between rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg hover:border-primary/50">
            <div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background mb-6">
                <Building2 className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                I Have a Parking Space
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Turn your vacant daytime residential parking or garage slot into a
                steady stream of monthly income with automated guard verification.
              </p>
            </div>
            <div className="mt-8">
              <Link
                href="/register?role=owner"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full justify-center gap-2 border-foreground/20 hover:bg-muted"
                )}
              >
                List Your Space
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
