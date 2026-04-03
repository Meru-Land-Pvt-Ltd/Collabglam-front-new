export type Platform = "youtube" | "instagram" | "tiktok";
export type GenderValue = "MALE" | "FEMALE" | "NON_BINARY";

export interface PlatformFilterState {
  followersMin?: number;
  followersMax?: number;
  avgViewsMin?: number;
  avgViewsMax?: number;
  engagementRateMin?: number; // UI percent, backend gets 0..1
  languageCode?: string;
  lastPostedDays?: number;
}

export interface InfluencerFilterState {
  isVerified?: boolean;
  ageMin?: number;
  ageMax?: number;
  gender?: GenderValue;
}

export interface AudienceFilterState {
  country?: string; // client-side filter using returned country/location text
}

export interface FilterState {
  influencer: InfluencerFilterState;
  audience: AudienceFilterState;
  platform: Record<Platform, PlatformFilterState>;
}

export type InfluencerFilters = InfluencerFilterState;
export type AudienceFilters = AudienceFilterState;

export const PLATFORM_ORDER: Platform[] = ["youtube", "instagram", "tiktok"];

export const DEFAULT_PLATFORM_FILTERS: PlatformFilterState = {
  followersMin: undefined,
  followersMax: undefined,
  avgViewsMin: undefined,
  avgViewsMax: undefined,
  engagementRateMin: undefined,
  languageCode: undefined,
  lastPostedDays: undefined,
};

export const DEFAULT_FILTER_STATE: FilterState = {
  influencer: {
    isVerified: undefined,
    ageMin: undefined,
    ageMax: undefined,
    gender: undefined,
  },
  audience: {
    country: undefined,
  },
  platform: {
    youtube: { ...DEFAULT_PLATFORM_FILTERS },
    instagram: { ...DEFAULT_PLATFORM_FILTERS },
    tiktok: { ...DEFAULT_PLATFORM_FILTERS },
  },
};

export function createDefaultFilters(): FilterState {
  return {
    influencer: { ...DEFAULT_FILTER_STATE.influencer },
    audience: { ...DEFAULT_FILTER_STATE.audience },
    platform: {
      youtube: { ...DEFAULT_PLATFORM_FILTERS },
      instagram: { ...DEFAULT_PLATFORM_FILTERS },
      tiktok: { ...DEFAULT_PLATFORM_FILTERS },
    },
  };
}

export const LANGUAGE_OPTIONS = [
  { label: "Any language", value: "" },
  { label: "English", value: "en" },
  { label: "Hindi", value: "hi" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Portuguese", value: "pt" },
];

export const LAST_POSTED_OPTIONS = [
  { label: "Any time", value: undefined },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "180 days", value: 180 },
];

export function languageCodeToLabel(code?: string): string {
  return LANGUAGE_OPTIONS.find((item) => item.value === (code || ""))?.label || "Any language";
}

export function labelToLanguageCode(label?: string): string | undefined {
  if (!label) return undefined;
  return LANGUAGE_OPTIONS.find((item) => item.label.toLowerCase() === label.toLowerCase())?.value || undefined;
}

export function lastPostedDaysToLabel(days?: number): string {
  return LAST_POSTED_OPTIONS.find((item) => item.value === days)?.label || "Any time";
}

export function labelToLastPostedDays(label?: string): number | undefined {
  if (!label) return undefined;
  return LAST_POSTED_OPTIONS.find((item) => item.label.toLowerCase() === label.toLowerCase())?.value;
}

export function normalizeInfluencerAgeRange(
  min?: number,
  max?: number,
): { min?: number; max?: number } | undefined {
  const allowed = [18, 25, 35, 45, 65];

  const normalizedMin =
    min == null ? undefined : allowed.find((value) => min <= value) ?? allowed[allowed.length - 1];

  const normalizedMax =
    max == null
      ? undefined
      : [...allowed].reverse().find((value) => max >= value) ?? allowed[0];

  if (normalizedMin == null && normalizedMax == null) return undefined;
  if (
    normalizedMin != null &&
    normalizedMax != null &&
    normalizedMin > normalizedMax
  ) {
    return { min: normalizedMax, max: normalizedMin };
  }

  return { min: normalizedMin, max: normalizedMax };
}

export function isFilled(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).some(isFilled);
  return false;
}

export function countActiveFilters(filters: FilterState): number {
  return [filters.influencer, filters.audience, ...Object.values(filters.platform)]
    .flatMap((section) => Object.values(section ?? {}))
    .filter(isFilled).length;
}

export function setNestedFilterValue<T extends Record<string, any>>(
  state: T,
  path: string,
  value: unknown,
): T {
  const keys = path.split(".");
  const clone: Record<string, any> = Array.isArray(state) ? [...state] : { ...state };

  let cursor: Record<string, any> = clone;
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const isLast = i === keys.length - 1;

    if (isLast) {
      if (value === undefined || value === null || value === "") {
        delete cursor[key];
      } else {
        cursor[key] = value;
      }
      break;
    }

    const current = cursor[key];
    cursor[key] = current && typeof current === "object" && !Array.isArray(current) ? { ...current } : {};
    cursor = cursor[key];
  }

  return clone as T;
}
