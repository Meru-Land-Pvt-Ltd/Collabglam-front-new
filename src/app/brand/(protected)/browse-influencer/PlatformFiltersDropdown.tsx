"use client";

import React, { useLayoutEffect, useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import {
  InstagramLogo,
  TiktokLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import type { Platform } from "./filters";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

interface PlatformFiltersDropdownProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  platforms: Platform[];
  setPlatforms: (platforms: Platform[]) => void;
  onClose: () => void;
}

type PlatformDraft = {
  primaryMin: string;
  primaryMax: string;
  avgViews: number;
  engagementRate: number;
  language: string;
  avgWatchTime: string;
  priceMin: string;
  priceMax: string;
};

const PLATFORM_ORDER: Platform[] = ["youtube", "instagram", "tiktok"];

const platformConfig: Record<
  Platform,
  {
    label: string;
    icon: React.ReactNode;
  }
> = {
  youtube: {
    label: "YouTube",
    icon: <YoutubeLogo size={22} weight="fill" />,
  },
  instagram: {
    label: "Instagram",
    icon: <InstagramLogo size={22} weight="fill" />,
  },
  tiktok: {
    label: "TikTok",
    icon: <TiktokLogo size={22} weight="fill" />,
  },
};

const defaultDrafts: Record<Platform, PlatformDraft> = {
  youtube: {
    primaryMin: "",
    primaryMax: "",
    avgViews: 50000,
    engagementRate: 5.2,
    language: "English",
    avgWatchTime: "All time",
    priceMin: "5.22",
    priceMax: "8.22",
  },
  instagram: {
    primaryMin: "",
    primaryMax: "",
    avgViews: 500000,
    engagementRate: 4.8,
    language: "English",
    avgWatchTime: "All time",
    priceMin: "5.22",
    priceMax: "8.22",
  },
  tiktok: {
    primaryMin: "",
    primaryMax: "",
    avgViews: 350000,
    engagementRate: 6.1,
    language: "English",
    avgWatchTime: "All time",
    priceMin: "5.22",
    priceMax: "8.22",
  },
};

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}

