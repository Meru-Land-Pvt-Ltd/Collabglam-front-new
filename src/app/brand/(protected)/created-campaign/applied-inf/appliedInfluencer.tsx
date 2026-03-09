"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Swal from "sweetalert2";
import api, { post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import InfluencerFilter, {
  type FilterState,
} from "@/components/ui/brand/InfluencerFilter";
import {
  InfluencerTable,
  type InfluencerRow,
  type PlatformType,
} from "@/components/ui/brand/Influencertable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CaretLeft,
  CaretRight,
  ClipboardText,
  DotsThree,
  EnvelopeOpen,
  Eye,
  FileText,
  Info,
  MagnifyingGlass,
  PaperPlaneTilt,
  PenNib,
  SealCheck,
  Signature,
} from "@phosphor-icons/react";

const ReactSelect = dynamic(() => import("react-select"), { ssr: false });

const GRADIENT_FROM = "#FFA135";
const GRADIENT_TO = "#FF7236";
const DEFAULT_TIMEZONE = "America/Los_Angeles";
const PAGE_SIZE = 10;

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

type ContractStatus = (typeof CONTRACT_STATUS)[keyof typeof CONTRACT_STATUS];
type PanelMode = "send" | "edit";
type FormErrors = Record<string, string>;
type CurrencyOption = { value: string; label: string; meta?: any };
type TzOption = { value: string; label: string; meta?: any };

type ContractPartyBrand = {
  legalName: string;
  contactPersonName: string;
  noticeEmail: string;
  noticePhone: string;
  billingAddress: string;
};

type ContractPartyInfluencer = {
  legalName: string;
  contactName: string;
  postingHandleUrl: string;
  contactEmail: string;
  contactPhone: string;
  whatsApp: string;
  address: string;
};

type ContractCampaign = {
  productsServicesCovered: string;
  territoryTargetCountry: string;
  effectiveDate: string;
  campaignTitleOrId: string;
};

type ScheduleADeliverable = {
  id: string;
  srNo: number;
  platformHandle: string;
  deliverableFormat: string;
  qty: string;
  draftDue: string;
  liveDate: string;
};

type UsageRightsRow = {
  id: string;
  usageRight: string;
  selected: boolean;
  duration: string;
  territoryNotes: string;
};

type ContractFormState = {
  brand: ContractPartyBrand;
  influencer: ContractPartyInfluencer;
  campaign: ContractCampaign;
  scheduleA: {
    minimumVideoSpecs: string;
    preShootScriptRequired: boolean;
    preShootScriptDue: string;
    preShootScriptReviewBusinessDays: string;
    mandatoryTagsMentionsLinksCodes: string;
    review: {
      includedRevisionRounds: string;
      additionalRevisionFee: string;
      reshootObligation: string;
      reshootFee: string;
      minimumLivePeriod: string;
    };
    commercial: {
      totalCampaignFee: string;
      currency: string;
      platformMilestonePaymentStructure: string;
      customSplit: string;
      advancePaymentTrigger: string;
      remainingPaymentTrigger: string;
      paymentProcessorFeesBorneBy: string;
      paymentProcessorFeesNotes: string;
      laneAMarketplaceFeeNote: string;
    };
    rawFiles: {
      rawSourceFileDelivery: string;
      deliveryDue: string;
      format: string;
      analyticsReportingDeadline: string;
      analyticsReportingItems: string;
    };
    shipping: {
      productShippingApplicable: string;
      shipToName: string;
      shipToAddress: string;
      shipToPhone: string;
      productReceiptConfirmationDeadline: string;
      productReturnable: string;
      returnWindowMethod: string;
      riskOfLossNotes: string;
    };
    usageRights: {
      rows: UsageRightsRow[];
      attributionRequirement: string;
      attributionText: string;
      editingRights: string;
      musicStockAssetResponsibility: string;
    };
    compliance: {
      creativeBriefMandatoryTalkingPoints: string;
      restrictedStatements: string;
    };
    exclusivity: {
      competitorBlackout: string;
      categoryCompetitorList: string;
      blackoutPeriod: string;
      optionalMoralsClause: string;
    };
    cancellation: {
      killFeeOrProrata: string;
      refundOfUnearnedAdvance: string;
    };
    dispute: {
      governingLaw: string;
      disputeResolutionMethod: string;
      disputeVenue: string;
      arbitrationSeat: string;
      attorneysFees: string;
    };
  };
};

