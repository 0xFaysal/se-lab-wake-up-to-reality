"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatPhone } from "@/lib/formatters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function PersonalInfoCard({
  protectUnsavedChanges = false,
}: {
  protectUnsavedChanges?: boolean;
}) {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [draftName, setDraftName] = useState<string | null>(null);
  const fullName = draftName ?? user.data?.fullName ?? "";
  const dirty = draftName !== null && fullName.trim() !== user.data?.fullName;
  useEffect(() => {
    if (!protectUnsavedChanges || !dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !anchor ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        anchor.target === "_blank"
      )
        return;
      const next = new URL(anchor.href);
      if (
        next.pathname === window.location.pathname &&
        next.search === window.location.search
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(anchor.href);
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [protectUnsavedChanges, dirty]);
  const save = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: ({ user: saved }) => {
      queryClient.setQueryData(queryKeys.auth.me, {
        ...user.data,
        fullName: saved.fullName,
      });
      setDraftName(null);
      toast.success("Personal information saved");
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
  return (
    <>
      <section
        className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
        aria-labelledby="personal-info-title"
      >
        <h3 id="personal-info-title" className="text-lg font-bold">
          Personal Information
        </h3>
        <div className="h-px bg-border" />
        {user.isPending && (
          <div role="status" className="p-6 text-center">
            <Loader2
              className="mx-auto size-5 animate-spin"
              aria-hidden="true"
            />
            <span className="sr-only">Loading account</span>
          </div>
        )}
        {user.isError && (
          <div role="alert">
            <p className="text-sm text-red-700">
              {getApiErrorMessage(user.error)}
            </p>
            <Button variant="outline" onClick={() => void user.refetch()}>
              Try again
            </Button>
          </div>
        )}
        {user.data && (
          <>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                save.mutate({ fullName: fullName.trim() });
              }}
            >
              <label
                htmlFor="profile-full-name"
                className="text-sm font-medium"
              >
                Full name
              </label>
              <Input
                id="profile-full-name"
                value={fullName}
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                disabled={save.isPending}
                onChange={(event) => {
                  setDraftName(event.target.value);
                  save.reset();
                }}
              />
              {save.isError && (
                <p role="alert" className="text-sm text-red-700">
                  {getApiErrorMessage(save.error)}
                </p>
              )}
              <Button
                type="submit"
                disabled={
                  save.isPending ||
                  fullName.trim().length < 2 ||
                  fullName.trim() === user.data.fullName
                }
              >
                {save.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {save.isPending ? "Saving..." : "Save name"}
              </Button>
            </form>
            <div className="grid gap-5 text-sm sm:grid-cols-2">
              <Info
                label="Roles"
                value={user.data.roles.join(", ").replaceAll("_", " ")}
              />
              <VerifiedInfo
                label="Email address"
                value={user.data.email}
                verified={user.data.emailVerified}
              />
              <VerifiedInfo
                label="Phone number"
                value={formatPhone(user.data.phone)}
                verified={user.data.phoneVerified}
              />
            </div>
          </>
        )}
      </section>
      <AlertDialog
        open={Boolean(pendingHref)}
        onOpenChange={(open) => !open && setPendingHref(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your name changes have not been saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const href = pendingHref;
                setPendingHref(null);
                setDraftName(null);
                if (href) {
                  const url = new URL(href);
                  if (url.origin === window.location.origin)
                    router.push(url.pathname + url.search + url.hash);
                  else window.location.assign(href);
                }
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
function VerifiedInfo({
  label,
  value,
  verified,
}: {
  label: string;
  value: string;
  verified: boolean;
}) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <strong>{value}</strong>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${verified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
        >
          <Check className="size-3" />
          {verified ? "Verified" : "Not verified"}
        </span>
      </div>
    </div>
  );
}
