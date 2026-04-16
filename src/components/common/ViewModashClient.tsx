"use client";

import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Loader } from "@/components/ui/loader";
import api from "@/lib/api";
import {
  apiGetContractedCampaigns,
  apiGetfetchMediaKit,
} from "@/app/influencer/services/influencerApi";
import { AuditTrailTable } from "./AuditTrailTable";
import { AudienceIntelligenceCard } from "./AudienceIntelligenceCard";
import { CampaignHighlightsCard } from "./CampaignHighlightsCard";
import { ContactManagementCard } from "./ContactManagementCard";
import { CreatorHeader } from "./CreatorHeader";
import { DashboardTopBar } from "./DashboardTopBar";
import { FeatureLockedCard } from "./FeatureLockedCard";
import { LookalikeCreatorsPanel } from "./LookalikeCreatorsPanel";
import { MetricsGrid } from "./MetricsGrid";
import { PerformanceTrendCard } from "./PerformanceTrendCard";
import { PopularContentPanel } from "./PopularContentPanel";
import { RecentPostsTable } from "./RecentPostsTable";
import { RiskComplianceCard } from "./RiskComplienceCard";
import { PastCollaborationsTable } from "./PastCollaborations";

export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise";
export type UserRole = "admin" | "manager" | "creator" | "viewer";
export type SupportedPlatform = "instagram" | "tiktok" | "youtube";

export type SectionKey =
  | "contactManagement"
  | "riskCompliance"
  | "metricGrid"
  | "performanceTrend"
  | "campaignHighlights"
  | "audienceIntelligence"
  | "recentPosts"
  | "popularContent"
  | "lookalikeCreators"
  | "auditTrail";

export interface SocialPost {
  likes?: number | string;
  views?: number | string;
  text?: string;
  type?: string;
  url?: string;
  image?: string;
  thumbnail?: string;
  sponsors?: Array<{ name?: string }>;
  createdAt?: string;
  publishedAt?: string;
  postedAt?: string;
  date?: string;
  created?: string;
  plays?: number;
  comments?: number;
}

export interface AudienceAge {
  code: string;
  weight: number;
}

export interface AudienceGender {
  code: string;
  weight: number;
}

export interface AudienceCountry {
  name: string;
  weight: number;
}

export interface ModashStatHistory {
  month: string;
  followers: number;
  avgLikes: number;
  following: number;
  avgComments: number;
  avgViews: number;
}

export interface ModashLookalike {
  userId: string;
  username: string;
  picture?: string;
  fullname?: string;
  url?: string;
  followers: number;
  engagements: number;
  isVerified?: boolean;
}

export interface InfluencerReport {
  modashId?: string;
  _id?: string;
  provider?: string;
  url?: string;
  name?: string;
  fullname?: string;
  picture?: string;
  bio?: string;
  username?: string;
  handle?: string;
  followers?: number | string;
  subscribers?: number | string;
  engagementRate?: number | string;
  country?: string;
  language?: { name?: string };
  hashtags?: Array<{ tag: string }>;
  popularPosts?: SocialPost[];
  recentPosts?: SocialPost[];
  sponsoredPosts?: SocialPost[];
  stats?: {
    avgLikes?: { value?: number | string; compared?: number | string };
    avgViews?: { value?: number | string; compared?: number | string };
    avgComments?: { value?: number | string; compared?: number | string };
    followers?: { value?: number | string; compared?: number | string };
    paidPostPerformance?: number | string;
  };
  avgLikes?: number | string;
  avgComments?: number | string;
  avgViews?: number | string;
  avgReelsPlays?: number | string;
  audience?: {
    geoCountries?: AudienceCountry[];
    ages?: AudienceAge[];
    genders?: AudienceGender[];
    languages?: Array<{ code: string; weight: number }>;
    interests?: Array<{ name: string; weight: number }>;
    credibility?: number;
  };
  isPrivate?: boolean;
  isVerified?: boolean;
  accountType?: string;
  postsCount?: number;
  statHistory?: ModashStatHistory[];
  lookalikes?: ModashLookalike[];
  followersRange?: { leftNumber?: number; rightNumber?: number };
}

export interface ModashPost {
  id?: string;
  text?: string;
  url?: string;
  created?: string;
  type?: string;
  likes?: number;
  comments?: number;
  plays?: number;
  thumbnail?: string;
  image?: string;
  mentions?: string[];
  hashtags?: string[];
  sponsors?: Array<{
    user_id?: string;
    username?: string;
    name?: string;
    logo_url?: string;
    domain?: string;
  }>;
}

export interface ModashReport {
  userId: string;
  profile: {
    fullname?: string;
    username?: string;
    url?: string;
    picture?: string;
    followers?: number;
    engagementRate?: number;
    engagements?: number;
    avgLikes?: number;
    avgComments?: number;
    averageViews?: number;
    averageShares?: number;
    averageSaves?: number;
    postsCount?: number;
    recentPosts?: null;
    popularPosts?: null;
  };
  isPrivate?: boolean;
  isVerified?: boolean;
  language?: { code?: string; name?: string };
  contacts?: unknown[];
  accountType?: string;
  postsCount?: number;
  avgReelsPlays?: number;
  bio?: string;
  country?: string;
  gender?: string;
  ageGroup?: string;
  totalLikes?: number;
  avgComments?: number;
  avgLikes?: number;
  interests?: Array<{ name?: string; weight?: number }>;
  mentions?: Array<{ tag?: string; weight?: number }>;
  hashtags?: Array<{ tag: string; weight: number }>;
  lookalikes?: ModashLookalike[];
  stats?: {
    avgLikes?: { value?: number; compared?: number };
    avgShares?: { value?: number; compared?: number };
    avgComments?: { value?: number; compared?: number };
    followers?: { value?: number; compared?: number };
  };
  audience?: {
    languages?: Array<{ code?: string; name?: string; weight?: number }>;
    genders?: Array<{ code?: string; weight?: number }>;
    geoCountries?: Array<{ name?: string; code?: string; weight?: number }>;
    geoCities?: Array<{ name?: string; weight?: number; country?: string }>;
    ages?: Array<{ code?: string; weight?: number }>;
    gendersPerAge?: Array<{
      code?: string;
      male?: number;
      female?: number;
    }>;
    credibility?: number;
    notable?: number;
    interests?: Array<{ name?: string; weight?: number }>;
    brandAffinity?: Array<{ name?: string; weight?: number }>;
    audienceTypes?: Array<{ code?: string; weight?: number }>;
    audienceReachability?: Array<{ code?: string; weight?: number }>;
    notableUsers?: ModashLookalike[];
  };
  popularPosts?: ModashPost[];
  recentPosts?: ModashPost[];
  sponsoredPosts?: ModashPost[];
  statHistory?: ModashStatHistory[];
  sponsoredPostsMedianLikes?: number;
}

export interface ModashApiResponse {
  error: boolean;
  profile: ModashReport;
  _lastFetchedAt: string;
}

export interface ReviewData {
  name?: string;
  role?: string;
  text?: string;
  image?: string;
  rating?: number;
}

export interface MediaKit {
  _id?: string;
  mediaKitId?: string;
  influencerId?: string;
  primaryPlatform?: string | null;
  primaryInfluencerReport?: InfluencerReport;
  influencerReports?: InfluencerReport[];
  socialProfiles?: InfluencerReport[];
  name?: string;
  country?: string;
  languages?: Array<{ name?: string }>;
  email?: string;
  phone?: string;
  additionalNotes?: string;
  reviews?: ReviewData[];
  updatedAt?: string;
}

