'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderKanban, RefreshCw } from 'lucide-react';
import swal from 'sweetalert';
import { get } from '@/lib/api';

type CampaignItem = {
  _id: string;
  name: string;
  brandName?: string;
  createdAt?: string;
};

function showErr(message: string) {
  return swal({
    title: 'Error',
    text: message || 'Something went wrong.',
    icon: 'error',
  });
}

export default function CampaignsPage() {
  const [items, setItems] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCampaigns() {
    setLoading(true);
    try {
      // change endpoint if your actual campaign list route is different
      const resp = await get<CampaignItem[]>('/campaign/getlist');
      setItems(Array.isArray(resp) ? resp : []);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Campaigns</h1>
            <p className="mt-2 text-sm text-slate-600">
              Click any campaign to open Outreach, Roster, and Pitch pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCampaigns}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">
            <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin" />
            Loading campaigns...
          </div>
        ) : !items.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">
            No campaigns found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((campaign) => (
              <Link
                key={campaign._id}
                href={`/campaigns/${campaign._id}/pipeline?name=${encodeURIComponent(campaign.name || '')}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <FolderKanban className="h-6 w-6" />
                </div>

                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700">
                  {campaign.name || 'Untitled Campaign'}
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  {campaign.brandName ? `Brand: ${campaign.brandName}` : 'Open campaign pipeline'}
                </p>

                <div className="mt-4 text-sm font-medium text-blue-600">
                  Open Pipeline →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}