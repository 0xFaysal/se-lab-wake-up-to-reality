"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { PageEmptyState, PageErrorState, PageSkeleton, ProviderPage, ProviderPageHeader } from "@/components/provider/provider-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { reviewsApi } from "@/lib/api/reviews-api";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function ReviewsPage() {
  const client = useQueryClient();
  const [replies, setReplies] = useState<Record<string, string>>({});
  const query = useQuery({ queryKey: queryKeys.reviews.provider(), queryFn: reviewsApi.providerList });
  const reply = useMutation({ mutationFn: ({ id, text }: { id: string; text: string }) => reviewsApi.reply(id, text), onSuccess: async () => { toast.success("Reply saved"); await client.invalidateQueries({ queryKey: queryKeys.reviews.root }); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  return <ProviderPage><ProviderPageHeader title="Driver reviews" description="Read verified booking feedback and respond professionally." breadcrumbs={[{ label: "Reputation & Support" }, { label: "Reviews" }]} />
    {query.isPending ? <PageSkeleton label="Loading reviews" /> : query.isError ? <PageErrorState message={getApiErrorMessage(query.error)} retry={() => void query.refetch()} /> : query.data.length === 0 ? <PageEmptyState title="No reviews yet" description="Driver reviews appear after completed bookings." action={{ label: "View bookings", href: "/provider/bookings" }} /> : <div className="space-y-3">{query.data.map((review) => <article key={review.id} className="border bg-white p-5"><div className="flex justify-between gap-3"><strong>{review.driver?.fullName ?? "Driver"}</strong><span className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`size-4 ${index < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />)}</span></div><p className="mt-2 text-sm">{review.comment || "No written comment."}</p><small className="mt-2 block text-slate-500">Booking {review.booking?.bookingCode} · {formatDateTime(review.createdAt)}</small>{review.providerReply ? <p className="mt-3 bg-slate-50 p-3 text-sm"><strong>Provider reply:</strong> {review.providerReply}</p> : <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input aria-label="Reply to review" value={replies[review.id] ?? ""} onChange={(event) => setReplies((current) => ({ ...current, [review.id]: event.target.value }))} placeholder="Reply to review" /><Button disabled={!replies[review.id]?.trim() || reply.isPending} onClick={() => reply.mutate({ id: review.id, text: replies[review.id]! })}>Reply</Button></div>}</article>)}</div>}
  </ProviderPage>;
}
