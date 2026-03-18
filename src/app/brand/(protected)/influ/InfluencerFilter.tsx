"use client";

import { CaretDown, MagnifyingGlass, X } from "@phosphor-icons/react";
import React, { useEffect, useMemo, useState } from "react";

import {
    Combobox,
    ComboboxContent,
    ComboboxItem,
    ComboboxList,
    ComboboxTrigger,
} from "@/components/ui/combobox";

import {
    apiGetAllCategories,
    apiListInfluencerTiers,
} from "../../services/brandApi";

type FilterKey =
    | "Influencer Type"
    | "Engagement Rate"
    | "Follower"
    | "Category"
    | "Platform"
    | "Date";

// ✅ Category + Platform are multi-select
export type FilterState = {
    "Influencer Type": string; // "" default (caret only), "All" explicit, or any option
    "Engagement Rate": string; // "" default
    Follower: string; // "" default
    Category: string[]; // [] default, includes "All" when All is selected, plus ids
    Platform: string[]; // [] default, ["All"] explicit, else platform values
    Date: string; // "" default
};

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "Influencer Type", label: "Influencer Type" },
    { key: "Engagement Rate", label: "Engagement Rate" },
    { key: "Follower", label: "Influencer Tier" },
    { key: "Category", label: "Category" },
    { key: "Platform", label: "Platform" },
    { key: "Date", label: "Date" },
];

const INFLUENCER_TYPE_OPTIONS = [
    "All",
    "Recommended",
    "Applied",
    "Sortlisted",
    "Invited",
    "Selected",
    "Active",
    "Rejected",
    "Completed",
] as const;

const ENGAGEMENT_OPTIONS = ["All", "0-2%", "2-5%", "5-8%", "8-12%", "12%+"] as const;
const DATE_OPTIONS = ["All", "Today", "Last 7 Days", "Last 30 Days"] as const;

const SORT_OPTIONS = [
    "Priority",
    "Recently added",
    "Highest engagement",
    "Highest follower",
    "Price: Low to High",
    "Price: HIgh to Low",
] as const;

const PLATFORM_OPTIONS = [
    { value: "All", label: "All", icon: undefined },
    { value: "Instagram", label: "Instagram", icon: "/skill-icons_instagram.svg" },
    { value: "Youtube", label: "Youtube", icon: "/logos_youtube-icon.svg" },
    { value: "TikTok", label: "TikTok", icon: "/ic_baseline-tiktok.svg" },
] as const;

type Option = { value: string; label: string };

type Props = {
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    search: string;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    sortValue: string;
    setSortValue?: React.Dispatch<React.SetStateAction<string>>;
};

function unwrapArray(res: any) {
    if (Array.isArray(res)) return res;
    return res?.categories ?? res?.data ?? res?.result ?? res?.items ?? [];
}

// ✅ Multi-select normalization (used for Platform):
// - if "All" + others => remove "All"
// - if only "All" => keep ["All"]
function normalizeMulti(next: unknown) {
    const arr = Array.isArray(next) ? next.map(String) : [];
    if (arr.includes("All")) {
        return arr.length > 1 ? arr.filter((v) => v !== "All") : ["All"];
    }
    return arr;
}

