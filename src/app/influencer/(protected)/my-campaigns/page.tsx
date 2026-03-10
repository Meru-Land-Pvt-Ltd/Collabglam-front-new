"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Clock,
  Dumbbell,
  Globe,
  LayoutGrid,
  MapPin,
  Search,
  Shirt,
  TrendingDown,
  TrendingUp,
  Utensils,
  Video,
  ArrowUpDown,
  X,
  FileText,
  PenLine,
  Eye,
} from "lucide-react";
import { HiDocumentText, HiOutlineEye, HiOutlineEyeOff, HiX } from "react-icons/hi";

import { InstagramLogoIcon, YoutubeLogoIcon } from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input as ShadInput } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  FloatingSelect,
  FloatingMultiSelect,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ManualPreviewCard } from "@/components/ui/cardPreview";
import Swal from "sweetalert2";
import api, { post } from "@/lib/api";

/* ─────────────────────────── Toast & Confirm helpers ───────────────────────── */
const toast = (opts: {
  icon: "success" | "error" | "info";
  title: string;
  text?: string;
}) =>
  Swal.fire({
    ...opts,
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    background: "white",
    customClass: {
      popup: "rounded-lg border border-gray-200",
    },
  });

const askConfirm = async (title: string, text?: string) => {
  const res = await Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, continue",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    background: "white",
  });
  return res.isConfirmed;
};

/* ─────────────────────────────────── Types ─────────────────────────────────── */
interface CampaignData {
  // filter/display fields (from file 1)
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  daysLeft: number;
  match: number;
  category: string;
  platform: string;
  location: string;
  status: string;
  campaignStatus: string;
  // contract fields (from file 2)
  brandId: string;
  brandName: string;
  productOrServiceName: string;
  timeline: { startDate: string; endDate: string };
  isActive: number;
  budget: number;
  influencerBudget?: number;
  isApproved: number;
  isContracted: number;
  contractId: string;
  isAccepted: number;
  hasApplied: number;
  hasMilestone: number;
}

export type ServerInfluencer = {
  legalName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  shippingAddress?: string;
  taxFormType?: "W-9" | "W-8BEN" | "W-8BEN-E";
};

export type LocalInfluencer = {
  legalName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  taxId: string;
  taxFormType?: ServerInfluencer["taxFormType"];
  notes: string;
};

const emptyLocal: LocalInfluencer = {
  legalName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  taxId: "",
  taxFormType: "W-9",
  notes: "",
};

const trimStr = (s?: string) => (s || "").trim();
const sanitizeLocal = (p: LocalInfluencer): LocalInfluencer => ({
  ...p,
  legalName: trimStr(p.legalName),
  email: trimStr(p.email),
  phone: trimStr(p.phone),
  addressLine1: trimStr(p.addressLine1),
  addressLine2: trimStr(p.addressLine2),
  city: trimStr(p.city),
  state: trimStr(p.state),
  zip: trimStr(p.zip),
  country: trimStr(p.country),
  taxId: trimStr(p.taxId),
  notes: trimStr(p.notes),
});

const composeShippingAddress = (p: LocalInfluencer) =>
  [
    p.addressLine1,
    p.addressLine2,
    [p.city, p.state].filter(Boolean).join(", "),
    p.zip,
    p.country,
  ]
    .filter(Boolean)
    .join(", ");

const toServerInfluencer = (sp: LocalInfluencer): ServerInfluencer => ({
  legalName: sp.legalName,
  email: sp.email,
  phone: sp.phone,
  taxId: sp.taxId || undefined,
  addressLine1: sp.addressLine1,
  addressLine2: sp.addressLine2,
  city: sp.city,
  state: sp.state,
  postalCode: sp.zip,
  country: sp.country,
  notes: sp.notes,
  shippingAddress: composeShippingAddress(sp),
  taxFormType: sp.taxFormType,
});

export type PartyConfirm = {
  confirmed?: boolean;
  byUserId?: string;
  at?: string;
};
export type PartySign = {
  signed?: boolean;
  byUserId?: string;
  name?: string;
  email?: string;
  at?: string;
};

export type ContractMeta = {
  status?: ContractStatus | string;
  confirmations?: { brand?: PartyConfirm; influencer?: PartyConfirm };
  acceptances?: any;
  signatures?: { brand?: PartySign; influencer?: PartySign } & Record<
    string,
    any
  >;
  lockedAt?: string | null;
  editsLockedAt?: string | null;
  awaitingRole?: "brand" | "influencer" | null | string;
  version?: number;
  campaignId?: string;
  contractId?: string;
  supersededBy?: string | null;
  resendOf?: string | null;
  resendIteration?: number;
};

const CONTRACT_STATUS = {
  DRAFT: "DRAFT",
  BRAND_SENT_DRAFT: "BRAND_SENT_DRAFT",
  BRAND_EDITED: "BRAND_EDITED",
  INFLUENCER_EDITED: "INFLUENCER_EDITED",
  BRAND_ACCEPTED: "BRAND_ACCEPTED",
  INFLUENCER_ACCEPTED: "INFLUENCER_ACCEPTED",
  READY_TO_SIGN: "READY_TO_SIGN",
  CONTRACT_SIGNED: "CONTRACT_SIGNED",
  MILESTONES_CREATED: "MILESTONES_CREATED",
  REJECTED: "REJECTED",
  SUPERSEDED: "SUPERSEDED",
} as const;

export type ContractStatus =
  (typeof CONTRACT_STATUS)[keyof typeof CONTRACT_STATUS];

const normStatus = (s?: string) => String(s || "").trim().toUpperCase();

const signingStatusLabel = (meta?: ContractMeta | null) => {
  if (!meta) return null;
  const st = normStatus(meta.status);
  if (st === CONTRACT_STATUS.MILESTONES_CREATED) return "Milestone Added";
  if (st === CONTRACT_STATUS.CONTRACT_SIGNED)
    return "Awaiting Milestone Creation";
  const isSigningPhase =
    st === CONTRACT_STATUS.READY_TO_SIGN || !!meta.editsLockedAt;
  if (!isSigningPhase) return null;
  const b = !!meta.signatures?.brand?.signed;
  const i = !!meta.signatures?.influencer?.signed;
  if (b && i) return "Signed";
  const awaiting = String(meta.awaitingRole || "").toLowerCase();
  if (awaiting === "brand") return "Awaiting brand signature";
  if (awaiting === "influencer") return "Awaiting influencer signature";
  if (awaiting === "collabglam") return "Ready to sign";
  if (!b && !i) return "Ready to sign";
  if (b && !i) return "Awaiting influencer signature";
  if (!b && i) return "Awaiting brand signature";
  return null;
};

function apiMessage(e: any, fallback = "Something went wrong") {
  const status = e?.response?.status;
  const msg = e?.response?.data?.message || e?.message;
  const known = [
    "Contract is locked and cannot be edited",
    "Contract is locked for signing; edits are disabled",
    "Influencer must accept the current version first",
    "Brand must accept the current version first",
    "Both parties must accept the current version before signing",
    "Contract is not ready to sign yet",
    "Contract not found",
    "Signature image must be ≤ 50 KB.",
  ];
  if (msg && known.some((k) => String(msg).includes(k))) return msg;
  if (status === 400) return msg || "Bad request.";
  if (status === 401) return "Please sign in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "Not found.";
  if (status === 409) return msg || "Conflict. Please refresh.";
  if (status === 422) return msg || "Validation error.";
  if (status >= 500) return "Server error. Please try again.";
  return msg || fallback;
}

/* -------------------------------------------------------------------------- */
/*                               DUMMY DATA                                   */
/* -------------------------------------------------------------------------- */

