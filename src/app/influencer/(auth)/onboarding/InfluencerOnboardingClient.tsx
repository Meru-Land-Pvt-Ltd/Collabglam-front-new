"use client";

import * as React from "react";
import Link from "next/link";
import { CaretLeft, InstagramLogo, YoutubeLogo, TiktokLogo } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/buttonComp";
import { cn } from "@/lib/utils";
import { FloatingMultiSelect, FloatingSelect, SelectItem } from "@/components/ui/select";

// ✅ Toast
import { toast, ToastStyles } from "@/components/ui/toast";

import { apiSaveInfluencerOnboarding, getApiErrorMessage } from "../../services/influencerApi";

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

const REDIRECT_TOAST_KEY = "cg_redirect_toast_v1";

type RedirectToastPayload = {
  icon?: "success" | "error" | "info" | "warning";
  title?: string;
  text: string;
};

function setRedirectToast(payload: RedirectToastPayload) {
  try {
    sessionStorage.setItem(REDIRECT_TOAST_KEY, JSON.stringify({ ...payload, _ts: Date.now() }));
  } catch {
    // ignore
  }
}

function normalizeApiPayload(resp: any) {
  if (resp && typeof resp === "object" && "data" in resp && resp.data && resp.data.success !== undefined) {
    return resp.data;
  }
  return resp;
}

function getBackendMessage(resp: any) {
  const payload = normalizeApiPayload(resp);
  const message = payload?.data?.message || payload?.message || "Saved successfully";
  const influencerId = payload?.data?.influencerId;
  return influencerId ? `${message} (ID: ${influencerId})` : message;
}