export interface RawMediaKitApiResponse {
  mediaKitId?: string;
  mediaKit?: Record<string, unknown>;
  data?: { mediaKit?: Record<string, unknown> };
}

export interface CampaignRow {
  _id?: string;
  company: string;
  brief: string;
  rate: string;
  status: string;
  payout: string;
  raw?: unknown;
  category?: string;
}

export interface DashboardMetric {
  key: string;
  label: string;
  value: string;
  delta?: string;
}

export interface CampaignHighlight {
  label: string;
  value: string;
  meta: string;
  tone?: "default" | "accent";
}

export interface LookalikeCreator {
  id: string;
  name: string;
  handle: string;
  followers: string;
  engagement: string;
  avatar?: string;
  url?: string;
}

export interface AuditItem {
  id: string;
  date: string;
  action: string;
  actor: string;
  status: string;
}

const PLAN_SECTION_ACCESS: Record<SubscriptionPlan, SectionKey[]> = {
  free: ["contactManagement", "metricGrid", "recentPosts"],
  starter: [
    "contactManagement",
    "riskCompliance",
    "metricGrid",
    "performanceTrend",
    "recentPosts",
    "popularContent",
  ],
  pro: [
    "contactManagement",
    "riskCompliance",
    "metricGrid",
    "performanceTrend",
    "campaignHighlights",
    "audienceIntelligence",
    "recentPosts",
    "popularContent",
    "lookalikeCreators",
  ],
  enterprise: [
    "contactManagement",
    "riskCompliance",
    "metricGrid",
    "performanceTrend",
    "campaignHighlights",
    "audienceIntelligence",
    "recentPosts",
    "popularContent",
    "lookalikeCreators",
    "auditTrail",
  ],
};

const ROLE_SECTION_ACCESS: Record<UserRole, SectionKey[]> = {
  admin: [
    "contactManagement",
    "riskCompliance",
    "metricGrid",
    "performanceTrend",
    "campaignHighlights",
    "audienceIntelligence",
    "recentPosts",
    "popularContent",
    "lookalikeCreators",
    "auditTrail",
  ],
  manager: [
    "contactManagement",
    "riskCompliance",
    "metricGrid",
    "performanceTrend",
    "campaignHighlights",
    "audienceIntelligence",
    "recentPosts",
    "popularContent",
    "lookalikeCreators",
  ],
  creator: [
    "contactManagement",
    "metricGrid",
    "performanceTrend",
    "campaignHighlights",
    "audienceIntelligence",
    "recentPosts",
    "popularContent",
  ],
  viewer: ["contactManagement", "metricGrid", "recentPosts"],
};

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

export function formatCompactNumber(
  value: number | string | null | undefined
): string {
  if (value === undefined || value === null || value === "") return "—";
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isNaN(Number(value))
  ) {
    return value;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return `${Math.round(num)}`;
}

export function formatPercent(
  value: number | string | null | undefined,
  multiplyBy100 = false
): string {
  if (value === undefined || value === null || value === "") return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return typeof value === "string" ? value : "—";
  const finalValue = multiplyBy100 ? num * 100 : num;
  return `${finalValue.toFixed(1)}%`;
}

export function normaliseTrend(
  source: Array<number | string>,
  points = 12
): number[] {
  const numeric = source.map((item) => toNumber(item)).filter((item) => item >= 0);
  if (!numeric.length) return Array.from({ length: points }, () => 0);
  if (numeric.length >= points) return numeric.slice(-points);
  const fallback = Math.max(average(numeric), numeric[numeric.length - 1] || 0);
  const pad = Array.from({ length: points - numeric.length }, () => fallback);
  return [...pad, ...numeric];
}

export function getSubscriptionPlan(): SubscriptionPlan {
  if (typeof window === "undefined") return "pro";
  const rawPlan =
    localStorage.getItem("creatorSubscriptionPlan") ||
    localStorage.getItem("subscriptionPlan") ||
    localStorage.getItem("plan") ||
    "pro";
  const normalized = rawPlan.toLowerCase();
  if (normalized.includes("enterprise")) return "enterprise";
  if (normalized.includes("pro") || normalized.includes("premium")) return "pro";
  if (normalized.includes("starter") || normalized.includes("basic")) return "starter";
  return "free";
}

export function getUserRole(): UserRole {
  if (typeof window === "undefined") return "viewer";
  const rawRole =
    localStorage.getItem("role") ||
    localStorage.getItem("userRole") ||
    localStorage.getItem("accountRole") ||
    localStorage.getItem("userType") ||
    "viewer";

  const normalized = rawRole.toLowerCase();
  if (normalized.includes("admin")) return "admin";
  if (normalized.includes("manager")) return "manager";
  if (normalized.includes("creator") || normalized.includes("influencer")) {
    return "creator";
  }
  return "viewer";
}

export function canAccessSection(
  role: UserRole,
  plan: SubscriptionPlan,
  section: SectionKey
): boolean {
  return (
    ROLE_SECTION_ACCESS[role].includes(section) &&
    PLAN_SECTION_ACCESS[plan].includes(section)
  );
}

export function getPrimaryValue(report?: InfluencerReport | null): number {
  return toNumber(report?.followers ?? report?.subscribers ?? 0);
}

export function stripHandlePrefix(value?: string | null): string | undefined {
  if (!value) return undefined;
  return value.replace(/^@/, "").trim() || undefined;
}

function inferPlatformFromUrl(
  url?: string,
  fallback: SupportedPlatform = "instagram"
): SupportedPlatform {
  const lower = String(url ?? "").toLowerCase();
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("instagram.com")) return "instagram";
  return fallback;
}

function normalisePlatform(raw?: string | null): SupportedPlatform {
  const value = String(raw ?? "").toLowerCase();
  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("youtube")) return "youtube";
  return "instagram";
}
export function pickPostImage(post: any): string | undefined {
  const candidates = [
    post?.image,
    post?.thumbnail,
    post?.cover,
    post?.poster,
    post?.previewImage,
    post?.preview_image,
    post?.preview,
    post?.displayUrl,
    post?.display_url,
    post?.imageUrl,
    post?.image_url,
    post?.thumbnailUrl,
    post?.thumbnail_url,
    post?.mediaUrl,
    post?.media_url,
    post?.video?.thumbnail,
    post?.video?.cover,
    post?.video?.poster,
    post?.media?.[0]?.thumbnail,
    post?.media?.[0]?.url,
    post?.attachments?.[0]?.thumbnail,
    post?.attachments?.[0]?.url,
  ];

  return candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0
  );
}

