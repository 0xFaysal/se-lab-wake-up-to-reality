import type { GuardAssignmentStatus, VehicleType } from "@/lib/api/api-types";

export function formatDateTime(value: string) { return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
export function formatPhone(value: string) { return value.startsWith("+880") ? `+880 ${value.slice(4, 7)} ${value.slice(7, 11)} ${value.slice(11)}`.trim() : value; }
export function formatBdt(value: number) { return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(value); }
export const vehicleLabels: Record<VehicleType, string> = { MOTORCYCLE: "Motorcycle", SEDAN: "Sedan", SUV: "SUV", MICROBUS: "Microbus" };
export const guardStatus: Record<GuardAssignmentStatus, { label: string; className: string }> = {
  PENDING_ACCEPTANCE: { label: "Pending acceptance", className: "bg-amber-100 text-amber-800" },
  ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-800" },
  SUSPENDED: { label: "Suspended", className: "bg-red-100 text-red-800" },
  ENDED: { label: "Ended", className: "bg-slate-100 text-slate-700" },
  CANCELLED: { label: "Cancelled", className: "bg-slate-100 text-slate-700" },
};
