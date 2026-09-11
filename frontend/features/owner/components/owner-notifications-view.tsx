"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Receipt,
  Wallet,
  Shield,
  Star,
  Check,
  Search,
  ChevronDown,
  Trash2,
  CheckCheck,
  SlidersHorizontal,
  Bell,
  Clock,
  Sparkles,
  ExternalLink,
  MapPin,
  AlertCircle,
  X,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import {
  MOCK_OWNER_NOTIFICATIONS,
  OwnerNotificationItem,
} from "@/lib/data/mock-owner-data";

export function OwnerNotificationsView() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<OwnerNotificationItem[]>(
    MOCK_OWNER_NOTIFICATIONS
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Notification Preferences Toggles
  const [preferences, setPreferences] = useState({
    bookingAlerts: true,
    paymentAlerts: true,
    reviewAlerts: true,
    guardActivity: true,
    managerActivity: true,
    systemAlerts: true,
  });

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Metrics
  const unreadCount = notifications.filter((n) => n.isUnread).length;
  const bookingAlertsCount = notifications.filter((n) => n.type === "booking").length;
  const paymentAlertsCount = notifications.filter(
    (n) => n.type === "payment" || n.type === "payout"
  ).length;
  const systemAlertsCount = notifications.filter(
    (n) => n.type === "guard" || n.type === "system" || n.type === "review"
  ).length;

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.meta.toLowerCase().includes(q);

        let matchesType = true;
        if (typeFilter !== "ALL") {
          matchesType = n.type.toLowerCase() === typeFilter.toLowerCase();
        }

        let matchesStatus = true;
        if (statusFilter === "UNREAD") matchesStatus = n.isUnread;
        if (statusFilter === "READ") matchesStatus = !n.isUnread;

        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "OLDEST") return a.id.localeCompare(b.id);
        return b.id.localeCompare(a.id); // default newest
      });
  }, [notifications, searchQuery, typeFilter, statusFilter, sortBy]);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
    setToastMsg("All notifications marked as read.");
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleClearRead = () => {
    setNotifications((prev) => prev.filter((n) => n.isUnread));
    setToastMsg("Read notifications cleared from feed.");
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAction = (notif: OwnerNotificationItem) => {
    // Mark this notification as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isUnread: false } : n))
    );

    if (notif.actionType === "view_booking") {
      router.push("/owner/bookings");
    } else if (notif.actionType === "view_earnings" || notif.actionType === "request_payout") {
      router.push("/owner/earnings");
    } else if (notif.actionType === "view_review") {
      router.push("/owner/reviews");
    }
  };

  return (
    <div className="flex flex-col min-h-full relative bg-[#f9f9ff]">
      {/* Top Header */}
      <OwnerHeader
        title="Notifications"
        badge={
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {unreadCount} Unread
          </span>
        }
        subtitle="Stay updated on bookings, payments, listings, guards, reviews, and account activity."
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
              {/* Card 1: Unread */}
              <div className="bg-white rounded-xl border border-emerald-200 p-4.5 shadow-2xs flex items-start justify-between bg-gradient-to-br from-white to-emerald-50/25">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 font-heading block">
                    Unread
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#064E3B] font-heading tracking-tight mt-1">
                    {unreadCount}
                  </div>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    Action required
                  </p>
                </div>
                <div className="size-10 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 border border-emerald-100">
                  <Bell className="size-5" />
                </div>
              </div>

              {/* Card 2: Booking Alerts */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-heading block">
                    Booking Alerts
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-1">
                    {bookingAlertsCount}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Active bookings
                  </p>
                </div>
                <div className="size-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100">
                  <Calendar className="size-5" />
                </div>
              </div>

              {/* Card 3: Payment Alerts */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-heading block">
                    Payment Alerts
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-1">
                    {paymentAlertsCount}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Settlement ready
                  </p>
                </div>
                <div className="size-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
                  <Receipt className="size-5" />
                </div>
              </div>

              {/* Card 4: System & Other */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-heading block">
                    System & Other
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-1">
                    {systemAlertsCount}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Security notice
                  </p>
                </div>
                <div className="size-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                  <Shield className="size-5" />
                </div>
              </div>
            </div>

            {/* 2. FILTER BAR */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notifications..."
                    className="w-full h-9.5 pl-9.5 pr-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition"
                  />
                </div>

                {/* Type Filter */}
                <div className="relative">
                  <select
                    aria-label="Filter by notification type"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-9.5 pl-3 pr-7 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition appearance-none cursor-pointer"
                  >
                    <option value="ALL">All Types</option>
                    <option value="booking">Booking</option>
                    <option value="payment">Payment</option>
                    <option value="payout">Payout</option>
                    <option value="guard">Guard</option>
                    <option value="review">Review</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    aria-label="Filter by read status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-9.5 pl-3 pr-7 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition appearance-none cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="UNREAD">Unread</option>
                    <option value="READ">Read</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
                </div>

                {/* Sort Filter */}
                <div className="relative">
                  <select
                    aria-label="Sort order"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-9.5 pl-3 pr-7 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition appearance-none cursor-pointer"
                  >
                    <option value="NEWEST">Newest First</option>
                    <option value="OLDEST">Oldest First</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Action Links */}
              <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[#064E3B] hover:text-[#064E3B]/80 flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="size-3.5" />
                  <span>Mark All as Read</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearRead}
                  className="text-slate-500 hover:text-rose-600 transition cursor-pointer"
                >
                  Clear Read
                </button>
              </div>
            </div>

            {/* 3. NOTIFICATION FEED LIST */}
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 text-center text-slate-500 text-xs">
                  No notifications match your current filter settings.
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const isUnread = notif.isUnread;

                  // Icon styling based on type
                  let iconBg = "bg-slate-100 text-slate-700";
                  let IconComponent = Bell;

                  if (notif.type === "booking" && notif.title.includes("Received")) {
                    iconBg = "bg-emerald-100 text-[#064E3B]";
                    IconComponent = Calendar;
                  } else if (notif.type === "booking" && notif.title.includes("Confirmed")) {
                    iconBg = "bg-emerald-100 text-[#064E3B]";
                    IconComponent = CheckCircle2;
                  } else if (notif.type === "payment") {
                    iconBg = "bg-teal-100 text-teal-800";
                    IconComponent = Receipt;
                  } else if (notif.type === "payout") {
                    iconBg = "bg-emerald-100 text-[#064E3B]";
                    IconComponent = Wallet;
                  } else if (notif.type === "guard") {
                    iconBg = "bg-slate-100 text-slate-700";
                    IconComponent = Shield;
                  } else if (notif.type === "review") {
                    iconBg = "bg-amber-100 text-amber-800";
                    IconComponent = Star;
                  }

                  return (
                    <div
                      key={notif.id}
                      className={`bg-white rounded-xl border ${
                        isUnread ? "border-emerald-200" : "border-[#E5E7EB]"
                      } p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-4 transition-all hover:shadow-xs`}
                    >
                      {/* Left: Indicator, Icon & Description */}
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                        {/* Green unread dot */}
                        <div className="w-2.5 flex items-center justify-center pt-2">
                          {isUnread && (
                            <span className="size-2 rounded-full bg-emerald-600 ring-2 ring-emerald-100" />
                          )}
                        </div>

                        {/* Icon Container */}
                        <div
                          className={`size-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
                        >
                          <IconComponent className="size-5" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-heading">
                              {notif.title}
                            </h3>
                            <span className="text-[11px] text-slate-400">
                              • {notif.timeAgo}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-700 font-normal leading-relaxed">
                            {notif.description}
                          </p>

                          <p className="text-[11px] text-slate-500 font-medium">
                            {notif.meta}
                          </p>
                        </div>
                      </div>

                      {/* Right Action Button */}
                      <div className="shrink-0">
                        {notif.actionType === "view_earnings" ? (
                          <button
                            type="button"
                            onClick={() => handleAction(notif)}
                            className="px-4 py-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
                          >
                            {notif.actionLabel}
                          </button>
                        ) : notif.actionType === "view_booking" && !isUnread ? (
                          <button
                            type="button"
                            onClick={() => handleAction(notif)}
                            className="px-4 py-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
                          >
                            {notif.actionLabel}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAction(notif)}
                            className="px-4 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-semibold shadow-2xs transition cursor-pointer active:scale-[0.99]"
                          >
                            {notif.actionLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ================================================================== */}
          {/* RIGHT 1/3 SIDEBAR (4 COLS)                                         */}
          {/* ================================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. NOTIFICATION PREFERENCES */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Notification Preferences
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control what you see in this feed.
                </p>
              </div>

              {/* Toggles list */}
              <div className="space-y-3.5 text-xs">
                {[
                  { key: "bookingAlerts", label: "Booking alerts" },
                  { key: "paymentAlerts", label: "Payment alerts" },
                  { key: "reviewAlerts", label: "Review alerts" },
                  { key: "guardActivity", label: "Guard activity" },
                  { key: "managerActivity", label: "Manager activity" },
                  { key: "systemAlerts", label: "System alerts" },
                ].map(({ key, label }) => {
                  const isChecked = preferences[key as keyof typeof preferences];
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{label}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isChecked}
                        onClick={() => togglePreference(key as keyof typeof preferences)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isChecked ? "bg-[#064E3B]" : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            isChecked ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => alert("Notification settings saved to your Owner profile.")}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  Manage Preferences
                </button>
              </div>
            </div>

            {/* 2. FEED HEALTH & SYNC */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Feed Health & Sync
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-600" />
                  Live
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Delivery Channel</span>
                  <span className="font-semibold text-slate-900">In-App & SMS</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Last Push Event</span>
                  <span className="font-semibold text-slate-900">10 mins ago</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Retention Period</span>
                  <span className="font-semibold text-slate-900">30 Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
