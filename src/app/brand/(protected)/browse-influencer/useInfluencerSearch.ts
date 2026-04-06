"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { FilterState, Platform } from "./filters";
import {
  createDefaultFilters,
  normalizeInfluencerAgeRange,
  setNestedFilterValue,
} from "./filters";

const PAGE_SIZE = 24;

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const API_USERS_ENDPOINT =
  process.env.NEXT_PUBLIC_MODASH_FRONTEND_USERS_ENDPOINT || `${API_BASE}/modash/users`;
const API_UNIFIED_ENDPOINT =
  process.env.NEXT_PUBLIC_MODASH_FRONTEND_UNIFIED_SEARCH_ENDPOINT || `${API_BASE}/modash/search-unified`;

type SearchArgs = {
  queryText?: string;
};

type BackendResult = {
  id?: string | number;
  userId?: string | number;
  username?: string;
  handle?: string;
  fullname?: string;
  fullName?: string;
  name?: string;
  followers?: number;
  followersCount?: number;
  engagementRate?: number;
  picture?: string;
  avatar?: string;
  profilePicture?: string;
  url?: string;
  link?: string;
  platform?: Platform;
  isVerified?: boolean;
  verifiedStatus?: boolean;
  location?: string;
  country?: string;
  state?: string;
  city?: string;
  categories?: string[];
  category?: string;
  primaryCategory?: string;
  matchedPosts?: any[];
  recentPosts?: any[];
  aiMatchedPostsCount?: number;
  accountCategory?: string;
  searchType?: "exact" | "standard" | "ai" | "combined";
};

export type UiResult = {
  id: string;
  userId?: string;
  username: string;
  handle?: string;
  fullname?: string;
  name: string;
  followers: number;
  engagementRate: number;
  picture?: string;
  avatar?: string;
  url?: string;
  link?: string;
  platform: Platform;
  isVerified?: boolean;
  verifiedStatus?: boolean;
  location?: string;
  country?: string;
  state?: string;
  city?: string;
  categories?: string[];
  matchedPosts?: any[];
  recentPosts?: any[];
  aiMatchedPostsCount?: number;
  accountCategory?: string;
  searchType?: "exact" | "standard" | "ai" | "combined";
};

type SearchState = {
  loading: boolean;
  error: string | null;
  results: UiResult[];
  total: number;
  hasMore: boolean;
  rawResponse: unknown;
};

function getBrandIdFromStorage(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem("brandId") || "";
  } catch {
    return "";
  }
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function clamp01PercentUi(value?: number) {
  if (value == null || !Number.isFinite(value) || value <= 0) return undefined;
  return Math.max(0, Math.min(1, value / 100));
}

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLooseTokens(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .flatMap((item) => item.split(/\s+/))
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseIdList(value?: string): number[] {
  return splitCommaList(cleanText(value))
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function parseStringList(value?: string): string[] {
  return splitCommaList(cleanText(value));
}

function parseAccountTypes(value?: string): number[] {
  return splitCommaList(cleanText(value))
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && [1, 2, 3].includes(item));
}

function parseTextTags(value?: string): Array<{ type: "hashtag" | "mention"; value: string }> {
  const tokens = splitCommaList(cleanText(value));
  const out: Array<{ type: "hashtag" | "mention"; value: string }> = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();

    if (token.startsWith("#")) {
      out.push({ type: "hashtag", value: token.slice(1) });
      continue;
    }

    if (token.startsWith("@")) {
      out.push({ type: "mention", value: token.slice(1) });
      continue;
    }

    if (lower.startsWith("hashtag:")) {
      out.push({ type: "hashtag", value: token.slice(8).trim() });
      continue;
    }

    if (lower.startsWith("mention:")) {
      out.push({ type: "mention", value: token.slice(8).trim() });
      continue;
    }
  }

  return out.filter((item) => item.value);
}

