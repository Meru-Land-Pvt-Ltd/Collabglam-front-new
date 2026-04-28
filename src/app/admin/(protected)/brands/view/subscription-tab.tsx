"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  BrandDetail,
  PlanChangeCheckResponse,
  PlanListItem,
} from "./types";
import {
  displayFeatureValue,
  formatCurrency,
  formatDate,
  formatDateTime,
  titleCaseFeature,
} from "./utils";
import { SectionCard, StatusPill } from "./shared";

type SubscriptionTabProps = {
  brand: BrandDetail;
  loadingPlans: boolean;
  planError: string | null;
  plans: PlanListItem[];
  selectedPlanId: string;
  setSelectedPlanId: (value: string) => void;
  billingCycle: "monthly" | "annual";
  setBillingCycle: (value: "monthly" | "annual") => void;
  validityMode: "plan_default" | "custom_days" | "exact_date";
  setValidityMode: (value: "plan_default" | "custom_days" | "exact_date") => void;
  customDays: string;
  setCustomDays: (value: string) => void;
  customExpiryDate: string;
  setCustomExpiryDate: (value: string) => void;
  applyFrom: "now" | "current_expiry";
  setApplyFrom: (value: "now" | "current_expiry") => void;
  checking: boolean;
  checkInfo: PlanChangeCheckResponse | null;
  forceAssign: boolean;
  setForceAssign: (value: boolean) => void;
  assigning: boolean;
  assignMsg: string | null;
  selectedPlan: PlanListItem | null;
  expiryPreview: Date | null;
  onUpdatePlan: () => void;
};

