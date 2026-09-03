import { CheckCircle2, Circle, Clock } from "lucide-react";
import { TimelineStep } from "@/types/driver";
import { cn } from "@/lib/utils";

interface BookingStatusTimelineProps {
  steps: TimelineStep[];
}

export function BookingStatusTimeline({ steps }: BookingStatusTimelineProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-border/50 urban-card-shadow space-y-5">
      <h3 className="text-lg font-bold text-foreground font-heading">
        Booking Status
      </h3>

      <div className="relative space-y-4">
        {steps.map((step, idx) => {
          const isCompleted = step.status === "COMPLETED";
          const isCurrent = step.status === "CURRENT";
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className="relative flex items-start gap-3.5">
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-3.5 top-6 bottom-0 w-0.5 -ml-[1px]",
                    isCompleted ? "bg-primary" : "bg-border"
                  )}
                />
              )}

              {/* Status Icon */}
              <div className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-card">
                {isCompleted ? (
                  <CheckCircle2 className="size-6 text-primary fill-primary/10" />
                ) : isCurrent ? (
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary text-white ring-4 ring-primary/20">
                    <Clock className="size-3.5" />
                  </div>
                ) : (
                  <Circle className="size-5 text-muted-foreground/50" />
                )}
              </div>

              {/* Content */}
              <div
                className={cn(
                  "flex-1 rounded-xl p-2.5 transition-colors",
                  isCurrent && "bg-primary/5 border border-primary/20"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={cn(
                      "text-sm font-bold font-heading",
                      isCurrent
                        ? "text-primary"
                        : isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </h4>
                </div>
                {step.timestamp && (
                  <p
                    className={cn(
                      "text-xs mt-0.5",
                      isCurrent
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.timestamp}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
