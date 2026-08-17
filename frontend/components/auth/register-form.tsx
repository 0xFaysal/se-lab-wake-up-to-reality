"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Car, Building2 } from "lucide-react";

import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "DRIVER",
      agreeToPrivacy: true,
    },
  });

  const selectedRole = watch("role");
  const agreeToPrivacy = watch("agreeToPrivacy");

  async function onSubmit(data: RegisterFormValues) {
    console.log("Registration submitted:", data);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="space-y-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join the smart shared parking marketplace in Dhaka.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role Selector Tabs */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
            I want to join as
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue("role", "DRIVER")}
              className={cn(
                "flex items-center justify-center gap-2.5 rounded-xl border p-3 text-center transition-all cursor-pointer",
                selectedRole === "DRIVER"
                  ? "border-primary bg-primary/8 text-primary ring-2 ring-primary/20 font-bold"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40 font-medium"
              )}
            >
              <Car className="size-4" />
              <span className="text-xs">Driver / Commuter</span>
            </button>

            <button
              type="button"
              onClick={() => setValue("role", "PARKING_OWNER")}
              className={cn(
                "flex items-center justify-center gap-2.5 rounded-xl border p-3 text-center transition-all cursor-pointer",
                selectedRole === "PARKING_OWNER"
                  ? "border-primary bg-primary/8 text-primary ring-2 ring-primary/20 font-bold"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40 font-medium"
              )}
            >
              <Building2 className="size-4" />
              <span className="text-xs">Parking Owner</span>
            </button>
          </div>
          {errors.role && (
            <p className="text-xs text-destructive">{errors.role.message}</p>
          )}
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
            Full Name
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="e.g. Tanvir Ahmed"
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            className="h-10 text-sm rounded-lg urban-input bg-[#F3F4F6] focus:bg-white border-transparent focus:border-primary focus:ring-1 focus:ring-primary"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="text-xs text-destructive font-medium">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className="h-10 text-sm rounded-lg urban-input bg-[#F3F4F6] focus:bg-white border-transparent focus:border-primary focus:ring-1 focus:ring-primary"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="017XXXXXXXX"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            className="h-10 text-sm rounded-lg urban-input bg-[#F3F4F6] focus:bg-white border-transparent focus:border-primary focus:ring-1 focus:ring-primary"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-destructive font-medium">{errors.phone.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 chars, 1 uppercase, 1 number"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              className="h-10 text-sm pr-10 rounded-lg urban-input bg-[#F3F4F6] focus:bg-white border-transparent focus:border-primary focus:ring-1 focus:ring-primary"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Hidden confirm password autofill match */}
        <input
          type="hidden"
          value={watch("password")}
          {...register("confirmPassword")}
        />

        {/* Required Privacy Policy Consent */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="agreeToPrivacy"
              checked={agreeToPrivacy}
              onCheckedChange={(checked) =>
                setValue("agreeToPrivacy", checked === true, {
                  shouldValidate: true,
                })
              }
              className="mt-0.5 shrink-0 rounded"
            />
            <label
              htmlFor="agreeToPrivacy"
              className="text-xs leading-relaxed font-normal text-muted-foreground cursor-pointer select-none"
            >
              I agree to the{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Terms of Service & Privacy Policy
              </Link>{" "}
              and acknowledge that ParkEase BD acts as an intermediary with
              park-at-your-own-risk terms.
            </label>
          </div>
          {errors.agreeToPrivacy && (
            <p className="text-xs text-destructive font-medium">
              {errors.agreeToPrivacy.message}
            </p>
          )}
        </div>

        {/* Create Account Button */}
        <Button
          type="submit"
          className="w-full h-11 text-sm font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg shadow-xs transition-all mt-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      {/* Sign In Link */}
      <p className="text-center text-sm text-muted-foreground pt-1">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-primary hover:underline transition-colors"
        >
          Sign In
        </Link>
      </p>
    </motion.div>
  );
}
