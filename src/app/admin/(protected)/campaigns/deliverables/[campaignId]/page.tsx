"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Swal from "sweetalert2";
import api, { get } from "@/lib/api";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { HiOutlineRefresh } from "react-icons/hi";
import {
  CheckCircle2,
  Clock3,
  FileText,
  PencilLine,
  Search,
} from "lucide-react";

type ReviewStatus = "pending" | "approved" | "revision";
type UrlItem = { label: string; url: string };

type DeliverableApi = {
  _id?: string;
  id?: string;
  delieverableApprovalId?: string;
  deliverableApprovalId?: string;
  campaignId?: string;
  influencerId?: string;
  influencerHandle?: string;
  username?: string;
  influencerName?: string;
  milestoneTitle?: string;
  influencer?: {
    influencerId?: string;
    name?: string;
    username?: string;
    fullName?: string;
  };
  title?: string;
  description?: string;
  url?: UrlItem[];
  status?: string;
  comments?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
};

type DeliverableRow = {
  rowKey: string;
  deliverableId: string;
  influencerName: string;
  title: string;
  description: string;
  milestoneTitle: string;
  draftLabel: string;
  linkUrl: string;
  status: ReviewStatus;
  reason: string;
  submittedAt: string;
  updatedAt?: string;
};

const normalizeUrl = (value: string) => {
  const v = (value || "").trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
};

const formatIST = (iso?: string) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const toStatus = (value: any): ReviewStatus => {
  const v = String(value || "pending").toLowerCase();

  if (v === "approved") return "approved";
  if (v === "revision") return "revision";

  if (
    v === "changes" ||
    v === "changes_needed" ||
    v === "changes needed"
  ) {
    return "revision";
  }

  return "pending";
};

const statusClasses = (status: ReviewStatus) => {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "revision") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
};

const statusLabel = (status: ReviewStatus) => {
  if (status === "approved") return "Approved";
  if (status === "revision") return "Revision";
  return "Pending";
};

const makeApprovalId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `APR-${year}-${random}`;
};

const swalBase = {
  confirmButtonColor: "#0f172a",
  cancelButtonColor: "#cbd5e1",
};

function mapApiToRows(items: DeliverableApi[]): DeliverableRow[] {
  const output: DeliverableRow[] = [];

  for (const item of items || []) {
    const deliverableId = String(
      item.delieverableApprovalId ||
        item.deliverableApprovalId ||
        item._id ||
        item.id ||
        ""
    );

    if (!deliverableId) continue;

    const influencerName = String(
      item.influencerName ||
        item.influencer?.fullName ||
        item.influencer?.name ||
        item.username ||
        item.influencerHandle ||
        "—"
    );

    const title = item.title || "Untitled";
    const description = item.description || "";
    const milestoneTitle = item.milestoneTitle || "—";
    const status = toStatus(item.status);
    const reason = item.comments || item.reason || "";
    const submittedAt = item.createdAt || new Date().toISOString();
    const updatedAt = item.updatedAt;
    const urls = Array.isArray(item.url) ? item.url : [];

    if (urls.length === 0) {
      output.push({
        rowKey: `${deliverableId}_0`,
        deliverableId,
        influencerName,
        title,
        description,
        milestoneTitle,
        draftLabel: "Draft",
        linkUrl: "",
        status,
        reason,
        submittedAt,
        updatedAt,
      });
      continue;
    }

    urls.forEach((u, idx) => {
      output.push({
        rowKey: `${deliverableId}_${idx}`,
        deliverableId,
        influencerName,
        title,
        description,
        milestoneTitle,
        draftLabel: u.label || `Draft ${idx + 1}`,
        linkUrl: u.url || "",
        status,
        reason,
        submittedAt,
        updatedAt,
      });
    });
  }

  return output;
}

