"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Loader2,
  CheckCircle2,
  Lock,
  Save,
  ShieldCheck,
} from "lucide-react";
import { ManagerHeader } from "@/components/manager/manager-header";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LogoutButton } from "@/components/auth/logout-button";
import { managerApi } from "@/lib/api/manager-api";
import { authApi } from "@/lib/api/auth-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "M";
}

export default function ManagerProfilePage() {
  const currentUser = useCurrentUser();
  const user = currentUser.data;
  const queryClient = useQueryClient();

  const delegationsQuery = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const activeDelegations = delegationsQuery.data?.filter((d) => d.status === "ACTIVE") ?? [];
  const primaryOwner = activeDelegations[0]?.provider?.fullName || "Property Owner";

  const [customFullName, setFullName] = useState<string | null>(null);

  const fullName = customFullName ?? user?.fullName ?? "";
  const email = user?.email ?? "";
  const phone = user?.phone ?? "";

  const saveProfile = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: ({ user: saved }) => {
      queryClient.setQueryData(queryKeys.auth.me, { ...user, fullName: saved.fullName });
      setFullName(null);
      toast.success("Personal information saved");
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile.mutate({ fullName: fullName.trim() });
  };

  const initials = getInitials(fullName || user?.fullName || "Manager");

  if (currentUser.isPending || delegationsQuery.isPending) {
    return <div role="status" className="p-8 text-center"><Loader2 className="mx-auto size-5 animate-spin" aria-hidden="true" /><p className="mt-2">Loading account...</p></div>;
  }
  if (currentUser.isError || delegationsQuery.isError) {
    return <div role="alert" className="p-8 text-center"><p>{getApiErrorMessage(currentUser.error ?? delegationsQuery.error)}</p><Button variant="outline" className="mt-4" onClick={() => { void currentUser.refetch(); void delegationsQuery.refetch(); }}>Try again</Button></div>;
  }

  return (
    <div className="flex flex-col min-h-full">
      <ManagerHeader
        title="Profile"
        subtitle="Manage your account information and view your assigned access."
        badge="Manager View"
        breadcrumbs={[{ label: "Profile & Account" }]}
        rightExtra={
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
            Active Operator
          </span>
        }
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Delegated Manager Account Banner */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4.5 text-[#064E3B] shrink-0" />
            <span className="font-medium">
              <strong>Delegated Manager Account:</strong> Assigned operational access granted by Property Owner {primaryOwner}.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              RBAC Verified
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              ID: {user?.id?.slice(0, 8) || "MGR"}
            </span>
          </div>
        </div>

        {/* Two-Column Grid: Profile & Access (8 cols) vs Account Specs & Settings (4 cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Personal Information Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
              {/* Header with Avatar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#064E3B] font-bold text-xl text-white shadow-sm">
                    {initials}
                    <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white text-xs">
                      ✓
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">
                        {fullName || user?.fullName || "Property Manager"}
                      </h2>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                        {user?.roles?.join(", ") || "MANAGER"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {email || user?.email} · Operational Access Verified
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium mt-1">
                      <span className="size-1.5 rounded-full bg-emerald-600" />
                      <span>Authenticated Session Active</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Form */}
              <form onSubmit={handleSaveInfo} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    PERSONAL INFORMATION
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Basic contact details
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="manager-full-name" className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="manager-full-name"
                      required
                      minLength={2}
                      maxLength={120}
                      autoComplete="name"
                      disabled={saveProfile.isPending}
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); saveProfile.reset(); }}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#064E3B] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Assigned Role
                      </label>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Lock className="size-2.5" /> Read-only
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                      <span>Property Manager</span>
                      <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                        RBAC Enforced
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="manager-email" className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="manager-email"
                      value={email}
                      disabled
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 focus:outline-hidden cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="manager-phone" className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="manager-phone"
                      value={phone}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#064E3B] focus:outline-hidden"
                    />
                  </div>
                </div>

                {saveProfile.isError && <p role="alert" className="text-sm text-red-700">{getApiErrorMessage(saveProfile.error)}</p>}

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={saveProfile.isPending || fullName.trim().length < 2 || fullName.trim() === user?.fullName}
                    className="bg-[#064E3B] text-white hover:bg-emerald-900 text-xs font-semibold gap-1.5 h-9 px-4"
                  >
                    {saveProfile.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    {saveProfile.isPending ? "Saving..." : "Save Personal Information"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Assigned Access Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Assigned Access
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Properties delegated to your operations profile
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                  {activeDelegations.length} Active {activeDelegations.length === 1 ? "Property" : "Properties"}
                </span>
              </div>

              {activeDelegations.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No active property delegations found.</p>
              ) : (
                <div className="space-y-3">
                  {activeDelegations.map((del) => {
                    const propName = del.property?.name || del.property.id;
                    const address = del.property?.approximateAddress || del.property?.publicArea || "Dhaka";
                    const permsCount = del.permissions?.length || 0;

                    return (
                      <div
                        key={del.id}
                        className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B]">
                            <Building2 className="size-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm">
                                {propName}
                              </h4>
                              <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                                {del.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {address}
                            </p>
                            <p className="text-[11px] text-emerald-800 font-medium mt-1">
                              ✓ {permsCount} permissions enabled ({del.permissions?.slice(0, 3).join(", ")}{permsCount > 3 ? "..." : ""})
                            </p>
                          </div>
                        </div>

                        <Link href={`/manager/properties/${del.property.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
                            View Access
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Property assignments and permissions are governed by the Property Owner.</span>
                <Link
                  href="/manager/properties"
                  className="font-bold text-[#064E3B] hover:text-emerald-950 flex items-center gap-1"
                >
                  View All Assigned Properties <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Account Security Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="size-4 text-[#064E3B]" />
                  Account Security
                </h3>
                <span className="text-xs text-slate-400 font-mono">RBAC Status: ENFORCED</span>
              </div>

              <div className="space-y-3 divide-y divide-slate-100 text-xs">
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="font-bold text-slate-900 block">Password</span>
                    <span className="text-slate-500">Managed via secure hashed credentials</span>
                  </div>
                  <Link href="/manager/account/security" className="inline-flex h-8 items-center rounded-md border border-slate-200 px-3 text-xs font-semibold hover:bg-slate-50">
                    Change Password
                  </Link>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Security Scope</span>
                      <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                        Operational Delegate
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px]">
                      Payouts and financial settlements restricted from manager credentials
                    </span>
                  </div>
                </div>
              </div>
              <Link href="/manager/account/sessions" className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800">Review active sessions <ArrowRight className="size-3.5" /></Link>
            </div>
          </div>

          {/* Right Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Account Information */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2.5">
                ACCOUNT INFORMATION
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Role</span>
                  <span className="font-bold text-slate-900">{user?.roles?.join(", ") || "MANAGER"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Account Status</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <span className="size-1.5 rounded-full bg-emerald-600" />
                    {user?.status || "ACTIVE"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account ID</span>
                  <span className="font-mono text-slate-800 font-semibold text-[11px] truncate max-w-[160px]">
                    {user?.id || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Status</span>
                  <span className="font-medium text-slate-800">Verified Operator</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Principal Owner</span>
                  <span className="font-medium text-slate-800 text-right">
                    {primaryOwner} <span className="block text-[10px] text-slate-400">Property Owner</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Platform Support Links */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2.5 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                PLATFORM SUPPORT
              </h3>
              <Link href="/manager/support" className="flex items-center justify-between text-slate-600 hover:text-slate-900 py-1">
                <span>Help &amp; Support</span> <ArrowRight className="size-3 text-slate-400" />
              </Link>
              <Link href="/privacy" className="flex items-center justify-between text-slate-600 hover:text-slate-900 py-1">
                <span>Privacy Policy</span> <ArrowRight className="size-3 text-slate-400" />
              </Link>
              <Link href="/terms" className="flex items-center justify-between text-slate-600 hover:text-slate-900 py-1">
                <span>Terms of Service</span> <ArrowRight className="size-3 text-slate-400" />
              </Link>
            </div>

            {/* Session Actions & Sign Out */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Session Actions</span>
                <LogoutButton
                  className="h-8 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 gap-1.5"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                To deactivate or transfer this manager profile, coordinate with Property Owner {primaryOwner} or ParkEase Operations Support.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 shadow-2xs">
          <span>Your access is limited to properties and permissions assigned by the Property Owner.</span>
          <span className="font-semibold text-slate-700">RBAC Enforcement Active</span>
        </div>
      </div>
    </div>
  );
}