interface Influencer {
  influencerId: string;
  name: string;
  primaryPlatform?: "instagram" | "tiktok" | "youtube" | string | null;
  handle: string | null;
  category?: string | { name?: string } | null;
  categoryName?: string | null;
  categories?: Array<{ name?: string }>;
  audienceSize: number;
  createdAt?: string;
  isAssigned: number;
  isContracted: number;
  contractId: string | null;
  feeAmount: number;
  isAccepted: number;
  isRejected: number;
  rejectedReason: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PartyConfirm {
  confirmed?: boolean;
  byUserId?: string;
  at?: string;
}

interface PartySign {
  signed?: boolean;
  byUserId?: string;
  name?: string;
  email?: string;
  at?: string;
}

interface AuditEvent {
  byUserId?: string;
  role?: string;
  type: string;
  details?: { reason?: string;[k: string]: any };
  at?: string;
}

interface ContractContent {
  brand?: Partial<ContractPartyBrand>;
  influencer?: Partial<ContractPartyInfluencer>;
  campaign?: Partial<ContractCampaign>;
  scheduleA?: Partial<ContractFormState["scheduleA"]> & {
    deliverables?: Array<Partial<ScheduleADeliverable>>;
    usageRights?: Partial<ContractFormState["scheduleA"]["usageRights"]> & {
      rows?: Array<Partial<UsageRightsRow>>;
    };
  };
}

interface ContractMeta {
  contractId: string;
  campaignId: string;
  status: ContractStatus | string;
  lastSentAt?: string;
  lockedAt?: string | null;
  requestedEffectiveDate?: string | null;
  requestedEffectiveDateTimezone?: string | null;
  confirmations?: { brand?: PartyConfirm; influencer?: PartyConfirm };
  signatures?: {
    brand?: PartySign;
    influencer?: PartySign;
    collabglam?: PartySign;
  };
  resendIteration?: number;
  audit?: AuditEvent[];
  flags?: Record<string, any>;
  statusFlags?: Record<string, any>;
  content?: ContractContent;
}

type AppliedInfluencerRow = InfluencerRow & {
  rawInfluencer: Influencer;
  contractMeta: ContractMeta | null;
  hasContract: boolean;
  rejected: boolean;
  typeLabel: string;
  feeAmountValue: number;
};

const MILESTONE_OPTIONS = [
  { value: "50% advance / 50% balance", label: "50% advance / 50% balance" },
  { value: "100% on completion", label: "100% on completion" },
  { value: "50% upfront / 50% on completion", label: "50% upfront / 50% on completion" },
  { value: "30% on signing / 70% on completion", label: "30% on signing / 70% on completion" },
  { value: "Custom", label: "Custom" },
] as const;

const SHIPPING_APPLICABLE_OPTIONS = [
  { value: "No", label: "No" },
  { value: "Yes", label: "Yes" },
] as const;

const RETURNABLE_OPTIONS = [
  { value: "Gift / keep product", label: "Gift / keep product" },
  { value: "Returnable loaner", label: "Returnable loaner" },
] as const;

const ATTRIBUTION_OPTIONS = [
  { value: "No attribution required", label: "No attribution required" },
  { value: "Brand tag required", label: "Brand tag required" },
  { value: "Custom attribution", label: "Custom attribution" },
] as const;

const EDITING_RIGHTS_OPTIONS = [
  { value: "Cropping / resizing only", label: "Cropping / resizing only" },
  { value: "Cut-downs / captions allowed", label: "Cut-downs / captions allowed" },
  { value: "Custom editing rights", label: "Custom editing rights" },
] as const;

const MORALS_OPTIONS = [
  { value: "Not included", label: "Not included" },
  { value: "Included", label: "Included" },
] as const;

const DISPUTE_OPTIONS = [
  { value: "AAA arbitration", label: "AAA arbitration" },
  { value: "Court litigation", label: "Court litigation" },
  { value: "Mutual negotiation first", label: "Mutual negotiation first" },
] as const;

const defaultUsageRightsRows = (): UsageRightsRow[] => [
  {
    id: createRowId(),
    usageRight: "Organic repost on Brand-owned social channels",
    selected: false,
    duration: "",
    territoryNotes: "",
  },
  {
    id: createRowId(),
    usageRight: "Brand website / blog / PDP / retailer listing",
    selected: false,
    duration: "",
    territoryNotes: "",
  },
  {
    id: createRowId(),
    usageRight: "Email / CRM / deck / internal presentation use",
    selected: false,
    duration: "",
    territoryNotes: "",
  },
  {
    id: createRowId(),
    usageRight: "Paid social / boosting / ads",
    selected: false,
    duration: "",
    territoryNotes: "",
  },
  {
    id: createRowId(),
    usageRight: "Whitelisting / Spark Ads / dark posting / creator handle",
    selected: false,
    duration: "",
    territoryNotes: "",
  },
  {
    id: createRowId(),
    usageRight: "Perpetual rights / buyout / work-made-for-hire",
    selected: false,
    duration: "",
    territoryNotes: "",
  },
];

const createDefaultScheduleDeliverable = (): ScheduleADeliverable => ({
  id: createRowId(),
  srNo: 1,
  platformHandle: "",
  deliverableFormat: "",
  qty: "1",
  draftDue: "",
  liveDate: "",
});

const createDefaultContractForm = (): ContractFormState => ({
  brand: {
    legalName: "",
    contactPersonName: "",
    noticeEmail: "",
    noticePhone: "",
    billingAddress: "",
  },
  influencer: {
    legalName: "",
    contactName: "",
    postingHandleUrl: "",
    contactEmail: "",
    contactPhone: "",
    whatsApp: "",
    address: "",
  },
  campaign: {
    productsServicesCovered: "",
    territoryTargetCountry: "Worldwide",
    effectiveDate: "",
    campaignTitleOrId: "",
  },
  scheduleA: {
    minimumVideoSpecs: "",
    preShootScriptRequired: false,
    preShootScriptDue: "",
    preShootScriptReviewBusinessDays: "2",
    mandatoryTagsMentionsLinksCodes: "",
    review: {
      includedRevisionRounds: "1",
      additionalRevisionFee: "",
      reshootObligation:
        "No reshoot required except for material failure to follow approved brief",
      reshootFee: "",
      minimumLivePeriod: "",
    },
    commercial: {
      totalCampaignFee: "",
      currency: "USD",
      platformMilestonePaymentStructure: "50% advance / 50% balance",
      customSplit: "",
      advancePaymentTrigger: "",
      remainingPaymentTrigger: "",
      paymentProcessorFeesBorneBy: "",
      paymentProcessorFeesNotes: "",
      laneAMarketplaceFeeNote:
        "Unless expressly stated otherwise, 10% of the applicable Influencer compensation funded through the Platform is deducted from the Influencer payout and retained by CollabGlam; the Brand-funded campaign amount remains fixed.",
    },
    rawFiles: {
      rawSourceFileDelivery: "Not included",
      deliveryDue: "",
      format: "",
      analyticsReportingDeadline: "",
      analyticsReportingItems: "",
    },
    shipping: {
      productShippingApplicable: "No",
      shipToName: "",
      shipToAddress: "",
      shipToPhone: "",
      productReceiptConfirmationDeadline: "",
      productReturnable: "Gift / keep product",
      returnWindowMethod: "",
      riskOfLossNotes: "",
    },
    usageRights: {
      rows: defaultUsageRightsRows(),
      attributionRequirement: "No attribution required",
      attributionText: "",
      editingRights: "Cropping / resizing only",
      musicStockAssetResponsibility:
        "Brand responsible for separate commercial licensing",
    },
    compliance: {
      creativeBriefMandatoryTalkingPoints: "",
      restrictedStatements: "",
    },
    exclusivity: {
      competitorBlackout: "None",
      categoryCompetitorList: "",
      blackoutPeriod: "",
      optionalMoralsClause: "Not included",
    },
    cancellation: {
      killFeeOrProrata: "None",
      refundOfUnearnedAdvance:
        "Yes — on material non-performance / uncured breach",
    },
    dispute: {
      governingLaw: "Nevada, USA",
      disputeResolutionMethod: "AAA arbitration",
      disputeVenue: "",
      arbitrationSeat: "Las Vegas, Nevada, USA",
      attorneysFees: "Each Party bears own fees",
    },
  },
});

function createRowId() {
  return Math.random().toString(36).slice(2);
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function getAtPath(obj: any, path: string, fallback: any = "") {
  const value = String(path)
    .split(".")
    .reduce((acc, key) => acc?.[key], obj);
  return value === undefined || value === null ? fallback : value;
}

function setAtPath<T extends Record<string, any>>(obj: T, path: string, value: any): T {
  const clone = deepClone(obj);
  const keys = String(path).split(".");
  let ref: any = clone;
  while (keys.length > 1) {
    const key = keys.shift()!;
    if (!ref[key] || typeof ref[key] !== "object") ref[key] = {};
    ref = ref[key];
  }
  ref[keys[0]] = value;
  return clone;
}

function mergeDeep<T>(base: T, patch: any): T {
  if (patch === undefined || patch === null) return base;
  if (Array.isArray(patch)) return patch as T;
  if (typeof patch !== "object") return patch;

  const output: any = Array.isArray(base) ? [...base] : { ...(base as any) };
  for (const [key, value] of Object.entries(patch)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      output[key] &&
      typeof output[key] === "object" &&
      !Array.isArray(output[key])
    ) {
      output[key] = mergeDeep(output[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

const toast = (opts: {
  icon: "success" | "error" | "info";
  title: string;
  text?: string;
}) =>
  Swal.fire({
    ...opts,
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
    background: "white",
    customClass: { popup: "rounded-lg border border-gray-200" },
  });

const askConfirm = async (title: string, text?: string) => {
  const result = await Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, continue",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    background: "white",
  });
  return result.isConfirmed;
};

function toInputDate(v?: string | Date | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatCompactAudience(n: number) {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatMoneyINR(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function normalizePlatform(platform?: string | null): PlatformType {
  switch ((platform || "").toLowerCase()) {
    case "instagram":
      return "instagram";
    case "tiktok":
      return "tiktok";
    case "youtube":
    default:
      return "youtube";
  }
}

function buildHandleUrl(platform?: string | null, handle?: string | null) {
  if (!handle) return null;
  const raw = handle.startsWith("@") ? handle.slice(1) : handle;
  switch ((platform || "").toLowerCase()) {
    case "instagram":
      return `https://instagram.com/${raw}`;
    case "tiktok":
      return `https://www.tiktok.com/@${raw}`;
    case "youtube":
    default:
      return `https://www.youtube.com/@${raw}`;
  }
}

function sanitizeHandle(h: string) {
  const t = (h || "").trim();
  if (!t) return t;
  return t.startsWith("@") ? t : `@${t}`;
}

function getCategoryLabel(inf: any) {
  const pick = (...vals: any[]) =>
    vals.find((v) => typeof v === "string" && v.trim());
  const fromObj = (o?: any) =>
    o && typeof o.name === "string" && o.name.trim() ? o.name : "";

  const direct = pick(
    inf.category,
    inf.category_name,
    inf.categoryName,
    inf.categoryTitle,
    inf.primaryCategory,
    inf.niche,
    inf.vertical
  );
  if (direct) return direct;

  const obj =
    fromObj(inf.category) ||
    fromObj(inf.primary_category) ||
    fromObj(inf.influencerCategory);
  if (obj) return obj;

  const arr =
    inf.categories || inf.category_list || inf.influencerCategories || [];
  if (Array.isArray(arr) && arr.length) {
    const names = arr.map(fromObj).filter(Boolean);
    if (names.length) return names.join(", ");
  }

  return "—";
}

function getEngagementValue(inf: Influencer) {
  const raw = Number((inf as any)?.engagementRate ?? (inf as any)?.engagement ?? 0);
  return Number.isFinite(raw) ? raw : 0;
}

function getFollowerTierBucket(n: number) {
  if (n < 10_000) return "Nano";
  if (n < 100_000) return "Micro";
  if (n < 500_000) return "Mid";
  if (n < 1_000_000) return "Macro";
  return "Mega";
}

function matchesEngagementFilter(value: number, filterValue: string) {
  if (!filterValue || filterValue === "All") return true;
  if (filterValue === "0-2%") return value >= 0 && value < 2;
  if (filterValue === "2-5%") return value >= 2 && value < 5;
  if (filterValue === "5-8%") return value >= 5 && value < 8;
  if (filterValue === "8-12%") return value >= 8 && value < 12;
  if (filterValue === "12%+") return value >= 12;
  return true;
}

function matchesDateFilter(dateStr: string, filterValue: string) {
  if (!filterValue || filterValue === "All") return true;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (filterValue === "Today") {
    return date.toDateString() === now.toDateString();
  }
  if (filterValue === "Last 7 Days") return diffDays <= 7;
  if (filterValue === "Last 30 Days") return diffDays <= 30;
  return true;
}

function isRejectedMeta(meta?: ContractMeta | null) {
  if (!meta) return false;
  const s = String(meta.status || "").toUpperCase();
  return (
    s === CONTRACT_STATUS.REJECTED ||
    (meta as any).isRejected === 1 ||
    meta.flags?.isRejected ||
    meta.statusFlags?.isRejected
  );
}

function wasResent(meta?: ContractMeta | null) {
  if (!meta) return false;
  if ((meta as any).isResend || (meta as any).isresend) return true;
  if (meta.flags?.isResend || meta.flags?.isResendChild) return true;
  if (meta.statusFlags?.isResend || meta.statusFlags?.isResendChild) return true;
  if (typeof meta.resendIteration === "number" && meta.resendIteration > 0) return true;
  const audit = Array.isArray(meta.audit) ? meta.audit : [];
  return audit.some((ev) => (ev.type || "").toUpperCase() === "RESENT");
}

function signingStatusLabel(meta?: ContractMeta | null) {
  if (!meta) return null;
  const s = String(meta.status || "");
  if (s !== CONTRACT_STATUS.READY_TO_SIGN) return null;

  const brandSigned = !!meta.signatures?.brand?.signed;
  const influencerSigned = !!meta.signatures?.influencer?.signed;

  if (brandSigned && !influencerSigned) return "Awaiting influencer signature";
  if (!brandSigned && influencerSigned) return "Awaiting brand signature";
  if (!brandSigned && !influencerSigned) return "Ready to sign";
  if (brandSigned && influencerSigned) return "Signed";
  return null;
}

function statusLabel(status?: string | null) {
  switch (status) {
    case CONTRACT_STATUS.BRAND_SENT_DRAFT:
      return "Draft sent to influencer";
    case CONTRACT_STATUS.BRAND_EDITED:
      return "Brand edited";
    case CONTRACT_STATUS.INFLUENCER_EDITED:
      return "Influencer edited";
    case CONTRACT_STATUS.INFLUENCER_ACCEPTED:
      return "Influencer accepted";
    case CONTRACT_STATUS.BRAND_ACCEPTED:
      return "Brand accepted";
    case CONTRACT_STATUS.READY_TO_SIGN:
      return "Ready to sign";
    case CONTRACT_STATUS.CONTRACT_SIGNED:
      return "Signed";
    case CONTRACT_STATUS.MILESTONES_CREATED:
      return "Milestones created";
    case CONTRACT_STATUS.SUPERSEDED:
      return "Superseded";
    case CONTRACT_STATUS.REJECTED:
      return "Rejected";
    default:
      return status ? String(status) : "—";
  }
}

function prettyStatus(meta: ContractMeta | null, hasContract: boolean, fallbackApplied = false) {
  if (!hasContract) return fallbackApplied ? "Applied" : "—";
  if (isRejectedMeta(meta)) return "Rejected";
  const signing = signingStatusLabel(meta);
  if (signing) return signing;
  return statusLabel(String(meta?.status || ""));
}

function getAppliedTypeLabel(meta: ContractMeta | null, hasContract: boolean) {
  if (isRejectedMeta(meta)) return "Rejected";
  const status = String(meta?.status || "");

  if (!hasContract) return "Applied";
  if (
    status === CONTRACT_STATUS.CONTRACT_SIGNED ||
    status === CONTRACT_STATUS.MILESTONES_CREATED
  ) {
    return "Active";
  }
  if (
    status === CONTRACT_STATUS.INFLUENCER_ACCEPTED ||
    status === CONTRACT_STATUS.BRAND_ACCEPTED ||
    status === CONTRACT_STATUS.READY_TO_SIGN
  ) {
    return "Selected";
  }
  return "Invited";
}

function matchesInfluencerType(typeLabel: string, filterValue: string) {
  if (!filterValue || filterValue === "All") return true;
  return typeLabel.toLowerCase() === filterValue.toLowerCase();
}

function isLockedStatus(status?: string | null) {
  return (
    status === CONTRACT_STATUS.CONTRACT_SIGNED ||
    status === CONTRACT_STATUS.MILESTONES_CREATED
  );
}

function isEditableStatus(status?: string | null) {
  return (
    status === CONTRACT_STATUS.BRAND_SENT_DRAFT ||
    status === CONTRACT_STATUS.BRAND_EDITED ||
    status === CONTRACT_STATUS.INFLUENCER_EDITED ||
    status === CONTRACT_STATUS.INFLUENCER_ACCEPTED
  );
}

function needsBrandAcceptance(status?: string | null) {
  return status === CONTRACT_STATUS.INFLUENCER_ACCEPTED;
}

function canSignNow(status?: string | null) {
  return status === CONTRACT_STATUS.READY_TO_SIGN;
}

function getRejectReasonFromMeta(meta: ContractMeta | null): string | null {
  if (!meta) return null;
  const events = Array.isArray(meta.audit) ? meta.audit : [];
  const rejected = [...events]
    .reverse()
    .find((ev) => (ev.type || "").toUpperCase() === "REJECTED");
  return rejected?.details?.reason ? String(rejected.details.reason).trim() : null;
}

function buildReactSelectStyles(opts?: { hasError?: boolean }) {
  const hasError = opts?.hasError;
  return {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: 44,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: hasError
        ? "#ef4444"
        : state.isFocused
          ? "#FF8A35"
          : "#e5e7eb",
      boxShadow: state.isFocused
        ? "0 0 0 1px #FF8A35, 0 0 0 3px rgba(255,138,53,0.35)"
        : "none",
      "&:hover": {
        borderColor: hasError
          ? "#ef4444"
          : state.isFocused
            ? "#FF8A35"
            : "#e5e7eb",
      },
    }),
    valueContainer: (base: any) => ({ ...base, padding: "0 12px" }),
    indicatorsContainer: (base: any) => ({ ...base, minHeight: 44 }),
    input: (base: any) => ({ ...base, margin: 0, padding: 0 }),
    multiValue: (base: any) => ({
      ...base,
      borderRadius: 9999,
      paddingLeft: 4,
      paddingRight: 4,
    }),
  };
}

export default function AppliedInfluencersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const campaignId = searchParams.get("id");
  const influencerId = searchParams.get("infId");
  const createdPage = searchParams.get("createdPage") === "true";

  const [serverCampaignTitle, setServerCampaignTitle] = useState("");
  const [serverBudget, setServerBudget] = useState<number | null>(null);
  const [serverTimeline, setServerTimeline] = useState<{
    startDate?: string | Date;
    endDate?: string | Date;
  } | null>(null);

  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState<FilterState>({
    "Influencer Type": "",
    "Engagement Rate": "",
    Follower: "",
    Category: [],
    Platform: [],
    Date: "",
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortValue, setSortValue] = useState("Priority");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [highlightInfId, setHighlightInfId] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>("send");
  const [selectedInf, setSelectedInf] = useState<Influencer | null>(null);
  const [selectedMeta, setSelectedMeta] = useState<ContractMeta | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");

  const [metaCache, setMetaCache] = useState<Record<string, ContractMeta | null>>({});
  const [metaCacheLoading, setMetaCacheLoading] = useState(false);

  const [brandId, setBrandId] = useState<string | null>(null);
  const [brandPlanName, setBrandPlanName] = useState("free");
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([]);
  const [tzOptions, setTzOptions] = useState<TzOption[]>([]);
  const [listsLoading, setListsLoading] = useState(true);

  const [requestedEffDate, setRequestedEffDate] = useState("");
  const [requestedEffTz, setRequestedEffTz] = useState(DEFAULT_TIMEZONE);
  const [contractForm, setContractForm] = useState<ContractFormState>(
    createDefaultContractForm()
  );
  const [deliverables, setDeliverables] = useState<ScheduleADeliverable[]>([
    createDefaultScheduleDeliverable(),
  ]);

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSendLoading, setIsSendLoading] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);

  const [signOpen, setSignOpen] = useState(false);
  const [signTargetMeta, setSignTargetMeta] = useState<ContractMeta | null>(null);

  const signerName =
    (typeof window !== "undefined" &&
      (localStorage.getItem("brandContactName") ||
        localStorage.getItem("brandName") ||
        "")) ||
    "";
  const signerEmail =
    (typeof window !== "undefined" && localStorage.getItem("brandEmail")) || "";

  const isFullyManagedPlan = brandPlanName === "fully_managed";
  const pageTitle = serverCampaignTitle || contractForm.campaign.campaignTitleOrId || "Unknown Campaign";

  const clearErrors = useCallback(() => setFormErrors({}), []);
  const setErr = useCallback((key: string, msg: string) => {
    setFormErrors((prev) => ({ ...prev, [key]: msg }));
  }, []);

  const setContractField = useCallback((path: string, value: any) => {
    setContractForm((prev) => setAtPath(prev, path, value));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedBrandId = localStorage.getItem("brandId");
    setBrandId(storedBrandId);
    const cachedPlan = localStorage.getItem("brandPlanName");
    if (cachedPlan) setBrandPlanName(String(cachedPlan).toLowerCase());
  }, []);

  useEffect(() => {
    if (!brandId) return;
    (async () => {
      try {
        const res: any = await api.get("/subscription/brand/current", {
          params: { brandId },
        });
        const data = res?.data || res || {};
        const latestName = (data?.brandPlanName || "free").toString().toLowerCase();
        const latestId = data?.brandPlanId || null;
        setBrandPlanName(latestName);
        localStorage.setItem("brandPlanName", latestName);
        if (latestId) localStorage.setItem("brandPlanId", latestId);
      } catch {
        // ignore
      }
    })();
  }, [brandId]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        target?.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT";
      if (isEditable) return;

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  useEffect(() => {
    if (!campaignId) return;
    (async () => {
      try {
        const res: any = await api.get("/campaign/campaignSummary", {
          params: { id: campaignId },
        });
        const data = res?.data || res || {};
        const campaignName = data.campaignName || data.productOrServiceName || "";
        const budgetNum =
          typeof data.budget === "number" ? data.budget : Number(data.budget ?? NaN);

        setServerCampaignTitle(campaignName);
        setContractField("campaign.campaignTitleOrId", campaignName);
        setContractField("campaign.productsServicesCovered", data.productOrServiceName || "");

        if (!Number.isNaN(budgetNum)) {
          setServerBudget(budgetNum);
          setContractField("scheduleA.commercial.totalCampaignFee", String(budgetNum));
        }

        if (data.timeline) {
          const start = data.timeline.startDate
            ? toInputDate(new Date(data.timeline.startDate))
            : "";
          const end = data.timeline.endDate
            ? toInputDate(new Date(data.timeline.endDate))
            : "";
          setServerTimeline(data.timeline);
          if (start) {
            setRequestedEffDate(start);
            setContractField("campaign.effectiveDate", start);
          }
          if (end) {
            setContractField(
              "scheduleA.review.minimumLivePeriod",
              `Until ${new Date(end).toLocaleDateString()}`
            );
          }
        }
      } catch (e: any) {
        toast({
          icon: "error",
          title: "Failed to load campaign",
          text:
            e?.response?.data?.message ||
            e?.message ||
            "Could not fetch campaign summary.",
        });
      }
    })();
  }, [campaignId, setContractField]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setListsLoading(true);
      try {
        const curRes: any = await api.get("/contract/currencies");
        const curArr: any[] =
          curRes?.data?.currencies || curRes?.currencies || curRes || [];
        const currencies = curArr.map((c) => {
          const code = String(c.code || c.symbol || "");
          return {
            value: code,
            label: c.name ? `${code} — ${c.name}` : code,
            meta: c,
          };
        });

        const tzRes: any = await api.get("/contract/timezones");
        const tzArr: any[] = tzRes?.data?.timezones || tzRes?.timezones || tzRes || [];
        const zones = tzArr.map((t) => {
          const canonical = Array.isArray(t.utc) && t.utc.length ? t.utc[0] : t.value;
          return {
            value: canonical,
            label: t.text || t.value,
            meta: t,
          };
        });

        if (!alive) return;
        setCurrencyOptions(currencies);
        setTzOptions(zones);
      } catch (e: any) {
        toast({
          icon: "error",
          title: "Lists failed",
          text: e?.message || "Could not load currency/timezone lists.",
        });
      } finally {
        if (alive) setListsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const fetchApplicants = useCallback(
    async (searchTerm?: string) => {
      if (!campaignId) return;
      setLoading(true);
      setError(null);
      try {
        const res: any = await post("/apply/list", {
          campaignId,
          page,
          limit: PAGE_SIZE,
          search: (searchTerm ?? "").trim(),
          sortField: "createdAt",
          sortOrder: 0,
          createdPage,
        });

        const influencersList =
          res?.influencers || res?.data?.influencers || res?.data?.data || [];
        const incomingMeta =
          res?.meta ||
          res?.data?.meta || {
            total: 0,
            page: 1,
            limit: PAGE_SIZE,
            totalPages: 1,
          };

        setInfluencers(influencersList || []);
        setMeta(incomingMeta);
      } catch (e: any) {
        setError(
          e?.response?.data?.message || e?.message || "Failed to load applicants."
        );
      } finally {
        setLoading(false);
      }
    },
    [campaignId, page, createdPage]
  );

  useEffect(() => {
    fetchApplicants(debouncedSearch);
  }, [fetchApplicants, debouncedSearch]);

  const getLatestContractFor = useCallback(
    async (inf: Influencer): Promise<ContractMeta | null> => {
      const activeBrandId =
        typeof window !== "undefined" ? localStorage.getItem("brandId") : null;
      if (!activeBrandId || !campaignId) return null;
      try {
        const res: any = await post("/contract/getContract", {
          brandId: activeBrandId,
          influencerId: inf.influencerId,
          campaignId,
        });
        const list = res?.contracts || res?.data?.contracts || [];
        const filtered = (list as ContractMeta[]).filter(
          (c) => String(c.campaignId) === String(campaignId)
        );
        return filtered.length ? filtered[0] : list.length ? list[0] : null;
      } catch (e: any) {
        toast({
          icon: "error",
          title: "Meta fetch failed",
          text:
            e?.response?.data?.message ||
            e?.message ||
            "Could not load contract state.",
        });
        return null;
      }
    },
    [campaignId]
  );

  const loadMetaCache = useCallback(
    async (list: Influencer[]) => {
      if (!list.length) {
        setMetaCache({});
        return;
      }
      setMetaCacheLoading(true);
      try {
        const metas = await Promise.all(list.map((inf) => getLatestContractFor(inf)));
        const next: Record<string, ContractMeta | null> = {};
        list.forEach((inf, index) => {
          next[inf.influencerId] = metas[index] || null;
        });
        setMetaCache(next);
      } catch (e: any) {
        toast({
          icon: "error",
          title: "Meta cache failed",
          text: e?.message || "Unable to build contract cache.",
        });
      } finally {
        setMetaCacheLoading(false);
      }
    },
    [getLatestContractFor]
  );

  useEffect(() => {
    loadMetaCache(influencers);
  }, [influencers, loadMetaCache]);

  useEffect(() => {
    if (!influencerId || !influencers.length) return;
    const exists = influencers.some(
      (inf) => String(inf.influencerId) === String(influencerId)
    );
    if (!exists) return;

    setHighlightInfId(influencerId);
    const el =
      document.getElementById(`inf-row-${influencerId}`) ||
      document.getElementById(`inf-card-${influencerId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });

    const timeout = setTimeout(() => setHighlightInfId(null), 4000);
    return () => clearTimeout(timeout);
  }, [influencerId, influencers]);

  const clearPreview = useCallback(() => {
    setPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
  }, []);

  useEffect(() => {
    clearPreview();
  }, [contractForm, deliverables, requestedEffDate, requestedEffTz, clearPreview]);

  const prefillFormFor = useCallback(
    (inf: Influencer, meta?: ContractMeta | null) => {
      clearErrors();

      const base = createDefaultContractForm();
      base.brand.legalName = localStorage.getItem("brandName") || "";
      base.brand.contactPersonName = localStorage.getItem("brandContactName") || "";
      base.brand.noticeEmail = localStorage.getItem("brandEmail") || "";
      base.brand.noticePhone = localStorage.getItem("brandPhone") || "";
      base.brand.billingAddress = localStorage.getItem("brandAddress") || "";

      base.influencer.legalName = inf.name || "";
      base.influencer.contactName = inf.name || "";
      base.influencer.postingHandleUrl =
        buildHandleUrl(inf.primaryPlatform, inf.handle) || "";
      base.influencer.contactEmail = (inf as any)?.email || "";
      base.influencer.contactPhone = (inf as any)?.phone || "";
      base.influencer.whatsApp = (inf as any)?.whatsapp || "";
      base.influencer.address = (inf as any)?.address || "";

      base.campaign.campaignTitleOrId = serverCampaignTitle || "";
      base.campaign.productsServicesCovered =
        (inf as any)?.productOrServiceName || "";
      base.campaign.territoryTargetCountry = "Worldwide";
      base.campaign.effectiveDate = requestedEffDate || toInputDate(new Date());

      base.scheduleA.commercial.totalCampaignFee = String(
        serverBudget ?? inf.feeAmount ?? 0
      );

      if (serverTimeline?.startDate) {
        const start = toInputDate(serverTimeline.startDate);
        if (start) {
          base.campaign.effectiveDate = start;
          setRequestedEffDate(start);
        }
      }
      if (meta?.requestedEffectiveDate) {
        setRequestedEffDate(toInputDate(meta.requestedEffectiveDate));
      }
      if (meta?.requestedEffectiveDateTimezone) {
        setRequestedEffTz(meta.requestedEffectiveDateTimezone || DEFAULT_TIMEZONE);
      } else {
        setRequestedEffTz(DEFAULT_TIMEZONE);
      }

      const seededDeliverable = createDefaultScheduleDeliverable();
      seededDeliverable.platformHandle = inf.handle ? sanitizeHandle(inf.handle) : "";
      seededDeliverable.srNo = 1;

      const merged = mergeDeep(base, meta?.content || {});
      const scheduleAFromMeta = meta?.content?.scheduleA;
      const usageRows = scheduleAFromMeta?.usageRights?.rows;
      const deliverablesFromMeta = scheduleAFromMeta?.deliverables;

      if (Array.isArray(usageRows) && usageRows.length) {
        merged.scheduleA.usageRights.rows = usageRows.map((row) => ({
          id: createRowId(),
          usageRight: String(row?.usageRight || ""),
          selected: Boolean(row?.selected),
          duration: String(row?.duration || ""),
          territoryNotes: String(row?.territoryNotes || ""),
        }));
      }

      setDeliverables(
        Array.isArray(deliverablesFromMeta) && deliverablesFromMeta.length
          ? deliverablesFromMeta.map((row, index) => ({
            id: createRowId(),
            srNo: Number(row?.srNo ?? index + 1),
            platformHandle: String(row?.platformHandle || ""),
            deliverableFormat: String(row?.deliverableFormat || ""),
            qty: String(row?.qty ?? "1"),
            draftDue: String(row?.draftDue || ""),
            liveDate: String(row?.liveDate || ""),
          }))
          : [seededDeliverable]
      );

      setContractForm(merged);
    },
    [clearErrors, requestedEffDate, serverBudget, serverCampaignTitle, serverTimeline]
  );

  const openSidebar = useCallback(
    async (inf: Influencer, mode: PanelMode) => {
      if (isFullyManagedPlan) {
        toast({
          icon: "info",
          title: "Fully Managed Plan",
          text: "Contract sending is handled by CollabGlam for Fully Managed brands.",
        });
        return;
      }

      setSelectedInf(inf);
      setPanelMode(mode);
      const meta = metaCache[inf.influencerId] ?? (await getLatestContractFor(inf));
      setSelectedMeta(meta || null);
      prefillFormFor(inf, meta || null);
      clearPreview();
      setSidebarOpen(true);
    },
    [clearPreview, getLatestContractFor, isFullyManagedPlan, metaCache, prefillFormFor]
  );

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    clearPreview();
    setSelectedInf(null);
    setSelectedMeta(null);
    setIsPreviewLoading(false);
    setIsSendLoading(false);
    setIsUpdateLoading(false);
  }, [clearPreview]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const buildContentPayload = useCallback(() => {
    const content = deepClone(contractForm);

    return {
      ...content,
      campaign: {
        ...content.campaign,
        effectiveDate: requestedEffDate || content.campaign.effectiveDate || "",
      },
      scheduleA: {
        ...content.scheduleA,
        deliverables: deliverables.map((row, index) => ({
          srNo: index + 1,
          platformHandle: row.platformHandle,
          deliverableFormat: row.deliverableFormat,
          qty: Number(row.qty || "0") || 0,
          draftDue: row.draftDue,
          liveDate: row.liveDate,
        })),
        review: {
          ...content.scheduleA.review,
          includedRevisionRounds:
            Number(content.scheduleA.review.includedRevisionRounds || "1") || 1,
        },
        commercial: {
          ...content.scheduleA.commercial,
          totalCampaignFee:
            Number(content.scheduleA.commercial.totalCampaignFee || "0") || 0,
        },
        usageRights: {
          ...content.scheduleA.usageRights,
          rows: content.scheduleA.usageRights.rows.map((row) => ({
            usageRight: row.usageRight,
            selected: row.selected,
            duration: row.duration,
            territoryNotes: row.territoryNotes,
          })),
        },
      },
    };
  }, [contractForm, deliverables, requestedEffDate]);
  const buildBrandUpdatesPayload = useCallback(() => {
    return {
      content: buildContentPayload(),
    };
  }, [buildContentPayload]);

  const scrollFirstErrorIntoView = useCallback(() => {
    const first = document.querySelector("[data-field-error=true]") as HTMLElement | null;
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const validateForPreview = useCallback(() => {
    clearErrors();
    let ok = true;
    const add = (key: string, message: string) => {
      ok = false;
      setErr(key, message);
    };

    const feeValue = Number(contractForm.scheduleA.commercial.totalCampaignFee || "");
    const revisionValue = Number(contractForm.scheduleA.review.includedRevisionRounds || "");
    const reviewDays = Number(
      contractForm.scheduleA.preShootScriptReviewBusinessDays || "2"
    );

    if (!contractForm.brand.legalName.trim()) add("brand.legalName", "Brand legal name is required.");
    if (!contractForm.influencer.legalName.trim()) add("influencer.legalName", "Influencer legal name is required.");
    if (!contractForm.campaign.campaignTitleOrId.trim()) add("campaign.campaignTitleOrId", "Campaign title / ID is required.");
    if (!contractForm.scheduleA.commercial.currency) add("scheduleA.commercial.currency", "Currency is required.");
    if (
      !contractForm.scheduleA.commercial.totalCampaignFee.trim() ||
      Number.isNaN(feeValue) ||
      feeValue < 0
    ) {
      add("scheduleA.commercial.totalCampaignFee", "Enter a valid non-negative fee.");
    }
    if (Number.isNaN(revisionValue) || revisionValue < 0) {
      add("scheduleA.review.includedRevisionRounds", "Revision rounds must be zero or more.");
    }
    if (Number.isNaN(reviewDays) || reviewDays < 0) {
      add(
        "scheduleA.preShootScriptReviewBusinessDays",
        "Review business days must be zero or more."
      );
    }
    if (!requestedEffDate) add("requestedEffDate", "Requested effective date is required.");

    if (!deliverables.length) {
      add("scheduleA.deliverables", "Add at least one deliverable.");
    } else {
      const messages: string[] = [];
      deliverables.forEach((row, index) => {
        const label = `Deliverable #${index + 1}`;
        const qtyNum = Number(row.qty || "");
        if (!row.deliverableFormat.trim()) {
          messages.push(`${label}: deliverable format is required.`);
        }
        if (!row.platformHandle.trim()) {
          messages.push(`${label}: platform / handle is required.`);
        }
        if (!row.qty.trim() || Number.isNaN(qtyNum) || qtyNum < 1) {
          messages.push(`${label}: quantity must be at least 1.`);
        }
      });
      if (messages.length) add("scheduleA.deliverables", messages.join(" "));
    }

    if (!ok) {
      toast({ icon: "error", title: "Please fix the highlighted fields" });
      setTimeout(scrollFirstErrorIntoView, 50);
    }
    return ok;
  }, [
    clearErrors,
    contractForm,
    deliverables,
    requestedEffDate,
    scrollFirstErrorIntoView,
    setErr,
  ]);

  const handleGeneratePreview = useCallback(async () => {
    if (!selectedInf || !campaignId || !brandId) return;
    if (!validateForPreview()) return;
    if (isFullyManagedPlan) {
      toast({
        icon: "info",
        title: "Not available on Fully Managed",
        text: "Contract sending and preview are disabled for Fully Managed brands.",
      });
      return;
    }

    setIsPreviewLoading(true);
    try {
      const content = buildContentPayload();
      let res: any;

      if (panelMode === "send") {
        res = await api.post(
          "/contract/initiate",
          {
            brandId,
            campaignId,
            influencerId: selectedInf.influencerId,
            content,
            requestedEffectiveDate: requestedEffDate,
            requestedEffectiveDateTimezone: requestedEffTz,
            preview: true,
          },
          { responseType: "blob" }
        );
      } else {
        if (!selectedMeta?.contractId) {
          toast({ icon: "error", title: "No contract", text: "No contract found." });
          return;
        }
        res = await api.post(
          "/contract/resend",
          {
            contractId: selectedMeta.contractId,
            content,
            requestedEffectiveDate: requestedEffDate,
            requestedEffectiveDateTimezone: requestedEffTz,
            preview: true,
          },
          { responseType: "blob" }
        );
      }

      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(res.data);
      });
      toast({ icon: "success", title: "Preview ready" });
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Preview failed",
        text: e?.response?.data?.message || e?.message || "Could not generate preview.",
      });
    } finally {
      setIsPreviewLoading(false);
    }
  }, [
    brandId,
    buildContentPayload,
    campaignId,
    clearPreview,
    isFullyManagedPlan,
    panelMode,
    requestedEffDate,
    requestedEffTz,
    selectedInf,
    selectedMeta?.contractId,
    validateForPreview,
  ]);

