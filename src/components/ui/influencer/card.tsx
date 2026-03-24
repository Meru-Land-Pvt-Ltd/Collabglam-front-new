"use client";

import * as React from "react";
import { Button } from "@/components/ui/buttonComp";

/**
 * ✅ ManualForm (single source of truth for both UI + data shape)
 */
type IdLabelMap = Record<string, string>;

export type ManualForm = {
  title?: string;
  description?: string;

  categoryName?: string;

  subcategories?: string[];
  targetCountry?: string[];
  targetAgeGroups?: string[];
  goals?: string[];
  platforms?: string[];
  hashtags?: string[];

  campaignType?: string;
  campaignBudget?: number;
};

export type PreviewMeta = {
  subcategoriesMap?: IdLabelMap;
  countryMap?: IdLabelMap;
  ageMap?: IdLabelMap;
  goalsMap?: IdLabelMap;
  hashtagsMap?: IdLabelMap;

  // optional override
  campaignBudget?: number;
};

export type CampaignCardProps = {
  form: ManualForm;
  meta?: PreviewMeta;

  imageUrl: string;
  imageAlt?: string;

  // optional UI-only bits (not from ManualForm)
  brandLogoUrl?: string;
  brandLogoAlt?: string;

  onView?: () => void;
  onSave?: () => void;
  onMore?: () => void;
  onNext?: () => void;
  onPlay?: () => void;

  className?: string;
};

type Avatar = { src: string; alt?: string }; // (kept if you later want it)

/* ---------------- helpers ---------------- */

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