function extractExplicitHandles(queryText: string): string[] {
  const found = new Set<string>();
  const value = queryText.trim();

  for (const match of value.matchAll(
    /(?:instagram\.com\/|tiktok\.com\/@|youtube\.com\/@)([A-Za-z0-9._-]{2,30})/gi
  )) {
    found.add(match[1]);
  }

  for (const match of value.matchAll(/(^|\s)@([A-Za-z0-9._-]{2,30})\b/g)) {
    found.add(match[2]);
  }

  return Array.from(found);
}

function shouldRunAiSearch(queryText: string, filters: FilterState): boolean {
  const mode = filters.search.mode || "combined";
  const aiOverride = cleanText(filters.search.aiQuery);
  const value = cleanText(queryText);

  if (mode === "standard") return false;
  if (mode === "ai") return !!(aiOverride || value);

  if (aiOverride) return true;
  if (!value) return false;

  const explicitHandles = extractExplicitHandles(value);
  if (explicitHandles.length) return false;

  const words = value.split(/\s+/).filter(Boolean);

  if (words.length <= 1 && value.length <= 12) return false;

  return (
    words.length >= 3 ||
    value.length >= 18 ||
    /creator|influencer|people|person|talking|filming|wearing|doing|reviewing|explaining|news channel/i.test(
      value
    )
  );
}

function minDefined(values: Array<number | undefined>): number | undefined {
  const nums = values.filter((value): value is number => value != null && Number.isFinite(value));
  return nums.length ? Math.min(...nums) : undefined;
}

function maxDefined(values: Array<number | undefined>): number | undefined {
  const nums = values.filter((value): value is number => value != null && Number.isFinite(value));
  return nums.length ? Math.max(...nums) : undefined;
}

function firstDefined<T>(values: Array<T | undefined>): T | undefined {
  return values.find((value) => value !== undefined);
}

function setMinMaxRange(target: Record<string, any>, key: string, min?: number, max?: number) {
  if (min == null && max == null) return;
  target[key] = {
    ...(min != null ? { min } : {}),
    ...(max != null ? { max } : {}),
  };
}

function buildWeightedLocation(value?: string, weight?: number) {
  const ids = parseIdList(value);
  const safeWeight = weight && weight > 0 ? weight : 0.2;
  return ids.map((id) => ({ id, weight: safeWeight }));
}

function normalizeAiAgeRange(min?: number, max?: number): { min?: string; max?: string } | undefined {
  const allowedMin = ["13", "18", "25", "35", "45", "65"];
  const allowedMax = ["18", "25", "35", "45", "65"];

  let normalizedMin: string | undefined;
  let normalizedMax: string | undefined;

  if (min != null) {
    normalizedMin = allowedMin.find((value) => Number(value) >= min) ?? "65";
  }

  if (max != null) {
    normalizedMax = [...allowedMax].reverse().find((value) => Number(value) <= max) ?? "18";
  }

  if (!normalizedMin && !normalizedMax) return undefined;

  return {
    ...(normalizedMin ? { min: normalizedMin } : {}),
    ...(normalizedMax ? { max: normalizedMax } : {}),
  };
}

function weightOrDefault(value?: number, fallback = 0.2) {
  return value && value > 0 ? value : fallback;
}

function uiResultScore(item: UiResult): number {
  const searchType = item.searchType || "standard";
  let score = 0;

  if (searchType === "combined") score += 500;
  else if (searchType === "exact") score += 400;
  else if (searchType === "ai") score += 300;
  else score += 100;

  if (item.isVerified) score += 25;
  score += Math.min(item.aiMatchedPostsCount || 0, 10) * 12;
  score += Math.min(Math.log10((item.followers || 0) + 1) * 12, 60);
  score += Math.min((item.engagementRate || 0) * 100, 20);

  return score;
}

function uniqStrings(values: Array<string | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const clean = cleanText(value);
    if (!clean) continue;

    const key = clean.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(clean);
  }

  return out;
}

