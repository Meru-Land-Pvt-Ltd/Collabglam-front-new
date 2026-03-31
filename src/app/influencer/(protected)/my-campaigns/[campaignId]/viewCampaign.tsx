"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  apiGetfetchCampaignbyId,
  getApiErrorMessage,
} from "@/app/influencer/services/influencerApi";
import { ArrowUpRight } from "lucide-react";
import {
  MoneyWavy,
  CalendarDots,
  CalendarX,
  Wallet,
  CaretDown,
  CaretLeft,
  CaretRight,
  DownloadSimple,
  FilePdf,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/buttonComp";
import Image from "next/image";

function asArray<T = any>(v: any): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function normalizeMongoId(id: any): string {
  if (id == null) return "";
  if (typeof id === "string" || typeof id === "number") return String(id);

  if (typeof id === "object") {
    if (typeof (id as any).toHexString === "function") return (id as any).toHexString();
    if (typeof (id as any).$oid === "string") return (id as any).$oid;
    if (typeof (id as any).oid === "string") return (id as any).oid;
    if (typeof (id as any).id === "string" || typeof (id as any).id === "number") {
      return String((id as any).id);
    }
    if ((id as any)._id != null) return normalizeMongoId((id as any)._id);
    if (typeof (id as any).toString === "function") {
      const s = (id as any).toString();
      if (s && s !== "[object Object]") return s;
    }
  }

  return "";
}

const PAGE_WRAP =
  "flex w-full flex-col items-start gap-7 px-4 py-6 sm:px-6 lg:px-10 xl:px-14";

function pad2(n: number) {
  const x = Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
  return String(x).padStart(2, "0");
}

function plural(n: number, unit: string) {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

function TagCard({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  return (
    <div className="flex flex-1 flex-col items-start gap-[1.3125rem] self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3">
      <div className="self-stretch text-[#1A1A1A] text-[0.75rem] font-semibold leading-[1.25rem]">
        {title}
      </div>

      <div className="flex flex-wrap items-start gap-2 self-stretch">
        {values.length ? (
          values.map((value, idx) => (
            <span
              key={`${title}-${value}-${idx}`}
              className="flex h-7 items-center justify-center rounded-[1.25rem] bg-[#F9F9F9] px-3"
            >
              <span className="text-[#1A1A1A] text-[0.75rem] font-medium leading-[1.25rem]">
                {value}
              </span>
            </span>
          ))
        ) : (
          <span className="text-[#969696] text-[0.875rem] leading-[1.25rem]">—</span>
        )}
      </div>
    </div>
  );
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

const statuses = [
  { label: "Active", dot: "bg-[#28A745]", ring: "bg-[#BCE4C5]" },
  { label: "Paused", dot: "bg-[#DC3545]", ring: "bg-[#F5C6CB]" },
  { label: "Draft", dot: "bg-[#9E9E9E]", ring: "bg-[#E0E0E0]" },
  { label: "Completed", dot: "bg-[#F07B3F]", ring: "bg-[#FAD6C0]" },
];

function StatusDot({ dot, ring }: { dot: string; ring: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full p-[0.125rem] ${ring}`}>
      <span className={`h-[0.5rem] w-[0.5rem] rounded-full ${dot}`} />
    </span>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const current =
    statuses.find((s) => s.label.toLowerCase() === String(status).toLowerCase()) ?? null;

  return (
    <div className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E6E6E6] bg-white px-2">
      {current ? <StatusDot dot={current.dot} ring={current.ring} /> : null}
      <span className="capitalize text-sm font-medium text-[#1A1A1A]">
        {status || "draft"}
      </span>
    </div>
  );
}
function toTagValues(input: any): string[] {
  const values = asArray(input)
    .flatMap((item: any) => {
      if (item == null) return [];

      if (typeof item === "string" || typeof item === "number") {
        return String(item)
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      }

      if (typeof item === "object") {
        const value =
          item?.label ??
          item?.name ??
          item?.title ??
          item?.value ??
          item?.tag ??
          item?.range ??
          item?.categoryName ??
          item?.subcategoryName ??
          item?.subCategoryName ??
          item?.goal ??
          item?.goalName ??
          item?.type ??
          item?.campaignType;

        return typeof value === "string" && value.trim() ? [value.trim()] : [];
      }

      return [];
    })
    .filter(Boolean);

  return Array.from(new Set(values));
}

export default function ViewCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const idFromQuery = searchParams.get("id");

  const campaignId = useMemo(
    () => normalizeMongoId(idFromQuery ?? (params as any)?.campaignId),
    [idFromQuery, params]
  );

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [doc, setDoc] = useState<any | null>(null);

  const [influencerId, setInfluencerId] = useState("");
  const [token, setToken] = useState("");

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(0);



  useEffect(() => {
    const id =
      localStorage.getItem("influencerId") ||
      localStorage.getItem("influencerID") ||
      localStorage.getItem("influencer_id") ||
      "";

    const savedToken =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      "";

    setInfluencerId(id);
    setToken(savedToken);

    if (!id) {
      setErr("influencerId not found in localStorage. Please login again.");
      setLoading(false);
    }
  }, []);


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
    if (!influencerId || !campaignId) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setErr("");

      try {
        const res: any = await apiGetfetchCampaignbyId(
          influencerId,
          campaignId,
          token || undefined
        );

        const payload =
          res?.data?.doc ??
          res?.data?.data?.doc ??
          res?.data?.campaign ??
          res?.data?.data ??
          res?.doc ??
          res ??
          null;

        if (!cancelled) {
          setDoc(payload);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(getApiErrorMessage(e, "Failed to load campaign"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [influencerId, campaignId, token]);

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

  const details = (doc as any)?.details ?? {};
  const countries = asArray(details?.targetCountries);
  const ages = asArray(details?.targetAgeRanges);
  const platforms = asArray<string>((doc as any)?.platformSelection);

  const descriptionText = String(
    (doc as any)?.description ??
    (doc as any)?.campaignDescription ??
    details?.description ??
    details?.campaignDescription ??
    ""
  ).trim();

  const additionalNotesText = String(
    (doc as any)?.additionalNotes ??
    (doc as any)?.notes ??
    (doc as any)?.additionalInformation ??
    details?.additionalNotes ??
    details?.notes ??
    details?.additionalInformation ??
    ""
  ).trim();

  const hashtags = (() => {
    const detailObjs = asArray((details as any)?.preferredHashtags ?? []);

    const byId = new Map<string, string>();
    detailObjs.forEach((h: any) => {
      const key = normalizeMongoId(h?.id ?? h?._id);
      const tag = typeof h?.tag === "string" ? h.tag.trim() : "";
      if (key && tag) byId.set(key, tag);
    });

    const raw =
      (doc as any)?.preferredHashtags ??
      (details as any)?.preferredHashtags ??
      (doc as any)?.hashtags ??
      (details as any)?.hashtags ??
      [];

    return asArray(raw)
      .map((h: any) => {
        if (typeof h === "string") {
          const s = h.trim();
          if (byId.has(s)) return byId.get(s)!;
          if (/^[a-f0-9]{24}$/i.test(s)) return "";
          return s;
        }

        if (h && typeof h.tag === "string") return h.tag.trim();
        return "";
      })
      .filter(Boolean);
  })();

  const productImages = asArray<any>((doc as any)?.productImages);

  const videoReferenceUrl = String(
    (doc as any)?.videoReference ??
    (doc as any)?.videoReferenceUrl ??
    (doc as any)?.referenceVideoUrl ??
    (doc as any)?.videoUrl ??
    details?.videoReference ??
    details?.videoReferenceUrl ??
    details?.referenceVideoUrl ??
    details?.videoUrl ??
    ""
  ).trim();

  const videoThumbUrl = videoReferenceUrl ? getVideoThumb(videoReferenceUrl) : "";

  const pdfRaw =
    (doc as any)?.pdf ??
    (doc as any)?.pdfAttachment ??
    (doc as any)?.attachment ??
    (doc as any)?.attachments ??
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

  const targetCountryText = countries.length
    ? countries
      .map((c: any) =>
        `${String(c?.flag ?? "")} ${String(c?.countryName ?? c?.countryCode ?? "").trim()}`.trim()
      )
      .filter(Boolean)
      .join(", ")
    : "—";

  const productUrlRaw =
    details?.productUrl ??
    details?.productLink ??
    (doc as any)?.productUrl ??
    (doc as any)?.productLink ??
    "";

  const productUrl = typeof productUrlRaw === "string" ? productUrlRaw : "";

  const logoUrlRaw =
    (doc as any)?.brandLogoUrl ??
    (doc as any)?.brandLogo ??
    details?.brandLogoUrl ??
    details?.brandLogo ??
    "";

  const logoUrl = typeof logoUrlRaw === "string" ? logoUrlRaw : "";

  const totalInfluencers =
    Number((doc as any)?.numberOfInfluencers ?? details?.numberOfInfluencers ?? 0) || 0;

  const selectedList =
    (doc as any)?.selectedInfluencers ??
    (doc as any)?.selectedInfluencerIds ??
    (doc as any)?.selectedCreators ??
    (doc as any)?.selectedInfluencer ??
    details?.selectedInfluencers ??
    details?.selectedInfluencerIds ??
    [];

  const selectedCount = asArray(selectedList).length;

  const startAt = (doc as any)?.startAt ?? details?.startAt ?? null;
  const endAt = (doc as any)?.endAt ?? details?.endAt ?? null;

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
    } else if ((doc as any)?.timeline) {
      timelineText = String((doc as any)?.timeline);
    }
  } catch { }

  const currency =
    String((doc as any)?.currency ?? details?.currency ?? (doc as any)?.budgetCurrency ?? "USD") ||
    "USD";

  const budgetRaw =
    (doc as any)?.campaignBudget ?? details?.campaignBudget ?? (doc as any)?.totalBudget ?? null;

  const budgetNum =
    typeof budgetRaw === "number"
      ? budgetRaw
      : Number(String(budgetRaw ?? "").replace(/[^0-9.]/g, ""));

  const budgetText =
    Number.isFinite(budgetNum) && budgetNum > 0
      ? `${currency} ${budgetNum.toLocaleString("en-US")}`
      : "—";

  const statusText = String((doc as any)?.status ?? "—");

  const startDateText = startAt
    ? new Date(startAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
    : "—";

  const endDateText = endAt
    ? new Date(endAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
    : "—";

  const paymentTypeText = String((doc as any)?.paymentType ?? details?.paymentType ?? "—");

  const hasAppliedValue = Number((doc as any)?.hasApplied ?? 0);
  const showApplyButton = hasAppliedValue === 0;


  const categoryTags = (() => {
    const fromDetails = details?.category?.name ? [String(details.category.name).trim()] : [];

    const fromCategories = asArray((doc as any)?.categories)
      .map((item: any) => String(item?.categoryName ?? "").trim())
      .filter(Boolean);

    const fromRaw = toTagValues(
      (doc as any)?.campaignCategory ??
      (doc as any)?.category ??
      (doc as any)?.categories ??
      []
    );

    return Array.from(new Set([...fromDetails, ...fromCategories, ...fromRaw]));
  })();

  const subcategoryTags = (() => {
    const fromDetails = asArray(details?.subcategories)
      .map((item: any) => String(item?.name ?? "").trim())
      .filter(Boolean);

    const fromCategories = asArray((doc as any)?.categories)
      .map((item: any) => String(item?.subcategoryName ?? "").trim())
      .filter(Boolean);

    const fromRaw = toTagValues(
      (doc as any)?.campaignSubcategory ??
      (doc as any)?.subcategory ??
      (doc as any)?.subCategory ??
      (doc as any)?.subcategories ??
      (doc as any)?.subCategories ??
      []
    );

    return Array.from(new Set([...fromDetails, ...fromCategories, ...fromRaw]));
  })();

  const campaignTypeTags = (() => {
    return Array.from(
      new Set(
        toTagValues(
          (doc as any)?.campaignType ??
          (doc as any)?.campaignTypes ??
          details?.campaignType ??
          details?.campaignTypes ??
          []
        )
      )
    );
  })();

  const campaignGoalTags = (() => {
    const detailGoals = asArray(details?.campaignGoals ?? []);

    const goalById = new Map<string, string>();
    detailGoals.forEach((goal: any) => {
      const id = normalizeMongoId(goal?.id ?? goal?._id);
      const label = String(goal?.goal ?? goal?.name ?? goal?.label ?? "").trim();
      if (id && label) goalById.set(id, label);
    });

    const rawGoals =
      (doc as any)?.campaignGoals ??
      (doc as any)?.campaignGoal ??
      details?.campaignGoals ??
      details?.campaignGoal ??
      [];

    const resolved = asArray(rawGoals)
      .map((goal: any) => {
        if (typeof goal === "string") {
          const s = goal.trim();
          return goalById.get(s) ?? s;
        }

        if (goal && typeof goal === "object") {
          const id = normalizeMongoId(goal?.id ?? goal?._id);
          return (
            String(goal?.goal ?? goal?.name ?? goal?.label ?? "").trim() ||
            goalById.get(id) ||
            ""
          );
        }

        return "";
      })
      .filter(Boolean);

    return Array.from(new Set(resolved));
  })();

  const lorem10 = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do.";

  const backendImageUrls = (productImages ?? [])
    .map((img: any) => img?.url || img?.src || img?.path || "")
    .filter(Boolean);

  const carouselImages = backendImageUrls.length ? backendImageUrls : [];

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

  return (
    <div className={PAGE_WRAP}>
      {/* ===== Top Campaign Header ===== */}
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
                className="
                  w-full max-w-[25.0625rem]
                  text-[#1A1A1A] font-bold text-[1.5rem] leading-8 tracking-normal
                  line-clamp-2
                "
                style={{ fontFamily: "Inter" }}
                title={(doc as any)?.campaignTitle ?? "Campaign"}
              >
                {(doc as any)?.campaignTitle ?? "Campaign"}
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

            <div className="flex h-8 items-center gap-2">
              <CampaignStatusBadge status={statusText} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== Category ===== */}
      <div className="w-full">
        <div className="flex flex-col items-stretch gap-5 self-stretch lg:flex-row lg:items-stretch">
          <TagCard title="Category" values={categoryTags} />
          <TagCard title="Subcategory" values={subcategoryTags} />
          <TagCard title="Campaign type" values={campaignTypeTags} />
          <TagCard title="Campaign Goals" values={campaignGoalTags} />
        </div>
      </div>

      <div className="w-full rounded-[1.25rem] bg-white p-5 flex flex-col items-start gap-6">

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
                  {carouselImages.map((src, idx) => (
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
                  {carouselImages.map((_, i) => (
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
      </div>

      <div className="mb-[1.55rem] mt-[1.75rem] h-px w-full bg-[var(--Light-Border-Subtle,#E6E6E6)]" />

      <div
        className="flex w-full flex-col items-start gap-6 self-stretch"
        style={{ fontFamily: "Inter" }}
      >
        <div className="flex w-full items-center justify-between self-stretch">
          <div className="text-[#1A1A1A] text-[1.25rem] font-semibold leading-[1.75rem]">
            Timeline &amp; Payments
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row">
        <div className="flex flex-1 flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] p-3 min-h-[12.375rem]">
          <div className="flex h-12 w-12 items-center justify-center gap-[0.625rem] rounded-[0.5rem] bg-[#F2F2F2] p-3">
            <CalendarDots weight="bold" style={{ width: "1.5rem", height: "1.5rem" }} />
          </div>

          <div className="mt-auto flex flex-col items-start gap-2 self-stretch">
            <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
              Start date
            </div>
            <div className="text-[#1A1A1A] text-[1rem] font-medium leading-[1.5rem]">
              {startDateText}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] p-3 min-h-[12.375rem]">
          <div className="flex h-12 w-12 items-center justify-center gap-[0.625rem] rounded-[0.5rem] bg-[#F2F2F2] p-3">
            <CalendarX weight="bold" style={{ width: "1.5rem", height: "1.5rem" }} />
          </div>

          <div className="mt-auto flex flex-col items-start gap-2 self-stretch">
            <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
              End date
            </div>
            <div className="text-[#1A1A1A] text-[1rem] font-medium leading-[1.5rem]">
              {endDateText}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] p-3 min-h-[12.375rem]">
          <div className="flex h-12 w-12 items-center justify-center gap-[0.625rem] rounded-[0.5rem] bg-[#F2F2F2] p-3">
            <Wallet weight="bold" style={{ width: "1.5rem", height: "1.5rem" }} />
          </div>

          <div className="mt-auto flex flex-col items-start gap-2 self-stretch">
            <div className="text-[#B8B8B8] text-[0.875rem] font-medium leading-[1.25rem]">
              Payment type
            </div>
            <div className="text-[#1A1A1A] text-[1rem] font-medium leading-[1.5rem]">
              {paymentTypeText}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[1.75rem] h-px w-full bg-[var(--Light-Border-Subtle,#E6E6E6)]" />

      <div className="w-full rounded-[1.25rem] bg-white p-5 flex flex-col items-start gap-6">
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

              <div className="flex items-center gap-2">
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
              <div className="text-[#969696] text-[0.875rem] font-normal leading-[1.25rem]">
                —
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-[1.75rem] h-px w-full bg-[var(--Light-Border-Subtle,#E6E6E6)]" />

      <div className="w-full rounded-[1.25rem] bg-white  p-5 flex flex-col items-start gap-6 mb-[1.75rem]">
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
                leftIcon={
                  <DownloadSimple weight="bold" style={{ width: "0.875rem", height: "0.875rem" }} />
                }
              >
                <span className="text-center text-[#1A1A1A] text-[0.75rem] font-semibold leading-[1.25rem]">
                  Download
                </span>
              </Button>
            </div>
          ) : null}

          {/* <div className="mt-5 flex flex-col items-start self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3 h-[11.4375rem] gap-[1.3125rem]">
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
          </div> */}
        </div>
      </div>

      <div className="mb-[1.75rem] mt-[1.75rem] h-px w-full" />

      <div
        className="fixed bottom-0 z-40 border-t border-gray-200 bg-white"
        style={{
          left: `${sidebarWidth}px`,
          width: `calc(100vw - ${sidebarWidth}px)`,
        }}
      >
        <div className="flex h-20 w-full items-center justify-end pr-4 sm:pr-6 lg:pr-8">
          <div className="flex w-auto items-center gap-2">
            <Button
              type="button"
              className="my-0 bg-white text-sm font-medium !text-gray-900 shadow-none hover:underline"
            >
              Go to Dashboard
            </Button>

            {Number((doc as any)?.hasApplied ?? 0) === 1 ? (
              <Button
                type="button"
                disabled
                className="my-0 h-11 w-auto cursor-default rounded-[0.75rem] border border-[#E6E6E6] bg-[#F2F2F2] px-8 text-[#969696] hover:bg-[#F2F2F2]"
              >
                Applied
              </Button>
            ) : (
              <Button className="my-0 h-11 w-auto rounded-[0.75rem] bg-black px-8 text-white hover:bg-black/90">
                Apply
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

