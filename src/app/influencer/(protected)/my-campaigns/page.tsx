"use client";

import React, { useMemo, useState } from "react";
import {
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
  ArrowUpDown,
  X,
} from "lucide-react";

import { InstagramLogoIcon, YoutubeLogoIcon } from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  FloatingSelect,
  FloatingMultiSelect,
  SelectItem,
} from "@/components/ui/select";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ManualPreviewCard } from "@/components/ui/cardPreview";

/* -------------------------------------------------------------------------- */
/*                               DUMMY DATA                                   */
/* -------------------------------------------------------------------------- */

const campaignsData = [
  {
    id: 1,
    title: "Summer Fashion Collection Launch",
    description: "Promote summer fashion collection.",
    budgetMin: 2500,
    budgetMax: 5000,
    daysLeft: 3,
    match: 92,
    category: "Fashion",
    platform: "Instagram",
    location: "Remote",
    status: "applied",
    campaignStatus: "active",
  },
  {
    id: 2,
    title: "Healthy Snack Review Campaign",
    description: "Review organic snacks.",
    budgetMin: 1000,
    budgetMax: 2000,
    daysLeft: 7,
    match: 87,
    category: "Food",
    platform: "YouTube",
    location: "Remote",
    status: "invited",
    campaignStatus: "active",
  },
  {
    id: 3,
    title: "Fitness Challenge Promotion",
    description: "Promote 30-day challenge.",
    budgetMin: 1200,
    budgetMax: 2800,
    daysLeft: 4,
    match: 78,
    category: "Fitness",
    platform: "Instagram",
    location: "Remote",
    status: "contract",
    campaignStatus: "pending",
  },
];

/* -------------------------------------------------------------------------- */
/*                               FILTER OPTIONS                               */
/* -------------------------------------------------------------------------- */

const categories = [
  { value: "all", label: "All Categories", icon: LayoutGrid },
  { value: "Fashion", label: "Fashion", icon: Shirt },
  { value: "Food", label: "Food", icon: Utensils },
  { value: "Fitness", label: "Fitness", icon: Dumbbell },
];

const platforms = [
  { value: "Instagram", label: "Instagram", icon: InstagramLogoIcon },
  { value: "YouTube", label: "YouTube", icon: YoutubeLogoIcon },
  { value: "TikTok", label: "TikTok", icon: Video },
];

const locations = [
  { value: "all", label: "All Locations", icon: Globe },
  { value: "Remote", label: "Remote", icon: Globe },
];

const sortOptions = [
  { value: "match", label: "Best Match", icon: ArrowUpDown },
  { value: "budget-high", label: "Highest Budget", icon: TrendingUp },
  { value: "budget-low", label: "Lowest Budget", icon: TrendingDown },
  { value: "ending", label: "Ending Soon", icon: Clock },
];

const campaignStatusOptions = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "active", label: "Active Campaigns", icon: TrendingUp },
  { value: "pending", label: "Pending Start", icon: Clock },
  { value: "under-review", label: "Under Review", icon: Search },
  { value: "completed", label: "Completed", icon: TrendingUp },
  { value: "cancelled", label: "Cancelled", icon: TrendingDown },
];

const deadlineProximityOptions = [
  { value: "any", label: "Any", icon: LayoutGrid },
  { value: "ending-soon", label: "Ending Soon (1-3 days)", icon: Clock },
  { value: "this-week", label: "This Week (4-7 days)", icon: Clock },
  { value: "next-month", label: "Next Month (8-30 days)", icon: Clock },
  { value: "30plus", label: "30+ Days", icon: TrendingUp },
];

type TabValue =
  | "all"
  | "active"
  | "pending"
  | "under-review"
  | "completed"
  | "cancelled";

const tabs = campaignStatusOptions;

/* -------------------------------------------------------------------------- */
/*                              MAPPER FUNCTION                               */
/* -------------------------------------------------------------------------- */

