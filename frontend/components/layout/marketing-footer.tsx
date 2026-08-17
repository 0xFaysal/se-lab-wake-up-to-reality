import Link from "next/link";
import { AppLogo } from "@/components/common/app-logo";

const PRODUCT_LINKS = [
  { href: "/parking", label: "Find Parking" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/safety", label: "Safety" },
  { href: "/about", label: "About Us" },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", label: "Terms & Privacy Policy" },
  { href: "/cancellation-policy", label: "Cancellation & Refund Policy" },
] as const;

const ACCOUNT_LINKS = [
  { href: "/login", label: "Log In" },
  { href: "/register", label: "Create Account" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <AppLogo size="lg" linkTo="/" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Find secure, affordable hourly parking near your destination in
              Dhaka. Connect with verified residential parking spaces.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Product
            </h3>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Legal
            </h3>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Account
            </h3>
            <ul className="space-y-2.5">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t pt-6">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ParkEase BD. All rights reserved.
            A shared parking platform for Dhaka.
          </p>
        </div>
      </div>
    </footer>
  );
}
