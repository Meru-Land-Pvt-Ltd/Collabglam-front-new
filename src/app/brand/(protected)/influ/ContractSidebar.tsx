"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import api, { post } from "@/lib/api";
import { Button } from "@/components/ui/buttonComp";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Eye,
  FileText,
  Info,
  ClipboardText,
  PenNib,
  SealCheck,
  Signature,
  DownloadSimpleIcon,
  ArrowSquareInIcon,
} from "@phosphor-icons/react";
import { FloatingInput } from "@/components/ui/floatingInput";
import {
  FloatingMultiSelect,
  FloatingSelect,
  SelectItem,
} from "@/components/ui/selectComp";
import { LabeledTextarea } from "@/components/ui/textAreaComp";
import { FloatingDateInput } from "@/components/ui/date";
import { FloatingTagInput } from "@/components/ui/tagInput";
// import MinimalPdfPreview from "./MinimalPdfPreview";
import dynamic from "next/dynamic";
import SignatureModal from "./SignatureModal";
import { apigetSignatureExistance, apipostSignatureUpload } from "../../services/brandApi";
const MinimalPdfPreview = dynamic(() => import("@/components/ui/MinimalPdfPreview"), {
  ssr: false,
});
type PaymentType = "fixed_payment" | "milestone_based" | "product_gifting";
type ContractMeta = {
  _id: string;
  contractId: string;
  campaignId: string;
  status?: string;
  requestedEffectiveDate?: string | null;
  requestedEffectiveDateTimezone?: string | null;
  content?: any;
  flags?: Record<string, any>;
  statusFlags?: Record<string, any>;
  resendIteration?: number;
  audit?: Array<{ type?: string; details?: { reason?: string } }>;
};

type ContractMilestone = {
  id: string;
  milestoneName: string;
  paymentAmount: string;
  triggerEvent: string;
  dueDate: string;
};

type ScheduleADeliverable = {
  id: string;
  srNo: number;
  platform: string;
  handle: string;
  deliverableFormat: string;
  qty: string;
  draftRequired: boolean;
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
  brand: {
    legalName: string;
    contactPersonName: string;
    noticeEmail: string;
    noticePhone: string;
    billingAddress: string;
    brandPoc: string;
    brandPocDesignation: string;
  };
  influencer: {
    legalName: string;
    contactName: string;
    postingHandleUrl: string;
    contactEmail: string;
    contactPhone: string;
    whatsApp: string;
    address: string;
  };
  campaign: {
    productsServicesCovered: string;
    territoryTargetCountry: string;
    effectiveDate: string;
    campaignTitleOrId: string;
    paymentType: PaymentType;
  };
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
      paymentStructure: string;
      customSplit: string;
      advancePaymentTrigger: string;
      remainingPaymentTrigger: string;
      paymentProcessorFeesBorneBy: string;
      paymentProcessorFeesNotes: string;
      laneAMarketplaceFeeNote: string;
      milestones: ContractMilestone[];
      influencerBudget: number;
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

type CurrencyOption = { value: string; label: string; meta?: any };
type TzOption = { value: string; label: string; meta?: any };

type ContractSidebarExtractedProps = {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  brandId?: string | null;
  influencer?: any | null;
  campaignTitle?: string;
  campaignBudget?: number | null;
  campaignTimeline?: { startDate?: string | Date; endDate?: string | Date } | null;
  onSuccess?: () => void | Promise<void>;
  initialContract?: ContractMeta | null;
  forcedPaymentType?: PaymentType;
  // optional bulk support
  mode?: "single" | "bulk";
  bulkInfluencers?: any[];
};

const DEFAULT_TIMEZONE = "America/Los_Angeles";

const CONTRACT_STATUS = {
  REJECTED: "REJECTED",
} as const;

const PAYMENT_TYPE = {
  FIXED: "fixed_payment",
  MILESTONE: "milestone_based",
  GIFTING: "product_gifting",
} as const;

const CONTRACT_TYPE_LABELS: Record<PaymentType, string> = {
  fixed_payment: "Fixed Contract",
  milestone_based: "Milestone Contract",
  product_gifting: "Product Gifting Contract",
};
const YES_NO_BOOL_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const DELIVERABLE_FORMAT_OPTIONS = [
  { value: "Dedicated Video", label: "Dedicated Video" },
  { value: "Integrated Video", label: "Integrated Video" },
  { value: "Reel", label: "Reel" },
  { value: "Story Set", label: "Story Set" },
  { value: "Static Post", label: "Static Post" },
  { value: "UGC (Raw Files Only)", label: "UGC (Raw Files Only)" },
  { value: "Live Stream", label: "Live Stream" },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: "fixed_payment", label: "Fixed Payment" },
  { value: "milestone_based", label: "Milestone Based" },
  // { value: "product_gifting", label: "Product Gifting" },
];

const PAYMENT_STRUCTURE_OPTIONS = [
  { value: "50% advance / 50% balance", label: "50% advance / 50% balance" },
  { value: "100% upfront", label: "100% upfront" },
  { value: "100% on completion", label: "100% on completion" },
  { value: "Custom", label: "Custom" },
];

const PROCESSOR_FEE_OPTIONS = [
  { value: "Brand", label: "Brand" },
  { value: "Influencer", label: "Influencer" },
  { value: "Split Between Both", label: "Split Between Both" },
];

const RESHOOT_OPTIONS = [
  { value: "No reshoot required", label: "No reshoot required" },
  { value: "Only if brief not followed", label: "Only if brief not followed" },
  { value: "One reshoot included", label: "One reshoot included" },
];

const RAW_FILE_OPTIONS = [
  { value: "Not included", label: "Not included" },
  { value: "Included", label: "Included" },
];

const SHIPPING_APPLICABLE_OPTIONS = [
  { value: "No", label: "No" },
  { value: "Yes", label: "Yes" },
];

const RETURNABLE_OPTIONS = [
  { value: "Gift / keep product", label: "Gift / keep product" },
  { value: "Returnable loaner", label: "Returnable loaner" },
];

const ATTRIBUTION_OPTIONS = [
  { value: "Credit Required", label: "Credit Required" },
  { value: "No Attribution Required", label: "No Attribution Required" },
];

const EDITING_RIGHTS_OPTIONS = [
  { value: "Cropping / Resizing Only", label: "Cropping / Resizing Only" },
  {
    value: "Brand May Create Cutdowns / Clips",
    label: "Brand May Create Cutdowns / Clips",
  },
  { value: "No Edits Without Approval", label: "No Edits Without Approval" },
];

const MUSIC_RESPONSIBILITY_OPTIONS = [
  { value: "Brand Responsible", label: "Brand Responsible" },
  { value: "Influencer Responsible", label: "Influencer Responsible" },
  { value: "Custom Arrangement", label: "Custom Arrangement" },
];

const MORALS_OPTIONS = [
  { value: "Not Included", label: "Not Included" },
  { value: "Included", label: "Included" },
];

const DISPUTE_OPTIONS = [
  { value: "State / Federal Courts", label: "State / Federal Courts" },
  { value: "AAA Arbitration", label: "AAA Arbitration" },
  { value: "Other", label: "Other" },
];

const ATTORNEYS_FEES_OPTIONS = [
  {
    value: "Prevailing Party Recovers Fees",
    label: "Prevailing Party Recovers Fees",
  },
  { value: "Each Party Bears Own Fees", label: "Each Party Bears Own Fees" },
  { value: "Other", label: "Other" },
];

const SIDEBAR_TOOLTIPS = {
  brandLegalName:
    "Full registered legal name of the brand signing this agreement.",
  brandContactPerson:
    "Primary brand contact responsible for campaign coordination and approvals.",
  brandNoticeEmail:
    "Official email for notices, updates, and legal communication.",
  brandNoticePhone: "Phone number for urgent campaign or contract communication.",
  brandBillingAddress:
    "Official billing address used for invoicing and records.",
  brandPoc: "",
  brandPocDesignation: "",
  campaignTitle:
    "Internal or external campaign title / ID used to identify this agreement.",
  campaignProductsServices: "Products or services covered by this contract.",
  campaignTerritory:
    "Territory where content will be distributed or targeted.",
  requestedEffectiveDate:
    "Date the agreement is intended to become effective.",
  timezone:
    "Timezone used for the requested effective date and scheduling references.",

  platformHandle:
    "Social platform and creator handle where the content will be posted.",
  qty: "Number of content units for this deliverable.",
  deliverableFormat: "Content format required for this deliverable.",
  draftDue: "Deadline for draft submission.",
  liveDate: "Date the deliverable must go live.",
  minimumVideoSpecs:
    "Format, duration, resolution, or aspect-ratio requirements.",
  mandatoryTags:
    "Required mentions, hashtags, affiliate links, tracking links, or promo codes.",
  preShootScriptRequired:
    "Whether brand approval is required before filming.",
  preShootScriptDue: "Deadline for script submission.",
  preShootReviewDays:
    "How many business days the brand gets to review the script.",

  includedRevisionRounds:
    "Number of revision rounds included without extra charge.",
  additionalRevisionFee: "Fee charged for each extra revision round.",
  reshootObligation: "When a reshoot is required.",
  reshootFee: "Fee applicable when a reshoot is requested.",
  minimumLivePeriod: "Minimum time the content must stay live.",

  totalCampaignFee: "Total compensation for the influencer.",
  influencerBudget: "Total budget for influencer",
  currency: "Currency in which compensation is denominated.",
  paymentStructure: "How payment is split across milestones or stages.",
  customSplit: "Custom breakdown of the payment structure.",
  advancePaymentTrigger: "Condition that triggers advance payment.",
  remainingPaymentTrigger: "Condition that triggers the remaining payment.",
  processorFeesBorneBy: "Who bears payment processing fees.",
  processorFeesNotes: "Extra notes about processor fee treatment.",
  laneAMarketplaceFeeNote:
    "Marketplace fee wording included in the agreement.",

  rawSourceFileDelivery: "Whether raw or source files must be delivered.",
  rawFilesFormat: "Expected format for delivered raw/source files.",
  rawFilesDeliveryDue: "Deadline to provide raw/source files.",
  analyticsReportingDeadline:
    "Deadline for providing analytics after publishing.",
  analyticsReportingItems:
    "Specific performance metrics or reports required.",

  productShippingApplicable:
    "Whether this campaign includes shipment of product.",
  productReturnable: "Whether products are gifted or must be returned.",
  shipToName: "Name to receive the shipment.",
  shipToPhone: "Phone number for shipping coordination.",
  shipToAddress: "Shipping destination for campaign products.",
  productReceiptConfirmationDeadline:
    "Deadline for acknowledging product receipt.",
  returnWindowMethod: "Return timeline and method.",
  riskOfLossNotes:
    "Notes about delivery risk, damage, or responsibility.",

  grantedUsageRights:
    "Ways the brand is allowed to use the creator's content.",
  usageDuration: "Duration of granted usage rights.",
  usageTerritoryNotes:
    "Territory or limitations for the selected usage right.",
  attributionRequirement:
    "Whether creator attribution is required when content is reused.",
  editingRights: "Editing rights granted to the brand.",
  attributionText: "Specific attribution wording, if required.",
  musicStockAssetResponsibility:
    "Who is responsible for music / stock asset clearance.",

  creativeBrief:
    "Mandatory talking points, claims, and content instructions.",
  restrictedStatements:
    "Statements or claims the creator must avoid.",
  competitorBlackout:
    "Competitor blackout or exclusivity terms.",
  categoryCompetitorList:
    "Competitors or categories restricted during blackout.",
  blackoutPeriod: "Time period for exclusivity / blackout.",
  optionalMoralsClause:
    "Whether a morals / reputation clause is included.",

  killFeeOrProrata:
    "Cancellation compensation or prorated payment rules.",
  refundOfUnearnedAdvance:
    "Whether unearned advance amounts must be refunded.",

  governingLaw: "Jurisdiction whose law governs this agreement.",
  disputeResolutionMethod:
    "Method used to resolve disputes.",
  disputeVenue: "Venue for court proceedings, if applicable.",
  arbitrationSeat: "Seat/location of arbitration, if applicable.",
  attorneysFees:
    "How attorneys' fees are allocated in a dispute.",
} as const;

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
  if (typeof patch !== "object") return patch as T;

  const output: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
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

