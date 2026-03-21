"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Send,
  Users,
  Mail,
  MessageSquare,
  ChevronRight,
  Filter,
  Clock3,
  Sparkles,
  Eye,
  UserCircle2,
  Inbox,
  PanelLeft,
  LayoutGrid,
  X,
  Upload,
  FileSpreadsheet,
  Trash2,
  Loader2,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";
import EmailEditor from "@/components/ui/EmailEditor";
import {
  type AdminRole,
  type AdminEmailThreadDto,
  type AdminEmailMessageDto,
  sendBulkCsvEmail,
  fetchEmailThreads,
  fetchThreadMessages,
  replyToEmailThread,
} from "./admin-email";

type RecipientStatus = "Ready" | "Sent" | "Replied" | "Bounced" | "Failed";
type ThreadStatusUi = "Waiting" | "Replied" | "Closed" | "Archived";
type AudienceType = "Admin outreach";

type Recipient = {
  id: string;
  name: string;
  email: string;
  company?: string;
  niche?: string;
  status: RecipientStatus;
  tags: string[];
  lastContact?: string;
  createdAt: number;
  threadId?: string;
  replyToEmail?: string;
};

type Message = {
  id: string;
  sender: string;
  email: string;
  role: "executive" | "recipient";
  body: string;
  time: string;
  direction: "INBOUND" | "OUTBOUND";
  providerStatus?: string;
};

type Thread = {
  id: string;
  subject: string;
  recipientName: string;
  recipientEmail: string;
  audience: AudienceType;
  role: AdminRole;
  status: ThreadStatusUi;
  unread: number;
  lastMessageAt: string;
  lastMessageDirection?: "INBOUND" | "OUTBOUND";
  replyToEmail?: string;
  senderEmail?: string;
  ownerAdminId?: string;
  ownerAdminName?: string;
  ownerAdminEmail?: string;
  ownerProxyEmail?: string;
  tags: string[];
  messages: Message[];
};

type UploadSummary = {
  fileName: string;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  invalidRows: number;
};

type EmailEditorAttachment = {
  filename: string;
  contentType: string;
  size: number;
  contentBase64: string;
};

const ADMIN_REPLY_DOMAIN = "reply.collabglam.cloud";

const roleConfig: Record<
  AdminRole,
  {
    title: string;
    subtitle: string;
    deskEmail: string;
    badge: string;
  }
> = {
  super_admin: {
    title: "Super Admin",
    subtitle: "Full admin email operations across all visible thread trees.",
    deskEmail: "admin@collabglam.cloud",
    badge: "Super Admin",
  },
  revenue_head: {
    title: "Revenue Head",
    subtitle: "Own threads plus IME and BME threads within the managed tree.",
    deskEmail: "revenue@collabglam.cloud",
    badge: "Revenue Head",
  },
  ime: {
    title: "Influencer Marketing Executive",
    subtitle: "Personal outbound threads and replies for your own mailbox.",
    deskEmail: "ime@collabglam.cloud",
    badge: "IME",
  },
  bme: {
    title: "Brand Marketing Executive",
    subtitle: "Personal outbound threads and replies for your own mailbox.",
    deskEmail: "bme@collabglam.cloud",
    badge: "BME",
  },
};

const threadStatusPillClass: Record<ThreadStatusUi, string> = {
  Waiting: "bg-amber-50 text-amber-700 border border-amber-200",
  Replied: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Closed: "bg-slate-100 text-slate-700 border border-slate-200",
  Archived: "bg-slate-100 text-slate-500 border border-slate-200",
};

const recipientStatusPillClass: Record<RecipientStatus, string> = {
  Ready: "bg-slate-100 text-slate-700 border border-slate-200",
  Sent: "bg-blue-50 text-blue-700 border border-blue-200",
  Replied: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Bounced: "bg-rose-50 text-rose-700 border border-rose-200",
  Failed: "bg-rose-50 text-rose-700 border border-rose-200",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatRelativeNow() {
  return new Date().toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(value?: string | number | Date | null) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[_\-\s]+/g, " ");
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^"|"$/g, "").trim());
}

function parseCsv(text: string) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) return { headers: [], rows: [] as string[][] };

  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  return { headers, rows };
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function extractCell(
  row: string[],
  headerMap: Map<string, number>,
  fallbacks: string[]
) {
  for (const key of fallbacks) {
    const idx = headerMap.get(key);
    if (idx != null && row[idx] != null) return row[idx].trim();
  }
  return "";
}

