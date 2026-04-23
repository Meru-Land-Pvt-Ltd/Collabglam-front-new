"use client";

import {
  Copy,
  Download,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from "lucide-react";
import { TiktokLogoIcon } from "@phosphor-icons/react";
import { SectionCard } from "./SectionCard";
import type { InfluencerReport, MediaKit, SupportedPlatform } from "./ViewModashClient";

interface ContactManagementCardProps {
  primaryReport: InfluencerReport | null;
  mediaKit: MediaKit | null;
  onCopy: () => void;
  connectedProfiles?: InfluencerReport[];
  activePlatform?: SupportedPlatform | null;
  onPlatformSelect?: (profile: InfluencerReport) => void;
}

function normalisePlatform(raw?: string | null): SupportedPlatform {
  const value = String(raw ?? "").toLowerCase();
  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("youtube")) return "youtube";
  return "instagram";
}

function getPlatformMeta(provider?: string) {
  const normalized = provider?.toLowerCase();

  if (normalized === "instagram") {
    return { label: "Instagram", Icon: Instagram };
  }

  if (normalized === "youtube") {
    return { label: "YouTube", Icon: Youtube };
  }

  if (normalized === "tiktok") {
    return { label: "TikTok", Icon: TiktokLogoIcon };
  }

  return { label: provider || "Other", Icon: Globe };
}

function getDisplayHandle(profile?: InfluencerReport | null) {
  if (!profile) return "—";
  if (profile.handle) {
    return profile.handle.startsWith("@") ? profile.handle : `@${profile.handle}`;
  }
  if (profile.username) return `@${profile.username}`;
  return "—";
}

export function ContactManagementCard({
  primaryReport,
  mediaKit,
  onCopy,
  connectedProfiles,
  activePlatform,
  onPlatformSelect,
}: ContactManagementCardProps) {
  const activeProvider = primaryReport?.provider ?? mediaKit?.primaryPlatform ?? "instagram";
  const activePlatformMeta = getPlatformMeta(activeProvider);

  const rawPlatformProfiles: InfluencerReport[] =
    connectedProfiles?.length
      ? connectedProfiles
      : mediaKit?.influencerReports?.length
      ? mediaKit.influencerReports
      : mediaKit?.socialProfiles || [];

  const uniqueConnectedPlatforms = Array.from(
    new Map(
      rawPlatformProfiles
        .filter((item) => item?.provider)
        .map((item) => [normalisePlatform(item.provider), item])
    ).values()
  );

  const socialRows = [
    {
      label: activePlatformMeta.label,
      value: getDisplayHandle(primaryReport),
      icon: activePlatformMeta.Icon,
    },
    // {
    //   label: "Email",
    //   value: mediaKit?.email || "—",
    //   icon: Mail,
    // },
    // {
    //   label: "Phone",
    //   value: mediaKit?.phone || "—",
    //   icon: Phone,
    // },
    {
      label: "Location",
      value: primaryReport?.country || mediaKit?.country || "—",
      icon: MapPin,
    },
  ];

  return (
    <SectionCard title="Contact & Management" eyebrow="Profile access">
      <div className="space-y-4">
        {socialRows.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[#fff4df] p-2 text-[#d39305]">
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
                  {item.label}
                </div>
                <div className="truncate text-sm text-[#2a2a2a]">{item.value}</div>
              </div>
            </div>
          );
        })}

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
            Connected platforms
          </div>

          {uniqueConnectedPlatforms.length ? (
            <div className="mt-3 flex flex-wrap gap-2 text-[#7d7569]">
              {uniqueConnectedPlatforms.map((profile, index) => {
                const { Icon, label } = getPlatformMeta(profile.provider);
                const profilePlatform = normalisePlatform(profile.provider);
                const isActive = activePlatform
                  ? profilePlatform === activePlatform
                  : profilePlatform === normalisePlatform(primaryReport?.provider);

                return (
                  <button
                    key={`${profile.provider || "platform"}-${profile.modashId || profile._id || profile.username || index}`}
                    type="button"
                    onClick={() => onPlatformSelect?.(profile)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition ${
                      isActive
                        ? "border-[#d9a441] bg-[#fff4df] text-[#1f1f1f]"
                        : "border-[#e8e0d5] bg-white text-[#5e584f] hover:bg-[#fff9f1]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{label}</span>
                    {profile.username ? (
                      <span className="text-[#9a9287]">@{profile.username}</span>
                    ) : profile.handle ? (
                      <span className="text-[#9a9287]">
                        {profile.handle.startsWith("@")
                          ? profile.handle
                          : `@${profile.handle}`}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 text-sm text-[#7d7569]">No connected platforms</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onCopy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f1f1f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black"
          >
            <Copy className="h-4 w-4" />
            Copy kit
          </button>

          {/* <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e8e0d5] bg-white px-4 py-3 text-sm font-semibold text-[#1f1f1f] transition hover:bg-[#fff9f1]">
            <Download className="h-4 w-4" />
            Export
          </button> */}
        </div>
      </div>
    </SectionCard>
  );
}