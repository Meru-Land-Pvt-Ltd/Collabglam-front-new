import {
    Link as LinkIcon,
    Eye,
    IdentificationCard,
    Newspaper,
    Trash,
    DotsThree,
    CaretRight,
    PencilSimpleIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    ReferenceDot,
} from "recharts";
import {
    Combobox,
    ComboboxTrigger,
    ComboboxContent,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/buttonComp";
import { apiGetManageContractInfo } from "../../services/brandApi";
import Swal from "sweetalert2";
import api from "@/lib/api";
import { X, DownloadSimple } from "@phosphor-icons/react";
const menuItems = [
    { label: "Copy Link", icon: LinkIcon, key: "copylink" },
    { label: "View Influencer list", icon: Eye, key: "viewinfluencerlist" },
    {
        label: "Invite Influencer",
        icon: IdentificationCard,
        key: "inviteinfluencer",
    },
    { label: "Link IEM Folder", icon: Newspaper, key: "linkiemfolder" },
    {
        label: "Move to workspace",
        icon: null,
        key: "moveToWorkspace",
        hasArrow: true,
    },
] as const;

type PlatformKey = "instagram" | "youtube" | "tiktok";

type ManageProfileProps = {
    contractId?: string;
};

const dash = (value: any) =>
    value === undefined || value === null || value === "" ? "-" : value;

const safeArray = <T,>(value: T[] | undefined | null): T[] =>
    Array.isArray(value) ? value : [];

const compactNumber = (value: any) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";
    return new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(num);
};

const fullNumber = (value: any) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";
    return new Intl.NumberFormat("en").format(num);
};

const formatPercent = (value: any, multiply = true, digits = 2) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";
    const finalValue = multiply ? num * 100 : num;
    return `${finalValue.toFixed(digits)}%`;
};

const formatDelta = (value: any, multiply = true, digits = 1) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";
    const finalValue = multiply ? num * 100 : num;
    return `${finalValue >= 0 ? "+" : ""}${finalValue.toFixed(digits)}%`;
};

const formatDate = (value: any) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
    }).format(date);
};

const formatTimeAgo = (value: any) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return "1 month ago";
    if (diffMonths < 12) return `${diffMonths} months ago`;

    const diffYears = Math.floor(diffMonths / 12);
    return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
};

const humanize = (value: string) =>
    value
        ? value
            .toLowerCase()
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ")
        : "-";

const extractHandle = (value: any) => {
    if (!value) return "-";
    if (typeof value !== "string") return "-";

    if (value.startsWith("@")) return value;

    try {
        const url = new URL(value);
        const path = url.pathname.replaceAll("/", "").trim();
        return path ? `@${path}` : "-";
    } catch {
        return value.startsWith("http") ? "-" : `@${value.replace("@", "")}`;
    }
};

const countryLabel = (value: any) => {
    const map: Record<string, string> = {
        US: "United States",
        GB: "United Kingdom",
        CA: "Canada",
        AU: "Australia",
        IN: "India",
        DE: "Germany",
        MX: "Mexico",
        NL: "The Netherlands",
        PH: "Philippines",
        ID: "Indonesia",
    };

    if (!value) return "";
    return map[value] || value;
};

const getUniqueValues = (arr: any[], key: string) =>
    [...new Set(safeArray(arr).map((item) => item?.[key]).filter(Boolean))];

const getTopLanguages = (languages: any[]) => {
    const items = safeArray(languages)
        .filter((item) => item?.name)
        .sort((a: any, b: any) => Number(b?.weight || 0) - Number(a?.weight || 0))
        .slice(0, 2)
        .map((item: any) => item.name);

    return items.length ? items.join(" , ") : "-";
};

const getChartData = (history: any[]) =>
    safeArray(history).map((item) => ({
        day: new Date(`${item.month}-01`).toLocaleString("en", {
            month: "short",
        }),
        engagement: Number(item.avg_engagements ?? item.avgLikes ?? item.avg_likes ?? 0),
    }));

const getYAxisTicks = (maxValue: number) => {
    if (!maxValue || maxValue <= 0) return [25, 50, 75, 100];
    const roundedMax = Math.ceil(maxValue / 100000) * 100000;
    return [
        Math.round(roundedMax * 0.25),
        Math.round(roundedMax * 0.5),
        Math.round(roundedMax * 0.75),
        roundedMax,
    ].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i);
};

const calcPostEngagement = (post: any, followers: number) => {
    const likes = Number(post?.likes || 0);
    const comments = Number(post?.comments || 0);
    if (!followers) return "-";
    return formatPercent((likes + comments) / followers, true, 2);
};

