"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    FolderOpen,
    Loader2,
    MessageSquareMore,
    PlusCircle,
    Wallet,
    X,
} from "lucide-react";

import { Button } from "@/components/ui/buttonComp";
import { toast } from "@/components/ui/toast";
import {
    apiCreateDeliverableApproval,
    apiGetMilestonesByInfluencer,
    apiListDeliverablesByCampaign,
    getApiErrorMessage,
} from "@/app/influencer/services/influencerApi";

type PayoutStatus = "pending" | "initiated" | "paid";
type ModalMode = "deliverable" | "revision";

type CampaignMilestoneRow = {
    milestoneHistoryId: string;
    milestoneId: string;
    campaignId: string;
    brandId: string;
    influencerId: string;
    influencerName?: string;
    name?: string;
    influencer?: {
        name?: string;
    };
    milestoneTitle: string;
    milestoneDescription?: string;
    amount: number;
    payoutStatus: PayoutStatus;
    status?: string;
    released?: boolean;
    createdAt?: string | null;
    releasedAt?: string | null;
    [key: string]: any;
};

type CampaignDeliverableRow = {
    milestoneId?: string;
    milestoneHistoryId?: string;
    campaignId?: string;
    influencerId?: string;
    title?: string;
    description?: string;
    status?: string;
    createdAt?: string | null;
    updatedAt?: string | null;
    [key: string]: any;
};

type DraftLinkRow = {
    label: string;
    url: string;
};

type DeliverableFormState = {
    title: string;
    description: string;
    draftLinks: DraftLinkRow[];
};

function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    }).format(Number(amount || 0));
}

function formatDate(value?: string | null) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
}

function normalizePayoutStatus(row: any): PayoutStatus {
    const payoutStatus = String(row?.payoutStatus || "").toLowerCase();
    const status = String(row?.status || "").toLowerCase();

    if (
        payoutStatus === "paid" ||
        status.includes("paid") ||
        status.includes("released") ||
        row?.released ||
        row?.releasedAt
    ) {
        return "paid";
    }

    if (
        payoutStatus === "initiated" ||
        status.includes("initiated") ||
        status.includes("processing")
    ) {
        return "initiated";
    }

    return "pending";
}

function isReleased(row: CampaignMilestoneRow) {
    const status = String(row.status || "").toLowerCase();
    return (
        !!row.released ||
        !!row.releasedAt ||
        row.payoutStatus === "paid" ||
        status.includes("released") ||
        status.includes("paid")
    );
}

function isRevisionStatus(value?: string) {
    const status = String(value || "").toLowerCase();

    return (
        status.includes("revision") ||
        status.includes("revise") ||
        status.includes("changes requested") ||
        status.includes("change requested") ||
        status.includes("needs revision") ||
        status.includes("need revision") ||
        status.includes("rework")
    );
}

function hasRevisionRequest(
    milestone: CampaignMilestoneRow,
    deliverable?: CampaignDeliverableRow | null
) {
    return (
        isRevisionStatus(milestone.status) ||
        isRevisionStatus(deliverable?.status)
    );
}

function statusBadge(
    row: CampaignMilestoneRow,
    deliverable?: CampaignDeliverableRow | null
) {
    if (isReleased(row)) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Released
            </span>
        );
    }

    if (hasRevisionRequest(row, deliverable)) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                <MessageSquareMore className="h-3.5 w-3.5" />
                Revision Requested
            </span>
        );
    }

    if (row.payoutStatus === "initiated") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                <Clock3 className="h-3.5 w-3.5" />
                Initiated
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            <Clock3 className="h-3.5 w-3.5" />
            Pending
        </span>
    );
}

function normalizeMilestone(row: any): CampaignMilestoneRow {
    return {
        milestoneHistoryId: String(row?.milestoneHistoryId || row?._id || ""),
        milestoneId: String(row?.milestoneId || ""),
        campaignId: String(row?.campaignId || ""),
        brandId: String(row?.brandId || ""),
        influencerId: String(row?.influencerId || ""),
        influencerName:
            row?.influencerName ||
            row?.influencer?.name ||
            row?.name ||
            "",
        milestoneTitle:
            row?.milestoneTitle ||
            row?.title ||
            row?.name ||
            "Untitled Milestone",
        milestoneDescription:
            row?.milestoneDescription ||
            row?.description ||
            "",
        amount: Number(row?.amount || 0),
        payoutStatus: normalizePayoutStatus(row),
        status: row?.status || "",
        released: !!row?.released,
        createdAt: row?.createdAt || null,
        releasedAt: row?.releasedAt || null,
        ...row,
    };
}

