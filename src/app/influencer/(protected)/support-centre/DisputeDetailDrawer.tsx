"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { get, postFormData } from "@/lib/api";
import {
  X,
  Paperclip,
  Send,
  MessageSquareText,
  CalendarDays,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ChevronDown,
} from "lucide-react";

type Attachment = {
  url: string;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
};

type Comment = {
  commentId: string;
  authorRole: "Admin" | "Brand" | "Influencer";
  authorId: string;
  text: string;
  createdAt: string;
  attachments?: Attachment[];
};

type DisputeStatus =
  | "open"
  | "in_review"
  | "awaiting_user"
  | "resolved"
  | "rejected";

type Role = "Admin" | "Brand" | "Influencer";

type DisputeParty = {
  role: "Brand" | "Influencer";
  id: string;
  name?: string | null;
};

type Dispute = {
  disputeId: string;
  subject: string;
  description: string;
  status: DisputeStatus;
  campaignId?: string | null;
  campaignName?: string | null;
  brandId: string;
  influencerId: string;
  assignedTo?: { adminId?: string | null; name?: string | null } | null;
  comments: Comment[];
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
  raisedByRole?: Role | null;
  raisedById?: string | null;
  raisedBy?: DisputeParty | null;
  raisedAgainst?: DisputeParty | null;
  viewerIsRaiser?: boolean;
};

type ImagePreviewState = {
  images: Attachment[];
  index: number;
} | null;

type DisputeDetailDrawerProps = {
  open: boolean;
  disputeId: string | null;
  onClose: () => void;
  onCommentPosted?: () => void;
};

const statusTone = (status: DisputeStatus) =>
  ({
    open: "border-blue-200 bg-blue-50 text-blue-700",
    in_review: "border-blue-200 bg-blue-50 text-blue-700",
    awaiting_user: "border-slate-300 bg-slate-100 text-slate-700",
    resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-red-200 bg-red-50 text-red-600",
  }[status] || "border-slate-300 bg-slate-100 text-slate-700");

const statusLabel = (status: DisputeStatus) =>
  ({
    open: "Open",
    in_review: "In Progress",
    awaiting_user: "Awaiting You",
    resolved: "Resolved",
    rejected: "Rejected",
  }[status] || status);

const priorityLabel = (status: DisputeStatus) => {
  if (status === "rejected") return "Rejected";
  if (status === "resolved") return "Closed";
  return "High Priority";
};

const isFinalStatus = (status: DisputeStatus) =>
  status === "resolved" || status === "rejected";

const getDirectionLabel = (d: Dispute | null): string => {
  if (!d) return "";

  const viewerIsRaiser =
    typeof d.viewerIsRaiser === "boolean"
      ? d.viewerIsRaiser
      : d.raisedByRole === "Influencer";

  const otherNameFromAgainst =
    d.raisedAgainst?.name ||
    (d.raisedAgainst?.role === "Brand"
      ? "this brand"
      : d.raisedAgainst?.role === "Influencer"
        ? "this influencer"
        : "the other party");

  const otherNameFromBy =
    d.raisedBy?.name ||
    (d.raisedBy?.role === "Brand"
      ? "this brand"
      : d.raisedBy?.role === "Influencer"
        ? "this influencer"
        : "the other party");

  if (viewerIsRaiser) {
    return `You raised this dispute against ${otherNameFromAgainst}`;
  }

  return `${otherNameFromBy} raised this dispute against you`;
};

const isImageAttachment = (attachment: Attachment) => {
  if (attachment.mimeType?.startsWith("image/")) return true;
  const clean = (attachment.url || "").split("?")[0].toLowerCase();
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(clean);
};

