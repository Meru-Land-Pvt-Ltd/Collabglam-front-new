"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { Outfit } from "next/font/google";
import {
  Search,
  Building2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Users,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock3,
  Eye,
  Plus,
  Pencil,
  Image as ImageIcon,
} from "lucide-react";

import { adminGet, adminPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AdminTable, { type AdminTableColumn } from "../../components/table";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

type BrandStatus = "active" | "expired" | "archived";
type BillingCycle = "monthly" | "annual";
type AssignRole = "RH" | "BME" | "IME";

type SortField =
  | "name"
  | "email"
  | "planName"
  | "createdAt"
  | "expiresAt"
  | "status";

interface ApiFeature {
  key: string;
  limit: number;
  used: number;
  value: string | number | boolean | string[] | null;
  note: string | null;
  resetsEvery?: string | null;
  resetsAt?: string | null;
}

interface ApiSubscription {
  planId?: string;
  planName?: string;
  role?: string;
  status?: "active" | "archived";
  monthlyCost?: number;
  annualCost?: number;
  billingCycle?: BillingCycle;
  autoRenew?: boolean;
  expiresAt?: string;
  startedAt?: string;
  features?: ApiFeature[];
  internalCredits?: { used: number; resetsAt: string | null };
}

interface ApiBrand {
  _id: string;
  brandId?: string;
  name?: string;
  brandName?: string;
  email: string;
  companySize?: string;
  industry?: string;
  createdAt: string;
  updatedAt?: string;
  profilePic?: string;
  proxyEmail?: string;
  subscription?: ApiSubscription;
  subscriptionExpired?: boolean;

  assignedRm?: string;
  assignedBm?: string;
  assignedIm?: string;

  assignedRh?: string;
  assignedBme?: string;
  assignedIme?: string;

  RHId?: string;
  bdmId?: string;
  idmId?: string;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
  teamType?: string;
  parentAdmin?: string;
}

interface BrandListResponse {
  success?: boolean;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  brands?: ApiBrand[];
  data?: ApiBrand[];
}

interface EmployeeListResponse {
  success: boolean;
  data: Employee[];
}

interface BrandRow {
  _id: string;
  brandId: string;
  name: string;
  contactName: string;
  email: string;
  proxyEmail: string;
  createdAt: string;
  updatedAt: string;
  planName: string;
  billingCycle: BillingCycle;
  amountPaid: number;
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  status: BrandStatus;
  companySize: string;
  industry: string;
  profilePic: string;
  features: ApiFeature[];
  internalCredits: { used: number; resetsAt: string | null };

  assignedRh: string;
  assignedBme: string;
  assignedIme: string;

  RHId: string;
  bdmId: string;
  idmId: string;
}

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_ROW_OPTIONS = [10, 20, 50, 100] as const;

const FEATURE_LABELS: Record<string, string> = {
  influencer_search_per_month: "Influencer Search",
  influencer_profile_views_per_month: "Profile Views",
  invites_per_month: "Invites",
  active_campaigns: "Active Campaigns",
  platforms_supported: "Platforms",
  direct_email_messaging_efs: "Direct Email",
  milestones_and_payouts: "Milestones & Payouts",
  message_templates: "Templates",
  advanced_filters: "Advanced Filters",
  dispute_assistance: "Dispute Assistance",
  support: "Support",
  creator_sourcing_and_outreach: "Creator Sourcing",
  shortlist_delivered: "Shortlists",
  negotiation_and_followups: "Negotiation",
};

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: number) {
  if (!value) return "Free";
  return `$${value.toLocaleString()}`;
}

function canManageCampaigns(brand: BrandRow) {
  const normalizedPlan = brand.planName.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalizedPlan === "fully_paid" || normalizedPlan === "fully_managed";
}

function getStatusFromApi(brand: ApiBrand): BrandStatus {
  if (brand.subscription?.status === "archived") return "archived";
  if (brand.subscriptionExpired) return "expired";
  return "active";
}

