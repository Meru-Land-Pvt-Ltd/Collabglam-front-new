"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Outfit } from "next/font/google";
import { get, post } from "@/lib/api";
import {
  HiChevronLeft,
  HiOutlineMail,
  HiPhone,
  HiLocationMarker,
  HiCheckCircle,
  HiXCircle,
  HiUserGroup,
  HiIdentification,
  HiClipboardList,
  HiChevronUp,
  HiChevronDown,
  HiSearch,
  HiChevronDoubleRight,
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

/* ---------- API PATHS (edit if needed) ---------- */
const API_LIST_PLANS = "/subscription/list";
const API_CHECK_CHANGE = "/subscription/check-brand";
const API_ADMIN_ASSIGN = "/admin/assignBrandPlan";

/* ---------- Font ---------- */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

/* ---------- Types ---------- */
interface Feature {
  key: string;
  limit: number;
  used: number;
}

interface Subscription {
  planId: string;
  planName: string;
  role: string;
  monthlyCost: number;
  autoRenew: boolean;
  status: string;
  durationMins: number;
  startedAt: string;
  expiresAt: string;
  features: Feature[];
}

interface BrandDetail {
  brandId: string;
  name: string;
  phone: string;
  country: string;
  callingcode: string;
  email: string;
  categoryName: string;
  businessType: string;
  companySize: string;
  referralCode: string;
  isVerifiedRepresentative: boolean;
  subscriptionExpired: boolean;
  createdAt: string;
  updatedAt: string;
  subscription: Subscription;
  walletBalance: number;
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

// UI-aligned pill: Active is bold text; Inactive is a gray chip w/ dot (matches Brands page vibe)
const statusPill = (isActive: number) =>
  isActive === 1 ? (
    <span className="text-[13px] font-extrabold text-[#111827]">Active</span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full bg-black/[0.06] text-black/70 px-3 py-1 text-xs font-extrabold border border-black/10">
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
  const [sortBy, setSortBy] = useState<
    keyof Campaign | "startDate" | "endDate" | "status"
  >("productOrServiceName");
  const [sortAsc, setSortAsc] = useState(true);
  const campaignsLimit = 10;

  const apiSortBy = useMemo(
    () => (sortBy === "status" ? "isActive" : sortBy),
    [sortBy]
  );

  /* ----------- Plan Management State ----------- */
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );

  // validity
  const [validityMode, setValidityMode] = useState<
    "plan_default" | "custom_days" | "exact_date"
  >("plan_default");
  const [customDays, setCustomDays] = useState<string>(""); // "14"
  const [customExpiryDate, setCustomExpiryDate] = useState<string>(""); // yyyy-mm-dd

  // start counting from
  const [applyFrom, setApplyFrom] = useState<"now" | "current_expiry">("now");

  // checks + submit
  const [checkInfo, setCheckInfo] = useState<PlanChangeCheckResponse | null>(
    null
  );
  const [checking, setChecking] = useState(false);
  const [forceAssign, setForceAssign] = useState(false);

  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  const currentExpiry = brand?.subscription?.expiresAt
    ? safeDate(brand.subscription.expiresAt)
    : null;

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

      // default selection: current plan if exists, else first
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
    } catch (err: any) {
      // if check endpoint not available / route differs, don't block admin usage
      setCheckInfo(null);
    } finally {
      setChecking(false);
    }
  };

  const computeExpiryPreview = () => {
    const base =
      applyFrom === "current_expiry" && currentExpiry ? currentExpiry : new Date();

    // exact date
    if (validityMode === "exact_date" && customExpiryDate) {
      const dt = new Date(customExpiryDate + "T00:00:00.000Z");
      return Number.isNaN(dt.getTime()) ? null : dt;
    }

    // custom days
    if (validityMode === "custom_days" && customDays) {
      const n = Number(customDays);
      if (!Number.isFinite(n) || n <= 0) return null;
      return addDays(base, n);
    }

    // plan default
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

    // If you want to enforce "upgrade only", block when check says no (unless forceAssign)
    if (checkInfo && checkInfo.canProceed === false && !forceAssign) {
      setAssignMsg(`❌ ${checkInfo.message}`);
      return;
    }

    // validate custom inputs
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
      const payload: any = {
        brandId,
        planId: selectedPlanId,
        billingCycle,
        applyFrom, // "now" | "current_expiry"
      };

      if (validityMode === "custom_days" && customDays) {
        payload.durationDays = Number(customDays);
      } else if (validityMode === "exact_date" && customExpiryDate) {
        payload.expiresAt = new Date(
          customExpiryDate + "T00:00:00.000Z"
        ).toISOString();
      }
      // plan_default => no overrides, backend uses plan duration

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
      const resp = await post<CampaignListResponse>(
        "/admin/campaign/getByBrandId",
        payload
      );
      setCampaigns(resp.campaigns);
      setCampaignsTotalPages(resp.totalPages);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, campaignsPage, searchTerm, statusFilter, apiSortBy, sortAsc]);

  // fetch plans once brand loads
  useEffect(() => {
    if (brand) fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand?.brandId]);

  // check plan change when selected plan changes
  useEffect(() => {
    if (!selectedPlanId || !brandId) return;
    checkPlanChange(selectedPlanId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlanId, brandId]);

  const toggleSort = (key: any) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else {
      setSortBy(key);
      setSortAsc(true);
    }
    setCampaignsPage(1);
  };

  const expiryPreview = computeExpiryPreview();

  // ---------- Loading / Error / Empty ----------
  if (loadingBrand)
    return (
      <div className={`${outfit.className} min-h-screen w-full bg-[#FAFAFA]`}>
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 md:py-10 space-y-6">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );

  if (errorBrand)
    return (
      <div className={`${outfit.className} min-h-screen w-full bg-[#FAFAFA]`}>
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 md:py-10">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Error: {errorBrand}
          </div>
        </div>
      </div>
    );

  if (!brand)
    return (
      <div className={`${outfit.className} min-h-screen w-full bg-[#FAFAFA]`}>
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 md:py-10 text-black/70">
          No brand found.
        </div>
      </div>
    );

  const initials = (brand.name || "—").trim().slice(0, 1).toUpperCase();

  return (
    <div className={`${outfit.className} min-h-screen w-full bg-[#FAFAFA]`}>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 md:py-10 space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="h-11 rounded-full border-black/10 bg-white px-4 text-[13px] font-extrabold text-black/80 hover:bg-black hover:text-white hover:border-black"
          >
            <HiChevronLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
        </div>

        {/* Brand Header */}
        <Card className="border border-black/10 bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full border border-black/10 bg-black/[0.06] flex items-center justify-center text-sm font-extrabold text-[#111827]">
                  {initials}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[24px] md:text-[28px] font-extrabold tracking-tight text-[#111827] leading-tight truncate">
                      {brand.name}
                    </h2>
                    {brand.isVerifiedRepresentative ? (
                      <HiCheckCircle className="text-emerald-600" title="Verified" />
                    ) : (
                      <HiXCircle className="text-rose-600" title="Not Verified" />
                    )}
                  </div>

                  <p className="mt-1 text-[13px] font-semibold text-black/55">
                    Created {formatDate(brand.createdAt)} • Updated {formatDate(brand.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {brand.subscriptionExpired ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-black/[0.06] text-black/70 px-3 py-1 text-xs font-extrabold border border-black/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-black/40" />
                    Subscription: Expired
                  </span>
                ) : (
                  <span className="text-[13px] font-extrabold text-[#111827]">
                    Subscription: Active
                  </span>
                )}

                <span className="inline-flex items-center rounded-full bg-black/[0.06] text-black/80 px-3 py-1 text-xs font-extrabold border border-black/10">
                  Wallet: ${brand.walletBalance.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-[13px] font-semibold text-black/70">
                <p className="flex items-center gap-2">
                  <HiOutlineMail className="text-black/45" /> {brand.email}
                </p>
                <p className="flex items-center gap-2">
                  <HiPhone className="text-black/45" /> {brand.callingcode} {brand.phone}
                </p>
                <p className="flex items-center gap-2">
                  <HiLocationMarker className="text-black/45" /> {brand.country}
                </p>
                <p className="flex items-center gap-2">
                  <HiIdentification className="text-black/45" />
                  Business Type: <span className="font-extrabold text-[#111827]">{brand.businessType}</span>
                </p>
                <p className="flex items-center gap-2">
                  <HiUserGroup className="text-black/45" />
                  Company Size: <span className="font-extrabold text-[#111827]">{brand.companySize}</span>
                </p>
              </div>

              <div className="space-y-2 text-[13px] font-semibold text-black/70">
                <p>
                  <span className="text-black/55 font-extrabold">Category:</span> {brand.categoryName}
                </p>
                <p>
                  <span className="text-black/55 font-extrabold">Referral Code:</span> {brand.referralCode}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="border border-black/10 bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl border border-black/10 bg-black/[0.06] flex items-center justify-center text-black/70">
                  <HiClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[18px] md:text-[20px] font-extrabold text-[#111827]">
                    Subscription
                  </h3>
                  <p className="text-[13px] font-semibold text-black/55">
                    Plan status, billing and usage snapshot.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center rounded-full bg-black/[0.06] text-black/80 px-3 py-1 text-xs font-extrabold border border-black/10">
                Plan: {brand.subscription?.planName || "—"}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] font-semibold text-black/70">
              <p>
                <span className="text-black/55 font-extrabold">Role:</span>{" "}
                {brand.subscription?.role || "—"}
              </p>
              <p>
                <span className="text-black/55 font-extrabold">Status:</span>{" "}
                {brand.subscription?.status || "—"}
              </p>
              <p>
                <span className="text-black/55 font-extrabold">Monthly Cost:</span>{" "}
                {typeof brand.subscription?.monthlyCost === "number" && brand.subscription.monthlyCost > 0
                  ? `$${brand.subscription.monthlyCost}`
                  : "Free / N.A."}
              </p>
              <p>
                <span className="text-black/55 font-extrabold">Auto Renew:</span>{" "}
                {typeof brand.subscription?.autoRenew === "boolean"
                  ? brand.subscription.autoRenew
                    ? "Yes"
                    : "No"
                  : "—"}
              </p>
              <p>
                <span className="text-black/55 font-extrabold">Started:</span>{" "}
                {brand.subscription?.startedAt ? formatDate(brand.subscription.startedAt) : "—"}
              </p>
              <p>
                <span className="text-black/55 font-extrabold">Expires:</span>{" "}
                {brand.subscription?.expiresAt ? formatDate(brand.subscription.expiresAt) : "—"}
              </p>
            </div>

            {/* Subscription Features Table */}
            <div className="mt-5 overflow-hidden rounded-2xl border border-black/10 bg-white">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-white">
                    <TableHead className="py-4 text-xs font-extrabold text-black/60">
                      Feature
                    </TableHead>
                    <TableHead className="py-4 text-xs font-extrabold text-black/60">
                      Limit
                    </TableHead>
                    <TableHead className="py-4 text-xs font-extrabold text-black/60">
                      Used
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {(brand.subscription?.features || []).map((f) => {
                    const pct =
                      f.limit > 0
                        ? Math.min(100, Math.round((f.used / f.limit) * 100))
                        : 0;

                    return (
                      <TableRow
                        key={f.key}
                        className="border-b border-black/5 hover:bg-black/[0.02]"
                      >
                        <TableCell className="py-4 text-[13px] font-extrabold text-[#111827] capitalize">
                          {f.key.replace(/_/g, " ")}
                        </TableCell>

                        <TableCell className="py-4 text-[13px] font-semibold text-black/70">
                          {f.limit === -1 ? "Unlimited" : f.limit}
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="flex items-center justify-between text-[13px] font-semibold text-black/70">
                            <span className="font-extrabold text-[#111827]">{f.used}</span>
                            <span className="text-xs font-extrabold text-black/50">
                              {pct}%
                            </span>
                          </div>

                          <div className="mt-2 h-2 w-full rounded-full bg-black/10 overflow-hidden">
                            <div
                              className="h-full bg-black transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {(brand.subscription?.features || []).length === 0 && (
                    <TableRow className="border-b border-black/5">
                      <TableCell className="py-6 text-sm font-semibold text-black/55" colSpan={3}>
                        No feature snapshot found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Admin Upgrade / Update Plan */}
            <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[13px] font-extrabold text-[#111827] flex items-center gap-2">
                    <HiChevronDoubleRight className="text-black/70" />
                    Upgrade / Update Plan
                  </p>
                  <p className="text-xs font-semibold text-black/50">
                    Choose plan + set validity (days / expiry). You can also start from current expiry.
                  </p>
                </div>

                {checking ? (
                  <span className="text-xs font-semibold text-black/50">Checking…</span>
                ) : checkInfo ? (
                  <span
                    className={`text-xs px-3 py-1 rounded-full border font-extrabold ${
                      checkInfo.canProceed
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
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
                {/* Plan */}
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
                      {plans.map((p) => (
                        <SelectItem key={p.planId} value={p.planId}>
                          {(p.displayName || p.name).toUpperCase()}{" "}
                          {p.monthlyCost > 0 ? `- $${p.monthlyCost}/mo` : "- Free"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Billing Cycle */}
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-black/55">Billing Cycle</label>
                  <Select
                    value={billingCycle}
                    onValueChange={(val) => setBillingCycle(val as "monthly" | "annual")}
                  >
                    <SelectTrigger className="h-11 rounded-full border-black/10 bg-white text-[13px] font-semibold">
                      <SelectValue placeholder="Select cycle" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Apply From */}
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-black/55">Start counting from</label>
                  <Select
                    value={applyFrom}
                    onValueChange={(val) => setApplyFrom(val as "now" | "current_expiry")}
                  >
                    <SelectTrigger className="h-11 rounded-full border-black/10 bg-white text-[13px] font-semibold">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="now">Now</SelectItem>
                      <SelectItem value="current_expiry">Current expiry (extend)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] font-semibold text-black/50">
                    Use <b>Current expiry</b> if you want to extend without losing remaining days.
                  </p>
                </div>

                {/* Validity Mode */}
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

                {/* Custom Days */}
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-black/55">Days (if custom)</label>
                  <Input
                    placeholder="e.g. 14"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    disabled={validityMode !== "custom_days"}
                    className="h-11 rounded-full border-black/10 bg-white text-[13px] font-semibold"
                  />
                  <p className="text-[11px] font-semibold text-black/50">
                    Only used when validity is <b>Custom days</b>.
                  </p>
                </div>

                {/* Exact Expiry Date */}
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-black/55">Expiry date (if exact)</label>
                  <Input
                    type="date"
                    value={customExpiryDate}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    disabled={validityMode !== "exact_date"}
                    className="h-11 rounded-full border-black/10 bg-white text-[13px] font-semibold"
                  />
                  <p className="text-[11px] font-semibold text-black/50">
                    Only used when validity is <b>Exact expiry date</b>.
                  </p>
                </div>

                {/* Force Assign */}
                <div className="md:col-span-2 flex items-end">
                  <label className="flex items-center gap-2 text-[13px] font-semibold text-black/70 select-none">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-black"
                      checked={forceAssign}
                      onChange={(e) => setForceAssign(e.target.checked)}
                    />
                    Force assign (ignore upgrade rules / downgrade block)
                  </label>
                </div>

                {/* Action */}
                <div className="flex items-end">
                  <Button
                    onClick={upgradeOrUpdatePlan}
                    disabled={!selectedPlanId || assigning}
                    className="w-full h-11 rounded-full bg-black text-white hover:bg-black/90 text-[13px] font-extrabold"
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
                {assignMsg && (
                  <p className="text-[13px] font-semibold text-black/70">{assignMsg}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns */}
        <Card className="border border-black/10 bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-[18px] md:text-[20px] font-extrabold text-[#111827]">
                  Campaigns
                </h3>
                <p className="text-[13px] font-semibold text-black/55">
                  Browse campaigns for this brand.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search (pill) */}
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

                {/* Status Filter (pill) */}
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
                <div className="text-[13px] font-semibold text-black/55">
                  No campaigns found.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-white">
                          {[
                            { label: "Name", key: "productOrServiceName" as any, align: "left" as const },
                            { label: "Goal", key: "goal" as any, align: "left" as const },
                            { label: "Start", key: "startDate" as any, align: "center" as const },
                            { label: "End", key: "endDate" as any, align: "center" as const },
                            { label: "Applicants", key: "applicantCount" as any, align: "center" as const },
                            { label: "Status", key: "status" as any, align: "center" as const },
                            { label: "Open", key: undefined, align: "right" as const },
                          ].map((col) => (
                            <TableHead
                              key={col.label}
                              className={`py-4 text-xs font-extrabold text-black/60 whitespace-nowrap ${
                                col.key ? "cursor-pointer select-none" : ""
                              } ${
                                col.align === "center"
                                  ? "text-center"
                                  : col.align === "right"
                                  ? "text-right"
                                  : "text-left"
                              }`}
                              onClick={() => col.key && toggleSort(col.key)}
                            >
                              <div
                                className={`flex items-center gap-1 ${
                                  col.align === "center"
                                    ? "justify-center"
                                    : col.align === "right"
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                {col.label}
                                {col.key && sortBy === col.key && (
                                  sortAsc ? (
                                    <HiChevronUp className="ml-1" />
                                  ) : (
                                    <HiChevronDown className="ml-1" />
                                  )
                                )}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {campaigns.map((c) => (
                          <TableRow
                            key={c.campaignsId}
                            className="border-b border-black/5 hover:bg-black/[0.02]"
                          >
                            <TableCell
                              className="py-4 font-extrabold text-[#111827] max-w-[30ch] truncate"
                              title={c.productOrServiceName}
                            >
                              {formatCampaignName(c.productOrServiceName)}
                            </TableCell>

                            <TableCell
                              className="py-4 text-[13px] font-semibold text-black/70 max-w-[22ch] truncate"
                              title={c.goal || ""}
                            >
                              {c.goal || "—"}
                            </TableCell>

                            <TableCell className="py-4 text-center text-[13px] font-semibold text-black/70">
                              {formatDate(c.timeline?.startDate)}
                            </TableCell>

                            <TableCell className="py-4 text-center text-[13px] font-semibold text-black/70">
                              {formatDate(c.timeline?.endDate)}
                            </TableCell>

                            <TableCell className="py-4 text-center text-[13px] font-extrabold text-[#111827]">
                              {c.applicantCount ?? 0}
                            </TableCell>

                            <TableCell className="py-4 text-center">
                              {statusPill(c.isActive)}
                            </TableCell>

                            <TableCell className="py-4 text-right">
                              <Button
                                onClick={() =>
                                  router.push(`/admin/campaigns/view?id=${c.campaignsId}`)
                                }
                                className="h-9 rounded-full bg-black text-white hover:bg-black/90 px-4 text-[13px] font-extrabold"
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

                  {/* Pagination */}
                  {campaignsTotalPages > 1 && (
                    <div className="mt-4 flex justify-end items-center gap-2 flex-wrap">
                      <Button
                        onClick={() => setCampaignsPage((p) => Math.max(p - 1, 1))}
                        disabled={campaignsPage === 1}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full border-black/10 text-black/70 hover:bg-black hover:text-white hover:border-black"
                      >
                        <HiChevronLeftIcon />
                      </Button>

                      <span className="text-xs font-extrabold text-black/60">
                        Page {campaignsPage} of {campaignsTotalPages}
                      </span>

                      <Button
                        onClick={() =>
                          setCampaignsPage((p) => Math.min(p + 1, campaignsTotalPages))
                        }
                        disabled={campaignsPage === campaignsTotalPages}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full border-black/10 text-black/70 hover:bg-black hover:text-white hover:border-black"
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