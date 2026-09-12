"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppLogo } from "@/components/common/app-logo";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api/auth-api";
import { queryKeys } from "@/lib/query-keys";
import { destinationForUser } from "@/lib/auth-routing";
import { LogoutButton } from "@/components/auth/logout-button";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/parking", label: "Find Parking" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/safety", label: "Safety" },
  { href: "/about", label: "About" },
] as const;

export function MarketingHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const auth = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => (await authApi.me({ skipAuthRefresh: true })).user,
    retry: false,
  });
  const user = auth.data;
  const dashboardHref = user ? destinationForUser(user) : "/login";
  const firstName = user?.fullName.trim().split(/\s+/)[0] || "Account";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <AppLogo size="default" />

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-2 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium tracking-tight transition-colors hover:text-primary",
                pathname === link.href
                  ? "text-primary font-semibold bg-primary/8"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden min-w-52 items-center justify-end gap-3 md:flex">
          {auth.isPending ? <div className="h-9 w-36 animate-pulse rounded-lg bg-muted" /> : user ? <>
          <Link
            href={dashboardHref}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-sm font-semibold")}
          >
            Hi, {firstName}
          </Link>
          <Link
            href={dashboardHref}
            className={cn(buttonVariants({ size: "sm" }), "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90")}
          >
            Dashboard
          </Link>
          </> : <>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-sm font-semibold text-foreground hover:text-primary px-3.5 py-2"
            )}
          >
            Log In
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-primary text-white hover:bg-primary/90 text-sm font-semibold px-4 py-2 rounded-lg shadow-xs"
            )}
          >
            Get Started
          </Link>
          </>}
        </div>

        {/* Mobile Hamburger & Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/parking"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <Search className="size-5" />
            <span className="sr-only">Search parking</span>
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <button
                  className={buttonVariants({ variant: "ghost", size: "icon" })}
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? (
                    <X className="size-5" />
                  ) : (
                    <Menu className="size-5" />
                  )}
                </button>
              }
            />
            <SheetContent side="right" className="w-72 pt-12 bg-card">
              <div className="mb-6 px-4">
                <AppLogo size="sm" />
              </div>
              <nav className="flex flex-col gap-1.5">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-lg px-4 py-2.5 text-base font-medium transition-colors hover:bg-muted",
                      pathname === link.href
                        ? "text-primary font-semibold bg-primary/8"
                        : "text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="my-4 h-px bg-border" />
                {auth.isPending ? <div className="mx-4 h-11 animate-pulse rounded-lg bg-muted" /> : user ? <>
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-base font-semibold text-primary transition-colors hover:bg-muted"
                >
                  Hi, {firstName} · Dashboard
                </Link>
                <div className="px-4 pt-2"><LogoutButton className="w-full justify-center" /></div>
                </> : <><Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Log In
                </Link>
                <div className="px-4 pt-2">
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "w-full justify-center bg-primary text-white font-semibold text-sm"
                    )}
                  >
                    Get Started
                  </Link>
                </div>
                </>}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
