"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { post } from "@/lib/api";
import { Search, ChevronDown, Funnel, ExternalLink } from "lucide-react";
import DisputeDetailDrawer from "./DisputeDetailDrawer";

type DisputeStatus =
  | "open"
  | "in_review"
  | "awaiting_user"
  | "resolved"
  | "rejected";

type Role = "Admin" | "Brand" | "Influencer";

type DisputeParty = {
  role: "Brand" | "Influencer";
  id: string;
  name?: string | null;
};

type Attachment = {
  url: string;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
};

type Dispute = {
  disputeId: string;
  subject: string;
  description?: string;
  status: DisputeStatus;
  campaignId?: string | null;
  campaignName?: string | null;
  brandId: string;
  influencerId: string;
  assignedTo?: { adminId?: string | null; name?: string | null } | null;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
  createdBy?: {
    id: string;
    role: Role;
  };
  raisedByRole?: Role | null;
  raisedById?: string | null;
  raisedBy?: DisputeParty | null;
  raisedAgainst?: DisputeParty | null;
  viewerIsRaiser?: boolean;
};

type ListResp = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  disputes: Dispute[];
};

type SelectOption = {
  value: string;
  label: string;
};

type InlineSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
};

const statusOptions: SelectOption[] = [
  { value: "0", label: "All Statuses" },
  { value: "1", label: "Open" },
  { value: "2", label: "Under Review" },
  { value: "3", label: "Pending" },
  { value: "4", label: "Resolved" },
  { value: "5", label: "Rejected" },
];

const directionOptions: SelectOption[] = [
  { value: "all", label: "All disputes" },
  { value: "raised_by_you", label: "Raised by you" },
  { value: "against_you", label: "Raised against you" },
];

const pageSizeOptions: SelectOption[] = [
  { value: "5", label: "5 per page" },
  { value: "10", label: "10 per page" },
  { value: "20", label: "20 per page" },
];

function InlineSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: InlineSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 text-left text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        <span className={selected ? "text-slate-800" : "text-slate-500"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <div className="max-h-60 overflow-y-auto py-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-3 text-left text-sm transition ${
                    isSelected
                      ? "bg-slate-100 font-medium text-slate-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getStatusClasses(status: DisputeStatus) {
  switch (status) {
    case "open":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "in_review":
      return "border-slate-300 bg-white text-slate-900";
    case "awaiting_user":
      return "border-slate-300 bg-slate-100 text-slate-600";
    case "resolved":
      return "border-slate-300 bg-white text-slate-900";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-500";
    default:
      return "border-slate-300 bg-white text-slate-900";
  }
}

