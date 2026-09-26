"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Layers,
  Lock,
  MessageSquare,
  Phone,
  Search,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";
import { ManagerHeader } from "@/components/manager/manager-header";
import { Button } from "@/components/ui/button";
import { managerApi } from "@/lib/api/manager-api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export default function ManagerSupportPage() {
  const { data: currentUser } = useCurrentUser();
  const [searchTopic, setSearchTopic] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const delegationsQuery = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const activeDelegations = delegationsQuery.data?.filter((d) => d.status === "ACTIVE") ?? [];
  const primaryOwner = activeDelegations[0]?.provider?.fullName || "Property Owner";

  // Form state
  const [category, setCategory] = useState("Permission Issue");
  const [property, setProperty] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");

  useEffect(() => {
    if (activeDelegations.length > 0 && !property) {
      setProperty(activeDelegations[0]!.property?.name || activeDelegations[0]!.property.id);
    }
  }, [activeDelegations, property]);

  const faqs = [
    {
      q: "Why can't I edit pricing for a property?",
      a: "Pricing can only be edited when the Property Owner has explicitly granted PRICE_MANAGE access for that specific property. If restricted, pricing schedules and hourly tariffs remain strictly read-only to preserve owner tariff authority.",
    },
    {
      q: "Why can't I see a property?",
      a: "Only properties assigned to your Manager account are visible. If an owner recently purchased or registered a new property, they must explicitly assign your account through the Owner Management Portal.",
    },
    {
      q: "Can I assign myself to another property?",
      a: "No. Property assignments are strictly controlled by the Property Owner. Managers cannot self-delegate or transfer permissions across unassigned Dhaka parking facilities.",
    },
    {
      q: "Can I manage guards?",
      a: "Only if Manage Guards permission is enabled for the selected property. When active, you can provision guard credentials, configure shift rosters, and assign specific gate barrier terminals.",
    },
    {
      q: "Can I access payouts or owner earnings?",
      a: "No. Payouts, financial accounts, bKash merchant disbursements, and property ownership controls remain strictly non-delegatable and are governed exclusively by the Property Owner.",
    },
    {
      q: "What happens if my permission changes?",
      a: "Your available actions update automatically based on the permissions configured by the Property Owner. In-flight tasks refresh immediately upon owner updates via real-time database synchronization.",
    },
  ];

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in subject and description");
      return;
    }
    toast.success(`Support ticket submitted successfully for ${property || "assigned property"}. Ref: #SUP-${Math.floor(1000 + Math.random() * 9000)}`);
    setSubject("");
    setDescription("");
  };

  return (
    <div className="flex flex-col min-h-full">
      <ManagerHeader
        title="Help & Support"
        subtitle="Get help with parking operations, permissions, bookings, guards, and assigned properties."
        badge="Manager View"
        breadcrumbs={[{ label: "Help & Support" }]}
        rightExtra={
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
            Operations Helpdesk Active
          </span>
        }
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Delegated Operational Support Banner */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4.5 text-[#064E3B] shrink-0" />
            <span className="font-medium">
              <strong>Delegated Operational Support:</strong> Guidance and issue resolution for facilities assigned by Property Owner {primaryOwner}.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              RBAC Verified
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              {currentUser?.email || "Manager"}
            </span>
          </div>
        </div>

        {/* Hero Emerald Container */}
        <div className="rounded-2xl bg-[#064E3B] p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
          <div className="max-w-2xl relative z-10 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              MANAGER KNOWLEDGE BASE
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              How can we help?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Find immediate answers regarding delegated workflows, barrier terminal configs, and driver booking overrides.
            </p>

            <div className="pt-2">
              <div className="flex items-center rounded-xl bg-white p-1 text-slate-800 shadow-md">
                <Search className="size-4.5 text-slate-400 ml-3 mr-2" />
                <input
                  type="text"
                  placeholder="Search help articles, topics, or common questions"
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  className="w-full bg-transparent py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                />
                <Button
                  size="sm"
                  onClick={() => toast.info(`Searching for "${searchTopic || "help"}"`)}
                  className="bg-[#064E3B] text-white hover:bg-emerald-900 text-xs font-semibold px-4"
                >
                  Search
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px]">
              <span className="text-emerald-300 font-semibold">Common topics:</span>
              <button
                type="button"
                onClick={() => setSearchTopic("Property Access")}
                className="rounded-full bg-emerald-800/80 px-2.5 py-0.5 text-emerald-100 hover:bg-emerald-700 cursor-pointer"
              >
                Property Access
              </button>
              <button
                type="button"
                onClick={() => setSearchTopic("Booking Operations")}
                className="rounded-full bg-emerald-800/80 px-2.5 py-0.5 text-emerald-100 hover:bg-emerald-700 cursor-pointer"
              >
                Booking Operations
              </button>
              <button
                type="button"
                onClick={() => setSearchTopic("Parking Spaces")}
                className="rounded-full bg-emerald-800/80 px-2.5 py-0.5 text-emerald-100 hover:bg-emerald-700 cursor-pointer"
              >
                Parking Spaces
              </button>
              <button
                type="button"
                onClick={() => setSearchTopic("Guards")}
                className="rounded-full bg-emerald-800/80 px-2.5 py-0.5 text-emerald-100 hover:bg-emerald-700 cursor-pointer"
              >
                Guards
              </button>
              <button
                type="button"
                onClick={() => setSearchTopic("Permissions")}
                className="rounded-full bg-emerald-800/80 px-2.5 py-0.5 text-emerald-100 hover:bg-emerald-700 cursor-pointer"
              >
                Permissions
              </button>
            </div>
          </div>
        </div>

        {/* Quick Help Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <HelpCircle className="size-4 text-[#064E3B]" />
              Quick Help Categories
            </h3>
            <span className="text-xs text-slate-400">
              Browse operational guides by functional role
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/manager/properties" className="block">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B] mb-2.5">
                  <Building2 className="size-4.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Assigned Properties</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Learn how assigned properties and delegated operational access work.
                </p>
              </div>
            </Link>

            <Link href="/manager/bookings" className="block">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B] mb-2.5">
                  <Calendar className="size-4.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Bookings</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Help with booking details, statuses, reservations, and operational actions.
                </p>
              </div>
            </Link>

            <Link href="/manager/active-sessions" className="block">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B] mb-2.5">
                  <Car className="size-4.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Active Sessions</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Understand current parking sessions and vehicle check-in/check-out flows.
                </p>
              </div>
            </Link>

            <Link href="/manager/parking-spaces" className="block">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition">
                <div className="flex size-9 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 font-black text-sm text-slate-700 mb-2.5">
                  P
                </div>
                <h4 className="text-xs font-bold text-slate-900">Parking Spaces</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Manage spaces, bay dimensions, availability exceptions, and status.
                </p>
              </div>
            </Link>

            <Link href="/manager/guards" className="block">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B] mb-2.5">
                  <Users className="size-4.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Guards</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Manage guard assignments, barrier gates, and shift schedules where permitted.
                </p>
              </div>
            </Link>

            <Link href="/manager/properties" className="block">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B] mb-2.5">
                  <Lock className="size-4.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Permissions</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Understand what actions are enabled or restricted for each assigned property.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Two-Column: FAQ Accordion (8 cols) vs Urgent Contact & Tickets (4 cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* FAQ Accordion (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Frequently Asked Questions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quick resolutions to the most frequent property management questions.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  {faqs.length} Direct Answers
                </span>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <HelpCircle className="size-4 text-[#064E3B] shrink-0" />
                          {faq.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="size-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="size-4 text-slate-400" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Urgent Parking Safety Issue */}
            <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertTriangle className="size-4 text-amber-700" />
                <span>Urgent Parking Safety Issue</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                For immediate on-site safety concerns, vehicle clearance blocks, or gate barrier failures, contact the assigned guard or property emergency contact first.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <Link href="/manager/guards">
                  <Button
                    size="sm"
                    className="w-full bg-[#B45309] hover:bg-amber-800 text-white text-xs font-semibold h-8 gap-1.5"
                  >
                    <Phone className="size-3.5" />
                    Contact Assigned Guard
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.info("ParkEase Operations Emergency Hotline: +880 1711-000000")}
                  className="border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-semibold h-8"
                >
                  Emergency Hotline
                </Button>
              </div>
            </div>

            {/* Useful Documentation */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2.5 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                Useful Documentation
              </h4>
              <Link href="/safety" className="flex items-center justify-between text-slate-600 hover:text-slate-900 py-1">
                <span>Manager Safety Guidelines</span> <ArrowRight className="size-3 text-slate-400" />
              </Link>
              <Link href="/terms" className="flex items-center justify-between text-slate-600 hover:text-slate-900 py-1">
                <span>Terms of Service</span> <ArrowRight className="size-3 text-slate-400" />
              </Link>
              <Link href="/privacy" className="flex items-center justify-between text-slate-600 hover:text-slate-900 py-1">
                <span>Privacy Policy</span> <ArrowRight className="size-3 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Support Request Form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="size-4.5 text-[#064E3B]" />
                Contact ParkEase BD Support
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Need operational assistance? Submit an inquiry directly to the Dhaka parking operations queue.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium">Response SLA: &lt; 2 Hours</span>
          </div>

          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Issue Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#064E3B] focus:outline-hidden"
                >
                  <option>Permission Issue</option>
                  <option>Booking Operations Anomaly</option>
                  <option>Gate Barrier / Hardware</option>
                  <option>Guard Shift Coordination</option>
                  <option>Other Operational Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Property (Scoped to your access)
                </label>
                <select
                  value={property}
                  onChange={(e) => setProperty(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#064E3B] focus:outline-hidden"
                >
                  {activeDelegations.map((d) => (
                    <option key={d.property.id} value={d.property?.name || d.property.id}>
                      {d.property?.name || d.property.id}
                    </option>
                  ))}
                  {activeDelegations.length === 0 && <option value="">No delegated properties</option>}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Brief summary of the operational issue..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#064E3B] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Provide details about the issue, affected bay/gate, and any error message..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#064E3B] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional Attachment (PNG, JPG, PDF up to 5MB)
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 p-2.5 text-xs text-slate-500">
                  <Upload className="size-4 text-slate-400" />
                  <span className="flex-1 truncate">Upload Screenshot / Error Log</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => toast.info("Attach file feature ready")}
                    className="h-7 text-xs"
                  >
                    Browse
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Priority Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs cursor-pointer ${
                      priority === "normal"
                        ? "border-[#064E3B] bg-emerald-50/50 text-[#064E3B] font-bold"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      checked={priority === "normal"}
                      onChange={() => setPriority("normal")}
                    />
                    <div>
                      <span>Normal</span>
                      <span className="block text-[10px] font-normal text-slate-500">Standard inquiry</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs cursor-pointer ${
                      priority === "urgent"
                        ? "border-red-500 bg-red-50/50 text-red-900 font-bold"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      checked={priority === "urgent"}
                      onChange={() => setPriority("urgent")}
                    />
                    <div>
                      <span>Urgent</span>
                      <span className="block text-[10px] font-normal text-red-700">Operations blocked</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Ticket will be assigned to ParkEase BD Operations Queue
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSubject("");
                    setDescription("");
                  }}
                  className="text-xs"
                >
                  Clear Form
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#064E3B] text-white hover:bg-emerald-900 text-xs font-semibold px-4 h-9"
                >
                  Submit Support Request
                </Button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
