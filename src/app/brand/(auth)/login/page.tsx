"use client";

import * as React from "react";
import Link from "next/link";
import { InstagramLogo } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { FloatingInput } from "@/components/ui/floatingInput";
import { PasswordInput } from "@/components/ui/password";
import { Button, buttonVariants } from "@/components/ui/buttonComp";
import { VggCardStack } from "@/components/ui/brand/VggAnimatedCard";

import { apiSignInBrand, getApiErrorMessage } from "../../services/brandApi";
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

  const code = data?.code ?? data?.error?.code ?? err?.code ?? undefined;

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

export default function BrandLoginPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [emailError, setEmailError] = React.useState<string>("");
  const [passwordError, setPasswordError] = React.useState<string>("");
  const emailInvalid = !!emailError;
  const passwordInvalid = !!passwordError;
  const emailTrimmed = email.trim();

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
      const res = await apiSignInBrand(emailTrimmed, password);

      localStorage.setItem("token", res.token);
      localStorage.setItem("brandId", res.brandId);

      await fetch("/api-1/brand-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: res.token }),
      });

      router.replace("/brand/dashboard");
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
              <span className="block text-[1.25rem] font-bold text-tx-primary">CollabGlam</span>
              <span className="block text-[0.625rem] leading-[0.75rem] text-tx-tertiary -mt-[0.125rem]">
                For Brands
              </span>
            </span>
          </Link>

          <Button
            onClick={() => router.push("/influencer/login")}
            variant="outline"
          >
            Join as a Creator
          </Button>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-full flex-1 py-[1.25rem]">
        <div className="grid h-full items-stretch lg:grid-cols-2">
          {/* LEFT */}
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
                {/* ✅ Dynamic testimonial card (changes on refresh + every route change) */}
                <div className="absolute inset-0 flex items-center justify-center p-[1.125rem] sm:p-[1.75rem] lg:p-[3.125rem]">
                  <VggCardStack className="w-full max-w-[35rem]" />
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <section className="order-2 flex lg:h-full lg:items-center">
            <div className="mx-auto w-full max-w-[32.5rem] px-4 sm:px-6 lg:px-8 py-8 lg:py-0">
              <h1 className="cg-heading">Login to Continue</h1>

              <p className="mt-m cg-description">
                Enter your registered details to access your dashboard and ongoing work.
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

              {/* OR Divider */}
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
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Continue"}
                </Button>

                <p className="cg-auth-helper">
                  Don’t Have an Account?{" "}
                  <Link
                    href={emailTrimmed ? `/brand/signup?email=${encodeURIComponent(emailTrimmed)}` : "/brand/signup"}
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
