"use client";

import * as React from "react";
import Link from "next/link";
import { LockKeyOpenIcon } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";

import { FloatingInput } from "@/components/ui/floatingInput";
import { PasswordInput } from "@/components/ui/password";
import { Button, buttonVariants } from "@/components/ui/buttonComp";
import { VggCardStack } from "@/components/ui/brand/VggAnimatedCard";

import { apiSignInBrand, getApiErrorMessage } from "../../services/brandApi";
import { toast, ToastStyles } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type ErrorKind =
  | "EMAIL_NOT_REGISTERED"
  | "WRONG_PASSWORD"
  | "RATE_LIMIT"
  | "SERVER"
  | "UNKNOWN";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

type ApiErrDetails = {
  message: string;
  code?: string;
  status?: number;
};

type VerifyRecaptchaResponse = {
  success?: boolean;
  score?: number;
  action?: string;
};

type OnboardingRoute =
  | "page1"
  | "page2"
  | "page3"
  | "campaign"
  | "homepage";

type BrandSignInResponse = {
  token: string;
  brandId: string;
  route?: OnboardingRoute;
  onboarding?: {
    page1Done?: boolean;
    page2Done?: boolean;
    page3Done?: boolean;
  };
};

const BRAND_ONBOARDING_RESUME_KEY = "cg_brand_onboarding_resume_step";

function getStoredBrandResumeRoute(): OnboardingRoute | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const step = sessionStorage.getItem(BRAND_ONBOARDING_RESUME_KEY);

    if (step === "page1" || step === "page2" || step === "page3") {
      return step;
    }
  } catch {
    // ignore
  }

  return undefined;
}

function getApiErrorDetails(
  err: any,
  fallbackMsg = "Login failed"
): ApiErrDetails {
  const data = err?.response?.data ?? err?.data ?? err?.cause?.data ?? undefined;

  const status =
    err?.response?.status ??
    err?.status ??
    data?.status ??
    data?.error?.status ??
    undefined;

  const code = data?.code ?? data?.error?.code ?? err?.code ?? undefined;

  const message =
    data?.message ?? data?.error?.message ?? err?.message ?? fallbackMsg;

  return {
    message: String(message || fallbackMsg),
    code: code ? String(code) : undefined,
    status: typeof status === "number" ? status : undefined,
  };
}

function prettifyRateLimitMessage(msg: string) {
  const m = (msg || "").trim();
  if (!m) return "Too many attempts. Please try again later.";

  if (/after\s*24\s*hour/i.test(m) || /24\s*hours/i.test(m)) {
    return "Too many failed login attempts. Please try again after 24 hours.";
  }

  const match = m.match(
    /try again in\s+(\d+)\s+(seconds|second|minutes|minute|hours|hour)/i
  );
  if (match) {
    const n = match[1];
    const unitRaw = match[2].toLowerCase();
    const unit =
      unitRaw === "second"
        ? "seconds"
        : unitRaw === "minute"
          ? "minutes"
          : unitRaw === "hour"
            ? "hours"
            : unitRaw;

    return `Too many failed login attempts. Please try again in ${n} ${unit}.`;
  }

  return m;
}

function mapLoginError(d: ApiErrDetails): {
  kind: ErrorKind;
  title: string;
  text: string;
} {
  const msg = (d.message || "").toLowerCase();
  const code = (d.code || "").toUpperCase();
  const status = d.status;

  const isSigninRateLimit =
    status === 429 ||
    code === "SIGNIN_RATE_LIMIT" ||
    code === "SIGNIN_DAILY_LIMIT" ||
    msg.includes("too many failed login") ||
    msg.includes("too many") ||
    msg.includes("try again");

  if (isSigninRateLimit) {
    return {
      kind: "RATE_LIMIT",
      title: "Too many attempts",
      text: prettifyRateLimitMessage(d.message),
    };
  }

  const notRegistered =
    status === 404 ||
    msg.includes("email does not exist") ||
    msg.includes("account not found") ||
    msg.includes("please sign up") ||
    msg.includes("sign up");

  if (notRegistered) {
    return {
      kind: "EMAIL_NOT_REGISTERED",
      title: "Account not found",
      text: "This email isn’t registered yet. Please sign up to continue.",
    };
  }

  const wrongPassword =
    msg.includes("incorrect password") ||
    msg.includes("wrong password") ||
    msg.includes("invalid password");

  if (wrongPassword) {
    return {
      kind: "WRONG_PASSWORD",
      title: "Incorrect password",
      text: "The password you entered is incorrect. Please try again.",
    };
  }

  if (
    status === 401 ||
    msg.includes("unauthorized") ||
    msg.includes("invalid token") ||
    msg.includes("auth")
  ) {
    return {
      kind: "SERVER",
      title: "Login issue",
      text: "Something went wrong. Please try again.",
    };
  }

  return {
    kind: "UNKNOWN",
    title: "Login failed",
    text: d.message || "Please check your details and try again.",
  };
}

