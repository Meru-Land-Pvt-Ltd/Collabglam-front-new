"use client";

import { Suspense } from "react";
import ViewDeleverablePage from "./viewDeleverable";

export default function ViewDeliverable() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <ViewDeleverablePage />
    </Suspense>
  );
}
