"use client";

import { Suspense } from "react";
import CampaignDetails from "@/components/ui/influencer/campaignDetails";

const CampaignDetailsPage = () => {
  return (
    <Suspense fallback={<div>Loading campaign details...</div>}>
      <CampaignDetails />
    </Suspense>
  );
};

export default CampaignDetailsPage;