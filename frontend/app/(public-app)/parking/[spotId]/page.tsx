"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, CarFront, ChevronLeft, ChevronRight, Clock, ExternalLink, Images, Loader2, MapPin, RefreshCw, Ruler, ShieldCheck, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { VehicleType } from "@/lib/api/api-types";
import { bookingsApi } from "@/lib/api/bookings-api";
import type { BookingDto, BookingQuoteDto, PublicPropertyDetailDto, PublicPropertyOfferDto, ReservationHoldDto } from "@/lib/api/marketplace-types";
import { parkingSearchApi } from "@/lib/api/parking-search-api";
import { vehicleApi } from "@/lib/api/vehicle-api";
import { formatBDTFromPaisa, formatDateTime, toUtcFromBangladeshLocal, vehicleLabels } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function ParkingDetailsPage({ params }: { params: Promise<{ spotId: string }> }) {
  const { spotId } = use(params); const search = useSearchParams();
  const pathname = usePathname(); const searchRoot = pathname.startsWith("/driver/") ? "/driver/parking" : "/parking";
  const request = useMemo(() => ({ startAt: search.get("startAt") ?? "", endAt: search.get("endAt") ?? "", vehicleType: (search.get("vehicleType") ?? "SEDAN") as VehicleType }), [search]);
  const valid = !!request.startAt && !!request.endAt;
  const results = useQuery({ queryKey: queryKeys.parkingSearch.property(spotId, request), queryFn: () => parkingSearchApi.propertyDetail(spotId, request), enabled: valid });
  const property = results.data;
  if (!valid) return <PageState title="Search context is missing" action={<Link href={searchRoot}><Button>Return to search</Button></Link>} />;
  if (results.isPending) return <PageState title="Loading live parking offers" loading />;
  if (results.isError) return <PageState title={getApiErrorMessage(results.error)} action={<Button variant="outline" onClick={() => results.refetch()}><RefreshCw className="size-4" />Retry</Button>} />;
  if (!property) return <PageState title="This Property is no longer available for the selected time." action={<Link href={searchRoot}><Button>Choose another option</Button></Link>} />;
  const availableUnits = property.offers.reduce((total, offer) => total + offer.availableUnits, 0);
  const availableOffers = property.offers.filter((offer) => offer.availableUnits > 0);
  const amenityLabels = [...new Set([
    ...property.facilities.map((facility) => facility.displayName),
    ...(property.offers.some((offer) => offer.isCovered) ? ["Covered parking"] : []),
    ...(property.offers.some((offer) => offer.hasCctv) ? ["CCTV monitoring"] : []),
    ...(property.offers.some((offer) => offer.hasGuard) ? ["On-site guard"] : []),
  ])];
  return <main className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
    <Link href={searchRoot} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="size-4" />Back to parking</Link>
    <header className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end">
      <div><div className="flex items-center gap-2 text-sm text-slate-500"><MapPin className="size-4 text-emerald-700" />{property.publicArea}</div><h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{property.name}</h1><p className="mt-2 text-sm text-slate-600">{property.approximateAddress}</p></div>
      <a href="#reviews" className="flex items-center gap-2 text-sm font-bold"><Star className="size-4 fill-amber-400 text-amber-400" />{property.rating ? property.rating.toFixed(1) : "New"}<span className="font-normal text-slate-500">({property.reviewCount} reviews)</span></a>
    </header>
    <PropertyGallery property={property} />
    <AvailabilityPicker key={`${request.startAt}-${request.endAt}-${request.vehicleType}`} request={request} property={property} />
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-8">
        <section className="border-b pb-8"><h2 className="text-xl font-extrabold">About this parking</h2><p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-600">{property.description || "A verified ParkEase BD parking location with published parking offers."}</p><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><DetailFact icon={CarFront} label="Availability" value={`${availableUnits} space${availableUnits === 1 ? "" : "s"} for selected time`} /><DetailFact icon={BadgeCheck} label="Identification" value={property.visitorIdentificationRequired ? "Visitor ID required" : "No visitor ID required"} /><DetailFact icon={Ruler} label="Height limit" value={property.vehicleHeightLimitCm ? `${property.vehicleHeightLimitCm} cm` : "No limit listed"} /><DetailFact icon={Clock} label="Entry cutoff" value={property.entryCutoffLocalTime ? property.entryCutoffLocalTime.slice(11, 16) : "No cutoff listed"} /></div></section>
        <section className="border-b pb-8"><h2 className="text-xl font-extrabold">What this place offers</h2>{amenityLabels.length > 0 ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{amenityLabels.map((label) => <div key={label} className="flex items-center gap-3 text-sm"><ShieldCheck className="size-5 text-emerald-700" />{label}</div>)}</div> : <p className="mt-3 text-sm text-slate-500">No additional amenities have been listed.</p>}</section>
        <section className="space-y-3 border-b pb-8"><h2 className="text-xl font-extrabold">Parking options</h2>{property.offers.map((offer) => <Offer key={offer.listingId} offer={offer} />)}{property.offers.length === 0 && <p className="border bg-white p-6 text-sm text-slate-600">No published offer supports the selected vehicle type.</p>}</section>
        {(property.generalParkingRules || property.commonSafetyRules) && <section className="grid gap-6 border-b pb-8 md:grid-cols-2">{property.generalParkingRules && <div><h2 className="font-extrabold">Parking rules</h2><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{property.generalParkingRules}</p></div>}{property.commonSafetyRules && <div><h2 className="font-extrabold">Safety information</h2><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{property.commonSafetyRules}</p></div>}</section>}
        <ReviewsSection property={property} />
      </div>
      {availableOffers.length > 0 ? <BookingCheckout offers={availableOffers} startAt={request.startAt} endAt={request.endAt} /> : property.offers.length > 0 ? <aside className="h-fit border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 lg:sticky lg:top-24"><strong>Unavailable for this period</strong><p className="mt-2 leading-5">The offers are published, but none cover the selected date and time. Return to search and choose another period.</p></aside> : null}
    </div>
  </main>;
}

