"use client"

import React, { JSX, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    Briefcase,
    Users,
    Mail,
    Calendar,
    BadgeDollarSign,
    Filter,
    Eye,
    ExternalLink,
    Globe,
    Phone,
    FileText,
    Clock3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Campaign {
    id: string;
    name: string;
    brand: string;
    niche: string;
    audience: string;
    budget: string;
    deliverables: string;
    timeline: string;
    activeStage: StageKey;
}

type StageKey =
    | "outreach"
    | "roster"
    | "pitch"
    | "shortlisted"
    | "accepted"
    | "live"
    | "complete";

interface InfluencerRecord {
    id: string;
    campaignId: string;
    status: StageKey;
    source: "youtube" | "modash" | "csv" | "sharemitra";
    name: string;
    followers: string;
    niche: string;
    country?: string;
    email?: string;
    phone?: string;
    links: string;
    description?: string;
    demographics?: string;
    engagement?: string;
    deliverables?: string;
    rate?: string;
    mediaKit?: string;
    address?: string;
    selectionReason?: string;
    additionalInfo?: string;
    goodFit?: boolean;
    ourFeePct?: string;
    reply?: string;
    dateOutreach?: string;
    followUp1?: string;
    followUp2?: string;
    comments?: string;
}

type ColumnKey =
    | "name"
    | "followers"
    | "niche"
    | "email"
    | "dateOutreach"
    | "followUp1"
    | "followUp2"
    | "reply"
    | "demographics"
    | "engagement"
    | "deliverables"
    | "rate"
    | "mediaKit"
    | "country"
    | "selectionReason"
    | "ourFeePct"
    | "comments";

const stageOrder: StageKey[] = [
    "outreach",
    "roster",
    "pitch",
    "shortlisted",
    "accepted",
    "live",
    "complete",
];

const campaigns: Campaign[] = [
    {
        id: "CMP-2401",
        name: "SolarSpark India Launch",
        brand: "SolarSpark",
        niche: "Solar Power",
        audience: "25-44, Homeowners, India",
        budget: "$18,000",
        deliverables: "YouTube Integration + Reel",
        timeline: "15 Apr - 30 May",
        activeStage: "pitch",
    },
    {
        id: "CMP-2402",
        name: "PureMuse Clean Beauty",
        brand: "PureMuse",
        niche: "Clean Beauty",
        audience: "18-34, Women, UAE + India",
        budget: "$11,500",
        deliverables: "Instagram Reels + Stories",
        timeline: "21 Apr - 18 May",
        activeStage: "outreach",
    },
];

const influencers: InfluencerRecord[] = [
    {
        id: "INF-1001",
        campaignId: "CMP-2401",
        status: "outreach",
        source: "youtube",
        name: "Ritika Verma",
        followers: "182K",
        niche: "Solar + Sustainability",
        country: "India",
        email: "ritika@creatormail.com",
        phone: "+91 90000 12001",
        links: "youtube.com/@ritikaverma",
        description: "Strong explainer-style creator with practical home upgrade content.",
        engagement: "4.8%",
        rate: "$1,200",
        selectionReason: "Highly relevant home-energy audience and strong sponsored delivery quality.",
        goodFit: true,
        reply: "Interested. Please share more details.",
        dateOutreach: "2026-03-12",
        followUp1: "2026-03-17",
        followUp2: "2026-03-22",
        comments: "Responsive via email.",
    },
    {
        id: "INF-1002",
        campaignId: "CMP-2401",
        status: "roster",
        source: "modash",
        name: "Aniket Solanki",
        followers: "96K",
        niche: "Tech + Green Living",
        country: "India",
        email: "aniket@brandreach.in",
        phone: "+91 90000 12002",
        links: "instagram.com/aniketsolanki",
        description: "High-trust lifestyle-tech creator with polished sponsored integrations.",
        demographics: "64% men, 21-34, Tier 1 + Tier 2 India",
        engagement: "5.2%",
        deliverables: "1 Reel + 3 Story frames",
        rate: "$950",
        mediaKit: "drive.google.com/media-kit-aniket",
        address: "Ahmedabad, Gujarat",
        comments: "Open to bundle pricing.",
    },
    {
        id: "INF-1003",
        campaignId: "CMP-2401",
        status: "pitch",
        source: "csv",
        name: "Neha Builds",
        followers: "245K",
        niche: "DIY + Home Improvement",
        country: "India",
        email: "team@nehabuilds.com",
        phone: "+91 90000 12003",
        links: "youtube.com/@nehabuilds",
        description: "DIY educator with strong renovation and home systems audience.",
        engagement: "4.1%",
        deliverables: "Dedicated YouTube segment + Reel",
        rate: "$2,400",
        selectionReason: "Excellent fit for practical solar adoption messaging and home upgrade context.",
        additionalInfo: "Audience skew: homeowners + renovation planners.",
        goodFit: true,
        ourFeePct: "18%",
        comments: "Priority creator for client presentation.",
    },
    {
        id: "INF-1004",
        campaignId: "CMP-2401",
        status: "shortlisted",
        source: "sharemitra",
        name: "The Efficient Couple",
        followers: "128K",
        niche: "Family + Smart Home",
        country: "India",
        email: "hello@efficientcouple.com",
        phone: "+91 90000 12004",
        links: "instagram.com/efficientcouple",
        description: "Couple-led page with relatable household decision-making content.",
        engagement: "6.1%",
        deliverables: "2 Reels",
        rate: "$1,700",
        selectionReason: "Great trust factor and decision-maker audience overlap.",
        additionalInfo: "Strong story completion rate.",
        goodFit: true,
        ourFeePct: "20%",
        comments: "Brand approved with note: keep script practical.",
    },
    {
        id: "INF-1005",
        campaignId: "CMP-2401",
        status: "accepted",
        source: "youtube",
        name: "Urban Green Lab",
        followers: "310K",
        niche: "Sustainability",
        country: "India",
        email: "partner@urbangreenlab.com",
        phone: "+91 90000 12005",
        links: "youtube.com/@urbangreenlab",
        description: "Educational creator with strong topical authority in green tech.",
        engagement: "3.9%",
        deliverables: "YouTube mention",
        rate: "$2,000",
        comments: "Invite accepted. Contract pending signature.",
    },
    {
        id: "INF-1006",
        campaignId: "CMP-2401",
        status: "live",
        source: "modash",
        name: "HomeWise with Mili",
        followers: "88K",
        niche: "Home Advice",
        country: "India",
        email: "mili@homewise.media",
        phone: "+91 90000 12006",
        links: "instagram.com/homewisemili",
        description: "Trusted advice creator with strong short-form performance.",
        engagement: "7.0%",
        deliverables: "1 Reel + 1 Story",
        rate: "$1,050",
        comments: "Milestone 1 released. Awaiting draft reel.",
    },
    {
        id: "INF-1007",
        campaignId: "CMP-2401",
        status: "complete",
        source: "csv",
        name: "Build Better India",
        followers: "154K",
        niche: "Construction + Home Projects",
        country: "India",
        email: "ops@buildbetter.in",
        phone: "+91 90000 12007",
        links: "youtube.com/@buildbetterindia",
        description: "Deep niche creator with strong conversion-focused audience.",
        engagement: "4.6%",
        deliverables: "Dedicated segment",
        rate: "$1,800",
        comments: "All milestones approved and paid.",
    },
];

const stageMeta: Record<StageKey, { label: string; tone: string }> = {
    outreach: { label: "Outreach", tone: "bg-slate-100 text-slate-800" },
    roster: { label: "Roster", tone: "bg-blue-100 text-blue-800" },
    pitch: { label: "Pitch", tone: "bg-violet-100 text-violet-800" },
    shortlisted: { label: "Shortlisted", tone: "bg-amber-100 text-amber-800" },
    accepted: { label: "Accepted", tone: "bg-emerald-100 text-emerald-800" },
    live: { label: "Live", tone: "bg-cyan-100 text-cyan-800" },
    complete: { label: "Complete", tone: "bg-green-100 text-green-800" },
};

const stageColumns: Record<StageKey, ColumnKey[]> = {
    outreach: ["name", "followers", "niche", "email", "dateOutreach", "followUp1", "followUp2", "reply"],
    roster: ["name", "followers", "niche", "demographics", "engagement", "deliverables", "rate", "mediaKit"],
    pitch: ["name", "followers", "country", "selectionReason", "rate", "ourFeePct", "comments"],
    shortlisted: ["name", "followers", "country", "selectionReason", "rate", "comments"],
    accepted: ["name", "followers", "deliverables", "rate", "comments"],
    live: ["name", "followers", "deliverables", "rate", "comments"],
    complete: ["name", "followers", "deliverables", "rate", "comments"],
};

const labelMap: Record<ColumnKey, string> = {
    name: "Name",
    followers: "Followers",
    niche: "Niche",
    email: "Email",
    dateOutreach: "Outreach Date",
    followUp1: "Follow Up 1",
    followUp2: "Follow Up 2",
    reply: "Reply",
    demographics: "Demographics",
    engagement: "Engagement",
    deliverables: "Deliverables",
    rate: "Rate",
    mediaKit: "Media Kit",
    country: "Country",
    selectionReason: "Selection Reason",
    ourFeePct: "Our Fee %",
    comments: "Comments",
};

function StatCard({
    title,
    value,
    note,
    icon: Icon,
}: {
    title: string;
    value: string;
    note: string;
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <Card className="rounded-3xl border-0 shadow-sm">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-500">{title}</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
                        <p className="mt-1 text-xs text-slate-500">{note}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-3">
                        <Icon className="h-5 w-5 text-slate-700" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function InfoBox({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-2 text-slate-500">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-sm font-medium text-slate-900">{value}</p>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{value || "—"}</p>
        </div>
    );
}

function formatCellValue(key: ColumnKey, record: InfluencerRecord): React.ReactNode {
    const value = record[key];

    if (!value) return "—";

    if (key === "mediaKit") {
        return (
            <span className="inline-flex items-center gap-1 font-medium text-slate-900">
                Open Link <ExternalLink className="h-3.5 w-3.5" />
            </span>
        );
    }

    return value;
}

function PipelineTable({
    rows,
    stage,
    selectedId,
    onSelect,
}: {
    rows: InfluencerRecord[];
    stage: StageKey;
    selectedId?: string;
    onSelect: (record: InfluencerRecord) => void;
}) {
    const columns = stageColumns[stage];

    return (
        <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div>
                    <CardTitle className="text-lg text-slate-900">{stageMeta[stage].label} Records</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                        Status-driven influencer records for the selected campaign.
                    </p>
                </div>
                <Button className="rounded-2xl bg-slate-900 hover:bg-slate-800">Export View</Button>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2">
                        <thead>
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={column}
                                        className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                                    >
                                        {labelMap[column]}
                                    </th>
                                ))}
                                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    onClick={() => onSelect(row)}
                                    className={`cursor-pointer bg-slate-50 transition hover:bg-slate-100 ${selectedId === row.id ? "ring-2 ring-slate-300" : ""
                                        }`}
                                >
                                    {columns.map((column, index) => (
                                        <td
                                            key={column}
                                            className={`px-3 py-4 text-sm text-slate-700 ${index === 0 ? "rounded-l-2xl" : ""}`}
                                        >
                                            {column === "name" ? (
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 rounded-2xl">
                                                        <AvatarFallback className="rounded-2xl bg-slate-200 text-slate-700">
                                                            {row.name
                                                                .split(" ")
                                                                .map((part) => part[0])
                                                                .slice(0, 2)
                                                                .join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{row.name}</p>
                                                        <p className="text-xs text-slate-500">{row.source.toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                formatCellValue(column, row)
                                            )}
                                        </td>
                                    ))}
                                    <td className="rounded-r-2xl px-3 py-4">
                                        <Badge className={`${stageMeta[row.status].tone} rounded-full border-0`}>
                                            {stageMeta[row.status].label}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

function ProfilePanel({ record }: { record?: InfluencerRecord | null }) {
    if (!record) {
        return (
            <Card className="rounded-3xl border-0 shadow-sm">
                <CardContent className="flex min-h-[420px] items-center justify-center p-6 text-center text-sm text-slate-500">
                    Select an influencer record to see full campaign context, negotiation details, and internal notes.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 rounded-2xl">
                            <AvatarFallback className="rounded-2xl bg-slate-200 text-slate-700">
                                {record.name
                                    .split(" ")
                                    .map((part) => part[0])
                                    .slice(0, 2)
                                    .join("")}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg text-slate-900">{record.name}</CardTitle>
                            <p className="mt-1 text-sm text-slate-500">{record.niche}</p>
                        </div>
                    </div>
                    <Badge className={`${stageMeta[record.status].tone} rounded-full border-0`}>
                        {stageMeta[record.status].label}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoBox icon={Users} label="Followers" value={record.followers} />
                    <InfoBox icon={Globe} label="Country" value={record.country || "—"} />
                    <InfoBox icon={Mail} label="Email" value={record.email || "—"} />
                    <InfoBox icon={Phone} label="Phone" value={record.phone || "—"} />
                </div>

                <Separator />

                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Creator description</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                        {record.description || "No description added yet."}
                    </p>
                </div>

                <div className="grid gap-3">
                    <DetailRow label="Engagement Rate" value={record.engagement} />
                    <DetailRow label="Deliverables" value={record.deliverables} />
                    <DetailRow label="Rate" value={record.rate} />
                    <DetailRow label="Selection Reason" value={record.selectionReason} />
                    <DetailRow label="Additional Info" value={record.additionalInfo} />
                    <DetailRow label="Reply" value={record.reply} />
                    <DetailRow label="Comments" value={record.comments} />
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button className="rounded-2xl bg-slate-900 hover:bg-slate-800">Move Stage</Button>
                    <Button variant="outline" className="rounded-2xl">Open Record</Button>
                    <Button variant="outline" className="rounded-2xl">View History</Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function InfluencerPipelinePage(): JSX.Element {
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns[0].id);
    const [stage, setStage] = useState<StageKey>(campaigns[0].activeStage);
    const [search, setSearch] = useState<string>("");
    const [selectedRecord, setSelectedRecord] = useState<InfluencerRecord | null>(null);

    const selectedCampaign = useMemo<Campaign>(() => {
        return campaigns.find((campaign) => campaign.id === selectedCampaignId) || campaigns[0];
    }, [selectedCampaignId]);

    const campaignRows = useMemo<InfluencerRecord[]>(() => {
        return influencers.filter((record) => record.campaignId === selectedCampaignId);
    }, [selectedCampaignId]);

    const filteredRows = useMemo<InfluencerRecord[]>(() => {
        const query = search.trim().toLowerCase();

        return campaignRows.filter((record) => {
            const matchesStage = record.status === stage;
            const matchesSearch =
                !query ||
                record.name.toLowerCase().includes(query) ||
                record.niche.toLowerCase().includes(query) ||
                record.source.toLowerCase().includes(query) ||
                (record.country || "").toLowerCase().includes(query);

            return matchesStage && matchesSearch;
        });
    }, [campaignRows, search, stage]);

    const counts = useMemo<Record<StageKey, number>>(() => {
        return stageOrder.reduce(
            (acc, key) => {
                acc[key] = campaignRows.filter((record) => record.status === key).length;
                return acc;
            },
            {
                outreach: 0,
                roster: 0,
                pitch: 0,
                shortlisted: 0,
                accepted: 0,
                live: 0,
                complete: 0,
            }
        );
    }, [campaignRows]);

    React.useEffect(() => {
        setStage(selectedCampaign.activeStage);
        setSelectedRecord(null);
    }, [selectedCampaign]);

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-6 xl:p-8">
            <div className="mx-auto max-w-[1600px] space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]"
                >
                    <Card className="rounded-[28px] border-0 shadow-sm">
                        <CardContent className="p-6 sm:p-7">
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge className="rounded-full border-0 bg-slate-900 text-white">
                                            {selectedCampaign.brand}
                                        </Badge>
                                        <Badge variant="outline" className="rounded-full border-slate-300 text-slate-600">
                                            {selectedCampaign.id}
                                        </Badge>
                                        <Badge variant="outline" className="rounded-full border-slate-300 text-slate-600">
                                            Influencer Pipeline
                                        </Badge>
                                    </div>
                                    <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                                        {selectedCampaign.name}
                                    </h1>
                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                                        Admin-side campaign pipeline page for outreach, roster, pitch, approvals, invite readiness, and execution tracking.
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
                                    <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                                        <SelectTrigger className="rounded-2xl border-slate-200 bg-white">
                                            <SelectValue placeholder="Select campaign" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {campaigns.map((campaign) => (
                                                <SelectItem key={campaign.id} value={campaign.id}>
                                                    {campaign.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search creators..."
                                        className="rounded-2xl border-slate-200 bg-white"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <InfoBox icon={Briefcase} label="Niche" value={selectedCampaign.niche} />
                                <InfoBox icon={Users} label="Audience" value={selectedCampaign.audience} />
                                <InfoBox icon={BadgeDollarSign} label="Budget" value={selectedCampaign.budget} />
                                <InfoBox icon={Calendar} label="Timeline" value={selectedCampaign.timeline} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px] border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-900">Stage overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {stageOrder.map((item, index) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setStage(item)}
                                    className={`flex w-full items-center justify-between rounded-2xl p-3 text-left transition ${stage === item ? "bg-slate-900 text-white" : "bg-slate-50 hover:bg-slate-100"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-semibold ${stage === item ? "bg-white/15 text-white" : "bg-white text-slate-700 shadow-sm"
                                                }`}
                                        >
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{stageMeta[item].label}</p>
                                            <p className={`text-xs ${stage === item ? "text-white/70" : "text-slate-500"}`}>
                                                {counts[item]} creator(s)
                                            </p>
                                        </div>
                                    </div>
                                    <Badge
                                        className={`rounded-full border-0 ${stage === item ? "bg-white/15 text-white" : stageMeta[item].tone
                                            }`}
                                    >
                                        {counts[item]}
                                    </Badge>
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                >
                    <StatCard title="Total creators" value={String(campaignRows.length)} note="Campaign influencer records" icon={Users} />
                    <StatCard title="Replies captured" value="14" note="Pulled from outreach tracking" icon={Mail} />
                    <StatCard title="Contracts live" value="5" note="Accepted and activated creators" icon={FileText} />
                    <StatCard title="Milestones due" value="3" note="Needs admin action this week" icon={Clock3} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid gap-6 2xl:grid-cols-[1.45fr_0.55fr]"
                >
                    <div className="space-y-4">
                        <Card className="rounded-[28px] border-0 shadow-sm">
                            <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                                <Tabs value={stage} onValueChange={(value) => setStage(value as StageKey)} className="w-full">
                                    <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-slate-100 p-1.5">
                                        {stageOrder.map((item) => (
                                            <TabsTrigger
                                                key={item}
                                                value={item}
                                                className="rounded-2xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                            >
                                                {stageMeta[item].label}
                                                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                                    {counts[item]}
                                                </span>
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>

                                <div className="flex gap-2">
                                    <Button variant="outline" className="rounded-2xl">
                                        <Filter className="mr-2 h-4 w-4" /> Filters
                                    </Button>
                                    <Button className="rounded-2xl bg-slate-900 hover:bg-slate-800">
                                        <Eye className="mr-2 h-4 w-4" /> Refresh View
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <PipelineTable
                            rows={filteredRows}
                            stage={stage}
                            selectedId={selectedRecord?.id}
                            onSelect={setSelectedRecord}
                        />
                    </div>

                    <ProfilePanel record={selectedRecord} />
                </motion.div>
            </div>
        </div>
    );
}
