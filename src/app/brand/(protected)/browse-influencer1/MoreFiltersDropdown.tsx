"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  InstagramLogo,
  TiktokLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import type { FilterState, Platform } from "./filters";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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

type SearchModeOption = "ai" | "standard" | "combined";
type TierOption = "nano" | "micro" | "mini" | "macro" | null;
type AgePreset = "18-24" | "25-34" | "35-44" | "45+" | null;
type GenderPreset = "all" | "male" | "female";

const PLATFORM_ORDER: Platform[] = ["instagram", "youtube", "tiktok"];

const platformConfig: Record<
  Platform,
  { label: string; icon: React.ReactNode; accent: string }
> = {
  youtube: {
    label: "YouTube",
    icon: <YoutubeLogo size={16} weight="fill" />,
    accent: "#FF3B30",
  },
  instagram: {
    label: "Instagram",
    icon: <InstagramLogo size={16} weight="fill" />,
    accent: "#C13584",
  },
  tiktok: {
    label: "TikTok",
    icon: <TiktokLogo size={16} weight="fill" />,
    accent: "#111111",
  },
};

const SEARCH_MODE_OPTIONS: Array<{ label: string; value: SearchModeOption }> = [
  { label: "AI", value: "ai" },
  { label: "Standard", value: "standard" },
  { label: "Combined", value: "combined" },
];

const TIER_OPTIONS: Array<{ label: string; value: NonNullable<TierOption> }> = [
  { label: "Micro", value: "micro" },
  { label: "Mini", value: "mini" },
  { label: "Macro", value: "macro" },
  { label: "Nano", value: "nano" },
];

const AGE_OPTIONS: Array<{ label: string; value: NonNullable<AgePreset> }> = [
  { label: "18-24", value: "18-24" },
  { label: "25-34", value: "25-34" },
  { label: "35-44", value: "35-44" },
  { label: "45+", value: "45+" },
];

const GENDER_OPTIONS: Array<{ label: React.ReactNode; value: GenderPreset }> = [
  { label: "All", value: "all" },
  {
    label: (
      <span className="flex items-center gap-1">
        Male <span className="text-[10px]">♂</span>
      </span>
    ),
    value: "male",
  },
  {
    label: (
      <span className="flex items-center gap-1">
        female <span className="text-[10px]">♀</span>
      </span>
    ),
    value: "female",
  },
];

function getTierRange(tier: TierOption): { min?: number; max?: number } {
  switch (tier) {
    case "nano":
      return { min: 1000, max: 10000 };
    case "micro":
      return { min: 10000, max: 100000 };
    case "mini":
      return { min: 100000, max: 1000000 };
    case "macro":
      return { min: 1000000 };
    default:
      return {};
  }
}

function getAgeRangeFromPreset(preset: AgePreset): { min?: number; max?: number } {
  switch (preset) {
    case "18-24":
      return { min: 18, max: 24 };
    case "25-34":
      return { min: 25, max: 34 };
    case "35-44":
      return { min: 35, max: 44 };
    case "45+":
      return { min: 45, max: 65 };
    default:
      return {};
  }
}

function deriveAgePreset(filters: FilterState): AgePreset {
  const min = filters.influencer.ageMin;
  const max = filters.influencer.ageMax;

  if (min === 18 && max === 24) return "18-24";
  if (min === 25 && max === 34) return "25-34";
  if (min === 35 && max === 44) return "35-44";
  if (min === 45) return "45+";

  return null;
}

function deriveTierFromPlatforms(
  filters: FilterState,
  selectedPlatforms: Platform[]
): TierOption {
  const firstPlatform = selectedPlatforms[0];
  if (!firstPlatform) return null;

  const min = filters.platform[firstPlatform]?.followersMin;
  const max = filters.platform[firstPlatform]?.followersMax;

  if (min === 1000 && max === 10000) return "nano";
  if (min === 10000 && max === 100000) return "micro";
  if (min === 100000 && max === 1000000) return "mini";
  if (min === 1000000 && (max == null || max === undefined)) return "macro";

  return null;
}

