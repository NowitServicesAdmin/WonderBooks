import { useEffect, useRef, useState } from "react";
import {
    Sparkles,
    Mic,
    Send,
    Lightbulb,
    RotateCcw,
    Image as ImageIcon,
    PawPrint,
    Box,
    UserPlus,
    Plus,
    ChevronRight,
    Palette,
    Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { chatBook, createBook } from "../services/bookService";
// NOTE: requires `export` added to `const STORY_OPTIONS = {...}` in ManualMode.jsx
import { STORY_OPTIONS } from "./ManualMode";

const AI_ROBOT_IMAGE =
    "https://res.cloudinary.com/djdct0pxu/image/upload/v1788501579/Screenshot_2026-09-04_112746-removebg-preview_etj2un.png";

// Used when a character/pet/object has no uploaded photo, so it still gets a face.
const defaultAvatarUrl = (seed) =>
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed || "storybook-hero")}`;

// Used if the API response doesn't include a cover image yet.
const DEFAULT_COVER_FALLBACK =
    "https://res.cloudinary.com/djdct0pxu/image/upload/v1788501579/Screenshot_2026-09-04_112746-removebg-preview_etj2un.png";

const storyIdeas = [
    { emoji: "🐘", text: "A brave little elephant" },
    { emoji: "🚀", text: "An exciting space adventure" },
    { emoji: "🏰", text: "A magical princess story" },
    { emoji: "🌲", text: "An adventure in the forest" },
];

const themes = [
    { iconBg: "bg-gradient-to-br from-[#eee8ff] to-[#ddd2ff]", border: "hover:border-[#cbbcf3]", glow: "hover:shadow-[0_12px_28px_rgba(112,84,214,0.14)]" },
    { iconBg: "bg-gradient-to-br from-[#fff0eb] to-[#ffe0d5]", border: "hover:border-[#f0c4b5]", glow: "hover:shadow-[0_12px_28px_rgba(230,80,40,0.12)]" },
    { iconBg: "bg-gradient-to-br from-[#f5ebff] to-[#ead7ff]", border: "hover:border-[#d8b9f2]", glow: "hover:shadow-[0_12px_28px_rgba(142,84,210,0.12)]" },
    { iconBg: "bg-gradient-to-br from-[#e8f8ee] to-[#d6f0df]", border: "hover:border-[#b9dec9]", glow: "hover:shadow-[0_12px_28px_rgba(62,156,114,0.12)]" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10);

const EMPTY_COMPANION_DRAFT = { name: "", description: "", photoFile: null, photoPreview: null };

// The + menu in the input bar. "type" flows straight into startCompanion(type).
const ADD_MENU_ITEMS = [
    { type: "character", label: "Add a character", icon: UserPlus },
    { type: "pet", label: "Add a pet", icon: PawPrint },
    { type: "object", label: "Add an object", icon: Box },
];

/* ------------------------------------------------------------------ */
/* Matching the AI's free-text story settings back onto the visual     */
/* catalog (STORY_OPTIONS) that Manual mode uses, so the same option   */
/* chips can be shown here. Best-effort: exact label match first, then */
/* a loose substring match. Returns null if nothing lines up, which is */
/* fine — the row still renders, just with nothing highlighted yet.    */
/* ------------------------------------------------------------------ */
const findOptionByLabel = (options, label) => {
    if (!label || !Array.isArray(options)) return null;
    const norm = String(label).trim().toLowerCase();
    if (!norm) return null;

    return (
        options.find((o) => o.label.toLowerCase() === norm) ||
        options.find((o) => o.label.toLowerCase().includes(norm) || norm.includes(o.label.toLowerCase())) ||
        null
    );
};

/* ------------------------------------------------------------------
   Mini-game shown while the book is being written/illustrated.
   Purely a "please wait" distraction — no score is sent anywhere.
   ------------------------------------------------------------------ */
const CATCH_ITEMS = ["📖", "✨", "🖍️", "⭐", "🎨"];

const MiniGameLoader = () => {
    const [basketX, setBasketX] = useState(50); // percentage across the track
    const [drops, setDrops] = useState([]);
    const [score, setScore] = useState(0);
    const containerRef = useRef(null);
    const rafRef = useRef(null);
    const lastSpawn = useRef(0);
    const basketXRef = useRef(50);

    useEffect(() => {
        basketXRef.current = basketX;
    }, [basketX]);

    useEffect(() => {
        let running = true;

        const tick = (time) => {
            if (!running) return;

            setDrops((prev) => {
                let next = prev.map((d) => ({ ...d, y: d.y + 2.2 })).filter((d) => d.y < 100);

                next = next.filter((d) => {
                    const caught = d.y > 80 && Math.abs(d.x - basketXRef.current) < 9;
                    if (caught) setScore((s) => s + 1);
                    return !caught;
                });

                if (time - lastSpawn.current > 650) {
                    lastSpawn.current = time;
                    next.push({
                        id: uid(),
                        x: 8 + Math.random() * 84,
                        y: 0,
                        emoji: CATCH_ITEMS[Math.floor(Math.random() * CATCH_ITEMS.length)],
                    });
                }
                return next;
            });

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            running = false;
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const moveBasket = (clientX) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const pct = ((clientX - rect.left) / rect.width) * 100;
        setBasketX(Math.min(94, Math.max(6, pct)));
    };

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "ArrowLeft") setBasketX((x) => Math.max(6, x - 6));
            if (e.key === "ArrowRight") setBasketX((x) => Math.min(94, x + 6));
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <div className="mt-2 overflow-hidden rounded-[20px] border border-[#E5E1ED] bg-white">
            <div className="flex items-center justify-between border-b border-[#F0EDF7] px-4 py-2">
                <span className="text-[13px] font-semibold text-[#5A39C7]">
                    Catch the sparkles while I write your book…
                </span>
                <span className="text-[13px] font-bold text-[#9693A8]">Score: {score}</span>
            </div>

            <div
                ref={containerRef}
                onMouseMove={(e) => moveBasket(e.clientX)}
                onTouchMove={(e) => moveBasket(e.touches[0].clientX)}
                className="relative h-40 w-full touch-none bg-linear-to-b from-[#FBF9FF] to-[#F3EFFF]"
            >
                {drops.map((d) => (
                    <span
                        key={d.id}
                        className="absolute text-xl"
                        style={{ left: `${d.x}%`, top: `${d.y}%`, transform: "translate(-50%, -50%)" }}
                    >
                        {d.emoji}
                    </span>
                ))}
                <div
                    className="absolute bottom-2 h-3 w-16 -translate-x-1/2 rounded-full bg-[#5A39C7] shadow-[0_4px_10px_rgba(90,57,199,0.35)]"
                    style={{ left: `${basketX}%` }}
                />
            </div>

            <p className="px-4 py-2 text-center text-[11px] text-[#9693A8]">
                Move your mouse, finger, or the ← → keys — this can take a few minutes.
            </p>
        </div>
    );
};

/* ------------------------------------------------------------------
   Round avatar-chip option, matching the reference "choose a theme"
   picker: circular image, label underneath, purple ring + check when
   selected. Used inside each Customize row's expanded carousel.
   ------------------------------------------------------------------ */
const CircleOptionChip = ({ option, isSelected, onClick }) => (
    <button type="button" onClick={onClick} className="flex w-18 shrink-0 flex-col items-center gap-1.5">
        <span
            className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 transition-all duration-150 ${isSelected ? "border-[#7252dc] shadow-[0_4px_12px_rgba(105,71,215,0.30)]" : "border-transparent hover:border-[#D8CDF0]"
                }`}
        >
            <img src={option.image} alt={option.label} className="h-full w-full object-cover" />
            {isSelected && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#7252dc] text-white ring-2 ring-white">
                    <Check size={9} strokeWidth={3} />
                </span>
            )}
        </span>
        <span className={`text-center text-[10.5px] leading-tight ${isSelected ? "font-semibold text-[#5A39C7]" : "text-[#6b6880]"}`}>
            {option.label}
        </span>
    </button>
);