function mergeResults(items: UiResult[]): UiResult[] {
  const map = new Map<string, UiResult>();

  for (const item of items) {
    const key = `${item.platform}:${item.userId || item.username || item.id}`.toLowerCase();
    const prev = map.get(key);

    if (!prev) {
      map.set(key, item);
      continue;
    }

    const preferred = uiResultScore(item) >= uiResultScore(prev) ? item : prev;
    const other = preferred === item ? prev : item;

    const merged: UiResult = {
      ...other,
      ...preferred,
      categories: uniqStrings([...(other.categories || []), ...(preferred.categories || [])]),
      matchedPosts:
        (preferred.matchedPosts && preferred.matchedPosts.length
          ? preferred.matchedPosts
          : other.matchedPosts) || [],
      recentPosts:
        (preferred.recentPosts && preferred.recentPosts.length
          ? preferred.recentPosts
          : other.recentPosts) || [],
      aiMatchedPostsCount: Math.max(
        Number(other.aiMatchedPostsCount || 0),
        Number(preferred.aiMatchedPostsCount || 0)
      ),
      searchType:
        prev.searchType && item.searchType && prev.searchType !== item.searchType
          ? "combined"
          : preferred.searchType,
    };

    map.set(key, merged);
  }

  return Array.from(map.values()).sort((a, b) => uiResultScore(b) - uiResultScore(a));
}

function mapBackendResult(
  item: BackendResult,
  fallbackPlatform: Platform,
 source: "exact" | "standard" | "ai" | "combined" = "standard"
): UiResult | null {
  const platform = item.platform || fallbackPlatform;
  const id = String(
    item.userId ||
      item.id ||
      item.username ||
      item.handle ||
      item.url ||
      item.link ||
      ""
  ).trim();

  if (!id) return null;

  const username = cleanText(item.username || item.handle || "");
  const handle = cleanText(item.handle || item.username || "") || undefined;
  const fullname = cleanText(
    item.fullname || item.fullName || item.name || username || handle || "Unknown"
  );
  const location =
    cleanText(item.location) ||
    [item.city, item.state, item.country].filter(Boolean).join(", ") ||
    undefined;

  const categories = Array.isArray(item.categories)
    ? item.categories
    : uniqStrings([item.category, item.primaryCategory]);

  return {
    id,
    userId: item.userId != null ? String(item.userId) : undefined,
    username,
    handle,
    fullname,
    name: fullname,
    followers: Number(item.followers || item.followersCount || 0),
    engagementRate: Number(item.engagementRate || 0),
    picture: cleanText(item.picture || item.avatar || item.profilePicture) || undefined,
    avatar: cleanText(item.avatar || item.picture || item.profilePicture) || undefined,
    url: cleanText(item.url || item.link) || undefined,
    link: cleanText(item.link || item.url) || undefined,
    platform,
    isVerified: item.isVerified ?? item.verifiedStatus,
    verifiedStatus: item.verifiedStatus ?? item.isVerified,
    location,
    country: cleanText(item.country) || undefined,
    state: cleanText(item.state) || undefined,
    city: cleanText(item.city) || undefined,
    categories,
    matchedPosts: Array.isArray(item.matchedPosts) ? item.matchedPosts : [],
    recentPosts: Array.isArray(item.recentPosts) ? item.recentPosts : [],
    aiMatchedPostsCount: Number(item.aiMatchedPostsCount || item.matchedPosts?.length || 0),
    accountCategory: cleanText(item.accountCategory) || undefined,
    searchType: item.searchType || source,
  };
}

function applyClientFilters(items: UiResult[], filters: FilterState): UiResult[] {
  const country = cleanText(filters.audience.country).toLowerCase();
  if (!country) return items;

  return items.filter((item) => {
    const haystack = [item.country, item.location]
      .map((value) => cleanText(value).toLowerCase())
      .filter(Boolean);

    return haystack.some((value) => value.includes(country));
  });
}