export function BrandSubscriptionTab(props: SubscriptionTabProps) {
  const {
    brand,
    loadingPlans,
    planError,
    plans,
    selectedPlanId,
    setSelectedPlanId,
    billingCycle,
    setBillingCycle,
    validityMode,
    setValidityMode,
    customDays,
    setCustomDays,
    customExpiryDate,
    setCustomExpiryDate,
    applyFrom,
    setApplyFrom,
    checking,
    checkInfo,
    forceAssign,
    setForceAssign,
    assigning,
    assignMsg,
    selectedPlan,
    expiryPreview,
    onUpdatePlan,
  } = props;

  const detailRows = [
    {
      label: "Plan Name",
      value: brand.subscription?.planName || brand.planName || "—",
    },
    { label: "Billing Cycle", value: brand.subscription?.billingCycle || "—" },
    {
      label: "Monthly Cost",
      value: formatCurrency(brand.subscription?.monthlyCost),
    },
    {
      label: "Annual Cost",
      value: formatCurrency(brand.subscription?.annualCost),
    },
    {
      label: "Status",
      value: brand.subscriptionExpired ? "Expired" : brand.subscription?.status || "Active",
    },
    {
      label: "Expiry Date",
      value: formatDate(brand.subscription?.expiresAt || brand.expiresAt),
    },
    {
      label: "Auto Renew",
      value: brand.subscription?.autoRenew ? "Yes" : "No",
    },
    {
      label: "Credits Used",
      value: brand.subscription?.internalCredits?.used ?? "—",
    },
  ];

  const features = brand.subscription?.features || [];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Subscription Details"
        description="Current plan configuration and billing specifics for this brand."
      >
        <div className="grid gap-0 md:grid-cols-2">
          {detailRows.map((row, index) => (
            <div
              key={row.label}
              className={`border-black/8 px-5 py-4 ${
                index % 2 === 0 ? "md:border-r" : ""
              } border-b`}
            >
              <p className="text-xs font-black uppercase tracking-[0.14em] text-black/40">
                {row.label}
              </p>
              <div className="mt-2 text-base font-black text-[#1a1a1a]">
                {row.label === "Status" ? (
                  row.value === "Active" ? (
                    <StatusPill label="Active" tone="success" />
                  ) : row.value === "Expired" ? (
                    <StatusPill label="Expired" tone="danger" />
                  ) : (
                    <StatusPill label={String(row.value)} tone="neutral" />
                  )
                ) : (
                  row.value
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Update Plan"
        description="Choose a new plan, billing cycle, and validity handling."
        action={
          checking ? (
            <span className="text-xs font-bold text-black/45">Checking…</span>
          ) : checkInfo ? (
            <StatusPill
              label={checkInfo.message}
              tone={checkInfo.canProceed ? "success" : "danger"}
            />
          ) : null
        }
      >
        <div className="space-y-5 p-5">
          {planError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {planError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/45">
                Plan
              </label>
              <Select
                value={selectedPlanId}
                onValueChange={setSelectedPlanId}
                disabled={loadingPlans}
              >
                <SelectTrigger className="h-11 rounded-2xl border-black/10 bg-white text-sm font-semibold">
                  <SelectValue placeholder={loadingPlans ? "Loading..." : "Select plan"} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {plans.map((plan) => (
                    <SelectItem key={plan.planId} value={plan.planId}>
                      {(plan.displayName || plan.name).toUpperCase()}{" "}
                      {plan.monthlyCost > 0 ? `- $${plan.monthlyCost}/mo` : "- Free"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/45">
                Billing Cycle
              </label>
              <Select
                value={billingCycle}
                onValueChange={(value) => setBillingCycle(value as "monthly" | "annual")}
              >
                <SelectTrigger className="h-11 rounded-2xl border-black/10 bg-white text-sm font-semibold">
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/45">
                Start Counting From
              </label>
              <Select
                value={applyFrom}
                onValueChange={(value) =>
                  setApplyFrom(value as "now" | "current_expiry")
                }
              >
                <SelectTrigger className="h-11 rounded-2xl border-black/10 bg-white text-sm font-semibold">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="now">Now</SelectItem>
                  <SelectItem value="current_expiry">Current expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/45">
                Validity
              </label>
              <Select
                value={validityMode}
                onValueChange={(value) =>
                  setValidityMode(
                    value as "plan_default" | "custom_days" | "exact_date"
                  )
                }
              >
                <SelectTrigger className="h-11 rounded-2xl border-black/10 bg-white text-sm font-semibold">
                  <SelectValue placeholder="Select validity" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="plan_default">Use plan default</SelectItem>
                  <SelectItem value="custom_days">Custom days</SelectItem>
                  <SelectItem value="exact_date">Exact expiry date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/45">
                Days (if custom)
              </label>
              <Input
                placeholder="e.g. 30"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                disabled={validityMode !== "custom_days"}
                className="h-11 rounded-2xl border-black/10 bg-white text-sm font-semibold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/45">
                Expiry Date (if exact)
              </label>
              <Input
                type="date"
                value={customExpiryDate}
                onChange={(e) => setCustomExpiryDate(e.target.value)}
                disabled={validityMode !== "exact_date"}
                className="h-11 rounded-2xl border-black/10 bg-white text-sm font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-black/60">
              <input
                type="checkbox"
                checked={forceAssign}
                onChange={(e) => setForceAssign(e.target.checked)}
                className="h-4 w-4 accent-[#1a1a1a]"
              />
              Force assign
            </label>

            <Button
              onClick={onUpdatePlan}
              disabled={!selectedPlanId || assigning}
              className="h-11 rounded-2xl bg-[#1a1a1a] px-6 text-sm font-extrabold text-white hover:bg-[#1a1a1a]/90"
            >
              {assigning ? "Updating..." : "Update Plan"}
            </Button>
          </div>

          <div className="rounded-2xl border border-black/8 bg-[#fafafa] px-4 py-3">
            {expiryPreview ? (
              <p className="text-sm font-semibold text-black/65">
                <span className="font-black text-[#1a1a1a]">Preview expiry:</span>{" "}
                {expiryPreview.toLocaleString()}
              </p>
            ) : null}

            {selectedPlan ? (
              <p className="mt-1 text-xs font-medium text-black/45">
                Plan duration:{" "}
                {selectedPlan.durationDays
                  ? `${selectedPlan.durationDays} days`
                  : selectedPlan.durationMins
                    ? `${selectedPlan.durationMins} minutes`
                    : selectedPlan.durationMinutes
                      ? `${selectedPlan.durationMinutes} minutes`
                      : "Default (30 days)"}
              </p>
            ) : null}

            {assignMsg ? (
              <p className="mt-2 text-sm font-semibold text-black/70">{assignMsg}</p>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Plan Features"
        description="Capabilities and current usage for the selected subscription."
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-black/6">
                <TableHead className="py-4 text-xs font-black uppercase tracking-[0.14em] text-black/45">
                  Feature
                </TableHead>
                <TableHead className="py-4 text-xs font-black uppercase tracking-[0.14em] text-black/45">
                  Value
                </TableHead>
                <TableHead className="py-4 text-xs font-black uppercase tracking-[0.14em] text-black/45">
                  Limit
                </TableHead>
                <TableHead className="py-4 text-xs font-black uppercase tracking-[0.14em] text-black/45">
                  Usage
                </TableHead>
                <TableHead className="py-4 text-xs font-black uppercase tracking-[0.14em] text-black/45">
                  Notes
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.length === 0 ? (
                <TableRow className="border-black/6">
                  <TableCell colSpan={5} className="py-8 text-center text-sm font-semibold text-black/45">
                    No feature snapshot found.
                  </TableCell>
                </TableRow>
              ) : (
                features.map((feature) => {
                  const hasNumericLimit =
                    typeof feature.limit === "number" && feature.limit > 0;
                  const percent = hasNumericLimit
                    ? Math.min(100, Math.round((feature.used / feature.limit) * 100))
                    : 0;

                  return (
                    <TableRow key={feature.key} className="border-black/6">
                      <TableCell className="py-4 text-sm font-black text-[#1a1a1a]">
                        {titleCaseFeature(feature.key)}
                      </TableCell>
                      <TableCell className="py-4 text-sm font-semibold text-black/65">
                        {displayFeatureValue(feature.value)}
                      </TableCell>
                      <TableCell className="py-4 text-sm font-semibold text-black/65">
                        {feature.limit === -1
                          ? "Unlimited"
                          : hasNumericLimit
                            ? feature.limit
                            : "—"}
                      </TableCell>
                      <TableCell className="py-4">
                        {hasNumericLimit ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm font-semibold text-black/65">
                              <span className="font-black text-[#1a1a1a]">{feature.used}</span>
                              <span>{percent}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-black/8">
                              <div
                                className="h-full rounded-full bg-[#1a1a1a]"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-black/45">
                            Not usage based
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-sm font-semibold text-black/65">
                        <div>{feature.note || "—"}</div>
                        <div className="mt-1 text-xs text-black/40">
                          {feature.resetsEvery || feature.resetsAt
                            ? `Resets ${feature.resetsEvery || ""} ${
                                feature.resetsAt
                                  ? `• ${formatDateTime(feature.resetsAt)}`
                                  : ""
                              }`
                            : "No reset info"}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}