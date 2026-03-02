import { Suspense } from "react";
import InfluencerOnboardingClient from "./InfluencerOnboardingClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <InfluencerOnboardingClient />
    </Suspense>

  );
}