  const handleSendContract = useCallback(async () => {
    if (!selectedInf || !campaignId || !brandId) return;
    if (!pdfUrl) {
      toast({ icon: "info", title: "Preview required", text: "Generate preview before sending." });
      return;
    }
    if (!validateForPreview()) return;

    setIsSendLoading(true);
    try {
      await post("/contract/initiate", {
        brandId,
        campaignId,
        influencerId: selectedInf.influencerId,
        content: buildContentPayload(),
        requestedEffectiveDate: requestedEffDate,
        requestedEffectiveDateTimezone: requestedEffTz,
      });

      toast({ icon: "success", title: "Sent!", text: "Contract sent to influencer." });
      closeSidebar();
      fetchApplicants(debouncedSearch);
      loadMetaCache(influencers);
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Send failed",
        text: e?.response?.data?.message || e?.message || "Failed to send contract.",
      });
    } finally {
      setIsSendLoading(false);
    }
  }, [
    brandId,
    buildContentPayload,
    campaignId,
    closeSidebar,
    debouncedSearch,
    fetchApplicants,
    influencers,
    loadMetaCache,
    pdfUrl,
    requestedEffDate,
    requestedEffTz,
    selectedInf,
    validateForPreview,
  ]);

  const handleEditContract = useCallback(async () => {
    if (!selectedMeta?.contractId || !brandId) return;
    if (!pdfUrl) {
      toast({ icon: "info", title: "Preview required" });
      return;
    }
    if (!validateForPreview()) return;

    setIsUpdateLoading(true);
    try {
      if (isRejectedMeta(selectedMeta)) {
        await post("/contract/resend", {
          contractId: selectedMeta.contractId,
          content: buildContentPayload(),
          requestedEffectiveDate: requestedEffDate,
          requestedEffectiveDateTimezone: requestedEffTz,
        });
        toast({ icon: "success", title: "Resent!", text: "New contract sent to influencer." });
      } else {
        await post("/contract/brand/update", {
          contractId: selectedMeta.contractId,
          brandId,
          type: 0,
          brandUpdates: buildBrandUpdatesPayload(),
        });
        toast({ icon: "success", title: "Updated", text: "Contract updated and shared." });
      }

      closeSidebar();
      fetchApplicants(debouncedSearch);
      loadMetaCache(influencers);
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Action failed",
        text: e?.response?.data?.message || e?.message || "Failed to update contract.",
      });
    } finally {
      setIsUpdateLoading(false);
    }
  }, [
    brandId,
    buildBrandUpdatesPayload,
    buildContentPayload,
    closeSidebar,
    debouncedSearch,
    fetchApplicants,
    influencers,
    loadMetaCache,
    pdfUrl,
    requestedEffDate,
    requestedEffTz,
    selectedMeta,
    validateForPreview,
  ]);

  const handleViewContract = useCallback(
    async (inf?: Influencer) => {
      const target = inf || selectedInf;
      if (!target) return;
      const activeMeta = metaCache[target.influencerId] ?? (await getLatestContractFor(target));
      if (!activeMeta?.contractId) {
        toast({
          icon: "error",
          title: "No contract",
          text: "Please send the contract first.",
        });
        return;
      }
      try {
        const res = await api.post(
          "/contract/viewPdf",
          { contractId: activeMeta.contractId },
          { responseType: "blob" }
        );
        const url = URL.createObjectURL(res.data);
        window.open(url, "_blank");
      } catch (e: any) {
        toast({
          icon: "error",
          title: "Open failed",
          text: e?.message || "Unable to open contract.",
        });
      }
    },
    [getLatestContractFor, metaCache, selectedInf]
  );

  const handleBrandAccept = useCallback(
    async (inf?: Influencer) => {
      const target = inf || selectedInf;
      if (!target) return;
      const activeMeta = metaCache[target.influencerId] ?? (await getLatestContractFor(target));
      if (!activeMeta?.contractId) {
        toast({ icon: "error", title: "No contract", text: "Send contract first." });
        return;
      }

      const ok = await askConfirm(
        "Confirm as Brand?",
        "Once confirmed, the contract can move to signing if the influencer already accepted."
      );
      if (!ok) return;

      try {
        await post("/contract/brand/confirm", { contractId: activeMeta.contractId });
        toast({ icon: "success", title: "Brand accepted" });
        fetchApplicants(debouncedSearch);
        loadMetaCache(influencers);
      } catch (e: any) {
        toast({
          icon: "error",
          title: "Confirm failed",
          text: e?.response?.data?.message || e?.message || "Could not confirm.",
        });
      }
    },
    [debouncedSearch, fetchApplicants, getLatestContractFor, influencers, loadMetaCache, metaCache, selectedInf]
  );

  const openSignModal = useCallback((meta: ContractMeta | null) => {
    if (!meta?.contractId) {
      toast({ icon: "error", title: "No contract", text: "No contract found." });
      return;
    }
    setSignTargetMeta(meta);
    setSignOpen(true);
  }, []);

  const tableRows = useMemo<AppliedInfluencerRow[]>(() => {
    return influencers.map((inf) => {
      const contractMeta = metaCache[inf.influencerId] || null;
      const hasContract = !!(
        contractMeta?.contractId ||
        inf.contractId ||
        inf.isAssigned
      );
      const rejected = isRejectedMeta(contractMeta);
      const typeLabel = getAppliedTypeLabel(contractMeta, hasContract);
      const engagement = getEngagementValue(inf);
      const platform = normalizePlatform(inf.primaryPlatform);
      const category = getCategoryLabel(inf);
      const audience = Number(inf.audienceSize ?? 0);
      const feeAmountValue = Number(inf.feeAmount ?? 0);

      return {
        id: inf.influencerId,
        profile: {
          name: inf.name,
          handle: inf.handle ? sanitizeHandle(inf.handle) : "",
          avatarUrl: (inf as any)?.avatarUrl || (inf as any)?.profileImage || "",
        },
        category,
        followers: audience,
        engagement,
        platforms: [{ platform, followers: audience, engagement }],
        appliedDate: inf.createdAt || "",
        status: prettyStatus(contractMeta, hasContract, true),
        budget: feeAmountValue ? formatMoneyINR(feeAmountValue) : "₹0",
        rawInfluencer: inf,
        contractMeta,
        hasContract,
        rejected,
        typeLabel,
        feeAmountValue,
      };
    });
  }, [influencers, metaCache]);

  const filteredRows = useMemo(() => {
    let list = [...tableRows];

    list = list.filter((row) => {
      const engagementOk = matchesEngagementFilter(
        row.engagement ?? 0,
        filters["Engagement Rate"]
      );

      const influencerTypeOk = matchesInfluencerType(
        row.typeLabel,
        filters["Influencer Type"]
      );

      const categoryOk =
        filters.Category.length === 0 ||
        filters.Category.includes("All") ||
        filters.Category.some((c) => row.category.toLowerCase().includes(c.toLowerCase()));

      const platformNames = (row.platforms || []).map((p) => p.platform.toLowerCase());
      const platformOk =
        filters.Platform.length === 0 ||
        filters.Platform.includes("All") ||
        filters.Platform.some((p) => platformNames.includes(p.toLowerCase()));

      const dateOk = matchesDateFilter(row.appliedDate, filters.Date);
      const followerTierLabel = getFollowerTierBucket(row.followers ?? 0);
      const followerOk =
        !filters.Follower ||
        filters.Follower === "All" ||
        filters.Follower.toLowerCase().includes(followerTierLabel.toLowerCase());

      return (
        engagementOk &&
        influencerTypeOk &&
        categoryOk &&
        platformOk &&
        dateOk &&
        followerOk
      );
    });

    switch (sortValue) {
      case "Recently added":
        list.sort(
          (a, b) =>
            new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
        );
        break;
      case "Highest engagement":
        list.sort((a, b) => (b.engagement ?? 0) - (a.engagement ?? 0));
        break;
      case "Highest follower":
        list.sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));
        break;
      case "Price: Low to High":
        list.sort((a, b) => a.feeAmountValue - b.feeAmountValue);
        break;
      case "Price: HIgh to Low":
        list.sort((a, b) => b.feeAmountValue - a.feeAmountValue);
        break;
      case "Priority":
      default:
        list.sort(
          (a, b) =>
            new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
        );
        break;
    }

    return list;
  }, [filters, sortValue, tableRows]);

  function StatusBadge({
    meta,
    hasContract,
  }: {
    meta: ContractMeta | null;
    hasContract: boolean;
  }) {
    const label = prettyStatus(meta, hasContract, true);
    const rejected = isRejectedMeta(meta);
    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${rejected ? "bg-black text-white" : "bg-[#F7F7F7] text-[#1A1A1A]"
          }`}
      >
        {label}
      </span>
    );
  }

  function AppliedCampaignActionCell({ row }: { row: AppliedInfluencerRow }) {
    const inf = row.rawInfluencer;
    const meta = row.contractMeta;
    const hasContract = row.hasContract;
    const statusStr = String(meta?.status || "");
    const locked = isLockedStatus(statusStr);
    const editable = isEditableStatus(statusStr) || row.rejected;
    const needsAccept = needsBrandAcceptance(statusStr);
    const readyToSign = canSignNow(statusStr) && !meta?.signatures?.brand?.signed;

    const primaryLabel = !hasContract
      ? "Send Contract"
      : row.rejected
        ? "Resend"
        : editable && !locked
          ? "Edit Contract"
          : "View Contract";

    const handlePrimary = () => {
      if (!hasContract) {
        openSidebar(inf, "send");
        return;
      }
      if (editable && !locked) {
        openSidebar(inf, "edit");
        return;
      }
      handleViewContract(inf);
    };

    const handleManageClick = () => {
      router.push(`/brand/influencers?id=${inf.influencerId}`);
    };

    const handleMoreClick = () => {
      if (hasContract) {
        handleViewContract(inf);
        return;
      }
      openSidebar(inf, "send");
    };

    return (
      <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={handlePrimary}
          className="inline-flex h-9 shrink-0 items-center rounded-full border border-[#D9D9D9] bg-white px-4 text-[0.875rem] font-medium text-[#1A1A1A] transition-colors hover:bg-[#F7F7F7]"
        >
          {primaryLabel}
        </button>

        {needsAccept ? (
          <button
            type="button"
            onClick={() => handleBrandAccept(inf)}
            className="inline-flex h-9 shrink-0 items-center rounded-full border border-[#E6E6E6] bg-white px-4 text-[0.875rem] font-medium text-[#1A1A1A] transition-colors hover:bg-[#F7F7F7]"
          >
            <SealCheck className="mr-2 h-4 w-4" /> Accept
          </button>
        ) : null}

        {readyToSign ? (
          <button
            type="button"
            onClick={() => openSignModal(meta)}
            className="inline-flex h-9 shrink-0 items-center rounded-full border border-[#E6E6E6] bg-white px-4 text-[0.875rem] font-medium text-[#1A1A1A] transition-colors hover:bg-[#F7F7F7]"
          >
            <Signature className="mr-2 h-4 w-4" /> Sign
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleManageClick}
          className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#1A1A1A] px-6 text-[0.875rem] font-medium text-white transition-opacity hover:opacity-90"
        >
          Manage
        </button>

        <button
          type="button"
          onClick={() => router.push("/brand/inbox")}
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white transition-colors hover:bg-[#F7F7F7]"
        >
          <EnvelopeOpen size={16} />
          {hasContract ? (
            <span className="absolute right-[0.32rem] top-[0.32rem] h-1.5 w-1.5 rounded-full bg-[#28A745]" />
          ) : null}
        </button>

        <button
          type="button"
          onClick={handleMoreClick}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white transition-colors hover:bg-[#F7F7F7]"
        >
          <DotsThree size={16} weight="bold" />
        </button>
      </div>
    );
  }

  const EmptyState = () => (
    <div className="space-y-3 p-12 text-center">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "#000" }}
      >
        <MagnifyingGlass className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold">No applicants found</h3>
      <p className="text-sm text-gray-600">
        Try adjusting your search or sorting options.
      </p>
    </div>
  );

  const MobileCardList = () => (
    <div className="grid gap-3 md:hidden">
      {filteredRows.map((row) => {
        const inf = row.rawInfluencer;
        const meta = row.contractMeta;
        const hasContract = row.hasContract;
        const href = buildHandleUrl(inf.primaryPlatform, inf.handle);

        return (
          <div
            key={inf.influencerId}
            id={`inf-card-${inf.influencerId}`}
            className={`relative rounded-xl border bg-white p-4 transition-all duration-300 ${highlightInfId === inf.influencerId
                ? "border-[#EA580C] bg-[#FFE4C4] shadow-[0_0_0_2px_rgba(234,88,12,0.9),0_18px_45px_rgba(0,0,0,0.35)] animate-pulse scale-[1.02]"
                : "border-gray-200 hover:-translate-y-[1px] hover:shadow-md"
              }`}
          >
            {highlightInfId === inf.influencerId ? (
              <span className="absolute -top-2 right-3 rounded-full bg-gradient-to-r from-[#FFA135] to-[#FF7236] px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                From notification
              </span>
            ) : null}

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-semibold" title={inf.name}>
                  {inf.name}
                </div>
                <div className="truncate text-sm text-gray-600">
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className="text-black hover:underline">
                      {inf.handle}
                    </a>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                  <Badge className="bg-gray-200 text-gray-800">{row.category}</Badge>
                  <span>•</span>
                  <span>{formatCompactAudience(inf.audienceSize)} audience</span>
                </div>
              </div>

              <StatusBadge meta={meta} hasContract={hasContract} />
            </div>

            <div className="mt-3">
              <AppliedCampaignActionCell row={row} />
            </div>
          </div>
        );
      })}
    </div>
  );

  const todayStr = toInputDate(new Date());
  const updateBtnLabel =
    selectedMeta && isRejectedMeta(selectedMeta) ? "Resend Contract" : "Update Contract";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="mx-auto min-h-screen max-w-full space-y-6 p-4 md:space-y-8 md:p-8">
        <header className="sticky top-0 flex items-center justify-between rounded-md border-b border-gray-100 bg-white/90 p-2 backdrop-blur supports-[backdrop-filter]:bg-white/70 md:p-4">
          <h1 className="truncate text-xl font-bold md:text-3xl">Campaign: {pageTitle}</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="bg-gray-200 text-black" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </header>

        <InfluencerFilter
          filters={filters}
          setFilters={setFilters}
          search={search}
          setSearch={setSearch}
          sortValue={sortValue}
          setSortValue={setSortValue}
        />

        {loading ? (
          <div className="rounded-md bg-white shadow-sm">
            <LoadingSkeleton rows={PAGE_SIZE} />
          </div>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-md bg-white shadow-sm">
            <EmptyState />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-md md:block">
              <InfluencerTable
                rows={filteredRows}
                variant="shortlisted"
                renderStatus={(baseRow) => {
                  const row = baseRow as AppliedInfluencerRow;
                  if (row.rejected) {
                    return (
                      <div className="space-y-1 text-center">
                        <span className="inline-flex items-center rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                          Rejected
                        </span>
                        <p className="max-w-[150px] break-words text-[11px] text-gray-500">
                          {getRejectReasonFromMeta(row.contractMeta) || "No reason provided"}
                        </p>
                      </div>
                    );
                  }

                  return <StatusBadge meta={row.contractMeta} hasContract={row.hasContract} />;
                }}
                renderShortlistedActions={(baseRow) => (
                  <AppliedCampaignActionCell row={baseRow as AppliedInfluencerRow} />
                )}
              />
            </div>

            <MobileCardList />
          </>
        )}

        {meta.totalPages > 1 ? (
          <div className="flex items-center justify-center gap-2 md:justify-end">
            <Button
              variant="outline"
              size="icon"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="text-black"
              aria-label="Previous page"
            >
              <CaretLeft />
            </Button>
            <span className="text-sm">
              Page <strong>{page}</strong> of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={page === meta.totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
              className="text-black"
              aria-label="Next page"
            >
              <CaretRight />
            </Button>
          </div>
        ) : null}

        <ContractSidebar
          isOpen={sidebarOpen && !isFullyManagedPlan}
          onClose={closeSidebar}
          title={
            panelMode === "send"
              ? "Send Contract"
              : selectedMeta && isRejectedMeta(selectedMeta)
                ? "Resend Contract"
                : "Edit Contract"
          }
          subtitle={
            selectedInf ? `${pageTitle || "Agreement"} • ${selectedInf.name}` : pageTitle || "Agreement"
          }
          previewUrl={pdfUrl}
          onClosePreview={clearPreview}
        >
          <SidebarSection title="Brand & Influencer" icon={<FileText className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Brand</div>
                <FloatingLabelInput
                  id="brand-legal-name"
                  label="Brand Legal Name"
                  value={getAtPath(contractForm, "brand.legalName")}
                  onChange={(e: any) => setContractField("brand.legalName", e.target.value)}
                  error={formErrors["brand.legalName"]}
                />
                <FloatingLabelInput
                  id="brand-contact-person"
                  label="Contact Person Name"
                  value={getAtPath(contractForm, "brand.contactPersonName")}
                  onChange={(e: any) =>
                    setContractField("brand.contactPersonName", e.target.value)
                  }
                />
                <FloatingLabelInput
                  id="brand-notice-email"
                  label="Notice Email"
                  value={getAtPath(contractForm, "brand.noticeEmail")}
                  onChange={(e: any) => setContractField("brand.noticeEmail", e.target.value)}
                />
                <FloatingLabelInput
                  id="brand-notice-phone"
                  label="Notice Phone"
                  value={getAtPath(contractForm, "brand.noticePhone")}
                  onChange={(e: any) => setContractField("brand.noticePhone", e.target.value)}
                />
                <TextArea
                  id="brand-billing-address"
                  label="Billing Address"
                  value={getAtPath(contractForm, "brand.billingAddress")}
                  onChange={(e: any) => setContractField("brand.billingAddress", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Influencer</div>
                <FloatingLabelInput
                  id="inf-legal-name"
                  label="Influencer Legal Name"
                  value={getAtPath(contractForm, "influencer.legalName")}
                  onChange={(e: any) => setContractField("influencer.legalName", e.target.value)}
                  error={formErrors["influencer.legalName"]}
                />
                <FloatingLabelInput
                  id="inf-contact-name"
                  label="Contact Name"
                  value={getAtPath(contractForm, "influencer.contactName")}
                  onChange={(e: any) => setContractField("influencer.contactName", e.target.value)}
                />
                <FloatingLabelInput
                  id="inf-handle-url"
                  label="Posting Handle URL"
                  value={getAtPath(contractForm, "influencer.postingHandleUrl")}
                  onChange={(e: any) =>
                    setContractField("influencer.postingHandleUrl", e.target.value)
                  }
                />
                <FloatingLabelInput
                  id="inf-email"
                  label="Contact Email"
                  value={getAtPath(contractForm, "influencer.contactEmail")}
                  onChange={(e: any) => setContractField("influencer.contactEmail", e.target.value)}
                />
                <FloatingLabelInput
                  id="inf-phone"
                  label="Contact Phone"
                  value={getAtPath(contractForm, "influencer.contactPhone")}
                  onChange={(e: any) => setContractField("influencer.contactPhone", e.target.value)}
                />
                <FloatingLabelInput
                  id="inf-whatsapp"
                  label="WhatsApp"
                  value={getAtPath(contractForm, "influencer.whatsApp")}
                  onChange={(e: any) => setContractField("influencer.whatsApp", e.target.value)}
                />
                <TextArea
                  id="inf-address"
                  label="Address"
                  value={getAtPath(contractForm, "influencer.address")}
                  onChange={(e: any) => setContractField("influencer.address", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </SidebarSection>

          <SidebarSection title="Campaign Overview" icon={<Info className="h-4 w-4" />}>
            <div className="space-y-4">
              <FloatingLabelInput
                id="campaign-title"
                label="Campaign Title / ID"
                value={getAtPath(contractForm, "campaign.campaignTitleOrId")}
                onChange={(e: any) => setContractField("campaign.campaignTitleOrId", e.target.value)}
                error={formErrors["campaign.campaignTitleOrId"]}
              />
              <TextArea
                id="campaign-products-services"
                label="Products / Services Covered"
                value={getAtPath(contractForm, "campaign.productsServicesCovered")}
                onChange={(e: any) =>
                  setContractField("campaign.productsServicesCovered", e.target.value)
                }
                rows={3}
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FloatingLabelInput
                  id="campaign-territory"
                  label="Territory / Target Country"
                  value={getAtPath(contractForm, "campaign.territoryTargetCountry")}
                  onChange={(e: any) =>
                    setContractField("campaign.territoryTargetCountry", e.target.value)
                  }
                />
                <div data-field-error={!!formErrors.requestedEffDate}>
                  <LabelWithInfo text="Requested Effective Date" />
                  <input
                    type="date"
                    value={requestedEffDate}
                    min={todayStr}
                    onChange={(e) => {
                      setRequestedEffDate(e.target.value);
                      setContractField("campaign.effectiveDate", e.target.value);
                    }}
                    className={`mt-1 h-[44px] w-full rounded-lg border-2 px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A35] ${formErrors.requestedEffDate ? "border-red-500" : "border-gray-200"
                      }`}
                  />
                  {formErrors.requestedEffDate ? (
                    <div className="mt-1 text-xs text-red-600">{formErrors.requestedEffDate}</div>
                  ) : null}
                </div>
              </div>
              <div>
                <LabelWithInfo text="Timezone" />
                <ReactSelect
                  instanceId="timezone-select"
                  inputId="timezone-select-input"
                  isLoading={listsLoading}
                  options={tzOptions}
                  value={tzOptions.find((o) => o.value === requestedEffTz) || null}
                  onChange={(opt: any) => setRequestedEffTz(opt?.value || DEFAULT_TIMEZONE)}
                  placeholder="Select timezone"
                  styles={buildReactSelectStyles()}
                />
              </div>
            </div>
          </SidebarSection>

          <SidebarSection title="Deliverables & Publication Timeline" icon={<ClipboardText className="h-4 w-4" />}>
            <div className="space-y-4">
              {formErrors["scheduleA.deliverables"] ? (
                <div className="text-xs text-red-600">{formErrors["scheduleA.deliverables"]}</div>
              ) : null}

              {deliverables.map((row, index) => (
                <div key={row.id} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-gray-800">
                      Deliverable #{index + 1}
                    </div>
                    {deliverables.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setDeliverables((prev) => prev.filter((item) => item.id !== row.id))
                        }
                        className="text-xs text-gray-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <NumberInputTop
                      id={`deliverable-sr-${row.id}`}
                      label="Sr. No."
                      value={String(index + 1)}
                      onChange={() => undefined}
                      disabled
                    />
                    <FloatingLabelInput
                      id={`deliverable-platform-${row.id}`}
                      label="Platform / Handle"
                      value={row.platformHandle}
                      onChange={(e: any) =>
                        setDeliverables((prev) =>
                          prev.map((item) =>
                            item.id === row.id
                              ? { ...item, platformHandle: e.target.value }
                              : item
                          )
                        )
                      }
                    />
                    <NumberInputTop
                      id={`deliverable-qty-${row.id}`}
                      label="Qty"
                      value={row.qty}
                      onChange={(value: string) =>
                        setDeliverables((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, qty: value } : item
                          )
                        )
                      }
                    />
                  </div>

                  <FloatingLabelInput
                    id={`deliverable-format-${row.id}`}
                    label="Deliverable Format"
                    value={row.deliverableFormat}
                    onChange={(e: any) =>
                      setDeliverables((prev) =>
                        prev.map((item) =>
                          item.id === row.id
                            ? { ...item, deliverableFormat: e.target.value }
                            : item
                        )
                      )
                    }
                  />

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <LabelWithInfo text="Draft Due" />
                      <input
                        type="date"
                        value={row.draftDue}
                        min={todayStr}
                        onChange={(e) =>
                          setDeliverables((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, draftDue: e.target.value } : item
                            )
                          )
                        }
                        className="mt-1 h-[44px] w-full rounded-lg border-2 border-gray-200 px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A35]"
                      />
                    </div>
                    <div>
                      <LabelWithInfo text="Live Date" />
                      <input
                        type="date"
                        value={row.liveDate}
                        min={todayStr}
                        onChange={(e) =>
                          setDeliverables((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, liveDate: e.target.value } : item
                            )
                          )
                        }
                        className="mt-1 h-[44px] w-full rounded-lg border-2 border-gray-200 px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A35]"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-dashed border-gray-300 text-gray-700"
                onClick={() =>
                  setDeliverables((prev) => [
                    ...prev,
                    {
                      ...createDefaultScheduleDeliverable(),
                      srNo: prev.length + 1,
                    },
                  ])
                }
              >
                + Add another deliverable
              </Button>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <TextArea
                  id="minimum-video-specs"
                  label="Minimum Video Specs"
                  value={getAtPath(contractForm, "scheduleA.minimumVideoSpecs")}
                  onChange={(e: any) =>
                    setContractField("scheduleA.minimumVideoSpecs", e.target.value)
                  }
                  rows={3}
                />
                <TextArea
                  id="mandatory-tags"
                  label="Mandatory Tags / Mentions / Links / Codes"
                  value={getAtPath(
                    contractForm,
                    "scheduleA.mandatoryTagsMentionsLinksCodes"
                  )}
                  onChange={(e: any) =>
                    setContractField(
                      "scheduleA.mandatoryTagsMentionsLinksCodes",
                      e.target.value
                    )
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Checkbox
                  id="pre-shoot-script-required"
                  label="Pre-Shoot Script Required"
                  checked={Boolean(
                    getAtPath(contractForm, "scheduleA.preShootScriptRequired", false)
                  )}
                  onChange={(checked: boolean) =>
                    setContractField("scheduleA.preShootScriptRequired", checked)
                  }
                />
                <div>
                  <LabelWithInfo text="Pre-Shoot Script Due" />
                  <input
                    type="date"
                    value={getAtPath(contractForm, "scheduleA.preShootScriptDue")}
                    min={todayStr}
                    onChange={(e) =>
                      setContractField("scheduleA.preShootScriptDue", e.target.value)
                    }
                    className="mt-1 h-[44px] w-full rounded-lg border-2 border-gray-200 px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A35]"
                  />
                </div>
                <NumberInputTop
                  id="pre-shoot-review-days"
                  label="Script Review Business Days"
                  value={getAtPath(contractForm, "scheduleA.preShootScriptReviewBusinessDays")}
                  onChange={(value: string) =>
                    setContractField("scheduleA.preShootScriptReviewBusinessDays", value)
                  }
                  error={formErrors["scheduleA.preShootScriptReviewBusinessDays"]}
                />
              </div>
            </div>
          </SidebarSection>

          <SidebarSection title="Review, Revisions & Reshoots" icon={<PenNib className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <NumberInputTop
                id="included-revision-rounds"
                label="Included Revision Rounds"
                value={getAtPath(contractForm, "scheduleA.review.includedRevisionRounds")}
                onChange={(value: string) =>
                  setContractField("scheduleA.review.includedRevisionRounds", value)
                }
                error={formErrors["scheduleA.review.includedRevisionRounds"]}
              />
              <FloatingLabelInput
                id="additional-revision-fee"
                label="Additional Revision Fee"
                value={getAtPath(contractForm, "scheduleA.review.additionalRevisionFee")}
                onChange={(e: any) =>
                  setContractField("scheduleA.review.additionalRevisionFee", e.target.value)
                }
              />
              <FloatingLabelInput
                id="reshoot-obligation"
                label="Reshoot Obligation"
                value={getAtPath(contractForm, "scheduleA.review.reshootObligation")}
                onChange={(e: any) =>
                  setContractField("scheduleA.review.reshootObligation", e.target.value)
                }
              />
              <FloatingLabelInput
                id="reshoot-fee"
                label="Reshoot Fee"
                value={getAtPath(contractForm, "scheduleA.review.reshootFee")}
                onChange={(e: any) =>
                  setContractField("scheduleA.review.reshootFee", e.target.value)
                }
              />
              <FloatingLabelInput
                id="minimum-live-period"
                label="Minimum Live Period"
                value={getAtPath(contractForm, "scheduleA.review.minimumLivePeriod")}
                onChange={(e: any) =>
                  setContractField("scheduleA.review.minimumLivePeriod", e.target.value)
                }
              />
            </div>
          </SidebarSection>

          <SidebarSection title="Commercial Terms" icon={<FileText className="h-4 w-4" />}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <NumberInputTop
                  id="total-campaign-fee"
                  label="Total Campaign Fee"
                  value={getAtPath(contractForm, "scheduleA.commercial.totalCampaignFee")}
                  onChange={(value: string) =>
                    setContractField("scheduleA.commercial.totalCampaignFee", value)
                  }
                  error={formErrors["scheduleA.commercial.totalCampaignFee"]}
                />
                <div data-field-error={!!formErrors["scheduleA.commercial.currency"]}>
                  <LabelWithInfo text="Currency" />
                  <ReactSelect
                    instanceId="currency-select"
                    inputId="currency-select-input"
                    isLoading={listsLoading}
                    options={currencyOptions}
                    value={
                      currencyOptions.find(
                        (o) => o.value === getAtPath(contractForm, "scheduleA.commercial.currency")
                      ) || null
                    }
                    onChange={(opt: any) =>
                      setContractField("scheduleA.commercial.currency", opt?.value || "")
                    }
                    placeholder="Select currency"
                    styles={buildReactSelectStyles({
                      hasError: !!formErrors["scheduleA.commercial.currency"],
                    })}
                  />
                  {formErrors["scheduleA.commercial.currency"] ? (
                    <div className="mt-1 text-xs text-red-600">
                      {formErrors["scheduleA.commercial.currency"]}
                    </div>
                  ) : null}
                </div>
              </div>

              <SelectWithInfo
                id="milestone-structure"
                label="Platform Milestone Payment Structure"
                value={getAtPath(contractForm, "scheduleA.commercial.platformMilestonePaymentStructure")}
                onChange={(e: any) =>
                  setContractField(
                    "scheduleA.commercial.platformMilestonePaymentStructure",
                    e.target.value
                  )
                }
                options={MILESTONE_OPTIONS}
              />

              <FloatingLabelInput
                id="commercial-custom-split"
                label="Custom Split"
                value={getAtPath(contractForm, "scheduleA.commercial.customSplit")}
                onChange={(e: any) =>
                  setContractField("scheduleA.commercial.customSplit", e.target.value)
                }
              />

              <TextArea
                id="advance-payment-trigger"
                label="Advance Payment Trigger"
                value={getAtPath(contractForm, "scheduleA.commercial.advancePaymentTrigger")}
                onChange={(e: any) =>
                  setContractField(
                    "scheduleA.commercial.advancePaymentTrigger",
                    e.target.value
                  )
                }
                rows={2}
              />
              <TextArea
                id="remaining-payment-trigger"
                label="Remaining Payment Trigger"
                value={getAtPath(contractForm, "scheduleA.commercial.remainingPaymentTrigger")}
                onChange={(e: any) =>
                  setContractField(
                    "scheduleA.commercial.remainingPaymentTrigger",
                    e.target.value
                  )
                }
                rows={2}
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FloatingLabelInput
                  id="processor-fees-borne-by"
                  label="Payment Processor Fees Borne By"
                  value={getAtPath(contractForm, "scheduleA.commercial.paymentProcessorFeesBorneBy")}
                  onChange={(e: any) =>
                    setContractField(
                      "scheduleA.commercial.paymentProcessorFeesBorneBy",
                      e.target.value
                    )
                  }
                />
                <FloatingLabelInput
                  id="processor-fees-notes"
                  label="Payment Processor Fee Notes"
                  value={getAtPath(contractForm, "scheduleA.commercial.paymentProcessorFeesNotes")}
                  onChange={(e: any) =>
                    setContractField(
                      "scheduleA.commercial.paymentProcessorFeesNotes",
                      e.target.value
                    )
                  }
                />
              </div>
              <TextArea
                id="lane-a-marketplace-fee-note"
                label="Lane A Marketplace Fee Note"
                value={getAtPath(contractForm, "scheduleA.commercial.laneAMarketplaceFeeNote")}
                onChange={(e: any) =>
                  setContractField(
                    "scheduleA.commercial.laneAMarketplaceFeeNote",
                    e.target.value
                  )
                }
                rows={3}
              />
            </div>
          </SidebarSection>

          <SidebarSection title="Raw Files & Reporting" icon={<ClipboardText className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FloatingLabelInput
                id="raw-source-file-delivery"
                label="Raw / Source File Delivery"
                value={getAtPath(contractForm, "scheduleA.rawFiles.rawSourceFileDelivery")}
                onChange={(e: any) =>
                  setContractField("scheduleA.rawFiles.rawSourceFileDelivery", e.target.value)
                }
              />
              <FloatingLabelInput
                id="raw-files-format"
                label="Format"
                value={getAtPath(contractForm, "scheduleA.rawFiles.format")}
                onChange={(e: any) =>
                  setContractField("scheduleA.rawFiles.format", e.target.value)
                }
              />
              <div>
                <LabelWithInfo text="Delivery Due" />
                <input
                  type="date"
                  value={getAtPath(contractForm, "scheduleA.rawFiles.deliveryDue")}
                  min={todayStr}
                  onChange={(e) => setContractField("scheduleA.rawFiles.deliveryDue", e.target.value)}
                  className="mt-1 h-[44px] w-full rounded-lg border-2 border-gray-200 px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A35]"
                />
              </div>
              <div>
                <LabelWithInfo text="Analytics Reporting Deadline" />
                <input
                  type="date"
                  value={getAtPath(contractForm, "scheduleA.rawFiles.analyticsReportingDeadline")}
                  min={todayStr}
                  onChange={(e) =>
                    setContractField("scheduleA.rawFiles.analyticsReportingDeadline", e.target.value)
                  }
                  className="mt-1 h-[44px] w-full rounded-lg border-2 border-gray-200 px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A35]"
                />
              </div>
              <TextArea
                id="analytics-reporting-items"
                label="Analytics Reporting Items"
                value={getAtPath(contractForm, "scheduleA.rawFiles.analyticsReportingItems")}
                onChange={(e: any) =>
                  setContractField("scheduleA.rawFiles.analyticsReportingItems", e.target.value)
                }
                rows={3}
              />
            </div>
          </SidebarSection>

          <SidebarSection title="Shipping & Returns" icon={<Info className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SelectWithInfo
                id="shipping-applicable"
                label="Product Shipping Applicable"
                value={getAtPath(contractForm, "scheduleA.shipping.productShippingApplicable")}
                onChange={(e: any) =>
                  setContractField("scheduleA.shipping.productShippingApplicable", e.target.value)
                }
                options={SHIPPING_APPLICABLE_OPTIONS}
              />
              <SelectWithInfo
                id="product-returnable"
                label="Product Returnable"
                value={getAtPath(contractForm, "scheduleA.shipping.productReturnable")}
                onChange={(e: any) =>
                  setContractField("scheduleA.shipping.productReturnable", e.target.value)
                }
                options={RETURNABLE_OPTIONS}
              />
              <FloatingLabelInput
                id="ship-to-name"
                label="Ship-To Name"
                value={getAtPath(contractForm, "scheduleA.shipping.shipToName")}
                onChange={(e: any) =>
                  setContractField("scheduleA.shipping.shipToName", e.target.value)
                }
              />
              <FloatingLabelInput
                id="ship-to-phone"
                label="Ship-To Phone"
                value={getAtPath(contractForm, "scheduleA.shipping.shipToPhone")}
                onChange={(e: any) =>
                  setContractField("scheduleA.shipping.shipToPhone", e.target.value)
                }
              />
              <TextArea
                id="ship-to-address"
                label="Ship-To Address"
                value={getAtPath(contractForm, "scheduleA.shipping.shipToAddress")}
                onChange={(e: any) =>
                  setContractField("scheduleA.shipping.shipToAddress", e.target.value)
                }
                rows={3}
              />
              <div>
                <LabelWithInfo text="Product Receipt Confirmation Deadline" />
                <input
                  type="date"
                  value={getAtPath(
                    contractForm,
                    "scheduleA.shipping.productReceiptConfirmationDeadline"
                  )}
                  min={todayStr}
                  onChange={(e) =>
                    setContractField(
                      "scheduleA.shipping.productReceiptConfirmationDeadline",
                      e.target.value
                    )
                  }
                  className="mt-1 h-[44px] w-full rounded-lg border-2 border-gray-200 px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A35]"
                />
              </div>
              <FloatingLabelInput
                id="return-window-method"
                label="Return Window / Method"
                value={getAtPath(contractForm, "scheduleA.shipping.returnWindowMethod")}
                onChange={(e: any) =>
                  setContractField("scheduleA.shipping.returnWindowMethod", e.target.value)
                }
              />
              <TextArea
                id="risk-of-loss-notes"
                label="Risk of Loss Notes"
                value={getAtPath(contractForm, "scheduleA.shipping.riskOfLossNotes")}
                onChange={(e: any) =>
                  setContractField("scheduleA.shipping.riskOfLossNotes", e.target.value)
                }
                rows={3}
              />
            </div>
          </SidebarSection>

          <SidebarSection title="Usage Rights" icon={<SealCheck className="h-4 w-4" />}>
            <div className="space-y-4">
              <div className="space-y-3">
                {contractForm.scheduleA.usageRights.rows.map((row) => (
                  <div key={row.id} className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-gray-800">{row.usageRight}</div>
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(e) =>
                          setContractField(
                            "scheduleA.usageRights.rows",
                            contractForm.scheduleA.usageRights.rows.map((item) =>
                              item.id === row.id ? { ...item, selected: e.target.checked } : item
                            )
                          )
                        }
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <FloatingLabelInput
                        id={`usage-duration-${row.id}`}
                        label="Duration"
                        value={row.duration}
                        onChange={(e: any) =>
                          setContractField(
                            "scheduleA.usageRights.rows",
                            contractForm.scheduleA.usageRights.rows.map((item) =>
                              item.id === row.id ? { ...item, duration: e.target.value } : item
                            )
                          )
                        }
                      />
                      <FloatingLabelInput
                        id={`usage-territory-${row.id}`}
                        label="Territory / Notes"
                        value={row.territoryNotes}
                        onChange={(e: any) =>
                          setContractField(
                            "scheduleA.usageRights.rows",
                            contractForm.scheduleA.usageRights.rows.map((item) =>
                              item.id === row.id
                                ? { ...item, territoryNotes: e.target.value }
                                : item
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <SelectWithInfo
                  id="attribution-requirement"
                  label="Attribution Requirement"
                  value={getAtPath(contractForm, "scheduleA.usageRights.attributionRequirement")}
                  onChange={(e: any) =>
                    setContractField("scheduleA.usageRights.attributionRequirement", e.target.value)
                  }
                  options={ATTRIBUTION_OPTIONS}
                />
                <SelectWithInfo
                  id="editing-rights"
                  label="Editing Rights"
                  value={getAtPath(contractForm, "scheduleA.usageRights.editingRights")}
                  onChange={(e: any) =>
                    setContractField("scheduleA.usageRights.editingRights", e.target.value)
                  }
                  options={EDITING_RIGHTS_OPTIONS}
                />
              </div>
              <FloatingLabelInput
                id="attribution-text"
                label="Attribution Text"
                value={getAtPath(contractForm, "scheduleA.usageRights.attributionText")}
                onChange={(e: any) =>
                  setContractField("scheduleA.usageRights.attributionText", e.target.value)
                }
              />
              <TextArea
                id="music-stock-asset-responsibility"
                label="Music / Stock Asset Responsibility"
                value={getAtPath(
                  contractForm,
                  "scheduleA.usageRights.musicStockAssetResponsibility"
                )}
                onChange={(e: any) =>
                  setContractField(
                    "scheduleA.usageRights.musicStockAssetResponsibility",
                    e.target.value
                  )
                }
                rows={3}
              />
            </div>
          </SidebarSection>

          <SidebarSection title="Compliance & Brand Safety" icon={<Info className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <TextArea
                id="creative-brief-mandatory-talking-points"
                label="Creative Brief / Mandatory Talking Points"
                value={getAtPath(
                  contractForm,
                  "scheduleA.compliance.creativeBriefMandatoryTalkingPoints"
                )}
                onChange={(e: any) =>
                  setContractField(
                    "scheduleA.compliance.creativeBriefMandatoryTalkingPoints",
                    e.target.value
                  )
                }
                rows={4}
              />
              <TextArea
                id="restricted-statements"
                label="Restricted Statements"
                value={getAtPath(contractForm, "scheduleA.compliance.restrictedStatements")}
                onChange={(e: any) =>
                  setContractField("scheduleA.compliance.restrictedStatements", e.target.value)
                }
                rows={4}
              />
            </div>
          </SidebarSection>

          <SidebarSection title="Exclusivity & Morals" icon={<SealCheck className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FloatingLabelInput
                id="competitor-blackout"
                label="Competitor Blackout"
                value={getAtPath(contractForm, "scheduleA.exclusivity.competitorBlackout")}
                onChange={(e: any) =>
                  setContractField("scheduleA.exclusivity.competitorBlackout", e.target.value)
                }
              />
              <FloatingLabelInput
                id="category-competitor-list"
                label="Category / Competitor List"
                value={getAtPath(contractForm, "scheduleA.exclusivity.categoryCompetitorList")}
                onChange={(e: any) =>
                  setContractField(
                    "scheduleA.exclusivity.categoryCompetitorList",
                    e.target.value
                  )
                }
              />
              <FloatingLabelInput
                id="blackout-period"
                label="Blackout Period"
                value={getAtPath(contractForm, "scheduleA.exclusivity.blackoutPeriod")}
                onChange={(e: any) =>
                  setContractField("scheduleA.exclusivity.blackoutPeriod", e.target.value)
                }
              />
              <SelectWithInfo
                id="optional-morals-clause"
                label="Optional Morals Clause"
                value={getAtPath(contractForm, "scheduleA.exclusivity.optionalMoralsClause")}
                onChange={(e: any) =>
                  setContractField(
                    "scheduleA.exclusivity.optionalMoralsClause",
                    e.target.value
                  )
                }
                options={MORALS_OPTIONS}
              />
            </div>
          </SidebarSection>

          <SidebarSection title="Cancellation & Refunds" icon={<Info className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <TextArea
                id="kill-fee-or-prorata"
                label="Kill Fee / Pro-Rata"
                value={getAtPath(contractForm, "scheduleA.cancellation.killFeeOrProrata")}
                onChange={(e: any) =>
                  setContractField("scheduleA.cancellation.killFeeOrProrata", e.target.value)
                }
                rows={3}
              />
              <TextArea
                id="refund-of-unearned-advance"
                label="Refund of Unearned Advance"
                value={getAtPath(contractForm, "scheduleA.cancellation.refundOfUnearnedAdvance")}
                onChange={(e: any) =>
                  setContractField(
                    "scheduleA.cancellation.refundOfUnearnedAdvance",
                    e.target.value
                  )
                }
                rows={3}
              />
            </div>
          </SidebarSection>

          <SidebarSection title="Dispute & Notices" icon={<FileText className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FloatingLabelInput
                id="governing-law"
                label="Governing Law"
                value={getAtPath(contractForm, "scheduleA.dispute.governingLaw")}
                onChange={(e: any) =>
                  setContractField("scheduleA.dispute.governingLaw", e.target.value)
                }
              />
              <SelectWithInfo
                id="dispute-resolution-method"
                label="Dispute Resolution Method"
                value={getAtPath(contractForm, "scheduleA.dispute.disputeResolutionMethod")}
                onChange={(e: any) =>
                  setContractField(
                    "scheduleA.dispute.disputeResolutionMethod",
                    e.target.value
                  )
                }
                options={DISPUTE_OPTIONS}
              />
              <FloatingLabelInput
                id="dispute-venue"
                label="Venue"
                value={getAtPath(contractForm, "scheduleA.dispute.disputeVenue")}
                onChange={(e: any) =>
                  setContractField("scheduleA.dispute.disputeVenue", e.target.value)
                }
              />
              <FloatingLabelInput
                id="arbitration-seat"
                label="Arbitration Seat"
                value={getAtPath(contractForm, "scheduleA.dispute.arbitrationSeat")}
                onChange={(e: any) =>
                  setContractField("scheduleA.dispute.arbitrationSeat", e.target.value)
                }
              />
              <FloatingLabelInput
                id="attorneys-fees"
                label="Attorneys’ Fees"
                value={getAtPath(contractForm, "scheduleA.dispute.attorneysFees")}
                onChange={(e: any) =>
                  setContractField("scheduleA.dispute.attorneysFees", e.target.value)
                }
              />
            </div>
          </SidebarSection>

          <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-wrap justify-end gap-3 border-t border-gray-200 bg-white/95 p-6 backdrop-blur">
            <Button
              onClick={handleGeneratePreview}
              className="border-2 border-black bg-white px-6 text-black hover:bg-gray-50 disabled:opacity-60"
              disabled={isPreviewLoading || isSendLoading || isUpdateLoading}
            >
              {isPreviewLoading ? (
                <>
                  <span className="mr-2 animate-spin">⏳</span> Generating…
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-5 w-5" /> Preview
                </>
              )}
            </Button>

            {panelMode === "send" ? (
              <Button
                onClick={handleSendContract}
                className="bg-gradient-to-r from-[#FFA135] to-[#FF7236] px-6 text-white hover:from-[#FF7236] hover:to-[#FFA135] disabled:opacity-60"
                disabled={!pdfUrl || isSendLoading || isPreviewLoading || isUpdateLoading}
              >
                {isSendLoading ? (
                  <>
                    <span className="mr-2 animate-spin">⏳</span> Sending…
                  </>
                ) : (
                  <>
                    <PaperPlaneTilt className="mr-2 h-5 w-5" /> Send Contract
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleEditContract}
                className="bg-gradient-to-r from-[#FFA135] to-[#FF7236] px-6 text-white hover:from-[#FF7236] hover:to-[#FFA135] disabled:opacity-60"
                disabled={!pdfUrl || isUpdateLoading || isPreviewLoading || isSendLoading}
              >
                {isUpdateLoading ? (
                  <>
                    <span className="mr-2 animate-spin">⏳</span> Updating…
                  </>
                ) : (
                  updateBtnLabel
                )}
              </Button>
            )}
          </div>
        </ContractSidebar>

        <SignatureModal
          isOpen={signOpen}
          onClose={() => {
            setSignOpen(false);
            setSignTargetMeta(null);
          }}
          onSigned={async (sigDataUrl: string) => {
            if (!signTargetMeta?.contractId) return;
            try {
              await post("/contract/sign", {
                contractId: signTargetMeta.contractId,
                role: "brand",
                name: signerName,
                email: signerEmail,
                signatureImageDataUrl: sigDataUrl,
              });
              toast({ icon: "success", title: "Signed", text: "Signature recorded." });
              setSignOpen(false);
              setSignTargetMeta(null);
              fetchApplicants(debouncedSearch);
              loadMetaCache(influencers);
            } catch (e: any) {
              toast({
                icon: "error",
                title: "Sign failed",
                text:
                  e?.response?.data?.message ||
                  e?.message ||
                  "Could not sign contract.",
              });
            }
          }}
        />
      </div>
    </TooltipProvider>
  );
}

/* ===============================================================
   Support UI components
   =============================================================== */
const LoadingSkeleton = ({ rows }: { rows: number }) => (
  <div className="p-6 space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
      >
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40 rounded bg-gray-200" />
            <Skeleton className="h-3 w-28 rounded bg-gray-200" />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-full bg-gray-200" />
          <Skeleton className="h-8 w-20 rounded-full bg-gray-200" />
          <Skeleton className="h-8 w-8 rounded-md bg-gray-200" />
          <Skeleton className="h-8 w-8 rounded-md bg-gray-200" />
        </div>
      </div>
    ))}
  </div>
);

const ErrorMessage: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <p className="p-6 text-center text-red-600">{children}</p>;

export function FloatingLabelInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  error,
  info,
  ...props
}: any) {
  const [focused, setFocused] = useState(false);
  const hasValue = value !== "" && value !== undefined && value !== null;
  return (
    <div className="relative" data-field-error={!!error}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full h-[60px] px-4 pt-5 pb-1.5 border-2 rounded-lg text-sm transition-all duration-200 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A35] focus-visible:ring-offset-1 focus-visible:ring-offset-white ${error ? "border-red-500" : "border-gray-200 focus:border-[#FF8A35]"
          } peer`}
        placeholder=" "
        {...props}
      />
      <label
        htmlFor={id}
        className={`absolute left-4 transition-all duration-200 pointer-events-none inline-flex items-center gap-1 ${focused || hasValue
          ? "top-1.5 text-[11px] text-black font-medium"
          : "top-1/2 -translate-y-1/2 text-sm text-gray-500"
          }`}
      >
        <span>{label}</span>
        {info ? (
          <span className="pointer-events-auto">
            <InfoTip text={String(info)} />
          </span>
        ) : null}
      </label>
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </div>
  );
}