function buildStandardSearchBody(queryText: string, filters: FilterState, platform: Platform) {
  const globalInfluencer = filters.influencer;
  const audienceFilters = filters.audience;
  const platformFilters = filters.platform[platform] || {};
  const influencer: Record<string, unknown> = {};
  const audience: Record<string, unknown> = {};

  setMinMaxRange(
    influencer,
    "followers",
    toNumber(platformFilters.followersMin),
    toNumber(platformFilters.followersMax)
  );

  setMinMaxRange(
    influencer,
    "views",
    toNumber(platformFilters.avgViewsMin),
    toNumber(platformFilters.avgViewsMax)
  );

  setMinMaxRange(
    influencer,
    "engagements",
    toNumber(platformFilters.engagementsMin),
    toNumber(platformFilters.engagementsMax)
  );

  const engagementRateMin = clamp01PercentUi(platformFilters.engagementRateMin);
  if (engagementRateMin != null) influencer.engagementRate = engagementRateMin;

  if (platformFilters.languageCode) {
    influencer.language = platformFilters.languageCode;
  }

  if (platformFilters.lastPostedDays != null) {
    influencer.lastposted = Math.max(30, Number(platformFilters.lastPostedDays));
  }

  const influencerLocationIds = parseIdList(platformFilters.locationIdsText);
  if (influencerLocationIds.length) {
    influencer.location = influencerLocationIds;
  }

  if (globalInfluencer.isVerified) {
    influencer.isVerified = true;
  }

  const normalizedAge = normalizeInfluencerAgeRange(globalInfluencer.ageMin, globalInfluencer.ageMax);
  if (normalizedAge) {
    influencer.age = normalizedAge;
  }

  if (globalInfluencer.gender) {
    influencer.gender = globalInfluencer.gender;
  }

  if (platformFilters.bioQuery) {
    influencer.bio = platformFilters.bioQuery;
  }

  const explicitHandles = extractExplicitHandles(queryText);
  const keywordQuery = cleanText(queryText);

  if (platformFilters.keywords) {
    influencer.keywords = platformFilters.keywords;
  } else if (keywordQuery && explicitHandles.length === 0) {
    influencer.keywords = keywordQuery;
  }

  const relevance = explicitHandles.length
    ? explicitHandles.map((handle) => `@${handle}`)
    : uniqStrings([
        ...splitLooseTokens(cleanText(platformFilters.relevance)),
        ...splitLooseTokens(keywordQuery),
      ]).slice(0, 100);

  if (relevance.length) {
    influencer.relevance = relevance;
  }

  const audienceRelevanceHandles = splitCommaList(cleanText(platformFilters.audienceRelevance))
    .map((item) => (item.startsWith("@") ? item : `@${item}`));
  if (audienceRelevanceHandles.length) {
    influencer.audienceRelevance = audienceRelevanceHandles;
  }

  if (platformFilters.hasAudienceData != null) {
    influencer.hasAudienceData = platformFilters.hasAudienceData;
  }

  if (platformFilters.contactEmailOnly) {
    influencer.hasContactDetails = [{ contactType: "email", filterAction: "must" }];
  }

  const textTags = parseTextTags(platformFilters.textTags);
  if (textTags.length && (platform === "instagram" || platform === "tiktok")) {
    influencer.textTags = textTags;
  }

  if (
    platformFilters.followersGrowthInterval &&
    platformFilters.followersGrowthOperator &&
    platformFilters.followersGrowthValue != null
  ) {
    influencer.followersGrowthRate = {
      interval: platformFilters.followersGrowthInterval,
      operator: platformFilters.followersGrowthOperator,
      value: platformFilters.followersGrowthValue,
    };
  }

  if (
    platform === "youtube" &&
    platformFilters.viewsGrowthInterval &&
    platformFilters.viewsGrowthOperator &&
    platformFilters.viewsGrowthValue != null
  ) {
    influencer.viewsGrowthRate = {
      interval: platformFilters.viewsGrowthInterval,
      operator: platformFilters.viewsGrowthOperator,
      value: platformFilters.viewsGrowthValue,
    };
  }

  if (
    platform === "tiktok" &&
    platformFilters.likesGrowthInterval &&
    platformFilters.likesGrowthOperator &&
    platformFilters.likesGrowthValue != null
  ) {
    influencer.likesGrowthRate = {
      interval: platformFilters.likesGrowthInterval,
      operator: platformFilters.likesGrowthOperator,
      value: platformFilters.likesGrowthValue,
    };
  }

  if (platform === "instagram") {
    setMinMaxRange(
      influencer,
      "reelsPlays",
      toNumber(platformFilters.reelsPlaysMin),
      toNumber(platformFilters.reelsPlaysMax)
    );

    if (platformFilters.hasSponsoredPosts) influencer.hasSponsoredPosts = true;
    if (platformFilters.hasYouTube) influencer.hasYouTube = true;

    const interests = parseIdList(platformFilters.interestsIdsText);
    if (interests.length) influencer.interests = interests;

    const brands = parseIdList(platformFilters.brandsIdsText);
    if (brands.length) influencer.brands = brands;

    const accountTypes = parseAccountTypes(platformFilters.igAccountTypesText);
    if (accountTypes.length) influencer.accountTypes = accountTypes;
  }

  if (platform === "youtube" && platformFilters.isOfficialArtist) {
    influencer.isOfficialArtist = true;
  }

  if (platform === "tiktok") {
    setMinMaxRange(
      influencer,
      "shares",
      toNumber(platformFilters.sharesMin),
      toNumber(platformFilters.sharesMax)
    );
    setMinMaxRange(
      influencer,
      "saves",
      toNumber(platformFilters.savesMin),
      toNumber(platformFilters.savesMax)
    );
  }

  const weightedLocations = buildWeightedLocation(
    audienceFilters.locationIdsText,
    audienceFilters.locationWeight
  );
  if (weightedLocations.length) {
    audience.location = weightedLocations;
  }

  if (audienceFilters.languageCode) {
    audience.language = {
      id: audienceFilters.languageCode,
      weight: weightOrDefault(audienceFilters.languageWeight, 0.2),
    };
  }

  if (audienceFilters.gender) {
    audience.gender = {
      id: audienceFilters.gender,
      weight: weightOrDefault(audienceFilters.genderWeight, 0.5),
    };
  }

  if (audienceFilters.ageBucket) {
    audience.age = [
      {
        id: audienceFilters.ageBucket,
        weight: weightOrDefault(audienceFilters.ageWeight, 0.3),
      },
    ];
  }

  if (platform === "instagram") {
    const audienceInterests = buildWeightedLocation(
      audienceFilters.interestsIdsText,
      audienceFilters.interestsWeight
    );
    if (audienceInterests.length) {
      audience.interests = audienceInterests;
    }

    if (audienceFilters.credibilityMin != null) {
      audience.credibility = audienceFilters.credibilityMin;
    }
  }

  const filter: Record<string, unknown> = {};
  if (Object.keys(influencer).length) filter.influencer = influencer;
  if (Object.keys(audience).length) filter.audience = audience;

  return {
    page: 0,
    calculationMethod: "median",
    sort: { field: "followers", direction: "desc" as const },
    filter,
  };
}

