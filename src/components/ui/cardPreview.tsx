import React, { useMemo } from "react";
import {
  Images,
  UsersThree,
  DotsThree,
  MapPin,
} from "@phosphor-icons/react";
import { Button } from "./button";

type Option = { label: string; value: string };
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

  campaigngoal?: string;
  campaignBudget?: number;
};

export type PreviewMeta = {
  subcategoriesMap?: IdLabelMap;
  countryMap?: IdLabelMap;
  ageMap?: IdLabelMap;
  goalsMap?: IdLabelMap;
  hashtagsMap?: IdLabelMap;

  campaignBudget?: number;
};

/** Skeletons stay pill-type */
function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`h-3 rounded-full bg-neutral-100 ${className}`} />;
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

/** Country text style (+1) – no pill */
function InlinePlus({
  first,
  extra,
  sep = " · ",
  className = "",
}: {
  first: string;
  extra: number;
  sep?: string;
  className?: string;
}) {
  if (!first) return null;
  return (
    <span className={["text-[12px] text-primary", className].join(" ")}>
      <span className="truncate">{first}</span>
      {extra > 0 ? <span className="text-primary">{sep}+{extra}</span> : null}
    </span>
  );
}

function formatBudget(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n.toLocaleString();
}

/** ✅ ONLY for Category + Age (outlined #1A1A1A) */
function OutlinedPill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "inline-flex items-center gap-1.5 rounded-full",
        "border border-[#1A1A1A] bg-white",
        "px-3 py-1 text-[12px] text-neutral-900",
        "min-w-0", // allows truncation inside
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function CampaignGlobalBadge ({ value }: { value: string }) {
  if (!value) return null;
  return (
    <div
      className={[
        "inline-flex items-center px-3 py-1",
        "text-[12px] text-neutral-900",
        "rounded-[1.25rem]",
        "border border-[#FFBF00]",
        "bg-[#FFF9E6]",
      ].join(" ")}
    >
      {value}
    </div>
  );
}

