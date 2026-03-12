"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CirclePlus,
  Download,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Play,
  Star,
  TrendingUp,
  Users,
  Youtube,
} from "lucide-react";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { apiGetContractedCampaigns, apiGetfetchMediaKit } from "../../services/influencerApi";
import { CopyIcon, TiktokLogoIcon } from "@phosphor-icons/react";

function ProgressBar({
  label,
  value,
  max = 100,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-600">{label}</span>
        <span className="font-semibold text-zinc-900">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-black to-zinc-500"
          style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
      {children}
    </span>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between border-b">
      <div className="flex items-center gap-2">
        <span className="text-zinc-900">✦</span>
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-800">
          {title}
        </h2>
      </div>
      {action ? <button className="text-sm font-semibold text-zinc-900">{action}</button> : null}
    </div>
  );
}

function ReviewCard({
  name,
  role,
  text,
}: {
  name?: string;
  role?: string;
  text?: string;
}) {
  const initials =
    name
      ?.split(" ")
      .map((part) => part[0])
      .join("") || "NA";

  return (
    <div className="rounded-[22px] border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-zinc-300 via-zinc-700 to-black text-sm font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-zinc-900">{name ?? "—"}</h3>
            <div className="flex items-center gap-1 text-zinc-900">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
          </div>
          <p className="text-sm text-zinc-500">{role ?? "—"}</p>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{text ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}

function SocialTrendChart({
  data,
  gradientId,
}: {
  data: number[];
  gradientId: string;
}) {
  const safeData = data.length ? data : [0, 0, 0, 0, 0, 0];

  return (
    <div className="mt-4 h-20 w-full overflow-hidden rounded-xl bg-gradient-to-b from-zinc-50 to-white">
      <SparkLineChart
        data={safeData}
        height={80}
        showHighlight={false}
        showTooltip={false}
        curve="natural"
        area
        color="#18181b"
        sx={{
          ".MuiAreaElement-root": {
            fill: `url(#${gradientId})`,
          },
          ".MuiLineElement-root": {
            strokeWidth: 2,
          },
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#18181b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#18181b" stopOpacity="0.02" />
          </linearGradient>
        </defs>
      </SparkLineChart>
    </div>
  );
}

const formatCompactNumber = (value: any) => {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "string") return value;

  const num = Number(value);
  if (!Number.isFinite(num)) return "—";

  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return `${num}`;
};

const formatPercent = (value: any, multiplyBy100 = false) => {
  if (value === undefined || value === null || value === "") return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return typeof value === "string" ? value : "—";
  const finalValue = multiplyBy100 ? num * 100 : num;
  return `${finalValue.toFixed(2)}%`;
};

const truncateText = (text?: string, max = 36) => {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

export default function CreatorProfileDashboard() {
  const [mediaKit, setMediaKit] = useState<any>(null);
  const [contractedCampaigns, setContractedCampaigns] = useState<any[]>([]);
  const fetchMediaKit = async () => {
    try {
      const influencerId = localStorage.getItem("influencerId") || "";
      const response = await apiGetfetchMediaKit(influencerId);
      setMediaKit(response?.mediaKit ?? response?.data?.mediaKit ?? null);
    } catch (error) {
      console.error("Failed to fetch media kit:", error);
    }
  };
  const fetchContractedCampaigns = async () => {
    try {
      const influencerId = localStorage.getItem("influencerId") || "";
      const token = localStorage.getItem("token") || "";
      const response = await apiGetContractedCampaigns(influencerId, token);

      // API may return either an array of campaigns or an object containing a `campaigns` array.
      const respAny: any = response;
      const campaignsSource = Array.isArray(respAny)
        ? respAny
        : respAny?.campaigns ?? respAny?.data?.campaigns ?? [];

      const mappedCampaigns = (campaignsSource ?? []).map((item: any) => ({
        _id: item?._id,
        company: item?.brandName ?? "—",
        brief: item?.campaignTitle ?? item?.description ?? "—",
        rate: item?.feeAmount
          ? `$${item.feeAmount}`
          : item?.campaignBudget
            ? `$${item.campaignBudget}`
            : "—",
        status: item?.contractStatus ?? item?.campaignStatus ?? item?.status ?? "—",
        payout: item?.paymentType ?? "—",
        raw: item,
      }));

      setContractedCampaigns(mappedCampaigns);
    } catch (error) {
      console.error("Failed to fetch contracted campaigns:", error);
    }
  };
  useEffect(() => {
    fetchMediaKit();
    fetchContractedCampaigns()
  }, []);

  const socialProfiles = mediaKit?.socialProfiles ?? [];

  const instagramProfile = socialProfiles.find(
    (item: any) => item?.provider?.toLowerCase() === "instagram"
  );
  const youtubeProfile = socialProfiles.find(
    (item: any) => item?.provider?.toLowerCase() === "youtube"
  );
  const tiktokProfile = socialProfiles.find(
    (item: any) => item?.provider?.toLowerCase() === "tiktok"
  );

  const primaryProfile = instagramProfile || youtubeProfile || tiktokProfile || socialProfiles[0];

  const totalReach =
    socialProfiles.reduce((sum: number, profile: any) => {
      return sum + Number(profile?.followers || 0);
    }, 0) || 0;

  const avgEngagement =
    socialProfiles.length > 0
      ? socialProfiles.reduce((sum: number, profile: any) => {
        return sum + Number(profile?.engagementRate || 0);
      }, 0) / socialProfiles.length
      : 0;

  const brandCollabs = primaryProfile?.sponsoredPosts?.length ?? 0;
  const deliverables = primaryProfile?.recentPosts?.length ?? 0;

  const socialCards = [
    {
      label: "Instagram",
      value: formatCompactNumber(instagramProfile?.followers),
      sub: "Followers Growth",
      statOneLabel: "AVG LIKES",
      statOneValue: formatCompactNumber(instagramProfile?.stats?.avgLikes?.value),
      statTwoLabel: "ENG. RATE",
      statTwoValue: formatPercent(instagramProfile?.engagementRate, true),
      icon: Instagram,
      trend:
        instagramProfile?.recentPosts
          ?.slice(0, 10)
          ?.reverse()
          ?.map((post: any) => Number(post?.likes || 0)) ?? [],
    },
    {
      label: "YouTube",
      value: formatCompactNumber(youtubeProfile?.followers || youtubeProfile?.subscribers),
      sub: "Followers Growth",
      statOneLabel: "AVG LIKES",
      statOneValue: formatCompactNumber(youtubeProfile?.stats?.avgLikes?.value),
      statTwoLabel: "ENG. RATE",
      statTwoValue: formatPercent(youtubeProfile?.engagementRate, true),
      icon: Youtube,
      trend:
        youtubeProfile?.recentPosts
          ?.slice(0, 10)
          ?.reverse()
          ?.map((post: any) => Number(post?.likes || 0)) ?? [],
    },
    {
      label: "TikTok",
      value: formatCompactNumber(tiktokProfile?.followers),
      sub: "Followers Growth",
      statOneLabel: "AVG LIKES",
      statOneValue: formatCompactNumber(tiktokProfile?.stats?.avgLikes?.value),
      statTwoLabel: "ENG. RATE",
      statTwoValue: formatPercent(tiktokProfile?.engagementRate, true),
      icon: TiktokLogoIcon,
      trend:
        tiktokProfile?.recentPosts
          ?.slice(0, 10)
          ?.reverse()
          ?.map((post: any) => Number(post?.likes || 0)) ?? [],
    },
  ];

  const statCards = [
    {
      label: "Total Reach",
      value: formatCompactNumber(totalReach),
      delta: null,
      icon: Users,
    },
    {
      label: "Avg. Engagement",
      value: formatPercent(avgEngagement, true),
      delta: null,
      icon: TrendingUp,
    },
    {
      label: "Brand Collabs",
      value: brandCollabs ? String(brandCollabs) : "—",
      delta: null,
      icon: Star,
    },
    {
      label: "Acceptance Rate",
      value: "—",
      delta: null,
      icon: CheckCircle2,
    },
    {
      label: "Deliverables",
      value: deliverables ? String(deliverables) : "—",
      delta: null,
      icon: CirclePlus,
    },
  ];

  const countryData = mediaKit?.country
    ? [{ name: mediaKit.country, value: 100 }]
    : [];

  const categoryTags =
    primaryProfile?.hashtags?.slice(0, 8)?.map((item: any) => `#${item.tag}`) ?? [];

  const galleryItems =
    primaryProfile?.popularPosts?.slice(0, 4)?.map((post: any, index: number) => ({
      title: truncateText(post?.text, 28),
      subtitle: post?.type ? post.type.toUpperCase() : "Post",
      image: post?.image || post?.thumbnail,
      bg:
        [
          "from-zinc-300 via-zinc-100 to-white",
          "from-zinc-900 via-zinc-700 to-zinc-400",
          "from-black via-zinc-800 to-zinc-500",
          "from-zinc-950 via-zinc-700 to-zinc-300",
        ][index % 4],
    })) ?? [];

  const campaigns =
    primaryProfile?.sponsoredPosts?.slice(0, 10)?.map((post: any) => ({
      company: post?.sponsors?.[0]?.name ?? "Sponsored Campaign",
      brief: truncateText(post?.text, 42),
      rate: "—",
      status: "Sponsored",
      payout: "—",
    })) ?? [];

  const reviews =
    mediaKit?.reviews?.length > 0
      ? mediaKit.reviews
      : [
        {
          name: "Sarah Jenkins",
          role: "Brand Manager, LuxeBeauty",
          text: `"Incredibly professional and hit all our KPIs. The engagement on the Reels was 40% higher than our average."`,
          image:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
          rating: 5,
        },
        {
          name: "Marcus Thorne",
          role: "Head of Marketing, NextGen",
          text: `"Great content quality. Communication was a bit slow initially but the final output was worth the wait."`,
          image:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
          rating: 4,
        },
      ];

  const creatorRating =
    primaryProfile?.stats?.paidPostPerformance !== undefined &&
      primaryProfile?.stats?.paidPostPerformance !== null
      ? (Number(primaryProfile.stats.paidPostPerformance) * 10).toFixed(1)
      : "—";

  const galleryFallbackBg = [
    "from-zinc-300 via-zinc-100 to-white",
    "from-zinc-900 via-zinc-700 to-zinc-400",
    "from-black via-zinc-800 to-zinc-500",
    "from-zinc-950 via-zinc-700 to-zinc-300",
  ];

  return (
    <div className="min-h-screen w-full text-zinc-900">
      <div className="w-full px-5 py-4 lg:px-6 xl:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-8">
            <nav className="hidden items-center gap-6 md:flex">
              {[["Influencer Profile", true] as const].map(([item, active]) => (
                <button
                  key={item}
                  className={`relative py-2 text-sm font-medium transition ${active ? "text-black" : "text-zinc-500 hover:text-zinc-900"
                    }`}
                >
                  {item}
                  {active ? (
                    <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-black" />
                  ) : null}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <div className="space-y-6">
          <section className="rounded-[28px] bg-white p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
                <div className="relative shrink-0">
                  <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-zinc-200 via-zinc-500 to-black shadow-inner sm:h-28 sm:w-28" />
                  <div className="absolute top-20 -right-1 flex h-8 w-8 items-center justify-center rounded-2xl bg-white text-black shadow-sm">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                      {mediaKit?.name ?? "—"}
                    </h1>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                      Verified Creator
                    </span>
                  </div>

                  <p className="max-w-3xl text-sm leading-6 text-zinc-600 sm:text-[15px]">
                    {mediaKit?.additionalNotes ?? "No additional notes available."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {categoryTags.length ? (
                      categoryTags.map((tag: string) => <Tag key={tag}>{tag}</Tag>)
                    ) : (
                      <Tag>—</Tag>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:max-w-3xl xl:grid-cols-3">
                    {[
                      {
                        label: "Instagram",
                        handle: instagramProfile?.username ?? "—",
                        icon: Instagram,
                      },
                      {
                        label: "YouTube",
                        handle: youtubeProfile?.username ?? "—",
                        icon: Youtube,
                      },
                      {
                        label: "TikTok",
                        handle: tiktokProfile?.username ?? "—",
                        icon: Play,
                      },
                    ].map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-700">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                              {item.label}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm text-zinc-500">
                                {item.handle}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[420px] rounded-xl border border-zinc-200 bg-zinc-50 p-4 xl:shrink-0">
                <div className="space-y-3">
                  {[
                    {
                      label: "Location",
                      value: mediaKit?.country ?? "—",
                      icon: MapPin,
                    },
                    {
                      label: "Language",
                      value:
                        mediaKit?.languages?.map((item: any) => item?.name).filter(Boolean).join(", ") ||
                        "—",
                      icon: Globe,
                    },
                    {
                      label: "Email",
                      value: mediaKit?.email ?? "—",
                      icon: Mail,
                    },
                    {
                      label: "Phone",
                      value: mediaKit?.phone ?? "—",
                      icon: Phone,
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-4 rounded-2xl"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center text-zinc-700">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                              {item.label}
                            </div>
                          </div>
                        </div>
                        <div className="truncate text-right text-sm font-semibold text-zinc-950 sm:text-base">
                          {item.value}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800">
                    <CopyIcon className="h-4 w-4" />
                    Copy link
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {statCards.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-[22px] border border-zinc-200 bg-white p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                        <Icon className="h-4 w-4" />
                      </div>

                      {item.delta ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                          {item.delta}
                        </span>
                      ) : null}
                    </div>

                    <div className="text-sm text-zinc-500">{item.label}</div>
                    <div className="mt-1 text-[32px] font-bold leading-none tracking-tight text-zinc-950">
                      {item.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-6">
            <SectionTitle title="Social Breakdown" />
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {socialCards.map((item) => {
                const Icon = item.icon;
                const gradientId = `social-breakdown-gradient-${item.label.toLowerCase()}`;

                return (
                  <div
                    key={item.label}
                    className="rounded-[22px] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-zinc-900">{item.label}</div>

                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-500">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    <div className="mt-2 text-[36px] font-bold leading-none tracking-tight text-zinc-950">
                      {item.value}
                    </div>
                    <div className="mt-1 text-sm text-zinc-500">{item.sub}</div>

                    <SocialTrendChart data={item.trend} gradientId={gradientId} />

                    <div className="mt-4 grid grid-cols-2 border-t border-zinc-200 pt-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                          {item.statOneLabel}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-zinc-900">
                          {item.statOneValue}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                          {item.statTwoLabel}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-zinc-900">
                          {item.statTwoValue}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
            <section className="rounded-[28px] bg-white p-6">
              <SectionTitle title="Audience Demographics" />
              <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
                <div className="rounded-3xl p-6">
                  <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-full bg-[conic-gradient(#18181b_0_38%,#52525b_38%_66%,#a1a1aa_66%_82%,#d4d4d8_82%_100%)] p-6 shadow-inner">
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                        Core Segment
                      </div>
                      <div className="mt-2 text-3xl font-bold text-zinc-950">—</div>
                      <div className="text-sm text-zinc-500">—</div>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-600">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-black" /> 18–24
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-zinc-600" /> 25–34
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-zinc-400" /> 35–44
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-zinc-300" /> 45+
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-zinc-200 p-6">
                  <div>
                    <div className="mb-4 text-sm font-semibold text-zinc-900">
                      Top Locations
                    </div>
                    <div className="space-y-4">
                      {countryData.length ? (
                        countryData.map((item: any, index: number) => (
                          <ProgressBar
                            key={`${item.name}-${index}`}
                            label={item.name}
                            value={Number(item.value) || 0}
                          />
                        ))
                      ) : (
                        <ProgressBar label="—" value={0} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2 2xl:grid-cols-1">
              <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
                <SectionTitle title="Category Tags" />
                <div className="flex flex-wrap gap-2">
                  {categoryTags.length ? (
                    categoryTags.map((tag: string) => <Tag key={tag}>{tag}</Tag>)
                  ) : (
                    <Tag>—</Tag>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
                <SectionTitle title="Creator Rating" />
                <div className="rounded-3xl bg-zinc-50 p-5">
                  <div className="flex items-end gap-3">
                    <div className="text-5xl font-bold tracking-tight text-black">
                      {creatorRating}
                    </div>
                    <div className="pb-2 text-sm text-zinc-500">
                      overall brand review
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-zinc-900">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                    <span className="ml-2 text-sm font-medium text-zinc-600">
                      Top performer
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-[28px] bg-white p-6">
            <SectionTitle title="Content Gallery" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {galleryItems.length
                ? galleryItems.map((item: any, index: number) => (
                  <div
                    key={`${item.title}-${index}`}
                    className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${item.bg ?? galleryFallbackBg[index % galleryFallbackBg.length]
                      } p-4 shadow-sm`}
                    style={
                      item.image
                        ? {
                          backgroundImage: `url(${item.image})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                        : undefined
                    }
                  >
                    <div className="absolute inset-0  transition " />
                    <div className="relative z-10 flex h-52 items-end rounded-[1.4rem] ">
                      <div>
                        <div className="text-lg font-semibold text-white drop-shadow-sm">
                          {item.title ?? "—"}
                        </div>
                        <div className="text-sm text-white/85">
                          {item.subtitle ?? "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
                : [0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${galleryFallbackBg[index]
                      } p-4 shadow-sm`}
                  >
                    <div className="absolute inset-0 bg-black/10 opacity-0 transition group-hover:opacity-100" />
                    <div className="flex h-52 items-end rounded-[1.4rem] border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                      <div>
                        <div className="text-lg font-semibold text-white drop-shadow-sm">—</div>
                        <div className="text-sm text-white/85">—</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
          <section className=" bg-white p-6">
            <SectionTitle title="Campaign History" />
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    <th className="px-4">Company</th>
                    <th className="px-4">Brief</th>
                    <th className="px-4">Rate</th>
                    <th className="px-4">Status</th>
                    <th className="px-4">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {contractedCampaigns.length ? (
                    contractedCampaigns.map((row: any, index: number) => (
                      <tr
                        key={row?._id || index}
                        className="rounded-2xl bg-zinc-50 text-sm text-zinc-600"
                      >
                        <td className="rounded-l-2xl px-4 py-4 font-semibold text-zinc-900">
                          {row?.company ?? "—"}
                        </td>
                        <td className="px-4 py-4">{row?.brief ?? "—"}</td>
                        <td className="px-4 py-4 font-semibold text-zinc-900">
                          {row?.rate ?? "—"}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                            {row?.status ?? "—"}
                          </span>
                        </td>
                        <td className="rounded-r-2xl px-4 py-4 font-medium text-zinc-900">
                          {row?.payout ?? "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="rounded-2xl bg-zinc-50 text-sm text-zinc-600">
                      <td className="rounded-l-2xl px-4 py-4 font-semibold text-zinc-900">—</td>
                      <td className="px-4 py-4">—</td>
                      <td className="px-4 py-4 font-semibold text-zinc-900">—</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                          —
                        </span>
                      </td>
                      <td className="rounded-r-2xl px-4 py-4 font-medium text-zinc-900">—</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <section className="rounded-[28px] bg-white p-6 ">
            <SectionTitle title="Work History" />
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    <th className="px-4">Company</th>
                    <th className="px-4">Brief</th>
                    <th className="px-4">Rate</th>
                    <th className="px-4">Status</th>
                    <th className="px-4">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length ? (
                    campaigns.map((row: any, index: number) => (
                      <tr
                        key={`${row.company}-${index}`}
                        className="rounded-2xl bg-zinc-50 text-sm text-zinc-600"
                      >
                        <td className="rounded-l-2xl px-4 py-4 font-semibold text-zinc-900">
                          {row.company ?? "—"}
                        </td>
                        <td className="px-4 py-4">{row.brief ?? "—"}</td>
                        <td className="px-4 py-4 font-semibold text-zinc-900">
                          {row.rate ?? "—"}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                            {row.status ?? "—"}
                          </span>
                        </td>
                        <td className="rounded-r-2xl px-4 py-4 font-medium text-zinc-900">
                          {row.payout ?? "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="rounded-2xl bg-zinc-50 text-sm text-zinc-600">
                      <td className="rounded-l-2xl px-4 py-4 font-semibold text-zinc-900">—</td>
                      <td className="px-4 py-4">—</td>
                      <td className="px-4 py-4 font-semibold text-zinc-900">—</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                          —
                        </span>
                      </td>
                      <td className="rounded-r-2xl px-4 py-4 font-medium text-zinc-900">—</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-6">
            <SectionTitle title="Ratings & Reviews" />
            <div className="grid gap-4 lg:grid-cols-2">
              {reviews.map((review: any, index: number) => (
                <ReviewCard key={`${review?.name ?? "review"}-${index}`} {...review} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}