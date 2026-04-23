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

const DETAIL_PANEL_STORAGE_KEY = "brand_modash_detail_panel_state";
const SEARCH_UI_STORAGE_KEY = "brand_modash_search_ui_state";

type SavedDetailPanelState = {
  open: boolean;
  selectedId: string | null;
  selectedPlatform: ReportPlatform | null;
  selectedHandle: string | null;
};

type SavedSearchUiState = {
  queryText: string;
  platforms: Platform[];
  results: any[];
  total?: number;
  hasMore?: boolean;
};

function getInfluencerIdentity(influencer: any): string {
  return String(
    influencer?.userId ||
      influencer?.id ||
      influencer?.username ||
      influencer?.handle ||
      influencer?.url ||
      ""
  ).trim();
}

export default function ModashDashboard() {
  const [platforms, setPlatforms] = useState<Platform[]>([
    "youtube",
  ]);
  const [queryText, setQueryText] = useState("");
  const [brandId, setBrandId] = useState<string>("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] =
    useState<ReportPlatform | null>(null);
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);
  const [calculationMethod, setCalculationMethod] = useState<
    "median" | "average"
  >("average");
  const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null);

  const [restoredSearch, setRestoredSearch] =
    useState<SavedSearchUiState | null>(null);
  const [pendingInitialSearch, setPendingInitialSearch] = useState<
    string | null
  >(null);
  const [searchStateRestored, setSearchStateRestored] = useState(false);

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
    () => platforms[0] ?? "youtube",
    [platforms]
  );
  const activeFilterCount = useMemo(
    () => countActiveFilters(filters),
    [filters]
  );

  const persistPanelState = useCallback((next: SavedDetailPanelState) => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      DETAIL_PANEL_STORAGE_KEY,
      JSON.stringify(next)
    );
  }, []);

  const clearPanelState = useCallback(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(DETAIL_PANEL_STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawSaved = window.sessionStorage.getItem(SEARCH_UI_STORAGE_KEY);
    if (!rawSaved) {
      setSearchStateRestored(true);
      return;
    }

    try {
      const saved: SavedSearchUiState = JSON.parse(rawSaved);

      if (typeof saved?.queryText === "string") {
        setQueryText(saved.queryText);
      }

      if (Array.isArray(saved?.platforms) && saved.platforms.length) {
        setPlatforms(["youtube"]);
      }

      setRestoredSearch(saved);

      if (saved?.queryText?.trim()) {
        setPendingInitialSearch(saved.queryText);
      }
    } catch {
      window.sessionStorage.removeItem(SEARCH_UI_STORAGE_KEY);
    } finally {
      setSearchStateRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!searchStateRestored) return;
    if (!pendingInitialSearch?.trim()) return;

    runSearch({ queryText: pendingInitialSearch });
    setPendingInitialSearch(null);
  }, [pendingInitialSearch, runSearch, searchStateRestored]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!searchStateRestored) return;

    const payload: SavedSearchUiState = {
      queryText,
      platforms,
      results: Array.isArray(searchState.results) ? searchState.results : [],
      total: searchState.total,
      hasMore: searchState.hasMore,
    };

    window.sessionStorage.setItem(
      SEARCH_UI_STORAGE_KEY,
      JSON.stringify(payload)
    );
  }, [
    queryText,
    platforms,
    searchState.results,
    searchState.total,
    searchState.hasMore,
    searchStateRestored,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawSaved = window.sessionStorage.getItem(DETAIL_PANEL_STORAGE_KEY);
    if (!rawSaved) return;

    try {
      const saved: SavedDetailPanelState = JSON.parse(rawSaved);

      if (!saved?.open || !saved?.selectedId || !saved?.selectedPlatform) {
        return;
      }

      setSelectedId(saved.selectedId);
      setSelectedPlatform(saved.selectedPlatform);
      setSelectedHandle(saved.selectedHandle ?? null);
      setPanelOpen(true);

      fetchReport(saved.selectedId, saved.selectedPlatform, calculationMethod);
    } catch {
      window.sessionStorage.removeItem(DETAIL_PANEL_STORAGE_KEY);
    }
  }, [fetchReport, calculationMethod]);

  const visibleResults = useMemo(() => {
    if (Array.isArray(searchState.results) && searchState.results.length > 0) {
      return searchState.results;
    }
    return restoredSearch?.results ?? [];
  }, [searchState.results, restoredSearch]);

  const visibleTotal =
    searchState.total != null ? searchState.total : restoredSearch?.total;

  const visibleHasMore =
    typeof searchState.hasMore === "boolean"
      ? searchState.hasMore
      : restoredSearch?.hasMore;

  useEffect(() => {
    if (selectedInfluencer || !selectedId) return;

    const matched = visibleResults.find(
      (item) => getInfluencerIdentity(item) === selectedId
    );

    if (matched) {
      setSelectedInfluencer(matched);
    }
  }, [selectedId, selectedInfluencer, visibleResults]);

  const onApplyFilters = useCallback(() => {
    // runSearch({ queryText });
  }, [queryText, runSearch]);

  const onViewProfile = useCallback(
    (influencer: any) => {
      const inferredPlatform = influencer?.platform as
        | ReportPlatform
        | undefined;
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

      setSelectedInfluencer(influencer);
      setSelectedId(idStr);
      setSelectedPlatform(inferredPlatform);
      setSelectedHandle(
        handleCandidate ? String(handleCandidate).replace(/^@/, "") : null
      );
      setPanelOpen(true);

      persistPanelState({
        open: true,
        selectedId: idStr,
        selectedPlatform: inferredPlatform,
        selectedHandle: handleCandidate
          ? String(handleCandidate).replace(/^@/, "")
          : null,
      });

      fetchReport(idStr, inferredPlatform, calculationMethod);

      if (handleCandidate) {
        const safeHandle = String(handleCandidate).startsWith("@")
          ? String(handleCandidate)
          : `@${String(handleCandidate)}`;
        checkStatus(safeHandle, inferredPlatform);
      }
    },
    [calculationMethod, checkStatus, fetchReport, persistPanelState]
  );

  const handlePanelClose = useCallback(() => {
    setPanelOpen(false);
    setSelectedId(null);
    setSelectedPlatform(null);
    setSelectedHandle(null);
    setSelectedInfluencer(null);
    clearPanelState();
  }, [clearPanelState]);

  const handleRefreshReport = useCallback(async () => {
    if (!selectedId || !selectedPlatform) return;
    await fetchReport(
      selectedId,
      selectedPlatform,
      calculationMethod,
      undefined,
      true
    );
  }, [calculationMethod, fetchReport, selectedId, selectedPlatform]);

  const handlePanelPlatformChange = useCallback(
    (profile: any) => {
      const nextPlatform = (profile?.provider ||
        profile?.platform) as ReportPlatform | undefined;
      const nextId =
        profile?.modashId ||
        profile?._id ||
        profile?.userId ||
        profile?.id;

      if (!nextPlatform || !nextId) return;

      const nextHandle = profile?.username ?? profile?.handle ?? null;
      const nextIdString = String(nextId);
      const nextHandleString = nextHandle
        ? String(nextHandle).replace(/^@/, "")
        : null;

      setSelectedId(nextIdString);
      setSelectedPlatform(nextPlatform);
      setSelectedHandle(nextHandleString);

      persistPanelState({
        open: true,
        selectedId: nextIdString,
        selectedPlatform: nextPlatform,
        selectedHandle: nextHandleString,
      });

      fetchReport(nextIdString, nextPlatform, calculationMethod);

      if (nextHandle) {
        const safeHandle = String(nextHandle).startsWith("@")
          ? String(nextHandle)
          : `@${String(nextHandle)}`;
        checkStatus(safeHandle, nextPlatform);
      }
    },
    [calculationMethod, checkStatus, fetchReport, persistPanelState]
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="space-y-5">
          <SearchHeader
            queryText={queryText}
            setQueryText={setQueryText}
            loading={searchState.loading}
            onSearch={(q) => {
              setQueryText(q);
              runSearch({ queryText: q });
            }}
            platforms={platforms}
            setPlatforms={setPlatforms}
            filters={filters}
            updateFilter={updateFilter}
            onResetFilters={() => {
              resetFilters();
              setQueryText("");
              setRestoredSearch(null);
              if (typeof window !== "undefined") {
                window.sessionStorage.removeItem(SEARCH_UI_STORAGE_KEY);
              }
            }}
            onApplyFilters={onApplyFilters}
            activeFilterCount={activeFilterCount}
          />

          <ResultsGrid
            platform={primaryPlatform}
            results={visibleResults}
            loading={searchState.loading}
            error={searchState.error}
            total={visibleTotal}
            hasMore={visibleHasMore}
            onLoadMore={loadMore}
            onLoadAll={loadAll}
            onViewProfile={onViewProfile}
          />
        </div>
      </div>

      <DetailPanel
        open={panelOpen}
        onClose={handlePanelClose}
        loading={loadingReport}
        error={reportError}
        data={report}
        raw={rawReport}
        platform={selectedPlatform}
        onChangeCalc={(calc) => {
          setCalculationMethod(calc);
          if (selectedId && selectedPlatform) {
            fetchReport(selectedId, selectedPlatform, calc);

            persistPanelState({
              open: true,
              selectedId,
              selectedPlatform,
              selectedHandle,
            });
          }
        }}
        emailExists={emailExists}
        brandId={brandId}
        handle={selectedHandle}
        lastFetchedAt={lastFetchedAt}
        onRefreshReport={handleRefreshReport}
        connectedProfiles={
          selectedInfluencer?.socialProfiles ??
          selectedInfluencer?.connectedProfiles ??
          selectedInfluencer?.profiles ??
          []
        }
        onPlatformChange={handlePanelPlatformChange}
      />
    </div>
  );
}