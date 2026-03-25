'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ExternalLink,
  Filter,
  Info,
  Mail,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import swal from 'sweetalert';
import { post } from '@/lib/api';
import { Checkbox } from '@/components/animate-ui/components/radix/checkbox';

type VideoItem = {
  _id?: string;
  videoId?: string;
  title?: string;
  description?: string;
  publishedAt?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  duration?: string;
  videoUrl?: string | null;
  thumbnails?: {
    default?: { url?: string; width?: number; height?: number };
    medium?: { url?: string; width?: number; height?: number };
    high?: { url?: string; width?: number; height?: number };
  } | null;
};

type InfluencerProfileDoc = {
  _id?: string;
  handleId: string;
  platform?: string;
  handle?: string;
  channelId?: string;

  title?: string;
  country?: string | null;
  defaultLanguage?: string | null;

  subscriberCount?: number | null;
  totalViewCount?: number | null;
  totalVideoCount?: number | null;

  avgViewsLast15?: number | null;
  engagementRateLast15?: number | null;
  uploadFrequencyPerWeek?: number | null;
  avgDaysBetweenUploads?: number | null;

  instagramHandle?: string | null;

  email?: string | null;
  lastSponsor?: string | null;
  managedByAgency?: boolean | null;
  topAudienceCountry?: string | null;
  averageAudienceAge?: number | null;
  lastContactedAt?: string | null;
  followUpDates?: string[];
  workingHandle?: string | null;

  lastUploadAt?: string | null;
  lastVideoId?: string | null;
  lastVideoTitle?: string | null;

  topicLabels?: string[];
  topicCategories?: string[];
  keywords?: string;
  description?: string;

  bannerUrl?: string | null;
  thumbnails?: {
    default?: { url?: string; width?: number; height?: number };
    medium?: { url?: string; width?: number; height?: number };
    high?: { url?: string; width?: number; height?: number };
  } | null;

  rawChannel?: any;
  rawPlaylists?: any[];

  lastVideos?: VideoItem[];
  lastVideosLimit?: number;

  createdAt?: string;
  updatedAt?: string;
  syncedAt?: string;
};

type GetAllResponse = {
  status: string;
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  sortBy?: string;
  data: InfluencerProfileDoc[];
};

type UpdateManualResponse = {
  status: string;
  handleId: string;
  data: InfluencerProfileDoc;
};

type PreviewResponse = {
  status: string;
  mode: 'preview';
  stored: false;
  data: InfluencerProfileDoc;
};

type SaveProfileResponse = {
  status: string;
  mode?: 'handle';
  stored?: true;
  handle?: string;
  handleId: string;
  data: InfluencerProfileDoc;
};

type GlobalSearchVideo = {
  videoId?: string;
  title?: string;
  description?: string;
  publishedAt?: string;
  channelId?: string;
  channelTitle?: string;
  thumbnails?: {
    default?: { url?: string; width?: number; height?: number };
    medium?: { url?: string; width?: number; height?: number };
    high?: { url?: string; width?: number; height?: number };
  } | null;
  viewCount?: number | null;
  likeCount?: number | null;
  commentCount?: number | null;
  videoUrl?: string | null;
};

type GlobalSearchRecommendation = {
  channelId?: string | null;
  title?: string;
  description?: string;
  handle?: string | null;
  customUrl?: string | null;
  country?: string | null;
  thumbnails?: {
    default?: { url?: string; width?: number; height?: number };
    medium?: { url?: string; width?: number; height?: number };
    high?: { url?: string; width?: number; height?: number };
  } | null;
  subscriberCount?: number | null;
  totalViewCount?: number | null;
  totalVideoCount?: number | null;
  topicLabels?: string[];
  bannerUrl?: string | null;
  channelUrl?: string | null;
  matchedByDirectChannelSearch?: boolean;
  matchedVideos?: GlobalSearchVideo[];
  score?: number;
};

type GlobalSearchData = {
  query: string;
  channelsFound: number;
  videoHits: number;
  nextPageToken?: string | null;
  hasMore?: boolean;
  recommendations: GlobalSearchRecommendation[];
};

type GlobalSearchResponse = {
  status: string;
  mode: 'global';
  stored: false;
  query: string;
  data: GlobalSearchData;
};

type SavedSortValue =
  | 'relevance'
  | 'subscribers_desc'
  | 'subscribers_asc'
  | 'avg_views_desc'
  | 'avg_views_asc'
  | 'engagement_desc'
  | 'recent_upload'
  | 'uploads_per_week'
  | 'newest';

type InfluencerFilters = {
  subscriberRange: string;
  countries: string[];
  category: string;
  avgViewsMin: string;
  lastUploadDays: string;
  sortBy: SavedSortValue;
};

const DASH = '--';

type SubscriberRangeOption = {
  value: string;
  label: string;
  min?: number | null;
  max?: number | null;
};

const SUBSCRIBER_RANGES: SubscriberRangeOption[] = [
  { value: '', label: 'All' },
  { value: '1k_10k', label: '1K – 10K', min: 1000, max: 10000 },
  { value: '10k_50k', label: '10K – 50K', min: 10000, max: 50000 },
  { value: '50k_100k', label: '50K – 100K', min: 50000, max: 100000 },
  { value: '100k_500k', label: '100K – 500K', min: 100000, max: 500000 },
  { value: '500k_1m', label: '500K – 1M', min: 500000, max: 1000000 },
  { value: '1m_5m', label: '1M – 5M', min: 1000000, max: 5000000 },
  { value: '5m_10m', label: '5M – 10M', min: 5000000, max: 10000000 },
  { value: '10m_plus', label: '10M+', min: 10000000, max: null },
];

const COUNTRY_OPTIONS: Array<{ code: string; name: string }> = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
];

const CATEGORY_OPTIONS = [
  'Entertainment',
  'Lifestyle',
  'Technology',
  'Gaming',
  'Education',
  'Finance',
  'Business',
  'Food',
  'Travel',
  'Fitness',
  'Health',
  'Beauty',
  'Fashion',
  'Parenting',
  'Comedy',
  'Music',
  'News',
  'Sports',
  'Automotive',
  'Pets',
  'DIY',
  'Vlogging',
  'Podcast',
  'Review',
  'Unboxing',
  'Tutorial',
];

const AVG_VIEWS_OPTIONS = [
  { value: '', label: 'All' },
  { value: '1000', label: '1K+' },
  { value: '5000', label: '5K+' },
  { value: '10000', label: '10K+' },
  { value: '25000', label: '25K+' },
  { value: '50000', label: '50K+' },
  { value: '100000', label: '100K+' },
  { value: '250000', label: '250K+' },
  { value: '500000', label: '500K+' },
  { value: '1000000', label: '1M+' },
];

const LAST_UPLOAD_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '60', label: 'Last 60 days' },
  { value: '90', label: 'Last 90 days' },
];