function PropertyGallery({ property }: { property: PublicPropertyDetailDto }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  useEffect(() => {
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") setActiveIndex((current) => current === null ? null : (current - 1 + property.images.length) % property.images.length);
      if (event.key === "ArrowRight") setActiveIndex((current) => current === null ? null : (current + 1) % property.images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, property.images.length]);
  if (property.images.length === 0) return <div className="grid aspect-[16/6] place-items-center bg-slate-100 text-sm text-slate-500">No property photos have been added.</div>;
  const images = property.images.slice(0, 5);
  const open = (index: number) => setActiveIndex(index);
  const move = (direction: number) => setActiveIndex((current) => current === null ? null : (current + direction + property.images.length) % property.images.length);
  return <>
    <section className="relative grid h-72 grid-cols-4 grid-rows-2 gap-1 overflow-hidden bg-slate-100 sm:h-[420px]" aria-label={`${property.name} photos`}>
      <button type="button" onClick={() => open(0)} className="relative col-span-4 row-span-2 overflow-hidden sm:col-span-2"><Image src={images[0]!.url} alt={`${property.name} main view`} fill unoptimized className="object-cover transition duration-300 hover:scale-[1.02]" /></button>
      {images.slice(1).map((image, index) => <button type="button" onClick={() => open(index + 1)} key={image.id} className="relative hidden overflow-hidden sm:block"><Image src={image.url} alt={`${property.name} view ${index + 2}`} fill unoptimized className="object-cover transition duration-300 hover:scale-[1.03]" /></button>)}
      <Button type="button" variant="secondary" className="absolute bottom-4 right-4 z-10 bg-white shadow" onClick={() => open(0)}><Images className="size-4" />Show all photos</Button>
    </section>
    {activeIndex !== null && <div className="fixed inset-0 z-[1000] flex flex-col bg-black/95 text-white" role="dialog" aria-modal="true" aria-label={`${property.name} photo viewer`}>
      <div className="flex h-16 items-center justify-between px-4 sm:px-6"><span className="text-sm font-semibold">{activeIndex + 1} / {property.images.length}</span><button type="button" aria-label="Close photo viewer" onClick={() => setActiveIndex(null)} className="grid size-10 place-items-center rounded-full hover:bg-white/10"><X className="size-6" /></button></div>
      <div className="relative flex-1"><Image src={property.images[activeIndex]!.url} alt={`${property.name} full-screen view ${activeIndex + 1}`} fill unoptimized className="object-contain" /><button type="button" aria-label="Previous photo" onClick={() => move(-1)} className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/60 hover:bg-black/80"><ChevronLeft className="size-7" /></button><button type="button" aria-label="Next photo" onClick={() => move(1)} className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/60 hover:bg-black/80"><ChevronRight className="size-7" /></button></div>
      <div className="flex h-24 gap-2 overflow-x-auto px-4 py-3 sm:px-6">{property.images.map((image, index) => <button type="button" key={image.id} onClick={() => setActiveIndex(index)} className={`relative aspect-[4/3] shrink-0 overflow-hidden border-2 ${index === activeIndex ? "border-white" : "border-transparent opacity-60"}`}><Image src={image.url} alt="" fill unoptimized className="object-cover" /></button>)}</div>
    </div>}
  </>;
}

function dhakaFields(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${value("year")}-${value("month")}-${value("day")}`, time: `${value("hour")}:${value("minute")}` };
}

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function timeToMinutes(time: string) {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function formatTime(time: string) {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function AvailabilityPicker({ request, property }: { request: { startAt: string; endAt: string; vehicleType: VehicleType }; property: PublicPropertyDetailDto }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const initialStart = dhakaFields(request.startAt);
  const initialEnd = dhakaFields(request.endAt);
  const today = dhakaFields(new Date().toISOString());
  const [date, setDate] = useState(initialStart.date);
  const [startTime, setStartTime] = useState(initialStart.time);
  const [endTime, setEndTime] = useState(initialEnd.time);
  const [vehicleType, setVehicleType] = useState(request.vehicleType);
  const dateOptions = useMemo(() => {
    const values = Array.from({ length: 14 }, (_, index) => addDays(today.date, index));
    if (initialStart.date >= today.date && !values.includes(initialStart.date)) values.push(initialStart.date);
    return values.sort();
  }, [initialStart.date, today.date]);
  const rulesForDate = useMemo(() => {
    const dayOfWeek = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    return property.availabilitySchedule.filter((rule) => rule.dayOfWeek === dayOfWeek && rule.validFrom <= date && (!rule.validUntil || rule.validUntil >= date));
  }, [date, property.availabilitySchedule]);
  const offerMinimums = property.offers.map((offer) => offer.minDurationMinutes);
  const offerMaximums = property.offers.map((offer) => offer.maxDurationMinutes);
  const minimumDuration = Math.max(30, offerMinimums.length > 0 ? Math.min(...offerMinimums) : 60);
  const maximumDuration = Math.max(minimumDuration, ...(offerMaximums.length > 0 ? offerMaximums : [minimumDuration]));
  const currentMinute = date === today.date ? timeToMinutes(today.time) : -1;
  const startSlots = useMemo(() => {
    const slots = new Set<string>();
    for (const rule of rulesForDate) {
      const first = Math.ceil(Math.max(timeToMinutes(rule.startTime), currentMinute + 1) / 30) * 30;
      const last = timeToMinutes(rule.endTime) - minimumDuration;
      for (let minute = first; minute <= last; minute += 30) slots.add(minutesToTime(minute));
    }
    return [...slots].sort();
  }, [currentMinute, minimumDuration, rulesForDate]);
  const effectiveStartTime = startSlots.includes(startTime) ? startTime : (startSlots[0] ?? "");
  const selectedWindowEnd = rulesForDate
    .filter((rule) => rule.startTime <= effectiveStartTime && rule.endTime >= effectiveStartTime)
    .reduce((latest, rule) => Math.max(latest, timeToMinutes(rule.endTime)), 0);
  const endSlots = useMemo(() => {
    if (!effectiveStartTime || selectedWindowEnd === 0) return [];
    const first = timeToMinutes(effectiveStartTime) + minimumDuration;
    const last = Math.min(selectedWindowEnd, timeToMinutes(effectiveStartTime) + maximumDuration);
    const slots: string[] = [];
    for (let minute = first; minute <= last; minute += 30) slots.push(minutesToTime(minute));
    return slots;
  }, [effectiveStartTime, maximumDuration, minimumDuration, selectedWindowEnd]);
  const effectiveEndTime = endSlots.includes(endTime) ? endTime : (endSlots[0] ?? "");

  const valid = Boolean(date && effectiveStartTime && effectiveEndTime && new Date(toUtcFromBangladeshLocal(date, effectiveStartTime)) > new Date() && new Date(toUtcFromBangladeshLocal(date, effectiveEndTime)) > new Date(toUtcFromBangladeshLocal(date, effectiveStartTime)));
  const dateHasSchedule = (value: string) => {
    const dayOfWeek = new Date(`${value}T00:00:00.000Z`).getUTCDay();
    return property.availabilitySchedule.some((rule) => rule.dayOfWeek === dayOfWeek && rule.validFrom <= value && (!rule.validUntil || rule.validUntil >= value));
  };
  return <form noValidate className="space-y-5 border-y bg-white py-5" onSubmit={(event) => { event.preventDefault(); if (!valid) return; const params = new URLSearchParams(search.toString()); params.set("startAt", toUtcFromBangladeshLocal(date, effectiveStartTime)); params.set("endAt", toUtcFromBangladeshLocal(date, effectiveEndTime)); params.set("vehicleType", vehicleType); router.replace(`${pathname}?${params.toString()}`, { scroll: false }); }}>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-base font-extrabold">Choose an available time</h2><p className="mt-1 text-xs text-slate-500">Green dates and times are inside this parking location&apos;s published availability.</p></div><label className="w-full text-xs font-semibold text-slate-600 sm:w-52">Vehicle<select value={vehicleType} onChange={(event) => setVehicleType(event.target.value as VehicleType)} className="mt-1 block h-10 w-full rounded-md border bg-white px-3 text-sm">{Object.entries(vehicleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{dateOptions.map((value) => { const available = dateHasSchedule(value); const label = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00.000Z`)); return <button key={value} type="button" disabled={!available} onClick={() => setDate(value)} className={`h-14 rounded-md border px-2 text-left text-xs transition ${value === date ? "border-emerald-800 bg-emerald-800 text-white" : available ? "border-emerald-200 bg-emerald-50 text-emerald-950 hover:border-emerald-600" : "cursor-not-allowed bg-slate-50 text-slate-400"}`}><span className="block font-bold">{label}</span><span className="mt-1 block text-[10px]">{available ? "Available hours" : "Not scheduled"}</span></button>; })}</div>
    {rulesForDate.length > 0 ? <div className="grid gap-5 lg:grid-cols-2"><fieldset><legend className="text-xs font-bold text-slate-700">Arrival</legend><div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto">{startSlots.map((time) => <button key={time} type="button" onClick={() => setStartTime(time)} className={`h-9 rounded-md border px-3 text-xs font-semibold ${effectiveStartTime === time ? "border-emerald-800 bg-emerald-800 text-white" : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-600"}`}>{formatTime(time)}</button>)}</div></fieldset><fieldset><legend className="text-xs font-bold text-slate-700">Departure <span className="font-normal text-slate-500">(minimum {minimumDuration} minutes)</span></legend><div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto">{endSlots.map((time) => <button key={time} type="button" onClick={() => setEndTime(time)} className={`h-9 rounded-md border px-3 text-xs font-semibold ${effectiveEndTime === time ? "border-emerald-800 bg-emerald-800 text-white" : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-600"}`}>{formatTime(time)}</button>)}</div></fieldset></div> : <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This parking location has no published hours for the selected day.</div>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-xs text-slate-600">{valid ? `${formatTime(effectiveStartTime)} to ${formatTime(effectiveEndTime)} · server availability will be checked next` : "Choose a future available time to continue."}</p><Button type="submit" disabled={!valid}>Check live availability</Button></div>
  </form>;
}

