'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import InfluencerDetailFullPage from '../InfluencerDetailFullPage';
import { useInfluencerReport } from '@/app/brand/(protected)/browse-influencer/useInfluencerReport';
import { useEmailStatus } from '@/app/brand/(protected)/browse-influencer/useEmailStatus';
import type { Platform } from '@/app/brand/(protected)/browse-influencer/types';

export default function InfluencerDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  // userId comes from /mediakit/[id]
  const userId = params?.id ? decodeURIComponent(String(params.id)) : '';

  const qpPlatform = (searchParams?.get('platform') || '').toLowerCase() as Platform;
  const platform: Platform =
    ['youtube', 'instagram', 'tiktok'].includes(qpPlatform) ? qpPlatform : 'youtube';

  const handleParam = searchParams?.get('handle') || '';
  const handle = handleParam ? String(handleParam) : null;

  const [brandId, setBrandId] = useState('');
  const [adminId, setAdminId] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [authRole, setAuthRole] = useState<'brand' | 'admin' | ''>('');

  // Allow public mediakit view.
  // If brandId/adminId exists, use it.
  // If not, continue without auth and send np=1 while fetching report.
  useEffect(() => {
    const storedBrandId = (localStorage.getItem('brandId') || '').trim();
    const storedAdminId = (localStorage.getItem('adminId') || '').trim();

    if (storedBrandId) {
      setBrandId(storedBrandId);
      setAdminId('');
      setAuthRole('brand');
    } else if (storedAdminId) {
      setBrandId('');
      setAdminId(storedAdminId);
      setAuthRole('admin');
    } else {
      setBrandId('');
      setAdminId('');
      setAuthRole('');
    }

    setAuthChecked(true);
  }, []);

  const [calculationMethod, setCalculationMethod] = useState<'median' | 'average'>('average');

  const { report, rawReport, loading, error, lastFetchedAt, fetchReport } = useInfluencerReport();
  const { exists: emailExists, checkStatus } = useEmailStatus();

  const shouldSendNp = !brandId && !adminId;

  // load report
  useEffect(() => {
    if (!authChecked) return;
    if (!userId) return;

    fetchReport(userId, platform, calculationMethod, {
      brandId: brandId || undefined,
      adminId: adminId || undefined,
      role: authRole === 'admin' ? 'admin' : authRole === 'brand' ? 'brand' : undefined,
      np: shouldSendNp ? '1' : undefined,
    });

    if (handle) {
      const safeHandle = handle.startsWith('@') ? handle : `@${handle}`;
      checkStatus(safeHandle, platform);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authChecked,
    userId,
    platform,
    calculationMethod,
    handle,
    brandId,
    adminId,
    authRole,
    shouldSendNp,
  ]);

  // refresh report
  const onRefreshReport = useCallback(async () => {
    if (!userId) return;

    await fetchReport(userId, platform, calculationMethod, {
      brandId: brandId || undefined,
      adminId: adminId || undefined,
      role: authRole === 'admin' ? 'admin' : authRole === 'brand' ? 'brand' : undefined,
      forceRefresh: true,
      np: shouldSendNp ? '1' : undefined,
    });
  }, [userId, platform, calculationMethod, fetchReport, brandId, adminId, authRole, shouldSendNp]);

  if (!authChecked) return null;
  if (!userId) return null;

  return (
    <InfluencerDetailFullPage
      loading={loading}
      error={error}
      data={report}
      raw={rawReport}
      platform={platform}
      onChangeCalc={(calc) => setCalculationMethod(calc)}
      emailExists={emailExists}
      handle={handle}
      lastFetchedAt={lastFetchedAt}
      onRefreshReport={onRefreshReport}
      viewerRole={authRole}
    />
  );
}