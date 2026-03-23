"use client";

import React, { Suspense, lazy } from "react";
import CampaignFormPage from "./AddEdit";

export default function CreateCampaign() {
    return (
    <div>
      <Suspense fallback={<div>Loading Campaign</div>}>
        <CampaignFormPage/>
      </Suspense>
    </div>
  );
}