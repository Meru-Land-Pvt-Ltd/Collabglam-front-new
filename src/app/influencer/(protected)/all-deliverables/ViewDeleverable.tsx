"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  apiGetDeliverablesByInfluencer,
  getApiErrorMessage,
} from "@/app/influencer/services/influencerApi";

type DeliverableUrl = {
  label?: string;
  url?: string;
};

type DeliverableItem = {
  _id?: string;
  delieverableApprovalId?: string;
  deliverableApprovalId?: string;
  title?: string;
  description?: string;
  comments?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  link?: string;
  fileUrl?: string;
  url?: DeliverableUrl[];
  milestoneTitle?: string;
  milestoneId?: string;
  campaignId?: string;
  influencerId?: string;
  influencerName?: string;
  influencer?: {
    _id?: string;
    name?: string;
  };
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);

  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const badgeClass = (status?: string) => {
  const s = (status || "").toLowerCase();

  if (s === "approved" || s === "paid") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (s === "pending") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (s === "revision") {
    return "border border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-700";
};

const getDeliverableId = (row: DeliverableItem, index: number) =>
  String(
    row._id ||
      row.deliverableApprovalId ||
      row.delieverableApprovalId ||
      `deliverable-${index}`
  );

const getDeliverableLinks = (row: DeliverableItem): DeliverableUrl[] => {
  const arr = Array.isArray(row.url) ? row.url.filter((x) => x?.url) : [];

  if (arr.length) return arr;

  const fallback: DeliverableUrl[] = [];

  if (typeof row.link === "string" && row.link.trim()) {
    fallback.push({ label: "Open link", url: row.link });
  }

  if (typeof row.fileUrl === "string" && row.fileUrl.trim()) {
    fallback.push({ label: "Open file", url: row.fileUrl });
  }

  return fallback;
};

const extractDeliverables = (res: any): DeliverableItem[] => {
  const possibleArrays = [
    res,
    res?.data,
    res?.result,
    res?.results,
    res?.items,
    res?.rows,
    res?.docs,
    res?.deliverables,
    res?.data?.data,
    res?.data?.result,
    res?.data?.results,
    res?.data?.items,
    res?.data?.rows,
    res?.data?.docs,
    res?.data?.deliverables,
  ];

  for (const value of possibleArrays) {
    if (Array.isArray(value)) return value;
  }

  return [];
};

export default function ViewDeleverablePage() {
  const searchParams = useSearchParams();

  const influencerId = useMemo(
    () => String(searchParams.get("influencerId") || "").trim(),
    [searchParams]
  );

  const campaignId = useMemo(
    () => String(searchParams.get("campaignId") || "").trim(),
    [searchParams]
  );

  const statusFilter = useMemo(
    () => String(searchParams.get("status") || "").trim().toLowerCase(),
    [searchParams]
  );

  const search = useMemo(
    () => String(searchParams.get("search") || "").trim(),
    [searchParams]
  );

  const page = useMemo(() => {
    const value = Number(searchParams.get("page") || 1);
    return Number.isFinite(value) && value > 0 ? value : 1;
  }, [searchParams]);

  const limit = useMemo(() => {
    const value = Number(searchParams.get("limit") || 20);
    return Number.isFinite(value) && value > 0 ? value : 20;
  }, [searchParams]);

  const [rows, setRows] = useState<DeliverableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliverables = useCallback(async () => {
    if (!influencerId) {
      setError("Missing influencerId in URL. Example: ?influencerId=xxxx");
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiGetDeliverablesByInfluencer({
        influencerId,
        status: statusFilter || undefined,
        campaignId: campaignId || undefined,
        search: search || undefined,
        page,
        limit,
      });

      let deliverables = extractDeliverables(res);

      // Safe client-side fallback in case backend ignores any optional filter
      if (statusFilter) {
        deliverables = deliverables.filter(
          (item) => (item.status || "").toLowerCase() === statusFilter
        );
      }

      if (search) {
        const q = search.toLowerCase();
        deliverables = deliverables.filter((item) => {
          const text = [
            item.title,
            item.description,
            item.comments,
            item.milestoneTitle,
            item.influencerName,
            item.influencer?.name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes(q);
        });
      }

      setRows(deliverables);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch deliverables"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [influencerId, campaignId, statusFilter, search, page, limit]);

  useEffect(() => {
    fetchDeliverables();
  }, [fetchDeliverables]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                View Deliverables
              </h1>
              <p className="text-sm text-slate-500">
                See all deliverables submitted by this influencer.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {influencerId && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  Influencer: {influencerId}
                </span>
              )}

              {campaignId && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  Campaign: {campaignId}
                </span>
              )}

              {statusFilter && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  Filter: {statusFilter}
                </span>
              )}

              {search && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  Search: {search}
                </span>
              )}

              <Button
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={fetchDeliverables}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </div>

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Deliverables</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {rows.length}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Pending</p>
              <p className="mt-2 text-2xl font-bold text-amber-600">
                {rows.filter((x) => (x.status || "").toLowerCase() === "pending").length}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Approved</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {rows.filter((x) => (x.status || "").toLowerCase() === "approved").length}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Revision</p>
              <p className="mt-2 text-2xl font-bold text-sky-600">
                {rows.filter((x) => (x.status || "").toLowerCase() === "revision").length}
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-700">
              Loading deliverables...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <div className="mt-4">
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={fetchDeliverables}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">No deliverables found.</p>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">
                      Deliverable
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Milestone
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Influencer
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Status
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Links
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Created
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => {
                    const rowId = getDeliverableId(row, index);
                    const links = getDeliverableLinks(row);

                    return (
                      <tr
                        key={rowId}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900">
                              {row.title || "-"}
                            </div>

                            <div className="max-w-[340px] line-clamp-2 text-slate-600">
                              {row.description || "-"}
                            </div>

                            {row.comments ? (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                <span className="font-semibold text-slate-700">
                                  Comment:
                                </span>{" "}
                                {row.comments}
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top text-slate-700">
                          <div className="max-w-[220px] line-clamp-2">
                            {row.milestoneTitle || "-"}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top text-slate-700">
                          {row.influencerName || row.influencer?.name || "-"}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(
                              row.status
                            )}`}
                          >
                            {row.status || "-"}
                          </span>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex max-w-[220px] flex-col gap-2">
                            {links.length === 0 ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              links.map((link, idx) => (
                                <a
                                  key={`${rowId}-link-${idx}`}
                                  href={link.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="truncate text-sm font-medium text-slate-900 underline underline-offset-4 hover:text-slate-600"
                                >
                                  {link.label || `Open link ${idx + 1}`}
                                </a>
                              ))
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top text-slate-600">
                          {formatDateTime(row.createdAt || row.updatedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}