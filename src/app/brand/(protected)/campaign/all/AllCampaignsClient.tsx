"use client";

import { useSearchParams } from "next/navigation";
import CampaignListPage from "../CampaignListPage";

export default function AllCampaignsClient() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";

  return <CampaignListPage title="All Campaigns" />;
}
