"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CaretDown, GearSix, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/buttonComp";
import { get } from "@/lib/api";

type NotificationTab = "all" | "read" | "unread";
type NotificationSection = "Today" | "Older";
type NotificationCategory =
  | "All Notification"
  | "Campaigns"
  | "Deliveries"
  | "Milestones"
  | "Payments & Wallet"
  | "Disputes"
  | "Contracts"
  | "System & Reminders";

type BrandNotificationApiItem = {
  _id: string;
  brandId?: string | null;
  influencerId?: string | null;
  adminId?: string | null;
  type?: string | null;
  title?: string | null;
  message?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actionPath?: string | null;
  isRead?: boolean;
  notificationId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type BrandNotificationsResponse = {
  data?: BrandNotificationApiItem[];
  total?: number;
  unread?: number;
  page?: number;
  limit?: number;
};

type NotificationAction = {
  label: string;
  tone?: "primary" | "secondary";
  size?: "default" | "compact";
  onClick?: () => void;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  section: NotificationSection;
  category: NotificationCategory;
  read: boolean;
  actionPath?: string;
  initials: string;
  actions?: NotificationAction[];
};

type NotificationPanelProps = {
  isOpen?: boolean;
  notifications?: NotificationItem[];
  defaultTab?: NotificationTab;
  defaultCategory?: NotificationCategory;
  onClose?: () => void;
  onSettings?: () => void;
  onMarkAllRead?: () => void;
};

const CATEGORY_OPTIONS: NotificationCategory[] = [
  "All Notification",
  "Campaigns",
  "Deliveries",
  "Milestones",
  "Payments & Wallet",
  "Disputes",
  "Contracts",
  "System & Reminders",
];

function isToday(date: Date) {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function formatNotificationTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (isToday(date)) {
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    if (mins < 60) return `${mins} min`;

    const hrs = Math.floor(mins / 60);
    return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function getSection(value?: string | null): NotificationSection {
  if (!value) return "Older";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Older";

  return isToday(date) ? "Today" : "Older";
}

function getCategory(item: BrandNotificationApiItem): NotificationCategory {
  const type = String(item.type || "").toLowerCase();
  const entityType = String(item.entityType || "").toLowerCase();

  if (
    type.includes("campaign") ||
    entityType.includes("campaign")
  ) {
    return "Campaigns";
  }

  if (
    type.includes("deliver") ||
    entityType.includes("deliver")
  ) {
    return "Deliveries";
  }

  if (
    type.includes("milestone") ||
    entityType.includes("milestone")
  ) {
    return "Milestones";
  }

  if (
    type.includes("payment") ||
    type.includes("wallet") ||
    entityType.includes("payment") ||
    entityType.includes("wallet")
  ) {
    return "Payments & Wallet";
  }

  if (
    type.includes("dispute") ||
    entityType.includes("dispute")
  ) {
    return "Disputes";
  }

  if (
    type.includes("contract") ||
    entityType.includes("contract")
  ) {
    return "Contracts";
  }

  return "System & Reminders";
}

function getInitials(item: BrandNotificationApiItem) {
  const source =
    item.entityType ||
    item.title ||
    item.type ||
    "N";

  const parts = String(source)
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "N";
  return parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

function mapApiNotification(item: BrandNotificationApiItem): NotificationItem {
  return {
    id: item.notificationId || item._id,
    title: item.title || "Notification",
    message: item.message || "",
    time: formatNotificationTime(item.createdAt),
    section: getSection(item.createdAt),
    category: getCategory(item),
    read: Boolean(item.isRead),
    actionPath: item.actionPath || undefined,
    initials: getInitials(item),
  };
}

export default function NotificationPanel({
  isOpen = true,
  notifications,
  defaultTab = "all",
  defaultCategory = "All Notification",
  onClose,
  onSettings,
  onMarkAllRead,
}: NotificationPanelProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<NotificationTab>(defaultTab);
  const [activeCategory, setActiveCategory] =
    useState<NotificationCategory>(defaultCategory);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const [brandId, setBrandId] = useState<string | null>(null);
  const [apiNotifications, setApiNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedBrandId =
      window.localStorage.getItem("brandId") ||
      window.localStorage.getItem("currentBrandId");

    if (storedBrandId) {
      setBrandId(storedBrandId);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || notifications?.length) return;
    if (!brandId) return;

    let cancelled = false;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await get<BrandNotificationsResponse>(
          `/notifications/brand?brandId=${encodeURIComponent(brandId)}`
        );

        if (cancelled) return;

        const mapped = (res?.data || []).map(mapApiNotification);
        setApiNotifications(mapped);
        setUnreadCount(
          typeof res?.unread === "number"
            ? res.unread
            : mapped.filter((item) => !item.read).length
        );
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load notifications:", err);
        setError("Failed to load notifications");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [brandId, isOpen, notifications]);

  const sourceNotifications = useMemo(() => {
    return notifications?.length ? notifications : apiNotifications;
  }, [notifications, apiNotifications]);

  const filteredNotifications = useMemo(() => {
    return sourceNotifications.filter((item) => {
      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "read"
          ? item.read
          : !item.read;

      const matchesCategory =
        activeCategory === "All Notification"
          ? true
          : item.category === activeCategory;

      return matchesTab && matchesCategory;
    });
  }, [sourceNotifications, activeTab, activeCategory]);

  const groupedNotifications = useMemo(() => {
    const today = filteredNotifications.filter((item) => item.section === "Today");
    const older = filteredNotifications.filter((item) => item.section === "Older");

    return [
      { label: "Today" as const, items: today },
      { label: "Older" as const, items: older },
    ].filter((group) => group.items.length > 0);
  }, [filteredNotifications]);

  const handleMarkAllRead = () => {
    setApiNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        read: true,
      }))
    );
    setUnreadCount(0);
    onMarkAllRead?.();
  };

  if (!isOpen) return null;

  return (
    <div className="w-full overflow-hidden rounded-[0.75rem] border border-[#E6E6E6] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
      <div className="flex max-h-[min(80vh,42rem)] flex-col">
        <div className="relative flex w-full items-start justify-between px-5 pt-5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCategoryOpen((prev) => !prev)}
              className="flex h-8 min-w-[7.9375rem] items-center justify-center gap-1 rounded-[0.5rem] bg-white px-3 text-center text-[0.875rem] font-medium leading-5 tracking-[0] text-[#1A1A1A]"
            >
              <span className="truncate">{activeCategory}</span>
              <CaretDown size={16} weight="regular" className="text-[#1A1A1A]" />
            </button>

            {isCategoryOpen && (
              <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 flex w-[13.1875rem] flex-col gap-2 rounded-[0.75rem] border border-[#F1F3F7] bg-white p-[0.625rem_0.5rem] shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
                {CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setActiveCategory(option);
                      setIsCategoryOpen(false);
                    }}
                    className={`flex h-[3.125rem] w-full items-center rounded-[0.5rem] px-4 py-5 text-left text-[0.875rem] font-medium leading-5 tracking-[0] text-[#1A1A1A] ${
                      option === activeCategory
                        ? "bg-[#EDEDED]"
                        : "bg-white hover:bg-[#F7F7F7]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSettings}
              aria-label="Open settings"
              className="flex h-7 w-7 items-center justify-center rounded-[0.5rem] bg-white text-[#1A1A1A]"
            >
              <GearSix size={18} weight="regular" className="text-[#1A1A1A]" />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              className="flex h-7 w-[1.875rem] items-center justify-center rounded-[0.5rem] bg-white text-[#1A1A1A]"
            >
              <X size={18} weight="regular" className="text-[#1A1A1A]" />
            </button>
          </div>
        </div>

        <div className="flex w-full items-center justify-between border-b border-[#E6E6E6] px-5 py-[0.625rem]">
          <div className="flex items-center gap-2">
            {(["all", "read", "unread"] as NotificationTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex h-7 min-w-14 items-center justify-center rounded-[0.5rem] px-2 text-center text-[0.875rem] font-medium leading-5 tracking-[0] text-[#1A1A1A] ${
                  activeTab === tab ? "bg-[#EDEDED]" : "bg-transparent"
                }`}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex h-7 items-center justify-center rounded-[0.75rem] px-2 text-center text-[0.875rem] font-medium leading-5 tracking-[0] text-[#1A1A1A]"
          >
            Mark all as read
          </button>
        </div>

        <div className="px-5 pt-3 text-[0.8125rem] font-medium text-[#7A7A7A]">
          Unread: {unreadCount}
        </div>

        <div className="flex-1 overflow-y-auto py-[0.9375rem]">
          {loading ? (
            <div className="px-5 text-[0.875rem] text-[#666]">Loading notifications...</div>
          ) : error ? (
            <div className="px-5 text-[0.875rem] text-[#F04438]">{error}</div>
          ) : groupedNotifications.length === 0 ? (
            <div className="px-5 text-[0.875rem] text-[#666]">No notifications found</div>
          ) : (
            <div className="flex w-full flex-col gap-[0.9375rem]">
              {groupedNotifications.map((group) => (
                <div key={group.label} className="flex w-full flex-col gap-[0.625rem]">
                  <div className="px-5 text-[0.875rem] font-medium leading-5 tracking-[0] text-[#1A1A1A]">
                    {group.label}
                  </div>

                  <div className="flex w-full flex-col gap-3 px-5">
                    {group.items.map((item) => (
                      <NotificationItemCard
                        key={item.id}
                        item={item}
                        onView={() => {
                          if (!item.actionPath) return;
                          router.push(item.actionPath);
                          onClose?.();
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationItemCard({
  item,
  onView,
}: {
  item: NotificationItem;
  onView: () => void;
}) {
  return (
    <div className="flex w-full items-start gap-3 rounded-[0.75rem] bg-white py-1">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[0.75rem] font-semibold text-[#1A1A1A]">
        {item.initials}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {!item.read ? (
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#1A1A1A]" />
              ) : null}

              <span className="truncate text-[0.875rem] font-bold leading-5 tracking-[0] text-[#1A1A1A]">
                {item.title}
              </span>
            </div>

            {item.message ? (
              <div className="mt-1 text-[0.875rem] font-medium leading-5 tracking-[0] text-[#666]">
                {item.message}
              </div>
            ) : null}
          </div>

          <span className="shrink-0 text-[0.875rem] font-medium leading-5 tracking-[0] text-[#1A1A1A]">
            {item.time}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {item.actionPath ? (
            <NotificationActionButton
              action={{
                label: "View",
                tone: "primary",
                onClick: onView,
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function NotificationActionButton({ action }: { action: NotificationAction }) {
  const isPrimary = action.tone === "primary";
  const isCompact = action.size === "compact";

  return (
    <Button
      variant={isPrimary ? "solid" : "outline"}
      size="sm"
      onClick={action.onClick}
      className={[
        "my-0 rounded-[0.75rem] text-center text-[0.875rem] font-medium leading-5 tracking-[0] shadow-none",
        isCompact ? "h-8 min-w-fit px-3" : "h-[2.375rem] min-w-[5.125rem] px-6",
        isPrimary
          ? "border border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]"
          : "border border-[#E6E6E6] bg-white text-[#1A1A1A] hover:bg-white",
      ].join(" ")}
    >
      {action.label}
    </Button>
  );
}