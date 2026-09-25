import React from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="size-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 shadow-xs">
        <Search className="size-8" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-heading sm:text-4xl mb-3">
        Page not found
      </h1>
      <p className="max-w-md text-sm sm:text-base text-slate-500 mb-8 leading-relaxed">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-all active:scale-[0.99]"
        >
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>
        <Link
          href="/parking"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all"
        >
          Find Parking
        </Link>
      </div>
    </div>
  );
}
