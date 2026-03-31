"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Megaphone,
  Mail,
  Wallet,
  CalendarDays,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { Button } from "@/components/ui/buttonComp";
import { useRouter } from "next/navigation";
import {
  apiGetMyCampaigns,
  apiGetInfluencerPayoutSummary,
  apiGetAllInvitationsByInfluencer,
  type CampaignInvitationItem,
  type MyCampaignItem,
} from "@/app/influencer/services/influencerApi";

type PayoutSummary = {
  influencerId: string;
  totalPaid: number;
  totalUpcoming: number;
  totalInitiated: number;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(date?: string | null) {
  if (!date) return "No date";
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

function ProgressBar({
  value,
  color = "bg-amber-400",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 my-1.5">
      <div
        className={`${color} h-1.5 rounded-full transition-all duration-500`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function Avatar({
  initials,
  color = "bg-amber-500",
  size = "w-10 h-10 text-sm",
}: {
  initials: string;
  color?: string;
  size?: string;
}) {
  return (
    <div
      className={`${color} ${size} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "accepted") {
    return (
      <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full capitalize inline-flex items-center gap-1.5">
        <CheckCircle2 className="h-4 w-4" />
        accepted
      </span>
    );
  }

  if (normalized === "pending" || normalized === "sent") {
    return (
      <span className="bg-amber-100 text-amber-700 text-sm font-semibold px-3 py-1 rounded-full capitalize inline-flex items-center gap-1.5">
        <Clock className="h-4 w-4" />
        {normalized}
      </span>
    );
  }

  if (normalized === "reject" || normalized === "rejected") {
    return (
      <span className="bg-red-100 text-red-700 text-sm font-semibold px-3 py-1 rounded-full capitalize inline-flex items-center gap-1.5">
        rejected
      </span>
    );
  }

  if (normalized === "failed") {
    return (
      <span className="bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-1 rounded-full capitalize inline-flex items-center gap-1.5">
        failed
      </span>
    );
  }

  return (
    <span className="bg-gray-100 text-gray-700 text-sm font-semibold px-3 py-1 rounded-full capitalize inline-flex items-center gap-1.5">
      {normalized || "unknown"}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-6 flex-1 min-w-44 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-extrabold text-gray-900">{value}</p>
          {sub ? <p className="text-sm text-gray-400 mt-1.5">{sub}</p> : null}
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="mb-5">{title}</div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<MyCampaignItem[]>([]);
  const [invitations, setInvitations] = useState<CampaignInvitationItem[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [influencerName, setInfluencerName] = useState("Influencer");

  const influencerId =
    typeof window !== "undefined"
      ? localStorage.getItem("influencerId") ||
        JSON.parse(localStorage.getItem("user") || "{}")?.influencerId ||
        JSON.parse(localStorage.getItem("user") || "{}")?._id ||
        ""
      : "";

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const rawUser = localStorage.getItem("user");
      const parsedUser = rawUser ? JSON.parse(rawUser) : {};

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

      setInfluencerName(String(resolvedName).trim() || "Influencer");
    } catch (error) {
      console.error("Failed to read influencer name from localStorage:", error);
      setInfluencerName(
        localStorage.getItem("influencerName") ||
          localStorage.getItem("name") ||
          "Influencer"
      );
    }
  }, []);

  useEffect(() => {
    if (!influencerId) {
      setCampaigns([]);
      setInvitations([]);
      setWalletBalance(0);
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [campaignRes, payoutRes, invitationRes] = await Promise.all([
          apiGetMyCampaigns({
            influencerId,
            page: 1,
            limit: 10,
            search: "",
          }),
          apiGetInfluencerPayoutSummary(influencerId),
          apiGetAllInvitationsByInfluencer({ influencerId }),
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
      } catch (error) {
        console.error("Dashboard API error:", error);
        setCampaigns([]);
        setInvitations([]);
        setWalletBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [influencerId]);

  const activeCampaigns = useMemo(() => {
    return campaigns.filter((item) => {
      const status = String(item.status || "").toLowerCase();
      return status === "active" || Number(item.isActive) === 1;
    });
  }, [campaigns]);

  const invitationCount = useMemo(() => invitations.length, [invitations]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <div className="px-6 py-7">
        <div className="flex justify-between items-center mb-7 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Welcome Back, {influencerName}!
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Overview of your collaborations and performance.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={() => router.push("/influencer/inbox")}
              className="!bg-black !text-white hover:!bg-black/90 font-bold text-base px-6 py-3 rounded-xl cursor-pointer border-none inline-flex items-center gap-2"
            >
              <PaperPlaneTilt size={20} weight="fill" />
              Inbox
            </Button>

            <Button
              onClick={() => router.push("/influencer/discover-campaigns")}
              className="!bg-black !text-white hover:!bg-black/90 font-bold text-base px-6 py-3 rounded-xl cursor-pointer border-none"
            >
              Discover Campaigns
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-700 mb-4">Quick Stats</h2>
          <div className="flex gap-4 flex-wrap">
            <StatCard
              label="Active Campaigns"
              value={String(activeCampaigns.length)}
              icon={<Megaphone className="h-6 w-6" />}
            />
            <StatCard
              label="Invitations"
              value={String(invitationCount)}
              icon={<Mail className="h-6 w-6" />}
            />
            <StatCard
              label="Wallet Balance"
              value={formatCurrency(walletBalance)}
              sub="Showing total paid amount"
              icon={<Wallet className="h-6 w-6" />}
            />
          </div>
        </div>

        <SectionCard
          title={
            <div className="flex items-center justify-between gap-4 w-full">
              <span className="text-lg font-bold text-gray-800">
                Direct Invitations ({invitationCount})
              </span>
              <Button
                onClick={() => router.push("/influencer/invitations")}
                className="!bg-black !text-white hover:!bg-black/90 font-bold text-base px-5 py-2.5 rounded-xl cursor-pointer border-none"
              >
                View
              </Button>
            </div>
          }
        >
          {loading ? (
            <p className="text-base text-gray-400">Loading invitations...</p>
          ) : invitations.length === 0 ? (
            <p className="text-base text-gray-400">No invitations found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="py-3 pr-4 text-sm font-semibold text-gray-500">Brand</th>
                    <th className="py-3 pr-4 text-sm font-semibold text-gray-500">Campaign</th>
                    <th className="py-3 pr-4 text-sm font-semibold text-gray-500">Budget</th>
                    <th className="py-3 pr-4 text-sm font-semibold text-gray-500">Platform</th>
                    <th className="py-3 pr-4 text-sm font-semibold text-gray-500">End Date</th>
                    <th className="py-3 pr-4 text-sm font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((invitation, index) => {
                    const brandName = invitation.brandName || "Brand";
                    const campaignTitle =
                      invitation.campaignTitle ||
                      invitation.campaign?.campaignTitle ||
                      "Campaign";
                    const budget = Number(
                      invitation.campaignBudget ||
                        invitation.budget ||
                        invitation.campaign?.campaignBudget ||
                        0
                    );
                    const platform =
                      invitation.platform || invitation.campaign?.platform || "-";
                    const endDate =
                      invitation.endAt ||
                      invitation.campaign?.endAt ||
                      undefined;

                    return (
                      <tr
                        key={invitation._id || `${invitation.campaignId}-${index}`}
                        className="border-b border-gray-50 last:border-b-0"
                      >
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <Avatar initials={getInitials(brandName)} />
                            <div>
                              <p className="text-base font-semibold text-gray-800">
                                {brandName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <p className="text-base font-medium text-gray-800">
                            {campaignTitle}
                          </p>
                          <p className="text-sm text-gray-400 line-clamp-1">
                            {invitation.description || ""}
                          </p>
                        </td>
                        <td className="py-4 pr-4 text-base text-gray-700">
                          {formatCurrency(budget)}
                        </td>
                        <td className="py-4 pr-4 text-base text-gray-700 capitalize">
                          {String(platform)}
                        </td>
                        <td className="py-4 pr-4 text-base text-gray-700">
                          {formatDate(endDate)}
                        </td>
                        <td className="py-4 pr-4">
                          <StatusBadge status={invitation.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={
            <div className="flex items-center justify-between gap-4 w-full">
              <span className="text-lg font-bold text-gray-800">
                Active Campaigns ({activeCampaigns.length})
              </span>
              <Button
                onClick={() => router.push("/influencer/my-campaigns")}
                className="!bg-black !text-white hover:!bg-black/90 font-bold text-base px-5 py-2.5 rounded-xl cursor-pointer border-none"
              >
                View
              </Button>
            </div>
          }
        >
          {loading ? (
            <p className="text-base text-gray-400">Loading campaigns...</p>
          ) : activeCampaigns.length === 0 ? (
            <p className="text-base text-gray-400">No active campaigns found.</p>
          ) : (
            <div className="flex gap-4 flex-wrap">
              {activeCampaigns.map((campaign, index) => {
                const title = campaign.campaignTitle || "Campaign";
                const dueDate = campaign.endAt || "";
                const amount = campaign.feeAmount || campaign.campaignBudget || 0;

                return (
                  <div
                    key={campaign._id || index}
                    className="bg-white rounded-xl p-5 flex-1 min-w-64 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <div>
                        <p className="text-base font-bold text-gray-800">{title}</p>
                        <p className="text-sm text-gray-400">
                          Budget: {formatCurrency(Number(amount || 0))}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Status</span>
                      <span className="font-bold text-green-600 capitalize">
                        {campaign.status || "active"}
                      </span>
                    </div>

                    <ProgressBar value={100} />

                    <p className="text-sm text-gray-400 mt-2 inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      Ends by {formatDate(dueDate)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}