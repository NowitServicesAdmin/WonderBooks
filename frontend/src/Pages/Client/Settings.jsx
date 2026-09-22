import { useEffect, useRef, useState } from "react";
import { Sparkles, User, BookOpen, Bell, Lock, HelpCircle, ChevronRight, ChevronDown, Globe, Users, Mail, Camera, Trash2, FileText, Info, Check, Crown, Heart, MessageCircle, Circle, Lightbulb, Package, Megaphone, CalendarDays, ArrowRight, Eye, ShieldCheck, Laptop, Smartphone, Monitor, Download, TriangleAlert, Headset, CreditCard,} from "lucide-react";
import ReactSelect from "react-select";
import { useAuth } from "../../context/AuthContext";
import SubscriptionPanel from "./SubscriptionPanel";

const tokens = {
    ink: "#241B3A",
    inkSoft: "#5B5372",
    line: "#E8E1F7",
    purple: "#5426C7",
    purpleDeep: "#392078",
    purpleTint: "#F1EBFC",
    danger: "#D64545",
};

const READING_PREFERENCES = [
    "Adventure",
    "Fantasy",
    "Animals",
    "Friendship",
    "Science",
    "Moral Stories",
    "Funny",
    "Bedtime",
];

const FAVORITE_CHARACTERS = [
    { id: "Animals", emoji: "🐶" },
    { id: "Princess", emoji: "👸" },
    { id: "Superhero", emoji: "🦸" },
    { id: "Robot", emoji: "🤖" },
    { id: "Dragons", emoji: "🐉" },
    { id: "Fairy", emoji: "🧚" },
    { id: "Dinosaur", emoji: "🦖" },
];

const LANGUAGES = ["English", "Hindi", "Telugu", "Spanish"];
const AGE_GROUPS = ["3 – 5 years", "6 – 8 years", "9 – 12 years"];
const ABOUT_LIMIT = 200;

const ROBOT_IMG =
    "https://res.cloudinary.com/djdct0pxu/image/upload/v1789624540/Screenshot_2026-09-17_063400-removebg-preview_nsy6e8.png";

/* ---------------------------------------------------------------
   Small building blocks
----------------------------------------------------------------*/
function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200"
            style={{ backgroundColor: checked ? tokens.purple : "#D8D2EA" }}
            aria-pressed={checked}
        >
            <span
                className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
            />
        </button>
    );
}

function Row({ icon: Icon, title, description, control }) {
    return (
        <div className="flex items-start justify-between gap-4 py-4">
            <div className="flex items-start gap-3">
                <div
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: tokens.purpleTint, color: tokens.purple }}
                >
                    <Icon size={17} />
                </div>
                <div>
                    <p className="text-sm font-semibold" style={{ color: tokens.ink }}>
                        {title}
                    </p>
                    {description && (
                        <p className="mt-0.5 text-sm" style={{ color: tokens.inkSoft }}>
                            {description}
                        </p>
                    )}
                </div>
            </div>
            <div className="shrink-0 pt-1">{control}</div>
        </div>
    );
}

function LinkRow({ icon, title, description, danger }) {
    return (
        <Row
            icon={icon}
            title={title}
            description={description}
            control={
                <ChevronRight size={18} style={{ color: danger ? tokens.danger : tokens.inkSoft }} />
            }
        />
    );
}

function Divider() {
    return <div className="h-px w-full" style={{ backgroundColor: tokens.line }} />;
}

/* Text input with a leading icon */
function IconInput({ icon: Icon, value, onChange, type = "text" }) {
    return (
        <div className="relative">
            <Icon
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: tokens.inkSoft }}
            />
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-11 w-full rounded-lg border bg-white pl-11 pr-3 text-sm outline-none transition focus:border-[#a98aff] focus:ring-2 focus:ring-[#a98aff]/25"
                style={{ borderColor: tokens.line, color: tokens.ink }}
            />
        </div>
    );
}

/* react-select with a leading icon */
function IconSelect({ icon: Icon, value, options, onChange }) {
    return (
        <div className="relative">
            <Icon
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2"
                style={{ color: tokens.inkSoft }}
            />
            <ReactSelect
                value={{ value, label: value }}
                options={options.map((o) => ({ value: o, label: o }))}
                onChange={(opt) => onChange(opt.value)}
                isSearchable={false}
                className="text-sm"
                styles={{
                    control: (base, state) => ({
                        ...base,
                        minHeight: 44,
                        borderRadius: 8,
                        borderColor: state.isFocused ? "#a98aff" : tokens.line,
                        boxShadow: state.isFocused ? "0 0 0 2px rgba(169,138,255,0.25)" : "none",
                        backgroundColor: "#fff",
                        "&:hover": { borderColor: "#c8b5ff" },
                    }),
                    valueContainer: (base) => ({ ...base, paddingLeft: 44 }),
                    singleValue: (base) => ({ ...base, color: tokens.ink }),
                    indicatorSeparator: (base) => ({ ...base, backgroundColor: tokens.line }),
                    dropdownIndicator: (base) => ({ ...base, color: tokens.inkSoft }),
                    option: (base, state) => ({
                        ...base,
                        color: state.isSelected ? "#fff" : tokens.ink,
                        backgroundColor: state.isSelected
                            ? tokens.purple
                            : state.isFocused
                                ? "#f6f3ff"
                                : "#fff",
                        cursor: "pointer",
                    }),
                    menu: (base) => ({ ...base, borderRadius: 8, overflow: "hidden", zIndex: 50 }),
                }}
            />
        </div>
    );
}

