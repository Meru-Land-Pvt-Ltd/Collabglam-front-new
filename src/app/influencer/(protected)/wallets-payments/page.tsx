"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Clock3,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  apiAddPaymentDetails,
  apiDeletePaymentDetails,
  apiEditPaymentDetails,
  apiGetInfluencerPayoutSummary,
  apiGetPaymentDetails,
  apiGetPayoutDetailsByInfluencer,
} from "@/app/influencer/services/influencerApi";
import PaymentDetailsOverlay, {
  PaymentMethod,
  BankInfo,
  PaypalInfo,
  FormState,
} from "./paymentOverlayCard";

type PayoutStatus = "pending" | "initiated" | "paid" | string;

type PayoutSummary = {
  influencerId: string;
  totalPaid: number;
  totalUpcoming: number;
  totalInitiated: number;
};

type PayoutItem = {
  campaignId: string;
  campaignTitle: string;
  amount: number;
  payoutStatus: PayoutStatus;
  createdAt?: string;
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  iconBg,
}: {
  label: string;
  value: string;
  icon: any;
  iconBg: string;
}) => (
  <Card className="p-5">
    <div className="mb-3 flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          iconBg
        )}
      >
        <Icon size={16} className="text-white" />
      </div>
    </div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
  </Card>
);

const StatusBadge = ({ status }: { status: PayoutStatus }) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "paid") {
    return (
      <Badge className="flex items-center gap-1">
        <CheckCircle2 size={10} />
        Paid
      </Badge>
    );
  }

  if (normalized === "initiated") {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <ArrowUpRight size={10} />
        Initiated
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <Clock3 size={10} />
      Pending
    </Badge>
  );
};

function formatCurrency(amount: number) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

function getStoredInfluencerAuth() {
  if (typeof window === "undefined") {
    return { influencerId: "", token: "" };
  }

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("influencerToken") ||
    localStorage.getItem("authToken") ||
    "";

  const directInfluencerId =
    localStorage.getItem("influencerId") ||
    localStorage.getItem("userId") ||
    "";

  if (directInfluencerId) {
    return { influencerId: directInfluencerId, token };
  }

  const possibleJsonKeys = ["influencer", "user", "authUser", "influencerData"];

  for (const key of possibleJsonKeys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const influencerId =
        parsed?.influencerId || parsed?._id || parsed?.userId || "";
      if (influencerId) {
        return { influencerId, token };
      }
    } catch {
      //
    }
  }

  return { influencerId: "", token };
}

const toBankInfo = (bank: any): BankInfo | undefined => {
  if (!bank) return undefined;

  return {
    accountHolder: bank.accountHolder ?? "",
    accountNumber: bank.accountNumber ?? "",
    ifsc: bank.ifsc ?? "",
    swift: bank.swift ?? "",
    bankName: bank.bankName ?? "",
    branch: bank.branch ?? "",
    countryId: bank.countryId ?? "",
    countryName: bank.countryName ?? "",
  };
};

