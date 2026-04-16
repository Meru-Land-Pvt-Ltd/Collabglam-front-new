"use client";

import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { flushSync } from "react-dom";
import { InstagramLogo, TiktokLogo, YoutubeLogo } from "@phosphor-icons/react";
import type { FilterState, Platform, PlatformFilterState } from "./filters";
import {
  GROWTH_INTERVAL_OPTIONS,
  GROWTH_OPERATOR_OPTIONS,
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
  engagementsMin: string;
  engagementsMax: string;
  engagementRateMin: string;
  languageCode: string;
  lastPostedDays: string;
  locationIdsText: string;

  bioQuery: string;
  keywords: string;
  relevance: string;
  audienceRelevance: string;
  textTags: string;

  hasAudienceData: boolean;
  contactEmailOnly: boolean;

  followersGrowthInterval: string;
  followersGrowthOperator: string;
  followersGrowthValue: string;

  viewsGrowthInterval: string;
  viewsGrowthOperator: string;
  viewsGrowthValue: string;

  likesGrowthInterval: string;
  likesGrowthOperator: string;
  likesGrowthValue: string;

  reelsPlaysMin: string;
  reelsPlaysMax: string;

  sharesMin: string;
  sharesMax: string;
  savesMin: string;
  savesMax: string;

  interestsIdsText: string;
  brandsIdsText: string;
  igAccountTypesText: string;

  hasSponsoredPosts: boolean;
  hasYouTube: boolean;
  isOfficialArtist: boolean;
};

const platformConfig: Record<Platform, { label: string; icon: React.ReactNode }> = {
  youtube: { label: "YouTube", icon: <YoutubeLogo size={22} weight="fill" /> },
  instagram: { label: "Instagram", icon: <InstagramLogo size={22} weight="fill" /> },
  tiktok: { label: "TikTok", icon: <TiktokLogo size={22} weight="fill" /> },
};

function toDraftValue(value?: number | string) {
  return value == null ? "" : String(value);
}

function toDraftBool(value?: boolean) {
  return !!value;
}

function createEmptyDraft(): PlatformDraft {
  return {
    followersMin: "",
    followersMax: "",
    avgViewsMin: "",
    avgViewsMax: "",
    engagementsMin: "",
    engagementsMax: "",
    engagementRateMin: "",
    languageCode: "",
    lastPostedDays: "",
    locationIdsText: "",

    bioQuery: "",
    keywords: "",
    relevance: "",
    audienceRelevance: "",
    textTags: "",

    hasAudienceData: false,
    contactEmailOnly: false,

    followersGrowthInterval: "",
    followersGrowthOperator: "",
    followersGrowthValue: "",

    viewsGrowthInterval: "",
    viewsGrowthOperator: "",
    viewsGrowthValue: "",

    likesGrowthInterval: "",
    likesGrowthOperator: "",
    likesGrowthValue: "",

    reelsPlaysMin: "",
    reelsPlaysMax: "",

    sharesMin: "",
    sharesMax: "",
    savesMin: "",
    savesMax: "",

    interestsIdsText: "",
    brandsIdsText: "",
    igAccountTypesText: "",

    hasSponsoredPosts: false,
    hasYouTube: false,
    isOfficialArtist: false,
  };
}

