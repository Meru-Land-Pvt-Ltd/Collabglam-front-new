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
import { get, post } from '@/lib/api';
import { Checkbox } from '@/components/animate-ui/components/radix/checkbox';
import { useSearchParams } from 'next/navigation';

type VideoItem = {
  _id?: string;
  videoId?: string;
  title?: string;
  publishedAt?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  duration?: string;
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
  data: InfluencerProfileDoc[];
};

type SyncResponse = {
  status: string;
  handle: string;
  handleId: string;
  data: InfluencerProfileDoc;
};

type UpdateManualResponse = {
  status: string;
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
  recommendations: GlobalSearchRecommendation[];
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

type HandleSearchResponse = {
  status: string;
  mode: 'handle';
  stored: true;
  handle: string;
  handleId: string;
  data: InfluencerProfileDoc;
};

type GlobalSearchResponse = {
  status: string;
  mode: 'global';
  stored: false;
  query: string;
  data: GlobalSearchData;
};

type SearchResponse = HandleSearchResponse | GlobalSearchResponse;

type InfluencerFilters = {
  followersMin?: string;
  followersMax?: string;
  countries?: string[];
  country?: string;
  category?: string;
  categories?: string[];
};

type SortMode = 'engagement_upload' | 'engagement' | 'uploads' | 'created';

/* -------------------- Modash types -------------------- */

const DASH = '--';

type ModashLangObj = { code?: string; name?: string };

type ModashInfluencerDoc = {
  _id?: string;
  provider?: string;
  platform?: string;
  userId?: string;

  fullname?: string;
  handle?: string;
  username?: string;

  country?: string | null;
  city?: string | null;
  state?: string | null;
  language?: ModashLangObj | null;

  followers?: number | null;
  averageViews?: number | null;
  engagements?: number | null;
  engagementRate?: number | null;

  isPrivate?: boolean | null;
  isVerified?: boolean | null;

  picture?: string | null;
  url?: string | null;

  createdAt?: string;
  updatedAt?: string;

  influencerId?: string;
  influencer?: string;
  category?: string[] | string | null;
};

type ModashListResponse = {
  page: number;
  limit: number;
  total: number;
  results: ModashInfluencerDoc[];
};

/* -------------------- Helpers -------------------- */

type ThumbShape =
  | {
    default?: { url?: string; width?: number; height?: number };
    medium?: { url?: string; width?: number; height?: number };
    high?: { url?: string; width?: number; height?: number };
  }
  | null
  | undefined;

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

function ytChannelUrlFromHandleOrId(handle?: string | null, channelId?: string | null) {
  if (handle) {
    const normalized = handle.startsWith('@') ? handle : `@${handle}`;
    return `https://www.youtube.com/${normalized}`;
  }
  if (channelId) return `https://www.youtube.com/channel/${channelId}`;
  return '';
}

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

function splitCsvOrSpace(v: string): string[] {
  return (v || '')
    .split(/[,\n]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function chipText(filters: InfluencerFilters) {
  const chips: string[] = [];

  if (filters.followersMin || filters.followersMax) {
    chips.push(
      `Subscribers: ${filters.followersMin || '0'} - ${filters.followersMax || '∞'}`
    );
  }

  const cs = filters.countries?.length
    ? filters.countries
    : filters.country
      ? [filters.country]
      : [];
  if (cs.length) chips.push(`Country: ${cs.join(', ')}`);

  const cats = filters.categories?.length
    ? filters.categories
    : filters.category
      ? [filters.category]
      : [];
  if (cats.length) chips.push(`Category: ${cats.join(', ')}`);

  return chips;
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
  const labels = asList<string>(p.topicLabels)
    .filter(Boolean)
    .map(cleanTopicLabel);

  if (labels.length) return Array.from(new Set(labels));

  const cats = asList<string>(p.topicCategories)
    .filter(Boolean)
    .map(topicFromUrl)
    .map(cleanTopicLabel);

  return Array.from(new Set(cats));
}

function sortToApi(mode: SortMode) {
  if (mode === 'uploads') {
    return { sortBy: 'uploadFrequencyPerWeek', sortOrder: 'desc' as const };
  }
  if (mode === 'created') {
    arr.sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime() || 0;
      const tb = new Date(b.createdAt || 0).getTime() || 0;
      return tb - ta;
    });
    return arr;
  }

  if (mode === 'uploads') {
    arr.sort((a, b) => numOrNegInf(b.uploadFrequencyPerWeek) - numOrNegInf(a.uploadFrequencyPerWeek));
    return arr;
  }

  arr.sort((a, b) => {
    const e = numOrNegInf(b.engagementRateLast15) - numOrNegInf(a.engagementRateLast15);
    if (e !== 0) return e;
    if (mode === 'engagement_upload') {
      return numOrNegInf(b.uploadFrequencyPerWeek) - numOrNegInf(a.uploadFrequencyPerWeek);
    }
    return 0;
  });

  return arr;
}

function sortToApi(mode: SortMode) {
  if (mode === 'uploads') return { sortBy: 'uploadFrequencyPerWeek', sortOrder: 'desc' as const };
  if (mode === 'created') return { sortBy: 'createdAt', sortOrder: 'desc' as const };
  return { sortBy: 'engagementRateLast15', sortOrder: 'desc' as const };
}

/* -------------------- Countries -------------------- */

const COUNTRY_OPTIONS: Array<{ code: string; name: string }> = [
  { code: 'US', name: 'United States' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IE', name: 'Ireland' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czechia' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'GR', name: 'Greece' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'RU', name: 'Russia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'PE', name: 'Peru' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'EG', name: 'Egypt' },
  { code: 'KE', name: 'Kenya' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'IL', name: 'Israel' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'CN', name: 'China' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'NP', name: 'Nepal' },
];

function countryLabel(code: string) {
  const c = COUNTRY_OPTIONS.find((x) => x.code === code);
  return c ? `${c.code} — ${c.name}` : code;
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
                placeholder="Search"
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
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 py-3 text-left hover:bg-slate-50"
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

/* -------------------- Modash sidebar -------------------- */

function getModashRowKey(p: ModashInfluencerDoc) {
  const base = String(p.userId || '').trim();
  if (base) return base;
  const fallback = String(p._id || p.influencerId || p.handle || p.username || p.url || '').trim();
  return fallback || 'missing_id';
}

function normalizeModashQuery(input: string) {
  const s = (input || '').trim();
  if (!s) return '';
  return s.startsWith('@') ? s : `@${s}`;
}

function ModashSidebar({
  open,
  onClose,
  initialQuery = '',
}: {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
}) {
  const SAVED_ENDPOINT = '/modash/saved';
  const USERS_ENDPOINT = '/modash/users';

  const [items, setItems] = useState<ModashInfluencerDoc[]>([]);
  const [usersItems, setUsersItems] = useState<ModashInfluencerDoc[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<'saved' | 'users'>('saved');

  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const [query, setQuery] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const itemsByHandle = useMemo(() => {
    const map = new Map<string, { key: string; doc: ModashInfluencerDoc }>();
    for (const x of items) {
      const h = (x.handle || x.username || '').toLowerCase().trim();
      if (h) map.set(h, { key: getModashRowKey(x), doc: x });
    }
    return map;
  }, [items]);

  function buildSavedParams(pUI: number, q: string) {
    const params: Record<string, any> = {
      page: Math.max(0, pUI - 1),
      limit,
      sort: 'updatedAt',
      dir: 'desc',
    };
    const qClean = String(q || '').trim();
    if (qClean) params.q = qClean;
    return params;
  }

  function buildUsersParams(pUI: number, q: string) {
    const params: Record<string, any> = {
      page: Math.max(0, pUI - 1),
      limit,
    };
    const qClean = String(q || '').trim();
    if (qClean) params.q = qClean;
    return params;
  }

  async function loadSaved(pUI = 1, q = '') {
    setListLoading(true);
    try {
      const resp = await get<ModashListResponse>(SAVED_ENDPOINT, buildSavedParams(pUI, q));
      const results = Array.isArray(resp?.results) ? resp.results : [];

      setView('saved');
      setUsersItems([]);
      setItems(results);
      setTotal(resp?.total || 0);

      const serverPage = Number(resp?.page ?? 0);
      const serverLimit = Number(resp?.limit ?? limit);
      const serverTotal = Number(resp?.total ?? 0);

      setPage(serverPage + 1);
      setHasNext((serverPage + 1) * serverLimit < serverTotal);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load Modash saved results.');
    } finally {
      setListLoading(false);
    }
  }

  async function loadUsers(pUI = 1, q = '') {
    setListLoading(true);
    try {
      const resp = await get<ModashListResponse>(USERS_ENDPOINT, buildUsersParams(pUI, q));
      const results = Array.isArray(resp?.results) ? resp.results : [];

      setView('users');
      setUsersItems(results);
      setTotal(resp?.total || results.length || 0);

      const serverPage = Number(resp?.page ?? 0);
      const serverLimit = Number(resp?.limit ?? limit);
      const serverTotal = Number(resp?.total ?? results.length ?? 0);

      setPage(serverPage + 1);
      setHasNext((serverPage + 1) * serverLimit < serverTotal);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load Modash users.');
    } finally {
      setListLoading(false);
    }
  }

  async function runSearch(seed?: string) {
    const q = normalizeModashQuery(seed ?? query);
    if (!q) {
      await showErr('No handle available for advanced insights.');
      return;
    }

    setSearchLoading(true);
    try {
      const existing = itemsByHandle.get(q.toLowerCase());
      if (existing?.key) {
        setView('saved');
        return;
      }

      const savedResp = await get<ModashListResponse>(SAVED_ENDPOINT, buildSavedParams(1, q));
      const savedResults = Array.isArray(savedResp?.results) ? savedResp.results : [];

      if (savedResults.length) {
        setView('saved');
        setUsersItems([]);
        setItems(savedResults);
        setTotal(savedResp?.total || savedResults.length);

        const serverPage = Number(savedResp?.page ?? 0);
        const serverLimit = Number(savedResp?.limit ?? limit);
        const serverTotal = Number(savedResp?.total ?? savedResults.length);

        setPage(serverPage + 1);
        setHasNext((serverPage + 1) * serverLimit < serverTotal);
        return;
      }

      await loadUsers(1, q);
    } catch (e: any) {
      await showErr(e?.message || 'Modash search failed.');
    } finally {
      setSearchLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const seed = normalizeModashQuery(initialQuery);
    setQuery(seed);
    if (seed) runSearch(seed);
    else loadSaved(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialQuery]);

  const currentItems = view === 'saved' ? items : usersItems;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-[760px] bg-white border-l border-slate-200 shadow-2xl flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Advanced Insights</h3>
            <p className="text-sm text-slate-500 mt-1">
              Modash results for the selected creator
            </p>
          </div>

          <button
            type="button"
            className="p-2 rounded-xl hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="@creatorhandle"
              />
            </div>

            <button
              type="button"
              className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
              onClick={() => runSearch()}
              disabled={searchLoading || listLoading}
            >
              {searchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              Search
            </button>

            <button
              type="button"
              className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
              onClick={() => loadSaved(1, query)}
              disabled={listLoading}
            >
              <RefreshCw className={`w-4 h-4 ${listLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs px-3 py-1 rounded-full bg-slate-900 text-white">
              {view === 'saved' ? 'Saved Results' : 'Global Users'}
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-white text-slate-700 border border-slate-200">
              {formatNumber(total)} total
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/60">
          {listLoading && currentItems.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              Loading Modash results...
            </div>
          ) : null}

          {!listLoading && currentItems.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              No Modash results found.
            </div>
          ) : null}

          <div className="space-y-4">
            {currentItems.map((p) => {
              const rowKey = getModashRowKey(p);
              const isOpen = !!expanded[rowKey];
              const thumb = p.picture || '';
              const url = p.url || '';
              const providerLabel = p.provider || p.platform || DASH;

              return (
                <div
                  key={rowKey}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex flex-col xl:flex-row xl:items-start gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 shrink-0">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : null}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-lg font-semibold text-slate-900 truncate">
                              {p.handle || p.username || DASH}
                            </h4>

                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-300 text-slate-600">
                              {providerLabel}
                            </span>

                            {p.isVerified ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                                Verified
                              </span>
                            ) : null}
                          </div>

                          <div className="text-sm text-slate-600 truncate mt-0.5">
                            {p.fullname || DASH}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-medium inline-flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open
                          </a>
                        ) : null}

                        {p.userId ? (
                          <Link
                            href={`/mediakit/${encodeURIComponent(
                              p.userId,
                            )}?platform=${encodeURIComponent(
                              String((p.platform || p.provider || 'youtube')).toLowerCase(),
                            )}&handle=${encodeURIComponent(String(p.handle || p.username || ''))}`}
                            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-medium inline-flex items-center gap-2"
                          >
                            <Info className="w-4 h-4" />
                            MediaKit
                          </Link>
                        ) : null}

                        <button
                          type="button"
                          className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-medium inline-flex items-center gap-2"
                          onClick={() =>
                            setExpanded((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }))
                          }
                        >
                          {isOpen ? 'Hide Details' : 'View Details'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                      <MetricCard label="Followers" value={formatNumber(p.followers)} />
                      <MetricCard label="Avg Views" value={formatNumber(p.averageViews)} />
                      <MetricCard label="Engagement" value={formatPercent(p.engagementRate)} />
                      <MetricCard label="Country" value={p.country || DASH} />
                    </div>
                  </div>

                  {isOpen ? (
                    <div className="border-t border-slate-200 bg-slate-50/80 p-5">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-4">
                            Profile Details
                          </div>

                          <div className="space-y-3">
                            <Row label="User ID" value={p.userId || DASH} mono />
                            <Row label="Username" value={p.username || DASH} />
                            <Row label="Handle" value={p.handle || DASH} />
                            <Row label="City" value={p.city || DASH} />
                            <Row label="State" value={p.state || DASH} />
                            <Row label="Country" value={p.country || DASH} />
                            <Row label="Language" value={p.language?.name || p.language?.code || DASH} />
                            <Row
                              label="Category"
                              value={Array.isArray(p.category) ? p.category.join(', ') : p.category || DASH}
                            />
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-4">
                            Metrics
                          </div>

                          <div className="space-y-3">
                            <Row label="Followers" value={formatNumber(p.followers)} />
                            <Row label="Average Views" value={formatNumber(p.averageViews)} />
                            <Row label="Engagement Rate" value={formatPercent(p.engagementRate)} />
                            <Row label="Engagements" value={formatNumber(p.engagements)} />
                            <Row label="Verified" value={p.isVerified ? 'Yes' : 'No'} />
                            <Row label="Private" value={p.isPrivate == null ? DASH : p.isPrivate ? 'Yes' : 'No'} />
                            <Row label="Created" value={formatDate(p.createdAt)} />
                            <Row label="Updated" value={formatDate(p.updatedAt)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-4 bg-white">
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
              type="button"
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              onClick={() => {
                const next = Math.max(1, page - 1);
                view === 'saved' ? loadSaved(next, query.trim()) : loadUsers(next, query.trim());
              }}
              disabled={listLoading || page <= 1}
            >
              Previous
            </button>

            <button
              type="button"
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              onClick={() => {
                const next = page + 1;
                view === 'saved' ? loadSaved(next, query.trim()) : loadUsers(next, query.trim());
              }}
              disabled={listLoading || !hasNext}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Main page -------------------- */

export default function Page() {
  const searchParams = useSearchParams();
  const campaignId = cleanStr(searchParams.get('id'));
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
  const [downloadLoading, setDownloadLoading] = useState(false);

  const [globalResult, setGlobalResult] = useState<GlobalSearchData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSaving, setPreviewSaving] = useState(false);
  const [previewData, setPreviewData] = useState<InfluencerProfileDoc | null>(null);

  const [filtersDraft, setFiltersDraft] = useState<InfluencerFilters>({
    followersMin: '',
    followersMax: '',
    countries: [],
    category: '',
  });

  const [filtersActive, setFiltersActive] = useState<InfluencerFilters>({
    followersMin: '',
    followersMax: '',
    countries: [],
    category: '',
  });

  const [sortModeDraft, setSortModeDraft] = useState<SortMode>('engagement_upload');
  const [sortModeActive, setSortModeActive] = useState<SortMode>('engagement_upload');

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

  const existingProfile = useMemo(() => {
    if (!searchIntent.isHandle || !searchIntent.handle) return undefined;
    return profilesByHandle.get(searchIntent.handle.toLowerCase());
  }, [searchIntent, profilesByHandle]);

  const activeChips = useMemo(() => chipText(buildFilterPayload(filtersActive)), [filtersActive]);

  const typeSearchRef = useRef<any>(null);
  const filtersActiveRef = useRef(filtersActive);
  const sortModeActiveRef = useRef(sortModeActive);

  useEffect(() => {
    filtersActiveRef.current = filtersActive;
  }, [filtersActive]);

  useEffect(() => {
    sortModeActiveRef.current = sortModeActive;
  }, [sortModeActive]);

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

  function buildFilterPayload(f: InfluencerFilters): InfluencerFilters {
    const out: InfluencerFilters = {};

    if (String(f.followersMin || '').trim()) out.followersMin = String(f.followersMin).trim();
    if (String(f.followersMax || '').trim()) out.followersMax = String(f.followersMax).trim();

    if (Array.isArray(f.countries) && f.countries.length) {
      out.countries = f.countries;
    } else {
      const cRaw = String(f.country || '').trim();
      if (cRaw) {
        const parts = splitCsvOrSpace(cRaw);
        if (parts.length > 1) out.countries = parts;
        else out.country = parts[0];
      }
    }

    const catRaw = String(f.category || '').trim();
    if (catRaw) {
      const parts = splitCsvOrSpace(catRaw);
      if (parts.length > 1) out.categories = parts;
      else out.category = parts[0];
    }

    return out;
  }

  async function loadSaved(
    p = 1,
    active: InfluencerFilters = filtersActive,
    searchText = '',
    sortMode: SortMode = sortModeActive
  ) {
    setListLoading(true);
    try {
      const filterPayload = buildFilterPayload(active);
      const apiSort = sortToApi(sortMode);

      const resp = await post<GetAllResponse>('/youtube/getall', {
        page: p,
        limit,
        search: searchText || '',
        sortBy: apiSort.sortBy,
        sortOrder: apiSort.sortOrder,
        includeRaw: false,
        includeVideos: false,
        ...filterPayload,
      });

      if (resp?.status !== 'ok') throw new Error('Failed to load saved data');

      setProfiles(asList<InfluencerProfileDoc>(resp.data));
      setTotal(resp.total || 0);
      setHasNext(!!resp.hasNext);
      setPage(resp.page || p);

      const typed = buildSavedSearchText(searchText || '');
      if (
        typed &&
        searchIntent.isHandle &&
        Array.isArray(resp.data) &&
        resp.data.length === 1
      ) {
        const one = resp.data[0];
        if ((one.handle || '').toLowerCase() === typed.toLowerCase() && one.handleId) {
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
        channelLimit: 8,
        videoLimit: 12,
      });

      if (resp?.status !== 'ok') throw new Error('Global search failed');

      setGlobalResult(resp.data);
      setSearchHint(
        resp.data.recommendations?.length
          ? `Found ${formatNumber(resp.data.channelsFound)} creators. Click View Details to fetch full influencer data before saving.`
          : 'No live YouTube results found.',
      );
    } catch (e: any) {
      await showErr(e?.message || 'Failed to search YouTube.');
    } finally {
      setSearchLoading(false);
    }
  }

  async function openPreview(payload: { handle?: string; channelId?: string }) {
    setPreviewLoading(true);
    setPreviewOpen(true);

    try {
      const resp = await post<PreviewResponse>('/youtube/profile/preview', {
        ...payload,
        videosLimit: 15,
      });

      if (resp?.status !== 'ok') throw new Error('Failed to load preview');

      setPreviewData(resp.data);
    } catch (e: any) {
      setPreviewOpen(false);
      setPreviewData(null);
      await showErr(e?.message || 'Failed to load creator details.');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function savePreviewCreator() {
    if (!previewData) return;

    setPreviewSaving(true);
    try {
      const resp = await post<SaveProfileResponse>('/youtube/profile/sync', {
        handle: previewData.handle || undefined,
        channelId: previewData.channelId || undefined,
      });

      if (resp?.status !== 'ok' || !resp?.data?.handleId) {
        throw new Error('Failed to save creator');
      }

      upsertProfile(resp.data);
      setPreviewData(resp.data);
      setPreviewOpen(false);
      setGlobalResult((prev) => prev ? { ...prev } : prev);

      await loadSaved(
        1,
        filtersActiveRef.current,
        buildSavedSearchText(query),
        sortModeActiveRef.current,
      );

      openAndScrollTo(resp.data.handleId);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to save creator.');
    } finally {
      setPreviewSaving(false);
    }
  }

  useEffect(() => {
    loadSaved(1, filtersActive, '', sortModeActive);
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
      averageAudienceAge:
        p.averageAudienceAge != null ? String(p.averageAudienceAge) : '',
      lastContactedAt: toDateInputValue(p.lastContactedAt),
      followUpDates: Array.isArray(p.followUpDates)
        ? p.followUpDates.map((x) => toDateInputValue(x)).filter(Boolean).join(', ')
        : '',
      workingHandle: p.workingHandle || '',
    });

    setDetailsModalOpen(true);
  }

  async function runYoutubeSearch(rawQuery: string) {
    setSearchLoading(true);
    try {
      const resp = await post<SearchResponse>('/youtube/search', {
        query: rawQuery,
        channelLimit: 8,
        videoLimit: 12,
      });

      if (resp?.status !== 'ok') throw new Error('YouTube search failed');

      if (resp.mode === 'handle') {
        if (!resp?.data?.handleId) throw new Error('Handle sync failed');

        upsertProfile(resp.data);
        setGlobalResult(null);
        setQuery(resp.handle || rawQuery);
        setSearchHint('Fetched from YouTube and saved to your database.');
        await loadSaved(
          1,
          filtersActiveRef.current,
          buildSavedSearchText(resp.handle || rawQuery),
          sortModeActiveRef.current,
        );
        openAndScrollTo(resp.data.handleId);
        return;
      }

      setGlobalResult(resp.data);
      setSearchHint(
        resp.data.recommendations?.length
          ? `Live YouTube results found: ${formatNumber(resp.data.channelsFound)} creators and ${formatNumber(resp.data.videoHits)} matched videos. These are not stored until you save a specific handle.`
          : 'No live YouTube results found for this keyword.',
      );
    } catch (e: any) {
      await showErr(e?.message || 'Failed to search YouTube.');
    } finally {
      setSearchLoading(false);
    }
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();

    const raw = query.trim();
    if (!raw) {
      await showErr('Please enter a handle or keyword.');
      return;
    }

    const parsed = getSearchIntent(raw);

    if (parsed.isHandle) {
      const existing = profilesByHandle.get(parsed.handle.toLowerCase());
      if (existing?.handleId) {
        openAndScrollTo(existing.handleId);
        return;
      }

      await openPreviewSidebar({ handle: parsed.handle });
      return;
    }

    // for keyword search keep your global search here
    await runGlobalSearch(raw);
  }

  async function saveCreatorFromGlobal(handle: string) {
    if (!handle) return;
    await runYoutubeSearch(handle);
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

    payload.lastContactedAt = detailsForm.lastContactedAt || null;
    payload.followUpDates = parseFollowUps(detailsForm.followUpDates);

    setDetailsSaving(true);
    try {
      const resp = await post<UpdateManualResponse>(
        '/youtube/profile/update-manual',
        payload
      );
      if (resp?.status !== 'ok') throw new Error('Failed to save details');
      upsertProfile(resp.data);
      setDetailsModalOpen(false);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to save details.');
    } finally {
      setDetailsSaving(false);
    }
  }

  async function openPreviewSidebar(payload: { handle?: string; channelId?: string }) {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewData(null);

    try {
      const resp = await post<PreviewResponse>('/youtube/profile/preview', {
        ...payload,
        videosLimit: 15,
      });

      if (resp?.status !== 'ok' || !resp?.data) {
        throw new Error('Failed to load creator preview');
      }

      setPreviewData(resp.data);
    } catch (e: any) {
      setPreviewOpen(false);
      setPreviewData(null);
      await showErr(e?.message || 'Failed to load creator details.');
    } finally {
      setPreviewLoading(false);
    }
  }

  function applyFilters() {
    const next = { ...filtersDraft };
    const sortNext = sortModeDraft;

    setFiltersActive(next);
    setSortModeActive(sortNext);
    loadSaved(1, next, buildSavedSearchText(query), sortNext);
    setFilterModalOpen(false);
  }

  function clearFilters() {
    const empty: InfluencerFilters = {
      followersMin: '',
      followersMax: '',
      countries: [],
      category: '',
    };

    setFiltersDraft(empty);
    setFiltersActive(empty);
    setSortModeDraft('engagement_upload');
    setSortModeActive('engagement_upload');

    clearSelection();
    loadSaved(1, empty, buildSavedSearchText(query), 'engagement_upload');
    setFilterModalOpen(false);
  }

  const primaryCtaText = searchIntent.isHandle
    ? existingProfile
      ? 'Open Saved Profile'
      : 'Search & Save'
    : 'Global Search';

  function savePreviewProfile(): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">
            YouTube Influencer Profiles
          </h1>
          <p className="text-slate-600">
            Search YouTube globally, preview full creator data, and save only the influencers you actually want.
          </p>
        </div>

        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Discovery</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Use keywords for live YouTube search. Use <span className="font-semibold">@handle</span> when you want to save a creator.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeChips.length ? (
                  activeChips.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                    No active filters
                  </span>
                )}

                <span className="text-xs px-3 py-1 rounded-full bg-slate-900 text-white">
                  Sort:{' '}
                  {sortModeActive === 'engagement_upload'
                    ? 'Engagement + Uploads'
                    : sortModeActive === 'engagement'
                      ? 'Engagement'
                      : sortModeActive === 'uploads'
                        ? 'Uploads/week'
                        : 'Newest'}
                </span>
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
                          if (!searchText) {
                            loadSaved(1, filtersActiveRef.current, '', sortModeActiveRef.current);
                            return;
                          }

                          loadSaved(
                            1,
                            filtersActiveRef.current,
                            searchText,
                            sortModeActiveRef.current,
                          );
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
                    title={
                      searchIntent.isHandle
                        ? existingProfile
                          ? 'Open saved influencer'
                          : 'Fetch from YouTube and save'
                        : 'Search YouTube live'
                    }
                  >
                    {searchLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Searching…
                      </>
                    ) : searchIntent.isHandle ? (
                      existingProfile ? 'Open Profile' : 'Preview Creator'
                    ) : (
                      'Global Search'
                    )}
                  </button>

                  <button
                    type="button"
                    className="w-full h-[52px] px-5 rounded-xl font-semibold border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    onClick={() =>
                      loadSaved(1, filtersActive, buildSavedSearchText(query), sortModeActive)
                    }
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
                  {globalResult.recommendations.map((item) => {
                    const saved = item.handle
                      ? profilesByHandle.get(String(item.handle).toLowerCase())
                      : undefined;

                    return (
                      <div
                        key={item.channelId || item.handle || item.title}
                        className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex flex-col xl:flex-row xl:items-start gap-5">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 shrink-0 ring-4 ring-slate-100">
                                {getThumbUrl(item.thumbnails) ? (
                                  <img
                                    src={getThumbUrl(item.thumbnails)}
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
                                </div>

                                <div className="mt-2 flex items-center gap-3 flex-wrap">
                                  <div className="text-lg font-semibold text-blue-600">
                                    {item.handle || 'No public handle'}
                                  </div>

                                  {saved?.handleId ? (
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                                      Already Saved
                                    </span>
                                  ) : null}
                                </div>

                                {item.topicLabels?.length ? (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {item.topicLabels.slice(0, 5).map((t) => (
                                      <span
                                        key={t}
                                        className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}

                                {item.description ? (
                                  <p className="mt-4 text-sm leading-6 text-slate-600">
                                    {item.description}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row xl:flex-col gap-2 xl:w-[220px]">
                              <button
                                type="button"
                                className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                                onClick={() =>
                                  openPreview({
                                    handle: item.handle || undefined,
                                    channelId: item.channelId || undefined,
                                  })
                                }
                              >
                                View Details
                              </button>

                              {saved?.handleId ? (
                                <button
                                  type="button"
                                  className="w-full px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-sm font-semibold transition-colors"
                                  onClick={() => openAndScrollTo(saved.handleId)}
                                >
                                  Open Saved Profile
                                </button>
                              ) : null}

                              {(item.channelUrl || item.channelId || item.handle) ? (
                                <a
                                  href={
                                    item.channelUrl ||
                                    ytChannelUrlFromHandleOrId(item.handle, item.channelId)
                                  }
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
                            <MetricCard
                              label="Matched Videos"
                              value={String(item.matchedVideos?.length || 0)}
                            />
                          </div>

                          {item.matchedVideos?.length ? (
                            <div className="mt-6 pt-6 border-t border-slate-200">
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-4">
                                Matched Videos
                              </div>

                              <div className="space-y-3">
                                {item.matchedVideos.slice(0, 3).map((video) => (
                                  <div
                                    key={video.videoId || video.title}
                                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                                  >
                                    <div className="flex gap-4">
                                      <div className="w-36 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                                        {getThumbUrl(video.thumbnails) ? (
                                          <img
                                            src={getThumbUrl(video.thumbnails)}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                          />
                                        ) : null}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold text-slate-900 line-clamp-2">
                                          {video.title || 'Untitled video'}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                          {formatDate(video.publishedAt)} • {formatNumber(video.viewCount)} views
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
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
                                <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-600">
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

                        <MetricCard
                          label="Subscriber Base"
                          value={formatNumber(p.subscriberCount)}
                        />
                        <MetricCard
                          label="Avg. View Velocity"
                          value={formatNumber(p.avgViewsLast15)}
                        />
                        <MetricCard
                          label="Audience Engagement"
                          value={formatPercent(p.engagementRateLast15)}
                        />
                        <MetricCard
                          label="Content Frequency"
                          value={
                            p.uploadFrequencyPerWeek != null
                              ? `${p.uploadFrequencyPerWeek}/wk`
                              : '—'
                          }
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
                              <Row
                                label="Total Lifetime Views"
                                value={formatNumber(p.totalViewCount)}
                              />
                              <Row
                                label="Total Videos"
                                value={formatNumber(p.totalVideoCount)}
                              />
                              <Row label="Instagram" value={p.instagramHandle || '—'} />
                              <Row label="Last Video" value={p.lastVideoTitle || '—'} />
                              <Row
                                label="Latest Video Link"
                                value={p.lastVideoId ? 'Available' : '—'}
                              />
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
                              <Row
                                label="Top Audience Country"
                                value={p.topAudienceCountry || '—'}
                              />
                              <Row
                                label="Average Audience Age"
                                value={
                                  p.averageAudienceAge != null
                                    ? String(p.averageAudienceAge)
                                    : '—'
                                }
                              />
                              <Row
                                label="Managed by Agency"
                                value={formatBool(p.managedByAgency)}
                              />
                              <Row
                                label="Last Contacted"
                                value={formatDate(p.lastContactedAt)}
                              />
                              <Row
                                label="Working Handle"
                                value={p.workingHandle || '—'}
                              />
                            </div>

                            {p.description ? (
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
                                  Summary
                                </div>
                                <p className="text-sm leading-6 text-slate-600">
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
                onClick={() =>
                  loadSaved(
                    Math.max(1, page - 1),
                    filtersActive,
                    buildSavedSearchText(query),
                    sortModeActive,
                  )
                }
                disabled={listLoading || page <= 1}
              >
                Previous
              </button>

              <button
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() =>
                  loadSaved(page + 1, filtersActive, buildSavedSearchText(query), sortModeActive)
                }
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
          <div className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Search Parameters</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Refine your saved-database search with audience, category, and ranking filters.
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="text-[11px] font-semibold text-slate-600 mb-2 block uppercase tracking-wide">
                    Subscribers Min
                  </label>
                  <input
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={filtersDraft.followersMin || ''}
                    onChange={(e) =>
                      setFiltersDraft((p) => ({ ...p, followersMin: e.target.value }))
                    }
                    inputMode="numeric"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="text-[11px] font-semibold text-slate-600 mb-2 block uppercase tracking-wide">
                    Subscribers Max
                  </label>
                  <input
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={filtersDraft.followersMax || ''}
                    onChange={(e) =>
                      setFiltersDraft((p) => ({ ...p, followersMax: e.target.value }))
                    }
                    inputMode="numeric"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="text-[11px] font-semibold text-slate-600 mb-2 block uppercase tracking-wide">
                    Creator Location
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
                    Content Category
                  </label>
                  <input
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={filtersDraft.category || ''}
                    onChange={(e) =>
                      setFiltersDraft((p) => ({ ...p, category: e.target.value }))
                    }
                    placeholder="Tech, Lifestyle"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="text-[11px] font-semibold text-slate-600 mb-2 block uppercase tracking-wide">
                    Sort Results By
                  </label>
                  <select
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={sortModeDraft}
                    onChange={(e) => setSortModeDraft(e.target.value as SortMode)}
                  >
                    <option value="engagement_upload">Engagement ↓ then Uploads/week ↓</option>
                    <option value="engagement">Engagement ↓</option>
                    <option value="uploads">Uploads/week ↓</option>
                    <option value="created">Newest (CreatedAt) ↓</option>
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
                className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Email Address">
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    value={detailsForm.email}
                    onChange={(e) =>
                      setDetailsForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="brand@domain.com"
                    type="email"
                  />
                </Field>

                <Field label="Working Handle">
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    value={detailsForm.workingHandle}
                    onChange={(e) =>
                      setDetailsForm((p) => ({ ...p, workingHandle: e.target.value }))
                    }
                    placeholder="@creator_official"
                  />
                </Field>

                <Field label="Last Sponsor">
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    value={detailsForm.lastSponsor}
                    onChange={(e) =>
                      setDetailsForm((p) => ({ ...p, lastSponsor: e.target.value }))
                    }
                    placeholder="Brand name"
                  />
                </Field>

                <Field label="Managed by Agency?">
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                </Field>

                <Field label="Top Audience Country">
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    value={detailsForm.topAudienceCountry}
                    onChange={(e) =>
                      setDetailsForm((p) => ({
                        ...p,
                        topAudienceCountry: e.target.value,
                      }))
                    }
                    placeholder="US / IN / UK ..."
                  />
                </Field>

                <Field label="Average Audience Age">
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                </Field>

                <Field label="Last Contacted Date">
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    value={detailsForm.lastContactedAt}
                    onChange={(e) =>
                      setDetailsForm((p) => ({
                        ...p,
                        lastContactedAt: e.target.value,
                      }))
                    }
                    type="date"
                  />
                </Field>

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

            <div className="flex gap-3 border-t border-slate-200 p-6">
              <button
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
                onClick={() => setDetailsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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

/* -------------------- Small UI helpers -------------------- */
function GlobalSearchCard({
  item,
  savedProfile,
  onOpenSaved,
  onSaveHandle,
  loading,
}: {
  item: GlobalSearchRecommendation;
  savedProfile?: InfluencerProfileDoc;
  onOpenSaved: (id: string) => void;
  onSaveHandle: (handle: string) => void;
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
                <p className="mt-4 text-sm leading-6 text-slate-600">
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
            ) : item.handle ? (
              <button
                type="button"
                className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                onClick={() => onSaveHandle(item.handle!)}
                disabled={loading}
              >
                Search & Save Creator
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-400 text-sm font-semibold cursor-not-allowed"
              >
                No Handle Available
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
                <div
                  key={video.videoId || `${video.title}-${video.publishedAt}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
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
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold whitespace-nowrap"
                          >
                            Open Video
                          </a>
                        ) : null}
                      </div>

                      {video.description ? (
                        <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                          {video.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
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

  const topics = data ? getTopicNames(data) : [];
  const channelUrl = data ? ytChannelUrl(data) : '';

  return (
    <div className="fixed inset-0 z-[130]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-[760px] bg-white border-l border-slate-200 shadow-2xl flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Creator Preview</h3>
            <p className="text-sm text-slate-500 mt-1">
              Review all creator data before saving to the database.
            </p>
          </div>

          <button
            type="button"
            className="p-2 rounded-xl hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/60">
          {loading || !data ? (
            <div className="px-6 py-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              Loading creator details...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-4">
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
                          {data.title || data.handle || '—'}
                        </h3>

                        {data.country ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                            {data.country}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 text-lg font-semibold text-blue-600">
                        {data.handle || '—'}
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

                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
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
                </div>

                <div className="border-t border-slate-200 bg-slate-50/80 p-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
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

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-4">
                        Description
                      </div>

                      <p className="text-sm leading-6 text-slate-600 whitespace-pre-line">
                        {data.description || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 p-6 bg-white">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-4">
                    Latest Videos
                  </div>

                  {!data.lastVideos?.length ? (
                    <div className="text-sm text-slate-500">No recent videos found.</div>
                  ) : (
                    <div className="space-y-3">
                      {data.lastVideos.slice(0, 8).map((video) => (
                        <div
                          key={video.videoId || video.title}
                          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                        >
                          <div className="text-sm font-semibold text-slate-900 line-clamp-2">
                            {video.title || 'Untitled video'}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {formatDate(video.publishedAt)} • {formatNumber(video.viewCount)} views •{' '}
                            {formatNumber(video.likeCount)} likes • {formatNumber(video.commentCount)} comments
                          </div>
                        </div>
                      ))}
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
              className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
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
