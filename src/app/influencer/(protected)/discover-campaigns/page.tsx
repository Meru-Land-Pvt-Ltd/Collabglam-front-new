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

import { Button } from "@/components/ui/buttonComp";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  FloatingSelect,
  FloatingMultiSelect,
  SelectItem,
} from "@/components/ui/selectComp";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ManualPreviewCard } from "@/components/ui/cardPreview";
import Image from "next/image";

/* -------------------------------------------------------------------------- */
/*                                  DATA                                      */
/* -------------------------------------------------------------------------- */

const campaignsData = [
  {
    id: 1,
    title: "Summer Fashion Collection Launch",
    description:
      "Showcase a new summer fashion line. Looking for fashion influencers with strong visual content creation skills.",
    budgetMin: 2500,
    budgetMax: 5000,
    daysLeft: 3,
    match: 92,
    category: "Fashion",
    platform: "Instagram",
    location: "Remote",
    applications: 12,
    brand: "Fashion Nova",
    brandLogo: "/api/placeholder/40/40",
    image:
      "https://images.unsplash.com/photo-1641745900309-75ceed0153e1?q=80&w=1314&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 2,
    title: "Healthy Snack Review Campaign",
    description:
      "Create review content for organic snacks. Perfect for health & wellness creators.",
    budgetMin: 1000,
    budgetMax: 2000,
    daysLeft: 7,
    match: 87,
    category: "Food",
    platform: "YouTube",
    location: "Remote",
    applications: 8,
    brand: "HealthyBite",
    brandLogo: "/api/placeholder/40/40",
    image:
      "https://images.unsplash.com/photo-1641745900309-75ceed0153e1?q=80&w=1314&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 3,
    title: "Artisan Coffee Experience",
    description:
      "Promote a premium coffee shop. Create cozy, aesthetic content.",
    budgetMin: 750,
    budgetMax: 1500,
    daysLeft: 5,
    match: 90,
    category: "Food",
    platform: "TikTok",
    location: "New York",
    applications: 15,
    brand: "Brew Haven",
    brandLogo: "/api/placeholder/40/40",
    image:
      "https://images.unsplash.com/photo-1641745900309-75ceed0153e1?q=80&w=1314&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 4,
    title: "Fitness Challenge Promotion",
    description:
      "Promote a 30-day fitness challenge. Need motivational content creators.",
    budgetMin: 1200,
    budgetMax: 2800,
    daysLeft: 4,
    match: 78,
    category: "Fitness",
    platform: "Multiple",
    location: "Remote",
    applications: 6,
    brand: "FitLife",
    brandLogo: "/api/placeholder/40/40",
    image:
      "https://images.unsplash.com/photo-1641745900309-75ceed0153e1?q=80&w=1314&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

/* -------------------------------------------------------------------------- */
/*                              FILTER OPTIONS                                */
/* -------------------------------------------------------------------------- */

const categories = [
  { value: "all", label: "All Categories", icon: LayoutGrid },
  { value: "Fashion", label: "Fashion", icon: Shirt },
  { value: "Food", label: "Food", icon: Utensils },
  { value: "Fitness", label: "Fitness", icon: Dumbbell },
];

const platforms = [
  // { value: "all", label: "All Locations", icon:  },
  { value: "Instagram", label: "Instagram", icon: InstagramLogoIcon },
  { value: "YouTube", label: "YouTube", icon: YoutubeLogoIcon },
  { value: "TikTok", label: "TikTok", icon: Video },
];

const locations = [
  { value: "all", label: "All Locations", icon: Globe },
  { value: "Remote", label: "Remote", icon: Globe },
  { value: "New York", label: "New York", icon: MapPin },
];

const sortOptions = [
  { value: "match", label: "Best Match", icon: ArrowUpDown },
  { value: "budget-high", label: "Highest Budget", icon: TrendingUp },
  { value: "budget-low", label: "Lowest Budget", icon: TrendingDown },
  { value: "ending", label: "Ending Soon", icon: Clock },
];

/* -------------------------------------------------------------------------- */
/*                                  PAGE                                      */
/* -------------------------------------------------------------------------- */
function campaignToPreview(campaign: any) {
  return {
    form: {
      title: campaign.title,
      description: campaign.description,
      categoryName: campaign.category,
      targetCountry: [campaign.location],
      targetAgeGroups: ["18-24"], // fallback/mock if not available
      goals: ["Brand Awareness"], // fallback/mock
      campaignBudget: campaign.budgetMax,
    },
    meta: {
      countryMap: {
        [campaign.location]: campaign.location,
      },
      ageMap: {
        "18-24": "18–24",
      },
      goalsMap: {
        "Brand Awareness": "Brand Awareness",
      },
      campaignBudget: campaign.budgetMax,
    },
  };
}
export default function DiscoverCampaigns() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortBy, setSortBy] = useState("match");
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 6000]);
  const [applied, setApplied] = useState<number[]>([]);
  const [saved, setSaved] = useState<number[]>([]);

  /* ------------------------------ FILTER LOGIC ----------------------------- */

  const filteredCampaigns = useMemo(() => {
    let filtered = campaignsData.filter((campaign) => {
      const matchesSearch =
        campaign.title.toLowerCase().includes(search.toLowerCase()) ||
        campaign.description.toLowerCase().includes(search.toLowerCase()) ||
        campaign.brand.toLowerCase().includes(search.toLowerCase());

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

      return (
        matchesSearch &&
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
    }

    return filtered;
  }, [
    search,
    selectedCategory,
    selectedPlatform,
    selectedLocation,
    sortBy,
    budgetRange,
  ]);

  /* ------------------------------ ACTIONS ---------------------------------- */

  const handleApply = (id: number) => {
    if (!applied.includes(id)) setApplied((prev) => [...prev, id]);
  };

  const handleSave = (id: number) => {
    setSaved((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  /* -------------------------------------------------------------------------- */

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-10">
          {/* HEADER */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Discover Campaigns
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Explore brand collaborations matched to your profile.
              </p>
            </div>

            <Badge variant="outline" className="px-3 py-1">
              {filteredCampaigns.length} campaigns found
            </Badge>
          </div>

          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search campaigns, brands, or keywords..."
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

          {/* FILTER ROW */}
          <div className="flex flex-wrap items-center  gap-4">
            {/* CATEGORY */}
            <div className="w-[220px] shrink-0">
              <FloatingSelect
                label="Category"
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                searchable
                size="small"
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

            {/* PLATFORM */}
            <div className="w-[240px] shrink-0">
              <FloatingMultiSelect
                label="Platform"
                options={platforms.map((p) => ({
                  value: p.value,
                  label: p.label, // plain string satisfies MultiOption
                }))}
                value={selectedPlatform}
                onValueChange={setSelectedPlatform}
                searchable
                includeAll={false}
              />
            </div>

            {/* BUDGET SLIDER */}
            {/* BUDGET SLIDER */}
            <div className="w-[320px] shrink-0 rounded-lg border bg-white min-h-[4rem] md:min-h-[4.25rem] xl:min-h-[4.5rem] 2xl:min-h-[5rem] p-4 shadow-sm flex flex-col justify-center">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Budget</span>
                <span className="text-sm font-medium text-gray-700">
                  ${budgetRange[0]} - ${budgetRange[1]}
                </span>
              </div>

              <Slider
                min={0}
                max={6000}
                step={250}
                value={budgetRange}
                onValueChange={(value) =>
                  setBudgetRange(value as [number, number])
                }
              />
            </div>

            {/* LOCATION */}
            <div className="w-[220px] shrink-0">
              <FloatingSelect
                label="Location"
                value={selectedLocation}
                onValueChange={setSelectedLocation}
                searchable
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

            {/* SORT */}
            <div className="w-[220px] shrink-0">
              <FloatingSelect
                label="Sort by"
                value={sortBy}
                onValueChange={setSortBy}
                searchable={false}
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

          {/* CAMPAIGN GRID */}
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {filteredCampaigns.map((campaign) => {
              const { form, meta } = campaignToPreview(campaign);

              return (
                <div key={campaign.id}>
                  <ManualPreviewCard
                    key={campaign.id}
                    form={form}
                    meta={meta}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
