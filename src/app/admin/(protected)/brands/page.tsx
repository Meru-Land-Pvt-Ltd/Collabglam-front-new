"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { Outfit } from "next/font/google";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Building2,
  Mail,
  RefreshCw,
  MoreHorizontal,
  ShieldCheck,
  Users,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock3,
  Image as ImageIcon,
} from "lucide-react";
import {
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiChevronUp,
  HiOutlineEye,
  HiOutlinePlus,
  HiPencil,
} from "react-icons/hi";

import { get, post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

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
  | "status"
  | "assignedRh"
  | "assignedBme"
  | "assignedIme";

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
const COL_SPAN = 10;

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

const SORT_LABELS: Record<SortField, string> = {
  name: "Brand",
  email: "Email",
  planName: "Plan",
  createdAt: "Created",
  expiresAt: "Expires",
  status: "Status",
  assignedRh: "RH",
  assignedBme: "BME",
  assignedIme: "IME",
};

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
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "archived") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function isFullyManagedSubscription(brand: BrandRow) {
  const normalizedPlan = brand.planName.toLowerCase();

  const managedPlanMatch =
    normalizedPlan.includes("fully managed") ||
    normalizedPlan.includes("full managed") ||
    normalizedPlan.includes("managed");

  const managedFeatureMatch = brand.features.some((feature) =>
    [
      "creator_sourcing_and_outreach",
      "shortlist_delivered",
      "negotiation_and_followups",
    ].includes(feature.key)
  );

  return managedPlanMatch || managedFeatureMatch;
}

function roleMeta(role: AssignRole) {
  switch (role) {
    case "RH":
      return {
        label: "RH",
        payloadKey: "RHId",
        valueKey: "assignedRh" as const,
        idKey: "RHId" as const,
        emptyLabel: "Assign RH",
      };
    case "BME":
      return {
        label: "BME",
        payloadKey: "bdmId",
        valueKey: "assignedBme" as const,
        idKey: "bdmId" as const,
        emptyLabel: "Assign BME",
      };
    case "IME":
      return {
        label: "IME",
        payloadKey: "idmId",
        valueKey: "assignedIme" as const,
        idKey: "idmId" as const,
        emptyLabel: "Assign IME",
      };
  }
}

function isDataUrlImage(value?: string) {
  return !!value && /^data:image\//i.test(value);
}

