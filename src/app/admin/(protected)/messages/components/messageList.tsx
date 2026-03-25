"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { post } from "@/lib/api";
import CreateGroupModal from "./createGroupModal";

type Participant = {
  adminId: string;
  name: string;
  email?: string;
  role?: string;
};

type LastMessage = {
  senderId: string;
  text: string;
  timestamp: string;
};

type GroupSummary = {
  groupId: string;
  groupName: string;
  description?: string;
  participants: Participant[];
  lastMessage: LastMessage | null;
  unseenCount: number;
};

const NAME_MAX = 30;
const MSG_MAX = 80;

const ellipsize = (s: string | undefined | null, max: number) => {
  const str = (s ?? "").replace(/\s+/g, " ").trim();
  return str.length > max ? str.slice(0, Math.max(0, max - 1)).trimEnd() + "…" : str;
};

function readAdminFromStorage() {
  if (typeof window === "undefined") {
    return { adminId: null, adminRole: null };
  }

  const adminId = localStorage.getItem("adminId");

  let adminRole = localStorage.getItem("adminRole");

  if (!adminRole) {
    try {
      const rawAdmin = localStorage.getItem("admin");
      if (rawAdmin) {
        const parsed = JSON.parse(rawAdmin);
        adminRole = parsed?.role || null;
      }
    } catch {}
  }

  if (!adminRole) {
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        adminRole = parsed?.role || null;
      }
    } catch {}
  }

  return { adminId, adminRole };
}

export default function MessagesList() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    const { adminId, adminRole } = readAdminFromStorage();
    setAdminId(adminId);
    setAdminRole(adminRole);
  }, []);

  const loadGroups = async (id?: string | null) => {
    const finalAdminId = id || adminId;
    if (!finalAdminId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await post<{ groups: GroupSummary[] }>("/group-chat/groups", {
        adminId: finalAdminId,
      });

      setGroups(Array.isArray(data?.groups) ? data.groups : []);
    } catch (err) {
      console.error("Error loading group chats:", err);
      setError("Failed to load group chats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminId) {
      setLoading(false);
      setError("No adminId in localStorage");
      return;
    }

    loadGroups(adminId);
  }, [adminId]);

  const renderedGroups = useMemo(() => groups || [], [groups]);

  const normalizedRole = String(adminRole || "").toLowerCase();
  const canCreateGroup =
    normalizedRole === "revenue_head" || normalizedRole === "super_admin";

  return (
    <>
      <div className="flex h-full flex-col bg-background">
        <div className="border-b border-border px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Messages</h2>
              <p className="text-sm text-muted-foreground">
                Group chats and live updates
              </p>
            </div>

            {canCreateGroup && adminId ? (
              <Button
                size="sm"
                type="button"
                className="rounded-full"
                onClick={() => setCreateOpen(true)}
              >
                Create Group
              </Button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {renderedGroups.map((group) => {
              const isActive = pathname?.endsWith(group.groupId);

              const groupName = group.groupName || "Untitled Group";
              const nameLabel = ellipsize(groupName, NAME_MAX);

              const participantCount = Array.isArray(group.participants)
                ? group.participants.length
                : 0;

              const preview =
                group.lastMessage?.text?.trim() ||
                `${participantCount} member${participantCount === 1 ? "" : "s"}`;

              const textLabel = ellipsize(preview, MSG_MAX);

              const lastTime = group.lastMessage?.timestamp
                ? new Date(group.lastMessage.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--";

              return (
                <Link
                  key={group.groupId}
                  href={`/admin/messages/${group.groupId}`}
                  className={`mb-2 block rounded-2xl border px-3 py-3 transition-all ${
                    isActive
                      ? "border-foreground/15 bg-card shadow-sm"
                      : "border-transparent hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11 shrink-0">
                      <AvatarFallback className="bg-muted font-semibold text-foreground">
                        {groupName.charAt(0) || "G"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-medium text-foreground" title={groupName}>
                          {nameLabel}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {lastTime}
                        </span>
                      </div>

                      <p
                        className="mt-1 truncate text-sm text-muted-foreground"
                        title={preview}
                      >
                        {textLabel}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(group.participants || []).slice(0, 3).map((p) => (
                            <span
                              key={p.adminId}
                              className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground"
                            >
                              {p.name}
                            </span>
                          ))}
                          {(group.participants?.length || 0) > 3 ? (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                              +{(group.participants?.length || 0) - 3}
                            </span>
                          ) : null}
                        </div>

                        {group.unseenCount > 0 ? (
                          <span
                            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background"
                            title={`${group.unseenCount} unread`}
                          >
                            {group.unseenCount > 99 ? "99+" : group.unseenCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {!renderedGroups.length ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No group chats found.
              </div>
            ) : null}
          </div>
        )}
      </div>

      {canCreateGroup && adminId ? (
        <CreateGroupModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          adminId={adminId}
          onCreated={() => {
            loadGroups(adminId);
          }}
        />
      ) : null}
    </>
  );
}