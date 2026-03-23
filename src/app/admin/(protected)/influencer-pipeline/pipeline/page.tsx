'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Check,
  Edit3,
  RefreshCw,
  Save,
  X,
  Building2,
  FolderKanban,
  Plus,
} from 'lucide-react';
import swal from 'sweetalert';
import { get, post } from '@/lib/api';

type TabKey = 'outreach' | 'roster' | 'pitch';

type PipelineRow = {
  _id: string;
  campaignId?: string;
  status?: string;

  name?: string;
  followers?: number | null;
  links?: string[];
  primaryLink?: string;
  niche?: string[];
  email?: string;
  country?: string;

  outreachDate?: string | null;
  outreached?: boolean | null;
  followUp1SentAt?: string | null;
  followUp2SentAt?: string | null;
  replyText?: string;

  demographics?: string;
  engagementRate?: number | null;
  deliverables?: string;
  rates?: number | null;
  mediaKit?: string;
  address?: string;

  additionalInfo?: string;
  selectionReason?: string;
  goodFit?: boolean | null;
  rateUsd?: number | null;
  ourFeePct?: number | null;
  comments?: string;
};

type PipelineListResponse = {
  page?: number;
  limit?: number;
  total?: number;
  results?: PipelineRow[];
};

type CampaignItem = {
  _id: string;
  brandId?: string;
  brandName?: string;
  campaignTitle?: string;
  campaignType?: string;
  campaignCategory?: string;
  campaignSubcategory?: string;
  numberOfInfluencers?: number;
  targetCountry?: string;
  campaignBudget?: number;
  budget?: number;
  influencerBudget?: number;
  paymentType?: string;
  platformSelection?: string[];
  scheduledAt?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  status?: string;
  publishStatus?: string;
  createdAt?: string;
  updatedAt?: string;
};

type CampaignListResponse = {
  success: boolean;
  count: number;
  data: CampaignItem[];
};

const DASH = '--';

function showErr(message: string) {
  return swal({
    title: 'Error',
    text: message || 'Something went wrong.',
    icon: 'error',
  });
}

function formatNumber(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return DASH;
  return new Intl.NumberFormat('en-IN').format(n);
}

