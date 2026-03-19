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
  role?: string;
};

type RevenueHead = {
  adminId: string;
  name: string;
  email?: string;
  role?: string;
};

type ManageMetaResponse = {
  group: {
    groupId: string;
    groupName: string;
    description?: string;
    revenueHeadId: string;
  };
  revenueHead: RevenueHead;
  selectedMemberIds: string[];
  eligibleMembers: EligibleMember[];
};

interface Props {
  open: boolean;
  onClose: () => void;
  adminId: string;
  groupId: string;
  onUpdated?: (group?: any) => void;
}

export default function ManageGroupModal({
  open,
  onClose,
  adminId,
  groupId,
  onUpdated,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [revenueHead, setRevenueHead] = useState<RevenueHead | null>(null);
  const [members, setMembers] = useState<EligibleMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open || !groupId || !adminId) return;

    setLoading(true);
    setError(null);

    post<ManageMetaResponse>("/group-chat/group-manage-meta", {
      groupId,
      adminId,
    })
      .then((res) => {
        setGroupName(res?.group?.groupName || "");
        setDescription(res?.group?.description || "");
        setRevenueHead(res?.revenueHead || null);
        setMembers(Array.isArray(res?.eligibleMembers) ? res.eligibleMembers : []);
        setSelectedIds(Array.isArray(res?.selectedMemberIds) ? res.selectedMemberIds : []);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load group members.");
      })
      .finally(() => setLoading(false));
  }, [open, groupId, adminId]);

  useEffect(() => {
    if (!open) {
      setGroupName("");
      setDescription("");
      setRevenueHead(null);
      setMembers([]);
      setSelectedIds([]);
      setSearch("");
      setError(null);
      setLoading(false);
      setSaving(false);
    }
  }, [open]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;

    return members.filter((m) => {
      return (
        (m.name || "").toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q) ||
        (m.role || "").toLowerCase().includes(q)
      );
    });
  }, [members, search]);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!groupName.trim()) {
      setError("Group name is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await post("/group-chat/update", {
        groupId,
        adminId,
        groupName: groupName.trim(),
        description: description.trim(),
        memberIds: selectedIds,
      });

      onUpdated?.(res?.group);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to update group.");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/45 backdrop-blur-[2px] flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Manage Group</h2>
            <p className="text-sm text-muted-foreground">
              Update name, description, and participants
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
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

            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="mb-2 text-sm font-medium text-foreground">
                Revenue Head
              </div>

              {revenueHead ? (
                <div className="rounded-xl border border-border bg-background px-3 py-3">
                  <div className="font-medium text-foreground">{revenueHead.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {revenueHead.email || "No email"}
                  </div>
                  <div className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    Fixed • Cannot be removed
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Revenue head not available
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="text-sm font-medium text-foreground">Selected Members</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">
                {selectedIds.length}
              </div>
              <div className="text-sm text-muted-foreground">
                IME / BME currently in this group
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Add / Remove IME &amp; BME
              </label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, role"
              />
            </div>

            <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-border bg-background">
              {loading ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Loading members...
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No eligible IME/BME found.
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
          <Button onClick={handleSave} disabled={saving || !groupName.trim()}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}