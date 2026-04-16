"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ResultsGrid } from "./ResultsGrid";
import { useInfluencerSearch } from "./useInfluencerSearch";
import type { Platform } from "./filters";
import { countActiveFilters } from "./filters";
import { SearchHeader } from "./SearchHeader";
import { DetailPanel } from "./DetailPanel";
import { useInfluencerReport } from "./useInfluencerReport";
import type { Platform as ReportPlatform } from "./types";
import { useEmailStatus } from "./useEmailStatus";

export default function ModashDashboard() {
  const [platforms, setPlatforms] = useState<Platform[]>(["instagram", "tiktok", "youtube"]);
  const [queryText, setQueryText] = useState("");
  const [brandId, setBrandId] = useState<string>("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<ReportPlatform | null>(null);
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);
  const [calculationMethod, setCalculationMethod] = useState<"median" | "average">("average");

  useEffect(() => {
    const id = localStorage.getItem("brandId") || "";
    if (id) setBrandId(id);
  }, []);

  const {
    report,
    rawReport,
    loading: loadingReport,
    error: reportError,
    lastFetchedAt,
    fetchReport,
  } = useInfluencerReport();

  const { exists: emailExists, checkStatus } = useEmailStatus();
  const { searchState, filters, updateFilter, runSearch, resetFilters, loadMore, loadAll } = useInfluencerSearch(platforms);

  const primaryPlatform: Platform = useMemo(() => platforms[0] ?? "instagram", [platforms]);
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const onApplyFilters = useCallback(() => {
    runSearch({ queryText });
  }, [queryText, runSearch]);

  const onViewProfile = useCallback(
    (influencer: any) => {
      const inferredPlatform = influencer?.platform as ReportPlatform | undefined;
      if (!inferredPlatform) return;

      const idCandidate =
        influencer?.userId ||
        influencer?.id ||
        influencer?.username ||
        influencer?.handle ||
        influencer?.url;

      if (!idCandidate) return;

      const handleCandidate = influencer?.username ?? influencer?.handle ?? null;
      const idStr = String(idCandidate);

      setSelectedId(idStr);
      setSelectedPlatform(inferredPlatform);
      setSelectedHandle(handleCandidate ? String(handleCandidate).replace(/^@/, "") : null);
      setPanelOpen(true);

      fetchReport(idStr, inferredPlatform, calculationMethod);

      if (handleCandidate) {
        const safeHandle = String(handleCandidate).startsWith("@")
          ? String(handleCandidate)
          : `@${String(handleCandidate)}`;
        checkStatus(safeHandle, inferredPlatform);
      }
    },
    [calculationMethod, checkStatus, fetchReport],
  );

  const handleRefreshReport = useCallback(async () => {
    if (!selectedId || !selectedPlatform) return;
    await fetchReport(selectedId, selectedPlatform, calculationMethod, undefined, true);
  }, [calculationMethod, fetchReport, selectedId, selectedPlatform]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="space-y-5">
          <SearchHeader
            queryText={queryText}
            setQueryText={setQueryText}
            loading={searchState.loading}
            onSearch={(q) => runSearch({ queryText: q })}
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
        handle={selectedHandle}
        lastFetchedAt={lastFetchedAt}
        onRefreshReport={handleRefreshReport}
      />
    </div>
  );
}
