"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Info,
  RefreshCw,
  Search,
  Settings2,
  Shield,
  Users,
} from "lucide-react";

type AdminStatus = "pending" | "active" | "inactive" | "suspended";
type PermissionLevel = "none" | "read" | "write";

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

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const noBlueFocus =
  "outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0";

const inputBase = `border border-black/10 rounded-2xl bg-white text-sm ${noBlueFocus} focus:border-black/30`;
const selectBase = `border border-black/10 rounded-2xl bg-white text-sm ${noBlueFocus} focus:border-black/30`;

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
  { key: "employees", label: "Employees" },
];

const permissionSections = [
  {
    key: "brand-campaign",
    title: "Brand & Campaign",
    icon: Shield,
    items: [
      { key: "brands", label: "Brands" },
      { key: "campaigns", label: "All Campaigns" },
      { key: "youtube-handle", label: "Youtube Handle" },
      { key: "modash-data", label: "Modash Data" },
    ],
  },
  {
    key: "influencer-management",
    title: "Influencer Management",
    icon: Users,
    items: [
      { key: "influencers", label: "Influencers" },
      { key: "invited-influencer", label: "Invited Influencer" },
      { key: "influencer-email", label: "Influencer-Email" },
      { key: "missing-email", label: "Missing-Email" },
    ],
  },
  {
    key: "finance-revenue",
    title: "Finance & Revenue",
    icon: DollarSign,
    items: [
      { key: "subscriptions", label: "Subscriptions" },
      { key: "invoice-details", label: "Invoice Details" },
      { key: "payment-notification", label: "Payment Notification" },
    ],
  },
  {
    key: "platform-administration",
    title: "Platform Administration",
    icon: Settings2,
    items: [
      { key: "notifications", label: "Notifications" },
      { key: "disputes", label: "Disputes" },
      { key: "emails", label: "E-Mails" },
      { key: "employees", label: "Employees" },
    ],
  },
];

function getPermissionLevel(
  access: AdminAccess[] = [],
  moduleKey: string
): PermissionLevel {
  const found = access.find(
    (a) => normalizeKey(a.key) === normalizeKey(moduleKey)
  );
  if (!found) return "none";
  return found.isEdit ? "write" : "read";
}

function StatusPill({ status }: { status: AdminStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
        status === "active" && "bg-black text-white",
        status === "inactive" && "bg-black/10 text-black",
        status === "suspended" && "bg-black/10 text-black/70",
        status === "pending" && "bg-black/5 text-black/60"
      )}
    >
      {status}
    </span>
  );
}

