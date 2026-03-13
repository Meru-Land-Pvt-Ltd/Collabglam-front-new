"use client";

import React, {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { Loader2 } from "lucide-react";
import { GenderFemale, GenderMale } from "@phosphor-icons/react/dist/ssr";
import type { FilterState, Platform } from "./filters";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

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
  const min = filters?.influencer?.followersMin;
  const max = filters?.influencer?.followersMax;

  if (min === 1000 && max === 10000) return "nano";
  if (min === 10000 && max === 100000) return "micro";
  if (min === 100000 && max === 500000) return "mid";
  if (min === 500000 && max === 1000000) return "macro";
  if (min === 1000000 && max == null) return "mega";

  return null;
}

function getAgeFromFilters(filters: FilterState): AgeKey | null {
  const min = filters?.influencer?.ageMin;
  const max = filters?.influencer?.ageMax;

  if (min === 18 && max === 24) return "18-24";
  if (min === 25 && max === 34) return "25-34";
  if (min === 35 && max === 44) return "35-44";
  if (min === 45 && (max == null || max >= 45)) return "45+";

  return null;
}

function getGenderFromFilters(filters: FilterState): GenderKey {
  const value = filters?.influencer?.gender;
  if (value === "MALE") return "male";
  if (value === "FEMALE") return "female";
  return "all";
}

function getCountryFromFilters(filters: FilterState) {
  const raw = (filters?.audience as any)?.location;
  if (Array.isArray(raw)) return String(raw[0] || "");
  return String(raw || "");
}

