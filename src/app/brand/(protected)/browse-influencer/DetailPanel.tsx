'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  BarChart3,
  Send,
  MessageSquare,
} from 'lucide-react';
import Swal from 'sweetalert2';
import type { ReportResponse, Platform } from './types';
import { post, post2 } from '@/lib/api';

import { AuditTrailTable } from '@/components/common/AuditTrailTable';
import { AudienceIntelligenceCard } from '@/components/common/AudienceIntelligenceCard';
import { CampaignHighlightsCard } from '@/components/common/CampaignHighlightsCard';
import { ContactManagementCard } from '@/components/common/ContactManagementCard';
import { CreatorHeader } from '@/components/common/CreatorHeader';
import { FeatureLockedCard } from '@/components/common/FeatureLockedCard';
import { LookalikeCreatorsPanel } from '@/components/common/LookalikeCreatorsPanel';
import { MetricsGrid } from '@/components/common/MetricsGrid';
import { PastCollaborationsTable } from '@/components/common/PastCollaborations';
import { PerformanceTrendCard } from '@/components/common/PerformanceTrendCard';
import { PopularContentPanel } from '@/components/common/PopularContentPanel';
import { RecentPostsTable } from '@/components/common/RecentPostsTable';
import { RiskComplianceCard } from '@/components/common/RiskComplienceCard';

import {
  type AuditItem,
  type CampaignHighlight,
  type DashboardMetric,
  type InfluencerReport,
  type LookalikeCreator,
  type MediaKit,
  type ModashLookalike,
  SectionKey,
  type SocialPost,
  type SubscriptionPlan,
  type UserRole,
  average,
  canAccessSection,
  enrichPostImages,
  formatCompactNumber,
  formatPercent,
  getSubscriptionPlan,
  getUserRole,
  normaliseTrend,
  pickPostImage,
  toNumber,
} from '@/components/common/ViewModashClient';

interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  data: ReportResponse | null;
  raw: any;
  platform: Platform | null;
  emailExists?: boolean | null;
  onChangeCalc: (calc: 'median' | 'average') => void;
  brandId: string;
  handle: string | null;
  lastFetchedAt?: string | null;
  onRefreshReport?: () => Promise<void> | void;
}

type EmailStatusResponse =
  | {
      status: 0 | 1;
      email?: string;
      handle?: string;
      platform?: Platform;
    }
  | { status: 'error'; message?: string };

type InvitationResponse =
  | {
      status: 'success';
      message: string;
      isExistingInfluencer: true;
      influencerId: string;
      influencerName: string;
      brandName: string;
      emailSent: boolean;
      emailMeta?: {
        recipientEmail: string;
        threadId: string;
        messageId: string;
        subject: string;
        campaignId: string | null;
      };
    }
  | {
      status: 'success';
      message: string;
      isExistingInfluencer: false;
      brandName: string;
      invitationId: string;
      emailSent: boolean;
      emailMeta?: {
        recipientEmail: string;
        threadId: string;
        messageId: string;
        subject: string;
        campaignId: string | null;
      };
      isNewInvitation?: boolean;
    }
  | {
      status: 'error';
      message: string;
    };

type AdminCheckStatusResponse = {
  status: 0 | 1;
  handle?: string;
  email?: string | null;
  platform?: Platform | string;
  message?: string;
};

type InvitationCreateResp = {
  status: 'saved' | 'exists';
  data?: {
    invitationId: string;
    handle: string;
    platform: 'youtube' | 'instagram' | 'tiktok';
    brandId: string;
    campaignId?: string | null;
    status: 'invited' | 'available';
    createdAt: string;
    updatedAt: string;
  };
  message?: string;
};

type CreateMissingResp = {
  status: 'saved' | 'exists';
  data: {
    missingId: string;
    handle: string;
    platform: 'youtube' | 'instagram' | 'tiktok';
    brandId: string;
    note: string | null;
    createdAt: string;
  };
  message?: string;
};

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function normalizePlatform(platform: Platform | null): 'instagram' | 'tiktok' | 'youtube' {
  const value = String(platform ?? '').toLowerCase();
  if (value.includes('tiktok')) return 'tiktok';
  if (value.includes('youtube')) return 'youtube';
  return 'instagram';
}

function mapReportPost(post: Record<string, any>): SocialPost {
  const resolvedImage = pickPostImage(post);

  return {
    text: post?.text ?? post?.caption ?? post?.title,
    type: post?.type ?? post?.contentType,
    url: post?.url,
    image: resolvedImage,
    thumbnail: resolvedImage,
    likes: post?.likes,
    views: post?.views ?? post?.plays ?? post?.videoViews ?? post?.likes,
    plays: post?.plays ?? post?.videoViews,
    comments: post?.comments,
    sponsors: Array.isArray(post?.sponsors)
      ? post.sponsors.map((s: Record<string, any>) => ({
          name: s?.name ?? s?.username,
        }))
      : [],
    createdAt: post?.created ?? post?.createdAt ?? post?.publishedAt,
    publishedAt: post?.publishedAt ?? post?.created ?? post?.createdAt,
    postedAt: post?.postedAt ?? post?.created ?? post?.createdAt,
    date: post?.date ?? post?.created ?? post?.createdAt,
    created: post?.created ?? post?.createdAt,
  };
}