const formatFileSize = (size?: number | null) => {
  if (!size || Number.isNaN(size)) return null;
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function ImagePreviewModal({
  state,
  onClose,
  onPrev,
  onNext,
}: {
  state: ImagePreviewState;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    if (!state) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state, onClose, onPrev, onNext]);

  if (!state || !state.images.length) return null;

  const current = state.images[state.index];
  if (!current) return null;

  const label =
    current.originalName ||
    current.url.split("?")[0].split("/").pop() ||
    "Image";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between text-xs text-white/80">
          <span className="truncate">{label}</span>
          <div className="flex items-center gap-3">
            <span>
              {state.index + 1} / {state.images.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-3xl bg-black/40">
          {state.images.length > 1 ? (
            <button
              type="button"
              onClick={onPrev}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/55 p-2 hover:bg-black/75"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={label}
            className="max-h-[78vh] max-w-full object-contain"
          />

          {state.images.length > 1 ? (
            <button
              type="button"
              onClick={onNext}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/55 p-2 hover:bg-black/75"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EvidenceFileCard({
  attachment,
  onImageClick,
  subtitle,
}: {
  attachment: Attachment;
  onImageClick?: () => void;
  subtitle: string;
}) {
  const name =
    attachment.originalName ||
    attachment.url.split("?")[0].split("/").pop() ||
    "Attachment";
  const isImage = isImageAttachment(attachment);

  const content = (
    <>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={attachment.url}
            alt={name}
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : (
          <FileText className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-slate-900">
          {name}
        </p>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
    </>
  );

  if (isImage && onImageClick) {
    return (
      <button
        type="button"
        onClick={onImageClick}
        className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:bg-slate-50"
      >
        {content}
      </button>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:bg-slate-50"
    >
      {content}
    </a>
  );
}

function CommentBubble({
  comment,
  onOpenPreview,
}: {
  comment: Comment;
  onOpenPreview: (images: Attachment[], index: number) => void;
}) {
  const imageAttachments = comment.attachments?.filter(isImageAttachment) || [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Badge className="border-slate-200 bg-slate-50 text-slate-700">
          {comment.authorRole}
        </Badge>
        <span className="text-xs text-slate-500">
          {new Date(comment.createdAt).toLocaleString()}
        </span>
      </div>

      {comment.text ? (
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
          {comment.text}
        </p>
      ) : null}

      {comment.attachments?.length ? (
        <div className="mt-3 space-y-3">
          {comment.attachments.map((attachment, index) => (
            <EvidenceFileCard
              key={`${attachment.url}-${index}`}
              attachment={attachment}
              subtitle={new Date(comment.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              onImageClick={
                isImageAttachment(attachment)
                  ? () => {
                      const previewIndex = imageAttachments.findIndex(
                        (item) => item.url === attachment.url
                      );
                      if (previewIndex > -1) {
                        onOpenPreview(imageAttachments, previewIndex);
                      }
                    }
                  : undefined
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function DisputeDetailDrawer({
  open,
  disputeId,
  onClose,
  onCommentPosted,
}: DisputeDetailDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [influencerId, setInfluencerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [comment, setComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [previewState, setPreviewState] = useState<ImagePreviewState>(null);
  const [isReplyOpen, setIsReplyOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("influencerId");
    setInfluencerId(stored);
  }, []);

  useEffect(() => {
    if (!open) {
      setComment("");
      setCommentFiles([]);
      setError(null);
      setDispute(null);
      setIsReplyOpen(false);
    }
  }, [open]);

  useEffect(() => {
    setComment("");
    setCommentFiles([]);
    setIsReplyOpen(false);
  }, [disputeId]);

  const load = useCallback(async () => {
    if (!open || !disputeId || !influencerId) return;
    setLoading(true);
    setError(null);

    try {
      const data = await get<{ dispute: Dispute }>(
        `/dispute/influencer/${disputeId}`,
        { influencerId }
      );
      setDispute(data.dispute);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load dispute"
      );
    } finally {
      setLoading(false);
    }
  }, [open, disputeId, influencerId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const handleCommentFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const maxSize = 10 * 1024 * 1024;
    const tooBig = files.find((file) => file.size > maxSize);
    if (tooBig) {
      setError(
        `"${tooBig.name}" is larger than 10MB. Please upload a smaller file.`
      );
    }

    const safeFiles = files.filter((file) => file.size <= maxSize);
    setCommentFiles((prev) => [...prev, ...safeFiles]);
    e.target.value = "";
  };

  const removeCommentFile = (index: number) => {
    setCommentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const postComment = async () => {
    if (
      !disputeId ||
      !influencerId ||
      (!comment.trim() && !commentFiles.length)
    ) {
      return;
    }

    setPosting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("influencerId", influencerId);
      form.append("text", comment.trim());
      commentFiles.forEach((file) => {
        form.append("attachments", file);
      });

      await postFormData(`/dispute/influencer/${disputeId}/comment`, form);
      setComment("");
      setCommentFiles([]);
      setIsReplyOpen(false);
      await load();
      onCommentPosted?.();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to send reply"
      );
    } finally {
      setPosting(false);
    }
  };

  const directionLabel = getDirectionLabel(dispute);
  const mainEvidence = useMemo(() => dispute?.attachments || [], [dispute]);
  const mainImages = useMemo(
    () => mainEvidence.filter(isImageAttachment),
    [mainEvidence]
  );

  const openPreview = (images: Attachment[], index: number) => {
    if (!images.length) return;
    setPreviewState({ images, index });
  };

  const closePreview = () => setPreviewState(null);

  const prevImage = () =>
    setPreviewState((prev) => {
      if (!prev || prev.images.length < 2) return prev;
      return {
        ...prev,
        index: (prev.index - 1 + prev.images.length) % prev.images.length,
      };
    });

  const nextImage = () =>
    setPreviewState((prev) => {
      if (!prev || prev.images.length < 2) return prev;
      return {
        ...prev,
        index: (prev.index + 1) % prev.images.length,
      };
    });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/50" onClick={onClose} />

      <aside className="fixed inset-y-0 right-0 z-[75] flex w-full justify-end">
        <div className="h-full w-full max-w-[680px] overflow-hidden border-l border-slate-200 bg-[#f7f7f8] shadow-2xl">
          <div className="flex h-full flex-col">
            {loading ? (
              <div className="flex h-full items-center justify-center px-8">
                <div className="inline-flex items-center gap-3 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading dispute details...
                </div>
              </div>
            ) : error || !dispute ? (
              <div className="px-6 py-8 sm:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      Unable to open dispute
                    </h2>
                    <p className="mt-2 text-sm text-red-600">
                      {error || "Dispute not found."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-2 text-black transition hover:bg-slate-200"
                    aria-label="Close dispute view"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative border-b border-slate-200 px-6 pb-7 pt-8 sm:px-8">
                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-6 top-7 rounded-full p-2 text-black transition hover:bg-slate-200 sm:right-8"
                    aria-label="Close dispute view"
                  >
                    <X className="h-6 w-6" />
                  </button>

                  <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                    <span>{dispute.disputeId}</span>
                    <span className="text-slate-300">›</span>
                    <span className="text-slate-800">
                      {statusLabel(dispute.status)}
                    </span>
                  </div>

                  <h2 className="mt-8 text-3xl font-bold tracking-tight text-slate-900">
                    {dispute.campaignName || dispute.subject}
                  </h2>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-600">
                    <div className="flex items-center gap-2 text-lg">
                      <MessageSquareText className="h-5 w-5 text-slate-500" />
                      <span className="text-base">
                        {dispute.subject}
                        {directionLabel ? ` • ${directionLabel}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-base">
                      <CalendarDays className="h-5 w-5 text-slate-500" />
                      <span>Created {formatDisplayDate(dispute.createdAt)}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Badge className={statusTone(dispute.status)}>
                      {statusLabel(dispute.status)}
                    </Badge>
                    <Badge className="border-slate-300 bg-white text-slate-800">
                      {priorityLabel(dispute.status)}
                    </Badge>
                    {dispute.assignedTo?.name ? (
                      <Badge className="border-slate-300 bg-white text-slate-700">
                        Assigned to {dispute.assignedTo.name}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-8 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 sm:px-8">
                  <div className="space-y-8">
                    {dispute.description ? (
                      <section>
                        <div className="mb-4 flex items-center gap-2 text-slate-600">
                          <MessageSquareText className="h-5 w-5" />
                          <h3 className="text-xl font-bold uppercase tracking-[0.08em] text-slate-600">
                            Issue Description
                          </h3>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 text-lg leading-9 text-slate-700">
                          {dispute.description}
                        </div>
                      </section>
                    ) : null}

                    {mainEvidence.length ? (
                      <section>
                        <div className="mb-4 flex items-center gap-2 text-slate-600">
                          <Paperclip className="h-5 w-5" />
                          <h3 className="text-xl font-bold uppercase tracking-[0.08em] text-slate-600">
                            Evidence Files ({mainEvidence.length})
                          </h3>
                        </div>

                        <div className="space-y-3">
                          {mainEvidence.map((attachment, index) => (
                            <EvidenceFileCard
                              key={`${attachment.url}-${index}`}
                              attachment={attachment}
                              subtitle={`${
                                formatFileSize(attachment.size) || "File"
                              } • ${formatDisplayDate(dispute.createdAt)}`}
                              onImageClick={
                                isImageAttachment(attachment)
                                  ? () => {
                                      const previewIndex = mainImages.findIndex(
                                        (item) => item.url === attachment.url
                                      );
                                      if (previewIndex > -1) {
                                        openPreview(mainImages, previewIndex);
                                      }
                                    }
                                  : undefined
                              }
                            />
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {dispute.comments?.length ? (
                      <section>
                        <div className="mb-4 flex items-center gap-2 text-slate-600">
                          <MessageSquareText className="h-5 w-5" />
                          <h3 className="text-xl font-bold uppercase tracking-[0.08em] text-slate-600">
                            Replies ({dispute.comments.length})
                          </h3>
                        </div>

                        <div className="space-y-3">
                          {dispute.comments.map((item) => (
                            <CommentBubble
                              key={item.commentId}
                              comment={item}
                              onOpenPreview={openPreview}
                            />
                          ))}
                        </div>
                      </section>
                    ) : null}
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-white px-6 py-6 sm:px-8">
                  {error ? (
                    <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}

                  {isFinalStatus(dispute.status) ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                      This dispute is finalized and can no longer receive
                      replies.
                    </div>
                  ) : !isReplyOpen ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-500">
                        Parties will be notified via email of your reply.
                      </p>

                      <button
                        type="button"
                        onClick={() => setIsReplyOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800"
                      >
                        <span>Reply</span>
                        <MessageSquareText className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                          Parties will be notified via email of your reply.
                        </p>

                        <button
                          type="button"
                          onClick={() => setIsReplyOpen(false)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
                          aria-label="Collapse reply box"
                        >
                          <ChevronDown className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-[#f7f7f8] px-4 py-4">
                        <textarea
                          rows={5}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Type your message to the parties involved..."
                          className="w-full resize-none bg-transparent text-lg text-slate-700 outline-none placeholder:text-slate-500"
                        />

                        {commentFiles.length ? (
                          <div className="mb-3 space-y-2 border-t border-slate-200 pt-3">
                            {commentFiles.map((file, index) => (
                              <div
                                key={`${file.name}-${index}`}
                                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-slate-900">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatFileSize(file.size) || "Selected file"}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeCommentFile(index)}
                                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-black"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-black"
                            aria-label="Attach files"
                          >
                            <Paperclip className="h-5 w-5" />
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleCommentFileChange}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setComment("");
                            setCommentFiles([]);
                            setIsReplyOpen(false);
                          }}
                          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={postComment}
                          disabled={
                            posting ||
                            (!comment.trim() && !commentFiles.length) ||
                            !influencerId
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {posting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          <span>{posting ? "Sending..." : "Send Reply"}</span>
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      <ImagePreviewModal
        state={previewState}
        onClose={closePreview}
        onPrev={prevImage}
        onNext={nextImage}
      />
    </>
  );
}