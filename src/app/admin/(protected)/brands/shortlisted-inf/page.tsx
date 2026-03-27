//shortlisted-inf/page.tsx

"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { get, post } from "@/lib/api";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { FloatingLabelInput } from "@/components/common/FloatingLabelInput";
import AdminMilestoneHistoryCard from "@/components/common/AdminMIlestoneHistoryCard";
import {
  HiChevronLeft,
  HiChevronRight,
  HiSearch,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from "react-icons/hi";

const PAGE_SIZE = 10;
const SHORTLISTED_ENDPOINT =
  "/campaign-invitation/accepted-admin-created-influencers";

const toast = (opts: {
  icon: "success" | "error";
  title: string;
  text?: string;
}) =>
  Swal.fire({
    showConfirmButton: false,
    timer: 1200,
    timerProgressBar: true,
    background: "white",
    ...opts,
  });

interface ShortlistedRow {
  rowId: string;
  deliverableId?: string;
  influencerId: string;
  name: string;
  country: string;
  platform: string;
  status: string;
  createdAt?: string | null;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : "—";

/**
 * Supports BOTH shapes:
 * 1) NEW: { success, total, influencers: [{ influencerId, name, country, platforms: [], createdAt }] }
 * 2) OLD: invites list with { influencerId, influencer: {}, platform, status, createdAt }
 */
const normalizeAcceptedAdminInfluencers = (res: any): ShortlistedRow[] => {
  const body = res?.data && typeof res.data === "object" ? res.data : res;
  const list = Array.isArray(body?.influencers) ? body.influencers : [];

  const map = new Map<string, ShortlistedRow>();

  for (const inf of list) {
    const influencerId = String(
      inf?.influencerId || inf?._id || inf?.id || ""
    ).trim();

    if (!influencerId || map.has(influencerId)) continue;

    const platform = Array.isArray(inf?.platforms)
      ? inf.platforms.join(", ")
      : String(inf?.platform || "—");

    map.set(influencerId, {
      rowId: String(inf?.invitationId || influencerId),
      deliverableId: inf?.invitationId || undefined,
      influencerId,
      name: String(
        inf?.influencerName ||
          inf?.name ||
          inf?.fullName ||
          inf?.username ||
          inf?.handle ||
          "—"
      ),
      country: String(inf?.country || inf?.influencerCountry || "—"),
      platform: platform || "—",
      status: String(inf?.status || "accepted"),
      createdAt: inf?.createdAt || null,
    });
  }

  return Array.from(map.values());
};

const LoadingSkeleton = ({ rows }: { rows: number }) => (
  <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-14 w-full rounded-xl" />
    ))}
  </div>
);

const ErrorMessage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600 shadow-sm">
    {children}
  </div>
);

export default function AdminShortlistedInfluencersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const campaignId = searchParams.get("id") || searchParams.get("campaignId");
  const brandId = searchParams.get("brandId");

  const [rowsData, setRowsData] = useState<ShortlistedRow[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [milestoneCountByInfluencer, setMilestoneCountByInfluencer] = useState<
    Record<string, number>
  >({});

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [selectedInf, setSelectedInf] = useState<ShortlistedRow | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    amount: "",
    description: "",
  });
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);

  const [campaignBudget, setCampaignBudget] = useState<number | null>(null);
  const [campaignMilestoneTotal, setCampaignMilestoneTotal] =
    useState<number>(0);
  const [isBudgetLocked, setIsBudgetLocked] = useState<boolean>(false);

  const amountNum = useMemo(
    () => Number(milestoneForm.amount) || 0,
    [milestoneForm.amount]
  );

  const remainingBudget = useMemo(() => {
    if (campaignBudget == null) return null;
    return Math.max(0, campaignBudget - campaignMilestoneTotal);
  }, [campaignBudget, campaignMilestoneTotal]);

  const toggleExpand = (id: string) =>
    setExpandedRow((cur) => (cur === id ? null : id));

  const refreshBudgetAndTotals = useCallback(async () => {
    if (!campaignId) return;

    try {
      const [campaignResp, milestoneResp] = await Promise.all([
        get<any>(`/campaign/id?id=${campaignId}`),
        post<any>("milestone/byCampaign", { campaignId }),
      ]);

      const rawBudget = Number(campaignResp?.budget);
      const budget = !Number.isNaN(rawBudget) ? rawBudget : null;
      setCampaignBudget(budget);

      const list = Array.isArray(milestoneResp?.milestones)
        ? milestoneResp.milestones
        : [];

      let sum = 0;
      const counts: Record<string, number> = {};

      list.forEach((m: any) => {
        if (brandId && m.brandId !== brandId) return;

        sum += Number(m.amount) || 0;

        const infId =
          m.influencerId ||
          m.influencerID ||
          m.influencer_id ||
          m.influencer?.influencerId ||
          m.influencer?._id;

        if (infId) {
          const key = String(infId);
          counts[key] = (counts[key] || 0) + 1;
        }
      });

      setCampaignMilestoneTotal(sum);
      setMilestoneCountByInfluencer(counts);
      setIsBudgetLocked(budget != null && sum >= budget);
    } catch (e) {
      console.error("Failed to refresh campaign budget / milestones", e);
    }
  }, [campaignId, brandId]);

  useEffect(() => {
    if (!campaignId) {
      setError("Campaign id missing.");
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const qs = new URLSearchParams();
        qs.set("campaignId", campaignId);
        qs.set("page", "1");
        qs.set("limit", "200");
        if (brandId) qs.set("brandId", brandId);

        const resp = await get<any>(`${SHORTLISTED_ENDPOINT}?${qs.toString()}`);
        const normalized = normalizeAcceptedAdminInfluencers(resp);

        const term = searchTerm.trim().toLowerCase();
        const filtered = !term
          ? normalized
          : normalized.filter((r) =>
              [r.name, r.influencerId, r.country, r.platform, r.status, r.createdAt || ""]
                .join(" ")
                .toLowerCase()
                .includes(term)
            );

        setRowsData(filtered);

        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        setMeta({ total, page: 1, limit: PAGE_SIZE, totalPages });
        setPage(1);
      } catch (e: any) {
        console.error(e);
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to load shortlisted influencers."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [campaignId, brandId, searchTerm]);

  useEffect(() => {
    if (!brandId) return;
    refreshBudgetAndTotals();
  }, [refreshBudgetAndTotals, brandId]);

  const handleAddMilestone = (inf: ShortlistedRow) => {
    setSelectedInf(inf);
    setMilestoneForm({ title: "", amount: "", description: "" });
    setShowMilestoneModal(true);
  };

  const handleSaveMilestone = async () => {
    if (!selectedInf?.influencerId || !campaignId) return;

    if (!brandId) {
      toast({
        icon: "error",
        title: "brandId missing",
        text: "brandId is required in URL for milestones.",
      });
      return;
    }

    if (!milestoneForm.title.trim()) {
      toast({ icon: "error", title: "Enter a milestone title" });
      return;
    }

    if (Number.isNaN(amountNum) || amountNum <= 0) {
      toast({
        icon: "error",
        title: "Invalid amount",
        text: "Enter a valid positive amount.",
      });
      return;
    }

    if (campaignBudget != null && remainingBudget !== null) {
      if (remainingBudget <= 0) {
        setIsBudgetLocked(true);
        toast({ icon: "error", title: "Budget reached" });
        return;
      }
      if (amountNum > remainingBudget) {
        toast({
          icon: "error",
          title: "Amount exceeds remaining budget",
          text: `Remaining budget is ${remainingBudget.toLocaleString()}.`,
        });
        return;
      }
    }

    try {
      setIsSavingMilestone(true);

      await post("milestone/create", {
        influencerId: selectedInf.influencerId,
        campaignId,
        milestoneTitle: milestoneForm.title,
        amount: amountNum,
        milestoneDescription: milestoneForm.description,
        brandId,
        paymentProvider: "admin",
      });

      toast({ icon: "success", title: "Milestone added" });

      setShowMilestoneModal(false);
      setSelectedInf(null);
      setMilestoneForm({ title: "", amount: "", description: "" });
      setPage(1);

      await refreshBudgetAndTotals();
    } catch (err: any) {
      console.error(err);
      toast({
        icon: "error",
        title: "Error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create milestone.",
      });
    } finally {
      setIsSavingMilestone(false);
    }
  };

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return rowsData.slice(start, end);
  }, [rowsData, page]);

  const tableRows = useMemo(() => {
    return paginatedRows.flatMap((inf) => {
      const rowKey = inf.rowId;

      const milestoneCount =
        milestoneCountByInfluencer[String(inf.influencerId)] || 0;
      const hasMilestones = milestoneCount > 0;

      const baseRow = (
        <TableRow
          key={rowKey}
          className="group border-b border-gray-200 bg-white transition-all duration-200 hover:bg-gray-50"
        >
          <TableCell className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-sm font-semibold text-black shadow-sm">
                {inf.name?.charAt(0)?.toUpperCase() || "I"}
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-black">{inf.name}</p>
              </div>
            </div>
          </TableCell>

          <TableCell className="py-4 text-center font-medium text-black">
            {inf.country}
          </TableCell>

          <TableCell className="py-4 text-center">
            <span className="inline-flex rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-semibold text-black">
              {inf.platform}
            </span>
          </TableCell>

          <TableCell className="py-4 text-center">
            <span className="inline-flex rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold capitalize text-black">
              {inf.status}
            </span>
          </TableCell>

          <TableCell className="py-4 text-center font-medium text-black">
            {formatDate(inf.createdAt || null)}
          </TableCell>

          <TableCell className="py-4 text-center">
            {hasMilestones ? (
              <span className="inline-flex rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-semibold text-black">
                Working
              </span>
            ) : (
              <span className="inline-flex rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-black">
                Awaiting Milestone
              </span>
            )}
          </TableCell>

          <TableCell className="py-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-black bg-white px-4 text-black hover:bg-gray-100 disabled:opacity-50"
                onClick={() => handleAddMilestone(inf)}
                disabled={!inf.influencerId || isBudgetLocked || !brandId}
              >
                Add Milestone
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-black bg-white px-4 text-black hover:bg-gray-100 disabled:opacity-50"
                onClick={() => toggleExpand(rowKey)}
                disabled={!hasMilestones || !brandId}
              >
                View Milestone
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="rounded-full text-black hover:bg-gray-100"
                onClick={() => toggleExpand(rowKey)}
                disabled={!inf.influencerId || !brandId}
                title="Toggle history"
              >
                {expandedRow === rowKey ? (
                  <HiOutlineChevronUp className="h-4 w-4 text-black" />
                ) : (
                  <HiOutlineChevronDown className="h-4 w-4 text-black" />
                )}
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );

      const detailsRow =
        expandedRow === rowKey && inf.influencerId ? (
          <TableRow key={`${rowKey}-details`} className="bg-gray-50">
            <TableCell colSpan={7} className="p-3">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <AdminMilestoneHistoryCard
                  brandId={brandId as string}
                  campaignId={campaignId as string}
                  influencerId={inf.influencerId}
                />
              </div>
            </TableCell>
          </TableRow>
        ) : null;

      return [baseRow, detailsRow].filter(Boolean) as any[];
    });
  }, [
    paginatedRows,
    expandedRow,
    campaignId,
    isBudgetLocked,
    milestoneCountByInfluencer,
    brandId,
  ]);

  const totalPages = meta.totalPages;

  return (
    <div className="min-h-screen bg-gray-50 p-4 text-black md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-black">
              Shortlisted Influencers
            </h1>

            <p className="text-sm text-black">
              Manage shortlisted influencers and milestone activity.
            </p>

            {campaignBudget != null && (
              <p className="text-sm text-black">
                Budget:{" "}
                <strong>
                  {campaignBudget.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                  })}
                </strong>{" "}
                · Allocated:{" "}
                <strong>
                  {campaignMilestoneTotal.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                  })}
                </strong>{" "}
                · Remaining:{" "}
                <strong>
                  {remainingBudget != null
                    ? remainingBudget.toLocaleString(undefined, {
                        style: "currency",
                        currency: "USD",
                      })
                    : "—"}
                </strong>
              </p>
            )}

            {isBudgetLocked && (
              <p className="text-sm font-semibold text-red-600">
                Budget reached. You cannot create more milestones.
              </p>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="self-start rounded-full border-black bg-white px-5 text-black hover:bg-gray-100"
            onClick={() => router.back()}
          >
            Back
          </Button>
        </header>

        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="w-full">
            <div className="relative w-full sm:max-w-md">
              <HiSearch
                className="absolute inset-y-0 left-3 my-auto text-black"
                size={20}
              />
              <input
                type="text"
                placeholder="Search influencers..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-black shadow-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-gray-200"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton rows={PAGE_SIZE} />
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-black">
                Influencer List
              </h2>
              <p className="text-sm text-black">
                Manage shortlisted influencers and milestones
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[980px] text-black">
                <TableHeader className="bg-gray-100">
                  <TableRow className="border-b border-gray-200 hover:bg-gray-100">
                    <TableHead className="py-4 text-sm font-bold text-black">
                      Influencer
                    </TableHead>
                    <TableHead className="py-4 text-center text-sm font-bold text-black">
                      Country
                    </TableHead>
                    <TableHead className="py-4 text-center text-sm font-bold text-black">
                      Platform
                    </TableHead>
                    <TableHead className="py-4 text-center text-sm font-bold text-black">
                      Invitation Status
                    </TableHead>
                    <TableHead className="py-4 text-center text-sm font-bold text-black">
                      Created
                    </TableHead>
                    <TableHead className="py-4 text-center text-sm font-bold text-black">
                      Milestones
                    </TableHead>
                    <TableHead className="py-4 text-center text-sm font-bold text-black">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {tableRows.length > 0 ? (
                    tableRows
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-black"
                      >
                        No influencers match criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 md:justify-end">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-gray-300 bg-white text-black hover:bg-gray-100"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              <HiChevronLeft className="text-black" />
            </Button>

            <span className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-black shadow-sm">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>

            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-gray-300 bg-white text-black hover:bg-gray-100"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            >
              <HiChevronRight className="text-black" />
            </Button>
          </div>
        )}

        {showMilestoneModal && selectedInf && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-start justify-between border-b border-gray-200 bg-gray-100 px-6 py-4">
                <div className="text-black">
                  <p className="text-xs uppercase tracking-wide text-black/70">
                    Create milestone
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-black">
                    {selectedInf.name}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="ml-3 text-lg leading-none text-black/80 hover:text-black"
                  aria-label="Close"
                  disabled={isSavingMilestone}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5 px-6 py-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <FloatingLabelInput
                    id="milestoneTitle"
                    label="Milestone Title"
                    value={milestoneForm.title}
                    onChange={(e: any) =>
                      setMilestoneForm((f) => ({
                        ...f,
                        title: e.target.value,
                      }))
                    }
                  />

                  <FloatingLabelInput
                    id="milestoneAmount"
                    label="Amount"
                    value={milestoneForm.amount}
                    onChange={(e: any) =>
                      setMilestoneForm((f) => ({
                        ...f,
                        amount: e.target.value,
                      }))
                    }
                    type="number"
                  />
                </div>

                <FloatingLabelInput
                  id="milestoneDesc"
                  label="Milestone Description"
                  value={milestoneForm.description}
                  onChange={(e: any) =>
                    setMilestoneForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-3">
                <Button
                  variant="outline"
                  onClick={() => setShowMilestoneModal(false)}
                  className="border-gray-300 text-black hover:bg-white"
                  disabled={isSavingMilestone}
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleSaveMilestone}
                  disabled={
                    !selectedInf?.influencerId ||
                    isSavingMilestone ||
                    isBudgetLocked
                  }
                  className="bg-black text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {isSavingMilestone ? "Saving..." : "Add Milestone"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}