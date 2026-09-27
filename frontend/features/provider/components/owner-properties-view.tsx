"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Plus,
  Search,
  ChevronDown,
  MoreVertical,
  MapPin,
  Car,
  CheckCircle2,
  Users,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  Eye,
} from "lucide-react";
import { OwnerHeader } from "@/components/provider/provider-header";
import {
  MOCK_OWNER_PROPERTIES,
  OwnerProperty,
} from "@/lib/data/mock-owner-data";
import safetyGarageImg from "@/assets/safety-garage.jpg";
import garageEntranceImg from "@/assets/garage-entrance.jpg";

export function OwnerPropertiesView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("RECENT");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Property Image resolver
  const getPropertyImage = (property: OwnerProperty) => {
    if (property.id === "prop-gulshan-1") return safetyGarageImg;
    if (property.id === "prop-banani-2") return garageEntranceImg;
    return null;
  };

  // Metrics calculation
  const totalCount = MOCK_OWNER_PROPERTIES.length;
  const activeCount = MOCK_OWNER_PROPERTIES.filter((p) => p.status === "ACTIVE").length;
  const pausedCount = MOCK_OWNER_PROPERTIES.filter((p) => p.status === "PAUSED").length;
  const draftCount = MOCK_OWNER_PROPERTIES.filter((p) => p.status === "DRAFT").length;

  // Filtered and sorted properties
  const filteredProperties = useMemo(() => {
    return MOCK_OWNER_PROPERTIES.filter((property) => {
      const matchesSearch =
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.area.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || property.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === "RATE_HIGH") {
        return (b.ratePerHour || 0) - (a.ratePerHour || 0);
      }
      if (sortBy === "SPACES") {
        return b.totalSpaces - a.totalSpaces;
      }
      if (sortBy === "NAME") {
        return a.title.localeCompare(b.title);
      }
      // Default: RECENT (keep mock order)
      return 0;
    });
  }, [searchQuery, statusFilter, sortBy]);

  return (
    <div className="flex flex-col min-h-full">
      {/* Top Header */}
      <OwnerHeader
        title="My Listings"
        subtitle="Manage your parking properties, availability, and assigned operations team."
        actions={
          <Link
            href="/provider/properties/new"
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-semibold shadow-2xs transition-all active:scale-[0.99]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>+ Add Parking Space</span>
          </Link>
        }
      />

      {/* Main Content Container */}
      <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-7">
        {/* ==================================================================== */}
        {/* 1. METRICS ROW (4 Standard Cards)                                    */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: ALL LISTINGS */}
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`bg-white rounded-xl border p-5 shadow-2xs text-left transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "border-emerald-700/60 ring-1 ring-emerald-700/40"
                : "border-[#E5E7EB] hover:border-slate-300"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
              All Listings
            </span>
            <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-1.5">
              {totalCount}
            </div>
          </button>

          {/* Card 2: ACTIVE */}
          <button
            type="button"
            onClick={() => setStatusFilter("ACTIVE")}
            className={`bg-white rounded-xl border p-5 shadow-2xs text-left transition-all cursor-pointer ${
              statusFilter === "ACTIVE"
                ? "border-emerald-700/60 ring-1 ring-emerald-700/40"
                : "border-[#E5E7EB] hover:border-slate-300"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
              Active
            </span>
            <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-1.5">
              {activeCount}
            </div>
          </button>

          {/* Card 3: PAUSED */}
          <button
            type="button"
            onClick={() => setStatusFilter("PAUSED")}
            className={`bg-white rounded-xl border p-5 shadow-2xs text-left transition-all cursor-pointer ${
              statusFilter === "PAUSED"
                ? "border-emerald-700/60 ring-1 ring-emerald-700/40"
                : "border-[#E5E7EB] hover:border-slate-300"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
              Paused
            </span>
            <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-1.5">
              {pausedCount}
            </div>
          </button>

          {/* Card 4: DRAFT */}
          <button
            type="button"
            onClick={() => setStatusFilter("DRAFT")}
            className={`bg-white rounded-xl border p-5 shadow-2xs text-left transition-all cursor-pointer ${
              statusFilter === "DRAFT"
                ? "border-emerald-700/60 ring-1 ring-emerald-700/40"
                : "border-[#E5E7EB] hover:border-slate-300"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
              Draft
            </span>
            <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-1.5">
              {draftCount}
            </div>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* 2. FILTER & SEARCH BAR                                               */}
        {/* ==================================================================== */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listings by name or location"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition shadow-2xs"
            />
          </div>

          {/* Controls: Status & Sort Dropdowns */}
          <div className="flex items-center gap-2.5">
            {/* Status Dropdown */}
            <div className="relative">
              <select
                aria-label="Filter by property status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 pl-3.5 pr-8 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition appearance-none cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="PAUSED">Paused</option>
                <option value="DRAFT">Draft</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                aria-label="Sort listings"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 pl-3.5 pr-8 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition appearance-none cursor-pointer shadow-2xs"
              >
                <option value="RECENT">Recently Updated</option>
                <option value="RATE_HIGH">Highest Rate (৳/hr)</option>
                <option value="SPACES">Total Spaces</option>
                <option value="NAME">Name (A–Z)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 3. LISTINGS LIST (Complex Horizontal Cards)                          */}
        {/* ==================================================================== */}
        <div className="space-y-4">
          {filteredProperties.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center space-y-3">
              <Building2 className="size-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 font-heading">
                No matching parking spaces found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your search query or status filter to view your registered properties.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="text-xs font-semibold text-emerald-800 hover:underline pt-2"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredProperties.map((property) => {
              const imageSrc = getPropertyImage(property);
              const isDraft = property.status === "DRAFT";
              const isPaused = property.status === "PAUSED";
              const isActive = property.status === "ACTIVE";

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 relative"
                >
                  {/* Left & Center Info Wrapper */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 min-w-0">
                    {/* Property Image or Draft Box */}
                    <div className="w-full sm:w-44 h-36 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-[#E5E7EB] relative bg-slate-50 flex items-center justify-center">
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={property.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                          <Building2 className="size-7 stroke-[1.5] mb-1 text-slate-300" />
                          <span className="text-[11px] font-semibold">Draft Photo</span>
                        </div>
                      )}
                    </div>

                    {/* Center Property Details */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                      {/* Title + Status Badge */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                          {property.title}
                        </h3>

                        {isActive && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Active
                          </span>
                        )}
                        {isPaused && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            Paused
                          </span>
                        )}
                        {isDraft && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            Draft
                          </span>
                        )}
                      </div>

                      {/* Address */}
                      <p className="flex items-center gap-1.5 text-xs text-slate-500 font-normal">
                        <MapPin className="size-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{property.address}</span>
                      </p>

                      {/* Spaces & Pricing Row */}
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Car className="size-3.5 text-slate-400" />
                          <span>{property.totalSpaces} Spaces Total</span>
                        </span>

                        {property.availableSpaces !== undefined && !isDraft && (
                          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            <span>{property.availableSpaces} Available</span>
                          </span>
                        )}

                        {property.ratePerHour ? (
                          <span className="font-mono font-bold text-[#064E3B] text-sm flex items-center gap-0.5">
                            ৳{property.ratePerHour} <span className="text-[11px] font-sans font-normal text-slate-500">/ hr</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Pricing not published
                          </span>
                        )}
                      </div>

                      {/* Operations Team Assignment Row */}
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        {/* Manager Badge */}
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
                          <Users className="size-3 text-slate-400" />
                          <span>Manager: {property.managerName || "Not Assigned"}</span>
                        </span>

                        {/* Guard Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-medium border px-2.5 py-0.5 rounded-full ${
                            property.guardStatus === "On Duty"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}
                        >
                          <ShieldCheck className="size-3" />
                          <span>
                            Guard: {property.guardStatus || "Not Assigned"}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0">
                    {isDraft ? (
                      /* Draft Action: Solid Primary Button */
                      <Link
                        href={`/provider/properties/${property.id}/setup`}
                        className="px-5 py-2.5 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-semibold shadow-2xs transition-all active:scale-[0.99] flex items-center gap-1.5"
                      >
                        <span>Continue Setup</span>
                      </Link>
                    ) : (
                      /* Active/Paused Actions: Outline Buttons */
                      <>
                        <Link
                          href={`/provider/properties/${property.id}`}
                          className="px-4 py-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                        >
                          View
                        </Link>

                        <Link
                          href={`/provider/properties/${property.id}/edit`}
                          className="px-4 py-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                        >
                          Edit
                        </Link>
                      </>
                    )}

                    {/* Vertical Ellipsis Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(activeMenuId === property.id ? null : property.id)
                        }
                        className="size-9 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors shadow-2xs cursor-pointer"
                        aria-label="More property options"
                      >
                        <MoreVertical className="size-4" />
                      </button>

                      {/* Dropdown Options */}
                      {activeMenuId === property.id && (
                        <div
                          className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl border border-[#E5E7EB] shadow-lg py-1.5 z-30 animate-in fade-in-50 zoom-in-95 text-xs font-medium"
                          onMouseLeave={() => setActiveMenuId(null)}
                        >
                          <Link
                            href={`/provider/properties/${property.id}`}
                            onClick={() => setActiveMenuId(null)}
                            className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="size-3.5 text-slate-400" />
                            View Public Listing
                          </Link>

                          <Link
                            href={`/provider/guards?property=${property.id}`}
                            onClick={() => setActiveMenuId(null)}
                            className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50"
                          >
                            <ShieldCheck className="size-3.5 text-slate-400" />
                            Assign Guard
                          </Link>

                          <Link
                            href={`/provider/managers?property=${property.id}`}
                            onClick={() => setActiveMenuId(null)}
                            className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50"
                          >
                            <Users className="size-3.5 text-slate-400" />
                            Assign Manager
                          </Link>

                          <div className="my-1 border-t border-[#E5E7EB]" />

                          <button
                            type="button"
                            onClick={() => {
                              alert(
                                property.status === "ACTIVE"
                                  ? "Property has been paused."
                                  : "Property has been activated."
                              );
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50"
                          >
                            {property.status === "ACTIVE" ? (
                              <>
                                <PauseCircle className="size-3.5 text-amber-600" />
                                Pause Listing
                              </>
                            ) : (
                              <>
                                <PlayCircle className="size-3.5 text-emerald-700" />
                                Activate Listing
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
