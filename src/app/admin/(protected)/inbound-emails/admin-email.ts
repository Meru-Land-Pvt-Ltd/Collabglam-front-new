import { get, post, postFormData } from "@/lib/api";

export type AdminRole =
  | "super_admin"
  | "revenue_head"
  | "ime"
  | "bme";

export type ProviderStatus =
  | "QUEUED"
  | "SENT"
  | "DELIVERED"
  | "BOUNCED"
  | "COMPLAINED"
  | "FAILED"
  | "RECEIVED";

export type AdminMini = {
  _id: string;
  name?: string;
  email?: string;
  proxyEmail?: string;
  role?: AdminRole | string;
  parentAdmin?: string | null;
  rootAdmin?: string | null;  
};

export type AdminEmailThreadDto = {
  _id: string;
  executiveId: string | AdminMini;
  role: AdminRole;
  senderEmail: string;
  recipientEmail: string;
  replyToEmail: string;
  subject: string;
  lastMessageAt?: string;
  lastMessageDirection?: "INBOUND" | "OUTBOUND";
  status?: "ACTIVE" | "ARCHIVED" | "CLOSED";
  createdAt?: string;
  updatedAt?: string;
};

export type AdminEmailMessageDto = {
  _id: string;
  threadId: string;
  direction: "INBOUND" | "OUTBOUND";
  subject: string;
  from?: string | null;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  messageId?: string | null;
  inReplyTo?: string | null;
  references?: string[];
  provider?: "SES";
  providerStatus?: ProviderStatus;
  textPreview?: string | null;
  htmlPreview?: string | null;
  s3Bucket?: string | null;
  s3Key?: string | null;
  rawHeaders?: any;
  createdAt?: string;
  updatedAt?: string;
};

export type BulkCsvSendResponse = {
  success: boolean;
  message: string;
  data: {
    executiveId: string;
    from: string;
    role?: AdminRole;
    total: number;
    sent: number;
    failed: number;
    results: Array<{
      email: string;
      name?: string;
      threadId?: string;
      emailMessageId?: string;
      sesMessageId?: string | null;
      replyToEmail?: string;
      s3Key?: string | null;
      success: boolean;
      error?: string;
    }>;
  };
};

export type ThreadListResponse = {
  success: boolean;
  data: {
    page: number;
    limit: number;
    total: number;
    items: AdminEmailThreadDto[];
  };
};

export type ThreadMessagesResponse = {
  success: boolean;
  data: {
    thread: AdminEmailThreadDto;
    messages: AdminEmailMessageDto[];
  };
};

export type ReplyThreadResponse = {
  success: boolean;
  message: string;
  data: {
    threadId: string;
    emailMessageId: string;
    sesMessageId: string | null;
    s3Key?: string | null;
  };
};

export async function sendBulkCsvEmail(input: {
  file: File;
  subject?: string;
  text?: string;
  html?: string;
}) {
  const formData = new FormData();
  formData.append("file", input.file);

  if (input.subject) formData.append("subject", input.subject);
  if (input.text) formData.append("text", input.text);
  if (input.html) formData.append("html", input.html);

  return postFormData<BulkCsvSendResponse>("/admin-email/bulk/csv", formData);
}

export async function fetchEmailThreads(params?: {
  page?: number;
  limit?: number;
}) {
  return get<ThreadListResponse>("/admin-email/threads", params);
}

export async function fetchThreadMessages(threadId: string) {
  return get<ThreadMessagesResponse>(`/admin-email/threads/${threadId}/messages`);
}

export async function replyToEmailThread(input: {
  threadId: string;
  subject?: string;
  text?: string;
  html?: string;
}) {
  return post<ReplyThreadResponse>(
    `/admin-email/threads/${input.threadId}/reply`,
    {
      subject: input.subject,
      text: input.text,
      html: input.html,
    }
  );
}