"use client";

import React, { Suspense, lazy } from "react";
import ViewBrandPage from "./viewBrand";

export default function ViewBrand() {

  return (
    <div>
      <Suspense fallback={<div>Loading Brands</div>}>
        <ViewBrandPage/>
      </Suspense>
    </div>
  );
}
