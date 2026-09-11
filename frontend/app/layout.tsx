import type { Metadata } from "next";
import { Geist, Geist_Mono, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ParkEase BD — Smart Shared Parking in Dhaka",
    template: "%s | ParkEase BD",
  },
  description:
    "Find secure, affordable hourly residential parking near your destination in Dhaka. Avoid roadside parking hassle in Dhanmondi, Gulshan, Banani, and beyond.",
  keywords: [
    "parking Dhaka",
    "shared residential parking",
    "hourly parking Dhaka",
    "ParkEase BD",
    "car parking Bangladesh",
    "garage rental Dhaka",
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
      className={`${geistSans.variable} ${geistMono.variable} ${hankenGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-primary selection:text-white">
        {children}
      </body>
    </html>
  );
}
