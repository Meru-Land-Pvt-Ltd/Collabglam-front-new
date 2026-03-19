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
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 flex items-center justify-between border-b gap-2">
          <h2 className="text-lg font-semibold">Messages</h2>

         {canCreateGroup && adminId && (
            <Button
              size="sm"
              type="button"
              onClick={() => setCreateOpen(true)}
            >
              Create Group
            </Button>
          )}
        </div>

        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading…</div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-red-500 break-words whitespace-normal">
            {error}
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 divide-y divide-border">
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
                  className={`block px-4 py-3 hover:bg-gray-100 transition-colors ${
                    isActive ? "bg-white border-l-4 border-primary" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback>{groupName.charAt(0) || "G"}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" title={groupName}>
                        {nameLabel}
                      </p>
                      <p className="text-sm text-muted-foreground truncate" title={preview}>
                        {textLabel}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {group.unseenCount > 0 && (
                        <span
                          className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground"
                          aria-label={`${group.unseenCount} unread`}
                          title={`${group.unseenCount} unread`}
                        >
                          {group.unseenCount > 99 ? "99+" : group.unseenCount}
                        </span>
                      )}

                      <span className="text-xs text-muted-foreground">{lastTime}</span>
                    </div>
                  </div>
                </Link>
              );
            })}

            {!renderedGroups.length && (
              <div className="p-4 text-center text-sm text-gray-500">
                No group chats found.
              </div>
            )}
          </div>
        )}
      </div>

      {canCreateGroup && adminId && (
        <CreateGroupModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          adminId={adminId}
          onCreated={() => {
            loadGroups(adminId);
          }}
        />
      )}
    </>
  );
}