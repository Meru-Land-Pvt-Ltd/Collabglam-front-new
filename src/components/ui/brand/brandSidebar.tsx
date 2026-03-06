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
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import {
  Bell,
  CaretDown,
  CaretUpDown,
  CardsThree,
  ContactlessPayment,
  DotsThree,
  House,
  Lightning,
  NotePencil,
  PaperPlaneTilt,
  Question,
  UserPlus,
  Users,
  Wallet,
  X,
} from "@phosphor-icons/react";

/* -------------------------------- routing -------------------------------- */
const CAMPAIGN_PREFIX = "/brand/campaign";

const ROUTES: Record<string, string> = {
  dashboard: "/brand/dashboard",
  hub: "/brand/influencer",
  create: "/brand/add-edit-campaign",
  campaigns: "/brand/campaign/all",
  campaigns_all: "/brand/campaign/all",
  campaigns_active: "/brand/campaign/active",
  campaigns_draft: "/brand/campaign/draft",
  campaigns_scheduled: "/brand/campaign/scheduled-campaign",
  browse: "/brand/browse-influencers",
  inbox: "/brand/inbox",
  wallet: "/brand/wallet",
  notification: "/brand/notifications",
  credits: "/brand/credits",
  help: "/brand/help",
  invite: "/brand/invite-members",
};

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
  section: "dashboard" | "manage";
  right?: React.ReactNode;
  children?: Array<{ key: string; label: string }>;
};

type Workspace = {
  key: string;
  name: string;
  logoSrc?: string;
};

export type BrandSidebarProps = {
  drawerOpen?: boolean;
  setDrawerOpen?: (open: boolean) => void;
};

/* ------------------------------ constants ------------------------------ */

const UPGRADE_REST =
  "radial-gradient(140% 140% at 0% 20%, rgba(255, 140, 1, 0.80) 5%, rgba(255, 191, 0, 0.30) 31%, rgba(255, 255, 255, 0.50) 100%)";

const UPGRADE_HOVER =
  "radial-gradient(140% 140% at 0% 20%, rgba(255, 140, 1, 0.80) 8%, rgba(255, 191, 0, 0.40) 51%, rgba(255, 255, 255, 0.50) 100%)";

const UPGRADE_COLLAPSED =
  "radial-gradient(140% 140% at 0% 20%, rgba(255, 140, 1, 0.80) 5%, rgba(255, 191, 0, 0.40) 31%, rgba(255, 255, 255, 0.50) 80%)";

const upgradeSpring: Transition = {
  type: "spring",
  mass: 1,
  stiffness: 100,
  damping: 15,
};

const upgradeShellStyle: React.CSSProperties = {
  borderRadius: "var(--Spacing-8, 8px)",
  border: "1.5px solid var(--Neutrals-75, #F5F5F5)",
};

/* ---------------------------- small components ---------------------------- */

