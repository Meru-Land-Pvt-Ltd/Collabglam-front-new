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
import { get, post } from "@/lib/api";

const cx = (...c: Array<string | undefined | null | false>) =>
  c.filter(Boolean).join(" ");

type CampaignStatus = "open" | "paused";

type Option = {
  label: string;
  value: string;
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
  "w-full rounded-[1.45rem] border border-[#E8E8E8] bg-white p-4 max-[520px]:p-3";

const WRAP_GRID =
  "grid grid-cols-1 gap-4 " +
  "min-[980px]:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_minmax(0,19rem)] " +
  "min-[980px]:items-center min-[980px]:gap-4";

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

function FilterCombobox({
  label,
  value,
  options,
  onChange,
  widthClass = "w-[112px]",
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  widthClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  useClickOutside(ref, () => setOpen(false));

  const selected =
    options.find((option) => option.value === value) ?? options[0] ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(q)
    );
  }, [options, query]);

  return (
    <div className="flex items-center gap-2">
      <span className="whitespace-nowrap text-sm text-[#3B3B3B]">{label}</span>

      <div ref={ref} className={cx("relative", widthClass)}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-9 w-full items-center justify-between rounded-lg border border-[#E4E4E4] bg-white px-3 text-sm text-[#2B2B2B]"
        >
          <span className="truncate">{selected?.label ?? "All"}</span>
          <CaretDown size={16} className="shrink-0 text-[#777]" />
        </button>

        {open ? (
          <div className="absolute left-0 top-[calc(100%+0.45rem)] z-30 w-full min-w-[190px] rounded-xl border border-[#E8E8E8] bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="relative mb-2">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C]"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}`}
                className="h-9 w-full rounded-lg border border-[#ECECEC] bg-[#FAFAFA] pl-9 pr-3 text-sm outline-none"
              />
            </div>

            <div className="max-h-60 overflow-y-auto">
              {filtered.length ? (
                filtered.map((option) => {
                  const active = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cx(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                        active
                          ? "bg-[#F7F7F7] text-[#222]"
                          : "text-[#444] hover:bg-[#F8F8F8]"
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {active ? <Check size={16} /> : null}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-sm text-[#8A8A8A]">
                  No results found.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
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
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cx(
          "inline-flex items-center gap-2 rounded-lg px-1 py-1 text-sm text-[#707070]",
          disabled ? "cursor-wait opacity-60" : ""
        )}
      >
        <span
          className={cx(
            "inline-flex items-center rounded-full p-0.5",
            statusPillBg(value)
          )}
        >
          <span className={cx("h-2 w-2 rounded-full", statusDotBg(value))} />
        </span>

        <span>{statusLabel(value)}</span>
        <CaretDown size={14} className="text-[#9B9B9B]" />
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
          className="min-w-0 truncate text-[0.95rem] font-medium leading-5 text-[#2E2E2E]"
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
    <button
      type="button"
      className={cx(
        "rounded-[0.8rem]",
        "inline-flex items-center justify-center",
        "border border-[#E6E6E6] bg-white text-[#4A4A4A]",
        "hover:bg-[#F8F8F8]",
        "h-10 w-10"
      )}
      aria-label="More options"
    >
      <DotsThree size={18} weight="bold" />
    </button>
  );
}

function IconButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-[0.8rem] border border-[#E6E6E6] bg-white text-[#3F3F3F] hover:bg-[#F8F8F8]"
    >
      {children}
    </Link>
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
    <div className="h-[4.35rem] w-[4.35rem] shrink-0 overflow-hidden rounded-[0.9rem] bg-[#F3F3F3]">
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
}: {
  campaign: Campaign;
  statusUpdating: Record<string, boolean>;
  onChangeStatus: (campaign: Campaign, next: CampaignStatus) => void;
}) {
  const status = (campaign.campaignStatus || "open") as CampaignStatus;
  const isBusy = !!statusUpdating[campaign.id];
  const tag = campaign.category || campaign.campaignType || "";
  const expiryText = getExpiryText(campaign.timeline?.endDate);

  return (
    <div className={cx(WRAP_BASE, WRAP_GRID)}>
      {/* LEFT */}
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          <CampaignThumb
            name={campaign.productOrServiceName}
            logoSrc={campaign.logoSrc}
          />

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start gap-2 max-[560px]:flex-wrap">
              <Link
                href={`/brand/created-campaign/view-campaign?id=${campaign.id}`}
                className="min-w-0 flex-1 line-clamp-2 break-words text-[1.04rem] font-semibold leading-snug text-[#262626] hover:text-[#111]"
                title={campaign.productOrServiceName}
              >
                {campaign.productOrServiceName}
              </Link>

              {tag ? (
                <span className="inline-flex h-7 items-center rounded-full bg-[#F4ECD9] px-3 text-[0.74rem] text-[#7A6A42]">
                  {tag}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* CENTER */}
      <div className="w-full min-[980px]:flex min-[980px]:justify-center">
        <div
          className={cx(
            "w-full max-w-[27rem] rounded-[0.95rem] border border-[#E7E7E7]",
            "grid grid-cols-4 gap-2 px-4 py-3",
            "max-[420px]:grid-cols-2"
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

      {/* RIGHT */}
      <div className="min-w-0 min-[980px]:justify-self-end">
        <div className="flex min-w-0 items-center justify-between gap-4 min-[980px]:justify-end max-[980px]:flex-col max-[980px]:items-end">
          <StatusDropdown
            value={status}
            disabled={isBusy}
            onChange={(next) => onChangeStatus(campaign, next)}
          />

          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Link
                href={`/brand/created-campaign/view-campaign?id=${campaign.id}`}
                className="inline-flex h-10 items-center justify-center rounded-[0.8rem] border border-[#DBDBDB] bg-white px-4 text-sm font-semibold text-[#2B2B2B] hover:bg-[#F8F8F8]"
              >
                View Campaign
              </Link>

              <IconButton
                href={`/brand/edit-campaign?id=${campaign.id}`}
                label="Edit campaign"
              >
                <PencilSimple size={16} weight="bold" />
              </IconButton>

              <MoreDotsButton />
            </div>

            <div
              className="truncate text-right text-[0.78rem] text-[#A0A0A0]"
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
            <div className="h-[4.35rem] w-[4.35rem] rounded-[0.9rem] bg-[#EFEFEF]" />
            <div className="flex-1">
              <div className="mb-2 h-4 w-44 rounded bg-[#EFEFEF]" />
              <div className="h-3 w-20 rounded bg-[#F4F4F4]" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 rounded-[0.95rem] border border-[#E7E7E7] px-4 py-3 max-[420px]:grid-cols-2">
            <div className="h-10 rounded bg-[#F4F4F4]" />
            <div className="h-10 rounded bg-[#F4F4F4]" />
            <div className="h-10 rounded bg-[#F4F4F4]" />
            <div className="h-10 rounded bg-[#F4F4F4]" />
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="h-8 w-20 rounded bg-[#F2F2F2]" />
            <div className="flex gap-2">
              <div className="h-10 w-32 rounded bg-[#F2F2F2]" />
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
    <div className="flex items-center justify-end gap-2 py-5">
      <button
        onClick={onPrev}
        disabled={currentPage === 1}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E6E6E6] bg-white text-[#444] hover:bg-[#F8F8F8] disabled:opacity-50"
      >
        <CaretLeft size={18} weight="bold" />
      </button>

      <span className="text-sm text-[#5A5A5A]">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E6E6E6] bg-white text-[#444] hover:bg-[#F8F8F8] disabled:opacity-50"
      >
        <CaretRight size={18} weight="bold" />
      </button>
    </div>
  );
}

export default function BrandCreatedCampaignsPage() {
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

  const campaignTypeOptions = useMemo<Option[]>(() => {
    const set = new Set(
      campaigns.map((item) => item.campaignType).filter((v): v is string => !!v)
    );

    return [
      { label: "All", value: "all" },
      ...Array.from(set).map((value) => ({ label: value, value })),
    ];
  }, [campaigns]);

  const categoryOptions = useMemo<Option[]>(() => {
    const set = new Set(
      campaigns.map((item) => item.category).filter((v): v is string => !!v)
    );

    return [
      { label: "All", value: "all" },
      ...Array.from(set).map((value) => ({ label: value, value })),
    ];
  }, [campaigns]);

  const creatorStatusOptions: Option[] = [
    { label: "All", value: "all" },
    { label: "Invited", value: "invited" },
    { label: "Working", value: "working" },
    { label: "No Applicants", value: "no-applicants" },
  ];

  const dateOptions: Option[] = [
    { label: "All", value: "all" },
    { label: "Expiring Soon", value: "expiring-soon" },
    { label: "This Month", value: "this-month" },
    { label: "Expired", value: "expired" },
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
    <div className="min-h-screen bg-[#FAFAFA] p-5">
      {/* FILTER BAR */}
      <div className="mb-5 border-b border-[#ECECEC] pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <FilterCombobox
            label="Campaign Type"
            value={campaignTypeFilter}
            options={campaignTypeOptions}
            onChange={setCampaignTypeFilter}
            widthClass="w-[108px]"
          />

          <FilterCombobox
            label="Creator Status"
            value={creatorStatusFilter}
            options={creatorStatusOptions}
            onChange={setCreatorStatusFilter}
            widthClass="w-[122px]"
          />

          <FilterCombobox
            label="Category"
            value={categoryFilter}
            options={categoryOptions}
            onChange={setCategoryFilter}
            widthClass="w-[106px]"
          />

          <FilterCombobox
            label="Date"
            value={dateFilter}
            options={dateOptions}
            onChange={setDateFilter}
            widthClass="w-[90px]"
          />

          <label className="inline-flex items-center gap-2">
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
            className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#F3F3F3] px-3 text-sm text-[#333]"
          >
            <span>Clear</span>
            <X size={14} weight="bold" />
          </button>

          <div className="ml-auto flex h-10 w-full max-w-[290px] overflow-hidden rounded-xl border border-[#E5E5E5] bg-white min-[900px]:w-[290px]">
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
                className="h-full w-full border-0 bg-transparent pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9A9A9A]"
              />
            </div>

            <button
              type="button"
              onClick={applySearch}
              className="border-l border-[#E5E5E5] bg-white px-4 text-sm font-semibold text-[#1F1F1F]"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* LIST VIEW ONLY */}
      {loading ? (
        <SkeletonList />
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
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