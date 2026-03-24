"use client";

import React, { useEffect, useMemo, useState } from "react";

type AdminStatus = "pending" | "active" | "inactive" | "suspended";

type AdminAccess = {
  key: string;
  name?: string;
  isEdit?: boolean;
  isDelete?: boolean;
  isManager?: boolean;
};

type AdminRow = {
  _id: string;
  email: string;
  name?: string;
  role: string;
  status?: AdminStatus;
  invitedAt?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  access?: AdminAccess[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatDT(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function normalizeKey(v: string) {
  return String(v || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

const noBlueFocus =
  "outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0";

const inputBase = `border border-black/10 rounded-lg bg-white text-sm ${noBlueFocus} focus:border-black/30`;
const selectBase = `border border-black/10 rounded-lg bg-white text-sm ${noBlueFocus} focus:border-black/30`;

const adminNav = [
  { key: "notifications", label: "Notifications" },
  { key: "brands", label: "Brands" },
  { key: "influencers", label: "Influencers" },
  { key: "campaigns", label: "All Campaigns" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "disputes", label: "Disputes" },
  { key: "emails", label: "E-Mails" },
  { key: "influencer-email", label: "Influencer-Email" },
  { key: "missing-email", label: "Missing-Email" },
  { key: "invoice-details", label: "Invoice Details" },
  { key: "payment-notification", label: "Payment Notification" },
  { key: "youtube-handle", label: "Youtube Handle" },
  { key: "modash-data", label: "Modash Data" },
  { key: "invited-influencer", label: "Invited Influencer" },
];

export default function AdminsPage() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rowMsg, setRowMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminStatus>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [page, setPage] = useState<number>(1);
  const limit = 10;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [inviteAccess, setInviteAccess] = useState<AdminAccess[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState<AdminStatus>("pending");
  const [editAccess, setEditAccess] = useState<AdminAccess[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);

  const canViewAdmins = true;
  const canEditAdmins = true;

  const roleOptions = useMemo(() => {
    return Array.from(
      new Set(rows.map((r) => String(r.role || "").trim()).filter(Boolean))
    );
  }, [rows]);

  const accessModules = useMemo(
    () =>
      adminNav.map((item) => ({
        key: normalizeKey(item.key),
        label: item.label,
      })),
    []
  );

  function getToken() {
    return typeof window !== "undefined" ? localStorage.getItem("token") : null;
  }

  async function fetchAdmins() {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();

      const res = await fetch(`${API_BASE}admins/list`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load admins");
      }

      setRows(data?.data || data || []);
    } catch (e: any) {
      setRows([]);
      setError(e?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(adminId: string, status: AdminStatus) {
    if (!canEditAdmins) return;

    setUpdatingId(adminId);
    setRowMsg(null);

    try {
      const token = getToken();

      const res = await fetch(`${API_BASE}admins/status`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ adminId, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update status");
      }

      setRows((prev) =>
        prev.map((item) => (item._id === adminId ? { ...item, status } : item))
      );

      setRowMsg(data?.message || "Status updated successfully");
    } catch (e: any) {
      setRowMsg(e?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
      setTimeout(() => setRowMsg(null), 2500);
    }
  }

  async function onInvite() {
    setInviteErr(null);

    const email = inviteEmail.trim().toLowerCase();
    const role = inviteRole.trim();

    if (!email) return setInviteErr("Email is required");
    if (!role) return setInviteErr("Role is required");

    setInviting(true);

    try {
      const token = getToken();

      const res = await fetch(`${API_BASE}admins/invite`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email,
          name: inviteName.trim() || undefined,
          role,
          access: inviteAccess,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Invite failed");
      }

      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("");
      setInviteAccess([]);
      setRowMsg(data?.message || "Invite sent successfully");
      await fetchAdmins();
    } catch (e: any) {
      setInviteErr(e?.message || "Invite failed");
    } finally {
      setInviting(false);
    }
  }

  function openEdit(admin: AdminRow) {
    setEditing(admin);
    setEditErr(null);
    setEditName(admin.name || "");
    setEditRole(admin.role || "");
    setEditStatus((admin.status || "pending") as AdminStatus);
    setEditAccess(Array.isArray(admin.access) ? admin.access : []);
    setEditOpen(true);
  }

  async function onSaveEdit() {
    if (!editing) return;
    setEditErr(null);
    setSavingEdit(true);

    try {
      const token = getToken();

      const res = await fetch(`${API_BASE}admins/update`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          adminId: editing._id,
          name: editName.trim() || undefined,
          role: editRole.trim(),
          status: editStatus,
          access: editAccess,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update admin");
      }

      setEditOpen(false);
      setEditing(null);
      setRowMsg(data?.message || "Changes saved");
      await fetchAdmins();
    } catch (e: any) {
      setEditErr(e?.message || "Failed to update admin");
    } finally {
      setSavingEdit(false);
    }
  }

  function toggleInviteAccess(moduleKey: string, label: string) {
    setInviteAccess((prev) => {
      const exists = prev.some((a) => normalizeKey(a.key) === moduleKey);
      if (exists) {
        return prev.filter((a) => normalizeKey(a.key) !== moduleKey);
      }
      return [
        ...prev,
        {
          key: moduleKey,
          name: label,
          isEdit: false,
          isDelete: false,
          isManager: false,
        },
      ];
    });
  }

  function toggleEditInviteAccess(moduleKey: string, checked: boolean) {
    setInviteAccess((prev) =>
      prev.map((a) =>
        normalizeKey(a.key) === moduleKey ? { ...a, isEdit: checked } : a
      )
    );
  }

  function toggleAdminEditAccess(moduleKey: string, label: string) {
    setEditAccess((prev) => {
      const exists = prev.some((a) => normalizeKey(a.key) === moduleKey);
      if (exists) {
        return prev.filter((a) => normalizeKey(a.key) !== moduleKey);
      }
      return [
        ...prev,
        {
          key: moduleKey,
          name: label,
          isEdit: false,
          isDelete: false,
          isManager: false,
        },
      ];
    });
  }

  function toggleAdminEditPermission(moduleKey: string, checked: boolean) {
    setEditAccess((prev) =>
      prev.map((a) =>
        normalizeKey(a.key) === moduleKey ? { ...a, isEdit: checked } : a
      )
    );
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((r) => {
      const matchesSearch =
        !q ||
        r.email?.toLowerCase().includes(q) ||
        (r.name || "").toLowerCase().includes(q) ||
        (r.role || "").toLowerCase().includes(q);

      const st = (r.status || "pending") as AdminStatus;
      const matchesStatus = statusFilter === "all" ? true : st === statusFilter;
      const matchesRole = roleFilter === "all" ? true : r.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [rows, search, statusFilter, roleFilter]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginatedRows = filteredRows.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, roleFilter]);

  if (!canViewAdmins) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          You do not have permission to view this page.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Admins</h1>
          <p className="text-sm text-black/60 mt-1">
            Manage admin accounts with role-based access
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setInviteOpen(true);
            setInviteErr(null);
            setInviteEmail("");
            setInviteName("");
            setInviteRole("");
            setInviteAccess([]);
          }}
          className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + Invite Admin
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <input
          placeholder="Search admins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputBase} w-full lg:w-80 px-3 py-2`}
        />

        <select
          className={`${selectBase} w-full lg:w-48 px-3 py-2`}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <select
          className={`${selectBase} w-full lg:w-44 px-3 py-2`}
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | AdminStatus)
          }
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>

        <button
          type="button"
          onClick={fetchAdmins}
          disabled={loading}
          className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {rowMsg ? (
        <div className="mb-4 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm">
          {rowMsg}
        </div>
      ) : null}

      <div className="rounded-2xl border border-black/10 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-black/10">
          <div className="text-sm text-black/60">
            Showing <span className="font-medium text-black">{paginatedRows.length}</span> of{" "}
            <span className="font-medium text-black">{filteredRows.length}</span>
          </div>

          <div className="text-xs text-black/50">
            {canEditAdmins ? "You can edit admins" : "View only access"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/5">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Role</th>
                <th className="text-left px-4 py-3 font-semibold">Access</th>
                <th className="text-left px-4 py-3 font-semibold">Invited At</th>
                <th className="text-left px-4 py-3 font-semibold">Last Login</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-black/60">
                    Loading admins...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-black/60">
                    No admins found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((admin) => {
                  const status = (admin.status || "pending") as AdminStatus;

                  return (
                    <tr key={admin._id} className="border-t border-black/10">
                      <td className="px-4 py-3">{admin.email}</td>
                      <td className="px-4 py-3">{admin.name || "—"}</td>
                      <td className="px-4 py-3">{admin.role}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(admin.access) && admin.access.length > 0 ? (
                            admin.access.slice(0, 2).map((a) => (
                              <span
                                key={`${admin._id}-${a.key}`}
                                className="inline-flex rounded-full bg-black/5 px-2 py-1 text-xs font-medium"
                              >
                                {a.name || a.key}
                              </span>
                            ))
                          ) : (
                            <span className="text-black/50">—</span>
                          )}
                          {Array.isArray(admin.access) && admin.access.length > 2 ? (
                            <span className="inline-flex rounded-full border border-black/10 px-2 py-1 text-xs font-medium">
                              +{admin.access.length - 2}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatDT(admin.invitedAt)}</td>
                      <td className="px-4 py-3">{formatDT(admin.lastLoginAt)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            status === "active"
                              ? "bg-green-50 text-green-700"
                              : status === "inactive"
                              ? "bg-red-50 text-red-700"
                              : status === "suspended"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {canEditAdmins ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(admin)}
                              className="rounded-lg border border-black/10 px-3 py-2 text-xs font-medium hover:bg-black/5"
                            >
                              Edit
                            </button>

                            <select
                              value={status}
                              onChange={(e) =>
                                updateStatus(admin._id, e.target.value as AdminStatus)
                              }
                              disabled={updatingId === admin._id}
                              className={`${selectBase} px-3 py-2`}
                            >
                              <option value="pending">pending</option>
                              <option value="active">active</option>
                              <option value="inactive">inactive</option>
                              <option value="suspended">suspended</option>
                            </select>

                            {updatingId === admin._id ? (
                              <span className="text-xs text-black/50">Updating...</span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-black/50">No edit access</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredRows.length > 0 ? (
          <div className="flex items-center justify-between px-4 py-4 border-t border-black/10">
            <div className="text-sm text-black/60">
              Page <span className="font-medium text-black">{page}</span> of{" "}
              <span className="font-medium text-black">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-black/5 disabled:opacity-50"
              >
                Prev
              </button>

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-black/5 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {inviteOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-black/10 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">Invite Admin</div>
                <div className="text-sm text-black/60">
                  Invite a new admin and assign access
                </div>
              </div>
              <button
                className="text-sm text-black/60 hover:text-black"
                onClick={() => setInviteOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4">
              {inviteErr ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {inviteErr}
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  className={`${inputBase} mt-1 w-full px-3 py-2`}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@domain.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Full Name</label>
                <input
                  className={`${inputBase} mt-1 w-full px-3 py-2`}
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Admin Role</label>
                <input
                  className={`${inputBase} mt-1 w-full px-3 py-2`}
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  placeholder="Manager"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Module Access</label>
                <div className="mt-2 border border-black/10 rounded-xl max-h-72 overflow-y-auto">
                  {accessModules.map((mod) => {
                    const selected = inviteAccess.find(
                      (a) => normalizeKey(a.key) === mod.key
                    );

                    return (
                      <div
                        key={mod.key}
                        className="flex items-center justify-between px-3 py-3 border-b border-black/5 last:border-b-0"
                      >
                        <label className="flex items-center gap-3 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() => toggleInviteAccess(mod.key, mod.label)}
                          />
                          <span>{mod.label}</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-black/60">
                          <span>Edit</span>
                          <input
                            type="checkbox"
                            checked={!!selected?.isEdit}
                            disabled={!selected}
                            onChange={(e) =>
                              toggleEditInviteAccess(mod.key, e.target.checked)
                            }
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-black/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="rounded-lg border border-black/10 px-4 py-2 text-sm hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onInvite}
                disabled={inviting || !inviteEmail.trim() || !inviteRole.trim()}
                className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-black/10 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">Edit Admin</div>
                <div className="text-sm text-black/60">
                  Update role, status and access
                </div>
              </div>
              <button
                className="text-sm text-black/60 hover:text-black"
                onClick={() => setEditOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4">
              {editErr ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {editErr}
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  className={`${inputBase} mt-1 w-full px-3 py-2 bg-black/5`}
                  value={editing?.email || ""}
                  disabled
                />
              </div>

              <div>
                <label className="text-sm font-medium">Full Name</label>
                <input
                  className={`${inputBase} mt-1 w-full px-3 py-2`}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Admin Role</label>
                <input
                  className={`${inputBase} mt-1 w-full px-3 py-2`}
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  placeholder="Manager"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  className={`${selectBase} mt-1 w-full px-3 py-2`}
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AdminStatus)}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="pending">pending</option>
                  <option value="suspended">suspended</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Access Permissions</label>
                <div className="mt-2 border border-black/10 rounded-xl max-h-72 overflow-y-auto">
                  {accessModules.map((mod) => {
                    const selected = editAccess.find(
                      (a) => normalizeKey(a.key) === mod.key
                    );

                    return (
                      <div
                        key={mod.key}
                        className="flex items-center justify-between px-3 py-3 border-b border-black/5 last:border-b-0"
                      >
                        <label className="flex items-center gap-3 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() => toggleAdminEditAccess(mod.key, mod.label)}
                          />
                          <span>{mod.label}</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-black/60">
                          <span>Edit</span>
                          <input
                            type="checkbox"
                            checked={!!selected?.isEdit}
                            disabled={!selected}
                            onChange={(e) =>
                              toggleAdminEditPermission(mod.key, e.target.checked)
                            }
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-black/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-lg border border-black/10 px-4 py-2 text-sm hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSaveEdit}
                disabled={savingEdit || !editRole.trim()}
                className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}