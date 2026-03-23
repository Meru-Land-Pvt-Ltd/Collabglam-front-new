'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ExternalLink,
  Mail,
  RefreshCw,
  Search,
  X,
  Download,
  Info,
  Filter,
} from 'lucide-react';
import swal from 'sweetalert';
import { post } from '@/lib/api';
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

type InfluencerFilters = {
  followersMin?: string;
  followersMax?: string;
  countries?: string[];
  country?: string;
  category?: string;
  categories?: string[];
};

type SortMode = 'engagement_upload' | 'engagement' | 'uploads' | 'created';

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

function buildSavedSearchText(raw: string) {
  const v = (raw || '').trim();
  if (!v) return '';
  const isHandleish = v.startsWith('@') || /^[A-Za-z0-9._-]+$/.test(v);
  return isHandleish ? normalizeHandle(v) : v;
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

function getSelectId(p: InfluencerProfileDoc) {
  return p.handleId || '';
}

function ytVideoUrl(videoId?: string) {
  if (!videoId) return '';
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function ytChannelUrl(p: InfluencerProfileDoc) {
  if (p.handle) return `https://www.youtube.com/${p.handle.replace(/^@/, '@')}`;
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
  return String(s || '').replace(/\s*\(.*?\)\s*$/, '').trim();
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
    return { sortBy: 'createdAt', sortOrder: 'desc' as const };
  }
  return { sortBy: 'engagementRateLast15', sortOrder: 'desc' as const };
}

function countryLabel(code: string) {
  const c = COUNTRY_OPTIONS.find((x) => x.code === code);
  return c ? `${c.code} — ${c.name}` : code;
}

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
      (c) => c.code.toLowerCase().includes(s) || c.name.toLowerCase().includes(s)
    );
  }, [q]);

  const summary = value?.length ? value.join(', ') : 'All';

  function updatePos() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ left: r.left, top: r.bottom + 8, width: r.width });
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
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
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
            className="fixed overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              maxHeight: 'min(70vh, 520px)',
            }}
          >
            <div className="border-b border-slate-200 p-3">
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(c.code)} />
                    <span className="text-sm text-slate-800">{countryLabel(c.code)}</span>
                  </label>
                );
              })}

              {!filtered.length ? (
                <div className="px-2 py-6 text-center text-sm text-slate-500">
                  No countries found
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-3">
              <button
                type="button"
                className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
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
        <span className="truncate text-sm text-slate-800">{summary}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {overlay}
    </>
  );
}

function cleanStr(v: unknown) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

