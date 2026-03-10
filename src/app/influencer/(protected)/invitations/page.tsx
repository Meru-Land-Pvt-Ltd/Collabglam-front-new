"use client";

import React, { useState, useMemo } from "react";
import {
    Search,
    X,
    ChevronDown,
    ChevronUp,
    Clock,
    DollarSign,
    CalendarDays,
    Package,
    MessageSquare,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from "lucide-react";
import { ManualPreviewCard, ManualForm, PreviewMeta } from "@/components/ui/cardPreview";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
/* -------------------------------------------------------------------------- */
/*                               TYPES                                        */
/* -------------------------------------------------------------------------- */

type InviteStatus = "pending" | "accepted" | "declined";

interface Deliverable {
    quantity: number;
    type: string;
}

interface CampaignInvite {
    id: string;
    brandName: string;
    brandAvatar?: string;
    invitedAt: string;
    respondBy: string;
    status: InviteStatus;
    // Card display fields
    title: string;
    description: string;
    category: string;
    location: string;
    budgetMin: number;
    budgetMax: number;
    goals: string[];
    ageGroups: string[];
    // Detail modal fields
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
/*                               DUMMY DATA                                   */
/* -------------------------------------------------------------------------- */

const invitesData: CampaignInvite[] = [
    {
        id: "inv-1",
        brandName: "GlowUp Beauty",
        brandAvatar: "G",
        invitedAt: "2024-07-20",
        respondBy: "2024-07-30",
        status: "pending",
        title: "Summer Glow Skincare Launch",
        description: "Promote our new line of eco-friendly skincare products. Focus on natural ingredients and radiant skin for the summer season.",
        category: "Beauty",
        location: "Remote",
        budgetMin: 1000,
        budgetMax: 2500,
        goals: ["Brand Awareness"],
        ageGroups: ["18-24", "25-34"],
        overview: "Promote our new line of eco-friendly skincare products. Focus on natural ingredients and radiant skin for the summer season. This collaboration aims to reach a wide audience through engaging and authentic content. We're looking for creators who align with our brand values and can produce high-quality visuals and storytelling.",
        deliverables: [
            { quantity: 1, type: "Instagram Reel (60–90 seconds)" },
            { quantity: 3, type: "Instagram Stories with swipe-up link" },
            { quantity: 1, type: "Static Instagram Post with product tag" },
        ],
        paymentMethod: "PayPal / Bank Transfer",
        paymentSchedule: "50% upfront, 50% upon completion and approval of all deliverables.",
        brandMessage: "*Dear Creator, we've been following your work and are truly impressed by your unique style and engaging community. We believe you would be the perfect fit to represent our brand in this exciting new campaign. Look forward to your response!*",
        contentSubmission: "August 15, 2024",
        publishDate: "August 25, 2024",
        campaignEnd: "September 10, 2024",
    },
    {
        id: "inv-2",
        brandName: "FitFusion Apparel",
        brandAvatar: "F",
        invitedAt: "2024-07-15",
        respondBy: "2024-07-25",
        status: "pending",
        title: "Activewear Collection Showcase",
        description: "Showcase our new line of sustainable activewear. Highlight comfort, durability, and style for everyday workouts.",
        category: "Fitness",
        location: "Remote",
        budgetMin: 800,
        budgetMax: 1800,
        goals: ["Product Launch"],
        ageGroups: ["18-24", "25-34"],
        overview: "We're launching our most sustainable activewear collection yet. Made from 100% recycled materials, this line proves that performance and planet-care can coexist. We need creators who live the active lifestyle to authentically showcase these products in real workout settings.",
        deliverables: [
            { quantity: 1, type: "YouTube video (5–8 minutes, workout routine)" },
            { quantity: 2, type: "Instagram Reels (30–45 seconds)" },
            { quantity: 4, type: "Instagram Stories (product highlights)" },
        ],
        paymentMethod: "Bank Transfer",
        paymentSchedule: "100% upon content approval and publishing.",
        brandMessage: "Hi! We love your fitness content and think you're a natural fit for our brand. Your audience aligns perfectly with who we're trying to reach. We hope you'll join us on this exciting launch!",
        contentSubmission: "August 10, 2024",
        publishDate: "August 20, 2024",
        campaignEnd: "September 5, 2024",
    },
    {
        id: "inv-3",
        brandName: "TasteHaven Foods",
        brandAvatar: "T",
        invitedAt: "2024-07-10",
        respondBy: "2024-07-22",
        status: "accepted",
        title: "Organic Snack Box Review",
        description: "Review our monthly organic snack subscription box. Share honest reactions and highlight your favourite finds.",
        category: "Food",
        location: "Remote",
        budgetMin: 500,
        budgetMax: 1200,
        goals: ["Conversions"],
        ageGroups: ["25-34", "35-44"],
        overview: "TasteHaven delivers curated boxes of organic, ethically sourced snacks directly to your door. We want real, honest reviews from creators who care about what goes into their bodies. Share your unboxing, your favourites, and your honest opinion — that's all we ask.",
        deliverables: [
            { quantity: 1, type: "YouTube unboxing video (8–12 minutes)" },
            { quantity: 2, type: "Instagram Stories (unboxing + favourite picks)" },
            { quantity: 1, type: "Instagram Post (flat lay or lifestyle)" },
        ],
        paymentMethod: "PayPal",
        paymentSchedule: "Full payment within 7 days of publishing.",
        brandMessage: "We've been watching your content for months and your food reviews feel so genuine. We'd love to send you our latest box and see what you think!",
        contentSubmission: "August 5, 2024",
        publishDate: "August 12, 2024",
        campaignEnd: "August 30, 2024",
    },
    {
        id: "inv-4",
        brandName: "NovaTech Gadgets",
        brandAvatar: "N",
        invitedAt: "2024-07-08",
        respondBy: "2024-07-18",
        status: "declined",
        title: "Smart Home Device Launch",
        description: "Introduce our latest smart home hub to your audience. Demo the key features and share your honest experience.",
        category: "Tech",
        location: "Remote",
        budgetMin: 1500,
        budgetMax: 3500,
        goals: ["Brand Awareness", "Product Launch"],
        ageGroups: ["18-24", "25-34", "35-44"],
        overview: "NovaTech is redefining the smart home experience. Our new hub integrates seamlessly with all major ecosystems — Alexa, Google Home, Apple HomeKit — and our AI learns your habits to automate your home intelligently. We need tech creators to demo the setup and day-to-day experience.",
        deliverables: [
            { quantity: 1, type: "YouTube setup & review video (10–15 minutes)" },
            { quantity: 1, type: "Instagram Reel (60 seconds, top features)" },
            { quantity: 3, type: "Twitter/X posts (launch week)" },
        ],
        paymentMethod: "Bank Transfer",
        paymentSchedule: "50% on contract signing, 50% after publishing.",
        brandMessage: "Your tech review style is exactly what our audience needs to see. We think your thorough approach will give our product the credibility it deserves at launch.",
        contentSubmission: "August 8, 2024",
        publishDate: "August 15, 2024",
        campaignEnd: "September 1, 2024",
    },
    {
        id: "inv-5",
        brandName: "BrewCraft Coffee",
        brandAvatar: "B",
        invitedAt: "2024-07-18",
        respondBy: "2024-08-01",
        status: "pending",
        title: "Morning Ritual Coffee Series",
        description: "Feature our single-origin coffee blends in your morning routine content. Share the story behind the beans.",
        category: "Food",
        location: "Remote",
        budgetMin: 600,
        budgetMax: 1400,
        goals: ["Brand Awareness"],
        ageGroups: ["25-34", "35-44"],
        overview: "BrewCraft sources single-origin beans directly from small farms around the world, ensuring fair wages and sustainable practices. We want creators who genuinely love coffee to feature our blends in their morning routine — authentic lifestyle content that tells the story of where the coffee comes from.",
        deliverables: [
            { quantity: 2, type: "Instagram Reels (morning routine feature)" },
            { quantity: 4, type: "Instagram Stories (brewing process)" },
            { quantity: 1, type: "Blog post or newsletter mention" },
        ],
        paymentMethod: "PayPal / Bank Transfer",
        paymentSchedule: "Full payment within 14 days of final delivery.",
        brandMessage: "Your morning content aesthetic is absolutely beautiful. We think our coffee would look stunning in your feed and resonate deeply with your community.",
        contentSubmission: "August 20, 2024",
        publishDate: "August 28, 2024",
        campaignEnd: "September 15, 2024",
    },
    {
        id: "inv-6",
        brandName: "WanderLens Travel",
        brandAvatar: "W",
        invitedAt: "2024-07-12",
        respondBy: "2024-07-28",
        status: "pending",
        title: "Hidden Gems Travel Guide",
        description: "Partner with us to create a travel guide featuring lesser-known destinations. Inspire your audience to explore off the beaten path.",
        category: "Travel",
        location: "On-Location",
        budgetMin: 2000,
        budgetMax: 5000,
        goals: ["Engagement", "Brand Awareness"],
        ageGroups: ["18-24", "25-34"],
        overview: "WanderLens is building the world's most comprehensive guide to under-the-radar travel destinations. We want creators who've been to incredible places most people have never heard of. Share your experiences, your photography, and your insider tips to inspire a new generation of travellers.",
        deliverables: [
            { quantity: 1, type: "YouTube travel vlog (12–18 minutes)" },
            { quantity: 6, type: "Instagram Posts (destination highlights)" },
            { quantity: 8, type: "Instagram Stories (day-in-the-life)" },
        ],
        paymentMethod: "Bank Transfer + Travel expenses covered",
        paymentSchedule: "Travel expenses upfront, content fee upon delivery.",
        brandMessage: "We've been following your travel content and your eye for hidden beauty is unmatched. We'd love to co-create something truly special together.",
        contentSubmission: "September 1, 2024",
        publishDate: "September 10, 2024",
        campaignEnd: "October 1, 2024",
    },
];

/* -------------------------------------------------------------------------- */
/*                         CAMPAIGN DETAILS MODAL                             */
/* -------------------------------------------------------------------------- */

type Section = "overview" | "deliverables" | "payment" | "message" | "timeline";

function AccordionSection({
    id,
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
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50/50 transition-colors px-1 rounded-lg"
            >
                <span className="flex items-center gap-2.5 font-semibold text-[15px] text-gray-900">
                    {icon}
                    {title}
                </span>
                {open ? (
                    <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                )}
            </button>
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

    const isPending = invite.status === "pending";
    const isAccepted = invite.status === "accepted";
    const isDeclined = invite.status === "declined";

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
            <DialogContent className="w-full !max-w-[800px] max-h-[100vh]  overflow-hidden rounded-2xl border p-0">
                {/* Header */}
                <div className="flex-none px-6 pt-6 pb-4 border-b  border-gray-100">
                    <DialogHeader className="text-left space-y-1">
                        <DialogTitle className="text-[18px] font-bold text-gray-900 leading-snug pr-8">
                            Campaign Details:{" "}
                            <span className="text-gray-800">{invite.title}</span>
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">
                            Comprehensive overview of the collaboration opportunity.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Brand info row */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FFBF00] to-[#FFDB58] flex items-center justify-center text-gray-900 font-bold text-sm shadow-sm">
                                {invite.brandAvatar ?? invite.brandName[0]}
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 text-sm">
                                    {invite.brandName}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Invited: {invite.invitedAt}
                                </div>
                            </div>
                        </div>
                        {statusBadge}
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-6 py-2">
                    <AccordionSection
                        id="overview"
                        title="Campaign Overview"
                        icon={<Package className="h-4 w-4 text-[#FFBF00]" />}
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
                        <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5">
                            ⚠️ Approval required for all content before posting.
                        </p>
                    </AccordionSection>

                    <AccordionSection
                        id="payment"
                        title="Payment Details"
                        icon={<DollarSign className="h-4 w-4 text-[#FFBF00]" />}
                        open={openSections.has("payment")}
                        onToggle={() => toggle("payment")}
                    >
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 w-32 shrink-0 text-xs font-medium uppercase tracking-wide">
                                    Budget
                                </span>
                                <span className="font-semibold text-gray-900">
                                    ${invite.budgetMin.toLocaleString()} – ${invite.budgetMax.toLocaleString()}
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
                        icon={<MessageSquare className="h-4 w-4 text-[#FFBF00]" />}
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
                        icon={<CalendarDays className="h-4 w-4 text-[#FFBF00]" />}
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

                {/* Footer */}
                <div className="flex-none px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                    {isPending ? (
                        <>
                            <button
                                onClick={() => {
                                    onDecline();
                                    onClose();
                                }}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition active:scale-[0.98]"
                            >
                                Decline
                            </button>
                            <button
                                onClick={() => {
                                    onAccept();
                                    onClose();
                                }}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-sm font-semibold text-gray-900 shadow-sm hover:brightness-95 transition active:scale-[0.98]"
                            >
                                Accept Invite
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Close
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* -------------------------------------------------------------------------- */
/*                             FILTER TABS                                    */
/* -------------------------------------------------------------------------- */

const STATUS_TABS: { value: "all" | InviteStatus; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
    { value: "declined", label: "Declined" },
];

/* -------------------------------------------------------------------------- */
/*                               PAGE                                         */
/* -------------------------------------------------------------------------- */

export default function InvitesPage() {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | InviteStatus>("all");
    const [invites, setInvites] = useState<CampaignInvite[]>(invitesData);
    const [detailsInvite, setDetailsInvite] = useState<CampaignInvite | null>(null);
    const router = useRouter()
    const handleAccept = (id: string) => {
        setInvites((prev) =>
            prev.map((inv) => (inv.id === id ? { ...inv, status: "accepted" } : inv))
        );
    };

    const handleDecline = (id: string) => {
        setInvites((prev) =>
            prev.map((inv) => (inv.id === id ? { ...inv, status: "declined" } : inv))
        );
    };

    const filtered = useMemo(() => {
        return invites.filter((inv) => {
            const matchesTab = activeTab === "all" || inv.status === activeTab;
            const matchesSearch =
                inv.title.toLowerCase().includes(search.toLowerCase()) ||
                inv.brandName.toLowerCase().includes(search.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [invites, activeTab, search]);

    // Counts for tabs
    const counts = useMemo(() => {
        const c = { all: invites.length, pending: 0, accepted: 0, declined: 0 };
        invites.forEach((inv) => { c[inv.status]++; });
        return c;
    }, [invites]);

    return (
        <TooltipProvider>
            <div className="min-h-screen">
                <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-10">
                    {/* HEADER */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Campaign Invites
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Review and respond to collaboration opportunities from brands.
                            </p>
                        </div>
                        {counts.pending > 0 && (
                            <div className="shrink-0 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
                                <Clock className="h-4 w-4 text-amber-600" />
                                <span className="text-sm font-semibold text-amber-700">
                                    {counts.pending} pending{" "}
                                    {counts.pending === 1 ? "invite" : "invites"}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* STATUS TABS */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                        {STATUS_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={[
                                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                                    activeTab === tab.value
                                        ? "bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-900 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-white/60",
                                ].join(" ")}
                                style={activeTab === tab.value ? {} : {}}
                            >
                                {tab.label}
                                <span
                                    className={[
                                        "ml-2 inline-flex items-center justify-center text-[11px] px-1.5 py-0.5 rounded-full",
                                        activeTab === tab.value
                                            ? "bg-white/70 text-gray-900"
                                            : "bg-gray-200 text-gray-600",
                                    ].join(" ")}
                                >
                                    {counts[tab.value]}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* SEARCH */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by campaign or brand name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-11 pr-10 h-12 rounded-xl"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                <X className="h-4 w-4 text-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* GRID */}
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                <Search className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-gray-900 font-semibold text-lg">
                                No invites found
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                                Try adjusting your filters or search term.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                            {filtered.map((inv) => {
                                const form: ManualForm = {
                                    title: inv.title,
                                    description: inv.description,
                                    categoryName: inv.category,
                                    targetCountry: [inv.location],
                                    targetAgeGroups: inv.ageGroups,
                                    goals: inv.goals,
                                    campaignBudget: inv.budgetMax,
                                };

                                const meta: PreviewMeta = {
                                    countryMap: { [inv.location]: inv.location },
                                    ageMap: Object.fromEntries(
                                        inv.ageGroups.map((a) => [a, a])
                                    ),
                                    goalsMap: Object.fromEntries(
                                        inv.goals.map((g) => [g, g])
                                    ),
                                    campaignBudget: inv.budgetMax,
                                };

                                return (
                                    <div key={inv.id} className="relative">
                                        {/* Respond-by badge — shown only for pending */}
                                        {inv.status === "pending" && (
                                            <div className="absolute -top-3 left-4 z-10 flex items-center gap-1.5 rounded-full bg-white border border-red-200 px-3 py-1 shadow-sm">
                                                <Clock className="h-3 w-3 text-red-500" />
                                                <span className="text-[11px] font-semibold text-red-500">
                                                    Respond by {inv.respondBy}
                                                </span>
                                            </div>
                                        )}

                                        <ManualPreviewCard
                                            form={form}
                                            meta={meta}
                                            invite={{
                                                status: inv.status,
                                                respondBy: inv.respondBy,
                                                onAccept: () => handleAccept(inv.id),
                                                onDecline: () => handleDecline(inv.id),
                                                onViewDetails: () => {
                                                    router.push("/influencer/my-campaigns/abc")
                                                },
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Details Modal */}
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