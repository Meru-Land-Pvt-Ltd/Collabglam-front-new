'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  FolderKanban,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Users,
  X,
  Youtube,
  Shield,
  Workflow,
  Mail,
  AtSign,
  CalendarDays,
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
import { Checkbox } from '@/components/ui/checkbox';
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
  parentAdmin?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
    designation?: string;
    teamType?: string | null;
  } | null;
  rootAdmin?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
    designation?: string;
    teamType?: string | null;
  } | null;
  createdBy?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
    designation?: string;
    teamType?: string | null;
  } | null;
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

type FolderItem = {
  _id: string;
  provider?: string;
  name?: string;
  username?: string;
  handle?: string;
  followers?: number | null;
  primaryLink?: string;
  links?: string[];
  niche?: string[];
  email?: string;
  country?: string;
  additionalInfo?: string;
  selectionReason?: string;
  goodFit?: boolean | null;
  rateUsd?: number | null;
  ourFeePct?: number | null;
  comments?: string;
};

type FolderResponse = {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: AdminMini | null;
  updatedBy?: AdminMini | null;
  share?: FolderShare;
  items?: FolderItem[];
};

type DraftState = Record<string, any>;

const DASH = '--';

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

function formatNumber(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return DASH;
  return new Intl.NumberFormat('en-IN').format(n);
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

function prettyText(value?: string | null) {
  const v = String(value || '').trim();
  if (!v) return DASH;
  return v
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getDefaultCreateDraft() {
  return {
    provider: 'instagram',
    name: '',
    username: '',
    handle: '',
    followers: '',
    links: '',
    niche: '',
    email: '',
    country: '',
    additionalInfo: '',
    selectionReason: '',
    goodFit: false,
    rateUsd: '',
    ourFeePct: '',
    comments: '',
  };
}

function AdminMeta({
  admin,
}: {
  admin?: AdminMini | null;
}) {
  if (!admin) {
    return <span className="text-sm text-slate-500">--</span>;
  }

  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-slate-900">
        {admin.name || admin.email || '--'}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>{admin.designation || prettyText(admin.role)}</span>
        {admin.teamType ? (
          <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">
            {prettyText(admin.teamType)}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

function ProviderBadge({ provider }: { provider?: string }) {
  const value = String(provider || 'other').toLowerCase();
  const tone =
    value === 'youtube'
      ? 'bg-red-50 text-red-700 ring-red-200'
      : value === 'instagram'
        ? 'bg-pink-50 text-pink-700 ring-pink-200'
        : value === 'tiktok'
          ? 'bg-slate-100 text-slate-800 ring-slate-200'
          : 'bg-slate-100 text-slate-700 ring-slate-200';

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone}`}>
      {prettyText(value)}
    </span>
  );
}

export default function PitchFolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = asText(params?.id);

  const [folder, setFolder] = useState<FolderResponse | null>(null);
  const [rows, setRows] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [editingId, setEditingId] = useState<string>('');
  const [draft, setDraft] = useState<DraftState>({});

  const [showCreateRow, setShowCreateRow] = useState(false);
  const [createDraft, setCreateDraft] = useState<DraftState>(getDefaultCreateDraft());

  const totalItems = useMemo(() => rows.length, [rows]);

  async function loadFolder() {
    if (!folderId) return;

    setLoading(true);
    try {
      const resp = await get<{ success: boolean; data: FolderResponse }>(
        `/pitch-folders/${folderId}`
      );
      const data = resp?.data || null;
      setFolder(data);
      setRows(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load folder.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!folderId) return;
    setShowCreateRow(false);
    setEditingId('');
    setDraft({});
    setCreateDraft(getDefaultCreateDraft());
    loadFolder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  function startEdit(row: FolderItem) {
    setShowCreateRow(false);
    setEditingId(row._id);
    setDraft({
      itemId: row._id,
      provider: row.provider || 'instagram',
      name: row.name || '',
      username: row.username || '',
      handle: row.handle || '',
      followers: row.followers ?? '',
      links: Array.isArray(row.links) ? row.links.join(', ') : row.primaryLink || '',
      niche: Array.isArray(row.niche) ? row.niche.join(', ') : '',
      email: row.email || '',
      country: row.country || '',
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
    setCreateDraft(getDefaultCreateDraft());
  }

  function cancelCreateRow() {
    setShowCreateRow(false);
    setCreateDraft(getDefaultCreateDraft());
  }

  function setField(key: string, value: any) {
    setDraft((p: DraftState) => ({ ...p, [key]: value }));
  }

  function setCreateField(key: string, value: any) {
    setCreateDraft((p: DraftState) => ({ ...p, [key]: value }));
  }

  async function saveRow() {
    try {
      const itemId = asText(draft.itemId);
      if (!itemId) return;

      await post('/pitch-folders/item/update', {
        folderId,
        itemId,
        provider: asText(draft.provider),
        name: asText(draft.name),
        username: asText(draft.username),
        handle: asText(draft.handle),
        followers: toNullableNumber(draft.followers),
        links: parseCsv(asText(draft.links)),
        niche: parseCsv(asText(draft.niche)),
        email: asText(draft.email),
        country: asText(draft.country),
        additionalInfo: asText(draft.additionalInfo),
        selectionReason: asText(draft.selectionReason),
        goodFit: !!draft.goodFit,
        rateUsd: toNullableNumber(draft.rateUsd),
        ourFeePct: toNullableNumber(draft.ourFeePct),
        comments: asText(draft.comments),
      });

      setEditingId('');
      setDraft({});
      await loadFolder();
      await showSuccess('Influencer updated successfully.');
    } catch (e: any) {
      await showErr(e?.message || 'Failed to save influencer.');
    }
  }

  async function createRow() {
    try {
      if (!folderId) return;
      setCreating(true);

      await post(`/pitch-folders/${folderId}/item`, {
        provider: asText(createDraft.provider),
        name: asText(createDraft.name),
        username: asText(createDraft.username),
        handle: asText(createDraft.handle),
        followers: toNullableNumber(createDraft.followers),
        links: parseCsv(asText(createDraft.links)),
        niche: parseCsv(asText(createDraft.niche)),
        email: asText(createDraft.email),
        country: asText(createDraft.country),
        additionalInfo: asText(createDraft.additionalInfo),
        selectionReason: asText(createDraft.selectionReason),
        goodFit: !!createDraft.goodFit,
        rateUsd: toNullableNumber(createDraft.rateUsd),
        ourFeePct: toNullableNumber(createDraft.ourFeePct),
        comments: asText(createDraft.comments),
      });

      setShowCreateRow(false);
      setCreateDraft(getDefaultCreateDraft());
      await loadFolder();
      await showSuccess('Influencer added successfully.');
    } catch (e: any) {
      await showErr(e?.message || 'Failed to create influencer.');
    } finally {
      setCreating(false);
    }
  }

  async function deleteRow(itemId: string) {
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
  }

  async function copyShareLink() {
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
      await showSuccess('Share link copied.');
      await loadFolder();
    } catch (e: any) {
      await showErr(e?.message || 'Failed to copy share link.');
    } finally {
      setSharing(false);
    }
  }

  async function handleGetLink(row: FolderItem) {
    try {
      const provider = asText(row.provider).toLowerCase();
      const username =
        asText(row.username).replace(/^@/, '') ||
        asText(row.handle).replace(/^@/, '');

      if (!provider) {
        await showErr('Platform is missing for this creator.');
        return;
      }

      if (!username) {
        await showErr('Username/handle is missing for this creator.');
        return;
      }

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

      const link = resp?.data?.link;

      if (!link) {
        await showErr(resp?.error || 'Could not generate media kit link.');
        return;
      }

      await navigator.clipboard.writeText(link);
      await showSuccess('Media kit link copied.');
    } catch (e: any) {
      await showErr(e?.message || 'Failed to copy media kit link.');
    }
  }

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
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1700px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="overflow-hidden rounded-3xl border shadow-sm">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white sm:px-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                    <Sparkles className="h-3.5 w-3.5" />
                    Folder influencers
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                      <FolderKanban className="h-7 w-7" />
                    </div>

                    <div>
                      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        {folder?.title || 'Pitch Folder'}
                      </h1>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80">
                        <span>
                          Created by{' '}
                          <b className="text-white">
                            {folder?.createdBy?.name || folder?.createdBy?.email || DASH}
                          </b>
                        </span>
                        <span>
                          {folder?.createdBy?.designation || prettyText(folder?.createdBy?.role)}
                        </span>
                        {folder?.createdBy?.teamType ? (
                          <span>{prettyText(folder.createdBy.teamType)}</span>
                        ) : null}
                        <span>{formatDate(folder?.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:w-[440px]">
                  <Card className="rounded-2xl border-white/10 bg-white/10 text-white shadow-none">
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="text-sm text-white/70">Influencers</p>
                        <p className="mt-1 text-2xl font-semibold">{totalItems}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                        <Users className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      className="rounded-xl"
                      onClick={() => router.push('/admin/pitch-folders')}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Folders
                    </Button>

                    <Button
                      variant="outline"
                      className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20"
                      onClick={copyShareLink}
                      disabled={sharing}
                    >
                      {sharing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Link2 className="mr-2 h-4 w-4" />
                      )}
                      Copy Share Link
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-lg">Influencers Table</CardTitle>
                <CardDescription>
                  Inline add, inline edit, media-kit link copy, and YouTube import.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" className="rounded-xl" onClick={loadFolder}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Refresh
                </Button>

                <Button className="rounded-xl" onClick={openCreateRow}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New
                </Button>

                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => router.push(`/admin/youtube?folderId=${folderId}`)}
                >
                  <Youtube className="mr-2 h-4 w-4" />
                  Add from Youtube
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : !rows.length && !showCreateRow ? (
                <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                  No influencers found in this folder.
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[1800px]">
                    <Table className="w-full table-auto">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Handle</TableHead>
                          <TableHead>Followers</TableHead>
                          <TableHead>Links</TableHead>
                          <TableHead>Niche</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Additional Info</TableHead>
                          <TableHead>Selection Reason</TableHead>
                          <TableHead>Good Fit</TableHead>
                          <TableHead>Rate USD</TableHead>
                          <TableHead>Our Fee (%)</TableHead>
                          <TableHead>Comments</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {showCreateRow ? (
                          <TableRow className="bg-muted/40">
                            <TableCell>
                              <Input value={createDraft.name} onChange={(e) => setCreateField('name', e.target.value)} />
                            </TableCell>
                            <TableCell>
                              <select
                                value={createDraft.provider}
                                onChange={(e) => setCreateField('provider', e.target.value)}
                                className="h-10 w-[140px] rounded-md border border-input bg-background px-3 text-sm"
                              >
                                <option value="instagram">Instagram</option>
                                <option value="youtube">Youtube</option>
                                <option value="tiktok">Tiktok</option>
                                <option value="other">Other</option>
                              </select>
                            </TableCell>
                            <TableCell>
                              <Input value={createDraft.username} onChange={(e) => setCreateField('username', e.target.value)} />
                            </TableCell>
                            <TableCell>
                              <Input value={createDraft.handle} onChange={(e) => setCreateField('handle', e.target.value)} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" value={createDraft.followers} onChange={(e) => setCreateField('followers', e.target.value)} />
                            </TableCell>
                            <TableCell>
                              <Input value={createDraft.links} onChange={(e) => setCreateField('links', e.target.value)} placeholder="comma separated" />
                            </TableCell>
                            <TableCell>
                              <Input value={createDraft.niche} onChange={(e) => setCreateField('niche', e.target.value)} placeholder="comma separated" />
                            </TableCell>
                            <TableCell>
                              <Input value={createDraft.email} onChange={(e) => setCreateField('email', e.target.value)} />
                            </TableCell>
                            <TableCell>
                              <Input value={createDraft.country} onChange={(e) => setCreateField('country', e.target.value)} />
                            </TableCell>
                            <TableCell>
                              <Textarea value={createDraft.additionalInfo} onChange={(e) => setCreateField('additionalInfo', e.target.value)} rows={2} />
                            </TableCell>
                            <TableCell>
                              <Textarea value={createDraft.selectionReason} onChange={(e) => setCreateField('selectionReason', e.target.value)} rows={2} />
                            </TableCell>
                            <TableCell>
                              <Checkbox checked={!!createDraft.goodFit} onCheckedChange={(checked) => setCreateField('goodFit', !!checked)} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" value={createDraft.rateUsd} onChange={(e) => setCreateField('rateUsd', e.target.value)} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" value={createDraft.ourFeePct} onChange={(e) => setCreateField('ourFeePct', e.target.value)} />
                            </TableCell>
                            <TableCell>
                              <Textarea value={createDraft.comments} onChange={(e) => setCreateField('comments', e.target.value)} rows={2} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" onClick={createRow} disabled={creating}>
                                  {creating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                  )}
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelCreateRow}>
                                  <X className="mr-2 h-4 w-4" />
                                  Cancel
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}

                        {rows.map((row) => {
                          const isEdit = editingId === row._id;

                          return (
                            <TableRow key={row._id}>
                              <TableCell className="font-medium">
                                {isEdit ? (
                                  <Input value={draft.name ?? ''} onChange={(e) => setField('name', e.target.value)} />
                                ) : (
                                  row.name || DASH
                                )}
                              </TableCell>

                              <TableCell>
                                {isEdit ? (
                                  <select
                                    value={draft.provider ?? 'instagram'}
                                    onChange={(e) => setField('provider', e.target.value)}
                                    className="h-10 w-[140px] rounded-md border border-input bg-background px-3 text-sm"
                                  >
                                    <option value="instagram">Instagram</option>
                                    <option value="youtube">Youtube</option>
                                    <option value="tiktok">Tiktok</option>
                                    <option value="other">Other</option>
                                  </select>
                                ) : (
                                  <ProviderBadge provider={row.provider} />
                                )}
                              </TableCell>

                              <TableCell>
                                {isEdit ? (
                                  <Input value={draft.username ?? ''} onChange={(e) => setField('username', e.target.value)} />
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-sm">
                                    <AtSign className="h-3.5 w-3.5 text-slate-400" />
                                    {row.username || DASH}
                                  </span>
                                )}
                              </TableCell>

                              <TableCell>
                                {isEdit ? (
                                  <Input value={draft.handle ?? ''} onChange={(e) => setField('handle', e.target.value)} />
                                ) : (
                                  row.handle || DASH
                                )}
                              </TableCell>

                              <TableCell>
                                {isEdit ? (
                                  <Input type="number" value={draft.followers ?? ''} onChange={(e) => setField('followers', e.target.value)} />
                                ) : (
                                  formatNumber(row.followers)
                                )}
                              </TableCell>

                              <TableCell>
                                {isEdit ? (
                                  <Input value={draft.links ?? ''} onChange={(e) => setField('links', e.target.value)} />
                                ) : row.primaryLink ? (
                                  <a
                                    href={row.primaryLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm font-medium text-primary underline underline-offset-4"
                                  >
                                    Open
                                  </a>
                                ) : (
                                  joinList(row.links)
                                )}
                              </TableCell>

                              <TableCell>
                                {isEdit ? (
                                  <Input value={draft.niche ?? ''} onChange={(e) => setField('niche', e.target.value)} />
                                ) : (
                                  joinList(row.niche)
                                )}
                              </TableCell>

                              <TableCell>
                                {isEdit ? (
                                  <Input value={draft.email ?? ''} onChange={(e) => setField('email', e.target.value)} />
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-sm">
                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                    {row.email || DASH}
                                  </span>
                                )}
                              </TableCell>

                              <TableCell>
                                {isEdit ? (
                                  <Input value={draft.country ?? ''} onChange={(e) => setField('country', e.target.value)} />
                                ) : (
                                  row.country || DASH
                                )}
                              </TableCell>

                              <TableCell>
                                {isEdit ? (
                                  <Textarea value={draft.additionalInfo ?? ''} onChange={(e) => setField('additionalInfo', e.target.value)} rows={2} />
                                ) : (
                                  row.additionalInfo || DASH
                                )}
                              </TableCell>

                              <TableCell>
                                {isEdit ? (
                                  <Textarea value={draft.selectionReason ?? ''} onChange={(e) => setField('selectionReason', e.target.value)} rows={2} />
                                ) : (
                                  row.selectionReason || DASH
                                )}
                              </TableCell>

                              <TableCell>
                                {isEdit ? (
                                  <Checkbox checked={!!draft.goodFit} onCheckedChange={(checked) => setField('goodFit', !!checked)} />
                                ) : (
                                  <Badge variant={row.goodFit ? 'default' : 'secondary'}>
                                    {row.goodFit ? 'Yes' : 'No'}
                                  </Badge>
                                )}
                              </TableCell>

                              <TableCell>
                                {isEdit ? (
                                  <Input type="number" value={draft.rateUsd ?? ''} onChange={(e) => setField('rateUsd', e.target.value)} />
                                ) : (
                                  formatNumber(row.rateUsd)
                                )}
                              </TableCell>

                              <TableCell>
                                {isEdit ? (
                                  <Input type="number" value={draft.ourFeePct ?? ''} onChange={(e) => setField('ourFeePct', e.target.value)} />
                                ) : (
                                  row.ourFeePct ?? DASH
                                )}
                              </TableCell>

                              <TableCell>
                                {isEdit ? (
                                  <Textarea value={draft.comments ?? ''} onChange={(e) => setField('comments', e.target.value)} rows={2} />
                                ) : (
                                  row.comments || DASH
                                )}
                              </TableCell>

                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {isEdit ? (
                                    <>
                                      <Button size="sm" onClick={saveRow}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                                        <X className="mr-2 h-4 w-4" />
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleGetLink(row)}
                                        disabled={!row.provider || !(row.username || row.handle)}
                                      >
                                        <Link2 className="mr-2 h-4 w-4" />
                                        Get Link
                                      </Button>

                                      <Button size="sm" variant="outline" onClick={() => startEdit(row)}>
                                        <Edit3 className="mr-2 h-4 w-4" />
                                        Edit
                                      </Button>

                                      <Button size="sm" variant="outline" onClick={() => deleteRow(row._id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Folder Ownership</CardTitle>
                <CardDescription>
                  This section reflects the backend hierarchy data for the folder.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="rounded-xl border bg-muted/40 p-3">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Created By
                    </span>
                  </div>
                  <AdminMeta admin={folder?.createdBy} />
                </div>

                <div className="rounded-xl border bg-muted/40 p-3">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <Workflow className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Updated By
                    </span>
                  </div>
                  <AdminMeta admin={folder?.updatedBy} />
                </div>

                {folder?.createdBy?.parentAdmin ? (
                  <div className="rounded-xl border bg-muted/40 p-3">
                    <div className="mb-2 flex items-center gap-2 text-slate-500">
                      <Shield className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Parent Admin
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {folder.createdBy.parentAdmin.name || folder.createdBy.parentAdmin.email || DASH}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {folder.createdBy.parentAdmin.designation ||
                        prettyText(folder.createdBy.parentAdmin.role)}
                    </p>
                  </div>
                ) : null}

                {folder?.createdBy?.rootAdmin ? (
                  <div className="rounded-xl border bg-muted/40 p-3">
                    <div className="mb-2 flex items-center gap-2 text-slate-500">
                      <Shield className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Root Admin
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {folder.createdBy.rootAdmin.name || folder.createdBy.rootAdmin.email || DASH}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {folder.createdBy.rootAdmin.designation ||
                        prettyText(folder.createdBy.rootAdmin.role)}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Share & Meta</CardTitle>
                <CardDescription>
                  Share details and folder timestamps.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Folder
                  </Label>
                  <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm">
                    {folder?.title || DASH}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Created On
                  </Label>
                  <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    {formatDate(folder?.createdAt)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Share Link
                  </Label>
                  <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm break-all">
                    {folder?.share?.url || DASH}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Shared By
                  </Label>
                  <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm">
                    {folder?.share?.sharedBy?.name ||
                      folder?.share?.sharedBy?.email ||
                      DASH}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Share Generated On
                  </Label>
                  <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm">
                    {formatDate(folder?.share?.generatedAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}