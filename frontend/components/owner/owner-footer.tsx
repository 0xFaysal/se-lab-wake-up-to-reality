import React from "react";
import Link from "next/link";

export function OwnerFooter() {
  return (
    <footer className="mt-auto border-t border-[#E5E7EB] bg-white py-6 px-6 sm:px-8 lg:px-10 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-bold text-slate-800">ParkEase BD</span>{" "}
          <span>© 2026 ParkEase BD. All rights reserved. Urban Harmony SaaS Platform.</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-slate-800 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate-800 transition-colors">
            Terms of Service
          </Link>
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
            System Status
          </span>
        </div>
      </div>
    </footer>
  );
}
