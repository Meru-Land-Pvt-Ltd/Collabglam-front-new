"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminTable, { type AdminTableColumn } from "../../components/table";
import api from "@/lib/api";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  FileWarning,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Loader2,
  Mail,
  MessageSquareText,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

type AdminRole = "super_admin" | "revenue_head" | "ime" | "bme" | "sdr";

type AdminMeResponse = {
  _id: string;
  email: string;
  name?: string;
  role: AdminRole;
  status?: string;
};

type DashboardSummary = {
  totalBrands?: number;
  totalInfluencers?: number;
  totalCampaigns?: number;
  totalDisputes?: number;
  totalRevenueThisMonth?: number;
  totalRevenueThisQuarter?: number;
  totalRevenueThisYear?: number;
  activeCampaigns?: number;
  completedCampaigns?: number;

  // Revenue Head dashboard summary
  totalAssignedBrands?: number;
  fullyManagedBrands?: number;
  partiallyManagedBrands?: number;
  totalEmployees?: number;
  totalBME?: number;
  totalIME?: number;
  totalSDR?: number;
  totalApplicants?: number;
  totalApprovedApplicants?: number;
  totalWorkingApplicants?: number;
};

type CampaignCreator = {
  userId?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  userModel?: string;
  adminRole?: string;
  label?: string;
};

type CampaignItem = {
  _id: string;
  id?: string;
  campaignId?: string;
  campaignsId?: string;
  brandId?: string;
  brandName?: string;
  brandPlanName?: string;
  campaignTitle?: string;
  name?: string;
  campaignName?: string;
  productOrServiceName?: string;
  campaignType?: string;
  campaignCategory?: string;
  publishStatus?: string;
  campaignStatus?: string;
  status?: string;
  goal?: string;
  campaignBudget?: number;
  budget?: number;
  influencerBudget?: number;
  numberOfInfluencers?: number;
  applicantCount?: number;
  isActive?: number;
  isDraft?: number;
  byAi?: number | boolean;
  startAt?: string;
  endAt?: string;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  updatedAt?: string;

  // Revenue Head dashboard fields
  brand?: BrandItem | any;
  applicationSummary?: {
    totalApplyRows?: number;
    totalApplicants?: number;
    totalApprovedApplicants?: number;
    totalWorkingApplicants?: number;
  };
  applicants?: any[];
  approvedApplicants?: any[];
  workingApplicants?: any[];

  createdBy?: CampaignCreator | null;
  createdByAdmin?: CampaignCreator | null;
};

type DisputeCreator = {
  id?: string;
  role?: string;
};

type DisputeItem = {
  _id: string;
  disputeId?: string;
  campaignId?: string;
  campaignName?: string | null;
  brandName?: string | null;
  influencerName?: string | null;
  subject?: string;
  description?: string;
  priority?: string;
  status?: string;
  createdBy?: DisputeCreator;
  raisedByRole?: string;
  raisedById?: string;
  createdAt?: string;
  updatedAt?: string;
};

type InfluencerOnboarding = {
  route?: string;
  page1Done?: boolean;
  page2Done?: boolean;
  page3Done?: boolean;
  ispage2Skip?: boolean;
  ispage3Skip?: boolean;
};

type InfluencerSocialProfile = {
  provider?: string;
  handle?: string;
  username?: string;
  followers?: number;
  url?: string;
  picture?: string;
};

type InfluencerAppliedCampaignItem = {
  _id: string;
  id?: string;
  campaignId?: string;
  name?: string;
  campaignName?: string;
  brandId?: string;
  brandName?: string;
  appliedDate?: string;
  status?: string;
  statusBrand?: string;
  statusInfluencer?: string;
  isShortlisted?: number;
  isUndicided?: number;
  isRejected?: number;
  contractId?: string;
  startDate?: string;
  endDate?: string;
  goal?: string;
  applicantCount?: number;
  isActive?: number;
};

type InfluencerItem = {
  _id: string;
  id?: string;
  influencerId?: string;
  email?: string;
  name?: string;
  proxyEmail?: string;
  primaryPlatform?: string;
  socialProfiles?: InfluencerSocialProfile[];
  onboarding?: InfluencerOnboarding;
  appliedCampaigns?: InfluencerAppliedCampaignItem[];
  campaigns?: InfluencerAppliedCampaignItem[];
  createdAt?: string;
  updatedAt?: string;
};

type InfluencerCampaignLookup = Record<
  string,
  {
    campaigns: InfluencerAppliedCampaignItem[];
    total: number;
    error?: string | null;
    influencer?: {
      influencerId?: string;
      name?: string;
      email?: string;
    };
  }
>;

type BrandSubscription = {
  planId?: string;
  planName?: string;
  role?: string;
  monthlyCost?: number;
  annualCost?: number;
  billingCycle?: string;
  autoRenew?: boolean;
  status?: string;
  startedAt?: string;
  expiresAt?: string | null;
};

type MiniAdminItem = {
  _id?: string;
  adminId?: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  proxyEmail?: string;
  teamType?: string | null;
};
type EmployeesByRole = {
  all: MiniAdminItem[];
  bme: MiniAdminItem[];
  ime: MiniAdminItem[];
  sdr: MiniAdminItem[];
};

type AssignedPersons = {
  revenueHead?: MiniAdminItem | null;
  bme?: MiniAdminItem | null;
  idm?: MiniAdminItem | null;
};

type BrandItem = {
  _id: string;
  brandId?: string;
  email?: string;
  brandName?: string;
  name?: string;
  companySize?: string;
  industry?: string;
  profilePic?: string;
  proxyEmail?: string;
  planName?: string;
  status?: string;
  subscription?: BrandSubscription;
  subscriptionExpired?: boolean;
  fullyManagedSubscription?: boolean;

  // Revenue Head dashboard fields
  assignmentId?: string;
  assignmentStatus?: string;
  assignedAt?: string | null;
  assignedPersons?: AssignedPersons;
  plan?: BrandSubscription | any;
  isFullyManaged?: boolean;

  createdAt?: string;
  updatedAt?: string;
};

type RevenueHeadAssignedBrand = {
  assignmentId?: string;
  assignmentStatus?: string;
  assignedAt?: string | null;
  updatedAt?: string | null;
  isFullyManaged?: boolean;
  assignedPersons?: AssignedPersons;
  plan?: BrandSubscription | any;
  brand?: BrandItem;
};

type ApiMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  count?: number;
  pages?: number;
};

type DashboardInfluencerCampaignResult = {
  success?: boolean;
  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
  totalPages?: number;
  count?: number;
  campaigns?: InfluencerAppliedCampaignItem[];
  influencer?: {
    influencerId?: string;
    name?: string;
    email?: string;
  };
};

type DashboardApiData = {
  roleDashboard?: "super_admin" | "revenue_head" | string;
  revenueHead?: MiniAdminItem | null;

  summary?: DashboardSummary;

  brands?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    sortBy?: string;
    sortOrder?: string;
    brands?: BrandItem[];
  } | any;

  influencers?: {
    success?: boolean;
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
    count?: number;
    influencers?: InfluencerItem[];
  } | any;

  campaigns?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    status?: string | number;
    sortBy?: string;
    sortOrder?: string;
    campaigns?: CampaignItem[];
  } | any;



  disputes?: {
    success?: boolean;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    count?: number;
    disputes?: DisputeItem[];
  } | any;

  influencerCampaigns?: {
    success?: boolean;
    influencerIds?: string[];
    totalInfluencers?: number;
    count?: number;
    results?: DashboardInfluencerCampaignResult[];
  } | any;

  assignedBrands?: RevenueHeadAssignedBrand[];
  employees?: {
    all?: MiniAdminItem[];
    bme?: MiniAdminItem[];
    ime?: MiniAdminItem[];
    sdr?: MiniAdminItem[];
  };

  appliedCampaignsByInfluencer?: any;
  influencerAppliedCampaigns?: any;
};

type DashboardApiResponse = {
  success?: boolean;
  role?: AdminRole;
  dashboard?: DashboardApiData;
  data?: {
    role?: AdminRole;
    dashboard?: DashboardApiData;
  };
};

type DashboardState = {
  me: AdminMeResponse | null;
  summary: DashboardSummary;
  campaigns: CampaignItem[];
  campaignMeta: ApiMeta;
  disputes: DisputeItem[];
  disputeMeta: ApiMeta;
  influencers: InfluencerItem[];
  influencerMeta: ApiMeta;
  influencerCampaigns: InfluencerCampaignLookup;
  brands: BrandItem[];
  brandMeta: ApiMeta;
  employees: EmployeesByRole;
  reviewQueue: ReviewQueueItem[];
  reviewQueueMeta: ApiMeta;
};

type SectionErrorMap = {
  dashboard?: string | null;
  campaigns?: string | null;
  disputes?: string | null;
  influencers?: string | null;
  brands?: string | null;
  reviewQueue?: string | null;
};

type SafeResult<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
};

type GrowthMetric = {
  current: number;
  previous: number;
  percent: number | null;
  label: string;
  direction: "up" | "down" | "flat" | "new";
};

type ChartDatum = {
  label: string;
  value: number;
};

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  sortAt: number;
  tone: "campaign" | "dispute" | "budget";
  href: string;
};

type DashboardTableRow = {
  id: string;
  cells: Array<string | number | React.ReactNode>;
};

type ReviewQueueItem = {
  _id?: string;
  id?: string;
  threadId?: string;
  messageId?: string;
  subject?: string;
  snippet?: string;
  preview?: string;
  bodyPreview?: string;
  text?: string;
  message?: string;
  from?: string | {
    name?: string;
    email?: string;
  };
  sender?: string;
  fromName?: string;
  fromEmail?: string;
  email?: string;
  brandName?: string;
  campaignName?: string;
  status?: string;
  receivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  displayUrl?: string;
  url?: string;
};

const API = {
  me: "/admins/me",
  dashboard: "/dash/dashboard",
  revenueHeadDetails: "/dash/revenueheaddetails",
  reviewQueue: "/outreach/replies/pending",
};

const DASHBOARD_POST_BODY = {};

const CAMPAIGNS_ROUTE = "/admin/campaigns";
const CAMPAIGN_VIEW_BASE = "/admin/campaigns/view";
const DISPUTES_ROUTE = "/admin/disputes";
const INFLUENCERS_ROUTE = "/admin/influencers";
const BRANDS_ROUTE = "/admin/brands";
const QUEUE_ROUTE = "/admin/crm/review-queue";

const MAIN_ADMIN = {
  userId: "69b007bb8e53408b168a8371",
  email: "admincollabglam@gmail.com",
  role: "super_admin",
};

const VALID_ROLES: AdminRole[] = [
  "super_admin",
  "revenue_head",
  "ime",
  "bme",
  "sdr",
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function extractArray<T = any>(payload: any, keys: string[] = []): T[] {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
    if (Array.isArray(payload?.data?.data?.[key])) return payload.data.data[key];
  }

  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.list)) return payload.list;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;

  return [];
}

function extractObject<T = any>(payload: any): T | null {
  if (!payload) return null;

  if (
    payload?.data?.data &&
    typeof payload.data.data === "object" &&
    !Array.isArray(payload.data.data)
  ) {
    return payload.data.data as T;
  }

  if (
    payload?.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
  ) {
    return payload.data as T;
  }

  if (typeof payload === "object" && !Array.isArray(payload)) {
    return payload as T;
  }

  return null;
}

function extractMeta(payload: any): ApiMeta {
  const source = payload?.data?.data || payload?.data || payload || {};

  return {
    page: source.page,
    limit: source.limit,
    total: source.total,
    totalPages: source.totalPages || source.pages,
    count: source.count,
    pages: source.pages,
  };
}

