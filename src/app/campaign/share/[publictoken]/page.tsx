"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CaretLeft, CaretRight, DownloadSimple, FilePdf } from "@phosphor-icons/react";
import { Button } from "@/components/ui/buttonComp";
import { apiGetPublicCampaign } from "@/app/brand/services/brandApi";

function asArray<T = any>(v: any): T[] {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
}

function getMediaUrl(item: any): string {
    if (!item) return "";
    if (typeof item === "string") return item.trim();

    return String(
        item?.dataUrl ??
        item?.url ??
        item?.src ??
        item?.path ??
        item?.image ??
        item?.imageUrl ??
        item?.secure_url ??
        ""
    ).trim();
}

export default function PublicCampaignPage() {
    const params = useParams();
    const token = String((params as any)?.publictoken ?? "");
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [campaign, setCampaign] = useState<any>(null);

    const [activeSlide, setActiveSlide] = useState(0);
    const carouselRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!token) return;

        let cancelled = false;

        const run = async () => {
            try {
                setLoading(true);
                setError("");

                const res: any = await apiGetPublicCampaign(token);
                if (cancelled) return;

                const doc = res?.doc ?? res?.data?.doc ?? null;
                setCampaign(doc);
            } catch (e: any) {
                if (cancelled) return;
                setError(e?.message || "Failed to load campaign");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [token]);

    const productImages = asArray(campaign?.productImages);
    const imageUrls = productImages.map(getMediaUrl).filter(Boolean);

    const logoUrl = imageUrls[0] || "";
    const startDateText = campaign?.startAt
        ? new Date(campaign.startAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
        : "—";
    const endDateText = campaign?.endAt
        ? new Date(campaign.endAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
        : "—";

    const currency = "USD";
    const budget = Number(campaign?.campaignBudget ?? campaign?.budget ?? 0);
    const budgetText = budget ? `${currency} ${budget.toLocaleString("en-US")}` : "—";

    const scrollToSlide = (idx: number) => {
        const el = carouselRef.current;
        if (!el || imageUrls.length === 0) return;

        const clamped = Math.max(0, Math.min(idx, imageUrls.length - 1));
        const child = el.children.item(clamped) as HTMLElement | null;
        if (child) {
            child.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
        }
        setActiveSlide(clamped);
    };

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

    if (loading) {
        return (
            <div className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl rounded-2xl border border-[#E6E6E6] bg-white p-6">
                    <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
                    <div className="mt-3 h-4 w-80 animate-pulse rounded bg-gray-200" />
                    <div className="mt-6 h-60 animate-pulse rounded-2xl bg-gray-100" />
                </div>
            </div>
        );
    }

    if (error || !campaign) {
        return (
            <div className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl rounded-2xl border border-[#E6E6E6] bg-white p-6">
                    <div className="text-lg font-semibold text-[#1A1A1A]">Campaign not available</div>
                    <p className="mt-2 text-sm text-red-600">{error || "This campaign is unavailable."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
                <div className="rounded-[1.25rem] border border-[#E6E6E6] bg-white p-6">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                                <div className="flex h-[6.25rem] w-[6.25rem] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E6E6E6] bg-[#F7F7F7]">
                                    {logoUrl ? (
                                        <img
                                            src={logoUrl}
                                            alt={campaign?.campaignTitle || "Campaign"}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-2xl font-semibold text-[#1A1A1A]">
                                            {String(campaign?.campaignTitle ?? "C").charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                <div className="min-w-0">
                                    {campaign?.productLink ? (
                                        <a
                                            href={campaign.productLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-2 inline-block break-all text-sm text-[#6B7280] underline"
                                        >
                                            {campaign?.productLink}
                                        </a>
                                    ) : null}
                                </div>
                            </div>

                            <div className="sm:ml-6 sm:shrink-0">
                                <Button
                                    variant="raised"
                                    size="sm"
                                    onClick={() => router.push("/influencer/login")}
                                    className="my-0 h-10 rounded-xl border border-black bg-black px-5 text-white shadow-none hover:bg-black"
                                >
                                    <span className="font-semibold text-white">Apply</span>
                                </Button>
                            </div>
                        </div>

                        <div>
                            <h1 className="text-[1.75rem] font-bold leading-9 text-[#1A1A1A]">
                                {campaign?.campaignTitle || "Campaign"}
                            </h1>

                            {campaign?.productLink ? (
                                <a
                                    href={campaign.productLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-block break-all text-sm text-[#6B7280] underline"
                                >
                                    {campaign.productLink}
                                </a>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="rounded-[1.25rem] border border-[#E6E6E6] bg-white p-6">
                    <h2 className="text-xl font-semibold text-[#1A1A1A]">Overview</h2>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-[#E6E6E6] p-4">
                            <div className="text-sm text-[#969696]">Status</div>
                            <div className="mt-2 text-base font-semibold text-[#1A1A1A]">
                                {campaign?.status || "—"}
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#E6E6E6] p-4">
                            <div className="text-sm text-[#969696]">Budget</div>
                            <div className="mt-2 text-base font-semibold text-[#1A1A1A]">
                                {budgetText}
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#E6E6E6] p-4">
                            <div className="text-sm text-[#969696]">Start date</div>
                            <div className="mt-2 text-base font-semibold text-[#1A1A1A]">
                                {startDateText}
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#E6E6E6] p-4">
                            <div className="text-sm text-[#969696]">End date</div>
                            <div className="mt-2 text-base font-semibold text-[#1A1A1A]">
                                {endDateText}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-[1.25rem] border border-[#E6E6E6] bg-white p-6">
                    <h2 className="text-xl font-semibold text-[#1A1A1A]">Description</h2>
                    <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#1A1A1A]">
                        {campaign?.description || "—"}
                    </div>
                </div>

                <div className="rounded-[1.25rem] border border-[#E6E6E6] bg-white p-6">
                    <h2 className="text-xl font-semibold text-[#1A1A1A]">Platforms</h2>
                    <div className="mt-4 text-sm font-medium text-[#1A1A1A]">
                        {Array.isArray(campaign?.platformSelection) && campaign.platformSelection.length
                            ? campaign.platformSelection.join(", ")
                            : "—"}
                    </div>
                </div>

                <div className="rounded-[1.25rem] border border-[#E6E6E6] bg-white p-6">
                    <h2 className="text-xl font-semibold text-[#1A1A1A]">Images / References</h2>

                    {imageUrls.length ? (
                        <>
                            <div
                                ref={carouselRef}
                                onScroll={onCarouselScroll}
                                className="mt-5 flex gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                            >
                                {imageUrls.map((src: string, idx: number) => (
                                    <div
                                        key={`${src}-${idx}`}
                                        className="h-[14rem] w-[18rem] flex-none overflow-hidden rounded-[1rem] border border-[#E6E6E6]"
                                    >
                                        <img
                                            src={src}
                                            alt={`Campaign image ${idx + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <Button
                                    variant="raised"
                                    size="sm"
                                    onClick={() => scrollToSlide(activeSlide - 1)}
                                    disabled={activeSlide <= 0}
                                    className="my-0 rounded-xl border border-[#E6E6E6] bg-white shadow-none"
                                    leftIcon={<CaretLeft weight="bold" />}
                                >
                                    Prev
                                </Button>

                                <div className="flex gap-2">
                                    {imageUrls.map((_: any, i: number) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => scrollToSlide(i)}
                                            className={`h-2 w-2 rounded-full ${i === activeSlide ? "bg-black" : "bg-[#E5E5E5]"}`}
                                        />
                                    ))}
                                </div>

                                <Button
                                    variant="raised"
                                    size="sm"
                                    onClick={() => scrollToSlide(activeSlide + 1)}
                                    disabled={activeSlide >= imageUrls.length - 1}
                                    className="my-0 rounded-xl border border-[#E6E6E6] bg-white shadow-none"
                                    leftIcon={<CaretRight weight="bold" />}
                                >
                                    Next
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="mt-5 text-sm text-[#969696]">No images available</div>
                    )}
                </div>

                <div className="rounded-[1.25rem] border border-[#E6E6E6] bg-white p-6">
                    <h2 className="text-xl font-semibold text-[#1A1A1A]">Additional Notes</h2>
                    <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#1A1A1A]">
                        {campaign?.additionalNotes || "—"}
                    </div>
                </div>
            </div>
        </div>
    );
}