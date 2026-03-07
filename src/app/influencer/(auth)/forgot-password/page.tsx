"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import logo from "@/public/logo.png";

import { FloatingInput } from "@/components/ui/floatingInput";
import { PasswordInput } from "@/components/ui/password";
import { Button, buttonVariants } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { CaretLeft } from "@phosphor-icons/react";
import { CountdownTicker } from "@/components/ui/countdown-ticker";

type Step = "email" | "otp" | "new_password";

const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const pad2 = (n: number) => String(n).padStart(2, "0");

/** ✅ Responsive typography (mobile -> desktop token) */
const TITLE_CLASS = cn(
    "text-[color:var(--Text-Primary,#1A1A1A)]",
    "[font-family:var(--Font-Family-Inter,Inter)]",
    "font-semibold",
    // mobile
    "text-[28px] leading-[36px] tracking-[-0.5px]",
    // md+ (your spec)
    "md:[font-size:var(--Font-Size-32,32px)] md:[line-height:var(--Line-Height-40,40px)] md:[letter-spacing:var(--Letter-Spacing--1,-1px)]"
);

const SUBTITLE_CLASS = cn(
    "text-[color:var(--Light-Text-Tertiary,#B8B8B8)]",
    "[font-family:var(--Font-Family-Inter,Inter)]",
    "font-medium",
    // mobile
    "text-[14px] leading-[20px] tracking-[0px]",
    // md+ (your spec)
    "md:[font-size:var(--Font-Size-16,16px)] md:[line-height:var(--Line-Height-24,24px)] md:[letter-spacing:var(--Letter-Spacing-0,0)]"
);

const BACK_CLASS = cn(
    "inline-flex items-center gap-2",
    "text-[color:var(--Light-Icon-Primary,#1A1A1A)]",
    "[font-family:var(--Font-Family-Inter,Inter)]",
    "font-medium",
    // mobile
    "text-[14px] leading-[20px]",
    // md+ (your spec)
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
        subtitle: "Enter your email and password so we can take you back to your dashboard and ongoing work.",
    },
};

export default function ForgotPassword() {
    const router = useRouter();

    const [step, setStep] = React.useState<Step>("email");

    const [email, setEmail] = React.useState("");
    const [otp, setOtp] = React.useState("");

    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");

    const [emailError, setEmailError] = React.useState<string | undefined>();
    const [otpError, setOtpError] = React.useState<string | undefined>();
    const [passwordError, setPasswordError] = React.useState<string | undefined>();
    const [confirmError, setConfirmError] = React.useState<string | undefined>();

    const [pwValid, setPwValid] = React.useState(false);

    // OTP timer
    const OTP_SECONDS = 60;
    const [secondsLeft, setSecondsLeft] = React.useState(OTP_SECONDS);

    // Reset errors + OTP timer only when step changes
    React.useEffect(() => {
        setEmailError(undefined);
        setOtpError(undefined);
        setPasswordError(undefined);
        setConfirmError(undefined);

        if (step !== "otp") return;

        setSecondsLeft(OTP_SECONDS);
        const t = setInterval(() => {
            setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
        }, 1000);

        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    const handleBack = () => {
        // ✅ Always go back to Email step from OTP + Password step
        if (step === "otp" || step === "new_password") {
            setStep("email");
            setOtp("");
            setPassword("");
            setConfirmPassword("");
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
            // TODO: call API to send OTP
            setStep("otp");
            return;
        }

        if (step === "otp") {
            if (otp.trim().length !== 6) {
                setOtpError("Please enter the 6-digit OTP.");
                return;
            }
            // TODO: call API to verify OTP
            setStep("new_password");
            return;
        }

        if (step === "new_password") {
            if (!pwValid) {
                setPasswordError("Password must include Numbers, Uppercase, and a Special character.");
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

            // TODO: call API to reset password (email + otp + password)
        }
    };

    const onResend = async () => {
        if (secondsLeft > 0) return;
        // TODO: call API to resend OTP
        setSecondsLeft(OTP_SECONDS);
    };

    const header = STEP_COPY[step];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
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
                        <Image
                            src={logo}
                            alt="CollabGlam Logo"
                            width={40}
                            height={40}
                            className="object-contain"
                            priority
                        />
                        <span className="leading-tight">
                            <span className="block text-[20px] font-bold text-tx-primary">CollabGlam</span>
                            <span className="block text-[10px] leading-[12px] text-tx-tertiary -mt-[2px]">
                                For Influencers
                            </span>
                        </span>
                    </Link>

                    <Link
                        href="/influencer/login"
                        className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "!my-0 rounded-m px-l border-[color:var(--Border-Primary,#B3B3B3)] text-neutral-600"
                        )}
                    >
                        Login as Influencer
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
                                        if (emailError) setEmailError(undefined);
                                    }}
                                    errorText={emailError}
                                />

                                <Button
                                    className="w-full h-[52px] rounded-[12px] bg-neutral-900 text-white hover:bg-neutral-900/90"
                                    onClick={onContinue}
                                >
                                    Continue
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
                                                <InputOTPSlot key={i} index={i} aria-invalid={!!otpError} />
                                            ))}
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>

                                {otpError ? (
                                    <p className="text-left text-[14px] leading-[20px] text-error-500">{otpError}</p>
                                ) : null}

                                <div className="space-y-[20px]">
                                    <Button
                                        className="w-full h-[52px] rounded-[12px] bg-neutral-900 text-white hover:bg-neutral-900/90"
                                        onClick={onContinue}
                                    >
                                        Continue
                                    </Button>

                                    <div className={cn(SUBTITLE_CLASS, "flex items-center justify-center gap-1")}>
                                        <span className="leading-[20px]">Didn&apos;t Received an OTP?</span>
                                        <button
                                            type="button"
                                            onClick={onResend}
                                            disabled={secondsLeft > 0}
                                            className={cn(
                                                "font-semibold text-[color:var(--Text-Primary,#1A1A1A)]",
                                                "inline-flex items-center justify-center",
                                                "leading-[20px]",
                                                "cursor-pointer",
                                                secondsLeft > 0 && "cursor-not-allowed opacity-60"
                                            )}
                                        >
                                            {secondsLeft > 0 ? (
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
                                        if (passwordError) setPasswordError(undefined);
                                    }}
                                    onValidityChange={(valid) => setPwValid(valid)}
                                    errorText={passwordError}
                                    showRules
                                />

                                <PasswordInput
                                    label="Confirm Password"
                                    value={confirmPassword}
                                    onValueChange={(v) => {
                                        setConfirmPassword(v);
                                        if (confirmError) setConfirmError(undefined);
                                    }}
                                    errorText={confirmError}
                                    showRules
                                />

                                <Button
                                    className="w-full h-[52px] rounded-[12px] bg-neutral-900 text-white hover:bg-neutral-900/90 mt-[6px]"
                                    onClick={onContinue}
                                >
                                    Continue
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
