"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";

import { FloatingInput } from "@/components/ui/floatingInput";
import { PasswordInput } from "@/components/ui/password";
import { Button, buttonVariants } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { CountdownTicker } from "@/components/ui/countdown-ticker";
import { toast, ToastStyles } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import {
  apiSendOtpForgotInfluencer,
  apiUpdateInfluencerPasswordWithResetToken,
  apiVerifyOtpForgotInfluencer,
  getApiErrorMessage,
} from "@/services/influencerApi";

type Step = "email" | "otp" | "new_password";

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

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
    subtitle:
      "We've sent a 6-digit code to your email. Enter it here to continue.",
  },
  new_password: {
    title: "Create a new password",
    subtitle:
      "Enter your email and password so we can take you back to your dashboard and ongoing work.",
  },
};

async function sendForgotPasswordOtp(email: string) {
  try {
    return await apiSendOtpForgotInfluencer(email.trim());
  } catch (err) {
    throw new Error(
      getApiErrorMessage(err, "Unable to send verification code right now.")
    );
  }
}

async function runRecaptchaCheck(
  executeRecaptcha: ((action: string) => Promise<string>) | undefined,
  action: string
) {
  if (!executeRecaptcha) {
    throw new Error("Security check is still loading. Please try again.");
  }

  const token = await executeRecaptcha(action);

  if (!token) {
    throw new Error("Security verification failed. Please try again.");
  }

  return token;
}

