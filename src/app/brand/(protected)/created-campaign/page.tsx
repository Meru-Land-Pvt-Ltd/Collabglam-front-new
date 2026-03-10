"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CaretDown,
  CaretLeft,
  CaretRight,
  DotsThree,
  PencilSimple,
  Users,
  YoutubeLogo,
  FileMinus,
  PaperPlaneTilt,
  FileText,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/buttonComp";
import { get, post } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Combobox,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxTrigger,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { toast } from "@/components/ui/toast";
import CampaignFilter, {
  DEFAULT_DATE_FILTER,
  type DateFilterValue,
} from "../../../../components/ui/brand/CampaignFilter";

const cx = (...c: Array<string | undefined | null | false>) =>
  c.filter(Boolean).join(" ");

type CampaignStatus = "active" | "paused" | "draft" | "completed";

type Campaign = {
  id: string;
  productOrServiceName: string;
  description: string;
  timeline: {
    startDate: string;
    endDate: string;
  };
  isActive: number;
  budget: number;
  applicantCount: number;

  campaignType?: string;     // normalized lowercase for filtering
  categoryId?: string;       // for filter matching
  categoryName?: string;     // for tag display

  logoSrc?: string;
  aiCreated?: boolean;
  campaignStatus?: CampaignStatus;
  influencerWorking?: boolean;
  hasPendingUpdate?: boolean;
  platformCount?: number | string;
  contractCount?: number | string;
  targetInfluencerCount?: number;
  emailCount?: number | string;
  updatedAt?: string;
  creatorStatus?: string;
};

type CampaignsResponse = {
  data: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages?: number;
    totalPages?: number;
  };
};

const WRAP_BASE =
  "w-full rounded-[1.25rem] border border-[#E8E8E8] bg-white p-3 sm:p-4 lg:p-5";

const WRAP_GRID =
  "grid grid-cols-1 gap-4 lg:items-center lg:gap-6 " +
  "lg:grid-cols-[minmax(0,1fr)_minmax(28rem,32rem)_auto]";

function normalizeMetric(value: string | number | undefined, prefix = "") {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "number") return `${prefix}${value}`;
  return prefix && !String(value).startsWith(prefix)
    ? `${prefix}${value}`
    : value;
}

function formatInfluencerMetric(current: number, target?: number) {
  const currentText = String(current ?? 0).padStart(2, "0");
  if (!target && target !== 0) return currentText;
  return `${currentText}/${String(target).padStart(2, "0")}`;
}

function getExpiryText(dateStr: string) {
  if (!dateStr) return "No end date";

  const end = new Date(dateStr);
  if (Number.isNaN(end.getTime())) return "No end date";

  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 1) return `Expiring in ${diffDays} days`;
  if (diffDays === 1) return "Expiring tomorrow";
  if (diffDays === 0) return "Expiring today";
  if (diffDays === -1) return "Expired yesterday";
  return `Expired ${Math.abs(diffDays)} days ago`;
}

function toValidDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getWeekRange(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  const start = startOfDay(
    new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate() + diff
    )
  );
  const end = endOfDay(
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
  );

  return { start, end };
}

function getLastMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const end = new Date(
    date.getFullYear(),
    date.getMonth(),
    0,
    23,
    59,
    59,
    999
  );

  return { start: startOfDay(start), end };
}

function getLastQuarterRange(date = new Date()) {
  const currentQuarter = Math.floor(date.getMonth() / 3);
  const lastQuarterEndMonth = currentQuarter * 3 - 1;
  const year = lastQuarterEndMonth < 0 ? date.getFullYear() - 1 : date.getFullYear();
  const normalizedEndMonth = lastQuarterEndMonth < 0 ? 11 : lastQuarterEndMonth;
  const startMonth = normalizedEndMonth - 2;

  const start = new Date(year, startMonth, 1);
  const end = new Date(year, normalizedEndMonth + 1, 0, 23, 59, 59, 999);

  return { start: startOfDay(start), end };
}

