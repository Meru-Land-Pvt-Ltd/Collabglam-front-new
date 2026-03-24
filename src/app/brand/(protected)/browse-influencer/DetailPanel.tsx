'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  BarChart3,
  Send,
  ChevronDown,
} from 'lucide-react';
import { ProfileHeader } from './detail-panel/ProfileHeader';
import { StatsChart } from './detail-panel/StatsChart';
import { ContentBreakdown } from './detail-panel/ContentBreakdown';
import { PopularPosts } from './detail-panel/PopularPosts';
import { AboutSection } from './detail-panel/AboutSection';
import { AudienceDistribution } from './detail-panel/AudienceDistribution';
import { BrandAffinity } from './detail-panel/BrandAffinity';
import { MiniUserSection } from './detail-panel/MiniUserSection';
import type { ReportResponse, StatHistoryEntry, Platform } from './types';
import { post, post2 } from '@/lib/api';
import {
  apiGetAllCampaigns,
  apiCreateCampaignInvitation,
  type GetAllCampaignsRow,
} from '@/app/brand/services/brandApi';

/**
 * Change this import path to your actual toast file path
 * Example: '@/components/ui/toast' or '@/lib/toast'
 */
import { toast } from '@/components/ui/toast';

interface CampaignOption {
  id: string;
  name: string;
}

interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  data: ReportResponse | null;
  raw: any;
  platform: Platform | null;
  emailExists?: boolean | null;
  onChangeCalc: (calc: 'median' | 'average') => void;
  brandId: string;
  handle: string | null;
  lastFetchedAt?: string | null;
  onRefreshReport?: () => Promise<void> | void;
}

/** /email/status response shape */
type EmailStatusResponse =
  | {
      status: 0 | 1;
      email?: string;
      handle?: string;
      platform?: Platform;
    }
  | { status: 'error'; message?: string };

/** /admin/checkstatus response shape */
type AdminCheckStatusResponse = {
  status: 0 | 1;
  handle?: string;
  email?: string | null;
  platform?: Platform | string;
  message?: string;
};

/** /missing/create response shape */
type CreateMissingResp = {
  status: 'saved' | 'exists';
  data: {
    missingId: string;
    handle: string;
    platform: 'youtube' | 'instagram' | 'tiktok';
    brandId: string;
    note: string | null;
    createdAt: string;
  };
  message?: string;
};

/** /newinvitations/create response shape */
type InvitationCreateResp = {
  status: 'saved' | 'exists';
  data?: {
    invitationId: string;
    handle: string;
    platform: 'youtube' | 'instagram' | 'tiktok';
    brandId: string;
    campaignId?: string | null;
    status: 'invited' | 'available';
    createdAt: string;
    updatedAt: string;
  };
  message?: string;
};

/** /modash/saved response */
type SavedModashInfluencer = {
  _id: string;
  userId?: string | number | null;
  provider?: Platform | string | null;
  handle?: string | null;
  username?: string | null;
  influencerId?: string | null;
};