const SORT_OPTIONS: Array<{ value: SavedSortValue; label: string }> = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'subscribers_desc', label: 'Subscribers (High to Low)' },
  { value: 'subscribers_asc', label: 'Subscribers (Low to High)' },
  { value: 'avg_views_desc', label: 'Average Views (High to Low)' },
  { value: 'avg_views_asc', label: 'Average Views (Low to High)' },
  { value: 'engagement_desc', label: 'Engagement Rate (High to Low)' },
  { value: 'recent_upload', label: 'Recent Upload' },
  { value: 'uploads_per_week', label: 'Uploads per Week' },
  { value: 'newest', label: 'Newest Channels' },
];

function showErr(message: string) {
  return swal({
    title: 'Error',
    text: message || 'Something went wrong.',
    icon: 'error',
  });
}

function normalizeHandle(input: string) {
  const s = (input || '').trim();
  if (!s) return '';
  const m = s.match(/@([A-Za-z0-9._-]+)/);
  if (m?.[1]) return `@${m[1]}`;
  if (/^[A-Za-z0-9._-]+$/.test(s)) return `@${s}`;
  return s.startsWith('@') ? s : `@${s}`;
}

function isValidHandle(h: string) {
  return /^@[A-Za-z0-9._-]+$/.test(h);
}

function getSearchIntent(input: string) {
  const raw = (input || '').trim();
  if (!raw) return { raw: '', isHandle: false, handle: '' };

  const explicitHandle = raw.startsWith('@') || /youtube\.com\/@/i.test(raw);
  if (!explicitHandle) {
    return { raw, isHandle: false, handle: '' };
  }

  const handle = normalizeHandle(raw);
  return {
    raw,
    isHandle: isValidHandle(handle),
    handle: isValidHandle(handle) ? handle : '',
  };
}

function buildSavedSearchText(raw: string) {
  const parsed = getSearchIntent(raw);
  return parsed.isHandle ? parsed.handle : parsed.raw;
}

function formatNumber(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-IN').format(n);
}

function formatPercent(x?: number | null) {
  if (x == null || !Number.isFinite(x)) return '—';
  return `${(x * 100).toFixed(2)}%`;
}

function formatBool(b?: boolean | null) {
  if (b === true) return 'Yes';
  if (b === false) return 'No';
  return 'Unknown';
}

function formatDate(iso?: string | null, timeZone = 'Asia/Kolkata') {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function asList<T>(d: any): T[] {
  return Array.isArray(d) ? d : [];
}

function getCardId(p: InfluencerProfileDoc) {
  return p.handleId || p._id || p.channelId || p.handle || Math.random().toString(36).slice(2);
}

function ytVideoUrl(videoId?: string) {
  if (!videoId) return '';
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function ytChannelUrl(p: InfluencerProfileDoc) {
  if (p.handle) {
    const handle = p.handle.startsWith('@') ? p.handle : `@${p.handle}`;
    return `https://www.youtube.com/${handle}`;
  }
  if (p.channelId) return `https://www.youtube.com/channel/${p.channelId}`;
  return '';
}

function ytChannelUrlFromHandleOrId(handle?: string | null, channelId?: string | null) {
  if (handle) {
    const normalized = handle.startsWith('@') ? handle : `@${handle}`;
    return `https://www.youtube.com/${normalized}`;
  }
  if (channelId) return `https://www.youtube.com/channel/${channelId}`;
  return '';
}

function getThumbUrl(
  thumbnails?:
    | {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
    }
    | null,
) {
  return thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || '';
}

function toDateInputValue(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseFollowUps(text: string) {
  const raw = (text || '')
    .split(/[\n,]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const cleaned: string[] = [];
  for (const d of raw) {
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) cleaned.push(d);
  }
  return Array.from(new Set(cleaned));
}

function topicFromUrl(url: string) {
  try {
    const last = (url || '').split('/').pop() || '';
    return decodeURIComponent(last).replace(/_/g, ' ');
  } catch {
    return url;
  }
}

function cleanTopicLabel(s: string) {
  return String(s || '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .trim();
}

function getTopicNames(p: InfluencerProfileDoc) {
  const labels = asList<string>(p.topicLabels).filter(Boolean).map(cleanTopicLabel);
  if (labels.length) return Array.from(new Set(labels));

  const cats = asList<string>(p.topicCategories).filter(Boolean).map(topicFromUrl).map(cleanTopicLabel);
  return Array.from(new Set(cats));
}

function countryLabel(code: string) {
  const c = COUNTRY_OPTIONS.find((x) => x.code === code);
  return c ? `${c.name} (${c.code})` : code;
}

function chipText(filters: InfluencerFilters) {
  const chips: string[] = [];

  if (filters.subscriberRange) {
    const range = SUBSCRIBER_RANGES.find((x) => x.value === filters.subscriberRange);
    if (range) chips.push(`Subscribers: ${range.label}`);
  }

  if (filters.countries?.length) chips.push(`Country: ${filters.countries.join(', ')}`);
  if (filters.category) chips.push(`Category: ${filters.category}`);

  if (filters.avgViewsMin) {
    const v = AVG_VIEWS_OPTIONS.find((x) => x.value === filters.avgViewsMin);
    if (v) chips.push(`Avg Views: ${v.label}`);
  }

  if (filters.lastUploadDays) {
    const v = LAST_UPLOAD_OPTIONS.find((x) => x.value === filters.lastUploadDays);
    if (v) chips.push(`Last Upload: ${v.label}`);
  }

  const s = SORT_OPTIONS.find((x) => x.value === filters.sortBy);
  if (s) chips.push(`Sort: ${s.label}`);

  return chips;
}

function sortLabel(sortBy: SavedSortValue) {
  const found = SORT_OPTIONS.find((x) => x.value === sortBy);
  return found?.label || 'Relevance';
}

/* -------------------- Multi-country select -------------------- */

function MultiCountrySelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter(
      (c) => c.code.toLowerCase().includes(s) || c.name.toLowerCase().includes(s),
    );
  }, [q]);

  const summary = value?.length ? value.join(', ') : 'All';

  function updatePos() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      left: r.left,
      top: r.bottom + 8,
      width: r.width,
    });
  }

  function toggle(code: string) {
    const next = new Set(value || []);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(Array.from(next).sort());
  }

  useEffect(() => {
    if (!open) return;

    updatePos();

    const onReflow = () => updatePos();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const overlay =
    open && pos && typeof document !== 'undefined'
      ? createPortal(
        <div className="fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/10" onClick={() => setOpen(false)} />

          <div
            className="fixed rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              maxHeight: 'min(70vh, 520px)',
            }}
          >
            <div className="p-3 border-b border-slate-200">
              <input
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search country"
                autoFocus
              />
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-700 hover:underline"
                  onClick={() => onChange([])}
                >
                  Clear
                </button>
                <span className="text-xs text-slate-500">{value.length} selected</span>
              </div>
            </div>

            <div className="max-h-[420px] overflow-auto p-2">
              {filtered.map((c) => {
                const checked = value.includes(c.code);
                return (
                  <label
                    key={c.code}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(c.code)} />
                    <span className="text-sm text-slate-800">{countryLabel(c.code)}</span>
                  </label>
                );
              })}

              {!filtered.length ? (
                <div className="px-2 py-6 text-center text-sm text-slate-500">No countries found</div>
              ) : null}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="w-full px-3 py-3 border border-slate-300 rounded-xl bg-white text-left flex items-center justify-between gap-2 hover:bg-slate-50"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (!v && next) updatePos();
            return next;
          });
        }}
      >
        <span className="text-sm text-slate-800 truncate">{summary}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {overlay}
    </>
  );
}

