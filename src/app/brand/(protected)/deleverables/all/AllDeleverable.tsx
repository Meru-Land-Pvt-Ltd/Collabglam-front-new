"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  apiGetMilestonesByBrand,
  getApiErrorMessage,
} from "@/app/brand/services/brandApi";

type DeliverableUrl = {
  label?: string;
  url?: string;
};

type DeliverableItem = {
  _id?: string;
  delieverableApprovalId?: string;
  title?: string;
  description?: string;
  comments?: string;
  status?: string;
  createdAt?: string;
  link?: string;
  fileUrl?: string;
  url?: DeliverableUrl[];
  influencerName?: string;
  influencer?: {
    name?: string;
  };
  milestoneTitle?: string;
  milestoneId?: string;
};

type MilestoneItem = {
  _id?: string;
  title?: string;
  name?: string;
  deliverables?: DeliverableItem[];
  deliverable?: DeliverableItem[];
  deliverableApprovals?: DeliverableItem[];
  submissions?: DeliverableItem[];
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
  String(row._id || row.delieverableApprovalId || `deliverable-${index}`);

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

const extractMilestones = (res: any): MilestoneItem[] => {
  if (Array.isArray(res)) return res;

  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.milestones)) return res.milestones;
  if (Array.isArray(res?.data?.milestones)) return res.data.milestones;
  if (Array.isArray(res?.result)) return res.result;

  return [];
};

const flattenDeliverables = (milestones: MilestoneItem[]): DeliverableItem[] => {
  const all: DeliverableItem[] = [];

  milestones.forEach((milestone) => {
    const milestoneTitle = milestone.title || milestone.name || "-";
    const milestoneId = milestone._id || "";

    const rawDeliverables =
      milestone.deliverables ||
      milestone.deliverable ||
      milestone.deliverableApprovals ||
      milestone.submissions ||
      [];

    if (!Array.isArray(rawDeliverables)) return;

    rawDeliverables.forEach((item) => {
      all.push({
        ...item,
        milestoneTitle,
        milestoneId,
      });
    });
  });

  return all;
};

export default function AllDeliverablesPage() {
  const searchParams = useSearchParams();

  const searchBrandId = useMemo(
    () => searchParams.get("brandId") || "",
    [searchParams]
  );

  const statusFilter = useMemo(
    () => (searchParams.get("status") || "").toLowerCase(),
    [searchParams]
  );

  const [rows, setRows] = useState<DeliverableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brandId = useMemo(() => {
    if (searchBrandId) return searchBrandId;

    if (typeof window === "undefined") return "";

    const directBrandId = localStorage.getItem("brandId");
    if (directBrandId) return directBrandId;

    try {
      const brandData = localStorage.getItem("brandData");
      const parsedBrandData = brandData ? JSON.parse(brandData) : null;

      return (
        parsedBrandData?._id ||
        parsedBrandData?.brandId ||
        parsedBrandData?.id ||
        ""
      );
    } catch {
      return "";
    }
  }, [searchBrandId]);

  const fetchAllDeliverables = useCallback(async () => {
    if (!brandId) {
      setError("Missing brandId. Pass ?brandId=xxxx or store brandId in localStorage.");
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiGetMilestonesByBrand({ brandId });
      const milestones = extractMilestones(res);
      const deliverables = flattenDeliverables(milestones);

      const filtered = statusFilter
        ? deliverables.filter(
            (item) => (item.status || "").toLowerCase() === statusFilter
          )
        : deliverables;

      setRows(filtered);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch all deliverables"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [brandId, statusFilter]);

  useEffect(() => {
    fetchAllDeliverables();
  }, [fetchAllDeliverables]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                All Deliverables
              </h1>
              <p className="text-sm text-slate-500">
                View all deliverables across all milestones for this brand.
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
                onClick={fetchAllDeliverables}
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
              Loading all deliverables...
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
                onClick={fetchAllDeliverables}
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
                    <th className="px-5 py-4 text-left font-semibold">Influencer</th>
                    <th className="px-5 py-4 text-left font-semibold">Status</th>
                    <th className="px-5 py-4 text-left font-semibold">Links</th>
                    <th className="px-5 py-4 text-left font-semibold">Created</th>
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