"use client";

import {
    Link2,
    ExternalLink,
    MessageSquareText,
    Undo2,
} from "lucide-react";
import {
    Combobox,
    ComboboxContent,
    ComboboxItem,
    ComboboxList,
    ComboboxSeparator,
    ComboboxTrigger,
} from "@/components/ui/combobox";
import React, { useState } from "react";
import {
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    ImageOff,
} from "lucide-react";
import { DotsThreeIcon, GavelIcon } from "@phosphor-icons/react";
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import { Button } from "@/components/ui/buttonComp";
import Swal from "sweetalert2";
import { apiRevokeDispute } from "@/app/brand/services/brandApi";
import ConfirmActionModal from "@/components/common/disputes/ConfirmActionModal";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type DisputeStatus =
    | "open"
    | "in_review"
    | "awaiting_user"
    | "evidence_submitted"
    | "in_negotiation"
    | "resolution_proposed"
    | "resolved"
    | "rejected"
    | "revoked";

type Role = "Admin" | "Brand" | "Influencer";

type DisputeParty = {
    role: "Brand" | "Influencer";
    id: string;
    name?: string | null;
    handle?: string | null;
    provider?: string | null;
};

type Attachment = {
    url: string;
    originalName?: string | null;
    mimeType?: string | null;
    size?: number | null;
};

type Comment = {
    commentId: string;
    authorRole: Role;
    authorId: string;
    text: string;
    createdAt: string;
    attachments?: Attachment[];
};

type AssignedAdmin = {
    adminId?: string | null;
    name?: string | null;
};

export type Dispute = {
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

/* -------------------------------------------------------------------------- */
/*                                    Props                                   */
/* -------------------------------------------------------------------------- */

type DisputeThreeDotMenuProps = {
    status: string;
    onCopyDisputeLink?: () => void;
    onOpenInNewTab?: () => void;
    onRequestEscalation?: () => void;
    onAddCommentNote?: () => void;
    onRevokeDispute?: () => void;
};

export type DisputeTableProps = {
    rows: Dispute[];
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    brandId?: string | null;
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    pageNumbers: number[];
    onPageChange: (p: number) => void;
    viewBasePath?: string;
    onRevokeDispute?: (disputeId: string) => Promise<void>;
};

/* -------------------------------------------------------------------------- */
/*                          Status display helpers                            */
/* -------------------------------------------------------------------------- */

const STATUS_LABEL: Record<string, string> = {
    open: "Open",
    in_review: "In Review",
    awaiting_user: "Awaiting Response",
    evidence_submitted: "Evidence Submitted",
    in_negotiation: "In Negotiation",
    resolution_proposed: "Resolution Proposed",
    resolved: "Resolved",
    rejected: "Rejected",
    revoked: "Revoked",
};

const STATUS_COLORS: Record<string, string> = {
    open: "bg-blue-50 text-blue-700 border border-blue-200",
    in_review: "bg-purple-50 text-purple-700 border border-purple-200",
    awaiting_user: "bg-amber-50 text-amber-700 border border-amber-200",
    evidence_submitted: "bg-slate-100 text-slate-700 border border-slate-200",
    in_negotiation: "bg-orange-50 text-orange-700 border border-orange-200",
    resolution_proposed: "bg-cyan-50 text-cyan-700 border border-cyan-200",
    resolved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    rejected: "bg-red-50 text-red-600 border border-red-200",
    revoked: "bg-gray-100 text-gray-700 border border-gray-200",
};

function HeaderCarets() {
    const cls = "h-3 w-3 text-[#343330]";
    return (
        <span className="ml-1 flex flex-col items-center leading-none">
            <ChevronUp className={cls} strokeWidth={3} />
            <ChevronDown className={cls} strokeWidth={3} />
        </span>
    );
}

function DisputeImage({ src }: { src?: string | null }) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#E6E6E6] bg-gray-100">
                <ImageOff className="size-4 text-gray-300" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt="Dispute"
            onError={() => setFailed(true)}
            className="h-10 w-10 flex-shrink-0 rounded-lg border border-[#E6E6E6] object-cover"
        />
    );
}

