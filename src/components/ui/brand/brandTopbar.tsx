"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import type { TopbarAction } from "./brandTopbarProvider";
import { CaretRightIcon, ListDashes } from "@phosphor-icons/react";

/* -------- tiny util (keeps this file standalone) -------- */
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

const LABELS: Record<string, string> = {
  brand: "Brand",
  overview: "Overview",
  hub: "Influencer Hub",
  campaigns: "Campaigns",
  inbox: "Inbox",
  wallet: "Wallet",
  browse: "Browse Influencers",
  "create-camapign": "Create Campaign",
};

function titleize(seg: string) {
  const s = seg.replace(/[-_]/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function getCrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  let href = "";
  return segments.map((seg) => {
    href += `/${seg}`;

    const decoded = safeDecodeURIComponent(seg);

    return { href, label: LABELS[seg] ?? LABELS[decoded] ?? titleize(decoded) };
  });
}

function safeDecodeURIComponent(v: string) {
  try {
    return decodeURIComponent(v.replace(/\+/g, " "));
  } catch {
    return v;
  }
}

function getDefaultActions(pathname: string): TopbarAction[] {
  if (pathname.startsWith("/brand/campaigns")) {
    return [
      {
        key: "create",
        label: "Create Campaign",
        href: "/brand/create-camapign",
        variant: "primary",
      },
    ];
  }
  return [];
}

function ActionButton({ action }: { action: TopbarAction }) {
  if ("static" in action) {
    return (
      <div
        className={[
          "inline-flex items-center gap-2",
          "text-[13px] sm:text-[14px] font-semibold text-[#1A1A1A]",
          action.disabled ? "opacity-50" : "",
          action.className ?? "",
        ].join(" ")}
        aria-disabled={action.disabled}
      >
        {action.icon ? <span className="shrink-0">{action.icon}</span> : null}
        {action.label ? <span className="whitespace-nowrap">{action.label}</span> : null}
      </div>
    );
  }

  const base =
    "h-9 sm:h-10 px-3 sm:px-4 rounded-lg text-[13px] sm:text-[14px] font-semibold transition inline-flex items-center gap-2 " +
    "whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";

  const secondary = "bg-transparent text-[#1A1A1A] hover:bg-[#F5F5F5]";
  const primary = "bg-[#1A1A1A] text-white hover:bg-black";
  const cls = `${base} ${action.variant === "primary" ? primary : secondary} ${action.className ?? ""
    }`;

  const content = (
    <>
      {action.icon ? <span className="shrink-0">{action.icon}</span> : null}
      {action.label ? <span className="whitespace-nowrap">{action.label}</span> : null}
    </>
  );

  if ("href" in action) {
    return (
      <Link className={cls} href={action.href} aria-disabled={action.disabled}>
        {content}
      </Link>
    );
  }

  return (
    <button className={cls} onClick={action.onClick} disabled={action.disabled} type="button">
      {content}
    </button>
  );
}

export default function BrandTopbar({
  actionsOverride,
  onMenuToggle,
}: {
  actionsOverride?: TopbarAction[];
  onMenuToggle?: () => void;
}) {
  const pathname = usePathname();

  // matches sidebar breakpoint (drawer on <1024)
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // narrow helper for breadcrumb truncation
  const isNarrow = useMediaQuery("(max-width: 640px)");

  const showHamburger = !isDesktop && Boolean(onMenuToggle);

  const crumbs = useMemo(() => getCrumbs(pathname), [pathname]);

  const displayCrumbs = useMemo(() => {
    // On narrow: show only last 2 crumbs (prevents overflow)
    if (!isNarrow) return crumbs;
    if (crumbs.length <= 2) return crumbs;
    return crumbs.slice(-2);
  }, [crumbs, isNarrow]);

  const actions = useMemo(() => {
    return actionsOverride && actionsOverride.length > 0
      ? actionsOverride
      : getDefaultActions(pathname);
  }, [actionsOverride, pathname]);

  return (
    <div className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 min-w-0">
        {/* Hamburger (only when sidebar is drawer mode) */}
        {showHamburger ? (
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label="Open menu"
            title="Menu"
            className={[
              "grid h-10 w-10 place-items-center rounded-lg border border-neutral-200 bg-white shadow-sm",
              "hover:bg-neutral-50 transition",
            ].join(" ")}
          >
            <ListDashes size={22} className="text-[#1a1a1a]" />
          </button>
        ) : null}

        {/* If hamburger is showing, hide breadcrumbs and show current page title */}
        {showHamburger ? (
          <div
            className="min-w-0 flex-1 truncate text-[14px] sm:text-[16px] font-semibold text-[#1A1A1A]"
            style={{ fontFamily: "var(--Font-Family-Inter, Inter)" }}
          >
            {crumbs[crumbs.length - 1]?.label ?? ""}
          </div>
        ) : (
          <nav className="flex items-center gap-2 min-w-0 flex-1">
            {isNarrow && crumbs.length > 2 ? (
              <span
                className="text-[#B8B8B8] font-semibold"
                style={{
                  fontFamily: "var(--Font-Family-Inter, Inter)",
                  fontSize: "14px",
                  lineHeight: "20px",
                }}
              >
                …
              </span>
            ) : null}

            {displayCrumbs.map((c, idx) => {
              const last = idx === displayCrumbs.length - 1;

              const commonStyle: React.CSSProperties = {
                fontFamily: "var(--Font-Family-Inter, Inter)",
                fontSize: "14px",
                fontStyle: "normal",
                fontWeight: 600,
                lineHeight: "20px",
                letterSpacing: "0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: isNarrow ? 140 : 220,
                display: "inline-block",
              };

              const selectedStyle: React.CSSProperties = { ...commonStyle, color: "#1A1A1A" };
              const prevStyle: React.CSSProperties = { ...commonStyle, color: "#B8B8B8" };

              return (
                <React.Fragment key={c.href}>
                  <Link href={c.href} style={last ? selectedStyle : prevStyle} className="min-w-0">
                    {c.label}
                  </Link>

                  {!last ? (
                    <span
                      className="shrink-0 text-[#B8B8B8]"
                      style={{
                        fontFamily: "var(--Font-Family-Inter, Inter)",
                        fontSize: "14px",
                        fontWeight: 600,
                        lineHeight: "20px",
                      }}
                    >
                      <CaretRightIcon />
                    </span>
                  ) : null}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        {/* Actions */}
        <div
          className={[
            "ml-auto flex items-center gap-2 sm:gap-6 shrink-0",
            "max-w-[46vw] sm:max-w-none overflow-x-auto",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          ].join(" ")}
        >
          {actions.map((a) => (
            <ActionButton key={a.key} action={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
