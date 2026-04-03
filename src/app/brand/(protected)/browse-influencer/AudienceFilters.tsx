"use client";

import React, { useEffect, useState } from "react";
import type { FilterState, Platform } from "./filters";

type PlanName = "free" | "growth" | "pro" | "premium";

const PLAN_RANK: Record<PlanName, number> = {
  free: 0,
  growth: 1,
  pro: 2,
  premium: 3,
};

interface Props {
  filters: FilterState;
  updateFilter: (path: string, value: any) => void;
  platforms?: Platform[];
  plan?: PlanName;
}

type ApiCountry = {
  _id: string;
  countryName: string;
  countryCode: string;
  flag?: string;
};

const API_URL = "https://api.collabglam.com/country/getAll";

export default function AudienceFilters({ filters, updateFilter, plan = "free" }: Props) {
  const [countries, setCountries] = useState<Array<{ name: string; label: string }>>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);

  const rank = PLAN_RANK[plan] ?? PLAN_RANK.free;
  const isProPlus = rank >= PLAN_RANK.pro;

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoadingCountries(true);
        setCountriesError(null);
        const response = await fetch(API_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw = (await response.json()) as ApiCountry[];
        const normalized = raw
          .map((item) => ({
            name: String(item.countryName || "").trim(),
            label: `${item.flag ? `${item.flag} ` : ""}${String(item.countryName || "").trim()}${item.countryCode ? ` (${String(item.countryCode).toUpperCase()})` : ""}`,
          }))
          .filter((item) => item.name)
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(normalized);
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        setCountries([]);
        setCountriesError(error?.message || "Failed to load countries");
      } finally {
        setLoadingCountries(false);
      }
    })();

    return () => controller.abort();
  }, []);

  if (!isProPlus) {
    return (
      <div className="mb-4 space-y-4">
        <p className="text-xs text-gray-500">
          Audience filters are available on Pro and Premium plans.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Audience Location (country)</label>
        <select
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={filters.audience.country ?? ""}
          onChange={(event) => updateFilter("audience.country", event.target.value || undefined)}
          disabled={loadingCountries}
        >
          <option value="">{loadingCountries ? "Loading countries..." : "Any"}</option>
          {countries.map((country) => (
            <option key={country.label} value={country.name}>
              {country.label}
            </option>
          ))}
        </select>
        {countriesError ? <p className="mt-1 text-xs text-red-600">{countriesError}</p> : null}
      </div>
    </div>
  );
}