function formatPercent(value: number) {
  return `${Number(value.toFixed(1))}%`;
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
        selected
          ? "border-[#d7d7d7] bg-white shadow-sm"
          : "border-[#dedede] bg-white hover:bg-[#fafafa]"
      )}
    >
      {children}

      {selected && (
        <span className="absolute right-0 top-0 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#31c759] text-white">
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[14px] font-semibold text-[#1A1A1A]">
      {children}
    </label>
  );
}

function InputField({
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  type = "text",
  inputMode,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="flex h-[42px] items-center overflow-hidden rounded-[12px] border border-[#dcdcdc] bg-white">
      {prefix ? (
        <span className="flex h-full w-10 shrink-0 items-center justify-center border-r border-[#e8e8e8] text-sm text-[#8c8c8c]">
          {prefix}
        </span>
      ) : null}

      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={value ? undefined : placeholder}
        className="h-full w-full min-w-0 bg-transparent px-3 text-sm text-[#222] outline-none placeholder:text-[#a0a0a0]"
      />

      {suffix ? (
        <span className="shrink-0 pr-3 text-sm text-[#444]">{suffix}</span>
      ) : null}
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
          <InputField
            value={minValue}
            onChange={onMinChange}
            placeholder="Min"
            type="number"
            inputMode="numeric"
          />
        </div>
        <span className="shrink-0 text-sm text-[#9a9a9a]">to</span>
        <div className="min-w-0 flex-1">
          <InputField
            value={maxValue}
            onChange={onMaxChange}
            placeholder="Max"
            type="number"
            inputMode="numeric"
          />
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
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[42px] w-full appearance-none rounded-[12px] border border-[#dcdcdc] bg-white px-3 pr-10 text-sm text-[#444] outline-none"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8b8b]" />
      </div>
    </div>
  );
}

function MetricSliderField({
  label,
  min,
  max,
  step,
  value,
  onChange,
  bubbleFormatter,
  inputValue,
  onInputChange,
  inputSuffix,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  bubbleFormatter: (value: number) => string;
  inputValue: string;
  onInputChange: (value: string) => void;
  inputSuffix?: string;
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      <div className="flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <div
            className="pointer-events-none absolute top-[-2px] z-10 -translate-x-1/2"
            style={{ left: `${percent}%` }}
          >
            <div className="rounded-[6px] bg-[#1f1f1f] px-2 py-1 text-[10px] text-white shadow">
              {bubbleFormatter(value)}
            </div>
          </div>

          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="mt-6 h-2 w-full cursor-pointer accent-black"
          />
        </div>

        <div className="w-[96px] shrink-0">
          <InputField
            value={inputValue}
            onChange={onInputChange}
            type="number"
            inputMode="decimal"
            suffix={inputSuffix}
          />
        </div>
      </div>
    </div>
  );
}

function PriceRangeField({
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
    <div className="md:col-span-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InputField
          value={minValue}
          onChange={onMinChange}
          prefix="$"
          type="number"
          inputMode="decimal"
        />
        <InputField
          value={maxValue}
          onChange={onMaxChange}
          prefix="$"
          type="number"
          inputMode="decimal"
        />
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
          {platform === "youtube" ? (
            <>
              <MinMaxField
                label="Subscribers"
                minValue={draft.primaryMin}
                maxValue={draft.primaryMax}
                onMinChange={(value) => setDraft({ primaryMin: value })}
                onMaxChange={(value) => setDraft({ primaryMax: value })}
              />

              <MetricSliderField
                label="Avg views"
                min={0}
                max={1_000_000}
                step={1000}
                value={draft.avgViews}
                onChange={(value) => setDraft({ avgViews: value })}
                bubbleFormatter={formatCompact}
                inputValue={String(draft.avgViews)}
                onInputChange={(value) =>
                  setDraft({
                    avgViews:
                      value === "" ? 0 : clamp(Number(value) || 0, 0, 1_000_000),
                  })
                }
              />

              <SelectField
                label="Avg Watch Time"
                value={draft.avgWatchTime}
                options={["All time", "Last 30 days", "Last 90 days"]}
                onChange={(value) => setDraft({ avgWatchTime: value })}
              />

              <MetricSliderField
                label="Avg engagement rate"
                min={0}
                max={20}
                step={0.1}
                value={draft.engagementRate}
                onChange={(value) => setDraft({ engagementRate: value })}
                bubbleFormatter={formatPercent}
                inputValue={String(draft.engagementRate)}
                onInputChange={(value) =>
                  setDraft({
                    engagementRate:
                      value === "" ? 0 : clamp(Number(value) || 0, 0, 20),
                  })
                }
                inputSuffix="%"
              />

              {/* <PriceRangeField
                label="CPV"
                minValue={draft.priceMin}
                maxValue={draft.priceMax}
                onMinChange={(value) => setDraft({ priceMin: value })}
                onMaxChange={(value) => setDraft({ priceMax: value })}
              /> */}
            </>
          ) : (
            <>
              <MinMaxField
                label="Followers"
                minValue={draft.primaryMin}
                maxValue={draft.primaryMax}
                onMinChange={(value) => setDraft({ primaryMin: value })}
                onMaxChange={(value) => setDraft({ primaryMax: value })}
              />

              <MetricSliderField
                label="Avg views"
                min={0}
                max={2_000_000}
                step={1000}
                value={draft.avgViews}
                onChange={(value) => setDraft({ avgViews: value })}
                bubbleFormatter={formatCompact}
                inputValue={String(draft.avgViews)}
                onInputChange={(value) =>
                  setDraft({
                    avgViews:
                      value === "" ? 0 : clamp(Number(value) || 0, 0, 2_000_000),
                  })
                }
              />

              <SelectField
                label="Language"
                value={draft.language}
                options={["English", "Hindi", "Spanish", "French"]}
                onChange={(value) => setDraft({ language: value })}
              />

              <MetricSliderField
                label="Avg engagement rate"
                min={0}
                max={20}
                step={0.1}
                value={draft.engagementRate}
                onChange={(value) => setDraft({ engagementRate: value })}
                bubbleFormatter={formatPercent}
                inputValue={String(draft.engagementRate)}
                onInputChange={(value) =>
                  setDraft({
                    engagementRate:
                      value === "" ? 0 : clamp(Number(value) || 0, 0, 20),
                  })
                }
                inputSuffix="%"
              />

              {/* <PriceRangeField
                label={platform === "instagram" ? "CPE" : "CPV"}
                minValue={draft.priceMin}
                maxValue={draft.priceMax}
                onMinChange={(value) => setDraft({ priceMin: value })}
                onMaxChange={(value) => setDraft({ priceMax: value })}
              /> */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlatformFiltersDropdown({
  anchorRef,
  platforms,
  setPlatforms,
  onClose,
}: PlatformFiltersDropdownProps) {
  const selectedPlatforms = useMemo(
    () => PLATFORM_ORDER.filter((platform) => platforms.includes(platform)),
    [platforms]
  );

  const [drafts, setDrafts] =
    useState<Record<Platform, PlatformDraft>>(defaultDrafts);

  const [menuWidth, setMenuWidth] = useState(592);
  const [alignRight, setAlignRight] = useState(true);

  useLayoutEffect(() => {
    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportPadding = 16;
      const idealWidth = 592;
      const safeWidth = Math.min(
        idealWidth,
        window.innerWidth - viewportPadding * 2
      );

      setMenuWidth(safeWidth);
      setAlignRight(rect.right - safeWidth >= viewportPadding);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);

    return () => window.removeEventListener("resize", updatePosition);
  }, [anchorRef]);

  const togglePlatform = (platform: Platform) => {
    const next = new Set(platforms);

    if (next.has(platform)) {
      next.delete(platform);
    } else {
      next.add(platform);
    }

    const finalValue = Array.from(next);
    setPlatforms(finalValue.length ? finalValue : [platform]);
  };

  const clearPlatform = (platform: Platform) => {
    const next = platforms.filter((item) => item !== platform);
    setPlatforms(next.length ? next : ["instagram"]);
    setDrafts((prev) => ({
      ...prev,
      [platform]: defaultDrafts[platform],
    }));
  };

  return (
    <div
      style={{ width: `${menuWidth}px` }}
      className={cn(
        "absolute top-[calc(100%+8px)] z-50 flex max-h-[min(82vh,46rem)] flex-col overflow-hidden rounded-[18px] border border-[#e6e0d7] bg-white shadow-[0_18px_48px_rgba(0,0,0,0.12)]",
        alignRight ? "right-0" : "left-0"
      )}
    >
      <div className="shrink-0 p-4 md:p-5">
        <h3 className="mb-5 text-[18px] font-semibold text-[#1A1A1A]">
          Select Platform
        </h3>

        <div className="mb-2 flex flex-wrap gap-3">
          {PLATFORM_ORDER.map((platform) => {
            const selected = platforms.includes(platform);

            return (
              <PlatformIconButton
                key={platform}
                selected={selected}
                onClick={() => togglePlatform(platform)}
              >
                <span className="text-[#111]">
                  {platformConfig[platform].icon}
                </span>
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
              setDrafts((prev) => ({
                ...prev,
                [platform]: {
                  ...prev[platform],
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
          onClick={() => setPlatforms(["instagram", "tiktok", "youtube"])}
          className="inline-flex h-11 w-full items-center justify-center rounded-[12px] border border-[#e0ddd7] bg-white px-5 text-sm font-semibold text-[#1A1A1A] sm:w-auto"
        >
          Select all
        </button>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-full min-w-[150px] items-center justify-center rounded-[12px] bg-[#121417] px-6 text-sm font-semibold text-white sm:w-auto"
        >
          Apply
        </button>
      </div>
    </div>
  );
}