function buildAiFilters(queryText: string, filters: FilterState, platforms: Platform[]) {
  const aiQuery = cleanText(filters.search.aiQuery || queryText);
  const selectedPlatformFilters = platforms.map((platform) => filters.platform[platform] || {});

  const followersMin = minDefined(selectedPlatformFilters.map((item) => toNumber(item.followersMin)));
  const followersMax = maxDefined(selectedPlatformFilters.map((item) => toNumber(item.followersMax)));
  const engagementRateMin = minDefined(
    selectedPlatformFilters.map((item) => clamp01PercentUi(item.engagementRateMin))
  );
  const languageCode = firstDefined(
    selectedPlatformFilters.map((item) => cleanText(item.languageCode) || undefined)
  );
  const lastPostedDays = minDefined(
    selectedPlatformFilters.map((item) => toNumber(item.lastPostedDays))
  );

  const aiFilters: Record<string, unknown> = {};

  setMinMaxRange(aiFilters, "followersCount", followersMin, followersMax);

  if (filters.influencer.gender) {
    aiFilters.gender = filters.influencer.gender;
  }

  const aiAge = normalizeAiAgeRange(filters.influencer.ageMin, filters.influencer.ageMax);
  if (aiAge) {
    aiFilters.age = aiAge;
  }

  if (engagementRateMin != null) {
    aiFilters.engagementRate = { min: engagementRateMin };
  }

  if (languageCode) {
    aiFilters.language = languageCode;
  }

  if (lastPostedDays != null) {
    aiFilters.lastPostedInDays = Math.max(30, lastPostedDays);
  }

  if (filters.search.aiHasEmail) {
    aiFilters.hasEmail = true;
  }

  if (filters.search.aiContentType) {
    aiFilters.contentType = filters.search.aiContentType;
  }

  if (filters.search.aiMaxPostAgeMonths) {
    aiFilters.maxPostAgeMonths = filters.search.aiMaxPostAgeMonths;
  }

  if (filters.search.aiUsername) {
    aiFilters.username = filters.search.aiUsername;
  }

  if (filters.search.aiAccountType) {
    aiFilters.accountType = filters.search.aiAccountType;
  }

  const aiBrands = parseStringList(filters.search.aiBrandsText);
  if (aiBrands.length) {
    aiFilters.brands = aiBrands;
  }

  const aiLocations = parseIdList(filters.audience.locationIdsText);
  if (aiLocations.length) {
    aiFilters.locations = aiLocations;
  }

  if (filters.audience.credibilityMin != null && platforms.includes("instagram")) {
    aiFilters.audience = { credibility: filters.audience.credibilityMin };
  }

  return {
    page: 0,
    query: aiQuery,
    filters: aiFilters,
  };
}

