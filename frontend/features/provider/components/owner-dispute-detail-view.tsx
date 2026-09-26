"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Scale,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Upload,
  Camera,
  Video,
  User,
  Phone,
  Check,
  X,
  Send,
  Trash2,
  Info,
} from "lucide-react";
import { OwnerHeader } from "@/components/provider/provider-header";
import { cn } from "@/lib/utils";

interface EvidenceFile {
  id: string;
  name: string;
  size: string;
  type: "image" | "video" | "pdf" | "log";
  uploadedBy: "driver" | "owner";
  uploadedAt: string;
  url?: string;
}

interface DisputeDetailData {
  id: string;
  bookingCode: string;
  propertyTitle: string;
  propertyAddress: string;
  baySlot: string;
  floor: string;
  driverName: string;
  driverPhone: string;
  driverEmail: string;
  driverRating: number;
  vehicleModel: string;
  licensePlate: string;
  claimedAmount: number;
  requestedOutcome: string;
  category: string;
  categoryDescription: string;
  filedAt: string;
  deadlineString: string;
  status: "ACTION_REQUIRED" | "UNDER_REVIEW" | "RESOLVED" | "REFUNDED";
  mediatorName: string;
  mediatorRole: string;
  driverStatement: string;
  ownerStatement?: string;
  evidence: EvidenceFile[];
  timeline: {
    title: string;
    description: string;
    timestamp: string;
    status: "completed" | "in_progress" | "upcoming";
  }[];
}

const MOCK_DISPUTE_DATA: Record<string, DisputeDetailData> = {
  "DISP-2041": {
    id: "DISP-2041",
    bookingCode: "#BK-7892",
    propertyTitle: "Residential Building, Gulshan",
    propertyAddress: "Road 11, Block D, Gulshan-1, Dhaka",
    baySlot: "Bay B-08",
    floor: "Basement 1",
    driverName: "Kamal Hossain",
    driverPhone: "+880 1711-889900",
    driverEmail: "kamal.hossain@example.com",
    driverRating: 4.8,
    vehicleModel: "White Toyota Corolla",
    licensePlate: "DHAKA METRO-GA-11-2345",
    claimedAmount: 250,
    requestedOutcome: "Full Refund (৳250)",
    category: "SLOT_OCCUPIED",
    categoryDescription: "Slot Was Occupied / Unavailable upon driver check-in arrival.",
    filedAt: "Sep 11, 2026, 09:15 AM",
    deadlineString: "Today at 05:00 PM (4h 12m remaining)",
    status: "ACTION_REQUIRED",
    mediatorName: "Tariqul Islam",
    mediatorRole: "ParkEase Senior Mediation Officer",
    driverStatement:
      "I arrived at 9:15 AM with my active booking QR code, but another sedan was parked in Bay B-08. The security guard was absent from Gate 2 for nearly 20 minutes, forcing me to park on the main street outside where I received an unauthorized city parking citation. I request a full refund of ৳250 plus reimbursement for the inconvenience.",
    evidence: [
      {
        id: "ev-1",
        name: "bay_b08_occupied_sedan.jpg",
        size: "1.8 MB",
        type: "image",
        uploadedBy: "driver",
        uploadedAt: "Sep 11, 09:18 AM",
      },
      {
        id: "ev-2",
        name: "dhaka_metro_parking_citation.pdf",
        size: "940 KB",
        type: "pdf",
        uploadedBy: "driver",
        uploadedAt: "Sep 11, 09:22 AM",
      },
    ],
    timeline: [
      {
        title: "Dispute Claim Registered",
        description: "Driver Kamal Hossain submitted slot occupied grievance",
        timestamp: "Sep 11, 09:15 AM",
        status: "completed",
      },
      {
        title: "Automated Evidence Scan",
        description: "Driver uploaded 2 supporting documents and citation receipt",
        timestamp: "Sep 11, 09:25 AM",
        status: "completed",
      },
      {
        title: "Host Evidence Room Open (SLA: 48h)",
        description: "Host notified to submit gate logs or CCTV verification",
        timestamp: "Sep 11, 09:30 AM",
        status: "in_progress",
      },
      {
        title: "Mediation Officer Arbitration",
        description: "Officer Tariqul Islam reviews cross-evidence",
        timestamp: "Scheduled for 05:30 PM",
        status: "upcoming",
      },
      {
        title: "Final Settlement & Escrow Release",
        description: "Disbursement adjustment or claim dismissal",
        timestamp: "Estimated Sep 12",
        status: "upcoming",
      },
    ],
  },
  "DISP-2038": {
    id: "DISP-2038",
    bookingCode: "#BK-7864",
    propertyTitle: "Residential Building, Gulshan",
    propertyAddress: "Road 11, Block D, Gulshan-1, Dhaka",
    baySlot: "Bay B-03",
    floor: "Basement 1",
    driverName: "Sadia Rahman",
    driverPhone: "+880 1722-112233",
    driverEmail: "sadia.r@example.com",
    driverRating: 4.9,
    vehicleModel: "Honda Civic",
    licensePlate: "DHAKA METRO-GA-21-4567",
    claimedAmount: 120,
    requestedOutcome: "Partial Refund (৳120)",
    category: "OVERCHARGED",
    categoryDescription: "Overcharged / Extra Overtime Fare Discrepancy.",
    filedAt: "Sep 09, 2026, 02:40 PM",
    deadlineString: "Evidence Submitted",
    status: "UNDER_REVIEW",
    mediatorName: "Tariqul Islam",
    mediatorRole: "ParkEase Senior Mediation Officer",
    driverStatement:
      "I was billed for 45 minutes of overtime because the exit barrier scanner took too long to read my QR code. I actually vacated the bay on time.",
    ownerStatement:
      "Reviewed CCTV timestamp at Gate 2 North Ramp. Driver's vehicle actually exited bay at 02:35 PM, exactly 25 minutes after the reservation cutoff.",
    evidence: [
      {
        id: "ev-1",
        name: "driver_checkout_screen.jpg",
        size: "1.2 MB",
        type: "image",
        uploadedBy: "driver",
        uploadedAt: "Sep 09, 02:42 PM",
      },
      {
        id: "ev-2",
        name: "CCTV_Gate2_Exit_0235PM.mp4",
        size: "14.5 MB",
        type: "video",
        uploadedBy: "owner",
        uploadedAt: "Sep 09, 04:15 PM",
      },
      {
        id: "ev-3",
        name: "Gate2_Guard_Logbook.pdf",
        size: "2.1 MB",
        type: "pdf",
        uploadedBy: "owner",
        uploadedAt: "Sep 09, 04:18 PM",
      },
    ],
    timeline: [
      {
        title: "Dispute Claim Registered",
        description: "Driver filed overtime discrepancy claim",
        timestamp: "Sep 09, 02:40 PM",
        status: "completed",
      },
      {
        title: "Host Evidence Submitted",
        description: "Host uploaded CCTV footage and guard logbook",
        timestamp: "Sep 09, 04:20 PM",
        status: "completed",
      },
      {
        title: "Officer Arbitration In Progress",
        description: "Reviewing CCTV timestamp matching",
        timestamp: "In progress",
        status: "in_progress",
      },
      {
        title: "Final Settlement",
        description: "Awaiting final determination",
        timestamp: "Estimated Sep 12",
        status: "upcoming",
      },
    ],
  },
};

