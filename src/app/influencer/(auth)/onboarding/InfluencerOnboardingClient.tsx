"use client";

import * as React from "react";
import Link from "next/link";
import {
  CaretLeft,
  InstagramLogo,
  YoutubeLogo,
  TiktokLogo,
  CheckCircle,
} from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/buttonComp";
import { cn } from "@/lib/utils";
import {
  FloatingMultiSelect,
  FloatingSelect,
  SelectItem,
} from "@/components/ui/selectComp";

import { toast, ToastStyles } from "@/components/ui/toast";

import {
  apiResolveModashProfile,
  apiSaveInfluencerOnboarding,
  getApiErrorMessage,
} from "../../services/influencerApi";

type Chip = { label: string; value: string };
type QA = { question: string; answers: string[] };

type InfluencerOnboardingData = {
  selectedPlatforms: string[];
  primaryPlatform: string;

  formats: string[];
  budgetRange: string;
  projectLength: string;
  compensationTypes: string[];

  campaignGoals: string[];
  otherCampaignGoal: string;

  industries: string[];
  preferredProjectType: string[];
  deliveryPreference: string[];
};

type PlatformState = {
  handle: string;
  username?: string;
  resolvedData?: any;
  loading: boolean;
  resolved: boolean;
  error?: string;
};

type PlatformPreview = {
  username: string;
  handle: string;
  displayName: string;
  imageUrl?: string;
  profileUrl?: string;
};

type OnboardingStepParam = "page1" | "page2" | "page3";

const TOTAL_STEPS = 3;
const REDIRECT_TOAST_KEY = "cg_redirect_toast_v1";
const ONBOARDING_RESUME_KEY = "cg_influencer_onboarding_resume_step";

type RedirectToastPayload = {
  icon?: "success" | "error" | "info" | "warning";
  title?: string;
  text: string;
};

function setRedirectToast(payload: RedirectToastPayload) {
  try {
    sessionStorage.setItem(
      REDIRECT_TOAST_KEY,
      JSON.stringify({ ...payload, _ts: Date.now() })
    );
  } catch {
    // ignore
  }
}

function normalizeApiPayload(resp: any) {
  if (
    resp &&
    typeof resp === "object" &&
    "data" in resp &&
    resp.data &&
    resp.data.success !== undefined
  ) {
    return resp.data;
  }
  return resp;
}

function getBackendMessage(resp: any) {
  const payload = normalizeApiPayload(resp);
  const message =
    payload?.data?.message || payload?.message || "Saved successfully";
  const influencerId = payload?.data?.influencerId;
  return influencerId ? `${message} (ID: ${influencerId})` : message;
}

function getBackendRoute(resp: any): string | undefined {
  const payload = normalizeApiPayload(resp);
  return (
    payload?.route ||
    payload?.data?.route ||
    resp?.route ||
    resp?.data?.route ||
    undefined
  );
}

function stripAt(value: string) {
  return String(value || "").trim().replace(/^@+/, "");
}

function withAt(value: string) {
  const v = stripAt(value);
  return v ? `@${v}` : "";
}

function isValidStepParam(
  value: string | null | undefined
): value is OnboardingStepParam {
  return value === "page1" || value === "page2" || value === "page3";
}

function getStepIndexFromParam(
  value: string | null | undefined
): number | null {
  if (value === "page1") return 0;
  if (value === "page2") return 1;
  if (value === "page3") return 2;
  return null;
}

function getStepParamFromIndex(index: number): OnboardingStepParam {
  if (index <= 0) return "page1";
  if (index === 1) return "page2";
  return "page3";
}

function persistOnboardingStep(step: OnboardingStepParam) {
  try {
    sessionStorage.setItem(ONBOARDING_RESUME_KEY, step);
  } catch {
    // ignore
  }
}

function readStoredOnboardingStep(): OnboardingStepParam | null {
  try {
    const raw = sessionStorage.getItem(ONBOARDING_RESUME_KEY);
    return isValidStepParam(raw) ? raw : null;
  } catch {
    return null;
  }
}

function clearStoredOnboardingStep() {
  try {
    sessionStorage.removeItem(ONBOARDING_RESUME_KEY);
  } catch {
    // ignore
  }
}

function getResolvedSource(raw: any) {
  const source = raw?.profile ?? raw?.data?.profile ?? raw?.data ?? raw ?? {};
  return source?.profile ?? source;
}

function normalizeResolvedProfile(raw: any, typedHandle: string) {
  const profile = getResolvedSource(raw);

  const username = String(
    profile?.username || stripAt(profile?.handle || typedHandle)
  ).trim();

  const handle = String(
    profile?.handle || withAt(username || typedHandle)
  ).trim();

  return {
    username: stripAt(username),
    handle: handle.startsWith("@") ? handle : withAt(handle),
  };
}