function getErrorMessage(error: any, fallback: string) {
  const status = error?.response?.status;
  const apiMessage = error?.response?.data?.message;
  const genericMessage = error?.message;

  if (status === 404) return `${fallback} endpoint not available`;
  if (status === 403) return `${fallback} access denied`;
  if (status === 401) return `${fallback} unauthorized`;

  return apiMessage || genericMessage || fallback;
}

async function safeGet<T = any>(
  url: string,
  fallbackLabel = "Request"
): Promise<SafeResult<T>> {
  try {
    const response = await api.get(url);

    return {
      ok: true,
      data: response?.data as T,
      error: null,
    };
  } catch (error: any) {
    return {
      ok: false,
      data: null,
      error: getErrorMessage(error, fallbackLabel),
    };
  }
}

async function safePost<T = any>(
  url: string,
  body: any,
  fallbackLabel = "Request"
): Promise<SafeResult<T>> {
  try {
    const response = await api.post(url, body);

    return {
      ok: true,
      data: response?.data as T,
      error: null,
    };
  } catch (error: any) {
    return {
      ok: false,
      data: null,
      error: getErrorMessage(error, fallbackLabel),
    };
  }
}

function mapRevenueHeadDetailsToDashboard(payload: any): DashboardApiData {
  const source = payload?.data?.data || payload?.data || payload || {};

  const assignedBrands = extractArray<RevenueHeadAssignedBrand>(source, [
    "assignedBrands",
  ]);

  const campaigns = extractArray<CampaignItem>(source, ["campaigns"]);

  const brands = assignedBrands.map((item) => {
    const brand = item.brand || ({} as BrandItem);

    return {
      ...brand,

      _id: String(brand._id || brand.brandId || item.assignmentId || ""),
      brandId: String(brand.brandId || brand._id || item.assignmentId || ""),
      brandName: brand.brandName || brand.name || "Unnamed Brand",

      assignmentId: item.assignmentId,
      assignmentStatus: item.assignmentStatus,
      assignedAt: item.assignedAt,
      assignedPersons: item.assignedPersons,

      plan: item.plan,
      planName: item.plan?.planName || brand.planName || "free",

      isFullyManaged: Boolean(item.isFullyManaged),
      fullyManagedSubscription: Boolean(item.isFullyManaged),
    };
  });

  const activeCampaigns = campaigns.filter((campaign) => {
    return (
      Number(campaign.isActive || 0) === 1 ||
      String(campaign.campaignStatus || campaign.status || "")
        .toLowerCase()
        .includes("active")
    );
  });

  const completedCampaigns = campaigns.filter((campaign) => {
    return String(campaign.campaignStatus || campaign.status || "")
      .toLowerCase()
      .includes("completed");
  });

  return {
    roleDashboard: "revenue_head",
    revenueHead: source.revenueHead || null,

    summary: {
      totalBrands: brands.length,
      totalInfluencers: 0,
      totalCampaigns: campaigns.length,
      totalDisputes: 0,
      activeCampaigns: activeCampaigns.length,
      completedCampaigns: completedCampaigns.length,
      totalRevenueThisMonth: 0,
      totalRevenueThisQuarter: 0,
      totalRevenueThisYear: 0,
      ...(source.summary || {}),
    },

    brands: {
      page: 1,
      limit: brands.length,
      total: brands.length,
      totalPages: 1,
      brands,
    },

    influencers: {
      success: true,
      page: 1,
      limit: 0,
      total: 0,
      pages: 1,
      count: 0,
      influencers: [],
    },

    campaigns: {
      page: 1,
      limit: campaigns.length,
      total: campaigns.length,
      totalPages: 1,
      campaigns,
    },

    disputes: {
      page: 1,
      limit: 0,
      total: 0,
      totalPages: 1,
      disputes: [],
    },

    influencerCampaigns: {
      success: true,
      influencerIds: [],
      totalInfluencers: 0,
      count: 0,
      results: [],
    },

    assignedBrands,
    employees: source.employees || {
      all: [],
      bme: [],
      ime: [],
      sdr: [],
    },
  };
}

function getDashboardFromResponse(
  payload: any,
  role?: AdminRole
): DashboardApiData {
  const dashboard =
    payload?.dashboard ||
    payload?.data?.dashboard ||
    payload?.data?.data?.dashboard;

  if (dashboard) {
    return dashboard;
  }

  if (role === "revenue_head") {
    return mapRevenueHeadDetailsToDashboard(payload);
  }

  return {};
}

function getInfluencerCampaignLookupFromDashboard(
  dashboard: DashboardApiData,
  influencers: InfluencerItem[]
): InfluencerCampaignLookup {
  const lookup: InfluencerCampaignLookup = {};

  const resultRows = extractArray<DashboardInfluencerCampaignResult>(
    dashboard.influencerCampaigns,
    ["results"]
  );

  resultRows.forEach((row) => {
    const influencerId =
      row.influencer?.influencerId ||
      (row as any).influencerId ||
      (row as any)._id ||
      (row as any).id;

    const campaigns = extractArray<InfluencerAppliedCampaignItem>(row, [
      "campaigns",
      "appliedCampaigns",
    ]);

    const entry = {
      campaigns,
      total: Number(row.total ?? row.count ?? campaigns.length),
      error: null,
      influencer: row.influencer,
    };

    setInfluencerLookupEntry(
      lookup,
      [
        influencerId,
        row.influencer?.influencerId,
        row.influencer?.email,
        row.influencer?.name,
      ],
      entry
    );
  });

  influencers.forEach((influencer) => {
    const existingEntry = getInfluencerLookupEntry(influencer, lookup);

    if (existingEntry) {
      setInfluencerLookupEntry(
        lookup,
        getInfluencerLookupKeys(influencer),
        existingEntry
      );

      return;
    }

    const campaigns = extractArray<InfluencerAppliedCampaignItem>(
      influencer.appliedCampaigns || influencer.campaigns,
      ["campaigns", "appliedCampaigns"]
    );

    const entry = {
      campaigns,
      total: campaigns.length,
      error: null,
      influencer: {
        influencerId: influencer.influencerId || influencer.id || influencer._id,
        name: influencer.name,
        email: influencer.email,
      },
    };

    setInfluencerLookupEntry(
      lookup,
      getInfluencerLookupKeys(influencer),
      entry
    );
  });

  return lookup;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value?: number | null) {
  const safe = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(safe);
}

