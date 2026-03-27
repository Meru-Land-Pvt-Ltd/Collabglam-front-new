"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";
import {
  apiListDeliverablesByCampaign,
  apiUpdateDeliverableApprovalStatus,
  getApiErrorMessage,
  type DeliverableRow,
} from "@/app/brand/services/brandApi";
// If your folder is actually singular, change to:
// import { ... } from "@/service/brandApi";

type DeliverableUrl = {
  label?: string;
  url?: string;
};

type Deliverable = DeliverableRow & {
  url?: DeliverableUrl[];
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

const getDeliverableId = (row: Deliverable) =>
  String(row._id || row.delieverableApprovalId || "");

const getDeliverableLinks = (row: Deliverable): DeliverableUrl[] => {
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

export default function DeliverablesPage() {
  const searchParams = useSearchParams();

  const campaignId = useMemo(
    () => searchParams.get("campaignId") || "",
    [searchParams]
  );

  const statusFilter = useMemo(
    () => searchParams.get("status") || "",
    [searchParams]
  );

  const [rows, setRows] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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
      const res = await apiListDeliverablesByCampaign({
        campaignId,
        ...(statusFilter ? { status: statusFilter } : {}),
      });

      setRows(Array.isArray(res) ? (res as Deliverable[]) : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch deliverables"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId, statusFilter]);

  const updateDeliverableStatus = useCallback(
    async (
      row: Deliverable,
      status: "approved" | "revision",
      comments?: string
    ) => {
      const deliverableId = getDeliverableId(row);

      if (!deliverableId) {
        Swal.fire({
          icon: "error",
          title: "Missing deliverable id",
          text: "This row does not have a valid deliverable id.",
          showConfirmButton: false,
          timer: 1800,
          timerProgressBar: true,
        });
        return;
      }

      try {
        setUpdatingId(deliverableId);

        await apiUpdateDeliverableApprovalStatus({
          deliverableId,
          status,
          comments,
          approvedRole: "Brand",
        });

        Swal.fire({
          icon: "success",
          title: status === "approved" ? "Approved" : "Revision Sent",
          text:
            status === "approved"
              ? "Deliverable approved successfully."
              : "Revision request sent successfully.",
          showConfirmButton: false,
          timer: 1600,
          timerProgressBar: true,
        });

        await fetchDeliverables();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: getApiErrorMessage(err, "Failed to update deliverable status"),
          showConfirmButton: false,
          timer: 1800,
          timerProgressBar: true,
        });
      } finally {
        setUpdatingId(null);
      }
    },
    [fetchDeliverables]
  );

  const approveDeliverable = useCallback(
    async (row: Deliverable) => {
      await updateDeliverableStatus(row, "approved");
    },
    [updateDeliverableStatus]
  );

  const sendRevision = useCallback(
    async (row: Deliverable) => {
      const result = await Swal.fire({
        title: "Send for revision?",
        input: "textarea",
        inputLabel: "Comments (optional)",
        inputPlaceholder: "Write what needs to be changed...",
        showCancelButton: true,
        confirmButtonText: "Send Revision",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#0f172a",
      });

      if (!result.isConfirmed) return;

      const comments =
        typeof result.value === "string" ? result.value : undefined;

      await updateDeliverableStatus(row, "revision", comments);
    },
    [updateDeliverableStatus]
  );

  useEffect(() => {
    fetchDeliverables();
  }, [fetchDeliverables]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5 md:p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Deliverables
              </h1>
              <p className="text-sm text-slate-500">
                Review submissions, approve completed work, or send items back
                for revision.
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
                    <th className="px-5 py-4 text-left font-semibold">Links</th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Created
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const rowId = getDeliverableId(row);
                    const status = (row.status || "").toLowerCase();
                    const isApproved = status === "approved";
                    const isRevision = status === "revision";
                    const isUpdating = updatingId === rowId;
                    const isLocked = isApproved || isRevision;
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
                            <div className="max-w-[340px] text-slate-600 line-clamp-2">
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

                        <td className="px-5 py-4 align-top">
                          <div className="flex min-w-[190px] flex-col gap-2">
                            <Button
                              className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                              disabled={isLocked || isUpdating || !rowId}
                              onClick={() => approveDeliverable(row)}
                            >
                              {isApproved
                                ? "Approved"
                                : isRevision
                                ? "Approve Locked"
                                : isUpdating
                                ? "Updating..."
                                : "Approve"}
                            </Button>

                            <Button
                              variant="outline"
                              className="border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                              disabled={isLocked || isUpdating || !rowId}
                              onClick={() => sendRevision(row)}
                            >
                              {isApproved
                                ? "Revision Locked"
                                : isRevision
                                ? "Revision Sent"
                                : isUpdating
                                ? "Updating..."
                                : "Request Revision"}
                            </Button>
                          </div>
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