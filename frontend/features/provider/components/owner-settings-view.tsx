"use client";

import React, { useState } from "react";
import {
  User,
  Shield,
  Bell,
  Landmark,
  Sliders,
  CheckCircle2,
  Lock,
  Smartphone,
  Laptop,
  Download,
  FileText,
  Scale,
  AlertOctagon,
  Camera,
  Check,
  X,
  Info,
  Building,
} from "lucide-react";
import { OwnerHeader } from "@/components/provider/provider-header";
import { MOCK_OWNER_PROFILE } from "@/lib/data/mock-owner-data";

type TabKey = "profile" | "security" | "notifications" | "payout" | "preferences";

export function OwnerSettingsView() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Profile Form State
  const [fullName, setFullName] = useState(MOCK_OWNER_PROFILE.name);
  const [email, setEmail] = useState(MOCK_OWNER_PROFILE.email);
  const [phone, setPhone] = useState(MOCK_OWNER_PROFILE.phone);
  const [address, setAddress] = useState("Dhaka, Bangladesh");

  // Security Toggles & State
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [is2faEnabled, setIs2faEnabled] = useState(true);

  // Notification Preferences Toggles
  const [eventTriggers, setEventTriggers] = useState({
    bookingAlerts: true,
    paymentAlerts: true,
    payoutAlerts: true,
    reviewAlerts: true,
    guardActivity: true,
    managerActivity: true,
    systemAlerts: true,
  });

  const [channels, setChannels] = useState({
    inApp: true,
    email: true,
    sms: true,
    push: false,
  });

  // Preferences Dropdowns
  const [currency, setCurrency] = useState("BDT");
  const [language, setLanguage] = useState("en-UK");
  const [timeZone, setTimeZone] = useState("Asia/Dhaka");
  const [dateFormat, setDateFormat] = useState("DD MMM YYYY");
  const [dashboardRange, setDashboardRange] = useState("30D");
  const [themeDisplay, setThemeDisplay] = useState("system");

  // Manager Access Defaults Toggles
  const [managerDefaults, setManagerDefaults] = useState({
    manageListings: true,
    manageBookings: true,
    manageGuards: true,
    viewEarnings: false,
    respondToReviews: true,
    managePayouts: false, // permanently locked
  });

  // Modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Provider profile details updated successfully.");
  };

  const handleSaveNotifications = () => {
    showToast("Notification triggers and channels synchronized.");
  };

  const handleSavePreferences = () => {
    showToast("Regional localization & preferences saved.");
  };

  const handleSaveAll = () => {
    showToast("All settings and configurations saved.");
  };

  const handleDiscard = () => {
    setFullName(MOCK_OWNER_PROFILE.name);
    setEmail(MOCK_OWNER_PROFILE.email);
    setPhone(MOCK_OWNER_PROFILE.phone);
    setAddress("Dhaka, Bangladesh");
    showToast("Unsaved changes discarded.");
  };

  return (
    <div className="flex flex-col min-h-full relative bg-[#f9f9ff] pb-24">
      {/* Top Header */}
      <OwnerHeader
        title="Settings"
        subtitle="Manage your provider profile, security, notifications, payout account, and account preferences."
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-24 right-8 z-50 bg-[#064E3B] text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <Check className="size-4 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Content Container */}
      <div className="p-6 sm:p-8 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6">
        {/* ==================================================================== */}
        {/* TOP NAVIGATION TABS & PRIVILEGES BADGE                               */}
        {/* ==================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-[#E5E7EB] rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#064E3B] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <User className="size-3.5" />
              <span>Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "security"
                  ? "bg-[#064E3B] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Shield className="size-3.5" />
              <span>Security</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "notifications"
                  ? "bg-[#064E3B] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Bell className="size-3.5" />
              <span>Notifications</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("payout")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "payout"
                  ? "bg-[#064E3B] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Landmark className="size-3.5" />
              <span>Payout Account</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("preferences")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "preferences"
                  ? "bg-[#064E3B] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Sliders className="size-3.5" />
              <span>Preferences</span>
            </button>
          </div>

          {/* Right privileges indicator */}
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Provider Privileges: <strong className="text-slate-900">Full Administrative Access</strong></span>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 2-COLUMN SETTINGS GRID                                               */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ================================================================== */}
          {/* ROW 1 LEFT: PROVIDER PROFILE                                       */}
          {/* ================================================================== */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                  <User className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-slate-900">
                    Provider Profile
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Public presence and provider contact credentials
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Check className="size-3 text-emerald-600" />
                Verified Provider
              </span>
            </div>

            {/* Avatar & Meta info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="size-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl font-heading shadow-sm">
                  {MOCK_OWNER_PROFILE.initials}
                </div>
                <button
                  type="button"
                  onClick={() => alert("Upload custom avatar dialog.")}
                  title="Change photo"
                  className="absolute -bottom-1 -right-1 size-6 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-2xs cursor-pointer"
                >
                  <Camera className="size-3" />
                </button>
              </div>

              <div className="min-w-0">
                <h4 className="text-sm font-bold font-heading text-slate-900 truncate">
                  {fullName}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Managing 3 Dhaka Commercial & Residential Properties
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Account ID: #OW-78401 • Member since May 2024
                </p>
              </div>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Role (System Designated)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value="Parking Provider"
                      className="w-full h-9.5 pl-3 pr-20 rounded-lg border border-slate-200 bg-slate-100 text-slate-700 font-semibold cursor-not-allowed"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      READ-ONLY
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Primary Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <Info className="size-3.5 text-slate-400 shrink-0" />
                <span>Your public provider name may be visible on parking listings and review responses.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => alert("Editing public presence profile view.")}
                  className="px-3.5 py-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 font-semibold text-slate-700 transition cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-semibold shadow-2xs transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* ================================================================== */}
          {/* ROW 1 RIGHT: SECURITY                                              */}
          {/* ================================================================== */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                  <Shield className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-slate-900">
                    Security
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Authentication safeguards and login controls
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                PROTECTED
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Password row */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-[#fcfcfd]">
                <div>
                  <h4 className="font-bold text-slate-900">Password</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Last changed 42 days ago
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 font-semibold text-slate-700 transition cursor-pointer"
                >
                  Change Password
                </button>
              </div>

              {/* 2FA row */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-[#fcfcfd]">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900">Two-Factor Authentication</h4>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Enabled
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Authenticator App (TOTP) active
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIs2faModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 font-semibold text-slate-700 transition cursor-pointer"
                >
                  Manage 2FA
                </button>
              </div>

              {/* Active Sessions row */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-[#fcfcfd]">
                <div className="min-w-0 pr-2">
                  <h4 className="font-bold text-slate-900">
                    Active Sessions <span className="text-slate-400 font-normal">• 3 devices</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    MacBook Pro (Gulshan, Current), iPhone 15, Chrome Windows
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSessionsModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 font-semibold text-slate-700 transition cursor-pointer shrink-0"
                >
                  View Sessions
                </button>
              </div>

              {/* Login Alerts toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-[#fcfcfd]">
                <div>
                  <h4 className="font-bold text-slate-900">Login Alerts</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Notify immediately on unfamiliar IP or location
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={loginAlerts}
                  onClick={() => setLoginAlerts(!loginAlerts)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    loginAlerts ? "bg-[#064E3B]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      loginAlerts ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <Lock className="size-3.5 text-slate-400 shrink-0" />
                <span>We&apos;ll notify you about unusual sign-in activity via verified SMS &amp; email.</span>
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* ROW 2 LEFT: NOTIFICATION PREFERENCES                               */}
          {/* ================================================================== */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                  <Bell className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-slate-900">
                    Notification Preferences
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Control alert frequency across events and communication channels
                  </p>
                </div>
              </div>

              <span className="text-xs text-slate-400 font-medium">Auto-synced</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              {/* Event Triggers */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  EVENT TRIGGERS
                </span>
                {[
                  { key: "bookingAlerts", label: "Booking Alerts" },
                  { key: "paymentAlerts", label: "Payment Alerts" },
                  { key: "payoutAlerts", label: "Payout Alerts" },
                  { key: "reviewAlerts", label: "Review Alerts" },
                  { key: "guardActivity", label: "Guard Activity" },
                  { key: "managerActivity", label: "Manager Activity" },
                  { key: "systemAlerts", label: "System Alerts" },
                ].map(({ key, label }) => {
                  const isChecked = eventTriggers[key as keyof typeof eventTriggers];
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-slate-800 font-medium">{label}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isChecked}
                        onClick={() =>
                          setEventTriggers((prev) => ({
                            ...prev,
                            [key]: !prev[key as keyof typeof eventTriggers],
                          }))
                        }
                        className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          isChecked ? "bg-[#064E3B]" : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition ${
                            isChecked ? "translate-x-3.5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Channels */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  CHANNELS
                </span>
                {[
                  { key: "inApp", label: "In-App" },
                  { key: "email", label: "Email" },
                  { key: "sms", label: "SMS" },
                  { key: "push", label: "Push" },
                ].map(({ key, label }) => {
                  const isChecked = channels[key as keyof typeof channels];
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-slate-800 font-medium">{label}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isChecked}
                        onClick={() =>
                          setChannels((prev) => ({
                            ...prev,
                            [key]: !prev[key as keyof typeof channels],
                          }))
                        }
                        className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          isChecked ? "bg-[#064E3B]" : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition ${
                            isChecked ? "translate-x-3.5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotifications}
                className="px-4 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
              >
                Save Notification Preferences
              </button>
            </div>
          </div>

          {/* ================================================================== */}
          {/* ROW 2 RIGHT: PAYOUT ACCOUNT                                        */}
          {/* ================================================================== */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                  <Landmark className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-slate-900">
                    Payout Account
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Only the Parking Provider can manage payout details
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Provider Exclusive
              </span>
            </div>

            {/* BRAC Bank UI Card */}
            <div className="rounded-xl p-4.5 bg-slate-900 text-white shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold font-heading text-sm text-slate-200">
                  <Building className="size-4 text-emerald-400" />
                  <span>BRAC Bank Limited</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Verified
                </span>
              </div>

              <div className="py-1 tracking-widest text-lg font-mono text-slate-200 font-bold">
                •••• •••• •••• 4821
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800">
                <div>
                  <span className="uppercase text-[9px] text-slate-500 block">ACCOUNT HOLDER</span>
                  <strong className="text-slate-200">Tanvir Chowdhury</strong>
                </div>
                <div className="text-right">
                  <span className="uppercase text-[9px] text-slate-500 block">METHOD & CYCLE</span>
                  <strong className="text-slate-200">Bank Transfer • Weekly</strong>
                </div>
              </div>
            </div>

            {/* Payout Details Grid */}
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200/70">
              <div className="flex justify-between">
                <span className="text-slate-500">Default Payout Method</span>
                <span className="font-semibold text-slate-900">Direct Bank Transfer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payout Schedule</span>
                <span className="font-semibold text-slate-900">Every Monday (Weekly)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Minimum Settlement</span>
                <span className="font-bold text-slate-900">৳1,000 BDT</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
              <Lock className="size-3.5 text-slate-400 shrink-0" />
              <span>Full bank account details are never shown after verification.</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => alert("Schedule cycle: Set to Weekly every Monday.")}
                className="px-3.5 py-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 font-semibold text-slate-700 text-xs transition cursor-pointer"
              >
                Update Schedule
              </button>
              <button
                type="button"
                onClick={() => alert("Managing BRAC Bank payout credentials.")}
                className="px-4 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
              >
                Manage Payout Account
              </button>
            </div>
          </div>

          {/* ================================================================== */}
          {/* ROW 3 LEFT: PREFERENCES                                            */}
          {/* ================================================================== */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                  <Sliders className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-slate-900">
                    Preferences
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Regional localization and interface configurations
                  </p>
                </div>
              </div>

              <span className="text-xs text-slate-500 font-medium">Dhaka Region</span>
            </div>

            {/* Dropdowns Grid (6 dropdowns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-9.5 px-3 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 transition"
                >
                  <option value="BDT">BDT (৳) — Bangladeshi Taka</option>
                  <option value="USD">USD ($) — US Dollar</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-9.5 px-3 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 transition"
                >
                  <option value="en-UK">English (UK / US)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Time Zone
                </label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full h-9.5 px-3 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 transition"
                >
                  <option value="Asia/Dhaka">Asia/Dhaka (GMT +6:00)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Date Format
                </label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full h-9.5 px-3 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 transition"
                >
                  <option value="DD MMM YYYY">DD MMM YYYY (e.g. 28 Oct 2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Dashboard Range
                </label>
                <select
                  value={dashboardRange}
                  onChange={(e) => setDashboardRange(e.target.value)}
                  className="w-full h-9.5 px-3 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 transition"
                >
                  <option value="30D">Last 30 Days</option>
                  <option value="7D">Last 7 Days</option>
                  <option value="MONTH">This Month</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Theme Display
                </label>
                <select
                  value={themeDisplay}
                  onChange={(e) => setThemeDisplay(e.target.value)}
                  className="w-full h-9.5 px-3 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 transition"
                >
                  <option value="system">System Default (Auto)</option>
                  <option value="light">Light Mode</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>

          {/* ================================================================== */}
          {/* ROW 3 RIGHT: MANAGER ACCESS DEFAULTS                               */}
          {/* ================================================================== */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                  <Shield className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-slate-900">
                    Manager Access Defaults
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Define default permissions when adding a new Property Manager
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                TEMPLATE
              </span>
            </div>

            {/* Governance note */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-950">
              <Shield className="size-4 text-emerald-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-bold">Strict Governance:</span> Payout account management and account deletion are hard-locked and never grantable to Property Managers.
              </p>
            </div>

            {/* Toggles 2-col Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-800 font-medium">Manage Listings</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={managerDefaults.manageListings}
                    onClick={() =>
                      setManagerDefaults((prev) => ({
                        ...prev,
                        manageListings: !prev.manageListings,
                      }))
                    }
                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      managerDefaults.manageListings ? "bg-[#064E3B]" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition ${
                        managerDefaults.manageListings ? "translate-x-3.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-800 font-medium">Manage Guards</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={managerDefaults.manageGuards}
                    onClick={() =>
                      setManagerDefaults((prev) => ({
                        ...prev,
                        manageGuards: !prev.manageGuards,
                      }))
                    }
                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      managerDefaults.manageGuards ? "bg-[#064E3B]" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition ${
                        managerDefaults.manageGuards ? "translate-x-3.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-800 font-medium">Respond to Reviews</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={managerDefaults.respondToReviews}
                    onClick={() =>
                      setManagerDefaults((prev) => ({
                        ...prev,
                        respondToReviews: !prev.respondToReviews,
                      }))
                    }
                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      managerDefaults.respondToReviews ? "bg-[#064E3B]" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition ${
                        managerDefaults.respondToReviews ? "translate-x-3.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-800 font-medium">Manage Bookings</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={managerDefaults.manageBookings}
                    onClick={() =>
                      setManagerDefaults((prev) => ({
                        ...prev,
                        manageBookings: !prev.manageBookings,
                      }))
                    }
                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      managerDefaults.manageBookings ? "bg-[#064E3B]" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition ${
                        managerDefaults.manageBookings ? "translate-x-3.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-800 font-medium">View Earnings</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={managerDefaults.viewEarnings}
                    onClick={() =>
                      setManagerDefaults((prev) => ({
                        ...prev,
                        viewEarnings: !prev.viewEarnings,
                      }))
                    }
                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      managerDefaults.viewEarnings ? "bg-[#064E3B]" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition ${
                        managerDefaults.viewEarnings ? "translate-x-3.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between opacity-60">
                  <span className="text-slate-800 font-medium flex items-center gap-1">
                    <span>Manage Payouts</span>
                    <Lock className="size-3 text-slate-500" />
                  </span>
                  <button
                    type="button"
                    disabled
                    role="switch"
                    aria-checked={false}
                    className="relative inline-flex h-4.5 w-8 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-slate-200"
                  >
                    <span className="pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => alert("Manager permissions template saved.")}
                className="px-3.5 py-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 font-semibold text-slate-700 text-xs transition cursor-pointer"
              >
                Edit Default Permissions
              </button>
            </div>
          </div>

          {/* ================================================================== */}
          {/* ROW 4 (FULL WIDTH): PRIVACY & ACCOUNT                              */}
          {/* ================================================================== */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Shield className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-slate-900">
                    Privacy & Account
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Data portability, legal disclosures, and account lifecycle
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                GDPR & BD Cyber Law Compliant
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
              <div className="max-w-xl text-xs space-y-1">
                <h4 className="font-bold text-slate-900">Account Governance & Data Control</h4>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Account deactivation may affect active listings, bookings, guards, and manager assignments. Download an offline backup of your properties, logs, and financial records before taking action.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => alert("Preparing provider data archive (JSON & CSV)...")}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="size-3.5" />
                  <span>Download My Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => alert("Opening ParkEase BD Privacy Policy.")}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileText className="size-3.5" />
                  <span>View Privacy Policy</span>
                </button>

                <button
                  type="button"
                  onClick={() => alert("Opening ParkEase BD Terms of Service.")}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Scale className="size-3.5" />
                  <span>View Terms</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDeactivateModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 font-semibold text-rose-600 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <AlertOctagon className="size-3.5" />
                  <span>Deactivate Provider Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* STICKY BOTTOM ACTION BAR                                             */}
      {/* ==================================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-[#E5E7EB] px-6 sm:px-8 py-3.5 shadow-lg">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>All current preferences and security configurations are synchronized.</span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-4 py-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 font-semibold text-slate-700 transition cursor-pointer"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-semibold shadow-2xs transition cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL: CHANGE PASSWORD                                               */}
      {/* ==================================================================== */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold font-heading text-slate-900">
                Change Password
              </h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsPasswordModalOpen(false);
                showToast("Password updated successfully.");
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="12–128 chars (uppercase, lowercase, number, symbol)"
                  className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Must be 12–128 characters and include uppercase, lowercase, a number, and a special character.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#064E3B] text-white font-semibold shadow-2xs hover:bg-[#064E3B]/90"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: MANAGE 2FA                                                    */}
      {/* ==================================================================== */}
      {is2faModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-sm w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold font-heading text-slate-900">
                Two-Factor Authentication
              </h3>
              <button
                type="button"
                onClick={() => setIs2faModalOpen(false)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
              <strong className="font-bold flex items-center gap-1.5">
                <Check className="size-4 text-emerald-600" />
                2FA is currently Active
              </strong>
              <p className="text-[11px] text-emerald-800">
                Google Authenticator / Authy app is paired with this provider account.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIs2faModalOpen(false);
                  showToast("New 2FA backup codes generated and saved.");
                }}
                className="w-full py-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 font-semibold text-slate-700"
              >
                Download Backup Codes
              </button>
              <button
                type="button"
                onClick={() => {
                  setIs2faEnabled(!is2faEnabled);
                  setIs2faModalOpen(false);
                  showToast("2FA configuration toggled.");
                }}
                className="w-full py-2 rounded-lg border border-rose-200 hover:bg-rose-50 font-semibold text-rose-600"
              >
                Reset / Re-pair Authenticator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: VIEW SESSIONS                                                 */}
      {/* ==================================================================== */}
      {isSessionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold font-heading text-slate-900">
                Active Devices & Sessions
              </h3>
              <button
                type="button"
                onClick={() => setIsSessionsModalOpen(false)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Laptop className="size-5 text-emerald-700" />
                  <div>
                    <strong className="text-slate-900">MacBook Pro (Current)</strong>
                    <p className="text-[11px] text-slate-500">Gulshan-2, Dhaka • Active now</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  This Device
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="size-5 text-slate-500" />
                  <div>
                    <strong className="text-slate-900">iPhone 15 Pro</strong>
                    <p className="text-[11px] text-slate-500">Safari iOS • Last active 2 hours ago</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("iPhone session revoked.")}
                  className="text-rose-600 font-semibold hover:underline text-[11px]"
                >
                  Revoke
                </button>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Laptop className="size-5 text-slate-500" />
                  <div>
                    <strong className="text-slate-900">Windows PC — Chrome</strong>
                    <p className="text-[11px] text-slate-500">Banani, Dhaka • Last active yesterday</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Windows session revoked.")}
                  className="text-rose-600 font-semibold hover:underline text-[11px]"
                >
                  Revoke
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSessionsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#064E3B] text-white font-semibold text-xs hover:bg-[#064E3B]/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: DEACTIVATE ACCOUNT                                            */}
      {/* ==================================================================== */}
      {isDeactivateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2.5 text-rose-700">
              <AlertOctagon className="size-5" />
              <h3 className="text-base font-bold font-heading text-slate-900">
                Deactivate Provider Account
              </h3>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Deactivating your provider account will pause all 3 active parking property listings, cancel upcoming driver reservations with full refunds, and disable gate guard logins.
            </p>

            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
              This action requires contacting host compliance desk to disburse remaining escrow balance of ৳18,600.
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeactivateModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeactivateModalOpen(false);
                  showToast("Deactivation request submitted to host compliance desk.");
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700"
              >
                Confirm Deactivation Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
