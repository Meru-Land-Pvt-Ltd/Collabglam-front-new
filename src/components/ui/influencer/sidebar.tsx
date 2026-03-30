"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  useReducedMotion,
} from "framer-motion";
import type { Transition, Variants } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import {
  CardsThree,
  DotsThree,
  EnvelopeSimpleIcon,
  Gear,
  ImageIcon,
  PaperPlaneTilt,
  Question,
  RocketLaunchIcon,
  SignOut,
  SuitcaseIcon,
  UserIcon,
  WalletIcon,
  X,
} from "@phosphor-icons/react";
import { Megaphone } from "lucide-react";

/* -------------------------------- utils -------------------------------- */

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();

    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

function useViewportWidth(fallback = 375) {
  const [w, setW] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : fallback
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return w;
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1a1a1a]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const ACTIVE_NAV = "bg-[#1a1a1a] text-white";
const HOVER_NAV = "hover:bg-[#1a1a1a]/10 hover:text-[#1a1a1a]";
const REST_NAV = "text-[#1a1a1a]";

/* -------------------------------- types -------------------------------- */

type Item = {
  key: string;
  label: string;
  icon: React.ElementType;
  section: "main" | "footer";
  href: string;
  right?: React.ReactNode;
};

type PayoutSummary = {
  influencerId: string;
  totalPaid: number;
  totalUpcoming: number;
  totalInitiated: number;
};

type InfluencerProfile = {
  name?: string;
  email?: string;
  profileImage?: string;
};

export type InfluencerSidebarProps = {
  drawerOpen?: boolean;
  setDrawerOpen?: (open: boolean) => void;
  campaignBadge?: React.ReactNode;
  appliedBadge?: React.ReactNode;
  messagesBadge?: React.ReactNode;
  influencerId?: string;
  token?: string;
  onLogout?: () => void;
};

/* ------------------------------ api helper ------------------------------ */

async function apiGetInfluencerPayoutSummary(
  influencerId: string,
  token?: string
): Promise<PayoutSummary> {
  const res = await fetch("/api/influencer-payout-summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ influencerId }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch influencer payout summary");
  }

  return res.json();
}

async function apiGetInfluencerProfile(
  influencerId: string,
  token?: string
): Promise<InfluencerProfile> {
  const res = await fetch("/api/get-influencer-profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ influencerId }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch influencer profile");
  }

  return res.json();
}

/* ------------------------------ small components ------------------------------ */

function PanelCaretGlyph({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16.5 0H1.5C1.10218 0 0.720644 0.158035 0.43934 0.43934C0.158035 0.720644 0 1.10218 0 1.5V16.5C0 16.8978 0.158035 17.2794 0.43934 17.5607C0.720644 17.842 1.10218 18 1.5 18H16.5C16.8978 18 17.2794 17.842 17.5607 17.5607C17.842 17.2794 18 16.8978 18 16.5V1.5C18 1.10218 17.842 0.720644 17.5607 0.43934C17.2794 0.158035 16.8978 0 16.5 0ZM1.5 1.5H13.5V16.5H1.5V1.5ZM16.5 16.5H15V1.5H16.5V16.5Z"
        fill="currentColor"
      />
      {dir === "right" ? (
        <path
          d="M7.25 5.5L10.75 9L7.25 12.5"
          transform="translate(-1.1 0)"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M10.75 5.5L7.25 9L10.75 12.5"
          transform="translate(-1.1 0)"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

const RailIconButton = React.memo(function RailIconButton({
  active,
  onClick,
  children,
  label,
  hasIndicator,
  tight,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  label: string;
  hasIndicator?: boolean;
  tight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid place-items-center rounded-lg transition cursor-pointer",
        tight ? "h-11 w-11" : "h-12 w-12",
        FOCUS_RING,
        REST_NAV,
        active ? ACTIVE_NAV : HOVER_NAV
      )}
    >
      <span className="relative grid place-items-center text-current">
        {children}
        {hasIndicator ? (
          <span
            className={cn(
              "absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full",
              active ? "bg-white" : "bg-[#1a1a1a]"
            )}
          />
        ) : null}
      </span>
    </button>
  );
});

const RowButton = React.memo(function RowButton({
  active,
  icon: Icon,
  label,
  right,
  onClick,
  hideLabel,
  tight,
}: {
  active?: boolean;
  icon: React.ElementType;
  label: string;
  right?: React.ReactNode;
  onClick?: () => void;
  hideLabel?: boolean;
  tight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex w-full items-center gap-2 rounded-lg transition cursor-pointer justify-start",
        tight ? "h-9 px-2.5 py-2" : "h-10 px-3 py-2",
        FOCUS_RING,
        REST_NAV,
        active ? ACTIVE_NAV : HOVER_NAV
      )}
      style={{ fontFamily: "var(--Font-Family-Inter, Inter)" }}
    >
      <Icon size={20} weight="regular" className="text-current" />

      <span
        className={cn(
          tight ? "text-[13px]" : "text-[14px]",
          "leading-5 whitespace-nowrap text-current",
          hideLabel
            ? "opacity-0 w-0 overflow-hidden pointer-events-none"
            : "opacity-100"
        )}
        style={{ transition: "opacity 180ms ease, width 180ms ease" }}
      >
        {label}
      </span>

      {right ? (
        <span
          className={cn(
            "ml-auto inline-flex items-center whitespace-nowrap text-current",
            hideLabel
              ? "opacity-0 w-0 overflow-hidden pointer-events-none"
              : "opacity-100"
          )}
          style={{ transition: "opacity 180ms ease, width 180ms ease" }}
        >
          {right}
        </span>
      ) : null}
    </button>
  );
});

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-neutral-100 px-1.5 text-[11px] text-[#1a1a1a]">
      {children}
    </span>
  );
}

