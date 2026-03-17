"use client";

import { useSearchParams } from "next/navigation";
import CampaignListPage from "../CampaignListPage";

export default function ActiveCampaignsClient() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";

  return <CampaignListPage title="Active Campaigns" fixedStatus="active" />;
}
