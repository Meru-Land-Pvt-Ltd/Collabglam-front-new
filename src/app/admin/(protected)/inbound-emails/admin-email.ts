
import { get, post, postFormData } from "@/lib/api";

export type AdminRole = "super_admin" | "revenue_head" | "ime" | "bme";

export type AdminMini = {
  _id: string;
  name?: string;
  email?: string;
  proxyEmail?: string;
  role?: AdminRole | string;
  parentAdmin?: string | null;
  rootAdmin?: string | null;
};

export type MailboxScopeResponse = {
  success: boolean;
  data: {
    actor: AdminMini;
    scope: {
      type: "ALL" | "TREE" | "SELF";
      visibleAdminIds: string[] | null;
      canCompose: boolean;
      canReply: boolean;
      canEditThread: boolean;
    };
  };
};

export type AdminEmailThreadDto = {
  _id: string;
  executiveId: string | AdminMini;
  lastActorAdminId?: string | AdminMini | null;
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

export type ProviderStatus =
  | "QUEUED"
  | "SENT"
  | "DELIVERED"
  | "BOUNCED"
  | "COMPLAINED"
  | "FAILED"
  | "RECEIVED";

export type AdminEmailMessageDto = {
  _id: string;
  threadId: string;
  actorAdminId?: string | AdminMini | null;
  ownerAdminId?: string | AdminMini | null;
  direction: "INBOUND" | "OUTBOUND";
  subject: string;
  from?: string | null;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  providerStatus?: ProviderStatus;
  textPreview?: string | null;
  htmlPreview?: string | null;
  createdAt?: string;
};

export async function fetchMailboxScope() {
  return get<MailboxScopeResponse>("/admin-email/me");
}

export async function fetchEmailThreads(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  ownerAdminId?: string;
}) {
  return get<{ success: boolean; data: { page: number; limit: number; total: number; items: AdminEmailThreadDto[] } }>(
    "/admin-email/threads",
    params
  );
}

export async function fetchThreadMessages(threadId: string) {
  return get<{ success: boolean; data: { thread: AdminEmailThreadDto; messages: AdminEmailMessageDto[] } }>(
    `/admin-email/threads/${threadId}/messages`
  );
}

export async function replyToEmailThread(input: {
  threadId: string;
  subject?: string;
  text?: string;
  html?: string;
  cc?: string[] | string;
  bcc?: string[] | string;
}) {
  return post(`/admin-email/threads/${input.threadId}/reply`, input);
}

export async function updateEmailThread(input: {
  threadId: string;
  subject?: string;
  status?: "ACTIVE" | "ARCHIVED" | "CLOSED";
  ownerAdminId?: string;
}) {
  return post(`/admin-email/threads/${input.threadId}`, {
    subject: input.subject,
    status: input.status,
    ownerAdminId: input.ownerAdminId,
  });
}

export async function composeAdminEmail(input: {
  ownerAdminId?: string;
  to: string[] | string;
  cc?: string[] | string;
  bcc?: string[] | string;
  subject?: string;
  text?: string;
  html?: string;
}) {
  return post(`/admin-email/compose`, input);
}

export async function sendBulkCsvEmail(input: {
  file: File;
  subject?: string;
  text?: string;
  html?: string;
  ownerAdminId?: string;
}) {
  const formData = new FormData();
  formData.append("file", input.file);
  if (input.subject) formData.append("subject", input.subject);
  if (input.text) formData.append("text", input.text);
  if (input.html) formData.append("html", input.html);
  if (input.ownerAdminId) formData.append("ownerAdminId", input.ownerAdminId);
  return postFormData("/admin-email/bulk/csv", formData);
}

export async function fetchPipelineRecipients(input: {
  campaignId: string;
  pipelineIds: string[];
}) {
  return post<{ success: boolean; data: { items: any[] } }>(
    "/admin-email/pipeline/recipients",
    input
  );
}

export async function sendSelectedPipelineEmails(input: {
  campaignId: string;
  pipelineIds: string[];
  ownerAdminId?: string;
  subject?: string;
  text?: string;
  html?: string;
}) {
  return post(`/admin-email/pipeline/send-selected`, input);
}