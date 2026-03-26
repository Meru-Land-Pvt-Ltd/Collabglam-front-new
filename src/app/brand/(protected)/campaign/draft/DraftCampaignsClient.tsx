"use client";

import { useSearchParams } from "next/navigation";
import CampaignListPage from "../CampaignListPage";

export default function DraftCampaignsClient() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";

  return <CampaignListPage title="Draft Campaigns" fixedStatus="draft" />;
}
