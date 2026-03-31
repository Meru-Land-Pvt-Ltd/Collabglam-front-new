"use client";

import React, { useEffect, useMemo, useState } from "react";
import { get, post } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Check,
  X,
  Loader2,
  Crown,
  AlertTriangle,
} from "lucide-react";
import CheckoutAutoStart from "@/components/common/CheckoutAutoStart";
import { Button } from "@/components/ui/buttonComp";

type BillingCycle = "monthly" | "annual";
type PaymentStatus = "idle" | "processing" | "success" | "failed";

interface Feature {
  key: string;
  value: number | boolean | string | string[] | null | undefined | { unlimited?: boolean };
  note?: string;
}

interface Plan {
  _id?: string;
  planId: string;
  role: "Brand";
  name: string;
  displayName?: string;
  label?: string;
  overview?: string;
  monthlyCost: number;
  annualCost?: number;
  currency?: string;
  isCustomPricing?: boolean;
  isStartingAt?: boolean;
  annualBillingNote?: string;
  sortOrder?: number;
  features: Feature[];
}

interface BrandSubscription {
  planName: string;
  expiresAt: string | null;
}

interface BrandProfile {
  name?: string;
  brandName?: string;
  email: string;
  subscription: BrandSubscription | null;
}

interface BrandResponse {
  success: boolean;
  data: BrandProfile;
}

const STRIPE_HANDLED_KEY = "stripe_subscription_handled_session";

const currencySymbol = (c?: string) => (c === "INR" ? "₹" : c === "EUR" ? "€" : "$");
const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

const UPGRADE_REST =
  "radial-gradient(140% 140% at 0% 20%, rgba(255, 140, 1, 0.80) 5%, rgba(255, 191, 0, 0.30) 31%, rgba(255, 255, 255, 0.50) 100%)";

const UPGRADE_HOVER =
  "radial-gradient(140% 140% at 0% 20%, rgba(255, 140, 1, 0.80) 8%, rgba(255, 191, 0, 0.40) 51%, rgba(255, 255, 255, 0.50) 100%)";

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
    sections: { title?: string; items: string[] }[];
  }