const BrandAvatar = ({
  name,
  profilePic,
  size = "md",
}: {
  name: string;
  profilePic?: string;
  size?: "sm" | "md";
}) => {
  const classes =
    size === "sm"
      ? "h-10 w-10 rounded-2xl text-sm"
      : "h-12 w-12 rounded-2xl text-base";

  if (isDataUrlImage(profilePic)) {
    return (
      <img
        src={profilePic}
        alt={name}
        className={`${classes} border border-slate-200 object-cover bg-slate-100`}
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
};

const StatusBadge = ({ status }: { status: BrandStatus }) => {
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
};

const SummaryCard = ({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}) => (
  <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{title}</p>
        <h3 className="mt-2 text-2xl font-extrabold text-slate-900">{value}</h3>
        <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </Card>
);

const FeatureUsage = ({ feature }: { feature: ApiFeature }) => {
  if (!feature.limit || feature.limit <= 0) return null;

  const percent = Math.min(100, Math.round((feature.used / feature.limit) * 100));
  const tone = percent >= 90 ? "bg-rose-500" : percent >= 70 ? "bg-amber-500" : "bg-emerald-500";

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
};

const SkeletonRows = () => (
  <>
    {Array.from({ length: 6 }).map((_, rowIndex) => (
      <TableRow key={rowIndex} className="border-slate-100">
        {Array.from({ length: COL_SPAN }).map((__, cellIndex) => (
          <TableCell key={cellIndex} className="py-4">
            <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

const ExpandedContent = ({ brand }: { brand: BrandRow }) => {
  const usageFeatures = brand.features.filter((item) => item.limit > 0);

  return (
    <TableRow className="border-slate-100 bg-slate-50/70">
      <TableCell colSpan={COL_SPAN} className="px-6 py-5">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {[
              { label: "Contact", value: brand.contactName },
              { label: "Industry", value: brand.industry },
              { label: "Company Size", value: brand.companySize },
              { label: "Proxy Email", value: brand.proxyEmail || "—" },
              { label: "Billing", value: brand.billingCycle === "annual" ? "Annual" : "Monthly" },
              { label: "Auto Renew", value: brand.autoRenew ? "Enabled" : "Disabled" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-extrabold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>

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
                  <p className="text-sm font-medium text-slate-500">No metered features found.</p>
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
                      className="h-32 w-32 rounded-2xl border border-slate-200 object-cover bg-white"
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
      </TableCell>
    </TableRow>
  );
};

const AssigneeCell = ({
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
}) => {
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
        <HiOutlinePlus className="h-3.5 w-3.5" />
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
};

const AdminBrandPage: NextPage = () => {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);

      const response = await post<BrandListResponse>("/admin/brand/getlist", {
        page,
        limit: pageSize,
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });

      const rawBrands = response.brands || response.data || [];
      const mapped = rawBrands.map(mapBrand);

      setBrands(mapped);
      setTotal(response.total ?? mapped.length);
      setPage(response.page ?? page);
      setPageSize(response.limit ?? pageSize);
      setTotalPages(
        response.totalPages ?? Math.max(1, Math.ceil((response.total ?? mapped.length) / pageSize))
      );
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load brands.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, sortBy, sortOrder]);

  const fetchAssignees = useCallback(async () => {
    try {
      const [rhResponse, bmeResponse, imeResponse] = await Promise.all([
        get<EmployeeListResponse>("/admins/get-rm-list"),
        get<EmployeeListResponse>("/admins/get-executive-list?role=bme"),
        get<EmployeeListResponse>("/admins/get-executive-list?role=ime"),
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

  const handleSearch = (value: string) => {
    setSearch(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
      setPage(1);
    }, 400);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const getScopedExecOptions = useCallback(
    (role: "BME" | "IME", brand: BrandRow) => {
      if (!brand.RHId) return [];

      const source = role === "BME" ? bmeOptions : imeOptions;

      return source.filter(
        (employee) => String(employee.parentAdmin || "") === String(brand.RHId)
      );
    },
    [bmeOptions, imeOptions]
  );

  const handleAssignSave = async (brandId: string, role: AssignRole, employeeId: string) => {
    const meta = roleMeta(role);

    await post("/admins/assign-brand", {
      brandId,
      [meta.payloadKey]: employeeId,
    });

    const source = role === "RH" ? rhOptions : role === "BME" ? bmeOptions : imeOptions;
    const employee = source.find((item) => item._id === employeeId);

    setBrands((prev) =>
      prev.map((brand) => {
        if (brand._id !== brandId) return brand;

        if (role === "RH") {
          return {
            ...brand,
            assignedRh: employee?.name || employeeId,
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
            assignedBme: employee?.name || employeeId,
            bdmId: employeeId,
          };
        }

        return {
          ...brand,
          assignedIme: employee?.name || employeeId,
          idmId: employeeId,
        };
      })
    );
  };

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

  const SortHead = ({
    field,
    align = "left",
  }: {
    field: SortField;
    align?: "left" | "center" | "right";
  }) => (
    <TableHead
      className={`cursor-pointer py-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 ${
        align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
      }`}
      onClick={() => handleSort(field)}
    >
      <div
        className={`flex items-center gap-1 ${
          align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"
        }`}
      >
        {SORT_LABELS[field]}
        {sortBy === field ? (
          sortOrder === "asc" ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />
        ) : null}
      </div>
    </TableHead>
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
                Manage brands, review subscription health, assign RH, BME, and IME, and render brand avatars directly from profilePic data URLs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={fetchBrands} disabled={loading}>
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
            hint="All listed brands in the current result set"
          />
          <SummaryCard
            title="Active Plans"
            value={statusCounts.active}
            icon={CheckCircle2}
            hint="Brands currently in active status"
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
                  onChange={(event) => handleSearch(event.target.value)}
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

          {error ? (
            <div className="mx-4 mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 md:mx-5">
              {error}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-transparent">
                  <TableHead className="w-10 py-4" />
                  <SortHead field="name" />
                  <SortHead field="planName" align="center" />
                  <SortHead field="createdAt" align="center" />
                  <SortHead field="expiresAt" align="center" />
                  <SortHead field="status" align="center" />
                  <SortHead field="assignedRh" align="center" />
                  <SortHead field="assignedBme" align="center" />
                  <SortHead field="assignedIme" align="center" />
                  <TableHead className="py-4 text-right text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? <SkeletonRows /> : null}

                {!loading && brands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COL_SPAN} className="py-12 text-center">
                      <div className="mx-auto max-w-md space-y-2">
                        <p className="text-base font-extrabold text-slate-900">No brands found</p>
                        <p className="text-sm font-medium text-slate-500">
                          Try adjusting the search or refresh the data.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}

                {!loading &&
                  brands.map((brand) => {
                    const isExpanded = expandedId === brand._id;
                    const isFullyManaged = isFullyManagedSubscription(brand);

                    const brandBmeOptions = getScopedExecOptions("BME", brand);
                    const brandImeOptions = getScopedExecOptions("IME", brand);

                    return (
                      <React.Fragment key={brand._id}>
                        <TableRow
                          className={`cursor-pointer border-slate-100 transition ${
                            isExpanded ? "bg-slate-50" : "hover:bg-slate-50/70"
                          }`}
                          onClick={() => setExpandedId(isExpanded ? null : brand._id)}
                        >
                          <TableCell className="pl-4 pr-1">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                          </TableCell>

                          <TableCell className="py-4">
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
                          </TableCell>

                          <TableCell className="py-4 text-center">
                            <div className="space-y-1">
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-extrabold text-slate-800">
                                {brand.planName}
                              </span>
                              <p className="text-[11px] font-medium text-slate-500">
                                {formatMoney(brand.amountPaid)} · {brand.billingCycle}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="py-4 text-center text-sm font-semibold text-slate-600">
                            {formatDate(brand.createdAt)}
                          </TableCell>

                          <TableCell className="py-4 text-center text-sm font-semibold text-slate-600">
                            {formatDate(brand.expiresAt)}
                          </TableCell>

                          <TableCell className="py-4 text-center">
                            <StatusBadge status={brand.status} />
                          </TableCell>

                          <TableCell className="py-3 text-center" onClick={(event) => event.stopPropagation()}>
                            <AssigneeCell
                              brandId={brand._id}
                              currentValue={brand.assignedRh}
                              role="RH"
                              options={rhOptions}
                              onSave={handleAssignSave}
                            />
                          </TableCell>

                          <TableCell className="py-3 text-center" onClick={(event) => event.stopPropagation()}>
                            <AssigneeCell
                              brandId={brand._id}
                              currentValue={brand.assignedBme}
                              role="BME"
                              options={brandBmeOptions}
                              onSave={handleAssignSave}
                              disabled={!brand.RHId || (!brand.assignedBme && brandBmeOptions.length === 0)}
                              disabledLabel={!brand.RHId ? "Assign RH first" : "No BME under RH"}
                            />
                          </TableCell>

                          <TableCell className="py-3 text-center" onClick={(event) => event.stopPropagation()}>
                            <AssigneeCell
                              brandId={brand._id}
                              currentValue={brand.assignedIme}
                              role="IME"
                              options={brandImeOptions}
                              onSave={handleAssignSave}
                              disabled={!brand.RHId || (!brand.assignedIme && brandImeOptions.length === 0)}
                              disabledLabel={!brand.RHId ? "Assign RH first" : "No IME under RH"}
                            />
                          </TableCell>

                          <TableCell className="py-4 text-right" onClick={(event) => event.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-slate-500 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                                  aria-label="Open actions"
                                >
                                  <MoreHorizontal className="h-4.5 w-4.5" />
                                </button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end" className="w-64 rounded-2xl border-slate-200">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/admin/brands/view?brandId=${brand._id}`}
                                    className="flex items-center gap-2"
                                  >
                                    <HiOutlineEye className="h-4 w-4" />
                                    View details
                                  </Link>
                                </DropdownMenuItem>

                                {isFullyManaged ? (
                                  <>
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/admin/brands/create-campaign?brandId=${brand._id}`}
                                        className="flex items-center gap-2"
                                      >
                                        <HiOutlinePlus className="h-4 w-4" />
                                        Create campaign
                                      </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/admin/brands/review-campaigns?brandId=${brand._id}`}
                                        className="flex items-center gap-2"
                                      >
                                        <HiPencil className="h-4 w-4" />
                                        Review campaigns
                                      </Link>
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <>
                                    <DropdownMenuItem
                                      disabled
                                      className="cursor-not-allowed opacity-50 focus:bg-transparent"
                                    >
                                      <span className="flex items-center gap-2">
                                        <HiOutlinePlus className="h-4 w-4" />
                                        Create campaign
                                      </span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      disabled
                                      className="cursor-not-allowed opacity-50 focus:bg-transparent"
                                    >
                                      <span className="flex items-center gap-2">
                                        <HiPencil className="h-4 w-4" />
                                        Review campaigns
                                      </span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>

                        {isExpanded ? <ExpandedContent brand={brand} /> : null}
                      </React.Fragment>
                    );
                  })}
              </TableBody>
            </Table>
          </div>

          {!loading && brands.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4 md:px-5">
              <p className="text-sm font-semibold text-slate-500">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                  <HiChevronLeft className="h-4 w-4" />
                </Button>

                <div className="min-w-[110px] text-center text-sm font-extrabold text-slate-700">
                  Page {page} / {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  disabled={page === totalPages}
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  <HiChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
};

export default AdminBrandPage;
