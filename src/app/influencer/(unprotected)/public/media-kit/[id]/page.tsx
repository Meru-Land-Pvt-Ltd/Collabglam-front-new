"use client";

import React, { useEffect, useState } from "react";
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
    CheckSquare,
    Sparkle,
} from "lucide-react";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { areaElementClasses, lineElementClasses } from "@mui/x-charts/LineChart";
import { chartsAxisHighlightClasses } from "@mui/x-charts/ChartsAxisHighlight";
import { apiGetContractedCampaigns, apiGetfetchMediaKit } from "@/app/influencer/services/influencerApi";
import { CopyIcon, TiktokLogoIcon } from "@phosphor-icons/react";
import { Loader } from "@/components/ui/loader";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocialPost {
    likes?: number | string;
    text?: string;
    type?: string;
    image?: string;
    thumbnail?: string;
    sponsors?: Array<{ name?: string }>;
}

interface AudienceAge {
    code: string;
    weight: number;
}

interface AudienceGender {
    code: string;
    weight: number;
}

interface AudienceCountry {
    name: string;
    weight: number;
}

interface InfluencerReport {
    modashId?: string;
    _id?: string;
    provider?: string;
    name?: string;
    picture?: string;
    bio?: string;
    username?: string;
    followers?: number | string;
    subscribers?: number | string;
    engagementRate?: number | string;
    country?: string;
    language?: { name?: string };
    hashtags?: Array<{ tag: string }>;
    popularPosts?: SocialPost[];
    recentPosts?: SocialPost[];
    sponsoredPosts?: SocialPost[];
    stats?: {
        avgLikes?: { value?: number | string };
        paidPostPerformance?: number | string;
    };
    avgLikes?: number | string;
    audience?: {
        geoCountries?: AudienceCountry[];
        ages?: AudienceAge[];
        genders?: AudienceGender[];
        languages?: Array<{ code: string; weight: number }>;
        interests?: Array<{ name: string; weight: number }>;
    };
}

interface MediaKit {
    primaryInfluencerReport?: InfluencerReport;
    influencerReports?: InfluencerReport[];
    socialProfiles?: InfluencerReport[];
    name?: string;
    country?: string;
    languages?: Array<{ name?: string }>;
    email?: string;
    phone?: string;
    additionalNotes?: string;
    reviews?: ReviewData[];
}

interface ReviewData {
    name?: string;
    role?: string;
    text?: string;
    image?: string;
    rating?: number;
}

interface CampaignRow {
    _id?: string;
    company: string;
    brief: string;
    rate: string;
    status: string;
    payout: string;
    raw?: unknown;
    category?: string;
}

interface SocialCard {
    label: string;
    profile: InfluencerReport | null | undefined;
    value: string;
    sub: string;
    statOneLabel: string;
    statOneValue: string;
    statTwoLabel: string;
    statTwoValue: string;
    icon: React.ElementType;
    trend: number[];
    hasData: boolean;
    isPrimary: boolean;
}

interface StatCard {
    label: string;
    value: string;
    delta: string | null;
    icon: React.ElementType;
}

interface GalleryItem {
    title: string;
    subtitle: string;
    image?: string;
    bg: string;
}

interface AgeDataItem {
    range: string;
    percentage: string;
}

interface GenderDataItem {
    type: string;
    percentage: string;
}

