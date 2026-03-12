"use client"
import { useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { ArrowDownToLine, TrendingUp, Wallet, ArrowUpRight, ChevronLeft, ChevronRight, Calendar, Search, CheckCircle2, Clock, AlertCircle, Zap, CreditCard, Info, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/buttonComp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Separator } from "@radix-ui/react-separator";

// ── Data ───────────────────────────────────────────────────────────────────────
const transactions: { id: string; campaign: string; type: string; amount: number; date: string; status: TxStatus }[] = [
    { id: "TXN789011", campaign: "Summer Fashion Collab", type: "Credit", amount: 500, date: "2024-07-20", status: "Completed" },
    { id: "TXN789011", campaign: "Spring Beauty Launch",  type: "Credit", amount: 250, date: "2024-07-15", status: "Pending" },
    { id: "TXN789010", campaign: "Winter Skincare Review", type: "Debit", amount: -15, date: "2024-07-10", status: "Failed" },
    { id: "TXN789009", campaign: "Autumn Lifestyle Series", type: "Credit", amount: 300, date: "2024-07-01", status: "Completed" },
    { id: "TXN789008", campaign: "Holiday Gift Guide",    type: "Credit", amount: 700, date: "2024-06-25", status: "Completed" },
    { id: "TXN789007", campaign: "Tech Gadget Unboxing",  type: "Credit", amount: 120, date: "2024-06-19", status: "Completed" },
];

const earningsData = [
    { month: "Jan", amount: 320 },
    { month: "Feb", amount: 480 },
    { month: "Mar", amount: 390 },
    { month: "Apr", amount: 620 },
    { month: "May", amount: 540 },
    { month: "Jun", amount: 710 },
    { month: "Jul", amount: 580 },
];

const recentPayments = [
    { label: "Summer Fashion Collab payment", date: "Jul 20, 2024", amount: 500 },
    { label: "Spring Beauty Launch partial", date: "Jul 15, 2024", amount: 150 },
    { label: "Autumn Lifestyle bonus", date: "Jul 05, 2024", amount: 50 },
];

// ── Sub-components ─────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, iconBg, label, value, sub, trend }: {
    icon: LucideIcon;
    iconBg: string;
    label: string;
    value: string;
    sub?: string;
    trend?: string;
}) => (
    <Card className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{label}</span>
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBg)}>
                <Icon size={15} className="text-white" />
            </div>
        </div>
        <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
            {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
        </div>
        {trend && (
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                <ArrowUpRight size={12} /> {trend}
            </div>
        )}
    </Card>
);

