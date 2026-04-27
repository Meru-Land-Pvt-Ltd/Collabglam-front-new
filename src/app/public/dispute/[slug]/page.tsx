"use client";

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { get, postFormData } from "@/lib/api";
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Paperclip,
    Send,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/buttonComp";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    ArrowUUpLeftIcon,
    ChatTeardropTextIcon,
    DotsThreeIcon,
    NoteIcon,
    NotePencilIcon,
} from "@phosphor-icons/react";
import {
    apiEditDispute,
    apiGetBrandLite,
    apiRevokeDispute,
    BrandLiteResponse,
} from "@/app/brand/services/brandApi";
import { DisputeFormDialog } from "@/components/common/disputes/DisputeFormDialog";
import Swal from "sweetalert2";
import ConfirmActionModal from "@/components/common/disputes/ConfirmActionModal";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type AuthorRole = "Admin" | "Brand" | "Influencer";

type DisputeStatus =
    | "open"
    | "in_review"
    | "awaiting_user"
    | "resolved"
    | "rejected"
    | "revoked";

type Attachment = {
    url: string;
    originalName?: string | null;
    mimeType?: string | null;
    size?: number | null;
};

type Comment = {
    commentId: string;
    authorRole: AuthorRole;
    authorId: string;
    text: string;
    createdAt: string;
    attachments?: Attachment[];
};

type DisputeParty = {
    role: "Brand" | "Influencer";
    id: string;
    name?: string | null;
    handle?: string | null;
    provider?: string | null;
    profilePic?: string | null;
};

type AssignedAdmin = {
    adminId?: string | null;
    name?: string | null;
};

type Dispute = {
    disputeId: string;
    subject: string;
    description: string;
    status: DisputeStatus;
    priority?: string;
    campaignId?: string | null;
    campaignName?: string | null;
    brandId: string;
    influencerId: string;
    issueType?: string[];
    assignedTo?: AssignedAdmin | null;
    comments: Comment[];
    attachments?: Attachment[];
    createdAt: string;
    updatedAt: string;
    raisedByRole?: string | null;
    raisedById?: string | null;
    raisedBy?: DisputeParty | null;
    raisedAgainst?: DisputeParty | null;
    viewerIsRaiser?: boolean;
};

type DisputeResponse = { dispute: Dispute };
type LightboxState = { images: Attachment[]; index: number };
type MetaItem = { label: string; value: string; sub?: string };
type FaqItem = { value: string; title: string; body: string };
type ApiErrorShape = {
    response?: { data?: { message?: unknown } };
    message?: unknown;
};

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const PAGE_GUTTER = "px-[1.875rem] py-[1.875rem] lg:px-6";
const SURFACE_BORDER = "border border-[#e8e8e8]";
const SUBTLE_BORDER = "border-[#f0f0f0]";
const MUTED_BG = "bg-[#F9F9F9]";

const STATUS_STEPS: Array<{ key: DisputeStatus; label: string }> = [
    { key: "open", label: "Dispute Submitted" },
    { key: "in_review", label: "Response & Evidence" },
    { key: "awaiting_user", label: "Under Review" },
    { key: "resolved", label: "Resolved" },
];

const STATUS_STEP_INDEX: Record<DisputeStatus, number> = {
    open: 0,
    in_review: 1,
    awaiting_user: 2,
    resolved: 3,
    rejected: 3,
    revoked: 3,
};

const STATUS_LABELS: Record<DisputeStatus, string> = {
    open: "Open",
    in_review: "In Progress",
    awaiting_user: "Awaiting You",
    resolved: "Resolved",
    rejected: "Rejected",
    revoked: "Revoked",
};

const FAQ_ITEMS: FaqItem[] = [
    {
        value: "whats-happening-now",
        title: "What's happening now?",
        body: "Our team has received your dispute and is currently reviewing the details. This typically takes 2–5 business days. You'll be notified of any updates.",
    },
    {
        value: "whats-next",
        title: "What's next?",
        body: "Once the initial review is complete, both parties may be asked to provide evidence or respond to questions. Keep an eye on your email and notifications for further instructions.",
    },
];

const ROLE_AVATAR_STYLES: Record<AuthorRole, string> = {
    Admin: "bg-purple-100 text-purple-700",
    Brand: "bg-orange-100 text-orange-700",
    Influencer: "bg-blue-100 text-blue-700",
};

const ISSUE_TYPE_LABELS: Record<string, string> = {
    content_not_as_expected: "Content Not as Expected",
    delay_or_missed_deadline: "Delay or Missed Deadline",
    payment_issue: "Payment Issue",
    revision_issue: "Revision Issue",
    agreement_issue: "Agreement Issue",
    scope_change: "Scope Change",
    no_response: "No Response",
    other: "Other",
};

/* -------------------------------------------------------------------------- */
/*                                  Utilities                                 */
/* -------------------------------------------------------------------------- */

