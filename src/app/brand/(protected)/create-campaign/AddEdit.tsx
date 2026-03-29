"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/buttonComp";
import { FloatingInput } from "@/components/ui/floatingInput";
import { FloatingMultiSelect, FloatingSelect, SelectItem } from "@/components/ui/selectComp";
import { LabeledTextarea } from "@/components/ui/textAreaComp";
import { ProductImagesUpload } from "@/components/ui/upload-card";
import { ProductCardUpload } from "@/components/ui/productCard-Image";
import { ManualPreviewCardStack, toMap } from "@/components/ui/cardPreview";
import { FloatingDateInput } from "@/components/ui/date";
import { FloatingTagInput } from "@/components/ui/tagInput";

import { TopbarAction, useBrandTopbar } from "@/components/ui/brand/brandTopbarProvider";

import {
  apiCampaignCreate,
  apiCampaignEditDraft,
  apiCampaignGetById,
  apiCampaignPrefillAI,
  apiGetTimezonesByCountries,
  getApiErrorMessage,
  CampaignStatus,
  CreateCampaignManualPayload,
  EditDraftPayload,
  EnrichedCampaignDoc,
  PrefillCampaignAIPayload,
  GetTimezonesByCountriesResponse,
} from "../../services/brandApi";

import {
  CAMPAIGN_TYPES,
  cn,
  compact,
  countryKey,
  filesToDataUrls,
  getBrandId,
  getDefaultScheduleTime,
  idsOf,
  isObjectId,
  isValidDateRange,
  LAYOUT,
  MANUAL_PLATFORM_OPTIONS,
  mapPlatforms,
  MAX_FILE_MB,
  Option,
  pickCampaignId,
  platformToUi,
  safeDateInput,
  SEARCHABLE_UI,
  SEEN_KEY,
  splitCountrySelection,
  useSearchProps,
  validateFiles,
  mergeOptions,
  prettyTierValue,
} from "./create-campaign.utils";

import { ScheduleCampaignOverlay, normalizeTimeZone } from "./ScheduleCampaignOverlay";
import { useCampaignLists, useCategoryPicker, useResponsivePreviewWidth, useSidebarOffsetPx } from "./create-campaign.hooks";

import { CaretDown, CaretUp, Clock, Eye, EyeClosed, Info, PaperPlaneTilt, SparkleIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import SparkleAnimation from "@/components/ui/StarTwinkle";

/* ============================================================================
   ✅ Toast helpers
============================================================================ */
function toastSuccess(title: string, description?: string) {
  return toast({ icon: "success", title, text: description });
}
function toastError(title: string, description?: string) {
  return toast({ icon: "error", title, text: description });
}

/* ============================================================================
   ✅ Shared UI bits
============================================================================ */
function CenterWrap({ children, withBottomBar = false }: { children: React.ReactNode; withBottomBar?: boolean }) {
  return <div className={cn("cg-center-wrap", withBottomBar && "cg-center-wrap--with-bottom")}>{children}</div>;
}

function ProgressBar({
  value,
  barClassName = "bg-neutral-900",
  heightClassName = "h-[2px]",
}: {
  value: number;
  barClassName?: string;
  heightClassName?: string;
}) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[12px] text-neutral-600">
        <span>{safe}%</span>
        <span>100%</span>
      </div>
      <div className={cn("mt-2 w-full rounded-pill overflow-hidden bg-neutral-150", heightClassName)}>
        <div className={cn("h-full transition-[width] duration-200 ease-out rounded-pill", barClassName)} style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}

function useViewportWidth() {
  const [w, setW] = React.useState(() => (typeof window !== "undefined" ? window.innerWidth : 0));

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const vv = window.visualViewport;

    const update = () => {
      const next = Math.round(vv?.width ?? window.innerWidth);
      setW((prev) => (prev === next ? prev : next));
    };

    update();

    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update, { passive: true });
    vv?.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      vv?.removeEventListener("resize", update);
    };
  }, []);

  return w;
}

function FixedBottomBar({
  sidebarOffsetPx,
  left,
  right,
  containerMaxWidth = 1200,
}: {
  sidebarOffsetPx: number;
  left?: React.ReactNode;
  right?: React.ReactNode;
  containerMaxWidth?: number;
}) {
  const viewportW = useViewportWidth();
  const barRef = React.useRef<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    if (!barRef.current || typeof window === "undefined") return;

    const el = barRef.current;
    let last = -1;

    const setH = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h !== last) {
        last = h;
        document.documentElement.style.setProperty("--cg-bottombar-h", `${h}px`);
      }
    };

    setH();

    const ro = new ResizeObserver(() => setH());
    ro.observe(el);

    window.addEventListener("resize", setH, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setH);
    };
  }, []);

  const clampedMaxW = React.useMemo(() => {
    const contentW = Math.max(0, viewportW - (sidebarOffsetPx || 0));
    return Math.max(0, Math.min(containerMaxWidth, contentW || containerMaxWidth));
  }, [viewportW, sidebarOffsetPx, containerMaxWidth]);

  return (
    <div
      ref={barRef}
      className="cg-bottom-bar"
      style={{
        left: sidebarOffsetPx,
        right: 0,
        ["--cg-bottombar-maxw" as any]: `${clampedMaxW}px`,
      }}
    >
      <div className={cn("cg-bottom-bar-inner", "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between")}>
        <div className="flex items-center gap-2 flex-wrap">{left}</div>
        <div className="flex items-center gap-2 flex-wrap sm:justify-end">{right}</div>
      </div>
    </div>
  );
}

/* ============================================================================
   ✅ Forms
============================================================================ */
type CampaignForm = {
  title: string;
  description: string;
  campaignType: string;
  productLink: string;

  categoryId: string;
  categoryName: string;

  subcategory: string[];
  ageGroup: string[];
  country: string[];

  files: File[];
};

const EMPTY_FORM: CampaignForm = {
  title: "",
  description: "",
  campaignType: "",
  productLink: "",
  categoryId: "",
  categoryName: "",
  subcategory: [],
  ageGroup: [],
  country: [],
  files: [],
};

type SavedProductImage = {
  dataUrl: string;
  key?: string;
  contentType?: string;
  size?: number;
  name?: string;
};


function useCampaignForm(initial?: Partial<CampaignForm>) {
  const [form, setForm] = useState<CampaignForm>({ ...EMPTY_FORM, ...(initial ?? {}) });

  const setField = useCallback(<K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  }, []);

  return { form, setForm, setField };
}

function calcProgress(form: CampaignForm) {
  const keys: (keyof CampaignForm)[] = ["title", "description", "categoryId", "subcategory", "ageGroup", "country", "files"];
  const filled = keys.filter((k) => {
    const v = (form as any)[k];
    if (Array.isArray(v)) return v.length > 0;
    return String(v ?? "").trim().length > 0;
  }).length;
  return Math.round((filled / keys.length) * 100);
}

type ManualForm = {
  title: string;
  description: string;
  campaignType: string;

  categoryId: string;
  categoryName: string;
  subcategories: string[];

  productFiles: File[];
  productLink: string;

  goals: string[];
  numberOfInfluencers: number;
  influencerTier: string[];
  minFollowers: number;
  maxFollowers: number;

  contentFormats: string[];
  contentLanguage: string[];

  paymentType: string;
  campaignBudget: number;
  startDate: string;
  endDate: string;

  platforms: string[];
  targetCountry: string[];
  targetAgeGroups: string[];

  additionalNotes: string;
  attachment: File | null;

  hashtags: string[];
};

const EMPTY_MANUAL: ManualForm = {
  title: "",
  description: "",
  campaignType: "",
  categoryId: "",
  categoryName: "",
  subcategories: [],
  productFiles: [],
  productLink: "",

  goals: [],
  numberOfInfluencers: 0,
  influencerTier: [],
  minFollowers: 0,
  maxFollowers: 0,

  contentFormats: [],
  contentLanguage: [],

  paymentType: "",
  campaignBudget: 0,
  startDate: "",
  endDate: "",

  platforms: [],
  targetCountry: [],
  targetAgeGroups: [],

  additionalNotes: "",
  attachment: null,

  hashtags: [],
};

const clampNonNegative = (v: string | number) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
};

type TierRange = { min?: number; max?: number };

const parseAbbrevNumber = (raw: string): number | null => {
  if (!raw) return null;
  let s = String(raw).trim().toUpperCase();
  s = s.replace(/[, ]+/g, "").replace(/\+$/, "");

  const m = s.match(/^(\d+(?:\.\d+)?)([KMB])?$/);
  if (!m) return null;

  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;

  const unit = m[2];
  const mul = unit === "K" ? 1e3 : unit === "M" ? 1e6 : unit === "B" ? 1e9 : 1;

  return Math.round(n * mul);
};

const parseRangeFromText = (text?: string): TierRange | null => {
  if (!text) return null;

  const paren = text.match(/\(([^)]+)\)/)?.[1] ?? text;

  const normalized = String(paren)
    .trim()
    .replace(/[–—]/g, "-")
    .replace(/\bto\b/gi, "-");

  const parts = normalized
    .split("-")
    .map((x) => x.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const min = parseAbbrevNumber(parts[0]);
    const max = parseAbbrevNumber(parts[1]);
    if (min == null && max == null) return null;
    return { min: min ?? undefined, max: max ?? undefined };
  }

  if (parts.length === 1) {
    const n = parseAbbrevNumber(parts[0]);
    if (n == null) return null;
    return { min: n, max: n };
  }

  return null;
};

const aggregateRanges = (ranges: Array<TierRange | null | undefined>): TierRange | null => {
  let min: number | undefined;
  let max: number | undefined;

  for (const r of ranges) {
    if (!r) continue;
    if (typeof r.min === "number") min = min === undefined ? r.min : Math.min(min, r.min);
    if (typeof r.max === "number") max = max === undefined ? r.max : Math.max(max, r.max);
  }

  if (min === undefined && max === undefined) return null;
  return { min, max };
};

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toLocalDate = (iso?: string) => {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  return Number.isFinite(dt.getTime()) ? dt : null;
};

