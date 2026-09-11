"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "cancel",
    question: "How do I cancel my booking?",
    answer:
      "You can cancel your booking through the 'My Bookings' section. Full refunds are processed according to our cancellation policy when cancelled up to 2 hours before your scheduled arrival time. Funds are returned directly to your original payment method.",
  },
  {
    id: "payment",
    question: "What if my payment fails?",
    answer:
      "If a payment fails, please check your internet connection and card/wallet balance. You can also try an alternate payment method such as bKash, Nagad, or a different card. If an amount was debited, your bank or mobile wallet provider will automatically reverse it within 24 to 48 hours.",
  },
  {
    id: "qr-otp",
    question: "QR / OTP issues at entrance",
    answer:
      "Ensure your screen brightness is high for QR scanning. If the OTP doesn't arrive or the scanner fails to read your screen, show the 6-digit Access OTP displayed on your Digital Access Pass directly to the security guard at the gate for offline entry verification.",
  },
];

interface SupportFaqAccordionProps {
  searchQuery?: string;
}

export function SupportFaqAccordion({ searchQuery = "" }: SupportFaqAccordionProps) {
  const [openIds, setOpenIds] = useState<string[]>(["cancel"]);

  function toggleItem(id: string) {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  const filteredItems = FAQ_ITEMS.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground font-heading">
        Common Questions
      </h3>

      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground bg-card">
          No matching questions found for "{searchQuery}".
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 shadow-2xs urban-card-shadow overflow-hidden">
          {filteredItems.map((item) => {
            const isOpen = openIds.includes(item.id);
            return (
              <div key={item.id} className="transition-colors">
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-sm sm:text-base text-foreground font-heading cursor-pointer hover:bg-muted/30 transition-colors gap-4"
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180 text-primary"
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed animate-in fade-in-50 duration-200">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
