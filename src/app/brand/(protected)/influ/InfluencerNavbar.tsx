"use client";

import { Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TabKey = "all influencer" | "active" | "shortlisted" | "undecided" | "rejected";

export default function CampaignNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ get campaignId from query (supports ?campaignId= or ?id=)
  const campaignId = (searchParams.get("campaignId") || searchParams.get("id") || "").trim();

  // ✅ helper to keep campaignId in every navigation
  const withCampaignId = (href: string) => {
    if (!campaignId) return href;
    const join = href.includes("?") ? "&" : "?";
    return `${href}${join}campaignId=${encodeURIComponent(campaignId)}`;
  };

  const tabs: { key: TabKey; label: string; href: string }[] = [
    { key: "all influencer", label: "All Influencer", href: "/brand/influ/all" },
    { key: "active", label: "Active", href: "/brand/influ/active" },
    { key: "shortlisted", label: "Shortlisted", href: "/brand/influ/shortlisted" },
    { key: "undecided", label: "Undecided", href: "/brand/influ/undecided" },
    { key: "rejected", label: "Rejected", href: "/brand/influ/rejected" },
  ];

  const counts: Record<TabKey, number> = {
    "all influencer": 0,
    active: 0,
    shortlisted: 0,
    undecided: 0,
    rejected: 0,
  };

  const isActiveHref = (href: string) =>
    pathname === href || (pathname?.startsWith(href) ?? false);

  return (
    <header className="flex w-full items-center justify-between border-b border-neutral-200 bg-background px-4 md:px-6">
      <nav
        className="scrollbar-none flex min-w-0 flex-1 items-center gap-xs overflow-x-auto whitespace-nowrap"
        aria-label="Influencer filters"
      >
        {tabs.map((t) => {
          const isActive = isActiveHref(t.href);

          return (
            <Link
              key={t.key}
              href={withCampaignId(t.href)} // ✅ keep campaignId
              aria-current={isActive ? "page" : undefined}
              className={[
                "inline-flex shrink-0 items-center justify-center",
                "h-12 md:h-14",
                "px-3 sm:px-4",
                "border-0 border-b-2",
                "text-xs sm:text-sm md:text-base",
                "transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-900/35 focus-visible:outline-offset-2",
                isActive
                  ? "border-neutral-900 text-neutral-900 font-semibold"
                  : "border-transparent text-neutral-600 font-medium hover:text-neutral-900 hover:border-neutral-300",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-[var(--Spacing-8,0.5rem)]">
                <span>{t.label}</span>

                <span
                  className={[
                    "inline-flex items-center justify-center",
                    "w-6 h-6",
                    "shrink-0",
                    "rounded-[1.25rem]",
                    "border border-[var(--Light-Border-Subtle,#E6E6E6)]",
                    "font-[Inter]",
                    "text-[0.75rem]",
                    "font-semibold",
                    "leading-none",
                    isActive ? "text-neutral-900" : "text-neutral-600",
                  ].join(" ")}
                >
                  {counts[t.key] ?? 0}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="ml-3 flex shrink-0 items-center">
        <button
          type="button"
          onClick={() => router.push(withCampaignId("/brand/influencer/invite"))} // ✅ keep campaignId
          className={[
            "inline-flex items-center justify-center",
            "h-9 md:h-10",
            "gap-xs",
            "rounded-s border border-neutral-200 bg-white",
            "px-3 md:px-4",
            "text-xs sm:text-sm md:text-sm",
            "font-medium text-neutral-900",
            "shadow-none",
            "transition-colors",
            "hover:bg-neutral-50",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-900/35 focus-visible:outline-offset-2",
            "whitespace-nowrap",
          ].join(" ")}
        >
          <Plus className="shrink-0" />
          <span className="hidden sm:inline">Invite</span>
          <span className="sm:hidden">Invite</span>
        </button>
      </div>
    </header>
  );
}