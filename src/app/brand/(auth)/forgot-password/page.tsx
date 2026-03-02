"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import logo from "@/public/logo.png";

import { FloatingInput } from "@/components/ui/floatingInput";
import { PasswordInput } from "@/components/ui/password";
import { Button, buttonVariants } from "@/components/ui/buttonComp";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { CaretLeft } from "@phosphor-icons/react";

import {
  apiSendOtpForgot,
  apiVerifyOtpForgot,
  apiUpdatePasswordWithResetToken,
  getApiErrorMessage,
} from "../../services/brandApi";
import { CountdownTicker } from "@/components/ui/countdown-ticker";

// ✅ Toast
import { toast, ToastStyles } from "@/components/ui/toast";

type Step = "email" | "otp" | "new_password";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const pwLenOk = (p: string) => {
  const len = (p ?? "").trim().length;
  return len >= 8 && len <= 16;
};

const ERROR_BORDER = "border-[color:var(--Errors-500,#E35141)]";

const TITLE_CLASS = cn(
  "text-[color:var(--Text-Primary,#1A1A1A)]",
  "[font-family:var(--Font-Family-Inter,Inter)]",
  "font-semibold",
  "text-[28px] leading-[36px] tracking-[-0.5px]",
  "md:[font-size:var(--Font-Size-32,32px)] md:[line-height:var(--Line-Height-40,40px)] md:[letter-spacing:var(--Letter-Spacing--1,-1px)]"
);

const SUBTITLE_CLASS = cn(
  "text-[color:var(--Light-Text-Tertiary,#B8B8B8)]",
  "[font-family:var(--Font-Family-Inter,Inter)]",
  "font-medium",
  "text-[14px] leading-[20px] tracking-[0px]",
  "md:[font-size:var(--Font-Size-16,16px)] md:[line-height:var(--Line-Height-24,24px)] md:[letter-spacing:var(--Letter-Spacing-0,0)]"
);

const BACK_CLASS = cn(
  "inline-flex items-center gap-2",
  "text-[color:var(--Light-Icon-Primary,#1A1A1A)]",
  "[font-family:var(--Font-Family-Inter,Inter)]",
  "font-medium",
  "text-[14px] leading-[20px]",
  "md:[font-size:var(--Font-Size-16,16px)] md:[line-height:var(--Line-Height-24,24px)] md:[letter-spacing:var(--Letter-Spacing-0,0)]",
  "cursor-pointer hover:underline"
);

const STEP_COPY: Record<Step, { title: string; subtitle: string }> = {
  email: {
    title: "Reset Password",
    subtitle: "Enter your account email so we can send you a verification code",
  },
  otp: {
    title: "Enter OTP",
    subtitle: "We've sent a 6-digit code to your email. Enter it here to continue.",
  },
  new_password: {
    title: "Create a new password",
    subtitle:
      "Enter your New Password and Confirm Password so we can take you back to your dashboard and ongoing work.",
  },
};

type FieldErrors = {
  email?: string;
  otp?: string;
  password?: string;
  confirm?: string;
};

