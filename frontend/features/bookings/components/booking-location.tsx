"use client";

import dynamic from "next/dynamic";
import { Navigation } from "lucide-react";
import type { BookingDto } from "@/lib/api/marketplace-types";
import { bookingDirectionsUrl } from "@/lib/driver-session";
import { buttonVariants } from "@/components/ui/button";

const ActualLocationMap = dynamic(() => import("@/components/parking/actual-location-map"), { ssr: false, loading: () => <div className="h-56 animate-pulse rounded-md bg-slate-100" /> });

export function BookingLocation({ booking, showDirections = true }: { booking: BookingDto; showDirections?: boolean }) {
  const location = booking.exactLocation;
  const directions = bookingDirectionsUrl(location);
  if (!location || !directions) return booking.confirmedAt || ["CONFIRMED", "CHECKED_IN", "CHECKOUT_REQUESTED"].includes(booking.status) ? <section className="rounded-md border bg-white p-4"><h2 className="text-sm font-bold">Parking location unavailable</h2><p className="mt-2 text-sm text-slate-600">Exact coordinates could not be loaded. Contact support before travelling.</p></section> : null;
  return <section className="space-y-3 rounded-md border bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-bold">Your parking location</h2>{showDirections && <a href={directions} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}><Navigation className="size-4" />Directions</a>}</div><ActualLocationMap {...location} name={booking.property?.name ?? "Reserved parking"} />{booking.property?.exactAddress && <p className="text-sm text-slate-700">{booking.property.exactAddress}</p>}{booking.property?.accessInstructions && <p className="text-sm text-slate-600">{booking.property.accessInstructions}</p>}</section>;
}
