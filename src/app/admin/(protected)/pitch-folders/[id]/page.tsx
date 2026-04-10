'use client';

import React, {
  ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FolderKanban,
  Heart,
  Link2,
  Loader2,
  Mail,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  UploadCloud,
  Users,
  X,
  XCircle,
  Youtube,
} from 'lucide-react';
import swal from 'sweetalert';

import { get, post } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type AdminMini = {
  _id?: string;
  adminId?: string;
  name?: string;
  email?: string;
  proxyEmail?: string;
  role?: string;
  designation?: string;
  teamType?: string | null;
  status?: string;
};

type FolderShare = {
  token?: string;
  url?: string;
  generatedAt?: string | null;
  sharedBy?: {
    _id?: string;
    adminId?: string;
    name?: string;
    email?: string;
    role?: string;
    designation?: string;
    teamType?: string | null;
  } | null;
};

type FolderItemMediaKit = {
  s3Key?: string;
  fileName?: string;
  mimeType?: string;
  size?: number | null;
  uploadedAt?: string | null;
  showToBrand?: boolean;
  requestStatus?: 'none' | 'requested' | 'approved' | 'rejected';
  requestedAt?: string | null;
  reviewedAt?: string | null;
};

type FolderItemMediaKitLink = {
  url?: string;
  generatedAt?: string | null;
  showToBrand?: boolean;
  requestStatus?: 'none' | 'requested' | 'approved' | 'rejected';
  requestedAt?: string | null;
  reviewedAt?: string | null;
};

type FolderItemMediaKitAccess = {
  hasAdded?: boolean;
  allowed?: boolean;
  visibleSource?: 'pdf' | 'link' | null;
  requestStatus?: 'none' | 'requested' | 'approved' | 'rejected';
  requestedAt?: string | null;
  availableOnRequest?: boolean;
  buttonLabel?: string;
  url?: string;
};

type RateCardHistoryEntry = {
  _id?: string;
  field?: 'influencerRateCard' | 'platformRateCard';
  previousValue?: string;
  newValue?: string;
  changedAt?: string | null;
  changedByAdminId?: string | null;
};

type FolderItem = {
  _id: string;
  provider?: string;
  name?: string;
  handle?: string;
  followers?: number | null;
  primaryLink?: string;
  links?: string[];
  niche?: string[];
  email?: string;
  country?: string;
  selectionReason?: string;
  goodFit?: boolean | null;
  influencerRateCard?: string;
  platformRateCard?: string;
  rateCardCurrency?: string;
  rateCardHistory?: RateCardHistoryEntry[];
  ourFeePct?: number | null;
  comments?: string;
  mediaKit?: FolderItemMediaKit | null;
  mediaKitLink?: FolderItemMediaKitLink | null;
  mediaKitAccess?: FolderItemMediaKitAccess | null;
};

type FolderResponse = {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  brandVisibleItemCount?: number | null;
  showFullListToBrand?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: AdminMini | null;
  updatedBy?: AdminMini | null;
  share?: FolderShare;
  items?: FolderItem[];
};

type DrawerMode = 'create' | 'edit';
type RateCardTab = 'influencer' | 'admin' | 'history';

type DraftState = {
  provider: string;
  name: string;
  handle: string;
  followers: string | number;
  niche: string;
  email: string;
  country: string;
  selectionReason: string;
  goodFit: boolean;
  influencerRateCard: string;
  platformRateCard: string;
  rateCardCurrency: string;
  ourFeePct: string | number;
  comments: string;
};

const DASH = '--';
const MEDIAKIT_BUCKET =
  process.env.NEXT_PUBLIC_MEDIAKIT_BUCKET || 'pitch-mediakit';
const MEDIAKIT_REGION =
  process.env.NEXT_PUBLIC_MEDIAKIT_REGION || 'us-east-1';

const DEFAULT_DRAFT: DraftState = {
  provider: 'instagram',
  name: '',
  handle: '',
  followers: '',
  niche: '',
  email: '',
  country: '',
  selectionReason: '',
  goodFit: false,
  influencerRateCard: '',
  platformRateCard: '',
  rateCardCurrency: 'USD',
  ourFeePct: '',
  comments: '',
};

function showErr(message: string) {
  return swal({
    title: 'Error',
    text: message || 'Something went wrong.',
    icon: 'error',
  });
}

function showSuccess(message: string) {
  return swal({
    title: 'Success',
    text: message,
    icon: 'success',
  });
}

