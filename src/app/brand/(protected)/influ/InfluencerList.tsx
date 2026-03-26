"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

import api from "@/lib/api";
import { post } from "@/lib/api";
import InfluencerFilter, { FilterState } from "./InfluencerFilter";
import {
  InfluencerTable,
  type InfluencerRow,
} from "@/components/ui/brand/Influencertable";
import AddMilestoneCard from "@/components/ui/brand/AddMilestoneCard";

import { Button } from "@/components/ui/button";
import {
  CircleNotch,
  DotsThree,
  EnvelopeOpen,
  SealCheck,
  Signature,
} from "@phosphor-icons/react";

import {
  apiGetListByCampaign,
  apiSetApplicantDecisionStatus,
  type ApplicantDecisionField,
  getApiErrorMessage,
} from "@/app/brand/services/brandApi";
import ContractSidebarExtracted from "./ContractSidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "all" | "active" | "shortlisted" | "undecided" | "rejected";

type ContractMeta = {
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
  confirmations?: {
    brand?: { confirmed?: boolean };
    influencer?: { confirmed?: boolean };
  };
  signatures?: {
    brand?: { signed?: boolean; byUserId?: string; name?: string; email?: string; at?: string };
    influencer?: { signed?: boolean };
    collabglam?: { signed?: boolean };
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────

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

const PAGE_LIMIT = 20;

// ─── Route helpers ────────────────────────────────────────────────────────────

function getTabFromPath(pathname: string | null): Tab {
  const p = pathname ?? "";
  if (p.includes("/brand/influ/shortlisted")) return "shortlisted";
  if (p.includes("/brand/influ/active")) return "active";
  if (p.includes("/brand/influ/undecided")) return "undecided";
  if (p.includes("/brand/influ/rejected")) return "rejected";
  return "all";
}

// ─── Applicant display helpers ────────────────────────────────────────────────

function toHandle(v: unknown) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s.startsWith("@") ? s : `@${s}`;
}

function getApplicantDisplayStatus(a: any) {
  if (Number(a?.isAccepted) === 1) return "Active";
  if (Number(a?.isRejected) === 1) return "Rejected";
  if (Number(a?.isShortlisted) === 1) return "Shortlisted";
  if (Number(a?.isUndicided) === 1) return "Undecided";
  if (Number(a?.isAssigned) === 1) return "Shortlisted";
  return "Applied";
}

function doesApplicantBelongToTab(raw: any, tab: Tab) {
  const isAccepted = Number(raw?.isAccepted) === 1;
  const isShortlisted = Number(raw?.isShortlisted) === 1;
  const isUndicided = Number(raw?.isUndicided) === 1;
  const isRejected = Number(raw?.isRejected) === 1;

  if (tab === "all") return !isShortlisted && !isUndicided && !isRejected;
  if (tab === "shortlisted") return isShortlisted;
  if (tab === "undecided") return isUndicided;
  if (tab === "rejected") return isRejected;
  if (tab === "active") return isAccepted;
  return true;
}

function mapApplicantToRow(a: any): InfluencerRow {
  const influencerId = String(a?.influencerId ?? "").trim();
  const name = String(a?.name ?? "Influencer").trim();
  const createdAtRaw = a?.createdAt ? String(a.createdAt) : "";
  const appliedDate = createdAtRaw ? createdAtRaw.slice(0, 10) : "—";

  const row: any = {
    id: influencerId,
    profile: { name, handle: a?.handle ? toHandle(a.handle) : "—" },
    category: String(a?.category ?? "—").trim() || "—",
    followers: Number(a?.audienceSize ?? 0) || 0,
    engagement: 0,
    appliedDate,
    status: getApplicantDisplayStatus(a),
    budget: Number(a?.feeAmount ?? 0) > 0 ? String(a.feeAmount) : "—",
    __source: "applicant",
    __raw: a,
  };
  return row as InfluencerRow;
}

// ─── Contract status helpers ──────────────────────────────────────────────────

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

function hasExistingContract(raw: any, meta?: ContractMeta | null) {
  return Boolean(
    meta?.contractId ||
    raw?.contractId ||
    Number(raw?.isAssigned) === 1 ||
    Number(raw?.isContracted) === 1
  );
}

function needsBrandAcceptance(status?: string | null) {
  return status === CONTRACT_STATUS.INFLUENCER_ACCEPTED;
}

function canSignNow(meta?: ContractMeta | null) {
  return (
    meta?.status === CONTRACT_STATUS.READY_TO_SIGN &&
    !meta?.signatures?.brand?.signed
  );
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

function hasMilestonesCreated(meta?: ContractMeta | null) {
  if (!meta) return false;
  const status = String(meta.status || "").toUpperCase();

  return (
    status === CONTRACT_STATUS.MILESTONES_CREATED ||
    Boolean((meta as any)?.hasMilestones) ||
    Boolean(meta.flags?.hasMilestones) ||
    Boolean(meta.statusFlags?.hasMilestones)
  );
}

/**
 * Returns the button label AND whether clicking it should open the PDF
 * directly (viewOnly: true) or open the contract editor sidebar (false).
 */
function getPrimaryAction(
  raw: any,
  meta?: ContractMeta | null
): { label: string; viewOnly: boolean } {
  const statusStr = String(meta?.status || "");
  const locked = isLockedStatus(statusStr);

  if (!hasExistingContract(raw, meta)) return { label: "Send Contract", viewOnly: false };
  if (isRejectedMeta(meta)) return { label: "Resend Contract", viewOnly: false };
  if (locked) return { label: "View Contract", viewOnly: true };
  if (isEditableStatus(statusStr)) return { label: "Update Contract", viewOnly: false };
  return { label: "View Contract", viewOnly: true };
}

// ─── Toast / confirm helpers ──────────────────────────────────────────────────

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

// ─── ActionButtons ────────────────────────────────────────────────────────────

function ActionButtons({
  primaryLabel,
  onPrimary,
  onManage,
  onMail,
  onMore,
  showAccept,
  onAccept,
  showSign,
  onSign,
}: {
  primaryLabel: string;
  onPrimary: () => void;
  onManage: () => void;
  onMail: () => void;
  onMore: () => void;
  showAccept?: boolean;
  onAccept?: () => void;
  showSign?: boolean;
  onSign?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrimary}
        className="inline-flex h-8 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white px-3 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F7F7F7]"
      >
        {primaryLabel}
      </button>

      {showAccept && onAccept ? (
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-[0.5rem] border border-[#E6E6E6] bg-white px-3 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F7F7F7]"
        >
          <SealCheck size={14} weight="fill" className="text-emerald-600" />
          Accept
        </button>
      ) : null}

      {showSign && onSign ? (
        <button
          type="button"
          onClick={onSign}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-[0.5rem] bg-[#1A1A1A] px-3 text-[12px] font-medium text-white hover:opacity-90"
        >
          <Signature size={14} />
          Sign
        </button>
      ) : null}

      <button
        type="button"
        onClick={onManage}
        className="inline-flex h-8 items-center justify-center rounded-[0.5rem] bg-[#1A1A1A] px-4 text-[12px] font-medium text-white hover:opacity-90"
      >
        Manage
      </button>

      <button
        type="button"
        onClick={onMail}
        aria-label="Open inbox"
        className="relative flex h-8 w-8 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white hover:bg-[#F7F7F7]"
      >
        <EnvelopeOpen size={18} weight="regular" />
        <span
          aria-hidden="true"
          className="absolute right-[0.35rem] top-[0.35rem] h-[0.375rem] w-[0.375rem] rounded-full bg-[#28A745]"
        />
      </button>

      <button
        type="button"
        onClick={onMore}
        aria-label="More actions"
        className="flex h-8 w-8 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white hover:bg-[#F7F7F7]"
      >
        <DotsThree size={18} weight="bold" />
      </button>
    </div>
  );
}

// ─── ActiveMilestoneActions ───────────────────────────────────────────────────

function ActiveMilestoneActions({
  onAddMilestone,
  showViewMilestone,
  onViewMilestone,
  onManage,
  onMail,
  onMore,
  showAccept,
  onAccept,
  showSign,
  onSign,
}: {
  onAddMilestone: () => void;
  showViewMilestone: boolean;
  onViewMilestone: () => void;
  onManage: () => void;
  onMail: () => void;
  onMore: () => void;
  showAccept?: boolean;
  onAccept?: () => void;
  showSign?: boolean;
  onSign?: () => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onAddMilestone}
          className="inline-flex h-8 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white px-3 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F7F7F7]"
        >
          Add Milestone
        </button>

        {showViewMilestone ? (
          <button
            type="button"
            onClick={onViewMilestone}
            className="inline-flex h-8 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white px-3 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F7F7F7]"
          >
            View Milestone
          </button>
        ) : null}
      </div>

      {showAccept && onAccept ? (
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-[0.5rem] border border-[#E6E6E6] bg-white px-3 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F7F7F7]"
        >
          <SealCheck size={14} weight="fill" className="text-emerald-600" />
          Accept
        </button>
      ) : null}

      {showSign && onSign ? (
        <button
          type="button"
          onClick={onSign}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-[0.5rem] bg-[#1A1A1A] px-3 text-[12px] font-medium text-white hover:opacity-90"
        >
          <Signature size={14} />
          Sign
        </button>
      ) : null}

      <button
        type="button"
        onClick={onManage}
        className="inline-flex h-8 items-center justify-center rounded-[0.5rem] bg-[#1A1A1A] px-4 text-[12px] font-medium text-white hover:opacity-90"
      >
        Manage
      </button>

      <button
        type="button"
        onClick={onMail}
        aria-label="Open inbox"
        className="relative flex h-8 w-8 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white hover:bg-[#F7F7F7]"
      >
        <EnvelopeOpen size={18} weight="regular" />
        <span
          aria-hidden="true"
          className="absolute right-[0.35rem] top-[0.35rem] h-[0.375rem] w-[0.375rem] rounded-full bg-[#28A745]"
        />
      </button>

      <button
        type="button"
        onClick={onMore}
        aria-label="More actions"
        className="flex h-8 w-8 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white hover:bg-[#F7F7F7]"
      >
        <DotsThree size={18} weight="bold" />
      </button>
    </div>
  );
}

// ─── SignatureModal ───────────────────────────────────────────────────────────

function SignatureModal({
  isOpen,
  onClose,
  onSigned,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSigned: (signatureDataUrl: string) => Promise<void> | void;
}) {
  const [sigDataUrl, setSigDataUrl] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSigDataUrl("");
      setError("");
      setFileName("");
      setFileSize(null);
      setIsDragging(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
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
    if (isSubmitting || !file) return;
    setError("");
    setIsDragging(false);
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
      if (!isSubmitting) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }
    };

    const onDragEnter = (e: DragEvent) => {
      if (!isSubmitting) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }
    };

    const onDragLeave = (e: DragEvent) => {
      if (!isSubmitting) {
        e.preventDefault();
        e.stopPropagation();
        if (e.target === el) setIsDragging(false);
      }
    };

    const onDrop = (e: DragEvent) => {
      if (!isSubmitting) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFile(e.dataTransfer?.files?.[0]);
      }
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
  }, [isOpen, isSubmitting]);

  if (!isOpen) return null;

  const handleSignClick = async () => {
    if (isSubmitting) return;
    if (!sigDataUrl) {
      setError("Please select a signature image first.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSigned(sigDataUrl);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] ${isSubmitting ? "pointer-events-none" : ""}`}
        onClick={() => !isSubmitting && onClose()}
      />
      <div className="relative z-[61] w-[96%] max-w-xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div
          className="relative h-24"
          style={{ background: "linear-gradient(135deg,#1A1A1A 0%,#2A2A2A 100%)" }}
        >
          <div className="relative z-10 flex h-full items-center justify-between px-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-sm font-semibold">
                ✍️
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-wide sm:text-base">
                  Sign as Brand
                </span>
                <span className="text-xs text-white/80">
                  Upload your official signature to finalize the document.
                </span>
              </div>
            </div>
            <button
              className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg hover:bg-white/30 ${isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm text-gray-700">
            Upload your signature image <span className="font-semibold">(PNG/JPG, ≤ 50 KB)</span>.
          </p>

          <div
            ref={dropRef}
            className={`cursor-pointer select-none rounded-xl border-2 border-dashed p-5 text-center text-sm transition-all ${isDragging
                ? "border-[#1A1A1A] bg-neutral-100"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100/80"
              }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                <span className="text-lg">📁</span>
              </div>
              <div className="font-medium text-gray-800">
                {isDragging ? "Drop your signature here" : "Drag & drop your signature here"}
              </div>
              <div className="text-xs text-gray-500">or use the file picker below</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">Signature file</label>
            <input
              type="file"
              accept="image/png,image/jpeg"
              disabled={isSubmitting}
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="block w-full text-xs text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            />

            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span>Allowed: PNG, JPG · Max size: 50 KB</span>
              {fileSize !== null && (
                <span>
                  Selected:{" "}
                  <span className={fileSize > 50 * 1024 ? "font-medium text-red-600" : ""}>
                    {formatSize(fileSize)}
                  </span>
                </span>
              )}
            </div>

            {fileName && (
              <div className="truncate text-[11px] text-gray-600">
                File: <span className="font-medium">{fileName}</span>
              </div>
            )}

            {error && <div className="mt-1 flex items-center gap-1 text-xs text-red-600">⚠️ {error}</div>}
          </div>

          {sigDataUrl && (
            <div className="flex items-center gap-3 rounded-xl border bg-gray-50 p-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold text-gray-700">Signature preview</div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setSigDataUrl("");
                      setFileName("");
                      setFileSize(null);
                      setError("");
                    }}
                    className="text-[11px] text-gray-500 underline hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex items-center justify-center rounded-lg border bg-white px-3 py-2">
                  <img src={sigDataUrl} alt="Signature preview" className="max-h-14 object-contain" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-end gap-3 px-5 pb-5 pt-1 sm:flex-row">
          <Button variant="outline" onClick={() => !isSubmitting && onClose()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSignClick} disabled={!sigDataUrl || isSubmitting}>
            {isSubmitting ? "Signing…" : "Sign & continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── InfluencerList ───────────────────────────────────────────────────────────

export default function InfluencerList() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = useMemo(() => getTabFromPath(pathname), [pathname]);

  const [filters, setFilters] = useState<FilterState>({
    "Influencer Type": "",
    "Engagement Rate": "",
    Follower: "",
    Category: [],
    Platform: [],
    Date: "",
  });

  const [search, setSearch] = useState("");
  const [sortValue, setSortValue] = useState("Priority");

  const [applicantRows, setApplicantRows] = useState<InfluencerRow[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [errApplicants, setErrApplicants] = useState("");

  const [visibleCount, setVisibleCount] = useState(PAGE_LIMIT);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updatingDecisionId, setUpdatingDecisionId] = useState<string | null>(null);

  const [brandId, setBrandId] = useState<string | null>(null);
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignBudget, setCampaignBudget] = useState<number | null>(null);
  const [campaignTimeline, setCampaignTimeline] = useState<{
    startDate?: string | Date;
    endDate?: string | Date;
  } | null>(null);

  const [contractOpen, setContractOpen] = useState(false);
  const [contractTarget, setContractTarget] = useState<any | null>(null);
  const [contractTargetMeta, setContractTargetMeta] = useState<ContractMeta | null>(null);

  const [contractMetaMap, setContractMetaMap] = useState<Record<string, ContractMeta | null>>({});
  const [loadingContractMeta, setLoadingContractMeta] = useState(false);

  const [signOpen, setSignOpen] = useState(false);
  const [signTargetMeta, setSignTargetMeta] = useState<ContractMeta | null>(null);

  const [viewingPdfForId, setViewingPdfForId] = useState<string | null>(null);

  const [milestoneCreatedMap, setMilestoneCreatedMap] = useState<Record<string, boolean>>({});
  const [milestoneTargetRow, setMilestoneTargetRow] = useState<InfluencerRow | null>(null);

  const signerName =
    (typeof window !== "undefined" &&
      (localStorage.getItem("brandContactName") ||
        localStorage.getItem("brandName") ||
        "")) || "";

  const signerEmail =
    (typeof window !== "undefined" && localStorage.getItem("brandEmail")) || "";

  const campaignId = useMemo(() => {
    const q1 = searchParams.get("campaignId");
    const q2 = searchParams.get("id");
    return String(q1 ?? q2 ?? "").trim();
  }, [searchParams]);

  const tableVariant = useMemo(() => {
    if (tab === "shortlisted") return "shortlisted";
    if (tab === "active") return "active";
    return "default";
  }, [tab]);

  // ── Init brand id ──────────────────────────────────────────────────────────
  useEffect(() => {
    const id =
      localStorage.getItem("brandId") ||
      localStorage.getItem("brandID") ||
      localStorage.getItem("brand_id") ||
      "";
    setBrandId(id || null);
  }, []);

  // ── Reset pagination on tab / search change ────────────────────────────────
  useEffect(() => {
    setVisibleCount(PAGE_LIMIT);
  }, [tab, search]);

  // ── Fetch campaign summary ─────────────────────────────────────────────────
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

        setCampaignTitle(campaignName);
        if (!Number.isNaN(budgetNum)) setCampaignBudget(budgetNum);
        if (data.timeline) setCampaignTimeline(data.timeline);
      } catch {
        // ignore
      }
    })();
  }, [campaignId]);

  // ── Fetch applicants ───────────────────────────────────────────────────────
  const fetchApplicants = useCallback(async () => {
    if (!campaignId) {
      setApplicantRows([]);
      setErrApplicants("campaignId missing in URL (use ?campaignId=...)");
      return;
    }

    setLoadingApplicants(true);
    setErrApplicants("");

    try {
      const payload: any = {
        campaignId,
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
      };

      if (tab === "shortlisted") payload.isShortlisted = 1;
      if (tab === "undecided") payload.isUndicided = 1;
      if (tab === "rejected") payload.isRejected = 1;

      const res: any = await apiGetListByCampaign(payload);
      const influencers = Array.isArray(res?.influencers) ? res.influencers : [];

      let mapped = influencers
        .map(mapApplicantToRow)
        .filter((r: InfluencerRow) => String((r as any)?.id ?? "").trim());

      mapped = mapped.filter((row: InfluencerRow) =>
        doesApplicantBelongToTab((row as any)?.__raw ?? {}, tab)
      );

      const map = new Map<string, InfluencerRow>();
      mapped.forEach((r: InfluencerRow) => map.set(String((r as any).id), r));
      setApplicantRows(Array.from(map.values()));
    } catch (e) {
      setErrApplicants(getApiErrorMessage(e, "Failed to load applicants"));
    } finally {
      setLoadingApplicants(false);
    }
  }, [campaignId, search, tab]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  // ── Contract meta helpers ──────────────────────────────────────────────────
  const getLatestContractForApplicant = useCallback(
    async (rawApplicant: any): Promise<ContractMeta | null> => {
      if (!brandId || !campaignId || !rawApplicant?.influencerId) return null;

      try {
        const res: any = await api.post("/contract/getContract", {
          brandId,
          influencerId: rawApplicant.influencerId,
          campaignId,
        });
        const list = res?.data?.contracts || res?.contracts || [];
        const filtered = (list as ContractMeta[]).filter(
          (c) => String(c.campaignId) === String(campaignId)
        );
        return filtered.length ? filtered[0] : list.length ? list[0] : null;
      } catch {
        return null;
      }
    },
    [brandId, campaignId]
  );

  const loadContractMeta = useCallback(
    async (rows: InfluencerRow[]) => {
      if (!brandId || !campaignId || !rows.length) {
        setContractMetaMap({});
        return;
      }

      setLoadingContractMeta(true);
      try {
        const results = await Promise.all(
          rows.map(async (row) => {
            const raw = (row as any)?.__raw ?? null;
            const meta = await getLatestContractForApplicant(raw);
            return { influencerId: String((row as any)?.id ?? ""), meta };
          })
        );

        const nextMap: Record<string, ContractMeta | null> = {};
        results.forEach((item) => {
          nextMap[item.influencerId] = item.meta;
        });

        setContractMetaMap(nextMap);
      } finally {
        setLoadingContractMeta(false);
      }
    },
    [brandId, campaignId, getLatestContractForApplicant]
  );

  useEffect(() => {
    loadContractMeta(applicantRows);
  }, [applicantRows, loadContractMeta]);

  // ── Decision status handler ────────────────────────────────────────────────
  const handleApplicantDecision = async (
    row: InfluencerRow,
    action: ApplicantDecisionField
  ) => {
    const source = String((row as any)?.__source ?? "");
    if (source !== "applicant") return;
    if (!campaignId || !row.id) return;

    try {
      setUpdatingDecisionId(row.id);
      const res = await apiSetApplicantDecisionStatus({
        campaignId,
        influencerId: row.id,
        field: action,
      });

      const updatedApplicant = res?.applicant;
      if (!updatedApplicant) return;

      setApplicantRows((prev) =>
        prev.flatMap((r) => {
          if (r.id !== row.id) return [r];

          const prevRaw = (r as any)?.__raw ?? {};
          const nextRaw = {
            ...prevRaw,
            isShortlisted: Number(updatedApplicant.isShortlisted ?? 0),
            isUndicided: Number(updatedApplicant.isUndicided ?? 0),
            isRejected: Number(updatedApplicant.isRejected ?? 0),
          };

          const nextRow = {
            ...r,
            status: getApplicantDisplayStatus(nextRaw),
            __raw: nextRaw,
          } as InfluencerRow;

          return doesApplicantBelongToTab(nextRaw, tab) ? [nextRow] : [];
        })
      );
    } catch (e) {
      alert(getApiErrorMessage(e, "Failed to update applicant status"));
    } finally {
      setUpdatingDecisionId(null);
    }
  };

  // ── View contract PDF — opens blob in a new tab, no sidebar ───────────────
  const handleViewContractPdf = useCallback(
    async (row: InfluencerRow) => {
      const meta = contractMetaMap[row.id] ?? null;
      if (!meta?.contractId) {
        toast({ icon: "error", title: "No contract", text: "No signed contract found." });
        return;
      }

      setViewingPdfForId(row.id);
      try {
        const res = await api.post(
          "/contract/viewPdf",
          { contractId: meta.contractId },
          { responseType: "blob" }
        );
        const url = URL.createObjectURL(res.data);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } catch (e: any) {
        toast({
          icon: "error",
          title: "Could not open PDF",
          text: e?.response?.data?.message || e?.message || "Failed to load contract PDF.",
        });
      } finally {
        setViewingPdfForId(null);
      }
    },
    [contractMetaMap]
  );

  // ── Brand accept handler ───────────────────────────────────────────────────
  const handleBrandAccept = useCallback(
    async (row: InfluencerRow) => {
      const meta = contractMetaMap[row.id] ?? null;
      if (!meta?.contractId) {
        toast({ icon: "error", title: "No contract", text: "Send contract first." });
        return;
      }

      const ok = await askConfirm(
        "Confirm as Brand?",
        "Once confirmed, the contract moves to signing when the influencer has also accepted."
      );
      if (!ok) return;

      try {
        await post("/contract/brand/confirm", { contractId: meta.contractId });
        toast({ icon: "success", title: "Brand accepted" });
        await fetchApplicants();
      } catch (e: any) {
        toast({
          icon: "error",
          title: "Confirm failed",
          text: e?.response?.data?.message || e?.message || "Could not confirm.",
        });
      }
    },
    [contractMetaMap, fetchApplicants]
  );

  // ── Sign modal opener ──────────────────────────────────────────────────────
  const openSignModal = useCallback((meta: ContractMeta | null) => {
    if (!meta?.contractId) {
      toast({ icon: "error", title: "No contract", text: "No contract found." });
      return;
    }
    setSignTargetMeta(meta);
    setSignOpen(true);
  }, []);

  // ── Contract sidebar opener (send / edit only — never for view) ────────────
  const openContractSidebar = useCallback(
    (row: InfluencerRow) => {
      const raw = (row as any)?.__raw ?? null;
      if (!raw) return;

      setContractTarget(raw);
      setContractTargetMeta(contractMetaMap[row.id] ?? null);
      setContractOpen(true);
    },
    [contractMetaMap]
  );

  const handleManage = useCallback(
    (row: InfluencerRow) => {
      router.push(`/brand/influencers?id=${row.id}`);
    },
    [router]
  );

  const handleMail = useCallback((row: InfluencerRow) => {
    console.log("Open mail for", row.id);
  }, []);

  const handleMore = useCallback((row: InfluencerRow) => {
    console.log("More actions for", row.id);
  }, []);

  // ── Milestone handlers ─────────────────────────────────────────────────────
  const handleOpenMilestoneModal = useCallback((row: InfluencerRow) => {
    setMilestoneTargetRow(row);
  }, []);

  const handleCloseMilestoneModal = useCallback(() => {
    setMilestoneTargetRow(null);
  }, []);

  const handleMilestoneSubmit = useCallback(async () => {
    if (!milestoneTargetRow) return;

    setMilestoneCreatedMap((prev) => ({
      ...prev,
      [milestoneTargetRow.id]: true,
    }));

    setMilestoneTargetRow(null);
    await fetchApplicants();
  }, [milestoneTargetRow, fetchApplicants]);

  const handleViewMilestone = useCallback(
    (row: InfluencerRow) => {
      if (!campaignId) {
        toast({
          icon: "error",
          title: "Campaign missing",
          text: "Campaign id not found in URL.",
        });
        return;
      }

      const meta = contractMetaMap[row.id] ?? null;
      const raw = (row as any)?.__raw ?? {};

      if (!meta?.contractId) {
        toast({
          icon: "error",
          title: "Contract missing",
          text: "No contract found for this influencer.",
        });
        return;
      }

      router.push(
        `/brand/influ/view-milestone?contractId=${meta.contractId}&campaignId=${campaignId || ""}&influencerId=${raw.influencerId || row.id || ""}&brandId=${brandId || ""}`
      );
    },
    [campaignId, brandId, contractMetaMap, router]
  );

  // ── Visible rows ───────────────────────────────────────────────────────────
  const visibleRows = useMemo(
    () => applicantRows.slice(0, visibleCount),
    [applicantRows, visibleCount]
  );

  const hasMore = visibleCount < applicantRows.length;

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      setVisibleCount((c) => Math.min(applicantRows.length, c + PAGE_LIMIT));
    } finally {
      setLoadingMore(false);
    }
  };

  const loading = loadingApplicants;
  const err = errApplicants;
  const showLoadMore = !loading && !err && visibleRows.length > 0 && hasMore;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <InfluencerFilter
        filters={filters}
        setFilters={setFilters}
        search={search}
        setSearch={setSearch}
        sortValue={sortValue}
        setSortValue={setSortValue}
      />

      <div className="mt-[3.5rem] px-[2rem] pb-[2.5rem]">
        <div className="overflow-hidden rounded-[0.75rem] bg-white">
          {loading ? (
            <div className="p-6 text-sm text-gray-600">Loading influencers...</div>
          ) : err ? (
            <div className="p-6 text-sm text-red-600">{err}</div>
          ) : (
            <InfluencerTable
              rows={visibleRows}
              variant={tableVariant}
              onActionClick={handleApplicantDecision}
              renderShortlistedActions={(row) => {
                const meta = contractMetaMap[row.id] ?? null;
                const raw = (row as any)?.__raw ?? {};
                const statusStr = String(meta?.status || "");
                const showAccept = needsBrandAcceptance(statusStr);
                const showSign = canSignNow(meta);
                const isLoading = viewingPdfForId === row.id;

                const { label: primaryLabel, viewOnly } = getPrimaryAction(raw, meta);

                return (
                  <ActionButtons
                    primaryLabel={isLoading ? "Opening…" : primaryLabel}
                    onPrimary={() =>
                      viewOnly ? handleViewContractPdf(row) : openContractSidebar(row)
                    }
                    onManage={() => handleManage(row)}
                    onMail={() => handleMail(row)}
                    onMore={() => handleMore(row)}
                    showAccept={showAccept}
                    onAccept={() => handleBrandAccept(row)}
                    showSign={showSign}
                    onSign={() => openSignModal(meta)}
                  />
                );
              }}
              renderActiveActions={(row) => {
                const meta = contractMetaMap[row.id] ?? null;
                const statusStr = String(meta?.status || "");
                const showAccept = needsBrandAcceptance(statusStr);
                const showSign = canSignNow(meta);

                const showViewMilestone =
                  milestoneCreatedMap[row.id] || hasMilestonesCreated(meta);

                return (
                  <ActiveMilestoneActions
                    onAddMilestone={() => handleOpenMilestoneModal(row)}
                    showViewMilestone={showViewMilestone}
                    onViewMilestone={() => handleViewMilestone(row)}
                    onManage={() => handleManage(row)}
                    onMail={() => handleMail(row)}
                    onMore={() => handleMore(row)}
                    showAccept={showAccept}
                    onAccept={() => handleBrandAccept(row)}
                    showSign={showSign}
                    onSign={() => openSignModal(meta)}
                  />
                );
              }}
            />
          )}

          {updatingDecisionId && (
            <div className="px-6 pb-2 text-xs text-gray-500">
              Updating applicant status...
            </div>
          )}

          {!loading && !err && loadingContractMeta && visibleRows.length > 0 ? (
            <div className="px-6 pb-2 text-xs text-gray-500">
              Checking contract status...
            </div>
          ) : null}

          {showLoadMore && (
            <div className="flex justify-center pb-[2rem] pt-[1.25rem]">
              <Button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="
                  flex h-[2.0625rem] items-center justify-center gap-[0.5rem]
                  rounded-[0.75rem] bg-[#1A1A1A] px-[0.75rem]
                  shadow-[0_2px_4px_-2px_rgba(0,0,0,0.08),0_4px_8px_-2px_rgba(0,0,0,0.04)]
                  text-[#F9F9F9] text-[0.75rem] font-semibold leading-[1.25rem]
                  hover:bg-[#111111] disabled:opacity-60 disabled:cursor-not-allowed
                "
              >
                <CircleNotch
                  weight="bold"
                  className={`h-[0.875rem] w-[0.875rem] text-white ${loadingMore ? "animate-spin" : ""}`}
                />
                <span className="flex items-center justify-center px-[0.25rem]">
                  {loadingMore ? "Loading..." : "Load More"}
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Contract sidebar — only for send / edit, never opened for a signed contract */}
      <ContractSidebarExtracted
        open={contractOpen}
        onClose={() => {
          setContractOpen(false);
          setContractTarget(null);
          setContractTargetMeta(null);
        }}
        campaignId={campaignId}
        brandId={brandId}
        influencer={contractTarget}
        initialContract={contractTargetMeta}
        campaignTitle={campaignTitle}
        campaignBudget={campaignBudget}
        campaignTimeline={campaignTimeline}
        onSuccess={async () => {
          await fetchApplicants();
        }}
      />

      {/* Add Milestone modal */}
      <AddMilestoneCard
        open={Boolean(milestoneTargetRow)}
        onClose={handleCloseMilestoneModal}
        brandId={brandId || ""}
        contractId={contractMetaMap[milestoneTargetRow?.id || ""]?.contractId}
        campaignId={campaignId}
        influencerId={milestoneTargetRow?.id}
        influencerName={milestoneTargetRow?.profile?.name}
        onSubmit={handleMilestoneSubmit}
      />

      {/* Signature modal */}
      <SignatureModal
        isOpen={signOpen}
        onClose={() => {
          setSignOpen(false);
          setSignTargetMeta(null);
        }}
        onSigned={async (sigDataUrl) => {
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
            await fetchApplicants();
          } catch (e: any) {
            toast({
              icon: "error",
              title: "Sign failed",
              text: e?.response?.data?.message || e?.message || "Could not sign contract.",
            });
          }
        }}
      />
    </>
  );
}