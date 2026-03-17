// app/brand/influ/InfluencerList.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import InfluencerFilter, { FilterState } from "./InfluencerFilter";
import { InfluencerTable, type InfluencerRow } from "@/components/ui/brand/Influencertable";

import { Button } from "@/components/ui/button";
import { CircleNotch } from "@phosphor-icons/react";

import {
  apiGetApplicantsByCampaign,
  apiUpdateApplicantStatus,
  apiGetInvitationListByCampaign, // ✅ keep + use
  getApiErrorMessage,
  type ApplicantStatus,
} from "@/app/brand/services/brandApi";

import { toast } from "@/components/ui/toast";

type Tab = "all" | "active" | "shortlisted" | "undecided" | "rejected";

const PAGE_LIMIT = 20;
const INVITE_PAGE_LIMIT = 100; // backend clamp usually 100

function getTabFromPath(pathname: string | null): Tab {
  const p = pathname ?? "";
  if (p.includes("/brand/influ/shortlisted")) return "shortlisted";
  if (p.includes("/brand/influ/active")) return "active";
  if (p.includes("/brand/influ/undecided")) return "undecided";
  if (p.includes("/brand/influ/rejected")) return "rejected";
  return "all";
}

function titleCase(s: string) {
  const v = String(s ?? "").trim();
  if (!v) return v;
  return v[0].toUpperCase() + v.slice(1);
}

function toHandle(v: unknown) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s.startsWith("@") ? s : `@${s}`;
}

// ---------------- Applicants mapping (ApplyCampaign) ----------------
function normalizeApplicantStatus(s: unknown): ApplicantStatus {
  const x = String(s ?? "").toLowerCase().trim();
  if (x === "shortlisted") return "shortlisted";
  if (x === "undecided") return "undecided";
  if (x === "active") return "active";
  if (x === "rejected") return "rejected";
  return "applied";
}

function mapApplicantToRow(a: any): InfluencerRow {
  const influencerId = String(a?.influencerId ?? "").trim();
  const name = String(a?.influencerName ?? "Influencer").trim();

  const statusRaw = normalizeApplicantStatus(a?.status);
  const statusLabel = titleCase(statusRaw);

  const appliedAtRaw = a?.appliedAt ? String(a.appliedAt) : "";
  const appliedDate = appliedAtRaw ? appliedAtRaw.slice(0, 10) : "—";

  const row: any = {
    id: influencerId,
    profile: { name, handle: "—" },
    category: "—",
    followers: 0,
    engagement: 0,
    appliedDate,
    status: statusLabel,
    budget: "—",

    __source: "applicant",
    __rawStatus: statusRaw as ApplicantStatus,
  };

  return row as InfluencerRow;
}

// ---------------- Invitations mapping (Invitation) ----------------
function normalizeInviteStatus(s: unknown): "invited" | "accepted" | "declined" | "cancelled" {
  const x = String(s ?? "").toLowerCase().trim();
  if (x === "accepted") return "accepted";
  if (x === "declined") return "declined";
  if (x === "cancelled") return "cancelled";
  return "invited";
}

function mapInviteToRow(x: any): InfluencerRow {
  const inf = x?.influencer ?? {};
  const id = String(inf?._id ?? x?.influencerId ?? "").trim();

  const name = String(inf?.name ?? inf?.fullName ?? inf?.profile?.name ?? "Unknown").trim();
  const handle = toHandle(inf?.handle ?? inf?.username ?? inf?.instagramHandle ?? inf?.profile?.handle);

  const category = String(inf?.categories?.[0]?.name ?? inf?.category?.name ?? inf?.categoryName ?? "—").trim();

  const followers = Number(inf?.followers ?? inf?.followerCount ?? inf?.followersCount ?? 0) || 0;
  const engagement = Number(inf?.engagement ?? inf?.engagementRate ?? inf?.er ?? 0) || 0;

  const invitedAtRaw = x?.invitedAt ? String(x.invitedAt) : "";
  const appliedDate = invitedAtRaw ? invitedAtRaw.slice(0, 10) : "—";

  const st = normalizeInviteStatus(x?.status);
  const statusLabel = titleCase(st); // Invited / Accepted / Declined / Cancelled

  const row: any = {
    id,
    profile: {
      name,
      handle: handle || "—",
      avatarUrl:
        String(
          inf?.profilePic ??
            inf?.avatarUrl ??
            inf?.profile?.avatarUrl ??
            inf?.photo ??
            inf?.image ??
            ""
        ).trim() || undefined,
    },
    category,
    followers,
    engagement,
    appliedDate,
    status: statusLabel,
    budget: "—",

    __source: "invite",
    __inviteStatus: st,
  };

  return row as InfluencerRow;
}

