"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, Wallet, AlertCircle } from "lucide-react";

import { LabeledTextarea } from "@/components/ui/textAreaComp";
import { Button } from "@/components/ui/buttonComp";
import { FloatingInput } from "@/components/ui/floatingInput";

import {
  apiCreateMilestone,
  apiBrandWalletTopup,
  getApiErrorMessage,
} from "@/app/brand/services/brandApi";

type AddMilestoneCardProps = {
  open: boolean;
  onClose: () => void;
  brandId: string;
  contractId?: string;
  campaignId?: string;
  influencerId?: string;
  influencerName?: string;
  onSubmit?: () => void;
};

type WalletShortfallState = {
  needToAdd: number;
  walletBalance?: number;
  frozenBalance?: number;
  usableBalance?: number;
};

function WalletTopupModal({
  open,
  onClose,
  brandId,
  defaultAmount,
  walletInfo,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  brandId: string;
  defaultAmount: number;
  walletInfo?: WalletShortfallState | null;
  onSuccess?: (payload: {
    brandId: string;
    amount: number;
    walletBalance?: number;
    frozenBalance?: number;
    usableBalance?: number;
  }) => void;
}) {
  const [amount, setAmount] = useState(String(defaultAmount || ""));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(String(defaultAmount || ""));
      setSubmitting(false);
      setError("");
    }
  }, [open, defaultAmount]);

  if (!open) return null;

