"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SAFETY_FAQS = [
  {
    question: "Is my vehicle insured while parked on a residential property?",
    answer:
      "ParkEase BD acts as a digital matching and verification intermediary. All parking is subject to our standard 'Park At Your Own Risk' terms. Drivers are responsible for maintaining their own third-party motor insurance.",
  },
  {
    question: "How are residential security guards trained and assigned?",
    answer:
      "Security guards are assigned directly by verified property owners or building management committees. Guards receive dedicated portal logins locked specifically to their gate with plate-matching tools.",
  },
  {
    question: "What happens if an unauthorized vehicle occupies my booked slot?",
    answer:
      "If a slot is occupied upon arrival, notify the on-duty guard immediately and report via the app. Our support team triggers an instant relocation to a nearby verified spot or issues a 100% refund.",
  },
  {
    question: "How does the 15-minute traffic grace buffer work?",
    answer:
      "To accommodate unpredictable traffic congestion across Dhaka, every booking includes an automated 15-minute departure buffer past the scheduled reservation end time before overtime charges apply.",
  },
  {
    question: "Are property addresses public to anyone searching?",
    answer:
      "No. To protect property host security, exact house numbers, apartment names, and gate phone numbers are only disclosed after a driver completes a confirmed, paid booking.",
  },
];

export function SafetyFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 bg-muted/20 border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
            Trust & Safety Support
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Clear guidelines on platform liability, security protocols, and driver safety in Dhaka.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-3.5">
          {SAFETY_FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs transition-colors urban-card-shadow"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors cursor-pointer font-heading"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="size-5 text-primary shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180 text-primary"
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/70 bg-muted/20">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center flex items-center justify-center gap-4">
          <Link
            href="/privacy"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2 text-sm font-semibold border-border px-5 py-2.5 rounded-lg hover:bg-muted/50"
            )}
          >
            Review Terms & Privacy Policy
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
