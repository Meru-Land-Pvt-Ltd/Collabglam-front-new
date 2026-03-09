"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HiAdjustments, HiSearch } from "react-icons/hi";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { Button } from "@/components/ui/buttonComp";

import ListCardView, {
  ListCardViewItem,
  StatusVariant,
} from "@/components/ui/brand/list";

type Goal = "Brand Awareness" | "Sales" | "Engagement";
type CampaignStatus = "open" | "paused";
type SortBy = "createdAt" | "budget" | "applicantCount";
type SortOrder = "asc" | "desc";

interface RawCampaignCategory {
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
}

interface RawCampaign {
  campaignsId?: string;
  _id?: string;

  campaignTitle?: string;
  productOrServiceName?: string;
  description?: string;

  budget?: number;
  campaignBudget?: number;
  applicantCount?: number;

  isActive?: number;
  computedIsActive?: number;
  influencerWorking?: boolean;

  campaignStatus?: string;
  status?: string;
  publishStatus?: string;

  createdAt?: string;
  updatedAt?: string;
  statusUpdatedAt?: string;
  publishedAt?: string;

  goal?: string;

  category?: string;
  campaignCategory?: string;
  campaignSubcategory?: string;
  categories?: RawCampaignCategory[];

  brandName?: string;
}

interface CampaignsApiResponse {
  data?: RawCampaign[];
}

interface CampaignHistoryItem {
  id: string;
  productOrServiceName: string;
  budget: number;
  applicantCount: number;
  isActive: number;
  campaignStatus: string;
  status: string;
  createdAt?: string;
  statusUpdatedAt?: string;
  goal?: string;
  category?: string;
  description?: string;
  brandName?: string;
}

type FilterState = {
  campaignStatus: "" | CampaignStatus;
  goal: "" | Goal;
  minBudget: string;
  maxBudget: string;
};

const DEFAULT_FILTERS: FilterState = {
  campaignStatus: "",
  goal: "",
  minBudget: "",
  maxBudget: "",
};

const HISTORY_ENDPOINT = "/campaign/history";

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

function countActiveFilters(f: FilterState) {
  let n = 0;
  if (f.campaignStatus !== "") n++;
  if (f.goal !== "") n++;
  if (f.minBudget || f.maxBudget) n++;
  return n;
}

function parseOptionalNumber(v: string) {
  const s = String(v ?? "").trim();
  if (!s) return undefined;
  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function getStatusVariant(item: CampaignHistoryItem): StatusVariant {
  const campaignStatus = (item.campaignStatus || "").toLowerCase();
  const status = (item.status || "").toLowerCase();

  if (campaignStatus === "paused" || status === "paused") return "paused";
  if (status === "active" || (campaignStatus === "open" && item.isActive === 1)) return "active";
  if (campaignStatus === "open") return "scheduled";
  return "draft";
}

function getStatusLabel(item: CampaignHistoryItem) {
  const campaignStatus = (item.campaignStatus || "").toLowerCase();
  const status = (item.status || "").toLowerCase();

  if (campaignStatus === "paused" || status === "paused") return "Paused";
  if (status === "active" || (campaignStatus === "open" && item.isActive === 1)) return "Active";
  if (campaignStatus === "open") return "Open";
  return "Draft";
}

function getCampaignCategory(c: RawCampaign) {
  return (
    c.campaignCategory ||
    c.category ||
    c.categories?.[0]?.categoryName ||
    "Uncategorized"
  );
}

function getCampaignName(c: RawCampaign) {
  return c.campaignTitle || c.productOrServiceName || "Untitled Campaign";
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-gray-700">{label}</div>
      {children}
    </div>
  );
}