function PermissionSwitch({
  value,
  onChange,
}: {
  value: PermissionLevel;
  onChange: (next: PermissionLevel) => void;
}) {
  const options: PermissionLevel[] = ["none", "read", "write"];

  return (
    <div className="inline-flex items-center rounded-full bg-black/5 p-1">
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "min-w-[64px] rounded-full px-4 py-2 text-xs font-semibold capitalize transition",
              active
                ? "bg-black text-white shadow-sm"
                : "text-black/45 hover:text-black"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

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
  const limit = 5;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [inviteAccess, setInviteAccess] = useState<AdminAccess[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  function getToken() {
    return typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;
  }

  function hydrateEditor(admin: AdminRow | null) {
    if (!admin) {
      setSelectedId(null);
      setEditName("");
      setEditRole("");
      setEditStatus("pending");
      setEditAccess([]);
      return;
    }

    setSelectedId(admin._id);
    setEditName(admin.name || "");
    setEditRole(admin.role || "");
    setEditStatus((admin.status || "pending") as AdminStatus);
    setEditAccess(Array.isArray(admin.access) ? admin.access : []);
    setEditErr(null);
  }

  async function fetchAdmins() {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();

      const res = await fetch(`${API_BASE}/admins/list`, {
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

      const nextRows = data?.data || data || [];
      setRows(nextRows);

      if (nextRows.length && !selectedId) {
        hydrateEditor(nextRows[0]);
      }
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

      const res = await fetch(`${API_BASE}/admins/update-status`, {
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

      if (selectedId === adminId) {
        setEditStatus(status);
      }

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

      const res = await fetch(`${API_BASE}/admins/invite`, {
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

  async function onSaveCurrent() {
    if (!selectedId) return;
    setSavingEdit(true);
    setEditErr(null);

    try {
      const token = getToken();

      const res = await fetch(`${API_BASE}/admins/update-status`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          adminId: selectedId,
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

      setRowMsg(data?.message || "Changes saved");
      await fetchAdmins();
    } catch (e: any) {
      setEditErr(e?.message || "Failed to update admin");
    } finally {
      setSavingEdit(false);
      setTimeout(() => setRowMsg(null), 2500);
    }
  }

  function toggleInviteModuleLevel(
    moduleKey: string,
    label: string,
    level: PermissionLevel
  ) {
    setInviteAccess((prev) => {
      const idx = prev.findIndex(
        (a) => normalizeKey(a.key) === normalizeKey(moduleKey)
      );

      if (level === "none") {
        return prev.filter(
          (a) => normalizeKey(a.key) !== normalizeKey(moduleKey)
        );
      }

      const nextValue: AdminAccess = {
        key: moduleKey,
        name: label,
        isEdit: level === "write",
        isDelete: false,
        isManager: false,
      };

      if (idx === -1) return [...prev, nextValue];

      return prev.map((a, i) => (i === idx ? { ...a, ...nextValue } : a));
    });
  }

  function setModuleLevel(
    moduleKey: string,
    label: string,
    level: PermissionLevel
  ) {
    setEditAccess((prev) => {
      const idx = prev.findIndex(
        (a) => normalizeKey(a.key) === normalizeKey(moduleKey)
      );

      if (level === "none") {
        return prev.filter(
          (a) => normalizeKey(a.key) !== normalizeKey(moduleKey)
        );
      }

      const nextValue: AdminAccess = {
        key: moduleKey,
        name: label,
        isEdit: level === "write",
        isDelete: false,
        isManager: false,
      };

      if (idx === -1) return [...prev, nextValue];

      return prev.map((a, i) => (i === idx ? { ...a, ...nextValue } : a));
    });
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
      const matchesStatus =
        statusFilter === "all" ? true : st === statusFilter;
      const matchesRole = roleFilter === "all" ? true : r.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [rows, search, statusFilter, roleFilter]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginatedRows = filteredRows.slice((page - 1) * limit, page * limit);

  const selectedAdmin = useMemo(
    () => rows.find((r) => r._id === selectedId) || null,
    [rows, selectedId]
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, roleFilter]);

  useEffect(() => {
    if (!filteredRows.length) {
      hydrateEditor(null);
      return;
    }

    const stillVisible = filteredRows.find((r) => r._id === selectedId);
    if (!stillVisible) {
      hydrateEditor(filteredRows[0]);
    }
  }, [filteredRows, selectedId]);

  if (!canViewAdmins) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          You do not have permission to view this page.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-5 md:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-black">
            Role & Permissions
          </h1>
          <p className="mt-1 text-sm text-black/60">
            Manage admins with the same API logic, now in a role-style layout
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchAdmins}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

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
            className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            + Invite Admin
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <input
            placeholder="Search by name, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputBase} h-12 w-full pl-11 pr-4`}
          />
        </div>

        <select
          className={`${selectBase} h-12 w-full px-4`}
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
          className={`${selectBase} h-12 w-full px-4`}
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
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {rowMsg ? (
        <div className="mb-4 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black">
          {rowMsg}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="px-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-black/45">
              System Roles
            </p>
          </div>

          {loading ? (
            <div className="rounded-[22px] bg-white p-5 text-sm text-black/60 border border-black/10">
              Loading admins...
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className="rounded-[22px] bg-white p-5 text-sm text-black/60 border border-black/10">
              No admins found.
            </div>
          ) : (
            paginatedRows.map((admin) => {
              const active = selectedId === admin._id;
              const status = (admin.status || "pending") as AdminStatus;
              const accessCount = Array.isArray(admin.access)
                ? admin.access.length
                : 0;

              return (
                <button
                  key={admin._id}
                  type="button"
                  onClick={() => hydrateEditor(admin)}
                  className={cn(
                    "w-full rounded-[22px] border text-left transition-all",
                    active
                      ? "border-black bg-black/[0.04] shadow-[inset_4px_0_0_0_#000]"
                      : "border-black/10 bg-white hover:border-black/20"
                  )}
                >
                  <div className="p-5">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[28px] font-semibold tracking-[-0.03em] text-black">
                          {admin.role || "No Role"}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-black/55">
                          {admin.name || admin.email}
                        </p>
                      </div>

                      <StatusPill status={status} />
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-black/45">
                      <Users className="h-4 w-4" />
                      <span>{accessCount} Modules</span>
                    </div>

                    <div className="mt-4 text-xs text-black/45">
                      <div className="truncate">{admin.email}</div>
                      <div className="mt-1">
                        Last login: {formatDT(admin.lastLoginAt)}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-end border-t border-black/10 pt-4">
                      <span className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
                        Assign Permissions
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}

          {filteredRows.length > 0 ? (
            <div className="flex items-center justify-between rounded-[20px] border border-black/10 bg-white px-4 py-3">
              <div className="text-sm text-black/60">
                Page <span className="font-medium text-black">{page}</span> of{" "}
                <span className="font-medium text-black">{totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border border-black/10 p-2 text-black hover:bg-black/5 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-xl border border-black/10 p-2 text-black hover:bg-black/5 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          <div className="rounded-[22px] bg-black/[0.04] p-6 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/10">
              <Info className="h-5 w-5 text-black" />
            </div>
            <div className="text-lg font-semibold text-black">
              Admin Access Guide
            </div>
            <p className="mx-auto mt-3 max-w-[260px] text-sm leading-6 text-black/60">
              This layout keeps your current admin APIs and maps access to none,
              read and write using your existing access object.
            </p>
          </div>
        </aside>

        <section className="rounded-[28px] border border-black/10 bg-[#f7f7f7] p-5 md:p-7 lg:p-8">
          {!selectedAdmin ? (
            <div className="rounded-2xl bg-white p-6 text-black/60">
              Select an admin from the left to manage permissions.
            </div>
          ) : (
            <>
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5">
                      <Shield className="h-4 w-4 text-black" />
                    </div>
                    <h2 className="text-[34px] font-semibold tracking-[-0.03em] text-black">
                      Permissions for {editRole || selectedAdmin.role || "Admin"}
                    </h2>
                  </div>
                  <p className="mt-2 text-base text-black/55">
                    Configure exactly what this admin can see and do across the
                    platform.
                  </p>
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <StatusPill status={editStatus} />
                  <div className="text-xs text-black/50">
                    Invited: {formatDT(selectedAdmin.invitedAt)}
                  </div>
                </div>
              </div>

              {editErr ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {editErr}
                </div>
              ) : null}

              <div className="mb-8 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Full Name
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-black/10 bg-white px-5 text-base text-black outline-none placeholder:text-black/30 focus:border-black/20"
                    placeholder="Admin name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Role Name
                  </label>
                  <input
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-black/10 bg-white px-5 text-base text-black outline-none placeholder:text-black/30 focus:border-black/20"
                    placeholder="Role"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Status
                  </label>
                  <select
                    className="h-14 w-full rounded-2xl border border-black/10 bg-white px-5 text-base text-black outline-none focus:border-black/20"
                    value={editStatus}
                    onChange={(e) => {
                      const next = e.target.value as AdminStatus;
                      setEditStatus(next);
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="mb-6 rounded-[20px] border border-black/10 bg-white px-5 py-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                      Email
                    </div>
                    <div className="mt-1 text-sm font-medium text-black">
                      {selectedAdmin.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                      Last Login
                    </div>
                    <div className="mt-1 text-sm font-medium text-black">
                      {formatDT(selectedAdmin.lastLoginAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                      Quick Status API
                    </div>
                    <button
                      type="button"
                      disabled={updatingId === selectedAdmin._id}
                      onClick={() =>
                        updateStatus(selectedAdmin._id, editStatus)
                      }
                      className="mt-1 rounded-xl border border-black/10 px-3 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50"
                    >
                      {updatingId === selectedAdmin._id
                        ? "Updating..."
                        : "Update Status Only"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-black/10 bg-white/80">
                {permissionSections.map((section) => {
                  const SectionIcon = section.icon;

                  return (
                    <div
                      key={section.key}
                      className="border-b border-black/10 last:border-b-0"
                    >
                      <div className="flex items-center gap-2 bg-black/[0.03] px-4 py-3">
                        <SectionIcon className="h-4 w-4 text-black" />
                        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-black/55">
                          {section.title}
                        </span>
                      </div>

                      {section.items.map((item) => (
                        <div
                          key={item.key}
                          className="flex flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="text-base font-medium text-black">
                            {item.label}
                          </div>

                          <PermissionSwitch
                            value={getPermissionLevel(editAccess, item.key)}
                            onChange={(next) =>
                              setModuleLevel(item.key, item.label, next)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => hydrateEditor(selectedAdmin)}
                  className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black hover:bg-black/5"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={onSaveCurrent}
                  disabled={savingEdit || !editRole.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  <BadgeCheck className="h-4 w-4" />
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {inviteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-black/10 bg-[#f7f7f7] shadow-2xl">
            <div className="shrink-0 flex items-center justify-between border-b border-black/10 px-6 py-5">
              <div>
                <div className="text-xl font-semibold text-black">
                  Invite Admin
                </div>
                <div className="mt-1 text-sm text-black/55">
                  Invite a new admin and pre-assign permissions
                </div>
              </div>
              <button
                className="rounded-xl border border-black/10 px-3 py-2 text-sm text-black/60 hover:bg-black/5 hover:text-black"
                onClick={() => setInviteOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {inviteErr ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {inviteErr}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Email
                  </label>
                  <input
                    className={`${inputBase} h-12 w-full px-4`}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@domain.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Full Name
                  </label>
                  <input
                    className={`${inputBase} h-12 w-full px-4`}
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Role
                  </label>
                  <input
                    className={`${inputBase} h-12 w-full px-4`}
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    placeholder="Manager"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-black/10 bg-white">
                {permissionSections.map((section) => {
                  const SectionIcon = section.icon;

                  return (
                    <div
                      key={section.key}
                      className="border-b border-black/10 last:border-b-0"
                    >
                      <div className="flex items-center gap-2 bg-black/[0.03] px-4 py-3">
                        <SectionIcon className="h-4 w-4 text-black" />
                        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-black/55">
                          {section.title}
                        </span>
                      </div>

                      {section.items.map((item) => (
                        <div
                          key={item.key}
                          className="flex flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="text-base font-medium text-black">
                            {item.label}
                          </div>

                          <PermissionSwitch
                            value={getPermissionLevel(inviteAccess, item.key)}
                            onChange={(next) =>
                              toggleInviteModuleLevel(
                                item.key,
                                item.label,
                                next
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 flex justify-end gap-2 border-t border-black/10 bg-[#f7f7f7] px-6 py-5">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-medium hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onInvite}
                disabled={inviting || !inviteEmail.trim() || !inviteRole.trim()}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}