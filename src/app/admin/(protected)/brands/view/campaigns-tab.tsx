"use client";

import React from "react";
import { ChevronDown, ChevronUp, Eye, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Campaign } from "./types";
import { formatDate } from "./utils";
import { EmptyPanel, SectionCard, StatusPill } from "./shared";

export function BrandCampaignsTab({
  brandId,
  campaigns,
  loadingCampaigns,
  errorCampaigns,
  campaignsPage,
  campaignsTotalPages,
  setCampaignsPage,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortBy,
  sortAsc,
  toggleSort,
}: {
  brandId: string;
  campaigns: Campaign[];
  loadingCampaigns: boolean;
  errorCampaigns: string | null;
  campaignsPage: number;
  campaignsTotalPages: number;
  setCampaignsPage: React.Dispatch<React.SetStateAction<number>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: 0 | 1 | 2;
  setStatusFilter: React.Dispatch<React.SetStateAction<0 | 1 | 2>>;
  sortBy: keyof Campaign | "startDate" | "endDate" | "status";
  sortAsc: boolean;
  toggleSort: (key: keyof Campaign | "startDate" | "endDate" | "status") => void;
}) {
  const router = useRouter();

  return (
    <SectionCard
      title="Campaigns"
      description="Manage campaigns created for this brand."
      action={
        <Button
          className="rounded-2xl bg-[#1a1a1a] text-sm font-extrabold text-white hover:bg-[#1a1a1a]/90"
          onClick={() => router.push(`/admin/brands/create-campaign?brandId=${brandId}`)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      }
    >
      <div className="space-y-5 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCampaignsPage(1);
              }}
              className="h-11 rounded-2xl border-black/10 bg-white pl-11 text-sm font-semibold"
            />
          </div>

          <div className="w-full max-w-[180px]">
            <Select
              value={statusFilter.toString()}
              onValueChange={(value) => {
                setStatusFilter(Number(value) as 0 | 1 | 2);
                setCampaignsPage(1);
              }}
            >
              <SelectTrigger className="h-11 rounded-2xl border-black/10 bg-white text-sm font-semibold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="0">All</SelectItem>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="2">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loadingCampaigns ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-8 w-full rounded-xl" />
            ))}
          </div>
        ) : errorCampaigns ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {errorCampaigns}
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyPanel
            title="No campaigns found"
            description="Try adjusting the filters or create a new campaign for this brand."
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-black/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-black/6">
                    {[
                      { label: "Name", key: "productOrServiceName" as const, align: "left" },
                      { label: "Goal", key: "goal" as const, align: "left" },
                      { label: "Start", key: "startDate" as const, align: "center" },
                      { label: "End", key: "endDate" as const, align: "center" },
                      { label: "Applicants", key: "applicantCount" as const, align: "center" },
                      { label: "Status", key: "status" as const, align: "center" },
                      { label: "Open", key: undefined, align: "right" },
                    ].map((col) => (
                      <TableHead
                        key={col.label}
                        onClick={() => col.key && toggleSort(col.key)}
                        className={`py-4 text-xs font-black uppercase tracking-[0.14em] text-black/45 ${
                          col.key ? "cursor-pointer select-none" : ""
                        } ${
                          col.align === "center"
                            ? "text-center"
                            : col.align === "right"
                              ? "text-right"
                              : "text-left"
                        }`}
                      >
                        <div
                          className={`flex items-center gap-1 ${
                            col.align === "center"
                              ? "justify-center"
                              : col.align === "right"
                                ? "justify-end"
                                : "justify-start"
                          }`}
                        >
                          {col.label}
                          {col.key && sortBy === col.key ? (
                            sortAsc ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )
                          ) : null}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.campaignsId} className="border-black/6">
                      <TableCell className="py-4 text-sm font-black text-[#1a1a1a]">
                        {campaign.productOrServiceName || "—"}
                      </TableCell>
                      <TableCell className="py-4 text-sm font-semibold text-black/65">
                        {campaign.goal || "—"}
                      </TableCell>
                      <TableCell className="py-4 text-center text-sm font-semibold text-black/60">
                        {formatDate(campaign.timeline?.startDate)}
                      </TableCell>
                      <TableCell className="py-4 text-center text-sm font-semibold text-black/60">
                        {formatDate(campaign.timeline?.endDate)}
                      </TableCell>
                      <TableCell className="py-4 text-center text-sm font-black text-[#1a1a1a]">
                        {campaign.applicantCount ?? 0}
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        {campaign.isActive === 1 ? (
                          <StatusPill label="Active" tone="success" />
                        ) : (
                          <StatusPill label="Inactive" tone="warning" />
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <Button
                          size="sm"
                          className="rounded-full bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
                          onClick={() =>
                            router.push(`/admin/campaigns/view?id=${campaign.campaignsId}`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {campaignsTotalPages > 1 ? (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={campaignsPage === 1}
                  onClick={() => setCampaignsPage((p) => Math.max(1, p - 1))}
                  className="rounded-full border-black/10 text-[#1a1a1a]"
                >
                  Previous
                </Button>
                <span className="text-sm font-black text-black/55">
                  {campaignsPage} / {campaignsTotalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={campaignsPage === campaignsTotalPages}
                  onClick={() =>
                    setCampaignsPage((p) => Math.min(campaignsTotalPages, p + 1))
                  }
                  className="rounded-full border-black/10 text-[#1a1a1a]"
                >
                  Next
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </SectionCard>
  );
}