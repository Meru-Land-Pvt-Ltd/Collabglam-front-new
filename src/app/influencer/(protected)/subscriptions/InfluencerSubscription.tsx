"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { get, post } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  CreditCard,
  X,
  Loader2,
  Crown,
  AlertTriangle,
  Info,
  Plus,
  Check,
} from "lucide-react";
import CheckoutAutoStart from "../../../../components/common/CheckoutAutoStart";
import { Button } from "@/components/ui/buttonComp";

type BillingCycle = "monthly" | "annual";
type PaymentStatus = "idle" | "processing" | "success" | "failed";

type FeatureValue =
  | number
  | boolean
  | string
  | string[]
  | Record<string, any>
  | null
  | undefined;

interface Feature {
  key: string;
  value: FeatureValue;
  note?: string;
}

interface Addon {
  key: string;
  name: string;
  type: "one_time" | "recurring";
  price: number;
  currency?: string;
  payload?: any;
}

interface Plan {
  planId: string;
  name: string;
  displayName?: string;
  monthlyCost: number;
  annualCost?: number;
  annualBillingNote?: string;
  currency?: string;
  features: Feature[];
  label?: string;
  addons?: Addon[];
  overview?: string;
  autoRenew?: boolean;
  isCustomPricing?: boolean;
  isStartingAt?: boolean;
  status?: string;
  durationMins?: number;
  sortOrder?: number;
}

interface InfluencerLite {
  influencerId: string;
  name: string;
  email: string;
  planId: string | null;
  planName: string | null;
  expiresAt?: string | null;
}

const STRIPE_HANDLED_KEY = "stripe_influencer_handled_session";

const UPGRADE_REST =
  "radial-gradient(140% 140% at 0% 20%, rgba(255, 140, 1, 0.80) 5%, rgba(255, 191, 0, 0.30) 31%, rgba(255, 255, 255, 0.50) 100%)";

const UPGRADE_HOVER =
  "radial-gradient(140% 140% at 0% 20%, rgba(255, 140, 1, 0.80) 8%, rgba(255, 191, 0, 0.40) 51%, rgba(255, 255, 255, 0.50) 100%)";

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const prettifyKey = (key: string) => key.split("_").map(capitalize).join(" ");
const currencySym = (c?: string) => (c === "INR" ? "₹" : c === "EUR" ? "€" : "$");
const normalizePlanKey = (value?: string | null) => (value || "").trim().toLowerCase();

const SUPPORT_PRETTY: Record<string, string> = {
  chat: "Chat support",
  email: "Email support",
  phone: "Phone support",
};

const ENUM_PRETTY: Record<string, Record<string, string>> = {
  media_kit: {
    included_standard: "Included (Standard)",
    included: "Included",
    shared_team_kit: "Shared team kit",
  },
  team_manager_tools: {
    not_available: "Not available",
    available: "Available",
    pro: "Available (Pro)",
  },
  dashboard_access: {
    basic: "Basic",
    standard: "Standard",
    advanced: "Advanced",
    team_workspace: "Team workspace",
  },
  active_collaborations_limit: {
    team_managed: "Team-managed",
  },
};

const FEATURE_LABELS: Record<string, string> = {
  apply_to_campaigns_quota: "Apply to Campaigns / month",
  active_collaborations_limit: "Active collaborations",
  media_kit: "Media-kit",
  support_channels: "Support",
  team_manager_tools: "Team manager tools",
  team_manager_tools_managed_creators: "Managed creators",
  dashboard_access: "Dashboard access",
  in_app_messaging: "In-app messaging",
  contract_esign_basic: "Contract e-sign (template)",
  contract_esign_download_pdf: "Download signed PDF",
  dispute_channel: "Dispute channel",
  media_kit_sections: "Media-kit sections",
  media_kit_builder: "Media-kit builder",
};

const BOOLEAN_KEYS = new Set<string>([
  "in_app_messaging",
  "contract_esign_basic",
  "contract_esign_download_pdf",
  "dispute_channel",
  "media_kit_builder",
]);

const ZERO_IS_UNLIMITED = new Set<string>([
  "apply_to_campaigns_quota",
  "active_collaborations_limit",
]);

const TRUE_MEANS_UNLIMITED = new Set<string>(["in_app_messaging"]);

