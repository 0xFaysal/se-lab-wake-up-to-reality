"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  BookOpen,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Plus,
  ExternalLink,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  HelpCircle,
  Building2,
  Calendar,
  CreditCard,
  Shield,
  Users,
  Lock,
  X,
  Check,
  Sparkles,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import {
  MOCK_SUPPORT_TICKETS,
  POPULAR_TOPICS,
  MOCK_FAQS,
  MOCK_OWNER_PROPERTIES,
  SupportTicket,
  HelpTopic,
} from "@/lib/data/mock-owner-data";

export function OwnerSupportView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuickTopic, setSelectedQuickTopic] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>(MOCK_SUPPORT_TICKETS);
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");

  // Mini Form State
  const [miniCategory, setMiniCategory] = useState("");
  const [miniProperty, setMiniProperty] = useState("");

  // Modals State
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState("Payments & Payouts");
  const [modalProperty, setModalProperty] = useState(MOCK_OWNER_PROPERTIES[0]?.title || "");
  const [modalSubject, setModalSubject] = useState("");
  const [modalDetails, setModalDetails] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Quick topics pills
  const quickTopics = [
    "Managing Parking Spaces",
    "Bookings & Cancellations",
    "Payments & Payouts",
    "Guard Management",
    "Manager Management",
    "Account & Security",
  ];

  const handleMiniFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (miniCategory) {
      setModalCategory(miniCategory);
    }
    if (miniProperty) {
      setModalProperty(miniProperty);
    }
    setIsNewTicketModalOpen(true);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSubject.trim()) return;

    const newTicketCode = `#SUP-${Math.floor(1050 + Math.random() * 500)}`;
    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      ticketCode: newTicketCode,
      subject: modalSubject.trim(),
      category: modalCategory as SupportTicket["category"],
      status: "Open",
      updatedTime: "Just now",
      propertyTitle: modalProperty,
      description: modalDetails.trim() || "Owner submitted support request.",
    };

    setTickets((prev) => [newTicket, ...prev]);
    setIsNewTicketModalOpen(false);
    setModalSubject("");
    setModalDetails("");
    setToastMsg(`Support ticket ${newTicketCode} created successfully.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const getTopicIcon = (iconName: string) => {
    switch (iconName) {
      case "Parking":
        return <Building2 className="size-5 text-emerald-700" />;
      case "Bookings":
        return <Calendar className="size-5 text-emerald-700" />;
      case "Payments":
        return <CreditCard className="size-5 text-emerald-700" />;
      case "Guards":
        return <Shield className="size-5 text-emerald-700" />;
      case "Managers":
        return <Users className="size-5 text-emerald-700" />;
      case "Security":
        return <Lock className="size-5 text-emerald-700" />;
      default:
        return <HelpCircle className="size-5 text-emerald-700" />;
    }
  };

  return (
    <div className="flex flex-col min-h-full relative bg-[#f9f9ff]">
      {/* Top Header */}
      <OwnerHeader
        title="Help & Support"
        subtitle="Find answers, get assistance, and manage your support requests."
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
            {/* 1. HERO SEARCH CARD */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 text-[#064E3B]">
                <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <BookOpen className="size-4.5" />
                </div>
                <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900">
                  How can we help?
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Quickly find solutions across documentation, management guides, and FAQs.
              </p>

              {/* Large search input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search help articles and frequently asked questions..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#E5E7EB] bg-[#fcfcfd] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition"
                />
              </div>

              {/* Quick Topics Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                <span className="text-slate-400 text-[11px] font-medium mr-1">
                  Quick Topics:
                </span>
                {quickTopics.map((topic) => {
                  const isSelected = selectedQuickTopic === topic;
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => {
                        setSelectedQuickTopic(isSelected ? null : topic);
                        setSearchQuery(isSelected ? "" : topic);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
                        isSelected
                          ? "bg-emerald-50 text-[#064E3B] border-emerald-300 font-semibold"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. URGENT ALERT BANNER */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 sm:p-4 flex items-start gap-3 text-xs text-amber-950">
              <AlertTriangle className="size-4.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-bold text-amber-900">Urgent operational note:</span> For urgent gate-access or active parking session issues, contact support immediately and include the booking ID.
              </p>
            </div>

            {/* 3. POPULAR TOPICS (3x2 GRID) */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm sm:text-base font-bold font-heading text-slate-900">
                  Popular Topics
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  6 Main Categories
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {POPULAR_TOPICS.map((topic) => (
                  <div
                    key={topic.id}
                    className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3 flex flex-col justify-between hover:shadow-xs transition"
                  >
                    <div className="space-y-2">
                      <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        {getTopicIcon(topic.iconName)}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-heading">
                        {topic.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                        {topic.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => alert(`Opening ${topic.title} documentation guide.`)}
                      className="text-xs font-semibold text-[#064E3B] hover:text-[#064E3B]/80 flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <span>View Articles</span>
                      <span>→</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. MY SUPPORT REQUESTS TABLE */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold font-heading text-slate-900">
                    My Support Requests
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    {tickets.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition cursor-pointer active:scale-[0.99]"
                >
                  <Plus className="size-3.5 stroke-[2.5]" />
                  <span>Open Support Request</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-slate-50/75 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">TICKET ID</th>
                      <th className="py-3 px-4">SUBJECT</th>
                      <th className="py-3 px-4">CATEGORY</th>
                      <th className="py-3 px-4">STATUS</th>
                      <th className="py-3 px-4">UPDATED</th>
                      <th className="py-3 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tickets.map((t) => {
                      const isOpen = t.status === "Open";
                      const isInProgress = t.status === "In Progress";
                      const isResolved = t.status === "Resolved";

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-semibold text-[#064E3B]">
                            {t.ticketCode}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-900">
                            {t.subject}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {t.category}
                          </td>
                          <td className="py-3.5 px-4">
                            {isOpen && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                Open
                              </span>
                            )}
                            {isInProgress && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                In Progress
                              </span>
                            )}
                            {isResolved && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Resolved
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {t.updatedTime}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedTicket(t)}
                              className="text-xs font-semibold text-[#064E3B] hover:underline cursor-pointer"
                            >
                              View Ticket
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. FREQUENTLY ASKED QUESTIONS */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm sm:text-base font-bold font-heading text-slate-900">
                  Frequently Asked Questions
                </h3>
                <button
                  type="button"
                  onClick={() => alert("Opening full ParkEase BD Owner Knowledge Base.")}
                  className="text-xs font-semibold text-[#064E3B] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All FAQs</span>
                  <span>→</span>
                </button>
              </div>

              <div className="space-y-3">
                {MOCK_FAQS.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="border border-[#E5E7EB] rounded-xl overflow-hidden transition"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-900 font-heading hover:bg-slate-50 transition cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          className={`size-4 text-slate-400 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* RIGHT 1/3 SIDEBAR (4 COLS)                                         */}
          {/* ================================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. SUPPORT STATUS SUMMARY */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Support Status Summary
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                  <span className="text-xl font-extrabold text-amber-800 font-heading block">
                    1
                  </span>
                  <span className="text-[10px] uppercase font-bold text-amber-700 mt-0.5 block">
                    Open
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
                  <span className="text-xl font-extrabold text-indigo-800 font-heading block">
                    1
                  </span>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 mt-0.5 block">
                    In Progress
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-xl font-extrabold text-[#064E3B] font-heading block">
                    8
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 mt-0.5 block">
                    Resolved
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Average Response Time</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 text-[11px]">
                  18 mins
                </span>
              </div>
            </div>

            {/* 2. NEED MORE HELP? */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Need More Help?
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Connect with ParkEase BD Support if you cannot resolve your issue through the Help Center.
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl border border-slate-200/70 bg-[#fcfcfd] flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0">
                    <MessageCircle className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900">Live Chat</h4>
                    <p className="text-[11px] text-slate-500">
                      Typical response: Under 5 minutes
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200/70 bg-[#fcfcfd] flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0">
                    <Mail className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900">Email Support</h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      support@parkease.bd • Within 2 hours
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200/70 bg-[#fcfcfd] flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0">
                    <Phone className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900">Phone Support</h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      +880 96XX-XXXXXX • 9:00 AM – 10:00 PM
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold text-xs shadow-2xs transition cursor-pointer active:scale-[0.99]"
              >
                Contact Support
              </button>
            </div>

            {/* 3. OPEN A SUPPORT REQUEST (MINI FORM) */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Open a Support Request
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Need assistance with a specific listing, guard, booking, payout, or account issue?
                </p>
              </div>

              <form onSubmit={handleMiniFormSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={miniCategory}
                    onChange={(e) => setMiniCategory(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white font-medium text-slate-800 focus:outline-none focus:border-[#064E3B]"
                  >
                    <option value="">Select issue category...</option>
                    <option value="Payments & Payouts">Payments & Payouts</option>
                    <option value="Guards">Guards</option>
                    <option value="Bookings">Bookings</option>
                    <option value="Properties">Properties</option>
                    <option value="Account & Security">Account & Security</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Property
                  </label>
                  <select
                    value={miniProperty}
                    onChange={(e) => setMiniProperty(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white font-medium text-slate-800 focus:outline-none focus:border-[#064E3B]"
                  >
                    <option value="">Related Property (Optional)</option>
                    {MOCK_OWNER_PROPERTIES.map((p) => (
                      <option key={p.id} value={p.title}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                >
                  Create Support Request
                </button>

                <p className="text-[10px] text-slate-400 text-center">
                  The full request form opens after selecting Create Support Request.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL: CREATE SUPPORT REQUEST                                        */}
      {/* ==================================================================== */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                  <Plus className="size-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-900">
                    Open Support Request
                  </h3>
                  <p className="text-xs text-slate-500">
                    Our team typically responds in under 18 minutes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTicketModalOpen(false)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Issue Category *
                  </label>
                  <select
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white font-medium text-slate-800 focus:outline-none focus:border-[#064E3B]"
                  >
                    <option value="Payments & Payouts">Payments & Payouts</option>
                    <option value="Guards">Guards</option>
                    <option value="Bookings">Bookings</option>
                    <option value="Properties">Properties</option>
                    <option value="Account & Security">Account & Security</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Related Property
                  </label>
                  <select
                    value={modalProperty}
                    onChange={(e) => setModalProperty(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white font-medium text-slate-800 focus:outline-none focus:border-[#064E3B]"
                  >
                    {MOCK_OWNER_PROPERTIES.map((p) => (
                      <option key={p.id} value={p.title}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={modalSubject}
                  onChange={(e) => setModalSubject(e.target.value)}
                  placeholder="e.g. Bank payout verification pending"
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description / Context
                </label>
                <textarea
                  rows={4}
                  value={modalDetails}
                  onChange={(e) => setModalDetails(e.target.value)}
                  placeholder="Provide all relevant details, including booking IDs or guard names..."
                  className="w-full p-3 rounded-lg border border-[#E5E7EB] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-semibold shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: VIEW TICKET DETAILS                                           */}
      {/* ==================================================================== */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-heading text-slate-900">
                    {selectedTicket.ticketCode}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {selectedTicket.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{selectedTicket.category}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-slate-900">{selectedTicket.subject}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Updated: {selectedTicket.updatedTime}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                <p className="text-slate-700 leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.propertyTitle && (
                <div className="text-[11px] text-slate-500">
                  <strong>Property:</strong> {selectedTicket.propertyTitle}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#064E3B]/90 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: DIRECT CONTACT SUPPORT                                        */}
      {/* ==================================================================== */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold font-heading text-slate-900">
                Direct Support Line
              </h3>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                <strong className="text-emerald-900">Hotline (Priority Host Desk):</strong>
                <p className="text-slate-700 font-medium">+880 9612-PARK-BD</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <strong className="text-slate-900">Email:</strong>
                <p className="text-slate-700 font-medium">hosts@parkease.com.bd</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#064E3B]/90 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
