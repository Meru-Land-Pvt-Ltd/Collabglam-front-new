"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
    Search,
    X,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/buttonComp";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import {
    apiGetAllInvitationsByInfluencer,
    getApiErrorMessage,
} from "@/app/influencer/services/influencerApi";

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

type ApiInviteStatus = "sent" | "accepted" | "reject";
type InviteTab = "all" | ApiInviteStatus;

interface Deliverable {
    quantity: number;
    type: string;
}

interface CampaignInvite {
    id: string;
    brandId?: string;
    campaignId?: string;
    brandName: string;
    brandAvatar?: string;
    invitedAt: string;
    respondBy: string;
    status: ApiInviteStatus;

    title: string;
    description: string;
    category: string;
    location: string;
    budgetMin: number;
    budgetMax: number;
    goals: string[];
    ageGroups: string[];

    overview: string;
    deliverables: Deliverable[];
    paymentMethod: string;
    paymentSchedule: string;
    brandMessage: string;
    contentSubmission: string;
    publishDate: string;
    campaignEnd: string;
}

/* -------------------------------------------------------------------------- */
/* CAMPAIGN DETAILS MODAL */
/* -------------------------------------------------------------------------- */

type Section = "overview" | "deliverables" | "payment" | "message" | "timeline";

function AccordionSection({
    title,
    icon,
    open,
    onToggle,
    children,
}: {
    id: Section;
    title: string;
    icon: React.ReactNode;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="border-b border-gray-100 last:border-0">
            <Button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50/50 transition-colors px-1 rounded-[1.75rem] bg-transparent shadow-none text-inherit"
            >
                <span className="flex items-center gap-2.5 font-semibold text-[15px] text-gray-900">
                    {icon}
                    {title}
                </span>
                <span className="text-gray-400">{open ? "−" : "+"}</span>
            </Button>

            {open && (
                <div className="pb-4 px-1 text-sm text-gray-700 leading-relaxed">
                    {children}
                </div>
            )}
        </div>
    );
}

