"use client";

import * as React from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { get, post } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/buttonComp";
import { cn } from "@/lib/utils";
import EmailEditor, { type EmailEditorAttachment } from "@/components/ui/EmailEditor";
import {
  ArrowLeft,
  Star,
  Clock,
  Bell,
  Archive,
  Trash,
  DotsThree,
  CaretLeft,
  CaretRight,
  Smiley,
  ArrowBendUpLeft,
  Paperclip,
} from "@phosphor-icons/react";

type BrandThread = {
  threadId: string;
  subject: string;
  lastMessageAt: string | null;
  lastMessageDirection: string | null;
  lastMessageSnippet: string;
  influencer: {
    _id?: string | null;
    influencerId: string | null;
    name: string;
    aliasEmail: string;
  };
};

type BrandThreadsResponse = {
  brand: {
    brandId: string;
    name: string;
  };
  threads: BrandThread[];
};

type ThreadMessage = {
  id: string;
  direction: "brand_to_influencer" | "influencer_to_brand" | "system";
  createdAt: string;
  sentAt?: string | null;
  receivedAt?: string | null;
  subject: string;
  textBody: string;
  htmlBody: string;
  fromAliasEmail: string;
  fromProxyEmail: string;
  toProxyEmail: string;
  attachments: {
    filename: string;
    contentType: string;
    size: number;
    storageKey?: string;
    url?: string;
  }[];
};

type ThreadMessagesResponse = {
  messages: ThreadMessage[];
};

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
    } catch {}
  }

  const userRaw = localStorage.getItem("user");
  if (userRaw) {
    try {
      const parsed = JSON.parse(userRaw);
      return parsed?.brandId || parsed?._id || "";
    } catch {}
  }

  return "";
}

