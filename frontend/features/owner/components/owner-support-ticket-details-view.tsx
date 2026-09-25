"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  CheckCircle2,
  Check,
  Clock,
  AlertCircle,
  Paperclip,
  Send,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  AlertTriangle,
  Sliders,
} from "lucide-react";
import { MOCK_OWNER_PROFILE } from "@/lib/data/mock-owner-data";

interface SupportMessage {
  id: string;
  senderName: string;
  senderRole: string;
  senderType: "owner" | "support" | "system";
  badgeText?: string;
  timestamp: string;
  content: string;
}

const INITIAL_MESSAGES: SupportMessage[] = [
  {
    id: "msg-1",
    senderName: "Tanvir Chowdhury",
    senderRole: "Property Owner",
    senderType: "owner",
    timestamp: "Sep 11, 2026 · 10:20 AM",
    content:
      "My payout request #PR-8902 is still under review. The expected processing time has passed. Please check the current payout status.",
  },
  {
    id: "msg-2",
    senderName: "ParkEase BD Support",
    senderRole: "Support Specialist · Nadia Rahman",
    senderType: "support",
    badgeText: "Support Reply",
    timestamp: "Sep 11, 2026 · 10:32 AM",
    content:
      "Thanks for contacting us. We are reviewing the payout request and checking the settlement status with our payment operations team.",
  },
  {
    id: "msg-3",
    senderName: "ParkEase BD Support",
    senderRole: "Payment Operations",
    senderType: "system",
    badgeText: "Latest Update",
    timestamp: "Sep 11, 2026 · 11:15 AM (20 mins ago)",
    content:
      "The payout is currently awaiting final verification. No action is required from your side. We expect the review to complete within one business day.",
  },
];

