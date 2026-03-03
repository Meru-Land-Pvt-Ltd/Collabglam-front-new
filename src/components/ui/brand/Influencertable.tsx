// components/ui/brand/Influencertable.tsx
"use client";

import * as React from "react";
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  ChartLine,
  X,
  QuestionMark,
  Check,
  DotsThree,
  EnvelopeOpen,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/buttonComp";

export type PlatformType = "instagram" | "youtube" | "tiktok";

export type InfluencerRow = {
  id: string;
  profile: {
    name: string;
    handle?: string;
    avatarUrl?: string;
  };

  category: string;

  platforms?: Array<{
    platform: PlatformType;
    followers: number;
    engagement: number; // %
  }>;

  followers?: number;
  engagement?: number;

  appliedDate: string; // ISO ("2026-02-12") or text

  // shortlisted
  status?: string; // "Contract Sent"
  budget?: string; // "₹25,000"
};

type InfluencerTableProps = {
  rows: InfluencerRow[];
  onActionClick?: (row: InfluencerRow) => void; // tick click (default)
  variant?: "default" | "shortlisted";
};

const headerTextStyle: React.CSSProperties = {
  color: "var(--Text-Primary, #1A1A1A)",
  fontFamily: "var(--Font-Family-Inter, Inter)",
  fontSize: "var(--Font-Size-14, 0.875rem)",
  fontStyle: "normal",
  fontWeight: "var(--Font-Weight-Semi-Bold, 600)" as any,
  lineHeight: "var(--Line-Height-20, 1.25rem)",
  letterSpacing: "var(--Letter-Spacing-0, 0)",
};

function HeaderCarets() {
  const iconClass = "h-3 w-3 text-[var(--stone,#343330)]";
  return (
    <span className="flex flex-col items-center leading-none">
      <ChevronUp className={iconClass} strokeWidth={3} />
      <ChevronDown className={iconClass} strokeWidth={3} />
    </span>
  );
}

/** helpers */
function formatCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

function getPlatformRows(r: InfluencerRow) {
  if (r.platforms?.length) return r.platforms;

  const baseFollowers = r.followers ?? 0;
  const baseEng = r.engagement ?? 0;

  const ig = Math.round(baseFollowers * 0.55);
  const yt = Math.round(baseFollowers * 0.25);
  const tt = Math.max(0, baseFollowers - ig - yt);

  return [
    { platform: "instagram" as const, followers: ig, engagement: baseEng },
    { platform: "youtube" as const, followers: yt, engagement: Math.max(0, baseEng * 0.5) },
    { platform: "tiktok" as const, followers: tt, engagement: Math.max(0, baseEng * 0.3) },
  ];
}

