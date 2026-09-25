"use client";

import React from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-slate-900 font-sans antialiased">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-200 text-center space-y-5">
          <div className="size-14 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl font-bold">
            !
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
              Application Error
            </h2>
            <p className="text-sm text-slate-500">
              An unexpected error occurred while loading this view.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => reset()}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            >
              Try again
            </button>
            <Link
              href="/"
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all text-center"
            >
              Return Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
