"use client";

import * as React from "react";
import { CaretLeft } from "@phosphor-icons/react";

type BrandOnboardingData = {
  brandType: string;
  website: string;
  goals: string[];
  budget: string;
};

type Props = {
  onBack?: () => void;
  onSkip?: () => void;
  onComplete?: (data: BrandOnboardingData) => void;
  defaultValues?: Partial<BrandOnboardingData>;
};

const BRAND_TYPES = [
  "D2C / Consumer Brand",
  "E-commerce Store",
  "SaaS / App",
  "Agency",
  "Local Business",
  "Other",
];

const GOALS = [
  "Brand awareness",
  "UGC content",
  "Product reviews",
  "Affiliate sales",
  "Influencer whitelisting",
];

const BUDGETS = ["< $500 / month", "$500 – $2,000", "$2,000 – $5,000", "$5,000 – $10,000", "$10,000+"];

export default function BrandOnboarding({
  onBack,
  onSkip,
  onComplete,
  defaultValues,
}: Props) {
  const [step, setStep] = React.useState(0);

  const [data, setData] = React.useState<BrandOnboardingData>({
    brandType: defaultValues?.brandType ?? "",
    website: defaultValues?.website ?? "",
    goals: defaultValues?.goals ?? [],
    budget: defaultValues?.budget ?? "",
  });

  const stepConfig = React.useMemo(
    () => [
      {
        title: "Tell us about brand type",
        subtitle: "Choose the type that fits best.",
        content: (
          <SelectField
            placeholder="What type of brand you are?"
            value={data.brandType}
            onChange={(v) => setData((p) => ({ ...p, brandType: v }))}
            options={BRAND_TYPES}
          />
        ),
        isValid: !!data.brandType,
      },
      {
        title: "Share your website",
        subtitle: "This helps us personalize your workspace.",
        content: (
          <TextField
            placeholder="e.g. https://yourbrand.com"
            value={data.website}
            onChange={(v) => setData((p) => ({ ...p, website: v }))}
          />
        ),
        isValid: true, // optional
      },
      {
        title: "What are your goals?",
        subtitle: "Select what you want to achieve first.",
        content: (
          <CheckboxGroup
            options={GOALS}
            value={data.goals}
            onChange={(goals) => setData((p) => ({ ...p, goals }))}
          />
        ),
        isValid: true, // optional
      },
      {
        title: "Monthly collaboration budget",
        subtitle: "So we can recommend the right creators.",
        content: (
          <SelectField
            placeholder="Select your monthly budget"
            value={data.budget}
            onChange={(v) => setData((p) => ({ ...p, budget: v }))}
            options={BUDGETS}
          />
        ),
        isValid: true, // optional
      },
    ],
    [data]
  );

  const TOTAL_STEPS = stepConfig.length;
  const progressPct = ((step + 1) / TOTAL_STEPS) * 100;
  const current = stepConfig[step];

  const goPrev = () => {
    if (step === 0) return onBack?.();
    setStep((s) => Math.max(0, s - 1));
  };

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else onComplete?.(data);
  };

return (
  <div
    className={[
      "w-full mx-auto",
      "rounded-[20px] border border-neutral-200 bg-white",
      "shadow-[0_18px_45px_rgba(0,0,0,0.08)]",
      "overflow-hidden",
    ].join(" ")}
  >
    {/* Progress bar */}
    <div className="px-6 pt-4">
      <div className="h-[3px] w-full rounded-full bg-neutral-200 overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>

    {/* Scroll area (only when needed) */}
    <div className="overflow-y-auto">
      {/* Content */}
      <div className="px-6 pt-5">
        {/* Top row */}
        <div className="flex items-center gap-2 text-neutral-800">
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex items-center justify-center rounded-full p-2 hover:bg-neutral-100 active:bg-neutral-200"
            aria-label="Back"
          >
            <CaretLeft size={18} weight="bold" />
          </button>

          <div className="text-[14px] text-neutral-700">
            <span className="font-medium">{step + 1}</span> of {TOTAL_STEPS} steps
          </div>
        </div>

        {/* Headings */}
        <div className="mt-6">
          <h1 className="text-[28px] leading-[34px] font-semibold text-neutral-900">
            {current.title}
          </h1>
          <p className="mt-2 text-[14px] leading-[20px] text-neutral-500">
            {current.subtitle}
          </p>
        </div>

        {/* Form content */}
        <div className="mt-8 pb-[140px]">
          {current.content}
        </div>
      </div>

      {/* ✅ Sticky actions (no gap when content is short) */}
      <div className="sticky bottom-0 bg-white px-6 pt-6 pb-10 border-t border-neutral-100">
        <button
          type="button"
          onClick={goNext}
          disabled={!current.isValid}
          className={[
            "w-full h-[58px] rounded-[14px] text-white font-medium",
            "bg-neutral-900 hover:bg-neutral-900/90 active:bg-neutral-900/95",
            "shadow-[0_10px_28px_rgba(0,0,0,0.14)]",
            !current.isValid ? "opacity-60 cursor-not-allowed" : "",
          ].join(" ")}
        >
          {step === TOTAL_STEPS - 1 ? "Finish" : "Continue"}
        </button>

        <button
          type="button"
          onClick={() => onSkip?.()}
          className="w-full mt-4 text-[14px] text-neutral-700 hover:text-neutral-900"
        >
          Skip for now
        </button>
      </div>
    </div>
  </div>
);


}

/* ----------------------------- */
/* UI bits */
/* ----------------------------- */

function SelectField({
  placeholder,
  value,
  onChange,
  options,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="w-full">
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={[
            "w-full h-[54px] rounded-[12px] border border-neutral-200 bg-white",
            "px-4 pr-10 text-[14px] text-neutral-900",
            "outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300",
            value ? "" : "text-neutral-500",
            "appearance-none",
          ].join(" ")}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M7 10l5 5 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function TextField({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={[
        "w-full h-[54px] rounded-[12px] border border-neutral-200 bg-white",
        "px-4 text-[14px] text-neutral-900 placeholder:text-neutral-500",
        "outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300",
      ].join(" ")}
    />
  );
}

function CheckboxGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((x) => x !== opt));
    else onChange([...value, opt]);
  };

  return (
    <div className="space-y-3">
      {options.map((opt) => (
        <label
          key={opt}
          className="flex items-center gap-3 rounded-[12px] border border-neutral-200 bg-white px-4 py-3 hover:border-neutral-300 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={value.includes(opt)}
            onChange={() => toggle(opt)}
            className="h-4 w-4 accent-neutral-900"
          />
          <span className="text-[14px] text-neutral-900">{opt}</span>
        </label>
      ))}
    </div>
  );
}
