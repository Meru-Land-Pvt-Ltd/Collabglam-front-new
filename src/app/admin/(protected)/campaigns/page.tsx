"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { post } from "@/lib/api";
import {
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  Sparkles,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type StatusFilter = 0 | 1 | 2;

type SortKey =
  | "name"
  | "startDate"
  | "endDate"
  | "budget"
  | "isActive"
  | "createdAt";

interface CreatedByAdmin {
  userId: string;
  name: string;
  email: string;
  adminRole?: string;
  label: string;
}

interface Campaign {
  _id: string;
  brandId: string;
  brandName: string;
  brandPlanName: string;
  campaignId: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number;
  applicantCount?: number;
  isActive: number;
  isDraft?: number;
  campaignStatus?: string;
  byAi?: number;
  createdByAdmin?: CreatedByAdmin | null;
}

interface ListResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  status: number;
  sortBy?: string;
  sortOrder?: string;
  campaigns: Campaign[];
}

const MAX_NAME_LENGTH = 72;

const statusOptions = [
  { label: "All", value: 0 },
  { label: "Active", value: 1 },
  { label: "Inactive", value: 2 },
];

function formatName(name?: string) {
  if (!name) return "—";
  const trimmed = name.trim();
  if (trimmed.length <= MAX_NAME_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_NAME_LENGTH)}…`;
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value?: number) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusMeta(campaign: Campaign) {
  if (campaign.isDraft === 1) {
    return {
      label: "Draft",
      icon: RefreshCw,
      className: "border border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (campaign.isActive === 1) {
    return {
      label: "Active",
      icon: CheckCircle2,
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Inactive",
    icon: XCircle,
    className: "border border-rose-200 bg-rose-50 text-rose-700",
  };
}

function getCreatorMeta(campaign: Campaign) {
  if (campaign.createdByAdmin) {
    return {
      title: campaign.byAi === 1 ? "Created by Admin via AI" : "Created by Admin",
      subtitle:
        campaign.createdByAdmin.name ||
        campaign.createdByAdmin.email ||
        campaign.createdByAdmin.label ||
        "Admin",
      email: campaign.createdByAdmin.email || "",
      role: campaign.createdByAdmin.adminRole || "",
      isAdmin: true,
      isAi: campaign.byAi === 1,
    };
  }

  if (campaign.byAi === 1) {
    return {
      title: "AI Generated",
      subtitle: "Admin details unavailable",
      email: "",
      role: "",
      isAdmin: false,
      isAi: true,
    };
  }

  return {
    title: "Standard Campaign",
    subtitle: "",
    email: "",
    role: "",
    isAdmin: false,
    isAi: false,
  };
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/45">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-black">
        {value}
      </p>
      <p className="mt-2 text-sm text-black/50">{hint}</p>
    </div>
  );
}

function SortableHead({
  label,
  sortKey,
  activeSortKey,
  sortAsc,
  onSort,
  className = "",
}: {
  label: string;
  sortKey?: SortKey;
  activeSortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sortKey && activeSortKey === sortKey;

  return (
    <th
      onClick={() => sortKey && onSort(sortKey)}
      className={`whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-black/45 ${sortKey ? "cursor-pointer select-none" : ""
        } ${className}`}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {sortKey ? (
          active ? (
            sortAsc ? (
              <ChevronUp className="h-4 w-4 text-black" />
            ) : (
              <ChevronDown className="h-4 w-4 text-black" />
            )
          ) : (
            <ArrowUpDown className="h-4 w-4 text-black/35" />
          )
        ) : null}
      </div>
    </th>
  );
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const fetchCampaigns = async () => {
    setLoading(true);

    try {
      const payload = {
        page,
        limit,
        search,
        sortBy: sortKey,
        sortOrder: sortAsc ? "asc" : "desc",
        type: statusFilter,
      };

      const data = await post<ListResponse>("/admin/campaign/lite", payload);

      setCampaigns(data.campaigns || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortKey, sortAsc, search, statusFilter]);

  const handleRefresh = () => fetchCampaigns();

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
    setPage(1);
  };

  const stats = useMemo(() => {
    const activeCount = campaigns.filter((c) => c.isDraft !== 1 && c.isActive === 1).length;
    const inactiveCount = campaigns.filter((c) => c.isDraft !== 1 && c.isActive !== 1).length;
    const adminCreatedCount = campaigns.filter((c) => Boolean(c.createdByAdmin)).length;
    const aiCount = campaigns.filter((c) => c.byAi === 1).length;

    return {
      activeCount,
      inactiveCount,
      adminCreatedCount,
      aiCount,
    };
  }, [campaigns]);

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-black">
              Campaign Control Center
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-black/55">
              Review all campaigns, track status, and clearly see whether a campaign was
              created by an admin, including who created it.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
              <Input
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-11 rounded-2xl border-black/10 bg-white pl-10"
              />
            </div>

            <Select
              value={statusFilter.toString()}
              onValueChange={(val) => {
                setStatusFilter(Number(val) as StatusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 w-full rounded-2xl border-black/10 bg-white sm:w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="h-11 rounded-2xl border-black/10 bg-white"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Results"
            value={total}
            hint={`Page ${page} of ${totalPages}`}
          />
          <StatCard
            label="Active on This Page"
            value={stats.activeCount}
            hint="Live active campaigns in current view"
          />
          <StatCard
            label="Admin Created"
            value={stats.adminCreatedCount}
            hint="Campaigns with visible admin creator details"
          />
          <StatCard
            label="AI Assisted"
            value={stats.aiCount}
            hint="Campaigns marked as AI-generated"
          />
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm">
          <div
            className="max-h-[72vh] overflow-auto
              [&::-webkit-scrollbar]:h-2.5
              [&::-webkit-scrollbar]:w-2.5
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-black/20
              [&::-webkit-scrollbar-track]:bg-transparent"
          >
            <table className="min-w-[1320px] w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur">
                <tr className="border-b border-black/10">
                  <SortableHead
                    label="Campaign"
                    sortKey="name"
                    activeSortKey={sortKey}
                    sortAsc={sortAsc}
                    onSort={toggleSort}
                  />
                  <SortableHead
                    label="Brand"
                    activeSortKey={sortKey}
                    sortAsc={sortAsc}
                    onSort={toggleSort}
                  />
                  <SortableHead
                    label="Created By"
                    activeSortKey={sortKey}
                    sortAsc={sortAsc}
                    onSort={toggleSort}
                  />
                  <SortableHead
                    label="Start"
                    sortKey="startDate"
                    activeSortKey={sortKey}
                    sortAsc={sortAsc}
                    onSort={toggleSort}
                  />
                  <SortableHead
                    label="End"
                    sortKey="endDate"
                    activeSortKey={sortKey}
                    sortAsc={sortAsc}
                    onSort={toggleSort}
                  />
                  <SortableHead
                    label="Budget"
                    sortKey="budget"
                    activeSortKey={sortKey}
                    sortAsc={sortAsc}
                    onSort={toggleSort}
                  />
                  <SortableHead
                    label="Status"
                    sortKey="isActive"
                    activeSortKey={sortKey}
                    sortAsc={sortAsc}
                    onSort={toggleSort}
                  />
                  <SortableHead
                    label="Actions"
                    activeSortKey={sortKey}
                    sortAsc={sortAsc}
                    onSort={toggleSort}
                    className="text-right"
                  />
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={9} className="px-5 py-4">
                        <div className="h-16 animate-pulse rounded-2xl bg-black/[0.04]" />
                      </td>
                    </tr>
                  ))
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-16 text-center text-sm text-black/50"
                    >
                      No campaigns found.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => {
                    const statusMeta = getStatusMeta(campaign);
                    const creatorMeta = getCreatorMeta(campaign);
                    const StatusIcon = statusMeta.icon;

                    return (
                      <tr
                        key={campaign.campaignId}
                        className="border-t border-black/10 align-top transition hover:bg-black/[0.015]"
                      >
                        <td className="border-t border-black/10 px-5 py-5">
                          <div className="min-w-0">
                            <div
                              className="truncate text-[15px] font-semibold text-black"
                              title={campaign.name}
                            >
                              {formatName(campaign.name)}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {campaign.byAi === 1 ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                                  <Sparkles className="h-3.5 w-3.5" />
                                  AI
                                </span>
                              ) : null}

                              {campaign.createdByAdmin ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                                  <UserCog className="h-3.5 w-3.5" />
                                  Admin Created
                                </span>
                              ) : null}

                              {campaign.isDraft === 1 ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  Draft
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        <td className="border-t border-black/10 px-5 py-5">
                          <div className="min-w-[180px]">
                            <p className="text-sm font-semibold text-black">
                              {campaign.brandName || "—"}
                            </p>
                            <div className="mt-2 inline-flex rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-black/60">
                              {campaign.brandPlanName || "free"}
                            </div>
                          </div>
                        </td>

                        <td className="border-t border-black/10 px-5 py-5">
                          <div className="min-w-[220px]">
                            <p className="text-sm font-semibold text-black">
                              {creatorMeta.title}
                            </p>
                            <p className="mt-1 text-sm text-black/60">
                              {creatorMeta.subtitle}
                            </p>

                            {creatorMeta.email ? (
                              <p className="mt-1 break-all text-xs text-black/45">
                                {creatorMeta.email}
                              </p>
                            ) : null}

                            {creatorMeta.role ? (
                              <div className="mt-2 inline-flex rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-black/55">
                                {creatorMeta.role.replace(/_/g, " ")}
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="border-t border-black/10 px-5 py-5 text-sm text-black">
                          {formatDate(campaign.startDate)}
                        </td>

                        <td className="border-t border-black/10 px-5 py-5 text-sm text-black">
                          {formatDate(campaign.endDate)}
                        </td>

                        <td className="border-t border-black/10 px-5 py-5 text-sm font-semibold text-black">
                          {formatCurrency(campaign.budget)}
                        </td>

                        <td className="border-t border-black/10 px-5 py-5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusMeta.label}
                          </span>
                        </td>

                        <td className="border-t border-black/10 px-5 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-black hover:bg-black/[0.04]"
                            >
                              <Link
                                href={`/admin/campaigns/view?id=${campaign.campaignId}`}
                                aria-label="View Campaign"
                              >
                                <Eye className="h-4.5 w-4.5" />
                              </Link>
                            </Button>

                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-black hover:bg-black/[0.04]"
                            >
                              <Link
                                href={`/admin/brands/create-campaign?brandId=${campaign.brandId}&id=${campaign.campaignId}`}
                                aria-label="Edit Campaign"
                              >
                                <Pencil className="h-4.5 w-4.5" />
                              </Link>
                            </Button>

                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-black hover:bg-black/[0.04]"
                            >
                              <Link
                                href={`/admin/campaigns/applicants?campaignId=${campaign.campaignId}`}
                                aria-label="View Applicants"
                              >
                                <Users className="h-4.5 w-4.5" />
                              </Link>
                            </Button>

                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-black hover:bg-black/[0.04]"
                            >
                              <Link
                                href={`/admin/campaigns/deliverables/${campaign.campaignId}`}
                                aria-label="See Deliverables"
                              >
                                <FileText className="h-4.5 w-4.5" />
                              </Link>
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="More Actions"
                                  className="rounded-xl text-black hover:bg-black/[0.04]"
                                >
                                  <MoreHorizontal className="h-4.5 w-4.5" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end" className="w-48 bg-white">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/youtube?id=${campaign.campaignId}`}>
                                    Youtube Data
                                  </Link>
                                </DropdownMenuItem>
                                {/* <DropdownMenuItem asChild>
                                  <Link href={`/admin/modash?id=${campaign.campaignId}`}>
                                    Modash Data
                                  </Link>
                                </DropdownMenuItem> */}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && !error && campaigns.length > 0 ? (
          <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-black/10 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-black/60">
              Showing{" "}
              <span className="font-semibold text-black">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)}
              </span>{" "}
              of <span className="font-semibold text-black">{total}</span> campaigns
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="rounded-xl border-black/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-[120px] text-center text-sm font-semibold text-black">
                Page {page} / {totalPages}
              </div>

              <Button
                variant="outline"
                size="icon"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="rounded-xl border-black/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}