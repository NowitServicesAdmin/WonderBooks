import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
    Mail,
    ShieldCheck,
    ArrowLeft,
    ArrowRight,
    User,
    Send,
    // Heart,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { sendOtp, verifyOtp } from "../../services/authService";

import heroIllustrationImg from "../../assets/wonder-books/hero-illustration.png";
import storiesDoodleImg from "../../assets/wonder-books/stories-doodle.png";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;



const GoogleIcon = (props) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
        <path
            fill="#4285F4"
            d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
        />
        <path
            fill="#34A853"
            d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A12 12 0 0 0 12 24Z"
        />
        <path
            fill="#FBBC05"
            d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z"
        />
        <path
            fill="#EA4335"
            d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0 7.31 0 3.26 2.69 1.26 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
        />
    </svg>
);

const AppleIcon = (props) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="#111" {...props}>
        <path d="M16.36 1.02c.1 1.03-.3 2.05-.93 2.8-.65.76-1.7 1.35-2.72 1.27-.12-1 .37-2.05 1-2.75.7-.79 1.9-1.38 2.65-1.32ZM19.9 17.3c-.34.79-.75 1.53-1.24 2.24-.68.98-1.24 1.66-1.68 2.03-.68.63-1.4.95-2.18.97-.56.01-1.23-.16-2.01-.5-.79-.34-1.51-.5-2.18-.5-.7 0-1.44.16-2.24.5-.8.34-1.44.52-1.94.54-.75.03-1.49-.3-2.2-.99-.47-.42-1.06-1.13-1.77-2.15-.76-1.08-1.39-2.34-1.88-3.77-.53-1.55-.8-3.05-.8-4.5 0-1.66.36-3.09 1.07-4.29a6.3 6.3 0 0 1 2.24-2.29 6 6 0 0 1 3.03-.86c.6 0 1.38.19 2.36.55.97.37 1.6.55 1.87.55.2 0 .9-.21 2.08-.63 1.13-.4 2.08-.56 2.86-.5 2.12.17 3.71 1.01 4.77 2.52-1.9 1.15-2.84 2.76-2.82 4.84.02 1.62.6 2.97 1.75 4.04.52.5 1.1.88 1.75 1.16-.14.41-.29.8-.45 1.19Z" />
    </svg>
);