type TxStatus = "Completed" | "Pending" | "Failed";
type BadgeVariant = "destructive" | "link" | "default" | "secondary" | "outline" | "ghost";
const StatusBadge = ({ status }: { status: TxStatus }) => {
    const map: Record<TxStatus, { variant: BadgeVariant; icon: React.ReactNode; label: string }> = {
        Completed: { variant: "default", icon: <CheckCircle2 size={10} />, label: "Completed" },
        Pending: { variant: "secondary", icon: <Clock size={10} />, label: "Pending" },
        Failed: { variant: "destructive", icon: <AlertCircle size={10} />, label: "Failed" },
    };
    const { variant, icon, label } = map[status] ?? map.Pending;

    // ← this entire return block was missing
    return (
        <Badge variant={variant} className="flex items-center gap-1">
            {icon}
            {label}
        </Badge>
    );
}; // ← closing brace was also missing

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function WalletPage() {
    const [paymentMethod, setPaymentMethod] = useState("bank");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    return (
        <div className="min-h-screen bg-slate-50 font-sans" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Wallet size={20} className="text-amber-500" />
                            Wallet &amp; Payments
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">Track your earnings, payments, and withdrawals.</p>
                    </div>
                    <Button size="lg" className="shadow-md">
                        <ArrowDownToLine size={15} />
                        Withdraw Funds
                    </Button>
                </div>
            </div>

            <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard icon={Wallet} iconBg="bg-amber-400" label="Available Balance" value="$1,250.75" sub="Ready for withdrawal" trend="+12.4% this month" />
                        <StatCard icon={Zap} iconBg="bg-blue-500" label="Pending Earnings" value="$300.00" sub="Expected from active campaigns" />
                        <StatCard icon={TrendingUp} iconBg="bg-emerald-500" label="Total Earnings" value="$5,875.50" sub="Lifetime earnings" trend="+8.2% vs last month" />
                        <StatCard icon={ArrowDownToLine} iconBg="bg-violet-500" label="Total Withdrawn" value="$4,624.75" sub="Funds transferred to your accounts" />
                    </div>

                    {/* Transaction History */}
                    <Card className="overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <h2 className="font-bold text-slate-900 text-base">Transaction History</h2>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" placeholder="Pick a date" className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-700 w-28" />
                                    </div>
                                    <select className="pl-3 pr-6 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-700 appearance-none">
                                        <option>All Status</option>
                                        <option>Completed</option>
                                        <option>Pending</option>
                                        <option>Failed</option>
                                    </select>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" placeholder="Search campaign..." className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-700 w-36" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-xs text-slate-500 font-semibold tracking-wide uppercase">
                                        <th className="text-left px-5 py-3">Campaign / Source</th>
                                        <th className="text-left px-3 py-3">Payment Type</th>
                                        <th className="text-right px-3 py-3">Amount</th>
                                        <th className="text-left px-3 py-3">Date</th>
                                        <th className="text-left px-3 py-3">Status</th>
                                        <th className="text-left px-3 py-3">Reference ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {transactions.map((tx, i) => (
                                        <tr key={i} className="hover:bg-amber-50/40 transition-colors">
                                            <td className="px-5 py-3.5 font-medium text-slate-800 text-xs">{tx.campaign}</td>
                                            <td className="px-3 py-3.5">
                                                <Badge variant={tx.type === "Credit" ? "outline" : "destructive"}>{tx.type}</Badge>
                                            </td>
                                            <td className={cn("px-3 py-3.5 text-right font-bold text-sm tabular-nums", tx.amount < 0 ? "text-red-500" : "text-emerald-600")}>
                                                {tx.amount < 0 ? `-$${Math.abs(tx.amount)}` : `$${tx.amount}`}
                                            </td>
                                            <td className="px-3 py-3.5 text-xs text-slate-500 tabular-nums">{tx.date}</td>
                                            <td className="px-3 py-3.5"><StatusBadge status={tx.status} /></td>
                                            <td className="px-3 py-3.5 text-xs font-mono text-slate-400">{tx.id}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-slate-500">Showing 1–6 of 24 results</span>
                            <div className="flex items-center gap-1">
                                <Button size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                                    <ChevronLeft size={14} /> Previous
                                </Button>
                                {[1, 2, 3].map(p => (
                                    <button key={p} onClick={() => setCurrentPage(p)} className={cn("w-7 h-7 rounded-lg text-xs font-semibold transition-all", currentPage === p ? "bg-amber-400 text-slate-900 shadow-sm" : "text-slate-500 hover:bg-slate-100")}>
                                        {p}
                                    </button>
                                ))}
                                <Button size="sm" onClick={() => setCurrentPage(p => Math.min(3, p + 1))}>
                                    Next <ChevronRight size={14} />
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Earnings Overview — MUI BarChart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Earnings Overview</CardTitle>
                            <CardDescription>Monthly trend and recent activity</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BarChart
                                height={220}
                                series={[{
                                    data: earningsData.map(d => d.amount),
                                    color: "#FFBF00",
                                    label: "Earnings",
                                }]}
                                xAxis={[{
                                    data: earningsData.map(d => d.month),
                                    scaleType: "band",
                                    tickSize: 0,
                                    disableLine: true,
                                }]}
                                yAxis={[{ disableLine: true, tickSize: 0 }]}
                                borderRadius={6}
                                margin={{ top: 10, right: 10, left: 30, bottom: 30 }}
                                slotProps={{
                                    bar: { rx: 6, ry: 6 },
                                }}
                                sx={{
                                    "& .MuiChartsAxis-tickLabel": { fontSize: "11px", fontWeight: 600, fill: "#64748b" },
                                    "& .MuiChartsAxis-line": { display: "none" },
                                    "& .MuiChartsGrid-line": { stroke: "#f1f5f9", strokeDasharray: "3 3" },
                                    "& .MuiBarElement-root:hover": { opacity: 0.85 },
                                }}
                            />

                            <Separator className="my-5 border-t border-slate-100" />

                            <h3 className="text-sm font-bold mb-3">Recent Payments</h3>
                            <div className="flex flex-col">
                                {recentPayments.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-0">
                                        <div>
                                            <p className="text-sm font-medium">{p.label}</p>
                                            <p className="text-xs text-muted-foreground">↩ {p.date}</p>
                                        </div>
                                        <span className="text-sm font-bold text-emerald-600 tabular-nums">${p.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex flex-col gap-5">
                    {/* Withdraw Funds */}
                    <Card className="p-5">
                        <h2 className="font-bold text-slate-900 text-base mb-1">Withdraw Funds</h2>
                        <p className="text-xs text-slate-500 mb-4">Select method and enter amount</p>

                        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Select Payment Method</label>
                        <div className="grid grid-cols-2 gap-2 mb-5">
                            <button onClick={() => setPaymentMethod("bank")} className={cn("flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all", paymentMethod === "bank" ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600 hover:border-slate-300")}>
                                <CreditCard size={14} /> Bank Account
                            </button>
                            <button onClick={() => setPaymentMethod("paypal")} className={cn("flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all", paymentMethod === "paypal" ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600 hover:border-slate-300")}>
                                <span className="font-black text-blue-600 text-sm">P</span> PayPal
                            </button>
                        </div>

                        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Withdrawal Amount</label>
                        <div className="relative mb-4">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
                            <Input className="pl-7" placeholder="e.g. 500" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                        </div>

                        <div className="bg-amber-50 rounded-xl px-3 py-2 flex items-center gap-2 mb-4">
                            <Info size={13} className="text-amber-500 shrink-0" />
                            <span className="text-xs text-amber-700">Available: <strong>$1,250.75</strong></span>
                        </div>

                        <Button className="w-full justify-center" disabled={!withdrawAmount}>
                            <ArrowDownToLine size={14} />
                            Confirm Withdrawal
                        </Button>
                    </Card>

                    {/* Profile Boost */}
                    <Card className="p-5">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap size={16} className="text-amber-500" />
                            <h2 className="font-bold text-slate-900 text-base">Profile Boost Payments</h2>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">Boost your profile to reach more brands!</p>
                        <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center text-center gap-2 border border-dashed border-slate-200">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                <Zap size={18} className="text-slate-400" />
                            </div>
                            <p className="text-xs text-slate-500 font-medium">No boost payments yet.</p>
                            <p className="text-xs text-slate-400">Boost your profile to reach more brands!</p>
                            <Button className="mt-1">Boost Profile</Button>
                        </div>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="p-5">
                        <h2 className="font-bold text-slate-900 text-sm mb-3">This Month's Summary</h2>
                        <div className="flex flex-col gap-3">
                            {[
                                { label: "Campaigns Paid", value: "4", color: "bg-emerald-400" },
                                { label: "Avg. Per Campaign", value: "$393", color: "bg-amber-400" },
                                { label: "Success Rate", value: "83%", color: "bg-blue-400" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", item.color)} />
                                        <span className="text-xs text-slate-600">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}