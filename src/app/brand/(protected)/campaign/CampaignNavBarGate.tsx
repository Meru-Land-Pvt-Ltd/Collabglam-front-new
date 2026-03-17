"use client";

import React, { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import CampaignNavBar from "./CampaignNavbar";

const CAMPAIGN_LIST_PAGES = new Set([
  "all",
  "active",
  "draft",
  "scheduled",          // ✅ make sure this matches your real route slug
  // "scheduled-campaign" // only keep if your folder slug is actually this
]);

export default function CampaignNavBarGate() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hideNavbar = useMemo(() => {
    const p = (pathname ?? "").replace(/\/+$/, "");
    const m = p.match(/^\/brand\/campaign\/([^/]+)$/);
    if (!m) return false;

    const slug = m[1];

    // don’t hide on known list pages
    if (CAMPAIGN_LIST_PAGES.has(slug)) return false;

    return Boolean(searchParams?.get("id"));
  }, [pathname, searchParams]);

  if (hideNavbar) return null;
  return <CampaignNavBar />;
}
