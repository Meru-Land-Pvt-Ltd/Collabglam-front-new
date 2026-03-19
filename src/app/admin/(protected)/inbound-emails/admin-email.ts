import { get, post, postFormData } from "@/lib/api";

export type BulkCsvSendResponse = {
  success: boolean;
  message: string;
  data: {
    from: string;
    campaignTitle: string;
    role?: string;
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
    items: any[];
  };
};

export type ThreadMessagesResponse = {
  success: boolean;
  data: {
    thread: any;
    messages: any[];
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
}) {
  const formData = new FormData();
  formData.append("file", input.file);

  return postFormData<BulkCsvSendResponse>("/admin-email/bulk/csv", formData);
}

export async function sendBulkModashEmail(input: {
  campaignId: string;
  executiveId: string;
  modashIds: string[];
}) {
  return post<BulkCsvSendResponse>("/admin-email/bulk/modash", input);
}

export async function fetchEmailThreads(params?: {
  executiveId?: string;
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