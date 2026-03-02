"use client";

import React, { useState, useEffect, FormEvent, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { get, post } from "@/lib/api";
import { Badge } from "@/components/ui/badge";


interface Campaign {
  _id: string;
  brandId: string;
  brandName: string;
  productOrServiceName: string;
  description: string;
  timeline: { startDate: string; endDate: string };
  isActive: number;
  budget: number;
  applicantCount: number;
  hasApplied: number;
  campaignsId: string;
  isInvited: number;
}

interface ActiveResponse {
  meta: { total: number; page: number; limit: number; totalPages: number };
  campaigns: Campaign[];
}

interface Influencer {
  name: string;
  category: string;
  audienceSize: string;
  country: string;
  platform: string;
}

const normaliseInfluencer = (raw: any): Influencer => ({
  name: raw.name,
  category: raw.categoryName?.join(", ") ?? "—",
  audienceSize: raw.audienceRange ?? "—",
  country: raw.county ?? "—",
  platform: raw.platformName,
});

export default function HireInfluencerPage() {
  const router = useRouter();
  const params = useSearchParams();
  const influencerId = params.get("id");

  const [brandId, setBrandId] = useState<string | null>(null);
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [loadingInf, setLoadingInf] = useState(true);
  const [infError, setInfError] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCamp, setLoadingCamp] = useState(true);
  const [campError, setCampError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = campaigns.find((c) => c.campaignsId === selectedId) ?? null;

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // pull brandId from localStorage
  useEffect(() => {
    setBrandId(window.localStorage.getItem("brandId"));
  }, []);

  // load influencer details
  useEffect(() => {
    if (!influencerId) {
      setInfError("No influencer specified.");
      setLoadingInf(false);
      return;
    }
    get("/influencer/getbyid", { id: influencerId })
      .then((raw) => setInfluencer(normaliseInfluencer(raw)))
      .catch((_) => setInfError("Failed to load influencer."))
      .finally(() => setLoadingInf(false));
  }, [influencerId]);

  // load active campaigns + invitations
  const fetchCampaigns = useCallback(async () => {
    if (!brandId) return;
    setLoadingCamp(true);
    setCampError(null);
    try {
      const resp = await post<ActiveResponse>("/invitation/active", {
        brandId,
        influencerId,
      });
      // only keep active ones
      setCampaigns(
        resp.campaigns.filter((c) => c.isActive === 1)
      );
    } catch (err: any) {
      console.error(err);
      setCampError(err.message || "Failed to load campaigns.");
    } finally {
      setLoadingCamp(false);
    }
  }, [brandId, influencerId]);

  useEffect(() => {
    fetchCampaigns();
  }, [brandId, fetchCampaigns]);

  // handle invite submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedId) {
      setFormError("Please select a campaign.");
      return;
    }
    if (selected?.isInvited === 1) return;

    setSubmitting(true);
    try {
      await post("/invitation/create", {
        influencerId,
        campaignId: selectedId,
        brandId,
      });
      await fetchCampaigns(); // refresh
    } catch {
      setFormError("Error submitting hire. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInf || loadingCamp) {
    return <div className="flex items-center justify-center h-screen">Loading…</div>;
  }
  if (infError || campError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600">{infError || campError}</p>
      </div>
    );
  }
  if (!influencer) return null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-gradient-to-r from-[#FF8C00] via-[#FF5E7E] to-[#D12E53] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center space-x-4 p-6">
          <div>
            <CardTitle className="text-xl font-semibold text-white">
              Hire {influencer.name}
            </CardTitle>
            <p className="text-md text-white/80">
              {influencer.category} • {influencer.platform}
            </p>
          </div>
        </div>
        <hr className="border-white/30" />

        {/* Content */}
        <div className="bg-white p-6 space-y-6">
          {/* Influencer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Audience Size</Label>
              <p className="mt-1 text-base">{influencer.audienceSize}</p>
            </div>
            <div>
              <Label>Location</Label>
              <p className="mt-1 text-base">{influencer.country}</p>
            </div>
          </div>

          {/* Campaign Selector */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="campaign-select">Select Campaign</Label>
              <Select
                onValueChange={(v) => setSelectedId(v)}
                value={selectedId || undefined}
              >
                <SelectTrigger id="campaign-select" className="w-full mt-1 border">
                  <SelectValue placeholder="— Choose a campaign —" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectGroup>
                    {campaigns.map((c) => (
                      <SelectItem
                        key={c.campaignsId}
                        value={c.campaignsId}
                        className="flex items-center justify-between"
                      >
                        <span>{c.productOrServiceName}</span>
                        {c.isInvited === 1 && (
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-700"
                          >
                            Already Invited
                          </Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Details */}
            {selected && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Campaign</Label>
                  <p className="text-lg font-medium">
                    {selected.productOrServiceName}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <p className="text-base text-muted-foreground">
                    {selected.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Budget (USD)</Label>
                    <p className="mt-1">${selected.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Timeline</Label>
                    <p className="mt-1">
                      {new Date(selected.timeline.startDate).toLocaleDateString()} →{" "}
                      {new Date(selected.timeline.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Already Invited Banner */}
                {selected.isInvited === 1 && (
                  <div className="px-4 py-4 bg-green-100 text-green-800 rounded">
                    Invitation Sent Successfully
                  </div>
                )}

                {formError && (
                  <p className="text-sm text-red-600">{formError}</p>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    onClick={() => router.back()}
                    disabled={submitting}
                    className="bg-gray-100 text-black hover:bg-gray-200"
                  >
                    Back
                  </Button>
                  <div className="flex space-x-4">
                    {selected.isInvited !== 1 && (
                      <Button
                        onClick={() =>
                          router.push(
                            `/brand/add-edit-campaign?id=${selected.campaignsId}`
                          )
                        }
                        disabled={submitting}
                        className="bg-gradient-to-r from-[#FFA135] to-[#FF7236] text-white"
                      >
                        Edit Campaign
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={submitting || selected.isInvited === 1}
                      className="bg-green-500 text-white disabled:opacity-50"
                    >
                      {selected.isInvited === 1
                        ? "Already Invited"
                        : submitting
                        ? "Sending..."
                        : "Send Invitation"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