export function ManualPreviewCard({
  form,
  meta,
  className = "",
}: {
  form: ManualForm;
  meta?: PreviewMeta;
  className?: string;
}) {
  const title = form.title?.trim() ?? "";
  const desc = form.description?.trim() ?? "";

  const hasTitle = Boolean(title);
  const hasDesc = Boolean(desc);

  const categoryLabel = (form.categoryName ?? "").trim();

  const countryLabels = useMemo(
    () => idsToLabels(form.targetCountry, meta?.countryMap, stripLeadingEmoji),
    [form.targetCountry, meta?.countryMap]
  );
  const country = useMemo(() => firstAndExtra(countryLabels), [countryLabels]);

  const ageLabels = useMemo(
    () => idsToLabels(form.targetAgeGroups, meta?.ageMap),
    [form.targetAgeGroups, meta?.ageMap]
  );
  const age = useMemo(() => firstAndExtra(ageLabels), [ageLabels]);

  const budget = Number(meta?.campaignBudget ?? form?.campaignBudget ?? 0);
  const goalLabels = useMemo(
    () => idsToLabels(form.goals, meta?.goalsMap),
    [form.goals, meta?.goalsMap]
  );
  const goal = useMemo(() => firstAndExtra(goalLabels), [goalLabels]);
  const topBadge = goal.first ? pillText(goal.first, goal.extra) : "";

  return (
    <div
      className={[
        "w-full max-w-[26.25rem] rounded-[1.625rem] bg-white p-5",
        "[@media_(max-width:80rem)_and_(max-height:48.75rem)]:max-w-[23.75rem]",
        "[@media_(max-width:80rem)_and_(max-height:48.75rem)]:p-4",
        className,
      ].join(" ")}
    >
      {/* Campaign goal badge */}
      <div className="flex justify-end">
        {topBadge ? (
          <CampaignGlobalBadge value={topBadge} />
        ) : (
          <div className="h-6 w-16 rounded-full bg-neutral-100" />
        )}
      </div>

      {/* center image icon */}
      <div className="mt-8 flex justify-center [@media_(max-width:80rem)_and_(max-height:50rem)]:mt-6">
        <Images
          className="h-[4.625rem] w-[4.625rem] text-[#EDEDED] [@media_(max-width:80rem)_and_(max-height:48.75rem)]:scale-[0.92]"
        />
      </div>

      {/* AD badge */}
      <div className="mt-8 [@media_(max-width:80rem)_and_(max-height:50rem)]:mt-6">
        <div className="grid h-11 w-11 place-items-center rounded-s border-2 border-neutral-200 bg-white">
          <span className="text-[0.75rem] font-semibold tracking-wide text-neutral-900">
            AD
          </span>
        </div>
      </div>

      {/* top row: Category + Age + dots */}
      <div className="mt-6 flex items-center justify-between gap-3 [@media_(max-width:1280px)_and_(max-height:800px)]:mt-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Category = outlined pill (#1A1A1A) */}
          {categoryLabel ? (
            <OutlinedPill className="max-w-[150px]">
              <span className="truncate">{categoryLabel}</span>
            </OutlinedPill>
          ) : (
            <SkeletonLine className="h-4 w-20" />
          )}

          {/* Age = outlined pill (#1A1A1A) + UsersThree icon */}
          {age.first ? (
            <OutlinedPill className="max-w-[170px]">
              <UsersThree size={14} className="text-[#1A1A1A]" />
              <span className="truncate">{pillText(age.first, age.extra)}</span>
            </OutlinedPill>
          ) : (
            <SkeletonLine className="h-4 w-14" />
          )}
        </div>

        {/* Dots (text-only) */}
        <button
          type="button"
          aria-label="More"
          className="shrink-0 text-neutral-700 hover:text-neutral-900"
        >
          <DotsThree size={24} weight="bold" />
        </button>
      </div>

      {/* Campaign Title */}
      <div className="mt-3">
        {hasTitle ? (
          <div
            className="
              overflow-hidden text-ellipsis whitespace-nowrap
              text-[#1A1A1A]
              font-['Inter'] text-[1rem] font-semibold leading-[1.5rem] tracking-[0]
            "
          >
            {title}
          </div>
        ) : (
          <SkeletonLine className="w-[58%] h-4" />
        )}
      </div>

      {/* description */}
      <div className="mt-3 space-y-3">
        {hasDesc ? (
          <div className="text-[0.75rem] leading-5 text-neutral-700 line-clamp-2">
            {desc}
          </div>
        ) : (
          <>
            <SkeletonLine className="w-[92%]" />
            <SkeletonLine className="w-[78%]" />
          </>
        )}
      </div>

      {/* countries line (MapPin + text) */}
      <div className="mt-3">
        {country.first ? (
          <div className="flex items-center gap-2 min-w-0">
            <MapPin size={14} className="shrink-0 text-primary" />
            <InlinePlus
              first={country.first}
              extra={country.extra}
              className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
            />
          </div>
        ) : (
          <div className="mt-4 [@media_(max-width:80rem)_and_(max-height:50rem)]:mt-3">
            <div className="h-10 w-40 rounded-full bg-neutral-100" />
          </div>
        )}
      </div>

      {/* divider */}
      <div className="mt-6 h-px w-full bg-neutral-100 [@media_(max-width:80rem)_and_(max-height:50rem)]:mt-5" />

      {/* bottom row: Budget + Buttons */}
      <div className="mt-4 flex items-center justify-between gap-3 [@media_(max-width:1280px)_and_(max-height:800px)]:mt-3">
        {/* Budget = text-only */}
        <div className="min-w-0 flex-1">
          {budget > 0 ? (
            <span
              className="
                block min-w-0
                overflow-hidden text-ellipsis whitespace-nowrap
                text-[#1A1A1A]
                font-['Inter'] text-[1.25rem] font-semibold leading-[1.75rem] tracking-[0]
              "
            >
              ${formatBudget(budget)}
            </span>
          ) : (
            <div className="h-4 w-24 rounded-full bg-neutral-100" />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0 cursor-pointer">
          <Button variant="ghost" className="shadow-none ">
            Save
          </Button>
          <Button variant="default">View</Button>
        </div>
      </div>
    </div>
  );
}

export function ManualPreviewCardStack({
  form,
  meta,
}: {
  form: ManualForm;
  meta?: PreviewMeta;
}) {
  return (
    <div className="h-full min-h-0 w-full overflow-y-auto overflow-x-hidden overscroll-contain">
      {/* ✅ Better flex behavior: padding + switch to items-start on shorter heights */}
      <div className="min-h-full flex items-center justify-center px-6 py-10 [@media_(max-height:50rem)]:items-start [@media_(max-height:50rem)]:py-6">
        <div
          className="
            relative w-full max-w-[420px]
            [@media_(max-width:80rem)_and_(max-height:50rem)]:max-w-[380px]
            [@media_(max-width:80rem)_and_(max-height:50rem)]:scale-[0.94]
            [@media_(max-width:80rem)_and_(max-height:50rem)]:origin-top
          "
        >
          {/* layers */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none absolute z-0
              left-[54px] right-[54px] top-[28px] bottom-[28px]
              translate-y-[66px]
              rounded-[11.664px]
              opacity-50
              bg-[#EDEDED]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:left-[44px]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:right-[44px]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:translate-y-[56px]
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none absolute z-[1]
              left-[36px] right-[36px] top-[36px] bottom-[18px]
              translate-y-[44px]
              rounded-[13.997px]
              opacity-[0.98]
              bg-[#EDEDED]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:left-[30px]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:right-[30px]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:translate-y-[38px]
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none absolute z-[2]
              left-[18px] right-[18px] top-[18px] bottom-[9px]
              translate-y-[22px]
              rounded-[15.388px]
              bg-[#E6E6E6]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:left-[14px]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:right-[14px]
              [@media_(max-width:80rem)_and_(max-height:50rem)]:translate-y-[18px]
            "
          />

          <ManualPreviewCard form={form} meta={meta} className="relative z-10" />
        </div>
      </div>
    </div>
  );
}


export function toMap(
  options: Option[],
  clean = (s: string) => s
): IdLabelMap {
  const out: IdLabelMap = {};
  for (const o of options ?? []) {
    const v = String(o?.value ?? "").trim();
    const l = clean(String(o?.label ?? "").trim());
    if (!v || !l) continue;
    out[v] = l;
  }
  return out;
}
