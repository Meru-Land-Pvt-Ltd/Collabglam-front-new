import { get, post, postFormData } from "@/lib/api";

export type AdminRole = "super_admin" | "revenue_head" | "ime" | "bme";
export type ScopeType = "ALL" | "TREE" | "SELF";
export type ThreadStatus = "ACTIVE" | "ARCHIVED" | "CLOSED";
export type MessageDirection = "INBOUND" | "OUTBOUND";
export type MailboxViewFilter = "ALL" | "REPLIED" | ProviderStatus;
export type TeamRoleFilter = "ALL" | "REVENUE_HEAD" | "IME" | "BME";

export type ProviderStatus =
  | "QUEUED"
  | "SENT"
  | "DELIVERED"
  | "BOUNCED"
  | "COMPLAINED"
  | "FAILED"
  | "RECEIVED";

export type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type AdminMini = {
  _id: string;
  name?: string;
  email?: string;
  proxyEmail?: string;
  role?: AdminRole | string;
  parentAdmin?: string | null;
  rootAdmin?: string | null;
};

export type MailboxScope = {
  actor: AdminMini;
  scope: {
    type: ScopeType;
    visibleAdminIds: string[] | null;
    canCompose: boolean;
    canReply: boolean;
    canEditThread: boolean;
  };
  filters?: {
    revenueHeads?: AdminMini[];
  };
};

export type MailboxScopeResponse = ApiSuccess<MailboxScope>;

export type FetchThreadsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  ownerAdminId?: string;
  mailboxView?: MailboxViewFilter;
  teamRole?: TeamRoleFilter;
  revenueHeadId?: string;
};

export type AdminEmailThreadDto = {
  _id: string;
  subject: string;
  recipientEmail: string;
  role: AdminRole;
  senderEmail?: string;
  replyToEmail?: string;
  lastMessageAt?: string;
  lastMessageDirection?: "INBOUND" | "OUTBOUND";
  status: "ACTIVE" | "ARCHIVED" | "CLOSED";

  hasInboundEver?: boolean;
  lastProviderStatus?: ProviderStatus | null;

  executiveId?:
  | string
  | {
    _id: string;
    name?: string;
    email?: string;
    proxyEmail?: string;
    role?: AdminRole | string;
  };
};


export type AdminEmailMessageAttachmentDto = {
  _id?: string;
  filename?: string | null;
  contentType?: string | null;
  contentDisposition?: string | null;
  contentId?: string | null;
  transferEncoding?: string | null;
  size?: number;
  checksum?: string | null;
  related?: boolean;
  s3Bucket?: string | null;
  s3Key?: string | null;
  downloadUrl?: string | null;
};

export type AdminEmailMessageDto = {
  _id: string;
  threadId: string;
  actorAdminId?: string | AdminMini | null;
  ownerAdminId?: string | AdminMini | null;
  direction: MessageDirection;
  subject: string;
  from?: string | null;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  providerStatus?: ProviderStatus;
  textPreview?: string | null;
  htmlPreview?: string | null;
  attachments?: AdminEmailMessageAttachmentDto[];
  createdAt?: string;
  updatedAt?: string;
};

export type ThreadListResponse = ApiSuccess<{
  page: number;
  limit: number;
  total: number;
  items: AdminEmailThreadDto[];
}>;

export type ThreadMessagesResponse = ApiSuccess<{
  thread: AdminEmailThreadDto;
  messages: AdminEmailMessageDto[];
}>;

export type ComposeEmailInput = {
  ownerAdminId?: string;
  to: string[] | string;
  cc?: string[] | string;
  bcc?: string[] | string;
  subject?: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachmentInput[];
};

export type ComposeEmailResponse = ApiSuccess<{
  total: number;
  sent: number;
  failed: number;
  results: Array<{
    email: string;
    success: boolean;
    threadId?: string;
    emailMessageId?: string;
    sesMessageId?: string | null;
    replyToEmail?: string;
    s3Key?: string | null;
    error?: string;
  }>;
}>;

export type ReplyToThreadInput = {
  threadId: string;
  subject?: string;
  text?: string;
  html?: string;
  cc?: string[] | string;
  bcc?: string[] | string;
  attachments?: EmailAttachmentInput[];
};

export type ReplyToThreadResponse = ApiSuccess<{
  threadId: string;
  emailMessageId: string;
  sesMessageId: string | null;
  replyToEmail?: string;
  s3Key?: string | null;
}>;

export type BulkCsvSendInput = {
  file: File;
  subject?: string;
  text?: string;
  html?: string;
  ownerAdminId?: string;
};

export type BulkCsvSendResponse = ApiSuccess<{
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
}>;

export type PipelineRecipientDto = {
  pipelineId: string;
  campaignId?: string;
  name: string;
  email: string;
  company?: string;
  niche?: string[];
  status?: string;
  threadId?: string | null;
  replyToEmail?: string | null;
};

export type PipelineRecipientsResponse = ApiSuccess<{
  items: PipelineRecipientDto[];
}>;

