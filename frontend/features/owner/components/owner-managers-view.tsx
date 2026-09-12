"use client";

import React, { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Users,
  Plus,
  Search,
  Building2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  MoreVertical,
  KeyRound,
  Mail,
  Phone,
  ArrowRight,
  Coins,
  FileText,
  CalendarCheck,
  MessageSquareQuote,
  Check,
  RefreshCw,
  UserX,
  Info,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import { Switch } from "@/components/ui/switch";
import {
  MOCK_OWNER_PROPERTIES,
  MOCK_OWNER_MANAGERS,
  OwnerManager,
  OwnerProperty,
} from "@/lib/data/mock-owner-data";

// ----------------------------------------------------------------------
// ZOD VALIDATION SCHEMA
// ----------------------------------------------------------------------

const addManagerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters"),
    phone: z
      .string()
      .trim()
      .regex(
        /^(?:\+8801|01)[3-9]\d{8}$/,
        "Please enter a valid Bangladeshi phone number (e.g. 01712345678 or +8801712345678)"
      ),
    email: z
      .string()
      .trim()
      .email("Please enter a valid email address"),
    propertyIds: z
      .array(z.string())
      .min(1, "Please select at least one property to assign to this manager"),
    // Operational Permissions
    canManageListings: z.boolean(),
    canManageBookings: z.boolean(),
    canManageGuards: z.boolean(),
    canRespondReviews: z.boolean(),
    // Financial Access (Strict Isolation)
    canAccessFinancials: z.boolean(),
    // Temporary Credentials
    tempPassword: z
      .string()
      .min(8, "Temporary password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm the initial password"),
  })
  .refine((data) => data.tempPassword === data.confirmPassword, {
    message: "Initial passwords do not match",
    path: ["confirmPassword"],
  });

type AddManagerFormValues = z.infer<typeof addManagerSchema>;

// ----------------------------------------------------------------------
// COMPONENT: OWNER MANAGERS VIEW
// ----------------------------------------------------------------------

