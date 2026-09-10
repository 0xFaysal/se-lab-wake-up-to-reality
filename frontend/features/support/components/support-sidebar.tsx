import Link from "next/link";
import {
  ChevronRight,
  Headphones,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

export function SupportSidebar() {
  const QUICK_LINKS = [
    { label: "My Bookings", href: "/driver/bookings" },
    {
      label: "Booking Details",
      href: "/driver/bookings/PKBD-2026-1027-1842",
    },
    { label: "Manage Vehicles", href: "/driver/vehicles" },
    { label: "Payment Methods", href: "/driver/payment-methods" },
    { label: "My Profile", href: "/driver/profile" },
    { label: "Safety", href: "/safety" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. QUICK LINKS Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs urban-card-shadow space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
          Quick Links
        </h4>

        <nav className="divide-y divide-border/60">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center justify-between py-2.5 text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors font-heading group"
            >
              <span>{link.label}</span>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </nav>
      </div>

      {/* 2. Support Online Status Card */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs urban-card-shadow flex items-center gap-3.5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
          <Headphones className="size-5 text-[#064E3B]" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-foreground font-heading">
              Support Online
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Typical response: Within a few minutes. Email response: Within 24
            hours.
          </p>
        </div>
      </div>

      {/* 3. Urgent Safety Help Box (Rose/Red Tint) */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 space-y-2.5">
        <div className="flex items-center gap-2 text-rose-800 font-bold font-heading text-xs sm:text-sm">
          <AlertTriangle className="size-4 text-rose-600 shrink-0" />
          <span>Need urgent safety help?</span>
        </div>

        <p className="text-xs text-rose-900/90 leading-relaxed">
          If you are in immediate danger or face a medical emergency, please
          call <strong>999</strong> first.
        </p>

        <div className="pt-1">
          <Link
            href="/safety"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 hover:underline font-heading"
          >
            <span>View Safety Information</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
