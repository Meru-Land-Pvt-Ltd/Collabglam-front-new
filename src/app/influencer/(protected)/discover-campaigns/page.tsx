"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  Clock,
  Dumbbell,
  Globe,
  LayoutGrid,
  MapPin,
  Search,
  Shirt,
  TrendingDown,
  TrendingUp,
  Utensils,
  Video,
  X,
} from "lucide-react";
import { InstagramLogoIcon, YoutubeLogoIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/buttonComp";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ManualPreviewCard } from "@/components/ui/cardPreview";

import {
  apiGetAllActiveCampaigns,
  getApiErrorMessage,
  type ActiveCampaignItem,
} from "@/services/influencerApi";
import {
  apiCategoryGetAll,
  apiListCountries,
} from "@/app/influencer/services/influencerApi";

import { useRouter } from "next/navigation";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type UICampaign = {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  daysLeft: number;
  match: number;
  category: string;
  platforms: string[];
  platformLabel: string;
  location: string;
  applications: number;
  brand: string;
  brandLogo?: string;
  image?: string;
  raw: ActiveCampaignItem | any;
};

type SelectOption = {
  value: string;
  label: string;
  icon: React.ElementType;
};

type CategoryRow = {
  id: string;
  name: string;
};

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

const sortOptions: SelectOption[] = [
  { value: "match", label: "Best Match", icon: ArrowUpDown },
  { value: "budget-high", label: "Highest Budget", icon: TrendingUp },
  { value: "budget-low", label: "Lowest Budget", icon: TrendingDown },
  { value: "ending", label: "Ending Soon", icon: Clock },
];

const filterTriggerClassName =
  "flex h-12 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm transition hover:border-gray-300 focus:outline-none";

function normalizePlatformLabel(value?: string) {
  const v = String(value || "").trim().toLowerCase();

  if (!v) return "Unknown";
  if (v.includes("instagram") || v === "insta") return "Instagram";
  if (v.includes("youtube") || v === "yt") return "YouTube";
  if (v.includes("tiktok") || v === "tt") return "TikTok";

  return value || "Unknown";
}

function getPlatformIcon(platform: string) {
  const normalized = normalizePlatformLabel(platform);

  if (normalized === "Instagram") return InstagramLogoIcon;
  if (normalized === "YouTube") return YoutubeLogoIcon;
  if (normalized === "TikTok") return Video;

  return Globe;
}

function getCategoryIcon(category: string) {
  const normalized = String(category || "").toLowerCase();

  if (normalized.includes("fashion")) return Shirt;
  if (normalized.includes("food")) return Utensils;
  if (normalized.includes("fitness")) return Dumbbell;

  return LayoutGrid;
}

function getDaysLeft(endAt?: string | null) {
  if (!endAt) return 0;

  const end = new Date(endAt);
  if (Number.isNaN(end.getTime())) return 0;

  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

function getStoredValue(keys: string[]) {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }

  return "";
}

function getInfluencerAuth() {
  const influencerId = getStoredValue([
    "influencerId",
    "influencer_id",
    "userId",
    "user_id",
  ]);

  const token = getStoredValue([
    "token",
    "authToken",
    "accessToken",
    "influencerToken",
  ]);

  return { influencerId, token };
}

function getImageUrl(image: any) {
  if (!image) return "";
  if (typeof image === "string") return image;

  return (
    image?.dataUrl ||
    image?.url ||
    image?.path ||
    image?.src ||
    image?.imageUrl ||
    ""
  );
}

function getMappedTextList(items: any, keys: string[]) {
  if (!Array.isArray(items)) return [];

  const values = items
    .map((item) => {
      if (typeof item === "string") return item.trim();

      if (item && typeof item === "object") {
        for (const key of keys) {
          const value = item?.[key];
          if (typeof value === "string" && value.trim()) {
            return value.trim();
          }
        }
      }

      return "";
    })
    .filter(Boolean);

  return Array.from(new Set(values));
}

function mapApiCampaignToUi(campaign: ActiveCampaignItem | any): UICampaign {
  const budget = Number(campaign?.campaignBudget ?? campaign?.budget ?? 0);

  const platforms: string[] = Array.isArray(campaign?.platformSelection)
    ? campaign.platformSelection
        .filter((p: unknown): p is string => typeof p === "string")
        .map((p: string) => normalizePlatformLabel(p))
        .filter((p: any): p is string => Boolean(p))
    : [];

  const normalizedPlatforms: string[] = Array.from(new Set(platforms));

  const brandName =
    campaign?.brandName ||
    campaign?.brand?.name ||
    campaign?.companyName ||
    "Brand Campaign";

  const applications =
    Number(campaign?.applicationsCount) ||
    Number(campaign?.contractsCount) ||
    Number(campaign?.emailsSent) ||
    Number(campaign?.applicantCount) ||
    0;

  const id = String(campaign?.campaignId || campaign?._id || "");

  const category =
    campaign?.category?.name ||
    campaign?.campaignCategory ||
    campaign?.categories?.[0]?.categoryName ||
    "Uncategorized";

  const location =
    campaign?.targetCountryIds?.[0]?.countryName ||
    campaign?.targetCountries?.[0]?.name ||
    campaign?.targetCountry ||
    campaign?.createdLocation?.country ||
    "";

  const firstImage =
    Array.isArray(campaign?.productImages) && campaign.productImages.length > 0
      ? campaign.productImages[0]
      : "";

  return {
    id,
    title: campaign?.campaignTitle || "Untitled Campaign",
    description: campaign?.description || "No description available.",
    budgetMin: budget,
    budgetMax: budget,
    daysLeft: getDaysLeft(campaign?.endAt),
    match: Number(campaign?.matchScore ?? 0),
    category,
    platforms: normalizedPlatforms.length ? normalizedPlatforms : ["Unknown"],
    platformLabel:
      normalizedPlatforms.length > 1
        ? "Multiple"
        : normalizedPlatforms[0] ?? "Unknown",
    location,
    applications,
    brand: brandName,
    brandLogo: campaign?.brandLogo || "",
    image: getImageUrl(firstImage),
    raw: campaign,
  };
}

function campaignToPreview(campaign: UICampaign) {
  const rawCountries = getMappedTextList(campaign.raw?.targetCountryIds, [
    "countryName",
    "name",
    "label",
    "title",
  ]);

  const ageRanges = [
    ...getMappedTextList(campaign.raw?.targetAgeRanges, [
      "range",
      "name",
      "label",
      "title",
    ]),
    ...getMappedTextList(campaign.raw?.targetAgeRangesDetails, [
      "range",
      "name",
      "label",
      "title",
    ]),
  ].filter(Boolean);

  const uniqueAgeRanges = Array.from(new Set(ageRanges));

  const goals = getMappedTextList(campaign.raw?.campaignGoals, [
    "goal",
    "name",
    "label",
    "title",
  ]);

  const productServiceInfo = getMappedTextList(campaign.raw?.productServiceInfo, [
    "title",
    "name",
    "label",
    "service",
    "product",
    "value",
    "info",
  ]);

  const categories = Array.isArray(campaign.raw?.categories)
    ? campaign.raw.categories
    : [];

  const allProductImages = Array.isArray(campaign.raw?.productImages)
    ? campaign.raw.productImages
    : [];

  const productImages =
    allProductImages.length > 0 ? [allProductImages[0]] : [];

  const ageText = uniqueAgeRanges.join(", ");
  const countryText = rawCountries.join(", ") || campaign.location || "";
  const goalsText = goals.join(", ");
  const productServiceText = productServiceInfo.join(", ");

  const categoryWithAge = [campaign.category, ageText].filter(Boolean).join(" • ");

  const topRightTag = [productServiceText, goalsText]
    .filter(Boolean)
    .join(" • ");

  return {
    form: {
      title: campaign.raw?.campaignTitle || campaign.title,
      name: campaign.raw?.campaignTitle || campaign.title,
      campaignTitle: campaign.raw?.campaignTitle || campaign.title,

      description: campaign.description,

      categoryName: categoryWithAge || campaign.category,
      categoryLabel: campaign.category,

      ageGroup: ageText,
      ageGroupText: ageText,
      targetAgeRanges:
        campaign.raw?.targetAgeRanges ||
        uniqueAgeRanges.map((range: string) => ({ range })),

      country: countryText,
      countryText,
      targetCountry:
        rawCountries.length > 0
          ? rawCountries
          : countryText
          ? [countryText]
          : [],
      targetCountryIds:
        campaign.raw?.targetCountryIds ||
        rawCountries.map((countryName: string) => ({ countryName })),

      campaignGoals: goals.length
        ? goals.map((goal: string) => ({ goal }))
        : [],
      goalText: goalsText,
      goalsText,

      productServiceInfo:
        productServiceInfo.length > 0 ? productServiceInfo : [],
      productServiceText,

      topRightTag,
      topTag: topRightTag,
      badgeText: topRightTag,
      tagText: topRightTag,

      campaignBudget: campaign.budgetMax,
      budget: campaign.budgetMax,

      productImages,
      allProductImages,
      coverImage: getImageUrl(productImages[0]),
      image: getImageUrl(productImages[0]),

      secondaryText: countryText,
      footerText: countryText,
      subDescription: countryText,
    },
    meta: {
      countryMap: rawCountries.reduce(
        (acc: Record<string, string>, item: string) => {
          acc[item] = item;
          return acc;
        },
        {},
      ),
      ageMap: uniqueAgeRanges.reduce(
        (acc: Record<string, string>, item: string) => {
          acc[item] = item;
          return acc;
        },
        {},
      ),
      goalsMap: goals.reduce((acc: Record<string, string>, item: string) => {
        acc[item] = item;
        return acc;
      }, {}),
      campaignBudget: campaign.budgetMax,
      countryText,
      ageText,
      goalsText,
      productServiceText,
      topRightTag,
    },
  };
}

function resolveBudgetRange(
  budgetValue: string,
  maxBudget: number,
): [number, number] {
  switch (budgetValue) {
    case "0-5000":
      return [0, Math.min(5000, maxBudget)];
    case "5000-10000":
      return maxBudget >= 5000 ? [5000, Math.min(10000, maxBudget)] : [0, maxBudget];
    case "10000-25000":
      return maxBudget >= 10000
        ? [10000, Math.min(25000, maxBudget)]
        : [0, maxBudget];
    case "25000-50000":
      return maxBudget >= 25000
        ? [25000, Math.min(50000, maxBudget)]
        : [0, maxBudget];
    case "50000+":
      return maxBudget >= 50000 ? [50000, maxBudget] : [0, maxBudget];
    default:
      return [0, maxBudget];
  }
}

function SingleFilterCombobox({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  widthClassName = "w-[220px]",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  searchPlaceholder: string;
  widthClassName?: string;
}) {
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];
  const Icon = selectedOption?.icon ?? LayoutGrid;

  return (
    <div className={`${widthClassName} shrink-0`}>
      <Combobox value={value} onValueChange={(nextValue: any) => onChange(String(nextValue))}>
        <ComboboxTrigger className={filterTriggerClassName}>
          <span className="flex min-w-0 items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 text-gray-500" />
            <span className="truncate">
              {selectedOption?.label || placeholder}
            </span>
          </span>
        </ComboboxTrigger>

        <ComboboxContent
          showSearch
          searchPlaceholder={searchPlaceholder}
          className="group/combobox-content"
        >
          <ComboboxList>
            {options.map((option) => {
              const OptionIcon = option.icon;

              return (
                <ComboboxItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <OptionIcon className="h-4 w-4 text-gray-500" />
                    <span>{option.label}</span>
                  </div>
                </ComboboxItem>
              );
            })}
            <ComboboxEmpty>No results found.</ComboboxEmpty>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

function MultiFilterCombobox({
  value,
  onChange,
  options,
  widthClassName = "w-[250px]",
}: {
  value: string[];
  onChange: (value: string[]) => void;
  options: SelectOption[];
  widthClassName?: string;
}) {
  const summary =
    value.length === 0
      ? "All Platforms"
      : value.length === 1
        ? value[0]
        : `${value.length} Platforms`;

  const SummaryIcon =
    value.length === 1 ? getPlatformIcon(value[0]) : Globe;

  return (
    <div className={`${widthClassName} shrink-0`}>
      <Combobox
        multiple
        value={value}
        onValueChange={(nextValue: any) =>
          onChange(Array.isArray(nextValue) ? nextValue : [])
        }
      >
        <ComboboxTrigger className={filterTriggerClassName}>
          <span className="flex min-w-0 items-center gap-2">
            <SummaryIcon className="h-4 w-4 shrink-0 text-gray-500" />
            <span className="truncate">{summary}</span>
          </span>
        </ComboboxTrigger>

        <ComboboxContent
          showSearch
          searchPlaceholder="Search platforms..."
          className="group/combobox-content"
        >
          <ComboboxList>
            {options.map((option) => {
              const OptionIcon = option.icon;

              return (
                <ComboboxItem
                  key={option.value}
                  value={option.value}
                  showCheckbox
                >
                  <div className="flex items-center gap-2">
                    <OptionIcon className="h-4 w-4 text-gray-500" />
                    <span>{option.label}</span>
                  </div>
                </ComboboxItem>
              );
            })}
            <ComboboxEmpty>No platforms found.</ComboboxEmpty>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    PAGE                                    */
/* -------------------------------------------------------------------------- */

export default function DiscoverCampaigns() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedBudget, setSelectedBudget] = useState("all");
  const [sortBy, setSortBy] = useState("match");
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 100000]);

  const [campaigns, setCampaigns] = useState<UICampaign[]>([]);
  const [serverTotal, setServerTotal] = useState(0);

  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([
    { value: "all", label: "All Categories", icon: LayoutGrid },
  ]);

  const [locationOptions, setLocationOptions] = useState<SelectOption[]>([
    { value: "all", label: "All Locations", icon: Globe },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let ignore = false;

    const fetchFilterOptions = async () => {
      try {
        const [categoriesRes, countriesRes] = await Promise.all([
          apiCategoryGetAll(),
          apiListCountries(),
        ]);

        if (ignore) return;

        const mappedCategories: SelectOption[] = [
          { value: "all", label: "All Categories", icon: LayoutGrid },
          ...(Array.isArray(categoriesRes) ? categoriesRes : []).map(
            (c: CategoryRow) => ({
              value: String(c?.name || "").trim(),
              label: String(c?.name || "").trim(),
              icon: getCategoryIcon(String(c?.name || "")),
            }),
          ),
        ].filter((item) => item.value);

        const rawCountries: any[] = Array.isArray(countriesRes)
          ? countriesRes
          : Array.isArray((countriesRes as any)?.countries)
            ? (countriesRes as any).countries
            : Array.isArray((countriesRes as any)?.data)
              ? (countriesRes as any).data
              : [];

        const mappedLocations: SelectOption[] = [
          { value: "all", label: "All Locations", icon: Globe },
          ...rawCountries
            .map((country: any) => {
              const name = String(
                country?.name ??
                  country?.countryName ??
                  country?.label ??
                  country?.title ??
                  "",
              ).trim();

              return {
                value: name,
                label: name,
                icon: name.toLowerCase() === "remote" ? Globe : MapPin,
              };
            })
            .filter((item: SelectOption) => !!item.value),
        ];

        setCategoryOptions(mappedCategories);
        setLocationOptions(mappedLocations);
      } catch (err) {
        console.error("Failed to load filter options", err);
      }
    };

    fetchFilterOptions();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError("");

        const { influencerId, token } = getInfluencerAuth();

        if (!influencerId) {
          throw new Error("Influencer ID not found. Please sign in again.");
        }

        const res = await apiGetAllActiveCampaigns(
          {
            influencerId,
            page: 1,
            limit: 100,
            search: debouncedSearch,
          },
          token,
        );

        if (ignore) return;

        const items = Array.isArray((res as any)?.data?.items)
          ? (res as any).data.items
          : Array.isArray((res as any)?.items)
            ? (res as any).items
            : [];

        const mapped = items
          .filter((campaign: any) => {
            const role = campaign?.createdBy?.role;
            const adminRole = campaign?.createdBy?.adminRole;
            return role !== "admin" && adminRole !== "super_admin";
          })
          .map(mapApiCampaignToUi)
          .filter((item: { id: any }) => Boolean(item.id));

        setCampaigns(mapped);
        setServerTotal(
          Number(
            (res as any)?.data?.pagination?.total ??
              (res as any)?.meta?.total ??
              mapped.length,
          ),
        );
      } catch (err) {
        if (ignore) return;
        setCampaigns([]);
        setServerTotal(0);
        setError(getApiErrorMessage(err, "Failed to load campaigns."));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchCampaigns();

    return () => {
      ignore = true;
    };
  }, [debouncedSearch]);

  const platforms = useMemo<SelectOption[]>(() => {
    const flat = campaigns.flatMap((c) => c.platforms || []);
    const unique = [...new Set(flat.filter(Boolean))];

    return unique.map((platform) => ({
      value: platform,
      label: platform,
      icon: getPlatformIcon(platform),
    }));
  }, [campaigns]);

  const maxBudget = useMemo(() => {
    const max = Math.max(...campaigns.map((c) => c.budgetMax || 0), 0);
    return max > 0 ? Math.ceil(max / 1000) * 1000 : 100000;
  }, [campaigns]);

  const budgetOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = [
      { value: "all", label: "Any Budget", icon: ArrowUpDown },
      { value: "0-5000", label: "Up to $5,000", icon: TrendingDown },
    ];

    if (maxBudget > 5000) {
      options.push({
        value: "5000-10000",
        label: "$5,000 - $10,000",
        icon: TrendingUp,
      });
    }

    if (maxBudget > 10000) {
      options.push({
        value: "10000-25000",
        label: "$10,000 - $25,000",
        icon: TrendingUp,
      });
    }

    if (maxBudget > 25000) {
      options.push({
        value: "25000-50000",
        label: "$25,000 - $50,000",
        icon: TrendingUp,
      });
    }

    if (maxBudget > 50000) {
      options.push({
        value: "50000+",
        label: "$50,000+",
        icon: TrendingUp,
      });
    }

    return options;
  }, [maxBudget]);

  useEffect(() => {
    setBudgetRange(resolveBudgetRange(selectedBudget, maxBudget));
  }, [maxBudget, selectedBudget]);

  const filteredCampaigns = useMemo(() => {
    const filtered = campaigns.filter((campaign) => {
      const matchesCategory =
        selectedCategory === "all" || campaign.category === selectedCategory;

      const matchesPlatform =
        selectedPlatform.length === 0 ||
        campaign.platforms.some((platform) => selectedPlatform.includes(platform));

      const matchesLocation =
        selectedLocation === "all" || campaign.location === selectedLocation;

      const matchesBudget =
        campaign.budgetMax >= budgetRange[0] &&
        campaign.budgetMin <= budgetRange[1];

      return (
        matchesCategory &&
        matchesPlatform &&
        matchesLocation &&
        matchesBudget
      );
    });

    switch (sortBy) {
      case "budget-high":
        filtered.sort((a, b) => b.budgetMax - a.budgetMax);
        break;
      case "budget-low":
        filtered.sort((a, b) => a.budgetMin - b.budgetMin);
        break;
      case "ending":
        filtered.sort((a, b) => a.daysLeft - b.daysLeft);
        break;
      default:
        filtered.sort((a, b) => b.match - a.match);
        break;
    }

    return filtered;
  }, [
    campaigns,
    selectedCategory,
    selectedPlatform,
    selectedLocation,
    sortBy,
    budgetRange,
  ]);

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <div className="mx-auto max-w-[1400px] space-y-10 px-6 py-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Discover Campaigns
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Explore brand collaborations matched to your profile.
              </p>
            </div>

            <Badge variant="outline" className="px-3 py-1">
              {filteredCampaigns.length}
              {serverTotal > 0 ? ` of ${serverTotal}` : ""} campaigns found
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <div className="flex min-w-max items-center gap-4 pb-1">
              <div className="relative w-[340px] shrink-0">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search campaigns, brands, or keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 rounded-xl pl-11 pr-10"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>

              <SingleFilterCombobox
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={categoryOptions}
                placeholder="Category"
                searchPlaceholder="Search categories..."
                widthClassName="w-[220px]"
              />

              <MultiFilterCombobox
                value={selectedPlatform}
                onChange={setSelectedPlatform}
                options={platforms}
                widthClassName="w-[240px]"
              />

              <SingleFilterCombobox
                value={selectedBudget}
                onChange={setSelectedBudget}
                options={budgetOptions}
                placeholder="Budget"
                searchPlaceholder="Search budget..."
                widthClassName="w-[210px]"
              />

              <SingleFilterCombobox
                value={selectedLocation}
                onChange={setSelectedLocation}
                options={locationOptions}
                placeholder="Location"
                searchPlaceholder="Search locations..."
                widthClassName="w-[220px]"
              />

              <SingleFilterCombobox
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
                placeholder="Sort by"
                searchPlaceholder="Search sort..."
                widthClassName="w-[220px]"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[320px] animate-pulse rounded-2xl border bg-gray-100"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm font-medium text-red-700">{error}</p>
              <Button
                className="mt-4"
                onClick={() => {
                  setDebouncedSearch((prev) => prev + " ");
                  setTimeout(() => setDebouncedSearch(search.trim()), 0);
                }}
              >
                Retry
              </Button>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="rounded-2xl border bg-white p-10 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                No campaigns found
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Try changing your search or filter selection.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredCampaigns.map((campaign) => {
                const { form, meta } = campaignToPreview(campaign);

                return (
                  <div key={campaign.id}>
                    <ManualPreviewCard
                      key={campaign.id}
                      form={form}
                      meta={meta}
                      onViewClick={() =>
                        router.push(`/influencer/discover-campaigns/${campaign.id}`)
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}