function PlatformIconChip({
  platform,
  selected,
  onClick,
}: {
  platform: Platform;
  selected: boolean;
  onClick: () => void;
}) {
  const config = platformConfig[platform];

  return (
    <button
      type="button"
      onClick={onClick}
      title={config.label}
      className={cn(
        "inline-flex flex-1 h-7 items-center justify-center rounded-md border transition-all",
        selected
          ? "border-border bg-background text-foreground shadow-sm"
          : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {config.icon}
    </button>
  );
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium text-[#1A1A1A]">{children}</div>
  );
}

function SelectLikeInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-[8px] border border-[#E5E5E5] bg-white px-2.5 pr-8 text-[11px] text-[#1A1A1A] outline-none placeholder:text-[#A0A0A0]"
      />
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A8A8A]" />
    </div>
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
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [menuWidth, setMenuWidth] = useState(460);
  const [alignRight, setAlignRight] = useState(true);

  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchModeOption>("combined");
  const [tier, setTier] = useState<TierOption>(null);
  const [draftPlatforms, setDraftPlatforms] = useState<Platform[]>(platforms);
  const [agePreset, setAgePreset] = useState<AgePreset>(null);
  const [gender, setGender] = useState<GenderPreset>("all");
  const [country, setCountry] = useState("");

  useEffect(() => {
    if (!open) return;

    const nextMode = (filters.search.mode as SearchModeOption) || "combined";
    setSearchMode(nextMode);
    setVerifiedOnly(
      nextMode === "standard" ? Boolean(filters.influencer.isVerified) : false
    );
    setDraftPlatforms(platforms);
    setTier(deriveTierFromPlatforms(filters, platforms));
    setAgePreset(deriveAgePreset(filters));
    setGender((filters.influencer.gender as GenderPreset) || "all");
    setCountry(filters.audience.country || "");
  }, [filters, open, platforms]);

  useEffect(() => {
    if (searchMode !== "standard" && verifiedOnly) {
      setVerifiedOnly(false);
    }
  }, [searchMode, verifiedOnly]);
  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportPadding = 16;
      const idealWidth = 460;
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

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
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

  const orderedPlatforms = useMemo(() => {
    return PLATFORM_ORDER.filter((platform) => draftPlatforms.includes(platform));
  }, [draftPlatforms]);

  if (!open) return null;

  const togglePlatform = (platform: Platform) => {
    setDraftPlatforms((current) => {
      const next = new Set(current);

      if (next.has(platform)) {
        if (next.size === 1) return current;
        next.delete(platform);
      } else {
        next.add(platform);
      }

      return PLATFORM_ORDER.filter((item) => next.has(item));
    });
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  const handleApply = () => {
    const ageRange = getAgeRangeFromPreset(agePreset);
    const tierRange = getTierRange(tier);

    setPlatforms(orderedPlatforms.length ? orderedPlatforms : ["youtube"]);

    updateFilter(
      "influencer.isVerified",
      searchMode === "standard" && verifiedOnly ? true : undefined
    );
    updateFilter("search.mode", searchMode);
    updateFilter("influencer.gender", gender === "all" ? undefined : gender);
    updateFilter("influencer.ageMin", ageRange.min);
    updateFilter("influencer.ageMax", ageRange.max);
    updateFilter("audience.country", country.trim() || undefined);

    (orderedPlatforms.length ? orderedPlatforms : ["youtube"]).forEach((platform) => {
      updateFilter(`platform.${platform}.followersMin`, tierRange.min);
      updateFilter(`platform.${platform}.followersMax`, tierRange.max);
    });

    onApply();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ width: `${menuWidth}px` }}
      className={cn(
        "absolute top-[calc(100%+10px)] z-50 rounded-[16px] border border-[#E4E4E4] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.14)]",
        alignRight ? "right-0" : "left-0"
      )}
    >
      <div className="p-5">
        <div className="mb-4 border-b border-[#EFEFEF] pb-4">
          <h3 className="text-[20px] font-semibold text-[#1A1A1A]">More Filters</h3>
        </div>

        <div className="space-y-4">


          {/* Verified Influencer Only */}
          {searchMode === "standard" ? (
            <div className="grid grid-cols-[150px_1fr] items-center gap-4">
              <RowLabel>Verified Influencer Only</RowLabel>

              <button
                type="button"
                role="switch"
                aria-checked={verifiedOnly}
                onClick={() => setVerifiedOnly((prev) => !prev)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition",
                  verifiedOnly ? "bg-[#1A1A1A]" : "bg-[#E8E8E8]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all duration-200",
                    verifiedOnly ? "left-[22px]" : "left-0.5"
                  )}
                />
              </button>
            </div>
          ) : null}

          {/* Search Mode */}
          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <RowLabel>Search Mode</RowLabel>
            <Tabs
              value={searchMode}
              onValueChange={(v) => setSearchMode(v as SearchModeOption)}
            >
              <TabsList className="w-full">
                {SEARCH_MODE_OPTIONS.map((option) => (
                  <TabsTrigger key={option.value} value={option.value}>
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Influencer Tier */}
          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <RowLabel>Influencer Tier</RowLabel>
            <Tabs
              value={tier ?? ""}
              onValueChange={(v) => setTier(v as TierOption)}
            >
              <div
                onPointerDown={(e) => {
                  const trigger = (e.target as HTMLElement).closest("[data-slot='tabs-trigger']");
                  if (trigger && trigger.getAttribute("data-state") === "active") {
                    e.preventDefault();
                    setTier(null);
                  }
                }}
              >
                <TabsList className="w-full">
                  {TIER_OPTIONS.map((option) => (
                    <TabsTrigger key={option.value} value={option.value}>
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>

          {/* Platform */}
          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <RowLabel>Platform</RowLabel>
            <div className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-muted p-[3px]">
              {PLATFORM_ORDER.map((platform) => (
                <PlatformIconChip
                  key={platform}
                  platform={platform}
                  selected={draftPlatforms.includes(platform)}
                  onClick={() => togglePlatform(platform)}
                />
              ))}
            </div>
          </div>

          {/* Age */}
          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <RowLabel>Age</RowLabel>
            <Tabs
              value={agePreset ?? ""}
              onValueChange={(v) => setAgePreset(v as AgePreset)}
            >
              <div
                onPointerDown={(e) => {
                  const trigger = (e.target as HTMLElement).closest("[data-slot='tabs-trigger']");
                  if (trigger && trigger.getAttribute("data-state") === "active") {
                    e.preventDefault();
                    setAgePreset(null);
                  }
                }}
              >
                <TabsList className="w-full">
                  {AGE_OPTIONS.map((option) => (
                    <TabsTrigger key={option.value} value={option.value}>
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>

          {/* Gender */}
          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <RowLabel>Gender</RowLabel>
            <Tabs
              value={gender}
              onValueChange={(v) => setGender(v as GenderPreset)}
            >
              <TabsList className="w-full">
                {GENDER_OPTIONS.map((option) => (
                  <TabsTrigger key={option.value} value={option.value}>
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Country */}
          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <RowLabel>Country</RowLabel>
            <SelectLikeInput
              value={country}
              onChange={setCountry}
              placeholder="Select Country"
            />
          </div>
        </div>

        <div className="mt-7 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-10 items-center justify-center px-4 text-[12px] font-medium text-[#1A1A1A]"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={loading}
            className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-[10px] bg-[#141414] px-5 text-[12px] font-semibold text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}