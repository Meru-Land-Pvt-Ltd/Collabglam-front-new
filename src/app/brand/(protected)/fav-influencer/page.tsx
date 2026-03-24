"use client";

import React, { Suspense, lazy } from "react";
import FavoriteInfluencersPage from "./FavInfluencer";

export default function CreateCampaign() {
    return (
    <div>
      <Suspense fallback={<div>Loading Influencer</div>}>
        <FavoriteInfluencersPage/>
      </Suspense>
    </div>
  );
}