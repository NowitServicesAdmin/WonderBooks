import { useState } from "react";
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

// 👉 Put your background image (robot + boy + books + castle) here
import contactBg from "../assets/wonder-books/contact-bg.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const MAX_MESSAGE = 500;

const TIME_ZONES = [
    { value: "Asia/Kolkata", label: "(GMT+5:30) India Standard Time" },
    { value: "Asia/Dubai", label: "(GMT+4:00) Gulf Standard Time" },
    { value: "Asia/Singapore", label: "(GMT+8:00) Singapore Time" },
    { value: "Europe/London", label: "(GMT+0:00) London" },
    { value: "Europe/Paris", label: "(GMT+1:00) Central European Time" },
    { value: "America/New_York", label: "(GMT-5:00) Eastern Time (US)" },
    { value: "America/Chicago", label: "(GMT-6:00) Central Time (US)" },
    { value: "America/Los_Angeles", label: "(GMT-8:00) Pacific Time (US)" },
    { value: "Australia/Sydney", label: "(GMT+10:00) Sydney" },
];

const PREFERRED_TIMES = [
    "Morning (9 AM – 12 PM)",
    "Afternoon (12 PM – 4 PM)",
    "Evening (4 PM – 8 PM)",
    "Anytime",
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
    preferredTime: "",
    message: "",
};

