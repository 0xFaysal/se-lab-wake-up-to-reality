import Link from "next/link";
import { AppLogo } from "@/components/common/app-logo";

const PRODUCT_LINKS = [
  { href: "/parking", label: "Find Parking" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/safety", label: "Safety & Verification" },
  { href: "/register?role=provider", label: "List Your Space" },
] as const;

const COMPANY_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/how-it-works", label: "Overview" },
  { href: "/safety", label: "Trust & Security" },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", label: "Terms & Privacy Policy" },
  { href: "/cancellation-policy", label: "Cancellation & Refund" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card/70">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="space-y-4 lg:col-span-2">
            <AppLogo size="lg" linkTo="/" />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              A location-based shared residential parking marketplace connecting drivers
              with verified, secure parking spaces across Dhaka.
            </p>
            <div className="pt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Dhaka, Bangladesh</span>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Dhanmondi • Gulshan • Banani • Uttara • Mirpur
              </p>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground font-heading">
              Product
            </h3>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground font-heading">
              Company
            </h3>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground font-heading">
              Legal
            </h3>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} ParkEase BD. All rights reserved. Urban residential parking platform.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-primary transition-colors font-medium">
              Terms & Privacy
            </Link>
            <Link href="/cancellation-policy" className="hover:text-primary transition-colors font-medium">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