const Badge = ({
    children,
    color = "gray",
}: {
    children: React.ReactNode;
    color?: "gray" | "pink";
}) => {
    const colors = {
        gray: "bg-gray-100 text-gray-600",
        pink: "bg-pink-100 text-pink-600",
    };

    return (
        <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${colors[color]}`}
        >
            {children}
        </span>
    );
};

const StatCard = ({
    label,
    value,
    sub,
}: {
    label: string;
    value: React.ReactNode;
    sub?: string;
}) => (
    <div className="flex flex-col gap-1">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            {label}
        </p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
);

const TrendBadge = ({ value }: { value: string }) => (
    <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-600 text-xs font-semibold px-2 py-0.5 rounded-full">
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 2l4 5H2l4-5z" />
        </svg>
        {value}
    </span>
);

const SocialIcon = ({ type }: { type: string }) => {
    if (type === "youtube")
        return (
            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100">
                <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.8 15.5V8.5l6.2 3.5-6.2 3.5z" />
                </svg>
            </span>
        );

    if (type === "instagram")
        return (
            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-pink-100">
                <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
            </span>
        );

    if (type === "tiktok")
        return (
            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">
                <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
                </svg>
            </span>
        );

    return (
        <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
            {type?.slice(0, 1)?.toUpperCase() || "?"}
        </span>
    );
};

const PlatformBadgeIcon = ({ platform }: { platform: string }) => {
    const normalized = platform?.toLowerCase?.() || "";
    if (normalized.includes("youtube")) return <SocialIcon type="youtube" />;
    if (normalized.includes("instagram")) return <SocialIcon type="instagram" />;
    if (normalized.includes("tiktok")) return <SocialIcon type="tiktok" />;
    return <SocialIcon type={normalized} />;
};

export default function ManageProfile({ contractId }: ManageProfileProps) {

    const [timeRange, setTimeRange] = useState("Last 7 Days");
    const [expanded, setExpanded] = useState(false);
    const [workspaceSubmenuOpen, setWorkspaceSubmenuOpen] = useState(false);
    const menuRootRef = useRef<HTMLDivElement | null>(null);
    const [selectedPlatform, setSelectedPlatform] =
        useState<PlatformKey>("instagram");
    const searchParams = useSearchParams();
    const resolvedContractId = contractId || searchParams.get("id") || "";
    const [manageInfo, setManageInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [pdfUrl, setPdfUrl] = useState("");
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [viewingContractId, setViewingContractId] = useState<string | null>(null);
    const [contractLoading, setContractLoading] = useState(false);

    useEffect(() => {
        if (!resolvedContractId) {
            setLoading(false);
            return;
        }

        const fetchManageInfo = async () => {
            try {
                setLoading(true);
                setError("");

                const res = await apiGetManageContractInfo(resolvedContractId);
                setManageInfo(res);
            } catch (err) {
                console.error("Failed to fetch manage contract info", err);
                setError("Failed to load manage contract info");
            } finally {
                setLoading(false);
            }
        };

        fetchManageInfo();
    }, [resolvedContractId]);

    const workspaces = [
        { id: 1, name: "Workspace Alpha", logo: "A" },
        { id: 2, name: "Workspace Beta", logo: "B" },
        { id: 3, name: "Workspace Gamma", logo: "G" },
    ];

    const handlers: Record<string, (() => void) | undefined> = {
        copylink: () => {
            navigator.clipboard.writeText(window.location.href);
        },
        viewinfluencerlist: () => {
            console.log("View Influencer list");
        },
        inviteinfluencer: () => {
            console.log("Invite Influencer");
        },
        linkiemfolder: () => {
            console.log("Link IEM Folder");
        },
    };

    const onMoveToWorkspace = () => {
        console.log("Move to workspace");
    };

    const onDelete = () => {
        console.log("Delete influencer");
    };

    const contract = manageInfo?.contract || {};
    const content = contract?.content || {};
    const campaign = content?.campaign || {};
    const scheduleA = content?.scheduleA || {};
    const commercial = scheduleA?.commercial || {};

    const modash = manageInfo?.modashData || {};
    const providerRaw = modash?.providerRaw || {};
    const providerProfileRoot = providerRaw?.profile || {};
    const providerProfile = providerProfileRoot?.profile || providerRaw?.profile || {};

    const deliverables = safeArray(scheduleA?.deliverables);
    const contentFormats = getUniqueValues(deliverables, "deliverableFormat");
    const contentPlatforms = getUniqueValues(deliverables, "platform");

    const providerKey = (
        modash?.provider ||
        providerRaw?.provider ||
        "instagram"
    ).toLowerCase() as PlatformKey;

    const statsByContentType =
        modash?.statsByContentType ||
        providerRaw?.statsByContentType ||
        {};

    const realStats =
        providerKey === "instagram"
            ? statsByContentType?.all || {}
            : statsByContentType?.[providerKey] || statsByContentType?.all || {};

    const realHistory =
        safeArray(realStats?.statHistory).length > 0
            ? safeArray(realStats?.statHistory)
            : safeArray(statsByContentType?.all?.statHistory);

    const chartData = getChartData(realHistory);
    const lastPoint = chartData[chartData.length - 1];
    const prevPoint = chartData[chartData.length - 2];
    const chartChange =
        lastPoint && prevPoint && prevPoint.engagement
            ? (lastPoint.engagement - prevPoint.engagement) / prevPoint.engagement
            : null;

    const yAxisMax = Math.max(...chartData.map((d) => d.engagement), 0);
    const yAxisTicks = getYAxisTicks(yAxisMax);
    const chartDomainMax =
        yAxisTicks.length > 0 ? Math.max(...yAxisTicks) : Math.max(yAxisMax, 100);

    const profileFollowers = Number(
        providerProfile?.followers ||
        modash?.followers ||
        modash?.stats?.followers?.value ||
        0
    );

    const profileName = dash(
        providerProfile?.fullname || modash?.fullname || contract?.influencerName
    );
    const profileHandle = dash(
        extractHandle(
            providerProfile?.username ||
            modash?.username ||
            content?.influencer?.postingHandleUrl ||
            contract?.influencerHandle
        )
    );
    const profileImage = dash(providerProfile?.picture || modash?.picture);
    const profileBio = dash(modash?.bio || providerProfile?.bio);
    const profileVerified = Boolean(
        providerProfileRoot?.isVerified || modash?.isVerified
    );

    const profileLocation = [
        providerProfileRoot?.city || modash?.city || "",
        providerProfileRoot?.state || modash?.state || "",
        countryLabel(providerProfileRoot?.country || modash?.country || ""),
    ]
        .filter(Boolean)
        .join(", ");

    const accountType = dash(modash?.accountType || providerProfileRoot?.accountType || "Creator");
    const providerLabel =
        providerKey === "instagram"
            ? "Instagram"
            : providerKey === "youtube"
                ? "Youtube"
                : providerKey === "tiktok"
                    ? "TikTok"
                    : humanize(providerKey);

    const totalMilestones =
        deliverables.reduce((sum: number, item: any) => {
            const qty = Number(item?.qty);
            return sum + (Number.isFinite(qty) && qty > 0 ? qty : 1);
        }, 0) || safeArray(contract?.milestones).length || 0;

    const influencerPayment =
        commercial?.currency && commercial?.totalCampaignFee
            ? `${commercial.currency} $ ${fullNumber(commercial.totalCampaignFee)}`
            : contract?.currency && contract?.feeAmount
                ? `${contract.currency} $ ${fullNumber(contract.feeAmount)}`
                : "-";

    const contentLanguages = getTopLanguages(
        modash?.audience?.languages || providerRaw?.audience?.languages || []
    );

    const avgViewsValue =
        statsByContentType?.reels?.avgReelsPlays ||
        modash?.avgReelsPlays ||
        providerRaw?.avgReelsPlays ||
        null;

    const avgViews = avgViewsValue ? compactNumber(avgViewsValue) : "-";

    const engagementRate = formatPercent(
        providerProfile?.engagementRate ||
        realStats?.engagementRate ||
        modash?.engagementRate,
        true,
        2
    );

    const engagementTrend =
        chartChange === null ? "-" : formatDelta(chartChange, true, 1);

    const followersText =
        profileFollowers > 0 ? `${compactNumber(profileFollowers)} followers` : "-";

    const avgEngagementText =
        realStats?.engagements || providerProfile?.engagements
            ? `${compactNumber(
                realStats?.engagements || providerProfile?.engagements
            )} avg engagement`
            : "-";

    const recentPostsRaw =
        safeArray(modash?.recentPosts).length > 0
            ? safeArray(modash?.recentPosts)
            : safeArray(providerRaw?.recentPosts).length > 0
                ? safeArray(providerRaw?.recentPosts)
                : safeArray(modash?.popularPosts);

    const postItems = recentPostsRaw.slice(0, 5);

    const milestoneRows = deliverables.map((item: any, index: number) => ({
        id: `${item?.srNo || index + 1}-${item?.platform || "item"}`,
        name: item?.name || `Deliverable ${item?.srNo || index + 1}`,
        format: dash(item?.deliverableFormat),
        platform: dash(item?.platform),
        status: contract?.isAssigned ? "Active" : humanize(contract?.status || "Active"),
        qty: dash(item?.qty || 1),
        deadline: item?.liveDate
            ? formatDate(item?.liveDate)
            : item?.draftDue
                ? formatDate(item?.draftDue)
                : "-",
    }));

    const platformTemplates = {
        instagram: {
            label: "Instagram",
            stroke: "#ff2b75",
            stripe: "rgba(255,43,117,0.12)",
            dotStroke: "#ff7aa8",
        },
        youtube: {
            label: "Youtube",
            stroke: "#ef4444",
            stripe: "rgba(239,68,68,0.12)",
            dotStroke: "#f87171",
        },
        tiktok: {
            label: "TikTok",
            stroke: "#374151",
            stripe: "rgba(55,65,81,0.12)",
            dotStroke: "#6b7280",
        },
    } as const;

    const platformChartData = useMemo(() => {
        const emptyData = [{ day: "-", engagement: 0 }];

        const makeDefault = (key: PlatformKey) => ({
            ...platformTemplates[key],
            total: "-",
            change: "-",
            subscribers: "-",
            avg: "-",
            dot: { x: "-", y: 0 },
            data: emptyData,
        });

        const result: Record<
            PlatformKey,
            {
                label: string;
                total: string;
                change: string;
                subscribers: string;
                avg: string;
                stroke: string;
                stripe: string;
                dotStroke: string;
                dot: { x: string; y: number };
                data: { day: string; engagement: number }[];
            }
        > = {
            instagram: makeDefault("instagram"),
            youtube: makeDefault("youtube"),
            tiktok: makeDefault("tiktok"),
        };

        result[providerKey] = {
            ...platformTemplates[providerKey],
            total: engagementRate,
            change: engagementTrend,
            subscribers: followersText,
            avg: avgEngagementText,
            dot: {
                x: prevPoint?.day || lastPoint?.day || "-",
                y: prevPoint?.engagement || lastPoint?.engagement || 0,
            },
            data: chartData.length ? chartData : emptyData,
        };

        return result;
    }, [
        providerKey,
        engagementRate,
        engagementTrend,
        followersText,
        avgEngagementText,
        prevPoint?.day,
        prevPoint?.engagement,
        lastPoint?.day,
        lastPoint?.engagement,
        chartData,
    ]);
    useEffect(() => {
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [pdfUrl]);

    const handleViewContract = async (contractPdfId: string | null) => {
        if (!contractPdfId) return;

        try {
            setContractLoading(true);
            const res = await api.post(
                "/contract/viewPdf",
                { contractId: contractPdfId },
                { responseType: "blob" }
            );

            if (pdfUrl) URL.revokeObjectURL(pdfUrl);

            const url = URL.createObjectURL(res.data);
            setPdfUrl(url);
            setViewingContractId(contractPdfId);
            setShowPdfModal(true);
        } catch (e: any) {
            Swal.fire("Error", e?.message || "Failed to load contract PDF.", "error");
        } finally {
            setContractLoading(false);
        }
    };

     const handleDownloadContract = async (
        filename = "BrandxInfluencer_contract.pdf"
    ) => {
        if (!resolvedContractId) return;

        try {
            setContractLoading(true);

            const res = await api.post(
                "/contract/viewPdf",
                { contractId: resolvedContractId },
                { responseType: "blob" }
            );

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        } catch (e: any) {
            Swal.fire("Error", e?.message || "Failed to download contract PDF.", "error");
        } finally {
            setContractLoading(false);
        }
    };

    const closePdfModal = () => {
        setShowPdfModal(false);
        setViewingContractId(null);
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl("");
        }
    };

    const currentPlatform = platformChartData[selectedPlatform];
    const printableContractId = resolvedContractId
    // const contractFileName =
    //     `${dash(contract?.brandName) !== "-" ? contract?.brandName : "Brand"}xInfluencer_contract.pdf`;

    const contractFileName = `BrandxInfluencer_contract.pdf`;
    const contractSize = "-";

    if (loading) {
        return (
            <div className="p-6 text-sm text-gray-500">
                Loading...
            </div>
        );
    }

    if (!resolvedContractId) {
        return (
            <div className="p-6 text-sm text-gray-500">
                Missing contract id in search params.
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-sm text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div
            className="min-h-screen font-sans"
            style={{ fontFamily: "'DM Sans', 'Nunito', sans-serif" }}
        >
            <div>
                <div className="bg-white border border-gray-100 overflow-hidden">
                    {/* ── Header ── */}
                    <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                        <div className="flex items-start justify-between gap-4">
                            {/* Avatar + Info */}
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <img
                                        src={
                                            profileImage !== "-"
                                                ? profileImage
                                                : "https://i.pravatar.cc/72?img=47"
                                        }
                                        alt={profileName}
                                        className="w-16 h-16 rounded-full object-cover ring-2 ring-pink-200"
                                    />
                                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                        <span className="w-3 h-3 bg-pink-500 rounded-full" />
                                    </span>
                                </div>

                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-lg font-bold text-gray-900">
                                            {profileName}
                                        </span>

                                        {profileVerified && (
                                            <svg
                                                className="w-4 h-4 text-blue-500"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                            >
                                                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                        <span>{profileHandle}</span>
                                        <span>·</span>
                                        <span>{accountType}</span>
                                        <span>·</span>
                                        <span>{providerLabel}</span>
                                    </div>

                                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                        <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                            />
                                        </svg>
                                        {dash(profileLocation)}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                    Active
                                </div>

                                <button className="text-sm font-semibold text-gray-700 border border-gray-700 px-4 py-1.5 rounded-md hover:bg-gray-50 transition">
                                    Connect Influencer
                                </button>

                                <button className="text-sm font-semibold text-gray-700 border border-gray-700 px-4 py-1.5 rounded-md hover:bg-gray-50 transition">
                                    View media kit
                                </button>

                                <Combobox>
                                    <ComboboxTrigger hideIcon>
                                        <Button
                                            variant="raised"
                                            size="sm"
                                            aria-label="More actions"
                                            className="
        my-0
        h-[2rem] w-[2.4rem]
        px-[0.5rem]
        rounded-[0.55rem]
        border border-[#1A1A1A]
        bg-white
        shadow-none
      "
                                        >
                                            <DotsThree size={20} weight="bold" />
                                        </Button>
                                    </ComboboxTrigger>

                                    <ComboboxContent
                                        align="end"
                                        className="
      w-[13.6875rem]
      rounded-[0.75rem]
      bg-white
      py-[1rem]
      px-[0.75rem]
      shadow-[0_8px_32px_rgba(0,0,0,0.13)]
    "
                                    >
                                        <div ref={menuRootRef} className="flex flex-col gap-[0.5rem]">
                                            {menuItems.map(({ label, icon: Icon, key }) => {
                                                const isCaretRight =
                                                    key === "moveToWorkspace" ||
                                                    key === "linkiemfolder" ||
                                                    key === "inviteinfluencer";

                                                const isWorkspace = key === "moveToWorkspace";

                                                const handleClick = (
                                                    e: React.MouseEvent
                                                ) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();

                                                    if (isWorkspace) {
                                                        setWorkspaceSubmenuOpen((prev) => !prev);
                                                        return;
                                                    }

                                                    setWorkspaceSubmenuOpen(false);
                                                    handlers[key]?.();
                                                };

                                                return (
                                                    <div key={key} className="relative">
                                                        <button
                                                            onClick={handleClick}
                                                            className="
                w-full flex items-center gap-[0.5rem]
                px-[0.5rem] py-[0.5rem]
                text-[0.875rem] font-medium
                rounded-[0.5rem]
                text-[#1A1A1A]
                hover:bg-[#F5F5F5]
                transition-colors
              "
                                                        >
                                                            {label === "Move to workspace" ? (
                                                                <img
                                                                    width={16}
                                                                    height={16}
                                                                    src="/Component 32.svg"
                                                                    alt="workspace icon"
                                                                    draggable={false}
                                                                />
                                                            ) : (
                                                                Icon && (
                                                                    <Icon
                                                                        size={16}
                                                                        className="w-[1rem] h-[1rem] text-[#1A1A1A]"
                                                                    />
                                                                )
                                                            )}

                                                            <span className="flex-1 text-left text-sm font-normal">
                                                                {label}
                                                            </span>

                                                            {isCaretRight && (
                                                                <CaretRight size={16} />
                                                            )}
                                                        </button>

                                                        {isWorkspace &&
                                                            workspaceSubmenuOpen && (
                                                                <div
                                                                    onClick={(e) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                    className="
                  absolute top-0 -left-55
                  w-[13rem]
                  rounded-[0.75rem]
                  bg-white
                  p-[0.5rem]
                  shadow-[0_8px_32px_rgba(0,0,0,0.13)]
                  z-50
                  flex flex-col gap-[0.25rem]
                "
                                                                >
                                                                    <p className="text-[0.7rem] text-[#999] font-medium uppercase tracking-wide ml-2 mb-1">
                                                                        Workspace name
                                                                    </p>

                                                                    {workspaces.map((ws) => (
                                                                        <button
                                                                            key={ws.id}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                onMoveToWorkspace();
                                                                                setWorkspaceSubmenuOpen(
                                                                                    false
                                                                                );
                                                                            }}
                                                                            className="
                      w-full flex items-center gap-3
                      border
                      p-2
                      rounded-md
                      text-sm font-medium
                      hover:bg-[#F5F5F5]
                      transition-colors
                    "
                                                                        >
                                                                            <span className="w-8 h-8 rounded-md bg-black flex items-center justify-center text-white">
                                                                                {ws.logo}
                                                                            </span>
                                                                            {ws.name}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                    </div>
                                                );
                                            })}

                                            <div className="border-t border-[#F0F0F0] my-2" />

                                            <button
                                                onClick={onDelete}
                                                className="flex items-center gap-2 px-2 py-2 rounded-md text-sm font-medium text-[#E53935] hover:bg-[#F5F5F5]"
                                            >
                                                <Trash size={16} />
                                                Delete
                                            </button>
                                        </div>
                                    </ComboboxContent>
                                </Combobox>
                            </div>
                        </div>

                        {/* Bio */}
                        <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                            {profileBio === "-"
                                ? "-"
                                : expanded
                                    ? profileBio
                                    : profileBio.length > 140
                                        ? `${profileBio.slice(0, 140)}...`
                                        : profileBio}{" "}
                            {profileBio !== "-" && profileBio.length > 140 && (
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="text-pink-500 font-medium hover:underline"
                                >
                                    {expanded ? "show less" : "read more..."}
                                </button>
                            )}
                        </p>
                    </div>

                    {/* ── Meta Stats ── */}
                    <div className="border border-gray-200 m-4 rounded-xl">
                        <div className="grid grid-cols-3 gap-0 border-b border-gray-200 mx-4">
                            {[
                                {
                                    label: "Total Milestones",
                                    value: totalMilestones ? String(totalMilestones) : "-",
                                },
                                {
                                    label: "Payment Type",
                                    value: dash(contract?.paymentType || campaign?.paymentType),
                                },
                                {
                                    label: "Influencer Payment",
                                    value: influencerPayment,
                                },
                            ].map((s) => (
                                <div key={s.label} className="px-6 py-4">
                                    <StatCard {...s} />
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-0">
                            <div className="px-6 py-4">
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
                                    Content Format
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    {contentFormats.length > 0 ? (
                                        contentFormats.map((format) => (
                                            <Badge key={format}>{format}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm font-semibold text-gray-800">
                                            -
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="px-6 py-4">
                                <StatCard
                                    label="Content Language"
                                    value={contentLanguages}
                                />
                            </div>

                            <div className="px-6 py-4">
                                <StatCard
                                    label="Active date"
                                    value={formatDate(
                                        campaign?.effectiveDate ||
                                        contract?.requestedEffectiveDate
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Bottom Section ── */}
                    <div className="grid grid-cols-2 gap-0">
                        {/* Left: Metrics + Note */}
                        <div className="border-r border-gray-100 px-4 py-4 flex flex-col gap-3">
                            {/* Avg Views Card */}
                            <div className="border border-gray-200 rounded-xl px-5 py-4">
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
                                    Avg views
                                </p>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {avgViews}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            per month
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {contentPlatforms.length > 0 ? (
                                            contentPlatforms.slice(0, 3).map((platform) => (
                                                <PlatformBadgeIcon
                                                    key={platform}
                                                    platform={platform}
                                                />
                                            ))
                                        ) : (
                                            <>
                                                <SocialIcon type="youtube" />
                                                <SocialIcon type="instagram" />
                                                <SocialIcon type="tiktok" />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Audience Match Card */}
                            <div className="border border-gray-200 rounded-xl px-5 py-4">
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
                                    Audience match
                                </p>

                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-gray-900">
                                        -
                                    </span>
                                </div>

                                <p className="text-xs text-gray-400 mt-0.5">
                                    per month
                                </p>

                                <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className="h-1.5 rounded-full bg-gradient-to-r from-pink-400 to-pink-600"
                                        style={{ width: "0%" }}
                                    />
                                </div>
                            </div>

                            {/* Internal Note */}
                            <div className="p-4 border border-gray-200 rounded-xl">
                                <p className="text-sm font-medium text-gray-500 py-2 border-b">
                                    Add Internal Note
                                </p>
                                <p className="text-sm text-gray-400 leading-relaxed line-clamp-4 py-2">
                                    -
                                </p>
                            </div>
                        </div>

                        {/* Right: Engagement Rate Chart */}
                        <div className="px-6 py-6 m-4 mb-1 border border-gray-200 rounded-[24px] bg-white">
                            <div className="flex items-center justify-between">
                                <p className="text-[18px] font-semibold text-gray-800">
                                    Engagement Rate
                                </p>

                                <div className="relative">
                                    <select
                                        value={timeRange}
                                        onChange={(e) => setTimeRange(e.target.value)}
                                        className="h-10 rounded-xl border border-gray-200 bg-white pl-4 pr-9 text-sm text-gray-600 appearance-none focus:outline-none"
                                    >
                                        <option>Last 7 Days</option>
                                        <option>Last 30 Days</option>
                                        <option>Last 90 Days</option>
                                    </select>

                                    <svg
                                        className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4">
                                <span className="text-3xl font-bold text-gray-900">
                                    {currentPlatform.total}
                                </span>
                                {currentPlatform.change !== "-" && (
                                    <TrendBadge value={currentPlatform.change} />
                                )}
                            </div>

                            <div className="relative mt-6">
                                <div className="absolute left-[40%] top-[22%] z-10 bg-white border border-gray-200 shadow-md rounded-2xl px-4 py-3 text-sm">
                                    <p className="font-medium text-gray-500">
                                        {currentPlatform.subscribers}
                                    </p>
                                    <p className="text-gray-700 mt-1">
                                        {currentPlatform.avg}
                                        {currentPlatform.change !== "-" && (
                                            <span className="ml-2 inline-block bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg font-semibold">
                                                {currentPlatform.change}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart
                                        data={currentPlatform.data}
                                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <pattern
                                                id="engagementStripes"
                                                width="8"
                                                height="8"
                                                patternUnits="userSpaceOnUse"
                                            >
                                                <rect width="8" height="8" fill="white" />
                                                <rect
                                                    width="2"
                                                    height="8"
                                                    fill={currentPlatform.stripe}
                                                />
                                            </pattern>
                                        </defs>

                                        <CartesianGrid
                                            vertical={false}
                                            strokeDasharray="4 4"
                                            stroke="#ececec"
                                        />

                                        <XAxis hide dataKey="day" />

                                        <YAxis
                                            domain={[0, chartDomainMax]}
                                            ticks={yAxisTicks}
                                            tickFormatter={(v) => compactNumber(v)}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: "#6b7280" }}
                                            width={42}
                                        />

                                        <Area
                                            type="monotone"
                                            dataKey="engagement"
                                            stroke={currentPlatform.stroke}
                                            strokeWidth={3}
                                            fill="url(#engagementStripes)"
                                            fillOpacity={1}
                                            isAnimationActive={false}
                                            dot={false}
                                            activeDot={false}
                                        />

                                        {currentPlatform.dot.x !== "-" && (
                                            <ReferenceDot
                                                x={currentPlatform.dot.x}
                                                y={currentPlatform.dot.y}
                                                r={6}
                                                fill="#fff"
                                                stroke={currentPlatform.dotStroke}
                                                strokeWidth={3}
                                            />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-6 flex justify-center">
                                <div className="inline-flex items-center gap-3 rounded-2xl bg-[#f7f7f7] px-4 py-3">
                                    {(
                                        Object.entries(platformChartData) as [
                                            PlatformKey,
                                            (typeof platformChartData)[PlatformKey]
                                        ][]
                                    ).map(([key, platform]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setSelectedPlatform(key)}
                                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${selectedPlatform === key
                                                ? "bg-white shadow-sm text-gray-900"
                                                : "text-gray-600 hover:bg-white/70"
                                                }`}
                                        >
                                            {platform.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Recent Posts ── */}
                    <div className="px-4 py-5 border-t border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-800 mb-4">
                            Recent Posts
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 mx-auto justify-items-center">
                            {postItems.length > 0 ? (
                                postItems.map((post: any, index: number) => {
                                    const postEngagement = calcPostEngagement(
                                        post,
                                        profileFollowers
                                    );
                                    const postViews = post?.views || post?.plays || post?.videoViews;

                                    return (
                                        <div
                                            key={post?.id || index}
                                            className="!h-[31.25rem] !w-[18.75rem] rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                                        >
                                            {/* Top Bar */}
                                            <div className="flex items-center justify-between px-3 py-2 bg-white">
                                                <div className="flex items-center gap-1.5">
                                                    <img
                                                        src={
                                                            profileImage !== "-"
                                                                ? profileImage
                                                                : "https://i.pravatar.cc/24?img=47"
                                                        }
                                                        className="w-5 h-5 rounded-full"
                                                        alt={profileName}
                                                    />
                                                    <div className="leading-tight">
                                                        <p className="text-[11px] font-medium text-gray-700">
                                                            {profileName}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400">
                                                            {dash(profileLocation)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                                    <svg
                                                        className="w-3 h-3"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        />
                                                    </svg>
                                                    {postEngagement === "-"
                                                        ? "-"
                                                        : `${postEngagement} engagement`}
                                                </div>
                                            </div>

                                            {/* Image */}
                                            <div className="relative">
                                                <img
                                                    src={
                                                        post?.thumbnail ||
                                                        post?.image ||
                                                        "https://i.pravatar.cc/300?img=47"
                                                    }
                                                    alt={post?.text || "post"}
                                                    className="w-full h-[190px] object-cover"
                                                />
                                                {post?.type === "video" && (
                                                    <div className="absolute bottom-2 left-2 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                                                        <svg
                                                            className="w-3 h-3 text-white"
                                                            fill="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path d="M8 5v14l11-7z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Stats */}
                                            <div className="px-3 py-2 bg-white">
                                                <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                                                    <span className="font-medium">
                                                        {compactNumber(post?.likes)}
                                                    </span>
                                                    <span className="flex items-center gap-0.5">
                                                        ❤️ {compactNumber(post?.likes)}
                                                    </span>
                                                    <span className="flex items-center gap-0.5">
                                                        💬 {compactNumber(post?.comments)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-2">
                                                    <span>- est. Impression</span>
                                                    <span>- est. Reach</span>
                                                    <span>
                                                        {postViews
                                                            ? `${compactNumber(postViews)} views`
                                                            : "-"}
                                                    </span>
                                                </div>

                                                <p className="text-xs font-semibold text-gray-700 mb-1">
                                                    {profileName}
                                                </p>

                                                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 min-h-[54px]">
                                                    {dash(post?.text)}
                                                </p>

                                                <p className="text-xs text-gray-400 mt-2">
                                                    {formatTimeAgo(post?.created)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full text-sm text-gray-400 px-2">
                                    No recent posts found.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center gap-1.5 mt-4">
                            {[0, 1, 2].map((d) => (
                                <span
                                    key={d}
                                    className={`w-2 h-2 rounded-full ${d === 1 ? "bg-gray-800" : "bg-gray-300"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── Milestone & Deliverables ── */}
                    <div className="px-4 py-5 border-t border-gray-100">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl leading-none font-semibold text-[#1f1f1f]">
                                    Milestone & Deliverables
                                </h2>
                                <p className="text-sm text-[#b3b3b3] mt-3">
                                    Handpicked influencers matched to your campaign objectives and target audience.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button className="h-9 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium text-[#1f1f1f] hover:bg-gray-50 transition">
                                    Add Milestone
                                </button>

                                <div className="relative">
                                    <select className="h-9 rounded-lg border border-gray-200 bg-white pl-3 pr-8 text-sm text-[#1f1f1f] focus:outline-none appearance-none">
                                        <option>Last 7 days</option>
                                        <option>Last 30 days</option>
                                    </select>

                                    <svg
                                        className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Header */}
                        <div className="mt-8 rounded-lg bg-[#e9e9e9] px-6 py-4">
                            <div className="grid grid-cols-[1.2fr_1.9fr_1fr_1fr_.8fr_1fr_1fr] items-center gap-6 text-sm font-semibold text-[#2b2b2b]">
                                <span>Deliverable</span>
                                <span>Content format</span>
                                <span>Platform</span>
                                <span>Status</span>
                                <span>Quantity</span>
                                <span>Deadline</span>
                                <span>Action</span>
                            </div>
                        </div>

                        {/* Rows */}
                        <div className="mt-5 space-y-5">
                            {milestoneRows.length > 0 ? (
                                milestoneRows.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="rounded-lg border border-[#e7e7e7] bg-white px-6 py-5"
                                    >
                                        <div className="grid grid-cols-[1.2fr_1.9fr_1fr_1fr_.8fr_1fr_1fr] items-center gap-6">
                                            {/* Deliverable */}
                                            <div>
                                                <p className="text-sm font-medium leading-[1.25] text-[#1f1f1f]">
                                                    {item.name}
                                                </p>
                                            </div>

                                            {/* Content format */}
                                            <div>
                                                <p className="text-xs leading-7 font-medium text-[#1f1f1f] line-clamp-2 max-w-[240px]">
                                                    {item.format}
                                                </p>
                                            </div>

                                            {/* Platform */}
                                            <div className="flex items-center">
                                                <PlatformBadgeIcon platform={item.platform} />
                                            </div>

                                            {/* Status */}
                                            <div>
                                                <span className="inline-flex items-center gap-2 rounded-full bg-[#f5f5f5] px-4 py-2 text-[18px] font-medium text-[#8a8a8a]">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c24c]" />
                                                    {item.status}
                                                </span>
                                            </div>

                                            {/* Quantity */}
                                            <div>
                                                <span className="text-sm font-medium text-[#1f1f1f]">
                                                    {item.qty}
                                                </span>
                                            </div>

                                            {/* Deadline */}
                                            <div>
                                                <span className="text-sm font-medium text-[#1f1f1f]">
                                                    {item.deadline}
                                                </span>
                                            </div>

                                            {/* Action */}
                                            <div className="flex items-center gap-4">
                                                <button className="inline-flex items-center gap-2 rounded-lg bg-[#151515] px-4 py-3 text-[15px] font-medium text-white hover:bg-black transition">
                                                    <span>Edit</span>
                                                    <PencilSimpleIcon size={16} />
                                                </button>

                                                <button className="text-[#1f1f1f] hover:text-black transition">
                                                    <svg
                                                        className="w-5 h-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 9l-7 7-7-7"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-lg border border-[#e7e7e7] bg-white px-6 py-5 text-sm text-gray-400">
                                    No deliverables found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contract Section */}
                    <div className="px-4 py-5 border-t border-gray-100">
                        <h2 className="text-[28px] font-semibold text-[#1f1f1f] mb-5">Contract</h2>

                        <div className="rounded-[18px] border border-[#e8e8e8] bg-white px-5 py-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-[#FFF3F1] flex items-center justify-center flex-shrink-0">
                                    <svg
                                        className="w-6 h-6 text-[#E64646]"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6zm1 7V3.5L18.5 9H15zm-5.2 3.4h1.45c.52 0 .91.12 1.18.36.27.24.4.58.4 1.03 0 .45-.14.79-.41 1.04-.27.25-.66.37-1.17.37h-.55V17H9.8v-4.6zm.9 1.98h.45c.35 0 .53-.16.53-.49 0-.31-.18-.47-.53-.47h-.45v.96zm3.03-1.98h1.33c.87 0 1.5.18 1.91.54.4.36.61.95.61 1.77 0 .82-.2 1.42-.61 1.8-.41.38-1.03.57-1.87.57h-1.37v-4.68zm.9.78v3.12h.39c.46 0 .79-.11.99-.33.2-.22.3-.59.3-1.11 0-.51-.1-.88-.3-1.08-.2-.21-.54-.31-1.02-.31h-.36zm3.72-.78h2.66v.79h-1.76v1.08h1.63v.78h-1.63V17h-.9v-4.58z" />
                                    </svg>
                                </div>

                                <div className="min-w-0">
                                    <p className="text-[24px] leading-none font-medium text-[#2a2a2a] truncate">
                                        {contractFileName}
                                    </p>
                                    <p className="text-[22px] leading-none text-[#a3a3a3] mt-2">
                                        {contractSize}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDownloadContract(printableContractId)
                                    }
                                    disabled={contractLoading}
                                    className="inline-flex items-center gap-2 text-[20px] font-normal text-[#1f1f1f] hover:opacity-80 disabled:opacity-50"
                                >
                                    <DownloadSimple size={18} />
                                    download
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleViewContract(printableContractId)}
                                    disabled={contractLoading}
                                    className="h-[44px] min-w-[78px] rounded-lg border border-[#dedede] bg-[#f7f7f7] px-5 text-[18px] font-medium text-[#2a2a2a] hover:bg-[#f0f0f0] disabled:opacity-50"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleViewContract(printableContractId)}
                                    disabled={contractLoading}
                                    className="h-[44px] min-w-[78px] rounded-lg bg-[#151515] px-5 text-[18px] font-medium text-white hover:bg-black disabled:opacity-50"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF Modal */}
            {showPdfModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
                    <div className="w-full max-w-6xl h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
                        <div className="h-16 border-b border-gray-200 px-5 flex items-center justify-between">
                            <div>
                                <p className="text-lg font-semibold text-gray-900">{contractFileName}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {viewingContractId || "-"}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDownloadContract()
                                    }
                                    className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Download
                                </button>

                                <button
                                    type="button"
                                    onClick={closePdfModal}
                                    className="h-10 w-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="h-[calc(90vh-64px)] bg-[#f5f5f5]">
                            {pdfUrl ? (
                                <iframe
                                    src={pdfUrl}
                                    title="Contract PDF"
                                    className="w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                                    Loading PDF...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

