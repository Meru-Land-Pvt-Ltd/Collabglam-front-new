"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InstagramLogo } from "@phosphor-icons/react";

import { FloatingInput } from "@/components/ui/floatingInput";
import { PasswordInput } from "@/components/ui/password";
import { Button, buttonVariants } from "@/components/ui/buttonComp";
import { cn } from "@/lib/utils";

import { apiSignInInfluencer, getApiErrorMessage } from "../../services/influencerApi";
import { toast, ToastStyles } from "@/components/ui/toast";

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

function getApiErrorDetails(err: any, fallbackMsg = "Login failed"): ApiErrDetails {
  const data = err?.response?.data ?? err?.data ?? err?.cause?.data ?? undefined;

  const status =
    err?.response?.status ??
    err?.status ??
    data?.status ??
    data?.error?.status ??
    undefined;

  const code =
    data?.code ??
    data?.error?.code ??
    err?.code ??
    undefined;

  const message =
    data?.message ??
    data?.error?.message ??
    err?.message ??
    fallbackMsg;

  return {
    message: String(message || fallbackMsg),
    code: code ? String(code) : undefined,
    status: typeof status === "number" ? status : undefined,
  };
}


type CookieOptions = {
  days?: number; // expiry in days
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
};

function setCookie(name: string, value: string, opts: CookieOptions = {}) {
  if (typeof document === "undefined") return;

  const {
    days = 30,
    path = "/",
    sameSite = "Lax",
    secure = typeof window !== "undefined" ? window.location.protocol === "https:" : false,
  } = opts;

  const maxAge = days * 24 * 60 * 60; // seconds

  document.cookie =
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}` +
    `; Max-Age=${maxAge}` +
    `; Path=${path}` +
    `; SameSite=${sameSite}` +
    (secure ? "; Secure" : "");
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));

  if (!match) return null;
  const value = match.split("=").slice(1).join("=");
  return decodeURIComponent(value);
}

function prettifyRateLimitMessage(msg: string) {
  const m = (msg || "").trim();
  if (!m) return "Too many attempts. Please try again later.";

  if (/after\s*24\s*hour/i.test(m) || /24\s*hours/i.test(m)) {
    return "Too many failed login attempts. Please try again after 24 hours.";
  }

  const match = m.match(/try again in\s+(\d+)\s+(seconds|second|minutes|minute|hours|hour)/i);
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

function mapLoginError(d: ApiErrDetails): { kind: ErrorKind; title: string; text: string } {
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
    return { kind: "SERVER", title: "Login issue", text: "Something went wrong. Please try again." };
  }

  return { kind: "UNKNOWN", title: "Login failed", text: d.message || "Please check your details and try again." };
}

function routeToPath(route?: string) {
  switch (route) {
    case "page1":
      return "/influencer/onboarding?step=page1";
    case "page2":
      return "/influencer/onboarding?step=page2";
    case "page3":
      return "/influencer/onboarding?step=page3";
    case "campaign":
    default:
      return "/influencer/campaign";
  }
}


export default function InfluencerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [emailError, setEmailError] = React.useState<string>("");
  const [passwordError, setPasswordError] = React.useState<string>("");

  const emailTrimmed = email.trim();
  const emailInvalid = !!emailError;
  const passwordInvalid = !!passwordError;

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

    const ok = validateAndSetFieldErrors();
    if (!ok) return;

    setLoading(true);
    try {
      const res = await apiSignInInfluencer(emailTrimmed, password);

      setCookie("influencerToken", res.token, { days: 30 });
      setCookie("influencerId", res.influencerId, { days: 30 });

      await fetch("/api-1/influencer-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: res.token }),
      });

      // ✅ UPDATED: go onboarding first if incomplete
      const onboardingDone =
        res?.onboarding?.page1Done &&
        res?.onboarding?.page2Done &&
        res?.onboarding?.page3Done;

      router.replace(
        onboardingDone ? "/influencer/dashboards" : routeToPath(res.route)
      );
    } catch (err) {
      const fallback = getApiErrorMessage(err, "Login failed");
      const details = getApiErrorDetails(err, fallback);
      const mapped = mapLoginError(details);

      toast({ icon: "error", title: mapped.title, text: mapped.text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ToastStyles />

      {/* Header */}
      <header className="w-full bg-white border-y border-[color:var(--Border-Primary,#B3B3B3)]">
        <div
          className="
            mx-auto flex flex-wrap items-center justify-between content-center
            gap-m py-[16px]
            px-[20px] md:px-[48px] xl:px-[120px] 2xl:px-[160px]
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
              <span className="block text-[20px] font-bold text-tx-primary">CollabGlam</span>
              <span className="block text-[10px] leading-[12px] text-tx-tertiary -mt-[2px]">
                For Influencers
              </span>
            </span>
          </Link>

          <Link
            href="/brand/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "!my-0 rounded-m px-l border-[color:var(--Border-Primary,#B3B3B3)] text-neutral-600"
            )}
          >
            Join as a Brand
          </Link>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-full flex-1 py-[20px] ">
        <div className="grid h-full items-stretch gap-[40px] lg:grid-cols-2">
          {/* LEFT IMAGE */}
          <section className="order-1 lg:order-1 lg:h-full">
            <div className="flex w-full pr-[20px] lg:h-full lg:items-stretch">
              <div
                className="
                  relative w-full overflow-hidden
                  rounded-tr-2xl rounded-br-2xl
                  h-[380px] sm:h-[460px] md:h-[640px]
                  lg:h-[calc(100svh-114px)]
                "
                style={{ isolation: "isolate" }}
              >
                <div className="absolute inset-0 bg-brand-500" />

                <div
                  className="absolute inset-0 z-[1]"
                  style={{
                    background: `lightgray url(/images/login_1.png) 50% / cover no-repeat`,
                    mixBlendMode: "luminosity",
                  }}
                />

                <div className="absolute z-[2] left-0 right-0 bottom-0 flex justify-center">
                  <div className="relative w-full h-[150px] flex items-center justify-center px-[50px] overflow-hidden">
                    <div
                      className="absolute inset-0"
                      style={{
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)",
                      }}
                    />
                    <p className="relative text-center text-white font-semibold text-[24px] leading-[32px] z-10">
                      "Your influence has a voice, Let&apos;s amplify it."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT FORM */}
          <section className="order-1 xl:order-2 flex lg:h-full lg:items-center">
            <div className="mx-auto w-full max-w-[520px] px-4 sm:px-6 lg:px-8 py-8 lg:py-0">
              <h1 className="cg-heading">Welcome Back</h1>

              <p className="mt-m cg-description">
                Enter your email and password so we can take you back to your dashboard and ongoing work.
              </p>

              <div className="mt-2xl">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full !my-0 rounded-m"
                  leftIcon={<InstagramLogo size={18} />}
                  onClick={() => console.log("instagram oauth")}
                >
                  Continue With Instagram
                </Button>
              </div>

              <div className="mt-2xl flex h-[1.5rem] w-full items-center justify-center">
                <div className="h-0 w-[12rem] border-t border-bd-subtle opacity-100" />
                <span className="mx-[0.5rem] flex h-[1.5rem] items-center justify-center cg-ts text-tx-tertiary">
                  or
                </span>
                <div className="h-0 w-[12rem] border-t border-bd-subtle opacity-100" />
              </div>

              <form onSubmit={onSubmit} className="space-y-m mt-2xl">
                <FloatingInput
                  label="Email"
                  type="email"
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
                  disabled={loading}
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
                    disabled={loading}
                  />

                  <div className="mt-m flex justify-end">
                    <Link
                      href="/influencer/forgot-password"
                      className="
                        text-right font-[Inter] text-[12px] font-normal leading-[16px]
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
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Continue"}
                </Button>

                <p className="cg-auth-helper">
                  Don’t Have an Account?{" "}
                  <Link href="/influencer/signup" className="cg-auth-link hover:underline">
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