export default function ForgotPassword() {
  const router = useRouter();

  const [step, setStep] = React.useState<Step>("email");

  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [pwValid, setPwValid] = React.useState(false);
  const [resetToken, setResetToken] = React.useState<string>("");

  // ✅ loaders
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [isUpdatingPw, setIsUpdatingPw] = React.useState(false);

  // ✅ frontend-only errors (inline + red state). Backend errors = toast only.
  const [fieldErr, setFieldErr] = React.useState<FieldErrors>({});

  // OTP timer
  const OTP_SECONDS = 60;
  const [secondsLeft, setSecondsLeft] = React.useState(OTP_SECONDS);

  // Reset frontend errors + otp timer only when step changes
  React.useEffect(() => {
    setFieldErr({});

    if (step !== "otp") return;

    setSecondsLeft(OTP_SECONDS);
    const t = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleBack = () => {
    if (step === "otp" || step === "new_password") {
      setStep("email");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
      setResetToken("");
      setFieldErr({});
      return;
    }
    router.push("/brand/login");
  };

  const clearErr = (key: keyof FieldErrors) => {
    setFieldErr((p) => {
      if (!p[key]) return p;
      const next = { ...p };
      delete next[key];
      return next;
    });
  };

  const onContinue = async () => {
    // ✅ clear previous frontend errors (fresh validation per click)
    setFieldErr({});

    // ---------------- email step ----------------
    if (step === "email") {
      if (!email.trim()) {
        setFieldErr({ email: "Recovery email is required." });
        return;
      }
      if (!isValidEmail(email)) {
        setFieldErr({ email: "Please enter a valid email address." });
        return;
      }

      setIsSendingOtp(true);
      try {
        await apiSendOtpForgot(email.trim());
        setOtp("");
        setStep("otp");

        toast({ icon: "success", title: "OTP sent", text: `We sent a 6-digit code to ${email.trim()}` });
      } catch (e) {
        // ✅ backend error = toast only
        const msg = getApiErrorMessage(e, "Failed to send OTP");
        toast({ icon: "error", title: "Failed to send OTP", text: msg });
      } finally {
        setIsSendingOtp(false);
      }
      return;
    }

    // ---------------- otp step ----------------
    if (step === "otp") {
      if (otp.trim().length !== 6) {
        setFieldErr({ otp: "Please enter the 6-digit OTP." });
        return;
      }

      setIsVerifyingOtp(true);
      try {
        const res = await apiVerifyOtpForgot(email.trim(), otp.trim());
        setResetToken(res.resetToken);
        setStep("new_password");

        toast({ icon: "success", title: "OTP verified", text: "Now create your new password." });
      } catch (e) {
        // ✅ backend error = toast only (no red state / no inline)
        const msg = getApiErrorMessage(e, "OTP verification failed");
        toast({ icon: "error", title: "OTP verification failed", text: msg });
      } finally {
        setIsVerifyingOtp(false);
      }
      return;
    }

    // ---------------- new password step ----------------
    if (step === "new_password") {
      let pwdErr = "";
      let confErr = "";

      if (!password.trim()) pwdErr = "Password is required.";
      else if (!pwLenOk(password)) pwdErr = "Password must be 8–16 characters.";
      else if (!pwValid) pwdErr = "Password must include Numbers, Uppercase, and a Special character.";

      if (!confirmPassword.trim()) confErr = "Confirm password is required.";
      else if (!pwLenOk(confirmPassword)) confErr = "Confirm password must be 8–16 characters.";
      else if (password !== confirmPassword) confErr = "Passwords do not match.";

      if (pwdErr || confErr) {
        setFieldErr({
          password: pwdErr || undefined,
          confirm: confErr || undefined,
        });
        return;
      }

      if (!resetToken) {
        toast({
          icon: "error",
          title: "Session expired",
          text: "Reset session missing. Please verify OTP again.",
        });
        setStep("email");
        return;
      }

      setIsUpdatingPw(true);
      try {
        await apiUpdatePasswordWithResetToken(resetToken, password);

        toast({
          icon: "success",
          title: "Password Reset Successful",
          text: "You can now log in with your new password.",
          timer: 2500,
        });

        window.setTimeout(() => router.push("/brand/login"), 700);
      } catch (e) {
        // ✅ backend error = toast only (no red state / no inline)
        const msg = getApiErrorMessage(e, "Failed to update password");
        toast({ icon: "error", title: "Failed to update password", text: msg });
      } finally {
        setIsUpdatingPw(false);
      }
    }
  };

  // ✅ RESEND: backend error toast only; invalid email -> go back + inline error
  const onResend = async () => {
    if (secondsLeft > 0 || isSendingOtp) return;

    if (!isValidEmail(email)) {
      setStep("email");
      setFieldErr({ email: "Please enter a valid email address." });
      return;
    }

    setOtp("");
    clearErr("otp");

    setIsSendingOtp(true);
    try {
      await apiSendOtpForgot(email.trim());
      setSecondsLeft(OTP_SECONDS);

      toast({ icon: "success", title: "OTP resent", text: `A new OTP was sent to ${email.trim()}` });
    } catch (e) {
      const msg = getApiErrorMessage(e, "Failed to resend OTP");
      toast({ icon: "error", title: "Failed to resend OTP", text: msg });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const header = STEP_COPY[step];

  const emailInvalid = !!fieldErr.email;
  const otpInvalid = !!fieldErr.otp;
  const passwordInvalid = !!fieldErr.password;
  const confirmInvalid = !!fieldErr.confirm;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
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
            <Image src={logo} alt="CollabGlam Logo" width={40} height={40} className="object-contain" priority />
            <span className="leading-tight">
              <span className="block text-[20px] font-bold text-tx-primary">CollabGlam</span>
              <span className="block text-[10px] leading-[12px] text-tx-tertiary -mt-[2px]">For Brands</span>
            </span>
          </Link>

          <Link
            href="/brand/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "!my-0 rounded-m px-l border-[color:var(--Border-Primary,#B3B3B3)] text-neutral-600"
            )}
          >
            Login as Brand
          </Link>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 flex justify-center">
        <div
          className={cn(
            "w-full max-w-[520px]",
            "px-[20px]",
            "py-[48px] sm:py-[60px] md:py-[80px] xl:py-[100px] 2xl:py-[120px]"
          )}
        >
          {/* Back Button */}
          <button type="button" onClick={handleBack} className={cn(BACK_CLASS, "mb-[14px] md:mb-[16px]")}>
            <CaretLeft className="size-5" weight="bold" />
            Back
          </button>

          {/* Title */}
          <div className="text-left">
            <h1 className={TITLE_CLASS}>{header.title}</h1>
            <p className={cn("mt-2", SUBTITLE_CLASS)}>{header.subtitle}</p>
          </div>

          {/* Form */}
          <div className="mt-[24px] md:mt-[34px] w-full">
            {step === "email" && (
              <div className="space-y-[18px]">
                <FloatingInput
                  type="email"
                  label="Recovery Email"
                  value={email}
                  onValueChange={(v) => {
                    setEmail(v);
                    clearErr("email");
                  }}
                  onFocus={() => clearErr("email")}
                  state={emailInvalid ? "error" : "default"}
                  errorText={fieldErr.email}
                />

                <Button
                  className={cn(
                    "w-full h-[52px] rounded-[12px] bg-neutral-900 text-white hover:bg-neutral-900/90",
                    isSendingOtp && "opacity-60"
                  )}
                  onClick={onContinue}
                  disabled={isSendingOtp}
                >
                  {isSendingOtp ? "Sending OTP..." : "Continue"}
                </Button>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-[18px]">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onFocus={() => clearErr("otp")}
                    onChange={(v) => {
                      setOtp(v);
                      clearErr("otp");
                    }}
                  >
                    <InputOTPGroup className="gap-[12px] sm:gap-[16px] md:gap-[20px]">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className={cn(
                            "h-[40px] w-[40px] sm:h-[44px] sm:w-[44px]",
                            "rounded-[10px] border text-[16px]",
                            otpInvalid ? ERROR_BORDER : "border-neutral-300"
                          )}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {/* ✅ Inline OTP error text */}
                {fieldErr.otp ? (
                  <p className="text-[14px] leading-[20px] text-[color:var(--Errors-500,#E35141)] text-center">
                    {fieldErr.otp}
                  </p>
                ) : null}

                <div className="space-y-[20px]">
                  <Button
                    className={cn(
                      "w-full h-[52px] rounded-[12px] bg-neutral-900 text-white hover:bg-neutral-900/90",
                      (isVerifyingOtp || isSendingOtp) && "opacity-60"
                    )}
                    onClick={onContinue}
                    disabled={isVerifyingOtp || isSendingOtp}
                  >
                    {isVerifyingOtp ? "Verifying..." : "Continue"}
                  </Button>

                  <div className={cn(SUBTITLE_CLASS, "flex items-center justify-center gap-1")}>
                    <span className="leading-[20px]">Didn&apos;t Received an OTP?</span>
                    <button
                      type="button"
                      onClick={onResend}
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
                        "Resend"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === "new_password" && (
              <div className="space-y-[14px]">
                <PasswordInput
                  label="Enter Password"
                  value={password}
                  onValueChange={(v) => {
                    setPassword(v);
                    clearErr("password");
                  }}
                  onFocus={() => clearErr("password")}
                  onValidityChange={(valid) => setPwValid(valid)}
                  state={passwordInvalid ? "error" : "default"}
                  errorText={fieldErr.password}
                  showRules
                />

                <PasswordInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onValueChange={(v) => {
                    setConfirmPassword(v);
                    clearErr("confirm");
                  }}
                  onFocus={() => clearErr("confirm")}
                  state={confirmInvalid ? "error" : "default"}
                  showRules={false}
                  errorText={fieldErr.confirm}
                />

                <Button
                  className={cn(
                    "w-full h-[52px] rounded-[12px] bg-neutral-900 text-white hover:bg-neutral-900/90 mt-[6px]",
                    isUpdatingPw && "opacity-60"
                  )}
                  onClick={onContinue}
                  disabled={isUpdatingPw}
                >
                  {isUpdatingPw ? "Updating..." : "Continue"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
