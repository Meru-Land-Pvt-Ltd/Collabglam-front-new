"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileSpreadsheet,
  Filter,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  PanelLeft,
  PencilLine,
  RefreshCcw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import EmailEditor from "@/components/ui/EmailEditor";
import {
  type AdminRole,
  type AdminEmailMessageDto,
  type AdminEmailThreadDto,
  type PipelineRecipientDto,
  composeAdminEmail,
  fetchEmailThreads,
  fetchMailboxScope,
  fetchPipelineRecipients,
  fetchThreadMessages,
  replyToEmailThread,
  sendBulkCsvEmail,
  sendSelectedPipelineEmails,
  updateEmailThread,
} from "./admin-email";

type RecipientStatus = "Ready" | "Sent" | "Replied" | "Bounced" | "Failed";
type ThreadStatusUi = "Waiting" | "Replied" | "Closed" | "Archived";
type ThreadStatusApi = "ACTIVE" | "ARCHIVED" | "CLOSED";
type EditorMode = "compose" | "reply";

type MailboxScopeData = {
  actor: {
    _id: string;
    name?: string;
    email?: string;
    proxyEmail?: string;
    role?: AdminRole | string;
  };
  scope: {
    type: "ALL" | "TREE" | "SELF";
    visibleAdminIds: string[] | null;
    canCompose: boolean;
    canReply: boolean;
    canEditThread: boolean;
  };
};

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

const ROLE_META: Record<
  AdminRole,
  {
    title: string;
    badge: string;
    deskEmail: string;
    subtitle: string;
  }
> = {
  super_admin: {
    title: "Super Admin",
    badge: "Super Admin",
    deskEmail: "admin@collabglam.cloud",
    subtitle: "Can view and manage every admin thread.",
  },
  revenue_head: {
    title: "Revenue Head",
    badge: "Revenue Head",
    deskEmail: "revenue@collabglam.cloud",
    subtitle: "Can view own threads plus IME and BME inside the same tree.",
  },
  ime: {
    title: "IME",
    badge: "IME",
    deskEmail: "ime@collabglam.cloud",
    subtitle: "Can view and manage only own threads.",
  },
  bme: {
    title: "BME",
    badge: "BME",
    deskEmail: "bme@collabglam.cloud",
    subtitle: "Can view and manage only own threads.",
  },
};

const recipientStatusPillClass: Record<RecipientStatus, string> = {
  Ready: "bg-slate-100 text-slate-700 border border-slate-200",
  Sent: "bg-blue-50 text-blue-700 border border-blue-200",
  Replied: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Bounced: "bg-rose-50 text-rose-700 border border-rose-200",
  Failed: "bg-rose-50 text-rose-700 border border-rose-200",
};