function normalizeDeliverable(row: any): CampaignDeliverableRow {
    return {
        milestoneId: row?.milestoneId ? String(row.milestoneId) : "",
        milestoneHistoryId: row?.milestoneHistoryId
            ? String(row.milestoneHistoryId)
            : "",
        campaignId: row?.campaignId ? String(row.campaignId) : "",
        influencerId: row?.influencerId ? String(row.influencerId) : "",
        title: row?.title || "",
        description: row?.description || "",
        status: row?.status || "",
        createdAt: row?.createdAt || null,
        updatedAt: row?.updatedAt || null,
        ...row,
    };
}

function getItemTime(item?: { createdAt?: string | null; updatedAt?: string | null }) {
    return new Date(item?.createdAt || item?.updatedAt || "").getTime() || 0;
}

export default function InfluencerMilestonesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const campaignId = searchParams.get("campaignId") || searchParams.get("id") || "";
    const campaignTitle = searchParams.get("campaignTitle") || "My Milestones";

    const [milestones, setMilestones] = useState<CampaignMilestoneRow[]>([]);
    const [deliverables, setDeliverables] = useState<CampaignDeliverableRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [influencerId, setInfluencerId] = useState("");
    const [token, setToken] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>("deliverable");
    const [activeMilestone, setActiveMilestone] = useState<CampaignMilestoneRow | null>(null);
    const [activeDeliverable, setActiveDeliverable] = useState<CampaignDeliverableRow | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState("");

    const [form, setForm] = useState<DeliverableFormState>({
        title: "",
        description: "",
        draftLinks: [{ label: "", url: "" }],
    });

    const loadMilestones = useCallback(
        async (currentInfluencerId?: string, currentToken?: string) => {
            const finalInfluencerId =
                currentInfluencerId ||
                influencerId ||
                (typeof window !== "undefined"
                    ? localStorage.getItem("influencerId") ||
                      localStorage.getItem("userId") ||
                      ""
                    : "");

            const finalToken =
                currentToken ||
                token ||
                (typeof window !== "undefined"
                    ? localStorage.getItem("influencerToken") ||
                      localStorage.getItem("token") ||
                      ""
                    : "");

            if (!finalInfluencerId) {
                setLoading(false);
                toast({
                    icon: "error",
                    title: "Influencer ID not found",
                    text: "Please log in again and try once more.",
                });
                return;
            }

            try {
                setLoading(true);

                const [milestoneRes, deliverableRes] = await Promise.all([
                    apiGetMilestonesByInfluencer(finalInfluencerId, finalToken),
                    campaignId
                        ? apiListDeliverablesByCampaign(campaignId, { token: finalToken })
                        : Promise.resolve(null),
                ]);

                const milestoneRows = Array.isArray(milestoneRes?.milestones)
                    ? milestoneRes.milestones.map(normalizeMilestone)
                    : [];

                const filteredMilestones = campaignId
                    ? milestoneRows.filter(
                          (item) => String(item.campaignId) === String(campaignId)
                      )
                    : milestoneRows;

                setMilestones(filteredMilestones);

                const rawDeliverables = Array.isArray(deliverableRes?.data)
                    ? deliverableRes.data.map(normalizeDeliverable)
                    : [];

                const filteredDeliverables = rawDeliverables.filter((item) => {
                    if (!campaignId) return true;
                    const sameCampaign =
                        !item.campaignId || String(item.campaignId) === String(campaignId);
                    const sameInfluencer =
                        !item.influencerId ||
                        String(item.influencerId) === String(finalInfluencerId);

                    return sameCampaign && sameInfluencer;
                });

                setDeliverables(filteredDeliverables);
            } catch (err: any) {
                toast({
                    icon: "error",
                    title: "Failed to load milestones",
                    text: getApiErrorMessage(
                        err,
                        "Something went wrong while loading milestones."
                    ),
                });
            } finally {
                setLoading(false);
            }
        },
        [campaignId, influencerId, token]
    );

    useEffect(() => {
        if (typeof window === "undefined") return;

        const savedInfluencerId =
            localStorage.getItem("influencerId") ||
            localStorage.getItem("userId") ||
            searchParams.get("influencerId") ||
            "";

        const savedToken =
            localStorage.getItem("influencerToken") ||
            localStorage.getItem("token") ||
            "";

        setInfluencerId(savedInfluencerId);
        setToken(savedToken);

        loadMilestones(savedInfluencerId, savedToken);
    }, [loadMilestones, searchParams]);

    const sortedMilestones = useMemo(() => {
        return [...milestones].sort(
            (a, b) =>
                new Date(b.createdAt || "").getTime() -
                new Date(a.createdAt || "").getTime()
        );
    }, [milestones]);

    const latestDeliverableByKey = useMemo(() => {
        const map = new Map<string, CampaignDeliverableRow>();

        for (const item of deliverables) {
            const keys = [
                String(item.milestoneHistoryId || ""),
                String(item.milestoneId || ""),
            ].filter(Boolean);

            for (const key of keys) {
                const prev = map.get(key);
                if (!prev || getItemTime(item) >= getItemTime(prev)) {
                    map.set(key, item);
                }
            }
        }

        return map;
    }, [deliverables]);

    const openDeliverableModal = (
        row: CampaignMilestoneRow,
        mode: ModalMode,
        relatedDeliverable?: CampaignDeliverableRow | null
    ) => {
        setActiveMilestone(row);
        setActiveDeliverable(relatedDeliverable || null);
        setModalMode(mode);
        setModalError("");

        const revisionBase =
            relatedDeliverable?.description?.trim() ||
            relatedDeliverable?.title?.trim() ||
            row.milestoneTitle;

        setForm({
            title:
                mode === "revision"
                    ? `Revised : ${revisionBase}`
                    : row.milestoneTitle,
            description: "",
            draftLinks: [{ label: "", url: "" }],
        });

        setIsModalOpen(true);
    };

    const closeModal = () => {
        if (submitting) return;
        setIsModalOpen(false);
        setActiveMilestone(null);
        setActiveDeliverable(null);
        setModalError("");
        setForm({
            title: "",
            description: "",
            draftLinks: [{ label: "", url: "" }],
        });
    };

    const updateDraftLink = (
        index: number,
        field: keyof DraftLinkRow,
        value: string
    ) => {
        setModalError("");
        setForm((prev) => ({
            ...prev,
            draftLinks: prev.draftLinks.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));
    };

    const addDraftLinkRow = () => {
        setModalError("");
        setForm((prev) => ({
            ...prev,
            draftLinks: [...prev.draftLinks, { label: "", url: "" }],
        }));
    };

    const handleSeeDeliverable = (row: CampaignMilestoneRow) => {
        router.push(
            `/influencer/deliverables?campaignId=${encodeURIComponent(
                row.campaignId
            )}&milestoneHistoryId=${encodeURIComponent(row.milestoneHistoryId)}`
        );
    };

    const handleAllDeliverables = () => {
        const base = "/influencer/deliverables";
        router.push(
            campaignId
                ? `${base}?campaignId=${encodeURIComponent(campaignId)}`
                : base
        );
    };

    const handleSubmitDeliverable = async () => {
        if (!activeMilestone) return;

        const cleanedDraftLinks = form.draftLinks
            .map((item) => ({
                label: item.label.trim(),
                url: item.url.trim(),
            }))
            .filter((item) => item.label && item.url);

        const finalTitle = form.title.trim();

        if (!finalTitle) {
            setModalError("Title is missing.");
            return;
        }

        if (!form.description.trim()) {
            setModalError("Please enter a description.");
            return;
        }

        if (cleanedDraftLinks.length === 0) {
            setModalError("Please add at least one draft link.");
            return;
        }

        const hasIncompleteRow = form.draftLinks.some(
            (item) => !item.label.trim() || !item.url.trim()
        );

        if (hasIncompleteRow) {
            setModalError("All draft link fields are required.");
            return;
        }

        if (!activeMilestone.brandId) {
            setModalError("Brand ID is missing for this milestone.");
            return;
        }

        if (!activeMilestone.campaignId) {
            setModalError("Campaign ID is missing for this milestone.");
            return;
        }

        if (!activeMilestone.milestoneHistoryId) {
            setModalError("Milestone history ID is missing.");
            return;
        }

        try {
            setSubmitting(true);
            setModalError("");

            await apiCreateDeliverableApproval(
                {
                    brandId: activeMilestone.brandId,
                    influencerId: activeMilestone.influencerId || influencerId,
                    campaignId: activeMilestone.campaignId,
                    title: finalTitle,
                    description: form.description.trim(),
                    url: cleanedDraftLinks.map((item) => item.url),
                    milestoneHistoryId: activeMilestone.milestoneHistoryId,
                },
                token
            );

            const currentInfluencerId =
                activeMilestone.influencerId || influencerId;
            const currentToken = token;

            closeModal();
            await loadMilestones(currentInfluencerId, currentToken);

            toast({
                icon: "success",
                title:
                    modalMode === "revision"
                        ? "Revision submitted"
                        : "Deliverable submitted",
                text:
                    modalMode === "revision"
                        ? "Your revision has been sent successfully."
                        : "Your deliverable has been sent successfully.",
            });
        } catch (err: any) {
            setModalError(
                getApiErrorMessage(
                    err,
                    "Failed to submit deliverable. Please try again."
                )
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="mx-auto min-h-screen max-w-7xl space-y-6 p-4 md:p-8">
                <div className="sticky top-0 z-20 rounded-xl border border-gray-200 bg-white/90 p-4 backdrop-blur">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                            <div className="text-xs font-medium uppercase tracking-wide text-[#7A7A7A]">
                                My Milestones
                            </div>
                            <h1 className="truncate text-2xl font-bold text-[#1A1A1A] md:text-3xl">
                                {campaignTitle}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={handleAllDeliverables}
                            >
                                <FolderOpen className="mr-2 h-4 w-4" />
                                All Deliverables
                            </Button>

                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                        <div className="flex items-center justify-center gap-2 text-sm text-[#6F6F6F]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading milestones...
                        </div>
                    </div>
                ) : sortedMilestones.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F5F5]">
                            <Wallet className="h-6 w-6 text-[#6F6F6F]" />
                        </div>
                        <div className="mt-4 text-lg font-semibold text-[#1A1A1A]">
                            No milestones found
                        </div>
                        <div className="mt-1 text-sm text-[#6F6F6F]">
                            No milestones are available right now.
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedMilestones.map((row) => {
                            const latestDeliverable =
                                latestDeliverableByKey.get(row.milestoneHistoryId) ||
                                latestDeliverableByKey.get(row.milestoneId) ||
                                null;

                            const released = isReleased(row);
                            const revisionRequested = hasRevisionRequest(
                                row,
                                latestDeliverable
                            );
                            const hasSubmittedDeliverable = !!latestDeliverable;

                            const showAddDeliverable =
                                !released && !hasSubmittedDeliverable;

                            const showAddRevision =
                                !released &&
                                hasSubmittedDeliverable &&
                                revisionRequested;

                            const showLockedButton =
                                !released &&
                                hasSubmittedDeliverable &&
                                !revisionRequested;

                            return (
                                <div
                                    key={row.milestoneHistoryId}
                                    className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-base font-semibold text-[#1A1A1A]">
                                                    {row.milestoneTitle}
                                                </h3>
                                                {statusBadge(row, latestDeliverable)}
                                            </div>

                                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#5F5F5F]">
                                                <span className="inline-flex items-center gap-1">
                                                    {formatMoney(row.amount)}
                                                </span>

                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarDays className="h-4 w-4" />
                                                    Created: {formatDate(row.createdAt)}
                                                </span>

                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarDays className="h-4 w-4" />
                                                    Released: {formatDate(row.releasedAt)}
                                                </span>
                                            </div>

                                            {row.milestoneDescription ? (
                                                <p className="mt-3 text-sm leading-6 text-[#6A6A6A]">
                                                    {row.milestoneDescription}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            {showAddDeliverable ? (
                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        openDeliverableModal(
                                                            row,
                                                            "deliverable",
                                                            null
                                                        )
                                                    }
                                                    className="h-10 rounded-lg px-4"
                                                >
                                                    <PlusCircle className="mr-2 h-4 w-4" />
                                                    Add Deliverable
                                                </Button>
                                            ) : null}

                                            {showAddRevision ? (
                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        openDeliverableModal(
                                                            row,
                                                            "revision",
                                                            latestDeliverable
                                                        )
                                                    }
                                                    className="h-10 rounded-lg px-4"
                                                >
                                                    <MessageSquareMore className="mr-2 h-4 w-4" />
                                                    Add Revision
                                                </Button>
                                            ) : null}

                                            {showLockedButton ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled
                                                    className="h-10 rounded-lg px-4 opacity-60"
                                                >
                                                    Submitted
                                                </Button>
                                            ) : null}

                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => handleSeeDeliverable(row)}
                                                className="h-10 rounded-lg px-4"
                                            >
                                                <FolderOpen className="mr-2 h-4 w-4" />
                                                See Deliverable
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {isModalOpen && activeMilestone ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                            <div>
                                <h2 className="text-[18px] font-semibold text-[#1F2937]">
                                    {modalMode === "revision"
                                        ? "Add Revision"
                                        : "Add Deliverables"}
                                </h2>
                                <p className="mt-1 text-sm text-[#6B7280]">
                                    Title, description, and one or more draft links.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-md p-1 text-[#374151] hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-5 px-6 py-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#4B5563]">
                                        Title
                                    </label>

                                    {modalMode === "revision" ? (
                                        <input
                                            type="text"
                                            value={form.title}
                                            readOnly
                                            className="h-11 w-full rounded-xl border border-gray-300 bg-gray-100 px-4 text-sm text-[#6B7280] outline-none"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={form.title}
                                            onChange={(e) => {
                                                setModalError("");
                                                setForm((prev) => ({
                                                    ...prev,
                                                    title: e.target.value,
                                                }));
                                            }}
                                            placeholder="Instagram Reel - Product Demo"
                                            className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-gray-400"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#4B5563]">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={form.description}
                                        onChange={(e) => {
                                            setModalError("");
                                            setForm((prev) => ({
                                                ...prev,
                                                description: e.target.value,
                                            }));
                                        }}
                                        placeholder="30 sec reel with hook + CTA"
                                        className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB]">
                                <div className="border-b border-gray-200 px-4 py-3">
                                    <h3 className="text-sm font-semibold text-[#4B5563]">
                                        Draft Links
                                    </h3>
                                </div>

                                <div className="space-y-4 p-4">
                                    {form.draftLinks.map((item, index) => (
                                        <div
                                            key={index}
                                            className="rounded-2xl border border-gray-200 bg-white p-4"
                                        >
                                            <div className="mb-4 text-[15px] font-semibold text-[#1F2937]">
                                                Item {index + 1}
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-[#4B5563]">
                                                        Label
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={item.label}
                                                        onChange={(e) =>
                                                            updateDraftLink(
                                                                index,
                                                                "label",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder={`Draft ${index + 1}`}
                                                        className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-gray-400"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-[#4B5563]">
                                                        Url
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={item.url}
                                                        onChange={(e) =>
                                                            updateDraftLink(
                                                                index,
                                                                "url",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="https://drive.google.com/..."
                                                        className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-gray-400"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addDraftLinkRow}
                                        className="inline-flex h-11 items-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-[#1F2937] transition hover:bg-gray-50"
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add another URL
                                    </button>
                                </div>
                            </div>

                            {modalError ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {modalError}
                                </div>
                            ) : null}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm text-[#6B7280]">All fields are required.</p>

                            <div className="flex items-center justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeModal}
                                    disabled={submitting}
                                    className="h-11 rounded-xl border border-gray-300 px-5"
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="button"
                                    onClick={handleSubmitDeliverable}
                                    disabled={submitting}
                                    className="inline-flex h-11 items-center rounded-xl bg-[#F4D77A] px-6 text-sm font-medium text-[#374151] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}