> = {
  free: {
    title: "FREE",
    subtitle: "Get Started — No Risk, No Cost",
    description:
      "Perfect for brands exploring influencer marketing for the first time. Start building relationships and test campaigns before upgrading.",
    cta: "Start Free",
    priceNote: "Free forever",
    sections: [
      {
        title: "What You Can Do",
        items: [
          "Invite up to 20 influencers per month",
          "Run up to 5 active campaigns",
          "Search for 20 influencers monthly",
          "View 3 influencer profiles each month",
          "Access creators on Instagram, TikTok, and YouTube",
          "Send direct invites to influencers",
          "Manage milestones and payouts",
          "Use basic message templates",
          "Create and manage campaigns yourself",
          "Standard support included",
          "Shortlist delivery included",
          "Negotiation and follow-ups handled by you",
        ],
      },
    ],
  },
  growth: {
    eyebrow: "MOST POPULAR",
    title: "GROWTH",
    subtitle: "Scale Your Influencer Marketing With Confidence",
    description:
      "Designed for brands ready to run consistent campaigns and grow their reach faster. This plan gives you the right balance of flexibility, performance, and support.",
    cta: "Start Growing",
    annualText: "$948 per year",
    savingsText: "Save 20% ($240 per year)",
    sections: [
      {
        title: "What You Get",
        items: [
          "Invite up to 150 influencers every month",
          "Run up to 10 active campaigns simultaneously",
          "Search 150 influencers per month",
          "View 50 influencer profiles monthly",
          "Use advanced filters to find the right creators faster",
          "Get help resolving disputes when needed",
          "Access creators across Instagram, TikTok, and YouTube",
          "Send unlimited outreach emails",
          "Manage campaign milestones and payouts",
          "Create custom message templates",
          "Receive email support from our team",
          "Shortlist delivery included",
          "Negotiation and follow-ups handled by you",
        ],
      },
      {
        title: "Why Brands Choose This Plan",
        items: [
          "Run multiple campaigns at the same time",
          "Reach more influencers faster",
          "Improve campaign efficiency",
          "Scale marketing without hiring an agency",
        ],
      },
    ],
  },
  pro: {
    title: "PRO",
    subtitle: "Run Large-Scale Campaigns Without Limits",
    description:
      "Built for brands managing high-volume collaborations and multiple campaigns. This plan gives you the capacity, speed, and support needed to scale influencer marketing operations.",
    cta: "Scale Campaigns",
    annualText: "$2,988 per year",
    savingsText: "Save 17% ($600 per year)",
    sections: [
      {
        title: "What You Get",
        items: [
          "Invite up to 750 influencers per month",
          "Run up to 30 active campaigns",
          "Search 750 influencers monthly",
          "View 150 influencer profiles each month",
          "Advanced filters for precise targeting",
          "Priority dispute assistance",
          "Access creators on Instagram, TikTok, and YouTube",
          "Send direct outreach messages",
          "Manage payouts and campaign milestones",
          "Use custom and saved message templates",
          "Receive phone and email support",
          "Shortlist delivery included",
          "Negotiation and follow-ups handled by you",
        ],
      },
      {
        title: "Why Brands Upgrade to Pro",
        items: [
          "Manage large campaigns efficiently",
          "Work with hundreds of influencers",
          "Increase campaign reach",
          "Save time on campaign management",
        ],
      },
    ],
  },
  fully_managed: {
    title: "FULLY MANAGED",
    subtitle: "Let Our Experts Run Your Campaigns",
    description:
      "The easiest way to scale influencer marketing without building an internal team. Our specialists handle everything from sourcing creators to managing campaigns and negotiations.",
    cta: "Contact Sales",
    priceNote: "$2999/month starting",
    sections: [
      {
        title: "What We Handle For You",
        items: [
          "Unlimited influencer outreach managed by our team",
          "Unlimited influencer search and profile access",
          "Campaign execution handled end-to-end",
          "Priority dispute assistance",
          "Dedicated campaign manager",
          "Managed email inbox",
          "We create and send outreach messages",
          "We manage milestones and payouts",
          "We negotiate with creators on your behalf",
          "We deliver a curated shortlist of influencers",
          "Shortlist delivered within 48 hours",
          "Campaign capacity scales as needed",
          "Creator payments handled separately — you control the budget",
        ],
      },
      {
        title: "Why Brands Choose Fully Managed",
        items: [
          "No hiring required",
          "No manual outreach",
          "Faster campaign execution",
          "Expert campaign management",
          "Predictable results",
        ],
      },
    ],
  },
};

const getPlanTheme = (name: string) => {
  const key = name.toLowerCase();
  const popular = key === "growth";

  return {
    popular,
    cardBorder: popular
      ? "border-[#1a1a1a] shadow-[0_0_0_1px_rgba(26,26,26,0.16)]"
      : "border-[#ece7f2]",
    badge: "bg-[#1a1a1a] text-white shadow-lg",
  };
};

const getAnnualTotal = (plan: Plan) => {
  if (typeof plan.annualCost === "number" && plan.annualCost > 0) return plan.annualCost;
  if (!plan.isCustomPricing && plan.monthlyCost > 0) return plan.monthlyCost * 12;
  return 0;
};

const stripStripeParamsFromUrl = () => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("stripe_success");
  url.searchParams.delete("stripe_cancel");
  url.searchParams.delete("session_id");
  window.history.replaceState({}, "", url.toString());
};

const resolveMarketingCopy = (plan: Plan) => {
  const key = plan.name.toLowerCase();
  return (
    MARKETING_COPY[key] ?? {
      title: plan.displayName || plan.name.toUpperCase(),
      subtitle: plan.overview || "Built for growing brands.",
      description: plan.overview || "Flexible creator collaboration tools for your brand.",
      cta: plan.monthlyCost <= 0 ? "Start Free" : "Choose Plan",
      sections: [
        {
          items: ["Instagram creator access", "TikTok creator access", "YouTube creator access"],
        },
      ],
    }
  );
};

