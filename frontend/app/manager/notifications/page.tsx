"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  Calendar,
  Car,
  Mail,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UserCheck,
} from "lucide-react";
import { ManagerHeader } from "@/components/manager/manager-header";
import { Button } from "@/components/ui/button";
import { managerApi } from "@/lib/api/manager-api";
import { notificationsApi } from "@/lib/api/notifications-api";
import type { NotificationDto } from "@/lib/api/marketplace-types";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} mins ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  } catch {
    return isoString;
  }
}

export default function ManagerNotificationsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const delegationsQuery = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const activeDelegations = useMemo(
    () => delegationsQuery.data?.filter((d) => d.status === "ACTIVE") ?? [],
    [delegationsQuery.data]
  );
  const primaryOwner = activeDelegations[0]?.provider?.fullName || "Property Owner";

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications.all(),
    queryFn: notificationsApi.list,
  });

  const rawNotifications = useMemo(() => notificationsQuery.data ?? [], [notificationsQuery.data]);

  // Mutations
  const readMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.read(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.root });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: () => notificationsApi.readAll(),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.root });
    },
    onError: () => {
      toast.error("Failed to mark all as read");
    },
  });

  // Filtered notifications
  const filtered = useMemo(() => {
    return rawNotifications.filter((n) => {
      const matchSearch =
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase());

      let matchType = true;
      if (typeFilter !== "ALL") {
        matchType = n.type.toUpperCase().includes(typeFilter.toUpperCase());
      }

      let matchStatus = true;
      if (statusFilter === "Unread") {
        matchStatus = !n.readAt;
      } else if (statusFilter === "Read") {
        matchStatus = Boolean(n.readAt);
      }

      return matchSearch && matchType && matchStatus;
    });
  }, [rawNotifications, searchTerm, typeFilter, statusFilter]);

  // Real KPI metrics
  const metrics = useMemo(() => {
    const unread = rawNotifications.filter((n) => !n.readAt).length;
    const bookingAlerts = rawNotifications.filter((n) => n.type.toUpperCase().includes("BOOKING")).length;
    const guardActivity = rawNotifications.filter((n) => n.type.toUpperCase().includes("GUARD")).length;
    const reviewAlerts = rawNotifications.filter((n) => n.type.toUpperCase().includes("REVIEW")).length;
    const systemAlerts = rawNotifications.filter((n) => n.type.toUpperCase().includes("SYSTEM") || n.type.toUpperCase().includes("DELEGATION")).length;

    return { unread, bookingAlerts, guardActivity, reviewAlerts, systemAlerts };
  }, [rawNotifications]);

  const getActionForNotification = (n: NotificationDto): { label: string; href: string } => {
    const typeUpper = n.type.toUpperCase();
    if (typeUpper.includes("BOOKING") || typeUpper.includes("HOLD")) {
      return { label: "View Booking", href: "/manager/bookings" };
    }
    if (typeUpper.includes("REVIEW")) {
      return { label: "View Review", href: "/manager/reviews" };
    }
    if (typeUpper.includes("GUARD")) {
      return { label: "View Guards", href: "/manager/guards" };
    }
    if (typeUpper.includes("SESSION") || typeUpper.includes("CHECKIN")) {
      return { label: "View Session", href: "/manager/active-sessions" };
    }
    return { label: "View Properties", href: "/manager/properties" };
  };

  const getIconForNotification = (type: string) => {
    const typeUpper = type.toUpperCase();
    if (typeUpper.includes("BOOKING")) return <Calendar className="size-4 text-blue-600" />;
    if (typeUpper.includes("GUARD")) return <UserCheck className="size-4 text-purple-600" />;
    if (typeUpper.includes("REVIEW")) return <Star className="size-4 text-amber-500 fill-amber-500" />;
    if (typeUpper.includes("SESSION") || typeUpper.includes("CAR")) return <Car className="size-4 text-emerald-600" />;
    return <Settings className="size-4 text-slate-500" />;
  };

  return (
    <div className="flex flex-col min-h-full">
      <ManagerHeader
        title="Notifications"
        subtitle="Stay updated on assigned property operations, bookings, guards, reviews, and system activity."
        badge="MANAGER VIEW"
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Delegated Scope Banner */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4.5 text-[#064E3B] shrink-0" />
            <span className="font-medium">
              Notifications shown here are limited to properties and operational areas delegated by the Property Owner.
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
                UNREAD
              </span>
              <Mail className="size-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{metrics.unread}</div>
            <p className="mt-1 text-[11px] text-emerald-700 font-medium">Pending acknowledgment</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                BOOKING ALERTS
              </span>
              <Calendar className="size-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{metrics.bookingAlerts}</div>
            <p className="mt-1 text-[11px] text-slate-400">Reservation lifecycle</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                GUARD ACTIVITY
              </span>
              <ShieldCheck className="size-4 text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{metrics.guardActivity}</div>
            <p className="mt-1 text-[11px] text-slate-400">Gate security shifts</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                REVIEW ALERTS
              </span>
              <Star className="size-4 text-amber-500 fill-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{metrics.reviewAlerts}</div>
            <p className="mt-1 text-[11px] text-slate-400">Customer feedback</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                SYSTEM ALERTS
              </span>
              <Settings className="size-4 text-slate-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{metrics.systemAlerts}</div>
            <p className="mt-1 text-[11px] text-slate-400">Governance &amp; scopes</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#064E3B] focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Categories</option>
              <option value="BOOKING">Booking</option>
              <option value="GUARD">Guard Activity</option>
              <option value="REVIEW">Review</option>
              <option value="SYSTEM">System</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="Unread">Unread</option>
              <option value="Read">Read</option>
            </select>

            <Button
              size="sm"
              disabled={readAllMutation.isPending || metrics.unread === 0}
              onClick={() => readAllMutation.mutate()}
              className="h-8 text-xs font-semibold bg-[#064E3B] text-white hover:bg-emerald-900"
            >
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Two-Column Grid: Notification Feed (8 cols) vs Sidebar (4 cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Feed (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Notification Feed
                  </h2>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                    Live Database Feed
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Showing {filtered.length} of {rawNotifications.length} notifications
                </span>
              </div>

              {notificationsQuery.isLoading && (
                <div className="py-12 text-center text-xs text-slate-500">
                  Loading notification events...
                </div>
              )}

              {!notificationsQuery.isLoading && filtered.length === 0 && (
                <div className="py-12 text-center space-y-3">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                    <Bell className="size-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No Notifications</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchTerm
                      ? `No notifications matched your search "${searchTerm}".`
                      : "You are all caught up! New operational events and reservation updates will be displayed here in real time."}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {filtered.map((n) => {
                  const isUnread = !n.readAt;
                  const action = getActionForNotification(n);

                  return (
                    <div
                      key={n.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 transition ${
                        isUnread
                          ? "border-emerald-200 bg-emerald-50/20"
                          : "border-slate-100 bg-slate-50/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
                          {getIconForNotification(n.type)}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-xs">
                              {n.title}
                            </h3>
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-700">
                              {n.type}
                            </span>
                            {isUnread && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                <span className="size-1.5 rounded-full bg-emerald-600" />
                                Unread
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            {n.message}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span className="text-[11px] text-slate-400">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => readMutation.mutate(n.id)}
                            className="text-[11px] text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                        <Link href={action.href}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            {action.label}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Notification Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Notification Summary
                </h3>
                <span className="text-xs text-slate-400">Live Status</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-2">
                  <span className="text-base font-extrabold text-emerald-800 block">{metrics.unread}</span>
                  <span className="text-[9px] font-bold uppercase text-emerald-700">UNREAD</span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2">
                  <span className="text-base font-extrabold text-slate-800 block">
                    {rawNotifications.length - metrics.unread}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-slate-500">ACKNOWLEDGED</span>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-2">
                  <span className="text-base font-extrabold text-blue-800 block">{rawNotifications.length}</span>
                  <span className="text-[9px] font-bold uppercase text-blue-700">TOTAL</span>
                </div>
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                Operational Modules
              </h3>
              <Link href="/manager/bookings" className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800">
                <span>Bookings Manifest</span>
                <ArrowRight className="size-3.5 text-slate-400" />
              </Link>
              <Link href="/manager/active-sessions" className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800">
                <span>On-Site Active Sessions</span>
                <ArrowRight className="size-3.5 text-slate-400" />
              </Link>
              <Link href="/manager/guards" className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800">
                <span>Security Guards</span>
                <ArrowRight className="size-3.5 text-slate-400" />
              </Link>
              <Link href="/manager/reviews" className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800">
                <span>Customer Reviews</span>
                <ArrowRight className="size-3.5 text-slate-400" />
              </Link>
            </div>

            {/* Manager Notification Scope Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <h3 className="text-xs font-bold text-slate-900">
                  Manager Notification Scope
                </h3>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  Delegated
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                    GRANTED OPERATIONAL:
                  </span>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 border border-emerald-200">
                      Assigned Properties
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 border border-emerald-200">
                      Bookings
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 border border-emerald-200">
                      Guards
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 border border-emerald-200">
                      Active Sessions
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block mb-1">
                    RESTRICTED (OWNER GOVERNED):
                  </span>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className="rounded bg-red-50 px-2 py-0.5 text-red-700 border border-red-200">
                      Owner Payouts &amp; Banking
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
