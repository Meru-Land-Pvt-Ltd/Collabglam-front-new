"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import {
  PencilSimple,
  Users as UsersIcon,
  MoneyWavy,
  CurrencyDollar,
  PlusCircle,
  CalendarDots,
  CalendarX,
  Wallet,
  CaretDown,
  CaretLeft,
  CaretRight,
  DownloadSimple,
  FilePdf,
  DotsThreeIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/buttonComp";
import { apiGetfetchCampaignbyId } from "@/app/influencer/services/influencerApi";

interface CampaignDetailsProps {
  id: string | string[];
}

function asArray<T = any>(v: any): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function normalizeMongoId(id: any): string {
  if (id == null) return "";
  if (typeof id === "string" || typeof id === "number") return String(id);

  if (Array.isArray(id)) return id.length ? normalizeMongoId(id[0]) : "";

  if (typeof id === "object") {
    if (typeof id?.toHexString === "function") return id.toHexString();
    if (typeof id?.$oid === "string") return id.$oid;
    if (typeof id?.oid === "string") return id.oid;
    if (typeof id?.id === "string" || typeof id?.id === "number") return String(id.id);
    if (id?._id != null) return normalizeMongoId(id._id);

    if (typeof id?.toString === "function") {
      const s = id.toString();
      if (s && s !== "[object Object]") return s;
    }
  }

  return "";
}

