import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  ),
  title: {
    default: "ParkEase BD — Property Owner Portal",
    template: "%s | ParkEase BD",
  },
  description:
    "Manage your residential and commercial parking portfolio, track active bookings, monitor assigned guards and managers, and view real-time revenue across Dhaka.",
  applicationName: "ParkEase BD",
  manifest: "/favicon/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: "ParkEase BD",
    title: "ParkEase BD — Smart Shared Parking in Dhaka",
    description: "Find, book, and manage verified parking spaces across Dhaka.",
    images: [{ url: "/Parkease-icon.svg", width: 1749, height: 456, alt: "ParkEase BD" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ParkEase BD — Smart Shared Parking in Dhaka",
    description: "Find, book, and manage verified parking spaces across Dhaka.",
    images: ["/Parkease-icon.svg"],
  },
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
