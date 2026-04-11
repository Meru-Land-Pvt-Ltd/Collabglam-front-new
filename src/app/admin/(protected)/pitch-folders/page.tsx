'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderKanban,
  Plus,
  RefreshCw,
  Loader2,
  Search,
  Link2,
  X,
  Copy,
  Pencil,
  Trash2,
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
import AdminTable, { type AdminTableColumn } from '../../components/table';

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
  return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
          <Badge
            variant="outline"
            className="rounded-full px-2 py-0 text-[10px]"
          >
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
  const [savingEdit, setSavingEdit] = useState(false);
  const [duplicatingFolderId, setDuplicatingFolderId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
  });

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
  });

  const initialLoadDone = useRef(false);

  const loadFolders = useCallback(async (searchText = '') => {
    setLoading(true);
    try {
      const query = searchText.trim();
      const params = query ? { q: query } : {};
      const resp = await get<ListResponse>('/pitch-folders/list', params);
      setFolders(Array.isArray(resp?.data) ? resp.data : []);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load folders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadFolders('');
      return;
    }

    const timer = setTimeout(() => {
      loadFolders(search);
    }, 350);

    return () => clearTimeout(timer);
  }, [search, loadFolders]);

  function resetCreateForm() {
    setForm({
      title: '',
      description: '',
    });
  }

  function resetEditForm() {
    setEditForm({
      title: '',
      description: '',
    });
  }

  async function createFolder() {
    try {
      if (!form.title.trim()) {
        await showErr('Folder name is required.');
        return;
      }

      setCreating(true);

      const resp = await post('/pitch-folders/create', {
        title: form.title.trim(),
        description: form.description.trim(),
      });

      await showSuccess('Folder created successfully.');
      resetCreateForm();
      setOpenCreateModal(false);
      await loadFolders(search);

      const id = resp?.data?._id;
    } catch (e: any) {
      await showErr(e?.message || 'Failed to create folder.');
    } finally {
      setCreating(false);
    }
  }

  function openEditFolderModal(folder: PitchFolder) {
    setEditingFolderId(folder._id);
    setEditForm({
      title: folder.title || '',
      description: folder.description || '',
    });
    setOpenEditModal(true);
  }

  function closeEditFolderModal() {
    setOpenEditModal(false);
    setEditingFolderId(null);
    resetEditForm();
  }

  async function saveFolderEdits() {
    try {
      if (!editingFolderId) {
        await showErr('Folder not selected.');
        return;
      }

      if (!editForm.title.trim()) {
        await showErr('Folder name is required.');
        return;
      }

      setSavingEdit(true);

      await post('/pitch-folders/update', {
        folderId: editingFolderId,
        title: editForm.title.trim(),
        description: editForm.description.trim(),
      });

      await showSuccess('Folder updated successfully.');
      closeEditFolderModal();
      await loadFolders(search);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to update folder.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function duplicateFolder(folder: PitchFolder) {
    try {
      setDuplicatingFolderId(folder._id);

      const resp = await post('/pitch-folders/duplicate', {
        folderId: folder._id,
      });

      await showSuccess('Folder duplicated successfully.');
      await loadFolders(search);

      const newId = resp?.data?._id;
    } catch (e: any) {
      await showErr(e?.message || 'Failed to duplicate folder.');
    } finally {
      setDuplicatingFolderId(null);
    }
  }

  async function deleteFolder(folder: PitchFolder) {
    const confirmed = await swal({
      title: 'Delete Folder?',
      text: `This will remove "${folder.title}" from the active list.`,
      icon: 'warning',
      buttons: ['Cancel', 'Delete'],
      dangerMode: true,
    });

    if (!confirmed) return;

    try {
      setDeletingFolderId(folder._id);

      await post('/pitch-folders/archive', {
        id: folder._id,
      });

      await showSuccess('Folder deleted successfully.');
      await loadFolders(search);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to delete folder.');
    } finally {
      setDeletingFolderId(null);
    }
  }

  const totalInfluencers = useMemo(() => {
    return folders.reduce((sum, folder) => sum + Number(folder.itemCount || 0), 0);
  }, [folders]);

  const sharedFolders = useMemo(() => {
    return folders.filter((folder) => Boolean(folder.share?.url)).length;
  }, [folders]);

  const columns = useMemo<AdminTableColumn<PitchFolder>[]>(
    () => [
      {
        id: 'folder',
        header: 'Folder',
        widthClassName: 'min-w-[260px]',
        render: (folder) => (
          <div className="flex items-center gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <FolderKanban className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="max-w-[240px] truncate text-sm font-bold text-slate-900">
                {folder.title}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'description',
        header: 'Description',
        widthClassName: 'min-w-[260px]',
        render: (folder) => (
          <p className="max-w-[280px] whitespace-normal break-words text-sm text-slate-600">
            {folder.description || 'No description added.'}
          </p>
        ),
      },
      {
        id: 'createdBy',
        header: 'Created By',
        widthClassName: 'min-w-[220px]',
        render: (folder) => <AdminMeta admin={folder.createdBy} />,
      },
      {
        id: 'updatedBy',
        header: 'Last Updated By',
        widthClassName: 'min-w-[220px]',
        render: (folder) => <AdminMeta admin={folder.updatedBy} />,
      },
      {
        id: 'createdAt',
        header: 'Created On',
        widthClassName: 'min-w-[130px]',
        render: (folder) => (
          <span className="text-sm font-medium text-slate-700">
            {formatDate(folder.createdAt)}
          </span>
        ),
      },
      {
        id: 'updatedAt',
        header: 'Updated On',
        widthClassName: 'min-w-[130px]',
        render: (folder) => (
          <span className="text-sm font-medium text-slate-700">
            {formatDate(folder.updatedAt)}
          </span>
        ),
      },
      {
        id: 'itemCount',
        header: 'Influencers',
        align: 'center',
        widthClassName: 'min-w-[120px]',
        render: (folder) => (
          <div className="flex justify-center">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {folder.itemCount || 0}
            </Badge>
          </div>
        ),
      },
      {
        id: 'share',
        header: 'Share',
        align: 'center',
        widthClassName: 'min-w-[120px]',
        render: (folder) => (
          <div className="flex justify-center">
            {folder.share?.url ? (
              <Badge variant="outline" className="rounded-full px-3 py-1">
                <Link2 className="mr-1 h-3.5 w-3.5" />
                Shared
              </Badge>
            ) : (
              <span className="text-sm text-slate-500">--</span>
            )}
          </div>
        ),
      },
    ],
    []
  );

  const searchActive = search.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Admin Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Pitch Folders
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Organize selected influencers, their details, rate cards, and media kits for brand sharing.
            </p>
          </div>

          <Button
            onClick={() => setOpenCreateModal(true)}
            className="h-11 rounded-xl px-5 shadow-sm lg:self-start"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Folder
          </Button>
        </div>

        <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px_220px]">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by folder name, description, or slug..."
                    className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-10"
                  />
                  {searchActive ? (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={() => loadFolders(search)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Total Folders
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{folders.length}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Influencers
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{totalInfluencers}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Shared Folders
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{sharedFolders}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-white">
            <CardTitle className="text-xl">All Pitch Folders</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <AdminTable<PitchFolder>
              data={folders}
              columns={columns}
              rowKey={(row) => row._id}
              loading={loading}
              loadingRows={6}
              emptyTitle={searchActive ? 'No matching folders found' : 'No folders available'}
              emptyDescription={
                searchActive
                  ? 'Try a different keyword or clear the search to view all folders.'
                  : 'No folders are available for your access level yet.'
              }
              onRowClick={(row) => router.push(`/admin/pitch-folders/${row._id}`)}
              actions={{
                header: 'Actions',
                align: 'right',
                cellClassName: 'pr-4',
                render: (folder) => (
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      disabled={duplicatingFolderId === folder._id || deletingFolderId === folder._id}
                      onClick={() => duplicateFolder(folder)}
                    >
                      {duplicatingFolderId === folder._id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      Duplicate Folder
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      disabled={deletingFolderId === folder._id}
                      onClick={() => openEditFolderModal(folder)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={deletingFolderId === folder._id || duplicatingFolderId === folder._id}
                      onClick={() => deleteFolder(folder)}
                    >
                      {deletingFolderId === folder._id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete
                    </Button>
                  </div>
                ),
              }}
              className="w-full"
              tableClassName="min-w-[1750px]"
              headerRowClassName="bg-slate-50"
              bodyClassName="bg-white"
              rowClassName={() => 'transition hover:bg-slate-50/80'}
            />
          </CardContent>
        </Card>
      </div>

      {openCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Create Folder</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create a new folder and open it immediately after creation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpenCreateModal(false);
                  resetCreateForm();
                }}
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
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !creating) {
                      createFolder();
                    }
                  }}
                  placeholder="Power Station Review"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  <span className="text-xs text-slate-500">{form.description.length}/500</span>
                </div>

                <Textarea
                  rows={4}
                  maxLength={500}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Optional internal note"
                  className="h-28 resize-none rounded-xl"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setOpenCreateModal(false);
                  resetCreateForm();
                }}
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

      {openEditModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Edit Folder</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Only folder name and description can be updated here.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditFolderModal}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="space-y-2">
                <Label>Folder Name</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !savingEdit) {
                      saveFolderEdits();
                    }
                  }}
                  placeholder="Rename folder"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  <span className="text-xs text-slate-500">
                    {editForm.description.length}/500
                  </span>
                </div>

                <Textarea
                  rows={4}
                  maxLength={500}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Update description"
                  className="h-28 resize-none rounded-xl"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                Note: Editing here changes only the folder name and description.
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={closeEditFolderModal}
                disabled={savingEdit}
              >
                Cancel
              </Button>

              <Button
                className="rounded-xl"
                onClick={saveFolderEdits}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}