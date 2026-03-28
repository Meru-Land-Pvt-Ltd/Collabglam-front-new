"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertCircle, ChevronDown, Eye, FileText, PenLine } from "lucide-react";
import { HiDocumentText, HiOutlineEye, HiX } from "react-icons/hi";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ManualPreviewCard } from "@/components/ui/cardPreview";
import Swal from "sweetalert2";
import api, { post } from "@/lib/api";
import { useRouter } from "next/navigation";
import CampaignFilter, {
  DEFAULT_DATE_FILTER,
  type DateFilterValue,
} from "@/components/ui/brand/CampaignFilter";

import {
  apiGetAllCampaigns,
  apiGetAppliedCampaigns,
  apiGetContractedCampaigns,
  apiGetInfluencerSignature,
  apiGetMyCampaigns,
  apiUploadInfluencerSignature,
} from "../../services/influencerApi";
import MinimalPdfPreview from "@/components/ui/MinimalPdfPreview";
import { ArrowSquareInIcon, DownloadSimpleIcon, InfoIcon, Signature } from "@phosphor-icons/react";
// import { useSidebarWidth } from "./useSidebarWidth";
import InfluencerSidebarShell from "./InfluencerSidebarShell";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { FloatingSelect, SelectItem } from "@/components/ui/selectComp";

/* ─────────────────────────── Toast / Confirm ─────────────────────────── */

const toast = (opts: {
  icon: "success" | "error" | "info";
  title: string;
  text?: string;
}) =>
  Swal.fire({
    ...opts,
    showConfirmButton: false,
    timer: 1600,
    timerProgressBar: true,
    background: "white",
    customClass: { popup: "rounded-lg border border-gray-200" },
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
    "Cannot resend a signed/locked contract",
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

/* ─────────────────────────────── Types ─────────────────────────────── */

type CampaignImage = {
  name?: string;
  type?: string;
  size?: number;
  dataUrl?: string;
  url?: string;
};

interface CampaignData {
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
  productImages: CampaignImage[];
}

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

type ContractStatus =
  (typeof CONTRACT_STATUS)[keyof typeof CONTRACT_STATUS];

type PartyConfirm = {
  confirmed?: boolean;
  byUserId?: string;
  at?: string;
};

type PartyAcceptance = {
  accepted?: boolean;
  acceptedVersion?: number;
  at?: string;
  byUserId?: string;
};

type PartySign = {
  signed?: boolean;
  byUserId?: string;
  name?: string;
  email?: string;
  at?: string;
};

type ContractInfluencerContent = {
  legalName?: string;
  contactName?: string;
  postingHandleUrl?: string;
  email?: string;
  phone?: string;
  whatsApp?: string;
  taxFormType?: string;
  taxId?: string;

  // address fields
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipPostalCode?: string;
  country?: string;

  ftcAcknowledgement?: string;
  shipToName?: string;
  shipToAddress?: string;
  shipToPhone?: string;
  deliveryNotes?: string;
  notes?: string
};

type ContractMeta = {
  _id?: string;
  status?: ContractStatus | string;
  confirmations?: { brand?: PartyConfirm; influencer?: PartyConfirm };
  acceptances?: { brand?: PartyAcceptance; influencer?: PartyAcceptance };
  signatures?: {
    brand?: PartySign;
    influencer?: PartySign;
    collabglam?: PartySign;
  };
  lockedAt?: string | null;
  editsLockedAt?: string | null;
  awaitingRole?: "brand" | "influencer" | "collabglam" | null | string;
  version?: number;
  campaignId?: string;
  contractId?: string;
  supersededBy?: string | null;
  resendOf?: string | null;
  resendIteration?: number;
  content?: {
    influencer?: ContractInfluencerContent;
    campaign?: {
      campaignTitleOrId?: string;
      productsServicesCovered?: string;
      paymentType?: string;
    };
  };
};

type LocalInfluencer = {
  legalName: string;
  contactName: string;
  postingHandleUrl: string;
  contactEmail: string;
  contactPhone: string;
  whatsApp: string;
  // address: string;

  addressLine1: string; // NEW
  addressLine2: string; // NEW
  city: string;         // NEW
  state: string;        // NEW
  zip: string;          // NEW
  country: string;      // NEW
  ftcAcknowledgement: string;
  shipToName: string;
  shipToAddress: string;
  shipToPhone: string;
  deliveryNotes: string;

  payoutMethod: string;
  payoutAccount: string;
  taxFormType: string;
  taxId: string;
  notes: string;
};

const emptyLocal: LocalInfluencer = {
  legalName: "",
  contactName: "",
  postingHandleUrl: "",

  contactEmail: "",
  contactPhone: "",

  taxFormType: "",
  taxId: "",

  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  whatsApp: "",
  ftcAcknowledgement: "",

  shipToName: "",
  shipToAddress: "",
  shipToPhone: "",
  deliveryNotes: "",

  payoutMethod: "",
  payoutAccount: "",
  notes: ""
};

/* ───────────────────────────── Helpers ───────────────────────────── */

const tabs = [
  { value: "all", label: "All" },
  { value: "applied", label: "Applied Campaigns" },
  { value: "active", label: "Active Campaigns" },
  { value: "Contracted", label: "Contracted" },
  { value: "Rejected", label: "Rejected" },
];

const trimStr = (s?: string) => (s || "").trim();
const normStatus = (s?: string) => String(s || "").trim().toUpperCase();

const sanitizeLocal = (p: LocalInfluencer): LocalInfluencer => ({
  legalName: trimStr(p.legalName),
  contactName: trimStr(p.contactName),
  postingHandleUrl: trimStr(p.postingHandleUrl),

  contactEmail: trimStr(p.contactEmail),
  contactPhone: trimStr(p.contactPhone),
  whatsApp: trimStr(p.whatsApp),

  addressLine1: trimStr(p.addressLine1),
  addressLine2: trimStr(p.addressLine2),
  city: trimStr(p.city),
  state: trimStr(p.state),
  zip: trimStr(p.zip),
  country: trimStr(p.country),

  ftcAcknowledgement: trimStr(p.ftcAcknowledgement),

  shipToName: trimStr(p.shipToName),
  shipToAddress: trimStr(p.shipToAddress),
  shipToPhone: trimStr(p.shipToPhone),
  deliveryNotes: trimStr(p.deliveryNotes),

  payoutMethod: trimStr(p.payoutMethod),
  payoutAccount: trimStr(p.payoutAccount),

  taxFormType: trimStr(p.taxFormType),
  taxId: trimStr(p.taxId),
  notes: trimStr(p.notes)
});
const toContractInfluencerPayload = (
  p: LocalInfluencer
): ContractInfluencerContent => ({
  legalName: p.legalName,
  contactName: p.contactName,
  postingHandleUrl: p.postingHandleUrl,

  email: p.contactEmail,
  phone: p.contactPhone,
  whatsApp: p.whatsApp,

  taxFormType: p.taxFormType,
  taxId: p.taxId,

  addressLine1: p.addressLine1,
  addressLine2: p.addressLine2,
  city: p.city,
  state: p.state,
  zipPostalCode: p.zip,
  country: p.country,

  ftcAcknowledgement: p.ftcAcknowledgement,

  shipToName: p.shipToName,
  shipToAddress: p.shipToAddress,
  shipToPhone: p.shipToPhone,
  deliveryNotes: p.deliveryNotes,
  notes: p.notes,
});

function hasAcceptedCurrent(
  meta: ContractMeta | null | undefined,
  role: "brand" | "influencer"
) {
  if (!meta) return false;
  const version = Number(meta.version || 0);
  const acceptance = meta.acceptances?.[role];
  return !!(
    acceptance?.accepted && Number(acceptance.acceptedVersion || 0) === version
  );
}

function isReadyToSignMeta(meta?: ContractMeta | null) {
  const st = normStatus(meta?.status);
  return st === CONTRACT_STATUS.READY_TO_SIGN || !!meta?.editsLockedAt;
}

function isLockedMeta(meta?: ContractMeta | null) {
  const st = normStatus(meta?.status);
  return (
    !!meta?.lockedAt ||
    st === CONTRACT_STATUS.CONTRACT_SIGNED ||
    st === CONTRACT_STATUS.MILESTONES_CREATED
  );
}

function isRejectedMeta(meta?: ContractMeta | null) {
  return normStatus(meta?.status) === CONTRACT_STATUS.REJECTED;
}

function isSupersededMeta(meta?: ContractMeta | null) {
  return normStatus(meta?.status) === CONTRACT_STATUS.SUPERSEDED;
}

function signingStatusLabel(meta?: ContractMeta | null) {
  if (!meta) return null;

  const st = normStatus(meta.status);
  if (st === CONTRACT_STATUS.MILESTONES_CREATED) return "Milestone Added";
  if (st === CONTRACT_STATUS.CONTRACT_SIGNED) return "Awaiting Milestone Creation";

  const isSigningPhase = isReadyToSignMeta(meta);
  if (!isSigningPhase) return null;

  const brandSigned = !!meta.signatures?.brand?.signed;
  const influencerSigned = !!meta.signatures?.influencer?.signed;
  const awaiting = String(meta.awaitingRole || "").toLowerCase();

  if (brandSigned && influencerSigned) return "Signed";
  if (awaiting === "brand") return "Awaiting brand signature";
  if (awaiting === "influencer") return "Awaiting influencer signature";
  if (awaiting === "collabglam") return "Awaiting CollabGlam";
  if (!brandSigned && !influencerSigned) return "Ready to sign";
  if (brandSigned && !influencerSigned) return "Awaiting influencer signature";
  if (!brandSigned && influencerSigned) return "Awaiting brand signature";
  return null;
}

function computeDaysLeft(endAt?: string) {
  if (!endAt) return 0;
  const end = new Date(endAt);
  const now = new Date();
  return Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function mapApiCampaign(c: any): CampaignData {
  const resolvedContractId = c.contract?._id || "";
  const platforms: string[] = Array.isArray(c.platformSelection)
    ? c.platformSelection
    : [];

  const normPlatform = (p: string) =>
    p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();

  const title =
    c.campaignTitle || c.campaignName || c.name || c.productOrServiceName || "";

  const category =
    c.campaignCategory ||
    (Array.isArray(c.categories) && c.categories.length > 0
      ? c.categories[0].subcategoryName || c.categories[0].categoryName
      : "");

  const startDate = c.startAt || c.timeline?.startDate || "";
  const endDate = c.endAt || c.timeline?.endDate || "";

  const images: CampaignImage[] = Array.isArray(c.productImages)
    ? c.productImages
    : Array.isArray(c.images)
      ? c.images
      : [];

  const id = c._id || c.id || c.campaignId || "";


  return {
    id,
    brandId: c.brandId || "",
    brandName: c.brandName || "",
    title,
    productOrServiceName: title,
    description: c.description || "",
    budgetMin: c.influencerBudget || 0,
    budgetMax: c.campaignBudget || c.budget || 0,
    budget: c.budget || c.campaignBudget || 0,
    influencerBudget: c.influencerBudget ?? 0,
    daysLeft: computeDaysLeft(endDate),
    match: c.match ?? 0,
    category,
    platform:
      platforms.length > 0 ? normPlatform(platforms[0]) : c.campaignType || "",
    location: c.targetCountry || "Remote",
    status: c.status || "",
    campaignStatus: c.campaignStatus || c.status || "",
    contractId: resolvedContractId,
    isContracted: c.isContracted ?? (resolvedContractId ? 1 : 0),
    isAccepted: c.isAccepted ?? 0,
    hasApplied: c.hasApplied ?? 1,
    hasMilestone: c.hasMilestone ?? 0,
    productImages: images,
    timeline: { startDate, endDate },
    isActive: c.isActive ?? 1,
    isApproved: c.isApproved ?? 1,
  };
}

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
      productImages: campaign.productImages,
    },
    meta: {
      countryMap: { [campaign.location]: campaign.location },
      ageMap: { "18-24": "18–24" },
      goalsMap: { "Brand Awareness": "Brand Awareness" },
      campaignBudget: campaign.budgetMax,
    },
  };
}

