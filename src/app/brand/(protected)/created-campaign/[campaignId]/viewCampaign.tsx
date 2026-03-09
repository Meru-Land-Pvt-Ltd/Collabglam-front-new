"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  apiCampaignViewByBrand,
  getApiErrorMessage,
  type EnrichedCampaignDoc,
  apiGetFrozenAmountForCampaign,
  apiCampaignRecommendedInfluencers,
  apiCampaignDelete,
  apiCampaignUpdateStatus,
  apiCampaignInviteInfluencer,
} from "@/app/brand/services/brandApi";
import { InfluencerTable, type InfluencerRow } from "@/components/ui/brand/Influencertable";
import { ArrowUpRight, Import } from "lucide-react";
import {
  PencilSimple,
  Users as UsersIcon,
  MoneyWavy,
  CurrencyDollar,
  PlusCircle,
  CalendarDots,
  CalendarX,
  Wallet,
  Eye,
  FolderSimplePlus,
  AddressBook,
  Link,
  Trash,
  NewspaperIcon,
  TrashIcon,
  DotsThreeIcon,
  CaretRightIcon,
  EnvelopeIcon,
  PaperPlaneTiltIcon,
  LinkIcon,
  IdentificationCardIcon,
  BookmarkSimple,
  WarningCircle,
  DotsThree,
  Newspaper,
  CaretDown,
  CaretLeft,
  CaretRight,
  DownloadSimple,
  FilePdf,
} from "@phosphor-icons/react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/buttonComp";
import {
  Combobox,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxTrigger,
} from "@/components/ui/combobox"
import { toast } from "@/components/ui/toast";
import Image from "next/image";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""
interface InfluencerContextMenuProps {
  onViewProfile?: () => void;
  onMoveToFolder?: () => void;
  onViewRateCard?: () => void;
  onCopyProfileLink?: () => void;
  onSaveToHub?: () => void;          // optional
  onMoveToWorkspace?: () => void;    // optional
  onNotRelevant?: () => void;        // ✅ new
  onDelete?: () => void;
  onClose?: () => void;
}

function asArray<T = any>(v: any): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function normalizeMongoId(id: any): string {
  if (id == null) return "";
  if (typeof id === "string" || typeof id === "number") return String(id);

  if (typeof id === "object") {
    if (typeof (id as any).toHexString === "function") return (id as any).toHexString();
    if (typeof (id as any).$oid === "string") return (id as any).$oid;
    if (typeof (id as any).oid === "string") return (id as any).oid;
    if (typeof (id as any).id === "string" || typeof (id as any).id === "number")
      return String((id as any).id);
    if ((id as any)._id != null) return normalizeMongoId((id as any)._id);
    if (typeof (id as any).toString === "function") {
      const s = (id as any).toString();
      if (s && s !== "[object Object]") return s;
    }
  }
  return "";
}

function normalizePlatform(p: any): "instagram" | "youtube" | "tiktok" | null {
  const s = String(p ?? "").toLowerCase().trim();
  if (s.includes("insta")) return "instagram";
  if (s.includes("you")) return "youtube";
  if (s.includes("tiktok") || s.includes("tik")) return "tiktok";
  return null;
}

function toHandle(v: any) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s.startsWith("@") ? s : `@${s}`;
}

function safeAvatar(x: any) {
  const u = String(
    x?.profilePic ??
    x?.avatarUrl ??
    x?.profile?.avatarUrl ??
    x?.photo ??
    x?.image ??
    x?.profileImage ??
    ""
  ).trim();
  return u || "https://picsum.photos/seed/fallback/200/200";
}

function mapRecommendedToRow(x: any): InfluencerRow {
  const id = normalizeMongoId(x?._id ?? x?.id ?? x?.influencerId);

  const name = String(x?.name ?? x?.profile?.name ?? x?.fullName ?? "Unknown").trim();

  const handle = toHandle(
    x?.handle ?? x?.username ?? x?.instagramHandle ?? x?.profile?.handle ?? x?.socialHandle
  );

  const category = String(x?.categories?.[0]?.name ?? x?.category?.name ?? x?.categoryName ?? "—").trim();

  const rawPlatforms = Array.isArray(x?.platforms)
    ? x.platforms
    : Array.isArray(x?.socials)
      ? x.socials
      : Array.isArray(x?.socialProfiles)
        ? x.socialProfiles
        : [];

  const platforms =
    rawPlatforms.length > 0
      ? (rawPlatforms
        .map((p: any) => {
          const platform = normalizePlatform(p?.platform ?? p?.name ?? p?.type);
          if (!platform) return null;
          return {
            platform,
            followers: Number(p?.followers ?? p?.followerCount ?? p?.followersCount ?? 0) || 0,
            engagement: Number(p?.engagement ?? p?.engagementRate ?? p?.er ?? 0) || 0,
          };
        })
        .filter(Boolean) as any)
      : (asArray(x?.page1)
        .flatMap((q: any) => (q?.question === "Selected platforms" ? asArray(q?.answers) : []))
        .map((p: any) => {
          const platform = normalizePlatform(p);
          if (!platform) return null;
          return { platform, followers: 0, engagement: 0 };
        })
        .filter(Boolean) as any);

  const appliedDateRaw = x?.appliedDate ?? x?.matchedAt ?? x?.createdAt ?? x?.updatedAt ?? "";
  const appliedDate = appliedDateRaw ? String(appliedDateRaw).slice(0, 10) : "—";

  return {
    id: id || "",
    profile: {
      name,
      handle: handle || "—",
      avatarUrl: safeAvatar(x),
    },
    category,
    platforms,
    appliedDate,
  };
}

const PAGE_WRAP = "flex w-full flex-col items-start gap-7 px-4 py-6 sm:px-6 lg:px-10 xl:px-14";

function pad2(n: number) {
  const x = Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
  return String(x).padStart(2, "0");
}

function plural(n: number, unit: string) {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

function Metric({
  label,
  value,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  onClick?: () => void;
}) {
  const clickable = typeof onClick === "function";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!clickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault(); // ✅ prevents page scroll on Space
      onClick?.();
    }
  };

  return (
    <div
      onClick={clickable ? onClick : undefined}
      onKeyDown={handleKeyDown}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? label : undefined}
      className={[
        "flex flex-col items-start justify-center", // ✅ matches your earlier metric layout
        clickable
          ? "cursor-pointer rounded-xl p-4 transition hover:bg-black/[0.03] active:bg-black/[0.06] focus:outline-none focus:ring-2 focus:ring-black/20"
          : "",
      ].join(" ")}
    >
      <div className="text-xs text-gray-400" style={{ fontFamily: "Inter" }}>
        {label}
      </div>
      <div className="mt-2 text-base font-semibold text-[#1A1A1A]" style={{ fontFamily: "Inter" }}>
        {value}
      </div>
    </div>
  );
}

function getYoutubeId(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "") || "";
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("shorts");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch { }
  return "";
}

