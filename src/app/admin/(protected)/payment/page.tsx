"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiSearch,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";
import Swal from "sweetalert2";

type PayoutStatus = "initiated" | "paid";

interface AdminPayout {
  milestoneHistoryId: string;
  milestoneId: string;
  milestoneTitle?: string | null;
  milestoneDescription?: string | null;
  brandId: string;
  brandName?: string | null;
  influencerId: string;
  influencerName?: string | null;
  influencerEmail?: string | null;
  campaignId: string;
  campaignTitle?: string | null;
  amount: number;
  payoutStatus: PayoutStatus;
  createdAt: string;
  releasedAt?: string | null;
  paidAt?: string | null;
}

interface PayoutListResponse {
  message: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: AdminPayout[];
}

const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const formatCurrency = (amt: number) =>
  amt.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

const statusBadge = (status?: PayoutStatus) => {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        <HiCheckCircle className="h-4 w-4" />
        Paid
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
      <HiExclamationCircle className="h-4 w-4" />
      Initiated
    </span>
  );
};

export default function AdminPaymentPage() {
  const router = useRouter();

  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [limit] = useState<number>(10);

  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | PayoutStatus>("all");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchPayouts = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        page,
        limit,
        status: statusFilter,
        search: debouncedSearch,
      };

      const data = await post<PayoutListResponse>("/admin/milestone/payout", payload);

      setPayouts(data.items || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err?.message || "Failed to load payouts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [page, statusFilter, debouncedSearch]);

  const handleMarkPaid = async (row: AdminPayout) => {
    const confirm = await Swal.fire({
      icon: "question",
      title: "Mark as paid?",
      text: `Mark payout as paid for ${row.influencerName || row.influencerId}?`,
      showCancelButton: true,
      confirmButtonText: "Yes, mark as paid",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#22c55e",
    });

    if (!confirm.isConfirmed) return;

    try {
      await post("/admin/milestone/update", {
        milestoneId: row.milestoneId,
        milestoneHistoryId: row.milestoneHistoryId,
        payoutStatus: "paid",
      });

      Swal.fire({
        icon: "success",
        title: "Marked as paid",
        showConfirmButton: false,
        timer: 1500,
      });

      fetchPayouts();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.message || "Failed to update payout status.",
      });
    }
  };

  const handleViewInfluencer = (influencerId: string) => {
    router.push(`/admin/influencers/view?influencerId=${influencerId}`);
  };

  const handleViewBrand = (brandId: string) => {
    router.push(`/admin/brands/view?brandId=${brandId}`);
  };

  const handleViewCampaign = (campaignId: string) => {
    router.push(`/admin/campaigns/view?id=${campaignId}`);
  };

  const summary = useMemo(() => {
    const paid = payouts.filter((p) => p.payoutStatus === "paid").length;
    const initiated = payouts.filter((p) => p.payoutStatus === "initiated").length;

    return { paid, initiated };
  }, [payouts]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Milestone Payouts</h1>
            <p className="mt-1 text-sm text-slate-500">
              Review released milestones and mark payouts as paid.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search brand, influencer, campaign, milestone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val as "all" | PayoutStatus);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-44 bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="initiated">Initiated</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="text-sm text-slate-500">Visible rows</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{payouts.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-slate-500">Initiated</div>
            <div className="mt-1 text-2xl font-bold text-amber-600">{summary.initiated}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-slate-500">Paid</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">{summary.paid}</div>
          </Card>
        </div>

        {loading ? (
          <Card className="space-y-3 p-4">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="h-6 w-full animate-pulse rounded bg-slate-200" />
            ))}
          </Card>
        ) : error ? (
          <Card className="p-6 text-center font-medium text-red-600">{error}</Card>
        ) : payouts.length === 0 ? (
          <Card className="p-10 text-center text-slate-500">No payouts found.</Card>
        ) : (
          <Card className="overflow-hidden border border-slate-200 p-0 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Brand</TableHead>
                  <TableHead>Influencer</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Released</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {payouts.map((p) => (
                  <TableRow key={p.milestoneHistoryId} className="hover:bg-slate-50">
                    <TableCell className="align-top">
                      <button
                        type="button"
                        onClick={() => handleViewBrand(p.brandId)}
                        className="text-left text-blue-600 hover:underline"
                      >
                        {p.brandName || p.brandId}
                      </button>
                    </TableCell>

                    <TableCell className="align-top">
                      <button
                        type="button"
                        onClick={() => handleViewInfluencer(p.influencerId)}
                        className="text-left text-blue-600 hover:underline"
                      >
                        {p.influencerName || p.influencerId}
                      </button>
                      <div className="text-xs text-slate-500">
                        {p.influencerEmail || p.influencerId}
                      </div>
                    </TableCell>

                    <TableCell className="align-top max-w-[220px]">
                      <button
                        type="button"
                        onClick={() => handleViewCampaign(p.campaignId)}
                        className="w-full truncate text-left text-blue-600 hover:underline"
                        title={p.campaignTitle || p.campaignId}
                      >
                        {p.campaignTitle || p.campaignId}
                      </button>
                    </TableCell>

                    <TableCell className="align-top max-w-[240px]">
                      <div className="font-medium text-slate-900">
                        {p.milestoneTitle || "Untitled Milestone"}
                      </div>
                      {p.milestoneDescription ? (
                        <div
                          className="mt-1 truncate text-xs text-slate-500"
                          title={p.milestoneDescription}
                        >
                          {p.milestoneDescription}
                        </div>
                      ) : null}
                    </TableCell>

                    <TableCell className="align-top whitespace-nowrap font-medium">
                      {formatCurrency(p.amount)}
                    </TableCell>

                    <TableCell className="align-top whitespace-nowrap text-sm text-slate-600">
                      {formatDateTime(p.releasedAt || p.createdAt)}
                    </TableCell>

                    <TableCell className="align-top">{statusBadge(p.payoutStatus)}</TableCell>

                    <TableCell className="align-top text-right">
                      {p.payoutStatus === "paid" ? (
                        <span className="text-xs font-semibold text-emerald-600">
                          Already paid
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-emerald-500 text-white hover:bg-emerald-600"
                          onClick={() => handleMarkPaid(p)}
                        >
                          Mark as Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {!loading && !error && payouts.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                <HiChevronLeft />
              </Button>

              <div className="text-sm font-medium text-slate-700">
                Page {page} of {totalPages}
              </div>

              <Button
                variant="outline"
                size="icon"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                <HiChevronRight />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}