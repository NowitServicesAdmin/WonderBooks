import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import {
    Mail,
    ShieldCheck,
    ArrowLeft,
    ArrowRight,
    User,
    Send,
    Phone,
    Check,
} from "lucide-react";
import { FaApple } from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import { sendOtp, verifyOtp, completeSignup, googleAuth } from "../../services/authService";

import heroIllustrationImg from "../../assets/wonder-books/hero-illustration.png";
import storiesDoodleImg from "../../assets/wonder-books/stories-doodle.png";
import wonderBooksLogo from "../../assets/wonder-books/wonderbook-logo.png";

// ---------------------------------------------------------------------------
// Carousel images (left side).
// Drop 3 images into  src/assets/wonder-books/  named:
//     auth-slide-1.png   auth-slide-2.png   auth-slide-3.png   (.jpg / .webp also work)
// They are picked up automatically. Until they exist, hero-illustration.png is used.
// ---------------------------------------------------------------------------
const slideModules = import.meta.glob(
    "../../assets/wonder-books/auth-slide-*.{png,jpg,jpeg,webp}",
    { eager: true, import: "default" }
);
const customSlideImages = Object.keys(slideModules)
    .sort()
    .map((key) => slideModules[key]);
const slideImages = (customSlideImages.length ? customSlideImages : [heroIllustrationImg]).slice(0, 3);

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;
const SLIDE_MS = 3000; // auto-advance every 3 seconds

// floating sparkles: [top%, left%, size(px), delay(s)]
const PAGE_SPARKLES = [
    [8, 4, 14, 0], [18, 95, 18, 1.2], [78, 3, 16, 0.6],
    [90, 92, 12, 1.8], [4, 48, 12, 2.4], [93, 40, 14, 0.9],
];

const AUTH_STYLES = `
@keyframes wbAuthFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes wbAuthTwinkle{0%,100%{opacity:.25;transform:scale(.75) rotate(0deg)}50%{opacity:1;transform:scale(1.15) rotate(18deg)}}
@keyframes wbAuthFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes wbAuthPop{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
@keyframes wbAuthProgress{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.wb-auth-float{animation:wbAuthFloat 7s ease-in-out infinite}
.wb-auth-twinkle{animation:wbAuthTwinkle 3.2s ease-in-out infinite}
.wb-auth-fade-up{animation:wbAuthFadeUp .55s cubic-bezier(.2,.7,.2,1) both}
.wb-auth-pop{animation:wbAuthPop .7s cubic-bezier(.2,.7,.2,1) both}
.wb-auth-progress{transform-origin:left center;animation:wbAuthProgress linear forwards}
@media (prefers-reduced-motion:reduce){
  .wb-auth-float,.wb-auth-twinkle,.wb-auth-fade-up,.wb-auth-pop,.wb-auth-progress{animation:none!important}
}
`;

// shared, height-aware sizing so the whole form always fits the viewport without scrolling
const LABEL = "mb-1 block text-[12.5px] font-semibold text-[#4a4362]";
const FIELD =
    "flex items-center gap-2 rounded-2xl border border-[#ece5ff] bg-white px-4 py-[clamp(0.4rem,1.4vh,0.75rem)] transition focus-within:border-[#5426c7] focus-within:shadow-[0_0_0_3px_rgba(84,38,199,0.12)]";
const INPUT = "w-full min-w-0 bg-transparent text-[15px] text-[#30215c] outline-none placeholder:text-[#b9b2d1]";
const PRIMARY_BTN =
    "flex h-[clamp(2.6rem,6vh,3rem)] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5426c7] to-[#7a4ce0] text-[15px] font-bold text-white shadow-[0_8px_18px_rgba(84,38,199,0.28)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";
const SOCIAL_BTN =
    "flex h-[clamp(2.25rem,5.2vh,2.75rem)] items-center justify-center gap-2 rounded-2xl border border-[#ece5ff] bg-white text-[13.5px] font-semibold text-[#4a4362] transition hover:bg-[#faf9ff] disabled:cursor-not-allowed disabled:opacity-60";