export default function ContactSection() {
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [serverMsg, setServerMsg] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "message" && value.length > MAX_MESSAGE) return;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const next = {};
        if (!form.name.trim()) next.name = "Please enter your name.";
        if (!form.email.trim()) next.email = "Please enter your email.";
        else if (!emailRegex.test(form.email)) next.email = "Enter a valid email address.";
        if (!form.contactNo.trim()) next.contactNo = "Please enter your contact number.";
        else if (!phoneRegex.test(form.contactNo.trim())) next.contactNo = "Enter a valid phone number.";
        if (!form.timeZone) next.timeZone = "Please select a time zone.";
        if (!form.preferredTime) next.preferredTime = "Please select a preferred time.";
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
                    preferredTime: form.preferredTime,
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

    // shared field styles (frosted white inputs, like the design)
    const field =
        "w-full rounded-xl border bg-white/85 text-sm text-[#1a1560] placeholder:text-[#7f7ca0] outline-none transition focus:border-[#5b2fe0] focus:bg-white focus:ring-2 focus:ring-[#5b2fe0]/20";
    const border = (key) => (errors[key] ? "border-red-400" : "border-white/70");
    const label = "mb-1.5 block text-sm font-bold text-[#1a1560]";
    const iconLeft = "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6890]";
    const err = (key) => errors[key] && <p className="mt-1 text-xs font-medium text-red-500">{errors[key]}</p>;

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
                <div className="lg:max-w-[min(34rem,30vw)] lg:min-w-[22rem]">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#5b2fe0]">Get in touch</p>
                    <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] text-[#140f5c] sm:text-6xl">
                        We&rsquo;re Here
                        <br />
                        to <span className="text-[#5b2fe0]">Help You</span>
                    </h1>
                    <p className="mt-6 max-w-[34rem] text-base leading-7 text-[#2f2b68] sm:text-lg">
                        Have a question, need support, or want to know more about WonderBooks? Our team is happy to help.
                    </p>

                    <ul className="mt-7 space-y-4">
                        {highlights.map(({ title, text, Icon, cls }) => (
                            <li key={title} className="flex items-center gap-4">
                                <span className={`flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl shadow-sm ${cls}`}>
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
                    className="rounded-[2rem] border-2 border-white/70 bg-white/35 p-6 shadow-[0_25px_70px_-20px_rgba(91,47,224,0.45)] backdrop-blur-xl sm:p-7 lg:mt-0"
                >
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <span className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/60 text-[#5b2fe0] shadow-sm">
                            <MessageCircle className="h-8 w-8" strokeWidth={1.8} />
                        </span>
                        <div>
                            <h2 className="text-2xl font-extrabold text-[#140f5c] sm:text-[1.7rem]">Send Us a Message</h2>
                            <p className="mt-0.5 text-sm text-[#3f3b78]">
                                Tell us how we can help with your WonderBooks experience.
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
                                    className={`${field} ${border("name")} h-[46px] pl-10 pr-3`}
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
                                    autoComplete="email"
                                    className={`${field} ${border("email")} h-[46px] pl-10 pr-3`}
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
                                    autoComplete="tel"
                                    className={`${field} ${border("contactNo")} h-[46px] pl-10 pr-3`}
                                />
                            </div>
                            {err("contactNo")}
                        </div>

                        {/* Time Zone */}
                        <div>
                            <label htmlFor="timeZone" className={label}>Time Zone</label>
                            <div className="relative">
                                <Globe className={iconLeft} />
                                <select
                                    id="timeZone"
                                    name="timeZone"
                                    value={form.timeZone}
                                    onChange={handleChange}
                                    className={`${field} ${border("timeZone")} h-[46px] appearance-none truncate pl-10 pr-9 text-[12px] xl:text-[12.5px]`}
                                >
                                    {TIME_ZONES.map((tz) => (
                                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6890]" />
                            </div>
                            {err("timeZone")}
                        </div>

                        {/* Preferred Time */}
                        <div>
                            <label htmlFor="preferredTime" className={label}>Preferred Time</label>
                            <div className="relative">
                                <Clock className={iconLeft} />
                                <select
                                    id="preferredTime"
                                    name="preferredTime"
                                    value={form.preferredTime}
                                    onChange={handleChange}
                                    className={`${field} ${border("preferredTime")} h-[46px] appearance-none pl-10 pr-10 ${form.preferredTime ? "" : "text-[#7f7ca0]"}`}
                                >
                                    <option value="" disabled>Select preferred time</option>
                                    {PREFERRED_TIMES.map((t) => (
                                        <option key={t} value={t} className="text-[#1a1560]">{t}</option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6890]" />
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
                                    className={`${field} ${border("message")} h-[104px] resize-none py-3.5 pb-8 pl-10 pr-3`}
                                />
                                <span className="pointer-events-none absolute bottom-2.5 right-3.5 text-xs text-[#6b6890]">
                                    {form.message.length}/{MAX_MESSAGE}
                                </span>
                            </div>
                            {err("message")}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="mt-4 flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-[#4f27e0] text-base font-bold text-white shadow-lg shadow-[#4f27e0]/35 transition hover:bg-[#431fc4] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4f27e0]/30 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {status === "loading" ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" /> Sending...
                            </>
                        ) : (
                            <>
                                <Send className="h-5 w-5" strokeWidth={1.8} /> Send Message
                            </>
                        )}
                    </button>

                    {/* Result message */}
                    <div aria-live="polite">
                        {status === "success" && (
                            <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50/95 px-4 py-3 text-sm font-medium text-emerald-700">
                                <CheckCircle2 className="h-4 w-4 shrink-0" /> {serverMsg}
                            </p>
                        )}
                        {status === "error" && (
                            <p className="mt-4 flex items-center gap-2 rounded-lg bg-red-50/95 px-4 py-3 text-sm font-medium text-red-600">
                                <AlertCircle className="h-4 w-4 shrink-0" /> {serverMsg}
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------
   BACKEND (Express + MongoDB example) — POST /api/contact


   router.post("/contact", async (req, res) => {
     try {
       const { name, email, contactNo, timeZone, preferredTime, message } = req.body;
       if (!name || !email || !contactNo || !timeZone || !preferredTime || !message)
         return res.status(400).json({ message: "All fields are required." });
       await ContactMessage.create({ name, email, contactNo, timeZone, preferredTime, message });
       res.status(201).json({ message: "Thanks! We'll reach out at your preferred time." });
     } catch (err) {
       res.status(500).json({ message: "Server error. Please try again later." });
     }
   });
------------------------------------------------------------------ */