"use client";

import { useState } from "react";
import { CreditCard, Smartphone, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentMethodType, SavedPaymentMethod } from "../types";
import { cn } from "@/lib/utils";

interface AddPaymentFormProps {
  onAddMethod: (method: Omit<SavedPaymentMethod, "id">) => void;
}

export function AddPaymentForm({ onAddMethod }: AddPaymentFormProps) {
  const [activeTab, setActiveTab] = useState<PaymentMethodType>("CARD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Card form state
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // Wallet form state
  const [walletName, setWalletName] = useState("");
  const [walletPhone, setWalletPhone] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");

    setTimeout(() => {
      if (activeTab === "CARD") {
        const last4 = cardNumber.replace(/\s/g, "").slice(-4) || "5521";
        onAddMethod({
          type: "CARD",
          title: `Visa Card ending in ${last4}`,
          subtitle: `Exp ${expiry || "12/28"}`,
          isDefault: false,
          brand: "visa",
          holderName: cardName || "Anisa Rahman",
          lastDigits: last4,
          expiry: expiry || "12/28",
        });
        setCardName("");
        setCardNumber("");
        setExpiry("");
        setCvv("");
      } else if (activeTab === "BKASH") {
        const phone = walletPhone.trim() || "017XXXXX123";
        const masked = phone.length >= 8 ? phone.slice(0, 3) + "XXXXX" + phone.slice(-3) : phone;
        onAddMethod({
          type: "BKASH",
          title: "bKash",
          subtitle: masked,
          isDefault: false,
          brand: "bkash",
          holderName: walletName || "Anisa Rahman",
        });
        setWalletName("");
        setWalletPhone("");
      } else {
        const phone = walletPhone.trim() || "019XXXXX987";
        const masked = phone.length >= 8 ? phone.slice(0, 3) + "XXXXX" + phone.slice(-3) : phone;
        onAddMethod({
          type: "NAGAD",
          title: "Nagad",
          subtitle: masked,
          isDefault: false,
          brand: "nagad",
          holderName: walletName || "Anisa Rahman",
        });
        setWalletName("");
        setWalletPhone("");
      }

      setIsSubmitting(false);
      setSuccessMsg("Payment method added successfully!");
      setTimeout(() => setSuccessMsg(""), 3500);
    }, 600);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs urban-card-shadow space-y-6">
      <h3 className="text-lg font-bold text-foreground font-heading">
        Add Payment Method
      </h3>

      {/* Tabs */}
      <div className="flex border-b border-border/70 gap-6">
        {[
          { id: "CARD" as const, label: "Card" },
          { id: "BKASH" as const, label: "bKash" },
          { id: "NAGAD" as const, label: "Nagad" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSuccessMsg("");
              }}
              className={cn(
                "pb-3 text-sm font-bold transition-colors cursor-pointer font-heading relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <Check className="size-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === "CARD" ? (
          <>
            {/* Name on Card */}
            <div className="space-y-1.5">
              <Label
                htmlFor="card-name"
                className="text-xs font-bold text-foreground font-heading"
              >
                Name on Card
              </Label>
              <Input
                id="card-name"
                type="text"
                placeholder="Anisa Rahman"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                required
                className="h-11 rounded-lg urban-input bg-[#F3F4F6] focus:bg-white text-sm"
              />
            </div>

            {/* Card Number */}
            <div className="space-y-1.5">
              <Label
                htmlFor="card-number"
                className="text-xs font-bold text-foreground font-heading"
              >
                Card Number
              </Label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="card-number"
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                  maxLength={19}
                  className="h-11 pl-10 rounded-lg urban-input bg-[#F3F4F6] focus:bg-white text-sm font-mono"
                />
              </div>
            </div>

            {/* Expiry Date & CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="expiry"
                  className="text-xs font-bold text-foreground font-heading"
                >
                  Expiry Date
                </Label>
                <Input
                  id="expiry"
                  type="text"
                  placeholder="MM/YY"
                  maxLength={5}
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  required
                  className="h-11 rounded-lg urban-input bg-[#F3F4F6] focus:bg-white text-sm font-mono text-center"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="cvv"
                  className="text-xs font-bold text-foreground font-heading"
                >
                  CVV
                </Label>
                <Input
                  id="cvv"
                  type="password"
                  placeholder="***"
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  required
                  className="h-11 rounded-lg urban-input bg-[#F3F4F6] focus:bg-white text-sm font-mono text-center"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Mobile Wallet Account Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="wallet-name"
                className="text-xs font-bold text-foreground font-heading"
              >
                Account Holder Name
              </Label>
              <Input
                id="wallet-name"
                type="text"
                placeholder="Anisa Rahman"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                required
                className="h-11 rounded-lg urban-input bg-[#F3F4F6] focus:bg-white text-sm"
              />
            </div>

            {/* Mobile Wallet Number */}
            <div className="space-y-1.5">
              <Label
                htmlFor="wallet-phone"
                className="text-xs font-bold text-foreground font-heading"
              >
                {activeTab === "BKASH"
                  ? "bKash Mobile Number"
                  : "Nagad Mobile Number"}
              </Label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="wallet-phone"
                  type="tel"
                  placeholder={
                    activeTab === "BKASH" ? "017XXXXXXXX" : "019XXXXXXXX"
                  }
                  value={walletPhone}
                  onChange={(e) => setWalletPhone(e.target.value)}
                  required
                  className="h-11 pl-10 rounded-lg urban-input bg-[#F3F4F6] focus:bg-white text-sm font-mono"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                You will receive a secure OTP verification prompt to authorize
                this wallet.
              </p>
            </div>
          </>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 text-sm font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg shadow-xs transition-all cursor-pointer font-heading"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Adding Payment Method…
              </>
            ) : (
              "Add Payment Method"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