function recipientsToCsv(recipients: Recipient[]) {
  const header = [
    "name",
    "email",
    "company",
    "niche",
    "status",
    "replyToEmail",
    "tags",
  ];
  const lines = recipients.map((item) =>
    [
      item.name,
      item.email,
      item.company || "",
      item.niche || "",
      item.status,
      item.replyToEmail || "",
      item.tags.join(" | "),
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  );

  return [header.join(","), ...lines].join("\n");
}

function getThreadOwner(thread: AdminEmailThreadDto) {
  const exec = thread.executiveId;

  if (!exec) {
    return {
      ownerAdminId: "",
      ownerAdminName: "",
      ownerAdminEmail: "",
      ownerProxyEmail: "",
    };
  }

  if (typeof exec === "string") {
    return {
      ownerAdminId: exec,
      ownerAdminName: "",
      ownerAdminEmail: "",
      ownerProxyEmail: "",
    };
  }

  return {
    ownerAdminId: exec._id || "",
    ownerAdminName: exec.name || "",
    ownerAdminEmail: exec.email || "",
    ownerProxyEmail: exec.proxyEmail || "",
  };
}

function getRoleScopeText(role: AdminRole) {
  if (role === "super_admin") {
    return "Can see every admin thread across the system.";
  }

  if (role === "revenue_head") {
    return "Can see own threads plus all IME and BME threads under the managed tree.";
  }

  return "Can see only own threads.";
}

function mapBackendThreadToUi(thread: AdminEmailThreadDto): Thread {
  let status: ThreadStatusUi = "Waiting";

  if (thread.status === "CLOSED") status = "Closed";
  else if (thread.status === "ARCHIVED") status = "Archived";
  else if (thread.lastMessageDirection === "INBOUND") status = "Replied";

  const owner = getThreadOwner(thread);

  return {
    id: thread._id,
    subject: thread.subject || "(no subject)",
    recipientName: thread.recipientEmail || "Recipient",
    recipientEmail: thread.recipientEmail || "",
    audience: "Admin outreach",
    role: thread.role,
    status,
    unread: 0,
    lastMessageAt: formatDateTime(thread.lastMessageAt),
    lastMessageDirection: thread.lastMessageDirection,
    replyToEmail: thread.replyToEmail,
    senderEmail: thread.senderEmail,
    ownerAdminId: owner.ownerAdminId,
    ownerAdminName: owner.ownerAdminName,
    ownerAdminEmail: owner.ownerAdminEmail,
    ownerProxyEmail: owner.ownerProxyEmail,
    tags: [
      thread.role?.toUpperCase?.() || "",
      thread.lastMessageDirection || "",
      owner.ownerAdminName || owner.ownerAdminEmail || "",
    ].filter(Boolean),
    messages: [],
  };
}

function mapBackendMessageToUi(
  msg: AdminEmailMessageDto,
  thread: Thread | null
): Message {
  const body =
    msg.textPreview ||
    (typeof msg.htmlPreview === "string"
      ? msg.htmlPreview.replace(/<[^>]+>/g, "")
      : "") ||
    "";

  return {
    id: msg._id,
    sender:
      msg.direction === "OUTBOUND"
        ? thread?.senderEmail || thread?.ownerAdminName || thread?.role || "Admin"
        : msg.from || "Recipient",
    email:
      msg.direction === "OUTBOUND" ? thread?.senderEmail || "" : msg.from || "",
    role: msg.direction === "OUTBOUND" ? "executive" : "recipient",
    body,
    time: formatDateTime(msg.createdAt),
    direction: msg.direction,
    providerStatus: msg.providerStatus,
  };
}

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [role, setRole] = useState<AdminRole>("ime");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSending, setEditorSending] = useState(false);

  const [mobileRecipientsOpen, setMobileRecipientsOpen] = useState(false);
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);

  const [editorPayload, setEditorPayload] = useState({
    toLabel: "",
    subject: "",
    initialBody: "",
    toAvatar: "",
  });

  const [uploadedCsvFile, setUploadedCsvFile] = useState<File | null>(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const [uploadSummary, setUploadSummary] = useState<
    Record<AdminRole, UploadSummary | null>
  >({
    super_admin: null,
    revenue_head: null,
    ime: null,
    bme: null,
  });

  const [recipientsByDesk, setRecipientsByDesk] = useState<
    Record<AdminRole, Recipient[]>
  >({
    super_admin: [],
    revenue_head: [],
    ime: [],
    bme: [],
  });

  const [threadsByDesk, setThreadsByDesk] = useState<Record<AdminRole, Thread[]>>({
    super_admin: [],
    revenue_head: [],
    ime: [],
    bme: [],
  });

  const config = roleConfig[role];
  const recipients = recipientsByDesk[role];
  const threads = threadsByDesk[role];

  const filteredRecipients = useMemo(() => {
    return recipients.filter((item) => {
      const q = search.toLowerCase();

      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.company?.toLowerCase().includes(q) ||
        item.niche?.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [recipients, search, statusFilter]);

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      const q = search.toLowerCase();

      const matchesSearch =
        !search ||
        thread.subject.toLowerCase().includes(q) ||
        thread.recipientName.toLowerCase().includes(q) ||
        thread.recipientEmail.toLowerCase().includes(q) ||
        thread.replyToEmail?.toLowerCase().includes(q) ||
        thread.senderEmail?.toLowerCase().includes(q) ||
        thread.ownerAdminName?.toLowerCase().includes(q) ||
        thread.ownerAdminEmail?.toLowerCase().includes(q) ||
        thread.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "All" || thread.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [threads, search, statusFilter]);

  const selectedThread =
    filteredThreads.find((thread) => thread.id === selectedThreadId) ||
    filteredThreads[0] ||
    null;

  const selectedRecipients = recipients.filter((item) =>
    selectedRecipientIds.includes(item.id)
  );

  const totalRecipients = recipients.length;
  const repliedCount = recipients.filter((r) => r.status === "Replied").length;
  const sentCount = recipients.filter((r) => r.status === "Sent").length;
  const failedCount = recipients.filter(
    (r) => r.status === "Bounced" || r.status === "Failed"
  ).length;
  const activeSelectionCount = selectedRecipients.length;
  const summary = uploadSummary[role];

  const loadThreadsFromApi = async () => {
    try {
      setLoadingThreads(true);
      setApiError(null);

      const response = await fetchEmailThreads({
        page: 1,
        limit: 100,
      });

      const items = response?.data?.items || [];
      const mappedThreads = items.map(mapBackendThreadToUi);

      setThreadsByDesk((prev) => ({
        ...prev,
        [role]: mappedThreads,
      }));

      setSelectedThreadId((prev) => {
        if (prev && mappedThreads.some((item) => item.id === prev)) return prev;
        return mappedThreads[0]?.id || null;
      });
    } catch (error: any) {
      setApiError(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load threads"
      );
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadThreadMessagesFromApi = async (threadId: string) => {
    if (!threadId) return;

    try {
      setLoadingMessages(true);
      setApiError(null);

      const response = await fetchThreadMessages(threadId);
      const backendThread = response?.data?.thread;
      const baseThread = backendThread
        ? mapBackendThreadToUi(backendThread)
        : selectedThread;

      const backendMessages = (response?.data?.messages || []).map(
        (msg: AdminEmailMessageDto) => mapBackendMessageToUi(msg, baseThread || null)
      );

      setThreadsByDesk((prev) => ({
        ...prev,
        [role]: prev[role].map((thread) =>
          thread.id === threadId
            ? {
              ...thread,
              ...(baseThread ? baseThread : {}),
              messages: backendMessages,
            }
            : thread
        ),
      }));
    } catch (error: any) {
      setApiError(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load thread messages"
      );
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadThreadsFromApi();
  }, [role]);

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadMessagesFromApi(selectedThreadId);
    }
  }, [selectedThreadId]);

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredRecipients.map((item) => item.id);
    const allVisibleSelected = visibleIds.every((id) =>
      selectedRecipientIds.includes(id)
    );

    if (allVisibleSelected) {
      setSelectedRecipientIds((prev) =>
        prev.filter((id) => !visibleIds.includes(id))
      );
    } else {
      setSelectedRecipientIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleRoleChange = (item: AdminRole) => {
    setRole(item);
    setSelectedRecipientIds([]);
    setSearch("");
    setStatusFilter("All");
    setSelectedThreadId(null);
    setApiError(null);
    setBannerMessage(null);
  };

  const handleCsvUpload = async (file: File) => {
    const text = await file.text();
    const { headers, rows } = parseCsv(text);

    if (!headers.length) return;

    const headerMap = new Map(
      headers.map((header, index) => [normalizeHeader(header), index])
    );

    const nextRecipients: Recipient[] = [];
    let invalidRows = 0;
    let duplicateRows = 0;

    setRecipientsByDesk((prev) => {
      const existingEmails = new Set(
        prev[role].map((item) => item.email.toLowerCase())
      );

      for (const row of rows) {
        const email = extractCell(row, headerMap, ["email", "e mail", "mail"]).toLowerCase();
        const name = extractCell(row, headerMap, ["name", "full name", "fullname"]);
        const company = extractCell(row, headerMap, [
          "company",
          "brand",
          "organization",
          "organisation",
        ]);
        const niche = extractCell(row, headerMap, ["niche", "category", "industry"]);
        const rawTags = extractCell(row, headerMap, ["tags", "tag"]);

        if (!email || !isValidEmail(email)) {
          invalidRows += 1;
          continue;
        }

        if (existingEmails.has(email)) {
          duplicateRows += 1;
          continue;
        }

        existingEmails.add(email);

        nextRecipients.push({
          id: makeId("recipient"),
          name: name || email.split("@")[0],
          email,
          company: company || undefined,
          niche: niche || undefined,
          status: "Ready",
          tags: rawTags
            ? rawTags
              .split(/[|,]/)
              .map((item) => item.trim())
              .filter(Boolean)
            : [],
          createdAt: Date.now(),
        });
      }

      return {
        ...prev,
        [role]: [...prev[role], ...nextRecipients],
      };
    });

    setUploadSummary((prev) => ({
      ...prev,
      [role]: {
        fileName: file.name,
        totalRows: rows.length,
        importedRows: nextRecipients.length,
        duplicateRows,
        invalidRows,
      },
    }));
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCsv(true);
      setApiError(null);
      setBannerMessage(null);
      setUploadedCsvFile(file);
      await handleCsvUpload(file);
    } catch (error: any) {
      setApiError(error?.message || "Failed to parse CSV");
    } finally {
      setUploadingCsv(false);
      event.target.value = "";
    }
  };

  const clearRecipientsForRole = () => {
    setRecipientsByDesk((prev) => ({ ...prev, [role]: [] }));
    setUploadSummary((prev) => ({ ...prev, [role]: null }));
    setSelectedRecipientIds([]);
    setUploadedCsvFile(null);
    setApiError(null);
    setBannerMessage(null);
  };

  const exportRecipientsForRole = () => {
    if (!recipients.length) return;
    const blob = new Blob([recipientsToCsv(recipients)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${role}-admin-recipients.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendBulkCsvToBackend = async () => {
    if (!uploadedCsvFile) {
      setApiError("Please upload a CSV file first.");
      return;
    }

    try {
      setSendingBulk(true);
      setApiError(null);
      setBannerMessage(null);

      const response = await sendBulkCsvEmail({
        file: uploadedCsvFile,
      });

      const resultMap = new Map(
        (response?.data?.results || []).map((item: any) => [
          String(item.email || "").toLowerCase(),
          item,
        ])
      );

      setRecipientsByDesk((prev) => ({
        ...prev,
        [role]: prev[role].map((recipient) => {
          const apiItem = resultMap.get(recipient.email.toLowerCase());
          if (!apiItem) return recipient;

          return {
            ...recipient,
            status: apiItem.success
              ? "Sent"
              : apiItem.error?.toLowerCase().includes("bounce")
                ? "Bounced"
                : "Failed",
            lastContact: apiItem.success ? formatRelativeNow() : recipient.lastContact,
            threadId: apiItem.threadId,
            replyToEmail: apiItem.replyToEmail,
          };
        }),
      }));

      await loadThreadsFromApi();

      setBannerMessage(
        `Bulk email finished. Sent: ${response.data.sent}, Failed: ${response.data.failed}. Replies will route through ${ADMIN_REPLY_DOMAIN}.`
      );
    } catch (error: any) {
      setApiError(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send bulk email"
      );
    } finally {
      setSendingBulk(false);
    }
  };

  const openReplyEditor = () => {
    if (!selectedThread) return;

    setEditorPayload({
      toLabel: selectedThread.recipientEmail,
      subject: `Re: ${selectedThread.subject}`,
      initialBody:
        "Hi,\n\nThanks for your reply. Sharing the requested details below.\n\nBest regards,\nCollabGlam",
      toAvatar: "",
    });
    setEditorOpen(true);
  };

  const handleEditorSend = async (payload: {
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
    htmlBody: string;
    attachments: EmailEditorAttachment[];
  }) => {
    try {
      setEditorSending(true);
      setApiError(null);

      if (!selectedThread) throw new Error("No thread selected");

      await replyToEmailThread({
        threadId: selectedThread.id,
        subject: payload.subject,
        text: payload.body,
        html: payload.htmlBody,
      });

      await loadThreadsFromApi();
      await loadThreadMessagesFromApi(selectedThread.id);

      setEditorOpen(false);
      setBannerMessage(
        "Reply sent. Future responses should continue in the same admin thread."
      );
    } catch (error: any) {
      setApiError(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send reply"
      );
    } finally {
      setEditorSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[270px] shrink-0 rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur xl:flex xl:flex-col">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wide text-slate-900">
                  CollabGlam
                </div>
                <div className="text-xs text-slate-500">
                  Admin Email Console
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Active role
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {config.title}
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                {config.subtitle}
              </div>
              <div className="mt-2 text-xs leading-5 text-slate-500">
                {getRoleScopeText(role)}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <SidebarItem icon={<LayoutGrid className="h-4 w-4" />} label="Overview" active />
            <SidebarItem icon={<Users className="h-4 w-4" />} label="Bulk CSV send" />
            <SidebarItem icon={<Inbox className="h-4 w-4" />} label="Threads" />
            <SidebarItem icon={<ArrowRightLeft className="h-4 w-4" />} label="Inbound replies" />
            <SidebarItem icon={<Mail className="h-4 w-4" />} label="SES status" />
          </div>

          <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Clock3 className="h-4 w-4" />
              Live summary
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <MetricRow label="Imported recipients" value={String(totalRecipients)} />
              <MetricRow label="Threads" value={String(threads.length)} />
              <MetricRow label="Selected" value={String(activeSelectionCount)} />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="space-y-6">
            {apiError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {apiError}
              </div>
            ) : null}

            {bannerMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {bannerMessage}
              </div>
            ) : null}

            <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-5 py-5 text-white sm:px-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
                      <Sparkles className="h-3.5 w-3.5" />
                      Admin bulk CSV and reply thread workflow
                    </div>
                    <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl xl:text-[2rem]">
                      Admin Outreach Console
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                      Send bulk admin emails, track outbound threads, and continue recipient replies through
                      the admin inbound flow on{" "}
                      <span className="font-semibold text-white">
                        {ADMIN_REPLY_DOMAIN}
                      </span>
                      .
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:flex-col xl:items-end">
                    <div className="inline-flex flex-wrap rounded-2xl border border-white/10 bg-white/10 p-1 backdrop-blur">
                      {(["super_admin", "revenue_head", "ime", "bme"] as AdminRole[]).map(
                        (item) => {
                          const active = role === item;
                          return (
                            <button
                              key={item}
                              onClick={() => handleRoleChange(item)}
                              className={cn(
                                "rounded-xl px-4 py-2 text-sm font-medium transition",
                                active
                                  ? "bg-white text-slate-950 shadow-sm"
                                  : "text-slate-200 hover:bg-white/10"
                              )}
                            >
                              {roleConfig[item].badge}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 xl:hidden">
                      <button
                        onClick={() => setMobileRecipientsOpen(true)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/15"
                      >
                        <PanelLeft className="h-4 w-4" />
                        Recipients
                      </button>
                      <button
                        onClick={() => setMobileThreadsOpen(true)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/15"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Threads
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 px-5 py-5 sm:px-6 md:grid-cols-2 2xl:grid-cols-4">
                <StatCard
                  icon={<Users className="h-5 w-5" />}
                  label="Imported recipients"
                  value={String(totalRecipients)}
                  hint="Recipients loaded from current CSV"
                />
                <StatCard
                  icon={<Send className="h-5 w-5" />}
                  label="Sent"
                  value={String(sentCount)}
                  hint="Bulk send results marked successful"
                />
                <StatCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  label="Replies received"
                  value={String(repliedCount)}
                  hint="Threads with latest inbound direction"
                />
                <StatCard
                  icon={<AlertTriangle className="h-5 w-5" />}
                  label="Failed or bounced"
                  value={String(failedCount)}
                  hint="Rows that failed in the bulk send response"
                />
              </div>
            </section>

            <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.65fr)_360px]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                      Bulk CSV send workspace
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                      Upload a CSV with at least <span className="font-semibold text-slate-700">name</span> and{" "}
                      <span className="font-semibold text-slate-700">email</span>. The backend bulk send flow will
                      create admin threads and assign a unique reply address on{" "}
                      <span className="font-semibold text-slate-700">
                        {ADMIN_REPLY_DOMAIN}
                      </span>
                      .
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">
                        {activeSelectionCount}
                      </span>{" "}
                      selected
                    </div>
                    <button
                      onClick={handleSendBulkCsvToBackend}
                      disabled={!uploadedCsvFile || sendingBulk}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sendingBulk ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {sendingBulk ? "Sending..." : "Send bulk email"}
                    </button>
                  </div>
                </div>

                <div className="mb-5 grid gap-4 xl:grid-cols-[1.15fr_minmax(320px,0.85fr)]">
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          CSV import
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">
                          Upload admin recipient file
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Accepted headers: name, email, company, niche, tags.
                        </p>
                      </div>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
                      >
                        {uploadingCsv ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {uploadingCsv ? "Reading..." : "Upload CSV"}
                      </button>
                    </div>

                    {summary ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <InfoCard title="File" value={summary.fileName} />
                        <InfoCard title="Rows read" value={String(summary.totalRows)} />
                        <InfoCard title="Imported" value={String(summary.importedRows)} />
                        <InfoCard
                          title="Skipped"
                          value={String(summary.invalidRows + summary.duplicateRows)}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                        No CSV uploaded for this role yet.
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">Flow summary</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Final admin email setup uses thread-based routing and hierarchy-aware visibility.
                        </p>
                      </div>
                      <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                        <Eye className="h-4 w-4" />
                        Review
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <FeaturePill text="Bulk CSV send" />
                      <FeaturePill text="Thread-based replies" />
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                      <div className="font-semibold text-slate-900">Admin outbound</div>
                      <div className="mt-1">
                        From: sender on{" "}
                        <span className="font-medium">{ADMIN_REPLY_DOMAIN}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={exportRecipientsForRole}
                        disabled={!recipients.length}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Export CSV
                      </button>

                      <button
                        onClick={clearRecipientsForRole}
                        disabled={!recipients.length}
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Clear list
                      </button>

                      <button
                        onClick={loadThreadsFromApi}
                        disabled={loadingThreads}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        <RefreshCcw
                          className={cn("h-4 w-4", loadingThreads && "animate-spin")}
                        />
                        Refresh threads
                      </button>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="mb-2 text-sm font-semibold text-slate-800">
                        Selected recipients
                      </div>
                      {selectedRecipients.length === 0 ? (
                        <div className="text-sm text-slate-500">
                          No recipients selected yet.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedRecipients.map((item) => (
                            <span
                              key={item.id}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
                            >
                              {item.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">Recipients</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Review imported recipients and bulk send results.
                      </p>
                    </div>
                    <button
                      onClick={toggleSelectAllVisible}
                      disabled={!filteredRecipients.length}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      {filteredRecipients.length > 0 &&
                        filteredRecipients.every((item) =>
                          selectedRecipientIds.includes(item.id)
                        )
                        ? "Clear visible"
                        : "Select visible"}
                    </button>
                  </div>

                  <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                    <label className="relative block">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search recipients"
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-200/50"
                      />
                    </label>

                    <label className="relative block">
                      <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/50"
                      >
                        <option>All</option>
                        <option>Ready</option>
                        <option>Sent</option>
                        <option>Replied</option>
                        <option>Bounced</option>
                        <option>Failed</option>
                        <option>Waiting</option>
                        <option>Closed</option>
                        <option>Archived</option>
                      </select>
                    </label>
                  </div>

                  {!filteredRecipients.length ? (
                    <EmptyState
                      icon={<Users className="h-6 w-6" />}
                      title="No recipients available"
                      description="Upload a CSV to populate the recipient table."
                    />
                  ) : (
                    <div className="space-y-3 max-xl:max-h-[560px] max-xl:overflow-y-auto xl:max-h-[640px] xl:overflow-y-auto xl:pr-1">
                      {filteredRecipients.map((recipient) => {
                        const checked = selectedRecipientIds.includes(recipient.id);
                        return (
                          <button
                            key={recipient.id}
                            onClick={() => toggleRecipient(recipient.id)}
                            className={cn(
                              "w-full rounded-[22px] border bg-white p-4 text-left shadow-sm transition",
                              checked
                                ? "border-slate-900 ring-1 ring-slate-900/10"
                                : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold",
                                  checked
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-300 bg-white text-transparent"
                                )}
                              >
                                ✓
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <div className="truncate font-semibold text-slate-900">
                                      {recipient.name}
                                    </div>
                                    <div className="truncate text-sm text-slate-500">
                                      {recipient.email}
                                    </div>
                                  </div>

                                  <span
                                    className={cn(
                                      "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium",
                                      recipientStatusPillClass[recipient.status]
                                    )}
                                  >
                                    {recipient.status}
                                  </span>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                  <span>
                                    {recipient.company || recipient.niche || "Admin recipient"}
                                  </span>
                                  {recipient.lastContact ? (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span>{recipient.lastContact}</span>
                                    </>
                                  ) : null}
                                  {recipient.replyToEmail ? (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="font-mono">
                                        {recipient.replyToEmail}
                                      </span>
                                    </>
                                  ) : null}
                                </div>

                                {recipient.tags.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {recipient.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                      Quick actions
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Useful controls for the admin mail flow.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-500">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>

                <div className="space-y-3">
                  <QuickAction
                    icon={<Upload className="h-4 w-4" />}
                    title="Import recipient CSV"
                    subtitle="Load recipients into the active admin role"
                    onClick={() => fileInputRef.current?.click()}
                  />
                  <QuickAction
                    icon={<Send className="h-4 w-4" />}
                    title="Send bulk email"
                    subtitle="Create backend admin threads and outbound emails"
                    onClick={handleSendBulkCsvToBackend}
                    disabled={!uploadedCsvFile || sendingBulk}
                  />
                  <QuickAction
                    icon={<Inbox className="h-4 w-4" />}
                    title="Refresh threads"
                    subtitle="Reload admin threads and latest inbound state"
                    onClick={loadThreadsFromApi}
                    disabled={loadingThreads}
                  />
                  <QuickAction
                    icon={<FileSpreadsheet className="h-4 w-4" />}
                    title="Export current list"
                    subtitle="Download current imported recipients as CSV"
                    onClick={exportRecipientsForRole}
                    disabled={!recipients.length}
                  />
                  <QuickAction
                    icon={<Trash2 className="h-4 w-4" />}
                    title="Clear current desk"
                    subtitle="Reset imported recipients for this role"
                    onClick={clearRecipientsForRole}
                    disabled={!recipients.length}
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Clock3 className="h-4 w-4" />
                    Activity summary
                  </div>
                  <div className="space-y-3 text-sm text-slate-600">
                    <MetricRow label="Imported recipients" value={String(totalRecipients)} />
                    <MetricRow label="Threads" value={String(threads.length)} />
                    <MetricRow label="Sent" value={String(sentCount)} />
                    <MetricRow label="Replies received" value={String(repliedCount)} />
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
              <div className="hidden rounded-[28px] border border-slate-200 bg-white shadow-sm xl:block">
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">Threads</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Backend admin email threads
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      {loadingThreads ? "Loading..." : `${filteredThreads.length} threads`}
                    </span>
                  </div>
                </div>

                <div className="max-h-[760px] overflow-y-auto p-3">
                  {!filteredThreads.length ? (
                    <div className="p-3">
                      <EmptyState
                        icon={<Inbox className="h-6 w-6" />}
                        title="No threads yet"
                        description="Threads appear after bulk sends or inbound replies."
                      />
                    </div>
                  ) : (
                    filteredThreads.map((thread) => {
                      const active = selectedThread?.id === thread.id;

                      return (
                        <button
                          key={thread.id}
                          onClick={() => setSelectedThreadId(thread.id)}
                          className={cn(
                            "mb-2 w-full rounded-2xl border p-4 text-left transition",
                            active
                              ? "border-slate-900 bg-slate-50"
                              : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <div className="truncate font-semibold text-slate-900">
                                  {thread.recipientName}
                                </div>
                              </div>

                              <div className="truncate text-sm text-slate-500">
                                {thread.subject}
                              </div>

                              <div className="mt-2 text-xs text-slate-500">
                                Owner:{" "}
                                <span className="font-medium text-slate-700">
                                  {thread.ownerAdminName ||
                                    thread.ownerAdminEmail ||
                                    "Admin"}
                                </span>
                              </div>

                              {thread.senderEmail ? (
                                <div className="mt-1 truncate text-[11px] text-slate-500">
                                  Sender mailbox:{" "}
                                  <span className="font-mono">{thread.senderEmail}</span>
                                </div>
                              ) : null}

                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-1 font-medium",
                                    threadStatusPillClass[thread.status]
                                  )}
                                >
                                  {thread.status}
                                </span>
                                <span>{thread.lastMessageAt}</span>
                              </div>

                              {thread.replyToEmail ? (
                                <div className="mt-2 truncate font-mono text-[11px] text-slate-500">
                                  {thread.replyToEmail}
                                </div>
                              ) : null}
                            </div>

                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                {selectedThread ? (
                  <>
                    <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                              {selectedThread.subject}
                            </h2>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-xs font-medium",
                                threadStatusPillClass[selectedThread.status]
                              )}
                            >
                              {selectedThread.status}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {selectedThread.recipientName} · {selectedThread.recipientEmail}
                          </p>

                          <div className="mt-2 space-y-1 text-xs text-slate-500">
                            <div>
                              Thread owner:{" "}
                              <span className="font-medium text-slate-700">
                                {selectedThread.ownerAdminName ||
                                  selectedThread.ownerAdminEmail ||
                                  "Admin"}
                              </span>
                            </div>

                            {selectedThread.senderEmail ? (
                              <div>
                                Sender mailbox:{" "}
                                <span className="font-mono text-slate-700">
                                  {selectedThread.senderEmail}
                                </span>
                              </div>
                            ) : null}

                            <div>
                              Reply address:{" "}
                              <span className="font-mono text-slate-700">
                                {selectedThread.replyToEmail}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {selectedThread.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="max-h-[520px] space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center py-10 text-slate-500">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading messages...
                        </div>
                      ) : selectedThread.messages.length ? (
                        selectedThread.messages.map((message) => {
                          const isExecutive = message.role === "executive";

                          return (
                            <div
                              key={message.id}
                              className={cn("flex", isExecutive ? "justify-end" : "justify-start")}
                            >
                              <div
                                className={cn(
                                  "max-w-[92%] rounded-[24px] px-4 py-3 shadow-sm sm:max-w-[78%]",
                                  isExecutive
                                    ? "bg-slate-950 text-white"
                                    : "border border-slate-200 bg-slate-50 text-slate-900"
                                )}
                              >
                                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs opacity-80">
                                  <UserCircle2 className="h-3.5 w-3.5" />
                                  <span>{message.sender}</span>
                                  <span>•</span>
                                  <span>{message.time}</span>
                                  {message.providerStatus ? (
                                    <>
                                      <span>•</span>
                                      <span>{message.providerStatus}</span>
                                    </>
                                  ) : null}
                                </div>
                                <p className="whitespace-pre-wrap text-sm leading-6">
                                  {message.body}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center text-sm text-slate-500">
                          No messages yet in this thread.
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-200 px-4 py-4 sm:px-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">Reply composer</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Continue the admin thread. Replies should keep routing through the same thread address.
                          </p>
                        </div>
                        <button
                          onClick={openReplyEditor}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                        >
                          <Send className="h-4 w-4" />
                          Open reply editor
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 sm:p-8">
                    <EmptyState
                      icon={<MessageSquare className="h-7 w-7" />}
                      title="No thread selected"
                      description="Send a bulk email first. Admin threads and inbound replies will appear here."
                    />
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      <MobileDrawer
        open={mobileRecipientsOpen}
        onClose={() => setMobileRecipientsOpen(false)}
        title="Recipients"
      >
        <div className="space-y-3">
          {!filteredRecipients.length ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No recipients"
              description="Upload a CSV to populate this view."
            />
          ) : (
            filteredRecipients.map((recipient) => {
              const checked = selectedRecipientIds.includes(recipient.id);

              return (
                <button
                  key={recipient.id}
                  onClick={() => toggleRecipient(recipient.id)}
                  className={cn(
                    "w-full rounded-2xl border bg-white p-4 text-left transition",
                    checked ? "border-slate-900 bg-slate-50" : "border-slate-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-900">
                        {recipient.name}
                      </div>
                      <div className="truncate text-sm text-slate-500">
                        {recipient.email}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        recipientStatusPillClass[recipient.status]
                      )}
                    >
                      {recipient.status}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </MobileDrawer>

      <MobileDrawer
        open={mobileThreadsOpen}
        onClose={() => setMobileThreadsOpen(false)}
        title="Threads"
      >
        <div className="space-y-3">
          {!filteredThreads.length ? (
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="No threads"
              description="Threads will appear after sending emails."
            />
          ) : (
            filteredThreads.map((thread) => {
              const active = selectedThreadId === thread.id;

              return (
                <button
                  key={thread.id}
                  onClick={() => {
                    setSelectedThreadId(thread.id);
                    setMobileThreadsOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 bg-white"
                  )}
                >
                  <div className="font-semibold text-slate-900">
                    {thread.recipientName}
                  </div>
                  <div className="mt-1 truncate text-sm text-slate-500">
                    {thread.subject}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Owner: {thread.ownerAdminName || thread.ownerAdminEmail || "Admin"}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </MobileDrawer>

      <EmailEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        toLabel={editorPayload.toLabel}
        toAvatar={editorPayload.toAvatar}
        fromName={selectedThread?.ownerAdminName || config.title}
        fromEmail={selectedThread?.senderEmail || config.deskEmail}
        subject={editorPayload.subject}
        initialBody={editorPayload.initialBody}
        sending={editorSending}
        onSend={handleEditorSend}
        onSaveDraft={async (payload) => {
          localStorage.setItem(
            "collabglam-admin-thread-reply-draft",
            JSON.stringify(payload)
          );
        }}
      />
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition",
        active
          ? "bg-slate-950 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
      <div className="mb-3 inline-flex rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm">
        {icon}
      </div>
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">
        {value}
      </div>
      <div className="mt-1 text-xs leading-5 text-slate-500">{hint}</div>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="rounded-xl bg-slate-100 p-2 text-slate-700">{icon}</div>
      <div>
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</div>
      </div>
    </button>
  );
}

function FeaturePill({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
      {text}
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-medium text-slate-500">{title}</div>
      <div className="mt-1 truncate text-sm font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
      <div className="mb-3 rounded-2xl bg-slate-100 p-3 text-slate-500">
        {icon}
      </div>
      <div className="text-base font-semibold text-slate-900">{title}</div>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function MobileDrawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[82vh] rounded-t-[28px] border-t border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(82vh-72px)] overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}