function plural(n: number, unit: string) {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

function pad2(n: number) {
  const x = Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
  return String(x).padStart(2, "0");
}

function computeDaysLeft(endAt?: string): number {
  if (!endAt) return 0;
  const end = new Date(endAt);
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function getYoutubeId(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "") || "";
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("shorts");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch { }
  return "";
}

function getVideoThumb(url: string) {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

const PAGE_WRAP =
  "flex w-full flex-col items-start gap-7 px-4 py-6 sm:px-6 lg:px-10 xl:px-14";

type CampaignDoc = any;


function Metric({
  label,
  value,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  onClick?: () => void;
}) {
  const clickable = typeof onClick === "function";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!clickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  const isPrimitive =
    typeof value === "string" || typeof value === "number";

  return (
    <div
      onClick={clickable ? onClick : undefined}
      onKeyDown={handleKeyDown}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? label : undefined}
      className={[
        "flex min-h-[5.75rem] flex-col items-start justify-start rounded-[1rem] border border-[#E6E6E6] bg-white px-4 py-3",
        clickable
          ? "cursor-pointer transition hover:bg-black/[0.02] active:bg-black/[0.04] focus:outline-none focus:ring-2 focus:ring-black/20"
          : "",
      ].join(" ")}
    >
      <div
        className="text-[0.75rem] font-semibold leading-4 text-[#1A1A1A]"
        style={{ fontFamily: "Inter" }}
      >
        {label}
      </div>

      <div className="mt-4 w-full">
        {isPrimitive ? (
          <div
            className="text-base font-semibold text-[#1A1A1A]"
            style={{ fontFamily: "Inter" }}
          >
            {value}
          </div>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
function uniqueStrings(values: any[]) {
  return Array.from(
    new Set(
      values
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
    )
  );
}

function isMongoIdLike(value: string) {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

function renderMetricTags(values: string[]) {
  if (!values.length) {
    return (
      <span
        className="text-[0.875rem] font-medium leading-5 text-[#969696]"
        style={{ fontFamily: "Inter" }}
      >
        —
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item, idx) => (
        <span
          key={`${item}-${idx}`}
          className="inline-flex items-center rounded-full bg-[#F5F5F5] px-3 py-1"
        >
          <span
            className="text-[0.875rem] font-semibold leading-5 text-[#1A1A1A]"
            style={{ fontFamily: "Inter" }}
          >
            {item}
          </span>
        </span>
      ))}
    </div>
  );
}
export default function CampaignDetails({ id }: CampaignDetailsProps) {
  const router = useRouter();
  const campaignId = useMemo(() => normalizeMongoId(id), [id]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [doc, setDoc] = useState<CampaignDoc | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const [budgetTab, setBudgetTab] = useState<"remaining" | "used">("remaining");
  const [otherInfoOpen, setOtherInfoOpen] = useState(false);
  const [audiencePlatformsOpen, setAudiencePlatformsOpen] = useState(false);
  const [additionalInfoOpen, setAdditionalInfoOpen] = useState(false);

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const desktopMq = window.matchMedia("(min-width: 1024px)");
    let ro: ResizeObserver | null = null;

    const update = () => {
      // only offset on desktop
      if (!desktopMq.matches) {
        setSidebarWidth(0);
        return;
      }

      const sidebar = document.querySelector("[data-cg-sidebar]") as HTMLElement | null;

      if (!sidebar) {
        setSidebarWidth(0);
        return;
      }

      const width = sidebar.getBoundingClientRect().width;
      setSidebarWidth(Math.round(width));
    };

    const attachObserver = () => {
      const sidebar = document.querySelector("[data-cg-sidebar]") as HTMLElement | null;

      if (ro) {
        ro.disconnect();
        ro = null;
      }

      if (sidebar && desktopMq.matches) {
        ro = new ResizeObserver(() => update());
        ro.observe(sidebar);
      }

      update();
    };

    attachObserver();

    window.addEventListener("resize", attachObserver);
    desktopMq.addEventListener?.("change", attachObserver);

    // sidebar may mount after this component
    const raf1 = requestAnimationFrame(attachObserver);
    const raf2 = requestAnimationFrame(attachObserver);

    return () => {
      window.removeEventListener("resize", attachObserver);
      desktopMq.removeEventListener?.("change", attachObserver);
      if (ro) ro.disconnect();
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);
  useEffect(() => {
   

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setErr("");

      try {
        const influencerId = localStorage.getItem("influencerId") || "";
        const token = localStorage.getItem("token") || "";
        const res = await apiGetfetchCampaignbyId(influencerId, campaignId, token);
        if (!cancelled) setDoc(res ?? null);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load campaign");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  if (loading) {
    return (
      <div className={PAGE_WRAP}>
        <div className="w-full rounded-2xl border bg-white p-6 shadow-sm">
          <div className="h-6 w-64 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-4 w-96 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className={PAGE_WRAP}>
        <div className="w-full rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">Couldn’t load campaign</div>
          <p className="mt-2 text-sm text-red-600">{err}</p>

          <div className="mt-4 flex gap-2">
            <Button
              variant="raised"
              size="sm"
              className="my-0 rounded-xl border border-[#E6E6E6] bg-white px-4 py-2 text-sm shadow-none"
              onClick={() => router.refresh()}
            >
              Retry
            </Button>

            <Button
              variant="raised"
              size="sm"
              className="my-0 rounded-xl border border-[#E6E6E6] bg-white px-4 py-2 text-sm shadow-none"
              onClick={() => router.back()}
            >
              Go back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className={PAGE_WRAP}>
        <div className="w-full rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">No campaign found</div>
        </div>
      </div>
    );
  }

  const details = doc?.details ?? {};
  const countries = asArray(details?.targetCountries);
  const ages = asArray(details?.targetAgeRanges);
  const platforms = asArray<string>(
    doc?.platformSelection ?? doc?.targetPlatforms ?? details?.platformSelection
  );

  const descriptionText = String(
    doc?.description ??
    doc?.campaignDescription ??
    details?.description ??
    details?.campaignDescription ??
    ""
  ).trim();

  const additionalNotesText = String(
    doc?.additionalNotes ??
    doc?.notes ??
    doc?.additionalInformation ??
    details?.additionalNotes ??
    details?.notes ??
    details?.additionalInformation ??
    ""
  ).trim();

  const hashtags = (() => {
    const raw =
      doc?.preferredHashtags ??
      details?.preferredHashtags ??
      doc?.hashtags ??
      details?.hashtags ??
      [];

    return asArray(raw)
      .map((h: any) => {
        if (typeof h === "string") return h.trim();
        if (h && typeof h?.tag === "string") return h.tag.trim();
        return "";
      })
      .filter(Boolean);
  })();

  const productImages = asArray<any>(doc?.productImages ?? doc?.images);
  const backendImageUrls = productImages
    .map((img: any) => img?.url || img?.dataUrl || img?.src || img?.path || "")
    .filter(Boolean);

  const carouselImages = backendImageUrls;

  const videoReferenceUrl = String(
    doc?.videoReference ??
    doc?.videoReferenceUrl ??
    doc?.referenceVideoUrl ??
    doc?.videoUrl ??
    details?.videoReference ??
    details?.videoReferenceUrl ??
    details?.referenceVideoUrl ??
    details?.videoUrl ??
    ""
  ).trim();

  const videoThumbUrl = videoReferenceUrl ? getVideoThumb(videoReferenceUrl) : "";

  const pdfRaw =
    doc?.pdf ??
    doc?.pdfAttachment ??
    doc?.attachment ??
    doc?.attachments ??
    details?.pdf ??
    details?.pdfAttachment ??
    details?.attachment ??
    details?.attachments ??
    null;

  const pdfItem = Array.isArray(pdfRaw) ? pdfRaw[0] : pdfRaw;

  const pdfUrl =
    typeof pdfItem === "string"
      ? pdfItem
      : pdfItem?.url || pdfItem?.src || pdfItem?.path || "";

  const pdfName =
    typeof pdfItem === "object" && pdfItem?.name
      ? String(pdfItem.name)
      : pdfUrl
        ? "Attachment.pdf"
        : "";

  const pdfSizeBytes =
    typeof pdfItem === "object" && pdfItem?.size != null ? Number(pdfItem.size) : NaN;

  const pdfSizeText =
    Number.isFinite(pdfSizeBytes) && pdfSizeBytes > 0
      ? `${(pdfSizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : "";

  const logoUrlRaw =
    doc?.brandLogoUrl ?? doc?.brandLogo ?? details?.brandLogoUrl ?? details?.brandLogo ?? "";
  const logoUrl = typeof logoUrlRaw === "string" ? logoUrlRaw : "";

  const productUrlRaw =
    details?.productUrl ?? details?.productLink ?? doc?.productUrl ?? doc?.productLink ?? "";
  const productUrl = typeof productUrlRaw === "string" ? productUrlRaw : "";

  const totalInfluencers = Number(doc?.numberOfInfluencers ?? details?.numberOfInfluencers ?? 0) || 0;

  const selectedList =
    doc?.selectedInfluencers ??
    doc?.selectedInfluencerIds ??
    doc?.selectedCreators ??
    doc?.selectedInfluencer ??
    details?.selectedInfluencers ??
    details?.selectedInfluencerIds ??
    [];

  const selectedCount = asArray(selectedList).length;

  const startAt = doc?.startAt ?? details?.startAt ?? null;
  const endAt = doc?.endAt ?? details?.endAt ?? null;

  let timelineText = "—";
  try {
    if (startAt && endAt) {
      const a = new Date(startAt).getTime();
      const b = new Date(endAt).getTime();
      if (Number.isFinite(a) && Number.isFinite(b) && b > a) {
        const days = Math.ceil((b - a) / 86400000);
        const months = Math.max(1, Math.round(days / 30));
        timelineText = plural(months, "month");
      }
    } else if (doc?.timeline) {
      timelineText = String(doc.timeline);
    }
  } catch { }

  const currency = String(doc?.currency ?? details?.currency ?? doc?.budgetCurrency ?? "USD");

  const budgetRaw = doc?.campaignBudget ?? details?.campaignBudget ?? doc?.totalBudget ?? 0;
  const budgetNum =
    typeof budgetRaw === "number"
      ? budgetRaw
      : Number(String(budgetRaw ?? "").replace(/[^0-9.]/g, ""));

  const budgetText =
    Number.isFinite(budgetNum) && budgetNum > 0
      ? `${currency} $${budgetNum.toLocaleString("en-US")}`
      : "—";

  const statusText = String(doc?.status ?? "draft");

  const startDateText = startAt
    ? new Date(startAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
    : "—";

  const endDateText = endAt
    ? new Date(endAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
    : "—";

  const paymentTypeText = String(doc?.paymentType ?? details?.paymentType ?? "—");

  const targetCountryText = countries.length
    ? countries
      .map((c: any) =>
        `${String(c?.flag ?? "")} ${String(c?.countryName ?? c?.countryCode ?? "").trim()}`.trim()
      )
      .filter(Boolean)
      .join(", ")
    : doc?.targetCountry || doc?.location || "—";

  const shownBudgetText =
    budgetTab === "remaining"
      ? Number.isFinite(budgetNum)
        ? budgetNum.toLocaleString("en-US")
        : "0"
      : "0";

  const lorem10 = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do.";

  const scrollToSlide = (idx: number) => {
    const el = carouselRef.current;
    if (!el || !carouselImages.length) return;

    const clamped = Math.max(0, Math.min(idx, carouselImages.length - 1));
    const child = el.children.item(clamped) as HTMLElement | null;
    if (child) {
      child.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }
    setActiveSlide(clamped);
  };

  const onPrevSlide = () => scrollToSlide(activeSlide - 1);
  const onNextSlide = () => scrollToSlide(activeSlide + 1);

  const onCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;

    const kids = Array.from(el.children) as HTMLElement[];
    if (!kids.length) return;

    const left = el.scrollLeft;
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;

    kids.forEach((k, i) => {
      const d = Math.abs(k.offsetLeft - left);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });

    setActiveSlide(bestIdx);
  };

  const onDownloadPdf = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  const categoryValues = uniqueStrings([
    ...asArray(doc?.categories).map((item: any) => item?.categoryName),
    doc?.campaignCategory,
  ]);

  const subcategoryValues = uniqueStrings([
    ...asArray(doc?.categories).map((item: any) => item?.subcategoryName),
  ]);

  const campaignTypeValues = uniqueStrings([
    doc?.campaignType,
  ]);

  // Prefer expanded objects from details; fall back to raw IDs on doc root
  const rawGoalValues = asArray(
    doc?.details?.campaignGoals?.length
      ? doc.details.campaignGoals
      : doc?.campaignGoals
  );

  // Your sample has only Mongo IDs for campaignGoals, not names.
  // So show count unless your API later returns expanded names.
  const campaignGoalValues = uniqueStrings(
    rawGoalValues
      .map((item: any) => {
        if (typeof item === "string") return isMongoIdLike(item) ? "" : item;
        if (item && typeof item === "object") {
          // details.campaignGoals shape: { id, goal, sortOrder, isActive }
          return item?.goal || item?.name || item?.label || item?.goalName || "";
        }
        return "";
      })
      .filter(Boolean)
  );

  const campaignGoalDisplayValues =
    campaignGoalValues.length > 0
      ? campaignGoalValues
      : rawGoalValues.length
        ? [`${rawGoalValues.length} selected`]
        : [];

  return (
    <div className={PAGE_WRAP}>
      <div className="w-full mt-[3.5rem]">
        <div className="flex flex-col items-start gap-5 self-stretch pb-5 border-b border-[#E6E6E6]">
          <div
            className="h-[6.25rem] w-[6.25rem] rounded-[4rem] border border-white/30 bg-black"
            style={
              logoUrl
                ? {
                  backgroundImage: `url(${logoUrl})`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "11px 24px",
                  backgroundSize: "78% 52%",
                }
                : undefined
            }
          />

          <div className="flex w-full items-center justify-between px-1 gap-3">
            <div className="min-w-0">
              <div
                className="w-full max-w-[25.0625rem] text-[#1A1A1A] font-bold text-[1.5rem] leading-8 tracking-normal line-clamp-2"
                style={{ fontFamily: "Inter" }}
                title={doc?.campaignTitle ?? "Campaign"}
              >
                {doc?.campaignTitle ?? doc?.title ?? "Campaign"}
              </div>

              <div className="mt-1">
                {productUrl ? (
                  <a
                    href={productUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#B8B8B8] text-[0.75rem] leading-4 font-normal"
                    style={{ fontFamily: "Inter" }}
                    title={productUrl}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="truncate max-w-[18rem]">{productUrl}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                ) : (
                  <div
                    className="text-[#B8B8B8] text-[0.75rem] leading-4 font-normal"
                    style={{ fontFamily: "Inter" }}
                  >
                    —
                  </div>
                )}
              </div>
            </div>

            <div className="flex h-8 items-center gap-[0.5rem]">
              {/* <div className="px-3 py-1 rounded-full bg-[#F5F5F5] text-sm capitalize text-[#1A1A1A]">
                {statusText}
              </div> */}
              <Button className="!h-[2rem] !rounded-[0.75rem] !px-[0.5rem] !gap-[0.5rem] !bg-white !text-black shadow-none border border-[#1A1A1A]">
                Mail to brand
              </Button>
              <Button
                variant="raised"
                size="sm"
                className="my-0 !h-[2rem] !rounded-[0.75rem]  border border-[#1A1A1A] bg-white  !px-[0.5rem]  shadow-none !gap-[0.5rem]"
              // rightIcon={
              //   <UsersIcon weight="bold" style={{ width: "0.875rem", height: "0.875rem" }} />
              // }
              // onClick={() => router.push(`/brand/campaign/${campaignId}/influencers`)}
              >
                <DotsThreeIcon />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="mt-3 flex flex-col items-start gap-6 self-stretch">
          <div className="flex w-full items-start justify-between self-stretch">
            <div
              className="text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]"
              style={{ fontFamily: "Inter" }}
            >
              Overview
            </div>

            <Button
              variant="raised"
              size="sm"
              className="my-0 p-0 h-auto bg-transparent shadow-none hover:bg-transparent active:bg-transparent gap-2"
              rightIcon={
                <PencilSimple
                  weight="bold"
                  className="text-[#1A1A1A]"
                  style={{ width: "0.875rem", height: "0.875rem" }}
                />
              }
              onClick={() => router.push(`/brand/campaign/${campaignId}/edit`)}
            >
              <span className="text-center text-[#1A1A1A] text-[0.75rem] font-semibold leading-5">
                Edit
              </span>
            </Button>
          </div>

          <div className="flex w-full flex-col items-center justify-center gap-5 self-stretch  p-4">
            <div className="w-full  p-0">
              <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label="Category"
                  value={renderMetricTags(categoryValues)}
                />
                <Metric
                  label="Subcategory"
                  value={renderMetricTags(subcategoryValues)}
                />
                <Metric
                  label="Campaign type"
                  value={renderMetricTags(campaignTypeValues)}
                />
                <Metric
                  label="Campaign Goals"
                  value={renderMetricTags(campaignGoalDisplayValues)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="mt-5 self-stretch text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]">
          Description
        </div>

        <div className="mt-6 flex h-[14.8125rem] w-full flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3 overflow-auto">
          <div className="text-[#1A1A1A] text-[0.875rem] font-medium leading-[1.25rem] whitespace-pre-wrap">
            {descriptionText || "—"}
          </div>
        </div>

        <div className="mt-6 self-stretch text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]">
          Image / Reference
        </div>

        <div className="mt-6 relative w-full">
          {carouselImages.length ? (
            <>
              <div
                ref={carouselRef}
                onScroll={onCarouselScroll}
                className="flex w-full items-center gap-5 py-5 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {carouselImages.map((src: string, idx: number) => (
                  <div
                    key={`${src}-${idx}`}
                    className="flex-none w-[13.8125rem] h-[11.5rem] rounded-[1.1875rem] bg-cover bg-center"
                    style={{ backgroundImage: `url(${src})` }}
                  />
                ))}
              </div>

              <Button
                variant="raised"
                size="sm"
                onClick={onPrevSlide}
                disabled={activeSlide <= 0}
                className="my-0 absolute left-4 top-[5.625rem] h-[2.75rem] w-[2.75rem] px-0 rounded-[2.5rem] bg-[#F2F2F2] border border-transparent shadow-none"
                leftIcon={<CaretLeft weight="bold" style={{ width: "1.25rem", height: "1.25rem" }} />}
              />

              <Button
                variant="raised"
                size="sm"
                onClick={onNextSlide}
                disabled={activeSlide >= carouselImages.length - 1}
                className="my-0 absolute right-4 top-[5.625rem] h-[2.75rem] w-[2.75rem] px-0 rounded-[2.5rem] bg-[#F2F2F2] border border-transparent shadow-none"
                leftIcon={<CaretRight weight="bold" style={{ width: "1.25rem", height: "1.25rem" }} />}
              />

              <div className="mt-2 flex w-full items-center justify-center gap-2">
                {carouselImages.map((_: string, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => scrollToSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className="h-2 w-2 rounded-[0.5rem]"
                    style={{ backgroundColor: i === activeSlide ? "#000000" : "#E8E8E8" }}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[11.5rem] w-full items-center justify-center rounded-[0.75rem] border border-[#E6E6E6] bg-white text-[#969696] text-[0.875rem]">
              —
            </div>
          )}
        </div>
      </div>
      <div className="mb-[1.75rem] mt-[1.75rem] h-px w-full bg-[var(--Light-Border-Subtle,#E6E6E6)]" />

      <div className="flex w-full flex-col items-start gap-6 self-stretch" style={{ fontFamily: "Inter" }}>
        <div className="flex w-full items-center justify-between self-stretch">
          <div className="text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]">
            Timeline &amp; Payments
          </div>
        </div>

        {/* <div className="flex w-full flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] p-4 h-[12.375rem] gap-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center p-3 rounded-[0.5rem] bg-[#F2F2F2]">
              <MoneyWavy weight="bold" style={{ width: "1.5rem", height: "1.5rem" }} />
            </div>

            <div className="flex h-[3rem] p-2 items-center gap-2 rounded-[0.75rem] bg-[#F9F9F9]">
              <button
                type="button"
                onClick={() => setBudgetTab("remaining")}
                className={`flex h-8 px-3 items-center justify-center gap-1 self-stretch rounded-[0.5rem] ${budgetTab === "remaining" ? "bg-white" : "bg-transparent"
                  }`}
              >
                <span className="text-[#1A1A1A] text-[0.75rem] font-semibold leading-5">
                  Remaining Budget
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBudgetTab("used")}
                className={`flex h-8 px-3 items-center justify-center gap-1 self-stretch rounded-[0.5rem] ${budgetTab === "used" ? "bg-white" : "bg-transparent"
                  }`}
              >
                <span className="text-[#1A1A1A] text-[0.75rem] font-semibold leading-5">
                  Used Budget
                </span>
              </button>
            </div>
          </div>

          <div className="mt-auto flex w-full items-end justify-between self-stretch gap-4">
            <div className="flex flex-col items-start gap-2">
              <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
                {budgetTab === "remaining" ? "Remaining budget" : "Used budget"}
              </div>

              <div className="flex items-center gap-[0.1rem]">
                <div className="text-[#343330] text-[1rem] font-medium leading-[1.5rem]">{currency}</div>
                <CurrencyDollar weight="bold" style={{ width: "1rem", height: "1rem", color: "#343330" }} />
                <div className="text-[#1A1A1A] text-[1rem] font-medium leading-[1.5rem]">
                  {shownBudgetText}
                </div>
              </div>
            </div>

            <Button
              variant="raised"
              size="sm"
              onClick={() => router.push(`/brand/campaign/${campaignId}/edit`)}
              className="my-0 h-8 w-[6.375rem] px-2 gap-[0.25rem] rounded-[0.75rem] border border-[#E6E6E6] bg-white shadow-none"
              leftIcon={<PlusCircle weight="bold" style={{ width: "0.875rem", height: "0.875rem" }} />}
            >
              <span className="text-center text-[#1A1A1A] font-semibold leading-5">Add funds</span>
            </Button>
          </div>
        </div> */}
      </div>

      <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row">
        <div className="flex flex-1 flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] p-3 min-h-[12.375rem]">
          <div className="flex h-12 w-12 items-center justify-center rounded-[0.5rem] bg-[#F2F2F2] p-3">
            <CalendarDots weight="bold" style={{ width: "1.5rem", height: "1.5rem" }} />
          </div>
          <div className="mt-auto flex flex-col items-start gap-2 self-stretch">
            <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">Start date</div>
            <div className="text-[#1A1A1A] text-[1rem] font-medium leading-[1.5rem]">{startDateText}</div>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] p-3 min-h-[12.375rem]">
          <div className="flex h-12 w-12 items-center justify-center rounded-[0.5rem] bg-[#F2F2F2] p-3">
            <CalendarX weight="bold" style={{ width: "1.5rem", height: "1.5rem" }} />
          </div>
          <div className="mt-auto flex flex-col items-start gap-2 self-stretch">
            <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">End date</div>
            <div className="text-[#1A1A1A] text-[1rem] font-medium leading-[1.5rem]">{endDateText}</div>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] p-3 min-h-[12.375rem]">
          <div className="flex h-12 w-12 items-center justify-center rounded-[0.5rem] bg-[#F2F2F2] p-3">
            <Wallet weight="bold" style={{ width: "1.5rem", height: "1.5rem" }} />
          </div>
          <div className="mt-auto flex flex-col items-start gap-2 self-stretch">
            <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">Payment type</div>
            <div className="text-[#1A1A1A] text-[1rem] font-medium leading-[1.5rem]">{paymentTypeText}</div>
          </div>
        </div>
      </div>

      <div className="mb-[1.75rem] mt-[1.75rem] h-px w-full bg-[var(--Light-Border-Subtle,#E6E6E6)]" />

      <div className="w-full rounded-[1.25rem] p-5 flex flex-col items-start gap-6">
        <div className="flex w-full justify-between items-start self-stretch">
          <div className="flex flex-col justify-center items-start gap-1 flex-1">
            <div className="text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]">
              Other Information
            </div>

            <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
              {lorem10}
            </div>
          </div>
        </div>


      </div>

      <div className="mt-4 w-full rounded-[1.25rem]  p-5 flex flex-col items-start gap-6">
        <div className="flex w-full justify-between items-start self-stretch">
          <div className="flex flex-col justify-center items-start gap-1 flex-1">
            <div className="text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]">
              Audience &amp; Platforms
            </div>

            <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
              {lorem10}
            </div>
          </div>
        </div>

        <div className="w-full mt-6 flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-1/2 flex flex-col gap-3">
            <div className="flex h-[4.5rem] p-3 flex-col justify-between items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white">
              <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
                Target Platform
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {platforms.length ? (
                  platforms.map((p, idx) => {
                    const key = `${p}-${idx}`;
                    const lower = String(p).toLowerCase();

                    if (lower === "instagram") {
                      return (
                        <Image
                          key={key}
                          src="/skill-icons_instagram.svg"
                          alt="Instagram"
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                      );
                    }

                    if (lower === "youtube") {
                      return (
                        <Image
                          key={key}
                          src="/logos_youtube-icon.svg"
                          alt="YouTube"
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                      );
                    }

                    if (lower === "tiktok") {
                      return (
                        <Image
                          key={key}
                          src="/ic_baseline-tiktok.svg"
                          alt="TikTok"
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                      );
                    }

                    return (
                      <span
                        key={key}
                        className="flex h-7 items-center justify-center rounded-[1.25rem] bg-[#F9F9F9] px-3"
                      >
                        <span className="text-[#1A1A1A] text-[0.875rem] font-semibold leading-[1.25rem]">
                          {String(p)}
                        </span>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-[#969696] text-[0.875rem]">—</span>
                )}
              </div>
            </div>

            <div className="flex p-3 flex-col items-start gap-3 self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white">
              <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
                Target Country
              </div>

              <div className="mt-2 text-[#1A1A1A] text-[0.875rem] font-semibold leading-[1.25rem]">
                {targetCountryText}
              </div>
            </div>

            <div className="flex p-3 flex-col items-start gap-3 self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white">
              <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
                Target age group
              </div>

              <div className="flex flex-wrap gap-2 self-stretch">
                {ages.length ? (
                  [...ages]
                    .sort((a: any, b: any) => {
                      const getStartAge = (value: string) => {
                        const match = String(value || "").match(/\d+/);
                        return match ? Number(match[0]) : Infinity;
                      };
                      return getStartAge(a?.range) - getStartAge(b?.range);
                    })
                    .map((a: any, idx: number) => (
                      <span
                        key={`${String(a?.id ?? a?._id ?? a?.range ?? idx)}-${idx}`}
                        className="flex h-7 items-center justify-center rounded-[1.25rem] bg-[#F9F9F9] px-3"
                      >
                        <span className="text-[#1A1A1A] text-[0.875rem] font-semibold leading-[1.25rem]">
                          {String(a?.range ?? "—")}
                        </span>
                      </span>
                    ))
                ) : (
                  <span className="text-[#969696] text-[0.875rem]">—</span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full sm:w-1/2 flex flex-col items-start gap-[1.3125rem] rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3 h-auto">
            <div className="text-[#1A1A1A] text-[0.75rem] font-semibold leading-[1.25rem] self-stretch">
              Video Reference
            </div>

            {videoReferenceUrl ? (
              <div className="flex flex-col gap-2">
                <a
                  href={videoReferenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem] break-all"
                >
                  {videoReferenceUrl}
                </a>

                <a
                  href={videoReferenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-[12.875rem] h-[10.125rem] rounded-[0.25rem] bg-cover bg-center"
                  style={{
                    backgroundImage: videoThumbUrl ? `url(${videoThumbUrl})` : undefined,
                    backgroundColor: videoThumbUrl ? undefined : "#eee",
                  }}
                />
              </div>
            ) : (
              <div className="text-[#969696] text-[0.875rem] font-normal leading-[1.25rem]">—</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 w-full rounded-[1.25rem]  p-5 flex flex-col items-start gap-6">
        <div className="flex w-full justify-between items-start self-stretch">
          <div className="flex flex-col justify-center items-start gap-1 flex-1">
            <div className="text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]">
              Additional Information
            </div>

            <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
              {lorem10}
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="flex h-[14.8125rem] flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white overflow-hidden">
            <div className="flex w-full items-center self-stretch px-3 py-2 border-b border-[#E6E6E6] rounded-t-[0.6875rem]">
              <div className="text-[#969696] text-[1rem] font-medium leading-[1.5rem]">
                Additional Notes
              </div>
            </div>

            <div className="flex flex-1 w-full p-3 items-start justify-between self-stretch overflow-auto">
              <div className="text-[#1A1A1A] text-[0.875rem] font-medium leading-[1.25rem] whitespace-pre-wrap">
                {additionalNotesText || "—"}
              </div>
            </div>
          </div>

          {pdfUrl ? (
            <div className="mt-5 flex w-full items-center justify-between self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white px-3 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <FilePdf weight="bold" style={{ width: "2rem", height: "2rem" }} />

                <div className="flex flex-col min-w-0">
                  <div className="text-[#1A1A1A] text-[1rem] font-medium leading-[1.5rem] truncate">
                    {pdfName}
                  </div>
                  {pdfSizeText ? (
                    <div className="text-[#969696] text-[0.875rem] font-normal leading-[1.25rem]">
                      {pdfSizeText}
                    </div>
                  ) : null}
                </div>
              </div>

              <Button
                variant="raised"
                size="sm"
                onClick={onDownloadPdf}
                className="my-0 h-[2.0625rem] w-[7rem] px-2 rounded-[0.75rem] bg-white border border-transparent shadow-[0_2px_4px_-2px_rgba(0,0,0,0.08),0_4px_8px_-2px_rgba(0,0,0,0.04)]"
                leftIcon={<DownloadSimple weight="bold" style={{ width: "0.875rem", height: "0.875rem" }} />}
              >
                <span className="text-center text-[#1A1A1A] text-[0.75rem] font-semibold leading-[1.25rem]">
                  Download
                </span>
              </Button>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3 h-[11.4375rem] gap-[1.3125rem]">
            <div className="text-[#1A1A1A] text-[0.75rem] font-semibold leading-[1.25rem]">
              Hashtags
            </div>

            <div className="flex flex-wrap gap-2 self-stretch">
              {hashtags.length ? (
                hashtags.map((tag: string, idx: number) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="flex h-7 items-center justify-center rounded-[1.25rem] bg-[#F9F9F9] px-3"
                  >
                    <span className="text-[#1A1A1A] text-[0.75rem] font-medium leading-[1.25rem]">
                      {tag}
                    </span>
                  </span>
                ))
              ) : (
                <span className="text-[#969696] text-[0.875rem] leading-[1.25rem]">—</span>
              )}
            </div>
          </div>
        </div>
        <div
          className="fixed bottom-0 z-40 border-t border-gray-200 bg-white"
          style={{
            left: `${sidebarWidth}px`,
            width: `calc(100vw - ${sidebarWidth}px)`,
          }}
        >
          <div className="flex h-20 items-center justify-between px-6">
            <p className="text-sm font-medium text-gray-900">09/10 Selected</p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                className="text-sm font-medium !text-gray-900 !bg-white hover:underline shadow-none"
              >
                Go to Dashboard
              </Button>

              <Button className="bg-black w-40 text-white hover:bg-black/90 !rounded-[0.75rem] px-8 h-11">
                Apply
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}