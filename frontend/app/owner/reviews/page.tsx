import React from "react";
import type { Metadata } from "next";
import { OwnerReviewsView } from "@/features/owner/components/owner-reviews-view";

export const metadata: Metadata = {
  title: "Driver Reviews & Ratings | Property Owner Management Portal",
  description: "Monitor driver reviews, reply to customer feedback, analyze property ratings, and report inappropriate content across ParkEase BD facilities.",
};

export default function OwnerReviewsPage() {
  return <OwnerReviewsView />;
}
