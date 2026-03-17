"use client";

import { Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type TabKey = "all" | "active" | "draft" | "scheduled";

export default function CampaignNavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs: { key: TabKey; label: string; href: string }[] = [
    { key: "all", label: "All", href: "/brand/campaign/all" },
    { key: "active", label: "Active", href: "/brand/campaign/active" },
    { key: "draft", label: "Draft", href: "/brand/campaign/draft" },
    {
      key: "scheduled",
      label: "Schedule Campaign",
      href: "/brand/campaign/scheduled-campaign",
    },
  ];

  const isActiveHref = (href: string) =>
    pathname === href || (pathname?.startsWith(href) ?? false);

  return (
    <header className="flex w-full flex-col gap-s border-b border-neutral-200 bg-background px-4 md:flex-row md:items-center md:justify-between md:px-6">
      <nav
        className="scrollbar-none flex w-full items-center gap-xs overflow-x-auto whitespace-nowrap md:w-auto md:flex-1 md:flex-wrap md:overflow-visible"
        aria-label="Campaign filters"
      >
        {tabs.map((t) => {
          const isActive = isActiveHref(t.href);

          return (
            <Link
              key={t.key}
              href={t.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "inline-flex shrink-0 items-center justify-center",
                "h-12 md:h-14",
                t.key === "scheduled" ? "px-5" : "px-4",

                "border-0 border-b-2",

                "text-sm md:text-base",
                "transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-900/35 focus-visible:outline-offset-2",
                isActive
                  ? "border-neutral-900 text-neutral-900 font-semibold"
                  : "border-transparent text-neutral-600 font-medium hover:text-neutral-900 hover:border-neutral-300",
              ].join(" ")}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex w-full items-center justify-end md:w-auto">
        <button
          type="button"
          onClick={() => router.push("/brand/create-campaign")}
          className={[
            "inline-flex items-center justify-center",
            "h-9 md:h-10",
            "gap-xs",
            "rounded-s border border-neutral-200 bg-white",
            "px-3 md:px-4",
            "text-sm font-medium text-neutral-900",
            "shadow-none", // ✅ ensure no 3D
            "transition-colors",
            "hover:bg-neutral-50", // ✅ flat hover (no border change)
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-900/35 focus-visible:outline-offset-2",
            "whitespace-nowrap",
          ].join(" ")}
        >
          <Plus />

          <span className="hidden sm:inline">New Campaign</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
    </header>
  );
}