function CampaignDetailsModal({
    invite,
    open,
    onClose,
    onAccept,
    onDecline,
}: {
    invite: CampaignInvite;
    open: boolean;
    onClose: () => void;
    onAccept: () => void;
    onDecline: () => void;
}) {
    const [openSections, setOpenSections] = useState<Set<Section>>(
        new Set(["overview", "deliverables", "payment", "message", "timeline"])
    );

    const toggle = (s: Section) =>
        setOpenSections((prev) => {
            const next = new Set(prev);
            next.has(s) ? next.delete(s) : next.add(s);
            return next;
        });

    const isPending = invite.status === "sent";
    const isAccepted = invite.status === "accepted";
    const isDeclined = invite.status === "reject";

    const statusBadge = isAccepted ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
        </span>
    ) : isDeclined ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-600">
            <XCircle className="h-3.5 w-3.5" /> Declined
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" /> Pending
        </span>
    );

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="w-full !max-w-[800px] max-h-[100vh] overflow-hidden rounded-[1.75rem] border p-0">
                <div className="flex-none px-6 pt-6 pb-4 border-b border-gray-100">
                    <DialogHeader className="text-left space-y-1">
                        <DialogTitle className="text-[18px] font-bold text-gray-900 leading-snug pr-8">
                            Campaign Details: <span className="text-gray-800">{invite.title}</span>
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">
                            Comprehensive overview of the collaboration opportunity.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FFBF00] to-[#FFDB58] flex items-center justify-center text-gray-900 font-bold text-sm shadow-sm">
                                {invite.brandAvatar ?? invite.brandName?.[0] ?? "B"}
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 text-sm">{invite.brandName}</div>
                                <div className="text-xs text-gray-500">Invited: {invite.invitedAt}</div>
                            </div>
                        </div>
                        {statusBadge}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-2">
                    <AccordionSection
                        id="overview"
                        title="Campaign Overview"
                        icon={<Clock className="h-4 w-4 text-[#FFBF00]" />}
                        open={openSections.has("overview")}
                        onToggle={() => toggle("overview")}
                    >
                        <p className="leading-relaxed">{invite.overview}</p>
                    </AccordionSection>

                    <AccordionSection
                        id="deliverables"
                        title="Deliverables"
                        icon={<CheckCircle2 className="h-4 w-4 text-[#FFBF00]" />}
                        open={openSections.has("deliverables")}
                        onToggle={() => toggle("deliverables")}
                    >
                        <ul className="space-y-2 mt-1">
                            {invite.deliverables.map((d, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[#FFF9E6] border border-[#FFBF00]/40 flex items-center justify-center text-[11px] font-bold text-[#996600]">
                                        {d.quantity}
                                    </span>
                                    <span className="text-gray-700">{d.type}</span>
                                </li>
                            ))}
                        </ul>
                    </AccordionSection>

                    <AccordionSection
                        id="payment"
                        title="Payment Details"
                        icon={<Clock className="h-4 w-4 text-[#FFBF00]" />}
                        open={openSections.has("payment")}
                        onToggle={() => toggle("payment")}
                    >
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 w-32 shrink-0 text-xs font-medium uppercase tracking-wide">
                                    Budget
                                </span>
                                <span className="font-semibold text-gray-900">
                                    ₹{invite.budgetMin.toLocaleString()} – ₹{invite.budgetMax.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-gray-500 w-32 shrink-0 text-xs font-medium uppercase tracking-wide">
                                    Method
                                </span>
                                <span>{invite.paymentMethod}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-gray-500 w-32 shrink-0 text-xs font-medium uppercase tracking-wide">
                                    Schedule
                                </span>
                                <span>{invite.paymentSchedule}</span>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection
                        id="message"
                        title="Brand Message"
                        icon={<Clock className="h-4 w-4 text-[#FFBF00]" />}
                        open={openSections.has("message")}
                        onToggle={() => toggle("message")}
                    >
                        <blockquote className="border-l-4 border-[#FFBF00] pl-4 italic text-gray-600 leading-relaxed">
                            {invite.brandMessage}
                        </blockquote>
                    </AccordionSection>

                    <AccordionSection
                        id="timeline"
                        title="Timeline & Deadlines"
                        icon={<Clock className="h-4 w-4 text-[#FFBF00]" />}
                        open={openSections.has("timeline")}
                        onToggle={() => toggle("timeline")}
                    >
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 w-44 shrink-0 text-xs font-medium uppercase tracking-wide">
                                    Response Deadline
                                </span>
                                <span className="font-semibold text-red-500">{invite.respondBy}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 w-44 shrink-0 text-xs font-medium uppercase tracking-wide">
                                    Content Submission
                                </span>
                                <span>{invite.contentSubmission}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 w-44 shrink-0 text-xs font-medium uppercase tracking-wide">
                                    Publish Date
                                </span>
                                <span>{invite.publishDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 w-44 shrink-0 text-xs font-medium uppercase tracking-wide">
                                    Campaign End
                                </span>
                                <span>{invite.campaignEnd}</span>
                            </div>
                        </div>
                    </AccordionSection>
                </div>

                <div className="flex-none px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                    {isPending ? (
                        <>
                            <Button
                                type="button"
                                onClick={() => {
                                    onDecline();
                                    onClose();
                                }}
                                className="px-5 py-2.5 rounded-[1.75rem] border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                                Decline
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    onAccept();
                                    onClose();
                                }}
                                className="px-5 py-2.5 rounded-[1.75rem] bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-sm font-semibold text-gray-900 shadow-sm hover:brightness-95 transition"
                            >
                                Accept Invite
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-[1.75rem] border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Close
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* -------------------------------------------------------------------------- */
/* FILTER TABS */
/* -------------------------------------------------------------------------- */

const STATUS_TABS: { value: InviteTab; label: string }[] = [
    { value: "all", label: "All" },
];

/* -------------------------------------------------------------------------- */
/* HELPERS */
/* -------------------------------------------------------------------------- */

function formatDate(value?: string) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
}

function normalizeStatus(value: any): ApiInviteStatus {
    const v = String(value || "").toLowerCase();
    if (v === "accepted") return "accepted";
    if (v === "reject") return "reject";
    return "sent";
}

function mapApiInviteToUi(inv: any): CampaignInvite {
    const singleBudget =
        Number(inv?.campaignBudget ?? inv?.budget ?? inv?.budgetMax ?? inv?.budgetMin ?? 0) || 0;

    const budgetMin =
        Number(inv?.budgetMin ?? inv?.campaignBudgetMin ?? inv?.minBudget ?? singleBudget) || 0;

    const budgetMax =
        Number(inv?.budgetMax ?? inv?.campaignBudgetMax ?? inv?.maxBudget ?? singleBudget) || 0;

    const deliverables: Deliverable[] = Array.isArray(inv?.deliverables)
        ? inv.deliverables.map((d: any) => ({
            quantity: Number(d?.quantity ?? 1) || 1,
            type: String(d?.type ?? d?.title ?? "Deliverable"),
        }))
        : [];

    return {
        id: String(inv?._id ?? ""),
        brandId: inv?.brandId ? String(inv.brandId) : undefined,
        campaignId: inv?.campaignId ? String(inv.campaignId) : undefined,
        brandName: String(inv?.brandName ?? "Brand"),
        brandAvatar: String(inv?.brandName?.[0] ?? "B"),
        invitedAt: formatDate(inv?.createdAt ?? inv?.sentAt),
        respondBy: formatDate(inv?.respondBy ?? inv?.endAt ?? inv?.updatedAt),
        status: normalizeStatus(inv?.status),

        title: String(inv?.campaignTitle ?? "Untitled Campaign"),
        description: String(inv?.description ?? ""),
        category: String(inv?.category?.name ?? inv?.categoryName ?? inv?.category ?? "General"),
        location: String(
            inv?.location ?? inv?.targetCountries?.[0]?.name ?? inv?.targetCountry ?? "Remote"
        ),
        budgetMin,
        budgetMax,
        goals: Array.isArray(inv?.goals)
            ? inv.goals.map((g: any) => String(g?.goal ?? g?.name ?? g))
            : [],
        ageGroups: Array.isArray(inv?.targetAgeRangesDetails)
            ? inv.targetAgeRangesDetails.map((a: any) => String(a?.range ?? ""))
            : Array.isArray(inv?.targetAgeRanges)
                ? inv.targetAgeRanges.map((a: any) => String(a))
                : [],

        overview: String(inv?.description ?? ""),
        deliverables,
        paymentMethod: String(inv?.paymentType ?? inv?.paymentMethod ?? "To be discussed"),
        paymentSchedule: String(inv?.paymentSchedule ?? "To be discussed"),
        brandMessage: String(inv?.brandMessage ?? "No message provided."),
        contentSubmission: formatDate(inv?.contentSubmission ?? inv?.submissionDate),
        publishDate: formatDate(inv?.publishDate ?? inv?.startAt),
        campaignEnd: formatDate(inv?.campaignEnd ?? inv?.endAt),
    };
}

function formatBudget(min: number, max: number) {
    if (min === max) return `$${max.toLocaleString()}`;
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
}

/* -------------------------------------------------------------------------- */
/* PAGE */
/* -------------------------------------------------------------------------- */

export default function InvitesPage() {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<InviteTab>("all");
    const [invites, setInvites] = useState<CampaignInvite[]>([]);
    const [detailsInvite, setDetailsInvite] = useState<CampaignInvite | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    const fetchInvites = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const influencerId =
                typeof window !== "undefined"
                    ? localStorage.getItem("influencerId") ||
                    localStorage.getItem("userId") ||
                    ""
                    : "";

            const token =
                typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

            if (!influencerId) {
                setInvites([]);
                setError("Influencer ID not found. Please log in again.");
                return;
            }

            const res = await apiGetAllInvitationsByInfluencer(
                {
                    influencerId,
                    status: activeTab === "all" ? undefined : activeTab,
                },
                token || undefined
            );

            const mapped = Array.isArray(res?.invitations)
                ? res.invitations.map(mapApiInviteToUi)
                : [];

            setInvites(mapped);
        } catch (err) {
            setError(getApiErrorMessage(err, "Failed to load campaign invites"));
            setInvites([]);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchInvites();
    }, [fetchInvites]);

    const handleAccept = (id: string) => {
        setInvites((prev) =>
            prev.map((inv) => (inv.id === id ? { ...inv, status: "accepted" } : inv))
        );
    };

    const handleDecline = (id: string) => {
        setInvites((prev) =>
            prev.map((inv) => (inv.id === id ? { ...inv, status: "reject" } : inv))
        );
    };

    const filtered = useMemo(() => {
        return invites.filter((inv) => {
            const term = search.toLowerCase();
            return (
                inv.title.toLowerCase().includes(term) ||
                inv.brandName.toLowerCase().includes(term)
            );
        });
    }, [invites, search]);

    const counts = useMemo(() => {
        const c: Record<InviteTab, number> = { all: invites.length, sent: 0, accepted: 0, reject: 0 };
        invites.forEach((inv) => {
            c[inv.status] += 1;
        });
        return c;
    }, [invites]);

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-[#fafafa]">
                <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Campaign Invites</h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Review and respond to collaboration opportunities from brands.
                            </p>
                        </div>

                        {counts.sent > 0 && (
                            <div className="shrink-0 flex items-center gap-2 rounded-[1.75rem] bg-amber-50 border border-amber-200 px-4 py-2.5">
                                <Clock className="h-4 w-4 text-amber-600" />
                                <span className="text-sm font-semibold text-amber-700">
                                    {counts.sent} pending {counts.sent === 1 ? "invite" : "invites"}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-1 bg-gray-100 rounded-[1.75rem] p-1 w-fit">
                            {STATUS_TABS.map((tab) => {
                                const isActive = activeTab === tab.value;

                                return (
                                    <Button
                                        key={tab.value}
                                        type="button"
                                        onClick={() => setActiveTab(tab.value)}
                                        className={[
                                            "h-auto px-4 py-2 rounded-[1.75rem] text-sm font-semibold border-0 transition-all",
                                            "focus-visible:!ring-0 focus-visible:!ring-offset-0",
                                            isActive
                                                ? "!bg-gray-600 !text-black hover:!bg-gray-600"
                                                : "!bg-transparent !text-black hover:!bg-black/10 hover:!text-black !shadow-none",
                                        ].join(" ")}
                                    >
                                        <span>{tab.label}</span>

                                        <span
                                            className={[
                                                "ml-2 inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                                                isActive ? "bg-white/20 text-black" : "bg-white/10 text-black",
                                            ].join(" ")}
                                        >
                                            {counts[tab.value]}
                                        </span>
                                    </Button>
                                );
                            })}
                        </div>

                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by campaign or brand name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-11 pr-10 h-12 rounded-[1.75rem] bg-white"
                            />
                            {search && (
                                <Button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent shadow-none hover:bg-transparent p-0 h-auto w-auto"
                                >
                                    <X className="h-4 w-4 text-gray-400" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-[1.75rem] bg-gray-100 flex items-center justify-center mb-4 animate-pulse">
                                <Clock className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-gray-900 font-semibold text-lg">Loading invites...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-[1.75rem] bg-red-50 flex items-center justify-center mb-4">
                                <AlertCircle className="h-7 w-7 text-red-500" />
                            </div>
                            <p className="text-gray-900 font-semibold text-lg">Unable to load invites</p>
                            <p className="text-gray-500 text-sm mt-1">{error}</p>
                            <Button
                                type="button"
                                onClick={fetchInvites}
                                className="mt-4 px-4 py-2 rounded-[1.75rem] bg-[#1A1A1A] text-white text-sm font-medium"
                            >
                                Retry
                            </Button>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[1.75rem] border border-gray-200">
                            <div className="w-16 h-16 rounded-[1.75rem] bg-gray-100 flex items-center justify-center mb-4">
                                <Search className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-gray-900 font-semibold text-lg">No invites found</p>
                            <p className="text-gray-500 text-sm mt-1">
                                Try adjusting your filters or search term.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-semibold text-gray-700">
                                                Brand Name
                                            </th>
                                            <th className="px-6 py-4 text-left font-semibold text-gray-700">
                                                Campaign Title
                                            </th>
                                            <th className="px-6 py-4 text-left font-semibold text-gray-700">
                                                Budget
                                            </th>
                                            <th className="px-6 py-4 text-left font-semibold text-gray-700">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-center font-semibold text-gray-700">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filtered.map((inv) => (
                                            <tr
                                                key={inv.id}
                                                className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-black border border-gray-800 flex items-center justify-center text-sm font-bold text-white">
                                                            {inv.brandAvatar ?? inv.brandName?.[0] ?? "B"}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{inv.brandName}</p>
                                                            <p className="text-xs text-gray-500">Invited: {inv.invitedAt}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{inv.title}</p>
                                                        <p className="text-xs text-gray-500 line-clamp-1">
                                                            {inv.description || "No description available"}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 font-semibold text-gray-900">
                                                    {formatBudget(inv.budgetMin, inv.budgetMax)}
                                                </td>

                                                <td className="px-6 py-4">
                                                    {inv.status === "accepted" ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            Accepted
                                                        </span>
                                                    ) : inv.status === "reject" ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-600">
                                                            <XCircle className="h-3.5 w-3.5" />
                                                            Declined
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
                                                            <AlertCircle className="h-3.5 w-3.5" />
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            type="button"
                                                            onClick={() => {
                                                                if (inv.campaignId) {
                                                                    router.push(`/influencer/invitations/${inv.campaignId}?invitationId=${inv.id}`);
                                                                } else {
                                                                    setDetailsInvite(inv);
                                                                }
                                                            }}
                                                            className="inline-flex items-center gap-2 rounded-[1.75rem] bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            View
                                                        </Button>

                                                        {inv.status === "accepted" && (
                                                            <Button
                                                                type="button"
                                                                onClick={() => {
                                                                    router.push("/influencer/my-campaigns/view-milestone");
                                                                }}
                                                                className="inline-flex items-center gap-2 rounded-[1.75rem] bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
                                                            >
                                                                View Milestone
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                            
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {detailsInvite && (
                <CampaignDetailsModal
                    invite={detailsInvite}
                    open={!!detailsInvite}
                    onClose={() => setDetailsInvite(null)}
                    onAccept={() => handleAccept(detailsInvite.id)}
                    onDecline={() => handleDecline(detailsInvite.id)}
                />
            )}
        </TooltipProvider>
    );
}