export default function BrandCampaignHistoryPage() {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<CampaignHistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<FilterState>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<FilterState>(DEFAULT_FILTERS);

  const activeFilterCount = useMemo(() => countActiveFilters(applied), [applied]);
  const lastFetchKeyRef = useRef<string>("");

  const buildPayload = useCallback(
    (brandId: string) => {
      const f = applied;

      const payload: Record<string, any> = {
        brandId,
        page: 1,
        limit: 500,
        search: String(debouncedSearch || "").trim(),
        sortBy,
        sortOrder,
        includeDescription: 1,
        includeDrafts: 1,
        campaignStatus: f.campaignStatus || undefined,
        goal: f.goal || undefined,
      };

      const minB = parseOptionalNumber(f.minBudget);
      const maxB = parseOptionalNumber(f.maxBudget);

      if (minB !== undefined) payload.minBudget = minB;
      if (maxB !== undefined) payload.maxBudget = maxB;

      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k];
      });

      return payload;
    },
    [applied, debouncedSearch, sortBy, sortOrder]
  );

  const fetchHistory = useCallback(
    async (opts?: { force?: boolean }) => {
      const brandId =
        typeof window !== "undefined" ? localStorage.getItem("brandId") : null;

      if (!brandId) throw new Error("No brandId found in localStorage.");

      const payload = buildPayload(brandId);
      const fetchKey = JSON.stringify(payload);

      if (!opts?.force && fetchKey === lastFetchKeyRef.current) return;
      lastFetchKeyRef.current = fetchKey;

      setError(null);
      setUpdating(true);

      try {
        const res = await post<CampaignsApiResponse>(HISTORY_ENDPOINT, payload);
        const list = Array.isArray(res?.data) ? res.data : [];

        const normalized: CampaignHistoryItem[] = list.map((c, idx) => ({
          id: String(c.campaignsId ?? c._id ?? `row-${idx}`),
          productOrServiceName: getCampaignName(c),
          budget: Number(c.budget ?? c.campaignBudget ?? 0),
          applicantCount: Number(c.applicantCount ?? 0),
          isActive: Number(c.computedIsActive ?? c.isActive ?? 0),
          campaignStatus: c.campaignStatus ?? "",
          status: c.status ?? "",
          createdAt: c.createdAt,
          statusUpdatedAt: c.statusUpdatedAt ?? c.updatedAt ?? c.publishedAt,
          goal: c.goal as Goal | undefined,
          category: getCampaignCategory(c),
          description: c.description,
          brandName: c.brandName,
        }));

        setCampaigns(normalized);
      } finally {
        setUpdating(false);
        setLoading(false);
      }
    },
    [buildPayload]
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        await fetchHistory();
      } catch (e: any) {
        if (!alive) return;
        setUpdating(false);
        setLoading(false);
        setError(e?.message || "Failed to load campaign history.");
      }
    })();

    return () => {
      alive = false;
    };
  }, [fetchHistory]);

  const openFilters = () => {
    setDraft(applied);
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    setApplied(draft);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraft(DEFAULT_FILTERS);
  };

  const cardItems = useMemo<ListCardViewItem[]>(
    () =>
      campaigns.map((campaign) => ({
        key: campaign.id,
        name: campaign.productOrServiceName,
        categoryTag: campaign.category || "Uncategorized",
        statusLabel: getStatusLabel(campaign),
        statusVariant: getStatusVariant(campaign),
        showStatusChevron: false,
        showMoreButton: false,
        menuSlot: false,
        actionSlot: (
          <Button
            variant="outline"
            type="button"
            onClick={() => router.push(`/brand/campaign/${campaign.id}`)}
            className="h-10 flex-1 rounded-[0.8rem] border border-[#DBDBDB] bg-white px-4 text-sm font-semibold text-[#2B2B2B] hover:bg-[#F8F8F8] sm:flex-none"
          >
            View Campaign
          </Button>
        ),
        metrics: [
          {
            id: "budget",
            label: "Budget",
            value: formatCurrency(campaign.budget),
          },
          {
            id: "applicants",
            label: "Applicants",
            value: campaign.applicantCount,
          },
          {
            id: "goal",
            label: "Campaign",
            value: campaign.campaignStatus || "—",
          },
          {
            id: "created",
            label: "Created",
            value: formatDate(campaign.createdAt),
          },
        ],
      })),
    [campaigns, router]
  );

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Campaign History</h1>
        </div>

        {updating && (
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm">
            Updating...
          </div>
        )}
      </div>

      <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="flex-1">
            <div className="relative">
              <HiSearch className="absolute inset-y-0 left-3 my-auto text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#FFA135] bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#FF7236] focus:outline-none focus:ring-2 focus:ring-[#FF7236]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700"
            >
              <option value="createdAt">Sort: Created Date</option>
              <option value="budget">Sort: Budget</option>
              <option value="applicantCount">Sort: Applicants</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700"
            >
              <option value="desc">Order: Desc</option>
              <option value="asc">Order: Asc</option>
            </select>

            <button
              type="button"
              onClick={() => (filtersOpen ? setFiltersOpen(false) : openFilters())}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
            >
              <HiAdjustments />
              Filters
              {activeFilterCount ? (
                <span className="ml-1 inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-gray-900 px-2 text-[11px] font-extrabold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div
          className={[
            "mt-4 overflow-hidden transition-all duration-200",
            filtersOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0",
          ].join(" ")}
        >
          <div className="mt-2 rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Campaign Status">
                <select
                  value={draft.campaignStatus}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      campaignStatus: e.target.value as FilterState["campaignStatus"],
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="">All</option>
                  <option value="open">Open</option>
                  <option value="paused">Paused</option>
                </select>
              </Field>

              <Field label="Goals">
                <select
                  value={draft.goal}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      goal: e.target.value as FilterState["goal"],
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="">All</option>
                  <option value="Brand Awareness">Brand Awareness</option>
                  <option value="Sales">Sales</option>
                  <option value="Engagement">Engagement</option>
                </select>
              </Field>
            </div>

            <div className="mt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Min Budget">
                  <input
                    value={draft.minBudget}
                    onChange={(e) => setDraft((p) => ({ ...p, minBudget: e.target.value }))}
                    type="number"
                    placeholder="e.g. 1000"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
                  />
                </Field>

                <Field label="Max Budget">
                  <input
                    value={draft.maxBudget}
                    onChange={(e) => setDraft((p) => ({ ...p, maxBudget: e.target.value }))}
                    type="number"
                    placeholder="e.g. 5000"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
                  />
                </Field>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm font-semibold hover:bg-white"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => {
                  setDraft(applied);
                  setFiltersOpen(false);
                }}
                className="rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm font-semibold hover:bg-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={applyFilters}
                className="ml-auto rounded-xl bg-gradient-to-r from-[#FFA135] to-[#FF7236] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
          <div className="mb-4 h-4 w-1/3 rounded bg-gray-200" />
          <div className="mb-2 h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-5/6 rounded bg-gray-200" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-red-700">
                Couldn’t load campaign history
              </div>
              <div className="mt-1 text-sm text-gray-600">{error}</div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setError(null);
                lastFetchKeyRef.current = "";

                try {
                  await fetchHistory({ force: true });
                } catch (e: any) {
                  setError(e?.message || "Failed to load campaign history.");
                  setLoading(false);
                  setUpdating(false);
                }
              }}
              className="rounded-xl border border-gray-900 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-gray-900">No campaign history found</p>
          <p className="mt-1 text-sm text-gray-600">Try different keywords or change filters.</p>
        </div>
      ) : (
        <ListCardView
          items={cardItems}
          className="gap-4"
          emptyState="No campaign history found."
        />
      )}
    </div>
  );
}