"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Search,
  Send,
  Users,
  Building2,
  Mail,
  MessageSquare,
  ChevronRight,
  Filter,
  Clock3,
  Sparkles,
  Eye,
  UserCircle2,
  Inbox,
  Plus,
  PanelLeft,
  LayoutGrid,
  X,
  Upload,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import EmailEditor from "@/components/ui/EmailEditor";

type ExecutiveRole = "IME" | "BME";
type AudienceType = "Influencers" | "Brands";
type ThreadStatus = "Open" | "Replied" | "Waiting" | "Closed";
type RecipientStatus = "Active" | "Pending" | "Replied" | "Bounced";

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
};

type Message = {
  id: string;
  sender: string;
  email: string;
  role: "executive" | "recipient";
  body: string;
  time: string;
};

type Thread = {
  id: string;
  subject: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  audience: AudienceType;
  executive: ExecutiveRole;
  status: ThreadStatus;
  unread: number;
  lastMessageAt: string;
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

const roleConfig: Record<
  ExecutiveRole,
  {
    title: string;
    subtitle: string;
    audience: AudienceType;
    primaryMetric: string;
    deskEmail: string;
  }
> = {
  IME: {
    title: "Influencer Marketing Executive",
    subtitle:
      "Import creator CSV lists, build recipient segments, and send bulk outreach from one workspace.",
    audience: "Influencers",
    primaryMetric: "Influencer recipients",
    deskEmail: "ime@collabglam.com",
  },
  BME: {
    title: "Brand Marketing Executive",
    subtitle:
      "Import brand CSV lists, manage outreach groups, and send partnership emails in bulk.",
    audience: "Brands",
    primaryMetric: "Brand recipients",
    deskEmail: "bme@collabglam.com",
  },
};

const statusPillClass: Record<ThreadStatus | RecipientStatus, string> = {
  Open: "bg-slate-900 text-white border border-slate-900",
  Replied: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Waiting: "bg-amber-50 text-amber-700 border border-amber-200",
  Closed: "bg-slate-100 text-slate-600 border border-slate-200",
  Active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  Bounced: "bg-rose-50 text-rose-700 border border-rose-200",
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
  const header = ["name", "email", "company", "niche", "status", "tags"];
  const lines = recipients.map((item) =>
    [
      item.name,
      item.email,
      item.company || "",
      item.niche || "",
      item.status,
      item.tags.join(" | "),
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  );

  return [header.join(","), ...lines].join("\n");
}

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [role, setRole] = useState<ExecutiveRole>("IME");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSending, setEditorSending] = useState(false);
  const [editorMode, setEditorMode] = useState<"bulk" | "reply">("bulk");
  const [mobileRecipientsOpen, setMobileRecipientsOpen] = useState(false);
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);
  const [editorPayload, setEditorPayload] = useState({
    toLabel: "",
    subject: "",
    initialBody: "",
    toAvatar: "",
  });
  const [uploadSummary, setUploadSummary] = useState<Record<ExecutiveRole, UploadSummary | null>>({
    IME: null,
    BME: null,
  });
  const [recipientsByDesk, setRecipientsByDesk] = useState<Record<ExecutiveRole, Recipient[]>>({
    IME: [],
    BME: [],
  });
  const [threadsByDesk, setThreadsByDesk] = useState<Record<ExecutiveRole, Thread[]>>({
    IME: [],
    BME: [],
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
      return (
        !search ||
        thread.subject.toLowerCase().includes(q) ||
        thread.recipientName.toLowerCase().includes(q) ||
        thread.recipientEmail.toLowerCase().includes(q) ||
        thread.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [threads, search]);

  const selectedThread =
    filteredThreads.find((thread) => thread.id === selectedThreadId) ||
    filteredThreads[0] ||
    null;

  const selectedRecipients = recipients.filter((item) =>
    selectedRecipientIds.includes(item.id)
  );

  const totalRecipients = recipients.length;
  const repliedCount = recipients.filter((r) => r.status === "Replied").length;
  const pendingCount = recipients.filter((r) => r.status === "Pending").length;
  const unreadCount = threads.reduce((acc, t) => acc + t.unread, 0);
  const activeSelectionCount = selectedRecipients.length;
  const summary = uploadSummary[role];

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredRecipients.map((item) => item.id);
    const allVisibleSelected = visibleIds.every((id) => selectedRecipientIds.includes(id));

    if (allVisibleSelected) {
      setSelectedRecipientIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedRecipientIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleRoleChange = (item: ExecutiveRole) => {
    setRole(item);
    setSelectedRecipientIds([]);
    setSelectedThreadId(threadsByDesk[item][0]?.id ?? null);
    setSearch("");
    setStatusFilter("All");
  };

  const handleCsvUpload = async (file: File) => {
    const text = await file.text();
    const { headers, rows } = parseCsv(text);

    if (!headers.length) return;

    const headerMap = new Map(headers.map((header, index) => [normalizeHeader(header), index]));

    const nextRecipients: Recipient[] = [];
    let invalidRows = 0;
    let duplicateRows = 0;

    setRecipientsByDesk((prev) => {
      const existingEmails = new Set(prev[role].map((item) => item.email.toLowerCase()));

      for (const row of rows) {
        const email = extractCell(row, headerMap, ["email", "e mail", "mail"]).toLowerCase();
        const name = extractCell(row, headerMap, ["name", "full name", "fullname"]);
        const company = extractCell(row, headerMap, ["company", "brand", "organization", "organisation"]);
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
          status: "Active",
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
    await handleCsvUpload(file);
    event.target.value = "";
  };

  const clearRecipientsForRole = () => {
    setRecipientsByDesk((prev) => ({ ...prev, [role]: [] }));
    setThreadsByDesk((prev) => ({ ...prev, [role]: [] }));
    setUploadSummary((prev) => ({ ...prev, [role]: null }));
    setSelectedRecipientIds([]);
    setSelectedThreadId(null);
  };

  const exportRecipientsForRole = () => {
    if (!recipients.length) return;
    const blob = new Blob([recipientsToCsv(recipients)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${role.toLowerCase()}-recipients.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openBulkEditor = () => {
    const emailList = selectedRecipients.map((item) => item.email).join(", ");
    setEditorMode("bulk");
    setEditorPayload({
      toLabel: emailList,
      subject:
        role === "IME"
          ? "Creator collaboration opportunity from CollabGlam"
          : "Brand partnership opportunity from CollabGlam",
      initialBody:
        role === "IME"
          ? "Hi {{name}},\n\nWe would love to connect with you regarding an upcoming campaign collaboration. Sharing the brief and next steps below.\n\nRegards,\nTeam CollabGlam"
          : "Hi {{name}},\n\nWe would love to discuss how CollabGlam can support your upcoming influencer marketing requirements. Sharing more details below.\n\nRegards,\nTeam CollabGlam",
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
      initialBody: "Hi,\n\nThanks for your reply. Sharing the requested details below.\n\nBest,\nTeam CollabGlam",
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
    setEditorSending(true);

    const nowLabel = formatRelativeNow();

    if (editorMode === "bulk") {
      const targetIds = new Set(selectedRecipientIds);

      setRecipientsByDesk((prev) => ({
        ...prev,
        [role]: prev[role].map((item) =>
          targetIds.has(item.id)
            ? {
              ...item,
              status: "Pending",
              lastContact: nowLabel,
            }
            : item
        ),
      }));

      setThreadsByDesk((prev) => {
        const existing = prev[role];
        const next = [...existing];

        for (const recipient of selectedRecipients) {
          const existingIndex = next.findIndex((thread) => thread.recipientId === recipient.id);
          const sentMessage: Message = {
            id: makeId("message"),
            sender: role,
            email: config.deskEmail,
            role: "executive",
            body: payload.body,
            time: nowLabel,
          };

          if (existingIndex >= 0) {
            const current = next[existingIndex];
            next[existingIndex] = {
              ...current,
              subject: payload.subject,
              status: "Waiting",
              lastMessageAt: nowLabel,
              messages: [...current.messages, sentMessage],
            };
          } else {
            next.unshift({
              id: makeId("thread"),
              subject: payload.subject,
              recipientId: recipient.id,
              recipientName: recipient.name,
              recipientEmail: recipient.email,
              audience: config.audience,
              executive: role,
              status: "Waiting",
              unread: 0,
              lastMessageAt: nowLabel,
              tags: recipient.tags,
              messages: [sentMessage],
            });
          }
        }

        return {
          ...prev,
          [role]: next,
        };
      });

      if (!selectedThreadId && selectedRecipients[0]) {
        setTimeout(() => {
          setThreadsByDesk((current) => {
            const firstThread = current[role].find((item) => item.recipientId === selectedRecipients[0].id);
            if (firstThread) setSelectedThreadId(firstThread.id);
            return current;
          });
        }, 0);
      }

      setSelectedRecipientIds([]);
    } else if (selectedThread) {
      setThreadsByDesk((prev) => ({
        ...prev,
        [role]: prev[role].map((thread) =>
          thread.id === selectedThread.id
            ? {
              ...thread,
              status: "Waiting",
              lastMessageAt: nowLabel,
              messages: [
                ...thread.messages,
                {
                  id: makeId("message"),
                  sender: role,
                  email: config.deskEmail,
                  role: "executive",
                  body: payload.body,
                  time: nowLabel,
                },
              ],
            }
            : thread
        ),
      }));
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    setEditorSending(false);
    setEditorOpen(false);
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
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[260px] shrink-0 rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur xl:flex xl:flex-col">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wide text-slate-900">CollabGlam</div>
                <div className="text-xs text-slate-500">Outreach Command Center</div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Active desk
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{config.title}</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">{config.subtitle}</div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <SidebarItem icon={<LayoutGrid className="h-4 w-4" />} label="Overview" active />
            <SidebarItem icon={<Users className="h-4 w-4" />} label="Recipients" />
            <SidebarItem icon={<Inbox className="h-4 w-4" />} label="Threads" />
            <SidebarItem icon={<Mail className="h-4 w-4" />} label="Campaigns" />
            <SidebarItem icon={<Building2 className="h-4 w-4" />} label="Teams" />
          </div>

          <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Clock3 className="h-4 w-4" />
              Today’s pulse
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <MetricRow label="Imported recipients" value={String(totalRecipients)} />
              <MetricRow label="Open threads" value={String(threads.length)} />
              <MetricRow label="Selected to send" value={String(activeSelectionCount)} />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-5 py-5 text-white sm:px-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
                      <Sparkles className="h-3.5 w-3.5" />
                      CSV powered outreach workflow
                    </div>
                    <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl xl:text-[2rem]">
                      Admin Outreach Console
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                      Upload CSV files with recipient names and emails, review the imported list, select contacts, and send one shared email template in bulk.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:flex-col xl:items-end">
                    <div className="inline-flex rounded-2xl border border-white/10 bg-white/10 p-1 backdrop-blur">
                      {(["IME", "BME"] as ExecutiveRole[]).map((item) => {
                        const active = role === item;
                        return (
                          <button
                            key={item}
                            onClick={() => handleRoleChange(item)}
                            className={cn(
                              "rounded-xl px-4 py-2 text-sm font-medium transition",
                              active ? "bg-white text-slate-950 shadow-sm" : "text-slate-200 hover:bg-white/10"
                            )}
                          >
                            {item}
                          </button>
                        );
                      })}
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
                  label={config.primaryMetric}
                  value={String(totalRecipients)}
                  hint={`Recipients loaded for ${role}`}
                />
                <StatCard
                  icon={<Mail className="h-5 w-5" />}
                  label="Pending outreach"
                  value={String(pendingCount)}
                  hint="Recipients recently emailed"
                />
                <StatCard
                  icon={<MessageSquare className="h-5 w-5" />}
                  label="Replies received"
                  value={String(repliedCount)}
                  hint="Ready for API integration later"
                />
                <StatCard
                  icon={<Inbox className="h-5 w-5" />}
                  label="Open threads"
                  value={String(threads.length)}
                  hint="Local message history from sent emails"
                />
              </div>
            </section>

            <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.65fr)_360px]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                      CSV import and bulk email workspace
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                      Import a CSV with at least <span className="font-semibold text-slate-700">name</span> and <span className="font-semibold text-slate-700">email</span> columns. Optional columns like company, niche, and tags are also supported.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">{activeSelectionCount}</span> selected
                    </div>
                    <button
                      onClick={openBulkEditor}
                      disabled={selectedRecipients.length === 0}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      Open email editor
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
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">Upload recipient file</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Accepted headers: name, email, company, niche, tags.
                        </p>
                      </div>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
                      >
                        <Upload className="h-4 w-4" />
                        Upload CSV
                      </button>
                    </div>

                    {summary ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <InfoCard title="File" value={summary.fileName} />
                        <InfoCard title="Rows read" value={String(summary.totalRows)} />
                        <InfoCard title="Imported" value={String(summary.importedRows)} />
                        <InfoCard title="Skipped" value={String(summary.invalidRows + summary.duplicateRows)} />
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                        No CSV uploaded for {role} yet.
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">Current list actions</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Manage the current imported list before sending.
                        </p>
                      </div>
                      <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                        <Eye className="h-4 w-4" />
                        Preview
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <FeaturePill text="CSV based recipients" />
                      <FeaturePill text="Bulk template sending" />
                      <FeaturePill text="Shared email editor" />
                      <FeaturePill text="Local draft saving" />
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
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="mb-2 text-sm font-semibold text-slate-800">Selected recipients</div>
                      {selectedRecipients.length === 0 ? (
                        <div className="text-sm text-slate-500">No recipients selected yet.</div>
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
                      <p className="mt-1 text-sm text-slate-500">Search, filter, and manage imported recipients.</p>
                    </div>
                    <button
                      onClick={toggleSelectAllVisible}
                      disabled={!filteredRecipients.length}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      {filteredRecipients.length > 0 &&
                        filteredRecipients.every((item) => selectedRecipientIds.includes(item.id))
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
                        placeholder={`Search ${config.audience.toLowerCase()}`}
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
                        <option>Active</option>
                        <option>Pending</option>
                        <option>Replied</option>
                        <option>Bounced</option>
                      </select>
                    </label>
                  </div>

                  {!filteredRecipients.length ? (
                    <EmptyState
                      icon={<Users className="h-6 w-6" />}
                      title="No recipients available"
                      description="Upload a CSV to populate the recipient table for this desk."
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
                                    <div className="truncate font-semibold text-slate-900">{recipient.name}</div>
                                    <div className="truncate text-sm text-slate-500">{recipient.email}</div>
                                  </div>

                                  <span
                                    className={cn(
                                      "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium",
                                      statusPillClass[recipient.status]
                                    )}
                                  >
                                    {recipient.status}
                                  </span>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                  <span>{recipient.company || recipient.niche || config.audience.slice(0, -1)}</span>
                                  {recipient.lastContact ? (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span>{recipient.lastContact}</span>
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
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">Quick actions</h2>
                    <p className="mt-1 text-sm text-slate-500">Useful controls while preparing a send.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-500">
                    <Plus className="h-5 w-5" />
                  </div>
                </div>

                <div className="space-y-3">
                  <QuickAction
                    icon={<Upload className="h-4 w-4" />}
                    title="Import recipient CSV"
                    subtitle="Load recipients into the active desk"
                    onClick={() => fileInputRef.current?.click()}
                  />
                  <QuickAction
                    icon={<Send className="h-4 w-4" />}
                    title="Open bulk email editor"
                    subtitle="Use one shared template for all selected recipients"
                    onClick={openBulkEditor}
                    disabled={!selectedRecipients.length}
                  />
                  <QuickAction
                    icon={<FileSpreadsheet className="h-4 w-4" />}
                    title="Export current list"
                    subtitle="Download the imported recipients as CSV"
                    onClick={exportRecipientsForRole}
                    disabled={!recipients.length}
                  />
                  <QuickAction
                    icon={<Trash2 className="h-4 w-4" />}
                    title="Clear current desk"
                    subtitle="Reset imported recipients and local threads"
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
                    <MetricRow label="Sent threads" value={String(threads.length)} />
                    <MetricRow label="Pending recipients" value={String(pendingCount)} />
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
              <div className="hidden rounded-[28px] border border-slate-200 bg-white shadow-sm xl:block">
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">Threads</h2>
                      <p className="mt-1 text-sm text-slate-500">Local message history from sent emails</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      {filteredThreads.length} threads
                    </span>
                  </div>
                </div>

                <div className="max-h-[760px] overflow-y-auto p-3">
                  {!filteredThreads.length ? (
                    <div className="p-3">
                      <EmptyState
                        icon={<Inbox className="h-6 w-6" />}
                        title="No threads yet"
                        description="Threads will appear here after you send a bulk email or reply from the editor."
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
                                <div className="truncate font-semibold text-slate-900">{thread.recipientName}</div>
                                {thread.unread > 0 && (
                                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                                    {thread.unread}
                                  </span>
                                )}
                              </div>
                              <div className="truncate text-sm text-slate-500">{thread.subject}</div>
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className={cn("rounded-full px-2.5 py-1 font-medium", statusPillClass[thread.status])}>
                                  {thread.status}
                                </span>
                                <span>{thread.lastMessageAt}</span>
                              </div>
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
                            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{selectedThread.subject}</h2>
                            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", statusPillClass[selectedThread.status])}>
                              {selectedThread.status}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {selectedThread.recipientName} · {selectedThread.recipientEmail}
                          </p>
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
                      {selectedThread.messages.map((message) => {
                        const isExecutive = message.role === "executive";
                        return (
                          <div key={message.id} className={cn("flex", isExecutive ? "justify-end" : "justify-start")}>
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
                              </div>
                              <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-200 px-4 py-4 sm:px-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">Reply composer</h3>
                          <p className="mt-1 text-sm text-slate-500">Continue the conversation using the shared email editor.</p>
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
                      description="Send a bulk email first. Each recipient you send to will appear here as a local thread entry."
                    />
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      <MobileDrawer open={mobileRecipientsOpen} onClose={() => setMobileRecipientsOpen(false)} title="Recipients">
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
                      <div className="truncate font-semibold text-slate-900">{recipient.name}</div>
                      <div className="truncate text-sm text-slate-500">{recipient.email}</div>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", statusPillClass[recipient.status])}>
                      {recipient.status}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </MobileDrawer>

      <MobileDrawer open={mobileThreadsOpen} onClose={() => setMobileThreadsOpen(false)} title="Threads">
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
                    active ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"
                  )}
                >
                  <div className="font-semibold text-slate-900">{thread.recipientName}</div>
                  <div className="mt-1 truncate text-sm text-slate-500">{thread.subject}</div>
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
        fromName={role}
        fromEmail={config.deskEmail}
        subject={editorPayload.subject}
        initialBody={editorPayload.initialBody}
        sending={editorSending}
        onSend={handleEditorSend}
        onSaveDraft={async (payload) => {
          localStorage.setItem(
            editorMode === "bulk" ? "collabglam-bulk-mail-draft" : "collabglam-thread-reply-draft",
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
      <div className="mb-3 inline-flex rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm">{icon}</div>
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">{value}</div>
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
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">{text}</div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-medium text-slate-500">{title}</div>
      <div className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</div>
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
      <div className="mb-3 rounded-2xl bg-slate-100 p-3 text-slate-500">{icon}</div>
      <div className="text-base font-semibold text-slate-900">{title}</div>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">{description}</p>
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
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={onClose} />
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
        <div className="max-h-[calc(82vh-72px)] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
