"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  apiListDeliverablesByCampaign,
  getApiErrorMessage,
  type DeliverableItem,
} from "@/app/influencer/services/influencerApi";

type DeliverableUrl = {
  label: string;
  url: string;
};

type Deliverable = DeliverableItem;

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

type RawDeliverableUrl = string | { label?: string; url?: string };

const getDeliverableLinks = (row: Deliverable): DeliverableUrl[] => {
  const urls: RawDeliverableUrl[] = Array.isArray(row.url) ? row.url : [];

  const normalized = urls
    .map((item, index): DeliverableUrl | null => {
      if (typeof item === "string" && item.trim()) {
        return {
          label: `Open link ${index + 1}`,
          url: item.trim(),
        };
      }

      if (
        item &&
        typeof item === "object" &&
        typeof item.url === "string" &&
        item.url.trim()
      ) {
        return {
          label:
            typeof item.label === "string" && item.label.trim()
              ? item.label.trim()
              : `Open link ${index + 1}`,
          url: item.url.trim(),
        };
      }

      return null;
    })
    .filter((item): item is DeliverableUrl => Boolean(item));

  if (normalized.length) return normalized;

  const fallback: DeliverableUrl[] = [];

  if (typeof (row as any).link === "string" && (row as any).link.trim()) {
    fallback.push({ label: "Open link", url: (row as any).link.trim() });
  }

  if (typeof (row as any).fileUrl === "string" && (row as any).fileUrl.trim()) {
    fallback.push({ label: "Open file", url: (row as any).fileUrl.trim() });
  }

  return fallback;
};

const getRowKey = (row: Deliverable, index: number) => {
  return (
    row._id ||
    [
      row.campaignId,
      row.influencerId,
      row.milestoneHistoryId,
      row.title,
      row.createdAt,
      index,
    ]
      .filter(Boolean)
      .join("-")
  );
};

export default function DeliverablesPage() {
  const searchParams = useSearchParams();

  const campaignId = searchParams.get("campaignId") || "";
  const statusFilter = searchParams.get("status") || "";

  const [rows, setRows] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliverables = useCallback(async () => {
    if (!campaignId) {
      setError("Missing campaignId in URL. Example: ?campaignId=xxxx");
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiListDeliverablesByCampaign(campaignId, {
        ...(statusFilter ? { status: statusFilter } : {}),
      });

      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch deliverables"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId, statusFilter]);

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
                Deliverables
              </h1>
              <p className="text-sm text-slate-500">
                View submitted deliverables and their current status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {statusFilter && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  Filter: {statusFilter}
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
                    <th className="px-5 py-4 text-left font-semibold">Deliverable</th>
                    <th className="px-5 py-4 text-left font-semibold">Milestone</th>
                    <th className="px-5 py-4 text-left font-semibold">Status</th>
                    <th className="px-5 py-4 text-left font-semibold">Links</th>
                    <th className="px-5 py-4 text-left font-semibold">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => {
                    const rowKey = getRowKey(row, index);
                    const links = getDeliverableLinks(row);

                    return (
                      <tr
                        key={rowKey}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900">
                              {row.title || "-"}
                            </div>

                            <div className="max-w-[340px] text-slate-600 line-clamp-2">
                              {row.description || "-"}
                            </div>

                            {row.influencerName ? (
                              <div className="text-xs text-slate-500">
                                Influencer: {row.influencerName}
                              </div>
                            ) : null}

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
                                  key={`${rowKey}-link-${idx}`}
                                  href={link.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="truncate text-sm font-medium text-slate-900 underline underline-offset-4 hover:text-slate-600"
                                >
                                  {link.label}
                                </a>
                              ))
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top text-slate-600">
                          {formatDateTime(row.createdAt)}
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