export type SendSelectedPipelineEmailsInput = {
  campaignId: string;
  pipelineIds: string[];
  ownerAdminId?: string;
  subject?: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachmentInput[];
};

export type SendSelectedPipelineEmailsResponse = ApiSuccess<{
  total: number;
  sent: number;
  failed: number;
  results: Array<{
    pipelineId: string;
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
}>;

export type BrandOutreachRecipientDto = {
  brandOutreachId: string;
  name: string;
  email: string;
  website?: string;
  status?: string;
  threadId?: string | null;
  replyToEmail?: string | null;
};

export type BrandOutreachRecipientsResponse = ApiSuccess<{
  items: BrandOutreachRecipientDto[];
}>;

export type SendSelectedBrandOutreachEmailsInput = {
  brandOutreachIds: string[];
  ownerAdminId?: string;
  subject?: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachmentInput[];
};

export type SendSelectedBrandOutreachEmailsResponse = ApiSuccess<{
  total: number;
  sent: number;
  failed: number;
  results: Array<{
    brandOutreachId: string;
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
}>;

export type EmailTemplateVisibility = "GLOBAL" | "TREE" | "PERSONAL";

export type EmailTemplateDto = {
  _id: string;
  name: string;
  subject?: string;
  body?: string;
  visibility: EmailTemplateVisibility;
  status: "ACTIVE" | "ARCHIVED";
  createdByRole: AdminRole;
  createdByAdminId?: AdminMini | string;
  ownerAdminId?: string | AdminMini | null;
  treeAdminId?: string | AdminMini | null;
  createdAt?: string;
  updatedAt?: string;
};

export type EmailTemplateListResponse = ApiSuccess<{
  items: EmailTemplateDto[];
}>;

export type EmailTemplateSingleResponse = ApiSuccess<EmailTemplateDto>;

function appendIfPresent(formData: FormData, key: string, value?: string) {
  if (value != null && value !== "") {
    formData.append(key, value);
  }
}

export async function fetchMailboxScope() {
  return get<MailboxScopeResponse>("/admin-email/me");
}

export async function fetchEmailThreads(params?: FetchThreadsParams) {
  return get<ThreadListResponse>("/admin-email/threads", params);
}

export async function fetchThreadMessages(threadId: string) {
  return get<ThreadMessagesResponse>(`/admin-email/threads/${threadId}/messages`);
}

export async function replyToEmailThread(input: ReplyToThreadInput) {
  const { threadId, ...payload } = input;
  return post<ReplyToThreadResponse>(
    `/admin-email/threads/${threadId}/reply`,
    payload
  );
}

export async function composeAdminEmail(input: ComposeEmailInput) {
  return post<ComposeEmailResponse>("/admin-email/compose", input);
}

export async function sendBulkCsvEmail(input: BulkCsvSendInput) {
  const formData = new FormData();
  formData.append("file", input.file);

  appendIfPresent(formData, "subject", input.subject);
  appendIfPresent(formData, "text", input.text);
  appendIfPresent(formData, "html", input.html);
  appendIfPresent(formData, "ownerAdminId", input.ownerAdminId);

  return postFormData<BulkCsvSendResponse>("/admin-email/bulk/csv", formData);
}

export async function fetchPipelineRecipients(input: {
  campaignId: string;
  pipelineIds: string[];
}) {
  return post<PipelineRecipientsResponse>(
    "/admin-email/pipeline/recipients",
    input
  );
}

export async function sendSelectedPipelineEmails(
  input: SendSelectedPipelineEmailsInput
) {
  return post<SendSelectedPipelineEmailsResponse>(
    "/admin-email/pipeline/send-selected",
    input
  );
}

export async function fetchBrandOutreachRecipients(input: {
  brandOutreachIds: string[];
}) {
  return post<BrandOutreachRecipientsResponse>(
    "/admin-email/brand-outreach/recipients",
    input
  );
}

export async function sendSelectedBrandOutreachEmails(
  input: SendSelectedBrandOutreachEmailsInput
) {
  return post<SendSelectedBrandOutreachEmailsResponse>(
    "/admin-email/brand-outreach/send-selected",
    input
  );
}

export async function fetchEmailTemplates() {
  return get<EmailTemplateListResponse>("/admin-email/templates");
}

export async function createEmailTemplate(input: {
  name: string;
  subject?: string;
  body?: string;
}) {
  return post<EmailTemplateSingleResponse>("/admin-email/templates", input);
}

export async function updateEmailTemplateById(input: {
  templateId: string;
  name?: string;
  subject?: string;
  body?: string;
}) {
  return post<EmailTemplateSingleResponse>(
    `/admin-email/templates/${input.templateId}/update`,
    {
      name: input.name,
      subject: input.subject,
      body: input.body,
    }
  );
}

export async function deleteEmailTemplateById(templateId: string) {
  return post<ApiSuccess<{ deleted: boolean; templateId: string }>>(
    `/admin-email/templates/${templateId}/delete`,
    {}
  );
}

export type EmailAttachmentInput = {
  filename: string;
  contentType: string;
  size: number;
  contentBase64: string;
};