export function Select({
  id,
  label,
  value,
  onChange,
  options,
  disabled = false,
  error,
  info,
}: any) {
  const flat = (
    Array.isArray(options[0]) ? (options as any).flat() : (options as any)
  ) as { value: string; label: string }[];
  return (
    <div className="space-y-1.5" data-field-error={!!error}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-700 inline-flex items-center gap-1"
      >
        <span>{label}</span>
        {info ? <InfoTip text={String(info)} /> : null}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full h-[44px] px-3 border-2 rounded-lg text-sm focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A35] focus-visible:ring-offset-1 focus-visible:ring-offset-white ${disabled
          ? "opacity-60 cursor-not-allowed border-gray-200"
          : error
            ? "border-red-500"
            : "border-gray-200 focus:border-[#FF8A35]"
          }`}
      >
        {flat.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}

export function SelectWithInfo({
  id,
  label,
  info,
  value,
  onChange,
  options,
  disabled = false,
  error,
}: any) {
  return (
    <div className="space-y-1.5" data-field-error={!!error}>
      <Select
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        options={options}
        disabled={disabled}
        error={error}
        info={info}
      />
    </div>
  );
}

export function NumberInput({
  id,
  label,
  value,
  onChange,
  error,
  info,
  ...props
}: any) {
  return (
    <div className="relative" data-field-error={!!error}>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-[60px] px-4 pt-5 pb-1.5 border-2 rounded-lg text-sm transition-all duration-200 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A35] focus-visible:ring-offset-1 focus-visible:ring-offset-white ${error ? "border-red-500" : "border-gray-200 focus:border-[#FF8A35]"
          }`}
        {...props}
      />
      <label
        htmlFor={id}
        className="absolute left-4 top-1.5 text-[11px] text-black font-medium pointer-events-none inline-flex items-center gap-1"
      >
        <span>{label}</span>
        {info ? (
          <span className="pointer-events-auto">
            <InfoTip text={String(info)} />
          </span>
        ) : null}
      </label>
      {error && (
        <div className="text-xs text-red-600 mt-1">{error}</div>
      )}
    </div>
  );
}

