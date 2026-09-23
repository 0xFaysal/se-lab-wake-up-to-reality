"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { authApi } from "@/lib/api/auth-api";
import { destinationForUser } from "@/lib/auth-routing";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangeInitialPasswordForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);

    try {
      const result = await authApi.changeInitialPassword({
        currentPassword,
        newPassword,
      });
      queryClient.setQueryData(queryKeys.auth.me, result.user);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      router.replace(destinationForUser(result.user));
    } catch (caught) {
      setError(getApiErrorMessage(caught));
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
        <ShieldCheck className="size-4" />
        Required security step
      </div>

      <div>
        <h1 className="text-3xl font-extrabold">Create your private password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Replace the one-time setup password before accessing your portal.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700"
          >
            {error}
          </div>
        )}

        <PasswordField
          id="current-password"
          label="Current setup password"
          value={currentPassword}
          setValue={setCurrentPassword}
          autoComplete="current-password"
          minLength={1}
        />
        <PasswordField
          id="new-password"
          label="New password"
          value={newPassword}
          setValue={setNewPassword}
          autoComplete="new-password"
          minLength={12}
        />
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          value={confirmPassword}
          setValue={setConfirmPassword}
          autoComplete="new-password"
          minLength={12}
        />

        <p className="text-xs leading-relaxed text-muted-foreground">
          Use at least 12 characters with uppercase, lowercase, number and special character.
        </p>

        <Button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="h-11 w-full bg-[#064E3B]"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <KeyRound className="size-4" />
          )}
          Update password securely
        </Button>
      </form>
    </div>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  setValue: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  minLength: number;
}

function PasswordField({
  id,
  label,
  value,
  setValue,
  autoComplete,
  minLength,
}: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        required
        minLength={minLength}
        maxLength={128}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoComplete={autoComplete}
      />
    </div>
  );
}