function parseMonthLabel(value: string, index: number): string {
  if (!value) return monthLabels[index % 12];
  const parts = value.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const month = Number(parts[1]);
    if (month >= 1 && month <= 12) {
      return `${monthLabels[month - 1]} ${year.slice(2)}`;
    }
  }
  return value;
}

function transformPanelLookalikes(
  lookalikes: ModashLookalike[] = [],
  engagementRate: number
): LookalikeCreator[] {
  return lookalikes.slice(0, 4).map((item) => ({
    id: item.userId,
    name: item.fullname ?? item.username,
    handle: `@${item.username}`,
    followers: formatCompactNumber(item.followers),
    engagement:
      item.followers > 0
        ? formatPercent((item.engagements / item.followers) * 100)
        : formatPercent(engagementRate, true),
    avatar: item.picture,
    url: item.url,
  }));
}

function pickFirstArray(...candidates: any[]): any[] {
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) return candidate;
  }
  return [];
}

function pickReportRoot(raw: any, data: ReportResponse | null): any {
  const candidates = [raw, raw?.profile, data, (data as any)?.profile];

  const isRichRoot = (value: any) =>
    value &&
    typeof value === 'object' &&
    (
      Array.isArray(value?.recentPosts) ||
      Array.isArray(value?.popularPosts) ||
      Array.isArray(value?.sponsoredPosts) ||
      value?.audience ||
      value?.statsByContentType ||
      value?.stats ||
      value?.avgReelsPlays !== undefined ||
      value?.avgViews !== undefined ||
      value?.lookalikes ||
      value?.audienceExtra
    );

  for (const candidate of candidates) {
    if (isRichRoot(candidate)) return candidate;
  }

  return raw?.profile ?? raw ?? (data as any)?.profile ?? data;
}

