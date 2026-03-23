"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { Outfit } from "next/font/google";

import {
  HiOutlineEye,
  HiChevronUp,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiOutlinePlus,
  HiPencil,
  HiDotsVertical,
} from "react-icons/hi";
import { Search, ChevronDown, ChevronRight } from "lucide-react";

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

import { get, post } from "@/lib/api";

// ─── API types ────────────────────────────────────────────────────────────────

interface ApiFeature {
  key: string;
  limit: number;
  used: number;
  value: string | null;
  note: string | null;
}

interface ApiSubscription {
  planId?: string;
  planName: string;
  role?: string;
  status: "active" | "expired" | "cancelled";
  monthlyCost: number;
  annualCost: number;
  billingCycle: "monthly" | "annual";
  autoRenew: boolean;
  durationMins?: number;
  expiresAt: string;
  startedAt: string;
  features: ApiFeature[];
  internalCredits?: { used: number; resetsAt: string | null };
}

interface ApiBrand {
  _id: string;
  email: string;
  brandName: string;
  name: string;
  companySize?: string;
  industry?: string;
  callingcode?: string;
  phone?: string;
  subscription: ApiSubscription;
  createdAt: string;
  profilePic?: string;
  assignedRm?: string;
  assignedBm?: string;
  assignedIm?: string;
}

interface GetListResponse {
  success: boolean;
  data: ApiBrand[];
}

// ─── Employee (RM executive) types ────────────────────────────────────────────

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  teamType?: string;
}

interface EmployeeListResponse {
  success: boolean;
  count: number;
  data: Employee[];
}

// ─── Normalised row type ──────────────────────────────────────────────────────

interface PaidBrand {
  _id: string;
  name: string;
  contactName: string;
  email: string;
  callingcode?: string;
  phone?: string;
  companySize: string;
  industry: string;
  planName: string;
  amountPaid: number;
  billingCycle: "monthly" | "annual";
  autoRenew: boolean;
  paidAt: string;
  expiresAt: string;
  status: "active" | "expired" | "cancelled";
  assignedRm: string;
  assignedBm: string;
  assignedIm: string;
  features: ApiFeature[];
  internalCredits: { used: number; resetsAt: string | null };
}

function mapApiBrand(b: ApiBrand): PaidBrand {
  const sub = b.subscription ?? ({} as ApiSubscription);
  const amountPaid =
    sub.billingCycle === "annual" ? sub.annualCost : sub.monthlyCost;

  return {
    _id: b._id,
    name: b.brandName ?? b.name ?? "—",
    contactName: b.name ?? "—",
    email: b.email,
    callingcode: b.callingcode,
    phone: b.phone,
    companySize: b.companySize ?? "—",
    industry: b.industry ?? "—",
    planName: sub.planName
      ? sub.planName.charAt(0).toUpperCase() + sub.planName.slice(1)
      : "—",
    amountPaid: amountPaid ?? 0,
    billingCycle: sub.billingCycle ?? "monthly",
    autoRenew: sub.autoRenew ?? false,
    paidAt: sub.startedAt ?? b.createdAt,
    expiresAt: sub.expiresAt ?? "",
    status: sub.status ?? "active",
    assignedRm: b.assignedRm ?? "",
    assignedBm: b.assignedBm ?? "",
    assignedIm: b.assignedIm ?? "",
    features: sub.features ?? [],
    internalCredits: sub.internalCredits ?? { used: 0, resetsAt: null },
  };
}

// ─── Constants & helpers ──────────────────────────────────────────────────────

type SortField = keyof PaidBrand;

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const DEFAULT_PAGE_SIZE = 10;
const COL_SPAN = 11; // expand + brand + plan + amount + started + expires + status + rm + bm + im + actions