function normalizePaymentType(raw?: string | null): PaymentType {
  const v = String(raw || "").trim().toLowerCase();
  if (["fixed", "fixed_payment", "fixed-payment"].includes(v)) return PAYMENT_TYPE.FIXED;
  if (["milestone", "milestone_based", "milestone-based"].includes(v)) return PAYMENT_TYPE.MILESTONE;
  if (["gifting", "product_gifting", "product-gifting"].includes(v)) return PAYMENT_TYPE.GIFTING;
  return PAYMENT_TYPE.FIXED;
}

function createDefaultCommercialMilestone(index: number = 1): ContractMilestone {
  return {
    id: createRowId(),
    milestoneName: `Milestone ${index}`,
    paymentAmount: "",
    triggerEvent: "",
    dueDate: "",
  };
}

function defaultUsageRightsRows(): UsageRightsRow[] {
  return [
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
}

function createDefaultScheduleDeliverable(index: number = 1): ScheduleADeliverable {
  return {
    id: createRowId(),
    srNo: index,
    platform: "",
    handle: "",
    deliverableFormat: "",
    qty: "1",
    draftRequired: false,
    draftDue: "",
    liveDate: "",
  };
}

function createDefaultContractForm(): ContractFormState {
  return {
    brand: {
      legalName: "",
      contactPersonName: "",
      noticeEmail: "",
      noticePhone: "",
      billingAddress: "",
      brandPoc: "",
      brandPocDesignation: "",
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
      paymentType: PAYMENT_TYPE.FIXED,
    },
    scheduleA: {
      minimumVideoSpecs: "",
      preShootScriptRequired: false,
      preShootScriptDue: "",
      preShootScriptReviewBusinessDays: "",
      mandatoryTagsMentionsLinksCodes: "",
      review: {
        includedRevisionRounds: "",
        additionalRevisionFee: "",
        reshootObligation:
          "",
        reshootFee: "",
        minimumLivePeriod: "",
      },
      commercial: {
        totalCampaignFee: "",
        currency: "",
        paymentStructure: "",
        customSplit: "",
        advancePaymentTrigger: "",
        remainingPaymentTrigger: "",
        paymentProcessorFeesBorneBy: "",
        paymentProcessorFeesNotes: "",
        laneAMarketplaceFeeNote:
          "Unless expressly stated otherwise, 10% of the applicable Influencer compensation funded through the Platform is deducted from the Influencer payout and retained by CollabGlam; the Brand-funded campaign amount remains fixed.",
        milestones: [createDefaultCommercialMilestone()],
        influencerBudget: 0
      },
      rawFiles: {
        rawSourceFileDelivery: "",
        deliveryDue: "",
        format: "",
        analyticsReportingDeadline: "",
        analyticsReportingItems: "",
      },
      shipping: {
        productShippingApplicable: "",
        shipToName: "",
        shipToAddress: "",
        shipToPhone: "",
        productReceiptConfirmationDeadline: "",
        productReturnable: "",
        returnWindowMethod: "",
        riskOfLossNotes: "",
      },
      usageRights: {
        rows: defaultUsageRightsRows(),
        attributionRequirement: "",
        attributionText: "",
        editingRights: "",
        musicStockAssetResponsibility:
          "",
      },
      compliance: {
        creativeBriefMandatoryTalkingPoints: "",
        restrictedStatements: "",
      },
      exclusivity: {
        competitorBlackout: "",
        categoryCompetitorList: "",
        blackoutPeriod: "",
        optionalMoralsClause: "",
      },
      cancellation: {
        killFeeOrProrata: "",
        refundOfUnearnedAdvance:
          "",
      },
      dispute: {
        governingLaw: "",
        disputeResolutionMethod: "",
        disputeVenue: "",
        arbitrationSeat: "",
        attorneysFees: "",
      },
    },
  };
}

function toInputDate(v?: string | Date | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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

function csvToTags(raw: string) {
  return String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function tagsToCsv(tags: string[]) {
  return tags.join(", ");
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

function toast(opts: {
  icon: "success" | "error" | "info";
  title: string;
  text?: string;
}) {
  return Swal.fire({
    ...opts,
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
    background: "white",
    customClass: { popup: "rounded-lg border border-gray-200" },
  });
}
function extractBrandSignature(response: any) {
  const payload = response?.data ?? response ?? {};
  const message = String(payload?.message || "");

  // The record might be an object (from some endpoints) or the payload itself is the doc
  const record =
    payload?.data ||
    payload?.activeSignature ||
    payload?.brandSignature ||
    null;

  // ✅ _id is at the TOP LEVEL of payload (from GET /contract/signature/:brandId)
  // record?.signature is the data URL string — not an object with _id
  const signatureId =
    typeof payload?._id === "string" && payload._id
      ? payload._id
      : typeof record?._id === "string" && record._id
        ? record._id
        : "";

  // signature is also directly on payload
  const rawSignature =
    typeof payload?.signature === "string" && payload.signature
      ? payload.signature
      : typeof record?.signature === "string"
        ? record.signature
        : typeof record?.dataUrl === "string"
          ? record.dataUrl
          : typeof record?.image === "string"
            ? record.image
            : typeof record?.imageUrl === "string"
              ? record.imageUrl
              : typeof record?.signatureUrl === "string"
                ? record.signatureUrl
                : "";

  const src =
    rawSignature.trim().startsWith("<svg")
      ? `data:image/svg+xml;utf8,${encodeURIComponent(rawSignature)}`
      : rawSignature;

  const notFound =
    message.toLowerCase().includes("active brand signature not found") ||
    message.toLowerCase().includes("signature not found");

  console.log("extractBrandSignature →", { signatureId, hasRawSig: !!rawSignature, notFound });

  return {
    hasSignature: Boolean(rawSignature) && !notFound,
    src,
    signatureData: rawSignature,
    signatureId,
  };
}
export default function ContractSidebarExtracted({
  open,
  onClose,
  campaignId,
  brandId: brandIdProp = null,
  influencer = null,
  campaignTitle = "",
  campaignBudget = null,
  campaignTimeline = null,
  onSuccess,
  initialContract = null,
  forcedPaymentType,
  mode = "single",
  bulkInfluencers = [],
}: ContractSidebarExtractedProps) {
  const isBulkMode = mode === "bulk";
  const primaryInfluencer = isBulkMode ? bulkInfluencers?.[0] ?? null : influencer;
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [resolvedBrandId, setResolvedBrandId] = useState<string | null>(brandIdProp);
  const [currentContract, setCurrentContract] = useState<ContractMeta | null>(
    initialContract
  );
  const [requestedEffDate, setRequestedEffDate] = useState("");
  const [requestedEffTz, setRequestedEffTz] = useState(DEFAULT_TIMEZONE);
  const [hasActiveBrandSignature, setHasActiveBrandSignature] = useState(false);
  const [checkingSignature, setCheckingSignature] = useState(false);
  const [activeBrandSignatureData, setActiveBrandSignatureData] = useState("");
  const [inlineSignatureTab, setInlineSignatureTab] = useState<"default" | "draw">("default");
  const [inlineDrawnSig, setInlineDrawnSig] = useState("");
  const [inlineAgreed, setInlineAgreed] = useState(false);
  const [inlineShowError, setInlineShowError] = useState(false);
  const [contractForm, setContractForm] = useState<ContractFormState>(
    createDefaultContractForm()
  );
  const [activeBrandSignatureId, setActiveBrandSignatureId] = useState("");
  const [deliverables, setDeliverables] = useState<ScheduleADeliverable[]>([
    createDefaultScheduleDeliverable(),
  ]);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([]);
  const [tzOptions, setTzOptions] = useState<TzOption[]>([]);
  const [contractLoading, setContractLoading] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState<
    "idle" | "checking" | "exists" | "missing"
  >("idle");
  console.log("resolvebrandId", resolvedBrandId)
  const [activeBrandSignatureSrc, setActiveBrandSignatureSrc] = useState("");

  const handleDownloadContract = useCallback(
    async (filename = "BrandxInfluencer_contract.pdf") => {
      try {
        setContractLoading(true);

        // 1. If preview already exists, download that directly
        if (previewBlob) {
          const url = URL.createObjectURL(previewBlob);

          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          link.remove();

          URL.revokeObjectURL(url);
          return;
        }

        // 2. Otherwise fetch saved/generated contract from backend
        const contractId = currentContract?.contractId;
        if (!contractId) {
          Swal.fire(
            "Info",
            "Generate a preview first or create the contract before downloading.",
            "info"
          );
          return;
        }

        const res = await api.post(
          "/contract/viewPdf",
          { contractId },
          { responseType: "blob" }
        );

        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
      } catch (e: any) {
        Swal.fire(
          "Error",
          e?.response?.data?.message || e?.message || "Failed to download contract PDF.",
          "error"
        );
      } finally {
        setContractLoading(false);
      }
    },
    [previewBlob, currentContract?.contractId]
  );

  useEffect(() => {
    if (!open || !resolvedBrandId) {
      setSignatureStatus("idle");
      setActiveBrandSignatureSrc("");
      setActiveBrandSignatureData("");
      setActiveBrandSignatureId("");
      return;
    }

    let mounted = true;

    (async () => {
      setSignatureStatus("checking");

      try {
        const res = await apigetSignatureExistance(resolvedBrandId);
        if (!mounted) return;

        const { hasSignature, src, signatureData, signatureId } = extractBrandSignature(res);

        console.log("Signature check →", { hasSignature, signatureId });

        if (hasSignature) {
          setSignatureStatus("exists");          // ← THIS WAS MISSING
          setActiveBrandSignatureSrc(src || ""); // ← THIS WAS MISSING
          setActiveBrandSignatureData(signatureData || ""); // ← THIS WAS MISSING
          setActiveBrandSignatureId(signatureId || "");
        } else {
          setSignatureStatus("missing");
          setActiveBrandSignatureSrc("");
          setActiveBrandSignatureData("");
          setActiveBrandSignatureId("");
        }
      } catch (error: any) {
        if (!mounted) return;
        const status = error?.response?.status;
        const message = error?.response?.data?.message || error?.message || "";
        const notFound =
          status === 404 ||
          String(message).toLowerCase().includes("active brand signature not found") ||
          String(message).toLowerCase().includes("signature not found");

        setSignatureStatus(notFound ? "missing" : "missing");
        setActiveBrandSignatureSrc("");
        setActiveBrandSignatureData("");
        setActiveBrandSignatureId("");
      }
    })();

    return () => { mounted = false; };
  }, [open, resolvedBrandId]);
  useEffect(() => {
    if (!open) return;

    setInlineSignatureTab("default");
    setInlineDrawnSig("");
    setInlineAgreed(false);
    setInlineShowError(false);
  }, [open]);


  useEffect(() => {
    if (brandIdProp) {
      setResolvedBrandId(brandIdProp);
      return;
    }

    if (typeof window !== "undefined") {
      const storedBrandId = localStorage.getItem("brandId");
      setResolvedBrandId(storedBrandId || null);
    }
  }, [brandIdProp, open]);

  const isPreShootScriptRequired = Boolean(
    getAtPath(contractForm, "scheduleA.preShootScriptRequired", false)
  );
  const activePaymentType = useMemo(
    () => normalizePaymentType(contractForm.campaign.paymentType),
    [contractForm.campaign.paymentType]
  );

  const clearPreview = useCallback(() => {
    setPreviewBlob(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
  }, []);

  const setContractField = useCallback((path: string, value: any) => {
    setContractForm((prev) => setAtPath(prev, path, value));
  }, []);

  const prefillFormFor = useCallback(
    (inf: any, meta?: ContractMeta | null) => {
      const base = createDefaultContractForm();

      if (typeof window !== "undefined") {
        base.brand.legalName = localStorage.getItem("brandName") || "";
        base.brand.contactPersonName = localStorage.getItem("brandContactName") || "";
        base.brand.noticeEmail = localStorage.getItem("brandEmail") || "";
        base.brand.noticePhone = localStorage.getItem("brandPhone") || "";
        base.brand.billingAddress = localStorage.getItem("brandAddress") || "";
        // base.brand.brandPoc = localStorage.getItem("brandPOC") || "";
        // base.brand.brandPocDesignation = localStorage.getItem("brandPOCDesignation") || "";
      }

      base.influencer.legalName = inf?.name || "";
      base.influencer.contactName = inf?.name || "";
      base.influencer.postingHandleUrl =
        buildHandleUrl(inf?.primaryPlatform, inf?.handle) || "";
      base.influencer.contactEmail = inf?.email || "";
      base.influencer.contactPhone = inf?.phone || "";
      base.influencer.whatsApp = inf?.whatsapp || "";
      base.influencer.address = inf?.address || "";

      base.campaign.campaignTitleOrId = campaignTitle || "";
      base.campaign.productsServicesCovered = inf?.productOrServiceName || "";
      base.campaign.territoryTargetCountry = "Worldwide";
      base.campaign.effectiveDate = toInputDate(new Date());

      if (typeof campaignBudget === "number") {
        base.scheduleA.commercial.totalCampaignFee = String(campaignBudget);
      } else {
        base.scheduleA.commercial.totalCampaignFee = String(inf?.feeAmount ?? 0);
      }

      if (campaignTimeline?.startDate) {
        const start = toInputDate(campaignTimeline.startDate);
        if (start) {
          base.campaign.effectiveDate = start;
          setRequestedEffDate(start);
        }
      } else {
        setRequestedEffDate(base.campaign.effectiveDate);
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
      seededDeliverable.platform = inf?.primaryPlatform || "";
      seededDeliverable.handle = inf?.handle ? sanitizeHandle(inf.handle) : "";

      const initialPaymentType = normalizePaymentType(
        meta?.content?.campaign?.paymentType || base.campaign.paymentType
      );
      base.campaign.paymentType = initialPaymentType;

      const merged = mergeDeep(base, meta?.content || {});
      merged.campaign.paymentType = initialPaymentType;

      const rawMilestones =
        meta?.content?.scheduleA?.commercial?.milestones ||
        merged?.scheduleA?.commercial?.milestones ||
        [];

      merged.scheduleA.commercial.milestones =
        Array.isArray(rawMilestones) && rawMilestones.length
          ? rawMilestones.map((row: any, index: number) => ({
            id: createRowId(),
            milestoneName: String(row?.milestoneName || `Milestone ${index + 1}`),
            paymentAmount: String(row?.paymentAmount || ""),
            triggerEvent: String(row?.triggerEvent || ""),
            dueDate: String(row?.dueDate || ""),
          }))
          : initialPaymentType === PAYMENT_TYPE.MILESTONE
            ? [createDefaultCommercialMilestone()]
            : [];

      const usageRows = meta?.content?.scheduleA?.usageRights?.rows;
      const deliverablesFromMeta = meta?.content?.scheduleA?.deliverables;

      if (Array.isArray(usageRows) && usageRows.length) {
        merged.scheduleA.usageRights.rows = usageRows.map((row: any) => ({
          id: createRowId(),
          usageRight: String(row?.usageRight || ""),
          selected: Boolean(row?.selected),
          duration: String(row?.duration || ""),
          territoryNotes: String(row?.territoryNotes || ""),
        }));
      }

      setDeliverables(
        Array.isArray(deliverablesFromMeta) && deliverablesFromMeta.length
          ? deliverablesFromMeta.map((row: any, index: number) => ({
            id: createRowId(),
            srNo: Number(row?.srNo ?? index + 1),
            platform: String(row?.platform || inf?.primaryPlatform || ""),
            handle: String(row?.handle || row?.platformHandle || ""),
            deliverableFormat: String(row?.deliverableFormat || ""),
            qty: String(row?.qty ?? "1"),
            draftRequired: Boolean(row?.draftRequired ?? true),
            draftDue: String(row?.draftDue || ""),
            liveDate: String(row?.liveDate || ""),
          }))
          : [seededDeliverable]
      );

      setContractForm(merged);
      setFormErrors({});
      clearPreview();
    },
    [campaignBudget, campaignTitle, campaignTimeline, clearPreview]
  );

  useEffect(() => {
    if (!open || !resolvedBrandId || !campaignId) return;

    if (isBulkMode) {
      if (!primaryInfluencer) return;
      setCurrentContract(null);
      prefillFormFor(primaryInfluencer, null);
      setContractLoading(false);
      return;
    }

    if (!primaryInfluencer?.influencerId) return;

    let mounted = true;

    (async () => {
      if (initialContract !== undefined) {
        setCurrentContract(initialContract || null);
        prefillFormFor(primaryInfluencer, initialContract || null);
        setContractLoading(false);
        return;
      }

      setContractLoading(true);
      try {
        const res: any = await post("/contract/getContract", {
          brandId: resolvedBrandId,
          influencerId: primaryInfluencer.influencerId,
          campaignId,
        });

        const list = res?.contracts || res?.data?.contracts || [];
        const filtered = (list as ContractMeta[]).filter(
          (c) => String(c.campaignId) === String(campaignId)
        );
        const meta = filtered.length ? filtered[0] : list.length ? list[0] : null;

        if (!mounted) return;
        setCurrentContract(meta || null);
        prefillFormFor(primaryInfluencer, meta || null);
      } catch {
        if (!mounted) return;
        setCurrentContract(null);
        prefillFormFor(primaryInfluencer, null);
      } finally {
        if (mounted) setContractLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    open,
    resolvedBrandId,
    campaignId,
    primaryInfluencer,
    prefillFormFor,
    initialContract,
    isBulkMode,
  ]);

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    (async () => {
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
        const tzArr: any[] =
          tzRes?.data?.timezones || tzRes?.timezones || tzRes || [];

        const zones = Array.from(
          new Map(
            tzArr.map((t: any, index: number) => {
              const canonical =
                typeof t?.value === "string" && t.value.trim()
                  ? t.value.trim()
                  : Array.isArray(t?.utc) && t.utc.length
                    ? String(t.utc[0]).trim()
                    : `timezone-${index}`;

              return [
                canonical,
                {
                  value: canonical,
                  label: t?.text || canonical,
                  meta: t,
                },
              ];
            })
          ).values()
        ) as TzOption[];

        if (!mounted) return;
        setCurrencyOptions(currencies);
        setTzOptions(zones);
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    clearPreview();
  }, [contractForm, deliverables, requestedEffDate, requestedEffTz, open, clearPreview]);

  const buildContentPayload = useCallback((signatureId: string = "") => {
    const content = deepClone(contractForm);
    const paymentType = activePaymentType;
    content.campaign.paymentType = paymentType;

    return {
      ...content,
      brand: {
        ...content.brand,
        brandSignature: signatureId || activeBrandSignatureId || "",
      },
      campaign: {
        ...content.campaign,
        paymentType,
        effectiveDate: requestedEffDate || content.campaign.effectiveDate || "",
      },
      scheduleA: {
        ...content.scheduleA,
        deliverables: deliverables.map((row, index) => ({
          srNo: index + 1,
          platform: row.platform,
          handle: row.handle,
          deliverableFormat: row.deliverableFormat,
          qty: Number(row.qty || "0") || 0,
          draftRequired: row.draftRequired,
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
            paymentType === PAYMENT_TYPE.GIFTING
              ? 0
              : Number(content.scheduleA.commercial.totalCampaignFee || "0") || 0,

          milestones:
            paymentType === PAYMENT_TYPE.MILESTONE
              ? content.scheduleA.commercial.milestones.map((row) => ({
                milestoneName: row.milestoneName,
                paymentAmount: Number(row.paymentAmount || "0") || 0,
                triggerEvent: row.triggerEvent,
                dueDate: row.dueDate,
              }))
              : [],
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
  }, [contractForm, deliverables, requestedEffDate, activePaymentType, activeBrandSignatureId]);

  const buildBrandUpdatesPayload = useCallback(() => {
    return {
      content: buildContentPayload(),
    };
  }, [buildContentPayload]);

  const buildBulkContentPayload = useCallback(() => {
    const content = buildContentPayload();

    return {
      ...content,
      influencer: {},
      scheduleA: {
        ...content.scheduleA,
        deliverables: content.scheduleA.deliverables.map((row: any) => ({
          ...row,
          platformHandle: "",
        })),
      },
    };
  }, [buildContentPayload]);

  const validateForPreview = useCallback(() => {
    const nextErrors: Record<string, string> = {};
    const add = (key: string, message: string) => {
      nextErrors[key] = message;
    };

    const feeRaw = String(contractForm.scheduleA.commercial.totalCampaignFee ?? "");
    const feeValue = Number(feeRaw);
    const revisionRaw = String(
      contractForm.scheduleA.review.includedRevisionRounds ?? ""
    );
    const revisionValue = Number(revisionRaw);
    const reviewDaysRaw = String(
      contractForm.scheduleA.preShootScriptReviewBusinessDays ?? "2"
    );
    const reviewDays = Number(reviewDaysRaw);

    if (!String(contractForm.brand.legalName ?? "").trim()) {
      add("brand.legalName", "Brand legal name is required.");
    }
    if (!String(contractForm.influencer.legalName ?? "").trim()) {
      add("influencer.legalName", "Influencer legal name is required.");
    }
    if (!String(contractForm.campaign.campaignTitleOrId ?? "").trim()) {
      add("campaign.campaignTitleOrId", "Campaign title / ID is required.");
    }
    if (!contractForm.scheduleA.commercial.currency) {
      add("scheduleA.commercial.currency", "Currency is required.");
    }
    if (!contractForm.campaign.paymentType) {
      add("campaign.paymentType", "Payment type is required.");
    }

    if (activePaymentType !== PAYMENT_TYPE.GIFTING) {
      if (!feeRaw.trim() || Number.isNaN(feeValue) || feeValue < 0) {
        add("scheduleA.commercial.totalCampaignFee", "Enter a valid non-negative fee.");
      }
    }

    if (activePaymentType === PAYMENT_TYPE.MILESTONE) {
      const milestones = contractForm.scheduleA.commercial.milestones || [];
      if (!milestones.length) {
        add("scheduleA.commercial.milestones", "Add at least one milestone.");
      } else {
        const messages: string[] = [];
        milestones.forEach((row, index) => {
          const label = `Milestone #${index + 1}`;
          if (!row.milestoneName.trim()) messages.push(`${label}: name is required.`);
          if (!row.paymentAmount.trim()) messages.push(`${label}: amount is required.`);
          if (!row.triggerEvent.trim()) messages.push(`${label}: trigger event is required.`);
          if (!row.dueDate.trim()) messages.push(`${label}: due date is required.`);
        });
        if (messages.length) {
          add("scheduleA.commercial.milestones", messages.join(" "));
        }
      }
    }

    if (Number.isNaN(revisionValue) || revisionValue < 0) {
      add(
        "scheduleA.review.includedRevisionRounds",
        "Revision rounds must be zero or more."
      );
    }

    if (Number.isNaN(reviewDays) || reviewDays < 0) {
      add(
        "scheduleA.preShootScriptReviewBusinessDays",
        "Review business days must be zero or more."
      );
    }

    if (!requestedEffDate) {
      add("requestedEffDate", "Requested effective date is required.");
    }

    if (!deliverables.length) {
      add("scheduleA.deliverables", "Add at least one deliverable.");
    } else {
      const messages: string[] = [];
      deliverables.forEach((row, index) => {
        const label = `Deliverable #${index + 1}`;
        const qtyNum = Number(row.qty || "");
        // if (!row.deliverableFormat.trim()) {
        //   messages.push(`${label}: deliverable format is required.`);
        // }
        // if (!row.platform.trim()) {
        //   messages.push(`${label}: platform is required.`);
        // }
        // if (!row.handle.trim()) {
        //   messages.push(`${label}: handle is required.`);
        // }
        // if (!row.qty.trim() || Number.isNaN(qtyNum) || qtyNum < 1) {
        //   messages.push(`${label}: quantity must be at least 1.`);
        // }
      });
      if (messages.length) {
        add("scheduleA.deliverables", messages.join(" "));
      }
    }

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      toast({ icon: "error", title: "Please fix the highlighted fields" });
      return false;
    }

    return true;
  }, [activePaymentType, contractForm, deliverables, requestedEffDate]);


  const handleOpenPreviewInNewTab = useCallback(() => {
    if (!previewUrl) {
      toast({
        icon: "info",
        title: "Preview required",
        text: "Generate preview first to open the PDF in a new tab.",
      });
      return;
    }

    window.open(previewUrl, "_blank", "noopener,noreferrer");
  }, [previewUrl]);

  const handleGeneratePreview = useCallback(async () => {
    if (!resolvedBrandId || !campaignId) return;
    if (!validateForPreview()) return;

    setIsPreviewLoading(true);

    try {
      let res: any;

      if (isBulkMode) {
        const sampleInfluencer = bulkInfluencers?.[0];
        if (!sampleInfluencer?.influencerId) {
          toast({
            icon: "error",
            title: "No influencer selected",
            text: "Please select at least one influencer.",
          });
          return;
        }

        res = await api.post(
          "/contract/initiate",
          {
            brandId: resolvedBrandId,
            campaignId,
            influencerId: sampleInfluencer.influencerId,
            content: buildBulkContentPayload(),
            requestedEffectiveDate: requestedEffDate,
            requestedEffectiveDateTimezone: requestedEffTz,
            preview: true,
          },
          { responseType: "blob" }
        );
      } else if (!currentContract?.contractId) {
        res = await api.post(
          "/contract/initiate",
          {
            brandId: resolvedBrandId,
            campaignId,
            influencerId: primaryInfluencer.influencerId,
            content: buildContentPayload(),
            requestedEffectiveDate: requestedEffDate,
            requestedEffectiveDateTimezone: requestedEffTz,
            preview: true,
          },
          { responseType: "blob" }
        );
      } else if (isRejectedMeta(currentContract)) {
        res = await api.post(
          "/contract/resend",
          {
            contractId: currentContract.contractId,
            content: buildContentPayload(),
            requestedEffectiveDate: requestedEffDate,
            requestedEffectiveDateTimezone: requestedEffTz,
            preview: true,
          },
          { responseType: "blob" }
        );
      } else {
        res = await api.post(
          "/contract/brand/update",
          {
            contractId: currentContract._id || "",
            brandId: resolvedBrandId,
            preview: true,
            brandUpdates: buildBrandUpdatesPayload(),
            requestedEffectiveDate: requestedEffDate,
            requestedEffectiveDateTimezone: requestedEffTz,
          },
          { responseType: "blob" }
        );
      }

      const blob =
        res?.data instanceof Blob
          ? res.data
          : new Blob([res.data], { type: "application/pdf" });

      const contentType =
        res?.headers?.["content-type"] || res?.headers?.["Content-Type"] || blob.type;

      console.log("Preview response content-type:", contentType);
      console.log("Preview blob type:", blob.type);
      console.log("Preview blob size:", blob.size);

      if (!contentType?.includes("pdf") && blob.type && !blob.type.includes("pdf")) {
        let serverMessage = "Server did not return a PDF preview.";

        try {
          const text = await blob.text();
          console.error("Non-PDF preview response:", text);
          serverMessage = text || serverMessage;
        } catch (readErr) {
          console.error("Could not read non-PDF blob:", readErr);
        }

        throw new Error(serverMessage);
      }

      setPreviewBlob(blob);

      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });

      toast({
        icon: "success",
        title: "Preview ready",
        text: isBulkMode ? "Sample preview generated for bulk contract." : undefined,
      });
    } catch (e: any) {
      console.error("Preview generation failed:", e);

      let errorText =
        e?.response?.data?.message ||
        e?.message ||
        "Could not generate preview.";

      if (e?.response?.data instanceof Blob) {
        try {
          const blobText = await e.response.data.text();
          errorText = blobText || errorText;
          console.error("Preview error blob text:", blobText);
        } catch (blobErr) {
          console.error("Could not parse error blob:", blobErr);
        }
      }

      toast({
        icon: "error",
        title: "Preview failed",
        text: errorText,
      });
    } finally {
      setIsPreviewLoading(false);
    }
  }, [
    resolvedBrandId,
    campaignId,
    validateForPreview,
    isBulkMode,
    bulkInfluencers,
    buildBulkContentPayload,
    currentContract,
    primaryInfluencer,
    buildContentPayload,
    requestedEffDate,
    requestedEffTz,
    buildBrandUpdatesPayload,
  ]);

  const handleActualSubmit = useCallback(async (signatureBrand?: string, signatureId?: string) => {
    if (!resolvedBrandId || !campaignId) return;

    setIsSubmitLoading(true);
    try {
      const contentWithSig = buildContentPayload(signatureId || "");
      if (isBulkMode) {
        const influencerIds = (bulkInfluencers || [])
          .map((item) => item?.influencerId)
          .filter(Boolean);

        if (!influencerIds.length) {
          toast({
            icon: "error",
            title: "No influencer selected",
            text: "Please select at least one influencer.",
          });
          return;
        }

        const res: any = await post("/contract/initiate-bulk", {
          brandId: resolvedBrandId,
          campaignId,
          influencerIds,
          content: buildBulkContentPayload(),
          requestedEffectiveDate: requestedEffDate,
          requestedEffectiveDateTimezone: requestedEffTz,
          // ...(signatureBrand ? { signatureId } : {}),
          signatureBrand: signatureId
        });

        const sentCount = res?.sentCount || res?.data?.sentCount || influencerIds.length;
        const failed = res?.failed || res?.data?.failed || [];
        toast({
          icon: failed.length ? "info" : "success",
          title: `${sentCount} contract${sentCount > 1 ? "s" : ""} sent`,
          text: failed.length ? `${failed.length} failed.` : "Bulk contract send completed.",
        });
      } else if (!currentContract?.contractId) {
        await post("/contract/initiate", {
          brandId: resolvedBrandId,
          campaignId,
          influencerId: primaryInfluencer.influencerId,
          content: contentWithSig,
          requestedEffectiveDate: requestedEffDate,
          requestedEffectiveDateTimezone: requestedEffTz,
          // ...(signatureBrand ? { signatureId } : {}),
          signatureBrand: signatureId
        });

        toast({
          icon: "success",
          title: "Sent",
          text: "Contract created and shared.",
        });
      } else if (isRejectedMeta(currentContract)) {
        await post("/contract/resend", {
          contractId: currentContract.contractId,
          content: buildContentPayload(),
          requestedEffectiveDate: requestedEffDate,
          requestedEffectiveDateTimezone: requestedEffTz,
          ...(signatureBrand ? { signatureBrand } : {}),
        });

        toast({
          icon: "success",
          title: "Resent",
          text: "Contract resent successfully.",
        });
      } else {
        await post("/contract/brand/update", {
          contractId: currentContract._id || "",
          brandId: resolvedBrandId,
          type: 0,
          brandUpdates: buildBrandUpdatesPayload(),
          ...(signatureBrand ? { signatureBrand } : {}),
        });

        toast({
          icon: "success",
          title: "Updated",
          text: "Contract updated and shared.",
        });
      }

      await onSuccess?.();
      onClose();
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Action failed",
        text: e?.response?.data?.message || e?.message || "Failed to process contract.",
      });
    } finally {
      setIsSubmitLoading(false);
    }
  }, [
    resolvedBrandId,
    campaignId,
    isBulkMode,
    bulkInfluencers,
    buildBulkContentPayload,
    requestedEffDate,
    requestedEffTz,
    currentContract,
    primaryInfluencer,
    buildContentPayload,
    buildBrandUpdatesPayload,
    onSuccess,
    onClose,
  ]);
  const getLatestBrandSignature = useCallback(async (): Promise<{ signatureData: string; signatureId: string }> => {
    if (!resolvedBrandId) return { signatureData: "", signatureId: "" };

    try {
      const res = await apigetSignatureExistance(resolvedBrandId);
      const { hasSignature, src, signatureData, signatureId } = extractBrandSignature(res);

      console.log("Fresh signature fetch:", { hasSignature, signatureId });

      if (hasSignature) {
        setSignatureStatus("exists");
        setActiveBrandSignatureSrc(src || "");
        setActiveBrandSignatureData(signatureData || "");
        setActiveBrandSignatureId(signatureId || "");
        return { signatureData: signatureData || "", signatureId: signatureId || "" };
      }

      setSignatureStatus("missing");
      setActiveBrandSignatureSrc("");
      setActiveBrandSignatureData("");
      setActiveBrandSignatureId("");
      return { signatureData: "", signatureId: "" };
    } catch (error: any) {
      setActiveBrandSignatureId("");
      return { signatureData: "", signatureId: "" };
    }
  }, [resolvedBrandId]);
  const handleSubmit = useCallback(async () => {
    if (!resolvedBrandId || !campaignId) return;

    if (!previewUrl) {
      toast({ icon: "info", title: "Preview required", text: "Generate preview before proceeding." });
      return;
    }

    if (!validateForPreview()) return;

    const { signatureData, signatureId } = await getLatestBrandSignature();

    if (signatureData) {
      // Signature exists — require inline agreement
      if (!inlineAgreed) {
        setInlineShowError(true);
        // Scroll to signature section
        document.getElementById("signature-section")?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      await handleActualSubmit(signatureData, signatureId);
      return;
    }

    // No signature — open modal
    setShowSignatureModal(true);
  }, [
    resolvedBrandId,
    campaignId,
    previewUrl,
    validateForPreview,
    getLatestBrandSignature,
    inlineAgreed,
    handleActualSubmit,
  ]);
  const submitLabel = isBulkMode
    ? "Send Bulk Contracts"
    : !currentContract?.contractId
      ? "Send Contract"
      : isRejectedMeta(currentContract)
        ? "Resend Contract"
        : "Update Contract";

  const todayStr = toInputDate(new Date());

  const usageRightOptions = useMemo(
    () =>
      contractForm.scheduleA.usageRights.rows.map((row) => ({
        value: row.usageRight,
        label: row.usageRight,
      })),
    [contractForm.scheduleA.usageRights.rows]
  );

  const selectedUsageRights = useMemo(
    () =>
      contractForm.scheduleA.usageRights.rows
        .filter((row) => row.selected)
        .map((row) => row.usageRight),
    [contractForm.scheduleA.usageRights.rows]
  );

  const setSelectedUsageRights = useCallback(
    (next: string[]) => {
      setContractField(
        "scheduleA.usageRights.rows",
        contractForm.scheduleA.usageRights.rows.map((row) => ({
          ...row,
          selected: next.includes(row.usageRight),
        }))
      );
    },
    [contractForm.scheduleA.usageRights.rows, setContractField]
  );
  const handlePaymentTypeChange = useCallback((value: string) => {
    const nextType = normalizePaymentType(value);

    setContractForm((prev) => {
      const next = deepClone(prev);
      next.campaign.paymentType = nextType;

      // if (nextType === PAYMENT_TYPE.MILESTONE) {
      //   if (!next.scheduleA.commercial.milestones.length) {
      //     next.scheduleA.commercial.milestones = [createDefaultCommercialMilestone()];
      //   }
      //   next.scheduleA.commercial.paymentStructure = "";
      // }

      // if (nextType === PAYMENT_TYPE.FIXED) {
      //   next.scheduleA.commercial.milestones = [];
      //   if (!next.scheduleA.commercial.paymentStructure) {
      //     next.scheduleA.commercial.paymentStructure = "50% advance / 50% balance";
      //   }
      // }

      // if (nextType === PAYMENT_TYPE.GIFTING) {
      //   next.scheduleA.commercial.milestones = [];
      //   next.scheduleA.commercial.paymentStructure = "";
      //   next.scheduleA.commercial.totalCampaignFee = "0";
      // }

      return next;
    });
  }, []);
  if (!open) return null;
  if (!isBulkMode && !primaryInfluencer) return null;
  if (isBulkMode && !bulkInfluencers?.length) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <ContractSidebarShell
        isOpen={open}
        onClose={onClose}
        title={submitLabel}
        subtitle={
          isBulkMode
            ? `${campaignTitle || contractForm.campaign.campaignTitleOrId || "Agreement"} • ${bulkInfluencers.length} influencers selected`
            : `${campaignTitle || contractForm.campaign.campaignTitleOrId || "Agreement"} • ${primaryInfluencer?.name || ""}`
        }
        campaignPaymentType={activePaymentType}
        onCampaignPaymentTypeChange={handlePaymentTypeChange}
        previewUrl={previewUrl}
        previewBlob={previewBlob}
        onClosePreview={clearPreview}
        onDownload={() =>
          handleDownloadContract(
            `${(campaignTitle || contractForm.campaign.campaignTitleOrId || "contract")
              .replace(/\s+/g, "_")}.pdf`
          )
        }
        isDownloading={contractLoading}
        onOpenInNewTab={handleOpenPreviewInNewTab}
        footer={
          <>
            <Button
              variant="outline"
              onClick={handleGeneratePreview}
              disabled={isPreviewLoading || isSubmitLoading || !resolvedBrandId}
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

            <Button
              onClick={handleSubmit}
              disabled={!previewUrl || isSubmitLoading || isPreviewLoading || !resolvedBrandId}
            >
              {isSubmitLoading ? (
                <>
                  <span className="mr-2 animate-spin">⏳</span> Processing…
                </>
              ) : isBulkMode ? (
                `${submitLabel}${bulkInfluencers.length ? ` (${bulkInfluencers.length})` : ""}`
              ) : (
                submitLabel
              )}
            </Button>
          </>
        }
      >
        {contractLoading ? (
          <div className="p-6 text-sm text-gray-600">Loading contract…</div>
        ) : (
          <>
            <SidebarSection title="Brand" icon={<FileText className="h-4 w-4" />}>
              <div className="space-y-3">
                <FloatingInput
                  id="brand-legal-name"
                  label="Brand Legal Name"
                  info={SIDEBAR_TOOLTIPS.brandLegalName}
                  value={getAtPath(contractForm, "brand.legalName")}
                  onValueChange={(value: string) =>
                    setContractField("brand.legalName", value)
                  }
                  state={formErrors["brand.legalName"] ? "error" : undefined}
                  errorText={formErrors["brand.legalName"] || ""}
                  required
                />

                <FloatingInput
                  id="brand-contact-person"
                  label="Contact Person Name"
                  info={SIDEBAR_TOOLTIPS.brandContactPerson}
                  value={getAtPath(contractForm, "brand.contactPersonName")}
                  onValueChange={(value: string) =>
                    setContractField("brand.contactPersonName", value)
                  }
                  required
                />

                {/* <FloatingInput
                  id="brand-notice-email"
                  label="Notice Email"
                  info={SIDEBAR_TOOLTIPS.brandNoticeEmail}
                  value={getAtPath(contractForm, "brand.noticeEmail")}
                  onValueChange={(value: string) =>
                    setContractField("brand.noticeEmail", value)
                  }
                  required
                /> */}

                {/* <FloatingInput
                  id="brand-notice-phone"
                  label="Notice Phone"
                  info={SIDEBAR_TOOLTIPS.brandNoticePhone}
                  value={getAtPath(contractForm, "brand.noticePhone")}
                  onValueChange={(value: string) =>
                    setContractField("brand.noticePhone", value)
                  }
                  required
                /> */}

                <LabeledTextarea
                  id="brand-billing-address"
                  label="Billing Address"
                  info={SIDEBAR_TOOLTIPS.brandBillingAddress}
                  value={getAtPath(contractForm, "brand.billingAddress")}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField("brand.billingAddress", e.target.value)
                  }
                  required
                />

                {/* <FloatingInput
                  id="brand-poc"
                  label="Brand POC"
                  info={SIDEBAR_TOOLTIPS.brandPoc}
                  value={getAtPath(contractForm, "brand.brandPoc")}
                  onValueChange={(value: string) =>
                    setContractField("brand.brandPoc", value)
                  }
                // required
                /> */}

                {/* <FloatingInput
                  id="brand-poc-designation"
                  label="Brand POC Designation"
                  info={SIDEBAR_TOOLTIPS.brandPocDesignation}
                  value={getAtPath(contractForm, "brand.brandPocDesignation")}
                  onValueChange={(value: string) =>
                    setContractField("brand.brandPocDesignation", value)
                  }
                // required
                /> */}
              </div>
            </SidebarSection>

            <SidebarSection title="Campaign Overview" icon={<Info className="h-4 w-4" />}>
              <div className="space-y-4">
                <FloatingInput
                  id="campaign-title"
                  label="Campaign Title / ID"
                  info={SIDEBAR_TOOLTIPS.campaignTitle}
                  value={getAtPath(contractForm, "campaign.campaignTitleOrId")}
                  onValueChange={(value: string) =>
                    setContractField("campaign.campaignTitleOrId", value)
                  }
                  state={formErrors["campaign.campaignTitleOrId"] ? "error" : undefined}
                  errorText={formErrors["campaign.campaignTitleOrId"] || ""}
                  required
                />

                <LabeledTextarea
                  id="campaign-products-services"
                  label="Products / Services Covered"
                  info={SIDEBAR_TOOLTIPS.campaignProductsServices}
                  value={getAtPath(contractForm, "campaign.productsServicesCovered")}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField("campaign.productsServicesCovered", e.target.value)
                  }
                />

                <FloatingSelect
                  label="Campaign Payment Type"
                  value={getAtPath(contractForm, "campaign.paymentType")}
                  onValueChange={handlePaymentTypeChange}
                  searchable={false}
                  state={formErrors["campaign.paymentType"] ? "error" : undefined}
                  errorText={formErrors["campaign.paymentType"] || ""}
                  disabled
                >
                  {PAYMENT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FloatingInput
                    id="campaign-territory"
                    label="Territory / Target Country"
                    info={SIDEBAR_TOOLTIPS.campaignTerritory}
                    value={getAtPath(contractForm, "campaign.territoryTargetCountry")}
                    onValueChange={(value: string) =>
                      setContractField("campaign.territoryTargetCountry", value)
                    }
                  />

                  <FloatingDateInput
                    id="requested-effective-date"
                    label="Requested Effective Date"
                    info={SIDEBAR_TOOLTIPS.requestedEffectiveDate}
                    type="date"
                    value={requestedEffDate}
                    min={todayStr}
                    onValueChange={(value) => {
                      setRequestedEffDate(value);
                      setContractField("campaign.effectiveDate", value);
                    }}
                    state={formErrors["requestedEffDate"] ? "error" : undefined}
                    errorText={formErrors["requestedEffDate"] || ""}
                    required
                  />
                </div>

                <FloatingSelect
                  label="Timezone"
                  info={SIDEBAR_TOOLTIPS.timezone}
                  value={requestedEffTz}
                  onValueChange={(value) => setRequestedEffTz(value)}
                  searchable
                >
                  {tzOptions.map((option, index) => (
                    <SelectItem key={`${option.value}-${index}`} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>
              </div>
            </SidebarSection>

            <SidebarSection
              title="Deliverables & Publication Timeline"
              icon={<ClipboardText className="h-4 w-4" />}
            >
              <div className="space-y-4">
                {formErrors["scheduleA.deliverables"] ? (
                  <div className="text-xs text-red-600">
                    {formErrors["scheduleA.deliverables"]}
                  </div>
                ) : null}

                {deliverables.map((row, index) => (
                  <div
                    key={row.id}
                    className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-gray-800">
                        Deliverable #{index + 1}
                      </div>

                      {deliverables.length > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDeliverables((prev) =>
                              prev.filter((item) => item.id !== row.id)
                            )
                          }
                          className="text-xs text-gray-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {/* <FloatingInput
                        id={`deliverable-sr-${row.id}`}
                        label="Sr. No."
                        type="number"
                        value={String(index + 1)}
                        onValueChange={() => undefined}
                        disabled
                      /> */}

                      <FloatingSelect
                        label="Platform"
                        info={SIDEBAR_TOOLTIPS.platformHandle}
                        value={row.platform}
                        onValueChange={(value) =>
                          setDeliverables((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, platform: value } : item
                            )
                          )
                        }
                        searchable={false}
                      >
                        <SelectItem value="Instagram">Instagram</SelectItem>
                        <SelectItem value="YouTube">YouTube</SelectItem>
                        <SelectItem value="TikTok">TikTok</SelectItem>
                      </FloatingSelect>

                      <FloatingInput
                        id={`deliverable-handle-${row.id}`}
                        label="Handle"
                        info="Creator handle for this platform."
                        value={row.handle}
                        onValueChange={(value: string) =>
                          setDeliverables((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, handle: value } : item
                            )
                          )
                        }
                      />

                      <FloatingInput
                        id={`deliverable-qty-${row.id}`}
                        label="Qty"
                        info={SIDEBAR_TOOLTIPS.qty}
                        type="number"
                        value={row.qty}
                        onValueChange={(value: string) =>
                          setDeliverables((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, qty: value } : item
                            )
                          )
                        }
                      />

                      <FloatingSelect
                        label="Deliverable Format"
                        info={SIDEBAR_TOOLTIPS.deliverableFormat}
                        value={row.deliverableFormat}
                        onValueChange={(value) =>
                          setDeliverables((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, deliverableFormat: value } : item
                            )
                          )
                        }
                        searchable={false}
                      >
                        {DELIVERABLE_FORMAT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </FloatingSelect>
                    </div>



                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            id={`deliverable-draft-required-${row.id}`}
                            type="checkbox"
                            checked={row.draftRequired}
                            onChange={(e) =>
                              setDeliverables((prev) =>
                                prev.map((item) =>
                                  item.id === row.id
                                    ? {
                                      ...item,
                                      draftRequired: e.target.checked,
                                      draftDue: e.target.checked ? item.draftDue : "",
                                    }
                                    : item
                                )
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label
                            htmlFor={`deliverable-draft-required-${row.id}`}
                            className="text-sm font-medium text-gray-700"
                          >
                            Draft Required
                          </label>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <FloatingDateInput
                            id={`deliverable-draft-${row.id}`}
                            label="Draft Due"
                            info={SIDEBAR_TOOLTIPS.draftDue}
                            type="date"
                            value={row.draftDue}
                            min={todayStr}
                            disabled={!row.draftRequired}
                            onValueChange={(value) =>
                              setDeliverables((prev) =>
                                prev.map((item) =>
                                  item.id === row.id ? { ...item, draftDue: value } : item
                                )
                              )
                            }
                          />

                          <FloatingDateInput
                            id={`deliverable-live-${row.id}`}
                            label="Live Date"
                            info={SIDEBAR_TOOLTIPS.liveDate}
                            type="date"
                            value={row.liveDate}
                            min={todayStr}
                            onValueChange={(value) =>
                              setDeliverables((prev) =>
                                prev.map((item) =>
                                  item.id === row.id ? { ...item, liveDate: value } : item
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() =>
                    setDeliverables((prev) => [
                      ...prev,
                      { ...createDefaultScheduleDeliverable(), srNo: prev.length + 1 },
                    ])
                  }
                >
                  + Add another deliverable
                </Button>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <LabeledTextarea
                    id="minimum-video-specs"
                    label="Minimum Video Specs"
                    info={SIDEBAR_TOOLTIPS.minimumVideoSpecs}
                    value={getAtPath(contractForm, "scheduleA.minimumVideoSpecs")}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setContractField("scheduleA.minimumVideoSpecs", e.target.value)
                    }
                  />

                  <FloatingTagInput
                    label="Mandatory Tags / Mentions / Links / Codes"
                    info={SIDEBAR_TOOLTIPS.mandatoryTags}
                    value={csvToTags(
                      getAtPath(contractForm, "scheduleA.mandatoryTagsMentionsLinksCodes")
                    )}
                    options={[]}
                    onValueChange={(next) =>
                      setContractField(
                        "scheduleA.mandatoryTagsMentionsLinksCodes",
                        tagsToCsv(next)
                      )
                    }
                    dropdownDirection="up"
                  />
                </div>

                <div
                  className={`grid grid-cols-1 gap-3 ${isPreShootScriptRequired ? "md:grid-cols-3" : "md:grid-cols-1"
                    }`}
                >
                  <FloatingSelect
                    label="Pre-Shoot Script Required"
                    info={SIDEBAR_TOOLTIPS.preShootScriptRequired}
                    value={isPreShootScriptRequired ? "yes" : "no"}
                    onValueChange={(value) => {
                      const required = value === "yes";

                      setContractForm((prev) => {
                        const next = deepClone(prev);
                        next.scheduleA.preShootScriptRequired = required;

                        if (!required) {
                          next.scheduleA.preShootScriptDue = "";
                          next.scheduleA.preShootScriptReviewBusinessDays = "2";
                        }

                        return next;
                      });
                    }}
                    searchable={false}
                  >
                    {YES_NO_BOOL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </FloatingSelect>

                  {isPreShootScriptRequired && (
                    <>
                      <FloatingDateInput
                        id="pre-shoot-script-due"
                        label="Pre-Shoot Script Due"
                        info={SIDEBAR_TOOLTIPS.preShootScriptDue}
                        type="date"
                        value={getAtPath(contractForm, "scheduleA.preShootScriptDue")}
                        min={todayStr}
                        onValueChange={(value) =>
                          setContractField("scheduleA.preShootScriptDue", value)
                        }
                      />

                      <FloatingInput
                        id="pre-shoot-review-days"
                        label="Script Review Business Days"
                        info={SIDEBAR_TOOLTIPS.preShootReviewDays}
                        type="number"
                        value={getAtPath(
                          contractForm,
                          "scheduleA.preShootScriptReviewBusinessDays"
                        )}
                        onValueChange={(value: string) =>
                          setContractField(
                            "scheduleA.preShootScriptReviewBusinessDays",
                            value
                          )
                        }
                        state={
                          formErrors["scheduleA.preShootScriptReviewBusinessDays"]
                            ? "error"
                            : undefined
                        }
                        errorText={
                          formErrors["scheduleA.preShootScriptReviewBusinessDays"] || ""
                        }
                      />
                    </>
                  )}
                </div>
              </div>
            </SidebarSection>

            <SidebarSection
              title="Review, Revisions & Reshoots"
              icon={<PenNib className="h-4 w-4" />}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FloatingInput
                  id="included-revision-rounds"
                  label="Included Revision Rounds"
                  info={SIDEBAR_TOOLTIPS.includedRevisionRounds}
                  type="number"
                  value={getAtPath(contractForm, "scheduleA.review.includedRevisionRounds")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.review.includedRevisionRounds", value)
                  }
                  state={
                    formErrors["scheduleA.review.includedRevisionRounds"]
                      ? "error"
                      : undefined
                  }
                  errorText={formErrors["scheduleA.review.includedRevisionRounds"] || ""}
                />

                <FloatingInput
                  id="additional-revision-fee"
                  label="Additional Revision Fee"
                  info={SIDEBAR_TOOLTIPS.additionalRevisionFee}
                  value={getAtPath(contractForm, "scheduleA.review.additionalRevisionFee")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.review.additionalRevisionFee", value)
                  }
                />

                <FloatingSelect
                  label="Reshoot Obligation"
                  info={SIDEBAR_TOOLTIPS.reshootObligation}
                  value={getAtPath(contractForm, "scheduleA.review.reshootObligation")}
                  onValueChange={(value) =>
                    setContractField("scheduleA.review.reshootObligation", value)
                  }
                  searchable={false}
                >
                  {RESHOOT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>

                <FloatingInput
                  id="reshoot-fee"
                  label="Reshoot Fee"
                  info={SIDEBAR_TOOLTIPS.reshootFee}
                  value={getAtPath(contractForm, "scheduleA.review.reshootFee")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.review.reshootFee", value)
                  }
                />

                <FloatingInput
                  id="minimum-live-period"
                  label="Minimum Live Period"
                  info={SIDEBAR_TOOLTIPS.minimumLivePeriod}
                  value={getAtPath(contractForm, "scheduleA.review.minimumLivePeriod")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.review.minimumLivePeriod", value)
                  }
                />
              </div>
            </SidebarSection>

            <SidebarSection title="Commercial Terms" icon={<FileText className="h-4 w-4" />}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FloatingInput
                    id="total-campaign-fee"
                    label="Influencer fees"
                    info={SIDEBAR_TOOLTIPS.influencerBudget}
                    type="number"
                    value={getAtPath(contractForm, "scheduleA.commercial.influencerBudget")}
                    onValueChange={(value: string) =>
                      setContractField("scheduleA.commercial.influencerBudget", value)
                    }
                    state={
                      formErrors["scheduleA.commercial.influencerBudget"]
                        ? "error"
                        : undefined
                    }
                    errorText={formErrors["scheduleA.commercial.influencerBudget"] || ""}
                    required
                  />

                  <FloatingSelect
                    label="Currency"
                    info={SIDEBAR_TOOLTIPS.currency}
                    value={getAtPath(contractForm, "scheduleA.commercial.currency")}
                    onValueChange={(value) =>
                      setContractField("scheduleA.commercial.currency", value)
                    }
                    searchable
                    state={
                      formErrors["scheduleA.commercial.currency"] ? "error" : undefined
                    }
                    errorText={formErrors["scheduleA.commercial.currency"] || ""}
                    required
                  >
                    {currencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </FloatingSelect>
                </div>

                {activePaymentType === PAYMENT_TYPE.FIXED ? (
                  <>
                    <FloatingSelect
                      label="Payment Structure"
                      info={SIDEBAR_TOOLTIPS.paymentStructure}
                      value={getAtPath(contractForm, "scheduleA.commercial.paymentStructure")}
                      onValueChange={(value) =>
                        setContractField("scheduleA.commercial.paymentStructure", value)
                      }
                      searchable={false}
                    >
                      {PAYMENT_STRUCTURE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </FloatingSelect>

                    <FloatingInput
                      id="commercial-custom-split"
                      label="Custom"
                      info={SIDEBAR_TOOLTIPS.customSplit}
                      value={getAtPath(contractForm, "scheduleA.commercial.customSplit")}
                      onValueChange={(value: string) =>
                        setContractField("scheduleA.commercial.customSplit", value)
                      }
                    />

                    <LabeledTextarea
                      id="advance-payment-trigger"
                      label="Advance Payment Trigger"
                      info={SIDEBAR_TOOLTIPS.advancePaymentTrigger}
                      value={getAtPath(contractForm, "scheduleA.commercial.advancePaymentTrigger")}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setContractField("scheduleA.commercial.advancePaymentTrigger", e.target.value)
                      }
                    />

                    <LabeledTextarea
                      id="remaining-payment-trigger"
                      label="Remaining Payment Trigger"
                      info={SIDEBAR_TOOLTIPS.remainingPaymentTrigger}
                      value={getAtPath(contractForm, "scheduleA.commercial.remainingPaymentTrigger")}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setContractField(
                          "scheduleA.commercial.remainingPaymentTrigger",
                          e.target.value
                        )
                      }
                    />
                  </>
                ) : null}

                {activePaymentType === PAYMENT_TYPE.MILESTONE ? (
                  <CommercialMilestonesEditor
                    rows={contractForm.scheduleA.commercial.milestones}
                    error={formErrors["scheduleA.commercial.milestones"]}
                    onChange={(rows) =>
                      setContractField("scheduleA.commercial.milestones", rows)
                    }
                  />
                ) : null}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FloatingSelect
                    label="Payment Processor Fees Borne By"
                    info={SIDEBAR_TOOLTIPS.processorFeesBorneBy}
                    value={getAtPath(
                      contractForm,
                      "scheduleA.commercial.paymentProcessorFeesBorneBy"
                    )}
                    onValueChange={(value) =>
                      setContractField(
                        "scheduleA.commercial.paymentProcessorFeesBorneBy",
                        value
                      )
                    }
                    searchable={false}
                  >
                    {PROCESSOR_FEE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </FloatingSelect>

                  <FloatingInput
                    id="processor-fees-notes"
                    label="Payment Processor Fee Notes"
                    info={SIDEBAR_TOOLTIPS.processorFeesNotes}
                    value={getAtPath(
                      contractForm,
                      "scheduleA.commercial.paymentProcessorFeesNotes"
                    )}
                    onValueChange={(value: string) =>
                      setContractField(
                        "scheduleA.commercial.paymentProcessorFeesNotes",
                        value
                      )
                    }
                  />
                </div>

                <LabeledTextarea
                  id="lane-a-marketplace-fee-note"
                  label="Lane A Marketplace Fee Note"
                  info={SIDEBAR_TOOLTIPS.laneAMarketplaceFeeNote}
                  value={getAtPath(
                    contractForm,
                    "scheduleA.commercial.laneAMarketplaceFeeNote"
                  )}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField(
                      "scheduleA.commercial.laneAMarketplaceFeeNote",
                      e.target.value
                    )
                  }
                  disabled
                />
              </div>
            </SidebarSection>

            <SidebarSection
              title="Raw Files & Reporting"
              icon={<ClipboardText className="h-4 w-4" />}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FloatingSelect
                  label="Raw / Source File Delivery"
                  info={SIDEBAR_TOOLTIPS.rawSourceFileDelivery}
                  value={getAtPath(contractForm, "scheduleA.rawFiles.rawSourceFileDelivery")}
                  onValueChange={(value) =>
                    setContractField("scheduleA.rawFiles.rawSourceFileDelivery", value)
                  }
                  searchable={false}
                >
                  {RAW_FILE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>

                <FloatingInput
                  id="raw-files-format"
                  label="Format"
                  info={SIDEBAR_TOOLTIPS.rawFilesFormat}
                  value={getAtPath(contractForm, "scheduleA.rawFiles.format")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.rawFiles.format", value)
                  }
                />

                <FloatingDateInput
                  id="raw-files-delivery-due"
                  label="Delivery Due"
                  info={SIDEBAR_TOOLTIPS.rawFilesDeliveryDue}
                  type="date"
                  value={getAtPath(contractForm, "scheduleA.rawFiles.deliveryDue")}
                  min={todayStr}
                  onValueChange={(value) =>
                    setContractField("scheduleA.rawFiles.deliveryDue", value)
                  }
                />

                <FloatingDateInput
                  id="analytics-reporting-deadline"
                  label="Analytics Reporting Deadline"
                  info={SIDEBAR_TOOLTIPS.analyticsReportingDeadline}
                  type="date"
                  value={getAtPath(
                    contractForm,
                    "scheduleA.rawFiles.analyticsReportingDeadline"
                  )}
                  min={todayStr}
                  onValueChange={(value) =>
                    setContractField(
                      "scheduleA.rawFiles.analyticsReportingDeadline",
                      value
                    )
                  }
                />

                <FloatingTagInput
                  label="Analytics Reporting Items"
                  info={SIDEBAR_TOOLTIPS.analyticsReportingItems}
                  value={csvToTags(
                    getAtPath(contractForm, "scheduleA.rawFiles.analyticsReportingItems")
                  )}
                  options={[]}
                  onValueChange={(next) =>
                    setContractField(
                      "scheduleA.rawFiles.analyticsReportingItems",
                      tagsToCsv(next)
                    )
                  }
                  dropdownDirection="up"
                />
              </div>
            </SidebarSection>

            <SidebarSection title="Shipping & Returns" icon={<Info className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FloatingSelect
                  label="Product Shipping Applicable"
                  info={SIDEBAR_TOOLTIPS.productShippingApplicable}
                  value={getAtPath(
                    contractForm,
                    "scheduleA.shipping.productShippingApplicable"
                  )}
                  onValueChange={(value) =>
                    setContractField("scheduleA.shipping.productShippingApplicable", value)
                  }
                  searchable={false}
                >
                  {SHIPPING_APPLICABLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>

                <FloatingSelect
                  label="Product Returnable"
                  info={SIDEBAR_TOOLTIPS.productReturnable}
                  value={getAtPath(contractForm, "scheduleA.shipping.productReturnable")}
                  onValueChange={(value) =>
                    setContractField("scheduleA.shipping.productReturnable", value)
                  }
                  searchable={false}
                >
                  {RETURNABLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>

                <FloatingInput
                  id="ship-to-name"
                  label="Ship-To Name"
                  info={SIDEBAR_TOOLTIPS.shipToName}
                  value={getAtPath(contractForm, "scheduleA.shipping.shipToName")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.shipping.shipToName", value)
                  }
                />

                <FloatingInput
                  id="ship-to-phone"
                  label="Ship-To Phone"
                  info={SIDEBAR_TOOLTIPS.shipToPhone}
                  value={getAtPath(contractForm, "scheduleA.shipping.shipToPhone")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.shipping.shipToPhone", value)
                  }
                />

                <LabeledTextarea
                  id="ship-to-address"
                  label="Ship-To Address"
                  info={SIDEBAR_TOOLTIPS.shipToAddress}
                  value={getAtPath(contractForm, "scheduleA.shipping.shipToAddress")}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField("scheduleA.shipping.shipToAddress", e.target.value)
                  }
                />

                <FloatingDateInput
                  id="product-receipt-confirmation-deadline"
                  label="Product Receipt Confirmation Deadline"
                  info={SIDEBAR_TOOLTIPS.productReceiptConfirmationDeadline}
                  type="date"
                  value={getAtPath(
                    contractForm,
                    "scheduleA.shipping.productReceiptConfirmationDeadline"
                  )}
                  min={todayStr}
                  onValueChange={(value) =>
                    setContractField(
                      "scheduleA.shipping.productReceiptConfirmationDeadline",
                      value
                    )
                  }
                />

                <FloatingInput
                  id="return-window-method"
                  label="Return Window / Method"
                  info={SIDEBAR_TOOLTIPS.returnWindowMethod}
                  value={getAtPath(contractForm, "scheduleA.shipping.returnWindowMethod")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.shipping.returnWindowMethod", value)
                  }
                />

                <LabeledTextarea
                  id="risk-of-loss-notes"
                  label="Risk of Loss Notes"
                  info={SIDEBAR_TOOLTIPS.riskOfLossNotes}
                  value={getAtPath(contractForm, "scheduleA.shipping.riskOfLossNotes")}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField("scheduleA.shipping.riskOfLossNotes", e.target.value)
                  }
                />
              </div>
            </SidebarSection>

            <SidebarSection
              title="Usage Rights"
              icon={<SealCheck className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <FloatingMultiSelect
                  label="Granted Usage Rights"
                  info={SIDEBAR_TOOLTIPS.grantedUsageRights}
                  value={selectedUsageRights}
                  options={usageRightOptions}
                  onValueChange={(next) => setSelectedUsageRights(next)}
                  includeAll={false}
                  searchable={false}
                />

                <div className="space-y-3">
                  {contractForm.scheduleA.usageRights.rows
                    .filter((row) => row.selected)
                    .map((row) => (
                      <div
                        key={row.id}
                        className="rounded-xl border border-gray-200 bg-white p-3"
                      >
                        <div className="mb-3 text-sm font-semibold text-gray-800">
                          {row.usageRight}
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <FloatingInput
                            id={`usage-duration-${row.id}`}
                            label="Duration"
                            info={SIDEBAR_TOOLTIPS.usageDuration}
                            value={row.duration}
                            onValueChange={(value: string) =>
                              setContractField(
                                "scheduleA.usageRights.rows",
                                contractForm.scheduleA.usageRights.rows.map((item) =>
                                  item.id === row.id ? { ...item, duration: value } : item
                                )
                              )
                            }
                          />

                          <FloatingInput
                            id={`usage-territory-${row.id}`}
                            label="Territory / Notes"
                            info={SIDEBAR_TOOLTIPS.usageTerritoryNotes}
                            value={row.territoryNotes}
                            onValueChange={(value: string) =>
                              setContractField(
                                "scheduleA.usageRights.rows",
                                contractForm.scheduleA.usageRights.rows.map((item) =>
                                  item.id === row.id
                                    ? { ...item, territoryNotes: value }
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
                  <FloatingSelect
                    label="Attribution Requirement"
                    info={SIDEBAR_TOOLTIPS.attributionRequirement}
                    value={getAtPath(
                      contractForm,
                      "scheduleA.usageRights.attributionRequirement"
                    )}
                    onValueChange={(value) =>
                      setContractField("scheduleA.usageRights.attributionRequirement", value)
                    }
                    searchable={false}
                  >
                    {ATTRIBUTION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </FloatingSelect>

                  <FloatingSelect
                    label="Editing Rights"
                    info={SIDEBAR_TOOLTIPS.editingRights}
                    value={getAtPath(contractForm, "scheduleA.usageRights.editingRights")}
                    onValueChange={(value) =>
                      setContractField("scheduleA.usageRights.editingRights", value)
                    }
                    searchable={false}
                  >
                    {EDITING_RIGHTS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </FloatingSelect>
                </div>

                <FloatingInput
                  id="attribution-text"
                  label="Attribution Text"
                  info={SIDEBAR_TOOLTIPS.attributionText}
                  value={getAtPath(contractForm, "scheduleA.usageRights.attributionText")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.usageRights.attributionText", value)
                  }
                />

                <FloatingSelect
                  label="Music / Stock Asset Responsibility"
                  info={SIDEBAR_TOOLTIPS.musicStockAssetResponsibility}
                  value={getAtPath(
                    contractForm,
                    "scheduleA.usageRights.musicStockAssetResponsibility"
                  )}
                  onValueChange={(value) =>
                    setContractField(
                      "scheduleA.usageRights.musicStockAssetResponsibility",
                      value
                    )
                  }
                  searchable={false}
                >
                  {MUSIC_RESPONSIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>
              </div>
            </SidebarSection>

            <SidebarSection
              title="Compliance & Brand Safety"
              icon={<Info className="h-4 w-4" />}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <LabeledTextarea
                  id="creative-brief-mandatory-talking-points"
                  label="Creative Brief / Mandatory Talking Points"
                  info={SIDEBAR_TOOLTIPS.creativeBrief}
                  value={getAtPath(
                    contractForm,
                    "scheduleA.compliance.creativeBriefMandatoryTalkingPoints"
                  )}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField(
                      "scheduleA.compliance.creativeBriefMandatoryTalkingPoints",
                      e.target.value
                    )
                  }
                />

                <LabeledTextarea
                  id="restricted-statements"
                  label="Restricted Statements"
                  info={SIDEBAR_TOOLTIPS.restrictedStatements}
                  value={getAtPath(contractForm, "scheduleA.compliance.restrictedStatements")}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField("scheduleA.compliance.restrictedStatements", e.target.value)
                  }
                />
              </div>
            </SidebarSection>

            <SidebarSection
              title="Exclusivity & Morals"
              icon={<SealCheck className="h-4 w-4" />}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FloatingInput
                  id="competitor-blackout"
                  label="Competitor Blackout"
                  info={SIDEBAR_TOOLTIPS.competitorBlackout}
                  value={getAtPath(contractForm, "scheduleA.exclusivity.competitorBlackout")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.exclusivity.competitorBlackout", value)
                  }
                />

                <FloatingTagInput
                  label="Category / Competitor List"
                  info={SIDEBAR_TOOLTIPS.categoryCompetitorList}
                  value={csvToTags(
                    getAtPath(contractForm, "scheduleA.exclusivity.categoryCompetitorList")
                  )}
                  options={[]}
                  onValueChange={(next) =>
                    setContractField(
                      "scheduleA.exclusivity.categoryCompetitorList",
                      tagsToCsv(next)
                    )
                  }
                  dropdownDirection="up"
                />

                <FloatingInput
                  id="blackout-period"
                  label="Blackout Period"
                  info={SIDEBAR_TOOLTIPS.blackoutPeriod}
                  value={getAtPath(contractForm, "scheduleA.exclusivity.blackoutPeriod")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.exclusivity.blackoutPeriod", value)
                  }
                />

                <FloatingSelect
                  label="Optional Morals Clause"
                  info={SIDEBAR_TOOLTIPS.optionalMoralsClause}
                  value={getAtPath(
                    contractForm,
                    "scheduleA.exclusivity.optionalMoralsClause"
                  )}
                  onValueChange={(value) =>
                    setContractField("scheduleA.exclusivity.optionalMoralsClause", value)
                  }
                  searchable={false}
                >
                  {MORALS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>
              </div>
            </SidebarSection>

            <SidebarSection
              title="Cancellation & Refunds"
              icon={<Info className="h-4 w-4" />}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <LabeledTextarea
                  id="kill-fee-or-prorata"
                  label="Kill Fee / Pro-Rata"
                  info={SIDEBAR_TOOLTIPS.killFeeOrProrata}
                  value={getAtPath(contractForm, "scheduleA.cancellation.killFeeOrProrata")}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField("scheduleA.cancellation.killFeeOrProrata", e.target.value)
                  }
                />

                <LabeledTextarea
                  id="refund-of-unearned-advance"
                  label="Refund of Unearned Advance"
                  info={SIDEBAR_TOOLTIPS.refundOfUnearnedAdvance}
                  value={getAtPath(
                    contractForm,
                    "scheduleA.cancellation.refundOfUnearnedAdvance"
                  )}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField(
                      "scheduleA.cancellation.refundOfUnearnedAdvance",
                      e.target.value
                    )
                  }
                />
              </div>
            </SidebarSection>

            <SidebarSection title="Dispute & Notices" icon={<FileText className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FloatingInput
                  id="governing-law"
                  label="Governing Law"
                  info={SIDEBAR_TOOLTIPS.governingLaw}
                  value={getAtPath(contractForm, "scheduleA.dispute.governingLaw")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.dispute.governingLaw", value)
                  }
                />

                <FloatingSelect
                  label="Dispute Resolution Method"
                  info={SIDEBAR_TOOLTIPS.disputeResolutionMethod}
                  value={getAtPath(
                    contractForm,
                    "scheduleA.dispute.disputeResolutionMethod"
                  )}
                  onValueChange={(value) =>
                    setContractField("scheduleA.dispute.disputeResolutionMethod", value)
                  }
                  searchable={false}
                  required
                >
                  {DISPUTE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>

                <FloatingInput
                  id="dispute-venue"
                  label="Venue"
                  info={SIDEBAR_TOOLTIPS.disputeVenue}
                  value={getAtPath(contractForm, "scheduleA.dispute.disputeVenue")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.dispute.disputeVenue", value)
                  }
                />

                <FloatingInput
                  id="arbitration-seat"
                  label="Arbitration Seat"
                  info={SIDEBAR_TOOLTIPS.arbitrationSeat}
                  value={getAtPath(contractForm, "scheduleA.dispute.arbitrationSeat")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.dispute.arbitrationSeat", value)
                  }
                />

                <FloatingSelect
                  label="Attorneys’ Fees"
                  info={SIDEBAR_TOOLTIPS.attorneysFees}
                  value={getAtPath(contractForm, "scheduleA.dispute.attorneysFees")}
                  onValueChange={(value) =>
                    setContractField("scheduleA.dispute.attorneysFees", value)
                  }
                  searchable={false}
                >
                  {ATTORNEYS_FEES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>
              </div>
            </SidebarSection>
            {signatureStatus === "checking" ? (
              <SidebarSection title="Signature" icon={<Signature className="h-4 w-4" />}>
                <div className="text-sm text-gray-500">Checking active signature…</div>
              </SidebarSection>
            ) : signatureStatus === "exists" ? (
              <div id="signature-section">
                <SidebarSection title="Signature" icon={<Signature className="h-4 w-4" />}>
                  <SignatureAgreementBlock
                    signerName={
                      contractForm.influencer.legalName ||
                      contractForm.influencer.contactName ||
                      primaryInfluencer?.name
                    }
                    signatureSrc={activeBrandSignatureSrc}
                    tab={inlineSignatureTab}
                    onTabChange={setInlineSignatureTab}
                    drawnSig={inlineDrawnSig}
                    onDrawnSigChange={setInlineDrawnSig}
                    agreed={inlineAgreed}
                    onAgreeChange={(value) => {
                      setInlineAgreed(value);
                      if (value) setInlineShowError(false);
                    }}
                    showError={inlineShowError}
                    brandId={resolvedBrandId || undefined}
                    onSignatureChange={(newSrc) => setActiveBrandSignatureSrc(newSrc)}
                  />
                </SidebarSection>
              </div>
            ) : null}

          </>
        )}
      </ContractSidebarShell>

      {resolvedBrandId ? (
        <SignatureModal
          open={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onConfirm={async () => {
            setShowSignatureModal(false);
            const { signatureData, signatureId } = await getLatestBrandSignature();
            await handleActualSubmit(signatureData, signatureId);
          }}
          isLoading={isSubmitLoading}
          signerName={
            contractForm.influencer.legalName ||
            contractForm.influencer.contactName ||
            primaryInfluencer?.name
          }
          brandId={resolvedBrandId}
        />
      ) : null}
    </TooltipProvider>
  );
}

export function ContractSidebarShell({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  campaignPaymentType,
  onCampaignPaymentTypeChange,
  previewUrl,
  previewBlob,
  onClosePreview,
  onDownload,
  isDownloading,
  onOpenInNewTab,
  footer,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  subtitle: string;
  campaignPaymentType?: PaymentType;
  onCampaignPaymentTypeChange: (value: string) => void;
  previewUrl: string;
  previewBlob: Blob | null;
  onClosePreview: () => void;
  onDownload: () => void;
  isDownloading?: boolean;
  onOpenInNewTab: () => void;
  footer: React.ReactNode;
}) {

  const contractTypeLabel = campaignPaymentType
    ? CONTRACT_TYPE_LABELS[campaignPaymentType]
    : "";

  return (
    <div
      className={`absolute inset-0 z-[120] isolate ${isOpen ? "" : "pointer-events-none"
        }`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
          }`}
        onClick={onClose}
      />

      <div
        className={`absolute inset-0 overflow-hidden bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="relative z-10 h-20 border-b border-[#e5e5e5] bg-white">
          <div className="flex h-full items-center justify-between px-6">
            <div className="min-w-0">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#9d9d9d]">
                {title}
              </div>
              {/* <div className="truncate text-lg font-bold text-[#1a1a1a]">
                {subtitle}
              </div> */}
              <div className="mt-1">
                <select
                  value={campaignPaymentType}
                  onChange={(e) => onCampaignPaymentTypeChange(e.target.value)}
                  className="border-0 bg-transparent p-0 pr-5 text-xs font-medium text-[#1a1a1a] outline-none focus:outline-none"
                  aria-label="Campaign payment type"
                >
                  {PAYMENT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {CONTRACT_TYPE_LABELS[option.value as PaymentType]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={onOpenInNewTab}
                variant="raised"
                className="!bg-white !text-black !shadow-none cursor-pointer hover:!bg-white hover:!text-black hover:!shadow-none active:!bg-white"
              >
                <ArrowSquareInIcon size={16} />
              </Button>
              <Button
                variant="solid"
                onClick={onDownload}
                disabled={isDownloading}
                className="inline-flex items-center rounded-lg border cursor-pointer border-[#e8e8e8] px-4 py-2 !bg-white !text-black !shadow-none"
              >
                <span className="mr-2 inline-flex">
                  <DownloadSimpleIcon />
                </span>
                <span>{isDownloading ? "Downloading..." : "Download"}</span>
              </Button>
              <Button
                type="button"
                className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e8e8e8] bg-white !text-black hover:!bg-white "
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex h-[calc(100%-160px)] bg-white">
          <div className="h-full w-full overflow-auto px-6 py-5 space-y-5 xl:w-1/2">
            {children}
          </div>

          {previewUrl ? (
            <div className="hidden xl:flex xl:w-1/2 flex-col border-l border-gray-100 bg-white">
              <div className="flex-1 min-h-0">
                {previewBlob ? <MinimalPdfPreview file={previewBlob} /> : null}
              </div>
            </div>
          ) : (
            <div className="hidden xl:flex xl:w-1/2 items-center justify-center border-l border-gray-100 bg-white p-6 text-gray-400">
              <div className="text-center">
                <Eye className="mx-auto mb-2 h-8 w-8" />
                <div className="text-sm">Generate a preview to see the PDF here and send contract</div>
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 h-[80px] border-t border-gray-200 bg-white px-6 flex items-center justify-between">
          <div className="truncate text-lg font-bold text-[#1a1a1a]">
            {subtitle}
          </div>
          <div className="flex h-full items-center justify-end gap-3">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarSection({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
        {icon ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] text-white">
            {icon}
          </div>
        ) : null}
        <div className="font-semibold text-gray-800">{title}</div>
      </div>
      {children}
    </div>
  );
}

function CommercialMilestonesEditor({
  rows,
  onChange,
  error,
}: {
  rows: ContractMilestone[];
  onChange: (rows: ContractMilestone[]) => void;
  error?: string;
}) {
  const updateRow = (
    id: string,
    key: keyof Omit<ContractMilestone, "id">,
    value: string
  ) => {
    onChange(rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const addRow = () => {
    onChange([...rows, createDefaultCommercialMilestone(rows.length + 1)]);
  };

  const removeRow = (id: string) => {
    onChange(rows.length > 1 ? rows.filter((row) => row.id !== id) : rows);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-800">Milestones</div>
        <Button type="button" variant="outline" onClick={addRow}>
          + Add Milestone
        </Button>
      </div>

      {error ? <div className="text-xs text-red-600">{error}</div> : null}

      {rows.map((row, index) => (
        <div key={row.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Milestone #{index + 1}</div>
            {rows.length > 1 ? (
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => removeRow(row.id)}
              >
                Remove
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FloatingInput
              label="Milestone Name"
              value={row.milestoneName}
              onValueChange={(value: string) =>
                updateRow(row.id, "milestoneName", value)
              }
            />

            <FloatingInput
              label="Payment Amount"
              type="number"
              value={row.paymentAmount}
              onValueChange={(value: string) =>
                updateRow(row.id, "paymentAmount", value)
              }
            />

            <FloatingDateInput
              label="Due Date"
              type="date"
              value={row.dueDate}
              min={toInputDate(new Date())}
              onValueChange={(value) => updateRow(row.id, "dueDate", value)}
            />

            <LabeledTextarea
              label="Trigger Event"
              value={row.triggerEvent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateRow(row.id, "triggerEvent", e.target.value)
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SignatureAgreementBlock({
  signerName,
  signatureSrc,
  tab,
  onTabChange,
  drawnSig,
  onDrawnSigChange,
  agreed,
  onAgreeChange,
  showError,
  brandId,
  onSignatureChange,
}: {
  signerName?: string;
  signatureSrc?: string;
  tab: "default" | "draw";
  onTabChange: (tab: "default" | "draw") => void;
  drawnSig: string;
  onDrawnSigChange: (dataUrl: string) => void;
  agreed: boolean;
  onAgreeChange: (v: boolean) => void;
  showError: boolean;
  brandId?: string;
  onSignatureChange?: (newSrc: string) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [previewSrc, setPreviewSrc] = React.useState(signatureSrc || "");

  React.useEffect(() => {
    setPreviewSrc(signatureSrc || "");
  }, [signatureSrc]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !brandId) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewSrc(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      await apipostSignatureUpload({ brandId, signature: file });
      onSignatureChange?.(URL.createObjectURL(file));
      toast({ icon: "success", title: "Signature updated" });
    } catch (err: any) {
      toast({ icon: "error", title: "Upload failed", text: err?.message || "Could not upload signature." });
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Signature display — click to upload */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-2xl bg-[#f7f7f7] border border-gray-200 border-dashed px-6 py-6 min-h-[130px] flex items-center justify-center relative group hover:border-gray-400 transition-colors"
        disabled={uploading}
      >
        {uploading ? (
          <div className="text-sm text-gray-500 animate-pulse">Uploading…</div>
        ) : previewSrc ? (
          <>
            <img
              src={previewSrc}
              alt="Brand signature"
              className="max-h-[100px] max-w-full object-contain"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm transition-opacity">
                Click to change
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <Signature className="h-8 w-8" />
            <span className="text-xs">Click to upload signature</span>
          </div>
        )}
      </button>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Signature size={14} weight="regular" />
          Signature is selected as primary
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-black transition-colors"
        >
          Change signature
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${showError ? "border-red-200 bg-red-50/60" : "border-gray-200 bg-white"
        }`}>
        <Toggle checked={agreed} onChange={onAgreeChange} />
        <p className="text-sm text-gray-700 leading-relaxed">
          By signing, I confirm that I have read and therefore agree to all
          contractual terms, which I acknowledge are legally binding.
        </p>
      </div>

      {showError && (
        <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">!</span>
          <p className="text-sm font-medium text-red-600">
            Please confirm that you agree to all terms before signing the contract.
          </p>
        </div>
      )}
    </div>
  );
}


function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${checked ? "bg-black" : "bg-gray-200"
        }`}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"
          }`}
      />
    </button>
  );
}