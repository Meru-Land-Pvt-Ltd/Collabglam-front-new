// app/brand/(protected)/campaign/draft/page.tsx (SERVER)
import { Suspense } from "react";
import DraftCampaignsClient from "./DraftCampaignsClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <DraftCampaignsClient />
    </Suspense>
  );
}