/* ------------------------------------------------------------------
   Customize panel — lets the user override the AI's guesses for
   theme / subject / central message / image style. Each category is a
   single collapsed pill (icon + current pick); tapping it expands into
   a round-chip carousel, one category open at a time so the panel
   never floods the chat with four big grids at once.

   Image style intentionally shows only 2 choices (Watercolour and 3D
   Storybook) rather than the full catalog, per request — swap the ids
   in IMAGE_STYLE_QUICK_IDS if you'd rather offer a different pair.
   ------------------------------------------------------------------ */
const IMAGE_STYLE_QUICK_IDS = ["watercolor", "3d"];

const CustomizePanel = ({ storySettings, onChange }) => {
    const [expanded, setExpanded] = useState(null);

    const themeOption = findOptionByLabel(STORY_OPTIONS.theme, storySettings.theme);
    const subjectOptions = themeOption ? STORY_OPTIONS.subject[themeOption.id] || [] : [];
    const centralmsgOptions = themeOption ? STORY_OPTIONS.centralmsg[themeOption.id] || [] : [];
    const subjectOption = findOptionByLabel(subjectOptions, storySettings.subject);
    const centralmsgOption = findOptionByLabel(centralmsgOptions, storySettings.centralmsg);
    const imageStyleOptions = STORY_OPTIONS.imageStyle.filter((o) => IMAGE_STYLE_QUICK_IDS.includes(o.id));
    const styleOption = findOptionByLabel(STORY_OPTIONS.imageStyle, storySettings.imageStyle);

    const rows = [
        {
            key: "theme",
            label: "Theme",
            options: STORY_OPTIONS.theme,
            selected: themeOption,
            onSelect: (option) => onChange("theme", option, /* isTheme */ true),
        },
        themeOption && {
            key: "subject",
            label: "Subject",
            options: subjectOptions,
            selected: subjectOption,
            onSelect: (option) => onChange("subject", option),
        },
        themeOption && {
            key: "centralmsg",
            label: "Central message",
            options: centralmsgOptions,
            selected: centralmsgOption,
            onSelect: (option) => onChange("centralmsg", option),
        },
        {
            key: "imageStyle",
            label: "Image style",
            options: imageStyleOptions,
            selected: styleOption,
            onSelect: (option) => onChange("imageStyle", option),
        },
    ].filter(Boolean);

    return (
        <div className="rounded-[20px] border border-[#DED9EE] bg-white p-4">
            <p className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-[#38345F]">
                <Palette size={16} className="text-[#5A39C7]" />
                Fine-tune the look & feel
            </p>

            <div className="flex flex-col gap-2">
                {rows.map((row) => {
                    const isOpen = expanded === row.key;
                    return (
                        <div key={row.key}>
                            <button
                                type="button"
                                onClick={() => setExpanded((current) => (current === row.key ? null : row.key))}
                                className="flex w-full items-center justify-between rounded-2xl border border-[#EDE9F5] bg-[#FAF9FF] px-3 py-2 text-left transition-colors hover:border-[#D8CDF0]"
                            >
                                <span className="flex items-center gap-2.5">
                                    {row.selected?.image && (
                                        <img src={row.selected.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                                    )}
                                    <span>
                                        <span className="block text-[11px] font-medium text-[#9693A8]">{row.label}</span>
                                        <span className="block text-[13px] font-semibold text-[#38345F]">
                                            {row.selected?.label || "Tap to choose"}
                                        </span>
                                    </span>
                                </span>
                                <ChevronRight
                                    size={16}
                                    className={`text-[#9693A8] transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                                />
                            </button>

                            {isOpen && (
                                <div className="mt-2 flex gap-3 overflow-x-auto px-1 pb-1">
                                    {row.options.map((option) => (
                                        <CircleOptionChip
                                            key={option.id}
                                            option={option}
                                            isSelected={row.selected?.id === option.id}
                                            onClick={() => {
                                                row.onSelect(option);
                                                setExpanded(null);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const AiBookCreation = () => {
    const navigate = useNavigate();

    const [storyIdea, setStoryIdea] = useState("");
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [chips, setChips] = useState([]);
    const [ready, setReady] = useState(false);
    const [pickingPhoto, setPickingPhoto] = useState(false);
    const [photoCount, setPhotoCount] = useState(0);
    const [bookStatus, setBookStatus] = useState(null); // null | "completed" | "failed"

    // Reactive mirror of store.current.state.storySettings, so the
    // Customize panel re-renders when the user swaps a card.
    const [storySettings, setStorySettings] = useState({});
    const [showCustomize, setShowCustomize] = useState(false);

    // The + menu in the input bar, and the shared name/photo/description
    // form it opens for "character" | "pet" | "object".
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [companionPrompt, setCompanionPrompt] = useState(null); // null | { type: "character" | "pet" | "object" }
    const [companionDraft, setCompanionDraft] = useState(EMPTY_COMPANION_DRAFT);

    const store = useRef({
        history: [],
        state: { storySettings: {}, characters: [], companions: [] },
        files: {},
    });
    const fileRef = useRef(null);
    const companionFileRef = useRef(null);
    const pendingPhotoId = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, isLoading, busy, chips, ready, pickingPhoto, companionPrompt, showCustomize]);

    /* ---------------- chat turn ---------------- */
    // Accepts an optional override so chip clicks can send immediately
    // instead of just filling the textarea.
    const handleSubmit = async (override) => {
        const message = (typeof override === "string" ? override : storyIdea).trim();
        if (!message || isLoading || busy || companionPrompt) return;

        const s = store.current;
        setMessages((prev) => [...prev, { role: "user", content: message }]);
        setStoryIdea("");
        setChips([]);
        setReady(false);
        setPickingPhoto(false);
        setShowCustomize(false);
        setShowAddMenu(false);
        setIsLoading(true);

        s.history.push({ role: "user", content: message });

        try {
            const [data] = await Promise.all([
                chatBook({ messages: s.history, state: s.state }),
                sleep(500),
            ]);

            s.history.push({ role: "assistant", content: data.reply });
            s.state = { companions: [], ...s.state, ...data.state };
            setStorySettings(s.state.storySettings || {});

            setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
            setChips(data.chips || []);
            setReady(Boolean(data.ready));
        } catch (error) {
            console.error("Chat error:", error);
            s.history.pop();
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, I lost my train of thought. Could you say that again?" },
            ]);
            setStoryIdea(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    };

    /* ---------------- customize: theme / subject / message / style ---------------- */
    // Purely local — no round trip to the AI. Swapping the theme clears
    // subject & central message since those lists are theme-specific,
    // same rule ManualMode applies.
    const handleSettingChange = (category, option, isTheme) => {
        const s = store.current;
        const nextSettings = { ...s.state.storySettings, [category]: option.label };
        if (isTheme) {
            nextSettings.subject = "";
            nextSettings.centralmsg = "";
        }
        s.state.storySettings = nextSettings;
        setStorySettings(nextSettings);
    };

    /* ---------------- optional character photo ---------------- */

    const startPhoto = () => {
        const chars = store.current.state.characters;
        setCompanionPrompt(null);
        if (chars.length === 1) openFile(chars[0].id);
        else setPickingPhoto(true);
    };

    const openFile = (id) => {
        pendingPhotoId.current = id;
        setPickingPhoto(false);
        fileRef.current?.click();
    };

    const onFile = (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        const id = pendingPhotoId.current;
        if (!file || !id) return;

        const c = store.current.state.characters.find((x) => x.id === id);
        store.current.files[id] = file;
        setPhotoCount(Object.keys(store.current.files).length);
        setMessages((prev) => [
            ...prev,
            { role: "user", content: `Photo of ${c?.name || "character"}`, photo: URL.createObjectURL(file) },
            { role: "assistant", content: `Lovely! I'll draw ${c?.name || "them"} to look like the photo.` },
        ]);
    };

    /* ---------------- + menu: add character / pet / object ---------------- */
    // One shared form (name required, description + photo optional). A
    // "character" is appended to the real cast (gets a canonical photo
    // reference like the hero); "pet"/"object" go on the side as companions.

    const startCompanion = (type) => {
        setPickingPhoto(false);
        setShowCustomize(false);
        setCompanionDraft(EMPTY_COMPANION_DRAFT);
        setCompanionPrompt({ type });
    };

    const cancelCompanion = () => {
        setCompanionPrompt(null);
        setCompanionDraft(EMPTY_COMPANION_DRAFT);
    };

    const onCompanionFile = (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setCompanionDraft((d) => ({ ...d, photoFile: file, photoPreview: URL.createObjectURL(file) }));
    };

    const saveCompanion = () => {
        const name = companionDraft.name.trim();
        if (!name || !companionPrompt) return;

        const id = uid();
        const type = companionPrompt.type; // "character" | "pet" | "object"
        const description = companionDraft.description.trim();
        const hasPhoto = Boolean(companionDraft.photoFile);
        const s = store.current;

        if (type === "character") {
            const newCharacter = {
                id,
                type: "Friend",
                name,
                gender: "",
                age: "",
                hobbies: description,
                favouriteFood: "",
            };
            s.state.characters = [...s.state.characters, newCharacter];
            if (hasPhoto) s.files[id] = companionDraft.photoFile;
            setPhotoCount(Object.keys(s.files).length);

            setMessages((prev) => [
                ...prev,
                {
                    role: "user",
                    content: `Added ${name} to the story${description ? ` — ${description}` : ""}`,
                    photo: companionDraft.photoPreview || undefined,
                },
                { role: "assistant", content: `Great — ${name} joins the adventure!` },
            ]);
        } else {
            const companion = {
                id,
                type,
                name,
                description,
                hasPhoto,
                avatarUrl: hasPhoto ? null : defaultAvatarUrl(name),
            };
            s.state.companions = [...(s.state.companions || []), companion];
            if (hasPhoto) s.files[id] = companionDraft.photoFile;

            const kindLabel = type === "pet" ? "pet" : "object";
            setMessages((prev) => [
                ...prev,
                {
                    role: "user",
                    content: `Added ${name} as their ${kindLabel}${description ? ` — ${description}` : ""}`,
                    photo: companionDraft.photoPreview || undefined,
                },
                { role: "assistant", content: `Perfect — ${name} will be part of the story!` },
            ]);
        }

        cancelCompanion();
    };

    /* ---------------- create the book ---------------- */

    const handleCreate = async () => {
        if (busy) return;
        const { state, files } = store.current;

        setReady(false);
        setShowCustomize(false);
        setShowAddMenu(false);
        setBusy(true);
        setBookStatus(null);
        setMessages((prev) => [
            ...prev,
            { role: "user", content: "Create my book" },
            { role: "assistant", content: "On it! Writing the story and drawing the pages. This can take a few minutes." },
        ]);

        try {
            const storySettingsPayload = Object.fromEntries(
                Object.entries(state.storySettings)
                    .filter(([, v]) => v)
                    .map(([k, v]) => [k, { label: v }])
            );

            // Any character without an uploaded photo still gets a face —
            // a generated default avatar — so the book never ends up blank.
            const characters = state.characters.map((c) => ({
                ...c,
                hasPhoto: Boolean(files[c.id]),
                avatarUrl: files[c.id] ? null : defaultAvatarUrl(c.name || c.id),
            }));

            // Pets/objects already carry name, description, hasPhoto and a
            // fallback avatarUrl from saveCompanion; just pass them through.
            const companions = state.companions || [];

            const data = await createBook({ storySettings: storySettingsPayload, characters, companions, files });

            const bookId = data.bookId || data.book?.id;
            const coverImage = data.coverImage || data.book?.coverImage || data.book?.coverUrl || DEFAULT_COVER_FALLBACK;

            setBusy(false);
            setBookStatus(data.status);

            setMessages((prev) => [
                ...prev,
                data.status === "completed"
                    ? {
                        role: "assistant",
                        content: "Your book is ready! 🎉",
                        bookCover: { bookId, coverImage },
                    }
                    : {
                        role: "assistant",
                        content: "Your book was created, but some pages didn't draw. You can retry them from your library.",
                    },
            ]);
        } catch (error) {
            console.error("Create book error:", error);
            setBusy(false);
            setReady(true);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `Something went wrong: ${error.message || "please try again"}.` },
            ]);
        }
    };

    const handleOpenBook = (bookCover) => {
        if (!bookCover?.bookId) return;
        navigate(`/templates/${bookCover.bookId}`);
    };

    const handleRestart = () => {
        if (busy) return;
        store.current = { history: [], state: { storySettings: {}, characters: [], companions: [] }, files: {} };
        setMessages([]);
        setStoryIdea("");
        setChips([]);
        setReady(false);
        setPickingPhoto(false);
        setPhotoCount(0);
        setBookStatus(null);
        setStorySettings({});
        setShowCustomize(false);
        setShowAddMenu(false);
        cancelCompanion();
    };

    const characters = store.current.state.characters;
    const hasChat = messages.length > 0;
    const heroName = characters[0]?.name;

    return (
        <div className="relative w-full overflow-hidden pb-8">
            {/* Background Glow */}
            <div className="pointer-events-none absolute left-1/2 top-25 h-105 w-225 -translate-x-1/2 rounded-full bg-[var(--tint)]/30 blur-[120px]" />

            <div className="relative z-10 mx-auto flex w-full max-w-315 flex-col">
                {/* ================= ROBOT + MESSAGE ================= */}
                <div className="mt-12 flex items-center justify-center gap-8">
                    <div className="relative flex h-57.5 w-75 shrink-0 items-center justify-center sm:h-75 sm:w-97.5">
                        <Sparkles size={22} className={`absolute left-1.25 top-15 text-[#c29aff] ${isLoading || busy ? "animate-pulse" : ""}`} fill="currentColor" />
                        <Sparkles size={28} className={`absolute right-3.75 top-13.75 text-[#ffc34e] ${isLoading || busy ? "animate-pulse" : ""}`} fill="currentColor" />
                        <Sparkles size={18} className={`absolute bottom-13.75 left-6.25 text-[#f3b13b] ${isLoading || busy ? "animate-pulse" : ""}`} fill="currentColor" />
                        <img src={AI_ROBOT_IMAGE} alt="AI Story Assistant" className="h-full w-full object-contain" />
                    </div>
                </div>

                {!hasChat && (
                    <p className="mx-auto -mt-4 max-w-140 text-center text-[15px] leading-6 text-[#777A9B]">
                        Hi, I'm Bookie! Tell me what your story is about — a few rough words are enough,
                        like <span className="font-semibold text-[#5A39C7]">&ldquo;we&rsquo;re going on a road trip&rdquo;</span>.
                        I'll take it from there.
                    </p>
                )}

                {/* Story Ideas — only before the conversation starts */}
                {!hasChat && (
                    <div className="mt-6 flex w-full justify-center">
                        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
                            {storyIdeas.map((idea, index) => {
                                const isSelected = storyIdea === idea.text;
                                const theme = themes[index];

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleSubmit(idea.text)}
                                        className={`group relative flex h-24 w-full items-center gap-3 overflow-hidden rounded-[20px] border px-4 text-left transition-all duration-300 ease-out ${isSelected ? "border-[#7654d8] bg-linear-to-br from-[#faf8ff] to-[#f1edff] shadow-[0_10px_28px_rgba(99,66,190,0.16)]" : `border-[#e5e1ed] bg-white/75 ${theme.border} ${theme.glow}`} hover:-translate-y-0.75 active:translate-y-0`}
                                    >
                                        <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/50 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
                                        <div className={`relative z-10 flex h-13.5 w-13.5 shrink-0 items-center justify-center rounded-[17px] ${theme.iconBg} shadow-[0_6px_14px_rgba(80,60,150,0.08)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]`}>
                                            <span className="text-[32px] leading-none">{idea.emoji}</span>
                                            <Sparkles size={10} className="absolute -right-1 -top-1 text-[#f3b126] opacity-0 transition-all duration-300 group-hover:opacity-100" fill="currentColor" />
                                        </div>
                                        <div className="relative z-10 flex flex-1 flex-col">
                                            <span className={`text-[15px] font-semibold leading-[1.45] transition-colors duration-300 ${isSelected ? "text-[#4d36a5]" : "text-[#53577d] group-hover:text-[#40328f]"}`}>
                                                {idea.text}
                                            </span>
                                        </div>
                                        {isSelected && <div className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-[#6845d2] shadow-[0_0_0_4px_rgba(104,69,210,0.12)]" />}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => {
                                    const randomIdea = storyIdeas[Math.floor(Math.random() * storyIdeas.length)];
                                    handleSubmit(randomIdea.text);
                                }}
                                className="group relative flex h-24 w-full items-center gap-3 overflow-hidden rounded-[20px] border border-[#eadfbd] bg-linear-to-br from-[#fffdf7] to-[#fff3cf] px-4 text-left shadow-[0_5px_18px_rgba(180,130,30,0.06)] transition-all duration-300 ease-out hover:-translate-y-0.75 hover:border-[#f0c75f] hover:shadow-[0_12px_28px_rgba(180,130,30,0.14)] active:translate-y-0"
                            >
                                <div className="absolute -right-5 -top-5 h-21.25 w-21.25 rounded-full bg-[#ffe9a9]/50 blur-xl" />
                                <div className="relative z-10 flex h-13.5 w-13.5 shrink-0 items-center justify-center rounded-[17px] bg-linear-to-br from-[#fff0b3] to-[#ffd66f] shadow-[0_6px_16px_rgba(214,160,35,0.15)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                                    <Lightbulb size={27} className="text-[#d99614]" fill="currentColor" />
                                    <Sparkles size={10} className="absolute -right-1 -top-1 text-[#f0a71b]" fill="currentColor" />
                                </div>
                                <div className="relative z-10">
                                    <span className="block text-[15px] font-bold text-[#76602c]">Surprise me!</span>
                                </div>
                                <Sparkles size={13} className="absolute bottom-3 right-4 text-[#e5a91d]/60" fill="currentColor" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ================= CONVERSATION ================= */}
                {hasChat && (
                    <div className="mx-auto mt-8 flex w-full max-w-275 flex-col gap-4">
                        <div className="flex justify-end">
                            <button
                                onClick={handleRestart}
                                disabled={busy}
                                className="flex items-center gap-1.5 text-[13px] font-medium text-[#777A9B] transition-colors hover:text-[#5A39C7] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <RotateCcw size={14} />
                                Start over
                            </button>
                        </div>

                        {messages.map((message, index) => (
                            <div key={index} className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                                {message.bookCover ? (
                                    /* ---- Book ready: show ONLY the cover, click it to open the book ---- */
                                    <div className="flex max-w-[75%] flex-col items-center gap-3 rounded-[20px] rounded-bl-md border border-[#E5E1ED] bg-white px-6 py-5">
                                        <p className="text-[15px] font-semibold text-[#38345F]">{message.content}</p>
                                        <button
                                            onClick={() => handleOpenBook(message.bookCover)}
                                            className="group relative h-56 w-40 overflow-hidden rounded-[14px] border border-[#DED9EE] shadow-[0_12px_30px_rgba(90,57,199,0.20)] transition-transform duration-300 hover:-translate-y-1"
                                        >
                                            <img
                                                src={message.bookCover.coverImage}
                                                alt="Your storybook cover"
                                                className="h-full w-full object-cover"
                                            />
                                            <span className="absolute inset-x-0 bottom-0 bg-black/55 py-2 text-center text-[12px] font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                                Open my book →
                                            </span>
                                        </button>
                                        <span className="text-[12px] font-medium text-[#9693A8]">Tap the cover to start reading</span>
                                    </div>
                                ) : (
                                    <div
                                        className={`max-w-[75%] rounded-[20px] px-5 py-3.5 text-[15px] leading-6 ${message.role === "user" ? "rounded-br-md bg-[#5A39C7] text-white" : "rounded-bl-md border border-[#E5E1ED] bg-white text-[#53577D]"}`}
                                    >
                                        {message.photo && (
                                            <img src={message.photo} alt="" className="mb-2 h-28 w-28 rounded-[14px] object-cover" />
                                        )}
                                        {message.content}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex items-center gap-1.5 rounded-[20px] rounded-bl-md border border-[#E5E1ED] bg-white px-5 py-3.5">
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#B9A7E8] [animation-delay:-0.3s]" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#B9A7E8] [animation-delay:-0.15s]" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#B9A7E8]" />
                                </div>
                            </div>
                        )}

                        {/* While the book is generating, give them something fun to do */}
                        {busy && <MiniGameLoader />}

                        {/* Optional: swap theme / subject / message / style using round-chip pickers */}
                        {!isLoading && !busy && !companionPrompt && ready && showCustomize && (
                            <CustomizePanel storySettings={storySettings} onChange={handleSettingChange} />
                        )}

                        {/* Inline form for adding a character / pet / object — name required, photo optional */}
                        {companionPrompt && (
                            <div className="rounded-[20px] border border-[#DED9EE] bg-white p-4">
                                <p className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-[#38345F]">
                                    {companionPrompt.type === "pet" ? (
                                        <PawPrint size={16} className="text-[#5A39C7]" />
                                    ) : companionPrompt.type === "character" ? (
                                        <UserPlus size={16} className="text-[#5A39C7]" />
                                    ) : (
                                        <Box size={16} className="text-[#5A39C7]" />
                                    )}
                                    {companionPrompt.type === "pet"
                                        ? "Add a pet"
                                        : companionPrompt.type === "character"
                                            ? "Add a character"
                                            : "Add an object"}
                                </p>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                    <button
                                        type="button"
                                        onClick={() => companionFileRef.current?.click()}
                                        className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#DED9EE] text-[#9693A8] transition-colors hover:border-[#B9A7E8] hover:text-[#5A39C7]"
                                        aria-label="Add photo"
                                    >
                                        {companionDraft.photoPreview ? (
                                            <img src={companionDraft.photoPreview} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <ImageIcon size={20} />
                                        )}
                                    </button>

                                    <div className="flex flex-1 flex-col gap-2">
                                        <input
                                            value={companionDraft.name}
                                            onChange={(event) => setCompanionDraft((d) => ({ ...d, name: event.target.value }))}
                                            placeholder={
                                                companionPrompt.type === "pet"
                                                    ? "Pet's name (e.g. Biscuit)"
                                                    : companionPrompt.type === "character"
                                                        ? "Character's name (e.g. Grandpa Joe)"
                                                        : "Object's name (e.g. Rusty the truck)"
                                            }
                                            className="w-full rounded-xl border border-[#DED9EE] px-3 py-2 text-[14px] text-[#38345F] outline-none focus:border-[#B9A7E8]"
                                        />
                                        <input
                                            value={companionDraft.description}
                                            onChange={(event) => setCompanionDraft((d) => ({ ...d, description: event.target.value }))}
                                            placeholder={
                                                companionPrompt.type === "pet"
                                                    ? "What are they like? (optional)"
                                                    : companionPrompt.type === "character"
                                                        ? "Who are they to the hero? (optional)"
                                                        : "Colour, type, etc. (optional)"
                                            }
                                            className="w-full rounded-xl border border-[#DED9EE] px-3 py-2 text-[14px] text-[#38345F] outline-none focus:border-[#B9A7E8]"
                                        />
                                    </div>
                                </div>

                                <p className="mt-2 pl-1 text-[11px] text-[#9693A8]">
                                    No photo? No problem — {companionDraft.name.trim() || "they"}'ll get a friendly default look.
                                </p>

                                <div className="mt-3 flex justify-end gap-2">
                                    <button
                                        onClick={cancelCompanion}
                                        className="rounded-full px-4 py-2 text-[13px] font-medium text-[#777A9B] hover:text-[#5A39C7]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveCompanion}
                                        disabled={!companionDraft.name.trim()}
                                        className="rounded-full bg-[#5A39C7] px-4 py-2 text-[13px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Chips: quick answers, or the two primary ready-state actions */}
                        {!isLoading && !busy && !companionPrompt && (chips.length > 0 || ready || pickingPhoto) && (
                            <div className="flex flex-wrap justify-start gap-2.5 pl-1">
                                {chips.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => handleSubmit(c)}
                                        className="rounded-full border border-[#DED9EE] bg-white px-4 py-2 text-[14px] font-medium text-[#5A39C7] shadow-[0_4px_12px_rgba(120,100,180,0.08)] transition-all hover:-translate-y-0.5 hover:border-[#B9A7E8] hover:shadow-[0_8px_18px_rgba(120,100,180,0.14)]"
                                    >
                                        {c}
                                    </button>
                                ))}

                                {ready && !pickingPhoto && (
                                    <>
                                        <button
                                            onClick={handleCreate}
                                            className="flex items-center gap-1.5 rounded-full bg-linear-to-r from-[#6539D5] to-[#4822B8] px-5 py-2 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(74,39,180,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(74,39,180,0.32)]"
                                        >
                                            <Sparkles size={15} />
                                            Create my book
                                        </button>

                                        <button
                                            onClick={() => setShowCustomize((v) => !v)}
                                            className="flex items-center gap-1.5 rounded-full border border-[#DED9EE] bg-white px-4 py-2 text-[14px] font-medium text-[#5A39C7] transition-all hover:-translate-y-0.5 hover:border-[#B9A7E8]"
                                        >
                                            <Palette size={15} />
                                            {showCustomize ? "Hide style options" : "Customize style"}
                                        </button>
                                    </>
                                )}

                                {pickingPhoto && (
                                    <>
                                        {characters
                                            .filter((c) => !store.current.files[c.id])
                                            .map((c) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => openFile(c.id)}
                                                    className="rounded-full border border-[#DED9EE] bg-white px-4 py-2 text-[14px] font-medium text-[#5A39C7] hover:border-[#B9A7E8]"
                                                >
                                                    {c.name}
                                                </button>
                                            ))}
                                        <button
                                            onClick={() => setPickingPhoto(false)}
                                            className="rounded-full px-4 py-2 text-[14px] font-medium text-[#777A9B] hover:text-[#5A39C7]"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
                        <input ref={companionFileRef} type="file" accept="image/*" hidden onChange={onCompanionFile} />

                        <div ref={bottomRef} />
                    </div>
                )}

                {/* ================= PROMPT INPUT ================= */}
                <div className="mx-auto mt-10 w-full max-w-275">
                    <div className="flex items-center rounded-[22px] border border-[#DED9EE] bg-white px-5 py-2 shadow-[0_12px_35px_rgba(120,100,180,0.08)] transition-all duration-300 focus-within:border-[#B9A7E8] focus-within:shadow-[0_16px_40px_rgba(74,50,145,0.12)]">
                        {/* Left AI Icon */}
                        <div className="mr-4 flex h-11.5 w-11.5 shrink-0 items-center justify-center rounded-[14px] bg-linear-to-br from-[#F0EAFF] to-[#E3D7FF] text-[var(--accent)]">
                            <Sparkles size={23} />
                        </div>

                        {/* + menu: Add character / Add pet / Add object / Add photo */}
                        <div className="relative mr-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowAddMenu((v) => !v)}
                                disabled={isLoading || busy || !!companionPrompt}
                                aria-label="Add to your story"
                                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${showAddMenu ? "bg-[#EFE8FF] text-[#4323B2]" : "text-[#5B3BC4] hover:bg-[#F3EFFF]"
                                    }`}
                            >
                                <Plus size={22} className={`transition-transform duration-200 ${showAddMenu ? "rotate-45" : ""}`} />
                            </button>

                            {showAddMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
                                    <div className="absolute bottom-full left-0 z-20 mb-2 w-56 overflow-hidden rounded-2xl border border-[#E5E1ED] bg-white py-1.5 shadow-[0_16px_36px_rgba(90,57,199,0.18)]">
                                        {ADD_MENU_ITEMS.map(({ type, label, icon: Icon }) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => {
                                                    setShowAddMenu(false);
                                                    startCompanion(type);
                                                }}
                                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] font-medium text-[#38345F] transition-colors hover:bg-[#F6F2FF]"
                                            >
                                                <Icon size={16} className="text-[#5A39C7]" />
                                                {label}
                                            </button>
                                        ))}
                                        {hasChat && photoCount < characters.length && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAddMenu(false);
                                                    startPhoto();
                                                }}
                                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] font-medium text-[#38345F] transition-colors hover:bg-[#F6F2FF]"
                                            >
                                                <ImageIcon size={16} className="text-[#5A39C7]" />
                                                {heroName ? `Add a photo of ${heroName}` : "Add a photo"}
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <textarea
                            value={storyIdea}
                            onChange={(event) => setStoryIdea(event.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                companionPrompt
                                    ? "Finish adding it above first…"
                                    : ready
                                        ? "Want to change something? Type it here…"
                                        : hasChat
                                            ? "Type your reply…"
                                            : "Type your story idea here..."
                            }
                            rows={1}
                            disabled={isLoading || busy || !!companionPrompt}
                            className="min-h-12.5 max-h-30 flex-1 resize-none bg-transparent py-3 text-[17px] text-[#38345F] outline-none placeholder:text-[#9693A8] disabled:opacity-60"
                        />

                        <div className="mx-3 h-9 w-px bg-[#E7E3EF]" />

                        <button
                            type="button"
                            className="mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#5B3BC4] transition-all duration-200 hover:bg-[#F3EFFF] hover:text-[#4323B2]"
                            aria-label="Voice input"
                        >
                            <Mic size={24} />
                        </button>

                        <button
                            onClick={() => handleSubmit()}
                            disabled={!storyIdea.trim() || isLoading || busy || !!companionPrompt}
                            className="flex h-13 w-14.5 shrink-0 items-center justify-center rounded-[10px] bg-linear-to-r from-[#6539D5] to-[var(--accent-hover)] text-white shadow-[0_8px_20px_rgba(74,39,180,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(74,39,180,0.32)] active:translate-y-0 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Send"
                        >
                            <Send size={22} strokeWidth={2.3} />
                        </button>
                    </div>

                    <p className="mt-4 text-center text-[13px] text-[#777A9B]">
                        {busy
                            ? "Creating your book — this can take a few minutes, please keep this page open."
                            : "You can tell me anything — characters, theme, age group or even a simple idea."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AiBookCreation;