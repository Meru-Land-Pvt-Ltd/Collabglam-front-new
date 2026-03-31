"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  UserCircle2,
  Users,
} from "lucide-react";
import EmailEditor from "@/components/ui/EmailEditor";
import {
  type AdminRole,
  type AdminEmailMessageDto,
  type AdminEmailThreadDto,
  type PipelineRecipientDto,
  type BrandOutreachRecipientDto,
  type EmailTemplateDto,
  type MailboxViewFilter,
  type EmailAttachmentInput,
  type ProviderStatus,
  composeAdminEmail,
  createEmailTemplate,
  deleteEmailTemplateById,
  fetchBrandOutreachRecipients,
  fetchEmailTemplates,
  fetchEmailThreads,
  fetchMailboxScope,
  fetchPipelineRecipients,
  fetchThreadMessages,
  replyToEmailThread,
  updateEmailTemplateById,
  sendSelectedBrandOutreachEmails,
  sendSelectedPipelineEmails,
} from "./admin-email";

type RecipientStatus = "Ready" | "Sent" | "Replied" | "Bounced" | "Failed";
type EditorMode = "compose" | "reply";
type AppTab = "mails" | "templates";
type SelectionMode = "none" | "pipeline" | "brand";
type TeamRoleFilter = "ALL" | "IME" | "BME";

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
  filters?: {
    revenueHeads?: Array<{
      _id: string;
      name?: string;
      email?: string;
      proxyEmail?: string;
      role?: AdminRole | string;
    }>;
  };
};

type Recipient = {
  id: string;
  name: string;
  email: string;
  company?: string;
  niche?: string;
  status: RecipientStatus;
  lastContact?: string;
  threadId?: string;
  replyToEmail?: string;
};

type MessageAttachment = {
  id?: string;
  filename: string;
  contentType?: string | null;
  size?: number;
  s3Bucket?: string | null;
  s3Key?: string | null;
  downloadUrl?: string | null;
  url?: string | null;
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
  attachments: MessageAttachment[];
};

type Thread = {
  id: string;
  subject: string;
  recipientName: string;
  recipientEmail: string;
  role: AdminRole;
  status: ThreadStatusUi;
  lastMessageAt: string;
  lastMessageDirection?: "INBOUND" | "OUTBOUND";
  lastProviderStatus?: ProviderStatus | null;
  hasInboundEver?: boolean;
  replyToEmail?: string;
  senderEmail?: string;
  ownerAdminName?: string;
  ownerAdminEmail?: string;
  messages: Message[];
};

type UploadSummary = {
  fileName: string;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  invalidRows: number;
};


type MailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  visibility: "GLOBAL" | "TREE" | "PERSONAL";
  createdByRole?: AdminRole;
};

const ROLE_META: Record<
  AdminRole,
  {
    title: string;
    deskEmail: string;
  }
