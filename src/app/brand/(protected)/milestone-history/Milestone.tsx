"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { post } from '@/lib/api';

// Types for milestone entries
interface MilestoneEntry {
  milestoneHistoryId: string;
  influencerId: string;
  campaignId: string;
  milestoneTitle: string;
  amount: number;
  milestoneDescription?: string;
  dueDate?: string; // ISO date string for timeline
}

const MilestoneHistoryPage: React.FC = () => {
  const searchParams = useSearchParams();
  const influencerId = searchParams.get('infId');
  const campaignId = searchParams.get('campId');

  const [brandId, setBrandId] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<MilestoneEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('brandId');
    if (stored) setBrandId(stored);
  }, []);

  const fetchMilestones = async () => {
    if (!brandId) return;
    setLoading(true);
    setError(null);

    let endpoint = '/milestone/byBrand';
    const body: Record<string, any> = { brandId };
    if (influencerId || campaignId) {
      endpoint = '/milestone/list';
      if (influencerId) body.influencerId = influencerId;
      if (campaignId) body.campaignId = campaignId;
    }

    try {
      const data = await post<{ milestones: MilestoneEntry[] }>(endpoint, body);
      setMilestones(data.milestones || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [brandId, influencerId, campaignId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <section className="max-w-4xl mx-auto my-8 px-4 bg-white">
      <h2 className="text-2xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
        Milestone Timeline
      </h2>

      {!brandId ? (
        <p className="text-red-600">No <code>brandId</code> found in localStorage.</p>
      ) : loading ? (
        <p className="text-center text-gray-500 animate-pulse">Loading milestones...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : milestones.length === 0 ? (
        <p className="text-gray-500">No milestones found.</p>
      ) : (
        <ol className="relative border-l-2 border-orange-300">
          {milestones.map((m) => (
            <li key={m.milestoneHistoryId} className="mb-8 ml-6">
              <span className="absolute flex items-center justify-center w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-full -left-4 ring-2 ring-orange-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L9 13.414l4.707-4.707z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">{m.milestoneTitle}</h3>
                <span className="text-lg font-semibold text-gray-900">
                  ${m.amount.toFixed(2)}
                </span>
              </div>
              <time className="block mb-2 text-sm font-normal leading-none text-gray-500">
                {formatDate(m.dueDate)}
              </time>
              <p className="text-gray-600 mb-2 truncate">{m.milestoneDescription || '–'}</p>
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white">
                Paid
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default MilestoneHistoryPage;