"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  MessageSquare,
  Reply,
  Search,
  ShieldCheck,
  Star,
  ThumbsUp,
} from "lucide-react";
import { ManagerHeader } from "@/components/manager/manager-header";
import { Button } from "@/components/ui/button";
import { managerApi } from "@/lib/api/manager-api";
import { reviewsApi } from "@/lib/api/reviews-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "Recent";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return isoString;
  }
}

export default function ManagerReviewsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [replyText, setReplyText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const delegationsQuery = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const activeDelegations = delegationsQuery.data?.filter((d) => d.status === "ACTIVE") ?? [];
  const primaryOwner = activeDelegations[0]?.provider?.fullName || "Property Owner";

  const reviewsQuery = useQuery({
    queryKey: queryKeys.reviews.provider(),
    queryFn: () => reviewsApi.providerList(),
  });

  const rawReviews = useMemo(() => reviewsQuery.data ?? [], [reviewsQuery.data]);

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, reply }: { reviewId: string; reply: string }) => {
      return reviewsApi.reply(reviewId, reply);
    },
    onSuccess: () => {
      toast.success("Manager reply published successfully");
      setReplyingToId(null);
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.root });
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err));
    },
  });

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return rawReviews.filter((r) => {
      const author = r.driver?.fullName || "Driver";
      const propName = r.booking?.property?.name || "";
      const comment = r.comment || "";
      const bookingCode = r.booking?.bookingCode || "";

      const matchSearch =
        author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        propName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bookingCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchProperty =
        propertyFilter === "ALL" || r.booking?.propertyId === propertyFilter;

      const matchRating =
        ratingFilter === "ALL" || r.rating === Number(ratingFilter);

      let matchStatus = true;
      if (statusFilter === "Replied") {
        matchStatus = Boolean(r.providerReply);
      } else if (statusFilter === "Needs Reply") {
        matchStatus = !r.providerReply && r.rating >= 3;
      } else if (statusFilter === "Needs Attention") {
        matchStatus = r.rating < 3;
      }

      return matchSearch && matchProperty && matchRating && matchStatus;
    });
  }, [rawReviews, searchTerm, propertyFilter, ratingFilter, statusFilter]);

  // Real KPI calculations
  const metrics = useMemo(() => {
    const total = rawReviews.length;
    if (total === 0) {
      return { avgRating: 5.0, total: 0, fiveStar: 0, needsAttention: 0, unanswered: 0, responseRate: 100 };
    }
    const sum = rawReviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = Number((sum / total).toFixed(1));
    const fiveStar = rawReviews.filter((r) => r.rating === 5).length;
    const needsAttention = rawReviews.filter((r) => r.rating < 3).length;
    const unanswered = rawReviews.filter((r) => !r.providerReply).length;
    const replied = rawReviews.filter((r) => Boolean(r.providerReply)).length;
    const responseRate = Math.round((replied / total) * 100);

    return { avgRating, total, fiveStar, needsAttention, unanswered, responseRate };
  }, [rawReviews]);

  // Star breakdown counts
  const starCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of rawReviews) {
      if (counts[r.rating] !== undefined) {
        counts[r.rating]++;
      }
    }
    return [5, 4, 3, 2, 1].map((star) => {
      const count = counts[star] || 0;
      const pct = rawReviews.length > 0 ? Math.round((count / rawReviews.length) * 100) : 0;
      return { star, count, pct };
    });
  }, [rawReviews]);

  const handleSendReply = (reviewId: string) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply message");
      return;
    }
    replyMutation.mutate({ reviewId, reply: replyText.trim() });
  };

  return (
    <div className="flex flex-col min-h-full">
      <ManagerHeader
        title="Reviews"
        subtitle="Monitor customer feedback across properties assigned to you."
        badge="Manager View"
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Delegated Access Notice Banner */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4.5 text-[#064E3B] shrink-0" />
            <span className="font-medium">
              Review access depends on the permissions delegated by the Property Owner. You can view all reviews and publish operational replies.
            </span>
          </div>
          <span className="font-semibold text-emerald-900 shrink-0">
            Assigned by: {primaryOwner}
          </span>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                AVERAGE RATING
              </span>
              <Star className="size-4 text-amber-500 fill-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {metrics.avgRating} <span className="text-xs text-slate-400 font-normal">/ 5</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-700 font-medium">{metrics.total} verified reviews</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                TOTAL REVIEWS
              </span>
              <MessageSquare className="size-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{metrics.total}</div>
            <p className="mt-1 text-[11px] text-slate-400">All assigned hubs</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                5-STAR REVIEWS
              </span>
              <ThumbsUp className="size-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-emerald-700">{metrics.fiveStar}</div>
            <p className="mt-1 text-[11px] text-emerald-700 font-medium">Top ratings</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                NEEDS ATTENTION
              </span>
              <AlertTriangle className="size-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-amber-900">{metrics.needsAttention}</div>
            <p className="mt-1 text-[11px] text-amber-700 font-medium">Under 3 stars</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                UNANSWERED
              </span>
              <Reply className="size-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-blue-900">{metrics.unanswered}</div>
            <p className="mt-1 text-[11px] text-blue-700 font-medium">Awaiting response</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search driver, review text, booking code, or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#064E3B] focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Properties ({activeDelegations.length})</option>
              {activeDelegations.map((d) => (
                <option key={d.property.id} value={d.property.id}>
                  {d.property?.name || d.property.id}
                </option>
              ))}
            </select>

            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Reply Statuses</option>
              <option value="Replied">Replied</option>
              <option value="Needs Reply">Needs Reply</option>
              <option value="Needs Attention">Needs Attention</option>
            </select>
          </div>
        </div>

        {/* Two-Column Grid: Reviews List (8 cols) vs Sidebar Breakdown (4 cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Reviews (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Customer Reviews
                </h2>
                <span className="text-xs text-slate-400">
                  Showing {filteredReviews.length} of {rawReviews.length} total reviews
                </span>
              </div>

              {reviewsQuery.isLoading && (
                <div className="py-12 text-center text-xs text-slate-500">
                  Loading customer reviews...
                </div>
              )}

              {!reviewsQuery.isLoading && filteredReviews.length === 0 && (
                <div className="py-12 text-center space-y-3">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                    <MessageSquare className="size-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No Reviews Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchTerm
                      ? `No reviews matched your search "${searchTerm}".`
                      : "No customer reviews currently match this filter criteria across your assigned properties."}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {filteredReviews.map((r) => {
                  const author = r.driver?.fullName || "Driver";
                  const propName = r.booking?.property?.name || "Assigned Property";
                  const bookingCode = r.booking?.bookingCode || "";
                  const hasReplied = Boolean(r.providerReply);
                  const isLowRating = r.rating < 3;

                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900 text-xs">
                            {author}
                          </span>
                          <span className="text-slate-400 mx-1.5">·</span>
                          <span className="text-slate-600 text-xs font-medium">
                            {propName}
                          </span>
                          {bookingCode && (
                            <>
                              <span className="text-slate-400 mx-1.5">·</span>
                              <span className="font-mono text-emerald-800 text-[11px] font-bold">
                                #{bookingCode}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`size-3.5 ${
                                  i < r.rating ? "fill-amber-500 text-amber-500" : "text-slate-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            {r.rating}.0
                          </span>
                          <span className="text-slate-400 text-[11px]">{formatDate(r.createdAt)}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 italic">
                        &ldquo;{r.comment || "No comment provided."}&rdquo;
                      </p>

                      {/* Provider reply */}
                      {r.providerReply && (
                        <div className="rounded-lg bg-white border border-slate-200 p-2.5 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">Management Response:</span>
                            <span className="text-[10px] text-slate-400">{formatDate(r.providerRepliedAt)}</span>
                          </div>
                          <p className="text-slate-600">&ldquo;{r.providerReply}&rdquo;</p>
                        </div>
                      )}

                      {isLowRating && !r.providerReply && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800 flex items-center gap-1.5">
                          <AlertTriangle className="size-3.5 text-amber-700 shrink-0" />
                          <span>Low rating flagged · Management operational response recommended</span>
                        </div>
                      )}

                      {/* Actions Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              hasReplied
                                ? "bg-emerald-100 text-emerald-800"
                                : isLowRating
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {hasReplied ? "Replied" : isLowRating ? "Needs Attention" : "Needs Reply"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!hasReplied && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setReplyingToId(r.id);
                                setReplyText("");
                              }}
                              className="h-7 text-xs font-semibold bg-[#064E3B] text-white hover:bg-emerald-900 gap-1"
                            >
                              <Reply className="size-3" />
                              Reply
                            </Button>
                          )}
                          {bookingCode && (
                            <Link href="/manager/bookings">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                View Booking
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Reply Form */}
                      {replyingToId === r.id && (
                        <div className="rounded-lg bg-white border border-emerald-200 p-3 space-y-2 mt-2">
                          <textarea
                            rows={2}
                            placeholder="Type manager response to driver..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full rounded border border-slate-200 p-2 text-xs focus:border-[#064E3B] focus:outline-hidden"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setReplyingToId(null)}
                              className="h-7 text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              disabled={replyMutation.isPending}
                              onClick={() => handleSendReply(r.id)}
                              className="h-7 text-xs bg-[#064E3B] text-white hover:bg-emerald-900"
                            >
                              {replyMutation.isPending ? "Sending..." : "Publish Reply"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Rating Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Rating Breakdown
                </h3>
                <span className="text-xs text-slate-400">{rawReviews.length} ratings</span>
              </div>

              <div className="space-y-2 text-xs">
                {starCounts.map((row) => (
                  <div key={row.star} className="flex items-center gap-2">
                    <span className="w-6 text-slate-600 font-bold">{row.star}★</span>
                    <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-medium text-slate-400 text-[11px]">
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Status */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Response Status
                </h3>
                <span className="text-xs font-bold text-emerald-700">
                  {metrics.responseRate}% Response Rate
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    REPLIED
                  </span>
                  <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">
                    {rawReviews.filter((r) => Boolean(r.providerReply)).length}
                  </span>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-2.5">
                  <span className="text-[10px] font-bold uppercase text-blue-800 block">
                    PENDING
                  </span>
                  <span className="text-lg font-extrabold text-blue-700 mt-0.5 block">
                    {metrics.unanswered}
                  </span>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-2.5">
                  <span className="text-[10px] font-bold uppercase text-amber-800 block">
                    LOW RATING
                  </span>
                  <span className="text-lg font-extrabold text-amber-700 mt-0.5 block">
                    {metrics.needsAttention}
                  </span>
                </div>
              </div>
            </div>

            {/* Manager Review Access Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <h3 className="text-xs font-bold text-slate-900">
                  Manager Review Access
                </h3>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  Delegated
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                    GRANTED:
                  </span>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 border border-emerald-200">
                      View Reviews
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 border border-emerald-200">
                      Booking Context
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 border border-emerald-200">
                      Publish Operator Reply
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block mb-1">
                    RESTRICTED:
                  </span>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className="rounded bg-red-50 px-2 py-0.5 text-red-700 border border-red-200">
                      Delete Review / Moderation Policy Overrides
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
