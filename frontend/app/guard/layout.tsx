import type { Metadata, Viewport } from "next";
import { GuardShell } from "@/features/guard/components/guard-shell";

export const metadata: Metadata = {
  title: {
    default: "Guard Operations",
    template: "%s | Guard Portal | ParkEase BD",
  },
  description: "Secure booking verification, check-in, active-session and checkout operations for assigned ParkEase BD guards.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#063f32",
};

export default function GuardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuardShell>{children}</GuardShell>;
}