function asText(v: unknown) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function parseCsv(v: string) {
  return (v || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function toNullableNumber(v: unknown) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toNullableInteger(v: unknown) {
  const n = toNullableNumber(v);
  return n !== null && Number.isInteger(n) && n >= 0 ? n : null;
}

function formatNumber(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return DASH;
  return new Intl.NumberFormat('en-IN').format(n);
}

function cleanText(value?: string | null) {
  return String(value || '').trim();
}

function getHandleWithoutAt(handle?: string) {
  return cleanText(handle).replace(/^@+/, '');
}

function ensureAbsoluteUrl(url?: string | null) {
  const value = cleanText(url);
  if (!value) return '';

  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function buildFallbackProfileUrl(provider?: string, handle?: string) {
  const username = getHandleWithoutAt(handle);
  if (!username) return '';

  const p = cleanText(provider).toLowerCase();

  if (p === 'youtube') return `https://www.youtube.com/@${username}`;
  if (p === 'instagram') return `https://www.instagram.com/${username}/`;
  if (p === 'tiktok') return `https://www.tiktok.com/@${username}`;

  return '';
}

function getProfileUrl(row: FolderItem) {
  const primary = ensureAbsoluteUrl(row.primaryLink);
  if (primary) return primary;

  const firstLink =
    Array.isArray(row.links) && row.links.length
      ? ensureAbsoluteUrl(row.links[0])
      : '';
  if (firstLink) return firstLink;

  return buildFallbackProfileUrl(row.provider, row.handle);
}

function formatDate(iso?: string | null) {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(d);
}

function formatDateTime(iso?: string | null) {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function prettyText(value?: string | null) {
  const v = String(value || '').trim();
  if (!v) return DASH;
  return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeHandle(value: string) {
  const raw = asText(value).replace(/^@+/, '');
  return raw ? `@${raw}` : '';
}

function buildPublicMediaKitUrl(mediaKit?: FolderItemMediaKit | null) {
  const s3Key = asText(mediaKit?.s3Key);
  if (!s3Key) return '';

  const encodedKey = s3Key
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');

  return `https://${MEDIAKIT_BUCKET}.s3.${MEDIAKIT_REGION}.amazonaws.com/${encodedKey}`;
}

function buildPayloadFromDraft(draft: DraftState) {
  return {
    provider: asText(draft.provider).toLowerCase(),
    name: asText(draft.name),
    handle: normalizeHandle(asText(draft.handle)),
    followers: toNullableNumber(draft.followers),
    niche: parseCsv(asText(draft.niche)),
    email: asText(draft.email),
    country: asText(draft.country),
    selectionReason: asText(draft.selectionReason),
    goodFit: !!draft.goodFit,
    influencerRateCard: asText(draft.influencerRateCard),
    platformRateCard: asText(draft.platformRateCard),
    rateCardCurrency: asText(draft.rateCardCurrency || 'USD').toUpperCase(),
    ourFeePct: toNullableNumber(draft.ourFeePct),
    comments: asText(draft.comments),
  };
}

function buildDraftFromRow(row: FolderItem): DraftState {
  return {
    provider: row.provider || 'instagram',
    name: row.name || '',
    handle: row.handle || '',
    followers: row.followers ?? '',
    niche: Array.isArray(row.niche) ? row.niche.join(', ') : '',
    email: row.email || '',
    country: row.country || '',
    selectionReason: row.selectionReason || '',
    goodFit: !!row.goodFit,
    influencerRateCard: row.influencerRateCard || '',
    platformRateCard: row.platformRateCard || '',
    rateCardCurrency: row.rateCardCurrency || 'USD',
    ourFeePct: row.ourFeePct ?? '',
    comments: row.comments || '',
  };
}

type DiffToken = {
  text: string;
  changed: boolean;
};

type DiffRow = {
  previousTokens: DiffToken[];
  nextTokens: DiffToken[];
  changed: boolean;
};

function tokenizeWords(value: string) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function buildWordTokenDiff(previousLine = '', newLine = '') {
  const prevWords = tokenizeWords(previousLine);
  const nextWords = tokenizeWords(newLine);

  const m = prevWords.length;
  const n = nextWords.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0)
  );

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (prevWords[i] === nextWords[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const previousTokens: DiffToken[] = [];
  const nextTokens: DiffToken[] = [];

  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (prevWords[i] === nextWords[j]) {
      previousTokens.push({ text: prevWords[i], changed: false });
      nextTokens.push({ text: nextWords[j], changed: false });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      previousTokens.push({ text: prevWords[i], changed: true });
      i += 1;
    } else {
      nextTokens.push({ text: nextWords[j], changed: true });
      j += 1;
    }
  }

  while (i < m) {
    previousTokens.push({ text: prevWords[i], changed: true });
    i += 1;
  }

  while (j < n) {
    nextTokens.push({ text: nextWords[j], changed: true });
    j += 1;
  }

  return {
    previousTokens,
    nextTokens,
    changed:
      previousTokens.some((token) => token.changed) ||
      nextTokens.some((token) => token.changed),
  };
}

function buildLineDiff(previousValue?: string, newValue?: string) {
  const prevLines = String(previousValue || '').split(/\r?\n/);
  const nextLines = String(newValue || '').split(/\r?\n/);
  const max = Math.max(prevLines.length, nextLines.length, 1);

  return Array.from({ length: max }, (_, index) =>
    buildWordTokenDiff(prevLines[index] ?? '', nextLines[index] ?? '')
  );
}

function slugifyFileName(value?: string | null) {
  const base = asText(value) || 'pitch-folder';
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'pitch-folder'
  );
}

function escapeCsvCell(value: unknown) {
  const text = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildRowsCsv(rows: FolderItem[]) {
  const headers = [
    'Provider',
    'Name',
    'Handle',
    'Followers',
    'Niche',
    'Email',
    'Country',
    'Selection Reason',
    'Good Fit',
    'Influencer Rate Card',
    'Platform Rate Card',
    'Comments',
    'Media Kit Added',
    'Media Kit Allowed To Brand',
    'Media Kit Visible Source',
    'Media Kit Request Status',
    'Media Kit Requested At',
    'Media Kit Link',
    'Media Kit Link Visible To Brand',
    'Media Kit PDF Visible To Brand',
  ];

  const csvRows = rows.map((row) => [
    row.provider || '',
    row.name || '',
    row.handle || '',
    row.followers ?? '',
    Array.isArray(row.niche) ? row.niche.join(', ') : '',
    row.email || '',
    row.country || '',
    row.selectionReason || '',
    row.goodFit ? 'Yes' : 'No',
    row.influencerRateCard || '',
    row.platformRateCard || '',
    row.comments || '',
    row.mediaKitAccess?.hasAdded ? 'Yes' : 'No',
    row.mediaKitAccess?.allowed ? 'Yes' : 'No',
    row.mediaKitAccess?.visibleSource || '',
    row.mediaKitAccess?.requestStatus || '',
    row.mediaKitAccess?.requestedAt || '',
    row.mediaKitLink?.url || '',
    row.mediaKitLink?.showToBrand ? 'Yes' : 'No',
    row.mediaKit?.showToBrand ? 'Yes' : 'No',
  ]);

  return [headers, ...csvRows]
    .map((line) => line.map(escapeCsvCell).join(','))
    .join('\n');
}

const ProviderBadge = memo(function ProviderBadge({
  provider,
}: {
  provider?: string;
}) {
  const value = String(provider || 'instagram').toLowerCase();

  const tone =
    value === 'youtube'
      ? 'bg-red-50 text-red-700 ring-red-200'
      : value === 'instagram'
        ? 'bg-pink-50 text-pink-700 ring-pink-200'
        : 'bg-slate-100 text-slate-800 ring-slate-200';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}
    >
      {prettyText(value)}
    </span>
  );
});

const StatusBadge = memo(function StatusBadge({
  value,
}: {
  value?: 'none' | 'requested' | 'approved' | 'rejected';
}) {
  const tone =
    value === 'approved'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : value === 'requested'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : value === 'rejected'
          ? 'bg-rose-50 text-rose-700 ring-rose-200'
          : 'bg-slate-100 text-slate-700 ring-slate-200';

  const label =
    value === 'approved'
      ? 'Approved'
      : value === 'requested'
        ? 'Requested'
        : value === 'rejected'
          ? 'Rejected'
          : 'No Request';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${tone}`}
    >
      {label}
    </span>
  );
});

const AssetCheck = memo(function AssetCheck({
  label,
  ok,
}: {
  label: string;
  ok: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${ok
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        : 'bg-rose-50 text-rose-700 ring-rose-200'
        }`}
    >
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      {label}
    </span>
  );
});

const AccessBadge = memo(function AccessBadge({
  access,
}: {
  access?: FolderItemMediaKitAccess | null;
}) {
  if (!access?.hasAdded) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
        Not Added
      </span>
    );
  }

  if (access.allowed) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
        Allowed
      </span>
    );
  }

  if (access.requestStatus === 'requested') {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
        Requested
      </span>
    );
  }

  if (access.requestStatus === 'rejected') {
    return (
      <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">
      Available on Request
    </span>
  );
});

const StatCard = memo(function StatCard({
  title,
  value,
  icon,
  hint,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
});

const Field = memo(function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
});

const Toggle = memo(function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? 'bg-slate-900' : 'bg-slate-300'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
      />
    </button>
  );
});

