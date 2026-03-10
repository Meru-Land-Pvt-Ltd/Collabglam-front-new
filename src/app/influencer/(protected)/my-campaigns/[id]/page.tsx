"use client"
import React from 'react'
import { Suspense } from "react";
import { useParams, useSearchParams } from 'next/navigation';
import CampaignDetails from '@/components/ui/influencer/campaignDetails';
const MyCampaignsDetailsPage = () => {
    const {id} = useParams()
    return (
        <Suspense fallback={<div>Loading campaign details...</div>}>
            <CampaignDetails id={id} />
        </Suspense>
    )
}

export default MyCampaignsDetailsPage