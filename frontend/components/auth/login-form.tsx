"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { resolvePostLoginRedirect } from "@/lib/auth-routing";
import { queryKeys } from "@/lib/query-keys";


export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register, control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false,
    },
  });

  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const rememberMe = useWatch({ control, name: "rememberMe" });

  async function onSubmit(data: LoginFormValues) {
    setSubmitError("");
    try {
      const result = await authApi.login({ identifier: data.identifier, password: data.password, rememberDevice: data.rememberMe });
      queryClient.setQueryData(queryKeys.auth.me, result.user);
      router.push(resolvePostLoginRedirect(result.user, redirect));
    } catch (error) { setSubmitError(getApiErrorMessage(error)); }
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
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your ParkEase BD account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {submitError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{submitError}</div>}
        {/* Email or Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
            Email or Phone Number
          </Label>
          <Input
            id="identifier"
            type="text"
            placeholder="name@example.com or +880 1XXXXXXXXX"
            autoComplete="username"
            aria-invalid={!!errors.identifier}
            className="h-11 text-sm rounded-lg urban-input bg-[#F3F4F6] focus:bg-white border-transparent focus:border-primary focus:ring-1 focus:ring-primary"
            {...register("identifier")}
          />
          {errors.identifier && (
            <p className="text-xs text-destructive font-medium">
              {errors.identifier.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              className="h-11 text-sm pr-10 rounded-lg urban-input bg-[#F3F4F6] focus:bg-white border-transparent focus:border-primary focus:ring-1 focus:ring-primary"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me and Forgot Password below the password field */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) =>
                setValue("rememberMe", checked === true)
              }
              className="rounded"
            />
            <Label
              htmlFor="rememberMe"
              className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
            >
              Remember this device
            </Label>
          </div>

          <Link
            href="/forgot-password"
            className="text-xs font-bold text-primary hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Sign In Button */}
        <Button
          type="submit"
          className="w-full h-11 text-sm font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg shadow-xs transition-all"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-muted-foreground pt-2">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-bold text-primary hover:underline transition-colors"
        >
          Sign Up
        </Link>
      </p>
    </motion.div>
  );
}
