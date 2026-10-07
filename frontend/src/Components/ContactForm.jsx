import { useEffect, useRef, useState } from "react";
import {
    Mail,
    Headphones,
    Heart,
    User,
    Phone,
    Globe,
    Clock,
    MessageSquare,
    MessageCircle,
    Send,
    ChevronDown,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import BrandText from "./BrandText";

// 👉 Put your background image (robot + boy + books + castle) here
import contactBg from "../assets/wonder-books/contact-bg.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const MAX_MESSAGE = 500;

const TIME_ZONES = [
    { value: "Asia/Kolkata", label: "IST – India (UTC+5:30)" },
    { value: "Asia/Dubai", label: "GST – Dubai (UTC+4:00)" },
    { value: "Asia/Singapore", label: "SGT – Singapore (UTC+8:00)" },
    { value: "Europe/London", label: "GMT – London (UTC+0:00)" },
    { value: "Europe/Paris", label: "CET – Central Europe (UTC+1:00)" },
    { value: "America/New_York", label: "EST – New York (UTC−5:00)" },
    { value: "America/Chicago", label: "CST – Chicago (UTC−6:00)" },
    { value: "America/Los_Angeles", label: "PST – Los Angeles (UTC−8:00)" },
    { value: "Australia/Sydney", label: "AEST – Sydney (UTC+10:00)" },
];

const highlights = [
    {
        title: "Quick Response",
        text: "We usually reply within 24 hours.",
        Icon: Mail,
        cls: "bg-[#ebe7fb] text-[#5b2fe0]",
    },
    {
        title: "Friendly Support",
        text: "Our team is here for parents and kids.",
        Icon: Headphones,
        cls: "bg-[#d9f3e7] text-[#10936a]",
    },
    {
        title: "We Listen",
        text: "Your feedback helps us grow.",
        Icon: Heart,
        cls: "bg-[#fde3e8] text-[#e11d48]",
    },
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s-]{8,16}$/;

const initialForm = {
    name: "",
    email: "",
    contactNo: "",
    timeZone: "Asia/Kolkata",
    hour: "",
    minute: "",
    period: "AM",
    message: "",
};

const pad2 = (v) => String(v).padStart(2, "0");

function Dropdown({ id, name, value, options, onChange, icon: Icon, placeholder = "Select an option", hasError }) {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const wrapRef = useRef(null);
    const listRef = useRef(null);
    const selected = options.find((o) => o.value === value);

    // close when clicking / tapping outside
    useEffect(() => {
        if (!open) return;
        const onDown = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("touchstart", onDown);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("touchstart", onDown);
        };
    }, [open]);

    // keep the highlighted row visible while using the keyboard
    useEffect(() => {
        if (open && active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
    }, [open, active]);

    const openList = () => {
        setActive(Math.max(0, options.findIndex((o) => o.value === value)));
        setOpen(true);
    };

    const choose = (opt) => {
        onChange({ target: { name, value: opt.value } });
        setOpen(false);
    };

    const onKeyDown = (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) return openList();
            const step = e.key === "ArrowDown" ? 1 : -1;
            setActive((i) => (i + step + options.length) % options.length);
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!open) openList();
            else if (active >= 0) choose(options[active]);
        } else if (e.key === "Escape" || e.key === "Tab") {
            setOpen(false);
        }
    };

    const triggerBorder = open
        ? "border-[#140f5c] ring-2 ring-[#140f5c]/15"
        : hasError
            ? "border-red-400"
            : "border-[#e1def0] hover:border-[#c9c5e3]";

    return (
        <div ref={wrapRef} className={`relative ${open ? "z-20" : ""}`}>
            {Icon && (
                <Icon
                    className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${open ? "text-[#140f5c]" : "text-[#6b6890]"}`}
                />
            )}
            <button
                type="button"
                id={id}
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={`${id}-list`}
                onClick={() => (open ? setOpen(false) : openList())}
                onKeyDown={onKeyDown}
                className={`flex h-11.5 w-full items-center rounded-xl border bg-white pl-10 pr-9 text-left text-[13px] outline-none transition ${triggerBorder} ${selected ? "font-medium text-[#1a1560]" : "text-[#9a98b5]"}`}
            >
                <span key={selected ? selected.value : "placeholder"} className="truncate">{selected ? selected.label : placeholder}</span>
            </button>
            <ChevronDown
                className={`pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6890] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />

            {open && (
                <ul
                    ref={listRef}
                    id={`${id}-list`}
                    role="listbox"
                    className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-59 overflow-y-auto rounded-2xl border border-[#e1def0] bg-white p-1.5 shadow-[0_18px_40px_-12px_rgba(20,15,92,0.28)] [scrollbar-color:#b9b7cf_transparent] scrollbar-thin"
                >
                    {options.map((opt, i) => {
                        const isSelected = opt.value === value;
                        return (
                            <li
                                key={opt.value}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => choose(opt)}
                                onMouseEnter={() => setActive(i)}
                                className={`cursor-pointer rounded-lg px-3.5 py-2.5 text-sm transition-colors ${
                                    isSelected
                                        ? "bg-[#eef0ff] font-semibold text-[#140f5c]"
                                        : i === active
                                            ? "bg-[#f5f4fb] text-[#1a1560]"
                                            : "text-[#3f3b78]"
                                }`}
                            >
                                {opt.label}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default function ContactSection() {
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [serverMsg, setServerMsg] = useState("");
    const hourRef = useRef(null);
    const minuteRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "message" && value.length > MAX_MESSAGE) return;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    // Preferred time: hour / minute boxes + AM-PM badge
    const handleTimePart = (part) => (e) => {
        let digits = e.target.value.replace(/\D/g, "").slice(0, 2);
        const max = part === "hour" ? 12 : 59;
        if (digits !== "" && Number(digits) > max) digits = String(max);
        // a single digit that can't start a valid hour (2-9) -> pad and jump to minutes
        if (part === "hour" && digits.length === 1 && Number(digits) > 1) digits = pad2(digits);
        setForm((prev) => ({ ...prev, [part]: digits }));
        if (errors.preferredTime) setErrors((prev) => ({ ...prev, preferredTime: "" }));
        if (part === "hour" && digits.length === 2) minuteRef.current?.focus();
    };

    const padOnBlur = (part) => () => {
        setForm((prev) => (prev[part].length === 1 ? { ...prev, [part]: pad2(prev[part]) } : prev));
    };

    const handleMinuteKeyDown = (e) => {
        if (e.key === "Backspace" && form.minute === "") hourRef.current?.focus();
    };

    const togglePeriod = () => {
        setForm((prev) => ({ ...prev, period: prev.period === "AM" ? "PM" : "AM" }));
        if (errors.preferredTime) setErrors((prev) => ({ ...prev, preferredTime: "" }));
    };

    const validate = () => {
        const next = {};
        if (!form.name.trim()) next.name = "Please enter your name.";
        if (!form.email.trim()) next.email = "Please enter your email.";
        else if (!emailRegex.test(form.email)) next.email = "Enter a valid email address.";
        if (!form.contactNo.trim()) next.contactNo = "Please enter your contact number.";
        else if (!phoneRegex.test(form.contactNo.trim())) next.contactNo = "Enter a valid phone number.";
        if (!form.timeZone) next.timeZone = "Please select a time zone.";
        if (form.hour === "" || form.minute === "") next.preferredTime = "Please enter your preferred time.";
        else if (Number(form.hour) < 1 || Number(form.hour) > 12 || Number(form.minute) > 59)
            next.preferredTime = "Enter a valid time (hour 1–12, minutes 00–59).";
        if (!form.message.trim()) next.message = "Please write a message.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (status === "loading" || !validate()) return;

        setStatus("loading");
        setServerMsg("");

        try {
            const res = await fetch(`${API_URL}/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    contactNo: form.contactNo.trim(),
                    timeZone: form.timeZone,
                    preferredTime: `${pad2(form.hour)}:${pad2(form.minute)} ${form.period}`,
                    message: form.message.trim(),
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Something went wrong. Please try again.");

            setStatus("success");
            setServerMsg(data.message || "Thanks! Your message has been sent.");
            setForm(initialForm);
        } catch (err) {
            setStatus("error");
            setServerMsg(err.message || "Unable to send your message. Please try again.");
        }
    };

    // shared field styles (crisp white inputs, soft border, dark-blue focus ring)
    const field =
        "w-full rounded-xl border bg-white text-sm text-[#1a1560] placeholder:text-[#9a98b5] outline-none transition focus:border-[#5b2fe0] focus:bg-white focus:ring-2 focus:ring-[#5b2fe0]/20";
    const border = (key) => (errors[key] ? "border-red-400 focus:border-red-500" : "border-[#e1def0] hover:border-[#c9c5e3]");
    const label = "mb-1.5 block text-sm font-bold text-[#1a1560]";
    const iconLeft = "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6890]";
    const err = (key) => errors[key] && <p key={errors[key]} className="mt-1 text-xs font-medium text-red-500">{errors[key]}</p>;

    return (
        <section id="contact" className="relative overflow-hidden bg-[#efe9ff]">
            {/* Full-bleed background image */}
            <img
                src={contactBg}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-[60%_75%]"
            />

            {/* Readability scrim: keeps the text clear of the artwork.
                Full overlay on mobile, left-to-right fade on desktop. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-white/30 lg:bg-[linear-gradient(90deg,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.8)_20%,rgba(255,255,255,0.35)_32%,rgba(255,255,255,0)_42%)]"
            />

            {/* min-h controls the section height on desktop (lower = shorter section) */}
            <div className="relative z-10 mx-auto grid w-full max-w-[1900px] items-center gap-8 px-6 py-10 sm:px-10 lg:min-h-[36vw] lg:grid-cols-[minmax(0,34fr)_minmax(0,25fr)_minmax(0,38fr)] lg:gap-0 lg:px-[5%] lg:py-8">
                {/* LEFT: copy + highlights */}
                <div className="lg:max-w-[min(34rem,30vw)] lg:min-w-88">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#5b2fe0]">Get in touch</p>
                    <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] text-[#140f5c] sm:text-6xl">
                        We&rsquo;re Here{" "}
                        <br className="wb-br" />
                        to <span className="text-[#5b2fe0]">Help You</span>
                    </h1>
                    <p className="mt-6 max-w-136 text-base leading-7 text-[#2f2b68] sm:text-lg">
                        <BrandText>Have a question, need support, or want to know more about WonderBooks? Our team is happy to help.</BrandText>
                    </p>

                    <ul className="mt-7 space-y-4">
                        {highlights.map(({ title, text, Icon, cls }) => (
                            <li key={title} className="flex items-center gap-4">
                                <span className={`flex h-15 w-15 shrink-0 items-center justify-center rounded-2xl shadow-sm ${cls}`}>
                                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                                </span>
                                <div>
                                    <p className="text-base font-bold text-[#140f5c]">{title}</p>
                                    <p className="text-base text-[#3f3b78]">{text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* MIDDLE: empty space so the background characters stay visible */}
                <div className="hidden lg:block" aria-hidden="true" />

                {/* RIGHT: glass form card */}
                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="rounded-4xl border-2 border-white/70 bg-white/35 p-6 shadow-[0_25px_70px_-20px_rgba(91,47,224,0.45)] backdrop-blur-xl sm:p-7 lg:mt-0"
                >
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <span className="flex h-17 w-17 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/60 text-[#5b2fe0] shadow-sm">
                            <MessageCircle className="h-8 w-8" strokeWidth={1.8} />
                        </span>
                        <div>
                            <h2 className="text-2xl font-extrabold text-[#140f5c] sm:text-[1.7rem]">Send Us a Message</h2>
                            <p className="mt-0.5 text-sm text-[#3f3b78]">
                                <BrandText>Tell us how we can help with your WonderBooks experience.</BrandText>
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-x-5 gap-y-3 sm:grid-cols-2">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className={label}>Name</label>
                            <div className="relative">
                                <User className={iconLeft} />
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Your full name"
                                    autoComplete="name"
                                    className={`${field} ${border("name")} h-11.5 pl-10 pr-3`}
                                />
                            </div>
                            {err("name")}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className={label}>Email</label>
                            <div className="relative">
                                <Mail className={iconLeft} />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    translate="no"
                                    autoComplete="email"
                                    className={`${field} ${border("email")} h-11.5 pl-10 pr-3`}
                                />
                            </div>
                            {err("email")}
                        </div>

                        {/* Contact No */}
                        <div>
                            <label htmlFor="contactNo" className={label}>Contact No</label>
                            <div className="relative">
                                <Phone className={iconLeft} />
                                <input
                                    id="contactNo"
                                    name="contactNo"
                                    type="tel"
                                    value={form.contactNo}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    translate="no"
                                    autoComplete="tel"
                                    className={`${field} ${border("contactNo")} h-11.5 pl-10 pr-3`}
                                />
                            </div>
                            {err("contactNo")}
                        </div>

                        {/* Time Zone */}
                        <div>
                            <label htmlFor="timeZone" className={label}>Time Zone</label>
                            <div className="relative notranslate">
                                <Dropdown
                                    id="timeZone"
                                    name="timeZone"
                                    value={form.timeZone}
                                    options={TIME_ZONES}
                                    onChange={handleChange}
                                    icon={Globe}
                                    placeholder="Select time zone"
                                    hasError={!!errors.timeZone}
                                />
                            </div>
                            {err("timeZone")}
                        </div>

                        {/* Preferred Time */}
                        <div>
                            <label htmlFor="preferredTime" className={label}>Preferred Time</label>
                            <div className="relative">
                                <div
                                    className={`flex h-11.5 items-center rounded-xl border bg-white pl-3.5 pr-1.5 transition focus-within:border-[#140f5c] focus-within:ring-2 focus-within:ring-[#140f5c]/15 ${
                                        errors.preferredTime ? "border-red-400" : "border-[#e1def0] hover:border-[#c9c5e3]"
                                    }`}
                                >
                                    <Clock className="h-4 w-4 shrink-0 text-[#6b6890]" />
                                    <div className="ml-3 flex flex-1 items-center gap-1.5">
                                        <input
                                            id="preferredTime"
                                            ref={hourRef}
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="off"
                                            aria-label="Preferred hour"
                                            maxLength={2}
                                            value={form.hour}
                                            onChange={handleTimePart("hour")}
                                            onBlur={padOnBlur("hour")}
                                            onFocus={(e) => e.target.select()}
                                            placeholder="00"
                                            translate="no"
                                            className="w-8 bg-transparent text-center text-sm font-medium text-[#1a1560] outline-none placeholder:text-[#a5a3bf]"
                                        />
                                        <span className="font-semibold text-[#6b6890]">:</span>
                                        <input
                                            ref={minuteRef}
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="off"
                                            aria-label="Preferred minute"
                                            maxLength={2}
                                            value={form.minute}
                                            onChange={handleTimePart("minute")}
                                            onBlur={padOnBlur("minute")}
                                            onKeyDown={handleMinuteKeyDown}
                                            onFocus={(e) => e.target.select()}
                                            placeholder="00"
                                            translate="no"
                                            className="w-8 bg-transparent text-center text-sm font-medium text-[#1a1560] outline-none placeholder:text-[#a5a3bf]"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={togglePeriod}
                                        aria-label={`Switch AM or PM (currently ${form.period})`}
                                        translate="no"
                                        className="h-8 min-w-12 rounded-lg bg-[#5b2fe0] px-3 text-xs font-bold tracking-wide text-white transition hover:bg-[#6d42ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b2fe0]/40"
                                    >
                                        {form.period}
                                    </button>
                                </div>
                            </div>
                            {err("preferredTime")}
                        </div>

                        {/* Message (full width) */}
                        <div className="sm:col-span-2">
                            <label htmlFor="message" className={label}>Message</label>
                            <div className="relative">
                                <MessageSquare className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-[#6b6890]" />
                                <textarea
                                    id="message"
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder="Tell us your message..."
                                    rows={4}
                                    className={`${field} ${border("message")} h-26 resize-none py-3.5 pb-8 pl-10 pr-3`}
                                />
                                <span translate="no" className="notranslate absolute bottom-2.5 right-3 text-xs font-medium text-[#7c7a9d]">
                                    {form.message.length}/{MAX_MESSAGE}
                                </span>
                            </div>
                            {err("message")}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="mt-4 flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-[#5b2fe0] text-base font-bold text-white shadow-lg shadow-[#5b2fe0]/35 transition hover:bg-[#6d42ee] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5b2fe0]/30 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {status === "loading" ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" /> <span key="sending">Sending...</span>
                            </>
                        ) : (
                            <>
                                <Send className="h-5 w-5" strokeWidth={1.8} /> <span key="send">Send Message</span>
                            </>
                        )}
                    </button>

                    {/* Result message */}
                    <div aria-live="polite">
                        {status === "success" && (
                            <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50/95 px-4 py-3 text-sm font-medium text-emerald-700">
                                <CheckCircle2 className="h-4 w-4 shrink-0" /> <span key={serverMsg}>{serverMsg}</span>
                            </p>
                        )}
                        {status === "error" && (
                            <p className="mt-4 flex items-center gap-2 rounded-lg bg-red-50/95 px-4 py-3 text-sm font-medium text-red-600">
                                <AlertCircle className="h-4 w-4 shrink-0" /> <span key={serverMsg}>{serverMsg}</span>
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </section>
    );
}