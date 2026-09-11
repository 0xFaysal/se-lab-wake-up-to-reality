"use client";

import { useState } from "react";
import { Check, Edit2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PersonalInfoCard() {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("Anisa Rahman");
  const [email] = useState("anisa@example.com");
  const [phone, setPhone] = useState("+880 1XXXXXXXXX");
  const [role] = useState("Driver");
  const [isSaving, setIsSaving] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
    }, 500);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs urban-card-shadow space-y-5">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground font-heading">
            Personal Information
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Update your core identity details.
          </p>
        </div>

        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="rounded-lg text-xs font-bold gap-1.5 h-8.5 px-3 border-border cursor-pointer font-heading"
          >
            <Edit2 className="size-3.5" />
            Edit
          </Button>
        )}
      </div>

      <div className="h-px bg-border/80" />

      {/* View or Edit State */}
      {!isEditing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 text-sm">
          {/* Full Name */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">
              Full Name
            </span>
            <p className="font-bold text-foreground font-heading">{fullName}</p>
          </div>

          {/* Role */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">
              Role
            </span>
            <p className="font-bold text-foreground font-heading">{role}</p>
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">
              Email Address
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground font-heading">
                {email}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 font-heading">
                <Check className="size-3 stroke-[3]" />
                Verified
              </span>
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">
              Phone Number
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground font-mono">
                {phone}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 font-heading">
                <Check className="size-3 stroke-[3]" />
                Verified
              </span>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground font-heading">
                Full Name
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-10 text-sm rounded-lg urban-input bg-[#F3F4F6] focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground font-heading">
                Phone Number
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-10 text-sm rounded-lg urban-input bg-[#F3F4F6] focus:bg-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="rounded-lg text-xs font-bold h-9 px-4 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="rounded-lg text-xs font-bold h-9 px-4 bg-[#064E3B] text-white hover:bg-[#003527] cursor-pointer font-heading"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
