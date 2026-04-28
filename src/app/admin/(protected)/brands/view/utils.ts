import {
  Activity,
  BadgePercent,
  Building2,
  CreditCard,
  FileText,
  FolderKanban,
  Layers3,
  Settings2,
} from "lucide-react";
import type { BrandDetail, BrandTab, BrandTabItem } from "./types";

export const BRAND_TABS: BrandTabItem[] = [
  { id: "overview", label: "Overview", icon: Layers3 },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "campaigns", label: "Campaigns", icon: FolderKanban },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "activity", label: "Activity Log", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings2 },
  { id: "coupons", label: "Coupons", icon: BadgePercent },
];

export const FEATURE_LABELS: Record<string, string> = {
  influencer_search_per_month: "Influencer Search",
  influencer_profile_views_per_month: "Profile Views",
  invites_per_month: "Invites",
  active_campaigns: "Active Campaigns",
  platforms_supported: "Platforms Supported",
  direct_email_messaging_efs: "Messaging",
  milestones_and_payouts: "Milestones & Payouts",
  message_templates: "Templates",
  advanced_filters: "Advanced Filters",
  dispute_assistance: "Dispute Assistance",
  support: "Support",
  creator_sourcing_and_outreach: "Creator Sourcing",
  shortlist_delivered: "Shortlists",
  negotiation_and_followups: "Negotiation",
};

export function isBrandTab(value: string | null): value is BrandTab {
  return (
    value === "overview" ||
    value === "subscription" ||
    value === "campaigns" ||
    value === "invoices" ||
    value === "activity" ||
    value === "settings" ||
    value === "coupons"
  );
}

export function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";

  return dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";

  return dt.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatCurrency(amount?: number | null) {
  if (!amount || amount <= 0) return "Free";
  return `$${amount.toLocaleString()}`;
}

export function displayFeatureValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Included" : "Not included";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function titleCaseFeature(key?: string) {
  if (!key) return "—";
  return (FEATURE_LABELS[key] || key.replace(/_/g, " ")).replace(/\b\w/g, (m) =>
    m.toUpperCase()
  );
}

export function isDataImage(src?: string) {
  return !!src && src.startsWith("data:image");
}

export function getInitials(brand?: BrandDetail | null) {
  const source = (brand?.brandName || brand?.name || "B").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export function safeDate(iso?: string | null) {
  if (!iso) return null;
  const dt = new Date(iso);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function addMinutes(d: Date, mins: number) {
  return new Date(d.getTime() + mins * 60 * 1000);
}

export function addDays(d: Date, days: number) {
  return addMinutes(d, days * 1440);
}

export function canManageCampaigns(planName?: string) {
  const normalized = String(planName || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return normalized === "fully_paid" || normalized === "fully_managed";
}

export function getStatusTone(status?: string) {
  const value = String(status || "").toLowerCase();

  if (value.includes("active") || value.includes("paid") || value.includes("success")) {
    return "success" as const;
  }

  if (
    value.includes("expired") ||
    value.includes("failed") ||
    value.includes("overdue") ||
    value.includes("cancel")
  ) {
    return "danger" as const;
  }

  if (value.includes("pending") || value.includes("inactive")) {
    return "warning" as const;
  }

  return "neutral" as const;
}

export function getOverviewTeam(brand: BrandDetail) {
  return [
    {
      role: "Relationship Manager",
      value: brand.assignedRh || brand.assignedRm || "Unassigned",
    },
    {
      role: "Brand Manager",
      value: brand.assignedBme || brand.assignedBm || "Unassigned",
    },
    {
      role: "Influencer Manager",
      value: brand.assignedIme || brand.assignedIm || "Unassigned",
    },
  ];
}

export function getOnboardingStatus(brand: BrandDetail) {
  return [
    {
      step: "Page 1",
      status: brand.ispage1Skip ? "Skipped" : brand.page1?.length ? "Completed" : "Pending",
    },
    {
      step: "Page 2",
      status: brand.ispage2Skip ? "Skipped" : brand.page2?.length ? "Completed" : "Pending",
    },
    {
      step: "Page 3",
      status: brand.ispage3Skip ? "Skipped" : brand.page3?.length ? "Completed" : "Pending",
    },
  ];
}

export function getBrandMetricCards(brand: BrandDetail) {
  return [
    {
      title: "Created",
      value: formatDate(brand.createdAt),
      hint: "Brand onboarding date",
      icon: Building2,
    },
    {
      title: "Industry",
      value: brand.industry || "—",
      hint: "Current vertical",
      icon: Building2,
    },
  ];
}