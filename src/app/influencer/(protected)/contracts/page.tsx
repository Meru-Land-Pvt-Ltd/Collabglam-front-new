"use client"
import { useState } from "react";

const contracts = [
    {
        id: 1,
        brand: "Bloom Cosmetics",
        initials: "BC",
        campaign: "Summer Glow Campaign",
        date: "2024-03-15",
        compensation: "$1,500 + Products",
        deliverables: "3 Instagram Posts, 1 YouTube Video",
        status: "Pending Review",
        deadline: "2024-04-30",
        milestones: "2 milestones (50%/50%)",
    },
    {
        id: 2,
        brand: "Bloom Cosmetics",
        initials: "BC",
        campaign: "Summer Glow Campaign",
        date: "2024-03-15",
        compensation: "$1,500 + Products",
        deliverables: "3 Instagram Posts, 1 YouTube Video",
        status: "Pending Review",
        deadline: "2024-04-30",
        milestones: "2 milestones (50%/50%)",
    },
];

const tabs = ["Pending Review", "Accepted", "Completed", "Rejected", "Cancelled"];

export default function ContractsPage() {
    const [activeTab, setActiveTab] = useState("Pending Review");
    const filtered = contracts.filter((c) => c.status === activeTab);

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="">

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Review and manage collaboration agreements from brands.
                        </p>
                    </div>
                    <button
                        style={{ backgroundColor: "#FFBF00" }}
                        className="flex items-center gap-2 text-gray-900 text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Active Contracts
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2.5 text-sm font-medium transition-colors relative -mb-px border-b-2 ${activeTab === tab
                                    ? "text-gray-900 font-semibold"
                                    : "text-gray-500 hover:text-gray-700 border-transparent"
                                }`}
                            style={activeTab === tab ? { borderBottomColor: "#FFBF00" } : {}}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Empty state */}
                {filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm font-medium">No {activeTab.toLowerCase()} contracts</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1  xl:grid-cols-3 gap-10">
                        {filtered.map((c) => (
                            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4 hover:shadow-md transition-shadow">

                                {/* Brand row */}
                                <div className="flex items-start justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-pink-400 flex-shrink-0 bg-pink-50">
                                            {c.initials}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{c.brand}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{c.campaign}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">{c.date}</span>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100 mb-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Compensation:</p>
                                        <p className="text-sm font-medium text-gray-700">{c.compensation}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Deliverables:</p>
                                        <p className="text-sm font-medium text-gray-700">{c.deliverables}</p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border"
                                            style={{ backgroundColor: "#fffbeb", color: "#b45309", borderColor: "#FFBF00" }}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#FFBF00" }} />
                                            {c.status}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                                <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} strokeLinecap="round" />
                                                <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} strokeLinecap="round" />
                                                <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} strokeLinecap="round" />
                                            </svg>
                                            {c.deadline}
                                        </span>
                                        <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="text-xs text-gray-400">{c.milestones}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200">
                                            Messages
                                        </button>
                                        <button className="px-4 py-2 rounded-lg text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors border border-red-100">
                                            Reject
                                        </button>
                                        <button
                                            style={{ backgroundColor: "#FFBF00" }}
                                            className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-900 hover:opacity-90 transition-opacity shadow-sm"
                                        >
                                            Accept
                                        </button>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}