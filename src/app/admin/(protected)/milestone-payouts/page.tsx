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
  HiX,
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

interface PaymentBankDetails {
  accountHolder?: string;
  accountNumber?: string;
  ifsc?: string;
  swift?: string;
  bankName?: string;
  branch?: string;
  countryId?: string;
  countryName?: string;
}

interface PaymentPaypalDetails {
  email?: string;
  username?: string;
}

interface PaymentDetails {
  _id?: string;
  influencerId?: string;
  label?: string;
  type?: number | string;
  isDefault?: boolean;
  bank?: PaymentBankDetails;
  paypal?: PaymentPaypalDetails;
  createdAt?: string;
  updatedAt?: string;
}

interface PaymentDetailsResponse {
  success?: boolean;
  count?: number;
  data?: PaymentDetails[];
  message?: string;
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

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatusBadge({ status }: { status?: PayoutStatus }) {
  const paid = status === "paid";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        paid
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      )}
    >
      {paid ? (
        <HiCheckCircle className="h-4 w-4" />
      ) : (
        <HiExclamationCircle className="h-4 w-4" />
      )}
      {paid ? "Paid" : "Initiated"}
    </span>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "warning" | "success";
}) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-none">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tracking-tight",
          tone === "success" && "text-emerald-600",
          tone === "warning" && "text-amber-600",
          tone === "default" && "text-slate-950"
        )}
      >
        {value}
      </p>
    </Card>
  );
}

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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<AdminPayout | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [confirmingPayout, setConfirmingPayout] = useState(false);

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

      const data = await post<PayoutListResponse>(
        "/admin/milestone/payout",
        payload
      );

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

  const openPayoutConfirmModal = async (row: AdminPayout) => {
    setSelectedPayout(row);
    setPaymentDetails([]);
    setPaymentError(null);
    setConfirmOpen(true);
    setPaymentLoading(true);

    try {
      const data = await post<PaymentDetailsResponse>(
        "/payment-details/get-payment-details",
        {
          influencerId: row.influencerId,
        }
      );

      setPaymentDetails(Array.isArray(data?.data) ? data.data : []);
    } catch (err: any) {
      setPaymentError(err?.message || "Failed to load payment details.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const closePayoutConfirmModal = () => {
    if (confirmingPayout) return;

    setConfirmOpen(false);
    setSelectedPayout(null);
    setPaymentDetails([]);
    setPaymentError(null);
  };

  const confirmMarkPaid = async () => {
    if (!selectedPayout) return;

    setConfirmingPayout(true);

    try {
      await post("/admin/milestone/update", {
        milestoneId: selectedPayout.milestoneId,
        milestoneHistoryId: selectedPayout.milestoneHistoryId,
        payoutStatus: "paid",
      });

      setConfirmOpen(false);
      setSelectedPayout(null);
      setPaymentDetails([]);

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
    } finally {
      setConfirmingPayout(false);
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

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-full space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              Milestone Payouts
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review released milestones and mark payouts as paid.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <HiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search payouts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val as "all" | PayoutStatus);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm shadow-none focus:ring-0 sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="initiated">Initiated</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <StatCard label="Visible Rows" value={payouts.length} />
          <StatCard label="Initiated" value={summary.initiated} tone="warning" />
          <StatCard label="Paid" value={summary.paid} tone="success" />
        </div>

        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-none">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Payout Records
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {total} total payout{total === 1 ? "" : "s"}
              </p>
            </div>

            {!loading && !error && payouts.length > 0 ? (
              <div className="text-sm text-slate-500">
                Showing {from}–{to} of {total}
              </div>
            ) : null}
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: limit }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-full animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          ) : payouts.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-700">
                No payouts found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting your search or status filter.
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-500">
                      Brand
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">
                      Influencer
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">
                      Campaign
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">
                      Milestone
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">
                      Amount
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">
                      Released
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">
                      Status
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-500">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {payouts.map((p) => (
                    <TableRow
                      key={p.milestoneHistoryId}
                      className="border-slate-100 hover:bg-slate-50"
                    >
                      <TableCell className="align-top">
                        <button
                          type="button"
                          onClick={() => handleViewBrand(p.brandId)}
                          className="text-left text-sm font-medium text-slate-900 hover:underline"
                        >
                          {p.brandName || p.brandId}
                        </button>
                      </TableCell>

                      <TableCell className="align-top">
                        <button
                          type="button"
                          onClick={() => handleViewInfluencer(p.influencerId)}
                          className="text-left text-sm font-medium text-slate-900 hover:underline"
                        >
                          {p.influencerName || p.influencerId}
                        </button>
                        <div className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500">
                          {p.influencerEmail || p.influencerId}
                        </div>
                      </TableCell>

                      <TableCell className="max-w-[220px] align-top">
                        <button
                          type="button"
                          onClick={() => handleViewCampaign(p.campaignId)}
                          className="w-full truncate text-left text-sm font-medium text-slate-900 hover:underline"
                          title={p.campaignTitle || ""}
                        >
                          {p.campaignTitle}
                        </button>
                      </TableCell>

                      <TableCell className="max-w-[260px] align-top">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {p.milestoneTitle || "Untitled Milestone"}
                        </div>

                        {p.milestoneDescription ? (
                          <div
                            className="mt-0.5 truncate text-xs text-slate-500"
                            title={p.milestoneDescription}
                          >
                            {p.milestoneDescription}
                          </div>
                        ) : null}
                      </TableCell>

                      <TableCell className="whitespace-nowrap align-top text-sm font-semibold text-slate-950">
                        {formatCurrency(p.amount)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap align-top text-sm text-slate-500">
                        {formatDateTime(p.releasedAt || p.createdAt)}
                      </TableCell>

                      <TableCell className="align-top">
                        <StatusBadge status={p.payoutStatus} />
                      </TableCell>

                      <TableCell className="align-top text-right">
                        {p.payoutStatus === "paid" ? (
                          <span className="text-xs font-medium text-slate-400">
                            Completed
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            className="h-9 rounded-xl bg-slate-950 px-3 text-xs font-semibold text-white shadow-none hover:bg-slate-800"
                            onClick={() => openPayoutConfirmModal(p)}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {!loading && !error && payouts.length > 0 ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              Page <span className="font-semibold text-slate-900">{page}</span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="h-10 w-10 rounded-xl border-slate-200 bg-white shadow-none"
              >
                <HiChevronLeft />
              </Button>

              <Button
                variant="outline"
                size="icon"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="h-10 w-10 rounded-xl border-slate-200 bg-white shadow-none"
              >
                <HiChevronRight />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {confirmOpen && selectedPayout ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-950">
                  Confirm Payout
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review payout and payment account details before confirming.
                </p>
              </div>

              <button
                type="button"
                onClick={closePayoutConfirmModal}
                disabled={confirmingPayout}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
              >
                <HiX className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Payout Summary
                    </p>
                    <p className="text-xs text-slate-500">
                      Milestone payout information
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-950">
                      {formatCurrency(selectedPayout.amount)}
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={selectedPayout.payoutStatus} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow
                    label="Influencer"
                    value={
                      selectedPayout.influencerName ||
                      selectedPayout.influencerId
                    }
                  />
                  <InfoRow
                    label="Influencer Email"
                    value={selectedPayout.influencerEmail || "—"}
                  />
                  <InfoRow
                    label="Brand"
                    value={selectedPayout.brandName || selectedPayout.brandId}
                  />
                  <InfoRow
                    label="Campaign"
                    value={
                      selectedPayout.campaignTitle ||
                      ""
                    }
                  />
                  <InfoRow
                    label="Milestone"
                    value={selectedPayout.milestoneTitle || "Untitled Milestone"}
                  />
                  <InfoRow
                    label="Released"
                    value={formatDateTime(
                      selectedPayout.releasedAt || selectedPayout.createdAt
                    )}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Payment Accounts
                    </p>
                    <p className="text-xs text-slate-500">
                      Showing all saved payment methods for this influencer.
                    </p>
                  </div>

                  {!paymentLoading && !paymentError ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {paymentDetails.length} account
                      {paymentDetails.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>

                {paymentLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-20 w-full animate-pulse rounded-2xl bg-slate-100"
                      />
                    ))}
                  </div>
                ) : paymentError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {paymentError}
                  </div>
                ) : paymentDetails.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    No payment details found for this influencer.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentDetails.map((account, index) => (
                      <PaymentAccountCard
                        key={account._id || index}
                        account={account}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={closePayoutConfirmModal}
                disabled={confirmingPayout}
                className="h-10 rounded-xl border-slate-200 bg-white px-4 text-sm font-semibold shadow-none"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={confirmMarkPaid}
                disabled={
                  confirmingPayout ||
                  paymentLoading ||
                  Boolean(paymentError) ||
                  paymentDetails.length === 0
                }
                className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-none hover:bg-slate-800 disabled:opacity-50"
              >
                {confirmingPayout ? "Confirming..." : "Confirm Payout"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-white px-3 py-2">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function PaymentAccountCard({
  account,
  index,
}: {
  account: PaymentDetails;
  index: number;
}) {
  const isPaypal = Boolean(account.paypal);
  const isBank = Boolean(account.bank);

  const methodLabel = isPaypal
    ? "PayPal"
    : isBank
      ? "Bank Account"
      : `Payment Method ${index + 1}`;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        account.isDefault
          ? "border-slate-950 bg-slate-50"
          : "border-slate-200 bg-white"
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {methodLabel}
          </p>
          <p className="text-xs text-slate-500">
            {account.label?.trim() || `Account ${index + 1}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {account.isDefault ? (
            <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white">
              Default
            </span>
          ) : (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
              Secondary
            </span>
          )}

          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
            Type {String(account.type ?? "—")}
          </span>
        </div>
      </div>

      {isPaypal ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="PayPal Email" value={account.paypal?.email || "—"} />
          <InfoRow
            label="PayPal Username"
            value={account.paypal?.username || "—"}
          />
          <InfoRow label="Created" value={formatDateTime(account.createdAt)} />
          <InfoRow label="Updated" value={formatDateTime(account.updatedAt)} />
        </div>
      ) : null}

      {isBank ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow
            label="Account Holder"
            value={account.bank?.accountHolder || "—"}
          />
          <InfoRow
            label="Account Number"
            value={account.bank?.accountNumber || "—"}
          />
          <InfoRow label="IFSC" value={account.bank?.ifsc || "—"} />
          <InfoRow label="SWIFT" value={account.bank?.swift || "—"} />
          <InfoRow label="Bank Name" value={account.bank?.bankName || "—"} />
          <InfoRow label="Branch" value={account.bank?.branch || "—"} />
          <InfoRow label="Country" value={account.bank?.countryName || "—"} />
          <InfoRow label="Created" value={formatDateTime(account.createdAt)} />
          <InfoRow label="Updated" value={formatDateTime(account.updatedAt)} />
        </div>
      ) : null}

      {!isPaypal && !isBank ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          This payment account does not contain PayPal or bank details.
        </div>
      ) : null}
    </div>
  );
}