"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  FileSpreadsheet,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  PanelLeft,
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
  LayoutGrid,
  FileText,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import EmailEditor from "@/components/ui/EmailEditor";
import {
  type AdminRole,
  type AdminEmailMessageDto,
  type AdminEmailThreadDto,
  type PipelineRecipientDto,
  type EmailTemplateDto,
  composeAdminEmail,
  createEmailTemplate,
  deleteEmailTemplateById,
  fetchEmailTemplates,
  fetchEmailThreads,
  fetchMailboxScope,
  fetchPipelineRecipients,
  fetchThreadMessages,
  replyToEmailThread,
  updateEmailTemplateById,
  sendSelectedPipelineEmails,
} from "./admin-email";

type RecipientStatus = "Ready" | "Sent" | "Replied" | "Bounced" | "Failed";
type ThreadStatusUi = "Waiting" | "Replied" | "Closed" | "Archived";
type EditorMode = "compose" | "reply";
type PageTab = "outreach" | "templates";

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
  lastContact?: string;
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
  lastMessageAt: string;
  lastMessageDirection?: "INBOUND" | "OUTBOUND";
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

type EmailEditorAttachment = {
  filename: string;
  contentType: string;
  size: number;
  contentBase64: string;
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

  if (!exec) {
    return {
      ownerAdminName: "",
      ownerAdminEmail: "",
    };
  }

  if (typeof exec === "string") {
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
  if (scope === "ALL") return "Can view all threads.";
  if (scope === "TREE") return "Can view own + IME/BME in the same tree.";
  return "Can view only own threads.";
}

function mapThreadStatus(thread: AdminEmailThreadDto): ThreadStatusUi {
  if (thread.status === "CLOSED") return "Closed";
  if (thread.status === "ARCHIVED") return "Archived";
  if (thread.lastMessageDirection === "INBOUND") return "Replied";
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
    lastMessageAt: formatDateTime(thread.lastMessageAt),
    lastMessageDirection: thread.lastMessageDirection,
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

  const [activeTab, setActiveTab] = useState<PageTab>("outreach");

  const [mailboxScope, setMailboxScope] = useState<MailboxScopeData | null>(null);
  const [loadingScope, setLoadingScope] = useState(true);

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const [recipientSearch, setRecipientSearch] = useState("");
  const [threadSearch, setThreadSearch] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");

  const [uploadedCsvFile, setUploadedCsvFile] = useState<File | null>(null);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);

  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("reply");
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
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

  const filteredRecipients = useMemo(() => {
    const q = recipientSearch.toLowerCase();

    return recipients.filter((item) => {
      return (
        !recipientSearch ||
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.company?.toLowerCase().includes(q) ||
        item.niche?.toLowerCase().includes(q)
      );
    });
  }, [recipients, recipientSearch]);

  const filteredThreads = useMemo(() => {
    const q = threadSearch.toLowerCase();

    return threads.filter((thread) => {
      return (
        !threadSearch ||
        thread.subject.toLowerCase().includes(q) ||
        thread.recipientName.toLowerCase().includes(q) ||
        thread.recipientEmail.toLowerCase().includes(q) ||
        thread.ownerAdminName?.toLowerCase().includes(q) ||
        thread.ownerAdminEmail?.toLowerCase().includes(q)
      );
    });
  }, [threads, threadSearch]);

  const filteredTemplates = useMemo(() => {
    const q = templateSearch.toLowerCase();

    return templates.filter((item) => {
      return (
        !templateSearch ||
        item.name.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.visibility.toLowerCase().includes(q)
      );
    });
  }, [templates, templateSearch]);

  const selectedRecipients = recipients.filter((item) =>
    selectedRecipientIds.includes(item.id)
  );

  const selectedThread =
    filteredThreads.find((item) => item.id === selectedThreadId) ||
    threads.find((item) => item.id === selectedThreadId) ||
    filteredThreads[0] ||
    threads[0] ||
    null;

  const selectedTemplate =
    templates.find((item) => item.id === selectedTemplateId) ||
    filteredTemplates[0] ||
    templates[0] ||
    null;

  const totalRecipients = recipients.length;
  const sentCount = recipients.filter((item) => item.status === "Sent").length;
  const repliedCount = threads.filter(
    (item) => item.lastMessageDirection === "INBOUND"
  ).length;

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
    loadMailboxScope();
  }, []);

  useEffect(() => {
    if (!mailboxScope) return;

    loadThreadsFromApi();
    loadTemplates();

    if (pipelineSelectionMode) {
      loadPipelineRecipients();
    }
  }, [mailboxScope, pipelineSelectionMode, campaignId, pipelineIds.join(",")]);

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
      initialBody: selectedTemplate?.body || "Hi,\n\nThanks for your reply.\n\nBest regards,",
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
        setBannerMessage("Reply sent successfully.");
      } else {
        let response: any;

        if (pipelineSelectionMode) {
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
          });
        } else {
          response = await composeAdminEmail({
            to: splitEmailList(payload.to),
            cc: splitEmailList(payload.cc),
            bcc: splitEmailList(payload.bcc),
            subject: payload.subject,
            text: payload.body,
            html: payload.htmlBody,
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

      <div className="mx-auto flex max-w-full
       gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-900 p-2 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">CollabGlam</div>
              <div className="text-xs text-slate-500">Admin Mail Console</div>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-3">
            <div className="font-medium text-slate-900">
              {mailboxScope?.actor?.name || config.title}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {config.title}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {loadingScope ? "Loading scope..." : getScopeText(mailboxScope?.scope?.type)}
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <SidebarButton
              icon={<LayoutGrid className="h-4 w-4" />}
              label="Outreach"
              active={activeTab === "outreach"}
              onClick={() => setActiveTab("outreach")}
            />
            <SidebarButton
              icon={<FileText className="h-4 w-4" />}
              label="Templates"
              active={activeTab === "templates"}
              onClick={() => setActiveTab("templates")}
            />
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-4">
          {apiError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {apiError}
            </div>
          ) : null}

          {bannerMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {bannerMessage}
            </div>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  {activeTab === "templates" ? "Templates" : "Outreach"}
                </div>
                <h1 className="mt-3 text-2xl font-semibold text-slate-900">
                  {activeTab === "templates" ? "Templates" : "Admin Outreach"}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {activeTab === "templates"
                    ? "Create, update, and manage reusable email templates."
                    : "Select recipients, review threads, and send through Email Editor."}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {loadingScope ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading scope...
                  </span>
                ) : (
                  <>
                    <div className="font-semibold">
                      {mailboxScope?.actor?.name || config.title}
                    </div>
                    <div className="text-slate-500">
                      {config.title} · {getScopeText(mailboxScope?.scope?.type)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {activeTab === "outreach" ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <SimpleStat
                  icon={<Users className="h-4 w-4" />}
                  label="Recipients"
                  value={String(totalRecipients)}
                />
                <SimpleStat
                  icon={<Send className="h-4 w-4" />}
                  label="Sent"
                  value={String(sentCount)}
                />
                <SimpleStat
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Replies"
                  value={String(repliedCount)}
                />
              </div>
            ) : null}
          </section>

          {activeTab === "outreach" ? (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto_auto]">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={pipelineSelectionMode}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingCsv ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingCsv ? "Reading..." : "Upload CSV"}
                  </button>

                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none"
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} · {template.visibility}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={openComposeEditor}
                    disabled={
                      !mailboxScope?.scope?.canCompose ||
                      (!selectedRecipientIds.length && !recipients.length)
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Mail className="h-4 w-4" />
                    Open Email Editor
                  </button>

                  <button
                    onClick={loadThreadsFromApi}
                    disabled={loadingThreads}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCcw
                      className={cn("h-4 w-4", loadingThreads && "animate-spin")}
                    />
                    Refresh
                  </button>
                </div>

                {uploadSummary ? (
                  <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {uploadSummary.fileName} · {uploadSummary.importedRows} imported ·{" "}
                    {uploadSummary.invalidRows + uploadSummary.duplicateRows} skipped
                  </div>
                ) : null}
              </section>

              <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.3fr]">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Recipients</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={exportRecipients}
                        disabled={!recipients.length}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Export
                      </button>
                      <button
                        onClick={clearRecipients}
                        disabled={!recipients.length}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      placeholder="Search recipients"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none"
                    />
                  </div>

                  {!filteredRecipients.length ? (
                    <SimpleEmpty
                      icon={<Users className="h-5 w-5" />}
                      title="No recipients"
                      description="Upload CSV or load pipeline recipients."
                    />
                  ) : (
                    <div className="max-h-[540px] space-y-2 overflow-y-auto">
                      {filteredRecipients.map((recipient) => {
                        const checked = selectedRecipientIds.includes(recipient.id);

                        return (
                          <button
                            key={recipient.id}
                            onClick={() => toggleRecipient(recipient.id)}
                            className={cn(
                              "w-full rounded-xl border p-3 text-left transition",
                              checked
                                ? "border-slate-900 bg-slate-50"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate font-medium text-slate-900">
                                  {recipient.name}
                                </div>
                                <div className="truncate text-sm text-slate-500">
                                  {recipient.email}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {recipient.company || recipient.niche || "Recipient"}
                                </div>
                              </div>

                              <span className="text-xs font-medium text-slate-500">
                                {recipient.status}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Threads</h2>
                    <span className="text-sm text-slate-500">
                      {loadingThreads ? "Loading..." : `${filteredThreads.length}`}
                    </span>
                  </div>

                  <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={threadSearch}
                      onChange={(e) => setThreadSearch(e.target.value)}
                      placeholder="Search threads"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none"
                    />
                  </div>

                  {!filteredThreads.length ? (
                    <SimpleEmpty
                      icon={<Inbox className="h-5 w-5" />}
                      title="No threads"
                      description="Threads will show here after emails are sent."
                    />
                  ) : (
                    <div className="max-h-[540px] space-y-2 overflow-y-auto">
                      {filteredThreads.map((thread) => {
                        const active = selectedThread?.id === thread.id;

                        return (
                          <button
                            key={thread.id}
                            onClick={() => setSelectedThreadId(thread.id)}
                            className={cn(
                              "w-full rounded-xl border p-3 text-left transition",
                              active
                                ? "border-slate-900 bg-slate-50"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            )}
                          >
                            <div className="font-medium text-slate-900">
                              {thread.recipientName}
                            </div>
                            <div className="mt-1 truncate text-sm text-slate-500">
                              {thread.subject}
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                              {thread.ownerAdminName || thread.ownerAdminEmail || "Admin"} ·{" "}
                              {thread.lastMessageAt}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  {selectedThread ? (
                    <>
                      <div className="border-b border-slate-200 pb-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                          {selectedThread.subject}
                        </h2>
                        <div className="mt-1 text-sm text-slate-500">
                          {selectedThread.recipientEmail}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {selectedThread.ownerAdminName ||
                            selectedThread.ownerAdminEmail ||
                            "Admin"}
                          {selectedThread.senderEmail ? ` · ${selectedThread.senderEmail}` : ""}
                        </div>
                      </div>

                      <div className="max-h-[430px] space-y-3 overflow-y-auto py-4">
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
                                    "max-w-[90%] rounded-2xl px-4 py-3",
                                    isExecutive
                                      ? "bg-slate-900 text-white"
                                      : "border border-slate-200 bg-slate-50 text-slate-900"
                                  )}
                                >
                                  <div className="mb-2 flex items-center gap-2 text-xs opacity-80">
                                    <UserCircle2 className="h-3.5 w-3.5" />
                                    <span>{message.sender}</span>
                                    <span>•</span>
                                    <span>{message.time}</span>
                                  </div>
                                  <p className="whitespace-pre-wrap text-sm leading-6">
                                    {message.body}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <SimpleEmpty
                            icon={<MessageSquare className="h-5 w-5" />}
                            title="No messages"
                            description="This thread does not have messages yet."
                          />
                        )}
                      </div>

                      <div className="border-t border-slate-200 pt-4">
                        <button
                          onClick={openReplyEditor}
                          disabled={!mailboxScope?.scope?.canReply}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                          Open Reply Editor
                        </button>
                      </div>
                    </>
                  ) : (
                    <SimpleEmpty
                      icon={<MessageSquare className="h-5 w-5" />}
                      title="No thread selected"
                      description="Choose a thread to see the conversation."
                    />
                  )}
                </section>
              </div>
            </>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Templates</h2>
                  <p className="text-sm text-slate-500">
                    This page only shows template-related things.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={openNewTemplateForm}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    New Template
                  </button>

                  <button
                    onClick={openEditTemplateForm}
                    disabled={!selectedTemplate}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Edit
                  </button>

                  <button
                    onClick={async () => {
                      if (!selectedTemplate) return;
                      await deleteSelectedTemplate();
                    }}
                    disabled={!selectedTemplate}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="mb-4 flex gap-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Search templates"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none"
                  />
                </div>

                <button
                  onClick={loadTemplates}
                  disabled={loadingTemplates}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCcw
                    className={cn("h-4 w-4", loadingTemplates && "animate-spin")}
                  />
                  Refresh
                </button>
              </div>

              <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {!filteredTemplates.length ? (
                    <SimpleEmpty
                      icon={<FileText className="h-5 w-5" />}
                      title="No templates"
                      description="Create a template to start using it in Email Editor."
                    />
                  ) : (
                    <div className="max-h-[560px] space-y-2 overflow-y-auto">
                      {filteredTemplates.map((template) => {
                        const active = selectedTemplate?.id === template.id;

                        return (
                          <button
                            key={template.id}
                            onClick={() => setSelectedTemplateId(template.id)}
                            className={cn(
                              "w-full rounded-xl border bg-white p-3 text-left transition",
                              active
                                ? "border-slate-900 bg-slate-50"
                                : "border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            <div className="font-medium text-slate-900">
                              {template.name}
                            </div>
                            <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                              {template.visibility}
                            </div>
                            <div className="mt-2 truncate text-sm text-slate-500">
                              {template.subject || "(no subject)"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  {templateFormOpen ? (
                    <div className="grid gap-3">
                      <input
                        value={templateForm.name}
                        onChange={(e) =>
                          setTemplateForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Template name"
                        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                      />

                      <input
                        value={templateForm.subject}
                        onChange={(e) =>
                          setTemplateForm((prev) => ({
                            ...prev,
                            subject: e.target.value,
                          }))
                        }
                        placeholder="Subject"
                        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                      />

                      <textarea
                        value={templateForm.body}
                        onChange={(e) =>
                          setTemplateForm((prev) => ({
                            ...prev,
                            body: e.target.value,
                          }))
                        }
                        placeholder="Template body"
                        rows={10}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={saveTemplate}
                          disabled={templateFormSaving}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : selectedTemplate ? (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {selectedTemplate.name}
                          </h3>
                          <div className="mt-1 text-sm text-slate-500">
                            {selectedTemplate.visibility} template
                          </div>
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
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                        >
                          <Mail className="h-4 w-4" />
                          Open in Editor
                        </button>
                      </div>

                      <div className="mt-4 rounded-xl bg-slate-50 p-4">
                        <div className="text-sm font-medium text-slate-900">
                          Subject
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {selectedTemplate.subject || "(no subject)"}
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl bg-slate-50 p-4">
                        <div className="text-sm font-medium text-slate-900">
                          Body
                        </div>
                        <div className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                          {selectedTemplate.body || "(empty)"}
                        </div>
                      </div>
                    </>
                  ) : (
                    <SimpleEmpty
                      icon={<FileText className="h-5 w-5" />}
                      title="No template selected"
                      description="Choose a template from the left side."
                    />
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
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

function SidebarButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SimpleStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="mb-2 inline-flex rounded-lg bg-white p-2 text-slate-700">
        {icon}
      </div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function SimpleEmpty({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <div className="mb-3 rounded-xl bg-white p-3 text-slate-500">{icon}</div>
      <div className="font-semibold text-slate-900">{title}</div>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}