function mapBrand(brand: ApiBrand): BrandRow {
  const subscription = brand.subscription ?? {};
  const billingCycle = subscription.billingCycle ?? "monthly";
  const amountPaid =
    billingCycle === "annual"
      ? subscription.annualCost ?? 0
      : subscription.monthlyCost ?? 0;

  return {
    _id: brand._id,
    brandId: brand.brandId || brand._id,
    name: brand.brandName || brand.name || "—",
    contactName: brand.name || brand.brandName || "—",
    email: brand.email,
    proxyEmail: brand.proxyEmail || "",
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt || brand.createdAt,
    planName: subscription.planName || "—",
    billingCycle,
    amountPaid,
    startedAt: subscription.startedAt || brand.createdAt,
    expiresAt: subscription.expiresAt || "",
    autoRenew: subscription.autoRenew ?? false,
    status: getStatusFromApi(brand),
    companySize: brand.companySize || "—",
    industry: brand.industry || "—",
    profilePic: brand.profilePic || "",
    features: subscription.features ?? [],
    internalCredits: subscription.internalCredits ?? { used: 0, resetsAt: null },

    assignedRh: brand.assignedRh || brand.assignedRm || "",
    assignedBme: brand.assignedBme || brand.assignedBm || "",
    assignedIme: brand.assignedIme || brand.assignedIm || "",

    RHId: brand.RHId || "",
    bdmId: brand.bdmId || "",
    idmId: brand.idmId || "",
  };
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "B"
  );
}

function statusStyles(status: BrandStatus) {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "archived") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function roleMeta(role: AssignRole) {
  switch (role) {
    case "RH":
      return {
        label: "RH",
        payloadKey: "RHId",
        emptyLabel: "Assign RH",
      };
    case "BME":
      return {
        label: "BME",
        payloadKey: "bdmId",
        emptyLabel: "Assign BME",
      };
    case "IME":
      return {
        label: "IME",
        payloadKey: "idmId",
        emptyLabel: "Assign IME",
      };
    default:
      return {
        label: "RH",
        payloadKey: "RHId",
        emptyLabel: "Assign RH",
      };
  }
}

function isDataUrlImage(value?: string) {
  return !!value && /^data:image\//i.test(value);
}

function groupEmployeesByParent(employees: Employee[]) {
  return employees.reduce<Record<string, Employee[]>>((acc, employee) => {
    const key = String(employee.parentAdmin || "");
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(employee);
    return acc;
  }, {});
}

function buildEmployeeNameMap(employees: Employee[]) {
  return employees.reduce<Record<string, string>>((acc, employee) => {
    acc[employee._id] = employee.name;
    return acc;
  }, {});
}

const BrandAvatar = React.memo(function BrandAvatar({
  name,
  profilePic,
  size = "md",
}: {
  name: string;
  profilePic?: string;
  size?: "sm" | "md";
}) {
  const classes =
    size === "sm"
      ? "h-10 w-10 rounded-2xl text-sm"
      : "h-12 w-12 rounded-2xl text-base";

  if (isDataUrlImage(profilePic)) {
    return (
      <img
        src={profilePic}
        alt={name}
        className={`${classes} border border-slate-200 bg-slate-100 object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${classes} bg-slate-100 font-black text-slate-800`}
    >
      {initials(name)}
    </div>
  );
});

const StatusBadge = React.memo(function StatusBadge({
  status,
}: {
  status: BrandStatus;
}) {
  const Icon =
    status === "active"
      ? CheckCircle2
      : status === "archived"
        ? XCircle
        : Clock3;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${statusStyles(
        status
      )}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
});

const SummaryCard = React.memo(function SummaryCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-extrabold text-slate-900">{value}</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
});

const FeatureUsage = React.memo(function FeatureUsage({
  feature,
}: {
  feature: ApiFeature;
}) {
  if (!feature.limit || feature.limit <= 0) return null;

  const percent = Math.min(100, Math.round((feature.used / feature.limit) * 100));
  const tone =
    percent >= 90 ? "bg-rose-500" : percent >= 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold text-slate-600">
          {FEATURE_LABELS[feature.key] || feature.key.replace(/_/g, " ")}
        </p>
        <p className="text-[11px] font-extrabold text-slate-900">
          {feature.used}/{feature.limit}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
});

