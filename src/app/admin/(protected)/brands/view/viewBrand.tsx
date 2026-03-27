"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Outfit } from "next/font/google";
import { get, post } from "@/lib/api";
import {
  HiChevronLeft,
  HiOutlineMail,
  HiCheckCircle,
  HiXCircle,
  HiUserGroup,
  HiIdentification,
  HiClipboardList,
  HiChevronUp,
  HiChevronDown,
  HiSearch,
  HiChevronDoubleRight,
  HiOfficeBuilding,
  HiPhotograph,
  HiSparkles,
} from "react-icons/hi";
import {
  HiChevronRight,
  HiChevronLeft as HiChevronLeftIcon,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

/* ---------- API PATHS ---------- */
const API_LIST_PLANS = "/subscription/list";
const API_CHECK_CHANGE = "/subscription/check-brand";
const API_ADMIN_ASSIGN = "/admin/assignBrandPlan";

/* ---------- Font ---------- */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

/* ---------- Types ---------- */
interface QAItem {
  question: string;
  answers: string[];
}

interface SubscriptionFeature {
  key: string;
  value?: unknown;
  limit: number;
  used: number;
  note?: string | null;
  resetsEvery?: string | null;
  resetsAt?: string | null;
}

interface InternalCredits {
  used: number;
  resetsAt?: string | null;
}

interface Subscription {
  planId: string;
  planName: string;
  role: string;
  planRef?: string | null;
  monthlyCost: number;
  annualCost?: number;
  billingCycle: "monthly" | "annual";
  autoRenew: boolean;
  status: "active" | "archived" | string;
  durationMins: number;
  startedAt?: string | null;
  expiresAt?: string | null;
  features: SubscriptionFeature[];
  internalCredits?: InternalCredits;
}

interface BrandDetail {
  _id: string;
  brandId?: string;
  email: string;
  brandName: string;
  name: string;
  companySize?: string;
  industry: string;
  proxyEmail?: string;
  profilePic?: string;
  page1?: QAItem[];
  page2?: QAItem[];
  page3?: QAItem[];
  ispage1Skip?: boolean;
  ispage2Skip?: boolean;
  ispage3Skip?: boolean;
  isProfilePicSkip?: boolean;
  subscription: Subscription;
  subscriptionExpired: boolean;
  failedLoginAttempts?: number;
  lockUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  walletBalance?: number;
  assignedRh?: string;
  assignedBme?: string;
  assignedIme?: string;
  assignedRm?: string;
  assignedBm?: string;
  assignedIm?: string;
  fullyManagedSubscription?: boolean;
  assignmentStatus?: string;
  planName?: string;
  expiresAt?: string | null;
  status?: string;
}

interface Campaign {
  campaignsId: string;
  productOrServiceName: string;
  goal?: string;
  timeline?: {
    startDate?: string | null;
    endDate?: string | null;
  } | null;
  applicantCount?: number;
  isActive: number;
}

interface CampaignListResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  status: number;
  campaigns: Campaign[];
}

interface PlanListItem {
  planId: string;
  role: "Brand" | "Influencer" | "Creator" | "Agency";
  name: string;
  displayName?: string;
  monthlyCost: number;
  annualCost?: number;
  currency?: string;
  status: "active" | "archived";
  isCustomPricing?: boolean;
  isStartingAt?: boolean;
  durationDays?: number;
  durationMins?: number;
  durationMinutes?: number;
}

interface PlanChangeCheckResponse {
  status: string;
  canProceed: boolean;
  message: string;
  currentPlanId?: string | null;
  requestedPlanId?: string;
}

/* ---------- Helpers ---------- */
const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";

  return dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";

  return dt.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatCurrency = (amount?: number | null) => {
  if (!amount || amount <= 0) return "Free";
  return `$${amount}`;
};

const titleCaseKey = (key?: string) => {
  if (!key) return "—";
  return key.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
};

const displayFeatureValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Included" : "Not included";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const statusChip = (label: string, tone: "dark" | "green" | "rose" = "dark") => {
  const styles = {
    dark: "bg-black/[0.06] text-black/75 border-black/10",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold ${styles[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
};

const campaignStatusPill = (isActive: number) =>
  isActive === 1 ? (
    <span className="text-[13px] font-extrabold text-[#111827]">Active</span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full bg-black/[0.06] px-3 py-1 text-xs font-extrabold text-black/70 border border-black/10">
      <span className="h-1.5 w-1.5 rounded-full bg-black/40" />
      Inactive
    </span>
  );

const MAX_CAMPAIGN_NAME_LENGTH = 60;
const formatCampaignName = (name?: string) => {
  if (!name) return "—";
  const trimmed = name.trim();
  if (trimmed.length <= MAX_CAMPAIGN_NAME_LENGTH) return trimmed;
  return trimmed.slice(0, MAX_CAMPAIGN_NAME_LENGTH) + "…";
};

function addMinutes(d: Date, mins: number) {
  return new Date(d.getTime() + mins * 60 * 1000);
}

function addDays(d: Date, days: number) {
  return addMinutes(d, days * 1440);
}

function safeDate(iso?: string | null) {
  if (!iso) return null;
  const dt = new Date(iso);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function getInitials(brand?: BrandDetail | null) {
  const source = (brand?.brandName || brand?.name || "B").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function isDataImage(src?: string) {
  return !!src && src.startsWith("data:image");
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <p className="text-[13px] font-semibold text-black/70">
      <span className="font-extrabold text-black/55">{label}:</span>{" "}
      <span className="text-[#111827]">{value || "—"}</span>
    </p>
  );
}

function QABlock({
  title,
  items,
  skipped,
}: {
  title: string;
  items?: QAItem[];
  skipped?: boolean;
}) {
  return (
    <Card className="rounded-2xl border border-black/10 bg-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-extrabold text-[#111827]">{title}</h4>
          {skipped ? statusChip("Skipped", "rose") : statusChip("Completed", "green")}
        </div>

        <div className="mt-4 space-y-3">
          {!items || items.length === 0 ? (
            <p className="text-[13px] font-semibold text-black/50">No responses captured.</p>
          ) : (
            items.map((item, idx) => (
              <div key={`${title}-${idx}`} className="rounded-xl border border-black/10 bg-[#FAFAFA] p-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-black/45">
                  {item.question}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.answers?.length ? (
                    item.answers.map((answer, answerIdx) => (
                      <span
                        key={`${title}-${idx}-${answerIdx}`}
                        className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold text-[#111827]"
                      >
                        {answer}
                      </span>
                    ))
                  ) : (
                    <span className="text-[13px] font-semibold text-black/50">—</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Component ---------- */
export default function ViewBrandPage() {
  const router = useRouter();
  const params = useSearchParams();
  const brandId = params.get("brandId") || undefined;

  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [loadingBrand, setLoadingBrand] = useState(true);
  const [errorBrand, setErrorBrand] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [errorCampaigns, setErrorCampaigns] = useState<string | null>(null);
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [campaignsTotalPages, setCampaignsTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<0 | 1 | 2>(0);
  const [sortBy, setSortBy] = useState<keyof Campaign | "startDate" | "endDate" | "status">(
    "productOrServiceName"
  );
  const [sortAsc, setSortAsc] = useState(true);
  const campaignsLimit = 10;

  const apiSortBy = useMemo(() => (sortBy === "status" ? "isActive" : sortBy), [sortBy]);

  /* ----------- Plan Management State ----------- */
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const [validityMode, setValidityMode] = useState<"plan_default" | "custom_days" | "exact_date">(
    "plan_default"
  );
  const [customDays, setCustomDays] = useState<string>("");
  const [customExpiryDate, setCustomExpiryDate] = useState<string>("");
  const [applyFrom, setApplyFrom] = useState<"now" | "current_expiry">("now");

  const [checkInfo, setCheckInfo] = useState<PlanChangeCheckResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [forceAssign, setForceAssign] = useState(false);

  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  const currentExpiry = brand?.subscription?.expiresAt
    ? safeDate(brand.subscription.expiresAt)
    : safeDate(brand?.expiresAt);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.planId === selectedPlanId) || null,
    [plans, selectedPlanId]
  );

  const fetchBrand = async (id: string) => {
    setLoadingBrand(true);
    try {
      const data = await get<BrandDetail>("/admin/brand/getById", { id });
      setBrand(data);
      setErrorBrand(null);
    } catch (err: any) {
      setErrorBrand(err.message || "Failed to load brand.");
    } finally {
      setLoadingBrand(false);
    }
  };

  const fetchPlans = async () => {
    setLoadingPlans(true);
    setPlanError(null);

    try {
      const resp = await post<{ plans: PlanListItem[] }>(API_LIST_PLANS, {
        role: "Brand",
        includeArchived: false,
      });

      const list = resp?.plans || [];
      setPlans(list);

      const currId = brand?.subscription?.planId;
      if (currId) setSelectedPlanId(currId);
      else if (list[0]?.planId) setSelectedPlanId(list[0].planId);
    } catch (err: any) {
      setPlanError(err.message || "Failed to load plans.");
    } finally {
      setLoadingPlans(false);
    }
  };

  const checkPlanChange = async (planId: string) => {
    if (!brandId || !planId) return;
    setChecking(true);

    try {
      const resp = await post<PlanChangeCheckResponse>(API_CHECK_CHANGE, {
        brandId,
        planId,
      });
      setCheckInfo(resp);
    } catch {
      setCheckInfo(null);
    } finally {
      setChecking(false);
    }
  };

  const computeExpiryPreview = () => {
    const base =
      applyFrom === "current_expiry" && currentExpiry ? currentExpiry : new Date();

    if (validityMode === "exact_date" && customExpiryDate) {
      const dt = new Date(customExpiryDate + "T00:00:00.000Z");
      return Number.isNaN(dt.getTime()) ? null : dt;
    }

    if (validityMode === "custom_days" && customDays) {
      const n = Number(customDays);
      if (!Number.isFinite(n) || n <= 0) return null;
      return addDays(base, n);
    }

    if (!selectedPlan) return addDays(base, 30);

    const mins =
      (Number(selectedPlan.durationMins) > 0 && Number(selectedPlan.durationMins)) ||
      (Number(selectedPlan.durationMinutes) > 0 && Number(selectedPlan.durationMinutes)) ||
      (Number(selectedPlan.durationDays) > 0 && Number(selectedPlan.durationDays) * 1440) ||
      43200;

    return addMinutes(base, mins);
  };

  const upgradeOrUpdatePlan = async () => {
    if (!brandId || !selectedPlanId) return;

    if (checkInfo && checkInfo.canProceed === false && !forceAssign) {
      setAssignMsg(`❌ ${checkInfo.message}`);
      return;
    }

    if (validityMode === "custom_days") {
      const n = Number(customDays);
      if (!Number.isFinite(n) || n <= 0) {
        setAssignMsg("❌ Duration days must be a positive number.");
        return;
      }
    }

    if (validityMode === "exact_date" && !customExpiryDate) {
      setAssignMsg("❌ Please select an expiry date.");
      return;
    }

    setAssigning(true);
    setAssignMsg(null);

    try {
      const payload: Record<string, any> = {
        brandId,
        planId: selectedPlanId,
        billingCycle,
        applyFrom,
      };

      if (validityMode === "custom_days" && customDays) {
        payload.durationDays = Number(customDays);
      } else if (validityMode === "exact_date" && customExpiryDate) {
        payload.expiresAt = new Date(customExpiryDate + "T00:00:00.000Z").toISOString();
      }

      await post(API_ADMIN_ASSIGN, payload);

      setAssignMsg("✅ Plan updated successfully.");
      setForceAssign(false);

      await fetchBrand(brandId);
      await checkPlanChange(payload.planId);
    } catch (err: any) {
      setAssignMsg(`❌ ${err.message || "Failed to update plan."}`);
    } finally {
      setAssigning(false);
    }
  };

  const fetchCampaigns = async () => {
    if (!brandId) return;
    setLoadingCampaigns(true);
    setErrorCampaigns(null);

    try {
      const payload = {
        brandId,
        page: campaignsPage,
        limit: campaignsLimit,
        search: searchTerm,
        status: statusFilter,
        sortBy: apiSortBy,
        sortOrder: sortAsc ? "asc" : "desc",
      };

      const resp = await post<CampaignListResponse>("/admin/campaign/getByBrandId", payload);
      setCampaigns(resp.campaigns || []);
      setCampaignsTotalPages(resp.totalPages || 1);
    } catch (err: any) {
      setErrorCampaigns(err.message || "Failed to load campaigns.");
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    if (brandId) fetchBrand(brandId);
  }, [brandId]);

  useEffect(() => {
    fetchCampaigns();
  }, [brandId, campaignsPage, searchTerm, statusFilter, apiSortBy, sortAsc]);

  useEffect(() => {
    if (brand) fetchPlans();
  }, [brand?._id]);

  useEffect(() => {
    if (!selectedPlanId || !brandId) return;
    checkPlanChange(selectedPlanId);
  }, [selectedPlanId, brandId]);

  const toggleSort = (key: keyof Campaign | "startDate" | "endDate" | "status") => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else {
      setSortBy(key);
      setSortAsc(true);
    }
    setCampaignsPage(1);
  };

  const expiryPreview = computeExpiryPreview();
  const initials = getInitials(brand);
  const currentPlanName = brand?.subscription?.planName || brand?.planName || "—";

  if (loadingBrand) {
    return (
      <div className={`${outfit.className} min-h-screen w-full bg-[#FAFAFA]`}>
        <div className="mx-auto w-full max-w-[1200px] space-y-6 px-4 py-6 md:px-6 md:py-10">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (errorBrand) {
    return (
      <div className={`${outfit.className} min-h-screen w-full bg-[#FAFAFA]`}>
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 md:py-10">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Error: {errorBrand}
          </div>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className={`${outfit.className} min-h-screen w-full bg-[#FAFAFA]`}>
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 md:py-10 text-black/70">
          No brand found.
        </div>
      </div>
    );
  }

  return (
    <div className={`${outfit.className} min-h-screen w-full bg-[#FAFAFA]`}>
      <div className="mx-auto w-full max-w-[1200px] space-y-6 px-4 py-6 md:px-6 md:py-10">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="h-11 rounded-full border-black/10 bg-white px-4 text-[13px] font-extrabold text-black/80 hover:border-black hover:bg-black hover:text-white"
          >
            <HiChevronLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
        </div>

        <Card className="overflow-hidden rounded-2xl border border-black/10 bg-white">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                {isDataImage(brand.profilePic) && !brand.isProfilePicSkip ? (
                  <img
                    src={brand.profilePic}
                    alt={brand.brandName}
                    className="h-16 w-16 rounded-2xl border border-black/10 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-black/[0.06] text-lg font-extrabold text-[#111827]">
                    {initials}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-[24px] font-extrabold leading-tight tracking-tight text-[#111827] md:text-[28px]">
                      {brand.brandName}
                    </h1>
                    {statusChip(
                      brand.subscriptionExpired ? "Subscription expired" : "Subscription active",
                      brand.subscriptionExpired ? "rose" : "green"
                    )}
                  </div>

                  <p className="mt-1 text-[14px] font-bold text-black/65">
                    Contact person: {brand.name || "—"}
                  </p>

                  <p className="mt-2 text-[13px] font-semibold text-black/55">
                    Created {formatDate(brand.createdAt)} • Updated {formatDate(brand.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {statusChip(`Plan: ${currentPlanName}`)}
                {statusChip(`Wallet: $${Number(brand.walletBalance || 0).toFixed(2)}`)}
                {brand.fullyManagedSubscription ? statusChip("Fully managed", "green") : null}
                {brand.assignmentStatus ? statusChip(`Assignment: ${brand.assignmentStatus}`) : null}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-black/10 bg-[#FAFAFA] p-4">
                <div className="flex items-center gap-2">
                  <HiOutlineMail className="text-black/45" />
                  <span className="text-[13px] font-semibold text-[#111827]">{brand.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <HiOfficeBuilding className="text-black/45" />
                  <span className="text-[13px] font-semibold text-[#111827]">{brand.industry || "—"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <HiUserGroup className="text-black/45" />
                  <span className="text-[13px] font-semibold text-[#111827]">{brand.companySize || "—"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <HiIdentification className="text-black/45" />
                  <span className="text-[13px] font-semibold text-[#111827]">
                    Proxy email: {brand.proxyEmail || "—"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-[#FAFAFA] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <HiSparkles className="text-black/45" />
                  <h3 className="text-sm font-extrabold text-[#111827]">Assigned Team</h3>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <InfoItem label="RM" value={brand.assignedRm || "—"} />
                  <InfoItem label="RH" value={brand.assignedRh || "—"} />
                  <InfoItem label="BM" value={brand.assignedBm || brand.assignedBme || "—"} />
                  <InfoItem label="IM" value={brand.assignedIm || brand.assignedIme || "—"} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <QABlock title="Onboarding • Page 1" items={brand.page1} skipped={brand.ispage1Skip} />
          <QABlock title="Onboarding • Page 2" items={brand.page2} skipped={brand.ispage2Skip} />
          <QABlock title="Onboarding • Page 3" items={brand.page3} skipped={brand.ispage3Skip} />
        </div>

        <Card className="overflow-hidden rounded-2xl border border-black/10 bg-white">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-black/[0.06] text-black/70">
                  <HiClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[18px] font-extrabold text-[#111827] md:text-[20px]">Subscription</h3>
                  <p className="text-[13px] font-semibold text-black/55">
                    Plan status, billing, limits and value-based feature access.
                  </p>
                </div>
              </div>

              {statusChip(`Plan: ${currentPlanName}`)}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 text-[13px] font-semibold text-black/70 sm:grid-cols-2 md:grid-cols-3">
              <InfoItem label="Role" value={brand.subscription?.role} />
              <InfoItem label="Status" value={brand.subscription?.status || brand.status || "—"} />
              <InfoItem label="Billing cycle" value={brand.subscription?.billingCycle || "—"} />
              <InfoItem label="Monthly cost" value={formatCurrency(brand.subscription?.monthlyCost)} />
              <InfoItem label="Annual cost" value={formatCurrency(brand.subscription?.annualCost)} />
              <InfoItem label="Auto renew" value={brand.subscription?.autoRenew ? "Yes" : "No"} />
              <InfoItem label="Started" value={formatDate(brand.subscription?.startedAt)} />
              <InfoItem label="Expires" value={brand.subscription?.expiresAt ? formatDate(brand.subscription.expiresAt) : "No expiry set"} />
              <InfoItem label="Duration" value={brand.subscription?.durationMins ? `${brand.subscription.durationMins} mins` : "—"} />
              <InfoItem label="Internal credits used" value={brand.subscription?.internalCredits?.used ?? 0} />
              <InfoItem label="Credits reset at" value={formatDateTime(brand.subscription?.internalCredits?.resetsAt)} />
              <InfoItem label="Lock until" value={formatDateTime(brand.lockUntil)} />
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-[13px] font-extrabold text-[#111827]">
                    <HiChevronDoubleRight className="text-black/70" />
                    Upgrade / Update Plan
                  </p>
                  <p className="text-xs font-semibold text-black/50">
                    Choose a plan, decide validity, and optionally extend from the current expiry.
                  </p>
                </div>

                {checking ? (
                  <span className="text-xs font-semibold text-black/50">Checking…</span>
                ) : checkInfo ? (
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-extrabold ${checkInfo.canProceed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                      }`}
                  >
                    {checkInfo.message}
                  </span>
                ) : null}
              </div>

              {planError && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                  {planError}
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-black/55">Plan</label>
                  <Select
                    value={selectedPlanId}
                    onValueChange={(val) => setSelectedPlanId(val)}
                    disabled={loadingPlans}
                  >
                    <SelectTrigger className="h-11 rounded-full border-black/10 bg-white text-[13px] font-semibold">
                      <SelectValue placeholder={loadingPlans ? "Loading..." : "Select plan"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {plans.map((plan) => (
                        <SelectItem key={plan.planId} value={plan.planId}>
                          {(plan.displayName || plan.name).toUpperCase()} {" "}
                          {plan.monthlyCost > 0 ? `- $${plan.monthlyCost}/mo` : "- Free"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-black/55">Billing Cycle</label>
                  <Select value={billingCycle} onValueChange={(val) => setBillingCycle(val as "monthly" | "annual")}>
                    <SelectTrigger className="h-11 rounded-full border-black/10 bg-white text-[13px] font-semibold">
                      <SelectValue placeholder="Select cycle" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-black/55">Start counting from</label>
                  <Select value={applyFrom} onValueChange={(val) => setApplyFrom(val as "now" | "current_expiry")}>
                    <SelectTrigger className="h-11 rounded-full border-black/10 bg-white text-[13px] font-semibold">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="now">Now</SelectItem>
                      <SelectItem value="current_expiry">Current expiry (extend)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] font-semibold text-black/50">
                    Use <b>Current expiry</b> to extend an existing plan without losing remaining time.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-black/55">Validity</label>
                  <Select
                    value={validityMode}
                    onValueChange={(val) =>
                      setValidityMode(val as "plan_default" | "custom_days" | "exact_date")
                    }
                  >
                    <SelectTrigger className="h-11 rounded-full border-black/10 bg-white text-[13px] font-semibold">
                      <SelectValue placeholder="Select validity" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="plan_default">Use plan default</SelectItem>
                      <SelectItem value="custom_days">Custom days</SelectItem>
                      <SelectItem value="exact_date">Exact expiry date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-black/55">Days (if custom)</label>
                  <Input
                    placeholder="e.g. 14"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    disabled={validityMode !== "custom_days"}
                    className="h-11 rounded-full border-black/10 bg-white text-[13px] font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-black/55">Expiry date (if exact)</label>
                  <Input
                    type="date"
                    value={customExpiryDate}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    disabled={validityMode !== "exact_date"}
                    className="h-11 rounded-full border-black/10 bg-white text-[13px] font-semibold"
                  />
                </div>

                <div className="md:col-span-2 flex items-end">
                  <label className="flex select-none items-center gap-2 text-[13px] font-semibold text-black/70">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-black"
                      checked={forceAssign}
                      onChange={(e) => setForceAssign(e.target.checked)}
                    />
                    Force assign (ignore upgrade/downgrade restrictions)
                  </label>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={upgradeOrUpdatePlan}
                    disabled={!selectedPlanId || assigning}
                    className="h-11 w-full rounded-full bg-black text-[13px] font-extrabold text-white hover:bg-black/90"
                  >
                    {assigning ? "Updating..." : "Update Plan"}
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-1">
                {expiryPreview && (
                  <p className="text-[13px] font-semibold text-black/70">
                    <span className="font-extrabold text-black/55">Preview expiry:</span>{" "}
                    {expiryPreview.toLocaleString()}
                  </p>
                )}

                {selectedPlan && (
                  <p className="text-xs font-semibold text-black/50">
                    Plan duration:{" "}
                    {selectedPlan.durationDays
                      ? `${selectedPlan.durationDays} days`
                      : selectedPlan.durationMins
                        ? `${selectedPlan.durationMins} minutes`
                        : selectedPlan.durationMinutes
                          ? `${selectedPlan.durationMinutes} minutes`
                          : "Default (30 days)"}
                  </p>
                )}

                {assignMsg && <p className="text-[13px] font-semibold text-black/70">{assignMsg}</p>}
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-black/10 bg-white">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-white">
                    <TableHead className="py-4 text-xs font-extrabold text-black/60">Feature</TableHead>
                    <TableHead className="py-4 text-xs font-extrabold text-black/60">Value</TableHead>
                    <TableHead className="py-4 text-xs font-extrabold text-black/60">Limit</TableHead>
                    <TableHead className="py-4 text-xs font-extrabold text-black/60">Usage</TableHead>
                    <TableHead className="py-4 text-xs font-extrabold text-black/60">Note / Reset</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {(brand.subscription?.features || []).map((feature) => {
                    const hasNumericLimit = typeof feature.limit === "number" && feature.limit > 0;
                    const pct = hasNumericLimit
                      ? Math.min(100, Math.round((feature.used / feature.limit) * 100))
                      : 0;

                    return (
                      <TableRow
                        key={feature.key}
                        className="border-b border-black/5 hover:bg-black/[0.02]"
                      >
                        <TableCell className="py-4 text-[13px] font-extrabold text-[#111827]">
                          {titleCaseKey(feature.key)}
                        </TableCell>

                        <TableCell className="py-4 text-[13px] font-semibold text-black/70">
                          {displayFeatureValue(feature.value)}
                        </TableCell>

                        <TableCell className="py-4 text-[13px] font-semibold text-black/70">
                          {feature.limit === -1
                            ? "Unlimited"
                            : hasNumericLimit
                              ? feature.limit
                              : "—"}
                        </TableCell>

                        <TableCell className="py-4">
                          {hasNumericLimit ? (
                            <>
                              <div className="flex items-center justify-between text-[13px] font-semibold text-black/70">
                                <span className="font-extrabold text-[#111827]">{feature.used}</span>
                                <span className="text-xs font-extrabold text-black/50">{pct}%</span>
                              </div>
                              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10">
                                <div className="h-full bg-black transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </>
                          ) : (
                            <span className="text-[13px] font-semibold text-black/50">Not usage based</span>
                          )}
                        </TableCell>

                        <TableCell className="py-4 text-[13px] font-semibold text-black/70">
                          <div>{feature.note || "—"}</div>
                          <div className="mt-1 text-xs text-black/45">
                            {feature.resetsEvery || feature.resetsAt
                              ? `Resets ${feature.resetsEvery || ""} ${feature.resetsAt ? `• ${formatDateTime(feature.resetsAt)}` : ""}`
                              : "No reset info"}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {(brand.subscription?.features || []).length === 0 && (
                    <TableRow className="border-b border-black/5">
                      <TableCell className="py-6 text-sm font-semibold text-black/55" colSpan={5}>
                        No feature snapshot found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-black/10 bg-white">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-[18px] font-extrabold text-[#111827] md:text-[20px]">Campaigns</h3>
                <p className="text-[13px] font-semibold text-black/55">Browse campaigns for this brand.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <HiSearch
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black/45"
                    size={18}
                  />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCampaignsPage(1);
                    }}
                    className="h-11 rounded-full border-black/10 bg-white pl-11 text-[13px] font-semibold placeholder:text-black/40"
                  />
                </div>

                <Select
                  value={statusFilter.toString()}
                  onValueChange={(val) => {
                    setStatusFilter(Number(val) as 0 | 1 | 2);
                    setCampaignsPage(1);
                  }}
                >
                  <SelectTrigger className="h-11 w-40 rounded-full border-black/10 bg-white text-[13px] font-semibold">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="0">All</SelectItem>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="2">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-5">
              {loadingCampaigns ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, idx) => (
                    <Skeleton key={idx} className="h-6 w-full rounded-lg" />
                  ))}
                </div>
              ) : errorCampaigns ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  Error: {errorCampaigns}
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-[13px] font-semibold text-black/55">No campaigns found.</div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-white">
                          {[
                            { label: "Name", key: "productOrServiceName" as const, align: "left" as const },
                            { label: "Goal", key: "goal" as const, align: "left" as const },
                            { label: "Start", key: "startDate" as const, align: "center" as const },
                            { label: "End", key: "endDate" as const, align: "center" as const },
                            { label: "Applicants", key: "applicantCount" as const, align: "center" as const },
                            { label: "Status", key: "status" as const, align: "center" as const },
                            { label: "Open", key: undefined, align: "right" as const },
                          ].map((col) => (
                            <TableHead
                              key={col.label}
                              className={`whitespace-nowrap py-4 text-xs font-extrabold text-black/60 ${col.key ? "cursor-pointer select-none" : ""
                                } ${col.align === "center"
                                  ? "text-center"
                                  : col.align === "right"
                                    ? "text-right"
                                    : "text-left"
                                }`}
                              onClick={() => col.key && toggleSort(col.key)}
                            >
                              <div
                                className={`flex items-center gap-1 ${col.align === "center"
                                    ? "justify-center"
                                    : col.align === "right"
                                      ? "justify-end"
                                      : "justify-start"
                                  }`}
                              >
                                {col.label}
                                {col.key && sortBy === col.key &&
                                  (sortAsc ? (
                                    <HiChevronUp className="ml-1" />
                                  ) : (
                                    <HiChevronDown className="ml-1" />
                                  ))}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {campaigns.map((campaign) => (
                          <TableRow
                            key={campaign.campaignsId}
                            className="border-b border-black/5 hover:bg-black/[0.02]"
                          >
                            <TableCell
                              className="max-w-[30ch] truncate py-4 font-extrabold text-[#111827]"
                              title={campaign.productOrServiceName}
                            >
                              {formatCampaignName(campaign.productOrServiceName)}
                            </TableCell>

                            <TableCell
                              className="max-w-[22ch] truncate py-4 text-[13px] font-semibold text-black/70"
                              title={campaign.goal || ""}
                            >
                              {campaign.goal || "—"}
                            </TableCell>

                            <TableCell className="py-4 text-center text-[13px] font-semibold text-black/70">
                              {formatDate(campaign.timeline?.startDate)}
                            </TableCell>

                            <TableCell className="py-4 text-center text-[13px] font-semibold text-black/70">
                              {formatDate(campaign.timeline?.endDate)}
                            </TableCell>

                            <TableCell className="py-4 text-center text-[13px] font-extrabold text-[#111827]">
                              {campaign.applicantCount ?? 0}
                            </TableCell>

                            <TableCell className="py-4 text-center">
                              {campaignStatusPill(campaign.isActive)}
                            </TableCell>

                            <TableCell className="py-4 text-right">
                              <Button
                                onClick={() => router.push(`/admin/campaigns/view?id=${campaign.campaignsId}`)}
                                className="h-9 rounded-full bg-black px-4 text-[13px] font-extrabold text-white hover:bg-black/90"
                                size="sm"
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {campaignsTotalPages > 1 && (
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                      <Button
                        onClick={() => setCampaignsPage((p) => Math.max(p - 1, 1))}
                        disabled={campaignsPage === 1}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full border-black/10 text-black/70 hover:border-black hover:bg-black hover:text-white"
                      >
                        <HiChevronLeftIcon />
                      </Button>

                      <span className="text-xs font-extrabold text-black/60">
                        Page {campaignsPage} of {campaignsTotalPages}
                      </span>

                      <Button
                        onClick={() => setCampaignsPage((p) => Math.min(p + 1, campaignsTotalPages))}
                        disabled={campaignsPage === campaignsTotalPages}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full border-black/10 text-black/70 hover:border-black hover:bg-black hover:text-white"
                      >
                        <HiChevronRight />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
