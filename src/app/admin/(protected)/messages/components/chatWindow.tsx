"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  HiPaperAirplane,
  HiPaperClip,
  HiArrowDown,
  HiReply,
  HiX,
  HiDownload,
  HiOutlineEye,
  HiArrowLeft,
  HiUsers,
  HiCog,
} from "react-icons/hi";
import { post } from "@/lib/api";
import {
  fileUrl,
  isPdfMime,
  isImageMime,
  isVideoMime,
  withDownload,
  downloadByHref,
  getWsUrl,
} from "@/lib/files";
import ManageGroupModal from "./manageGroupModal";

type ReplySnapshot = {
  messageId: string;
  senderId: string;
  text: string;
  hasAttachment?: boolean;
  attachment?: { originalName?: string; mimeType?: string };
};

type Attachment = {
  attachmentId?: string;
  url: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  thumbnailUrl?: string | null;
  storage?: "remote" | "local" | "gridfs";
  path?: string | null;
};

type Participant = {
  adminId: string;
  name: string;
  email?: string;
  role?: string;
};

type Message = {
  messageId: string;
  clientId?: string;
  senderId: string;
  text: string;
  timestamp: string;
  editedAt?: string | null;
  replyTo?: string | null;
  reply?: ReplySnapshot | null;
  attachments?: Attachment[];
  seenBy?: string[];
};

type GroupInfo = {
  groupId: string;
  groupName: string;
  description?: string;
  participants: Participant[];
  revenueHeadId?: string | null;
};

type UiRow =
  | { type: "date"; id: string; label: string }
  | { type: "message"; id: string; message: Message };

const CHAR_LIMIT = 2000;

const asString = (v: any, d = ""): string =>
  typeof v === "string" ? v : v == null ? d : String(v);

const asISO = (v: any): string => {
  const s = asString(v, "");
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? new Date().toISOString() : s;
};

const sanitizeAttachments = (list: any): Attachment[] =>
  Array.isArray(list)
    ? list.map((a) => ({
        attachmentId: asString(a?.attachmentId || a?.id || ""),
        url: fileUrl(asString(a?.url, "")),
        originalName: asString(a?.originalName, ""),
        mimeType: asString(a?.mimeType, ""),
        size: typeof a?.size === "number" ? a.size : undefined,
        width: typeof a?.width === "number" ? a.width : null,
        height: typeof a?.height === "number" ? a.height : null,
        duration: typeof a?.duration === "number" ? a.duration : null,
        thumbnailUrl: a?.thumbnailUrl
          ? fileUrl(asString(a.thumbnailUrl, ""))
          : null,
        storage:
          a?.storage === "local"
            ? "local"
            : a?.storage === "gridfs"
            ? "gridfs"
            : "remote",
        path: a?.path ? asString(a.path, "") : null,
      }))
    : [];

const sanitizeReply = (r: any): ReplySnapshot | null =>
  r && typeof r === "object"
    ? {
        messageId: asString(r.messageId, ""),
        senderId: asString(r.senderId, ""),
        text: asString(r.text, ""),
        hasAttachment: !!r.hasAttachment,
        attachment: r.attachment
          ? {
              originalName: asString(r.attachment.originalName, ""),
              mimeType: asString(r.attachment.mimeType, ""),
            }
          : undefined,
      }
    : null;

const sanitizeMessage = (m: Partial<Message>): Message => ({
  messageId: asString(m.messageId, ""),
  clientId: m.clientId ? asString(m.clientId) : undefined,
  senderId: asString(m.senderId, ""),
  text: asString(m.text, ""),
  timestamp: asISO(m.timestamp),
  editedAt: m.editedAt ? asISO(m.editedAt) : null,
  replyTo: m.replyTo ? asString(m.replyTo) : null,
  reply: sanitizeReply(m.reply),
  attachments: sanitizeAttachments(m.attachments),
  seenBy: Array.isArray(m.seenBy) ? m.seenBy.map(String) : [],
});