const FEATURE_ORDER: string[] = [
  "apply_to_campaigns_quota",
  "active_collaborations_limit",
  "media_kit",
  "support_channels",
  "team_manager_tools",
  "team_manager_tools_managed_creators",
  "dashboard_access",
  "in_app_messaging",
  "contract_esign_basic",
  "contract_esign_download_pdf",
  "dispute_channel",
  "media_kit_sections",
  "media_kit_builder",
];

const FEATURE_ORDER_SET = new Set(FEATURE_ORDER);

const MARKETING_COPY: Record<
  string,
  {
    eyebrow?: string;
    title: string;
    subtitle: string;
    description: string;
    cta: string;
    priceNote?: string;
    annualText?: string;
    savingsText?: string;
  }
> = {
  free: {
    title: "FREE",
    subtitle: "Start building your creator profile",
    description:
      "Perfect for creators getting started with CollabGlam. Explore campaigns, build your profile, and begin applying.",
    cta: "Start Free",
    priceNote: "Free forever",
  },
  creator_plus: {
    eyebrow: "MOST POPULAR",
    title: "CREATOR PLUS",
    subtitle: "Unlock more applications and stronger profile tools",
    description:
      "Designed for active creators who want more opportunities, better visibility, and more ways to manage collaborations.",
    cta: "Choose Creator Plus",
  },
  creator_pro: {
    title: "CREATOR PRO",
    subtitle: "Scale collaborations like a pro",
    description:
      "Built for creators handling higher campaign volume, repeat brand work, and a more advanced creator business setup.",
    cta: "Choose Creator Pro",
  },
  agency: {
    title: "AGENCY",
    subtitle: "Manage creators and brand work at scale",
    description:
      "Best for talent teams and agencies managing multiple creators, more campaigns, and advanced workflows from one workspace.",
    cta: "Choose Agency",
  },
};

const getPlanTheme = (name: string) => {
  const key = normalizePlanKey(name);
  const popular =
    key === "creator_plus" ||
    key === "growth" ||
    key === "popular" ||
    key === "best_value";

  return {
    popular,
    cardBorder: popular
      ? "border-[#1a1a1a] shadow-[0_0_0_1px_rgba(26,26,26,0.16)]"
      : "border-[#ece7f2]",
    badge: "bg-[#1a1a1a] text-white shadow-lg",
  };
};

const isUnlimited = (k: string, v: FeatureValue) =>
  v === Infinity ||
  (typeof v === "number" && v === 0 && ZERO_IS_UNLIMITED.has(k)) ||
  (BOOLEAN_KEYS.has(k) && TRUE_MEANS_UNLIMITED.has(k) && Boolean(v));

const formatValue = (key: string, value: FeatureValue): string => {
  if (isUnlimited(key, value)) return "Unlimited";

  const enumMap = ENUM_PRETTY[key];
  if (enumMap) {
    const pretty = enumMap[String(value)];
    if (pretty) return pretty;
  }

  if (key === "support_channels" && Array.isArray(value)) {
    return value.length
      ? value.map((s) => SUPPORT_PRETTY[String(s).toLowerCase()] ?? String(s)).join(" + ")
      : "—";
  }

  if (
    key === "team_manager_tools_managed_creators" &&
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const { min, max } = value as { min?: number; max?: number };
    if (min != null && max != null) return `${min.toLocaleString()}–${max.toLocaleString()} creators`;
    if (min != null) return `${min.toLocaleString()}+ creators`;
    if (max != null) return `Up to ${max.toLocaleString()} creators`;
    return "—";
  }

  if (BOOLEAN_KEYS.has(key)) return Boolean(value) ? "Included" : "Not included";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "boolean") return value ? "Included" : "Not included";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "None";
  if (value == null || value === "") return "—";
  return String(value);
};

const isPositive = (key: string, v: FeatureValue) => {
  if (isUnlimited(key, v)) return true;
  if (BOOLEAN_KEYS.has(key)) return Boolean(v);
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object" && v) return true;
  return Boolean(v);
};

const getAnnualTotal = (plan: Plan) => {
  if (typeof plan.annualCost === "number" && plan.annualCost > 0) return plan.annualCost;
  if (!plan.isCustomPricing && plan.monthlyCost > 0) return plan.monthlyCost * 12;
  return 0;
};

