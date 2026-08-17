"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "Can I reserve a parking spot before arriving?",
    answer:
      "Yes! You can search by destination area in Dhaka, choose your exact start and end times, lock a 5-minute hold on the spot, and confirm your reservation with secure digital payment.",
  },
  {
    question: "How does the 5-minute hold protection work?",
    answer:
      "When you initiate booking, the backend creates a temporary 5-minute database hold (PostgreSQL exclusion constraint), guaranteeing that no other driver can book the exact same spot while you complete payment.",
  },
  {
    question: "How does gate security guard verification work?",
    answer:
      "Once your booking is confirmed, a single-use entry QR code and 4-digit OTP are issued. Upon arrival, the building security guard matches your vehicle plate and verifies your credential on their mobile portal.",
  },
  {
    question: "What happens if I get delayed in Dhaka traffic?",
    answer:
      "All bookings include a 15-minute grace period after scheduled expiration to exit the premises before overtime penalties apply.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 bg-muted/20 border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
            Frequently Asked Questions
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading">
            Before your first booking
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Clear answers to common questions about parking in Dhaka with ParkEase BD.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-3.5">
          {FAQS.map((faq, idx) => {
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
            href="/how-it-works"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2 text-sm font-semibold border-border px-5 py-2.5 rounded-lg hover:bg-muted/50"
            )}
          >
            Read Complete How It Works Guide
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
