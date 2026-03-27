"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { post } from "@/lib/api";
import {
  HiOutlineRefresh,
  HiCheckCircle,
  HiXCircle,
  HiOutlineEye,
  HiChevronLeft,
  HiChevronRight,
  HiChevronUp,
  HiChevronDown,
  HiUserGroup,
  HiPencil,
  HiOutlineDocumentText,
  HiPlus,
} from "react-icons/hi";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
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

interface Campaign {
  _id: string;
  brandId: string;
  campaignId: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number;
  goal?: string;
  applicantCount?: number;
  isActive: number;
  isDraft?: number;
  campaignStatus?: string;
}

interface ListResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  status: number;
  campaigns: Campaign[];
}

type StatusFilter = 0 | 1 | 2;

type SortKey =
  | "name"
  | "goal"
  | "startDate"
  | "endDate"
  | "budget"
  | "applicantCount"
  | "isActive";

const MAX_NAME_LENGTH = 60;

const formatName = (name?: string) => {
  if (!name) return "—";
  const trimmed = name.trim();
  if (trimmed.length <= MAX_NAME_LENGTH) return trimmed;
  return trimmed.slice(0, MAX_NAME_LENGTH) + "…";
};

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const statusOptions = [
    { label: "All", value: 0 },
    { label: "Active", value: 1 },
    { label: "Inactive", value: 2 },
  ];

  const actionBtnClass =
    "rounded-md text-black hover:!bg-[#EDEDED] hover:!text-black focus-visible:!bg-[#EDEDED] focus-visible:!text-black focus-visible:!ring-0 active:!bg-[#EDEDED] data-[state=open]:!bg-[#EDEDED]";

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

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderSortIcon = (key: SortKey) =>
    sortKey === key ? (
      sortAsc ? (
        <HiChevronUp className="h-4 w-4" />
      ) : (
        <HiChevronDown className="h-4 w-4" />
      )
    ) : null;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-3xl font-semibold text-black">All Campaigns (Admin)</h1>

          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-64"
            />

            <Select
              value={statusFilter.toString()}
              onValueChange={(val) => {
                setStatusFilter(Number(val) as StatusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
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

            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <HiOutlineRefresh className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : error ? (
          <div className="mt-8 py-16 text-center text-red-600">{error}</div>
        ) : campaigns.length === 0 ? (
          <div className="mt-8 py-16 text-center text-gray-500">No campaigns found.</div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-300 bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {[
                    { label: "Name", key: "name" },
                    { label: "Goal", key: "goal" },
                    { label: "Start", key: "startDate" },
                    { label: "End", key: "endDate" },
                    { label: "Budget", key: "budget" },
                    { label: "Applicants", key: "applicantCount" },
                    { label: "Status", key: "isActive" },
                    { label: "Actions", key: "" },
                  ].map((col) => (
                    <th
                      key={col.label}
                      onClick={() => col.key && toggleSort(col.key as SortKey)}
                      className={`border-r border-gray-300 px-5 py-5 text-left text-[15px] font-semibold text-gray-700 last:border-r-0 ${
                        col.key ? "cursor-pointer select-none" : ""
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {col.key && renderSortIcon(col.key as SortKey)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.campaignId} className="border-t border-gray-300">
                    <td className="border-r border-gray-300 px-5 py-5 text-[15px] font-medium text-black">
                      {formatName(c.name)}
                    </td>

                    <td className="border-r border-gray-300 px-5 py-5 text-[15px] text-black">
                      {c.goal || "—"}
                    </td>

                    <td className="border-r border-gray-300 px-5 py-5 text-[15px] text-black">
                      {formatDate(c.startDate)}
                    </td>

                    <td className="border-r border-gray-300 px-5 py-5 text-[15px] text-black">
                      {formatDate(c.endDate)}
                    </td>

                    <td className="border-r border-gray-300 px-5 py-5 text-[15px] text-black">
                      ${(c.budget ?? 0).toLocaleString()}
                    </td>

                    <td className="border-r border-gray-300 px-5 py-5 text-[15px] text-black">
                      {c.applicantCount || 0}
                    </td>

                    <td className="border-r border-gray-300 px-5 py-5 text-[15px]">
                      {c.isDraft === 1 ? (
                        <span className="inline-flex items-center gap-1 text-yellow-600">
                          <HiOutlineRefresh className="h-4 w-4" />
                          Draft
                        </span>
                      ) : c.isActive === 1 ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <HiCheckCircle className="h-4 w-4" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <HiXCircle className="h-4 w-4" />
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="icon" className={actionBtnClass}>
                              <Link
                                href={`/admin/campaigns/view?id=${c.campaignId}`}
                                aria-label="View Campaign"
                              >
                                <HiOutlineEye className="h-5 w-5 text-black" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View Details</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="icon" className={actionBtnClass}>
                              <Link
                                href={`/admin/brands/create-campaign?brandId=${c.brandId}&id=${c.campaignId}`}
                                aria-label="Edit Campaign"
                              >
                                <HiPencil className="h-5 w-5 text-black" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit Campaign</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="icon" className={actionBtnClass}>
                              <Link
                                href={`/admin/campaigns/applicants?campaignId=${c.campaignId}`}
                                aria-label="View Applicants"
                              >
                                <HiUserGroup className="h-5 w-5 text-black" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View Applicants</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="icon" className={actionBtnClass}>
                              <Link
                                href={`/admin/campaigns/deliverables/${c.campaignId}`}
                                aria-label="See Deliverables"
                              >
                                <HiOutlineDocumentText className="h-5 w-5 text-black" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>See Deliverables</TooltipContent>
                        </Tooltip>

                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="More Actions"
                                  className={actionBtnClass}
                                >
                                  <HiPlus className="h-5 w-5 text-black" />
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>More Actions</TooltipContent>
                          </Tooltip>

                          <DropdownMenuContent align="end" className="w-44 bg-white">
                            <DropdownMenuItem asChild className="cursor-pointer hover:!bg-[#EDEDED] focus:!bg-[#EDEDED]">
                              <Link href={`/admin/youtube?id=${c.campaignId}`}>Youtube Data</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer hover:!bg-[#EDEDED] focus:!bg-[#EDEDED]">
                              <Link href={`/admin/modash?id=${c.campaignId}`}>Modash Data</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && campaigns.length > 0 && (
          <div className="mt-9 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                <HiChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                <HiChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}