> = {
  super_admin: {
    title: "Super Admin",
    deskEmail: "admin@collabglam.cloud",
  },
  revenue_head: {
    title: "Revenue Head",
    deskEmail: "revenue@collabglam.cloud",
  },
  ime: {
    title: "IME",
    deskEmail: "ime@collabglam.cloud",
  },
  bme: {
    title: "BME",
    deskEmail: "bme@collabglam.cloud",
  },
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

  if (!lines.length) {
    return { headers: [], rows: [] as string[][] };
  }

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
  const header = ["name", "email", "company", "niche", "status", "replyToEmail"];

  const lines = recipients.map((item) =>
    [
      item.name,
      item.email,
      item.company || "",
      item.niche || "",
      item.status,
      item.replyToEmail || "",
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

  if (!exec || typeof exec === "string") {
    return {
      ownerAdminName: "",
      ownerAdminEmail: "",
    };
  }

  return {
    ownerAdminName: exec.name || "",
    ownerAdminEmail: exec.email || "",
  };
}

function getRoleMeta(role?: string) {
  if (role && role in ROLE_META) {
    return ROLE_META[role as AdminRole];
  }

  return {
    title: "Admin",
    deskEmail: "admin@collabglam.cloud",
  };
}

function getScopeText(scope?: "ALL" | "TREE" | "SELF") {
  if (scope === "ALL") return "Can view all threads";
  if (scope === "TREE") return "Can view own + tree threads";
  return "Can view only own threads";
}

type ThreadStatusUi =
  | "QUEUED"
  | "SENT"
  | "DELIVERED"
  | "BOUNCED"
  | "COMPLAINED"
  | "FAILED"
  | "RECEIVED"
  | "REPLIED"
  | "CLOSED"
  | "ARCHIVED";

function mapThreadStatus(thread: AdminEmailThreadDto): ThreadStatusUi {
  if (thread.status === "CLOSED") return "CLOSED";
  if (thread.status === "ARCHIVED") return "ARCHIVED";

  if (thread.lastProviderStatus) {
    return thread.lastProviderStatus;
  }

  if (thread.hasInboundEver) {
    return "REPLIED";
  }

  return "QUEUED";
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
    lastMessageAt: formatDateTime(thread.lastMessageAt),
    lastMessageDirection: thread.lastMessageDirection,
    lastProviderStatus: thread.lastProviderStatus || null,
    hasInboundEver: !!thread.hasInboundEver,
    replyToEmail: thread.replyToEmail,
    senderEmail: thread.senderEmail,
    ownerAdminName: owner.ownerAdminName,
    ownerAdminEmail: owner.ownerAdminEmail,
    messages: [],
  };
}

function mapBackendMessageToUi(
  msg: AdminEmailMessageDto,
  thread: Thread | null
): Message {
  const body = msg.textPreview || stripHtml(msg.htmlPreview) || "";

const attachments = Array.isArray(msg.attachments)
  ? msg.attachments.map((item) => ({
      id: item._id,
      filename: item.filename || "attachment",
      contentType: item.contentType || null,
      size: item.size || 0,
      s3Bucket: item.s3Bucket || null,
      s3Key: item.s3Key || null,
      downloadUrl: item.downloadUrl || null,
      url: (item as any).url || null,
    }))
  : [];

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
    attachments,
  };
}

function mapBackendTemplateToUi(item: EmailTemplateDto): MailTemplate {
  return {
    id: item._id,
    name: item.name,
    subject: item.subject || "",
    body: item.body || "",
    visibility: item.visibility,
    createdByRole: item.createdByRole,
  };
}

function mapPipelineRecipientToUi(item: PipelineRecipientDto): Recipient {
  return {
    id: item.pipelineId,
    name: item.name || item.email,
    email: item.email,
    company: item.company,
    niche: Array.isArray(item.niche) ? item.niche.join(", ") : undefined,
    status: item.threadId ? "Sent" : "Ready",
    threadId: item.threadId || undefined,
    replyToEmail: item.replyToEmail || undefined,
  };
}

function mapBrandRecipientToUi(item: BrandOutreachRecipientDto): Recipient {
  return {
    id: item.brandOutreachId,
    name: item.name || item.email,
    email: item.email,
    company: item.website,
    niche: undefined,
    status: item.threadId ? "Sent" : "Ready",
    threadId: item.threadId || undefined,
    replyToEmail: item.replyToEmail || undefined,
  };
}

