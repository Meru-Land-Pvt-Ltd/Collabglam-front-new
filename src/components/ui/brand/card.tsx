"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DotsThree,
  FileMinus,
  PaperPlaneTilt,
  Users,
  Wallet,
  YoutubeLogo,
  InstagramLogo,
  TiktokLogo,
} from "@phosphor-icons/react";

export type CardSize = "sm" | "md" | "lg";
export type StatusVariant =
  | "active"
  | "paused"
  | "draft"
  | "expired"
  | "scheduled"
  | "completed";

export type StatItem = {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
};

export type EdgeBadge = {
  label: string;
  className?: string;
};

export interface BrandCampaignCardProps {
  size?: CardSize;
  className?: string;

  logoUrl?: string;
  logoUrls?: string[];
  logoAriaLabel?: string;

  name: string;

  statusLabel: string;
  statusVariant: StatusVariant;
  showStatusChevron?: boolean;

  tags?: string[];
  stats?: StatItem[];

  edgeBadges?: EdgeBadge[];

  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
}

const cx = (...c: Array<string | undefined | null | false>) =>
  c.filter(Boolean).join(" ");

function getDefaultIcon(label: string) {
  const key = label.trim().toLowerCase();

  if (key === "platform" || key === "youtube")
    return <YoutubeLogo weight="regular" />;
  if (key === "instagram") return <InstagramLogo weight="regular" />;
  if (key === "tiktok" || key === "tik tok")
    return <TiktokLogo weight="regular" />;

  if (key === "wallet balance" || key === "wallet" || key === "budget") {
    return <Wallet weight="regular" />;
  }
  if (key === "applied" || key === "applicants")
    return <FileMinus weight="regular" />;
  if (key === "influencer") return <Users weight="regular" />;
  if (key === "email") return <PaperPlaneTilt weight="regular" />;

  return null;
}

function normalizeStatusVariant(variant: string): StatusVariant {
  const v = String(variant || "")
    .trim()
    .toLowerCase();

  if (v === "active") return "active";
  if (v === "paused") return "paused";
  if (v === "draft") return "draft";
  if (v === "scheduled") return "scheduled";
  if (v === "completed" || v === "complete") return "completed";
  if (v === "expired") return "expired";

  return "draft";
}

function statusPillBg(variant: StatusVariant | string) {
  switch (normalizeStatusVariant(variant)) {
    case "active":
      return "bg-[#BCE4C5]";
    case "paused":
      return "bg-[#F5C6CB]";
    case "draft":
      return "bg-[#E0E0E0]";
    case "scheduled":
      return "bg-[#BDD7F5]";
    case "completed":
      return "bg-[#FAD6C0]";
    case "expired":
    default:
      return "bg-[#E0E0E0]";
  }
}

function statusDotBg(variant: StatusVariant | string) {
  switch (normalizeStatusVariant(variant)) {
    case "active":
      return "bg-[#28A745]";
    case "paused":
      return "bg-[#DC3545]";
    case "draft":
      return "bg-[#9E9E9E]";
    case "scheduled":
      return "bg-[#4A90D9]";
    case "completed":
      return "bg-[#F07B3F]";
    case "expired":
    default:
      return "bg-[#9E9E9E]";
  }
}

function cardSpacing(size: CardSize) {
  const top = {
    px: "px-[clamp(12px,2.2vw,16px)]",
    pt: "pt-[clamp(16px,2.6vw,20px)]",
    pb: "pb-[clamp(12px,2.2vw,16px)]",
    gap: "gap-[clamp(16px,3vw,24px)]",
  };

  if (size === "sm") {
    return {
      topWrap: cx(
        "flex w-full flex-col",
        "px-[clamp(10px,2vw,14px)]",
        "pt-[clamp(14px,2.2vw,18px)]",
        "pb-[clamp(10px,2vw,14px)]",
        "gap-[clamp(14px,2.4vw,20px)]"
      ),
      footerWrap: cx(
        "relative flex w-full flex-col items-center text-center",
        "px-[clamp(12px,2.2vw,20px)]",
        "pt-[clamp(24px,4.4vw,34px)]",
        "pb-[clamp(10px,2vw,14px)]",
        "gap-[clamp(8px,1.8vw,12px)]"
      ),
    };
  }

  if (size === "lg") {
    return {
      topWrap: cx(
        "flex w-full flex-col",
        "px-[clamp(14px,2.4vw,18px)]",
        "pt-[clamp(18px,2.8vw,22px)]",
        "pb-[clamp(14px,2.4vw,18px)]",
        "gap-[clamp(18px,3.2vw,26px)]"
      ),
      footerWrap: cx(
        "relative flex w-full flex-col items-center text-center",
        "px-[clamp(16px,3.2vw,36px)]",
        "pt-[clamp(28px,5vw,44px)]",
        "pb-[clamp(12px,2.4vw,18px)]",
        "gap-[clamp(8px,1.8vw,12px)]"
      ),
    };
  }

  return {
    topWrap: cx("flex w-full flex-col", top.px, top.pt, top.pb, top.gap),
    footerWrap: cx(
      "relative flex w-full flex-col items-center text-center",
      "px-[clamp(14px,3vw,32px)]",
      "pt-[clamp(28px,5vw,40px)]",
      "pb-[clamp(12px,2.2vw,16px)]",
      "gap-[clamp(8px,1.8vw,12px)]"
    ),
  };
}