function getPlatformProfileUrl(platformKey: string, username: string) {
  const cleanUsername = stripAt(username);
  if (!cleanUsername) return "";

  if (platformKey === "instagram") {
    return `https://www.instagram.com/${cleanUsername}/`;
  }

  if (platformKey === "youtube") {
    return `https://www.youtube.com/@${cleanUsername}`;
  }

  if (platformKey === "tiktok") {
    return `https://www.tiktok.com/@${cleanUsername}`;
  }

  return "";
}

function getResolveProfileUserMessage(error: any, platform: string) {
  const status = Number(error?.response?.status ?? 0);

  const rawMessage = String(
    error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      ""
  ).trim();

  const lower = rawMessage.toLowerCase();

  if (
    lower.includes("profile already exists") ||
    lower.includes("same handle and provider") ||
    lower.includes("already exists")
  ) {
    return `This ${platform} profile is already connected to an existing account. Try another handle or sign in to that profile.`;
  }

  if (status === 400 || status === 404) {
    return `We couldn’t find that ${platform} profile. Please check the handle and try again.`;
  }

  if (
    status >= 500 ||
    lower.includes("internal server error") ||
    lower.includes("valid api token") ||
    lower.includes("developer section") ||
    lower.includes("resolve-profile") ||
    lower.includes("modash")
  ) {
    return `We couldn’t verify your ${platform} handle right now. Please try again in a few minutes.`;
  }

  if (
    lower.includes("network") ||
    lower.includes("failed to fetch") ||
    lower.includes("timeout")
  ) {
    return `We’re having trouble reaching the server. Please check your internet connection and try again.`;
  }

  return `Unable to verify your ${platform} handle right now. Please try again.`;
}

function getPlatformPreview(
  platformKey: string,
  status?: PlatformState
): PlatformPreview | null {
  if (!status?.resolved) return null;

  const profile = getResolvedSource(status?.resolvedData);

  const username = stripAt(
    status?.username ||
      profile?.username ||
      profile?.handle ||
      status?.handle ||
      ""
  );

  const handle = withAt(profile?.handle || status?.handle || username);

  if (!username && !handle) return null;

  const displayName = String(
    profile?.fullName ||
      profile?.fullname ||
      profile?.displayName ||
      profile?.name ||
      username
  ).trim();

  const imageUrl =
    profile?.profilePictureUrl ||
    profile?.profilePicture ||
    profile?.avatarUrl ||
    profile?.avatar ||
    profile?.imageUrl ||
    profile?.image ||
    profile?.picture ||
    "";

  const profileUrl =
    profile?.url ||
    profile?.profileUrl ||
    getPlatformProfileUrl(platformKey, username);

  return {
    username,
    handle: handle || withAt(username),
    displayName: displayName || username,
    imageUrl: imageUrl || undefined,
    profileUrl: profileUrl || undefined,
  };
}

const PLATFORM_LIST = [
  {
    key: "instagram",
    label: "Continue With Instagram",
    inputLabel: "Instagram handle",
    placeholder: "@yourinstagram",
    Icon: InstagramLogo,
  },
  {
    key: "youtube",
    label: "Continue With Youtube",
    inputLabel: "YouTube handle",
    placeholder: "@youryoutube",
    Icon: YoutubeLogo,
  },
  {
    key: "tiktok",
    label: "Continue With TikTok",
    inputLabel: "TikTok handle",
    placeholder: "@yourtiktok",
    Icon: TiktokLogo,
  },
] as const;

const FORMAT_CHIPS: Chip[] = [
  "Reels / Shorts",
  "Stories",
  "Static posts",
  "Long-form video",
  "Tutorials",
  "Reviews",
  "Unboxing",
  "Live sessions",
  "UGC only",
  "Podcast / Audio",
].map((x) => ({ label: x, value: x }));

const BUDGET_RANGES = [
  "Under $100",
  "$100 – $300",
  "$300 – $700",
  "$700 – $1K",
  "$1K – $3K",
  "$3K – $5K",
  "$5K+",
  "Depends on scope",
];

const PROJECT_LENGTHS = [
  "One-off (<2 weeks)",
  "Short-term (2–8 weeks)",
  "Mid-term (2–3 months)",
  "Long-term (3–6 months)",
  "Retainer / ongoing",
];

