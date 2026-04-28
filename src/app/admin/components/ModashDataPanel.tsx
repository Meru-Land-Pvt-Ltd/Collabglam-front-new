'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import swal from 'sweetalert';
import { get } from '@/lib/api';
import { SearchHeader } from '@/app/brand/(protected)/browse-influencer/SearchHeader';
import { ResultsGrid } from '@/app/brand/(protected)/browse-influencer/ResultsGrid';
import { DetailPanel } from '@/app/brand/(protected)/browse-influencer/DetailPanel';
import { useInfluencerReport } from '@/app/brand/(protected)/browse-influencer/useInfluencerReport';
import type { Platform } from '@/app/brand/(protected)/browse-influencer/filters';
import type { Platform as ReportPlatform } from '@/app/brand/(protected)/browse-influencer/types';

type LangObj = { code?: string; name?: string };

type InfluencerDoc = {
  _id?: string;
  id?: string;
  provider?: string;
  platform?: string;
  userId?: string;

  fullname?: string;
  fullName?: string;
  name?: string;
  handle?: string;
  username?: string;

  country?: string | null;
  city?: string | null;
  state?: string | null;
  language?: LangObj | null;

  followers?: number | null;
  averageViews?: number | null;

  engagements?: number | null;
  engagementRate?: number | null;

  isPrivate?: boolean | null;
  isVerified?: boolean | null;
  verified?: boolean | null;

  picture?: string | null;
  avatar?: string | null;
  profilePicUrl?: string | null;
  thumbnail?: string | null;
  profilePicture?: string | null;

  url?: string | null;
  link?: string | null;

  createdAt?: string;
  updatedAt?: string;

  influencerId?: string;
  influencer?: string;

  category?: string[] | string | null;
  categories?: any[];

  socialProfiles?: any[];
  connectedProfiles?: any[];
  profiles?: any[];

  bio?: string | null;
  description?: string | null;

  searchType?: 'exact' | 'standard' | 'ai' | 'combined';
  source?: string;
};

type ListResponse = {
  page: number;
  limit: number;
  total: number;
  results: InfluencerDoc[];
};

type PlatformAdvancedFilter = {
  followersMin?: number;
  followersMax?: number;
  avgViewsMin?: number;
  avgViewsMax?: number;
  engagementsMin?: number;
  engagementsMax?: number;
  engagementRateMin?: number;
  languageCode?: string;
  lastPostedDays?: number;
  locationIdsText?: string;

  bioQuery?: string;
  keywords?: string;
  relevance?: string;
  audienceRelevance?: string;
  textTags?: string;

  hasAudienceData?: boolean;
  contactEmailOnly?: boolean;

  followersGrowthInterval?: string;
  followersGrowthOperator?: string;
  followersGrowthValue?: number;

  viewsGrowthInterval?: string;
  viewsGrowthOperator?: string;
  viewsGrowthValue?: number;

  likesGrowthInterval?: string;
  likesGrowthOperator?: string;
  likesGrowthValue?: number;

  reelsPlaysMin?: number;
  reelsPlaysMax?: number;

  sharesMin?: number;
  sharesMax?: number;
  savesMin?: number;
  savesMax?: number;

  interestsIdsText?: string;
  brandsIdsText?: string;
  igAccountTypesText?: string;

  hasSponsoredPosts?: boolean;
  hasYouTube?: boolean;
  isOfficialArtist?: boolean;
};

type AdvancedFilters = {
  search: {
    mode?: 'ai' | 'standard' | 'combined';
  };
  influencer: {
    isVerified?: boolean;
    gender?: string;
    ageMin?: number;
    ageMax?: number;
  };
  audience: {
    country?: string;
  };
  platform: Record<Platform, PlatformAdvancedFilter>;
};

const PLATFORM_ORDER: Platform[] = ['youtube', 'instagram', 'tiktok'];

function createEmptyPlatformFilter(): PlatformAdvancedFilter {
  return {};
}

function createDefaultAdvancedFilters(): AdvancedFilters {
  return {
    search: {
      mode: 'combined',
    },
    influencer: {},
    audience: {},
    platform: {
      youtube: createEmptyPlatformFilter(),
      instagram: createEmptyPlatformFilter(),
      tiktok: createEmptyPlatformFilter(),
    },
  };
}

