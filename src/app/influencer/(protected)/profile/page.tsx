"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import { get, post } from "@/lib/api";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select as ShSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// lucide icons
import {
  User,
  Users,
  Phone as PhoneIcon,
  Globe,
  Mail,
  Check,
  X,
  ShieldCheck,
  Hash,
  Pencil,
  Loader2,
  Check as CheckIcon,
  ExternalLink,
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";

/* ===================== Types ===================== */

type GenderStr = "" | "Male" | "Female" | "Non-binary" | "Prefer not to say";

interface OnboardingSubcategory {
  subcategoryId: string;
  subcategoryName: string;
}

interface Onboarding {
  categoryId?: number;
  categoryName?: string;
  subcategories: OnboardingSubcategory[];
}

interface Country {
  _id: string;
  countryName: string;
  callingCode: string;
  countryCode: string;
  flag: string;
}

interface CountryOption {
  value: string;
  label: string;
  country: Country;
}

interface CategoryNode {
  categoryId: number;
  categoryName: string;
  subcategories: { subcategoryId: string; subcategoryName: string }[];
}

interface CategoryOption {
  value: number;
  label: string;
  raw: CategoryNode;
}

interface SubcategoryOption {
  value: string;
  label: string;
}

export type PrimaryPlatform = "youtube" | "tiktok" | "instagram" | "other" | null;

type AudienceWeightItem = {
  code?: string;
  name?: string;
  weight?: number;
};

type AudienceCountryItem = {
  code?: string;
  name?: string;
  weight?: number;
};

type AudienceGenderItem = {
  code?: string;
  weight?: number;
};

type AudienceAgeItem = {
  code?: string;
  weight?: number;
};

type ContentStats = {
  engagements?: number;
  engagementRate?: number;
  avgLikes?: number;
  avgComments?: number;
  avgViews?: number;
  avgPosts4weeks?: number;
};

type PostItem = {
  title?: string;
  url?: string;
  created?: string;
  type?: string;
  likes?: number;
  comments?: number;
  views?: number;
  thumbnail?: string;
  video?: string;
  text?: string;
};

type AudienceData = {
  genders?: AudienceGenderItem[];
  languages?: AudienceWeightItem[];
  geoCountries?: AudienceCountryItem[];
  ages?: AudienceAgeItem[];
};

type PlatformProfile = {
  platform?: string;
  handle?: string;
  username?: string;
  data?: {
    profile?: {
      picture?: string;
      url?: string;
      handle?: string;
      username?: string;
      fullname?: string;
      followers?: number;
      engagements?: number;
      engagementRate?: number;
      averageViews?: number;
    };
    ageGroup?: string;
    gender?: string;
    country?: string;
    isVerified?: boolean;
    statsByContentType?: {
      all?: ContentStats;
      videos?: ContentStats;
      shorts?: ContentStats;
      streams?: ContentStats;
    };
    recentPosts?: PostItem[];
    popularPosts?: PostItem[];
    postsCount?: number;
    avgLikes?: number;
    avgComments?: number;
    totalViews?: number;
    bio?: string;
    audience?: AudienceData;
  };
};

export type InfluencerData = {
  name: string;
  email: string;
  password?: string;
  phone: string;
  profileImage?: string;
  profileLink?: string;
  socialMedia?: string;

  country: string;
  countryId: string;
  callingId: string;
  callingCode?: string;

  primaryPlatform: PrimaryPlatform;
  onboarding: Onboarding;

  otpVerified?: boolean;
  passwordResetVerified?: boolean;
  failedLoginAttempts?: number;
  lockUntil?: string | null;

  _id?: string;
  influencerId: string;
  createdAt?: string;
  updatedAt?: string;

  gender?: GenderStr;
  languages?: { _id: string; name: string }[];
  categories?: { _id: string; name: string }[];
  page1?: PlatformProfile[];

  // display-only enriched fields
  bio?: string;
  followers?: number;
  averageViews?: number;
  engagementRate?: number;
  engagements?: number;
  postsCount?: number;
  avgLikes?: number;
  avgComments?: number;
  totalViews?: number;
  recentPosts?: PostItem[];
  popularPosts?: PostItem[];
  statsByContentType?: {
    all?: ContentStats;
    videos?: ContentStats;
    shorts?: ContentStats;
    streams?: ContentStats;
  };
  audience?: AudienceData;
  isVerifiedCreator?: boolean;
  creatorGender?: string;
  creatorAgeGroup?: string;
};

/* ===================== Utilities ===================== */

const isEmailEqual = (a = "", b = "") => a.trim().toLowerCase() === b.trim().toLowerCase();

function formatPhoneDisplay(code?: string, num?: string) {
  const c = (code || "").trim();
  const n = (num || "").trim();
  if (!c && !n) return "—";
  if (n.startsWith("+")) return n;
  return `${c ? c : ""}${c && n ? " " : ""}${n}`;
}

function validateEmail(email: string) {
  return /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email);
}

function normalizeGenderStr(raw: any): GenderStr | undefined {
  if (raw === null || typeof raw === "undefined") return undefined;

  const num =
    typeof raw === "number" && Number.isFinite(raw)
      ? raw
      : typeof raw === "string" && /^[0-9]+$/.test(raw.trim())
        ? Number(raw.trim())
        : null;

  if (num !== null) {
    switch (num) {
      case 0:
        return "Male";
      case 1:
        return "Female";
      case 2:
        return "Non-binary";
      case 3:
        return "Prefer not to say";
      default:
        break;
    }
  }

  const s = String(raw).trim();
  const t = s.toLowerCase();
  if (t === "male" || t === "m") return "Male";
  if (t === "female" || t === "f") return "Female";
  if (t === "non-binary" || t === "nonbinary" || t === "nb") return "Non-binary";
  if (t === "prefer not to say" || t === "prefer-not-to-say") return "Prefer not to say";
  if (s === "") return "";
  if (["Male", "Female", "Non-binary", "Prefer not to say"].includes(s)) return s as GenderStr;
  return undefined;
}