export default function Page() {
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const mode = searchParams.get("mode") === "brand" ? "brand" : "pipeline";
  const campaignId = searchParams.get("campaignId") || "";

  const pipelineIds = useMemo(() => {
    const raw = searchParams.get("pipelineIds") || "";
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [searchParams]);

  const brandOutreachIds = useMemo(() => {
    const raw = searchParams.get("brandOutreachIds") || "";
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [searchParams]);

  const pipelineIdsKey = pipelineIds.join(",");
  const brandOutreachIdsKey = brandOutreachIds.join(",");

  const selectionMode: SelectionMode = useMemo(() => {
    if (mode === "brand" && brandOutreachIds.length > 0) return "brand";
    if (campaignId && pipelineIds.length > 0) return "pipeline";
    return "none";
  }, [mode, campaignId, pipelineIds.length, brandOutreachIds.length]);

  const [activeTab, setActiveTab] = useState<AppTab>("mails");
  const [mailboxScope, setMailboxScope] = useState<MailboxScopeData | null>(null);
  const [loadingScope, setLoadingScope] = useState(true);

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const [recipientSearch, setRecipientSearch] = useState("");
  const [threadSearch, setThreadSearch] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");

  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const [mailboxView, setMailboxView] = useState<MailboxViewFilter>("ALL");
  const [teamRoleFilter, setTeamRoleFilter] = useState<TeamRoleFilter>("ALL");
  const [selectedRevenueHeadId, setSelectedRevenueHeadId] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("compose");
  const [editorSending, setEditorSending] = useState(false);
  const [editorPayload, setEditorPayload] = useState({
    toLabel: "",
    subject: "",
    initialBody: "",
    toAvatar: "",
  });

  const [apiError, setApiError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [templateFormSaving, setTemplateFormSaving] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    id: "",
    name: "",
    subject: "",
    body: "",
  });

  const actorRole = mailboxScope?.actor?.role as AdminRole | undefined;
  const config = getRoleMeta(actorRole);

  const filteredThreads = useMemo(() => {
    const q = threadSearch.trim().toLowerCase();

    return threads.filter((thread) => {
      if (!q) return true;
      return (
        thread.subject.toLowerCase().includes(q) ||
        thread.recipientName.toLowerCase().includes(q) ||
        thread.recipientEmail.toLowerCase().includes(q) ||
        (thread.ownerAdminName || "").toLowerCase().includes(q) ||
        (thread.ownerAdminEmail || "").toLowerCase().includes(q)
      );
    });
  }, [threads, threadSearch]);

  const filteredRecipients = useMemo(() => {
    const q = recipientSearch.trim().toLowerCase();

    return recipients.filter((item) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        (item.company || "").toLowerCase().includes(q) ||
        (item.niche || "").toLowerCase().includes(q)
      );
    });
  }, [recipients, recipientSearch]);

  const filteredTemplates = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();

    return templates.filter((item) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.visibility.toLowerCase().includes(q)
      );
    });
  }, [templates, templateSearch]);

  const selectedThread =
    threads.find((item) => item.id === selectedThreadId) || threads[0] || null;

  const selectedTemplate =
    templates.find((item) => item.id === selectedTemplateId) ||
    filteredTemplates[0] ||
    templates[0] ||
    null;

  const totalRecipients = recipients.length;
  const sentCount = recipients.filter((item) => item.status === "Sent").length;
  const replyCount = threads.filter((item) => item.hasInboundEver).length;
  const selectedCount = selectedRecipientIds.length;

  const allVisibleRecipientsSelected =
    filteredRecipients.length > 0 &&
    filteredRecipients.every((item) => selectedRecipientIds.includes(item.id));

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
        mailboxView,
        teamRole:
          actorRole === "super_admin" || actorRole === "revenue_head"
            ? teamRoleFilter
            : "ALL",
        revenueHeadId:
          actorRole === "super_admin" ? selectedRevenueHeadId : undefined,
      });

      const mappedThreads = (response?.data?.items || []).map(mapBackendThreadToUi);
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

  const loadSelectionRecipients = async () => {
    if (selectionMode === "none") return;

    try {
      setLoadingRecipients(true);
      setApiError(null);

      if (selectionMode === "pipeline") {
        const response = await fetchPipelineRecipients({
          campaignId,
          pipelineIds,
        });

        const mappedRecipients: Recipient[] = (response?.data?.items || []).map(
          (item: PipelineRecipientDto) => mapPipelineRecipientToUi(item)
        );

        setRecipients(mappedRecipients);
        setSelectedRecipientIds(mappedRecipients.map((item) => item.id));
        return;
      }

      const response = await fetchBrandOutreachRecipients({
        brandOutreachIds,
      });

      const mappedRecipients: Recipient[] = (response?.data?.items || []).map(
        (item: BrandOutreachRecipientDto) => mapBrandRecipientToUi(item)
      );

      setRecipients(mappedRecipients);
      setSelectedRecipientIds(mappedRecipients.map((item) => item.id));
    } catch (error: any) {
      setApiError(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load selected recipients"
      );
    } finally {
      setLoadingRecipients(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      setApiError(null);

      const response = await fetchEmailTemplates();
      const items = (response?.data?.items || []).map(mapBackendTemplateToUi);

      setTemplates(items);
      setSelectedTemplateId((prev) => {
        if (prev && items.some((item) => item.id === prev)) return prev;
        return items[0]?.id || "";
      });
    } catch (error: any) {
      setApiError(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load templates"
      );
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    void loadMailboxScope();
  }, []);

  useEffect(() => {
    if (!mailboxScope) return;
    void loadThreadsFromApi();
  }, [mailboxScope, mailboxView, teamRoleFilter, selectedRevenueHeadId]);

  useEffect(() => {
    if (!mailboxScope) return;

    void loadTemplates();

    if (selectionMode !== "none") {
      void loadSelectionRecipients();
    }
  }, [mailboxScope, selectionMode, campaignId, pipelineIdsKey, brandOutreachIdsKey]);

  useEffect(() => {
    if (selectedThreadId) {
      void loadThreadMessagesFromApi(selectedThreadId);
    }
  }, [selectedThreadId]);

  useEffect(() => {
    if (!selectedThreadId && filteredThreads.length) {
      setSelectedThreadId(filteredThreads[0].id);
    }
  }, [filteredThreads, selectedThreadId]);

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAllVisibleRecipients = () => {
    const visibleIds = filteredRecipients.map((item) => item.id);

    setSelectedRecipientIds((prev) => {
      if (allVisibleRecipientsSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...prev, ...visibleIds]));
    });
  };

  const handleCsvUpload = async (file: File) => {
    const text = await file.text();
    const { headers, rows } = parseCsv(text);

    if (!headers.length) return;

    const headerMap = new Map(
      headers.map((header, index) => [normalizeHeader(header), index])
    );

    const existingEmails = new Set(recipients.map((item) => item.email.toLowerCase()));
    const nextRecipients: Recipient[] = [];

    let invalidRows = 0;
    let duplicateRows = 0;

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
  };

  const markRecipientsFromSendResult = (resultItems: Array<any>) => {
    const resultMap = new Map(
      resultItems.map((item) => [String(item.email || "").toLowerCase(), item])
    );

    setRecipients((prev) =>
      prev.map((recipient) => {
        const apiItem = resultMap.get(recipient.email.toLowerCase());
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

  const openComposeEditor = () => {
    const toList =
      selectedRecipientIds.length > 0
        ? recipients
          .filter((item) => selectedRecipientIds.includes(item.id))
          .map((item) => item.email)
          .join(", ")
        : "";

    setEditorMode("compose");
    setEditorPayload({
      toLabel: toList,
      subject: selectedTemplate?.subject || "",
      initialBody: selectedTemplate?.body || "",
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
        selectedTemplate?.body || "Hi,\n\nThanks for your reply.\n\nBest regards,",
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
    attachments: EmailAttachmentInput[];
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
          attachments: payload.attachments,
        });

        await loadThreadsFromApi();
        await loadThreadMessagesFromApi(selectedThread.id);
        setBannerMessage("Reply sent successfully.");
      } else {
        let response: any;

        if (selectionMode === "pipeline") {
          const selectedPipelineIds = recipients
            .filter((item) => selectedRecipientIds.includes(item.id))
            .map((item) => item.id);

          if (!selectedPipelineIds.length) {
            throw new Error("Please select at least one pipeline recipient.");
          }

          response = await sendSelectedPipelineEmails({
            campaignId,
            pipelineIds: selectedPipelineIds,
            subject: payload.subject,
            text: payload.body,
            html: payload.htmlBody,
            attachments: payload.attachments,
          });
        } else if (selectionMode === "brand") {
          const selectedBrandOutreachIds = recipients
            .filter((item) => selectedRecipientIds.includes(item.id))
            .map((item) => item.id);

          if (!selectedBrandOutreachIds.length) {
            throw new Error("Please select at least one brand outreach recipient.");
          }

          response = await sendSelectedBrandOutreachEmails({
            brandOutreachIds: selectedBrandOutreachIds,
            subject: payload.subject,
            text: payload.body,
            html: payload.htmlBody,
            attachments: payload.attachments,
          });
        } else {
          response = await composeAdminEmail({
            to: splitEmailList(payload.to),
            cc: splitEmailList(payload.cc),
            bcc: splitEmailList(payload.bcc),
            subject: payload.subject,
            text: payload.body,
            html: payload.htmlBody,
            attachments: payload.attachments,
          });
        }

        markRecipientsFromSendResult(response?.data?.results || []);
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

  const openNewTemplateForm = () => {
    setTemplateFormOpen(true);
    setTemplateForm({
      id: "",
      name: "",
      subject: "",
      body: "",
    });
  };

  const openEditTemplateForm = () => {
    if (!selectedTemplate) return;

    setTemplateFormOpen(true);
    setTemplateForm({
      id: selectedTemplate.id,
      name: selectedTemplate.name,
      subject: selectedTemplate.subject,
      body: selectedTemplate.body,
    });
  };

  const saveTemplate = async () => {
    try {
      setTemplateFormSaving(true);
      setApiError(null);

      if (!templateForm.name.trim()) {
        setApiError("Template name is required.");
        return;
      }

      if (templateForm.id) {
        await updateEmailTemplateById({
          templateId: templateForm.id,
          name: templateForm.name,
          subject: templateForm.subject,
          body: templateForm.body,
        });
        setBannerMessage("Template updated.");
      } else {
        await createEmailTemplate({
          name: templateForm.name,
          subject: templateForm.subject,
          body: templateForm.body,
        });
        setBannerMessage("Template created.");
      }

      setTemplateFormOpen(false);
      await loadTemplates();
    } catch (error: any) {
      setApiError(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save template"
      );
    } finally {
      setTemplateFormSaving(false);
    }
  };

  const deleteSelectedTemplate = async () => {
    try {
      if (!selectedTemplate) return;

      await deleteEmailTemplateById(selectedTemplate.id);
      setBannerMessage("Template deleted.");
      await loadTemplates();
    } catch (error: any) {
      setApiError(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete template"
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="mx-auto max-w-[1800px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <Sparkles className="h-3.5 w-3.5" />
                CollabGlam Admin Mail Console
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Manage conversations first, actions second
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Threads and active conversations stay front-and-center, while
                compose tools and recipients live in a focused side panel.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <TopToggle
                value={activeTab}
                onChange={setActiveTab}
                options={[
                  { value: "mails", label: "Mails", icon: <Mail className="h-4 w-4" /> },
                  {
                    value: "templates",
                    label: "Templates",
                    icon: <FileText className="h-4 w-4" />,
                  },
                ]}
              />

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                {loadingScope ? (
                  <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading scope...
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-slate-900">
                      {mailboxScope?.actor?.name || config.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {config.title} · {getScopeText(mailboxScope?.scope?.type)}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {apiError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {apiError}
          </div>
        ) : null}

        {bannerMessage ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {bannerMessage}
          </div>
        ) : null}

        {activeTab === "mails" ? (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={<Users className="h-4 w-4" />}
                label="Recipients"
                value={String(totalRecipients)}
                helper="Loaded recipients"
              />
              <MetricCard
                icon={<Send className="h-4 w-4" />}
                label="Sent"
                value={String(sentCount)}
                helper="Successful deliveries"
              />
              <MetricCard
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Replies"
                value={String(replyCount)}
                helper="Inbound responses"
              />
              <MetricCard
                icon={<Inbox className="h-4 w-4" />}
                label="Selected"
                value={String(selectedCount)}
                helper="Ready for compose"
              />
            </section>

            <section className="mt-6 grid gap-4 xl:h-[calc(100vh-260px)] xl:grid-cols-[340px_minmax(0,1fr)_340px]">
              <div className="flex h-full min-h-0 flex-col rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <PanelHeader
                  title="Threads"
                  subtitle="Primary inbox view"
                  actions={
                    <button
                      onClick={loadThreadsFromApi}
                      disabled={loadingThreads}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCcw
                        className={cn("h-4 w-4", loadingThreads && "animate-spin")}
                      />
                      Refresh
                    </button>
                  }
                />

                <div className="mt-4 space-y-3">
                  <select
                    value={mailboxView}
                    onChange={(e) => setMailboxView(e.target.value as MailboxViewFilter)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    <option value="ALL">All</option>
                    <option value="REPLIED">Replied (ever)</option>
                    <option value="QUEUED">Queued</option>
                    <option value="SENT">Sent</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="BOUNCED">Bounced</option>
                    <option value="COMPLAINED">Complained</option>
                    <option value="FAILED">Failed</option>
                    <option value="RECEIVED">Received</option>
                  </select>

                  {actorRole === "super_admin" ? (
                    <select
                      value={selectedRevenueHeadId}
                      onChange={(e) => setSelectedRevenueHeadId(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    >
                      <option value="">All Revenue Heads</option>
                      {(mailboxScope?.filters?.revenueHeads || []).map((rh) => (
                        <option key={rh._id} value={rh._id}>
                          {rh.name || rh.email || rh._id}
                        </option>
                      ))}
                    </select>
                  ) : null}

                  {(actorRole === "super_admin" || actorRole === "revenue_head") ? (
                    <TopToggle
                      value={teamRoleFilter}
                      onChange={(value) => setTeamRoleFilter(value as TeamRoleFilter)}
                      options={[
                        { value: "ALL", label: "All" },
                        { value: "IME", label: "IME" },
                        { value: "BME", label: "BME" },
                      ]}
                    />
                  ) : null}

                  <SearchField
                    value={threadSearch}
                    onChange={setThreadSearch}
                    placeholder="Search threads, recipient, subject..."
                  />
                </div>

                <div className="mt-4 flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
                  {filteredThreads.length ? (
                    filteredThreads.map((thread) => (
                      <ThreadListItem
                        key={thread.id}
                        thread={thread}
                        active={selectedThread?.id === thread.id}
                        onClick={() => setSelectedThreadId(thread.id)}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={<Inbox className="h-5 w-5" />}
                      title="No threads found"
                      description="Sent conversations will appear here."
                    />
                  )}
                </div>
              </div>

              <div className="flex h-full min-h-0 flex-col rounded-[28px] border border-slate-200 bg-white shadow-sm">
                {selectedThread ? (
                  <>
                    <div className="border-b border-slate-200 px-5 py-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill label={selectedThread.status} />
                            <span className="text-xs text-slate-500">
                              Last update · {selectedThread.lastMessageAt}
                            </span>
                          </div>

                          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                            {selectedThread.subject}
                          </h2>

                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                            <span>{selectedThread.recipientEmail}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>
                              {selectedThread.ownerAdminName ||
                                selectedThread.ownerAdminEmail ||
                                "Admin"}
                            </span>
                            {selectedThread.senderEmail ? (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span>{selectedThread.senderEmail}</span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={openReplyEditor}
                            disabled={!mailboxScope?.scope?.canReply}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Send className="h-4 w-4" />
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
                      {loadingMessages ? (
                        <div className="flex h-full items-center justify-center text-slate-500">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading conversation...
                        </div>
                      ) : selectedThread.messages.length ? (
                        <div className="space-y-4">
                          {selectedThread.messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={<MessageSquare className="h-5 w-5" />}
                          title="No messages yet"
                          description="Once this thread has messages, the full conversation will appear here."
                        />
                      )}
                    </div>

                    <div className="border-t border-slate-200 px-5 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                          Conversation is prioritized here so replies are always visible before actions.
                        </p>
                        <button
                          onClick={openReplyEditor}
                          disabled={!mailboxScope?.scope?.canReply}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Mail className="h-4 w-4" />
                          Open Reply Editor
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center p-6">
                    <EmptyState
                      icon={<MessageSquare className="h-5 w-5" />}
                      title="Select a thread"
                      description="Choose a thread from the left to read the conversation."
                    />
                  </div>
                )}
              </div>

              <div className="h-full min-h-0 space-y-4 overflow-hidden">
                <div className="flex min-h-0 flex-col rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                  <PanelHeader
                    title="Compose tools"
                    subtitle="Templates, upload and send"
                  />

                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Active template
                      </label>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      >
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} · {template.visibility}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedTemplate ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-sm font-medium text-slate-900">
                          {selectedTemplate.name}
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {selectedTemplate.subject || "(no subject)"}
                        </div>
                      </div>
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={selectionMode !== "none"}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {uploadingCsv ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {uploadingCsv ? "Reading..." : "Upload CSV"}
                      </button>

                      <button
                        onClick={openComposeEditor}
                        disabled={!mailboxScope?.scope?.canCompose}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Mail className="h-4 w-4" />
                        Compose Mail
                      </button>
                    </div>

                    {uploadSummary ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        <div className="font-medium text-slate-900">{uploadSummary.fileName}</div>
                        <div className="mt-1 text-xs">
                          {uploadSummary.importedRows} imported · {uploadSummary.invalidRows} invalid · {uploadSummary.duplicateRows} duplicates
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex min-h-0 flex-col rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                  <PanelHeader
                    title="Recipients"
                    subtitle={
                      selectionMode === "brand"
                        ? "Selected brand outreach recipients"
                        : selectionMode === "pipeline"
                          ? "Selected pipeline recipients"
                          : "Selection panel"
                    }
                    actions={
                      <div className="flex gap-2">
                        <button
                          onClick={clearRecipients}
                          disabled={!recipients.length}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Clear
                        </button>
                      </div>
                    }
                  />

                  <div className="mt-4">
                    <SearchField
                      value={recipientSearch}
                      onChange={setRecipientSearch}
                      placeholder="Search recipients..."
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={allVisibleRecipientsSelected}
                        onChange={toggleAllVisibleRecipients}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Select all visible
                    </label>

                    <span className="text-xs text-slate-500">
                      {selectedRecipientIds.length} selected
                    </span>
                  </div>

                  <div className="mt-4 flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
                    {loadingRecipients ? (
                      <div className="flex items-center justify-center py-10 text-slate-500">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading recipients...
                      </div>
                    ) : filteredRecipients.length ? (
                      filteredRecipients.map((recipient) => (
                        <RecipientListItem
                          key={recipient.id}
                          recipient={recipient}
                          checked={selectedRecipientIds.includes(recipient.id)}
                          onClick={() => toggleRecipient(recipient.id)}
                        />
                      ))
                    ) : (
                      <EmptyState
                        icon={<Users className="h-5 w-5" />}
                        title="No recipients"
                        description="Upload a CSV or load selected recipients to start composing."
                      />
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {selectedCount} selected
                        </div>
                        <div className="text-xs text-slate-500">
                          These recipients will prefill compose.
                        </div>
                      </div>
                      <button
                        onClick={openComposeEditor}
                        disabled={!mailboxScope?.scope?.canCompose}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                        Use
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  <FileText className="h-3.5 w-3.5" />
                  Template library
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                  Templates
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Keep template management on a separate view so the inbox stays focused on active conversations.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={loadTemplates}
                  disabled={loadingTemplates}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCcw
                    className={cn("h-4 w-4", loadingTemplates && "animate-spin")}
                  />
                  Refresh
                </button>

                <button
                  onClick={openNewTemplateForm}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  New Template
                </button>

                <button
                  onClick={openEditTemplateForm}
                  disabled={!selectedTemplate}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Edit
                </button>

                <button
                  onClick={deleteSelectedTemplate}
                  disabled={!selectedTemplate}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-5">
              <SearchField
                value={templateSearch}
                onChange={setTemplateSearch}
                placeholder="Search templates by name, body, subject or visibility..."
              />
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3">
                {filteredTemplates.length ? (
                  <div className="max-h-[700px] space-y-2 overflow-y-auto pr-1">
                    {filteredTemplates.map((template) => {
                      const active = selectedTemplate?.id === template.id;

                      return (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplateId(template.id)}
                          className={cn(
                            "w-full rounded-2xl border bg-white p-4 text-left transition",
                            active
                              ? "border-slate-900 bg-slate-50"
                              : "border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-medium text-slate-900">
                                {template.name}
                              </div>
                              <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                                {template.visibility}
                              </div>
                            </div>
                            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          </div>
                          <div className="mt-2 truncate text-sm text-slate-500">
                            {template.subject || "(no subject)"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={<FileText className="h-5 w-5" />}
                    title="No templates"
                    description="Create a template to start using it in compose."
                  />
                )}
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                {templateFormOpen ? (
                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Template name
                      </label>
                      <input
                        value={templateForm.name}
                        onChange={(e) =>
                          setTemplateForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="For example: Initial creator outreach"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Subject
                      </label>
                      <input
                        value={templateForm.subject}
                        onChange={(e) =>
                          setTemplateForm((prev) => ({
                            ...prev,
                            subject: e.target.value,
                          }))
                        }
                        placeholder="Email subject"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Body
                      </label>
                      <textarea
                        value={templateForm.body}
                        onChange={(e) =>
                          setTemplateForm((prev) => ({
                            ...prev,
                            body: e.target.value,
                          }))
                        }
                        placeholder="Write your reusable template body..."
                        rows={14}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-slate-400"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={saveTemplate}
                        disabled={templateFormSaving}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {templateFormSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save Template
                      </button>

                      <button
                        onClick={() => setTemplateFormOpen(false)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : selectedTemplate ? (
                  <div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {selectedTemplate.visibility}
                        </div>
                        <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                          {selectedTemplate.name}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          Use this in compose or edit it here.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setEditorMode("compose");
                          setEditorPayload({
                            toLabel: "",
                            subject: selectedTemplate.subject,
                            initialBody: selectedTemplate.body,
                            toAvatar: "",
                          });
                          setEditorOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Mail className="h-4 w-4" />
                        Open in Editor
                      </button>
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Subject
                      </div>
                      <div className="mt-2 text-sm font-medium text-slate-900">
                        {selectedTemplate.subject || "(no subject)"}
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Body
                      </div>
                      <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {selectedTemplate.body || "(empty)"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={<FileText className="h-5 w-5" />}
                    title="No template selected"
                    description="Pick a template from the left side."
                  />
                )}
              </div>
            </div>
          </section>
        )}
      </div>

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

function TopToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{
    value: T;
    label: string;
    icon?: React.ReactNode;
  }>;
}) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="inline-flex rounded-xl bg-slate-100 p-2 text-slate-700">
        {icon}
      </div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-1 text-sm text-slate-500">{helper}</div>
    </div>
  );
}

function PanelHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-slate-400"
      />
    </div>
  );
}

function StatusPill({ label }: { label: string }) {
  const tone =
    label === "REPLIED"
      ? "bg-emerald-100 text-emerald-700"
      : label === "CLOSED"
        ? "bg-slate-200 text-slate-700"
        : label === "ARCHIVED"
          ? "bg-amber-100 text-amber-700"
          : label === "FAILED" || label === "BOUNCED" || label === "COMPLAINED"
            ? "bg-rose-100 text-rose-700"
            : label === "DELIVERED" || label === "SENT"
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-700";

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", tone)}>
      {label}
    </span>
  );
}

function ThreadListItem({
  thread,
  active,
  onClick,
}: {
  thread: Thread;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition",
        active
          ? "border-slate-900 bg-slate-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium text-slate-900">
            {thread.recipientName}
          </div>
          <div className="mt-1 truncate text-sm text-slate-500">
            {thread.subject}
          </div>
        </div>
        <StatusPill label={thread.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
        <span>{thread.ownerAdminName || thread.ownerAdminEmail || "Admin"}</span>
        <span>•</span>
        <span>{thread.lastMessageAt}</span>
      </div>
    </button>
  );
}

function RecipientListItem({
  recipient,
  checked,
  onClick,
}: {
  recipient: Recipient;
  checked?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border p-3 text-left transition",
        checked
          ? "border-slate-900 bg-slate-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      )}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={() => onClick?.()}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 h-4 w-4 rounded border-slate-300"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium text-slate-900">{recipient.name}</div>
              <div className="truncate text-sm text-slate-500">{recipient.email}</div>
              <div className="mt-1 truncate text-xs text-slate-500">
                {recipient.company || recipient.niche || "Recipient"}
              </div>
            </div>

            <div className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              {recipient.status}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function formatFileSize(bytes?: number) {
  const size = Number(bytes || 0);
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildAttachmentHref(attachment: {
  downloadUrl?: string | null;
  url?: string | null;
  s3Bucket?: string | null;
  s3Key?: string | null;
}) {
  if (attachment.downloadUrl) return attachment.downloadUrl;
  if (attachment.url) return attachment.url;

  // only works if bucket/object is publicly accessible
  if (attachment.s3Bucket && attachment.s3Key) {
    return `https://${attachment.s3Bucket}.s3.amazonaws.com/${attachment.s3Key
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  }

  return null;
}

function MessageBubble({ message }: { message: Message }) {
  const isExecutive = message.role === "executive";

  return (
    <div className={cn("flex", isExecutive ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-3xl px-4 py-3 shadow-sm",
          isExecutive
            ? "bg-slate-900 text-white"
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

        <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>

        {message.attachments?.length ? (
          <div className="mt-3 space-y-2">
            {message.attachments.map((attachment, index) => (
              <div
                key={attachment.id || `${attachment.filename}-${index}`}
                className={cn(
                  "rounded-2xl border px-3 py-2 text-sm",
                  isExecutive
                    ? "border-white/20 bg-white/10"
                    : "border-slate-200 bg-white"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {attachment.filename}
                    </div>
                    <div
                      className={cn(
                        "mt-0.5 text-xs",
                        isExecutive ? "text-white/70" : "text-slate-500"
                      )}
                    >
                      {attachment.contentType || "file"}
                      {attachment.size
                        ? ` • ${formatFileSize(attachment.size)}`
                        : ""}
                    </div>
                  </div>


{(() => {
  const fileHref = buildAttachmentHref(attachment);

  return fileHref ? (
    <div className="shrink-0 flex items-center gap-2">
      <a
        href={fileHref}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-medium transition",
          isExecutive
            ? "bg-white text-slate-900 hover:bg-slate-100"
            : "bg-slate-900 text-white hover:bg-slate-800"
        )}
      >
        View
      </a>

      <a
        href={fileHref}
        download={attachment.filename}
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-medium transition border",
          isExecutive
            ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
            : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
        )}
      >
        Download
      </a>
    </div>
  ) : (
    <span
      className={cn(
        "shrink-0 text-xs",
        isExecutive ? "text-white/70" : "text-slate-500"
      )}
    >
      Unavailable
    </span>
  );
})()}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
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
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <div className="mb-3 rounded-2xl bg-white p-3 text-slate-500">{icon}</div>
      <div className="font-semibold text-slate-900">{title}</div>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}