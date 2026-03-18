"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import InfluencerFilter, { FilterState } from "./InfluencerFilter";
import {
  InfluencerTable,
  type InfluencerRow,
} from "@/components/ui/brand/Influencertable";

import { Button } from "@/components/ui/button";
import { CircleNotch } from "@phosphor-icons/react";

import {
  apiGetListByCampaign,
  apiGetCampaignInvitationsByBrandAndCampaign,
  apiSetApplicantDecisionStatus,
  type ApplicantDecisionField,
  getApiErrorMessage,
} from "@/app/brand/services/brandApi";

type Tab = "all" | "active" | "shortlisted" | "undecided" | "rejected";

const PAGE_LIMIT = 20;

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

function getApplicantDisplayStatus(a: any) {
  if (Number(a?.isAccepted) === 1) return "Active";
  if (Number(a?.isRejected) === 1) return "Rejected";
  if (Number(a?.isShortlisted) === 1) return "Shortlisted";
  if (Number(a?.isUndicided) === 1) return "Undecided";
  if (Number(a?.isAssigned) === 1) return "Shortlisted";
  return "Applied";
}

// ---------------- Applicants mapping ----------------
function mapApplicantToRow(a: any): InfluencerRow {
  const influencerId = String(a?.influencerId ?? "").trim();
  const name = String(a?.name ?? "Influencer").trim();

  const createdAtRaw = a?.createdAt ? String(a.createdAt) : "";
  const appliedDate = createdAtRaw ? createdAtRaw.slice(0, 10) : "—";

  const row: any = {
    id: influencerId,
    profile: {
      name,
      handle: a?.handle ? toHandle(a.handle) : "—",
    },
    category: String(a?.category ?? "—").trim() || "—",
    followers: Number(a?.audienceSize ?? 0) || 0,
    engagement: 0,
    appliedDate,
    status: getApplicantDisplayStatus(a),
    budget: Number(a?.feeAmount ?? 0) > 0 ? String(a.feeAmount) : "—",

    __source: "applicant",
    __raw: a,
  };

  return row as InfluencerRow;
}

// ---------------- Invitations mapping ----------------
function normalizeInviteStatus(
  s: unknown
): "invited" | "accepted" | "declined" | "cancelled" {
  const x = String(s ?? "").toLowerCase().trim();

  if (x === "accepted") return "accepted";
  if (x === "declined" || x === "reject" || x === "rejected") return "declined";
  if (x === "cancelled") return "cancelled";
  return "invited";
}

