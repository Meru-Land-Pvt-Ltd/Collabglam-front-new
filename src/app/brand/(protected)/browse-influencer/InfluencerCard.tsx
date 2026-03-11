"use client";

import React, { useMemo, useState } from "react";
import type { Platform } from "./filters";
import { platformTheme } from "./utils/platform";
import {
  ArrowSquareOut,
  CheckCircle,
  GlobeHemisphereWest,
  InstagramLogo,
  LockSimple,
  MapPin,
  TiktokLogo,
  UsersThree,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/buttonComp";

interface InfluencerCardProps {
  platform: Platform;
  influencer: any;
  onViewProfile?: (influencer: any) => void;
}

function getPlatformIcon(platform?: string) {
  const key = String(platform || "").toLowerCase();

  switch (key) {
    case "instagram":
      return <InstagramLogo size={14} weight="fill" />;
    case "youtube":
      return <YoutubeLogo size={14} weight="fill" />;
    case "tiktok":
      return <TiktokLogo size={14} weight="fill" />;
    case "twitter":
    case "x":
      return <XLogo size={14} weight="fill" />;
    default:
      return <GlobeHemisphereWest size={14} weight="fill" />;
  }
}

export function InfluencerCard({
  platform,
  influencer,
  onViewProfile,
}: InfluencerCardProps) {
  const [bgFailed, setBgFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const platformKey: Platform =
    (influencer?.platform as Platform) || platform;

  const theme = platformTheme[platformKey];

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
    influencer?.stats?.views;

  const bio = influencer?.bio || influencer?.description || "";

  const country =
    influencer?.country ||
    influencer?.location?.country ||
    "";

  const state =
    influencer?.state ||
    influencer?.location?.state ||
    "";

  const city =
    influencer?.city ||
    influencer?.location?.city ||
    "";

  const location =
    influencer?.location && typeof influencer.location === "string"
      ? influencer.location
      : [city, state, country].filter(Boolean).join(", ");

  const language =
    typeof influencer?.language === "string"
      ? influencer.language
      : influencer?.language?.name || influencer?.language?.code || "";

  const categories = useMemo(() => {
    const raw = influencer?.categories;

    if (!Array.isArray(raw)) {
      return influencer?.category ? [influencer.category] : [];
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

    return Array.from(new Set(names.map((x: any) => String(x).trim()).filter(Boolean))).slice(0, 3);
  }, [influencer]);

  const avatar =
    influencer?.picture ||
    influencer?.avatar ||
    influencer?.profilePicUrl ||
    influencer?.thumbnail ||
    influencer?.profilePicture ||
    "";

  const isVerified = Boolean(influencer?.isVerified || influencer?.verified);
  const isPrivate = Boolean(influencer?.isPrivate);
  const profileUrl = influencer?.url || "#";

  const formatNumber = (num?: number | null) => {
    if (num == null) return "—";
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return Number(num).toLocaleString();
  };

  const formatRate = (rate?: number | null) => {
    if (rate == null) return "—";
    const normalized = rate > 1 ? rate : rate * 100;
    return `${normalized.toFixed(2)}%`;
  };

  const initials = String(displayName)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const openExternalProfile = () => {
    if (!profileUrl || profileUrl === "#") return;
    window.open(profileUrl, "_blank", "noopener,noreferrer");
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(influencer);
      return;
    }
    openExternalProfile();
  };

  return (
    <div className="group relative isolate w-full h-full min-h-[520px] overflow-hidden rounded-[30px] border border-black/5 bg-zinc-200 shadow-[0_12px_40px_rgba(15,23,42,0.14)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_56px_rgba(15,23,42,0.2)]">
      {/* Background image */}
      {avatar && !bgFailed ? (
        <img
          src={avatar}
          alt={displayName}
          loading="lazy"
          className="absolute inset-0 z-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
          onError={() => setBgFailed(true)}
        />
      ) : null}

      {/* Fallback bg only when image missing/failed */}
      {(!avatar || bgFailed) && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-300" />
      )}

      {/* Overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/10 via-black/15 to-black/80" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-[70%] bg-gradient-to-t from-black/85 via-black/50 to-transparent" />

      {/* Top chips */}
      <div className="absolute inset-x-0 top-0 z-20 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-md ${theme?.color || "bg-zinc-900"}`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                {getPlatformIcon(platformKey)}
              </span>
              <span className="truncate">
                {theme?.label || platformKey || "Platform"}
              </span>
            </div>

            {country && (
              <div className="inline-flex max-w-[180px] items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-medium text-zinc-900 backdrop-blur-md">
                <MapPin size={13} weight="fill" />
                <span className="truncate">{country}</span>
              </div>
            )}
          </div>

          {profileUrl !== "#" && (
            <Button onClick={openExternalProfile}>
              <ArrowSquareOut size={18} weight="bold" />
            </Button>
          )}
        </div>
      </div>

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-4 sm:p-5">
        <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 sm:p-5 text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-[24px] font-semibold tracking-tight text-white">
                  {displayName}
                </h3>

                {isVerified && (
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-white shadow-md"
                    aria-label="Verified account"
                    title="Verified account"
                  >
                    <CheckCircle size={14} weight="fill" />
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/75">
                <span className="truncate">{handle}</span>

                {isPrivate && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-white/12 px-2 py-1 text-[11px] font-medium text-white/90 ring-1 ring-white/10"
                    aria-label="Private account"
                    title="Private account"
                  >
                    <LockSimple size={12} weight="fill" />
                    Private
                  </span>
                )}
              </div>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/12">
              {avatar && !avatarFailed ? (
                <img
                  src={avatar}
                  alt={`${displayName} avatar`}
                  className="h-full w-full object-cover"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <span className="text-sm font-semibold text-white/90">
                  {initials || <UsersThree size={20} weight="fill" />}
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {bio && (
            <p className="mt-3 line-clamp-2 text-sm leading-5 text-white/78">
              {bio}
            </p>
          )}

          {/* Meta */}
          {(location || language || categories.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {location && (
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-medium text-white/90 ring-1 ring-white/10">
                  <MapPin size={12} weight="fill" />
                  <span className="truncate">{location}</span>
                </span>
              )}

              {language && (
                <span className="inline-flex rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-medium text-white/90 ring-1 ring-white/10">
                  {language}
                </span>
              )}

              {categories.map((cat: string) => (
                <span
                  key={cat}
                  className="inline-flex rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-medium text-white/90 ring-1 ring-white/10"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/12 pt-4">
            <div className="rounded-2xl border border-white/8 bg-white/8 px-3 py-3 text-center">
              <p className="text-lg font-semibold tracking-tight text-white">
                {formatNumber(followers)}
              </p>
              <p className="mt-1 text-[11px] text-white/65">Followers</p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/8 px-3 py-3 text-center">
              <p className="text-lg font-semibold tracking-tight text-white">
                {formatRate(engagementRate)}
              </p>
              <p className="mt-1 text-[11px] text-white/65">Engagement</p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/8 px-3 py-3 text-center">
              <p className="text-lg font-semibold tracking-tight text-white">
                {averageViews == null ? "—" : formatNumber(averageViews)}
              </p>
              <p className="mt-1 text-[11px] text-white/65">Avg. Views</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleViewProfile}>View Profile</Button>

            {profileUrl !== "#" && (
              <Button onClick={openExternalProfile}>
                <ArrowSquareOut size={18} weight="bold" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}