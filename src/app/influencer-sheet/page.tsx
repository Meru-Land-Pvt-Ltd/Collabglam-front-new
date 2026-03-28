import { Suspense } from "react";
import InfluencerSheetClient from "./InfluencerSheetClient";

type PageProps = {
  searchParams: Promise<{ campaignId?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { campaignId = "" } = await searchParams;

  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <InfluencerSheetClient campaignId={campaignId} />
    </Suspense>
  );
}