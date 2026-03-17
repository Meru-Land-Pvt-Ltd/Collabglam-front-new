"use client";

import { useSearchParams } from "next/navigation";
import CampaignListPage from "../CampaignListPage";

export default function ScheduledCampaignsClient() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";

  return <CampaignListPage title="Scheduled Campaigns" fixedStatus="scheduled" />;
}
