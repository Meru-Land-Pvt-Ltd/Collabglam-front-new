"use client";

import React from "react";
import { AlertCircle, ChevronDown, ChevronsDown, SlidersHorizontal } from "lucide-react";
import { InfluencerCard } from "./InfluencerCard";
import type { Platform } from "./filters";

interface ResultsGridProps {
  platform: Platform;
  results: any[];
  loading: boolean;
  error?: string;
  total?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onLoadAll?: () => void;
  onViewProfile?: (influencer: any) => void;
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

  if (loading && results.length === 0) {
    return (
      <div
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        aria-busy="true"
        aria-live="polite"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[520px] overflow-hidden rounded-[28px] border border-[#e3ded4] bg-white animate-pulse"
          >
            <div className="h-full w-full bg-gradient-to-br from-[#ece7dc] via-[#ddd7ca] to-[#c9b99e]" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-[22px] border border-[#e3ded4] bg-white p-12 text-center">
        <SlidersHorizontal className="mx-auto mb-4 h-10 w-10 text-[#8c8c8c]" />
        <h3 className="text-lg font-semibold text-[#1f1f1f]">No results found</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#777]">
          Try adjusting your platform or filters to find more creators.
        </p>
      </div>
    );
  }

  const countLabel = new Intl.NumberFormat().format(results.length);
  const totalLabel =
    total != null ? new Intl.NumberFormat().format(total) : undefined;

  return (
    <section aria-label="Search results" className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[20px] border border-[#e7e2d8] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-[#1f1f1f]">
            Results ({countLabel}
            {totalLabel ? ` / ${totalLabel}` : ""})
          </h2>
          <p className="mt-1 text-sm text-[#777]">
            Showing creators matching your selected filters
          </p>
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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {results.map((influencer, index) => (
          <InfluencerCard
            key={(influencer.id ?? influencer.username ?? influencer.url ?? index).toString()}
            platform={influencer.platform || platform}
            influencer={influencer}
            onViewProfile={onViewProfile}
          />
        ))}
      </div>
    </section>
  );
}