const campaignsData: CampaignData[] = [
  {
    id: "1",
    brandId: "brand-1",
    brandName: "FashionCo",
    title: "Summer Fashion Collection Launch",
    productOrServiceName: "Summer Fashion Collection Launch",
    description: "Promote summer fashion collection.",
    budgetMin: 2500,
    budgetMax: 5000,
    daysLeft: 3,
    match: 92,
    category: "Fashion",
    platform: "Instagram",
    location: "Remote",
    status: "applied",
    campaignStatus: "active",
    contractId: "",
    isContracted: 0,
    isAccepted: 0,
    hasApplied: 1,
    hasMilestone: 0,
    timeline: { startDate: "2026-04-01", endDate: "2026-06-30" },
    budget: 5000,
    influencerBudget: 4000,
    isActive: 1,
    isApproved: 1,
  },
  {
    id: "2",
    brandId: "brand-2",
    brandName: "HealthSnacks Inc.",
    title: "Healthy Snack Review Campaign",
    productOrServiceName: "Healthy Snack Review Campaign",
    description: "Review organic snacks.",
    budgetMin: 1000,
    budgetMax: 2000,
    daysLeft: 7,
    match: 87,
    category: "Food",
    platform: "YouTube",
    location: "Remote",
    status: "invited",
    campaignStatus: "Contracted",
    contractId: "contract-abc-123",
    isContracted: 1,
    isAccepted: 0,
    hasApplied: 1,
    hasMilestone: 0,
    timeline: { startDate: "2026-05-01", endDate: "2026-07-31" },
    budget: 2000,
    influencerBudget: 1800,
    isActive: 1,
    isApproved: 1,
  },
  {
    id: "3",
    brandId: "brand-3",
    brandName: "FitLife",
    title: "Fitness Challenge Promotion",
    productOrServiceName: "Fitness Challenge Promotion",
    description: "Promote 30-day challenge.",
    budgetMin: 1200,
    budgetMax: 2800,
    daysLeft: 4,
    match: 78,
    category: "Fitness",
    platform: "Instagram",
    location: "Remote",
    status: "contract",
    campaignStatus: "pending",
    contractId: "",
    isContracted: 0,
    isAccepted: 0,
    hasApplied: 1,
    hasMilestone: 0,
    timeline: { startDate: "2026-06-01", endDate: "2026-08-31" },
    budget: 2800,
    influencerBudget: 2500,
    isActive: 1,
    isApproved: 1,
  },
  {
    id: "4",
    brandId: "brand-4",
    brandName: "GlowSkin Co.",
    title: "Skincare Routine Campaign",
    productOrServiceName: "Skincare Routine Campaign",
    description: "Showcase our new morning skincare routine products.",
    budgetMin: 3000,
    budgetMax: 6000,
    daysLeft: 10,
    match: 94,
    category: "Fashion",
    platform: "Instagram",
    location: "Remote",
    status: "contract",
    campaignStatus: "Contracted",
    contractId: "contract-skin-789",
    isContracted: 1,
    isAccepted: 0,
    hasApplied: 1,
    hasMilestone: 0,
    timeline: { startDate: "2026-04-15", endDate: "2026-07-15" },
    budget: 6000,
    influencerBudget: 5500,
    isActive: 1,
    isApproved: 1,
  },
];

/* -------------------------------------------------------------------------- */
/*                               FILTER OPTIONS                               */
/* -------------------------------------------------------------------------- */

const categories = [
  { value: "all", label: "All Categories", icon: LayoutGrid },
  { value: "Fashion", label: "Fashion", icon: Shirt },
  { value: "Food", label: "Food", icon: Utensils },
  { value: "Fitness", label: "Fitness", icon: Dumbbell },
];

const platforms = [
  { value: "Instagram", label: "Instagram", icon: InstagramLogoIcon },
  { value: "YouTube", label: "YouTube", icon: YoutubeLogoIcon },
  { value: "TikTok", label: "TikTok", icon: Video },
];

const locations = [
  { value: "all", label: "All Locations", icon: Globe },
  { value: "Remote", label: "Remote", icon: Globe },
];

const sortOptions = [
  { value: "match", label: "Best Match", icon: ArrowUpDown },
  { value: "budget-high", label: "Highest Budget", icon: TrendingUp },
  { value: "budget-low", label: "Lowest Budget", icon: TrendingDown },
  { value: "ending", label: "Ending Soon", icon: Clock },
];

const campaignStatusOptions = [
  { value: "all", label: "All", icon: LayoutGrid },
  {value:"applied", label:"Applied Campaigns", icon: FileText},
  { value: "active", label: "Active Campaigns", icon: TrendingUp },
  { value: "Contracted", label: "Contracted", icon: Clock },
  { value: "Rejected", label: "Rejected", icon: TrendingDown },
];

const deadlineProximityOptions = [
  { value: "any", label: "Any", icon: LayoutGrid },
  { value: "ending-soon", label: "Ending Soon (1-3 days)", icon: Clock },
  { value: "this-week", label: "This Week (4-7 days)", icon: Clock },
  { value: "next-month", label: "Next Month (8-30 days)", icon: Clock },
  { value: "30plus", label: "30+ Days", icon: TrendingUp },
];

type TabValue =
  | "all"
  | "active"
  | "pending"
  | "under-review"
  | "completed"
  | "cancelled";

const tabs = campaignStatusOptions;

/* -------------------------------------------------------------------------- */
/*                              MAPPER FUNCTION                               */
/* -------------------------------------------------------------------------- */

