"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Bell,
  ChevronDown,
  Car,
  Calendar,
  LogOut,
  User,
  Menu,
  X,
  Shield,
  Search,
} from "lucide-react";
import { AppLogo } from "@/components/common/app-logo";
import { MOCK_DRIVER_PROFILE } from "@/lib/data/mock-driver-data";
import { cn } from "@/lib/utils";
import avatarAnisaImg from "@/assets/avatar-anisa.jpg";

const NAV_LINKS = [
  { href: "/parking", label: "Find Parking" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/driver/bookings", label: "My Bookings" },
  { href: "/safety", label: "Safety" },
];

export function DriverHeader() {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasNotifications] = useState(true);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-8">
          <AppLogo />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/driver/bookings"
                  ? pathname.startsWith("/driver/bookings")
                  : pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "text-primary font-bold"
                      : "text-foreground/80 hover:text-primary"
                  )}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Notifications & User Profile Dropdown */}
        <div className="hidden md:flex items-center gap-4">
          {/* Notification Button */}
          <button
            aria-label="View notifications"
            className="relative flex size-10 items-center justify-center rounded-full text-foreground/80 hover:bg-muted transition-colors cursor-pointer"
          >
            <Bell className="size-5" />
            {hasNotifications && (
              <span className="absolute top-2 right-2 size-2 rounded-full bg-primary ring-2 ring-background" />
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 rounded-full border border-border bg-card p-1.5 pr-3 hover:shadow-xs transition-all cursor-pointer"
            >
              <div className="relative size-8 overflow-hidden rounded-full ring-1 ring-primary/20">
                <Image
                  src={avatarAnisaImg}
                  alt={MOCK_DRIVER_PROFILE.name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-sm font-bold text-foreground font-heading">
                {MOCK_DRIVER_PROFILE.name.split(" ")[0]}
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl z-50 animate-in fade-in-50 zoom-in-95"
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-border/60 mb-1">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-bold text-foreground truncate">
                    {MOCK_DRIVER_PROFILE.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {MOCK_DRIVER_PROFILE.email}
                  </p>
                </div>

                <Link
                  href="/driver/bookings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-foreground rounded-xl hover:bg-muted transition-colors"
                >
                  <Calendar className="size-4 text-primary" />
                  My Bookings
                </Link>

                <Link
                  href="/driver/vehicles"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-foreground rounded-xl hover:bg-muted transition-colors"
                >
                  <Car className="size-4 text-primary" />
                  Manage Vehicles
                </Link>

                <Link
                  href="/parking"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-foreground rounded-xl hover:bg-muted transition-colors"
                >
                  <Search className="size-4 text-primary" />
                  Find Parking
                </Link>

                <div className="border-t border-border/60 my-1" />

                <Link
                  href="/login"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-destructive rounded-xl hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="size-4" />
                  Sign Out
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex md:hidden size-10 items-center justify-center rounded-xl border border-border text-foreground"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card px-4 py-4 space-y-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-border/60 pt-2 space-y-1">
            <Link
              href="/driver/vehicles"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted"
            >
              <Car className="size-4 text-primary" /> Manage Vehicles
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" /> Sign Out
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
