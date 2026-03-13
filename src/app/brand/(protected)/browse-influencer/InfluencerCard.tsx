"use client";

import React, { useMemo, useState } from "react";
import type { Platform } from "./filters";
import {
  BookmarkSimple,
  CheckCircle,
  DotsThreeOutline,
  GlobeHemisphereWest,
  InstagramLogo,
  PaperPlaneTilt,
  TiktokLogo,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/buttonComp";

interface InfluencerCardProps {
  platform: Platform;
  influencer: any;
  onViewProfile?: (influencer: any) => void;
}

function getPlatformIcon(platform?: string, size = 13) {
  const key = String(platform || "").toLowerCase();

  switch (key) {
    case "instagram":
      return <InstagramLogo size={size} weight="fill" />;
    case "youtube":
      return <YoutubeLogo size={size} weight="fill" />;
    case "tiktok":
      return <TiktokLogo size={size} weight="fill" />;
    case "twitter":
    case "x":
      return <XLogo size={size} weight="fill" />;
    default:
      return <GlobeHemisphereWest size={size} weight="fill" />;
  }
}

function getCountryLabel(influencer: any) {
  return (
    influencer?.country ||
    influencer?.location?.country ||
    influencer?.location ||
    ""
  );
}

function getFlagEmoji(countryCode?: string) {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}

export function InfluencerCard({
  platform,
  influencer,
  onViewProfile,
}: InfluencerCardProps) {
  const [bgFailed, setBgFailed] = useState(false);

  const platformKey: Platform =
    (influencer?.platform as Platform) || platform;

  const username =
    influencer?.username || influencer?.handle || influencer?.name || "unknown";

  const handle = String(username).startsWith("@")
    ? String(username)
    : `@${username}`;

  const displayName =
    influencer?.fullname ||
    influencer?.fullName ||
    influencer?.name ||
    username ||
    "Unknown Creator";

  const followers =
    influencer?.followers ??
    influencer?.followerCount ??
    influencer?.stats?.followers ??
    0;

  const engagementRate =
    influencer?.engagementRate ??
    influencer?.stats?.engagementRate ??
    0;

  const averageViews =
    influencer?.averageViews ??
    influencer?.stats?.avgViews ??
    influencer?.stats?.views ??
    0;

  const bio =
    influencer?.bio ||
    influencer?.description ||
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry dummy text of Lorem Ipsum more...";

  const avatar =
    influencer?.picture ||
    influencer?.avatar ||
    influencer?.profilePicUrl ||
    influencer?.thumbnail ||
    influencer?.profilePicture ||
    "";

  const isVerified = Boolean(influencer?.isVerified || influencer?.verified);
  const profileUrl = influencer?.url || "#";

  const categories = useMemo(() => {
    const raw = influencer?.categories;

    if (!Array.isArray(raw)) {
      return influencer?.category ? [String(influencer.category)] : [];
    }

    const names = raw.flatMap((item: any) => {
      if (!item) return [];
      if (typeof item === "string") return [item];
      return [
        item.categoryName,
        item.subcategoryName,
        item.name,
        item.subcategory,
      ].filter(Boolean);
    });

    return Array.from(
      new Set(names.map((x: any) => String(x).trim()).filter(Boolean))
    ).slice(0, 2);
  }, [influencer]);

  const country = getCountryLabel(influencer);
  const countryCode =
    influencer?.countryCode ||
    influencer?.location?.countryCode ||
    influencer?.country_code ||
    "";

  const formatNumber = (num?: number | null) => {
    if (num == null) return "—";
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
    return Number(num).toLocaleString();
  };

  const formatRate = (rate?: number | null) => {
    if (rate == null) return "—";
    const normalized = rate > 1 ? rate : rate * 100;
    return `${normalized.toFixed(2)}%`;
  };

  const openExternalProfile = () => {
    if (!profileUrl || profileUrl === "#") return;
    window.open(profileUrl, "_blank", "noopener,noreferrer");
  };

  const handlePrimaryAction = () => {
    if (onViewProfile) {
      onViewProfile(influencer);
      return;
    }
    openExternalProfile();
  };

  const visiblePlatforms = Array.isArray(influencer?.platforms)
    ? influencer.platforms.slice(0, 3)
    : [platformKey];

  return (
    <div className="group relative isolate w-full max-w-[380px] overflow-hidden rounded-[28px] bg-[#ddd1bb] shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
      {/* Background */}
      {avatar && !bgFailed ? (
        <img
          src={avatar}
          alt={displayName}
          loading="lazy"
          onError={() => setBgFailed(true)}
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#efe7d7] via-[#dcc7af] to-[#b99a7d]" />
      )}

      {/* Warm overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,248,235,0.18),rgba(120,75,35,0.08)_35%,rgba(92,56,30,0.18)_70%,rgba(70,42,20,0.34))]" />
      <div className="absolute inset-0 backdrop-blur-[1.5px]" />

      {/* Content */}
      <div className="relative flex min-h-[520px] flex-col justify-between p-4 sm:p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/40 px-3 py-2 text-[13px] font-medium text-zinc-900 backdrop-blur-md">
            <span className="text-sm leading-none">
              {getFlagEmoji(countryCode)}
            </span>
            <span className="max-w-[140px] truncate">
              {country || "Worldwide"}
            </span>
          </div>

          <button
            type="button"
            aria-label="More options"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-white/30 text-zinc-900 backdrop-blur-md transition hover:bg-white/45"
          >
            <DotsThreeOutline size={18} weight="bold" />
          </button>
        </div>

        {/* Middle / Bottom */}
        <div className="mt-auto pt-10 text-white">
          <div className="mx-auto max-w-[88%] text-center">
            <div className="flex items-center justify-center gap-1.5">
              <h3 className="text-[24px] font-semibold tracking-tight sm:text-[26px]">
                {displayName}
              </h3>

              {isVerified && (
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#2196f3] text-white shadow"
                  aria-label="Verified account"
                  title="Verified account"
                >
                  <CheckCircle size={12} weight="fill" />
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm text-white/90">
              <span>{handle}</span>

              {categories[0] && (
                <span className="rounded-full border border-white/35 bg-white/12 px-3 py-1 text-[12px] text-white/90 backdrop-blur-sm">
                  {categories[0]}
                </span>
              )}
            </div>

            <p
              title={bio}
              className="mt-5 line-clamp-3 text-left text-[13px] leading-6 text-white/88 sm:text-[14px]"
            >
              {bio}
            </p>
          </div>

          {/* Stats row */}
          <div className="mt-8 grid grid-cols-4 items-end gap-3 text-white">
            <div>
              <p className="text-[14px] font-semibold sm:text-[16px]">
                {formatNumber(followers)}
              </p>
              <p className="mt-1 text-[12px] text-white/80">followers</p>
            </div>

            <div>
              <p className="text-[14px] font-semibold sm:text-[16px]">
                {formatRate(engagementRate)}
              </p>
              <p className="mt-1 text-[12px] text-white/80">Avg Eng.</p>
            </div>

            <div>
              <p className="text-[14px] font-semibold sm:text-[16px]">
                {formatNumber(averageViews)}
              </p>
              <p className="mt-1 text-[12px] text-white/80">Avg views</p>
            </div>

            <div className="justify-self-end text-right">
              <div className="flex justify-end -space-x-1.5">
                {visiblePlatforms.map((item: any, index: number) => (
                  <span
                    key={`${item}-${index}`}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/50 bg-white/85 text-zinc-900 shadow-sm"
                  >
                    {getPlatformIcon(
                      typeof item === "string" ? item : item?.name || platformKey,
                      11
                    )}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-[12px] text-white/80">Platforms</p>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-[#111111] px-5 text-[15px] font-semibold text-white shadow-[0_12px_24px_rgba(0,0,0,0.22)] transition hover:translate-y-[-1px] hover:bg-black"
            >
              <PaperPlaneTilt size={18} weight="regular" />
              <span>Send an Invite</span>
            </button>

            <button
              type="button"
              aria-label="Save influencer"
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/55 bg-white/18 text-white backdrop-blur-md transition hover:bg-white/28"
            >
              <BookmarkSimple size={20} weight="regular" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}