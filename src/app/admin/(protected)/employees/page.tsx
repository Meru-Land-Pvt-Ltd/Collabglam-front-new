"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Download,
  Mail,
  RefreshCw,
  Settings2,
  Shield,
  UserCheck,
  UserX,
  Users,
  Clock3,
  BadgeCheck,
  X,
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

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizeKey(v: string) {
  return String(v || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function humanizeKey(v?: string) {
  return String(v || "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatDT(v?: string) {
  if (!v) return "N/A";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleString();
}

function formatRelativeTime(v?: string) {
  if (!v) return "N/A";

  const date = new Date(v);
  if (Number.isNaN(date.getTime())) return "N/A";

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days === 1) return "Yesterday";
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

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

function getInitials(name?: string, email?: string) {
  const base = name?.trim() || email?.split("@")[0] || "U";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function getDisplayId(row: AdminRow) {
  return `EMP-${String(row._id || "").slice(-4).toUpperCase()}`;
}

function getStatusLabel(status?: AdminStatus) {
  const st = status || "pending";
  if (st === "active") return "Active";
  if (st === "pending") return "Pending";
  return "Disabled";
}

function statusTone(status?: AdminStatus) {
  const st = status || "pending";
  if (st === "active") return "bg-black text-white border-black";
  if (st === "pending") return "bg-black/[0.04] text-black/65 border-black/10";
  return "bg-black/[0.08] text-black border-black/10";
}

const basePermissionSections = [
  {
    key: "brand-campaign",
    title: "Brand & Campaign",
    icon: Shield,
    items: [
      { key: "brands", label: "Brands" },
      { key: "campaigns", label: "Campaigns" },
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
      { key: "influencer-email", label: "Influencer Email" },
      { key: "missing-email", label: "Missing Email" },
    ],
  },
  {
    key: "finance-revenue",
    title: "Finance & Revenue",
    icon: UserCheck,
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

function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-[22px] border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-black/45">{title}</p>
          <div className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-black">
            {value}
          </div>
          <p className="mt-2 text-sm text-black/45">{subtext}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/[0.04]">
          <Icon className="h-5 w-5 text-black/65" />
        </div>
      </div>
    </div>
  );
}

function AccessBadges({
  access = [],
  labelMap,
}: {
  access?: AdminAccess[];
  labelMap: Map<string, string>;
}) {
  const items = Array.isArray(access) ? access : [];
  const visible = items.slice(0, 2);
  const remaining = Math.max(0, items.length - visible.length);

  if (!items.length) {
    return (
      <span className="inline-flex rounded-xl border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold text-black/50">
        No Access
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((item) => {
        const label =
          labelMap.get(normalizeKey(item.key)) ||
          item.name ||
          humanizeKey(item.key);

        return (
          <span
            key={item.key}
            className="inline-flex rounded-xl border border-black/10 bg-black/[0.03] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-black/60"
          >
            {label}
          </span>
        );
      })}
      {remaining > 0 ? (
        <span className="text-xs font-semibold text-black/45">+{remaining}</span>
      ) : null}
    </div>
  );
}

export default function EmployeesPage() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowMsg, setRowMsg] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState<AdminStatus>("pending");
  const [editAccess, setEditAccess] = useState<AdminAccess[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editErr, setEditErr] = useState<string | null>(null);

  const [permissionCatalog, setPermissionCatalog] = useState<AdminAccess[]>([]);

  function getToken() {
    return typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;
  }

  function getAuthHeaders() {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
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

  async function fetchPermissionCatalog() {
    try {
      const res = await fetch(`${API_BASE}/admins/me`, {
        method: "GET",
        credentials: "include",
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load permission catalog");
      }

      const nextPermissions =
        data?.permissions ||
        data?.data?.permissions ||
        data?.data?.admin?.permissions ||
        data?.admin?.permissions ||
        [];

      setPermissionCatalog(Array.isArray(nextPermissions) ? nextPermissions : []);
    } catch {
      setPermissionCatalog([]);
    }
  }

  async function fetchEmployees() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/admins/list`, {
        method: "GET",
        credentials: "include",
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load employees");
      }

      const nextRows = data?.data || data || [];
      setRows(nextRows);

      if (nextRows.length && !selectedId) {
        hydrateEditor(nextRows[0]);
      }
    } catch (e: any) {
      setRows([]);
      setError(e?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(adminId: string, status: AdminStatus) {
    setUpdatingId(adminId);
    setRowMsg(null);

    try {
      const res = await fetch(`${API_BASE}/admins/update-status`, {
        method: "PUT",
        credentials: "include",
        headers: getAuthHeaders(),
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

  async function onSaveCurrent() {
    if (!selectedId) return;

    setSavingEdit(true);
    setEditErr(null);

    try {
      const res = await fetch(`${API_BASE}/admins/update-status`, {
        method: "PUT",
        credentials: "include",
        headers: getAuthHeaders(),
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
        throw new Error(data?.message || "Failed to update employee");
      }

      setRowMsg(data?.message || "Changes saved");
      setManageOpen(false);
      await fetchEmployees();
    } catch (e: any) {
      setEditErr(e?.message || "Failed to update employee");
    } finally {
      setSavingEdit(false);
      setTimeout(() => setRowMsg(null), 2500);
    }
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

  const permissionLabelMap = useMemo(() => {
    const map = new Map<string, string>();

    permissionCatalog.forEach((item) => {
      const key = normalizeKey(item.key);
      if (!key) return;
      map.set(key, item.name || humanizeKey(item.key));
    });

    return map;
  }, [permissionCatalog]);

  const permissionSections = useMemo(() => {
    const allowedKeys = new Set(
      permissionCatalog.map((item) => normalizeKey(item.key)).filter(Boolean)
    );

    const nextSections = basePermissionSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          allowedKeys.size ? allowedKeys.has(normalizeKey(item.key)) : true
        ),
      }))
      .filter((section) => section.items.length > 0);

    return nextSections.length ? nextSections : basePermissionSections;
  }, [permissionCatalog]);

  function exportCsv() {
    const headers = [
      "Employee Name",
      "Employee Email",
      "Role",
      "Status",
      "Last Login",
      "Modules",
    ];

    const lines = rows.map((row) => [
      `"${row.name || ""}"`,
      `"${row.email || ""}"`,
      `"${row.role || ""}"`,
      `"${row.status || "pending"}"`,
      `"${formatDT(row.lastLoginAt)}"`,
      `"${(row.access || [])
        .map(
          (a) =>
            permissionLabelMap.get(normalizeKey(a.key)) ||
            a.name ||
            humanizeKey(a.key)
        )
        .join(", ")}"`,
    ]);

    const csv = [headers.join(","), ...lines.map((l) => l.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "employees.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    fetchEmployees();
    fetchPermissionCatalog();
  }, []);

  const selectedEmployee = useMemo(
    () => rows.find((r) => r._id === selectedId) || null,
    [rows, selectedId]
  );

  const totalEmployees = rows.length;
  const activeStaff = rows.filter((r) => (r.status || "pending") === "active").length;
  const pendingInvites = rows.filter((r) => (r.status || "pending") === "pending").length;
  const disabledAccounts = rows.filter((r) => {
    const st = r.status || "pending";
    return st === "inactive" || st === "suspended";
  }).length;

  const utilization = totalEmployees
    ? `${((activeStaff / totalEmployees) * 100).toFixed(1)}% utilization`
    : "0% utilization";

  return (
    <div className="min-h-screen bg-white px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={totalEmployees}
            subtext={`+${pendingInvites} pending invite${pendingInvites !== 1 ? "s" : ""}`}
            icon={Users}
          />
          <StatCard
            title="Active Staff"
            value={activeStaff}
            subtext={utilization}
            icon={UserCheck}
          />
          <StatCard
            title="Disabled Accounts"
            value={disabledAccounts}
            subtext="Inactive or suspended"
            icon={UserX}
          />
          <StatCard
            title="Pending Invites"
            value={pendingInvites}
            subtext="Awaiting response"
            icon={Mail}
          />
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-black">
              Manage Workforce
            </h1>
            <p className="mt-1 text-sm text-black/50">
              Employee list powered by the same admin APIs already used in your current file.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchEmployees}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-black/[0.03] disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-black/[0.03]"
            >
              <Download className="h-4 w-4" />
              Bulk Export
            </button>

            <button
              type="button"
              onClick={() =>
                setRowMsg("Connect your Permission Groups route or modal here.")
              }
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-black/[0.03]"
            >
              <Shield className="h-4 w-4" />
              Permission Groups
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black">
            {error}
          </div>
        ) : null}

        {rowMsg ? (
          <div className="mt-5 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black">
            {rowMsg}
          </div>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-black/[0.03] text-left">
                  <th className="border-b border-black/10 px-5 py-4 text-sm font-semibold text-black/50">
                    Employee
                  </th>
                  <th className="border-b border-black/10 px-5 py-4 text-sm font-semibold text-black/50">
                    Role
                  </th>
                  <th className="border-b border-black/10 px-5 py-4 text-sm font-semibold text-black/50">
                    Proxy Email
                  </th>
                  <th className="border-b border-black/10 px-5 py-4 text-sm font-semibold text-black/50">
                    Assigned Permissions
                  </th>
                  <th className="border-b border-black/10 px-5 py-4 text-sm font-semibold text-black/50">
                    Last Active
                  </th>
                  <th className="border-b border-black/10 px-5 py-4 text-sm font-semibold text-black/50">
                    Status
                  </th>
                  <th className="border-b border-black/10 px-5 py-4 text-sm font-semibold text-black/50">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm text-black/50"
                    >
                      Loading employees...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm text-black/50"
                    >
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const st = (row.status || "pending") as AdminStatus;
                    const isActive = st === "active";
                    const isPending = st === "pending";
                    const isUpdating = updatingId === row._id;

                    return (
                      <tr key={row._id} className="hover:bg-black/[0.015]">
                        <td className="border-b border-black/10 px-5 py-5 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.05] text-sm font-bold text-black">
                              {getInitials(row.name, row.email)}
                            </div>
                            <div>
                              <div className="text-lg font-semibold leading-6 text-black">
                                {row.name || "Unnamed Employee"}
                              </div>
                              <div className="mt-1 text-sm text-black/45">
                                ID: {getDisplayId(row)}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="border-b border-black/10 px-5 py-5 align-middle">
                          <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-sm font-semibold text-black">
                            {row.role || "No Role"}
                          </span>
                        </td>

                        <td className="border-b border-black/10 px-5 py-5 align-middle">
                          <div className="inline-flex rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2 text-sm text-black/60">
                            {row.email}
                          </div>
                        </td>

                        <td className="border-b border-black/10 px-5 py-5 align-middle">
                          <AccessBadges
                            access={row.access}
                            labelMap={permissionLabelMap}
                          />
                        </td>

                        <td className="border-b border-black/10 px-5 py-5 align-middle">
                          <div className="flex items-center gap-2 text-sm text-black/55">
                            <Clock3 className="h-4 w-4" />
                            {formatRelativeTime(row.lastLoginAt)}
                          </div>
                        </td>

                        <td className="border-b border-black/10 px-5 py-5 align-middle">
                          {isActive ? (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => updateStatus(row._id, "inactive")}
                              className={cn(
                                "relative inline-flex h-7 w-12 items-center rounded-full transition",
                                isUpdating ? "opacity-50" : "",
                                "bg-black"
                              )}
                            >
                              <span className="absolute right-1 h-5 w-5 rounded-full bg-white shadow" />
                            </button>
                          ) : (
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                                statusTone(st)
                              )}
                            >
                              {getStatusLabel(st)}
                            </span>
                          )}
                        </td>

                        <td className="border-b border-black/10 px-5 py-5 align-middle">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                hydrateEditor(row);
                                setManageOpen(true);
                              }}
                              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/[0.03]"
                            >
                              Manage
                            </button>

                            {!isPending ? (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateStatus(row._id, isActive ? "inactive" : "active")
                                }
                                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-black/70 hover:bg-black/[0.03] disabled:opacity-50"
                              >
                                {isActive ? "Disable" : "Enable"}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 rounded-[22px] border border-black/10 bg-white px-6 py-5 text-center text-sm leading-7 text-black/55">
          Invited employees must accept the secure link sent to their email and complete setup before receiving full access to campaigns and tools.
        </div>
      </div>

      {manageOpen && selectedEmployee ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-5">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-black">
                  Manage Employee
                </h2>
                <p className="mt-1 text-sm text-black/55">
                  Edit role, status and permissions for {selectedEmployee.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="rounded-xl border border-black/10 p-2 text-black/65 hover:bg-black/[0.03]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {editErr ? (
                <div className="mb-4 rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black">
                  {editErr}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Full Name
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-black/10 bg-white px-5 text-base text-black outline-none placeholder:text-black/30 focus:border-black/20"
                    placeholder="Employee name"
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
                    onChange={(e) => setEditStatus(e.target.value as AdminStatus)}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 rounded-[22px] border border-black/10 bg-white p-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                      Email
                    </div>
                    <div className="mt-1 text-sm font-medium text-black">
                      {selectedEmployee.email}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                      Last Login
                    </div>
                    <div className="mt-1 text-sm font-medium text-black">
                      {formatDT(selectedEmployee.lastLoginAt)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                      Current ID
                    </div>
                    <div className="mt-1 text-sm font-medium text-black">
                      {getDisplayId(selectedEmployee)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[24px] border border-black/10 bg-white">
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
                            {permissionLabelMap.get(normalizeKey(item.key)) ||
                              item.label}
                          </div>

                          <PermissionSwitch
                            value={getPermissionLevel(editAccess, item.key)}
                            onChange={(next) =>
                              setModuleLevel(
                                item.key,
                                permissionLabelMap.get(normalizeKey(item.key)) ||
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

            <div className="flex justify-end gap-2 border-t border-black/10 bg-white px-6 py-5">
              <button
                type="button"
                onClick={() => {
                  hydrateEditor(selectedEmployee);
                  setManageOpen(false);
                }}
                className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black hover:bg-black/[0.03]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onSaveCurrent}
                disabled={savingEdit || !editRole.trim()}
                className="inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                <BadgeCheck className="h-4 w-4" />
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}