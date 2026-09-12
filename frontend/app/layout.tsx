import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: {
    default: "ParkEase BD — Property Owner Portal",
    template: "%s | ParkEase BD",
  },
  description:
    "Manage your residential and commercial parking portfolio, track active bookings, monitor assigned guards and managers, and view real-time revenue across Dhaka.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-primary selection:text-white">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
