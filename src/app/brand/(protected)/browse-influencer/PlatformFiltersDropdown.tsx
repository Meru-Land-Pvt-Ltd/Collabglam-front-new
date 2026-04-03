"use client";

import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { flushSync } from "react-dom";
import { InstagramLogo, TiktokLogo, YoutubeLogo } from "@phosphor-icons/react";
import type { FilterState, Platform, PlatformFilterState } from "./filters";
import {
  LANGUAGE_OPTIONS,
  LAST_POSTED_OPTIONS,
  PLATFORM_ORDER,
} from "./filters";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

interface PlatformFiltersDropdownProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  platforms: Platform[];
  setPlatforms: (platforms: Platform[]) => void;
  filters: FilterState;
  updateFilter: (path: string, value: any) => void;
  onApply?: () => void;
  onClose: () => void;
}

type PlatformDraft = {
  followersMin: string;
  followersMax: string;
  avgViewsMin: string;
  avgViewsMax: string;
  engagementRateMin: string;
  languageCode: string;
  lastPostedDays: string;
};

const platformConfig: Record<Platform, { label: string; icon: React.ReactNode }> = {
  youtube: { label: "YouTube", icon: <YoutubeLogo size={22} weight="fill" /> },
  instagram: { label: "Instagram", icon: <InstagramLogo size={22} weight="fill" /> },
  tiktok: { label: "TikTok", icon: <TiktokLogo size={22} weight="fill" /> },
};

function toDraftValue(value?: number | string) {
  return value == null ? "" : String(value);
}

function fromFilters(platformFilters: PlatformFilterState | undefined): PlatformDraft {
  return {
    followersMin: toDraftValue(platformFilters?.followersMin),
    followersMax: toDraftValue(platformFilters?.followersMax),
    avgViewsMin: toDraftValue(platformFilters?.avgViewsMin),
    avgViewsMax: toDraftValue(platformFilters?.avgViewsMax),
    engagementRateMin: toDraftValue(platformFilters?.engagementRateMin),
    languageCode: platformFilters?.languageCode || "",
    lastPostedDays: toDraftValue(platformFilters?.lastPostedDays),
  };
}

function parseNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function PlatformIconButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex h-14 w-14 items-center justify-center rounded-full border transition",
        selected ? "border-[#d7d7d7] bg-white shadow-sm" : "border-[#dedede] bg-white hover:bg-[#fafafa]",
      )}
    >
      {children}
      {selected ? (
        <span className="absolute right-0 top-0 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#31c759] text-white">
          <Check className="h-3 w-3" />
        </span>
      ) : null}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-[14px] font-semibold text-[#1A1A1A]">{children}</label>;
}

