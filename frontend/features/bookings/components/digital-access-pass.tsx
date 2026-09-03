import { Lock, QrCode } from "lucide-react";
import Image from "next/image";
import stepAccessQrImg from "@/assets/step-access-qr.jpg";

interface DigitalAccessPassProps {
  accessOtp: string;
  propertyTitle?: string;
}

export function DigitalAccessPass({
  accessOtp,
  propertyTitle = "Gulshan Residential Parking",
}: DigitalAccessPassProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#064E3B] p-6 sm:p-8 text-white shadow-xl">
      {/* Geometric background ambient accents */}
      <div className="absolute -right-16 -top-16 size-60 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 size-60 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: High-Contrast QR Code Card */}
        <div className="md:col-span-5 flex justify-center md:justify-start">
          <div className="relative size-44 sm:size-48 rounded-2xl bg-white p-3 shadow-2xl flex flex-col items-center justify-between border-4 border-emerald-950/20">
            {/* Embedded QR Code Graphic */}
            <div className="relative size-32 sm:size-36 flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden">
              <Image
                src={stepAccessQrImg}
                alt="Digital Access QR Code Pass"
                fill
                className="object-cover"
              />
            </div>
            <div className="w-full text-center py-0.5 border-t border-gray-100">
              <span className="text-[10px] font-bold text-gray-800 tracking-wider font-mono uppercase">
                Gate Pass ID: {accessOtp}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Pass Details & Instructions */}
        <div className="md:col-span-7 space-y-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-100 backdrop-blur-xs border border-white/20 font-heading">
              Gate Access
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading mt-2">
              Digital Access Pass
            </h2>
            <p className="text-xs sm:text-sm text-emerald-50/90 leading-relaxed mt-1">
              Present this QR code or Access OTP to the assigned parking guard
              upon arrival at {propertyTitle}.
            </p>
          </div>

          {/* Prominent Access OTP Box */}
          <div className="inline-flex flex-col rounded-xl bg-emerald-950/60 border border-white/20 px-5 py-2.5 backdrop-blur-sm shadow-inner">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/80">
              Access OTP
            </span>
            <span className="text-2xl sm:text-3xl font-black tracking-widest text-white font-mono leading-tight">
              {accessOtp}
            </span>
          </div>

          {/* Security Notice Banner */}
          <div className="flex items-start gap-2.5 rounded-xl bg-white/10 p-3 text-xs text-emerald-100 border border-white/15">
            <Lock className="size-4 shrink-0 mt-0.5 text-emerald-300" />
            <span className="leading-snug">
              Never share your parking access credentials outside the ParkEase BD
              verification process.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
