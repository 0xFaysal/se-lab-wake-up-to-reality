import {
  Banknote,
  Bell,
  Building2,
  CalendarClock,
  CalendarDays,
  CircleParking,
  Clock3,
  CreditCard,
  LayoutGrid,
  LifeBuoy,
  ListChecks,
  LockKeyhole,
  MessageSquareQuote,
  MonitorSmartphone,
  Plus,
  Radio,
  Scale,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ProviderNavItem = { label: string; href: string; icon: LucideIcon };
export const providerGroups: Array<{
  label: string;
  items: ProviderNavItem[];
}> = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/provider/dashboard", icon: LayoutGrid },
    ],
  },
  {
    label: "Properties & parking",
    items: [
      { label: "Properties", href: "/provider/properties", icon: Building2 },
      { label: "Add property", href: "/provider/properties/new", icon: Plus },
      { label: "Resources", href: "/provider/parking", icon: CircleParking },
      { label: "Listings", href: "/provider/listings", icon: ListChecks },
      {
        label: "Availability",
        href: "/provider/availability",
        icon: CalendarClock,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Bookings", href: "/provider/bookings", icon: CalendarDays },
      { label: "Live sessions", href: "/provider/sessions", icon: Radio },
      { label: "Guards", href: "/provider/guards", icon: ShieldCheck },
      { label: "Managers", href: "/provider/managers", icon: Users },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Earnings", href: "/provider/earnings", icon: Banknote },
      { label: "Payouts", href: "/provider/payouts", icon: Clock3 },
      {
        label: "Payout methods",
        href: "/provider/settings/payout-methods",
        icon: CreditCard,
      },
    ],
  },
  {
    label: "Updates & support",
    items: [
      { label: "Reviews", href: "/provider/reviews", icon: MessageSquareQuote },
      { label: "Disputes", href: "/provider/disputes", icon: Scale },
      { label: "Notifications", href: "/provider/notifications", icon: Bell },
      { label: "Support", href: "/provider/support", icon: LifeBuoy },
      { label: "Approvals", href: "/provider/approvals", icon: ShieldCheck },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", href: "/provider/profile", icon: UserRound },
      { label: "Settings", href: "/provider/settings", icon: Settings },
      {
        label: "Security",
        href: "/provider/account/security",
        icon: LockKeyhole,
      },
      {
        label: "Account sessions",
        href: "/provider/account/sessions",
        icon: MonitorSmartphone,
      },
    ],
  },
];
export const mobilePrimary = [
  "/provider/dashboard",
  "/provider/properties",
  "/provider/bookings",
  "/provider/earnings",
].map((href) =>
  providerGroups
    .flatMap((group) => group.items)
    .find((item) => item.href === href)!,
);
export function providerRouteActive(pathname: string, href: string) {
  const match = providerGroups
    .flatMap((group) => group.items)
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.href === href;
}