function formatTime(iso: string) {
  return new Date(asISO(iso)).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(iso: string) {
  const date = new Date(asISO(iso));
  const today = new Date();

  const isToday = date.toDateString() === today.toDateString();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  if (isToday) return "Today";

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year:
      date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function formatFileSize(size?: number) {
  if (!size || size <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let val = size;
  let idx = 0;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx += 1;
  }
  return `${val >= 10 || idx === 0 ? val.toFixed(0) : val.toFixed(1)} ${units[idx]}`;
}

function buildUiRows(messages: Message[]): UiRow[] {
  const rows: UiRow[] = [];
  let lastDateLabel = "";

  for (const msg of messages) {
    const label = formatDateLabel(msg.timestamp);
    if (label !== lastDateLabel) {
      rows.push({
        type: "date",
        id: `date-${label}-${msg.messageId}`,
        label,
      });
      lastDateLabel = label;
    }

    rows.push({
      type: "message",
      id: msg.messageId,
      message: msg,
    });
  }

  return rows;
}

function readAdminSession() {
  if (typeof window === "undefined") {
    return { adminId: null, adminRole: null };
  }

  const adminId = localStorage.getItem("adminId");
  let adminRole = localStorage.getItem("adminRole");

  if (!adminRole) {
    try {
      const rawAdmin = localStorage.getItem("admin");
      if (rawAdmin) {
        adminRole = JSON.parse(rawAdmin)?.role || null;
      }
    } catch {}
  }

  return { adminId, adminRole };
}

export default function ChatWindow({
  params,
}: {
  params: { groupId: string };
}) {
  const { groupId } = params;
  const router = useRouter();

  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<{
    messageId: string;
    text: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [socketState, setSocketState] = useState<
    "connecting" | "connected" | "reconnecting"
  >("connecting");
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const scrollWrapRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [openPdf, setOpenPdf] = useState<Record<string, boolean>>({});
  const [pdfSrc, setPdfSrc] = useState<Record<string, string>>({});
  const keyFor = (mid: string, idx: number) => `${mid}_${idx}`;

  useEffect(() => {
    const session = readAdminSession();
    setAdminId(session.adminId);
    setAdminRole(session.adminRole);
  }, []);

  const normalizedRole = String(adminRole || "").toLowerCase();
  const canManageGroup =
    normalizedRole === "revenue_head" || normalizedRole === "super_admin";

  const participantsMap = useMemo(() => {
    const map: Record<string, Participant> = {};
    for (const p of group?.participants || []) {
      map[p.adminId] = p;
    }
    return map;
  }, [group]);

  const revenueHeadParticipant = useMemo(() => {
    return (
      (group?.participants || []).find((p) => p.role === "revenue_head") || null
    );
  }, [group]);

  const visibleParticipants = useMemo(
    () => (group?.participants || []).slice(0, 5),
    [group]
  );

  const extraParticipants = Math.max(
    0,
    (group?.participants?.length || 0) - visibleParticipants.length
  );

  const groupInitial = (group?.groupName?.charAt(0) || "G").toUpperCase();

  const uiRows = useMemo(() => buildUiRows(messages), [messages]);

  const getSenderName = useCallback(
    (senderId: string) => {
      if (senderId === adminId) return "You";
      return participantsMap[senderId]?.name || "Admin";
    },
    [participantsMap, adminId]
  );

  const jumpToBottom = useCallback((smooth = false) => {
    const el = scrollWrapRef.current;
    if (!el) return;

    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
    setShowScrollDown(false);
  }, []);

  const scrollToMessageId = useCallback((mid: string) => {
    const target = messageRefs.current[mid];
    if (!scrollWrapRef.current || !target) {
      setError("Original message is not in view.");
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(mid);
    setTimeout(() => {
      setHighlightId((id) => (id === mid ? null : id));
    }, 1200);
  }, []);

  const upsertMessage = useCallback((incomingRaw: Message) => {
    const incoming = sanitizeMessage(incomingRaw);
    setMessages((prev) =>
      prev.some((m) => m.messageId === incoming.messageId)
        ? prev
        : [...prev, incoming]
    );
  }, []);

  const replaceMessage = useCallback((incomingRaw: Message) => {
    const incoming = sanitizeMessage(incomingRaw);
    setMessages((prev) =>
      prev.map((m) => (m.messageId === incoming.messageId ? incoming : m))
    );
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.messageId !== messageId));
  }, []);

  const reloadGroup = useCallback(async () => {
    if (!adminId) return;

    try {
      const data = await post<{ group: GroupInfo; messages: Partial<Message>[] }>(
        "/group-chat/messages",
        { groupId, adminId, limit: 100 }
      );

      setGroup(data?.group || null);
      setMessages((data?.messages || []).map(sanitizeMessage));
    } catch {
      setError("Failed to refresh group.");
    }
  }, [adminId, groupId]);

  useEffect(() => {
    if (!adminId) return;

    post<{ group: GroupInfo; messages: Partial<Message>[] }>(
      "/group-chat/messages",
      {
        groupId,
        adminId,
        limit: 100,
      }
    )
      .then((data) => {
        setGroup(data?.group || null);
        setMessages((data?.messages || []).map(sanitizeMessage));
      })
      .catch(() => setError("Failed to load messages."))
      .finally(() => {
        setLoading(false);
        requestAnimationFrame(() => jumpToBottom(false));
      });

    post("/group-chat/mark-seen", { groupId, adminId }).catch(() => {});
  }, [groupId, adminId, jumpToBottom]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || !adminId) return;
    if (last.senderId === adminId) return;

    post("/group-chat/mark-seen", {
      groupId,
      adminId,
      messageIds: [last.messageId],
    }).catch(() => {});
  }, [messages, adminId, groupId]);

  useEffect(() => {
    let cancelled = false;
    let retryMs = 1000;

    const connect = () => {
      if (cancelled) return;

      setSocketState((prev) =>
        prev === "connected" ? "reconnecting" : "connecting"
      );

      const url = getWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retryMs = 1000;
        setSocketState("connected");
        ws.send(JSON.stringify({ type: "joinGroupChat", groupId }));
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);

          if (data.type === "groupChatMessage" && data.groupId === groupId) {
            upsertMessage(data.message);
            requestAnimationFrame(() => jumpToBottom(true));
          }

          if (
            data.type === "groupChatMessageEdited" &&
            data.groupId === groupId
          ) {
            replaceMessage(data.message);
          }

          if (
            data.type === "groupChatMessageDeleted" &&
            data.groupId === groupId
          ) {
            removeMessage(data.messageId);
          }

          if (data.type === "groupChatUpdated" && data.groupId === groupId) {
            if (data.group) {
              setGroup((prev) => ({
                groupId: prev?.groupId || data.groupId,
                groupName: data.group.groupName || prev?.groupName || "Group",
                description: data.group.description || prev?.description || "",
                revenueHeadId: data.group.revenueHeadId || prev?.revenueHeadId || null,
                participants: Array.isArray(data.group.participants)
                  ? data.group.participants
                  : prev?.participants || [],
              }));
            }
          }
        } catch {}
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };

      ws.onclose = () => {
        if (cancelled) return;
        setSocketState("reconnecting");
        const delay = Math.min(retryMs, 10000);
        setTimeout(connect, delay);
        retryMs *= 2;
      };
    };

    connect();

    return () => {
      cancelled = true;
      const s = wsRef.current;
      wsRef.current = null;
      if (
        s &&
        (s.readyState === WebSocket.OPEN ||
          s.readyState === WebSocket.CONNECTING)
      ) {
        try {
          s.close(1000, "route change");
        } catch {}
      }
    };
  }, [groupId, upsertMessage, replaceMessage, removeMessage, jumpToBottom]);

  useEffect(() => {
    const root = scrollWrapRef.current;
    const sentinel = bottomSentinelRef.current;
    if (!root || !sentinel) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setShowScrollDown(!entry.isIntersecting);
      },
      { root, threshold: 1.0 }
    );

    io.observe(sentinel);
    return () => io.disconnect();
  }, [messages.length]);

  useEffect(() => {
    return () => {
      Object.values(pdfSrc).forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
    };
  }, [pdfSrc]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const ensurePdfSrc = useCallback(
    async (id: string, href: string) => {
      if (pdfSrc[id]) return pdfSrc[id];

      try {
        const res = await fetch(href, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const raw = await res.blob();
        const pdfBlob =
          raw.type === "application/pdf"
            ? raw
            : new Blob([raw], { type: "application/pdf" });

        const obj = URL.createObjectURL(pdfBlob);
        setPdfSrc((s) => ({ ...s, [id]: obj }));
        return obj;
      } catch {
        setError(
          "Unable to preview this PDF. Try opening it in a new tab or download it."
        );
        return undefined;
      }
    },
    [pdfSrc]
  );

  const sendMessage = async () => {
    if (!input.trim() || !adminId || uploading) return;

    try {
      const resp = await post("/group-chat/send", {
        groupId,
        senderId: adminId,
        text: input.trim(),
        replyTo: replyTo?.messageId ?? null,
      });

      const serverMsg = sanitizeMessage(
        resp?.messageData || resp?.message || {}
      );
      if (serverMsg.messageId) {
        upsertMessage(serverMsg);
        requestAnimationFrame(() => jumpToBottom(true));
      }

      setInput("");
      setReplyTo(null);
    } catch {
      setError("Failed to send message");
    }
  };

  const onAttachClick = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const onFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await sendFiles(files);
  };

  const sendFiles = async (files: FileList) => {
    if (!files || files.length === 0 || !adminId) return;

    const form = new FormData();
    form.append("groupId", groupId);
    form.append("senderId", adminId);
    if (input.trim()) form.append("text", input.trim());
    if (replyTo?.messageId) form.append("replyTo", replyTo.messageId);
    Array.from(files).forEach((f) => form.append("files", f));

    try {
      setUploading(true);
      const resp = await post("/group-chat/send-file", form);

      const serverMsg = sanitizeMessage(
        resp?.messageData || resp?.message || {}
      );
      if (serverMsg.messageId) {
        upsertMessage(serverMsg);
        requestAnimationFrame(() => jumpToBottom(true));
      }

      setInput("");
      setReplyTo(null);
    } catch (err) {
      console.error(err);
      setError("Failed to upload file(s).");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleExpand = (idx: number) => {
    setExpanded((e) => ({ ...e, [idx]: !e[idx] }));
  };

  const renderAttachment = (
    att: Attachment,
    msg: Message,
    aidx: number
  ) => {
    const key = att.attachmentId || `${msg.messageId}_${aidx}`;
    const href = fileUrl(att.url);
    const fname = att.originalName || href.split("/").pop() || "file";
    const meta = formatFileSize(att.size);

    if (isImageMime(att.mimeType)) {
      return (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener"
          className="group/image block overflow-hidden rounded-2xl border border-border bg-card"
          title={fname}
        >
          <img
            src={att.thumbnailUrl || href}
            alt={fname}
            className="h-44 w-full object-cover transition-transform duration-300 group-hover/image:scale-[1.02]"
          />
          <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
            <span className="truncate">{fname}</span>
            {meta ? <span>{meta}</span> : null}
          </div>
        </a>
      );
    }

    if (isVideoMime(att.mimeType)) {
      return (
        <div
          key={key}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <video controls className="h-52 w-full bg-muted" src={href} />
          <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
            <span className="truncate">{fname}</span>
            {meta ? <span>{meta}</span> : null}
          </div>
        </div>
      );
    }

    if (isPdfMime(att.mimeType)) {
      const id = keyFor(msg.messageId, aidx);
      const open = !!openPdf[id];
      const objectUrl = pdfSrc[id];

      return (
        <div
          key={key}
          className="col-span-2 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">
                {fname}
              </div>
              <div className="text-xs text-muted-foreground">
                PDF document {meta ? `• ${meta}` : ""}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={async () => {
                  if (!open) await ensurePdfSrc(id, href);
                  setOpenPdf((s) => ({ ...s, [id]: !open }));
                }}
              >
                <HiOutlineEye className="mr-1 h-4 w-4" />
                {open ? "Hide" : "Preview"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={async () => {
                  const url = await ensurePdfSrc(id, href);
                  if (url)
                    window.open(url, "_blank", "noopener,noreferrer");
                }}
              >
                Open
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => downloadByHref(withDownload(href), fname)}
              >
                <HiDownload className="mr-1 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          {open && (
            <div className="border-t border-border bg-muted/40">
              <div className="h-[60vh] w-full overflow-hidden">
                {objectUrl ? (
                  <object
                    data={objectUrl}
                    type="application/pdf"
                    className="h-full w-full"
                    aria-label={`Preview: ${fname}`}
                  >
                    <div className="flex h-full w-full items-center justify-center p-4 text-sm text-muted-foreground">
                      Preview unavailable in this browser. Use Open or Download.
                    </div>
                  </object>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    Preparing preview…
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={key}
        className="col-span-2 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm"
      >
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{fname}</div>
          <div className="text-xs text-muted-foreground">
            File {meta ? `• ${meta}` : ""}
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => downloadByHref(withDownload(href), fname)}
        >
          <HiDownload className="mr-1 h-4 w-4" />
          Download
        </Button>
      </div>
    );
  };

  return (
    <>
      <Card className="relative flex h-[100dvh] min-h-0 flex-col overflow-hidden rounded-none border-0 bg-background">
        <CardHeader className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <Button
              variant="ghost"
              className="mt-1 h-10 rounded-full px-3"
              onClick={() => router.back()}
            >
              <HiArrowLeft className="mr-1 h-5 w-5" />
              Back
            </Button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-center gap-3">
                <Avatar className="h-12 w-12 border border-border shadow-sm">
                  <AvatarFallback className="bg-muted text-base font-semibold text-foreground">
                    {groupInitial}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 text-center">
                  <h3 className="truncate text-lg font-semibold text-foreground sm:text-xl">
                    {group?.groupName || "Group Chat"}
                  </h3>
                  <div className="mt-1 flex items-center justify-center gap-2 text-xs text-muted-foreground sm:text-sm">
                    <span>
                      {(group?.participants?.length || 0)} member
                      {(group?.participants?.length || 0) === 1 ? "" : "s"}
                    </span>
                    <span>•</span>
                    <span>
                      {socketState === "connected"
                        ? "Live"
                        : socketState === "reconnecting"
                        ? "Reconnecting..."
                        : "Connecting..."}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {(group?.participants || []).slice(0, 8).map((p) => (
                  <div
                    key={p.adminId}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs"
                  >
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className="text-muted-foreground uppercase">{p.role}</span>
                    {revenueHeadParticipant?.adminId === p.adminId ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Revenue Head
                      </span>
                    ) : null}
                  </div>
                ))}

                {(group?.participants?.length || 0) > 8 ? (
                  <button
                    type="button"
                    onClick={() => setParticipantsOpen(true)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                  >
                    +{(group?.participants?.length || 0) - 8} more
                  </button>
                ) : null}
              </div>

              {group?.description ? (
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  {group.description}
                </p>
              ) : null}
            </div>

            <div className="flex min-w-[120px] justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setParticipantsOpen(true)}
              >
                <HiUsers className="mr-1 h-4 w-4" />
                Participants
              </Button>

              {canManageGroup && adminId ? (
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={() => setManageOpen(true)}
                >
                  <HiCog className="mr-1 h-4 w-4" />
                  Manage
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <div className="relative flex min-h-0 flex-1 flex-col bg-background">
          {error ? (
            <div className="absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full border border-destructive/20 bg-background/95 px-4 py-2 text-xs font-medium text-destructive shadow-lg backdrop-blur">
              {error}
            </div>
          ) : null}

          <div className="relative min-h-0 flex-1">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">
                  Loading conversation…
                </div>
              </div>
            ) : (
              <div
                ref={scrollWrapRef}
                className="h-full overflow-y-auto px-3 py-4 sm:px-5 sm:py-5"
              >
                <div className="mx-auto flex max-w-5xl flex-col gap-4">
                  {uiRows.map((row, idx) => {
                    if (row.type === "date") {
                      return (
                        <div
                          key={row.id}
                          className="sticky top-2 z-10 mx-auto rounded-full border border-border bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur"
                        >
                          {row.label}
                        </div>
                      );
                    }

                    const msg = sanitizeMessage(row.message);
                    const isMe = msg.senderId === adminId;
                    const senderName = getSenderName(msg.senderId);
                    const senderInitial = (
                      senderName.charAt(0) || "A"
                    ).toUpperCase();

                    const time = formatTime(msg.timestamp);
                    const fullText = asString(msg.text, "");
                    const tooLong = fullText.length > CHAR_LIMIT;
                    const shown =
                      !tooLong || expanded[idx]
                        ? fullText
                        : fullText.slice(0, CHAR_LIMIT) + "…";

                    const ringHighlight =
                      highlightId === msg.messageId
                        ? "ring-2 ring-foreground/20 ring-offset-2 ring-offset-background"
                        : "";

                    return (
                      <div
                        key={msg.messageId}
                        ref={(el) => {
                          if (el) messageRefs.current[msg.messageId] = el;
                        }}
                        className={`group flex ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isMe ? (
                          <Avatar className="mr-2 mt-auto hidden h-8 w-8 shrink-0 sm:inline-flex">
                            <AvatarFallback className="bg-muted text-xs font-semibold text-foreground shadow-sm">
                              {senderInitial}
                            </AvatarFallback>
                          </Avatar>
                        ) : null}

                        <div className="max-w-[92%] sm:max-w-[72%]">
                          {msg.reply &&
                          (msg.reply.text || msg.reply.hasAttachment) ? (
                            <button
                              type="button"
                              onClick={() => scrollToMessageId(msg.reply!.messageId)}
                              className="mb-2 w-full rounded-2xl border border-border bg-muted/40 px-3 py-2 text-left shadow-sm transition hover:bg-muted"
                              title="Go to original"
                            >
                              <div className="text-[11px] font-semibold text-foreground">
                                Replying to
                              </div>
                              <div className="line-clamp-2 text-[12px] text-muted-foreground">
                                {msg.reply.text ||
                                  (msg.reply.hasAttachment
                                    ? "[Attachment]"
                                    : "")}
                                {msg.reply.attachment?.originalName
                                  ? ` • ${msg.reply.attachment.originalName}`
                                  : ""}
                              </div>
                            </button>
                          ) : null}

                          {!isMe ? (
                            <div className="mb-1 ml-1 text-[11px] font-medium text-muted-foreground">
                              {senderName}
                            </div>
                          ) : null}

                          <div
                            className={[
                              "overflow-hidden rounded-[22px] px-4 py-3 shadow-sm transition-all duration-200",
                              isMe
                                ? "rounded-br-md border border-foreground/10 bg-foreground text-background"
                                : "rounded-bl-md border border-border bg-card text-foreground",
                              ringHighlight,
                            ].join(" ")}
                          >
                            {shown ? (
                              <>
                                <p className="whitespace-pre-wrap break-words text-[15px] leading-7">
                                  {shown}
                                </p>

                                {tooLong ? (
                                  <button
                                    onClick={() => toggleExpand(idx)}
                                    className={`mt-2 text-xs font-medium hover:underline ${
                                      isMe
                                        ? "text-background/80"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {expanded[idx] ? "Show less" : "Read more"}
                                  </button>
                                ) : null}
                              </>
                            ) : null}

                            {msg.attachments && msg.attachments.length > 0 ? (
                              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {msg.attachments.map((att, aidx) =>
                                  renderAttachment(att, msg, aidx)
                                )}
                              </div>
                            ) : null}

                            <div
                              className={`mt-2 flex items-center justify-end gap-1 text-[11px] ${
                                isMe ? "text-background/70" : "text-muted-foreground"
                              }`}
                            >
                              <span>{time}</span>
                              {msg.editedAt ? <span>• edited</span> : null}
                            </div>
                          </div>

                          <div
                            className={`mt-1 ${
                              isMe ? "text-right" : "text-left"
                            }`}
                          >
                            <button
                              onClick={() =>
                                setReplyTo({
                                  messageId: msg.messageId,
                                  text: asString(msg.text, ""),
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] text-muted-foreground opacity-0 transition group-hover:bg-accent group-hover:opacity-100 hover:text-foreground"
                              title="Reply"
                            >
                              <HiReply className="h-4 w-4" />
                              Reply
                            </button>
                          </div>
                        </div>

                        {isMe ? (
                          <Avatar className="ml-2 mt-auto hidden h-8 w-8 shrink-0 border border-border sm:inline-flex">
                            <AvatarFallback className="bg-foreground text-[10px] font-semibold text-background">
                              Me
                            </AvatarFallback>
                          </Avatar>
                        ) : null}
                      </div>
                    );
                  })}

                  <div ref={bottomSentinelRef} className="h-1 w-full" />
                </div>
              </div>
            )}

            {showScrollDown ? (
              <Button
                variant="outline"
                className="absolute bottom-5 right-5 h-11 rounded-full border-border bg-background/95 px-4 text-foreground shadow-lg backdrop-blur hover:bg-accent"
                onClick={() => jumpToBottom(true)}
                title="Back to bottom"
              >
                <HiArrowDown className="mr-2 h-5 w-5" />
                Latest
              </Button>
            ) : null}
          </div>

          <CardFooter className="border-t border-border bg-background/95 px-3 py-3 backdrop-blur sm:px-6 sm:py-4">
            <div className="mx-auto w-full max-w-5xl">
              {replyTo ? (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 shadow-sm">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-foreground">
                      Replying
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      {asString(replyTo.text, "").slice(0, 180) || "Message"}
                    </div>
                  </div>

                  <button
                    onClick={() => setReplyTo(null)}
                    className="rounded-full p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    title="Cancel reply"
                  >
                    <HiX className="h-5 w-5" />
                  </button>
                </div>
              ) : null}

              <div className="flex items-end gap-2 rounded-[28px] border border-border bg-card p-2 shadow-sm sm:gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,application/pdf"
                  className="hidden"
                  onChange={onFilesSelected}
                />

                <button
                  type="button"
                  onClick={onAttachClick}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  title={uploading ? "Uploading…" : "Attach"}
                  disabled={uploading}
                >
                  <HiPaperClip className="h-5 w-5" />
                </button>

                <div className="flex-1">
                  <Textarea
                    ref={textareaRef}
                    placeholder={uploading ? "Uploading files…" : "Type a message"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (!uploading && e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    rows={1}
                    disabled={uploading}
                    className="max-h-40 min-h-[44px] resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-6 text-foreground shadow-none focus-visible:ring-0"
                  />
                  <div className="flex items-center justify-between px-2 pb-1">
                    <div className="text-xs text-muted-foreground">
                      {uploading
                        ? "Uploading attachment..."
                        : "Enter to send • Shift + Enter for new line"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {input.length}/2000
                    </div>
                  </div>
                </div>

                <Button
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-full bg-foreground text-background shadow-sm transition hover:opacity-90 disabled:opacity-60"
                  disabled={!input.trim() || uploading}
                  onClick={sendMessage}
                  title="Send"
                >
                  <HiPaperAirplane className="h-5 w-5 rotate-90" />
                </Button>
              </div>
            </div>
          </CardFooter>
        </div>
      </Card>

      {participantsOpen ? (
        <div
          className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px]"
          onClick={() => setParticipantsOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Participants
                </h3>
                <p className="text-sm text-muted-foreground">
                  Everyone currently in this group
                </p>
              </div>

              <button
                type="button"
                onClick={() => setParticipantsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 p-5">
              {(group?.participants || []).map((p) => {
                const isRevenueHead = revenueHeadParticipant?.adminId === p.adminId;

                return (
                  <div
                    key={p.adminId}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-muted font-semibold text-foreground">
                        {(p.name?.charAt(0) || "A").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-foreground">
                        {p.name}
                      </div>
                      <div className="truncate text-sm text-muted-foreground">
                        {p.email || "No email"}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium uppercase text-foreground">
                        {p.role}
                      </span>

                      {isRevenueHead ? (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">
                          Fixed
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {canManageGroup && adminId ? (
        <ManageGroupModal
          open={manageOpen}
          onClose={() => setManageOpen(false)}
          adminId={adminId}
          groupId={groupId}
          onUpdated={async () => {
            await reloadGroup();
          }}
        />
      ) : null}
    </>
  );
}