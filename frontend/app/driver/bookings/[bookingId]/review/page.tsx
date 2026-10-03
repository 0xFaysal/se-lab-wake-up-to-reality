"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { bookingsApi } from "@/lib/api/bookings-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";

type Category = "securityRating" | "locationAccuracyRating" | "cleanlinessRating";

export default function ReviewPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const router = useRouter();
  const client = useQueryClient();
  const [rating, setRating] = useState(5);
  const [categories, setCategories] = useState<Record<Category, number>>({
    securityRating: 5,
    locationAccuracyRating: 5,
    cleanlinessRating: 5,
  });
  const [comment, setComment] = useState("");
  const mutation = useMutation({
    mutationFn: () => bookingsApi.review(bookingId, {
      rating,
      ...categories,
      ...(comment.trim() ? { comment: comment.trim() } : {}),
    }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.reviews.root });
      router.push(`/driver/bookings/${bookingId}`);
    },
  });

  return <form className="mx-auto max-w-2xl space-y-6 px-4 py-6" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
    <header><p className="text-xs font-bold uppercase text-emerald-700">Verified stay</p><h1 className="mt-2 text-2xl font-extrabold">Review completed booking</h1><p className="mt-2 text-sm text-slate-600">Help other drivers understand the parking experience.</p></header>
    <section className="space-y-5 border bg-white p-5">
      <RatingInput label="Overall experience" value={rating} onChange={setRating} />
      <div className="grid gap-5 border-t pt-5 sm:grid-cols-3">
        <RatingInput compact label="Security" value={categories.securityRating} onChange={(value) => setCategories((current) => ({ ...current, securityRating: value }))} />
        <RatingInput compact label="Location accuracy" value={categories.locationAccuracyRating} onChange={(value) => setCategories((current) => ({ ...current, locationAccuracyRating: value }))} />
        <RatingInput compact label="Cleanliness" value={categories.cleanlinessRating} onChange={(value) => setCategories((current) => ({ ...current, cleanlinessRating: value }))} />
      </div>
      <Textarea aria-label="Review comment" maxLength={2000} rows={6} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share useful details about access, safety, and the parking space" />
    </section>
    {mutation.isError && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{getApiErrorMessage(mutation.error)}</p>}
    <div className="flex justify-end"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Submit review</Button></div>
  </form>;
}

function RatingInput({ label, value, onChange, compact = false }: { label: string; value: number; onChange: (value: number) => void; compact?: boolean }) {
  return <fieldset><legend className="mb-2 text-sm font-bold">{label}</legend><div className="flex gap-1" aria-label={label}>{[1, 2, 3, 4, 5].map((item) => <button type="button" aria-label={`${item} stars for ${label}`} key={item} onClick={() => onChange(item)}><Star className={`${compact ? "size-5" : "size-7"} ${item <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} /></button>)}</div></fieldset>;
}