function buildPrimaryReport(
  data: ReportResponse | null,
  raw: any,
  platform: Platform | null,
  handle: string | null
): InfluencerReport | null {
  const root = pickReportRoot(raw, data);
  if (!root) return null;

  const profileRoot = root?.profile && typeof root.profile === 'object' ? root.profile : root;
  const audience = root?.audience ?? profileRoot?.audience ?? {};
  const stats = root?.stats ?? profileRoot?.stats ?? {};
  const statsByContentType = root?.statsByContentType ?? profileRoot?.statsByContentType ?? {};
  const normalizedPlatform = normalizePlatform(platform);

  const username =
    profileRoot?.username ??
    profileRoot?.handle ??
    root?.username ??
    root?.handle ??
    (handle ? handle.replace(/^@/, '') : undefined);

  const mapPosts = (items: any) =>
    Array.isArray(items) ? items.map(mapReportPost) : [];

  const recentPosts = mapPosts(
    pickFirstArray(
      root?.recentPosts,
      profileRoot?.recentPosts,
      root?.posts,
      profileRoot?.posts,
    )
  );

  const popularPosts = mapPosts(
    pickFirstArray(root?.popularPosts, profileRoot?.popularPosts)
  );

  const sponsoredPosts = mapPosts(
    pickFirstArray(root?.sponsoredPosts, profileRoot?.sponsoredPosts)
  );

  const followers =
    profileRoot?.followers ??
    root?.followers ??
    stats?.followers?.value ??
    root?.subscribers ??
    profileRoot?.subscribers;

  const avgLikes =
    root?.avgLikes ??
    profileRoot?.avgLikes ??
    stats?.avgLikes?.value ??
    statsByContentType?.all?.avgLikes ??
    statsByContentType?.reels?.avgLikes;

  const avgComments =
    root?.avgComments ??
    profileRoot?.avgComments ??
    stats?.avgComments?.value ??
    statsByContentType?.all?.avgComments ??
    statsByContentType?.reels?.avgComments;

  const avgViews =
    profileRoot?.averageViews ??
    root?.avgViews ??
    root?.avgReelsPlays ??
    stats?.avgViews?.value ??
    statsByContentType?.all?.avgViews ??
    statsByContentType?.reels?.avgViews ??
    statsByContentType?.reels?.avgReelsPlays;

  const avgReelsPlays =
    root?.avgReelsPlays ??
    profileRoot?.avgReelsPlays ??
    statsByContentType?.reels?.avgReelsPlays ??
    profileRoot?.averageViews ??
    root?.avgViews;

  const statHistory = Array.isArray(root?.statHistory)
    ? root.statHistory
    : Array.isArray(profileRoot?.statHistory)
      ? profileRoot.statHistory
      : Array.isArray(statsByContentType?.all?.statHistory)
        ? statsByContentType.all.statHistory
        : Array.isArray(statsByContentType?.reels?.statHistory)
          ? statsByContentType.reels.statHistory
          : [];

  const lookalikes = Array.isArray(root?.lookalikes)
    ? root.lookalikes
    : Array.isArray(profileRoot?.lookalikes)
      ? profileRoot.lookalikes
      : Array.isArray(audience?.audienceLookalikes)
        ? audience.audienceLookalikes
        : [];

  return {
    modashId:
      root?.userId ??
      root?.modashId ??
      profileRoot?.userId ??
      profileRoot?.modashId,
    provider: normalizedPlatform,
    url: profileRoot?.url ?? root?.url,
    name: profileRoot?.fullname ?? root?.fullname ?? root?.name ?? profileRoot?.username ?? username,
    fullname: profileRoot?.fullname ?? root?.fullname,
    picture: profileRoot?.picture ?? root?.picture,
    bio: root?.bio ?? profileRoot?.bio,
    username,
    handle: username ? `@${String(username).replace(/^@/, '')}` : undefined,
    followers,
    engagementRate: profileRoot?.engagementRate ?? root?.engagementRate,
    country: root?.country ?? profileRoot?.country,
    language:
      typeof root?.language === 'string'
        ? { name: root.language }
        : root?.language?.name
          ? { name: root.language.name }
          : typeof profileRoot?.language === 'string'
            ? { name: profileRoot.language }
            : profileRoot?.language?.name
              ? { name: profileRoot.language.name }
              : Array.isArray(audience?.languages) && audience.languages.length
                ? { name: audience.languages[0]?.name ?? audience.languages[0]?.code }
                : undefined,
    hashtags: Array.isArray(root?.hashtags)
      ? root.hashtags.map((item: Record<string, any>) => ({ tag: item?.tag }))
      : Array.isArray(profileRoot?.hashtags)
        ? profileRoot.hashtags.map((item: Record<string, any>) => ({ tag: item?.tag }))
        : [],
    popularPosts,
    recentPosts,
    sponsoredPosts,
    stats: {
      avgLikes: {
        value: avgLikes,
        compared: stats?.avgLikes?.compared,
      },
      avgViews: {
        value: avgViews,
        compared: stats?.avgViews?.compared,
      },
      avgComments: {
        value: avgComments,
        compared: stats?.avgComments?.compared,
      },
      followers: {
        value: followers,
        compared: stats?.followers?.compared,
      },
      paidPostPerformance: stats?.paidPostPerformance,
    },
    avgLikes,
    avgComments,
    avgViews,
    avgReelsPlays,
    audience: {
      geoCountries: Array.isArray(audience?.geoCountries)
        ? audience.geoCountries.map((item: Record<string, any>) => ({
            name: item?.name ?? '',
            weight: item?.weight ?? 0,
          }))
        : [],
      ages: Array.isArray(audience?.ages)
        ? audience.ages.map((item: Record<string, any>) => ({
            code: item?.code ?? '',
            weight: item?.weight ?? 0,
          }))
        : [],
      genders: Array.isArray(audience?.genders)
        ? audience.genders.map((item: Record<string, any>) => ({
            code: item?.code ?? '',
            weight: item?.weight ?? 0,
          }))
        : [],
      languages: Array.isArray(audience?.languages)
        ? audience.languages.map((item: Record<string, any>) => ({
            code: item?.name ?? item?.code ?? '',
            weight: item?.weight ?? 0,
          }))
        : [],
      interests: Array.isArray(audience?.interests)
        ? audience.interests.map((item: Record<string, any>) => ({
            name: item?.name ?? '',
            weight: item?.weight ?? 0,
          }))
        : [],
      credibility: audience?.credibility,
    },
    isPrivate: root?.isPrivate ?? profileRoot?.isPrivate,
    isVerified: root?.isVerified ?? profileRoot?.isVerified,
    accountType: root?.accountType ?? profileRoot?.accountType,
    postsCount:
      root?.postsCount ??
      root?.postsCounts ??
      profileRoot?.postsCount ??
      profileRoot?.postsCounts,
    statHistory,
    lookalikes,
  };
}

