"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { CaretDown } from "@phosphor-icons/react";
import type { FilterState, Platform } from "./filters";
import { platformTheme } from "./utils/platform";
import { MoreFiltersDropdown } from "./MoreFiltersDropdown";
import { PlatformFiltersDropdown } from "./PlatformFiltersDropdown";

interface SearchHeaderProps {
  queryText: string;
  setQueryText: (text: string) => void;
  loading: boolean;
  onSearch: (query: string) => void;
  platforms: Platform[];
  setPlatforms: (platforms: Platform[]) => void;
  filters: FilterState;
  updateFilter: (path: string, value: any) => void;
  onResetFilters: () => void;
  onApplyFilters: () => void;
  activeFilterCount?: number;
}

export function SearchHeader({
  queryText,
  setQueryText,
  loading,
  onSearch,
  platforms,
  setPlatforms,
  filters,
  updateFilter,
  onResetFilters,
  onApplyFilters,
  activeFilterCount = 0,
}: SearchHeaderProps) {
  const [platformMenuOpen, setPlatformMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const platformMenuRef = useRef<HTMLDivElement | null>(null);
  const filterAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (platformMenuRef.current && !platformMenuRef.current.contains(target)) {
        setPlatformMenuOpen(false);
      }
      if (filterAnchorRef.current && !filterAnchorRef.current.contains(target)) {
        setIsFilterOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPlatformMenuOpen(false);
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selectedPlatformsLabel = useMemo(() => {
    if (platforms.length === 3) return "All platforms";
    return platforms.map((platform) => platformTheme[platform]?.label || platform).join(", ");
  }, [platforms]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(queryText.trim());
  };

  return (
    <div className="sticky top-0 z-20 overflow-visible rounded-[24px] border border-[#e7e2d8] bg-white/95 p-4 shadow-sm backdrop-blur">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 xl:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a7a7a]" />
          <input
            type="text"
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            placeholder="Search for creators, usernames and keywords"
            className="h-12 w-full rounded-[14px] border border-[#ddd8cf] pl-11 pr-12 text-sm text-[#222] outline-none transition placeholder:text-[#8c8c8c] focus:border-[#bcb5aa] focus:bg-white"
          />
          {loading ? (
            <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#666]" />
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap xl:w-auto xl:flex-nowrap">
          <div className="relative w-full shrink-0 sm:w-auto" ref={platformMenuRef}>
            <button
              type="button"
              onClick={() => {
                setPlatformMenuOpen((open) => !open);
                setIsFilterOpen(false);
              }}
              className="inline-flex h-12 w-full items-center justify-between rounded-[14px] border border-[#ddd8cf] px-4 text-sm font-medium text-[#2a2a2a] transition hover:bg-white sm:min-w-[180px] sm:w-auto"
            >
              <span className="truncate">{selectedPlatformsLabel || "Filter platforms"}</span>
              <ChevronDown className="ml-3 h-4 w-4 text-[#767676]" />
            </button>

            {platformMenuOpen ? (
              <PlatformFiltersDropdown
                anchorRef={platformMenuRef}
                platforms={platforms}
                setPlatforms={setPlatforms}
                filters={filters}
                updateFilter={updateFilter}
                onApply={onApplyFilters}
                onClose={() => setPlatformMenuOpen(false)}
              />
            ) : null}
          </div>

          <div className="relative w-full shrink-0 sm:w-auto" ref={filterAnchorRef}>
            <button
              type="button"
              onClick={() => {
                setIsFilterOpen((open) => !open);
                setPlatformMenuOpen(false);
              }}
              className="inline-flex h-12 w-full items-center justify-between rounded-[14px] border border-[#ddd8cf] px-4 text-sm font-medium text-[#2a2a2a] transition hover:bg-white sm:min-w-[160px] sm:w-auto"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#666]" />
                <span>More filters</span>
              </span>

              {activeFilterCount > 0 ? (
                <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-black px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              ) : (
                <CaretDown className="h-4 w-4 text-[#767676]" />
              )}
            </button>

            <MoreFiltersDropdown
              open={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              anchorRef={filterAnchorRef}
              filters={filters}
              updateFilter={updateFilter}
              platforms={platforms}
              setPlatforms={setPlatforms}
              onReset={onResetFilters}
              onApply={onApplyFilters}
              loading={loading}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