function InputField({
  value,
  onChange,
  placeholder,
  suffix,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <div className="flex h-[42px] items-center overflow-hidden rounded-[12px] border border-[#dcdcdc] bg-white">
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-full w-full min-w-0 bg-transparent px-3 text-sm text-[#222] outline-none placeholder:text-[#a0a0a0]"
      />
      {suffix ? <span className="shrink-0 pr-3 text-sm text-[#444]">{suffix}</span> : null}
    </div>
  );
}

function MinMaxField({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: {
  label: string;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <InputField value={minValue} onChange={onMinChange} placeholder="Min" />
        </div>
        <span className="shrink-0 text-sm text-[#9a9a9a]">to</span>
        <div className="min-w-0 flex-1">
          <InputField value={maxValue} onChange={onMaxChange} placeholder="Max" />
        </div>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-[42px] w-full appearance-none rounded-[12px] border border-[#dcdcdc] bg-white px-3 pr-10 text-sm text-[#444] outline-none"
        >
          {options.map((option) => (
            <option key={`${option.label}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8b8b]" />
      </div>
    </div>
  );
}

function PlatformSection({
  platform,
  draft,
  setDraft,
  onClear,
}: {
  platform: Platform;
  draft: PlatformDraft;
  setDraft: (patch: Partial<PlatformDraft>) => void;
  onClear: () => void;
}) {
  const config = platformConfig[platform];
  const isYoutube = platform === "youtube";

  return (
    <div className="w-full border-t border-[#ece7df] pt-5 first:border-t-0 first:pt-0">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[16px] font-semibold text-[#1A1A1A]">
          <span className="text-[#111]">{config.icon}</span>
          <span>{config.label}</span>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-[#e0ddd7] bg-white px-4 text-sm font-semibold text-[#1A1A1A] shadow-sm transition hover:bg-[#faf8f4] sm:w-auto"
        >
          Clear <X className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-[18px] border border-[#e5e1da] bg-white p-4">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <MinMaxField
            label={isYoutube ? "Subscribers" : "Followers"}
            minValue={draft.followersMin}
            maxValue={draft.followersMax}
            onMinChange={(value) => setDraft({ followersMin: value })}
            onMaxChange={(value) => setDraft({ followersMax: value })}
          />

          <MinMaxField
            label="Average views"
            minValue={draft.avgViewsMin}
            maxValue={draft.avgViewsMax}
            onMinChange={(value) => setDraft({ avgViewsMin: value })}
            onMaxChange={(value) => setDraft({ avgViewsMax: value })}
          />

          <div>
            <FieldLabel>Minimum engagement rate</FieldLabel>
            <InputField
              value={draft.engagementRateMin}
              onChange={(value) => setDraft({ engagementRateMin: value })}
              placeholder="e.g. 3.5"
              suffix="%"
            />
          </div>

          <SelectField
            label="Language"
            value={draft.languageCode}
            options={LANGUAGE_OPTIONS}
            onChange={(value) => setDraft({ languageCode: value })}
          />

          <SelectField
            label="Last posted"
            value={draft.lastPostedDays}
            options={LAST_POSTED_OPTIONS.map((item) => ({
              label: item.label,
              value: item.value == null ? "" : String(item.value),
            }))}
            onChange={(value) => setDraft({ lastPostedDays: value })}
          />
        </div>
      </div>
    </div>
  );
}

export function PlatformFiltersDropdown({
  anchorRef,
  platforms,
  setPlatforms,
  filters,
  updateFilter,
  onApply,
  onClose,
}: PlatformFiltersDropdownProps) {
  const [draftPlatforms, setDraftPlatforms] = useState<Platform[]>(platforms);
  const [drafts, setDrafts] = useState<Record<Platform, PlatformDraft>>({
    youtube: fromFilters(filters.platform.youtube),
    instagram: fromFilters(filters.platform.instagram),
    tiktok: fromFilters(filters.platform.tiktok),
  });
  const [menuWidth, setMenuWidth] = useState(592);
  const [alignRight, setAlignRight] = useState(true);

  useEffect(() => {
    setDraftPlatforms(platforms);
    setDrafts({
      youtube: fromFilters(filters.platform.youtube),
      instagram: fromFilters(filters.platform.instagram),
      tiktok: fromFilters(filters.platform.tiktok),
    });
  }, [filters, platforms]);

  const selectedPlatforms = useMemo(
    () => PLATFORM_ORDER.filter((platform) => draftPlatforms.includes(platform)),
    [draftPlatforms],
  );

  useLayoutEffect(() => {
    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportPadding = 16;
      const idealWidth = 592;
      const safeWidth = Math.min(idealWidth, window.innerWidth - viewportPadding * 2);

      setMenuWidth(safeWidth);
      setAlignRight(rect.right - safeWidth >= viewportPadding);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [anchorRef]);

  const togglePlatform = (platform: Platform) => {
    setDraftPlatforms((current) => {
      const next = new Set(current);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return Array.from(next.size ? next : new Set([platform]));
    });
  };

  const clearPlatform = (platform: Platform) => {
    setDrafts((current) => ({
      ...current,
      [platform]: {
        followersMin: "",
        followersMax: "",
        avgViewsMin: "",
        avgViewsMax: "",
        engagementRateMin: "",
        languageCode: "",
        lastPostedDays: "",
      },
    }));
  };

  const applyChanges = () => {
    flushSync(() => {
      setPlatforms(draftPlatforms.length ? draftPlatforms : ["instagram"]);

      PLATFORM_ORDER.forEach((platform) => {
        const draft = drafts[platform];
        updateFilter(`platform.${platform}.followersMin`, parseNumber(draft.followersMin));
        updateFilter(`platform.${platform}.followersMax`, parseNumber(draft.followersMax));
        updateFilter(`platform.${platform}.avgViewsMin`, parseNumber(draft.avgViewsMin));
        updateFilter(`platform.${platform}.avgViewsMax`, parseNumber(draft.avgViewsMax));
        updateFilter(`platform.${platform}.engagementRateMin`, parseNumber(draft.engagementRateMin));
        updateFilter(`platform.${platform}.languageCode`, draft.languageCode || undefined);
        updateFilter(`platform.${platform}.lastPostedDays`, parseNumber(draft.lastPostedDays));
      });
    });

    onApply?.();
    onClose();
  };

  return (
    <div
      style={{ width: `${menuWidth}px` }}
      className={cn(
        "absolute top-[calc(100%+8px)] z-50 flex max-h-[min(82vh,46rem)] flex-col overflow-hidden rounded-[18px] border border-[#e6e0d7] bg-white shadow-[0_18px_48px_rgba(0,0,0,0.12)]",
        alignRight ? "right-0" : "left-0",
      )}
    >
      <div className="shrink-0 p-4 md:p-5">
        <h3 className="mb-5 text-[18px] font-semibold text-[#1A1A1A]">Select Platform</h3>

        <div className="mb-2 flex flex-wrap gap-3">
          {PLATFORM_ORDER.map((platform) => {
            const selected = draftPlatforms.includes(platform);
            return (
              <PlatformIconButton key={platform} selected={selected} onClick={() => togglePlatform(platform)}>
                <span className="text-[#111]">{platformConfig[platform].icon}</span>
              </PlatformIconButton>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-[#ece7df] px-4 pb-4 md:px-5 md:pb-5">
        {selectedPlatforms.map((platform) => (
          <PlatformSection
            key={platform}
            platform={platform}
            draft={drafts[platform]}
            setDraft={(patch) =>
              setDrafts((current) => ({
                ...current,
                [platform]: {
                  ...current[platform],
                  ...patch,
                },
              }))
            }
            onClear={() => clearPlatform(platform)}
          />
        ))}
      </div>

      <div className="shrink-0 flex flex-col gap-3 border-t border-[#ece7df] bg-white p-4 sm:flex-row sm:items-center sm:justify-end md:px-5">
        <button
          type="button"
          onClick={() => setDraftPlatforms(["instagram", "tiktok", "youtube"])}
          className="inline-flex h-11 w-full items-center justify-center rounded-[12px] border border-[#e0ddd7] bg-white px-5 text-sm font-semibold text-[#1A1A1A] sm:w-auto"
        >
          Select all
        </button>

        <button
          type="button"
          onClick={applyChanges}
          className="inline-flex h-11 w-full min-w-[150px] items-center justify-center rounded-[12px] bg-[#121417] px-6 text-sm font-semibold text-white sm:w-auto"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