export default function AdminCampaignDeliverablesPage() {
  const params = useParams<{ campaignId: string }>();
  const campaignId = params?.campaignId;

  const [rows, setRows] = useState<DeliverableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("all");
  const [influencerFilter, setInfluencerFilter] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const showError = async (message: string) => {
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: message,
      ...swalBase,
    });
  };

  const showSuccess = async (message: string) => {
    await Swal.fire({
      icon: "success",
      title: "Success",
      text: message,
      ...swalBase,
    });
  };

  const showInfo = async (message: string) => {
    await Swal.fire({
      icon: "info",
      title: "Info",
      text: message,
      ...swalBase,
    });
  };

  const fetchDeliverables = async () => {
    if (!campaignId) return;

    setLoading(true);

    try {
      const res: any = await get(`/deliverable/campaign/${campaignId}`);

      const arr =
        (Array.isArray(res) && res) ||
        (Array.isArray(res?.data) && res.data) ||
        (Array.isArray(res?.deliverables) && res.deliverables) ||
        (Array.isArray(res?.items) && res.items) ||
        [];

      const mapped = mapApiToRows(arr);
      setRows(mapped);

      if (mapped.length === 0) {
        await showInfo("No deliverables found for this campaign yet.");
      }
    } catch (error: any) {
      setRows([]);
      await showError(
        error?.response?.data?.message ||
          "Could not fetch deliverables from API."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const uniqueInfluencers = useMemo(() => {
    const names = new Set<string>();
    rows.forEach((r) => names.add(r.influencerName));
    return Array.from(names).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    let list = [...rows];

    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (influencerFilter !== "all") {
      list = list.filter((r) => r.influencerName === influencerFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const haystack =
          `${r.influencerName} ${r.title} ${r.description} ${r.milestoneTitle} ${r.status} ${r.draftLabel}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    list.sort((a, b) => {
      const ta = new Date(a.submittedAt).getTime();
      const tb = new Date(b.submittedAt).getTime();
      return sort === "newest" ? tb - ta : ta - tb;
    });

    return list;
  }, [rows, statusFilter, influencerFilter, search, sort]);

  const stats = useMemo(() => {
    const total = rows.length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const revision = rows.filter((r) => r.status === "revision").length;

    return { total, approved, pending, revision };
  }, [rows]);

  const submitApprovalStatus = async ({
    deliverableId,
    status,
    comments = "",
  }: {
    deliverableId: string;
    status: "approved" | "revision";
    comments?: string;
  }) => {
    setSavingId(deliverableId);

    try {
      Swal.fire({
        title: "Updating...",
        text: "Please wait while we update the deliverable.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await api.post(`/deliverable/${deliverableId}/approval-status`, {
        status,
        comments,
        approvedRole: "Admin",
        approvalId: makeApprovalId(),
      });

      const now = new Date().toISOString();

      setRows((prev) =>
        prev.map((r) =>
          r.deliverableId === deliverableId
            ? {
                ...r,
                status,
                reason: comments,
                updatedAt: now,
              }
            : r
        )
      );

      Swal.close();

      await showSuccess(
        status === "approved"
          ? "Deliverable approved successfully."
          : "Revision request sent successfully."
      );

      return true;
    } catch (error: any) {
      Swal.close();

      await showError(
        error?.response?.data?.message ||
          "Failed to update deliverable status."
      );
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const handleApprove = async (deliverableId: string) => {
    const result = await Swal.fire({
      icon: "question",
      title: "Approve deliverable?",
      text: "This will mark the deliverable as approved.",
      showCancelButton: true,
      confirmButtonText: "Approve",
      cancelButtonText: "Cancel",
      ...swalBase,
    });

    if (!result.isConfirmed) return;

    await submitApprovalStatus({
      deliverableId,
      status: "approved",
      comments: "",
    });
  };

  const handleRevision = async (deliverableId: string) => {
    const result = await Swal.fire({
      title: "Send for Revision",
      input: "textarea",
      inputLabel: "Revision reason",
      inputPlaceholder: "Write what needs to be changed...",
      inputAttributes: {
        "aria-label": "Revision reason",
      },
      showCancelButton: true,
      confirmButtonText: "Send Revision",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      ...swalBase,
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "Please enter the revision reason.";
        }
        return undefined;
      },
    });

    if (!result.isConfirmed) return;

    await submitApprovalStatus({
      deliverableId,
      status: "revision",
      comments: String(result.value || "").trim(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 py-5 md:px-6 xl:px-8">
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-7">
              <div className="space-y-2">
                <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  Admin Panel
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Campaign Deliverables
                </h1>
                <p className="max-w-2xl text-sm text-slate-500 md:text-[15px]">
                  Review submitted deliverables, approve completed work, or send
                  items back for revision.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href="/admin/campaigns">
                  <Button
                    variant="outline"
                    className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    Back
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  onClick={fetchDeliverables}
                  disabled={loading}
                  className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  <HiOutlineRefresh
                    className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  {loading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    {stats.total}
                  </h3>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3">
                  <FileText className="h-5 w-5 text-slate-700" />
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pending</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    {stats.pending}
                  </h3>
                </div>
                <div className="rounded-2xl bg-amber-50 p-3">
                  <Clock3 className="h-5 w-5 text-amber-700" />
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Approved</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    {stats.approved}
                  </h3>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border border-sky-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Revision</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    {stats.revision}
                  </h3>
                </div>
                <div className="rounded-2xl bg-sky-50 p-3">
                  <PencilLine className="h-5 w-5 text-sky-700" />
                </div>
              </div>
            </Card>
          </div>

          <Card className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search influencer, title, milestone, draft..."
                  className="h-11 rounded-xl border-slate-200 pl-10"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as any)}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 sm:w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="revision">Revision</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={influencerFilter}
                  onValueChange={(v) => setInfluencerFilter(v)}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 sm:w-[220px]">
                    <SelectValue placeholder="All Influencers" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Influencers</SelectItem>
                    {uniqueInfluencers.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 sm:w-[170px]">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Submitted Deliverables
                  </h2>
                  <p className="text-sm text-slate-500">
                    Full-width review table with cleaner approval flow.
                  </p>
                </div>
                <div className="text-sm text-slate-500">
                  {filteredRows.length} item{filteredRows.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto border-l border-t border-slate-200">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="h-14 border-r border-b border-slate-200 bg-slate-50 px-5 text-slate-700">
                      Deliverable
                    </TableHead>
                    <TableHead className="h-14 border-r border-b border-slate-200 bg-slate-50 px-5 text-slate-700">
                      Milestone
                    </TableHead>
                    <TableHead className="h-14 border-r border-b border-slate-200 bg-slate-50 px-5 text-slate-700">
                      Influencer
                    </TableHead>
                    <TableHead className="h-14 border-r border-b border-slate-200 bg-slate-50 px-5 text-slate-700">
                      Draft
                    </TableHead>
                    <TableHead className="h-14 border-r border-b border-slate-200 bg-slate-50 px-5 text-slate-700">
                      Status
                    </TableHead>
                    <TableHead className="h-14 border-r border-b border-slate-200 bg-slate-50 px-5 text-slate-700">
                      Submitted
                    </TableHead>
                    <TableHead className="h-14 border-r border-b border-slate-200 bg-slate-50 px-5 text-slate-700">
                      Updated
                    </TableHead>
                    <TableHead className="h-14 border-b border-slate-200 bg-slate-50 px-5 text-center text-slate-700">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="border-r border-b border-slate-200 px-5 py-16 text-center text-sm text-slate-500"
                      >
                        Loading deliverables...
                      </TableCell>
                    </TableRow>
                  ) : filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="border-r border-b border-slate-200 px-5 py-16 text-center text-sm text-slate-500"
                      >
                        No deliverables match your current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => {
                      const isUpdating = savingId === row.deliverableId;
                      const isPending = row.status === "pending";
                      const isLocked = !isPending || isUpdating;

                      const approveLabel = isUpdating
                        ? "Updating..."
                        : row.status === "approved"
                        ? "Approved"
                        : row.status === "revision"
                        ? "Locked"
                        : "Approve";

                      const revisionLabel = isUpdating
                        ? "Updating..."
                        : row.status === "revision"
                        ? "Revision Sent"
                        : row.status === "approved"
                        ? "Locked"
                        : "Request Revision";

                      return (
                        <TableRow
                          key={row.rowKey}
                          className="transition-colors hover:bg-slate-50/70"
                        >
                          <TableCell className="border-r border-b border-slate-200 px-5 py-5 align-top">
                            <div className="max-w-[340px] space-y-1">
                              <div className="font-semibold text-slate-900">
                                {row.title}
                              </div>
                              <div className="line-clamp-2 text-sm text-slate-600">
                                {row.description || "—"}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="border-r border-b border-slate-200 px-5 py-5 align-top text-sm text-slate-700">
                            <div className="max-w-[220px] line-clamp-2">
                              {row.milestoneTitle}
                            </div>
                          </TableCell>

                          <TableCell className="border-r border-b border-slate-200 px-5 py-5 align-top text-sm font-medium text-slate-800">
                            {row.influencerName}
                          </TableCell>

                          <TableCell className="border-r border-b border-slate-200 px-5 py-5 align-top">
                            {row.linkUrl ? (
                              <a
                                href={normalizeUrl(row.linkUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex max-w-[220px] truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 underline underline-offset-4 hover:bg-slate-100"
                              >
                                {row.draftLabel || "Open Draft"}
                              </a>
                            ) : (
                              <span className="text-sm text-slate-400">—</span>
                            )}
                          </TableCell>

                          <TableCell className="border-r border-b border-slate-200 px-5 py-5 align-top">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                                row.status
                              )}`}
                            >
                              {statusLabel(row.status)}
                            </span>
                          </TableCell>

                          <TableCell className="border-r border-b border-slate-200 px-5 py-5 align-top text-sm text-slate-600">
                            {formatIST(row.submittedAt)}
                          </TableCell>

                          <TableCell className="border-r border-b border-slate-200 px-5 py-5 align-top text-sm text-slate-600">
                            {formatIST(row.updatedAt)}
                          </TableCell>

                          <TableCell className="border-b border-slate-200 px-5 py-5 align-top">
                            <div className="flex min-w-[220px] flex-col gap-2">
                              <Button
                                className="h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={isLocked}
                                onClick={() => handleApprove(row.deliverableId)}
                              >
                                {approveLabel}
                              </Button>

                              <Button
                                variant="outline"
                                className="h-10 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={isLocked}
                                onClick={() => handleRevision(row.deliverableId)}
                              >
                                {revisionLabel}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}