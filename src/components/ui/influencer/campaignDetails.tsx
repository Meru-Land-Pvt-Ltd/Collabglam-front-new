"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Clock,
  UsersThree,
  Tag,
  CurrencyDollar,
  BookmarkSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/buttonComp";
import { Badge } from "@/components/ui/badge";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface Campaign {
  title: string;
  brand: string;
  description: string;
  image: string;
  budget: number;
  daysLeft: number;
  match: number;
  category: string;
  targetAge: string;
  location: string;
  goals: string[];
}

/* -------------------------------------------------------------------------- */
/*                               API FETCHER                                  */
/* -------------------------------------------------------------------------- */

function computeDaysLeft(endAt?: string): number {
  if (!endAt) return 0;
  const end = new Date(endAt);
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

async function fetchCampaign(id: string): Promise<Campaign> {
  const res = await fetch(`http://192.168.1.34:8000/campaign/id?id=${id}`);
  if (!res.ok) throw new Error(`Failed to fetch campaign (${res.status})`);
  const data = await res.json();

  // Normalise — adjust field names to match your actual API response shape
  const c = data?.campaign ?? data;

  const images: any[] = Array.isArray(c.productImages)
    ? c.productImages
    : Array.isArray(c.images)
    ? c.images
    : [];

  const coverImage =
    images[0]?.url ||
    images[0]?.dataUrl ||
    c.coverImage ||
    c.image ||
    "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1400";

  const goals: string[] = Array.isArray(c.goals)
    ? c.goals
    : Array.isArray(c.campaignGoals)
    ? c.campaignGoals
    : [];

  const targetAge =
    (Array.isArray(c.targetAgeGroups) && c.targetAgeGroups.length > 0
      ? c.targetAgeGroups.join(", ")
      : null) ??
    c.targetAge ??
    "All ages";

  return {
    title: c.campaignTitle || c.title || c.productOrServiceName || "Untitled Campaign",
    brand: c.brandName || c.brand || "Unknown Brand",
    description: c.description || "",
    image: coverImage,
    budget: c.campaignBudget || c.budget || c.influencerBudget || 0,
    daysLeft: computeDaysLeft(c.endAt || c.timeline?.endDate),
    match: c.match ?? 0,
    category: c.campaignCategory || c.category || "",
    targetAge,
    location: c.targetCountry || c.location || "Remote",
    goals,
  };
}

/* -------------------------------------------------------------------------- */
/*                              PAGE COMPONENT                                */
/* -------------------------------------------------------------------------- */

const CampaignDetails = ({ id }: { id: string }) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchCampaign(id)
      .then((data) => { if (!cancelled) setCampaign(data); })
      .catch((e) => { if (!cancelled) setError(e.message || "Something went wrong."); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#FFBF00]" />
          <p className="text-sm">Loading campaign…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3 text-gray-500">
          <p className="text-lg font-medium text-gray-700">Could not load campaign</p>
          <p className="text-sm">{error ?? "Campaign not found."}</p>
        </div>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">

        {/* HERO IMAGE */}
        <div className="relative w-full h-[380px] rounded-3xl overflow-hidden shadow-sm">
          <img
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
          {campaign.match > 0 && (
            <div className="absolute top-6 right-6">
              <Badge className="bg-black text-white text-sm px-4 py-1">
                {campaign.match}% Match
              </Badge>
            </div>
          )}
        </div>

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{campaign.title}</h1>
            <p className="text-gray-500 mt-2 text-sm">by {campaign.brand}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button className="flex items-center gap-2">
              <BookmarkSimple size={18} />
              Save
            </Button>
            <Button className="!bg-[#FBBF00] hover:bg-yellow-500 text-black">
              Apply Now
            </Button>
          </div>
        </div>

        {/* META INFO */}
        <div className="grid md:grid-cols-4 gap-6 bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <CurrencyDollar size={20} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Budget</p>
              <p className="font-semibold text-gray-900">
                ${campaign.budget.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock size={20} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Time Left</p>
              <p className="font-semibold text-gray-900">
                {campaign.daysLeft > 0 ? `${campaign.daysLeft} days` : "Ended"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UsersThree size={20} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Target Age</p>
              <p className="font-semibold text-gray-900">{campaign.targetAge}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-semibold text-gray-900">{campaign.location}</p>
            </div>
          </div>
        </div>

        {/* DESCRIPTION + GOALS */}
        <div className="bg-white p-8 rounded-2xl shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Campaign Overview</h2>
            <p className="text-gray-600 mt-3 leading-7">{campaign.description}</p>
          </div>

          {campaign.goals.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Goals</h3>
              <div className="flex flex-wrap gap-3">
                {campaign.goals.map((goal, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-2 px-4 py-1">
                    <Tag size={14} />
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {campaign.category && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Category</h3>
              <Badge className="px-4 py-1">{campaign.category}</Badge>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CampaignDetails;