function isWithinRange(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

function matchesDateFilter(campaign: Campaign, filter: DateFilterValue) {
  const now = new Date();
  const campaignStart = toValidDate(campaign.timeline?.startDate);
  const campaignEnd = toValidDate(campaign.timeline?.endDate);
  const updatedAt = toValidDate(campaign.updatedAt);

  if (filter.quickFilter) {
    switch (filter.quickFilter) {
      case "recently_edited": {
        if (!updatedAt) return false;
        const start = startOfDay(
          new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
        );
        return isWithinRange(updatedAt, start, endOfDay(now));
      }

      case "launching_soon": {
        if (!campaignStart) return false;
        const start = startOfDay(now);
        const end = endOfDay(
          new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
        );
        return isWithinRange(campaignStart, start, end);
      }

      case "today": {
        if (!campaignStart) return false;
        return isWithinRange(campaignStart, startOfDay(now), endOfDay(now));
      }

      case "this_week": {
        if (!campaignStart) return false;
        const { start, end } = getWeekRange(now);
        return isWithinRange(campaignStart, start, end);
      }

      case "this_month": {
        if (!campaignStart) return false;
        return (
          campaignStart.getMonth() === now.getMonth() &&
          campaignStart.getFullYear() === now.getFullYear()
        );
      }

      default:
        return true;
    }
  }

  if (filter.allDatesOption && filter.allDatesOption !== "all") {
    const target = campaignStart ?? campaignEnd;
    if (!target) return false;

    let start = startOfDay(now);
    let end = endOfDay(now);

    switch (filter.allDatesOption) {
      case "last_7":
        start = startOfDay(
          new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
        );
        break;
      case "last_15":
        start = startOfDay(
          new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14)
        );
        break;
      case "last_30":
        start = startOfDay(
          new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
        );
        break;
      case "last_90":
        start = startOfDay(
          new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89)
        );
        break;
      case "last_365":
        start = startOfDay(
          new Date(now.getFullYear(), now.getMonth(), now.getDate() - 364)
        );
        break;
      case "last_month": {
        const range = getLastMonthRange(now);
        start = range.start;
        end = range.end;
        break;
      }
      case "last_quarter": {
        const range = getLastQuarterRange(now);
        start = range.start;
        end = range.end;
        break;
      }
      default:
        break;
    }

    return isWithinRange(target, start, end);
  }

  if (filter.startDate || filter.endDate) {
    const target = campaignStart ?? campaignEnd;
    if (!target) return false;

    const start = filter.startDate
      ? startOfDay(new Date(filter.startDate))
      : null;
    const end = filter.endDate ? endOfDay(new Date(filter.endDate)) : null;

    if (start && target < start) return false;
    if (end && target > end) return false;
  }

  return true;
}

const statuses = [
  { label: "Active", dot: "bg-[#28A745]", ring: "bg-[#BCE4C5]" },
  { label: "Paused", dot: "bg-[#DC3545]", ring: "bg-[#F5C6CB]" },
  { label: "Completed", dot: "bg-[#F07B3F]", ring: "bg-[#FAD6C0]" },
];

