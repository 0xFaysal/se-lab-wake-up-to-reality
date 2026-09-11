"use client";

import React, { useState, useMemo } from "react";
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Clock,
  Search,
  ChevronDown,
  Filter,
  ArrowRight,
  MoreVertical,
  Reply,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  Check,
  X,
  Edit2,
  Share2,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import {
  MOCK_OWNER_REVIEWS,
  MOCK_RATING_BREAKDOWN,
  MOCK_REVIEW_ACTIVITY,
  OwnerReview,
} from "@/lib/data/mock-owner-data";

export function OwnerReviewsView() {
  const [reviews, setReviews] = useState<OwnerReview[]>(MOCK_OWNER_REVIEWS);
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  // Interactive Modal States
  const [replyingReview, setReplyingReview] = useState<OwnerReview | null>(null);
  const [replyText, setReplyText] = useState("");
  const [reportingReview, setReportingReview] = useState<OwnerReview | null>(null);
  const [reportReason, setReportReason] = useState("INACCURATE");
  const [reportNote, setReportNote] = useState("");
  const [selectedBookingCode, setSelectedBookingCode] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Response Status Stats
  const totalReviewsCount = 126;
  const repliedCount = reviews.filter((r) => r.status === "Replied").length + 106; // scaled to 108
  const needsReplyCount = reviews.filter((r) => r.status === "Needs Reply").length + 16; // scaled to 18

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((rev) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          rev.reviewerName.toLowerCase().includes(q) ||
          rev.comment.toLowerCase().includes(q) ||
          rev.bookingCode.toLowerCase().includes(q) ||
          rev.propertyTitle.toLowerCase().includes(q);

        let matchesProperty = true;
        if (propertyFilter !== "ALL") {
          matchesProperty = rev.propertyTitle.toLowerCase().includes(propertyFilter.toLowerCase());
        }

        let matchesRating = true;
        if (ratingFilter !== "ALL") {
          matchesRating = rev.rating === parseInt(ratingFilter, 10);
        }

        let matchesStatus = true;
        if (statusFilter !== "ALL") {
          matchesStatus = rev.status === statusFilter;
        }

        return matchesSearch && matchesProperty && matchesRating && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "HIGHEST") return b.rating - a.rating;
        if (sortBy === "LOWEST") return a.rating - b.rating;
        return 0; // default Newest
      });
  }, [reviews, searchQuery, propertyFilter, ratingFilter, statusFilter, sortBy]);

  const handlePublishReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !replyText.trim()) return;

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === replyingReview.id) {
          return {
            ...r,
            status: "Replied",
            ownerReply: {
              text: replyText.trim(),
              dateStr: "Just now",
            },
          };
        }
        return r;
      })
    );

    setToastMsg(`Owner reply published for ${replyingReview.reviewerName}.`);
    setTimeout(() => setToastMsg(null), 3500);
    setReplyingReview(null);
    setReplyText("");
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReview) return;

    setToastMsg(`Review for booking ${reportingReview.bookingCode} reported to ParkEase BD moderation.`);
    setTimeout(() => setToastMsg(null), 4000);
    setReportingReview(null);
    setReportNote("");
  };

  return (
    <div className="flex flex-col min-h-full relative bg-[#f9f9ff]">
      {/* Top Header */}
      <OwnerHeader
        title="Reviews"
        badge={
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {totalReviewsCount} Total
          </span>
        }
        subtitle="Monitor driver feedback and respond across your parking properties."
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-24 right-8 z-50 bg-[#064E3B] text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <Check className="size-4 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 lg:p-8 max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================================================================== */}
          {/* LEFT 2/3 COLUMN (8 COLS)                                           */}
          {/* ================================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. METRICS ROW (4 Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Card 1: Average Rating */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-heading block">
                    Average Rating
                  </span>
                  <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                    <Star className="size-4 fill-amber-500 text-amber-500" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                      4.8
                    </span>
                    <span className="text-xs font-semibold text-slate-400">/ 5</span>
                  </div>
                  <p className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-1">
                    <span>★ Top 5% in Dhaka</span>
                  </p>
                </div>
              </div>

              {/* Card 2: Total Reviews */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-heading block">
                    Total Reviews
                  </span>
                  <div className="size-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
                    <MessageSquare className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                    126
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Across 3 properties
                  </p>
                </div>
              </div>

              {/* Card 3: 5-Star Reviews */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-heading block">
                    5-Star Reviews
                  </span>
                  <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 border border-emerald-100">
                    <ThumbsUp className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#064E3B] font-heading tracking-tight">
                    98
                  </div>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    77.8% positive
                  </p>
                </div>
              </div>

              {/* Card 4: Needs Reply */}
              <div className="bg-white rounded-xl border border-amber-300 p-4.5 shadow-2xs flex flex-col justify-between bg-gradient-to-br from-white to-amber-50/30">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 font-heading block">
                    Needs Reply
                  </span>
                  <div className="size-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Clock className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-heading tracking-tight">
                    18
                  </div>
                  <p className="text-[11px] text-amber-800 font-semibold mt-1">
                    Requires action
                  </p>
                </div>
              </div>
            </div>

            {/* 2. FILTER BAR */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-2.5 shadow-2xs flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search driver, review, booking ID, or property"
                  className="w-full h-9.5 pl-9.5 pr-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition"
                />
              </div>

              {/* Property Select */}
              <div className="relative">
                <select
                  aria-label="Filter by property"
                  value={propertyFilter}
                  onChange={(e) => setPropertyFilter(e.target.value)}
                  className="h-9.5 pl-3 pr-7 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition appearance-none cursor-pointer"
                >
                  <option value="ALL">All Properties</option>
                  <option value="Gulshan">Gulshan Property</option>
                  <option value="Banani">Banani Office</option>
                  <option value="Dhanmondi">Dhanmondi</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Rating Select */}
              <div className="relative">
                <select
                  aria-label="Filter by rating"
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="h-9.5 pl-3 pr-7 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition appearance-none cursor-pointer"
                >
                  <option value="ALL">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Reply Status Select */}
              <div className="relative">
                <select
                  aria-label="Filter by reply status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9.5 pl-3 pr-7 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition appearance-none cursor-pointer"
                >
                  <option value="ALL">All Reply Statuses</option>
                  <option value="Needs Reply">Needs Reply</option>
                  <option value="Replied">Replied</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Sort Select */}
              <div className="relative">
                <select
                  aria-label="Sort reviews"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9.5 pl-3 pr-7 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition appearance-none cursor-pointer"
                >
                  <option value="NEWEST">Newest First</option>
                  <option value="HIGHEST">Highest Rating</option>
                  <option value="LOWEST">Lowest Rating</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 3. REVIEW CARDS LIST */}
            <div className="space-y-4">
              {filteredReviews.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 text-center text-slate-500 text-xs">
                  No reviews match the selected filter criteria.
                </div>
              ) : (
                filteredReviews.map((rev) => {
                  const isReplied = rev.status === "Replied";
                  const isNeedsReply = rev.status === "Needs Reply";

                  return (
                    <div
                      key={rev.id}
                      className={`bg-white rounded-xl border ${
                        rev.isLowRating ? "border-rose-200" : "border-[#E5E7EB]"
                      } p-5 sm:p-6 shadow-2xs space-y-3.5 transition-all hover:shadow-xs`}
                    >
                      {/* Review Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`size-10 rounded-full ${rev.avatarBg} ${rev.avatarText} font-bold text-xs flex items-center justify-center font-heading shrink-0`}
                          >
                            {rev.reviewerInitials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900 font-heading">
                                {rev.reviewerName}
                              </h3>
                              {isReplied && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  Replied
                                </span>
                              )}
                              {isNeedsReply && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  Needs Reply
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {rev.propertyTitle} • <span className="font-medium text-slate-700">{rev.bookingCode}</span> • {rev.dateStr}
                            </p>
                          </div>
                        </div>

                        {/* Star Rating & Ellipsis */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((starVal) => (
                              <Star
                                key={starVal}
                                className={`size-3.5 ${
                                  starVal <= rev.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-200"
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-slate-700 ml-1">
                              {rev.rating}/5
                            </span>
                          </div>

                          <button
                            type="button"
                            className="size-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          >
                            <MoreVertical className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Review Text */}
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                        {rev.comment}
                      </p>

                      {/* Nested Owner Reply Block if replied */}
                      {rev.ownerReply && (
                        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100/80 space-y-2">
                          <div className="flex items-center justify-between text-xs text-emerald-950">
                            <div className="flex items-center gap-1.5 font-bold font-heading text-emerald-900">
                              <span className="text-sm">↳</span>
                              <span>Owner Reply</span>
                              <span className="text-[11px] font-normal text-slate-500 ml-1.5">
                                {rev.ownerReply.dateStr}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingReview(rev);
                                setReplyText(rev.ownerReply?.text || "");
                              }}
                              className="text-[11px] font-semibold text-[#064E3B] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="size-3" />
                              <span>Edit Reply</span>
                            </button>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed italic">
                            {rev.ownerReply.text}
                          </p>
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div>
                          {rev.isLowRating && (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                              <AlertTriangle className="size-3.5" />
                              Low rating review
                            </span>
                          )}
                          {!rev.isLowRating && isNeedsReply && (
                            <span className="text-slate-400 italic text-[11px]">
                              Awaiting owner response
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {rev.isLowRating && (
                            <button
                              type="button"
                              onClick={() => setReportingReview(rev)}
                              className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-slate-600 hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Flag className="size-3" />
                              <span>Report Review</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedBookingCode(rev.bookingCode)}
                            className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                          >
                            View Booking
                          </button>

                          {isNeedsReply && (
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingReview(rev);
                                setReplyText("");
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Reply className="size-3.5" />
                              <span>Reply</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 4. BOTTOM NOTICE BANNER */}
            <div className="bg-slate-50 border border-[#E5E7EB] rounded-xl p-3.5 sm:p-4 flex items-start gap-2.5 text-xs text-slate-600">
              <Info className="size-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-bold text-slate-800">Review Policy:</span> Owners may reply to reviews and report inappropriate content. Driver ratings and original review text cannot be edited by the Owner.
              </p>
            </div>
          </div>

          {/* ================================================================== */}
          {/* RIGHT 1/3 SIDEBAR (4 COLS)                                         */}
          {/* ================================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. RATING BREAKDOWN */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Rating Breakdown
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  126 Total
                </span>
              </div>

              <div className="space-y-2.5">
                {MOCK_RATING_BREAKDOWN.map((row) => (
                  <div key={row.stars} className="flex items-center gap-3 text-xs">
                    <span className="w-6 font-bold text-slate-700 flex items-center gap-0.5">
                      {row.stars} <Star className="size-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          row.stars >= 4
                            ? "bg-[#064E3B]"
                            : row.stars === 3
                            ? "bg-amber-400"
                            : row.stars === 2
                            ? "bg-orange-400"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-semibold text-slate-700">
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. RESPONSE STATUS */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Response Status
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  86% Rate
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Replied</span>
                  <span className="text-2xl font-extrabold text-[#064E3B] font-heading mt-1 block">
                    {repliedCount}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Needs Reply</span>
                  <span className="text-2xl font-extrabold text-amber-700 font-heading mt-1 block">
                    {needsReplyCount}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStatusFilter("Needs Reply")}
                className="w-full py-2.5 px-4 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                View Unreplied Reviews
              </button>
            </div>

            {/* 3. RECENT REVIEW ACTIVITY */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-[#064E3B]" />
                  <h3 className="text-sm font-bold font-heading text-slate-900">
                    Recent Review Activity
                  </h3>
                </div>
              </div>

              <div className="space-y-3.5">
                {MOCK_REVIEW_ACTIVITY.map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5 text-xs">
                    <span className={`size-2 rounded-full ${item.dotColor} shrink-0 mt-1.5`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {item.subtext}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => alert("Review audit log: All ratings and responses are permanently logged.")}
                  className="text-xs font-semibold text-[#064E3B] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Full Activity</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL: REPLY TO REVIEW                                               */}
      {/* ==================================================================== */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                  <Reply className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-900">
                    Reply to {replyingReview.reviewerName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your reply will be publicly visible under the review
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingReview(null)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Original Driver Review Excerpt */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex justify-between items-center text-slate-500 text-[11px]">
                <span>Driver Feedback ({replyingReview.rating} Stars):</span>
                <span>{replyingReview.bookingCode}</span>
              </div>
              <p className="text-slate-800 italic">“{replyingReview.comment}”</p>
            </div>

            {/* Form */}
            <form onSubmit={handlePublishReply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Response *
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Thank the driver, address any issues mentioned, and invite them back..."
                  className="w-full p-3 rounded-xl border border-[#E5E7EB] text-xs text-slate-900 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-semibold shadow-sm"
                >
                  Publish Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: REPORT REVIEW                                                 */}
      {/* ==================================================================== */}
      {reportingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700">
                <Flag className="size-4" />
                <h3 className="text-base font-bold font-heading text-slate-900">
                  Report Review
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReportingReview(null)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for reporting *
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white font-medium text-slate-800 focus:outline-none focus:border-[#064E3B]"
                >
                  <option value="INACCURATE">Inaccurate or false representation</option>
                  <option value="OFFENSIVE">Offensive or abusive language</option>
                  <option value="WRONG_PROPERTY">Refers to a different property</option>
                  <option value="SPAM">Spam or competitor tampering</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Provide context for the ParkEase BD trust & safety team..."
                  className="w-full p-2.5 rounded-lg border border-[#E5E7EB] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReportingReview(null)}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: VIEW BOOKING INFO                                             */}
      {/* ==================================================================== */}
      {selectedBookingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-heading text-slate-900">
                  Booking {selectedBookingCode}
                </h3>
                <p className="text-xs text-slate-500">Linked Driver Parking Session</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingCode(null)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking ID</span>
                  <span className="font-semibold text-slate-900">{selectedBookingCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-semibold text-emerald-700">Completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status</span>
                  <span className="font-semibold text-slate-900">Paid & Settled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-in Verification</span>
                  <span className="font-semibold text-slate-900">QR Code Confirmed</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedBookingCode(null)}
                className="px-4 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#064E3B]/90 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