const COMP_TYPES: Chip[] = [
  "Paid collaboration",
  "Product gifting",
  "Affiliate revenue",
  "Hybrid (paid + gifting)",
  "Revenue share",
  "Performance-based",
].map((x) => ({ label: x, value: x }));

const CAMPAIGN_GOAL_CHIPS: Chip[] = [
  "Awareness",
  "Product launch",
  "Sales/Conversions",
  "Community",
  "UGC creation",
  "App Installs",
  "Traffic",
  "Events",
  "Others",
].map((x) => ({ label: x, value: x }));

const INDUSTRY_CHIPS: Chip[] = [
  "Beauty & Skincare",
  "Fashion & Apparel",
  "Fitness & Wellness",
  "Food & Beverage",
  "Travel & Hospitality",
  "Technology",
  "Finance & Fintech",
  "Education",
  "Gaming",
  "Automotive",
  "Healthcare",
  "Lifestyle brands",
  "E-commerce",
  "Startups",
].map((x) => ({ label: x, value: x }));

const PROJECT_TYPES: Chip[] = [
  "Brand campaigns",
  "Product collaborations",
  "Sponsored content",
  "Affiliate partnerships",
  "Ambassador programs",
  "UGC creation",
  "Event collaborations",
  "Brand launches",
].map((x) => ({ label: x, value: x }));

const DELIVERY_PREFS: Chip[] = [
  "Single deliverable",
  "Series content",
  "Monthly retainers",
  "Campaign-based",
  "Always-on collaborations",
].map((x) => ({ label: x, value: x }));

function includes(arr: string[], v: string) {
  return arr.includes(v);
}

function remove(arr: string[], v: string) {
  return arr.filter((x) => x !== v);
}

