import type { GuardAssignmentStatus, VehicleType } from "@/lib/api/api-types";

export function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  const timeMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]!, 10);
    const minutes = timeMatch[2]!;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  }
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat("en-BD", { timeStyle: "short", timeZone: "Asia/Dhaka" }).format(date);
  } catch {
    return value;
  }
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    // If it's a plain time string (e.g., "08:00" or "17:30:00")
    if (/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.test(trimmed)) {
      return formatTime(trimmed);
    }
  }

  const date = typeof value === "string" ? new Date(value) : value;
  if (!date || isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }

  try {
    return new Intl.DateTimeFormat("en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Dhaka",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}
export function toUtcFromBangladeshLocal(dateOrDateTime: string, time?: string) {
  const [date, localTime = "00:00"] = time ? [dateOrDateTime, time] : dateOrDateTime.split("T");
  const [year, month, day] = date!.split("-").map(Number);
  const [hour, minute] = localTime.split(":").map(Number);
  const desiredWallTime = Date.UTC(year!, month! - 1, day!, hour!, minute!);
  let guess = desiredWallTime;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(guess)).map((part) => [part.type, part.value]));
    const representedWallTime = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    guess -= representedWallTime - desiredWallTime;
  }
  return new Date(guess).toISOString();
}
export function formatPhone(value: string) { return value.startsWith("+880") ? `+880 ${value.slice(4, 7)} ${value.slice(7, 11)} ${value.slice(11)}`.trim() : value; }
export function formatBdt(value: number) { return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(value); }
export function formatBDTFromPaisa(value: string | number | bigint) {
  const paisa = typeof value === "bigint" ? value : BigInt(value || 0);
  const negative = paisa < BigInt(0);
  const absolutePaisa = negative ? -paisa : paisa;
  const hundred = BigInt(100);
  const whole = absolutePaisa / hundred;
  const fraction = absolutePaisa % hundred;
  return `${negative ? "-" : ""}৳${new Intl.NumberFormat("en-BD").format(whole)}${fraction === BigInt(0) ? "" : `.${fraction.toString().padStart(2, "0")}`}`;
}
export const vehicleLabels: Record<VehicleType, string> = { MOTORCYCLE: "Motorcycle", SEDAN: "Sedan", SUV: "SUV", MICROBUS: "Microbus" };
export const guardStatus: Record<GuardAssignmentStatus, { label: string; className: string }> = {
  PENDING_ACCEPTANCE: { label: "Pending acceptance", className: "bg-amber-100 text-amber-800" },
  ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-800" },
  SUSPENDED: { label: "Suspended", className: "bg-red-100 text-red-800" },
  ENDED: { label: "Ended", className: "bg-slate-100 text-slate-700" },
  CANCELLED: { label: "Cancelled", className: "bg-slate-100 text-slate-700" },
};
