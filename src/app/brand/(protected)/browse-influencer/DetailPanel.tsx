'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Send,
  X,
  MessageSquare,
} from 'lucide-react';
import Swal from 'sweetalert2';
import type { ReportResponse, Platform } from './types';
import { post, post2 } from '@/lib/api';

import EmailEditor from '@/components/ui/EmailEditor';
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

import {
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
import { CaretDown, CaretDownIcon, CaretUp, CaretUpIcon } from '@phosphor-icons/react';
import { Checkbox } from '@/components/ui/checkbox';

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
  connectedProfiles?: InfluencerReport[];
  onPlatformChange?: (profile: InfluencerReport) => void;
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

type BrandCampaignImage = {
  name?: string;
  type?: string;
  size?: number;
  dataUrl?: string;
};

type BrandCampaignItem = {
  campaignId: string;
  campaignTitle: string;
  status?: string;
  productImages?: BrandCampaignImage[];
};

type GetByBrandCampaignResp = {
  success: boolean;
  data?: {
    items?: BrandCampaignItem[];
    page?: number;
    limit?: number;
    total?: number;
  };
  message?: string;
};

type CampaignInvitationTemplatePreviewResp = {
  status: 'success' | 'error';
  message?: string;
  mode?: string;
  campaignCount?: number;
  fromEmail?: string | null;
  toEmail?: string | null;
  missingEmailId?: string | null;
  campaigns?: Array<{
    _id: string;
    campaignTitle: string;
  }>;
  missingCampaignIds?: string[];
  placeholders?: Record<string, string>;
  template?: {
    subject?: string;
    htmlBody?: string;
    textBody?: string;
  };
};

type EmailDraftState = {
  campaignIds: string[];
  fromEmail: string;
  fromName: string;
  toLabel: string;
  subject: string;
  initialBody: string;
  initialHtmlBody: string;
};

type CampaignInvitePickerProps = {
  open: boolean;
  onClose: () => void;
  allItems: BrandCampaignItem[];
  items: BrandCampaignItem[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  sending: boolean;
  onSend: (ids: string[]) => Promise<void> | void;
};

type ResolvedTemplateDraft = {
  subject: string;
  textBody: string;
  htmlBody: string;
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
    bio: root?.bio ?? profileRoot?.bio ?? root?.description ?? profileRoot?.description,
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

async function copyWithFallback(text: string) {
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  const canUseClipboardApi =
    typeof navigator !== 'undefined' &&
    !!navigator.clipboard &&
    (window.isSecureContext || isLocalhost);

  if (canUseClipboardApi) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.left = '0';
  ta.style.opacity = '0';
  ta.style.pointerEvents = 'none';

  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, ta.value.length);

  const copied = document.execCommand('copy');
  document.body.removeChild(ta);

  if (!copied) {
    throw new Error('Fallback copy failed');
  }
}

function getCampaignPrimaryImage(item: BrandCampaignItem): string {
  const first = Array.isArray(item?.productImages) ? item.productImages[0] : null;
  return String(first?.dataUrl ?? '').trim();
}

function getCampaignInitials(title: string): string {
  const safe = String(title || '').trim();
  if (!safe) return 'C';

  const parts = safe.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

function getFromNameFromEmail(email?: string | null): string {
  const local = String(email || '').split('@')[0] || '';
  const spaced = local.replace(/[._-]+/g, ' ').trim();
  if (!spaced) return 'CollabGlam';

  return spaced
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function escapeHtmlValue(value: string) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSubjectLine(text: string) {
  const match = String(text || '').match(/^\s*Subject:\s*(.+)$/m);
  return match?.[1]?.trim() || '';
}

function stripSubjectLine(text: string) {
  return String(text || '')
    .replace(/^\s*Subject:\s*.+(?:\r?\n)+/i, '')
    .trim();
}

function extractGreetingName(text: string) {
  const match = String(text || '').match(/^\s*Dear\s+(.+?),\s*$/m);
  return match?.[1]?.trim() || '';
}

function extractLineValue(text: string, label: string) {
  const lines = String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const prefix = `${label.toLowerCase()}:`;
  const found = lines.find((line) => line.toLowerCase().startsWith(prefix));
  if (!found) return '';

  return found.slice(found.indexOf(':') + 1).trim();
}

function extractBrandFromSubject(text: string) {
  const subject = extractSubjectLine(text);
  const match = subject.match(/-\s*(.+)$/);
  return match?.[1]?.trim() || '';
}

function hasUnresolvedTemplateTokens(value: string) {
  return /\{\{[^}]+\}\}|\$\s*\{[^}]+\}|escapeHtml\(/i.test(String(value || ''));
}

function plainTextToHtml(text: string) {
  return escapeHtmlValue(text).replace(/\n/g, '<br />');
}

function replaceTemplateTokens(
  input: string,
  values: Record<string, string>,
  placeholders?: Record<string, string>
) {
  let output = String(input || '');
  if (!output) return '';

  output = output.replace(/\$\s*\n\s*\{/g, '${');

  if (placeholders) {
    Object.entries(placeholders).forEach(([key, token]) => {
      const replacement = values[key] ?? '';
      if (token) {
        output = output.replace(new RegExp(escapeRegExp(token), 'gi'), replacement);
      }
    });
  }

  const aliasPatterns: Array<[string, string]> = [
    ['campaign\\s*name', values.campaignTitle || values.campaignName || ''],
    ['brand\\s*name', values.brandName || ''],
    ['influencer\\s*name', values.influencerName || ''],
    ['campaign\\s*objective', values.campaignObjective || ''],
    ['deliverables', values.deliverables || ''],
    ['compensation', values.compensation || ''],
    ['timeline', values.timeline || ''],
    ['campaign\\s*link', values.campaignLink || ''],
    ['additional\\s*notes', values.additionalNotes || ''],
  ];

  aliasPatterns.forEach(([pattern, replacement]) => {
    output = output.replace(
      new RegExp(`\\{\\{\\s*${pattern}\\s*\\}\\}`, 'gi'),
      replacement
    );
  });

  output = output.replace(
    /\$\{\s*escapeHtml\(\s*([a-zA-Z0-9_]+)\s*\)\s*\}/g,
    (_, key: string) => values[key] ?? ''
  );

  output = output.replace(
    /\$\{\s*([a-zA-Z0-9_]+)\s*\}/g,
    (_, key: string) => values[key] ?? ''
  );

  return output;
}

function cleanupTemplateHtml(input: string) {
  return String(input || '')
    .replace(/borderradius/gi, 'border-radius')
    .replace(/fontweight/gi, 'font-weight')
    .replace(/textalign/gi, 'text-align')
    .replace(/font-size:\s*23\s*16px/gi, 'font-size:16px')
    .replace(/\$\s*\n\s*\{/g, '${')
    .trim();
}

function buildResolvedTemplateDraft(
  previewResp: CampaignInvitationTemplatePreviewResp,
  fallbackDisplayName: string,
  fallbackDisplayHandle: string,
  fallbackFromName: string
): ResolvedTemplateDraft {
  const rawSubject = String(previewResp.template?.subject || '');
  const rawTextBody = String(previewResp.template?.textBody || '');
  const rawHtmlBody = String(previewResp.template?.htmlBody || '');

  const campaignTitle = String(
    previewResp.campaigns?.[0]?.campaignTitle ||
    extractLineValue(rawTextBody, 'Campaign Name') ||
    ''
  ).trim();

  const brandName = String(
    extractLineValue(rawTextBody, 'Brand') ||
    extractBrandFromSubject(rawTextBody) ||
    fallbackFromName ||
    'CollabGlam'
  ).trim();

  const influencerName = String(
    extractGreetingName(rawTextBody) ||
    fallbackDisplayName ||
    fallbackDisplayHandle.replace(/^@/, '') ||
    'Creator'
  ).trim();

  const plainValues: Record<string, string> = {
    campaignTitle,
    campaignName: campaignTitle,
    brandName,
    influencerName,
    campaignObjective: extractLineValue(rawTextBody, 'Objective'),
    deliverables: extractLineValue(rawTextBody, 'Deliverables Required'),
    compensation: extractLineValue(rawTextBody, 'Compensation'),
    timeline: extractLineValue(rawTextBody, 'Campaign Timeline'),
    campaignLink: extractLineValue(rawTextBody, 'View Campaign') || '#',
    additionalNotes: extractLineValue(rawTextBody, 'Additional Notes'),
  };

  const htmlValues = Object.fromEntries(
    Object.entries(plainValues).map(([key, value]) => [key, escapeHtmlValue(value)])
  ) as Record<string, string>;

  let resolvedSubject = replaceTemplateTokens(
    rawSubject,
    plainValues,
    previewResp.placeholders || {}
  );

  if (!resolvedSubject || hasUnresolvedTemplateTokens(resolvedSubject)) {
    resolvedSubject = extractSubjectLine(rawTextBody) || resolvedSubject;
  }

  resolvedSubject = resolvedSubject
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  let resolvedTextBody = replaceTemplateTokens(
    rawTextBody,
    plainValues,
    previewResp.placeholders || {}
  );

  resolvedTextBody = stripSubjectLine(resolvedTextBody)
    .replace(/\r/g, '')
    .trim();

  let resolvedHtmlBody = cleanupTemplateHtml(
    replaceTemplateTokens(
      rawHtmlBody,
      htmlValues,
      previewResp.placeholders || {}
    )
  );

  if (!resolvedHtmlBody || hasUnresolvedTemplateTokens(resolvedHtmlBody)) {
    resolvedHtmlBody = plainTextToHtml(resolvedTextBody);
  }

  return {
    subject: resolvedSubject,
    textBody: resolvedTextBody,
    htmlBody: resolvedHtmlBody,
  };
}

function CampaignInvitePicker({
  open,
  onClose,
  allItems,
  items,
  selectedIds,
  onSelectedIdsChange,
  search,
  onSearchChange,
  loading,
  sending,
  onSend,
}: CampaignInvitePickerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const itemMap = useMemo(() => {
    return new Map(allItems.map((item) => [item.campaignId, item]));
  }, [allItems]);

  const selectedItems = useMemo(() => {
    return selectedIds
      .map((id) => itemMap.get(id))
      .filter(Boolean) as BrandCampaignItem[];
  }, [selectedIds, itemMap]);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      className="absolute right-0 top-[calc(100%+12px)] z-[140] w-[min(460px,calc(100vw-32px))] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
    >
      <div className="max-h-[320px] overflow-y-auto px-3 py-3">
        {loading ? (
          <div className="py-6 text-center text-[13px] text-gray-400">
            Loading active campaigns…
          </div>
        ) : items.length ? (
          <div className="space-y-1">
            {items.map((item) => {
              const checked = selectedIds.includes(item.campaignId);
              const imageSrc = getCampaignPrimaryImage(item);

              return (
                <button
                  key={item.campaignId}
                  type="button"
                  onClick={() => {
                    onSelectedIdsChange(checked ? [] : [item.campaignId]);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${checked
                    ? 'border border-gray-300 bg-gray-50'
                    : 'border border-transparent hover:bg-gray-50'
                    }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => {
                      onSelectedIdsChange(checked ? [] : [item.campaignId]);
                    }}
                    onClick={(event) => event.stopPropagation()}
                  />

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-gray-100">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={item.campaignTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[13px] font-semibold text-gray-600">
                        {getCampaignInitials(item.campaignTitle)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-gray-900">
                      {item.campaignTitle}
                    </div>
                    <div className="mt-0.5 text-[11px] capitalize text-gray-400">
                      {item.status || 'active'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 p-4 text-[13px] text-gray-400">
            {allItems.length
              ? 'No campaigns matched your search.'
              : 'No active campaigns found for this brand.'}
          </div>
        )}
      </div>

      {/* <div className="border-t border-gray-100 bg-white px-4 py-4">
        <div className="mb-2 text-xs text-gray-500">
          {selectedIds.length
            ? `${selectedIds.length} campaign${selectedIds.length > 1 ? 's' : ''} selected`
            : 'Select at least one campaign to continue.'}
        </div>

        <button
          type="button"
          disabled={!selectedIds.length || sending || loading}
          onClick={() => void onSend(selectedIds)}
          className={`w-full rounded-xl px-4 py-3 text-sm font-medium text-white ${!selectedIds.length || sending || loading
            ? 'cursor-not-allowed bg-gray-300'
            : 'bg-black hover:opacity-90'
            }`}
        >
          {sending
            ? 'Sending…'
            : `Send Invitation${selectedIds.length > 1 ? 's' : ''}`}
        </button>
      </div> */}
    </div>
  );
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
    connectedProfiles = [],
    onPlatformChange,
  }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const campaignId = searchParams?.get('campaignId') || '';
    const [hasAnyEmail, setHasAnyEmail] = useState<boolean | null>(null);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [sendingInvite, setSendingInvite] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(
      lastFetchedAt || null
    );
    const [plan, setPlan] = useState<SubscriptionPlan>('pro');
    const [role, setRole] = useState<UserRole>('viewer');

    const [campaignPickerOpen, setCampaignPickerOpen] = useState(false);
    const [campaignsLoading, setCampaignsLoading] = useState(false);
    const [brandCampaigns, setBrandCampaigns] = useState<BrandCampaignItem[]>([]);
    const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>(
      campaignId ? [campaignId] : []
    );
    const [campaignSearch, setCampaignSearch] = useState('');

    const [emailEditorOpen, setEmailEditorOpen] = useState(false);
    const [emailDraft, setEmailDraft] = useState<EmailDraftState | null>(null);

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

    useEffect(() => {
      setSelectedCampaignIds(campaignId ? [campaignId] : []);
    }, [campaignId]);

    useEffect(() => {
      if (!campaignPickerOpen) {
        setCampaignSearch('');
      }
    }, [campaignPickerOpen]);


    useEffect(() => {
      if (!open) {
        setHasAnyEmail(null);
        return;
      }

      const normalizedPlatform = (platform ?? '').toLowerCase() as Platform;
      if (
        !normalizedPlatform ||
        !['youtube', 'instagram', 'tiktok'].includes(normalizedPlatform)
      ) {
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
          if (!cancelled) {
            setHasAnyEmail(!!email);
          }
        } catch (err) {
          console.error('Failed to pre-check email status', err);
          if (!cancelled) {
            setHasAnyEmail(null);
          }
        } finally {
          if (!cancelled) {
            setCheckingEmail(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [open, handle, platform]);

    const formattedLastUpdated = lastUpdatedAt
      ? new Date(lastUpdatedAt).toLocaleString()
      : 'Not fetched yet';

    const primaryReport = useMemo(
      () => buildPrimaryReport(data, raw, platform, handle),
      [data, raw, platform, handle]
    );

    const availableProfiles = useMemo<InfluencerReport[]>(() => {
      if (connectedProfiles.length) return connectedProfiles;
      return primaryReport ? [primaryReport] : [];
    }, [connectedProfiles, primaryReport]);

    const currentPlatformProfile = useMemo<InfluencerReport | null>(() => {
      if (!availableProfiles.length) return primaryReport;

      const normalized = String(platform ?? '').toLowerCase();

      return (
        availableProfiles.find(
          (item) => String(item?.provider ?? '').toLowerCase() === normalized
        ) ??
        primaryReport ??
        availableProfiles[0] ??
        null
      );
    }, [availableProfiles, platform, primaryReport]);

    const panelMediaKit = useMemo<MediaKit | null>(() => {
      if (!currentPlatformProfile) return null;

      const profileRoot =
        (raw?.profile as any) ??
        (data?.profile as any) ??
        raw ??
        {};

      const contactList =
        profileRoot?.contact ??
        profileRoot?.contacts ??
        (currentPlatformProfile as any)?.contact ??
        (currentPlatformProfile as any)?.contacts ??
        [];

      return {
        name: currentPlatformProfile.name,
        country: currentPlatformProfile.country,
        influencerReports: availableProfiles,
        socialProfiles: availableProfiles,
        primaryInfluencerReport: currentPlatformProfile,

        // Admin-only fields consumed by ContactManagementCard
        contact: contactList,
        contacts: contactList,
        email:
          profileRoot?.email ??
          profileRoot?.contactEmail ??
          (currentPlatformProfile as any)?.email ??
          (currentPlatformProfile as any)?.contactEmail,
        phone:
          profileRoot?.phone ??
          profileRoot?.contactPhone ??
          (currentPlatformProfile as any)?.phone ??
          (currentPlatformProfile as any)?.contactPhone,
      } as MediaKit & {
        contact?: any[];
        contacts?: any[];
        email?: string;
        phone?: string;
      };
    }, [availableProfiles, currentPlatformProfile, raw, data]);

    const handlePlatformSelect = (profile: InfluencerReport) => {
      onPlatformChange?.(profile);
    };

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

    const {
      organicTrend,
      sponsoredTrend,
      trendLabels,
      secondaryTrendLabel,
    } = useMemo(() => {
      if (statHistorySource.length) {
        const labels = statHistorySource.map(
          (item: Record<string, any>, index: number) =>
            parseMonthLabel(String(item?.month ?? ""), index)
        );

        const likesTrend = statHistorySource.map((item: Record<string, any>) =>
          toNumber(item?.avgLikes ?? item?.likes ?? item?.engagements)
        );

        const hasFollowersHistory = statHistorySource.some(
          (item: Record<string, any>) => item?.followers !== undefined && item?.followers !== null
        );

        const volumeTrend = statHistorySource.map((item: Record<string, any>) =>
          toNumber(
            hasFollowersHistory
              ? item?.followers
              : item?.avgViews ?? item?.views ?? item?.avgReelsPlays
          )
        );

        return {
          organicTrend: likesTrend,
          sponsoredTrend: volumeTrend,
          trendLabels: labels,
          secondaryTrendLabel: hasFollowersHistory ? "Followers" : "Avg Views",
        };
      }

      const fallbackPosts = recentPosts.slice(0, 12);
      const fallbackLabels = fallbackPosts.map((post, index) =>
        parseMonthLabel(
          String(post?.createdAt ?? post?.publishedAt ?? post?.date ?? ""),
          index
        )
      );

      return {
        organicTrend: fallbackPosts.map((post) => toNumber(post?.likes)),
        sponsoredTrend: fallbackPosts.map((post) =>
          toNumber(post?.views ?? post?.plays ?? post?.likes)
        ),
        trendLabels: fallbackLabels.length ? fallbackLabels : undefined,
        secondaryTrendLabel: "Views",
      };
    }, [statHistorySource, recentPosts]);

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

    const filteredCampaigns = useMemo(() => {
      const query = campaignSearch.trim().toLowerCase();
      if (!query) return brandCampaigns;

      return brandCampaigns.filter((item) =>
        String(item?.campaignTitle || '').toLowerCase().includes(query)
      );
    }, [brandCampaigns, campaignSearch]);
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
        if (isEmailStatusSuccess(statusResp) && statusResp.status === 1 && statusResp.email) {
          emailFromStatus = statusResp.email;
        }
      } else {
        console.error('Error calling /email/status:', statusResult.reason);
      }

      if (adminResult.status === 'fulfilled') {
        const adminResp = adminResult.value;
        if (typeof adminResp.status === 'number' && adminResp.status === 1 && adminResp.email) {
          emailFromAdmin = adminResp.email;
        }
      } else {
        console.error('Error calling /admin/checkstatus:', adminResult.reason);
      }

      if (emailFromStatus && emailFromAdmin && emailFromStatus === emailFromAdmin) {
        return { email: emailFromStatus, source: 'both' };
      }

      if (emailFromStatus) {
        return { email: emailFromStatus, source: 'status' };
      }

      if (emailFromAdmin) {
        return { email: emailFromAdmin, source: 'admin' };
      }

      return { email: null, source: 'none' };
    };
    if (!open) return null;

    const hasUserId = Boolean((data?.profile as any)?.userId || currentPlatformProfile?.modashId);
    const canAct = hasUserId && !loading && !sendingInvite && !refreshing && !checkingEmail;
    const effectiveHasEmail =
      hasAnyEmail !== null ? hasAnyEmail : emailExists === true;

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

    const finalizeCampaignInvitations = async (chosenCampaignIds?: string[]) => {
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

      const campaignIds = Array.isArray(chosenCampaignIds)
        ? chosenCampaignIds.filter(Boolean)
        : [];

      if (!campaignIds.length) {
        await Swal.fire(
          'Select campaign',
          'Please select at least one active campaign.',
          'warning'
        );
        return;
      }

      try {
        setSendingInvite(true);

        const missingResult = await Promise.allSettled([
          post2<CreateMissingResp>('/missing/create', {
            handle: safeHandle,
            platform: normalizedPlatform,
            brandId,
          }),
        ]);

        if (missingResult[0].status !== 'fulfilled') {
          console.error('Missing/create failed', missingResult[0].reason);
        }

        const invitationResults = await Promise.allSettled(
          campaignIds.map((campaignIdItem) =>
            post<InvitationCreateResp>('/newinvitations/create', {
              handle: safeHandle,
              platform: normalizedPlatform,
              brandId,
              status: 'invited',
              campaignId: campaignIdItem,
            })
          )
        );

        let savedCount = 0;
        let existsCount = 0;

        invitationResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            const resp = result.value;
            if (resp?.status === 'saved') savedCount += 1;
            else if (resp?.status === 'exists') existsCount += 1;
          } else {
            console.error('Invitation/create failed', result.reason);
          }
        });

        if (!savedCount && !existsCount) {
          await Swal.fire(
            'Something went wrong',
            'We couldn’t send the invitation. Please try again in a moment.',
            'error'
          );
          return;
        }

        setCampaignPickerOpen(false);
        setEmailEditorOpen(false);

        if (savedCount > 0 && existsCount === 0) {
          await Swal.fire(
            'Invitation sent',
            `We’ve sent invitations for ${savedCount} campaign${savedCount > 1 ? 's' : ''}.`,
            'success'
          );
        } else if (savedCount === 0 && existsCount > 0) {
          await Swal.fire(
            'Already invited',
            `This creator was already invited for ${existsCount} campaign${existsCount > 1 ? 's' : ''}.`,
            'info'
          );
        } else {
          await Swal.fire(
            'Invitations processed',
            `${savedCount} new invitation${savedCount > 1 ? 's' : ''} sent, ${existsCount} already existed.`,
            'success'
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

    const handleTemplatePreview = async (chosenCampaignIds?: string[]) => {
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
          'Invalid or missing handle to preview invitation.',
          'warning'
        );
        return;
      }

      const campaignIds = Array.isArray(chosenCampaignIds)
        ? chosenCampaignIds.filter(Boolean)
        : [];

      if (!campaignIds.length) {
        await Swal.fire(
          'Select campaign',
          'Please select at least one active campaign.',
          'warning'
        );
        return;
      }

      try {
        setSendingInvite(true);

        const previewResp = await post<CampaignInvitationTemplatePreviewResp>(
          '/campaign-invitation/template-preview',
          {
            brandId,
            campaignIds,
            platform: normalizedPlatform,
            handle: safeHandle,
          }
        );

        if (!previewResp || previewResp.status !== 'success') {
          await Swal.fire(
            'Preview unavailable',
            previewResp?.message || 'Could not generate the invitation preview.',
            'error'
          );
          return;
        }

        const fromEmail = String(previewResp.fromEmail || '').trim();
        const fromName = getFromNameFromEmail(fromEmail);
        const resolvedDraft = buildResolvedTemplateDraft(
          previewResp,
          displayName,
          displayHandle || safeHandle,
          fromName
        );

        const nextDraft: EmailDraftState = {
          campaignIds,
          fromEmail,
          fromName,
          toLabel: String(previewResp.toEmail || displayHandle || safeHandle).trim(),
          subject: resolvedDraft.subject,
          initialBody: resolvedDraft.textBody,
          initialHtmlBody: resolvedDraft.htmlBody,
        };

        setEmailDraft(nextDraft);
        setCampaignPickerOpen(false);
        setEmailEditorOpen(true);
      } catch (err: any) {
        console.error('Template preview failed', err);
        await Swal.fire(
          'Preview unavailable',
          err?.response?.data?.message ||
          err?.message ||
          'Could not generate the invitation preview.',
          'error'
        );
      } finally {
        setSendingInvite(false);
      }
    };

    const handleCampaignPickerToggle = async (e: React.MouseEvent) => {
      e.preventDefault();

      if (loading || campaignsLoading) return;

      if (campaignPickerOpen) {
        setCampaignPickerOpen(false);
        return;
      }

      if (!brandId) {
        await Swal.fire(
          'Missing brand',
          'Missing brandId. Please provide brandId to DetailPanel.',
          'warning'
        );
        return;
      }

      try {
        setCampaignsLoading(true);

        const resp = await post<GetByBrandCampaignResp>('/campaign/get-by-brand', {
          brandId,
          page: 1,
          limit: 20,
          status: 'active',
        });

        const items = Array.isArray(resp?.data?.items) ? resp.data.items : [];

        setBrandCampaigns(items);
        setSelectedCampaignIds((prev) => {
          if (campaignId) return [campaignId];

          const stillValid = prev.filter((id) =>
            items.some((item) => item.campaignId === id)
          );

          return stillValid;
        });

        setCampaignPickerOpen(true);
      } catch (err: any) {
        console.error('Failed to fetch brand campaigns', err);
        await Swal.fire(
          'Campaigns unavailable',
          err?.response?.data?.message ||
          err?.message ||
          'Could not load active campaigns for this brand.',
          'error'
        );
      } finally {
        setCampaignsLoading(false);
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
      if (
        !normalizedPlatform ||
        !['youtube', 'instagram', 'tiktok'].includes(normalizedPlatform)
      ) {
        await Swal.fire(
          'Unsupported platform',
          'Unsupported or missing platform.',
          'warning'
        );
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

        const successTitle = resp.isExistingInfluencer
          ? 'Message sent'
          : 'Invitation sent';

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
      if (
        !normalizedPlatform ||
        !['youtube', 'instagram', 'tiktok'].includes(normalizedPlatform)
      ) {
        await Swal.fire(
          'Unsupported platform',
          'Unsupported or missing platform.',
          'warning'
        );
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

        if (missingResult.status === 'fulfilled') {
          console.log('Missing/create result', missingResult.value);
        } else {
          console.error('Missing/create failed', missingResult.reason);
        }

        let invitationStatus: InvitationCreateResp['status'] | 'error' = 'error';

        if (invitationResult.status === 'fulfilled') {
          const resp = invitationResult.value;
          if (resp?.status === 'saved' || resp?.status === 'exists') {
            invitationStatus = resp.status;
          } else {
            invitationStatus = 'error';
          }
        } else {
          console.error('Invitation/create failed', invitationResult.reason);
          invitationStatus = 'error';
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
        const selectedReport = currentPlatformProfile ?? primaryReport ?? null;
        const reportAny = (selectedReport as any) ?? {};
        const profileRoot = (data?.profile as any) ?? raw?.profile ?? raw ?? {};

        const userId = String(
          reportAny?.modashId ||
          reportAny?._id ||
          profileRoot?.userId ||
          profileRoot?.modashId ||
          ''
        ).trim();

        const selectedPlatform = normalizePlatform(
          (platform ?? (reportAny?.provider as Platform | null)) as Platform | null
        );

        const rawHandle = String(
          reportAny?.handle ||
          reportAny?.username ||
          handle ||
          profileRoot?.handle ||
          profileRoot?.username ||
          ''
        ).trim();

        const normalizedHandle = rawHandle
          ? rawHandle.startsWith('@')
            ? rawHandle
            : `@${rawHandle}`
          : '';

        if (!userId) {
          await Swal.fire({
            icon: 'warning',
            title: 'Missing user ID',
            text: 'Could not generate media kit link because userId was not found.',
          });
          return;
        }

        const mediaKitUrl =
          `${window.location.origin}/mediakit/${encodeURIComponent(userId)}` +
          `?platform=${encodeURIComponent(selectedPlatform)}`;

        await copyWithFallback(mediaKitUrl);

        await Swal.fire({
          icon: 'success',
          title: 'Copied',
          text: 'Media kit link copied to clipboard.',
          timer: 1600,
          showConfirmButton: false,
        });

        try {
          await post('/modash/creator', {
            userId,
            username:
              reportAny?.username ||
              String(normalizedHandle || '').replace(/^@/, '') ||
              '',
            handle:
              normalizedHandle ||
              reportAny?.handle ||
              reportAny?.username ||
              '',
            fullname:
              reportAny?.fullname ||
              reportAny?.name ||
              profileRoot?.fullname ||
              profileRoot?.fullName ||
              profileRoot?.name ||
              '',
            followers: Number(
              reportAny?.followers ??
              reportAny?.stats?.followers?.value ??
              profileRoot?.followers ??
              profileRoot?.followerCount ??
              0
            ),
            engagementRate: Number(
              reportAny?.engagementRate ??
              profileRoot?.engagementRate ??
              0
            ),
            engagements: Number(
              reportAny?.engagements ??
              profileRoot?.engagements ??
              profileRoot?.stats?.engagements ??
              0
            ),
            averageViews: Number(
              reportAny?.avgViews ??
              reportAny?.averageViews ??
              reportAny?.stats?.avgViews?.value ??
              profileRoot?.averageViews ??
              profileRoot?.avgViews ??
              profileRoot?.stats?.avgViews?.value ??
              0
            ),
            picture:
              reportAny?.picture ||
              profileRoot?.picture ||
              profileRoot?.avatar ||
              profileRoot?.profilePicUrl ||
              '',
            url: reportAny?.url || profileRoot?.url || '',
            isVerified: Boolean(reportAny?.isVerified || profileRoot?.isVerified),
            isPrivate: Boolean(reportAny?.isPrivate || profileRoot?.isPrivate),
            platform: selectedPlatform,
            bio:
              reportAny?.bio ||
              profileRoot?.bio ||
              profileRoot?.description ||
              '',
            country:
              reportAny?.country ||
              profileRoot?.country ||
              profileRoot?.location?.country ||
              (typeof profileRoot?.location === 'string' ? profileRoot.location : '') ||
              '',
            location:
              (typeof profileRoot?.location === 'string' ? profileRoot.location : '') ||
              profileRoot?.location?.country ||
              reportAny?.country ||
              profileRoot?.country ||
              '',
            categories: Array.isArray(profileRoot?.categories)
              ? profileRoot.categories
                .map((item: any) =>
                  typeof item === 'string'
                    ? item
                    : item?.categoryName ||
                    item?.subcategoryName ||
                    item?.name ||
                    item?.subcategory ||
                    ''
                )
                .filter(Boolean)
              : [],
            searchType: profileRoot?.searchType || 'standard',
            source: profileRoot?.source || 'standard',
          });
        } catch (apiError) {
          console.error('Failed to post /modash/creator:', apiError);
        }
      } catch (copyError) {
        console.error('Failed to copy media kit link:', copyError);
        await Swal.fire({
          icon: 'error',
          title: 'Copy failed',
          text: 'Unable to copy the media kit link.',
        });
      }
    };

    const handleEditorSend = async (_payload: {
      to: string;
      cc: string;
      bcc: string;
      subject: string;
      body: string;
      htmlBody: string;
      attachments: Array<{
        filename: string;
        contentType: string;
        size: number;
        contentBase64: string;
      }>;
    }) => {
      await finalizeCampaignInvitations(emailDraft?.campaignIds || []);
    };

    const showRefreshButton = Boolean(onRefreshReport);

    return (
      <>
        <div className="fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute right-0 top-0 h-full w-full overflow-y-auto border-l bg-white shadow-2xl md:w-[72vw] xl:w-[64vw] rounded-none md:rounded-l-3xl">
            <div className="sticky top-0 z-10 border-b bg-white/90 px-4 py-3 backdrop-blur">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <button
                    onClick={onClose}
                    className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm transition-colors hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Close
                  </button>

                  {/* <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-gray-900">
                        {displayName}
                      </span>

                      {displayHandle ? (
                        <span className="truncate text-xs text-gray-500">
                          {displayHandle}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {platform ? (
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-700">
                          {platform}
                        </span>
                      ) : null}
                    </div>
                  </div> */}
                </div>

                <div className="flex w-full flex gap-2 lg:w-auto lg:min-w-[220px] lg:items-end">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end ">
                    <div className="flex flex-col lg:items-end">
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">
                        Latest data
                      </span>
                      <span className="text-xs text-gray-700">{formattedLastUpdated}</span>
                    </div>

                    {showRefreshButton ? (
                      <button
                        type="button"
                        onClick={handleRefreshData}
                        disabled={refreshing || loading}
                        className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      >
                        <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing…' : 'Refresh data'}
                      </button>
                    ) : null}
                  </div>

                  {/* CTA row */}
                  <div className="relative flex items-center">
                    <div className="inline-flex overflow-hidden rounded-xl bg-black text-white shadow-sm">
                      <button
                        onClick={(e) => {
                          e.preventDefault();

                          if (selectedCampaignIds.length) {
                            const selectedCampaign = brandCampaigns.find(
                              (item) => item.campaignId === selectedCampaignIds[0]
                            );

                            const proxyEmail =
                              localStorage.getItem('brandProxyEmail') ||
                              localStorage.getItem('proxyEmail') ||
                              localStorage.getItem('fromEmail') ||
                              '';

                            const brandName =
                              localStorage.getItem('brandName') ||
                              'CollabGlam';

                            const campaignTitle = selectedCampaign?.campaignTitle || 'your campaign';

                            const subject = `Invitation to Collaborate - ${brandName}`;

                            const initialBody = `Dear ${displayName || displayHandle || 'Creator'},

I hope you are doing well.

We are reaching out to formally invite you to collaborate with ${brandName} for our upcoming campaign, "${campaignTitle}". Based on your creative work and audience alignment, we believe you would be an excellent fit for this project.

Campaign Details

Campaign Name: ${campaignTitle}
Brand: ${brandName}
Objective:
Deliverables Required:
Compensation:
Campaign Timeline:

To proceed, please review the full brief using the button below.

If you have any questions or need further clarification, feel free to contact the brand or reach out to CollabGlam Support.

We look forward to the opportunity of working together and hope to have you onboard for this campaign.

Warm regards,
Team CollabGlam`;

                            const initialHtmlBody = `
    <p>Dear ${displayName || displayHandle || 'Creator'},</p>
    <p>I hope you are doing well.</p>
    <p>
      We are reaching out to formally invite you to collaborate with <strong>${brandName}</strong>
      for our upcoming campaign, <strong>"${campaignTitle}"</strong>. Based on your creative work and
      audience alignment, we believe you would be an excellent fit for this project.
    </p>
    <h3>Campaign Details</h3>
    <p><strong>Campaign Name:</strong> ${campaignTitle}</p>
    <p><strong>Brand:</strong> ${brandName}</p>
    <p><strong>Objective:</strong></p>
    <p><strong>Deliverables Required:</strong></p>
    <p><strong>Compensation:</strong></p>
    <p><strong>Campaign Timeline:</strong></p>
    <p>To proceed, please review the full brief using the button below.</p>
    <p>
      If you have any questions or need further clarification, feel free to contact the brand
      or reach out to CollabGlam Support.
    </p>
    <p>
      We look forward to the opportunity of working together and hope to have you onboard for this campaign.
    </p>
    <p>Warm regards,<br /><strong>Team CollabGlam</strong></p>
  `;

                            setEmailDraft({
                              campaignIds: selectedCampaignIds,
                              fromEmail: proxyEmail,
                              fromName: brandName,
                              toLabel: displayHandle || handle || '',
                              subject,
                              initialBody,
                              initialHtmlBody,
                            });

                            setCampaignPickerOpen(false);
                            setEmailEditorOpen(true);
                            return;
                          }
                          effectiveHasEmail ? handleMessageNow(e) : handleSendInvitation(e);
                        }}
                        disabled={!canAct}
                        title={ctaTitle}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-opacity ${canAct ? 'hover:opacity-90' : 'cursor-not-allowed opacity-70'
                          }`}
                      >
                        {sendingInvite && brandId ? (
                          <>
                            {effectiveHasEmail ? (
                              <MessageSquare className="h-4 w-4 animate-pulse" />
                            ) : (
                              <Send className="h-4 w-4 animate-pulse" />
                            )}
                            Sending…
                          </>
                        ) : (
                          <>
                            {effectiveHasEmail ? (
                              <MessageSquare className="h-4 w-4" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            Send Invitation
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleCampaignPickerToggle}
                        disabled={campaignsLoading || loading}
                        className="inline-flex w-10 items-center justify-center border-l border-white/20 hover:bg-white/10"
                      >
                        {campaignsLoading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : campaignPickerOpen ? (
                          <CaretUpIcon className="h-4 w-4" />
                        ) : (
                          <CaretDownIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {campaignPickerOpen ? (
                      <CampaignInvitePicker
                        open={campaignPickerOpen}
                        onClose={() => setCampaignPickerOpen(false)}
                        allItems={brandCampaigns}
                        items={filteredCampaigns}
                        selectedIds={selectedCampaignIds}
                        onSelectedIdsChange={setSelectedCampaignIds}
                        search={campaignSearch}
                        onSearchChange={setCampaignSearch}
                        loading={campaignsLoading}
                        sending={sendingInvite}
                        onSend={finalizeCampaignInvitations}
                      />
                    ) : null}
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
                          primaryReport={currentPlatformProfile}
                          mediaKit={panelMediaKit}
                          onCopy={handleCopy}
                          connectedProfiles={availableProfiles}
                          activePlatform={normalizePlatform(platform)}
                          onPlatformSelect={handlePlatformSelect}
                        />
                      ) : null}
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
                          secondaryLabel={secondaryTrendLabel}
                          primaryValue={avgLikes}
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
                        <RecentPostsTable posts={recentPosts.slice(0, 5)} />
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
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <EmailEditor
          open={emailEditorOpen}
          onClose={() => setEmailEditorOpen(false)}
          toLabel={emailDraft?.toLabel || displayHandle || ''}
          fromName={emailDraft?.fromName || 'CollabGlam'}
          fromEmail={emailDraft?.fromEmail || ''}
          toAvatar={primaryReport?.picture || ''}
          subject={emailDraft?.subject || ''}
          initialBody={emailDraft?.initialBody || ''}
          initialHtmlBody={emailDraft?.initialHtmlBody || ''}
          startExpanded
          sending={sendingInvite}
          onSend={handleEditorSend}
        />
      </>
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
      <div className="font-semibold">Something went wrong</div>
      <div>{error}</div>
    </div>
  </div>
);