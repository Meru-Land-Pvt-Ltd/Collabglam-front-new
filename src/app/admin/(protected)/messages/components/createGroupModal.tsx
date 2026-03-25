"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EligibleMember = {
  adminId: string;
  name: string;
  email?: string;
  role: "ime" | "bme" | string;
};

type EligibleRevenueHead = {
  adminId: string;
  name: string;
  email?: string;
  role: "revenue_head" | string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  adminId: string;
  onCreated?: (group: any) => void;
}

function readAdminRoleFromStorage() {
  if (typeof window === "undefined") return null;

  const direct = localStorage.getItem("adminRole");
  if (direct) return direct;

  try {
    const rawAdmin = localStorage.getItem("admin");
    if (rawAdmin) {
      const parsed = JSON.parse(rawAdmin);
      if (parsed?.role) return parsed.role;
    }
  } catch {}

  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.role) return parsed.role;
    }
  } catch {}

  return null;
}

export default function CreateGroupModal({
  open,
  onClose,
  adminId,
  onCreated,
}: Props) {
  const [mounted, setMounted] = useState(false);

  const [adminRole, setAdminRole] = useState<string | null>(null);

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");

  const [revenueHeads, setRevenueHeads] = useState<EligibleRevenueHead[]>([]);
  const [selectedRevenueHeadId, setSelectedRevenueHeadId] = useState("");

  const [members, setMembers] = useState<EligibleMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [loadingRevenueHeads, setLoadingRevenueHeads] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const normalizedRole = String(adminRole || "").toLowerCase();
  const isRevenueHead = normalizedRole === "revenue_head";
  const isSuperAdmin = normalizedRole === "super_admin";

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    setAdminRole(readAdminRoleFromStorage());
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setMembers([]);
    setSelectedIds([]);
    setRevenueHeads([]);
    setSelectedRevenueHeadId("");

    if (isRevenueHead) {
      setLoadingMembers(true);

      post<{ members: EligibleMember[] }>("/group-chat/eligible-members", {
        adminId,
      })
        .then((res) => {
          setMembers(Array.isArray(res?.members) ? res.members : []);
        })
        .catch((err) => {
          console.error("eligible-members error:", err);
          setError("Failed to load IME/BME members.");
        })
        .finally(() => setLoadingMembers(false));

      return;
    }

    if (isSuperAdmin) {
      setLoadingRevenueHeads(true);

      post<{ revenueHeads: EligibleRevenueHead[] }>(
        "/group-chat/eligible-revenue-heads",
        { adminId }
      )
        .then((res) => {
          const list = Array.isArray(res?.revenueHeads) ? res.revenueHeads : [];
          setRevenueHeads(list);

          if (list.length === 1) {
            setSelectedRevenueHeadId(list[0].adminId);
          }
        })
        .catch((err) => {
          console.error("eligible-revenue-heads error:", err);
          setError("Failed to load Revenue Heads.");
        })
        .finally(() => setLoadingRevenueHeads(false));

      return;
    }

    setError("Only super admin or revenue head can create a group.");
  }, [open, adminId, isRevenueHead, isSuperAdmin]);

  useEffect(() => {
    if (!open) return;
    if (!isSuperAdmin) return;
    if (!selectedRevenueHeadId) {
      setMembers([]);
      setSelectedIds([]);
      return;
    }

    setLoadingMembers(true);
    setError(null);
    setSelectedIds([]);

    post<{ members: EligibleMember[] }>("/group-chat/eligible-members", {
      adminId,
      revenueHeadId: selectedRevenueHeadId,
    })
      .then((res) => {
        setMembers(Array.isArray(res?.members) ? res.members : []);
      })
      .catch((err) => {
        console.error("eligible-members error:", err);
        setError("Failed to load IME/BME members.");
        setMembers([]);
      })
      .finally(() => setLoadingMembers(false));
  }, [open, isSuperAdmin, selectedRevenueHeadId, adminId]);

  useEffect(() => {
    if (!open) {
      setGroupName("");
      setDescription("");
      setRevenueHeads([]);
      setSelectedRevenueHeadId("");
      setMembers([]);
      setSelectedIds([]);
      setSearch("");
      setError(null);
      setLoadingRevenueHeads(false);
      setLoadingMembers(false);
      setSaving(false);
    }
  }, [open]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;

    return members.filter((m) => {
      return (
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.role?.toLowerCase().includes(q)
      );
    });
  }, [members, search]);

  const selectedRevenueHead = useMemo(() => {
    return revenueHeads.find((r) => r.adminId === selectedRevenueHeadId) || null;
  }, [revenueHeads, selectedRevenueHeadId]);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError("Group name is required.");
      return;
    }

    if (isSuperAdmin && !selectedRevenueHeadId) {
      setError("Please select a Revenue Head.");
      return;
    }

    if (selectedIds.length === 0) {
      setError("Please select at least one IME/BME.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: Record<string, any> = {
        creatorId: adminId,
        groupName: groupName.trim(),
        description: description.trim(),
        memberIds: selectedIds,
      };

      if (isSuperAdmin) {
        payload.revenueHeadId = selectedRevenueHeadId;
      }

      const res = await post("/group-chat/create", payload);

      onCreated?.(res?.group);
      onClose();
    } catch (err: any) {
      console.error("create group error:", err);
      setError(err?.response?.data?.message || "Failed to create group.");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Create Group</h2>
            <p className="text-sm text-muted-foreground">
              Build a new group with the right members
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="grid gap-6 px-6 py-5 md:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Group Name</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            {isSuperAdmin ? (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Select Revenue Head
                </label>

                <select
                  value={selectedRevenueHeadId}
                  onChange={(e) => setSelectedRevenueHeadId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  disabled={loadingRevenueHeads}
                >
                  <option value="">
                    {loadingRevenueHeads
                      ? "Loading Revenue Heads..."
                      : "Select Revenue Head"}
                  </option>

                  {revenueHeads.map((rh) => (
                    <option key={rh.adminId} value={rh.adminId}>
                      {rh.name} {rh.email ? `(${rh.email})` : ""}
                    </option>
                  ))}
                </select>

                {selectedRevenueHead ? (
                  <div className="mt-3 rounded-2xl border border-border bg-muted/30 px-4 py-3">
                    <div className="font-medium text-foreground">
                      {selectedRevenueHead.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedRevenueHead.email || "No email"}
                    </div>
                    <div className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      Revenue Head • Auto included
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
                <div className="text-sm font-medium text-foreground">
                  Revenue Head Group
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  You are creating this group under your own team.
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
              <div className="text-sm font-medium text-foreground">
                Selected Members
              </div>
              <div className="mt-2 text-2xl font-semibold text-foreground">
                {selectedIds.length}
              </div>
              <div className="text-sm text-muted-foreground">
                IME / BME selected
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Select IME / BME Members
              </label>

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, role"
                disabled={isSuperAdmin && !selectedRevenueHeadId}
              />
            </div>

            <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-border bg-background">
              {isSuperAdmin && !selectedRevenueHeadId ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Select a Revenue Head first.
                </div>
              ) : loadingMembers ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Loading members...
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No IME/BME members found.
                </div>
              ) : (
                filteredMembers.map((member) => {
                  const checked = selectedIds.includes(member.adminId);

                  return (
                    <label
                      key={member.adminId}
                      className="flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/40"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMember(member.adminId)}
                        className="h-4 w-4"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-foreground">
                          {member.name}
                        </div>
                        <div className="truncate text-sm text-muted-foreground">
                          {member.email || "No email"}
                        </div>
                      </div>

                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium uppercase text-primary">
                        {member.role}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {error ? (
          <div className="px-6 pb-2 text-sm text-destructive">{error}</div>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-border bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>

          <Button
            onClick={handleCreate}
            disabled={
              saving ||
              !groupName.trim() ||
              (isSuperAdmin && !selectedRevenueHeadId) ||
              selectedIds.length === 0
            }
          >
            {saving ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}