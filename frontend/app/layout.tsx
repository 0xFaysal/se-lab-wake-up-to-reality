import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ParkEase BD — Shared Parking in Dhaka",
    template: "%s | ParkEase BD",
  },
  description:
    "Find secure, affordable hourly parking near your destination in Dhaka. ParkEase BD connects drivers with verified residential parking spaces.",
  keywords: [
    "parking",
    "Dhaka",
    "shared parking",
    "hourly parking",
    "ParkEase",
    "Bangladesh",
    "residential parking",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