export function BrandCampaignCardSkeleton({
  size = "md",
  className,
}: {
  size?: CardSize;
  className?: string;
}) {
  const s = cardSpacing(size);

  return (
    <div
      data-emc-brand-card
      className={cx(
        "flex w-full min-w-0 flex-col overflow-hidden rounded-[1rem] border border-bd-primary bg-card",
        "min-h-[19.375rem]",
        className
      )}
    >
      <div className={s.topWrap}>
        <div className={cx("flex w-full items-center", "gap-[clamp(10px,2vw,16px)]")}>
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[0.5rem] bg-neutral-900">
            <div className="h-full w-full animate-pulse bg-muted" />
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
              <div className="mt-2 h-4 w-28 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="h-4 w-24 animate-pulse rounded-md bg-muted justify-self-start sm:justify-self-end" />
          </div>

          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />
        </div>

        <div className="flex w-full items-center justify-between gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-1 flex-col items-center gap-2 text-center"
            >
              <div className="h-4 w-20 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>

      <div
        className={cx(
          s.footerWrap,
          "bg-card",
          "before:absolute before:left-4 before:right-4 before:top-6 before:h-px before:bg-border"
        )}
      >
        <div className="flex w-full items-center gap-2">
          <div className="h-11 flex-1 animate-pulse rounded-[0.75rem] bg-muted" />
          <div className="h-11 w-11 animate-pulse rounded-[0.75rem] bg-muted" />
        </div>
        <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}

export default function BrandCampaignCard({
  size = "md",
  className,
  logoUrl,
  logoUrls,
  logoAriaLabel = "Brand logo",
  name,
  statusLabel,
  statusVariant,
  showStatusChevron = true,
  tags,
  stats,
  edgeBadges,
  headerRight,
  footer,
}: BrandCampaignCardProps) {
  const s = cardSpacing(size);

  const hoverList = useMemo(() => {
    const list = (logoUrls ?? []).filter(Boolean);
    const unique = Array.from(new Set(list));
    return logoUrl ? unique.filter((u) => u !== logoUrl) : unique;
  }, [logoUrls, logoUrl]);

  const baseSrc = logoUrl ?? hoverList[0] ?? "";
  const slides = useMemo(
    () => Array.from(new Set([baseSrc, ...hoverList].filter(Boolean))),
    [baseSrc, hoverList]
  );

  const [isHover, setIsHover] = useState(false);
  const [idx, setIdx] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const activeSrc =
    isHover && slides.length > 1 ? slides[idx % slides.length] : baseSrc;

  const clearTimer = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const onEnter = () => {
    if (slides.length <= 1) return;
    setIsHover(true);
    setIdx(1);
    clearTimer();
    intervalRef.current = window.setInterval(() => {
      setIdx((p) => (p + 1) % slides.length);
    }, 850);
  };

  const onLeave = () => {
    clearTimer();
    setIsHover(false);
    setIdx(0);
  };

  useEffect(() => () => clearTimer(), []);

  const byAdminBadge = edgeBadges?.find(
    (badge) => badge.label.trim().toLowerCase() === "by admin"
  );

  const fullyManagedBadge = edgeBadges?.find(
    (badge) => badge.label.trim().toLowerCase() === "fully managed"
  );

  const otherBadges = (edgeBadges ?? []).filter((badge) => {
    const key = badge.label.trim().toLowerCase();
    return key !== "by admin" && key !== "fully managed";
  });

  return (
    <div
      data-emc-brand-card
      className={cx(
        "relative flex w-full max-w-[403px] min-w-0 flex-col overflow-visible rounded-[1rem] border border-bd-primary bg-card text-card-foreground",
        "min-h-[19.375rem]",
        className
      )}
    >
      {fullyManagedBadge ? (
        <div className="pointer-events-none absolute right-[10px] top-[-12px] z-30">
          <span
            title={fullyManagedBadge.label}
            className={cx(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.73rem] font-medium leading-none ",
              "border-[#8F6B00] bg-[#B8860B] text-white"
            )}
          >
            <span className="h-2 w-2 rounded-full bg-[#F7B500]" />
            {fullyManagedBadge.label}
          </span>
        </div>
      ) : null}

      {otherBadges.length > 0 ? (
        <div className="pointer-events-none absolute right-[-10px] top-4 z-20 flex flex-col items-end gap-2">
          {otherBadges.map((badge) => (
            <span
              key={badge.label}
              title={badge.label}
              className={cx(
                "inline-flex h-7 items-center rounded-full border px-3 text-[0.72rem] font-semibold leading-none shadow-sm",
                badge.className ?? "border-border bg-background text-foreground"
              )}
            >
              {badge.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className={s.topWrap}>
        <div className={cx("flex w-full items-center", "gap-[clamp(10px,2vw,16px)]")}>
          <div
            className="h-12 w-12 shrink-0 overflow-hidden rounded-[0.5rem] bg-neutral-900 outline-none"
            role="img"
            aria-label={logoAriaLabel}
            tabIndex={0}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            onFocus={onEnter}
            onBlur={onLeave}
          >
            {activeSrc ? (
              <img
                className="h-full w-full object-cover object-center transition-opacity duration-300"
                src={activeSrc}
                alt={logoAriaLabel}
                referrerPolicy="no-referrer"
                loading="lazy"
                draggable={false}
              />
            ) : null}
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <div
                className="line-clamp-2 break-words text-[1rem] font-semibold leading-6 text-tx-primary"
                title={name}
              >
                {name}
              </div>
            </div>

            <div
              className={cx(
                "inline-flex items-center gap-1",
                "justify-self-start sm:justify-self-end",
                "w-full sm:w-auto",
                "max-w-full sm:max-w-[11.5rem]"
              )}
            >
              <span
                className={cx(
                  "inline-flex items-center rounded-full p-0.5",
                  statusPillBg(statusVariant)
                )}
              >
                <span
                  className={cx("h-2 w-2 rounded-full", statusDotBg(statusVariant))}
                />
              </span>

              <span
                className={cx(
                  "min-w-0 truncate text-[1rem] font-medium leading-6 text-muted-foreground",
                  "w-full sm:w-auto",
                  "max-w-full sm:max-w-[8.5rem]"
                )}
                title={statusLabel}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {headerRight ? (
              headerRight
            ) : (
              <button
                type="button"
                className="inline-flex h-9 w-5 items-center justify-center rounded-[0.5rem] text-muted-foreground hover:text-tx-secondary"
                aria-label="More options"
              >
                <DotsThree weight="bold" size={18} />
              </button>
            )}
          </div>
        </div>

        {(tags && tags.length > 0) || byAdminBadge ? (
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {(tags ?? []).map((t) => (
                <span
                  key={t}
                  title={t}
                  className="inline-flex h-6 max-w-[12rem] items-center justify-center truncate rounded-full bg-brand-50 px-2 text-[0.75rem] font-normal leading-4 text-neutral-750"
                >
                  {t}
                </span>
              ))}
            </div>

            {byAdminBadge ? (
              <span
                title={byAdminBadge.label}
                className={cx(
                  "shrink-0 inline-flex h-7 items-center rounded-full border px-3 text-[0.72rem] font-semibold leading-none shadow-sm",
                  "border-[#D7E3FF] bg-[#EEF4FF] text-[#2F5BFF]",
                  byAdminBadge.className
                )}
              >
                {byAdminBadge.label}
              </span>
            ) : null}
          </div>
        ) : null}

        {stats && stats.length > 0 ? (
          <div className="flex w-full items-center justify-between gap-2">
            {stats.map((st, i) => {
              const iconNode = st.icon ?? getDefaultIcon(st.label);
              return (
                <div
                  key={`${st.label}-${i}`}
                  className="flex flex-1 min-w-0 flex-col items-center gap-2 text-center"
                >
                  <div
                    className="w-full truncate text-[0.875rem] font-normal leading-5 text-muted-foreground sm:text-[1rem] sm:leading-6"
                    title={st.label}
                  >
                    {st.label}
                  </div>

                  <div className="flex min-w-0 items-center justify-center gap-1">
                    {iconNode ? (
                      <span className="inline-flex rounded-full p-1 text-muted-foreground">
                        {iconNode}
                      </span>
                    ) : null}
                    <span className="truncate text-[0.875rem] font-medium leading-5 text-tx-primary sm:text-[1rem] sm:leading-6">
                      {st.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {footer ? (
        <div
          className={cx(
            s.footerWrap,
            "bg-card",
            "before:absolute before:left-4 before:right-4 before:top-6 before:h-px before:bg-border"
          )}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}