const addDaysISO = (iso: string, days: number) => {
  const d = toLocalDate(iso);
  if (!d) return "";
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const isSameOrBeforeISO = (a?: string, b?: string) => {
  const da = toLocalDate(a);
  const db = toLocalDate(b);
  if (!da || !db) return false;
  return da.getTime() <= db.getTime();
};

const TODAY = todayISO();

/* ============================================================================
   ✅ Payload builders
============================================================================ */
async function buildCreateAIPayload(form: CampaignForm, opts?: { saveDraft?: boolean }): Promise<PrefillCampaignAIPayload> {
  const brandId = getBrandId();
  const productImages = await filesToDataUrls(form.files ?? []);

  return {
    brandId,
    campaignTitle: form.title.trim(),
    description: form.description.trim(),
    campaignType: form.campaignType,
    categoryId: form.categoryId,
    subcategoryIds: form.subcategory,
    productImages,
    productLink: form.productLink.trim() || undefined,
    targetCountryIds: form.country,
    targetAgeRanges: form.ageGroup,
    saveDraft: opts?.saveDraft ?? false,
  };
}

function buildCreateManualPayload(form: ManualForm, includeFiles: boolean) {
  const brandId = getBrandId();

  const base: CreateCampaignManualPayload = {
    brandId,
    campaignTitle: form.title.trim(),
    description: form.description.trim(),
    campaignType: form.campaignType,

    categoryId: form.categoryId,
    subcategoryIds: form.subcategories,

    productLink: form.productLink.trim(),
    productImages: [],

    campaignGoals: form.goals,
    influencerTierIds: form.influencerTier,
    contentFormats: form.contentFormats,
    contentLanguageIds: form.contentLanguage,

    platformSelection: mapPlatforms(form.platforms),

    targetCountryIds: form.targetCountry,
    targetAgeRanges: form.targetAgeGroups,
    preferredHashtags: form.hashtags,

    numberOfInfluencers: Number(form.numberOfInfluencers || 0),
    ...(Number(form.maxFollowers) > 0 ? { maxFollowers: Number(form.maxFollowers) } : {}),
    ...(Number(form.minFollowers) > 0 ? { minFollowers: Number(form.minFollowers) } : {}),

    campaignBudget: Number(form.campaignBudget || 0),
    paymentType: form.paymentType,

    additionalNotes: form.additionalNotes || undefined,

    startAt: form.startDate || undefined,
    endAt: form.endDate || undefined,
  };

  if (!includeFiles) return base;

  return (async () => {
    const productImages = await filesToDataUrls(form.productFiles ?? []);
    return { ...base, productImages };
  })();
}

async function buildEditDraftPayload(
  brandId: string,
  campaignId: string,
  form: ManualForm,
  status: CampaignStatus,
  savedProductImages: SavedProductImage[] = []
): Promise<EditDraftPayload> {
  const newImages = await filesToDataUrls(form.productFiles ?? []);

  return compact({
    brandId,
    campaignId,
    status,
    campaignTitle: form.title.trim(),
    description: form.description.trim(),
    campaignType: form.campaignType,
    categoryId: form.categoryId,
    subcategoryIds: form.subcategories,
    productLink: form.productLink.trim(),

    productImages: [
      ...savedProductImages,
      ...newImages,
    ],

    campaignGoals: form.goals,
    influencerTierIds: form.influencerTier,
    contentFormats: form.contentFormats,
    contentLanguageIds: form.contentLanguage,
    platformSelection: mapPlatforms(form.platforms),
    targetCountryIds: form.targetCountry,
    targetAgeRanges: form.targetAgeGroups,
    preferredHashtags: form.hashtags,
    numberOfInfluencers: Number(form.numberOfInfluencers || 0),
    ...(Number(form.minFollowers) > 0 ? { minFollowers: Number(form.minFollowers) } : {}),
    ...(Number(form.maxFollowers) > 0 ? { maxFollowers: Number(form.maxFollowers) } : {}),
    campaignBudget: Number(form.campaignBudget || 0),
    paymentType: form.paymentType,
    additionalNotes: form.additionalNotes || undefined,
    startAt: form.startDate || undefined,
    endAt: form.endDate || undefined,
  }) as EditDraftPayload;
}

/* ============================================================================
   ✅ Validation
============================================================================ */
function validateManualForm(args: { form: ManualForm; dateOk: boolean; blockingFileErrors: string[] }) {
  const { form, dateOk, blockingFileErrors } = args;
  const e: Record<string, string> = {};

  if (!form.title.trim()) e.title = "Campaign title is required.";
  if (!form.description.trim()) e.description = "Description is required.";
  if (!form.categoryId.trim()) e.categoryId = "Campaign category is required.";

  if (!form.subcategories?.length) e.subcategories = "Select at least 1 subcategory.";
  if (!form.goals?.length) e.goals = "Select at least 1 campaign goal.";
  if (!form.platforms?.length) e.platforms = "Select at least 1 platform.";
  if (!form.targetCountry?.length) e.targetCountry = "Select at least 1 country.";
  if (!form.targetAgeGroups?.length) e.targetAgeGroups = "Select at least 1 age group.";

  if (!form.productFiles?.length) e.productFiles = "Upload at least 1 product image/file.";
  if (blockingFileErrors?.length) e.productFiles = blockingFileErrors[0];

  if (!form.paymentType.trim()) e.paymentType = "Payment type is required.";
  if (!Number(form.campaignBudget) || Number(form.campaignBudget) <= 0) e.campaignBudget = "Campaign budget is required.";

  if (!form.startDate) e.startDate = "Start date is required.";
  if (!form.endDate) e.endDate = "End date is required.";
  if (form.startDate && form.endDate && !dateOk) e.endDate = "End Date must be after Start Date.";

  if (Number(form.minFollowers) < 0) e.minFollowers = "Min followers can't be negative.";
  if (Number(form.maxFollowers) < 0) e.maxFollowers = "Max followers can't be negative.";
  if (Number(form.minFollowers) > 0 && Number(form.maxFollowers) > 0 && Number(form.minFollowers) > Number(form.maxFollowers)) {
    e.maxFollowers = "Max followers must be ≥ Min followers.";
  }

  if (!Number(form.numberOfInfluencers) || Number(form.numberOfInfluencers) <= 0) {
    e.numberOfInfluencers = "Number of influencers is required.";
  }

  if (!form.influencerTier?.length) {
    e.influencerTier = "Select at least 1 influencer tier.";
  }

  if (!form.contentFormats?.length) {
    e.contentFormats = "Select at least 1 content format.";
  }

  return e;
}

/* ============================================================================
   ✅ Accordion + Chips
============================================================================ */
function AccordionCard({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("cg-accordion", open ? "cg-accordion--open" : "cg-accordion--closed")}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="cg-accordion-btn">
        <div className="min-w-0 flex-1">
          <div className="cg-accordion-title">{title}</div>
          {subtitle ? <div className="cg-accordion-subtitle">{subtitle}</div> : null}
        </div>

        <span className="shrink-0 mt-[6px] text-neutral-900">{open ? <CaretUp size={20} /> : <CaretDown size={20} />}</span>
      </button>

      {open ? <div className="p-3 pt-0">{children}</div> : null}
    </div>
  );
}

