"use client";

import { useState } from "react";
import {
  Phone,
  MessageSquare,
  Mail,
  Loader2,
  Check,
  Upload,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SupportTicketForm() {
  const [issueType, setIssueType] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketCode, setTicketCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTicketCode(`TK-${Date.now().toString().slice(-6)}`);
      setBookingId("");
      setSubject("");
      setDescription("");
      setFileName("");
      setTimeout(() => setSubmitted(false), 5000);
    }, 800);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-2xs urban-card-shadow space-y-6">
      {/* Card Header */}
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-foreground font-heading">
          Contact Support
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Our team is here to help you resolve any issues quickly and securely.
        </p>
      </div>

      {/* 2-Column Split: Direct Contact info on Left + Ticket Form on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Side: Direct Contact Details (5 cols) */}
        <div className="md:col-span-5 space-y-5">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider font-heading block">
            Reach out directly
          </span>

          <div className="space-y-4">
            {/* Phone Support */}
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="size-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-foreground font-heading block">
                  Phone Support
                </span>
                <p className="text-xs font-mono font-semibold text-primary">
                  +880 1XXXXXXXXX
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Every day, 8:00 AM – 11:00 PM
                </p>
              </div>
            </div>

            {/* Live Support */}
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="size-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-foreground font-heading block">
                  Live Support
                </span>
                <p className="text-xs text-muted-foreground">
                  Available 24/7 in-app
                </p>
              </div>
            </div>

            {/* Email Support */}
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="size-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-foreground font-heading block">
                  Email Support
                </span>
                <a
                  href="mailto:support@parkease.bd"
                  className="text-xs font-medium text-primary hover:underline font-mono"
                >
                  support@parkease.bd
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Report an Issue Form (7 cols) */}
        <div className="md:col-span-7 space-y-4 border-t md:border-t-0 md:border-l border-border/80 pt-6 md:pt-0 md:pl-8">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider font-heading block">
            Report an Issue
          </span>

          {submitted ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2 animate-in fade-in">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 mx-auto">
                <Check className="size-5 stroke-[2.5]" />
              </div>
              <p className="text-sm font-bold text-emerald-950 font-heading">
                Issue Reported Successfully!
              </p>
              <p className="text-xs text-emerald-800">
                Ticket #{ticketCode} has been created.
                Our team will respond within a few minutes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Issue Type Select */}
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-foreground font-heading">
                  Issue Type
                </Label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-lg urban-input bg-[#F3F4F6] focus:bg-white text-xs text-foreground border border-transparent focus:border-primary outline-hidden cursor-pointer"
                >
                  <option value="">Select issue type...</option>
                  <option value="booking">Booking & Cancellation</option>
                  <option value="access">Parking Access / Gate Entry</option>
                  <option value="payment">Payment & Refund</option>
                  <option value="account">Account & Verification</option>
                  <option value="safety">Physical Safety Concern</option>
                </select>
              </div>

              {/* Booking ID & Subject (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-foreground font-heading">
                    Booking ID (Optional)
                  </Label>
                  <Input
                    type="text"
                    placeholder="ABK-12345"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    className="h-10 text-xs rounded-lg urban-input bg-[#F3F4F6] focus:bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-foreground font-heading">
                    Subject
                  </Label>
                  <Input
                    type="text"
                    placeholder="Brief summary"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="h-10 text-xs rounded-lg urban-input bg-[#F3F4F6] focus:bg-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-foreground font-heading">
                  Description
                </Label>
                <textarea
                  placeholder="Describe your issue in detail..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg urban-input bg-[#F3F4F6] focus:bg-white text-xs text-foreground border border-transparent focus:border-primary outline-hidden resize-none"
                />
              </div>

              {/* Attachment Input */}
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-foreground font-heading">
                  Attachment (Optional)
                </Label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted cursor-pointer transition-colors font-heading shadow-2xs">
                    <Upload className="size-3.5" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        setFileName(e.target.files?.[0]?.name || "")
                      }
                    />
                  </label>
                  <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                    {fileName || "No file chosen"}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 text-xs font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg shadow-xs transition-all cursor-pointer font-heading flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Submitting Issue…
                    </>
                  ) : (
                    "Submit Issue →"
                  )}
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground leading-tight pt-1">
                For urgent physical safety emergencies, contact local authorities
                immediately.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
