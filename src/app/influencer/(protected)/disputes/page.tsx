"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { post } from "@/lib/api";
import {
  DisputeTable,
  type Dispute,
} from "@/components/common/disputes/disputesTable";
import DisputeFilters from "@/components/common/disputes/disputeFilter";
// import { apiRevokeDispute as apiRevokeInfluencerDispute } from "@/app/influencer/services/influencerApi";

type ListResp = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  disputes: Dispute[];
};

type ApiErrorShape = {
  response?: {
    data?: {
      message?: unknown;
    };
  };
  message?: unknown;
};

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) {
    return fallback;
  }

  const candidate = error as ApiErrorShape;

  if (typeof candidate.response?.data?.message === "string") {
    return candidate.response.data.message;
  }

  if (typeof candidate.message === "string") {
    return candidate.message;
  }

  return fallback;
}

const InfluencerDisputesPage: React.FC = () => {
  const [influencerId, setInfluencerId] = useState<string | null>(null);
  const [influencerLoaded, setInfluencerLoaded] = useState(false);

  const [status, setStatus] = useState<string>("0");
  const [direction, setDirection] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [rows, setRows] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setInfluencerId(window.localStorage.getItem("influencerId"));
    setInfluencerLoaded(true);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [status, direction]);

  const fetchDisputes = useCallback(async (): Promise<void> => {
    if (!influencerLoaded) return;

    if (!influencerId) {
      setError("Influencer ID not found. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        influencerId,
        page,
        limit: PAGE_SIZE,
      };

      const statusNum = Number.parseInt(status, 10);
      if (!Number.isNaN(statusNum) && statusNum > 0) {
        body.status = statusNum;
      }

      if (direction === "raised_by_you") {
        body.appliedBy = "influencer";
      } else if (direction === "against_you") {
        body.appliedBy = "brand";
      }

      if (debouncedSearch) {
        body.search = debouncedSearch;
      }

      const data = await post<ListResp>("/dispute/influencer/list", body);

      setRows(data.disputes || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (fetchError: unknown) {
      setError(getErrorMessage(fetchError, "Failed to load disputes."));
    } finally {
      setLoading(false);
    }
  }, [influencerLoaded, influencerId, page, status, direction, debouncedSearch]);

  useEffect(() => {
    if (!influencerLoaded) return;
    void fetchDisputes();
  }, [influencerLoaded, fetchDisputes]);

  const handleDisputeCreated = useCallback(() => {
    if (page !== 1) {
      setPage(1);
      return;
    }

    void fetchDisputes();
  }, [page, fetchDisputes]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 5;

    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);

    start = Math.max(1, end - maxButtons + 1);

    for (let current = start; current <= end; current += 1) {
      pages.push(current);
    }

    return pages;
  }, [page, totalPages]);

  return (
    <div className="mx-auto w-full">
      <Suspense fallback={<div>Loading filters...</div>}>
        <DisputeFilters
          mode="influencer"
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          direction={direction}
          onDirectionChange={setDirection}
          onDisputeCreated={handleDisputeCreated}
        />
      </Suspense>

      <DisputeTable
        rows={rows}
        loading={loading}
        error={error}
        onRetry={() => {
          void fetchDisputes();
        }}
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        pageNumbers={pageNumbers}
        onPageChange={setPage}
        viewBasePath="/influencer/disputes"
        onRevokeDispute={async (disputeId: string) => {
          if (!influencerId) {
            throw new Error("Influencer ID not found. Please log in again.");
          }

          // await apiRevokeInfluencerDispute({
          //   disputeId,
          //   influencerId,
          // });
        }}
      />
    </div>
  );
};

export default InfluencerDisputesPage;