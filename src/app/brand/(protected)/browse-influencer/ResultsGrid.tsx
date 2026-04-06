"use client";

import React, { useMemo } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronsDown,
  SlidersHorizontal,
} from "lucide-react";
import { InfluencerCard } from "./InfluencerCard";
import type { Platform } from "./filters";

interface ResultsGridProps {
  platform: Platform;
  results: any[];
  loading: boolean;
  error?: string | null;
  total?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onLoadAll?: () => void;
  onViewProfile?: (influencer: any) => void;
}

type SearchType = "exact" | "standard" | "ai" | "combined";

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function resolvePlatform(influencer: any, fallback: Platform): Platform {
  const value = cleanText(influencer?.platform || fallback).toLowerCase();
  if (value === "instagram" || value === "youtube" || value === "tiktok") {
    return value as Platform;
  }
  return fallback;
}

function getIdentity(influencer: any): string {
  return cleanText(
    influencer?.userId ??
      influencer?.id ??
      influencer?.username ??
      influencer?.handle ??
      influencer?.url ??
      influencer?.link ??
      influencer?.fullname ??
      influencer?.name ??
      ""
  );
}

function isRenderableInfluencer(influencer: any): boolean {
  if (!influencer || typeof influencer !== "object") return false;

  const identity = getIdentity(influencer);
  const hasName =
    !!cleanText(influencer?.fullname) ||
    !!cleanText(influencer?.fullName) ||
    !!cleanText(influencer?.name) ||
    !!cleanText(influencer?.username) ||
    !!cleanText(influencer?.handle);

  return !!identity && hasName;
}

function getSearchTypeWeight(type?: SearchType): number {
  switch (type) {
    case "combined":
      return 500;
    case "exact":
      return 400;
    case "ai":
      return 300;
    case "standard":
    default:
      return 100;
  }
}

function getResultScore(influencer: any): number {
  const followers = safeNumber(influencer?.followers ?? influencer?.followerCount);
  const engagementRate = safeNumber(influencer?.engagementRate);
  const matchedPostsCount = safeNumber(
    influencer?.aiMatchedPostsCount ?? influencer?.matchedPosts?.length
  );

  const normalizedEngagement = engagementRate > 1 ? engagementRate : engagementRate * 100;

  return (
    getSearchTypeWeight(influencer?.searchType) +
    (influencer?.isVerified || influencer?.verifiedStatus ? 30 : 0) +
    Math.min(matchedPostsCount, 10) * 12 +
    Math.min(Math.log10(followers + 1) * 18, 80) +
    Math.min(normalizedEngagement, 25)
  );
}

function buildStableKey(influencer: any, fallbackPlatform: Platform): string {
  const resolvedPlatform = resolvePlatform(influencer, fallbackPlatform);
  const identity = getIdentity(influencer).toLowerCase();
  return `${resolvedPlatform}::${identity}`;
}

function dedupeAndRankResults(results: any[], fallbackPlatform: Platform) {
  const bestByKey = new Map<string, any>();

  for (const influencer of Array.isArray(results) ? results : []) {
    if (!isRenderableInfluencer(influencer)) continue;

    const normalized = {
      ...influencer,
      platform: resolvePlatform(influencer, fallbackPlatform),
    };

    const stableKey = buildStableKey(normalized, fallbackPlatform);
    const score = getResultScore(normalized);
    const existing = bestByKey.get(stableKey);

    if (!existing || score > existing.__score) {
      bestByKey.set(stableKey, {
        ...normalized,
        __stableKey: stableKey,
        __score: score,
      });
    }
  }

  return Array.from(bestByKey.values()).sort((a, b) => {
    if (b.__score !== a.__score) return b.__score - a.__score;

    const bFollowers = safeNumber(b?.followers ?? b?.followerCount);
    const aFollowers = safeNumber(a?.followers ?? a?.followerCount);
    if (bFollowers !== aFollowers) return bFollowers - aFollowers;

    return cleanText(a?.username || a?.handle || a?.fullname || a?.name).localeCompare(
      cleanText(b?.username || b?.handle || b?.fullname || b?.name)
    );
  });
}

