"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { guardMarketplaceApi } from "@/lib/api/guard-marketplace-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, vehicleLabels } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function GuardBookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useQuery({ queryKey: queryKeys.bookings.guardDetail(id), queryFn: () => guardMarketplaceApi.booking(id) });
  if (query.isPending) return <Loader2 className="mx-auto mt-20 size-6 animate-spin" />;
  if (query.isError) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{getApiErrorMessage(query.error)}</p>;
  const booking = query.data;
  return <div className="space-y-5 pb-24"><Link href="/guard/bookings" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="size-4" />Bookings</Link><div><h1 className="font-mono text-2xl font-extrabold">{booking.bookingCode}</h1><p className="mt-1 text-sm text-slate-500">{booking.status.replaceAll("_", " ")}</p></div><section className="grid gap-4 rounded-lg border bg-white p-5 sm:grid-cols-2"><Info label="Property" value={`${booking.property.name}, ${booking.property.publicArea}`} /><Info label="Parking" value={booking.parkingSpot.displayName ?? booking.parkingSpot.spotCode ?? "Parking area"} /><Info label="Driver" value={booking.driver.fullName} /><Info label="Vehicle" value={`${booking.vehicle.registrationNumber} · ${vehicleLabels[booking.vehicle.vehicleType]}`} /><Info label="Starts" value={formatDateTime(booking.startAt)} /><Info label="Scheduled end" value={formatDateTime(booking.scheduledEndAt)} /></section>{booking.status === "CONFIRMED" && <Link href="/guard/scan"><Button className="w-full"><QrCode className="size-4" />Verify Driver credential to check in</Button></Link>}{booking.status !== "CONFIRMED" && <Link href={`/guard/bookings/${booking.id}/active`}><Button className="w-full">Open active session</Button></Link>}</div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-800">{value}</p></div>;
}
