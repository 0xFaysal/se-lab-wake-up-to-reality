"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import {
  ArrowLeft,
  Star,
  Sparkles,
  ShieldCheck,
  MapPin,
  Brush,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Building,
  Calendar,
  Car,
} from "lucide-react";
import { MOCK_BOOKINGS } from "@/lib/data/mock-driver-data";

const reviewSchema = z.object({
  overallRating: z.number().min(1, "Please select an overall rating"),
  securityRating: z.number().min(1, "Please select a security rating"),
  accuracyRating: z.number().min(1, "Please select a location accuracy rating"),
  cleanlinessRating: z.number().min(1, "Please select a cleanliness rating"),
  comment: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(500, "Review cannot exceed 500 characters"),
  recommend: z.boolean(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface DriverPostBookingReviewViewProps {
  bookingId?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor (1.0)",
  2: "Needs Work (2.0)",
  3: "Average (3.0)",
  4: "Very Good (4.0)",
  5: "Exceptional (5.0)",
};

interface StarRatingProps {
  value: number;
  onChange: (val: number) => void;
  label: string;
  icon: React.ReactNode;
  error?: string;
}

function StarRatingRow({ value, onChange, label, icon, error }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="space-y-1.5 border-b border-border/60 pb-3.5 last:border-0 last:pb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-[#064E3B]">
            {icon}
          </div>
          <span className="text-xs font-bold text-foreground font-heading">
            {label}
          </span>
        </div>

        <span className="text-xs font-semibold text-muted-foreground">
          {displayValue > 0 ? RATING_LABELS[displayValue] : "Select Rating"}
        </span>
      </div>

      <div className="flex items-center gap-1.5 pt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            className="p-1 text-muted-foreground/30 transition-transform hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
            aria-label={`Rate ${star} star`}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= displayValue
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>

      {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function DriverPostBookingReviewView({
  bookingId = "PKBD-2026-1027-1842",
}: DriverPostBookingReviewViewProps) {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const booking =
    MOCK_BOOKINGS.find((b) => b.id === bookingId) || MOCK_BOOKINGS[0];

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    defaultValues: {
      overallRating: 5,
      securityRating: 5,
      accuracyRating: 5,
      cleanlinessRating: 4,
      comment: "",
      recommend: true,
    },
  });

  const commentValue = watch("comment") || "";

  const onSubmit = (data: ReviewFormData) => {
    // Validate with Zod
    const result = reviewSchema.safeParse(data);
    if (!result.success) return;

    setIsSubmitted(true);
    setTimeout(() => {
      router.push(`/driver/bookings`);
    }, 2000);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
      {/* 1. Header with Back Button */}
      <div className="flex items-center gap-3 border-b border-border/60 pb-4">
        <Link
          href={`/driver/bookings`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-muted/40 transition-colors"
          aria-label="Back to Bookings"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
            Rate Your Experience
          </h1>
          <p className="text-xs text-muted-foreground">
            Your review helps drivers in Dhaka choose verified, safe parking.
          </p>
        </div>
      </div>

      {/* 2. Booking Context Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#064E3B]">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground font-heading">
              {booking.propertyTitle}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>{booking.area}</span>
              <span>•</span>
              <Calendar className="h-3 w-3 text-[#064E3B]" />
              <span>{booking.date}</span>
              <span>•</span>
              <span className="font-semibold text-foreground">{booking.spotNumber}</span>
            </p>
          </div>
        </div>

        <span className="self-start sm:self-center rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-[#064E3B] border border-emerald-200">
          Booking Completed
        </span>
      </div>

      {/* 3. Review Submission Form Card */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-xs urban-card-shadow">
        {isSubmitted ? (
          <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-[#064E3B]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-extrabold text-foreground font-heading">
              Thank You for Your Feedback!
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Your verified review has been recorded. It will appear on the property details to help the ParkEase community.
            </p>
            <p className="text-[11px] text-muted-foreground font-mono">
              Redirecting to your bookings list...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Category Star Ratings */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
                Rating Categories
              </h3>

              <div className="space-y-4 rounded-xl bg-muted/30 p-4 border border-border/60">
                {/* 1. Overall Experience */}
                <Controller
                  control={control}
                  name="overallRating"
                  render={({ field }) => (
                    <StarRatingRow
                      label="Overall Experience"
                      icon={<Sparkles className="h-4 w-4" />}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.overallRating?.message}
                    />
                  )}
                />

                {/* 2. Security & Safety */}
                <Controller
                  control={control}
                  name="securityRating"
                  render={({ field }) => (
                    <StarRatingRow
                      label="Security & Safety (Guards & Gate)"
                      icon={<ShieldCheck className="h-4 w-4" />}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.securityRating?.message}
                    />
                  )}
                />

                {/* 3. Location Accuracy */}
                <Controller
                  control={control}
                  name="accuracyRating"
                  render={({ field }) => (
                    <StarRatingRow
                      label="Location Accuracy & Navigation"
                      icon={<MapPin className="h-4 w-4" />}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.accuracyRating?.message}
                    />
                  )}
                />

                {/* 4. Cleanliness & Bay Condition */}
                <Controller
                  control={control}
                  name="cleanlinessRating"
                  render={({ field }) => (
                    <StarRatingRow
                      label="Cleanliness & Space Condition"
                      icon={<Brush className="h-4 w-4" />}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.cleanlinessRating?.message}
                    />
                  )}
                />
              </div>
            </div>

            {/* Recommendation Question */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
                Would you recommend this parking space?
              </label>

              <Controller
                control={control}
                name="recommend"
                render={({ field }) => (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => field.onChange(true)}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                        field.value === true
                          ? "border-[#064E3B] bg-emerald-50 text-[#064E3B] shadow-xs"
                          : "border-border text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>Yes, Highly Recommend</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => field.onChange(false)}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                        field.value === false
                          ? "border-rose-600 bg-rose-50 text-rose-700 shadow-xs"
                          : "border-border text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      <span>No, Not Recommended</span>
                    </button>
                  </div>
                )}
              />
            </div>

            {/* Comment / Review Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
                  Public Review &amp; Comments
                </label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {commentValue.length} / 500 characters
                </span>
              </div>

              <textarea
                rows={4}
                maxLength={500}
                placeholder="Leave a public review for the property owner and fellow drivers... (e.g., Gate entrance was easy to find, security guard was prompt to verify access, clean parking bay)"
                {...register("comment")}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-[#064E3B] focus:bg-card focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
              />

              {errors.comment && (
                <p className="text-[11px] font-medium text-destructive">
                  {errors.comment.message}
                </p>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#064E3B] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#053d2e] transition-all active:scale-[0.99] cursor-pointer"
              >
                <Star className="h-4 w-4 fill-white text-white" />
                <span>{isSubmitting ? "Submitting Review..." : "Submit Review"}</span>
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