interface LocationDataItem {
    name: string;
    value: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCompactNumber = (value: number | string | null | undefined): string => {
    if (value === undefined || value === null || value === "") return "—";
    if (typeof value === "string") return value;

    const num = Number(value);
    if (!Number.isFinite(num)) return "—";

    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return `${num}`;
};

const formatPercent = (
    value: number | string | null | undefined,
    multiplyBy100 = false
): string => {
    if (value === undefined || value === null || value === "") return "—";
    const num = Number(value);
    if (!Number.isFinite(num)) return typeof value === "string" ? value : "—";
    const finalValue = multiplyBy100 ? num * 100 : num;
    return `${finalValue.toFixed(2)}%`;
};

const truncateText = (text?: string, max = 36): string => {
    if (!text) return "—";
    return text.length > max ? `${text.slice(0, max)}...` : text;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function SectionTitle({ title, action }: { title: string; action?: string }) {
    return (
        <div className="mb-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-2">
                <span className="text-zinc-900">
                    <Sparkle color="#FBBF00" fill="#FBBF00" className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-800">
                    {title}
                </h2>
            </div>
            {action ? (
                <button className="text-sm font-semibold text-zinc-900">{action}</button>
            ) : null}
        </div>
    );
}

function ReviewCard({ name, role, text }: ReviewData) {
    const initials =
        name
            ?.split(" ")
            .map((part) => part[0])
            .join("") ?? "NA";

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
                                <Star key={i} className="h-3.5 w-3.5" fill="#FBBF00" color="#FBBF00" />
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

function SocialSparkLine({
    data,
    gradientId,
    followerCount,
}: {
    data: number[];
    gradientId: string;
    followerCount: string;
}) {
    const safeData = data.length ? data : [0, 0, 0, 0, 0, 0];
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

    return (
        <Box
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                switch (e.key) {
                    case "ArrowLeft":
                        setActiveIndex((p) =>
                            p === null
                                ? safeData.length - 1
                                : (safeData.length + p - 1) % safeData.length
                        );
                        break;
                    case "ArrowRight":
                        setActiveIndex((p) =>
                            p === null ? 0 : (p + 1) % safeData.length
                        );
                        break;
                    default:
                        break;
                }
            }}
            onFocus={() =>
                setActiveIndex((p) => (p === null ? safeData.length - 1 : p))
            }
            onBlur={() => setActiveIndex(null)}
            tabIndex={0}
            role="figure"
            aria-label="Followers trend chart"
            sx={{ outline: "none", width: "100%", mt: 1 }}
        >
            <div className="text-[36px] font-bold leading-none tracking-tight text-zinc-950">
                {activeIndex !== null
                    ? safeData[activeIndex].toLocaleString()
                    : followerCount}
            </div>

            <div className="mt-1 text-sm text-zinc-500">Followers Growth</div>

            <div className="mt-4 w-full overflow-hidden h-60 rounded-xl">
                <SparkLineChart
                    data={safeData}
                    height={100}
                    curve="natural"
                    area
                    color="#FBBF00"
                    showHighlight
                    axisHighlight={{ x: "line" }}
                    onHighlightedAxisChange={(axisItems: Array<{ dataIndex: number }>) => {
                        setActiveIndex(axisItems[0]?.dataIndex ?? null);
                    }}
                    yAxis={{
                        domainLimit: (_min: number, max: number) => ({
                            min: -(max / 6),
                            max,
                        }),
                    }}
                    margin={{ top: 5, bottom: 0, left: 4, right: 0 }}
                    slotProps={{ lineHighlight: { r: 3 } }}
                    sx={{
                        width: "100% !important",
                        [`& .${areaElementClasses.root}`]: {
                            fill: `url(#${gradientId})`,
                        },
                        [`& .${lineElementClasses.root}`]: {
                            strokeWidth: 2,
                        },
                        [`& .${chartsAxisHighlightClasses.root}`]: {
                            stroke: "#FBBF00",
                            strokeDasharray: "none",
                            strokeWidth: 1.5,
                            opacity: 0.35,
                        },
                    }}
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FBBF00" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#FBBF00" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>
                </SparkLineChart>
            </div>
        </Box>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreatorProfileDashboard() {
    const [mediaKit, setMediaKit] = useState<MediaKit | null>(null);
    const params = useParams();
    const id = typeof params?.id === "string" ? params.id : "";
    const [contractedCampaigns, setContractedCampaigns] = useState<CampaignRow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [brandId, setBrandId] = useState<string>("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setBrandId(localStorage.getItem("brandId") ?? "");
        }
    }, []);

    const fetchMediaKit = async (): Promise<void> => {
        try {
            const response = await apiGetfetchMediaKit(id);
            const kit = (response as { mediaKit?: MediaKit; data?: { mediaKit?: MediaKit } });
            setMediaKit(kit?.mediaKit ?? kit?.data?.mediaKit ?? null);
        } catch (error) {
            console.error("Failed to fetch media kit:", error);
        }
    };

    const fetchContractedCampaigns = async (): Promise<void> => {
        try {
            const token = localStorage.getItem("token") ?? "";
            const response: unknown = await apiGetContractedCampaigns(id, token);

            // Normalise: the API may return an array directly, or an object with
            // a `campaigns` / `data.campaigns` property.
            let campaignsSource: unknown[];
            if (Array.isArray(response)) {
                campaignsSource = response;
            } else {
                const obj = response as Record<string, unknown>;
                const nested = obj?.data as Record<string, unknown> | undefined;
                const list =
                    (obj?.campaigns as unknown[] | undefined) ??
                    (nested?.campaigns as unknown[] | undefined) ??
                    [];
                campaignsSource = list;
            }

            const mappedCampaigns: CampaignRow[] = campaignsSource.map((item) => {
                const row = item as Record<string, unknown>;
                return {
                    _id: row._id as string | undefined,
                    company: (row.brandName as string | undefined) ?? "—",
                    brief:
                        ((row.campaignTitle ?? row.description) as string | undefined) ?? "—",
                    rate: row.feeAmount
                        ? `$${row.feeAmount}`
                        : row.campaignBudget
                            ? `$${row.campaignBudget}`
                            : "—",
                    status:
                        ((row.contractStatus ?? row.campaignStatus ?? row.status) as
                            | string
                            | undefined) ?? "—",
                    payout: (row.paymentType as string | undefined) ?? "—",
                    raw: item,
                    category: (row.campaignCategory as string | undefined) ?? "—",
                };
            });

            setContractedCampaigns(mappedCampaigns);
        } catch (error) {
            console.error("Failed to fetch contracted campaigns:", error);
        }
    };

    useEffect(() => {
        const loadAll = async (): Promise<void> => {
            setLoading(true);
            await Promise.all([fetchMediaKit(), fetchContractedCampaigns()]);
            setLoading(false);
        };
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader logoSrc="/logo.png" />
            </div>
        );
    }

    // ── Derived data ────────────────────────────────────────────────────────

    const primaryReport: InfluencerReport | null =
        mediaKit?.primaryInfluencerReport ?? mediaKit?.socialProfiles?.[0] ?? null;

    const allReports: InfluencerReport[] =
        mediaKit?.influencerReports ?? mediaKit?.socialProfiles ?? [];

    const isPrimaryReport = (report: InfluencerReport | null | undefined): boolean => {
        if (!primaryReport || !report) return false;
        return (
            report.modashId === primaryReport.modashId ||
            report._id === primaryReport._id
        );
    };

    const getProfileForPlatform = (provider: string): InfluencerReport | undefined =>
        allReports.find(
            (item) => item?.provider?.toLowerCase() === provider.toLowerCase()
        );

    const instagramProfile = getProfileForPlatform("instagram") ?? primaryReport ?? undefined;
    const youtubeProfile = getProfileForPlatform("youtube");
    const tiktokProfile = getProfileForPlatform("tiktok");

    const totalReach =
        allReports.reduce((sum, profile) => sum + Number(profile?.followers ?? 0), 0) ||
        Number(primaryReport?.followers ?? 0);

    const avgEngagement =
        allReports.length > 0
            ? allReports.reduce(
                (sum, profile) => sum + Number(profile?.engagementRate ?? 0),
                0
            ) / allReports.length
            : Number(primaryReport?.engagementRate ?? 0);

    const brandCollabs = primaryReport?.sponsoredPosts?.length ?? 0;
    const deliverables = primaryReport?.recentPosts?.length ?? 0;

    const socialCards: SocialCard[] = [
        {
            label: "Instagram",
            profile: instagramProfile,
            value: formatCompactNumber(instagramProfile?.followers),
            sub: "Followers Growth",
            statOneLabel: "AVG LIKES",
            statOneValue: formatCompactNumber(
                instagramProfile?.stats?.avgLikes?.value ?? instagramProfile?.avgLikes
            ),
            statTwoLabel: "ENG. RATE",
            statTwoValue: formatPercent(instagramProfile?.engagementRate, true),
            icon: Instagram,
            trend:
                instagramProfile?.recentPosts
                    ?.slice(0, 10)
                    ?.reverse()
                    ?.map((post) => Number(post?.likes ?? 0)) ?? [],
            hasData: !!instagramProfile?.followers,
            isPrimary: isPrimaryReport(instagramProfile ?? null),
        },
        {
            label: "YouTube",
            profile: youtubeProfile,
            value: formatCompactNumber(youtubeProfile?.followers ?? youtubeProfile?.subscribers),
            sub: "Followers Growth",
            statOneLabel: "AVG LIKES",
            statOneValue: formatCompactNumber(
                youtubeProfile?.stats?.avgLikes?.value ?? youtubeProfile?.avgLikes
            ),
            statTwoLabel: "ENG. RATE",
            statTwoValue: formatPercent(youtubeProfile?.engagementRate, true),
            icon: Youtube,
            trend:
                youtubeProfile?.recentPosts
                    ?.slice(0, 10)
                    ?.reverse()
                    ?.map((post) => Number(post?.likes ?? 0)) ?? [],
            hasData: !!(youtubeProfile?.followers ?? youtubeProfile?.subscribers),
            isPrimary: isPrimaryReport(youtubeProfile ?? null),
        },
        {
            label: "TikTok",
            profile: tiktokProfile,
            value: formatCompactNumber(tiktokProfile?.followers),
            sub: "Followers Growth",
            statOneLabel: "AVG LIKES",
            statOneValue: formatCompactNumber(
                tiktokProfile?.stats?.avgLikes?.value ?? tiktokProfile?.avgLikes
            ),
            statTwoLabel: "ENG. RATE",
            statTwoValue: formatPercent(tiktokProfile?.engagementRate, true),
            icon: TiktokLogoIcon,
            trend:
                tiktokProfile?.recentPosts
                    ?.slice(0, 10)
                    ?.reverse()
                    ?.map((post) => Number(post?.likes ?? 0)) ?? [],
            hasData: !!tiktokProfile?.followers,
            isPrimary: isPrimaryReport(tiktokProfile ?? null),
        },
    ].filter((item) => item.hasData);

    const statCards: StatCard[] = [
        { label: "Total Reach", value: formatCompactNumber(totalReach), delta: null, icon: Users },
        { label: "Avg. Engagement", value: formatPercent(avgEngagement, true), delta: null, icon: TrendingUp },
        { label: "Brand Collabs", value: brandCollabs ? String(brandCollabs) : "—", delta: null, icon: Star },
        { label: "Acceptance Rate", value: "—", delta: null, icon: CheckCircle2 },
        { label: "Deliverables", value: deliverables ? String(deliverables) : "—", delta: null, icon: CirclePlus },
    ];

    const audienceData = primaryReport?.audience ?? {};
    const geoCountries: AudienceCountry[] = audienceData?.geoCountries ?? [];
    const ages: AudienceAge[] = audienceData?.ages ?? [];
    const genders: AudienceGender[] = audienceData?.genders ?? [];

    const categoryTags: string[] =
        primaryReport?.hashtags?.slice(0, 8)?.map((item) => `#${item.tag}`) ?? [];

    const galleryFallbackBg = [
        "from-zinc-300 via-zinc-100 to-white",
        "from-zinc-900 via-zinc-700 to-zinc-400",
        "from-black via-zinc-800 to-zinc-500",
        "from-zinc-950 via-zinc-700 to-zinc-300",
    ] as const;

    const galleryItems: GalleryItem[] =
        primaryReport?.popularPosts?.slice(0, 4)?.map((post, index) => ({
            title: truncateText(post?.text, 28),
            subtitle: post?.type ? post.type.toUpperCase() : "Post",
            image: post?.image ?? post?.thumbnail,
            bg: galleryFallbackBg[index % galleryFallbackBg.length],
        })) ?? [];

    const creatorRating =
        primaryReport?.stats?.paidPostPerformance !== undefined &&
            primaryReport?.stats?.paidPostPerformance !== null
            ? (Number(primaryReport.stats.paidPostPerformance) * 10).toFixed(1)
            : "—";

    const topLocations: LocationDataItem[] = geoCountries.slice(0, 5).map((country) => ({
        name: country.name,
        value: (country.weight * 100).toFixed(1),
    }));

    const ageData: AgeDataItem[] = ages.map((age) => ({
        range: age.code,
        percentage: (age.weight * 100).toFixed(1),
    }));

    const genderData: GenderDataItem[] = genders.map((gender) => ({
        type: gender.code === "MALE" ? "Male" : "Female",
        percentage: (gender.weight * 100).toFixed(1),
    }));

    const reviews: ReviewData[] =
        (mediaKit?.reviews?.length ?? 0) > 0
            ? (mediaKit!.reviews as ReviewData[])
            : [
                {
                    name: "Sarah Jenkins",
                    role: "Brand Manager, LuxeBeauty",
                    text: `"Incredibly professional and hit all our KPIs. The engagement on the Reels was 40% higher than our average."`,
                    rating: 5,
                },
                {
                    name: "Marcus Thorne",
                    role: "Head of Marketing, NextGen",
                    text: `"Great content quality. Communication was a bit slow initially but the final output was worth the wait."`,
                    rating: 4,
                },
            ];

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen w-full text-zinc-900">
            <div className="w-full px-5 py-4 lg:px-6 xl:px-8">
                <header className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white">
                    <div className="flex items-center gap-8">
                        <nav className="hidden items-center gap-6 md:flex">
                            {(["Influencer Profile"] as const).map((item) => (
                                <button
                                    key={item}
                                    className="relative py-2 text-sm font-medium transition text-black"
                                >
                                    {item}
                                    <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-black" />
                                </button>
                            ))}
                        </nav>
                    </div>
                </header>

                <div className="space-y-6">
                    {/* ── Hero ── */}
                    <section className="rounded-[28px] bg-white p-6">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                            <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
                                <div className="relative shrink-0">
                                    <div
                                        className="h-24 w-24 rounded-3xl bg-gradient-to-br from-zinc-200 via-zinc-500 to-black shadow-inner sm:h-28 sm:w-28"
                                        style={
                                            primaryReport?.picture
                                                ? {
                                                    backgroundImage: `url(${primaryReport.picture})`,
                                                    backgroundSize: "cover",
                                                    backgroundPosition: "center",
                                                }
                                                : {}
                                        }
                                    />
                                    <div className="absolute top-20 -right-1 flex h-8 w-8 items-center justify-center rounded-2xl bg-white text-black shadow-sm">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                                            {primaryReport?.name ?? mediaKit?.name ?? "—"}
                                        </h1>
                                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                                            Verified Creator
                                        </span>
                                    </div>

                                    <p className="max-w-3xl text-sm leading-6 text-zinc-600 sm:text-[15px]">
                                        {primaryReport?.bio ??
                                            mediaKit?.additionalNotes ??
                                            "No additional notes available."}
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {categoryTags.length ? (
                                            categoryTags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                                        ) : (
                                            <Tag>—</Tag>
                                        )}
                                    </div>

                                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:max-w-3xl xl:grid-cols-3">
                                        {(
                                            [
                                                {
                                                    label: "Instagram",
                                                    handle: instagramProfile?.username,
                                                    icon: Instagram,
                                                    profile: instagramProfile,
                                                },
                                                {
                                                    label: "YouTube",
                                                    handle: youtubeProfile?.username,
                                                    icon: Youtube,
                                                    profile: youtubeProfile,
                                                },
                                                {
                                                    label: "TikTok",
                                                    handle: tiktokProfile?.username,
                                                    icon: Play,
                                                    profile: tiktokProfile,
                                                },
                                            ] as const
                                        )
                                            .filter((item) => !!item.handle)
                                            .map((item) => {
                                                const Icon = item.icon;
                                                const isPrimary =
                                                    item.profile && isPrimaryReport(item.profile);

                                                return (
                                                    <div
                                                        key={item.label}
                                                        className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3"
                                                    >
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-700">
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                                                                    {item.label}
                                                                </div>
                                                                {isPrimary && (
                                                                    <CheckSquare className="h-4 w-4 text-green-600" />
                                                                )}
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
                                    {(
                                        [
                                            {
                                                label: "Location",
                                                value:
                                                    mediaKit?.country ??
                                                    primaryReport?.country ??
                                                    "—",
                                                icon: MapPin,
                                            },
                                            {
                                                label: "Language",
                                                value:
                                                    mediaKit?.languages
                                                        ?.map((item) => item?.name)
                                                        .filter(Boolean)
                                                        .join(", ") ||
                                                    primaryReport?.language?.name ||
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
                                        ] as const
                                    ).map((item) => {
                                        const Icon = item.icon;
                                        const shouldHide =
                                            !!brandId &&
                                            (item.label === "Email" || item.label === "Phone");

                                        if (shouldHide) return null;
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
                                    {!brandId ? (
                                        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800">
                                            <CopyIcon className="h-4 w-4" />
                                            Copy link
                                        </button>
                                    ) : null}
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

                    {/* ── Social Breakdown ── */}
                    <section className="rounded-[28px] bg-white p-6">
                        <SectionTitle title="Social Breakdown" />
                        <div
                            className="grid gap-4"
                            style={{
                                gridTemplateColumns: `repeat(${Math.min(socialCards.length, 3)}, minmax(0, 1fr))`,
                            }}
                        >
                            {socialCards.map((item) => {
                                const Icon = item.icon;
                                const gradientId = `social-breakdown-gradient-${item.label.toLowerCase()}`;

                                return (
                                    <div
                                        key={item.label}
                                        className="rounded-lg bg-white p-4 relative border border-zinc-100"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-semibold text-zinc-900">
                                                    {item.label}
                                                </div>
                                                {item.isPrimary && (
                                                    <CheckSquare className="h-4 w-4 text-green-600" />
                                                )}
                                            </div>
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-500">
                                                <Icon className="h-3.5 w-3.5" />
                                            </div>
                                        </div>

                                        <SocialSparkLine
                                            data={item.trend}
                                            gradientId={gradientId}
                                            followerCount={item.value}
                                        />

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

                    {/* ── Demographics + Rating ── */}
                    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
                        <section className="rounded-[28px] bg-white p-6">
                            <SectionTitle title="Audience Demographics" />
                            <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
                                {/* Pie Chart */}
                                <div className="rounded-3xl p-6 flex flex-col items-center">
                                    <PieChart
                                        series={[
                                            {
                                                data: ageData.length
                                                    ? ageData.map((age, i) => ({
                                                        id: age.range,
                                                        value: Number(age.percentage),
                                                        label: age.range,
                                                        color: (
                                                            ["#E8654A", "#3ABFAD", "#2D5470", "#E8C040", "#e4e4e7"] as const
                                                        )[i % 5],
                                                    }))
                                                    : [
                                                        {
                                                            id: "no-data",
                                                            value: 1,
                                                            label: "No data",
                                                            color: "#e4e4e7",
                                                        },
                                                    ],
                                                innerRadius: 60,
                                                outerRadius: 100,
                                                paddingAngle: 2,
                                                cornerRadius: 4,
                                                highlightScope: { fade: "global", highlight: "item" },
                                                faded: {
                                                    innerRadius: 60,
                                                    additionalRadius: -4,
                                                    color: "gray",
                                                },
                                            },
                                        ]}
                                        width={240}
                                        height={240}
                                        // slotProps={{ legend: { hidden: true } }}
                                        margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                                    >
                                        <text
                                            x={120}
                                            y={112}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 600,
                                                fill: "#a1a1aa",
                                                letterSpacing: "0.1em",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            AGE GROUPS
                                        </text>
                                    </PieChart>

                                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-600">
                                        {ageData.map((age, i) => (
                                            <div key={age.range} className="flex items-center gap-1.5">
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full"
                                                    style={{
                                                        backgroundColor: (
                                                            ["#E8654A", "#3ABFAD", "#2D5470", "#E8C040", "#e4e4e7"] as const
                                                        )[i % 5],
                                                    }}
                                                />
                                                <span>{age.range}</span>
                                                <span className="font-semibold text-zinc-900">
                                                    {age.percentage}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Locations + Gender */}
                                <div className="space-y-4 rounded-3xl border border-zinc-200 p-6">
                                    <div>
                                        <div className="mb-4 text-sm font-semibold text-zinc-900">
                                            Top Locations
                                        </div>
                                        {topLocations.length ? (
                                            <BarChart
                                                layout="horizontal"
                                                height={topLocations.length * 48}
                                                yAxis={[
                                                    {
                                                        scaleType: "band",
                                                        data: topLocations.map((item) => item.name),
                                                        tickLabelStyle: { fontSize: 12, fill: "#1A1A1A" },
                                                    },
                                                ]}
                                                xAxis={[
                                                    {
                                                        min: 0,
                                                        max: 100,
                                                        tickLabelStyle: { display: "none" },
                                                        disableTicks: true,
                                                        disableLine: true,
                                                    },
                                                ]}
                                                series={[
                                                    {
                                                        data: topLocations.map((item) => Number(item.value) || 0),
                                                        color: "#FBBF00",
                                                        valueFormatter: (v: number | null) => `${v ?? 0}%`,
                                                    },
                                                ]}
                                                borderRadius={6}
                                                margin={{ top: 0, bottom: 0, left: 90, right: 40 }}
                                                // slotProps={{ legend: { hidden: true } }}
                                                sx={{
                                                    "& .MuiChartsAxis-left .MuiChartsAxis-line": { display: "none" },
                                                    "& .MuiChartsAxis-left .MuiChartsAxis-tick": { display: "none" },
                                                    "& .MuiChartsAxis-bottom .MuiChartsAxis-line": { display: "none" },
                                                    "& .MuiChartsAxis-bottom .MuiChartsAxis-tick": { display: "none" },
                                                    "& .MuiBarElement-root": { rx: 6 },
                                                }}
                                            />
                                        ) : (
                                            <div className="text-sm text-zinc-400">—</div>
                                        )}
                                    </div>

                                    {genderData.length > 0 && (
                                        <div className="mt-2">
                                            <div className="mb-4 text-sm font-semibold text-zinc-900">
                                                Gender Distribution
                                            </div>
                                            <BarChart
                                                height={120}
                                                xAxis={[
                                                    {
                                                        scaleType: "band",
                                                        data: genderData.map((g) => g.type),
                                                        tickLabelStyle: { fontSize: 12, fill: "#1A1A1A" },
                                                        disableLine: true,
                                                        disableTicks: true,
                                                    },
                                                ]}
                                                yAxis={[
                                                    {
                                                        min: 0,
                                                        max: 100,
                                                        tickLabelStyle: { display: "none" },
                                                        disableTicks: true,
                                                        disableLine: true,
                                                    },
                                                ]}
                                                series={[
                                                    {
                                                        data: genderData.map((g) => Number(g.percentage) || 0),
                                                        color: "#FBBF00",
                                                        valueFormatter: (v: number | null) => `${v ?? 0}%`,
                                                    },
                                                ]}
                                                borderRadius={6}
                                                margin={{ top: 10, bottom: 24, left: 0, right: 0 }}
                                                // slotProps={{ legend: { hidden: true } }}
                                                sx={{
                                                    "& .MuiChartsAxis-bottom .MuiChartsAxis-line": { display: "none" },
                                                    "& .MuiChartsAxis-bottom .MuiChartsAxis-tick": { display: "none" },
                                                    "& .MuiChartsAxis-left": { display: "none" },
                                                }}
                                            />
                                            <div className="flex gap-4">
                                                {genderData.map((gender) => (
                                                    <div key={gender.type} className="flex-1 text-center">
                                                        <div className="text-xs text-zinc-500">{gender.type}</div>
                                                        <div className="text-lg font-semibold">
                                                            {gender.percentage}%
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-6 md:grid-cols-2 2xl:grid-cols-1">
                            <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
                                <SectionTitle title="Category Tags" />
                                <div className="flex flex-wrap gap-2">
                                    {categoryTags.length ? (
                                        categoryTags.map((tag) => <Tag key={tag}>{tag}</Tag>)
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
                                            <Star key={i} className="h-4 w-4 " color="#FBBF00" fill="#FBBF00"/>
                                        ))}
                                        <span className="ml-2 text-sm font-medium text-zinc-600">
                                            Top performer
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* ── Content Gallery ── */}
                    <section className="rounded-[28px] bg-white p-6">
                        <SectionTitle title="Content Gallery" />
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {galleryItems.length
                                ? galleryItems.map((item, index) => (
                                    <div
                                        key={`${item.title}-${index}`}
                                        className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${item.bg} p-4 shadow-sm`}
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
                                        <div className="absolute inset-0 transition" />
                                        <div className="relative z-10 flex h-52 items-end rounded-[1.4rem]">
                                            <div>
                                                <div className="text-lg font-semibold text-white drop-shadow-sm">
                                                    {item.title}
                                                </div>
                                                <div className="text-sm text-white/85">{item.subtitle}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                                : galleryFallbackBg.map((bg, index) => (
                                    <div
                                        key={index}
                                        className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${bg} p-4 shadow-sm`}
                                    >
                                        <div className="absolute inset-0 bg-black/10 opacity-0 transition group-hover:opacity-100" />
                                        <div className="flex h-52 items-end rounded-[1.4rem] border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                                            <div>
                                                <div className="text-lg font-semibold text-white drop-shadow-sm">
                                                    —
                                                </div>
                                                <div className="text-sm text-white/85">—</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </section>

                    {/* ── Campaign History ── */}
                    <section className="bg-white p-6">
                        <SectionTitle title="Past Collaborations" />
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-y-3 text-left">
                                <thead>
                                    <tr className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                                        <th className="px-4">Company</th>
                                        <th className="px-4">Category</th>
                                        <th className="px-4">Brief</th>
                                        <th className="px-4">Rate</th>
                                        <th className="px-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contractedCampaigns.length ? (
                                        contractedCampaigns.map((row, index) => (
                                            <tr
                                                key={row._id ?? index}
                                                className="rounded-2xl text-sm text-zinc-600"
                                            >
                                                <td className="rounded-l-2xl px-4 py-4 font-semibold text-zinc-900">
                                                    {row.company}
                                                </td>
                                                <td className="rounded-r-2xl px-4 py-4 font-medium text-zinc-900">
                                                    {row.category}
                                                </td>
                                                <td className="px-4 py-4">{row.brief}</td>
                                                <td className="px-4 py-4 font-semibold text-zinc-900">{row.rate}</td>
                                                <td className="px-4 py-4">
                                                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                                                        {row.status}
                                                    </span>
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
                    {/* ── Ratings & Reviews ── */}
                    <section className="rounded-[28px] bg-white p-6">
                        <SectionTitle title="Ratings & Reviews" />
                        <div className="grid gap-4 lg:grid-cols-2">
                            {reviews.map((review, index) => (
                                <ReviewCard key={`${review?.name ?? "review"}-${index}`} {...review} />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}