"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Megaphone,
  Mail,
  Wallet,
  CalendarDays,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import {
  apiGetMyCampaigns,
  apiGetInfluencerPayoutSummary,
  apiGetAllInvitationsByInfluencer,
  apiGetLiteInfluencerById,
  type CampaignInvitationItem,
  type MyCampaignItem,
} from "@/app/influencer/services/influencerApi";

// ─── Types ────────────────────────────────────────────────────────────────────
type PayoutSummary = {
  influencerId: string;
  totalPaid: number;
  totalUpcoming: number;
  totalInitiated: number;
};

type CampaignCardItem = MyCampaignItem & {
  isContracted?: number;
  isAccepted?: number;
  hasMilestone?: number;
  feeAmount?: number;
  contractId?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(text?: string) {
  if (!text) return "NA";
  return text
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function readStoredUser() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function getStoredInfluencerName() {
  if (typeof window === "undefined") return "Influencer";

  const parsedUser: any = readStoredUser();

  const resolvedName =
    parsedUser?.name ||
    parsedUser?.fullName ||
    parsedUser?.creatorName ||
    parsedUser?.influencerName ||
    parsedUser?.user?.name ||
    parsedUser?.user?.fullName ||
    parsedUser?.user?.creatorName ||
    parsedUser?.user?.influencerName ||
    parsedUser?.influencer?.name ||
    parsedUser?.influencer?.fullName ||
    parsedUser?.data?.name ||
    parsedUser?.data?.fullName ||
    localStorage.getItem("influencerName") ||
    localStorage.getItem("name") ||
    "Influencer";

  return String(resolvedName).trim() || "Influencer";
}

function getStoredToken() {
  if (typeof window === "undefined") return undefined;

  const parsedUser: any = readStoredUser();

  return (
    localStorage.getItem("token") ||
    parsedUser?.token ||
    parsedUser?.accessToken ||
    parsedUser?.authToken ||
    parsedUser?.jwt ||
    undefined
  );
}

function getStoredInfluencerId() {
  if (typeof window === "undefined") return "";

  const parsedUser: any = readStoredUser();

  return (
    localStorage.getItem("influencerId") ||
    parsedUser?.influencerId ||
    parsedUser?._id ||
    ""
  );
}

function extractInfluencerName(payload: any) {
  const candidates = [
    payload?.name,
    payload?.fullName,
    payload?.influencerName,
    payload?.creatorName,

    payload?.data?.name,
    payload?.data?.fullName,
    payload?.data?.influencerName,
    payload?.data?.creatorName,

    payload?.influencer?.name,
    payload?.influencer?.fullName,
    payload?.data?.influencer?.name,
    payload?.data?.influencer?.fullName,

    payload?.user?.name,
    payload?.user?.fullName,
    payload?.data?.user?.name,
    payload?.data?.user?.fullName,
  ];

  const resolved = candidates.find(
    (value) => typeof value === "string" && value.trim()
  );

  return resolved?.trim() || "";
}

// ─── Avatar palette ───────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-blue-500",
  "from-rose-400 to-pink-500",
  "from-fuchsia-400 to-violet-500",
];

function avatarColor(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Avatar({
  initials,
  gradient,
  size = "w-10 h-10 text-sm",
}: {
  initials: string;
  gradient: string;
  size?: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${gradient} ${size} rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = String(status || "").toLowerCase();

  const configs: Record<
    string,
    { bg: string; text: string; dot: string; label: string }
  > = {
    accepted: {
      bg: "bg-emerald-50 border border-emerald-200",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      label: "Accepted",
    },
    sent: {
      bg: "bg-amber-50 border border-amber-200",
      text: "text-amber-700",
      dot: "bg-amber-500",
      label: "Sent",
    },
    pending: {
      bg: "bg-amber-50 border border-amber-200",
      text: "text-amber-700",
      dot: "bg-amber-500",
      label: "Pending",
    },
    reject: {
      bg: "bg-red-50 border border-red-200",
      text: "text-red-700",
      dot: "bg-red-500",
      label: "Rejected",
    },
    rejected: {
      bg: "bg-red-50 border border-red-200",
      text: "text-red-700",
      dot: "bg-red-500",
      label: "Rejected",
    },
    failed: {
      bg: "bg-slate-100 border border-slate-200",
      text: "text-slate-600",
      dot: "bg-slate-400",
      label: "Failed",
    },
  };

  const cfg = configs[normalized] ?? {
    bg: "bg-gray-100 border border-gray-200",
    text: "text-gray-600",
    dot: "bg-gray-400",
    label: normalized || "Unknown",
  };

  return (
    <span
      className={`${cfg.bg} ${cfg.text} text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  trend?: string;
}) {
  return (
    <div className="group relative w-full min-w-0 bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full opacity-5 -translate-y-8 translate-x-8 ${accent}`}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${accent} flex items-center justify-center text-white shadow-sm`}
          >
            {icon}
          </div>
          {trend && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-400 mb-1">{label}</p>
        <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight break-words">
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  count,
  onView,
}: {
  title: string;
  count: number;
  onView: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
          {count}
        </span>
      </div>
      <button
        onClick={onView}
        className="w-full sm:w-auto flex items-center justify-center cursor-pointer gap-1.5 text-sm font-semibold text-gray-700 hover:text-black bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-2 rounded-xl transition-all duration-200"
      >
        View All
        <ArrowUpRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    youtube: { bg: "bg-red-50 border border-red-100", text: "text-red-600" },
    instagram: {
      bg: "bg-pink-50 border border-pink-100",
      text: "text-pink-600",
    },
    twitter: { bg: "bg-sky-50 border border-sky-100", text: "text-sky-600" },
    tiktok: {
      bg: "bg-slate-50 border border-slate-200",
      text: "text-slate-700",
    },
  };
  const norm = String(platform).toLowerCase();
  const style = map[norm] ?? {
    bg: "bg-gray-50 border border-gray-200",
    text: "text-gray-600",
  };

  return (
    <span
      className={`${style.bg} ${style.text} text-xs font-semibold px-2.5 py-1 rounded-lg capitalize`}
    >
      {norm}
    </span>
  );
}

function CampaignFlagBadge({
  label,
  tone,
}: {
  label: string;
  tone: "violet" | "emerald" | "amber";
}) {
  const styles = {
    violet: "bg-violet-50 border border-violet-200 text-violet-700",
    emerald: "bg-emerald-50 border border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border border-amber-200 text-amber-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<MyCampaignItem[]>([]);
  const [invitations, setInvitations] = useState<CampaignInvitationItem[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [influencerName, setInfluencerName] = useState("Influencer");

  const influencerId = getStoredInfluencerId();

  useEffect(() => {
    setInfluencerName(getStoredInfluencerName());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const keepOnDashboard = () => {
      window.history.pushState(
        { dashboardLock: true, path: "/influencer/dashboards" },
        "",
        "/influencer/dashboards"
      );
    };

    keepOnDashboard();

    const handlePopState = () => {
      keepOnDashboard();
      router.replace("/influencer/dashboards");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  useEffect(() => {
    if (!influencerId) {
      router.replace("/influencer/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const token = getStoredToken();

        const [campaignRes, payoutRes, invitationRes, liteInfluencerRes] =
          await Promise.all([
            apiGetMyCampaigns({ influencerId, page: 1, limit: 10, search: "" }),
            apiGetInfluencerPayoutSummary(influencerId),
            apiGetAllInvitationsByInfluencer({ influencerId }),
            apiGetLiteInfluencerById(influencerId, token).catch(() => null),
          ]);

        setCampaigns(
          Array.isArray(campaignRes?.campaigns) ? campaignRes.campaigns : []
        );

        const payoutData: PayoutSummary = payoutRes;
        setWalletBalance(Number(payoutData?.totalPaid || 0));

        const invitationItems = Array.isArray(invitationRes?.invitations)
          ? invitationRes.invitations
          : Array.isArray(invitationRes?.items)
          ? invitationRes.items
          : Array.isArray(invitationRes?.data)
          ? invitationRes.data
          : [];

        setInvitations(invitationItems);

        const apiName = extractInfluencerName(liteInfluencerRes);
        setInfluencerName(apiName || getStoredInfluencerName());
      } catch (error) {
        console.error("Dashboard API error:", error);
        setCampaigns([]);
        setInvitations([]);
        setWalletBalance(0);
        setInfluencerName(getStoredInfluencerName());
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [influencerId, router]);

  const activeCampaigns = useMemo(
    () =>
      campaigns.filter((item) => {
        const status = String(item.status || "").toLowerCase();
        return status === "active" || Number(item.isActive) === 1;
      }),
    [campaigns]
  );

  const invitationCount = useMemo(() => invitations.length, [invitations]);

  const handleInvitationClick = (invitation: CampaignInvitationItem) => {
    const invitationAny = invitation as any;

    const campaignId =
      invitationAny?.campaignId ||
      invitationAny?.campaign?._id ||
      invitationAny?.campaign?.campaignId ||
      "";

    const invitationId = invitationAny?._id || "";

    if (!campaignId || !invitationId) return;

    router.push(
      `/influencer/invitations/${encodeURIComponent(
        String(campaignId)
      )}?invitationId=${encodeURIComponent(String(invitationId))}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] p-4 sm:p-6 md:p-8 font-sans">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-10 w-48 sm:w-64 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
            ))}
          </div>
          <div className="h-72 bg-gray-200 rounded-2xl" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans text-gray-900">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 md:px-10 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-bold text-gray-800 hidden sm:block">
              Dashboard
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push("/influencer/inbox")}
              className="relative flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border cursor-pointer border-gray-200 text-gray-700 hover:text-black font-semibold text-sm px-3 sm:px-4 py-2.5 rounded-xl transition-all duration-200"
            >
              <PaperPlaneTilt size={16} weight="fill" />
              <span className="hidden sm:inline">Inbox</span>
            </button>

            <button
              onClick={() => router.push("/influencer/discover-campaigns")}
              className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-semibold cursor-pointer text-sm px-4 sm:px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">Discover</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-8 space-y-8">
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-5 sm:p-7 md:p-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 sm:w-72 sm:h-72 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-10 sm:left-16 w-32 h-32 sm:w-40 sm:h-40 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex flex-col gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight break-words">
                Welcome back,
                <br />
                <span className="text-amber-400">{influencerName}!</span>
              </h1>
              <p className="text-gray-400 text-sm mt-3 max-w-sm leading-relaxed">
                Here's a snapshot of your collaborations, earnings, and open
                opportunities.
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
            Overview
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <StatCard
              label="Active Campaigns"
              value={String(activeCampaigns.length)}
              sub={
                activeCampaigns.length === 1
                  ? "1 campaign running"
                  : `${activeCampaigns.length} campaigns running`
              }
              icon={<Megaphone className="w-5 h-5" />}
              accent="bg-gradient-to-br from-violet-500 to-purple-600"
            />
            <StatCard
              label="Direct Invitations"
              value={String(invitationCount)}
              sub="Open collaboration offers"
              icon={<Mail className="w-5 h-5" />}
              accent="bg-gradient-to-br from-amber-400 to-orange-500"
            />
            <StatCard
              label="Total Earned"
              value={formatCurrency(walletBalance)}
              sub="Cumulative payouts received"
              icon={<Wallet className="w-5 h-5" />}
              accent="bg-gradient-to-br from-emerald-400 to-teal-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-5 border-b border-gray-50">
            <SectionHeader
              title="Direct Invitations"
              count={invitationCount}
              onView={() => router.push("/influencer/invitations")}
            />
          </div>

          {invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No invitations yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Brands will invite you when they find your profile.
              </p>
            </div>
          ) : (
            <>
              <div className="block md:hidden p-4 space-y-3">
                {invitations.map((invitation, index) => {
                  const brandName = invitation.brandName || "Brand";
                  const campaignTitle =
                    invitation.campaignTitle ||
                    (invitation as any).campaign?.campaignTitle ||
                    "Campaign";
                  const platform =
                    invitation.platform ||
                    (invitation as any).campaign?.platform ||
                    "-";
                  const endDate =
                    invitation.endAt ||
                    (invitation as any).campaign?.endAt ||
                    undefined;

                  return (
                    <div
                      key={invitation._id || `${invitation.campaignId}-${index}`}
                      onClick={() => handleInvitationClick(invitation)}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-4 cursor-pointer hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            initials={getInitials(brandName)}
                            gradient={avatarColor(brandName)}
                            size="w-10 h-10 text-xs"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {brandName}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {campaignTitle}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={invitation.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <PlatformBadge platform={String(platform)} />
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                            Ends
                          </p>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <CalendarDays className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                            <span>{formatDate(endDate)}</span>
                          </div>
                        </div>

                        {invitation.description ? (
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                              Description
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {invitation.description}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[780px]">
                  <thead className="bg-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                        Brand
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                        Campaign
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                        Platform
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                        Ends
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invitations.map((invitation, index) => {
                      const brandName = invitation.brandName || "Brand";
                      const campaignTitle =
                        invitation.campaignTitle ||
                        (invitation as any).campaign?.campaignTitle ||
                        "Campaign";
                      const platform =
                        invitation.platform ||
                        (invitation as any).campaign?.platform ||
                        "-";
                      const endDate =
                        invitation.endAt ||
                        (invitation as any).campaign?.endAt ||
                        undefined;

                      return (
                        <tr
                          key={invitation._id || `${invitation.campaignId}-${index}`}
                          onClick={() => handleInvitationClick(invitation)}
                          className="hover:bg-gray-50/70 transition-colors duration-150 group cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar
                                initials={getInitials(brandName)}
                                gradient={avatarColor(brandName)}
                                size="w-9 h-9 text-xs"
                              />
                              <span className="text-sm font-semibold text-gray-800">
                                {brandName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 max-w-[200px]">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {campaignTitle}
                            </p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {invitation.description || ""}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <PlatformBadge platform={String(platform)} />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                              <CalendarDays className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                              {formatDate(endDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={invitation.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-5 border-b border-gray-50">
            <SectionHeader
              title="Active Campaigns"
              count={activeCampaigns.length}
              onView={() => router.push("/influencer/my-campaigns")}
            />
          </div>

          {activeCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                <Megaphone className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No active campaigns</p>
              <p className="text-gray-400 text-sm mt-1">
                Discover and apply to campaigns to get started.
              </p>
              <button
                onClick={() => router.push("/influencer/discover-campaigns")}
                className="mt-5 flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200"
              >
                Discover Campaigns
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeCampaigns.map((campaignBase, index) => {
                const campaign = campaignBase as CampaignCardItem;

                const title = campaign.campaignTitle || "Campaign";
                const brandName = campaign.brandName || "";
                const dueDate = campaign.endAt || "";
                const amount =
                  campaign.feeAmount || campaign.campaignBudget || 0;
                const platforms: string[] = Array.isArray(
                  campaign.platformSelection
                )
                  ? campaign.platformSelection
                  : [];
                const gradient = avatarColor(title);

                const statusFlags = [
                  campaign.isContracted === 1
                    ? { label: "Contracted", tone: "violet" as const }
                    : null,
                  campaign.isAccepted === 1
                    ? { label: "Accepted", tone: "emerald" as const }
                    : null,
                ].filter(Boolean) as Array<{
                  label: string;
                  tone: "violet" | "emerald" | "amber";
                }>;

                const end = dueDate ? new Date(dueDate) : null;
                const now = new Date();
                const daysLeft =
                  end && !isNaN(end.getTime())
                    ? Math.max(
                        0,
                        Math.ceil((end.getTime() - now.getTime()) / 86400000)
                      )
                    : null;

                return (
                  <div
                    key={campaign._id || index}
                    className="group relative bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md rounded-2xl p-4 sm:p-5 transition-all duration-300 overflow-hidden cursor-pointer"
                    onClick={() => router.push("/influencer/my-campaigns")}
                  >
                    <div
                      className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-[0.06] rounded-bl-full pointer-events-none`}
                    />

                    <div className="relative">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <Avatar
                          initials={getInitials(title)}
                          gradient={gradient}
                          size="w-10 h-10 text-sm"
                        />
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 break-words">
                        {title}
                      </h4>

                      <div className="space-y-3 mb-4">
                        {brandName && (
                          <p className="text-xs text-gray-400 break-words">
                            {brandName}
                          </p>
                        )}

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                            Influencer
                          </p>
                          <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                            {influencerName}
                          </p>
                        </div>

                        {statusFlags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {statusFlags.map((flag) => (
                              <CampaignFlagBadge
                                key={flag.label}
                                label={flag.label}
                                tone={flag.tone}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {platforms.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mb-4">
                          {platforms.map((p) => (
                            <PlatformBadge key={p} platform={p} />
                          ))}
                        </div>
                      )}

                      <div className="border-t border-gray-100 mb-4" />

                      <div className="flex items-start justify-between gap-4 text-xs">
                        <div className="min-w-0">
                          <p className="text-gray-400 mb-0.5">Budget</p>
                          <p className="font-bold text-gray-800 text-sm break-words">
                            {formatCurrency(Number(amount || 0))}
                          </p>
                        </div>
                        <div className="text-right min-w-0">
                          <p className="text-gray-400 mb-0.5">Ends</p>
                          <p className="font-semibold text-gray-700 break-words">
                            {daysLeft !== null ? (
                              <span
                                className={
                                  daysLeft <= 7
                                    ? "text-red-500"
                                    : "text-gray-700"
                                }
                              >
                                {daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                              </span>
                            ) : (
                              formatDate(dueDate)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}