function campaignToPreview(campaign: CampaignData) {
  return {
    form: {
      title: campaign.title,
      description: campaign.description,
      categoryName: campaign.category,
      targetCountry: [campaign.location],
      targetAgeGroups: ["18-24"],
      goals: ["Brand Awareness"],
      campaignBudget: campaign.budgetMax,
    },
    meta: {
      countryMap: { [campaign.location]: campaign.location },
      ageMap: { "18-24": "18–24" },
      goalsMap: { "Brand Awareness": "Brand Awareness" },
      campaignBudget: campaign.budgetMax,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                            HELPER FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

function getDeadlineProximityRange(daysLeft: number): string {
  if (daysLeft <= 3) return "ending-soon";
  if (daysLeft <= 7) return "this-week";
  if (daysLeft <= 30) return "next-month";
  return "30plus";
}

/* -------------------------------------------------------------------------- */
/*                      FORM FIELD COMPONENTS (from file 2)                   */
/* -------------------------------------------------------------------------- */

function FloatingInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 pt-6 pb-2 border-2 rounded-lg text-sm transition-all duration-200 focus:outline-none ${
          disabled
            ? "border-gray-200 opacity-60 cursor-not-allowed"
            : "border-gray-200 focus:border-[#FFBF00]"
        }`}
        placeholder=" "
      />
      <label
        htmlFor={id}
        className="absolute left-4 top-2 text-xs text-[#FFBF00] font-medium pointer-events-none"
      >
        {label}
      </label>
    </div>
  );
}

function FloatingTextarea({
  id,
  label,
  value,
  onChange,
  rows = 3,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 pt-6 pb-2 border-2 rounded-lg text-sm transition-all duration-200 focus:outline-none ${
          disabled
            ? "border-gray-200 opacity-60 cursor-not-allowed"
            : "border-gray-200 focus:border-[#FFBF00]"
        }`}
        placeholder=" "
      />
      <label
        htmlFor={id}
        className="absolute left-4 top-2 text-xs text-[#FFBF00] font-medium pointer-events-none"
      >
        {label}
      </label>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          SIGNATURE MODAL (from file 2)                     */
/* -------------------------------------------------------------------------- */

function SignatureModal({
  open,
  onClose,
  onSubmit,
  title = "Add Signature",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (signatureDataUrl: string) => Promise<void> | void;
  title?: string;
}) {
  const [sig, setSig] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setSig("");
      setErr("");
      setFileName("");
      setFileSize(null);
      setIsDragging(false);
      setIsSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, isSubmitting]);

  const formatSize = (size: number | null) => {
    if (!size) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const onFile = (f?: File) => {
    if (isSubmitting) return;
    setErr("");
    setIsDragging(false);
    if (!f) return;
    setFileName(f.name);
    setFileSize(f.size);
    if (!/image\/(png|jpeg)/i.test(f.type)) {
      setSig("");
      return setErr("Please upload a PNG or JPG image.");
    }
    if (f.size > 50 * 1024) {
      setSig("");
      return setErr("Signature must be ≤ 50 KB.");
    }
    const r = new FileReader();
    r.onload = () => setSig(String(r.result || ""));
    r.readAsDataURL(f);
  };

  useEffect(() => {
    if (!open) return;
    const el = dropRef.current;
    if (!el) return;
    const onDragOver = (e: DragEvent) => {
      if (isSubmitting) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };
    const onDragEnter = (e: DragEvent) => {
      if (isSubmitting) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (isSubmitting) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.target === el) setIsDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      if (isSubmitting) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const f = e.dataTransfer?.files?.[0];
      onFile(f || undefined);
    };
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragenter", onDragEnter);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragenter", onDragEnter);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, [open, isSubmitting]);

  if (!open) return null;

  const handleSign = async () => {
    if (isSubmitting) return;
    if (!sig) {
      setErr("Please select a signature image first.");
      return;
    }
    try {
      setIsSubmitting(true);
      await onSubmit(sig);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] ${
          isSubmitting ? "pointer-events-none" : ""
        }`}
        onClick={() => !isSubmitting && onClose()}
      />
      <div className="relative z-[61] w-[96%] max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="relative h-24">
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #FFBF00 0%, #FFDB58 100%)",
            }}
          />
          <div className="relative z-10 h-full px-5 flex items-center justify-between text-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/50 flex items-center justify-center text-lg">
                ✍️
              </div>
              <div className="flex flex-col">
                <div className="font-semibold tracking-wide text-sm sm:text-base">
                  {title}
                </div>
                <div className="text-xs text-gray-800/80">
                  Upload your official signature (PNG/JPG, ≤ 50 KB)
                </div>
              </div>
            </div>
            <button
              className={`w-9 h-9 rounded-full bg-white/40 hover:bg-white flex items-center justify-center text-gray-800 transition ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting as any}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-700">
              This signature will be embedded into your agreement as the
              authorized sign-off.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Best with transparent PNG
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                💡 Tip: Use a dark pen on white paper, then crop neatly.
              </span>
            </div>
          </div>

          {/* Drop zone */}
          <div
            ref={dropRef}
            className={`rounded-xl border-2 border-dashed p-5 text-center text-sm transition-all select-none ${
              isSubmitting
                ? "opacity-60 cursor-not-allowed border-gray-300 bg-gray-50"
                : isDragging
                ? "cursor-pointer border-amber-400 bg-amber-50 shadow-sm"
                : "cursor-pointer border-gray-300 bg-gray-50 hover:bg-gray-100/80"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <span className="text-lg">📁</span>
              </div>
              <div className="font-medium text-gray-800">
                {isSubmitting
                  ? "Submitting..."
                  : isDragging
                  ? "Drop your signature image here"
                  : "Drag & drop signature image here"}
              </div>
              <div className="text-xs text-gray-500">
                or use the file picker below
              </div>
            </div>
          </div>

          {/* File input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">
              Signature file
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg"
              disabled={isSubmitting}
              onChange={(e) => onFile(e.target.files?.[0] as any)}
              className="block w-full text-xs sm:text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-black disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between items-center text-[11px] text-gray-500">
              <span>Allowed: PNG, JPG · Max size: 50 KB</span>
              {fileSize !== null && (
                <span>
                  Selected:{" "}
                  <span
                    className={
                      fileSize > 50 * 1024 ? "text-red-600 font-medium" : ""
                    }
                  >
                    {formatSize(fileSize)}
                  </span>
                </span>
              )}
            </div>
            {fileName && (
              <div className="text-[11px] text-gray-600 truncate">
                File: <span className="font-medium">{fileName}</span>
              </div>
            )}
            {err && (
              <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <span>⚠️</span>
                <span>{err}</span>
              </div>
            )}
          </div>

          {/* Preview */}
          {sig && (
            <div className="border rounded-xl p-3 bg-gray-50 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-gray-700">
                    Signature preview
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      if (isSubmitting) return;
                      setSig("");
                      setFileName("");
                      setFileSize(null);
                      setErr("");
                    }}
                    className="text-[11px] text-gray-500 hover:text-gray-700 underline disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex items-center justify-center rounded-lg border bg-white px-3 py-2">
                  <img
                    src={sig}
                    alt="Signature preview"
                    className="max-h-14 object-contain"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-1 flex justify-end gap-3">
          <Button
            variant="outline"
            className="text-gray-900 border-gray-300 hover:bg-gray-100 disabled:opacity-60"
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-900 hover:from-[#FFDB58] hover:to-[#FFBF00] disabled:opacity-60"
            onClick={handleSign}
            disabled={!sig || isSubmitting}
          >
            {isSubmitting ? "Signing..." : "Sign"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                      INFLUENCER CONTRACT MODAL (from file 2)               */
/* -------------------------------------------------------------------------- */

function InfluencerContractModal({
  open,
  onClose,
  contractId,
  campaign,
  readOnly = false,
  onAfterAction,
  initialMode = "edit",
}: {
  open: boolean;
  onClose: () => void;
  contractId: string;
  campaign: CampaignData;
  readOnly?: boolean;
  onAfterAction?: () => void;
  initialMode?: "view" | "edit";
}) {
  const [local, setLocal] = useState<LocalInfluencer>(emptyLocal);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isWorking, setIsWorking] = useState(false);
  const [liteLoaded, setLiteLoaded] = useState(false);
  const [effectiveContractId, setEffectiveContractId] =
    useState<string>(contractId);
  const [meta, setMeta] = useState<ContractMeta | null>(null);
  const [showTax, setShowTax] = useState(false);

  const st = normStatus(meta?.status);
  const influencerConfirmed = !!meta?.confirmations?.influencer?.confirmed;
  const brandConfirmed = !!meta?.confirmations?.brand?.confirmed;
  const brandSigned = !!meta?.signatures?.brand?.signed;
  const influencerSigned = !!meta?.signatures?.influencer?.signed;
  const anyoneSigned = brandSigned || influencerSigned;
  const isReadyToSign =
    st === CONTRACT_STATUS.READY_TO_SIGN || !!meta?.editsLockedAt;
  const isLocked =
    !!meta?.lockedAt ||
    st === CONTRACT_STATUS.CONTRACT_SIGNED ||
    st === CONTRACT_STATUS.MILESTONES_CREATED;
  const isRejected = st === CONTRACT_STATUS.REJECTED;
  const isSuperseded = st === CONTRACT_STATUS.SUPERSEDED;

  const canEdit = useMemo(() => {
    if (readOnly) return false;
    if (isLocked || isReadyToSign) return false;
    if (isRejected || isSuperseded) return false;
    if (anyoneSigned) return false;
    return true;
  }, [readOnly, isLocked, isReadyToSign, isRejected, isSuperseded, anyoneSigned]);

  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [showSignModal, setShowSignModal] = useState(false);

  useEffect(() => {
    if (!canEdit && mode === "edit") setMode("view");
  }, [canEdit, mode]);

  const toLocalFromLite = (lite: any): LocalInfluencer => {
    const primary = (lite?.primaryPlatform || "").toLowerCase();
    const profiles: any[] = Array.isArray(lite?.socialProfiles)
      ? lite.socialProfiles
      : [];
    const match =
      profiles.find((p) => (p?.provider || "").toLowerCase() === primary) ||
      profiles[0] ||
      {};
    const bestName =
      lite?.legalName || lite?.name || match?.fullname || match?.username || "";
    return {
      legalName: bestName,
      email: lite?.email || "",
      phone: lite?.phone || "",
      addressLine1: "",
      addressLine2: "",
      city: lite?.city || "",
      state: lite?.state || "",
      zip: "",
      country: lite?.country || "",
      taxId: "",
      taxFormType: "W-9",
      notes: "",
    };
  };

  const contractInfluencerToLocal = (
    ci: any,
    prev: LocalInfluencer
  ): LocalInfluencer =>
    sanitizeLocal({
      ...prev,
      legalName: ci.legalName ?? prev.legalName,
      email: ci.email ?? prev.email,
      phone: ci.phone ?? prev.phone,
      addressLine1: ci.addressLine1 ?? prev.addressLine1,
      addressLine2: ci.addressLine2 ?? prev.addressLine2,
      city: ci.city ?? prev.city,
      state: ci.state ?? prev.state,
      zip: ci.postalCode ?? ci.zip ?? prev.zip,
      country: ci.country ?? prev.country,
      taxId: ci.taxId ?? prev.taxId,
      taxFormType: (ci.taxFormType as any) ?? prev.taxFormType,
      notes: ci.notes ?? prev.notes,
    });

  const fetchInfluencerLite = useCallback(async () => {
    try {
      const influencerId =
        typeof window !== "undefined"
          ? localStorage.getItem("influencerId")
          : null;
      if (!influencerId) throw new Error("No influencer ID.");
      const res = await api.get("/influencer/lite", {
        params: { influencerId },
      });
      setLocal(toLocalFromLite(res.data?.influencer || {}));
    } catch (e: any) {
      console.warn("lite fetch failed", e?.message);
    } finally {
      setLiteLoaded(true);
    }
  }, []);

  const fetchContractMeta = useCallback(async () => {
    try {
      const influencerId =
        typeof window !== "undefined"
          ? localStorage.getItem("influencerId")
          : null;
      if (!influencerId) throw new Error("No influencer ID.");
      const list = await post<{ success?: boolean; contracts: any[] }>(
        "/contract/getContract",
        {
          brandId: campaign.brandId,
          influencerId,
          campaignId: campaign.id,
        }
      );
      const arr = Array.isArray((list as any)?.contracts)
        ? (list as any).contracts
        : [];
      let c: any =
        arr.find(
          (x: any) => String(x.contractId) === String(contractId)
        ) ||
        arr.find(
          (x: any) => String(x.campaignId) === String(campaign.id)
        ) ||
        null;
      if (c?.supersededBy) {
        const child = arr.find(
          (x: any) => String(x.contractId) === String(c.supersededBy)
        );
        if (child) c = child;
      }
      if (c) {
        setEffectiveContractId(c.contractId);
        setMeta({
          status: c.status,
          confirmations: c.confirmations || {},
          signatures: c.signatures || {},
          lockedAt: c.lockedAt,
          editsLockedAt: c.editsLockedAt,
          awaitingRole: c.awaitingRole,
          version: c.version,
          campaignId: c.campaignId,
          contractId: c.contractId,
          supersededBy: c.supersededBy,
          resendOf: c.resendOf || null,
          resendIteration: c.resendIteration,
        });
        if (!readOnly && c.influencer && Object.keys(c.influencer).length) {
          setLocal((prev) => contractInfluencerToLocal(c.influencer, prev));
        }
      } else {
        setMeta(null);
        setEffectiveContractId(contractId);
      }
    } catch (e) {
      setMeta(null);
      setEffectiveContractId(contractId);
    }
  }, [campaign.brandId, campaign.id, contractId, readOnly]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setPreviewUrl("");
      await fetchInfluencerLite();
      if (cancelled) return;
      await fetchContractMeta();
    })();
    return () => {
      cancelled = true;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contractId, fetchInfluencerLite, fetchContractMeta]);

  useEffect(() => {
    if (!open) return;
    if (initialMode === "edit" && !readOnly) setMode("edit");
    else setMode("view");
  }, [open, initialMode, readOnly]);

  useEffect(() => {
    if (!canEdit && mode === "edit") setMode("view");
  }, [canEdit, mode]);

  useEffect(() => {
    if (!open) return;
    if ((mode === "view" || mode === "edit") && !previewUrl) {
      generatePreview(true).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, open]);

  const generatePreview = async (silent = false) => {
    setIsWorking(true);
    try {
      const res = await api.post(
        "/contract/viewPdf",
        { contractId: effectiveContractId },
        { responseType: "blob" }
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(res.data);
      setPreviewUrl(url);
      if (!silent) toast({ icon: "info", title: "PDF loaded" });
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Preview Error",
        text: apiMessage(e, "Failed to load PDF."),
      });
      throw e;
    } finally {
      setIsWorking(false);
    }
  };

  const acceptOrSave = async () => {
    setIsWorking(true);
    try {
      const sp = sanitizeLocal(local);
      const payload: ServerInfluencer = toServerInfluencer(sp);
      const isValidTaxId = (
        value: string,
        taxFormType?: ServerInfluencer["taxFormType"]
      ) => {
        const v = (value || "").trim();
        if (!v) return true;
        if (taxFormType === "W-9")
          return /^(?:\d{3}-\d{2}-\d{4}|\d{2}-\d{7}|\d{9})$/.test(v);
        return /^[A-Za-z0-9 \-\/]{4,30}$/.test(v);
      };
      if (!isValidTaxId(sp.taxId, sp.taxFormType)) {
        setIsWorking(false);
        toast({
          icon: "error",
          title: "Invalid Tax ID",
          text:
            sp.taxFormType === "W-9"
              ? "Enter a valid SSN (XXX-XX-XXXX), EIN (XX-XXXXXXX), or 9 digits."
              : "Enter a valid Tax ID (4–30 characters).",
        });
        return;
      }
      if (!influencerConfirmed) {
        const ok = await askConfirm(
          "Accept Contract?",
          "Your details will be submitted to the brand."
        );
        if (!ok) return;
        await post("/contract/influencer/confirm", {
          contractId: effectiveContractId,
          influencer: payload,
        });
        toast({
          icon: "success",
          title: "Accepted",
          text: "Details saved. Contract accepted.",
        });
      } else {
        await post("/contract/influencer/update", {
          contractId: effectiveContractId,
          influencerUpdates: payload,
        });
        toast({ icon: "success", title: "Saved", text: "Your changes were saved." });
      }
      await fetchContractMeta();
      onAfterAction && onAfterAction();
      setMode("view");
      await generatePreview(true);
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Error",
        text: apiMessage(e, "Failed to save."),
      });
    } finally {
      setIsWorking(false);
    }
  };

  const openSignature = () => {
    if (isLocked) return;
    if (!isReadyToSign) {
      toast({
        icon: "error",
        title: "Not ready to sign",
        text: "Waiting for both parties to accept.",
      });
      return;
    }
    if (!influencerConfirmed) {
      toast({
        icon: "error",
        title: "Accept first",
        text: "Please accept the contract before signing.",
      });
      return;
    }
    if (!brandConfirmed) {
      toast({
        icon: "error",
        title: "Brand acceptance pending",
        text: "Brand must accept before signing can start.",
      });
      return;
    }
    setShowSignModal(true);
  };

  const signWithSignature = async (signatureDataUrl: string) => {
    setIsWorking(true);
    try {
      await post("/contract/sign", {
        contractId: effectiveContractId,
        role: "influencer",
        name: local.legalName,
        email: local.email,
        signatureImageDataUrl: signatureDataUrl,
      });
      toast({ icon: "success", title: "Signed", text: "Signature recorded." });
      setShowSignModal(false);
      await fetchContractMeta();
      onAfterAction && onAfterAction();
      onClose();
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Sign Error",
        text: apiMessage(e, "Failed to sign."),
      });
    } finally {
      setIsWorking(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full bg-white shadow-2xl border-l flex flex-col">
        {/* Header */}
        <div className="relative h-24 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, #FFBF00 0%, #FFDB58 100%)`,
            }}
          />
          <div className="relative z-10 p-5 text-gray-900 flex items-center justify-between h-full">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center">
                  <HiDocumentText className="w-6 h-6 text-gray-900" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-medium opacity-90 uppercase tracking-wider">
                    {mode === "view"
                      ? "View Contract"
                      : influencerConfirmed
                      ? "Edit Contract Details"
                      : "Accept Contract"}
                  </div>
                  <div className="text-lg font-bold truncate">
                    {campaign?.productOrServiceName || "Campaign"}
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-800 truncate">
                    {campaign?.brandName ? `${campaign.brandName}` : ""}{" "}
                    {campaign?.brandName && campaign?.id ? "•" : ""}{" "}
                    {campaign?.id ? `#${campaign.id.slice(-6)}` : ""}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-full border border-gray-300 overflow-hidden">
                <button
                  className={`px-3 py-1.5 text-sm ${
                    mode === "view" ? "bg-white" : "bg-gray-100"
                  } transition`}
                  onClick={() => setMode("view")}
                >
                  View
                </button>
                {canEdit && (
                  <button
                    className={`px-3 py-1.5 text-sm ${
                      mode === "edit" ? "bg-white" : "bg-gray-100"
                    } transition`}
                    onClick={() => setMode("edit")}
                  >
                    Edit
                  </button>
                )}
              </div>
              <button
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110"
                onClick={onClose}
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Meta line */}
        <div className="px-5 pt-3 flex flex-wrap gap-2 text-[11px]">
          {meta?.status && (
            <span
              className={`px-2 py-1 rounded-full border ${
                isLocked
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-yellow-50 border-yellow-200 text-yellow-700"
              }`}
            >
              Status: {String(meta.status).toUpperCase()}
            </span>
          )}
          {(!!meta?.resendOf || (meta?.resendIteration ?? 0) > 0) && (
            <span className="px-2 py-1 rounded-full border bg-blue-50 border-blue-200 text-blue-700">
              Resent
            </span>
          )}
          <span className="px-2 py-1 rounded-full border bg-gray-50 border-gray-200 text-gray-700">
            You: {influencerConfirmed ? "Accepted" : "Pending"}
          </span>
          <span className="px-2 py-1 rounded-full border bg-gray-50 border-gray-200 text-gray-700">
            You Signed: {meta?.signatures?.influencer?.signed ? "Yes" : "No"}
          </span>
          <span className="px-2 py-1 rounded-full border bg-gray-50 border-gray-200 text-gray-700">
            Brand Signed: {meta?.signatures?.brand?.signed ? "Yes" : "No"}
          </span>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-6.5rem)] overflow-y-auto">
          {/* VIEW mode */}
          {mode === "view" && (
            <div className="p-5">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-gray-800">
                    Contract PDF
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        previewUrl
                          ? window.open(previewUrl, "_blank")
                          : generatePreview()
                      }
                    >
                      <HiOutlineEye className="mr-2 h-5 w-5" />
                      {previewUrl ? "Open in New Tab" : "Load PDF"}
                    </Button>
                  </div>
                </div>
                {previewUrl ? (
                  <iframe
                    className="w-full h-[70vh] rounded border"
                    src={previewUrl}
                  />
                ) : (
                  <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
                    Load the PDF to view your contract.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EDIT mode */}
          {mode === "edit" && (
            <div className="p-5">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
                {/* LEFT: PDF Preview */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 xl:sticky xl:top-4 self-start">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-gray-800">
                      Contract PDF
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          previewUrl
                            ? window.open(previewUrl, "_blank")
                            : generatePreview()
                        }
                      >
                        <HiOutlineEye className="mr-2 h-5 w-5" />
                        {previewUrl ? "Open in New Tab" : "Load PDF"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => generatePreview()}
                        disabled={isWorking}
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                  {previewUrl ? (
                    <iframe
                      className="w-full h-[70vh] rounded border"
                      src={previewUrl}
                    />
                  ) : (
                    <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
                      Load the PDF to view your contract.
                    </div>
                  )}
                </div>

                {/* RIGHT: Form */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="font-semibold text-gray-800 mb-3">
                    {influencerConfirmed
                      ? "Edit Your Details"
                      : "Fill Your Details to Accept"}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <FloatingInput
                      id="legalName"
                      label="Legal Name"
                      value={local.legalName}
                      onChange={(v) => setLocal((p) => ({ ...p, legalName: v }))}
                      disabled={!canEdit}
                    />
                    <FloatingInput
                      id="email"
                      label="Email"
                      value={local.email}
                      onChange={(v) => setLocal((p) => ({ ...p, email: v }))}
                      disabled={!canEdit}
                    />
                    <FloatingInput
                      id="phone"
                      label="Phone"
                      value={local.phone}
                      onChange={(v) => setLocal((p) => ({ ...p, phone: v }))}
                      disabled={!canEdit}
                    />
                    {/* Tax Form Type */}
                    <div className="relative">
                      <label
                        htmlFor="taxFormType"
                        className="absolute left-4 top-2 text-xs text-[#FFBF00] font-medium pointer-events-none"
                      >
                        Tax Form Type
                      </label>
                      <select
                        id="taxFormType"
                        disabled={!canEdit}
                        value={local.taxFormType}
                        onChange={(e) =>
                          setLocal((p) => ({
                            ...p,
                            taxFormType: e.target.value as any,
                          }))
                        }
                        className={`w-full px-4 pt-6 pb-2 border-2 rounded-lg text-sm transition-all duration-200 focus:outline-none ${
                          !canEdit
                            ? "border-gray-200 opacity-60 cursor-not-allowed"
                            : "border-gray-200 focus:border-[#FFBF00]"
                        }`}
                      >
                        <option value="W-9">W-9</option>
                        <option value="W-8BEN">W-8BEN</option>
                        <option value="W-8BEN-E">W-8BEN-E</option>
                      </select>
                    </div>
                    {/* Tax ID */}
                    <div className="relative">
                      <label
                        htmlFor="taxId"
                        className="absolute left-4 top-2 text-xs text-[#FFBF00] font-medium pointer-events-none"
                      >
                        Tax ID{" "}
                        {local.taxFormType === "W-9" ? "(SSN/EIN)" : ""}
                      </label>
                      <input
                        id="taxId"
                        type={showTax ? "text" : "password"}
                        value={local.taxId}
                        onChange={(e) =>
                          setLocal((p) => ({ ...p, taxId: e.target.value }))
                        }
                        disabled={!canEdit}
                        className={`w-full px-4 pt-6 pb-2 pr-12 border-2 rounded-lg text-sm transition-all duration-200 focus:outline-none ${
                          !canEdit
                            ? "border-gray-200 opacity-60 cursor-not-allowed"
                            : "border-gray-200 focus:border-[#FFBF00]"
                        }`}
                        placeholder=" "
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTax((s) => !s)}
                        disabled={!canEdit}
                        aria-label={showTax ? "Hide Tax ID" : "Show Tax ID"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-md border bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FFBF00] disabled:opacity-50"
                      >
                        {showTax ? (
                          <HiOutlineEyeOff className="w-5 h-5 text-gray-600" />
                        ) : (
                          <HiOutlineEye className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    </div>
                    <FloatingInput
                      id="addressLine1"
                      label="Address Line 1"
                      value={local.addressLine1}
                      onChange={(v) =>
                        setLocal((p) => ({ ...p, addressLine1: v }))
                      }
                      disabled={!canEdit}
                    />
                    <FloatingInput
                      id="addressLine2"
                      label="Address Line 2"
                      value={local.addressLine2}
                      onChange={(v) =>
                        setLocal((p) => ({ ...p, addressLine2: v }))
                      }
                      disabled={!canEdit}
                    />
                    <FloatingInput
                      id="city"
                      label="City"
                      value={local.city}
                      onChange={(v) => setLocal((p) => ({ ...p, city: v }))}
                      disabled={!canEdit}
                    />
                    <FloatingInput
                      id="state"
                      label="State"
                      value={local.state}
                      onChange={(v) => setLocal((p) => ({ ...p, state: v }))}
                      disabled={!canEdit}
                    />
                    <FloatingInput
                      id="zip"
                      label="ZIP / Postal Code"
                      value={local.zip}
                      onChange={(v) => setLocal((p) => ({ ...p, zip: v }))}
                      disabled={!canEdit}
                    />
                    <FloatingInput
                      id="country"
                      label="Country"
                      value={local.country}
                      onChange={(v) => setLocal((p) => ({ ...p, country: v }))}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="mt-3">
                    <FloatingTextarea
                      id="notes"
                      label="Notes (optional)"
                      value={local.notes}
                      onChange={(v) => setLocal((p) => ({ ...p, notes: v }))}
                      rows={3}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      onClick={acceptOrSave}
                      disabled={isWorking || !liteLoaded}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {influencerConfirmed ? "Save Changes" : "Accept & Save"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {isLocked ? (
              <span className="text-emerald-600">
                Locked — all signatures/confirmations captured.
              </span>
            ) : influencerConfirmed ? (
              <span className="text-emerald-600">
                Accepted — you can view{canEdit ? ", edit," : ""} and sign.
              </span>
            ) : (
              <span className="text-amber-600">
                Fill details to accept the contract.
              </span>
            )}
          </div>
          {/* Sign button in footer for convenience */}
          {!isLocked &&
            isReadyToSign &&
            influencerConfirmed &&
            brandConfirmed &&
            !influencerSigned && (
              <Button
                className="bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-900"
                onClick={openSignature}
                disabled={isWorking}
              >
                <PenLine className="mr-2 h-4 w-4" />
                Sign as Influencer
              </Button>
            )}
        </div>
      </div>

      {/* Nested Signature Modal */}
      <SignatureModal
        open={showSignModal}
        onClose={() => setShowSignModal(false)}
        title="Sign as Influencer"
        onSubmit={signWithSignature}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          REJECT BUTTON (from file 2)                       */
/* -------------------------------------------------------------------------- */

function RejectButton({
  contractId,
  onDone,
  autoOpen = false,
  onClose: onCloseProp,
}: {
  contractId: string;
  onDone: () => void;
  autoOpen?: boolean;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // When used as page-level modal, sync open with autoOpen changes
  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
    setOpen(false);
    onCloseProp?.();
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    } else {
      setReason("");
      setIsSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, isSubmitting]);

  const submit = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const influencerId =
        typeof window !== "undefined"
          ? localStorage.getItem("influencerId")
          : null;
      if (!influencerId) throw new Error("No influencer ID.");
      await post("/contract/reject", {
        contractId,
        influencerId,
        reason: reason.trim(),
      });
      toast({ icon: "info", title: "Rejected", text: "Contract has been rejected." });
      handleClose();
      onDone();
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Error",
        text: e?.message || "Failed to reject contract.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!autoOpen && (
        <button
          onClick={() => setOpen(true)}
          className="flex-1 py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium border border-red-200 transition-colors"
        >
          Reject
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div
            className={`absolute inset-0 backdrop-blur-sm bg-gray-900/30 ${
              isSubmitting ? "pointer-events-none" : ""
            }`}
            onClick={handleClose}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-[92vw] max-w-lg rounded-xl bg-white shadow-2xl border border-gray-200"
          >
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Reject Contract
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Let the brand know why you're rejecting this contract.
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-md p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
              >
                <HiX size={22} />
              </button>
            </div>
            <div className="px-4 sm:px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                ref={textareaRef}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
                className="w-full min-h-[110px] max-h-[40vh] resize-y p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60"
                placeholder="Write your reason..."
              />
              {isSubmitting && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
                  Processing rejection...
                </div>
              )}
            </div>
            <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                      Rejecting...
                    </span>
                  ) : (
                    "Reject"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*          CONTRACT ACTION BAR — rendered below each ManualPreviewCard       */
/* -------------------------------------------------------------------------- */

function ContractActionBar({
  campaign,
  meta,
  onOpenEditor,
  onSignDirect,
  onRefresh,
}: {
  campaign: CampaignData;
  meta: ContractMeta | null;
  onOpenEditor: (c: CampaignData, readOnly: boolean, mode?: "view" | "edit") => void;
  onSignDirect: (opts: {
    contractId: string;
    influencerConfirmed: boolean;
    brandConfirmed: boolean;
    isLocked: boolean;
    isReadyToSign: boolean;
  }) => void;
  onRefresh: () => void;
}) {
  const st = normStatus(meta?.status);
  const effectiveContractId = meta?.contractId || campaign.contractId;
  const hasContract = !!effectiveContractId;

  if (!hasContract) return null;

  const influencerConfirmed = !!meta?.confirmations?.influencer?.confirmed;
  const brandConfirmed = !!meta?.confirmations?.brand?.confirmed;
  const brandSigned = !!meta?.signatures?.brand?.signed;
  const influencerSigned = !!meta?.signatures?.influencer?.signed;
  const isReadyToSign = st === CONTRACT_STATUS.READY_TO_SIGN || !!meta?.editsLockedAt;
  const isLocked =
    !!meta?.lockedAt ||
    st === CONTRACT_STATUS.CONTRACT_SIGNED ||
    st === CONTRACT_STATUS.MILESTONES_CREATED;
  const isRejected = st === CONTRACT_STATUS.REJECTED;
  const isSuperseded = st === CONTRACT_STATUS.SUPERSEDED;

  const canEditRow =
    !isLocked && !isReadyToSign && !isRejected && !isSuperseded;
  const needsAccept = !influencerConfirmed && canEditRow;
  const canSign =
    !isLocked &&
    isReadyToSign &&
    influencerConfirmed &&
    brandConfirmed &&
    !influencerSigned;
  const canReject = !isLocked && !isRejected && !isSuperseded;

  const signLabel = signingStatusLabel(meta);
  const statusText =
    signLabel ??
    (st === CONTRACT_STATUS.BRAND_SENT_DRAFT
      ? "Awaiting Your Acceptance"
      : st === CONTRACT_STATUS.BRAND_EDITED
      ? "Updated by Brand"
      : st === CONTRACT_STATUS.INFLUENCER_ACCEPTED
      ? "Awaiting Brand Acceptance"
      : st === CONTRACT_STATUS.INFLUENCER_EDITED
      ? "Sent to Brand"
      : st === CONTRACT_STATUS.READY_TO_SIGN
      ? "Ready to Sign"
      : st === CONTRACT_STATUS.CONTRACT_SIGNED
      ? "Awaiting Milestones"
      : st === CONTRACT_STATUS.MILESTONES_CREATED
      ? "Milestone Added"
      : st === CONTRACT_STATUS.REJECTED
      ? "Rejected"
      : st === CONTRACT_STATUS.SUPERSEDED
      ? "Superseded"
      : meta?.status
      ? String(meta.status)
      : "Contract");

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {/* Status badge */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Contract
        </span>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
            isLocked
              ? "bg-emerald-100 text-emerald-700"
              : isRejected
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {statusText}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {needsAccept && (
          <button
            onClick={() =>
              onOpenEditor(
                { ...campaign, contractId: effectiveContractId },
                false,
                "edit"
              )
            }
            className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-900 text-xs font-semibold shadow-sm hover:brightness-95 transition-all"
          >
            Review & Accept
          </button>
        )}

        {!needsAccept && canEditRow && (
          <button
            onClick={() =>
              onOpenEditor(
                { ...campaign, contractId: effectiveContractId },
                false,
                "edit"
              )
            }
            className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-900 text-xs font-semibold shadow-sm hover:brightness-95 transition-all"
          >
            Edit Details
          </button>
        )}

        {canSign && (
          <button
            onClick={() =>
              onSignDirect({
                contractId: effectiveContractId,
                influencerConfirmed,
                brandConfirmed,
                isLocked,
                isReadyToSign,
              })
            }
            className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-900 text-xs font-semibold shadow-sm hover:brightness-95 transition-all flex items-center justify-center gap-1"
          >
            <PenLine className="h-3 w-3" />
            Sign
          </button>
        )}

        <button
          onClick={() =>
            onOpenEditor(
              { ...campaign, contractId: effectiveContractId },
              true,
              "view"
            )
          }
          className="flex-1 py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200 transition-colors flex items-center justify-center gap-1"
        >
          <Eye className="h-3 w-3" />
          View
        </button>

        {canReject && (
          <RejectButton contractId={effectiveContractId} onDone={onRefresh} />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 PAGE                                       */
/* -------------------------------------------------------------------------- */

export default function MyCampaignsPage() {
  // ── File 1: Filter/UI state ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortBy, setSortBy] = useState("match");
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 6000]);
  const [selectedCampaignStatus, setSelectedCampaignStatus] = useState("all");
  const [selectedDeadlineProximity, setSelectedDeadlineProximity] = useState("any");

  // ── File 2: Contract state ─────────────────────────────────────────────────
  const [metaCache, setMetaCache] = useState<Record<string, ContractMeta | null>>({});

  // Editor modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorReadOnly, setEditorReadOnly] = useState(false);
  const [editorContractId, setEditorContractId] = useState<string>("");
  const [editorCampaign, setEditorCampaign] = useState<CampaignData | null>(null);
  const [editorInitialMode, setEditorInitialMode] = useState<"view" | "edit">("edit");

  // Page-level signature modal (for direct Sign button on card)
  const [topSignOpen, setTopSignOpen] = useState(false);
  const [topSignContractId, setTopSignContractId] = useState<string>("");
  const [influencerIdentity, setInfluencerIdentity] = useState<{
    legalName?: string;
    name?: string;
    email?: string;
  }>({});
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);

  /* ── Load contract meta cache ─────────────────────────────────────────── */
  const loadMetaCache = useCallback(async (list: CampaignData[]) => {
    const influencerId =
      typeof window !== "undefined" ? localStorage.getItem("influencerId") : null;
    if (!influencerId) return;
    try {
      const withContracts = list.filter((c) => c.contractId);
      const metas = await Promise.all(
        withContracts.map(async (c) => {
          try {
            const res: any = await post("/contract/getContract", {
              brandId: c.brandId,
              influencerId,
              campaignId: c.id,
            });
            const arr: any[] = Array.isArray(res?.contracts)
              ? res.contracts
              : [];
            let m: any =
              arr.find(
                (x) => String(x.contractId) === String(c.contractId)
              ) ||
              arr.find(
                (x) => String(x.campaignId) === String(c.id)
              ) ||
              null;
            if (m?.supersededBy) {
              const child = arr.find(
                (x) => String(x.contractId) === String(m.supersededBy)
              );
              if (child) m = child;
            }
            return {
              id: c.id,
              meta: m
                ? ({
                    status: m.status,
                    confirmations: m.confirmations || {},
                    signatures: m.signatures || {},
                    lockedAt: m.lockedAt,
                    editsLockedAt: m.editsLockedAt,
                    awaitingRole: m.awaitingRole,
                    version: m.version,
                    campaignId: m.campaignId,
                    contractId: m.contractId,
                    supersededBy: m.supersededBy,
                    resendOf: m.resendOf || null,
                    resendIteration: m.resendIteration,
                  } as ContractMeta)
                : null,
            };
          } catch {
            return { id: c.id, meta: null };
          }
        })
      );
      const next: Record<string, ContractMeta | null> = {};
      metas.forEach((x) => {
        next[x.id] = x.meta;
      });
      setMetaCache(next);
    } catch (e) {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    loadMetaCache(campaignsData);
  }, [loadMetaCache]);

  /* ── Influencer identity for direct signing ───────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const influencerId =
          typeof window !== "undefined"
            ? localStorage.getItem("influencerId")
            : null;
        if (!influencerId) return;
        const res = await api.get("/influencer/lite", {
          params: { influencerId },
        });
        const i = res?.data?.influencer || {};
        setInfluencerIdentity({
          legalName: i?.legalName || i?.name,
          name: i?.name,
          email: i?.email,
        });
      } catch {
        // not fatal
      }
    })();
  }, []);

  /* ── Contract action handlers ────────────────────────────────────────── */
  const openEditor = (
    c: CampaignData,
    viewOnly = false,
    startMode: "view" | "edit" = "edit"
  ) => {
    setEditorCampaign(c);
    setEditorReadOnly(viewOnly);
    setEditorContractId(c.contractId);
    setEditorInitialMode(startMode);
    setEditorOpen(true);
  };

  const openSignDirect = ({
    contractId,
    influencerConfirmed,
    brandConfirmed,
    isLocked,
    isReadyToSign,
  }: {
    contractId: string;
    influencerConfirmed: boolean;
    brandConfirmed: boolean;
    isLocked: boolean;
    isReadyToSign: boolean;
  }) => {
    if (isLocked) return;
    if (!isReadyToSign) {
      toast({
        icon: "error",
        title: "Not ready to sign",
        text: "Waiting for both parties to accept.",
      });
      return;
    }
    if (!influencerConfirmed) {
      toast({
        icon: "error",
        title: "Accept first",
        text: "Please accept the contract before signing.",
      });
      return;
    }
    if (!brandConfirmed) {
      toast({
        icon: "error",
        title: "Brand acceptance pending",
        text: "Brand must accept before signing.",
      });
      return;
    }
    setTopSignContractId(contractId);
    setTopSignOpen(true);
  };

  const signDirect = async (sigDataUrl: string) => {
    try {
      await post("/contract/sign", {
        contractId: topSignContractId,
        role: "influencer",
        name: influencerIdentity.legalName || influencerIdentity.name || "",
        email: influencerIdentity.email || "",
        signatureImageDataUrl: sigDataUrl,
      });
      toast({ icon: "success", title: "Signed", text: "Signature recorded." });
      setTopSignOpen(false);
      setTopSignContractId("");
      loadMetaCache(campaignsData);
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Sign failed",
        text:
          e?.response?.data?.message ||
          e?.message ||
          "Could not sign.",
      });
    }
  };

  const refreshMeta = () => loadMetaCache(campaignsData);

  /* ── File 1: Filter logic ────────────────────────────────────────────── */
  const filteredCampaigns = useMemo(() => {
    let filtered = campaignsData.filter((campaign) => {
      const matchesTab =
        activeTab === "all" || campaign.campaignStatus === activeTab;
      const matchesSearch = campaign.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        campaign.category === selectedCategory;
      const matchesPlatform =
        selectedPlatform.length === 0 ||
        selectedPlatform.includes(campaign.platform);
      const matchesLocation =
        selectedLocation === "all" ||
        campaign.location === selectedLocation;
      const matchesBudget =
        campaign.budgetMin >= budgetRange[0] &&
        campaign.budgetMax <= budgetRange[1];
      const matchesCampaignStatus =
        selectedCampaignStatus === "all" ||
        campaign.campaignStatus === selectedCampaignStatus;
      const deadlineProximity = getDeadlineProximityRange(campaign.daysLeft);
      const matchesDeadlineProximity =
        selectedDeadlineProximity === "any" ||
        deadlineProximity === selectedDeadlineProximity;
      return (
        matchesTab &&
        matchesSearch &&
        matchesCategory &&
        matchesPlatform &&
        matchesLocation &&
        matchesBudget &&
        matchesCampaignStatus &&
        matchesDeadlineProximity
      );
    });

    switch (sortBy) {
      case "budget-high":
        filtered.sort((a, b) => b.budgetMax - a.budgetMax);
        break;
      case "budget-low":
        filtered.sort((a, b) => a.budgetMin - b.budgetMin);
        break;
      case "ending":
        filtered.sort((a, b) => a.daysLeft - b.daysLeft);
        break;
      default:
        filtered.sort((a, b) => b.match - a.match);
    }
    return filtered;
  }, [
    activeTab,
    search,
    selectedCategory,
    selectedPlatform,
    selectedLocation,
    sortBy,
    budgetRange,
    selectedCampaignStatus,
    selectedDeadlineProximity,
  ]);

  /* ─────────────────────────────── RENDER ────────────────────────────────── */
  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-10">
          {/* HEADER — unchanged from file 1 */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Campaigns</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your collaborations and applications.
            </p>
          </div>

          {/* TABS — unchanged from file 1 */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-4 !bg-gray-200 rounded-lg gap-3 p-0 h-auto border-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`capitalize px-6 py-2.5 rounded-lg bg-transparent text-gray-600 font-semibold text-base transition-all flex-1 ${
                    activeTab === tab.value
                      ? "text-black"
                      : "hover:text-gray-900"
                  }`}
                  style={
                    activeTab === tab.value
                      ? { backgroundColor: "#FFBF00" }
                      : {}
                  }
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* SEARCH — unchanged from file 1 */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <ShadInput
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-10 h-12 rounded-xl"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* FILTER ROW — unchanged from file 1 */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-[220px] shrink-0">
              <FloatingSelect
                label="Category"
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </FloatingSelect>
            </div>

            <div className="w-[240px] shrink-0">
              <FloatingMultiSelect
                label="Platform"
                options={platforms.map((p) => ({
                  value: p.value,
                  label: (
                    <div className="flex items-center gap-2">
                      <p.icon className="h-4 w-4 text-gray-500" />
                      {p.label}
                    </div>
                  ),
                }))}
                value={selectedPlatform}
                onValueChange={setSelectedPlatform}
              />
            </div>

            <div className="w-[320px] shrink-0 rounded-lg border bg-white min-h-[4rem] md:min-h-[4.25rem] xl:min-h-[4.5rem] 2xl:min-h-[5rem] p-4 shadow-sm">
              <div className="flex justify-between mb-2 text-sm">
                <span>Budget</span>
                <span>
                  ${budgetRange[0]} - ${budgetRange[1]}
                </span>
              </div>
              <Slider
                min={0}
                max={6000}
                step={250}
                value={budgetRange}
                onValueChange={(v) => setBudgetRange(v as [number, number])}
                className="
                  [&_[data-slot=slider-track]]:bg-gray-200
                  [&_[data-slot=slider-range]]:bg-[#FFBF00]
                  [&_[data-slot=slider-thumb]]:bg-[#FFBF00]
                  [&_[data-slot=slider-thumb]]:border-[#FFBF00]
                  [&_[data-slot=slider-thumb]]:hover:ring-[#FFBF00]/30
                  [&_[data-slot=slider-thumb]]:focus-visible:ring-[#FFBF00]/40
                "
              />
            </div>

            <div className="w-[220px] shrink-0">
              <FloatingSelect
                label="Location"
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                {locations.map((loc) => {
                  const Icon = loc.icon;
                  return (
                    <SelectItem key={loc.value} value={loc.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        {loc.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </FloatingSelect>
            </div>

            <div className="w-[280px] shrink-0">
              <FloatingSelect
                label="Campaign Status"
                value={selectedCampaignStatus}
                onValueChange={setSelectedCampaignStatus}
              >
                {campaignStatusOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </FloatingSelect>
            </div>

            <div className="w-[280px] shrink-0">
              <FloatingSelect
                label="Deadline Proximity"
                value={selectedDeadlineProximity}
                onValueChange={setSelectedDeadlineProximity}
              >
                {deadlineProximityOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </FloatingSelect>
            </div>

            <div className="w-[220px] shrink-0">
              <FloatingSelect
                label="Sort by"
                value={sortBy}
                onValueChange={setSortBy}
              >
                {sortOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </FloatingSelect>
            </div>
          </div>

          {/* GRID */}
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {filteredCampaigns.map((campaign) => {
              const { form, meta: previewMeta } = campaignToPreview(campaign);
              const contractMeta = metaCache[campaign.id] ?? null;
              const effectiveContractId =
                contractMeta?.contractId || campaign.contractId;

              // Build contract prop only for contracted campaigns
              const contractProp =
                campaign.isContracted === 1 && campaign.contractId
                  ? {
                      contractId: effectiveContractId,
                      meta: contractMeta,
                      onReviewAccept: () =>
                        openEditor(
                          { ...campaign, contractId: effectiveContractId },
                          false,
                          "edit"
                        ),
                      onView: () =>
                        openEditor(
                          { ...campaign, contractId: effectiveContractId },
                          true,
                          "view"
                        ),
                      onSign: () => {
                        const st = normStatus(contractMeta?.status);
                        const isReadyToSign =
                          st === "READY_TO_SIGN" || !!contractMeta?.editsLockedAt;
                        const isLocked =
                          !!contractMeta?.lockedAt ||
                          st === "CONTRACT_SIGNED" ||
                          st === "MILESTONES_CREATED";
                        openSignDirect({
                          contractId: effectiveContractId,
                          influencerConfirmed:
                            !!contractMeta?.confirmations?.influencer?.confirmed,
                          brandConfirmed:
                            !!contractMeta?.confirmations?.brand?.confirmed,
                          isLocked,
                          isReadyToSign,
                        });
                      },
                      onReject: () => {
                        // Trigger reject via a tiny inline state — RejectButton
                        // is self-contained so we open it programmatically via
                        // a ref-less trick: store pending reject id then render modal
                        setPendingRejectId(effectiveContractId);
                      },
                    }
                  : undefined;

              return (
                <ManualPreviewCard
                  key={campaign.id}
                  form={form}
                  meta={previewMeta}
                  contract={contractProp}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Contract Editor Modal */}
      {editorOpen && editorCampaign && (
        <InfluencerContractModal
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          contractId={editorContractId}
          campaign={editorCampaign}
          readOnly={editorReadOnly}
          initialMode={editorInitialMode}
          onAfterAction={refreshMeta}
        />
      )}

      {/* Page-level Signature Modal (triggered from card Sign button) */}
      <SignatureModal
        open={topSignOpen}
        onClose={() => setTopSignOpen(false)}
        title="Sign as Influencer"
        onSubmit={signDirect}
      />

      {/* Page-level Reject Modal (triggered from card Reject button) */}
      {pendingRejectId && (
        <RejectButton
          contractId={pendingRejectId}
          onDone={() => {
            setPendingRejectId(null);
            refreshMeta();
          }}
          autoOpen
          onClose={() => setPendingRejectId(null)}
        />
      )}
    </TooltipProvider>
  );
}