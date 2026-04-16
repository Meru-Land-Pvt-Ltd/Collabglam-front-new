import { BadgeCheck } from "lucide-react";
import { CheckCircleIcon } from "@phosphor-icons/react";
import {
  type InfluencerReport,
  type MediaKit,
  type SubscriptionPlan,
  PLAN_DISPLAY_NAME,
  buildInitials,
  getPlatformIcon,
} from "./viewModashShared";

interface CreatorHeaderProps {
  primaryReport: InfluencerReport | null;
  mediaKit: MediaKit | null;
  activePlan: SubscriptionPlan;
  isVerified?: boolean;
  accountType?: string;
  postsCount?: number;
}

export function CreatorHeader({
  primaryReport,
  mediaKit,
  activePlan,
  isVerified,
  accountType,
  postsCount,
}: CreatorHeaderProps) {
  const displayProfile = mediaKit?.primaryInfluencerReport || primaryReport || null;

  const primaryPlatformProfile = mediaKit?.primaryInfluencerReport || null;

  const openProfile = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mb-6 flex flex-col gap-5 border-b border-[#efe8dd] pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#efe7da] ring-4 ring-white shadow-sm">
          {displayProfile?.picture ? (
            <img
              src={displayProfile.picture}
              alt={displayProfile.name || displayProfile.fullname || "Creator"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm font-bold text-[#5d5349]">
              {buildInitials(
                displayProfile?.name || displayProfile?.fullname || mediaKit?.name
              )}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] font-bold tracking-tight text-[#1f1f1f]">
              {displayProfile?.name ||
                displayProfile?.fullname ||
                mediaKit?.name ||
                "Creator Name"}
            </h1>

            {(isVerified ?? displayProfile?.isVerified) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff2d9] px-2.5 py-1 text-xs font-semibold text-[#c57f00]">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}

            <span className="text-xs font-medium text-[#7f786d]">Active</span>
            <span className="text-xs font-medium text-[#7f786d]">Public</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#7d7569]">
            <span>@{displayProfile?.username || "creator_handle"}</span>
            {/* <span>ID: {displayProfile?.modashId || displayProfile?._id || "—"}</span> */}
            <span>{mediaKit?.country || displayProfile?.country || "Philippines"}</span>
            <span>{accountType || displayProfile?.accountType || "Business"}</span>
            {(postsCount ?? displayProfile?.postsCount) ? (
              <span>{(postsCount ?? displayProfile?.postsCount)?.toLocaleString()} posts</span>
            ) : null}
          </div>

          {displayProfile?.bio ? (
            <p className="mt-2 max-w-lg text-xs leading-5 text-[#7f786d]">
              {displayProfile.bio}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {primaryPlatformProfile?.provider ? (
              (() => {
                const Icon = getPlatformIcon(primaryPlatformProfile.provider);

                return (
                  <button
                    type="button"
                    onClick={() => openProfile(primaryPlatformProfile.url)}
                    className={`inline-flex items-center gap-2 rounded-full border border-[#e8e0d5] bg-white px-3 py-2 text-xs text-[#5e584f] transition ${
                      primaryPlatformProfile.url
                        ? "cursor-pointer hover:bg-[#fff9f1]"
                        : "cursor-default"
                    }`}
                  >
                    <CheckCircleIcon size={16} weight="fill" className="text-[#d39305]" />
                    <Icon className="h-3.5 w-3.5" />
                    <span className="font-medium capitalize">
                      {primaryPlatformProfile.provider}
                    </span>
                    <span className="text-[#9a9287]">
                      {primaryPlatformProfile.username
                        ? `@${primaryPlatformProfile.username}`
                        : "—"}
                    </span>
                  </button>
                );
              })()
            ) : (
              <div className="rounded-full border border-[#e8e0d5] bg-white px-3 py-2 text-xs text-[#7d7569]">
                No primary social profile
              </div>
            )}
          </div>
        </div>
      </div>

      {/* <div className="rounded-2xl border border-[#efe8dd] bg-[#fffdfa] px-5 py-4 text-right">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
          System status
        </div>
        <div className="mt-2 text-sm font-semibold text-[#1f1f1f]">
          Account health: Optimal
        </div>
        <div className="mt-1 text-xs text-[#7f786d]">
          Visibility mapped to {PLAN_DISPLAY_NAME[activePlan]} plan
        </div>
      </div> */}
    </div>
  );
}