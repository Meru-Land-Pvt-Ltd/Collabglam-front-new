// utils/campaignUi.ts
import type { CampaignStatus, Platform } from "@/app/brand/services/brandApi";
import type { StatusVariant } from "@/components/ui/brand/card";

export function statusToVariant(status: CampaignStatus): StatusVariant {
  if (status === "active") return "active";
  if (status === "paused") return "paused";
  if (status === "draft") return "draft";
  if (status === "scheduled") return "scheduled";
  if (status === "completed") return "completed";
  return "expired";
}

export function statusLabel(status: CampaignStatus) {
  const s = String(status || "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function normalizePlatform(p: Platform) {
  return String(p || "").trim().toLowerCase();
}

export function platformCountLabel(platforms?: Platform[]) {
  const n = platforms?.length ?? 0;
  if (n === 0) return "-";
  if (n === 1) return "1 Platform";
  return `${n} Platforms`;
}

export function daysFromNow(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function scheduleOrExpiryText(status: CampaignStatus, scheduledAt?: string | null, expiryAt?: string | null) {
  // ✅ If scheduled -> show scheduling in X days
  if (status === "scheduled") {
    const days = daysFromNow(scheduledAt);
    if (days === null) return "Scheduling";
    return days >= 0 ? `Scheduling in ${days} days` : `Scheduled ${Math.abs(days)} days ago`;
  }

  // ✅ Otherwise show expiry
  const days = daysFromNow(expiryAt);
  if (days === null) return "Expiry";
  return days >= 0 ? `Expiry in ${days} days` : `Expired ${Math.abs(days)} days ago`;
}
