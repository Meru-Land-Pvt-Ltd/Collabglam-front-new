"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiGetMilestonesByCampaign } from "../../services/brandApi";

interface MilestoneEntry {
  milestoneHistoryId: string;
  influencerId: string;
  campaignId: string;
  brandId?: string;
  milestoneTitle: string;
  amount: number;
  milestoneDescription?: string;
  dueDate?: string;
}

const MilestoneHistoryPage: React.FC = () => {
  const searchParams = useSearchParams();

  const campaignId = searchParams.get("campaignId") || "";
  const influencerId = searchParams.get("influencerId") || "";
  const brandIdFromQuery = searchParams.get("brandId") || "";

  const [brandId, setBrandId] = useState<string>("");
  const [milestones, setMilestones] = useState<MilestoneEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (brandIdFromQuery) {
      setBrandId(brandIdFromQuery);
      return;
    }

    if (typeof window !== "undefined") {
      const storedBrandId = localStorage.getItem("brandId") || "";
      setBrandId(storedBrandId);
    }
  }, [brandIdFromQuery]);

  const fetchMilestones = useCallback(async () => {
    if (!brandId || !campaignId) return;

    setLoading(true);
    setError("");

    try {
      const res = await apiGetMilestonesByCampaign({
        brandId,
        campaignId,
      });

      let list = (res?.milestones || []) as MilestoneEntry[];

      if (influencerId) {
        list = list.filter(
          (item) => String(item.influencerId) === String(influencerId)
        );
      }

      list.sort((a, b) => {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return bTime - aTime;
      });

      setMilestones(list);
    } catch (err: any) {
      setError(err?.message || "Failed to load milestones.");
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  }, [brandId, campaignId, influencerId]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const formatDate = (date?: string) => {
    if (!date) return "—";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (value?: number) => {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const filteredMilestones = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return milestones;

    return milestones.filter((item) => {
      return (
        item.milestoneTitle?.toLowerCase().includes(q) ||
        item.milestoneDescription?.toLowerCase().includes(q) ||
        item.influencerId?.toLowerCase().includes(q)
      );
    });
  }, [milestones, search]);

  const totalAmount = useMemo(() => {
    return filteredMilestones.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
  }, [filteredMilestones]);

  const latestDueDate = useMemo(() => {
    const validDates = filteredMilestones
      .map((item) => item.dueDate)
      .filter(Boolean) as string[];

    if (!validDates.length) return "—";

    const latest = validDates.sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    )[0];

    return formatDate(latest);
  }, [filteredMilestones]);

  if (!brandId) {
    return (
      <section className="min-h-[70vh] bg-slate-50 px-4 py-8 md:px-6">
        <div className="mx-auto max-w-7xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Milestone History
          </h2>
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            Missing <code>brandId</code> in URL or localStorage.
          </p>
        </div>
      </section>
    );
  }

  if (!campaignId) {
    return (
      <section className="min-h-[70vh] bg-slate-50 px-4 py-8 md:px-6">
        <div className="mx-auto max-w-7xl rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Milestone History
          </h2>
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Missing <code>campaignId</code> in URL query params.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-orange-300">
                Campaign Milestones
              </p>
              <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                Milestone Payment History
              </h1>
              <p className="mt-2 text-sm text-slate-300 md:text-base">
                Clean tabular view for campaign milestone payouts and history.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  Campaign ID
                </p>
                <p className="mt-1 truncate text-sm font-semibold">{campaignId}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  Influencer Filter
                </p>
                <p className="mt-1 truncate text-sm font-semibold">
                  {influencerId || "All influencers"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  Brand ID
                </p>
                <p className="mt-1 truncate text-sm font-semibold">{brandId}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Records</p>
            <h3 className="mt-2 text-3xl font-bold text-slate-900">
              {filteredMilestones.length}
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Amount</p>
            <h3 className="mt-2 text-3xl font-bold text-slate-900">
              {formatCurrency(totalAmount)}
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Latest Due Date</p>
            <h3 className="mt-2 text-3xl font-bold text-slate-900">
              {latestDueDate}
            </h3>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Milestone Records
              </h2>
              <p className="text-sm text-slate-500">
                Search milestone title, description, or influencer ID.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              <input
                type="text"
                placeholder="Search milestones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-900 md:min-w-[280px]"
              />

              <button
                onClick={fetchMilestones}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
              Loading milestones...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          ) : filteredMilestones.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-base font-medium text-slate-700">
                No milestones found.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing the search value or verify campaign data.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        Milestone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        Influencer ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredMilestones.map((item, index) => (
                      <tr
                        key={item.milestoneHistoryId || `${item.milestoneTitle}-${index}`}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-4 text-sm font-medium text-slate-700">
                          {index + 1}
                        </td>

                        <td className="px-4 py-4">
                          <div className="max-w-[220px]">
                            <p className="font-semibold text-slate-900">
                              {item.milestoneTitle || "Untitled milestone"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.milestoneHistoryId}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          <div className="max-w-[320px] whitespace-normal break-words">
                            {item.milestoneDescription || "—"}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                            {item.influencerId || "—"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          {formatDate(item.dueDate)}
                        </td>

                        <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">
                          {formatCurrency(item.amount)}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Paid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MilestoneHistoryPage;