function formatPercent(x?: number | null) {
  if (x == null || !Number.isFinite(x)) return DASH;
  return `${(x * 100).toFixed(2)}%`;
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

function asText(v: unknown) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function joinList(v?: string[] | null) {
  return Array.isArray(v) && v.length ? v.join(', ') : DASH;
}

function parseCsv(v: string) {
  return (v || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function toNullableNumber(v: any) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getDefaultCreateDraft(tab: TabKey) {
  const base = {
    name: '',
    followers: '',
    links: '',
    niche: '',
    email: '',
    country: '',
    outreachDate: '',
    outreached: false,
    followUp1SentAt: '',
    followUp2SentAt: '',
    replyText: '',
    demographics: '',
    engagementRate: '',
    deliverables: '',
    rates: '',
    mediaKit: '',
    address: '',
    additionalInfo: '',
    selectionReason: '',
    goodFit: false,
    rateUsd: '',
    ourFeePct: '',
    comments: '',
  };

  return base;
}

function TabButton({
  active,
  count,
  children,
  onClick,
}: {
  active: boolean;
  count?: number;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-slate-900 text-white'
          : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
      }`}
    >
      <span>{children}</span>
      {typeof count === 'number' ? (
        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/20' : 'bg-slate-100'}`}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

export default function CampaignPipelinePage() {
  const searchParams = useSearchParams();

  const campaignId = asText(searchParams.get('id'));
  const initialName = asText(searchParams.get('name'));

  const [campaign, setCampaign] = useState<CampaignItem | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('outreach');
  const [rows, setRows] = useState<PipelineRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string>('');
  const [draft, setDraft] = useState<Record<string, any>>({});

  const [showCreateRow, setShowCreateRow] = useState(false);
  const [createDraft, setCreateDraft] = useState<Record<string, any>>(
    getDefaultCreateDraft('outreach')
  );

  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const [counts, setCounts] = useState({
    outreach: 0,
    roster: 0,
    pitch: 0,
  });

  const selectedCount = useMemo(
    () => Object.values(selectedIds).filter(Boolean).length,
    [selectedIds]
  );

  const allSelected = useMemo(() => {
    if (!rows.length) return false;
    return rows.every((row) => !!selectedIds[row._id]);
  }, [rows, selectedIds]);

  const someSelected = useMemo(() => {
    if (!rows.length) return false;
    return rows.some((row) => !!selectedIds[row._id]);
  }, [rows, selectedIds]);

  async function loadCampaignMeta() {
    if (!campaignId) return;

    setMetaLoading(true);
    try {
      const resp = await get<CampaignListResponse>('/admins/campaign/list');
      const items = Array.isArray(resp?.data) ? resp.data : [];
      const found = items.find((item) => String(item._id) === campaignId) || null;
      setCampaign(found);
    } catch (e: any) {
      console.error('Failed to load campaign meta:', e?.message || e);
    } finally {
      setMetaLoading(false);
    }
  }

  async function loadCounts() {
    if (!campaignId) return;

    try {
      const [outreachResp, rosterResp, pitchResp] = await Promise.all([
        get<PipelineListResponse>('/pipeline/list', {
          campaignId,
          status: 'outreach',
          page: 1,
          limit: 1,
        }),
        get<PipelineListResponse>('/pipeline/list', {
          campaignId,
          status: 'roster',
          page: 1,
          limit: 1,
        }),
        get<PipelineListResponse>('/pipeline/list', {
          campaignId,
          status: 'pitch',
          page: 1,
          limit: 1,
        }),
      ]);

      setCounts({
        outreach: Number(outreachResp?.total || 0),
        roster: Number(rosterResp?.total || 0),
        pitch: Number(pitchResp?.total || 0),
      });
    } catch (e) {
      console.error('Failed to load counts', e);
    }
  }

  async function loadRows(tab: TabKey = activeTab) {
    if (!campaignId) return;

    setLoading(true);
    try {
      const resp = await get<PipelineListResponse>('/pipeline/list', {
        campaignId,
        status: tab,
        page: 1,
        limit: 100,
      });

      setRows(Array.isArray(resp?.results) ? resp.results : []);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load pipeline.');
    } finally {
      setLoading(false);
    }
  }

  async function refreshAll(tab: TabKey = activeTab) {
    await Promise.all([loadRows(tab), loadCounts(), loadCampaignMeta()]);
  }

  useEffect(() => {
    if (!campaignId) return;
    setSelectedIds({});
    setShowCreateRow(false);
    setCreateDraft(getDefaultCreateDraft(activeTab));
    refreshAll(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, activeTab]);

  function startEdit(row: PipelineRow) {
    setShowCreateRow(false);
    setEditingId(row._id);
    setDraft({
      id: row._id,
      name: row.name || '',
      followers: row.followers ?? '',
      links: Array.isArray(row.links) ? row.links.join(', ') : row.primaryLink || '',
      niche: Array.isArray(row.niche) ? row.niche.join(', ') : '',
      email: row.email || '',
      country: row.country || '',
      outreachDate: row.outreachDate ? new Date(row.outreachDate).toISOString().slice(0, 10) : '',
      outreached: !!row.outreached,
      followUp1SentAt: row.followUp1SentAt
        ? new Date(row.followUp1SentAt).toISOString().slice(0, 10)
        : '',
      followUp2SentAt: row.followUp2SentAt
        ? new Date(row.followUp2SentAt).toISOString().slice(0, 10)
        : '',
      replyText: row.replyText || '',
      demographics: row.demographics || '',
      engagementRate: row.engagementRate ?? '',
      deliverables: row.deliverables || '',
      rates: row.rates ?? '',
      mediaKit: row.mediaKit || '',
      address: row.address || '',
      additionalInfo: row.additionalInfo || '',
      selectionReason: row.selectionReason || '',
      goodFit: !!row.goodFit,
      rateUsd: row.rateUsd ?? '',
      ourFeePct: row.ourFeePct ?? '',
      comments: row.comments || '',
    });
  }

  function cancelEdit() {
    setEditingId('');
    setDraft({});
  }

  function openCreateRow() {
    setEditingId('');
    setDraft({});
    setShowCreateRow(true);
    setCreateDraft(getDefaultCreateDraft(activeTab));
  }

  function cancelCreateRow() {
    setShowCreateRow(false);
    setCreateDraft(getDefaultCreateDraft(activeTab));
  }

  function setField(key: string, value: any) {
    setDraft((p) => ({ ...p, [key]: value }));
  }

  function setCreateField(key: string, value: any) {
    setCreateDraft((p) => ({ ...p, [key]: value }));
  }

  function toggleRowSelection(id: string, checked: boolean) {
    setSelectedIds((prev) => ({ ...prev, [id]: checked }));
  }

  function toggleSelectAll(checked: boolean) {
    const next: Record<string, boolean> = {};
    rows.forEach((row) => {
      next[row._id] = checked;
    });
    setSelectedIds(next);
  }

  async function saveRow() {
    try {
      const id = asText(draft.id);
      if (!id) return;

      if (activeTab === 'outreach') {
        await post('/pipeline/outreach/update', {
          id,
          email: asText(draft.email),
          outreachDate: draft.outreachDate || null,
          outreached: !!draft.outreached,
          followUp1SentAt: draft.followUp1SentAt || null,
          followUp2SentAt: draft.followUp2SentAt || null,
          replyText: asText(draft.replyText),
        });
      }

      if (activeTab === 'roster') {
        await post('/pipeline/roster/update', {
          id,
          demographics: asText(draft.demographics),
          engagementRate:
            draft.engagementRate === '' ? null : Number(draft.engagementRate),
          deliverables: asText(draft.deliverables),
          rates: draft.rates === '' ? null : Number(draft.rates),
          mediaKit: asText(draft.mediaKit),
          address: asText(draft.address),
          email: asText(draft.email),
        });
      }

      if (activeTab === 'pitch') {
        await post('/pipeline/pitch/update', {
          id,
          country: asText(draft.country),
          additionalInfo: asText(draft.additionalInfo),
          selectionReason: asText(draft.selectionReason),
          goodFit: !!draft.goodFit,
          rateUsd: draft.rateUsd === '' ? null : Number(draft.rateUsd),
          ourFeePct: draft.ourFeePct === '' ? null : Number(draft.ourFeePct),
          comments: asText(draft.comments),
        });
      }

      setEditingId('');
      setDraft({});
      await refreshAll(activeTab);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to save row.');
    }
  }

  async function createRow() {
    try {
      if (!campaignId) return;
      setCreating(true);

      await post('/pipeline/create', {
        campaignId,
        status: activeTab,

        name: asText(createDraft.name),
        followers: toNullableNumber(createDraft.followers),
        links: parseCsv(asText(createDraft.links)),
        niche: parseCsv(asText(createDraft.niche)),
        email: asText(createDraft.email),
        country: asText(createDraft.country),

        outreachDate: createDraft.outreachDate || null,
        outreached: !!createDraft.outreached,
        followUp1SentAt: createDraft.followUp1SentAt || null,
        followUp2SentAt: createDraft.followUp2SentAt || null,
        replyText: asText(createDraft.replyText),

        demographics: asText(createDraft.demographics),
        engagementRate: toNullableNumber(createDraft.engagementRate),
        deliverables: asText(createDraft.deliverables),
        rates: toNullableNumber(createDraft.rates),
        mediaKit: asText(createDraft.mediaKit),
        address: asText(createDraft.address),

        additionalInfo: asText(createDraft.additionalInfo),
        selectionReason: asText(createDraft.selectionReason),
        goodFit: !!createDraft.goodFit,
        rateUsd: toNullableNumber(createDraft.rateUsd),
        ourFeePct: toNullableNumber(createDraft.ourFeePct),
        comments: asText(createDraft.comments),
      });

      setShowCreateRow(false);
      setCreateDraft(getDefaultCreateDraft(activeTab));
      await refreshAll(activeTab);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to create row.');
    } finally {
      setCreating(false);
    }
  }

  async function moveToRoster(id: string) {
    try {
      await post('/pipeline/move-to-roster', { id });
      await refreshAll('outreach');
    } catch (e: any) {
      await showErr(e?.message || 'Failed to move to roster.');
    }
  }

  async function moveToPitch(id: string) {
    try {
      await post('/pipeline/move-to-pitch', { id });
      await refreshAll('roster');
    } catch (e: any) {
      await showErr(e?.message || 'Failed to move to pitch.');
    }
  }

  const campaignTitle = campaign?.campaignTitle || initialName || 'Campaign Pipeline';
  const brandName = campaign?.brandName || DASH;

  function textCell(value: React.ReactNode) {
    return <div className="min-w-[140px] text-sm text-slate-800">{value || DASH}</div>;
  }

  function inputCell(
    key: string,
    type: 'text' | 'number' | 'date' = 'text',
    placeholder = ''
  ) {
    return (
      <input
        type={type}
        value={draft[key] ?? ''}
        onChange={(e) => setField(key, e.target.value)}
        placeholder={placeholder}
        className="min-w-[140px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
      />
    );
  }

  function createInputCell(
    key: string,
    type: 'text' | 'number' | 'date' = 'text',
    placeholder = ''
  ) {
    return (
      <input
        type={type}
        value={createDraft[key] ?? ''}
        onChange={(e) => setCreateField(key, e.target.value)}
        placeholder={placeholder}
        className="min-w-[140px] rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
      />
    );
  }

  function textareaCell(key: string, placeholder = '') {
    return (
      <textarea
        value={draft[key] ?? ''}
        onChange={(e) => setField(key, e.target.value)}
        placeholder={placeholder}
        className="min-w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
        rows={2}
      />
    );
  }

  function createTextareaCell(key: string, placeholder = '') {
    return (
      <textarea
        value={createDraft[key] ?? ''}
        onChange={(e) => setCreateField(key, e.target.value)}
        placeholder={placeholder}
        className="min-w-[180px] rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
        rows={2}
      />
    );
  }

  function checkboxCell(key: string) {
    return (
      <input
        type="checkbox"
        checked={!!draft[key]}
        onChange={(e) => setField(key, e.target.checked)}
        className="h-4 w-4"
      />
    );
  }

  function createCheckboxCell(key: string) {
    return (
      <input
        type="checkbox"
        checked={!!createDraft[key]}
        onChange={(e) => setCreateField(key, e.target.checked)}
        className="h-4 w-4"
      />
    );
  }

  if (!campaignId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Invalid Campaign</h1>
            <p className="mt-2 text-slate-600">
              Campaign id is missing in URL. Open this page with
              <span className="mx-1 font-mono">?id=campaignId</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderSelectionHeader = () => (
    <th className="px-4 py-3">
      <input
        type="checkbox"
        checked={allSelected}
        ref={(el) => {
          if (el) el.indeterminate = !allSelected && someSelected;
        }}
        onChange={(e) => toggleSelectAll(e.target.checked)}
        className="h-4 w-4"
      />
    </th>
  );

  const renderSelectionCell = (rowId: string) => (
    <td className="px-4 py-3">
      <input
        type="checkbox"
        checked={!!selectedIds[rowId]}
        onChange={(e) => toggleRowSelection(rowId, e.target.checked)}
        className="h-4 w-4"
      />
    </td>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <FolderKanban className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-slate-900">{campaignTitle}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Brand: <b className="text-slate-800">{brandName}</b>
                  </span>
                  <span>
                    Status: <b className="capitalize text-slate-800">{campaign?.status || DASH}</b>
                  </span>
                  <span>
                    Platforms:{' '}
                    <b className="text-slate-800">{campaign?.platformSelection?.join(', ') || DASH}</b>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCreateRow}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add New
            </button>

            <button
              type="button"
              onClick={() => refreshAll(activeTab)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${(loading || metaLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <TabButton
              active={activeTab === 'outreach'}
              count={counts.outreach}
              onClick={() => setActiveTab('outreach')}
            >
              Outreach
            </TabButton>

            <TabButton
              active={activeTab === 'roster'}
              count={counts.roster}
              onClick={() => setActiveTab('roster')}
            >
              Roster
            </TabButton>

            <TabButton
              active={activeTab === 'pitch'}
              count={counts.pitch}
              onClick={() => setActiveTab('pitch')}
            >
              Pitch
            </TabButton>
          </div>

          <div className="text-sm text-slate-600">
            Selected: <b className="text-slate-900">{selectedCount}</b>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {activeTab === 'outreach' && 'Outreach'}
              {activeTab === 'roster' && 'Roster'}
              {activeTab === 'pitch' && 'Pitch'}
            </h2>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-slate-500">
              <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin" />
              Loading...
            </div>
          ) : !rows.length && !showCreateRow ? (
            <div className="px-6 py-16 text-center text-slate-500">
              No rows found in {activeTab}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              {activeTab === 'outreach' && (
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-xs uppercase tracking-wide text-slate-600">
                      {renderSelectionHeader()}
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Followers</th>
                      <th className="px-4 py-3">Links</th>
                      <th className="px-4 py-3">Niche</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Outreached</th>
                      <th className="px-4 py-3">Follow Up 1</th>
                      <th className="px-4 py-3">Follow Up 2</th>
                      <th className="px-4 py-3">Reply</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showCreateRow && (
                      <tr className="border-t border-blue-200 bg-blue-50/40 align-top">
                        <td className="px-4 py-3">New</td>
                        <td className="px-4 py-3">{createInputCell('name')}</td>
                        <td className="px-4 py-3">{createInputCell('followers', 'number')}</td>
                        <td className="px-4 py-3">{createInputCell('links')}</td>
                        <td className="px-4 py-3">{createInputCell('niche')}</td>
                        <td className="px-4 py-3">{createInputCell('email')}</td>
                        <td className="px-4 py-3">{createInputCell('outreachDate', 'date')}</td>
                        <td className="px-4 py-3">{createCheckboxCell('outreached')}</td>
                        <td className="px-4 py-3">{createInputCell('followUp1SentAt', 'date')}</td>
                        <td className="px-4 py-3">{createInputCell('followUp2SentAt', 'date')}</td>
                        <td className="px-4 py-3">{createTextareaCell('replyText')}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={createRow}
                              disabled={creating}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <Save className="h-4 w-4" />
                              {creating ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelCreateRow}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {rows.map((row) => {
                      const isEdit = editingId === row._id;

                      return (
                        <tr key={row._id} className="border-t border-slate-200 align-top">
                          {renderSelectionCell(row._id)}
                          <td className="px-4 py-3">{textCell(row.name || DASH)}</td>
                          <td className="px-4 py-3">{textCell(formatNumber(row.followers))}</td>
                          <td className="px-4 py-3">
                            {textCell(
                              row.primaryLink ? (
                                <a
                                  href={row.primaryLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 underline"
                                >
                                  Open
                                </a>
                              ) : joinList(row.links)
                            )}
                          </td>
                          <td className="px-4 py-3">{textCell(joinList(row.niche))}</td>
                          <td className="px-4 py-3">
                            {isEdit ? inputCell('email') : textCell(row.email || DASH)}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? inputCell('outreachDate', 'date') : textCell(formatDate(row.outreachDate))}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? checkboxCell('outreached') : textCell(row.outreached ? 'Yes' : 'No')}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? inputCell('followUp1SentAt', 'date') : textCell(formatDate(row.followUp1SentAt))}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? inputCell('followUp2SentAt', 'date') : textCell(formatDate(row.followUp2SentAt))}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? textareaCell('replyText') : textCell(row.replyText || DASH)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {isEdit ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={saveRow}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                  >
                                    <Save className="h-4 w-4" />
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    <X className="h-4 w-4" />
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEdit(row)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => moveToRoster(row._id)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                  >
                                    <Check className="h-4 w-4" />
                                    Move to Roster
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {activeTab === 'roster' && (
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-xs uppercase tracking-wide text-slate-600">
                      {renderSelectionHeader()}
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Followers</th>
                      <th className="px-4 py-3">Links</th>
                      <th className="px-4 py-3">Niche</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Demographics</th>
                      <th className="px-4 py-3">Engagement Rate</th>
                      <th className="px-4 py-3">Deliverables</th>
                      <th className="px-4 py-3">Rates</th>
                      <th className="px-4 py-3">Media Kit</th>
                      <th className="px-4 py-3">Address</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showCreateRow && (
                      <tr className="border-t border-blue-200 bg-blue-50/40 align-top">
                        <td className="px-4 py-3">New</td>
                        <td className="px-4 py-3">{createInputCell('name')}</td>
                        <td className="px-4 py-3">{createInputCell('followers', 'number')}</td>
                        <td className="px-4 py-3">{createInputCell('links')}</td>
                        <td className="px-4 py-3">{createInputCell('niche')}</td>
                        <td className="px-4 py-3">{createInputCell('email')}</td>
                        <td className="px-4 py-3">{createTextareaCell('demographics')}</td>
                        <td className="px-4 py-3">{createInputCell('engagementRate', 'number')}</td>
                        <td className="px-4 py-3">{createTextareaCell('deliverables')}</td>
                        <td className="px-4 py-3">{createInputCell('rates', 'number')}</td>
                        <td className="px-4 py-3">{createInputCell('mediaKit')}</td>
                        <td className="px-4 py-3">{createTextareaCell('address')}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={createRow}
                              disabled={creating}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <Save className="h-4 w-4" />
                              {creating ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelCreateRow}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {rows.map((row) => {
                      const isEdit = editingId === row._id;

                      return (
                        <tr key={row._id} className="border-t border-slate-200 align-top">
                          {renderSelectionCell(row._id)}
                          <td className="px-4 py-3">{textCell(row.name || DASH)}</td>
                          <td className="px-4 py-3">{textCell(formatNumber(row.followers))}</td>
                          <td className="px-4 py-3">
                            {textCell(
                              row.primaryLink ? (
                                <a
                                  href={row.primaryLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 underline"
                                >
                                  Open
                                </a>
                              ) : joinList(row.links)
                            )}
                          </td>
                          <td className="px-4 py-3">{textCell(joinList(row.niche))}</td>
                          <td className="px-4 py-3">
                            {isEdit ? inputCell('email') : textCell(row.email || DASH)}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? textareaCell('demographics') : textCell(row.demographics || DASH)}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? inputCell('engagementRate', 'number') : textCell(formatPercent(row.engagementRate))}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? textareaCell('deliverables') : textCell(row.deliverables || DASH)}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? inputCell('rates', 'number') : textCell(formatNumber(row.rates))}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? inputCell('mediaKit') : textCell(row.mediaKit || DASH)}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? textareaCell('address') : textCell(row.address || DASH)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {isEdit ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={saveRow}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                  >
                                    <Save className="h-4 w-4" />
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    <X className="h-4 w-4" />
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEdit(row)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => moveToPitch(row._id)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                  >
                                    <Check className="h-4 w-4" />
                                    Move to Pitch
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {activeTab === 'pitch' && (
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-xs uppercase tracking-wide text-slate-600">
                      {renderSelectionHeader()}
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Followers</th>
                      <th className="px-4 py-3">Links</th>
                      <th className="px-4 py-3">Niche</th>
                      <th className="px-4 py-3">Country</th>
                      <th className="px-4 py-3">Additional Info</th>
                      <th className="px-4 py-3">Selection Reason</th>
                      <th className="px-4 py-3">Good Fit</th>
                      <th className="px-4 py-3">Rate USD</th>
                      <th className="px-4 py-3">Our Fee (%)</th>
                      <th className="px-4 py-3">Comments</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showCreateRow && (
                      <tr className="border-t border-blue-200 bg-blue-50/40 align-top">
                        <td className="px-4 py-3">New</td>
                        <td className="px-4 py-3">{createInputCell('name')}</td>
                        <td className="px-4 py-3">{createInputCell('followers', 'number')}</td>
                        <td className="px-4 py-3">{createInputCell('links')}</td>
                        <td className="px-4 py-3">{createInputCell('niche')}</td>
                        <td className="px-4 py-3">{createInputCell('country')}</td>
                        <td className="px-4 py-3">{createTextareaCell('additionalInfo')}</td>
                        <td className="px-4 py-3">{createTextareaCell('selectionReason')}</td>
                        <td className="px-4 py-3">{createCheckboxCell('goodFit')}</td>
                        <td className="px-4 py-3">{createInputCell('rateUsd', 'number')}</td>
                        <td className="px-4 py-3">{createInputCell('ourFeePct', 'number')}</td>
                        <td className="px-4 py-3">{createTextareaCell('comments')}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={createRow}
                              disabled={creating}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <Save className="h-4 w-4" />
                              {creating ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelCreateRow}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {rows.map((row) => {
                      const isEdit = editingId === row._id;

                      return (
                        <tr key={row._id} className="border-t border-slate-200 align-top">
                          {renderSelectionCell(row._id)}
                          <td className="px-4 py-3">{textCell(row.name || DASH)}</td>
                          <td className="px-4 py-3">{textCell(formatNumber(row.followers))}</td>
                          <td className="px-4 py-3">
                            {textCell(
                              row.primaryLink ? (
                                <a
                                  href={row.primaryLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 underline"
                                >
                                  Open
                                </a>
                              ) : joinList(row.links)
                            )}
                          </td>
                          <td className="px-4 py-3">{textCell(joinList(row.niche))}</td>
                          <td className="px-4 py-3">
                            {isEdit ? inputCell('country') : textCell(row.country || DASH)}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? textareaCell('additionalInfo') : textCell(row.additionalInfo || DASH)}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? textareaCell('selectionReason') : textCell(row.selectionReason || DASH)}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? checkboxCell('goodFit') : textCell(row.goodFit ? 'Yes' : 'No')}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? inputCell('rateUsd', 'number') : textCell(formatNumber(row.rateUsd))}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? inputCell('ourFeePct', 'number') : textCell(row.ourFeePct ?? DASH)}
                          </td>
                          <td className="px-4 py-3">
                            {isEdit ? textareaCell('comments') : textCell(row.comments || DASH)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {isEdit ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={saveRow}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                  >
                                    <Save className="h-4 w-4" />
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    <X className="h-4 w-4" />
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEdit(row)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  <Edit3 className="h-4 w-4" />
                                  Edit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}