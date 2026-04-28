"use client";

import React from "react";
import { ArrowLeft, Calendar, Pencil, Plus, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BrandDetail } from "./types";
import { formatDate } from "./utils";
import { BrandAvatar, MetricCard, StatusPill } from "./shared";

export function BrandViewHeader({
  brand,
  onBack,
  onEdit,
  onCreateCampaign,
}: {
  brand: BrandDetail;
  onBack: () => void;
  onEdit: () => void;
  onCreateCampaign: () => void;
}) {
  const currentPlanName = brand.subscription?.planName || brand.planName || "—";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-black/40">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-black/40 transition hover:text-[#1a1a1a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span>›</span>
        <span>Brands</span>
        <span>›</span>
        <span className="text-[#1a1a1a]">{brand.brandName}</span>
      </div>

      <Card className="rounded-[28px] border border-black/10 bg-white shadow-none">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <BrandAvatar brand={brand} />

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight text-[#1a1a1a] md:text-4xl">
                    {brand.brandName}
                  </h1>
                  {brand.subscriptionExpired ? (
                    <StatusPill label="Expired" tone="danger" />
                  ) : (
                    <StatusPill label="Active" tone="success" />
                  )}
                </div>

                <p className="mt-2 text-sm font-medium text-black/55">
                  Manage brand details, subscription, campaigns, invoices, activity, and settings.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusPill label={`Plan: ${currentPlanName}`} />
                  <StatusPill
                    label={`Wallet: $${Number(brand.walletBalance || 0).toFixed(2)}`}
                  />
                  {brand.fullyManagedSubscription ? (
                    <StatusPill label="Fully Managed" tone="success" />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="rounded-2xl border-black/10 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
                onClick={onEdit}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>

              <Button
                className="rounded-2xl bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
                onClick={onCreateCampaign}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Created"
              value={formatDate(brand.createdAt)}
              hint="Brand onboarding date"
              icon={Calendar}
            />
            <MetricCard
              title="Industry"
              value={brand.industry || "—"}
              hint="Current vertical"
              icon={Users}
            />
            <MetricCard
              title="Company Size"
              value={brand.companySize || "—"}
              hint="Reported company size"
              icon={Users}
            />
            <MetricCard
              title="Wallet"
              value={`$${Number(brand.walletBalance || 0).toFixed(2)}`}
              hint="Current balance"
              icon={Wallet}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}