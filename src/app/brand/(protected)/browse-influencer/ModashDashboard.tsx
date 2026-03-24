"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ResultsGrid } from "./ResultsGrid";
import { useInfluencerSearch } from "./useInfluencerSearch";
import type { Platform } from "./filters";
import { SearchHeader } from "./SearchHeader";
import { DetailPanel } from "./DetailPanel";
import { useInfluencerReport } from "./useInfluencerReport";
import type { Platform as ReportPlatform } from "./types";
import { useEmailStatus } from "./useEmailStatus";

function isFilled(value: any): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return true;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.values(value).some(isFilled);
  }
  return false;
}

export default function ModashDashboard() {
  const [platforms, setPlatforms] = useState<Platform[]>([
    "instagram",
    "tiktok",
    "youtube",
  ]);
  const [queryText, setQueryText] = useState("");
  const [brandId, setBrandId] = useState<string>("");

  useEffect(() => {
    const id = localStorage.getItem("brandId") || "";
    if (id) setBrandId(id);
  }, []);

  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] =
    useState<ReportPlatform | null>(null);
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);
  const [calculationMethod, setCalculationMethod] = useState<
    "median" | "average"
  >("average");

  const {
    report,
    rawReport,
    loading: loadingReport,
    error: reportError,
    lastFetchedAt,
    fetchReport,
  } = useInfluencerReport();

  const { exists: emailExists, checkStatus } = useEmailStatus();

  const {
    searchState,
    filters,
    updateFilter,
    runSearch,
    resetFilters,
    loadMore,
    loadAll,
  } = useInfluencerSearch(platforms);

  const primaryPlatform: Platform = useMemo(
    () => platforms[0] ?? "instagram",
    [platforms]
  );

  const activeFilterCount = useMemo(() => {
    const influencerCount = Object.values(filters?.influencer ?? {}).filter(
      isFilled
    ).length;
    const audienceCount = Object.values(filters?.audience ?? {}).filter(
      isFilled
    ).length;

    return influencerCount + audienceCount;
  }, [filters]);

  const onApplyFilters = useCallback(() => {
    runSearch({ reset: true, queryText });
  }, [runSearch, queryText]);

  const onViewProfile = useCallback(
    (influencer: any) => {
      const inferredPlatform: ReportPlatform =
        (influencer?.platform as ReportPlatform) ||
        (platforms[0] as unknown as ReportPlatform) ||
        "youtube";

      const idCandidate =
        influencer?.id ||
        influencer?.userId ||
        influencer?.username ||
        influencer?.handle ||
        influencer?.url;

      if (!idCandidate) return;

      const handleCandidate = influencer?.username ?? null;
      const idStr = String(idCandidate);

      setSelectedId(idStr);
      setSelectedPlatform(inferredPlatform);
      setSelectedHandle(handleCandidate ? String(handleCandidate) : null);
      setPanelOpen(true);

      fetchReport(idStr, inferredPlatform, calculationMethod);

      if (handleCandidate) {
        const safeHandle = String(handleCandidate).startsWith("@")
          ? String(handleCandidate)
          : `@${String(handleCandidate)}`;
        checkStatus(safeHandle, inferredPlatform);
      }
    },
    [calculationMethod, fetchReport, platforms, checkStatus]
  );

  const handleRefreshReport = useCallback(async () => {
    if (!selectedId || !selectedPlatform) return;

    await fetchReport(
      selectedId,
      selectedPlatform,
      calculationMethod,
      undefined,
      true
    );
  }, [selectedId, selectedPlatform, calculationMethod, fetchReport]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="space-y-5">
          <SearchHeader
            queryText={queryText}
            setQueryText={setQueryText}
            loading={searchState.loading}
            onSearch={(q) => runSearch({ reset: true, queryText: q })}
            platforms={platforms}
            setPlatforms={setPlatforms}
            filters={filters}
            updateFilter={updateFilter}
            onResetFilters={resetFilters}
            onApplyFilters={onApplyFilters}
            activeFilterCount={activeFilterCount}
          />

          <ResultsGrid
            platform={primaryPlatform}
            results={searchState.results}
            loading={searchState.loading}
            error={searchState.error}
            total={searchState.total}
            hasMore={searchState.hasMore}
            onLoadMore={loadMore}
            onLoadAll={loadAll}
            onViewProfile={onViewProfile}
          />
        </div>
      </div>

      <DetailPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        loading={loadingReport}
        error={reportError}
        data={report}
        raw={rawReport}
        platform={selectedPlatform}
        onChangeCalc={(calc) => {
          setCalculationMethod(calc);
          if (selectedId && selectedPlatform) {
            fetchReport(selectedId, selectedPlatform, calc);
          }
        }}
        emailExists={emailExists}
        brandId={brandId}
        handle={selectedHandle ?? null}
        lastFetchedAt={lastFetchedAt}
        onRefreshReport={handleRefreshReport}
      />
    </div>
  );
}