function StatusDot({ dot, ring }: { dot: string; ring: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full p-[0.125rem] ${ring}`}
    >
      <span className={`h-[0.5rem] w-[0.5rem] rounded-full ${dot}`} />
    </span>
  );
}

function StatusDropdown({
  value,
  disabled,
  onChange,
}: {
  value: CampaignStatus;
  disabled?: boolean;
  onChange: (value: CampaignStatus) => void;
}) {
  const anchor = useComboboxAnchor();

  const current = statuses.find((s) => s.label.toLowerCase() === value);

  return (
    <div ref={anchor as any} className="inline-flex">
      <Combobox
        value={value}
        onValueChange={(next) => {
          if (!next || disabled || next === value) return;
          onChange(next as CampaignStatus);
        }}
      >
        <ComboboxTrigger
          aria-label="Campaign status"
          disabled={disabled}
          className={cx(
            "inline-flex items-center gap-1.5 h-8 px-2 rounded-lg bg-transparent text-sm font-medium text-[#1A1A1A] hover:bg-[#F8F8F8]",
            disabled ? "cursor-wait opacity-60" : ""
          )}
          icon={<CaretDown className="h-3 w-3" weight="bold" aria-hidden="true" />}
        >
          {current ? <StatusDot dot={current.dot} ring={current.ring} /> : null}
          <span className="capitalize">{value}</span>
        </ComboboxTrigger>

        <ComboboxContent
          anchor={anchor as any}
          align="end"
          className="w-[13.6875rem] max-h-[16.25rem] rounded-[0.75rem] bg-white py-[1rem] px-[0.75rem]"
        >
          <ComboboxList>
            {statuses.map((s) => (
              <ComboboxItem
                key={s.label}
                value={s.label.toLowerCase()}
                className="capitalize rounded-lg px-3 py-2"
                showIndicator={false}
              >
                <div className="flex items-center gap-2 w-full text-sm leading-5 font-medium">
                  <StatusDot dot={s.dot} ring={s.ring} />
                  {s.label}
                </div>
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

function MetricItem({
  label,
  value,
  icon,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  const clickable = !!onClick;

  const content = (
    <>
      <div className="w-full truncate text-[0.86rem] leading-5 text-[#9A9A9A]">
        {label}
      </div>

      <div className="flex min-w-0 items-center justify-center gap-1.5">
        {icon ? (
          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[#9A9A9A]">
            {icon}
          </span>
        ) : null}

        <span
          className={cx(
            "min-w-0 truncate text-[0.95rem] font-medium leading-5",
            clickable
              ? "text-[#2E2E2E] hover:underline cursor-pointer"
              : "text-[#2E2E2E]"
          )}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </span>
      </div>
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex flex-col items-center justify-center gap-0.5 text-center rounded-md px-1 py-1 hover:bg-[#F8F8F8]"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="min-w-0 flex flex-col items-center justify-center gap-0.5 text-center">
      {content}
    </div>
  );
}

function MoreDotsButton() {
  return (
    <Button
      variant="outline"
      type="button"
      aria-label="More options"
      className="h-10 w-10 shrink-0 rounded-[0.8rem] border border-[#E6E6E6] bg-white p-0 text-[#4A4A4A] hover:bg-[#F8F8F8]"
    >
      <DotsThree size={18} weight="bold" />
    </Button>
  );
}

function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      aria-label={label}
      className="h-10 w-10 shrink-0 rounded-[0.8rem] border border-[#E6E6E6] bg-white p-0 text-[#3F3F3F] hover:bg-[#F8F8F8]"
    >
      {children}
    </Button>
  );
}

function CampaignThumb({
  name,
  logoSrc,
}: {
  name: string;
  logoSrc?: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="h-[4rem] w-[4rem] shrink-0 overflow-hidden rounded-[0.9rem] bg-[#F3F3F3] sm:h-[4.35rem] sm:w-[4.35rem]">
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#6E6E6E]">
          {initials || <FileText size={24} />}
        </div>
      )}
    </div>
  );
}

function CampaignCard({
  campaign,
  statusUpdating,
  onChangeStatus,
  onViewCampaign,
  onEditCampaign,
  onViewContracts,
  onViewAppliedInfluencers,
  onViewInbox,
}: {
  campaign: Campaign;
  statusUpdating: Record<string, boolean>;
  onChangeStatus: (campaign: Campaign, next: CampaignStatus) => void;
  onViewCampaign: (campaignId: string) => void;
  onEditCampaign: (campaignId: string) => void;
  onViewContracts: (campaignId: string) => void;
  onViewAppliedInfluencers: (campaignId: string) => void;
  onViewInbox: (campaignId: string) => void;
}) {
  const status = (campaign.campaignStatus || "draft") as CampaignStatus;
  const isBusy = !!statusUpdating[campaign.id];
  const tag = campaign.categoryName || "";
  const expiryText = getExpiryText(campaign.timeline?.endDate);

  return (
    <div className={cx(WRAP_BASE, WRAP_GRID)}>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          <CampaignThumb
            name={campaign.productOrServiceName}
            logoSrc={campaign.logoSrc}
          />

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center justify-start gap-2">
              <Link
                href={`/brand/created-campaign/view-campaign?id=${campaign.id}`}
                className="min-w-0 max-w-full text-[0.98rem] font-semibold leading-snug text-[#262626] hover:text-[#111] xl:text-[1.04rem]"
                title={campaign.productOrServiceName}
              >
                <span className="block max-w-full truncate lg:max-w-[18rem] xl:max-w-none xl:whitespace-normal">
                  {campaign.productOrServiceName}
                </span>
              </Link>

              {tag ? (
                <span
                  className="shrink-0 rounded-full bg-[#F4ECD9] px-3 py-1 text-[0.72rem] text-[#7A6A42]"
                  title={tag}
                >
                  {tag}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:flex lg:justify-center">
        <div className="grid w-full max-w-[32rem] grid-cols-2 gap-2 rounded-[0.95rem] border border-[#E7E7E7] px-3 py-3 sm:grid-cols-4 sm:px-4">
          <MetricItem
            label="Platform"
            value={normalizeMetric(campaign.platformCount, "+")}
            icon={<YoutubeLogo size={15} weight="regular" />}
          />

          <MetricItem
            label="Contract"
            value={normalizeMetric(campaign.contractCount)}
            icon={<FileMinus size={15} weight="regular" />}
            onClick={() => onViewContracts(campaign.id)}
          />

          <MetricItem
            label="Influencer"
            value={formatInfluencerMetric(
              campaign.applicantCount ?? 0,
              campaign.targetInfluencerCount
            )}
            icon={<Users size={15} weight="regular" />}
            onClick={() => onViewAppliedInfluencers(campaign.id)}
          />

          <MetricItem
            label="Email"
            value={normalizeMetric(campaign.emailCount)}
            icon={<PaperPlaneTilt size={15} weight="regular" />}
            onClick={() => onViewInbox(campaign.id)}
          />
        </div>
      </div>

      <div className="min-w-0 lg:justify-self-end">
        <div className="flex min-w-0 flex-col gap-3 lg:items-end">
          <StatusDropdown
            value={status}
            disabled={isBusy}
            onChange={(next) => onChangeStatus(campaign, next)}
          />

          <div className="flex min-w-0 w-full flex-col gap-2 lg:items-end">
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={() => onViewCampaign(campaign.id)}
                className="h-10 flex-1 rounded-[0.8rem] border border-[#DBDBDB] bg-white px-4 text-sm font-semibold text-[#2B2B2B] hover:bg-[#F8F8F8] sm:flex-none"
              >
                View Campaign
              </Button>

              <IconButton
                onClick={() => onEditCampaign(campaign.id)}
                label="Edit campaign"
              >
                <PencilSimple size={16} weight="bold" />
              </IconButton>

              <MoreDotsButton />
            </div>

            <div
              className="truncate text-left text-[0.78rem] text-[#A0A0A0] lg:max-w-[16rem] lg:text-right"
              title={expiryText}
            >
              {campaign.hasPendingUpdate
                ? "Pending update request"
                : expiryText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={cx(WRAP_BASE, WRAP_GRID, "animate-pulse")}>
          <div className="flex items-center gap-3">
            <div className="h-[4rem] w-[4rem] rounded-[0.9rem] bg-[#EFEFEF] sm:h-[4.35rem] sm:w-[4.35rem]" />
            <div className="flex-1">
              <div className="mb-2 h-4 w-40 rounded bg-[#EFEFEF] sm:w-44" />
              <div className="h-3 w-24 rounded bg-[#F4F4F4]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-[0.95rem] border border-[#E7E7E7] px-3 py-3 sm:grid-cols-4 sm:px-4">
            <div className="h-10 rounded bg-[#F4F4F4]" />
            <div className="h-10 rounded bg-[#F4F4F4]" />
            <div className="h-10 rounded bg-[#F4F4F4]" />
            <div className="h-10 rounded bg-[#F4F4F4]" />
          </div>

          <div className="flex flex-col gap-2 lg:items-end">
            <div className="h-8 w-24 rounded bg-[#F2F2F2]" />
            <div className="flex flex-wrap gap-2">
              <div className="h-10 flex-1 rounded bg-[#F2F2F2] sm:w-32 sm:flex-none" />
              <div className="h-10 w-10 rounded bg-[#F2F2F2]" />
              <div className="h-10 w-10 rounded bg-[#F2F2F2]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 py-5 sm:flex-row sm:justify-end">
      <span className="order-2 text-sm text-[#5A5A5A] sm:order-1">
        Page {currentPage} of {totalPages}
      </span>

      <div className="order-1 flex items-center gap-2 sm:order-2">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E6E6E6] bg-white text-[#444] hover:bg-[#F8F8F8] disabled:opacity-50"
        >
          <CaretLeft size={18} weight="bold" />
        </button>

        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E6E6E6] bg-white text-[#444] hover:bg-[#F8F8F8] disabled:opacity-50"
        >
          <CaretRight size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
}

export default function BrandCreatedCampaignsPage() {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [campaignTypeFilter, setCampaignTypeFilter] = useState("all");
  const [creatorStatusFilter, setCreatorStatusFilter] = useState("all");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] =
    useState<DateFilterValue>(DEFAULT_DATE_FILTER);
  const [aiCreatedOnly, setAiCreatedOnly] = useState(false);

  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>(
    {}
  );

  const applyPendingPatch = (campaign: any) => {
    const pending =
      campaign?.pendingUpdate?.status === "pending" &&
      campaign?.pendingUpdate?.patch;

    const patch = pending ? campaign.pendingUpdate.patch : null;

    return {
      ...campaign,
      ...(patch || {}),
      timeline: {
        ...(campaign.timeline || {}),
        ...(patch?.timeline || {}),
      },
      targetAudience: {
        ...(campaign.targetAudience || {}),
        ...(patch?.targetAudience || {}),
      },
    };
  };

  const fetchCampaigns = useCallback(
    async (page: number, term: string) => {
      setLoading(true);
      setError(null);

      try {
        const brandId =
          typeof window !== "undefined"
            ? localStorage.getItem("brandId")
            : null;

        if (!brandId) {
          const msg = "No brandId found in localStorage.";
          toast({ icon: "error", title: msg });
          throw new Error(msg);
        }

        const res = await get<CampaignsResponse>("/campaign/active", {
          brandId,
          search: term.trim() || undefined,
          page,
          limit,
        });

        const raw = Array.isArray(res?.data) ? res.data : [];
        const active = raw.filter((campaign: any) => campaign.isActive === 1);

        const normalized: Campaign[] = active.map((campaign: any) => {
          const merged = applyPendingPatch(campaign);

          const rawStatus = String(
            merged.campaignStatus ?? merged.status ?? "draft"
          )
            .toLowerCase()
            .trim();

          const safeStatus: CampaignStatus =
            rawStatus === "active" || rawStatus === "open"
              ? "active"
              : rawStatus === "paused" || rawStatus === "closed"
                ? "paused"
                : rawStatus === "completed"
                  ? "completed"
                  : "draft";

          const hasPendingUpdate =
            campaign?.pendingUpdate?.status === "pending" &&
            !!campaign?.pendingUpdate?.patch;

          const normalizedCampaignType = String(
            merged.campaignType ?? ""
          ).trim().toLowerCase();

          const resolvedCategoryId = String(
            merged.categoryId ??
            merged.categories?.[0]?.categoryId ??
            merged.category?._id ??
            ""
          ).trim();

          const resolvedCategoryName = String(
            merged.campaignCategory ??
            merged.category?.name ??
            merged.category?.categoryName ??
            merged.categories?.[0]?.categoryName ??
            merged.productCategory?.name ??
            merged.productCategory ??
            merged.industry?.name ??
            merged.industry ??
            ""
          ).trim();

          return {
            id: merged.campaignsId ?? merged.id ?? merged._id,
            productOrServiceName:
              merged.productOrServiceName ??
              merged.campaignTitle ??
              "",
            description: merged.description ?? "",
            timeline: merged.timeline ?? {
              startDate: merged.startAt ?? "",
              endDate: merged.endAt ?? "",
            },
            isActive: merged.isActive ?? 0,
            budget: merged.budget ?? merged.campaignBudget ?? 0,
            applicantCount: merged.applicantCount ?? 0,

            campaignType: normalizedCampaignType,
            categoryId: resolvedCategoryId,
            categoryName: resolvedCategoryName,

            logoSrc:
              merged.logoSrc ??
              merged.logo ??
              merged.thumbnailUrl ??
              merged.image ??
              merged.productImages?.[0]?.dataUrl ??
              merged.images?.[0]?.dataUrl ??
              "",

            aiCreated: Boolean(
              merged.aiCreated ??
              merged.isAiCreated ??
              merged.createdByAi ??
              merged.byAi
            ),

            campaignStatus: safeStatus,
            influencerWorking: Boolean(merged.influencerWorking),
            hasPendingUpdate,

            platformCount:
              merged.platformCount ??
              merged.platformsCount ??
              merged.platformSelection?.length ??
              merged.platforms?.length,

            contractCount:
              merged.contractCount ??
              merged.contractsCount ??
              merged.totalContracts,

            targetInfluencerCount:
              merged.targetInfluencerCount ??
              merged.requiredInfluencers ??
              merged.influencerTarget ??
              merged.numberOfInfluencers,

            emailCount:
              merged.emailCount ??
              merged.emailsCount ??
              merged.totalEmails,

            updatedAt:
              merged.updatedAt ??
              merged.updated_at ??
              merged.modifiedAt ??
              merged.lastEditedAt ??
              "",

            creatorStatus: String(
              merged.creatorStatus ??
              merged.influencerStatus ??
              merged.applicationStatus ??
              ""
            ).toLowerCase(),
          };
        });

        setCampaigns(normalized);
        setTotalPages(
          res?.pagination?.totalPages ?? res?.pagination?.pages ?? 1
        );
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load campaigns.";

        setError(msg);
        toast({ icon: "error", title: msg });
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchCampaigns(currentPage, appliedSearch);
  }, [fetchCampaigns, currentPage, appliedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setAppliedSearch(searchInput.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    campaignTypeFilter,
    creatorStatusFilter,
    categoryIds,
    dateFilter,
    aiCreatedOnly,
  ]);

  const updateStatus = async (campaignId: string, next: CampaignStatus) => {
    const brandId =
      typeof window !== "undefined" ? localStorage.getItem("brandId") : null;

    if (!brandId) {
      throw new Error("No brandId found in localStorage.");
    }

    try {
      const res = await post("/campaign/update-status", {
        brandId,
        campaignId,
        status: next,
      });

      return (res as any)?.data ?? res;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update campaign status.";
      throw new Error(msg);
    }
  };

  const onChangeStatus = async (campaign: Campaign, next: CampaignStatus) => {
    const id = campaign.id;
    const previous = (campaign.campaignStatus || "draft") as CampaignStatus;

    setCampaigns((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, campaignStatus: next } : item
      )
    );

    setStatusUpdating((prev) => ({ ...prev, [id]: true }));
    setError(null);

    try {
      const res: any = await updateStatus(id, next);

      const msg =
        res?.message ??
        res?.data?.message ??
        "Campaign status updated successfully.";

      toast({ icon: "success", title: msg });
    } catch (err: any) {
      setCampaigns((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, campaignStatus: previous } : item
        )
      );

      const msg = err?.message || "Failed to update status.";
      setError(msg);
      toast({ icon: "error", title: msg });
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesCampaignType =
        campaignTypeFilter === "all" ||
        campaign.campaignType === campaignTypeFilter.toLowerCase();

      const matchesCreatorStatus =
        creatorStatusFilter === "all"
          ? true
          : campaign.creatorStatus
            ? campaign.creatorStatus === creatorStatusFilter
            : creatorStatusFilter === "approved"
              ? !!campaign.influencerWorking
              : creatorStatusFilter === "invited" ||
                creatorStatusFilter === "applied"
                ? (campaign.applicantCount ?? 0) > 0
                : true;

      const matchesCategory =
        categoryIds.length === 0 ||
        (campaign.categoryId ? categoryIds.includes(campaign.categoryId) : false);

      const matchesDate = matchesDateFilter(campaign, dateFilter);

      const matchesAi = !aiCreatedOnly || !!campaign.aiCreated;

      return (
        matchesCampaignType &&
        matchesCreatorStatus &&
        matchesCategory &&
        matchesDate &&
        matchesAi
      );
    });
  }, [
    campaigns,
    campaignTypeFilter,
    creatorStatusFilter,
    categoryIds,
    dateFilter,
    aiCreatedOnly,
  ]);

  return (
    <div className="min-h-screen px-3 py-4 sm:px-4 sm:py-5 lg:px-5">
      <div className="mb-6 rounded-[1rem] p-3 sm:p-4">
        <CampaignFilter
          campaignType={campaignTypeFilter}
          setCampaignType={setCampaignTypeFilter}
          creatorStatus={creatorStatusFilter}
          setCreatorStatus={setCreatorStatusFilter}
          categoryIds={categoryIds}
          setCategoryIds={setCategoryIds}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          aiCreated={aiCreatedOnly}
          setAiCreated={setAiCreatedOnly}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
        />
      </div>

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <p className="rounded-[1rem] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </p>
      ) : filteredCampaigns.length === 0 ? (
        <div className="rounded-[1rem] border border-dashed border-[#D9D9D9] bg-white p-5 text-sm text-[#777]">
          No campaigns found.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              statusUpdating={statusUpdating}
              onChangeStatus={onChangeStatus}
              onViewCampaign={(campaignId) =>
                router.push(
                  `/brand/created-campaign/view-campaign?id=${campaignId}`
                )
              }
              onEditCampaign={(campaignId) =>
                router.push(`/brand/edit-campaign?id=${campaignId}`)
              }
              onViewContracts={(campaignId) =>
                router.push(`/brand/created-campaign/applied-inf?id=${campaignId}`)
              }
              onViewAppliedInfluencers={(campaignId) =>
                router.push(`/brand/created-campaign/applied-inf?id=${campaignId}`)
              }
              onViewInbox={(campaignId) =>
                router.push(`/brand/inbox?id=${campaignId}`)
              }
            />
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        onNext={() =>
          setCurrentPage((prev) => Math.min(prev + 1, totalPages))
        }
      />
    </div>
  );
}