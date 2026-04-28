"use client";

import React from "react";
import { Building2, Calendar, Image as ImageIcon, Mail, Pencil, ShieldCheck, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BrandDetail } from "./types";
import { formatDateTime, isDataImage } from "./utils";
import { InfoRow, SectionCard } from "./shared";

export function BrandSettingsTab({ brand }: { brand: BrandDetail }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard
        title="Brand Identity"
        description="Read-only view of the core brand profile values."
      >
        <div className="grid gap-3 p-5">
          <InfoRow label="Brand Name" value={brand.brandName || "—"} icon={Building2} />
          <InfoRow label="Contact Person" value={brand.name || "—"} icon={UserRound} />
          <InfoRow label="Contact Email" value={brand.email || "—"} icon={Mail} />
          <InfoRow label="Industry" value={brand.industry || "—"} icon={Building2} />
          <InfoRow label="Company Size" value={brand.companySize || "—"} icon={Users} />
          <InfoRow label="Proxy Email" value={brand.proxyEmail || "—"} icon={Mail} />
        </div>
      </SectionCard>

      <SectionCard
        title="Security & Account"
        description="Operational account states and timestamps."
      >
        <div className="grid gap-3 p-5">
          <InfoRow
            label="Subscription Status"
            value={brand.subscriptionExpired ? "Expired" : "Active"}
            icon={ShieldCheck}
          />
          <InfoRow
            label="Failed Login Attempts"
            value={brand.failedLoginAttempts ?? 0}
            icon={ShieldCheck}
          />
          <InfoRow
            label="Lock Until"
            value={formatDateTime(brand.lockUntil)}
            icon={Calendar}
          />
          <InfoRow
            label="Created At"
            value={formatDateTime(brand.createdAt)}
            icon={Calendar}
          />
          <InfoRow
            label="Updated At"
            value={formatDateTime(brand.updatedAt)}
            icon={Calendar}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Media"
        description="Current profile image used for the brand."
      >
        <div className="p-5">
          {isDataImage(brand.profilePic) && !brand.isProfilePicSkip ? (
            <img
              src={brand.profilePic}
              alt={brand.brandName}
              className="h-36 w-36 rounded-2xl border border-black/10 object-cover"
            />
          ) : (
            <div className="flex h-36 w-36 items-center justify-center rounded-2xl border border-dashed border-black/10 bg-[#fafafa] text-black/35">
              <ImageIcon className="h-7 w-7" />
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Settings Actions"
        description="UI-ready actions area."
      >
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <Button
            variant="outline"
            className="h-11 rounded-2xl border-black/10 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Brand
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-2xl border-black/10 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Update Access
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}