const buildCountryOptions = (countries: Country[]): CountryOption[] =>
  countries.map((c) => ({
    value: c._id,
    label: `${c.flag} ${c.countryName}`,
    country: c,
  }));

const buildCallingOptions = (countries: Country[]): CountryOption[] => {
  const opts = countries.map((c) => ({
    value: c._id,
    label: `${c.callingCode}`,
    country: c,
  }));
  const usIdx = opts.findIndex((o) => o.country.countryCode === "US");
  if (usIdx > -1) {
    const [us] = opts.splice(usIdx, 1);
    opts.unshift(us);
  }
  return opts;
};

const PLATFORM_OPTIONS: { value: Exclude<PrimaryPlatform, null>; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "other", label: "Other" },
];

const humanizePlatform = (p: PrimaryPlatform) => {
  const found = PLATFORM_OPTIONS.find((o) => o.value === p);
  return found ? found.label : "—";
};

function asArray<T = any>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object") {
    for (const k of ["data", "items", "rows", "result", "results", "categories", "list", "categoryList"]) {
      const val = (v as any)[k];
      if (Array.isArray(val)) return val as T[];
    }
  }
  return [] as T[];
}

function normalizeCategoryNode(raw: any): CategoryNode {
  const categoryIdRaw = raw?.categoryId ?? raw?.id ?? raw?.code;
  const categoryName = String(raw?.categoryName ?? raw?.name ?? raw?.label ?? "");
  const subRaw =
    raw?.subcategories ??
    raw?.children ??
    raw?.subs ??
    raw?.subCategoryList ??
    raw?.subcategoriesList;

  const subcategories = asArray<any>(subRaw)
    .map((s) => ({
      subcategoryId: String(s?.subcategoryId ?? s?.id ?? s?.uuid ?? s?._id ?? s?.value ?? s?.code ?? ""),
      subcategoryName: String(s?.subcategoryName ?? s?.name ?? s?.label ?? ""),
    }))
    .filter((s) => s.subcategoryId && s.subcategoryName);

  return {
    categoryId: Number(categoryIdRaw),
    categoryName,
    subcategories,
  };
}

const buildCategoryOptions = (rows: any): CategoryOption[] =>
  asArray<any>(rows)
    .map(normalizeCategoryNode)
    .filter((n) => Number.isFinite(n.categoryId) && n.categoryName)
    .map((c) => ({ value: c.categoryId, label: c.categoryName, raw: c }));

const buildSubcategoryOptions = (row?: CategoryNode | null): SubcategoryOption[] =>
  row?.subcategories?.map((s) => ({ value: s.subcategoryId, label: s.subcategoryName })) || [];