function updateNestedValue<T extends Record<string, any>>(
  source: T,
  path: string,
  value: any
): T {
  const keys = path.split('.').filter(Boolean);
  if (!keys.length) return source;

  const next: any = { ...source };
  let cursor = next;

  keys.slice(0, -1).forEach((key) => {
    const current = cursor[key];
    cursor[key] =
      current && typeof current === 'object' && !Array.isArray(current)
        ? { ...current }
        : {};
    cursor = cursor[key];
  });

  cursor[keys[keys.length - 1]] = value;
  return next;
}

function showErr(message: string) {
  return swal({
    title: 'Error',
    text: message || 'Something went wrong.',
    icon: 'error',
  });
}

function normalizePlatform(value?: string | null): Platform {
  const raw = String(value || '').trim().toLowerCase();

  if (raw.includes('instagram')) return 'instagram';
  if (raw.includes('tiktok')) return 'tiktok';
  return 'youtube';
}

function firstPlatformValue<T = any>(
  filters: AdvancedFilters,
  platforms: Platform[],
  field: keyof PlatformAdvancedFilter
): T | undefined {
  for (const platform of platforms) {
    const value = filters.platform?.[platform]?.[field];
    if (value !== undefined && value !== null && value !== '') return value as T;
  }

  return undefined;
}