const PLATFORM_LIST = [
  { key: "Instagram", label: "Continue With Instagram", Icon: InstagramLogo },
  { key: "YouTube", label: "Continue With Youtube", Icon: YoutubeLogo },
  { key: "TikTok", label: "Continue With TikTok", Icon: TiktokLogo },
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
  Icon,
  selected,
  primary,
  showRadios,
  onToggle,
  onMakePrimary,
}: {
  platformKey: string;
  label: string;
  Icon: React.ComponentType<any>;
  selected: boolean;
  primary: boolean;
  showRadios: boolean;
  onToggle: () => void;
  onMakePrimary: () => void;
}) {
  const radioId = `primary-${platformKey}`;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex items-center gap-3 w-full max-w-[520px] justify-center">
        {showRadios ? (
          <div
            className={cn("shrink-0", !selected ? "opacity-50 cursor-not-allowed" : "cursor-pointer")}
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
                selected ? "bg-neutral-900" : "bg-white border border-neutral-300"
              )}
              aria-label="Set as primary"
              title={selected ? "Set as primary" : "Select the platform first"}
            >
              {selected ? (
                <span className={cn("h-3 w-3 rounded-full", primary ? "bg-[#FFBF00]" : "bg-white")} />
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
            <span className="text-[14px] font-medium text-neutral-900">{label}</span>
          </div>

          {selected ? (
            primary ? (
              <span className="px-4 py-2 rounded-[10px] bg-neutral-900 text-white text-[12px] font-semibold">
                Selected
              </span>
            ) : (
              <span className="text-[12px] font-semibold text-neutral-700">Selected</span>
            )
          ) : (
            <span className="text-[12px] font-semibold text-neutral-700">Continue</span>
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
    </div>
  );
}

export default function InfluencerOnboardingPage() {
  const router = useRouter();

  // ✅ token helper (supports both keys)
  const getToken = React.useCallback(() => {
    return localStorage.getItem("influencerToken") || localStorage.getItem("token") || "";
  }, []);

  const [onboardStep, setOnboardStep] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | undefined>(undefined);

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

  // React.useEffect(() => {
  //   const token = getToken();
  //   if (!token) {
  //     router.replace("/influencer/signup");
  //     return;
  //   }
  // }, [router, getToken]);

  const TOTAL_STEPS = 3;
  const progressPct = ((onboardStep + 1) / TOTAL_STEPS) * 100;

  const currentIsValid = React.useMemo(() => {
    if (onboardStep === 0) {
      return data.selectedPlatforms.length >= 1 && includes(data.selectedPlatforms, data.primaryPlatform);
    }
    if (onboardStep === 1) {
      return data.formats.length >= 1 && data.compensationTypes.length >= 1;
    }
    if (onboardStep === 2) {
      return data.industries.length >= 1;
    }
    return false;
  }, [onboardStep, data]);

  const onboardPrev = () => {
    if (isLoading) return;
    setOnboardStep((s) => Math.max(0, s - 1));
  };

  const togglePlatform = (p: string) => {
    setData((prev) => {
      const selected = includes(prev.selectedPlatforms, p);
      if (!selected) {
        const nextSelected = [...prev.selectedPlatforms, p];
        const nextPrimary = prev.primaryPlatform || p;
        return { ...prev, selectedPlatforms: nextSelected, primaryPlatform: nextPrimary };
      }

      const nextSelected = remove(prev.selectedPlatforms, p);
      let nextPrimary = prev.primaryPlatform;

      if (prev.primaryPlatform === p) {
        nextPrimary = nextSelected[0] || "";
      }

      return { ...prev, selectedPlatforms: nextSelected, primaryPlatform: nextPrimary };
    });
  };

  const makePrimary = (p: string) => {
    setData((prev) => {
      if (!includes(prev.selectedPlatforms, p)) return prev;
      return { ...prev, primaryPlatform: p };
    });
  };

  async function saveCurrentStep(stepIndex: number) {
    const token = getToken();

    if (stepIndex === 0) {
      const page1: QA[] = [
        { question: "Selected platforms", answers: data.selectedPlatforms },
        { question: "Primary platform", answers: [data.primaryPlatform] },
      ];
      return await apiSaveInfluencerOnboarding({ page1 }, token);
    }

    if (stepIndex === 1) {
      const page2: QA[] = [
        { question: "Which formats do you create?", answers: data.formats },
        ...(data.budgetRange ? [{ question: "Typical budget range", answers: [data.budgetRange] }] : []),
        ...(data.projectLength ? [{ question: "Preferred project length", answers: [data.projectLength] }] : []),
        { question: "Choose compensation types you want", answers: data.compensationTypes },
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
        ...(includes(data.campaignGoals, "Others") ? (customGoals.length ? customGoals : ["Others"]) : []),
      ];

      const page3: QA[] = [
        ...(goalAnswers.length ? [{ question: "Campaign goals you like", answers: goalAnswers }] : []),
        { question: "Industries you want to work with", answers: data.industries },
        ...(data.preferredProjectType.length
          ? [{ question: "Preferred project type", answers: data.preferredProjectType }]
          : []),
        ...(data.deliveryPreference.length
          ? [{ question: "Which type of delivery you prefer", answers: data.deliveryPreference }]
          : []),
      ];
      return await apiSaveInfluencerOnboarding({ page3 }, token);
    }
  }

  const onboardNext = async () => {
    if (!currentIsValid || isLoading) return;

    setFormError(undefined);
    setIsLoading(true);

    try {
      const resp = await saveCurrentStep(onboardStep);

      if (onboardStep < TOTAL_STEPS - 1) {
        setOnboardStep((s) => s + 1);
        return;
      }

      const msg = getBackendMessage(resp);
      setRedirectToast({ icon: "success", title: "Success", text: msg });

      router.push("/influencer/campaign");
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

      if (onboardStep === 1) resp = await apiSaveInfluencerOnboarding({ ispage2Skip: true }, token);
      if (onboardStep === 2) resp = await apiSaveInfluencerOnboarding({ ispage3Skip: true }, token);

      if (onboardStep < TOTAL_STEPS - 1) {
        setOnboardStep((s) => s + 1);
        return;
      }

      const msg = resp ? getBackendMessage(resp) : "Onboarding skipped";
      setRedirectToast({ icon: "success", title: "Done", text: msg });

      router.push("/influencer/campaign");
    } catch (e) {
      const msg = getApiErrorMessage(e, "Failed to skip step");
      setFormError(msg);
      toast({ icon: "error", title: "Skip failed", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const title =
    onboardStep === 0 ? "Choose your platforms" : onboardStep === 1 ? "How do you like to work?" : "Your collaboration preferences";

  const subtitle =
    onboardStep === 0
      ? "Select the platforms you create on and set your primary platform."
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
            <img src="/logo.png" alt="CollabGlam Logo" width={40} height={40} className="object-contain" loading="eager" />
            <span className="leading-tight">
              <span className="block text-[20px] font-bold text-tx-primary">CollabGlam</span>
              <span className="block text-[10px] leading-[12px] text-tx-tertiary -mt-[2px]">For Influencers</span>
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
                <div className="h-full bg-[#28A745] transition-all duration-300" style={{ width: `${progressPct}%` }} />
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
                    <CaretLeft size={18} weight="bold" style={{ color: "var(--Light-Icon-Primary, #1A1A1A)" }} />
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
                        return (
                          <PlatformRow
                            key={p.key}
                            platformKey={p.key}
                            label={p.label}
                            Icon={p.Icon}
                            selected={selected}
                            primary={primary}
                            showRadios={!!data.primaryPlatform}
                            onToggle={() => togglePlatform(p.key)}
                            onMakePrimary={() => makePrimary(p.key)}
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
                        onValueChange={(v) => setData((p) => ({ ...p, formats: v }))}
                        icon
                        includeAll={false}
                      />

                      <FloatingSelect
                        label="Preferred project length? (optional)"
                        size="small"
                        value={data.projectLength}
                        onValueChange={(v) => setData((p) => ({ ...p, projectLength: v }))}
                        icon
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
                        onValueChange={(v) => setData((p) => ({ ...p, budgetRange: v }))}
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
                        onValueChange={(v) => setData((p) => ({ ...p, compensationTypes: v }))}
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
                            otherCampaignGoal: v.includes("Others") ? p.otherCampaignGoal : "",
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
                            onChange={(e) => setData((p) => ({ ...p, otherCampaignGoal: e.target.value }))}
                            placeholder="e.g. Brand recall, Newsletter signups"
                            className={cn(
                              "h-[44px] w-full rounded-[12px] border border-neutral-200 bg-white px-3",
                              "text-[14px] text-neutral-900",
                              "outline-none focus:outline-none"
                            )}
                          />

                          <p className="text-[12px] text-neutral-400">We’ll save this along with your selected goals.</p>
                        </div>
                      ) : null}

                      <FloatingMultiSelect
                        label="Preferred project type? (optional)"
                        size="small"
                        options={PROJECT_TYPES}
                        value={data.preferredProjectType}
                        onValueChange={(v) => setData((p) => ({ ...p, preferredProjectType: v }))}
                        icon
                        includeAll={false}
                      />

                      <FloatingMultiSelect
                        label="Industries you want to work with"
                        size="small"
                        options={INDUSTRY_CHIPS}
                        value={data.industries}
                        onValueChange={(v) => setData((p) => ({ ...p, industries: v }))}
                        icon
                        includeAll={false}
                      />

                      <FloatingMultiSelect
                        label="Which type of delivery you prefer? (optional)"
                        size="small"
                        options={DELIVERY_PREFS}
                        value={data.deliveryPreference}
                        onValueChange={(v) => setData((p) => ({ ...p, deliveryPreference: v }))}
                        icon
                        includeAll={false}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 shrink-0 bg-white px-6 pt-6 pb-10">
                {formError ? <p className="mb-3 text-[12px] leading-[16px] text-error-500">{formError}</p> : null}

                <Button
                  variant="solid"
                  size="lg"
                  className={cn(
                    "w-full h-[58px] rounded-[14px]",
                    "disabled:opacity-100 disabled:bg-neutral-200 disabled:text-neutral-400"
                  )}
                  onClick={onboardNext}
                  disabled={!currentIsValid || isLoading}
                >
                  {isLoading ? "Saving..." : "Continue"}
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