function getVideoThumb(url: string) {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

const statuses = [
  { label: "Active", dot: "bg-[#28A745]", ring: "bg-[#BCE4C5]" },
  { label: "Paused", dot: "bg-[#DC3545]", ring: "bg-[#F5C6CB]" },
  { label: "Draft", dot: "bg-[#9E9E9E]", ring: "bg-[#E0E0E0]" },
  { label: "Completed", dot: "bg-[#F07B3F]", ring: "bg-[#FAD6C0]" },
];

function StatusDot({ dot, ring }: { dot: string; ring: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full p-[0.125rem] ${ring}`}>
      <span className={`h-[0.5rem] w-[0.5rem] rounded-full ${dot}`} />
    </span>
  );
}

interface CampaignStatusDropdownProps {
  brandId: string;
  campaignId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export function CampaignStatusDropdown({
  brandId,
  campaignId,
  currentStatus,
  onStatusChange,
}: CampaignStatusDropdownProps) {
  const [value, setValue] = useState<string>(currentStatus?.toLowerCase() || "draft");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentStatus) setValue(currentStatus.toLowerCase());
  }, [currentStatus]);

  const handleChange = async (newValue: string | null) => {
    if (!newValue || newValue === value || loading) return;

    const previous = value;
    setValue(newValue);
    setLoading(true);

    try {
      const resp: any = await apiCampaignUpdateStatus({
        brandId,
        campaignId,
        status: newValue as any,
      });

      const msg =
        resp?.message ??
        resp?.data?.message ??
        resp?.data?.data?.message ??
        "Status updated";

      toast({ icon: "success", title: msg });
      onStatusChange?.(newValue);
    } catch (err: unknown) {
      setValue(previous);
      toast({
        icon: "error",
        title: getApiErrorMessage(err, "Status update failed"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Combobox value={value} onValueChange={handleChange}>
      <ComboboxTrigger className="inline-flex items-center gap-1.5 h-8 px-2 bg-transparent text-sm font-medium text-[#1A1A1A]">
        {(() => {
          const current = statuses.find((s) => s.label.toLowerCase() === value);
          if (!current) return null;
          return <StatusDot dot={current.dot} ring={current.ring} />;
        })()}
        <span className="capitalize">{value}</span>
      </ComboboxTrigger>

      <ComboboxContent
        className="
      w-[13.6875rem]
      max-h-[16.25rem]
      rounded-[0.75rem]
      bg-white
      py-[1rem]
      px-[0.75rem]
    "
      >
        <ComboboxList>
          {statuses.map((s) => (
            <ComboboxItem
              key={s.label}
              value={s.label.toLowerCase()}
              className="capitalize rounded-lg px-3 py-2"
              showIndicator={false}
            >
              <div className="flex items-center gap-2 w-full font-inter text-sm leading-5 font-inter font-medium">
                <StatusDot dot={s.dot} ring={s.ring} />
                {s.label}
              </div>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

const menuItems = [
  { label: "Copy Link", icon: LinkIcon, key: "copylink" },
  { label: "View Influencer list", icon: Eye, key: "viewinfluencerlist" },
  { label: "Invite Influencer", icon: IdentificationCardIcon, key: "inviteinfluencer" },
  { label: "Link IEM Folder", icon: NewspaperIcon, key: "linkiemfolder" },
  { label: "Move to workspace", icon: null, key: "moveToWorkspace", hasArrow: true },
];

export function InfluencerContextMenu({
  onViewProfile,
  onMoveToFolder,
  onViewRateCard,
  onCopyProfileLink,
  onMoveToWorkspace,
  onDelete,
}: InfluencerContextMenuProps) {
  const [workspaceSubmenuOpen, setWorkspaceSubmenuOpen] = useState(false);
  const menuRootRef = useRef<HTMLDivElement | null>(null);

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!menuRootRef.current) return;
      if (!menuRootRef.current.contains(e.target as Node)) {
        setWorkspaceSubmenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlers: Record<string, (() => void) | undefined> = {
    viewProfile: onViewProfile,
    moveToFolder: onMoveToFolder,
    viewRateCard: onViewRateCard,
    copyProfileLink: onCopyProfileLink,
  };

  const workspaces = [
    { id: "nike", name: "Nike Workspace", logo: <EnvelopeIcon /> },
    { id: "mailchimp", name: "Mailchimp", logo: <PaperPlaneTiltIcon /> },
    { id: "slack", name: "Slack Workspace", logo: <EnvelopeIcon /> },
    { id: "notion", name: "Notion Workspace", logo: <PaperPlaneTiltIcon /> },
  ];

  return (
    <Combobox>
      <ComboboxTrigger hideIcon>
        <Button
          variant="raised"
          size="sm"
          aria-label="More actions"
          className="
            my-0
            h-[2rem] w-[2.4rem]
            px-[0.5rem]
            rounded-[0.55rem]
            border border-[#1A1A1A]
            bg-white
            shadow-none
          "
        >
          <DotsThreeIcon size={20} weight="bold" />
        </Button>
      </ComboboxTrigger>


      <ComboboxContent
        align="end"
        className="
          w-[13.6875rem]
          rounded-[0.75rem]
          bg-white
          py-[1rem]
          px-[0.75rem]
          shadow-[0_8px_32px_rgba(0,0,0,0.13)]
        "
      >
        <div ref={menuRootRef} className="flex flex-col gap-[0.5rem]">

          {menuItems.map(({ label, icon: Icon, key }) => {
            const isCaretRight = key === "moveToWorkspace" || key === "linkiemfolder" || key === "inviteinfluencer";
            const isWorkspace = key === "moveToWorkspace"
            const handleClick = (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();

              if (isWorkspace) {
                // Open submenu ONLY on click
                setWorkspaceSubmenuOpen((prev) => !prev);
                return;
              }

              setWorkspaceSubmenuOpen(false);
              handlers[key]?.();
            };

            return (
              <div key={key} className="relative">
                <button
                  onClick={handleClick}
                  className="
                    w-full flex items-center gap-[0.5rem]
                    px-[0.5rem] py-[0.5rem]
                    text-[0.875rem] font-medium
                    rounded-[0.5rem]
                    text-[#1A1A1A]
                    hover:bg-[#F5F5F5]
                    transition-colors
                  "
                >
                  {label === "Move to workspace" ? (
                    <Image
                      width={16}
                      height={16}
                      src="/Component 32.svg"
                      alt="workspace icon"
                      draggable={false}
                    />
                  ) : (
                    Icon && (
                      <Icon size={16} className="w-[1rem] h-[1rem] text-[#1A1A1A]" />
                    )
                  )}

                  <span className="flex-1 text-left text-sm font-normal">
                    {label}
                  </span>

                  {isCaretRight && <CaretRightIcon size={16} />}
                </button>

                {/* Submenu */}
                {isWorkspace && workspaceSubmenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="
                      absolute top-0 -left-55 
                      w-[13rem]
                      rounded-[0.75rem]
                      bg-white
                      p-[0.5rem]
                      shadow-[0_8px_32px_rgba(0,0,0,0.13)]
                      z-50
                      flex flex-col gap-[0.25rem]
                    "
                  >
                    <p className="text-[0.7rem] text-[#999] font-medium uppercase tracking-wide ml-2 mb-1">
                      Workspace name
                    </p>

                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onMoveToWorkspace?.();
                          setWorkspaceSubmenuOpen(false);
                        }}
                        className="
                          w-full flex items-center gap-3
                          border
                          p-2
                          rounded-md
                          text-sm font-medium
                          hover:bg-[#F5F5F5]
                          transition-colors
                        "
                      >
                        <span className="w-8 h-8 rounded-md bg-black flex items-center justify-center text-white">
                          {ws.logo}
                        </span>
                        {ws.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="border-t border-[#F0F0F0] my-2" />

          <button
            onClick={onDelete}
            className="
              flex items-center gap-2
              px-2 py-2
              rounded-md
              text-sm font-medium
              text-[#E53935]
              hover:bg-[#F5F5F5]
            "
          >
            <Trash size={16} />
            Delete
          </button>
        </div>
      </ComboboxContent>
    </Combobox>
  );
}

/** ✅ Robust parser so Load More condition doesn't go false incorrectly */
function parseRecommendedResponse(
  res: any,
  requestedPage: number,
  requestedLimit: number
): { items: any[]; hasMore: boolean | null; limitUsed: number } {
  const items =
    (Array.isArray(res?.items) && res.items) ||
    (Array.isArray(res?.data?.items) && res.data.items) ||
    (Array.isArray(res?.docs) && res.docs) ||
    (Array.isArray(res?.data?.docs) && res.data.docs) ||
    (Array.isArray(res?.results) && res.results) ||
    (Array.isArray(res?.data?.results) && res.data.results) ||
    (Array.isArray(res?.data) && res.data) ||
    (Array.isArray(res) && res) ||
    [];

  const pagination = res?.pagination ?? res?.data?.pagination ?? res?.meta ?? res?.data?.meta ?? {};

  const limitUsed = Number(res?.limit ?? res?.data?.limit ?? pagination?.limit ?? requestedLimit) || requestedLimit;

  const totalRaw = res?.total ?? res?.data?.total ?? pagination?.total ?? pagination?.count;
  const total = typeof totalRaw === "number" ? totalRaw : Number(String(totalRaw ?? ""));

  const totalPagesRaw = res?.totalPages ?? res?.data?.totalPages ?? pagination?.totalPages;
  const totalPages = typeof totalPagesRaw === "number" ? totalPagesRaw : Number(String(totalPagesRaw ?? ""));

  const explicitBool =
    [res?.hasMore, res?.data?.hasMore, pagination?.hasMore, res?.hasNextPage, res?.data?.hasNextPage, pagination?.hasNextPage]
      .find((v) => typeof v === "boolean") as boolean | undefined;

  const nextPage =
    res?.nextPage ?? res?.data?.nextPage ?? pagination?.nextPage ?? null;

  let hasMore: boolean | null = null;

  if (typeof explicitBool === "boolean") hasMore = explicitBool;
  else if (nextPage != null) hasMore = true;
  else if (Number.isFinite(total)) hasMore = requestedPage * limitUsed < total;
  else if (Number.isFinite(totalPages)) hasMore = requestedPage < totalPages;
  else {
    // If backend gives exactly limit, it *might* have next page; otherwise assume no more
    hasMore = items.length === limitUsed ? null : false;
  }

  return { items, hasMore, limitUsed };
}
function RecommendedActionItems({
  row,
  onInvite,
  onDelete,
  onViewProfile,
  onCopyProfileLink,
  onSaveToHub,
  onMoveToWorkspace,
  onNotRelevant,
  isInviting, // ✅ ADD
}: {
  row: InfluencerRow;
  onInvite?: (row: InfluencerRow) => void;
  onDelete?: (row: InfluencerRow) => void;
  onViewProfile?: (row: InfluencerRow) => void;
  onCopyProfileLink?: (row: InfluencerRow) => void;
  onSaveToHub?: (row: InfluencerRow) => void;
  onMoveToWorkspace?: (row: InfluencerRow) => void;
  onNotRelevant?: (row: InfluencerRow) => void;
  isInviting?: boolean; // ✅ ADD
}) {
  return (
    <>
      {/* Send Invitation */}
      <Button
        onClick={() => onInvite?.(row)}
        disabled={!!isInviting}
        className="my-0 flex items-center justify-center text-white rounded-[0.75rem]"
        style={{
          width: "7.6875rem",
          height: "2rem",
          background: "var(--Light-Background-Selected, #1A1A1A)",
          boxShadow:
            "0 2px 4px -2px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.04)",
          opacity: isInviting ? 0.6 : 1,
          cursor: isInviting ? "not-allowed" : "pointer",
        }}
      >
        <span
          style={{
            fontFamily: "Inter",
            fontSize: "0.875rem",
            fontWeight: 600,
            lineHeight: "1.25rem",
          }}
        >
          {isInviting ? "Sending..." : "Send Invitation"}
        </span>
      </Button>

      {/* 3 dots dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="More"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center cursor-pointer rounded-[0.5rem] transition-colors hover:bg-[#EDEDED]"
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "var(--Border-Radius-S, 0.5rem)",
              border: "1px solid var(--Light-Border-Subtle, #E6E6E6)",
              background: "var(--Light-Background-Primary, #FFF)",
            }}
          >
            <DotsThree size={18} weight="bold" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="
            w-[13.6875rem]
            rounded-[0.75rem]
            bg-white
            border-0
            p-0
            shadow-[0_24px_40px_-4px_rgba(0,0,0,0.10),0_0_12px_0_rgba(0,0,0,0.08)]
            cursor-pointer
          "
        >
          <div className="flex w-full flex-col items-start gap-4 px-3 py-4">
            <div className="flex w-full flex-col gap-3">
              <DropdownMenuItem
                onClick={() => onViewProfile?.(row)}
                className="
                  flex h-8 w-full items-center gap-2 self-stretch
                  px-0 py-0 pl-2 pr-0
                  rounded-[0.5rem]
                  text-[0.875rem] font-normal leading-5 text-[#1A1A1A]
                  hover:bg-[#EDEDED]
                  focus:bg-[#EDEDED]
                  data-[highlighted]:bg-[#EDEDED]
                "
              >
                <Eye size={16} weight="bold" className="text-[#1A1A1A]" />
                <span>View Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onCopyProfileLink?.(row)}
                className="
                  flex h-8 w-full items-center gap-2 self-stretch
                  px-0 py-0 pl-2 pr-0
                  rounded-[0.5rem]
                  text-[0.875rem] font-normal leading-5 text-[#1A1A1A]
                  hover:bg-[#EDEDED]
                  focus:bg-[#EDEDED]
                  data-[highlighted]:bg-[#EDEDED]
                "
              >
                <Link size={16} weight="bold" className="text-[#1A1A1A]" />
                <span>Copy profile link</span>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  className="
                    flex h-8 w-full items-center gap-2 self-stretch
                    px-0 py-0 pl-2 pr-0
                    rounded-[0.5rem]
                    text-[0.875rem] font-normal leading-5 text-[#1A1A1A]
                    hover:bg-[#EDEDED]
                    focus:bg-[#EDEDED]
                    data-[highlighted]:bg-[#EDEDED]
                    data-[state=open]:bg-[#EDEDED]
                    cursor-pointer
                  "
                >
                  <BookmarkSimple size={16} weight="bold" className="text-[#1A1A1A]" />
                  <span className="flex-1 text-left">Save to HUB</span>
                </DropdownMenuSubTrigger>

                <DropdownMenuSubContent
                  className="
                    w-[13.6875rem]
                    rounded-[0.75rem]
                    bg-white
                    border-0
                    p-0
                    shadow-[0_24px_40px_-4px_rgba(0,0,0,0.10),0_0_12px_0_rgba(0,0,0,0.08)]
                    cursor-pointer
                  "
                >
                  <div className="flex w-full flex-col items-start gap-4 px-3 py-4">
                    <DropdownMenuItem
                      onClick={() => onSaveToHub?.(row)}
                      className="
                        flex h-8 w-full items-center gap-2 self-stretch
                        px-0 py-0 pl-2 pr-0
                        rounded-[0.5rem]
                        text-[0.875rem] font-normal leading-5 text-[#1A1A1A]
                        hover:bg-[#EDEDED]
                        focus:bg-[#EDEDED]
                        data-[highlighted]:bg-[#EDEDED]
                        cursor-pointer
                      "
                    >
                      <span>Save</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuItem
                onClick={(e) => e.preventDefault()}
                className="
                  flex h-8 w-full items-center gap-2 self-stretch
                  px-0 py-0 pl-2 pr-0
                  rounded-[0.5rem]
                  text-[0.875rem] font-normal leading-5 text-[#1A1A1A]
                  hover:bg-[#EDEDED]
                  focus:bg-[#EDEDED]
                  data-[highlighted]:bg-[#EDEDED]
                  cursor-pointer
                "
              >
                <Eye size={16} weight="bold" className="text-[#1A1A1A]" />
                <span className="flex-1 text-left">Compare</span>

                <span
                  className="
                    ml-auto inline-flex h-5 items-center justify-center
                    rounded-[1.25rem] bg-[#FFF9E6] px-2
                    text-[0.75rem] font-semibold leading-5 text-[#FFBF00]
                    cursor-pointer
                  "
                >
                  Soon
                </span>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  className="
                    flex h-8 w-full items-center gap-2 self-stretch
                    px-0 py-0 pl-2 pr-0
                    rounded-[0.5rem]
                    text-[0.875rem] font-normal leading-5 text-[#1A1A1A]
                    hover:bg-[#EDEDED]
                    focus:bg-[#EDEDED]
                    data-[highlighted]:bg-[#EDEDED]
                    data-[state=open]:bg-[#EDEDED]
                    cursor-pointer
                  "
                >
                  <Newspaper size={16} weight="bold" className="text-[#1A1A1A]" />
                  <span className="flex-1 text-left">Move to workspace</span>
                </DropdownMenuSubTrigger>

                <DropdownMenuSubContent
                  className="
                    w-[13.6875rem]
                    rounded-[0.75rem]
                    bg-white
                    border-0
                    p-0
                    shadow-[0_24px_40px_-4px_rgba(0,0,0,0.10),0_0_12px_0_rgba(0,0,0,0.08)]
                    cursor-pointer
                  "
                >
                  <div className="flex w-full flex-col items-start gap-4 px-3 py-4">
                    <DropdownMenuItem
                      onClick={() => onMoveToWorkspace?.(row)}
                      className="
                        flex h-8 w-full items-center gap-2 self-stretch
                        px-0 py-0 pl-2 pr-0
                        rounded-[0.5rem]
                        text-[0.875rem] font-normal leading-5 text-[#1A1A1A]
                        hover:bg-[#EDEDED]
                        focus:bg-[#EDEDED]
                        data-[highlighted]:bg-[#EDEDED]
                        cursor-pointer
                      "
                    >
                      <span>Move</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </div>

            <div className="h-px w-full bg-[#E6E6E6]" />

            <DropdownMenuItem
              onClick={() => onNotRelevant?.(row)}
              className="
                flex h-8 w-full items-center gap-2 self-stretch
                px-0 py-0 pl-2 pr-0
                rounded-[0.5rem]
                text-[0.875rem] font-normal leading-5 text-[#E53935]
                hover:bg-[#EDEDED]
                focus:bg-[#EDEDED]
                data-[highlighted]:bg-[#EDEDED]
                cursor-pointer
              "
            >
              <WarningCircle size={16} weight="bold" className="text-[#E35141]" />
              <span>Not relevant</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete */}
      <button
        type="button"
        aria-label="Delete"
        onClick={() => onDelete?.(row)}
        className="flex items-center justify-center cursor-pointer rounded-[0.5rem] transition-colors hover:bg-[#EDEDED]"
        style={{
          height: "2rem",
          padding: "0 0.5rem",
          borderRadius: "0.75rem",
          background: "transparent",
        }}
      >
        <Trash
          weight="fill"
          style={{
            width: "0.88363rem",
            height: "0.95194rem",
            color: "var(--Light-Icon-Negative, #E35141)",
          }}
        />
      </button>
    </>
  );
}

export default function ViewCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const idFromQuery = searchParams.get("id");

  const campaignId = useMemo(
    () => normalizeMongoId(idFromQuery ?? (params as any)?.campaignId),
    [idFromQuery, params]
  );

  const [budgetTab, setBudgetTab] = useState<"remaining" | "used">("remaining");
  const [frozenAmount, setFrozenAmount] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [doc, setDoc] = useState<EnrichedCampaignDoc | null>(null);

  const [brandId, setBrandId] = useState("");

  // ✅ Recommended influencers
  const [recommendedRows, setRecommendedRows] = useState<InfluencerRow[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [recommendedError, setRecommendedError] = useState("");
  const RECO_LIMIT = 10;

  const [recommendedPage, setRecommendedPage] = useState(1);
  // ✅ boolean | null (null = unknown but we can still show the button)
  const [recommendedHasMore, setRecommendedHasMore] = useState<boolean | null>(null);
  const [recommendedLoadingMore, setRecommendedLoadingMore] = useState(false);

  const [invitingIds, setInvitingIds] = useState<Record<string, boolean>>({});
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [otherInfoOpen, setOtherInfoOpen] = useState(false);
  const [audiencePlatformsOpen, setAudiencePlatformsOpen] = useState(false);
  const [additionalInfoOpen, setAdditionalInfoOpen] = useState(false);

  useEffect(() => {
    const id =
      localStorage.getItem("brandId") ||
      localStorage.getItem("brandID") ||
      localStorage.getItem("brand_id") ||
      "";
    setBrandId(id);

    if (!id) {
      setErr("brandId not found in localStorage. Please login again.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!brandId || !campaignId) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await apiCampaignViewByBrand({ brandId, campaignId });
        if (cancelled) return;
        setDoc(res ?? null);
      } catch (e) {
        if (cancelled) return;
        setErr(getApiErrorMessage(e, "Failed to load campaign"));
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [brandId, campaignId]);

  useEffect(() => {
    if (!brandId || !campaignId) return;

    let cancelled = false;

    const run = async () => {
      try {
        const res: any = await apiGetFrozenAmountForCampaign({ brandId, campaignId });
        const amtRaw =
          res?.frozenAmount ?? res?.data?.frozenAmount ?? res?.data?.doc?.frozenAmount ?? 0;

        const amt = Number(amtRaw);
        if (!cancelled) setFrozenAmount(Number.isFinite(amt) ? amt : 0);
      } catch {
        if (!cancelled) setFrozenAmount(0);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [brandId, campaignId]);

  // ✅ Initial recommended fetch
  useEffect(() => {
    if (!brandId || !campaignId) return;

    let cancelled = false;

    const run = async () => {
      setRecommendedLoading(true);
      setRecommendedError("");

      try {
        const page = 1;

        const res: any = await apiCampaignRecommendedInfluencers({
          brandId,
          campaignId,
          page,
          limit: RECO_LIMIT,
        });

        const { items, hasMore } = parseRecommendedResponse(res, page, RECO_LIMIT);

        const rows = asArray(items).map(mapRecommendedToRow);

        if (!cancelled) {
          setRecommendedRows(rows);
          setRecommendedPage(page);

          // If unknown but got less than limit => likely no more
          const finalHasMore = hasMore === null ? (rows.length < RECO_LIMIT ? false : null) : hasMore;
          setRecommendedHasMore(finalHasMore);
        }
      } catch (e) {
        if (!cancelled) {
          setRecommendedError(getApiErrorMessage(e, "Failed to load recommended influencers"));
          setRecommendedHasMore(null);
        }
      } finally {
        if (!cancelled) setRecommendedLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [brandId, campaignId]);

  const handleDelete = async () => {
    if (!brandId || !campaignId) return;

    try {
      await apiCampaignDelete({ brandId, campaignId });
      router.back();
    } catch (e) {
      console.error("Delete failed:", getApiErrorMessage(e, "Failed to delete campaign"));
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleLoadMoreRecommended = async () => {
    if (!brandId || !campaignId) return;
    if (recommendedLoadingMore) return;
    // ✅ only block when we're sure there's no more
    if (recommendedHasMore === false) return;

    const nextPage = recommendedPage + 1;
    setRecommendedLoadingMore(true);

    try {
      const res: any = await apiCampaignRecommendedInfluencers({
        brandId,
        campaignId,
        page: nextPage,
        limit: RECO_LIMIT,
      });

      const { items, hasMore } = parseRecommendedResponse(res, nextPage, RECO_LIMIT);
      const newRows = asArray(items).map(mapRecommendedToRow);

      if (newRows.length === 0) {
        // nothing returned => no more
        setRecommendedHasMore(false);
        return;
      }

      setRecommendedRows((prev) => {
        const map = new Map<string, InfluencerRow>();
        [...prev, ...newRows].forEach((x) => map.set(x.id, x));
        return Array.from(map.values());
      });

      setRecommendedPage(nextPage);

      const finalHasMore = hasMore === null ? (newRows.length < RECO_LIMIT ? false : null) : hasMore;
      setRecommendedHasMore(finalHasMore);
    } catch (e) {
      setRecommendedError(getApiErrorMessage(e, "Failed to load more influencers"));
    } finally {
      setRecommendedLoadingMore(false);
    }
  };

  const handleInviteInfluencer = async (r: InfluencerRow) => {
    if (!brandId || !campaignId) {
      toast({ icon: "error", title: "Missing brandId/campaignId" });
      return;
    }

    const influencerId = r?.id;
    if (!influencerId) {
      toast({ icon: "error", title: "Invalid influencerId" });
      return;
    }

    if (invitingIds[influencerId]) return;

    setInvitingIds((prev) => ({ ...prev, [influencerId]: true }));

    try {
      const res: any = await apiCampaignInviteInfluencer({
        brandId,
        campaignId,
        influencerId,
        // modashId: optional (if you have it later)
      });

      const msg =
        res?.message ??
        res?.data?.message ??
        res?.data?.data?.message ??
        "Invitation sent";

      toast({ icon: "success", title: msg });
    } catch (e) {
      toast({ icon: "error", title: getApiErrorMessage(e, "Failed to send invitation") });
    } finally {
      setInvitingIds((prev) => {
        const next = { ...prev };
        delete next[influencerId];
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className={PAGE_WRAP}>
        <div className="w-full rounded-2xl border bg-white p-6 shadow-sm">
          <div className="h-6 w-64 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-4 w-96 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className={PAGE_WRAP}>
        <div className="w-full rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">Couldn’t load campaign</div>
          <p className="mt-2 text-sm text-red-600">{err}</p>

          <div className="mt-4 flex gap-2">
            <Button
              variant="raised"
              size="sm"
              className="my-0 rounded-xl border border-[#E6E6E6] bg-white px-4 py-2 text-sm shadow-none"
              onClick={() => router.refresh()}
            >
              Retry
            </Button>

            <Button
              variant="raised"
              size="sm"
              className="my-0 rounded-xl border border-[#E6E6E6] bg-white px-4 py-2 text-sm shadow-none"
              onClick={() => router.back()}
            >
              Go back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className={PAGE_WRAP}>
        <div className="w-full rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">No campaign found</div>
        </div>
      </div>
    );
  }

  const details = (doc as any)?.details ?? {};
  const countries = asArray(details?.targetCountries);
  const ages = asArray(details?.targetAgeRanges);
  const platforms = asArray<string>((doc as any)?.platformSelection);

  const descriptionText = String(
    (doc as any)?.description ??
    (doc as any)?.campaignDescription ??
    details?.description ??
    details?.campaignDescription ??
    ""
  ).trim();

  const additionalNotesText = String(
    (doc as any)?.additionalNotes ??
    (doc as any)?.notes ??
    (doc as any)?.additionalInformation ??
    details?.additionalNotes ??
    details?.notes ??
    details?.additionalInformation ??
    ""
  ).trim();

  const hashtags = (() => {
    const detailObjs = asArray((details as any)?.preferredHashtags ?? []);

    const byId = new Map<string, string>();
    detailObjs.forEach((h: any) => {
      const key = normalizeMongoId(h?.id ?? h?._id);
      const tag = typeof h?.tag === "string" ? h.tag.trim() : "";
      if (key && tag) byId.set(key, tag);
    });

    const raw =
      (doc as any)?.preferredHashtags ??
      (details as any)?.preferredHashtags ??
      (doc as any)?.hashtags ??
      (details as any)?.hashtags ??
      [];

    return asArray(raw)
      .map((h: any) => {
        if (typeof h === "string") {
          const s = h.trim();
          if (byId.has(s)) return byId.get(s)!;
          if (/^[a-f0-9]{24}$/i.test(s)) return "";
          return s;
        }

        if (h && typeof h.tag === "string") return h.tag.trim();
        return "";
      })
      .filter(Boolean);
  })();

  const productImages = asArray<any>((doc as any)?.productImages);

  const videoReferenceUrl = String(
    (doc as any)?.videoReference ??
    (doc as any)?.videoReferenceUrl ??
    (doc as any)?.referenceVideoUrl ??
    (doc as any)?.videoUrl ??
    details?.videoReference ??
    details?.videoReferenceUrl ??
    details?.referenceVideoUrl ??
    details?.videoUrl ??
    ""
  ).trim();

  const videoThumbUrl = videoReferenceUrl ? getVideoThumb(videoReferenceUrl) : "";
  const pdfRaw =
    (doc as any)?.pdf ??
    (doc as any)?.pdfAttachment ??
    (doc as any)?.attachment ??
    (doc as any)?.attachments ??
    details?.pdf ??
    details?.pdfAttachment ??
    details?.attachment ??
    details?.attachments ??
    null;

  const pdfItem = Array.isArray(pdfRaw) ? pdfRaw[0] : pdfRaw;

  const pdfUrl =
    typeof pdfItem === "string"
      ? pdfItem
      : (pdfItem?.url || pdfItem?.src || pdfItem?.path || "");

  const pdfName =
    typeof pdfItem === "object" && pdfItem?.name
      ? String(pdfItem.name)
      : (pdfUrl ? "Attachment.pdf" : "");

  const pdfSizeBytes =
    typeof pdfItem === "object" && pdfItem?.size != null
      ? Number(pdfItem.size)
      : NaN;

  const pdfSizeText =
    Number.isFinite(pdfSizeBytes) && pdfSizeBytes > 0
      ? `${(pdfSizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : "";

  const targetCountryText = countries.length
    ? countries
      .map((c: any) =>
        `${String(c?.flag ?? "")} ${String(c?.countryName ?? c?.countryCode ?? "").trim()}`.trim()
      )
      .filter(Boolean)
      .join(", ")
    : "—";

  const productUrlRaw =
    details?.productUrl ??
    details?.productLink ??
    (doc as any)?.productUrl ??
    (doc as any)?.productLink ??
    "";

  const productUrl = typeof productUrlRaw === "string" ? productUrlRaw : "";

  const logoUrlRaw =
    (doc as any)?.brandLogoUrl ?? (doc as any)?.brandLogo ?? details?.brandLogoUrl ?? details?.brandLogo ?? "";

  const logoUrl = typeof logoUrlRaw === "string" ? logoUrlRaw : "";

  const totalInfluencers = Number((doc as any)?.numberOfInfluencers ?? details?.numberOfInfluencers ?? 0) || 0;

  const selectedList =
    (doc as any)?.selectedInfluencers ??
    (doc as any)?.selectedInfluencerIds ??
    (doc as any)?.selectedCreators ??
    (doc as any)?.selectedInfluencer ??
    details?.selectedInfluencers ??
    details?.selectedInfluencerIds ??
    [];

  const selectedCount = asArray(selectedList).length;

  const startAt = (doc as any)?.startAt ?? details?.startAt ?? null;
  const endAt = (doc as any)?.endAt ?? details?.endAt ?? null;

  let timelineText = "—";
  try {
    if (startAt && endAt) {
      const a = new Date(startAt).getTime();
      const b = new Date(endAt).getTime();
      if (Number.isFinite(a) && Number.isFinite(b) && b > a) {
        const days = Math.ceil((b - a) / 86400000);
        const months = Math.max(1, Math.round(days / 30));
        timelineText = plural(months, "month");
      }
    } else if ((doc as any)?.timeline) {
      timelineText = String((doc as any)?.timeline);
    }
  } catch { }

  const currency =
    String((doc as any)?.currency ?? details?.currency ?? (doc as any)?.budgetCurrency ?? "USD") || "USD";

  const budgetRaw = (doc as any)?.campaignBudget ?? details?.campaignBudget ?? (doc as any)?.totalBudget ?? null;

  const budgetNum =
    typeof budgetRaw === "number" ? budgetRaw : Number(String(budgetRaw ?? "").replace(/[^0-9.]/g, ""));

  const budgetText =
    Number.isFinite(budgetNum) && budgetNum > 0 ? `${currency} $${budgetNum.toLocaleString("en-US")}` : "—";

  const statusText = String((doc as any)?.status ?? "—");

  const startDateText = startAt ? new Date(startAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";
  const endDateText = endAt ? new Date(endAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";

  const paymentTypeText = String((doc as any)?.paymentType ?? details?.paymentType ?? "—");

  const lorem10 = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do.";

  const backendImageUrls = (productImages ?? [])
    .map((img: any) => img?.url || img?.src || img?.path || "")
    .filter(Boolean);

  const carouselImages = backendImageUrls.length ? backendImageUrls : [];

  const scrollToSlide = (idx: number) => {
    const el = carouselRef.current;
    if (!el || !carouselImages.length) return;

    const clamped = Math.max(0, Math.min(idx, carouselImages.length - 1));
    const child = el.children.item(clamped) as HTMLElement | null;
    if (child) {
      child.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }

    setActiveSlide(clamped);
  };

  const onPrevSlide = () => scrollToSlide(activeSlide - 1);
  const onNextSlide = () => scrollToSlide(activeSlide + 1);

  const onCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;

    const kids = Array.from(el.children) as HTMLElement[];
    if (!kids.length) return;

    const left = el.scrollLeft;
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;

    kids.forEach((k, i) => {
      const d = Math.abs(k.offsetLeft - left);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });

    setActiveSlide(bestIdx);
  };

  const onDownloadPdf = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };



  const remainingValue = Number.isFinite(frozenAmount) ? frozenAmount : 0;
  const shownBudgetText = budgetTab === "remaining" ? remainingValue.toLocaleString("en-US") : "0";

  const showLoadMore =
    recommendedRows.length > 0 && recommendedHasMore !== false; // ✅ show unless we're sure it's false

  return (
    <div className={PAGE_WRAP}>
      {/* ===== Top Campaign Header ===== */}
      <div className="w-full mt-[3.5rem]">
        <div className="flex flex-col items-start gap-5 self-stretch pb-5 border-b border-[#E6E6E6]">
          <div
            className="h-[6.25rem] w-[6.25rem] rounded-[4rem] border border-white/30 bg-black"
            style={
              logoUrl
                ? {
                  backgroundImage: `url(${logoUrl})`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "11px 24px",
                  backgroundSize: "78% 52%",
                }
                : undefined
            }
          />

          <div className="flex w-full items-center justify-between px-1 gap-3">
            <div className="min-w-0">
              <div
                className="
                  w-full max-w-[25.0625rem]
                  text-[#1A1A1A] font-bold text-[1.5rem] leading-8 tracking-normal
                  line-clamp-2
                "
                style={{ fontFamily: "Inter" }}
                title={(doc as any)?.campaignTitle ?? "Campaign"}
              >
                {(doc as any)?.campaignTitle ?? "Campaign"}
              </div>

              <div className="mt-1">
                {productUrl ? (
                  <a
                    href={productUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#B8B8B8] text-[0.75rem] leading-4 font-normal"
                    style={{ fontFamily: "Inter" }}
                    title={productUrl}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="truncate max-w-[18rem]">{productUrl}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                ) : (
                  <div
                    className="text-[#B8B8B8] text-[0.75rem] leading-4 font-normal"
                    style={{ fontFamily: "Inter" }}
                  >
                    —
                  </div>
                )}
              </div>
            </div>

            <div className="flex h-8 items-center gap-[0.5rem]">
              <CampaignStatusDropdown campaignId={campaignId} brandId={brandId} currentStatus={statusText} />

              <Button
                variant="raised"
                size="sm"
                className="my-0 h-8 rounded-lg border border-[#1A1A1A] bg-white px-2 shadow-none gap-2"
                rightIcon={<UsersIcon weight="bold" style={{ width: "0.875rem", height: "0.875rem" }} />}
                onClick={() => router.push(`/brand/campaign/${campaignId}/influencers`)}
              >
                <>
                  <span className="text-center text-[#1A1A1A] text-[0.75rem] font-semibold leading-5 whitespace-nowrap hidden sm:inline">
                    Browse influencers
                  </span>
                  <span className="text-center text-[#1A1A1A] text-[0.75rem] font-semibold leading-5 whitespace-nowrap sm:hidden">
                    Influencers
                  </span>
                </>
              </Button>

              <InfluencerContextMenu onDelete={() => setDeleteDialogOpen(true)} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== Overview ===== */}
      <div className="w-full">
        <div className="mt-3 flex flex-col items-start gap-6 self-stretch">
          <div className="flex w-full items-start justify-between self-stretch">
            <div
              className="text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]"
              style={{
                color: "var(--Light-Text-Primary, #1A1A1A)",
                fontFamily: "var(--Font-Family-Inter, Inter)",
              }}
            >
              Overview
            </div>

            <Button
              variant="raised"
              size="sm"
              className="my-0 p-0 h-auto bg-transparent shadow-none hover:bg-transparent active:bg-transparent gap-2"
              rightIcon={
                <PencilSimple weight="bold" className="text-[#1A1A1A]" style={{ width: "0.875rem", height: "0.875rem" }} />
              }
              onClick={() => router.push(`/brand/campaign/${campaignId}/edit`)}
            >
              <span className="text-center text-[#1A1A1A] text-[0.75rem] font-semibold leading-5">Edit</span>
            </Button>
          </div>

          <div className="flex w-full flex-col items-center justify-center gap-5 self-stretch rounded-[0.75rem] border border-[#E6E6E6] p-4">
            <div className="w-full rounded-xl border-[#E6E6E6] p-0">
              <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Total Influencer" value={totalInfluencers || "—"} onClick={() => router.push(`/brand/influ/all?campaignId=${campaignId}`)} />
                <Metric
                  label="Selected Influencer"
                  value={totalInfluencers ? `${pad2(selectedCount)}/${pad2(totalInfluencers)}` : "—"} onClick={() => router.push(`/brand/influ/shortlisted?campaignId=${campaignId}`)} />
                <Metric label="Timeline" value={timelineText} />
                <Metric label="Total Budget" value={budgetText} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-[1.75rem] mt-[1.75rem] h-px w-full bg-[var(--Light-Border-Subtle,#E6E6E6)]" />

      {/* ===== Timeline & Payments ===== */}
      <div className="flex w-full flex-col items-start gap-6 self-stretch" style={{ fontFamily: "Inter" }}>
        <div className="flex w-full items-center justify-between self-stretch">
          <div className="text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]">Timeline &amp; Payments</div>
        </div>

        <div className="flex w-full flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] p-4 h-[12.375rem] gap-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center p-3 rounded-[0.5rem] bg-[#F2F2F2]">
              <MoneyWavy weight="bold" style={{ width: "1.5rem", height: "1.5rem" }} />
            </div>

            <div className="flex h-[3rem] p-2 items-center gap-2 rounded-[0.75rem] bg-[#F9F9F9]">
              <button
                type="button"
                onClick={() => setBudgetTab("remaining")}
                className={`flex h-8 px-3 items-center justify-center gap-1 self-stretch rounded-[0.5rem] ${budgetTab === "remaining" ? "bg-white" : "bg-transparent"
                  }`}
              >
                <span className="text-[#1A1A1A] text-[0.75rem] font-semibold leading-5">Remaining Budget</span>
              </button>

              <button
                type="button"
                onClick={() => setBudgetTab("used")}
                className={`flex h-8 px-3 items-center justify-center gap-1 self-stretch rounded-[0.5rem] ${budgetTab === "used" ? "bg-white" : "bg-transparent"
                  }`}
              >
                <span className="text-[#1A1A1A] text-[0.75rem] font-semibold leading-5">Used Budget</span>
              </button>
            </div>
          </div>

          <div className="mt-auto flex w-full items-end justify-between self-stretch gap-4">
            <div className="flex flex-col items-start gap-2">
              <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
                {budgetTab === "remaining" ? "Remaining budget" : "Used budget"}
              </div>

              <div className="flex items-center gap-[0.1rem]">
                <div className="text-[#343330] text-[1rem] font-medium leading-[1.5rem]">{currency}</div>

                <CurrencyDollar weight="bold" style={{ width: "1rem", height: "1rem", color: "#343330" }} />

                <div className="text-[#1A1A1A] text-[1rem] font-medium leading-[1.5rem]">{shownBudgetText}</div>
              </div>
            </div>

            <Button
              variant="raised"
              size="sm"
              onClick={() => router.push(`/brand/campaign/${campaignId}/edit`)}
              className="my-0 h-8 w-[6.375rem] px-2 gap-[0.25rem] rounded-[0.75rem] border border-[#E6E6E6] bg-white shadow-none"
              leftIcon={<PlusCircle weight="bold" style={{ width: "0.875rem", height: "0.875rem" }} />}
            >
              <span className="text-center text-[#1A1A1A] font-semibold leading-5">Add funds</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row">
        <div className="flex flex-1 flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] p-3 min-h-[12.375rem]">
          <div className="flex h-12 w-12 items-center justify-center gap-[0.625rem] rounded-[0.5rem] bg-[#F2F2F2] p-3">
            <CalendarDots weight="bold" style={{ width: "1.5rem", height: "1.5rem" }} />
          </div>

          <div className="mt-auto flex flex-col items-start gap-2 self-stretch">
            <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">Start date</div>
            <div className="text-[#1A1A1A] text-[1rem] font-medium leading-[1.5rem]">{startDateText}</div>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] p-3 min-h-[12.375rem]">
          <div className="flex h-12 w-12 items-center justify-center gap-[0.625rem] rounded-[0.5rem] bg-[#F2F2F2] p-3">
            <CalendarX weight="bold" style={{ width: "1.5rem", height: "1.5rem" }} />
          </div>

          <div className="mt-auto flex flex-col items-start gap-2 self-stretch">
            <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">End date</div>
            <div className="text-[#1A1A1A] text-[1rem] font-medium leading-[1.5rem]">{endDateText}</div>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] p-3 min-h-[12.375rem]">
          <div className="flex h-12 w-12 items-center justify-center gap-[0.625rem] rounded-[0.5rem] bg-[#F2F2F2] p-3">
            <Wallet weight="bold" style={{ width: "1.5rem", height: "1.5rem" }} />
          </div>

          <div className="mt-auto flex flex-col items-start gap-2 self-stretch">
            <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">Payment type</div>
            <div className="text-[#1A1A1A] text-[1rem] font-medium leading-[1.5rem]">{paymentTypeText}</div>
          </div>
        </div>
      </div>

      <div className="mb-[1.75rem] mt-[1.75rem] h-px w-full bg-[var(--Light-Border-Subtle,#E6E6E6)]" />
      {/* ===== Collapsible Info Cards ===== */}
      <div className="w-full rounded-[1.25rem] bg-[rgba(218,218,218,0.27)] p-5 flex flex-col items-start gap-6">
        <div className="flex w-full justify-between items-start self-stretch">
          <div className="flex flex-col justify-center items-start gap-1 flex-1">
            <div className="text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]">
              Other Information
            </div>

            <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
              {lorem10}
            </div>
          </div>

          <Button
            variant="raised"
            size="sm"
            onClick={() => setOtherInfoOpen((v) => !v)}
            className="my-0 h-auto w-auto p-0 bg-transparent shadow-none border-0 hover:bg-transparent active:bg-transparent"
            leftIcon={
              <CaretDown
                weight="bold"
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  transform: otherInfoOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 150ms ease",
                }}
              />
            }
          />
        </div>

        {otherInfoOpen ? (
          <div className="w-full">
            <div className="mt-5 self-stretch text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]">
              Description
            </div>

            <div className="mt-6 flex h-[14.8125rem] w-full flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3 overflow-auto">
              <div className="text-[#1A1A1A] text-[0.875rem] font-medium leading-[1.25rem] whitespace-pre-wrap">
                {descriptionText || "—"}
              </div>
            </div>

            <div className="mt-6 self-stretch text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]">
              Image / Reference
            </div>

            <div className="mt-6 relative w-full">
              {carouselImages.length ? (
                <>
                  <div
                    ref={carouselRef}
                    onScroll={onCarouselScroll}
                    className="flex w-full items-center gap-5 py-5 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {carouselImages.map((src, idx) => (
                      <div
                        key={`${src}-${idx}`}
                        className="flex-none w-[13.8125rem] h-[11.5rem] rounded-[1.1875rem] bg-cover bg-center"
                        style={{ backgroundImage: `url(${src})` }}
                      />
                    ))}
                  </div>

                  <Button
                    variant="raised"
                    size="sm"
                    onClick={onPrevSlide}
                    disabled={activeSlide <= 0}
                    className="my-0 absolute left-4 top-[5.625rem] h-[2.75rem] w-[2.75rem] px-0 rounded-[2.5rem] bg-[#F2F2F2] border border-transparent shadow-none"
                    leftIcon={<CaretLeft weight="bold" style={{ width: "1.25rem", height: "1.25rem" }} />}
                  />

                  <Button
                    variant="raised"
                    size="sm"
                    onClick={onNextSlide}
                    disabled={activeSlide >= carouselImages.length - 1}
                    className="my-0 absolute right-4 top-[5.625rem] h-[2.75rem] w-[2.75rem] px-0 rounded-[2.5rem] bg-[#F2F2F2] border border-transparent shadow-none"
                    leftIcon={<CaretRight weight="bold" style={{ width: "1.25rem", height: "1.25rem" }} />}
                  />

                  <div className="mt-2 flex w-full items-center justify-center gap-2">
                    {carouselImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => scrollToSlide(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className="h-2 w-2 rounded-[0.5rem]"
                        style={{ backgroundColor: i === activeSlide ? "#000000" : "#E8E8E8" }}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-[11.5rem] w-full items-center justify-center rounded-[0.75rem] border border-[#E6E6E6] bg-white text-[#969696] text-[0.875rem]">
                  —
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 w-full rounded-[1.25rem] bg-[rgba(218,218,218,0.27)] p-5 flex flex-col items-start gap-6">
        <div className="flex w-full justify-between items-start self-stretch">
          <div className="flex flex-col justify-center items-start gap-1 flex-1">
            <div className="text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]">
              Audience &amp; Platforms
            </div>

            <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
              {lorem10}
            </div>
          </div>

          <Button
            variant="raised"
            size="sm"
            onClick={() => setAudiencePlatformsOpen((v) => !v)}
            className="my-0 h-auto w-auto p-0 bg-transparent shadow-none border-0 hover:bg-transparent active:bg-transparent"
            leftIcon={
              <CaretDown
                weight="bold"
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  transform: audiencePlatformsOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 150ms ease",
                }}
              />
            }
          />
        </div>

        {audiencePlatformsOpen ? (
          <div className="w-full mt-6 flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-1/2 flex flex-col gap-3">
              <div className="flex h-[4.5rem] p-3 flex-col justify-between items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white">
                <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
                  Target Platform
                </div>

                <div className="flex items-center gap-2">
                  {platforms.length ? (
                    platforms.map((p, idx) => {
                      const key = `${p}-${idx}`;
                      const lower = String(p).toLowerCase();

                      if (lower === "instagram") {
                        return (
                          <Image
                            key={key}
                            src="/skill-icons_instagram.svg"
                            alt="Instagram"
                            width={20}
                            height={20}
                            className="w-5 h-5"
                          />
                        );
                      }

                      if (lower === "youtube") {
                        return (
                          <Image
                            key={key}
                            src="/logos_youtube-icon.svg"
                            alt="YouTube"
                            width={20}
                            height={20}
                            className="w-5 h-5"
                          />
                        );
                      }

                      if (lower === "tiktok") {
                        return (
                          <Image
                            key={key}
                            src="/ic_baseline-tiktok.svg"
                            alt="TikTok"
                            width={20}
                            height={20}
                            className="w-5 h-5"
                          />
                        );
                      }

                      return (
                        <span
                          key={key}
                          className="flex h-7 items-center justify-center rounded-[1.25rem] bg-[#F9F9F9] px-3"
                        >
                          <span className="text-[#1A1A1A] text-[0.875rem] font-semibold leading-[1.25rem]">
                            {String(p)}
                          </span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[#969696] text-[0.875rem]">—</span>
                  )}
                </div>
              </div>

              <div className="flex p-3 flex-col items-start gap-3 self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white">
                <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
                  Target Country
                </div>

                <div className="mt-2 text-[#1A1A1A] text-[0.875rem] font-semibold leading-[1.25rem]">
                  {targetCountryText}
                </div>
              </div>

              <div className="flex p-3 flex-col items-start gap-3 self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white">
                <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
                  Target age group
                </div>

                <div className="flex flex-wrap gap-2 self-stretch">
                  {ages.length ? (
                    [...ages]
                      .sort((a: any, b: any) => {
                        const getStartAge = (value: string) => {
                          const match = String(value || "").match(/\d+/)
                          return match ? Number(match[0]) : Infinity
                        }

                        return getStartAge(a?.range) - getStartAge(b?.range)
                      })
                      .map((a: any, idx: number) => (
                        <span
                          key={`${String(a?.id ?? a?._id ?? a?.range ?? idx)}-${idx}`}
                          className="flex h-7 items-center justify-center rounded-[1.25rem] bg-[#F9F9F9] px-3"
                        >
                          <span className="text-[#1A1A1A] text-[0.875rem] font-semibold leading-[1.25rem]">
                            {String(a?.range ?? "—")}
                          </span>
                        </span>
                      ))
                  ) : (
                    <span className="text-[#969696] text-[0.875rem]">—</span>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full sm:w-1/2 flex flex-col items-start gap-[1.3125rem] rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3 h-auto">
              <div className="text-[#1A1A1A] text-[0.75rem] font-semibold leading-[1.25rem] self-stretch">
                Video Reference
              </div>

              {videoReferenceUrl ? (
                <div className="flex flex-col gap-2">
                  <a
                    href={videoReferenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem] break-all"
                  >
                    {videoReferenceUrl}
                  </a>

                  <a
                    href={videoReferenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-[12.875rem] h-[10.125rem] rounded-[0.25rem] bg-cover bg-center"
                    style={{
                      backgroundImage: videoThumbUrl ? `url(${videoThumbUrl})` : undefined,
                      backgroundColor: videoThumbUrl ? undefined : "#eee",
                    }}
                  />
                </div>
              ) : (
                <div className="text-[#969696] text-[0.875rem] font-normal leading-[1.25rem]">—</div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 w-full rounded-[1.25rem] bg-[rgba(218,218,218,0.27)] p-5 flex flex-col items-start gap-6">
        <div className="flex w-full justify-between items-start self-stretch">
          <div className="flex flex-col justify-center items-start gap-1 flex-1">
            <div className="text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]">
              Additional Information
            </div>

            <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
              {lorem10}
            </div>
          </div>

          <Button
            variant="raised"
            size="sm"
            onClick={() => setAdditionalInfoOpen((v) => !v)}
            className="my-0 h-auto w-auto p-0 bg-transparent shadow-none border-0 hover:bg-transparent active:bg-transparent"
            leftIcon={
              <CaretDown
                weight="bold"
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  transform: additionalInfoOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 150ms ease",
                }}
              />
            }
          />
        </div>

        {additionalInfoOpen ? (
          <div className="w-full">
            <div className="flex h-[14.8125rem] flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white overflow-hidden">
              <div className="flex w-full items-center self-stretch px-3 py-2 border-b border-[#E6E6E6] rounded-t-[0.6875rem]">
                <div className="text-[#969696] text-[1rem] font-medium leading-[1.5rem]">
                  Additional Notes
                </div>
              </div>

              <div className="flex flex-1 w-full p-3 items-start justify-between self-stretch overflow-auto">
                <div className="text-[#1A1A1A] text-[0.875rem] font-medium leading-[1.25rem] whitespace-pre-wrap">
                  {additionalNotesText || "—"}
                </div>
              </div>
            </div>

            {pdfUrl ? (
              <div className="mt-5 flex w-full items-center justify-between self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white px-3 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FilePdf weight="bold" style={{ width: "2rem", height: "2rem" }} />

                  <div className="flex flex-col min-w-0">
                    <div className="text-[#1A1A1A] text-[1rem] font-medium leading-[1.5rem] truncate">
                      {pdfName}
                    </div>
                    {pdfSizeText ? (
                      <div className="text-[#969696] text-[0.875rem] font-normal leading-[1.25rem]">
                        {pdfSizeText}
                      </div>
                    ) : null}
                  </div>
                </div>

                <Button
                  variant="raised"
                  size="sm"
                  onClick={onDownloadPdf}
                  className="my-0 h-[2.0625rem] w-[7rem] px-2 rounded-[0.75rem] bg-white border border-transparent shadow-[0_2px_4px_-2px_rgba(0,0,0,0.08),0_4px_8px_-2px_rgba(0,0,0,0.04)]"
                  leftIcon={<DownloadSimple weight="bold" style={{ width: "0.875rem", height: "0.875rem" }} />}
                >
                  <span className="text-center text-[#1A1A1A] text-[0.75rem] font-semibold leading-[1.25rem]">
                    Download
                  </span>
                </Button>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3 h-[11.4375rem] gap-[1.3125rem]">
              <div className="text-[#1A1A1A] text-[0.75rem] font-semibold leading-[1.25rem]">
                Hashtags
              </div>

              <div className="flex flex-wrap gap-2 self-stretch">
                {hashtags.length ? (
                  hashtags.map((tag: string, idx: number) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="flex h-7 items-center justify-center rounded-[1.25rem] bg-[#F9F9F9] px-3"
                    >
                      <span className="text-[#1A1A1A] text-[0.75rem] font-medium leading-[1.25rem]">
                        {tag}
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="text-[#969696] text-[0.875rem] leading-[1.25rem]">—</span>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      {/* ===== Recommended Influencer ===== */}
      <div className="mt-7 w-full flex flex-col items-start self-stretch">
        <div className="self-stretch text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]" style={{ fontFamily: "Inter" }}>
          Recommended Influencer
        </div>

        <div className="mt-2 self-stretch text-[#B8B8B8] text-[0.875rem] font-normal leading-[1.25rem]" style={{ fontFamily: "Inter" }}>
          {lorem10}
        </div>

        <div className="mt-6 w-full mb-[3.5rem]">
          {recommendedLoading ? (
            <div className="w-full rounded-2xl border bg-white p-6 shadow-sm">
              <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-4 w-80 animate-pulse rounded bg-gray-200" />
              <div className="mt-6 h-28 animate-pulse rounded-2xl bg-gray-100" />
            </div>
          ) : recommendedError ? (
            <div className="w-full rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-[#1A1A1A]">Couldn’t load recommended influencers</div>
              <div className="mt-2 text-sm text-red-600">{recommendedError}</div>

              <div className="mt-4">
                <Button
                  variant="raised"
                  size="sm"
                  className="my-0 rounded-xl border border-[#E6E6E6] bg-white px-4 py-2 text-sm shadow-none"
                  onClick={() => {
                    setRecommendedRows([]);
                    setRecommendedError("");
                    setRecommendedLoading(true);
                    setRecommendedPage(1);
                    setRecommendedHasMore(null);

                    apiCampaignRecommendedInfluencers({ brandId, campaignId, page: 1, limit: RECO_LIMIT })
                      .then((res: any) => {
                        const { items, hasMore } = parseRecommendedResponse(res, 1, RECO_LIMIT);
                        const rows = asArray(items).map(mapRecommendedToRow);

                        setRecommendedRows(rows);

                        const finalHasMore = hasMore === null ? (rows.length < RECO_LIMIT ? false : null) : hasMore;
                        setRecommendedHasMore(finalHasMore);
                      })
                      .catch((e: any) => setRecommendedError(getApiErrorMessage(e, "Failed to load recommended influencers")))
                      .finally(() => setRecommendedLoading(false));
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : recommendedRows.length ? (
            <>
              <InfluencerTable
                rows={recommendedRows}
                variant="default"
              />
              {showLoadMore && (
                <div className="mt-3 mb-14 w-full self-stretch">
                  <Button
                    variant="raised"
                    size="sm"
                    onClick={handleLoadMoreRecommended}
                    disabled={recommendedLoadingMore}
                    className="
                      my-0
                      w-full self-stretch
                      h-8
                      px-3
                      py-0
                      flex items-center justify-center
                      gap-1
                      rounded-[0.75rem]
                      border border-[#E6E6E6]
                      bg-white
                      shadow-none
                    "
                  >
                    <span className="text-[0.875rem] font-semibold text-[#1A1A1A]" style={{ fontFamily: "Inter" }}>
                      {recommendedLoadingMore ? "Loading..." : "Load more"}
                    </span>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="w-full rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-[#1A1A1A]">No recommended influencers yet</div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Delete dialog ===== */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30">
          <div className="w-[26rem] h-[12rem] rounded-lg bg-white p-6 shadow-xl flex flex-col gap-4">
            <div className="text-[#1A1A1A] text-base font-semibold">Delete this campaign?</div>

            <div className="text-[#B8B8B8] text-sm font-normal leading-5">
              You're about to permanently delete this campaign.
            </div>

            <div className="flex items-center justify-end gap-3 mt-2">
              <Button
                variant="raised"
                onClick={() => setDeleteDialogOpen(false)}
                className="h-9 px-5 bg-white text-sm shadow-none font-medium text-[#1A1A1A] transition-colors"
              >
                <span className="font-bold">Cancel</span>
              </Button>

              <Button
                variant="raised"
                onClick={handleDelete}
                className="h-[1rem] w-[8rem] px-2 rounded-lg bg-red-100 text-sm hover:bg-red-50 font-medium text-white flex items-center gap-2"
              >
                <div className="flex gap-2 items-center">
                  <TrashIcon className="h-4 w-4 text-red-500" weight="bold" />
                  <span className="text-red-500 font-bold">Delete</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