function formatCompactNumber(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function titleCase(value?: string | null) {
  if (!value) return "-";

  return String(value)
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getCampaignTitle(campaign: CampaignItem) {
  return (
    campaign.campaignTitle ||
    campaign.campaignName ||
    campaign.name ||
    "Untitled Campaign"
  );
}

function getCampaignBudgetValue(campaign: CampaignItem) {
  return Number(
    campaign.campaignBudget ||
    campaign.budget ||
    campaign.influencerBudget ||
    0
  );
}

function getCampaignDateValue(campaign: CampaignItem) {
  return (
    campaign.createdAt ||
    campaign.startDate ||
    campaign.startAt ||
    campaign.updatedAt ||
    null
  );
}

function getCampaignDate(campaign: CampaignItem) {
  const value = getCampaignDateValue(campaign);
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getCampaignViewHref(campaign: CampaignItem) {
  return `${CAMPAIGN_VIEW_BASE}?id=${campaign.campaignId || campaign._id}`;
}

function getCampaignStatus(campaign: CampaignItem) {
  if (campaign.isDraft === 1) return "Draft";
  if (campaign.isActive === 1) return "Active";

  return (
    campaign.publishStatus ||
    campaign.campaignStatus ||
    campaign.status ||
    "Pending"
  );
}

function isBrandFullyManaged(campaign: CampaignItem) {
  return String(campaign.brandPlanName || "").toLowerCase() === "fully_managed";
}

function isAdminManagedCampaign(campaign: CampaignItem) {
  const creator = campaign.createdByAdmin || campaign.createdBy;
  if (!creator) return false;

  const creatorUserId = String(creator.userId || creator.id || "");
  const creatorEmail = String(creator.email || "").toLowerCase();
  const creatorRole = String(
    creator.adminRole || creator.role || ""
  ).toLowerCase();

  return (
    creatorUserId === MAIN_ADMIN.userId ||
    creatorEmail === MAIN_ADMIN.email ||
    creatorRole === MAIN_ADMIN.role ||
    creatorRole === "admin" ||
    creatorRole === "super_admin"
  );
}

function getManagementType(campaign: CampaignItem) {
  return isAdminManagedCampaign(campaign)
    ? "Fully Managed"
    : "Normal Campaign";
}

function getInfluencerId(influencer: InfluencerItem) {
  return (
    influencer.influencerId ||
    influencer.id ||
    influencer._id ||
    influencer.email ||
    ""
  );
}

function normalizeLookupKey(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function getInfluencerLookupKeys(influencer: InfluencerItem) {
  return [
    influencer.influencerId,
    influencer.id,
    influencer._id,
    influencer.email,
    influencer.name,
  ]
    .filter(Boolean)
    .map((item) => String(item));
}

function setInfluencerLookupEntry(
  lookup: InfluencerCampaignLookup,
  keys: Array<string | undefined | null>,
  entry: InfluencerCampaignLookup[string]
) {
  keys.filter(Boolean).forEach((key) => {
    const rawKey = String(key);
    const normalizedKey = normalizeLookupKey(rawKey);

    lookup[rawKey] = entry;
    lookup[normalizedKey] = entry;
  });
}

function getInfluencerLookupEntry(
  influencer: InfluencerItem,
  lookup: InfluencerCampaignLookup
) {
  const keys = getInfluencerLookupKeys(influencer);

  for (const key of keys) {
    const direct = lookup[key];
    if (direct) return direct;

    const normalized = lookup[normalizeLookupKey(key)];
    if (normalized) return normalized;
  }

  const influencerEmail = normalizeLookupKey(influencer.email);
  const influencerName = normalizeLookupKey(influencer.name);

  return (
    Object.values(lookup).find((entry) => {
      const entryEmail = normalizeLookupKey(entry.influencer?.email);
      const entryName = normalizeLookupKey(entry.influencer?.name);

      return (
        (influencerEmail && entryEmail && influencerEmail === entryEmail) ||
        (influencerName && entryName && influencerName === entryName)
      );
    }) || null
  );
}
function mergeInfluencersWithCampaignResults(
  influencers: InfluencerItem[],
  dashboard: DashboardApiData
): InfluencerItem[] {
  const merged = [...influencers];

  const resultRows = extractArray<DashboardInfluencerCampaignResult>(
    dashboard.influencerCampaigns,
    ["results"]
  );

  resultRows.forEach((row, index) => {
    const info = row.influencer;

    if (!info?.influencerId && !info?.email) return;

    const alreadyExists = merged.some((influencer) => {
      const influencerKeys = getInfluencerLookupKeys(influencer).map(
        normalizeLookupKey
      );

      return (
        (info.influencerId &&
          influencerKeys.includes(normalizeLookupKey(info.influencerId))) ||
        (info.email &&
          normalizeLookupKey(influencer.email) === normalizeLookupKey(info.email))
      );
    });

    if (alreadyExists) return;

    merged.push({
      _id:
        info.influencerId ||
        info.email ||
        `influencer-campaign-result-${index}`,
      influencerId: info.influencerId,
      name: info.name,
      email: info.email,
      appliedCampaigns: row.campaigns || [],
    });
  });

  return merged;
}

function getInfluencerDate(influencer: InfluencerItem) {
  const value = influencer.createdAt || influencer.updatedAt || null;
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isInfluencerOnboarded(influencer: InfluencerItem) {
  const onboarding = influencer.onboarding;

  return Boolean(
    onboarding?.page1Done &&
    onboarding?.page2Done &&
    onboarding?.page3Done
  );
}

function getInfluencerFollowers(influencer: InfluencerItem) {
  return (influencer.socialProfiles || []).reduce((sum, profile) => {
    return sum + Number(profile.followers || 0);
  }, 0);
}

function getInfluencerPrimaryProfile(influencer: InfluencerItem) {
  return influencer.socialProfiles?.[0] || null;
}

function getInfluencerAppliedCampaignTotal(
  influencer: InfluencerItem,
  lookup: InfluencerCampaignLookup
) {
  const item = getInfluencerLookupEntry(influencer, lookup);

  return Number(item?.total ?? item?.campaigns?.length ?? 0);
}

function getBrandId(brand: BrandItem) {
  return brand.brandId || brand._id;
}

function getBrandName(brand: BrandItem) {
  return brand.brandName || brand.name || "Unnamed Brand";
}

function getBrandPlan(brand: BrandItem) {
  return brand.planName || brand.subscription?.planName || "free";
}

function getBrandDate(brand: BrandItem) {
  const value = brand.createdAt || brand.updatedAt || null;
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isBrandActiveAccount(brand: BrandItem) {
  return (
    String(brand.status || brand.subscription?.status || "").toLowerCase() ===
    "active"
  );
}

function isFullyManagedBrandAccount(brand: BrandItem) {
  return (
    Boolean(brand.fullyManagedSubscription) ||
    getBrandPlan(brand).toLowerCase() === "fully_managed"
  );
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function inRange(date: Date | null, start: Date, end: Date) {
  if (!date) return false;
  return date >= start && date < end;
}

function calculateGrowth<T>(
  items: T[],
  getDate: (item: T) => Date | null,
  getValue: (item: T) => number,
  today = new Date()
): GrowthMetric {
  const end = addDays(startOfDay(today), 1);
  const currentStart = addDays(end, -30);
  const previousStart = addDays(currentStart, -30);

  const current = items.reduce((sum, item) => {
    const date = getDate(item);
    return inRange(date, currentStart, end) ? sum + getValue(item) : sum;
  }, 0);

  const previous = items.reduce((sum, item) => {
    const date = getDate(item);
    return inRange(date, previousStart, currentStart)
      ? sum + getValue(item)
      : sum;
  }, 0);

  if (previous === 0 && current === 0) {
    return {
      current,
      previous,
      percent: 0,
      label: "0%",
      direction: "flat",
    };
  }

  if (previous === 0) {
    return {
      current,
      previous,
      percent: null,
      label: "New data",
      direction: "new",
    };
  }

  const percent = ((current - previous) / previous) * 100;

  return {
    current,
    previous,
    percent,
    label: `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`,
    direction: percent > 0 ? "up" : percent < 0 ? "down" : "flat",
  };
}

function calculateCalendarMonthGrowth<T>(
  items: T[],
  getDate: (item: T) => Date | null,
  today = new Date()
): GrowthMetric {
  const currentStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const nextStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const current = items.reduce((sum, item) => {
    const date = getDate(item);
    return date && date >= currentStart && date < nextStart ? sum + 1 : sum;
  }, 0);

  const previous = items.reduce((sum, item) => {
    const date = getDate(item);
    return date && date >= previousStart && date < currentStart ? sum + 1 : sum;
  }, 0);

  if (previous === 0 && current === 0) {
    return {
      current,
      previous,
      percent: 0,
      label: "0%",
      direction: "flat",
    };
  }

  if (previous === 0) {
    return {
      current,
      previous,
      percent: null,
      label: "New data",
      direction: "new",
    };
  }

  const percent = ((current - previous) / previous) * 100;

  return {
    current,
    previous,
    percent,
    label: `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`,
    direction: percent > 0 ? "up" : percent < 0 ? "down" : "flat",
  };
}

function getWeeklyBudgetData(campaigns: CampaignItem[]): ChartDatum[] {
  const now = startOfDay(new Date());
  const labels = ["Week 1", "Week 2", "Week 3", "Week 4"];

  return labels.map((label, index) => {
    const start = addDays(now, -28 + index * 7);
    const end =
      index === labels.length - 1 ? addDays(now, 1) : addDays(start, 7);

    const value = campaigns.reduce((sum, campaign) => {
      const date = getCampaignDate(campaign);
      return inRange(date, start, end)
        ? sum + getCampaignBudgetValue(campaign)
        : sum;
    }, 0);

    return { label, value };
  });
}

function getWeeklyCampaignCountData(campaigns: CampaignItem[]): ChartDatum[] {
  const now = startOfDay(new Date());
  const labels = ["Week 1", "Week 2", "Week 3", "Week 4"];

  return labels.map((label, index) => {
    const start = addDays(now, -28 + index * 7);
    const end =
      index === labels.length - 1 ? addDays(now, 1) : addDays(start, 7);

    const value = campaigns.reduce((sum, campaign) => {
      const date = getCampaignDate(campaign);
      return inRange(date, start, end) ? sum + 1 : sum;
    }, 0);

    return { label, value };
  });
}

function getMonthlyFullyOnboardedInfluencerData(
  influencers: InfluencerItem[],
  monthCount = 6
): ChartDatum[] {
  const today = new Date();

  return Array.from({ length: monthCount }, (_, index) => {
    const monthDate = new Date(
      today.getFullYear(),
      today.getMonth() - (monthCount - 1 - index),
      1
    );

    const monthStart = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1
    );
    const monthEnd = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      1
    );

    const value = influencers.reduce((sum, influencer) => {
      const date = getInfluencerDate(influencer);
      const fullyOnboarded = isInfluencerOnboarded(influencer);

      return fullyOnboarded && date && date >= monthStart && date < monthEnd
        ? sum + 1
        : sum;
    }, 0);

    return {
      label: monthDate.toLocaleDateString("en-US", {
        month: "short",
      }),
      value,
    };
  });
}

function getRecentlySignedUpInfluencers(influencers: InfluencerItem[]) {
  return [...influencers]
    .sort((a, b) => {
      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    })
    .slice(0, 3);
}

function getMonthlyBrandSignupData(
  brands: BrandItem[],
  monthCount = 6
): ChartDatum[] {
  const today = new Date();

  return Array.from({ length: monthCount }, (_, index) => {
    const monthDate = new Date(
      today.getFullYear(),
      today.getMonth() - (monthCount - 1 - index),
      1
    );

    const monthStart = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1
    );
    const monthEnd = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      1
    );

    const value = brands.reduce((sum, brand) => {
      const date = getBrandDate(brand);
      return date && date >= monthStart && date < monthEnd ? sum + 1 : sum;
    }, 0);

    return {
      label: monthDate.toLocaleDateString("en-US", { month: "short" }),
      value,
    };
  });
}

function getRecentlySignedUpBrands(brands: BrandItem[], limit = 4) {
  return [...brands]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, limit);
}

function getTopCampaigns(campaigns: CampaignItem[]) {
  return [...campaigns]
    .sort((a, b) => {
      const budgetDiff = getCampaignBudgetValue(b) - getCampaignBudgetValue(a);
      if (budgetDiff !== 0) return budgetDiff;

      return Number(b.applicantCount || 0) - Number(a.applicantCount || 0);
    })
    .slice(0, 8);
}

function getTopDisputes(disputes: DisputeItem[]) {
  return [...disputes]
    .sort((a, b) => {
      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    })
    .slice(0, 4);
}

function getActivityItems(
  campaigns: CampaignItem[],
  disputes: DisputeItem[]
): ActivityItem[] {
  const campaignActivities = campaigns.slice(0, 3).map((campaign) => ({
    id: `campaign-${campaign._id}`,
    title: `${getCampaignTitle(campaign)} ${isAdminManagedCampaign(campaign)
      ? "created by Main Admin"
      : "listed by brand"
      }`,
    subtitle: `${campaign.brandName || "Unknown brand"} • ${getManagementType(
      campaign
    )}`,
    time: formatDateTime(getCampaignDateValue(campaign)),
    sortAt: getCampaignDate(campaign)?.getTime() || 0,
    tone: "campaign" as const,
    href: `/admin/campaigns/view?id=${campaign.campaignId || campaign._id}`,
  }));

  const disputeActivities = disputes.slice(0, 3).map((dispute) => ({
    id: `dispute-${dispute._id}`,
    title: `${dispute.subject || dispute.disputeId || "New dispute"}`,
    subtitle: `${titleCase(
      dispute.createdBy?.role || dispute.raisedByRole
    )} raised dispute`,
    time: formatDateTime(dispute.createdAt),
    sortAt: new Date(dispute.createdAt || 0).getTime(),
    tone: "dispute" as const,
    href: `/admin/disputes/${dispute.disputeId || dispute._id}`,
  }));

  return [...campaignActivities, ...disputeActivities]
    .sort((a, b) => b.sortAt - a.sortAt)
    .slice(0, 6);
}


function canViewReviewQueue(role?: AdminRole | null) {
  return role === "super_admin" || role === "revenue_head";
}

function getReviewQueueId(item: ReviewQueueItem, index: number) {
  return (
    item._id ||
    item.id ||
    item.threadId ||
    item.messageId ||
    `${item.fromEmail || item.email || "review"}-${index}`
  );
}

function getReviewQueueSenderName(item: ReviewQueueItem) {
  if (typeof item.from === "object" && item.from?.name) {
    return item.from.name;
  }

  return (
    item.fromName ||
    item.sender ||
    item.brandName ||
    item.campaignName ||
    "Unknown Sender"
  );
}

function getReviewQueueSenderEmail(item: ReviewQueueItem) {
  if (typeof item.from === "object" && item.from?.email) {
    return item.from.email;
  }

  if (typeof item.from === "string" && item.from.includes("@")) {
    return item.from;
  }

  return item.fromEmail || item.email || "";
}

function getReviewQueueSubject(item: ReviewQueueItem) {
  return (
    item.subject ||
    item.campaignName ||
    item.brandName ||
    "New pending reply"
  );
}

function getReviewQueuePreview(item: ReviewQueueItem) {
  return (
    item.snippet ||
    item.preview ||
    item.bodyPreview ||
    item.text ||
    item.message ||
    "No message preview available."
  );
}

function getReviewQueueTime(item: ReviewQueueItem) {
  return item.receivedAt || item.createdAt || item.updatedAt || null;
}
function getStatusTone(status?: string) {
  const key = String(status || "").toLowerCase();

  if (
    key.includes("active") ||
    key.includes("completed") ||
    key.includes("resolved") ||
    key.includes("shortlisted")
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (
    key.includes("review") ||
    key.includes("pending") ||
    key.includes("draft") ||
    key.includes("medium") ||
    key.includes("applied") ||
    key.includes("contract")
  ) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (
    key.includes("failed") ||
    key.includes("open") ||
    key.includes("high") ||
    key.includes("reject")
  ) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  return "bg-slate-50 text-slate-700 ring-slate-200";
}

function getVisibleErrorCount(errors: SectionErrorMap) {
  return Object.values(errors).filter(Boolean).length;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [sectionErrors, setSectionErrors] = useState<SectionErrorMap>({});

  const [state, setState] = useState<DashboardState>({
    me: null,
    summary: {},
    campaigns: [],
    campaignMeta: {},
    disputes: [],
    disputeMeta: {},
    influencers: [],
    influencerMeta: {},
    influencerCampaigns: {},
    brands: [],
    brandMeta: {},
    employees: {
      all: [],
      bme: [],
      ime: [],
      sdr: [],
    },
    reviewQueue: [],
    reviewQueueMeta: {},
  });

  const analytics = useMemo(() => {
    const campaigns = state.campaigns;
    const influencers = state.influencers;
    const brands = state.brands;
    const employees = state.employees;
    const activeBrands = brands.filter(isBrandActiveAccount);
    const fullyManagedBrands = brands.filter(isFullyManagedBrandAccount);
    const freeBrands = brands.filter(
      (brand) => getBrandPlan(brand).toLowerCase() === "free"
    );
    const paidBrands = brands.filter(
      (brand) => getBrandPlan(brand).toLowerCase() !== "free"
    );
    const brandMonthGrowth = calculateCalendarMonthGrowth(brands, getBrandDate);
    const brandSignupTrend = getMonthlyBrandSignupData(brands, 6);
    const recentBrands = getRecentlySignedUpBrands(brands, 4);

    const activeInfluencers = influencers.filter(isInfluencerOnboarded);
    const pendingInfluencers = influencers.filter(
      (influencer) => !isInfluencerOnboarded(influencer)
    );

    const influencerMonthGrowth = calculateCalendarMonthGrowth(
      influencers,
      getInfluencerDate
    );

    const totalInfluencerFollowers = influencers.reduce((sum, influencer) => {
      return sum + getInfluencerFollowers(influencer);
    }, 0);

    const appliedCampaignTotal = influencers.reduce((sum, influencer) => {
      return (
        sum +
        getInfluencerAppliedCampaignTotal(influencer, state.influencerCampaigns)
      );
    }, 0);

    const fullyOnboardedMonthlyTrend =
      getMonthlyFullyOnboardedInfluencerData(influencers, 6);

    const recentSignedUpInfluencers =
      getRecentlySignedUpInfluencers(influencers);

    const topInfluencers = [...influencers]
      .sort((a, b) => {
        const appliedDiff =
          getInfluencerAppliedCampaignTotal(b, state.influencerCampaigns) -
          getInfluencerAppliedCampaignTotal(a, state.influencerCampaigns);

        if (appliedDiff !== 0) return appliedDiff;

        return getInfluencerFollowers(b) - getInfluencerFollowers(a);
      })
      .slice(0, 6);

    const fullyManagedCampaigns = campaigns.filter(isAdminManagedCampaign);
    const normalCampaigns = campaigns.filter(
      (campaign) => !isAdminManagedCampaign(campaign)
    );
    const fullyManagedBrandCampaigns = campaigns.filter(isBrandFullyManaged);
    const activeCampaigns = campaigns.filter(
      (campaign) => campaign.isActive === 1
    );
    const draftCampaigns = campaigns.filter(
      (campaign) => campaign.isDraft === 1
    );

    const totalApplicants = campaigns.reduce((sum, campaign) => {
      return sum + Number(campaign.applicantCount || 0);
    }, 0);

    const totalBudget = campaigns.reduce((sum, campaign) => {
      return sum + getCampaignBudgetValue(campaign);
    }, 0);

    const fullyManagedBudget = fullyManagedCampaigns.reduce((sum, campaign) => {
      return sum + getCampaignBudgetValue(campaign);
    }, 0);

    const normalCampaignBudget = normalCampaigns.reduce((sum, campaign) => {
      return sum + getCampaignBudgetValue(campaign);
    }, 0);

    const avgBudget = campaigns.length ? totalBudget / campaigns.length : 0;
    const brandManagedNormal = normalCampaigns.filter(isBrandFullyManaged);

    const fullyManagedBudgetGrowth = calculateGrowth(
      fullyManagedCampaigns,
      getCampaignDate,
      getCampaignBudgetValue
    );

    const normalBudgetGrowth = calculateGrowth(
      normalCampaigns,
      getCampaignDate,
      getCampaignBudgetValue
    );

    const fullyManagedCountGrowth = calculateGrowth(
      fullyManagedCampaigns,
      getCampaignDate,
      () => 1
    );

    const normalCountGrowth = calculateGrowth(
      normalCampaigns,
      getCampaignDate,
      () => 1
    );

    const openDisputes = state.disputes.filter((item) => {
      return String(item.status || "").toLowerCase() === "open";
    });

    const brandDisputes = state.disputes.filter((item) => {
      return (
        String(item.createdBy?.role || item.raisedByRole || "").toLowerCase() ===
        "brand"
      );
    });

    const influencerDisputes = state.disputes.filter((item) => {
      return (
        String(item.createdBy?.role || item.raisedByRole || "").toLowerCase() ===
        "influencer"
      );
    });

    return {
      brands,
      activeBrands,
      fullyManagedBrands,
      freeBrands,
      paidBrands,
      brandMonthGrowth,
      brandSignupTrend,
      recentBrands,
      employees,
      influencers,
      activeInfluencers,
      pendingInfluencers,
      influencerMonthGrowth,
      totalInfluencerFollowers,
      appliedCampaignTotal,
      fullyOnboardedMonthlyTrend,
      recentSignedUpInfluencers,
      topInfluencers,

      campaigns,
      fullyManagedCampaigns,
      normalCampaigns,
      fullyManagedBrandCampaigns,
      activeCampaigns,
      draftCampaigns,
      totalApplicants,
      totalBudget,
      fullyManagedBudget,
      normalCampaignBudget,
      avgBudget,
      brandManagedNormal,
      fullyManagedBudgetGrowth,
      normalBudgetGrowth,
      fullyManagedCountGrowth,
      normalCountGrowth,
      openDisputes,
      brandDisputes,
      influencerDisputes,
      budgetTrend: getWeeklyBudgetData(campaigns),
      creationTrend: getWeeklyCampaignCountData(campaigns),
      topCampaigns: getTopCampaigns(campaigns),
      topDisputes: getTopDisputes(state.disputes),
      activity: getActivityItems(campaigns, state.disputes),
    };
  }, [
    state.campaigns,
    state.disputes,
    state.influencers,
    state.influencerCampaigns,
    state.brands,
    state.employees,
  ]);

  const visibleErrorCount = useMemo(() => {
    return getVisibleErrorCount(sectionErrors);
  }, [sectionErrors]);

  const loadDashboard = async (mode: "initial" | "refresh" = "initial") => {
    try {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);

      setFatalError(null);
      setSectionErrors({});

      const meResult = await safeGet<any>(API.me, "Profile");

      if (!meResult.ok || !meResult.data) {
        const message = meResult.error || "Unable to verify admin profile";
        setFatalError(message);

        if (
          String(message).toLowerCase().includes("unauthorized") ||
          String(message).toLowerCase().includes("access denied")
        ) {
          router.replace("/admin/login");
        }

        return;
      }

      const me =
        extractObject<AdminMeResponse>(meResult.data) ||
        (meResult.data as AdminMeResponse);

      if (!me?.role || !VALID_ROLES.includes(me.role)) {
        router.replace("/admin/login");
        return;
      }
      let reviewQueue: ReviewQueueItem[] = [];
      let reviewQueueMeta: ApiMeta = {};
      let reviewQueueError: string | null = null;

      if (canViewReviewQueue(me.role)) {
        const reviewQueueResult = await safeGet<any>(
          API.reviewQueue,
          "Review Queue"
        );

        if (reviewQueueResult.ok && reviewQueueResult.data) {
          reviewQueue = extractArray<ReviewQueueItem>(reviewQueueResult.data, [
            "replies",
            "pendingReplies",
            "items",
            "results",
            "queue",
            "threads",
            "data",
          ]);

          reviewQueueMeta = extractMeta(reviewQueueResult.data);
        } else {
          reviewQueueError =
            reviewQueueResult.error || "Unable to load review queue";
        }
      }

      const dashboardEndpoint =
        me.role === "revenue_head" ? API.revenueHeadDetails : API.dashboard;

      const dashboardResult = await safePost<DashboardApiResponse>(
        dashboardEndpoint,
        DASHBOARD_POST_BODY,
        me.role === "revenue_head" ? "Revenue Head Dashboard" : "Dashboard"
      );

      if (!dashboardResult.ok || !dashboardResult.data) {
        setState((previous) => ({
          ...previous,
          me,
        }));

        setSectionErrors({
          dashboard: dashboardResult.error || "Unable to load dashboard",
          brands: dashboardResult.error || "Unable to load brands",
          influencers: dashboardResult.error || "Unable to load influencers",
          campaigns: dashboardResult.error || "Unable to load campaigns",
          disputes: dashboardResult.error || "Unable to load disputes",
        });

        return;
      }

      const dashboard = getDashboardFromResponse(dashboardResult.data, me.role);

      const brands = extractArray<BrandItem>(dashboard.brands, ["brands"]);

      const rawInfluencers = extractArray<InfluencerItem>(dashboard.influencers, [
        "influencers",
      ]);

      const influencers = mergeInfluencersWithCampaignResults(
        rawInfluencers,
        dashboard
      );

      const campaigns = extractArray<CampaignItem>(dashboard.campaigns, [
        "campaigns",
      ]);

      const disputes = extractArray<DisputeItem>(dashboard.disputes, [
        "disputes",
      ]);

      const employees: EmployeesByRole = {
        all: Array.isArray(dashboard.employees?.all)
          ? dashboard.employees.all
          : [],
        bme: Array.isArray(dashboard.employees?.bme)
          ? dashboard.employees.bme
          : [],
        ime: Array.isArray(dashboard.employees?.ime)
          ? dashboard.employees.ime
          : [],
        sdr: Array.isArray(dashboard.employees?.sdr)
          ? dashboard.employees.sdr
          : [],
      };

      const influencerCampaigns = getInfluencerCampaignLookupFromDashboard(
        dashboard,
        influencers
      );

      setState({
        me,
        summary: dashboard.summary || {},

        brands,
        brandMeta: extractMeta(dashboard.brands),

        influencers,
        influencerMeta: extractMeta(dashboard.influencers),
        influencerCampaigns,

        campaigns,
        campaignMeta: extractMeta(dashboard.campaigns),

        disputes,
        disputeMeta: extractMeta(dashboard.disputes),

        employees,

        reviewQueue,
        reviewQueueMeta,
      });

      setSectionErrors({
        dashboard: null,
        brands: null,
        influencers: null,
        campaigns: null,
        disputes: null,
        reviewQueue: reviewQueueError,
      });
    } catch (error: any) {
      setFatalError(error?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard("initial");
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (fatalError) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="rounded-[28px] border border-rose-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Unable to open dashboard
                </h1>
                <p className="mt-2 text-sm text-slate-600">{fatalError}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void loadDashboard("refresh")}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                <RefreshCcw
                  className={cn("h-4 w-4", refreshing && "animate-spin")}
                />
                Retry
              </button>

              <button
                onClick={() => router.replace("/admin/login")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Go to Login
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1580px] flex-col gap-5">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-[34px]">
                {titleCase(state.me?.role || "Admin")} Dashboard
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                {state.me?.role === "revenue_head"
                  ? "Assigned brands, team employees, campaign activity, and revenue head performance analytics."
                  : state.me?.role === "super_admin"
                    ? "Brand, influencer, campaign, dispute, and platform activity analytics."
                    : "Role-based dashboard overview and activity analytics."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {visibleErrorCount > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  {visibleErrorCount} section
                  {visibleErrorCount > 1 ? "s" : ""} unavailable
                </span>
              ) : null}

            </div>
          </div>

        </section>

        <section className="flex flex-col gap-5">
          <SectionHeader
            title="Brand Data"
            subtitle="Brand signup, subscription, plan, and account health overview"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
            <MetricCard
              icon={<LayoutDashboard className="h-5 w-5" />}
              label={
                state.me?.role === "revenue_head"
                  ? "Assigned Brands"
                  : "Total Brands"
              }
              value={String(
                state.me?.role === "revenue_head"
                  ? state.summary.totalAssignedBrands ??
                  state.summary.totalBrands ??
                  state.brandMeta.total ??
                  analytics.brands.length
                  : state.summary.totalBrands ??
                  state.brandMeta.total ??
                  analytics.brands.length
              )}
              helper={
                state.me?.role === "revenue_head"
                  ? "Brands assigned to you"
                  : "All registered brands"
              }
              tone="info"
              href={BRANDS_ROUTE}
            />

            <MetricCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Brand This Month"
              value={String(analytics.brandMonthGrowth.current)}
              helper="New brand signups"
              tone="success"
            />

            <MetricCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Brand Growth"
              value={analytics.brandMonthGrowth.label}
              helper="Compared with last month"
              tone="managed"
            />

            <MetricCard
              icon={<Briefcase className="h-5 w-5" />}
              label="Fully Managed Brands"
              value={String(analytics.fullyManagedBrands.length)}
              helper="Managed subscription brands"
              tone="managed"
            />

            <MetricCard
              icon={<LayoutDashboard className="h-5 w-5" />}
              label="Free Plan"
              value={String(analytics.freeBrands.length)}
              helper="Brands on free plan"
              tone="default"
            />

            <MetricCard
              icon={<CircleDollarSign className="h-5 w-5" />}
              label="Paid Plan"
              value={String(analytics.paidBrands.length)}
              helper="Brands on paid plan"
              tone="info"
            />
          </div>

          <div className="flex flex-col gap-5">
            <div
              className={cn(
                "grid grid-cols-1 items-stretch gap-5",
                canViewReviewQueue(state.me?.role)
                  ? "xl:grid-cols-[0.95fr_1.05fr]"
                  : "xl:grid-cols-1"
              )}
            >
              <Card
                title="Brand Analytics"
                subtitle="Brand signup, subscription, and plan overview"
                action={
                  <Link
                    href={BRANDS_ROUTE}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    View All
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
                className="h-full"
              >
                {sectionErrors.brands ? (
                  <SectionWarning text={sectionErrors.brands} />
                ) : (
                  <BrandAnalyticsCard
                    total={analytics.brands.length}
                    active={analytics.activeBrands.length}
                    fullyManaged={analytics.fullyManagedBrands.length}
                    free={analytics.freeBrands.length}
                    paid={analytics.paidBrands.length}
                    growth={analytics.brandMonthGrowth}
                  />
                )}
              </Card>

              {canViewReviewQueue(state.me?.role) ? (
                <Card
                  title="Review Queue"
                  subtitle="Pending outreach replies that need review"
                  className="h-full"
                  action={
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                        <Mail className="h-3.5 w-3.5" />
                        {state.reviewQueue.length} pending
                      </span>

                      <Link
                        href={QUEUE_ROUTE}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        View All
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  }
                >
                  {sectionErrors.reviewQueue ? (
                    <SectionWarning text={sectionErrors.reviewQueue} />
                  ) : (
                    <ReviewQueueThreads items={state.reviewQueue} />
                  )}
                </Card>
              ) : null}
            </div>

            <Card
              title="Brand Signup Growth"
              subtitle="Monthly brand signup trend"
              className="h-full"
              bodyClassName="flex h-full flex-col"
            >
              {sectionErrors.brands ? (
                <SectionWarning text={sectionErrors.brands} />
              ) : (
                <HoverBarChart
                  data={analytics.brandSignupTrend}
                  valueFormatter={(value) => `${value}`}
                  valueLabel="Brand signups"
                  secondary
                />
              )}
            </Card>
          </div>

          <Card
            title="Recently Signed Up Brands"
            subtitle="Latest 4 brand registrations only"
            action={
              <Link
                href={BRANDS_ROUTE}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            {sectionErrors.brands ? (
              <SectionWarning text={sectionErrors.brands} />
            ) : (
              <BrandListTable brands={analytics.recentBrands} />
            )}
          </Card>
        </section>
        {state.me?.role !== "revenue_head" ? (
          <section className="flex flex-col gap-5">
            <SectionHeader
              title="Influencer Data"
              subtitle="Influencer signup, onboarding, and applied campaign analytics"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                icon={<Users className="h-5 w-5" />}
                label="Total Influencers"
                value={String(
                  state.summary.totalInfluencers ??
                  state.influencerMeta.total ??
                  analytics.influencers.length
                )}
                helper="All registered influencers"
                tone="info"
                href={INFLUENCERS_ROUTE}
              />

              <MetricCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                label="This Month"
                value={String(analytics.influencerMonthGrowth.current)}
                helper="New influencer signups"
                tone="success"
              />

              <MetricCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Growth Rate"
                value={analytics.influencerMonthGrowth.label}
                helper="Compared with last month"
                tone="managed"
              />

              <MetricCard
                icon={<Sparkles className="h-5 w-5" />}
                label="Onboarded"
                value={String(analytics.activeInfluencers.length)}
                helper="All onboarding steps done"
                tone="success"
              />

              <MetricCard
                icon={<FileWarning className="h-5 w-5" />}
                label="Pending Influencers"
                value={String(analytics.pendingInfluencers.length)}
                helper="Onboarding incomplete"
                tone="danger"
              />
            </div>

            <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[0.85fr_1.15fr]">
              <Card
                title="Influencer Onboarding"
                subtitle="Active means all onboarding steps are completed"
                action={
                  <Link
                    href={INFLUENCERS_ROUTE}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    View All
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
                className="h-full"
              >
                {sectionErrors.influencers ? (
                  <SectionWarning text={sectionErrors.influencers} />
                ) : (
                  <InfluencerOnboardingCard
                    total={analytics.influencers.length}
                    active={analytics.activeInfluencers.length}
                    pending={analytics.pendingInfluencers.length}
                    followers={analytics.totalInfluencerFollowers}
                    appliedCampaigns={analytics.appliedCampaignTotal}
                  />
                )}
              </Card>

              <Card
                title="Fully Onboarded Influencers"
                subtitle="Monthly fully onboarded influencer count"
                className="h-full"
                bodyClassName="flex h-full flex-col"
              >
                {sectionErrors.influencers ? (
                  <SectionWarning text={sectionErrors.influencers} />
                ) : (
                  <HoverBarChart
                    data={analytics.fullyOnboardedMonthlyTrend}
                    valueFormatter={(value) => `${value}`}
                    valueLabel="Fully onboarded"
                    secondary
                  />
                )}
              </Card>
            </div>

            <div className="grid grid-cols-1 items-stretch gap-5 ">
              <Card
                title="Recently Signed Up"
                subtitle="Latest 3 influencer registrations"
                action={
                  <Link
                    href={INFLUENCERS_ROUTE}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    View All
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
                className="h-full"
              >
                {sectionErrors.influencers ? (
                  <SectionWarning text={sectionErrors.influencers} />
                ) : (
                  <RecentInfluencerList
                    influencers={analytics.recentSignedUpInfluencers}
                  />
                )}
              </Card>
            </div>
          </section>
        ) : null}
        <section className="flex flex-col gap-5">
          <SectionHeader
            title="Campaign Data"
            subtitle="Campaign health, budget, management split, disputes, and activity"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            <MetricCard
              icon={<FolderKanban className="h-5 w-5" />}
              label="Active Campaigns"
              value={String(
                state.summary.activeCampaigns ?? analytics.activeCampaigns.length
              )}
              helper="Current active listings"
              tone="success"
              href={CAMPAIGNS_ROUTE}
            />

            <MetricCard
              icon={<Sparkles className="h-5 w-5" />}
              label="Fully Managed"
              value={String(analytics.fullyManagedCampaigns.length)}
              helper="Created by Main Admin"
              tone="managed"
              growth={analytics.fullyManagedCountGrowth}
            />

            <MetricCard
              icon={<LayoutDashboard className="h-5 w-5" />}
              label="Normal Campaigns"
              value={String(analytics.normalCampaigns.length)}
              helper="Created by brands"
              tone="info"
              growth={analytics.normalCountGrowth}
            />

            <MetricCard
              icon={<CircleDollarSign className="h-5 w-5" />}
              label="Fully Managed Budget"
              value={formatMoney(analytics.fullyManagedBudget)}
              helper="Main Admin campaigns"
              tone="managed"
              growth={analytics.fullyManagedBudgetGrowth}
            />

            <MetricCard
              icon={<BarChart3 className="h-5 w-5" />}
              label="Normal Budget"
              value={formatMoney(analytics.normalCampaignBudget)}
              helper="Brand-created campaigns"
              tone="info"
              growth={analytics.normalBudgetGrowth}
            />

            <MetricCard
              icon={<Users className="h-5 w-5" />}
              label="Applicants"
              value={String(analytics.totalApplicants)}
              helper="Across all campaigns"
            />

            <MetricCard
              icon={<FileWarning className="h-5 w-5" />}
              label="Open Disputes"
              value={String(analytics.openDisputes.length)}
              helper={`${state.summary.totalDisputes ??
                state.disputeMeta.total ??
                state.disputes.length
                } total disputes`}
              tone="danger"
              href={DISPUTES_ROUTE}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_0.8fr]">
            <Card title="Campaign Health" subtitle="Live status of campaign operations">
              {sectionErrors.campaigns ? (
                <SectionWarning text={sectionErrors.campaigns} />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  <HealthStat
                    label="Admin Created"
                    value={analytics.fullyManagedCampaigns.length}
                    accent="text-violet-700"
                  />
                  <HealthStat
                    label="Brand Created"
                    value={analytics.normalCampaigns.length}
                    accent="text-blue-700"
                  />
                  <HealthStat
                    label="Active"
                    value={
                      state.summary.activeCampaigns ??
                      analytics.activeCampaigns.length
                    }
                    accent="text-emerald-700"
                  />
                  <HealthStat
                    label="Draft"
                    value={analytics.draftCampaigns.length}
                    accent="text-rose-700"
                  />
                  <HealthStat
                    label="Applicants"
                    value={analytics.totalApplicants}
                    accent="text-slate-900"
                  />
                  <HealthStat
                    label="Brand Managed"
                    value={analytics.fullyManagedBrandCampaigns.length}
                    accent="text-amber-700"
                  />
                </div>
              )}
            </Card>

            <Card
              title="Risk & Action Required"
              subtitle="Top dispute overview"
              danger
              action={
                <Link
                  href={DISPUTES_ROUTE}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  View All
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {sectionErrors.disputes ? (
                <SectionWarning text={sectionErrors.disputes} />
              ) : (
                <div className="space-y-3">
                  <RiskRow
                    label="Open Disputes"
                    value={analytics.openDisputes.length}
                    tone="danger"
                  />
                  <RiskRow
                    label="Brand Raised"
                    value={analytics.brandDisputes.length}
                    tone="warning"
                  />
                  <RiskRow
                    label="Influencer Raised"
                    value={analytics.influencerDisputes.length}
                    tone="warning"
                  />
                </div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[1fr_1fr_0.92fr]">
            <Card
              title="Budget Growth"
              subtitle="Budget movement in the last 4 weeks"
              className="h-full min-h-[430px]"
              bodyClassName="flex h-full flex-col"
            >
              <LineTrendChart
                data={analytics.budgetTrend}
                valueFormatter={(value) => formatMoney(value)}
                valueLabel="Budget"
              />
            </Card>

            <Card
              title="Campaign Creation Trend"
              subtitle="New campaigns in the last 4 weeks"
              className="h-full min-h-[430px]"
              bodyClassName="flex h-full flex-col"
            >
              <HoverBarChart
                data={analytics.creationTrend}
                valueFormatter={(value) => `${value}`}
                valueLabel="Campaigns"
                secondary
              />
            </Card>

            <Card
              title="Campaign Management"
              subtitle="Fully managed vs normal split"
              className="h-full min-h-[430px]"
              bodyClassName="flex h-full flex-col"
            >
              <CompactManagementCard
                managedCount={analytics.fullyManagedCampaigns.length}
                managedBudget={analytics.fullyManagedBudget}
                normalCount={analytics.normalCampaigns.length}
                normalBudget={analytics.normalCampaignBudget}
              />
            </Card>
          </div>

          <Card
            title="Budget Overview"
            subtitle="Separated budget analytics for managed and normal campaigns"
          >
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <BudgetSplitCard
                title="Fully Managed Campaigns"
                subtitle="Created by Main Admin only"
                total={analytics.fullyManagedBudget}
                campaigns={analytics.fullyManagedCampaigns.length}
                average={
                  analytics.fullyManagedCampaigns.length
                    ? analytics.fullyManagedBudget /
                    analytics.fullyManagedCampaigns.length
                    : 0
                }
                applicants={analytics.fullyManagedCampaigns.reduce(
                  (sum, item) => sum + Number(item.applicantCount || 0),
                  0
                )}
                growth={analytics.fullyManagedBudgetGrowth}
                tone="managed"
              />

              <BudgetSplitCard
                title="Normal Campaigns"
                subtitle="Created by brands, including fully managed brands"
                total={analytics.normalCampaignBudget}
                campaigns={analytics.normalCampaigns.length}
                average={
                  analytics.normalCampaigns.length
                    ? analytics.normalCampaignBudget / analytics.normalCampaigns.length
                    : 0
                }
                applicants={analytics.normalCampaigns.reduce(
                  (sum, item) => sum + Number(item.applicantCount || 0),
                  0
                )}
                growth={analytics.normalBudgetGrowth}
                tone="normal"
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Card
              title="Top Performing Campaigns"
              subtitle="Admin table UI is preserved. Fully managed means Main Admin created the campaign."
              action={
                <Link
                  href={CAMPAIGNS_ROUTE}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  View All
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {sectionErrors.campaigns ? (
                <SectionWarning text={sectionErrors.campaigns} />
              ) : (
                <SimpleTable
                  columns={[
                    "Campaign",
                    "Brand",
                    "Management",
                    "Budget",
                    "Applicants",
                    "Status",
                    "Action",
                  ]}
                  rows={analytics.topCampaigns.map((item) => [
                    <div key={item._id} className="min-w-0">
                      <div className="font-semibold text-slate-900">
                        {getCampaignTitle(item)}
                      </div>
                    </div>,
                    item.brandName || "-",
                    <StatusBadge
                      key={`${item._id}-management`}
                      text={getManagementType(item)}
                      managed={isAdminManagedCampaign(item)}
                      neutral={!isAdminManagedCampaign(item)}
                    />,
                    formatMoney(getCampaignBudgetValue(item)),
                    Number(item.applicantCount || 0),
                    <StatusBadge
                      key={`${item._id}-status`}
                      text={getCampaignStatus(item)}
                    />,
                    <Link
                      key={`${item._id}-action`}
                      href={getCampaignViewHref(item)}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] bg-black px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-black/90"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>,
                  ])}
                  emptyText="No campaign records found."
                  tableClassName="min-w-[1080px]"
                />
              )}
            </Card>

            <Card
              title="Recent Disputes"
              subtitle="Top 4 disputes only"
              action={
                <Link
                  href={DISPUTES_ROUTE}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  View All
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {sectionErrors.disputes ? (
                <SectionWarning text={sectionErrors.disputes} />
              ) : (
                <div className="space-y-3">
                  {analytics.topDisputes.length ? (
                    analytics.topDisputes.map((item) => (
                      <div
                        key={item._id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {item.subject ||
                                item.disputeId ||
                                "Untitled dispute"}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {titleCase(
                                item.createdBy?.role || item.raisedByRole
                              )}{" "}
                              • {formatDate(item.createdAt)}
                            </div>
                          </div>

                          <StatusBadge text={item.status || "Open"} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyText text="No disputes found." />
                  )}
                </div>
              )}
            </Card>
          </div>

          <Card
            title="Live Platform Activity"
            subtitle="Recent campaign and dispute activity"
            action={
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Live
              </span>
            }
          >
            {analytics.activity.length ? (
              <div className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-violet-50/40 p-4">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-200/40 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-200/40 blur-3xl" />

                <div className="relative grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {analytics.activity.map((item, index) => (
                    <ActivityRow key={item.id} item={item} index={index} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyText text="No recent platform activity available." />
            )}
          </Card>
        </section>

        {state.me?.role === "revenue_head" ? (
          <section className="flex flex-col gap-5">
            <SectionHeader
              title="Employees Under You"
              subtitle="BME, IME, and SDR employees working under this Revenue Head"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={<Briefcase className="h-5 w-5" />}
                label="Total Employees"
                value={String(
                  state.employees.all.filter(
                    (employee) => String(employee.status || "").toLowerCase() === "active"
                  ).length
                )}
                helper="Employees under you"
                tone="info"
              />

              <MetricCard
                icon={<Users className="h-5 w-5" />}
                label="BME"
                value={String(
                  state.employees.bme.filter(
                    (employee) => String(employee.status || "").toLowerCase() === "active"
                  ).length
                )}
                helper="Brand management executives"
                tone="managed"
              />

              <MetricCard
                icon={<Users className="h-5 w-5" />}
                label="IME"
                value={String(
                  state.employees.ime.filter(
                    (employee) => String(employee.status || "").toLowerCase() === "active"
                  ).length
                )}
                helper="Influencer management executives"
                tone="success"
              />

              <MetricCard
                icon={<Users className="h-5 w-5" />}
                label="SDR"
                value={String(
                  state.employees.sdr.filter(
                    (employee) => String(employee.status || "").toLowerCase() === "active"
                  ).length
                )}
                helper="Sales development representatives"
                tone="default"
              />
            </div>

            <Card
              title="Employee List"
              subtitle="All employees created by or assigned under this Revenue Head"
              action={
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                  {state.employees.all.filter(
                    (employee) => String(employee.status || "").toLowerCase() === "active"
                  ).length} employees
                </span>
              }
            >
              <EmployeeListTable employees={state.employees.all} />
            </Card>
          </section>
        ) : null}


      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="text-2xl font-bold tracking-tight text-slate-950">
        {title}
      </div>
      <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
    >
      <span className="text-violet-600">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
  tone = "default",
  growth,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "managed" | "success" | "info" | "danger";
  growth?: GrowthMetric;
  href?: string;
}) {
  const cardClassName = cn(
    "rounded-[24px] border bg-white p-4 shadow-sm transition",
    tone === "managed" && "border-violet-200",
    tone === "success" && "border-emerald-200",
    tone === "info" && "border-blue-200",
    tone === "danger" && "border-rose-200",
    tone === "default" && "border-slate-200",
    href && "hover:-translate-y-0.5 hover:shadow-md"
  );

  const growthIcon =
    growth?.direction === "up" ? (
      <TrendingUp className="h-3.5 w-3.5" />
    ) : growth?.direction === "down" ? (
      <TrendingDown className="h-3.5 w-3.5" />
    ) : null;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "inline-flex rounded-2xl p-3",
            tone === "managed" && "bg-violet-50 text-violet-700",
            tone === "success" && "bg-emerald-50 text-emerald-700",
            tone === "info" && "bg-blue-50 text-blue-700",
            tone === "danger" && "bg-rose-50 text-rose-700",
            tone === "default" && "bg-slate-100 text-slate-700"
          )}
        >
          {icon}
        </div>

        {growth ? (
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              growth.direction === "up" && "bg-emerald-50 text-emerald-700",
              growth.direction === "down" && "bg-rose-50 text-rose-700",
              (growth.direction === "flat" || growth.direction === "new") &&
              "bg-slate-100 text-slate-600"
            )}
          >
            {growthIcon}
            {growth.label}
          </div>
        ) : null}
      </div>

      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </div>
      <div className="mt-1 text-sm text-slate-500">{helper}</div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}

function Card({
  title,
  subtitle,
  children,
  action,
  danger = false,
  className,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  danger?: boolean;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border bg-white p-5 shadow-sm sm:p-6",
        danger ? "border-rose-200" : "border-slate-200",
        className
      )}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[28px] font-bold text-slate-950">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

function HealthStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={cn("mt-1 text-2xl font-bold", accent)}>{value}</div>
    </div>
  );
}

function RiskRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "warning";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-sm font-semibold text-slate-800">{label}</div>
      <span
        className={cn(
          "inline-flex min-w-[42px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold",
          tone === "danger"
            ? "bg-rose-500 text-white"
            : "bg-amber-400 text-slate-900"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function BrandAnalyticsCard({
  total,
  active,
  fullyManaged,
  free,
  paid,
  growth,
}: {
  total: number;
  active: number;
  fullyManaged: number;
  free: number;
  paid: number;
  growth: GrowthMetric;
}) {
  const activePercent = total ? (active / total) * 100 : 0;
  const managedPercent = total ? (fullyManaged / total) * 100 : 0;

  return (
    <div className="rounded-[26px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-violet-50/50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-4xl font-bold tracking-tight text-slate-950">
            {total}
          </div>
          <div className="mt-1 text-sm font-medium text-slate-500">
            Total Brands
          </div>
        </div>

        <div className="rounded-3xl border border-violet-100 bg-white p-4 text-violet-700 shadow-sm">
          <LayoutDashboard className="h-8 w-8" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">Active Brands</span>
            <span className="font-bold text-emerald-700">
              {active} ({activePercent.toFixed(0)}%)
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${activePercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">
              Fully Managed Brands
            </span>
            <span className="font-bold text-violet-700">
              {fullyManaged} ({managedPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${managedPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            This Month
          </div>
          <div className="mt-1 text-xl font-bold text-slate-950">
            {growth.current}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Free Plan
          </div>
          <div className="mt-1 text-xl font-bold text-slate-950">{free}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Paid Plan
          </div>
          <div className="mt-1 text-xl font-bold text-slate-950">{paid}</div>
        </div>
      </div>
    </div>
  );
}

function EmployeeListTable({ employees }: { employees: MiniAdminItem[] }) {
  const activeEmployees = employees.filter((employee) => {
    return String(employee.status || "").toLowerCase() === "active";
  });

  if (!activeEmployees.length) {
    return <EmptyText text="No active employees found under this Revenue Head." />;
  }

  return (
    <SimpleTable
      columns={[
        "Employee",
        "Email",
        "Role",
        "Status",
        "Team Type",
        "Proxy Email",
      ]}
      rows={activeEmployees.map((employee) => [
        <div
          key={`${employee.adminId || employee._id}-profile`}
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
            {(employee.name || employee.email || "EM")
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900">
              {employee.name || "Unnamed Employee"}
            </div>
          </div>
        </div>,

        employee.email || "-",

        <StatusBadge
          key={`${employee.adminId || employee._id}-role`}
          text={titleCase(employee.role || "-")}
          neutral
        />,

        <StatusBadge
          key={`${employee.adminId || employee._id}-status`}
          text={titleCase(employee.status || "Pending")}
        />,

        titleCase(employee.teamType || "-"),

        employee.proxyEmail || "-",
      ])}
      emptyText="No active employees found under this Revenue Head."
      tableClassName="min-w-[980px]"
    />
  );
}

function BrandListTable({ brands }: { brands: BrandItem[] }) {
  if (!brands.length) {
    return <EmptyText text="No recent brand signups found." />;
  }

  return (
    <SimpleTable
      columns={[
        "Brand Profile",
        "Name",
        "Email",
        "Proxy Email",
        "Plan",
        "Created",
        "Status",
      ]}
      rows={brands.map((brand) => [
        <div
          key={`${getBrandId(brand)}-profile`}
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
            {brand.profilePic ? (
              <img
                src={brand.profilePic}
                alt={getBrandName(brand)}
                className="h-full w-full object-cover"
              />
            ) : (
              getBrandName(brand).slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900">
              {getBrandName(brand)}
            </div>
            <div className="mt-0.5 truncate text-xs text-slate-500">
              {brand.industry || "-"}
            </div>
          </div>
        </div>,
        getBrandName(brand),
        brand.email || "-",
        brand.proxyEmail || "-",
        <StatusBadge
          key={`${getBrandId(brand)}-plan`}
          text={titleCase(getBrandPlan(brand))}
          neutral
        />,
        formatDate(brand.createdAt),
        <StatusBadge
          key={`${getBrandId(brand)}-status`}
          text={titleCase(brand.status || brand.subscription?.status || "Pending")}
        />,
      ])}
      emptyText="No recent brand signups found."
      tableClassName="min-w-[1080px]"
    />
  );
}

function ReviewQueueThreads({ items }: { items: ReviewQueueItem[] }) {
  if (!items.length) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
          <Inbox className="h-7 w-7" />
        </div>

        <div className="text-sm font-semibold text-slate-700 ">
          Queue is empty.
        </div>

        <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
          New outreach replies waiting for review will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[560px] overflow-y-auto pr-1">
      <div className="space-y-3">
        {items.map((item, index) => {
          const id = getReviewQueueId(item, index);
          const senderName = getReviewQueueSenderName(item);
          const senderEmail = getReviewQueueSenderEmail(item);
          const subject = getReviewQueueSubject(item);
          const preview = getReviewQueuePreview(item);
          const time = getReviewQueueTime(item);
          const href = item.displayUrl || item.url || "";

          const content = (
            <div className="group rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 text-sm font-bold text-blue-700 ring-1 ring-blue-100">
                  {(senderName || senderEmail || "RQ")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-slate-950">
                        {senderName}
                      </div>

                      <div className="mt-0.5 truncate text-xs font-medium text-slate-500">
                        {senderEmail || item.brandName || item.campaignName || "-"}
                      </div>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                      <Clock3 className="h-3 w-3" />
                      {formatDateTime(time)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-start gap-2">
                    <div className="mt-0.5 rounded-lg bg-blue-50 p-1.5 text-blue-700">
                      <MessageSquareText className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="line-clamp-1 text-sm font-semibold text-slate-900">
                        {subject}
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {preview}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {item.campaignName ? (
                      <StatusBadge text={item.campaignName} neutral />
                    ) : null}

                    {item.brandName ? (
                      <StatusBadge text={item.brandName} neutral />
                    ) : null}

                    <StatusBadge text={titleCase(item.status || "Pending")} />
                  </div>
                </div>
              </div>
            </div>
          );

          if (href) {
            return (
              <Link key={id} href={href}>
                {content}
              </Link>
            );
          }

          return <div key={id}>{content}</div>;
        })}
      </div>
    </div>
  );
}

function InfluencerOnboardingCard({
  total,
  active,
  pending,
  followers,
  appliedCampaigns,
}: {
  total: number;
  active: number;
  pending: number;
  followers: number;
  appliedCampaigns: number;
}) {
  const activePercent = total ? (active / total) * 100 : 0;
  const pendingPercent = total ? (pending / total) * 100 : 0;

  return (
    <div className="rounded-[26px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-4xl font-bold tracking-tight text-slate-950">
            {total}
          </div>
          <div className="mt-1 text-sm font-medium text-slate-500">
            Total Influencers
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-4 text-blue-700 shadow-sm">
          <Users className="h-8 w-8" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">
              Active Onboarding
            </span>
            <span className="font-bold text-emerald-700">
              {active} ({activePercent.toFixed(0)}%)
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${activePercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">
              Pending Onboarding
            </span>
            <span className="font-bold text-amber-700">
              {pending} ({pendingPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-amber-400"
              style={{ width: `${pendingPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Followers
          </div>
          <div className="mt-1 text-xl font-bold text-slate-950">
            {formatCompactNumber(followers)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Applied Campaigns
          </div>
          <div className="mt-1 text-xl font-bold text-slate-950">
            {appliedCampaigns}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentInfluencerList({
  influencers,
}: {
  influencers: InfluencerItem[];
}) {
  if (!influencers.length) {
    return <EmptyText text="No recent influencer signups found." />;
  }

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 p-4">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-violet-200/40 blur-3xl" />

      <div className="relative space-y-3">
        {influencers.map((influencer, index) => {
          const profile = getInfluencerPrimaryProfile(influencer);
          const onboarded = isInfluencerOnboarded(influencer);

          return (
            <Link
              key={getInfluencerId(influencer)}
              href={INFLUENCERS_ROUTE}
              className="group flex items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
                  {profile?.picture ? (
                    <img
                      src={profile.picture}
                      alt={influencer.name || "Influencer"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (influencer.name || "IN").slice(0, 2).toUpperCase()
                  )}

                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[10px] font-bold text-white">
                    {index + 1}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-950">
                    {influencer.name || "Unnamed Influencer"}
                  </div>

                  <div className="mt-0.5 truncate text-xs font-medium text-slate-500">
                    {influencer.email || influencer.proxyEmail || "-"}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge
                      text={onboarded ? "Active Influencer" : "Pending Influencer"}
                    />
                    <StatusBadge
                      text={titleCase(
                        influencer.primaryPlatform ||
                        profile?.provider ||
                        "Platform"
                      )}
                      neutral
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-600">
                  {formatDate(influencer.createdAt)}
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-400">
                  {formatCompactNumber(getInfluencerFollowers(influencer))} followers
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function InfluencerAppliedCampaigns({
  influencers,
  lookup,
}: {
  influencers: InfluencerItem[];
  lookup: InfluencerCampaignLookup;
}) {
  if (!influencers.length) {
    return <EmptyText text="No influencers found." />;
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {influencers.map((influencer) => {
        const influencerId = getInfluencerId(influencer);
        const profile = getInfluencerPrimaryProfile(influencer);
        const applied = getInfluencerLookupEntry(influencer, lookup);
        const campaigns = applied?.campaigns || [];
        const total = Number(applied?.total || campaigns.length || 0);
        const onboarded = isInfluencerOnboarded(influencer);

        return (
          <div
            key={influencerId}
            className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-sm font-bold text-slate-700">
                  {profile?.picture ? (
                    <img
                      src={profile.picture}
                      alt={influencer.name || "Influencer"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (influencer.name || "IN").slice(0, 2).toUpperCase()
                  )}
                </div>

                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-950">
                    {influencer.name || "Unnamed Influencer"}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {influencer.email || influencer.proxyEmail || "-"}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge
                      text={onboarded ? "Active Influencer" : "Pending Influencer"}
                    />
                    <StatusBadge
                      text={titleCase(
                        influencer.primaryPlatform ||
                        profile?.provider ||
                        "Platform"
                      )}
                      neutral
                    />
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                  {total} applied
                </div>

                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                  {formatCompactNumber(getInfluencerFollowers(influencer))} followers
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {campaigns.length ? (
                campaigns.slice(0, 3).map((campaign) => (
                  <Link
                    key={campaign.campaignId || campaign._id}
                    href={`/admin/campaigns/view?id=${campaign.campaignId || campaign._id
                      }`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {campaign.campaignName ||
                          campaign.name ||
                          "Untitled Campaign"}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {campaign.brandName || "Unknown Brand"} • Applied{" "}
                        {formatDate(campaign.appliedDate)}
                      </div>
                    </div>

                    <StatusBadge text={titleCase(campaign.status || "Applied")} />
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  No applied campaigns found for this influencer.
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getChartMax(data: ChartDatum[]) {
  const rawMax = Math.max(...data.map((item) => Number(item.value || 0)), 0);

  if (rawMax <= 0) return 1;

  const power = Math.pow(10, Math.floor(Math.log10(rawMax)));
  return Math.ceil(rawMax / power) * power;
}

function getChartTicks(max: number, count = 4) {
  const safeMax = Math.max(Number(max || 0), 1);

  if (safeMax <= count) {
    return Array.from({ length: Math.floor(safeMax) + 1 }, (_, index) => index);
  }

  const ticks = Array.from({ length: count + 1 }, (_, index) => {
    return Math.round((safeMax / count) * index);
  });

  return Array.from(new Set([0, ...ticks, safeMax])).sort((a, b) => a - b);
}

function LineTrendChart({
  data,
  valueFormatter,
  valueLabel,
}: {
  data: ChartDatum[];
  valueFormatter: (value: number) => string;
  valueLabel: string;
}) {
  const width = 620;
  const height = 290;
  const margin = {
    top: 22,
    right: 22,
    bottom: 38,
    left: 68,
  };

  const chartMax = getChartMax(data);
  const ticks = getChartTicks(chartMax);
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getX = (index: number) => {
    if (data.length <= 1) return margin.left + plotWidth / 2;
    return margin.left + (index * plotWidth) / (data.length - 1);
  };

  const getY = (value: number) => {
    return margin.top + plotHeight - (Number(value || 0) / chartMax) * plotHeight;
  };

  const points = data.map((item, index) => ({
    ...item,
    x: getX(index),
    y: getY(item.value),
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${margin.top + plotHeight
      } L ${points[0].x} ${margin.top + plotHeight} Z`
      : "";

  const hoveredPoint =
    hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  return (
    <div className="relative h-[290px] w-full overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 px-3 py-3">
      {hoveredPoint ? (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium text-white shadow-lg"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${Math.max((hoveredPoint.y / height) * 100 - 16, 4)}%`,
          }}
        >
          <div className="font-semibold">{hoveredPoint.label}</div>
          <div>
            {valueLabel}: {valueFormatter(hoveredPoint.value)}
          </div>
        </div>
      ) : null}

      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
        {ticks.map((tick, tickIndex) => {
          const y = getY(tick);

          return (
            <g key={`line-tick-${tickIndex}-${tick}`}>
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={y}
                y2={y}
                stroke="#dbe2ea"
                strokeDasharray="4 4"
              />
              <text
                x={margin.left - 12}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#64748b"
                fontWeight="600"
              >
                {valueFormatter(tick)}
              </text>
            </g>
          );
        })}

        <line
          x1={margin.left}
          x2={margin.left}
          y1={margin.top}
          y2={margin.top + plotHeight}
          stroke="#cbd5e1"
        />
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={margin.top + plotHeight}
          y2={margin.top + plotHeight}
          stroke="#cbd5e1"
        />

        {areaPath ? <path d={areaPath} fill="rgba(124,58,237,0.12)" /> : null}

        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="#7c3aed"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {points.map((point, index) => (
          <g key={`line-point-${index}-${point.label}`}>
            <circle cx={point.x} cy={point.y} r="5" fill="#7c3aed" />
            <circle
              cx={point.x}
              cy={point.y}
              r="18"
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            <text
              x={point.x}
              y={height - 12}
              textAnchor="middle"
              fontSize="12"
              fill="#475569"
              fontWeight="600"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function HoverBarChart({
  data,
  valueFormatter,
  valueLabel,
  secondary = false,
}: {
  data: ChartDatum[];
  valueFormatter: (value: number) => string;
  valueLabel: string;
  secondary?: boolean;
}) {
  const width = 620;
  const height = 290;
  const margin = {
    top: 22,
    right: 22,
    bottom: 38,
    left: 64,
  };

  const chartMax = getChartMax(data);
  const ticks = getChartTicks(chartMax);
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const barSlot = plotWidth / Math.max(data.length, 1);
  const barWidth = Math.min(72, barSlot * 0.55);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getY = (value: number) => {
    return margin.top + plotHeight - (Number(value || 0) / chartMax) * plotHeight;
  };

  const bars = data.map((item, index) => {
    const x = margin.left + index * barSlot + (barSlot - barWidth) / 2;
    const y = getY(item.value);
    const barHeight = margin.top + plotHeight - y;

    return {
      ...item,
      x,
      y,
      width: barWidth,
      height: Math.max(barHeight, item.value > 0 ? 8 : 3),
      centerX: x + barWidth / 2,
    };
  });

  const hoveredBar =
    hoveredIndex !== null && bars[hoveredIndex] ? bars[hoveredIndex] : null;

  return (
    <div className="relative h-[290px] w-full overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 px-3 py-3">
      {hoveredBar ? (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium text-white shadow-lg"
          style={{
            left: `${(hoveredBar.centerX / width) * 100}%`,
            top: `${Math.max((hoveredBar.y / height) * 100 - 16, 4)}%`,
          }}
        >
          <div className="font-semibold">{hoveredBar.label}</div>
          <div>
            {valueLabel}: {valueFormatter(hoveredBar.value)}
          </div>
        </div>
      ) : null}

      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
        {ticks.map((tick, tickIndex) => {
          const y = getY(tick);

          return (
            <g key={`bar-tick-${tickIndex}-${tick}`}>
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={y}
                y2={y}
                stroke="#dbe2ea"
                strokeDasharray="4 4"
              />
              <text
                x={margin.left - 12}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#64748b"
                fontWeight="600"
              >
                {valueFormatter(tick)}
              </text>
            </g>
          );
        })}

        <line
          x1={margin.left}
          x2={margin.left}
          y1={margin.top}
          y2={margin.top + plotHeight}
          stroke="#cbd5e1"
        />
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={margin.top + plotHeight}
          y2={margin.top + plotHeight}
          stroke="#cbd5e1"
        />

        {bars.map((bar, index) => (
          <g key={`bar-${index}-${bar.label}`}>
            <defs>
              <linearGradient
                id={`bar-gradient-${index}`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={secondary ? "#60a5fa" : "#a78bfa"}
                />
                <stop
                  offset="100%"
                  stopColor={secondary ? "#2563eb" : "#7c3aed"}
                />
              </linearGradient>
            </defs>

            <rect
              x={bar.x}
              y={margin.top + plotHeight - bar.height}
              width={bar.width}
              height={bar.height}
              rx="14"
              fill={`url(#bar-gradient-${index})`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="transition-opacity duration-200"
              opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.55}
            />

            <rect
              x={bar.x - 8}
              y={margin.top}
              width={bar.width + 16}
              height={plotHeight}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />

            <text
              x={bar.centerX}
              y={height - 12}
              textAnchor="middle"
              fontSize="12"
              fill="#475569"
              fontWeight="600"
            >
              {bar.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function CompactManagementCard({
  managedCount,
  managedBudget,
  normalCount,
  normalBudget,
}: {
  managedCount: number;
  managedBudget: number;
  normalCount: number;
  normalBudget: number;
}) {
  const total = managedCount + normalCount;
  const managedPct = total ? (managedCount / total) * 100 : 0;
  const normalPct = total ? (normalCount / total) * 100 : 0;

  return (
    <div className="flex h-[290px] flex-col justify-between rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <ManagementDonut
        managed={{
          label: "Fully Managed",
          value: managedCount,
          percent: managedPct,
          budget: managedBudget,
        }}
        normal={{
          label: "Normal Campaign",
          value: normalCount,
          percent: normalPct,
          budget: normalBudget,
        }}
      />
    </div>
  );
}

function ManagementDonut({
  managed,
  normal,
}: {
  managed: { label: string; value: number; percent: number; budget: number };
  normal: { label: string; value: number; percent: number; budget: number };
}) {
  const total = managed.value + normal.value;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const managedLength = total ? (managed.value / total) * circumference : 0;
  const normalLength = circumference - managedLength;
  const [hovered, setHovered] = useState<"managed" | "normal" | null>(null);

  const active =
    hovered === "managed" ? managed : hovered === "normal" ? normal : null;

  return (
    <div className="grid h-full grid-cols-1 gap-4">
      <div className="relative flex flex-col items-center justify-center gap-3">
        <div className="relative h-[150px] w-[150px]">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#e7ebf3"
              strokeWidth="18"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#7c3aed"
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={`${managedLength} ${circumference}`}
              onMouseEnter={() => setHovered("managed")}
              onMouseLeave={() => setHovered(null)}
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={`${normalLength} ${circumference}`}
              strokeDashoffset={-managedLength}
              onMouseEnter={() => setHovered("normal")}
              onMouseLeave={() => setHovered(null)}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-3xl font-bold tracking-tight text-slate-950">
              {total}
            </div>
            <div className="text-xs font-medium text-slate-500">Total</div>
          </div>

          {active ? (
            <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-xl bg-slate-950 px-3 py-2 text-center text-xs text-white shadow-lg">
              <div className="font-semibold">{active.label}</div>
              <div>{active.value} campaigns</div>
              <div>{active.percent.toFixed(1)}%</div>
              <div>{formatMoney(active.budget)}</div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <DonutLegendButton
          colorClass="bg-violet-600"
          label={managed.label}
          value={managed.value}
          percent={managed.percent}
          onEnter={() => setHovered("managed")}
          onLeave={() => setHovered(null)}
        />
        <DonutLegendButton
          colorClass="bg-blue-500"
          label={normal.label}
          value={normal.value}
          percent={normal.percent}
          onEnter={() => setHovered("normal")}
          onLeave={() => setHovered(null)}
        />
      </div>
    </div>
  );
}

function DonutLegendButton({
  colorClass,
  label,
  value,
  percent,
  onEnter,
  onLeave,
}: {
  colorClass: string;
  label: string;
  value: number;
  percent: number;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-left shadow-sm outline-none"
      title={`${label}: ${value} campaigns (${percent.toFixed(1)}%)`}
      aria-label={`${label}: ${value} campaigns (${percent.toFixed(1)}%)`}
    >
      <div className="flex items-center gap-3">
        <span className={cn("h-3 w-3 rounded-full", colorClass)} />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-950">
        {value} ({percent.toFixed(0)}%)
      </span>
    </button>
  );
}

function BudgetSplitCard({
  title,
  subtitle,
  total,
  campaigns,
  average,
  applicants,
  growth,
  tone,
}: {
  title: string;
  subtitle: string;
  total: number;
  campaigns: number;
  average: number;
  applicants: number;
  growth: GrowthMetric;
  tone: "managed" | "normal";
}) {
  return (
    <div
      className={cn(
        "rounded-[26px] border p-4",
        tone === "managed"
          ? "border-violet-200 bg-violet-50/60"
          : "border-blue-200 bg-blue-50/60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-slate-950">{title}</div>
          <p className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</p>
        </div>
        <GrowthPill growth={growth} tone={tone} />
      </div>

      <div className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
        {formatMoney(total)}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <BudgetMetric label="Campaigns" value={campaigns} />
        <BudgetMetric label="Average" value={formatMoney(average)} />
        <BudgetMetric label="Applicants" value={applicants} />
      </div>
    </div>
  );
}

function GrowthPill({
  growth,
  tone,
}: {
  growth: GrowthMetric;
  tone: "managed" | "normal";
}) {
  const icon =
    growth.direction === "up" ? (
      <TrendingUp className="h-3.5 w-3.5" />
    ) : growth.direction === "down" ? (
      <TrendingDown className="h-3.5 w-3.5" />
    ) : null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold",
        growth.direction === "up" &&
        (tone === "managed"
          ? "bg-violet-600 text-white"
          : "bg-blue-600 text-white"),
        growth.direction === "down" && "bg-rose-600 text-white",
        (growth.direction === "flat" || growth.direction === "new") &&
        (tone === "managed"
          ? "bg-violet-600 text-white"
          : "bg-blue-600 text-white")
      )}
    >
      {icon}
      {growth.label}
    </div>
  );
}

function BudgetMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-3 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-slate-950">{value}</div>
    </div>
  );
}

function ActivityRow({
  item,
  index,
}: {
  item: ActivityItem;
  index: number;
}) {
  const isCampaign = item.tone === "campaign";
  const isDispute = item.tone === "dispute";

  const icon = isCampaign ? (
    <FolderKanban className="h-4 w-4" />
  ) : isDispute ? (
    <ShieldAlert className="h-4 w-4" />
  ) : (
    <CircleDollarSign className="h-4 w-4" />
  );

  const toneClass = isCampaign
    ? {
      icon: "bg-blue-50 text-blue-700 ring-blue-100",
      line: "from-blue-500 to-blue-300",
      badge: "bg-blue-50 text-blue-700 ring-blue-100",
      label: "Campaign",
    }
    : isDispute
      ? {
        icon: "bg-rose-50 text-rose-700 ring-rose-100",
        line: "from-rose-500 to-orange-300",
        badge: "bg-rose-50 text-rose-700 ring-rose-100",
        label: "Dispute",
      }
      : {
        icon: "bg-violet-50 text-violet-700 ring-violet-100",
        line: "from-violet-500 to-purple-300",
        badge: "bg-violet-50 text-violet-700 ring-violet-100",
        label: "Budget",
      };

  return (
    <Link
      href={item.href}
      className="group relative block overflow-hidden rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1 bg-gradient-to-b",
          toneClass.line
        )}
      />

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 transition group-hover:scale-105",
            toneClass.icon
          )}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1",
                toneClass.badge
              )}
            >
              {toneClass.label}
            </span>

            <span className="text-xs font-semibold text-slate-400">
              #{String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <div className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-slate-950">
            {item.title}
          </div>

          <div className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
            {item.subtitle}
          </div>
        </div>

        <div className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-500">
          {item.time}
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({
  text,
  managed = false,
  neutral = false,
}: {
  text: string;
  managed?: boolean;
  neutral?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        managed && "bg-violet-50 text-violet-700 ring-violet-200",
        neutral && !managed && "bg-blue-50 text-blue-700 ring-blue-200",
        !managed && !neutral && getStatusTone(text)
      )}
    >
      {text}
    </span>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function SectionWarning({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
      {text}
    </div>
  );
}

function SimpleTable({
  columns,
  rows,
  emptyText,
  tableClassName,
}: {
  columns: string[];
  rows: Array<Array<string | number | React.ReactNode>>;
  emptyText: string;
  tableClassName?: string;
}) {
  const tableRows = useMemo<DashboardTableRow[]>(
    () =>
      rows.map((row, rowIndex) => ({
        id: String(rowIndex),
        cells: row,
      })),
    [rows]
  );

  const tableColumns = useMemo<AdminTableColumn<DashboardTableRow>[]>(
    () =>
      columns.map((column, columnIndex) => ({
        id: `${column}-${columnIndex}`,
        header: column,
        widthClassName:
          columnIndex === 0
            ? "min-w-[260px]"
            : column.toLowerCase() === "action"
              ? "min-w-[130px]"
              : "min-w-[140px]",
        render: (row) => {
          const cell = row.cells[columnIndex];

          return (
            <span className="text-sm text-slate-700">
              {cell === null || cell === undefined || cell === "" ? "-" : cell}
            </span>
          );
        },
      })),
    [columns]
  );

  return (
    <AdminTable<DashboardTableRow>
      data={tableRows}
      columns={tableColumns}
      rowKey={(row) => row.id}
      loading={false}
      loadingRows={5}
      emptyTitle={emptyText}
      emptyDescription="No records are available for this section."
      tableClassName={tableClassName || "min-w-[920px]"}
      headerRowClassName="bg-slate-50/90"
      className="py-1"
    />
  );
} 