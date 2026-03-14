"use client";

import { Suspense } from "react";
import DeliverablesPage from "./Deliverable";

export default function ViewDeliverable() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <DeliverablesPage />
    </Suspense>
  );
}
