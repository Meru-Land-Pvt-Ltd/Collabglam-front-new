"use client";

import React, { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Loader2 } from "lucide-react";
import { GenderFemale, GenderMale } from "@phosphor-icons/react/dist/ssr";
import type { FilterState, Platform } from "./filters";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type TierKey = "nano" | "micro" | "mid" | "macro" | "mega";
type GenderKey = "all" | "male" | "female";
type AgeKey = "18-24" | "25-34" | "35-44" | "45+";

interface MoreFiltersDropdownProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  filters: FilterState;
  updateFilter: (path: string, value: any) => void;
  platforms: Platform[];
  setPlatforms: (platforms: Platform[]) => void;
  onReset: () => void;
  onApply: () => void;
  loading?: boolean;
}

type ApiCountry = {
  _id: string;
  countryName: string;
  countryCode: string;
  flag?: string;
};

const COUNTRY_API = "https://api.collabglam.com/country/getAll";
const AGE_OPTIONS: AgeKey[] = ["18-24", "25-34", "35-44", "45+"];
const TIER_RANGES: Record<TierKey, { min: number; max?: number }> = {
  nano: { min: 1000, max: 10000 },
  micro: { min: 10000, max: 100000 },
  mid: { min: 100000, max: 500000 },
  macro: { min: 500000, max: 1000000 },
  mega: { min: 1000000, max: undefined },
};

function getTierFromFilters(filters: FilterState): TierKey | null {
  const selected = Object.values(filters.platform);
  const mins = new Set(selected.map((item) => item.followersMin).filter((value) => value != null));
  const maxs = new Set(selected.map((item) => item.followersMax).filter((value) => value != null));
  if (mins.size !== 1 || maxs.size > 1) return null;

  const min = [...mins][0];
  const max = [...maxs][0];
  if (min === 1000 && max === 10000) return "nano";
  if (min === 10000 && max === 100000) return "micro";
  if (min === 100000 && max === 500000) return "mid";
  if (min === 500000 && max === 1000000) return "macro";
  if (min === 1000000 && max == null) return "mega";
  return null;
}

function getAgeFromFilters(filters: FilterState): AgeKey | null {
  const min = filters.influencer.ageMin;
  const max = filters.influencer.ageMax;
  if (min === 18 && max === 24) return "18-24";
  if (min === 25 && max === 34) return "25-34";
  if (min === 35 && max === 44) return "35-44";
  if (min === 45 && (max == null || max >= 45)) return "45+";
  return null;
}

function getGenderFromFilters(filters: FilterState): GenderKey {
  if (filters.influencer.gender === "MALE") return "male";
  if (filters.influencer.gender === "FEMALE") return "female";
  return "all";
}

const RowEl = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex w-full flex-row items-center justify-between gap-4">
    <div className="shrink-0 text-[16px] font-semibold text-[#1A1A1A]">{label}</div>
    <div className="min-w-0 flex-1 flex justify-end">
      <div className="max-w-full overflow-x-auto scrollbar-none">
        <div className="w-max">{children}</div>
      </div>
    </div>
  </div>
);

function Toggle({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[30px] w-[52px] items-center rounded-full transition-colors",
        checked ? "bg-black" : "bg-[#E8E8E8]",
      )}
    >
      <span
        className={cn(
          "absolute h-[24px] w-[24px] rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[24px]" : "translate-x-[4px]",
        )}
      />
    </button>
  );
}