function formatMailDate(dateString?: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);

  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getFallback(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "I";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function IconButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-[#707070] transition-colors hover:bg-[#F3F4F6] hover:text-[#111111]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default function BrandInboxMailDetailPage() {
  const router = useRouter();
const params = useParams();
const threadId =
  typeof params?.threadId === "string" ? params.threadId : "";

  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState("");

  const [brandId, setBrandId] = React.useState("");
  const [thread, setThread] = React.useState<BrandThread | null>(null);
  const [messages, setMessages] = React.useState<ThreadMessage[]>([]);
  const [showReply, setShowReply] = React.useState(false);
  const [showCompose, setShowCompose] = React.useState(false);
  const searchParams = useSearchParams();

  React.useEffect(() => {
  if (searchParams.get("compose") === "true" && thread) {
    setShowCompose(true);
  }
}, [searchParams, thread]); 

  React.useEffect(() => {
    console.log("params:", params);
    console.log("threadId:", threadId);
  }, [params, threadId]);

  const fetchThread = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const storedBrandId = getStoredBrandId();
      if (!storedBrandId) {
        setError("Your session has expired. Please log in again.");
        return;
      }

      if (!threadId) {
        setError("Thread ID missing from route.");
        return;
      }

      setBrandId(storedBrandId);

      const threadsRes = await get<BrandThreadsResponse>(
        `${EMAIL_API_BASE}/threads/brand/${storedBrandId}`
      );

      const foundThread =
        Array.isArray(threadsRes?.threads)
          ? threadsRes.threads.find((item) => item.threadId === threadId) || null
          : null;

      if (!foundThread) {
        setError("Conversation not found.");
        setThread(null);
        setMessages([]);
        return;
      }

      setThread(foundThread);

      const messagesRes = await get<ThreadMessagesResponse>(
        `${EMAIL_API_BASE}/messages/${threadId}`
      );

      setMessages(Array.isArray(messagesRes?.messages) ? messagesRes.messages : []);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load conversation"
      );
      setThread(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  React.useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  const replySubject = React.useMemo(() => {
    const raw = thread?.subject?.trim() || "Conversation";
    return /^re:/i.test(raw) ? raw : `Re: ${raw}`;
  }, [thread?.subject]);

  const influencerId =
    thread?.influencer?._id || thread?.influencer?.influencerId || "";

  const handleSendReply = async (payload: {
    subject: string;
    body: string;
    attachments: EmailEditorAttachment[];
  }) => {
    if (!influencerId) {
      throw new Error("Influencer ID missing for this conversation");
    }

    setSending(true);
    setError("");

    try {
      await post(`${EMAIL_API_BASE}/brand-to-influencer`, {
        brandId,
        influencerId,
        subject: payload.subject,
        body: payload.body,
        attachments: payload.attachments,
      });

      setShowReply(false);
      await fetchThread();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to send reply"
      );
      throw err;
    } finally {
      setSending(false);
    }
  };

  const handleSendCompose = async (payload: {
    subject: string;
    body: string;
    attachments: EmailEditorAttachment[];
  }) => {
    if (!influencerId) {
      throw new Error("Influencer ID missing for this conversation");
    }

    setSending(true);
    setError("");

    try {
      await post(`${EMAIL_API_BASE}/brand-to-influencer`, {
        brandId,
        influencerId,
        subject: payload.subject,
        body: payload.body,
        attachments: payload.attachments,
      });

      setShowCompose(false);
      await fetchThread();
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
    <div className="min-h-screen bg-[#F7F7F8] p-4 md:p-6">
      <div className="mx-auto min-h-[calc(100vh-2rem)] w-full max-w-full rounded-[24px] border border-[#E7E7E8] bg-white shadow-[0_8px_30px_rgba(17,24,39,0.04)]">
        <div className="flex items-center justify-between border-b border-[#EFEFEF] px-5 py-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push("/brand/inbox")}
              className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-medium text-[#7B7B7B] transition-colors hover:bg-[#F3F4F6] hover:text-[#111111]"
            >
              <ArrowLeft size={12} />
              Back
            </button>
            <IconButton aria-label="Star">
              <Star size={16} />
            </IconButton>
            <IconButton aria-label="Snooze">
              <Clock size={16} />
            </IconButton>
            <IconButton aria-label="Notifications">
              <Bell size={16} />
            </IconButton>
            <IconButton aria-label="Archive">
              <Archive size={16} />
            </IconButton>
            <IconButton aria-label="Delete">
              <Trash size={16} />
            </IconButton>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-[12px] text-[#A1A1A1]">
              <span>{messages.length === 0 ? "0" : `1-${messages.length}`}</span>
              <span>of</span>
              <span>{messages.length}</span>
              <IconButton aria-label="Previous">
                <CaretLeft size={14} />
              </IconButton>
              <IconButton aria-label="Next">
                <CaretRight size={14} />
              </IconButton>
            </div>

            <Button
              className="h-10 rounded-[12px] bg-[#111111] px-4 text-sm font-medium text-white hover:bg-black"
              onClick={() => setShowCompose(true)}
            >
              Compose
            </Button>
          </div>
        </div>

        <div className="px-6 py-6 md:px-8">
          <div className="mx-auto max-w-[1240px]">
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">
                Loading conversation...
              </div>
            ) : error ? (
              <div className="py-10 text-sm text-red-500">{error}</div>
            ) : !thread ? (
              <div className="py-10 text-sm text-muted-foreground">
                Conversation not found.
              </div>
            ) : (
              <>
                <h1 className="mb-5 text-[30px] font-semibold tracking-[-0.02em] text-[#111111]">
                  {thread.subject || "Conversation"}
                </h1>

                <div className="mb-7 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11 border border-[#ECECEC]">
                      <AvatarImage src="" alt={thread.influencer.name} />
                      <AvatarFallback className="bg-[#111111] text-base font-semibold text-white">
                        {getFallback(thread.influencer.name || "Influencer")}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="text-[16px] font-semibold text-[#1B1B1B]">
                        {thread.influencer.name || "Influencer"}
                      </div>
                      <div className="mt-0.5 text-[13px] text-[#8A8A8A]">
                        {thread.influencer.aliasEmail || ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1 text-[12px] text-[#A1A1A1]">
                    <span>{formatMailDate(thread.lastMessageAt)}</span>
                    <IconButton aria-label="Star thread" className="h-7 w-7">
                      <Star size={20} />
                    </IconButton>
                    <IconButton aria-label="More details" className="h-7 w-7">
                      <Smiley size={20} />
                    </IconButton>
                    <IconButton aria-label="More actions" className="h-7 w-7">
                      <DotsThree size={20} />
                    </IconButton>
                  </div>
                </div>

                <div className="max-w-[1120px] space-y-8 pl-[56px]">
                  {messages.length === 0 ? (
                    <p className="text-[13px] text-[#6B6B6B]">
                      No messages yet in this conversation.
                    </p>
                  ) : (
                    messages.map((message) => {
                      const isBrand = message.direction === "brand_to_influencer";
                      const displayName = isBrand ? "You" : thread.influencer.name || "Influencer";
                      const displayAlias = message.fromAliasEmail || message.fromProxyEmail || "";

                      return (
                        <div
                          key={message.id}
                          className="rounded-[14px] border border-[#ECECEC] bg-[#FCFCFC] px-5 py-4"
                        >
                          <div className="mb-3 flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-semibold text-[#111111]">
                                {displayName}
                              </div>
                              <div className="text-xs text-[#8A8A8A]">
                                {displayAlias}
                              </div>
                            </div>

                            <div className="text-xs text-[#A1A1A1]">
                              {formatMailDate(
                                message.sentAt ||
                                  message.receivedAt ||
                                  message.createdAt
                              )}
                            </div>
                          </div>

                          {message.subject ? (
                            <div className="mb-3 text-sm font-medium text-[#1E1E1E]">
                              {message.subject}
                            </div>
                          ) : null}

                          <div className="whitespace-pre-wrap text-[13px] leading-[1.7] text-[#3D3D3D]">
                            {message.textBody || "No message body"}
                          </div>

                          {message.attachments?.length ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {message.attachments.map((file, index) => (
                                <a
                                  key={`${message.id}-att-${index}`}
                                  href={file.url || "#"}
                                  target={file.url ? "_blank" : undefined}
                                  rel={file.url ? "noreferrer" : undefined}
                                  className="inline-flex items-center gap-2 rounded-full border border-[#D9D9D9] bg-white px-3 py-1.5 text-[11px] font-medium text-[#292929] transition-colors hover:bg-[#F7F7F8]"
                                >
                                  <Paperclip size={12} />
                                  <span className="max-w-[180px] truncate">
                                    {file.filename}
                                  </span>
                                </a>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}

                  {!showReply ? (
                    <Button
                      onClick={() => setShowReply(true)}
                      variant="outline"
                      className="h-10 rounded-[10px] border-[#2D2D2D] bg-white px-4 text-sm font-medium text-[#111111] hover:bg-[#F8F8F8]"
                    >
                      <ArrowBendUpLeft size={16} className="mr-2" />
                      Reply
                    </Button>
                  ) : (
                    <EmailEditor
                      open={showReply}
                      onClose={() => setShowReply(false)}
                      toLabel={thread.influencer.aliasEmail || thread.influencer.name}
                      subject={replySubject}
                      initialBody=""
                      sending={sending}
                      onSend={handleSendReply}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {thread ? (
        <EmailEditor
          open={showCompose}
          onClose={() => setShowCompose(false)}
          toLabel={thread.influencer.aliasEmail || thread.influencer.name}
          subject=""
          initialBody=""
          sending={sending}
          onSend={handleSendCompose}
        />
      ) : null}
    </div>
  );
}