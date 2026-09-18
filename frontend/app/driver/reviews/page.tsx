"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { MobileEmptyState } from "@/components/driver/mobile-empty-state";
import { bookingsApi } from "@/lib/api/bookings-api";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function DriverReviewsPage() {
  const query = useQuery({ queryKey: queryKeys.reviews.driver, queryFn: bookingsApi.driverReviews });
  return <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 sm:px-6 sm:py-7"><header><h1 className="text-2xl font-extrabold">My reviews</h1><p className="mt-1 text-sm text-muted-foreground">Reviews submitted after completed parking sessions.</p></header>{query.isPending ? <div className="space-y-3">{Array.from({ length: 2 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-md border bg-white" />)}</div> : query.data?.length === 0 ? <MobileEmptyState icon={Star} title="No reviews yet" description="After a completed parking session, you can share feedback about the property and experience." primaryAction={{ label: "View bookings", href: "/driver/bookings" }} /> : <div className="divide-y overflow-hidden rounded-md border bg-white">{query.data?.map((review) => <article key={review.id} className="p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold">{review.booking?.property?.name ?? review.booking?.bookingCode}</h2><p className="mt-1 text-xs text-muted-foreground">{review.booking?.property?.publicArea} · {formatDateTime(review.createdAt)}</p></div><div className="flex" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`size-4 ${index < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />)}</div></div>{review.comment && <p className="mt-3 text-sm text-slate-700">{review.comment}</p>}{review.providerReply && <div className="mt-4 border-l-2 border-emerald-700 bg-emerald-50 p-3"><p className="text-xs font-bold text-emerald-900">Provider response</p><p className="mt-1 text-sm text-emerald-950">{review.providerReply}</p></div>}<Link href={`/driver/bookings/${review.bookingId}`} className="mt-4 inline-block text-xs font-bold text-emerald-800">Open booking</Link></article>)}</div>}</div>;
}
