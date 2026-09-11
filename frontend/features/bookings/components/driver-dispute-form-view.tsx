"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import {
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  Clock,
  Car,
  MapPin,
  Calendar,
  CreditCard,
  Building,
  HelpCircle,
  Paperclip,
  Check,
  DollarSign,
  Gift,
  Shield,
  Send,
} from "lucide-react";
import { MOCK_BOOKINGS } from "@/lib/data/mock-driver-data";

const disputeSchema = z.object({
  category: z.string().min(1, "Please select a dispute category"),
  description: z
    .string()
    .min(20, "Incident description must be at least 20 characters")
    .max(1000, "Incident description cannot exceed 1000 characters"),
  resolution: z.string().min(1, "Please select your desired resolution"),
  declaration: z.literal(true, {
    errorMap: () => ({ message: "You must declare that the information is truthful" }),
  }),
});

type DisputeFormData = z.infer<typeof disputeSchema>;

interface DriverDisputeFormViewProps {
  bookingId?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
}

const DISPUTE_CATEGORIES = [
  {
    id: "OVERCHARGED",
    label: "Overcharged / Incorrect Fare",
    description: "Extra hours billed, unexpected rate discrepancy, or unauthorized security fee.",
  },
  {
    id: "SLOT_OCCUPIED",
    label: "Slot Was Occupied / Unavailable",
    description: "Another vehicle was parked in your assigned bay or access was barred.",
  },
  {
    id: "HOST_MISCONDUCT",
    label: "Security / Host Misconduct",
    description: "Guard refused entry, demanded cash bribe, or exhibited inappropriate behavior.",
  },
  {
    id: "DAMAGE_SAFETY",
    label: "Property Damage / Safety Issue",
    description: "Vehicle incurred physical damage on site or parking area was hazardous.",
  },
  {
    id: "CANCELLED_NO_REFUND",
    label: "Booking Cancelled but No Refund",
    description: "Eligible cancellation was completed but refund was not credited.",
  },
  {
    id: "OTHER",
    label: "Other Issue",
    description: "Any other problem not covered above requiring customer support review.",
  },
];

const RESOLUTION_OPTIONS = [
  {
    id: "FULL_REFUND",
    title: "Full Refund",
    desc: "Reimburse 100% of the booking charge back to original payment channel.",
    icon: DollarSign,
  },
  {
    id: "PARTIAL_REFUND",
    title: "Partial Refund",
    desc: "Fair compensation for the disrupted time or slot inconvenience.",
    icon: DollarSign,
  },
  {
    id: "PLATFORM_CREDIT",
    title: "Platform Credit + 10% Bonus",
    desc: "Instant ParkEase BD wallet credit to use on any future booking in Dhaka.",
    icon: Gift,
  },
  {
    id: "HOST_INVESTIGATION",
    title: "Investigation & Host Action Only",
    desc: "Formal disciplinary review and reprimand for host without monetary compensation.",
    icon: Shield,
  },
];