function campaignToPreview(campaign: any) {
  return {
    form: {
      title: campaign.title,
      description: campaign.description,
      categoryName: campaign.category,
      targetCountry: [campaign.location],
      targetAgeGroups: ["18-24"],
      goals: ["Brand Awareness"],
      campaignBudget: campaign.budgetMax,
    },
    meta: {
      countryMap: {
        [campaign.location]: campaign.location,
      },
      ageMap: { "18-24": "18–24" },
      goalsMap: { "Brand Awareness": "Brand Awareness" },
      campaignBudget: campaign.budgetMax,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                            HELPER FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

function getDeadlineProximityRange(daysLeft: number): string {
  if (daysLeft <= 3) return "ending-soon";
  if (daysLeft <= 7) return "this-week";
  if (daysLeft <= 30) return "next-month";
  return "30plus";
}

/* -------------------------------------------------------------------------- */
/*                                 PAGE                                       */
/* -------------------------------------------------------------------------- */

export default function MyCampaignsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortBy, setSortBy] = useState("match");
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 6000]);
  const [selectedCampaignStatus, setSelectedCampaignStatus] = useState("all");
  const [selectedDeadlineProximity, setSelectedDeadlineProximity] =
    useState("any");

  /* ------------------------------ FILTER LOGIC ----------------------------- */

  const filteredCampaigns = useMemo(() => {
    let filtered = campaignsData.filter((campaign) => {
      const matchesTab =
        activeTab === "all" || campaign.campaignStatus === activeTab;
      const matchesSearch = campaign.title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || campaign.category === selectedCategory;

      const matchesPlatform =
        selectedPlatform.length === 0 ||
        selectedPlatform.includes(campaign.platform);

      const matchesLocation =
        selectedLocation === "all" || campaign.location === selectedLocation;

      const matchesBudget =
        campaign.budgetMin >= budgetRange[0] &&
        campaign.budgetMax <= budgetRange[1];

      const matchesCampaignStatus =
        selectedCampaignStatus === "all" ||
        campaign.campaignStatus === selectedCampaignStatus;

      const deadlineProximity = getDeadlineProximityRange(campaign.daysLeft);
      const matchesDeadlineProximity =
        selectedDeadlineProximity === "any" ||
        deadlineProximity === selectedDeadlineProximity;

      return (
        matchesTab &&
        matchesSearch &&
        matchesCategory &&
        matchesPlatform &&
        matchesLocation &&
        matchesBudget &&
        matchesCampaignStatus &&
        matchesDeadlineProximity
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
    }

    return filtered;
  }, [
    activeTab,
    search,
    selectedCategory,
    selectedPlatform,
    selectedLocation,
    sortBy,
    budgetRange,
    selectedCampaignStatus,
    selectedDeadlineProximity,
  ]);

  /* -------------------------------------------------------------------------- */

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-10">
          {/* HEADER */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Campaigns</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your collaborations and applications.
            </p>
          </div>

          {/* TABS */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full "
          >
            <TabsList className="w-full grid grid-cols-4 !bg-gray-200 rounded-lg gap-3 p-0 h-auto   border-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`capitalize px-6 py-2.5 rounded-lg bg-transparent text-gray-600 font-semibold text-base transition-all flex-1 ${
                    activeTab === tab.value
                      ? "text-black"
                      : "hover:text-gray-900"
                  }`}
                  style={
                    activeTab === tab.value
                      ? { backgroundColor: "#FFBF00" }
                      : {}
                  }
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-10 h-12 rounded-xl"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* FILTER ROW (WITH NEW FILTERS) */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-[220px] shrink-0">
              <FloatingSelect
                label="Category"
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </FloatingSelect>
            </div>

            <div className="w-[240px] shrink-0">
              <FloatingMultiSelect
                label="Platform"
                options={platforms.map((p) => ({
                  value: p.value,
                  label: (
                    <div className="flex items-center gap-2">
                      <p.icon className="h-4 w-4 text-gray-500" />
                      {p.label}
                    </div>
                  ),
                }))}
                value={selectedPlatform}
                onValueChange={setSelectedPlatform}
              />
            </div>

            <div className="w-[320px] shrink-0 rounded-lg border bg-white min-h-[4rem] md:min-h-[4.25rem] xl:min-h-[4.5rem] 2xl:min-h-[5rem] p-4 shadow-sm">
              <div className="flex justify-between mb-2 text-sm">
                <span>Budget</span>
                <span>
                  ${budgetRange[0]} - ${budgetRange[1]}
                </span>
              </div>
              <Slider
                min={0}
                max={6000}
                step={250}
                value={budgetRange}
                onValueChange={(v) => setBudgetRange(v as [number, number])}
                className="
    [&_[data-slot=slider-track]]:bg-gray-200
    [&_[data-slot=slider-range]]:bg-[#FFBF00]
    [&_[data-slot=slider-thumb]]:bg-[#FFBF00]
    [&_[data-slot=slider-thumb]]:border-[#FFBF00]
    [&_[data-slot=slider-thumb]]:hover:ring-[#FFBF00]/30
    [&_[data-slot=slider-thumb]]:focus-visible:ring-[#FFBF00]/40
  "
              />
            </div>

            <div className="w-[220px] shrink-0">
              <FloatingSelect
                label="Location"
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                {locations.map((loc) => {
                  const Icon = loc.icon;
                  return (
                    <SelectItem key={loc.value} value={loc.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        {loc.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </FloatingSelect>
            </div>

            <div className="w-[280px] shrink-0">
              <FloatingSelect
                label="Campaign Status"
                value={selectedCampaignStatus}
                onValueChange={setSelectedCampaignStatus}
              >
                {campaignStatusOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </FloatingSelect>
            </div>

            <div className="w-[280px] shrink-0">
              <FloatingSelect
                label="Deadline Proximity"
                value={selectedDeadlineProximity}
                onValueChange={setSelectedDeadlineProximity}
              >
                {deadlineProximityOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </FloatingSelect>
            </div>

            <div className="w-[220px] shrink-0">
              <FloatingSelect
                label="Sort by"
                value={sortBy}
                onValueChange={setSortBy}
              >
                {sortOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </FloatingSelect>
            </div>
          </div>

          {/* GRID */}
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {filteredCampaigns.map((campaign) => {
              const { form, meta } = campaignToPreview(campaign);
              return (
                <ManualPreviewCard key={campaign.id} form={form} meta={meta} />
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
