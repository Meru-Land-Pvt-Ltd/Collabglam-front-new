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

type CampaignRef = {
  _id: string | null;
  title?: string;
  campaignType?: string;
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
  thread: {
    id: string;
    subject: string;
    lastMessageAt: string | null;
    lastMessageDirection: string | null;
    campaign?: CampaignRef | null;
    brand: {
      _id?: string | null;
      brandId?: string | null;
      name: string;
      aliasEmail: string;
      logoUrl?: string | null;
    };
    influencer: {
      _id?: string | null;
      influencerId?: string | null;
      name: string;
      aliasEmail: string;
    };
  };
  messages: ThreadMessage[];
};

const EMAIL_API_BASE = "/emails";

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
  if (parts.length === 0) return "B";
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

export default function InfluencerInboxMailDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const threadId = Array.isArray(params?.threadId)
    ? params.threadId[0]
    : typeof params?.threadId === "string"
    ? params.threadId
    : "";

  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState("");

  const [thread, setThread] = React.useState<ThreadMessagesResponse["thread"] | null>(null);
  const [messages, setMessages] = React.useState<ThreadMessage[]>([]);
  const [showReply, setShowReply] = React.useState(false);
  const [showCompose, setShowCompose] = React.useState(false);

  const currentCampaignId = React.useMemo(
    () => thread?.campaign?._id || searchParams.get("campaignId") || undefined,
    [thread, searchParams]
  );

  const fetchConversation = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!threadId) {
        setError("Thread ID missing from route.");
        setThread(null);
        setMessages([]);
        return;
      }

      const res = await get<ThreadMessagesResponse>(
        `${EMAIL_API_BASE}/messages/${threadId}`
      );

      if (!res?.thread) {
        setError("Conversation not found.");
        setThread(null);
        setMessages([]);
        return;
      }

      setThread(res.thread);
      setMessages(Array.isArray(res?.messages) ? res.messages : []);
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
    fetchConversation();
  }, [fetchConversation]);

  const replySubject = React.useMemo(() => {
    const raw = thread?.subject?.trim() || "Conversation";
    return /^re:/i.test(raw) ? raw : `Re: ${raw}`;
  }, [thread?.subject]);

  const brand = thread?.brand;

  const handleSendReply = async (payload: {
    subject: string;
    body: string;
    attachments: EmailEditorAttachment[];
  }) => {
    if (!threadId) {
      throw new Error("Thread ID missing.");
    }

    setSending(true);
    setError("");

    try {
      await post(`${EMAIL_API_BASE}/influencer-to-brand`, {
        threadId,
        subject: payload.subject,
        body: payload.body,
        attachments: payload.attachments,
      });

      setShowReply(false);
      await fetchConversation();
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
    if (!threadId) {
      throw new Error("Thread ID missing.");
    }

    setSending(true);
    setError("");

    try {
      await post(`${EMAIL_API_BASE}/influencer-to-brand`, {
        threadId,
        subject: payload.subject,
        body: payload.body,
        attachments: payload.attachments,
      });

      setShowCompose(false);
      await fetchConversation();
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
              onClick={() =>
                router.push(
                  `/influencer/inbox${
                    currentCampaignId
                      ? `?campaignId=${encodeURIComponent(currentCampaignId)}`
                      : ""
                  }`
                )
              }
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
                      <AvatarImage src={brand?.logoUrl || ""} alt={brand?.name || "Brand"} />
                      <AvatarFallback className="bg-[#111111] text-base font-semibold text-white">
                        {getFallback(brand?.name || "Brand")}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="text-[16px] font-semibold text-[#1B1B1B]">
                        {brand?.name || "Brand"}
                      </div>
                      <div className="mt-0.5 text-[13px] text-[#8A8A8A]">
                        {brand?.aliasEmail || ""}
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
                      const isInfluencer = message.direction === "influencer_to_brand";
                      const displayName = isInfluencer ? "You" : brand?.name || "Brand";
                      const displayAlias =
                        message.fromAliasEmail || message.fromProxyEmail || "";

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
                      toLabel={brand?.aliasEmail || brand?.name || "Brand"}
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
          toLabel={brand?.aliasEmail || brand?.name || "Brand"}
          subject=""
          initialBody=""
          sending={sending}
          onSend={handleSendCompose}
        />
      ) : null}
    </div>
  );
}