function countBySearchType(results: any[]) {
  return results.reduce((acc, item) => {
    const type = (item?.searchType || "standard") as SearchType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function ResultsGrid({
  platform,
  results,
  loading,
  error,
  total,
  hasMore,
  onLoadMore,
  onLoadAll,
  onViewProfile,
}: ResultsGridProps) {
  const displayResults = useMemo(
    () => dedupeAndRankResults(results, platform),
    [results, platform]
  );

  const typeCounts = useMemo(
    () => countBySearchType(displayResults),
    [displayResults]
  );

  const hiddenCount = Math.max(0, (results?.length || 0) - displayResults.length);

  if (error) {
    return (
      <div className="rounded-[22px] border border-red-200 bg-red-50 p-6" role="alert">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="font-semibold text-red-800">Search Error</p>
        </div>
        <p className="mt-1 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (loading && displayResults.length === 0) {
    return (
      <div
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        aria-busy="true"
        aria-live="polite"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="h-[520px] overflow-hidden rounded-[28px] border border-[#e3ded4] bg-white animate-pulse"
          >
            <div className="h-full w-full bg-gradient-to-br from-[#ece7dc] via-[#ddd7ca] to-[#c9b99e]" />
          </div>
        ))}
      </div>
    );
  }

  if (displayResults.length === 0) {
    return (
      <div className="rounded-[22px] border border-[#e3ded4] bg-white p-12 text-center">
        <SlidersHorizontal className="mx-auto mb-4 h-10 w-10 text-[#8c8c8c]" />
        <h3 className="text-lg font-semibold text-[#1f1f1f]">No results found</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#777]">
          Try adjusting your search, platform, or filters to find better creator matches.
        </p>
      </div>
    );
  }

  const shownLabel = new Intl.NumberFormat().format(displayResults.length);
  const totalLabel =
    total != null ? new Intl.NumberFormat().format(total) : undefined;

  return (
    <section aria-label="Search results" className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[20px] border border-[#e7e2d8] bg-white px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-[#1f1f1f]">
              Results ({shownLabel}
              {totalLabel ? ` / ${totalLabel}` : ""})
            </h2>
            <p className="mt-1 text-sm text-[#777]">
              Showing the strongest unique creator matches
            </p>
            {hiddenCount > 0 ? (
              <p className="mt-1 text-xs text-[#8a7f70]">
                Removed {hiddenCount} duplicate or incomplete result{hiddenCount > 1 ? "s" : ""}
              </p>
            ) : null}
          </div>

          {(hasMore || loading) && (
            <div className="flex flex-wrap items-center gap-2">
              {hasMore && onLoadMore && (
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={loading}
                  className="inline-flex h-10 items-center justify-center rounded-[12px] border border-[#d9d4ca] bg-white px-4 text-sm font-medium text-[#222] transition hover:bg-[#f8f6f2] disabled:opacity-60"
                >
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Load more
                </button>
              )}

              {hasMore && onLoadAll && (
                <button
                  type="button"
                  onClick={onLoadAll}
                  disabled={loading}
                  className="inline-flex h-10 items-center justify-center rounded-[12px] border border-[#d9d4ca] bg-white px-4 text-sm font-medium text-[#222] transition hover:bg-[#f8f6f2] disabled:opacity-60"
                >
                  <ChevronsDown className="mr-1 h-4 w-4" />
                  Load all
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[#666]">
          {typeCounts.combined ? (
            <span className="rounded-full border border-[#e5e0d6] bg-[#faf8f4] px-3 py-1">
              Combined: {typeCounts.combined}
            </span>
          ) : null}
          {typeCounts.exact ? (
            <span className="rounded-full border border-[#e5e0d6] bg-[#faf8f4] px-3 py-1">
              Exact: {typeCounts.exact}
            </span>
          ) : null}
          {typeCounts.ai ? (
            <span className="rounded-full border border-[#e5e0d6] bg-[#faf8f4] px-3 py-1">
              AI: {typeCounts.ai}
            </span>
          ) : null}
          {typeCounts.standard ? (
            <span className="rounded-full border border-[#e5e0d6] bg-[#faf8f4] px-3 py-1">
              Standard: {typeCounts.standard}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {displayResults.map((influencer) => (
          <InfluencerCard
            key={influencer.__stableKey}
            platform={influencer.platform || platform}
            influencer={influencer}
            onViewProfile={onViewProfile}
          />
        ))}
      </div>
    </section>
  );
}