const BrandIdentityCell = React.memo(function BrandIdentityCell({
  brand,
}: {
  brand: BrandRow;
}) {
  return (
    <div className="flex min-w-[260px] items-center gap-3">
      <BrandAvatar name={brand.name} profilePic={brand.profilePic} size="sm" />

      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-slate-900">{brand.name}</p>

        <div className="mt-1 flex flex-col gap-1 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5 truncate">
            <Mail className="h-3.5 w-3.5" />
            {brand.email}
          </span>

          {brand.proxyEmail ? (
            <span className="truncate text-[11px] text-slate-400">
              Proxy: {brand.proxyEmail}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
});

const PlanCell = React.memo(function PlanCell({
  brand,
}: {
  brand: BrandRow;
}) {
  return (
    <div className="space-y-1">
      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-extrabold text-slate-800">
        {brand.planName}
      </span>
      <p className="text-[11px] font-medium text-slate-500">
        {formatMoney(brand.amountPaid)} · {brand.billingCycle}
      </p>
    </div>
  );
});

const AssigneeCell = React.memo(function AssigneeCell({
  brandId,
  currentValue,
  role,
  options,
  onSave,
  disabled = false,
  disabledLabel = "",
}: {
  brandId: string;
  currentValue: string;
  role: AssignRole;
  options: Employee[];
  onSave: (brandId: string, role: AssignRole, employeeId: string) => Promise<void>;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  const meta = roleMeta(role);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setSelected("");
        setError(null);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!selected) return;

    try {
      setSaving(true);
      setError(null);
      await onSave(brandId, role, selected);
      setOpen(false);
      setSelected("");
    } catch (err: any) {
      setError(err?.message || `Failed to assign ${meta.label}.`);
    } finally {
      setSaving(false);
    }
  };

  if (currentValue) {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-extrabold text-slate-700">
        {currentValue}
      </span>
    );
  }

  if (disabled) {
    return (
      <span className="inline-flex items-center rounded-full border border-dashed border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-400">
        {disabledLabel || `No ${meta.label} available`}
      </span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-500 transition hover:border-slate-500 hover:text-slate-800"
      >
        <Plus className="h-3.5 w-3.5" />
        {meta.emptyLabel}
      </button>
    );
  }

  return (
    <div
      ref={ref}
      onClick={(event) => event.stopPropagation()}
      className="min-w-[220px] rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-xl"
    >
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        Select {meta.label}
      </p>

      <select
        autoFocus
        value={selected}
        onChange={(event) => {
          setSelected(event.target.value);
          setError(null);
        }}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400"
      >
        <option value="">Choose {meta.label}</option>
        {options.map((employee) => (
          <option key={employee._id} value={employee._id}>
            {employee.name}
          </option>
        ))}
      </select>

      {error ? <p className="mt-2 text-[11px] font-semibold text-rose-600">{error}</p> : null}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !selected}
          className="rounded-xl"
        >
          {saving ? "Saving..." : "Save"}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={(event) => {
            event.stopPropagation();
            setOpen(false);
            setSelected("");
            setError(null);
          }}
          className="rounded-xl"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
});

const AssigneePanelCard = React.memo(function AssigneePanelCard({
  title,
  currentValue,
  employeeId,
  brandId,
  role,
  options,
  onSave,
  disabled,
  disabledLabel,
}: {
  title: string;
  currentValue: string;
  employeeId?: string;
  brandId: string;
  role: AssignRole;
  options: Employee[];
  onSave: (brandId: string, role: AssignRole, employeeId: string) => Promise<void>;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>

      <div className="mt-2 min-h-[44px]">
        {currentValue ? (
          <>
            <p className="text-sm font-extrabold text-slate-900">{currentValue}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {employeeId ? `Mapped ID: ${employeeId}` : "Assigned"}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-400">Not assigned</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {disabled ? disabledLabel || "Assignment unavailable" : "Ready to assign"}
            </p>
          </>
        )}
      </div>

      <div className="mt-4">
        <AssigneeCell
          brandId={brandId}
          currentValue={currentValue}
          role={role}
          options={options}
          onSave={onSave}
          disabled={disabled}
          disabledLabel={disabledLabel}
        />
      </div>
    </div>
  );
});

const BrandExpandedPanel = React.memo(function BrandExpandedPanel({
  brand,
  rhOptions,
  getScopedExecOptions,
  onAssignSave,
}: {
  brand: BrandRow;
  rhOptions: Employee[];
  getScopedExecOptions: (role: "BME" | "IME", brand: BrandRow) => Employee[];
  onAssignSave: (brandId: string, role: AssignRole, employeeId: string) => Promise<void>;
}) {
  const usageFeatures = brand.features.filter((item) => item.limit > 0);
  const brandBmeOptions = getScopedExecOptions("BME", brand);
  const brandImeOptions = getScopedExecOptions("IME", brand);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Contact", value: brand.contactName },
          { label: "Industry", value: brand.industry },
          { label: "Company Size", value: brand.companySize },
          { label: "Proxy Email", value: brand.proxyEmail || "—" },
          {
            label: "Billing",
            value: brand.billingCycle === "annual" ? "Annual" : "Monthly",
          },
          { label: "Auto Renew", value: brand.autoRenew ? "Enabled" : "Disabled" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-sm font-extrabold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white shadow-none">
        <div className="p-4">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Assigned Team
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AssigneePanelCard
              title="Assigned RH"
              currentValue={brand.assignedRh}
              employeeId={brand.RHId}
              brandId={brand._id}
              role="RH"
              options={rhOptions}
              onSave={onAssignSave}
            />

            <AssigneePanelCard
              title="Assigned BME"
              currentValue={brand.assignedBme}
              employeeId={brand.bdmId}
              brandId={brand._id}
              role="BME"
              options={brandBmeOptions}
              onSave={onAssignSave}
              disabled={!brand.RHId || (!brand.assignedBme && brandBmeOptions.length === 0)}
              disabledLabel={!brand.RHId ? "Assign RH first" : "No BME under RH"}
            />

            <AssigneePanelCard
              title="Assigned IME"
              currentValue={brand.assignedIme}
              employeeId={brand.idmId}
              brandId={brand._id}
              role="IME"
              options={brandImeOptions}
              onSave={onAssignSave}
              disabled={!brand.RHId || (!brand.assignedIme && brandImeOptions.length === 0)}
              disabledLabel={!brand.RHId ? "Assign RH first" : "No IME under RH"}
            />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.4fr,0.6fr]">
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-none">
          <div className="p-4">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Subscription Usage
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Metered usage across the current plan.
              </p>
            </div>

            {usageFeatures.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {usageFeatures.map((feature) => (
                  <FeatureUsage key={feature.key} feature={feature} />
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-500">
                No metered features found.
              </p>
            )}
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-none">
          <div className="p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Brand Media
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              {isDataUrlImage(brand.profilePic) ? (
                <img
                  src={brand.profilePic}
                  alt={brand.name}
                  className="h-32 w-32 rounded-2xl border border-slate-200 bg-white object-cover"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-slate-400">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}

              <p className="mt-3 text-xs font-medium text-slate-500">
                Profile picture is rendered directly when backend returns a data URL.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
});

const ActionIconButton = React.memo(function ActionIconButton({
  icon: Icon,
  tooltip,
  href,
  disabled = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
  href?: string;
  disabled?: boolean;
}) {
  const baseClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950";
  const disabledClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed";

  if (disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={disabledClass}>
            <Icon className="h-4 w-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (href) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            onClick={(event) => event.stopPropagation()}
            className={baseClass}
          >
            <Icon className="h-4 w-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className={baseClass}
        >
          <Icon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
});

const BrandActionButtons = React.memo(function BrandActionButtons({
  brand,
  canEditBrands,
}: {
  brand: BrandRow;
  canEditBrands: boolean;
}) {
  const canManage = canManageCampaigns(brand);

  const createDisabled = !canEditBrands || !canManage;
  const reviewDisabled = !canEditBrands || !canManage;

  const disabledReason = !canEditBrands
    ? "You do not have brand edit access"
    : "Available only for fully managed brands";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center justify-end gap-2">
        <ActionIconButton
          icon={Eye}
          tooltip="View details"
          href={`/admin/brands/view?brandId=${brand._id}`}
        />

        <ActionIconButton
          icon={Plus}
          tooltip={createDisabled ? disabledReason : "Create campaign"}
          href={`/admin/brands/create-campaign?brandId=${brand._id}`}
          disabled={createDisabled}
        />

        <ActionIconButton
          icon={Pencil}
          tooltip={reviewDisabled ? disabledReason : "Review campaigns"}
          href={`/admin/brands/review-campaigns?brandId=${brand._id}`}
          disabled={reviewDisabled}
        />
      </div>
    </TooltipProvider>
  );
});

const AdminBrandPage: NextPage = () => {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [rhOptions, setRhOptions] = useState<Employee[]>([]);
  const [bmeOptions, setBmeOptions] = useState<Employee[]>([]);
  const [imeOptions, setImeOptions] = useState<Employee[]>([]);

  const [canEditBrands, setCanEditBrands] = useState(false);

  const requestIdRef = useRef(0);

  useEffect(() => {
    try {
      const storedAdmin = JSON.parse(localStorage.getItem("admin") || "{}");
      const permissions = storedAdmin?.permissions ?? storedAdmin?.access ?? [];

      const allowed = permissions.some(
        (item: any) =>
          String(item?.key || "")
            .toLowerCase()
            .replace(/[\s_-]+/g, "") === "brands" && item?.isEdit === true
      );

      setCanEditBrands(allowed);
    } catch {
      setCanEditBrands(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchBrands = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);

      const response = await adminPost<BrandListResponse>("/admin/brand/getlist", {
        page,
        limit: pageSize,
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });

      if (requestId !== requestIdRef.current) return;

      const rawBrands = response.brands || response.data || [];
      const mapped = rawBrands.map(mapBrand);
      const nextTotal = response.total ?? mapped.length;
      const nextLimit = response.limit ?? pageSize;

      setBrands(mapped);
      setTotal(nextTotal);
      setPage(response.page ?? page);
      setPageSize(nextLimit);
      setTotalPages(
        response.totalPages ?? Math.max(1, Math.ceil(nextTotal / nextLimit))
      );
      setError(null);
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      console.error(err);
      setError(err?.message || "Failed to load brands.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [page, pageSize, debouncedSearch, sortBy, sortOrder]);

  const fetchAssignees = useCallback(async () => {
    try {
      const [rhResponse, bmeResponse, imeResponse] = await Promise.all([
        adminGet<EmployeeListResponse>("/admins/get-rm-list"),
        adminGet<EmployeeListResponse>("/admins/get-executive-list?role=bme"),
        adminGet<EmployeeListResponse>("/admins/get-executive-list?role=ime"),
      ]);

      if (rhResponse.success) setRhOptions(rhResponse.data ?? []);
      if (bmeResponse.success) setBmeOptions(bmeResponse.data ?? []);
      if (imeResponse.success) setImeOptions(imeResponse.data ?? []);
    } catch (err) {
      console.error("Failed to fetch assignees", err);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    fetchAssignees();
  }, [fetchAssignees]);

  const rhNameMap = useMemo(() => buildEmployeeNameMap(rhOptions), [rhOptions]);
  const bmeNameMap = useMemo(() => buildEmployeeNameMap(bmeOptions), [bmeOptions]);
  const imeNameMap = useMemo(() => buildEmployeeNameMap(imeOptions), [imeOptions]);

  const bmeOptionsByRh = useMemo(() => groupEmployeesByParent(bmeOptions), [bmeOptions]);
  const imeOptionsByRh = useMemo(() => groupEmployeesByParent(imeOptions), [imeOptions]);

  const getScopedExecOptions = useCallback(
    (role: "BME" | "IME", brand: BrandRow) => {
      if (!brand.RHId) return [];
      const key = String(brand.RHId);

      if (role === "BME") {
        return bmeOptionsByRh[key] ?? [];
      }

      return imeOptionsByRh[key] ?? [];
    },
    [bmeOptionsByRh, imeOptionsByRh]
  );

  const handleSort = useCallback(
    (field: string) => {
      const typedField = field as SortField;
      setPage(1);

      if (typedField === sortBy) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        return;
      }

      setSortBy(typedField);
      setSortOrder("asc");
    },
    [sortBy]
  );

  const handleAssignSave = useCallback(
    async (brandId: string, role: AssignRole, employeeId: string) => {
      const meta = roleMeta(role);

      await adminPost("/admins/assign-brand", {
        brandId,
        [meta.payloadKey]: employeeId,
      });

      setBrands((prev) =>
        prev.map((brand) => {
          if (brand._id !== brandId) return brand;

          if (role === "RH") {
            return {
              ...brand,
              assignedRh: rhNameMap[employeeId] || employeeId,
              RHId: employeeId,
              assignedBme: "",
              assignedIme: "",
              bdmId: "",
              idmId: "",
            };
          }

          if (role === "BME") {
            return {
              ...brand,
              assignedBme: bmeNameMap[employeeId] || employeeId,
              bdmId: employeeId,
            };
          }

          return {
            ...brand,
            assignedIme: imeNameMap[employeeId] || employeeId,
            idmId: employeeId,
          };
        })
      );
    },
    [rhNameMap, bmeNameMap, imeNameMap]
  );

  const handleToggleExpand = useCallback((brandId: string) => {
    setExpandedId((prev) => (prev === brandId ? null : brandId));
  }, []);

  const handleLimitChange = useCallback((limit: number) => {
    setPage(1);
    setPageSize(limit);
  }, []);

  const statusCounts = useMemo(
    () => ({
      active: brands.filter((item) => item.status === "active").length,
      expired: brands.filter((item) => item.status === "expired").length,
      archived: brands.filter((item) => item.status === "archived").length,
    }),
    [brands]
  );

  const assignedCounts = useMemo(
    () => ({
      rh: brands.filter((item) => Boolean(item.assignedRh)).length,
      bme: brands.filter((item) => Boolean(item.assignedBme)).length,
      ime: brands.filter((item) => Boolean(item.assignedIme)).length,
    }),
    [brands]
  );

  const columns = useMemo<AdminTableColumn<BrandRow>[]>(
    () => [
      {
        id: "name",
        header: "Brand",
        sortable: true,
        sortField: "name",
        widthClassName: "min-w-[280px]",
        render: (brand) => <BrandIdentityCell brand={brand} />,
      },
      {
        id: "planName",
        header: "Plan",
        sortable: true,
        sortField: "planName",
        align: "center",
        widthClassName: "min-w-[180px]",
        render: (brand) => <PlanCell brand={brand} />,
      },
      {
        id: "createdAt",
        header: "Created",
        sortable: true,
        sortField: "createdAt",
        align: "center",
        render: (brand) => (
          <span className="text-sm font-semibold text-slate-600">
            {formatDate(brand.createdAt)}
          </span>
        ),
      },
      {
        id: "expiresAt",
        header: "Expires",
        sortable: true,
        sortField: "expiresAt",
        align: "center",
        render: (brand) => (
          <span className="text-sm font-semibold text-slate-600">
            {formatDate(brand.expiresAt)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        sortField: "status",
        align: "center",
        render: (brand) => <StatusBadge status={brand.status} />,
      },
    ],
    []
  );

  const expandable = useMemo(
    () => ({
      expandedRowId: expandedId,
      onToggle: (rowId: string) => handleToggleExpand(rowId),
      renderExpandedRow: (brand: BrandRow) => (
        <BrandExpandedPanel
          brand={brand}
          rhOptions={rhOptions}
          getScopedExecOptions={getScopedExecOptions}
          onAssignSave={handleAssignSave}
        />
      ),
    }),
    [expandedId, handleToggleExpand, rhOptions, getScopedExecOptions, handleAssignSave]
  );

  const actions = useMemo(
    () => ({
      header: "Actions",
      align: "right" as const,
      render: (brand: BrandRow) => (
        <BrandActionButtons brand={brand} canEditBrands={canEditBrands} />
      ),
    }),
    [canEditBrands]
  );

  return (
    <div className={`${outfit.className} min-h-screen bg-slate-50`}>
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin Brand Control
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Admin Brand Management
              </h1>

              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                Manage brands, review subscription health, assign RH, BME, and IME,
                and render brand avatars directly from profilePic data URLs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={fetchBrands}
                disabled={loading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title="Total Brands"
            value={total}
            icon={Building2}
            hint="All matched brands from current query"
          />
          <SummaryCard
            title="Active Plans"
            value={statusCounts.active}
            icon={CheckCircle2}
            hint="Brands currently active on this page"
          />
          <SummaryCard
            title="RH Assigned"
            value={assignedCounts.rh}
            icon={Users}
            hint="Brands with RH already mapped"
          />
          <SummaryCard
            title="BME Assigned"
            value={assignedCounts.bme}
            icon={Briefcase}
            hint="Brands with BME assigned"
          />
          <SummaryCard
            title="IME Assigned"
            value={assignedCounts.ime}
            icon={CalendarDays}
            hint="Brands with IME assigned"
          />
        </div>

        <Card className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 md:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by brand, email, plan, or assignee..."
                  className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11 text-sm font-medium shadow-none focus-visible:ring-0"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {statusCounts.active} Active
                </span>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  {statusCounts.expired} Expired
                </span>
                <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                  {statusCounts.archived} Archived
                </span>
              </div>
            </div>
          </div>

          <AdminTable<BrandRow>
            data={brands}
            columns={columns}
            rowKey={(row) => row._id}
            loading={loading}
            loadingRows={Math.min(pageSize, 8)}
            error={error}
            emptyTitle="No brands found"
            emptyDescription="Try adjusting the search, filters, or refresh the data."
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            expandable={expandable}
            actions={actions}
            pagination={{
              page,
              totalPages,
              totalItems: total,
              limit: pageSize,
              onPageChange: setPage,
              onLimitChange: handleLimitChange,
              rowOptions: DEFAULT_ROW_OPTIONS,
              loading,
              showRowsSelector: true,
              showSummary: true,
            }}
            className="w-full"
            tableClassName="min-w-[1200px]"
            headerRowClassName="border-slate-200 hover:bg-transparent"
            bodyClassName="[&_tr:last-child]:border-b-0"
          />
        </Card>
      </div>
    </div>
  );
};

export default AdminBrandPage;