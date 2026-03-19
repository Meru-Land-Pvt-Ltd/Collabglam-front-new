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
  planName: string;
  status: "active" | "expired" | "cancelled";
  monthlyCost: number;
  annualCost: number;
  billingCycle: "monthly" | "annual";
  autoRenew: boolean;
  expiresAt: string;
  startedAt: string;
  features: ApiFeature[];
  internalCredits?: { used: number; resetsAt: string | null };
}

interface ApiBrandPopulated {
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
  proxyEmail?: string;
}

interface ApiAllocation {
  _id: string;                      // allocation doc _id
  brandId: ApiBrandPopulated;       // populated
  RHId: string;                     // RM id
  bdmId: string;                    // BM id
  idmId: string;                    // IM id
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface AllocatedBrandsResponse {
  success: boolean;
  message?: string;
  count: number;
  data: ApiAllocation[];
}

// ─── Employee types ───────────────────────────────────────────────────────────

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface EmployeeListResponse {
  success: boolean;
  count: number;
  data: Employee[];
}

// ─── Normalised row ───────────────────────────────────────────────────────────

interface AllocatedBrand {
  allocationId: string;
  brandId: string;
  brandName: string;
  contactName: string;
  email: string;
  companySize: string;
  industry: string;
  planName: string;
  subStatus: "active" | "expired" | "cancelled";
  expiresAt: string;
  startedAt: string;
  features: ApiFeature[];
  allocationStatus: "active" | "inactive";
  assignedAt: string;
  RHId: string;
  bdmId: string;
  idmId: string;
}

function mapAllocation(a: ApiAllocation): AllocatedBrand {
  const b = a.brandId;
  const sub = b.subscription ?? ({} as ApiSubscription);
  return {
    allocationId: a._id,
    brandId: b._id,
    brandName: b.brandName ?? b.name ?? "—",
    contactName: b.name ?? "—",
    email: b.email,
    companySize: b.companySize ?? "—",
    industry: b.industry ?? "—",
    planName: sub.planName
      ? sub.planName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "—",
    subStatus: sub.status ?? "active",
    expiresAt: sub.expiresAt ?? "",
    startedAt: sub.startedAt ?? b.createdAt,
    features: sub.features ?? [],
    allocationStatus: a.status ?? "active",
    assignedAt: a.createdAt,
    RHId: a.RHId ?? "",
    bdmId: a.bdmId ?? "",
    idmId: a.idmId ?? "",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const DEFAULT_PAGE_SIZE = 10;
const COL_SPAN = 8; // expand + brand + plan + sub-status + assigned + expires + alloc-status + actions

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

// ─── Badges ───────────────────────────────────────────────────────────────────

const SubStatusBadge = ({ status }: { status: AllocatedBrand["subStatus"] }) => {
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

const AllocStatusBadge = ({ status }: { status: AllocatedBrand["allocationStatus"] }) => {
  if (status === "active")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-xs font-extrabold">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        Assigned
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.06] text-black/60 px-3 py-1 text-xs font-extrabold border border-black/10">
      <span className="h-1.5 w-1.5 rounded-full bg-black/40" />
      Inactive
    </span>
  );
};

const PlanBadge = ({ plan }: { plan: string }) => {
  const styles: Record<string, string> = {
    "Fully Paid":  "bg-violet-50 text-violet-700 border-violet-200",
    "Enterprise":  "bg-violet-50 text-violet-700 border-violet-200",
    "Pro":         "bg-blue-50 text-blue-700 border-blue-200",
    "Growth":      "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const cls = styles[plan] ?? "bg-black/[0.06] text-black/70 border-black/10";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold ${cls}`}>
      {plan}
    </span>
  );
};

// ─── AssigneeChip — shows an employee name looked up from a list ──────────────

const AssigneeChip = ({
  id,
  list,
  dotColor = "bg-emerald-400",
}: {
  id: string;
  list: Employee[];
  dotColor?: string;
}) => {
  const name = list.find((e) => e._id === id)?.name ?? id;
  if (!id) return <span className="text-black/30 text-[13px]">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] border border-black/10 px-2.5 py-1 text-[12px] font-extrabold text-[#111827]">
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
      {name}
    </span>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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
  if (feature.limit === 0) return null;
  const pct = Math.min(100, Math.round((feature.used / feature.limit) * 100));
  const danger = pct >= 90;
  const warn = pct >= 70;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-black/55 capitalize">{label}</span>
        <span className="text-[11px] font-extrabold text-black/70 shrink-0">{feature.used} / {feature.limit}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full ${danger ? "bg-red-400" : warn ? "bg-amber-400" : "bg-emerald-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Expanded detail panel ────────────────────────────────────────────────────

const ExpandedRow = ({
  brand,
  rmList,
  execList,
}: {
  brand: AllocatedBrand;
  rmList: Employee[];
  execList: Employee[];
}) => {
  const usageFeatures = brand.features.filter((f) => f.limit > 0);
  const flagFeatures  = brand.features.filter((f) => f.limit === 0);
  const rmName   = rmList.find((e) => e._id === brand.RHId)?.name   ?? brand.RHId  ?? "—";
  const bdmName  = execList.find((e) => e._id === brand.bdmId)?.name ?? brand.bdmId ?? "—";
  const idmName  = execList.find((e) => e._id === brand.idmId)?.name ?? brand.idmId ?? "—";

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
              { label: "Email",        value: brand.email },
              { label: "Plan",         value: brand.planName },
              { label: "Sub Status",   value: brand.subStatus },
              { label: "Started",      value: fmtDate(brand.startedAt) },
              { label: "Expires",      value: fmtDate(brand.expiresAt) },
              { label: "Assigned On",  value: fmtDate(brand.assignedAt) },
              { label: "RM (RH)",      value: rmName },
              { label: "BDM",          value: bdmName },
              { label: "IDM",          value: idmName },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-0.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-black/35">{label}</div>
                <div className="text-[13px] font-extrabold text-[#111827] truncate">{value}</div>
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
                {usageFeatures.map((f) => <FeatureBar key={f.key} feature={f} />)}
              </div>
            ) : (
              <p className="text-[12px] text-black/40 font-semibold">No metered features on this plan.</p>
            )}
            {flagFeatures.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-black/35">Add-ons / Flags</div>
                <div className="flex flex-wrap gap-2">
                  {flagFeatures.map((f) => (
                    <span key={f.key} className="inline-flex items-center rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-black/50">
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

const AssignBrand: NextPage = () => {
  const [brands, setBrands]       = useState<AllocatedBrand[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [rmList, setRmList]       = useState<Employee[]>([]);
  const [execList, setExecList]   = useState<Employee[]>([]);

  const [search, setSearch]               = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage]                   = useState(1);
  const [pageSize]                        = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal]                 = useState(0);
  const [totalPages, setTotalPages]       = useState(1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(value); setPage(1); }, 400);
  };

  // ── Fetch allocated brands ────────────────────────────────────────────────
  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const response = await get<AllocatedBrandsResponse>("/admins/get-brand-list");
      if (!response.success) throw new Error("API returned success: false");
      const mapped = (response.data ?? []).map(mapAllocation);
      setBrands(mapped);
      setTotal(mapped.length);
      setTotalPages(Math.max(1, Math.ceil(mapped.length / pageSize)));
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load allocated brands.");
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  // ── Fetch RM + executive lists ────────────────────────────────────────────
  useEffect(() => {
    get<EmployeeListResponse>("/admins/get-rm-list")
      .then((res) => { if (res.success) setRmList(res.data ?? []); })
      .catch(console.error);
    get<EmployeeListResponse>("/admins/get-executive-list")
      .then((res) => { if (res.success) setExecList(res.data ?? []); })
      .catch(console.error);
  }, []);

  // ── Client-side search filter ─────────────────────────────────────────────
  const filtered = debouncedSearch
    ? brands.filter((b) => {
        const q = debouncedSearch.toLowerCase();
        return (
          b.brandName.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q) ||
          b.planName.toLowerCase().includes(q) ||
          b.industry.toLowerCase().includes(q) ||
          b.subStatus.toLowerCase().includes(q)
        );
      })
    : brands;

  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalShown = filtered.length;
  const totalPagesShown = Math.max(1, Math.ceil(totalShown / pageSize));

  // ── Status counts ─────────────────────────────────────────────────────────
  const counts = {
    active:   brands.filter((b) => b.subStatus === "active").length,
    expired:  brands.filter((b) => b.subStatus === "expired").length,
    assigned: brands.filter((b) => b.allocationStatus === "active").length,
  };

  // ── Sort state ────────────────────────────────────────────────────────────
  const [sortBy, setSortBy]     = useState<keyof AllocatedBrand>("assignedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const toggleSort = (field: keyof AllocatedBrand) => {
    if (sortBy === field) setSortOrder((p) => (p === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortOrder("asc"); }
  };

  const Th = ({
    field, label, align = "left",
  }: { field: keyof AllocatedBrand; label: string; align?: "left" | "center" | "right" }) => (
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
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#111827] leading-tight">
              Assigned Brands
            </h1>
            <p className="mt-1 text-[13px] font-semibold text-black/55">
              All brands with an active team allocation. Click a row to see details.
            </p>
          </div>

          {!loading && !error && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold bg-emerald-50 text-emerald-700 border-emerald-200">
                {counts.active} Active Sub
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold bg-black/[0.06] text-black/60 border-black/10">
                {counts.expired} Expired Sub
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold bg-blue-50 text-blue-700 border-blue-200">
                {counts.assigned} Assigned
              </span>
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
          <div className="p-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/55" />
              <Input
                placeholder="Search by name, email, plan, industry…"
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
                  <TableHead className="w-8 py-4" />
                  <Th field="brandName"        label="Brand"          align="left" />
                  <Th field="planName"          label="Plan"           align="center" />
                  <Th field="subStatus"         label="Sub Status"     align="center" />
                  <Th field="assignedAt"        label="Assigned On"    align="center" />
                  <Th field="expiresAt"         label="Sub Expires"    align="center" />
                  <Th field="allocationStatus"  label="Alloc Status"   align="center" />
                  <TableHead className="py-4 text-xs font-extrabold text-black/60 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

                {!loading && paginated.length === 0 && (
                  <TableRow className="border-b border-black/5">
                    <TableCell colSpan={COL_SPAN} className="text-center text-black/55 py-10 text-sm font-semibold">
                      {error ? "Could not load data." : "No allocated brands found."}
                    </TableCell>
                  </TableRow>
                )}

                {!loading && paginated.map((b) => {
                  const isExpanded = expandedId === b.allocationId;
                  const initials   = (b.brandName || "—").trim().slice(0, 1).toUpperCase();

                  return (
                    <React.Fragment key={b.allocationId}>
                      <TableRow
                        className={`border-b border-black/5 cursor-pointer transition-colors ${
                          isExpanded ? "bg-black/[0.025]" : "hover:bg-black/[0.015]"
                        }`}
                        onClick={() => setExpandedId(isExpanded ? null : b.allocationId)}
                      >
                        {/* Expand */}
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
                              <div className="text-[13px] font-extrabold text-[#111827] truncate">{b.brandName}</div>
                              <div className="text-[11px] font-semibold text-black/45 truncate">{b.email}</div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Plan */}
                        <TableCell className="py-4 text-center">
                          <PlanBadge plan={b.planName} />
                        </TableCell>

                        {/* Sub status */}
                        <TableCell className="py-4 text-center">
                          <SubStatusBadge status={b.subStatus} />
                        </TableCell>

                        {/* Assigned on */}
                        <TableCell className="py-4 text-center text-[13px] font-semibold text-black/70 whitespace-nowrap">
                          {fmtDate(b.assignedAt)}
                        </TableCell>

                        {/* Sub expires */}
                        <TableCell className="py-4 text-center text-[13px] font-semibold text-black/70 whitespace-nowrap">
                          {fmtDate(b.expiresAt)}
                        </TableCell>

                        {/* Allocation status */}
                        <TableCell className="py-4 text-center">
                          <AllocStatusBadge status={b.allocationStatus} />
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
                                <Link href={`/admin/brands/view?brandId=${b.brandId}`}>
                                  <span className="flex items-center gap-2 text-[13px] font-semibold">
                                    <HiOutlineEye className="h-4 w-4" /> View Brand
                                  </span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="cursor-pointer focus:bg-black/5">
                                <Link href={`/admin/brands/create-campaign?brandId=${b.brandId}`}>
                                  <span className="flex items-center gap-2 text-[13px] font-semibold">
                                    <HiOutlinePlus className="h-4 w-4" /> Create Campaign
                                  </span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="cursor-pointer focus:bg-black/5">
                                <Link href={`/admin/brands/review-campaigns?brandId=${b.brandId}`}>
                                  <span className="flex items-center gap-2 text-[13px] font-semibold">
                                    <HiPencil className="h-4 w-4" /> Review Campaigns
                                  </span>
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {/* Expanded detail panel */}
                      {isExpanded && (
                        <ExpandedRow brand={b} rmList={rmList} execList={execList} />
                      )}
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
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalShown)} of {totalShown}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="icon" disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="h-8 w-8 rounded-full border-black/10 text-black/70 hover:bg-black hover:text-white hover:border-black"
                >
                  <HiChevronLeft />
                </Button>
                <div className="text-xs font-extrabold text-black/60">Page {page} of {totalPagesShown}</div>
                <Button
                  variant="outline" size="icon" disabled={page === totalPagesShown}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPagesShown))}
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

export default AssignBrand;