export const DetailPanel = React.memo<DetailPanelProps>(
  ({
    open,
    onClose,
    loading,
    error,
    data,
    raw,
    platform,
    emailExists,
    onChangeCalc: _onChangeCalc,
    brandId,
    handle,
    lastFetchedAt,
    onRefreshReport,
  }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const campaignId = searchParams?.get('campaignId') || '';

    const [sendingInvite, setSendingInvite] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(
      lastFetchedAt || null
    );
    const [hasAnyEmail, setHasAnyEmail] = useState<boolean | null>(null);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [plan, setPlan] = useState<SubscriptionPlan>('pro');
    const [role, setRole] = useState<UserRole>('viewer');
    const shouldLockFields = false;

    const hasSectionAccess = (_section: SectionKey) => {
      if (!shouldLockFields) return true;
      return canAccessSection(role, plan, _section);
    };

    useEffect(() => {
      setPlan(getSubscriptionPlan());
      setRole(getUserRole());
    }, []);

    useEffect(() => {
      setLastUpdatedAt(lastFetchedAt || null);
    }, [lastFetchedAt]);

    const formattedLastUpdated = lastUpdatedAt
      ? new Date(lastUpdatedAt).toLocaleString()
      : 'Not fetched yet';

    const primaryReport = useMemo(
      () => buildPrimaryReport(data, raw, platform, handle),
      [data, raw, platform, handle]
    );

    const panelMediaKit = useMemo<MediaKit | null>(() => {
      if (!primaryReport) return null;
      return {
        name: primaryReport.name,
        country: primaryReport.country,
        influencerReports: [primaryReport],
        socialProfiles: [primaryReport],
        primaryInfluencerReport: primaryReport,
      };
    }, [primaryReport]);

    const popularPosts = useMemo(() => {
      const base =
        Array.isArray(raw?.profile?.popularPosts) && raw.profile.popularPosts.length
          ? raw.profile.popularPosts.map(mapReportPost)
          : primaryReport?.popularPosts ?? [];

      return enrichPostImages(base, [
        ...(primaryReport?.recentPosts ?? []),
        ...(primaryReport?.sponsoredPosts ?? []),
      ]);
    }, [raw, primaryReport]);

    const sponsoredPosts = useMemo(() => {
      const base =
        Array.isArray(raw?.profile?.sponsoredPosts) && raw.profile.sponsoredPosts.length
          ? raw.profile.sponsoredPosts.map(mapReportPost)
          : primaryReport?.sponsoredPosts ?? [];

      return enrichPostImages(base, [
        ...(primaryReport?.recentPosts ?? []),
        ...(primaryReport?.popularPosts ?? []),
      ]);
    }, [raw, primaryReport]);

    const recentPosts = useMemo(() => {
      const base =
        Array.isArray(raw?.profile?.recentPosts) && raw.profile.recentPosts.length
          ? raw.profile.recentPosts.map(mapReportPost)
          : Array.isArray(raw?.profile?.posts) && raw.profile.posts.length
            ? raw.profile.posts.map(mapReportPost)
            : primaryReport?.recentPosts ?? [];

      return enrichPostImages(base, [
        ...(Array.isArray(raw?.profile?.popularPosts)
          ? raw.profile.popularPosts.map(mapReportPost)
          : []),
        ...(Array.isArray(raw?.profile?.sponsoredPosts)
          ? raw.profile.sponsoredPosts.map(mapReportPost)
          : []),
        ...(primaryReport?.popularPosts ?? []),
        ...(primaryReport?.sponsoredPosts ?? []),
      ]);
    }, [raw, primaryReport]);

    const statHistorySource = useMemo(() => {
      const history =
        (data?.profile as any)?.statsByContentType?.all?.statHistory ??
        (data?.profile as any)?.statHistory ??
        primaryReport?.statHistory ??
        [];
      return Array.isArray(history) ? history : [];
    }, [data, primaryReport]);

    const { organicTrend, sponsoredTrend, trendLabels } = useMemo(() => {
      if (statHistorySource.length) {
        const labels = statHistorySource.map((item: Record<string, any>, index: number) =>
          parseMonthLabel(String(item?.month ?? ''), index)
        );

        const organic = normaliseTrend(
          statHistorySource.map((item: Record<string, any>) =>
            toNumber(item?.avgLikes ?? item?.likes ?? item?.engagements)
          ),
          statHistorySource.length
        );

        const sponsored = normaliseTrend(
          statHistorySource.map((item: Record<string, any>) =>
            toNumber(item?.avgViews ?? item?.views ?? item?.followers)
          ),
          statHistorySource.length
        );

        return { organicTrend: organic, sponsoredTrend: sponsored, trendLabels: labels };
      }

      return {
        organicTrend: normaliseTrend(recentPosts.map((p) => p.views ?? p.likes ?? 0)),
        sponsoredTrend: normaliseTrend(sponsoredPosts.map((p) => p.views ?? p.likes ?? 0)),
        trendLabels: undefined,
      };
    }, [statHistorySource, recentPosts, sponsoredPosts]);

    const avgLikes = toNumber(
      (data?.profile as any)?.avgLikes ??
        primaryReport?.stats?.avgLikes?.value ??
        primaryReport?.avgLikes
    );

    const avgViews = toNumber(
      (data?.profile as any)?.profile?.averageViews ??
        (data?.profile as any)?.avgReelsPlays ??
        primaryReport?.stats?.avgViews?.value ??
        average(recentPosts.map((p) => toNumber(p.views ?? p.likes)))
    );

    const engagementRate = toNumber(
      primaryReport?.engagementRate ?? (data?.profile as any)?.profile?.engagementRate
    );

    const credibilityScore = useMemo(() => {
      const rawCredibility =
        (data?.profile as any)?.audience?.credibility ??
        primaryReport?.audience?.credibility;

      if (rawCredibility !== undefined && rawCredibility !== null) {
        return Math.round(Number(rawCredibility) * 100);
      }

      return Math.max(0, Math.min(97, Math.round(engagementRate * 100 || 67)));
    }, [data, primaryReport, engagementRate]);

    const metricCards = useMemo<DashboardMetric[]>(() => {
      return [
        {
          key: 'followers',
          label: 'Followers',
          value: formatCompactNumber(primaryReport?.followers),
        },
        {
          key: 'engagement',
          label: 'Avg. engagement rate',
          value: formatPercent(primaryReport?.engagementRate, true),
        },
        {
          key: 'likes',
          label: 'Average likes',
          value: formatCompactNumber(avgLikes),
        },
        {
          key: 'views',
          label: 'Avg. views',
          value: formatCompactNumber(avgViews),
        },
        {
          key: 'posts',
          label: 'Total posts',
          value: formatCompactNumber(primaryReport?.postsCount ?? recentPosts.length),
        },
        {
          key: 'reach',
          label: 'Estimated reach',
          value: formatCompactNumber(primaryReport?.followers),
        },
      ];
    }, [primaryReport, avgLikes, avgViews, recentPosts.length]);

    const campaignHighlights = useMemo<CampaignHighlight[]>(() => {
      const sponsoredAvgLikes = average(sponsoredPosts.map((p) => toNumber(p.likes)));
      const organicAvgLikes = average(recentPosts.map((p) => toNumber(p.likes)));
      const topPostLikes = Math.max(...popularPosts.map((p) => toNumber(p.likes)), 0);

      return [
        {
          label: sponsoredPosts.length ? 'Sponsored median likes' : 'Top post likes',
          value: formatCompactNumber(sponsoredPosts.length ? sponsoredAvgLikes : topPostLikes),
          meta: sponsoredPosts.length
            ? `Across ${sponsoredPosts.length} sponsored posts`
            : `Best result from ${popularPosts.length} popular posts`,
          tone: 'accent',
        },
        {
          label: 'Organic median likes',
          value: formatCompactNumber(organicAvgLikes),
          meta: `Across ${recentPosts.length} recent posts`,
        },
        {
          label: 'Total posts',
          value: formatCompactNumber(primaryReport?.postsCount ?? recentPosts.length),
          meta: 'Current creator activity volume',
        },
        {
          label: 'Audience credibility',
          value: `${credibilityScore}%`,
          meta: 'Estimated quality score',
        },
      ];
    }, [sponsoredPosts, recentPosts, popularPosts, primaryReport, credibilityScore]);

    const audienceAge = (primaryReport?.audience?.ages ?? []).map((item) => ({
      label: item.code,
      value: Number((item.weight || 0) * 100),
    }));

    const audienceGender = (primaryReport?.audience?.genders ?? []).map((item) => ({
      label:
        item.code === 'MALE'
          ? 'Male'
          : item.code === 'FEMALE'
            ? 'Female'
            : item.code,
      value: Number((item.weight || 0) * 100),
    }));

    const topCountries = (primaryReport?.audience?.geoCountries ?? [])
      .slice(0, 4)
      .map((item) => ({
        name: item.name,
        value: Number((item.weight || 0) * 100),
      }));

    const topLanguages = (primaryReport?.audience?.languages ?? [])
      .slice(0, 4)
      .map((item) => ({
        label: item.code,
        value: Number((item.weight || 0) * 100),
      }));

    const lookalikeCreators = useMemo<LookalikeCreator[]>(() => {
      if (primaryReport?.lookalikes?.length) {
        return transformPanelLookalikes(primaryReport.lookalikes, engagementRate);
      }
      return [];
    }, [primaryReport, engagementRate]);

    const auditItems = useMemo<AuditItem[]>(
      () => [
        {
          id: '1',
          date: formattedLastUpdated,
          action: 'Creator profile detail opened',
          actor: 'Brand user',
          status: 'Success',
        },
        {
          id: '2',
          date: formattedLastUpdated,
          action: 'Latest report sync',
          actor: 'System',
          status: loading ? 'Running' : 'Success',
        },
      ],
      [formattedLastUpdated, loading]
    );

    const contractedCampaigns = useMemo(() => {
      const source = Array.isArray((data?.profile as any)?.pastCollaborations)
        ? (data?.profile as any).pastCollaborations
        : [];
      return source.map((item: Record<string, any>) => ({
        _id: item?._id,
        company: item?.company ?? item?.brandName ?? '—',
        brief: item?.brief ?? item?.campaignTitle ?? '—',
        rate: item?.rate ?? item?.budget ?? '—',
        status: item?.status ?? '—',
        payout: item?.payout ?? item?.paymentType ?? '—',
        category: item?.category ?? 'Lifestyle',
        raw: item,
      }));
    }, [data]);

    const isEmailStatusSuccess = (
      resp: EmailStatusResponse
    ): resp is {
      status: 0 | 1;
      email?: string;
      handle?: string;
      platform?: Platform;
    } => {
      return typeof (resp as any)?.status === 'number';
    };

    const resolveCreatorEmail = async (
      safeHandle: string,
      normalizedPlatform: Platform
    ): Promise<{ email: string | null; source: 'status' | 'admin' | 'both' | 'none' }> => {
      const [statusResult, adminResult] = await Promise.allSettled([
        post2<EmailStatusResponse>('/email/status', {
          handle: safeHandle,
          platform: normalizedPlatform,
        }),
        post<AdminCheckStatusResponse>('/admin/checkstatus', {
          handle: safeHandle,
          platform: normalizedPlatform,
        }),
      ]);

      let emailFromStatus: string | null = null;
      let emailFromAdmin: string | null = null;

      if (statusResult.status === 'fulfilled') {
        const statusResp = statusResult.value;
        if (
          isEmailStatusSuccess(statusResp) &&
          statusResp.status === 1 &&
          statusResp.email
        ) {
          emailFromStatus = statusResp.email;
        }
      } else {
        console.error('Error calling /email/status:', statusResult.reason);
      }

      if (adminResult.status === 'fulfilled') {
        const adminResp = adminResult.value;
        if (
          typeof adminResp.status === 'number' &&
          adminResp.status === 1 &&
          adminResp.email
        ) {
          emailFromAdmin = adminResp.email;
        }
      } else {
        console.error('Error calling /admin/checkstatus:', adminResult.reason);
      }

      if (emailFromStatus && emailFromAdmin && emailFromStatus === emailFromAdmin) {
        return { email: emailFromStatus, source: 'both' };
      }
      if (emailFromStatus) return { email: emailFromStatus, source: 'status' };
      if (emailFromAdmin) return { email: emailFromAdmin, source: 'admin' };
      return { email: null, source: 'none' };
    };

    useEffect(() => {
      if (!open) {
        setHasAnyEmail(null);
        return;
      }

      const normalizedPlatform = (platform ?? '').toLowerCase() as Platform;
      if (!normalizedPlatform || !['youtube', 'instagram', 'tiktok'].includes(normalizedPlatform)) {
        setHasAnyEmail(null);
        return;
      }

      const rawHandle = handle ? String(handle).trim() : '';
      const safeHandle = rawHandle
        ? '@' + rawHandle.replace(/^@/, '').trim().toLowerCase()
        : '';

      if (!safeHandle || !/^[A-Za-z0-9._-]+$/.test(safeHandle.replace(/^@/, ''))) {
        setHasAnyEmail(null);
        return;
      }

      let cancelled = false;
      setCheckingEmail(true);

      (async () => {
        try {
          const { email } = await resolveCreatorEmail(safeHandle, normalizedPlatform);
          if (!cancelled) setHasAnyEmail(!!email);
        } catch (err) {
          console.error('Failed to pre-check email status', err);
          if (!cancelled) setHasAnyEmail(null);
        } finally {
          if (!cancelled) setCheckingEmail(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [open, handle, platform]);

    if (!open) return null;

    const hasUserId = Boolean((data?.profile as any)?.userId);
    const canAct = hasUserId && !loading && !sendingInvite && !refreshing;
    const effectiveHasEmail = hasAnyEmail !== null ? hasAnyEmail : emailExists === true;

    const ctaTitle = hasUserId
      ? effectiveHasEmail
        ? 'Message this creator'
        : 'Send invitation to collect email'
      : 'Profile not ready';

    const displayName =
      primaryReport?.name ??
      primaryReport?.fullname ??
      primaryReport?.username ??
      handle ??
      'Creator profile';

    const displayHandle =
      primaryReport?.handle ??
      (handle && (handle.startsWith('@') ? handle : `@${handle}`)) ??
      '';

    const handleRefreshData = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!onRefreshReport || refreshing) return;

      try {
        setRefreshing(true);
        await onRefreshReport();
      } catch (err: any) {
        console.error(err);
        await Swal.fire(
          'Refresh failed',
          err?.message || 'Failed to refresh data',
          'error'
        );
      } finally {
        setRefreshing(false);
      }
    };

    const handleMessageNow = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!canAct) return;

      if (!brandId) {
        await Swal.fire(
          'Missing brand',
          'Missing brandId. Please provide brandId to DetailPanel.',
          'warning'
        );
        return;
      }

      const normalizedPlatform = (platform ?? '').toLowerCase() as Platform;
      if (!normalizedPlatform || !['youtube', 'instagram', 'tiktok'].includes(normalizedPlatform)) {
        await Swal.fire('Unsupported platform', 'Unsupported or missing platform.', 'warning');
        return;
      }

      const rawHandle = handle ? String(handle).trim() : '';
      const safeHandle = rawHandle
        ? '@' + rawHandle.replace(/^@/, '').trim().toLowerCase()
        : '';

      if (!safeHandle || !/^[A-Za-z0-9._-]+$/.test(safeHandle.replace(/^@/, ''))) {
        await Swal.fire(
          'Invalid handle',
          'Invalid or missing handle to lookup contact email.',
          'warning'
        );
        return;
      }

      try {
        setSendingInvite(true);

        const { email: creatorEmail } = await resolveCreatorEmail(
          safeHandle,
          normalizedPlatform
        );

        if (!creatorEmail) {
          await Swal.fire(
            'No email found',
            'We could not find a contact email for this creator. Try sending an invitation or adding the email manually.',
            'warning'
          );
          return;
        }

        const resp = await post<InvitationResponse>('/emails/invitation', {
          email: creatorEmail,
          brandId,
          campaignId: campaignId || undefined,
          handle: safeHandle,
          platform: normalizedPlatform,
        });

        if (!resp) {
          await Swal.fire(
            'Error',
            'No response from server while sending invitation.',
            'error'
          );
          return;
        }

        if (resp.status === 'error') {
          await Swal.fire('Error', resp.message || 'Failed to send email.', 'error');
          return;
        }

        const successTitle = resp.isExistingInfluencer ? 'Message sent' : 'Invitation sent';

        const successText = resp.isExistingInfluencer
          ? 'We’ve emailed this creator. They can reply directly and continue the conversation with your brand.'
          : 'We’ve sent your invitation to this creator. They’ll see it and can reply soon if they’re interested.';

        await Swal.fire(successTitle, successText, 'success');
      } catch (err: any) {
        console.error(err);
        await Swal.fire(
          'Error',
          err?.response?.data?.message ||
            err?.message ||
            'Failed to send invitation email. Please try again.',
          'error'
        );
      } finally {
        setSendingInvite(false);
      }
    };

    const handleSendInvitation = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!canAct || sendingInvite) return;

      const rawHandle = handle ? String(handle).trim() : '';
      const safeHandle = rawHandle
        ? rawHandle.startsWith('@')
          ? rawHandle
          : `@${rawHandle}`
        : '';

      if (!brandId) {
        await Swal.fire(
          'Missing brand',
          'Missing brandId. Please provide brandId to DetailPanel.',
          'warning'
        );
        return;
      }

      const normalizedPlatform = (platform ?? '').toLowerCase() as Platform;
      if (!normalizedPlatform || !['youtube', 'instagram', 'tiktok'].includes(normalizedPlatform)) {
        await Swal.fire('Unsupported platform', 'Unsupported or missing platform.', 'warning');
        return;
      }

      if (!safeHandle || !/^[A-Za-z0-9._-]+$/.test(safeHandle.replace(/^@/, ''))) {
        await Swal.fire(
          'Invalid handle',
          'Invalid or missing handle to send invitation.',
          'warning'
        );
        return;
      }

      try {
        setSendingInvite(true);

        const invitationPayload: {
          handle: string;
          platform: Platform;
          brandId: string;
          status: 'invited' | 'available';
          campaignId?: string;
        } = {
          handle: safeHandle,
          platform: normalizedPlatform,
          brandId,
          status: 'invited',
        };

        if (campaignId) {
          invitationPayload.campaignId = campaignId;
        }

        const [missingResult, invitationResult] = await Promise.allSettled([
          post2<CreateMissingResp>('/missing/create', {
            handle: safeHandle,
            platform: normalizedPlatform,
            brandId,
          }),
          post<InvitationCreateResp>('/newinvitations/create', invitationPayload),
        ]);

        if (missingResult.status !== 'fulfilled') {
          console.error('Missing/create failed', missingResult.reason);
        }

        let invitationStatus: InvitationCreateResp['status'] | 'error' = 'error';

        if (invitationResult.status === 'fulfilled') {
          const resp = invitationResult.value;
          if (resp?.status === 'saved' || resp?.status === 'exists') {
            invitationStatus = resp.status;
          }
        } else {
          console.error('Invitation/create failed', invitationResult.reason);
        }

        if (invitationStatus === 'error') {
          await Swal.fire(
            'Something went wrong',
            'We couldn’t send the invitation. Please try again in a moment.',
            'error'
          );
          return;
        }

        if (invitationStatus === 'saved') {
          await Swal.fire(
            'Invitation sent',
            'We’ve sent an invitation to this creator. They’ll see it and can reply soon.',
            'success'
          );
        } else {
          await Swal.fire(
            'Already invited',
            'You’ve already sent an invitation to this creator. They’ll be able to reply once they see it.',
            'info'
          );
        }

        router.push('/brand/invited');
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to send invitation';
        console.error(err);
        await Swal.fire('Error', msg, 'error');
      } finally {
        setSendingInvite(false);
      }
    };

    const handleCopy = async () => {
      try {
        const urlToCopy =
          primaryReport?.url ||
          `${window.location.origin}${window.location.pathname}${window.location.search}`;
        await navigator.clipboard.writeText(urlToCopy);
        await Swal.fire({
          icon: 'success',
          title: 'Copied',
          text: 'Creator profile link copied to clipboard.',
          timer: 1600,
          showConfirmButton: false,
        });
      } catch (copyError) {
        console.error('Failed to copy profile link:', copyError);
        await Swal.fire({
          icon: 'error',
          title: 'Copy failed',
          text: 'Unable to copy the profile link.',
        });
      }
    };

    const showRefreshButton = Boolean(onRefreshReport);

    return (
      <div className="fixed inset-0 z-[90]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="absolute right-0 top-0 h-full w-full overflow-y-auto border-l bg-white shadow-2xl md:w-[72vw] xl:w-[64vw] rounded-none md:rounded-l-3xl">
          <div className="sticky top-0 z-10 border-b bg-white/90 px-4 py-3 backdrop-blur">
            <div className="flex items-start gap-3">
              <button
                onClick={onClose}
                className="inline-flex flex-shrink-0 items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm transition-colors hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" /> Close
              </button>

              <div className="min-w-0 flex flex-col gap-0.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-semibold text-gray-900">
                    {displayName}
                  </span>
                  {displayHandle ? (
                    <span className="truncate text-xs text-gray-500">
                      {displayHandle}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {platform ? (
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-700">
                      {platform}
                    </span>
                  ) : null}
                  {checkingEmail ? (
                    <span className="text-[11px] text-gray-500">Checking email…</span>
                  ) : null}
                </div>
              </div>

              <div className="ml-auto flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wide text-gray-500">
                      Latest data
                    </span>
                    <span className="text-xs text-gray-700">
                      {formattedLastUpdated}
                    </span>
                  </div>

                  {showRefreshButton ? (
                    <button
                      type="button"
                      onClick={handleRefreshData}
                      disabled={refreshing || loading}
                      className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      <BarChart3
                        className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`}
                      />
                      {refreshing ? 'Refreshing…' : 'Refresh data'}
                    </button>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {effectiveHasEmail ? (
                    <button
                      onClick={handleMessageNow}
                      disabled={!canAct}
                      title={ctaTitle}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-opacity ${
                        canAct
                          ? 'bg-gradient-to-r from-[#FFA135] to-[#FF7236] hover:opacity-90'
                          : 'cursor-not-allowed bg-gray-300 opacity-70'
                      }`}
                    >
                      {sendingInvite ? (
                        <>
                          <MessageSquare className="h-4 w-4 animate-pulse" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4" />
                          Send Invitation
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleSendInvitation}
                      disabled={!canAct}
                      title={ctaTitle}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-opacity ${
                        canAct
                          ? 'bg-gradient-to-r from-[#FFA135] to-[#FF7236] hover:opacity-90'
                          : 'cursor-not-allowed bg-gray-300 opacity-70'
                      }`}
                    >
                      {sendingInvite ? (
                        <>
                          <Send className="h-4 w-4 animate-pulse" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Invitation
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5">
            {loading ? <LoadingState /> : null}
            {error ? <ErrorState error={error} /> : null}

            {!loading && !error && !primaryReport ? (
              <div className="mb-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
                No report data yet. Try refreshing data or selecting another creator.
              </div>
            ) : null}

            {!loading && !error && primaryReport ? (
              <div className="space-y-6">
                <CreatorHeader
                  primaryReport={primaryReport}
                  mediaKit={panelMediaKit}
                  activePlan={plan}
                  isVerified={primaryReport.isVerified}
                  accountType={primaryReport.accountType}
                  postsCount={primaryReport.postsCount}
                />

                <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="space-y-6">
                    {hasSectionAccess('contactManagement') ? (
                      <ContactManagementCard
                        primaryReport={primaryReport}
                        mediaKit={panelMediaKit}
                        onCopy={handleCopy}
                      />
                    ) : null}

                    {hasSectionAccess('riskCompliance') ? (
                      <RiskComplianceCard
                        credibilityScore={credibilityScore}
                        isPrivate={primaryReport.isPrivate}
                      />
                    ) : (
                      <FeatureLockedCard
                        title="Risk & Compliance Monitoring"
                        plan="starter"
                      />
                    )}
                  </div>

                  <div className="space-y-6">
                    {hasSectionAccess('metricGrid') ? (
                      <MetricsGrid metrics={metricCards} />
                    ) : null}

                    {hasSectionAccess('performanceTrend') ? (
                      <PerformanceTrendCard
                        organicTrend={organicTrend}
                        sponsoredTrend={sponsoredTrend}
                        trendLabels={trendLabels}
                      />
                    ) : (
                      <FeatureLockedCard title="Performance Trend" plan="starter" />
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {hasSectionAccess('campaignHighlights') ? (
                    <CampaignHighlightsCard items={campaignHighlights} />
                  ) : (
                    <FeatureLockedCard
                      title="Campaign Performance Highlights"
                      plan="pro"
                    />
                  )}

                  {hasSectionAccess('audienceIntelligence') ? (
                    <AudienceIntelligenceCard
                      ageData={audienceAge}
                      genderData={audienceGender}
                      topCountries={topCountries}
                      credibilityScore={credibilityScore}
                      topLanguages={topLanguages}
                    />
                  ) : (
                    <FeatureLockedCard title="Audience Intelligence" plan="pro" />
                  )}

                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_420px]">
                    {hasSectionAccess('recentPosts') ? (
                      <RecentPostsTable posts={recentPosts.slice(0, 4)} />
                    ) : (
                      <FeatureLockedCard
                        title="Recent Posts Performance"
                        plan="free"
                      />
                    )}

                    {hasSectionAccess('popularContent') ? (
                      <PopularContentPanel posts={popularPosts.slice(0, 2)} />
                    ) : (
                      <FeatureLockedCard title="Popular Content" plan="starter" />
                    )}
                  </div>

                  {contractedCampaigns.length ? (
                    <PastCollaborationsTable items={contractedCampaigns} />
                  ) : null}

                  {hasSectionAccess('lookalikeCreators') ? (
                    <LookalikeCreatorsPanel items={lookalikeCreators} />
                  ) : (
                    <FeatureLockedCard title="Lookalike Creators" plan="pro" />
                  )}

                  {hasSectionAccess('auditTrail') ? (
                    <AuditTrailTable items={auditItems} />
                  ) : (
                    <FeatureLockedCard title="Audit Trail" plan="enterprise" />
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
);

DetailPanel.displayName = 'DetailPanel';

const LoadingState: React.FC = () => (
  <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
      <BarChart3 className="h-8 w-8 animate-pulse text-orange-600" />
    </div>
    <div className="text-lg font-semibold">Fetching report…</div>
  </div>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    <AlertCircle className="mt-0.5 h-5 w-5" />
    <div>
      <div className="font-semibold">Limit Reached</div>
      <div>{error}</div>
    </div>
  </div>
);