export function NumberInputTop({
  id,
  label,
  value,
  onChange,
  error,
  info,
  ...props
}: any) {
  return (
    <div className="space-y-1.5" data-field-error={!!error}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-700 inline-flex items-center gap-1 mb-1.5"
      >
        <span>{label}</span>
        {info ? <InfoTip text={String(info)} /> : null}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-[44px] px-3 border-2 rounded-lg text-sm transition-all duration-200 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A35] focus-visible:ring-offset-1 focus-visible:ring-offset-white ${error ? "border-red-500" : "border-gray-200 focus:border-[#FF8A35]"
          }`}
        {...props}
      />
      {error && (
        <div className="text-xs text-red-600">{error}</div>
      )}
    </div>
  );
}

export function Checkbox({
  id,
  label,
  checked,
  onChange,
  disabled = false,
}: any) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-2 text-sm ${disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.checked)
        }
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300"
      />
      <span className="text-gray-700">{label}</span>
    </label>
  );
}

export function PlatformSelector({
  platforms,
  onChange,
  disabled = false,
}: any) {
  const toggle = (p: string) => {
    if (disabled) return;
    const next = platforms.includes(p)
      ? platforms.filter((x: string) => x !== p)
      : [...platforms, p];
    onChange(next);
  };
  const opts = ["YouTube", "Instagram", "TikTok"];
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map((p) => {
        const active = platforms.includes(p);
        return (
          <button
            key={p}
            type="button"
            onClick={() => toggle(p)}
            disabled={disabled}
            aria-pressed={active}
            className={[
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border flex items-center gap-1",
              disabled ? "opacity-60 cursor-not-allowed" : "",
              active
                ? "border-transparent text-white shadow-sm"
                : "border-gray-300 text-gray-800 bg-white hover:bg-gray-50",
            ].join(" ")}
            style={
              active
                ? {
                  backgroundImage: `linear-gradient(to right, ${GRADIENT_FROM}, ${GRADIENT_TO})`,
                }
                : undefined
            }
          >
            {active && (
              <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            )}
            {p}
          </button>
        );
      })}
    </div>
  );
}

export function ChipInput({
  label,
  items,
  setItems,
  placeholder,
  validator,
  disabled = false,
  error,
}: any) {
  const [val, setVal] = useState("");

  const add = () => {
    if (disabled) return;
    const v = val.trim();
    if (!v) return;

    const parts = v
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const validParts = validator ? parts.filter((p) => validator(p)) : parts;
    if (!validParts.length) return;

    // items is the controlled prop from parent
    setItems([...(items as string[]), ...validParts]);
    setVal("");
  };

  const remove = (ix: number) => {
    if (disabled) return;
    setItems((items as string[]).filter((_: any, i: any) => i !== ix));
  };

  return (
    <div className="space-y-1.5" data-field-error={!!error}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {error && <div className="text-xs text-red-600">{error}</div>}
      </div>

      <div
        className={`
          flex items-start gap-2 rounded-lg border-2 p-2
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          ${error ? "border-red-500" : "border-gray-200"}
        `}
      >
        {/* Chips + input share this flex area */}
        <div className="flex flex-wrap gap-2 flex-1 min-w-0">
          {items.map((t: string, i: number) => (
            <span
              key={`${t}-${i}`}
              className="group inline-flex max-w-full items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs"
              title={t}
            >
              {/* text wraps / truncates nicely even for huge links */}
              <span className="block max-w-[180px] sm:max-w-[260px] break-all">
                {t}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                className="text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
                aria-label="Remove"
              >
                ×
              </button>
            </span>
          ))}

          {/* Input grows but doesn't disappear */}
          <input
            value={val}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setVal(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-[1_1_120px] min-w-[80px] border-0 outline-none text-sm bg-transparent"
          />
        </div>

        {/* Add button pinned on the right */}
        <button
          type="button"
          onClick={add}
          disabled={disabled}
          className="px-2 py-1 text-xs border rounded whitespace-nowrap disabled:opacity-60"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export function TextArea({
  id,
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  disabled = false,
  error,
}: any) {
  return (
    <div className="space-y-1.5" data-field-error={!!error}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2.5 border-2 rounded-lg text-sm focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A35] focus-visible:ring-offset-1 focus-visible:ring-offset-white ${disabled
          ? "opacity-60 cursor-not-allowed border-gray-200"
          : error
            ? "border-red-500"
            : "border-gray-200 focus:border-[#FF8A35]"
          }`}
      />
      {error && (
        <div className="text-xs text-red-600">{error}</div>
      )}
    </div>
  );
}

