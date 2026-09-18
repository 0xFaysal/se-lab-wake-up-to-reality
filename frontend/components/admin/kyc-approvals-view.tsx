"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  ZoomIn,
  Building,
  User,
  Calendar,
  Clock,
  Loader2,
  FileCheck,
  Search,
  Filter,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  kycDecisionSchema,
  type KycDecisionFormValues,
} from "@/lib/validations/admin";
import { cn } from "@/lib/utils";

interface KycSubmission {
  id: string;
  ownerName: string;
  email: string;
  phone: string;
  propertyTitle: string;
  propertyArea: string;
  propertyType: "RESIDENTIAL" | "COMMERCIAL";
  idType: "SMART_NID" | "NID" | "PASSPORT";
  idNumber: string;
  dateOfBirth: string;
  tradeLicense?: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  frontDocumentUrl: string;
  backDocumentUrl: string;
  rejectionReason?: string;
}

const SAMPLE_KYC_SUBMISSIONS: KycSubmission[] = [
  {
    id: "KYC-3019",
    ownerName: "Mohammad Rahim Uddin",
    email: "rahim.uddin@lakeview.bd",
    phone: "+880 1711-223344",
    propertyTitle: "Dhanmondi Lakeview Residential Garage",
    propertyArea: "Dhanmondi R/A",
    propertyType: "RESIDENTIAL",
    idType: "SMART_NID",
    idNumber: "1928374650",
    dateOfBirth: "1985-04-12",
    submittedAt: "2026-09-18T05:20:00Z",
    status: "PENDING",
    frontDocumentUrl:
      "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=800&auto=format&fit=crop&q=80",
    backDocumentUrl:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "KYC-3018",
    ownerName: "Farzana Chowdhury",
    email: "farzana.c@gulshantower.bd",
    phone: "+880 1819-556677",
    propertyTitle: "Gulshan 2 Commercial Parking Tower",
    propertyArea: "Gulshan 2",
    propertyType: "COMMERCIAL",
    idType: "PASSPORT",
    idNumber: "A09876543",
    dateOfBirth: "1982-11-28",
    tradeLicense: "TRAD/DNCC/082194/2025",
    submittedAt: "2026-09-17T10:15:00Z",
    status: "PENDING",
    frontDocumentUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80",
    backDocumentUrl:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "KYC-3017",
    ownerName: "Tanvir Hasan",
    email: "tanvir.hasan@dhakapark.bd",
    phone: "+880 1912-334455",
    propertyTitle: "Uttara Sector 11 Driveway Bays",
    propertyArea: "Uttara",
    propertyType: "RESIDENTIAL",
    idType: "NID",
    idNumber: "19892671829304123",
    dateOfBirth: "1989-08-19",
    submittedAt: "2026-09-16T14:45:00Z",
    status: "APPROVED",
    frontDocumentUrl:
      "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=800&auto=format&fit=crop&q=80",
    backDocumentUrl:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80",
  },
];

