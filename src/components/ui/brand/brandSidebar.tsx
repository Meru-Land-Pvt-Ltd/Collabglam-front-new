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
import { get } from "@/lib/api";

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
  create: "/brand/create-campaign",
  campaigns: "/brand/created-campaign",
  campaigns_all: "/brand/created-campaign",
  campaigns_active: "/brand/active-campaign",
  campaigns_draft: "/brand/draft-campaign",
  campaigns_history: "/brand/campaign-history",
  browse: "/brand/browse-influencer",
  inbox: "/brand/inbox",
  wallet: "/brand/wallet",
  notification: "/brand/notifications",
  credits: "/brand/credits",
  help: "/brand/help",
  invite: "/brand/invite-members",
};

/* -------------------------------- types -------------------------------- */

type BrandPlanRes = {
  brandPlanId?: string | null;
  brandPlanName?: string | null;
};

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

/* -------------------------------- utils -------------------------------- */

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

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

function titleCasePlan(value: string | null) {
  if (!value) return "Free";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* -------------------------------- styles -------------------------------- */

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1a1a1a]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const ACTIVE_NAV = "bg-[#1a1a1a] text-white";
const HOVER_NAV = "hover:bg-[#1a1a1a]/10 hover:text-[#1a1a1a]";
const REST_NAV = "text-[#1a1a1a]";

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
    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-white grid place-items-center">
      {ws.logoSrc ? (
        <img
          src={ws.logoSrc}
          alt={ws.name}
          className="h-5 w-5 rounded bg-white object-contain"
        />
      ) : (
        <span className="text-xs font-semibold text-[#1a1a1a]">
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
        "relative flex cursor-pointer items-center overflow-hidden rounded-lg transition-all duration-300",
        FOCUS_RING,
        REST_NAV,
        active ? ACTIVE_NAV : HOVER_NAV,
        collapsed
          ? cn("mx-auto justify-center", tight ? "h-11 w-11" : "h-12 w-12")
          : cn("w-full justify-start", tight ? "h-9 gap-2 px-2.5 py-2" : "h-10 gap-2 px-3 py-2")
      )}
      style={{ fontFamily: "var(--Font-Family-Inter, Inter)" }}
    >
      <Icon size={20} weight="regular" className="shrink-0 text-current" />

      <m.span
        initial={false}
        animate={{
          width: collapsed ? 0 : "auto",
          opacity: collapsed ? 0 : 1,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "overflow-hidden whitespace-nowrap text-current",
          tight ? "text-[13px]" : "text-[14px]",
          "leading-5"
        )}
      >
        {label}
      </m.span>

      {!collapsed && right && (
        <m.span
          initial={false}
          animate={{ opacity: 1 }}
          className="ml-auto inline-flex items-center whitespace-nowrap text-current"
        >
          {right}
        </m.span>
      )}

      {collapsed && right && (
        <span
          className={cn(
            "absolute right-2 top-2 h-2 w-2 rounded-full",
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

  /* ------------------------------- responsive ------------------------------ */

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const isShort = useMediaQuery("(max-height: 800px)");
  const supportsHover = useMediaQuery("(hover: hover)");
  const vw = useViewportWidth();

  /* --------------------------------- state -------------------------------- */

  const [active, setActive] = useState<string>("dashboard");
  const [campaignOpen, setCampaignOpen] = useState(false);

  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceKey, setWorkspaceKey] = useState<string>("nike");

  const [collapsed, setCollapsed] = useState(true);
  const [widthCollapsed, setWidthCollapsed] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const [drawerOpenInternal, setDrawerOpenInternal] = useState(false);
  const drawerOpen = drawerOpenProp ?? drawerOpenInternal;

  const [planId, setPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);

  const didFetchPlanRef = useRef(false);
  const campaignHoverRef = useRef(false);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  /* -------------------------------- derived -------------------------------- */

  const tight = isShort;
  const railMode = isDesktop && (collapsed || isClosing);
  const compactUI = isDesktop ? collapsed || isClosing : false;

  const normalizedPlanName = useMemo(
    () => (planName ? planName.trim().toLowerCase() : null),
    [planName]
  );

  const isPaidPlan = useMemo(() => {
    if (!normalizedPlanName) return false;
    return !["free", "basic", "trial"].includes(normalizedPlanName);
  }, [normalizedPlanName]);

  const planLabel = useMemo(
    () => titleCasePlan(normalizedPlanName),
    [normalizedPlanName]
  );

  const upgradeCardTitle = isPaidPlan ? "Manage Plan" : "Upgrade Plan";
  const upgradeCardDesc = isPaidPlan
    ? `You are currently on the ${planLabel} plan`
    : "Upgrade anytime. No long-term commitment";

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

  const selectedWorkspace = useMemo(
    () => workspaces.find((w) => w.key === workspaceKey) ?? workspaces[0],
    [workspaceKey, workspaces]
  );

  const items = useMemo<Item[]>(
    () => [
      { key: "dashboard", label: "Dashboard", icon: House, section: "dashboard" },
      { key: "create", label: "Create Campaign", icon: NotePencil, section: "dashboard" },
      {
        key: "campaigns",
        label: "Campaigns",
        icon: CardsThree,
        section: "dashboard",
        children: [
          { key: "campaigns_all", label: "Created Campaigns" },
          { key: "campaigns_active", label: "Active Campaigns" },
          // { key: "campaigns_draft", label: "Drafts Campaigns" },
          { key: "campaigns_history", label: "Campaigns History" },
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

  const dashboardItems = useMemo(
    () => items.filter((i) => i.section === "dashboard"),
    [items]
  );

  const manageItems = useMemo(
    () => items.filter((i) => i.section === "manage"),
    [items]
  );

  const isCampaignChildActive = active.startsWith("campaigns_");

  const routePairs = useMemo(() => {
    return Object.entries(ROUTES)
      .filter(([key]) => key !== "campaigns")
      .map(([key, path]) => ({ key, path }))
      .sort((a, b) => b.path.length - a.path.length);
  }, []);

  const clamp = useCallback((v: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, v));
  }, []);

  const collapsedW = useMemo(() => {
    const min = 92;
    const max = isXl ? 136 : 124;
    return Math.round(clamp(vw * 0.075, min, max));
  }, [clamp, vw, isXl]);

  const expandedW = useMemo(() => {
    const min = isXl ? 300 : 280;
    const max = isXl ? 420 : 360;
    return Math.round(clamp(vw * 0.22, min, max));
  }, [clamp, vw, isXl]);

  const mobileW = useMemo(() => {
    const max = 320;
    const min = 260;
    return Math.max(min, Math.min(max, Math.floor(vw - 24)));
  }, [vw]);

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

  /* -------------------------------- effects -------------------------------- */

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedToken =
        window.localStorage.getItem("token") ||
        window.localStorage.getItem("accessToken");

      const storedBrandId =
        window.localStorage.getItem("brandId") ||
        window.localStorage.getItem("currentBrandId");

      const cachedPlanId = window.localStorage.getItem("brandPlanId");
      const cachedPlanName = window.localStorage.getItem("brandPlanName");

      if (storedToken) setToken(storedToken);
      if (storedBrandId) setBrandId(storedBrandId);
      if (cachedPlanId) setPlanId(cachedPlanId);
      if (cachedPlanName) setPlanName(cachedPlanName.toLowerCase());
    } catch {}
  }, []);

  useEffect(() => {
    if (!token || !brandId) return;
    if (didFetchPlanRef.current) return;

    didFetchPlanRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        const data = await get<BrandPlanRes>(
          `/subscription/brand/current?brandId=${encodeURIComponent(brandId)}`
        );

        const latestId = data?.brandPlanId ?? null;
        const latestName = data?.brandPlanName
          ? String(data.brandPlanName).toLowerCase()
          : null;

        if (cancelled) return;

        setPlanId(latestId);
        setPlanName(latestName);

        try {
          if (latestId) window.localStorage.setItem("brandPlanId", latestId);
          else window.localStorage.removeItem("brandPlanId");

          if (latestName) window.localStorage.setItem("brandPlanName", latestName);
          else window.localStorage.removeItem("brandPlanName");
        } catch {}
      } catch {
        // keep cached values on failure
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, brandId]);

  useEffect(() => {
    if (isDesktop) {
      setDrawerOpenProp?.(false);
      if (!setDrawerOpenProp) setDrawerOpenInternal(false);
      setCollapsed(true);
      setIsClosing(false);
      setWidthCollapsed(true);
    } else {
      setCollapsed(false);
      setIsClosing(false);
      setWidthCollapsed(false);
    }
  }, [isDesktop, setDrawerOpenProp]);

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
      } as EventListenerOptions);
    };
  }, [workspaceOpen]);

  useEffect(() => {
    if (!pathname) return;

    const currentPath = pathname.replace(/\/+$/, "") || "/";
    const match = routePairs.find(
      ({ path }) => currentPath === path || currentPath.startsWith(`${path}/`)
    );

    const nextKey =
      match?.key ??
      (currentPath === CAMPAIGN_PREFIX || currentPath.startsWith(`${CAMPAIGN_PREFIX}/`)
        ? "campaigns"
        : null);

    if (nextKey && nextKey !== active) setActive(nextKey);
  }, [pathname, routePairs, active]);

  useEffect(() => {
    const inCampaigns = active === "campaigns" || active.startsWith("campaigns_");
    if (inCampaigns && !(isDesktop && collapsed)) setCampaignOpen(true);
  }, [active, isDesktop, collapsed]);

  /* ------------------------------- callbacks ------------------------------- */

  const setDrawerOpen = useCallback(
    (open: boolean) => {
      if (setDrawerOpenProp) setDrawerOpenProp(open);
      else setDrawerOpenInternal(open);
    },
    [setDrawerOpenProp]
  );

  const goTo = useCallback(
    (key: string) => {
      const href = ROUTES[key];
      if (href) router.push(href);
    },
    [router]
  );

  const handlePlanClick = useCallback(() => {
    router.push("/brand/subscriptions");
    if (!isDesktop) setDrawerOpen(false);
  }, [router, isDesktop, setDrawerOpen]);

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
  }, [supportsHover, collapsed, isClosing]);

  const handleCampaignMouseLeave = useCallback(() => {
    if (!supportsHover) return;
    if (isClosing) return;

    campaignHoverRef.current = false;
    setCampaignOpen(false);
  }, [supportsHover, isClosing]);

  const renderItem = useCallback(
    (item: Item) => {
      const isActiveItem = active === item.key;
      const campaignsActive =
        item.key === "campaigns" && (active === "campaigns" || isCampaignChildActive);

      const isCollapsed = isDesktop && (collapsed || isClosing);

      return (
        <RowButton
          key={item.key}
          icon={item.icon}
          label={item.label}
          right={item.right}
          active={isActiveItem || campaignsActive}
          tight={tight}
          collapsed={isCollapsed}
          onClick={() => {
            if (item.key === "campaigns" && isCollapsed) {
              openCampaignsFromRail();
              return;
            }
            handleSetActive(item.key);
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

  /* -------------------------------- markup -------------------------------- */

  const SidebarBody = (
    <div className="flex h-full flex-col">
      <div className={cn("flex flex-col", tight ? "gap-3" : "gap-4")}>
        <div className={cn("flex w-full items-center", railMode ? "flex-col gap-3" : "gap-3")}>
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
              "grid flex-shrink-0 place-items-center",
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

          {isDesktop ? (
            <button
              type="button"
              onClick={() => {
                if (collapsed || isClosing) beginOpenDesktop();
                else beginCloseDesktop();
              }}
              className={cn(
                "grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg transition",
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
              className="relative z-50 w-full"
              style={{ willChange: "transform, opacity" }}
            >
              <m.button
                type="button"
                onClick={() => setWorkspaceOpen((v) => !v)}
                animate={{ scale: workspaceOpen ? 1.02 : 1 }}
                transition={motionTransitions.content}
                className={cn(
                  "w-full cursor-pointer rounded-s border border-[#E6E6E6] bg-white p-2 text-left transition hover:bg-neutral-50",
                  "flex items-center gap-3",
                  FOCUS_RING,
                  workspaceOpen ? "shadow-sm" : "shadow-none"
                )}
              >
                <WorkspaceLogo ws={selectedWorkspace} />

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold leading-[20px] text-[#1a1a1a]">
                    {selectedWorkspace.name}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-[#1a1a1a]">
                      {planLabel}
                    </span>
                    {planId && (
                      <span className="truncate text-[11px] text-neutral-500">Current plan</span>
                    )}
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
                    className="absolute left-1/2 top-full z-[60] mt-2 w-[calc(100%+26px)] -translate-x-1/2"
                  >
                    <m.div
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1.02, opacity: 1 }}
                      exit={{ scale: 0.98, opacity: 0 }}
                      transition={motionTransitions.content}
                      className="w-full rounded-s border border-[#E6E6E6] bg-white p-3 shadow-lg"
                    >
                      <div className="flex flex-col gap-2.5">
                        {workspaces.map((workspace) => {
                          const isSelected = workspace.key === selectedWorkspace.key;

                          return (
                            <button
                              key={workspace.key}
                              type="button"
                              onClick={() => {
                                setWorkspaceKey(workspace.key);
                                setWorkspaceOpen(false);
                              }}
                              className={cn(
                                "flex h-14 w-full cursor-pointer items-center gap-3 rounded-s border border-[#E6E6E6] bg-white px-4 text-left transition hover:bg-neutral-50",
                                FOCUS_RING,
                                isSelected ? "ring-1 ring-[#1a1a1a]/30" : ""
                              )}
                            >
                              <WorkspaceLogo ws={workspace} />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[14px] font-semibold leading-[20px] text-[#1a1a1a]">
                                  {workspace.name}
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

      <div className={cn("mt-6 flex min-h-0 flex-1 flex-col", tight ? "mt-4" : "")}>
        <div
          className={cn(
            "min-h-0 flex-1",
            railMode
              ? "flex flex-col items-center overflow-y-auto px-1"
              : "overflow-y-auto pr-1"
          )}
        >
          <AnimatePresence initial={false}>
            {!compactUI && (
              <m.div
                key="dash-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={motionTransitions.content}
                className="mb-4 w-full text-[16px] font-semibold text-neutral-600"
              >
                Dashboard
              </m.div>
            )}
          </AnimatePresence>

          <div className={cn("flex flex-col", railMode ? "gap-3" : "w-full gap-2")}>
            {dashboardItems
              .filter((item) => item.key !== "wallet")
              .map((item) => {
                if (item.key !== "campaigns") return renderItem(item);

                const caret = (
                  <m.span
                    className="inline-flex items-center"
                    animate={{ rotate: campaignOpen ? 180 : 0 }}
                    transition={motionTransitions.content}
                  >
                    <CaretDown size={18} className="text-current opacity-70" />
                  </m.span>
                );

                if (isDesktop && (collapsed || isClosing)) {
                  return renderItem(item);
                }

                return (
                  <div
                    key={item.key}
                    className="w-full"
                    onMouseEnter={handleCampaignMouseEnter}
                    onMouseLeave={handleCampaignMouseLeave}
                  >
                    <RowButton
                      icon={item.icon}
                      label={item.label}
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
                          className="origin-top overflow-hidden"
                        >
                          <div className="rounded-lg bg-white pt-1">
                            {(item.children ?? []).map((child) => {
                              const isSubActive = active === child.key;

                              return (
                                <button
                                  key={child.key}
                                  type="button"
                                  onClick={() => handleSetActive(child.key)}
                                  className={cn(
                                    "my-1 w-full cursor-pointer rounded-lg px-6 py-2 text-left transition",
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

          <div className={cn("flex flex-col", isDesktop && collapsed ? "gap-3" : "w-full gap-2")}>
            {dashboardItems.filter((item) => item.key === "wallet").map((item) => renderItem(item))}
          </div>

          <div
            className={cn(
              "my-5 h-px w-full bg-neutral-200",
              isDesktop && collapsed ? "opacity-70" : "",
              tight ? "my-4" : ""
            )}
          />

          <AnimatePresence initial={false}>
            {!compactUI && (
              <m.div
                key="manage-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={motionTransitions.content}
                className="mb-4 w-full text-[16px] font-semibold text-neutral-600"
              >
                Manage
              </m.div>
            )}
          </AnimatePresence>

          <div className={cn("flex flex-col", isDesktop && collapsed ? "gap-3" : "w-full gap-2")}>
            {manageItems.map((item) => renderItem(item))}
          </div>
        </div>
      </div>

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
                title={isPaidPlan ? `Current: ${planLabel}` : "Upgrade Plan"}
                onClick={handlePlanClick}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={upgradeSpring}
                className={cn(
                  "relative grid place-items-center overflow-hidden",
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
                {isPaidPlan && (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#1a1a1a]" />
                )}
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
              <m.div
                initial="rest"
                animate="rest"
                whileHover="hover"
                transition={upgradeSpring}
                className={cn(
                  "relative flex w-full cursor-pointer flex-col items-start gap-2.5 overflow-hidden p-2",
                  FOCUS_RING
                )}
                style={upgradeShellStyle}
                tabIndex={0}
                role="button"
                onClick={handlePlanClick}
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

                <div className="relative z-10 flex w-full flex-col items-start gap-2.5">
                  <div className="flex w-full items-start justify-between gap-3">
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

                    <span className="inline-flex items-center rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[#1a1a1a]">
                      {planLabel}
                    </span>
                  </div>

                  <div className="text-[18px] font-semibold leading-[24px] text-[#1a1a1a]">
                    {upgradeCardTitle}
                  </div>

                  <div className="font-[Inter] text-[14px] font-normal leading-[18px] text-[#1a1a1a]">
                    {upgradeCardDesc}
                  </div>
                </div>
              </m.div>

              <div className={cn("my-5 h-px w-full bg-neutral-200", tight ? "my-4" : "")} />

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
                    "grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl text-[#1a1a1a] transition hover:bg-[#EDEDED]",
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

  const DesktopAside = (
    <m.aside
      data-cg-sidebar
      id="cg-sidebar"
      className="inline-flex h-dvh flex-col select-none border border-neutral-200 bg-white"
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
            className="fixed bottom-0 left-0 top-0 z-[100] border-r border-neutral-200 bg-white select-none"
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