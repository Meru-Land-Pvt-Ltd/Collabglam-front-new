"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  ChatCenteredText,
  DotsThree,
  EnvelopeSimpleIcon,
  Gear,
  HandshakeIcon,
  ImageIcon,
  Lightning,
  Money,
  PackageIcon,
  PaperPlaneTilt,
  Question,
  RocketLaunchIcon,
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

export type InfluencerSidebarProps = {
  /** controlled drawer state from page/shell */
  drawerOpen?: boolean;
  setDrawerOpen?: (open: boolean) => void;

  /** optional badges */
  campaignBadge?: React.ReactNode;
  appliedBadge?: React.ReactNode;
  messagesBadge?: React.ReactNode;
};

/* ------------------------------ constants (upgrade card) ------------------------------ */

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

/* ------------------------------ small components ------------------------------ */

function PanelCaretGlyph({ dir }: { dir: "left" | "right" }) {
  const dx = -1.1;

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
          transform={`translate(${-1.1} 0)`}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M10.75 5.5L7.25 9L10.75 12.5"
          transform={`translate(${-1.1} 0)`}
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
          hideLabel ? "opacity-0 w-0 overflow-hidden pointer-events-none" : "opacity-100"
        )}
        style={{ transition: "opacity 180ms ease, width 180ms ease" }}
      >
        {label}
      </span>

      {right ? (
        <span
          className={cn(
            "ml-auto inline-flex items-center whitespace-nowrap text-current",
            hideLabel ? "opacity-0 w-0 overflow-hidden pointer-events-none" : "opacity-100"
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

/* -------------------------------- sidebar -------------------------------- */

export default function Sidebar({
  drawerOpen: drawerOpenProp,
  setDrawerOpen: setDrawerOpenProp,
  campaignBadge,
  appliedBadge,
  messagesBadge,
}: InfluencerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // breakpoints
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const isShort = useMediaQuery("(max-height: 800px)");
  const vw = useViewportWidth();

  // ✅ ACTIVE derives from URL (no default "campaign")
  const [active, setActive] = useState<string>("");

  // nav collapse state
  const [collapsed, setCollapsed] = useState(true);
  const [widthCollapsed, setWidthCollapsed] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // drawer state (controlled OR internal fallback)
  const [drawerOpenInternal, setDrawerOpenInternal] = useState(false);
  const drawerOpen = drawerOpenProp ?? drawerOpenInternal;

  const setDrawerOpen = useCallback(
    (open: boolean) => {
      if (setDrawerOpenProp) setDrawerOpenProp(open);
      else setDrawerOpenInternal(open);
    },
    [setDrawerOpenProp]
  );

  // ✅ active from URL (includes /influencer/dashboard)
  useEffect(() => {
    const p = pathname || "";

    if (p.startsWith("/influencer/dashboard") || p === "/influencer") {
      setActive("dashboard");
    } else if (p.startsWith("/influencer/messages")) {
      setActive("messages");
    } else if (p.startsWith("/influencer/earnings")) {
      setActive("earnings");
    } else if (p.startsWith("/influencer/applied")) {
      setActive("applied");
    } else if (p.startsWith("/influencer/settings")) {
      setActive("settings");
    } else if (p.startsWith("/influencer/support")) {
      setActive("support");
    } else if (
      p.startsWith("/influencer/campaign") ||
      p.startsWith("/influencer/campaigns")
    ) {
      setActive("campaign");
    } else {
      setActive("dashboard");
    }
  }, [pathname]);

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

  // ✅ IMPORTANT: collapse footer immediately when closing/width collapsing
  const showCollapsedFooter = isDesktop && (collapsed || isClosing || widthCollapsed);

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

  // ✅ add Dashboard item
  const items = useMemo<Item[]>(
    () => [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: CardsThree,
        section: "main",
        href: "/influencer/dashboard",
      },
      // {
      //   key: "campaign",
      //   label: "Campaigns",
      //   icon: CardsThree,
      //   section: "main",
      //   href: "/influencer/campaign",
      //   right: campaignBadge != null ? <Badge>{campaignBadge}</Badge> : undefined,
      // },
      {
        key: "discover-campaigns",
        label: "Discover Campaigns",
        icon: Megaphone,
        section: "main",
        href: "/influencer/discover-campaigns",
        right: campaignBadge != null ? <Badge>{campaignBadge}</Badge> : undefined,
      },
      {
        key: "invitations",
        label: "Invitations",
        icon: EnvelopeSimpleIcon,
        section: "main",
        href: "/influencer/invitations",
        right: campaignBadge != null ? <Badge>{campaignBadge}</Badge> : undefined,
      },
      {
        key: "my-campaigns",
        label: "My Campaigns",
        icon: SuitcaseIcon,
        section: "main",
        href: "/influencer/my-campaigns",
        right: campaignBadge != null ? <Badge>{campaignBadge}</Badge> : undefined,
      },
      // {
      //   key: "deliverables",
      //   label: "Deliverables",
      //   icon: PackageIcon,
      //   section: "main",
      //   href: "/influencer/deliverables",
      //   right: campaignBadge != null ? <Badge>{campaignBadge}</Badge> : undefined,
      // },
      // {
      //   key: "contracts",
      //   label: "Contracts",
      //   icon: HandshakeIcon,
      //   section: "main",
      //   href: "/influencer/contracts",
      //   right: appliedBadge != null ? <Badge>{appliedBadge}</Badge> : undefined,
      // },
      {
        key: "earnings",
        label: "Earnings",
        icon: Money,
        section: "main",
        href: "/influencer/earnings",
      },
      {
        key: "messages",
        label: "Inbox/Messages",
        icon: ChatCenteredText,
        section: "main",
        href: "/influencer/messages",
        right: messagesBadge != null ? <Badge>{messagesBadge}</Badge> : undefined,
      },
      {
        key: "wallet-payments",
        label: "Wallet & Payments",
        icon: WalletIcon,
        section: "main",
        href: "/influencer/wallet-payments",
        right: messagesBadge != null ? <Badge>{messagesBadge}</Badge> : undefined,
      },
       {
        key: "media-kit",
        label: "Media Kit",
        icon: ImageIcon,
        section: "main",
        href: "/influencer/media-kit",
        right: messagesBadge != null ? <Badge>{messagesBadge}</Badge> : undefined,
      },
      {
        key: "profile",
        label: "Profile & Rate card",
        icon: UserIcon,
        section: "main",
        href: "/influencer/profile",
        right: messagesBadge != null ? <Badge>{messagesBadge}</Badge> : undefined,
      },
      {
        key: "boost-profile",
        label: "Boost Profile",
        icon: RocketLaunchIcon,
        section: "main",
        href: "/influencer/boost-profile",
        right: messagesBadge != null ? <Badge>{messagesBadge}</Badge> : undefined,
      },
      {
        key: "settings",
        label: "Settings",
        icon: Gear,
        section: "footer",
        href: "/influencer/settings",
      },
      {
        key: "support",
        label: "Support",
        icon: Question,
        section: "footer",
        href: "/influencer/support-center",
      },
    ],
    [campaignBadge, appliedBadge, messagesBadge]
  );

  const mainItems = useMemo(() => items.filter((i) => i.section === "main"), [items]);
  const footerItems = useMemo(() => items.filter((i) => i.section === "footer"), [items]);

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
    // snap header/footer to rail layout immediately
    setIsClosing(true);
    setWidthCollapsed(true);
  }, []);

  // widths
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

  const SidebarBody = (
    <div className="flex h-full flex-col">
      {/* TOP */}
      <div className={cn("flex flex-col", tight ? "gap-3" : "gap-4")}>
        <div
          className={cn(
            "flex w-full items-center",
            // ✅ snap layout immediately during close too
            isDesktop && (collapsed || isClosing) ? "flex-col gap-3" : "gap-3"
          )}
        >
          {/* Logo */}
          <button
            type="button"
            onClick={() => {
              if (isDesktop) {
                if (collapsed || isClosing) beginOpenDesktop();
                else router.push("/influencer/dashboard"); // ✅ optional: clicking logo goes to dashboard
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
                  Influencer Portal
                </div>
              </m.div>
            )}
          </AnimatePresence>

          {/* Collapse (desktop) / Close (mobile) */}
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
                // ✅ don't keep ml-auto while closing
                collapsed || isClosing ? "" : "ml-auto"
              )}
            >
              {collapsed ? <PanelCaretGlyph dir="right" /> : <PanelCaretGlyph dir="left" />}
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

      {/* NAV */}
      <div className={cn("mt-6 flex min-h-0 flex-1 flex-col", tight ? "mt-4" : "")}>
        <div
          className={cn(
            "min-h-0 flex-1 pr-1",
            isDesktop && collapsed ? "flex flex-col items-center overflow-y-auto" : "overflow-y-auto"
          )}
        >
          <AnimatePresence initial={false}>
            {!compactUI && (
              <m.div
                key="main-title"
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

          <AnimatePresence initial={false}>
            {!compactUI && (
              <m.div
                key="footer-title"
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

          <div className={cn("flex flex-col", isDesktop && collapsed ? "gap-3" : "gap-2 w-full")}>
            {footerItems.map((i) => renderItem(i))}
          </div>
        </div>
      </div>

       {/* FOOTER  */}
       {/* <div className={cn("mt-auto pt-6", tight ? "pt-4" : "")}>
        <AnimatePresence initial={false} mode="wait">
          {showCollapsedFooter ? (
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
                  borderRadius: "8px",
                  background: UPGRADE_COLLAPSED,
                }}
                aria-label="Boost Profile"
              >
                <Lightning size={24} className="text-[#1a1a1a]" />
              </m.button>

              <div className={cn("my-5 h-px w-full bg-neutral-200", tight ? "my-4" : "")} />

              <div className="h-10 w-10 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                <img
                  alt="Influencer"
                  src="https://i.pravatar.cc/120?img=64"
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
            >
              
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
                aria-label="Boost Profile"
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
                    Boost Profile
                  </div>

                  <div className="text-[#1a1a1a] font-[Inter] text-[14px] font-normal leading-[18px]">
                    Get more campaign invites. No long-term commitment
                  </div>
                </div>
              </m.div>

              <div className={cn("my-5 h-px w-full bg-neutral-200", tight ? "my-4" : "")} />

             
              <div className="flex w-full items-center gap-3 bg-white p-3">
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                  <img
                    alt="Influencer"
                    src="https://i.pravatar.cc/120?img=64"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] font-semibold text-[#1a1a1a]">
                    Influencer
                  </div>
                  <div className="truncate text-[12px] text-neutral-500">Creator</div>
                </div>

                <button
                  type="button"
                  className={cn(
                    "flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl text-[#1a1a1a] transition hover:bg-[#EDEDED]",
                    FOCUS_RING
                  )}
                  aria-label="More"
                >
                  <DotsThree size={24} />
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>  */}
    </div>
  );

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
