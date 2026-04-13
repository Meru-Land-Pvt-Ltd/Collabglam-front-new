"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { get, post } from "@/lib/api";
import {
  ExternalLink,
  Loader2,
  AlertCircle,
  Users,
  Heart,
  Globe,
  RefreshCw,
  Sparkles,
  Eye,
  X,
  Clock3,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type SharedMediaKitAccess = {
  hasAdded?: boolean;
  allowed?: boolean;
  availableOnRequest?: boolean;
  requestStatus?: "none" | "requested" | "approved" | "rejected";
  requestedAt?: string | null;
  buttonLabel?: string;
  url?: string;
};

type SharedRow = {
  _id: string;
  provider?: string;
  name?: string;
  handle?: string;
  followers?: number | null;
  primaryLink?: string;
  links?: string[];
  niche?: string[];
  country?: string;
  selectionReason?: string;
  goodFit?: boolean | null;
  platformRateCard?: string;
  rateCardCurrency?: string;
  mediaKitAccess?: SharedMediaKitAccess | null;
};

type SharedFolderResponse = {
  success: boolean;
  data: {
    _id: string;
    title: string;
    description?: string;
    share?: {
      token?: string;
      url?: string;
      generatedAt?: string | null;
    };
    items: SharedRow[];
  };
};

const DASH = "--";

function fmtFollowers(n: number | null | undefined): string {
  if (n == null) return DASH;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function formatDateTime(iso?: string | null) {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function getNicheText(niche?: string[]) {
  return Array.isArray(niche) && niche.length ? niche.join(", ") : DASH;
}

function getHandleWithoutAt(handle?: string) {
  return cleanText(handle).replace(/^@+/, "");
}

function buildFallbackProfileUrl(provider?: string, handle?: string) {
  const username = getHandleWithoutAt(handle);
  if (!username) return "";

  const p = cleanText(provider).toLowerCase();

  if (p === "youtube") return `https://youtube.com/@${username}`;
  if (p === "instagram") return `https://instagram.com/${username}`;
  if (p === "tiktok") return `https://tiktok.com/@${username}`;

  return "";
}

function getProfileUrl(row: SharedRow) {
  return (
    cleanText(row.primaryLink) ||
    (Array.isArray(row.links) && row.links.length ? cleanText(row.links[0]) : "") ||
    buildFallbackProfileUrl(row.provider, row.handle)
  );
}

const CHIP_STYLES: Record<string, string> = {
  instagram: "bg-pink-50 text-pink-600 ring-pink-200",
  youtube: "bg-red-50 text-red-600 ring-red-200",
  tiktok: "bg-slate-100 text-slate-700 ring-slate-200",
  default: "bg-slate-100 text-slate-600 ring-slate-200",
};

function providerChip(provider?: string) {
  const key = String(provider || "").toLowerCase();
  return CHIP_STYLES[key] || CHIP_STYLES.default;
}

function StatCard({
  icon: Icon,
  label,
  value,
  accentClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accentClass: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-slate-500">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClass}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function GoodFitButton({
  checked,
  saving,
  disabled,
  onToggle,
}: {
  checked: boolean;
  saving: boolean;
  disabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => !saving && !disabled && onToggle(!checked)}
      disabled={saving || disabled}
      aria-label="Toggle good fit"
      className={`group relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
        checked
          ? "border-rose-200 bg-rose-50 text-rose-500 shadow-sm"
          : "border-slate-200 bg-slate-50 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
      } ${(saving || disabled) ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
      ) : (
        <Heart
          className={`h-4 w-4 transition-transform duration-200 ${
            checked ? "fill-current scale-110" : "group-hover:scale-110"
          }`}
        />
      )}
    </button>
  );
}

function ProviderBadge({ provider }: { provider?: string }) {
  const value = String(provider || "other");
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${providerChip(
        value
      )}`}
    >
      {value}
    </span>
  );
}

function ModalShell({
  open,
  title,
  description,
  onClose,
  children,
  maxWidthClass = "max-w-4xl",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`relative z-10 flex max-h-[92vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>
        <div className="flex-1 overflow-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

function getStickyFitCellClass(isHeader = false) {
  return [
    "sticky right-0 z-20",
    isHeader
      ? "bg-white shadow-[-1px_0_0_0_rgba(226,232,240,1)]"
      : "bg-white shadow-[-1px_0_0_0_rgba(241,245,249,1)]",
  ].join(" ");
}

export default function SharedPitchFolderPage() {
  const params = useParams();
  const token = String(params?.token || "");

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [rows, setRows] = useState<SharedRow[]>([]);
  const [title, setTitle] = useState("Shared Pitch Folder");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [rateCardItemId, setRateCardItemId] = useState("");

  const reloadSheet = useCallback(async () => {
    const resp = await get<SharedFolderResponse>(`/pitch-folders/shared/${token}`);
    setTitle(resp?.data?.title || "Shared Pitch Folder");
    setDescription(resp?.data?.description || "");
    setRows(resp?.data?.items || []);
  }, [token]);

  useEffect(() => {
    async function loadSheet() {
      if (!token) return;

      try {
        setLoading(true);
        setError("");
        await reloadSheet();
      } catch (e: any) {
        setError(
          e?.response?.data?.error || e?.message || "Failed to load shared folder"
        );
      } finally {
        setLoading(false);
      }
    }

    loadSheet();
  }, [token, reloadSheet]);

  async function saveGoodFit(id: string, goodFit: boolean) {
    try {
      setSavingId(id);
      setError("");

      const resp = await post(`/pitch-folders/shared/${token}/good-fit/${id}`, {
        goodFit,
      });

      const updated = resp?.data;
      setRows((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, goodFit: !!updated?.goodFit } : item
        )
      );
    } catch (e: any) {
      setError(
        e?.response?.data?.error || e?.message || "Failed to update good fit"
      );
    } finally {
      setSavingId("");
    }
  }

  async function requestMediaKit(id: string) {
    try {
      setSavingId(`media-kit-${id}`);
      setError("");

      await post(`/pitch-folders/shared/${token}/media-kit-request/${id}`, {});
      await reloadSheet();
    } catch (e: any) {
      setError(
        e?.response?.data?.error || e?.message || "Failed to request demographics"
      );
    } finally {
      setSavingId("");
    }
  }

  const handleMediaKitAction = useCallback(
    async (row: SharedRow) => {
      const access = row.mediaKitAccess;

      if (access?.allowed && access?.url) {
        window.open(access.url, "_blank", "noopener,noreferrer");
        return;
      }

      if (
        access?.requestStatus !== "requested" &&
        savingId !== `media-kit-${row._id}`
      ) {
        await requestMediaKit(row._id);
      }
    },
    [savingId]
  );

  const rateCardRow = useMemo(
    () => rows.find((row) => row._id === rateCardItemId) || null,
    [rows, rateCardItemId]
  );

  const stats = useMemo(
    () => ({
      total: rows.length,
      goodFit: rows.filter((r) => r.goodFit).length,
      totalReach: rows.reduce((s, r) => s + (r.followers || 0), 0),
      pendingRequests: rows.filter(
        (r) => r.mediaKitAccess?.requestStatus === "requested"
      ).length,
    }),
    [rows]
  );

  useEffect(() => {
    if (document.getElementById("pitch-sheet-fonts")) return;
    const link = document.createElement("link");
    link.id = "pitch-sheet-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-slate-50/50 p-6 md:p-10"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-10 w-48 rounded-xl bg-slate-200/60" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
          <Skeleton className="h-[420px] w-full rounded-2xl bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">
              Something went wrong
            </p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: Users,
      label: "Total Creators",
      value: stats.total,
      accentClass: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: Heart,
      label: "Shortlisted",
      value: stats.goodFit,
      accentClass: "bg-rose-50 text-rose-500",
    },
    {
      icon: Users,
      label: "Total Reach",
      value: fmtFollowers(stats.totalReach),
      accentClass: "bg-sky-50 text-sky-600",
    },
  ];

  return (
    <>
      <style>{`
        .pitch-sheet-root * { font-family: 'Inter', sans-serif; }

        .pitch-sheet-root ::-webkit-scrollbar { height: 6px; width: 6px; }
        .pitch-sheet-root ::-webkit-scrollbar-track { background: transparent; }
        .pitch-sheet-root ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        .pitch-sheet-root ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      <ModalShell
        open={!!rateCardRow}
        title={
          rateCardRow
            ? `${rateCardRow.name || "Influencer"} - Rate Card`
            : "Rate Card"
        }
        onClose={() => setRateCardItemId("")}
      >
        {rateCardRow ? (
          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Rate Card</p>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                {rateCardRow.rateCardCurrency || "USD"}
              </span>
            </div>

            <div className="min-h-[320px] rounded-2xl border bg-white p-4 text-sm leading-7 whitespace-pre-wrap text-slate-700">
              {rateCardRow.platformRateCard || DASH}
            </div>
          </div>
        ) : null}
      </ModalShell>

      <div className="pitch-sheet-root relative min-h-screen overflow-x-hidden bg-slate-50/50">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-100/40 blur-[100px]" />
          <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-rose-100/30 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[96rem] px-4 py-8 md:px-8">
          <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-indigo-600">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Shared Pitch
                Folder
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                {title}
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                {description ||
                  "Open shared review link. Only good-fit can be updated."}
              </p>
            </div>
          </div>

          {rows.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:gap-3">
              {statCards.map((card) => (
                <StatCard
                  key={card.label}
                  icon={card.icon}
                  label={card.label}
                  value={card.value}
                  accentClass={card.accentClass}
                />
              ))}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-6 py-4">
              <p className="text-sm font-medium text-slate-600">
                {rows.length > 0
                  ? `${rows.length} influencer${rows.length !== 1 ? "s" : ""}`
                  : "No candidates yet"}
              </p>
              {rows.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-slate-500">Live</span>
                </div>
              )}
            </div>

            {!rows.length ? (
              <div className="flex flex-col items-center justify-center py-28 text-center bg-white">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
                  <Users className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-base font-semibold text-slate-900">
                  No influencers yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Candidates will appear here once shared.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1500px] border-collapse text-sm bg-white">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Name
                      </th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Handle
                      </th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Profile
                      </th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Provider
                      </th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Followers
                      </th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Country
                      </th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Niche
                      </th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Rate Card
                      </th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Selection Reason
                      </th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Demographics
                      </th>
                      <th
                        className={`px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-slate-500 ${getStickyFitCellClass(
                          true
                        )}`}
                      >
                        Fit
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row) => {
                      const access = row.mediaKitAccess;
                      const isRequesting = savingId === `media-kit-${row._id}`;
                      const isFitSaving = savingId === row._id;
                      const profileUrl = getProfileUrl(row);

                      const mediaButtonLabel = access?.allowed
                        ? "Insights"
                        : access?.requestStatus === "requested"
                        ? "Requested"
                        : "Request";

                      const mediaButtonDisabled =
                        access?.requestStatus === "requested" || isRequesting;

                      return (
                        <tr
                          key={row._id}
                          className="group border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50/80"
                        >
                          <td className="px-6 py-4 whitespace-nowrap align-top">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600 ring-1 ring-inset ring-indigo-100/50">
                                {row.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <span className="font-semibold text-slate-900">
                                {row.name || DASH}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-slate-700 align-top">
                            {row.handle || DASH}
                          </td>

                          <td className="px-4 py-4 align-top">
                            {profileUrl ? (
                              <a
                                href={profileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex max-w-[240px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                              >
                                <ExternalLink className="h-4 w-4 shrink-0" />
                                <span className="truncate">Profile Link</span>
                              </a>
                            ) : (
                              <span className="text-slate-400">{DASH}</span>
                            )}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap align-top">
                            <ProviderBadge provider={row.provider} />
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap tabular-nums text-slate-600 align-top">
                            <span className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-slate-400" />
                              {fmtFollowers(row.followers)}
                            </span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-slate-600 align-top">
                            {row.country ? (
                              <span className="flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5 text-slate-400" />
                                {row.country}
                              </span>
                            ) : (
                              <span className="text-slate-400">{DASH}</span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-slate-700 align-top">
                            <div className="max-w-[220px] whitespace-pre-wrap break-words">
                              {getNicheText(row.niche)}
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <button
                              onClick={() => setRateCardItemId(row._id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                          </td>

                          <td className="px-4 py-4 text-slate-700 align-top">
                            <div className="max-w-[320px] whitespace-pre-wrap break-words leading-6">
                              {cleanText(row.selectionReason) || DASH}
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => void handleMediaKitAction(row)}
                                disabled={mediaButtonDisabled}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isRequesting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : access?.allowed ? (
                                  <ExternalLink className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                {mediaButtonLabel}
                              </button>
                            </div>

                            {access?.requestedAt ? (
                              <p className="mt-2 text-xs text-slate-500">
                                Requested: {formatDateTime(access.requestedAt)}
                              </p>
                            ) : null}
                          </td>

                          <td
                            className={`px-4 py-4 text-center align-top ${getStickyFitCellClass()} group-hover:bg-slate-50/80`}
                          >
                            <div className="flex justify-center">
                              <GoodFitButton
                                checked={!!row.goodFit}
                                saving={isFitSaving}
                                disabled={savingId !== "" && !isFitSaving}
                                onToggle={(v) => saveGoodFit(row._id, v)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {rows.length > 0 && (
            <p className="mt-6 text-center text-sm text-slate-500">
              Click the <Heart className="inline h-3.5 w-3.5 text-rose-500" /> icon
              to mark influencers as a good fit.
            </p>
          )}
        </div>
      </div>
    </>
  );
}