const toPaypalInfo = (paypal: any): PaypalInfo | undefined => {
  if (!paypal) return undefined;

  return {
    username: paypal.username ?? "",
    email: paypal.email ?? "",
  };
};

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [summary, setSummary] = useState<PayoutSummary>({
    influencerId: "",
    totalPaid: 0,
    totalUpcoming: 0,
    totalInitiated: 0,
  });

  const [transactions, setTransactions] = useState<PayoutItem[]>([]);

  const cards = useMemo(
    () => [
      {
        label: "Total Paid",
        value: formatCurrency(summary.totalPaid),
        icon: CheckCircle2,
        iconBg: "bg-emerald-500",
      },
      {
        label: "Upcoming",
        value: formatCurrency(summary.totalUpcoming),
        icon: Clock3,
        iconBg: "bg-amber-500",
      },
      {
        label: "Initiated",
        value: formatCurrency(summary.totalInitiated),
        icon: Wallet,
        iconBg: "bg-blue-500",
      },
    ],
    [summary]
  );

  const loadPaymentDetails = async () => {
    try {
      setPaymentLoading(true);

      const { influencerId, token } = getStoredInfluencerAuth();

      if (!influencerId) {
        setPaymentMethods([]);
        return;
      }

      const items = await apiGetPaymentDetails(influencerId, token);

      if (!Array.isArray(items) || items.length === 0) {
        setPaymentMethods([]);
        return;
      }

      setPaymentMethods(
        items.map((item: any) => ({
          paymentId: item?._id || "",
          _id: item?._id || "",
          type: Number(item?.type ?? 0) as 0 | 1,
          bank: toBankInfo(item?.bank),
          paypal: toPaypalInfo(item?.paypal),
          isDefault: Boolean(item?.isDefault),
        }))
      );
    } catch (err) {
      console.error("loadPaymentDetails error:", err);
      setPaymentMethods([]);
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        setError("");

        const { influencerId, token } = getStoredInfluencerAuth();

        if (!influencerId) {
          throw new Error("influencerId not found");
        }

        const [summaryRes, payoutRes] = await Promise.all([
          apiGetInfluencerPayoutSummary(influencerId, token),
          apiGetPayoutDetailsByInfluencer(influencerId, token),
        ]);

        setSummary({
          influencerId: summaryRes?.influencerId || influencerId,
          totalPaid: Number(summaryRes?.totalPaid || 0),
          totalUpcoming: Number(summaryRes?.totalUpcoming || 0),
          totalInitiated: Number(summaryRes?.totalInitiated || 0),
        });

        setTransactions(
          Array.isArray(payoutRes?.payouts)
            ? payoutRes.payouts.map((item: any) => ({
                campaignId: String(item?.campaignId || ""),
                campaignTitle: String(item?.campaignTitle || ""),
                amount: Number(item?.amount || 0),
                payoutStatus: String(item?.payoutStatus || "pending"),
                createdAt: item?.createdAt || "",
              }))
            : []
        );

        await loadPaymentDetails();
      } catch (err: any) {
        setError(err?.message || "Failed to load payout details");
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const handlePaymentOverlaySubmit = async (data: FormState) => {
    const { influencerId, token } = getStoredInfluencerAuth();

    if (!influencerId) {
      throw new Error("influencerId not found");
    }

    const payload = {
      influencerId,
      type: data.type,
      isDefault: data.isDefault,
      bank:
        data.type === 1
          ? {
              accountHolder: data.bank.accountHolder,
              accountNumber: data.bank.accountNumber,
              ifsc: data.bank.ifsc,
              swift: data.bank.swift,
              bankName: data.bank.bankName,
              branch: data.bank.branch,
              countryId: data.bank.countryId,
              countryName: data.bank.countryName,
            }
          : undefined,
      paypal:
        data.type === 0
          ? {
              username: data.paypal.username,
              email: data.paypal.email,
            }
          : undefined,
    };

    if (editingPayment) {
      await apiEditPaymentDetails(payload, token);
    } else {
      await apiAddPaymentDetails(payload, token);
    }

    await loadPaymentDetails();
    setShowPaymentOverlay(false);
    setEditingPayment(null);
  };

  const handleEditPayment = (payment: PaymentMethod) => {
    setEditingPayment(payment);
    setShowPaymentOverlay(true);
  };

  const handleDeletePayment = async (_payment: PaymentMethod) => {
    const { influencerId, token } = getStoredInfluencerAuth();

    if (!influencerId) {
      throw new Error("influencerId not found");
    }

    await apiDeletePaymentDetails(influencerId, token);
    await loadPaymentDetails();
  };

  return (
    <div
      className="min-h-screen bg-slate-50 font-sans"
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      <div className="border-b border-slate-100 bg-white px-6 py-5">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Wallet size={20} className="text-amber-500" />
            Wallet &amp; Payments
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            View your payout summary and transaction history.
          </p>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        {loading ? (
          <Card className="p-8">
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Loader2 size={18} className="animate-spin" />
              Loading payout details...
            </div>
          </Card>
        ) : error ? (
          <Card className="border-red-200 p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle size={18} />
              <span className="font-medium">{error}</span>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {cards.map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  icon={card.icon}
                  iconBg={card.iconBg}
                />
              ))}
            </div>

            <Card className="overflow-hidden">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">Payment Details</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      Add your payout details to receive payments.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingPayment(null);
                      setShowPaymentOverlay(true);
                    }}
                    className="inline-flex items-center justify-center rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-500"
                  >
                    Add Details
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {paymentLoading ? (
                  <div className="px-6 py-6 text-sm text-slate-500">
                    Loading payment details...
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      No payment details added yet.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Please add your bank or payout details.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="px-5 py-3 text-left">Type</th>
                          <th className="px-5 py-3 text-left">Details</th>
                          <th className="px-5 py-3 text-left">Default</th>
                          <th className="px-5 py-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paymentMethods.map((payment, index) => (
                          <tr
                            key={payment.paymentId || payment._id || index}
                            className="transition-colors hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 font-medium text-slate-800">
                              {payment.type === 1 ? "Bank" : "PayPal"}
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {payment.type === 1 ? (
                                <div className="space-y-1">
                                  <p>
                                    <span className="font-medium">Account Holder:</span>{" "}
                                    {payment.bank?.accountHolder || "-"}
                                  </p>
                                  <p>
                                    <span className="font-medium">Account Number:</span>{" "}
                                    {payment.bank?.accountNumber || "-"}
                                  </p>
                                  <p>
                                    <span className="font-medium">Bank Name:</span>{" "}
                                    {payment.bank?.bankName || "-"}
                                  </p>
                                  <p>
                                    <span className="font-medium">Country:</span>{" "}
                                    {payment.bank?.countryName || "-"}
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <p>
                                    <span className="font-medium">Username:</span>{" "}
                                    {payment.paypal?.username || "-"}
                                  </p>
                                  <p>
                                    <span className="font-medium">Email:</span>{" "}
                                    {payment.paypal?.email || "-"}
                                  </p>
                                </div>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {payment.isDefault ? (
                                <Badge>Yes</Badge>
                              ) : (
                                <Badge variant="outline">No</Badge>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditPayment(payment)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  <Pencil size={14} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeletePayment(payment)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-base">Transaction History</CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                {transactions.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">
                    No transaction history found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="px-5 py-3 text-left">Campaign Title</th>
                          <th className="px-5 py-3 text-right">Amount</th>
                          <th className="px-5 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactions.map((item, index) => (
                          <tr
                            key={`${item.campaignId}-${index}`}
                            className="transition-colors hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 font-medium text-slate-800">
                              {item.campaignTitle || "-"}
                            </td>
                            <td className="px-5 py-4 text-right font-bold tabular-nums text-slate-900">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge status={item.payoutStatus} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {showPaymentOverlay && (
        <PaymentDetailsOverlay
          initial={editingPayment}
          onCancel={() => {
            setShowPaymentOverlay(false);
            setEditingPayment(null);
          }}
          onSubmit={handlePaymentOverlaySubmit}
        />
      )}
    </div>
  );
}