async function verifyRecaptchaToken(
  token: string,
  action: string
): Promise<VerifyRecaptchaResponse> {
  console.warn(
    "verifyRecaptchaToken() is using a local mock. Replace it with your real backend call."
  );
  return { success: true, score: 0.9, action };
}

function persistBrandOnboardingRoute(route?: OnboardingRoute) {
  try {
    if (route === "page1" || route === "page2" || route === "page3") {
      sessionStorage.setItem(BRAND_ONBOARDING_RESUME_KEY, route);
      return;
    }

    sessionStorage.removeItem(BRAND_ONBOARDING_RESUME_KEY);
  } catch {
    // ignore
  }
}

function routeToBrandPath(route?: OnboardingRoute) {
  switch (route) {
    case "page1":
      return "/brand/onboarding?step=page1";
    case "page2":
      return "/brand/onboarding?step=page2";
    case "page3":
      return "/brand/onboarding?step=page3";
    case "homepage":
    case "campaign":
    default:
      return "/brand/dashboard";
  }
}

function SecurityCheckOverlay({
  checking,
  onRetry,
}: {
  checking: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] bg-[#fbf8f3]/90 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-6">
        <div
          className="w-full max-w-md rounded-[28px] border border-[#ead28a] px-7 py-8 text-center shadow-[0_24px_70px_rgba(183,145,35,0.14)]"
          style={{
            background:
              "linear-gradient(156.55deg, #FFFBF04D 0%, #FBFAF9FF 50%, #FDF2FC33 100%)",
          }}
        >
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#e6c968] bg-gradient-to-b from-[#fff4c7] to-[#f1d05d] shadow-[0_8px_24px_rgba(212,173,58,0.18)]">
              <LockKeyOpenIcon
                size={26}
                weight="duotone"
                className="text-[#a97c00]"
              />
            </div>
          </div>

          <div className="mb-2 text-[28px] font-semibold leading-tight text-[#b88300]">
            Security check required
          </div>

          <div className="mx-auto max-w-[320px] text-sm leading-6 text-[#7d6b45]">
            You refreshed this page 3 times. We’re running an invisible security
            verification before continuing.
          </div>

          <div className="mt-6 space-y-4">
            <div className="text-sm leading-6 text-[#7d6b45]">
              {checking
                ? "Running invisible security verification..."
                : "Verification did not complete. Please try again."}
            </div>

            {!checking ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center justify-center rounded-full border border-[#e3c14e] bg-gradient-to-r from-[#f2d15b] to-[#e7bf43] px-5 py-2.5 text-sm font-medium text-[#5e470f] shadow-[0_10px_28px_rgba(212,173,58,0.22)]"
              >
                Try again
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandLoginContentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [authGuardReady, setAuthGuardReady] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [emailError, setEmailError] = React.useState<string>("");
  const [passwordError, setPasswordError] = React.useState<string>("");
  const emailInvalid = !!emailError;
  const passwordInvalid = !!passwordError;
  const emailTrimmed = email.trim();

  const [, setRefreshCount] = React.useState(0);
  const [captchaRequired, setCaptchaRequired] = React.useState(false);
  const [captchaVerified, setCaptchaVerified] = React.useState(false);
  const [captchaChecking, setCaptchaChecking] = React.useState(false);
  const [captchaAttempt, setCaptchaAttempt] = React.useState(0);

  const actionName = React.useMemo(() => "brand_login_refresh_gate", []);

  const hasActiveBrandSession = React.useCallback(() => {
    if (typeof window === "undefined") return false;

    try {
      const token = localStorage.getItem("token");
      const brandId = localStorage.getItem("brandId");
      return Boolean(token && brandId);
    } catch {
      return false;
    }
  }, []);

  const redirectAuthenticatedBrandUser = React.useCallback(() => {
    if (!hasActiveBrandSession()) return false;

    const resumeRoute = getStoredBrandResumeRoute();
    router.replace(routeToBrandPath(resumeRoute));
    return true;
  }, [hasActiveBrandSession, router]);

  React.useEffect(() => {
    const enforceGuestOnlyAccess = () => {
      const redirected = redirectAuthenticatedBrandUser();
      if (!redirected) {
        setAuthGuardReady(true);
      }
    };

    enforceGuestOnlyAccess();

    const handlePageShow = () => {
      enforceGuestOnlyAccess();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        enforceGuestOnlyAccess();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [redirectAuthenticatedBrandUser]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const countKey = `cg-refresh-count:${pathname}`;
    const verifiedKey = `cg-refresh-verified:${pathname}`;

    const navEntry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;

    const isReload =
      navEntry?.type === "reload" ||
      (typeof performance !== "undefined" &&
        typeof (performance as any).navigation !== "undefined" &&
        (performance as any).navigation.type === 1);

    const previousCount = Number(sessionStorage.getItem(countKey) || "0");
    const nextCount = isReload ? previousCount + 1 : 0;

    sessionStorage.setItem(countKey, String(nextCount));
    setRefreshCount(nextCount);

    const alreadyVerified = sessionStorage.getItem(verifiedKey) === "1";
    setCaptchaVerified(alreadyVerified);
    setCaptchaRequired(nextCount >= 3 && !alreadyVerified);
  }, [pathname]);

  const markCaptchaPassed = React.useCallback(() => {
    const countKey = `cg-refresh-count:${pathname}`;
    const verifiedKey = `cg-refresh-verified:${pathname}`;

    sessionStorage.setItem(countKey, "0");
    sessionStorage.setItem(verifiedKey, "1");

    setRefreshCount(0);
    setCaptchaVerified(true);
    setCaptchaRequired(false);
  }, [pathname]);

  const markCaptchaFailed = React.useCallback(() => {
    const verifiedKey = `cg-refresh-verified:${pathname}`;
    sessionStorage.removeItem(verifiedKey);

    setCaptchaVerified(false);
    setCaptchaRequired(true);
  }, [pathname]);

  React.useEffect(() => {
    if (!captchaRequired || captchaVerified) return;
    if (!executeRecaptcha) return;

    let cancelled = false;

    (async () => {
      try {
        setCaptchaChecking(true);

        const token = await executeRecaptcha(actionName);
        const resp = await verifyRecaptchaToken(token, actionName);

        if (cancelled) return;

        const success = Boolean(resp?.success);
        const score = Number(resp?.score ?? 0);
        const actionMatches = !resp?.action || resp.action === actionName;

        if (success && actionMatches && score >= 0.5) {
          markCaptchaPassed();
        } else {
          markCaptchaFailed();
        }
      } catch (error) {
        if (!cancelled) {
          console.error("reCAPTCHA v3 verification failed:", error);
          markCaptchaFailed();
        }
      } finally {
        if (!cancelled) setCaptchaChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    captchaRequired,
    captchaVerified,
    executeRecaptcha,
    actionName,
    captchaAttempt,
    markCaptchaFailed,
    markCaptchaPassed,
  ]);

  const getSafeReturnUrl = () => {
    const returnUrl = searchParams.get("returnUrl");

    if (!returnUrl) return "/brand/dashboard";

    try {
      const decoded = decodeURIComponent(returnUrl);

      if (
        decoded.startsWith("/") &&
        !decoded.startsWith("//") &&
        !decoded.includes("://")
      ) {
        return decoded;
      }
    } catch {
      return "/brand/dashboard";
    }

    return "/brand/dashboard";
  };

  const getPostLoginRedirect = (res?: BrandSignInResponse) => {
    const route = res?.route;

    if (route === "page1" || route === "page2" || route === "page3") {
      return routeToBrandPath(route);
    }

    return getSafeReturnUrl();
  };

  const clearEmailOnFocus = () => {
    if (emailError) setEmailError("");
  };

  const clearPasswordOnFocus = () => {
    if (passwordError) setPasswordError("");
  };

  const validateAndSetFieldErrors = () => {
    const e = emailTrimmed;
    const p = password.trim();

    let nextEmailError = "";
    let nextPasswordError = "";

    if (!e) nextEmailError = "Email is required.";
    else if (!emailOk(e)) nextEmailError = "Please enter a valid email address.";

    if (!p) nextPasswordError = "Password is required.";

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    return !(nextEmailError || nextPasswordError);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (captchaRequired && !captchaVerified) {
      toast({
        icon: "error",
        title: "Security check in progress",
        text: "Please complete the invisible verification before signing in.",
      });
      return;
    }

    const ok = validateAndSetFieldErrors();
    if (!ok) return;

    setLoading(true);
    try {
      const res = (await apiSignInBrand(
        emailTrimmed,
        password
      )) as BrandSignInResponse;

      localStorage.setItem("token", res.token);
      localStorage.setItem("brandId", res.brandId);

      persistBrandOnboardingRoute(res.route);

      await fetch("/api-1/brand-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: res.token }),
      });

      router.replace(getPostLoginRedirect(res));
    } catch (err) {
      const fallback = getApiErrorMessage(err, "Login failed");
      const details = getApiErrorDetails(err, fallback);
      const mapped = mapLoginError(details);

      toast({ icon: "error", title: mapped.title, text: mapped.text });
    } finally {
      setLoading(false);
    }
  };

  if (!authGuardReady) {
    return <div className="min-h-screen bg-background text-foreground" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <ToastStyles />

      {captchaRequired && !captchaVerified ? (
        <SecurityCheckOverlay
          checking={captchaChecking}
          onRetry={() => setCaptchaAttempt((x) => x + 1)}
        />
      ) : null}

      <header className="w-full bg-white border-b border-bd-primary">
        <div
          className="
            mx-auto flex flex-wrap items-center justify-between content-center
            gap-m py-[1rem]
            px-[1.25rem] md:px-[3rem] xl:px-[7.5rem] 2xl:px-[10rem]
            max-w-full
          "
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
              <span className="block text-[1.25rem] font-bold text-tx-primary">
                CollabGlam
              </span>
              <span className="block text-[0.625rem] leading-[0.75rem] text-tx-tertiary -mt-[0.125rem]">
                For Brands
              </span>
            </span>
          </Link>

          <Link
            href="/influencer/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "!my-0 rounded-m px-l border border-bd-primary text-tx-primary !shadow-none"
            )}
          >
            Join as a Creator
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-full flex-1 py-[1.25rem]">
        <div className="grid h-full items-stretch lg:grid-cols-2">
          <section className="order-1 lg:h-full">
            <div className="flex w-full lg:h-full lg:items-stretch pr-[1.25rem]">
              <div
                className="
                  relative w-full overflow-hidden
                  rounded-tr-[2rem] rounded-br-[2rem]
                  h-[26.25rem] sm:h-[32.5rem] md:h-[40rem]
                  lg:h-[calc(100svh-7.125rem)]
                "
                style={{
                  background:
                    "var(--Gradient-Brand-Primary-Radial, radial-gradient(100% 100% at 50% 0%, #FF8C01 0%, #FFBF00 37.94%, #FFF 90.87%))",
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center p-[1.125rem] sm:p-[1.75rem] lg:p-[3.125rem]">
                  <VggCardStack className="w-full max-w-[35rem]" />
                </div>
              </div>
            </div>
          </section>

          <section className="order-2 flex lg:h-full lg:items-center">
            <div className="mx-auto w-full max-w-[32.5rem] px-4 sm:px-6 lg:px-8 py-8 lg:py-0">
              <h1 className="cg-heading">Login to Continue</h1>

              <p className="mt-m cg-description">
                Enter your registered details to access your dashboard and ongoing work.
              </p>

              <form onSubmit={onSubmit} className="space-y-m mt-2xl">
                <FloatingInput
                  label="Email"
                  value={email}
                  onValueChange={(v: string) => {
                    setEmail(v);
                    if (emailError) setEmailError("");
                  }}
                  onFocus={clearEmailOnFocus}
                  icon={true}
                  size="small"
                  state={emailInvalid ? "error" : "default"}
                  errorText={emailError || undefined}
                />

                <div>
                  <PasswordInput
                    label="Password"
                    value={password}
                    onValueChange={(v: string) => {
                      setPassword(v);
                      if (passwordError) setPasswordError("");
                    }}
                    onFocus={clearPasswordOnFocus}
                    showRules={false}
                    state={passwordInvalid ? "error" : "default"}
                    errorText={passwordError || undefined}
                  />

                  <div className="mt-m flex justify-end">
                    <Link
                      href="/brand/forgot-password"
                      className="
                        text-right font-[Inter] text-[0.75rem] font-normal leading-[1rem]
                        text-[color:var(--Active-900,#081526)] hover:opacity-80
                      "
                    >
                      Forgot Password
                    </Link>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="solid"
                  size="lg"
                  className="w-full rounded-m mt-xl"
                  disabled={loading || (captchaRequired && !captchaVerified)}
                >
                  {loading ? "Signing in..." : "Continue"}
                </Button>

                <p className="cg-auth-helper">
                  Don’t Have an Account?{" "}
                  <Link
                    href={
                      emailTrimmed
                        ? `/brand/signup?email=${encodeURIComponent(emailTrimmed)}`
                        : "/brand/signup"
                    }
                    className="cg-auth-link hover:underline"
                  >
                    Signup
                  </Link>
                </p>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function BrandLoginContent() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "head",
      }}
    >
      <BrandLoginContentInner />
    </GoogleReCaptchaProvider>
  );
}

export default function BrandLoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-background" />}>
      <BrandLoginContent />
    </React.Suspense>
  );
}