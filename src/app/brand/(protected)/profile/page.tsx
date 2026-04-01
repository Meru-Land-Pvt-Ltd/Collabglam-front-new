"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Globe2,
  History,
  Mail,
  PencilLine,
  Save,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  apiGetBrandProfile,
  apiGetBrandWallet,
  apiUpdateBrandProfile,
  getApiErrorMessage,
} from "../../services/brandApi";
import { toast, ToastStyles } from "@/components/ui/toast";
import { FloatingSelect, SelectItem } from "@/components/ui/selectComp";

type QA = {
  question: string;
  answers: string[];
};

type BrandFeature = {
  key?: string | null;
  value?: string | number | { unlimited?: boolean } | null;
  limit?: number | null;
  used?: number | null;
  note?: string | null;
  resetsEvery?: string | null;
  resetsAt?: string | null;
};

type BrandSubscription = {
  planId?: string | null;
  planName?: string | null;
  name?: string | null;
  status?: string | null;
  billingCycle?: string | null;
  monthlyCost?: number | null;
  annualCost?: number | null;
  startedAt?: string | null;
  expiresAt?: string | null;
  features?: BrandFeature[] | null;
};

type BrandProfile = {
  _id?: string;
  brandId?: string;
  brandName?: string;
  name?: string;
  email?: string;
  proxyEmail?: string;
  profilePic?: string;
  companySize?: string;
  industry?: string;
  page1?: QA[];
  page2?: QA[];
  page3?: QA[];
  subscription?: BrandSubscription | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

type WalletData = {
  walletBalance: number;
  frozenBalance: number;
  usableBalance: number;
  freezes: Array<{
    brandId: string;
    campaignId: string;
    totalFrozenAmount: number;
    currentFrozenAmount: number;
    totalAllocatedAmount: number;
    totalReleasedAmount: number;
    availableToAllocate: number;
    influencerAllocations: Array<{
      influencerId: string;
      amount: number;
      releasedAmount: number;
    }>;
  }>;
};

type PlatformOption = "Instagram" | "Youtube" | "Tiktok";

type FormState = {
  brandName: string;
  companySize: string;
  brandType: string;
  industry: string;
  platform: PlatformOption;
};

const cardClass =
  "rounded-[24px] border border-[#ececec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

const editableWrapClass =
  "rounded-[20px] border border-dashed border-[#F4C542] bg-[#FFFDF2] p-3 transition-all";

const editableInputClass =
  "border-[#F4C542] bg-[#FFFBEA] ring-4 ring-[#F4C542]/15 shadow-[0_0_0_1px_rgba(244,197,66,0.28)]";

const INDUSTRY_OPTIONS = [
  "Beauty & Personal Care",
  "Fashion & Apparel",
  "Lifestyle & Home",
  "Health & Fitness",
  "Technology & SaaS",
  "Food & Beverage",
  "Travel & Hospitality",
  "Education",
  "Finance & Fintech",
  "Gaming & Entertainment",
  "Media & Publishing",
  "Real Estate",
  "Sustainability & Eco Brands",
  "Other",
] as const;

const COMPANY_SIZE_OPTIONS = [
  "Solo / Self-employed",
  "2–10 employees",
  "11–50 employees",
  "51–200 employees",
  "201–500 employees",
  "500+ employees",
] as const;

const BRAND_TYPES = [
  "D2C / Consumer Brand",
  "Marketplace",
  "Agency (managing clients)",
  "Startup / Early-stage brand",
  "Enterprise / Established brand",
  "Creator-led / Personal brand",
] as const;

const PLATFORM_OPTIONS = ["Instagram", "Youtube", "Tiktok"] as const;

function formatDate(input?: string | null) {
  if (!input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(value?: number | null) {
  const safe = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

function normalizePercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function getQaAnswer(
  items: QA[] | undefined,
  questionIncludes: string,
  fallback = ""
) {
  const found = (items || []).find((item) =>
    String(item?.question || "")
      .toLowerCase()
      .includes(questionIncludes.toLowerCase())
  );
  return found?.answers?.[0] || fallback;
}

function getPlatformFromPage3(items?: QA[]): PlatformOption {
  const answer =
    getQaAnswer(items, "preferred platform", "") ||
    getQaAnswer(items, "platform", "");
  const cleaned = answer.trim().toLowerCase();

  if (cleaned === "instagram") return "Instagram";
  if (cleaned === "tiktok") return "Tiktok";
  return "Youtube";
}

function featureValueLabel(feature: BrandFeature) {
  if (feature?.limit === -1) return "Unlimited";
  if (
    feature?.limit !== undefined &&
    feature?.limit !== null &&
    feature.limit > 0
  ) {
    return String(feature.limit);
  }
  if (
    feature?.value !== undefined &&
    feature?.value !== null &&
    feature.value !== ""
  ) {
    return String(feature.value);
  }
  return "Included";
}

function featureProgress(feature: BrandFeature) {
  const used = Number(feature?.used ?? 0);
  const limit = Number(feature?.limit ?? 0);
  if (feature?.limit === -1) return 100;
  if (!Number.isFinite(limit) || limit <= 0) return 100;
  return normalizePercent((used / limit) * 100);
}

function prettifyFeatureKey(value?: string | null) {
  return String(value || "Feature")
    .replace(/_per_month/g, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getBrandType(profile: BrandProfile | null) {
  const value =
    getQaAnswer(profile?.page1, "what type of brand", "") ||
    getQaAnswer(profile?.page1, "brand type", "");

  if (BRAND_TYPES.includes(value as (typeof BRAND_TYPES)[number])) return value;
  return BRAND_TYPES[0];
}

function getIndustry(profile: BrandProfile | null) {
  const value = profile?.industry || "";
  if (INDUSTRY_OPTIONS.includes(value as (typeof INDUSTRY_OPTIONS)[number])) {
    return value;
  }
  return "Other";
}

function getCompanySize(profile: BrandProfile | null) {
  const value = profile?.companySize || "";
  if (
    COMPANY_SIZE_OPTIONS.includes(value as (typeof COMPANY_SIZE_OPTIONS)[number])
  ) {
    return value;
  }
  return COMPANY_SIZE_OPTIONS[0];
}

function getInitialForm(profile: BrandProfile | null): FormState {
  return {
    brandName: profile?.brandName || "",
    companySize: getCompanySize(profile),
    brandType: getBrandType(profile),
    industry: getIndustry(profile),
    platform: getPlatformFromPage3(profile?.page3),
  };
}

function initialsFromName(value?: string) {
  const clean = String(value || "").trim();
  if (!clean) return "B";
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function BrandProfilePage() {
  const [brandId, setBrandId] = useState("");
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [form, setForm] = useState<FormState>({
    brandName: "",
    companySize: COMPANY_SIZE_OPTIONS[0],
    brandType: BRAND_TYPES[0],
    industry: "Other",
    platform: "Youtube",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const storedBrandId =
      typeof window !== "undefined"
        ? localStorage.getItem("brandId") ||
        localStorage.getItem("brand_id") ||
        localStorage.getItem("userId") ||
        ""
        : "";

    if (!storedBrandId) {
      setLoading(false);
      toast({
        icon: "error",
        title: "Brand ID missing",
        text: "brandId was not found in localStorage.",
      });
      return;
    }

    setBrandId(storedBrandId);
  }, []);

  useEffect(() => {
    if (!brandId) return;

    const run = async () => {
      try {
        setLoading(true);

        const [profileRes, walletRes] = await Promise.all([
          apiGetBrandProfile(brandId),
          apiGetBrandWallet({ brandId }),
        ]);

        const profile = profileRes as BrandProfile;
        const walletData: WalletData = walletRes;

        setBrand(profile);
        setWallet(walletData);
        setForm(getInitialForm(profile));
      } catch (err) {
        toast({
          icon: "error",
          title: "Failed to load profile",
          text: getApiErrorMessage(
            err,
            "Something went wrong while fetching brand profile."
          ),
        });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [brandId]);

  const subscription = useMemo(() => brand?.subscription ?? null, [brand]);

  const metrics = useMemo(() => {
    const features = Array.isArray(subscription?.features)
      ? subscription.features.slice(0, 6)
      : [];
    return features.map((feature) => ({
      label: prettifyFeatureKey(feature?.key),
      usedText:
        feature?.limit === -1
          ? `${feature?.used ?? 0} / Unlimited`
          : `${feature?.used ?? 0} / ${featureValueLabel(feature)}`,
      percent: featureProgress(feature),
    }));
  }, [subscription]);

  const displayName = brand?.name || brand?.brandName || "Brand Admin";
  const logo = brand?.profilePic || "";

  const onChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onCancel = () => {
    setEditing(false);
    setForm(getInitialForm(brand));
    toast({
      icon: "info",
      title: "Changes discarded",
      text: "Your profile form was reset.",
    });
  };

  const onSave = async () => {
    if (!brandId) return;

    try {
      setSaving(true);

      await apiUpdateBrandProfile({
        brandId,
        brandName: form.brandName,
        companySize: form.companySize,
        brandType: form.brandType,
        platform: form.platform,
      });

      const updatedProfile = (await apiGetBrandProfile(brandId)) as BrandProfile;
      setBrand(updatedProfile);
      setForm(getInitialForm(updatedProfile));
      setEditing(false);

      toast({
        icon: "success",
        title: "Profile updated",
        text: "Your brand profile was updated successfully.",
      });
    } catch (err) {
      toast({
        icon: "error",
        title: "Update failed",
        text: getApiErrorMessage(err, "Unable to save brand profile."),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] px-4 py-6 md:px-6 lg:px-8">
      <ToastStyles />

      <div className="mx-auto max-w-[1380px]">
        <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-[#ececec] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111111] text-sm font-semibold text-white">
              C
            </div>
            <div>
              <p className="text-[18px] font-semibold text-[#111111]">
                Collabglam
              </p>
              <p className="text-sm text-[#666666]">Brand workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="text-right">
              <p className="text-sm font-medium text-[#111111]">
                {displayName}
              </p>
              <p className="text-xs text-[#8b8b8b]">Brand Admin</p>
            </div>
            {logo ? (
              <img
                src={logo}
                alt={displayName}
                className="h-10 w-10 rounded-full object-cover ring-1 ring-[#ececec]"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eceff4] text-sm font-semibold text-[#111111] ring-1 ring-[#ececec]">
                {initialsFromName(displayName)}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 rounded-[32px] border border-[#eaeaea] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-[#111111]">
                Brand Profile
              </h1>
              <p className="mt-1 text-[15px] text-[#6b6b6b]">
                Manage your brand information and settings
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {editing ? (
                <>
                  <button
                    onClick={onCancel}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[#ebebeb] bg-white px-5 text-sm font-medium text-[#111111] transition hover:bg-[#fafafa]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSave}
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#111111] px-5 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#ebebeb] bg-white px-5 text-sm font-medium text-[#111111] transition hover:bg-[#fafafa]"
                >
                  <PencilLine className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {editing ? (
            <div className="rounded-[20px] border border-[#F4C542] bg-[#FFFBEA] px-4 py-3 text-sm text-[#7A5B00]">
              Highlighted fields are editable now. Brand Email, Email alias, and
              Role At Brand stay read-only.
            </div>
          ) : null}

          {loading ? (
            <div className="grid gap-6">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className={`${cardClass} p-6`}>
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 w-44 rounded bg-[#efefef]" />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="h-12 rounded-2xl bg-[#f3f3f3]" />
                      <div className="h-12 rounded-2xl bg-[#f3f3f3]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <section className={`${cardClass} p-5 md:p-6`}>
                <div className="mb-5 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#111111]" />
                  <h2 className="text-[18px] font-semibold text-[#111111]">
                    Brand Identity
                  </h2>
                </div>

                <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="flex flex-col items-start gap-3">
                    <div className="relative h-[110px] w-[110px] overflow-hidden rounded-full border border-[#e8e8e8] bg-[#f2f4f7]">
                      {logo ? (
                        <img
                          src={logo}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-[#111111]">
                          {initialsFromName(displayName)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <EditableInputField
                      label="Brand Name"
                      value={form.brandName}
                      editable={editing}
                      onChange={(value) => onChange("brandName", value)}
                    />

                    <ReadonlyField
                      label="Brand Email"
                      value={brand?.email || "—"}
                      icon={<Mail className="h-4 w-4 text-[#7a7a7a]" />}
                    />

                    <ReadonlyField
                      label="Email alias"
                      value={brand?.proxyEmail || "—"}
                    />

                    <EditableSelectField
                      label="Platform"
                      value={form.platform}
                      editable={editing}
                      options={PLATFORM_OPTIONS}
                      onChange={(value) =>
                        onChange("platform", value as PlatformOption)
                      }
                    />
                  </div>
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className={`${cardClass} p-5 md:p-6`}>
                  <div className="mb-5 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#111111]" />
                    <h2 className="text-[18px] font-semibold text-[#111111]">
                      Brand Information
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <EditableSelectField
                      label="Brand Type"
                      value={form.brandType}
                      editable={editing}
                      options={BRAND_TYPES}
                      onChange={(value) => onChange("brandType", value)}
                    />

                    <EditableSelectField
                      label="Industry"
                      value={form.industry}
                      editable={editing}
                      options={INDUSTRY_OPTIONS}
                      onChange={(value) => onChange("industry", value)}
                    />

                    <EditableSelectField
                      label="Company Size"
                      value={form.companySize}
                      editable={editing}
                      options={COMPANY_SIZE_OPTIONS}
                      onChange={(value) => onChange("companySize", value)}
                    />
                  </div>
                </section>

                <section className={`${cardClass} p-5 md:p-6`}>
                  <div className="mb-5 flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-[#111111]" />
                    <h2 className="text-[18px] font-semibold text-[#111111]">
                      Platforms
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <ReadonlyField
                      label="Brand Name"
                      value={form.brandName || "—"}
                    />

                    <EditableSelectField
                      label="Preferred Platform"
                      value={form.platform}
                      editable={editing}
                      options={PLATFORM_OPTIONS}
                      onChange={(value) =>
                        onChange("platform", value as PlatformOption)
                      }
                    />

                    <ReadonlyField
                      label="Role At Brand"
                      value={getQaAnswer(brand?.page2, "role", "—") || "—"}
                    />
                  </div>
                </section>
              </div>

              <section className={`${cardClass} overflow-hidden`}>
                <div className="flex flex-col gap-4 border-b border-[#efefef] px-5 py-5 md:flex-row md:items-start md:justify-between md:px-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-[#111111]" />
                      <h2 className="text-[18px] font-semibold text-[#111111]">
                        Subscription Plan
                      </h2>
                    </div>
                    <p className="mt-1 text-sm text-[#6b6b6b]">
                      Current tier and monthly consumption
                    </p>
                  </div>

                  <button className="inline-flex h-11 items-center justify-center rounded-full border border-[#e9e9e9] bg-white px-5 text-sm font-medium text-[#111111] hover:bg-[#fafafa]">
                    Upgrade Subscription
                  </button>
                </div>

                <div className="space-y-6 px-5 py-6 md:px-6">
                  <div className="grid gap-5 md:grid-cols-4">
                    <MetaBlock
                      label="Plan Name"
                      value={subscription?.planName || subscription?.name || "No Plan"}
                    />
                    <MetaBlock
                      label="Status"
                      value={subscription?.status || "Inactive"}
                      pill
                    />
                    <MetaBlock
                      label="Start Date"
                      value={formatDate(subscription?.startedAt)}
                    />
                    <MetaBlock
                      label="Expiry Date"
                      value={formatDate(subscription?.expiresAt)}
                    />
                  </div>

                  <div>
                    <p className="mb-4 text-sm font-semibold text-[#111111]">
                      Usage Metrics
                    </p>
                    {metrics.length ? (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {metrics.map((item) => (
                          <div
                            key={item.label}
                            className="space-y-2 rounded-2xl border border-[#efefef] p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-[#111111]">
                                {item.label}
                              </p>
                              <p className="text-xs text-[#6b6b6b]">
                                {item.usedText}
                              </p>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[#efefef]">
                              <div
                                className="h-full rounded-full bg-[#22c55e]"
                                style={{ width: `${item.percent}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#e5e7eb] bg-[#fafafa] p-5 text-sm text-[#6b6b6b]">
                        No subscription metrics available.
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className={`${cardClass} p-5 md:p-6`}>
                <div className="grid gap-4 rounded-[24px] bg-[#f8f8f9] p-5 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111111] text-white shadow-[0_6px_18px_rgba(17,17,17,0.15)]">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                        Wallet Balance
                      </p>
                      <div className="mt-1 flex items-end gap-2">
                        <span className="text-[38px] font-semibold leading-none tracking-[-0.03em] text-[#111111]">
                          {formatMoney(wallet?.walletBalance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <WalletInfo
                    label="Usable"
                    value={formatMoney(wallet?.usableBalance)}
                  />
                  <WalletInfo
                    label="Frozen"
                    value={formatMoney(wallet?.frozenBalance)}
                  />

                  {/* <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#ececec] bg-white px-5 text-sm font-medium text-[#111111] hover:bg-[#fafafa]">
                    Add Funds
                  </button> */}
                </div>
              </section>

              <section className={`${cardClass} overflow-hidden`}>
                <div className="flex items-center gap-2 border-b border-[#efefef] px-5 py-5 md:px-6">
                  <History className="h-4 w-4 text-[#111111]" />
                  <h2 className="text-[18px] font-semibold text-[#111111]">
                    Payment History
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-[#f0f0f0] bg-white text-left">
                        {["Item", "Details", "Amount", "Status", "Action"].map(
                          (head) => (
                            <th
                              key={head}
                              className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#7a7a7a] md:px-6"
                            >
                              {head}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(wallet?.freezes?.length || 0) > 0 ? (
                        wallet?.freezes.map((freeze, index) => (
                          <tr
                            key={`${freeze.campaignId}-${index}`}
                            className="border-b border-[#f6f6f6]"
                          >
                            <td className="px-5 py-5 text-sm font-medium text-[#111111] md:px-6">
                              Freeze #{index + 1}
                            </td>
                            <td className="px-5 py-5 text-sm text-[#4b5563] md:px-6">
                              Campaign frozen amount
                            </td>
                            <td className="px-5 py-5 text-sm font-medium text-[#111111] md:px-6">
                              {formatMoney(freeze.totalFrozenAmount)}
                            </td>
                            <td className="px-5 py-5 text-sm text-[#4b5563] md:px-6">
                              Frozen
                            </td>
                            <td className="px-5 py-5 md:px-6">
                              <button className="inline-flex h-9 items-center rounded-full border border-[#ececec] bg-white px-4 text-xs font-medium text-[#111111] hover:bg-[#fafafa]">
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-8 text-center text-sm text-[#6b6b6b] md:px-6"
                          >
                            No payment history available yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ReadonlyField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[13px] font-medium text-[#111111]">
        {label}
      </label>
      <div className="flex min-h-[52px] items-center gap-2 rounded-2xl border border-[#e9e9e9] bg-white px-4 text-sm text-[#111111]">
        {icon}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function EditableInputField({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  if (!editable) return <ReadonlyField label={label} value={value || "—"} />;

  return (
    <div className={editableWrapClass}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="block text-[13px] font-medium text-[#111111]">
          {label}
        </label>
        <span className="inline-flex rounded-full bg-[#F4C542] px-2.5 py-1 text-[11px] font-semibold text-[#111111]">
          Editable
        </span>
      </div>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`flex min-h-[52px] w-full items-center rounded-2xl border px-4 text-sm text-[#111111] outline-none transition ${editableInputClass} focus:border-[#D9A900] focus:ring-4 focus:ring-[#F4C542]/20`}
      />
    </div>
  );
}

function EditableSelectField({
  label,
  value,
  editable,
  options,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  if (!editable) {
    return (
      <ReadonlyField
        label={label}
        value={value || "—"}
        icon={<Globe2 className="h-4 w-4 text-[#7a7a7a]" />}
      />
    );
  }

  return (
    <div className={editableWrapClass}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="block text-[13px] font-medium text-[#111111]">
          {label}
        </label>
        <span className="inline-flex rounded-full bg-[#F4C542] px-2.5 py-1 text-[11px] font-semibold text-[#111111]">
          Editable
        </span>
      </div>

      <div className={`rounded-2xl ${editableInputClass}`}>
        <FloatingSelect label={label} value={value} onValueChange={onChange}>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </FloatingSelect>
      </div>
    </div>
  );
}

function MetaBlock({
  label,
  value,
  pill = false,
}: {
  label: string;
  value: string;
  pill?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7a7a7a]">
        {label}
      </p>
      {pill ? (
        <span className="mt-3 inline-flex rounded-full border border-[#e8e8e8] bg-[#fafafa] px-3 py-1 text-sm font-medium text-[#111111]">
          {value}
        </span>
      ) : (
        <p className="mt-3 text-[20px] font-semibold text-[#111111]">
          {value}
        </p>
      )}
    </div>
  );
}

function WalletInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6b6b6b]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[#111111]">{value}</p>
    </div>
  );
}