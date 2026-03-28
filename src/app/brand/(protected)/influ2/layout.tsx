"use client";

import { Suspense } from "react";
import InfluencerNavbar from "./InfluencerNavbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background">
      {/* ✅ Navbar inside Suspense (like your example) */}
      <Suspense fallback={null}>
        <InfluencerNavbar />
      </Suspense>

      {/* ✅ Children also inside Suspense (needed because pages use useSearchParams) */}
      <main className="w-full">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}