const ModalShell = memo(function ModalShell({
  open,
  title,
  description,
  onClose,
  children,
  maxWidthClass = 'max-w-5xl',
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`relative z-10 flex max-h-[92vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
});

const TabButton = memo(function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${active
        ? 'bg-slate-900 text-white'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
    >
      {label}
    </button>
  );
});

const RateCardPanel = memo(function RateCardPanel({
  title,
  value,
  currency,
}: {
  title: string;
  value?: string;
  currency?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border bg-slate-50 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <Badge variant="secondary">{currency || 'USD'}</Badge>
        </div>
        <div className="mt-4 min-h-[340px] rounded-2xl border bg-white p-4 text-sm leading-7 whitespace-pre-wrap text-slate-700">
          {value || DASH}
        </div>
      </div>
    </div>
  );
});

const DiffWordLine = memo(function DiffWordLine({
  tokens,
  emptyLabel = '—',
  tone,
}: {
  tokens: DiffToken[];
  emptyLabel?: string;
  tone: 'previous' | 'next';
}) {
  const changedClasses =
    tone === 'previous'
      ? 'bg-rose-100 text-rose-900 ring-rose-200'
      : 'bg-emerald-100 text-emerald-900 ring-emerald-200';

  if (!tokens.length) {
    return <span className="text-slate-400">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tokens.map((token, index) => (
        <span
          key={`${token.text}-${index}`}
          className={`rounded-md px-1.5 py-0.5 text-xs leading-5 ${token.changed
            ? `ring-1 ring-inset ${changedClasses}`
            : 'text-slate-700'
            }`}
        >
          {token.text}
        </span>
      ))}
    </div>
  );
});

const HistoryComparisonCard = memo(function HistoryComparisonCard({
  entry,
}: {
  entry: RateCardHistoryEntry;
}) {
  const diffRows = useMemo(
    () => buildLineDiff(entry.previousValue, entry.newValue),
    [entry.previousValue, entry.newValue]
  );

  return (
    <div className="rounded-2xl border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {entry.field === 'influencerRateCard'
              ? 'Influencer Rate Card'
              : 'Admin Rate Card'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(entry.changedAt)}
          </p>
        </div>
        <Badge variant="outline">Change Logged</Badge>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Previous
          </p>
          <div className="overflow-hidden rounded-xl border bg-slate-50">
            {diffRows.map((row, index) => (
              <div
                key={`prev-row-${index}`}
                className={`border-b px-3 py-2 last:border-b-0 ${row.changed ? 'bg-rose-50/60' : 'bg-white'
                  }`}
              >
                <DiffWordLine
                  tokens={row.previousTokens}
                  tone="previous"
                  emptyLabel="—"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            New
          </p>
          <div className="overflow-hidden rounded-xl border bg-slate-50">
            {diffRows.map((row, index) => (
              <div
                key={`next-row-${index}`}
                className={`border-b px-3 py-2 last:border-b-0 ${row.changed ? 'bg-emerald-50/60' : 'bg-white'
                  }`}
              >
                <DiffWordLine
                  tokens={row.nextTokens}
                  tone="next"
                  emptyLabel="—"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

type DrawerFormProps = {
  open: boolean;
  mode: DrawerMode;
  draft: DraftState;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onDraftFieldChange: (
    key: keyof DraftState,
    value: string | number | boolean
  ) => void;
};

const DrawerForm = memo(function DrawerForm({
  open,
  mode,
  draft,
  saving,
  onClose,
  onSave,
  onDraftFieldChange,
}: DrawerFormProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              {mode === 'create' ? 'Add Influencer' : 'Edit Influencer'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'create'
                ? 'Fill all influencer details in the side modal.'
                : 'Update the influencer details in the side modal.'}
            </p>
          </div>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <Input
                  value={draft.name}
                  onChange={(e) => onDraftFieldChange('name', e.target.value)}
                  placeholder="Creator name"
                />
              </Field>

              <Field label="Provider">
                <select
                  value={draft.provider}
                  onChange={(e) => onDraftFieldChange('provider', e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </Field>

              <Field label="Handle">
                <Input
                  value={draft.handle}
                  onChange={(e) => onDraftFieldChange('handle', e.target.value)}
                  placeholder="@creator"
                />
              </Field>

              <Field label="Followers">
                <Input
                  type="number"
                  value={draft.followers}
                  onChange={(e) =>
                    onDraftFieldChange('followers', e.target.value)
                  }
                  placeholder="150000"
                />
              </Field>

              <Field label="Niche" hint="Comma separated values">
                <Input
                  value={draft.niche}
                  onChange={(e) => onDraftFieldChange('niche', e.target.value)}
                  placeholder="beauty, fashion, lifestyle"
                />
              </Field>

              <Field label="Email">
                <Input
                  value={draft.email}
                  onChange={(e) => onDraftFieldChange('email', e.target.value)}
                  placeholder="creator@email.com"
                />
              </Field>

              <Field label="Country">
                <Input
                  value={draft.country}
                  onChange={(e) =>
                    onDraftFieldChange('country', e.target.value)
                  }
                  placeholder="United States"
                />
              </Field>
            </div>

            <Field label="Selection Reason">
              <Textarea
                value={draft.selectionReason}
                onChange={(e) =>
                  onDraftFieldChange('selectionReason', e.target.value)
                }
                rows={4}
                placeholder="Why this creator is included in the pitch"
              />
            </Field>

            <div className="grid gap-4 xl:grid-cols-2">
              <Field
                label="Influencer Rate Card"
                hint="Exact rate card received from the influencer."
              >
                <Textarea
                  value={draft.influencerRateCard}
                  onChange={(e) =>
                    onDraftFieldChange('influencerRateCard', e.target.value)
                  }
                  rows={12}
                />
              </Field>

              <Field
                label="Platform Rate Card"
                hint="Edited rate card that we show on behalf of the influencer."
              >
                <Textarea
                  value={draft.platformRateCard}
                  onChange={(e) =>
                    onDraftFieldChange('platformRateCard', e.target.value)
                  }
                  rows={12}
                />
              </Field>
            </div>

            <Field label="Comments">
              <Textarea
                value={draft.comments}
                onChange={(e) =>
                  onDraftFieldChange('comments', e.target.value)
                }
                rows={4}
                placeholder="Internal comments"
              />
            </Field>
          </div>
        </div>

        <div className="border-t px-6 py-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-xl" onClick={onClose}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={onSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {mode === 'create' ? 'Save Influencer' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

type PdfViewerModalProps = {
  open: boolean;
  title: string;
  url: string;
  onClose: () => void;
};

const PdfViewerModal = memo(function PdfViewerModal({
  open,
  title,
  url,
  onClose,
}: PdfViewerModalProps) {
  return (
    <ModalShell
      open={open}
      title={title || 'Media Kit PDF'}
      description="Previewing uploaded Media Kit PDF"
      onClose={onClose}
      maxWidthClass="max-w-7xl"
    >
      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in New Tab
        </Button>
      </div>
      <div className="h-[70vh] rounded-2xl border bg-slate-100 p-3">
        <iframe
          src={url}
          title={title || 'Media Kit PDF Preview'}
          className="h-full w-full rounded-2xl border bg-white"
        />
      </div>
    </ModalShell>
  );
});

type RateCardModalProps = {
  item: FolderItem | null;
  tab: RateCardTab;
  onClose: () => void;
  onTabChange: (tab: RateCardTab) => void;
};

const RateCardModal = memo(function RateCardModal({
  item,
  tab,
  onClose,
  onTabChange,
}: RateCardModalProps) {
  const rateCardHistory = useMemo(() => {
    if (!item) return [];
    return [...(item.rateCardHistory || [])].sort((a, b) => {
      const aTime = a.changedAt ? new Date(a.changedAt).getTime() : 0;
      const bTime = b.changedAt ? new Date(b.changedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [item]);

  return (
    <ModalShell
      open={!!item}
      title={item ? `${item.name || 'Influencer'} - Rate Cards` : 'Rate Cards'}
      description="Review influencer rate card, admin rate card, and change history."
      onClose={onClose}
      maxWidthClass="max-w-6xl"
    >
      {item ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <TabButton
              active={tab === 'influencer'}
              label="Influencer"
              onClick={() => onTabChange('influencer')}
            />
            <TabButton
              active={tab === 'admin'}
              label="Admin"
              onClick={() => onTabChange('admin')}
            />
            <TabButton
              active={tab === 'history'}
              label="History"
              onClick={() => onTabChange('history')}
            />
          </div>

          {tab === 'influencer' ? (
            <RateCardPanel
              title="Influencer Rate Card"
              value={item.influencerRateCard}
              currency={item.rateCardCurrency}
            />
          ) : null}

          {tab === 'admin' ? (
            <RateCardPanel
              title="Admin / Platform Rate Card"
              value={item.platformRateCard}
              currency={item.rateCardCurrency}
            />
          ) : null}

          {tab === 'history' ? (
            <div className="space-y-4">
              {rateCardHistory.length ? (
                rateCardHistory.map((entry) => (
                  <HistoryComparisonCard
                    key={entry._id || `${entry.changedAt}-${entry.field}`}
                    entry={entry}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed bg-slate-50 p-10 text-center text-sm text-slate-500">
                  No rate card history available yet.
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </ModalShell>
  );
});

type MediaKitModalProps = {
  item: FolderItem | null;
  actionLoadingKey: string;
  onClose: () => void;
  onGenerateLink: (row: FolderItem) => Promise<void>;
  onPickPdf: (itemId: string) => void;
  onToggleLink: (row: FolderItem, nextValue: boolean) => Promise<void>;
  onTogglePdf: (row: FolderItem, nextValue: boolean) => Promise<void>;
  onCopyLink: (url: string) => Promise<void>;
  onOpenPdf: (row: FolderItem) => void;
  onRemovePdf: (itemId: string) => Promise<void>;
};

const MediaKitModal = memo(function MediaKitModal({
  item,
  actionLoadingKey,
  onClose,
  onGenerateLink,
  onPickPdf,
  onToggleLink,
  onTogglePdf,
  onCopyLink,
  onOpenPdf,
  onRemovePdf,
}: MediaKitModalProps) {
  if (!item) return null;

  const hasLink = !!asText(item.mediaKitLink?.url);
  const hasPdf = !!asText(item.mediaKit?.s3Key);
  const access = item.mediaKitAccess;
  const visibleSourceLabel =
    access?.visibleSource === 'pdf'
      ? 'PDF'
      : access?.visibleSource === 'link'
        ? 'Link'
        : DASH;

  return (
    <ModalShell
      open={!!item}
      title={`${item.name || 'Influencer'} - Media Kit`}
      description="Manage link, PDF, and the single brand-facing media kit access state."
      onClose={onClose}
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-5">

        <div className="rounded-3xl border bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-950">
                Media Kit Center
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Generate link, upload PDF, preview files, and switch the visible
                brand source.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => onGenerateLink(item)}
                disabled={actionLoadingKey === `link-generate:${item._id}`}
              >
                {actionLoadingKey === `link-generate:${item._id}` ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="mr-2 h-4 w-4" />
                )}
                Get Media Kit Link
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => onPickPdf(item._id)}
                disabled={actionLoadingKey === `pdf-upload:${item._id}`}
              >
                {actionLoadingKey === `pdf-upload:${item._id}` ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="mr-2 h-4 w-4" />
                )}
                Upload PDF
              </Button>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Media Kit Link
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Generated profile/media kit link for this creator.
                  </p>
                </div>
                <StatusBadge value={item.mediaKitLink?.requestStatus} />
              </div>

              {hasLink ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border bg-white p-3">
                    <a
                      href={asText(item.mediaKitLink?.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Link
                    </a>
                    <p className="mt-2 break-all text-xs text-slate-500">
                      {asText(item.mediaKitLink?.url)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Generated: {formatDateTime(item.mediaKitLink?.generatedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-950">
                        Show Link To Brand
                      </p>
                      <p className="text-xs text-slate-500">
                        Turning this on will make Link the only visible source.
                      </p>
                    </div>
                    <Toggle
                      checked={!!item.mediaKitLink?.showToBrand}
                      onChange={(next) => onToggleLink(item, next)}
                      disabled={actionLoadingKey === `link-toggle:${item._id}`}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => onCopyLink(asText(item.mediaKitLink?.url))}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed bg-white p-4 text-sm text-slate-500">
                  No Media Kit Link generated yet.
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Media Kit PDF
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Upload and manage the PDF version for the brand.
                  </p>
                </div>
                <StatusBadge value={item.mediaKit?.requestStatus} />
              </div>

              {hasPdf ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border bg-white p-3">
                    <button
                      type="button"
                      onClick={() => onOpenPdf(item)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {item.mediaKit?.fileName || 'View PDF'}
                    </button>
                    <p className="mt-2 text-xs text-slate-500">
                      Uploaded: {formatDateTime(item.mediaKit?.uploadedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-950">
                        Show PDF To Brand
                      </p>
                      <p className="text-xs text-slate-500">
                        Turning this on will make PDF the only visible source.
                      </p>
                    </div>
                    <Toggle
                      checked={!!item.mediaKit?.showToBrand}
                      onChange={(next) => onTogglePdf(item, next)}
                      disabled={actionLoadingKey === `pdf-toggle:${item._id}`}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => onOpenPdf(item)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View PDF
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-rose-600 hover:text-rose-700"
                      onClick={() => onRemovePdf(item._id)}
                      disabled={actionLoadingKey === `pdf-remove:${item._id}`}
                    >
                      {actionLoadingKey === `pdf-remove:${item._id}` ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Remove PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed bg-white p-4 text-sm text-slate-500">
                  No Media Kit PDF uploaded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
});

type InfluencerTableRowProps = {
  row: FolderItem;
  isLinkToggleLoading: boolean;
  isPdfToggleLoading: boolean;
  onOpenRateCard: (itemId: string) => void;
  onOpenMediaKit: (itemId: string) => void;
  onToggleLink: (row: FolderItem, nextValue: boolean) => Promise<void>;
  onTogglePdf: (row: FolderItem, nextValue: boolean) => Promise<void>;
  onEdit: (row: FolderItem) => void;
  onDelete: (itemId: string) => Promise<void>;
};

const InfluencerTableRowMemo = memo(function InfluencerTableRow({
  row,
  isLinkToggleLoading,
  isPdfToggleLoading,
  onOpenRateCard,
  onOpenMediaKit,
  onToggleLink,
  onTogglePdf,
  onEdit,
  onDelete,
}: InfluencerTableRowProps) {
  const hasLink = !!asText(row.mediaKitLink?.url);
  const hasPdf = !!asText(row.mediaKit?.s3Key);
  const access = row.mediaKitAccess;
  const profileUrl = getProfileUrl(row);

  const visibleSource =
    access?.visibleSource === 'pdf'
      ? 'PDF'
      : access?.visibleSource === 'link'
        ? 'Link'
        : DASH;

  return (
    <TableRow>
      <TableCell className="align-top">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-950">{row.name || DASH}</p>
            <ProviderBadge provider={row.provider} />
          </div>
          <p className="text-sm text-slate-500">{row.handle || DASH}</p>
          <div className="inline-flex items-center gap-2 text-xs text-slate-500">
            <Mail className="h-3.5 w-3.5" />
            <span>{row.email || DASH}</span>
          </div>
        </div>
      </TableCell>

      <TableCell className="align-top">
        {profileUrl ? (
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-[320px] items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-all">{profileUrl}</span>
          </a>
        ) : (
          <span className="text-sm text-slate-400">{DASH}</span>
        )}
      </TableCell>

      <TableCell className="align-top text-sm text-slate-700">
        <div className="max-w-[220px] whitespace-pre-wrap break-words">
          {Array.isArray(row.niche) && row.niche.length ? row.niche.join(', ') : DASH}
        </div>
      </TableCell>

      <TableCell className="align-top text-sm text-slate-700">
        {row.country || DASH}
      </TableCell>

      <TableCell className="align-top text-sm text-slate-700">
        <div className="max-w-[320px] whitespace-pre-wrap break-words leading-6">
          {row.selectionReason || DASH}
        </div>
      </TableCell>

      <TableCell className="align-top text-sm font-medium text-slate-800">
        {formatNumber(row.followers)}
      </TableCell>

      <TableCell className="align-top">
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl"
          onClick={() => onOpenRateCard(row._id)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Open
        </Button>
      </TableCell>

      <TableCell className="align-top">
        <div className="min-w-[320px] rounded-2xl border bg-slate-50 p-3">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Generic Brand Access
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Source: {visibleSource}
              </p>
            </div>
            <AccessBadge access={access} />
          </div>

          <div className="mb-3 grid gap-2 rounded-xl bg-white p-3 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Requested At</span>
              <span className="font-medium text-slate-900">
                {formatDateTime(access?.requestedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Request Status</span>
              <StatusBadge value={access?.requestStatus} />
            </div>
          </div>

          <div className="mb-3 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenMediaKit(row._id)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Manage
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <AssetCheck label="Link" ok={hasLink} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">
                  Brand
                </span>
                <Toggle
                  checked={!!row.mediaKitLink?.showToBrand}
                  onChange={(next) => onToggleLink(row, next)}
                  disabled={!hasLink || isLinkToggleLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <AssetCheck label="PDF" ok={hasPdf} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">
                  Brand
                </span>
                <Toggle
                  checked={!!row.mediaKit?.showToBrand}
                  onChange={(next) => onTogglePdf(row, next)}
                  disabled={!hasPdf || isPdfToggleLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="align-top text-center">
        <div className="flex justify-center">
          <div
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${row.goodFit
              ? 'border-rose-200 bg-rose-50'
              : 'border-slate-200 bg-slate-50'
              }`}
            title={row.goodFit ? 'Good Fit' : 'Not Marked'}
          >
            <Heart
              className={`h-5 w-5 ${row.goodFit
                ? 'fill-rose-500 text-rose-500'
                : 'text-slate-300'
                }`}
            />
          </div>
        </div>
      </TableCell>

      <TableCell className="align-top text-right">
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={() => onEdit(row)}
          >
            <PencilLine className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-rose-600 hover:text-rose-700"
            onClick={() => onDelete(row._id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

type InfluencerTableProps = {
  loading: boolean;
  rows: FolderItem[];
  onOpenCreateDrawer: () => void;
  onDownloadCsv: () => void;
  onOpenRateCard: (itemId: string) => void;
  onOpenMediaKit: (itemId: string) => void;
  onToggleLink: (row: FolderItem, nextValue: boolean) => Promise<void>;
  onTogglePdf: (row: FolderItem, nextValue: boolean) => Promise<void>;
  onEdit: (row: FolderItem) => void;
  onDelete: (itemId: string) => Promise<void>;
  onGoToYoutube: () => void;
  linkToggleItemId: string;
  pdfToggleItemId: string;
};

const InfluencerTableSection = memo(function InfluencerTableSection({
  loading,
  rows,
  onOpenCreateDrawer,
  onDownloadCsv,
  onOpenRateCard,
  onOpenMediaKit,
  onToggleLink,
  onTogglePdf,
  onEdit,
  onDelete,
  onGoToYoutube,
  linkToggleItemId,
  pdfToggleItemId,
}: InfluencerTableProps) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Influencers Table</CardTitle>
        <CardDescription>
          Generic brand-facing media kit state with separate admin controls for
          link and PDF.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : !rows.length ? (
          <div className="rounded-2xl border border-dashed bg-slate-50 p-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No influencers found in this folder.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add a creator manually or import from YouTube.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button className="rounded-xl" onClick={onOpenCreateDrawer}>
                <Plus className="mr-2 h-4 w-4" />
                Add Influencer
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={onGoToYoutube}
              >
                <Youtube className="mr-2 h-4 w-4" />
                Add from YouTube
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={onDownloadCsv}
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[1280px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Influencer</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead>Niche</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Selection Reason</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Rate Cards</TableHead>
                    <TableHead>Media Kit Access</TableHead>
                    <TableHead className="text-center">Fit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.map((row) => (
                    <InfluencerTableRowMemo
                      key={row._id}
                      row={row}
                      isLinkToggleLoading={linkToggleItemId === row._id}
                      isPdfToggleLoading={pdfToggleItemId === row._id}
                      onOpenRateCard={onOpenRateCard}
                      onOpenMediaKit={onOpenMediaKit}
                      onToggleLink={onToggleLink}
                      onTogglePdf={onTogglePdf}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default function PitchFolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = asText(params?.id);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [folder, setFolder] = useState<FolderResponse | null>(null);
  const [rows, setRows] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [savingFolderConfig, setSavingFolderConfig] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create');
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [activeItemId, setActiveItemId] = useState('');
  const [draft, setDraft] = useState<DraftState>(DEFAULT_DRAFT);

  const [folderBrandCount, setFolderBrandCount] = useState('');
  const [showFullListToBrand, setShowFullListToBrand] = useState(true);

  const [actionLoadingKey, setActionLoadingKey] = useState('');
  const [uploadTargetItemId, setUploadTargetItemId] = useState('');

  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState('');
  const [pdfViewerTitle, setPdfViewerTitle] = useState('');

  const [rateCardItemId, setRateCardItemId] = useState('');
  const [rateCardTab, setRateCardTab] = useState<RateCardTab>('influencer');

  const [mediaKitItemId, setMediaKitItemId] = useState('');

  const rowMap = useMemo(() => {
    const map = new Map<string, FolderItem>();
    for (const row of rows) map.set(row._id, row);
    return map;
  }, [rows]);

  const rateCardModalItem = useMemo(
    () => rowMap.get(rateCardItemId) || null,
    [rowMap, rateCardItemId]
  );

  const mediaKitModalItem = useMemo(
    () => rowMap.get(mediaKitItemId) || null,
    [rowMap, mediaKitItemId]
  );

  const totalItems = rows.length;

  const visibleMediaAssets = useMemo(
    () => rows.filter((row) => !!row.mediaKitAccess?.allowed).length,
    [rows]
  );

  const pendingMediaKitRequests = useMemo(
    () =>
      rows.filter((row) => row.mediaKitAccess?.requestStatus === 'requested')
        .length,
    [rows]
  );

  const sharedCountPreview = useMemo(() => {
    const configured = toNullableInteger(folderBrandCount);
    return configured == null ? totalItems : configured;
  }, [folderBrandCount, totalItems]);

  const linkToggleItemId = useMemo(() => {
    if (!actionLoadingKey.startsWith('link-toggle:')) return '';
    return actionLoadingKey.split(':')[1] || '';
  }, [actionLoadingKey]);

  const pdfToggleItemId = useMemo(() => {
    if (!actionLoadingKey.startsWith('pdf-toggle:')) return '';
    return actionLoadingKey.split(':')[1] || '';
  }, [actionLoadingKey]);

  const shareUrl = folder?.share?.url || '';

  const downloadCsv = useCallback(() => {
    if (!rows.length) {
      void showErr('No influencer rows available to export.');
      return;
    }

    const csv = buildRowsCsv(rows);
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slugifyFileName(folder?.title)}-influencers.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [rows, folder?.title]);

  const goToFolders = useCallback(() => {
    router.push('/admin/pitch-folders');
  }, [router]);

  const goToYoutube = useCallback(() => {
    router.push(`/admin/youtube?folderId=${folderId}`);
  }, [router, folderId]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveItemId('');
    setDraft(DEFAULT_DRAFT);
    setDrawerMode('create');
  }, []);

  const openCreateDrawer = useCallback(() => {
    setDrawerMode('create');
    setActiveItemId('');
    setDraft(DEFAULT_DRAFT);
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((row: FolderItem) => {
    setDrawerMode('edit');
    setActiveItemId(row._id);
    setDraft(buildDraftFromRow(row));
    setDrawerOpen(true);
  }, []);

  const openRateCardModal = useCallback((itemId: string) => {
    setRateCardItemId(itemId);
    setRateCardTab('influencer');
  }, []);

  const closeRateCardModal = useCallback(() => {
    setRateCardItemId('');
    setRateCardTab('influencer');
  }, []);

  const openMediaKitModal = useCallback((itemId: string) => {
    setMediaKitItemId(itemId);
  }, []);

  const closeMediaKitModal = useCallback(() => {
    setMediaKitItemId('');
  }, []);

  const openPdfViewer = useCallback((row: FolderItem) => {
    const url = buildPublicMediaKitUrl(row.mediaKit);
    if (!url) {
      void showErr('PDF URL is not available for this Media Kit.');
      return;
    }

    setPdfViewerUrl(url);
    setPdfViewerTitle(row.mediaKit?.fileName || `${row.name || 'Media Kit'} PDF`);
    setPdfViewerOpen(true);
  }, []);

  const closePdfViewer = useCallback(() => {
    setPdfViewerOpen(false);
    setPdfViewerUrl('');
    setPdfViewerTitle('');
  }, []);

  const setDraftField = useCallback(
    (key: keyof DraftState, value: string | number | boolean) => {
      setDraft((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const loadFolder = useCallback(async () => {
    if (!folderId) return;

    setLoading(true);
    try {
      const resp = await get<{ success: boolean; data: FolderResponse }>(
        `/pitch-folders/${folderId}`
      );

      const data = resp?.data || null;
      const nextRows = Array.isArray(data?.items) ? data.items : [];

      setFolder(data);
      setRows(nextRows);
      setFolderBrandCount(
        data?.brandVisibleItemCount === null ||
          data?.brandVisibleItemCount === undefined
          ? ''
          : String(data.brandVisibleItemCount)
      );
      setShowFullListToBrand(
        data?.showFullListToBrand === undefined
          ? true
          : !!data.showFullListToBrand
      );
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load folder.');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    if (!folderId) return;
    closeDrawer();
    setRateCardItemId('');
    setMediaKitItemId('');
    void loadFolder();
  }, [folderId, closeDrawer, loadFolder]);

  const saveDrawer = useCallback(async () => {
    try {
      setDrawerSaving(true);

      if (drawerMode === 'create') {
        await post(`/pitch-folders/${folderId}/item`, buildPayloadFromDraft(draft));
        await showSuccess('Influencer added successfully.');
      } else {
        await post('/pitch-folders/item/update', {
          folderId,
          itemId: activeItemId,
          ...buildPayloadFromDraft(draft),
        });
        await showSuccess('Influencer updated successfully.');
      }

      closeDrawer();
      await loadFolder();
    } catch (e: any) {
      await showErr(
        e?.message ||
        (drawerMode === 'create'
          ? 'Failed to create influencer.'
          : 'Failed to update influencer.')
      );
    } finally {
      setDrawerSaving(false);
    }
  }, [drawerMode, folderId, activeItemId, draft, closeDrawer, loadFolder]);

  const saveFolderBrandSettings = useCallback(async () => {
    try {
      setSavingFolderConfig(true);

      await post('/pitch-folders/update', {
        id: folderId,
        brandVisibleItemCount:
          folderBrandCount === '' ? null : toNullableInteger(folderBrandCount),
        showFullListToBrand,
      });

      await loadFolder();
      await showSuccess('Brand visibility settings updated successfully.');
    } catch (e: any) {
      await showErr(e?.message || 'Failed to save folder settings.');
    } finally {
      setSavingFolderConfig(false);
    }
  }, [folderId, folderBrandCount, showFullListToBrand, loadFolder]);

  const deleteRow = useCallback(
    async (itemId: string) => {
      try {
        const ok = await swal({
          title: 'Delete influencer?',
          text: 'This will remove the influencer from this folder.',
          icon: 'warning',
          buttons: ['Cancel', 'Delete'],
          dangerMode: true,
        });

        if (!ok) return;

        await post('/pitch-folders/item/delete', {
          folderId,
          itemId,
        });

        await loadFolder();
        await showSuccess('Influencer removed successfully.');
      } catch (e: any) {
        await showErr(e?.message || 'Failed to delete influencer.');
      }
    },
    [folderId, loadFolder]
  );

  const copyShareLink = useCallback(async () => {
    try {
      setSharing(true);

      const resp = await post<{ success: boolean; data: { url: string } }>(
        `/pitch-folders/${folderId}/share-link`,
        {}
      );

      const url = resp?.data?.url || '';
      if (!url) {
        await showErr('Could not generate share link.');
        return;
      }

      await navigator.clipboard.writeText(url);
      await loadFolder();
      await showSuccess('Share link copied.');
    } catch (e: any) {
      await showErr(e?.message || 'Failed to copy share link.');
    } finally {
      setSharing(false);
    }
  }, [folderId, loadFolder]);

  const runRowAction = useCallback(
    async (key: string, handler: () => Promise<void>) => {
      try {
        setActionLoadingKey(key);
        await handler();
      } finally {
        setActionLoadingKey('');
      }
    },
    []
  );

  const handleGenerateMediaKitLink = useCallback(
    async (row: FolderItem) => {
      try {
        const provider = asText(row.provider).toLowerCase();
        const username = asText(row.handle).replace(/^@/, '');

        if (!provider) {
          await showErr('Platform is missing for this creator.');
          return;
        }

        if (!username) {
          await showErr('Handle is missing for this creator.');
          return;
        }

        await runRowAction(`link-generate:${row._id}`, async () => {
          const resp = await get<{
            success: boolean;
            data?: {
              modashId: string;
              link: string;
              username?: string;
              platform?: string;
            };
            error?: string;
          }>('/modash/media-kit-link', {
            platform: provider,
            username,
          });

          const link = asText(resp?.data?.link);

          if (!link) {
            throw new Error(resp?.error || 'Could not generate media kit link.');
          }

          await post('/pitch-folders/item/update', {
            folderId,
            itemId: row._id,
            mediaKitLink: {
              url: link,
              generatedAt: new Date().toISOString(),
            },
          });

          await navigator.clipboard.writeText(link);
          await loadFolder();
          await showSuccess('Media Kit Link generated, saved, and copied.');
        });
      } catch (e: any) {
        await showErr(e?.message || 'Failed to generate media kit link.');
      }
    },
    [folderId, loadFolder, runRowAction]
  );

  const copyMediaKitLink = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      await showSuccess('Media Kit Link copied.');
    } catch {
      await showErr('Could not copy link.');
    }
  }, []);

  const pickMediaKit = useCallback((itemId: string) => {
    setUploadTargetItemId(itemId);
    fileInputRef.current?.click();
  }, []);

  const onMediaKitSelected = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const itemId = uploadTargetItemId;

      e.target.value = '';

      if (!file || !itemId) return;

      if (
        file.type !== 'application/pdf' &&
        !file.name.toLowerCase().endsWith('.pdf')
      ) {
        await showErr('Only PDF Media Kit files are allowed.');
        return;
      }

      await runRowAction(`pdf-upload:${itemId}`, async () => {
        const presignResp = await post<{
          success: boolean;
          data: {
            key: string;
            fileName: string;
            contentType: string;
            uploadUrl: string;
            expiresIn: number;
          };
        }>('/pitch-folders/item/media-kit/presign', {
          folderId,
          fileName: file.name,
          contentType: file.type || 'application/pdf',
        });

        const uploadUrl = presignResp?.data?.uploadUrl || '';
        const key = presignResp?.data?.key || '';
        const fileName = presignResp?.data?.fileName || file.name;

        if (!uploadUrl || !key) {
          throw new Error('Could not create upload URL for Media Kit.');
        }

        const uploadResp = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/pdf',
          },
          body: file,
        });

        if (!uploadResp.ok) {
          throw new Error('PDF upload to storage failed.');
        }

        await post('/pitch-folders/item/update', {
          folderId,
          itemId,
          mediaKit: {
            s3Key: key,
            fileName,
            mimeType: 'application/pdf',
            size: file.size,
            uploadedAt: new Date().toISOString(),
          },
        });

        await loadFolder();
        await showSuccess('Media Kit PDF uploaded successfully.');
      });
    },
    [folderId, loadFolder, runRowAction, uploadTargetItemId]
  );

  const handleMediaKitLinkToggle = useCallback(
    async (row: FolderItem, nextValue: boolean) => {
      const itemId = row._id;
      const hasLink = !!asText(row.mediaKitLink?.url);
      const isRequested = row.mediaKitLink?.requestStatus === 'requested';
      const isVisible = !!row.mediaKitLink?.showToBrand;

      if (!hasLink) return;

      await runRowAction(`link-toggle:${itemId}`, async () => {
        if (nextValue) {
          if (isRequested && !isVisible) {
            await post('/pitch-folders/item/media-kit-link/approval', {
              folderId,
              itemId,
              action: 'approve',
            });
          } else {
            await post('/pitch-folders/item/media-kit-link/visibility', {
              folderId,
              itemId,
              showToBrand: true,
            });
          }
        } else {
          if (isRequested && !isVisible) {
            await post('/pitch-folders/item/media-kit-link/approval', {
              folderId,
              itemId,
              action: 'reject',
            });
          } else {
            await post('/pitch-folders/item/media-kit-link/visibility', {
              folderId,
              itemId,
              showToBrand: false,
            });
          }
        }

        await loadFolder();
        await showSuccess('Media Kit Link access updated successfully.');
      });
    },
    [folderId, loadFolder, runRowAction]
  );

  const handleMediaKitPdfToggle = useCallback(
    async (row: FolderItem, nextValue: boolean) => {
      const itemId = row._id;
      const hasPdf = !!asText(row.mediaKit?.s3Key);
      const isRequested = row.mediaKit?.requestStatus === 'requested';
      const isVisible = !!row.mediaKit?.showToBrand;

      if (!hasPdf) return;

      await runRowAction(`pdf-toggle:${itemId}`, async () => {
        if (nextValue) {
          if (isRequested && !isVisible) {
            await post('/pitch-folders/item/media-kit/approval', {
              folderId,
              itemId,
              action: 'approve',
            });
          } else {
            await post('/pitch-folders/item/media-kit/visibility', {
              folderId,
              itemId,
              showToBrand: true,
            });
          }
        } else {
          if (isRequested && !isVisible) {
            await post('/pitch-folders/item/media-kit/approval', {
              folderId,
              itemId,
              action: 'reject',
            });
          } else {
            await post('/pitch-folders/item/media-kit/visibility', {
              folderId,
              itemId,
              showToBrand: false,
            });
          }
        }

        await loadFolder();
        await showSuccess('Media Kit PDF access updated successfully.');
      });
    },
    [folderId, loadFolder, runRowAction]
  );

  const removeMediaKit = useCallback(
    async (itemId: string) => {
      const ok = await swal({
        title: 'Remove Media Kit PDF?',
        text: 'This will remove the uploaded PDF from this influencer record.',
        icon: 'warning',
        buttons: ['Cancel', 'Remove'],
        dangerMode: true,
      });

      if (!ok) return;

      await runRowAction(`pdf-remove:${itemId}`, async () => {
        await post('/pitch-folders/item/update', {
          folderId,
          itemId,
          removeMediaKit: true,
        });

        await loadFolder();
        await showSuccess('Media Kit PDF removed successfully.');
      });
    },
    [folderId, loadFolder, runRowAction]
  );

  if (!folderId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>Invalid Folder</CardTitle>
              <CardDescription>Folder id is missing in the URL.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={onMediaKitSelected}
      />

      <PdfViewerModal
        open={pdfViewerOpen}
        title={pdfViewerTitle}
        url={pdfViewerUrl}
        onClose={closePdfViewer}
      />

      <RateCardModal
        item={rateCardModalItem}
        tab={rateCardTab}
        onClose={closeRateCardModal}
        onTabChange={setRateCardTab}
      />

      <MediaKitModal
        item={mediaKitModalItem}
        actionLoadingKey={actionLoadingKey}
        onClose={closeMediaKitModal}
        onGenerateLink={handleGenerateMediaKitLink}
        onPickPdf={pickMediaKit}
        onToggleLink={handleMediaKitLinkToggle}
        onTogglePdf={handleMediaKitPdfToggle}
        onCopyLink={copyMediaKitLink}
        onOpenPdf={openPdfViewer}
        onRemovePdf={removeMediaKit}
      />

      <DrawerForm
        open={drawerOpen}
        mode={drawerMode}
        draft={draft}
        saving={drawerSaving}
        onClose={closeDrawer}
        onSave={saveDrawer}
        onDraftFieldChange={setDraftField}
      />

      <div className="mx-auto w-full max-w-[1700px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="overflow-hidden rounded-3xl border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white sm:px-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                    <FolderKanban className="h-3.5 w-3.5" />
                    Admin Pitch Folder Workspace
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                      <FolderKanban className="h-7 w-7" />
                    </div>

                    <div>
                      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        {folder?.title || 'Pitch Folder'}
                      </h1>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/75">
                        <span>
                          Created by{' '}
                          <span className="font-semibold text-white">
                            {folder?.createdBy?.name ||
                              folder?.createdBy?.email ||
                              DASH}
                          </span>
                        </span>
                        <span>•</span>
                        <span>
                          {folder?.createdBy?.designation ||
                            prettyText(folder?.createdBy?.role)}
                        </span>
                        <span>•</span>
                        <span>{formatDate(folder?.createdAt)}</span>
                      </div>

                      {folder?.description ? (
                        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/80">
                          {folder.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    className="rounded-xl"
                    onClick={goToFolders}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Folders
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-xl border-white/15 bg-white/10 text-white hover:bg-white/20"
                    onClick={loadFolder}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Refresh
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-xl border-white/15 bg-white/10 text-white hover:bg-white/20"
                    onClick={copyShareLink}
                    disabled={sharing}
                  >
                    {sharing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    Copy Share Link
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Influencers"
            value={totalItems}
            icon={<Users className="h-5 w-5" />}
            hint="All creators inside this folder"
          />
          <StatCard
            title="Allowed Media Kits"
            value={visibleMediaAssets}
            icon={<Eye className="h-5 w-5" />}
            hint="Generic media kits currently visible to brand"
          />
          <StatCard
            title="Pending Requests"
            value={pendingMediaKitRequests}
            icon={<Clock3 className="h-5 w-5" />}
            hint="Generic media kit requests awaiting action"
          />
          <StatCard
            title="Brand Count Preview"
            value={sharedCountPreview}
            icon={<ShieldCheck className="h-5 w-5" />}
            hint={showFullListToBrand ? 'Full list enabled' : 'Count only'}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_2fr]">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Brand View Settings</CardTitle>
              <CardDescription>
                Control how this folder appears to the brand on the shared link.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Share Link">
                <div className="rounded-xl border bg-slate-50 px-3 py-2 text-sm break-all text-slate-700">
                  {shareUrl || DASH}
                </div>
              </Field>

              <div className="rounded-2xl border bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-950">
                      Show Full Influencer List To Brand
                    </p>
                    <p className="text-xs text-slate-500">
                      When enabled, the full influencer list is visible on the
                      shared page.
                    </p>
                  </div>
                  <Toggle
                    checked={showFullListToBrand}
                    onChange={(next) => {
                      setShowFullListToBrand(next);
                      if (next) {
                        setFolderBrandCount("");
                      }
                    }}
                  />
                </div>
              </div>

              <Field
                label="Brand Visible Count"
                hint={
                  showFullListToBrand
                    ? "Disabled because full list is enabled."
                    : `Leave blank to auto use ${totalItems}`
                }
              >
                <Input
                  type="number"
                  min={0}
                  value={showFullListToBrand ? "" : folderBrandCount}
                  onChange={(e) => setFolderBrandCount(e.target.value)}
                  placeholder={
                    showFullListToBrand
                      ? "Disabled while full list is enabled"
                      : `Leave blank to auto use ${totalItems}`
                  }
                  disabled={showFullListToBrand}
                />
              </Field>

              <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  Current preview:
                  <span className="ml-2 font-semibold text-slate-950">
                    {sharedCountPreview}
                  </span>
                </p>
                <p className="mt-1">
                  Brand list mode:
                  <span className="ml-2 font-semibold text-slate-950">
                    {showFullListToBrand ? "Full list visible" : "Count only"}
                  </span>
                </p>
              </div>

              <Button
                className="rounded-xl"
                onClick={saveFolderBrandSettings}
                disabled={savingFolderConfig}
              >
                {savingFolderConfig ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Brand Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-lg">Influencer Management</CardTitle>
                <CardDescription>
                  Brand-facing media kit state is now generic, while admin can
                  still manage link and PDF separately.
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={openCreateDrawer}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Influencer
                </Button>

                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={goToYoutube}
                >
                  <Youtube className="mr-2 h-4 w-4" />
                  Add from YouTube
                </Button>

                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={downloadCsv}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Share generated on
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {formatDate(folder?.share?.generatedAt)}
                  </p>
                </div>

                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Shared by
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {folder?.share?.sharedBy?.name ||
                      folder?.share?.sharedBy?.email ||
                      DASH}
                  </p>
                </div>

                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Last updated
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {formatDate(folder?.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <InfluencerTableSection
          loading={loading}
          rows={rows}
          onOpenCreateDrawer={openCreateDrawer}
          onDownloadCsv={downloadCsv}
          onOpenRateCard={openRateCardModal}
          onOpenMediaKit={openMediaKitModal}
          onToggleLink={handleMediaKitLinkToggle}
          onTogglePdf={handleMediaKitPdfToggle}
          onEdit={openEditDrawer}
          onDelete={deleteRow}
          onGoToYoutube={goToYoutube}
          linkToggleItemId={linkToggleItemId}
          pdfToggleItemId={pdfToggleItemId}
        />
      </div>
    </div>
  );
}