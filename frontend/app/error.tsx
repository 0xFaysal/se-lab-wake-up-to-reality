"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error caught by boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs space-y-5">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-100">
          <AlertTriangle className="size-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
            Unable to load page
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {error.message && !error.message.includes("digest")
              ? error.message
              : "Something went wrong while rendering this section. Please try again or return to safety."}
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-slate-400">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-[#064E3B] hover:bg-[#043729] text-white"
          >
            <RotateCcw className="mr-2 size-4" />
            Try Again
          </Button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <Home className="mr-2 size-4" />
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
