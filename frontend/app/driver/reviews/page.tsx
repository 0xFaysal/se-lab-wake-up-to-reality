"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { bookingsApi } from "@/lib/api/bookings-api";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function DriverReviewsPage() {
  const query = useQuery({ queryKey: queryKeys.reviews.driver, queryFn: bookingsApi.driverReviews });
  return <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6"><header><h1 className="text-2xl font-extrabold">My reviews</h1><p className="mt-1 text-sm text-muted-foreground">Reviews submitted after completed parking sessions.</p></header><div className="divide-y border bg-white">{query.isPending ? <p className="p-6 text-sm text-muted-foreground">Loading reviews...</p> : query.data?.length === 0 ? <div className="p-10 text-center"><Star className="mx-auto size-7 text-slate-400" /><p className="mt-3 text-sm text-muted-foreground">You have not reviewed a completed booking yet.</p></div> : query.data?.map((review) => <article key={review.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold">{review.booking?.property?.name ?? review.booking?.bookingCode}</h2><p className="mt-1 text-xs text-muted-foreground">{review.booking?.property?.publicArea} · {formatDateTime(review.createdAt)}</p></div><div className="flex" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`size-4 ${index < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />)}</div></div>{review.comment && <p className="mt-3 text-sm text-slate-700">{review.comment}</p>}{review.providerReply && <div className="mt-4 border-l-2 border-emerald-700 bg-emerald-50 p-3"><p className="text-xs font-bold text-emerald-900">Provider response</p><p className="mt-1 text-sm text-emerald-950">{review.providerReply}</p></div>}<Link href={`/driver/bookings/${review.bookingId}`} className="mt-4 inline-block text-xs font-bold text-emerald-800">Open booking</Link></article>)}</div></div>;
}
