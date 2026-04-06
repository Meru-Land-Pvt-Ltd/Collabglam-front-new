"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { FilterState, Platform } from "./filters";
import {
  AI_ACCOUNT_TYPE_OPTIONS,
  AI_CONTENT_TYPE_OPTIONS,
  AUDIENCE_AGE_OPTIONS,
  AUDIENCE_GENDER_OPTIONS,
  INFLUENCER_GENDER_OPTIONS,
  LANGUAGE_OPTIONS,
  SEARCH_MODE_OPTIONS,
} from "./filters";

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

function toInputValue(value?: number | string) {
  return value == null ? "" : String(value);
}

function toOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[#1A1A1A]">{label}</label>
      {children}
      {hint ? <p className="text-[11px] text-[#7b7b7b]">{hint}</p> : null}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-[12px] border border-[#d8d8d8] bg-white px-3 text-sm text-[#222] outline-none focus:border-black",
        props.className,
      )}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-11 w-full rounded-[12px] border border-[#d8d8d8] bg-white px-3 text-sm text-[#222] outline-none focus:border-black",
        props.className,
      )}
    />
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
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [draft, setDraft] = useState({
    search: filters.search,
    influencer: filters.influencer,
    audience: filters.audience,
  });

  const [menuWidth, setMenuWidth] = useState(760);
  const [alignRight, setAlignRight] = useState(true);

  useEffect(() => {
    if (!open) return;
    setDraft({
      search: { ...filters.search },
      influencer: { ...filters.influencer },
      audience: { ...filters.audience },
    });
  }, [filters, open]);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportPadding = 16;
      const idealWidth = 760;
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

  if (!open) return null;

  const setSearch = (key: keyof typeof draft.search, value: any) =>
    setDraft((current) => ({ ...current, search: { ...current.search, [key]: value } }));

  const setInfluencer = (key: keyof typeof draft.influencer, value: any) =>
    setDraft((current) => ({ ...current, influencer: { ...current.influencer, [key]: value } }));

  const setAudience = (key: keyof typeof draft.audience, value: any) =>
    setDraft((current) => ({ ...current, audience: { ...current.audience, [key]: value } }));

  const applyChanges = () => {
    updateFilter("search.mode", draft.search.mode);
    updateFilter("search.aiQuery", draft.search.aiQuery || undefined);
    updateFilter(
      "search.exactHandleBoost",
      draft.search.exactHandleBoost === false ? false : undefined,
    );
    updateFilter("search.aiHasEmail", draft.search.aiHasEmail || undefined);
    updateFilter("search.aiContentType", draft.search.aiContentType || undefined);
    updateFilter("search.aiMaxPostAgeMonths", draft.search.aiMaxPostAgeMonths || undefined);
    updateFilter("search.aiUsername", draft.search.aiUsername || undefined);
    updateFilter("search.aiBrandsText", draft.search.aiBrandsText || undefined);
    updateFilter("search.aiAccountType", draft.search.aiAccountType || undefined);

    updateFilter("influencer.isVerified", draft.influencer.isVerified || undefined);
    updateFilter("influencer.ageMin", draft.influencer.ageMin || undefined);
    updateFilter("influencer.ageMax", draft.influencer.ageMax || undefined);
    updateFilter("influencer.gender", draft.influencer.gender || undefined);

    updateFilter("audience.country", draft.audience.country || undefined);
    updateFilter("audience.locationIdsText", draft.audience.locationIdsText || undefined);
    updateFilter("audience.locationWeight", draft.audience.locationWeight || undefined);
    updateFilter("audience.languageCode", draft.audience.languageCode || undefined);
    updateFilter("audience.languageWeight", draft.audience.languageWeight || undefined);
    updateFilter("audience.gender", draft.audience.gender || undefined);
    updateFilter("audience.genderWeight", draft.audience.genderWeight || undefined);
    updateFilter("audience.ageBucket", draft.audience.ageBucket || undefined);
    updateFilter("audience.ageWeight", draft.audience.ageWeight || undefined);
    updateFilter("audience.interestsIdsText", draft.audience.interestsIdsText || undefined);
    updateFilter("audience.interestsWeight", draft.audience.interestsWeight || undefined);
    updateFilter("audience.credibilityMin", draft.audience.credibilityMin || undefined);

    onApply();
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ width: `${menuWidth}px` }}
      className={cn(
        "absolute top-[calc(100%+8px)] z-50 max-h-[min(82vh,48rem)] overflow-y-auto rounded-[18px] border border-[#e6e0d7] bg-white shadow-[0_18px_48px_rgba(0,0,0,0.12)]",
        alignRight ? "right-0" : "left-0",
      )}
    >
      <div className="space-y-6 p-4 md:p-5">
        <section className="space-y-4">
          <div>
            <h3 className="text-[17px] font-semibold text-[#1A1A1A]">Search settings</h3>
            <p className="mt-1 text-xs text-[#777]">
              Combined runs exact handle lookup + standard search + AI search together.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Search mode">
              <Select
                value={draft.search.mode}
                onChange={(event) => setSearch("mode", event.target.value)}
              >
                {SEARCH_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="AI query override" hint="Leave empty to reuse the main search box text">
              <Input
                value={toInputValue(draft.search.aiQuery)}
                onChange={(event) => setSearch("aiQuery", event.target.value)}
                placeholder="woman with curly hair lifting weights"
              />
            </Field>

            <Field label="AI username">
              <Input
                value={toInputValue(draft.search.aiUsername)}
                onChange={(event) => setSearch("aiUsername", event.target.value)}
                placeholder="@creator_handle"
              />
            </Field>

            <Field label="AI brand names" hint="Comma separated brand names for AI search">
              <Input
                value={toInputValue(draft.search.aiBrandsText)}
                onChange={(event) => setSearch("aiBrandsText", event.target.value)}
                placeholder="Nike, Adidas"
              />
            </Field>

            <Field label="AI account type">
              <Select
                value={toInputValue(draft.search.aiAccountType)}
                onChange={(event) => setSearch("aiAccountType", event.target.value || undefined)}
              >
                {AI_ACCOUNT_TYPE_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="AI content type">
              <Select
                value={toInputValue(draft.search.aiContentType)}
                onChange={(event) => setSearch("aiContentType", event.target.value || undefined)}
              >
                {AI_CONTENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="AI max post age (months)">
              <Select
                value={toInputValue(draft.search.aiMaxPostAgeMonths)}
                onChange={(event) =>
                  setSearch(
                    "aiMaxPostAgeMonths",
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
              >
                <option value="">Any recency</option>
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="9">9 months</option>
                <option value="12">12 months</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ToggleRow
              label="Boost exact handle / URL matches first"
              checked={draft.search.exactHandleBoost !== false}
              onChange={(next) => setSearch("exactHandleBoost", next ? undefined : false)}
            />
            <ToggleRow
              label="AI search: require email"
              checked={!!draft.search.aiHasEmail}
              onChange={(next) => setSearch("aiHasEmail", next || undefined)}
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-[#ece7df] pt-5">
          <h3 className="text-[17px] font-semibold text-[#1A1A1A]">Influencer filters</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Age min">
              <Input
                type="number"
                value={toInputValue(draft.influencer.ageMin)}
                onChange={(event) => setInfluencer("ageMin", toOptionalNumber(event.target.value))}
                placeholder="18"
              />
            </Field>

            <Field label="Age max">
              <Input
                type="number"
                value={toInputValue(draft.influencer.ageMax)}
                onChange={(event) => setInfluencer("ageMax", toOptionalNumber(event.target.value))}
                placeholder="45"
              />
            </Field>

            <Field label="Gender">
              <Select
                value={toInputValue(draft.influencer.gender)}
                onChange={(event) => setInfluencer("gender", event.target.value || undefined)}
              >
                {INFLUENCER_GENDER_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <ToggleRow
            label="Verified creators only"
            checked={!!draft.influencer.isVerified}
            onChange={(next) => setInfluencer("isVerified", next || undefined)}
          />
        </section>

        <section className="space-y-4 border-t border-[#ece7df] pt-5">
          <h3 className="text-[17px] font-semibold text-[#1A1A1A]">Audience filters</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Audience country text" hint="Client-side fallback filter on returned country/location">
              <Input
                value={toInputValue(draft.audience.country)}
                onChange={(event) => setAudience("country", event.target.value)}
                placeholder="India"
              />
            </Field>

            <Field label="Audience location IDs" hint="Comma separated location IDs for weighted API filtering">
              <Input
                value={toInputValue(draft.audience.locationIdsText)}
                onChange={(event) => setAudience("locationIdsText", event.target.value)}
                placeholder="148838,62149"
              />
            </Field>

            <Field label="Location weight">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={toInputValue(draft.audience.locationWeight)}
                onChange={(event) =>
                  setAudience("locationWeight", toOptionalNumber(event.target.value))
                }
                placeholder="0.2"
              />
            </Field>

            <Field label="Audience language">
              <Select
                value={toInputValue(draft.audience.languageCode)}
                onChange={(event) => setAudience("languageCode", event.target.value || undefined)}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Language weight">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={toInputValue(draft.audience.languageWeight)}
                onChange={(event) =>
                  setAudience("languageWeight", toOptionalNumber(event.target.value))
                }
                placeholder="0.2"
              />
            </Field>

            <Field label="Audience gender">
              <Select
                value={toInputValue(draft.audience.gender)}
                onChange={(event) => setAudience("gender", event.target.value || undefined)}
              >
                {AUDIENCE_GENDER_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Gender weight">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={toInputValue(draft.audience.genderWeight)}
                onChange={(event) =>
                  setAudience("genderWeight", toOptionalNumber(event.target.value))
                }
                placeholder="0.5"
              />
            </Field>

            <Field label="Audience age bucket">
              <Select
                value={toInputValue(draft.audience.ageBucket)}
                onChange={(event) => setAudience("ageBucket", event.target.value || undefined)}
              >
                {AUDIENCE_AGE_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Age weight">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={toInputValue(draft.audience.ageWeight)}
                onChange={(event) =>
                  setAudience("ageWeight", toOptionalNumber(event.target.value))
                }
                placeholder="0.3"
              />
            </Field>

            <Field label="Audience interests IDs">
              <Input
                value={toInputValue(draft.audience.interestsIdsText)}
                onChange={(event) => setAudience("interestsIdsText", event.target.value)}
                placeholder="1708,13,3"
              />
            </Field>

            <Field label="Interests weight">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={toInputValue(draft.audience.interestsWeight)}
                onChange={(event) =>
                  setAudience("interestsWeight", toOptionalNumber(event.target.value))
                }
                placeholder="0.3"
              />
            </Field>

            <Field label="Audience credibility min" hint="Useful especially for Instagram audience credibility">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={toInputValue(draft.audience.credibilityMin)}
                onChange={(event) =>
                  setAudience("credibilityMin", toOptionalNumber(event.target.value))
                }
                placeholder="0.75"
              />
            </Field>
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-3 border-t border-[#ece7df] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex h-11 items-center justify-center rounded-[12px] border border-[#e0ddd7] bg-white px-5 text-sm font-semibold text-[#1A1A1A]"
        >
          Clear all
        </button>

        <button
          type="button"
          onClick={applyChanges}
          disabled={loading}
          className="inline-flex h-11 min-w-[160px] items-center justify-center rounded-[12px] bg-black px-6 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Apply filters
        </button>
      </div>
    </div>
  );
}