function toContractMeta(doc: any): ContractMeta {
  return {
    _id: doc?._id,
    status: doc?.status,
    confirmations: doc?.confirmations || {},
    acceptances: doc?.acceptances || {},
    signatures: doc?.signatures || {},
    lockedAt: doc?.lockedAt,
    editsLockedAt: doc?.editsLockedAt,
    awaitingRole: doc?.awaitingRole,
    version: doc?.version,
    campaignId: doc?.campaignId,
    contractId: doc?.contractId,
    supersededBy: doc?.supersededBy,
    resendOf: doc?.resendOf || null,
    resendIteration: doc?.resendIteration,
    content: doc?.content || {},
  };
}

function pickActiveContract(arr: any[], preferredContractId?: string) {
  const list = Array.isArray(arr) ? [...arr] : [];
  if (!list.length) return null;

  list.sort((a, b) => {
    const aTime = new Date(a?.createdAt || 0).getTime();
    const bTime = new Date(b?.createdAt || 0).getTime();
    return bTime - aTime;
  });

  let chosen =
    (preferredContractId
      ? list.find(
        (x) =>
          String(x._id) === String(preferredContractId) ||
          String(x.contractId) === String(preferredContractId)
      )
      : null) ||
    list.find((x) => normStatus(x.status) !== CONTRACT_STATUS.SUPERSEDED) ||
    list[0] ||
    null;

  if (chosen?.supersededBy) {
    const child = list.find(
      (x) =>
        String(x._id) === String(chosen.supersededBy) ||
        String(x.contractId) === String(chosen.supersededBy)
    );
    if (child) chosen = child;
  }

  return chosen;
}