/* Tinted section card used in the profile form */
function Section({ icon: Icon, title, optional, description, tint, iconBg, iconColor, children }) {
    return (
        <section className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: tint }}>
            <div className="flex items-start gap-3">
                <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: iconBg, color: iconColor }}
                >
                    <Icon size={22} />
                </div>
                <div className="min-w-0">
                    <p className="text-base font-bold" style={{ color: tokens.ink }}>
                        {title}
                        {optional && (
                            <span className="ml-1 font-medium" style={{ color: tokens.inkSoft }}>
                                (optional)
                            </span>
                        )}
                    </p>
                    <p className="text-sm" style={{ color: tokens.inkSoft }}>
                        {description}
                    </p>
                </div>
            </div>
            <div className="mt-4">{children}</div>
        </section>
    );
}

/* Shared card shell used by the panels below */
function Card({ children, className = "", style }) {
    return (
        <section
            className={`rounded-2xl border bg-white p-4 shadow-[0_2px_14px_rgba(84,38,199,0.04)] sm:p-5 ${className}`}
            style={{ borderColor: tokens.line, ...style }}
        >
            {children}
        </section>
    );
}

function IconTile({ icon: Icon, bg, color, size = 22, className = "h-11 w-11" }) {
    return (
        <div
            className={`flex shrink-0 items-center justify-center rounded-xl ${className}`}
            style={{ backgroundColor: bg, color }}
        >
            <Icon size={size} />
        </div>
    );
}

/* Collapsible card with an icon header (Account & Privacy) */
function AccordionCard({ icon, iconBg, iconColor, title, titleColor, subtitle, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <Card>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 text-left"
            >
                <IconTile icon={icon} bg={iconBg} color={iconColor} />
                <div className="min-w-0 flex-1">
                    <p className="text-base font-bold" style={{ color: titleColor }}>
                        {title}
                    </p>
                    <p className="text-sm" style={{ color: tokens.inkSoft }}>
                        {subtitle}
                    </p>
                </div>
                <ChevronDown
                    size={20}
                    className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    style={{ color: tokens.purple }}
                />
            </button>
            {open && <div className="mt-4">{children}</div>}
        </Card>
    );
}