export function DriverDisputeFormView({ bookingId }: DriverDisputeFormViewProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    ticketId: string;
    submittedAt: string;
    formData: DisputeFormData;
    files: UploadedFile[];
  } | null>(null);

  // Evidence files state
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: "evidence-1",
      name: "Gate_Barrier_Blocked_Photo.jpg",
      size: "2.4 MB",
      type: "image/jpeg",
    },
  ]);

  // Match mock booking or use fallback
  const booking =
    MOCK_BOOKINGS.find((b) => b.id === bookingId) || MOCK_BOOKINGS[0];

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<DisputeFormData>({
    defaultValues: {
      category: "",
      description: "",
      resolution: "",
      declaration: false as unknown as true,
    },
  });

  const descriptionValue = watch("description") || "";
  const selectedCategory = watch("category");
  const selectedResolution = watch("resolution");

  const handleAddSampleFile = (fileName: string, size: string) => {
    const newFile: UploadedFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: fileName,
      size,
      type: "image/jpeg",
    };
    setFiles((prev) => [...prev, newFile]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const onSubmit = (data: DisputeFormData) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const ticketNum = `DSP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedData({
        ticketId: ticketNum,
        submittedAt: new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        formData: data,
        files,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1200);
  };

  // ----------------------------------------------------
  // Success Confirmation State
  // ----------------------------------------------------
  if (submittedData) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] text-slate-800 pb-24">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link
              href={`/driver/bookings/${booking.id}`}
              className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-emerald-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Booking
            </Link>
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
              Dispute Registered
            </span>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-10 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <span className="inline-block text-xs font-mono font-bold tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase mb-3 border border-emerald-200">
              Ticket #{submittedData.ticketId}
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight">
              Dispute Submitted Successfully
            </h1>

            <p className="mt-3 text-slate-600 text-base max-w-lg mx-auto leading-relaxed">
              Your claim has been assigned to the{" "}
              <strong className="text-slate-800 font-semibold">ParkEase BD Trust & Safety Team</strong>.
              We prioritize prompt fairness and will contact you within our 24–48 hour SLA.
            </p>

            {/* Ticket Details Grid */}
            <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6 text-left space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 border-b border-slate-200/80 gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Target Booking
                </span>
                <span className="text-sm font-bold font-mono text-slate-800">
                  {booking.id} ({booking.spotNumber})
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 border-b border-slate-200/80 gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Dispute Category
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {DISPUTE_CATEGORIES.find((c) => c.id === submittedData.formData.category)?.label ||
                    submittedData.formData.category}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 border-b border-slate-200/80 gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Requested Resolution
                </span>
                <span className="text-sm font-semibold text-emerald-800">
                  {RESOLUTION_OPTIONS.find((r) => r.id === submittedData.formData.resolution)?.title ||
                    submittedData.formData.resolution}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 border-b border-slate-200/80 gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Investigation SLA
                </span>
                <span className="text-sm font-semibold text-amber-700 flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-amber-600" /> 24 to 48 Hours
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Evidence Files
                </span>
                <span className="text-sm font-medium text-slate-700">
                  {submittedData.files.length > 0
                    ? `${submittedData.files.length} document(s) uploaded`
                    : "None attached"}
                </span>
              </div>
            </div>

            {/* Timeline info callout */}
            <div className="mt-6 bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex items-start text-left gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-900 leading-relaxed">
                <strong className="font-semibold">What happens next?</strong> Both your report and
                the host / guard security logs are cross-referenced with entrance sensor timestamps.
                Refund decisions are notified via SMS and email.
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/driver/bookings/${booking.id}`}
                className="px-6 py-3 bg-[#064E3B] text-white font-medium text-sm rounded-lg hover:bg-[#064E3B]/90 transition shadow-sm"
              >
                Return to Booking Details
              </Link>
              <Link
                href="/driver/dashboard"
                className="px-6 py-3 bg-white text-slate-700 font-medium text-sm rounded-lg border border-gray-300 hover:bg-slate-50 transition"
              >
                Driver Dashboard
              </Link>
              <Link
                href="/driver/refunds"
                className="px-6 py-3 bg-white text-slate-700 font-medium text-sm rounded-lg border border-gray-300 hover:bg-slate-50 transition"
              >
                Refund Ledger
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Main Dispute Form View
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f9f9ff] text-slate-800 pb-28">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href={`/driver/bookings/${booking.id}`}
            className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-emerald-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Booking
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-slate-500">
              ID: {booking.id}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {/* Page Title & Context */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-800 border border-rose-200 uppercase tracking-wider">
              Resolution Center
            </span>
            <span className="text-xs text-slate-500">• 24-48h SLA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight">
            File a Booking Dispute
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Submit a formal claim for review by ParkEase BD safety and settlement officers.
          </p>
        </div>

        {/* 1. Warning & Disclaimer Banner */}
        <div className="mb-8 rounded-xl bg-amber-50 border border-amber-300 p-4 sm:p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed">
              <h4 className="font-semibold text-amber-900 mb-1">
                Dispute Policy &amp; SLA Commitment
              </h4>
              <p className="text-amber-800/90 text-xs sm:text-sm">
                ParkEase BD investigates all driver claims within <strong>24 to 48 hours</strong>.
                Our team audits security guard check-in records and sensor timestamps.
                Submitting fraudulent claims or doctored evidence violates our Terms of Service
                and may lead to immediate account termination.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Target Booking Summary Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-800" />
              <h3 className="font-bold text-slate-900 text-base">{booking.propertyTitle}</h3>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 w-fit">
              {booking.spotNumber}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Location</span>
              <p className="text-slate-700 font-medium flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {booking.area}
              </p>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Date &amp; Duration</span>
              <p className="text-slate-700 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {booking.date} ({booking.durationHours} hrs)
              </p>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Vehicle</span>
              <p className="text-slate-700 font-medium flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {booking.vehicle.registrationNumber}
              </p>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Amount Paid</span>
              <p className="text-emerald-900 font-bold flex items-center gap-1 font-mono text-sm">
                <CreditCard className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                ৳ {booking.payment.totalPaid} ({booking.payment.paymentMethod})
              </p>
            </div>
          </div>
        </div>

        {/* 3. Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Dispute Category */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-900 mb-1">
                Dispute Category <span className="text-rose-600">*</span>
              </label>
              <p className="text-xs text-slate-500">
                Select the primary classification that describes the problem encountered.
              </p>
            </div>

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DISPUTE_CATEGORIES.map((cat) => {
                    const isSelected = field.value === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => field.onChange(cat.id)}
                        className={`text-left p-4 rounded-xl border transition-all relative ${
                          isSelected
                            ? "border-emerald-800 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-800"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className={`text-sm font-semibold ${
                              isSelected ? "text-emerald-900" : "text-slate-800"
                            }`}
                          >
                            {cat.label}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${
                              isSelected
                                ? "border-emerald-800 bg-emerald-800 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          {cat.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.category && (
              <p className="mt-2 text-xs font-semibold text-rose-600">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Incident Timeline & Description */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-bold text-slate-900 mb-1"
                >
                  Detailed Incident Timeline &amp; Description{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <p className="text-xs text-slate-500">
                  Provide exact details (e.g. arrival time, guard interactions, spot obstruction, or unexpected charges).
                </p>
              </div>
              <span
                className={`text-xs font-mono font-medium ${
                  descriptionValue.length < 20
                    ? "text-rose-600"
                    : descriptionValue.length > 900
                    ? "text-amber-600"
                    : "text-slate-500"
                }`}
              >
                {descriptionValue.length} / 1000 characters
              </span>
            </div>

            <textarea
              id="description"
              rows={5}
              placeholder="e.g. I arrived at Gulshan Residential Parking at 10:15 AM. The security guard at Gate 2 claimed that spot #B-04 was reserved for another resident and refused to let me enter despite showing my digital OTP pass..."
              className={`w-full text-sm rounded-lg border p-3.5 focus:outline-none focus:ring-2 transition ${
                errors.description
                  ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                  : "border-gray-300 focus:ring-emerald-800/20 focus:border-emerald-800"
              }`}
              {...register("description")}
            />

            {errors.description && (
              <p className="mt-1.5 text-xs font-semibold text-rose-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Desired Resolution */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-900 mb-1">
                Desired Resolution <span className="text-rose-600">*</span>
              </label>
              <p className="text-xs text-slate-500">
                Tell us what outcome you are requesting for this dispute.
              </p>
            </div>

            <Controller
              name="resolution"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {RESOLUTION_OPTIONS.map((opt) => {
                    const isSelected = field.value === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => field.onChange(opt.id)}
                        className={`text-left p-4 rounded-xl border transition-all relative ${
                          isSelected
                            ? "border-emerald-800 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-800"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              isSelected
                                ? "bg-emerald-800 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-sm font-semibold ${
                              isSelected ? "text-emerald-900" : "text-slate-800"
                            }`}
                          >
                            {opt.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed pl-9">
                          {opt.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.resolution && (
              <p className="mt-2 text-xs font-semibold text-rose-600">
                {errors.resolution.message}
              </p>
            )}
          </div>

          {/* Evidence Upload */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-900 mb-1">
                Supporting Evidence &amp; Documentation
              </label>
              <p className="text-xs text-slate-500">
                Upload photos of blocked parking bay, screenshots of payments, or gate receipts (JPG, PNG, PDF up to 25MB).
              </p>
            </div>

            {/* Drag and Drop Zone */}
            <div className="border-2 border-dashed border-gray-300 hover:border-emerald-700/60 rounded-xl p-6 text-center transition bg-slate-50/50">
              <UploadCloud className="w-10 h-10 text-emerald-800/70 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                Drag and drop files here, or{" "}
                <button
                  type="button"
                  onClick={() => handleAddSampleFile("Gate_Sensor_Snapshot.jpg", "1.8 MB")}
                  className="text-emerald-800 font-semibold underline hover:text-emerald-900"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported formats: PNG, JPG, JPEG, PDF, MP4 (Max 25MB)
              </p>

              {/* Quick sample chips for instant test simulation */}
              <div className="mt-4 pt-3 border-t border-gray-200/80 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Quick Mock Attachments:</span>
                <button
                  type="button"
                  onClick={() => handleAddSampleFile("bKash_SMS_Statement.png", "840 KB")}
                  className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-md hover:border-emerald-700 text-slate-700 hover:text-emerald-800 transition"
                >
                  + bKash Receipt
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSampleFile("Blocked_Bay_Photo.jpg", "3.1 MB")}
                  className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-md hover:border-emerald-700 text-slate-700 hover:text-emerald-800 transition"
                >
                  + Blocked Spot Photo
                </button>
              </div>
            </div>

            {/* Attached Files List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Attached Files ({files.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <FileText className="w-4 h-4 text-emerald-800 flex-shrink-0" />
                        <span className="font-medium text-slate-800 truncate">
                          {file.name}
                        </span>
                        <span className="text-slate-400 flex-shrink-0">({file.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Declaration Checkbox */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
            <Controller
              name="declaration"
              control={control}
              render={({ field }) => (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value === true}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-800 focus:ring-emerald-800"
                  />
                  <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    I declare that all details, statements, and documentation submitted in this claim
                    are truthful and accurate. I understand that submitting false claims violates
                    ParkEase BD Driver Code of Conduct and may result in penalties or account suspension.
                  </span>
                </label>
              )}
            />
            {errors.declaration && (
              <p className="mt-2 text-xs font-semibold text-rose-600">
                {errors.declaration.message}
              </p>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <Link
              href={`/driver/bookings/${booking.id}`}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel &amp; Return
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-lg text-sm font-semibold text-white transition flex items-center justify-center gap-2 shadow-sm ${
                isSubmitting
                  ? "bg-emerald-800/70 cursor-not-allowed"
                  : "bg-[#064E3B] hover:bg-[#064E3B]/90 active:scale-[0.99]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Dispute Claim...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Submit Formal Dispute</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