function ChipMultiSelect({
  options,
  value,
  onChange,
}: {
  options: Array<string | Option>;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const normalized: Option[] = useMemo(() => {
    const out: Option[] = (options ?? [])
      .map((o) => (typeof o === "string" ? { label: o, value: o } : o))
      .filter((o) => !!String(o?.value ?? "").trim() && !!String(o?.label ?? "").trim());

    const seen = new Set<string>();
    return out.filter((o) => {
      if (seen.has(o.value)) return false;
      seen.add(o.value);
      return true;
    });
  }, [options]);

  const toggle = useCallback(
    (id: string) => {
      if (value.includes(id)) onChange(value.filter((x) => x !== id));
      else onChange([...value, id]);
    },
    [value, onChange]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {normalized.map((opt) => {
          const active = value.includes(opt.value);
          return (
            <button key={opt.value} type="button" onClick={() => toggle(opt.value)} className={cn("cg-chip", active && "cg-chip--active")}>
              <span className={cn("cg-chip-text", active && "cg-chip-text--active")}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);

    const update = () => setMatches(!!mq.matches);
    update();

    // @ts-ignore
    mq.addEventListener ? mq.addEventListener("change", update) : mq.addListener(update);

    return () => {
      // @ts-ignore
      mq.removeEventListener ? mq.removeEventListener("change", update) : mq.removeListener(update);
    };
  }, [query]);

  return matches;
}

/* ============================================================================
   ✅ AI Screen
============================================================================ */
function CreateByAIScreen({
  sidebarOffsetPx,
  onBack,
  onSwitchToManual,
  onCreated,
  maxWidth = LAYOUT.aiMaxWidth,
  lists,
  showSparkle,
  setShowSparkle,
}: {
  sidebarOffsetPx: number;
  onBack: () => void;
  onSwitchToManual: () => void;
  onCreated: (doc: EnrichedCampaignDoc) => void;
  maxWidth?: number;
  lists: ReturnType<typeof useCampaignLists>;
  showSparkle: boolean;
  setShowSparkle: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { form, setField } = useCampaignForm();
  const progress = useMemo(() => calcProgress(form), [form]);

  const categoryPicker = useCategoryPicker({ debounceMs: 250, enabled: true });

  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const pushAiError = useCallback((title: string, eOrMsg: unknown) => {
    const msg = typeof eOrMsg === "string" ? eOrMsg : getApiErrorMessage(eOrMsg);
    toastError(title, msg);
  }, []);

  const touch = useCallback((k: string) => setTouched((p) => (p[k] ? p : { ...p, [k]: true })), []);
  const shouldShow = useCallback((k: string) => Boolean(submitAttempted || touched[k]), [submitAttempted, touched]);

  const aiErrors = useMemo(() => {
    return {
      title: !form.title.trim() ? "Campaign title is required." : "",
      description: !form.description.trim() ? "Description is required." : "",
      categoryId: !form.categoryId.trim() ? "Campaign category is required." : "",
      subcategory: form.subcategory.length === 0 ? "Select at least 1 subcategory." : "",
      ageGroup: form.ageGroup.length === 0 ? "Select at least 1 age group." : "",
      country: form.country.length === 0 ? "Select at least 1 country." : "",
      files: fileErrors.length ? fileErrors[0] : form.files.length === 0 ? "Upload at least 1 product image." : "",
    };
  }, [form, fileErrors]);

  const stateFor = useCallback((_key: string, msg: string) => (submitAttempted && msg ? ("error" as const) : undefined), [submitAttempted]);
  const msgFor = useCallback((_key: string, msg: string) => (submitAttempted ? msg : ""), [submitAttempted]);
  const canContinueAI = useMemo(() => Object.values(aiErrors).every((x) => !x), [aiErrors]);

  const submitAI = useCallback(async () => {
    setSubmitting(true);
    try {
      const payload = await buildCreateAIPayload(form, { saveDraft: false });
      const res: any = await apiCampaignPrefillAI(payload);
      const pseudoDoc = {
        ...res.prefill,
        details: res.prefillDetails,
        byAi: 1,
        status: "draft",
      };

      onCreated(pseudoDoc as any);
      toastSuccess("AI prefilled", "We filled the manual form. Review and publish.");
    } catch (e) {
      pushAiError("Failed to create draft", e);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [form, onCreated, pushAiError]);

  const handleContinue = useCallback(async () => {
    setSubmitAttempted(true);
    if (!canContinueAI || submitting) return;

    onSwitchToManual();
    setShowSparkle(true);

    try {
      const res = await submitAI();
      if (res === false) throw new Error("submitAI failed");
      setShowSparkle(false);
    } catch (err) {
      console.error("submitAI error:", err);
      setShowSparkle(false);
      onBack();
    }
  }, [canContinueAI, submitting, submitAI, onSwitchToManual, onBack, setShowSparkle]);

  const bottomBarMaxW = maxWidth + 140;

  const catSearchProps = useSearchProps(categoryPicker.search, categoryPicker.setSearch);
  const ageSearchProps = useSearchProps(lists.search.ageRanges.value, lists.search.ageRanges.onChange);
  const countrySearchProps = useSearchProps(lists.search.countries.value, lists.search.countries.onChange);

  return (
    <>
      <div className="cg-page-frame flex-1 min-w-0 w-full bg-linear-to-tl from-pink-50 via-white to-pink-50">
        <div
          className="cg-page-scroll overflow-y-auto"
          style={{
            ["--cg-maxw" as any]: `${maxWidth}px`,
            paddingBottom: "calc(var(--cg-bottombar-h, 72px) + 24px)",
          }}
        >
          <div className="mx-auto w-full cg-maxw px-4 sm:px-6 lg:px-0">
            <div className="cg-card p-5 shadow-2xl border-neutral-300">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="cg-card-title">Create with AI</div>
                  <div className="cg-card-subtitle">Let AI turn your idea into a ready-to-launch campaign.</div>
                </div>

                <Button variant="outline" onClick={onSwitchToManual} className="shrink-0">
                  Create Manual
                </Button>
              </div>

              <div className="mt-4">
                <ProgressBar value={progress} heightClassName="h-[3px]" barClassName="bg-success-500" />
              </div>

              <div className="mt-5 flex flex-col gap-4">
                <FloatingInput
                  label="Campaign title"
                  maxLength={100}
                  required
                  value={form.title}
                  onValueChange={(val) => setField("title", val)}
                  onBlur={() => touch("ai.title")}
                  state={stateFor("ai.title", aiErrors.title)}
                  errorText={msgFor("ai.title", aiErrors.title)}
                />

                <LabeledTextarea
                  label="Description"
                  placeholder={`Describe your campaign goals, product details, and what creators should focus on.

You can paste links to your website, product pages, reference videos, or brand guidelines.`}
                  value={form.description}
                  required
                  minLength={50}
                  maxLength={500}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setField("description", e.target.value)}
                  onBlur={() => touch("ai.description")}
                  state={stateFor("ai.description", aiErrors.description)}
                  errorText={msgFor("ai.description", aiErrors.description)}
                />

                <FloatingSelect {...SEARCHABLE_UI} label="Campaign Type" searchable={false} className="w-full" value={form.campaignType} onValueChange={(v) => setField("campaignType", v)}>
                  {CAMPAIGN_TYPES.map((x) => (
                    <SelectItem key={x.value} value={x.value}>
                      {x.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>

                <FloatingInput label="Product Link / Video references" value={form.productLink} onValueChange={(val) => setField("productLink", val)} />

                <div className="grid gap-4 md:grid-cols-2">
                  <FloatingSelect
                    {...catSearchProps}
                    label="Campaign category"
                    value={form.categoryId}
                    required
                    onValueChange={(id) => {
                      categoryPicker.selectCategoryId(id);
                      const opt = categoryPicker.categoryOptions.find((o) => o.value === id);
                      setField("categoryId", id);
                      setField("categoryName", opt?.label ?? "");
                      setField("subcategory", []);
                      touch("ai.categoryId");
                    }}
                    clientFilter={false}
                    state={stateFor("ai.categoryId", aiErrors.categoryId)}
                    errorText={msgFor("ai.categoryId", aiErrors.categoryId)}
                  >
                    {categoryPicker.categoryOptions.map((x) => (
                      <SelectItem key={x.value} value={x.value}>
                        {x.label}
                      </SelectItem>
                    ))}
                  </FloatingSelect>

                  <FloatingMultiSelect
                    {...SEARCHABLE_UI}
                    label="Campaign subcategory"
                    required
                    value={form.subcategory}
                    options={categoryPicker.subcategoryOptions}
                    onValueChange={(next) => {
                      setField("subcategory", next);
                      touch("ai.subcategory");
                    }}
                    searchable
                    searchValue={categoryPicker.subSearch}
                    onSearchValueChange={categoryPicker.setSubSearch}
                    clientFilter={false}
                    includeAll={false}
                    state={stateFor("ai.subcategory", aiErrors.subcategory)}
                    errorText={msgFor("ai.subcategory", aiErrors.subcategory)}
                  />
                </div>

                <ProductImagesUpload
                  files={form.files}
                  required
                  error={fileErrors.length > 0}
                  errorText={fileErrors[0]}
                  onFilesChange={(next) => {
                    touch("ai.files");
                    const errs = validateFiles(next, "Image");
                    setFileErrors(errs);
                    if (errs.length) return;
                    setField("files", next);
                  }}
                />

                {shouldShow("ai.files") && aiErrors.files ? <div className="mt-1 text-[12px] text-red-600">{aiErrors.files}</div> : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <FloatingMultiSelect
                    label="Target country"
                    required
                    value={form.country}
                    options={lists.countriesByCode}
                    onValueChange={(next) => setField("country", next)}
                    dropdownDirection="up"
                    includeAll={false}
                    state={stateFor("ai.country", aiErrors.country)}
                    errorText={msgFor("ai.country", aiErrors.country)}
                    {...countrySearchProps}
                  />

                  <FloatingMultiSelect
                    label="Target age group"
                    required
                    value={form.ageGroup}
                    searchable={false}
                    options={lists.ageRanges}
                    dropdownDirection="up"
                    onValueChange={(next) => setField("ageGroup", next)}
                    includeAll={false}
                    state={stateFor("ai.ageGroup", aiErrors.ageGroup)}
                    errorText={msgFor("ai.ageGroup", aiErrors.ageGroup)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FixedBottomBar
        sidebarOffsetPx={sidebarOffsetPx}
        containerMaxWidth={bottomBarMaxW}
        right={
          <>
            <Button variant="raised" className="shadow-none" onClick={onBack} disabled={submitting}>
              Go Back
            </Button>
            <Button onClick={handleContinue} disabled={submitting}>
              {submitting ? "Creating…" : "Continue"}
            </Button>
          </>
        }
      />
    </>
  );
}

function SideModalPreview({
  open,
  title = "Card Preview",
  onClose,
  children,
  widthPx = 420,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  widthPx?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button type="button" aria-label="Close preview" className="absolute inset-0 bg-black/40" onClick={onClose} />

      <aside
        className="absolute right-0 top-0 h-full bg-brand-50 border-l border-neutral-200 shadow-2xl flex flex-col"
        style={{
          width: `min(${widthPx}px, 92vw)`,
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-4 border-b border-neutral-200 bg-white">
          <div className="flex items-center gap-2">
            <div className="text-[18px] leading-[26px] font-semibold text-neutral-900">{title}</div>
            <Info size={18} className="text-neutral-600" />
          </div>

          <Button variant="outline" className="shadow-none" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto cg-scrollbar px-4 py-4">{children}</div>
      </aside>
    </div>
  );
}

/* ============================================================================
   ✅ Manual Screen
============================================================================ */
function CreateManualScreen({
  sidebarOffsetPx,
  onBack,
  onSwitchToAI,
  formMaxWidth = 760,
  previewWidth = 420,
  bottomBarMaxWidth,
  lists,
  initialFromCampaign,
  onAfterPublish,
  showSparkle,
  setShowSparkle,
}: {
  sidebarOffsetPx: number;
  onBack: () => void;
  onSwitchToAI: () => void;
  formMaxWidth?: number;
  previewWidth?: number;
  bottomBarMaxWidth?: number;
  lists: ReturnType<typeof useCampaignLists>;
  initialFromCampaign?: EnrichedCampaignDoc | null;
  onAfterPublish?: () => void;
  showSparkle: boolean;
  setShowSparkle: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const { setActions, clearActions } = useBrandTopbar();
  const [form, setForm] = useState<ManualForm>(EMPTY_MANUAL);

  const [productFileErrors, setProductFileErrors] = useState<string[]>([]);
  const [attachmentErrors, setAttachmentErrors] = useState<string[]>([]);
  const followersTouchedRef = useRef({ min: false, max: false });
  const [apiError, setApiError] = useState<string>("");

  const [campaignId, setCampaignId] = useState<string>("");
  const [publishing, setPublishing] = useState(false);

  const [draftSaving, setDraftSaving] = useState(false);
  const [draftJustSaved, setDraftJustSaved] = useState(false);
  const draftSavedTimerRef = useRef<number | null>(null);

  const categoryPicker = useCategoryPicker({ debounceMs: 250, enabled: true });
  const [loadedDetails, setLoadedDetails] = useState<any>(null);
  const loadedInitialRef = useRef<EnrichedCampaignDoc | null>(null);

  const isBelowLg = useMediaQuery("(max-width: 1023px)");
  const lastDesktopPreviewRef = useRef(true);
  const prevIsBelowLgRef = useRef<boolean | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewProductImages, setPreviewProductImages] = useState<string[]>([]);
  const [savedProductImages, setSavedProductImages] = useState<any[]>([]);
  const previewForm = useMemo(
    () => ({
      ...form,
      productImages: previewProductImages,
    }),
    [form, previewProductImages]
  );

  useEffect(() => {
    const remoteUrls = savedProductImages
      .map((img) => img?.dataUrl)
      .filter(Boolean);

    const localUrls = (form.productFiles ?? []).map((file) =>
      URL.createObjectURL(file)
    );

    setPreviewProductImages([...remoteUrls, ...localUrls]);

    return () => {
      localUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [form.productFiles, savedProductImages]);

  useEffect(() => {
    const prev = prevIsBelowLgRef.current;
    prevIsBelowLgRef.current = isBelowLg;

    if (prev === null) {
      if (!isBelowLg) setPreviewOpen(lastDesktopPreviewRef.current);
      return;
    }

    if (prev !== isBelowLg) {
      if (isBelowLg) {
        lastDesktopPreviewRef.current = previewOpen;
        setPreviewOpen(false);
      } else {
        setPreviewOpen(lastDesktopPreviewRef.current ?? true);
      }
    }
  }, [isBelowLg, previewOpen]);

  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});

  const setField = useCallback(<K extends keyof ManualForm>(key: K, value: ManualForm[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  }, []);

  const pushApiError = useCallback((title: string, eOrMsg: unknown) => {
    const msg = typeof eOrMsg === "string" ? eOrMsg : getApiErrorMessage(eOrMsg);
    setApiError(msg);
    toastError(title, msg);
  }, []);

  const extractBackendMessage = useCallback((e: any) => {
    const base = getApiErrorMessage(e);
    if (base && base !== "Something went wrong") return base;

    const d = e?.response?.data ?? e?.data ?? e;

    if (typeof d === "string") return d;
    if (typeof d?.message === "string") return d.message;
    if (typeof d?.error === "string") return d.error;
    if (typeof d?.detail === "string") return d.detail;

    const firstArrMsg = d?.errors?.[0]?.msg || d?.errors?.[0]?.message || d?.issues?.[0]?.message;
    if (typeof firstArrMsg === "string") return firstArrMsg;

    return "Failed to publish campaign.";
  }, []);

  const extractBackendSuccessMessage = useCallback((res: any, fallback: string) => {
    const d = res?.data ?? res;

    if (typeof d === "string") return d;
    if (typeof d?.message === "string" && d.message.trim()) return d.message;
    if (typeof d?.successMessage === "string" && d.successMessage.trim()) return d.successMessage;
    if (typeof d?.detail === "string" && d.detail.trim()) return d.detail;
    if (typeof d?.msg === "string" && d.msg.trim()) return d.msg;

    return fallback;
  }, []);

  const extractBackendFieldErrors = useCallback((e: any) => {
    const d = e?.response?.data ?? e?.data ?? e;

    const fe = d?.fieldErrors || d?.errorsByField || d?.validationErrors;
    if (fe && typeof fe === "object" && !Array.isArray(fe)) return fe as Record<string, string>;

    const arr = d?.errors;
    if (Array.isArray(arr)) {
      const out: Record<string, string> = {};
      for (const it of arr) {
        const k = String(it?.param ?? it?.field ?? it?.path ?? "").trim();
        const m = String(it?.msg ?? it?.message ?? "").trim();
        if (k && m && !out[k]) out[k] = m;
      }
      return out;
    }

    const issues = d?.issues;
    if (Array.isArray(issues)) {
      const out: Record<string, string> = {};
      for (const it of issues) {
        const path = Array.isArray(it?.path) ? String(it.path[0] ?? "") : String(it?.path ?? "");
        const m = String(it?.message ?? "").trim();
        const k = String(path).trim();
        if (k && m && !out[k]) out[k] = m;
      }
      return out;
    }

    return null;
  }, []);

  useEffect(() => {
    const previewAction: TopbarAction = {
      key: "preview",
      label: "Preview",
      icon: previewOpen ? <EyeClosed size={20} /> : <Eye size={20} />,
      variant: "secondary",
      onClick: () => setPreviewOpen((v) => !v),
      className: "shadow-none",
    };
    setActions([previewAction]);
  }, [setActions, previewOpen]);

  useEffect(() => () => clearActions(), [clearActions]);

  const scheduleBtnRef = useRef<HTMLButtonElement | null>(null);
  const isMobileSchedule = useMediaQuery("(max-width: 768px)");
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const [scheduleDate, setScheduleDate] = useState<string>(() => safeDateInput(new Date().toISOString()));
  const [scheduleTime, setScheduleTime] = useState<string>(() => getDefaultScheduleTime());

  const baseTimeZone = (typeof window !== "undefined" && Intl.DateTimeFormat().resolvedOptions().timeZone) || "UTC";

  const [tzRes, setTzRes] = useState<GetTimezonesByCountriesResponse | null>(null);
  const [tzLoading, setTzLoading] = useState(false);
  const [tzError, setTzError] = useState("");

  type ScheduleTZ = {
    timezone: string;
    isValid?: boolean;
    offsetMinutes?: number;
    offsetMinutesFromCurrent?: number;
    nowLocal?: string;
  };

  type ScheduleCountry = { id: string; label: string; timezones: ScheduleTZ[] };

  const scheduleCountries = useMemo((): ScheduleCountry[] => {
    const rawMap = new Map<string, any>();

    for (const c of lists.raw.countries ?? []) {
      const k1 = countryKey(c);
      const cc = String(c?.countryCode ?? "").trim();

      if (k1) {
        rawMap.set(k1, c);
        rawMap.set(k1.toUpperCase(), c);
        rawMap.set(k1.toLowerCase(), c);
      }

      if (cc) {
        rawMap.set(cc, c);
        rawMap.set(cc.toUpperCase(), c);
        rawMap.set(cc.toLowerCase(), c);
      }
    }

    const tzPayload = tzRes as any;
    const targets = (tzPayload?.data?.targets ?? tzPayload?.targets ?? []) as any[];

    const byId = new Map(targets.map((t: any) => [String(t?.id ?? "").trim(), t]));
    const byCode = new Map(targets.map((t: any) => [String(t?.countryCode ?? "").trim().toUpperCase(), t]));

    return (form.targetCountry ?? [])
      .map((sel) => {
        const key = String(sel ?? "").trim();
        if (!key) return null;

        const upperKey = key.toUpperCase();

        const t = isObjectId(key) ? byId.get(key) : byCode.get(upperKey);
        const raw = rawMap.get(key) || rawMap.get(upperKey) || rawMap.get(key.toLowerCase());

        const name = String(t?.countryName ?? t?.countryNameEn ?? raw?.countryNameEn ?? raw?.countryName ?? "").trim();
        const flag = String(t?.flag ?? raw?.flag ?? "").trim();
        const label = `${flag ? `${flag} ` : ""}${name || key}`;

        const tzs: ScheduleTZ[] = (t?.timezones ?? [])
          .map((z: any) => {
            const tzName = String(z?.timezone ?? "").trim();
            const normalized = normalizeTimeZone(tzName, baseTimeZone);

            return {
              timezone: normalized,
              isValid: Boolean(z?.isValid),
              offsetMinutes: Number.isFinite(Number(z?.offsetMinutes)) ? Number(z.offsetMinutes) : undefined,
              offsetMinutesFromCurrent: Number.isFinite(Number(z?.offsetMinutesFromCurrent))
                ? Number(z.offsetMinutesFromCurrent)
                : undefined,
              nowLocal: String(z?.nowLocal ?? "").trim() || undefined,
            };
          })
          .filter((x: any) => x.timezone);

        const timezones = tzs.length ? tzs : [{ timezone: baseTimeZone, isValid: true }];

        return {
          id: key,
          label,
          timezones,
        };
      })
      .filter(Boolean) as ScheduleCountry[];
  }, [form.targetCountry, lists.raw.countries, tzRes, baseTimeZone]);

  useEffect(() => {
    if (!scheduleOpen) return;

    const selected = form.targetCountry ?? [];
    const { ids, codes } = splitCountrySelection(selected);

    if (!ids.length && !codes.length) {
      setTzRes(null);
      setTzError("");
      setTzLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setTzLoading(true);
      setTzError("");
      try {
        const res = await apiGetTimezonesByCountries({
          targetCountryIds: ids.length ? ids : undefined,
          targetCountryCodes: codes.length ? codes : undefined,
          current: { timezone: baseTimeZone },
        });
        if (!cancelled) setTzRes(res);
      } catch (e) {
        const msg = getApiErrorMessage(e);
        if (!cancelled) setTzError(msg);
        toastError("Failed to load timezones", msg);
      } finally {
        if (!cancelled) setTzLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scheduleOpen, form.targetCountry, baseTimeZone]);

  useEffect(() => {
    if (!scheduleOpen) return;
    setScheduleDate((prev) => {
      const prevSafe = safeDateInput(prev);
      if (prevSafe) return prevSafe;
      const start = safeDateInput(form.startDate);
      return start || safeDateInput(new Date().toISOString());
    });
  }, [scheduleOpen, form.startDate]);

  const loadCampaignIntoForm = useCallback(
    (doc: any) => {
      const normalizePaymentType = (v: any) => {
        const s = String(v ?? "").trim().toLowerCase();
        if (s === "milestone") return "Milestone";
        if (s === "fixed") return "Fixed";
        if (s === "gifting") return "Gifting";
        return "Milestone";
      };

      const id = pickCampaignId(doc);
      if (id) setCampaignId(id);

      const details = doc?.details ?? null;
      setLoadedDetails(details);

      const nextCategoryId = String(doc?.categoryId ?? details?.category?.id ?? "").trim();

      const categoryFromPicker = categoryPicker.categoryOptions.find((o) => o.value === nextCategoryId);

      const nextCategoryName = String(
        doc?.categoryName ??
        doc?.category?.name ??
        details?.category?.name ??
        categoryFromPicker?.label ??
        ""
      ).trim();

      const next: ManualForm = {
        ...EMPTY_MANUAL,
        title: String(doc?.campaignTitle ?? doc?.title ?? "").trim(),
        description: String(doc?.description ?? "").trim(),
        campaignType: String(doc?.campaignType ?? "").trim(),
        categoryId: nextCategoryId,
        categoryName: nextCategoryName,
        subcategories: idsOf(doc?.subcategoryIds ?? details?.subcategories ?? doc?.subcategories),
        productLink: String(doc?.productLink ?? "").trim(),
        productFiles: [],
        goals: idsOf(doc?.campaignGoals ?? details?.campaignGoals ?? doc?.goals),
        numberOfInfluencers: Number(doc?.numberOfInfluencers ?? 0),
        influencerTier: idsOf(doc?.influencerTierIds ?? details?.influencerTiers),
        minFollowers: Number(doc?.minFollowers ?? 0),
        maxFollowers: Number(doc?.maxFollowers ?? 0),
        contentFormats: idsOf(doc?.contentFormats ?? details?.contentFormats),
        contentLanguage: idsOf(doc?.contentLanguageIds ?? details?.contentLanguages),
        paymentType: normalizePaymentType(doc?.paymentType ?? "Milestone"),
        campaignBudget: Number(doc?.campaignBudget ?? 0),
        startDate: safeDateInput(doc?.startAt ?? doc?.startDate),
        endDate: safeDateInput(doc?.endAt ?? doc?.endDate),
        platforms: (Array.isArray(doc?.platformSelection) ? doc.platformSelection : []).map(platformToUi).filter(Boolean),
        targetCountry: idsOf(doc?.targetCountryIds ?? details?.targetCountries),
        targetAgeGroups: idsOf(doc?.targetAgeRanges ?? details?.targetAgeRanges),
        additionalNotes: String(doc?.additionalNotes ?? ""),
        attachment: null,
        hashtags: idsOf(doc?.preferredHashtags ?? doc?.hashtags),
      };

      const normalizedSavedImages = (Array.isArray(doc?.productImages) ? doc.productImages : [])
        .map((img: any) => {
          if (typeof img === "string") return { dataUrl: img };
          if (img?.dataUrl) return img;
          if (img?.url) return { ...img, dataUrl: img.url };
          return null;
        })
        .filter(Boolean);

      setSavedProductImages(normalizedSavedImages);

      setForm(next);

      if (nextCategoryId) {
        categoryPicker.hydrateSelectedCategory({ id: nextCategoryId, name: nextCategoryName || "Selected category" });
      }

      setApiError("");
      setServerFieldErrors({});
    },
    [categoryPicker]
  );

  useEffect(() => {
    if (!initialFromCampaign) return;
    if (loadedInitialRef.current === initialFromCampaign) return;
    loadedInitialRef.current = initialFromCampaign;
    loadCampaignIntoForm(initialFromCampaign);
  }, [initialFromCampaign, loadCampaignIntoForm]);

  const seededHashtagOptions = useMemo<Option[]>(
    () =>
      (loadedDetails?.preferredHashtags ?? [])
        .map((h: any) => ({ label: String(h?.tag ?? "").trim(), value: String(h?.id ?? "").trim() }))
        .filter((x: any) => x.label && x.value),
    [loadedDetails]
  );

  const hashtagOptions = useMemo(() => mergeOptions(lists.preferredHashtags, seededHashtagOptions), [lists.preferredHashtags, seededHashtagOptions]);

  const seededGoalOptions = useMemo<Option[]>(
    () =>
      (loadedDetails?.campaignGoals ?? [])
        .map((g: any) => ({ label: String(g?.goal ?? "").trim(), value: String(g?.id ?? "").trim() }))
        .filter((x: any) => x.label && x.value),
    [loadedDetails]
  );

  const seededTierOptions = useMemo<Option[]>(
    () =>
      (loadedDetails?.influencerTiers ?? [])
        .map((t: any) => {
          const category = String(t?.category ?? "").trim();
          const range = prettyTierValue(t?.value);
          const label = category && range ? `${category} (${range})` : category || range;
          return { label, value: String(t?.id ?? "").trim() };
        })
        .filter((x: any) => x.label && x.value),
    [loadedDetails]
  );

  const seededCategoryOption = useMemo<Option[]>(() => {
    const id = String(form.categoryId || loadedDetails?.category?.id || "").trim();

    const fromPicker = categoryPicker.categoryOptions.find((o) => o.value === id);

    const label = String(
      form.categoryName ||
      loadedDetails?.category?.name ||
      fromPicker?.label ||
      ""
    ).trim();

    if (!id || !label) return [];
    return [{ value: id, label }];
  }, [form.categoryId, form.categoryName, loadedDetails, categoryPicker.categoryOptions]);

  const categoryOptionsMerged = useMemo(
    () => mergeOptions(categoryPicker.categoryOptions, seededCategoryOption),
    [categoryPicker.categoryOptions, seededCategoryOption]
  );

  const seededFormatOptions = useMemo<Option[]>(
    () =>
      (loadedDetails?.contentFormats ?? [])
        .map((f: any) => ({ label: String(f?.format ?? "").trim(), value: String(f?.id ?? "").trim() }))
        .filter((x: any) => x.label && x.value),
    [loadedDetails]
  );

  const seededLangOptions = useMemo<Option[]>(
    () =>
      (loadedDetails?.contentLanguages ?? [])
        .map((l: any) => ({ label: String(l?.name ?? "").trim(), value: String(l?.id ?? "").trim() }))
        .filter((x: any) => x.label && x.value),
    [loadedDetails]
  );

  const seededAgeOptions = useMemo<Option[]>(
    () =>
      (loadedDetails?.targetAgeRanges ?? [])
        .map((a: any) => ({ label: String(a?.range ?? "").trim(), value: String(a?.id ?? "").trim() }))
        .filter((x: any) => x.label && x.value),
    [loadedDetails]
  );

  const seededCountryOptions = useMemo<Option[]>(
    () =>
      (loadedDetails?.targetCountries ?? [])
        .map((c: any) => {
          const name = String(c?.countryNameEn ?? "").trim();
          const flag = String(c?.flag ?? "").trim();
          const id = String(c?.id ?? "").trim();
          if (!name || !id) return null;
          return { label: `${flag ? flag + " " : ""}${name}`, value: id };
        })
        .filter(Boolean) as Option[],
    [loadedDetails]
  );

  const seededSubcategoryOptions = useMemo<Option[]>(
    () =>
      (loadedDetails?.subcategories ?? [])
        .map((s: any) => ({ label: String(s?.name ?? "").trim(), value: String(s?.id ?? "").trim() }))
        .filter((x: any) => x.label && x.value),
    [loadedDetails]
  );

  const goalsOptions = useMemo(() => mergeOptions(lists.productServiceGoals, seededGoalOptions), [lists.productServiceGoals, seededGoalOptions]);
  const tierOptions = useMemo(() => mergeOptions(lists.influencerTiers, seededTierOptions), [lists.influencerTiers, seededTierOptions]);
  const formatOptions = useMemo(() => mergeOptions(lists.contentFormats, seededFormatOptions), [lists.contentFormats, seededFormatOptions]);
  const langOptions = useMemo(() => mergeOptions(lists.contentLanguages, seededLangOptions), [lists.contentLanguages, seededLangOptions]);
  const ageOptions = useMemo(() => mergeOptions(lists.ageRanges, seededAgeOptions), [lists.ageRanges, seededAgeOptions]);

  const countryNameOptions = useMemo(() => mergeOptions(lists.countriesByName, seededCountryOptions), [lists.countriesByName, seededCountryOptions]);
  const subcategoryOptionsMerged = useMemo(() => mergeOptions(categoryPicker.subcategoryOptions, seededSubcategoryOptions), [categoryPicker.subcategoryOptions, seededSubcategoryOptions]);

  const tierRangeById = useMemo(() => {
    const out = new Map<string, TierRange>();

    const add = (id: any, _sourceValue: any, label?: string) => {
      const key = String(id ?? "").trim();
      if (!key) return;

      const fromLabel = parseRangeFromText(label);
      if (fromLabel) out.set(key, fromLabel);
    };

    for (const t of (loadedDetails?.influencerTiers ?? []) as any[]) {
      add(t?.id, t?.value, `${String(t?.category ?? "")} (${prettyTierValue(t?.value)})`);
    }

    const rawTiers = (lists as any)?.raw?.influencerTiers ?? [];
    for (const t of rawTiers as any[]) {
      add(t?.id, t?.value, `${String(t?.category ?? "")} (${prettyTierValue(t?.value)})`);
    }

    for (const opt of tierOptions) {
      add(opt.value, null, opt.label);
    }

    return out;
  }, [loadedDetails, lists, tierOptions]);

  const selectedCountryOptions = useMemo(() => {
    const map = new Map((lists.raw.countries ?? []).map((c: any) => [countryKey(c), c]));
    return (form.targetCountry ?? [])
      .map((id) => {
        const c = map.get(id);
        if (!c) return null;
        const name = String(c?.countryNameEn ?? "").trim();
        const flag = String(c?.flag ?? "").trim();
        if (!name) return null;
        return { label: `${flag ? flag + " " : ""}${name}`, value: id };
      })
      .filter(Boolean) as Option[];
  }, [form.targetCountry, lists.raw.countries]);

  const countryOptionsForSelect = useMemo(() => mergeOptions(countryNameOptions, selectedCountryOptions), [countryNameOptions, selectedCountryOptions]);

  const dateOk = isValidDateRange(form.startDate, form.endDate);
  const datesFilled = !!form.startDate && !!form.endDate;

  const progress = useMemo(() => {
    const checks = [
      form.title.trim().length > 0,
      form.description.trim().length > 49,
      form.categoryId.trim().length > 0,
      form.subcategories.length > 0,
      form.goals.length > 0,
      form.numberOfInfluencers > 0,
      form.influencerTier.length > 0,
      form.contentFormats.length > 0,
      form.platforms.length > 0,
      form.targetCountry.length > 0,
      form.targetAgeGroups.length > 0,
      form.paymentType.trim().length > 0,
      form.startDate.trim().length > 0,
      form.endDate.trim().length > 0,
      Number(form.campaignBudget || 0) > 0,
      datesFilled && dateOk,
      (form.productFiles?.length || 0) > 0 && productFileErrors.length === 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form, dateOk, datesFilled, productFileErrors.length]);

  const effectivePreviewWidth = useResponsivePreviewWidth({
    desiredPx: previewWidth,
    sidebarOffsetPx,
    enabled: previewOpen,
    maxRatio: 0.42,
    minLeftPx: 360,
  });

  const computedBottomBarMaxW = bottomBarMaxWidth ?? (previewOpen && !isBelowLg ? formMaxWidth + effectivePreviewWidth + 120 : formMaxWidth + 120);

  const [submitAttempted, setSubmitAttempted] = useState(false);

  const resetForm = useCallback(() => {
    setForm({ ...EMPTY_MANUAL });
    setProductFileErrors([]);
    setAttachmentErrors([]);
    setApiError("");
    setCampaignId("");
    setLoadedDetails(null);

    categoryPicker.hydrateSelectedCategory(null);
    categoryPicker.setSearch("");
    categoryPicker.setSubSearch("");

    setDraftJustSaved(false);
    if (draftSavedTimerRef.current) {
      window.clearTimeout(draftSavedTimerRef.current);
      draftSavedTimerRef.current = null;
    }

    setScheduleOpen(false);
    setScheduleDate(safeDateInput(new Date().toISOString()));
    setScheduleTime(getDefaultScheduleTime());
    setTzRes(null);
    setTzLoading(false);
    setTzError("");

    setSubmitAttempted(false);
    setServerFieldErrors({});
  }, [categoryPicker]);

  const saveDraftManually = useCallback(async () => {
    const brandId = getBrandId();
    if (!brandId) {
      pushApiError("Login required", "BrandId missing. Please login again.");
      return;
    }

    setApiError("");
    setDraftSaving(true);

    if (draftSavedTimerRef.current) {
      window.clearTimeout(draftSavedTimerRef.current);
      draftSavedTimerRef.current = null;
    }

    try {
      if (!campaignId) {
        const createBase = await buildCreateManualPayload(form, true);
        const res = await apiCampaignCreate({ ...(createBase as CreateCampaignManualPayload), status: "draft" as CampaignStatus });

        const id = pickCampaignId(res);
        if (id) setCampaignId(id);

        toastSuccess(extractBackendSuccessMessage(res, "Draft saved"));
      } else {
        const payload = await buildEditDraftPayload(
          brandId,
          campaignId,
          form,
          "draft",
          savedProductImages
        );

        const res = await apiCampaignEditDraft(payload);

        toastSuccess(extractBackendSuccessMessage(res, "Draft updated"));
      }

      setDraftJustSaved(true);
      draftSavedTimerRef.current = window.setTimeout(() => setDraftJustSaved(false), 1200);
    } catch (e) {
      const backendMsg = extractBackendMessage(e);
      setApiError(backendMsg);
      toastError(backendMsg);
    } finally {
      setDraftSaving(false);
    }
  }, [campaignId, form, pushApiError, extractBackendMessage, extractBackendSuccessMessage]);

  useEffect(() => {
    return () => {
      if (draftSavedTimerRef.current) window.clearTimeout(draftSavedTimerRef.current);
    };
  }, []);

  const manualErrors = useMemo(() => validateManualForm({ form, dateOk, blockingFileErrors: productFileErrors }), [form, dateOk, productFileErrors]);

  const combinedErrors = useMemo(() => {
    return { ...manualErrors, ...(serverFieldErrors || {}) };
  }, [manualErrors, serverFieldErrors]);

  const stateFor = useCallback((key: string) => (submitAttempted && combinedErrors[key] ? ("error" as const) : undefined), [submitAttempted, combinedErrors]);
  const msgFor = useCallback((key: string) => (submitAttempted ? combinedErrors[key] : ""), [submitAttempted, combinedErrors]);

  const doPublish = useCallback(
    async (status: CampaignStatus, scheduledAtIso?: string) => {
      setSubmitAttempted(true);
      setServerFieldErrors({});
      setApiError("");

      const errs = validateManualForm({ form, dateOk, blockingFileErrors: productFileErrors });
      if (Object.values(errs).some(Boolean)) return;

      const brandId = getBrandId();
      if (!brandId) {
        toastError("Login required", "BrandId missing. Please login again.");
        return;
      }

      setPublishing(true);
      let cid: string | undefined;

      try {
        const productImages = await filesToDataUrls(form.productFiles ?? []);

        if (campaignId) {
          const payload: EditDraftPayload = compact({
            brandId,
            campaignId,
            status,
            ...(scheduledAtIso ? { scheduledAt: scheduledAtIso } : {}),
            campaignTitle: form.title.trim(),
            description: form.description.trim(),
            campaignType: form.campaignType,
            categoryId: form.categoryId,
            subcategoryIds: form.subcategories,
            productLink: form.productLink.trim(),
            productImages,
            campaignGoals: form.goals,
            influencerTierIds: form.influencerTier,
            contentFormats: form.contentFormats,
            contentLanguageIds: form.contentLanguage,
            platformSelection: mapPlatforms(form.platforms),
            targetCountryIds: form.targetCountry,
            targetAgeRanges: form.targetAgeGroups,
            preferredHashtags: form.hashtags,
            numberOfInfluencers: Number(form.numberOfInfluencers || 0),
            ...(Number(form.minFollowers) > 0 ? { minFollowers: Number(form.minFollowers) } : {}),
            ...(Number(form.maxFollowers) > 0 ? { maxFollowers: Number(form.maxFollowers) } : {}),
            campaignBudget: Number(form.campaignBudget || 0),
            paymentType: form.paymentType,
            additionalNotes: form.additionalNotes || undefined,
            startAt: form.startDate || undefined,
            endAt: form.endDate || undefined,
          }) as EditDraftPayload;

          const updated: any = await apiCampaignEditDraft(payload);

          cid = pickCampaignId(updated) || campaignId;
          if (cid) setCampaignId(cid);

          toastSuccess(
            extractBackendSuccessMessage(
              updated,
              status === "scheduled" ? "Campaign scheduled" : status === "active" ? "Campaign published" : "Campaign updated"
            )
          );
        } else {
          const payload = await buildCreateManualPayload(form, true);
          const created: any = await apiCampaignCreate({
            ...(payload as CreateCampaignManualPayload),
            status,
            ...(scheduledAtIso ? { scheduledAt: scheduledAtIso } : {}),
          });

          cid = pickCampaignId(created);
          if (cid) setCampaignId(cid);

          toastSuccess(
            extractBackendSuccessMessage(
              created,
              status === "scheduled" ? "Campaign scheduled" : status === "active" ? "Campaign published" : "Campaign created"
            )
          );
        }

        cid = cid || campaignId;

        if (status === "scheduled") {
          resetForm();
          router.replace(`/brand/campaign`);
          onAfterPublish?.();
          return;
        }

        if (status === "active") {
          resetForm();
          router.replace(`/brand/campaign`);
          onAfterPublish?.();
          return;
        }

        resetForm();
        onAfterPublish?.();
      } catch (e: any) {
        const backendMsg = extractBackendMessage(e);
        const fe = extractBackendFieldErrors(e);

        setApiError(backendMsg);
        if (fe && Object.keys(fe).length) setServerFieldErrors(fe);

        toastError(backendMsg);
      } finally {
        setPublishing(false);
      }
    },
    [
      campaignId,
      form,
      dateOk,
      productFileErrors,
      resetForm,
      onAfterPublish,
      extractBackendMessage,
      extractBackendFieldErrors,
      extractBackendSuccessMessage,
      router,
    ]
  );

  const previewMeta = useMemo(() => {
    const strip = (s: string) => String(s || "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
    return {
      subcategoriesMap: toMap(subcategoryOptionsMerged),
      countryMap: toMap(countryOptionsForSelect, strip),
      ageMap: toMap(ageOptions),
      goalsMap: toMap(goalsOptions),
      hashtagsMap: toMap(hashtagOptions),
      paymentType: form.paymentType,
      campaignBudget: Number(form.campaignBudget || 0),
    };
  }, [subcategoryOptionsMerged, countryOptionsForSelect, ageOptions, goalsOptions, hashtagOptions, form.paymentType, form.campaignBudget]);

  const catSearchProps = useSearchProps(categoryPicker.search, categoryPicker.setSearch);
  const tierSearchProps = useSearchProps(lists.search.influencerTiers.value, lists.search.influencerTiers.onChange);
  const formatSearchProps = useSearchProps(lists.search.contentFormats.value, lists.search.contentFormats.onChange);
  const langSearchProps = useSearchProps(lists.search.contentLanguages.value, lists.search.contentLanguages.onChange);
  const countrySearchProps = useSearchProps(lists.search.countries.value, lists.search.countries.onChange);
  const ageSearchProps = useSearchProps(lists.search.ageRanges.value, lists.search.ageRanges.onChange);
  const hashtagSearchProps = useSearchProps(lists.search.preferredHashtags.value, lists.search.preferredHashtags.onChange);

  return (
    <>
      <div className="cg-page-frame flex min-h-0 w-full flex-col overflow-hidden h-[100dvh]">
        <div className={cn("grid h-full min-h-0 w-full", previewOpen ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1")}>
          <section className="min-h-0 min-w-0 flex flex-col">
            <div className="cg-panel flex flex-col min-h-0">
              <div className="shrink-0 px-4 sm:px-6 lg:px-10 pt-5">
                <div className="w-full pb-4">
                  <ProgressBar value={progress} heightClassName="h-[3px]" barClassName="bg-success-500" />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain cg-scrollbar">
                <div className="min-w-0 px-4 sm:px-6 lg:px-5 pb-10" style={{ paddingBottom: "calc(var(--cg-bottombar-h) + 32px)" }}>
                  <div className="border p-5 border-[#D6D6D6] rounded-l">
                    <div className="bg-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="cg-accordion-title">Product / Service Info</div>
                          <div className="cg-accordion-subtitle">Describe your product or service, the campaign goal, and what you’d like creators to highlight.</div>
                        </div>

                        <div className="cg-ai-glow">
                          <Button onClick={onSwitchToAI} className="m-0 shadow-lg">
                            <SparkleIcon size={20} className="mr-2" />
                            Create with AI
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-4">
                        <FloatingInput
                          label="Campaign title"
                          maxLength={100}
                          required
                          value={form.title}
                          onValueChange={(val) => setField("title", val)}
                          state={stateFor("title")}
                          errorText={msgFor("title")}
                        />

                        <LabeledTextarea
                          label="Description"
                          required
                          value={form.description}
                          minLength={50}
                          maxLength={4000}
                          onChange={(e: any) => setField("description", String(e.target.value))}
                          state={stateFor("description")}
                          errorText={msgFor("description")}
                        />

                        {showSparkle && (
                          <div className="fixed inset-0 flex items-center justify-center pointer-events-none bg-gray-950/60 z-[9999]">
                            <SparkleAnimation key={String(showSparkle)} className="scale-[1.8]" />
                          </div>
                        )}

                        <FloatingSelect
                          {...SEARCHABLE_UI}
                          label="Campaign Type"
                          value={form.campaignType}
                          searchable={false}
                          onValueChange={(v) => setField("campaignType", v)}
                          state={stateFor("campaignType")}
                          errorText={msgFor("campaignType")}
                        >
                          {CAMPAIGN_TYPES.map((x) => (
                            <SelectItem key={x.value} value={x.value}>
                              {x.label}
                            </SelectItem>
                          ))}
                        </FloatingSelect>

                        <div className="grid gap-4 md:grid-cols-2">
                          <FloatingSelect
                            {...catSearchProps}
                            label="Campaign category"
                            required
                            value={form.categoryId}
                            onValueChange={(id) => {
                              categoryPicker.selectCategoryId(id);
                              const opt = categoryOptionsMerged.find((o) => o.value === id);
                              setField("categoryId", id);
                              setField("categoryName", opt?.label ?? "");
                              setField("subcategories", []);
                            }}
                            state={stateFor("categoryId")}
                            errorText={msgFor("categoryId")}
                            clientFilter={false}
                          >
                            {categoryOptionsMerged.map((x) => (
                              <SelectItem key={x.value} value={x.value}>
                                {x.label}
                              </SelectItem>
                            ))}
                          </FloatingSelect>

                          <FloatingMultiSelect
                            {...SEARCHABLE_UI}
                            label="Sub Category"
                            required
                            value={form.subcategories}
                            options={subcategoryOptionsMerged}
                            onValueChange={(next) => setField("subcategories", next)}
                            state={stateFor("subcategories")}
                            errorText={msgFor("subcategories")}
                            includeAll={false}
                          />
                        </div>

                        <ProductCardUpload
                          files={form.productFiles}
                          existingImages={savedProductImages.map((img) => img.dataUrl)}
                          required
                          error={Boolean(stateFor("productFiles"))}
                          errorText={msgFor("productFiles")}
                          onFilesChange={(next) => {
                            const errs = validateFiles(next, "Product file");
                            setProductFileErrors(errs);
                            if (errs.length) return;
                            setField("productFiles", next);
                          }}
                          onRemoveExistingImage={(url: string) => {
                            setSavedProductImages((prev) =>
                              prev.filter((img) => img.dataUrl !== url)
                            );
                          }}
                        />

                        <FloatingInput
                          label="Product Link / Video references"
                          value={form.productLink}
                          onValueChange={(val) => setField("productLink", val)}
                          state={stateFor("productLink")}
                          errorText={msgFor("productLink")}
                        />

                        <div>
                          <div className={cn("cg-description text-size-[14px] mb-2 flex items-center gap-1", stateFor("goals") && "!text-red-600")}>
                            <span>Campaign Goals</span>
                            <span className="!text-red-600">*</span>
                          </div>

                          <ChipMultiSelect options={goalsOptions} value={form.goals} onChange={(next) => setField("goals", next)} />

                          {stateFor("goals") ? <div className="mt-1 text-[14px] text-red-600">{msgFor("goals")}</div> : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 flex flex-col gap-[40px]">
                      <AccordionCard title="Creator Requirements" subtitle="Define who you’re looking to collaborate with.">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FloatingInput
                            label="Number of Influencers"
                            type="number"
                            required
                            value={String(form.numberOfInfluencers || "")}
                            onValueChange={(v) => setField("numberOfInfluencers", clampNonNegative(v))}
                            state={stateFor("numberOfInfluencers")}
                            errorText={msgFor("numberOfInfluencers")}
                          />

                          <FloatingMultiSelect
                            {...tierSearchProps}
                            label="Influencer Tier"
                            required
                            value={form.influencerTier}
                            searchable={false}
                            options={tierOptions}
                            onValueChange={(next) => {
                              setForm((prev) => {
                                const selected = next ?? [];

                                if (selected.length === 0) {
                                  followersTouchedRef.current.min = false;
                                  followersTouchedRef.current.max = false;

                                  return {
                                    ...prev,
                                    influencerTier: [],
                                    minFollowers: 0,
                                    maxFollowers: 0,
                                  };
                                }

                                const ranges = selected.map((id) => tierRangeById.get(id));
                                const agg = aggregateRanges(ranges);

                                const nextMin = !followersTouchedRef.current.min && agg?.min != null ? agg.min : prev.minFollowers;
                                const nextMax = !followersTouchedRef.current.max && agg?.max != null ? agg.max : prev.maxFollowers;

                                return {
                                  ...prev,
                                  influencerTier: selected,
                                  minFollowers: nextMin ?? prev.minFollowers,
                                  maxFollowers: nextMax ?? prev.maxFollowers,
                                };
                              });
                            }}
                            includeAll={false}
                            state={stateFor("influencerTier")}
                            errorText={msgFor("influencerTier")}
                          />

                          <FloatingInput
                            label="Min Followers"
                            type="number"
                            value={String(form.minFollowers || "")}
                            onValueChange={(v) => {
                              const n = clampNonNegative(v);
                              followersTouchedRef.current.min = n > 0;
                              setField("minFollowers", n);
                            }}
                          />

                          <FloatingInput
                            label="Max Followers"
                            type="number"
                            value={String(form.maxFollowers || "")}
                            onValueChange={(v) => {
                              const n = clampNonNegative(v);
                              followersTouchedRef.current.max = n > 0;
                              setField("maxFollowers", n);
                            }}
                          />

                          <FloatingMultiSelect
                            {...formatSearchProps}
                            label="Content Format"
                            required
                            value={form.contentFormats}
                            options={formatOptions}
                            onValueChange={(next) => setField("contentFormats", next)}
                            includeAll={false}
                            searchable={false}
                            state={stateFor("contentFormats")}
                            errorText={msgFor("contentFormats")}
                          />

                          <FloatingMultiSelect
                            {...langSearchProps}
                            label="Content Language"
                            value={form.contentLanguage}
                            options={langOptions}
                            onValueChange={(next) => setField("contentLanguage", next)}
                            includeAll={false}
                          />
                        </div>
                      </AccordionCard>

                      <AccordionCard title="Timeline & Payments" subtitle="Set Budget for delivery and how you want to pay creators.">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FloatingSelect
                            label="Payment Type"
                            required
                            value={form.paymentType}
                            onValueChange={(v) => setField("paymentType", v)}
                            state={stateFor("paymentType")}
                            errorText={msgFor("paymentType")}
                            searchable={false}
                            searchPlaceholder={undefined}
                          >
                            <SelectItem value="Milestone">Milestone</SelectItem>
                            <SelectItem value="Fixed">Fixed</SelectItem>
                            <SelectItem value="Gifting">Gifting</SelectItem>
                          </FloatingSelect>

                          <FloatingInput
                            label="Campaign Budget"
                            required
                            type="number"
                            prefixText="$"
                            value={String(form.campaignBudget || "")}
                            onValueChange={(v) => setField("campaignBudget", clampNonNegative(v))}
                            state={stateFor("campaignBudget")}
                            errorText={msgFor("campaignBudget")}
                          />

                          <FloatingDateInput
                            label="Start Date"
                            required
                            type="date"
                            value={form.startDate}
                            min={TODAY}
                            onValueChange={(v) => {
                              setField("startDate", v);
                              if (form.endDate && isSameOrBeforeISO(form.endDate, v)) {
                                setField("endDate", addDaysISO(v, 1));
                              }
                            }}
                            state={stateFor("startDate")}
                            errorText={msgFor("startDate")}
                          />

                          <FloatingDateInput
                            label="End Date"
                            required
                            type="date"
                            value={form.endDate}
                            min={form.startDate ? addDaysISO(form.startDate, 1) : TODAY}
                            onValueChange={(v) => setField("endDate", v)}
                            state={stateFor("endDate")}
                            errorText={msgFor("endDate")}
                          />
                        </div>
                      </AccordionCard>

                      <AccordionCard title="Audience & Platforms" subtitle="Choose where and who this campaign should reach.">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <FloatingMultiSelect
                              {...SEARCHABLE_UI}
                              label="Platform Selection"
                              required
                              value={form.platforms}
                              options={MANUAL_PLATFORM_OPTIONS}
                              onValueChange={(next) => setField("platforms", next)}
                              includeAll={false}
                              searchable={false}
                              state={stateFor("platforms")}
                              errorText={msgFor("platforms")}
                            />
                          </div>

                          <FloatingMultiSelect
                            {...countrySearchProps}
                            label="Target country"
                            required
                            value={form.targetCountry}
                            options={countryOptionsForSelect}
                            onValueChange={(next) => setField("targetCountry", next)}
                            includeAll={false}
                            state={stateFor("targetCountry")}
                            errorText={msgFor("targetCountry")}
                          />

                          <FloatingMultiSelect
                            {...ageSearchProps}
                            label="Target age group"
                            required
                            value={form.targetAgeGroups}
                            searchable={false}
                            options={ageOptions}
                            onValueChange={(next) => setField("targetAgeGroups", next)}
                            includeAll={false}
                            state={stateFor("targetAgeGroups")}
                            errorText={msgFor("targetAgeGroups")}
                          />

                          <div className="md:col-span-2">
                            <LabeledTextarea
                              label="Additional notes"
                              placeholder="Add any extra context, internal notes, or instructions you don’t want to miss."
                              value={form.additionalNotes}
                              onChange={(e) => setField("additionalNotes", String((e as any).target.value))}
                              maxLength={4000}
                              showAttachment
                              attachment={form.attachment}
                              onAttachmentChange={(file) => {
                                const errs = file ? validateFiles([file], "Attachment") : [];
                                setAttachmentErrors(errs);
                                if (errs.length) return;
                                setField("attachment", file);
                              }}
                              accept="image/*,.pdf,.doc,.docx"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <FloatingTagInput
                              {...hashtagSearchProps}
                              label="Preferred Hashtags"
                              value={form.hashtags}
                              options={hashtagOptions}
                              onValueChange={(next) => setField("hashtags", next)}
                              includeAll={false}
                              dropdownDirection="up"
                            />
                          </div>
                        </div>
                      </AccordionCard>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {previewOpen ? (
            <aside className="hidden lg:flex min-h-0 flex-col border border-neutral-200 bg-brand-50" style={{ width: effectivePreviewWidth }}>
              <div className="shrink-0 flex items-center px-6 xl:px-10 pt-10 pb-4 gap-2">
                <div className="text-[20px] leading-[28px] font-semibold tracking-[0]" style={{ color: "var(--Text-Primary, #1A1A1A)" }}>
                  Card Preview
                </div>
                <Info size={20} className="text-black" />
              </div>

              <div className="flex-1 min-h-0 pb-10 px-6 xl:px-10">
                <ManualPreviewCardStack
                  form={previewForm as any}
                  meta={previewMeta}
                />
              </div>
            </aside>
          ) : null}

          <SideModalPreview open={Boolean(previewOpen && isBelowLg)} onClose={() => setPreviewOpen(false)} title="Card Preview" widthPx={previewWidth}>
            <ManualPreviewCardStack
              form={previewForm as any}
              meta={previewMeta}
            />
          </SideModalPreview>
        </div>
      </div>

      {scheduleOpen && (
        <ScheduleCampaignOverlay
          open={true}
          isMobile={isMobileSchedule}
          anchorRef={scheduleBtnRef}
          date={scheduleDate}
          time={scheduleTime}
          baseTimeZone={baseTimeZone}
          countries={scheduleCountries}
          tzLoading={tzLoading}
          tzError={tzError}
          onClose={() => setScheduleOpen(false)}
          onDateChange={setScheduleDate}
          onTimeChange={setScheduleTime}
          onConfirm={(iso) => {
            setScheduleOpen(false);
            doPublish("scheduled" as CampaignStatus, iso);
          }}
        />
      )}

      <FixedBottomBar
        sidebarOffsetPx={sidebarOffsetPx}
        containerMaxWidth={computedBottomBarMaxW}
        left={
          <>
            <Button
              variant="raised"
              className="shadow-none"
              style={{ color: "var(--Light-Border-Negative, #E35141)" }}
              onClick={resetForm}
              disabled={draftSaving || publishing}
            >
              Reset
            </Button>

            <span aria-hidden className="h-5 w-px bg-[#E6E6E6]" />

            <Button variant="raised" className="shadow-none" onClick={saveDraftManually} disabled={draftSaving || publishing}>
              {draftSaving ? "Saving…" : draftJustSaved ? "Saved" : "Save as Draft"}
            </Button>
          </>
        }
        right={
          <>
            <Button
              ref={scheduleBtnRef}
              variant="outline"
              onClick={() => setScheduleOpen(true)}
              className="shadow-none"
              disabled={publishing}
            >
              <Clock size={16} className="mr-2" />
              {publishing ? "Saving…" : "Schedule Campaign"}
            </Button>

            <Button onClick={() => doPublish("active")} disabled={publishing}>
              <PaperPlaneTilt size={16} className="mr-2" />
              {publishing ? "Publishing…" : "Publish Campaign"}
            </Button>
          </>
        }
      />
    </>
  );
}

/* ============================================================================
   ✅ Main Page
============================================================================ */
export default function CreateCampaignPage() {
  const { clearActions } = useBrandTopbar();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editCampaignId = searchParams.get("campaignId");

  const [view, setView] = useState<"loading" | "intro" | "manual" | "ai">("loading");
  const sidebarOffsetPx = useSidebarOffsetPx();
  const [showSparkle, setShowSparkle] = useState(false);

  const [manualFromCampaign, setManualFromCampaign] = useState<EnrichedCampaignDoc | null>(null);

  const listsEnabled = view === "manual" || view === "ai";
  const lists = useCampaignLists(listsEnabled);

  useEffect(() => {
    if (editCampaignId) {
      setView("loading");
      return;
    }

    try {
      const seen = localStorage.getItem(SEEN_KEY) === "1";
      setView(seen ? "manual" : "intro");
    } catch {
      setView("intro");
    }
  }, [editCampaignId]);

  useEffect(() => {
    if (!editCampaignId) return;

    let cancelled = false;

    (async () => {
      try {
        const res: any = await apiCampaignGetById({
          campaignId: editCampaignId,
          brandId: getBrandId() || undefined,
        });
        if (cancelled) return;

        const doc = res?.data ?? res;
        setManualFromCampaign(doc as EnrichedCampaignDoc);
        setView("manual");
      } catch (e) {
        if (cancelled) return;
        toastError("Failed to load campaign", getApiErrorMessage(e));
        setView("manual");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editCampaignId]);

  useEffect(() => {
    if (view === "manual") return;
    clearActions();
    return () => clearActions();
  }, [view, clearActions]);

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch { }
  }, []);

  const openManual = useCallback(() => {
    markSeen();
    setView("manual");
  }, [markSeen]);

  const openAI = useCallback(() => {
    markSeen();
    setView("ai");
  }, [markSeen]);

  if (view === "loading") {
    return (
      <CenterWrap>
        <div className="w-full max-w-5xl rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="h-6 w-40 rounded bg-neutral-200" />
          <div className="mt-3 h-4 w-96 max-w-full rounded bg-neutral-100" />

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6">
              <div className="h-[190px] rounded-xl bg-neutral-100" />
              <div className="mt-4 h-9 w-32 mx-auto rounded bg-neutral-200" />
              <div className="mt-3 h-4 w-40 mx-auto rounded bg-neutral-100" />
            </div>

            <div className="rounded-2xl bg-neutral-50 p-6">
              <div className="h-[190px] rounded-xl bg-neutral-100" />
              <div className="mt-4 h-9 w-40 mx-auto rounded bg-neutral-200" />
              <div className="mt-3 h-4 w-44 mx-auto rounded bg-neutral-100" />
            </div>
          </div>
        </div>
      </CenterWrap>
    );
  }

  if (view === "intro") {
    return (
      <CenterWrap>
        <div className="w-full max-w-7xl rounded-xl border border-neutral-300 bg-white flex flex-col items-start px-4 pt-7 pb-4 gap-6">
          <div className="flex flex-col items-start gap-1">
            <div className="cg-card-title">Create</div>
            <div className="text-[16px] text-neutral-600">Provide your basic business information so we can set up your workspace and tailor recommendations accordingly.</div>
          </div>

          <div className="w-full grid gap-6 md:grid-cols-2">
            <div className="rounded-l border border-neutral-200 bg-white p-6 min-h-[360px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-center">
                <Button onClick={openManual} variant="outline">
                  Continue
                </Button>
                <div className="cg-black-description font-semibold">Create Manually</div>
                <div className="text-[14px] text-neutral-600">Maximum file size is {MAX_FILE_MB}MB</div>
              </div>
            </div>

            <div className="rounded-l bg-neutral-50 p-6 min-h-[360px] flex items-center justify-center overflow-hidden">
              <div className="relative flex flex-col items-center gap-2 text-center">
                <div className="cg-ai-glow">
                  <Button onClick={openAI} className="m-0 shadow-lg">
                    <SparkleIcon size={20} className="mr-2" />
                    Create with AI
                  </Button>
                </div>

                <div className="cg-black-description font-semibold">Create With AI</div>
                <div className="text-[14px] text-neutral-600">Dive in the world of AI to make</div>
              </div>
            </div>
          </div>
        </div>
      </CenterWrap>
    );
  }

  if (view === "ai") {
    return (
      <CreateByAIScreen
        sidebarOffsetPx={sidebarOffsetPx}
        onBack={() => setView("intro")}
        onSwitchToManual={() => setView("manual")}
        onCreated={(doc) => {
          setManualFromCampaign(doc);
          setView("manual");
        }}
        lists={lists}
        showSparkle={showSparkle}
        setShowSparkle={setShowSparkle}
      />
    );
  }

  return (
    <CreateManualScreen
      sidebarOffsetPx={sidebarOffsetPx}
      onBack={() => setView("intro")}
      onSwitchToAI={() => setView("ai")}
      formMaxWidth={LAYOUT.manualFormMaxWidth}
      previewWidth={LAYOUT.manualPreviewWidth}
      lists={lists}
      initialFromCampaign={manualFromCampaign}
      onAfterPublish={() => setManualFromCampaign(null)}
      showSparkle={showSparkle}
      setShowSparkle={setShowSparkle}
    />
  );
}