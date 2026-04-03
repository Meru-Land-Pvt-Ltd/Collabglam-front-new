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
const API_SEARCH_ENDPOINT = process.env.NEXT_PUBLIC_MODASH_FRONTEND_SEARCH_ENDPOINT || `${API_BASE}/modash/search`;
const API_USERS_ENDPOINT = process.env.NEXT_PUBLIC_MODASH_FRONTEND_USERS_ENDPOINT || `${API_BASE}/modash/users`;

type SearchArgs = {
  reset?: boolean;
  queryText?: string;
};

type BackendResult = {
  id?: string | number;
  userId?: string | number;
  username?: string;
  handle?: string;
  fullname?: string;
  name?: string;
  followers?: number;
  engagementRate?: number;
  picture?: string;
  avatar?: string;
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
};

type UiResult = {
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
  categories?: string[];
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

function dedupeResults(items: UiResult[]): UiResult[] {
  const map = new Map<string, UiResult>();

  for (const item of items) {
    const key = `${item.platform}:${item.userId || item.username || item.id}`.toLowerCase();
    const previous = map.get(key);

    if (!previous) {
      map.set(key, item);
      continue;
    }

    if ((item.followers || 0) > (previous.followers || 0)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

function splitQueryToRelevance(queryText: string): string[] {
  return queryText
    .split(/[\n,]+/)
    .flatMap((item) => item.split(/\s+/))
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractHandles(queryText: string): string[] {
  const found = new Set<string>();
  const value = queryText.trim();

  for (const match of value.matchAll(/(?:instagram\.com\/|tiktok\.com\/@|youtube\.com\/@)([A-Za-z0-9._-]{2,30})/gi)) {
    found.add(match[1]);
  }

  for (const match of value.matchAll(/(^|\s)@([A-Za-z0-9._-]{2,30})\b/g)) {
    found.add(match[2]);
  }

  if (/^[A-Za-z0-9._-]{2,30}$/.test(value)) {
    found.add(value.replace(/^@/, ""));
  }

  return Array.from(found);
}

function mapBackendResult(item: BackendResult, fallbackPlatform: Platform): UiResult | null {
  const platform = item.platform || fallbackPlatform;
  const id = String(item.userId || item.id || item.username || item.handle || item.url || item.link || "").trim();
  if (!id) return null;

  const username = cleanText(item.username || item.handle || "");
  const handle = cleanText(item.handle || item.username || "") || undefined;
  const fullname = cleanText(item.fullname || item.name || username || handle || "Unknown");
  const location = cleanText(item.location) || [item.city, item.state, item.country].filter(Boolean).join(", ") || undefined;

  return {
    id,
    userId: item.userId != null ? String(item.userId) : undefined,
    username,
    handle,
    fullname,
    name: fullname,
    followers: Number(item.followers || 0),
    engagementRate: Number(item.engagementRate || 0),
    picture: cleanText(item.picture || item.avatar) || undefined,
    avatar: cleanText(item.avatar || item.picture) || undefined,
    url: cleanText(item.url || item.link) || undefined,
    link: cleanText(item.link || item.url) || undefined,
    platform,
    isVerified: item.isVerified ?? item.verifiedStatus,
    verifiedStatus: item.verifiedStatus ?? item.isVerified,
    location,
    country: cleanText(item.country) || undefined,
    categories: Array.isArray(item.categories) ? item.categories : [],
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

function buildSearchBody(queryText: string, filters: FilterState, platform: Platform) {
  const globalInfluencer = filters.influencer;
  const platformFilters = filters.platform[platform] || {};

  const influencer: Record<string, unknown> = {};

  const followersMin = toNumber(platformFilters.followersMin);
  const followersMax = toNumber(platformFilters.followersMax);
  if (followersMin != null || followersMax != null) {
    influencer.followers = {
      ...(followersMin != null ? { min: followersMin } : {}),
      ...(followersMax != null ? { max: followersMax } : {}),
    };
  }

  const avgViewsMin = toNumber(platformFilters.avgViewsMin);
  const avgViewsMax = toNumber(platformFilters.avgViewsMax);
  if (avgViewsMin != null || avgViewsMax != null) {
    influencer.views = {
      ...(avgViewsMin != null ? { min: avgViewsMin } : {}),
      ...(avgViewsMax != null ? { max: avgViewsMax } : {}),
    };
  }

  const engagementRateMin = toNumber(platformFilters.engagementRateMin);
  if (engagementRateMin != null && engagementRateMin > 0) {
    influencer.engagementRate = Math.min(1, Math.max(0, engagementRateMin / 100));
  }

  if (platformFilters.languageCode) {
    influencer.language = platformFilters.languageCode;
  }

  if (platformFilters.lastPostedDays != null) {
    influencer.lastposted = platformFilters.lastPostedDays;
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

  const relevance = splitQueryToRelevance(queryText);
  if (relevance.length) {
    influencer.relevance = relevance;
  }

  return {
    page: 0,
    calculationMethod: "median",
    sort: { field: "followers", direction: "desc" as const },
    filter: { influencer },
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
      const handles = extractHandles(queryText);
      if (!handles.length) return [];

      const search = new URLSearchParams({
        q: handles.join(","),
        platforms: (platforms.length ? platforms : ["instagram"]).join(","),
      });

      const response = await fetch(`${API_USERS_ENDPOINT}?${search.toString()}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(data?.results)) return [];

      return data.results
        .map((item: BackendResult) => mapBackendResult(item, platforms[0] || "instagram"))
        .filter(Boolean) as UiResult[];
    },
    [platforms],
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

      setLoading(true);
      setError(null);
      setVisibleCount(PAGE_SIZE);

      try {
        const [exactHits, responses] = await Promise.all([
          fetchExactUsers(value),
          Promise.all(
            selectedPlatforms.map(async (platform) => {
              const body = buildSearchBody(value, filters, platform);
              const response = await fetch(API_SEARCH_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  brandId,
                  platforms: [platform],
                  body,
                }),
              });

              const data = await response.json().catch(() => ({}));
              if (!response.ok) {
                throw new Error(data?.error || `Search failed for ${platform}`);
              }

              return { platform, data };
            }),
          ),
        ]);

        const serverResults = responses.flatMap(({ platform, data }) => {
          const bag = Array.isArray(data?.results) ? data.results : [];
          return bag
            .map((item: BackendResult) => mapBackendResult(item, platform))
            .filter(Boolean) as UiResult[];
        });

        const merged = dedupeResults([...exactHits, ...serverResults]);
        const filtered = applyClientFilters(merged, filters);

        setAllResults(filtered);
        setLastRaw(responses.map((item) => item.data));
      } catch (err: any) {
        setError(err?.message || "Search failed.");
        setAllResults([]);
        setLastRaw(null);
      } finally {
        setLoading(false);
      }
    },
    [fetchExactUsers, filters, platforms],
  );

  const loadMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + PAGE_SIZE, allResults.length));
  }, [allResults.length]);

  const loadAll = useCallback(() => {
    setVisibleCount(allResults.length);
  }, [allResults.length]);

  const visibleResults = useMemo(() => allResults.slice(0, visibleCount), [allResults, visibleCount]);

  const searchState: SearchState = useMemo(
    () => ({
      loading,
      error,
      results: visibleResults,
      total: allResults.length,
      hasMore: visibleCount < allResults.length,
      rawResponse: lastRaw,
    }),
    [allResults.length, error, lastRaw, loading, visibleCount, visibleResults],
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
      const firstPlatform = platforms[0] || "instagram";
      return buildSearchBody(lastQueryRef.current, filters, firstPlatform);
    },
  };
}