const FEATURE_LABELS: Record<string, string> = {
  influencer_search_per_month: "Influencer Search",
  influencer_profile_views_per_month: "Profile Views",
  invites_per_month: "Invites",
  active_campaigns: "Active Campaigns",
  platforms_supported: "Platforms",
  direct_email_messaging_efs: "Direct Email (EFS)",
  milestones_and_payouts: "Milestones & Payouts",
  message_templates: "Message Templates",
  advanced_filters: "Advanced Filters",
  dispute_assistance: "Dispute Assistance",
  support: "Support",
  creator_sourcing_and_outreach: "Creator Sourcing & Outreach",
  shortlist_delivered: "Shortlist Delivered",
  negotiation_and_followups: "Negotiation & Follow-ups",
};

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: PaidBrand["status"] }) => {
  if (status === "active")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-extrabold">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Active
      </span>
    );
  if (status === "cancelled")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-600 px-3 py-1 text-xs font-extrabold border border-red-200">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        Cancelled
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.06] text-black/60 px-3 py-1 text-xs font-extrabold border border-black/10">
      <span className="h-1.5 w-1.5 rounded-full bg-black/40" />
      Expired
    </span>
  );
};

const PlanBadge = ({ plan }: { plan: string }) => {
  const styles: Record<string, string> = {
    Enterprise: "bg-violet-50 text-violet-700 border-violet-200",
    Pro: "bg-blue-50 text-blue-700 border-blue-200",
    Growth: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const cls = styles[plan] ?? "bg-black/[0.06] text-black/70 border-black/10";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold ${cls}`}>
      {plan}
    </span>
  );
};

// ─── Inline RM assignment cell ────────────────────────────────────────────────

const RmCell = ({
  brandId,
  currentRm,   // raw value from API — name string if assigned, "" if not
  employees,
  onSaved,
}: {
  brandId: string;
  currentRm: string;
  employees: Employee[];
  onSaved: (brandId: string, rmId: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const isAssigned = Boolean(currentRm);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSelected("");
        setSaveError(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    try {
      await post("/admins/assign-brand", { brandId, RHId: selected });
      onSaved(brandId, selected);
      setOpen(false);
    } catch (err: any) {
      console.error(err);
      setSaveError(err?.message || "Failed to assign. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected("");
    setSaveError(null);
    setOpen(false);
  };

  // ── Already assigned — show name, no edit ────────────────────────────────
  if (isAssigned) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] border border-black/10 px-2.5 py-1 text-[12px] font-extrabold text-[#111827]">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
        {currentRm}
      </span>
    );
  }

  // ── Not assigned — show trigger button ───────────────────────────────────
  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setSelected("");
          setSaveError(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-black/20 px-2.5 py-1 text-[12px] font-semibold text-black/40 hover:border-black/40 hover:text-black/60 transition-colors"
      >
        <HiOutlinePlus className="h-3 w-3" />
        Assign RM
      </button>
    );
  }

  // ── Dropdown ─────────────────────────────────────────────────────────────
  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col gap-2 min-w-[200px] rounded-xl border border-black/10 bg-white shadow-lg p-2"
    >
      <select
        autoFocus
        value={selected}
        onChange={(e) => { setSelected(e.target.value); setSaveError(null); }}
        className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[12px] font-semibold text-[#111827] focus:outline-none focus:ring-1 focus:ring-black/20"
      >
        <option value="">— Select RM —</option>
        {employees.map((emp) => (
          <option key={emp._id} value={emp._id}>
            {emp.name}
          </option>
        ))}
      </select>

      {saveError && (
        <p className="px-1 text-[11px] font-semibold text-red-500 leading-tight">
          {saveError}
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={saving || !selected}
          onClick={handleSave}
          className="flex-1 rounded-lg bg-[#111827] py-1.5 text-[11px] font-extrabold text-white hover:bg-black/80 disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 rounded-lg border border-black/10 py-1.5 text-[11px] font-extrabold text-black/60 hover:bg-black/[0.04] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── Generic assign cell (BM / IM) ───────────────────────────────────────────
// Same UX as RmCell but accepts a configurable endpoint payload key.

const AssignCell = ({
  brandId,
  currentValue,
  executives,
  payloadKey,
  label,
  onSaved,
}: {
  brandId: string;
  currentValue: string;
  executives: Employee[];
  payloadKey: string;          // e.g. "BMId" | "IMId"
  label: string;               // e.g. "BM" | "IM"
  onSaved: (brandId: string, execId: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const isAssigned = Boolean(currentValue);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSelected("");
        setSaveError(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    try {
      await post("/admins/assign-brand", { brandId, [payloadKey]: selected });
      onSaved(brandId, selected);
      setOpen(false);
    } catch (err: any) {
      console.error(err);
      setSaveError(err?.message || "Failed to assign. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected("");
    setSaveError(null);
    setOpen(false);
  };

  if (isAssigned) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] border border-black/10 px-2.5 py-1 text-[12px] font-extrabold text-[#111827]">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
        {currentValue}
      </span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setSelected("");
          setSaveError(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-black/20 px-2.5 py-1 text-[12px] font-semibold text-black/40 hover:border-black/40 hover:text-black/60 transition-colors"
      >
        <HiOutlinePlus className="h-3 w-3" />
        Assign {label}
      </button>
    );
  }

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col gap-2 min-w-[200px] rounded-xl border border-black/10 bg-white shadow-lg p-2"
    >
      <select
        autoFocus
        value={selected}
        onChange={(e) => { setSelected(e.target.value); setSaveError(null); }}
        className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[12px] font-semibold text-[#111827] focus:outline-none focus:ring-1 focus:ring-black/20"
      >
        <option value="">— Select {label} —</option>
        {executives.map((emp) => (
          <option key={emp._id} value={emp._id}>
            {emp.name}
          </option>
        ))}
      </select>

      {saveError && (
        <p className="px-1 text-[11px] font-semibold text-red-500 leading-tight">
          {saveError}
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={saving || !selected}
          onClick={handleSave}
          className="flex-1 rounded-lg bg-[#111827] py-1.5 text-[11px] font-extrabold text-white hover:bg-black/80 disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 rounded-lg border border-black/10 py-1.5 text-[11px] font-extrabold text-black/60 hover:bg-black/[0.04] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── Skeleton row ─────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <TableRow className="border-b border-black/5">
    {Array.from({ length: COL_SPAN }).map((_, i) => (
      <TableCell key={i} className="py-4">
        <div className="h-4 rounded-full bg-black/[0.06] animate-pulse w-full" />
      </TableCell>
    ))}
  </TableRow>
);

// ─── Feature usage bar ────────────────────────────────────────────────────────

const FeatureBar = ({ feature }: { feature: ApiFeature }) => {
  const label = FEATURE_LABELS[feature.key] ?? feature.key.replace(/_/g, " ");
  const isFlag = feature.limit === 0;
  const pct = isFlag ? 0 : Math.min(100, Math.round((feature.used / feature.limit) * 100));
  const danger = pct >= 90;
  const warn = pct >= 70;

  if (isFlag) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-black/55 capitalize">{label}</span>
        <span className="text-[11px] font-extrabold text-black/70 shrink-0">
          {feature.used} / {feature.limit}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full ${
            danger ? "bg-red-400" : warn ? "bg-amber-400" : "bg-emerald-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Expanded detail panel ────────────────────────────────────────────────────

const ExpandedRow = ({ brand }: { brand: PaidBrand }) => {
  const usageFeatures = brand.features.filter((f) => f.limit > 0);
  const flagFeatures = brand.features.filter((f) => f.limit === 0);

  return (
    <TableRow className="bg-[#f9fafb] border-b border-black/5">
      <TableCell colSpan={COL_SPAN} className="py-0">
        <div className="px-6 py-5 space-y-5">

          {/* ── Info grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
            {[
              { label: "Industry",     value: brand.industry },
              { label: "Company Size", value: brand.companySize },
              { label: "Contact",      value: brand.contactName },
              { label: "Billing",      value: brand.billingCycle === "annual" ? "Annual" : "Monthly" },
              { label: "Auto Renew",   value: brand.autoRenew ? "Yes" : "No" },
              { label: "Amount",       value: brand.amountPaid > 0 ? `$${brand.amountPaid.toLocaleString()}` : "Free" },
              { label: "Started",      value: fmtDate(brand.paidAt) },
              { label: "Expires",      value: fmtDate(brand.expiresAt) },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-0.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-black/35">{label}</div>
                <div className="text-[13px] font-extrabold text-[#111827]">{value}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-black/[0.06]" />

          {/* ── Feature usage ── */}
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-black/35 mb-3">
              Subscription Feature Usage
            </div>

            {usageFeatures.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-3">
                {usageFeatures.map((f) => (
                  <FeatureBar key={f.key} feature={f} />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-black/40 font-semibold">No metered features on this plan.</p>
            )}

            {flagFeatures.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-black/35">Add-ons / Flags</div>
                <div className="flex flex-wrap gap-2">
                  {flagFeatures.map((f) => (
                    <span
                      key={f.key}
                      className="inline-flex items-center rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-black/50"
                    >
                      {FEATURE_LABELS[f.key] ?? f.key.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </TableCell>
    </TableRow>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const PaidBrandsPage: NextPage = () => {
  const [brands, setBrands] = useState<PaidBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [executives, setExecutives] = useState<Employee[]>([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("paidAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize, search: debouncedSearch, sortBy, sortOrder };
      const response = await get<GetListResponse>("/admins/fully-manged-brand-list", params);
      if (!response.success) throw new Error("API returned success: false");
      const mapped = (response.data ?? []).map(mapApiBrand);
      setBrands(mapped);
      setTotal(mapped.length);
      setTotalPages(Math.max(1, Math.ceil(mapped.length / pageSize)));
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load brands.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  // ── Fetch RM executives ───────────────────────────────────────────────────
  useEffect(() => {
    get<EmployeeListResponse>("/admins/get-rm-list")
      .then((res) => { if (res.success) setEmployees(res.data ?? []); })
      .catch(console.error);
  }, []);

  // ── Fetch BM / IM executives ──────────────────────────────────────────────
  useEffect(() => {
    get<EmployeeListResponse>("/admins/get-executive-list")
      .then((res) => { if (res.success) setExecutives(res.data ?? []); })
      .catch(console.error);
  }, []);

  // Optimistically update assignedRm in local state after successful save
  // The API stores/returns the name, so look up the name from employees
  const handleRmSaved = (brandId: string, rmId: string) => {
    setBrands((prev) =>
      prev.map((b) => {
        if (b._id !== brandId) return b;
        const emp = employees.find((e) => e._id === rmId);
        return { ...b, assignedRm: emp?.name ?? rmId };
      })
    );
  };

  const handleBmSaved = (brandId: string, execId: string) => {
    setBrands((prev) =>
      prev.map((b) => {
        if (b._id !== brandId) return b;
        const emp = executives.find((e) => e._id === execId);
        return { ...b, assignedBm: emp?.name ?? execId };
      })
    );
  };

  const handleImSaved = (brandId: string, execId: string) => {
    setBrands((prev) =>
      prev.map((b) => {
        if (b._id !== brandId) return b;
        const emp = executives.find((e) => e._id === execId);
        return { ...b, assignedIm: emp?.name ?? execId };
      })
    );
  };

  const toggleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder((p) => (p === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortOrder("asc"); }
    setPage(1);
  };

  const statusCounts = {
    active:    brands.filter((b) => b.status === "active").length,
    expired:   brands.filter((b) => b.status === "expired").length,
    cancelled: brands.filter((b) => b.status === "cancelled").length,
  };

  const paginated = brands.slice((page - 1) * pageSize, page * pageSize);

  const Th = ({
    field, label, align = "left",
  }: { field: SortField; label: string; align?: "left" | "center" | "right" }) => (
    <TableHead
      onClick={() => toggleSort(field)}
      className={`cursor-pointer py-4 text-xs font-extrabold text-black/60 whitespace-nowrap
        ${align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"}`}
    >
      <div className={`flex items-center gap-1 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"}`}>
        {label}
        {sortBy === field && (sortOrder === "asc" ? <HiChevronUp /> : <HiChevronDown />)}
      </div>
    </TableHead>
  );

  return (
    <div className={`${outfit.className} min-h-screen w-full`}>
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-10 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#111827] leading-tight">Paid Brands</h1>
            <p className="mt-1 text-[13px] font-semibold text-black/55">
              All brands with an active or historical paid subscription. Click a row to see details.
            </p>
          </div>

          {!loading && !error && (
            <div className="flex items-center gap-2 flex-wrap">
              {(["active", "expired", "cancelled"] as const).map((s) => {
                const styles = {
                  active:    "bg-emerald-50 text-emerald-700 border-emerald-200",
                  expired:   "bg-black/[0.06] text-black/60 border-black/10",
                  cancelled: "bg-red-50 text-red-600 border-red-200",
                };
                return (
                  <span key={s} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold capitalize ${styles[s]}`}>
                    {statusCounts[s]} {s}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 flex items-center gap-3">
            <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
            {error}
            <button onClick={fetchBrands} className="ml-auto rounded-lg border border-red-300 px-3 py-1 text-xs font-extrabold hover:bg-red-100">
              Retry
            </button>
          </div>
        )}

        {/* ── Search ── */}
        <Card className="border border-black/10 bg-white rounded-2xl">
          <div className="p-4 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/55" />
              <Input
                placeholder="Search by name, email, plan, status…"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-11 rounded-full border-black/10 bg-white pl-11 text-[13px] font-semibold placeholder:text-black/40 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </Card>

        {/* ── Table ── */}
        <Card className="border border-black/10 bg-white rounded-2xl overflow-hidden">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white">
                  <TableHead className="w-8 py-4" /> {/* expand chevron */}
                  <Th field="name"       label="Brand"   align="left" />
                  <Th field="planName"   label="Plan"    align="center" />
                  <Th field="amountPaid" label="Amount"  align="center" />
                  <Th field="paidAt"     label="Started" align="center" />
                  <Th field="expiresAt"  label="Expires" align="center" />
                  <Th field="status"     label="Status"  align="center" />
                  <Th field="assignedRm" label="RM"      align="center" />
                  <Th field="assignedBm" label="BM"      align="center" />
                  <Th field="assignedIm" label="IM"      align="center" />
                  <TableHead className="py-4 text-xs font-extrabold text-black/60 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

                {!loading && brands.length === 0 && (
                  <TableRow className="border-b border-black/5">
                    <TableCell colSpan={COL_SPAN} className="text-center text-black/55 py-10 text-sm font-semibold">
                      {error ? "Could not load brands." : "No paid brands match the criteria."}
                    </TableCell>
                  </TableRow>
                )}

                {!loading && paginated.map((b) => {
                  const isExpanded = expandedId === b._id;
                  const initials = (b.name || "—").trim().slice(0, 1).toUpperCase();

                  return (
                    <React.Fragment key={b._id}>
                      {/* ── Main row ── */}
                      <TableRow
                        className={`border-b border-black/5 cursor-pointer transition-colors ${
                          isExpanded ? "bg-black/[0.025]" : "hover:bg-black/[0.015]"
                        }`}
                        onClick={() => setExpandedId(isExpanded ? null : b._id)}
                      >
                        {/* Expand chevron */}
                        <TableCell className="py-4 pl-4 pr-1 w-8">
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4 text-black/40" />
                            : <ChevronRight className="h-4 w-4 text-black/25" />}
                        </TableCell>

                        {/* Brand */}
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <div className="h-9 w-9 rounded-full border border-black/10 bg-black/[0.06] flex items-center justify-center text-sm font-extrabold text-[#111827] shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-extrabold text-[#111827] truncate">{b.name}</div>
                              <div className="text-[11px] font-semibold text-black/45 truncate">{b.email}</div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Plan */}
                        <TableCell className="py-4 text-center">
                          <PlanBadge plan={b.planName} />
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="py-4 text-center text-[13px] font-extrabold text-[#111827]">
                          {b.amountPaid > 0
                            ? `$${b.amountPaid.toLocaleString()}`
                            : <span className="text-black/40 font-semibold">Free</span>}
                        </TableCell>

                        {/* Started */}
                        <TableCell className="py-4 text-center text-[13px] font-semibold text-black/70 whitespace-nowrap">
                          {fmtDate(b.paidAt)}
                        </TableCell>

                        {/* Expires */}
                        <TableCell className="py-4 text-center text-[13px] font-semibold text-black/70 whitespace-nowrap">
                          {fmtDate(b.expiresAt)}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-4 text-center">
                          <StatusBadge status={b.status} />
                        </TableCell>

                        {/* RM — inline editable cell */}
                        <TableCell className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <RmCell
                            brandId={b._id}
                            currentRm={b.assignedRm}
                            employees={employees}
                            onSaved={handleRmSaved}
                          />
                        </TableCell>

                        {/* BM */}
                        <TableCell className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <AssignCell
                            brandId={b._id}
                            currentValue={b.assignedBm}
                            executives={executives}
                            payloadKey="bdmId"
                            label="BM"
                            onSaved={handleBmSaved}
                          />
                        </TableCell>

                        {/* IM */}
                        <TableCell className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <AssignCell
                            brandId={b._id}
                            currentValue={b.assignedIm}
                            executives={executives}
                            payloadKey="idmId"
                            label="IM"
                            onSaved={handleImSaved}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-lg text-black/70 hover:bg-black/[0.04] focus:outline-none"
                                aria-label="Actions"
                              >
                                <HiDotsVertical className="h-5 w-5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[200px] rounded-xl border border-black/10 bg-white text-black shadow-lg">
                              <DropdownMenuItem asChild className="cursor-pointer focus:bg-black/5">
                                <Link href={`/admin/brands/view?brandId=${b._id}`}>
                                  <span className="flex items-center gap-2 text-[13px] font-semibold">
                                    <HiOutlineEye className="h-4 w-4" /> View details
                                  </span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="cursor-pointer focus:bg-black/5">
                                <Link href={`/admin/brands/create-campaign?brandId=${b._id}`}>
                                  <span className="flex items-center gap-2 text-[13px] font-semibold">
                                    <HiOutlinePlus className="h-4 w-4" /> Create Campaign
                                  </span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="cursor-pointer focus:bg-black/5">
                                <Link href={`/admin/brands/review-campaigns?brandId=${b._id}`}>
                                  <span className="flex items-center gap-2 text-[13px] font-semibold">
                                    <HiPencil className="h-4 w-4" /> Review Campaigns
                                  </span>
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {/* ── Expanded detail panel ── */}
                      {isExpanded && <ExpandedRow brand={b} />}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          {!loading && paginated.length > 0 && (
            <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap border-t border-black/5 bg-white">
              <div className="text-xs font-extrabold text-black/60">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="icon" disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="h-8 w-8 rounded-full border-black/10 text-black/70 hover:bg-black hover:text-white hover:border-black"
                >
                  <HiChevronLeft />
                </Button>
                <div className="text-xs font-extrabold text-black/60">Page {page} of {totalPages}</div>
                <Button
                  variant="outline" size="icon" disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  className="h-8 w-8 rounded-full border-black/10 text-black/70 hover:bg-black hover:text-white hover:border-black"
                >
                  <HiChevronRight />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PaidBrandsPage;