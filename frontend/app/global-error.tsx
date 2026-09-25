"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service or console
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f9f9ff] text-[#141b2b] flex flex-col items-center justify-center p-6 antialiased font-sans">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-slate-200 text-center space-y-5">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-100">
            <svg
              className="size-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-600">
              An unexpected system error occurred. We have logged the details and are working to resolve it.
            </p>
            {error?.digest && (
              <p className="text-xs font-mono text-slate-400">
                Error Reference: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-[#064E3B] px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#043729] transition cursor-pointer"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
