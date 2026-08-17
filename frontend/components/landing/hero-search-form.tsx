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

export function HeroSearchForm() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("09:00");
  const [vehicleType, setVehicleType] = useState<VehicleType>("SEDAN");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    if (vehicleType) params.set("vehicleType", vehicleType);

    router.push(`/parking?${params.toString()}`);
  }

  return (
    <motion.form
      onSubmit={handleSearch}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full rounded-2xl border bg-card p-4 shadow-xl shadow-black/5 ring-1 ring-border sm:p-5"
    >
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Location Input */}
        <div className="space-y-1.5">
          <label
            htmlFor="hero-location"
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider"
          >
            <MapPin className="size-3.5 text-primary" />
            Destination
          </label>
          <Input
            id="hero-location"
            type="text"
            placeholder="e.g. Dhanmondi, Gulshan"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-10 text-sm"
          />
        </div>

        {/* Date Input */}
        <div className="space-y-1.5">
          <label
            htmlFor="hero-date"
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider"
          >
            <Calendar className="size-3.5 text-primary" />
            Date
          </label>
          <Input
            id="hero-date"
            type="date"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 text-sm"
          />
        </div>

        {/* Time Input */}
        <div className="space-y-1.5">
          <label
            htmlFor="hero-time"
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider"
          >
            <Clock className="size-3.5 text-primary" />
            Start Time
          </label>
          <Input
            id="hero-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-10 text-sm"
          />
        </div>

        {/* Vehicle Type Select */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
            <Car className="size-3.5 text-primary" />
            Vehicle Type
          </label>
          <Select
            value={vehicleType}
            onValueChange={(val) => setVehicleType(val as VehicleType)}
          >
            <SelectTrigger className="h-10 w-full text-sm">
              <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VEHICLE_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end border-t pt-4">
        <Button
          type="submit"
          size="lg"
          className="w-full gap-2 text-sm font-medium sm:w-auto px-8"
        >
          <Search className="size-4" />
          Find Parking Slots
        </Button>
      </div>
    </motion.form>
  );
}
