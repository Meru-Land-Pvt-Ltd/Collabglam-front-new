'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderKanban,
  Plus,
  RefreshCw,
  Loader2,
  UserRound,
  CalendarDays,
  ChevronRight,
  Files,
  Sparkles,
  Search,
  Shield,
  Workflow,
  Link2,
} from 'lucide-react';
import swal from 'sweetalert';

import { get, post } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

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

type PitchFolder = {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  itemCount?: number;
  createdBy?: AdminMini | null;
  updatedBy?: AdminMini | null;
  share?: FolderShare;
};

type ListResponse = {
  success: boolean;
  data: PitchFolder[];
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

function formatDate(value?: string | null) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(d);
}

function prettyText(value?: string | null) {
  const v = String(value || '').trim();
  if (!v) return '--';
  return v
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

export default function PitchFoldersPage() {
  const router = useRouter();

  const [folders, setFolders] = useState<PitchFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
  });

  const totalFolders = useMemo(() => folders.length, [folders]);

  const sharedFolders = useMemo(
    () => folders.filter((folder) => !!folder.share?.url).length,
    [folders]
  );

  async function loadFolders(searchText = search) {
    setLoading(true);
    try {
      const params = searchText.trim() ? { q: searchText.trim() } : {};
      const resp = await get<ListResponse>('/pitch-folders/list', params);
      setFolders(Array.isArray(resp?.data) ? resp.data : []);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load folders.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFolders('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createFolder() {
    try {
      if (!form.title.trim()) {
        await showErr('Folder name is required.');
        return;
      }

      setCreating(true);

      const resp = await post('/pitch-folders/create', {
        title: form.title,
        description: form.description,
      });

      await showSuccess('Folder created successfully.');
      setForm({ title: '', description: '' });
      await loadFolders();

      const id = resp?.data?._id;
      if (id) {
        router.push(`/admin/pitch-folders/${id}`);
      }
    } catch (e: any) {
      await showErr(e?.message || 'Failed to create folder.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="overflow-hidden rounded-3xl border shadow-sm">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white sm:px-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                    <Sparkles className="h-3.5 w-3.5" />
                    Folder workspace
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                      <FolderKanban className="h-7 w-7" />
                    </div>

                    <div>
                      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Pitch Folders
                      </h1>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80">
                        <span>
                          Create folders like <b className="text-white">Power Station Review</b>
                        </span>
                        <span>See creator designation and hierarchy</span>
                        <span>Open folder to manage influencers</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:w-[560px]">
                  <Card className="rounded-2xl border-white/10 bg-white/10 text-white shadow-none">
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="text-sm text-white/70">Total Folders</p>
                        <p className="mt-1 text-2xl font-semibold">{totalFolders}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                        <Files className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-white/10 bg-white/10 text-white shadow-none">
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="text-sm text-white/70">Shared</p>
                        <p className="mt-1 text-2xl font-semibold">{sharedFolders}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                        <Link2 className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-white/10 bg-white/10 text-white shadow-none">
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="text-sm text-white/70">Action</p>
                        <p className="mt-1 text-base font-semibold">Create & Open</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Create Folder</CardTitle>
              <CardDescription>
                Create a folder first. Influencers will be managed inside that folder page.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Folder Name</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Power Station Review"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional internal note"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button className="rounded-xl" onClick={createFolder} disabled={creating}>
                  {creating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Create Folder
                </Button>

                <Button variant="outline" className="rounded-xl" onClick={() => loadFolders()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>All Folders</CardTitle>
                <CardDescription>
                  Visible folders are already filtered by your backend role rules.
                </CardDescription>
              </div>

              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadFolders();
                  }}
                  placeholder="Search folders"
                  className="pl-9"
                />
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-44 rounded-2xl" />
                  <Skeleton className="h-44 rounded-2xl" />
                  <Skeleton className="h-44 rounded-2xl" />
                  <Skeleton className="h-44 rounded-2xl" />
                </div>
              ) : !folders.length ? (
                <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                  No folders available for your access level.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {folders.map((folder) => (
                    <button
                      key={folder._id}
                      type="button"
                      onClick={() => router.push(`/admin/pitch-folders/${folder._id}`)}
                      className="group rounded-3xl border bg-card p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                          <FolderKanban className="h-6 w-6" />
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="secondary">
                            {folder.itemCount || 0} Influencers
                          </Badge>
                          {folder.share?.url ? (
                            <Badge variant="outline" className="rounded-full">
                              Shared
                            </Badge>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4">
                        <h3 className="line-clamp-2 text-lg font-bold text-slate-900 group-hover:text-blue-700">
                          {folder.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                          {folder.description || 'No description added.'}
                        </p>
                      </div>

                      <div className="mt-5 grid gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div className="mb-2 flex items-center gap-2 text-slate-500">
                            <UserRound className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Created By
                            </span>
                          </div>
                          <AdminMeta admin={folder.createdBy} />
                          {folder.createdBy?.parentAdmin?.name ? (
                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                              <Shield className="h-3.5 w-3.5" />
                              RH: {folder.createdBy.parentAdmin.name}
                            </div>
                          ) : null}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div className="mb-2 flex items-center gap-2 text-slate-500">
                            <Workflow className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Last Updated
                            </span>
                          </div>
                          <AdminMeta admin={folder.updatedBy} />
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div className="mb-2 flex items-center gap-2 text-slate-500">
                            <CalendarDays className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Created On
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatDate(folder.createdAt)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Updated {formatDate(folder.updatedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-semibold text-blue-600">
                        <span>Open Folder</span>
                        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}