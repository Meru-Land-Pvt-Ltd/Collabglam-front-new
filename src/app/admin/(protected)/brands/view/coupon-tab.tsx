"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    BadgePercent,
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    Copy,
    Plus,
    Search,
    TicketPercent,
    XCircle,
} from "lucide-react";
import { adminGet, adminPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type {
    BrandCouponHistoryItem,
    BrandCouponSubscriptionRef,
    BrandDetail,
} from "./types";
import Swal from "sweetalert2";

const API_CREATE_BRAND_COUPON = "/admins/brand-coupon";
const API_SUBSCRIPTION_LIST = "/admins/subscription-list";

type BrandCouponsTabProps = {
    brand: BrandDetail;
    onCreated?: () => void | Promise<void>;
};

type SubscriptionListItem = {
    _id: string;
    name: string;
    monthlyCost?: number;
    annualCost?: number;
    currency?: string;
};

type BillingMode = "monthly" | "annually";

type SubscriptionListResponse = {
    success?: boolean;
    message?: string;
    data?: SubscriptionListItem[];
};

type CouponWithMode = BrandCouponHistoryItem & {
    mode?: string | null;
    billingCycle?: string | null;
    promoCode?: string;
    promocode?: string;
};

function isFreeSubscription(subscription?: SubscriptionListItem | null) {
    const name = String(subscription?.name || "").trim().toLowerCase();
    return name === "free";
}

function getSubscriptionId(subscription?: string | BrandCouponSubscriptionRef | null) {
    if (!subscription) return "";
    if (typeof subscription === "string") return subscription;
    return subscription._id || subscription.planId || "";
}

function formatSubscriptionName(name?: string | null) {
    if (!name) return "Subscription";

    return name.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getAvailableBillingModes(subscription?: SubscriptionListItem | null) {
    if (!subscription) return [];

    const modes: Array<{
        value: BillingMode;
        label: string;
        price: number;
    }> = [];

    if (subscription.monthlyCost !== undefined && subscription.monthlyCost !== null) {
        modes.push({
            value: "monthly",
            label: "Monthly",
            price: subscription.monthlyCost,
        });
    }

    if (subscription.annualCost !== undefined && subscription.annualCost !== null) {
        modes.push({
            value: "annually",
            label: "Annually",
            price: subscription.annualCost,
        });
    }

    return modes;
}

function getPromoCode(coupon: BrandCouponHistoryItem) {
    const item = coupon as CouponWithMode;
    return item.promocode || item.promoCode || "";
}

function getCouponMode(coupon: BrandCouponHistoryItem): BillingMode {
    const item = coupon as CouponWithMode;
    const rawMode = String(item.mode || item.billingCycle || "monthly").toLowerCase();

    if (rawMode === "annual" || rawMode === "annually" || rawMode === "yearly") {
        return "annually";
    }

    return "monthly";
}

function formatBillingMode(mode: string) {
    const normalized = mode.toLowerCase();

    if (normalized === "annual" || normalized === "annually" || normalized === "yearly") {
        return "Annually";
    }

    return "Monthly";
}

function buildSubscriptionCouponLink(coupon: BrandCouponHistoryItem) {
    const subscriptionId = getSubscriptionId(coupon.subscriptionId);
    const mode = getCouponMode(coupon);
    const promoCode = getPromoCode(coupon);

    if (!subscriptionId) return "";

    const params = new URLSearchParams({
        subscriptionId,
        mode,
    });

    if (promoCode) {
        params.set("promoCode", promoCode);
    }

    const path = `/brand/subscriptions/?${params.toString()}`;

    if (typeof window === "undefined") {
        return path;
    }

    return `${window.location.origin}${path}`;
}

function formatDate(iso?: string | null) {
    if (!iso) return "—";

    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return "—";

    return dt.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatMoney(amount?: number | null, currency = "USD") {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return "—";
    }

    const symbol = currency === "USD" ? "$" : `${currency} `;
    return `${symbol}${Number(amount).toLocaleString()}`;
}

function getCouponStatus(coupon: BrandCouponHistoryItem) {
    if (coupon.hasUsed) {
        return {
            label: "Used",
            className: "border-black/10 bg-black/[0.04] text-black/60",
            icon: CheckCircle2,
        };
    }

    const expiry = coupon.expiredAt ? new Date(coupon.expiredAt) : null;

    if (expiry && !Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
        return {
            label: "Expired",
            className: "border-rose-200 bg-rose-50 text-rose-700",
            icon: XCircle,
        };
    }

    return {
        label: "Active",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: CheckCircle2,
    };
}

function toEndOfDayIso(dateValue: string) {
    return new Date(`${dateValue}T23:59:59.000Z`).toISOString();
}

export function BrandCouponsTab({ brand, onCreated }: BrandCouponsTabProps) {
    const coupons = useMemo(() => brand.brandCouponHistory || [], [brand.brandCouponHistory]);

    const [subscriptions, setSubscriptions] = useState<SubscriptionListItem[]>([]);
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
    const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [subscriptionId, setSubscriptionId] = useState("");
    const [billingMode, setBillingMode] = useState<BillingMode>("monthly");
    const [newPrice, setNewPrice] = useState("");
    const [expiredAt, setExpiredAt] = useState("");

    const [creating, setCreating] = useState(false);
    const [createMsg, setCreateMsg] = useState<string | null>(null);

    const fetchSubscriptions = useCallback(async () => {
        setLoadingSubscriptions(true);
        setSubscriptionError(null);

        try {
            const resp = await adminGet<SubscriptionListResponse | SubscriptionListItem[]>(
                API_SUBSCRIPTION_LIST,
                {}
            );

            const list = Array.isArray(resp) ? resp : resp?.data || [];
            const paidSubscriptions = list.filter((item) => !isFreeSubscription(item));

            setSubscriptions(paidSubscriptions);
        } catch (err: any) {
            setSubscriptionError(err?.message || "Failed to load subscriptions.");
            setSubscriptions([]);
        } finally {
            setLoadingSubscriptions(false);
        }
    }, []);

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    useEffect(() => {
        if (!subscriptions.length) {
            setSubscriptionId("");
            return;
        }

        const exists = subscriptions.some((item) => item._id === subscriptionId);

        if (!subscriptionId || !exists) {
            setSubscriptionId(subscriptions[0]._id);
        }
    }, [subscriptionId, subscriptions]);

    const subscriptionNameById = useMemo(() => {
        const map = new Map<string, SubscriptionListItem>();

        subscriptions.forEach((subscription) => {
            map.set(subscription._id, subscription);
        });

        return map;
    }, [subscriptions]);

    const selectedSubscription = useMemo(() => {
        return subscriptions.find((item) => item._id === subscriptionId) || null;
    }, [subscriptions, subscriptionId]);

    const availableBillingModes = useMemo(() => {
        return getAvailableBillingModes(selectedSubscription);
    }, [selectedSubscription]);

    useEffect(() => {
        if (!selectedSubscription) return;

        const modes = getAvailableBillingModes(selectedSubscription);
        const hasCurrentMode = modes.some((mode) => mode.value === billingMode);

        if (!hasCurrentMode && modes[0]?.value) {
            setBillingMode(modes[0].value);
        }
    }, [billingMode, selectedSubscription]);

    const getSubscriptionName = useCallback(
        (subscription?: string | BrandCouponSubscriptionRef | null) => {
            const id = getSubscriptionId(subscription);

            if (id && subscriptionNameById.has(id)) {
                return formatSubscriptionName(subscriptionNameById.get(id)?.name);
            }

            if (subscription && typeof subscription !== "string") {
                return formatSubscriptionName(subscription.displayName || subscription.name || id);
            }

            return id || "Subscription";
        },
        [subscriptionNameById]
    );

    const getSubscriptionCurrency = useCallback(
        (subscription?: string | BrandCouponSubscriptionRef | null) => {
            const id = getSubscriptionId(subscription);
            return subscriptionNameById.get(id)?.currency || "USD";
        },
        [subscriptionNameById]
    );

    const filteredCoupons = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) return coupons;

        return coupons.filter((coupon) => {
            const subscriptionLabel = getSubscriptionName(coupon.subscriptionId);
            const status = getCouponStatus(coupon).label;
            const mode = getCouponMode(coupon);

            return (
                getPromoCode(coupon).toLowerCase().includes(value) ||
                String(coupon.newPrice || "").toLowerCase().includes(value) ||
                subscriptionLabel.toLowerCase().includes(value) ||
                status.toLowerCase().includes(value) ||
                mode.toLowerCase().includes(value)
            );
        });
    }, [coupons, getSubscriptionName, search]);

    const activeCount = useMemo(
        () => coupons.filter((coupon) => getCouponStatus(coupon).label === "Active").length,
        [coupons]
    );

    const usedCount = useMemo(() => coupons.filter((coupon) => coupon.hasUsed).length, [coupons]);

    const expiredCount = useMemo(
        () => coupons.filter((coupon) => getCouponStatus(coupon).label === "Expired").length,
        [coupons]
    );

    const resetCreateForm = () => {
        setNewPrice("");
        setExpiredAt("");
        setCreateMsg(null);

        if (subscriptions[0]?._id) {
            setSubscriptionId(subscriptions[0]._id);

            const modes = getAvailableBillingModes(subscriptions[0]);
            if (modes[0]?.value) {
                setBillingMode(modes[0].value);
            }
        } else {
            setSubscriptionId("");
            setBillingMode("monthly");
        }
    };

    const createCoupon = async () => {
        const finalPrice = Number(newPrice);

        if (!brand._id || !subscriptionId || !expiredAt || !Number.isFinite(finalPrice)) {
            setCreateMsg("Please select subscription, enter price, and choose expiry date.");
            return;
        }

        if (finalPrice <= 0) {
            setCreateMsg("New price must be greater than 0.");
            return;
        }

        setCreating(true);
        setCreateMsg(null);

        try {
            await adminPost(API_CREATE_BRAND_COUPON, {
                brandId: brand._id,
                subscriptionId,
                mode: billingMode,
                newPrice: finalPrice,
                expiredAt: toEndOfDayIso(expiredAt),
            });

            resetCreateForm();
            setIsCreateOpen(false);

            await onCreated?.();
        } catch (err: any) {
            setCreateMsg(err?.message || "Failed to create coupon.");
        } finally {
            setCreating(false);
        }
    };

    async function copyTextToClipboard(text: string) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!copied) {
        throw new Error("Copy failed");
    }
}

    const copySubscriptionLink = async (coupon: BrandCouponHistoryItem) => {
        const link = buildSubscriptionCouponLink(coupon);

        if (!link) return;

        try {
            await copyTextToClipboard(link);

            await Swal.fire({
                icon: "success",
                title: "Coupon link copied",
                text: "The subscription link has been copied to your clipboard.",
                timer: 1600,
                showConfirmButton: false,
                customClass: {
                    popup: "rounded-[24px]",
                    title: "text-lg font-black",
                    htmlContainer: "text-sm font-medium",
                },
            });
        } catch {
            await Swal.fire({
                icon: "error",
                title: "Copy failed",
                text: "Please try again.",
                confirmButtonText: "Okay",
            });
        }
    };

    return (
        <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] border border-black/10 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-black/35">
                                Active Coupons
                            </p>
                            <p className="mt-3 text-2xl font-black text-[#1a1a1a]">{activeCount}</p>
                            <p className="mt-1 text-sm font-medium text-black/50">
                                Coupons available to use
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                            <BadgePercent size={20} />
                        </div>
                    </div>
                </div>

                <div className="rounded-[24px] border border-black/10 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-black/35">
                                Used Coupons
                            </p>
                            <p className="mt-3 text-2xl font-black text-[#1a1a1a]">{usedCount}</p>
                            <p className="mt-1 text-sm font-medium text-black/50">
                                Coupons already redeemed
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.04] text-black/70">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                </div>

                <div className="rounded-[24px] border border-black/10 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-black/35">
                                Expired Coupons
                            </p>
                            <p className="mt-3 text-2xl font-black text-[#1a1a1a]">{expiredCount}</p>
                            <p className="mt-1 text-sm font-medium text-black/50">
                                Coupons past expiry date
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-700">
                            <XCircle size={20} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-black/8 p-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-[#1a1a1a]">Brand Coupons</h2>
                        <p className="mt-1 text-sm font-medium text-black/50">
                            View coupon history and create a new brand subscription coupon.
                        </p>
                    </div>

                    <Button
                        className="h-11 rounded-full bg-[#1a1a1a] px-5 text-sm font-bold text-white hover:bg-black"
                        onClick={() => {
                            resetCreateForm();
                            setIsCreateOpen(true);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Coupon
                    </Button>
                </div>

                <div className="p-5">
                    <div className="mb-5 flex items-center rounded-full border border-black/10 bg-black/[0.02] px-4 py-3">
                        <Search className="mr-3 h-4 w-4 text-black/35" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by promo code, subscription, mode, price, or status..."
                            className="w-full bg-transparent text-sm font-medium text-[#1a1a1a] outline-none placeholder:text-black/35"
                        />
                    </div>

                    <div className="overflow-hidden rounded-[22px] border border-black/8">
                        <div className="grid grid-cols-12 bg-black/[0.03] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-black/35">
                            <div className="col-span-3">Coupon</div>
                            <div className="col-span-2">Subscription</div>
                            <div className="col-span-1">Mode</div>
                            <div className="col-span-1">Price</div>
                            <div className="col-span-2">Expiry</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-1 text-right">Created</div>
                        </div>

                        {filteredCoupons.length ? (
                            filteredCoupons.map((coupon) => {
                                const status = getCouponStatus(coupon);
                                const StatusIcon = status.icon;
                                const promoCode = getPromoCode(coupon);
                                const couponMode = getCouponMode(coupon);
                                const link = buildSubscriptionCouponLink(coupon);

                                return (
                                    <div
                                        key={coupon._id || `${promoCode}-${coupon.createdAt}`}
                                        className="grid grid-cols-12 items-center border-t border-black/8 px-4 py-4"
                                    >
                                        <div className="col-span-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-black/[0.03] text-black/70">
                                                    <TicketPercent size={18} />
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-black text-[#1a1a1a]">
                                                            {promoCode || "—"}
                                                        </p>

                                                        {link ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => copySubscriptionLink(coupon)}
                                                                className="text-black/35 transition hover:text-black"
                                                                title={`Copy ${link}`}
                                                            >
                                                                <Copy size={14} />
                                                            </button>
                                                        ) : null}
                                                    </div>

                                                    <p className="mt-1 text-xs font-medium text-black/50">
                                                        Copy subscription link
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-2 text-sm font-bold text-black/65">
                                            {getSubscriptionName(coupon.subscriptionId)}
                                        </div>

                                        <div className="col-span-1">
                                            <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-black text-black/60">
                                                {formatBillingMode(couponMode)}
                                            </span>
                                        </div>

                                        <div className="col-span-1 flex items-center gap-1 text-sm font-black text-[#1a1a1a]">
                                            <CircleDollarSign size={15} className="text-black/35" />
                                            {formatMoney(
                                                coupon.newPrice,
                                                getSubscriptionCurrency(coupon.subscriptionId)
                                            )}
                                        </div>

                                        <div className="col-span-2 flex items-center gap-2 text-sm font-bold text-black/60">
                                            <CalendarDays size={15} />
                                            {formatDate(coupon.expiredAt)}
                                        </div>

                                        <div className="col-span-2">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black ${status.className}`}
                                            >
                                                <StatusIcon size={13} />
                                                {status.label}
                                            </span>
                                        </div>

                                        <div className="col-span-1 text-right text-xs font-bold text-black/45">
                                            {formatDate(coupon.createdAt)}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="border-t border-black/8 px-4 py-10 text-center">
                                <p className="text-sm font-black text-[#1a1a1a]">No coupons found.</p>
                                <p className="mt-1 text-sm font-medium text-black/50">
                                    Create a coupon to start offering discounted subscription pricing.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl rounded-[28px] border border-black/10 p-0">
                    <div className="p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-[#1a1a1a]">
                                Create Brand Coupon
                            </DialogTitle>
                            <DialogDescription className="text-sm font-medium text-black/55">
                                Select a paid subscription plan, set the discounted price, and choose the expiry date.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="text-xs font-black uppercase tracking-[0.18em] text-black/35">
                                    Subscription
                                </label>

                                <select
                                    value={subscriptionId}
                                    onChange={(event) => {
                                        const nextSubscriptionId = event.target.value;
                                        const nextSubscription = subscriptions.find(
                                            (item) => item._id === nextSubscriptionId
                                        );
                                        const modes = getAvailableBillingModes(nextSubscription);

                                        setSubscriptionId(nextSubscriptionId);

                                        if (modes[0]?.value) {
                                            setBillingMode(modes[0].value);
                                        }
                                    }}
                                    disabled={loadingSubscriptions || !subscriptions.length}
                                    className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold outline-none focus:border-black/30 disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-black/40"
                                >
                                    {!subscriptions.length ? (
                                        <option value="">
                                            {loadingSubscriptions
                                                ? "Loading subscriptions..."
                                                : "No paid subscriptions found"}
                                        </option>
                                    ) : null}

                                    {subscriptions.map((subscription) => (
                                        <option key={subscription._id} value={subscription._id}>
                                            {formatSubscriptionName(subscription.name)}
                                        </option>
                                    ))}
                                </select>

                                {subscriptionError ? (
                                    <p className="mt-2 text-xs font-bold text-rose-600">{subscriptionError}</p>
                                ) : null}
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase tracking-[0.18em] text-black/35">
                                    Mode
                                </label>

                                <select
                                    value={billingMode}
                                    onChange={(event) => setBillingMode(event.target.value as BillingMode)}
                                    disabled={!availableBillingModes.length}
                                    className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold outline-none focus:border-black/30 disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-black/40"
                                >
                                    {!availableBillingModes.length ? (
                                        <option value="monthly">No mode available</option>
                                    ) : null}

                                    {availableBillingModes.map((mode) => (
                                        <option key={mode.value} value={mode.value}>
                                            {mode.label} — {formatMoney(mode.price, selectedSubscription?.currency || "USD")}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-[0.18em] text-black/35">
                                        New Price
                                    </label>
                                    <input
                                        type="number"
                                        value={newPrice}
                                        onChange={(event) => setNewPrice(event.target.value)}
                                        placeholder="69"
                                        className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold outline-none focus:border-black/30"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black uppercase tracking-[0.18em] text-black/35">
                                        Expiry Date
                                    </label>
                                    <input
                                        type="date"
                                        value={expiredAt}
                                        onChange={(event) => setExpiredAt(event.target.value)}
                                        className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold outline-none focus:border-black/30"
                                    />
                                    {/* <p className="mt-1 text-xs font-medium text-black/45">
                                        Sent as end of day UTC, for example 2026-05-30T23:59:59.000Z.
                                    </p> */}
                                </div>
                            </div>

                            {createMsg ? (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                                    {createMsg}
                                </div>
                            ) : null}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button
                                variant="outline"
                                className="rounded-full border-black/10"
                                onClick={() => {
                                    resetCreateForm();
                                    setIsCreateOpen(false);
                                }}
                                disabled={creating}
                            >
                                Cancel
                            </Button>

                            <Button
                                className="rounded-full bg-[#1a1a1a] px-6 font-bold text-white hover:bg-black"
                                onClick={createCoupon}
                                disabled={creating || loadingSubscriptions || !subscriptionId}
                            >
                                {creating ? "Creating..." : "Create Coupon"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}