const handleTopup = async () => {
  try {
    setError("");

    const amountNum = Number(amount);

    if (!brandId) {
      setError("Brand ID is missing.");
      return;
    }

    if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid top-up amount greater than 0.");
      return;
    }

    setSubmitting(true);

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const res = await apiBrandWalletTopup({
      brandId,
      amount: amountNum,
      successUrl: `${origin}/brand/wallet/topup/success`,
      cancelUrl: `${origin}/brand/wallet/topup/cancel`,
    });

    if (res.checkoutUrl) {
      window.location.href = res.checkoutUrl;
      return;
    }

    onSuccess?.({
      brandId,
      amount: amountNum,
    });
  } catch (err) {
    setError(getApiErrorMessage(err, "Failed to top up wallet"));
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="w-full max-w-[28rem] overflow-hidden rounded-2xl bg-white shadow-[0_24px_48px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#EFEFEF] bg-[#FAFAFA] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111111] text-white">
                <Wallet className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-base font-semibold text-[#1A1A1A]">
                  Add Wallet Balance
                </h3>
                <p className="mt-1 text-xs text-[#6F6F6F]">
                  Add funds to continue milestone creation
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md p-1 text-[#777777] transition hover:bg-[#F2F2F2] disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-xl border border-[#F1D7A8] bg-[#FFF8EB] px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-[#B7791F]" />
              <div className="text-sm text-[#7A5718]">
                <div className="font-medium">
                  Insufficient usable balance for milestone creation
                </div>
                <div className="mt-1">
                  Minimum suggested top-up:{" "}
                  <span className="font-semibold">
                    ₹{Number(defaultAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {walletInfo ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#ECECEC] bg-[#FAFAFA] px-3 py-3">
                <div className="text-[11px] text-[#777777]">Wallet</div>
                <div className="mt-1 text-sm font-semibold text-[#1A1A1A]">
                  ${Number(walletInfo.walletBalance || 0).toFixed(2)}
                </div>
              </div>
              <div className="rounded-xl border border-[#ECECEC] bg-[#FAFAFA] px-3 py-3">
                <div className="text-[11px] text-[#777777]">Frozen</div>
                <div className="mt-1 text-sm font-semibold text-[#1A1A1A]">
                  ${Number(walletInfo.frozenBalance || 0).toFixed(2)}
                </div>
              </div>
              <div className="rounded-xl border border-[#ECECEC] bg-[#FAFAFA] px-3 py-3">
                <div className="text-[11px] text-[#777777]">Usable</div>
                <div className="mt-1 text-sm font-semibold text-[#1A1A1A]">
                  ${Number(walletInfo.usableBalance || 0).toFixed(2)}
                </div>
              </div>
            </div>
          ) : null}

          <FloatingInput
            label="Top-up Amount *"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setAmount(e.target.value)
            }
          />

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#EFEFEF] px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="h-10 rounded-lg px-4"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleTopup}
            disabled={submitting}
            className="h-10 rounded-lg bg-[#111111] px-5 text-white hover:bg-black disabled:opacity-60"
          >
            {submitting ? "Processing..." : "Add Wallet Balance"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AddMilestoneCard({
  open,
  onClose,
  brandId,
  campaignId,
  influencerId,
  influencerName,
  onSubmit,
}: AddMilestoneCardProps) {
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [topupSuccess, setTopupSuccess] = useState("");

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletShortfall, setWalletShortfall] =
    useState<WalletShortfallState | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting && !walletModalOpen) {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, submitting, walletModalOpen]);

  useEffect(() => {
    if (!open) {
      setMilestoneTitle("");
      setMilestoneDescription("");
      setAmount("");
      setError("");
      setTopupSuccess("");
      setSubmitting(false);
      setWalletModalOpen(false);
      setWalletShortfall(null);
    }
  }, [open]);

  const modalSubtitle = useMemo(() => {
    if (!influencerName) return "";
    return `for ${influencerName}`;
  }, [influencerName]);

  const primaryButtonLabel = submitting ? "Creating..." : "Create Milestone";

  const openTopupModalFromShortfall = () => {
    if (!walletShortfall) return;
    setWalletModalOpen(true);
  };

  const handleCreateMilestone = async () => {
    try {
      setError("");
      setTopupSuccess("");

      if (walletShortfall) {
        openTopupModalFromShortfall();
        return;
      }

      if (!brandId) {
        setError("Brand ID is missing.");
        return;
      }

      if (!campaignId) {
        setError("Campaign ID is missing.");
        return;
      }

      if (!influencerId) {
        setError("Influencer ID is missing.");
        return;
      }

      if (!milestoneTitle.trim()) {
        setError("Milestone title is required.");
        return;
      }

      const amountNum = Number(amount);

      if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
        setError("Please enter a valid amount greater than 0.");
        return;
      }

      setSubmitting(true);

      await apiCreateMilestone({
        brandId,
        campaignId,
        influencerId,
        milestoneTitle: milestoneTitle.trim(),
        amount: amountNum,
        milestoneDescription: milestoneDescription.trim(),
      });

      setWalletShortfall(null);
      onSubmit?.();
      onClose();
    } catch (err: any) {
      const message = getApiErrorMessage(err, "Failed to create milestone");
      const apiData = err?.response?.data || {};
      const needToAdd = Number(apiData?.needToAdd || 0);

      if (
        typeof message === "string" &&
        message.toLowerCase().includes("insufficient wallet balance")
      ) {
        setWalletShortfall({
          needToAdd,
          walletBalance: Number(apiData?.walletBalance || 0),
          frozenBalance: Number(apiData?.frozenBalance || 0),
          usableBalance: Number(apiData?.usableBalance || 0),
        });
        setError(message);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleWalletTopupSuccess = (payload: {
    brandId: string;
    amount: number;
    walletBalance?: number;
    frozenBalance?: number;
    usableBalance?: number;
  }) => {
    setWalletModalOpen(false);
    setWalletShortfall(null);
    setError("");
    setTopupSuccess(
      `Wallet balance added successfully. ₹${Number(payload.amount || 0).toFixed(
        2
      )} was added. You can now create the milestone.`
    );
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-4 md:p-6"
        onClick={() => {
          if (!submitting) onClose();
        }}
      >
        <div
          className="flex max-h-[90vh] w-full max-w-[32rem] flex-col overflow-hidden rounded-[1rem] bg-white shadow-[0_24px_40px_-4px_rgba(0,0,0,0.10),0_0_12px_0_rgba(0,0,0,0.08)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex w-full items-center justify-between border-b border-[#F0F0F0] px-4 py-4 sm:px-5 md:px-7">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-7 text-[#1A1A1A] sm:text-[1.25rem]">
                Create Milestone
              </h2>
              {modalSubtitle ? (
                <p className="mt-1 truncate text-xs text-[#7A7A7A]">
                  {modalSubtitle}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              disabled={submitting}
              className="ml-3 shrink-0 rounded-md p-1 text-[#666666] transition hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 md:px-7">
            <div className="space-y-4">
              <FloatingInput
                label="Milestone Title *"
                value={milestoneTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMilestoneTitle(e.target.value)
                }
              />

              <LabeledTextarea
                label="Description"
                placeholder="Enter milestone description"
                rows={5}
                maxLength={500}
                showCharCount
                value={milestoneDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setMilestoneDescription(e.target.value)
                }
              />

              <FloatingInput
                label="Amount *"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAmount(e.target.value)
                }
              />

              {walletShortfall ? (
                <div className="rounded-xl border border-[#F1D7A8] bg-[#FFF8EB] px-4 py-3 text-sm text-[#7A5718]">
                  <div className="font-medium">Insufficient wallet balance</div>
                  <div className="mt-1">
                    Please add{" "}
                    <span className="font-semibold">
                      ₹{Number(walletShortfall.needToAdd || 0).toFixed(2)}
                    </span>{" "}
                    to continue.
                  </div>
                </div>
              ) : null}

              {topupSuccess ? (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {topupSuccess}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#F0F0F0] px-4 py-4 sm:flex-row sm:justify-end sm:px-5 md:px-7">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="h-10 w-full rounded-lg px-4 text-sm font-medium text-[#4D4D4D] hover:bg-[#F5F5F5] sm:w-auto"
            >
              Discard
            </Button>

            <Button
              type="button"
              onClick={handleCreateMilestone}
              disabled={submitting}
              className="h-10 w-full rounded-lg bg-[#1A1A1A] px-4 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {primaryButtonLabel}
            </Button>
          </div>
        </div>
      </div>

      <WalletTopupModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        brandId={brandId}
        defaultAmount={Number(walletShortfall?.needToAdd || 0)}
        walletInfo={walletShortfall}
        onSuccess={handleWalletTopupSuccess}
      />
    </>
  );
}