export function MoreFiltersDropdown({
  open,
  onClose,
  anchorRef,
  filters,
  updateFilter,
  onReset,
  onApply,
  loading,
}: MoreFiltersDropdownProps) {
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  const [tier, setTier] = useState<TierKey | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [age, setAge] = useState<AgeKey | null>(null);
  const [gender, setGender] = useState<GenderKey>("all");
  const [country, setCountry] = useState("");
  const [countries, setCountries] = useState<Array<{ name: string; label: string }>>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [menuWidth, setMenuWidth] = useState(707);
  const [alignRight, setAlignRight] = useState(true);

  useEffect(() => {
    if (!open) return;
    setTier(getTierFromFilters(filters));
    setVerifiedOnly(!!filters.influencer.isVerified);
    setAge(getAgeFromFilters(filters));
    setGender(getGenderFromFilters(filters));
    setCountry(filters.audience.country || "");
  }, [filters, open]);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewportPadding = 16;
      const idealWidth = 707;
      const safeWidth = Math.min(idealWidth, window.innerWidth - viewportPadding * 2);
      setMenuWidth(safeWidth);
      setAlignRight(rect.right - safeWidth >= viewportPadding);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [anchorRef, open]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    (async () => {
      try {
        setLoadingCountries(true);
        const response = await fetch(COUNTRY_API, { signal: controller.signal });
        if (!response.ok) throw new Error("Failed to fetch countries");
        const raw = (await response.json()) as ApiCountry[];
        const normalized = raw
          .map((item) => ({
            name: String(item.countryName || "").trim(),
            label: `${item.flag ? `${item.flag} ` : ""}${String(item.countryName || "").trim()}${item.countryCode ? ` (${String(item.countryCode).toUpperCase()})` : ""}`,
          }))
          .filter((item) => item.name)
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(normalized);
      } catch {
        setCountries([]);
      } finally {
        setLoadingCountries(false);
      }
    })();

    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterMenuRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [anchorRef, onClose, open]);

  const handleApply = () => {
    flushSync(() => {
      if (tier) {
        Object.keys(filters.platform).forEach((platform) => {
          updateFilter(`platform.${platform}.followersMin`, TIER_RANGES[tier].min);
          updateFilter(`platform.${platform}.followersMax`, TIER_RANGES[tier].max);
        });
      } else {
        Object.keys(filters.platform).forEach((platform) => {
          updateFilter(`platform.${platform}.followersMin`, undefined);
          updateFilter(`platform.${platform}.followersMax`, undefined);
        });
      }

      updateFilter("influencer.isVerified", verifiedOnly || undefined);

      if (age === "18-24") {
        updateFilter("influencer.ageMin", 18);
        updateFilter("influencer.ageMax", 24);
      } else if (age === "25-34") {
        updateFilter("influencer.ageMin", 25);
        updateFilter("influencer.ageMax", 34);
      } else if (age === "35-44") {
        updateFilter("influencer.ageMin", 35);
        updateFilter("influencer.ageMax", 44);
      } else if (age === "45+") {
        updateFilter("influencer.ageMin", 45);
        updateFilter("influencer.ageMax", undefined);
      } else {
        updateFilter("influencer.ageMin", undefined);
        updateFilter("influencer.ageMax", undefined);
      }

      if (gender === "male") updateFilter("influencer.gender", "MALE");
      else if (gender === "female") updateFilter("influencer.gender", "FEMALE");
      else updateFilter("influencer.gender", undefined);

      updateFilter("audience.country", country || undefined);
    });

    onApply();
    onClose();
  };

  const handleResetAll = () => {
    setTier(null);
    setVerifiedOnly(false);
    setAge(null);
    setGender("all");
    setCountry("");
    flushSync(() => onReset());
  };

  if (!open) return null;

  const pillWrap = "inline-flex max-w-full flex-wrap items-center gap-1 rounded-[12px] bg-[#F2F2F2] p-1 md:flex-nowrap";
  const pillBtn = "inline-flex h-[40px] items-center justify-center rounded-[10px] px-4 text-sm font-medium transition-colors whitespace-nowrap";
  const active = "bg-black text-white";
  const inactive = "cursor-pointer text-[#8B8B8B] hover:text-[#1A1A1A]";

  return (
    <div
      ref={filterMenuRef}
      role="menu"
      style={{ width: `${menuWidth}px` }}
      className={cn(
        "absolute top-[calc(100%+8px)] z-50",
        alignRight ? "right-0" : "left-0",
        "max-h-[min(78vh,42rem)] overflow-y-auto",
        "flex flex-col items-start gap-[0.8125rem]",
        "rounded-[1rem] border border-[#F1F3F7] bg-white",
        "shadow-[0_10px_28px_0_rgba(25,33,61,0.08)]",
        "px-4 py-5 md:px-[2.3125rem] md:py-[2.0625rem]",
      )}
    >
      <div className="flex w-full flex-col gap-[0.95rem]">
        <RowEl label="Verified Influencer Only">
          <div className="flex justify-start md:justify-end">
            <Toggle checked={verifiedOnly} onChange={setVerifiedOnly} />
          </div>
        </RowEl>

        <RowEl label="Influencer Tier">
          <div className={pillWrap}>
            {(["nano", "micro", "mid", "macro", "mega"] as TierKey[]).map((value) => (
              <button
                key={value}
                type="button"
                className={cn(pillBtn, tier === value ? active : inactive)}
                onClick={() => setTier((current) => (current === value ? null : value))}
              >
                {value === "mid" ? "Mid-tier" : value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </RowEl>

        <RowEl label="Age">
          <div className={pillWrap}>
            {AGE_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className={cn(pillBtn, age === item ? active : inactive)}
                onClick={() => setAge((current) => (current === item ? null : item))}
              >
                {item}
              </button>
            ))}
          </div>
        </RowEl>

        <RowEl label="Gender">
          <div className={pillWrap}>
            <button type="button" className={cn(pillBtn, gender === "all" ? active : inactive)} onClick={() => setGender("all")}>
              All
            </button>
            <button
              type="button"
              className={cn(pillBtn, "flex items-center gap-2", gender === "male" ? active : inactive)}
              onClick={() => setGender("male")}
            >
              Male <GenderMale size={18} weight="bold" />
            </button>
            <button
              type="button"
              className={cn(pillBtn, "flex items-center gap-2", gender === "female" ? active : inactive)}
              onClick={() => setGender("female")}
            >
              Female <GenderFemale size={18} weight="bold" />
            </button>
          </div>
        </RowEl>

        <RowEl label="Country">
          <div className="w-full md:ml-auto md:w-[320px]">
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              disabled={loadingCountries}
              className="h-[44px] w-full rounded-[12px] border border-[#d6d6d6] bg-white px-3 text-sm shadow-none outline-none focus:border-[#1a1a1a]"
            >
              <option value="">{loadingCountries ? "Loading countries..." : "Any country"}</option>
              {countries.map((item) => (
                <option key={item.label} value={item.name}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </RowEl>
      </div>

      <div className="flex w-full flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleResetAll}
          className="inline-flex h-[42px] items-center justify-center rounded-[12px] px-5 text-sm font-medium text-[#1A1A1A] transition hover:bg-[#F5F5F5]"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={handleApply}
          disabled={loading}
          className="inline-flex h-[42px] min-w-[160px] items-center justify-center rounded-[12px] bg-black px-6 text-sm font-medium text-white transition hover:bg-[#111] disabled:opacity-60"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Apply
        </button>
      </div>
    </div>
  );
}