export function KycApprovalsView() {
  const [submissions, setSubmissions] = useState<KycSubmission[]>(SAMPLE_KYC_SUBMISSIONS);
  const [selectedId, setSelectedId] = useState<string>("KYC-3019");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedItem =
    submissions.find((s) => s.id === selectedId) || submissions[0]!;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KycDecisionFormValues>({
    resolver: zodResolver(kycDecisionSchema),
    defaultValues: {
      decision: "APPROVE",
      rejectionReason: "",
      internalNotes: "",
    },
  });

  const filteredSubmissions = submissions.filter((s) =>
    s.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.idNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleDecision(decision: "APPROVE" | "REJECT", data?: KycDecisionFormValues) {
    await new Promise((resolve) => setTimeout(resolve, 800));

    setSubmissions((prev) =>
      prev.map((item) => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            status: decision === "APPROVE" ? "APPROVED" : "REJECTED",
            rejectionReason: decision === "REJECT" ? data?.rejectionReason : undefined,
          };
        }
        return item;
      })
    );

    setShowRejectBox(false);
    reset();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#064E3B]/20 bg-[#064E3B]/8 px-3 py-1 text-xs font-semibold text-[#064E3B] mb-2">
            <ShieldCheck className="size-3.5" />
            <span>Host Regulatory Compliance & KYC Approvals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">
            Host KYC Approvals Queue
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Audit national ID credentials and business licenses to enable automatic financial payout withdrawals.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search host, NID, or property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 text-xs pl-9 rounded-lg bg-white border-[#E5E7EB]"
          />
        </div>
      </div>

      {/* Main Grid: Data Table Left (7 cols), Side Inspection Panel Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* DATA TABLE */}
        <div className="lg:col-span-7 rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground font-heading">
              Verifications Queue ({filteredSubmissions.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              Showing pending & recent submissions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#f9f9ff] text-muted-foreground uppercase text-[10px] font-bold font-heading">
                  <th className="px-4 py-3">Host & Property</th>
                  <th className="px-3 py-3">ID Type & No.</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredSubmissions.map((sub) => {
                  const isSelected = sub.id === selectedItem.id;
                  return (
                    <tr
                      key={sub.id}
                      onClick={() => {
                        setSelectedId(sub.id);
                        setShowRejectBox(false);
                      }}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-[#f9f9ff]",
                        isSelected && "bg-[#064E3B]/6"
                      )}
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-foreground">{sub.ownerName}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                          {sub.propertyTitle}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="font-mono font-semibold text-foreground">{sub.idNumber}</div>
                        <div className="text-[10px] text-muted-foreground">{sub.idType.replace("_", " ")}</div>
                      </td>
                      <td className="px-3 py-3.5">
                        <Badge variant="outline" className="text-[10px] font-semibold border-[#E5E7EB]">
                          {sub.propertyType}
                        </Badge>
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                            sub.status === "PENDING"
                              ? "bg-amber-100 text-amber-900"
                              : sub.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-red-100 text-red-900"
                          )}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "h-7 text-[11px] font-bold rounded-md",
                            isSelected && "bg-[#064E3B] text-white hover:bg-[#003527]"
                          )}
                        >
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIDE PANEL: Document & Input Data Inspection */}
        <div className="lg:col-span-5 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-foreground">
                  {selectedItem.id}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    selectedItem.status === "PENDING"
                      ? "bg-amber-100 text-amber-900"
                      : selectedItem.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-red-100 text-red-900"
                  )}
                >
                  {selectedItem.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground font-heading mt-0.5">
                {selectedItem.ownerName}
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Submitted: {new Date(selectedItem.submittedAt).toLocaleDateString("en-BD")}
            </span>
          </div>

          {/* Form Input Data Table */}
          <div className="rounded-lg bg-[#f9f9ff] border border-[#E5E7EB] p-4 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Full Legal Name:</span>
              <span className="font-bold text-foreground">{selectedItem.ownerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID Type:</span>
              <span className="font-semibold text-foreground">{selectedItem.idType.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Document Number:</span>
              <span className="font-mono font-bold text-foreground">{selectedItem.idNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of Birth:</span>
              <span className="font-semibold text-foreground">{selectedItem.dateOfBirth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property Classification:</span>
              <span className="font-semibold text-foreground">{selectedItem.propertyType}</span>
            </div>
            {selectedItem.tradeLicense && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trade License / TIN:</span>
                <span className="font-mono font-bold text-foreground">{selectedItem.tradeLicense}</span>
              </div>
            )}
          </div>

          {/* Side-by-Side Uploaded NID Images */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
              Uploaded Identity Documents (Front & Back)
            </Label>

            <div className="grid grid-cols-2 gap-3">
              {/* Front Side */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-foreground">Front Side</span>
                <div className="relative aspect-[4/3] rounded-lg border border-[#E5E7EB] bg-slate-100 overflow-hidden group">
                  <Image
                    src={selectedItem.frontDocumentUrl}
                    alt="ID Document Front"
                    fill
                    unoptimized
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold">
                    <ZoomIn className="size-4 mr-1" />
                    Preview
                  </div>
                </div>
              </div>

              {/* Back Side */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-foreground">Back Side</span>
                <div className="relative aspect-[4/3] rounded-lg border border-[#E5E7EB] bg-slate-100 overflow-hidden group">
                  <Image
                    src={selectedItem.backDocumentUrl}
                    alt="ID Document Back"
                    fill
                    unoptimized
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold">
                    <ZoomIn className="size-4 mr-1" />
                    Preview
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Panel: Approve (Green) and Reject (Red) */}
          {selectedItem.status === "PENDING" ? (
            <div className="space-y-4 border-t border-[#E5E7EB] pt-4">
              {!showRejectBox ? (
                <div className="grid grid-cols-2 gap-3">
                  {/* Approve Green Button */}
                  <Button
                    onClick={() => handleDecision("APPROVE")}
                    className="h-11 font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg shadow-xs flex items-center justify-center gap-1.5 text-xs"
                  >
                    <CheckCircle2 className="size-4" />
                    Approve KYC
                  </Button>

                  {/* Reject Red Button */}
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectBox(true)}
                    className="h-11 font-bold text-red-700 border-red-200 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1.5 text-xs"
                  >
                    <XCircle className="size-4" />
                    Reject KYC
                  </Button>
                </div>
              ) : (
                /* Rejection Reason Form */
                <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-950 font-heading">
                      Provide Rejection Reason
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <Textarea
                    placeholder="e.g. Back of NID document is blurry and signature is illegible. Please re-upload a clear photo."
                    className="text-xs bg-white border-red-200 focus:border-red-500 rounded-lg"
                    rows={3}
                    {...register("rejectionReason")}
                  />
                  {errors.rejectionReason && (
                    <p className="text-xs text-red-700 font-medium">
                      {errors.rejectionReason.message}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowRejectBox(false)}
                      className="h-8 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit((data) => handleDecision("REJECT", data))}
                      className="h-8 text-xs font-bold bg-red-700 text-white hover:bg-red-800 rounded-lg"
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-[#f9f9ff] border border-[#E5E7EB] p-3 text-center text-xs">
              <span className="font-semibold text-foreground">
                This verification was marked {selectedItem.status.toLowerCase()}.
              </span>
              {selectedItem.rejectionReason && (
                <p className="text-muted-foreground mt-1 text-[11px]">
                  Reason: &quot;{selectedItem.rejectionReason}&quot;
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