export function useInfluencerSearch(platforms: Platform[]) {
  const [filters, setFilters] = useState<FilterState>(createDefaultFilters());
  const [allResults, setAllResults] = useState<UiResult[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRaw, setLastRaw] = useState<unknown>(null);
  const lastQueryRef = useRef("");

  const updateFilter = useCallback((path: string, value: unknown) => {
    setFilters((current) => setNestedFilterValue(current, path, value));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(createDefaultFilters());
  }, []);

  const fetchExactUsers = useCallback(
    async (queryText: string): Promise<UiResult[]> => {
      const handles = extractExplicitHandles(queryText);
      if (!handles.length) return [];

      const search = new URLSearchParams({
        q: handles.join(","),
        platforms: (platforms.length ? platforms : ["instagram"]).join(","),
      });

      const response = await fetch(`${API_USERS_ENDPOINT}?${search.toString()}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !Array.isArray(data?.results)) return [];

      return data.results
        .map((item: BackendResult) => mapBackendResult(item, platforms[0] || "instagram", "exact"))
        .filter(Boolean) as UiResult[];
    },
    [platforms]
  );

  const runSearch = useCallback(
    async ({ queryText = "" }: SearchArgs = {}) => {
      const value = queryText.trim();
      lastQueryRef.current = value;

      const brandId = getBrandIdFromStorage();
      if (!brandId) {
        setError("brandId is missing in localStorage.");
        setAllResults([]);
        setVisibleCount(PAGE_SIZE);
        return;
      }

      const selectedPlatforms = platforms.length ? platforms : (["instagram"] as Platform[]);
      const explicitHandles = extractExplicitHandles(value);
      const requestedMode = filters.search.mode || "combined";

      const shouldRunExact =
        explicitHandles.length > 0 && filters.search.exactHandleBoost !== false;

      const shouldRunAi = shouldRunAiSearch(value, filters);

      const effectiveMode =
        requestedMode === "ai"
          ? "ai"
          : requestedMode === "standard"
          ? "standard"
          : shouldRunAi
          ? "combined"
          : "standard";

      setLoading(true);
      setError(null);
      setVisibleCount(PAGE_SIZE);

      try {
        const unifiedPayload: Record<string, any> = {
          brandId,
          platforms: selectedPlatforms,
          searchMode: effectiveMode,
        };

        if (effectiveMode !== "ai") {
          unifiedPayload.body = buildStandardSearchBody(value, filters, selectedPlatforms[0]);
        }

        if (effectiveMode !== "standard") {
          unifiedPayload.ai = buildAiFilters(value, filters, selectedPlatforms);
        }

        const unifiedPromise = fetch(API_UNIFIED_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(unifiedPayload),
        }).then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data?.error || "Unified search failed");
          return data;
        });

        const exactPromise = shouldRunExact ? fetchExactUsers(value) : Promise.resolve([]);

        const [unifiedData, exactHits] = await Promise.all([unifiedPromise, exactPromise]);

        const unifiedResults = Array.isArray(unifiedData?.results)
          ? unifiedData.results
              .map((item: BackendResult) =>
                mapBackendResult(item, item.platform || selectedPlatforms[0], item.searchType || "standard")
              )
              .filter(Boolean) as UiResult[]
          : [];

        const merged = mergeResults([...exactHits, ...unifiedResults]);
        const filtered = applyClientFilters(merged, filters);

        setAllResults(filtered);
        setLastRaw({
          unified: unifiedData,
          exact: exactHits,
          effectiveMode,
          shouldRunExact,
          shouldRunAi,
        });

        if (!filtered.length) {
          setError(null);
        }
      } catch (err: any) {
        setError(err?.message || "Search failed.");
        setAllResults([]);
        setLastRaw(null);
      } finally {
        setLoading(false);
      }
    },
    [fetchExactUsers, filters, platforms]
  );

  const loadMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + PAGE_SIZE, allResults.length));
  }, [allResults.length]);

  const loadAll = useCallback(() => {
    setVisibleCount(allResults.length);
  }, [allResults.length]);

  const visibleResults = useMemo(
    () => allResults.slice(0, visibleCount),
    [allResults, visibleCount]
  );

  const searchState: SearchState = useMemo(
    () => ({
      loading,
      error,
      results: visibleResults,
      total: allResults.length,
      hasMore: visibleCount < allResults.length,
      rawResponse: lastRaw,
    }),
    [allResults.length, error, lastRaw, loading, visibleCount, visibleResults]
  );

  return {
    searchState,
    filters,
    updateFilter,
    runSearch,
    resetFilters,
    loadMore,
    loadAll,
    buildPayload: () => {
      const selectedPlatforms = platforms.length ? platforms : (["instagram"] as Platform[]);
      const value = lastQueryRef.current;
      const requestedMode = filters.search.mode || "combined";
      const shouldRunAi = shouldRunAiSearch(value, filters);

      const effectiveMode =
        requestedMode === "ai"
          ? "ai"
          : requestedMode === "standard"
          ? "standard"
          : shouldRunAi
          ? "combined"
          : "standard";

      const payload: Record<string, any> = {
        brandId: getBrandIdFromStorage(),
        platforms: selectedPlatforms,
        searchMode: effectiveMode,
      };

      if (effectiveMode !== "ai") {
        payload.body = buildStandardSearchBody(value, filters, selectedPlatforms[0]);
      }

      if (effectiveMode !== "standard") {
        payload.ai = buildAiFilters(value, filters, selectedPlatforms);
      }

      return payload;
    },
  };
}