const OTP_BOX =
    "h-[clamp(2.5rem,6.5vh,3.5rem)] min-w-0 max-w-12 flex-1 rounded-2xl border border-[#ece5ff] bg-white text-center text-[18px] font-bold text-[#30215c] outline-none transition focus:border-[#5426c7] focus:shadow-[0_0_0_3px_rgba(84,38,199,0.12)] sm:text-[20px]";

const OTP_BOX_COMPACT =
    "h-[clamp(2.1rem,5vh,2.6rem)] min-w-0 max-w-11 flex-1 rounded-xl border border-[#e4dbff] bg-white text-center text-[16px] font-bold text-[#30215c] outline-none transition focus:border-[#5426c7] focus:shadow-[0_0_0_3px_rgba(84,38,199,0.12)] disabled:opacity-60";

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emptyDigits = () => Array(OTP_LENGTH).fill("");
const emptyChannel = () => ({
    digits: emptyDigits(),
    sent: false, // OTP has been sent, waiting for the code
    verified: false,
    token: "", // proof from the server that this email / mobile is verified
    cooldown: 0,
    busy: false,
    devOtp: null,
    error: "",
});

// 6 boxes. value = array of 6 single characters ("" when empty).
const OtpInput = ({ value, onChange, autoFocus = false, disabled = false, compact = false }) => {
    const refs = useRef([]);

    useEffect(() => {
        if (autoFocus) refs.current[0]?.focus();
    }, [autoFocus]);

    const handleChange = (index, raw) => {
        const digit = raw.replace(/[^0-9]/g, "").slice(-1);
        const next = [...value];
        next[index] = digit;
        onChange(next);
        if (digit && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !value[index] && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
        if (!pasted) return;
        e.preventDefault();
        const next = emptyDigits();
        pasted.slice(0, OTP_LENGTH).split("").forEach((char, i) => (next[i] = char));
        onChange(next);
        refs.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
    };

    return (
        <div className="flex justify-between gap-1.5 sm:gap-2" onPaste={handlePaste}>
            {value.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => (refs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    disabled={disabled}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={compact ? OTP_BOX_COMPACT : OTP_BOX}
                />
            ))}
        </div>
    );
};

const Sparkle = ({ top, left, size, delay }) => (
    <span
        aria-hidden="true"
        className="wb-auth-twinkle pointer-events-none absolute select-none text-[#f5b942]"
        style={{ top: `${top}%`, left: `${left}%`, fontSize: size, animationDelay: `${delay}s` }}
    >
        ✦
    </span>
);

