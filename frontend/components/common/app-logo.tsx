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
    sm: "text-lg",
    default: "text-xl",
    lg: "text-2xl",
  };

  const logo = (
    <span
      className={cn(
        "font-heading font-bold tracking-tight select-none",
        sizeClasses[size],
        className
      )}
    >
      <span className="text-foreground">Park</span>
      <span className="text-foreground">Ease</span>
      <span className="text-primary"> BD</span>
    </span>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="inline-flex items-center gap-1.5">
        {logo}
      </Link>
    );
  }

  return logo;
}