function mapInviteToRow(x: any): InfluencerRow {
  const id = String(x?.influencerId ?? "").trim();
  const name = String(x?.influencerName ?? "Unknown").trim();
  const handle = toHandle(x?.handle);

  const invitedAtRaw = x?.sentAt ? String(x.sentAt) : "";
  const appliedDate = invitedAtRaw ? invitedAtRaw.slice(0, 10) : "—";

  const st = normalizeInviteStatus(x?.status);
  const statusLabel = titleCase(st);

  const row: any = {
    id,
    profile: {
      name,
      handle: handle || "—",
    },
    category: "—",
    followers: 0,
    engagement: 0,
    appliedDate,
    status: statusLabel,
    budget: "—",

    __source: "invite",
    __inviteStatus: st,
    __raw: x,
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

  const [applicantRows, setApplicantRows] = useState<InfluencerRow[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [errApplicants, setErrApplicants] = useState("");

  const [inviteRows, setInviteRows] = useState<InfluencerRow[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [errInvites, setErrInvites] = useState("");

  const [brandId, setBrandId] = useState("");

  const [visibleCount, setVisibleCount] = useState(PAGE_LIMIT);
  const [loadingMore, setLoadingMore] = useState(false);

  const [updatingDecisionId, setUpdatingDecisionId] = useState<string | null>(null);

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

  useEffect(() => {
    setVisibleCount(PAGE_LIMIT);
  }, [tab, search]);

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
        const res: any = await apiGetListByCampaign({
          campaignId,
          page: 1,
          limit: 100,
          search: search.trim() || undefined,
        });

        const influencers = Array.isArray(res?.influencers) ? res.influencers : [];

        const mapped = influencers
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
  }, [campaignId, search]);

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
        const res: any = await apiGetCampaignInvitationsByBrandAndCampaign({
          brandId,
          campaignId,
        });

        const items = Array.isArray(res?.invitations) ? res.invitations : [];

        const mapped = items
          .map(mapInviteToRow)
          .filter((r: InfluencerRow) => String((r as any)?.id ?? "").trim());

        if (cancelled) return;

        const map = new Map<string, InfluencerRow>();
        mapped.forEach((r: InfluencerRow) => map.set(String((r as any).id), r));
        setInviteRows(Array.from(map.values()));
      } catch (e) {
        if (!cancelled) {
          setErrInvites(getApiErrorMessage(e, "Failed to load invited influencers"));
        }
      } finally {
        if (!cancelled) setLoadingInvites(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [tab, brandId, campaignId]);

  const handleApplicantDecision = async (
    row: InfluencerRow,
    action: ApplicantDecisionField
  ) => {
    const source = String((row as any)?.__source ?? "");
    if (source !== "applicant") return;

    if (!campaignId || !row.id) return;

    try {
      setUpdatingDecisionId(row.id);

      const res = await apiSetApplicantDecisionStatus({
        campaignId,
        influencerId: row.id,
        field: action,
      });

      const updatedApplicant = res?.applicant;
      if (!updatedApplicant) return;

      setApplicantRows((prev) =>
        prev.map((r) => {
          if (r.id !== row.id) return r;

          const prevRaw = (r as any)?.__raw ?? {};

          const nextRaw = {
            ...prevRaw,
            isShortlisted: Number(updatedApplicant.isShortlisted ?? 0),
            isUndicided: Number(updatedApplicant.isUndicided ?? 0),
            isRejected: Number(updatedApplicant.isRejected ?? 0),
          };

          return {
            ...r,
            status: getApplicantDisplayStatus(nextRaw),
            __raw: nextRaw,
          } as InfluencerRow;
        })
      );
    } catch (e) {
      alert(getApiErrorMessage(e, "Failed to update applicant status"));
    } finally {
      setUpdatingDecisionId(null);
    }
  };

  const combinedRows = useMemo(() => {
    const needInvites = tab === "all" || tab === "shortlisted";
    if (!needInvites) return applicantRows;

    const map = new Map<string, InfluencerRow>();

    inviteRows.forEach((r) => map.set(String((r as any)?.id ?? ""), r));
    applicantRows.forEach((r) => map.set(String((r as any)?.id ?? ""), r));

    return Array.from(map.values()).filter((r) => String((r as any)?.id ?? "").trim());
  }, [tab, inviteRows, applicantRows]);

  const tabFilteredRows = useMemo(() => {
    if (tab === "all") return combinedRows;

    return combinedRows.filter((row: InfluencerRow) => {
      const source = String((row as any)?.__source ?? "");

      if (source === "invite") {
        const inviteStatus = String((row as any)?.__inviteStatus ?? "").toLowerCase();
        if (tab === "shortlisted") return inviteStatus === "invited" || inviteStatus === "accepted";
        if (tab === "active") return inviteStatus === "accepted";
        if (tab === "rejected") return inviteStatus === "declined" || inviteStatus === "cancelled";
        if (tab === "undecided") return false;
        return true;
      }

      const raw = (row as any)?.__raw ?? {};
      const isAccepted = Number(raw?.isAccepted) === 1;
      const isRejected = Number(raw?.isRejected) === 1;
      const isShortlisted = Number(raw?.isShortlisted) === 1;
      const isUndicided = Number(raw?.isUndicided) === 1;
      const isAssigned = Number(raw?.isAssigned) === 1;

      if (tab === "shortlisted") {
        return (isShortlisted || isAssigned) && !isAccepted && !isRejected;
      }

      if (tab === "active") return isAccepted;
      if (tab === "rejected") return isRejected;
      if (tab === "undecided") return isUndicided;
      return true;
    });
  }, [combinedRows, tab]);

  const visibleRows = useMemo(() => {
    return tabFilteredRows.slice(0, visibleCount);
  }, [tabFilteredRows, visibleCount]);

  const hasMore = visibleCount < tabFilteredRows.length;

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      setVisibleCount((c) => Math.min(tabFilteredRows.length, c + PAGE_LIMIT));
    } finally {
      setLoadingMore(false);
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
              onActionClick={handleApplicantDecision}
            />
          )}

          {updatingDecisionId && (
            <div className="px-6 pb-2 text-xs text-gray-500">
              Updating applicant status...
            </div>
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
                <CircleNotch
                  weight="bold"
                  className={`h-[0.875rem] w-[0.875rem] text-white ${loadingMore ? "animate-spin" : ""}`}
                />
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