export function OwnerManagersView() {
  const [managers, setManagers] = useState<OwnerManager[]>(MOCK_OWNER_MANAGERS);
  const [properties, setProperties] = useState<OwnerProperty[]>(MOCK_OWNER_PROPERTIES);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [accessFilter, setAccessFilter] = useState<string>("ALL");

  // Modal / Slide-over State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<OwnerManager | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Form handling
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddManagerFormValues>({
    resolver: zodResolver(addManagerSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      propertyIds: [],
      canManageListings: true,
      canManageBookings: true,
      canManageGuards: true,
      canRespondReviews: true,
      canAccessFinancials: false,
      tempPassword: "",
      confirmPassword: "",
    },
  });

  const watchedPropertyIds = watch("propertyIds") || [];
  const watchedCanAccessFinancials = watch("canAccessFinancials");

  // Metrics Calculations
  const totalManagers = managers.length;
  const operationalOnlyCount = managers.filter(
    (m) => !m.permissions.canAccessFinancials && m.status === "ACTIVE"
  ).length;
  const financialAccessCount = managers.filter(
    (m) => m.permissions.canAccessFinancials
  ).length;
  const pendingCount = managers.filter(
    (m) => m.status === "PENDING_ACTIVATION"
  ).length;

  // Filtered List
  const filteredManagers = useMemo(() => {
    return managers.filter((manager) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        manager.name.toLowerCase().includes(q) ||
        manager.email.toLowerCase().includes(q) ||
        manager.phone.toLowerCase().includes(q) ||
        manager.assignedPropertyTitles.some((title) =>
          title.toLowerCase().includes(q)
        );

      let matchesStatus = true;
      if (statusFilter !== "ALL") {
        matchesStatus = manager.status === statusFilter;
      }

      let matchesAccess = true;
      if (accessFilter === "FINANCIAL") {
        matchesAccess = manager.permissions.canAccessFinancials;
      } else if (accessFilter === "OPERATIONAL") {
        matchesAccess = !manager.permissions.canAccessFinancials;
      }

      return matchesSearch && matchesStatus && matchesAccess;
    });
  }, [managers, searchQuery, statusFilter, accessFilter]);

  // Open Modal for New Manager
  const handleOpenAddModal = () => {
    setEditingManager(null);
    reset({
      fullName: "",
      phone: "",
      email: "",
      propertyIds: [],
      canManageListings: true,
      canManageBookings: true,
      canManageGuards: true,
      canRespondReviews: true,
      canAccessFinancials: false,
      tempPassword: "",
      confirmPassword: "",
    });
    setIsModalOpen(true);
  };

  // Open Modal to Edit Existing Manager
  const handleOpenEditModal = (manager: OwnerManager) => {
    setEditingManager(manager);
    reset({
      fullName: manager.name,
      phone: manager.phone,
      email: manager.email,
      propertyIds: manager.assignedPropertyIds,
      canManageListings: manager.permissions.canManageListings,
      canManageBookings: manager.permissions.canManageBookings,
      canManageGuards: manager.permissions.canManageGuards,
      canRespondReviews: manager.permissions.canRespondReviews,
      canAccessFinancials: manager.permissions.canAccessFinancials,
      tempPassword: "ExistingSecuredPassword123!",
      confirmPassword: "ExistingSecuredPassword123!",
    });
    setIsModalOpen(true);
  };

  // Form Submit Handler
  const onSubmit = (data: AddManagerFormValues) => {
    const assignedTitles = properties
      .filter((p) => data.propertyIds.includes(p.id))
      .map((p) => p.title);

    if (editingManager) {
      // Update existing manager
      setManagers((prev) =>
        prev.map((m) =>
          m.id === editingManager.id
            ? {
                ...m,
                name: data.fullName,
                phone: data.phone,
                email: data.email,
                assignedPropertyIds: data.propertyIds,
                assignedPropertyTitles: assignedTitles,
                permissions: {
                  canManageListings: data.canManageListings,
                  canManageBookings: data.canManageBookings,
                  canManageGuards: data.canManageGuards,
                  canRespondReviews: data.canRespondReviews,
                  canAccessFinancials: data.canAccessFinancials,
                },
              }
            : // Enforce: If property was stolen from another manager, update their list
              {
                ...m,
                assignedPropertyIds: m.assignedPropertyIds.filter(
                  (pid) => !data.propertyIds.includes(pid)
                ),
                assignedPropertyTitles: m.assignedPropertyTitles.filter(
                  (title) => !assignedTitles.includes(title)
                ),
              }
        )
      );

      // Update property records
      setProperties((prev) =>
        prev.map((prop) =>
          data.propertyIds.includes(prop.id)
            ? { ...prop, managerName: data.fullName }
            : prop.managerName === editingManager.name
            ? { ...prop, managerName: undefined }
            : prop
        )
      );

      setNotificationMsg(`Updated delegation permissions for ${data.fullName}`);
    } else {
      // Create new manager
      const newManager: OwnerManager = {
        id: `mgr-${Date.now()}`,
        name: data.fullName,
        initials: data.fullName
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
        phone: data.phone,
        email: data.email,
        assignedPropertyIds: data.propertyIds,
        assignedPropertyTitles: assignedTitles,
        permissions: {
          canManageListings: data.canManageListings,
          canManageBookings: data.canManageBookings,
          canManageGuards: data.canManageGuards,
          canRespondReviews: data.canRespondReviews,
          canAccessFinancials: data.canAccessFinancials,
        },
        status: "PENDING_ACTIVATION",
        joinedDate: "Just now",
        lastActive: "Never",
        notes: "Account created. Temporary password dispatched via SMS & Email.",
      };

      // Strict enforcement: Remove assigned properties from any existing manager
      setManagers((prev) => [
        newManager,
        ...prev.map((m) => ({
          ...m,
          assignedPropertyIds: m.assignedPropertyIds.filter(
            (pid) => !data.propertyIds.includes(pid)
          ),
          assignedPropertyTitles: m.assignedPropertyTitles.filter(
            (title) => !assignedTitles.includes(title)
          ),
        })),
      ]);

      // Update property records with the new manager
      setProperties((prev) =>
        prev.map((prop) =>
          data.propertyIds.includes(prop.id)
            ? { ...prop, managerName: data.fullName }
            : prop
        )
      );

      setNotificationMsg(
        `Manager ${data.fullName} created and assigned to ${data.propertyIds.length} property(s).`
      );
    }

    setIsModalOpen(false);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Revoke Manager Access
  const handleRevokeManager = (managerId: string, managerName: string) => {
    if (
      confirm(
        `Are you sure you want to revoke access for ${managerName}? They will immediately lose access to all managed properties.`
      )
    ) {
      setManagers((prev) => prev.filter((m) => m.id !== managerId));
      setProperties((prev) =>
        prev.map((prop) =>
          prop.managerName === managerName
            ? { ...prop, managerName: undefined }
            : prop
        )
      );
      setNotificationMsg(`Access revoked for manager ${managerName}.`);
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Resend Activation
  const handleResendActivation = (managerName: string) => {
    setNotificationMsg(
      `Activation link & temporary credentials resent to ${managerName}.`
    );
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Header */}
      <OwnerHeader
        title="Managers"
        subtitle="Delegate operations and control financial access across your properties."
        actions={
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#064E3B] text-white hover:bg-[#064E3B]/90 font-medium text-xs sm:text-sm shadow-xs transition cursor-pointer"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Add Manager</span>
          </button>
        }
      />

      <div className="px-4 sm:px-8 lg:px-10 space-y-6">
        {/* Toast / Notification Banner */}
        {notificationMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs sm:text-sm text-emerald-900 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{notificationMsg}</span>
            </div>
            <button
              onClick={() => setNotificationMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* 2. Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Managers */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Total Managers
              </span>
              <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                <Users className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
                {totalManagers}
              </span>
              <span className="text-xs text-slate-500">Appointed</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Active across {properties.length} portfolio listings
            </p>
          </div>

          {/* Card 2: Operational Only */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Operational Access Only
              </span>
              <div className="size-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
                {operationalOnlyCount}
              </span>
              <span className="text-xs text-blue-700 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
                Isolated
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Zero access to revenue or payouts
            </p>
          </div>

          {/* Card 3: Full Financial Access */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Full Access (Financial)
              </span>
              <div className="size-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Coins className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-heading text-amber-900">
                {financialAccessCount}
              </span>
              <span className="text-xs text-amber-800 font-medium bg-amber-100/70 px-1.5 py-0.5 rounded flex items-center gap-1">
                <AlertTriangle className="size-3" /> Privileged
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Authorized for property earnings
            </p>
          </div>

          {/* Card 4: Pending Activation */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Pending Activation
              </span>
              <div className="size-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Clock className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
                {pendingCount}
              </span>
              <span className="text-xs text-purple-700 font-medium bg-purple-50 px-1.5 py-0.5 rounded">
                Awaiting
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Initial password not set yet
            </p>
          </div>
        </div>

        {/* 3. Search, Filters & Action Bar */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by manager name, phone, email, or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E5E7EB] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:border-[#064E3B] transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="PENDING_ACTIVATION">Pending Activation</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            {/* Access Scope Filter */}
            <select
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:border-[#064E3B] transition"
            >
              <option value="ALL">All Access Scopes</option>
              <option value="OPERATIONAL">Operational Only</option>
              <option value="FINANCIAL">Financial Granted</option>
            </select>
          </div>
        </div>

        {/* 4. Managers Data Table */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
          {filteredManagers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="size-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <UserX className="size-6" />
              </div>
              <h3 className="font-heading font-bold text-slate-800 text-sm">
                No managers found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No property managers match your current filter parameters. Try
                broadening your search or add a new manager.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#064E3B] text-white text-xs font-medium hover:bg-[#064E3B]/90 transition"
              >
                <Plus className="size-3.5" />
                <span>Add Manager</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-[#E5E7EB] text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Manager Profile</th>
                    <th className="py-3.5 px-4">Assigned Properties</th>
                    <th className="py-3.5 px-4">Delegated Permissions</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-xs text-slate-700">
                  {filteredManagers.map((manager) => {
                    const hasFinancials = manager.permissions.canAccessFinancials;
                    return (
                      <tr
                        key={manager.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Manager Profile */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-emerald-50 text-[#064E3B] font-bold font-heading flex items-center justify-center border border-emerald-200/60 shadow-2xs shrink-0">
                              {manager.initials}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-sm font-heading flex items-center gap-2">
                                <span>{manager.name}</span>
                                {hasFinancials && (
                                  <span
                                    title="Financial Access Granted"
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1"
                                  >
                                    <Coins className="size-2.5" /> Fin Access
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Mail className="size-3 text-slate-400" />
                                  {manager.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="size-3 text-slate-400" />
                                  {manager.phone}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Assigned Properties */}
                        <td className="py-4 px-4 max-w-xs">
                          {manager.assignedPropertyTitles.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">
                              No properties assigned
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {manager.assignedPropertyTitles.map((title, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium text-[11px] border border-slate-200"
                                >
                                  <Building2 className="size-3 text-[#064E3B]" />
                                  <span className="truncate max-w-[140px]">
                                    {title}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Delegated Permissions */}
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {manager.permissions.canManageListings && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Listings
                              </span>
                            )}
                            {manager.permissions.canManageBookings && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                Bookings
                              </span>
                            )}
                            {manager.permissions.canManageGuards && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                Guards
                              </span>
                            )}
                            {manager.permissions.canRespondReviews && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                                Reviews
                              </span>
                            )}
                            {hasFinancials ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                <Coins className="size-2.5 text-amber-700" />
                                Financials
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                                No Finance
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {manager.status === "ACTIVE" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              Active
                            </span>
                          )}
                          {manager.status === "PENDING_ACTIVATION" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                              <Clock className="size-3 text-purple-600" />
                              Pending Invite
                            </span>
                          )}
                          {manager.status === "SUSPENDED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                              Suspended
                            </span>
                          )}
                          <div className="text-[10px] text-slate-400 mt-1">
                            Joined {manager.joinedDate}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(manager)}
                              className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-slate-700 font-medium text-xs transition cursor-pointer"
                            >
                              Edit Scope
                            </button>

                            {manager.status === "PENDING_ACTIVATION" ? (
                              <button
                                type="button"
                                onClick={() => handleResendActivation(manager.name)}
                                title="Resend credentials SMS / Email"
                                className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                              >
                                <RefreshCw className="size-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRevokeManager(manager.id, manager.name)
                                }
                                title="Revoke manager permissions"
                                className="p-1.5 rounded-lg border border-transparent hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              >
                                <UserX className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 5. Architectural Reminder Callout */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
          <Info className="size-4 text-[#064E3B] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-900 block">
              Architectural Delegation Rules:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600">
              <li>
                <strong>1 Property = Strictly 1 Manager:</strong> A listing
                cannot have multiple concurrent managers.
              </li>
              <li>
                <strong>1 Manager = Multi-Property Capacity:</strong> A single
                trusted manager can oversee multiple parking facilities.
              </li>
              <li>
                <strong>Financial Isolation:</strong> Payout destination bank
                accounts and root ownership properties are strictly reserved for
                the Property Owner.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. SLIDE-OVER / MODAL: ADD / EDIT MANAGER                           */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center border border-emerald-200/50">
                  <Users className="size-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900">
                    {editingManager ? "Edit Manager Delegations" : "Add New Manager"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingManager
                      ? `Adjust property assignments and operational privileges for ${editingManager.name}`
                      : "Create manager credentials, assign listings, and configure access scopes."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {/* SECTION 1: PROFILE DETAILS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-1.5">
                  <ShieldCheck className="size-4 text-[#064E3B]" />
                  <span>1. Manager Profile</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    {...register("fullName")}
                    placeholder="e.g. Mahfuzur Rahman"
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                  />
                  {errors.fullName && (
                    <p className="text-rose-600 text-[11px] mt-1">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number (Login & SMS) *
                    </label>
                    <input
                      type="tel"
                      {...register("phone")}
                      placeholder="e.g. 01712345678"
                      className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                    />
                    {errors.phone && (
                      <p className="text-rose-600 text-[11px] mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="e.g. manager@parkease.bd"
                      className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                    />
                    {errors.email && (
                      <p className="text-rose-600 text-[11px] mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: PROPERTY ASSIGNMENT (MULTI-SELECT) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <Building2 className="size-4 text-[#064E3B]" />
                    <span>2. Property Assignment (Multi-Select)</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    {watchedPropertyIds.length} Selected
                  </span>
                </div>

                {/* Crucial UI Logic Helper Notice */}
                <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Important Rule:</strong> A property can only have{" "}
                    <strong>strictly one manager</strong>. Assigning a property
                    here will immediately replace any existing manager appointed
                    to that listing.
                  </p>
                </div>

                {/* Property Selection Cards */}
                <Controller
                  name="propertyIds"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {properties.map((property) => {
                        const isSelected = field.value?.includes(property.id);
                        const currentManager = property.managerName;
                        const isCurrentUsersManager =
                          editingManager && currentManager === editingManager.name;

                        return (
                          <div
                            key={property.id}
                            onClick={() => {
                              const next = isSelected
                                ? field.value.filter((id) => id !== property.id)
                                : [...field.value, property.id];
                              field.onChange(next);
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "bg-emerald-50/60 border-[#064E3B] shadow-xs"
                                : "bg-white border-[#E5E7EB] hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`size-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                  isSelected
                                    ? "bg-[#064E3B] border-[#064E3B] text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="size-3.5 stroke-[3]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs sm:text-sm font-semibold text-slate-900 block truncate">
                                  {property.title}
                                </span>
                                <span className="text-[11px] text-slate-500 block truncate">
                                  {property.area} • {property.totalSpaces} total
                                  parking bays
                                </span>
                              </div>
                            </div>

                            {/* Manager status indicator */}
                            <div className="shrink-0 text-right">
                              {currentManager && !isCurrentUsersManager ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded">
                                  Currently: {currentManager}
                                </span>
                              ) : isCurrentUsersManager ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded">
                                  Currently Assigned
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                  No Manager
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.propertyIds && (
                  <p className="text-rose-600 text-[11px] mt-1">
                    {errors.propertyIds.message}
                  </p>
                )}
              </div>

              {/* SECTION 3: OPERATIONAL PERMISSIONS (TOGGLES) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-1.5">
                  <Shield className="size-4 text-[#064E3B]" />
                  <span>3. Operational Permissions</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Toggle: Listings */}
                  <Controller
                    name="canManageListings"
                    control={control}
                    render={({ field }) => (
                      <div className="p-3 rounded-xl border border-[#E5E7EB] bg-white flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-slate-900 block">
                            Manage Listings
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            Edit space rates, operating hours, and space limits.
                          </span>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />

                  {/* Toggle: Bookings */}
                  <Controller
                    name="canManageBookings"
                    control={control}
                    render={({ field }) => (
                      <div className="p-3 rounded-xl border border-[#E5E7EB] bg-white flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-slate-900 block">
                            Manage Bookings
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            View live bookings, confirm arrivals, log exits.
                          </span>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />

                  {/* Toggle: Guards */}
                  <Controller
                    name="canManageGuards"
                    control={control}
                    render={({ field }) => (
                      <div className="p-3 rounded-xl border border-[#E5E7EB] bg-white flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-slate-900 block">
                            Manage Guards
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            Assign guards to gates, duty schedules, & passcodes.
                          </span>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />

                  {/* Toggle: Reviews */}
                  <Controller
                    name="canRespondReviews"
                    control={control}
                    render={({ field }) => (
                      <div className="p-3 rounded-xl border border-[#E5E7EB] bg-white flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-slate-900 block">
                            Respond to Reviews
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            Reply to customer driver ratings and feedback.
                          </span>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* SECTION 4: FINANCIAL ACCESS (RESTRICTED DANGER ZONE) */}
              <div className="p-4 sm:p-5 rounded-xl bg-amber-50/70 border border-amber-300/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-4.5 text-amber-700 shrink-0" />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                        4. Financial Access (Restricted Delegation)
                      </span>
                      <span className="text-[11px] text-amber-700">
                        Default: Disabled. Managers have ZERO access to balance
                        or earnings by default.
                      </span>
                    </div>
                  </div>
                  <Controller
                    name="canAccessFinancials"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className={
                          field.value ? "bg-amber-600!" : "bg-slate-300"
                        }
                      />
                    )}
                  />
                </div>

                <p className="text-xs text-amber-800/90 leading-relaxed bg-white/70 p-3 rounded-lg border border-amber-200">
                  <strong>Access Scope:</strong> Allows this manager to view
                  revenue, earnings reports, and manage payouts for their
                  assigned properties only. Bank account changes remain strictly
                  restricted to you (the Owner).
                </p>

                {watchedCanAccessFinancials && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 animate-in fade-in">
                    <Coins className="size-4 text-amber-600 shrink-0" />
                    <span>
                      Warning: Manager will be able to inspect daily revenue data
                      and request payouts.
                    </span>
                  </div>
                )}
              </div>

              {/* SECTION 5: INITIAL AUTHENTICATION CREDENTIALS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-1.5">
                  <KeyRound className="size-4 text-[#064E3B]" />
                  <span>5. Authentication & Initial Credentials</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Temporary Initial Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        {...register("tempPassword")}
                        placeholder="Min 8 characters"
                        className="w-full h-10 px-3 pr-9 rounded-lg border border-[#E5E7EB] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    {errors.tempPassword && (
                      <p className="text-rose-600 text-[11px] mt-1">
                        {errors.tempPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm Initial Password *
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("confirmPassword")}
                      placeholder="Repeat password"
                      className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                    />
                    {errors.confirmPassword && (
                      <p className="text-rose-600 text-[11px] mt-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  The manager will be prompted to replace this temporary
                  password immediately upon their first authenticated session.
                </p>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs sm:text-sm font-medium shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Processing...</span>
                  ) : editingManager ? (
                    <span>Save Changes</span>
                  ) : (
                    <>
                      <Plus className="size-4" />
                      <span>Create Manager Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