export function enrichPostImages(
  posts: SocialPost[],
  fallbackPosts: SocialPost[] = []
): SocialPost[] {
  const byUrl = new Map<string, SocialPost>();
  const byText = new Map<string, SocialPost>();

  for (const item of fallbackPosts) {
    if (item?.url) byUrl.set(item.url, item);
    if (item?.text) byText.set(item.text.trim().toLowerCase(), item);
  }

  return posts.map((post) => {
    if (post?.image || post?.thumbnail) return post;

    const match =
      (post?.url ? byUrl.get(post.url) : undefined) ||
      (post?.text ? byText.get(post.text.trim().toLowerCase()) : undefined);

    if (!match) return post;

    return {
      ...post,
      image: post.image ?? match.image ?? match.thumbnail,
      thumbnail: post.thumbnail ?? match.thumbnail ?? match.image,
    };
  });
}
function mapMediaKitPost(post: Record<string, any>): SocialPost {
  const resolvedImage = pickPostImage(post);

  return {
    text: post?.text ?? post?.title,
    type: post?.type,
    image: resolvedImage,
    thumbnail: resolvedImage,
    url: post?.url,
    likes: post?.likes,
    views: post?.views ?? post?.plays ?? post?.likes,
    sponsors: Array.isArray(post?.sponsors)
      ? post.sponsors.map((s: Record<string, any>) => ({
        name: s?.name ?? s?.username,
      }))
      : [],
    createdAt: post?.created ?? post?.createdAt,
    publishedAt: post?.created ?? post?.createdAt,
    postedAt: post?.created ?? post?.createdAt,
    date: post?.created ?? post?.createdAt,
    created: post?.created ?? post?.createdAt,
    plays: post?.plays,
    comments: post?.comments,
  };
}
function mapModashPost(post: ModashPost): SocialPost {
  const resolvedImage = pickPostImage(post);

  return {
    text: post.text,
    type: post.type,
    url: post.url,
    image: resolvedImage,
    thumbnail: resolvedImage,
    likes: post.likes,
    views: post.plays ?? post.likes,
    plays: post.plays,
    comments: post.comments,
    sponsors: post.sponsors?.map((s) => ({ name: s.name })),
    createdAt: post.created,
    publishedAt: post.created,
    postedAt: post.created,
    date: post.created,
    created: post.created,
  };
}
function toNormalizedPosts(input: unknown): SocialPost[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((post: any) => {
      const resolvedImage = pickPostImage(post);

      return {
        text: post?.text ?? post?.caption ?? post?.title,
        type: post?.type,
        url: post?.url,
        image: resolvedImage,
        thumbnail: resolvedImage,
        likes: post?.likes,
        views: post?.views ?? post?.plays,
        plays: post?.plays,
        comments: post?.comments,
        sponsors: Array.isArray(post?.sponsors)
          ? post.sponsors.map((s: any) => ({ name: s?.name ?? s?.username }))
          : [],
        createdAt:
          post?.createdAt ??
          post?.created ??
          post?.publishedAt ??
          post?.postedAt ??
          post?.date,
        publishedAt:
          post?.publishedAt ??
          post?.createdAt ??
          post?.created ??
          post?.postedAt ??
          post?.date,
        postedAt:
          post?.postedAt ??
          post?.publishedAt ??
          post?.createdAt ??
          post?.created ??
          post?.date,
        date:
          post?.date ??
          post?.publishedAt ??
          post?.createdAt ??
          post?.created ??
          post?.postedAt,
        created:
          post?.created ??
          post?.createdAt ??
          post?.publishedAt ??
          post?.postedAt ??
          post?.date,
      };
    })
    .filter(
      (post) =>
        Boolean(
          post?.url ||
          post?.text ||
          post?.image ||
          post?.thumbnail ||
          post?.createdAt ||
          post?.publishedAt ||
          post?.postedAt ||
          post?.date ||
          post?.created
        )
    );
}

function getPostTimestamp(post: SocialPost): number {
  const rawDate =
    post.createdAt ??
    post.publishedAt ??
    post.postedAt ??
    post.date ??
    post.created;

  const ts = rawDate ? new Date(rawDate).getTime() : 0;
  return Number.isFinite(ts) ? ts : 0;
}