const RowEl = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="w-full flex flex-row items-center justify-between gap-4">
    <div className="shrink-0 text-[16px] font-semibold text-[#1A1A1A]">
      {label}
    </div>
    <div className="min-w-0 flex-1 flex justify-end">
      <div className="max-w-full overflow-x-auto scrollbar-none">
        <div className="w-max">{children}</div>
      </div>
    </div>
  </div>
)

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[30px] w-[52px] items-center rounded-full transition-colors",
        checked ? "bg-black" : "bg-[#E8E8E8]"
      )}
    >
      <span
        className={cn(
          "absolute h-[24px] w-[24px] rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[24px]" : "translate-x-[4px]"
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
  platforms,
  setPlatforms,
  onReset,
  onApply,
  loading,
}: MoreFiltersDropdownProps) {
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  const [tier, setTier] = useState<TierKey | null>(null);
  const [localPlatforms, setLocalPlatforms] = useState<Set<Platform>>(
    new Set(["instagram"])
  );
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [age, setAge] = useState<AgeKey | null>(null);
  const [gender, setGender] = useState<GenderKey>("all");
  const [country, setCountry] = useState("");

  const [countries, setCountries] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  const [menuWidth, setMenuWidth] = useState(707);
  const [alignRight, setAlignRight] = useState(true);

  useEffect(() => {
    if (!open) return;

    setTier(getTierFromFilters(filters));
    setLocalPlatforms(new Set(platforms));
    setVerifiedOnly(!!filters?.influencer?.isVerified);
    setAge(getAgeFromFilters(filters));
    setGender(getGenderFromFilters(filters));
    setCountry(getCountryFromFilters(filters));
  }, [open, filters, platforms]);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportPadding = 16;
      const idealWidth = 707;
      const safeWidth = Math.min(
        idealWidth,
        window.innerWidth - viewportPadding * 2
      );

      setMenuWidth(safeWidth);

      const leftIfRightAligned = rect.right - safeWidth;
      setAlignRight(leftIfRightAligned >= viewportPadding);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoadingCountries(true);

        const res = await fetch(COUNTRY_API, {
          method: "GET",
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Failed to fetch countries");

        const raw = (await res.json()) as ApiCountry[];

        const next = raw
          .map((item) => {
            const code = String(item.countryCode || "").toUpperCase();
            const name = String(item.countryName || "").trim();
            const flag = item.flag ? `${item.flag} ` : "";
            return code && name ? `${flag}${name} (${code})` : "";
          })
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

        setCountries(Array.from(new Set(next)));
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
  }, [open, onClose, anchorRef]);

  const toggleTier = (value: TierKey) => {
    setTier((prev) => (prev === value ? null : value));
  };

  const togglePlatform = (value: Platform) => {
    setLocalPlatforms((prev) => {
      const next = new Set(prev);

      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }

      if (next.size === 0) next.add(value);
      return next;
    });
  };

  const toggleAge = (value: AgeKey) => {
    setAge((prev) => (prev === value ? null : value));
  };

  const handleClearLocal = () => {
    setTier(null);
    setLocalPlatforms(new Set(["instagram"]));
    setVerifiedOnly(false);
    setAge(null);
    setGender("all");
    setCountry("");
  };

  const handleApply = () => {
    const nextPlatforms = Array.from(localPlatforms);
    const effectivePlatforms = nextPlatforms.length
      ? nextPlatforms
      : (["instagram"] as Platform[]);

    flushSync(() => {
      setPlatforms(effectivePlatforms);

      if (tier) {
        updateFilter("influencer.followersMin", TIER_RANGES[tier].min);
        updateFilter("influencer.followersMax", TIER_RANGES[tier].max);
      } else {
        updateFilter("influencer.followersMin", undefined);
        updateFilter("influencer.followersMax", undefined);
      }

      updateFilter("influencer.isVerified", verifiedOnly);

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

      if (gender === "male") {
        updateFilter("influencer.gender", "MALE");
      } else if (gender === "female") {
        updateFilter("influencer.gender", "FEMALE");
      } else {
        updateFilter("influencer.gender", undefined);
      }

      updateFilter("audience.location", country || undefined);
    });

    onApply();
    onClose();
  };

  const handleResetAll = () => {
    handleClearLocal();
    flushSync(() => {
      onReset();
      setPlatforms(["instagram"]);
    });
  };

  if (!open) return null;

  const pillWrap =
    "inline-flex max-w-full flex-wrap items-center gap-1 rounded-[12px] bg-[#F2F2F2] p-1 md:flex-nowrap";
  const pillBtn =
    "inline-flex h-[40px] items-center justify-center rounded-[10px] px-4 text-sm font-medium transition-colors whitespace-nowrap";
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
        "px-4 py-5 md:px-[2.3125rem] md:py-[2.0625rem]"
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
            <button
              type="button"
              className={cn(pillBtn, tier === "nano" ? active : inactive)}
              onClick={() => toggleTier("nano")}
            >
              Nano
            </button>
            <button
              type="button"
              className={cn(pillBtn, tier === "micro" ? active : inactive)}
              onClick={() => toggleTier("micro")}
            >
              Micro
            </button>
            <button
              type="button"
              className={cn(pillBtn, tier === "mid" ? active : inactive)}
              onClick={() => toggleTier("mid")}
            >
              Mid-tier
            </button>
            <button
              type="button"
              className={cn(pillBtn, tier === "macro" ? active : inactive)}
              onClick={() => toggleTier("macro")}
            >
              Macro
            </button>
            <button
              type="button"
              className={cn(pillBtn, tier === "mega" ? active : inactive)}
              onClick={() => toggleTier("mega")}
            >
              Mega
            </button>
          </div>
        </RowEl>

        <RowEl label="Age">
          <div className={pillWrap}>
            {AGE_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className={cn(pillBtn, age === item ? active : inactive)}
                onClick={() => toggleAge(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </RowEl>

        <RowEl label="Gender">
          <div className={pillWrap}>
            <button
              type="button"
              className={cn(pillBtn, gender === "all" ? active : inactive)}
              onClick={() => setGender("all")}
            >
              All
            </button>

            <button
              type="button"
              className={cn(
                pillBtn,
                "flex items-center gap-2",
                gender === "male" ? active : inactive
              )}
              onClick={() => setGender("male")}
            >
              Male <GenderMale size={18} weight="bold" />
            </button>

            <button
              type="button"
              className={cn(
                pillBtn,
                "flex items-center gap-2",
                gender === "female" ? active : inactive
              )}
              onClick={() => setGender("female")}
            >
              Female <GenderFemale size={18} weight="bold" />
            </button>
          </div>
        </RowEl>

        <RowEl label="Country">
          <div className="w-full md:ml-auto md:w-[320px]">
            <Combobox
              items={countries}
              value={country}
              onValueChange={(value) => setCountry(value ?? "")}
            >
              <ComboboxInput
                placeholder={
                  loadingCountries ? "Loading countries..." : "Select country"
                }
                disabled={loadingCountries}
                className="h-[44px] rounded-[12px] border border-[#d6d6d6] bg-white px-3 text-sm shadow-none focus-within:border-[#1a1a1a] focus-within:ring-[3px] focus-within:ring-[#1a1a1a]/20"
              />
              <ComboboxContent className="w-[320px] max-w-[calc(100vw-32px)] rounded-[12px] border-0 ring-1 ring-[#d6d6d6] shadow-[0_7px_20px_0_rgba(25,33,61,0.04)]">
                <ComboboxEmpty>
                  {loadingCountries ? "Loading countries..." : "No items found."}
                </ComboboxEmpty>

                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
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