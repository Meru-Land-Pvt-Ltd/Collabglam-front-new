"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  apiGetMilestonesByInfluencerAndCampaign,
  apiReleaseMilestone,
} from "../../services/brandApi";

interface MilestoneEntry {
  _id?: string;
  milestoneHistoryId: string;
  milestoneId?: string;
  influencerId: string;
  influencerName?: string;
  campaignId: string;
  campaignTitle?: string;
  brandId?: string;
  milestoneTitle: string;
  milestoneDescription?: string;
  released?: boolean;
  releasedAt?: string | null;
  payoutStatus?: string;
  paidAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const MilestoneHistoryPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const campaignId = searchParams.get("campaignId") || "";
  const influencerId = searchParams.get("influencerId") || "";
  const brandIdFromQuery = searchParams.get("brandId") || "";

  const [brandId, setBrandId] = useState<string>("");
  const [milestones, setMilestones] = useState<MilestoneEntry[]>([]);
  const [campaignTitle, setCampaignTitle] = useState<string>("");
  const [influencerName, setInfluencerName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [releasingId, setReleasingId] = useState<string>("");

  useEffect(() => {
    if (brandIdFromQuery) {
      setBrandId(brandIdFromQuery);
      return;
    }

    const storedBrandId = localStorage.getItem("brandId") || "";
    setBrandId(storedBrandId);
  }, [brandIdFromQuery]);

  const fetchMilestones = useCallback(async () => {
    if (!brandId || !campaignId || !influencerId) return;

    setLoading(true);
    setError("");

    try {
      const res = await apiGetMilestonesByInfluencerAndCampaign({
        brandId,
        campaignId,
        influencerId,
      });

      const list: MilestoneEntry[] = (res?.milestones || []).map((item) => ({
        ...item,
        _id: item._id || item.milestoneHistoryId,
      }));

      setMilestones(list);
      setCampaignTitle(list[0]?.campaignTitle || "");
      setInfluencerName(list[0]?.influencerName || "");
    } catch (err: any) {
      setError(err?.message || "Failed to load milestones");
      setMilestones([]);
      setCampaignTitle("");
      setInfluencerName("");
    } finally {
      setLoading(false);
    }
  }, [brandId, campaignId, influencerId]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const formatDate = (date?: string | null) => {
    if (!date) return "—";

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "initiated":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleViewDeliverable = (item: MilestoneEntry) => {
    router.push(
      `/brand/deleverables?campaignId=${item.campaignId}&brandId=${
        item.brandId || brandId
      }&influencerId=${item.influencerId}&milestoneId=${item.milestoneId || ""}&milestoneHistoryId=${item.milestoneHistoryId}`
    );
  };

  const handleAllDeliverables = () => {
    router.push(`/brand/deleverables/all?brandId=${encodeURIComponent(brandId)}`);
  };

  const handleReleaseMilestone = async (item: MilestoneEntry) => {
    if (item.released) return;

    try {
      setReleasingId(item.milestoneHistoryId);
      setError("");

      await apiReleaseMilestone({
        milestoneId: item.milestoneId || "",
        milestoneHistoryId: item.milestoneHistoryId,
      });

      await fetchMilestones();
    } catch (err: any) {
      setError(err?.message || "Failed to release milestone");
    } finally {
      setReleasingId("");
    }
  };

  if (!brandId) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Missing <code>brandId</code> in query params or localStorage.
        </div>
      </div>
    );
  }

  if (!campaignId) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
          Missing <code>campaignId</code> in query params.
        </div>
      </div>
    );
  }

  if (!influencerId) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
          Missing <code>influencerId</code> in query params.
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-white p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Manage Milestone for {influencerName || "Influencer"} - {campaignTitle || "Campaign"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and release milestones for this influencer and campaign.
            </p>
          </div>

          <button
            onClick={handleAllDeliverables}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            All Deliverables
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-gray-500">Campaign</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {campaignTitle || "Campaign"}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-gray-500">Influencer</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {influencerName || "Influencer"}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-gray-500">Total Milestones</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {milestones.length}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading milestones...</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : milestones.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No milestones found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Payout Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Created At
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {milestones.map((item) => {
                    const isReleasing = releasingId === item.milestoneHistoryId;

                    return (
                      <tr
                        key={item._id || item.milestoneHistoryId}
                        className="border-b last:border-b-0"
                      >
                        <td className="px-4 py-4 text-gray-900">
                          <div className="font-medium">{item.milestoneTitle}</div>
                        </td>

                        <td className="px-4 py-4 text-gray-700">
                          {item.milestoneDescription || "—"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                              item.payoutStatus
                            )}`}
                          >
                            {item.payoutStatus || "—"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-gray-700">
                          {formatDate(item.createdAt)}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2 min-w-[150px]">
                            <button
                              onClick={() => handleViewDeliverable(item)}
                              className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              View Deliverable
                            </button>

                            <button
                              onClick={() => handleReleaseMilestone(item)}
                              disabled={
                                item.released ||
                                isReleasing ||
                                !item.milestoneId ||
                                !item.milestoneHistoryId
                              }
                              className={`rounded-md px-3 py-2 text-xs font-medium text-white ${
                                item.released
                                  ? "cursor-not-allowed bg-gray-400"
                                  : isReleasing
                                  ? "cursor-wait bg-green-400"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
                              {item.released
                                ? "Payment Released"
                                : isReleasing
                                ? "Releasing..."
                                : "Payment Release"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MilestoneHistoryPage;