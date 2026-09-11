import Link from "next/link";
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
    sm: "text-base",
    default: "text-lg",
    lg: "text-xl sm:text-2xl",
  };

  const markSize = {
    sm: "size-6 text-xs",
    default: "size-7 text-xs font-bold",
    lg: "size-8 text-sm font-black",
  };

  const logo = (
    <div className={cn("inline-flex items-center gap-2 select-none", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-lg bg-primary text-white font-mono shadow-xs",
          markSize[size]
        )}
      >
        P
      </span>
      <span className={cn("font-heading font-extrabold tracking-tight text-foreground", sizeClasses[size])}>
        ParkEase <span className="text-primary">BD</span>
      </span>
    </div>
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
