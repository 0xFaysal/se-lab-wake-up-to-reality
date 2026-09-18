"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ShieldCheck,
  Building2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  ArrowRight,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  managerActivationSchema,
  type ManagerActivationFormValues,
} from "@/lib/validations/kyc";

export function ManagerActivationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ownerName = searchParams.get("owner") || "Mohammad Rahim Uddin";
  const propertyName = searchParams.get("property") || "Dhanmondi Lakeview Residential Garage";
  const email = searchParams.get("email") || "manager.operations@parkease.bd";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ManagerActivationFormValues>({
    resolver: zodResolver(managerActivationSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const watchedPassword = useWatch({ control, name: "password" }) || "";
  const watchedAgree = useWatch({ control, name: "agreeToTerms" });

  const hasMinLength = watchedPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(watchedPassword);
  const hasNumber = /[0-9]/.test(watchedPassword);

  async function onSubmit(data: ManagerActivationFormValues) {
    // Simulated activation delay
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setIsActivated(true);
  }

  if (isActivated) {
    return (
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-center shadow-xs space-y-5">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="size-8 text-[#064E3B]" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-extrabold text-foreground font-heading">
            Manager Account Activated!
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            Your security credentials have been established. You now have operational access to manage assigned parking bays.
          </p>
        </div>

        <div className="rounded-xl bg-[#f9f9ff] border border-[#E5E7EB] p-4 text-xs text-left space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Assigned Property:</span>
            <span className="font-bold text-foreground">{propertyName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Property Owner:</span>
            <span className="font-semibold text-foreground">{ownerName}</span>
          </div>
        </div>

        <Button
          onClick={() => router.push("/manager/dashboard")}
          className="w-full h-11 text-sm font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg shadow-sm"
        >
          Go to Manager Portal
          <ArrowRight className="size-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-xs space-y-6">
      {/* Welcome Message Card */}
      <div className="rounded-xl border border-[#064E3B]/20 bg-[#064E3B]/5 p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#064E3B] uppercase tracking-wider font-heading">
          <Sparkles className="size-3.5" />
          <span>Exclusive Invitation</span>
        </div>
        <h2 className="text-lg font-bold text-foreground font-heading">
          Welcome to ParkEase BD
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          You have been invited by <strong className="text-foreground font-semibold">{ownerName}</strong> to act as an authorized Operations Manager for <strong className="text-foreground font-semibold">{propertyName}</strong>.
        </p>
        <div className="pt-1 flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
          <span>Account Login:</span>
          <span className="font-bold text-foreground">{email}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Create Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
            Create Master Password *
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-10 text-sm pr-10 rounded-lg bg-[#F9FAFB] focus:bg-white border-[#E5E7EB] focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
          )}

          {/* Password requirement checklist */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span
                className={`size-1.5 rounded-full ${
                  hasMinLength ? "bg-emerald-600" : "bg-muted-foreground/40"
                }`}
              />
              <span className={hasMinLength ? "text-emerald-700 font-semibold" : "text-muted-foreground"}>
                8+ characters
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span
                className={`size-1.5 rounded-full ${
                  hasUppercase ? "bg-emerald-600" : "bg-muted-foreground/40"
                }`}
              />
              <span className={hasUppercase ? "text-emerald-700 font-semibold" : "text-muted-foreground"}>
                1 uppercase
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span
                className={`size-1.5 rounded-full ${
                  hasNumber ? "bg-emerald-600" : "bg-muted-foreground/40"
                }`}
              />
              <span className={hasNumber ? "text-emerald-700 font-semibold" : "text-muted-foreground"}>
                1 number
              </span>
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
            Confirm Password *
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-10 text-sm pr-10 rounded-lg bg-[#F9FAFB] focus:bg-white border-[#E5E7EB] focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Agreement Checkbox */}
        <div className="rounded-lg border border-[#E5E7EB] bg-[#f9f9ff] p-3.5 space-y-1">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="agreeToTerms"
              checked={watchedAgree}
              onCheckedChange={(checked) =>
                setValue("agreeToTerms", checked === true, { shouldValidate: true })
              }
              className="mt-0.5"
            />
            <Label
              htmlFor="agreeToTerms"
              className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
            >
              I accept the ParkEase BD Manager Operational Code of Conduct and acknowledge that all actions performed under my account are recorded in immutable audit logs.
            </Label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-xs text-destructive font-medium">{errors.agreeToTerms.message}</p>
          )}
        </div>

        {/* Deep Emerald CTA */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 text-sm font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Activating Account…
            </>
          ) : (
            <>
              Activate Account
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