function fromFilters(platformFilters: PlatformFilterState | undefined): PlatformDraft {
  return {
    followersMin: toDraftValue(platformFilters?.followersMin),
    followersMax: toDraftValue(platformFilters?.followersMax),
    avgViewsMin: toDraftValue(platformFilters?.avgViewsMin),
    avgViewsMax: toDraftValue(platformFilters?.avgViewsMax),
    engagementsMin: toDraftValue(platformFilters?.engagementsMin),
    engagementsMax: toDraftValue(platformFilters?.engagementsMax),
    engagementRateMin: toDraftValue(platformFilters?.engagementRateMin),
    languageCode: platformFilters?.languageCode || "",
    lastPostedDays: toDraftValue(platformFilters?.lastPostedDays),
    locationIdsText: platformFilters?.locationIdsText || "",

    bioQuery: platformFilters?.bioQuery || "",
    keywords: platformFilters?.keywords || "",
    relevance: platformFilters?.relevance || "",
    audienceRelevance: platformFilters?.audienceRelevance || "",
    textTags: platformFilters?.textTags || "",

    hasAudienceData: toDraftBool(platformFilters?.hasAudienceData),
    contactEmailOnly: toDraftBool(platformFilters?.contactEmailOnly),

    followersGrowthInterval: platformFilters?.followersGrowthInterval || "",
    followersGrowthOperator: platformFilters?.followersGrowthOperator || "",
    followersGrowthValue: toDraftValue(platformFilters?.followersGrowthValue),

    viewsGrowthInterval: platformFilters?.viewsGrowthInterval || "",
    viewsGrowthOperator: platformFilters?.viewsGrowthOperator || "",
    viewsGrowthValue: toDraftValue(platformFilters?.viewsGrowthValue),

    likesGrowthInterval: platformFilters?.likesGrowthInterval || "",
    likesGrowthOperator: platformFilters?.likesGrowthOperator || "",
    likesGrowthValue: toDraftValue(platformFilters?.likesGrowthValue),

    reelsPlaysMin: toDraftValue(platformFilters?.reelsPlaysMin),
    reelsPlaysMax: toDraftValue(platformFilters?.reelsPlaysMax),

    sharesMin: toDraftValue(platformFilters?.sharesMin),
    sharesMax: toDraftValue(platformFilters?.sharesMax),
    savesMin: toDraftValue(platformFilters?.savesMin),
    savesMax: toDraftValue(platformFilters?.savesMax),

    interestsIdsText: platformFilters?.interestsIdsText || "",
    brandsIdsText: platformFilters?.brandsIdsText || "",
    igAccountTypesText: platformFilters?.igAccountTypesText || "",

    hasSponsoredPosts: toDraftBool(platformFilters?.hasSponsoredPosts),
    hasYouTube: toDraftBool(platformFilters?.hasYouTube),
    isOfficialArtist: toDraftBool(platformFilters?.isOfficialArtist),
  };
}

function parseNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseString(value: string): string | undefined {
  const clean = value.trim();
  return clean ? clean : undefined;
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

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[11px] text-[#777]">{children}</p>;
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
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-full w-full min-w-0 bg-transparent px-3 text-sm text-[#222] outline-none placeholder:text-[#a0a0a0]"
      />
      {suffix ? <span className="shrink-0 pr-3 text-sm text-[#444]">{suffix}</span> : null}
    </div>
  );
}

function NumberInputField({
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
  hint,
}: {
  label: string;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <NumberInputField value={minValue} onChange={onMinChange} placeholder="Min" />
        </div>
        <span className="shrink-0 text-sm text-[#9a9a9a]">to</span>
        <div className="min-w-0 flex-1">
          <NumberInputField value={maxValue} onChange={onMaxChange} placeholder="Max" />
        </div>
      </div>
      {hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  hint?: string;
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
      {hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[12px] border border-[#ece7df] px-3 py-2.5">
      <span className="text-sm text-[#1A1A1A]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}

function GrowthTriplet({
  title,
  interval,
  operator,
  value,
  setInterval,
  setOperator,
  setValue,
}: {
  title: string;
  interval: string;
  operator: string;
  value: string;
  setInterval: (value: string) => void;
  setOperator: (value: string) => void;
  setValue: (value: string) => void;
}) {
  return (
    <div className="rounded-[14px] border border-[#ece7df] p-3">
      <p className="mb-3 text-sm font-semibold text-[#1A1A1A]">{title}</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SelectField
          label="Interval"
          value={interval}
          onChange={setInterval}
          options={[
            { label: "Any", value: "" },
            ...GROWTH_INTERVAL_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            })),
          ]}
        />

        <SelectField
          label="Operator"
          value={operator}
          onChange={setOperator}
          options={[
            { label: "Any", value: "" },
            ...GROWTH_OPERATOR_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            })),
          ]}
        />

        <div>
          <FieldLabel>Value</FieldLabel>
          <NumberInputField
            value={value}
            onChange={setValue}
            placeholder="Value"
          />
        </div>
      </div>
    </div>
  );
}

function SimpleTextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <InputField value={value} onChange={onChange} placeholder={placeholder} />
      {hint ? <FieldHint>{hint}</FieldHint> : null}
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
  const isInstagram = platform === "instagram";
  const isTiktok = platform === "tiktok";

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

      <div className="space-y-4">
        <div className="rounded-[18px] border border-[#e5e1da] bg-white p-4">
          <div className="mb-4 text-[14px] font-semibold text-[#1A1A1A]">Core filters</div>
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

            <MinMaxField
              label="Engagements"
              minValue={draft.engagementsMin}
              maxValue={draft.engagementsMax}
              onMinChange={(value) => setDraft({ engagementsMin: value })}
              onMaxChange={(value) => setDraft({ engagementsMax: value })}
            />

            <div>
              <FieldLabel>Minimum engagement rate</FieldLabel>
              <NumberInputField
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

            <SimpleTextField
              label="Influencer location IDs"
              value={draft.locationIdsText}
              onChange={(value) => setDraft({ locationIdsText: value })}
              placeholder="148838,62149"
              hint="Comma separated location IDs"
            />
          </div>
        </div>

        <div className="rounded-[18px] border border-[#e5e1da] bg-white p-4">
          <div className="mb-4 text-[14px] font-semibold text-[#1A1A1A]">Discovery matching</div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <SimpleTextField
              label="Bio query"
              value={draft.bioQuery}
              onChange={(value) => setDraft({ bioQuery: value })}
              placeholder="photos videos"
            />

            <SimpleTextField
              label="Keywords"
              value={draft.keywords}
              onChange={(value) => setDraft({ keywords: value })}
              placeholder="cars, beauty hacks"
              hint="Phrase used in captions or spoken content"
            />

            <SimpleTextField
              label="Relevance terms"
              value={draft.relevance}
              onChange={(value) => setDraft({ relevance: value })}
              placeholder="#cars, @topgear"
              hint="Comma separated hashtags, handles, or terms"
            />

            <SimpleTextField
              label="Audience relevance"
              value={draft.audienceRelevance}
              onChange={(value) => setDraft({ audienceRelevance: value })}
              placeholder="@topgear"
              hint="Comma separated reference handles"
            />

            <SimpleTextField
              label="Text tags"
              value={draft.textTags}
              onChange={(value) => setDraft({ textTags: value })}
              placeholder="#carsofinstagram, @topgear"
              hint="Example: #cars, @topgear"
            />
          </div>
        </div>

        <div className="rounded-[18px] border border-[#e5e1da] bg-white p-4">
          <div className="mb-4 text-[14px] font-semibold text-[#1A1A1A]">Data requirements</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ToggleRow
              label="Require audience data"
              checked={draft.hasAudienceData}
              onChange={(next) => setDraft({ hasAudienceData: next })}
            />
            <ToggleRow
              label="Require email contact"
              checked={draft.contactEmailOnly}
              onChange={(next) => setDraft({ contactEmailOnly: next })}
            />
          </div>
        </div>

        <div className="rounded-[18px] border border-[#e5e1da] bg-white p-4">
          <div className="mb-4 text-[14px] font-semibold text-[#1A1A1A]">Growth filters</div>
          <div className="space-y-3">
            <GrowthTriplet
              title="Followers growth"
              interval={draft.followersGrowthInterval}
              operator={draft.followersGrowthOperator}
              value={draft.followersGrowthValue}
              setInterval={(value) => setDraft({ followersGrowthInterval: value })}
              setOperator={(value) => setDraft({ followersGrowthOperator: value })}
              setValue={(value) => setDraft({ followersGrowthValue: value })}
            />

            {isYoutube ? (
              <GrowthTriplet
                title="Views growth"
                interval={draft.viewsGrowthInterval}
                operator={draft.viewsGrowthOperator}
                value={draft.viewsGrowthValue}
                setInterval={(value) => setDraft({ viewsGrowthInterval: value })}
                setOperator={(value) => setDraft({ viewsGrowthOperator: value })}
                setValue={(value) => setDraft({ viewsGrowthValue: value })}
              />
            ) : null}

            {isTiktok ? (
              <GrowthTriplet
                title="Likes growth"
                interval={draft.likesGrowthInterval}
                operator={draft.likesGrowthOperator}
                value={draft.likesGrowthValue}
                setInterval={(value) => setDraft({ likesGrowthInterval: value })}
                setOperator={(value) => setDraft({ likesGrowthOperator: value })}
                setValue={(value) => setDraft({ likesGrowthValue: value })}
              />
            ) : null}
          </div>
        </div>

        {isInstagram ? (
          <div className="rounded-[18px] border border-[#e5e1da] bg-white p-4">
            <div className="mb-4 text-[14px] font-semibold text-[#1A1A1A]">Instagram extras</div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <MinMaxField
                label="Reels plays"
                minValue={draft.reelsPlaysMin}
                maxValue={draft.reelsPlaysMax}
                onMinChange={(value) => setDraft({ reelsPlaysMin: value })}
                onMaxChange={(value) => setDraft({ reelsPlaysMax: value })}
              />

              <SimpleTextField
                label="Instagram account types"
                value={draft.igAccountTypesText}
                onChange={(value) => setDraft({ igAccountTypesText: value })}
                placeholder="2,3"
                hint="1 = Regular, 2 = Business, 3 = Creator"
              />

              <SimpleTextField
                label="Instagram interests IDs"
                value={draft.interestsIdsText}
                onChange={(value) => setDraft({ interestsIdsText: value })}
                placeholder="3,21,1"
              />

              <SimpleTextField
                label="Instagram brand IDs"
                value={draft.brandsIdsText}
                onChange={(value) => setDraft({ brandsIdsText: value })}
                placeholder="1708,13"
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <ToggleRow
                label="Sponsored posts only"
                checked={draft.hasSponsoredPosts}
                onChange={(next) => setDraft({ hasSponsoredPosts: next })}
              />
              <ToggleRow
                label="Must have YouTube linked"
                checked={draft.hasYouTube}
                onChange={(next) => setDraft({ hasYouTube: next })}
              />
            </div>
          </div>
        ) : null}

        {isYoutube ? (
          <div className="rounded-[18px] border border-[#e5e1da] bg-white p-4">
            <div className="mb-4 text-[14px] font-semibold text-[#1A1A1A]">YouTube extras</div>
            <ToggleRow
              label="Official artist only"
              checked={draft.isOfficialArtist}
              onChange={(next) => setDraft({ isOfficialArtist: next })}
            />
          </div>
        ) : null}

        {isTiktok ? (
          <div className="rounded-[18px] border border-[#e5e1da] bg-white p-4">
            <div className="mb-4 text-[14px] font-semibold text-[#1A1A1A]">TikTok extras</div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <MinMaxField
                label="Shares"
                minValue={draft.sharesMin}
                maxValue={draft.sharesMax}
                onMinChange={(value) => setDraft({ sharesMin: value })}
                onMaxChange={(value) => setDraft({ sharesMax: value })}
              />
              <MinMaxField
                label="Saves"
                minValue={draft.savesMin}
                maxValue={draft.savesMax}
                onMinChange={(value) => setDraft({ savesMin: value })}
                onMaxChange={(value) => setDraft({ savesMax: value })}
              />
            </div>
          </div>
        ) : null}
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
  const [menuWidth, setMenuWidth] = useState(680);
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
      const idealWidth = 680;
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
      [platform]: createEmptyDraft(),
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
        updateFilter(`platform.${platform}.engagementsMin`, parseNumber(draft.engagementsMin));
        updateFilter(`platform.${platform}.engagementsMax`, parseNumber(draft.engagementsMax));
        updateFilter(`platform.${platform}.engagementRateMin`, parseNumber(draft.engagementRateMin));
        updateFilter(`platform.${platform}.languageCode`, parseString(draft.languageCode));
        updateFilter(`platform.${platform}.lastPostedDays`, parseNumber(draft.lastPostedDays));
        updateFilter(`platform.${platform}.locationIdsText`, parseString(draft.locationIdsText));

        updateFilter(`platform.${platform}.bioQuery`, parseString(draft.bioQuery));
        updateFilter(`platform.${platform}.keywords`, parseString(draft.keywords));
        updateFilter(`platform.${platform}.relevance`, parseString(draft.relevance));
        updateFilter(`platform.${platform}.audienceRelevance`, parseString(draft.audienceRelevance));
        updateFilter(`platform.${platform}.textTags`, parseString(draft.textTags));

        updateFilter(`platform.${platform}.hasAudienceData`, draft.hasAudienceData || undefined);
        updateFilter(`platform.${platform}.contactEmailOnly`, draft.contactEmailOnly || undefined);

        updateFilter(`platform.${platform}.followersGrowthInterval`, parseString(draft.followersGrowthInterval));
        updateFilter(`platform.${platform}.followersGrowthOperator`, parseString(draft.followersGrowthOperator));
        updateFilter(`platform.${platform}.followersGrowthValue`, parseNumber(draft.followersGrowthValue));

        updateFilter(`platform.${platform}.viewsGrowthInterval`, parseString(draft.viewsGrowthInterval));
        updateFilter(`platform.${platform}.viewsGrowthOperator`, parseString(draft.viewsGrowthOperator));
        updateFilter(`platform.${platform}.viewsGrowthValue`, parseNumber(draft.viewsGrowthValue));

        updateFilter(`platform.${platform}.likesGrowthInterval`, parseString(draft.likesGrowthInterval));
        updateFilter(`platform.${platform}.likesGrowthOperator`, parseString(draft.likesGrowthOperator));
        updateFilter(`platform.${platform}.likesGrowthValue`, parseNumber(draft.likesGrowthValue));

        updateFilter(`platform.${platform}.reelsPlaysMin`, parseNumber(draft.reelsPlaysMin));
        updateFilter(`platform.${platform}.reelsPlaysMax`, parseNumber(draft.reelsPlaysMax));

        updateFilter(`platform.${platform}.sharesMin`, parseNumber(draft.sharesMin));
        updateFilter(`platform.${platform}.sharesMax`, parseNumber(draft.sharesMax));
        updateFilter(`platform.${platform}.savesMin`, parseNumber(draft.savesMin));
        updateFilter(`platform.${platform}.savesMax`, parseNumber(draft.savesMax));

        updateFilter(`platform.${platform}.interestsIdsText`, parseString(draft.interestsIdsText));
        updateFilter(`platform.${platform}.brandsIdsText`, parseString(draft.brandsIdsText));
        updateFilter(`platform.${platform}.igAccountTypesText`, parseString(draft.igAccountTypesText));

        updateFilter(`platform.${platform}.hasSponsoredPosts`, draft.hasSponsoredPosts || undefined);
        updateFilter(`platform.${platform}.hasYouTube`, draft.hasYouTube || undefined);
        updateFilter(`platform.${platform}.isOfficialArtist`, draft.isOfficialArtist || undefined);
      });
    });

    onApply?.();
    onClose();
  };

  return (
    <div
      style={{ width: `${menuWidth}px` }}
      className={cn(
        "absolute top-[calc(100%+8px)] z-50 flex max-h-[min(82vh,48rem)] flex-col overflow-hidden rounded-[18px] border border-[#e6e0d7] bg-white shadow-[0_18px_48px_rgba(0,0,0,0.12)]",
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