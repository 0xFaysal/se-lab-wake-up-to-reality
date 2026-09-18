import { Suspense } from "react";
import { ParkingSearchView } from "@/components/parking/parking-search-view";

export default function DriverParkingSearchPage() {
  return <Suspense fallback={<div className="p-12 text-center text-sm text-muted-foreground">Loading parking search...</div>}><ParkingSearchView driverMode /></Suspense>;
}
