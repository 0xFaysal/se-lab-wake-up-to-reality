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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    // TODO: Integrate with backend register API
    console.log("Registration submitted:", data);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Create an account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started with ParkEase BD in seconds
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role Selector Tabs */}
        <div className="space-y-2">
          <Label>I want to join as</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue("role", "DRIVER")}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border p-3.5 text-center transition-all cursor-pointer",
                selectedRole === "DRIVER"
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-medium"
                  : "border-input bg-card text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Car className="size-5" />
              <span className="text-sm">Driver / Commuter</span>
            </button>

            <button
              type="button"
              onClick={() => setValue("role", "PARKING_OWNER")}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border p-3.5 text-center transition-all cursor-pointer",
                selectedRole === "PARKING_OWNER"
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-medium"
                  : "border-input bg-card text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Building2 className="size-5" />
              <span className="text-sm">Parking Owner</span>
            </button>
          </div>
          {errors.role && (
            <p className="text-xs text-destructive">{errors.role.message}</p>
          )}
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="e.g. Tanvir Ahmed"
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            className="h-9"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className="h-9"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="01XXXXXXXXX"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            className="h-9"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 chars, 1 uppercase, 1 number"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              className="h-9 pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              className="h-9 pr-10"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Privacy Policy Consent Requirement */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="agreeToPrivacy"
              checked={agreeToPrivacy}
              onCheckedChange={(checked) =>
                setValue("agreeToPrivacy", checked === true, {
                  shouldValidate: true,
                })
              }
              className="mt-0.5 shrink-0"
            />
            <label
              htmlFor="agreeToPrivacy"
              className="text-xs leading-relaxed font-normal text-muted-foreground cursor-pointer select-none"
            >
              I agree to the{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Terms of Service & Privacy Policy
              </Link>{" "}
              and acknowledge that ParkEase BD acts as an intermediary with
              park-at-your-own-risk terms.
            </label>
          </div>
          {errors.agreeToPrivacy && (
            <p className="text-xs text-destructive">
              {errors.agreeToPrivacy.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-10 text-sm font-medium mt-2"
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

      {/* Login Link */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign In
        </Link>
      </p>
    </motion.div>
  );
}
