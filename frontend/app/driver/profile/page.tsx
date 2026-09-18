import type { Metadata } from "next";
import { PersonalInfoCard } from "@/features/profile/components/personal-info-card";
import { SecuritySettingsCard } from "@/features/profile/components/security-settings-card";
import { PreferencesCard } from "@/features/profile/components/preferences-card";
import { AccountActionsCard } from "@/features/profile/components/account-actions-card";
import { ProfileSidebar } from "@/features/profile/components/profile-sidebar";

export const metadata: Metadata = {
  title: "My Profile",
  description:
    "Manage your personal information, account security, and preferences on ParkEase BD.",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 pb-12">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          My Profile
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your personal information, account security, and preferences.
        </p>
      </div>

      {/* Main Grid: 2/3 Content (Left) + 1/3 Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Personal Information Card */}
          <PersonalInfoCard />

          {/* 2. Account Security Card */}
          <SecuritySettingsCard />

          {/* 3. Preferences Card */}
          <PreferencesCard />

          {/* 4. Account Actions Card */}
          <AccountActionsCard />
        </div>

        {/* Right Column (4 cols) - Sticky Sidebar */}
        <div className="lg:col-span-4 sticky top-24">
          <ProfileSidebar />
        </div>
      </div>
    </div>
  );
}