/* -------------------- Small UI helpers -------------------- */

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-3xl xl:text-4xl font-bold tracking-tight text-slate-900 break-words">
        {value}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-600">{label}:</span>
      <span className={`font-medium text-slate-900 text-right ${mono ? 'font-mono text-xs' : ''}`}>
        {String(value)}
      </span>
    </div>
  );
}

/* -------------------- Global search card -------------------- */

function GlobalSearchCard({
  item,
  savedProfile,
  onOpenSaved,
  onViewDetails,
  loading,
}: {
  item: GlobalSearchRecommendation;
  savedProfile?: InfluencerProfileDoc;
  onOpenSaved: (id: string) => void;
  onViewDetails: (payload: { handle?: string; channelId?: string }) => void;
  loading?: boolean;
}) {
  const thumb = getThumbUrl(item.thumbnails);
  const channelUrl = item.channelUrl || ytChannelUrlFromHandleOrId(item.handle, item.channelId);
  const topics = asList<string>(item.topicLabels).filter(Boolean);
  const matchedVideos = asList<GlobalSearchVideo>(item.matchedVideos).slice(0, 4);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col xl:flex-row xl:items-start gap-5">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 shrink-0 ring-4 ring-slate-100">
              {thumb ? (
                <img
                  src={thumb}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl leading-tight font-bold text-slate-900 truncate">
                  {item.title || item.handle || '—'}
                </h3>

                {item.country ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                    {item.country}
                  </span>
                ) : null}

                {item.matchedByDirectChannelSearch ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                    Channel Match
                  </span>
                ) : null}
              </div>

              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <div className="text-lg font-semibold text-blue-600">
                  {item.handle || 'No public handle'}
                </div>

                {savedProfile?.handleId ? (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                    Already Saved
                  </span>
                ) : null}
              </div>

              {topics.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {topics.slice(0, 5).map((t) => (
                    <span
                      key={t}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {t}
                    </span>
                  ))}
                  {topics.length > 5 ? (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 text-white">
                      +{topics.length - 5} Categories
                    </span>
                  ) : null}
                </div>
              ) : null}

              {item.description ? (
                <p className="mt-4 text-sm leading-6 text-slate-600 line-clamp-3">
                  {item.description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row xl:flex-col gap-2 xl:w-[230px]">
            {savedProfile?.handleId ? (
              <button
                type="button"
                className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                onClick={() => onOpenSaved(savedProfile.handleId)}
              >
                Open Saved Profile
              </button>
            ) : (
              <button
                type="button"
                className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                onClick={() =>
                  onViewDetails({
                    handle: item.handle || undefined,
                    channelId: item.channelId || undefined,
                  })
                }
                disabled={loading}
              >
                View Details
              </button>
            )}

            {channelUrl ? (
              <a
                href={channelUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Channel
              </a>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
          <MetricCard label="Subscribers" value={formatNumber(item.subscriberCount)} />
          <MetricCard label="Total Views" value={formatNumber(item.totalViewCount)} />
          <MetricCard label="Total Videos" value={formatNumber(item.totalVideoCount)} />
          <MetricCard label="Matched Videos" value={String(matchedVideos.length || 0)} />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50/80 p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-4">
          Matched Videos
        </div>

        {!matchedVideos.length ? (
          <div className="text-sm text-slate-500">No matched videos were returned for this creator.</div>
        ) : (
          <div className="space-y-3">
            {matchedVideos.map((video) => {
              const vThumb = getThumbUrl(video.thumbnails);
              const url = video.videoUrl || ytVideoUrl(video.videoId);

              return (
                <a
                  key={video.videoId || `${video.title}-${video.publishedAt}`}
                  href={url || '#'}
                  target={url ? '_blank' : undefined}
                  rel={url ? 'noreferrer' : undefined}
                  className={`block rounded-2xl border border-slate-200 bg-white p-4 transition-all ${url ? 'hover:shadow-md hover:border-blue-300 hover:bg-blue-50/30' : ''
                    }`}
                >
                  <div className="flex gap-4">
                    <div className="w-36 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                      {vThumb ? (
                        <img
                          src={vThumb}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 line-clamp-2">
                            {video.title || 'Untitled video'}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {formatDate(video.publishedAt)} • {formatNumber(video.viewCount)} views
                          </div>
                        </div>

                        {url ? (
                          <div className="shrink-0 text-blue-600">
                            <ExternalLink className="w-4 h-4" />
                          </div>
                        ) : null}
                      </div>

                      {video.description ? (
                        <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                          {video.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------- Preview sidebar -------------------- */

function PreviewSidebar({
  open,
  loading,
  saving,
  data,
  savedProfile,
  onClose,
  onSave,
  onOpenSaved,
}: {
  open: boolean;
  loading: boolean;
  saving: boolean;
  data: InfluencerProfileDoc | null;
  savedProfile?: InfluencerProfileDoc;
  onClose: () => void;
  onSave: () => void;
  onOpenSaved: (handleId: string) => void;
}) {
  if (!open) return null;

  const thumb =
    data?.thumbnails?.high?.url ||
    data?.thumbnails?.medium?.url ||
    data?.thumbnails?.default?.url ||
    '';

  const banner = data?.bannerUrl || '';
  const topics = data ? getTopicNames(data) : [];
  const channelUrl = data ? ytChannelUrl(data) : '';

  return (
    <div className="fixed inset-0 z-[130]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-[820px] bg-white border-l border-slate-200 shadow-2xl flex flex-col">
        <div className="relative border-b border-slate-200">
          {banner ? (
            <div className="h-36 w-full overflow-hidden bg-slate-200">
              <img
                src={banner}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-24 w-full bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
          )}

          <button
            type="button"
            className="absolute right-4 top-4 p-2 rounded-xl bg-white/90 hover:bg-white shadow-sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>

          <div className="px-6 pb-5">
            <div className="-mt-10 flex items-start gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-200 border-4 border-white shadow-md shrink-0">
                {thumb ? (
                  <img
                    src={thumb}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1 pt-12">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl font-bold text-slate-900 truncate">
                    {data?.title || data?.handle || '—'}
                  </h3>

                  {data?.country ? (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                      {data.country}
                    </span>
                  ) : null}

                  {savedProfile?.handleId ? (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                      Already Saved
                    </span>
                  ) : null}
                </div>

                <div className="mt-1 text-base font-semibold text-blue-600">
                  {data?.handle || '—'}
                </div>

                {topics.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topics.slice(0, 6).map((t) => (
                      <span
                        key={t}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/70">
          {loading || !data ? (
            <div className="px-6 py-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
              Loading creator details...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard label="Subscribers" value={formatNumber(data.subscriberCount)} />
                <MetricCard label="Avg Views" value={formatNumber(data.avgViewsLast15)} />
                <MetricCard label="Engagement" value={formatPercent(data.engagementRateLast15)} />
                <MetricCard
                  label="Uploads / Week"
                  value={
                    data.uploadFrequencyPerWeek != null
                      ? String(data.uploadFrequencyPerWeek)
                      : '—'
                  }
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-4">
                    Channel Overview
                  </div>

                  <div className="space-y-3">
                    <Row label="Handle" value={data.handle || '—'} />
                    <Row label="Channel ID" value={data.channelId || '—'} mono />
                    <Row label="Country" value={data.country || '—'} />
                    <Row label="Language" value={data.defaultLanguage || '—'} />
                    <Row label="Instagram" value={data.instagramHandle || '—'} />
                    <Row label="Total Views" value={formatNumber(data.totalViewCount)} />
                    <Row label="Total Videos" value={formatNumber(data.totalVideoCount)} />
                    <Row label="Last Upload" value={formatDate(data.lastUploadAt)} />
                    <Row label="Last Video" value={data.lastVideoTitle || '—'} />
                  </div>

                  {channelUrl ? (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <a
                        href={channelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open channel
                      </a>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-4">
                    About Creator
                  </div>

                  <p className="text-sm leading-6 text-slate-600 whitespace-pre-line">
                    {data.description || '—'}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-white">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Latest Videos
                  </div>
                </div>

                <div className="p-5 bg-slate-50/50">
                  {!data.lastVideos?.length ? (
                    <div className="text-sm text-slate-500">No recent videos found.</div>
                  ) : (
                    <div className="space-y-4">
                      {data.lastVideos.slice(0, 8).map((video) => {
                        const vThumb = getThumbUrl(video.thumbnails);
                        const videoUrl = video.videoUrl || (video.videoId ? ytVideoUrl(video.videoId) : '');

                        return (
                          <a
                            key={video.videoId || video.title}
                            href={videoUrl || '#'}
                            target={videoUrl ? '_blank' : undefined}
                            rel={videoUrl ? 'noreferrer' : undefined}
                            className={`block rounded-2xl border border-slate-200 bg-white p-4 transition-all ${videoUrl
                              ? 'hover:shadow-md hover:border-blue-300 hover:bg-blue-50/30'
                              : ''
                              }`}
                          >
                            <div className="flex gap-4">
                              <div className="w-40 h-24 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                                {vThumb ? (
                                  <img
                                    src={vThumb}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                                    No image
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-slate-900 line-clamp-2">
                                      {video.title || 'Untitled video'}
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                                      <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
                                        {formatDate(video.publishedAt)}
                                      </span>
                                      <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
                                        {formatNumber(video.viewCount)} views
                                      </span>
                                      <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
                                        {formatNumber(video.likeCount)} likes
                                      </span>
                                      <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
                                        {formatNumber(video.commentCount)} comments
                                      </span>
                                      {video.duration ? (
                                        <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
                                          {video.duration}
                                        </span>
                                      ) : null}
                                    </div>

                                    {video.description ? (
                                      <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                                        {video.description}
                                      </p>
                                    ) : null}
                                  </div>

                                  {videoUrl ? (
                                    <div className="shrink-0 text-blue-600">
                                      <ExternalLink className="w-4 h-4" />
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          {savedProfile?.handleId ? (
            <button
              type="button"
              className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold"
              onClick={() => onOpenSaved(savedProfile.handleId)}
            >
              Open Saved Profile
            </button>
          ) : (
            <button
              type="button"
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 shadow-sm"
              onClick={onSave}
              disabled={loading || saving || !data}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          )}

          <button
            type="button"
            className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Main page -------------------- */

export default function Page() {
  const [profiles, setProfiles] = useState<InfluencerProfileDoc[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const [query, setQuery] = useState('');
  const [searchHint, setSearchHint] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  const [globalResult, setGlobalResult] = useState<GlobalSearchData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSaving, setPreviewSaving] = useState(false);
  const [previewData, setPreviewData] = useState<InfluencerProfileDoc | null>(null);
  const [globalVisibleCount, setGlobalVisibleCount] = useState(10);
  const [globalNextPageToken, setGlobalNextPageToken] = useState<string | null>(null);
  const [globalHasMore, setGlobalHasMore] = useState(false);
  const [globalLoadingMore, setGlobalLoadingMore] = useState(false);

  const [filtersDraft, setFiltersDraft] = useState<InfluencerFilters>({
    subscriberRange: '',
    countries: [],
    category: '',
    avgViewsMin: '',
    lastUploadDays: '',
    sortBy: 'relevance',
  });

  const [filtersActive, setFiltersActive] = useState<InfluencerFilters>({
    subscriberRange: '',
    countries: [],
    category: '',
    avgViewsMin: '',
    lastUploadDays: '',
    sortBy: 'relevance',
  });

  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsHandleId, setDetailsHandleId] = useState('');
  const [detailsSaving, setDetailsSaving] = useState(false);

  const [detailsForm, setDetailsForm] = useState({
    email: '',
    lastSponsor: '',
    managedByAgency: 'unknown' as 'unknown' | 'yes' | 'no',
    topAudienceCountry: '',
    averageAudienceAge: '',
    lastContactedAt: '',
    followUpDates: '',
    workingHandle: '',
  });

  const profilesByHandle = useMemo(() => {
    const map = new Map<string, InfluencerProfileDoc>();
    for (const p of profiles) {
      const h = (p.handle || '').toLowerCase().trim();
      if (h) map.set(h, p);
    }
    return map;
  }, [profiles]);

  const searchIntent = useMemo(() => getSearchIntent(query), [query]);
  const activeChips = useMemo(() => chipText(filtersActive), [filtersActive]);

  const existingProfile = useMemo(() => {
    if (!searchIntent.isHandle || !searchIntent.handle) return undefined;
    return profilesByHandle.get(searchIntent.handle.toLowerCase());
  }, [searchIntent, profilesByHandle]);

  const typeSearchRef = useRef<any>(null);
  const filtersActiveRef = useRef(filtersActive);

  useEffect(() => {
    filtersActiveRef.current = filtersActive;
  }, [filtersActive]);

  useEffect(() => {
    return () => {
      if (typeSearchRef.current) clearTimeout(typeSearchRef.current);
    };
  }, []);

  useEffect(() => {
    if (filterModalOpen || detailsModalOpen || previewOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [filterModalOpen, detailsModalOpen, previewOpen]);

  function buildFilterPayload(f: InfluencerFilters) {
    const out: Record<string, any> = {
      sortBy: f.sortBy || 'relevance',
    };

    if (f.subscriberRange) {
      const range = SUBSCRIBER_RANGES.find((x) => x.value === f.subscriberRange);
      if (range?.min != null) out.followersMin = range.min;
      if (range?.max != null) out.followersMax = range.max;
      out.subscriberRange = f.subscriberRange;
    }

    if (Array.isArray(f.countries) && f.countries.length) out.countries = f.countries;
    if (f.category) out.category = f.category;
    if (f.avgViewsMin) out.avgViewsMin = Number(f.avgViewsMin);
    if (f.lastUploadDays) out.lastUploadDays = Number(f.lastUploadDays);

    return out;
  }

  async function loadSaved(
    p = 1,
    active: InfluencerFilters = filtersActive,
    searchText = '',
  ) {
    setListLoading(true);
    try {
      const resp = await post<GetAllResponse>('/youtube/getall', {
        page: p,
        limit,
        search: searchText || '',
        includeRaw: false,
        includeVideos: false,
        ...buildFilterPayload(active),
      });

      if (resp?.status !== 'ok') throw new Error('Failed to load saved data');

      setProfiles(asList<InfluencerProfileDoc>(resp.data));
      setTotal(resp.total || 0);
      setHasNext(!!resp.hasNext);
      setPage(resp.page || p);

      const parsed = getSearchIntent(searchText || '');
      if (parsed.isHandle && Array.isArray(resp.data) && resp.data.length === 1) {
        const one = resp.data[0];
        if ((one.handle || '').toLowerCase() === parsed.handle.toLowerCase() && one.handleId) {
          openAndScrollTo(one.handleId);
        }
      }
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load saved data.');
    } finally {
      setListLoading(false);
    }
  }

  async function runGlobalSearch(rawQuery: string) {
    setSearchLoading(true);
    try {
      const resp = await post<GlobalSearchResponse>('/youtube/search', {
        query: rawQuery,
        channelLimit: 50,
        videoLimit: 50,
        pageToken: '',
      });

      if (resp?.status !== 'ok') throw new Error('Global search failed');

      setGlobalResult(resp.data);
      setGlobalVisibleCount(10);
      setGlobalNextPageToken(resp.data.nextPageToken || null);
      setGlobalHasMore(!!resp.data.hasMore);

      setSearchHint(
        resp.data.recommendations?.length
          ? `Found ${formatNumber(resp.data.channelsFound)} creators in this batch. Click View Details to preview, and Load More to fetch the next batch.`
          : 'No live YouTube results found.',
      );
    } catch (e: any) {
      await showErr(e?.message || 'Failed to search YouTube.');
    } finally {
      setSearchLoading(false);
    }
  }

  async function loadMoreGlobalResults() {
    if (!globalResult) return;

    const currentlyShown = globalVisibleCount;
    const alreadyLoaded = globalResult.recommendations.length;

    // First reveal more from already loaded data
    if (currentlyShown < alreadyLoaded) {
      setGlobalVisibleCount((v) => Math.min(v + 10, alreadyLoaded));
      return;
    }

    // Then fetch next page from backend if available
    if (!globalNextPageToken || !globalHasMore) return;

    setGlobalLoadingMore(true);
    try {
      const resp = await post<GlobalSearchResponse>('/youtube/search', {
        query: globalResult.query,
        channelLimit: 50,
        videoLimit: 50,
        pageToken: globalNextPageToken,
      });

      if (resp?.status !== 'ok') throw new Error('Failed to load more search results');

      const nextItems = asList<GlobalSearchRecommendation>(resp.data.recommendations);

      setGlobalResult((prev) => {
        if (!prev) return prev;

        const seen = new Set(
          prev.recommendations.map((x) => `${x.channelId || ''}::${x.handle || ''}`)
        );

        const merged = [...prev.recommendations];
        for (const item of nextItems) {
          const key = `${item.channelId || ''}::${item.handle || ''}`;
          if (!seen.has(key)) {
            merged.push(item);
            seen.add(key);
          }
        }

        return {
          ...prev,
          channelsFound: merged.length,
          videoHits: prev.videoHits + (resp.data.videoHits || 0),
          nextPageToken: resp.data.nextPageToken || null,
          hasMore: !!resp.data.hasMore,
          recommendations: merged,
        };
      });

      setGlobalVisibleCount((v) => v + 10);
      setGlobalNextPageToken(resp.data.nextPageToken || null);
      setGlobalHasMore(!!resp.data.hasMore);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load more results.');
    } finally {
      setGlobalLoadingMore(false);
    }
  }

  async function openPreview(payload: { handle?: string; channelId?: string }) {
    setPreviewLoading(true);
    setPreviewOpen(true);
    setPreviewData(null);

    try {
      const resp = await post<PreviewResponse>('/youtube/profile/preview', {
        ...payload,
        videosLimit: 15,
      });

      if (resp?.status !== 'ok' || !resp?.data) throw new Error('Failed to load preview');

      setPreviewData(resp.data);
    } catch (e: any) {
      setPreviewOpen(false);
      setPreviewData(null);
      await showErr(e?.message || 'Failed to load creator details.');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function savePreviewProfile() {
    if (!previewData) return;

    setPreviewSaving(true);
    try {
      const resp = await post<SaveProfileResponse>('/youtube/profile/sync', {
        handle: previewData.handle || undefined,
        channelId: previewData.channelId || undefined,
      });

      if (resp?.status !== 'ok' || !resp?.data?.handleId) {
        throw new Error('Failed to save profile');
      }

      upsertProfile(resp.data);

      setPreviewOpen(false);
      setPreviewData(null);

      await loadSaved(
        1,
        filtersActiveRef.current,
        buildSavedSearchText(query),
      );

      openAndScrollTo(resp.data.handleId);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to save profile.');
    } finally {
      setPreviewSaving(false);
    }
  }

  useEffect(() => {
    loadSaved(1, filtersActive, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const raw = query.trim();

    if (!raw) {
      setSearchHint('');
      return;
    }

    if (searchIntent.isHandle) {
      const existing = profilesByHandle.get(searchIntent.handle.toLowerCase());
      setSearchHint(
        existing
          ? 'Handle already saved. Search will open the saved profile.'
          : 'Explicit handle detected. Search will fetch full creator details first. You can save after preview.',
      );
      return;
    }

    setSearchHint(
      'Keyword search runs live on YouTube. Use View Details to fetch full creator data, then save only if needed.',
    );
  }, [query, searchIntent, profilesByHandle]);

  function upsertProfile(doc: InfluencerProfileDoc) {
    setProfiles((prev) => {
      const idx = prev.findIndex((x) => x.handleId === doc.handleId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...doc };
        return copy;
      }
      setTotal((t) => t + 1);
      return [doc, ...prev];
    });
  }

  function toggleExpand(id: string) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  }

  function openAndScrollTo(id: string) {
    setExpanded((p) => ({ ...p, [id]: true }));
    setTimeout(() => {
      const el = document.getElementById(`card-${id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  function openDetailsModal(p: InfluencerProfileDoc) {
    setDetailsHandleId(p.handleId);

    setDetailsForm({
      email: p.email || '',
      lastSponsor: p.lastSponsor || '',
      managedByAgency:
        p.managedByAgency === true ? 'yes' : p.managedByAgency === false ? 'no' : 'unknown',
      topAudienceCountry: p.topAudienceCountry || '',
      averageAudienceAge: p.averageAudienceAge != null ? String(p.averageAudienceAge) : '',
      lastContactedAt: toDateInputValue(p.lastContactedAt),
      followUpDates: Array.isArray(p.followUpDates)
        ? p.followUpDates.map((x) => toDateInputValue(x)).filter(Boolean).join(', ')
        : '',
      workingHandle: p.workingHandle || '',
    });

    setDetailsModalOpen(true);
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();

    const raw = query.trim();
    if (!raw) {
      await showErr('Please enter a handle or keyword.');
      return;
    }

    if (searchIntent.isHandle) {
      if (existingProfile?.handleId) {
        setGlobalResult(null);
        openAndScrollTo(existingProfile.handleId);
        return;
      }

      await openPreview({ handle: searchIntent.handle });
      return;
    }

    await runGlobalSearch(raw);
  }

  async function saveDetails() {
    const payload: any = { handleId: detailsHandleId };

    const email = detailsForm.email.trim();
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase())) {
        await showErr('Enter a valid email.');
        return;
      }
      payload.email = email.toLowerCase();
    } else {
      payload.email = null;
    }

    payload.lastSponsor = detailsForm.lastSponsor.trim() || null;
    payload.topAudienceCountry = detailsForm.topAudienceCountry.trim() || null;
    payload.workingHandle = detailsForm.workingHandle.trim() || null;
    payload.managedByAgency =
      detailsForm.managedByAgency === 'yes'
        ? true
        : detailsForm.managedByAgency === 'no'
          ? false
          : null;

    if (detailsForm.averageAudienceAge.trim()) {
      const n = Number(detailsForm.averageAudienceAge.trim());
      if (!Number.isFinite(n) || n < 0 || n > 120) {
        await showErr('Average audience age must be 0–120.');
        return;
      }
      payload.averageAudienceAge = n;
    } else {
      payload.averageAudienceAge = null;
    }

    payload.lastContactedAt = detailsForm.lastContactedAt ? detailsForm.lastContactedAt : null;
    payload.followUpDates = parseFollowUps(detailsForm.followUpDates);

    setDetailsSaving(true);
    try {
      const resp = await post<UpdateManualResponse>('/youtube/profile/update-manual', payload);
      if (resp?.status !== 'ok') throw new Error('Failed to save details');
      upsertProfile(resp.data);
      setDetailsModalOpen(false);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to save details.');
    } finally {
      setDetailsSaving(false);
    }
  }

  function applyFilters() {
    const next = { ...filtersDraft };
    setFiltersActive(next);
    loadSaved(1, next, buildSavedSearchText(query));
    setFilterModalOpen(false);
  }

  function clearFilters() {
    const empty: InfluencerFilters = {
      subscriberRange: '',
      countries: [],
      category: '',
      avgViewsMin: '',
      lastUploadDays: '',
      sortBy: 'relevance',
    };

    setFiltersDraft(empty);
    setFiltersActive(empty);
    loadSaved(1, empty, buildSavedSearchText(query));
    setFilterModalOpen(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">YouTube Influencer Profiles</h1>
          <p className="text-slate-600">
            Search YouTube globally, preview full creator data, and save only the influencers you actually want.
          </p>
        </div>

        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Discovery</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Use keywords for live YouTube search. Use <span className="font-semibold">@handle</span> when you want to save a creator.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {activeChips.length ? (
                  <>
                    {activeChips.slice(0, 5).map((c) => (
                      <span
                        key={c}
                        className="text-xs px-3 py-1 rounded-full bg-white text-slate-700 border border-slate-200 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                      >
                        {c}
                      </span>
                    ))}
                    {activeChips.length > 5 ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-slate-900 text-white">
                        +{activeChips.length - 5}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full bg-white text-slate-600 border border-slate-200">
                    No active filters
                  </span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={onSearch} className="p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                <div className="lg:col-span-7">
                  <label className="text-[11px] font-semibold text-slate-600 mb-2 block uppercase tracking-wide">
                    Search keywords or explicit handles
                  </label>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                      value={query}
                      onChange={(e) => {
                        const v = e.target.value;
                        setQuery(v);

                        if (typeSearchRef.current) clearTimeout(typeSearchRef.current);

                        typeSearchRef.current = setTimeout(() => {
                          const searchText = buildSavedSearchText(v);
                          loadSaved(1, filtersActiveRef.current, searchText);
                        }, 350);
                      }}
                      placeholder="e.g. powerstation reviews, tech creator, @MrBeast"
                    />
                  </div>
                </div>

                <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    className="w-full h-[52px] px-5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    type="submit"
                    disabled={searchLoading}
                  >
                    {searchLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Searching…
                      </>
                    ) : searchIntent.isHandle ? (
                      existingProfile ? 'Open Profile' : 'Preview Creator'
                    ) : (
                      'Search'
                    )}
                  </button>

                  <button
                    type="button"
                    className="w-full h-[52px] px-5 rounded-xl font-semibold border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    onClick={() => loadSaved(1, filtersActive, buildSavedSearchText(query))}
                    disabled={listLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${listLoading ? 'animate-spin' : ''}`} />
                    Refresh Saved
                  </button>

                  <button
                    type="button"
                    className="w-full h-[52px] px-5 rounded-xl font-semibold border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    onClick={() => setFilterModalOpen(true)}
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                </div>
              </div>

              {searchHint ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 flex gap-3 items-start">
                  <div className="mt-0.5">
                    <Info className="w-5 h-5 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-700">{searchHint}</p>
                </div>
              ) : null}
            </div>
          </form>
        </div>

        {globalResult ? (
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-white flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Live YouTube Results for “{globalResult.query}”
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {formatNumber(globalResult.channelsFound)} creators • {formatNumber(globalResult.videoHits)} matched videos
                </p>
              </div>

              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold"
                onClick={() => setGlobalResult(null)}
              >
                Clear Results
              </button>
            </div>

            <div className="p-5 bg-slate-50/70">
              {!globalResult.recommendations?.length ? (
                <div className="px-6 py-10 text-center text-slate-500">
                  No live results found.
                </div>
              ) : (
                <div className="space-y-5">
                  {globalResult.recommendations.slice(0, globalVisibleCount).map((item) => {
                    const saved = item.handle
                      ? profilesByHandle.get(String(item.handle).toLowerCase())
                      : undefined;

                    return (
                      <GlobalSearchCard
                        key={item.channelId || item.handle || item.title}
                        item={item}
                        savedProfile={saved}
                        onOpenSaved={(id) => openAndScrollTo(id)}
                        onViewDetails={(payload) => openPreview(payload)}
                        loading={searchLoading}
                      />


                    );

                  })}
                  {globalResult.recommendations.length > 10 || globalHasMore ? (
                    <div className="pt-4 flex justify-center">
                      <button
                        type="button"
                        className="px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold disabled:opacity-50"
                        onClick={loadMoreGlobalResults}
                        disabled={globalLoadingMore}
                      >
                        {globalLoadingMore ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-white flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {formatNumber(total)} Saved Creator Result{total === 1 ? '' : 's'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                This section is your saved database. Typing in the search box filters these saved creators too.
              </p>
            </div>

            <span className="text-xs px-3 py-1 rounded-full bg-slate-900 text-white">
              Sort: {sortLabel(filtersActive.sortBy)}
            </span>
          </div>

          <div className="p-5 bg-slate-50/70">
            {listLoading && profiles.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                Loading profiles...
              </div>
            ) : null}

            {!listLoading && profiles.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                No matching saved profiles. Use keywords for live search, or use an explicit @handle to save from YouTube.
              </div>
            ) : null}

            <div className="space-y-5">
              {profiles.map((p) => {
                const cardId = getCardId(p);
                const isOpen = !!expanded[cardId];
                const thumb = getThumbUrl(p.thumbnails);
                const channelUrl = ytChannelUrl(p);
                const topics = getTopicNames(p);

                return (
                  <div
                    key={cardId}
                    id={`card-${cardId}`}
                    className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col xl:flex-row xl:items-start gap-5">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 shrink-0 ring-4 ring-slate-100">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-3xl leading-tight font-bold text-slate-900 truncate">
                                {p.title || p.handle || '—'}
                              </h3>

                              {p.platform ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-300 text-slate-600">
                                  {p.platform}
                                </span>
                              ) : null}

                              {p.country ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                                  {p.country}
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-2 flex items-center gap-3 flex-wrap">
                              <div className="text-lg font-semibold text-blue-600">
                                {p.handle || '—'}
                              </div>

                              {p.lastSponsor ? (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700">
                                  Last Sponsor: {p.lastSponsor}
                                </span>
                              ) : null}

                              {p.managedByAgency != null ? (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                                  Agency: {formatBool(p.managedByAgency)}
                                </span>
                              ) : null}
                            </div>

                            {topics.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {topics.slice(0, 5).map((t) => (
                                  <span
                                    key={t}
                                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                                  >
                                    {t}
                                  </span>
                                ))}
                                {topics.length > 5 ? (
                                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 text-white">
                                    +{topics.length - 5} Categories
                                  </span>
                                ) : null}
                              </div>
                            ) : null}

                            <div className="mt-4 text-sm text-slate-500 flex flex-wrap gap-x-6 gap-y-1">
                              <span>Synced: {formatDate(p.syncedAt)}</span>
                              <span>Last Upload: {formatDate(p.lastUploadAt)}</span>
                              <span>Email: {p.email || '—'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row xl:flex-col gap-2 xl:w-[230px]">
                          {p.channelId ? (
                            <Link
                              href={`/mediakit/${encodeURIComponent(p.channelId)}?platform=${encodeURIComponent(
                                String(p.platform || 'youtube').toLowerCase()
                              )}&handle=${encodeURIComponent(String(p.handle || ''))}`}
                              className="w-full px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                              <Info className="w-4 h-4" />
                              Load Advanced Insights
                            </Link>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-400 text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <Info className="w-4 h-4" />
                              Load Advanced Insights
                            </button>
                          )}

                          {channelUrl ? (
                            <a
                              href={channelUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Channel
                            </a>
                          ) : null}

                          <button
                            type="button"
                            className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            onClick={() => openDetailsModal(p)}
                          >
                            <Mail className="w-4 h-4" />
                            Add Details
                          </button>

                          <button
                            type="button"
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            onClick={() => toggleExpand(cardId)}
                          >
                            {isOpen ? 'Hide Intelligence' : 'Show Intelligence'}
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
                        <MetricCard label="Subscriber Base" value={formatNumber(p.subscriberCount)} />
                        <MetricCard label="Avg. View Velocity" value={formatNumber(p.avgViewsLast15)} />
                        <MetricCard label="Audience Engagement" value={formatPercent(p.engagementRateLast15)} />
                        <MetricCard
                          label="Content Frequency"
                          value={p.uploadFrequencyPerWeek != null ? `${p.uploadFrequencyPerWeek}/wk` : '—'}
                        />
                      </div>
                    </div>

                    {isOpen ? (
                      <div className="border-t border-slate-200 bg-slate-50/80 p-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                          <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-4">
                              Channel Intelligence
                            </div>

                            <div className="space-y-3">
                              <Row label="Operating Language" value={p.defaultLanguage || '—'} />
                              <Row label="Verified Contact Email" value={p.email || '—'} />
                              <Row
                                label="Content Ecosystem"
                                value={topics.length ? topics.join(', ') : '—'}
                              />
                              <Row label="Total Lifetime Views" value={formatNumber(p.totalViewCount)} />
                              <Row label="Total Videos" value={formatNumber(p.totalVideoCount)} />
                              <Row label="Instagram" value={p.instagramHandle || '—'} />
                              <Row label="Last Video" value={p.lastVideoTitle || '—'} />
                              <Row label="Latest Video Link" value={p.lastVideoId ? 'Available' : '—'} />
                            </div>

                            {p.lastVideoId ? (
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                <a
                                  href={ytVideoUrl(p.lastVideoId)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Watch latest video
                                </a>
                              </div>
                            ) : null}
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-4">
                              Market Reliability
                            </div>

                            <div className="space-y-3">
                              <Row label="Account Creation" value={formatDate(p.createdAt)} />
                              <Row
                                label="Upload Consistency"
                                value={
                                  p.avgDaysBetweenUploads != null
                                    ? `${p.avgDaysBetweenUploads} days gap`
                                    : '—'
                                }
                              />
                              <Row label="Market Category" value={p.country || '—'} />
                              <Row label="Top Audience Country" value={p.topAudienceCountry || '—'} />
                              <Row
                                label="Average Audience Age"
                                value={p.averageAudienceAge != null ? String(p.averageAudienceAge) : '—'}
                              />
                              <Row label="Managed by Agency" value={formatBool(p.managedByAgency)} />
                              <Row label="Last Contacted" value={formatDate(p.lastContactedAt)} />
                              <Row label="Working Handle" value={p.workingHandle || '—'} />
                            </div>

                            {p.description ? (
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
                                  Summary
                                </div>
                                <p className="text-sm leading-6 text-slate-600 whitespace-pre-line">
                                  {p.description}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between gap-4 flex-wrap">
            <div className="text-sm text-slate-600">
              Page <span className="font-semibold text-slate-900">{page}</span>
              {total ? (
                <>
                  {' '}
                  • <span className="font-semibold text-slate-900">{formatNumber(total)}</span> total
                </>
              ) : null}
            </div>

            <div className="flex gap-2">
              <button
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => loadSaved(Math.max(1, page - 1), filtersActive, buildSavedSearchText(query))}
                disabled={listLoading || page <= 1}
              >
                Previous
              </button>

              <button
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => loadSaved(page + 1, filtersActive, buildSavedSearchText(query))}
                disabled={listLoading || !hasNext}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {filterModalOpen ? (
        <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Search Parameters</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Refine your saved-database search with production-ready dropdown filters.
                </p>
              </div>

              <button
                type="button"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => setFilterModalOpen(false)}
                aria-label="Close filters"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="text-[11px] font-semibold text-slate-600 mb-2 block uppercase tracking-wide">
                    Subscribers Range
                  </label>
                  <select
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={filtersDraft.subscriberRange}
                    onChange={(e) =>
                      setFiltersDraft((p) => ({ ...p, subscriberRange: e.target.value }))
                    }
                  >
                    {SUBSCRIBER_RANGES.map((opt) => (
                      <option key={opt.value || 'all'} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="text-[11px] font-semibold text-slate-600 mb-2 block uppercase tracking-wide">
                    Country
                  </label>
                  <MultiCountrySelect
                    value={filtersDraft.countries || []}
                    onChange={(next) =>
                      setFiltersDraft((p) => ({
                        ...p,
                        countries: next,
                      }))
                    }
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="text-[11px] font-semibold text-slate-600 mb-2 block uppercase tracking-wide">
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={filtersDraft.category}
                    onChange={(e) =>
                      setFiltersDraft((p) => ({ ...p, category: e.target.value }))
                    }
                  >
                    <option value="">All</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="text-[11px] font-semibold text-slate-600 mb-2 block uppercase tracking-wide">
                    Average Views
                  </label>
                  <select
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={filtersDraft.avgViewsMin}
                    onChange={(e) =>
                      setFiltersDraft((p) => ({ ...p, avgViewsMin: e.target.value }))
                    }
                  >
                    {AVG_VIEWS_OPTIONS.map((opt) => (
                      <option key={opt.value || 'all'} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="text-[11px] font-semibold text-slate-600 mb-2 block uppercase tracking-wide">
                    Last Upload
                  </label>
                  <select
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={filtersDraft.lastUploadDays}
                    onChange={(e) =>
                      setFiltersDraft((p) => ({ ...p, lastUploadDays: e.target.value }))
                    }
                  >
                    {LAST_UPLOAD_OPTIONS.map((opt) => (
                      <option key={opt.value || 'any'} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="text-[11px] font-semibold text-slate-600 mb-2 block uppercase tracking-wide">
                    Sort By
                  </label>
                  <select
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={filtersDraft.sortBy}
                    onChange={(e) =>
                      setFiltersDraft((p) => ({
                        ...p,
                        sortBy: e.target.value as SavedSortValue,
                      }))
                    }
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold"
                onClick={clearFilters}
                disabled={listLoading}
              >
                Clear All
              </button>

              <button
                type="button"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                onClick={applyFilters}
                disabled={listLoading}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {detailsModalOpen ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[115]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Add / Update Details</h3>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Email Address</label>
                  <input
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={detailsForm.email}
                    onChange={(e) =>
                      setDetailsForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="brand@domain.com"
                    type="email"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Working Handle</label>
                  <input
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={detailsForm.workingHandle}
                    onChange={(e) =>
                      setDetailsForm((p) => ({ ...p, workingHandle: e.target.value }))
                    }
                    placeholder="@creator_official"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Last Sponsor</label>
                  <input
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={detailsForm.lastSponsor}
                    onChange={(e) =>
                      setDetailsForm((p) => ({ ...p, lastSponsor: e.target.value }))
                    }
                    placeholder="Brand name"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Managed by Agency?</label>
                  <select
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    value={detailsForm.managedByAgency}
                    onChange={(e) =>
                      setDetailsForm((p) => ({
                        ...p,
                        managedByAgency: e.target.value as 'unknown' | 'yes' | 'no',
                      }))
                    }
                  >
                    <option value="unknown">Unknown</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Top Audience Country</label>
                  <input
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={detailsForm.topAudienceCountry}
                    onChange={(e) =>
                      setDetailsForm((p) => ({
                        ...p,
                        topAudienceCountry: e.target.value,
                      }))
                    }
                    placeholder="US / IN / UK ..."
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Average Audience Age</label>
                  <input
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={detailsForm.averageAudienceAge}
                    onChange={(e) =>
                      setDetailsForm((p) => ({
                        ...p,
                        averageAudienceAge: e.target.value,
                      }))
                    }
                    placeholder="24"
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Last Contacted Date</label>
                  <input
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={detailsForm.lastContactedAt}
                    onChange={(e) =>
                      setDetailsForm((p) => ({
                        ...p,
                        lastContactedAt: e.target.value,
                      }))
                    }
                    type="date"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-slate-600 mb-1 block">Follow-up Dates</label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[90px]"
                    value={detailsForm.followUpDates}
                    onChange={(e) =>
                      setDetailsForm((p) => ({
                        ...p,
                        followUpDates: e.target.value,
                      }))
                    }
                    placeholder="2026-02-26, 2026-03-02"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use <span className="font-mono">YYYY-MM-DD</span>. Separate by comma or new line.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-200">
              <button
                className="flex-1 px-4 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors"
                onClick={() => setDetailsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={saveDetails}
                disabled={detailsSaving}
              >
                {detailsSaving ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </div>
        </div>
      ) : null}


      <PreviewSidebar
        open={previewOpen}
        loading={previewLoading}
        saving={previewSaving}
        data={previewData}
        savedProfile={
          previewData?.handle
            ? profilesByHandle.get(previewData.handle.toLowerCase())
            : undefined
        }
        onClose={() => {
          setPreviewOpen(false);
          setPreviewData(null);
        }}
        onSave={savePreviewProfile}
        onOpenSaved={(id) => {
          setPreviewOpen(false);
          setPreviewData(null);
          openAndScrollTo(id);
        }}
      />

    </div>
  );
}