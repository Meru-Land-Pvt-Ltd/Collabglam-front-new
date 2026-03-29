"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  apiGetDeliverablesByBrand,
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

type DeliverablesResponseShape = {
  data?: DeliverableItem[] | { deliverables?: DeliverableItem[]; items?: DeliverableItem[] };
  deliverables?: DeliverableItem[];
  items?: DeliverableItem[];
  result?: DeliverableItem[];
  total?: number;
  count?: number;
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
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

const extractDeliverables = (res: DeliverablesResponseShape): DeliverableItem[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.deliverables)) return res.deliverables;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.deliverables)) return res.data.deliverables;
  if (Array.isArray(res?.data?.items)) return res.data.items;

  return [];
};

const extractTotal = (res: DeliverablesResponseShape, fallbackLength: number) => {
  return (
    res?.pagination?.total ??
    res?.total ??
    res?.count ??
    fallbackLength
  );
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

  const campaignId = useMemo(
    () => searchParams.get("campaignId") || "",
    [searchParams]
  );

  const search = useMemo(
    () => searchParams.get("search") || "",
    [searchParams]
  );

  const [rows, setRows] = useState<DeliverableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

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

  const totalPages = useMemo(() => {
    const pages = Math.ceil(total / limit);
    return pages > 0 ? pages : 1;
  }, [total, limit]);

  const fetchAllDeliverables = useCallback(async () => {
    if (!brandId) {
      setError("Missing brandId. Pass ?brandId=xxxx or store brandId in localStorage.");
      setRows([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiGetDeliverablesByBrand({
        brandId,
        status: statusFilter || undefined,
        campaignId: campaignId || undefined,
        search: search || undefined,
        page,
        limit,
      });

      const deliverables = extractDeliverables(res as DeliverablesResponseShape);

      setRows(deliverables);
      setTotal(extractTotal(res as DeliverablesResponseShape, deliverables.length));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch deliverables"));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [brandId, statusFilter, campaignId, search, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [brandId, statusFilter, campaignId, search]);

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
                View all deliverables for this brand.
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
                {total}
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
          <>
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

            <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={loading || page <= 1}
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={loading || page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}