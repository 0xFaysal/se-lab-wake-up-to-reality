import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  linkTo?: string;
}

export function AppLogo({
  className,
  size = "default",
  linkTo = "/",
}: AppLogoProps) {
  const sizeClasses = {
    sm: "h-7 w-auto",
    default: "h-8 w-auto",
    lg: "h-9 w-auto sm:h-10",
  };

  const logo = (
    <Image
      src="/Parkease-icon.svg"
      alt="ParkEase BD"
      width={1849}
      height={456}
      unoptimized
      className={cn("select-none object-contain", sizeClasses[size], className)}
    />
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="inline-flex items-center group">
        {logo}
      </Link>
    );
  }
  
  return logo;
}

export function BrandIcon({ className, size = 36 }: { className?: string; size?: number }) {
  return <Image src="/favicon/android-chrome-192x192.png" alt="" aria-hidden="true" width={size} height={size} className={cn("shrink-0 object-contain", className)} />;
}
