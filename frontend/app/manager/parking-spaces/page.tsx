"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Layers,
  Search,
  ShieldCheck,
} from "lucide-react";
import { ManagerHeader } from "@/components/manager/manager-header";
import { Button } from "@/components/ui/button";
import { managerApi } from "@/lib/api/manager-api";
import { parkingResourcesApi } from "@/lib/api/parking-resources-api";
import { bookingsApi } from "@/lib/api/bookings-api";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

interface SpaceItem {
  id: string;
  code: string;
  property: string;
  propertyId: string;
  type: string;
  isEv?: boolean;
  level: string;
  status: "Available" | "Occupied" | "Maintenance";
  currentUse: string;
  driver?: string;
}

export default function ManagerParkingSpacesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);

  const delegationsQuery = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const bookingsQuery = useQuery({
    queryKey: queryKeys.bookings.provider({}),
    queryFn: () => bookingsApi.providerList(),
    retry: false,
  });

  const activeDelegations = useMemo(
    () => delegationsQuery.data?.filter((d) => d.status === "ACTIVE") ?? [],
    [delegationsQuery.data]
  );
  const primaryOwner = activeDelegations[0]?.provider?.fullName || "Property Principal";

  // Load real resources across all active delegations
  const resourceQueries = useQueries({
    queries: activeDelegations.map((d) => ({
      queryKey: queryKeys.parkingResources.byProperty(d.property.id),
      queryFn: () => parkingResourcesApi.list(d.property.id),
    })),
  });

  const allSpaces: SpaceItem[] = useMemo(() => {
    const list: SpaceItem[] = [];
    const activeBookings = (bookingsQuery.data ?? []).filter(
      (b) => b.status === "CHECKED_IN" || b.status === "CHECKOUT_REQUESTED",
    );

    activeDelegations.forEach((d, idx) => {
      const resources = resourceQueries[idx]?.data ?? [];
      resources.forEach((res) => {
        if (res.units && res.units.length > 0) {
          res.units.forEach((unit) => {
            const activeBooking = activeBookings.find(
              (b) =>
                b.parkingResourceUnitId === unit.id ||
                b.assignedUnitCode === unit.spotCode ||
                b.parkingSpotId === res.id,
            );
            const isOccupied = Boolean(activeBooking);
            list.push({
              id: unit.id,
              code: unit.spotCode,
              property: d.property.name,
              propertyId: d.property.id,
              type: res.supportedVehicleTypes?.[0] || "Standard",
              level: res.floor || "Ground",
              status: isOccupied
                ? "Occupied"
                : unit.status === "MAINTENANCE"
                ? "Maintenance"
                : "Available",
              currentUse: isOccupied
                ? activeBooking?.driver?.fullName || "Active Session"
                : "Open",
              driver: activeBooking?.driver?.fullName,
            });
          });
        } else {
          const activeBooking = activeBookings.find(
            (b) => b.parkingSpotId === res.id,
          );
          const isOccupied = Boolean(activeBooking);
          list.push({
            id: res.id,
            code: res.spotCode || res.displayName || "Bay",
            property: d.property.name,
            propertyId: d.property.id,
            type: res.supportedVehicleTypes?.[0] || "Standard",
            level: res.floor || "Ground",
            status: isOccupied
              ? "Occupied"
              : res.status === "MAINTENANCE"
              ? "Maintenance"
              : "Available",
            currentUse: isOccupied
              ? activeBooking?.driver?.fullName || "Active Session"
              : "Open",
            driver: activeBooking?.driver?.fullName,
          });
        }
      });
    });
    return list;
  }, [activeDelegations, resourceQueries, bookingsQuery.data]);

  const filteredSpaces = useMemo(() => {
    return allSpaces.filter((sp) => {
      const matchSearch =
        sp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sp.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sp.driver && sp.driver.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchProperty =
        propertyFilter === "ALL" || sp.property === propertyFilter;
      const matchType = typeFilter === "ALL" || sp.type === typeFilter;
      const matchStatus = statusFilter === "ALL" || sp.status === statusFilter;
      return matchSearch && matchProperty && matchType && matchStatus;
    });
  }, [allSpaces, searchTerm, propertyFilter, typeFilter, statusFilter]);

  const toggleSelectSpace = (code: string) => {
    setSelectedSpaces((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleBulkAction = (action: string) => {
    if (selectedSpaces.length === 0) {
      toast.info("Select one or more spaces to perform action");
      return;
    }
    toast.success(`Updated ${selectedSpaces.length} space(s) to ${action}`);
    setSelectedSpaces([]);
  };

  const availableCount = allSpaces.filter((s) => s.status === "Available").length;
  const occupiedCount = allSpaces.filter((s) => s.status === "Occupied").length;
  const maintenanceCount = allSpaces.filter((s) => s.status === "Maintenance").length;

  return (
    <div className="flex flex-col min-h-full">
      <ManagerHeader
        title="Parking Spaces"
        subtitle="Monitor and manage parking spaces across properties assigned to you."
        badge="Manager View"
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Delegated Access Notice Banner */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4.5 text-[#064E3B] shrink-0" />
            <span className="font-medium">
              You can manage parking-space availability and operational status within permissions granted by the Property Owner.
            </span>
          </div>
          <span className="font-semibold text-emerald-900 shrink-0">
            Assigned by: {primaryOwner}
          </span>
        </div>

        {/* 5 KPI Metric Cards matching parking-spaces.png */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Spaces
              </span>
              <Layers className="size-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{allSpaces.length}</div>
            <p className="mt-1 text-[11px] text-slate-400">Dedicated bays</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Available
              </span>
              <span className="size-2 rounded-full bg-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-emerald-700">{availableCount}</div>
            <p className="mt-1 text-[11px] text-emerald-700 font-medium">Ready for drivers</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                Occupied
              </span>
              <span className="size-2 rounded-full bg-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-blue-900">{occupiedCount}</div>
            <p className="mt-1 text-[11px] text-slate-400">Active parked</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Maintenance
              </span>
              <span className="size-2 rounded-full bg-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-700">{maintenanceCount}</div>
            <p className="mt-1 text-[11px] text-slate-400">Bays undergoing repair</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Properties
              </span>
              <Building2 className="size-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{activeDelegations.length}</div>
            <p className="mt-1 text-[11px] text-slate-400">Assigned hubs</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search space ID, vehicle plate, driver name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#064E3B] focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Properties ({activeDelegations.length})</option>
              {activeDelegations.map((d) => (
                <option key={d.property.id} value={d.property.name}>
                  {d.property.name}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="Standard">Standard</option>
              <option value="MOTORCYCLE">Motorcycle</option>
              <option value="SEDAN">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="MICROBUS">Microbus</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedSpaces.length > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-[#064E3B] px-4 py-2.5 text-white shadow-xs">
            <span className="text-xs font-semibold">
              {selectedSpaces.length} space(s) selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction("Maintenance")}
                className="h-7 text-xs bg-white text-slate-800 border-none hover:bg-slate-100"
              >
                Mark Maintenance
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction("Available")}
                className="h-7 text-xs bg-white text-slate-800 border-none hover:bg-slate-100"
              >
                Mark Available
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedSpaces([])}
                className="h-7 text-xs text-emerald-200 hover:text-white hover:bg-emerald-900"
              >
                Deselect All
              </Button>
            </div>
          </div>
        )}

        {/* Parking Spaces Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedSpaces.length === filteredSpaces.length &&
                        filteredSpaces.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSpaces(filteredSpaces.map((s) => s.code));
                        } else {
                          setSelectedSpaces([]);
                        }
                      }}
                      className="size-3.5 rounded border-slate-300 text-[#064E3B] focus:ring-[#064E3B]"
                    />
                  </th>
                  <th className="px-4 py-3.5">SPACE ID</th>
                  <th className="px-4 py-3.5">PROPERTY</th>
                  <th className="px-4 py-3.5">TYPE</th>
                  <th className="px-4 py-3.5">LEVEL</th>
                  <th className="px-4 py-3.5">STATUS</th>
                  <th className="px-4 py-3.5">CURRENT USE</th>
                  <th className="px-4 py-3.5 text-right">WORKSPACE ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSpaces.length > 0 ? (
                  filteredSpaces.map((space) => {
                    const isSelected = selectedSpaces.includes(space.code);
                    const isOccupied = space.status === "Occupied";
                    const isMaintenance = space.status === "Maintenance";

                    return (
                      <tr
                        key={space.id}
                        className={`hover:bg-slate-50/70 transition ${
                          isSelected ? "bg-emerald-50/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectSpace(space.code)}
                            className="size-3.5 rounded border-slate-300 text-[#064E3B] focus:ring-[#064E3B]"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 text-sm">
                          {space.code}
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          {space.property}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 text-[11px]">
                            {space.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{space.level}</td>
                        <td className="px-4 py-3">
                          {isOccupied && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-800 border border-blue-200">
                              <span className="size-1.5 rounded-full bg-blue-600" />
                              Occupied
                            </span>
                          )}
                          {space.status === "Available" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                              <span className="size-1.5 rounded-full bg-emerald-600" />
                              Available
                            </span>
                          )}
                          {isMaintenance && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                              <span className="size-1.5 rounded-full bg-amber-600" />
                              Maintenance
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800">
                            {space.currentUse}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/manager/properties/${space.propertyId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs font-semibold hover:border-[#064E3B] hover:text-[#064E3B] cursor-pointer"
                            >
                              Open Facility <ArrowRight className="size-3 ml-1" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <Layers className="mx-auto size-8 text-slate-300" />
                      <p className="mt-2 text-xs">
                        No parking spaces found matching the current criteria.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
