import { Suspense } from "react";
import type { Metadata } from "next";
import { ParkingSearchView } from "@/components/parking/parking-search-view";

export const metadata: Metadata = {
  title: "Search Parking in Dhaka",
  description:
    "Find and filter verified hourly parking spots with real-time map discovery in Dhaka.",
};

export default function ParkingSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-muted-foreground">
          Loading parking search…
        </div>
      }
    >
      <ParkingSearchView />
    </Suspense>
  );
}
