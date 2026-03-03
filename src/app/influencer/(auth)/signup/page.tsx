// app/influencer/signup/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FloatingInput } from "@/components/ui/floatingInput";
import { FloatingMultiSelect, FloatingSelect, SelectItem } from "@/components/ui/select";
import { PasswordInput } from "@/components/ui/password";
import { Button, buttonVariants } from "@/components/ui/buttonComp";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";

import { toast, ToastStyles } from "@/components/ui/toast";

// ✅ OTP UI
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { CountdownTicker } from "@/components/ui/countdown-ticker";
import { CaretLeft } from "@phosphor-icons/react";

// ✅ NEW: Random hero component (image + quote)
import { InfluencerHero } from "@/components/ui/influencer/InfluencerHero";

// ✅ APIs
import {
  apiSendInfluencerSignupOtp,
  apiVerifyInfluencerOtpSignup,
  getApiErrorMessage,
  apiListCountries,
  apiListContentLanguages,
  apiCategoryGetAll,
  type CountryRow,
  type LangRow,
  type CategoryRow,
} from "../../services/influencerApi";

const SUBTITLE_CLASS =
  "text-[14px] leading-[20px] text-[color:var(--Light-Text-Secondary,#969696)]";

const ERROR_TEXT_CLASS =
  "mt-1 text-[12px] leading-[16px] text-[color:var(--Errors-500,#E35141)]";

const CLEAR_VALUE = "__clear__";

// ✅ simple option type for FloatingMultiSelect
type Chip = { label: string; value: string };

// ✅ local normalizer (extra safe)
const normalizeArray = <T,>(x: any): T[] => {
  if (Array.isArray(x)) return x as T[];
  if (Array.isArray(x?.data)) return x.data as T[];
  if (Array.isArray(x?.result)) return x.result as T[];
  if (Array.isArray(x?.items)) return x.items as T[];
  return [];
};

// ✅ render flag as image (so it won’t degrade into country code letters)
const emojiToCodePoint = (emoji: string) =>
  Array.from(emoji)
    .map((ch) => ch.codePointAt(0)!.toString(16))
    .join("-");

const twemojiSvgUrl = (emoji: string) =>
  `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${emojiToCodePoint(emoji)}.svg`;

