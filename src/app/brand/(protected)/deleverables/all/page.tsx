"use client";

import { Suspense } from "react";
import ViewDeleverable from "./AllDeleverable";

export default function ViewDeliverablePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <ViewDeleverable />
    </Suspense>
  );
}
