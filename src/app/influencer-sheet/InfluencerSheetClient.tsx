"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/api";
import {
  ExternalLink,
  Loader2,
  AlertCircle,
  Users,
  DollarSign,
  TrendingUp,
  Heart,
  Globe,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type PitchRow = {
  _id: string;
  name?: string;
  followers?: number | null;
  primaryLink?: string;
  links?: string[];
  niche?: string[];
  country?: string;
  additionalInfo?: string;
  selectionReason?: string;
  goodFit?: boolean | null;
  rateUsd?: number | null;
  ourFeePct?: number | null;
  comments?: string;
};

type ViewerType = "brand" | "admin";

function fmtFollowers(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

const NICHE_PALETTE: Record<string, string> = {
  fashion: "bg-rose-50 text-rose-600 ring-rose-200",
  beauty: "bg-pink-50 text-pink-600 ring-pink-200",
  tech: "bg-sky-50 text-sky-600 ring-sky-200",
  gaming: "bg-violet-50 text-violet-600 ring-violet-200",
  fitness: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  food: "bg-amber-50 text-amber-700 ring-amber-200",
  travel: "bg-teal-50 text-teal-600 ring-teal-200",
  lifestyle: "bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-200",
  default: "bg-slate-100 text-slate-600 ring-slate-200",
};

function nicheClass(tag: string): string {
  const key = tag.toLowerCase();
  return NICHE_PALETTE[key] || NICHE_PALETTE.default;
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

export default function InfluencerSheetClient({
  campaignId,
}: {
  campaignId: string;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [rows, setRows] = useState<PitchRow[]>([]);
  const [brandId, setBrandId] = useState("");
  const [viewerType, setViewerType] = useState<ViewerType | null>(null);
  const [error, setError] = useState("");

  const isBrandView = viewerType === "brand";
  const isAdminView = viewerType === "admin";

  useEffect(() => {
    const storedUserType = localStorage.getItem("userType");

    if (storedUserType === "admin") {
      setViewerType("admin");
      return;
    }

    const storedBrandId =
      localStorage.getItem("brandId") ||
      localStorage.getItem("brand_id") ||
      "";

    if (!storedBrandId) {
      router.replace("/brand/login");
      return;
    }

    setBrandId(storedBrandId);
    setViewerType("brand");
  }, [router]);

  useEffect(() => {
    async function loadSheet() {
      if (!campaignId || !viewerType) return;
      if (viewerType === "brand" && !brandId) return;

      try {
        setLoading(true);
        setError("");

        const params =
          viewerType === "brand" ? { campaignId, brandId } : { campaignId };

        const resp = await get<{
          success: boolean;
          viewerType?: ViewerType;
          data: { campaignId: string; items: PitchRow[] };
        }>("/pipeline/brand-sheet", params);

        setRows(resp?.data?.items || []);
      } catch (e: any) {
        setError(
          e?.response?.data?.error || e?.message || "Failed to load pitch sheet"
        );
      } finally {
        setLoading(false);
      }
    }

    loadSheet();
  }, [campaignId, brandId, viewerType]);

  async function saveGoodFit(id: string, goodFit: boolean) {
    if (!isBrandView) return;

    try {
      setSavingId(id);
      setError("");

      const resp = await post(`/pipeline/brand-sheet/${id}/good-fit`, {
        brandId,
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

  const stats = useMemo(
    () => ({
      total: rows.length,
      goodFit: rows.filter((r) => r.goodFit).length,
      totalReach: rows.reduce((s, r) => s + (r.followers || 0), 0),
      avgRate: rows.filter((r) => r.rateUsd).length
        ? Math.round(
            rows.reduce((s, r) => s + (r.rateUsd || 0), 0) /
              rows.filter((r) => r.rateUsd).length
          )
        : 0,
    }),
    [rows]
  );

  useEffect(() => {
    if (document.getElementById("pitch-sheet-fonts")) return;
    const link = document.createElement("link");
    link.id = "pitch-sheet-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap";
    document.head.appendChild(link);
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-slate-50/50 p-6 md:p-10"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-10 w-48 rounded-xl bg-slate-200/60" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-24 rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>
          <Skeleton className="h-[500px] w-full rounded-2xl bg-white shadow-sm" />
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

  const headers = isBrandView
    ? [
        "Influencer",
        "Followers",
        "Profile",
        "Niche",
        "Country",
        "Rate",
        "Selection Reason",
        "Comments",
        "Fit",
      ]
    : [
        "Influencer",
        "Followers",
        "Profile",
        "Niche",
        "Country",
        "Rate",
        "Selection Reason",
        "Comments",
      ];

  const statCards = [
    {
      icon: Users,
      label: "Total Pitched",
      value: stats.total,
      accentClass: "bg-indigo-50 text-indigo-600",
    },
    ...(isBrandView
      ? [
          {
            icon: Heart,
            label: "Good Fits",
            value: stats.goodFit,
            accentClass: "bg-rose-50 text-rose-500",
          },
        ]
      : []),
    {
      icon: TrendingUp,
      label: "Total Reach",
      value: fmtFollowers(stats.totalReach),
      accentClass: "bg-sky-50 text-sky-600",
    },
    {
      icon: DollarSign,
      label: "Avg. Rate",
      value: stats.avgRate ? `$${stats.avgRate.toLocaleString()}` : "—",
      accentClass: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <>
      <style>{`
        .pitch-sheet-root * { font-family: 'DM Sans', sans-serif; }
        .pitch-sheet-root h1, .pitch-sheet-root h2 { font-family: 'Syne', sans-serif; }

        .pitch-sheet-root ::-webkit-scrollbar { height: 6px; width: 6px; }
        .pitch-sheet-root ::-webkit-scrollbar-track { background: transparent; }
        .pitch-sheet-root ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        .pitch-sheet-root ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        @keyframes rowIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .row-animate { animation: rowIn 0.3s ease-out both; }
      `}</style>

      <div className="pitch-sheet-root relative min-h-screen overflow-x-hidden bg-slate-50/50">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-100/40 blur-[100px]" />
          <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-rose-100/30 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[96rem] px-4 py-8 md:px-8">
          <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-indigo-600">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Campaign
                Pitch Sheet
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Influencer Review
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                {isAdminView
                  ? "Admin preview of the campaign pitch sheet."
                  : "Review and shortlist the best candidates for your upcoming campaign."}
              </p>
            </div>

            {rows.length > 0 && isBrandView && (
              <div className="mt-4 flex flex-col items-start gap-2 sm:mt-0 sm:items-end">
                <span className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-900">
                    {stats.goodFit}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {stats.total}
                  </span>{" "}
                  shortlisted
                </span>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{
                      width: stats.total
                        ? `${(stats.goodFit / stats.total) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {rows.length > 0 && (
            <div
              className={`mb-6 grid gap-3 ${
                statCards.length === 4
                  ? "grid-cols-2 sm:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-3"
              } lg:gap-4`}
            >
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
                  <span className="text-xs font-medium text-slate-500">
                    Live
                  </span>
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
                  Candidates will appear here once pitched.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className={`w-full border-collapse text-sm bg-white ${
                    isBrandView ? "min-w-[1280px]" : "min-w-[1160px]"
                  }`}
                >
                  <thead>
                    <tr className="border-b border-slate-200">
                      {headers.map((h, i) => (
                        <th
                          key={h}
                          className={`py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500
                            ${i === 0 ? "pl-6 pr-4" : "px-4"}
                            ${
                              h === "Fit"
                                ? "sticky right-0 bg-white text-center shadow-[-8px_0_15px_-3px_rgba(0,0,0,0.03)]"
                                : ""
                            }
                          `}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={row._id}
                        className="row-animate group border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50/80"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600 ring-1 ring-inset ring-indigo-100/50">
                              {row.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <span className="font-semibold text-slate-900">
                              {row.name || "—"}
                            </span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 tabular-nums text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {fmtFollowers(row.followers)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {row.primaryLink ? (
                            <a
                              href={row.primaryLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            >
                              Profile{" "}
                              <ExternalLink className="h-3 w-3 text-slate-400" />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {Array.isArray(row.niche) && row.niche.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {row.niche.map((n) => (
                                <span
                                  key={n}
                                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${nicheClass(
                                    n
                                  )}`}
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                          {row.country ? (
                            <span className="flex items-center gap-1.5">
                              <Globe className="h-3.5 w-3.5 text-slate-400" />
                              {row.country}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-medium tabular-nums text-slate-900">
                          {row.rateUsd != null ? (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                              {row.rateUsd.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-4 max-w-[220px]">
                          <p
                            className="line-clamp-2 text-[13px] leading-relaxed text-slate-600"
                            title={row.selectionReason}
                          >
                            {row.selectionReason || (
                              <span className="text-slate-400">—</span>
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-4 max-w-[220px]">
                          <p
                            className="line-clamp-2 text-[13px] leading-relaxed text-slate-500"
                            title={row.comments}
                          >
                            {row.comments || (
                              <span className="text-slate-400">—</span>
                            )}
                          </p>
                        </td>

                        {isBrandView && (
                          <td className="sticky right-0 bg-white px-4 py-4 text-center shadow-[-8px_0_15px_-3px_rgba(0,0,0,0.02)] transition-colors group-hover:bg-slate-50/80 after:pointer-events-none after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-slate-100">
                            <GoodFitButton
                              checked={!!row.goodFit}
                              saving={savingId === row._id}
                              disabled={
                                savingId !== "" && savingId !== row._id
                              }
                              onToggle={(v) => saveGoodFit(row._id, v)}
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {rows.length > 0 && isBrandView && (
            <p className="mt-6 text-center text-sm text-slate-500">
              Click the{" "}
              <Heart className="inline h-3.5 w-3.5 text-rose-500" /> icon to
              mark influencers as a good fit for your campaign.
            </p>
          )}
        </div>
      </div>
    </>
  );
}