function formatStatusLabel(status: DisputeStatus) {
  switch (status) {
    case "open":
      return "Open";
    case "in_review":
      return "Under Review";
    case "awaiting_user":
      return "Pending";
    case "resolved":
      return "Resolved";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

export default function DisputeHistorySection() {
  const [brandId, setBrandId] = useState<string | null>(null);
  const [brandLoaded, setBrandLoaded] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Dispute[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [statusDraft, setStatusDraft] = useState("0");
  const [campaignDraft, setCampaignDraft] = useState("all");
  const [directionDraft, setDirectionDraft] = useState("all");
  const [pageSizeDraft, setPageSizeDraft] = useState("5");

  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("0");
  const [appliedCampaign, setAppliedCampaign] = useState("all");
  const [appliedDirection, setAppliedDirection] = useState("all");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem("brandId");
    setBrandId(id);
    setBrandLoaded(true);
  }, []);

  const load = async () => {
    if (!brandLoaded) return;

    setLoading(true);
    setError(null);

    if (!brandId) {
      setRows([]);
      setTotal(0);
      setTotalPages(1);
      setLoading(false);
      setError("Brand ID not found. Please log in again.");
      return;
    }

    try {
      const body: Record<string, string | number> = {
        page,
        limit: pageSize,
        brandId,
      };

      const statusNum = parseInt(appliedStatus, 10);
      if (!Number.isNaN(statusNum)) {
        body.status = statusNum;
      }

      if (appliedDirection === "raised_by_you") {
        body.appliedBy = "brand";
      } else if (appliedDirection === "against_you") {
        body.appliedBy = "influencer";
      }

      if (appliedSearch) {
        body.search = appliedSearch;
      }

      const data = await post<ListResp>("/dispute/brand/list", body);

      setRows(data?.disputes || []);
      setTotalPages(data?.totalPages || 1);
      setTotal(data?.total || 0);
    } catch (e: any) {
      setError(e?.message || "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!brandLoaded) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandLoaded, brandId, page, pageSize, appliedSearch, appliedStatus, appliedDirection]);

  const campaignOptions = useMemo<SelectOption[]>(() => {
    const uniqueCampaigns = Array.from(
      new Set(
        rows
          .map((item) => item.campaignName?.trim())
          .filter((item): item is string => Boolean(item))
      )
    );

    return [
      { value: "all", label: "All Campaigns" },
      ...uniqueCampaigns.map((campaign) => ({ value: campaign, label: campaign })),
    ];
  }, [rows]);

  const displayedRows = useMemo(() => {
    const searchValue = appliedSearch.toLowerCase();

    return rows.filter((item) => {
      const matchesCampaign =
        appliedCampaign === "all" ||
        (item.campaignName || "").trim() === appliedCampaign;

      const searchableText = [
        item.disputeId,
        item.subject,
        item.description || "",
        item.campaignName || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchValue || searchableText.includes(searchValue);

      return matchesCampaign && matchesSearch;
    });
  }, [rows, appliedCampaign, appliedSearch]);

  const applyFilters = () => {
    setPage(1);
    setAppliedSearch(searchInput.trim());
    setAppliedStatus(statusDraft);
    setAppliedCampaign(campaignDraft);
    setAppliedDirection(directionDraft);
    setPageSize(Number(pageSizeDraft));
  };

  const showingCount = displayedRows.length;

  return (
    <>
      <section id="dispute-history" className="mt-16">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-black">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
            >
              <path
                d="M12 6V12L16 14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">
            Dispute History
          </h2>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#f7f7f8] shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_180px_200px_140px_150px]">
              <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 shadow-sm">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by ID or Campaign..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      applyFilters();
                    }
                  }}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-500"
                />
              </div>

              <InlineSelect
                value={statusDraft}
                onChange={setStatusDraft}
                options={statusOptions}
                placeholder="All Statuses"
              />

              <InlineSelect
                value={campaignDraft}
                onChange={setCampaignDraft}
                options={campaignOptions}
                placeholder="All Campaigns"
              />

              <button
                type="button"
                onClick={() => setShowMoreFilters((prev) => !prev)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <Funnel className="h-4 w-4" />
                <span>More Filters</span>
              </button>

              <button
                type="button"
                onClick={applyFilters}
                className="h-11 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Apply Filters
              </button>
            </div>

            {showMoreFilters ? (
              <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-[200px_180px]">
                <InlineSelect
                  value={directionDraft}
                  onChange={setDirectionDraft}
                  options={directionOptions}
                  placeholder="All disputes"
                />

                <InlineSelect
                  value={pageSizeDraft}
                  onChange={setPageSizeDraft}
                  options={pageSizeOptions}
                  placeholder="5 per page"
                />
              </div>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[116px_260px_260px_184px_165px_110px] px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-500 sm:px-6">
                <div>Issue ID</div>
                <div>Campaign</div>
                <div>Issue Type</div>
                <div>Status</div>
                <div>Created Date</div>
                <div>Action</div>
              </div>

              {loading ? (
                <div className="px-6 py-16 text-center text-sm text-slate-500">
                  Loading dispute history...
                </div>
              ) : error ? (
                <div className="px-6 py-16 text-center text-sm text-red-600">
                  {error}
                </div>
              ) : displayedRows.length === 0 ? (
                <div className="px-6 py-16 text-center text-sm text-slate-500">
                  No disputes match the selected filters.
                </div>
              ) : (
                <div className="divide-y divide-transparent">
                  {displayedRows.map((item) => (
                    <div
                      key={item.disputeId}
                      className="grid grid-cols-[116px_260px_260px_184px_165px_110px] items-center px-6 py-6 text-sm text-slate-700"
                    >
                      <div className="font-semibold text-slate-900">{item.disputeId}</div>
                      <div className="font-semibold text-slate-900">
                        {item.campaignName || "—"}
                      </div>
                      <div className="text-slate-600">{item.subject}</div>
                      <div>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            item.status
                          )}`}
                        >
                          {formatStatusLabel(item.status)}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDisputeId(item.disputeId);
                          setIsDrawerOpen(true);
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-black transition hover:text-slate-700"
                      >
                        <span>View</span>
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">
              {total > 0 ? `Showing ${showingCount} of ${total} issues` : "No issues found"}
            </p>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
              >
                Previous
              </button>
              <div className="px-2 text-sm font-medium text-slate-600">
                Page {page} of {totalPages}
              </div>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      <DisputeDetailDrawer
        open={isDrawerOpen}
        disputeId={selectedDisputeId}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedDisputeId(null);
        }}
        onCommentPosted={load}
      />
    </>
  );
}