function PlatformRow({
  platformKey,
  label,
  inputLabel,
  placeholder,
  Icon,
  selected,
  primary,
  showRadios,
  handleValue,
  status,
  onToggle,
  onMakePrimary,
  onHandleChange,
  onResolveHandle,
}: {
  platformKey: string;
  label: string;
  inputLabel: string;
  placeholder: string;
  Icon: React.ComponentType<any>;
  selected: boolean;
  primary: boolean;
  showRadios: boolean;
  handleValue: string;
  status?: PlatformState;
  onToggle: () => void;
  onMakePrimary: () => void;
  onHandleChange: (value: string) => void;
  onResolveHandle: () => void;
}) {
  const radioId = `primary-${platformKey}`;
  const preview = getPlatformPreview(platformKey, status);

  const hasTypedHandle = Boolean(stripAt(handleValue));
  const isResolvedForCurrentHandle =
    Boolean(status?.resolved) &&
    stripAt(status?.handle || "") === stripAt(handleValue || "");

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex items-center gap-3 w-full max-w-[520px] justify-center">
        {showRadios ? (
          <div
            className={cn(
              "shrink-0",
              !selected ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            )}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <input
              id={radioId}
              type="radio"
              name="primaryPlatform"
              className="sr-only"
              checked={primary}
              disabled={!selected}
              onChange={() => {
                if (!selected) return;
                onMakePrimary();
              }}
            />

            <label
              htmlFor={radioId}
              className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center",
                selected ? "cursor-pointer" : "cursor-not-allowed",
                selected
                  ? "bg-neutral-900"
                  : "bg-white border border-neutral-300"
              )}
              aria-label="Set as primary"
              title={selected ? "Set as primary" : "Select the platform first"}
            >
              {selected ? (
                <span
                  className={cn(
                    "h-3 w-3 rounded-full",
                    primary ? "bg-[#FFBF00]" : "bg-white"
                  )}
                />
              ) : null}
            </label>
          </div>
        ) : null}

        <div
          role="button"
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle();
            }
          }}
          className={cn(
            "w-[480px] h-[68px] max-w-full",
            "rounded-[12px] border bg-white",
            "px-4 flex items-center gap-3 justify-between",
            "border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100",
            "cursor-pointer select-none",
            "outline-none focus:outline-none"
          )}
        >
          <div className="flex items-center gap-3 flex-1">
            <Icon size={20} weight="regular" className="text-neutral-900" />
            <span className="text-[14px] font-medium text-neutral-900">
              {label}
            </span>
          </div>

          {selected ? (
            primary ? (
              <span className="px-4 py-2 rounded-[10px] bg-neutral-900 text-white text-[12px] font-semibold">
                Selected
              </span>
            ) : (
              <span className="text-[12px] font-semibold text-neutral-700">
                Selected
              </span>
            )
          ) : (
            <span className="text-[12px] font-semibold text-neutral-700">
              Continue
            </span>
          )}
        </div>
      </div>

      {primary ? (
        <div
          className={cn(
            "mt-2 w-full max-w-[520px]",
            showRadios ? "pl-[42px]" : "pl-0",
            "text-[12px] text-neutral-400 flex items-center gap-2"
          )}
        >
          <span className="inline-block h-[14px] w-[14px] rounded-full border border-neutral-300 text-center leading-[14px]">
            i
          </span>
          Selected as primary
        </div>
      ) : null}

      {selected ? (
        <div className="mt-3 w-full max-w-[520px]">
          <label className="block text-[12px] font-medium text-neutral-600 mb-2">
            {inputLabel}
          </label>

          <div className="flex items-center gap-2">
            <input
              value={handleValue}
              onChange={(e) => onHandleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && hasTypedHandle && !status?.loading) {
                  e.preventDefault();
                  onResolveHandle();
                }
              }}
              placeholder={placeholder}
              className={cn(
                "h-[46px] flex-1 rounded-[12px] border bg-white px-3",
                "text-[14px] text-neutral-900",
                "outline-none focus:outline-none",
                status?.error ? "border-red-300" : "border-neutral-200"
              )}
            />

            <button
              type="button"
              onClick={onResolveHandle}
              disabled={
                !hasTypedHandle || status?.loading || isResolvedForCurrentHandle
              }
              className={cn(
                "h-[46px] shrink-0 rounded-[12px] px-4 text-[13px] font-semibold transition",
                !hasTypedHandle || status?.loading || isResolvedForCurrentHandle
                  ? "cursor-not-allowed bg-neutral-200 text-neutral-400"
                  : "bg-neutral-900 text-white hover:bg-neutral-800"
              )}
            >
              {status?.loading
                ? "Verifying..."
                : isResolvedForCurrentHandle
                ? "Verified"
                : "Verify"}
            </button>
          </div>

          <div className="mt-2 min-h-[20px] text-[12px]">
            {status?.loading ? (
              <span className="text-neutral-500">Checking handle...</span>
            ) : status?.resolved ? (
              <span className="inline-flex items-center gap-1 text-green-600">
                <CheckCircle size={14} weight="fill" />
                Resolved successfully
                {status.username ? ` as @${status.username}` : ""}
              </span>
            ) : status?.error ? (
              <span className="text-red-500">{status.error}</span>
            ) : hasTypedHandle ? (
              <span className="text-neutral-500">
                Click Verify to check this handle.
              </span>
            ) : (
              <span className="text-neutral-400">
                Enter a handle to continue
              </span>
            )}
          </div>

          {preview ? (
            <div className="mt-3 rounded-[14px] border border-neutral-200 bg-neutral-50 p-3">
              <div className="mb-2 text-[12px] font-medium text-neutral-600">
                Profile preview
              </div>

              <div className="flex items-center gap-3">
                {preview.imageUrl ? (
                  <img
                    src={preview.imageUrl}
                    alt={preview.displayName || preview.handle}
                    className="h-12 w-12 rounded-full object-cover border border-neutral-200 bg-white"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-[16px] font-semibold text-neutral-700">
                    {(preview.displayName || preview.username || platformKey)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-neutral-900">
                    {preview.displayName}
                  </div>
                  <div className="truncate text-[12px] text-neutral-500">
                    {preview.handle}
                  </div>
                </div>

                {preview.profileUrl ? (
                  <a
                    href={preview.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-[10px] border border-neutral-200 bg-white px-3 py-2 text-[12px] font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    View
                  </a>
                ) : null}
              </div>

              <p className="mt-2 text-[12px] text-neutral-500">
                This is the profile resolved from the handle you entered.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function InfluencerOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getToken = React.useCallback(() => {
    return (
      localStorage.getItem("influencerToken") ||
      localStorage.getItem("token") ||
      ""
    );
  }, []);

  const [onboardStep, setOnboardStep] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | undefined>(
    undefined
  );

  const [data, setData] = React.useState<InfluencerOnboardingData>({
    selectedPlatforms: [],
    primaryPlatform: "",

    formats: [],
    budgetRange: "",
    projectLength: "",
    compensationTypes: [],

    campaignGoals: [],
    otherCampaignGoal: "",

    industries: [],
    preferredProjectType: [],
    deliveryPreference: [],
  });

  const [platformStates, setPlatformStates] = React.useState<
    Record<string, PlatformState>
  >({});

  const resolveSeqRef = React.useRef<Record<string, number>>({});

  const setStepWithRoute = React.useCallback(
    (stepIndex: number) => {
      const boundedIndex = Math.max(0, Math.min(TOTAL_STEPS - 1, stepIndex));
      const nextStepParam = getStepParamFromIndex(boundedIndex);
      const currentStepParam = searchParams.get("step");

      setOnboardStep(boundedIndex);
      persistOnboardingStep(nextStepParam);

      if (currentStepParam !== nextStepParam) {
        router.replace(`/influencer/onboarding?step=${nextStepParam}`);
      }
    },
    [router, searchParams]
  );

  React.useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/influencer/signup");
      return;
    }

    const urlStep = searchParams.get("step");
    const urlStepIndex = getStepIndexFromParam(urlStep);
    const storedStep = readStoredOnboardingStep();
    const storedStepIndex = getStepIndexFromParam(storedStep);

    const nextStepIndex = urlStepIndex ?? storedStepIndex ?? 0;
    const nextStepParam = getStepParamFromIndex(nextStepIndex);

    setOnboardStep(nextStepIndex);
    persistOnboardingStep(nextStepParam);

    if (urlStepIndex === null) {
      router.replace(`/influencer/onboarding?step=${nextStepParam}`);
    }
  }, [router, getToken, searchParams]);

  const progressPct = ((onboardStep + 1) / TOTAL_STEPS) * 100;

  const page1Resolving = React.useMemo(() => {
    return data.selectedPlatforms.some((p) => platformStates[p]?.loading);
  }, [data.selectedPlatforms, platformStates]);

  const currentIsValid = React.useMemo(() => {
    if (onboardStep === 0) {
      if (
        data.selectedPlatforms.length < 1 ||
        !includes(data.selectedPlatforms, data.primaryPlatform)
      ) {
        return false;
      }

      return data.selectedPlatforms.every((platform) => {
        const state = platformStates[platform];
        return Boolean(
          state &&
            stripAt(state.handle) &&
            state.resolved &&
            !state.loading &&
            !state.error
        );
      });
    }

    if (onboardStep === 1) {
      return data.formats.length >= 1;
    }

    if (onboardStep === 2) {
      return data.industries.length >= 1;
    }

    return false;
  }, [onboardStep, data, platformStates]);

  const onboardPrev = () => {
    if (isLoading) return;
    setStepWithRoute(onboardStep - 1);
  };

  const togglePlatform = (platform: string) => {
    setData((prev) => {
      const selected = includes(prev.selectedPlatforms, platform);

      if (!selected) {
        const nextSelected = [...prev.selectedPlatforms, platform];
        const nextPrimary = prev.primaryPlatform || platform;
        return {
          ...prev,
          selectedPlatforms: nextSelected,
          primaryPlatform: nextPrimary,
        };
      }

      const nextSelected = remove(prev.selectedPlatforms, platform);
      let nextPrimary = prev.primaryPlatform;

      if (prev.primaryPlatform === platform) {
        nextPrimary = nextSelected[0] || "";
      }

      return {
        ...prev,
        selectedPlatforms: nextSelected,
        primaryPlatform: nextPrimary,
      };
    });

    setPlatformStates((prev) => {
      if (prev[platform]) return prev;
      return {
        ...prev,
        [platform]: {
          handle: "",
          loading: false,
          resolved: false,
        },
      };
    });
  };

  const makePrimary = (platform: string) => {
    setData((prev) => {
      if (!includes(prev.selectedPlatforms, platform)) return prev;
      return { ...prev, primaryPlatform: platform };
    });
  };

  const resolvePlatformHandle = React.useCallback(
    async (platform: string, rawHandle: string) => {
      const token = getToken();
      const cleanHandle = stripAt(rawHandle);

      if (!cleanHandle) {
        setPlatformStates((prev) => ({
          ...prev,
          [platform]: {
            ...prev[platform],
            handle: rawHandle,
            username: "",
            resolvedData: undefined,
            loading: false,
            resolved: false,
            error: undefined,
          },
        }));
        return;
      }

      const seq = (resolveSeqRef.current[platform] || 0) + 1;
      resolveSeqRef.current[platform] = seq;

      setPlatformStates((prev) => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          handle: rawHandle,
          username: "",
          resolvedData: undefined,
          loading: true,
          resolved: false,
          error: undefined,
        },
      }));

      try {
        const resp = await apiResolveModashProfile(
          {
            platform,
            handle: cleanHandle,
          },
          token
        );

        if (resolveSeqRef.current[platform] !== seq) return;

        const normalized = normalizeResolvedProfile(resp, rawHandle);

        setPlatformStates((prev) => ({
          ...prev,
          [platform]: {
            ...prev[platform],
            handle: normalized.handle,
            username: normalized.username,
            resolvedData: resp,
            loading: false,
            resolved: true,
            error: undefined,
          },
        }));
      } catch (e) {
        if (resolveSeqRef.current[platform] !== seq) return;

        const msg = getResolveProfileUserMessage(e, platform);

        setPlatformStates((prev) => ({
          ...prev,
          [platform]: {
            ...prev[platform],
            handle: rawHandle,
            username: "",
            resolvedData: undefined,
            loading: false,
            resolved: false,
            error: msg,
          },
        }));
      }
    },
    [getToken]
  );

  const onHandleChange = (provider: string, value: string) => {
    setPlatformStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        handle: value,
        username: "",
        resolvedData: undefined,
        loading: false,
        resolved: false,
        error: undefined,
      },
    }));
  };

  const onVerifyHandle = (provider: string) => {
    const rawHandle = platformStates[provider]?.handle || "";
    if (!stripAt(rawHandle)) return;
    resolvePlatformHandle(provider, rawHandle);
  };

  async function saveCurrentStep(stepIndex: number) {
    const token = getToken();

    if (stepIndex === 0) {
      const page1 = data.selectedPlatforms.map((platform) => {
        const state = platformStates[platform];
        return {
          platform,
          handle: state?.handle || "",
          username: state?.username || stripAt(state?.handle || ""),
          data: state?.resolvedData,
          isPrimary: data.primaryPlatform === platform,
        };
      });

      return await apiSaveInfluencerOnboarding(
        {
          page1,
          preferredPlatform: data.primaryPlatform,
        },
        token
      );
    }

    if (stepIndex === 1) {
      const page2: QA[] = [
        { question: "Which formats do you create?", answers: data.formats },
        ...(data.budgetRange
          ? [{ question: "Typical budget range", answers: [data.budgetRange] }]
          : []),
        ...(data.projectLength
          ? [
              {
                question: "Preferred project length",
                answers: [data.projectLength],
              },
            ]
          : []),
        ...(data.compensationTypes.length
          ? [
              {
                question: "Choose compensation types you want",
                answers: data.compensationTypes,
              },
            ]
          : []),
      ];

      return await apiSaveInfluencerOnboarding({ page2 }, token);
    }

    if (stepIndex === 2) {
      const customGoals = includes(data.campaignGoals, "Others")
        ? data.otherCampaignGoal
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const goalAnswers = [
        ...data.campaignGoals.filter((g) => g !== "Others"),
        ...(includes(data.campaignGoals, "Others")
          ? customGoals.length
            ? customGoals
            : ["Others"]
          : []),
      ];

      const page3: QA[] = [
        ...(goalAnswers.length
          ? [{ question: "Campaign goals you like", answers: goalAnswers }]
          : []),
        {
          question: "Industries you want to work with",
          answers: data.industries,
        },
        ...(data.preferredProjectType.length
          ? [
              {
                question: "Preferred project type",
                answers: data.preferredProjectType,
              },
            ]
          : []),
        ...(data.deliveryPreference.length
          ? [
              {
                question: "Which type of delivery you prefer",
                answers: data.deliveryPreference,
              },
            ]
          : []),
      ];

      return await apiSaveInfluencerOnboarding({ page3 }, token);
    }
  }

  const onboardNext = async () => {
    if (!currentIsValid || isLoading || page1Resolving) return;

    setFormError(undefined);
    setIsLoading(true);

    try {
      const resp = await saveCurrentStep(onboardStep);
      const backendRoute = getBackendRoute(resp);

      if (onboardStep < TOTAL_STEPS - 1) {
        const backendStepIndex = getStepIndexFromParam(backendRoute);
        if (backendStepIndex !== null) {
          setStepWithRoute(backendStepIndex);
          return;
        }

        setStepWithRoute(onboardStep + 1);
        return;
      }

      clearStoredOnboardingStep();
      const msg = getBackendMessage(resp);
      setRedirectToast({ icon: "success", title: "Success", text: msg });
      router.replace("/influencer/dashboards");
    } catch (e) {
      const msg = getApiErrorMessage(e, "Failed to save onboarding step");
      setFormError(msg);
      toast({ icon: "error", title: "Save failed", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const onboardSkip = async () => {
    if (isLoading) return;

    setFormError(undefined);
    setIsLoading(true);

    try {
      const token = getToken();
      let resp: any;

      if (onboardStep === 1) {
        resp = await apiSaveInfluencerOnboarding({ ispage2Skip: true }, token);
      }

      if (onboardStep === 2) {
        resp = await apiSaveInfluencerOnboarding({ ispage3Skip: true }, token);
      }

      const backendRoute = getBackendRoute(resp);

      if (onboardStep < TOTAL_STEPS - 1) {
        const backendStepIndex = getStepIndexFromParam(backendRoute);
        if (backendStepIndex !== null) {
          setStepWithRoute(backendStepIndex);
          return;
        }

        setStepWithRoute(onboardStep + 1);
        return;
      }

      clearStoredOnboardingStep();
      const msg = resp ? getBackendMessage(resp) : "Onboarding skipped";
      setRedirectToast({ icon: "success", title: "Done", text: msg });
      router.push("/influencer/dashboards");
    } catch (e) {
      const msg = getApiErrorMessage(e, "Failed to skip step");
      setFormError(msg);
      toast({ icon: "error", title: "Skip failed", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const title =
    onboardStep === 0
      ? "Choose your platforms"
      : onboardStep === 1
      ? "How do you like to work?"
      : "Your collaboration preferences";

  const subtitle =
    onboardStep === 0
      ? "Select platforms, enter handles, and verify each one before continuing."
      : onboardStep === 1
      ? "Tell us what you create and how you prefer to get paid."
      : "Pick your industries, project types, and delivery preferences.";

  return (
    <div className="min-h-[100svh] bg-background text-foreground flex flex-col overflow-x-hidden">
      <ToastStyles />

      <header className="w-full bg-white border-y border-[color:var(--Border-Primary,#B3B3B3)]">
        <div
          className={cn(
            "mx-auto flex flex-wrap items-center justify-between content-center",
            "gap-m py-[16px]",
            "px-[20px] md:px-[48px] xl:px-[120px] 2xl:px-[160px]",
            "max-w-full"
          )}
        >
          <Link href="/" className="flex items-center gap-s">
            <img
              src="/logo.png"
              alt="CollabGlam Logo"
              width={40}
              height={40}
              className="object-contain"
              loading="eager"
            />
            <span className="leading-tight">
              <span className="block text-[20px] font-bold text-tx-primary">
                CollabGlam
              </span>
              <span className="block text-[10px] leading-[12px] text-tx-tertiary -mt-[2px]">
                For Influencers
              </span>
            </span>
          </Link>

          <Link
            href="/brand/signup"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "!my-0 rounded-m px-l border-[color:var(--Border-Primary,#B3B3B3)] text-neutral-600"
            )}
          >
            Join as a Brand
          </Link>
        </div>
      </header>

      <main className="flex-1 py-[24px]">
        <section className="flex px-[20px] justify-center w-full items-start pt-[84px]">
          <div className="w-full max-w-[720px]">
            <div className="px-6 pt-4">
              <div className="h-[3px] w-full rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full bg-[#28A745] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="px-6 pt-5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onboardPrev}
                    className="inline-flex items-center justify-center rounded-full p-2 hover:bg-neutral-100 active:bg-neutral-200"
                    aria-label="Back"
                    disabled={onboardStep === 0}
                  >
                    <CaretLeft
                      size={18}
                      weight="bold"
                      style={{
                        color: "var(--Light-Icon-Primary, #1A1A1A)",
                      }}
                    />
                  </button>

                  <div className="cg-black-description">
                    <span style={{ fontWeight: 500 }}>{onboardStep + 1}</span> of {TOTAL_STEPS} steps
                  </div>
                </div>

                <div className="mt-6">
                  <h1 className="cg-heading">{title}</h1>
                  <p className="mt-l cg-description">{subtitle}</p>
                </div>

                <div className="px-[20px] mt-[44px] pb-10">
                  {onboardStep === 0 && (
                    <div className="flex flex-col gap-4 items-center">
                      {PLATFORM_LIST.map((p) => {
                        const selected = includes(data.selectedPlatforms, p.key);
                        const primary = data.primaryPlatform === p.key;
                        const state = platformStates[p.key];

                        return (
                          <PlatformRow
                            key={p.key}
                            platformKey={p.key}
                            label={p.label}
                            inputLabel={p.inputLabel}
                            placeholder={p.placeholder}
                            Icon={p.Icon}
                            selected={selected}
                            primary={primary}
                            showRadios={data.selectedPlatforms.length > 0}
                            handleValue={state?.handle || ""}
                            status={state}
                            onToggle={() => togglePlatform(p.key)}
                            onMakePrimary={() => makePrimary(p.key)}
                            onHandleChange={(value) => onHandleChange(p.key, value)}
                            onResolveHandle={() => onVerifyHandle(p.key)}
                          />
                        );
                      })}
                    </div>
                  )}

                  {onboardStep === 1 && (
                    <div className="flex flex-col gap-4">
                      <FloatingMultiSelect
                        label="Which formats do you create?"
                        size="small"
                        options={FORMAT_CHIPS}
                        value={data.formats}
                        onValueChange={(v) =>
                          setData((p) => ({ ...p, formats: v }))
                        }
                        icon
                        includeAll={false}
                      />

                      <FloatingSelect
                        label="Preferred project length? (optional)"
                        size="small"
                        value={data.projectLength}
                        onValueChange={(v) =>
                          setData((p) => ({ ...p, projectLength: v }))
                        }
                        icon
                        searchable={false}
                      >
                        {PROJECT_LENGTHS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </FloatingSelect>

                      <FloatingSelect
                        label="What is your typical budget range?"
                        size="small"
                        value={data.budgetRange}
                        onValueChange={(v) =>
                          setData((p) => ({ ...p, budgetRange: v }))
                        }
                        icon
                      >
                        {BUDGET_RANGES.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </FloatingSelect>

                      <FloatingMultiSelect
                        label="Choose compensation types you want (optional)"
                        size="small"
                        options={COMP_TYPES}
                        value={data.compensationTypes}
                        onValueChange={(v) =>
                          setData((p) => ({ ...p, compensationTypes: v }))
                        }
                        icon
                        includeAll={false}
                      />
                    </div>
                  )}

                  {onboardStep === 2 && (
                    <div className="flex flex-col gap-4">
                      <FloatingMultiSelect
                        label="Campaign goals you like"
                        size="small"
                        options={CAMPAIGN_GOAL_CHIPS}
                        value={data.campaignGoals}
                        onValueChange={(v) =>
                          setData((p) => ({
                            ...p,
                            campaignGoals: v,
                            otherCampaignGoal: v.includes("Others")
                              ? p.otherCampaignGoal
                              : "",
                          }))
                        }
                        icon
                        includeAll={false}
                      />

                      {includes(data.campaignGoals, "Others") ? (
                        <div className="flex flex-col gap-2">
                          <label className="text-[12px] font-medium text-neutral-600">
                            Add your goal (comma-separated if multiple)
                          </label>

                          <input
                            value={data.otherCampaignGoal}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                otherCampaignGoal: e.target.value,
                              }))
                            }
                            placeholder="e.g. Brand recall, Newsletter signups"
                            className={cn(
                              "h-[44px] w-full rounded-[12px] border border-neutral-200 bg-white px-3",
                              "text-[14px] text-neutral-900",
                              "outline-none focus:outline-none"
                            )}
                          />

                          <p className="text-[12px] text-neutral-400">
                            We’ll save this along with your selected goals.
                          </p>
                        </div>
                      ) : null}

                      <FloatingMultiSelect
                        label="Preferred project type? (optional)"
                        size="small"
                        options={PROJECT_TYPES}
                        value={data.preferredProjectType}
                        onValueChange={(v) =>
                          setData((p) => ({
                            ...p,
                            preferredProjectType: v,
                          }))
                        }
                        icon
                        includeAll={false}
                      />

                      <FloatingMultiSelect
                        label="Industries you want to work with"
                        size="small"
                        options={INDUSTRY_CHIPS}
                        value={data.industries}
                        onValueChange={(v) =>
                          setData((p) => ({ ...p, industries: v }))
                        }
                        icon
                        includeAll={false}
                      />

                      <FloatingMultiSelect
                        label="Which type of delivery you prefer? (optional)"
                        size="small"
                        options={DELIVERY_PREFS}
                        value={data.deliveryPreference}
                        onValueChange={(v) =>
                          setData((p) => ({
                            ...p,
                            deliveryPreference: v,
                          }))
                        }
                        icon
                        includeAll={false}
                        searchable={false}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 shrink-0 bg-white px-6 pt-6 pb-10">
                {formError ? (
                  <p className="mb-3 text-[12px] leading-[16px] text-error-500">
                    {formError}
                  </p>
                ) : null}

                <Button
                  variant="solid"
                  size="lg"
                  className={cn(
                    "w-full h-[58px] rounded-[14px]",
                    "disabled:opacity-100 disabled:bg-neutral-200 disabled:text-neutral-400"
                  )}
                  onClick={onboardNext}
                  disabled={!currentIsValid || isLoading || page1Resolving}
                >
                  {isLoading
                    ? "Saving..."
                    : onboardStep === 0 && page1Resolving
                    ? "Verifying handle..."
                    : "Continue"}
                </Button>

                {onboardStep !== 0 ? (
                  <button
                    type="button"
                    className="w-full text-center mt-[16px] text-[14px] text-neutral-400 hover:text-neutral-600"
                    onClick={onboardSkip}
                    disabled={isLoading}
                  >
                    Skip for now
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
