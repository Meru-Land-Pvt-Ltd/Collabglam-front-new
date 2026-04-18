import { useState, useCallback } from 'react';
import { Platform, ReportResponse, ModashReportRaw } from './types';
import { normalizeReport } from './utils';

type CalcMethod = 'median' | 'average';
type AuthRole = 'brand' | 'admin';

type FetchReportOptions = {
  influencerId?: string;
  forceRefresh?: boolean;

  // auth
  brandId?: string;
  adminId?: string;
  role?: AuthRole;
  access?: 'admin' | string;

  // ✅ skip profile view credit when np=1
  np?: string | boolean;
};

interface UseInfluencerReportReturn {
  report: ReportResponse | null;
  rawReport: ModashReportRaw | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: string | null;

  brandId: string | null;
  adminId: string | null;
  authRole: AuthRole | null;

  fetchReport: {
    (
      id: string,
      platform: Platform,
      calc: CalcMethod,
      influencerId?: string,
      forceRefresh?: boolean
    ): Promise<void>;

    (
      id: string,
      platform: Platform,
      calc: CalcMethod,
      opts?: FetchReportOptions
    ): Promise<void>;
  };
}

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_REPORT_ENDPOINT = `${BACKEND_BASE_URL}modash/report`;

function cleanId(v: any): string | null {
  const s = String(v || '').trim();
  return s ? s : null;
}

function getAuthFromStorage(): {
  brandId: string | null;
  adminId: string | null;
  authRole: AuthRole | null;
} {
  if (typeof window === 'undefined') {
    return { brandId: null, adminId: null, authRole: null };
  }

  try {
    const b = cleanId(window.localStorage.getItem('brandId'));
    const a = cleanId(window.localStorage.getItem('adminId'));

    if (b) return { brandId: b, adminId: null, authRole: 'brand' };
    if (a) return { brandId: null, adminId: a, authRole: 'admin' };

    return { brandId: null, adminId: null, authRole: null };
  } catch {
    return { brandId: null, adminId: null, authRole: null };
  }
}

function resolveAuth(
  opts: FetchReportOptions | undefined,
  storage: ReturnType<typeof getAuthFromStorage>
) {
  const hasAdminAccess = String(opts?.access || '').trim().toLowerCase() === 'admin';

  const role: AuthRole | null =
    hasAdminAccess
      ? 'admin'
      : opts?.role ||
        (opts?.brandId ? 'brand' : opts?.adminId ? 'admin' : storage.authRole);

  const brandId = cleanId(opts?.brandId) || storage.brandId;
  const adminId = cleanId(opts?.adminId) || storage.adminId;

  if (role === 'admin') {
    return { authRole: 'admin' as const, brandId: null, adminId };
  }
  if (role === 'brand') {
    return { authRole: 'brand' as const, brandId, adminId: null };
  }

  if (brandId) return { authRole: 'brand' as const, brandId, adminId: null };
  if (adminId) return { authRole: 'admin' as const, brandId: null, adminId };
  return { authRole: null, brandId: null, adminId: null };
}

export function useInfluencerReport(): UseInfluencerReportReturn {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [rawReport, setRawReport] = useState<ModashReportRaw | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  const initialAuth = getAuthFromStorage();
  const [brandId, setBrandId] = useState<string | null>(initialAuth.brandId);
  const [adminId, setAdminId] = useState<string | null>(initialAuth.adminId);
  const [authRole, setAuthRole] = useState<AuthRole | null>(initialAuth.authRole);

  const fetchReport = useCallback(
    async (
      id: string,
      platform: Platform,
      calc: CalcMethod,
      arg4?: string | FetchReportOptions,
      arg5?: boolean
    ) => {
      try {
        setLoading(true);
        setError(null);

        let opts: FetchReportOptions | undefined;
        if (typeof arg4 === 'string' || arg4 == null) {
          opts = {
            influencerId: arg4 || undefined,
            forceRefresh: !!arg5,
          };
        } else {
          opts = arg4;
        }

        const storageAuth = getAuthFromStorage();
        const resolved = resolveAuth(opts, storageAuth);

        setBrandId(resolved.brandId);
        setAdminId(resolved.adminId);
        setAuthRole(resolved.authRole);

        const params: Record<string, string> = {
          platform,
          userId: id,
          calculationMethod: calc,
        };

        if (resolved.brandId) params.brandId = resolved.brandId;
        if (resolved.adminId) params.adminId = resolved.adminId;

        if (opts?.influencerId) params.influencerId = opts.influencerId;
        if (opts?.forceRefresh) params.force = '1';

        if (String(opts?.access || '').trim().toLowerCase() === 'admin') {
          params.access = 'admin';
        }

        // ✅ forward np=1 to backend
        if (opts?.np === true || opts?.np === '1' || opts?.np === 'true') {
          params.np = '1';
        }

        const q = new URLSearchParams(params);
        const res = await fetch(`${API_REPORT_ENDPOINT}?${q.toString()}`);
        const raw: ModashReportRaw = await res.json();

        if (!res.ok || (raw as any)?.error) {
          const msg =
            (raw as any)?.message ||
            (typeof (raw as any)?.error === 'string'
              ? (raw as any).error
              : `Failed to fetch report (${res.status})`);
          throw new Error(msg);
        }

        const normalized: ReportResponse = normalizeReport(raw, platform);

        setReport(normalized);
        setRawReport(raw);

        const fetchedAt =
          typeof (raw as any)?._lastFetchedAt === 'string' ? (raw as any)._lastFetchedAt : null;
        setLastFetchedAt(fetchedAt);
      } catch (e: any) {
        setError(e?.message || 'Something went wrong');
        setReport(null);
        setRawReport(null);
        setLastFetchedAt(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    report,
    rawReport,
    loading,
    error,
    lastFetchedAt,
    brandId,
    adminId,
    authRole,
    fetchReport: fetchReport as UseInfluencerReportReturn['fetchReport'],
  };
}