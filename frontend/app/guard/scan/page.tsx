import React, { Suspense } from "react";
import { GuardScanView } from "@/features/guard/components/guard-scan-view";

export default function GuardScanPage() {
  return (
    <Suspense fallback={<div className="flex h-60 items-center justify-center text-xs text-gray-400">Loading Scanner...</div>}>
      <GuardScanView />
    </Suspense>
  );
}