/* ───────────────────────── Floating Fields ───────────────────────── */

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
        className={`w-full px-4 pt-6 pb-2 border-2 rounded-lg text-sm transition-all duration-200 focus:outline-none ${disabled
          ? "border-gray-200 opacity-60 cursor-not-allowed"
          : "border-gray-200 focus:border-[#FFBF00]"
          }`}
        placeholder=" "
      />
      <label
        htmlFor={id}
        className="absolute left-4 top-2 text-xs text-[#1A1A1A] font-medium pointer-events-none"
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
        className={`w-full px-4 pt-6 pb-2 border-2 rounded-lg text-sm transition-all duration-200 focus:outline-none ${disabled
          ? "border-gray-200 opacity-60 cursor-not-allowed"
          : "border-gray-200 focus:border-[#FFBF00]"
          }`}
        placeholder=" "
      />
      <label
        htmlFor={id}
        className="absolute left-4 top-2 text-xs text-[#1A1A1A] font-medium pointer-events-none"
      >
        {label}
      </label>
    </div>
  );
}

/* ───────────────────────── Signature Modal ───────────────────────── */

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
  const [sig, setSig] = useState("");
  const [err, setErr] = useState("");
  const [fileName, setFileName] = useState("");
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
      onFile(e.dataTransfer?.files?.[0] as any);
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] ${isSubmitting ? "pointer-events-none" : ""
          }`}
        onClick={() => !isSubmitting && onClose()}
      />

      <div className="relative z-[71] w-[96%] max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
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
              className={`w-9 h-9 rounded-full bg-white/40 hover:bg-white flex items-center justify-center text-gray-800 transition ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-700">
              This signature will be embedded into your agreement as your authorized sign-off.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Best with transparent PNG
              </span>
            </div>
          </div>

          <div
            ref={dropRef}
            className={`rounded-xl border-2 border-dashed p-5 text-center text-sm transition-all select-none ${isSubmitting
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

/* ───────────────────────── Reject Modal/Button ───────────────────────── */

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

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    } else {
      setReason("");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleClose = () => {
    if (isSubmitting) return;
    setOpen(false);
    onCloseProp?.();
  };

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

      toast({
        icon: "info",
        title: "Rejected",
        text: "Contract has been rejected.",
      });

      handleClose();
      onDone();
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Error",
        text: apiMessage(e, "Failed to reject contract."),
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div
            className={`absolute inset-0 backdrop-blur-sm bg-gray-900/30 ${isSubmitting ? "pointer-events-none" : ""
              }`}
            onClick={handleClose}
          />

          <div className="relative z-10 w-[92vw] max-w-lg rounded-xl bg-white shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Reject Contract
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Let the brand know why you’re rejecting this contract.
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
                  {isSubmitting ? "Rejecting..." : "Reject"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ───────────────────────── Contract Action Bar ───────────────────────── */

function ContractActionBar({
  campaign,
  meta,
  onOpenEditor,
  onSignDirect,
  onRefresh,
}: {
  campaign: CampaignData;
  meta: ContractMeta | null;
  onOpenEditor: (
    c: CampaignData,
    readOnly: boolean,
    mode?: "view" | "edit"
  ) => void;
  onSignDirect: (opts: {
    contractId: string;
    influencerConfirmed: boolean;
    brandConfirmed: boolean;
    isLocked: boolean;
    isReadyToSign: boolean;
  }) => void;
  onRefresh: () => void;
}) {
  const effectiveContractId = meta?.contractId || campaign.contractId;
  if (!effectiveContractId) return null;

  const st = normStatus(meta?.status);
  const influencerConfirmed = hasAcceptedCurrent(meta, "influencer");
  const brandConfirmed = hasAcceptedCurrent(meta, "brand");
  const influencerSigned = !!meta?.signatures?.influencer?.signed;
  const locked = isLockedMeta(meta);
  const readyToSign = isReadyToSignMeta(meta);
  const rejected = isRejectedMeta(meta);
  const superseded = isSupersededMeta(meta);

  const canEditRow = !locked && !readyToSign && !rejected && !superseded;
  const needsAccept = !influencerConfirmed && canEditRow;
  const canSign =
    !locked &&
    readyToSign &&
    influencerConfirmed &&
    brandConfirmed &&
    !influencerSigned;
  const canReject = !locked && !rejected && !superseded;

  const signLabel = signingStatusLabel(meta);
  const statusText =
    signLabel ??
    (st === CONTRACT_STATUS.BRAND_SENT_DRAFT
      ? "Awaiting Your Acceptance"
      : st === CONTRACT_STATUS.BRAND_EDITED
        ? "Updated by Brand"
        : st === CONTRACT_STATUS.INFLUENCER_EDITED
          ? "Sent to Brand"
          : st === CONTRACT_STATUS.INFLUENCER_ACCEPTED
            ? "Awaiting Brand Acceptance"
            : st === CONTRACT_STATUS.BRAND_ACCEPTED
              ? "Accepted by Brand"
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
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Contract
        </span>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${locked
            ? "bg-emerald-100 text-emerald-700"
            : rejected
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
            }`}
        >
          {statusText}
        </span>
      </div>

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
                isLocked: locked,
                isReadyToSign: readyToSign,
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
          className="flex-1 py-2 px-3 rounded-lg bg-gray-50  text-gray-700 text-xs font-medium border border-gray-200 transition-colors flex items-center justify-center gap-1"
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

/* ───────────────────────── Contract Modal ───────────────────────── */
// Add this hook directly in the file — no import needed
function useInfluencerSidebarWidth() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Try all possible sidebar selectors until one matches
    const selectors = [
      '[data-sidebar]',
      '.sidebar',
      'aside',
      'nav[class*="sidebar"]',
      'div[class*="sidebar"]',
      '[class*="sidebar"]',
    ];

    const sidebar = selectors.reduce<Element | null>(
      (found, sel) => found ?? document.querySelector(sel),
      null
    );

    if (!sidebar) return;

    const update = () => setWidth(sidebar.getBoundingClientRect().width);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(sidebar);
    return () => ro.disconnect();
  }, []);

  return width;
}

const getInfluencerId = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("influencerId") || "";
};

const fileToDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const urlToDataUrl = async (url: string) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return fileToDataUrl(blob);
};

const extractSignatureUrl = (res: any) => {
  // adjust keys to your real backend response
  return (
    res?.data?.signatureUrl ||
    res?.data?.url ||
    res?.data?.signature?.url ||
    res?.data?.signature?.signatureUrl ||
    ""
  );
};

