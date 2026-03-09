"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  CurrencyDollar,
  FileText,
} from "@phosphor-icons/react";

const cx = (...c: Array<string | undefined | null | false>) =>
  c.filter(Boolean).join(" ");

const WRAP_BASE =
  "w-full rounded-[1.25rem] border border-[#E8E8E8] bg-white p-3 sm:p-4 lg:p-5";

const WRAP_GRID =
  "grid grid-cols-1 gap-4 " +
  "lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_minmax(0,16rem)] " +
  "xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)_minmax(0,17rem)] " +
  "lg:items-center lg:gap-4";

export type TimelineState = "none" | "running" | "expired";

export interface CampaignHistoryItem {
  id: string;
  productOrServiceName: string;
  budget: number;
  applicantCount: number;
  isActive: number;
  campaignStatus: string;
  createdAt?: string;
  statusUpdatedAt?: string;
  timelineState: TimelineState;
}

const HISTORY_INFLUENCER_ROUTE = "/brand/campaign-history/applied-inf";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n || 0));
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function statusPillBg(status: "open" | "paused") {
  return status === "open" ? "bg-[#EAF7EE]" : "bg-[#FFF3D9]";
}

function statusDotBg(status: "open" | "paused") {
  return status === "open" ? "bg-[#2EAD4F]" : "bg-[#D69E2E]";
}

function statusLabel(status: "open" | "paused") {
  return status === "open" ? "Open" : "Paused";
}

function activeStatusStyles(isActive: number) {
  if (isActive === 1) {
    return {
      wrap: "bg-[#EAF7EE]",
      dot: "bg-[#2EAD4F]",
      label: "Active",
    };
  }

  return {
    wrap: "bg-[#F1F3F5]",
    dot: "bg-[#7B7B7B]",
    label: "Completed",
  };
}

