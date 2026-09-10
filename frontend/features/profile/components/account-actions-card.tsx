"use client";

import Link from "next/link";
import { LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccountActionsCard() {
  function handleDeleteAccount() {
    if (
      confirm(
        "Are you sure you want to delete your account? This action is permanent and will erase all booking history."
      )
    ) {
      alert("Account deletion request submitted. Our support team will verify and process your request.");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs urban-card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-5">
      {/* Left: Sign Out Button */}
      <div>
        <Link href="/login">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg border-border text-foreground hover:bg-muted font-bold text-sm h-10 px-5 gap-2 cursor-pointer font-heading"
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </Link>
      </div>

      {/* Right: Delete Account Destructive Action */}
      <div className="sm:text-right space-y-0.5">
        <button
          type="button"
          onClick={handleDeleteAccount}
          className="text-xs sm:text-sm font-bold text-destructive hover:underline cursor-pointer font-heading"
        >
          Delete Account
        </button>
        <p className="text-[11px] text-muted-foreground">
          This action is permanent and will erase all booking history.
        </p>
      </div>
    </div>
  );
}