export function OwnerDisputeDetailView({ disputeId }: { disputeId: string }) {
  const data = MOCK_DISPUTE_DATA[disputeId] || {
    ...MOCK_DISPUTE_DATA["DISP-2041"],
    id: disputeId,
  };

  const [dispute, setDispute] = useState<DisputeDetailData>(data);
  const [ownerReply, setOwnerReply] = useState(dispute.ownerStatement || "");
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>(dispute.evidence);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewEvidence, setPreviewEvidence] = useState<EvidenceFile | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const newEvidence: EvidenceFile = {
      id: `ev-${Date.now()}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.type.includes("video") ? "video" : file.type.includes("pdf") ? "pdf" : "image",
      uploadedBy: "owner",
      uploadedAt: "Just now",
    };

    setEvidenceFiles((prev) => [...prev, newEvidence]);
    showToast(`File "${file.name}" uploaded to Evidence Room.`);
  };

  const handleDeleteEvidence = (id: string) => {
    setEvidenceFiles((prev) => prev.filter((f) => f.id !== id));
    showToast("Evidence file removed.");
  };

  const handleSubmitDefense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerReply.trim()) {
      alert("Please provide an explanatory statement for the mediator.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setDispute((prev) => ({
        ...prev,
        status: "UNDER_REVIEW",
        ownerStatement: ownerReply,
        deadlineString: "Evidence Submitted to Mediator",
      }));
      showToast("Defense statement and evidence files submitted to Mediation Officer.");
    }, 1000);
  };

  const handleConfirmAcceptRefund = () => {
    setDispute((prev) => ({
      ...prev,
      status: "REFUNDED",
      deadlineString: "Refund Issued • Case Closed",
    }));
    setIsAcceptModalOpen(false);
    showToast(
      `Dispute #${dispute.id} accepted. ৳${dispute.claimedAmount} refunded to driver. Host rating 100% protected!`
    );
  };

  const isActionRequired = dispute.status === "ACTION_REQUIRED";
  const isUnderReview = dispute.status === "UNDER_REVIEW";

  return (
    <div className="flex flex-col min-h-full relative bg-[#f9f9ff]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#064E3B] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 border border-emerald-700">
          <CheckCircle2 className="size-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <OwnerHeader
        title={`Dispute Case #${dispute.id}`}
        badge={
          isActionRequired ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-200 shadow-2xs">
              <span className="size-2 rounded-full bg-rose-600 animate-pulse" />
              Action Required (4h left)
            </span>
          ) : isUnderReview ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              Mediation Under Review
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs">
              <Check className="size-3 text-emerald-600" />
              Case Closed & Resolved
            </span>
          )
        }
        subtitle="Mediation evidence room, driver claims, CCTV upload channel, and formal resolution options."
      />

      {/* Main Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1520px] mx-auto w-full space-y-6 pb-28">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/provider/disputes"
              className="hover:text-[#064E3B] font-medium transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Disputes Manager</span>
            </Link>
            <ChevronRight className="size-3.5 text-slate-400" />
            <span className="font-bold text-slate-900">Case #{dispute.id}</span>
          </div>

          <div className="flex items-center gap-2">
            {isActionRequired && (
              <button
                type="button"
                onClick={() => setIsAcceptModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] border border-emerald-300 text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                Accept Claim & Issue Refund (৳{dispute.claimedAmount})
              </button>
            )}
          </div>
        </div>

        {/* Hero Case Metadata Card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold font-mono text-xs">
                  DISP
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900">
                    {dispute.categoryDescription}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Filed on {dispute.filedAt} • Booking Code: {dispute.bookingCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Disputed Amount Pill */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-right flex md:flex-col justify-between items-center md:items-end">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Disputed Claim
              </span>
              <div className="text-xl font-heading font-black text-slate-900">
                ৳{dispute.claimedAmount}
              </div>
            </div>
          </div>

          {/* Key Quick Info Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Facility & Bay</span>
              <span className="font-bold text-slate-900 block mt-0.5">
                {dispute.baySlot} ({dispute.floor})
              </span>
              <span className="text-[11px] text-slate-500 truncate block">
                {dispute.propertyTitle}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Claimant Driver</span>
              <span className="font-bold text-slate-900 block mt-0.5">{dispute.driverName}</span>
              <span className="text-[11px] text-slate-500 block">{dispute.driverPhone}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Assigned Mediator</span>
              <span className="font-bold text-[#064E3B] block mt-0.5">
                {dispute.mediatorName}
              </span>
              <span className="text-[11px] text-slate-500 block">{dispute.mediatorRole}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">SLA Response Window</span>
              <span
                className={cn(
                  "font-bold block mt-0.5",
                  isActionRequired ? "text-rose-600" : "text-slate-900"
                )}
              >
                {dispute.deadlineString}
              </span>
              <span className="text-[11px] text-slate-500 block">48-Hour Fair Arbitration</span>
            </div>
          </div>
        </div>

        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 8 COLUMNS: DRIVER CLAIM, EVIDENCE GALLERY, COUNTER-STATEMENT FORM */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Driver's Grievance & Statements */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-slate-500" />
                  <h3 className="text-sm font-bold font-heading text-slate-900">
                    Driver’s Formal Claim & Incident Description
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Filed via Driver App</span>
              </div>

              {/* Statement Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed space-y-2">
                <p>{dispute.driverStatement}</p>
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Requested Outcome: {dispute.requestedOutcome}</span>
                  <span>Verified Driver Account ({dispute.driverRating} ★)</span>
                </div>
              </div>

              {/* Driver's Uploaded Evidence Files */}
              <div className="space-y-2.5 pt-1">
                <span className="text-xs font-bold text-slate-700 block">
                  Driver Supporting Evidence ({dispute.evidence.filter((e) => e.uploadedBy === "driver").length} files)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dispute.evidence
                    .filter((e) => e.uploadedBy === "driver")
                    .map((file) => (
                      <div
                        key={file.id}
                        onClick={() => setPreviewEvidence(file)}
                        className="p-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 transition flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            {file.type === "image" ? (
                              <Camera className="size-4" />
                            ) : (
                              <FileText className="size-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-900 truncate block group-hover:text-[#064E3B]">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {file.size} • {file.uploadedAt}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-[#064E3B] font-semibold hover:underline shrink-0"
                        >
                          View
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* 2. Facility Evidence Room (Host Uploads) */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="size-4 text-[#064E3B]" />
                  <h3 className="text-sm font-bold font-heading text-slate-900">
                    Host Facility Evidence Room (CCTV & Gate Logs)
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  {evidenceFiles.filter((e) => e.uploadedBy === "owner").length} files submitted
                </span>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-[#064E3B] rounded-xl p-6 text-center transition bg-slate-50/50">
                <input
                  type="file"
                  id="evidence-upload"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.csv"
                />
                <label
                  htmlFor="evidence-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <div className="size-10 rounded-full bg-emerald-50 text-[#064E3B] flex items-center justify-center mb-2">
                    <Upload className="size-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    Click to upload CCTV recordings, gate log photos, or sensor CSVs
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    MP4, JPG, PNG, PDF up to 50MB. Submissions are verified with cryptographic hash.
                  </span>
                </label>
              </div>

              {/* Host Evidence Items List */}
              <div className="space-y-2">
                {evidenceFiles.filter((e) => e.uploadedBy === "owner").length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No host evidence files uploaded yet. Add Gate 2 CCTV or entry logbook pages
                    above.
                  </p>
                ) : (
                  evidenceFiles
                    .filter((e) => e.uploadedBy === "owner")
                    .map((file) => (
                      <div
                        key={file.id}
                        className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-8 rounded-lg bg-emerald-100 text-[#064E3B] flex items-center justify-center shrink-0">
                            {file.type === "video" ? (
                              <Video className="size-4" />
                            ) : (
                              <Camera className="size-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-900 truncate block">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {file.size} • Host Upload • {file.uploadedAt}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewEvidence(file)}
                            className="text-xs text-[#064E3B] font-semibold hover:underline px-2 py-1"
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvidence(file.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* 3. Host Defense Counter-Statement Form */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="size-4 text-[#064E3B]" />
                  <h3 className="text-sm font-bold font-heading text-slate-900">
                    Host Formal Defense Statement to Mediation Officer
                  </h3>
                </div>
                <span className="text-xs text-slate-400">{ownerReply.length} / 1500 chars</span>
              </div>

              <form onSubmit={handleSubmitDefense} className="space-y-4">
                {/* Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">Quick Templates:</span>
                  {[
                    "CCTV confirms bay was vacant at arrival time.",
                    "Driver checked into incorrect bay without guard assistance.",
                    "Attendant stepped away for scheduled perimeter patrol (5m).",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setOwnerReply((prev) => (prev ? `${prev} ${preset}` : preset))}
                      className="text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition cursor-pointer"
                    >
                      +{preset.slice(0, 32)}...
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  rows={5}
                  value={ownerReply}
                  onChange={(e) => setOwnerReply(e.target.value)}
                  placeholder="Explain what happened based on your gate records, on-duty guard report, or CCTV timestamps. Be specific regarding timestamps..."
                  className="w-full p-3.5 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:border-[#064E3B] transition leading-relaxed"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      required
                      className="rounded border-slate-300 text-[#064E3B] focus:ring-[#064E3B]"
                    />
                    <span>I certify that all statements and evidence submitted are accurate.</span>
                  </label>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => showToast("Draft defense statement saved.")}
                      className="px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                    >
                      Save Draft
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="size-3.5" />
                      <span>{isSubmitting ? "Submitting..." : "Submit to Mediator"}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: CASE ESCROW SUMMARY, BOOKING SNAPSHOT, ARBITRATION ACTIONS */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 1: Escrow & Financial Holding */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold font-heading text-slate-900">
                Financial Escrow & Holding Status
              </h3>

              <div className="p-4 rounded-xl bg-[#f9f9ff] border border-slate-200 text-center space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Amount in Escrow
                </span>
                <div className="text-3xl font-black font-heading text-slate-900">
                  ৳{dispute.claimedAmount}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Withheld from settlement batch #PR-8902
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Max Host Liability</span>
                  <span className="font-bold text-slate-900">৳{dispute.claimedAmount}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Mediation Filing Fee</span>
                  <span className="font-semibold text-emerald-800">৳0 (Free for Hosts)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Escrow Release Date</span>
                  <span className="font-semibold text-slate-800">Upon Case Resolution</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Host Rating Impact</span>
                  <span className="font-bold text-emerald-700">Protected in Mediation</span>
                </div>
              </div>
            </div>

            {/* Card 2: Associated Booking & Gate Log */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Associated Booking Snapshot
                </h3>
                <Link
                  href="/provider/bookings"
                  className="text-xs font-semibold text-[#064E3B] hover:underline"
                >
                  View in Bookings →
                </Link>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Booking Code</span>
                  <span className="font-mono font-bold text-slate-900">{dispute.bookingCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Vehicle</span>
                  <span className="font-semibold text-slate-900">{dispute.vehicleModel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">License Plate</span>
                  <span className="font-mono font-bold text-slate-800">{dispute.licensePlate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Assigned Bay</span>
                  <span className="font-bold text-[#064E3B]">
                    {dispute.baySlot} ({dispute.floor})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Guard on Duty</span>
                  <span className="font-semibold text-slate-800">Rahim Uddin (Gate 2)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    showToast(`Direct dial initiated to claimant ${dispute.driverName} (${dispute.driverPhone}).`)
                  }
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  <Phone className="size-3.5 text-slate-500" />
                  <span>Call Driver</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    showToast("Intercom paging sent to duty security guard Rahim Uddin.")
                  }
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  <ShieldCheck className="size-3.5 text-slate-500" />
                  <span>Call Guard</span>
                </button>
              </div>
            </div>

            {/* Card 3: Dispute Mediation Timeline */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold font-heading text-slate-900">
                Arbitration Case Timeline
              </h3>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {dispute.timeline.map((step, idx) => {
                  const isDone = step.status === "completed";
                  const isInProgress = step.status === "in_progress";
                  const isUpcoming = step.status === "upcoming";

                  return (
                    <div key={idx} className="relative">
                      <span
                        className={cn(
                          "absolute -left-6 top-0.5 size-3.5 rounded-full ring-4 ring-white flex items-center justify-center",
                          isDone && "bg-emerald-600 text-white",
                          isInProgress && "bg-amber-500 animate-pulse",
                          isUpcoming && "bg-slate-200"
                        )}
                      />
                      <div>
                        <div className="flex items-baseline justify-between gap-1">
                          <h4
                            className={cn(
                              "text-xs font-bold",
                              isDone && "text-slate-900",
                              isInProgress && "text-amber-800",
                              isUpcoming && "text-slate-400"
                            )}
                          >
                            {step.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{step.description}</p>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {step.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PREVIEW EVIDENCE MODAL                                               */}
      {/* ==================================================================== */}
      {previewEvidence && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[#064E3B]" />
                <span className="text-xs font-bold text-slate-900">{previewEvidence.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({previewEvidence.size})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEvidence(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 bg-slate-100 flex flex-col items-center justify-center min-h-[260px] text-center">
              <div className="size-16 rounded-2xl bg-white shadow-xs flex items-center justify-center text-slate-700 mb-3">
                {previewEvidence.type === "image" ? (
                  <Camera className="size-8 text-[#064E3B]" />
                ) : previewEvidence.type === "video" ? (
                  <Video className="size-8 text-blue-600" />
                ) : (
                  <FileText className="size-8 text-amber-600" />
                )}
              </div>
              <span className="text-xs font-bold text-slate-800">{previewEvidence.name}</span>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                Evidence verified with MD5 hash audit. Uploaded by{" "}
                <span className="font-semibold text-slate-700">{previewEvidence.uploadedBy}</span>{" "}
                at {previewEvidence.uploadedAt}.
              </p>
            </div>

            <div className="p-4 bg-white border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewEvidence(null)}
                className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => showToast(`Downloading ${previewEvidence.name}...`)}
                className="px-3.5 py-1.5 rounded-lg bg-[#064E3B] text-white text-xs font-bold shadow-xs hover:bg-[#064E3B]/90 transition"
              >
                Download Evidence File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ACCEPT CLAIM / ISSUE REFUND MODAL                                    */}
      {/* ==================================================================== */}
      {isAcceptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-900">
                    Accept Claim & Issue Refund
                  </h3>
                  <p className="text-xs text-slate-500">Case #{dispute.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAcceptModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                You are agreeing to refund driver{" "}
                <span className="font-bold text-slate-900">
                  {dispute.driverName} ({dispute.driverPhone})
                </span>{" "}
                for claim: <span className="font-bold text-slate-900">{dispute.categoryDescription}</span>.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Refund Amount</span>
                  <span className="font-bold text-[#064E3B] font-heading text-base">
                    ৳{dispute.claimedAmount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Source Deduction</span>
                  <span className="font-medium text-slate-700">Next Weekly Settlement Payout</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Host Rating Impact</span>
                  <span className="font-bold text-emerald-700">Protected (0 penalty)</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 flex items-start gap-2">
                <Info className="size-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  Accepting the claim closes this dispute immediately as amicably resolved. No strike
                  or penalty will be added to your host account.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAcceptModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAcceptRefund}
                  className="px-4 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-bold shadow-sm transition active:scale-98"
                >
                  Confirm Refund (৳{dispute.claimedAmount})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