export const Auth = () => {
    const navigate = useNavigate();
    const { isAuthenticated, loading, login } = useAuth();

    const [mode, setMode] = useState("signup"); // "signup" | "login"
    const [step, setStep] = useState("details"); // "details" | "otp"
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [devOtp, setDevOtp] = useState(null);

    const otpRefs = useRef([]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    if (!loading && isAuthenticated) {
        return <Navigate to="/home" replace />;
    }

    const resetOtp = () => {
        setOtpDigits(Array(OTP_LENGTH).fill(""));
    };

    const handleSendOtp = async (e) => {
        e?.preventDefault();
        setError("");

        if (!email.trim()) {
            setError("Please enter your email address");
            return;
        }

        if (mode === "signup" && !name.trim()) {
            setError("Please tell us your name");
            return;
        }

        setSubmitting(true);
        try {
            const data = await sendOtp({ email: email.trim(), name: name.trim(), mode,});
            setDevOtp(data.devOtp || null);
            setStep("otp");
            setCooldown(RESEND_COOLDOWN);
            resetOtp();
            setTimeout(() => otpRefs.current[0]?.focus(), 50);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Couldn't send the code. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleOtpChange = (index, value) => {
        const digit = value.replace(/[^0-9]/g, "").slice(-1);
        const next = [...otpDigits];
        next[index] = digit;
        setOtpDigits(next);

        if (digit && index < OTP_LENGTH - 1) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
        if (!pasted) return;
        e.preventDefault();
        const next = Array(OTP_LENGTH).fill("");
        pasted
            .slice(0, OTP_LENGTH)
            .split("")
            .forEach((char, i) => (next[i] = char));
        setOtpDigits(next);
        const lastFilled = Math.min(pasted.length, OTP_LENGTH) - 1;
        otpRefs.current[lastFilled]?.focus();
    };

    const handleVerify = async (e) => {
        e?.preventDefault();
        setError("");

        const otp = otpDigits.join("");
        if (otp.length !== OTP_LENGTH) {
            setError("Please enter the full 6-digit code");
            return;
        }

        setSubmitting(true);
        try {
            const data = await verifyOtp({ email: email.trim(), otp, name: name.trim(), mode, });
            login({ token: data.token, user: data.user });
            navigate(data.user?.role === "super admin" ? "/superadmin" : "/home", { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "That code didn't work. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        setError("");
        setSubmitting(true);
        try {
            const data = await sendOtp({ email: email.trim(), name: name.trim(), mode, });
            setDevOtp(data.devOtp || null);
            setCooldown(RESEND_COOLDOWN);
            resetOtp();
            otpRefs.current[0]?.focus();
        } catch (err) {
            setError(
                err.response?.data?.message || "Couldn't resend the code. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#f4f1ff] p-3 sm:p-4 md:p-6">
            <div className="relative w-full max-w-6xl">
                {/* decorative blobs */}
                <div className="pointer-events-none absolute -right-10 -top-16 hidden h-56 w-56 rounded-full bg-[#e3d9ff] opacity-70 blur-2xl sm:block" />

                <div className="relative grid w-full overflow-hidden rounded-[28px] border border-[#ebe5ff] bg-white shadow-[0_10px_40px_rgba(84,38,199,0.12)] md:grid-cols-[58%_42%]">
                    {/* Brand / illustration panel */}
<div
    className="relative hidden min-h-145 flex-col overflow-hidden bg-white bg-cover bg-bottom-right bg-no-repeat p-7 text-[#241748] md:flex lg:min-h-145 lg:p-8"
    style={{
        backgroundImage: `url(${heroIllustrationImg})`,
    }}
>
    {/* Brand */}
    <div className="relative z-20 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0eaff] text-lg">
            ⭐
        </div>
        <span className="text-[16px] font-extrabold text-[#392078]">
            Wonder Books
        </span>
    </div>

    {/* Main text */}
    <div className="relative z-20 mt-8 w-[52%]">
        <p className="text-[10px] font-bold tracking-[0.2em] text-[#9d94c4]">
            YOUR STORY AWAITS
        </p>

        <h1 className="mt-2 text-[24px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#241748]">
            Turn imagination into{" "}
            <span className="text-[#5426c7]">real stories</span> ✨
        </h1>

        <p className="mt-3 text-[12.5px] leading-[1.45] text-[#736b8f]">
            Create your own storybooks, explore amazing stories, or find
            your next favorite book.
        </p>
    </div>

    {/* Feature list */}
    <div className="relative z-20 mt-8 flex flex-col gap-3">
        {/* Create */}
        <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0eaff] text-[#5426c7]">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                    <path d="M8 6h8" />
                    <path d="M8 10h6" />
                </svg>
            </div>

            <div>
                <p className="text-[11.5px] font-bold text-[#392078]">
                    Create
                </p>
                <p className="text-[9px] leading-[1.2] text-[#8b84a0]">
                    Bring your ideas to life
                </p>
            </div>
        </div>

        {/* Read */}
        <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0eaff] text-[#5426c7]">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 20V10" />
                    <path d="M18 20V4" />
                    <path d="M6 20v-6" />
                    <path d="M3 20h18" />
                </svg>
            </div>

            <div>
                <p className="text-[11.5px] font-bold text-[#392078]">
                    Read
                </p>
                <p className="text-[9px] leading-[1.2] text-[#8b84a0]">
                    Explore a world of stories
                </p>
            </div>
        </div>

        {/* Buy */}
        <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0eaff] text-[#5426c7]">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="9" cy="20" r="1" />
                    <circle cx="20" cy="20" r="1" />
                    <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 6H6" />
                </svg>
            </div>

            <div>
                <p className="text-[11.5px] font-bold text-[#392078]">
                    Buy
                </p>
                <p className="max-w-31.25 text-[9px] leading-[1.2] text-[#8b84a0]">
                    Discover and own your favorite books
                </p>
            </div>
        </div>
    </div>

    {/* Quote — pinned to the bottom via mt-auto instead of absolute positioning */}
    <div className="relative z-20 mt-auto w-35 pt-6">
        <p className="text-[11px] font-medium italic leading-[1.35] text-[#7c5ce0]">
            "Good stories make brighter tomorrows"
        </p>
        <div className="mt-1 ml-9 text-[18px] text-[#7c5ce0]">♡</div>
    </div>
</div>

                    {/* Form panel */}
                    <div className="relative flex flex-col justify-center p-6 sm:p-8 md:p-10">
                        <img
                            src={storiesDoodleImg}
                            alt="Stories for a brighter tomorrow"
                            className="pointer-events-none absolute -top-1 right-4 hidden w-37.5 select-none md:block lg:w-42.5"
                        />

                        {step === "details" ? (
                            <>
                                <h2 className="text-[24px] font-extrabold text-[#241748]">
                                    {mode === "signup" ? "Create your account" : "Welcome back"}
                                </h2>
                                <p className="mt-1 text-[14px] text-[#8b84a0]">
                                    {mode === "signup"
                                        ? "Join Wonder Books and start your storytelling journey today."
                                        : "Enter your email and we'll send you a login code."}
                                </p>

                                <form onSubmit={handleSendOtp} className="mt-7 flex flex-col gap-4">
                                    {mode === "signup" && (
                                        <div>
                                            <label className="mb-1.5 block text-[13px] font-semibold text-[#4a4362]">
                                                Your name
                                            </label>
                                            <div className="flex items-center gap-2 rounded-2xl border border-[#ece5ff] bg-white px-4 py-3 transition focus-within:border-[#5426c7] focus-within:shadow-[0_0_0_3px_rgba(84,38,199,0.1)]">
                                                <User size={18} className="shrink-0 text-[#918aa5]" />
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="e.g. John"
                                                    className="w-full bg-transparent text-[15px] text-[#30215c] outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="mb-1.5 block text-[13px] font-semibold text-[#4a4362]">
                                            Email address
                                        </label>
                                        <div className="flex items-center gap-2 rounded-2xl border border-[#ece5ff] bg-white px-4 py-3 transition focus-within:border-[#5426c7] focus-within:shadow-[0_0_0_3px_rgba(84,38,199,0.1)]">
                                            <Mail size={18} className="shrink-0 text-[#918aa5]" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                className="w-full bg-transparent text-[15px] text-[#30215c] outline-none"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <p className="text-[13px] font-medium text-[#e94b4b]">
                                            {error}
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="mt-1 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#5426c7] text-[15px] font-bold text-white shadow-[0_5px_12px_rgba(84,38,199,0.25)] transition hover:bg-[#4a20ad] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Send size={17} className="rotate-45" />
                                        {submitting ? "Sending code..." : "Send verification code"}
                                        {!submitting && <ArrowRight size={17} />}
                                    </button>
                                </form>

                                <div className="my-6 flex items-center gap-3">
                                    <div className="h-px flex-1 bg-[#ece5ff]" />
                                    <span className="text-[12px] text-[#a49bc0]">
                                        or continue with
                                    </span>
                                    <div className="h-px flex-1 bg-[#ece5ff]" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#ece5ff] bg-white text-[13.5px] font-semibold text-[#4a4362] transition hover:bg-[#faf9ff]"
                                    >
                                        <GoogleIcon />
                                        Google
                                    </button>
                                    <button
                                        type="button"
                                        className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#ece5ff] bg-white text-[13.5px] font-semibold text-[#4a4362] transition hover:bg-[#faf9ff]"
                                    >
                                        <AppleIcon />
                                        Apple
                                    </button>
                                </div>

                                <p className="mt-6 text-center text-[13px] text-[#8b84a0]">
                                    {mode === "signup" ? (
                                        <>
                                            Already have an account?{" "}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMode("login");
                                                    setError("");
                                                }}
                                                className="font-semibold text-[#5426c7] hover:underline"
                                            >
                                                Log in
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            New to Wonder Books?{" "}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMode("signup");
                                                    setError("");
                                                }}
                                                className="font-semibold text-[#5426c7] hover:underline"
                                            >
                                                Create an account
                                            </button>
                                        </>
                                    )}
                                </p>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep("details");
                                        setError("");
                                    }}
                                    className="mb-5 flex w-fit items-center gap-1.5 text-[13px] font-semibold text-[#918aa5] hover:text-[#5426c7]"
                                >
                                    <ArrowLeft size={15} />
                                    Back
                                </button>

                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0eaff] text-[#5426c7]">
                                    <ShieldCheck size={22} />
                                </div>

                                <h2 className="text-[24px] font-extrabold text-[#241748]">
                                    Enter your code
                                </h2>
                                <p className="mt-1 text-[14px] text-[#8b84a0]">
                                    We sent a 6-digit code to{" "}
                                    <span className="font-semibold text-[#30215c]">{email}</span>
                                </p>

                                {devOtp && (
                                    <p className="mt-2 rounded-xl bg-[#fff8e1] px-3 py-2 text-[12px] font-medium text-[#8a6d1a]">
                                        Dev mode: Email isn't configured yet, so your code is{" "}
                                        <span className="font-bold">{devOtp}</span>
                                    </p>
                                )}

                                <form onSubmit={handleVerify} className="mt-6 flex flex-col gap-5">
                                    <div
                                        className="flex justify-between gap-2"
                                        onPaste={handleOtpPaste}
                                    >
                                        {otpDigits.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => (otpRefs.current[index] = el)}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                className="h-12 w-full max-w-11 rounded-2xl border border-[#ece5ff] bg-white text-center text-[18px] font-bold text-[#30215c] outline-none transition focus:border-[#5426c7] focus:shadow-[0_0_0_3px_rgba(84,38,199,0.1)] sm:h-14 sm:max-w-12 sm:text-[20px]"
                                            />
                                        ))}
                                    </div>

                                    {error && (
                                        <p className="text-[13px] font-medium text-[#e94b4b]">
                                            {error}
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex h-12 items-center justify-center rounded-2xl bg-[#5426c7] text-[15px] font-bold text-white shadow-[0_5px_12px_rgba(84,38,199,0.25)] transition hover:bg-[#4a20ad] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {submitting ? "Verifying..." : "Verify & continue"}
                                    </button>
                                </form>

                                <p className="mt-6 text-center text-[13px] text-[#8b84a0]">
                                    Didn't get a code?{" "}
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={cooldown > 0 || submitting}
                                        className="font-semibold text-[#5426c7] hover:underline disabled:cursor-not-allowed disabled:text-[#b7afd1] disabled:no-underline"
                                    >
                                        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                                    </button>
                                </p>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};