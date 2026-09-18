"use client";

import { CreditCard, Smartphone, Wallet } from "lucide-react";
import { SavedPaymentMethod } from "../types";
import { cn } from "@/lib/utils";

interface SavedPaymentCardProps {
  method: SavedPaymentMethod;
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
}

export function SavedPaymentCard({
  method,
  onSetDefault,
  onRemove,
}: SavedPaymentCardProps) {
  function renderIcon() {
    if (method.type === "CARD") {
      return (
        <div className="flex size-11 sm:size-12 items-center justify-center rounded-xl border border-border bg-muted/40 text-foreground/80">
          <CreditCard className="size-5" />
        </div>
      );
    }
    if (method.type === "BKASH") {
      return (
        <div className="flex size-11 sm:size-12 items-center justify-center rounded-xl border border-pink-200 bg-pink-50 text-pink-700">
          <Smartphone className="size-5" />
        </div>
      );
    }
    return (
      <div className="flex size-11 sm:size-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
        <Wallet className="size-5" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs transition-all hover:shadow-sm urban-card-shadow flex items-center justify-between gap-4">
      {/* Left Icon & Details */}
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
        {renderIcon()}

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm sm:text-base font-bold text-foreground font-heading truncate">
              {method.title}
            </h4>
            {method.isDefault && (
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 tracking-wide font-heading uppercase">
                Default
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {method.subtitle}
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {!method.isDefault ? (
          <>
            <button
              type="button"
              onClick={() => onSetDefault(method.id)}
              className="text-xs font-bold text-primary hover:underline transition-colors cursor-pointer font-heading"
            >
              Set as Default
            </button>
            <button
              type="button"
              onClick={() => onRemove(method.id)}
              className="text-xs font-bold text-destructive hover:underline transition-colors cursor-pointer font-heading"
            >
              Remove
            </button>
          </>
        ) : (
          <span className="text-xs font-semibold text-muted-foreground/60 hidden sm:inline">
            Active Default
          </span>
        )}
      </div>
    </div>
  );
}