function dedupeAndSortPosts(posts: SocialPost[]): SocialPost[] {
  const map = new Map<string, SocialPost>();

  for (const post of posts) {
    const key =
      post.url ||
      [
        post.createdAt ??
        post.publishedAt ??
        post.postedAt ??
        post.date ??
        post.created ??
        "no-date",
        post.text ?? "",
        post.image ?? post.thumbnail ?? "",
      ].join("__");

    if (!map.has(key)) {
      map.set(key, post);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => getPostTimestamp(b) - getPostTimestamp(a)
  );
}

function resolveRecentPostsForView(params: {
  displayedReport: InfluencerReport | null;
  primaryReport: InfluencerReport | null;
  mediaKit: MediaKit | null;
  modashData: ModashApiResponse | null;
  connectedProfiles: InfluencerReport[];
}): SocialPost[] {
  const {
    displayedReport,
    primaryReport,
    mediaKit,
    modashData,
    connectedProfiles,
  } = params;

  const directRecent = dedupeAndSortPosts([
    ...(displayedReport?.recentPosts ?? []),
    ...(primaryReport?.recentPosts ?? []),

    ...toNormalizedPosts(modashData?.profile?.recentPosts),
    ...toNormalizedPosts((modashData?.profile as any)?.profile?.recentPosts),
    ...toNormalizedPosts((modashData?.profile as any)?.posts),
    ...toNormalizedPosts((modashData?.profile as any)?.profile?.posts),

    ...toNormalizedPosts(mediaKit?.primaryInfluencerReport?.recentPosts),
    ...(mediaKit?.socialProfiles ?? []).flatMap((profile) =>
      toNormalizedPosts(
        profile?.recentPosts ?? profile?.popularPosts ?? profile?.sponsoredPosts
      )
    ),

    ...connectedProfiles.flatMap((profile) => profile?.recentPosts ?? []),
  ]);

  if (directRecent.length > 0) {
    return enrichPostImages(directRecent, [
      ...(displayedReport?.popularPosts ?? []),
      ...(primaryReport?.popularPosts ?? []),
      ...(displayedReport?.sponsoredPosts ?? []),
      ...(primaryReport?.sponsoredPosts ?? []),
    ]);
  }

  const fallbackPosts = dedupeAndSortPosts([
    ...(displayedReport?.popularPosts ?? []),
    ...(primaryReport?.popularPosts ?? []),
    ...(displayedReport?.sponsoredPosts ?? []),
    ...(primaryReport?.sponsoredPosts ?? []),

    ...toNormalizedPosts(modashData?.profile?.popularPosts),
    ...toNormalizedPosts(modashData?.profile?.sponsoredPosts),
    ...toNormalizedPosts((modashData?.profile as any)?.profile?.popularPosts),
    ...toNormalizedPosts((modashData?.profile as any)?.profile?.sponsoredPosts),

    ...(mediaKit?.socialProfiles ?? []).flatMap((profile) =>
      toNormalizedPosts(
        profile?.popularPosts ?? profile?.sponsoredPosts ?? profile?.recentPosts
      )
    ),

    ...connectedProfiles.flatMap((profile) => profile?.popularPosts ?? []),
    ...connectedProfiles.flatMap((profile) => profile?.sponsoredPosts ?? []),
  ]);

  return enrichPostImages(fallbackPosts, fallbackPosts);
}
export function normalizeHistoryPoint(
  point: Record<string, any>,
  fallbackFollowers = 0
): ModashStatHistory {
  return {
    month: String(point?.month ?? ""),
    followers: toNumber(point?.followers ?? fallbackFollowers),
    avgLikes: toNumber(point?.avgLikes ?? point?.avg_likes),
    following: toNumber(point?.following),
    avgComments: toNumber(point?.avgComments ?? point?.avg_comments),
    avgViews: toNumber(point?.avgViews ?? point?.avg_views),
  };
}

export function getProfileHistory(raw: Record<string, any>): ModashStatHistory[] {
  const fallbackFollowers = toNumber(
    raw?.followers ?? raw?.providerRaw?.profile?.profile?.followers
  );

  const directHistory = Array.isArray(raw?.statHistory) ? raw.statHistory : [];
  if (directHistory.length) {
    return directHistory.map((item: Record<string, any>) =>
      normalizeHistoryPoint(item, fallbackFollowers)
    );
  }

  const providerHistory = Array.isArray(raw?.providerRaw?.profile?.statHistory)
    ? raw.providerRaw.profile.statHistory
    : [];
  if (providerHistory.length) {
    return providerHistory.map((item: Record<string, any>) =>
      normalizeHistoryPoint(item, fallbackFollowers)
    );
  }

  const contentTypeHistory = Array.isArray(
    raw?.providerRaw?.statsByContentType?.all?.statHistory
  )
    ? raw.providerRaw.statsByContentType.all.statHistory
    : [];
  if (contentTypeHistory.length) {
    return contentTypeHistory.map((item: Record<string, any>) =>
      normalizeHistoryPoint(item, fallbackFollowers)
    );
  }

  return [];
}

export function normalizeInfluencerReport(
  rawProfile: Record<string, any>
): InfluencerReport {
  const profileRoot =
    rawProfile?.providerRaw?.profile?.profile ??
    rawProfile?.providerRaw?.profile ??
    {};
  const providerStats =
    rawProfile?.providerRaw?.profile?.stats ?? rawProfile?.providerRaw?.stats ?? {};
  const providerAudience =
    rawProfile?.providerRaw?.profile?.audience ?? rawProfile?.audience ?? {};
  const rawRecentPosts =
    rawProfile?.recentPosts ??
    rawProfile?.providerRaw?.profile?.recentPosts ??
    rawProfile?.providerRaw?.recentPosts ??
    [];
  const rawPopularPosts =
    rawProfile?.popularPosts ??
    rawProfile?.providerRaw?.profile?.popularPosts ??
    rawProfile?.providerRaw?.popularPosts ??
    [];
  const rawSponsoredPosts =
    rawProfile?.sponsoredPosts ??
    rawProfile?.providerRaw?.profile?.sponsoredPosts ??
    rawProfile?.providerRaw?.sponsoredPosts ??
    [];
  const rawLanguage =
    rawProfile?.language ??
    rawProfile?.providerRaw?.profile?.language ??
    rawProfile?.providerRaw?.language;

  const normalizedUsername =
    stripHandlePrefix(rawProfile?.username) ??
    stripHandlePrefix(rawProfile?.handle) ??
    stripHandlePrefix(profileRoot?.username) ??
    stripHandlePrefix(profileRoot?.handle);

  const normalizedFollowers =
    rawProfile?.followers ??
    rawProfile?.providerRaw?.profile?.profile?.followers ??
    profileRoot?.followers;

  const normalizedAvgLikes =
    rawProfile?.stats?.avgLikes?.value ??
    rawProfile?.avgLikes ??
    providerStats?.avgLikes?.value ??
    rawProfile?.providerRaw?.profile?.avgLikes ??
    profileRoot?.avgLikes;

  const normalizedAvgComments =
    rawProfile?.stats?.avgComments?.value ??
    rawProfile?.avgComments ??
    providerStats?.avgComments?.value ??
    rawProfile?.providerRaw?.profile?.avgComments ??
    profileRoot?.avgComments;

  const normalizedAvgViews =
    rawProfile?.stats?.avgViews?.value ??
    rawProfile?.avgViews ??
    rawProfile?.avgReelsPlays ??
    rawProfile?.providerRaw?.profile?.avgReelsPlays ??
    rawProfile?.providerRaw?.avgReelsPlays;

  const history = getProfileHistory(rawProfile);

  return {
    modashId: rawProfile?.modashId ?? rawProfile?._id,
    _id: rawProfile?._id,
    provider: rawProfile?.provider,
    url:
      rawProfile?.url ??
      profileRoot?.url ??
      rawProfile?.providerRaw?.profile?.url ??
      rawProfile?.providerRaw?.url,
    name: rawProfile?.name ?? rawProfile?.fullname ?? profileRoot?.fullname,
    fullname: rawProfile?.fullname ?? profileRoot?.fullname,
    picture: rawProfile?.picture ?? profileRoot?.picture,
    bio: rawProfile?.bio ?? rawProfile?.providerRaw?.profile?.bio,
    username: normalizedUsername,
    handle: rawProfile?.handle ?? (normalizedUsername ? `@${normalizedUsername}` : undefined),
    followers: normalizedFollowers,
    engagementRate:
      rawProfile?.engagementRate ??
      rawProfile?.providerRaw?.profile?.engagementRate ??
      profileRoot?.engagementRate,
    country: rawProfile?.country ?? rawProfile?.providerRaw?.profile?.country,
    language:
      typeof rawLanguage === "string"
        ? { name: rawLanguage }
        : rawLanguage?.name
          ? { name: rawLanguage.name }
          : undefined,
    hashtags: Array.isArray(rawProfile?.hashtags)
      ? rawProfile.hashtags.map((item: Record<string, any>) => ({ tag: item?.tag }))
      : Array.isArray(rawProfile?.providerRaw?.profile?.hashtags)
        ? rawProfile.providerRaw.profile.hashtags.map((item: Record<string, any>) => ({
          tag: item?.tag,
        }))
        : [],
    popularPosts: Array.isArray(rawPopularPosts) ? rawPopularPosts.map(mapMediaKitPost) : [],
    recentPosts: Array.isArray(rawRecentPosts) ? rawRecentPosts.map(mapMediaKitPost) : [],
    sponsoredPosts: Array.isArray(rawSponsoredPosts)
      ? rawSponsoredPosts.map(mapMediaKitPost)
      : [],
    stats: {
      avgLikes: {
        value: normalizedAvgLikes,
        compared:
          rawProfile?.stats?.avgLikes?.compared ?? providerStats?.avgLikes?.compared,
      },
      avgViews: {
        value: normalizedAvgViews,
        compared: rawProfile?.stats?.avgViews?.compared,
      },
      avgComments: {
        value: normalizedAvgComments,
        compared:
          rawProfile?.stats?.avgComments?.compared ??
          providerStats?.avgComments?.compared,
      },
      followers: {
        value: normalizedFollowers,
        compared:
          rawProfile?.stats?.followers?.compared ?? providerStats?.followers?.compared,
      },
      paidPostPerformance: rawProfile?.paidPostPerformance,
    },
    avgLikes: normalizedAvgLikes,
    avgComments: normalizedAvgComments,
    avgViews: normalizedAvgViews,
    avgReelsPlays:
      rawProfile?.avgReelsPlays ?? rawProfile?.providerRaw?.profile?.avgReelsPlays,
    audience: providerAudience
      ? {
        geoCountries: Array.isArray(providerAudience?.geoCountries)
          ? providerAudience.geoCountries.map((c: Record<string, any>) => ({
            name: c?.name,
            weight: c?.weight,
          }))
          : [],
        ages: Array.isArray(providerAudience?.ages)
          ? providerAudience.ages.map((a: Record<string, any>) => ({
            code: a?.code,
            weight: a?.weight,
          }))
          : [],
        genders: Array.isArray(providerAudience?.genders)
          ? providerAudience.genders.map((g: Record<string, any>) => ({
            code: g?.code,
            weight: g?.weight,
          }))
          : [],
        languages: Array.isArray(providerAudience?.languages)
          ? providerAudience.languages.map((l: Record<string, any>) => ({
            code: l?.name ?? l?.code,
            weight: l?.weight,
          }))
          : [],
        interests: Array.isArray(providerAudience?.interests)
          ? providerAudience.interests.map((i: Record<string, any>) => ({
            name: i?.name,
            weight: i?.weight ?? 0,
          }))
          : [],
        credibility: providerAudience?.credibility,
      }
      : undefined,
    isPrivate:
      rawProfile?.isPrivate ??
      rawProfile?.providerRaw?.profile?.isPrivate ??
      rawProfile?.providerRaw?.isPrivate,
    isVerified:
      rawProfile?.isVerified ??
      rawProfile?.providerRaw?.profile?.isVerified ??
      rawProfile?.providerRaw?.isVerified,
    accountType:
      rawProfile?.accountType ??
      rawProfile?.providerRaw?.profile?.accountType ??
      rawProfile?.providerRaw?.accountType,
    postsCount:
      rawProfile?.postsCount ??
      rawProfile?.providerRaw?.profile?.postsCount ??
      rawProfile?.providerRaw?.postsCount,
    statHistory: history,
    lookalikes:
      rawProfile?.lookalikes ?? rawProfile?.providerRaw?.profile?.lookalikes ?? [],
    followersRange:
      rawProfile?.audienceExtra?.followersRange ??
      rawProfile?.providerRaw?.profile?.audienceExtra?.followersRange,
  };
}

export function normalizeMediaKit(
  rawMediaKit: Record<string, any> | null | undefined,
  rawMediaKitId?: string
): MediaKit | null {
  if (!rawMediaKit) return null;

  const rawProfiles = Array.isArray(rawMediaKit?.socialProfiles)
    ? rawMediaKit.socialProfiles
    : Array.isArray(rawMediaKit?.influencerReports)
      ? rawMediaKit.influencerReports
      : [];

  const normalizedProfiles = rawProfiles.map((profile: Record<string, any>) =>
    normalizeInfluencerReport(profile)
  );

  const primaryProfile =
    normalizedProfiles.find(
      (profile) => profile.provider === rawMediaKit?.primaryPlatform
    ) ??
    normalizedProfiles[0] ??
    undefined;

  const normalizedLanguages =
    Array.isArray(rawMediaKit?.languages) && rawMediaKit.languages.length
      ? rawMediaKit.languages
      : primaryProfile?.language?.name
        ? [{ name: primaryProfile.language.name }]
        : [];

  return {
    _id: rawMediaKit?._id,
    mediaKitId: rawMediaKit?.mediaKitId ?? rawMediaKitId,
    influencerId: rawMediaKit?.influencerId,
    primaryPlatform: rawMediaKit?.primaryPlatform,
    name: rawMediaKit?.name ?? primaryProfile?.name,
    email: rawMediaKit?.email,
    phone: rawMediaKit?.phone,
    country: rawMediaKit?.country ?? primaryProfile?.country,
    languages: normalizedLanguages,
    additionalNotes: rawMediaKit?.additionalNotes,
    reviews: rawMediaKit?.reviews ?? [],
    socialProfiles: normalizedProfiles,
    influencerReports: normalizedProfiles,
    primaryInfluencerReport: primaryProfile,
    updatedAt: rawMediaKit?.updatedAt,
  };
}

async function fetchModashReport(
  platform: string,
  userId: string,
  brandId: string
): Promise<ModashApiResponse | null> {
  try {
    const token = localStorage.getItem("token") ?? "";
    const response = await api.get<ModashApiResponse>(
      `/modash/report?platform=${platform}&userId=${userId}&calculationMethod=average&brandId=${brandId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data ?? null;
  } catch {
    return null;
  }
}

function transformModashToInfluencerReport(
  modashProfile: ModashReport,
  platformFallback: SupportedPlatform = "instagram"
): InfluencerReport {
  const resolvedPlatform = inferPlatformFromUrl(
    modashProfile?.profile?.url,
    platformFallback
  );

  const resolvedPopularPosts = Array.isArray(modashProfile?.popularPosts)
    ? modashProfile.popularPosts
    : Array.isArray((modashProfile as any)?.profile?.popularPosts)
      ? (modashProfile as any).profile.popularPosts
      : [];

  const resolvedRecentPosts = Array.isArray(modashProfile?.recentPosts)
    ? modashProfile.recentPosts
    : Array.isArray((modashProfile as any)?.profile?.recentPosts)
      ? (modashProfile as any).profile.recentPosts
      : Array.isArray((modashProfile as any)?.posts)
        ? (modashProfile as any).posts
        : [];

  const resolvedSponsoredPosts = Array.isArray(modashProfile?.sponsoredPosts)
    ? modashProfile.sponsoredPosts
    : Array.isArray((modashProfile as any)?.profile?.sponsoredPosts)
      ? (modashProfile as any).profile.sponsoredPosts
      : [];

  return {
    modashId: modashProfile.userId,
    provider: resolvedPlatform,
    url: modashProfile.profile?.url,
    name: modashProfile.profile?.fullname,
    fullname: modashProfile.profile?.fullname,
    picture: modashProfile.profile?.picture,
    bio: modashProfile.bio,
    username: modashProfile.profile?.username,
    handle: modashProfile.profile?.username
      ? `@${stripHandlePrefix(modashProfile.profile.username)}`
      : undefined,
    followers: modashProfile.profile?.followers,
    engagementRate: modashProfile.profile?.engagementRate,
    country: modashProfile.country,
    language: modashProfile.language?.name
      ? { name: modashProfile.language.name }
      : undefined,
    hashtags: modashProfile.hashtags?.map((h) => ({ tag: h.tag })) ?? [],
    popularPosts: resolvedPopularPosts.map(mapModashPost),
    recentPosts: resolvedRecentPosts.map(mapModashPost),
    sponsoredPosts: resolvedSponsoredPosts.map(mapModashPost),
    stats: {
      avgLikes: {
        value:
          modashProfile.stats?.avgLikes?.value ??
          modashProfile.avgLikes ??
          modashProfile.profile?.avgLikes,
        compared: modashProfile.stats?.avgLikes?.compared,
      },
      avgViews: {
        value:
          modashProfile.avgReelsPlays ??
          modashProfile.profile?.averageViews ??
          0,
      },
      avgComments: {
        value:
          modashProfile.stats?.avgComments?.value ??
          modashProfile.avgComments ??
          modashProfile.profile?.avgComments,
        compared: modashProfile.stats?.avgComments?.compared,
      },
      followers: {
        value:
          modashProfile.stats?.followers?.value ??
          modashProfile.profile?.followers,
        compared: modashProfile.stats?.followers?.compared,
      },
      paidPostPerformance: undefined,
    },
    avgLikes: modashProfile.avgLikes ?? modashProfile.profile?.avgLikes,
    avgComments:
      modashProfile.avgComments ?? modashProfile.profile?.avgComments,
    avgViews: modashProfile.profile?.averageViews ?? modashProfile.avgReelsPlays,
    avgReelsPlays:
      modashProfile.profile?.averageViews ?? modashProfile.avgReelsPlays,
    audience: {
      geoCountries:
        modashProfile.audience?.geoCountries?.map((c) => ({
          name: c.name ?? "",
          weight: c.weight ?? 0,
        })) ?? [],
      ages:
        modashProfile.audience?.ages?.map((a) => ({
          code: a.code ?? "",
          weight: a.weight ?? 0,
        })) ?? [],
      genders:
        modashProfile.audience?.genders?.map((g) => ({
          code: g.code ?? "",
          weight: g.weight ?? 0,
        })) ?? [],
      languages:
        modashProfile.audience?.languages?.map((l) => ({
          code: l.name ?? l.code ?? "",
          weight: l.weight ?? 0,
        })) ?? [],
      interests:
        modashProfile.audience?.interests?.map((i) => ({
          name: i.name ?? "",
          weight: i.weight ?? 0,
        })) ?? [],
      credibility: modashProfile.audience?.credibility,
    },
    isPrivate: modashProfile.isPrivate,
    isVerified: modashProfile.isVerified,
    accountType: modashProfile.accountType,
    postsCount: modashProfile.postsCount ?? modashProfile.profile?.postsCount,
    statHistory: modashProfile.statHistory ?? [],
    lookalikes: modashProfile.lookalikes ?? [],
  };
}

function transformLookalikes(
  lookalikes: ModashLookalike[],
  engagementRate: number
): LookalikeCreator[] {
  return lookalikes.slice(0, 4).map((l) => ({
    id: l.userId,
    name: l.fullname ?? l.username,
    handle: `@${l.username}`,
    followers: formatCompactNumber(l.followers),
    engagement:
      l.followers > 0
        ? formatPercent((l.engagements / l.followers) * 100)
        : formatPercent(engagementRate, true),
    avatar: l.picture,
    url: l.url,
  }));
}

export default function ViewClient() {
  const [mediaKit, setMediaKit] = useState<MediaKit | null>(null);
  const [modashData, setModashData] = useState<ModashApiResponse | null>(null);
  const [contractedCampaigns, setContractedCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<SubscriptionPlan>("pro");
  const [role, setRole] = useState<UserRole>("viewer");
  const [activePlatform, setActivePlatform] = useState<SupportedPlatform | null>(null);
  const [activeReport, setActiveReport] = useState<InfluencerReport | null>(null);
  const [platformReportCache, setPlatformReportCache] = useState<
    Partial<Record<SupportedPlatform, InfluencerReport>>
  >({});
  const shouldLockFields = false;

  const hasSectionAccess = (_section: SectionKey) => {
    if (!shouldLockFields) return true;
    return canAccessSection(role, plan, _section);
  };
  const [modashPlatform, setModashPlatform] = useState<SupportedPlatform>("instagram");
  const primaryReport = useMemo<InfluencerReport | null>(() => {
    if (modashData?.profile) {
      return transformModashToInfluencerReport(modashData.profile, modashPlatform);
    }
    return mediaKit?.primaryInfluencerReport ?? mediaKit?.socialProfiles?.[0] ?? null;
  }, [modashData, mediaKit, modashPlatform]);
  const connectedProfiles = useMemo(() => {
    const profiles = mediaKit?.socialProfiles ?? mediaKit?.influencerReports ?? [];
    return Array.from(
      new Map(
        profiles
          .filter((profile) => profile?.provider)
          .map((profile) => [String(profile.provider).toLowerCase(), profile])
      ).values()
    );
  }, [mediaKit]);

  const initialPrimaryProfile = useMemo<InfluencerReport | null>(() => {
    if (!mediaKit) return null;

    return (
      mediaKit.primaryInfluencerReport ??
      connectedProfiles.find(
        (profile) =>
          normalisePlatform(profile.provider) === normalisePlatform(mediaKit.primaryPlatform)
      ) ??
      connectedProfiles[0] ??
      null
    );
  }, [mediaKit, connectedProfiles]);

  useEffect(() => {
    if (primaryReport) {
      const initialPlatform = normalisePlatform(
        primaryReport.provider ?? mediaKit?.primaryPlatform ?? "instagram"
      );

      setActivePlatform(initialPlatform);
      setActiveReport(primaryReport);
      setPlatformReportCache((prev) => ({
        ...prev,
        [initialPlatform]: primaryReport,
      }));
      return;
    }

    if (!initialPrimaryProfile) return;
    if (activeReport) return;

    const initialPlatform = normalisePlatform(
      initialPrimaryProfile.provider ?? mediaKit?.primaryPlatform ?? "instagram"
    );

    setActivePlatform(initialPlatform);
    setActiveReport(initialPrimaryProfile);
    setPlatformReportCache((prev) => ({
      ...prev,
      [initialPlatform]: initialPrimaryProfile,
    }));
  }, [primaryReport, initialPrimaryProfile, activeReport, mediaKit]);


  const handlePlatformSelect = async (profile: InfluencerReport) => {
    const nextPlatform = normalisePlatform(
      profile.provider ?? mediaKit?.primaryPlatform ?? "instagram"
    );

    setActivePlatform(nextPlatform);

    if (platformReportCache[nextPlatform]) {
      setActiveReport(platformReportCache[nextPlatform] ?? null);
      return;
    }

    const brandId = localStorage.getItem("brandId") ?? "";
    const userId =
      profile.modashId ||
      profile._id ||
      localStorage.getItem("modashUserId") ||
      localStorage.getItem("influencerId") ||
      "";

    if (!brandId || !userId) {
      setActiveReport(profile);
      setPlatformReportCache((prev) => ({ ...prev, [nextPlatform]: profile }));
      return;
    }

    const modashResponse = await fetchModashReport(nextPlatform, userId, brandId);

    const nextReport =
      modashResponse && !modashResponse.error
        ? transformModashToInfluencerReport(modashResponse.profile, nextPlatform)
        : profile;

    setActiveReport(nextReport);
    setPlatformReportCache((prev) => ({ ...prev, [nextPlatform]: nextReport }));
  };

  useEffect(() => {
    setPlan(getSubscriptionPlan());
    setRole(getUserRole());
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const influencerId = localStorage.getItem("influencerId") ?? "";
        const token = localStorage.getItem("token") ?? "";
        const brandId = localStorage.getItem("brandId") ?? "";
        const modashUserId = localStorage.getItem("modashUserId") ?? influencerId;

        const requestedPlatform = normalisePlatform(
          localStorage.getItem("primaryPlatform") ||
          localStorage.getItem("platform") ||
          "instagram"
        );
        setModashPlatform(requestedPlatform);

        const [mediaKitResponse, campaignsResponse, modashResponse] = await Promise.all([
          apiGetfetchMediaKit(influencerId),
          apiGetContractedCampaigns(influencerId, token),
          brandId && modashUserId
            ? fetchModashReport(requestedPlatform, modashUserId, brandId)
            : Promise.resolve(null),
        ]);

        const mediaKitPayload = mediaKitResponse as RawMediaKitApiResponse;
        const rawMediaKit =
          mediaKitPayload?.mediaKit ?? mediaKitPayload?.data?.mediaKit ?? null;
        setMediaKit(normalizeMediaKit(rawMediaKit, mediaKitPayload?.mediaKitId) ?? null);

        if (modashResponse && !modashResponse.error) {
          setModashData(modashResponse);
          setModashPlatform(
            inferPlatformFromUrl(modashResponse.profile?.profile?.url, requestedPlatform)
          );
        }

        let campaignsSource: unknown[] = [];
        if (Array.isArray(campaignsResponse)) {
          campaignsSource = campaignsResponse;
        } else {
          const campaignsObject = campaignsResponse as Record<string, unknown>;
          const nested = campaignsObject?.data as Record<string, unknown> | undefined;
          campaignsSource =
            (campaignsObject?.campaigns as unknown[] | undefined) ??
            (nested?.campaigns as unknown[] | undefined) ??
            [];
        }

        const mappedCampaigns: CampaignRow[] = campaignsSource.map((item) => {
          const row = item as Record<string, unknown>;
          return {
            _id: row._id as string | undefined,
            company: (row.brandName as string | undefined) ?? "—",
            brief: ((row.campaignTitle ?? row.description) as string | undefined) ?? "—",
            rate: row.feeAmount
              ? `$${row.feeAmount}`
              : row.campaignBudget
                ? `$${row.campaignBudget}`
                : "—",
            status:
              ((row.contractStatus ?? row.campaignStatus ?? row.status) as string | undefined) ??
              "—",
            payout: (row.paymentType as string | undefined) ?? "—",
            raw: item,
            category: (row.campaignCategory as string | undefined) ?? "Lifestyle",
          };
        });

        setContractedCampaigns(mappedCampaigns);
      } catch (error) {
        console.error("Failed to load creator dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);



  const allReports = useMemo<InfluencerReport[]>(() => {
    return mediaKit?.influencerReports ?? mediaKit?.socialProfiles ?? [];
  }, [mediaKit]);

  const totalReach = useMemo(() => {
    const value = allReports.reduce((sum, item) => sum + getPrimaryValue(item), 0);
    return value || getPrimaryValue(primaryReport);
  }, [allReports, primaryReport]);

  const displayedReport = activeReport ?? primaryReport ?? initialPrimaryProfile ?? null;

  const recentPosts = displayedReport?.recentPosts ?? [];
  const sponsoredPosts = displayedReport?.sponsoredPosts ?? [];
  const popularPosts = displayedReport?.popularPosts ?? [];

  const recentPostsForTable = useMemo(
    () =>
      resolveRecentPostsForView({
        displayedReport,
        primaryReport,
        mediaKit,
        modashData,
        connectedProfiles,
      }),
    [displayedReport, primaryReport, mediaKit, modashData, connectedProfiles]
  );

  const { organicTrend, sponsoredTrend, trendLabels } = useMemo(() => {
    const history = modashData?.profile?.statHistory ?? primaryReport?.statHistory;

    if (history && history.length > 0) {
      const sorted = [...history].sort((a, b) => a.month.localeCompare(b.month));
      const labels = sorted.map((h) => {
        const [year, month] = h.month.split("-");
        return `${monthLabels[parseInt(month, 10) - 1]} ${year.slice(2)}`;
      });

      const organic = normaliseTrend(sorted.map((h) => h.avgLikes), sorted.length);
      const followerDeltas = sorted.map((h, i) =>
        i === 0 ? h.followers : Math.max(0, h.followers - sorted[i - 1].followers)
      );
      const sponsored = normaliseTrend(followerDeltas, sorted.length);

      return {
        organicTrend: organic,
        sponsoredTrend: sponsored,
        trendLabels: labels,
      };
    }

    return {
      organicTrend: normaliseTrend(recentPosts.map((p) => p.views ?? p.likes ?? 0)),
      sponsoredTrend: normaliseTrend(sponsoredPosts.map((p) => p.views ?? p.likes ?? 0)),
      trendLabels: undefined,
    };
  }, [modashData, primaryReport, recentPosts, sponsoredPosts]);

  const avgLikes = toNumber(
    modashData?.profile?.avgLikes ??
    primaryReport?.stats?.avgLikes?.value ??
    primaryReport?.avgLikes
  );

  const avgViews = toNumber(
    modashData?.profile?.profile?.averageViews ??
    modashData?.profile?.avgReelsPlays ??
    primaryReport?.stats?.avgViews?.value ??
    average(recentPosts.map((p) => toNumber(p.views ?? p.likes)))
  );

  const engagementRate = toNumber(primaryReport?.engagementRate);

  const credibilityScore = useMemo(() => {
    const raw =
      modashData?.profile?.audience?.credibility ?? primaryReport?.audience?.credibility;

    if (raw !== undefined && raw !== null && Number.isFinite(Number(raw))) {
      return Math.round(Number(raw) * 100);
    }
    console.log("raw", raw)
    return 0;
  }, [modashData, primaryReport]);

  const followerRangeLabel = useMemo(() => {
    const range = primaryReport?.followersRange;
    if (range?.leftNumber || range?.rightNumber) {
      const left = range?.leftNumber?.toLocaleString?.() ?? range?.leftNumber ?? 0;
      const right = range?.rightNumber?.toLocaleString?.() ?? range?.rightNumber ?? 0;
      return `${left} - ${right}`;
    }

    return formatCompactNumber(primaryReport?.followers);
  }, [primaryReport]);

  const metricCards = useMemo<DashboardMetric[]>(() => {
    const followerCompared = toNumber(
      modashData?.profile?.stats?.followers?.compared ??
      primaryReport?.stats?.followers?.compared
    );
    const likesCompared = toNumber(
      modashData?.profile?.stats?.avgLikes?.compared ??
      primaryReport?.stats?.avgLikes?.compared
    );

    return [
      {
        key: "followers",
        label: "Followers",
        value: formatCompactNumber(primaryReport?.followers),
        delta: `${(followerCompared * 100).toFixed(1)}%`,
      },
      {
        key: "engagement",
        label: "Avg. engagement rate",
        value: formatPercent(primaryReport?.engagementRate, true),
        delta: "+0.4%",
      },
      {
        key: "likes",
        label: "Average likes",
        value: formatCompactNumber(avgLikes),
        delta: `${(likesCompared * 100).toFixed(1)}%`,
      },
      {
        key: "views",
        label: "Avg. reel plays",
        value: formatCompactNumber(avgViews),
        delta: "+3.0%",
      },
      {
        key: "posts",
        label: "Total posts",
        value: formatCompactNumber(
          modashData?.profile?.postsCount ??
          modashData?.profile?.profile?.postsCount ??
          primaryReport?.postsCount ??
          recentPosts.length
        ),
      },
      {
        key: "reach",
        label: "Total reach",
        value: formatCompactNumber(totalReach),
        delta: "+1.8%",
      },
    ];
  }, [primaryReport, avgLikes, avgViews, recentPosts.length, totalReach, modashData]);

  const campaignHighlights = useMemo<CampaignHighlight[]>(() => {
    const sponsoredAvgLikes = modashData?.profile?.sponsoredPostsMedianLikes
      ? modashData.profile.sponsoredPostsMedianLikes
      : average(sponsoredPosts.map((p) => toNumber(p.likes)));

    const organicAvgLikes = average(recentPosts.map((p) => toNumber(p.likes)));
    const topPostLikes = Math.max(...popularPosts.map((p) => toNumber(p.likes)), 0);

    return [
      {
        label: sponsoredPosts.length ? "Sponsored median likes" : "Top post likes",
        value: formatCompactNumber(sponsoredPosts.length ? sponsoredAvgLikes : topPostLikes),
        meta: sponsoredPosts.length
          ? `Across ${sponsoredPosts.length || 0} sponsored posts`
          : `Best result from ${popularPosts.length || 0} popular posts`,
        tone: "accent",
      },
      {
        label: "Organic median likes",
        value: formatCompactNumber(organicAvgLikes),
        meta: `Across ${recentPosts.length || 0} recent posts`,
      },
      {
        label: "Follower range",
        value: followerRangeLabel,
        meta: "Estimated creator bucket from media kit",
      },
      {
        label: "Brand collaborations",
        value: formatCompactNumber(contractedCampaigns.length || sponsoredPosts.length),
        meta: "Current + historical partnerships",
      },
    ];
  }, [
    contractedCampaigns.length,
    recentPosts,
    sponsoredPosts,
    modashData,
    popularPosts,
    followerRangeLabel,
  ]);

  const audienceAge = (primaryReport?.audience?.ages ?? []).map((item) => ({
    label: item.code,
    value: Number((item.weight || 0) * 100),
  }));

  const audienceGender = (primaryReport?.audience?.genders ?? []).map((item) => ({
    label:
      item.code === "MALE"
        ? "Male"
        : item.code === "FEMALE"
          ? "Female"
          : item.code,
    value: Number((item.weight || 0) * 100),
  }));

  const topCountries = (primaryReport?.audience?.geoCountries ?? [])
    .slice(0, 4)
    .map((item) => ({
      name: item.name,
      value: Number((item.weight || 0) * 100),
    }));

  const topLanguages = (primaryReport?.audience?.languages ?? [])
    .slice(0, 4)
    .map((item) => ({
      label: item.code,
      value: Number((item.weight || 0) * 100),
    }));

  const lookalikeCreators: LookalikeCreator[] = useMemo(() => {
    if (modashData?.profile?.lookalikes?.length) {
      return transformLookalikes(modashData.profile.lookalikes, engagementRate);
    }

    if (primaryReport?.lookalikes?.length) {
      return transformLookalikes(primaryReport.lookalikes, engagementRate);
    }

    return [
      {
        id: "1",
        name: "Clean Bath",
        handle: "@cleanbath.cl",
        followers: "37.5K",
        engagement: "0.4%",
      },
      {
        id: "2",
        name: "JOMOO Indonesia",
        handle: "@jomooindonesia",
        followers: "21.7K",
        engagement: "0.03%",
      },
      {
        id: "3",
        name: "Hindware",
        handle: "@hindwarehomes",
        followers: "79.2K",
        engagement: "7.2%",
      },
      {
        id: "4",
        name: "Dekkson",
        handle: "@dekkson_official",
        followers: "52.3K",
        engagement: "9.2%",
      },
    ];
  }, [modashData, primaryReport, engagementRate]);

  const auditItems: AuditItem[] = useMemo(
    () => [
      {
        id: "1",
        date:
          modashData?._lastFetchedAt?.slice(0, 16).replace("T", " ") ??
          "2026-04-14 06:49",
        action: "Modash profile sync",
        actor: "System",
        status: "Success",
      },
      {
        id: "2",
        date: "2026-04-14 06:45",
        action: "Risk assessment scan",
        actor: "Automated Agent",
        status: "Warning - flagged content review",
      },
      {
        id: "3",
        date: "2026-04-13 18:12",
        action: "Media kit export",
        actor: "Admin panel",
        status: "Success",
      },
      {
        id: "4",
        date: "2026-04-12 09:00",
        action: "Manual verification update",
        actor: "Operations",
        status: "Success",
      },
    ],
    [modashData]
  );

  const handleCopy = async () => {
    try {
      const influencerId = localStorage.getItem("influencerId") ?? "";
      const mediaKitUrl = `${window.location.origin}/influencer/public/media-kit/${influencerId}`;
      await navigator.clipboard.writeText(mediaKitUrl);
      await Swal.fire({
        icon: "success",
        title: "Copied",
        text: "Media kit link copied to clipboard.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Failed to copy media kit link:", error);
      await Swal.fire({
        icon: "error",
        title: "Copy failed",
        text: "Unable to copy the media kit link.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbf8f3]">
        <Loader logoSrc="/logo.png" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#1f1f1f]">
      <div className="w-full px-4 py-5 lg:px-6 xl:px-8">
        {/* <DashboardTopBar plan={plan} /> */}

        <CreatorHeader
          primaryReport={primaryReport}
          mediaKit={mediaKit}
          activePlan={plan}
          isVerified={modashData?.profile?.isVerified ?? primaryReport?.isVerified}
          accountType={modashData?.profile?.accountType ?? primaryReport?.accountType}
          postsCount={
            modashData?.profile?.postsCount ??
            modashData?.profile?.profile?.postsCount ??
            primaryReport?.postsCount
          }
        />

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-6">
            {hasSectionAccess("contactManagement") ? (
              <ContactManagementCard
                primaryReport={displayedReport}
                mediaKit={mediaKit}
                onCopy={handleCopy}
                connectedProfiles={connectedProfiles}
                activePlatform={activePlatform}
                onPlatformSelect={handlePlatformSelect}
              />
            ) : null}

            {hasSectionAccess("riskCompliance") ? (
              <RiskComplianceCard
                credibilityScore={credibilityScore}
                isPrivate={modashData?.profile?.isPrivate ?? primaryReport?.isPrivate}
              />
            ) : (
              <FeatureLockedCard
                title="Risk & Compliance Monitoring"
                plan="starter"
              />
            )}
          </div>

          <div className="space-y-6">
            {hasSectionAccess("metricGrid") ? (
              <MetricsGrid metrics={metricCards} />
            ) : null}

            {hasSectionAccess("performanceTrend") ? (
              <PerformanceTrendCard
                organicTrend={organicTrend}
                sponsoredTrend={sponsoredTrend}
                trendLabels={trendLabels}
              />
            ) : (
              <FeatureLockedCard title="Performance Trend" plan="starter" />
            )}
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {hasSectionAccess("campaignHighlights") ? (
            <CampaignHighlightsCard items={campaignHighlights} />
          ) : (
            <FeatureLockedCard
              title="Campaign Performance Highlights"
              plan="pro"
            />
          )}

          {hasSectionAccess("audienceIntelligence") ? (
            <AudienceIntelligenceCard
              ageData={audienceAge}
              genderData={audienceGender}
              topCountries={topCountries}
              credibilityScore={credibilityScore}
              topLanguages={topLanguages}
            />
          ) : (
            <FeatureLockedCard title="Audience Intelligence" plan="pro" />
          )}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_420px]">
            {hasSectionAccess("recentPosts") ? (
              <RecentPostsTable posts={recentPostsForTable.slice(0, 5)} />
            ) : (
              <FeatureLockedCard
                title="Recent Posts Performance"
                plan="free"
              />
            )}

            {hasSectionAccess("popularContent") ? (
              <PopularContentPanel posts={popularPosts.slice(0, 2)} />
            ) : (
              <FeatureLockedCard title="Popular Content" plan="starter" />
            )}
          </div>

          {contractedCampaigns.length ? (
            <PastCollaborationsTable items={contractedCampaigns} />
          ) : null}

          {hasSectionAccess("lookalikeCreators") ? (
            <LookalikeCreatorsPanel items={lookalikeCreators} />
          ) : (
            <FeatureLockedCard title="Lookalike Creators" plan="pro" />
          )}

          {hasSectionAccess("auditTrail") ? (
            <AuditTrailTable items={auditItems} />
          ) : (
            <FeatureLockedCard title="Audit Trail" plan="enterprise" />
          )}
        </div>
      </div>
    </div>
  );
}