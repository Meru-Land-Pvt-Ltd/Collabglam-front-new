"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { BrandDetail } from "./types";
import { getInitials, isDataImage } from "./utils";

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const styles = {
    neutral: "border-black/10 bg-black/[0.04] text-[#1a1a1a]",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold ${styles[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
      {label}
    </span>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-none">
      <div className="border-b border-black/8 px-5 py-4 md:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[20px] font-black tracking-tight text-[#1a1a1a]">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-sm font-medium text-black/55">{description}</p>
            ) : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      </div>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

export function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-[24px] border border-black/10 bg-white shadow-none">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/45">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-black text-[#1a1a1a]">{value}</h3>
          <p className="mt-1 text-xs font-medium text-black/50">{hint}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/[0.04] text-black/70">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-black/8 bg-[#fafafa] px-4 py-3">
      {Icon ? (
        <div className="mt-0.5 text-black/45">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/40">
          {label}
        </p>
        <p className="mt-1 text-sm font-extrabold text-[#1a1a1a]">{value || "—"}</p>
      </div>
    </div>
  );
}

export function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-[#fafafa] px-5 py-10 text-center">
      <p className="text-base font-black text-[#1a1a1a]">{title}</p>
      <p className="mt-2 text-sm font-medium text-black/50">{description}</p>
    </div>
  );
}

export function BrandAvatar({ brand }: { brand: BrandDetail }) {
  const initials = getInitials(brand);

  if (isDataImage(brand.profilePic) && !brand.isProfilePicSkip) {
    return (
      <img
        src={brand.profilePic}
        alt={brand.brandName}
        className="h-16 w-16 rounded-2xl border border-black/10 object-cover"
      />
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-black/[0.04] text-lg font-black text-[#1a1a1a]">
      {initials}
    </div>
  );
}