const threadStatusPillClass: Record<ThreadStatusUi, string> = {
  Waiting: "bg-amber-50 text-amber-700 border border-amber-200",
  Replied: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Closed: "bg-slate-100 text-slate-700 border border-slate-200",
  Archived: "bg-slate-100 text-slate-500 border border-slate-200",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

function formatRelativeNow() {
  return new Date().toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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

  if (!lines.length) return { headers: [], rows: [] as string[][] };

  return {
    headers: parseCsvLine(lines[0]),
    rows: lines.slice(1).map(parseCsvLine),
  };
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function splitEmailList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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

function stripHtml(html?: string | null) {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
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

function getRoleMeta(role?: string) {
  if (role && role in ROLE_META) {
    return ROLE_META[role as AdminRole];
  }

  return {
    title: "Admin",
    badge: "Admin",
    deskEmail: "admin@collabglam.cloud",
    subtitle: "Mailbox access is controlled by backend scope.",
  };
}

function getScopeText(scope?: "ALL" | "TREE" | "SELF") {
  if (scope === "ALL") return "Can see every admin thread and conversation.";
  if (scope === "TREE")
    return "Can see own threads plus IME and BME inside the managed tree.";
  return "Can see only own threads and conversation.";
}

function mapThreadStatus(thread: AdminEmailThreadDto): ThreadStatusUi {
  if (thread.status === "CLOSED") return "Closed";
  if (thread.status === "ARCHIVED") return "Archived";
  if (thread.lastMessageDirection === "INBOUND") return "Replied";
  return "Waiting";
}

function mapUiStatusToApi(status: ThreadStatusUi): ThreadStatusApi {
  if (status === "Closed") return "CLOSED";
  if (status === "Archived") return "ARCHIVED";
  return "ACTIVE";
}

function mapApiStatusToUi(status?: ThreadStatusApi): ThreadStatusUi {
  if (status === "CLOSED") return "Closed";
  if (status === "ARCHIVED") return "Archived";
  return "Waiting";
}

function mapBackendThreadToUi(thread: AdminEmailThreadDto): Thread {
  const owner = getThreadOwner(thread);

  return {
    id: thread._id,
    subject: thread.subject || "(no subject)",
    recipientName: thread.recipientEmail || "Recipient",
    recipientEmail: thread.recipientEmail || "",
    role: thread.role,
    status: mapThreadStatus(thread),
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
  const body = msg.textPreview || stripHtml(msg.htmlPreview) || "";

  return {
    id: msg._id,
    sender:
      msg.direction === "OUTBOUND"
        ? thread?.ownerAdminName ||
          thread?.senderEmail ||
          thread?.role?.toUpperCase() ||
          "Admin"
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
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const campaignId = searchParams.get("campaignId") || "";
  const pipelineIds = useMemo(() => {
    const raw = searchParams.get("pipelineIds") || "";
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [searchParams]);

  const pipelineSelectionMode = !!campaignId && pipelineIds.length > 0;

  const [mailboxScope, setMailboxScope] = useState<MailboxScopeData | null>(null);
  const [loadingScope, setLoadingScope] = useState(true);

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientStatusFilter, setRecipientStatusFilter] =
    useState<string>("All");

  const [threadSearch, setThreadSearch] = useState("");
  const [threadStatusFilter, setThreadStatusFilter] = useState<string>("All");

  const [threadDraftSubject, setThreadDraftSubject] = useState("");
  const [threadDraftStatus, setThreadDraftStatus] =
    useState<ThreadStatusApi>("ACTIVE");
  const [savingThread, setSavingThread] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("reply");
  const [editorSending, setEditorSending] = useState(false);
  const [editorPayload, setEditorPayload] = useState({
    toLabel: "",
    subject: "",
    initialBody: "",
    toAvatar: "",
  });

  const [mobileRecipientsOpen, setMobileRecipientsOpen] = useState(false);
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);

  const [uploadedCsvFile, setUploadedCsvFile] = useState<File | null>(null);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);

  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const actorRole = mailboxScope?.actor?.role as AdminRole | undefined;
  const config = getRoleMeta(actorRole);

  const filteredRecipients = useMemo(() => {
    const q = recipientSearch.toLowerCase();

    return recipients.filter((item) => {
      const matchesSearch =
        !recipientSearch ||
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.company?.toLowerCase().includes(q) ||
        item.niche?.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchesStatus =
        recipientStatusFilter === "All" ||
        item.status === recipientStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [recipients, recipientSearch, recipientStatusFilter]);

  const filteredThreads = useMemo(() => {
    const q = threadSearch.toLowerCase();

    return threads.filter((thread) => {
      const matchesSearch =
        !threadSearch ||
        thread.subject.toLowerCase().includes(q) ||
        thread.recipientName.toLowerCase().includes(q) ||
        thread.recipientEmail.toLowerCase().includes(q) ||
        thread.ownerAdminName?.toLowerCase().includes(q) ||
        thread.ownerAdminEmail?.toLowerCase().includes(q) ||
        thread.senderEmail?.toLowerCase().includes(q) ||
        thread.replyToEmail?.toLowerCase().includes(q) ||
        thread.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchesStatus =
        threadStatusFilter === "All" || thread.status === threadStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [threads, threadSearch, threadStatusFilter]);

  const selectedRecipients = recipients.filter((item) =>
    selectedRecipientIds.includes(item.id)
  );

  const selectedThread =
    filteredThreads.find((item) => item.id === selectedThreadId) ||
    threads.find((item) => item.id === selectedThreadId) ||
    filteredThreads[0] ||
    threads[0] ||
    null;

  const totalRecipients = recipients.length;
  const sentCount = recipients.filter((item) => item.status === "Sent").length;
  const repliedCount = threads.filter(
    (item) => item.lastMessageDirection === "INBOUND"
  ).length;
  const failedCount = recipients.filter(
    (item) => item.status === "Failed" || item.status === "Bounced"
  ).length;
  const activeSelectionCount = selectedRecipients.length;

  const loadMailboxScope = async () => {
    try {
      setLoadingScope(true);
      setApiError(null);

      const response = await fetchMailboxScope();
      setMailboxScope(response.data);
    } catch (error: any) {
      setApiError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load mailbox scope"
      );
    } finally {
      setLoadingScope(false);
    }
  };

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

      setThreads(mappedThreads);
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
        : threads.find((item) => item.id === threadId) || null;

      const backendMessages = (response?.data?.messages || []).map(
        (msg: AdminEmailMessageDto) => mapBackendMessageToUi(msg, baseThread)
      );

      setThreads((prev) =>
        prev.map((item) =>
          item.id === threadId
            ? {
                ...(baseThread || item),
                messages: backendMessages,
              }
            : item
        )
      );
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

  const loadPipelineRecipients = async () => {
    try {
      setLoadingThreads(true);
      setApiError(null);

      const response = await fetchPipelineRecipients({
        campaignId,
        pipelineIds,
      });

      const items = response?.data?.items || [];

      const mappedRecipients: Recipient[] = items.map(
        (item: PipelineRecipientDto) => ({
          id: item.pipelineId,
          name: item.name || item.email,
          email: item.email,
          company: item.company,
          niche: Array.isArray(item.niche) ? item.niche.join(", ") : undefined,
          status: item.threadId ? "Sent" : "Ready",
          tags: [item.status || "outreach"].filter(Boolean),
          createdAt: Date.now(),
          threadId: item.threadId || undefined,
          replyToEmail: item.replyToEmail || undefined,
        })
      );

      setRecipients(mappedRecipients);
      setSelectedRecipientIds(mappedRecipients.map((item) => item.id));
    } catch (error: any) {
      setApiError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load selected pipeline recipients"
      );
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadMailboxScope();
  }, []);

  useEffect(() => {
    if (!mailboxScope) return;

    if (pipelineSelectionMode) {
      loadPipelineRecipients();
    } else {
      loadThreadsFromApi();
    }
  }, [mailboxScope, pipelineSelectionMode, campaignId, pipelineIds.join(",")]);

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadMessagesFromApi(selectedThreadId);
    }
  }, [selectedThreadId]);

  useEffect(() => {
    if (!selectedThread) {
      setThreadDraftSubject("");
      setThreadDraftStatus("ACTIVE");
      return;
    }

    setThreadDraftSubject(selectedThread.subject);
    setThreadDraftStatus(mapUiStatusToApi(selectedThread.status));
  }, [selectedThread?.id, selectedThread?.subject, selectedThread?.status]);

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredRecipients.map((item) => item.id);
    const allVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedRecipientIds.includes(id));

    if (allVisibleSelected) {
      setSelectedRecipientIds((prev) =>
        prev.filter((id) => !visibleIds.includes(id))
      );
    } else {
      setSelectedRecipientIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleCsvUpload = async (file: File) => {
    const text = await file.text();
    const { headers, rows } = parseCsv(text);
    if (!headers.length) return;

    const headerMap = new Map(
      headers.map((header, index) => [normalizeHeader(header), index])
    );

    const nextRecipients: Recipient[] = [];
    const existingEmails = new Set(recipients.map((item) => item.email.toLowerCase()));

    let invalidRows = 0;
    let duplicateRows = 0;

    for (const row of rows) {
      const email = extractCell(row, headerMap, [
        "email",
        "e mail",
        "mail",
      ]).toLowerCase();
      const name = extractCell(row, headerMap, ["name", "full name", "fullname"]);
      const company = extractCell(row, headerMap, [
        "company",
        "brand",
        "organization",
        "organisation",
      ]);
      const niche = extractCell(row, headerMap, [
        "niche",
        "category",
        "industry",
      ]);
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

    setRecipients((prev) => [...prev, ...nextRecipients]);

    setUploadSummary({
      fileName: file.name,
      totalRows: rows.length,
      importedRows: nextRecipients.length,
      duplicateRows,
      invalidRows,
    });
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

  const clearRecipients = () => {
    setRecipients([]);
    setSelectedRecipientIds([]);
    setUploadSummary(null);
    setUploadedCsvFile(null);
    setBannerMessage(null);
    setApiError(null);
  };

  const exportRecipients = () => {
    if (!recipients.length) return;

    const blob = new Blob([recipientsToCsv(recipients)], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admin-recipients.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const markRecipientsFromSendResult = (
    resultItems: Array<any>,
    key: "email" | "pipelineId"
  ) => {
    const resultMap = new Map(
      resultItems.map((item) => [String(item[key] || "").toLowerCase(), item])
    );

    setRecipients((prev) =>
      prev.map((recipient) => {
        const lookup =
          key === "email"
            ? recipient.email.toLowerCase()
            : String(recipient.id).toLowerCase();

        const apiItem = resultMap.get(lookup);
        if (!apiItem) return recipient;

        return {
          ...recipient,
          status: apiItem.success ? "Sent" : "Failed",
          lastContact: apiItem.success ? formatRelativeNow() : recipient.lastContact,
          threadId: apiItem.threadId || recipient.threadId,
          replyToEmail: apiItem.replyToEmail || recipient.replyToEmail,
        };
      })
    );
  };

  const handleSendTemplateBulk = async () => {
    try {
      setSendingBulk(true);
      setApiError(null);
      setBannerMessage(null);

      if (pipelineSelectionMode) {
        const selectedPipelineIds = selectedRecipients.map((item) => item.id);

        if (!selectedPipelineIds.length) {
          setApiError("Please select at least one recipient.");
          return;
        }

        const response = await sendSelectedPipelineEmails({
          campaignId,
          pipelineIds: selectedPipelineIds,
        });

        markRecipientsFromSendResult(response?.data?.results || [], "pipelineId");
        await loadThreadsFromApi();

        setBannerMessage(
          `Template email sent. Sent: ${response.data.sent}, Failed: ${response.data.failed}.`
        );
        return;
      }

      if (!uploadedCsvFile) {
        setApiError("Please upload a CSV file first.");
        return;
      }

      const response = await sendBulkCsvEmail({
        file: uploadedCsvFile,
      });

      markRecipientsFromSendResult(response?.data?.results || [], "email");
      await loadThreadsFromApi();

      setBannerMessage(
        `Bulk email finished. Sent: ${response.data.sent}, Failed: ${response.data.failed}.`
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

  const openComposeEditor = () => {
    const toList =
      selectedRecipients.length > 0
        ? selectedRecipients.map((item) => item.email).join(", ")
        : "";

    setEditorMode("compose");
    setEditorPayload({
      toLabel: toList,
      subject: "",
      initialBody: "",
      toAvatar: "",
    });
    setEditorOpen(true);
  };

  const openReplyEditor = () => {
    if (!selectedThread) return;

    setEditorMode("reply");
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
      setBannerMessage(null);

      if (editorMode === "reply") {
        if (!selectedThread) throw new Error("No thread selected");

        await replyToEmailThread({
          threadId: selectedThread.id,
          subject: payload.subject,
          text: payload.body,
          html: payload.htmlBody,
          cc: payload.cc,
          bcc: payload.bcc,
        });

        await loadThreadsFromApi();
        await loadThreadMessagesFromApi(selectedThread.id);

        setBannerMessage(
          "Reply sent successfully. Future replies will continue in the same thread."
        );
      } else {
        const response = await composeAdminEmail({
          to: splitEmailList(payload.to),
          cc: splitEmailList(payload.cc),
          bcc: splitEmailList(payload.bcc),
          subject: payload.subject,
          text: payload.body,
          html: payload.htmlBody,
        });

        markRecipientsFromSendResult(response?.data?.results || [], "email");
        await loadThreadsFromApi();

        const firstThreadId = response?.data?.results?.find(
          (item: any) => item.success && item.threadId
        )?.threadId;

        if (firstThreadId) {
          setSelectedThreadId(firstThreadId);
        }

        setBannerMessage(
          `Email sent successfully to ${response?.data?.sent || 0} recipient(s).`
        );
      }

      setEditorOpen(false);
    } catch (error: any) {
      setApiError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to send email"
      );
    } finally {
      setEditorSending(false);
    }
  };

  const handleSaveThread = async () => {
    if (!selectedThread) return;

    try {
      setSavingThread(true);
      setApiError(null);
      setBannerMessage(null);

      await updateEmailThread({
        threadId: selectedThread.id,
        subject: threadDraftSubject,
        status: threadDraftStatus,
      });

      await loadThreadsFromApi();
      await loadThreadMessagesFromApi(selectedThread.id);

      setBannerMessage("Thread updated successfully.");
    } catch (error: any) {
      setApiError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update thread"
      );
    } finally {
      setSavingThread(false);
    }
  };

  const threadHasUnsavedChanges =
    !!selectedThread &&
    (threadDraftSubject !== selectedThread.subject ||
      threadDraftStatus !== mapUiStatusToApi(selectedThread.status));

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
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[280px] shrink-0 rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur xl:flex xl:flex-col">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wide text-slate-900">
                  CollabGlam
                </div>
                <div className="text-xs text-slate-500">Admin Email Console</div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Logged in as
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {mailboxScope?.actor?.name || config.title}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {config.badge}
                {mailboxScope?.actor?.email ? ` · ${mailboxScope.actor.email}` : ""}
              </div>
              <div className="mt-3 text-xs leading-5 text-slate-500">
                {config.subtitle}
              </div>
              <div className="mt-2 text-xs leading-5 text-slate-500">
                {getScopeText(mailboxScope?.scope?.type)}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <SidebarItem icon={<Inbox className="h-4 w-4" />} label="Threads" active />
            <SidebarItem icon={<Users className="h-4 w-4" />} label="Recipients" />
            <SidebarItem icon={<Mail className="h-4 w-4" />} label="Email editor" />
            <SidebarItem
              icon={<MessageSquare className="h-4 w-4" />}
              label="Conversation"
            />
          </div>

          <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Clock3 className="h-4 w-4" />
              Live summary
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <MetricRow label="Recipients" value={String(totalRecipients)} />
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
                      Scope-based admin mail workflow
                    </div>
                    <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl xl:text-[2rem]">
                      Admin Outreach Console
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                      Super Admin can see everyone’s threads and conversation.
                      Revenue Head can see only its own plus BME and IME in its
                      tree. BME and IME can see only their own. All compose and
                      reply actions run through the email editor and backend RBAC.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:flex-col xl:items-end">
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur">
                      {loadingScope ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading mailbox scope...
                        </span>
                      ) : (
                        <>
                          <div className="font-semibold">{config.badge}</div>
                          <div className="text-white/75">
                            {getScopeText(mailboxScope?.scope?.type)}
                          </div>
                        </>
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
                  hint="CSV or pipeline recipients in the current workspace"
                />
                <StatCard
                  icon={<Send className="h-5 w-5" />}
                  label="Sent"
                  value={String(sentCount)}
                  hint="Recipients marked successful after send"
                />
                <StatCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  label="Replies received"
                  value={String(repliedCount)}
                  hint="Threads whose latest direction is inbound"
                />
                <StatCard
                  icon={<AlertTriangle className="h-5 w-5" />}
                  label="Failed or bounced"
                  value={String(failedCount)}
                  hint="Recipients marked failed by the backend"
                />
              </div>
            </section>

            <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.65fr)_360px]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                      Recipient workspace
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                      Upload a CSV or use selected pipeline rows. Then open the
                      Email Editor to write custom emails, or send the default
                      template in one click.
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
                      onClick={openComposeEditor}
                      disabled={
                        !mailboxScope?.scope?.canCompose ||
                        (!selectedRecipients.length && !recipients.length)
                      }
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Mail className="h-4 w-4" />
                      Open Email Editor
                    </button>

                    <button
                      onClick={handleSendTemplateBulk}
                      disabled={
                        sendingBulk ||
                        (pipelineSelectionMode
                          ? !selectedRecipients.length
                          : !uploadedCsvFile)
                      }
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sendingBulk ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {sendingBulk ? "Sending..." : "Send default template"}
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
                          Upload recipient CSV
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Accepted headers: name, email, company, niche, tags.
                        </p>
                      </div>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={pipelineSelectionMode}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {uploadingCsv ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {uploadingCsv ? "Reading..." : "Upload CSV"}
                      </button>
                    </div>

                    {pipelineSelectionMode ? (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                        Pipeline selection mode is active for this campaign. Recipients are coming from selected pipeline rows.
                      </div>
                    ) : uploadSummary ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <InfoCard title="File" value={uploadSummary.fileName} />
                        <InfoCard
                          title="Rows read"
                          value={String(uploadSummary.totalRows)}
                        />
                        <InfoCard
                          title="Imported"
                          value={String(uploadSummary.importedRows)}
                        />
                        <InfoCard
                          title="Skipped"
                          value={String(
                            uploadSummary.invalidRows + uploadSummary.duplicateRows
                          )}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                        No CSV uploaded yet.
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          Flow summary
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Compose mails in the editor, reply in-thread, and keep
                          routing through{" "}
                          <span className="font-semibold">{ADMIN_REPLY_DOMAIN}</span>.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <FeaturePill text="RBAC by backend" />
                      <FeaturePill text="Editable Email Editor" />
                      <FeaturePill text="Thread replies" />
                      <FeaturePill text="Thread editing" />
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                      <div className="font-semibold text-slate-900">
                        Active mailbox
                      </div>
                      <div className="mt-1">
                        {mailboxScope?.actor?.name || config.title}{" "}
                        <span className="font-medium">
                          &lt;
                          {mailboxScope?.actor?.proxyEmail ||
                            mailboxScope?.actor?.email ||
                            config.deskEmail}
                          &gt;
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={exportRecipients}
                        disabled={!recipients.length}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Export CSV
                      </button>

                      <button
                        onClick={clearRecipients}
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
                        Review recipients and choose who should receive email.
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
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        placeholder="Search recipients"
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-200/50"
                      />
                    </label>

                    <label className="relative block">
                      <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        value={recipientStatusFilter}
                        onChange={(e) => setRecipientStatusFilter(e.target.value)}
                        className="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/50"
                      >
                        <option>All</option>
                        <option>Ready</option>
                        <option>Sent</option>
                        <option>Replied</option>
                        <option>Bounced</option>
                        <option>Failed</option>
                      </select>
                    </label>
                  </div>

                  {!filteredRecipients.length ? (
                    <EmptyState
                      icon={<Users className="h-6 w-6" />}
                      title="No recipients available"
                      description="Upload a CSV or load pipeline recipients to populate this list."
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
                                    {recipient.company ||
                                      recipient.niche ||
                                      "Admin recipient"}
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

                                {recipient.tags.length > 0 ? (
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
                                ) : null}
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
                      Mailbox and workflow shortcuts.
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
                    subtitle="Load recipients into the current workspace"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={pipelineSelectionMode}
                  />
                  <QuickAction
                    icon={<Mail className="h-4 w-4" />}
                    title="Open email editor"
                    subtitle="Write fully editable mails for selected recipients"
                    onClick={openComposeEditor}
                    disabled={!mailboxScope?.scope?.canCompose || !recipients.length}
                  />
                  <QuickAction
                    icon={<Send className="h-4 w-4" />}
                    title="Send default template"
                    subtitle="Use backend bulk send with the default template"
                    onClick={handleSendTemplateBulk}
                    disabled={
                      sendingBulk ||
                      (pipelineSelectionMode
                        ? !selectedRecipients.length
                        : !uploadedCsvFile)
                    }
                  />
                  <QuickAction
                    icon={<Inbox className="h-4 w-4" />}
                    title="Refresh threads"
                    subtitle="Reload all visible admin threads"
                    onClick={loadThreadsFromApi}
                    disabled={loadingThreads}
                  />
                  <QuickAction
                    icon={<Trash2 className="h-4 w-4" />}
                    title="Clear recipients"
                    subtitle="Reset the current recipient workspace"
                    onClick={clearRecipients}
                    disabled={!recipients.length}
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Clock3 className="h-4 w-4" />
                    Activity summary
                  </div>
                  <div className="space-y-3 text-sm text-slate-600">
                    <MetricRow label="Recipients" value={String(totalRecipients)} />
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
                        Only the threads allowed by backend scope appear here.
                      </p>
                    </div>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      {loadingThreads ? "Loading..." : `${filteredThreads.length} threads`}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                    <label className="relative block">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={threadSearch}
                        onChange={(e) => setThreadSearch(e.target.value)}
                        placeholder="Search threads"
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-200/50"
                      />
                    </label>

                    <label className="relative block">
                      <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        value={threadStatusFilter}
                        onChange={(e) => setThreadStatusFilter(e.target.value)}
                        className="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/50"
                      >
                        <option>All</option>
                        <option>Waiting</option>
                        <option>Replied</option>
                        <option>Closed</option>
                        <option>Archived</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="max-h-[760px] overflow-y-auto p-3">
                  {!filteredThreads.length ? (
                    <div className="p-3">
                      <EmptyState
                        icon={<Inbox className="h-6 w-6" />}
                        title="No threads yet"
                        description="Threads appear after emails are sent or recipients reply."
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
                              <div className="truncate font-semibold text-slate-900">
                                {thread.recipientName}
                              </div>

                              <div className="mt-1 truncate text-sm text-slate-500">
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
                                  Mailbox:{" "}
                                  <span className="font-mono">
                                    {thread.senderEmail}
                                  </span>
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
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-1 text-xs font-medium",
                                  threadStatusPillClass[selectedThread.status]
                                )}
                              >
                                {selectedThread.status}
                              </span>
                              <span className="text-xs text-slate-500">
                                {selectedThread.lastMessageAt}
                              </span>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  <PencilLine className="h-3.5 w-3.5" />
                                  Subject
                                </label>
                                <input
                                  value={threadDraftSubject}
                                  onChange={(e) =>
                                    setThreadDraftSubject(e.target.value)
                                  }
                                  disabled={!mailboxScope?.scope?.canEditThread}
                                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-200/50 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                    Thread status
                                  </label>
                                  <select
                                    value={threadDraftStatus}
                                    onChange={(e) =>
                                      setThreadDraftStatus(
                                        e.target.value as ThreadStatusApi
                                      )
                                    }
                                    disabled={!mailboxScope?.scope?.canEditThread}
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-200/50 disabled:cursor-not-allowed disabled:bg-slate-50"
                                  >
                                    <option value="ACTIVE">Active</option>
                                    <option value="ARCHIVED">Archived</option>
                                    <option value="CLOSED">Closed</option>
                                  </select>
                                </div>

                                <div className="flex items-end">
                                  <button
                                    onClick={handleSaveThread}
                                    disabled={
                                      !mailboxScope?.scope?.canEditThread ||
                                      !threadHasUnsavedChanges ||
                                      savingThread
                                    }
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {savingThread ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <PencilLine className="h-4 w-4" />
                                    )}
                                    Save thread
                                  </button>
                                </div>
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

                        <div className="grid gap-2 text-xs text-slate-500 md:grid-cols-2">
                          <div>
                            Thread owner:{" "}
                            <span className="font-medium text-slate-700">
                              {selectedThread.ownerAdminName ||
                                selectedThread.ownerAdminEmail ||
                                "Admin"}
                            </span>
                          </div>

                          <div>
                            Recipient:{" "}
                            <span className="font-medium text-slate-700">
                              {selectedThread.recipientEmail}
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

                          {selectedThread.replyToEmail ? (
                            <div>
                              Reply address:{" "}
                              <span className="font-mono text-slate-700">
                                {selectedThread.replyToEmail}
                              </span>
                            </div>
                          ) : null}
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
                              className={cn(
                                "flex",
                                isExecutive ? "justify-end" : "justify-start"
                              )}
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
                          <h3 className="font-semibold text-slate-900">
                            Reply composer
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Continue the conversation inside the same thread with
                            fully editable email content.
                          </p>
                        </div>

                        <button
                          onClick={openReplyEditor}
                          disabled={!mailboxScope?.scope?.canReply}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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
                      description="Threads will appear here after emails are sent or replies come in."
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
              description="Upload a CSV or load pipeline recipients."
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
        fromName={mailboxScope?.actor?.name || config.title}
        fromEmail={
          mailboxScope?.actor?.proxyEmail ||
          mailboxScope?.actor?.email ||
          config.deskEmail
        }
        subject={editorPayload.subject}
        initialBody={editorPayload.initialBody}
        sending={editorSending}
        onSend={handleEditorSend}
        onSaveDraft={async (payload) => {
          localStorage.setItem(
            editorMode === "reply"
              ? "collabglam-admin-thread-reply-draft"
              : "collabglam-admin-compose-draft",
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