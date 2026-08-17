import {
  Search,
  FileSpreadsheet,
  Clock,
  CreditCard,
  QrCode,
  MapPin,
  Car,
  LogOut,
} from "lucide-react";

const STAGES = [
  { name: "Search", icon: Search },
  { name: "Quote", icon: FileSpreadsheet },
  { name: "Hold", icon: Clock },
  { name: "Pay", icon: CreditCard },
  { name: "Access", icon: QrCode },
  { name: "Arrive", icon: MapPin },
  { name: "Park", icon: Car },
  { name: "Exit", icon: LogOut },
];

export function LifecycleRibbon() {
  return (
    <section className="py-16 bg-background border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
          End-to-End System
        </span>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          From search to exit, one reservation stays connected.
        </h2>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div key={stage.name} className="flex items-center gap-3 sm:gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-12 items-center justify-center rounded-2xl border bg-card text-primary shadow-xs transition-all hover:bg-primary hover:text-white">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {stage.name}
                  </span>
                </div>

                {idx < STAGES.length - 1 && (
                  <div className="hidden sm:block h-0.5 w-6 sm:w-10 bg-border -mt-6" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