function formatIssueTypeLabel(value?: string | null): string {
    if (!value) return "—";
    return (
        ISSUE_TYPE_LABELS[value] ||
        value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    );
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error !== "object" || error === null) return fallback;
    const c = error as ApiErrorShape;
    if (typeof c.response?.data?.message === "string") return c.response.data.message;
    if (typeof c.message === "string") return c.message;
    return fallback;
}

function daysSince(dateStr: string): number {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function formatTimeAgo(dateStr: string): string {
    const d = daysSince(dateStr);
    if (d <= 0) return "Today";
    if (d === 1) return "1 day ago";
    return `${d} days ago`;
}

function formatDaysLeft(days: number): string {
    return `${days} day${days !== 1 ? "s" : ""} left`;
}

function formatHandle(handle?: string | null): string | null {
    if (!handle) return null;
    return handle.startsWith("@") ? handle : `@${handle}`;
}

function isImageAttachment(a: Attachment): boolean {
    if (a.mimeType?.startsWith("image/")) return true;
    return /\.(png|jpe?g|gif|webp|svg|avif)$/i.test((a.url || "").split("?")[0]);
}

function getImageAttachments(attachments?: Attachment[]): Attachment[] {
    return (attachments ?? []).filter(isImageAttachment);
}

function getFileAttachments(attachments?: Attachment[]): Attachment[] {
    return (attachments ?? []).filter((a) => !isImageAttachment(a));
}

function getInitials(name?: string | null, role?: string): string {
    return (name || role || "?")
        .split(" ")
        .map((p) => p[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function getStatusPillClasses(status: DisputeStatus): string {
    switch (status) {
        case "resolved": return "bg-emerald-50 text-emerald-700";
        case "rejected": return "bg-red-50 text-red-600";
        case "in_review": return "bg-blue-50 text-blue-700";
        default: return "bg-[#f0faf0] text-[#2d7a3a]";
    }
}

function getStatusDotClasses(status: DisputeStatus): string {
    switch (status) {
        case "resolved": return "bg-emerald-500";
        case "rejected": return "bg-red-500";
        default: return "bg-[#2d7a3a]";
    }
}

function getDisputeNarrative(dispute: Dispute): string {
    if (dispute.viewerIsRaiser)
        return `You raised this dispute against ${dispute.raisedAgainst?.name || "the influencer"}`;
    return `${dispute.raisedBy?.name || "The influencer"} raised this dispute against you`;
}

function getCommentAuthorLabel(comment: Comment, dispute: Dispute): string {
    if (comment.authorRole === "Brand" && dispute.viewerIsRaiser) return "You";
    return comment.authorRole;
}

/* -------------------------------------------------------------------------- */
/*                               Auth Gate Hook                               */
/* -------------------------------------------------------------------------- */

/**
 * Redirects to /brand/login with a returnUrl pointing at the current path.
 * After login, the login page should read ?returnUrl= and router.replace() there.
 */
function useAuthGate() {
    const router = useRouter();

    const requireAuth = useCallback(
        (brandId: string | null, disputeId: string, onAuthed: () => void) => {
            if (brandId) {
                onAuthed();
                return;
            }

            // After login, land on the authenticated brand dispute page directly
            const returnUrl = encodeURIComponent(`/brand/disputes/${disputeId}`);
            router.push(`/brand/login?returnUrl=${returnUrl}`);
        },
        [router]
    );

    return { requireAuth };
}

/* -------------------------------------------------------------------------- */
/*                                UI Primitives                               */
/* -------------------------------------------------------------------------- */

function SectionCard({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <div className={`rounded-lg bg-white ${className}`}>{children}</div>;
}

function IconButton({
    children,
    className = "",
    ...props
}: React.ComponentProps<typeof Button>) {
    return (
        <Button
            type="button"
            variant="outline"
            className={`h-8 w-8 rounded-lg border-none bg-transparent p-0 shadow-none hover:bg-[#f5f5f5] ${className}`}
            {...props}
        >
            {children}
        </Button>
    );
}

function StatusPill({ status }: { status: DisputeStatus }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium ${getStatusPillClasses(status)}`}
        >
            <span className={`size-1.5 rounded-lg ${getStatusDotClasses(status)}`} />
            {STATUS_LABELS[status]}
        </span>
    );
}

function Avatar({
    name,
    role,
    size = "sm",
}: {
    name?: string | null;
    role?: AuthorRole | string;
    size?: "sm" | "md";
}) {
    const sizeClass = size === "md" ? "size-9 text-sm" : "size-7 text-xs";
    const colorClass =
        role && role in ROLE_AVATAR_STYLES
            ? ROLE_AVATAR_STYLES[role as AuthorRole]
            : "bg-gray-100 text-gray-600";

    return (
        <div
            className={`${sizeClass} ${colorClass} flex shrink-0 items-center justify-center rounded-lg font-semibold`}
        >
            {getInitials(name, role)}
        </div>
    );
}

function ProfileAvatar({
    name,
    role,
    imageUrl,
    size = "sm",
}: {
    name?: string | null;
    role?: AuthorRole | string;
    imageUrl?: string | null;
    size?: "sm" | "md";
}) {
    const sizeClass = size === "md" ? "size-10" : "size-8";
    const fallbackTextClass = size === "md" ? "text-sm" : "text-xs";
    const colorClass =
        role && role in ROLE_AVATAR_STYLES
            ? ROLE_AVATAR_STYLES[role as AuthorRole]
            : "bg-gray-100 text-gray-600";

    if (imageUrl) {
        return (
            <div
                className={`${sizeClass} relative shrink-0 overflow-hidden rounded-full border border-[#f0f0f0] bg-white`}
            >
                <Image
                    src={imageUrl}
                    alt={name || "Profile"}
                    fill
                    unoptimized
                    sizes={size === "md" ? "40px" : "32px"}
                    className="object-cover"
                />
            </div>
        );
    }

    return (
        <div
            className={`${sizeClass} ${colorClass} flex shrink-0 items-center justify-center rounded-full font-semibold ${fallbackTextClass}`}
        >
            {getInitials(name, role)}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="min-h-screen bg-[#f7f7f5] p-6">
            <div className="mx-auto max-w-4xl animate-pulse space-y-4">
                <div className="h-8 w-48 rounded-lg bg-gray-200" />
                <div className="h-16 rounded-lg bg-gray-200" />
                <div className="h-32 rounded-lg bg-gray-200" />
                <div className="h-48 rounded-lg bg-gray-200" />
            </div>
        </div>
    );
}

function ErrorState({
    message,
    onBack,
}: {
    message: string;
    onBack: () => void;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
            <div className="space-y-4 text-center">
                <p className="text-[#888]">{message}</p>
                <Button type="button" onClick={onBack} className="text-sm text-[#1a1a1a] underline">
                    Go back
                </Button>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*                             Feature Components                              */
/* -------------------------------------------------------------------------- */

function LightboxModal({
    images,
    index,
    onClose,
}: {
    images: Attachment[];
    index: number;
    onClose: () => void;
}) {
    const [activeIndex, setActiveIndex] = useState(index);
    const current = images[activeIndex];

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft")
                setActiveIndex((p) => (p - 1 + images.length) % images.length);
            if (e.key === "ArrowRight")
                setActiveIndex((p) => (p + 1) % images.length);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [images.length, onClose]);

    if (!current) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-5xl px-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-3 flex items-center justify-between text-xs text-gray-300">
                    <span className="max-w-xs truncate">{current.originalName || "Image"}</span>
                    <div className="flex items-center gap-3">
                        <span>{activeIndex + 1} / {images.length}</span>
                        <Button
                            type="button"
                            onClick={onClose}
                            className="flex size-7 items-center justify-center rounded-lg bg-white/10 p-0 hover:bg-white/20"
                        >
                            <X className="size-4 text-white" />
                        </Button>
                    </div>
                </div>
                <div className="relative h-[80vh] min-h-[300px] overflow-hidden rounded-lg bg-black/30">
                    {images.length > 1 && (
                        <Button
                            type="button"
                            onClick={() =>
                                setActiveIndex((p) => (p - 1 + images.length) % images.length)
                            }
                            className="absolute left-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg bg-black/50 p-0 hover:bg-black/70"
                        >
                            <ChevronLeft className="size-5 text-white" />
                        </Button>
                    )}
                    <Image
                        src={current.url}
                        alt={current.originalName || "Preview"}
                        fill
                        unoptimized
                        sizes="100vw"
                        className="object-contain"
                    />
                    {images.length > 1 && (
                        <Button
                            type="button"
                            onClick={() => setActiveIndex((p) => (p + 1) % images.length)}
                            className="absolute right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg bg-black/50 p-0 hover:bg-black/70"
                        >
                            <ChevronRight className="size-5 text-white" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function MetaGrid({ items }: { items: MetaItem[] }) {
    return (
        <div className="mt-5 pt-5">
            <div
                className={`grid gap-3 rounded-[12px] px-4 py-5 ${MUTED_BG} [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]`}
            >
                {items.map((item) => (
                    <div key={item.label} className="min-w-0">
                        <p className="mb-1 text-[11px] leading-4 text-[#999]">{item.label}</p>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium leading-5 text-[#1a1a1a]">
                                {item.value}
                            </p>
                            {item.sub && (
                                <p className="mt-0.5 truncate text-xs leading-4 text-[#888]">
                                    {item.sub}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AttachmentGallery({
    imageAttachments,
    fileAttachments,
    onOpenLightbox,
}: {
    imageAttachments: Attachment[];
    fileAttachments: Attachment[];
    onOpenLightbox: (images: Attachment[], index: number) => void;
}) {
    if (imageAttachments.length === 0 && fileAttachments.length === 0) return null;

    return (
        <div>
            <h2 className="mb-4 text-sm font-semibold text-[#1a1a1a]">
                Image / Reference
            </h2>
            {imageAttachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-3">
                    {imageAttachments.map((a, i) => (
                        <Button
                            key={`${a.url}-${i}`}
                            type="button"
                            onClick={() => onOpenLightbox(imageAttachments, i)}
                            className={`group relative !h-[11.4375rem] !w-[13.75rem] shrink-0 overflow-hidden rounded-[1.1875rem] ${SURFACE_BORDER} bg-[#f5f5f5] !p-0 transition-colors hover:border-[#ccc]`}
                        >
                            <Image
                                src={a.url}
                                alt={a.originalName || `Image ${i + 1}`}
                                fill
                                unoptimized
                                sizes="220px"
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                        </Button>
                    ))}
                </div>
            )}
            {fileAttachments?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {fileAttachments.map((a, i) => (
                        <a
                            key={`${a.url}-${i}`}
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center gap-2 rounded-lg ${SURFACE_BORDER} bg-[#fafafa] px-3 py-1.5 text-xs text-[#555] transition-colors hover:bg-[#f5f5f5]`}
                        >
                            <Paperclip className="size-3.5 shrink-0 text-[#aaa]" />
                            <span className="max-w-[160px] truncate">
                                {a.originalName || "File"}
                            </span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}

function ProgressTracker({
    status,
    title,
}: {
    status: DisputeStatus;
    title: string;
}) {
    const activeStepIndex = STATUS_STEP_INDEX[status] ?? 0;

    return (
        <div
            className={`border-y ${SURFACE_BORDER.replace("border ", "")} bg-white py-5`}
        >
            <div className="mb-4 flex items-center gap-2">
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e8f5e9]">
                    <span className="text-[10px] text-[#2d7a3a]">✓</span>
                </div>
                <p className="text-sm font-medium text-[#444]">{title}</p>
            </div>
            <div className="space-y-2">
                <div className="grid grid-cols-4 gap-3">
                    {STATUS_STEPS.map((step, i) => {
                        const isDone = i < activeStepIndex;
                        const isActive = i === activeStepIndex;
                        return (
                            <div key={step.key} className="h-1.5 overflow-hidden rounded-full bg-[#e8e8e8]">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${isDone || isActive ? "bg-[#2fb344]" : "bg-transparent"}`}
                                    style={{ width: isDone ? "100%" : isActive ? "50%" : "0%" }}
                                />
                            </div>
                        );
                    })}
                </div>
                <div className="grid grid-cols-4 gap-3">
                    {STATUS_STEPS.map((step, i) => {
                        const isDone = i < activeStepIndex;
                        const isActive = i === activeStepIndex;
                        const isPending = !isDone && !isActive;
                        return (
                            <div key={step.key} className="flex items-center gap-1.5 text-[10px] leading-none">
                                {isDone ? (
                                    <CheckCircle2 className="size-3.5 shrink-0 text-[#2fb344]" strokeWidth={2.5} />
                                ) : (
                                    <span
                                        className={`inline-block size-3 rounded-full border ${isActive ? "border-[#1a1a1a]" : "border-[#bdbdbd]"}`}
                                    />
                                )}
                                <span className={`whitespace-nowrap font-medium ${isPending ? "text-[#9b9b9b]" : "text-[#1a1a1a]"}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function FaqSection() {
    return (
        <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
                <React.Fragment key={item.value}>
                    <div className="overflow-hidden rounded-lg bg-[#F9F9F9] px-5">
                        <Accordion type="single" collapsible>
                            <AccordionItem value={item.value} className="border-b-0">
                                <AccordionTrigger className="py-4 text-sm font-medium text-[#1a1a1a] hover:no-underline">
                                    {item.title}
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-[#555]">
                                    <p>{item.body}</p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                    {i < FAQ_ITEMS.length - 1 && (
                        <div className="my-2 border-t border-[#e8e8e8]" />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

function ActivityFeed({
    dispute,
    onOpenLightbox,
    brandLogoUrl,
    brandProfilePic,
}: {
    dispute: Dispute;
    onOpenLightbox: (images: Attachment[], index: number) => void;
    brandLogoUrl?: string | null;
    brandProfilePic?: string | null;
}) {
    return (
        <SectionCard className={`${SURFACE_BORDER} p-5`}>
            <div className="mb-4 flex items-center gap-2">
                <ChatTeardropTextIcon className="size-5 text-[#1a1a1a]" />
                <h2 className="text-sm font-semibold leading-5 text-[#1a1a1a]">
                    We&apos;re verifying the dispute, thanks for your Patience
                </h2>
            </div>
            <div className="space-y-4">
                <div className="rounded-lg bg-[#fafafa] px-4 py-3">
                    <div className="flex items-start gap-3">
                        <ProfileAvatar
                            name={dispute.viewerIsRaiser ? "You" : dispute.raisedBy?.name}
                            role={dispute.raisedBy?.role}
                            imageUrl={dispute.viewerIsRaiser ? brandProfilePic : dispute.raisedBy?.profilePic}
                            size="sm"
                        />
                        <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="truncate text-sm font-medium text-[#1a1a1a]">
                                    {dispute.viewerIsRaiser ? "You" : dispute.raisedBy?.name || dispute.raisedBy?.role}
                                </span>
                                <span className="text-xs text-[#999]">{formatTimeAgo(dispute.createdAt)}</span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-[#666]">
                                {getDisputeNarrative(dispute)}
                                {dispute.raisedAgainst?.handle && (
                                    <span className="font-medium text-[#1a1a1a]">
                                        {" "}{formatHandle(dispute.raisedAgainst.handle)}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {dispute.comments.map((comment) => {
                    const commentImages = getImageAttachments(comment.attachments);
                    const isBrandComment = comment.authorRole === "Brand";
                    const commentName = getCommentAuthorLabel(comment, dispute);

                    return (
                        <div key={comment.commentId} className="rounded-lg bg-[#fafafa] px-4 py-3">
                            <div className="flex items-start gap-3">
                                <ProfileAvatar
                                    name={commentName}
                                    role={comment.authorRole}
                                    imageUrl={isBrandComment && dispute.viewerIsRaiser ? brandProfilePic : undefined}
                                    size="sm"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="truncate text-sm font-medium text-[#1a1a1a]">{commentName}</span>
                                        <span className="text-xs text-[#999]">{formatTimeAgo(comment.createdAt)}</span>
                                    </div>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#666]">
                                        {comment.text}
                                    </p>
                                    {commentImages.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {commentImages.map((a, i) => (
                                                <Button
                                                    key={`${a.url}-${i}`}
                                                    type="button"
                                                    onClick={() => onOpenLightbox(commentImages, i)}
                                                    className={`relative h-14 w-20 overflow-hidden rounded-xl ${SURFACE_BORDER} bg-[#f5f5f5] !p-0`}
                                                >
                                                    <Image
                                                        src={a.url}
                                                        alt={a.originalName || "Comment attachment"}
                                                        fill
                                                        unoptimized
                                                        sizes="80px"
                                                        className="object-cover"
                                                    />
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div className="rounded-lg bg-[#fafafa] px-4 py-3">
                    <div className="flex items-start gap-3">
                        <ProfileAvatar name="Collabglam" imageUrl={brandLogoUrl} size="sm" />
                        <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="text-sm font-medium text-[#1a1a1a]">Collabglam</span>
                                <span className="text-xs text-[#999]">{formatTimeAgo(dispute.createdAt)}</span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-[#666]">Raised a dispute</p>
                        </div>
                    </div>
                </div>
            </div>
        </SectionCard>
    );
}

function CommentComposer({
    otherParty,
    isFinalized,
    isAuthenticated,
    comment,
    setComment,
    commentFiles,
    setCommentFiles,
    posting,
    postError,
    fileInputRef,
    onSubmit,
    onAuthRequired,
}: {
    otherParty?: DisputeParty | null;
    isFinalized: boolean;
    isAuthenticated: boolean;       // ← new
    comment: string;
    setComment: React.Dispatch<React.SetStateAction<string>>;
    commentFiles: File[];
    setCommentFiles: React.Dispatch<React.SetStateAction<File[]>>;
    posting: boolean;
    postError: string | null;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onSubmit: () => Promise<void>;
    onAuthRequired: () => void;     // ← new
}) {
    const canSubmit = comment.trim().length > 0 || commentFiles.length > 0;

    return (
        <SectionCard className={`${SURFACE_BORDER} flex flex-col p-5`}>
            <div className="mb-4 flex items-center gap-2">
                <Avatar name={otherParty?.name} role={otherParty?.role} size="md" />
                <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">
                        {otherParty?.name || "Other Party"}
                    </p>
                    {otherParty?.handle && (
                        <p className="text-xs text-[#888]">{formatHandle(otherParty.handle)}</p>
                    )}
                    <p className="text-[10px] text-[#bbb]">10 days ago</p>
                </div>
                <IconButton className="ml-auto text-[#888]">
                    <DotsThreeIcon className="size-4" weight="bold" />
                </IconButton>
            </div>

            {/* ── Unauthenticated prompt ── */}
            {!isAuthenticated ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#e8e8e8] py-8 text-center">
                    <p className="text-sm text-[#888]">
                        You need to be logged in to add a comment.
                    </p>
                    <Button
                        type="button"
                        onClick={onAuthRequired}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#333]"
                    >
                        Log in to comment
                    </Button>
                </div>
            ) : isFinalized ? (
                <div className="flex flex-1 items-center justify-center py-6 text-xs text-[#bbb]">
                    This dispute is finalized and cannot receive further comments.
                </div>
            ) : (
                <div className="flex flex-1 flex-col gap-3">
                    <textarea
                        rows={6}
                        placeholder="Add a comment…"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className={`w-full flex-1 resize-none rounded-lg ${SURFACE_BORDER} bg-[#fafafa] px-4 py-3 text-sm text-[#1a1a1a] outline-none transition-all placeholder:text-[#ccc] focus:border-[#1a1a1a] focus:bg-white focus:ring-1 focus:ring-[#1a1a1a]/10`}
                    />

                    {commentFiles.length > 0 && (
                        <ul className="space-y-1">
                            {commentFiles.map((file, i) => (
                                <li
                                    key={`${file.name}-${file.size}-${i}`}
                                    className={`flex items-center justify-between rounded-lg ${SURFACE_BORDER} px-3 py-1.5 text-[11px] text-[#555]`}
                                >
                                    <div className="min-w-0 flex items-center gap-1.5">
                                        <Paperclip className="size-3 shrink-0 text-[#aaa]" />
                                        <span className="truncate">{file.name}</span>
                                    </div>
                                    <IconButton
                                        onClick={() =>
                                            setCommentFiles((cur) => cur.filter((_, ci) => ci !== i))
                                        }
                                        className="ml-2 text-red-500 hover:bg-red-50"
                                    >
                                        <X className="size-3" />
                                    </IconButton>
                                </li>
                            ))}
                        </ul>
                    )}

                    {postError && <p className="text-xs text-red-500">{postError}</p>}

                    <div className="flex items-center justify-between gap-3">
                        <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-[#888] transition-colors hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
                        >
                            <Paperclip className="size-3.5" />
                            Attach
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length === 0) return;
                                setCommentFiles((cur) => [...cur, ...files]);
                                e.target.value = "";
                            }}
                        />
                        <div className="ml-auto flex items-center gap-2">
                            <Button
                                type="button"
                                onClick={() => { setComment(""); setCommentFiles([]); }}
                                disabled={posting || !canSubmit}
                                className="rounded-lg px-3 py-1.5 text-sm text-[#888] transition-colors hover:bg-[#f5f5f5] hover:text-[#1a1a1a] disabled:opacity-40"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => void onSubmit()}
                                disabled={posting || !canSubmit}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-40"
                            >
                                {posting ? <span className="text-xs">Posting…</span> : (<><Send className="size-3.5" />Submit</>)}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </SectionCard>
    );
}

/* -------------------------------------------------------------------------- */
/*                              Edit Dialog                                   */
/* -------------------------------------------------------------------------- */

type EditableDisputeSeed = {
    disputeId: string;
    campaignId?: string | null;
    influencerId: string;
    influencerName?: string | null;
    subject: string;
    description?: string | null;
    issueType?: string[];
};

export function EditDisputeDialog({
    open,
    onOpenChange,
    onSuccess,
    dispute,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSuccess?: () => void;
    dispute: EditableDisputeSeed;
}) {
    return (
        <DisputeFormDialog
            open={open}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
            title="Edit Dispute"
            submitLabel="Save Changes"
            disputeId={dispute.disputeId}
            lockedCampaignId={dispute.campaignId || undefined}
            disableInfluencer
            initialValues={{
                campaignId: dispute.campaignId || "",
                influencerId: dispute.influencerId,
                subject: dispute.subject,
                description: dispute.description || "",
                issueType: dispute.issueType?.length ? dispute.issueType : ["other"],
            }}
            influencerDisplayName={dispute.influencerName || undefined}
            onSubmit={async ({ brandId, values, removedExistingUrls }) => {
                const resolvedBrandId = String(brandId || "").trim();

                if (!resolvedBrandId) {
                    throw new Error("Please log in again to edit this dispute.");
                }

                await apiEditDispute({
                    disputeId: dispute.disputeId,
                    brandId: resolvedBrandId,
                    subject: values.subject,
                    description: values.description,
                    issueType: values.issueType,
                    attachments: values.attachments,
                    removedAttachmentUrls: removedExistingUrls,
                });
            }}
        />
    );
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default function BrandDisputeDetailPage() {
    const params = useParams<{ slug: string }>();
    const slug = params?.slug ?? "";

    const router = useRouter();
    const { requireAuth } = useAuthGate();

    const disputeId = slug.match(/^([a-z0-9]+)/i)?.[1] ?? slug;

    // ── Auth state ─────────────────────────────────────────────────────────────
    const [brandId, setBrandId] = useState<string | null>(null);
    const [authResolved, setAuthResolved] = useState(false);
    const isAuthenticated = Boolean(brandId);

    // ── Data state ─────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dispute, setDispute] = useState<Dispute | null>(null);
    const [brandLite, setBrandLite] = useState<BrandLiteResponse | null>(null);

    // ── Composer state ─────────────────────────────────────────────────────────
    const [comment, setComment] = useState("");
    const [commentFiles, setCommentFiles] = useState<File[]>([]);
    const [posting, setPosting] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);

    // ── Revoke state ───────────────────────────────────────────────────────────
    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);
    const [revokeError, setRevokeError] = useState<string | null>(null);

    // ── Misc ───────────────────────────────────────────────────────────────────
    const [lightbox, setLightbox] = useState<LightboxState | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Resolve auth from localStorage ────────────────────────────────────────
    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem("brandId");
        setBrandId(stored ?? null);  // null = unauthenticated (not an error for public view)
        setAuthResolved(true);
    }, []);

    // ── Fetch brand lite (only when authed) ───────────────────────────────────
    useEffect(() => {
        if (!brandId) return;
        let cancelled = false;

        (async () => {
            try {
                const data = await apiGetBrandLite(brandId);
                if (!cancelled) setBrandLite(data ?? null);
            } catch {
                if (!cancelled) setBrandLite(null);
            }
        })();

        return () => { cancelled = true; };
    }, [brandId]);

    // ── Load dispute ──────────────────────────────────────────────────────────
    // Public view: pass brandId only when available; your API may have a public
    // endpoint that doesn't require it — adjust the URL/params accordingly.
    const loadDispute = useCallback(async () => {
        if (!disputeId) {
            setError("Invalid dispute ID.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Use the public endpoint — no brandId, no auth token
            const response = await get<DisputeResponse>(
                `dispute/public/${disputeId}`
                // no second argument = no headers/params sent
            );
            setDispute(response.dispute);
        } catch (e) {
            setError(getErrorMessage(e, "Failed to load dispute."));
        } finally {
            setLoading(false);
        }
    }, [disputeId]); // ← removed brandId dependency

    useEffect(() => {
        if (!authResolved) return;
        void loadDispute();
    }, [authResolved, loadDispute]);

    // ── Auth-gated action helper ───────────────────────────────────────────────
    // Redirects to /brand/login?returnUrl=<current path> when not authed.
    const handleAuthGatedAction = useCallback(
        (onAuthed: () => void) => {
            requireAuth(brandId, disputeId, onAuthed);
        },
        [brandId, disputeId, requireAuth]
    );

    // ── Lightbox ───────────────────────────────────────────────────────────────
    const handleOpenLightbox = useCallback(
        (images: Attachment[], index: number) => setLightbox({ images, index }),
        []
    );
    const handleCloseLightbox = useCallback(() => setLightbox(null), []);

    // ── Revoke ─────────────────────────────────────────────────────────────────
    const handleRevokeClick = useCallback(() => {
        handleAuthGatedAction(() => {
            setRevokeError(null);
            setIsRevokeModalOpen(true);
        });
    }, [handleAuthGatedAction]);

    const handleCloseRevokeModal = useCallback(() => {
        if (isRevoking) return;
        setIsRevokeModalOpen(false);
        setRevokeError(null);
    }, [isRevoking]);

    const handleConfirmRevoke = useCallback(async () => {
        if (!brandId || !disputeId || isRevoking) return;
        setIsRevoking(true);
        setRevokeError(null);

        try {
            await apiRevokeDispute({ disputeId, brandId });
            setIsRevokeModalOpen(false);
            Swal.fire({
                icon: "success",
                title: "Dispute Withdrawn",
                text: "This dispute has been successfully withdrawn and marked as closed.",
                confirmButtonText: "OK",
                customClass: {
                    popup: "swal2-border-radius",
                    confirmButton: "swal2-confirm-button",
                },
            });
        } catch (e) {
            setRevokeError(getErrorMessage(e, "Failed to revoke dispute."));
        } finally {
            setIsRevoking(false);
        }
    }, [brandId, disputeId, isRevoking]);

    // ── Edit ───────────────────────────────────────────────────────────────────
    const handleEditClick = useCallback(() => {
        handleAuthGatedAction(() => setIsEditDialogOpen(true));
    }, [handleAuthGatedAction]);

    // ── Post comment ───────────────────────────────────────────────────────────
    const handlePostComment = useCallback(async () => {
        if (!disputeId || !brandId) return;
        const trimmed = comment.trim();
        if (!trimmed && commentFiles.length === 0) return;

        setPosting(true);
        setPostError(null);

        try {
            const formData = new FormData();
            formData.append("brandId", brandId);
            formData.append("text", trimmed || " ");
            commentFiles.forEach((f) => formData.append("attachments", f));

            await postFormData(`/dispute/brand/${disputeId}/comment`, formData);
            setComment("");
            setCommentFiles([]);
            await loadDispute();
        } catch (e) {
            setPostError(getErrorMessage(e, "Failed to post comment."));
        } finally {
            setPosting(false);
        }
    }, [brandId, comment, commentFiles, disputeId, loadDispute]);

    // ── Derived ────────────────────────────────────────────────────────────────
    const derived = useMemo(() => {
        if (!dispute) {
            return {
                daysOpen: 0,
                daysLeftLabel: "",
                isFinalized: false,
                imageAttachments: [] as Attachment[],
                fileAttachments: [] as Attachment[],
                metaItems: [] as MetaItem[],
            };
        }

        const daysOpen = daysSince(dispute.createdAt);

        return {
            daysOpen,
            daysLeftLabel: formatDaysLeft(daysOpen),
            isFinalized:
                dispute.status === "resolved" ||
                dispute.status === "rejected" ||
                dispute.status === "revoked",
            imageAttachments: getImageAttachments(dispute.attachments),
            fileAttachments: getFileAttachments(dispute.attachments),
            metaItems: [
                { label: "Dispute By", value: dispute.viewerIsRaiser ? "You" : dispute.raisedBy?.name || "—" },
                { label: "Dispute Against", value: dispute.raisedAgainst?.name || "—", sub: formatHandle(dispute.raisedAgainst?.handle) || undefined },
                { label: "Dispute Type", value: formatIssueTypeLabel(dispute.issueType?.[0]) },
                { label: "Dispute ID", value: dispute.disputeId || "—" },
                { label: "Dispute age", value: formatDaysLeft(daysOpen) },
            ] as MetaItem[],
        };
    }, [dispute]);

    // ── Render ─────────────────────────────────────────────────────────────────
    if (loading) return <LoadingState />;

    if (error || !dispute) {
        return (
            <ErrorState
                message={error || "Dispute not found."}
                onBack={() => router.back()}
            />
        );
    }

    return (
        <>
            <div className="min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');`}</style>

                <div className={`space-y-4 ${PAGE_GUTTER}`}>
                    {/* ── Header card ─────────────────────────────────────────────────── */}
                    <SectionCard className="py-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <h1 className="truncate text-xl font-semibold leading-tight text-[#1a1a1a]">
                                    {dispute.subject}
                                </h1>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-[#999]">ID: {dispute.disputeId}</span>
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5 text-xs text-[#666]">
                                    <Clock className="size-3.5" />
                                    <span>{derived.daysLeftLabel}</span>
                                </div>

                                <StatusPill status={dispute.status} />

                                {/* Edit & Revoke — visible always, auth-gated on click */}
                                {!derived.isFinalized && (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleEditClick}
                                            className="!h-[2.25rem]"
                                        >
                                            <span className="flex items-center gap-2">
                                                <NotePencilIcon className="size-4" />
                                                Edit Dispute
                                            </span>
                                        </Button>

                                        <Button
                                            type="button"
                                            onClick={handleRevokeClick}
                                            variant="outline"
                                            className="inline-flex !h-[2.25rem] items-center gap-1.5 rounded-lg !border !border-[#E35141] px-3 py-1.5 text-xs font-medium !text-[#E35141] transition-colors"
                                        >
                                            <span className="flex items-center gap-2">
                                                <ArrowUUpLeftIcon className="size-4" />
                                                Revoke Dispute
                                            </span>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        <MetaGrid items={derived.metaItems} />
                    </SectionCard>

                    {/* ── Description ─────────────────────────────────────────────────── */}
                    <SectionCard className={`${SURFACE_BORDER} px-6 py-5`}>
                        <div className={`mb-3 flex items-center gap-1 border-b ${SUBTLE_BORDER} pb-3`}>
                            <div className="flex size-5 items-center justify-center">
                                <NoteIcon className="size-4" />
                            </div>
                            <h2 className="text-sm font-semibold text-[#1a1a1a]">Dispute Summary</h2>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#555]">
                            {dispute.description || "No description provided."}
                        </p>
                        {dispute.campaignName && (
                            <p className="mt-3 text-xs text-[#888]">
                                Campaign:{" "}
                                <span className="font-medium text-[#555]">{dispute.campaignName}</span>
                            </p>
                        )}
                    </SectionCard>

                    <AttachmentGallery
                        imageAttachments={derived.imageAttachments}
                        fileAttachments={derived.fileAttachments}
                        onOpenLightbox={handleOpenLightbox}
                    />

                    <ProgressTracker
                        status={dispute.status}
                        title="We're verifying the dispute, thanks for your Patience"
                    />

                    <FaqSection />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <ActivityFeed
                            dispute={dispute}
                            onOpenLightbox={handleOpenLightbox}
                            brandLogoUrl="/logo.png"
                            brandProfilePic={brandLite?.profilePic}
                        />

                        <CommentComposer
                            otherParty={dispute.raisedAgainst}
                            isFinalized={derived.isFinalized}
                            isAuthenticated={isAuthenticated}
                            comment={comment}
                            setComment={setComment}
                            commentFiles={commentFiles}
                            setCommentFiles={setCommentFiles}
                            posting={posting}
                            postError={postError}
                            fileInputRef={fileInputRef}
                            onSubmit={handlePostComment}
                            onAuthRequired={() =>
                                handleAuthGatedAction(() => {/* already authed, no-op */ })
                            }
                        />
                    </div>
                </div>
            </div>

            {/* ── Dialogs / overlays ───────────────────────────────────────────────── */}
            <EditDisputeDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSuccess={() => void loadDispute()}
                dispute={{
                    disputeId: dispute.disputeId,
                    campaignId: dispute.campaignId,
                    influencerId: dispute.influencerId,
                    influencerName: dispute.raisedAgainst?.name || null,
                    subject: dispute.subject,
                    description: dispute.description,
                    issueType: dispute.issueType,
                }}
            />

            <ConfirmActionModal
                open={isRevokeModalOpen}
                onClose={handleCloseRevokeModal}
                onConfirm={handleConfirmRevoke}
                isSubmitting={isRevoking}
                error={revokeError}
                title="Withdraw Dispute"
                description={
                    <>
                        You are about to{" "}
                        <span className="font-semibold text-[#1a1a1a]">
                            withdraw this dispute
                        </span>{" "}
                        request. Once withdrawn, the dispute will be closed and cannot be
                        reopened.
                    </>
                }
                confirmLabel="Withdraw"
                confirmLoadingLabel="Withdrawing..."
                cancelLabel="Cancel"
            />

            {lightbox && (
                <LightboxModal
                    images={lightbox.images}
                    index={lightbox.index}
                    onClose={handleCloseLightbox}
                />
            )}
        </>
    );
}