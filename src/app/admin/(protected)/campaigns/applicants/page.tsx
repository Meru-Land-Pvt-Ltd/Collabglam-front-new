"use client";

import React, { Suspense, lazy } from "react";
import AppliedInfluencersPage from "./view-applicant";

export default function viewInfluencers() {

  return (
    <div>
      <Suspense fallback={<div>Loading Applicants</div>}>
      <AppliedInfluencersPage />
      </Suspense>
    </div>
  );
}