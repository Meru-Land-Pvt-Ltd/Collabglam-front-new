'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderKanban,
  Plus,
  RefreshCw,
  Loader2,
  Search,
  Link2,
  X,
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

function AdminMeta({ admin }: { admin?: AdminMini | null }) {
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
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
  });

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
      setOpenCreateModal(false);
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
      <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="rounded-xl"
                  onClick={() => setOpenCreateModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Folder
                </Button>

                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => loadFolders()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              <div className="relative w-full lg:max-w-sm">
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
            </div>

            <div>
              <CardTitle>Pitch Folders</CardTitle>
              <CardDescription>
                Full table view. Click anywhere on a row to open that folder.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : !folders.length ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                No folders available for your access level.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1350px] text-sm">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200 text-left">
                        <th className="px-4 py-3 font-semibold text-slate-700">Folder</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Description</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Created By</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Last Updated By</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Created On</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Updated On</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-700">
                          Influencers
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-700">
                          Share
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white">
                      {folders.map((folder) => (
                        <tr
                          key={folder._id}
                          onClick={() => router.push(`/admin/pitch-folders/${folder._id}`)}
                          className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                        >
                          <td className="px-4 py-4 align-top">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                                <FolderKanban className="h-5 w-5" />
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[240px] truncate font-semibold text-slate-900">
                                  {folder.title}
                                </p>
                                {folder.slug ? (
                                  <p className="mt-1 text-xs text-slate-500">
                                    Slug: {folder.slug}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top text-slate-600">
                            <p className="max-w-[260px] whitespace-normal break-words">
                              {folder.description || 'No description added.'}
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <AdminMeta admin={folder.createdBy} />
                          </td>

                          <td className="px-4 py-4 align-top">
                            <AdminMeta admin={folder.updatedBy} />
                          </td>

                          <td className="px-4 py-4 align-top text-slate-700">
                            {formatDate(folder.createdAt)}
                          </td>

                          <td className="px-4 py-4 align-top text-slate-700">
                            {formatDate(folder.updatedAt)}
                          </td>

                          <td className="px-4 py-4 text-center align-top">
                            <Badge variant="secondary" className="rounded-full">
                              {folder.itemCount || 0}
                            </Badge>
                          </td>

                          <td className="px-4 py-4 text-center align-top">
                            {folder.share?.url ? (
                              <Badge variant="outline" className="rounded-full">
                                <Link2 className="mr-1 h-3.5 w-3.5" />
                                Shared
                              </Badge>
                            ) : (
                              <span className="text-sm text-slate-500">--</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {openCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Create Folder</h2>
                <p className="text-sm text-slate-500">
                  Create a folder and open it immediately after creation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpenCreateModal(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
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
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-4">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setOpenCreateModal(false)}
                disabled={creating}
              >
                Cancel
              </Button>

              <Button
                className="rounded-xl"
                onClick={createFolder}
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Folder
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}