function WalletSummary({
  summary,
  hideLabel,
}: {
  summary: PayoutSummary | null;
  hideLabel?: boolean;
}) {
  if (!summary || hideLabel) return null;

  const balance =
    Number(summary.totalPaid || 0) +
    Number(summary.totalUpcoming || 0) +
    Number(summary.totalInitiated || 0);

  return (
    <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3">
      <div className="mb-3">
        <p className="text-[12px] text-neutral-500">Balance</p>
        <p className="text-[20px] font-semibold text-[#1a1a1a]">₹{balance}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-neutral-600">Paid</span>
          <span className="font-medium text-[#1a1a1a]">₹{summary.totalPaid}</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-neutral-600">Upcoming</span>
          <span className="font-medium text-[#1a1a1a]">
            ₹{summary.totalUpcoming}
          </span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-neutral-600">Initiated</span>
          <span className="font-medium text-[#1a1a1a]">
            ₹{summary.totalInitiated}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProfileMenu({
  open,
  onClose,
  onProfile,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  onProfile: () => void;
  onLogout: () => void;
}) {
  if (!open) return null;

  return (
    <div className="absolute bottom-[68px] right-0 z-[120] w-[200px] rounded-[18px] border border-neutral-200 bg-white p-3 shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
      <button
        type="button"
        onClick={() => {
          onProfile();
          onClose();
        }}
        className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[#222] transition hover:bg-neutral-50"
      >
        <UserIcon size={20} weight="regular" />
        <span className="text-[14px] font-medium">Profile</span>
      </button>

      <div className="my-2.5 h-px w-full bg-neutral-200" />

      <button
        type="button"
        onClick={() => {
          onLogout();
          onClose();
        }}
        className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[#F04E3E] transition hover:bg-red-50"
      >
        <SignOut size={20} weight="regular" />
        <span className="text-[14px] font-medium">Logout</span>
      </button>
    </div>
  );
}

/* -------------------------------- sidebar -------------------------------- */

export default function Sidebar({
  drawerOpen: drawerOpenProp,
  setDrawerOpen: setDrawerOpenProp,
  campaignBadge,
  appliedBadge,
  messagesBadge,
  influencerId,
  token,
  onLogout,
}: InfluencerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const isShort = useMediaQuery("(max-height: 800px)");
  const vw = useViewportWidth();

  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null);
  const [profileData, setProfileData] = useState<InfluencerProfile | null>(null);

  const [active, setActive] = useState<string>("");
  const [collapsed, setCollapsed] = useState(true);
  const [widthCollapsed, setWidthCollapsed] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [drawerOpenInternal, setDrawerOpenInternal] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const drawerOpen = drawerOpenProp ?? drawerOpenInternal;

  const profileName = profileData?.name || "Profile";
  const profileEmail = profileData?.email || "";
  const profileImage = profileData?.profileImage || "";

  const setDrawerOpen = useCallback(
    (open: boolean) => {
      if (setDrawerOpenProp) setDrawerOpenProp(open);
      else setDrawerOpenInternal(open);
    },
    [setDrawerOpenProp]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    const loadPayoutSummary = async () => {
      try {
        if (!influencerId?.trim()) return;
        const res = await apiGetInfluencerPayoutSummary(influencerId, token);
        setPayoutSummary(res);
      } catch (error) {
        console.error("Failed to load payout summary:", error);
      }
    };

    loadPayoutSummary();
  }, [influencerId, token]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!influencerId?.trim()) return;
        const res = await apiGetInfluencerProfile(influencerId, token);
        setProfileData(res);
      } catch (error) {
        console.error("Failed to load influencer profile:", error);
      }
    };

    loadProfile();
  }, [influencerId, token]);

  const items = useMemo<Item[]>(
    () => [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: CardsThree,
        section: "main",
        href: "/influencer/dashboards",
      },
      {
        key: "discover-campaigns",
        label: "Discover Campaigns",
        icon: Megaphone,
        section: "main",
        href: "/influencer/discover-campaigns",
        right:
          campaignBadge != null ? <Badge>{campaignBadge}</Badge> : undefined,
      },
      {
        key: "invitations",
        label: "Direct Invitations",
        icon: EnvelopeSimpleIcon,
        section: "main",
        href: "/influencer/invitations",
        right:
          campaignBadge != null ? <Badge>{campaignBadge}</Badge> : undefined,
      },
      {
        key: "my-campaigns",
        label: "My Campaigns",
        icon: SuitcaseIcon,
        section: "main",
        href: "/influencer/my-campaigns",
        right:
          appliedBadge != null ? <Badge>{appliedBadge}</Badge> : undefined,
      },
      {
        key: "messages",
        label: "Inbox",
        icon: PaperPlaneTilt,
        section: "main",
        href: "/influencer/inbox",
        right:
          messagesBadge != null ? <Badge>{messagesBadge}</Badge> : undefined,
      },
      {
        key: "wallet-payments",
        label: "Wallet & Payments",
        icon: WalletIcon,
        section: "main",
        href: "/influencer/wallets-payments",
      },
      {
        key: "media-kit",
        label: "Media Kit",
        icon: ImageIcon,
        section: "main",
        href: "/influencer/media-kit",
      },
      // {
      //   key: "profile",
      //   label: "Profile",
      //   icon: UserIcon,
      //   section: "main",
      //   href: "/influencer/profile",
      // },
      {
        key: "support",
        label: "Help",
        icon: Question,
        section: "footer",
        href: "/influencer/support-center",
      },
    ],
    [campaignBadge, appliedBadge, messagesBadge]
  );

  const mainItems = useMemo(
    () => items.filter((i) => i.section === "main"),
    [items]
  );
  const footerItems = useMemo(
    () => items.filter((i) => i.section === "footer"),
    [items]
  );

  useEffect(() => {
    const p = pathname || "";
    const matched = items.find(
      (item) => item.href === p || p.startsWith(item.href + "/")
    );
    setActive(matched?.key ?? "dashboard");
  }, [pathname, items]);

  useEffect(() => {
    if (isDesktop) {
      setDrawerOpen(false);
      setCollapsed(true);
      setIsClosing(false);
      setWidthCollapsed(true);
    } else {
      setCollapsed(false);
      setIsClosing(false);
      setWidthCollapsed(false);
    }
  }, [isDesktop, setDrawerOpen]);

  const compactUI = isDesktop ? collapsed || isClosing : false;
  const tight = isShort;

  const motionTransitions = useMemo(() => {
    const content: Transition = reduceMotion
      ? { duration: 0 }
      : { duration: 0.2, ease: [0.4, 0, 0.2, 1] };

    const aside: Transition = reduceMotion
      ? { duration: 0 }
      : { type: "spring", stiffness: 320, damping: 32, mass: 0.9 };

    const drawer: Transition = reduceMotion
      ? { duration: 0 }
      : { type: "spring", stiffness: 420, damping: 38, mass: 0.85 };

    return { content, aside, drawer };
  }, [reduceMotion]);

  const fadeScale: Variants = useMemo(
    () => ({
      initial: { opacity: 0, scale: 0.96 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.96 },
    }),
    []
  );

  const handleSetActive = useCallback(
    (key: string) => {
      const item = items.find((x) => x.key === key);
      if (!item) return;
      setActive(key);
      router.push(item.href);
      if (!isDesktop) setDrawerOpen(false);
    },
    [items, router, isDesktop, setDrawerOpen]
  );

  const beginOpenDesktop = useCallback(() => {
    setCollapsed(false);
    setIsClosing(false);
    setWidthCollapsed(false);
  }, []);

  const beginCloseDesktop = useCallback(() => {
    setIsClosing(true);
    setWidthCollapsed(true);
    setProfileMenuOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout();
      return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    router.push("/influencer/login");
  }, [onLogout, router]);

  const collapsedW = isXl ? 92 : 84;
  const expandedW = isXl ? 320 : 280;

  const mobileW = useMemo(() => {
    const max = 320;
    const min = 260;
    return Math.max(min, Math.min(max, Math.floor(vw - 24)));
  }, [vw]);

  const renderItem = useCallback(
    (i: Item) => {
      const Icon = i.icon;
      const isActiveItem = active === i.key;
      const isWalletItem = i.key === "wallet-payments";

      if (isDesktop && collapsed) {
        return (
          <RailIconButton
            key={i.key}
            label={i.label}
            tight={tight}
            active={isActiveItem}
            hasIndicator={Boolean(i.right)}
            onClick={() => handleSetActive(i.key)}
          >
            <Icon size={20} weight="regular" className="text-current" />
          </RailIconButton>
        );
      }

      if (isWalletItem) {
        return (
          <div key={i.key} className="w-full">
            <RowButton
              icon={i.icon}
              label={i.label}
              right={i.right}
              active={isActiveItem}
              hideLabel={isDesktop ? isClosing : false}
              tight={tight}
              onClick={() => handleSetActive(i.key)}
            />
          </div>
        );
      }

      return (
        <RowButton
          key={i.key}
          icon={i.icon}
          label={i.label}
          right={i.right}
          active={isActiveItem}
          hideLabel={isDesktop ? isClosing : false}
          tight={tight}
          onClick={() => handleSetActive(i.key)}
        />
      );
    },
    [active, collapsed, handleSetActive, isClosing, isDesktop, tight]
  );

  const BottomProfileSection = (
    <div className="relative mt-auto pt-4" ref={profileMenuRef}>
      <div className="mb-3 h-px w-full bg-neutral-200" />

      {isDesktop && collapsed ? (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/influencer/profile")}
            className={cn(
              "grid h-12 w-12 place-items-center rounded-full border border-neutral-200 bg-white transition hover:bg-neutral-50",
              FOCUS_RING
            )}
            title="Profile"
            aria-label="Profile"
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt={profileName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <UserIcon size={22} weight="regular" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className={cn(
              "grid h-12 w-12 place-items-center rounded-full bg-neutral-100 transition hover:bg-neutral-200",
              FOCUS_RING
            )}
            title="Open profile menu"
            aria-label="Open profile menu"
          >
            <DotsThree size={22} weight="bold" />
          </button>

          <ProfileMenu
            open={profileMenuOpen}
            onClose={() => setProfileMenuOpen(false)}
            onProfile={() => router.push("/influencer/profile")}
            onLogout={handleLogout}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
            <button
              type="button"
              onClick={() => router.push("/influencer/profile")}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={profileName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <UserIcon size={22} weight="regular" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[18px] font-semibold text-[#1a1a1a]">
                  {profileName}
                </div>
                <div className="truncate text-[14px] text-neutral-400">
                  {profileEmail}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className={cn(
                "grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-neutral-100 transition hover:bg-neutral-200",
                FOCUS_RING
              )}
              title="Open profile menu"
              aria-label="Open profile menu"
            >
              <DotsThree size={22} weight="bold" />
            </button>
          </div>

          <ProfileMenu
            open={profileMenuOpen}
            onClose={() => setProfileMenuOpen(false)}
            onProfile={() => router.push("/influencer/profile")}
            onLogout={handleLogout}
          />
        </>
      )}
    </div>
  );

  const SidebarBody = (
    <div className="flex h-full flex-col">
      <div className={cn("flex flex-col", tight ? "gap-3" : "gap-4")}>
        <div
          className={cn(
            "flex w-full items-center",
            isDesktop && (collapsed || isClosing) ? "flex-col gap-3" : "gap-3"
          )}
        >
          <button
            type="button"
            onClick={() => {
              if (isDesktop) {
                if (collapsed || isClosing) beginOpenDesktop();
                else router.push("/influencer/dashboards");
              } else {
                setDrawerOpen(true);
              }
            }}
            className={cn(
              "grid place-items-center flex-shrink-0",
              FOCUS_RING,
              isDesktop && collapsed ? "cursor-pointer" : "cursor-default"
            )}
            aria-label={isDesktop && collapsed ? "Open sidebar" : "CollabGlam"}
            title={isDesktop && collapsed ? "Open" : "CollabGlam"}
          >
            <img
              src="/logo.png"
              alt="CollabGlam"
              className="h-[40px] w-[40px] rounded-full object-cover"
            />
          </button>

          <AnimatePresence initial={false}>
            {!compactUI && (
              <m.div
                key="brand"
                variants={fadeScale}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={motionTransitions.content}
                className="min-w-0 flex-1"
              >
                <div
                  className={cn(
                    "truncate font-semibold text-[#1a1a1a]",
                    tight ? "text-[18px]" : "text-[20px]"
                  )}
                >
                  CollabGlam
                </div>
                <div className="truncate text-[12px] text-neutral-500">
                  Creator
                </div>
              </m.div>
            )}
          </AnimatePresence>

          {isDesktop ? (
            <button
              type="button"
              onClick={() => {
                if (collapsed || isClosing) beginOpenDesktop();
                else beginCloseDesktop();
              }}
              aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
              title={collapsed ? "Open" : "Close"}
              className={cn(
                "grid h-10 w-10 flex-shrink-0 place-items-center transition rounded-lg",
                "text-[#343330] hover:bg-[#EDEDED] hover:text-[#1a1a1a]",
                FOCUS_RING,
                collapsed || isClosing ? "" : "ml-auto"
              )}
            >
              {collapsed ? (
                <PanelCaretGlyph dir="right" />
              ) : (
                <PanelCaretGlyph dir="left" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              title="Close"
              className={cn(
                "ml-auto grid h-10 w-10 place-items-center rounded-lg transition",
                "text-[#343330] hover:bg-[#EDEDED] hover:text-[#1a1a1a]",
                FOCUS_RING
              )}
            >
              <X size={22} />
            </button>
          )}
        </div>
      </div>

      <div className={cn("mt-6 flex min-h-0 flex-1 flex-col", tight ? "mt-4" : "")}>
        <div
          className={cn(
            "min-h-0 flex-1 pr-1",
            isDesktop && collapsed
              ? "flex flex-col items-center overflow-y-auto"
              : "overflow-y-auto"
          )}
        >
          <div className={cn("flex flex-col", isDesktop && collapsed ? "gap-3" : "gap-2 w-full")}>
            {mainItems.map((i) => renderItem(i))}
          </div>

          <div
            className={cn(
              "my-5 h-px w-full bg-neutral-200",
              isDesktop && collapsed ? "opacity-70" : "",
              tight ? "my-4" : ""
            )}
          />

          <div className={cn("flex flex-col", isDesktop && collapsed ? "gap-3" : "gap-2 w-full")}>
            {footerItems.map((i) => renderItem(i))}
          </div>
        </div>

        {BottomProfileSection}
      </div>
    </div>
  );

  const DesktopAside = (
    <m.aside
      data-cg-sidebar
      id="cg-sidebar"
      className="inline-flex h-dvh flex-col border border-neutral-200 bg-white select-none"
      style={{
        padding: tight ? "12px 16px 16px 16px" : "16px 20px 20px 20px",
        fontFamily: "var(--Font-Family-Inter, Inter)",
        willChange: "width",
      }}
      initial={false}
      animate={{ width: widthCollapsed ? collapsedW : expandedW }}
      transition={motionTransitions.aside}
      onAnimationComplete={() => {
        if (widthCollapsed && isClosing) {
          setCollapsed(true);
          setIsClosing(false);
        }
      }}
    >
      {SidebarBody}
    </m.aside>
  );

  const MobileDrawer = (
    <AnimatePresence>
      {drawerOpen ? (
        <>
          <m.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[99] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={motionTransitions.content}
            onClick={() => setDrawerOpen(false)}
          />

          <m.aside
            data-cg-sidebar
            id="cg-sidebar"
            className="fixed left-0 top-0 bottom-0 z-[100] border-r border-neutral-200 bg-white select-none"
            style={{
              width: mobileW,
              padding: tight ? "12px 16px 16px 16px" : "16px 20px 20px 20px",
              fontFamily: "var(--Font-Family-Inter, Inter)",
              willChange: "transform",
            }}
            initial={{ x: -mobileW - 24 }}
            animate={{ x: 0 }}
            exit={{ x: -mobileW - 24 }}
            transition={motionTransitions.drawer}
          >
            {SidebarBody}
          </m.aside>
        </>
      ) : null}
    </AnimatePresence>
  );

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion={reduceMotion ? "always" : "never"}>
        {isDesktop ? DesktopAside : MobileDrawer}
      </MotionConfig>
    </LazyMotion>
  );
}