function formatCompactNumber(value?: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatPercent(value?: number) {
  return `${((Number(value || 0)) * 100).toFixed(2)}%`;
}

function formatDateOnly(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(+d)) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function topN<T>(arr: T[] | undefined, n = 5) {
  return Array.isArray(arr) ? arr.slice(0, n) : [];
}

/* ===================== NEW RESPONSE NORMALIZER ===================== */

function getPreferredPageProfile(inf: any): PlatformProfile | null {
  const pages = Array.isArray(inf?.page1) ? inf.page1 : [];
  if (!pages.length) return null;

  const primary = inf?.primaryPlatform;
  if (primary) {
    const exact = pages.find((p: any) => p?.platform === primary);
    if (exact) return exact;
  }

  return pages[0] || null;
}

function normalizeInfluencer(data: any): InfluencerData {
  const inf = data?.influencer ?? data;
  const preferredPage = getPreferredPageProfile(inf);

  const platform = preferredPage?.platform ?? inf?.primaryPlatform ?? null;
  const pageData = preferredPage?.data ?? {};
  const profile = pageData?.profile ?? {};

  const normalizedPlatform: PrimaryPlatform =
    platform === "youtube" || platform === "tiktok" || platform === "instagram" || platform === "other"
      ? platform
      : null;

  const socialHandle =
    preferredPage?.handle ||
    preferredPage?.username ||
    profile?.handle ||
    profile?.username ||
    "";

  const profileLink = profile?.url || inf?.profileLink || "";
  const profileImage = profile?.picture || inf?.profileImage || "";

  const categoryFromResponse = Array.isArray(inf?.categories) ? inf.categories : [];
  const languageFromResponse = Array.isArray(inf?.languages) ? inf.languages : [];
  const primaryCategory = categoryFromResponse[0];

  return {
    name: inf?.name ?? profile?.fullname ?? "",
    email: inf?.email ?? "",
    phone: inf?.phone ?? "",

    profileImage,
    profileLink,
    socialMedia: socialHandle,

    country: inf?.countryName ?? inf?.country ?? "",
    countryId: inf?.countryId ?? "",
    callingId: inf?.callingId ?? "",
    callingCode: inf?.callingcode ?? inf?.callingCode ?? "",

    primaryPlatform: normalizedPlatform,

    onboarding: {
      categoryId: inf?.onboarding?.categoryId,
      categoryName: inf?.onboarding?.categoryName ?? primaryCategory?.name ?? "",
      subcategories: Array.isArray(inf?.onboarding?.subcategories) ? inf.onboarding.subcategories : [],
    },

    otpVerified: !!inf?.otpVerified,
    passwordResetVerified: !!inf?.passwordResetVerified,
    failedLoginAttempts: Number.isFinite(+inf?.failedLoginAttempts) ? +inf.failedLoginAttempts : 0,
    lockUntil: inf?.lockUntil ?? null,

    _id: inf?._id ?? "",
    influencerId: inf?.influencerId ?? inf?._id ?? "",
    createdAt: inf?.createdAt ?? "",
    updatedAt: inf?.updatedAt ?? "",

    gender: normalizeGenderStr(inf?.gender),

    languages: languageFromResponse,
    categories: categoryFromResponse,
    page1: Array.isArray(inf?.page1) ? inf.page1 : [],

    bio: pageData?.bio ?? "",
    followers: profile?.followers ?? 0,
    averageViews: profile?.averageViews ?? 0,
    engagementRate: profile?.engagementRate ?? 0,
    engagements: profile?.engagements ?? 0,
    postsCount: pageData?.postsCount ?? 0,
    avgLikes: pageData?.avgLikes ?? 0,
    avgComments: pageData?.avgComments ?? 0,
    totalViews: pageData?.totalViews ?? 0,
    recentPosts: Array.isArray(pageData?.recentPosts) ? pageData.recentPosts : [],
    popularPosts: Array.isArray(pageData?.popularPosts) ? pageData.popularPosts : [],
    statsByContentType: pageData?.statsByContentType ?? {},
    audience: pageData?.audience ?? {},
    isVerifiedCreator: !!pageData?.isVerified,
    creatorGender: pageData?.gender ?? "",
    creatorAgeGroup: pageData?.ageGroup ?? "",
  };
}

/* ===================== MultiSelect ===================== */

type SimpleOption = { value: string; label: string };

function MultiSelect({
  values,
  onChange,
  options,
  placeholder = "Choose...",
  max = Infinity,
}: {
  values: SimpleOption[];
  onChange: (opts: SimpleOption[]) => void;
  options: SimpleOption[];
  placeholder?: string;
  max?: number;
}) {
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(values.map((v) => v.value)), [values]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const toggle = (val: string) => {
    const opt = options.find((o) => o.value === val);
    if (!opt) return;
    const isSelected = selectedSet.has(val);

    if (isSelected) {
      onChange(values.filter((v) => v.value !== val));
    } else {
      if (values.length >= max) {
        Swal.fire({
          icon: "info",
          title: `Limit reached (${max})`,
          text: `You can select up to ${max} items.`,
        });
        return;
      }
      onChange([...values, opt]);
    }
  };

  const triggerLabel = values.length
    ? values.length <= 2
      ? values.map((v) => v.label).join(", ")
      : `${values.length} selected`
    : placeholder;

  return (
    <ShSelect value="" onValueChange={toggle}>
      <SelectTrigger className="w-full justify-between">
        <div className={`truncate ${values.length ? "" : "text-muted-foreground"}`}>{triggerLabel}</div>
      </SelectTrigger>
      <SelectContent className="bg-white overflow-auto">
        <div className="p-2 sticky top-0 bg-white">
          <Input placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
        ) : (
          filtered.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                <CheckIcon className={`h-4 w-4 ${selectedSet.has(opt.value) ? "opacity-100" : "opacity-0"}`} />
                {opt.label}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </ShSelect>
  );
}

/* ===================== Email editor ===================== */

export type EmailFlowState = "idle" | "needs" | "codes_sent" | "verifying" | "verified";

function EmailEditorSingleOTP({
  influencerId,
  originalEmail,
  value,
  onChange,
  onVerified,
  onStateChange,
}: {
  influencerId: string;
  originalEmail: string;
  value: string;
  onChange: (v: string) => void;
  onVerified: (newEmail: string) => void;
  onStateChange: (s: EmailFlowState) => void;
}) {
  const [flow, setFlow] = useState<EmailFlowState>("idle");
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const needs = useMemo(() => !isEmailEqual(value, originalEmail), [value, originalEmail]);
  const valueIsValid = useMemo(() => validateEmail(value), [value]);

  useEffect(() => {
    if (!needs) {
      setFlow("idle");
      setOtp("");
      setErr(null);
      setMsg(null);
      onStateChange("idle");
    } else if (flow === "codes_sent" || flow === "verifying" || flow === "verified") {
      onStateChange(flow);
    } else {
      setFlow("needs");
      onStateChange("needs");
    }
  }, [needs, flow, onStateChange]);

  const requestCode = useCallback(async () => {
    setErr(null);
    setMsg(null);
    if (!valueIsValid) return;

    setBusy(true);
    try {
      const resp = await post<{ message?: string }>("/influencer/requestEmailUpdate", {
        influencerId,
        newEmail: value.trim().toLowerCase(),
        role: "Influencer",
      });

      setFlow("codes_sent");
      const m = resp?.message || `OTP sent to ${value.trim().toLowerCase()}.`;
      setMsg(m);
      onStateChange("codes_sent");
      await Swal.fire({ icon: "info", title: "OTP sent", text: m });
    } catch (e: any) {
      const m = e?.message || "Failed to send OTP.";
      setErr(m);
      await Swal.fire({ icon: "error", title: "Error", text: m });
    } finally {
      setBusy(false);
    }
  }, [influencerId, value, valueIsValid, onStateChange]);

  const verifyAndPersist = useCallback(async () => {
    setErr(null);

    if (otp.trim().length !== 6) {
      const m = "Enter the 6-digit OTP.";
      setErr(m);
      await Swal.fire({ icon: "warning", title: "Invalid OTP", text: m });
      return;
    }

    setBusy(true);
    setFlow("verifying");
    onStateChange("verifying");

    try {
      await post<{ message?: string }>("/influencer/verifyotp", {
        influencerId,
        role: "Influencer",
        otp: otp.trim(),
        newEmail: value.trim().toLowerCase(),
      });

      onVerified(value.trim().toLowerCase());
      setMsg("Email updated successfully.");
      setFlow("verified");
      onStateChange("verified");
      setOtp("");

      await Swal.fire({
        icon: "success",
        title: "Email updated",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (e: any) {
      const m = e?.message || "Verification failed.";
      setErr(m);
      setFlow("codes_sent");
      onStateChange("codes_sent");
      await Swal.fire({ icon: "error", title: "Verification failed", text: m });
    } finally {
      setBusy(false);
    }
  }, [influencerId, value, otp, onVerified, onStateChange]);

  const handleOtp = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(digits);
  };

  return (
    <Card className="max-w-md bg-white border-0 shadow-sm">
      <CardContent className="pt-6 space-y-3">
        <Label>Email Address</Label>

        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="name@example.com"
            onKeyDown={(e) => {
              if (e.key === "Enter" && needs && valueIsValid && (flow === "needs" || flow === "idle")) {
                requestCode();
              }
            }}
          />
          {needs && valueIsValid && (flow === "needs" || flow === "idle") && (
            <Button
              onClick={requestCode}
              disabled={busy}
              className="bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-800"
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify
            </Button>
          )}
        </div>

        {needs && (flow === "codes_sent" || flow === "verifying") && (
          <div className="rounded-md border p-4 space-y-4 bg-amber-50/40">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Verification Required</p>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to <span className="font-semibold">{value}</span>.
                </p>
              </div>
            </div>

            <div>
              <Label className="text-xs">New Email OTP</Label>
              <Input
                className="font-mono tracking-[0.3em] text-center text-lg"
                placeholder="000000"
                value={otp}
                onChange={handleOtp}
                inputMode="numeric"
                maxLength={6}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button variant="outline" onClick={requestCode} disabled={busy}>
                Resend Code
              </Button>
              <Button
                onClick={verifyAndPersist}
                className="bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-800"
                disabled={busy || otp.length !== 6}
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Update
              </Button>
            </div>
          </div>
        )}

        {(msg || err) && (
          <div className="text-sm">
            {msg && (
              <div className="rounded-md border p-3 bg-green-50 text-green-800 flex items-center gap-2">
                <Check className="h-4 w-4" />
                {msg}
              </div>
            )}
            {err && (
              <div className="rounded-md border p-3 bg-red-50 text-red-800 flex items-center gap-2 mt-2">
                <X className="h-4 w-4" />
                {err}
              </div>
            )}
          </div>
        )}

        {needs && flow === "needs" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(originalEmail)}
            className="text-muted-foreground underline w-fit pl-0"
          >
            Cancel change
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ===================== Main Page ===================== */

export default function InfluencerProfilePage() {
  const [influencer, setInfluencer] = useState<InfluencerData | null>(null);
  const [form, setForm] = useState<InfluencerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [emailFlow, setEmailFlow] = useState<EmailFlowState>("idle");

  const [countries, setCountries] = useState<Country[]>([]);
  const countryOptions = useMemo(() => buildCountryOptions(countries), [countries]);
  const codeOptions = useMemo(() => buildCallingOptions(countries), [countries]);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [selectedCalling, setSelectedCalling] = useState<CountryOption | null>(null);

  const [selectedPlatform, setSelectedPlatform] = useState<PrimaryPlatform>(null);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(null);
  const [subcategoryOptions, setSubcategoryOptions] = useState<SubcategoryOption[]>([]);
  const [selectedSubcats, setSelectedSubcats] = useState<SubcategoryOption[]>([]);

  const prevCatIdRef = useRef<number | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (error) {
      Swal.fire({
        icon: "error",
        title: "Error Loading Profile",
        text: error,
      });
    }
  }, [error]);

  useEffect(() => {
    const influencerId = localStorage.getItem("influencerId");
    if (!influencerId) {
      setError("Missing influencerId in localStorage.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const [infRes, countryRes, categoryRes] = await Promise.all([
          get<any>(`/influencer/getbyid?id=${influencerId}`),
          get<Country[]>("/country/getall"),
          get<CategoryNode[]>("/category/categories"),
        ]);

        const countriesList = countryRes || [];
        setCountries(countriesList);

        const normalized = normalizeInfluencer(infRes);
        setInfluencer(normalized);
        setForm(structuredClone(normalized));

        const countryOpts = buildCountryOptions(countriesList);
        const callingOpts = buildCallingOptions(countriesList);
        const cats = buildCategoryOptions(categoryRes || []);
        setCategories(cats);

        setSelectedCountry(() => {
          if (normalized.countryId) {
            return countryOpts.find((o) => o.value === normalized.countryId) || null;
          }
          if (normalized.country) {
            return (
              countryOpts.find(
                (o) => o.country.countryName.toLowerCase() === normalized.country.toLowerCase()
              ) || null
            );
          }
          return null;
        });

        setSelectedCalling(() => {
          if (normalized.callingId) {
            return callingOpts.find((o) => o.value === normalized.callingId) || null;
          }
          if (normalized.callingCode) {
            return callingOpts.find((o) => o.country.callingCode === normalized.callingCode) || null;
          }
          return null;
        });

        setSelectedPlatform(normalized.primaryPlatform);

        const preCategory =
          (normalized.onboarding?.categoryId
            ? cats.find((c) => c.value === normalized.onboarding.categoryId)
            : null) ||
          (normalized.onboarding?.categoryName
            ? cats.find((c) => c.label.toLowerCase() === normalized.onboarding.categoryName!.toLowerCase())
            : null) ||
          null;

        setSelectedCategory(preCategory);
        setSubcategoryOptions(buildSubcategoryOptions(preCategory?.raw));

        const preSubcats = (normalized.onboarding?.subcategories || [])
          .map((s) => ({ value: s.subcategoryId, label: s.subcategoryName }))
          .filter((s) => s.value);

        setSelectedSubcats(preSubcats);
        prevCatIdRef.current = preCategory?.value ?? null;
      } catch (e: any) {
        setError(e?.message || "Failed to load influencer profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedCountry) return;
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        countryId: selectedCountry.value,
        country: selectedCountry.country.countryName,
      };
    });
  }, [selectedCountry]);

  useEffect(() => {
    if (!selectedCalling) return;
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        callingId: selectedCalling.value,
        callingCode: selectedCalling.country.callingCode,
      };
    });
  }, [selectedCalling]);

  useEffect(() => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, primaryPlatform: selectedPlatform };
    });
  }, [selectedPlatform]);

  useEffect(() => {
    setSubcategoryOptions(buildSubcategoryOptions(selectedCategory?.raw));

    const currentId = selectedCategory?.value ?? null;
    const prevId = prevCatIdRef.current;

    if (prevId !== null && currentId !== prevId) {
      setSelectedSubcats([]);
      setForm((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          onboarding: {
            ...prev.onboarding,
            categoryId: selectedCategory?.value,
            categoryName: selectedCategory?.label,
            subcategories: [],
          },
        };
      });
    } else {
      setForm((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          onboarding: {
            ...prev.onboarding,
            categoryId: selectedCategory?.value,
            categoryName: selectedCategory?.label,
          },
        };
      });
    }

    prevCatIdRef.current = currentId;
  }, [selectedCategory]);

  useEffect(() => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        onboarding: {
          ...prev.onboarding,
          subcategories: selectedSubcats.map((s) => ({
            subcategoryId: s.value,
            subcategoryName: s.label,
          })),
        },
      };
    });
  }, [selectedSubcats]);

  const onField = useCallback(
    <K extends keyof InfluencerData>(key: K, value: InfluencerData[K]) => {
      setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    []
  );

  const resetEdits = useCallback(() => {
    if (!influencer) return;

    const cl = structuredClone(influencer);
    setForm(cl);
    setIsEditing(false);
    setEmailFlow("idle");
    setProfileImageFile(null);

    setSelectedCountry(
      countryOptions.find((o) => o.value === cl.countryId) ||
        countryOptions.find(
          (o) => o.country.countryName.toLowerCase() === (cl.country || "").toLowerCase()
        ) ||
        null
    );

    setSelectedCalling(
      codeOptions.find((o) => o.value === cl.callingId) ||
        codeOptions.find((o) => o.country.callingCode === cl.callingCode) ||
        null
    );

    setSelectedPlatform(cl.primaryPlatform ?? null);

    const cat =
      categories.find((c) => c.value === cl.onboarding?.categoryId) ||
      categories.find((c) => c.label.toLowerCase() === (cl.onboarding?.categoryName || "").toLowerCase()) ||
      null;

    setSelectedCategory(cat);
    setSubcategoryOptions(buildSubcategoryOptions(cat?.raw));
    setSelectedSubcats(
      (cl.onboarding?.subcategories || [])
        .map((s) => ({ value: s.subcategoryId, label: s.subcategoryName }))
        .filter((s) => s.value)
    );

    prevCatIdRef.current = cat?.value ?? null;
  }, [influencer, countryOptions, codeOptions, categories]);

  const saveProfile = useCallback(async () => {
    if (!form || !influencer) return;

    if (emailFlow !== "idle" && emailFlow !== "verified") {
      await Swal.fire({
        icon: "warning",
        title: "Verify your new email",
        text: "Please finish verifying the new email before saving other changes.",
      });
      return;
    }

    const hasValidGender =
      typeof form.gender !== "undefined" &&
      ["Male", "Female", "Non-binary", "Prefer not to say", ""].includes(form.gender);

    if (form.otpVerified && !hasValidGender) {
      await Swal.fire({
        icon: "info",
        title: "Gender required",
        text: "Please select your gender to continue.",
      });
      return;
    }

    const phoneTrim = (form.phone || "").trim();

    if (form.otpVerified && phoneTrim && !/^\d{10}$/.test(phoneTrim)) {
      await Swal.fire({
        icon: "warning",
        title: "Invalid phone",
        text: "Phone number must be 10 digits.",
      });
      return;
    }

    if (!form.onboarding?.categoryId || !form.onboarding?.categoryName) {
      await Swal.fire({
        icon: "error",
        title: "Pick a category",
        text: "Please select a primary category.",
      });
      return;
    }

    if (!form.onboarding.subcategories || form.onboarding.subcategories.length < 1) {
      await Swal.fire({
        icon: "error",
        title: "Pick subcategories",
        text: "Please select one or more subcategories.",
      });
      return;
    }

    setSaving(true);
    try {
      const influencerId = localStorage.getItem("influencerId");
      if (!influencerId) throw new Error("Missing influencerId in localStorage.");

      const fd = new FormData();
      fd.append("influencerId", influencerId);
      fd.append("name", form.name || "");

      if (form.password) fd.append("password", form.password);

      const originalPhone = (influencer.phone || "").trim();
      if (phoneTrim && phoneTrim !== originalPhone) {
        fd.append("phone", phoneTrim);
      }

      if (typeof form.gender !== "undefined") {
        const g = String(form.gender || "");
        const allowed = ["Male", "Female", "Non-binary", "Prefer not to say", ""];
        if (allowed.includes(g)) fd.append("gender", g);
      }

      fd.append("socialMedia", form.socialMedia || "");
      fd.append("profileLink", form.profileLink || "");

      if (form.primaryPlatform) fd.append("primaryPlatform", form.primaryPlatform);
      if (form.countryId) fd.append("countryId", form.countryId);
      if (form.callingId) fd.append("callingId", form.callingId);

      fd.append(
        "onboarding",
        JSON.stringify({
          categoryId: form.onboarding.categoryId,
          categoryName: form.onboarding.categoryName,
          subcategories: form.onboarding.subcategories,
        })
      );

      if (profileImageFile) fd.append("profileImage", profileImageFile);

      await post("/influencer/updateProfile", fd);

      await Swal.fire({
        icon: "success",
        title: "Profile updated",
        timer: 1200,
        showConfirmButton: false,
      });

      const updatedRaw = await get<any>(`/influencer/getbyid?id=${influencerId}`);
      const updated = normalizeInfluencer(updatedRaw);

      setInfluencer(updated);
      setForm(structuredClone(updated));
      setIsEditing(false);
      setEmailFlow("idle");
      setProfileImageFile(null);

      setSelectedCountry(() => {
        const byId = countryOptions.find((o) => o.value === updated.countryId);
        const byName =
          !byId &&
          countryOptions.find(
            (o) => o.country.countryName.toLowerCase() === (updated.country || "").toLowerCase()
          );
        return (byId || byName || null) as CountryOption | null;
      });

      setSelectedCalling(() => {
        const byId = codeOptions.find((o) => o.value === updated.callingId);
        const byCode = !byId && codeOptions.find((o) => o.country.callingCode === updated.callingCode);
        return (byId || byCode || null) as CountryOption | null;
      });

      setSelectedPlatform(updated.primaryPlatform ?? null);

      const cat =
        categories.find((c) => c.value === updated.onboarding?.categoryId) ||
        categories.find((c) => c.label.toLowerCase() === (updated.onboarding?.categoryName || "").toLowerCase()) ||
        null;

      setSelectedCategory(cat);
      setSubcategoryOptions(buildSubcategoryOptions(cat?.raw));
      const subs = (updated.onboarding?.subcategories || [])
        .map((s) => ({ value: s.subcategoryId, label: s.subcategoryName }))
        .filter((s) => s.value);
      setSelectedSubcats(subs);
      prevCatIdRef.current = cat?.value ?? null;
    } catch (e: any) {
      await Swal.fire({
        icon: "error",
        title: "Save failed",
        text: e?.message || "Failed to save profile.",
      });
    } finally {
      setSaving(false);
    }
  }, [form, influencer, emailFlow, profileImageFile, countryOptions, codeOptions, categories]);

  if (loading) return <Loader />;
  if (error) return <InlineError message={error} />;

  const saveDisabled = saving || (emailFlow !== "idle" && emailFlow !== "verified");
  const toSO = (o: { value: string; label: string }) => ({ value: o.value, label: o.label });

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,191,0,0.14),_transparent_35%),linear-gradient(to_bottom_right,#fffdf7,#ffffff,#fffaf0)] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
        {/* HERO */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
          <CardContent className="py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-5 min-w-0">
                <Avatar className="h-24 w-24 rounded-3xl ring-4 ring-amber-100 shadow-md">
                  <AvatarImage src={form?.profileImage || influencer?.profileImage || ""} alt={influencer?.name} />
                  <AvatarFallback className="rounded-3xl bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-800">
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 space-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight truncate">
                        {influencer?.name || "—"}
                      </h1>
                      {influencer?.isVerifiedCreator ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          Verified
                        </Badge>
                      ) : null}
                    </div>

                    <p className="mt-1 text-muted-foreground">
                      {humanizePlatform(influencer?.primaryPlatform ?? null)}
                      {influencer?.socialMedia ? ` • ${influencer.socialMedia}` : ""}
                      {influencer?.country ? ` • ${influencer.country}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {topN(influencer?.categories, 4).map((cat, idx) => (
                      <Badge
                        key={`${cat.name}-${idx}`}
                        variant="secondary"
                        className="bg-amber-50 text-amber-800 border border-amber-200"
                      >
                        {cat.name}
                      </Badge>
                    ))}
                    {topN(influencer?.languages, 4).map((lang, idx) => (
                      <Badge key={`${lang.name}-${idx}`} variant="outline">
                        {lang.name}
                      </Badge>
                    ))}
                  </div>

                  {influencer?.bio ? (
                    <p className="max-w-3xl text-sm sm:text-base text-muted-foreground leading-7 whitespace-pre-line">
                      {influencer.bio}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-3 text-sm">
                    {influencer?.profileLink ? (
                      <a
                        href={influencer.profileLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 font-medium text-amber-800 hover:bg-amber-200 transition"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Profile
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="gap-2 rounded-xl bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-800 shadow"
                >
                  <Pencil className="h-5 w-5" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* QUICK STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard label="Followers" value={formatCompactNumber(influencer?.followers)} icon={<Users className="h-4 w-4" />} />
          <StatCard label="Avg Views" value={formatCompactNumber(influencer?.averageViews)} icon={<Eye className="h-4 w-4" />} />
          <StatCard label="Engagement Rate" value={formatPercent(influencer?.engagementRate)} icon={<BarChart3 className="h-4 w-4" />} />
          <StatCard label="Total Views" value={formatCompactNumber(influencer?.totalViews)} icon={<Eye className="h-4 w-4" />} />
          <StatCard label="Posts" value={formatCompactNumber(influencer?.postsCount)} icon={<BarChart3 className="h-4 w-4" />} />
          <StatCard label="Avg Likes" value={formatCompactNumber(influencer?.avgLikes)} icon={<Heart className="h-4 w-4" />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="xl:col-span-2 space-y-6">
            {/* PROFILE DETAILS */}
            <Card className="border-0 shadow-sm bg-white/90">
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldCard icon={<User className="h-5 w-5 text-gray-800" />} label="Full Name">
                    {isEditing ? (
                      <Input value={form?.name || ""} onChange={(e) => onField("name", e.target.value as any)} />
                    ) : (
                      <ReadText text={influencer?.name || ""} />
                    )}
                  </FieldCard>

                  <FieldCard icon={<Hash className="h-5 w-5 text-gray-800" />} label="Social Handle">
                    {isEditing ? (
                      <Input value={form?.socialMedia || ""} onChange={(e) => onField("socialMedia", e.target.value as any)} />
                    ) : (
                      <ReadText text={influencer?.socialMedia || ""} />
                    )}
                  </FieldCard>

                  {!isEditing ? (
                    <FieldCard icon={<Mail className="h-5 w-5 text-gray-800" />} label="Email Address">
                      <ReadText text={influencer?.email ?? ""} />
                    </FieldCard>
                  ) : (
                    influencer &&
                    form && (
                      <EmailEditorSingleOTP
                        influencerId={influencer.influencerId}
                        originalEmail={influencer.email}
                        value={form.email}
                        onChange={(v) => onField("email", v as any)}
                        onVerified={(newEmail) => {
                          setInfluencer((b) => (b ? { ...b, email: newEmail } : b));
                          setForm((f) => (f ? { ...f, email: newEmail } : f));
                          setEmailFlow("verified");
                        }}
                        onStateChange={setEmailFlow}
                      />
                    )
                  )}

                  <FieldCard icon={<PhoneIcon className="h-5 w-5 text-gray-800" />} label="Phone Number">
                    {isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-[140px,1fr] gap-2">
                        <ShSelect
                          value={selectedCalling?.value || ""}
                          onValueChange={(v) => setSelectedCalling(codeOptions.find((o) => o.value === v) || null)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Code" />
                          </SelectTrigger>
                          <SelectContent className="bg-white max-h-72 overflow-auto">
                            {codeOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.country.callingCode} ({o.country.countryName})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </ShSelect>

                        <Input
                          type="tel"
                          value={form?.phone ?? ""}
                          onChange={(e) => onField("phone", e.target.value as any)}
                          placeholder="Phone number"
                        />
                      </div>
                    ) : (
                      <ReadText text={formatPhoneDisplay(form?.callingCode || influencer?.callingCode, influencer?.phone)} />
                    )}
                  </FieldCard>

                  <FieldCard icon={<Globe className="h-5 w-5 text-gray-800" />} label="Country">
                    {isEditing ? (
                      <ShSelect
                        value={selectedCountry?.value || ""}
                        onValueChange={(v) => setSelectedCountry(countryOptions.find((o) => o.value === v) || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent className="bg-white max-h-72 overflow-auto">
                          {countryOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.country.flag} {o.country.countryName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </ShSelect>
                    ) : (
                      <ReadText text={influencer?.country || ""} />
                    )}
                  </FieldCard>

                  <FieldCard icon={<Users className="h-5 w-5 text-gray-800" />} label="Primary Platform">
                    {isEditing ? (
                      <ShSelect
                        value={selectedPlatform || ""}
                        onValueChange={(v) => setSelectedPlatform((v || null) as PrimaryPlatform)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Platform" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {PLATFORM_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </ShSelect>
                    ) : (
                      <ReadText text={humanizePlatform(influencer?.primaryPlatform ?? null)} />
                    )}
                  </FieldCard>

                  <FieldCard icon={<User className="h-5 w-5 text-gray-800" />} label="Gender">
                    {isEditing ? (
                      <ShSelect value={form?.gender ?? ""} onValueChange={(v) => onField("gender", v as GenderStr)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Non-binary">Non-binary</SelectItem>
                          <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </ShSelect>
                    ) : (
                      <ReadText text={influencer?.creatorGender || influencer?.gender || "—"} />
                    )}
                  </FieldCard>
                </div>
              </CardContent>
            </Card>

            {/* PLATFORM & CATEGORIES */}
            <Card className="border-0 shadow-sm bg-white/90">
              <CardHeader>
                <CardTitle>Categories & Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <FieldCard icon={<Pencil className="h-5 w-5 text-gray-800" />} label="Category">
                    {isEditing ? (
                      <ShSelect
                        value={selectedCategory?.value?.toString() || ""}
                        onValueChange={(v) => setSelectedCategory(categories.find((c) => String(c.value) === v) || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-white max-h-72 overflow-auto">
                          {categories.map((o) => (
                            <SelectItem key={o.value} value={String(o.value)}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </ShSelect>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {topN(influencer?.categories, 6).map((cat, idx) => (
                          <Badge key={`${cat.name}-${idx}`} variant="secondary">
                            {cat.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </FieldCard>

                  <FieldCard icon={<Globe className="h-5 w-5 text-gray-800" />} label="Languages">
                    <div className="flex flex-wrap gap-2">
                      {topN(influencer?.languages, 8).map((lang, idx) => (
                        <Badge key={`${lang.name}-${idx}`} variant="outline">
                          {lang.name}
                        </Badge>
                      ))}
                      {!influencer?.languages?.length && <ReadText text="—" />}
                    </div>
                  </FieldCard>
                </div>

                <Card className="border shadow-none">
                  <CardContent className="pt-6 space-y-2 bg-white">
                    <Label>Subcategories</Label>
                    {isEditing ? (
                      <>
                        <MultiSelect
                          values={selectedSubcats.map(toSO)}
                          onChange={(opts) => setSelectedSubcats(opts as SubcategoryOption[])}
                          options={subcategoryOptions.map(toSO)}
                          placeholder={selectedCategory ? "Choose subcategories" : "Pick a category first"}
                        />
                        {!!selectedSubcats.length && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {selectedSubcats.map((c) => (
                              <Badge key={c.value} variant="secondary">
                                {c.label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </>
                    ) : influencer?.onboarding?.subcategories?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {influencer.onboarding.subcategories.map((s, idx) => (
                          <Badge
                            key={`${s.subcategoryName}-${idx}`}
                            variant="secondary"
                            className="bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-800"
                          >
                            {s.subcategoryName}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">—</p>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* CONTENT STATS */}
            <Card className="border-0 shadow-sm bg-white/90">
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <StatCard
                    label="All Content"
                    value={formatCompactNumber(influencer?.statsByContentType?.all?.avgViews)}
                    sub={`ER ${formatPercent(influencer?.statsByContentType?.all?.engagementRate)}`}
                    icon={<Eye className="h-4 w-4" />}
                  />
                  <StatCard
                    label="Videos"
                    value={formatCompactNumber(influencer?.statsByContentType?.videos?.avgViews)}
                    sub={`Likes ${formatCompactNumber(influencer?.statsByContentType?.videos?.avgLikes)}`}
                    icon={<BarChart3 className="h-4 w-4" />}
                  />
                  <StatCard
                    label="Shorts"
                    value={formatCompactNumber(influencer?.statsByContentType?.shorts?.avgViews)}
                    sub={`ER ${formatPercent(influencer?.statsByContentType?.shorts?.engagementRate)}`}
                    icon={<BarChart3 className="h-4 w-4" />}
                  />
                </div>
              </CardContent>
            </Card>

            {/* RECENT POSTS */}
            <Card className="border-0 shadow-sm bg-white/90">
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {topN(influencer?.recentPosts, 6).map((post, idx) => (
                    <PostCard key={`${post.url || post.title || "recent"}-${idx}`} post={post} />
                  ))}
                  {!influencer?.recentPosts?.length && <p className="text-muted-foreground">No recent posts available.</p>}
                </div>
              </CardContent>
            </Card>

            {/* POPULAR POSTS */}
            <Card className="border-0 shadow-sm bg-white/90">
              <CardHeader>
                <CardTitle>Popular Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {topN(influencer?.popularPosts, 6).map((post, idx) => (
                    <PostCard key={`${post.url || post.title || "popular"}-${idx}`} post={post} />
                  ))}
                  {!influencer?.popularPosts?.length && <p className="text-muted-foreground">No popular posts available.</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm bg-white/90">
              <CardHeader>
                <CardTitle>Audience Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-sm font-medium mb-2">Top Countries</p>
                  <div className="space-y-2">
                    {topN(influencer?.audience?.geoCountries, 5).map((item, idx) => (
                      <div key={`${item.code || item.name}-${idx}`} className="flex items-center justify-between text-sm">
                        <span>{item.name || item.code || "—"}</span>
                        <span className="font-medium">{formatPercent(item.weight)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Top Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {topN(influencer?.audience?.languages, 8).map((lang, idx) => (
                      <Badge key={`${lang.code || lang.name}-${idx}`} variant="outline">
                        {(lang.name || lang.code || "—") + ` • ${formatPercent(lang.weight)}`}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Gender Split</p>
                  <div className="space-y-2">
                    {topN(influencer?.audience?.genders, 5).map((g, idx) => (
                      <div key={`${g.code}-${idx}`} className="flex items-center justify-between text-sm">
                        <span>{g.code || "—"}</span>
                        <span className="font-medium">{formatPercent(g.weight)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Age Groups</p>
                  <div className="space-y-2">
                    {topN(influencer?.audience?.ages, 6).map((a, idx) => (
                      <div key={`${a.code}-${idx}`} className="flex items-center justify-between text-sm">
                        <span>{a.code || "—"}</span>
                        <span className="font-medium">{formatPercent(a.weight)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/90">
              <CardHeader>
                <CardTitle>Creator Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Age Group</span>
                  <span className="font-medium">{influencer?.creatorAgeGroup || "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="font-medium">{influencer?.creatorGender || influencer?.gender || "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Avg Comments</span>
                  <span className="font-medium">{formatCompactNumber(influencer?.avgComments)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Avg Engagements</span>
                  <span className="font-medium">{formatCompactNumber(influencer?.engagements)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        {isEditing && (
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button variant="outline" onClick={resetEdits} disabled={saving} className="gap-2 bg-white">
              <X className="h-5 w-5" />
              Cancel
            </Button>
            <Button
              onClick={saveProfile}
              disabled={saveDisabled}
              className="gap-2 bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-800"
              title={
                emailFlow !== "idle" && emailFlow !== "verified"
                  ? "Verify the new email to enable saving"
                  : undefined
              }
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

/* -------- Small UI helpers -------- */

function Loader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/30 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-amber-500" />
        <p className="text-muted-foreground font-medium">Loading profile…</p>
      </div>
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/30 flex items-center justify-center">
      <Card className="max-w-md mx-auto text-center">
        <CardContent className="py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
          <p className="text-red-600 mb-4 break-words">{message}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FieldCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  children: React.ReactNode;
  editing?: boolean;
}) {
  return (
    <Card className="border-0 shadow-sm bg-white/90 backdrop-blur">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-800 flex items-center justify-center shadow-sm">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </Label>
            <div>{children}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReadText({ text }: { text: string }) {
  return <p className="text-lg font-medium break-words">{text || "—"}</p>;
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="border-0 shadow-sm bg-white/90">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          {icon ? <div className="text-amber-600">{icon}</div> : null}
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        {sub ? <p className="mt-1 text-sm text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}

function PostCard({ post }: { post: PostItem }) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-white">
      {post.thumbnail ? (
        <img
          src={post.thumbnail}
          alt={post.title || "Post thumbnail"}
          className="h-44 w-full object-cover"
        />
      ) : null}

      <CardContent className="pt-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant="secondary" className="capitalize">
            {post.type || "post"}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatDateOnly(post.created)}</span>
        </div>

        <h4 className="font-semibold line-clamp-2">{post.title || "Untitled post"}</h4>

        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Views</p>
            <p className="font-medium">{formatCompactNumber(post.views)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Likes</p>
            <p className="font-medium">{formatCompactNumber(post.likes)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Comments</p>
            <p className="font-medium">{formatCompactNumber(post.comments)}</p>
          </div>
        </div>

        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-amber-700 underline"
          >
            <ExternalLink className="h-4 w-4" />
            View Post
          </a>
        )}
      </CardContent>
    </Card>
  );
}