type SavedModashResponse = {
  page: number;
  limit: number;
  total: number;
  results: SavedModashInfluencer[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const normalizeHandleValue = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '');

export const DetailPanel = React.memo<DetailPanelProps>(
  ({
    open,
    onClose,
    loading,
    error,
    data,
    raw,
    platform,
    emailExists,
    brandId,
    handle,
    lastFetchedAt,
    onRefreshReport,
  }) => {
    const router = useRouter();

    const [sendingInvite, setSendingInvite] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(
      lastFetchedAt || null
    );

    const [hasAnyEmail, setHasAnyEmail] = useState<boolean | null>(null);

    const [savedCreatorMatch, setSavedCreatorMatch] =
      useState<SavedModashInfluencer | null>(null);
    const [checkingSavedCreator, setCheckingSavedCreator] = useState(false);

    const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
    const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
    const [campaignListLoading, setCampaignListLoading] = useState(false);
    const [campaignList, setCampaignList] = useState<CampaignOption[]>([]);

    useEffect(() => {
      setLastUpdatedAt(lastFetchedAt || null);
    }, [lastFetchedAt]);

    useEffect(() => {
      if (!open) {
        setShowCampaignDropdown(false);
      }
    }, [open]);

    const formattedLastUpdated = lastUpdatedAt
      ? new Date(lastUpdatedAt).toLocaleString()
      : 'Not fetched yet';

    const statHistory = useMemo<StatHistoryEntry[]>(() => {
      const hist = data?.profile?.statsByContentType?.all?.statHistory || [];
      return hist?.slice(-12);
    }, [data]);

    const headerProfile = data?.profile?.profile;

    const resolvedHandle =
      handle ||
      headerProfile?.handle ||
      headerProfile?.username ||
      '';

    const normalizedResolvedHandle = normalizeHandleValue(resolvedHandle);

    const displayName =
      headerProfile?.fullname ||
      headerProfile?.username ||
      headerProfile?.handle ||
      handle ||
      'Creator profile';

    const displayHandle =
      headerProfile?.handle ||
      headerProfile?.username ||
      (handle && (handle.startsWith('@') ? handle : `@${handle}`)) ||
      '';

    const toggleCampaignSelection = (id: string) => {
      setSelectedCampaignIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    };

    const isEmailStatusSuccess = (
      resp: EmailStatusResponse
    ): resp is {
      status: 0 | 1;
      email?: string;
      handle?: string;
      platform?: Platform;
    } => {
      return typeof (resp as any)?.status === 'number';
    };

    const resolveCreatorEmail = async (
      safeHandle: string,
      normalizedPlatform: Platform
    ): Promise<{ email: string | null; source: 'status' | 'admin' | 'both' | 'none' }> => {
      const [statusResult, adminResult] = await Promise.allSettled([
        post2<EmailStatusResponse>('/email/status', {
          handle: safeHandle,
          platform: normalizedPlatform,
        }),
        post<AdminCheckStatusResponse>('/admin/checkstatus', {
          handle: safeHandle,
          platform: normalizedPlatform,
        }),
      ]);

      let emailFromStatus: string | null = null;
      let emailFromAdmin: string | null = null;

      if (statusResult.status === 'fulfilled') {
        const statusResp = statusResult.value;
        if (
          isEmailStatusSuccess(statusResp) &&
          statusResp.status === 1 &&
          statusResp.email
        ) {
          emailFromStatus = statusResp.email;
        }
      } else {
        console.error('Error calling /email/status:', statusResult.reason);
      }

      if (adminResult.status === 'fulfilled') {
        const adminResp = adminResult.value;
        if (
          typeof adminResp.status === 'number' &&
          adminResp.status === 1 &&
          adminResp.email
        ) {
          emailFromAdmin = adminResp.email;
        }
      } else {
        console.error('Error calling /admin/checkstatus:', adminResult.reason);
      }

      if (emailFromStatus && emailFromAdmin && emailFromStatus === emailFromAdmin) {
        return { email: emailFromStatus, source: 'both' };
      }

      if (emailFromStatus) {
        return { email: emailFromStatus, source: 'status' };
      }

      if (emailFromAdmin) {
        return { email: emailFromAdmin, source: 'admin' };
      }

      return { email: null, source: 'none' };
    };

    useEffect(() => {
      if (!open) {
        setHasAnyEmail(null);
        return;
      }

      const normalizedPlatform = (platform ?? '').toLowerCase() as Platform;
      if (
        !normalizedPlatform ||
        !['youtube', 'instagram', 'tiktok'].includes(normalizedPlatform)
      ) {
        setHasAnyEmail(null);
        return;
      }

      const safeHandle = normalizedResolvedHandle
        ? `@${normalizedResolvedHandle}`
        : '';

      if (!safeHandle || !/^[A-Za-z0-9._-]+$/.test(safeHandle.replace(/^@/, ''))) {
        setHasAnyEmail(null);
        return;
      }

      let cancelled = false;

      (async () => {
        try {
          const { email } = await resolveCreatorEmail(safeHandle, normalizedPlatform);
          if (!cancelled) {
            setHasAnyEmail(!!email);
          }
        } catch (err) {
          console.error('Failed to pre-check email status', err);
          if (!cancelled) {
            setHasAnyEmail(null);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [open, normalizedResolvedHandle, platform]);

    useEffect(() => {
      if (!open) {
        setSavedCreatorMatch(null);
        setShowCampaignDropdown(false);
        return;
      }

      const normalizedPlatform = (platform ?? '').toLowerCase() as Platform;
      const targetHandle = normalizedResolvedHandle;
      const targetUserId = String(data?.profile?.userId || raw?.userId || '').trim();

      if (
        !targetHandle ||
        !targetUserId ||
        !normalizedPlatform ||
        !['youtube', 'instagram', 'tiktok'].includes(normalizedPlatform)
      ) {
        setSavedCreatorMatch(null);
        return;
      }

      let cancelled = false;
      setCheckingSavedCreator(true);

      (async () => {
        try {
          const url = `${API_BASE_URL}/modash/saved?q=${encodeURIComponent(
            targetHandle
          )}&provider=${encodeURIComponent(normalizedPlatform)}`;

          const res = await fetch(url);
          if (!res.ok) {
            throw new Error('Failed to check saved influencer');
          }

          const json: SavedModashResponse = await res.json();

          const match =
            json.results?.find((item) => {
              const providerMatch =
                String(item.provider || '').toLowerCase() === normalizedPlatform;

              const handleMatch =
                normalizeHandleValue(item.handle || item.username) === targetHandle;

              const userIdMatch =
                String(item.userId || '').trim() === targetUserId;

              return providerMatch && handleMatch && userIdMatch;
            }) || null;

          if (!cancelled) {
            setSavedCreatorMatch(match);
          }
        } catch (err) {
          console.error('Failed to fetch /modash/saved', err);
          if (!cancelled) {
            setSavedCreatorMatch(null);
          }
        } finally {
          if (!cancelled) {
            setCheckingSavedCreator(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [
      open,
      normalizedResolvedHandle,
      platform,
      data?.profile?.userId,
      raw?.userId,
    ]);

    useEffect(() => {
      if (!open || !brandId) {
        setCampaignList([]);
        return;
      }

      let cancelled = false;
      setCampaignListLoading(true);

      (async () => {
        try {
          const res = await apiGetAllCampaigns({
            brandId,
            page: 1,
            limit: 100,
          });

          const mapped: CampaignOption[] = (res?.data || [])
            .map((item: GetAllCampaignsRow) => ({
              id: String(item._id || item.id || item.campaignId || ''),
              name: String(
                item.campaignTitle || item.title || item.name || 'Untitled Campaign'
              ),
            }))
            .filter((x) => x.id);

          if (!cancelled) {
            setCampaignList(mapped);
          }
        } catch (err) {
          console.error('Failed to fetch campaigns', err);
          if (!cancelled) {
            setCampaignList([]);
          }
        } finally {
          if (!cancelled) {
            setCampaignListLoading(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [open, brandId]);

    if (!open) return null;

    const influencerId = String(savedCreatorMatch?.influencerId || '').trim();

    const modashUserId =
      String(
        data?.profile?.userId || raw?.userId || savedCreatorMatch?.userId || ''
      ).trim() || undefined;

    // important fix:
    // if creator is NOT in modash/saved, old invitation flow should still work
    const hasActionTarget = Boolean(
      brandId &&
        platform &&
        normalizedResolvedHandle
    );

    const canAct = hasActionTarget && !loading && !sendingInvite && !refreshing;

    const effectiveHasEmail =
      hasAnyEmail !== null ? hasAnyEmail : emailExists === true;

    const hasMatchedSavedInfluencer = Boolean(savedCreatorMatch?.influencerId);

    const shouldShowCampaignSelector = hasMatchedSavedInfluencer;

    const ctaTitle = shouldShowCampaignSelector
      ? 'Select campaign'
      : 'Send invitation';

    const handleRefreshData = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!onRefreshReport || refreshing) return;

      try {
        setRefreshing(true);
        await onRefreshReport();
      } catch (err: any) {
        console.error(err);
        toast({
          icon: 'error',
          title: 'Refresh failed',
          text: err?.message || 'Failed to refresh data',
        });
      } finally {
        setRefreshing(false);
      }
    };

    const createCampaignInvitations = async (campaignIds: string[]) => {
      if (!brandId) {
        toast({
          icon: 'warning',
          title: 'Missing brand',
          text: 'brandId is required.',
        });
        return false;
      }

      if (!influencerId) {
        toast({
          icon: 'warning',
          title: 'Missing influencer',
          text: 'influencerId is required.',
        });
        return false;
      }

      if (!campaignIds.length) {
        toast({
          icon: 'warning',
          title: 'Select campaign',
          text: 'Please select at least one campaign.',
        });
        return false;
      }

      const normalizedPlatform = (platform ?? '').toLowerCase() as Platform;
      if (
        !normalizedPlatform ||
        !['youtube', 'instagram', 'tiktok'].includes(normalizedPlatform)
      ) {
        toast({
          icon: 'warning',
          title: 'Unsupported platform',
          text: 'Unsupported or missing platform.',
        });
        return false;
      }

      const safeHandle = normalizedResolvedHandle
        ? `@${normalizedResolvedHandle}`
        : '';

      try {
        setSendingInvite(true);

        let emailTo: string | undefined = undefined;

        if (effectiveHasEmail && safeHandle) {
          const emailResult = await resolveCreatorEmail(safeHandle, normalizedPlatform);
          if (emailResult.email) {
            emailTo = emailResult.email;
          }
        }

        const res = await apiCreateCampaignInvitation({
          brandId,
          influencerId,
          campaignIds,
          platform: normalizedPlatform,
          handle: safeHandle || undefined,
          modashUserId,
          emailTo,
        });

        if (res.status !== 'success') {
          toast({
            icon: 'error',
            title: 'Error',
            text: res.message || 'Failed to create invitations.',
          });
          return false;
        }

        toast({
          icon: 'success',
          title: 'Invitation sent',
          text: res.message || 'Invitations created successfully.',
        });

        setShowCampaignDropdown(false);
        setSelectedCampaignIds([]);
        return true;
      } catch (err: any) {
        console.error(err);
        toast({
          icon: 'error',
          title: 'Error',
          text:
            err?.response?.data?.message ||
            err?.message ||
            'Failed to create invitations.',
        });
        return false;
      } finally {
        setSendingInvite(false);
      }
    };

    // old flow stays exactly for influencers not present in modash/saved
    const sendInvitationWithoutEmail = async () => {
      if (!canAct || sendingInvite) return;

      const normalizedPlatform = (platform ?? '').toLowerCase() as Platform;
      const safeHandle = normalizedResolvedHandle
        ? `@${normalizedResolvedHandle}`
        : '';

      if (!brandId) {
        toast({
          icon: 'warning',
          title: 'Missing brand',
          text: 'Missing brandId. Please provide brandId to DetailPanel.',
        });
        return;
      }

      if (
        !normalizedPlatform ||
        !['youtube', 'instagram', 'tiktok'].includes(normalizedPlatform)
      ) {
        toast({
          icon: 'warning',
          title: 'Unsupported platform',
          text: 'Unsupported or missing platform.',
        });
        return;
      }

      if (!safeHandle || !/^[A-Za-z0-9._-]+$/.test(safeHandle.replace(/^@/, ''))) {
        toast({
          icon: 'warning',
          title: 'Invalid handle',
          text: 'Invalid or missing handle to send invitation.',
        });
        return;
      }

      try {
        setSendingInvite(true);

        await post2<CreateMissingResp>('/missing/create', {
          handle: safeHandle,
          platform: normalizedPlatform,
          brandId,
        });

        await post<InvitationCreateResp>('/newinvitations/create', {
          handle: safeHandle,
          platform: normalizedPlatform,
          brandId,
          status: 'invited',
        });

        toast({
          icon: 'success',
          title: 'Invitation sent',
          text:
            'We’ve sent an invitation to this creator. They’ll see it and can reply soon.',
        });

        router.push('/brand/invited');
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to send invitation';

        console.error(err);

        toast({
          icon: 'error',
          title: 'Error',
          text: msg,
        });
      } finally {
        setSendingInvite(false);
      }
    };

    const handleDefaultAction = async (e: React.MouseEvent) => {
      e.preventDefault();

      if (shouldShowCampaignSelector) {
        setShowCampaignDropdown((prev) => !prev);
        return;
      }

      await sendInvitationWithoutEmail();
    };

    const handleCampaignSend = async (e: React.MouseEvent) => {
      e.preventDefault();

      if (!selectedCampaignIds.length) {
        toast({
          icon: 'warning',
          title: 'Select campaign',
          text: 'Please select at least one campaign first.',
        });
        return;
      }

      await createCampaignInvitations(selectedCampaignIds);
    };

    return (
      <div className="fixed inset-0 z-[90]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="absolute top-0 right-0 h-full w-full md:w-[50vw] bg-white shadow-2xl border-l rounded-none md:rounded-l-3xl overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b flex items-center gap-3 px-4 py-3">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Close
            </button>

            <div className="min-w-0 flex flex-col gap-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {displayName}
                </span>
                {displayHandle && (
                  <span className="text-xs text-gray-500 truncate">
                    {displayHandle}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {platform && (
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-700">
                    {platform}
                  </span>
                )}
              </div>
            </div>

            <div className="ml-auto flex flex-col items-end gap-1 sm:flex-row sm:items-center">
              <div className="flex flex-col items-end gap-1 sm:items-end sm:ml-3">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wide text-gray-500">
                      Latest data
                    </span>
                    <span className="text-xs text-gray-700">
                      {formattedLastUpdated}
                    </span>
                  </div>

                  {Boolean(onRefreshReport) && (
                    <button
                      type="button"
                      onClick={handleRefreshData}
                      disabled={refreshing || loading}
                      className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      <BarChart3
                        className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`}
                      />
                      {refreshing ? 'Refreshing…' : 'Refresh data'}
                    </button>
                  )}
                </div>

                <div className="relative flex items-center gap-2">
                  {shouldShowCampaignSelector ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCampaignDropdown((prev) => !prev)}
                        disabled={!canAct || checkingSavedCreator}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-white transition-opacity shadow-sm
                          ${
                            canAct && !checkingSavedCreator
                              ? 'bg-gradient-to-r from-[#FFA135] to-[#FF7236] hover:opacity-90'
                              : 'bg-gray-300 cursor-not-allowed opacity-70'
                          }`}
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            showCampaignDropdown ? 'rotate-180' : ''
                          }`}
                        />
                        {checkingSavedCreator ? 'Checking…' : 'Select Campaign'}
                      </button>

                      {showCampaignDropdown && (
                        <div className="absolute right-0 mt-2 w-[340px] rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl z-30">
                          <div className="mb-2">
                            <div className="text-sm font-semibold text-gray-900">
                              Select Campaign
                            </div>
                            <div className="text-xs text-gray-500">
                              You can select multiple campaigns
                            </div>
                          </div>

                          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                            {campaignListLoading ? (
                              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-xs text-gray-500">
                                Loading campaigns...
                              </div>
                            ) : campaignList.length > 0 ? (
                              campaignList.map((campaign) => (
                                <label
                                  key={campaign.id}
                                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 px-3 py-2 hover:bg-gray-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedCampaignIds.includes(campaign.id)}
                                    onChange={() => toggleCampaignSelection(campaign.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                  />
                                  <span className="text-sm text-gray-700">
                                    {campaign.name}
                                  </span>
                                </label>
                              ))
                            ) : (
                              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-xs text-gray-500">
                                No campaigns available
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-500">
                              {selectedCampaignIds.length} selected
                            </span>

                            <button
                              type="button"
                              onClick={handleCampaignSend}
                              disabled={
                                !canAct ||
                                sendingInvite ||
                                campaignListLoading ||
                                campaignList.length === 0 ||
                                selectedCampaignIds.length === 0
                              }
                              className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-white transition-opacity shadow-sm
                                ${
                                  canAct &&
                                  !sendingInvite &&
                                  !campaignListLoading &&
                                  campaignList.length > 0 &&
                                  selectedCampaignIds.length > 0
                                    ? 'bg-gradient-to-r from-[#FFA135] to-[#FF7236] hover:opacity-90'
                                    : 'bg-gray-300 cursor-not-allowed opacity-70'
                                }`}
                            >
                              {sendingInvite ? (
                                <>
                                  <Send className="h-4 w-4 animate-pulse" />
                                  Sending…
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4" />
                                  Send Invitation
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleDefaultAction}
                      disabled={!canAct}
                      title={ctaTitle}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-white transition-opacity shadow-sm
                        ${
                          canAct
                            ? 'bg-gradient-to-r from-[#FFA135] to-[#FF7236] hover:opacity-90'
                            : 'bg-gray-300 cursor-not-allowed opacity-70'
                        }`}
                    >
                      {sendingInvite ? (
                        <>
                          <Send className="h-4 w-4 animate-pulse" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Invitation
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5">
            {loading && <LoadingState />}
            {error && <ErrorState error={error} />}

            {!loading && !error && !data && (
              <div className="mb-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
                No report data yet. Try refreshing data or selecting another creator.
              </div>
            )}

            {data && (
              <div className="space-y-6">
                <ProfileHeader profile={data.profile} platform={platform} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <StatsChart statHistory={statHistory} />
                    <ContentBreakdown data={data} platform={platform} />

                    {data.profile.popularPosts &&
                      data.profile.popularPosts.length > 0 && (
                        <PopularPosts
                          posts={data.profile.popularPosts.slice(0, 12)}
                        />
                      )}

                    {data.profile.notableUsers &&
                      data.profile.notableUsers.length > 0 && (
                        <MiniUserSection
                          title="Notable followers"
                          users={data.profile.notableUsers}
                        />
                      )}

                    {data.profile.lookalikes &&
                      data.profile.lookalikes.length > 0 && (
                        <MiniUserSection
                          title="Lookalikes"
                          users={data.profile.lookalikes}
                        />
                      )}

                    {data.profile.lookalikesByTopics &&
                      data.profile.lookalikesByTopics.length > 0 && (
                        <MiniUserSection
                          title="Lookalikes by topic"
                          users={data.profile.lookalikesByTopics}
                        />
                      )}

                    {data.profile.audienceLookalikes &&
                      data.profile.audienceLookalikes.length > 0 && (
                        <MiniUserSection
                          title="Audience lookalikes"
                          users={data.profile.audienceLookalikes}
                        />
                      )}
                  </div>

                  <div className="space-y-6">
                    <AboutSection profile={data.profile} />
                    <AudienceDistribution audience={data.profile.audience} />
                    {data.profile.brandAffinity &&
                      data.profile.brandAffinity.length > 0 && (
                        <BrandAffinity items={data.profile.brandAffinity} />
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

DetailPanel.displayName = 'DetailPanel';

const LoadingState: React.FC = () => (
  <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
      <BarChart3 className="h-8 w-8 text-orange-600 animate-pulse" />
    </div>
    <div className="text-lg font-semibold">Fetching report…</div>
  </div>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm flex items-start gap-2">
    <AlertCircle className="h-5 w-5 mt-0.5" />
    <div>
      <div className="font-semibold">Limit Reached</div>
      <div>{error}</div>
    </div>
  </div>
);