export default function InfluencerList() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = useMemo(() => getTabFromPath(pathname), [pathname]);

  const [filters, setFilters] = useState<FilterState>({
    "Influencer Type": "",
    "Engagement Rate": "",
    Follower: "",
    Category: [],
    Platform: [],
    Date: "",
  });

  const [search, setSearch] = useState("");
  const [sortValue, setSortValue] = useState("Priority");

  // ✅ applicants rows (server filtered by status)
  const [applicantRows, setApplicantRows] = useState<InfluencerRow[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [errApplicants, setErrApplicants] = useState("");

  // ✅ invite rows (only for ALL + SHORTLISTED tabs)
  const [inviteRows, setInviteRows] = useState<InfluencerRow[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [errInvites, setErrInvites] = useState("");

  const [brandId, setBrandId] = useState("");

  // ✅ client-side load more
  const [visibleCount, setVisibleCount] = useState(PAGE_LIMIT);
  const [loadingMore, setLoadingMore] = useState(false);

  const campaignId = useMemo(() => {
    const q1 = searchParams.get("campaignId");
    const q2 = searchParams.get("id");
    return String(q1 ?? q2 ?? "").trim();
  }, [searchParams]);

  useEffect(() => {
    const id =
      localStorage.getItem("brandId") ||
      localStorage.getItem("brandID") ||
      localStorage.getItem("brand_id") ||
      "";
    setBrandId(id);
  }, []);

  // ✅ send status in applicants API based on tab
  const requestedApplicantStatus: ApplicantStatus | undefined = useMemo(() => {
    // As you requested:
    // - All page -> applied only
    // - Shortlisted page -> shortlisted only
    if (tab === "all") return "applied";
    if (tab === "shortlisted") return "shortlisted";
    if (tab === "active") return "active";
    if (tab === "rejected") return "rejected";
    if (tab === "undecided") return "undecided";
    return undefined;
  }, [tab]);

  // ✅ reset pagination when tab/search changes
  useEffect(() => {
    setVisibleCount(PAGE_LIMIT);
  }, [tab, search]);

  // =========================
  // Fetch Applicants (ApplyCampaign)
  // =========================
  useEffect(() => {
    if (!campaignId) {
      setApplicantRows([]);
      setErrApplicants("campaignId missing in URL (use ?campaignId=...)");
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoadingApplicants(true);
      setErrApplicants("");

      try {
        const res: any = await apiGetApplicantsByCampaign({
          campaignId,
          status: requestedApplicantStatus,
        });

        const applicants = Array.isArray(res?.applicants) ? res.applicants : [];

        const mapped = applicants
          .map(mapApplicantToRow)
          .filter((r: InfluencerRow) => String((r as any)?.id ?? "").trim());

        if (cancelled) return;

        const map = new Map<string, InfluencerRow>();
        mapped.forEach((r: InfluencerRow) => map.set(String((r as any).id), r));
        setApplicantRows(Array.from(map.values()));
      } catch (e) {
        if (!cancelled) setErrApplicants(getApiErrorMessage(e, "Failed to load applicants"));
      } finally {
        if (!cancelled) setLoadingApplicants(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [campaignId, requestedApplicantStatus]);

  // =========================
  // Fetch Invited Influencers (Invitation) ONLY on ALL + SHORTLISTED
  // =========================
  useEffect(() => {
    const needInvites = tab === "all" || tab === "shortlisted";

    if (!needInvites) {
      setInviteRows([]);
      setErrInvites("");
      setLoadingInvites(false);
      return;
    }

    if (!campaignId) {
      setInviteRows([]);
      setErrInvites("campaignId missing in URL (use ?campaignId=...)");
      return;
    }

    if (!brandId) {
      setInviteRows([]);
      setErrInvites("brandId not found. Please login again.");
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoadingInvites(true);
      setErrInvites("");

      try {
        // Fetch ALL pages (safe cap)
        const allItems: any[] = [];
        let page = 1;
        let totalPages = 1;
        const MAX_PAGES = 20; // 20*100 = 2000 max safety

        while (page <= totalPages && page <= MAX_PAGES) {
          const res: any = await apiGetInvitationListByCampaign({
            brandId,
            campaignId,
            page,
            limit: INVITE_PAGE_LIMIT,
          });

          const items = Array.isArray(res?.items) ? res.items : [];
          const meta = res?.meta ?? null;

          allItems.push(...items);

          totalPages = Number(meta?.totalPages ?? 1) || 1;
          if (page >= totalPages) break;
          page += 1;
        }

        const mapped = allItems
          .map(mapInviteToRow)
          .filter((r: InfluencerRow) => String((r as any)?.id ?? "").trim());

        if (cancelled) return;

        const map = new Map<string, InfluencerRow>();
        mapped.forEach((r: InfluencerRow) => map.set(String((r as any).id), r));
        setInviteRows(Array.from(map.values()));
      } catch (e) {
        if (!cancelled) setErrInvites(getApiErrorMessage(e, "Failed to load invited influencers"));
      } finally {
        if (!cancelled) setLoadingInvites(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [tab, brandId, campaignId]);

  // =========================
  // Combine rows:
  // - ALL + SHORTLISTED: invited + applicants (applicant overrides if same influencerId)
  // - other tabs: applicants only
  // =========================
  const combinedRows = useMemo(() => {
    const needInvites = tab === "all" || tab === "shortlisted";
    if (!needInvites) return applicantRows;

    const map = new Map<string, InfluencerRow>();

    // invited first
    inviteRows.forEach((r) => map.set(String((r as any)?.id ?? ""), r));
    // applicants override
    applicantRows.forEach((r) => map.set(String((r as any)?.id ?? ""), r));

    return Array.from(map.values()).filter((r) => String((r as any)?.id ?? "").trim());
  }, [tab, inviteRows, applicantRows]);

  // ✅ Search filter (client-side)
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return combinedRows;

    return combinedRows.filter((r: InfluencerRow) => {
      const name = String((r as any)?.profile?.name ?? "").toLowerCase();
      const handle = String((r as any)?.profile?.handle ?? "").toLowerCase();
      const category = String((r as any)?.category ?? "").toLowerCase();
      return name.includes(q) || handle.includes(q) || category.includes(q);
    });
  }, [combinedRows, search]);

  const visibleRows = useMemo(() => filteredRows.slice(0, visibleCount), [filteredRows, visibleCount]);
  const hasMore = visibleCount < filteredRows.length;

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      setVisibleCount((c) => Math.min(filteredRows.length, c + PAGE_LIMIT));
    } finally {
      setLoadingMore(false);
    }
  };

  // ✅ Tick action: Applied -> Shortlisted (ONLY for applicant rows)
  const handleActionClick = async (row: InfluencerRow) => {
    if (!campaignId) return;

    const src = String((row as any)?.__source ?? "");
    if (src !== "applicant") return;

    const influencerId = String((row as any)?.id ?? "").trim();
    if (!influencerId) return;

    const raw = String((row as any)?.__rawStatus ?? "").toLowerCase();
    if (raw !== "applied") return;

    try {
      await apiUpdateApplicantStatus({
        campaignId,
        influencerId,
        status: "shortlisted",
      });

      // current ALL tab is "applied" list -> remove from applicants list immediately
      setApplicantRows((prev) => prev.filter((r) => String((r as any)?.id ?? "") !== influencerId));

      toast({
        icon: "success",
        title: `${String((row as any)?.profile?.name ?? "Influencer")} shortlisted successfully`,
      });
    } catch (e) {
      toast({ icon: "error", title: getApiErrorMessage(e, "Failed to update status") });
    }
  };

  const loading = loadingApplicants || loadingInvites;
  const err = errApplicants || errInvites;

  const showLoadMore = !loading && !err && visibleRows.length > 0 && hasMore;

  return (
    <>
      <InfluencerFilter
        filters={filters}
        setFilters={setFilters}
        search={search}
        setSearch={setSearch}
        sortValue={sortValue}
        setSortValue={setSortValue}
      />

      <div className="mt-[3.5rem] px-[2rem] pb-[2.5rem]">
        <div className="overflow-hidden rounded-[0.75rem] bg-white">
          {loading ? (
            <div className="p-6 text-sm text-gray-600">Loading influencers...</div>
          ) : err ? (
            <div className="p-6 text-sm text-red-600">{err}</div>
          ) : (
            <InfluencerTable
              rows={visibleRows}
              variant={tab === "shortlisted" ? "shortlisted" : "default"}
              onActionClick={handleActionClick}
            />
          )}

          {showLoadMore && (
            <div className="flex justify-center pb-[2rem] pt-[1.25rem]">
              <Button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="
                  flex
                  h-[2.0625rem]
                  items-center
                  justify-center
                  gap-[0.5rem]
                  rounded-[0.75rem]
                  bg-[#1A1A1A]
                  px-[0.75rem]
                  shadow-[0_2px_4px_-2px_rgba(0,0,0,0.08),0_4px_8px_-2px_rgba(0,0,0,0.04)]
                  text-[#F9F9F9]
                  text-[0.75rem]
                  font-semibold
                  leading-[1.25rem]
                  hover:bg-[#111111]
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                "
              >
                <CircleNotch weight="bold" className={`h-[0.875rem] w-[0.875rem] text-white ${loadingMore ? "animate-spin" : ""}`} />
                <span className="flex items-center justify-center px-[0.25rem]">
                  {loadingMore ? "Loading..." : "Load More"}
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}