function DetailFact({ icon: Icon, label, value }: { icon: typeof CarFront; label: string; value: string }) { return <div className="border-l-2 border-emerald-700 pl-3"><Icon className="size-4 text-emerald-700" /><p className="mt-2 text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>; }

function ReviewsSection({ property }: { property: PublicPropertyDetailDto }) {
  return <section id="reviews" className="scroll-mt-24 pb-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-extrabold"><Star className="size-5 fill-amber-400 text-amber-400" />{property.rating ? property.rating.toFixed(1) : "No rating yet"}</h2><p className="mt-1 text-sm text-slate-500">{property.reviewCount} verified booking review{property.reviewCount === 1 ? "" : "s"}</p></div></div>{property.reviewCount > 0 && <div className="mt-5 max-w-sm space-y-2">{[5, 4, 3, 2, 1].map((rating) => { const count = property.ratingDistribution[String(rating)] ?? 0; const width = property.reviewCount > 0 ? count / property.reviewCount * 100 : 0; return <div key={rating} className="grid grid-cols-[1rem_1fr_2rem] items-center gap-2 text-xs"><span>{rating}</span><div className="h-1.5 overflow-hidden bg-slate-200"><div className="h-full bg-slate-900" style={{ width: `${width}%` }} /></div><span className="text-right text-slate-500">{count}</span></div>; })}</div>}{property.reviews.length > 0 ? <div className="mt-7 grid gap-x-8 gap-y-6 md:grid-cols-2">{property.reviews.map((review) => <article key={review.id} className="border-t pt-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{review.reviewerName}</p><p className="mt-1 text-xs text-slate-500">{formatDateTime(review.createdAt)}</p></div><Stars rating={review.rating} /></div>{review.comment && <p className="mt-3 text-sm leading-6 text-slate-700">{review.comment}</p>}{review.providerReply && <div className="mt-4 border-l-2 border-emerald-700 bg-emerald-50 p-3"><p className="text-xs font-bold text-emerald-900">Response from the parking provider</p><p className="mt-1 text-sm leading-5 text-emerald-950">{review.providerReply}</p></div>}</article>)}</div> : <p className="mt-4 text-sm text-slate-500">This property has not received a verified booking review yet.</p>}</section>;
}

function Stars({ rating }: { rating: number }) { return <div className="flex" aria-label={`${rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`size-4 ${index < rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />)}</div>; }

function Offer({ offer }: { offer: PublicPropertyOfferDto }) { return <article className="rounded-lg border bg-white p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-bold">{offer.title}</h3><p className={`mt-1 text-xs ${offer.availableUnits > 0 ? "text-emerald-700" : "text-amber-700"}`}>{offer.resourceType === "SHARED_POOL" ? "Shared Parking Area" : "Fixed parking space"} · {offer.availableUnits > 0 ? `${offer.availableUnits} available` : "Unavailable for selected time"}</p>{offer.description && <p className="mt-2 text-sm text-slate-600">{offer.description}</p>}</div><strong>{formatBDTFromPaisa(offer.pricePerHourPaisa)}/hour</strong></div><div className="mt-3 flex flex-wrap gap-2">{offer.allowedVehicleTypes.map((type) => <span className="rounded bg-slate-100 px-2 py-1 text-xs" key={type}>{vehicleLabels[type]}</span>)}{offer.isCovered && <span className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-800">Covered</span>}{offer.hasCctv && <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-800">CCTV</span>}{offer.hasGuard && <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-800">Guard</span>}{offer.facilities.map((facility) => <span className="rounded bg-slate-100 px-2 py-1 text-xs" key={facility.code}>{facility.displayName}</span>)}</div></article>; }

function BookingCheckout({ offers, startAt, endAt }: { offers: PublicPropertyOfferDto[]; startAt: string; endAt: string }) {
  const client = useQueryClient(); const keys = useRef({ hold: crypto.randomUUID(), booking: crypto.randomUUID(), payment: crypto.randomUUID() });
  const [listingId, setListingId] = useState(offers[0]?.listingId ?? ""); const [vehicleId, setVehicleId] = useState("");
  const [quote, setQuote] = useState<BookingQuoteDto | null>(null); const [hold, setHold] = useState<ReservationHoldDto | null>(null); const [booking, setBooking] = useState<BookingDto | null>(null);
  const vehicles = useQuery({ queryKey: queryKeys.vehicles.all, queryFn: vehicleApi.list, retry: false });
  const selectedOffer = offers.find((offer) => offer.listingId === listingId); const compatible = vehicles.data?.filter((vehicle) => selectedOffer?.allowedVehicleTypes.includes(vehicle.vehicleType)) ?? [];
  const quoteMutation = useMutation({ mutationFn: () => parkingSearchApi.createQuote({ listingId, vehicleId, startAt, endAt }), onSuccess: (data) => { setQuote(data); setHold(null); setBooking(null); } });
  const holdMutation = useMutation({ mutationFn: () => parkingSearchApi.createHold(quote!.id, keys.current.hold), onSuccess: setHold });
  const releaseMutation = useMutation({ mutationFn: () => parkingSearchApi.releaseHold(hold!.id), onSuccess: async () => { setHold(null); setQuote(null); keys.current.hold = crypto.randomUUID(); keys.current.booking = crypto.randomUUID(); await client.invalidateQueries({ queryKey: queryKeys.parkingSearch.root }); } });
  const bookingMutation = useMutation({ mutationFn: () => bookingsApi.create(hold!.id, keys.current.booking), onSuccess: setBooking });
  const paymentMutation = useMutation({ mutationFn: () => bookingsApi.createPaymentSession(booking!.id, keys.current.payment), onSuccess: (session) => session.checkoutUrl ? window.location.assign(session.checkoutUrl) : window.location.assign(`/driver/bookings/${booking!.id}`) });
  const now = useCurrentTime(!!quote || !!hold); const quoteExpired = !!quote && now > 0 && new Date(quote.expiresAt).getTime() <= now; const holdExpired = !!hold && now > 0 && new Date(hold.expiresAt).getTime() <= now; const error = quoteMutation.error ?? holdMutation.error ?? releaseMutation.error ?? bookingMutation.error ?? paymentMutation.error;
  const returnTo = typeof window === "undefined" ? "/parking" : window.location.pathname + window.location.search;
  if (vehicles.isError) return <aside className="h-fit rounded-lg border bg-white p-5"><h2 className="font-bold">Reserve parking</h2><p className="mt-3 text-sm text-slate-600">Sign in as a Driver to choose a registered vehicle and reserve this offer.</p><Button className="mt-4 w-full" nativeButton={false} render={<Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} />}>Sign in</Button></aside>;
  return <aside className="h-fit space-y-4 rounded-lg border bg-white p-5 shadow-sm lg:sticky lg:top-24"><div><h2 className="font-bold">Reserve parking</h2><p className="mt-1 text-xs text-slate-500">{formatDateTime(startAt)} to {formatDateTime(endAt)}</p></div>
    {!booking && <><label className="block space-y-1 text-xs font-semibold">Offer<select className="h-10 w-full rounded-md border px-3 text-sm" value={listingId} disabled={!!quote} onChange={(event) => { setListingId(event.target.value); setVehicleId(""); }} >{offers.map((offer) => <option key={offer.listingId} value={offer.listingId}>{offer.title} · {formatBDTFromPaisa(offer.pricePerHourPaisa)}/hour</option>)}</select></label><label className="block space-y-1 text-xs font-semibold">Vehicle<select className="h-10 w-full rounded-md border px-3 text-sm" value={vehicleId} disabled={!!quote} onChange={(event) => setVehicleId(event.target.value)}><option value="">Select compatible vehicle</option>{compatible.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.registrationNumber} · {vehicleLabels[vehicle.vehicleType]}</option>)}</select></label></>}
    {!quote && <Button className="w-full" disabled={!vehicleId || quoteMutation.isPending} onClick={() => quoteMutation.mutate()}>{quoteMutation.isPending && <Loader2 className="size-4 animate-spin" />}Get server quote</Button>}
    {quote && !hold && <div className="space-y-3 border-t pt-4"><Price label="Parking" value={quote.baseAmountPaisa} /><Price label="Platform fee" value={quote.platformFeePaisa} /><Price label="Security deposit" value={quote.depositPaisa} /><Price label="Total" value={quote.totalAmountPaisa} strong /><p className="flex items-center gap-1 text-xs text-slate-500"><Clock className="size-3" />Quote expires in <Countdown expiresAt={quote.expiresAt} now={now} /></p>{quoteExpired ? <Button className="w-full" variant="outline" onClick={() => { setQuote(null); keys.current.hold = crypto.randomUUID(); }}>Price quote expired. Refresh quote.</Button> : <Button className="w-full" disabled={holdMutation.isPending} onClick={() => holdMutation.mutate()}>{holdMutation.isPending && <Loader2 className="size-4 animate-spin" />}Hold this parking</Button>}</div>}
    {hold && !booking && <div className="space-y-3 border-t pt-4"><p className="rounded-md bg-blue-50 p-3 text-xs text-blue-800">Parking held for <Countdown expiresAt={hold.expiresAt} now={now} /></p><Button className="w-full" disabled={holdExpired || bookingMutation.isPending || releaseMutation.isPending} onClick={() => bookingMutation.mutate()}>{bookingMutation.isPending && <Loader2 className="size-4 animate-spin" />}Create booking</Button>{holdExpired ? <><p className="text-xs text-red-700">The hold expired. Refresh the quote to try again.</p><Button className="w-full" variant="outline" onClick={() => { setHold(null); setQuote(null); keys.current.hold = crypto.randomUUID(); keys.current.booking = crypto.randomUUID(); }}>Start again</Button></> : <Button className="w-full" variant="ghost" disabled={releaseMutation.isPending} onClick={() => releaseMutation.mutate()}>{releaseMutation.isPending && <Loader2 className="size-4 animate-spin" />}Release hold</Button>}</div>}
    {booking && <div className="space-y-3 border-t pt-4"><p className="font-mono text-sm font-bold">{booking.bookingCode}</p><Price label="Payment amount" value={booking.totalAmountPaisa} strong /><div className="flex gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900"><ShieldCheck className="size-4 shrink-0" /><p>You will continue to the secure SSLCOMMERZ hosted checkout. Payment is confirmed only after server validation.</p></div><Button className="w-full" disabled={paymentMutation.isPending} onClick={() => paymentMutation.mutate()}>{paymentMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}Pay securely with SSLCOMMERZ</Button><Button className="w-full" variant="outline" nativeButton={false} render={<Link href={`/driver/bookings/${booking.id}`} />}>View booking</Button></div>}
    {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-xs text-red-700">{getApiErrorMessage(error)}</p>}
  </aside>;
}
function useCurrentTime(active: boolean) { const [now, setNow] = useState(() => Date.now()); useEffect(() => { if (!active) return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, [active]); return now; }
function Countdown({ expiresAt, now }: { expiresAt: string; now: number }) { if (!now) return <>calculating...</>; const remaining = Math.max(0, new Date(expiresAt).getTime() - now); const minutes = Math.floor(remaining / 60000); const seconds = Math.floor((remaining % 60000) / 1000); return <>{minutes}:{seconds.toString().padStart(2, "0")}</>; }
function Price({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className={`flex justify-between text-sm ${strong ? "border-t pt-2 font-bold" : ""}`}><span>{label}</span><span>{formatBDTFromPaisa(value)}</span></div>; }
function PageState({ title, loading, action }: { title: string; loading?: boolean; action?: React.ReactNode }) { return <div className="mx-auto max-w-xl px-4 py-24 text-center">{loading && <Loader2 className="mx-auto mb-3 size-7 animate-spin" />}<h1 className="font-bold">{title}</h1>{action && <div className="mt-4">{action}</div>}</div>; }