function stripLeadingEmoji(label: string) {
  return String(label || "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

function idsToLabels(
  ids: string[] | undefined,
  map: IdLabelMap | undefined,
  clean = (s: string) => s
) {
  const m = map ?? {};
  return (ids ?? []).map((id) => clean(m[id] ?? "")).filter(Boolean);
}

function firstAndExtra(labels: string[]) {
  const first = labels[0] ?? "";
  const extra = Math.max(0, labels.length - 1);
  return { first, extra };
}

function pillText(first: string, extra: number) {
  return extra > 0 ? `${first} +${extra}` : first;
}

function formatBudget(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n.toLocaleString();
}

/* ---------------- icons ---------------- */

function IconAge(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M7.69531 4.6875C8.30234 4.6875 8.84102 5.05586 9.17969 5.625" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M0.625 5.625C0.843124 5.33371 1.12617 5.09731 1.45166 4.93457C1.77714 4.77182 2.1361 4.68723 2.5 4.6875"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 7.1875C5.86294 7.1875 6.5625 6.48794 6.5625 5.625C6.5625 4.76206 5.86294 4.0625 5 4.0625C4.13706 4.0625 3.4375 4.76206 3.4375 5.625C3.4375 6.48794 4.13706 7.1875 5 7.1875Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.8125 8.4375C3.03683 8.05682 3.35663 7.74127 3.74027 7.52204C4.12392 7.30281 4.55813 7.1875 5 7.1875C5.44187 7.1875 5.87608 7.30281 6.25973 7.52204C6.64337 7.74127 6.96317 8.05682 7.1875 8.4375"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.28906 3.125C6.3475 2.89866 6.46824 2.69324 6.63757 2.53207C6.8069 2.3709 7.01802 2.26045 7.24697 2.21325C7.47592 2.16605 7.71352 2.18399 7.93279 2.26505C8.15205 2.3461 8.34419 2.48701 8.48739 2.67179C8.63059 2.85656 8.7191 3.07778 8.74288 3.31033C8.76667 3.54289 8.72476 3.77745 8.62193 3.98738C8.51909 4.19731 8.35945 4.3742 8.16113 4.49796C7.96281 4.62172 7.73377 4.68738 7.5 4.6875"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.49986 4.6875C2.26609 4.68738 2.03705 4.62172 1.83873 4.49796C1.64041 4.3742 1.48077 4.19731 1.37793 3.98738C1.2751 3.77745 1.23319 3.54289 1.25697 3.31033C1.28076 3.07778 1.36927 2.85656 1.51247 2.67179C1.65567 2.48701 1.84781 2.3461 2.06707 2.26505C2.28634 2.18399 2.52393 2.16605 2.75289 2.21325C2.98184 2.26045 3.19296 2.3709 3.36229 2.53207C3.53161 2.69324 3.65235 2.89866 3.7108 3.125"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 22s7-4.438 7-11a7 7 0 1 0-14 0c0 6.562 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconPlay(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9.5 8.8v6.4c0 .7.8 1.1 1.4.7l5.2-3.2c.6-.4.6-1.1 0-1.5l-5.2-3.2c-.6-.4-1.4 0-1.4.8Z" fill="currentColor" />
    </svg>
  );
}

function IconChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------- component ---------------- */

export default function CampaignCard({
  form,
  meta,
  imageUrl,
  imageAlt = "Campaign image",
  brandLogoUrl,
  brandLogoAlt = "Brand logo",
  onView,
  onSave,
  onMore,
  onNext,
  onPlay,
  className,
}: CampaignCardProps) {
  // ✅ derive UI labels ONLY from ManualForm + meta maps
  const badgeLabels = React.useMemo(
    () => idsToLabels(form.subcategories, meta?.subcategoriesMap),
    [form.subcategories, meta?.subcategoriesMap]
  );
  const badge = React.useMemo(() => firstAndExtra(badgeLabels), [badgeLabels]);

  const ageLabels = React.useMemo(
    () => idsToLabels(form.targetAgeGroups, meta?.ageMap),
    [form.targetAgeGroups, meta?.ageMap]
  );
  const age = React.useMemo(() => firstAndExtra(ageLabels), [ageLabels]);

  const countryLabels = React.useMemo(
    () => idsToLabels(form.targetCountry, meta?.countryMap, stripLeadingEmoji),
    [form.targetCountry, meta?.countryMap]
  );
  const country = React.useMemo(() => firstAndExtra(countryLabels), [countryLabels]);

  const category = (form.categoryName ?? "").trim();
  const title = (form.title ?? "").trim();
  const description = (form.description ?? "").trim();

  const campaignType = (form.campaignType ?? "").trim();

  const budget = Number(meta?.campaignBudget ?? form.campaignBudget ?? 0);
  const priceText = budget > 0 ? `$${formatBudget(budget)}` : "—";

  return (
    <div
      className={cn(
        "w-full rounded-[28px] bg-white overflow-hidden border border-[#1A1A1A]",
        "flex flex-col h-full",
        className
      )}
    >
      {/* IMAGE HEADER */}
      <div className="relative h-[190px] bg-gray-100">
        <img src={imageUrl} alt={imageAlt} className="h-full w-full object-cover" loading="lazy" />

        {/* ✅ Top badge = campaignType */}
        {campaignType ? (
          <div className="absolute right-4 top-4">
            <span
              className="rounded-full border border-yellow-300 px-4 py-1 text-sm font-semibold text-gray-900"
              style={{ backgroundColor: "rgba(255, 249, 230, 1)" }}
              title={campaignType}
            >
              {campaignType}
            </span>
          </div>
        ) : null}

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Button
            variant="raised"
            size="sm"
            leftIcon={<IconChevronRight />}
            onClick={onNext}
            aria-label="Next"
            className="my-0 rounded-full px-0 h-10 w-10 bg-white/95 hover:bg-white"
          />
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Button
            variant="raised"
            size="lg"
            leftIcon={<IconPlay />}
            onClick={onPlay}
            aria-label="Play"
            className="my-0 rounded-full px-0 h-12 w-12 bg-white/95 hover:bg-white"
          />
        </div>

        {/* Brand logo container (UI-only) */}
        {brandLogoUrl ? (
          <div className="absolute left-4 bottom-[-22px] bg-white p-3" style={{ borderRadius: "16px 16px 0px 0px" }}>
            <img src={brandLogoUrl} alt={brandLogoAlt} className="h-7 w-14 object-contain" loading="lazy" />
          </div>
        ) : null}
      </div>

      {/* BODY */}
      <div className="px-4 2xl:px-6 pt-7 2xl:pt-8 pb-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {/* ✅ Category */}
            {category ? (
              <span className="rounded-full border border-[#1A1A1A] bg-white px-3 py-1 text-xs font-semibold text-gray-800">
                {category}
              </span>
            ) : null}

            {/* ✅ Age groups */}
            {age.first ? (
              <span
                className="rounded-full border border-[#1A1A1A] bg-white px-3 py-1 text-xs font-semibold text-gray-800 inline-flex items-center gap-2"
                title={ageLabels.join(", ")}
              >
                <IconAge className="h-[10px] w-[10px] text-gray-900" />
                {pillText(age.first, age.extra)}
              </span>
            ) : null}

            {/* ✅ Optional: Subcategories */}
            {badge.first ? (
              <span
                className="rounded-full border border-[#1A1A1A] bg-white px-3 py-1 text-xs font-semibold text-gray-800"
                title={badgeLabels.join(", ")}
              >
                {pillText(badge.first, badge.extra)}
              </span>
            ) : null}
          </div>

          {/* ✅ More button WITHOUT border outline */}
          <Button
            variant="outline"
            size="sm"
            onClick={onMore}
            aria-label="More"
            className="my-0 rounded-full px-0 h-9 w-9 flex-shrink-0 border-0 shadow-none hover:bg-gray-100"
          >
            …
          </Button>
        </div>

        <h3 className="mt-4 text-[16px] 2xl:text-lg font-extrabold text-gray-900 leading-snug">
          {title || "—"}
        </h3>

        {description ? (
          <p
            className="mt-2 text-sm text-gray-400"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </p>
        ) : null}

        {/* ✅ Countries */}
        {country.first ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-700 min-w-0" title={countryLabels.join(", ")}>
            <IconPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="min-w-0 truncate">
              {country.first}
              {country.extra > 0 ? ` · +${country.extra}` : ""}
            </span>
          </div>
        ) : null}

        {/* FOOTER */}
        <div className="mt-auto">
          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <div className="font-extrabold text-gray-900 leading-none whitespace-nowrap text-[clamp(16px,1.6vw,24px)]">
                  {priceText}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 min-w-0">
                <Button
                  variant="raised"
                  size="sm"
                  onClick={onSave}
                  className={cn(
                    "my-0",
                    "flex-1 min-w-[84px] sm:min-w-[90px]",
                    "h-[32px] px-3",
                    "rounded-[8px]",
                    "text-[clamp(12px,1.1vw,13px)]",
                    "shadow-[0_2px_4px_-2px_rgba(0,0,0,0.08),0_4px_8px_-2px_rgba(0,0,0,0.04)]"
                  )}
                >
                  Save
                </Button>

                <Button
                  size="sm"
                  onClick={onView}
                  className={cn(
                    "my-0",
                    "flex-1 min-w-[84px] sm:min-w-[90px]",
                    "h-[32px] px-3",
                    "rounded-[8px]",
                    "bg-[#1A1A1A] text-white hover:bg-black active:bg-black",
                    "text-[clamp(12px,1.1vw,13px)]",
                    "shadow-[0_2px_4px_-2px_rgba(0,0,0,0.08),0_4px_8px_-2px_rgba(0,0,0,0.04)]"
                  )}
                >
                  View
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
