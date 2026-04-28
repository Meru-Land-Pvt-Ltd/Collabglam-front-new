"use client";

import React from "react";
import type { BrandTab } from "./types";
import { BRAND_TABS } from "./utils";

function TabButton({
    active,
    label,
    icon: Icon,
    onClick,
}: {
    active: boolean;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative inline-flex items-center gap-2 border-b-2 px-1 pb-4 pt-1 text-sm font-extrabold transition ${active
                    ? "border-[#1a1a1a] text-[#1a1a1a]"
                    : "border-transparent text-black/45 hover:text-[#1a1a1a]"
                }`}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    );
}

export function BrandViewTabs({
    activeTab,
    onChange,
}: {
    activeTab: BrandTab;
    onChange: (tab: BrandTab) => void;
}) {
    return (
        <div className="overflow-x-auto rounded-[24px] border border-black/10 bg-white px-5">
            <div className="flex min-w-max items-center gap-7 pt-5">
                {BRAND_TABS.map((tab) => (
                    <TabButton
                        key={tab.id}
                        active={activeTab === tab.id}
                        label={tab.label}
                        icon={tab.icon}
                        onClick={() => onChange(tab.id)}
                    />
                ))}
            </div>
        </div>
    );
}