"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  CaretDown,
  CaretLeft,
  CaretRight,
  Check,
  X,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

const cx = (...c: Array<string | undefined | null | false>) =>
  c.filter(Boolean).join(" ");

type CampaignStatus = "open" | "paused";

type FilterOption = {
  id: string;
  name: string;
};

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
  campaignType?: string;
  category?: string;
  logoSrc?: string;
  aiCreated?: boolean;
  campaignStatus?: CampaignStatus;
  influencerWorking?: boolean;
  hasPendingUpdate?: boolean;
  platformCount?: number | string;
  contractCount?: number | string;
  targetInfluencerCount?: number;
  emailCount?: number | string;
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
  "grid grid-cols-1 gap-4 " +
  "lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_minmax(0,18rem)] " +
  "xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)_minmax(0,19rem)] " +
  "lg:items-center lg:gap-4";

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void
) {
  useEffect(() => {
    const handle = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };

    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, onClose]);
}

function statusPillBg(status: CampaignStatus) {
  return status === "open" ? "bg-[#EAF7EE]" : "bg-[#FFF3D9]";
}

function statusDotBg(status: CampaignStatus) {
  return status === "open" ? "bg-[#2EAD4F]" : "bg-[#D69E2E]";
}

function statusLabel(status: CampaignStatus) {
  return status === "open" ? "Active" : "Paused";
}

function normalizeMetric(value: string | number | undefined, prefix = "") {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "number") return `${prefix}${value}`;
  return prefix && !String(value).startsWith(prefix) ? `${prefix}${value}` : value;
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