function InfluencerContractModal({

  open,
  onClose,
  contractId,
  campaign,
  readOnly = false,
  onAfterAction,
  sidebarOffset = 400,
}: {
  open: boolean;
  onClose: () => void;
  contractId: string;
  campaign: CampaignData;
  readOnly?: boolean;
  onAfterAction?: () => void;
  sidebarOffset?: number;
}) {
  const [local, setLocal] = useState<LocalInfluencer>(emptyLocal);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [liteLoaded, setLiteLoaded] = useState(false);
  const [effectiveContractId, setEffectiveContractId] =
    useState<string>(contractId);
  const [meta, setMeta] = useState<ContractMeta | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showAcceptSignatureModal, setShowAcceptSignatureModal] = useState(false);
  const [signatureChecked, setSignatureChecked] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [savedSignatureUrl, setSavedSignatureUrl] = useState("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedSignaturePreview, setSelectedSignaturePreview] = useState("");
  const influencerAccepted = hasAcceptedCurrent(meta, "influencer");
  const brandAccepted = hasAcceptedCurrent(meta, "brand");
  const brandSigned = !!meta?.signatures?.brand?.signed;
  const influencerSigned = !!meta?.signatures?.influencer?.signed;
  const anyoneSigned = brandSigned || influencerSigned;
  const readyToSign = isReadyToSignMeta(meta);
  const locked = isLockedMeta(meta);
  const rejected = isRejectedMeta(meta);
  const superseded = isSupersededMeta(meta);
  const campaignType: "fixed" | "milestone" | "gifting" =
    (campaign as any).campaignType ??
    (campaign as any).paymentType ??
    (campaign as any).laneType ??
    "fixed";

  const isGifting = campaignType === "gifting";

  const canEdit = useMemo(() => {
    if (readOnly) return false;
    if (locked || readyToSign) return false;
    if (rejected || superseded) return false;
    if (anyoneSigned) return false;
    return true;
  }, [readOnly, locked, readyToSign, rejected, superseded, anyoneSigned]);

  const cleanupPreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setPreviewBlob(null);
  }, []);

  useEffect(() => {
    return () => {
      if (selectedSignaturePreview) {
        URL.revokeObjectURL(selectedSignaturePreview);
      }
    };
  }, [selectedSignaturePreview]);

  const handleSignatureFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (selectedSignaturePreview) {
      URL.revokeObjectURL(selectedSignaturePreview);
    }

    const localPreviewUrl = URL.createObjectURL(file);

    setSignatureFile(file);
    setSelectedSignaturePreview(localPreviewUrl);

    // important: clear old saved signature so submit uses the new uploaded file
    setSavedSignatureUrl("");
  };

  const openAcceptSignatureFlow = async () => {
    const influencerId = getInfluencerId();
    if (!influencerId) {
      toast({
        icon: "error",
        title: "Missing influencer",
        text: "Influencer ID not found.",
      });
      return;
    }

    setSignatureLoading(true);
    setSignatureChecked(false);
    setSignatureFile(null);
    setSavedSignatureUrl("");

    try {
      const res = await apiGetInfluencerSignature(influencerId);
      const existingUrl = extractSignatureUrl(res);

      if (existingUrl) {
        setSavedSignatureUrl(existingUrl);
      }

      setShowAcceptSignatureModal(true);
    } catch (e) {
      // if signature is not found, still open modal and allow upload
      setShowAcceptSignatureModal(true);
    } finally {
      setSignatureLoading(false);
    }
  };

  const mapApiToLocal = (inf?: ContractInfluencerContent): LocalInfluencer => ({
    legalName: inf?.legalName || "",
    contactName: inf?.contactName || "",
    postingHandleUrl: inf?.postingHandleUrl || "",

    // ✅ FIXED mapping
    contactEmail: inf?.email || "",
    contactPhone: inf?.phone || "",

    whatsApp: inf?.whatsApp || "",

    taxFormType: inf?.taxFormType || "",
    taxId: inf?.taxId || "",

    addressLine1: inf?.addressLine1 || "",
    addressLine2: inf?.addressLine2 || "",
    city: inf?.city || "",
    state: inf?.state || "",

    // ✅ IMPORTANT
    zip: inf?.zipPostalCode || "",

    country: inf?.country || "",

    ftcAcknowledgement: inf?.ftcAcknowledgement || "",

    shipToName: inf?.shipToName || "",
    shipToAddress: inf?.shipToAddress || "",
    shipToPhone: inf?.shipToPhone || "",
    deliveryNotes: inf?.deliveryNotes || "",

    payoutMethod: "",
    payoutAccount: "",

    // ✅ notes
    notes: inf?.notes || "",
  });

  const toLocalFromLite = useCallback((lite: any): LocalInfluencer => {
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

    const bestHandle =
      lite?.handle ||
      lite?.profileUrl ||
      match?.profileUrl ||
      match?.username ||
      "";

    return {
      legalName: bestName,
      contactName: bestName,
      postingHandleUrl: bestHandle,

      contactEmail: lite?.email || "",
      contactPhone: lite?.phone || "",
      whatsApp: lite?.whatsapp || "",

      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zip: "",
      country: "",

      taxFormType: "",
      taxId: "",

      ftcAcknowledgement: "",

      shipToName: "",
      shipToAddress: "",
      shipToPhone: "",
      deliveryNotes: "",

      payoutMethod: "",
      payoutAccount: "",
      notes:""
    };
  }, []);

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
  }, [toLocalFromLite]);

  const fetchContractMeta = useCallback(async () => {
    try {
      const influencerId =
        typeof window !== "undefined"
          ? localStorage.getItem("influencerId")
          : null;

      if (!influencerId) throw new Error("No influencer ID.");

      const res = await post<{ success?: boolean; contracts: any[] }>(
        "/contract/getContract",
        {
          brandId: campaign.brandId,
          influencerId,
          campaignId: campaign.id,
        }
      );

      const arr = Array.isArray((res as any)?.contracts)
        ? (res as any).contracts
        : [];

      const chosen = pickActiveContract(arr, contractId);

      if (chosen) {
        const nextMeta = toContractMeta(chosen);
        setMeta(nextMeta);

        // prefer _id first
        setEffectiveContractId(nextMeta._id || nextMeta.contractId || contractId);

        const contentInfluencer = chosen?.content?.influencer || {};
        setLocal((prev) =>
          sanitizeLocal({
            ...prev,

            legalName: contentInfluencer.legalName ?? prev.legalName,

            contactName:
              contentInfluencer.contactName ??
              contentInfluencer.legalName ??
              prev.contactName,

            postingHandleUrl:
              contentInfluencer.postingHandleUrl ?? prev.postingHandleUrl,


            contactEmail:
              contentInfluencer.email ?? prev.contactEmail,

            contactPhone:
              contentInfluencer.phone ?? prev.contactPhone,

            whatsApp: contentInfluencer.whatsApp ?? prev.whatsApp,


            addressLine1:
              contentInfluencer.addressLine1 ?? prev.addressLine1,
            addressLine2:
              contentInfluencer.addressLine2 ?? prev.addressLine2,
            city: contentInfluencer.city ?? prev.city,
            state: contentInfluencer.state ?? prev.state,


            zip:
              contentInfluencer.zipPostalCode ?? prev.zip,

            country: contentInfluencer.country ?? prev.country,

            taxFormType:
              contentInfluencer.taxFormType ?? prev.taxFormType,

            taxId:
              contentInfluencer.taxId ?? prev.taxId,

            notes:
              contentInfluencer.notes ?? prev.notes,

            ftcAcknowledgement:
              contentInfluencer.ftcAcknowledgement ?? prev.ftcAcknowledgement,

            shipToName:
              contentInfluencer.shipToName ?? prev.shipToName,

            shipToAddress:
              contentInfluencer.shipToAddress ?? prev.shipToAddress,

            shipToPhone:
              contentInfluencer.shipToPhone ?? prev.shipToPhone,

            deliveryNotes:
              contentInfluencer.deliveryNotes ?? prev.deliveryNotes,
          })
        );
      } else {
        setMeta(null);
        setEffectiveContractId(contractId);
      }
    } catch {
      setMeta(null);
      setEffectiveContractId(contractId);
    }
  }, [campaign.brandId, campaign.id, contractId]);

  const markViewed = useCallback(async (id: string) => {
    try {
      console.log("markViewed", id)
      await post("/contract/viewed", { contractId: id, role: "influencer" });
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      cleanupPreview();
      await fetchInfluencerLite();
      if (cancelled) return;
      await fetchContractMeta();
    })();

    return () => {
      cancelled = true;
      cleanupPreview();
    };
  }, [open, fetchInfluencerLite, fetchContractMeta, cleanupPreview]);

  useEffect(() => {
    if (!open || !effectiveContractId) return;
    console.log("effectiveContractId", effectiveContractId)
    markViewed(effectiveContractId);
  }, [open, effectiveContractId, markViewed]);

  const generatePreview = useCallback(
    async (silent = false) => {
      setIsWorking(true);
      try {
        const res = await api.post(
          "/contract/viewPdf",
          { contractId: effectiveContractId },
          { responseType: "blob" }
        );

        cleanupPreview();

        const blob = res.data as Blob;
        const url = URL.createObjectURL(blob);

        setPreviewBlob(blob);
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
    },
    [effectiveContractId, cleanupPreview]
  );

  useEffect(() => {
    if (!open) return;
    if (!previewUrl && effectiveContractId) {
      generatePreview(true).catch(() => { });
    }
  }, [open, previewUrl, effectiveContractId, generatePreview]);

  const handleAcceptWithSignature = async () => {
    if (!signatureChecked) {
      toast({
        icon: "error",
        title: "Confirmation required",
        text: "Please confirm that you agree to all terms before signing.",
      });
      return;
    }

    setIsWorking(true);

    try {
      const payload = toContractInfluencerPayload(sanitizeLocal(local));
      let signatureDataUrl = "";

      if (signatureFile) {
        // best path: use local file directly
        signatureDataUrl = await fileToDataUrl(signatureFile);

        const influencerId = getInfluencerId();
        const formData = new FormData();
        formData.append("influencerId", influencerId);
        formData.append("signature", signatureFile);

        const uploadRes = await apiUploadInfluencerSignature(formData);
        const uploadedUrl = extractSignatureUrl(uploadRes);
        if (uploadedUrl) {
          setSavedSignatureUrl(uploadedUrl);
        }
      } else if (savedSignatureUrl) {
        // fallback only when using an already-saved signature
        signatureDataUrl = await urlToDataUrl(savedSignatureUrl);
      } else {
        toast({
          icon: "error",
          title: "Signature required",
          text: "Please upload a signature before continuing.",
        });
        return;
      }

      await post("/contract/influencer/confirm", {
        contractId: effectiveContractId,
        influencer: payload,
      });

      // await post("/contract/sign", {
      //   contractId: effectiveContractId,
      //   role: "influencer",
      //   name: local.legalName || local.contactName,
      //   email: local.contactEmail,
      //   signatureImageDataUrl: signatureDataUrl,
      // });

      toast({
        icon: "success",
        title: "Accepted & Signed",
        text: "Contract accepted successfully.",
      });

      setShowAcceptSignatureModal(false);
      await fetchContractMeta();
      onAfterAction?.();
      await generatePreview(true);
      onClose();
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Error",
        text: apiMessage(e, "Failed to accept and sign."),
      });
    } finally {
      setIsWorking(false);
    }
  };

  const acceptOrSave = async () => {
    if (!hasAcceptedCurrent(meta, "influencer")) {
      await openAcceptSignatureFlow();
      return;
    }

    setIsWorking(true);
    try {
      const payload = toContractInfluencerPayload(sanitizeLocal(local));

      await post("/contract/influencer/update", {
        contractId: effectiveContractId,
        influencerUpdates: {
          content: {
            influencer: payload,
          },
        },
      });

      toast({
        icon: "success",
        title: "Saved",
        text: "Your changes were saved.",
      });

      await fetchContractMeta();
      onAfterAction?.();
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
    if (locked) return false;

    if (!readyToSign) {
      toast({
        icon: "error",
        title: "Not ready to sign",
        text: "Waiting for both parties to accept.",
      });
      return;
    }

    if (!influencerAccepted) {
      toast({
        icon: "error",
        title: "Accept first",
        text: "Please accept the contract before signing.",
      });
      return;
    }

    if (!brandAccepted) {
      toast({
        icon: "error",
        title: "Brand acceptance pending",
        text: "Brand must accept before signing can start.",
      });
      return;
    }

    setShowSignModal(true);
  };

  // const signWithSignature = async (signatureDataUrl: string) => {
  //   setIsWorking(true);
  //   try {
  //     await post("/contract/sign", {
  //       contractId: effectiveContractId,
  //       role: "influencer",
  //       name: local.legalName || local.contactName,
  //       email: local.contactEmail,
  //       signatureImageDataUrl: signatureDataUrl,
  //     });

  //     toast({
  //       icon: "success",
  //       title: "Signed",
  //       text: "Signature recorded.",
  //     });

  //     setShowSignModal(false);
  //     await fetchContractMeta();
  //     onAfterAction?.();
  //     onClose();
  //   } catch (e: any) {
  //     toast({
  //       icon: "error",
  //       title: "Sign Error",
  //       text: apiMessage(e, "Failed to sign."),
  //     });
  //   } finally {
  //     setIsWorking(false);
  //   }
  // };

  if (!open) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <InfluencerSidebarShell
        isOpen={open && !showAcceptSignatureModal}
        onClose={onClose}
        title={influencerAccepted ? "UPDATE CONTRACT" : "ACCEPT CONTRACT"}
        subtitle={`${campaign?.productOrServiceName || "Agreement"} • ${campaign?.brandName || ""}`}
        previewUrl={previewUrl}
        previewBlob={previewBlob}
        sidebarOffset={sidebarOffset}
        footer={
          <>
            <div className="mr-auto min-w-0 flex-1 text-xs">
              {locked ? (
                <span className="text-emerald-600">
                  Locked — all required signatures have been captured.
                </span>
              ) : influencerAccepted ? (
                <span className="text-emerald-600">
                  Accepted — you can update and sign.
                </span>
              ) : (
                <span className="text-amber-600">
                  Fill details to accept the contract.
                </span>
              )}
            </div>

            <Button
              variant="outline"
              className="shrink-0"
              onClick={() =>
                previewUrl ? window.open(previewUrl, "_blank") : generatePreview()
              }
            >
              <Eye className="mr-2 h-5 w-5" />
              Preview
            </Button>

            <Button
              variant="secondary"
              className="shrink-0 flex items-center gap-2 !border !border-[#E6E6E6] !bg-white"
              onClick={() => {
                if (previewUrl) {
                  const a = document.createElement("a");
                  a.href = previewUrl;
                  a.download = `${campaign?.productOrServiceName || "contract"}.pdf`;
                  a.click();
                } else {
                  generatePreview();
                }
              }}
            >
              <DownloadSimpleIcon />
              <span>Download</span>
            </Button>

            {!locked && (
              <Button
                onClick={acceptOrSave}
                disabled={isWorking || !liteLoaded}
                className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {influencerAccepted ? "Save Changes" : "Accept & Save"}
              </Button>
            )}

            {!locked &&
              readyToSign &&
              influencerAccepted &&
              brandAccepted &&
              !influencerSigned && (
                <Button
                  className="shrink-0 bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-900"
                  onClick={openSignature}
                  disabled={isWorking}
                >
                  <PenLine className="mr-2 h-4 w-4" />
                  Sign as Influencer
                </Button>
              )}
          </>
        }
      >
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 border-b border-gray-100 pb-3 text-xl font-semibold text-gray-800">
            {influencerAccepted
              ? "Edit Your Contract Details"
              : "Fill Your Details to Accept"}
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <FloatingInput
              id="legalName"
              label="Legal Name"
              value={local.legalName}
              onChange={(v) => setLocal((p) => ({ ...p, legalName: v }))}
            // disabled={!canEdit}
            />

            <FloatingInput
              id="contactEmail"
              label="Email"
              value={local.contactEmail}
              onChange={(v) => setLocal((p) => ({ ...p, contactEmail: v }))}
            //disabled={!canEdit}
            />

            <FloatingInput
              id="contactPhone"
              label="Phone"
              value={local.contactPhone}
              onChange={(v) => setLocal((p) => ({ ...p, contactPhone: v }))}
            //disabled={!canEdit}
            />

            <FloatingSelect
              label="Tax Form Type"
              required
              value={local.taxFormType || ""}
              onValueChange={(v) =>
                setLocal((p) => ({ ...p, taxFormType: v }))
              }
              disabled={!canEdit}
            >
              <SelectItem value="W-9">W-9</SelectItem>
              <SelectItem value="W-8">W-8</SelectItem>
            </FloatingSelect>
            <FloatingInput
              id="taxId"
              label="Tax ID (SSN/EIN)"
              value={local.taxId}
              onChange={(v) => setLocal((p) => ({ ...p, taxId: v }))}
            // disabled={!canEdit}
            />

            <FloatingInput
              id="addressLine1"
              label="Address Line 1"
              value={local.addressLine1}
              onChange={(v) => setLocal((p) => ({ ...p, addressLine1: v }))}
            // disabled={!canEdit}
            />

            <FloatingInput
              id="addressLine2"
              label="Address Line 2"
              value={local.addressLine2}
              onChange={(v) => setLocal((p) => ({ ...p, addressLine2: v }))}
            //disabled={!canEdit}
            />

            <FloatingInput
              id="city"
              label="City"
              value={local.city}
              onChange={(v) => setLocal((p) => ({ ...p, city: v }))}
            //disabled={!canEdit}
            />

            <FloatingInput
              id="state"
              label="State"
              value={local.state}
              onChange={(v) => setLocal((p) => ({ ...p, state: v }))}
            //disabled={!canEdit}
            />

            <FloatingInput
              id="zip"
              label="ZIP / Postal Code"
              value={local.zip}
              onChange={(v) => setLocal((p) => ({ ...p, zip: v }))}
            //disabled={!canEdit}
            />

            <FloatingInput
              id="country"
              label="Country"
              value={local.country}
              onChange={(v) => setLocal((p) => ({ ...p, country: v }))}
            //disabled={!canEdit}
            />


            <FloatingTextarea
              id="notes"
              label="Notes (optional)"
              value={local.notes}
              onChange={(v) => setLocal((p) => ({ ...p, notes: v }))}
              rows={3}
            />

          </div>

          {/* <div className="mt-3">
            <FloatingTextarea
              id="address"
              label="Address"
              value={local.address}
              onChange={(v) => setLocal((p) => ({ ...p, address: v }))}
              rows={4}
              disabled={!canEdit}
            />
          </div> */}


          <div className="mt-5 border-t pt-4">
            <div className="mb-3 text-xl font-semibold text-gray-800">
              FTC / Disclosure Acknowledgement
            </div>
            <FloatingTextarea
              id="ftcAcknowledgement"
              label="FTC / Disclosure Acknowledgement"
              value={local.ftcAcknowledgement}
              onChange={(v) =>
                setLocal((p) => ({ ...p, ftcAcknowledgement: v }))
              }
              rows={4}
            //disabled={!canEdit}
            />
          </div>

          {isGifting && (
            <div className="mt-5 border-t pt-4">
              <div className="mb-3 font-semibold text-gray-800">
                Shipping Details
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <FloatingInput
                  id="shipToName"
                  label="Ship-To Name"
                  value={local.shipToName}
                  onChange={(v) => setLocal((p) => ({ ...p, shipToName: v }))}
                  disabled={!canEdit}
                />

                <FloatingInput
                  id="shipToPhone"
                  label="Shipping Phone Number"
                  value={local.shipToPhone}
                  onChange={(v) => setLocal((p) => ({ ...p, shipToPhone: v }))}
                  disabled={!canEdit}
                />
              </div>

              <div className="mt-3">
                <FloatingTextarea
                  id="shipToAddress"
                  label="Shipping Address"
                  value={local.shipToAddress}
                  onChange={(v) =>
                    setLocal((p) => ({ ...p, shipToAddress: v }))
                  }
                  rows={3}
                  disabled={!canEdit}
                />
              </div>

              <div className="mt-3">
                <FloatingTextarea
                  id="deliveryNotes"
                  label="Delivery Instructions"
                  value={local.deliveryNotes}
                  onChange={(v) =>
                    setLocal((p) => ({ ...p, deliveryNotes: v }))
                  }
                  rows={3}
                  disabled={!canEdit}
                />
              </div>
            </div>
          )}
        </div>
      </InfluencerSidebarShell>

      <Dialog
        open={showAcceptSignatureModal}
        onOpenChange={(open) => {
          if (!open) setShowAcceptSignatureModal(false);
        }}
      >
        <DialogOverlay className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm" />

        <DialogContent className="fixed left-1/2 top-1/2 z-[9999] w-[95vw] max-w-[480px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] border-0 bg-white p-4 shadow-2xl">
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSignatureFileChange}
            />

            <button
              type="button"
              className="block w-full rounded-2xl bg-[#F9F9F9] p-5 text-left"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex min-h-[140px] items-center justify-center rounded-2xl bg-white p-4">
                {selectedSignaturePreview || savedSignatureUrl ? (
                  <img
                    src={selectedSignaturePreview || savedSignatureUrl}
                    alt="Signature"
                    className="max-h-24 w-auto object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Signature className="h-32 w-32 text-black" />
                    <span className="text-sm text-gray-500">
                      Click to upload signature
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] text-gray-400">
                  <InfoIcon className="h-4 w-4" />
                  <span>
                    {selectedSignaturePreview || savedSignatureUrl
                      ? "Signature is selected as primary"
                      : "Click the signature area to upload"}
                  </span>
                </div>

                <span className="flex items-center gap-1 text-[13px] font-medium text-gray-900">
                  {selectedSignaturePreview || savedSignatureUrl
                    ? "Change signature"
                    : "Upload signature"}
                  <ChevronDown className="h-4 w-4" />
                </span>
              </div>
            </button>

            <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:bg-gray-50/50">
              <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={signatureChecked}
                  onChange={(e) => setSignatureChecked(e.target.checked)}
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </div>

              <span className="text-[15px] leading-relaxed text-gray-800">
                By signing, I confirm that I have read and therefore agree to all
                contractual terms, which I acknowledge as legally binding.
              </span>
            </label>

            {!signatureChecked && (
              <div className="flex items-start gap-3 rounded-xl bg-[#FFF1F0] px-4 py-3 text-[14px] leading-tight text-[#E04438]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Please confirm that you agree to all terms before signing the contract.</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                className="rounded-xl px-6 text-gray-500 hover:bg-gray-100"
                onClick={() => setShowAcceptSignatureModal(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={handleAcceptWithSignature}
                disabled={
                  !signatureChecked ||
                  isWorking ||
                  signatureLoading ||
                  (!savedSignatureUrl && !signatureFile)
                }
                className="rounded-xl bg-black px-8 text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Sign & Accept
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* <SignatureModal
        open={showSignModal}
        onClose={() => setShowSignModal(false)}
        title="Sign as Influencer"
        onSubmit={signWithSignature}
      /> */}
    </TooltipProvider>
  );
}

/* ───────────────────────── Loading Skeleton ───────────────────────── */

function CampaignCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3 animate-pulse">
      <Skeleton className="h-5 w-3/4 rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-2/3 rounded" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <Skeleton className="h-8 w-full rounded-lg mt-2" />
    </div>
  );
}

