"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { get, post } from "@/lib/api";
import {
  ChevronLeft,
  Mail,
  MapPin,
  Calendar,
  Users,
  Globe,
  CheckCircle,
  ExternalLink,
  BarChart2,
  Hash,
  Tag,
  Info,
  ArrowUpRight,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface NamedItem {
  _id?: string | null;
  name?: string | null;
}

interface PostSponsor {
  name?: string;
  logo_url?: string;
  domain?: string;
}

interface PostItem {
  id?: string;
  text?: string;
  url?: string;
  created?: string;
  type?: string;
  likes?: number;
  comments?: number;
  views?: number;
  plays?: number;
  image?: string;
  thumbnail?: string;
  mentions?: string[];
  hashtags?: string[];
  sponsors?: PostSponsor[];
}

interface StatWithCompared {
  value?: number;
  compared?: number;
}

interface StatsBlock {
  avgLikes?: StatWithCompared;
  avgShares?: StatWithCompared;
  avgComments?: StatWithCompared;
  followers?: StatWithCompared;
  paidPostPerformance?: number;
}

interface HistoryPoint {
  month?: string;
  avg_likes?: number;
  avg_engagements?: number;
}

interface StatsByContentTypeEntry {
  engagements?: number;
  engagementRate?: number;
  avgLikes?: number;
  avgComments?: number;
  avgShares?: number;
  avgReelsPlays?: number;
  statHistory?: HistoryPoint[];
}

interface AudienceWeightItem {
  code?: string;
  name?: string;
  weight?: number;
}

interface AudienceGenderPerAge {
  code?: string;
  male?: number;
  female?: number;
}

interface AudienceGeoCity {
  name?: string;
  weight?: number;
  country?: string;
  state?: string;
}

interface AudienceUser {
  userId?: string;
  username?: string;
  fullname?: string;
  url?: string;
  picture?: string;
  followers?: number;
  engagements?: number;
}

interface AudienceData {
  languages?: AudienceWeightItem[];
  ethnicities?: AudienceWeightItem[];
  genders?: AudienceWeightItem[];
  geoCountries?: AudienceWeightItem[];
  geoStates?: AudienceWeightItem[];
  ages?: AudienceWeightItem[];
  interests?: AudienceWeightItem[];
  brandAffinity?: AudienceWeightItem[];
  gendersPerAge?: AudienceGenderPerAge[];
  geoCities?: AudienceGeoCity[];
  notableUsers?: AudienceUser[];
  credibility?: number;
  notable?: number;
}

interface ModashCategory {
  categoryId?: string | number | null;
  categoryName?: string | null;
  subcategoryId?: string | number | null;
  subcategoryName?: string | null;
}

interface TagWeight {
  tag?: string;
  weight?: number;
}

interface BrandAffinityItem {
  id?: number | string;
  name?: string;
}

interface Page1ProfileData {
  profile?: {
    userId?: string;
    username?: string;
    fullname?: string;
    handle?: string;
    url?: string;
    picture?: string;
    followers?: number;
    engagements?: number;
    engagementRate?: number;
  };
  isPrivate?: boolean;
  isVerified?: boolean;
  accountType?: string;
  secUid?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  ageGroup?: string | null;
  gender?: string | null;
  language?: string | { code?: string; name?: string } | null;
  statsByContentType?: {
    all?: StatsByContentTypeEntry;
    reels?: StatsByContentTypeEntry;
    posts?: StatsByContentTypeEntry;
    videos?: StatsByContentTypeEntry;
    [key: string]: StatsByContentTypeEntry | undefined;
  };
  stats?: StatsBlock;
  recentPosts?: PostItem[];
  popularPosts?: PostItem[];
  sponsoredPosts?: PostItem[];
  postsCount?: number;
  avgLikes?: number;
  avgComments?: number;
  avgReelsPlays?: number;
  bio?: string;
  categories?: ModashCategory[];
  hashtags?: TagWeight[];
  mentions?: TagWeight[];
  brandAffinity?: BrandAffinityItem[];
  audience?: AudienceData;
}

interface Page1Item {
  platform?: string;
  handle?: string;
  username?: string;
  data?: Page1ProfileData;
}

interface InfluencerResponse {
  influencer?: InfluencerDoc;
}

interface InfluencerDoc {
  _id?: string;
  influencerId?: string;
  email?: string;
  name?: string;
  countryId?: string;
  countryName?: string;
  languages?: NamedItem[];
  categories?: NamedItem[];
  page1?: Page1Item[];
  createdAt?: string;
  updatedAt?: string;
}

interface PaypalDetails {
  email?: string;
  username?: string;
}

interface BankDetails {
  accountHolder?: string;
  accountNumber?: string;
  ifsc?: string;
  swift?: string;
  bankName?: string;
  branch?: string;
  countryId?: string;
  countryName?: string;
}

interface PaypalDetails {
  email?: string;
  username?: string;
}

interface BankDetails {
  accountHolder?: string;
  accountNumber?: string;
  ifsc?: string;
  swift?: string;
  bankName?: string;
  branch?: string;
  countryId?: string;
  countryName?: string;
}

interface PaymentDetailItem {
  _id?: string;
  influencerId?: string;
  label?: string;
  type?: number; // 0 = paypal, 1 = bank
  isDefault?: boolean;
  paypal?: PaypalDetails;
  bank?: BankDetails;
  createdAt?: string;
  updatedAt?: string;
}

interface PaymentDetailsResponse {
  success?: boolean;
  count?: number;
  data?: PaymentDetailItem[];
}

/* -------------------------------------------------------------------------- */
/*                                UI Utilities                                */
/* -------------------------------------------------------------------------- */

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : "—";

const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString() : "—";

const fmtNum = (n?: number | null) => {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

const fmtPercent = (n?: number | null) => {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(2)}%`;
};

const Copyable: React.FC<{ value?: string | null; className?: string }> = ({
  value,
  className,
}) => {
  if (!value) return <span>—</span>;

  return (
    <button
      type="button"
      className={`text-blue-600 hover:underline hover:text-blue-800 ${className ?? ""}`}
      onClick={() => navigator.clipboard.writeText(value)}
      title="Copy"
    >
      {value}
    </button>
  );
};

const Pill: React.FC<{
  children: React.ReactNode;
  tone?: "default" | "success" | "danger" | "warning" | "muted";
}> = ({ children, tone = "default" }) => (
  <span
    className={
      "px-2 py-1 rounded-full text-xs font-medium " +
      (tone === "success"
        ? "bg-green-100 text-green-700"
        : tone === "danger"
          ? "bg-red-100 text-red-700"
          : tone === "warning"
            ? "bg-yellow-100 text-yellow-800"
            : tone === "muted"
              ? "bg-slate-100 text-slate-700"
              : "bg-blue-100 text-blue-700")
    }
  >
    {children}
  </span>
);

const Section: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}> = ({ title, subtitle, right, className, children }) => (
  <Card
    className={`p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl ${className ?? ""}`}
  >
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          {title}
        </h3>
        {subtitle && <p className="text-slate-600 text-sm mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </Card>
);

const fmtWeightPercent = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";

  const percent = value <= 1 ? value * 100 : value;

  return `${percent.toFixed(2)}%`;
};

const KVRow: React.FC<{ label: string; value?: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="grid grid-cols-3 gap-2 py-2">
    <div className="text-slate-500 text-sm col-span-1">{label}</div>
    <div className="col-span-2 font-medium text-slate-900 break-words">
      {value ?? "—"}
    </div>
  </div>
);

function getInitials(name?: string | null) {
  return (
    (name || "Influencer")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "IN"
  );
}

function normalizePlatform(platform?: string | null) {
  return String(platform || "").trim().toLowerCase();
}

function getLanguageLabel(
  value?: string | { code?: string; name?: string } | null,
) {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return value.name || value.code || "—";
}

function getStatValue(
  direct?: number,
  fromStats?: StatWithCompared,
  fromFallback?: number,
) {
  return direct ?? fromStats?.value ?? fromFallback ?? undefined;
}

function getPostViews(post: PostItem) {
  return post.views ?? post.plays;
}

/* -------------------------------------------------------------------------- */
/*                              Normalized Profile                            */
/* -------------------------------------------------------------------------- */

interface NormalizedSocialProfile {
  provider: string;
  username?: string;
  fullname?: string;
  handle?: string;
  url?: string;
  picture?: string;
  followers?: number;
  engagements?: number;
  engagementRate?: number;
  isPrivate?: boolean;
  isVerified?: boolean;
  accountType?: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  ageGroup?: string | null;
  gender?: string | null;
  language?: string;
  stats?: StatsBlock;
  statsByContentType?: Page1ProfileData["statsByContentType"];
  recentPosts?: PostItem[];
  popularPosts?: PostItem[];
  sponsoredPosts?: PostItem[];
  postsCount?: number;
  avgLikes?: number;
  avgComments?: number;
  avgReelsPlays?: number;
  bio?: string;
  categories?: ModashCategory[];
  hashtags?: TagWeight[];
  mentions?: TagWeight[];
  brandAffinity?: BrandAffinityItem[];
  audience?: AudienceData;
}

function normalizeProfiles(page1?: Page1Item[]): NormalizedSocialProfile[] {
  return (page1 || []).map((item) => {
    const data = item.data || {};
    const profile = data.profile || {};
    const allStats = data.statsByContentType?.all;
    const reelsStats = data.statsByContentType?.reels;

    return {
      provider: item.platform || "unknown",
      username: profile.username || item.username,
      fullname: profile.fullname,
      handle: profile.handle || item.handle,
      url: profile.url,
      picture: profile.picture,
      followers: getStatValue(undefined, data.stats?.followers, profile.followers),
      engagements: profile.engagements || allStats?.engagements,
      engagementRate:
        profile.engagementRate ??
        allStats?.engagementRate ??
        reelsStats?.engagementRate,
      isPrivate: data.isPrivate,
      isVerified: data.isVerified,
      accountType: data.accountType,
      city: data.city,
      state: data.state,
      country: data.country,
      ageGroup: data.ageGroup,
      gender: data.gender,
      language: getLanguageLabel(data.language),
      stats: data.stats,
      statsByContentType: data.statsByContentType,
      recentPosts: data.recentPosts || [],
      popularPosts: data.popularPosts || [],
      sponsoredPosts: data.sponsoredPosts || [],
      postsCount: data.postsCount,
      avgLikes: getStatValue(data.avgLikes, data.stats?.avgLikes, allStats?.avgLikes),
      avgComments: getStatValue(
        data.avgComments,
        data.stats?.avgComments,
        allStats?.avgComments,
      ),
      avgReelsPlays: data.avgReelsPlays ?? reelsStats?.avgReelsPlays,
      bio: data.bio,
      categories: data.categories || [],
      hashtags: data.hashtags || [],
      mentions: data.mentions || [],
      brandAffinity: data.brandAffinity || [],
      audience: data.audience,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*                                Main Component                              */
/* -------------------------------------------------------------------------- */

export default function AdminInfluencerView() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("influencerId");

  const [data, setData] = useState<InfluencerDoc | null>(null);
  const [profiles, setProfiles] = useState<NormalizedSocialProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailItem[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    const fetcher = async () => {
      if (!id) return;

      setLoading(true);
      setPaymentLoading(true);

      try {
        const resp: InfluencerResponse | InfluencerDoc = await get(
          "/admin/influencer/getById",
          { id },
        );

        const influencerDoc =
          (resp as InfluencerResponse)?.influencer ?? (resp as InfluencerDoc);

        setData(influencerDoc);
        setProfiles(normalizeProfiles(influencerDoc.page1));
        setError(null);

        const paymentResp: PaymentDetailsResponse = await post(
          "/payment-details/get-payment-details",
          {
            influencerId: influencerDoc.influencerId || influencerDoc._id,
          },
        );

        setPaymentDetails(paymentResp?.data || []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load influencer");
      } finally {
        setLoading(false);
        setPaymentLoading(false);
      }
    };

    fetcher();
  }, [id]);

  const primaryProfile = useMemo(() => profiles[0], [profiles]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-60" />
          <Card className="p-6 space-y-6 shadow-xl">
            <div className="flex items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-4 w-80" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 hover:bg-white/80"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Card className="p-6 border-red-200 bg-red-50 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-red-600 font-medium">Error: {error}</span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="hover:bg-white/80 shadow-sm"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Influencers
          </Button>
        </div>

        <Card className="p-6 md:p-8 bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="flex-shrink-0">
              {primaryProfile?.picture ? (
                <img
                  src={primaryProfile.picture}
                  alt={data.name ?? data.email ?? "Influencer"}
                  className="h-28 w-28 md:h-32 md:w-32 rounded-full object-cover border-4 border-white shadow-lg ring-4 ring-blue-100"
                />
              ) : (
                <div className="h-28 w-28 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl md:text-5xl font-bold shadow-lg ring-4 ring-blue-100">
                  {getInitials(data.name || data.email)}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 truncate">
                  {data.name || "Unnamed Influencer"}
                </h1>

                {primaryProfile?.isVerified && (
                  <Pill tone="success">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </span>
                  </Pill>
                )}

                {primaryProfile?.provider && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                    {primaryProfile.provider.toUpperCase()}
                  </Badge>
                )}

                {primaryProfile?.accountType && (
                  <Pill tone="muted">{primaryProfile.accountType}</Pill>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <Copyable value={data.email} />
                </div>

                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span>{data.countryName || "—"}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span>{fmtDate(data.createdAt)}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span>
                    {data.languages?.length
                      ? data.languages.map((l) => l.name).filter(Boolean).join(", ")
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg">
                  <Tag className="h-4 w-4 text-indigo-600" />
                  <span>
                    {data.categories?.length
                      ? data.categories.map((c) => c.name).filter(Boolean).join(", ")
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>{profiles.length} connected profile{profiles.length === 1 ? "" : "s"}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                <span>
                  Influencer ID:{" "}
                  <Copyable value={data.influencerId || data._id} />
                </span>
                <span>Created: {fmtDateTime(data.createdAt)}</span>
                <span>Updated: {fmtDateTime(data.updatedAt)}</span>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="profiles" className="space-y-6">
          <TabsList className="bg-white shadow-lg p-1 border-0">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="profiles"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Profiles
            </TabsTrigger>
            <TabsTrigger
              value="posts"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Posts
            </TabsTrigger>
            <TabsTrigger
              value="audience"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Audience
            </TabsTrigger>
            <TabsTrigger
              value="payment"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Payment Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <Card className="p-4 bg-blue-50/70 border-0 shadow-lg">
                <div className="text-xs text-slate-600">Followers</div>
                <div className="text-2xl font-bold text-blue-700">
                  {fmtNum(primaryProfile?.followers)}
                </div>
              </Card>

              <Card className="p-4 bg-green-50/70 border-0 shadow-lg">
                <div className="text-xs text-slate-600">Engagement Rate</div>
                <div className="text-2xl font-bold text-green-700">
                  {fmtPercent(primaryProfile?.engagementRate)}
                </div>
              </Card>

              <Card className="p-4 bg-purple-50/70 border-0 shadow-lg">
                <div className="text-xs text-slate-600">Avg Likes</div>
                <div className="text-2xl font-bold text-purple-700">
                  {fmtNum(primaryProfile?.avgLikes)}
                </div>
              </Card>

              <Card className="p-4 bg-pink-50/70 border-0 shadow-lg">
                <div className="text-xs text-slate-600">Avg Comments</div>
                <div className="text-2xl font-bold text-pink-700">
                  {fmtNum(primaryProfile?.avgComments)}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Section
                title={
                  <>
                    <Info className="h-5 w-5" />
                    Influencer Details
                  </>
                }
              >
                <KVRow label="Name" value={data.name} />
                <KVRow label="Email" value={<Copyable value={data.email} />} />
                <KVRow label="Country" value={data.countryName} />
                <KVRow
                  label="Languages"
                  value={
                    data.languages?.length
                      ? data.languages.map((l) => l.name).filter(Boolean).join(", ")
                      : "—"
                  }
                />
                <KVRow
                  label="Categories"
                  value={
                    data.categories?.length
                      ? data.categories.map((c) => c.name).filter(Boolean).join(", ")
                      : "—"
                  }
                />
              </Section>

              <Section
                title={
                  <>
                    <BarChart2 className="h-5 w-5" />
                    Primary Profile Summary
                  </>
                }
                subtitle={primaryProfile?.bio || "No bio available"}
              >
                <KVRow label="Platform" value={primaryProfile?.provider} />
                <KVRow
                  label="Username"
                  value={
                    primaryProfile?.username ? `@${primaryProfile.username}` : "—"
                  }
                />
                <KVRow label="Handle" value={primaryProfile?.handle} />
                <KVRow
                  label="Location"
                  value={
                    [primaryProfile?.city, primaryProfile?.state, primaryProfile?.country]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
                <KVRow label="Language" value={primaryProfile?.language} />
                <KVRow label="Posts Count" value={fmtNum(primaryProfile?.postsCount)} />
                <KVRow
                  label="Avg Reels Plays"
                  value={fmtNum(primaryProfile?.avgReelsPlays)}
                />
              </Section>
            </div>
          </TabsContent>

          <TabsContent value="profiles" className="space-y-4">
            {profiles.length ? (
              profiles.map((profile, idx) => (
                <Section
                  key={`${profile.provider}-${idx}`}
                  title={
                    <>
                      <Globe className="h-5 w-5" />
                      <span className="capitalize">{profile.provider}</span>
                      {profile.isVerified && (
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-blue-100 text-blue-700"
                        >
                          Verified
                        </Badge>
                      )}
                    </>
                  }
                  subtitle={profile.bio}
                  right={
                    profile.url ? (
                      <a
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        View
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : undefined
                  }
                >
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <Card className="p-4 bg-blue-50/60">
                      <div className="text-xs text-slate-600">Followers</div>
                      <div className="text-2xl font-bold text-blue-700">
                        {fmtNum(profile.followers)}
                      </div>
                    </Card>

                    <Card className="p-4 bg-green-50/60">
                      <div className="text-xs text-slate-600">Engagement Rate</div>
                      <div className="text-2xl font-bold text-green-700">
                        {fmtPercent(profile.engagementRate)}
                      </div>
                    </Card>

                    <Card className="p-4 bg-purple-50/60">
                      <div className="text-xs text-slate-600">Avg Likes</div>
                      <div className="text-2xl font-bold text-purple-700">
                        {fmtNum(profile.avgLikes)}
                      </div>
                    </Card>

                    <Card className="p-4 bg-pink-50/60">
                      <div className="text-xs text-slate-600">Avg Comments</div>
                      <div className="text-2xl font-bold text-pink-700">
                        {fmtNum(profile.avgComments)}
                      </div>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <Card className="p-4">
                      <div className="font-semibold mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Account
                      </div>
                      <KVRow
                        label="Username"
                        value={profile.username ? `@${profile.username}` : "—"}
                      />
                      <KVRow label="Full Name" value={profile.fullname} />
                      <KVRow label="Handle" value={profile.handle} />
                      <KVRow label="Account Type" value={profile.accountType} />
                      <KVRow
                        label="Private"
                        value={profile.isPrivate ? <Pill tone="warning">Yes</Pill> : "No"}
                      />
                    </Card>

                    <Card className="p-4">
                      <div className="font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Localization
                      </div>
                      <KVRow label="City" value={profile.city} />
                      <KVRow label="State" value={profile.state} />
                      <KVRow label="Country" value={profile.country} />
                      <KVRow label="Language" value={profile.language} />
                      <KVRow label="Age Group" value={profile.ageGroup} />
                      <KVRow label="Gender" value={profile.gender} />
                    </Card>

                    <Card className="p-4">
                      <div className="font-semibold mb-2 flex items-center gap-2">
                        <BarChart2 className="h-4 w-4" />
                        Stats
                      </div>
                      <KVRow
                        label="Posts Count"
                        value={fmtNum(profile.postsCount)}
                      />
                      <KVRow
                        label="Followers"
                        value={fmtNum(profile.stats?.followers?.value ?? profile.followers)}
                      />
                      <KVRow
                        label="Avg Shares"
                        value={fmtNum(profile.stats?.avgShares?.value)}
                      />
                      <KVRow
                        label="Paid Post Performance"
                        value={fmtNum(profile.stats?.paidPostPerformance)}
                      />
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    <Card className="p-4">
                      <div className="font-semibold mb-3 flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Categories
                      </div>

                      {profile.categories?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.categories.map((c, i) => (
                            <Badge
                              key={`${c.categoryName}-${c.subcategoryName}-${i}`}
                              variant="outline"
                              className="border-slate-300"
                            >
                              {[c.categoryName, c.subcategoryName].filter(Boolean).join(" • ") || "—"}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">No categories</div>
                      )}
                    </Card>

                    <Card className="p-4">
                      <div className="font-semibold mb-3 flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Hashtags & Mentions
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {profile.hashtags?.slice(0, 12).map((h, i) => (
                          <Badge
                            key={`h-${i}`}
                            variant="secondary"
                            className="bg-slate-100 text-slate-800"
                          >
                            #{h.tag}
                          </Badge>
                        ))}

                        {profile.mentions?.slice(0, 12).map((m, i) => (
                          <Badge
                            key={`m-${i}`}
                            variant="secondary"
                            className="bg-indigo-100 text-indigo-800"
                          >
                            @{m.tag}
                          </Badge>
                        ))}
                      </div>

                      {profile.brandAffinity?.length ? (
                        <>
                          <Separator className="my-3" />
                          <div className="text-sm text-slate-600 mb-1">Brand Affinity</div>
                          <div className="flex flex-wrap gap-2">
                            {profile.brandAffinity.slice(0, 12).map((b, i) => (
                              <Badge
                                key={`ba-${i}`}
                                variant="outline"
                                className="border-amber-300 text-amber-800 bg-amber-50"
                              >
                                {b.name}
                              </Badge>
                            ))}
                          </div>
                        </>
                      ) : null}
                    </Card>
                  </div>
                </Section>
              ))
            ) : (
              <Card className="p-6 text-slate-600">No page1 social profiles found.</Card>
            )}
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            {profiles.map((profile, idx) => (
              <Section
                key={`posts-${profile.provider}-${idx}`}
                title={
                  <>
                    <ImageIcon className="h-5 w-5" />
                    <span className="capitalize">{profile.provider}</span> Posts
                  </>
                }
              >
                <Accordion type="multiple" className="space-y-2">
                  <AccordionItem value={`recent-${idx}`}>
                    <AccordionTrigger>Recent Posts</AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-72 rounded border bg-slate-50">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Text</TableHead>
                              <TableHead className="text-right">Likes</TableHead>
                              <TableHead className="text-right">Comments</TableHead>
                              <TableHead className="text-right">Views</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(profile.recentPosts || []).map((post, i) => (
                              <TableRow key={i}>
                                <TableCell>{fmtDate(post.created)}</TableCell>
                                <TableCell>{post.type || "—"}</TableCell>
                                <TableCell className="max-w-[360px] truncate" title={post.text}>
                                  {post.text || "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmtNum(post.likes)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmtNum(post.comments)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmtNum(getPostViews(post))}
                                </TableCell>
                                <TableCell>
                                  {post.url && (
                                    <a
                                      href={post.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                                    >
                                      Open
                                      <ArrowUpRight className="h-4 w-4" />
                                    </a>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value={`popular-${idx}`}>
                    <AccordionTrigger>Popular Posts</AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-72 rounded border bg-slate-50">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Text</TableHead>
                              <TableHead className="text-right">Likes</TableHead>
                              <TableHead className="text-right">Comments</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(profile.popularPosts || []).map((post, i) => (
                              <TableRow key={i}>
                                <TableCell>{fmtDate(post.created)}</TableCell>
                                <TableCell>{post.type || "—"}</TableCell>
                                <TableCell className="max-w-[360px] truncate" title={post.text}>
                                  {post.text || "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmtNum(post.likes)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmtNum(post.comments)}
                                </TableCell>
                                <TableCell>
                                  {post.url && (
                                    <a
                                      href={post.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                                    >
                                      Open
                                      <ArrowUpRight className="h-4 w-4" />
                                    </a>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value={`sponsored-${idx}`}>
                    <AccordionTrigger>Sponsored Posts</AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-72 rounded border bg-slate-50">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Text</TableHead>
                              <TableHead className="text-right">Likes</TableHead>
                              <TableHead className="text-right">Comments</TableHead>
                              <TableHead>Sponsors</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(profile.sponsoredPosts || []).map((post, i) => (
                              <TableRow key={i}>
                                <TableCell>{fmtDate(post.created)}</TableCell>
                                <TableCell>{post.type || "—"}</TableCell>
                                <TableCell className="max-w-[320px] truncate" title={post.text}>
                                  {post.text || "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmtNum(post.likes)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmtNum(post.comments)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {(post.sponsors || []).map((s, sponsorIdx) => (
                                      <Badge key={sponsorIdx} variant="outline">
                                        {s.name || s.domain || "Sponsor"}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {post.url && (
                                    <a
                                      href={post.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                                    >
                                      Open
                                      <ArrowUpRight className="h-4 w-4" />
                                    </a>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Section>
            ))}
          </TabsContent>

          <TabsContent value="audience" className="space-y-6">
            {profiles.map((profile, idx) => (
              <Section
                key={`audience-${profile.provider}-${idx}`}
                title={
                  <>
                    <Users className="h-5 w-5" />
                    <span className="capitalize">{profile.provider}</span> Audience
                  </>
                }
              >
                {profile.audience ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="font-semibold mb-2">Overview</div>
                      <KVRow label="Credibility" value={profile.audience.credibility ?? "—"} />
                      <KVRow label="Notable" value={profile.audience.notable ?? "—"} />
                      <KVRow
                        label="Top Languages"
                        value={
                          profile.audience.languages?.slice(0, 5)
                            .map((item) => item.name || item.code)
                            .filter(Boolean)
                            .join(", ") || "—"
                        }
                      />
                      <KVRow
                        label="Top Interests"
                        value={
                          profile.audience.interests?.slice(0, 5)
                            .map((item) => item.name || item.code)
                            .filter(Boolean)
                            .join(", ") || "—"
                        }
                      />
                    </Card>

                    <Card className="p-4">
                      <div className="font-semibold mb-2">Top Countries</div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Country</TableHead>
                            <TableHead className="text-right">Weight</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(profile.audience.geoCountries || []).slice(0, 8).map((item, i) => (
                            <TableRow key={i}>
                              <TableCell>{item.name || item.code || "—"}</TableCell>
                              <TableCell className="text-right">
                                {fmtWeightPercent(item.weight)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>

                    <Card className="p-4">
                      <div className="font-semibold mb-2">Age Distribution</div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Age</TableHead>
                            <TableHead className="text-right">Weight</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(profile.audience.ages || []).map((item, i) => (
                            <TableRow key={i}>
                              <TableCell>{item.code || item.name || "—"}</TableCell>
                              <TableCell className="text-right">
                                {fmtWeightPercent(item.weight)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                ) : (
                  <div className="text-slate-600">No audience data available.</div>
                )}
              </Section>
            ))}
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Section
              title={
                <>
                  <Info className="h-5 w-5" />
                  Payment Details
                </>
              }
              subtitle="Available payout methods for this influencer"
            >
              {paymentLoading ? (
                <div className="text-slate-600">Loading payment details...</div>
              ) : paymentDetails.length ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {paymentDetails.map((item, idx) => (
                    <Card key={item._id || idx} className="p-5 shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-semibold text-slate-900">
                            {item.type === 0 ? "PayPal" : "Bank"}
                          </h4>

                          {item.isDefault && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              Default
                            </Badge>
                          )}
                        </div>

                        <Pill tone={item.type === 0 ? "default" : "muted"}>
                          {item.type === 0 ? "PayPal" : "Bank Transfer"}
                        </Pill>
                      </div>

                      {item.type === 0 ? (
                        <>
                          <KVRow label="Email" value={<Copyable value={item.paypal?.email} />} />
                          <KVRow label="Username" value={item.paypal?.username || "—"} />
                        </>
                      ) : (
                        <>
                          <KVRow label="Account Holder" value={item.bank?.accountHolder || "—"} />
                          <KVRow label="Account Number" value={item.bank?.accountNumber || "—"} />
                          <KVRow label="Bank Name" value={item.bank?.bankName || "—"} />
                          <KVRow label="Branch" value={item.bank?.branch || "—"} />
                          <KVRow label="IFSC" value={item.bank?.ifsc || "—"} />
                          <KVRow label="SWIFT" value={item.bank?.swift || "—"} />
                          <KVRow label="Country" value={item.bank?.countryName || "—"} />
                        </>
                      )}

                      <Separator className="my-4" />

                      <div className="text-xs text-slate-500 space-y-1">
                        <div>Created: {fmtDateTime(item.createdAt)}</div>
                        <div>Updated: {fmtDateTime(item.updatedAt)}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-slate-600">No payment details available.</div>
              )}
            </Section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}