export default function Page() {
  const searchParams = useSearchParams();
  const campaignId = cleanStr(searchParams.get('id'));
  const [profiles, setProfiles] = useState<InfluencerProfileDoc[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const [query, setQuery] = useState('');
  const [searchHint, setSearchHint] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const [filtersDraft, setFiltersDraft] = useState<InfluencerFilters>({
    followersMin: '1000',
    followersMax: '',
    countries: [],
    category: '',
  });

  const [filtersActive, setFiltersActive] = useState<InfluencerFilters>({
    followersMin: '1000',
    followersMax: '',
    countries: [],
    category: '',
  });

  const [sortModeDraft, setSortModeDraft] =
    useState<SortMode>('engagement_upload');
  const [sortModeActive, setSortModeActive] =
    useState<SortMode>('engagement_upload');

  const [downloadLimit, setDownloadLimit] = useState('500');

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

  const normalizedQuery = useMemo(() => normalizeHandle(query), [query]);

  const existingProfile = useMemo(() => {
    if (!normalizedQuery || !isValidHandle(normalizedQuery)) return undefined;
    return profilesByHandle.get(normalizedQuery.toLowerCase());
  }, [normalizedQuery, profilesByHandle]);

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

  function buildFilterPayload(f: InfluencerFilters): InfluencerFilters {
    const out: InfluencerFilters = {};

    if (String(f.followersMin || '').trim()) {
      out.followersMin = String(f.followersMin).trim();
    }
    if (String(f.followersMax || '').trim()) {
      out.followersMax = String(f.followersMax).trim();
    }

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

  function toggleSelect(handleId: string, checked: boolean) {
    setSelectedIds((prev) => ({ ...prev, [handleId]: checked }));
  }

  function clearSelection() {
    setSelectedIds({});
  }

async function addOutreach() {
  try {
    if (!campaignId) {
      await showErr('Campaign id missing.');
      return;
    }

    if (!selectedHandleIds.length) {
      await showErr('Select at least one influencer.');
      return;
    }

    await post('/pipeline/bulk-add', {
      campaignId,
      youtubeHandleIds: selectedHandleIds,
    });

    swal({ title: 'Done', text: 'Added to outreach pipeline.', icon: 'success' });
    clearSelection();
  } catch (e: any) {
    await showErr(e?.message || 'Failed to add to outreach.');
  }
}

  function selectAllOnPage(list: InfluencerProfileDoc[]) {
    const next: Record<string, boolean> = {};
    for (const it of list) {
      const hid = getSelectId(it);
      if (hid) next[hid] = true;
    }
    setSelectedIds((prev) => ({ ...prev, ...next }));
  }

  function clearSelectionOnPage(list: InfluencerProfileDoc[]) {
    setSelectedIds((prev) => {
      const next = { ...prev };
      for (const it of list) {
        const hid = getSelectId(it);
        if (hid) delete next[hid];
      }
      return next;
    });
  }

  const selectedHandleIds = useMemo(() => {
    return Object.entries(selectedIds)
      .filter(([, v]) => v)
      .map(([hid]) => hid);
  }, [selectedIds]);

  const selectedCount = useMemo(
    () => selectedHandleIds.length,
    [selectedHandleIds]
  );

  const selectableOnPage = useMemo(
    () => profiles.filter((p) => !!getSelectId(p)),
    [profiles]
  );

  const allOnPageSelected = useMemo(() => {
    if (!selectableOnPage.length) return false;
    return selectableOnPage.every((it) => !!selectedIds[getSelectId(it)]);
  }, [selectableOnPage, selectedIds]);

  const someOnPageSelected = useMemo(() => {
    if (!selectableOnPage.length) return false;
    return selectableOnPage.some((it) => !!selectedIds[getSelectId(it)]);
  }, [selectableOnPage, selectedIds]);

  const headerCheckState = useMemo(() => {
    if (allOnPageSelected) return true;
    if (someOnPageSelected) return 'indeterminate';
    return false;
  }, [allOnPageSelected, someOnPageSelected]);

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
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load saved data.');
    } finally {
      setListLoading(false);
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

    const maybeHandle = buildSavedSearchText(raw);
    if (isValidHandle(maybeHandle)) {
      const existing = profilesByHandle.get(maybeHandle.toLowerCase());
      setSearchHint(
        existing
          ? 'Already saved. Press Open Profile to jump to it.'
          : 'Not saved yet. Press Search & Save.'
      );
    } else {
      setSearchHint('Typing filters the saved database list.');
    }
  }, [query, profilesByHandle]);

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
        p.managedByAgency === true
          ? 'yes'
          : p.managedByAgency === false
            ? 'no'
            : 'unknown',
      topAudienceCountry: p.topAudienceCountry || '',
      averageAudienceAge:
        p.averageAudienceAge != null ? String(p.averageAudienceAge) : '',
      lastContactedAt: toDateInputValue(p.lastContactedAt),
      followUpDates: Array.isArray(p.followUpDates)
        ? p.followUpDates
          .map((x) => toDateInputValue(x))
          .filter(Boolean)
          .join(', ')
        : '',
      workingHandle: p.workingHandle || '',
    });

    setDetailsModalOpen(true);
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();

    const h = normalizeHandle(query);
    if (!h || !isValidHandle(h)) {
      await showErr('Please enter a valid handle like @MrBeast.');
      return;
    }

    const existing = profilesByHandle.get(h.toLowerCase());
    if (existing?.handleId) {
      openAndScrollTo(existing.handleId);
      return;
    }

    setSearchLoading(true);
    try {
      const resp = await post<SyncResponse>('/youtube/handel-data', {
        handle: h,
        videosLimit: 15,
      });

      if (resp?.status !== 'ok' || !resp?.data?.handleId) {
        throw new Error('Sync failed');
      }

      upsertProfile(resp.data);
      openAndScrollTo(resp.data.handleId);
      setSearchHint('Fetched and saved. Expanded below.');
      setQuery(h);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to fetch from YouTube.');
    } finally {
      setSearchLoading(false);
    }
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

  function applyFilters() {
    const next = { ...filtersDraft };
    setFiltersActive(next);

    const sortNext = sortModeDraft;
    setSortModeActive(sortNext);

    clearSelection();
    loadSaved(1, next, buildSavedSearchText(query), sortNext);
  }

  function clearFilters() {
    const empty: InfluencerFilters = {
      followersMin: '1000',
      countries: [],
      category: '',
    };

    setFiltersDraft(empty);
    setFiltersActive(empty);

    setSortModeDraft('engagement_upload');
    setSortModeActive('engagement_upload');

    clearSelection();
    loadSaved(1, empty, buildSavedSearchText(query), 'engagement_upload');
  }

  const activeChips = useMemo(
    () => chipText(buildFilterPayload(filtersActive)),
    [filtersActive]
  );

  async function downloadCsv() {
    const n = parseInt(downloadLimit, 10);
    if (!Number.isFinite(n) || n <= 0) {
      await showErr('Enter a valid download count.');
      return;
    }

    setDownloadLoading(true);
    try {
      const filterPayload = buildFilterPayload(filtersActive);
      const apiSort = sortToApi(sortModeActive);

      const API_BASE = (
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        ''
      ).replace(/\/$/, '');
      const url = API_BASE
        ? `${API_BASE}/youtube/export-csv`
        : `/youtube/export-csv`;

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          limit: n,
          sortBy: apiSort.sortBy,
          sortOrder: apiSort.sortOrder,
          search: buildSavedSearchText(query) || '',
          ...filterPayload,
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(txt || `Export failed (${resp.status})`);
      }

      const blob = await resp.blob();

      let filename = '';
      const cd = resp.headers.get('content-disposition') || '';
      const m = cd.match(/filename="([^"]+)"/i);
      if (m?.[1]) filename = m[1];
      if (!filename) filename = 'youtube_influencers.csv';

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to download CSV.');
    } finally {
      setDownloadLoading(false);
    }
  }

  async function downloadSelectedCsv() {
    if (!selectedHandleIds.length) {
      await showErr('Select at least 1 influencer.');
      return;
    }

    setDownloadLoading(true);
    try {
      const apiSort = sortToApi(sortModeActive);

      const API_BASE = (
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        ''
      ).replace(/\/$/, '');
      const url = API_BASE
        ? `${API_BASE}/youtube/export-csv`
        : `/youtube/export-csv`;

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          handleIds: selectedHandleIds,
          sortBy: apiSort.sortBy,
          sortOrder: apiSort.sortOrder,
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(txt || `Export failed (${resp.status})`);
      }

      const blob = await resp.blob();

      let filename = '';
      const cd = resp.headers.get('content-disposition') || '';
      const m = cd.match(/filename="([^"]+)"/i);
      if (m?.[1]) filename = m[1];
      if (!filename) filename = `selected_influencers_${selectedHandleIds.length}.csv`;

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to download selected CSV.');
    } finally {
      setDownloadLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">
            YouTube Influencer Profiles
          </h1>
          <p className="text-slate-600">
            Search saved influencers instantly. Use Search & Save only if the handle
            is not already in the database.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard title="Saved Profiles" value={formatNumber(total)} />
          <StatCard title="Selected" value={String(selectedCount)} />
          <StatCard
            title="Current Sort"
            value={
              sortModeActive === 'engagement_upload'
                ? 'Engagement + Uploads'
                : sortModeActive === 'engagement'
                  ? 'Engagement'
                  : sortModeActive === 'uploads'
                    ? 'Uploads / week'
                    : 'Newest'
            }
          />
        </div>

        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Search & Filters
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Filters, sort, export, and manual details are fully aligned now.
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
              </div>
            </div>
          </div>

          <form onSubmit={onSearch} className="space-y-5 p-6">
            <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <label className="mb-2 block text-xs font-medium text-slate-600">
                  YouTube Handle
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    value={query}
                    onChange={(e) => {
                      const v = e.target.value;
                      setQuery(v);

                      if (typeSearchRef.current) {
                        clearTimeout(typeSearchRef.current);
                      }

                      typeSearchRef.current = setTimeout(() => {
                        const searchText = buildSavedSearchText(v);
                        if (!searchText) {
                          loadSaved(
                            1,
                            filtersActiveRef.current,
                            '',
                            sortModeActiveRef.current
                          );
                          return;
                        }

                        loadSaved(
                          1,
                          filtersActiveRef.current,
                          searchText,
                          sortModeActiveRef.current
                        );
                      }, 350);
                    }}
                    placeholder="e.g. @MrBeast"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 lg:col-span-5 sm:grid-cols-2">
                <button
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  type="submit"
                  disabled={searchLoading}
                  title={existingProfile ? 'Jump to saved influencer' : 'Fetch from YouTube and save'}
                >
                  {searchLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Searching…
                    </>
                  ) : existingProfile ? (
                    'Open Profile'
                  ) : (
                    'Search & Save'
                  )}
                </button>

                <button
                  type="button"
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() =>
                    loadSaved(
                      1,
                      filtersActive,
                      buildSavedSearchText(query),
                      sortModeActive
                    )
                  }
                  disabled={listLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${listLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh List
                </button>
              </div>
            </div>

            {searchHint ? (
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="mt-0.5">
                  <Info className="h-5 w-5 text-slate-500" />
                </div>
                <p className="text-sm text-slate-700">{searchHint}</p>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Filters</div>
                    <div className="mt-0.5 text-xs text-slate-600">
                      Subscribers default to 1K–1M. Country is multi-select.
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={clearFilters}
                    disabled={listLoading}
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={applyFilters}
                    disabled={listLoading}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      Subscribers Min
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={filtersDraft.followersMin || ''}
                      onChange={(e) =>
                        setFiltersDraft((p) => ({
                          ...p,
                          followersMin: e.target.value,
                        }))
                      }
                      placeholder="1000"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      Subscribers Max
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={filtersDraft.followersMax || ''}
                      onChange={(e) =>
                        setFiltersDraft((p) => ({
                          ...p,
                          followersMax: e.target.value,
                        }))
                      }
                      placeholder="1000000"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      Country
                    </label>
                    <MultiCountrySelect
                      value={filtersDraft.countries || []}
                      onChange={(next) =>
                        setFiltersDraft((p) => ({ ...p, countries: next }))
                      }
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      Category
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={filtersDraft.category || ''}
                      onChange={(e) =>
                        setFiltersDraft((p) => ({ ...p, category: e.target.value }))
                      }
                      placeholder="Entertainment,Lifestyle"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      Sort
                    </label>
                    <select
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={sortModeDraft}
                      onChange={(e) =>
                        setSortModeDraft(e.target.value as SortMode)
                      }
                    >
                      <option value="engagement_upload">
                        Engagement ↓ then Uploads/week ↓
                      </option>
                      <option value="engagement">Engagement ↓</option>
                      <option value="uploads">Uploads/week ↓</option>
                      <option value="created">Newest ↓</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-200 pt-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <input
                          className="w-[150px] rounded-xl border border-slate-300 bg-white px-3 py-3 pr-14 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                          value={downloadLimit}
                          onChange={(e) => setDownloadLimit(e.target.value)}
                          placeholder="500"
                          inputMode="numeric"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                          rows
                        </span>
                      </div>

                      {!campaignId && (
                        <>
                          <button
                            type="button"
                            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={downloadCsv}
                            disabled={downloadLoading}
                          >
                            <Download className="h-4 w-4" />
                            {downloadLoading ? 'Downloading…' : 'Download CSV'}
                          </button>

                          <button
                            type="button"
                            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={downloadSelectedCsv}
                            disabled={downloadLoading || selectedCount === 0}
                          >
                            <Download className="h-4 w-4" />
                            Download Selected ({selectedCount})
                          </button>
                        </>
                      )}

                      {selectedCount ? (
                        <button
                          type="button"
                          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                          onClick={clearSelection}
                          disabled={downloadLoading}
                        >
                          Clear Selection
                        </button>
                      ) : null}

                      {selectedCount && campaignId ? (
                        <button
                          type="button"
                          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                          onClick={addOutreach}
                          disabled={downloadLoading}
                        >
                          Add to Outreach
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-600">
                <b className="text-slate-900">{formatNumber(total)}</b> total
              </span>
              {selectedCount ? (
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs text-white">
                  Selected: {selectedCount}
                </span>
              ) : null}
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
            <div className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-1 flex items-center">
                <Checkbox
                  checked={headerCheckState as any}
                  onCheckedChange={(v: any) => {
                    const checked = !!v;
                    checked ? selectAllOnPage(profiles) : clearSelectionOnPage(profiles);
                  }}
                />
              </div>

              <div className="col-span-9">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Handle
                </div>
              </div>

              <div className="col-span-2 text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Actions
                </div>
              </div>
            </div>
          </div>

          {listLoading && profiles.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin" />
              Loading profiles...
            </div>
          ) : null}

          {!listLoading && profiles.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              No matching saved profiles.
            </div>
          ) : null}

          <div className="divide-y divide-slate-200">
            {profiles.map((p) => {
              const cardId = getCardId(p);
              const selectId = getSelectId(p);
              const isOpen = !!expanded[cardId];
              const checked = selectId ? !!selectedIds[selectId] : false;
              const thumb =
                p.thumbnails?.default?.url ||
                p.thumbnails?.medium?.url ||
                p.thumbnails?.high?.url;
              const channelUrl = ytChannelUrl(p);
              const topics = getTopicNames(p);

              return (
                <div key={cardId} id={`card-${cardId}`} className="transition-colors hover:bg-slate-50">
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-12 items-start gap-3">
                      <div className="col-span-1 pt-2">
                        <Checkbox
                          checked={checked}
                          disabled={!selectId}
                          onCheckedChange={(v: any) => {
                            if (!selectId) return;
                            toggleSelect(selectId, !!v);
                          }}
                        />
                      </div>

                      <div className="col-span-9 min-w-0">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : null}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate text-lg font-semibold text-slate-900">
                                {p.handle || '—'}
                              </h3>
                              {p.platform ? (
                                <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-600">
                                  {p.platform}
                                </span>
                              ) : null}
                            </div>
                            <div className="truncate text-sm text-slate-600">
                              {p.title || '—'}
                            </div>
                          </div>
                        </div>

                        <div className="mb-3 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                          <Metric label="Country" value={p.country || '—'} />
                          <Metric
                            label="Subscribers"
                            value={formatNumber(p.subscriberCount)}
                          />
                          <Metric
                            label="Avg Views (15)"
                            value={formatNumber(p.avgViewsLast15)}
                          />
                          <Metric
                            label="Engagement"
                            value={formatPercent(p.engagementRateLast15)}
                          />
                          <Metric
                            label="Uploads/week"
                            value={
                              p.uploadFrequencyPerWeek != null
                                ? String(p.uploadFrequencyPerWeek)
                                : '—'
                            }
                            className="hidden lg:block"
                          />
                          <Metric
                            label="Email"
                            value={p.email || '—'}
                            className="hidden lg:block"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span>Synced: {formatDate(p.syncedAt)}</span>
                          {p.lastSponsor ? (
                            <span>Last Sponsor: {p.lastSponsor}</span>
                          ) : null}
                          {p.managedByAgency != null ? (
                            <span>Agency: {formatBool(p.managedByAgency)}</span>
                          ) : null}
                        </div>

                        {topics.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {topics.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700"
                              >
                                {t}
                              </span>
                            ))}
                            {topics.length > 4 ? (
                              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] text-white">
                                +{topics.length - 4}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-2">
                        {channelUrl ? (
                          <a
                            href={channelUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Channel
                          </a>
                        ) : null}

                        <button
                          type="button"
                          className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                          onClick={() => openDetailsModal(p)}
                        >
                          <Mail className="h-4 w-4" />
                          Edit
                        </button>

                        <button
                          type="button"
                          className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                          onClick={() => toggleExpand(cardId)}
                          aria-expanded={isOpen}
                        >
                          <ChevronDown
                            className={`h-5 w-5 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''
                              }`}
                          />
                        </button>
                      </div>
                    </div>

                    {isOpen ? (
                      <div className="mt-6 space-y-6 border-t border-slate-200 pt-6">

                        {/* {p.bannerUrl ? (
                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <img
                              src={p.bannerUrl}
                              alt=""
                              className="h-40 w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : null} */}

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                          <div className="rounded-xl bg-slate-50 p-4">
                            <h4 className="mb-3 font-semibold text-slate-900">
                              Channel Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              <Row label="Language" value={p.defaultLanguage || '—'} />
                              <Row label="Channel ID" value={p.channelId || '—'} mono />
                              <Row label="Total Videos" value={formatNumber(p.totalVideoCount)} />
                              <Row label="Total Views" value={formatNumber(p.totalViewCount)} />
                              <Row label="Instagram" value={p.instagramHandle || '—'} />
                              <Row
                                label="Categories"
                                value={topics.length ? topics.join(', ') : '—'}
                              />
                              <Row label="Last upload" value={formatDate(p.lastUploadAt)} />
                              <Row label="Last video" value={p.lastVideoTitle || '—'} />

                              {p.lastVideoId ? (
                                <div className="pt-2">
                                  <a
                                    href={ytVideoUrl(p.lastVideoId)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Watch latest video
                                  </a>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-4">
                            <h4 className="mb-3 font-semibold text-slate-900">
                              Metrics
                            </h4>
                            <div className="space-y-2 text-sm">
                              <Row label="Subscribers" value={formatNumber(p.subscriberCount)} />
                              <Row label="Avg Views (last 15)" value={formatNumber(p.avgViewsLast15)} />
                              <Row
                                label="Engagement (last 15)"
                                value={formatPercent(p.engagementRateLast15)}
                              />
                              <Row
                                label="Uploads/week"
                                value={
                                  p.uploadFrequencyPerWeek != null
                                    ? p.uploadFrequencyPerWeek
                                    : '—'
                                }
                              />
                              <Row
                                label="Avg days between uploads"
                                value={
                                  p.avgDaysBetweenUploads != null
                                    ? p.avgDaysBetweenUploads
                                    : '—'
                                }
                              />
                              <Row label="Created" value={formatDate(p.createdAt)} />
                              <Row label="Updated" value={formatDate(p.updatedAt)} />
                              <Row label="Synced" value={formatDate(p.syncedAt)} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4">
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
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() =>
                  loadSaved(
                    Math.max(1, page - 1),
                    filtersActive,
                    buildSavedSearchText(query),
                    sortModeActive
                  )
                }
                disabled={listLoading || page <= 1}
              >
                Previous
              </button>

              <button
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() =>
                  loadSaved(
                    page + 1,
                    filtersActive,
                    buildSavedSearchText(query),
                    sortModeActive
                  )
                }
                disabled={listLoading || !hasNext}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {detailsModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Add / Update Details
              </h3>
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
                      setDetailsForm((p) => ({
                        ...p,
                        workingHandle: e.target.value,
                      }))
                    }
                    placeholder="@mrbeast_official"
                  />
                </Field>

                <Field label="Last Sponsor">
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    value={detailsForm.lastSponsor}
                    onChange={(e) =>
                      setDetailsForm((p) => ({
                        ...p,
                        lastSponsor: e.target.value,
                      }))
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
                        managedByAgency: e.target.value as any,
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
                    placeholder="US / IN / UK"
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
                  <Field label="Follow-up Dates">
                    <textarea
                      className="min-h-[90px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={detailsForm.followUpDates}
                      onChange={(e) =>
                        setDetailsForm((p) => ({
                          ...p,
                          followUpDates: e.target.value,
                        }))
                      }
                      placeholder="2026-02-26, 2026-03-02"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Use <span className="font-mono">YYYY-MM-DD</span>. Separate by comma or new line.
                    </p>
                  </Field>
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
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1 text-xs text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: any;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-600">{label}:</span>
      <span
        className={`text-right font-medium text-slate-900 ${mono ? 'font-mono text-xs' : ''
          }`}
      >
        {String(value)}
      </span>
    </div>
  );
}