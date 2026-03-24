"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { Button } from "@/components/ui/buttonComp";

import ListCardView, {
  ListCardViewItem,
  StatusVariant,
} from "@/components/ui/brand/list";

import CampaignFilter, {
  DEFAULT_DATE_FILTER,
  type DateFilterValue,
} from "../../../../components/ui/brand/CampaignFilter";

type Goal = "Brand Awareness" | "Sales" | "Engagement";
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

const HISTORY_ENDPOINT = "/campaign/history";

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
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

function isDefaultDateFilter(value: DateFilterValue) {
  return (
    value.quickFilter === DEFAULT_DATE_FILTER.quickFilter &&
    value.allDatesOption === DEFAULT_DATE_FILTER.allDatesOption &&
    value.startDate === DEFAULT_DATE_FILTER.startDate &&
    value.endDate === DEFAULT_DATE_FILTER.endDate
  );
}

function getDateFilterPayload(value: DateFilterValue) {
  const payload: Record<string, any> = {};

  if (isDefaultDateFilter(value)) return payload;

  if (value.quickFilter) payload.quickFilter = value.quickFilter;
  if (value.allDatesOption && value.allDatesOption !== "all") {
    payload.allDatesOption = value.allDatesOption;
  }
  if (value.startDate) payload.startDate = value.startDate;
  if (value.endDate) payload.endDate = value.endDate;

  return payload;
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

  const [campaignType, setCampaignType] = useState("all");
  const [creatorStatus, setCreatorStatus] = useState("all");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(DEFAULT_DATE_FILTER);
  const [aiCreated, setAiCreated] = useState(false);

  const lastFetchKeyRef = useRef<string>("");

  const buildPayload = useCallback(
    (brandId: string) => {
      const payload: Record<string, any> = {
        brandId,
        page: 1,
        limit: 500,
        search: String(debouncedSearch || "").trim(),
        sortBy,
        sortOrder,
        includeDescription: 1,

        campaignType: campaignType !== "all" ? campaignType : undefined,
        creatorStatus: creatorStatus !== "all" ? creatorStatus : undefined,
        categoryIds: categoryIds.length ? categoryIds : undefined,
        aiCreated: aiCreated ? true : undefined,

        ...getDateFilterPayload(dateFilter),
      };

      Object.keys(payload).forEach((k) => {
        if (
          payload[k] === undefined ||
          payload[k] === "" ||
          (Array.isArray(payload[k]) && payload[k].length === 0)
        ) {
          delete payload[k];
        }
      });

      return payload;
    },
    [aiCreated, campaignType, categoryIds, creatorStatus, dateFilter, debouncedSearch, sortBy, sortOrder]
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
            onClick={() => router.push(`/brand/campaign-history/${campaign.id}`)}
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
            label: "",
            value: (
              <div className="w-full rounded-[0.5rem] px-2 py-2 text-center transition-colors hover:bg-[#EDEDED]">
                <div className="text-sm text-[#6F6F6F]">Applicants</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/brand/created-campaign/applied-inf?id=${campaign.id}`);
                  }}
                  className="mt-1 w-full cursor-pointer text-center font-semibold text-[#2B2B2B] hover:text-black"
                >
                  {campaign.applicantCount}
                </button>
              </div>
            ),
          },
          {
            id: "campaign",
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
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Campaign History</h1>
        </div>

        {updating && (
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm">
            Updating...
          </div>
        )}
      </div>

      <div className="mb-6 rounded-2xl  p-5 ">

        <CampaignFilter
          campaignType={campaignType}
          setCampaignType={setCampaignType}
          creatorStatus={creatorStatus}
          setCreatorStatus={setCreatorStatus}
          categoryIds={categoryIds}
          setCategoryIds={setCategoryIds}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          aiCreated={aiCreated}
          setAiCreated={setAiCreated}
          searchInput={search}
          setSearchInput={setSearch}
        />
      </div>

      {loading ? (
        <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
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