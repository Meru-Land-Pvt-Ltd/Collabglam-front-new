"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Outfit } from "next/font/google";
import { adminGet, adminPost } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  BrandDetail,
  BrandTab,
  Campaign,
  CampaignListResponse,
  PlanChangeCheckResponse,
  PlanListItem,
} from "./types";
import {
  addDays,
  addMinutes,
  getOverviewTeam,
  isBrandTab,
  safeDate,
} from "./utils";
import { BrandViewHeader } from "./header";
import { BrandViewTabs } from "./tabs";
import { BrandOverviewTab } from "./overview-tab";
import { BrandSubscriptionTab } from "./subscription-tab";
import { BrandCampaignsTab } from "./campaigns-tab";
import { BrandInvoicesTab } from "./invoices-tab";
import { BrandActivityTab } from "./activity-tab";
import { BrandSettingsTab } from "./settings-tab";
import { BrandCouponsTab } from "./coupon-tab";

/* ---------- API PATHS ---------- */
const API_LIST_PLANS = "/subscription/list";
const API_CHECK_CHANGE = "/subscription/check-brand";
const API_ADMIN_ASSIGN = "/admin/assignBrandPlan";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export default function ViewBrandPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const brandId = params.get("brandId") || undefined;
  const activeTab: BrandTab = isBrandTab(params.get("tab"))
    ? (params.get("tab") as BrandTab)
    : "overview";

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

  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [validityMode, setValidityMode] = useState<
    "plan_default" | "custom_days" | "exact_date"
  >("plan_default");
  const [customDays, setCustomDays] = useState("");
  const [customExpiryDate, setCustomExpiryDate] = useState("");
  const [applyFrom, setApplyFrom] = useState<"now" | "current_expiry">("now");
  const [checkInfo, setCheckInfo] = useState<PlanChangeCheckResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [forceAssign, setForceAssign] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false);

  const apiSortBy = useMemo(() => (sortBy === "status" ? "isActive" : sortBy), [sortBy]);

  const currentExpiry = brand?.subscription?.expiresAt
    ? safeDate(brand.subscription.expiresAt)
    : safeDate(brand?.expiresAt);

  const selectedPlan = useMemo(
    () => plans.find((item) => item.planId === selectedPlanId) || null,
    [plans, selectedPlanId]
  );

  const teamRows = useMemo(() => {
    if (!brand) return [];
    return getOverviewTeam(brand);
  }, [brand]);

  const assignedTeamCount = useMemo(
    () => teamRows.filter((item) => item.value !== "Unassigned").length,
    [teamRows]
  );

  const setActiveTab = useCallback(
    (tab: BrandTab) => {
      if (!brandId) return;

      const next = new URLSearchParams(params.toString());
      next.set("brandId", brandId);
      next.set("tab", tab);
      router.replace(`${pathname}?${next.toString()}`);
    },
    [brandId, params, pathname, router]
  );

  const fetchBrand = useCallback(async (id: string) => {
    setLoadingBrand(true);

    try {
      const data = await adminGet<BrandDetail>("/admin/brand/getById", { id });
      setBrand(data);
      setErrorBrand(null);
    } catch (err: any) {
      setErrorBrand(err?.message || "Failed to load brand.");
    } finally {
      setLoadingBrand(false);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
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

      const resp = await adminPost<CampaignListResponse>("/admin/campaign/getByBrandId", payload);
      setCampaigns(resp.campaigns || []);
      setCampaignsTotalPages(resp.totalPages || 1);
    } catch (err: any) {
      setErrorCampaigns(err?.message || "Failed to load campaigns.");
    } finally {
      setLoadingCampaigns(false);
    }
  }, [brandId, campaignsPage, searchTerm, statusFilter, apiSortBy, sortAsc]);

  const fetchPlans = useCallback(async () => {
    if (!brand) return;

    setLoadingPlans(true);
    setPlanError(null);

    try {
      const resp = await adminPost<{ plans: PlanListItem[] }>(API_LIST_PLANS, {
        role: "Brand",
        includeArchived: false,
      });

      const nextPlans = resp?.plans || [];
      setPlans(nextPlans);

      const currentPlanId = brand.subscription?.planId;
      if (currentPlanId) setSelectedPlanId(currentPlanId);
      else if (nextPlans[0]?.planId) setSelectedPlanId(nextPlans[0].planId);
    } catch (err: any) {
      setPlanError(err?.message || "Failed to load plans.");
    } finally {
      setLoadingPlans(false);
    }
  }, [brand]);

  const checkPlanChange = useCallback(
    async (planId: string) => {
      if (!brandId || !planId) return;

      setChecking(true);

      try {
        const resp = await adminPost<PlanChangeCheckResponse>(API_CHECK_CHANGE, {
          brandId,
          planId,
        });
        setCheckInfo(resp);
      } catch {
        setCheckInfo(null);
      } finally {
        setChecking(false);
      }
    },
    [brandId]
  );

  const computeExpiryPreview = useCallback(() => {
    const base =
      applyFrom === "current_expiry" && currentExpiry ? currentExpiry : new Date();

    if (validityMode === "exact_date" && customExpiryDate) {
      const dt = new Date(`${customExpiryDate}T00:00:00.000Z`);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }

    if (validityMode === "custom_days" && customDays) {
      const days = Number(customDays);
      if (!Number.isFinite(days) || days <= 0) return null;
      return addDays(base, days);
    }

    if (!selectedPlan) return addDays(base, 30);

    const mins =
      (Number(selectedPlan.durationMins) > 0 && Number(selectedPlan.durationMins)) ||
      (Number(selectedPlan.durationMinutes) > 0 && Number(selectedPlan.durationMinutes)) ||
      (Number(selectedPlan.durationDays) > 0 && Number(selectedPlan.durationDays) * 1440) ||
      43200;

    return addMinutes(base, mins);
  }, [applyFrom, currentExpiry, customDays, customExpiryDate, selectedPlan, validityMode]);

  const upgradeOrUpdatePlan = useCallback(async () => {
    if (!brandId || !selectedPlanId) return;

    if (checkInfo && checkInfo.canProceed === false && !forceAssign) {
      setAssignMsg(`❌ ${checkInfo.message}`);
      return;
    }

    if (validityMode === "custom_days") {
      const days = Number(customDays);
      if (!Number.isFinite(days) || days <= 0) {
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
        payload.expiresAt = new Date(`${customExpiryDate}T00:00:00.000Z`).toISOString();
      }

      await adminPost<BrandDetail>(API_ADMIN_ASSIGN, payload);
      setAssignMsg("✅ Plan updated successfully.");
      setForceAssign(false);

      await fetchBrand(brandId);
      await checkPlanChange(payload.planId);
    } catch (err: any) {
      setAssignMsg(`❌ ${err?.message || "Failed to update plan."}`);
    } finally {
      setAssigning(false);
    }
  }, [
    applyFrom,
    billingCycle,
    brandId,
    checkInfo,
    checkPlanChange,
    customDays,
    customExpiryDate,
    fetchBrand,
    forceAssign,
    selectedPlanId,
    validityMode,
  ]);

  const toggleSort = (key: keyof Campaign | "startDate" | "endDate" | "status") => {
    if (sortBy === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortBy(key);
      setSortAsc(true);
    }
    setCampaignsPage(1);
  };

  useEffect(() => {
    if (brandId) {
      fetchBrand(brandId);
    }
  }, [brandId, fetchBrand]);

  useEffect(() => {
    if (activeTab === "campaigns") {
      fetchCampaigns();
    }
  }, [activeTab, fetchCampaigns]);

  useEffect(() => {
    if (brand && activeTab === "subscription") {
      fetchPlans();
    }
  }, [activeTab, brand, fetchPlans]);

  useEffect(() => {
    if (activeTab === "subscription" && selectedPlanId && brandId) {
      checkPlanChange(selectedPlanId);
    }
  }, [activeTab, selectedPlanId, brandId, checkPlanChange]);

  const expiryPreview = computeExpiryPreview();

  if (loadingBrand) {
    return (
      <div className={`${outfit.className} min-h-screen bg-[#fafafa]`}>
        <div className="mx-auto max-w-[1380px] space-y-6 px-4 py-6 md:px-6 md:py-8">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-36 w-full rounded-[24px]" />
          <Skeleton className="h-12 w-full rounded-[24px]" />
          <Skeleton className="h-[420px] w-full rounded-[24px]" />
        </div>
      </div>
    );
  }

  if (errorBrand) {
    return (
      <div className={`${outfit.className} min-h-screen bg-[#fafafa]`}>
        <div className="mx-auto max-w-[1380px] px-4 py-6 md:px-6 md:py-8">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {errorBrand}
          </div>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className={`${outfit.className} min-h-screen bg-[#fafafa]`}>
        <div className="mx-auto max-w-[1380px] px-4 py-6 text-sm font-semibold text-black/60 md:px-6 md:py-8">
          No brand found.
        </div>
      </div>
    );
  }

  return (
    <div className={`${outfit.className} min-h-screen bg-[#fafafa] text-[#1a1a1a]`}>
      <div className="mx-auto max-w-full space-y-6 px-4 py-6 md:px-6 md:py-8">
        <BrandViewHeader
          brand={brand}
          onBack={() => router.back()}
          onEdit={() => setActiveTab("settings")}
          onCreateCampaign={() =>
            router.push(`/admin/brands/create-campaign?brandId=${brand._id}`)
          }
        />

        <BrandViewTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" ? (
          <BrandOverviewTab
            brand={brand}
            onTabChange={setActiveTab}
            onRefresh={() => brandId && fetchBrand(brandId)}
            onCreateCampaign={() =>
              router.push(`/admin/brands/create-campaign?brandId=${brand._id}`)
            }
            onAddTeam={() => setIsAddTeamOpen(true)}
            onManageTeam={() => setIsManageTeamOpen(true)}
          />
        ) : null}

        {activeTab === "subscription" ? (
          <BrandSubscriptionTab
            brand={brand}
            loadingPlans={loadingPlans}
            planError={planError}
            plans={plans}
            selectedPlanId={selectedPlanId}
            setSelectedPlanId={setSelectedPlanId}
            billingCycle={billingCycle}
            setBillingCycle={setBillingCycle}
            validityMode={validityMode}
            setValidityMode={setValidityMode}
            customDays={customDays}
            setCustomDays={setCustomDays}
            customExpiryDate={customExpiryDate}
            setCustomExpiryDate={setCustomExpiryDate}
            applyFrom={applyFrom}
            setApplyFrom={setApplyFrom}
            checking={checking}
            checkInfo={checkInfo}
            forceAssign={forceAssign}
            setForceAssign={setForceAssign}
            assigning={assigning}
            assignMsg={assignMsg}
            selectedPlan={selectedPlan}
            expiryPreview={expiryPreview}
            onUpdatePlan={upgradeOrUpdatePlan}
          />
        ) : null}

        {activeTab === "campaigns" ? (
          <BrandCampaignsTab
            brandId={brand._id}
            campaigns={campaigns}
            loadingCampaigns={loadingCampaigns}
            errorCampaigns={errorCampaigns}
            campaignsPage={campaignsPage}
            campaignsTotalPages={campaignsTotalPages}
            setCampaignsPage={setCampaignsPage}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortBy={sortBy}
            sortAsc={sortAsc}
            toggleSort={toggleSort}
          />
        ) : null}

        {activeTab === "invoices" ? <BrandInvoicesTab /> : null}
        {activeTab === "activity" ? <BrandActivityTab /> : null}
        {activeTab === "settings" ? <BrandSettingsTab brand={brand} /> : null}
        {activeTab === "coupons" ? (
          <BrandCouponsTab
            brand={brand}
            onCreated={async () => {
              if (!brandId) return;
              await fetchBrand(brandId);
            }}
          />
        ) : null}
      </div>

      <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
        <DialogContent className="max-w-2xl rounded-[28px] border border-black/10 p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-[#1a1a1a]">
                Add Team
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-black/55">
                Add or assign team members directly from the Overview tab.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 rounded-[22px] border border-dashed border-black/10 bg-black/[0.02] p-5">
              <p className="text-sm font-semibold text-[#1a1a1a]">
                Add your team form, drawer content, or assignment component here.
              </p>
              <p className="mt-2 text-sm text-black/55">
                This dialog is opened from Overview only, so the user does not need to go to Settings.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                className="rounded-full border-black/10"
                onClick={() => setIsAddTeamOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isManageTeamOpen} onOpenChange={setIsManageTeamOpen}>
        <DialogContent className="max-w-3xl rounded-[28px] border border-black/10 p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-[#1a1a1a]">
                Manage Team
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-black/55">
                Review and manage assigned roles directly inside the Overview tab.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 rounded-[22px] border border-black/8 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-black text-[#1a1a1a]">Current Team Assignments</p>
                <span className="rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 text-xs font-bold text-[#1a1a1a]">
                  {assignedTeamCount}/{teamRows.length} assigned
                </span>
              </div>

              <div className="space-y-3">
                {teamRows.length ? (
                  teamRows.map((item) => (
                    <div
                      key={item.role}
                      className="flex items-center justify-between rounded-2xl border border-black/8 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-extrabold text-[#1a1a1a]">{item.role}</p>
                        <p className="mt-1 text-sm text-black/55">
                          {item.value === "Unassigned" ? "— Unassigned —" : item.value}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${item.value === "Unassigned"
                          ? "border border-amber-200 bg-amber-50 text-amber-700"
                          : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}
                      >
                        {item.value === "Unassigned" ? "Unassigned" : "Assigned"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-black/10 bg-black/[0.02] px-4 py-4 text-sm font-medium text-black/55">
                    No team roles are available yet.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                className="rounded-full border-black/10"
                onClick={() => setIsManageTeamOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}