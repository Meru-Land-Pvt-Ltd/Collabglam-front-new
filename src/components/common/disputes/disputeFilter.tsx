"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDownIcon, XIcon, SearchIcon } from "lucide-react";
import { GavelIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonComp";
import { postFormData } from "@/lib/api";
import { DisputeFormDialog } from "./DisputeFormDialog";

export type Campaign = {
  _id?: string;
  campaignsId?: string;
  campaignTitle?: string;
  productOrServiceName?: string;
};

export function getCampaignId(c: Campaign): string {
  return c.campaignsId || c._id || "";
}

export function getCampaignLabel(c: Campaign): string {
  return c.campaignTitle || c.productOrServiceName || getCampaignId(c);
}

export type Applicant = {
  influencerId: string;
  name?: string;
  handle?: string | null;
};

export type DisputeFilterMode = "brand" | "influencer";

const STATUS_OPTIONS = [
  { value: "0", label: "All" },
  { value: "1", label: "Open" },
  { value: "2", label: "In Review" },
  { value: "3", label: "Awaiting You" },
  { value: "4", label: "Resolved" },
  { value: "5", label: "Rejected" },
];

const DIRECTION_OPTIONS = [
  { value: "all", label: "All disputes" },
  { value: "raised_by_you", label: "Raised by you" },
  { value: "against_you", label: "Raised against you" },
];

function ComboboxFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center gap-1 text-sm text-[#1a1a1a]"
    >
      <span className="font-normal text-[#1a1a1a]">{label}</span>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-0.5 font-normal transition-opacity hover:opacity-70"
      >
        <span>{selected?.label ?? "All"}</span>
        <ChevronDownIcon
          className="size-3.5 text-[#1a1a1a]"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        />
      </button>

      {open ? (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-[#e8e8e8] bg-white py-1"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                value === opt.value
                  ? "bg-transparent font-medium text-[#1a1a1a]"
                  : "font-normal text-[#1a1a1a] hover:bg-[#f5f5f5]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function RaiseDisputeDialog({
  open,
  onOpenChange,
  onSuccess,
  lockedCampaignId,
  mode,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
  lockedCampaignId?: string;
  mode: DisputeFilterMode;
}) {
  return (
    <DisputeFormDialog
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      lockedCampaignId={lockedCampaignId}
      title="Raise a Dispute"
      submitLabel="Submit Dispute"
      mode={mode}
      disableInfluencer={mode === "influencer"}
      influencerDisplayName={mode === "influencer" ? "You" : undefined}
      onSubmit={async ({ brandId, influencerId, values }) => {
        const form = new FormData();

        if (mode === "brand") {
          if (!brandId) {
            throw new Error("Missing brand ID — please log in again.");
          }

          form.append("brandId", brandId);
          form.append("influencerId", values.influencerId);
          form.append("campaignId", values.campaignId);
          form.append("subject", values.subject);
          form.append("description", values.description);
          form.append("issueType", JSON.stringify(values.issueType));

          values.attachments.forEach((file) => {
            form.append("attachments", file);
          });

          await postFormData("/dispute/brand/create", form);
          return;
        }

        if (!influencerId) {
          throw new Error("Missing influencer ID — please log in again.");
        }

        if (!brandId) {
          throw new Error("Missing brand ID for the selected campaign.");
        }

        form.append("brandId", brandId);
        form.append("influencerId", influencerId);
        form.append("campaignId", values.campaignId);
        form.append("subject", values.subject);
        form.append("description", values.description);
        form.append("issueType", JSON.stringify(values.issueType));

        values.attachments.forEach((file) => {
          form.append("attachments", file);
        });

        await postFormData("/dispute/influencer/create", form);
      }}
    />
  );
}

export type DisputeFiltersProps = {
  mode?: DisputeFilterMode;
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  direction: string;
  onDirectionChange: (v: string) => void;
  onDisputeCreated?: () => void;
};

export default function DisputeFilters({
  mode = "brand",
  search,
  onSearchChange,
  status,
  onStatusChange,
  direction,
  onDirectionChange,
  onDisputeCreated,
}: DisputeFiltersProps) {
  const searchParams = useSearchParams();
  const campaignIdFromQuery = (searchParams.get("id") || "").trim();

  const [dialogOpen, setDialogOpen] = useState(false);
  const lastAutoOpenedCampaignRef = useRef<string | null>(null);

  useEffect(() => {
    if (!campaignIdFromQuery) return;
    if (lastAutoOpenedCampaignRef.current === campaignIdFromQuery) return;

    setDialogOpen(true);
    lastAutoOpenedCampaignRef.current = campaignIdFromQuery;
  }, [campaignIdFromQuery]);

  const hasFilters = status !== "0" || direction !== "all";

  const clearAll = () => {
    onStatusChange("0");
    onDirectionChange("all");
  };

  return (
    <>
      <div
        className="mt-[2rem] flex w-full flex-wrap items-center gap-4 bg-white px-8 py-2.5"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');`}</style>

        <ComboboxFilter
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={onStatusChange}
        />

        <ComboboxFilter
          label="Raised By"
          options={DIRECTION_OPTIONS}
          value={direction}
          onChange={onDirectionChange}
        />

        {hasFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-lg border border-[#e2e2e2] bg-white px-3 py-1 text-sm text-[#1a1a1a] transition-colors hover:bg-[#f5f5f5]"
          >
            Clear <XIcon className="size-3.5" />
          </button>
        ) : null}

        <div className="flex-1" />

        <div className="flex h-[2.5rem] w-[14.5625rem] items-center gap-2 rounded-lg border border-neutral-200 bg-white transition-all focus-within:border-[#1a1a1a] focus-within:ring-2 focus-within:ring-[#1a1a1a]/10">
          <Input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-full flex-1 border-none bg-transparent p-0 text-sm text-[#1a1a1a] shadow-none outline-none placeholder:text-[#bbb] ring-0 focus-visible:border-none focus-visible:ring-0"
          />
          <SearchIcon className="mr-4 size-4 shrink-0 text-[#bbb]" />
        </div>

        <Button
          onClick={() => setDialogOpen(true)}
          className="!h-[2.5rem] !w-[9.5rem] !rounded-[0.75rem] !px-0 flex items-center justify-center"
        >
          <div className="flex items-center gap-2 whitespace-nowrap">
            <GavelIcon size={16} />
            <span>Raise Dispute</span>
          </div>
        </Button>
      </div>

      <RaiseDisputeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onDisputeCreated}
        lockedCampaignId={campaignIdFromQuery || undefined}
        mode={mode}
      />
    </>
  );
}