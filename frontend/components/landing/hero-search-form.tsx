"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Clock, Car } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VEHICLE_TYPE_LABELS, type VehicleType } from "@/lib/data/mock-parking";
import { defaultSearchWindow, dhakaToday } from "@/lib/search-window";

export function HeroSearchForm() {
  const router = useRouter();
  const [location, setLocation] = useState("Dhaka");
  const [initialWindow] = useState(defaultSearchWindow);
  const [date, setDate] = useState(initialWindow.date);
  const [time, setTime] = useState(initialWindow.startTime);
  const [vehicleType, setVehicleType] = useState<VehicleType>("SEDAN");
  const [error, setError] = useState("");

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fields = new FormData(e.currentTarget);
    const selectedDate = String(fields.get("date") ?? date);
    const selectedTime = String(fields.get("startTime") ?? time);
    const startsAt = new Date(`${selectedDate}T${selectedTime}:00+06:00`);
    if (!Number.isFinite(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      setError("Choose a future arrival date and time.");
      return;
    }
    setError("");
    const params = new URLSearchParams();
    const destination = String(fields.get("location") ?? location).trim();
    if (destination) params.set("location", destination);
    params.set("date", selectedDate);
    if (selectedTime) {
      params.set("startTime", selectedTime);
      const [hour, minute] = selectedTime.split(":").map(Number);
      const endMinutes = Math.min(hour * 60 + minute + 180, 23 * 60 + 59);
      params.set("endTime", `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`);
    }
    if (vehicleType) params.set("vehicleType", vehicleType);

    router.push(`/parking?${params.toString()}`);
  }

  return (
    <motion.form
      onSubmit={handleSearch}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="w-full rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-border/50 space-y-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Destination Input */}
        <div className="space-y-2">
          <label
            htmlFor="hero-location"
            className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider font-heading"
          >
            <MapPin className="size-4 text-primary" />
            Destination
          </label>
          <Input
            id="hero-location"
            name="location"
            type="text"
            placeholder="Dhaka (e.g. Dhanmondi, Gulshan)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-12 w-full px-4 text-sm font-medium rounded-xl bg-white border border-slate-300 hover:border-slate-400 focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 shadow-2xs"
          />
        </div>

        {/* Date Input */}
        <div className="space-y-2">
          <label
            htmlFor="hero-date"
            className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider font-heading"
          >
            <Calendar className="size-4 text-primary" />
            Date
          </label>
          <Input
            id="hero-date"
            name="date"
            type="date"
            required
            value={date}
            min={dhakaToday()}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 w-full px-4 text-sm font-medium rounded-xl bg-white border border-slate-300 hover:border-slate-400 focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 shadow-2xs"
          />
        </div>

        {/* Time Input */}
        <div className="space-y-2">
          <label
            htmlFor="hero-time"
            className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider font-heading"
          >
            <Clock className="size-4 text-primary" />
            Start Time
          </label>
          <Input
            id="hero-time"
            name="startTime"
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-12 w-full px-4 text-sm font-medium rounded-xl bg-white border border-slate-300 hover:border-slate-400 focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 shadow-2xs"
          />
        </div>

        {/* Vehicle Type Select */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider font-heading">
            <Car className="size-4 text-primary" />
            Vehicle Type
          </label>
          <Select
            value={vehicleType}
            onValueChange={(val) => {
              if (val) setVehicleType(val as VehicleType);
            }}
          >
            <SelectTrigger className="h-12 w-full px-4 text-sm font-medium rounded-xl bg-white border border-slate-300 hover:border-slate-400 focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 shadow-2xs text-foreground">
              <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-card">
              {Object.entries(VEHICLE_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-sm py-2">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <div className="flex items-center justify-end border-t border-border pt-4">
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto gap-2 text-sm font-bold bg-primary text-white hover:bg-primary/90 px-8 h-12 rounded-xl shadow-xs"
        >
          <Search className="size-4" />
          Find Parking Slots
        </Button>
      </div>
    </motion.form>
  );
}