function normalizeCategory(value: any) {
  if (Array.isArray(value)) return value;

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function normalizeInfluencerForResultsGrid(
  item: InfluencerDoc,
  fallbackPlatform: Platform,
  searchType: InfluencerDoc['searchType']
) {
  const platform = normalizePlatform(item.platform || item.provider || fallbackPlatform);

  const id =
    item.userId ||
    item.id ||
    item._id ||
    item.influencerId ||
    item.username ||
    item.handle ||
    item.url ||
    item.link;

  const username = item.username || item.handle || item.fullname || item.fullName || item.name || '';
  const cleanUsername = String(username || '').replace(/^@/, '');

  return {
    ...item,

    id,
    userId: id,

    platform,
    provider: platform,

    username: cleanUsername,
    handle: item.handle || cleanUsername,

    fullname:
      item.fullname ||
      item.fullName ||
      item.name ||
      cleanUsername ||
      item.handle ||
      'Unknown Creator',

    fullName: item.fullName || item.fullname || item.name,

    picture:
      item.picture ||
      item.avatar ||
      item.profilePicUrl ||
      item.thumbnail ||
      item.profilePicture ||
      '',

    avatar:
      item.avatar ||
      item.picture ||
      item.profilePicUrl ||
      item.thumbnail ||
      item.profilePicture ||
      '',

    profilePicture:
      item.profilePicture ||
      item.picture ||
      item.avatar ||
      item.profilePicUrl ||
      item.thumbnail ||
      '',

    followers: Number(item.followers || 0),
    engagementRate: Number(item.engagementRate || 0),
    averageViews: Number(item.averageViews || 0),
    engagements: Number(item.engagements || 0),

    isVerified: Boolean(item.isVerified || item.verified),
    verified: Boolean(item.isVerified || item.verified),

    bio: item.bio || item.description || '',

    url: item.url || item.link || '',
    link: item.link || item.url || '',

    categories: Array.isArray(item.categories)
      ? item.categories
      : normalizeCategory(item.category),

    category: item.category,

    searchType,
    source: item.source || 'modash',
  };
}

export default function ModashDataPanel() {
  const SAVED_ENDPOINT = '/modash/saved';
  const USERS_ENDPOINT = '/modash/users';

  const [items, setItems] = useState<InfluencerDoc[]>([]);
  const [usersItems, setUsersItems] = useState<InfluencerDoc[]>([]);
  const [view, setView] = useState<'saved' | 'users'>('saved');

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(false);

  const [brandId, setBrandId] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<ReportPlatform | null>(null);
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);
  const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null);
  const [calculationMethod, setCalculationMethod] = useState<'median' | 'average'>('average');

  const [platforms, setPlatformsState] = useState<Platform[]>(['youtube']);
  const platformsRef = useRef<Platform[]>(['youtube']);

  const [filters, setFilters] = useState<AdvancedFilters>(createDefaultAdvancedFilters);
  const [filtersActive, setFiltersActive] = useState<AdvancedFilters>(
    createDefaultAdvancedFilters
  );
  const filtersRef = useRef<AdvancedFilters>(createDefaultAdvancedFilters());

  const {
    report,
    rawReport,
    loading: loadingReport,
    error: reportError,
    lastFetchedAt,
    fetchReport,
  } = useInfluencerReport();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setBrandId(localStorage.getItem('brandId') || '');
  }, []);

  const primaryPlatform = useMemo<Platform>(() => {
    return platforms[0] || 'youtube';
  }, [platforms]);

  const currentItems = view === 'saved' ? items : usersItems;

  const visibleResults = useMemo(() => {
    const type = view === 'saved' ? 'standard' : 'exact';

    return currentItems.map((item) =>
      normalizeInfluencerForResultsGrid(item, primaryPlatform, type)
    );
  }, [currentItems, primaryPlatform, view]);

  const setPlatforms = useCallback((next: Platform[]) => {
    const fallback: Platform[] = ['youtube'];

    const selected: Platform[] =
      Array.isArray(next) && next.length ? [next[0] as Platform] : fallback;

    const ordered: Platform[] = PLATFORM_ORDER.filter((platform) =>
      selected.includes(platform)
    );

    const normalized: Platform[] = ordered.length ? ordered : fallback;

    platformsRef.current = normalized;
    setPlatformsState(normalized);
  }, []);

  const updateFilter = useCallback((path: string, value: any) => {
    setFilters((prev) => {
      const next = updateNestedValue(prev, path, value);
      filtersRef.current = next;
      return next;
    });
  }, []);

  function appendAdvancedParams(params: Record<string, any>, selectedFilters: AdvancedFilters) {
    const selectedPlatforms = platformsRef.current.length ? platformsRef.current : platforms;

    const followersMin = firstPlatformValue<number>(
      selectedFilters,
      selectedPlatforms,
      'followersMin'
    );
    const followersMax = firstPlatformValue<number>(
      selectedFilters,
      selectedPlatforms,
      'followersMax'
    );
    const avgViewsMin = firstPlatformValue<number>(
      selectedFilters,
      selectedPlatforms,
      'avgViewsMin'
    );
    const avgViewsMax = firstPlatformValue<number>(
      selectedFilters,
      selectedPlatforms,
      'avgViewsMax'
    );
    const engagementsMin = firstPlatformValue<number>(
      selectedFilters,
      selectedPlatforms,
      'engagementsMin'
    );
    const engagementsMax = firstPlatformValue<number>(
      selectedFilters,
      selectedPlatforms,
      'engagementsMax'
    );
    const engagementRateMin = firstPlatformValue<number>(
      selectedFilters,
      selectedPlatforms,
      'engagementRateMin'
    );
    const languageCode = firstPlatformValue<string>(
      selectedFilters,
      selectedPlatforms,
      'languageCode'
    );
    const lastPostedDays = firstPlatformValue<number>(
      selectedFilters,
      selectedPlatforms,
      'lastPostedDays'
    );
    const locationIdsText = firstPlatformValue<string>(
      selectedFilters,
      selectedPlatforms,
      'locationIdsText'
    );
    const bioQuery = firstPlatformValue<string>(
      selectedFilters,
      selectedPlatforms,
      'bioQuery'
    );
    const keywords = firstPlatformValue<string>(
      selectedFilters,
      selectedPlatforms,
      'keywords'
    );
    const textTags = firstPlatformValue<string>(
      selectedFilters,
      selectedPlatforms,
      'textTags'
    );
    const hasSponsoredPosts = firstPlatformValue<boolean>(
      selectedFilters,
      selectedPlatforms,
      'hasSponsoredPosts'
    );
    const hasAudienceData = firstPlatformValue<boolean>(
      selectedFilters,
      selectedPlatforms,
      'hasAudienceData'
    );
    const contactEmailOnly = firstPlatformValue<boolean>(
      selectedFilters,
      selectedPlatforms,
      'contactEmailOnly'
    );

    if (followersMin != null) params.minFollowers = followersMin;
    if (followersMax != null) params.maxFollowers = followersMax;

    if (avgViewsMin != null) params.minAverageViews = avgViewsMin;
    if (avgViewsMax != null) params.maxAverageViews = avgViewsMax;

    if (engagementsMin != null) params.minEngagements = engagementsMin;
    if (engagementsMax != null) params.maxEngagements = engagementsMax;

    if (engagementRateMin != null) params.minEngagementRate = engagementRateMin / 100;

    if (languageCode) params.language = languageCode;
    if (lastPostedDays != null) params.lastPostedDays = lastPostedDays;
    if (locationIdsText) params.locationIds = locationIdsText;

    if (bioQuery) params.bioQuery = bioQuery;
    if (keywords) params.keywords = keywords;
    if (textTags) params.textTags = textTags;

    if (hasSponsoredPosts) params.hasSponsoredPosts = true;
    if (hasAudienceData) params.hasAudienceData = true;
    if (contactEmailOnly) params.contactEmailOnly = true;

    if (selectedFilters.search?.mode) params.searchMode = selectedFilters.search.mode;
    if (selectedFilters.influencer?.isVerified) params.isVerified = true;
    if (selectedFilters.influencer?.gender) params.gender = selectedFilters.influencer.gender;

    if (selectedFilters.influencer?.ageMin != null) {
      params.ageMin = selectedFilters.influencer.ageMin;
    }

    if (selectedFilters.influencer?.ageMax != null) {
      params.ageMax = selectedFilters.influencer.ageMax;
    }

    if (selectedFilters.audience?.country) params.country = selectedFilters.audience.country;

    return params;
  }

  function buildSavedParams(pageUi: number, selectedFilters: AdvancedFilters, query: string) {
    const params: Record<string, any> = {
      page: Math.max(0, pageUi - 1),
      limit,
      sort: 'updatedAt',
      dir: 'desc',
    };

    const cleanQuery = String(query || '').trim();
    if (cleanQuery) params.q = cleanQuery;

    const selectedPlatforms = platformsRef.current.length ? platformsRef.current : platforms;

    if (selectedPlatforms.length === 1) {
      params.platform = selectedPlatforms[0];
    } else if (selectedPlatforms.length > 1) {
      params.platforms = selectedPlatforms.join(',');
    }

    return appendAdvancedParams(params, selectedFilters);
  }

  function buildUsersParams(pageUi: number, query: string, selectedFilters: AdvancedFilters) {
    const params: Record<string, any> = {
      page: Math.max(0, pageUi - 1),
      limit,
    };

    const cleanQuery = String(query || '').trim();
    if (cleanQuery) params.q = cleanQuery;

    const selectedPlatforms = platformsRef.current.length ? platformsRef.current : platforms;

    if (selectedPlatforms.length === 1) {
      params.platform = selectedPlatforms[0];
    } else if (selectedPlatforms.length > 1) {
      params.platforms = selectedPlatforms.join(',');
    }

    return appendAdvancedParams(params, selectedFilters);
  }

  const loadSaved = useCallback(
    async (pageUi = 1, selectedFilters: AdvancedFilters = filtersActive, query = '') => {
      setLoading(true);

      try {
        const resp = await get<ListResponse>(
          SAVED_ENDPOINT,
          buildSavedParams(pageUi, selectedFilters, query)
        );

        const results = Array.isArray(resp?.results) ? resp.results : [];
        const serverPage = Number(resp?.page ?? 0);
        const responseLimit = Number(resp?.limit ?? limit);
        const responseTotal = Number(resp?.total ?? 0);

        setView('saved');

        if (pageUi > 1) {
          setItems((prev) => [...prev, ...results]);
        } else {
          setItems(results);
        }

        setUsersItems([]);
        setTotal(responseTotal);
        setPage(serverPage + 1);
        setHasNext((serverPage + 1) * responseLimit < responseTotal);
      } catch (e: any) {
        await showErr(e?.message || 'Failed to load saved influencers.');
      } finally {
        setLoading(false);
      }
    },
    [filtersActive, limit, platforms]
  );

  const loadUsers = useCallback(
    async (pageUi = 1, query = '', selectedFilters: AdvancedFilters = filtersActive) => {
      setLoading(true);

      try {
        const resp = await get<ListResponse>(
          USERS_ENDPOINT,
          buildUsersParams(pageUi, query, selectedFilters)
        );

        const results = Array.isArray(resp?.results) ? resp.results : [];
        const serverPage = Number(resp?.page ?? 0);
        const responseLimit = Number(resp?.limit ?? limit);
        const responseTotal = Number(resp?.total ?? results.length ?? 0);

        setView('users');

        if (pageUi > 1) {
          setUsersItems((prev) => [...prev, ...results]);
        } else {
          setUsersItems(results);
        }

        setItems([]);
        setTotal(responseTotal);
        setPage(serverPage + 1);
        setHasNext((serverPage + 1) * responseLimit < responseTotal);
      } catch (e: any) {
        await showErr(e?.message || 'Failed to load users.');
      } finally {
        setLoading(false);
      }
    },
    [filtersActive, limit, platforms]
  );

  useEffect(() => {
    loadSaved(1, filtersActive, '');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(
    async (query: string) => {
      const cleanQuery = String(query || '').trim();
      if (!cleanQuery || loading) return;

      setLoading(true);

      try {
        const savedResp = await get<ListResponse>(
          SAVED_ENDPOINT,
          buildSavedParams(1, filtersActive, cleanQuery)
        );

        const savedResults = Array.isArray(savedResp?.results) ? savedResp.results : [];

        if (savedResults.length) {
          const serverPage = Number(savedResp?.page ?? 0);
          const responseLimit = Number(savedResp?.limit ?? limit);
          const responseTotal = Number(savedResp?.total ?? savedResults.length);

          setView('saved');
          setItems(savedResults);
          setUsersItems([]);
          setTotal(responseTotal);
          setPage(serverPage + 1);
          setHasNext((serverPage + 1) * responseLimit < responseTotal);
          return;
        }

        const usersResp = await get<ListResponse>(
          USERS_ENDPOINT,
          buildUsersParams(1, cleanQuery, filtersActive)
        );

        const usersResults = Array.isArray(usersResp?.results) ? usersResp.results : [];
        const serverPage = Number(usersResp?.page ?? 0);
        const responseLimit = Number(usersResp?.limit ?? limit);
        const responseTotal = Number(usersResp?.total ?? usersResults.length ?? 0);

        setView('users');
        setUsersItems(usersResults);
        setItems([]);
        setTotal(responseTotal);
        setPage(serverPage + 1);
        setHasNext((serverPage + 1) * responseLimit < responseTotal);
      } catch (e: any) {
        await showErr(e?.message || 'Search failed.');
      } finally {
        setLoading(false);
      }
    },
    [filtersActive, limit, loading, platforms]
  );

  const applyFilters = useCallback(() => {
    const nextFilters = filtersRef.current;

    setFiltersActive(nextFilters);

    if (queryText.trim()) {
      handleSearch(queryText.trim());
      return;
    }

    loadSaved(1, nextFilters, '');
  }, [handleSearch, loadSaved, queryText]);

  const resetFilters = useCallback(() => {
    const nextFilters = createDefaultAdvancedFilters();

    filtersRef.current = nextFilters;
    setFilters(nextFilters);
    setFiltersActive(nextFilters);
    setPlatforms(['youtube']);

    if (queryText.trim()) {
      handleSearch(queryText.trim());
      return;
    }

    loadSaved(1, nextFilters, '');
  }, [handleSearch, loadSaved, queryText, setPlatforms]);

  const handleLoadMore = useCallback(() => {
    if (loading || !hasNext) return;

    const nextPage = page + 1;
    const cleanQuery = queryText.trim();

    if (view === 'saved') {
      loadSaved(nextPage, filtersActive, cleanQuery);
      return;
    }

    loadUsers(nextPage, cleanQuery, filtersActive);
  }, [filtersActive, hasNext, loadSaved, loadUsers, loading, page, queryText, view]);

  async function openDetailPanel(influencer: any) {
    const idCandidate =
      influencer?.userId ||
      influencer?.id ||
      influencer?._id ||
      influencer?.influencerId ||
      influencer?.username ||
      influencer?.handle;

    if (!idCandidate) {
      await showErr('Missing user ID. Cannot open detail panel.');
      return;
    }

    const nextId = String(idCandidate);
    const nextPlatform = normalizePlatform(
      influencer?.platform || influencer?.provider || primaryPlatform
    ) as ReportPlatform;
    const nextHandle =
      String(influencer?.handle || influencer?.username || '').replace(/^@/, '') || null;

    setSelectedInfluencer(influencer);
    setSelectedId(nextId);
    setSelectedPlatform(nextPlatform);
    setSelectedHandle(nextHandle);
    setPanelOpen(true);

    fetchReport(nextId, nextPlatform, calculationMethod);
  }

  function closeDetailPanel() {
    setPanelOpen(false);
    setSelectedId(null);
    setSelectedPlatform(null);
    setSelectedHandle(null);
    setSelectedInfluencer(null);
  }

  async function refreshDetailPanel() {
    if (!selectedId || !selectedPlatform) return;
    await fetchReport(selectedId, selectedPlatform, calculationMethod, undefined, true);
  }

  function handlePanelPlatformChange(profile: any) {
    const nextPlatform = normalizePlatform(profile?.provider || profile?.platform) as ReportPlatform;
    const nextId = profile?.modashId || profile?._id || profile?.userId || profile?.id;

    if (!nextPlatform || !nextId) return;

    const nextHandle = profile?.username || profile?.handle || null;

    setSelectedId(String(nextId));
    setSelectedPlatform(nextPlatform);
    setSelectedHandle(nextHandle ? String(nextHandle).replace(/^@/, '') : null);

    fetchReport(String(nextId), nextPlatform, calculationMethod);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Modash Influencers</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter, export, and manage influencer profiles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge>
            Platforms:{' '}
            {platforms
              .map((platform) => platform.charAt(0).toUpperCase() + platform.slice(1))
              .join(', ')}
          </Badge>
          <Badge>{new Intl.NumberFormat('en-IN').format(total)} total</Badge>
        </div>
      </div>

      <SearchHeader
        queryText={queryText}
        setQueryText={setQueryText}
        loading={loading}
        onSearch={(query) => {
          setQueryText(query);
          handleSearch(query);
        }}
        platforms={platforms}
        setPlatforms={setPlatforms}
        filters={filters as any}
        updateFilter={updateFilter}
        onResetFilters={resetFilters}
        onApplyFilters={applyFilters}
      />

      <ResultsGrid
        platform={primaryPlatform}
        results={visibleResults}
        loading={loading}
        total={total}
        hasMore={hasNext}
        onLoadMore={handleLoadMore}
        onViewProfile={openDetailPanel}
      />

      {visibleResults.length > 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 pb-4 pt-1">
          {hasNext ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loading}
              className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-[14px] bg-black px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#111] disabled:cursor-not-allowed disabled:bg-[#e5e5e5] disabled:text-[#9a9a9a]"
            >
              {loading ? 'Loading more...' : 'Load More'}
            </button>
          ) : (
            <p className="text-sm text-slate-500">
              No more results to load.
            </p>
          )}

          <p className="text-xs text-slate-400">
            Showing {new Intl.NumberFormat('en-IN').format(visibleResults.length)}
            {total ? ` of ${new Intl.NumberFormat('en-IN').format(total)}` : ''} profiles
          </p>
        </div>
      ) : null}

      <DetailPanel
        open={panelOpen}
        onClose={closeDetailPanel}
        loading={loadingReport}
        error={reportError}
        data={report}
        raw={rawReport}
        platform={selectedPlatform}
        onChangeCalc={(calc) => {
          setCalculationMethod(calc);

          if (selectedId && selectedPlatform) {
            fetchReport(selectedId, selectedPlatform, calc);
          }
        }}
        brandId={brandId}
        handle={selectedHandle}
        lastFetchedAt={lastFetchedAt}
        onRefreshReport={refreshDetailPanel}
        connectedProfiles={
          selectedInfluencer?.socialProfiles ??
          selectedInfluencer?.connectedProfiles ??
          selectedInfluencer?.profiles ??
          []
        }
        onPlatformChange={handlePanelPlatformChange}
      />
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}