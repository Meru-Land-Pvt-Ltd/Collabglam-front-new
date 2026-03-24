"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/api";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/buttonComp";
import EmailEditor, { type EmailEditorAttachment } from "@/components/ui/EmailEditor";
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  CaretDown,
  ArrowClockwise,
  Archive,
  Star,
  Envelope,
  Check,
  PencilSimple,
} from "@phosphor-icons/react";

type FilterOption = {
  id: string;
  name: string;
};

type BrandContact = {
  id: string;
  influencerId: string | null;
  invitationId: string | null;
  name: string;
  displayAlias: string;
  threadId: string | null;
  lastMessageAt: string | null;
  lastMessageSnippet: string;
  flags: {
    invited: boolean;
    applied: boolean;
    conversation: boolean;
  };
};

type BrandContactsResponse = {
  brand: {
    brandId: string;
    name: string;
  };
  influencers: BrandContact[];
};

type CreateThreadResponse = {
  success: boolean;
  threadId: string;
  brandAliasEmail: string;
  influencerAliasEmail: string;
  brandDisplayAlias: string;
  influencerDisplayAlias: string;
  subject: string;
};

type BrandInboxThread = {
  threadId: string;
  subject: string;
  lastMessageAt: string | null;
  lastMessageDirection: string | null;
  lastMessageSnippet: string;
  influencer: {
    influencerId: string | null;
    name: string;
    aliasEmail: string;
  };
};

type BrandInboxResponse = {
  brand: {
    brandId: string;
    name: string;
  };
  threads: BrandInboxThread[];
};

