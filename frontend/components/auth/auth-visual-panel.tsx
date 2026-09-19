"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShieldCheck, CalendarCheck, Building2 } from "lucide-react";
import { AppLogo } from "@/components/common/app-logo";
import authGateImg from "@/assets/auth-gate.jpg";

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Secure verified parking",
    desc: "Access trusted residential parking spaces with confidence.",
  },
  {
    icon: CalendarCheck,
    title: "Easy booking management",
    desc: "View and manage your parking reservations in real time.",
  },
  {
    icon: Building2,
    title: "Property management",
    desc: "Manage listings and parking operations from one place.",
  },
];

export function AuthVisualPanel() {
  const pathname = usePathname();
  const isRegister = pathname?.includes("register");

  return (
    <div className="relative hidden h-full w-full flex-col justify-between overflow-hidden p-8 sm:p-12 lg:flex">
      {/* Background Image of Premium Residential Gate */}
      <Image
        src={authGateImg}
        alt="ParkEase BD Residential Gate Security"
        fill
        sizes="50vw"
        className="object-cover object-center"
        priority
      />

      {/* Dark overlay gradient for crisp typography contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />

      {/* Top Logo */}
      <div className="relative z-10">
        <AppLogo
          size="lg"
          linkTo="/"
          className="rounded-md bg-white/95 px-3 py-2 shadow-sm"
        />
      </div>

      {/* Bottom Content Area */}
      <div className="relative z-10 max-w-lg space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-[1.12] font-heading">
            {isRegister
              ? "Join the smart parking network."
              : "Welcome back to smarter parking."}
          </h2>
          <p className="text-sm sm:text-base text-white/80 leading-relaxed">
            {isRegister
              ? "Connect with verified residential hosts and parking spaces across Dhaka."
              : "Access your ParkEase BD account and continue managing your parking experience."}
          </p>
        </div>

        {/* 3 Trust-Building Bullet Points with Circular Frosted Icons */}
        <div className="space-y-4 pt-2">
          {TRUST_POINTS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md border border-white/20 shadow-xs">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-heading">
                    {item.title}
                  </h4>
                  <p className="text-xs text-white/75 mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
