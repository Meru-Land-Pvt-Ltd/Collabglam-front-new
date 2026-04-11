'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';

import InfluencerDetailFullPage from '../InfluencerDetailFullPage';
import { useInfluencerReport } from '@/app/brand/(protected)/browse-influencer/useInfluencerReport';
import { useEmailStatus } from '@/app/brand/(protected)/browse-influencer/useEmailStatus';
import type { Platform } from '@/app/brand/(protected)/browse-influencer/types';

export default function InfluencerDetailPage() {
  const router = useRouter();
  const pathname = usePathname();

  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const userId = params?.id ? decodeURIComponent(String(params.id)) : '';

  const qpPlatform = (searchParams?.get('platform') || '').toLowerCase() as Platform;
  const platform: Platform = ['youtube', 'instagram', 'tiktok'].includes(qpPlatform)
    ? qpPlatform
    : 'youtube';

  const handleParam = searchParams?.get('handle') || '';
  const handle = handleParam ? String(handleParam) : null;

  const noProfileCredit =
    searchParams?.get('np') === '1' || searchParams?.get('np') === 'true';

  const [brandId, setBrandId] = useState('');
  const [adminId, setAdminId] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [authRole, setAuthRole] = useState<'brand' | 'admin' | ''>('');

  useEffect(() => {
    const storedBrandId = (localStorage.getItem('brandId') || '').trim();
    const storedAdminId = (localStorage.getItem('adminId') || '').trim();

    // ✅ public/no-credit view
    if (noProfileCredit) {
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
      return;
    }

    // ✅ normal protected flow
    if (!storedBrandId && !storedAdminId) {
      router.replace(`/brand/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (storedBrandId) {
      setBrandId(storedBrandId);
      setAdminId('');
      setAuthRole('brand');
    } else {
      setBrandId('');
      setAdminId(storedAdminId);
      setAuthRole('admin');
    }

    setAuthChecked(true);
  }, [router, pathname, noProfileCredit]);

  const [calculationMethod, setCalculationMethod] = useState<'median' | 'average'>('average');

  const { report, rawReport, loading, error, lastFetchedAt, fetchReport } = useInfluencerReport();
  const { exists: emailExists, checkStatus } = useEmailStatus();

  useEffect(() => {
    if (!authChecked) return;
    if (!userId) return;

    const reportOptions: any = {
      brandId: brandId || undefined,
      adminId: adminId || undefined,
      np: noProfileCredit ? '1' : undefined,
      ...(authRole ? { role: authRole } : {}),
    };

    fetchReport(userId, platform, calculationMethod, reportOptions);

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
    noProfileCredit,
  ]);

  const onRefreshReport = useCallback(async () => {
    if (!userId) return;

    const reportOptions: any = {
      brandId: brandId || undefined,
      adminId: adminId || undefined,
      np: noProfileCredit ? '1' : undefined,
      forceRefresh: true,
      ...(authRole ? { role: authRole } : {}),
    };

    await fetchReport(userId, platform, calculationMethod, reportOptions);
  }, [userId, platform, calculationMethod, fetchReport, brandId, adminId, authRole, noProfileCredit]);

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