const calcSavings = (plan: Plan) => {
  if (plan.isCustomPricing) return null;
  if (!(plan.monthlyCost > 0)) return null;

  const annualTotal = getAnnualTotal(plan);
  const monthlyTotal = plan.monthlyCost * 12;

  if (!(annualTotal > 0) || !(annualTotal < monthlyTotal)) return null;

  const amount = monthlyTotal - annualTotal;
  const pct = Math.round((amount / monthlyTotal) * 100);
  return { amount, pct };
};

const resolveMarketingCopy = (plan: Plan) => {
  const key = normalizePlanKey(plan.name);
  return (
    MARKETING_COPY[key] ?? {
      title: plan.displayName || plan.name.toUpperCase(),
      subtitle: plan.overview || "Built for creators ready to grow.",
      description:
        plan.overview || "Unlock more collaborations, stronger profile tools, and better campaign access.",
      cta: plan.monthlyCost <= 0 ? "Start Free" : "Choose Plan",
    }
  );
};

export default function InfluencerSubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [paymentMessage, setPaymentMessage] = useState<string>("");

  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [confirming, setConfirming] = useState(false);

  const currentPlanKey = normalizePlanKey(currentPlan);

  const stripStripeParamsFromUrl = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("stripe_success");
    url.searchParams.delete("stripe_cancel");
    url.searchParams.delete("session_id");
    window.history.replaceState({}, "", url.toString());
  }, []);

  useEffect(() => {
    const stripeSuccess = searchParams.get("stripe_success");
    const stripeCancel = searchParams.get("stripe_cancel");
    const sessionId = searchParams.get("session_id");

    if (stripeCancel) {
      stripStripeParamsFromUrl();
      setPaymentStatus("failed");
      setPaymentMessage("Payment cancelled.");
      return;
    }

    if (stripeSuccess && sessionId) {
      if (typeof window !== "undefined") {
        const handled = sessionStorage.getItem(STRIPE_HANDLED_KEY);
        if (handled === sessionId) {
          stripStripeParamsFromUrl();
          return;
        }
        sessionStorage.setItem(STRIPE_HANDLED_KEY, sessionId);
      }

      stripStripeParamsFromUrl();

      (async () => {
        setPaymentStatus("processing");
        setPaymentMessage("Verifying payment…");

        try {
          const verifyResp = await post<{
            success: boolean;
            message?: string;
            planId?: string;
            planName?: string;
          }>("/payment/verify", { sessionId });

          if (!verifyResp?.success) {
            throw new Error(verifyResp?.message || "Payment not verified.");
          }

          const influencerId = localStorage.getItem("influencerId");
          const planId = verifyResp.planId || localStorage.getItem("pendingInfluencerPlanId") || "";
          const planName =
            verifyResp.planName || localStorage.getItem("pendingInfluencerPlanName") || "";
          const pendingBilling =
            (localStorage.getItem("pendingInfluencerBillingCycle") as BillingCycle | null) || "monthly";

          if (!influencerId || !planId) {
            throw new Error("Missing influencerId/planId for subscription assignment.");
          }

          await post("/subscription/assign", {
            userType: "Influencer",
            userId: influencerId,
            planId,
            billingCycle: pendingBilling,
          });

          setCurrentPlan(planName || null);
          setExpiresAt(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

          localStorage.setItem("influencerPlanId", planId);
          if (planName) localStorage.setItem("influencerPlanName", planName);

          localStorage.removeItem("pendingInfluencerPlanId");
          localStorage.removeItem("pendingInfluencerPlanName");
          localStorage.removeItem("pendingInfluencerBillingCycle");

          setPaymentStatus("success");
          setPaymentMessage("Subscription updated successfully!");
          setProcessing(null);
          router.refresh?.();
        } catch (e: any) {
          console.error(e);
          setPaymentStatus("failed");
          setPaymentMessage(e?.message || "Payment verification failed. Please contact support.");
          setProcessing(null);
        }
      })();
    }
  }, [router, searchParams, stripStripeParamsFromUrl]);

  useEffect(() => {
    (async () => {
      try {
        const { plans: fetched } = await post<{ plans: Plan[] }>("/subscription/list", {
          role: "Influencer",
        });

        const rank = (n: string) =>
          ({ free: 0, creator_plus: 2, creator_pro: 3, agency: 9 } as Record<string, number>)[
            normalizePlanKey(n)
          ] ?? 5;

        const sorted = (fetched || [])
          .slice()
          .sort(
            (a, b) =>
              (a.sortOrder ?? 999) - (b.sortOrder ?? 999) ||
              rank(a.name) - rank(b.name) ||
              (a.monthlyCost ?? 0) - (b.monthlyCost ?? 0)
          );

        setPlans(sorted);

        const id = localStorage.getItem("influencerId");
        if (id) {
          const lite = await get<InfluencerLite>(`/influencer/lite?id=${id}`);
          setCurrentPlan(lite?.planName || null);
          setExpiresAt(lite?.expiresAt ?? null);
        }
      } catch (e) {
        console.error("Failed to fetch subscription data", e);
        setPaymentStatus("failed");
        setPaymentMessage("Unable to load subscription info.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentPlanObj = useMemo(
    () => plans.find((p) => normalizePlanKey(p.name) === currentPlanKey),
    [plans, currentPlanKey]
  );

  const maxSavingsPct = useMemo(() => {
    const pcts = plans
      .map((p) => calcSavings(p)?.pct)
      .filter((v): v is number => typeof v === "number" && v > 0);
    return pcts.length ? Math.max(...pcts) : 0;
  }, [plans]);

  const featureLoss = useMemo(() => {
    if (!currentPlanObj || !selectedPlan) return [] as { key: string; from: any; to: any }[];

    const mapNew = new Map(selectedPlan.features.map((f) => [f.key, f.value]));
    const union = Array.from(
      new Set([
        ...currentPlanObj.features.map((f) => f.key),
        ...selectedPlan.features.map((f) => f.key),
      ])
    );

    return union
      .map((k) => {
        const from = currentPlanObj.features.find((f) => f.key === k)?.value;
        const to = mapNew.get(k);

        const loss = (() => {
          if (isUnlimited(k, from) && !isUnlimited(k, to)) return true;
          if (BOOLEAN_KEYS.has(k)) return Boolean(from) && !Boolean(to);
          if (typeof from === "number" && typeof to === "number") return to < from;
          if (typeof from === "boolean" && typeof to === "boolean") return from && !to;
          if (Array.isArray(from) && Array.isArray(to)) return to.length < from.length;
          if ((from == null) !== (to == null)) return from != null && to == null;
          return false;
        })();

        return loss ? { key: k, from, to } : null;
      })
      .filter(Boolean) as { key: string; from: any; to: any }[];
  }, [currentPlanObj, selectedPlan]);

  const getPayAmount = useCallback(
    (plan: Plan) => {
      if (billing === "annual") return getAnnualTotal(plan) || plan.monthlyCost * 12;
      return plan.monthlyCost;
    },
    [billing]
  );

  const handleSelect = useCallback(
    async (plan: Plan) => {
      if (processing || normalizePlanKey(plan.name) === currentPlanKey) return;

      if (plan.monthlyCost <= 0) {
        setSelectedPlan(plan);
        setShowDowngradeModal(true);
        setPaymentStatus("idle");
        setPaymentMessage("");
        return;
      }

      setProcessing(plan.name);
      setPaymentStatus("processing");
      setPaymentMessage(
        billing === "annual" ? "Redirecting to annual checkout…" : "Redirecting to secure checkout…"
      );

      try {
        const influencerId = localStorage.getItem("influencerId");
        if (!influencerId) throw new Error("Missing influencerId.");

        localStorage.setItem("pendingInfluencerPlanId", plan.planId);
        localStorage.setItem("pendingInfluencerPlanName", plan.name);
        localStorage.setItem("pendingInfluencerBillingCycle", billing);

        const amount = getPayAmount(plan);

        const resp = await post<{
          success: boolean;
          url?: string;
          sessionId?: string;
          message?: string;
        }>("/payment/Order", {
          planId: plan.planId,
          amount,
          currency: plan.currency || "USD",
          userId: influencerId,
          role: "Influencer",
          billingCycle: billing,
        });

        if (!resp?.success || !resp?.url) {
          throw new Error(resp?.message || "Failed to start checkout.");
        }

        window.location.href = resp.url;
      } catch (err: any) {
        console.error("Stripe checkout start failed:", err);
        setPaymentStatus("failed");
        setPaymentMessage(err?.message || "Failed to initiate payment. Try again later.");
        setProcessing(null);
      }
    },
    [billing, currentPlanKey, getPayAmount, processing]
  );

  const handleConfirmDowngrade = useCallback(async () => {
    if (!selectedPlan) return;
    if (confirmText.trim().toUpperCase() !== "CANCEL") return;

    setConfirming(true);
    setPaymentStatus("processing");
    setPaymentMessage("");

    try {
      const influencerId = localStorage.getItem("influencerId");
      await post("/subscription/assign", {
        userType: "Influencer",
        userId: influencerId,
        planId: selectedPlan.planId,
        billingCycle: "monthly",
      });

      setCurrentPlan(selectedPlan.name);
      setExpiresAt(null);

      localStorage.setItem("influencerPlanName", selectedPlan.name);
      localStorage.setItem("influencerPlanId", selectedPlan.planId);

      setPaymentStatus("success");
      setPaymentMessage(`You've moved to the ${selectedPlan.displayName || capitalize(selectedPlan.name)} plan.`);
      setShowDowngradeModal(false);
      setConfirmText("");
    } catch {
      setPaymentStatus("failed");
      setPaymentMessage("Could not change your plan right now. Please try again.");
    } finally {
      setConfirming(false);
    }
  }, [confirmText, selectedPlan]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcf8ff] px-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#1a1a1a]" />
        <p className="mt-4 text-sm text-slate-600">Loading pricing plans…</p>
      </div>
    );
  }

  return (
    <>
      <CheckoutAutoStart role="Influencer" plans={plans} loading={loading} />

      <section className="min-h-screen py-16 font-lexend text-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-[#d1d1d1] bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]">
              CollabGlam Creator Plans
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#250054] sm:text-5xl">
              Grow Your Creator Profile. Unlock More Campaigns.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Apply to more campaigns, strengthen your media kit, and manage creator-brand collaborations with more control.
            </p>
            <p className="mt-3 text-sm font-medium text-slate-500">
              No setup fees • Cancel anytime • Creator-friendly billing
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="inline-flex rounded-lg border border-[#eadcf5] bg-white p-1 shadow-sm">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                  billing === "monthly" ? "bg-[#1a1a1a] text-white" : "text-slate-600"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                  billing === "annual" ? "bg-[#1a1a1a] text-white" : "text-slate-600"
                }`}
              >
                Annual
              </button>
            </div>

            {maxSavingsPct > 0 && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Save up to {maxSavingsPct}% yearly
              </span>
            )}
          </div>

          {currentPlan && (
            <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-[#eadcf5] bg-white px-6 py-5 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#1a1a1a]">
                <CheckCircle className="h-4 w-4" /> Current Plan
              </div>
              <h2 className="mt-2 text-2xl font-bold text-[#250054]">
                {currentPlanObj?.displayName || capitalize(currentPlan)}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {expiresAt
                  ? `Renews on ${new Date(expiresAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}`
                  : "No renewal date set"}
              </p>
            </div>
          )}

          {paymentStatus !== "idle" && (
            <div className="mx-auto mt-6 max-w-xl rounded-2xl border bg-white px-5 py-4 shadow-sm">
              <div
                className={`flex items-center justify-center gap-3 text-sm font-medium ${
                  paymentStatus === "success"
                    ? "text-emerald-700"
                    : paymentStatus === "failed"
                    ? "text-rose-700"
                    : "text-amber-700"
                }`}
              >
                {paymentStatus === "success" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : paymentStatus === "failed" ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
                <span>{paymentMessage}</span>
              </div>
            </div>
          )}

          <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const key = normalizePlanKey(plan.name);
              const copy = resolveMarketingCopy(plan);
              const theme = getPlanTheme(key);
              const isFree = plan.monthlyCost <= 0;
              const isActive = currentPlanKey === key;
              const isProcessing = processing === plan.name;
              const symbol = currencySym(plan.currency);
              const annualTotal = getAnnualTotal(plan);
              const savings = calcSavings(plan);

              const displayedPrice = isFree
                ? copy.priceNote ?? "Free forever"
                : billing === "annual"
                ? `${symbol}${annualTotal.toLocaleString()}/year`
                : `${symbol}${plan.monthlyCost.toLocaleString()}/month`;

              const fmap = new Map(plan.features.map((f) => [f.key, f]));
              const ordered = FEATURE_ORDER.map((k) => fmap.get(k)).filter(Boolean) as Feature[];
              const leftovers = plan.features.filter((f) => !FEATURE_ORDER_SET.has(f.key));
              const features = [...ordered, ...leftovers];

              return (
                <article
                  key={plan.planId}
                  className={`relative flex h-full flex-col overflow-hidden rounded-[28px] border bg-white ${theme.cardBorder}`}
                >
                  {!!plan.label && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center rounded-full bg-[#1a1a1a] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                        {plan.label}
                      </span>
                    </div>
                  )}

                  <div className="flex min-h-[220px] flex-col px-8 pt-10 pb-8">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#d1d1d1] bg-[#f5f5f5]">
                      <Crown className="h-5 w-5 text-[#1a1a1a]" />
                    </div>

                    <h3 className="text-3xl font-bold text-[#250054]">{copy.title}</h3>
                    <p className="mt-3 text-base font-medium text-slate-700">{copy.subtitle}</p>
                    <p className="mt-3 text-[15px] leading-7 text-slate-600">{copy.description}</p>
                  </div>

                  <div
                    className="border-t border-[#ece7f2] px-8 py-7 transition-all duration-200"
                    style={isActive ? { backgroundImage: UPGRADE_REST } : undefined}
                    onMouseEnter={(e) => {
                      if (isActive) e.currentTarget.style.backgroundImage = UPGRADE_HOVER;
                    }}
                    onMouseLeave={(e) => {
                      if (isActive) e.currentTarget.style.backgroundImage = UPGRADE_REST;
                    }}
                  >
                    <div className="flex items-end gap-2 text-[#250054]">
                      <span className="text-4xl font-bold tracking-tight">
                        {displayedPrice.replace(/\/(month|year)$/, "")}
                      </span>
                      {!isFree && (
                        <span className="pb-1 text-base text-slate-500">
                          /{billing === "annual" ? "year" : "month"}
                        </span>
                      )}
                    </div>

                    {isFree && <p className="mt-1 text-sm text-slate-500">Free forever</p>}

                    {!isFree && billing === "annual" && (
                      <>
                        <p className="mt-2 text-sm text-slate-500">
                          {symbol}
                          {Math.round((annualTotal > 0 ? annualTotal : plan.monthlyCost * 12) / 12).toLocaleString()}{" "}
                          / month billed annually
                          {plan.annualBillingNote ? ` • ${plan.annualBillingNote}` : ""}
                        </p>
                        {savings && (
                          <p className="mt-2 text-sm font-semibold text-emerald-700">
                            Save {savings.pct}% ({symbol}
                            {Math.round(savings.amount).toLocaleString()} / year)
                          </p>
                        )}
                      </>
                    )}

                    {!isFree && billing === "monthly" && annualTotal > 0 && (
                      <p className="mt-2 text-sm text-slate-500">
                        or {symbol}
                        {annualTotal.toLocaleString()} / year
                        {plan.annualBillingNote ? ` • ${plan.annualBillingNote}` : ""}
                      </p>
                    )}

                    <Button
                      onClick={() => handleSelect(plan)}
                      disabled={isActive || isProcessing}
                      className="mt-6 w-full border border-[#e7d7b4] text-[#1a1a1a] hover:text-[#1a1a1a]"
                      style={isActive ? { backgroundImage: UPGRADE_REST } : undefined}
                      onMouseEnter={(e) => {
                        if (isActive) e.currentTarget.style.backgroundImage = UPGRADE_HOVER;
                      }}
                      onMouseLeave={(e) => {
                        if (isActive) e.currentTarget.style.backgroundImage = UPGRADE_REST;
                      }}
                    >
                      {isActive ? (
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" /> Current Plan
                        </span>
                      ) : isProcessing ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          {copy.cta}
                        </span>
                      )}
                    </Button>
                  </div>

                  <div className="flex-1 border-t border-[#ece7f2] px-8 py-8">
                    <div className="space-y-7">
                      <div>
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Included Features
                        </h4>
                        <ul className="space-y-3">
                          {features.map((f) => {
                            const label = FEATURE_LABELS[f.key] || prettifyKey(f.key);
                            const val = formatValue(f.key, f.value);
                            const ok = isPositive(f.key, f.value);

                            return (
                              <li
                                key={f.key}
                                className="flex items-start gap-3 text-[15px] leading-6 text-slate-700"
                              >
                                {ok ? (
                                  <Check className="mt-1 h-4 w-4 flex-shrink-0 text-[#1a1a1a]" />
                                ) : (
                                  <XCircle className="mt-1 h-4 w-4 flex-shrink-0 text-rose-500" />
                                )}
                                <div>
                                  <span className="font-medium">{label}:</span>{" "}
                                  <span>{val}</span>
                                  {f.note && (
                                    <span className="ml-2 inline-flex items-center text-xs text-slate-500">
                                      <Info className="mr-1 h-3.5 w-3.5" />
                                      {f.note}
                                    </span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {plan.addons && plan.addons.length > 0 && (
                        <div>
                          <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Available Add-ons
                          </h4>
                          <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-4">
                            <ul className="space-y-2">
                              {plan.addons.map((a) => {
                                const symb = currencySym(a.currency);
                                return (
                                  <li key={a.key} className="flex items-start gap-2 text-sm text-orange-900">
                                    <Plus className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                    <span>
                                      <span className="font-medium">{a.name}</span> — {symb}
                                      {Number(a.price).toLocaleString()}{" "}
                                      {a.type === "one_time" ? "one-time" : "/mo"}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-12 rounded-[28px] border border-[#eadcf5] bg-white px-8 py-8 shadow-sm">
            <h3 className="text-center text-xl font-bold text-[#250054]">All paid plans include</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                "More campaign visibility",
                "Flexible billing",
                "Secure payments",
                "Creator profile tools",
                "Dedicated support",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-[#f0e8f7] bg-[#fcf8ff] px-4 py-4 text-center text-sm font-medium text-slate-700"
                >
                  <CheckCircle className="h-4 w-4 text-[#1a1a1a]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Need details before upgrading? Review our{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#1a1a1a] underline underline-offset-4"
            >
              Terms of Service
            </Link>
            .
          </p>
        </div>

        {showDowngradeModal && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/60"
              onClick={() => setShowDowngradeModal(false)}
            />
            <div className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#eadcf5] bg-white shadow-2xl">
              <div className="border-b border-[#ece7f2] bg-[#fff7ed] px-8 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-orange-100 p-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#250054]">Before you change your plan</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Some features may be reduced when you move plans.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDowngradeModal(false)}
                    className="rounded-full p-2 hover:bg-white"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-5 px-8 py-6">
                <p className="text-sm leading-7 text-slate-700">
                  You are moving to{" "}
                  <span className="font-semibold text-[#250054]">
                    {selectedPlan.displayName || capitalize(selectedPlan.name)}
                  </span>
                  .
                </p>

                {featureLoss.length > 0 && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-5">
                    <p className="font-semibold text-rose-800">Reduced allowances</p>
                    <ul className="mt-3 space-y-2 text-sm text-rose-700">
                      {featureLoss.map((item) => (
                        <li key={item.key} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-rose-400" />
                          <span>
                            {(FEATURE_LABELS[item.key] || prettifyKey(item.key))}:{" "}
                            {formatValue(item.key, item.from)} → {formatValue(item.key, item.to)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-5 text-sm text-orange-900">
                  Need a better fit instead? Email{" "}
                  <a href="mailto:support@collabglam.com" className="font-semibold underline">
                    support@collabglam.com
                  </a>
                  .
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Type CANCEL to confirm</span>
                  <input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1a1a1a]"
                  />
                </label>
              </div>

              <div className="flex flex-col justify-end gap-3 border-t border-[#ece7f2] bg-slate-50 px-8 py-5 sm:flex-row">
                <button
                  onClick={() => setShowDowngradeModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700"
                >
                  Keep Current Plan
                </button>
                <button
                  onClick={handleConfirmDowngrade}
                  disabled={confirmText.trim().toUpperCase() !== "CANCEL" || confirming}
                  className="rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {confirming ? "Applying…" : "Confirm Change"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}