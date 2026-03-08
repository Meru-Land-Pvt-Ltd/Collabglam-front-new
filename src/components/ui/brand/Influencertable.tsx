"use client";

import * as React from "react";
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import {
  CaretUpDown,
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
    engagement: number;
  }>;
  followers?: number;
  engagement?: number;
  appliedDate: string;
  status?: string;
  budget?: string;
};

type InfluencerTableProps = {
  rows: InfluencerRow[];
  onActionClick?: (row: InfluencerRow) => void;
  variant?: "default";
  showStatusColumn?: boolean;
  renderStatus?: (row: InfluencerRow) => React.ReactNode;
  renderAction?: (row: InfluencerRow) => React.ReactNode;
  actionWidthClassName?: string;
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

const profileNameStyle: React.CSSProperties = {
  color: "var(--Light-Text-Primary, #1A1A1A)",
  fontFamily: "var(--Font-Family-Inter, Inter)",
  fontSize: "var(--Font-Size-16, 1rem)",
  fontStyle: "normal",
  fontWeight: 500,
  lineHeight: "var(--Line-Height-24, 1.5rem)",
  letterSpacing: "var(--Letter-Spacing-0, 0)",
};

const handleStyle: React.CSSProperties = {
  color: "var(--Light-Text-Secondary, #969696)",
  fontFamily: "var(--Font-Family-Inter, Inter)",
  fontSize: "var(--Font-Size-14, 0.875rem)",
  fontStyle: "normal",
  fontWeight: 400,
  lineHeight: "var(--Line-Height-20, 1.25rem)",
  letterSpacing: "var(--Letter-Spacing-0, 0)",
  minWidth: 0,
};

const categoryMetaStyle: React.CSSProperties = {
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

const dotStyle: React.CSSProperties = {
  width: "0.125rem",
  height: "0.125rem",
  flexShrink: 0,
  aspectRatio: "1 / 1",
  borderRadius: "9999px",
  background: "var(--Light-Text-Tertiary, #B8B8B8)",
};

function HeaderSort() {
  return <CaretUpDown size={14} weight="bold" className="text-[var(--stone,#343330)]" />;
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

const PLATFORM_ICON_SRC: Record<PlatformType, string> = {
  instagram: "/skill-icons_instagram.svg",
  youtube: "/logos_youtube-icon.svg",
  tiktok: "/ic_baseline-tiktok.svg",
};

function PlatformBubble({ platform }: { platform: PlatformType }) {
  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--Light-Border-Subtle,#E6E6E6)] bg-[var(--Light-Background-Primary,#FFF)]"
      aria-hidden="true"
    >
      <img
        src={PLATFORM_ICON_SRC[platform]}
        alt=""
        className="h-4 w-4"
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

function PillTag({
  text,
  title,
  className = "",
}: {
  text: string;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex min-h-[1.75rem] items-center justify-center rounded-[1.25rem] px-3 ${className}`}
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

function AvatarBlock({
  avatarUrl,
  name,
}: {
  avatarUrl?: string;
  name: string;
}) {
  return (
    <div
      className="h-12 w-12 shrink-0 rounded-[0.75rem] border bg-black"
      style={{
        borderColor:
          "var(--Light-Border-Border-stroke, rgba(255,255,255,0.30))",
        backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      aria-label={name}
    />
  );
}

function ProfileMeta({ row }: { row: InfluencerRow }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate" style={profileNameStyle} title={row.profile.name}>
        {row.profile.name}
      </span>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          marginTop: "0.25rem",
          minWidth: 0,
        }}
      >
        <span className="truncate" style={handleStyle} title={row.profile.handle ?? ""}>
          {row.profile.handle ?? ""}
        </span>

        {!!row.category && (
          <>
            <span aria-hidden="true" style={dotStyle} />
            <span
              className="truncate"
              style={categoryMetaStyle}
              title={row.category}
            >
              {row.category}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

const colDefault = {
  checkbox: "flex-none w-[2.75rem]",
  profile: "flex-[2.4] basis-0 min-w-[14rem]",
  status: "flex-[1.15] basis-0 min-w-[8rem]",
  platform: "flex-[0.95] basis-0 min-w-[6.5rem]",
  budget: "flex-[0.95] basis-0 min-w-[6.5rem]",
  date: "flex-[0.9] basis-0 min-w-[6.5rem]",
  action: "flex-[2.2] basis-0 min-w-[18rem]",
};

function DefaultTable({
  rows,
  onActionClick,
  showStatusColumn = false,
  renderStatus,
  renderAction,
  actionWidthClassName,
}: {
  rows: InfluencerRow[];
  onActionClick?: (row: InfluencerRow) => void;
  showStatusColumn?: boolean;
  renderStatus?: (row: InfluencerRow) => React.ReactNode;
  renderAction?: (row: InfluencerRow) => React.ReactNode;
  actionWidthClassName?: string;
}) {
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  const allChecked = rows.length > 0 && rows.every((r) => Boolean(selected[r.id]));
  const someChecked = rows.some((r) => Boolean(selected[r.id])) && !allChecked;

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    rows.forEach((r) => {
      next[r.id] = checked;
    });
    setSelected(next);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: checked }));
  };

  const actionColClass = actionWidthClassName ?? colDefault.action;

  return (
    <div className="flex w-full flex-col">
      <XScroll>
        <div className="min-w-full w-max">
          <div className="flex h-[2.875rem] w-full min-w-full items-center rounded-[0.875rem] bg-[var(--Light-Background-Neutral,#F2F2F2)] px-2">
            <div className={`${colDefault.checkbox} flex items-center justify-center`}>
              <Checkbox
                className="cursor-pointer"
                checked={allChecked ? true : someChecked ? "indeterminate" : false}
                onCheckedChange={(v) => toggleAll(Boolean(v))}
                aria-label="Select all influencers"
              />
            </div>

            <div className={`${colDefault.profile} flex items-center justify-between px-3`}>
              <span style={headerTextStyle}>Profile</span>
              <HeaderSort />
            </div>

            {showStatusColumn && (
              <div className={`${colDefault.status} flex items-center justify-between px-3`}>
                <span style={headerTextStyle}>Status</span>
                <HeaderSort />
              </div>
            )}

            <div className={`${colDefault.platform} flex items-center justify-center px-3`}>
              <span style={headerTextStyle}>Platform</span>
            </div>

            <div className={`${colDefault.budget} flex items-center justify-center px-3`}>
              <span style={headerTextStyle}>Budget</span>
            </div>

            <div className={`${colDefault.date} flex items-center justify-center px-3`}>
              <span style={headerTextStyle}>Date</span>
            </div>

            <div className={`${actionColClass} flex items-center px-3`}>
              <span style={headerTextStyle}>Action</span>
            </div>
          </div>

          <div className="mt-[1.625rem] w-full space-y-3">
            {rows.map((r) => {
              const platRows = getPlatformRows(r);
              const platforms = platRows.map((p) => p.platform);
              const dateText = formatDDMMYY(r.appliedDate);

              const budgetText = r.budget ?? "—";
              const numericBudget =
                budgetText !== "—" &&
                /^[\d₹,\s.]+$/.test(budgetText.replace(/\s+/g, ""));

              return (
                <div
                  key={r.id}
                  className="flex w-full min-w-full items-center rounded-[1rem] border border-[var(--Light-Border-Primary,#D6D6D6)] bg-[var(--Light-Background-Primary,#FFF)] px-2 py-3"
                >
                  <div className={`${colDefault.checkbox} flex items-center justify-center`}>
                    <Checkbox
                      className="cursor-pointer"
                      checked={Boolean(selected[r.id])}
                      onCheckedChange={(v) => toggleOne(r.id, Boolean(v))}
                      aria-label={`Select ${r.profile.name}`}
                    />
                  </div>

                  <div className={`${colDefault.profile} flex items-center px-3`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <AvatarBlock avatarUrl={r.profile.avatarUrl} name={r.profile.name} />
                      <ProfileMeta row={r} />
                    </div>
                  </div>

                  {showStatusColumn && (
                    <div className={`${colDefault.status} flex items-center justify-center px-3`}>
                      {renderStatus ? (
                        renderStatus(r)
                      ) : r.status ? (
                        <PillTag text={r.status} />
                      ) : (
                        <span className="text-sm text-[#969696]">—</span>
                      )}
                    </div>
                  )}

                  <div className={`${colDefault.platform} flex items-center justify-center px-3`}>
                    <PlatformOverlap platforms={platforms} />
                  </div>

                  <div className={`${colDefault.budget} flex items-center justify-center px-3`}>
                    {numericBudget ? (
                      <span
                        style={{
                          color: "var(--Light-Text-Primary, #1A1A1A)",
                          textAlign: "center",
                          fontFamily: "var(--Font-Family-Inter, Inter)",
                          fontSize: "1rem",
                          fontStyle: "normal",
                          fontWeight: 600,
                          lineHeight: "1.5rem",
                          letterSpacing: "0",
                        }}
                        title={budgetText}
                      >
                        {budgetText}
                      </span>
                    ) : (
                      <PillTag text={budgetText} />
                    )}
                  </div>

                  <div className={`${colDefault.date} flex items-center justify-center px-3`}>
                    <span
                      style={{
                        color: "var(--Light-Text-Secondary, #969696)",
                        textAlign: "center",
                        fontFamily: "var(--Font-Family-Inter, Inter)",
                        fontSize: "var(--Font-Size-14, 0.875rem)",
                        fontStyle: "normal",
                        fontWeight: 400,
                        lineHeight: "var(--Line-Height-20, 1.25rem)",
                        letterSpacing: "var(--Letter-Spacing-0, 0)",
                      }}
                      title={dateText}
                    >
                      {dateText}
                    </span>
                  </div>

                  <div className={`${actionColClass} flex items-center justify-start px-3`}>
                    {renderAction ? (
                      renderAction(r)
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => onActionClick?.(r)}>
                          Send Contract
                        </Button>

                        <Button onClick={() => onActionClick?.(r)}>
                          Manage
                        </Button>

                        <Button variant="outline">
                          <EnvelopeOpen
                            size={16}
                            weight="regular"
                            color="var(--Light-Border-Selected, #1A1A1A)"
                          />
                        </Button>

                        <Button variant="outline">
                          <DotsThree
                            size={16}
                            weight="bold"
                            color="var(--Light-Border-Selected, #1A1A1A)"
                          />
                        </Button>
                      </div>
                    )}
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
  showStatusColumn = false,
  renderStatus,
  renderAction,
  actionWidthClassName,
}: InfluencerTableProps) {
  return (
    <DefaultTable
      rows={rows}
      onActionClick={onActionClick}
      showStatusColumn={showStatusColumn}
      renderStatus={renderStatus}
      renderAction={renderAction}
      actionWidthClassName={actionWidthClassName}
    />
  );
}