function isExpired(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

function isExpiringSoon(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const diffMs = d.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
}

function isThisMonth(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;

  const now = new Date();
  return (
    d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  );
}

function FilterPopover({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedOption =
    options.find((option) => option.id === value) ?? options[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 max-w-full items-center gap-1.5 rounded-[0.65rem] px-2.5 sm:px-3 transition-colors",
            "text-[13px] sm:text-[14px] font-medium text-[#1A1A1A]",
            "border border-transparent",
            open ? "bg-[#ECEEF2]" : "bg-transparent hover:bg-[#F5F6F8]"
          )}
        >
          <span className="shrink-0">{label}</span>
          <span className="max-w-[6.25rem] truncate text-muted-foreground sm:max-w-[7.5rem]">
            {selectedOption?.name}
          </span>
          <CaretDown size={14} className="shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "w-[min(18rem,calc(100vw-2rem))] rounded-[12px] border border-[#E6E6E6] bg-white p-2",
          "shadow-[0_7px_20px_0_rgba(25,33,61,0.04)]"
        )}
      >
        <Command>
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <CommandInput
              placeholder="Search..."
              className="h-[40px] rounded-[10px] border border-[#E6E6E6] pl-9"
            />
          </div>

          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup className="mt-2 max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.id}
                value={option.name}
                onSelect={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className="rounded-[10px]"
              >
                <span className="flex-1 truncate">{option.name}</span>
                {selectedOption?.id === option.id ? (
                  <Check size={16} className="shrink-0" />
                ) : null}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useClickOutside(ref, () => setOpen(false));

  const options: CampaignStatus[] = ["open", "paused"];

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cx(
          "inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm text-[#707070] sm:w-auto",
          disabled ? "cursor-wait opacity-60" : "hover:bg-[#F8F8F8]"
        )}
      >
        <span className="inline-flex items-center gap-2">
          <span
            className={cx(
              "inline-flex items-center rounded-full p-0.5",
              statusPillBg(value)
            )}
          >
            <span className={cx("h-2 w-2 rounded-full", statusDotBg(value))} />
          </span>

          <span>{statusLabel(value)}</span>
        </span>

        <CaretDown size={14} className="shrink-0 text-[#9B9B9B]" />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.45rem)] z-20 min-w-[140px] rounded-xl border border-[#E8E8E8] bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          {options.map((option) => {
            const active = option === value;

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={cx(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
                  active
                    ? "bg-[#F7F7F7] text-[#222]"
                    : "text-[#333] hover:bg-[#F8F8F8]"
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cx(
                      "inline-block h-2 w-2 rounded-full",
                      option === "open" ? "bg-[#2EAD4F]" : "bg-[#D69E2E]"
                    )}
                  />
                  {statusLabel(option)}
                </span>

                {active ? <Check size={16} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function MetricItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 flex flex-col items-center justify-center gap-0.5 text-center">
      <div className="w-full truncate text-[clamp(0.72rem,0.68rem+0.16vw,0.86rem)] leading-5 text-[#9A9A9A]">
        {label}
      </div>

      <div className="flex min-w-0 items-center justify-center gap-1.5">
        {icon ? (
          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[#9A9A9A]">
            {icon}
          </span>
        ) : null}

        <span
          className="min-w-0 truncate text-[clamp(0.78rem,0.74rem+0.18vw,0.95rem)] font-medium leading-5 text-[#2E2E2E]"
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </span>
      </div>
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
}: {
  campaign: Campaign;
  statusUpdating: Record<string, boolean>;
  onChangeStatus: (campaign: Campaign, next: CampaignStatus) => void;
  onViewCampaign: (campaignId: string) => void;
  onEditCampaign: (campaignId: string) => void;
}) {
  const status = (campaign.campaignStatus || "open") as CampaignStatus;
  const isBusy = !!statusUpdating[campaign.id];
  const tag = campaign.category || campaign.campaignType || "";
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
            <div className="flex min-w-0 flex-wrap items-start gap-2">
              <Link
                href={`/brand/created-campaign/view-campaign?id=${campaign.id}`}
                className="min-w-0 flex-1 break-words text-[clamp(0.95rem,0.9rem+0.22vw,1.04rem)] font-semibold leading-snug text-[#262626] hover:text-[#111]"
                title={campaign.productOrServiceName}
              >
                <span className="line-clamp-2">{campaign.productOrServiceName}</span>
              </Link>

              {tag ? (
                <span className="inline-flex max-w-full items-center truncate rounded-full bg-[#F4ECD9] px-3 py-1 text-[0.72rem] text-[#7A6A42] sm:h-7">
                  {tag}
                </span>
              ) : null}
            </div>

            {campaign.description ? (
              <p className="mt-1 line-clamp-2 text-[0.82rem] leading-5 text-[#8A8A8A] sm:text-[0.86rem]">
                {campaign.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="w-full lg:flex lg:justify-center">
        <div
          className={cx(
            "grid w-full max-w-[32rem] grid-cols-2 gap-2 rounded-[0.95rem] border border-[#E7E7E7] px-3 py-3 sm:grid-cols-4 sm:px-4"
          )}
        >
          <MetricItem
            label="Platform"
            value={normalizeMetric(campaign.platformCount, "+")}
            icon={<YoutubeLogo size={15} weight="regular" />}
          />

          <MetricItem
            label="Contract"
            value={normalizeMetric(campaign.contractCount)}
            icon={<FileMinus size={15} weight="regular" />}
          />

          <MetricItem
            label="Influencer"
            value={formatInfluencerMetric(
              campaign.applicantCount ?? 0,
              campaign.targetInfluencerCount
            )}
            icon={<Users size={15} weight="regular" />}
          />

          <MetricItem
            label="Email"
            value={normalizeMetric(campaign.emailCount)}
            icon={<PaperPlaneTilt size={15} weight="regular" />}
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
              {campaign.hasPendingUpdate ? "Pending update request" : expiryText}
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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
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
          typeof window !== "undefined" ? localStorage.getItem("brandId") : null;

        if (!brandId) throw new Error("No brandId found in localStorage.");

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

          const rawStatus = String(merged.campaignStatus || "open")
            .toLowerCase()
            .trim();

          const safeStatus: CampaignStatus =
            rawStatus === "paused" || rawStatus === "closed" ? "paused" : "open";

          const hasPendingUpdate =
            campaign?.pendingUpdate?.status === "pending" &&
            !!campaign?.pendingUpdate?.patch;

          return {
            id: merged.campaignsId ?? merged.id ?? merged._id,
            productOrServiceName: merged.productOrServiceName ?? "",
            description: merged.description ?? "",
            timeline: merged.timeline ?? { startDate: "", endDate: "" },
            isActive: merged.isActive ?? 0,
            budget: merged.budget ?? 0,
            applicantCount: merged.applicantCount ?? 0,
            campaignType: merged.campaignType ?? "",
            category:
              merged.category ??
              merged.productCategory ??
              merged.industry ??
              "",
            logoSrc:
              merged.logoSrc ??
              merged.logo ??
              merged.thumbnailUrl ??
              merged.image ??
              "",
            aiCreated: Boolean(
              merged.aiCreated ?? merged.isAiCreated ?? merged.createdByAi
            ),
            campaignStatus: safeStatus,
            influencerWorking: Boolean(merged.influencerWorking),
            hasPendingUpdate,
            platformCount:
              merged.platformCount ??
              merged.platformsCount ??
              merged.platforms?.length,
            contractCount:
              merged.contractCount ??
              merged.contractsCount ??
              merged.totalContracts,
            targetInfluencerCount:
              merged.targetInfluencerCount ??
              merged.requiredInfluencers ??
              merged.influencerTarget,
            emailCount:
              merged.emailCount ??
              merged.emailsCount ??
              merged.totalEmails,
          };
        });

        setCampaigns(normalized);
        setTotalPages(res?.pagination?.totalPages ?? res?.pagination?.pages ?? 1);
      } catch (err: any) {
        setError(err.message || "Failed to load campaigns.");
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
    setCurrentPage(1);
  }, [
    campaignTypeFilter,
    creatorStatusFilter,
    categoryFilter,
    dateFilter,
    aiCreatedOnly,
  ]);

  const applySearch = () => {
    setCurrentPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const updateStatus = async (campaignId: string, next: CampaignStatus) => {
    const brandId =
      typeof window !== "undefined" ? localStorage.getItem("brandId") : null;

    if (!brandId) throw new Error("No brandId found in localStorage.");

    try {
      const res = await post("/campaign/status", {
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
    const previous = (campaign.campaignStatus || "open") as CampaignStatus;

    setCampaigns((prev) =>
      prev.map((item) => (item.id === id ? { ...item, campaignStatus: next } : item))
    );

    setStatusUpdating((prev) => ({ ...prev, [id]: true }));
    setError(null);

    try {
      await updateStatus(id, next);
    } catch (err: any) {
      setCampaigns((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, campaignStatus: previous } : item
        )
      );
      setError(err?.message || "Failed to update status.");
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const campaignTypeOptions = useMemo<FilterOption[]>(() => {
    const set = new Set(
      campaigns.map((item) => item.campaignType).filter((v): v is string => !!v)
    );

    return [
      { id: "all", name: "All" },
      ...Array.from(set).map((value) => ({ id: value, name: value })),
    ];
  }, [campaigns]);

  const categoryOptions = useMemo<FilterOption[]>(() => {
    const set = new Set(
      campaigns.map((item) => item.category).filter((v): v is string => !!v)
    );

    return [
      { id: "all", name: "All" },
      ...Array.from(set).map((value) => ({ id: value, name: value })),
    ];
  }, [campaigns]);

  const creatorStatusOptions: FilterOption[] = [
    { id: "all", name: "All" },
    { id: "invited", name: "Invited" },
    { id: "working", name: "Working" },
    { id: "no-applicants", name: "No Applicants" },
  ];

  const dateOptions: FilterOption[] = [
    { id: "all", name: "All" },
    { id: "expiring-soon", name: "Expiring Soon" },
    { id: "this-month", name: "This Month" },
    { id: "expired", name: "Expired" },
  ];

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesCampaignType =
        campaignTypeFilter === "all" ||
        campaign.campaignType === campaignTypeFilter;

      const matchesCreatorStatus =
        creatorStatusFilter === "all"
          ? true
          : creatorStatusFilter === "invited"
            ? (campaign.applicantCount ?? 0) > 0
            : creatorStatusFilter === "working"
              ? !!campaign.influencerWorking
              : (campaign.applicantCount ?? 0) === 0;

      const matchesCategory =
        categoryFilter === "all" || campaign.category === categoryFilter;

      const matchesDate =
        dateFilter === "all"
          ? true
          : dateFilter === "expiring-soon"
            ? isExpiringSoon(campaign.timeline?.endDate)
            : dateFilter === "this-month"
              ? isThisMonth(campaign.timeline?.endDate)
              : isExpired(campaign.timeline?.endDate);

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
    categoryFilter,
    dateFilter,
    aiCreatedOnly,
  ]);

  const clearFilters = () => {
    setCampaignTypeFilter("all");
    setCreatorStatusFilter("all");
    setCategoryFilter("all");
    setDateFilter("all");
    setAiCreatedOnly(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-3 py-4 sm:px-4 sm:py-5 lg:px-5">
      <div className="mb-5 rounded-[1rem] border border-[#ECECEC] bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <FilterPopover
              label="Campaign Type"
              value={campaignTypeFilter}
              options={campaignTypeOptions}
              onChange={setCampaignTypeFilter}
            />

            <FilterPopover
              label="Creator Status"
              value={creatorStatusFilter}
              options={creatorStatusOptions}
              onChange={setCreatorStatusFilter}
            />

            <FilterPopover
              label="Category"
              value={categoryFilter}
              options={categoryOptions}
              onChange={setCategoryFilter}
            />

            <FilterPopover
              label="Date"
              value={dateFilter}
              options={dateOptions}
              onChange={setDateFilter}
            />

            <label className="inline-flex h-9 items-center gap-2 rounded-[0.65rem] px-2.5 hover:bg-[#F5F6F8]">
              <button
                type="button"
                onClick={() => setAiCreatedOnly((prev) => !prev)}
                className={cx(
                  "relative inline-flex h-6 w-10 items-center rounded-full transition-colors",
                  aiCreatedOnly ? "bg-[#1F1F1F]" : "bg-[#E3E3E3]"
                )}
                aria-pressed={aiCreatedOnly}
              >
                <span
                  className={cx(
                    "inline-block h-5 w-5 rounded-full bg-white transition-transform",
                    aiCreatedOnly ? "translate-x-[18px]" : "translate-x-0.5"
                  )}
                />
              </button>

              <span className="text-sm text-[#3B3B3B]">AI Created</span>
            </label>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#F3F3F3] px-3 text-sm text-[#333] hover:bg-[#ECECEC]"
            >
              <span>Clear</span>
              <X size={14} weight="bold" />
            </button>
          </div>

          <div className="flex w-full overflow-hidden rounded-xl border border-[#E5E5E5] bg-white sm:max-w-[22rem] lg:ml-auto lg:max-w-[18rem] xl:max-w-[20rem]">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D8D8D]"
              />
              <input
                type="text"
                placeholder="Search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applySearch();
                }}
                className="h-10 w-full border-0 bg-transparent pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9A9A9A]"
              />
            </div>

            <button
              type="button"
              onClick={applySearch}
              className="border-l border-[#E5E5E5] bg-white px-4 text-sm font-semibold text-[#1F1F1F] hover:bg-[#F8F8F8]"
            >
              Search
            </button>
          </div>
        </div>
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
                router.push(`/brand/created-campaign/view-campaign?id=${campaignId}`)
              }
              onEditCampaign={(campaignId) =>
                router.push(`/brand/edit-campaign?id=${campaignId}`)
              }
            />
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        onNext={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
      />
    </div>
  );
}