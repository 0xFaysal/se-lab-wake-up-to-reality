import { ShieldCheck, QrCode, Clock, CircleDollarSign } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: "100% Verified Parking",
    description: "Every residential property is manually checked and verified.",
  },
  {
    icon: QrCode,
    title: "QR & OTP Gate Entry",
    description: "Seamless purpose-bound credentials verified by on-duty guards.",
  },
  {
    icon: Clock,
    title: "Flexible Hourly Rates",
    description: "Pay only for the time you need with 15-minute grace period buffer.",
  },
  {
    icon: CircleDollarSign,
    title: "Transparent Pricing",
    description: "No hidden charges. Clear hourly rates and instant booking holds.",
  },
];

export function TrustStrip() {
  return (
    <section className="border-y bg-muted/30 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-4 rounded-xl bg-card p-4 ring-1 ring-border/50"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