/* ───────────────────────── Main Page ───────────────────────── */

export default function MyCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [sidebarOffset, setSidebarOffset] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [campaignType, setCampaignType] = useState("all");
  const [creatorStatus, setCreatorStatus] = useState("all");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] =
    useState<DateFilterValue>(DEFAULT_DATE_FILTER);
  const [aiCreated, setAiCreated] = useState(false);
  const [sortBy] = useState("match");

  const [metaCache, setMetaCache] = useState<Record<string, ContractMeta | null>>(
    {}
  );

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorReadOnly, setEditorReadOnly] = useState(false);
  const [editorContractId, setEditorContractId] = useState("");
  const [editorCampaign, setEditorCampaign] = useState<CampaignData | null>(null);
  const [editorInitialMode, setEditorInitialMode] =
    useState<"view" | "edit">("edit");

  const [topSignOpen, setTopSignOpen] = useState(false);
  const [topSignContractId, setTopSignContractId] = useState("");
  const [influencerIdentity, setInfluencerIdentity] = useState<{
    legalName?: string;
    name?: string;
    email?: string;
  }>({});
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);

  const router = useRouter();
  useEffect(() => {
    if (!pageRef.current) return;

    const update = () => {
      if (pageRef.current) {
        setSidebarOffset(pageRef.current.getBoundingClientRect().left);
      }
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(document.documentElement);

    return () => ro.disconnect();
  }, []);
  const fetchCampaigns = useCallback(
    async (tab: string = activeTab) => {
      setIsLoading(true);
      setFetchError(null);

      try {
        const id =
          typeof window !== "undefined"
            ? localStorage.getItem("influencerId") || ""
            : "";

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("influencerToken") || undefined
            : undefined;

        let res: any;

        if (tab === "applied") {
          res = await apiGetAppliedCampaigns(id, token);
        } else if (tab === "active") {
          res = await apiGetMyCampaigns(
            {
              influencerId: id,
              page: 1,
              limit: 10,
              search: searchInput || "",
            },
            token
          );
        } else if (tab === "Contracted") {
          res = await apiGetContractedCampaigns(id, token);
        } else {
          res = await apiGetAllCampaigns(id);
        }

        const rawCampaigns = Array.isArray(res)
          ? res
          : Array.isArray((res as any)?.campaigns)
            ? (res as any).campaigns
            : Array.isArray((res as any)?.items)
              ? (res as any).items
              : Array.isArray((res as any)?.data)
                ? (res as any).data
                : Array.isArray((res as any)?.contracts)
                  ? (res as any).contracts
                  : [];

        const mapped = rawCampaigns.map(mapApiCampaign);
        setCampaigns(mapped);
      } catch (e: any) {
        setFetchError(
          e?.response?.data?.message ||
          e?.message ||
          "Failed to load campaigns."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab, searchInput]
  );

  useEffect(() => {
    fetchCampaigns(activeTab);
  }, [activeTab, fetchCampaigns]);

  const loadMetaCache = useCallback(async (list: CampaignData[]) => {
    const influencerId =
      typeof window !== "undefined"
        ? localStorage.getItem("influencerId")
        : null;

    if (!influencerId) return;

    try {
      const candidates = list.filter((c) => c.isContracted === 1 || c.contractId);

      const metas = await Promise.all(
        candidates.map(async (c) => {
          try {
            const res: any = await post("/contract/getContract", {
              brandId: c.brandId,
              influencerId,
              campaignId: c.id,
            });

            const arr: any[] = Array.isArray(res?.contracts) ? res.contracts : [];
            const chosen = pickActiveContract(arr, c.contractId);

            return {
              id: c.id,
              meta: chosen ? toContractMeta(chosen) : null,
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
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    if (campaigns.length > 0) loadMetaCache(campaigns);
  }, [campaigns, loadMetaCache]);

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
        // non-fatal
      }
    })();
  }, []);

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

      toast({
        icon: "success",
        title: "Signed",
        text: "Signature recorded.",
      });

      setTopSignOpen(false);
      setTopSignContractId("");
      loadMetaCache(campaigns);
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Sign failed",
        text: apiMessage(e, "Could not sign."),
      });
    }
  };

  const refreshMeta = useCallback(() => {
    loadMetaCache(campaigns);
    fetchCampaigns(activeTab);
  }, [campaigns, loadMetaCache, fetchCampaigns, activeTab]);

  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns.filter((campaign) => {
      const contractMeta = metaCache[campaign.id] ?? null;
      const contractStatus = normStatus(contractMeta?.status);

      const matchesTab = (() => {
        if (activeTab === "all") return true;
        if (activeTab === "applied") return campaign.hasApplied === 1;
        if (activeTab === "active") return true;
        if (activeTab === "Contracted") return campaign.isContracted === 1;
        if (activeTab === "Rejected")
          return contractStatus === CONTRACT_STATUS.REJECTED;
        return true;
      })();

      const matchesSearch = (campaign.title ?? "")
        .toLowerCase()
        .includes(searchInput.toLowerCase());

      const matchesCampaignType =
        campaignType === "all" || campaign.campaignStatus === campaignType;

      const matchesCreatorStatus = (() => {
        if (creatorStatus === "all") return true;
        if (creatorStatus === "applied") return campaign.hasApplied === 1;
        if (creatorStatus === "approved") return campaign.isApproved === 1;
        if (creatorStatus === "invited")
          return campaign.hasApplied === 0 && campaign.isApproved === 0;
        return true;
      })();

      const matchesCategory =
        categoryIds.length === 0 || categoryIds.includes(campaign.category);

      const matchesDate = (() => {
        if (
          !dateFilter.quickFilter &&
          dateFilter.allDatesOption === "all" &&
          !dateFilter.startDate &&
          !dateFilter.endDate
        ) {
          return true;
        }

        const start = campaign.timeline?.startDate
          ? new Date(campaign.timeline.startDate)
          : null;

        if (dateFilter.quickFilter === "launching_soon" && start) {
          const diff = (start.getTime() - Date.now()) / 86_400_000;
          return diff >= 0 && diff <= 7;
        }

        if (dateFilter.quickFilter === "today" && start) {
          return start.toDateString() === new Date().toDateString();
        }

        if (dateFilter.quickFilter === "this_week" && start) {
          const diff = (start.getTime() - Date.now()) / 86_400_000;
          return diff >= 0 && diff <= 7;
        }

        if (dateFilter.quickFilter === "this_month" && start) {
          const now = new Date();
          return (
            start.getMonth() === now.getMonth() &&
            start.getFullYear() === now.getFullYear()
          );
        }

        const rangeMap: Record<string, number> = {
          last_7: 7,
          last_15: 15,
          last_30: 30,
          last_90: 90,
          last_month: 30,
          last_quarter: 90,
          last_365: 365,
        };

        const days = rangeMap[dateFilter.allDatesOption];
        if (days && start) {
          return (Date.now() - start.getTime()) / 86_400_000 <= days;
        }

        if ((dateFilter.startDate || dateFilter.endDate) && start) {
          const from = dateFilter.startDate
            ? new Date(dateFilter.startDate)
            : null;
          const to = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
          if (from && start < from) return false;
          if (to && start > to) return false;
        }

        return true;
      })();

      return (
        matchesTab &&
        matchesSearch &&
        matchesCampaignType &&
        matchesCreatorStatus &&
        matchesCategory &&
        matchesDate
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
    campaigns,
    activeTab,
    searchInput,
    campaignType,
    creatorStatus,
    categoryIds,
    dateFilter,
    sortBy,
    metaCache,
  ]);

  const hasActiveFilters =
    !!searchInput ||
    campaignType !== "all" ||
    creatorStatus !== "all" ||
    categoryIds.length > 0 ||
    aiCreated;
  return (
    <TooltipProvider>
      <div className="min-h-screen" >
        <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Campaigns</h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage your collaborations and contract workflow.
              </p>
            </div>

            <button
              onClick={() => fetchCampaigns(activeTab)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <svg
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>

          {fetchError && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>⚠️</span>
              <span>{fetchError}</span>
              <button
                onClick={() => fetchCampaigns(activeTab)}
                className="ml-auto underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-5 !bg-gray-200 rounded-lg gap-3 p-0 h-auto border-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`capitalize px-6 py-2.5 rounded-lg bg-transparent text-gray-600 font-semibold text-base transition-all flex-1 ${activeTab === tab.value
                    ? "text-black"
                    : "hover:text-gray-900"
                    }`}
                  style={
                    activeTab === tab.value
                      ? { backgroundColor: "#1A1A1A", color: "#FFFFFF" }
                      : {}
                  }
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <CampaignFilter
            campaignType={campaignType}
            setCampaignType={setCampaignType}
            creatorStatus={creatorStatus}
            setCreatorStatus={setCreatorStatus}
            categoryIds={categoryIds}
            setCategoryIds={setCategoryIds}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            aiCreated={aiCreated}
            setAiCreated={setAiCreated}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
          />

          {isLoading ? (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CampaignCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
              <svg
                className="w-16 h-16 opacity-30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <div className="text-center">
                <p className="font-medium text-gray-600 text-lg">
                  No campaigns found
                </p>
                <p className="text-sm mt-1">
                  Try adjusting your filters or search query.
                </p>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setCampaignType("all");
                    setCreatorStatus("all");
                    setCategoryIds([]);
                    setDateFilter(DEFAULT_DATE_FILTER);
                    setAiCreated(false);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredCampaigns.map((campaign) => {
                const { form, meta: previewMeta } = campaignToPreview(campaign);
                const contractMeta = metaCache[campaign.id] ?? null;
                const effectiveContractId =
                  contractMeta?._id || contractMeta?.contractId || campaign.contractId;
                console.log("contractMeta", contractMeta)

                const contractProp =
                  campaign.isContracted === 1 && effectiveContractId
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
                        openSignDirect({
                          contractId: effectiveContractId,
                          influencerConfirmed: hasAcceptedCurrent(
                            contractMeta,
                            "influencer"
                          ),
                          brandConfirmed: hasAcceptedCurrent(
                            contractMeta,
                            "brand"
                          ),
                          isLocked: isLockedMeta(contractMeta),
                          isReadyToSign: isReadyToSignMeta(contractMeta),
                        });
                      },
                      onReject: () => setPendingRejectId(effectiveContractId),
                    }
                    : undefined;

                return (
                  <ManualPreviewCard
                    key={campaign.id}
                    form={form}
                    meta={previewMeta}
                    contract={activeTab === "active" ? undefined : contractProp}
                    showViewMilestone={activeTab === "active"}
                    onViewMilestone={() =>
                      router.push(
                        `/influencer/my-campaigns/view-milestone?campaignId=${encodeURIComponent(
                          campaign.id
                        )}&contractId=${encodeURIComponent(
                          effectiveContractId || ""
                        )}`
                      )
                    }
                    onViewClick={() =>
                      router.push(`/influencer/my-campaigns/${campaign.id}`)
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editorOpen && editorCampaign && (
        <InfluencerContractModal
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          contractId={editorContractId}
          campaign={editorCampaign}
          readOnly={editorReadOnly}
          onAfterAction={refreshMeta}
          sidebarOffset={sidebarOffset}
        />
      )}

      <SignatureModal
        open={topSignOpen}
        onClose={() => setTopSignOpen(false)}
        title="Sign as Influencer"
        onSubmit={signDirect}
      />

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