const slugify = (value = "") =>
    String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

const formatHandle = (handle?: string | null) => {
    if (!handle) return null;
    return handle.startsWith("@") ? handle : `@${handle}`;
};

const getDisputeImageUrl = (row: Dispute) => {
    return (
        row.attachments?.find((file) => file?.mimeType?.startsWith("image/"))?.url ??
        null
    );
};

export function DisputeTable({
    rows,
    loading,
    error,
    onRetry,
    brandId,
    page,
    totalPages,
    total,
    pageSize,
    pageNumbers,
    onPageChange,
    viewBasePath = "/brand/disputes",
    onRevokeDispute,
}: DisputeTableProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
    const [isRevoking, setIsRevoking] = useState(false);
    const [revokeError, setRevokeError] = useState<string | null>(null);

    const handleRevokeConfirm = async () => {
        if (!revokeTarget) return;

        setIsRevoking(true);
        setRevokeError(null);

        try {
            if (onRevokeDispute) {
                await onRevokeDispute(revokeTarget);
            } else {
                await apiRevokeDispute({
                    disputeId: revokeTarget,
                    brandId: brandId ?? null,
                });
            }

            setRevokeTarget(null);
            onRetry();
        } catch {
            setRevokeError(
                "Something went wrong while revoking the dispute. Please try again."
            );
        } finally {
            setIsRevoking(false);
        }
    };

    const handleRevokeClose = () => {
        if (isRevoking) return;
        setRevokeTarget(null);
        setRevokeError(null);
    };

    const allSelected =
        rows.length > 0 && rows.every((r) => selected.has(r.disputeId));

    const toggleAll = () =>
        setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.disputeId)));

    const toggleOne = (id: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const col = {
        checkbox: "w-[3rem]",
        title: "min-w-[14rem] flex-[2_1_0%]",
        image: "w-[6.5rem] flex-shrink-0",
        campaign: "min-w-[12rem] flex-[1.8_1_0%]",
        status: "min-w-[9rem] flex-[1_1_0%]",
        raisedAgainst: "min-w-[10rem] flex-[1.4_1_0%]",
        date: "min-w-[8rem] flex-[1_1_0%]",
        action: "min-w-[9rem] flex-[1_1_0%]",
    };

    const headerCell =
        "flex w-full items-center justify-between text-sm font-semibold text-[#1A1A1A]";
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    return (
        <>
            <ConfirmActionModal
                open={revokeTarget !== null}
                onClose={handleRevokeClose}
                onConfirm={handleRevokeConfirm}
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
                confirmLabel="Delete"
                confirmLoadingLabel="Deleting..."
                cancelLabel="Cancel"
            />

            <div className="w-full overflow-x-auto">
                <div className="mt-[1.5rem] min-w-full w-max px-[2rem] pb-[2.5rem]">
                    <div className="flex h-12 items-center rounded-lg bg-[#E6E6E6] px-4">
                        <div className={col.checkbox}>
                            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                        </div>
                        <div className={`${col.title} px-2`}>
                            <div className={headerCell}>
                                <span>Dispute Title & ID</span>
                                <HeaderCarets />
                            </div>
                        </div>
                        <div className={`${col.image} px-2`}>
                            <div className={headerCell}>
                                <span>Image</span>
                                <HeaderCarets />
                            </div>
                        </div>
                        <div className={`${col.campaign} pl-5 pr-2`}>
                            <div className={headerCell}>
                                <span>Campaign Name</span>
                                <HeaderCarets />
                            </div>
                        </div>
                        <div className={`${col.status} px-2`}>
                            <div className={headerCell}>
                                <span>Status</span>
                                <HeaderCarets />
                            </div>
                        </div>
                        <div className={`${col.raisedAgainst} px-2`}>
                            <div className={headerCell}>
                                <span>Raised Against</span>
                                <HeaderCarets />
                            </div>
                        </div>
                        <div className={`${col.date} px-2`}>
                            <div className={headerCell}>
                                <span>Date</span>
                                <HeaderCarets />
                            </div>
                        </div>
                        <div className={`${col.action} px-2`}>
                            <span className="text-sm font-semibold">Action</span>
                        </div>
                    </div>

                    <div className="mt-[2rem] mt-3 flex flex-col gap-[0.75rem]">
                        {loading &&
                            Array.from({ length: 5 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex h-[5rem] items-center rounded-lg border border-[#D6D6D6] bg-white px-4 animate-pulse"
                                >
                                    <div className={col.checkbox}>
                                        <div className="h-4 w-4 rounded bg-gray-200" />
                                    </div>
                                    <div className={`${col.title} space-y-2 px-2`}>
                                        <div className="h-3.5 w-3/4 rounded bg-gray-200" />
                                        <div className="h-3 w-1/2 rounded bg-gray-100" />
                                    </div>
                                    <div className={`${col.image} flex items-center justify-center px-2`}>
                                        <div className="h-10 w-10 rounded-lg bg-gray-200" />
                                    </div>
                                    <div className={`${col.campaign} pl-5 pr-2`}>
                                        <div className="h-3.5 w-2/3 rounded bg-gray-200" />
                                    </div>
                                    <div className={`${col.status} px-2`}>
                                        <div className="h-6 w-20 rounded-full bg-gray-200" />
                                    </div>
                                    <div className={`${col.raisedAgainst} px-2`}>
                                        <div className="h-3.5 w-2/3 rounded bg-gray-200" />
                                    </div>
                                    <div className={`${col.date} px-2`}>
                                        <div className="h-3.5 w-24 rounded bg-gray-200" />
                                    </div>
                                    <div className={`${col.action} flex gap-2 px-2`}>
                                        <div className="h-8 w-16 rounded-xl bg-gray-200" />
                                        <div className="h-8 w-8 rounded-xl bg-gray-100" />
                                    </div>
                                </div>
                            ))}

                        {!loading && error && (
                            <div className="flex flex-col items-center justify-center gap-3 py-20 text-red-500">
                                <AlertCircle className="size-8" />
                                <p className="text-sm font-medium">{error}</p>
                                <button
                                    onClick={onRetry}
                                    className="text-xs text-[#1a1a1a] underline hover:opacity-70"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {!loading && !error && rows.length === 0 && (
                            <div className="flex flex-col items-center justify-center gap-3 py-20 text-[#888]">
                                <GavelIcon size={36} />
                                <p className="text-sm font-medium">No disputes found</p>
                                <p className="text-xs text-[#bbb]">
                                    Try adjusting your filters or search term
                                </p>
                            </div>
                        )}

                        {!loading &&
                            !error &&
                            rows.map((row) => (
                                <div
                                    key={row.disputeId}
                                    className="flex h-[5rem] items-center rounded-lg border border-[#D6D6D6] bg-white px-4 transition-colors hover:bg-[#fafafa]"
                                >
                                    <div className={col.checkbox}>
                                        <Checkbox
                                            checked={selected.has(row.disputeId)}
                                            onCheckedChange={() => toggleOne(row.disputeId)}
                                        />
                                    </div>

                                    <div className={`${col.title} px-2`}>
                                        <div className="truncate font-medium">{row.subject}</div>
                                        <div className="mt-0.5 truncate text-xs text-gray-400">
                                            #{row.disputeId}
                                        </div>
                                    </div>

                                    <div className={`${col.image} flex items-center justify-center px-2`}>
                                        <DisputeImage src={getDisputeImageUrl(row)} />
                                    </div>

                                    <div className={`${col.campaign} pl-5 pr-2`}>
                                        <span className="truncate text-sm text-gray-700">
                                            {row.campaignName ?? (
                                                <span className="text-xs italic text-gray-400">
                                                    No campaign
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    <div className={`${col.status} px-2`}>
                                        <span
                                            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[row.status] ?? "bg-gray-100 text-gray-600"
                                                }`}
                                        >
                                            {STATUS_LABEL[row.status] ?? row.status}
                                        </span>
                                    </div>

                                    <div className={`${col.raisedAgainst} px-2`}>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-[#1a1a1a]">
                                                {row.raisedAgainst?.name || "—"}
                                            </span>
                                            {row.raisedAgainst?.handle ? (
                                                <span className="text-xs text-[#888]">
                                                    {formatHandle(row.raisedAgainst.handle)}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-[#888]">-</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`${col.date} whitespace-nowrap px-2 text-sm text-gray-500`}>
                                        {new Date(row.createdAt).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "2-digit",
                                        })}
                                    </div>

                                    <div className={`${col.action} flex items-center gap-2`}>
                                        <Button
                                            className="!h-[2.0625rem] !w-[7rem] !rounded-[0.5rem] !px-[0.5rem] text-xs font-medium"
                                            onClick={() => {
                                                window.location.href = `${viewBasePath}/${row.disputeId}`;
                                            }}
                                        >
                                            View
                                        </Button>

                                        <DisputeThreeDotMenu
                                            status={row.status}
                                            onCopyDisputeLink={async () => {
                                                if (!row?.disputeId) {
                                                    await Swal.fire({
                                                        icon: "error",
                                                        title: "Missing dispute ID",
                                                        text: "We couldn't generate the dispute link.",
                                                        confirmButtonColor: "#1A1A1A",
                                                    });
                                                    return;
                                                }

                                                const disputeName = row?.subject || "untitled-dispute";
                                                const disputeSlug = slugify(disputeName);
                                                const disputePath = `/public/dispute/${encodeURIComponent(
                                                    row.disputeId
                                                )}-${disputeSlug}`;
                                                const disputeUrl = `${window.location.origin}${disputePath}`;

                                                try {
                                                    await navigator.clipboard.writeText(disputeUrl);
                                                    await Swal.fire({
                                                        icon: "success",
                                                        title: "Copied",
                                                        text: "Dispute link copied successfully.",
                                                        timer: 2000,
                                                        showConfirmButton: false,
                                                    });
                                                } catch {
                                                    try {
                                                        const textArea = document.createElement("textarea");
                                                        textArea.value = disputeUrl;
                                                        textArea.style.position = "fixed";
                                                        textArea.style.opacity = "0";
                                                        textArea.style.pointerEvents = "none";
                                                        document.body.appendChild(textArea);
                                                        textArea.focus();
                                                        textArea.select();
                                                        const copied = document.execCommand("copy");
                                                        document.body.removeChild(textArea);
                                                        if (!copied) throw new Error("Fallback copy failed");

                                                        await Swal.fire({
                                                            icon: "success",
                                                            title: "Copied",
                                                            text: "Dispute link copied successfully.",
                                                            confirmButtonColor: "#1A1A1A",
                                                        });
                                                    } catch {
                                                        await Swal.fire({
                                                            icon: "error",
                                                            title: "Copy failed",
                                                            text: "Unable to copy the dispute link. Please try again.",
                                                            confirmButtonColor: "#1A1A1A",
                                                        });
                                                    }
                                                }
                                            }}
                                            onOpenInNewTab={() => {
                                                if (!row?.disputeId) return;
                                                window.open(
                                                    `${viewBasePath}/${encodeURIComponent(row.disputeId)}`,
                                                    "_blank",
                                                    "noopener,noreferrer"
                                                );
                                            }}
                                            onRequestEscalation={() => { }}
                                            onAddCommentNote={() => { }}
                                            onRevokeDispute={() => {
                                                setRevokeError(null);
                                                setRevokeTarget(row.disputeId);
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                    </div>

                    {!loading && !error && totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between px-1">
                            <p className="text-sm text-gray-500">
                                Showing{" "}
                                <span className="font-medium text-[#1a1a1a]">
                                    {from}–{to}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium text-[#1a1a1a]">{total}</span>
                            </p>

                            <div className="flex items-center gap-1">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => onPageChange(page - 1)}
                                    className="flex size-8 items-center justify-center rounded-lg border border-[#e2e2e2] text-[#1a1a1a] transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft className="size-4" />
                                </button>

                                {pageNumbers.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => onPageChange(p)}
                                        className={`flex size-8 items-center justify-center rounded-lg text-sm transition-colors ${p === page
                                            ? "bg-[#1a1a1a] font-semibold text-white"
                                            : "border border-[#e2e2e2] text-[#1a1a1a] hover:bg-[#f5f5f5]"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}

                                <button
                                    disabled={page >= totalPages}
                                    onClick={() => onPageChange(page + 1)}
                                    className="flex size-8 items-center justify-center rounded-lg border border-[#e2e2e2] text-[#1a1a1a] transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export function DisputeThreeDotMenu({
    status,
    onCopyDisputeLink,
    onOpenInNewTab,
    onRequestEscalation,
    onAddCommentNote,
    onRevokeDispute,
}: DisputeThreeDotMenuProps) {
    const [value, setValue] = useState("");

    const handleAction = (nextValue: string | null) => {
        if (!nextValue) return;

        switch (nextValue) {
            case "copy_dispute_link":
                onCopyDisputeLink?.();
                break;
            case "open_in_new_tab":
                onOpenInNewTab?.();
                break;
            case "request_escalation":
                onRequestEscalation?.();
                break;
            case "add_comment_note":
                onAddCommentNote?.();
                break;
            case "revoke_dispute":
                onRevokeDispute?.();
                break;
            default:
                break;
        }

        setTimeout(() => setValue(""), 0);
    };

    return (
        <Combobox value={value} onValueChange={handleAction}>
            <ComboboxTrigger
                hideIcon
                aria-label="Dispute actions"
                className="inline-flex items-center justify-center !h-[2.2rem] !w-[2.5rem] !rounded-[0.75rem] !border !border-[#E5E5E5] !bg-white !px-[0.5rem] !shadow-none hover:!bg-[#FAFAFA]"
            >
                <DotsThreeIcon size={18} weight="bold" color="#1A1A1A" />
            </ComboboxTrigger>

            <ComboboxContent
                align="end"
                sideOffset={8}
                className="w-[16.75rem] rounded-[1.25rem] bg-white p-3 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            >
                <ComboboxList className="gap-1 px-0">
                    <ComboboxItem
                        value="copy_dispute_link"
                        showIndicator={false}
                        className="h-12 rounded-[0.75rem] px-3 data-[highlighted]:bg-[#F5F5F5] data-[selected]:bg-[#F5F5F5]"
                    >
                        <Link2 className="size-[1.1rem] text-[#1A1A1A]" />
                        <span className="text-[1rem] font-normal text-[#1A1A1A]">
                            Copy Dispute Link
                        </span>
                    </ComboboxItem>

                    <ComboboxItem
                        value="open_in_new_tab"
                        showIndicator={false}
                        className="h-12 rounded-[0.75rem] px-3 data-[highlighted]:bg-[#F5F5F5] data-[selected]:bg-[#F5F5F5]"
                    >
                        <ExternalLink className="size-[1.1rem] text-[#1A1A1A]" />
                        <span className="text-[1rem] font-normal text-[#1A1A1A]">
                            Open in new tab
                        </span>
                    </ComboboxItem>

                    <ComboboxItem
                        value="add_comment_note"
                        showIndicator={false}
                        className="h-12 rounded-[0.75rem] px-3 data-[highlighted]:bg-[#F5F5F5] data-[selected]:bg-[#F5F5F5]"
                    >
                        <MessageSquareText className="size-[1.1rem] text-[#1A1A1A]" />
                        <span className="text-[1rem] font-normal text-[#1A1A1A]">
                            Add Comment Note
                        </span>
                    </ComboboxItem>

                    <ComboboxSeparator className="my-2 bg-[#E9E9E9]" />

                    {status !== "revoked" ? (
                        <ComboboxItem
                            value="revoke_dispute"
                            showIndicator={false}
                            className="h-12 rounded-[0.75rem] px-3 text-[#FF4D3A] data-[highlighted]:bg-[#FFF5F4] data-[highlighted]:text-[#FF4D3A] data-[selected]:bg-[#FFF5F4] data-[selected]:text-[#FF4D3A]"
                        >
                            <Undo2 className="size-[1.1rem] text-[#FF4D3A]" />
                            <span className="text-[1rem] font-normal">Revoke Dispute</span>
                        </ComboboxItem>
                    ) : null}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}