export default function InfluencerSignupPage() {
  const router = useRouter();

  type Step = "form" | "otp";

  // -------------------------
  // Dropdown data
  // -------------------------
  const [countries, setCountries] = React.useState<CountryRow[]>([]);
  const [languagesList, setLanguagesList] = React.useState<LangRow[]>([]);
  const [categoriesList, setCategoriesList] = React.useState<CategoryRow[]>([]);
  const [listsLoading, setListsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setListsLoading(true);

        const [c, l, cat] = await Promise.all([
          apiListCountries({ limit: 300 }),
          apiListContentLanguages({ limit: 300 }),
          apiCategoryGetAll({ search: "", page: 1, limit: 200 }),
        ]);

        if (!mounted) return;

        setCountries(normalizeArray<CountryRow>(c));
        setLanguagesList(normalizeArray<LangRow>(l));
        setCategoriesList(normalizeArray<CategoryRow>(cat));
      } catch (err) {
        toast({
          icon: "error",
          title: "Failed to load dropdowns",
          text: getApiErrorMessage(err, "Failed to load dropdowns"),
        });
      } finally {
        if (mounted) setListsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ build multi-select options for categories
  const categoryOptions: Chip[] = React.useMemo(() => {
    return categoriesList
      .filter((c) => !!c?.id)
      .map((c) => ({ label: c.name ?? "Category", value: String(c.id) }));
  }, [categoriesList]);

  // -------------------------
  // Form state (IDs)
  // -------------------------
  const [creatorName, setCreatorName] = React.useState("");
  const [email, setEmail] = React.useState("");

  // ✅ store selected IDs
  const [countryId, setCountryId] = React.useState(""); // required
  const [languageId, setLanguageId] = React.useState(""); // optional

  // ✅ categories is multi + required
  const [categoryIds, setCategoryIds] = React.useState<string[]>([]); // required

  const [password, setPassword] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);

  const [attemptedSubmit, setAttemptedSubmit] = React.useState(false);

  // ✅ Step handling
  const [step, setStep] = React.useState<Step>("form");

  // ✅ OTP state
  const [otp, setOtp] = React.useState("");
  const [otpError, setOtpError] = React.useState<string | undefined>(undefined);
  const [secondsLeft, setSecondsLeft] = React.useState(0);

  // ✅ split loaders like brand
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);

  const [clearedOnFocus, setClearedOnFocus] = React.useState({
    creatorName: false,
    email: false,
    countryId: false,
    categoryIds: false,
    password: false,
    agreed: false,
  });

  const clearFieldOnFocus = (key: keyof typeof clearedOnFocus) => {
    setClearedOnFocus((prev) => ({ ...prev, [key]: true }));
  };

  const resetClearedOnSubmit = () => {
    setClearedOnFocus({
      creatorName: false,
      email: false,
      countryId: false,
      categoryIds: false,
      password: false,
      agreed: false,
    });
  };

  // -------------------------
  // Validation
  // -------------------------
  const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  // ✅ creator name sanitize + validation (no special chars)
  // Allowed: letters (any language), spaces, dot, apostrophe, hyphen
  const sanitizeCreatorName = (v: string) => v.replace(/[^\p{L}\s.'-]/gu, "");
  const creatorNameOk = (v: string) => /^[\p{L}][\p{L}\s.'-]*$/u.test(v.trim());

  // ✅ password must include BOTH uppercase + lowercase + number, length 8–16
  const pwOk = (p: string) => {
    const s = (p ?? "").trim();
    if (s.length < 8 || s.length > 16) return false;
    if (!/[a-z]/.test(s)) return false;
    if (!/[A-Z]/.test(s)) return false;
    if (!/[0-9]/.test(s)) return false;
    return true;
  };

  const creatorNameError =
    attemptedSubmit && !clearedOnFocus.creatorName
      ? !creatorName.trim()
        ? "Creator name is required."
        : !creatorNameOk(creatorName)
        ? "Only letters and spaces are allowed. (.'- allowed)"
        : ""
      : "";

  const emailError =
    attemptedSubmit && !clearedOnFocus.email
      ? !email.trim()
        ? "Work email is required."
        : !emailOk(email)
        ? "Please enter a valid email address."
        : ""
      : "";

  const countryError =
    attemptedSubmit && !clearedOnFocus.countryId && !countryId ? "Location is required." : "";

  const categoryError =
    attemptedSubmit && !clearedOnFocus.categoryIds && categoryIds.length === 0
      ? "At least one category is required."
      : "";

  const passwordError =
    attemptedSubmit && !clearedOnFocus.password
      ? !password.trim()
        ? "Password is required."
        : !pwOk(password)
        ? "Password must be 8–16 characters and include uppercase, lowercase, and a number."
        : ""
      : "";

  const agreedError =
    attemptedSubmit && !clearedOnFocus.agreed && !agreed
      ? "Please accept Terms of Service and Privacy Policy."
      : "";

  // -------------------------
  // OTP countdown
  // -------------------------
  React.useEffect(() => {
    if (step !== "otp") return;
    if (secondsLeft <= 0) return;

    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [secondsLeft, step]);

  // -------------------------
  // API helpers
  // -------------------------
  const sendOtp = async () => {
    await apiSendInfluencerSignupOtp({
      creatorName: creatorName.trim(),
      email: email.trim(),
      password,
      countryId,
      languageId: languageId || undefined,
      categoryIds,
    });

    setSecondsLeft(60);
  };

  const verifyOtp = async (code: string) => {
    const res = await apiVerifyInfluencerOtpSignup({
      email: email.trim(),
      otp: code,
    });

    // ✅ store token with the SAME key onboarding expects (only if present)
    if ((res as any)?.token) {
      localStorage.setItem("influencerToken", (res as any).token);
      localStorage.setItem("token", (res as any).token); // optional compatibility
    }
    if ((res as any)?.influencerId) {
      localStorage.setItem("influencerId", (res as any).influencerId);
    }

    const country = countries.find((x) => String(x._id ?? x.id) === String(countryId));
    const lang = languagesList.find((x) => String(x._id ?? x.id) === String(languageId));

    const cats = categoriesList.filter((x) => categoryIds.includes(String(x.id)));
    const categoryNames = cats.map((c) => c.name).filter(Boolean);

    localStorage.setItem(
      "influencerSignupDraft",
      JSON.stringify({
        creatorName: creatorName.trim(),
        email: email.trim(),
        countryId,
        countryName: (country as any)?.countryName ?? country?.countryNameEn ?? null,
        countryFlag: country?.flag ?? null,
        languageId: languageId || null,
        languageName: lang?.name ?? lang?.code ?? null,
        categoryIds,
        categoryNames,
      })
    );

    // ✅ IMPORTANT CHANGE:
    // Do NOT call /api-1/influencer-auth here (it was blocking/triggering that flow).
    // We should directly move user to onboarding.

    return res;
  };

  // -------------------------
  // Actions
  // -------------------------
  const handleContinueFromForm = async (e: React.FormEvent) => {
    e.preventDefault();

    resetClearedOnSubmit();
    setAttemptedSubmit(true);

    const hasError =
      !creatorName.trim() ||
      !creatorNameOk(creatorName) ||
      !email.trim() ||
      !emailOk(email) ||
      !countryId ||
      categoryIds.length === 0 ||
      !pwOk(password) ||
      !agreed;

    if (hasError) return;

    setIsSendingOtp(true);
    try {
      await sendOtp();

      setStep("otp");
      setOtp("");
      setOtpError(undefined);

      toast({
        icon: "success",
        title: "OTP sent",
        text: `We sent a 6-digit code to ${email.trim()}`,
      });
    } catch (err) {
      toast({
        icon: "error",
        title: "Failed to send OTP",
        text: getApiErrorMessage(err, "Failed to send OTP"),
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    // ✅ inline validation
    if (otp.length !== 6) {
      setOtpError("Please enter the 6-digit OTP.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      await verifyOtp(otp);

      toast({
        icon: "success",
        title: "OTP verified",
        text: "Redirecting to onboarding…",
      });

      // ✅ Redirect to onboarding (no influencer-auth hop)
      router.replace("/influencer/onboarding");
      router.refresh();
    } catch (err) {
      toast({
        icon: "error",
        title: "OTP verification failed",
        text: getApiErrorMessage(err, "OTP verification failed"),
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (secondsLeft > 0 || isSendingOtp) return;

    setOtp("");
    setOtpError(undefined);

    setIsSendingOtp(true);
    try {
      await sendOtp();
      toast({
        icon: "success",
        title: "OTP resent",
        text: `A new OTP was sent to ${email.trim()}`,
      });
    } catch (err) {
      toast({
        icon: "error",
        title: "Failed to resend OTP",
        text: getApiErrorMessage(err, "Failed to resend OTP"),
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const goBackToForm = () => {
    setOtp("");
    setOtpError(undefined);
    setSecondsLeft(0);
    setStep("form");
  };

  return (
    <div className="min-h-[100svh] bg-background text-foreground flex flex-col overflow-x-hidden">
      <ToastStyles />

      {/* Header */}
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
              <span className="block text-[20px] font-bold text-tx-primary">CollabGlam</span>
              <span className="block text-[10px] leading-[12px] text-tx-tertiary -mt-[2px]">
                For Influencers
              </span>
            </span>
          </Link>

          <Button
            onClick={() => router.push("/brand/login")}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "!my-0 rounded-m px-l !border-black !text-black bg-white hover:bg-black/5"
            )}
          >
            Join as a Brand
          </Button>
        </div>
      </header>

      {/* Body */}
      <main className={cn("max-w-full flex-1 min-h-0 overflow-y-auto", "py-[20px]")}>
        <div className={cn("grid min-h-0 items-stretch", "lg:grid-cols-2 lg:min-h-[calc(100svh-114px)]")}>
          {/* LEFT */}
          <section className="order-1 lg:h-full">
            <div className="flex w-full lg:h-full lg:items-stretch pr-[20px]">
              <div
                className={cn(
                  "relative w-full overflow-hidden",
                  "rounded-tr-[32px] rounded-br-[32px]",
                  "h-[420px] sm:h-[520px] md:h-[640px] lg:h-full"
                )}
              >
                <InfluencerHero className="h-full" />
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <section
            className={cn(
              "order-2 flex px-[20px] justify-center w-full items-start",
              step === "form" || step === "otp" ? "pt-[84px]" : "",
              "lg:min-h-[calc(100svh-114px)]"
            )}
          >
            <div className={cn("w-full max-w-[520px]")}>
              {/* FORM */}
              {step === "form" && (
                <>
                  <h1 className="cg-heading">Get Your Profile Started</h1>
                  <p className="mt-m cg-description">
                    Enter your email and password so we can take you back to your dashboard and ongoing work.
                  </p>

                  <form onSubmit={handleContinueFromForm} className="mt-2xl space-y-[16px]">
                    {/* Creator Name */}
                    <div>
                      <FloatingInput
                        label="Creator Name"
                        required
                        type="text"
                        value={creatorName}
                        onValueChange={(v) => {
                          const cleaned = sanitizeCreatorName(v);
                          setCreatorName(cleaned);
                          if (creatorNameError) clearFieldOnFocus("creatorName");
                        }}
                        onFocus={() => clearFieldOnFocus("creatorName")}
                        icon={false}
                        size="small"
                        state={creatorNameError ? "error" : "default"}
                        errorText={undefined}
                      />
                      {creatorNameError ? <p className={ERROR_TEXT_CLASS}>{creatorNameError}</p> : null}
                    </div>

                    {/* Work Email */}
                    <div>
                      <FloatingInput
                        label="Work Email"
                        required
                        value={email}
                        onValueChange={(v) => {
                          setEmail(v);
                          if (emailError) clearFieldOnFocus("email");
                        }}
                        onFocus={() => clearFieldOnFocus("email")}
                        icon={false}
                        size="small"
                        state={emailError ? "error" : "default"}
                        errorText={undefined}
                      />
                      {emailError ? <p className={ERROR_TEXT_CLASS}>{emailError}</p> : null}
                    </div>

                    {/* Location */}
                    <div>
                      <FloatingSelect
                        label={listsLoading ? "Location (loading...)" : "Location"}
                        size="small"
                        required
                        value={countryId}
                        onValueChange={(v) => {
                          setCountryId(v);
                          if (countryError) clearFieldOnFocus("countryId");
                        }}
                        onFieldFocus={() => {
                          if (countryError) clearFieldOnFocus("countryId");
                        }}
                        icon
                        state={countryError ? "error" : "default"}
                        errorText={undefined}
                      >
                        {countries
                          .filter((c) => !!(c._id ?? c.id))
                          .map((c) => {
                            const id = String(c._id ?? c.id);
                            const name = (c as any)?.countryName ?? c.countryNameEn ?? "";
                            const flagEmoji = c.flag ?? "";

                            return (
                              <SelectItem key={id} value={id}>
                                <span className="inline-flex items-center gap-2">
                                  {flagEmoji ? (
                                    <img
                                      src={twemojiSvgUrl(flagEmoji)}
                                      alt={flagEmoji}
                                      className="w-4 h-4"
                                      loading="lazy"
                                      onError={(e) => {
                                        // fallback to emoji text if image fails
                                        (e.currentTarget as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                  ) : null}
                                  <span>{name || "Country"}</span>
                                </span>
                              </SelectItem>
                            );
                          })}
                      </FloatingSelect>

                      {countryError ? <p className={ERROR_TEXT_CLASS}>{countryError}</p> : null}
                    </div>

                    <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
                      {/* Languages */}
                      <FloatingSelect
                        label={listsLoading ? "Languages (loading...)" : "Languages"}
                        size="small"
                        value={languageId}
                        onValueChange={(v) => setLanguageId(v === CLEAR_VALUE ? "" : v)}
                        icon
                      >
                        <SelectItem value={CLEAR_VALUE}>None</SelectItem>

                        {languagesList
                          .filter((l) => !!(l._id ?? l.id))
                          .map((l) => {
                            const id = String(l._id ?? l.id);
                            return (
                              <SelectItem key={id} value={id}>
                                {l.name ?? l.code ?? "Language"}
                              </SelectItem>
                            );
                          })}
                      </FloatingSelect>

                      {/* Categories */}
                      <div
                        onClick={() => {
                          if (categoryError) clearFieldOnFocus("categoryIds");
                        }}
                      >
                        <FloatingMultiSelect
                          label={listsLoading ? "Categories (loading...)" : "Categories"}
                          size="small"
                          required
                          options={categoryOptions}
                          value={categoryIds}
                          onValueChange={(v) => {
                            setCategoryIds(v);
                            if (categoryError) clearFieldOnFocus("categoryIds");
                          }}
                          icon
                          includeAll={false}
                          state={categoryError ? "error" : "default"}
                          errorText={undefined}
                        />

                        {categoryError ? <p className={ERROR_TEXT_CLASS}>{categoryError}</p> : null}
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <PasswordInput
                        label="Password"
                        required
                        value={password}
                        onValueChange={(v) => {
                          setPassword(v);
                          if (passwordError) clearFieldOnFocus("password");
                        }}
                        onFocus={() => clearFieldOnFocus("password")}
                        icon
                        size="small"
                        state={passwordError ? "error" : "default"}
                        errorText={undefined}
                        showRules={attemptedSubmit}
                      />
                      {passwordError ? <p className={ERROR_TEXT_CLASS}>{passwordError}</p> : null}
                    </div>

                    {/* Terms */}
                    <div className="mt-xl">
                      <label
                        className={cn(
                          "flex items-center gap-[10px] text-center text-[12px] leading-[16px]",
                          agreedError ? "text-[color:var(--Errors-500,#E35141)]" : "text-[#7A7A7A]"
                        )}
                      >
                        <Checkbox
                          checked={agreed}
                          onCheckedChange={(v) => {
                            setAgreed(v === true);
                            if (agreedError) clearFieldOnFocus("agreed");
                          }}
                          onClick={() => {
                            if (agreedError) clearFieldOnFocus("agreed");
                          }}
                          aria-invalid={!!agreedError}
                          className={cn(
                            "bg-background border rounded-[4px] w-[20px] h-[20px] p-[4px]",
                            agreedError
                              ? "border-[color:var(--Errors-500,#E35141)]"
                              : "border-[color:var(--Border-Primary,#B3B3B3)]"
                          )}
                        />

                        <span>
                          By continuing, you agree to our{" "}
                          <Link href="/terms" className="font-semibold hover:underline text-current">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link href="/privacy" className="font-semibold hover:underline text-current">
                            Privacy Policy
                          </Link>
                        </span>
                      </label>

                      {agreedError ? <p className={ERROR_TEXT_CLASS}>{agreedError}</p> : null}
                    </div>

                    <Button
                      type="submit"
                      variant="solid"
                      size="lg"
                      className={cn("w-full rounded-m mt-2xl", isSendingOtp && "opacity-60")}
                      disabled={isSendingOtp}
                    >
                      {isSendingOtp ? "Sending OTP..." : "Continue"}
                    </Button>

                    <p className={cn(SUBTITLE_CLASS, "text-center mt-l")}>
                      Already Have an Account?{" "}
                      <Link href="/influencer/login" className="font-semibold text-black hover:underline">
                        Login
                      </Link>
                    </p>
                  </form>
                </>
              )}

              {/* OTP */}
              {step === "otp" && (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={goBackToForm}
                      className="inline-flex items-center justify-center rounded-full p-2 hover:bg-neutral-100 active:bg-neutral-200"
                      aria-label="Back"
                    >
                      <CaretLeft
                        size={18}
                        weight="bold"
                        style={{ color: "var(--Light-Icon-Primary, #1A1A1A)" }}
                      />
                    </button>

                    <span
                      className="cg-description font-medium leading-6 text-black cursor-pointer"
                      onClick={goBackToForm}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") goBackToForm();
                      }}
                    >
                      Back
                    </span>
                  </div>

                  <h1 className="cg-heading m-0 mt-2">Enter OTP</h1>

                  <p className="mt-s cg-description">
                    Enter the 6-digit code sent to your email to activate your account.
                  </p>

                  <div className="space-y-[14px] mt-[12px]">
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onFocus={() => setOtpError(undefined)}
                        onChange={(v) => {
                          setOtp(v);
                          if (otpError) setOtpError(undefined);
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <InputOTPSlot
                              key={i}
                              index={i}
                              className={cn(otpError ? "border-error-500" : "border-neutral-300")}
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    {otpError && <p className={cn(ERROR_TEXT_CLASS, "text-center mt-0")}>{otpError}</p>}

                    <div className="space-y-[20px]">
                      <Button
                        variant="solid"
                        className={cn(
                          "w-full h-[72px] rounded-[12px]",
                          (isVerifyingOtp || isSendingOtp) && "opacity-60"
                        )}
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || isSendingOtp}
                      >
                        {isVerifyingOtp ? "Verifying..." : "Continue"}
                      </Button>

                      <div className={cn(SUBTITLE_CLASS, " mt-[12px] flex items-center justify-center gap-1")}>
                        <span className="leading-[20px]">Didn&apos;t Received an OTP?</span>
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={secondsLeft > 0 || isSendingOtp}
                          className={cn(
                            "font-semibold text-[color:var(--Text-Primary,#1A1A1A)]",
                            "inline-flex items-center justify-center",
                            "leading-[20px]",
                            "cursor-pointer",
                            (secondsLeft > 0 || isSendingOtp) && "cursor-not-allowed opacity-60"
                          )}
                        >
                          {isSendingOtp ? (
                            "Sending..."
                          ) : secondsLeft > 0 ? (
                            <CountdownTicker seconds={secondsLeft} className="leading-none -translate-y-[-2px]" />
                          ) : (
                            "Resend OTP"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}