export default function InfluencerFilter({
    filters,
    setFilters,
    search,
    setSearch,
    sortValue,
    setSortValue,
}: Props) {
    const hasAnyApplied = useMemo(() => {
        const isDefaultString = (v: string) => v === "" || v === "All";
        // ✅ "All" counts as default (not applied)
        const isDefaultMulti = (v: string[]) => v.length === 0 || v.includes("All");

        return (
            !isDefaultString(filters["Influencer Type"]) ||
            !isDefaultString(filters["Engagement Rate"]) ||
            !isDefaultString(filters["Follower"]) ||
            !isDefaultString(filters["Date"]) ||
            !isDefaultMulti(filters.Category) ||
            !isDefaultMulti(filters.Platform)
        );
    }, [filters]);

    const [categoryOptions, setCategoryOptions] = useState<Option[]>([
        { value: "All", label: "All" },
    ]);
    const [tierOptions, setTierOptions] = useState<Option[]>([
        { value: "All", label: "All" },
    ]);

    // ✅ Keep Category popup open while selecting
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");

    const filteredCategoryOptions = useMemo(() => {
        const q = categorySearch.trim().toLowerCase();
        if (!q) return categoryOptions.filter((o) => o.value !== "All");

        return categoryOptions
            .filter((o) => o.value !== "All")
            .filter((o) => o.label.toLowerCase().includes(q));
    }, [categoryOptions, categorySearch]);

    useEffect(() => {
        let alive = true;

        async function load() {
            try {
                const catRes = await apiGetAllCategories();
                const catsSource = Array.isArray(catRes) ? catRes : (catRes as any)?.categories ?? [];

                const cats = catsSource
                    .map((c: any) => {
                        const label = String(c?.name ?? c?.categoryName ?? c?.title ?? "");
                        if (!label) return null;
                        return { value: String(c?._id ?? c?.id ?? label), label };
                    })
                    .filter(Boolean) as Option[];

                const tierRes = await apiListInfluencerTiers({});
                const tiers = unwrapArray(tierRes)
                    .map((t: any) => {
                        const label = t?.category && t?.value ? `${t.category} • ${t.value}` : "";
                        if (!label) return null;
                        return { value: String(t?._id ?? t?.id ?? label), label };
                    })
                    .filter(Boolean) as Option[];

                if (!alive) return;
                setCategoryOptions([{ value: "All", label: "All" }, ...cats]);
                setTierOptions([{ value: "All", label: "All" }, ...tiers]);
            } catch {
                // keep defaults
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, []);

    const clearAll = () => {
        // ✅ default = caret only
        setFilters({
            "Influencer Type": "",
            "Engagement Rate": "",
            Follower: "",
            Category: [],
            Platform: [],
            Date: "",
        });
    };

    const labelTextCls = [
        "text-[var(--Light-Text-Primary,#1A1A1A)]",
        "text-center",
        "font-[var(--Font-Family-Inter,Inter)]",
        "text-[var(--Font-Size-14,0.875rem)]",
        "font-[var(--Font-Weight-regular,400)]",
        "leading-[var(--Line-Height-20,1.25rem)]",
        "tracking-[var(--Letter-Spacing-0,0)]",
    ].join(" ");

    // ✅ remove tick + highlighted bg neutral
    const itemNoTickNeutralSelectedCls = [
        "[&_[data-slot=combobox-item-indicator]]:hidden",
        "data-[highlighted]:bg-[var(--Light-Background-Neutral,#F2F2F2)]",
        "data-[highlighted]:text-[#1A1A1A]",
    ].join(" ");

    // ✅ selected bg neutral except "All"
    const itemSelectedBgUnlessAll = (optValue: string) =>
        optValue === "All"
            ? "data-[selected]:bg-transparent data-[selected]:text-[#1A1A1A]"
            : "data-[selected]:bg-[var(--Light-Background-Neutral,#F2F2F2)] data-[selected]:text-[#1A1A1A]";

    const triggerBgString = (val: string) =>
        val !== "" && val !== "All"
            ? "bg-[var(--Light-Background-Neutral,#F2F2F2)]"
            : "bg-transparent";

    const triggerBgMulti = (arr: string[]) =>
        arr.length > 0 && !arr.includes("All")
            ? "bg-[var(--Light-Background-Neutral,#F2F2F2)]"
            : "bg-transparent";

    const pillTriggerBase = [
        "inline-flex items-center",
        "gap-[0.25rem]",
        "px-2 py-1",
        "rounded-[var(--Border-Radius-S,0.5rem)]",
        "hover:bg-[var(--Light-Background-Neutral,#F2F2F2)]",
        "cursor-pointer",
        "[&_[data-slot=combobox-trigger-icon]]:hidden",
        "text-[var(--Light-Text-Primary,#1A1A1A)]",
        "text-center",
        "font-[var(--Font-Family-Inter,Inter)]",
        "text-[var(--Font-Size-14,0.875rem)]",
        "font-[var(--Font-Weight-Medium,500)]",
        "leading-[var(--Line-Height-20,1.25rem)]",
        "tracking-[var(--Letter-Spacing-0,0)]",
    ];

    // ✅ map categoryId -> label
    const categoryLabelById = useMemo(() => {
        return new Map(categoryOptions.map((o) => [o.value, o.label]));
    }, [categoryOptions]);

    // ✅ Category trigger summary: "First +N" / "All" / caret-only
    const categoryTriggerText = useMemo(() => {
        const sel = filters.Category;
        if (sel.length === 0) return "";
        if (sel.includes("All")) return "All";

        const labels = sel.map((id) => categoryLabelById.get(id) ?? id);

        if (labels.length === 0) return "";
        if (labels.length === 1) return labels[0];
        return `${labels[0]} +${labels.length - 1}`;
    }, [filters.Category, categoryLabelById]);

    // ✅ all category ids (excluding "All")
    const allCategoryIds = useMemo(
        () => categoryOptions.filter((o) => o.value !== "All").map((o) => o.value),
        [categoryOptions]
    );

    // ✅ if "All" is selected and categories load later, ensure all ids are included too
    useEffect(() => {
        if (!filters.Category.includes("All")) return;
        if (allCategoryIds.length === 0) return;

        const current = new Set(filters.Category);
        const missing = allCategoryIds.some((id) => !current.has(id));
        if (!missing) return;

        setFilters((prev) => {
            if (!prev.Category.includes("All")) return prev;
            const merged = Array.from(new Set(["All", ...allCategoryIds, ...prev.Category]));
            return { ...prev, Category: merged };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allCategoryIds]);

    const keepCategoryOpen = () => {
        // helps if the library tries to close after selection
        setCategoryOpen(true);
        setTimeout(() => setCategoryOpen(true), 0);
    };

    // ✅ Category multi-select behavior:
    // - click All => All + all ids selected
    // - unclick All => clear
    // - selecting all ids manually => auto-add All
    // - keep dropdown open while selecting
    const handleCategoryChange = (next: unknown) => {
        const nextArr = Array.isArray(next) ? next.map(String) : [];
        const prevArr = filters.Category;

        const prevHasAll = prevArr.includes("All");
        const nextHasAll = nextArr.includes("All");

        if (nextHasAll && !prevHasAll) {
            // clicked "All" ON
            setFilters((prev) => ({ ...prev, Category: ["All", ...allCategoryIds] }));
            keepCategoryOpen();
            return;
        }

        if (!nextHasAll && prevHasAll) {
            // clicked "All" OFF
            setFilters((prev) => ({ ...prev, Category: [] }));
            keepCategoryOpen();
            return;
        }

        const selectedIds = nextArr.filter((v) => v !== "All");
        const isFullySelected =
            allCategoryIds.length > 0 &&
            allCategoryIds.every((id) => selectedIds.includes(id));

        setFilters((prev) => ({
            ...prev,
            Category: isFullySelected ? ["All", ...selectedIds] : selectedIds,
        }));
        keepCategoryOpen();
    };

    // ✅ map platform -> icon
    const platformIconByValue = useMemo(() => {
        const rec: Record<string, string | undefined> = {};
        PLATFORM_OPTIONS.forEach((o) => {
            rec[o.value] = o.icon;
        });
        return rec;
    }, []);

    const platformCircleCls = [
        "flex",
        "w-[1.75rem]",
        "h-[1.75rem]",
        "p-2", // 0.5rem
        "justify-center",
        "items-center",
        "aspect-square",
        "rounded-[2.5rem]",
        "border",
        "border-[var(--Light-Border-Subtle,#E6E6E6)]",
        "bg-[var(--Light-Background-Primary,#FFF)]",
    ].join(" ");

    // ✅ Platform trigger: icons instead of names
    const platformTriggerNode = useMemo(() => {
        const sel = filters.Platform;

        // caret only
        if (sel.length === 0) return null;

        // keep All as plain text (no circles)
        if (sel.length === 1 && sel[0] === "All") return <span>All</span>;

        const selected = sel.filter((x) => x !== "All");
        if (selected.length === 0) return null;

        const maxIcons = 3;
        const shown = selected.slice(0, maxIcons);
        const extra = selected.length - shown.length;

        return (
            <span className="inline-flex items-center overflow-visible">
                {shown.map((p, idx) => {
                    const icon = platformIconByValue[p];
                    return (
                        <span
                            key={p}
                            className={[platformCircleCls, idx > 0 ? "-ml-2" : ""].join(" ")}
                            style={{ zIndex: 10 + idx }}
                        >
                            {icon ? (
                                <img src={icon} alt="" className="h-4 w-4" />
                            ) : (
                                <span className="text-[0.75rem]">{p}</span>
                            )}
                        </span>
                    );
                })}

                {extra > 0 ? (
                    <span
                        className={[platformCircleCls, shown.length > 0 ? "-ml-2" : ""].join(" ")}
                        style={{ zIndex: 10 + shown.length }}
                    >
                        <span className="text-[0.75rem] font-medium">+{extra}</span>
                    </span>
                ) : null}
            </span>
        );
    }, [filters.Platform, platformIconByValue, platformCircleCls]);

    return (
        <section className="mt-[2rem] px-[2rem]">
            <div className="flex items-start justify-between gap-x-[2.5rem] gap-y-3">
                {/* LEFT: Filters + Clear */}
                <div className="flex min-w-0 flex-1 flex-wrap items-center content-center gap-[0.75rem]">
                    {FILTERS.map((f) => {
                        // ✅ Influencer Type (single)
                        if (f.key === "Influencer Type") {
                            return (
                                <div
                                    key={f.key}
                                    className={[
                                        "inline-flex max-w-full items-center justify-center gap-[0.25rem] whitespace-nowrap",
                                        labelTextCls,
                                    ].join(" ")}
                                >
                                    <span>{f.label}</span>

                                    <Combobox
                                        value={filters["Influencer Type"]}
                                        onValueChange={(next) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                "Influencer Type": String(next),
                                            }))
                                        }
                                    >
                                        <ComboboxTrigger
                                            className={[
                                                ...pillTriggerBase,
                                                triggerBgString(filters["Influencer Type"]),
                                            ].join(" ")}
                                        >
                                            {filters["Influencer Type"] ? (
                                                <span className="max-w-[10rem] truncate">
                                                    {filters["Influencer Type"]}
                                                </span>
                                            ) : null}
                                            <CaretDown className="h-3 w-3" weight="bold" />
                                        </ComboboxTrigger>

                                        <ComboboxContent className="min-w-[14rem]">
                                            <ComboboxList>
                                                {INFLUENCER_TYPE_OPTIONS.map((opt) => (
                                                    <ComboboxItem
                                                        key={opt}
                                                        value={opt}
                                                        className={[
                                                            itemNoTickNeutralSelectedCls,
                                                            itemSelectedBgUnlessAll(opt),
                                                        ].join(" ")}
                                                    >
                                                        {opt}
                                                    </ComboboxItem>
                                                ))}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                </div>
                            );
                        }

                        // ✅ Engagement Rate (single)
                        if (f.key === "Engagement Rate") {
                            return (
                                <div
                                    key={f.key}
                                    className={[
                                        "inline-flex max-w-full items-center justify-center gap-[0.25rem] whitespace-nowrap",
                                        labelTextCls,
                                    ].join(" ")}
                                >
                                    <span>{f.label}</span>

                                    <Combobox
                                        value={filters["Engagement Rate"]}
                                        onValueChange={(next) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                "Engagement Rate": String(next),
                                            }))
                                        }
                                    >
                                        <ComboboxTrigger
                                            className={[
                                                ...pillTriggerBase,
                                                triggerBgString(filters["Engagement Rate"]),
                                            ].join(" ")}
                                        >
                                            {filters["Engagement Rate"] ? (
                                                <span className="max-w-[10rem] truncate">
                                                    {filters["Engagement Rate"]}
                                                </span>
                                            ) : null}
                                            <CaretDown className="h-3 w-3" weight="bold" />
                                        </ComboboxTrigger>

                                        <ComboboxContent className="min-w-[14rem]">
                                            <ComboboxList>
                                                {ENGAGEMENT_OPTIONS.map((opt) => (
                                                    <ComboboxItem
                                                        key={opt}
                                                        value={opt}
                                                        className={[
                                                            itemNoTickNeutralSelectedCls,
                                                            itemSelectedBgUnlessAll(opt),
                                                        ].join(" ")}
                                                    >
                                                        {opt}
                                                    </ComboboxItem>
                                                ))}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                </div>
                            );
                        }

                        // ✅ Category (MULTI) — stores category IDs + All selects everything + stays open
                        if (f.key === "Category") {
                            return (
                                <div
                                    key={f.key}
                                    className={[
                                        "inline-flex max-w-full items-center justify-center gap-[0.25rem] whitespace-nowrap",
                                        labelTextCls,
                                    ].join(" ")}
                                >
                                    <span>{f.label}</span>

                                    <Combobox
                                        multiple
                                        open={categoryOpen}
                                        onOpenChange={(o) => {
                                            setCategoryOpen(o);
                                            if (!o) setCategorySearch("");
                                        }}
                                        value={filters.Category}
                                        onValueChange={(next) => handleCategoryChange(next)}
                                    >
                                        <ComboboxTrigger
                                            className={[
                                                ...pillTriggerBase,
                                                triggerBgMulti(filters.Category),
                                            ].join(" ")}
                                        >
                                            {categoryTriggerText ? (
                                                <span className="max-w-[10rem] truncate">
                                                    {categoryTriggerText}
                                                </span>
                                            ) : null}
                                            <CaretDown className="h-3 w-3" weight="bold" />
                                        </ComboboxTrigger>

                                        <ComboboxContent
                                            className="min-w-[16rem]"
                                            showSearch
                                            searchPlaceholder="Search category..."
                                            searchInputProps={{
                                                value: categorySearch,
                                                onChange: (e) => setCategorySearch((e.target as HTMLInputElement).value),
                                            }}
                                        >
                                            <ComboboxList>
                                                <ComboboxItem
                                                    value="All"
                                                    showCheckbox
                                                    className={[
                                                        itemNoTickNeutralSelectedCls,
                                                        itemSelectedBgUnlessAll("All"),
                                                    ].join(" ")}
                                                >
                                                    All
                                                </ComboboxItem>

                                                {filteredCategoryOptions.map((opt) => (
                                                    <ComboboxItem
                                                        key={opt.value}
                                                        value={opt.value}
                                                        showCheckbox
                                                        className={[
                                                            itemNoTickNeutralSelectedCls,
                                                            itemSelectedBgUnlessAll(opt.value),
                                                        ].join(" ")}
                                                    >
                                                        {opt.label}
                                                    </ComboboxItem>
                                                ))}
                                            </ComboboxList>
                                        </ComboboxContent>

                                    </Combobox>
                                </div>
                            );
                        }

                        // ✅ Influencer Tier (single)
                        if (f.key === "Follower") {
                            return (
                                <div
                                    key={f.key}
                                    className={[
                                        "inline-flex max-w-full items-center justify-center gap-[0.25rem] whitespace-nowrap",
                                        labelTextCls,
                                    ].join(" ")}
                                >
                                    <span>{f.label}</span>

                                    <Combobox
                                        value={filters.Follower}
                                        onValueChange={(next) =>
                                            setFilters((prev) => ({ ...prev, Follower: String(next) }))
                                        }
                                    >
                                        <ComboboxTrigger
                                            className={[
                                                ...pillTriggerBase,
                                                triggerBgString(filters.Follower),
                                            ].join(" ")}
                                        >
                                            {filters.Follower ? (
                                                <span className="max-w-[10rem] truncate">
                                                    {filters.Follower}
                                                </span>
                                            ) : null}
                                            <CaretDown className="h-3 w-3" weight="bold" />
                                        </ComboboxTrigger>

                                        <ComboboxContent className="min-w-[16rem]">
                                            <ComboboxList>
                                                <ComboboxItem
                                                    value="All"
                                                    className={[
                                                        itemNoTickNeutralSelectedCls,
                                                        itemSelectedBgUnlessAll("All"),
                                                    ].join(" ")}
                                                >
                                                    All
                                                </ComboboxItem>

                                                {tierOptions
                                                    .filter((o) => o.value !== "All")
                                                    .map((opt) => (
                                                        <ComboboxItem
                                                            key={opt.value}
                                                            value={opt.label}
                                                            className={[
                                                                itemNoTickNeutralSelectedCls,
                                                                itemSelectedBgUnlessAll(opt.label),
                                                            ].join(" ")}
                                                        >
                                                            {opt.label}
                                                        </ComboboxItem>
                                                    ))}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                </div>
                            );
                        }

                        // ✅ Platform (MULTI) — trigger shows ICONS instead of names
                        if (f.key === "Platform") {
                            return (
                                <div
                                    key={f.key}
                                    className={[
                                        "inline-flex max-w-full items-center justify-center gap-[0.25rem] whitespace-nowrap",
                                        labelTextCls,
                                    ].join(" ")}
                                >
                                    <span>{f.label}</span>

                                    <Combobox
                                        multiple
                                        value={filters.Platform}
                                        onValueChange={(next) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                Platform: normalizeMulti(next),
                                            }))
                                        }
                                    >
                                        <ComboboxTrigger
                                            className={[
                                                ...pillTriggerBase,
                                                "overflow-visible",
                                                "bg-transparent",
                                            ].join(" ")}
                                        >
                                            {platformTriggerNode}
                                            <CaretDown className="h-3 w-3" weight="bold" />
                                        </ComboboxTrigger>

                                        <ComboboxContent className="min-w-[14rem]">
                                            <ComboboxList>
                                                {PLATFORM_OPTIONS.map((opt) => (
                                                    <ComboboxItem
                                                        key={opt.value}
                                                        value={opt.value}
                                                        className={[
                                                            itemNoTickNeutralSelectedCls,
                                                            itemSelectedBgUnlessAll(opt.value),
                                                        ].join(" ")}
                                                    >
                                                        <span className="inline-flex items-center">
                                                            {opt.icon ? (
                                                                <img
                                                                    src={opt.icon}
                                                                    alt=""
                                                                    style={{ width: "1rem", height: "1rem" }}
                                                                />
                                                            ) : null}
                                                            <span className={opt.icon ? "ml-[0.5rem]" : ""}>
                                                                {opt.label}
                                                            </span>
                                                        </span>
                                                    </ComboboxItem>
                                                ))}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                </div>
                            );
                        }

                        // ✅ Date
                        if (f.key === "Date") {
                            return (
                                <div
                                    key={f.key}
                                    className={[
                                        "inline-flex max-w-full items-center justify-center gap-[0.25rem] whitespace-nowrap",
                                        labelTextCls,
                                    ].join(" ")}
                                >
                                    <span>{f.label}</span>

                                    <Combobox
                                        value={filters.Date}
                                        onValueChange={(next) =>
                                            setFilters((prev) => ({ ...prev, Date: String(next) }))
                                        }
                                    >
                                        <ComboboxTrigger
                                            className={[...pillTriggerBase, triggerBgString(filters.Date)].join(
                                                " "
                                            )}
                                        >
                                            {filters.Date ? (
                                                <span className="max-w-[10rem] truncate">{filters.Date}</span>
                                            ) : null}
                                            <CaretDown className="h-3 w-3" weight="bold" />
                                        </ComboboxTrigger>

                                        <ComboboxContent className="min-w-[14rem]">
                                            <ComboboxList>
                                                {DATE_OPTIONS.map((opt) => (
                                                    <ComboboxItem
                                                        key={opt}
                                                        value={opt}
                                                        className={[
                                                            itemNoTickNeutralSelectedCls,
                                                            itemSelectedBgUnlessAll(opt),
                                                        ].join(" ")}
                                                    >
                                                        {opt}
                                                    </ComboboxItem>
                                                ))}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                </div>
                            );
                        }

                        return null;
                    })}

                    {/* Clear */}
                    <button
                        type="button"
                        onClick={clearAll}
                        disabled={!hasAnyApplied}
                        className={[
                            "inline-flex items-center",
                            "gap-[0.25rem]",
                            "px-2 py-1",
                            "rounded-[var(--Border-Radius-S,0.5rem)]",
                            "bg-transparent",
                            "hover:bg-[var(--Light-Background-Neutral,#F2F2F2)]",
                            "whitespace-nowrap",
                            labelTextCls,
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "cursor-pointer",
                        ].join(" ")}
                    >
                        <span>Clear</span>
                        <X className="h-3 w-3" />
                    </button>
                </div>

                {/* RIGHT: Search + Sort */}
                <div className="flex shrink-0 items-start gap-[0.5rem]">
                    {/* Search */}
                    <div
                        className={[
                            "flex h-10 items-center justify-between",
                            "px-2",
                            "rounded-[0.75rem]",
                            "border border-[var(--Light-Border-Subtle,#E6E6E6)]",
                            "bg-white",
                            "w-[18rem] max-w-[40vw]",
                        ].join(" ")}
                    >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            <MagnifyingGlass className="h-4 w-4 shrink-0" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search"
                                className={[
                                    "w-full min-w-0 bg-transparent outline-none",
                                    "text-[var(--Light-Border-Selected,#1A1A1A)]",
                                    "text-left",
                                    "font-[var(--Font-Family-Inter,Inter)]",
                                    "text-[var(--Font-Size-14,0.875rem)]",
                                    "font-[var(--Font-Weight-Semi-Bold,600)]",
                                    "leading-[var(--Line-Height-20,1.25rem)]",
                                    "tracking-[var(--Letter-Spacing-0,0)]",
                                    "placeholder:text-[var(--Light-Border-Selected,#1A1A1A)] placeholder:opacity-60",
                                ].join(" ")}
                            />
                        </div>
                    </div>

                    {/* Sort */}
                    <div
                        className={[
                            "flex h-10 items-center",
                            "px-2",
                            "gap-[0.25rem]",
                            "rounded-[var(--Border-Radius-S,0.5rem)]",
                            "border border-[var(--Light-Border-Subtle,#E6E6E6)]",
                            "bg-white",
                            "w-[10.625rem]",
                        ].join(" ")}
                    >
                        <span className="whitespace-nowrap text-[0.75rem] leading-4 text-[var(--Light-Text-Primary,#1A1A1A)]">
                            Sort :
                        </span>

                        <Combobox
                            value={sortValue}
                            onValueChange={(next) => setSortValue?.(String(next))}
                        >
                            <ComboboxTrigger
                                className={[
                                    "relative group",              // ✅ for tooltip
                                    "flex min-w-0 flex-1 items-center justify-between",
                                    "bg-transparent",
                                    "cursor-pointer",
                                    "overflow-visible",            // ✅ allow tooltip to overflow upward
                                    "[&_[data-slot=combobox-trigger-icon]]:hidden",
                                ].join(" ")}
                            >
                                {/* Text */}
                                <span
                                    className={[
                                        "truncate",
                                        "text-[var(--Light-Text-Primary,#1A1A1A)]",
                                        "text-center",
                                        "font-[var(--Font-Family-Inter,Inter)]",
                                        "text-[0.875rem]",
                                        "font-medium",
                                        "leading-[1.25rem]",
                                    ].join(" ")}
                                    title={sortValue} // ✅ browser fallback tooltip
                                >
                                    {sortValue}
                                </span>

                                {/* ✅ Custom tooltip (shows upward on hover) */}
                                <span
                                    className={[
                                        "pointer-events-none",
                                        "absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
                                        "z-50",
                                        "max-w-[18rem]",
                                        "rounded-md border border-[var(--Light-Border-Subtle,#E6E6E6)]",
                                        "bg-white px-2 py-1",
                                        "text-[0.75rem] leading-4 text-[var(--Light-Text-Primary,#1A1A1A)]",
                                        "shadow-sm",
                                        "whitespace-nowrap", // ✅ single line only
                                        "truncate",          // ✅ ellipsis if too long
                                        "opacity-0 translate-y-1",
                                        "transition",
                                        "group-hover:opacity-100 group-hover:translate-y-0",
                                        "group-focus-within:opacity-100 group-focus-within:translate-y-0",
                                    ].join(" ")}
                                    title={sortValue} // optional fallback (shows full on browser tooltip)
                                >
                                    {sortValue}
                                </span>

                                <CaretDown className="h-3 w-3 shrink-0 ml-[2.5rem]" weight="bold" />
                            </ComboboxTrigger>

                            <ComboboxContent className="min-w-[16rem]">
                                <ComboboxList>
                                    {SORT_OPTIONS.map((opt) => (
                                        <ComboboxItem
                                            key={opt}
                                            value={opt}
                                            className={[
                                                itemNoTickNeutralSelectedCls,
                                                itemSelectedBgUnlessAll(opt),
                                            ].join(" ")}
                                        >
                                            {opt}
                                        </ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </div>
                </div>
            </div>
        </section>
    );
}