function formatDDMMYY(input: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

/** platform icon chips (your svg files) */
const PLATFORM_ICON_SRC: Record<PlatformType, string> = {
  instagram: "/skill-icons_instagram.svg",
  youtube: "/logos_youtube-icon.svg",
  tiktok: "/ic_baseline-tiktok.svg",
};

function PlatformBubble({ platform }: { platform: PlatformType }) {
  return (
    <span
      style={{
        display: "flex",
        width: "1.75rem",
        height: "1.75rem",
        padding: "0.5rem",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.625rem",
        aspectRatio: "1 / 1",
        borderRadius: "2.5rem",
        border: "1px solid var(--Light-Border-Subtle, #E6E6E6)",
        background: "var(--Light-Background-Primary, #FFF)",
        boxSizing: "border-box",
      }}
      aria-hidden="true"
    >
      <img
        src={PLATFORM_ICON_SRC[platform]}
        alt=""
        style={{ width: "1rem", height: "1rem" }}
        draggable={false}
      />
    </span>
  );
}

function PlatformOverlap({ platforms }: { platforms: PlatformType[] }) {
  const list = Array.from(new Set(platforms)).slice(0, 3);
  return (
    <div className="flex items-center justify-center">
      {list.map((p, idx) => (
        <div
          key={`${p}-${idx}`}
          style={{
            marginLeft: idx === 0 ? 0 : "-0.5rem",
            position: "relative",
            zIndex: 10 - idx,
          }}
        >
          <PlatformBubble platform={p} />
        </div>
      ))}
    </div>
  );
}

function PillTag({ text, title }: { text: string; title?: string }) {
  return (
    <div
      className="flex min-h-[1.75rem] items-center justify-center rounded-[1.25rem] px-3"
      style={{ background: "var(--Light-Text-PrimaryInverse,#F9F9F9)" }}
      title={title ?? text}
    >
      <span
        style={{
          color: "var(--Light-Text-Primary, #1A1A1A)",
          textAlign: "center",
          fontFamily: "var(--Font-Family-Inter, Inter)",
          fontSize: "var(--Font-Size-14, 0.875rem)",
          fontStyle: "normal",
          fontWeight: "var(--Font-Weight-Semi-Bold, 600)" as any,
          lineHeight: "var(--Line-Height-20, 1.25rem)",
          letterSpacing: "var(--Letter-Spacing-0, 0)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  );
}

/** DEFAULT table action group (X ? ✓) */
function ActionGroup({ onSelect }: { onSelect?: () => void }) {
  const b = "var(--Light-Border-Primary,#D6D6D6)";
  return (
    <div className="flex items-stretch justify-center self-stretch">
      {/* X */}
      <button
        type="button"
        className="flex items-center justify-center self-stretch px-4 transition-colors cursor-pointer"
        style={{
          borderTop: `1px solid ${b}`,
          borderBottom: `1px solid ${b}`,
          borderLeft: `1px solid ${b}`,
          borderRadius: "0.5rem 0 0 0.5rem",
        }}
        onMouseEnter={(e) =>
        (e.currentTarget.style.background =
          "var(--Light-Background-Negative-Subtle, #F9CACA)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        aria-label="Reject"
      >
        <X size={18} weight="bold" />
      </button>

      {/* ? */}
      <button
        type="button"
        className="flex items-center justify-center self-stretch px-4 transition-colors cursor-pointer"
        style={{
          borderTop: `1px solid ${b}`,
          borderBottom: `1px solid ${b}`,
          borderLeft: `1px solid ${b}`,
          borderRadius: 0,
        }}
        onMouseEnter={(e) =>
        (e.currentTarget.style.background =
          "var(--Light-Background-BrandSubtle, #FFF9E6)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        aria-label="Undecided"
      >
        <QuestionMark size={18} weight="bold" />
      </button>

      {/* ✓ */}
      <button
        type="button"
        className="flex items-center justify-center self-stretch px-4 transition-colors cursor-pointer"
        style={{
          borderTop: `1px solid ${b}`,
          borderBottom: `1px solid ${b}`,
          borderLeft: `1px solid ${b}`,
          borderRight: `1px solid ${b}`,
          borderRadius: "0 0.5rem 0.5rem 0",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--Success-50, #EAF6EC)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        aria-label="Selected"
        onClick={onSelect}
      >
        <Check size={18} weight="bold" />
      </button>
    </div>
  );
}

/** scroll wrapper: scroll only when needed + hide scrollbar */
function XScroll({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        w-full overflow-x-auto overflow-y-hidden
        [scrollbar-width:none] [-ms-overflow-style:none]
        [&::-webkit-scrollbar]:hidden
      "
    >
      {children}
    </div>
  );
}

/** DEFAULT table column widths */
const colDefault = {
  profile: "flex-none w-[245px]",
  category: "min-w-[8.625rem] flex-1 min-w-0",
  followers: "min-w-[7.625rem] flex-1 min-w-0",
  engagement: "min-w-[7.8125rem] flex-1 min-w-0",
  applied: "min-w-[9rem] flex-1 min-w-0",
  actions: "flex-none w-[14.125rem]",
};

/** SHORTLISTED columns (flex) — important:
 *  - row/header use: w-max min-w-full
 *  - so border includes ALL items during horizontal scroll
 */
/** SHORTLISTED columns — FILL (no empty space) */
const colShort = {
  checkbox: "flex-none w-14",             // fixed
  profile: "flex-[2] basis-0 min-w-0",    // grow more
  status: "flex-1 basis-0 min-w-0",
  platform: "flex-1 basis-0 min-w-0",
  budget: "flex-1 basis-0 min-w-0",
  date: "flex-1 basis-0 min-w-0",
  action: "flex-[2] basis-0 min-w-0",     // grow more
};


function DefaultTable({
  rows,
  onActionClick,
}: {
  rows: InfluencerRow[];
  onActionClick?: (row: InfluencerRow) => void;
}) {
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  const allChecked = rows.length > 0 && rows.every((r) => Boolean(selected[r.id]));
  const someChecked = rows.some((r) => Boolean(selected[r.id])) && !allChecked;

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    rows.forEach((r) => (next[r.id] = checked));
    setSelected(next);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: checked }));
  };

  return (
    <div className="flex w-full flex-col">
      <XScroll>
        {/* inner takes full width but can grow (so border wraps in scroll) */}
        <div className="w-full">
          <div className="w-full">
            {/* HEADER */}
            <div
              className="
              flex h-14 w-full min-w-full items-center
              bg-[var(--Light-Background-Neutral,#F2F2F2)]
              rounded-tr-[0.75rem]
              rounded-bl-[0.75rem]
              rounded-br-[0.75rem]
            "
            >
              <div className={`${colDefault.profile} flex h-14 items-center`}>
                <div className="flex h-14 items-center justify-center gap-1 py-[0.625rem] pl-[1rem] pr-[0.75rem] rounded-tl-[0.75rem]">
                  <Checkbox
                    className="cursor-pointer"
                    checked={allChecked ? true : someChecked ? "indeterminate" : false}
                    onCheckedChange={(v) => toggleAll(Boolean(v))}
                    aria-label="Select all influencers"
                  />
                </div>

                <div className="flex h-14 flex-1 items-center justify-between px-4 py-[0.625rem]">
                  <span style={headerTextStyle}>Profile</span>
                  <HeaderCarets />
                </div>
              </div>

              <div className={`${colDefault.category} relative flex h-14 items-center px-4 py-[0.625rem]`}>
                <span className="mx-auto" style={headerTextStyle}>
                  Category
                </span>
                <span className="absolute right-4">
                  <HeaderCarets />
                </span>
              </div>

              <div className={`${colDefault.followers} flex h-14 items-center justify-between px-4 py-[0.625rem]`}>
                <span style={headerTextStyle}>Followers</span>
                <HeaderCarets />
              </div>

              <div className={`${colDefault.engagement} flex h-14 items-center justify-between px-4 py-[0.625rem]`}>
                <span style={headerTextStyle}>Engagement</span>
                <HeaderCarets />
              </div>

              <div className={`${colDefault.applied} relative flex h-14 items-center px-4 py-[0.625rem]`}>
                <span className="mx-auto" style={headerTextStyle}>
                  Applied Date
                </span>
                <span className="absolute right-4">
                  <HeaderCarets />
                </span>
              </div>

              <div className={`${colDefault.actions} flex h-14 items-center pl-4 pr-4`}>
                <span style={headerTextStyle}>Action</span>
              </div>
            </div>

            {/* GAP */}
            <div className="mt-[2rem] w-full space-y-3">
              {rows.map((r) => {
                const plat = getPlatformRows(r);
                const appliedText = r.appliedDate.toLowerCase().startsWith("applied")
                  ? r.appliedDate
                  : `applied ${r.appliedDate}`;

                return (
                  <div
                    key={r.id}
                    className="
                    flex w-full min-w-full items-center
                    rounded-[0.75rem]
                    border border-[var(--Light-Border-Primary,#D6D6D6)]
                    bg-[var(--Light-Background-Primary,#FFF)]
                    overflow-hidden
                  "
                  >
                    {/* PROFILE */}
                    <div
                      className={`${colDefault.profile} flex h-[5.5rem] items-center bg-white rounded-l-[12px] px-4 py-[10px]`}
                    >
                      <div className="flex w-full items-center gap-4">
                        <Checkbox
                          className="cursor-pointer"
                          checked={Boolean(selected[r.id])}
                          onCheckedChange={(v) => toggleOne(r.id, Boolean(v))}
                          aria-label={`Select ${r.profile.name}`}
                        />

                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="h-12 w-12 shrink-0 rounded-[0.5rem] border bg-black"
                            style={{
                              borderColor:
                                "var(--Light-Border-Border-stroke, rgba(255,255,255,0.30))",
                              backgroundImage: r.profile.avatarUrl
                                ? `url(${r.profile.avatarUrl})`
                                : undefined,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          />

                          <div className="flex min-w-0 flex-col">
                            <span
                              className="truncate"
                              style={{
                                color: "var(--Light-Text-Primary, #1A1A1A)",
                                fontFamily: "var(--Font-Family-Inter, Inter)",
                                fontSize: "var(--Font-Size-16, 1rem)",
                                fontStyle: "normal",
                                fontWeight: 500,
                                lineHeight: "var(--Line-Height-24, 1.5rem)",
                                letterSpacing: "var(--Letter-Spacing-0, 0)",
                              }}
                              title={r.profile.name}
                            >
                              {r.profile.name}
                            </span>

                            <span
                              className="truncate"
                              style={{
                                marginTop: "0.25rem",
                                color: "var(--Light-Text-Secondary, #969696)",
                                fontFamily: "var(--Font-Family-Inter, Inter)",
                                fontSize: "var(--Font-Size-14, 0.875rem)",
                                fontStyle: "normal",
                                fontWeight: 400,
                                lineHeight: "var(--Line-Height-20, 1.25rem)",
                                letterSpacing: "var(--Letter-Spacing-0, 0)",
                              }}
                              title={r.profile.handle ?? ""}
                            >
                              {r.profile.handle ?? ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CATEGORY */}
                    <div className={`${colDefault.category} flex h-[5.5rem] items-center justify-center bg-white px-4 py-[0.625rem]`}>
                      <PillTag text={r.category} />
                    </div>

                    {/* FOLLOWERS */}
                    <div className={`${colDefault.followers} flex h-[5.5rem] items-center justify-center bg-white px-4 py-[0.625rem]`}>
                      <div className="flex w-full flex-col justify-center gap-2">
                        {plat.map((p) => (
                          <div key={`f-${r.id}-${p.platform}`} className="flex w-full items-center gap-2">
                            <span
                              className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--Light-Border-Subtle,#E6E6E6)] bg-white"
                              style={{ borderWidth: "0.5px", padding: "0.25rem" }}
                              aria-hidden="true"
                            >
                              <img
                                src={PLATFORM_ICON_SRC[p.platform]}
                                alt=""
                                className="h-5 w-5"
                                draggable={false}
                              />
                            </span>

                            <span
                              style={{
                                color: "var(--Light-Text-Primary, #1A1A1A)",
                                fontFamily: "Inter",
                                fontSize: "0.75rem",
                                fontStyle: "normal",
                                fontWeight: 400,
                                lineHeight: "1rem",
                              }}
                            >
                              {formatCompact(p.followers)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ENGAGEMENT */}
                    <div className={`${colDefault.engagement} flex h-[5.5rem] items-center justify-center bg-white px-4 py-[0.625rem]`}>
                      <div className="flex w-full flex-col justify-center gap-2">
                        {plat.map((p) => (
                          <div key={`e-${r.id}-${p.platform}`} className="flex w-full items-center gap-2">
                            <ChartLine size={16} weight="bold" color="#D6D6D6" />
                            <span
                              style={{
                                color: "var(--Light-Text-Primary, #1A1A1A)",
                                fontFamily: "Inter",
                                fontSize: "0.75rem",
                                fontStyle: "normal",
                                fontWeight: 400,
                                lineHeight: "1rem",
                              }}
                            >
                              {p.engagement.toFixed(2)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* APPLIED DATE */}
                    <div className={`${colDefault.applied} flex h-[5.5rem] items-center justify-center bg-white px-4 py-[0.625rem]`}>
                      <span
                        className="truncate"
                        style={{
                          width: "100%",
                          overflow: "hidden",
                          color: "var(--Light-Text-Secondary, #969696)",
                          textAlign: "center",
                          textOverflow: "ellipsis",
                          fontFamily: "var(--Font-Family-Inter, Inter)",
                          fontSize: "var(--Font-Size-14, 0.875rem)",
                          fontStyle: "normal",
                          fontWeight: 400,
                          lineHeight: "var(--Line-Height-20, 1.25rem)",
                          letterSpacing: "var(--Letter-Spacing-0, 0)",
                        }}
                        title={appliedText}
                      >
                        {appliedText}
                      </span>
                    </div>

                    {/* ACTIONS */}
                    <div className={`${colDefault.actions} flex h-[5.5rem] items-center justify-end gap-2 bg-white pl-4 pr-4 py-[0.625rem] rounded-r-[0.75rem]`}>
                      <ActionGroup onSelect={() => onActionClick?.(r)} />

                      <button
                        type="button"
                        aria-label="More actions"
                        className="flex items-center justify-center h-9 w-9 aspect-square cursor-pointer rounded-[0.5rem] transition-colors hover:bg-[#EDEDED]"
                      >
                        <DotsThree size={20} weight="bold" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </XScroll>
    </div>
  );
}

function ShortlistedTable({ rows }: { rows: InfluencerRow[] }) {
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  const allChecked = rows.length > 0 && rows.every((r) => Boolean(selected[r.id]));
  const someChecked = rows.some((r) => Boolean(selected[r.id])) && !allChecked;

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    rows.forEach((r) => (next[r.id] = checked));
    setSelected(next);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: checked }));
  };

  const categoryUnderHandleStyle: React.CSSProperties = {
    display: "-webkit-box",
    minWidth: "2.8125rem",
    maxWidth: "6.5rem",
    WebkitBoxOrient: "vertical" as any,
    WebkitLineClamp: 1 as any,
    overflow: "hidden",
    color: "var(--Light-Text-Tertiary, #B8B8B8)",
    textOverflow: "ellipsis",
    fontFamily: "Inter",
    fontSize: "0.75rem",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "1rem",
  };
  const handleStyle = {
    color: "var(--Light-Text-Secondary, #969696)",
    fontFamily: "var(--Font-Family-Inter, Inter)",
    fontSize: "var(--Font-Size-14, 0.875rem)",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "var(--Line-Height-20, 1.25rem)",
    letterSpacing: "var(--Letter-Spacing-0, 0)",
    minWidth: 0, // helps truncate inside flex
  };

  const dotStyle = {
    width: "0.125rem",
    height: "0.125rem",
    flexShrink: 0,
    aspectRatio: "1 / 1",
    borderRadius: "9999px",
    background: "var(--Light-Text-Tertiary, #B8B8B8)",
  };

  return (
    <div className="flex w-full flex-col">
      <XScroll>
        {/* ✅ IMPORTANT:
            w-max + min-w-full => border wraps ALL items even when horizontally scrolled
        */}
        <div className="min-w-full w-max">
          {/* HEADER */}
          <div
            className="
              flex h-14 w-full min-w-full items-center
              bg-[var(--Light-Background-Neutral,#F2F2F2)]
              rounded-tr-[0.75rem]
              rounded-bl-[0.75rem]
              rounded-br-[0.75rem]
            "
          >
            {/* Checkbox */}
            <div className={`${colShort.checkbox} flex h-14 items-center justify-center rounded-tl-[0.75rem]`}>
              <Checkbox
                className="cursor-pointer"
                checked={allChecked ? true : someChecked ? "indeterminate" : false}
                onCheckedChange={(v) => toggleAll(Boolean(v))}
                aria-label="Select all"
              />
            </div>

            {/* Profile (spec: width auto grows, padding 0.625rem 1rem, justify-between) */}
            <div className={`${colShort.profile} flex h-14 items-center justify-between px-4 py-[0.625rem]`}>
              <span style={headerTextStyle}>Profile</span>
              <HeaderCarets />
            </div>

            {/* Status (spec: justify-between + carets) */}
            <div className={`${colShort.status} flex h-14 items-center justify-between px-4 py-[0.625rem]`}>
              <span style={headerTextStyle}>Status</span>
              <HeaderCarets />
            </div>

            <div className={`${colShort.platform} flex h-14 items-center justify-center px-4 py-[0.625rem]`}>
              <span style={headerTextStyle}>Platform</span>
            </div>

            <div className={`${colShort.budget} flex h-14 items-center justify-center px-4 py-[0.625rem]`}>
              <span style={headerTextStyle}>Budget</span>
            </div>

            <div className={`${colShort.date} flex h-14 items-center justify-center px-4 py-[0.625rem]`}>
              <span style={headerTextStyle}>Date</span>
            </div>

            <div className={`${colShort.action} flex h-14 items-center pl-4 pr-4 py-[0.625rem]`}>
              <span style={headerTextStyle}>Action</span>
            </div>
          </div>

          {/* GAP + ROWS (0.75rem gap = space-y-3) */}
          <div className="mt-[2rem] w-full space-y-3">
            {rows.map((r) => {
              const platRows = getPlatformRows(r);
              const platforms = platRows.map((p) => p.platform);

              const statusText = r.status ?? "Contract Sent";
              const budgetText = r.budget ?? "₹0";
              const dateText = formatDDMMYY(r.appliedDate);

              return (
                <div
                  key={r.id}
                  className="
    flex w-full items-center
    rounded-[0.75rem]
    border border-[var(--Light-Border-Primary,#D6D6D6)]
    bg-[var(--Light-Background-Primary,#FFF)]
    overflow-hidden
  "
                >
                  {/* checkbox */}
                  <div className={`${colShort.checkbox} flex h-[5.5rem] items-center justify-center`}>
                    <Checkbox
                      className="cursor-pointer"
                      checked={Boolean(selected[r.id])}
                      onCheckedChange={(v) => toggleOne(r.id, Boolean(v))}
                      aria-label={`Select ${r.profile.name}`}
                    />
                  </div>

                  {/* profile */}
                  <div className={`${colShort.profile} flex h-[5.5rem] items-center px-4`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-12 w-12 shrink-0 rounded-[0.5rem] border bg-black"
                        style={{
                          borderColor:
                            "var(--Light-Border-Border-stroke, rgba(255,255,255,0.30))",
                          backgroundImage: r.profile.avatarUrl
                            ? `url(${r.profile.avatarUrl})`
                            : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />

                      <div className="flex min-w-0 flex-col">
                        <span
                          className="truncate"
                          style={{
                            color: "var(--Light-Text-Primary, #1A1A1A)",
                            fontFamily: "var(--Font-Family-Inter, Inter)",
                            fontSize: "var(--Font-Size-16, 1rem)",
                            fontStyle: "normal",
                            fontWeight: 500,
                            lineHeight: "var(--Line-Height-24, 1.5rem)",
                            letterSpacing: "var(--Letter-Spacing-0, 0)",
                          }}
                          title={r.profile.name}
                        >
                          {r.profile.name}
                        </span>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",     // handle -> 0.25 -> dot -> 0.25 -> category
                            marginTop: "0.25rem",
                            minWidth: 0,
                          }}
                        >
                          <span className="truncate" style={handleStyle} title={r.profile.handle ?? ""}>
                            {r.profile.handle ?? ""}
                          </span>

                          {!!r.category && (
                            <>
                              <span aria-hidden="true" style={dotStyle} />
                              <span
                                className="truncate"
                                style={categoryUnderHandleStyle}  // keep your existing style
                                title={r.category}
                              >
                                {r.category}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* status */}
                  <div className={`${colShort.status} flex h-[5.5rem] items-center justify-center px-4`}>
                    <PillTag text={statusText} />
                  </div>

                  {/* platform overlap */}
                  <div className={`${colShort.platform} flex h-[5.5rem] items-center justify-center px-4`}>
                    <PlatformOverlap platforms={platforms} />
                  </div>

                  {/* budget */}
                  <div className={`${colShort.budget} flex h-[5.5rem] items-center justify-center px-4`}>
                    <PillTag text={budgetText} />
                  </div>

                  {/* date */}
                  <div className={`${colShort.date} flex h-[5.5rem] items-center justify-center px-4`}>
                    <span
                      style={{
                        flex: "1 0 0",
                        color: "var(--Light-Text-Secondary, #969696)",
                        textAlign: "center",
                        fontFamily: "var(--Font-Family-Inter, Inter)",
                        fontSize: "var(--Font-Size-14, 0.875rem)",
                        fontStyle: "normal",
                        fontWeight: "var(--Font-Weight-regular, 400)" as any,
                        lineHeight: "var(--Line-Height-20, 1.25rem)",
                        letterSpacing: "var(--Letter-Spacing-0, 0)",
                      }}
                      title={dateText}
                    >
                      {dateText}
                    </span>
                  </div>

                  {/* actions (✅ pr-4 = 1rem right padding, keeps dots inside) */}
                  <div className={`${colShort.action} flex h-[5.5rem] items-center justify-start pl-4 pr-4`}>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="h-8 rounded-[0.5rem] border border-[var(--Light-Border-Subtle,#E6E6E6)] shadow-none"
                      >
                        Send Contract
                      </Button>

                      <Button className="h-8 w-[6.25rem] justify-center rounded-[0.5rem] bg-[var(--Light-Background-Selected,#1A1A1A)] text-white shadow-none">
                        Manage
                      </Button>

                      <button
                        type="button"
                        aria-label="Mail"
                        className="relative flex h-8 w-8 items-center justify-center"
                        style={{
                          borderRadius: "var(--Border-Radius-S, 0.5rem)",
                          border: "1px solid var(--Light-Border-Subtle, #E6E6E6)",
                          background: "var(--Light-Background-Primary, #FFF)",
                        }}
                      >
                        <EnvelopeOpen
                          size={18}
                          weight="regular"
                          color="var(--Light-Border-Selected, #1A1A1A)"
                        />
                        <span
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            top: "0.35rem",
                            right: "0.35rem",
                            width: "0.375rem",
                            height: "0.375rem",
                            borderRadius: "999px",
                            background: "var(--Light-Icon-Positive, #28A745)",
                          }}
                        />
                      </button>

                      <button
                        type="button"
                        aria-label="More"
                        className="flex h-8 w-8 items-center justify-center"
                        style={{
                          borderRadius: "var(--Border-Radius-S, 0.5rem)",
                          border: "1px solid var(--Light-Border-Subtle, #E6E6E6)",
                          background: "var(--Light-Background-Primary, #FFF)",
                        }}
                      >
                        <DotsThree
                          size={18}
                          weight="bold"
                          color="var(--Light-Border-Selected, #1A1A1A)"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </XScroll>
    </div>
  );
}

export function InfluencerTable({
  rows,
  onActionClick,
  variant = "default",
}: InfluencerTableProps) {
  if (variant === "shortlisted") return <ShortlistedTable rows={rows} />;
  return <DefaultTable rows={rows} onActionClick={onActionClick} />;
}
