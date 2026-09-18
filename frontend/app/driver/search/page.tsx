import { Suspense } from "react";
import type { Metadata } from "next";
import { DriverSearchView } from "@/components/driver/driver-search-view";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Driver Search — ParkEase BD",
  description: "Live interactive parking map and search across Dhaka's verified residential bays.",
};

export default function DriverSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto size-7 animate-spin text-[#064E3B]" />
            <p className="mt-3 text-sm text-muted-foreground">Loading Dhaka parking spots…</p>
          </div>
        </div>
      }
    >
      <DriverSearchView />
    </Suspense>
  );
}