/* ================================================================
   PROFILE
=================================================================*/
function ProfilePanel() {
    const { user } = useAuth();

    const buildInitial = () => ({
        name: user?.name || "Ananya",
        email: user?.email || "ananya@email.com",
        language: "English",
        ageGroup: "6 – 8 years",
        preferences: ["Adventure", "Fantasy"],
        characters: ["Animals"],
        about: "",
    });

    const [saved, setSaved] = useState(buildInitial);
    const [form, setForm] = useState(saved);
    const [justSaved, setJustSaved] = useState(false);

    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const toggleIn = (key, item) =>
        setForm((f) => ({
            ...f,
            [key]: f[key].includes(item) ? f[key].filter((x) => x !== item) : [...f[key], item],
        }));

    const handleSave = () => {
        setSaved(form);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
        // Put your API call here.
    };

    const initials = form.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div
            className="flex flex-col gap-5 rounded-3xl border bg-white p-4 shadow-[0_4px_24px_rgba(84,38,199,0.05)] sm:p-6"
            style={{ borderColor: tokens.line }}
        >
            {/* Avatar + identity */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                        <div
                            className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white sm:h-24 sm:w-24"
                            style={{ background: "linear-gradient(135deg,#B98CF0,#5426C7)" }}
                        >
                            {initials || "U"}
                        </div>
                        <button
                            type="button"
                            aria-label="Change photo"
                            className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-[#eeeafa] bg-white shadow-md"
                            style={{ color: tokens.purple }}
                        >
                            <Camera size={15} />
                        </button>
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-xl font-extrabold" style={{ color: tokens.ink }}>
                            {form.name || "Your name"}
                        </p>
                        <p className="truncate text-sm" style={{ color: tokens.inkSoft }}>
                            {form.email}
                        </p>
                        <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#F3EDFF] px-3 py-1 text-xs font-semibold text-[#5B4A8A]">
                            <Crown size={13} className="text-[#F0B429]" />
                            Young Reader
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    className="flex h-11 items-center justify-center gap-2 self-start rounded-xl border bg-white px-5 text-sm font-semibold transition hover:bg-[#f5f1ff] sm:self-auto"
                    style={{ borderColor: "#cbb7ff", color: tokens.purple }}
                >
                    <Camera size={17} />
                    Change photo
                </button>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                <label className="block text-sm">
                    <span className="mb-1.5 block font-semibold" style={{ color: tokens.ink }}>
                        Name
                    </span>
                    <IconInput icon={User} value={form.name} onChange={(v) => set("name", v)} />
                </label>

                <label className="block text-sm">
                    <span className="mb-1.5 block font-semibold" style={{ color: tokens.ink }}>
                        Email
                    </span>
                    <IconInput icon={Mail} type="email" value={form.email} onChange={(v) => set("email", v)} />
                </label>

                <div className="text-sm">
                    <span className="mb-1.5 block font-semibold" style={{ color: tokens.ink }}>
                        Language
                    </span>
                    <IconSelect icon={Globe} value={form.language} options={LANGUAGES} onChange={(v) => set("language", v)} />
                </div>

                <div className="text-sm">
                    <span className="mb-1.5 block font-semibold" style={{ color: tokens.ink }}>
                        Child's age group
                    </span>
                    <IconSelect icon={Users} value={form.ageGroup} options={AGE_GROUPS} onChange={(v) => set("ageGroup", v)} />
                </div>
            </div>

            {/* Reading preferences */}
            <Section
                icon={User}
                title="Reading preferences"
                description="Choose what your child loves to read."
                tint="#F4EFFF"
                iconBg="#EADFFF"
                iconColor={tokens.purple}
            >
                <div className="flex flex-wrap gap-2.5">
                    {READING_PREFERENCES.map((pref) => {
                        const active = form.preferences.includes(pref);
                        return (
                            <button
                                key={pref}
                                type="button"
                                onClick={() => toggleIn("preferences", pref)}
                                aria-pressed={active}
                                className={`flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-200 ${active
                                        ? "border-transparent bg-[#5426c7] text-white shadow-[0_5px_12px_rgba(84,38,199,0.22)]"
                                        : "border-[#e8defd] bg-white text-[#5B5372] hover:border-[#cbb7ff] hover:bg-[#f9f6ff]"
                                    }`}
                            >
                                {active ? (
                                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white/25">
                                        <Check size={12} strokeWidth={3} />
                                    </span>
                                ) : (
                                    <Circle size={16} className="text-[#cbc3e0]" />
                                )}
                                {pref}
                            </button>
                        );
                    })}
                </div>
            </Section>

            {/* Favorite characters */}
            <Section
                icon={Heart}
                title="Favorite characters"
                optional
                description="Select characters your child enjoys."
                tint="#FFF6EA"
                iconBg="#FFE7CC"
                iconColor="#E5533D"
            >
                <div className="flex flex-wrap gap-2.5">
                    {FAVORITE_CHARACTERS.map(({ id, emoji }) => {
                        const active = form.characters.includes(id);
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => toggleIn("characters", id)}
                                aria-pressed={active}
                                className={`flex h-11 items-center gap-2 rounded-full border bg-white pl-1.5 pr-4 text-sm font-medium transition-all duration-200 ${active
                                        ? "border-[#5426c7] text-[#241B3A] shadow-[0_4px_12px_rgba(84,38,199,0.15)]"
                                        : "border-[#efe6d8] text-[#5B5372] hover:border-[#cbb7ff]"
                                    }`}
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f6f0ff] text-lg">
                                    {emoji}
                                </span>
                                {id}
                                {active && (
                                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#5426c7] text-white">
                                        <Check size={12} strokeWidth={3} />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </Section>

            {/* About your child */}
            <Section
                icon={MessageCircle}
                title="About your child"
                optional
                description="This helps us suggest better stories."
                tint="#EEF4FF"
                iconBg="#DCE8FF"
                iconColor="#4F7BE8"
            >
                <div className="relative">
                    <textarea
                        value={form.about}
                        maxLength={ABOUT_LIMIT}
                        onChange={(e) => set("about", e.target.value)}
                        placeholder="e.g. loves space, is curious, enjoys funny stories..."
                        rows={3}
                        className="w-full resize-none rounded-xl border bg-white px-4 pb-7 pt-3 text-sm outline-none transition focus:border-[#a98aff] focus:ring-2 focus:ring-[#a98aff]/25"
                        style={{ borderColor: tokens.line, color: tokens.ink }}
                    />
                    <span className="pointer-events-none absolute bottom-2.5 right-4 text-xs text-[#8f8ba3]">
                        {form.about.length}/{ABOUT_LIMIT}
                    </span>
                </div>
            </Section>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pb-2">
                <button
                    type="button"
                    onClick={() => setForm(saved)}
                    className="h-12 rounded-xl border bg-white px-7 text-sm font-semibold transition hover:bg-[#f5f1ff] active:scale-[0.98]"
                    style={{ borderColor: tokens.line, color: tokens.ink }}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    className="flex h-12 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(84,38,199,0.28)] transition hover:bg-[#4520a7] active:scale-[0.98]"
                    style={{ backgroundColor: tokens.purple }}
                >
                    {justSaved ? <Check size={17} /> : <Sparkles size={17} />}
                    {justSaved ? "Saved!" : "Save changes"}
                </button>
            </div>
        </div>
    );
}

/* ================================================================
   NOTIFICATIONS
=================================================================*/
const NOTIFICATION_ITEMS = [
    { id: "email", icon: Mail, title: "Email notifications", desc: "Receive updates about your books, orders and exciting news.", tint: "#F4EFFF", iconBg: "#EADFFF", iconColor: "#5426C7", on: true, details: "Sent to the email address on your profile. You can change it any time in Profile." },
    { id: "push", icon: Bell, title: "Push notifications", desc: "Get notified about new features, tips and special offers.", tint: "#FFF0F5", iconBg: "#FFDDE8", iconColor: "#E23B7A", on: true, details: "Shown on this device while Wonder Books is installed or open." },
    { id: "reminders", icon: BookOpen, title: "Reading reminders", desc: "Gentle reminders to keep the reading habit alive.", tint: "#EEF4FF", iconBg: "#DCE8FF", iconColor: "#4F7BE8", on: true, details: "A soft nudge when it's time for your child's next story." },
    { id: "orders", icon: Package, title: "Order updates", desc: "Updates about your book orders and delivery status.", tint: "#FFF6EA", iconBg: "#FFE7CC", iconColor: "#E08E45", on: true, details: "Confirmations, shipping and delivery updates for every order." },
    { id: "recs", icon: Sparkles, title: "Personalized recommendations", desc: "Story ideas based on your child's interests.", tint: "#F4EFFF", iconBg: "#EADFFF", iconColor: "#5426C7", on: true, details: "Uses the reading preferences you set in Profile." },
    { id: "offers", icon: Megaphone, title: "Product updates & offers", desc: "News, announcements and exclusive offers.", tint: "#FFF0F5", iconBg: "#FFDDE8", iconColor: "#E23B7A", on: false, details: "Occasional news about new features, plans and promotions." },
];

const FREQUENCIES = ["Instant", "Daily digest", "Weekly"];

function NotificationsPanel({ goTo }) {
    const [enabled, setEnabled] = useState(() =>
        Object.fromEntries(NOTIFICATION_ITEMS.map((n) => [n.id, n.on]))
    );
    const [openId, setOpenId] = useState(null);
    const [frequency, setFrequency] = useState("Daily digest");

    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Left: toggles + frequency */}
            <div className="flex min-w-0 flex-col gap-3">
                <Card className="flex flex-col gap-2.5 p-3! sm:p-4!">
                    {NOTIFICATION_ITEMS.map((n) => {
                        const isOpen = openId === n.id;
                        return (
                            <div key={n.id} className="rounded-xl px-3 py-3 sm:px-4" style={{ backgroundColor: n.tint }}>
                                <div className="flex items-center gap-3">
                                    <IconTile icon={n.icon} bg={n.iconBg} color={n.iconColor} size={20} className="h-10 w-10 rounded-full sm:h-11 sm:w-11" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold sm:text-base" style={{ color: tokens.ink }}>
                                            {n.title}
                                        </p>
                                        <p className="text-xs sm:text-sm" style={{ color: tokens.inkSoft }}>
                                            {n.desc}
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={enabled[n.id]}
                                        onChange={(v) => setEnabled((e) => ({ ...e, [n.id]: v }))}
                                    />
                                    <button
                                        type="button"
                                        aria-label={isOpen ? "Hide details" : "Show details"}
                                        aria-expanded={isOpen}
                                        onClick={() => setOpenId(isOpen ? null : n.id)}
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:bg-white/70"
                                        style={{ color: tokens.inkSoft }}
                                    >
                                        <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                                    </button>
                                </div>
                                {isOpen && (
                                    <p className="mt-2 pl-13 text-sm" style={{ color: tokens.inkSoft }}>
                                        {n.details}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </Card>

                <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <IconTile icon={CalendarDays} bg="#EADFFF" color={tokens.purple} size={22} className="h-11 w-11" />
                        <div>
                            <p className="text-base font-bold" style={{ color: tokens.ink }}>
                                Notification frequency
                            </p>
                            <p className="text-sm" style={{ color: tokens.inkSoft }}>
                                Choose how often you want to hear from us.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                        {FREQUENCIES.map((f) => {
                            const active = f === frequency;
                            return (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setFrequency(f)}
                                    aria-pressed={active}
                                    className={`h-11 rounded-full border px-6 text-sm font-semibold transition-all duration-200 ${active
                                            ? "border-transparent bg-[#5426c7] text-white shadow-[0_5px_12px_rgba(84,38,199,0.25)]"
                                            : "border-[#eeeafa] bg-white text-[#241B3A] hover:border-[#cbb7ff] hover:bg-[#f9f6ff]"
                                        }`}
                                >
                                    {f}
                                </button>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* Right: friendly side cards */}
            <div className="flex min-w-0 flex-col gap-5">
                <Card className="overflow-hidden p-0!">
                    <div className="bg-[#FBF9FF] p-5">
                        <IconTile icon={Lightbulb} bg="#FFF0C7" color="#F0B429" size={22} className="h-11 w-11 rounded-full" />
                        <p className="mt-3 text-lg font-extrabold" style={{ color: tokens.ink }}>
                            You're in control!
                        </p>
                        <p className="mt-1 text-sm leading-relaxed" style={{ color: tokens.inkSoft }}>
                            Choose the notifications that matter to you and your little reader. We'll keep the noise low and the magic high!
                        </p>
                    </div>
                    <div className="flex flex-col items-center bg-linear-to-b from-[#FBF9FF] to-[#F1EBFC] px-5 pb-5">
                        <img
                            src={ROBOT_IMG}
                            alt="Wonder Books robot reading a book"
                            className="h-40 w-auto object-contain drop-shadow-[0_8px_16px_rgba(84,38,199,0.15)]"
                        />
                        <p className="mt-2 text-center text-sm font-semibold italic" style={{ color: tokens.purple }}>
                            Great stories are just a notification away!
                        </p>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start gap-3">
                        <IconTile icon={HelpCircle} bg="#EADFFF" color={tokens.purple} size={22} className="h-11 w-11 rounded-full" />
                        <div>
                            <p className="text-base font-bold" style={{ color: tokens.ink }}>
                                Need help?
                            </p>
                            <p className="text-sm" style={{ color: tokens.inkSoft }}>
                                If you have any questions about notifications, we're here to help.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => goTo?.("help")}
                        className="mt-4 flex h-12 w-full items-center justify-between rounded-xl border bg-white px-4 text-sm font-semibold transition hover:bg-[#f9f6ff]"
                        style={{ borderColor: tokens.line, color: tokens.purpleDeep }}
                    >
                        <span className="flex items-center gap-2.5">
                            <MessageCircle size={19} style={{ color: tokens.purple }} />
                            Contact Support
                        </span>
                        <ArrowRight size={17} style={{ color: tokens.purple }} />
                    </button>
                </Card>
            </div>
        </div>
    );
}

function TwoStepCard() {
    const [enabled, setEnabled] = useState(true);
    const [method, setMethod] = useState("email");
    const methods = [
        { id: "email", icon: Mail, title: "Email", desc: "Get codes via your email" },
        { id: "app", icon: Smartphone, title: "Authenticator app", desc: "Use an authenticator app" },
    ];
    return (
        <AccordionCard
            icon={Lock}
            iconBg="#DCE8FF"
            iconColor="#4F7BE8"
            title="Two-Step Verification"
            titleColor={tokens.purple}
            subtitle="Add an extra layer of security to your account."
        >
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold" style={{ color: tokens.ink }}>
                        Enable two-step verification
                    </p>
                    <p className="text-sm" style={{ color: tokens.inkSoft }}>
                        When enabled, you'll need to enter an extra verification code when you log in.
                    </p>
                </div>
                <Toggle checked={enabled} onChange={setEnabled} />
            </div>

            {enabled && (
                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_minmax(0,1.4fr)] lg:items-center">
                    <div>
                        <p className="text-sm font-semibold" style={{ color: tokens.ink }}>
                            Verification method
                        </p>
                        <p className="text-sm" style={{ color: tokens.inkSoft }}>
                            Choose how you want to receive verification codes.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {methods.map((m) => {
                            const active = method === m.id;
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setMethod(m.id)}
                                    aria-pressed={active}
                                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${active
                                            ? "border-[#5426c7] bg-[#F4EFFF] shadow-[0_0_0_1px_#5426c7]"
                                            : "border-[#e8e1f7] bg-white hover:border-[#cbb7ff]"
                                        }`}
                                >
                                    <m.icon size={22} style={{ color: tokens.purple }} />
                                    <span>
                                        <span className="block text-sm font-semibold" style={{ color: tokens.ink }}>
                                            {m.title}
                                        </span>
                                        <span className="block text-xs" style={{ color: tokens.inkSoft }}>
                                            {m.desc}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </AccordionCard>
    );
}

const INITIAL_SESSIONS = [
    { id: 1, icon: Laptop, device: "Windows • Chrome", place: "Vijayawada, India", when: "Active now", current: true },
    { id: 2, icon: Smartphone, device: "iPhone • Safari", place: "Vijayawada, India", when: "Last active 2 days ago" },
    { id: 3, icon: Smartphone, device: "Android • Chrome", place: "Bengaluru, India", when: "Last active 5 days ago" },
];

function SessionsCard() {
    const [sessions, setSessions] = useState(INITIAL_SESSIONS);
    const others = sessions.filter((s) => !s.current);

    return (
        <AccordionCard
            icon={Monitor}
            iconBg="#D9F3E8"
            iconColor="#1F9D63"
            title="Active Sessions"
            titleColor={tokens.purple}
            subtitle="Manage and view devices where you're logged in."
        >
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: tokens.line }}>
                {sessions.map((s, i) => (
                    <div
                        key={s.id}
                        className={`flex items-center gap-3 px-3 py-3 sm:px-4 ${i > 0 ? "border-t" : ""}`}
                        style={{ borderColor: tokens.line }}
                    >
                        <s.icon size={22} className="shrink-0" style={{ color: tokens.inkSoft }} />
                        <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold" style={{ color: tokens.ink }}>
                                {s.device}
                                {s.current && (
                                    <span className="rounded-full bg-[#DDF6E9] px-2.5 py-0.5 text-[11px] font-semibold text-[#1F9D63]">
                                        Current
                                    </span>
                                )}
                            </p>
                            <p className="text-xs" style={{ color: tokens.inkSoft }}>
                                {s.place} • {s.when}
                            </p>
                        </div>
                        {!s.current && (
                            <button
                                type="button"
                                onClick={() => setSessions((list) => list.filter((x) => x.id !== s.id))}
                                className="shrink-0 rounded-lg bg-[#FFECEC] px-4 py-1.5 text-sm font-semibold text-[#E94B4B] transition hover:bg-[#FFDCDC]"
                            >
                                Sign out
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {others.length > 0 && (
                <div className="mt-3 flex justify-end">
                    <button
                        type="button"
                        onClick={() => setSessions((list) => list.filter((x) => x.current))}
                        className="h-10 rounded-lg border bg-[#F4EFFF] px-5 text-sm font-semibold transition hover:bg-[#EADFFF]"
                        style={{ borderColor: "#d9c9ff", color: tokens.purple }}
                    >
                        Sign out from all devices
                    </button>
                </div>
            )}
        </AccordionCard>
    );
}

function PrivacyPreferencesCard() {
    const [recs, setRecs] = useState(true);
    const [analytics, setAnalytics] = useState(true);
    const [marketing, setMarketing] = useState(false);
    const items = [
        { title: "Improve story recommendations", desc: "Allow us to use your activity to suggest better stories.", checked: recs, set: setRecs },
        { title: "Allow usage analytics", desc: "Help us improve the app experience.", checked: analytics, set: setAnalytics },
        { title: "Marketing communications", desc: "Receive updates about new features, offers and stories.", checked: marketing, set: setMarketing },
    ];
    return (
        <AccordionCard
            icon={Eye}
            iconBg="#FFF0C7"
            iconColor="#E0A21B"
            title="Privacy Preferences"
            titleColor="#C67A05"
            subtitle="Manage how your information is used."
        >
            <div className="grid grid-cols-1 gap-4 rounded-xl border p-4 md:grid-cols-3 md:gap-6" style={{ borderColor: tokens.line }}>
                {items.map((it) => (
                    <div key={it.title} className="flex items-start gap-3">
                        <Toggle checked={it.checked} onChange={it.set} />
                        <div>
                            <p className="text-sm font-semibold" style={{ color: tokens.ink }}>
                                {it.title}
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: tokens.inkSoft }}>
                                {it.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </AccordionCard>
    );
}

function ChildrenPrivacyCard() {
    return (
        <AccordionCard
            icon={Users}
            iconBg="#FFDDE8"
            iconColor="#E23B7A"
            title="Children's Privacy"
            titleColor="#D6336C"
            subtitle="We follow strict guidelines to keep children's data safe."
        >
            <div className="flex flex-col gap-3 rounded-xl bg-[#FFF0F5] p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                    <ShieldCheck size={30} className="shrink-0" style={{ color: "#E23B7A" }} />
                    <div>
                        <p className="text-sm font-bold" style={{ color: tokens.ink }}>
                            Our commitment
                        </p>
                        <p className="text-sm" style={{ color: tokens.inkSoft }}>
                            We follow COPPA and other child safety guidelines. We only collect the necessary information to provide a safe and personalized experience for your child.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    className="flex shrink-0 items-center gap-1 self-start text-sm font-semibold md:self-auto"
                    style={{ color: tokens.purple }}
                >
                    Learn more about how we keep their data safe
                    <ChevronRight size={16} />
                </button>
            </div>
        </AccordionCard>
    );
}

function DownloadDataCard() {
    const [requested, setRequested] = useState(false);
    return (
        <AccordionCard
            icon={Download}
            iconBg="#DCE8FF"
            iconColor="#4F7BE8"
            title="Download Your Data"
            titleColor={tokens.purple}
            subtitle="Get a copy of your Wonder Books data."
        >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-semibold" style={{ color: tokens.ink }}>
                        Request a copy of your data
                    </p>
                    <p className="text-sm" style={{ color: tokens.inkSoft }}>
                        We'll prepare a file with your books, profile and other available data. You'll receive a download link via email.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setRequested(true)}
                    disabled={requested}
                    className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold text-white transition hover:bg-[#4520a7] active:scale-[0.98] disabled:opacity-70"
                    style={{ backgroundColor: tokens.purple }}
                >
                    {requested && <Check size={16} />}
                    {requested ? "Request sent" : "Request Data Export"}
                </button>
            </div>
        </AccordionCard>
    );
}

function DeleteAccountCard() {
    const [confirming, setConfirming] = useState(false);
    return (
        <AccordionCard
            icon={Trash2}
            iconBg="#FFDDE0"
            iconColor="#E5333D"
            title="Delete Account"
            titleColor="#E5333D"
            subtitle="This action cannot be undone."
        >
            <div className="flex flex-col gap-3 rounded-xl bg-[#FFF0F1] p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                    <TriangleAlert size={28} className="shrink-0" style={{ color: "#E5333D" }} />
                    <div>
                        <p className="text-sm font-bold" style={{ color: "#E5333D" }}>
                            Permanently delete your account and all your data.
                        </p>
                        <p className="text-sm" style={{ color: tokens.inkSoft }}>
                            Once deleted, your books, data and account information will be permanently removed and cannot be recovered.
                        </p>
                    </div>
                </div>

                {confirming ? (
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            className="h-11 rounded-lg border bg-white px-5 text-sm font-semibold"
                            style={{ borderColor: tokens.line, color: tokens.ink }}
                        >
                            Keep account
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setConfirming(false);
                                // Put your delete-account API call here.
                            }}
                            className="h-11 rounded-lg bg-[#B91C2B] px-5 text-sm font-semibold text-white transition hover:bg-[#9e1723]"
                        >
                            Yes, delete
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        className="h-11 shrink-0 rounded-lg bg-[#E5333D] px-6 text-sm font-semibold text-white transition hover:bg-[#cc2a34] active:scale-[0.98]"
                    >
                        Delete Account
                    </button>
                )}
            </div>
        </AccordionCard>
    );
}

function AccountPrivacyPanel() {
    return (
        <div className="flex flex-col gap-4">
            <TwoStepCard />
            <SessionsCard />
            <PrivacyPreferencesCard />
            <ChildrenPrivacyCard />
            <DownloadDataCard />
            <DeleteAccountCard />
        </div>
    );
}

const QUICK_HELP = [
    { id: "contact", icon: MessageCircle, title: "Contact Us", desc: "Need more help? Our support team is here for you.", tint: "#F4EFFF", border: "#E3D8FB", iconBg: "#EADFFF", iconColor: "#5426C7" },
    { id: "center", icon: BookOpen, title: "Help Center", desc: "Browse guides and helpful resources.", tint: "#EEF4FF", border: "#D6E3FF", iconBg: "#DCE8FF", iconColor: "#4F7BE8" },
    { id: "report", icon: TriangleAlert, title: "Report a Problem", desc: "Let us know what went wrong. We'll look into it and help you.", tint: "#FFF0F1", border: "#FFD9DC", iconBg: "#FFDDE0", iconColor: "#E5333D" },
];

const FAQS = [
    { q: "How do I create my first book?", a: "Open Create Book from the sidebar, describe your story idea, pick your preferences and we'll build the story for you." },
    { q: "How can I track my order?", a: "Head to Orders in the sidebar to see the status of every book you've ordered." },
    { q: "Can I edit or reorder my book?", a: "Open My Books, choose the book you want, and you'll find the options to edit or order it again." },
    { q: "I didn't get my login code. What now?", a: "Login codes are sent to your email. Check your spam folder, wait a moment, then request a new code from the login screen." },
    { q: "Is my child's data safe?", a: "Yes. We follow COPPA and other child safety guidelines and only collect what's needed to personalize stories." },
];

function HelpAboutPanel() {
    const [openFaq, setOpenFaq] = useState(null);

    return (
        <div className="flex flex-col gap-5">
            {/* Quick help */}
            <Card>
                <div className="flex items-center gap-3">
                    <IconTile icon={Headset} bg="#EADFFF" color={tokens.purple} />
                    <div>
                        <p className="text-lg font-extrabold" style={{ color: tokens.purple }}>
                            Quick Help
                        </p>
                        <p className="text-sm" style={{ color: tokens.inkSoft }}>
                            Get the support you need, right away.
                        </p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {QUICK_HELP.map((h) => (
                        <button
                            key={h.id}
                            type="button"
                            className="group flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                            style={{ backgroundColor: h.tint, borderColor: h.border }}
                        >
                            <IconTile icon={h.icon} bg={h.iconBg} color={h.iconColor} size={26} className="h-14 w-14" />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold" style={{ color: tokens.ink }}>
                                    {h.title}
                                </span>
                                <span className="block text-sm leading-snug" style={{ color: tokens.inkSoft }}>
                                    {h.desc}
                                </span>
                            </span>
                            <span
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition group-hover:translate-x-0.5"
                                style={{ color: tokens.purple }}
                            >
                                <ArrowRight size={16} />
                            </span>
                        </button>
                    ))}
                </div>
            </Card>

            {/* FAQ + About */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Card className="p-3! sm:p-4!">
                    <div className="flex items-center justify-between rounded-xl bg-[#F4EFFF] px-3 py-3">
                        <div className="flex items-center gap-3">
                            <IconTile icon={HelpCircle} bg={tokens.purple} color="#fff" size={22} className="h-10 w-10 rounded-full" />
                            <p className="text-base font-extrabold sm:text-lg" style={{ color: tokens.purple }}>
                                Frequently Asked Questions
                            </p>
                        </div>
                    </div>

                    <ul className="mt-2">
                        {FAQS.map((f, i) => {
                            const isOpen = openFaq === i;
                            return (
                                <li key={f.q} className={i > 0 ? "border-t" : ""} style={{ borderColor: tokens.line }}>
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(isOpen ? null : i)}
                                        aria-expanded={isOpen}
                                        className="flex w-full items-center gap-3 px-2 py-3.5 text-left"
                                    >
                                        <FileText size={20} className="shrink-0" style={{ color: tokens.inkSoft }} />
                                        <span className="flex-1 text-sm font-medium" style={{ color: tokens.ink }}>
                                            {f.q}
                                        </span>
                                        <ChevronRight
                                            size={18}
                                            className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                                            style={{ color: tokens.inkSoft }}
                                        />
                                    </button>
                                    {isOpen && (
                                        <p className="pb-3.5 pl-10 pr-4 text-sm leading-relaxed" style={{ color: tokens.inkSoft }}>
                                            {f.a}
                                        </p>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </Card>

                <Card>
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF3D1] text-2xl">⭐</span>
                        <p className="text-lg font-extrabold" style={{ color: tokens.purpleDeep }}>
                            About Wonder Books
                        </p>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed" style={{ color: tokens.inkSoft }}>
                        Wonder Books is on a mission to make reading a magical part of every child's life. We believe in stories, imagination and a brighter tomorrow.
                    </p>

                    <div className="mt-4 border-t" style={{ borderColor: tokens.line }}>
                        <Row icon={Info} title="Version" description="1.0.0" control={null} />
                        <Divider />
                        <LinkRow icon={FileText} title="Terms of Service" description="Read our terms and conditions" />
                        <Divider />
                        <LinkRow icon={ShieldCheck} title="Privacy Policy" description="Read our privacy policy" />
                    </div>
                </Card>
            </div>
        </div>
    );
}

const CATEGORIES = [
    { id: "profile", icon: User, title: "Profile", Panel: ProfilePanel },
    { id: "subscription", icon: CreditCard, title: "Subscription", Panel: SubscriptionPanel },
    { id: "notifications", icon: Bell, title: "Notifications", Panel: NotificationsPanel },
    { id: "account", icon: Lock, title: "Account & Privacy", Panel: AccountPrivacyPanel },
    { id: "help", icon: HelpCircle, title: "Help & About", Panel: HelpAboutPanel },
];

function SettingsBreadcrumb({ activeId, onSelect }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const active = CATEGORIES.find((c) => c.id === activeId);

    useEffect(() => {
        if (!open) return;
        const onDown = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div className="relative flex items-center gap-2 text-lg font-semibold" ref={wrapRef}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition ${open ? "bg-[#f1ebfc]" : "hover:bg-[#f5f1ff]"
                    }`}
                style={{ color: tokens.purpleDeep }}
            >
                Settings
                <ChevronDown
                    size={17}
                    className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>

            <ChevronRight size={17} className="text-[#a9a2c0]" />

            <span className="text-[#5426c7]">{active.title}</span>

            {open && (
                <div
                    role="menu"
                    className="absolute left-0 top-full z-40 mt-2 w-64 rounded-2xl border bg-white p-2 shadow-[0_12px_32px_rgba(84,38,199,0.16)]"
                    style={{ borderColor: tokens.line }}
                >
                    {CATEGORIES.map((cat) => {
                        const isActive = cat.id === activeId;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    onSelect(cat.id);
                                    setOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${isActive
                                        ? "bg-[#f1ebfc] text-[#5426c7]"
                                        : "text-[#241B3A] hover:bg-[#f9f6ff]"
                                    }`}
                            >
                                <cat.icon size={18} className={isActive ? "text-[#5426c7]" : "text-[#5B5372]"} />
                                {cat.title}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export const Settings = () => {
    const [activeId, setActiveId] = useState("profile");
    const active = CATEGORIES.find((c) => c.id === activeId);

    return (
        <div className="w-full px-4 pb-6 pt-4 sm:px-6">
            <SettingsBreadcrumb activeId={activeId} onSelect={setActiveId} />

            <div className="mt-4">
                <active.Panel key={active.id} goTo={setActiveId} />
            </div>
        </div>
    );
};