function StatusPill({
  label,
  wrapClass,
  dotClass,
}: {
  label: string;
  wrapClass: string;
  dotClass: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium text-[#333]">
      <span className={cx("inline-flex items-center rounded-full p-0.5", wrapClass)}>
        <span className={cx("h-2 w-2 rounded-full", dotClass)} />
      </span>
      <span>{label}</span>
    </span>
  );
}

function CampaignStatusPill({ status }: { status: string }) {
  const safeStatus: "open" | "paused" =
    String(status || "").toLowerCase() === "paused" ? "paused" : "open";

  return (
    <StatusPill
      label={statusLabel(safeStatus)}
      wrapClass={statusPillBg(safeStatus)}
      dotClass={statusDotBg(safeStatus)}
    />
  );
}

function ActiveStatusPill({ isActive }: { isActive: number }) {
  const styles = activeStatusStyles(isActive);

  return (
    <StatusPill
      label={styles.label}
      wrapClass={styles.wrap}
      dotClass={styles.dot}
    />
  );
}

function MetricBox({
  label,
  value,
  icon,
  href,
  disabled,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      <div className="w-full truncate text-[0.82rem] leading-5 text-[#9A9A9A]">
        {label}
      </div>

      <div className="mt-0.5 flex min-w-0 items-center justify-center gap-1.5">
        {icon ? (
          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[#9A9A9A]">
            {icon}
          </span>
        ) : null}

        <span className="min-w-0 truncate text-[0.95rem] font-medium leading-5 text-[#2E2E2E]">
          {value}
        </span>
      </div>
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        className="min-w-0 rounded-[0.8rem] border border-[#E7E7E7] bg-white px-3 py-3 text-center transition hover:bg-[#F8F8F8] hover:border-[#DCDCDC]"
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={cx(
        "min-w-0 rounded-[0.8rem] border border-[#E7E7E7] bg-white px-3 py-3 text-center",
        disabled ? "opacity-60" : ""
      )}
    >
      {content}
    </div>
  );
}

function CampaignThumb({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="h-[4rem] w-[4rem] shrink-0 overflow-hidden rounded-[0.9rem] bg-[#F3F3F3] sm:h-[4.35rem] sm:w-[4.35rem]">
      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#6E6E6E]">
        {initials || <FileText size={24} />}
      </div>
    </div>
  );
}

function CampaignHistoryRow({
  campaign,
  isFullyManaged,
}: {
  campaign: CampaignHistoryItem;
  isFullyManaged: boolean;
}) {
  const influencerCount = Number(campaign.applicantCount || 0);

  const influencerHref = `${HISTORY_INFLUENCER_ROUTE}?id=${campaign.id}&name=${encodeURIComponent(
    campaign.productOrServiceName
  )}`;

  return (
    <div className={cx(WRAP_BASE, WRAP_GRID)}>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          <CampaignThumb name={campaign.productOrServiceName} />

          <div className="min-w-0 flex-1">
            <Link
              href={`/brand/campaign-history/view-campaign?id=${campaign.id}`}
              className="min-w-0 block break-words text-[clamp(0.95rem,0.9rem+0.22vw,1.04rem)] font-semibold leading-snug text-[#262626] hover:text-[#111]"
              title={campaign.productOrServiceName}
            >
              <span className="line-clamp-2">{campaign.productOrServiceName}</span>
            </Link>

            <div className="mt-1 text-[0.78rem] text-[#A0A0A0]">
              Created {formatDateTime(campaign.createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:flex lg:justify-center">
        <div
          className={cx(
            "grid w-full max-w-[28rem] gap-2 rounded-[0.95rem] border border-[#E7E7E7] bg-[#FCFCFC] px-3 py-3 sm:px-4",
            isFullyManaged ? "grid-cols-1" : "grid-cols-2"
          )}
        >
          <MetricBox
            label="Budget"
            value={formatCurrency(campaign.budget)}
            icon={<CurrencyDollar size={15} weight="regular" />}
          />

          {!isFullyManaged ? (
            <MetricBox
              label="Influencer"
              value={String(influencerCount)}
              icon={<Users size={15} weight="regular" />}
              href={influencerCount > 0 ? influencerHref : undefined}
              disabled={influencerCount <= 0}
            />
          ) : null}
        </div>
      </div>

      <div className="min-w-0 lg:justify-self-end">
        <div className="flex min-w-0 flex-col gap-3 lg:items-end">
          <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
            <CampaignStatusPill status={campaign.campaignStatus} />
            <ActiveStatusPill isActive={campaign.isActive} />
          </div>

          <Link
            href={`/brand/campaign-history/view-campaign?id=${campaign.id}`}
            className="inline-flex h-10 items-center justify-center rounded-[0.8rem] border border-[#DBDBDB] bg-white px-4 text-sm font-semibold text-[#2B2B2B] hover:bg-[#F8F8F8]"
          >
            View Campaign
          </Link>
        </div>
      </div>
    </div>
  );
}

function SkeletonList({ isFullyManaged }: { isFullyManaged: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={cx(WRAP_BASE, WRAP_GRID, "animate-pulse")}>
          <div className="flex items-center gap-3">
            <div className="h-[4rem] w-[4rem] rounded-[0.9rem] bg-[#EFEFEF] sm:h-[4.35rem] sm:w-[4.35rem]" />
            <div className="flex-1">
              <div className="mb-2 h-4 w-44 rounded bg-[#EFEFEF]" />
              <div className="h-3 w-32 rounded bg-[#F4F4F4]" />
            </div>
          </div>

          <div
            className={cx(
              "grid gap-2 rounded-[0.95rem] border border-[#E7E7E7] bg-[#FCFCFC] px-3 py-3 sm:px-4",
              isFullyManaged ? "grid-cols-1" : "grid-cols-2"
            )}
          >
            <div className="h-14 rounded-[0.8rem] bg-[#F4F4F4]" />
            {!isFullyManaged ? <div className="h-14 rounded-[0.8rem] bg-[#F4F4F4]" /> : null}
          </div>

          <div className="flex flex-col gap-2 lg:items-end">
            <div className="h-8 w-28 rounded bg-[#F2F2F2]" />
            <div className="h-10 w-32 rounded bg-[#F2F2F2]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CampaignHistoryList({
  campaigns,
  loading,
  error,
  isFullyManaged,
  onRetry,
}: {
  campaigns: CampaignHistoryItem[];
  loading: boolean;
  error: string | null;
  isFullyManaged: boolean;
  onRetry: () => void;
}) {
  if (loading) {
    return <SkeletonList isFullyManaged={isFullyManaged} />;
  }

  if (error) {
    return (
      <div className="rounded-[1rem] border border-red-200 bg-red-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-700">
              Couldn’t load campaign history
            </p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>

          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center justify-center rounded-[0.8rem] border border-[#DBDBDB] bg-white px-4 text-sm font-semibold text-[#2B2B2B] hover:bg-[#F8F8F8]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-[1rem] border border-dashed border-[#D9D9D9] bg-white p-5 text-sm text-[#777]">
        No campaign history found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {campaigns.map((campaign) => (
        <CampaignHistoryRow
          key={campaign.id}
          campaign={campaign}
          isFullyManaged={isFullyManaged}
        />
      ))}
    </div>
  );
}