function formatRelativeTime(dateString?: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} min ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} hr ago`;

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
  });
}

function getFallback(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function ContactAvatar({
  name,
  avatar,
}: {
  name: string;
  avatar?: string | null;
}) {
  return (
    <Avatar className="h-7 w-7 rounded-full border border-border/60">
      <AvatarImage src={avatar || ""} alt={name} />
      <AvatarFallback className="rounded-full bg-muted text-[10px] font-semibold text-foreground">
        {getFallback(name)}
      </AvatarFallback>
    </Avatar>
  );
}

function FilterPopover({
  label,
  options,
}: {
  label: string;
  options: FilterOption[];
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<FilterOption>(options[0]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-[32px] rounded-[0.5rem] px-3 inline-flex items-center gap-2 transition-colors",
            "text-[14px] font-medium text-[#1A1A1A]",
            open ? "bg-[#ECEEF2]" : "bg-transparent"
          )}
        >
          <span>{label}</span>
          <span className="text-muted-foreground">{selectedOption.name}</span>
          <CaretDown className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "w-[240px] rounded-[12px] border border-[#E6E6E6] bg-white p-2",
          "shadow-[0_7px_20px_0_rgba(25,33,61,0.04)]"
        )}
      >
        <Command>
          <div className="relative">
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <CommandInput
              placeholder="Search..."
              className="h-[40px] rounded-[10px] border border-[#E6E6E6] pl-9"
            />
          </div>

          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup className="mt-2">
            {options.map((option) => (
              <CommandItem
                key={option.id}
                value={option.name}
                onSelect={() => {
                  setSelectedOption(option);
                  setOpen(false);
                }}
                className="rounded-[10px]"
              >
                <span className="flex-1">{option.name}</span>
                {selectedOption.id === option.id ? <Check className="h-4 w-4" /> : null}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const readStatusOptions: FilterOption[] = [
  { id: "all", name: "All" },
  { id: "read", name: "Read" },
  { id: "unread", name: "Unread" },
  { id: "starred", name: "Starred" },
];

const collaborationStageOptions: FilterOption[] = [
  { id: "all", name: "All" },
  { id: "outreach", name: "Outreach" },
  { id: "negotiation", name: "Negotiation" },
  { id: "closed", name: "Closed" },
];

const recipientOptions: FilterOption[] = [
  { id: "all", name: "All" },
  { id: "creator", name: "Creator" },
];

const dateOptions: FilterOption[] = [
  { id: "all", name: "All" },
  { id: "today", name: "Today" },
  { id: "week", name: "This week" },
  { id: "month", name: "This month" },
];

const EMAIL_API_BASE = "/emails";

function getStoredBrandId(): string {
  if (typeof window === "undefined") return "";

  const directBrandId = localStorage.getItem("brandId");
  if (directBrandId) return directBrandId;

  const brandRaw = localStorage.getItem("brand");
  if (brandRaw) {
    try {
      const parsed = JSON.parse(brandRaw);
      return parsed?.brandId || parsed?._id || "";
    } catch { }
  }

  const userRaw = localStorage.getItem("user");
  if (userRaw) {
    try {
      const parsed = JSON.parse(userRaw);
      return parsed?.brandId || parsed?._id || "";
    } catch { }
  }

  return "";
}

function normalizeRecipientValue(value?: string | null) {
  const raw = (value || "").trim();

  // Handles formats like: John <john@mail.com>
  const angleMatch = raw.match(/<([^>]+)>/);
  const extracted = angleMatch?.[1] || raw;

  return extracted.trim().toLowerCase();
}

export default function BrandInboxPage() {
  const router = useRouter();

  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState("");
  const [threads, setThreads] = React.useState<BrandInboxThread[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const [brandId, setBrandId] = React.useState("");
  const [showCompose, setShowCompose] = React.useState(false);
  const [composeThread, setComposeThread] = React.useState<BrandInboxThread | null>(null);
  const [contacts, setContacts] = React.useState<BrandContact[]>([]);

  const fetchThreads = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const storedBrandId = getStoredBrandId();

      if (!storedBrandId) {
        setBrandId("");
        setError("Brand ID not found. Please sign in again.");
        setThreads([]);
        setContacts([]);
        return;
      }

      setBrandId(storedBrandId);

      const [threadsData, contactsData] = await Promise.all([
        get<BrandInboxResponse>(`${EMAIL_API_BASE}/threads/brand/${storedBrandId}`),
        get<BrandContactsResponse>(`${EMAIL_API_BASE}/brand/contacts?brandId=${storedBrandId}`),
      ]);

      setThreads(Array.isArray(threadsData?.threads) ? threadsData.threads : []);
      setContacts(Array.isArray(contactsData?.influencers) ? contactsData.influencers : []);
      setSelectedIds([]);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load inbox"
      );
      setThreads([]);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);


  const filteredThreads = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;

    return threads.filter((item) => {
      const influencerName = item.influencer?.name?.toLowerCase() || "";
      const influencerAlias = item.influencer?.aliasEmail?.toLowerCase() || "";
      const subject = item.subject?.toLowerCase() || "";
      const preview = item.lastMessageSnippet?.toLowerCase() || "";

      return (
        influencerName.includes(q) ||
        influencerAlias.includes(q) ||
        subject.includes(q) ||
        preview.includes(q)
      );
    });
  }, [threads, search]);

  const resolveRecipientFromTo = React.useCallback(
    (toValue: string) => {
      const normalizedTo = normalizeRecipientValue(toValue);

      if (composeThread?.influencer?.influencerId) {
        const selectedCandidates = [
          composeThread.influencer.aliasEmail,
          composeThread.influencer.name,
        ]
          .map((v) => normalizeRecipientValue(v))
          .filter(Boolean);

        if (!normalizedTo || selectedCandidates.includes(normalizedTo)) {
          return {
            influencerId: composeThread.influencer.influencerId,
            threadId: composeThread.threadId,
            name: composeThread.influencer.name,
            aliasEmail: composeThread.influencer.aliasEmail,
          };
        }
      }

      const matchedContact = contacts.find((item) => {
        if (!item.influencerId) return false;

        const candidates = [
          item.displayAlias,
          item.name,
        ]
          .map((v) => normalizeRecipientValue(v))
          .filter(Boolean);

        return candidates.includes(normalizedTo);
      });

      if (!matchedContact?.influencerId) return null;

      return {
        influencerId: matchedContact.influencerId,
        threadId: matchedContact.threadId,
        name: matchedContact.name,
        aliasEmail: matchedContact.displayAlias,
      };
    },
    [composeThread, contacts]
  );

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredThreads.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(filteredThreads.map((item) => item.threadId));
  };

  const openCompose = () => {
    setError("");

    const selectedThread =
      selectedIds.length > 0
        ? threads.find((item) => item.threadId === selectedIds[0]) || null
        : null;

    setComposeThread(selectedThread);
    setShowCompose(true);
  };

  const handleSendCompose = async (payload: {
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
    htmlBody: string;
    attachments: EmailEditorAttachment[];
  }) => {
    setSending(true);
    setError("");

    try {
      const recipient = resolveRecipientFromTo(payload.to);

      if (!recipient?.influencerId) {
        throw new Error(
          "Recipient not found. Please enter a creator name or alias email from your contacts."
        );
      }

      let threadId = recipient.threadId || composeThread?.threadId || null;

      // If there is no existing thread, create one first
      if (!threadId) {
        const threadRes = await post<CreateThreadResponse>(`${EMAIL_API_BASE}/threads`, {
          brandId,
          influencerId: recipient.influencerId,
          subject: payload.subject,
        });

        threadId = threadRes?.threadId || null;
      }

      // Then send the email
      await post(`${EMAIL_API_BASE}/brand-to-influencer`, {
        brandId,
        influencerId: recipient.influencerId,
        subject: payload.subject,
        body: payload.body,
        htmlBody: payload.htmlBody,
        cc: payload.cc,
        bcc: payload.bcc,
        attachments: payload.attachments,
      });

      setShowCompose(false);
      setComposeThread(null);
      await fetchThreads();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.message ||
        "Failed to send message"
      );
      throw err;
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-full flex-col rounded-[24px] border border-border/60 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1 md:gap-3">
            <FilterPopover label="Read Status" options={readStatusOptions} />
            <FilterPopover label="Collaboration Stage" options={collaborationStageOptions} />
            <FilterPopover label="Recipient" options={recipientOptions} />
            <FilterPopover label="Date" options={dateOptions} />
            <Badge
              variant="secondary"
              className="h-8 rounded-md bg-muted px-3 text-xs font-medium text-foreground"
            >
              Clear ×
            </Badge>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full min-w-[280px] sm:w-[320px] lg:w-[360px]">
              <MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1a1a1a]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creators or conversations"
                className="h-12 rounded-m border-border/70 bg-background pl-11 pr-4 shadow-none"
              />
            </div>

            <Button type="button" onClick={openCompose}>
              <PencilSimple className="mr-2 h-4 w-4" />
              Compose
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Checkbox
              checked={
                filteredThreads.length > 0 &&
                selectedIds.length === filteredThreads.length
              }
              onCheckedChange={toggleSelectAll}
            />
            <button className="rounded-md p-1.5 hover:bg-muted" aria-label="More selection options">
              <CaretDown className="h-4 w-4" />
            </button>
            <button
              className="rounded-md p-1.5 hover:bg-muted"
              aria-label="Refresh inbox"
              onClick={fetchThreads}
            >
              <ArrowClockwise className="h-4 w-4" />
            </button>
            <button className="rounded-md p-1.5 hover:bg-muted" aria-label="Archive inbox">
              <Archive className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {filteredThreads.length === 0
                ? "0 conversations"
                : `1-${filteredThreads.length} of ${filteredThreads.length}`}
            </span>
            <button className="rounded-md p-1.5 hover:bg-muted" aria-label="Previous page">
              <CaretLeft className="h-4 w-4" />
            </button>
            <button className="rounded-md p-1.5 hover:bg-muted" aria-label="Next page">
              <CaretRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-3 pb-4">
            {loading ? (
              <div className="px-4 py-10 text-sm text-muted-foreground">
                Loading conversations...
              </div>
            ) : error ? (
              <div className="px-4 py-10 text-sm text-red-500">{error}</div>
            ) : filteredThreads.length === 0 ? (
              <div className="px-4 py-10 text-sm text-muted-foreground">
                No conversations found.
              </div>
            ) : (
              filteredThreads.map((item) => {
                const checked = selectedIds.includes(item.threadId);

                return (
                  <div
                    key={item.threadId}
                    onClick={() => router.push(`/brand/inbox/${item.threadId}`)}
                    className={cn(
                      "cursor-pointer grid grid-cols-[24px_minmax(180px,1.1fr)_minmax(0,4fr)_minmax(120px,140px)] items-center gap-3 border-b border-[#D6D6D6] px-3 py-4 transition-colors hover:bg-[#EDEDED]"
                    )}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleSelected(item.threadId)}
                      />
                    </div>

                    <div className="flex min-w-0 items-center gap-3">
                      <ContactAvatar
                        name={item.influencer?.name || "Influencer"}
                        avatar={null}
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {item.influencer?.name || "Influencer"}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {item.influencer?.aliasEmail || ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-3">
                      <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-muted sm:flex">
                        <Envelope className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {item.lastMessageSnippet || item.subject || "No message preview"}
                      </p>
                    </div>

                    <div className="ml-auto flex items-center justify-end gap-4">
                      <button
                        type="button"
                        className="rounded-md p-1 hover:bg-muted"
                        aria-label="Star mail"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </button>

                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatRelativeTime(item.lastMessageAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <EmailEditor
        open={showCompose}
        onClose={() => {
          setShowCompose(false);
          setComposeThread(null);
        }}
        toLabel={composeThread?.influencer?.aliasEmail || composeThread?.influencer?.name || ""}
        subject=""
        initialBody=""
        sending={sending}
        onSend={handleSendCompose}
      />
    </div>
  );
}