export default function BrandSubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");

  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [submittingDowngrade, setSubmittingDowngrade] = useState(false);

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactToast, setContactToast] = useState<{
    type: "idle" | "success" | "failed";
    message: string;
  }>({
    type: "idle",
    message: "",
  });

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

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

          const brandId = localStorage.getItem("brandId");
          const planId = verifyResp.planId || localStorage.getItem("pendingPlanId") || "";
          const billingCycle =
            (localStorage.getItem("pendingBillingCycle") as BillingCycle | null) || "monthly";

          if (!brandId || !planId) {
            throw new Error("Missing brandId/planId for subscription assignment.");
          }

          const assignResp = await post<{
            message: string;
            subscription?: { planId?: string; planName?: string; expiresAt?: string | null };
          }>("/subscription/assign", {
            userType: "Brand",
            userId: brandId,
            planId,
            billingCycle,
          });

          const planName =
            assignResp?.subscription?.planName ||
            verifyResp.planName ||
            localStorage.getItem("pendingPlanName") ||
            "";

          setCurrentPlan(planName || null);
          setExpiresAt(assignResp?.subscription?.expiresAt ?? null);

          localStorage.setItem("brandPlanId", planId);
          if (planName) localStorage.setItem("brandPlanName", planName);

          localStorage.removeItem("pendingPlanId");
          localStorage.removeItem("pendingPlanName");
          localStorage.removeItem("pendingBillingCycle");

          setPaymentStatus("success");
          setPaymentMessage("Subscription updated successfully!");
          router.refresh?.();
        } catch (e: any) {
          setPaymentStatus("failed");
          setPaymentMessage(e?.message || "Payment verification failed. Please contact support.");
        }
      })();
    }
  }, [router, searchParams]);

  useEffect(() => {
    (async () => {
      try {
        const { plans: fetched } = await post<{ message: string; plans: Plan[] }>(
          "/subscription/list",
          { role: "Brand" }
        );

        console.log("fetched plans:", fetched);

        const sorted = (fetched || [])
          .slice()
          .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

        setPlans(sorted);

        const id = localStorage.getItem("brandId");
        console.log("brandId:", id);

        if (id) {
          const brandResp = await get<BrandResponse>(`/brand/${id}`);
          const brand = brandResp?.data;

          console.log("brand response:", brandResp);
          console.log("brand data:", brand);
          console.log("current subscription plan:", brand?.subscription?.planName);

          setCurrentPlan(brand?.subscription?.planName || null);
          setExpiresAt(brand?.subscription?.expiresAt ?? null);
          setContactForm((prev) => ({
            ...prev,
            name: brand?.name || brand?.brandName || "",
            email: brand?.email || "",
          }));
        }
      } catch (error) {
        console.error("subscription load error:", error);
        setPaymentStatus("failed");
        setPaymentMessage("Unable to load subscription info. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentPlanObj = useMemo(
    () => plans.find((p) => p.name.toLowerCase() === currentPlan?.toLowerCase()),
    [plans, currentPlan]
  );

  const fullyManagedPlan = useMemo(
    () =>
      plans.find((p) => {
        const key = p.name.toLowerCase();
        return key === "fully_managed" || key === "enterprise" || !!p.isCustomPricing;
      }) ?? null,
    [plans]
  );

  const standardPlans = useMemo(
    () =>
      plans.filter((p) => {
        const key = p.name.toLowerCase();
        return !(key === "fully_managed" || key === "enterprise" || !!p.isCustomPricing);
      }),
    [plans]
  );

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
          if (typeof from === "number" && typeof to === "number") return to < from;
          if (typeof from === "boolean" && typeof to === "boolean") return from && !to;
          if (Array.isArray(from) && Array.isArray(to)) return to.length < from.length;
          return false;
        })();

        return loss ? { key: k, from, to } : null;
      })
      .filter(Boolean) as { key: string; from: any; to: any }[];
  }, [currentPlanObj, selectedPlan]);

  const openContactModal = () => {
    setContactToast({ type: "idle", message: "" });
    setContactForm((prev) => ({
      ...prev,
      subject: prev.subject || "Fully Managed plan enquiry",
      message:
        prev.message ||
        "Hi CollabGlam team, we want help running our campaigns with a managed plan. Please share next steps.",
    }));
    setShowContactModal(true);
  };

  const handleSendContact = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const { name, email, subject, message } = contactForm;

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setContactToast({ type: "failed", message: "All fields are required." });
      return;
    }

    setContactSubmitting(true);
    setContactToast({ type: "idle", message: "" });

    try {
      await post("/contact/send", { name, email, subject, message });
      setContactToast({ type: "success", message: "Message sent successfully!" });
      setShowContactModal(false);
    } catch {
      setContactToast({ type: "failed", message: "Could not send message. Please try again." });
    } finally {
      setContactSubmitting(false);
    }
  };

  const getPayAmount = (plan: Plan) => {
    if (billing === "annual") return getAnnualTotal(plan) || plan.monthlyCost * 12;
    return plan.monthlyCost;
  };

  const handleSelect = async (plan: Plan) => {
    if (processing || plan.name.toLowerCase() === currentPlan?.toLowerCase()) return;

    const key = plan.name.toLowerCase();
    const isManagedPlan = key === "fully_managed" || key === "enterprise" || !!plan.isCustomPricing;

    if (isManagedPlan) {
      openContactModal();
      return;
    }

    if (plan.monthlyCost <= 0) {
      setSelectedPlan(plan);
      setShowDowngradeModal(true);
      setPaymentStatus("idle");
      setPaymentMessage("");
      return;
    }

    setProcessing(plan.name);
    setPaymentStatus("processing");
    setPaymentMessage("Redirecting to secure checkout…");

    try {
      const brandId = localStorage.getItem("brandId");
      if (!brandId) throw new Error("Missing brandId.");

      localStorage.setItem("pendingPlanId", plan.planId);
      localStorage.setItem("pendingPlanName", plan.name);
      localStorage.setItem("pendingBillingCycle", billing);

      const resp = await post<{ success: boolean; url?: string; message?: string }>(
        "/payment/Order",
        {
          planId: plan.planId,
          amount: getPayAmount(plan),
          currency: plan.currency || "USD",
          userId: brandId,
          role: "Brand",
          billingCycle: billing,
        }
      );

      if (!resp?.success || !resp?.url) {
        throw new Error(resp?.message || "Failed to start checkout.");
      }

      window.location.href = resp.url;
    } catch (e: any) {
      setPaymentStatus("failed");
      setPaymentMessage(e?.message || "Failed to initiate payment. Try again later.");
      setProcessing(null);
    }
  };

  const handleConfirmDowngrade = async () => {
    if (!selectedPlan || confirmText.trim().toUpperCase() !== "CANCEL") return;

    setSubmittingDowngrade(true);
    try {
      const brandId = localStorage.getItem("brandId");
      await post("/subscription/assign", {
        userType: "Brand",
        userId: brandId,
        planId: selectedPlan.planId,
        billingCycle: "monthly",
      });

      setCurrentPlan(selectedPlan.name);
      setExpiresAt(null);
      localStorage.setItem("brandPlanName", selectedPlan.name);
      localStorage.setItem("brandPlanId", selectedPlan.planId);
      setPaymentStatus("success");
      setPaymentMessage(`You've moved to the ${capitalize(selectedPlan.name)} plan.`);
      setShowDowngradeModal(false);
      setConfirmText("");
    } catch {
      setPaymentStatus("failed");
      setPaymentMessage("Could not change your plan right now. Please try again.");
    } finally {
      setSubmittingDowngrade(false);
    }
  };

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
      <CheckoutAutoStart role="Brand" plans={plans} loading={loading} />

      <section className="min-h-screen py-16 font-lexend text-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-[#d1d1d1] bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]">
              CollabGlam Pricing Plans
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#250054] sm:text-5xl">
              Find Influencers. Launch Campaigns. Grow Faster.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Start collaborating with verified creators across Instagram, TikTok, and YouTube —
              all from one platform.
            </p>
            <p className="mt-3 text-sm font-medium text-slate-500">
              No setup fees • Cancel anytime • 7-day Money-Back Guarantee
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="inline-flex rounded-lg border border-[#eadcf5] bg-white p-1 shadow-sm">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${billing === "monthly" ? "bg-[#1a1a1a] text-white" : "text-slate-600"
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${billing === "annual" ? "bg-[#1a1a1a] text-white" : "text-slate-600"
                  }`}
              >
                Annual
              </button>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Save more yearly
            </span>
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
                className={`flex items-center justify-center gap-3 text-sm font-medium ${paymentStatus === "success"
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

          <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {standardPlans.map((plan) => {
              const key = plan.name.toLowerCase();
              const copy = resolveMarketingCopy(plan);
              const theme = getPlanTheme(key);
              const isFree = plan.monthlyCost <= 0;
              const isActive = !!currentPlan && currentPlan.toLowerCase() === key;
              const isProcessing = processing === plan.name;
              const symbol = currencySymbol(plan.currency);
              const annualTotal = getAnnualTotal(plan);

              const displayedPrice = isFree
                ? copy.priceNote ?? "Free forever"
                : billing === "annual"
                  ? `${symbol}${annualTotal.toLocaleString()}/year`
                  : `${symbol}${plan.monthlyCost.toLocaleString()}/month`;

              return (
                <article
                  key={plan._id || plan.planId}
                  className={`relative flex h-full flex-col overflow-hidden rounded-[28px] border bg-white ${theme.cardBorder}`}
                >
                  <div className="flex min-h-[240px] flex-col px-8 pt-10 pb-8">
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

                    {!isFree && billing === "annual" && copy.savingsText && (
                      <p className="mt-2 text-sm font-semibold text-emerald-700">
                        {copy.savingsText}
                      </p>
                    )}

                    {!isFree && billing === "monthly" && copy.annualText && (
                      <p className="mt-2 text-sm text-slate-500">or {copy.annualText}</p>
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
                        copy.cta
                      )}
                    </Button>
                  </div>

                  <div className="flex-1 border-t border-[#ece7f2] px-8 py-8">
                    <div className="space-y-7">
                      {copy.sections.map((section) => (
                        <div key={section.title || section.items.join("|")}>
                          {section.title && (
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                              {section.title}
                            </h4>
                          )}
                          <ul className="space-y-3">
                            {section.items.map((item) => (
                              <li
                                key={item}
                                className="flex items-start gap-3 text-[15px] leading-6 text-slate-700"
                              >
                                <Check className="mt-1 h-4 w-4 flex-shrink-0 text-[#1a1a1a]" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {fullyManagedPlan && (() => {
            const plan = fullyManagedPlan;
            const key = plan.name.toLowerCase();
            const copy = resolveMarketingCopy(plan);
            const theme = getPlanTheme(key);
            const isActive = !!currentPlan && currentPlan.toLowerCase() === key;
            const isProcessing = processing === plan.name;

            return (
              <div className="mt-8 w-full">
                <article
                  className={`relative flex w-full flex-col overflow-hidden rounded-[28px] border bg-white ${theme.cardBorder} lg:flex-row`}
                >
                  <div
                    className="flex w-full flex-col px-8 pt-10 pb-8 lg:w-[38%]"
                    style={isActive ? { backgroundImage: UPGRADE_REST } : undefined}
                    onMouseEnter={(e) => {
                      if (isActive) e.currentTarget.style.backgroundImage = UPGRADE_HOVER;
                    }}
                    onMouseLeave={(e) => {
                      if (isActive) e.currentTarget.style.backgroundImage = UPGRADE_REST;
                    }}
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#d1d1d1] bg-[#f5f5f5]">
                      <Crown className="h-5 w-5 text-[#1a1a1a]" />
                    </div>

                    <h3 className="text-3xl font-bold text-[#250054]">{copy.title}</h3>
                    <p className="mt-3 text-base font-medium text-slate-700">{copy.subtitle}</p>
                    <p className="mt-3 text-[15px] leading-7 text-slate-600">{copy.description}</p>

                    <div className="mt-8 border-t border-[#ece7f2] pt-7">
                      <div className="flex items-end gap-2 text-[#250054]">
                        <span className="text-4xl font-bold tracking-tight">
                          {copy.priceNote ?? "$2999/month starting"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        Custom execution with expert campaign support
                      </p>

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
                          copy.cta
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 border-t border-[#ece7f2] px-8 py-8 lg:border-t-0 lg:border-l">
                    <div className="space-y-7">
                      {copy.sections.map((section) => (
                        <div key={section.title || section.items.join("|")}>
                          {section.title && (
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                              {section.title}
                            </h4>
                          )}
                          <ul className="grid gap-3 md:grid-cols-2">
                            {section.items.map((item) => (
                              <li
                                key={item}
                                className="flex items-start gap-3 text-[15px] leading-6 text-slate-700"
                              >
                                <Check className="mt-1 h-4 w-4 flex-shrink-0 text-[#1a1a1a]" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              </div>
            );
          })()}

          <div className="mt-12 rounded-[28px] border border-[#eadcf5] bg-white px-8 py-8 shadow-sm">
            <h3 className="text-center text-xl font-bold text-[#250054]">All paid plans include</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                "7-day Money-Back Guarantee",
                "No setup fees",
                "Cancel anytime",
                "Secure payments",
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

        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/60"
              onClick={() => setShowContactModal(false)}
            />
            <div className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#eadcf5] bg-white shadow-2xl">
              <div className="border-b border-[#ece7f2] bg-[#fcf8ff] px-8 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-[#250054]">Contact Sales</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Tell us what you need and our team will reach out.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="rounded-full p-2 hover:bg-white"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSendContact} className="space-y-4 px-8 py-6">
                {contactToast.type !== "idle" && (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${contactToast.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                      }`}
                  >
                    {contactToast.message}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Name</span>
                    <input
                      readOnly
                      disabled
                      value={contactForm.name}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-400"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Email</span>
                    <input
                      readOnly
                      disabled
                      value={contactForm.email}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-400"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Subject</span>
                  <input
                    value={contactForm.subject}
                    onChange={(e) =>
                      setContactForm((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1a1a1a]"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Message</span>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) =>
                      setContactForm((prev) => ({ ...prev, message: e.target.value }))
                    }
                    className="mt-2 min-h-[140px] w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1a1a1a]"
                    required
                  />
                </label>

                <div className="flex flex-col justify-end gap-3 border-t border-[#ece7f2] pt-5 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(false)}
                    className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 px-5 py-3 font-semibold text-white"
                  >
                    {contactSubmitting ? "Sending…" : "Send Message"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                      <h3 className="text-2xl font-bold text-[#250054]">
                        Before you change your plan
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Some limits may be reduced when you move plans.
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
                    {capitalize(selectedPlan.name)}
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
                            {item.key}: {String(item.from)} → {String(item.to)}
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
                  <span className="text-sm font-medium text-slate-700">
                    Type CANCEL to confirm
                  </span>
                  <input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-fuchsia-400"
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
                  disabled={confirmText.trim().toUpperCase() !== "CANCEL" || submittingDowngrade}
                  className="rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingDowngrade ? "Applying…" : "Confirm Change"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}