function ContractSidebar({
  isOpen,
  onClose,
  children,
  title = "Initiate Contract",
  subtitle = "New Agreement",
  previewUrl,
  onClosePreview,
}: any) {
  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"
        }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contract-title"
    >
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
          }`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full bg-white shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="relative h-36 overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(135deg, ${GRADIENT_FROM} 0%, ${GRADIENT_TO} 100%)`,
              clipPath: "polygon(0 0, 100% 0, 100% 65%, 0 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${GRADIENT_FROM} 0%, ${GRADIENT_TO} 100%)`,
              clipPath: "polygon(0 0, 100% 0, 100% 78%, 0 92%)",
            }}
          />
          <div className="relative z-10 p-6 text-white flex items-start justify-between h-full">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mt-1 shadow-sm">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <div
                  className="text-[11px] tracking-wide font-semibold uppercase/relaxed opacity-95 mb-1"
                  id="contract-title"
                >
                  {title}
                </div>
                <div className="text-2xl font-extrabold leading-tight">
                  {subtitle}
                </div>
              </div>
            </div>
            <button
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-all duration-150 hover:scale-110"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex h-[calc(100%-9rem)]">
          {previewUrl ? (
            <div className="w-full sm:w-1/2 p-6 border-r border-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </div>
                {onClosePreview && (
                  <button
                    type="button"
                    onClick={onClosePreview}
                    className="text-xs px-3 py-1 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Close preview
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-gray-50">
                <iframe
                  src={previewUrl}
                  width="100%"
                  height="100%"
                  className="border-0"
                  title="Contract PDF"
                />
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex w-1/2 p-6 items-center justify-center text-gray-400 select-none">
              <div className="text-center">
                <Eye className="mx-auto w-8 h-8 mb-2" />
                <div className="text-sm">
                  Generate a preview to see the PDF here
                </div>
              </div>
            </div>
          )}

          <div
            className={`${previewUrl ? "w-full sm:w-1/2" : "w-full"
              } h-full px-6 space-y-5 overflow-auto`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================
   Signature Modal
   ====================== */
function SignatureModal({
  isOpen,
  onClose,
  onSigned,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSigned: (signatureDataUrl: string) => Promise<void> | void;
}) {
  const [sigDataUrl, setSigDataUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ✅ NEW: prevent multiple clicks / double submits
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSigDataUrl("");
      setError("");
      setFileName("");
      setFileSize(null);
      setIsDragging(false);
      setIsSubmitting(false); // ✅ reset
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose(); // ✅ don't close while submitting
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  const formatSize = (size: number | null) => {
    if (!size) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFile = (file?: File | null) => {
    if (isSubmitting) return; // ✅ block changes during submit

    setError("");
    setIsDragging(false);
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);

    if (!/image\/(png|jpeg)/i.test(file.type)) {
      setSigDataUrl("");
      return setError("Please upload a PNG or JPG image.");
    }

    if (file.size > 50 * 1024) {
      setSigDataUrl("");
      return setError("Signature must be 50 KB or less.");
    }

    const reader = new FileReader();
    reader.onload = () => setSigDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!isOpen) return;
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
      handleFile(f || null);
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
  }, [isOpen, isSubmitting]); // ✅ include isSubmitting

  if (!isOpen) return null;

  const handleSignClick = async () => {
    if (isSubmitting) return; // ✅ double-click guard

    if (!sigDataUrl) {
      setError("Please select a signature image first.");
      return;
    }

    try {
      setIsSubmitting(true); // ✅ lock UI
      await onSigned(sigDataUrl);
      // ✅ parent will close modal on success; we don't force close here
    } finally {
      // ✅ if parent throws error and modal stays open, unlock
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] ${isSubmitting ? "pointer-events-none" : ""}`}
        onClick={() => !isSubmitting && onClose()} // ✅ prevent closing while submitting
      />

      <div className="relative z-[61] w-[96%] max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
        <div className="relative h-24">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${GRADIENT_FROM} 0%, ${GRADIENT_TO} 100%)`,
            }}
          />
          <div className="relative z-10 h-full px-5 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-sm font-semibold">
                ✍️
              </div>
              <div className="flex flex-col">
                <span className="font-semibold tracking-wide text-sm sm:text-base">
                  Sign as Brand
                </span>
                <span className="text-xs text-white/80">
                  Upload your official signature to finalize the document.
                </span>
              </div>
            </div>

            <button
              className={`w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-lg ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              onClick={() => !isSubmitting && onClose()}
              aria-label="Close"
              title="Close"
              disabled={isSubmitting as any}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-700">
              Upload your signature image{" "}
              <span className="font-semibold">(PNG/JPG, ≤ 50 KB)</span>. This
              will be embedded as your brand signature.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Best results with transparent PNG
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                💡 Tip: Use a dark pen on white paper, then scan or crop
                neatly.
              </span>
            </div>
          </div>

          <div
            ref={dropRef}
            className={`rounded-xl border-2 border-dashed p-5 text-center text-sm transition-all cursor-pointer select-none ${isDragging
              ? "border-orange-400 bg-orange-50/80 shadow-sm"
              : "border-gray-300 bg-gray-50 hover:bg-gray-100/80"
              }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <span className="text-lg">📁</span>
              </div>
              <div className="font-medium text-gray-800">
                {isDragging
                  ? "Drop your signature here"
                  : "Drag & drop your signature here"}
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
              disabled={isSubmitting} // ✅ disable file picker
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleFile(e.target.files?.[0])
              }
              className="block w-full text-xs sm:text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-black disabled:opacity-60 disabled:cursor-not-allowed"
            />

            <div className="flex justify-between items-center text-[11px] text-gray-500">
              <span>Allowed: PNG, JPG · Max size: 50 KB</span>
              {fileSize !== null && (
                <span>
                  Selected size:{" "}
                  <span className={fileSize > 50 * 1024 ? "text-red-600 font-medium" : ""}>
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

            {error && (
              <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {sigDataUrl && (
            <div className="border rounded-xl p-3 bg-gray-50 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-gray-700">
                    Signature preview
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting} // ✅ disable clear
                    onClick={() => {
                      if (isSubmitting) return;
                      setSigDataUrl("");
                      setFileName("");
                      setFileSize(null);
                      setError("");
                    }}
                    className="text-[11px] text-gray-500 hover:text-gray-700 underline disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex items-center justify-center rounded-lg border bg-white px-3 py-2">
                  <img
                    src={sigDataUrl}
                    alt="Signature preview"
                    className="max-h-14 object-contain"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-1 flex flex-col sm:flex-row justify-end gap-3">
          <Button
            variant="outline"
            className="text-gray-800 border-gray-300 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting} // ✅ disable cancel while submitting
          >
            Cancel
          </Button>

          <Button
            className="bg-gradient-to-r from-[#FFA135] to-[#FF7236] text-white hover:from-[#FF7236] hover:to-[#FFA135] shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleSignClick}
            disabled={!sigDataUrl || isSubmitting} // ✅ key line
          >
            {isSubmitting ? "Signing..." : "Sign & continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}


function SidebarSection({ title, children, icon }: any) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 shadow-sm p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FFA135] to-[#FF7236] text-white flex items-center justify-center">
            {icon}
          </div>
        )}
        <div className="font-semibold text-gray-800">{title}</div>
      </div>
      {children}
    </div>
  );
}



function LabelWithInfo({
  text,
  info,
}: {
  text: React.ReactNode;
  info?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
      {text}
      {info ? <InfoTip text={String(info)} /> : null}
    </span>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center"
          aria-label="Info"
        >
          <Info className="w-4 h-4 text-gray-500" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        className="max-w-xs text-sm leading-relaxed bg-gray-800 text-white"
      >
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

const BTN_GRAD =
  "bg-gradient-to-r from-[#FFA135] to-[#FF7236] text-white hover:from-[#FF7236] hover:to-[#FFA135] shadow-none";
const BTN_OUTLINE = "border-gray-300 text-black";
const BTN_BASE = "h-9 px-3 rounded-lg";