function ForgotPasswordContent() {
  const router = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [step, setStep] = React.useState<Step>("email");

  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [resetToken, setResetToken] = React.useState("");

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [emailError, setEmailError] = React.useState<string | undefined>();
  const [otpError, setOtpError] = React.useState<string | undefined>();
  const [passwordError, setPasswordError] = React.useState<string | undefined>();
  const [confirmError, setConfirmError] = React.useState<string | undefined>();

  const [pwValid, setPwValid] = React.useState(false);
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [resendingOtp, setResendingOtp] = React.useState(false);
  const [verifyingOtp, setVerifyingOtp] = React.useState(false);
  const [updatingPassword, setUpdatingPassword] = React.useState(false);

  const OTP_SECONDS = 60;
  const [secondsLeft, setSecondsLeft] = React.useState(OTP_SECONDS);

  React.useEffect(() => {
    setEmailError(undefined);
    setOtpError(undefined);
    setPasswordError(undefined);
    setConfirmError(undefined);

    if (step !== "otp") return;

    setSecondsLeft(OTP_SECONDS);
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  React.useEffect(() => {
    if (step !== "new_password") return;

    if (!confirmPassword.trim()) {
      setConfirmError((prev) =>
        prev === "Passwords do not match." ? undefined : prev
      );
      return;
    }

    setConfirmError((prev) => {
      if (password && confirmPassword && password !== confirmPassword) {
        return "Passwords do not match.";
      }

      return prev === "Passwords do not match." ? undefined : prev;
    });
  }, [password, confirmPassword, step]);

  const handleBack = () => {
    if (step === "new_password") {
      setStep("otp");
      setPassword("");
      setConfirmPassword("");
      setPasswordError(undefined);
      setConfirmError(undefined);
      return;
    }

    if (step === "otp") {
      setStep("email");
      setOtp("");
      setResetToken("");
      return;
    }

    router.push("/influencer/login");
  };

  const onContinue = async () => {
    setEmailError(undefined);
    setOtpError(undefined);
    setPasswordError(undefined);
    setConfirmError(undefined);

    if (step === "email") {
      if (!isValidEmail(email)) {
        setEmailError("Please enter a valid email.");
        return;
      }

      try {
        setSendingOtp(true);
        await runRecaptchaCheck(
          executeRecaptcha,
          "influencer_forgot_password_send_otp"
        );
        await sendForgotPasswordOtp(email);

        setOtp("");
        setResetToken("");

        toast({
          icon: "success",
          title: "OTP sent",
          text: "We’ve sent a verification code to your email.",
        });

        setStep("otp");
      } catch (error) {
        toast({
          icon: "error",
          title: "Unable to send OTP",
          text: getApiErrorMessage(
            error,
            "Unable to send verification code right now."
          ),
        });
      } finally {
        setSendingOtp(false);
      }

      return;
    }

    if (step === "otp") {
      if (otp.trim().length !== 6) {
        setOtpError("Please enter the 6-digit OTP.");
        return;
      }

      try {
        setVerifyingOtp(true);
        await runRecaptchaCheck(
          executeRecaptcha,
          "influencer_forgot_password_verify_otp"
        );

        const resp = await apiVerifyOtpForgotInfluencer(email, otp);
        const token = resp?.resetToken || "";

        if (!token) {
          throw new Error("Reset token was not returned by the server.");
        }

        setResetToken(token);

        toast({
          icon: "success",
          title: "OTP verified",
          text: resp?.message || "Your OTP has been verified successfully.",
        });

        setStep("new_password");
      } catch (error) {
        toast({
          icon: "error",
          title: "OTP verification failed",
          text: getApiErrorMessage(error, "Unable to verify OTP right now."),
        });
      } finally {
        setVerifyingOtp(false);
      }

      return;
    }

    if (step === "new_password") {
      if (!pwValid) {
        setPasswordError(
          "Password must include Numbers, Uppercase, and a Special character."
        );
        return;
      }

      if (!confirmPassword) {
        setConfirmError("Please confirm your password.");
        return;
      }

      if (password !== confirmPassword) {
        setConfirmError("Passwords do not match.");
        return;
      }

      if (!resetToken.trim()) {
        setConfirmError(
          "Your reset session has expired. Please request a new OTP."
        );
        return;
      }

      try {
        setUpdatingPassword(true);
        await runRecaptchaCheck(
          executeRecaptcha,
          "influencer_forgot_password_update_password"
        );

        const resp = await apiUpdateInfluencerPasswordWithResetToken(
          resetToken,
          password,
          confirmPassword
        );

        toast({
          icon: "success",
          title: "Password updated",
          text:
            resp?.message || "Your password has been updated successfully.",
        });

        router.replace("/influencer/login");
      } catch (error) {
        toast({
          icon: "error",
          title: "Unable to update password",
          text: getApiErrorMessage(
            error,
            "Unable to update password right now."
          ),
        });
      } finally {
        setUpdatingPassword(false);
      }
    }
  };

  const onResend = async () => {
    if (secondsLeft > 0 || resendingOtp) return;

    setOtpError(undefined);
    setEmailError(undefined);

    try {
      setResendingOtp(true);
      await runRecaptchaCheck(
        executeRecaptcha,
        "influencer_forgot_password_resend_otp"
      );
      await sendForgotPasswordOtp(email);

      setOtp("");
      setResetToken("");
      setSecondsLeft(OTP_SECONDS);

      toast({
        icon: "success",
        title: "OTP resent",
        text: "A new verification code has been sent to your email.",
      });
    } catch (error) {
      toast({
        icon: "error",
        title: "Unable to resend OTP",
        text: getApiErrorMessage(
          error,
          "Unable to resend the verification code right now."
        ),
      });
    } finally {
      setResendingOtp(false);
    }
  };

  const header = STEP_COPY[step];
  const passwordInvalid = !!passwordError;
  const confirmInvalid = !!confirmError;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ToastStyles />

      <header className="w-full bg-white border-b border-bd-primary">
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
            href="/influencer/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "!my-0 rounded-m px-l !font-inter !border !border-bd-primary !text-tx-primary hover:!bg-neutral-50 !shadow-none p-4.5"
            )}
          >
            Login as Creator
          </Link>
        </div>
      </header>

      <main className="flex-1 flex justify-center">
        <div
          className={cn(
            "w-full max-w-[520px]",
            "px-[20px]",
            "py-[48px] sm:py-[60px] md:py-[80px] xl:py-[100px] 2xl:py-[120px]"
          )}
        >
          <button
            type="button"
            onClick={handleBack}
            className={cn(BACK_CLASS, "mb-[14px] md:mb-[16px]")}
          >
            <CaretLeft className="size-5" weight="bold" />
            Back
          </button>

          <div className="text-left">
            <h1 className={TITLE_CLASS}>{header.title}</h1>
            <p className={cn("mt-2", SUBTITLE_CLASS)}>{header.subtitle}</p>
          </div>

          <div className="mt-[24px] md:mt-[34px] w-full">
            {step === "email" && (
              <div className="space-y-[18px]">
                <FloatingInput
                  type="email"
                  label="Recovery Email"
                  value={email}
                  onValueChange={(v) => {
                    setEmail(v);
                    if (emailError) setEmailError(undefined);
                  }}
                  errorText={emailError}
                />

                <Button
                  className="w-full h-[52px] rounded-[12px] bg-neutral-900 text-white hover:bg-neutral-900/90 mt-4"
                  onClick={onContinue}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? "Sending code..." : "Continue"}
                </Button>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-[18px]">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(v) => {
                      setOtp(v);
                      if (otpError) setOtpError(undefined);
                    }}
                    containerClassName="w-full"
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          aria-invalid={!!otpError}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {otpError ? (
                  <p className="text-left text-[14px] leading-[20px] text-error-500">
                    {otpError}
                  </p>
                ) : null}

                <div className="space-y-[20px]">
                  <Button
                    className="w-full h-[52px] rounded-[12px] bg-neutral-900 text-white hover:bg-neutral-900/90"
                    onClick={onContinue}
                    disabled={verifyingOtp}
                  >
                    {verifyingOtp ? "Verifying OTP..." : "Continue"}
                  </Button>

                  <div
                    className={cn(
                      SUBTITLE_CLASS,
                      "flex items-center justify-center gap-1"
                    )}
                  >
                    <span className="leading-[20px]">
                      Didn&apos;t Received an OTP?
                    </span>
                    <button
                      type="button"
                      onClick={onResend}
                      disabled={secondsLeft > 0 || resendingOtp}
                      className={cn(
                        "font-semibold text-[color:var(--Text-Primary,#1A1A1A)]",
                        "inline-flex items-center justify-center",
                        "leading-[20px]",
                        "cursor-pointer",
                        (secondsLeft > 0 || resendingOtp) &&
                          "cursor-not-allowed opacity-60"
                      )}
                    >
                      {resendingOtp ? (
                        "Sending..."
                      ) : secondsLeft > 0 ? (
                        <CountdownTicker
                          seconds={secondsLeft}
                          className="leading-none -translate-y-[-2px]"
                        />
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
                    if (passwordError) setPasswordError(undefined);
                  }}
                  onFocus={() => {
                    if (passwordError) setPasswordError(undefined);
                  }}
                  onValidityChange={(valid) => setPwValid(valid)}
                  state={passwordInvalid ? "error" : "default"}
                  errorText={passwordError}
                  showRules
                />

                <PasswordInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onValueChange={(v) => {
                    setConfirmPassword(v);
                    if (confirmError && confirmError !== "Passwords do not match.") {
                      setConfirmError(undefined);
                    }
                  }}
                  onFocus={() => {
                    if (confirmError && confirmError !== "Passwords do not match.") {
                      setConfirmError(undefined);
                    }
                  }}
                  state={confirmInvalid ? "error" : "default"}
                  errorText={confirmError}
                  showRules={false}
                />

                <Button
                  className="w-full h-[52px] rounded-[12px] bg-neutral-900 text-white hover:bg-neutral-900/90 mt-[6px]"
                  onClick={onContinue}
                  disabled={updatingPassword}
                >
                  {updatingPassword ? "Updating password..." : "Continue"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ForgotPassword() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "head",
      }}
    >
      <ForgotPasswordContent />
    </GoogleReCaptchaProvider>
  );
}