export const Auth = () => {
    const navigate = useNavigate();
    const { isAuthenticated, loading, login } = useAuth();

    const [mode, setMode] = useState("signup"); // "signup" | "login"
    const [step, setStep] = useState("details"); // login only: "details" | "otp"
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState(""); // 10 digits, +91 is added by the UI/back end
    const [identifier, setIdentifier] = useState(""); // login: email OR mobile
    const [ch, setCh] = useState({ email: emptyChannel(), phone: emptyChannel() }); // signup: per-field OTP state
    const [loginDigits, setLoginDigits] = useState(emptyDigits);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [cooldown, setCooldown] = useState(0); // login resend
    const [devOtp, setDevOtp] = useState(null); // login dev code (non-production only)
    const [activeSlide, setActiveSlide] = useState(0);

    const isEmailIdentifier = identifier.includes("@");
    const loginTarget = isEmailIdentifier
        ? identifier.trim()
        : `+91 ${identifier.replace(/\D/g, "").slice(-10)}`;

    const anyCooldown = cooldown > 0 || ch.email.cooldown > 0 || ch.phone.cooldown > 0;
    const otpOpen = ch.email.sent || ch.phone.sent;

    const handleGoogleSuccess = async (tokenResponse) => {
        setError("");
        setSubmitting(true);
        try {
            const data = await googleAuth({ accessToken: tokenResponse.access_token });
            login({ token: data.token, user: data.user });
            navigate(data.user?.role === "super admin" ? "/superadmin" : "/home", { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Couldn't sign in with Google. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => setError("Couldn't sign in with Google. Please try again."),
    });

    // one timer ticks every resend countdown (login + email + mobile)
    useEffect(() => {
        if (!anyCooldown) return;
        const timer = setInterval(() => {
            setCooldown((c) => Math.max(0, c - 1));
            setCh((p) => ({
                email: { ...p.email, cooldown: Math.max(0, p.email.cooldown - 1) },
                phone: { ...p.phone, cooldown: Math.max(0, p.phone.cooldown - 1) },
            }));
        }, 1000);
        return () => clearInterval(timer);
    }, [anyCooldown]);

    // carousel: auto-advance; clicking changes activeSlide, which restarts this 3s timer
    useEffect(() => {
        if (slideImages.length < 2) return;
        const timer = setTimeout(
            () => setActiveSlide((i) => (i + 1) % slideImages.length),
            SLIDE_MS
        );
        return () => clearTimeout(timer);
    }, [activeSlide]);

    if (!loading && isAuthenticated) {
        return <Navigate to="/home" replace />;
    }

    const goNextSlide = () => setActiveSlide((i) => (i + 1) % slideImages.length);

    /* ---------------- signup: email and mobile are verified separately ---------------- */

    const patchChannel = (channel, patch) =>
        setCh((p) => ({ ...p, [channel]: { ...p[channel], ...patch } }));

    const resetChannel = (channel) => patchChannel(channel, emptyChannel());

    const channelTarget = (channel) =>
        channel === "email" ? { email: email.trim() } : { phone };

    const handleEmailChange = (value) => {
        setEmail(value);
        if (ch.email.sent) resetChannel("email");
    };

    const handlePhoneChange = (value) => {
        setPhone(value.replace(/\D/g, "").slice(0, 10));
        if (ch.phone.sent) resetChannel("phone");
    };

    const handleSendChannelOtp = async (channel) => {
        setError("");

        if (channel === "email" && !EMAIL_RE.test(email.trim())) {
            return patchChannel(channel, { error: "Please enter a valid email address" });
        }
        if (channel === "phone" && !/^[6-9]\d{9}$/.test(phone)) {
            return patchChannel(channel, { error: "Please enter a valid 10-digit mobile number" });
        }

        patchChannel(channel, { busy: true, error: "" });
        try {
            const data = await sendOtp({ mode: "signup", channel, ...channelTarget(channel) });
            patchChannel(channel, {
                busy: false,
                sent: true,
                cooldown: RESEND_COOLDOWN,
                digits: emptyDigits(),
                devOtp: data.devOtp?.[channel] || null,
            });
        } catch (err) {
            patchChannel(channel, {
                busy: false,
                error: err.response?.data?.message || "Couldn't send the code. Please try again.",
            });
        }
    };

    const handleVerifyChannel = async (channel, code) => {
        patchChannel(channel, { busy: true, error: "" });
        try {
            const data = await verifyOtp({
                mode: "signup",
                channel,
                ...channelTarget(channel),
                otp: code,
            });
            patchChannel(channel, {
                busy: false,
                verified: true,
                sent: false,
                token: data.verificationToken,
                cooldown: 0,
                digits: emptyDigits(),
                devOtp: null,
                error: "",
            });
        } catch (err) {
            patchChannel(channel, {
                busy: false,
                error: err.response?.data?.message || "That code didn't work. Please try again.",
            });
        }
    };

    // verifies automatically as soon as the 6th digit is entered
    const handleChannelDigits = (channel, next) => {
        patchChannel(channel, { digits: next, error: "" });
        const code = next.join("");
        if (code.length === OTP_LENGTH && !ch[channel].busy) {
            handleVerifyChannel(channel, code);
        }
    };

    const handleCreateAccount = async (e) => {
        e?.preventDefault();
        setError("");

        if (!name.trim()) return setError("Please tell us your name");
        if (!ch.email.verified) return setError("Please verify your email address");
        if (!ch.phone.verified) return setError("Please verify your mobile number");

        setSubmitting(true);
        try {
            const data = await completeSignup({
                name: name.trim(),
                email: email.trim(),
                phone,
                emailToken: ch.email.token,
                phoneToken: ch.phone.token,
            });
            login({ token: data.token, user: data.user });
            navigate(data.user?.role === "super admin" ? "/superadmin" : "/home", { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Couldn't create your account. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* ---------------- login: email OR mobile, one code ---------------- */

    const handleSendLoginOtp = async (e) => {
        e?.preventDefault();
        setError("");

        if (!identifier.trim()) {
            return setError("Please enter your email or mobile number");
        }

        setSubmitting(true);
        try {
            const data = await sendOtp({ mode: "login", identifier: identifier.trim() });
            setDevOtp(data.devOtp ? Object.values(data.devOtp)[0] : null);
            setStep("otp");
            setCooldown(RESEND_COOLDOWN);
            setLoginDigits(emptyDigits());
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Couldn't send the code. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleLoginVerify = async (e) => {
        e?.preventDefault();
        setError("");

        const otp = loginDigits.join("");
        if (otp.length !== OTP_LENGTH) {
            return setError("Please enter the full 6-digit code");
        }

        setSubmitting(true);
        try {
            const data = await verifyOtp({ mode: "login", identifier: identifier.trim(), otp });
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

    const handleLoginResend = async () => {
        if (cooldown > 0) return;
        setError("");
        setSubmitting(true);
        try {
            const data = await sendOtp({ mode: "login", identifier: identifier.trim() });
            setDevOtp(data.devOtp ? Object.values(data.devOtp)[0] : null);
            setCooldown(RESEND_COOLDOWN);
            setLoginDigits(emptyDigits());
        } catch (err) {
            setError(
                err.response?.data?.message || "Couldn't resend the code. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* ---------------- small render helpers for the signup fields ---------------- */

    const renderVerifyAction = (channel) => {
        const c = ch[channel];

        if (c.verified) {
            return (
                <span className="flex shrink-0 items-center gap-2">
                    <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-600">
                        <Check size={15} strokeWidth={3} />
                        Verified
                    </span>
                    <button
                        type="button"
                        onClick={() => resetChannel(channel)}
                        className="text-[12px] font-semibold text-[#918aa5] hover:text-[#5426c7] hover:underline"
                    >
                        Change
                    </button>
                </span>
            );
        }

        const label =
            c.busy && !c.sent
                ? "Sending..."
                : c.sent
                    ? c.cooldown > 0
                        ? `Resend ${c.cooldown}s`
                        : "Resend"
                    : "Send OTP";

        return (
            <button
                type="button"
                onClick={() => handleSendChannelOtp(channel)}
                disabled={c.busy || c.cooldown > 0}
                className="shrink-0 rounded-xl bg-[#f0eaff] px-3 py-1.5 text-[12px] font-bold text-[#5426c7] transition hover:bg-[#e6dcff] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {label}
            </button>
        );
    };

    const renderChannelFooter = (channel) => {
        const c = ch[channel];

        if (c.sent) {
            return (
                <div className="wb-auth-fade-up mt-1.5 rounded-2xl bg-[#f7f4ff] px-2.5 py-2">
                    <OtpInput
                        compact
                        autoFocus
                        disabled={c.busy}
                        value={c.digits}
                        onChange={(next) => handleChannelDigits(channel, next)}
                    />
                    <p
                        className={`mt-1 text-center text-[11.5px] leading-tight ${c.error ? "font-medium text-[#e94b4b]" : "text-[#8b84a0]"
                            }`}
                    >
                        {c.busy
                            ? "Verifying..."
                            : c.error ||
                            `Enter the 6-digit code we sent${c.devOtp ? ` (dev: ${c.devOtp})` : ""}`}
                    </p>
                </div>
            );
        }

        return c.error ? (
            <p className="mt-1 text-[12px] font-medium leading-tight text-[#e94b4b]">{c.error}</p>
        ) : null;
    };

    const fieldClass = (channel) =>
        `${FIELD} ${ch[channel].verified ? "!border-emerald-300 bg-emerald-50/50" : ""}`;

    const canCreate = ch.email.verified && ch.phone.verified && name.trim() && !submitting;

    return (
        <div className="wb-keep-light relative flex h-dvh w-full items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top_left,#ffffff_0%,#f4f1ff_45%,#e9e0ff_100%)] p-0">
            <style>{AUTH_STYLES}</style>

            {/* page-level magic: soft glows + floating sparkles */}
            <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[#dccfff] opacity-60 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[#ffe6f2] opacity-70 blur-3xl" />
            {PAGE_SPARKLES.map(([top, left, size, delay], i) => (
                <Sparkle key={i} top={top} left={left} size={size} delay={delay} />
            ))}

            <div className="wb-auth-pop isolate relative grid h-full min-h-0 w-full max-w-none grid-cols-1 overflow-hidden rounded-none border-0 bg-white shadow-none md:grid-cols-[50%_50%]">
                {/* ------------------ Left: image carousel (click or wait 3s) ------------------ */}

                {/* ------------------ Responsive image carousel ------------------ */}
                <aside
                    onClick={goNextSlide}
                    className="absolute inset-0 z-0 flex min-h-0 flex-col cursor-pointer overflow-hidden bg-[#efe9ff] md:relative md:inset-auto md:z-auto md:col-span-1"
                >
                    {/* Moving carousel images */}
                    <div className="absolute inset-0 flex h-full w-full overflow-hidden md:relative md:flex-1 md:min-h-0">
                        <div
                            className="flex h-full w-full transition-transform duration-700 ease-in-out"
                            style={{
                                transform: `translateX(-${activeSlide * 100}%)`,
                            }}
                        >
                            {slideImages.map((src, i) => (
                                <img
                                    key={i}
                                    src={src}
                                    alt={`Wonder Books illustration ${i + 1}`}
                                    draggable={false}
                                    className="h-full w-full shrink-0 select-none object-cover object-center"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Carousel navigation dots */}
                    {slideImages.length > 1 && (
                        <div className="absolute bottom-5 left-0 z-20 flex w-full items-center justify-center gap-2 bg-transparent">
                            {slideImages.map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    aria-label={`Go to slide ${index + 1}`}
                                    aria-current={activeSlide === index ? "true" : undefined}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveSlide(index);
                                    }}
                                    className={`h-2.5 rounded-full transition-all duration-300 ${activeSlide === index
                                        ? "w-8 bg-white shadow-md"
                                        : "w-2.5 bg-white/60 hover:bg-white"
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </aside>

                {/* ------------------ Right: form ------------------ */}

                <section className="relative z-10 mx-auto flex min-h-0 w-[calc(100%-1.5rem)] max-w-[34rem] flex-col self-center overflow-y-auto rounded-[26px] border border-white/60 bg-white/30 px-5 py-6 shadow-[0_12px_45px_rgba(65,35,120,0.18)] backdrop-blur-2xl scrollbar-hide md:mx-0 md:h-full md:w-full md:max-w-none md:items-center md:justify-center md:rounded-none md:border-0 md:bg-gradient-to-b md:from-white md:to-[#faf8ff] md:px-8 md:shadow-none md:backdrop-blur-none">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#efe8ff] blur-2xl" />

                    {/* Top row: Wonder Books logo + Stories doodle */}
                    <div className="relative flex w-full shrink-0 items-center justify-between gap-3 mb-6">

                        {/* Brand logo and name */}
                        <div className="flex min-w-0 items-center gap-3">

                            <img
                                src={wonderBooksLogo}
                                alt="Wonder Books logo"
                                className="h-10 w-10 shrink-0 object-contain sm:h-14 sm:w-14"
                            />

                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-[16px] font-extrabold tracking-tight text-[#392078] sm:text-lg">
                                    Wonder Books
                                </span>

                                <span className="text-[10px] font-medium tracking-wide text-[#9185b2] sm:text-xs">
                                    Imagine. Explore. Discover.
                                </span>
                            </div>

                        </div>

                        {/* Existing Stories doodle */}
                        <img
                            src={storiesDoodleImg}
                            alt="Stories for a brighter tomorrow"
                            className={`pointer-events-none ml-auto h-[clamp(5rem,8vh,6rem)] w-auto shrink-0 select-none object-contain mix-blend-multiply [@media(max-height:480px)]:hidden ${otpOpen ? "hidden" : "hidden sm:block"}`}
                        />

                    </div>

                    <div
                        key={`${mode}-${step}`}
                        className="wb-auth-fade-up relative my-auto flex min-w-0 flex-col py-1"
                        style={{
                            width: "min(100%, 28rem)",
                            maxWidth: "28rem",
                            marginInline: "auto",
                            flexShrink: 0,
                        }}
                    >
                        {step === "details" ? (
                            <>
                                <h2 className={`text-[clamp(1.35rem,3.6vh,1.75rem)] font-extrabold leading-tight text-[#241748] ${otpOpen ? "[@media(max-height:480px)]:hidden" : ""}`}>
                                    {mode === "signup" ? "Create your account" : "Welcome back"}
                                </h2>
                                <p className={`mt-1 text-[13.5px] leading-snug text-[#8b84a0] [@media(max-height:480px)]:hidden ${otpOpen ? "hidden" : ""}`}>
                                    {mode === "signup"
                                        ? "Verify your email and mobile number to get started."
                                        : "Enter your email or mobile number and we'll send you a login code."}
                                </p>

                                {mode === "signup" ? (
                                    <form
                                        onSubmit={handleCreateAccount}
                                        className="mt-[clamp(0.75rem,2.2vh,1.5rem)] flex flex-col gap-[clamp(0.5rem,1.6vh,1rem)]"
                                    >
                                        <div>
                                            <label className={LABEL}>Your name</label>
                                            <div className={FIELD}>
                                                <User size={18} className="shrink-0 text-[#918aa5]" />
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="e.g. John"
                                                    className={INPUT}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className={LABEL}>Email address</label>
                                            <div className={fieldClass("email")}>
                                                <Mail size={18} className="shrink-0 text-[#918aa5]" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    readOnly={ch.email.verified}
                                                    onChange={(e) => handleEmailChange(e.target.value)}
                                                    placeholder="you@example.com"
                                                    className={INPUT}
                                                />
                                                {renderVerifyAction("email")}
                                            </div>
                                            {renderChannelFooter("email")}
                                        </div>

                                        <div>
                                            <label className={LABEL}>Mobile number</label>
                                            <div className={fieldClass("phone")}>
                                                <Phone size={18} className="shrink-0 text-[#918aa5]" />
                                                <span className="shrink-0 text-[15px] font-semibold text-[#30215c]">
                                                    +91
                                                </span>
                                                <input
                                                    type="tel"
                                                    inputMode="numeric"
                                                    maxLength={10}
                                                    value={phone}
                                                    readOnly={ch.phone.verified}
                                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                                    placeholder="98765 43210"
                                                    className={INPUT}
                                                />
                                                {renderVerifyAction("phone")}
                                            </div>
                                            {renderChannelFooter("phone")}
                                        </div>

                                        {error && (
                                            <p className="text-[13px] font-medium leading-snug text-[#e94b4b]">
                                                {error}
                                            </p>
                                        )}

                                        <button type="submit" disabled={!canCreate} className={PRIMARY_BTN}>
                                            {submitting ? "Creating account..." : "Create account"}
                                            {!submitting && <ArrowRight size={17} />}
                                        </button>
                                    </form>
                                ) : (
                                    <form
                                        onSubmit={handleSendLoginOtp}
                                        className="mt-[clamp(0.75rem,2.2vh,1.5rem)] flex flex-col gap-[clamp(0.5rem,1.6vh,1rem)]"
                                    >
                                        <div>
                                            <label className={LABEL}>Email or mobile number</label>
                                            <div className={FIELD}>
                                                <Mail size={18} className="shrink-0 text-[#918aa5]" />
                                                <input
                                                    type="text"
                                                    inputMode="email"
                                                    autoComplete="username"
                                                    value={identifier}
                                                    onChange={(e) => setIdentifier(e.target.value)}
                                                    placeholder="Email or mobile number"
                                                    className={INPUT}
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <p className="text-[13px] font-medium leading-snug text-[#e94b4b]">
                                                {error}
                                            </p>
                                        )}

                                        <button type="submit" disabled={submitting} className={PRIMARY_BTN}>
                                            <Send size={17} className="rotate-45" />
                                            {submitting ? "Sending code..." : "Send login code"}
                                            {!submitting && <ArrowRight size={17} />}
                                        </button>
                                    </form>
                                )}

                                {/* social sign-in is tucked away while a code box is open, so nothing ever needs scrolling */}
                                {!otpOpen && (
                                    <>
                                        <div className="my-[clamp(0.6rem,1.9vh,1.25rem)] flex items-center gap-3 [@media(max-height:480px)]:hidden">
                                            <div className="h-px flex-1 bg-[#ece5ff]" />
                                            <span className="text-[12px] text-[#a49bc0]">or continue with</span>
                                            <div className="h-px flex-1 bg-[#ece5ff]" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 [@media(max-height:480px)]:hidden">
                                            <button
                                                type="button"
                                                onClick={() => googleLogin()}
                                                disabled={submitting}
                                                className={SOCIAL_BTN}
                                            >
                                                <GoogleIcon />
                                                Google
                                            </button>
                                            <button type="button" className={SOCIAL_BTN}>
                                                <FaApple size={20} />
                                                Apple
                                            </button>
                                        </div>
                                    </>
                                )}

                                <p className={`mt-[clamp(0.6rem,1.9vh,1.25rem)] text-center text-[13px] text-[#8b84a0] ${otpOpen ? "[@media(max-height:480px)]:hidden" : ""}`}>
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
                                    className="mb-[clamp(0.5rem,1.6vh,1rem)] flex w-fit items-center gap-1.5 text-[13px] font-semibold text-[#918aa5] hover:text-[#5426c7]"
                                >
                                    <ArrowLeft size={15} />
                                    Back
                                </button>

                                <div className="mb-[clamp(0.5rem,1.6vh,1rem)] flex h-[clamp(2.25rem,5.5vh,3rem)] w-[clamp(2.25rem,5.5vh,3rem)] items-center justify-center rounded-2xl bg-[#f0eaff] text-[#5426c7] [@media(max-height:480px)]:hidden">
                                    <ShieldCheck size={22} />
                                </div>

                                <h2 className="text-[clamp(1.35rem,3.6vh,1.75rem)] font-extrabold leading-tight text-[#241748]">
                                    Enter your code
                                </h2>
                                <p className="mt-1 text-[13.5px] leading-snug text-[#8b84a0]">
                                    We sent a 6-digit code to{" "}
                                    <span className="break-all font-semibold text-[#30215c]">{loginTarget}</span>
                                </p>

                                {devOtp && (
                                    <p className="mt-2 rounded-xl bg-[#fff8e1] px-3 py-2 text-[12px] font-medium text-[#8a6d1a]">
                                        Dev mode: your code is <span className="font-bold">{devOtp}</span>
                                    </p>
                                )}

                                <form
                                    onSubmit={handleLoginVerify}
                                    className="mt-[clamp(0.75rem,2.2vh,1.5rem)] flex flex-col gap-[clamp(0.6rem,1.8vh,1.25rem)]"
                                >
                                    <OtpInput autoFocus value={loginDigits} onChange={setLoginDigits} />

                                    {error && (
                                        <p className="text-[13px] font-medium leading-snug text-[#e94b4b]">
                                            {error}
                                        </p>
                                    )}

                                    <button type="submit" disabled={submitting} className={PRIMARY_BTN}>
                                        {submitting ? "Verifying..." : "Verify & continue"}
                                    </button>
                                </form>

                                <p className="mt-[clamp(0.6rem,1.9vh,1.25rem)] text-center text-[13px] text-[#8b84a0]">
                                    Didn't get a code?{" "}
                                    <button
                                        type="button"
                                        onClick={handleLoginResend}
                                        disabled={cooldown > 0 || submitting}
                                        className="font-semibold text-[#5426c7] hover:underline disabled:cursor-not-allowed disabled:text-[#b7afd1] disabled:no-underline"
                                    >
                                        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                                    </button>
                                </p>
                            </>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};