function WorkspaceLogo({ ws }: { ws: Workspace }) {
  return (
    <div className="h-8 w-8 rounded-lg grid place-items-center overflow-hidden bg-white border border-neutral-200 shrink-0">
      {ws.logoSrc ? (
        <img
          src={ws.logoSrc}
          alt={ws.name}
          className="h-5 w-5 object-contain bg-white rounded"
        />
      ) : (
        <span className="text-[#1a1a1a] text-xs font-semibold">
          {ws.name.slice(0, 1).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function PanelCaretGlyph({
  dir,
  className,
}: {
  dir: "left" | "right";
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("block", className)}
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="4.5"
        width="17"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 5.2V18.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {dir === "right" ? (
        <path
          d="M13.2 8.5L17 12l-3.8 3.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M17 8.5L13.2 12l3.8 3.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

/**
 * UPDATED RowButton: 
 * Merges the logic of your previous `RailIconButton` and `RowButton`.
 * It morphs between the two styles to prevent unmounting/remounting glitches.
 */
const RowButton = React.memo(function RowButton({
  active,
  icon: Icon,
  label,
  right,
  onClick,
  tight,
  collapsed,
}: {
  active?: boolean;
  icon: React.ElementType;
  label: string;
  right?: React.ReactNode;
  onClick?: () => void;
  tight?: boolean;
  collapsed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        // Common base classes
        "flex items-center rounded-lg transition-all duration-300 cursor-pointer overflow-hidden relative",
        FOCUS_RING,
        REST_NAV,
        active ? ACTIVE_NAV : HOVER_NAV,
        // Collapsed vs Expanded styling logic
        collapsed
          ? cn("justify-center mx-auto", tight ? "h-11 w-11" : "h-12 w-12") // Square shape (Rail style)
          : cn("justify-start w-full", tight ? "h-9 py-2 px-2.5 gap-2" : "h-10 py-2 px-3 gap-2") // Wide shape (Row style)
      )}
      style={{ fontFamily: "var(--Font-Family-Inter, Inter)" }}
    >
      {/* Icon - Always visible, fixed size to prevent squishing */}
      <Icon size={20} weight="regular" className="text-current shrink-0" />

      {/* Label - Smoothly animates width and opacity */}
      <m.span
        initial={false}
        animate={{
          width: collapsed ? 0 : "auto",
          opacity: collapsed ? 0 : 1,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "whitespace-nowrap overflow-hidden text-current",
          tight ? "text-[13px]" : "text-[14px]",
          "leading-5"
        )}
      >
        {label}
      </m.span>

      {/* Right Element (Caret or Badge) - Hidden when collapsed unless it's an indicator */}
      {!collapsed && right && (
        <m.span
          initial={false}
          animate={{ opacity: 1 }}
          className="ml-auto inline-flex items-center whitespace-nowrap text-current"
        >
          {right}
        </m.span>
      )}

      {/* Indicator dot (replaces the 'hasIndicator' logic from RailIconButton) */}
      {collapsed && right && (
        <span
          className={cn(
            "absolute top-2 right-2 h-2 w-2 rounded-full",
            active ? "bg-white" : "bg-[#1a1a1a]"
          )}
        />
      )}
    </button>
  );
});

/* -------------------------------- sidebar -------------------------------- */

export default function BrandSidebar({
  drawerOpen: drawerOpenProp,
  setDrawerOpen: setDrawerOpenProp,
}: BrandSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // breakpoints
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const isShort = useMediaQuery("(max-height: 800px)");
  const supportsHover = useMediaQuery("(hover: hover)");
  const vw = useViewportWidth();

  // nav state
  const [active, setActive] = useState<string>("dashboard");
  const [campaignOpen, setCampaignOpen] = useState(false);

  // workspace state
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceKey, setWorkspaceKey] = useState<string>("nike");

  // desktop collapse states
  const [collapsed, setCollapsed] = useState(true);
  const [widthCollapsed, setWidthCollapsed] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // drawer state
  const [drawerOpenInternal, setDrawerOpenInternal] = useState(false);
  const drawerOpen = drawerOpenProp ?? drawerOpenInternal;

  const setDrawerOpen = useCallback(
    (open: boolean) => {
      if (setDrawerOpenProp) setDrawerOpenProp(open);
      else setDrawerOpenInternal(open);
    },
    [setDrawerOpenProp]
  );

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

  const railMode = isDesktop && (collapsed || isClosing);
  const compactUI = isDesktop ? (collapsed || isClosing) : false;

  const campaignHoverRef = useRef(false);

  const workspaces = useMemo<Workspace[]>(
    () => [
      {
        key: "nike",
        name: "Nike Workspace",
        logoSrc: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
      },
      {
        key: "jordan",
        name: "Jordan Workspace",
        logoSrc: "https://upload.wikimedia.org/wikipedia/en/3/37/Jumpman_logo.svg",
      },
    ],
    []
  );

  const selectedWorkspace = useMemo(() => {
    return workspaces.find((w) => w.key === workspaceKey) ?? workspaces[0];
  }, [workspaceKey, workspaces]);

  // outside click for workspace menu
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!workspaceOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const el = workspaceRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      setWorkspaceOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      } as any);
    };
  }, [workspaceOpen]);

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

  const dropdownY: Variants = useMemo(
    () => ({
      initial: { opacity: 0, y: -6 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -6 },
    }),
    []
  );

  const dropdownScaleY: Variants = useMemo(
    () => ({
      initial: { opacity: 0, height: 0 },
      animate: { opacity: 1, height: "auto" },
      exit: { opacity: 0, height: 0 },
    }),
    []
  );

  const items = useMemo<Item[]>(
    () => [
      { key: "dashboard", label: "Dashboard", icon: House, section: "dashboard" },
      { key: "hub", label: "Influencer Hub", icon: Users, section: "dashboard" },
      { key: "create", label: "Create Campaign", icon: NotePencil, section: "dashboard" },
      {
        key: "campaigns",
        label: "Campaigns",
        icon: CardsThree,
        section: "dashboard",
        children: [
          { key: "campaigns_all", label: "All Campaigns" },
          { key: "campaigns_active", label: "Active Campaigns" },
          { key: "campaigns_draft", label: "Drafts Campaigns" },
          { key: "campaigns_scheduled", label: "Scheduled Campaigns" },
        ],
      },
      { key: "browse", label: "Browse Influencer", icon: Users, section: "dashboard" },
      { key: "inbox", label: "Inbox", icon: PaperPlaneTilt, section: "dashboard" },
      { key: "wallet", label: "Wallet", icon: Wallet, section: "dashboard" },
      {
        key: "notification",
        label: "Notification",
        icon: Bell,
        section: "manage",
        right: (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-neutral-100 text-[11px] text-[#1a1a1a]">
            1
          </span>
        ),
      },
      { key: "credits", label: "Credits", icon: ContactlessPayment, section: "manage" },
      { key: "help", label: "Help", icon: Question, section: "manage" },
      { key: "invite", label: "Invite Members", icon: UserPlus, section: "manage" },
    ],
    []
  );

  const dashboardItems = useMemo(() => items.filter((i) => i.section === "dashboard"), [items]);
  const manageItems = useMemo(() => items.filter((i) => i.section === "manage"), [items]);

  const isCampaignChildActive = active.startsWith("campaigns_");

  const routePairs = useMemo(() => {
    return Object.entries(ROUTES)
      .filter(([key]) => key !== "campaigns")
      .map(([key, path]) => ({ key, path }))
      .sort((a, b) => b.path.length - a.path.length);
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const p = pathname.replace(/\/+$/, "") || "/";
    const match = routePairs.find(({ path }) => p === path || p.startsWith(path + "/"));
    const nextKey =
      match?.key ??
      (p === CAMPAIGN_PREFIX || p.startsWith(CAMPAIGN_PREFIX + "/") ? "campaigns" : null);

    if (nextKey && nextKey !== active) {
      setActive(nextKey);
    }
  }, [pathname, routePairs, active]);

  useEffect(() => {
    const inCampaigns = active === "campaigns" || active.startsWith("campaigns_");
    if (inCampaigns && !(isDesktop && collapsed)) setCampaignOpen(true);
  }, [active, isDesktop, collapsed]);

  const goTo = useCallback(
    (key: string) => {
      const href = ROUTES[key];
      if (href) router.push(href);
    },
    [router]
  );

  const handleSetActive = useCallback(
    (key: string) => {
      setActive(key);
      if (!key.startsWith("campaigns")) {
        setCampaignOpen(false);
        campaignHoverRef.current = false;
      }
      goTo(key);
      if (!isDesktop) setDrawerOpen(false);
    },
    [goTo, isDesktop, setDrawerOpen]
  );

  const beginOpenDesktop = useCallback(() => {
    setCollapsed(false);
    setIsClosing(false);
    setWidthCollapsed(false);
  }, []);

  const beginCloseDesktop = useCallback(() => {
    setIsClosing(true);
    setCampaignOpen(false);
    campaignHoverRef.current = false;
    setWorkspaceOpen(false);
    setWidthCollapsed(true);
  }, []);

  const openCampaignsFromRail = useCallback(() => {
    beginOpenDesktop();
    setCampaignOpen(true);
    setActive("campaigns_all");
    goTo("campaigns_all");
  }, [beginOpenDesktop, goTo]);

  const handleCampaignMouseEnter = useCallback(() => {
    if (!supportsHover) return;
    if (collapsed || isClosing) return;
    campaignHoverRef.current = true;
    setCampaignOpen(true);
  }, [collapsed, isClosing, supportsHover]);

  const handleCampaignMouseLeave = useCallback(() => {
    if (!supportsHover) return;
    if (isClosing) return;
    campaignHoverRef.current = false;
    setCampaignOpen(false);
  }, [isClosing, supportsHover]);

  const tight = isShort;

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  const collapsedW = useMemo(() => {
    const min = 92;
    const max = isXl ? 136 : 124;
    return Math.round(clamp(vw * 0.075, min, max));
  }, [vw, isXl]);

  const expandedW = useMemo(() => {
    const min = isXl ? 300 : 280;
    const max = isXl ? 420 : 360;
    return Math.round(clamp(vw * 0.22, min, max));
  }, [vw, isXl]);

  const mobileW = useMemo(() => {
    const max = 320;
    const min = 260;
    return Math.max(min, Math.min(max, Math.floor(vw - 24)));
  }, [vw]);

  const renderItem = useCallback(
    (i: Item) => {
      const isActiveItem = active === i.key;
      const campaignsActive =
        i.key === "campaigns" && (active === "campaigns" || isCampaignChildActive);

      // Determine if this item should look "collapsed"
      // It is collapsed if desktop AND (collapsed OR closing)
      const isCollapsed = isDesktop && (collapsed || isClosing);

      return (
        <RowButton
          key={i.key}
          icon={i.icon}
          label={i.label}
          right={i.right}
          active={isActiveItem || campaignsActive}
          tight={tight}
          collapsed={isCollapsed}
          onClick={() => {
            if (i.key === "campaigns" && isCollapsed) return openCampaignsFromRail();
            handleSetActive(i.key);
          }}
        />
      );
    },
    [
      active,
      collapsed,
      handleSetActive,
      isCampaignChildActive,
      isClosing,
      isDesktop,
      openCampaignsFromRail,
      tight,
    ]
  );

  const SidebarBody = (
    <div className="flex h-full flex-col">
      {/* TOP */}
      <div className={cn("flex flex-col", tight ? "gap-3" : "gap-4")}>
        <div
          className={cn(
            "flex w-full items-center",
            railMode ? "flex-col gap-3" : "gap-3"
          )}
        >
          {/* Brand / Logo */}
          <button
            type="button"
            onClick={() => {
              if (isDesktop) {
                if (collapsed || isClosing) beginOpenDesktop();
              } else {
                setDrawerOpen(true);
              }
            }}
            className={cn(
              "grid place-items-center flex-shrink-0",
              FOCUS_RING,
              isDesktop && collapsed ? "cursor-pointer" : "cursor-default"
            )}
          >
            <img
              src="/logo.png"
              alt="CollabGlam"
              className="h-[40px] w-[40px] rounded-full object-cover"
            />
          </button>

          {/* Brand text */}
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
                style={{ willChange: "transform, opacity" }}
              >
                <div
                  className={cn(
                    "truncate font-semibold text-[#1a1a1a]",
                    tight ? "text-[18px]" : "text-[20px]"
                  )}
                >
                  CollabGlam
                </div>
                <div className="truncate text-[12px] text-neutral-500">For Brand</div>
              </m.div>
            )}
          </AnimatePresence>

          {/* Collapse / Close */}
          {isDesktop ? (
            <button
              type="button"
              onClick={() => {
                if (collapsed || isClosing) beginOpenDesktop();
                else beginCloseDesktop();
              }}
              className={cn(
                "grid h-10 w-10 flex-shrink-0 place-items-center transition rounded-lg",
                "text-[#343330] hover:bg-[#EDEDED] hover:text-[#1a1a1a]",
                FOCUS_RING,
                railMode ? "" : "ml-auto"
              )}
            >
              {collapsed ? <PanelCaretGlyph dir="right" /> : <PanelCaretGlyph dir="left" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
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

        {/* WORKSPACE SWITCHER */}
        <AnimatePresence initial={false}>
          {!compactUI && (
            <m.div
              key="workspace-switcher"
              ref={workspaceRef}
              variants={fadeScale}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={motionTransitions.content}
              className="w-full relative z-50"
              style={{ willChange: "transform, opacity" }}
            >
              <m.button
                type="button"
                onClick={() => setWorkspaceOpen((v) => !v)}
                animate={{ scale: workspaceOpen ? 1.02 : 1 }}
                transition={motionTransitions.content}
                className={cn(
                  "w-full flex items-center gap-3 text-left cursor-pointer transition border border-[#E6E6E6]",
                  "rounded-s bg-white hover:bg-neutral-50",
                  "p-2",
                  FOCUS_RING,
                  workspaceOpen ? "shadow-sm" : "shadow-none"
                )}
              >
                <WorkspaceLogo ws={selectedWorkspace} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[#1a1a1a] text-[14px] font-semibold leading-[20px]">
                    {selectedWorkspace.name}
                  </div>
                </div>
                <span className="ml-auto grid h-8 w-8 place-items-center">
                  <CaretUpDown size={20} className="text-[#1a1a1a]" />
                </span>
              </m.button>

              <AnimatePresence initial={false}>
                {workspaceOpen && (
                  <m.div
                    key="workspace-options"
                    variants={dropdownY}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={motionTransitions.content}
                    className="absolute left-1/2 top-full mt-2 z-[60] w-[calc(100%+26px)] -translate-x-1/2"
                  >
                    <m.div
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1.02, opacity: 1 }}
                      exit={{ scale: 0.98, opacity: 0 }}
                      transition={motionTransitions.content}
                      className="w-full rounded-s border border-[#E6E6E6] bg-white p-3 shadow-lg"
                    >
                      <div className="flex flex-col gap-2.5">
                        {workspaces.map((w) => {
                          const isSelected = w.key === selectedWorkspace.key;
                          return (
                            <button
                              key={w.key}
                              type="button"
                              onClick={() => {
                                setWorkspaceKey(w.key);
                                setWorkspaceOpen(false);
                              }}
                              className={cn(
                                "w-full h-14 px-4 flex items-center gap-3 text-left cursor-pointer transition",
                                "rounded-s border border-[#E6E6E6] bg-white hover:bg-neutral-50",
                                FOCUS_RING,
                                isSelected ? "ring-1 ring-[#1a1a1a]/30" : ""
                              )}
                            >
                              <WorkspaceLogo ws={w} />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[#1a1a1a] text-[14px] font-semibold leading-[20px]">
                                  {w.name}
                                </div>
                              </div>
                              <CaretUpDown size={18} className="text-[#1a1a1a] opacity-70" />
                            </button>
                          );
                        })}
                      </div>
                    </m.div>
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* NAV */}
      <div className={cn("mt-6 flex min-h-0 flex-1 flex-col", tight ? "mt-4" : "")}>
        <div
          className={cn(
            "min-h-0 flex-1",
            railMode
              ? "flex flex-col items-center overflow-y-auto px-1"
              : "overflow-y-auto pr-1"
          )}
        >
          {/* Dashboard title */}
          <AnimatePresence initial={false}>
            {!compactUI && (
              <m.div
                key="dash-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={motionTransitions.content}
                className="mb-4 text-[16px] font-semibold text-neutral-600 w-full"
              >
                Dashboard
              </m.div>
            )}
          </AnimatePresence>

          {/* Dashboard items (except wallet) */}
          <div className={cn("flex flex-col", railMode ? "gap-3" : "gap-2 w-full")}>
            {dashboardItems
              .filter((i) => i.key !== "wallet")
              .map((i) => {
                if (i.key !== "campaigns") return renderItem(i);

                const caret = (
                  <m.span
                    className="inline-flex items-center"
                    animate={{ rotate: campaignOpen ? 180 : 0 }}
                    transition={motionTransitions.content}
                  >
                    <CaretDown size={18} className="text-current opacity-70" />
                  </m.span>
                );

                if (isDesktop && (collapsed || isClosing)) return renderItem(i);

                return (
                  <div
                    key={i.key}
                    className="w-full"
                    onMouseEnter={handleCampaignMouseEnter}
                    onMouseLeave={handleCampaignMouseLeave}
                  >
                    <RowButton
                      icon={i.icon}
                      label={i.label}
                      right={caret}
                      tight={tight}
                      active={campaignOpen || active === "campaigns" || isCampaignChildActive}
                      collapsed={false}
                      onClick={() => {
                        setCampaignOpen((v) => !v);
                        setActive("campaigns_all");
                        goTo("campaigns_all");
                      }}
                    />

                    <AnimatePresence initial={false}>
                      {campaignOpen && !(isDesktop && isClosing) && (
                        <m.div
                          key="campaigns-dropdown"
                          variants={dropdownScaleY}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={motionTransitions.content}
                          className="overflow-hidden origin-top"
                        >
                          <div className="rounded-lg bg-white pt-1">
                            {(i.children ?? []).map((child) => {
                              const isSubActive = active === child.key;
                              return (
                                <button
                                  key={child.key}
                                  type="button"
                                  onClick={() => handleSetActive(child.key)}
                                  className={cn(
                                    "w-full cursor-pointer transition text-left rounded-lg",
                                    "px-6 py-2 my-1",
                                    FOCUS_RING,
                                    isSubActive
                                      ? "bg-[#dfdfdf] text-[#1a1a1a]"
                                      : "text-[#1a1a1a] hover:bg-[#1a1a1a]/10 hover:text-[#1a1a1a]"
                                  )}
                                  style={{
                                    fontSize: "13px",
                                    lineHeight: "18px",
                                  }}
                                >
                                  {child.label}
                                </button>
                              );
                            })}
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
          </div>

          <div
            className={cn(
              "my-5 h-px w-full bg-neutral-200",
              isDesktop && collapsed ? "opacity-70" : "",
              tight ? "my-4" : ""
            )}
          />

          {/* Wallet alone */}
          <div className={cn("flex flex-col", isDesktop && collapsed ? "gap-3" : "gap-2 w-full")}>
            {dashboardItems.filter((i) => i.key === "wallet").map((i) => renderItem(i))}
          </div>

          <div
            className={cn(
              "my-5 h-px w-full bg-neutral-200",
              isDesktop && collapsed ? "opacity-70" : "",
              tight ? "my-4" : ""
            )}
          />

          {/* Manage title */}
          <AnimatePresence initial={false}>
            {!compactUI && (
              <m.div
                key="manage-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={motionTransitions.content}
                className="mb-4 text-[16px] font-semibold text-neutral-600 w-full"
              >
                Manage
              </m.div>
            )}
          </AnimatePresence>

          {/* Manage items */}
          <div className={cn("flex flex-col", isDesktop && collapsed ? "gap-3" : "gap-2 w-full")}>
            {manageItems.map((i) => renderItem(i))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className={cn("mt-auto pt-6", tight ? "pt-4" : "")}>
        <AnimatePresence initial={false} mode="wait">
          {isDesktop && collapsed ? (
            <m.div
              key="collapsed-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={motionTransitions.content}
              className="flex flex-col items-center gap-4"
            >
              <m.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={upgradeSpring}
                className={cn(
                  "grid place-items-center overflow-hidden",
                  tight ? "h-12 w-12" : "h-14 w-14",
                  FOCUS_RING
                )}
                style={{
                  borderRadius: "var(--Spacing-8, 8px)",
                  background: UPGRADE_COLLAPSED,
                  willChange: "transform",
                }}
              >
                <Lightning size={24} className="text-[#1a1a1a]" />
              </m.button>

              <div className={cn("my-5 h-px w-full bg-neutral-200", tight ? "my-4" : "")} />

              <div className="h-10 w-10 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                <img
                  alt="User avatar"
                  src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=120&q=60"
                  className="h-full w-full object-cover"
                />
              </div>
            </m.div>
          ) : (
            <m.div
              key="expanded-footer"
              variants={fadeScale}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={motionTransitions.content}
              className="w-full"
              style={{ opacity: isDesktop && isClosing ? 0 : 1 }}
            >
              {/* Upgrade card */}
              <m.div
                initial="rest"
                animate="rest"
                whileHover="hover"
                transition={upgradeSpring}
                className={cn(
                  "relative flex w-full flex-col items-start gap-2.5 overflow-hidden p-2 cursor-pointer",
                  FOCUS_RING
                )}
                style={upgradeShellStyle}
                tabIndex={0}
                role="button"
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: UPGRADE_REST, borderRadius: "inherit" }}
                />
                <m.div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: UPGRADE_HOVER, borderRadius: "inherit" }}
                  variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
                  transition={upgradeSpring}
                />

                <div className="relative z-10 flex flex-col items-start gap-2.5">
                  <div className="relative h-6 w-6">
                    <m.span
                      className="absolute inset-0 grid place-items-center"
                      variants={{ rest: { opacity: 1 }, hover: { opacity: 0 } }}
                      transition={upgradeSpring}
                    >
                      <Lightning size={24} weight="regular" className="text-[#1a1a1a]" />
                    </m.span>

                    <m.span
                      className="absolute inset-0 grid place-items-center"
                      variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
                      transition={upgradeSpring}
                    >
                      <Lightning size={24} weight="fill" className="text-[#1a1a1a]" />
                    </m.span>
                  </div>

                  <div className="text-[#1a1a1a] text-[18px] font-semibold leading-[24px]">
                    Upgrade Plan
                  </div>

                  <div className="text-[#1a1a1a] font-[Inter] text-[14px] font-normal leading-[18px]">
                    Upgrade anytime. No long-term commitment
                  </div>
                </div>
              </m.div>

              <div className={cn("my-5 h-px w-full bg-neutral-200", tight ? "my-4" : "")} />

              {/* User row */}
              <div className="flex w-full items-center gap-3 bg-white p-3">
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                  <img
                    alt="Aditya"
                    src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=120&q=60"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] font-semibold text-[#1a1a1a]">Aditya</div>
                  <div className="truncate text-[12px] text-neutral-500">aditya.mail.coll...</div>
                </div>

                <button
                  type="button"
                  className={cn(
                    "flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl text-[#1a1a1a] transition hover:bg-[#EDEDED]",
                    FOCUS_RING
                  )}
                >
                  <DotsThree size={24} />
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  /* ---------------------------- desktop render ---------------------------- */

  const DesktopAside = (
    <m.aside
      data-cg-sidebar
      id="cg-sidebar"
      className={cn("inline-flex flex-col border border-neutral-200 bg-white select-none h-dvh")}
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

  /* ---------------------------- mobile drawer render ---------------------------- */

  const MobileDrawer = (
    <AnimatePresence>
      {drawerOpen ? (
        <>
          {/* Backdrop */}
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

          {/* Drawer */}
          <m.aside
            data-cg-sidebar
            id="cg-sidebar"
            className={cn(
              "fixed left-0 top-0 bottom-0 z-[100]",
              "border-r border-neutral-200 bg-white select-none"
            )}
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