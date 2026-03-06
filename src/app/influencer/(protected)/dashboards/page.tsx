"use client";

import React, { useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from "recharts";
import {
    Megaphone,
    Mail,
    Package,
    Wallet,
    CalendarDays,
    Check,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/buttonComp";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────── */
const monthlyEarnings = [
    { month: "Jan", amount: 800 },
    { month: "Feb", amount: 950 },
    { month: "Mar", amount: 1100 },
    { month: "Apr", amount: 900 },
    { month: "May", amount: 1300 },
    { month: "Jun", amount: 1150 },
    { month: "Jul", amount: 1400 },
    { month: "Aug", amount: 1600 },
    { month: "Sep", amount: 1500 },
    { month: "Oct", amount: 1750 },
    { month: "Nov", amount: 1650 },
];

type TxStatus = "completed" | "pending" | "";

const transactions: Array<{
    label: string;
    date: string;
    amount: string;
    status: TxStatus;
}> = [
        {
            label: "Campaign payout: Summer Fresh",
            date: "Nov 12, 2024",
            amount: "+$500.00",
            status: "completed",
        },
        {
            label: "Subscription fee: Pro Tools",
            date: "Nov 10, 2024",
            amount: "-$29.99",
            status: "completed",
        },
        {
            label: "Campaign payout: Tech Review",
            date: "Nov 08, 2024",
            amount: "+$750.00",
            status: "pending",
        },
        {
            label: "Brand endorsement: EcoWear",
            date: "Nov 06, 2024",
            amount: "+$1200.00",
            status: "completed",
        },
        {
            label: "Pending Payments",
            date: "",
            amount: "+$750.00",
            status: "",
        },
    ];

const campaigns = [
    {
        name: "Winter Cozy Collection",
        brand: "Warmknits Apparel",
        progress: 68,
        due: "Dec 15, 2024",
    },
    {
        name: "Health & Wellness Challenge",
        brand: "PureWild Supplements",
        progress: 80,
        due: "Nov 30, 2024",
    },
    {
        name: "Global Flavors Tour",
        brand: "TasteBud Adventures",
        progress: 40,
        due: "Jan 10, 2025",
    },
];

const invitations = [
    {
        brand: "EcoChic Brands",
        sub: "Summer Fashion Collab",
        initials: "EC",
        color: "bg-green-500",
    },
    {
        brand: "TechGadget Co.",
        sub: "New Smartwatch Launch",
        initials: "TG",
        color: "bg-blue-500",
    },
    {
        brand: "Foodie Delights",
        sub: "Gourmet Recipe Series",
        initials: "FD",
        color: "bg-orange-400",
    },
];

const messages = [
    {
        from: "Brand Manager - Luxe Beauty",
        time: "30 m",
        text: "Regarding the upcoming product launch, we need to finalize the details...",
        initials: "LB",
        color: "bg-pink-500",
    },
    {
        from: "Support Team",
        time: "yesterday",
        text: "Your recent payment inquiry has been resolved. Details attached.",
        initials: "ST",
        color: "bg-slate-500",
    },
    {
        from: "CollabGlam Admin",
        time: "3 days ago",
        text: "New feature update: Boost your profile for higher visibility!",
        initials: "CG",
        color: "bg-purple-500",
    },
];

/* ─────────────────────────────────────────────
   UI PIECES
   ───────────────────────────────────────────── */

function Avatar({
    initials,
    color,
    size = "w-9 h-9 text-sm",
}: {
    initials: string;
    color: string;
    size?: string;
}) {
    return (
        <div
            className={`${color} ${size} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
        >
            {initials}
        </div>
    );
}

function StatusBadge({ status }: { status: TxStatus }) {
    if (!status) return null;

    const map: Record<
        Exclude<TxStatus, "">,
        { cls: string; icon: React.ReactNode }
    > = {
        completed: {
            cls: "bg-green-100 text-green-700",
            icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        },
        pending: {
            cls: "bg-amber-100 text-amber-700",
            icon: <Clock className="h-3.5 w-3.5" />,
        },
    };

    const s = map[status as Exclude<TxStatus, "">];
    if (!s) return null;

    return (
        <span
            className={`${s.cls} text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize inline-flex items-center gap-1.5`}
        >
            {s.icon}
            {status}
        </span>
    );
}

function ProgressBar({ value, color = "bg-amber-400" }: { value: number; color?: string }) {
    return (
        <div className="w-full bg-gray-100 rounded-full h-1.5 my-1.5">
            <div
                className={`${color} h-1.5 rounded-full transition-all duration-500`}
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

function StatCard({
    label,
    value,
    sub,
    icon,
}: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-lg p-5 flex-1 min-w-36 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
                </div>
                <div className="text-gray-400">{icon}</div>
            </div>
        </div>
    );
}

function SectionCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">{title}</h2>
            {children}
        </div>
    );
}

/* ─────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────── */
export default function Dashboard() {
    const [accepted, setAccepted] = useState<Record<number, boolean>>({});
    const router = useRouter();
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <div className="px-6 py-7">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-xl font-extrabold text-gray-900">Dashboard</h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Overview of your collaborations and performance.
                        </p>
                    </div>
                    <Button onClick={() => router.push("/influencer/discover-campaigns")} className="!bg-[#FFBF00] !text-[#1A1A1A] transition-colors font-bold text-sm px-5 py-2.5 rounded-lg shadow-md shadow-amber-100 cursor-pointer border-none">
                        Discover Campaigns
                    </Button>
                </div>

                {/* Quick Stats */}
                <div className="mb-5">
                    <h2 className="text-sm font-bold text-gray-700 mb-3">Quick Stats</h2>
                    <div className="flex gap-4 flex-wrap">
                        <StatCard
                            label="Active Campaigns"
                            value="4"
                            sub="2 due this week"
                            icon={<Megaphone className="h-5 w-5" />}
                        />
                        <StatCard
                            label="Pending Invitations"
                            value="3"
                            sub="1 accepted today"
                            icon={<Mail className="h-5 w-5" />}
                        />
                        <StatCard
                            label="Pending Deliverables"
                            value="7"
                            sub="3 due tomorrow"
                            icon={<Package className="h-5 w-5" />}
                        />
                        <StatCard
                            label="Wallet Balance"
                            value="$1,250.75"
                            sub="+$278.50 last payout"
                            icon={<Wallet className="h-5 w-5" />}
                        />
                    </div>
                </div>

                {/* Invitations Snapshot */}
                <SectionCard title="Invitations Snapshot">
                    <div className="flex flex-col divide-y divide-gray-50">
                        {invitations.map((inv, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar initials={inv.initials} color={inv.color} />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{inv.brand}</p>
                                        <p className="text-xs text-gray-400">{inv.sub}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {accepted[i] ? (
                                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-4 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                                            <Check className="h-4 w-4" />
                                            Accepted
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => setAccepted((a) => ({ ...a, [i]: true }))}
                                            className="bg-amber-400 hover:bg-amber-500 transition-colors text-white text-xs font-bold px-4 py-1.5 rounded-lg cursor-pointer border-none"
                                        >
                                            Accept
                                        </button>
                                    )}

                                    <button className="bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 text-xs font-semibold px-4 py-1.5 rounded-lg cursor-pointer border-none">
                                        Review
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* Active Campaigns */}
                <div className="mb-5">
                    <h2 className="text-sm font-bold text-gray-700 mb-3">Active Campaigns</h2>
                    <div className="flex gap-4 flex-wrap">
                        {campaigns.map((c, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-lg p-5 flex-1 min-w-52 shadow-sm border border-gray-100"
                            >
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{c.name}</p>
                                        <p className="text-xs text-gray-400">{c.brand}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                                    <span>Progress</span>
                                    <span className="font-bold text-gray-700">{c.progress}%</span>
                                </div>

                                <ProgressBar value={c.progress} />

                                <p className="text-xs text-gray-400 mt-2 inline-flex items-center gap-1.5">
                                    <CalendarDays className="h-4 w-4" />
                                    Due by {c.due}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Earnings Snapshot */}
                <SectionCard title="Earnings Snapshot">
                    <div className="flex gap-8 flex-wrap">
                        {/* Transactions */}
                        <div className="flex-1 min-w-64">
                            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                                Recent Transactions
                            </p>

                            <div className="flex flex-col divide-y divide-gray-50">
                                {transactions.map((t, i) => {
                                    const isPlus = t.amount.startsWith("+");
                                    return (
                                        <div
                                            key={i}
                                            className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{t.label}</p>
                                                {t.date && <p className="text-xs text-gray-400">{t.date}</p>}
                                            </div>

                                            <div className="flex items-center gap-2 ml-4">
                                                <span
                                                    className={`text-sm font-bold inline-flex items-center gap-1 ${isPlus ? "text-green-600" : "text-red-500"
                                                        }`}
                                                >
                                                    {isPlus ? (
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowDownRight className="h-4 w-4" />
                                                    )}
                                                    {t.amount}
                                                </span>

                                                <StatusBadge status={t.status} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="flex-1 min-w-64">
                            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                                Monthly Earnings
                            </p>

                            <ResponsiveContainer width="100%" height={190}>
                                <BarChart data={monthlyEarnings} barCategoryGap="30%">
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={38}
                                        tickFormatter={(v) => `$${v}`}
                                    />
                                    <RechartsTooltip
                                        formatter={(v) => [`$${v}`, "Earnings"]}
                                        contentStyle={{
                                            borderRadius: 8,
                                            border: "none",
                                            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                                            fontSize: 12,
                                        }}
                                        cursor={{ fill: "rgba(251,191,36,0.08)" }}
                                    />
                                    <Bar dataKey="amount" fill="#fbbf24" radius={[5, 5, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </SectionCard>

                {/* Messages Preview */}
                <SectionCard title="Messages Preview">
                    <div className="flex flex-wrap gap-3">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className="flex-1 min-w-52 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg p-4 flex gap-3 items-start cursor-pointer"
                            >
                                <Avatar initials={m.initials} color={m.color} size="w-10 h-10 text-sm" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center gap-2">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{m.from}</p>
                                        <span className="text-xs text-gray-400 flex-shrink-0">{m.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* Profile Visibility */}
                <SectionCard title="Profile Visibility">
                    <div className="flex gap-10 flex-wrap items-center">
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Media Kit Views</p>
                            <p className="text-3xl font-extrabold text-gray-900">125</p>
                        </div>

                        <div className="flex-1 min-w-44">
                            <p className="text-xs text-gray-400 mb-2">Profile Completeness</p>
                            <ProgressBar value={72} color="bg-blue-400" />
                            <p className="text-xs text-gray-400 mt-1">72% complete</p>
                        </div>

                        <div>
                            <p className="text-xs text-gray-400 mb-2">Boost Status</p>
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-4 py-1.5 rounded-full inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                active
                            </span>
                        </div>
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}