export function OwnerSupportTicketDetailsView({ ticketId = "SUP-1048" }: { ticketId?: string }) {
  const [messages, setMessages] = useState<SupportMessage[]>(INITIAL_MESSAGES);
  const [replyText, setReplyText] = useState("");
  const [ticketStatus, setTicketStatus] = useState<"Open" | "Resolved">("Open");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    const newMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      senderName: MOCK_OWNER_PROFILE.name,
      senderRole: "Property Owner",
      senderType: "owner",
      timestamp: "Just now",
      content: replyText.trim(),
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, newMsg]);
      setReplyText("");
      setIsSubmitting(false);
      showToast("Reply sent to ParkEase BD Support team.");
    }, 400);
  };

  const handleMarkResolved = () => {
    setTicketStatus("Resolved");
    showToast("Ticket marked as resolved. You can reopen if needed.");
  };

  const handleRequestEscalation = () => {
    showToast("Ticket escalated to Senior Payment Supervisor.");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. TOP BREADCRUMBS & HEADER                                          */}
      {/* ==================================================================== */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
          <Link href="/owner/support" className="hover:text-slate-900 hover:underline">
            Help & Support
          </Link>
          <span className="text-slate-300">›</span>
          <span className="text-slate-800 font-semibold truncate">
            Ticket #{ticketId}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              Support Ticket Details
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track your support request, communicate with ParkEase BD Support, and review updates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/owner/support"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs font-heading"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Help & Support</span>
            </Link>

            {/* Owner Capsule */}
            <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="size-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-heading">
                {MOCK_OWNER_PROFILE.initials}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {MOCK_OWNER_PROFILE.name}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-medium">
                  {MOCK_OWNER_PROFILE.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. TICKET META HEADER CARD                                           */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700">
                #{ticketId}
              </span>
              <h2 className="font-heading font-extrabold text-lg text-slate-900">
                Payout Delay
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 font-heading ${
                  ticketStatus === "Open"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-slate-100 text-slate-700 border border-slate-300"
                }`}
              >
                <span className={`size-1.5 rounded-full ${ticketStatus === "Open" ? "bg-emerald-600 animate-pulse" : "bg-slate-500"}`} />
                {ticketStatus}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium border border-slate-200 text-slate-600 bg-white">
                Normal Priority
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <span>Category: <strong className="text-slate-800">Payments & Payouts</strong></span>
              <span>·</span>
              <span>Created: <strong className="text-slate-800">Sep 11, 2026 · 10:20 AM</strong></span>
              <span>·</span>
              <span className="text-emerald-700 font-bold font-heading">Last Updated: 20 mins ago</span>
            </div>
          </div>

          {/* Related Payout Capsule */}
          <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block font-heading">
                RELATED PAYOUT
              </span>
              <span className="font-mono text-xs font-bold text-[#064E3B] block">
                #PR-8902 <span className="text-emerald-700 font-normal">(৳ 6,250)</span>
              </span>
              <span className="text-[11px] text-slate-600 block mt-0.5">
                Residential Building, Gulshan
              </span>
            </div>
          </div>
        </div>

        {/* 4-Col Grid of Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Related Property</span>
            <span className="font-heading font-bold text-slate-900 block mt-0.5">
              Residential Building, Gulshan
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Assigned Team</span>
            <span className="font-heading font-bold text-slate-900 block mt-0.5">
              Payments & Payout Operations
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Expected Resolution SLA</span>
            <span className="font-heading font-bold text-slate-900 block mt-0.5">
              Within 24 Hours
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Linked Settlement Period</span>
            <span className="font-heading font-bold text-slate-900 block mt-0.5">
              Sep 1 – Sep 10, 2026
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. MAIN WORKSPACE 2-COLUMN GRID (CONVERSATION 1fr, SIDEBAR 340px)    */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ------------------------------------------------------------------ */}
        {/* LEFT COLUMN: CONVERSATION THREAD, REPLY FORM, ATTACHMENTS          */}
        {/* ------------------------------------------------------------------ */}
        <div className="space-y-6">
          {/* 1. CONVERSATION THREAD CARD */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-[#064E3B]" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Conversation Thread
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-400 font-heading">
                {messages.length} Messages
              </span>
            </div>

            {/* Messages Stack */}
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwner = msg.senderType === "owner";
                const isSupport = msg.senderType === "support";

                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl border transition ${
                      isOwner
                        ? "bg-slate-50/70 border-slate-200"
                        : isSupport
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-emerald-100/40 border-emerald-300"
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        {/* Avatar */}
                        {isOwner ? (
                          <div className="size-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-heading">
                            TC
                          </div>
                        ) : (
                          <div className="size-7 rounded-lg bg-[#064E3B] text-white font-bold text-xs flex items-center justify-center font-heading">
                            P
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-xs text-slate-900">
                              {msg.senderName}
                            </span>
                            {msg.badgeText && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#064E3B] text-white font-heading">
                                {msg.badgeText}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium block">
                            {msg.senderRole}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Message Content */}
                    <p className="text-xs text-slate-800 leading-relaxed pl-9">
                      &ldquo;{msg.content}&rdquo;
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. REPLY TO SUPPORT FORM CARD */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Reply to Support
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {replyText.length} / 1000 characters
              </span>
            </div>

            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                rows={4}
                value={replyText}
                maxLength={1000}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full p-3 rounded-xl border border-[#E5E7EB] text-xs leading-relaxed text-slate-800 bg-white focus:outline-none focus:border-[#064E3B] resize-none"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => showToast("Simulating file attachment selector...")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-bold text-slate-700 font-heading cursor-pointer"
                  >
                    <Paperclip className="size-3.5 text-slate-500" />
                    Attach File
                  </button>
                  <span className="text-[11px] text-slate-400">
                    PNG, JPG, PDF up to 10MB
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !replyText.trim()}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-bold transition shadow-2xs font-heading ${
                    !replyText.trim() ? "opacity-60 cursor-not-allowed" : "hover:bg-[#064E3B]/90 cursor-pointer"
                  }`}
                >
                  <Send className="size-3.5" />
                  <span>{isSubmitting ? "Sending..." : "Send Reply"}</span>
                </button>
              </div>

              {/* Warning box */}
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 text-[11px] text-amber-900 flex items-center gap-2 mt-2">
                <AlertCircle className="size-4 text-amber-600 shrink-0" />
                <span>
                  Do not include passwords, PINs, card details, or sensitive banking credentials.
                </span>
              </div>
            </form>
          </div>

          {/* 3. ATTACHMENTS CARD */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Paperclip className="size-4 text-[#064E3B]" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Attachments
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">2 Files Attached</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-[#E5E7EB] bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="size-8 rounded-lg bg-emerald-100 text-[#064E3B] flex items-center justify-center shrink-0">
                    <ImageIcon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-heading font-bold text-xs text-slate-900 block truncate">
                      payout-request-screenshot.png
                    </span>
                    <span className="text-[10px] text-slate-400 block">PNG · 1.2 MB · Tanvir Chowdhury</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Opening attachment preview...")}
                  className="px-2.5 py-1 rounded-md border border-[#E5E7EB] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shrink-0 font-heading cursor-pointer"
                >
                  View
                </button>
              </div>

              <div className="p-3 rounded-xl border border-[#E5E7EB] bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="size-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-heading font-bold text-xs text-slate-900 block truncate">
                      settlement-reference.pdf
                    </span>
                    <span className="text-[10px] text-slate-400 block">PDF · 420 KB · System Generated</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Opening PDF settlement reference...")}
                  className="px-2.5 py-1 rounded-md border border-[#E5E7EB] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shrink-0 font-heading cursor-pointer"
                >
                  View
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* RIGHT 340px SIDEBAR: STATUS, TIMELINE, RELATED, ACTIONS            */}
        {/* ------------------------------------------------------------------ */}
        <aside className="space-y-4">
          {/* CARD 1: TICKET STATUS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Ticket Status
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {ticketStatus}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Assigned Team:</span>
                <span className="font-bold text-slate-900 font-heading">Payments & Payouts</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Assigned Agent:</span>
                <span className="font-medium text-slate-800">Nadia Rahman</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Priority:</span>
                <span className="font-medium text-slate-800">Normal</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Response SLA:</span>
                <span className="font-medium text-slate-800 font-heading">Within 24 hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Last Response:</span>
                <span className="font-bold text-emerald-700 font-heading">20 mins ago</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Next Update:</span>
                <span className="font-medium text-slate-800 font-heading">Within 1 business day</span>
              </div>
            </div>
          </div>

          {/* CARD 2: TICKET TIMELINE */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Ticket Timeline
              </h3>
              <span className="text-[10px] font-semibold text-slate-400">In Progress</span>
            </div>

            <div className="space-y-2.5 text-xs pt-1">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-4 rounded-full bg-emerald-100 text-[#064E3B] flex items-center justify-center shrink-0">
                    <Check className="size-2.5 stroke-[3]" />
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">Ticket Created</span>
                    <span className="text-[10px] text-slate-400">Sep 11 · 10:20 AM</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700">Completed</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-4 rounded-full bg-emerald-100 text-[#064E3B] flex items-center justify-center shrink-0">
                    <Check className="size-2.5 stroke-[3]" />
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">Support Assigned</span>
                    <span className="text-[10px] text-slate-400">Sep 11 · 10:24 AM</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700">Completed</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-4 rounded-full bg-emerald-100 text-[#064E3B] flex items-center justify-center shrink-0">
                    <Check className="size-2.5 stroke-[3]" />
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">First Response</span>
                    <span className="text-[10px] text-slate-400">Sep 11 · 10:32 AM</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700">Completed</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <span className="size-1.5 rounded-full bg-amber-600" />
                  </span>
                  <div>
                    <span className="font-bold text-amber-900 block leading-tight">Payment Operations Review</span>
                    <span className="text-[10px] text-slate-400">Sep 11 · 11:15 AM</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-800">In Progress</span>
              </div>

              <div className="flex items-start justify-between opacity-60">
                <div className="flex items-center gap-2">
                  <span className="size-4 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <Clock className="size-2.5" />
                  </span>
                  <div>
                    <span className="font-medium text-slate-600 block leading-tight">Resolution</span>
                    <span className="text-[10px] text-slate-400">Estimated ~1 business day</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Pending</span>
              </div>
            </div>
          </div>

          {/* CARD 3: RELATED INFORMATION */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Related Information
              </h3>
              <ExternalLink className="size-3.5 text-slate-400" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Property:</span>
                <span className="font-bold text-slate-900 font-heading">Residential Building, Gulshan</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payout ID:</span>
                <span className="font-mono text-slate-700 font-semibold">#PR-8902</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Amount:</span>
                <span className="font-heading font-extrabold text-sm text-[#064E3B]">৳ 6,250</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payout Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Under Review
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Requested:</span>
                <span className="text-slate-600">Sep 10, 2026 · 2:15 PM</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <Link
                href="/owner/payouts"
                className="py-1.5 px-2 rounded-lg border border-[#E5E7EB] text-center text-xs font-bold text-slate-700 hover:bg-slate-50 font-heading"
              >
                View Payout
              </Link>
              <Link
                href="/owner/properties/1"
                className="py-1.5 px-2 rounded-lg border border-[#E5E7EB] text-center text-xs font-bold text-slate-700 hover:bg-slate-50 font-heading"
              >
                View Property
              </Link>
            </div>
          </div>

          {/* CARD 4: SUPPORT ACTIONS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Support Actions
              </h3>
              <Sliders className="size-3.5 text-slate-400" />
            </div>

            <button
              type="button"
              onClick={handleMarkResolved}
              className="w-full py-2 rounded-lg border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/50 text-xs font-bold text-emerald-800 transition flex items-center justify-center gap-1.5 font-heading cursor-pointer"
            >
              <Check className="size-3.5 stroke-[3]" />
              <span>Mark as Resolved</span>
            </button>

            <button
              type="button"
              onClick={handleRequestEscalation}
              className="w-full py-2 rounded-lg border border-amber-300 bg-amber-50/50 hover:bg-amber-100/50 text-xs font-bold text-amber-800 transition flex items-center justify-center gap-1.5 font-heading cursor-pointer"
            >
              <AlertTriangle className="size-3.5" />
              <span>Request Escalation</span>
            </button>

            <p className="text-[10px] text-slate-400 text-center leading-tight pt-1">
              Only mark the ticket resolved when your issue has been fully addressed.
            </p>
          </div>
        </aside>
      </div>

      {/* Bottom link back */}
      <div className="pt-4">
        <Link
          href="/owner/support"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs font-heading"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Help & Support</span>
        </Link>
      </div>
    </div>
  );
}
