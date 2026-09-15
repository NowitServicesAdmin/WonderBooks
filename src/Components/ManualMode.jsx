import { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowRight,
    ArrowLeft,
    X,
    Cake,
    Palette,
    BookOpen,
    Image,
    Languages,
    Type,
    UserRound,
    Upload,
    Check,
    Sparkles,
    PawPrint,
    Package,
    Info,
    ImagePlus,
    MessageCircleHeart,

} from "lucide-react";
import {
    CalendarDays,
    Heart,
    Paperclip,
    Users,
    Utensils,

} from "lucide-react";
import { StepRail } from "./StepRail";

const STORY_OPTIONS = {
    age: [
        {
            id: "0-3",
            label: "0–3 years",
            description: "Big pictures, simple words, gentle rhythms.",
            image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598071/Screenshot_2026-09-05_141555-removebg-preview_svf4n5.png",
        },
        {
            id: "4-7",
            label: "4–7 years",
            description: "Playful plots with easy, repeatable vocabulary.",
            image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598071/Screenshot_2026-09-05_141555-removebg-preview_svf4n5.png",
        },
        {
            id: "8-13",
            label: "8–13 years",
            description: "Longer stories with richer plots and humor.",
            image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598071/Screenshot_2026-09-05_141555-removebg-preview_svf4n5.png",
        },
        {
            id: "13-17",
            label: "13–17 years",
            description: "Bigger themes for confident young readers.",
            image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598071/Screenshot_2026-09-05_141555-removebg-preview_svf4n5.png",
        },
        {
            id: "18-plus",
            label: "18+ years",
            description: "Nuanced, grown-up storytelling and tone.",
            image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598071/Screenshot_2026-09-05_141555-removebg-preview_svf4n5.png",
        },
    ],

    theme: [
        { id: "fairy-tales", label: "Fairy Tales", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598956/fairy-tales-unicorn_zzfzys.png" },
        { id: "adventure", label: "Adventure", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/adventure-map_ngbnx0.png" },
        { id: "activbities", label: "Activities", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/activities-playground_iu5nus.png" },
        { id: "worlds", label: "Worlds", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/worlds-globe_dihbim.png" },
        { id: "holidays", label: "Holidays", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/holidays-christmas-tree_ybo5qq.png" },
        { id: "family", label: "Family", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599390/family_bhsktq.png" },
        { id: "education", label: "Education", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599353/educational-alphabet-blocks_vyzp4a.png" },
        { id: "feelings", label: "Feelings", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599299/feelings-emotions_ce92zg.png" },
    ],

    subject: [
        { id: "nature", label: "FriendShip", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599985/caring-for-nature_kuqgaf.png" },
        { id: "science", label: "Courage", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599986/courage_ejvvxk.png" },
        { id: "history", label: "Nature", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599985/caring-for-nature_kuqgaf.png" },
        { id: "family", label: "Love", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599986/friendship_hpovlg.png" },
        { id: "feelings", label: "Preserverance", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599985/perseverance_qcmael.png" },
        { id: "love", label: "Sharing", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599985/sharing_dtthei.png" },
        { id: "honesty", label: "Honesty", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599984/honesty_hmugdg.png" },
        { id: "Respect", label: "Respect", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599985/respect_kyxzit.png" },
    ],
    centralmsg: [
        { id: "nature", label: "FriendShip", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599985/caring-for-nature_kuqgaf.png" },
        { id: "science", label: "Courage", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599986/courage_ejvvxk.png" },
        { id: "history", label: "Nature", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599985/caring-for-nature_kuqgaf.png" },
        { id: "family", label: "Love", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599986/friendship_hpovlg.png" },
        { id: "feelings", label: "Preserverance", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599985/perseverance_qcmael.png" },
        { id: "love", label: "Sharing", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599985/sharing_dtthei.png" },
        { id: "honesty", label: "Honesty", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599984/honesty_hmugdg.png" },
        { id: "Respect", label: "Respect", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599985/respect_kyxzit.png" },
    ],
    imageStyle: [
        { id: "normal", label: "Normal", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788602715/ChatGPT_Image_Sep_5_2026_03_15_54_PM_lizdnq.png" },
        { id: "cartoon", label: "Cartoon", image: "https://cdn-icons-png.flaticon.com/512/201/201623.png" },
        { id: "watercolor", label: "Watercolor", image: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png" },
        { id: "3d", label: "3D Animation", image: "https://cdn-icons-png.flaticon.com/512/2489/2489756.png" },
        { id: "storybook", label: "Classic Storybook", image: "https://cdn-icons-png.flaticon.com/512/3145/3145765.png" },
    ],

    language: [
        { id: "english", label: "English", emoji: "🇬🇧" },
        { id: "spanish", label: "Spanish", emoji: "🇪🇸" },
        { id: "french", label: "French", emoji: "🇫🇷" },
        { id: "german", label: "German", emoji: "🇩🇪" },
    ],

    font: [
        { id: "rounded", label: "Rounded & Playful", fontFamily: '"Baloo 2", "Comic Sans MS", cursive' },
        { id: "serif", label: "Classic Storybook", fontFamily: 'Georgia, "Times New Roman", serif' },
        { id: "handwritten", label: "Handwritten", fontFamily: '"Segoe Script", "Bradley Hand", cursive' },
        { id: "sans", label: "Clean & Modern", fontFamily: '"Poppins", "Helvetica Neue", Arial, sans-serif' },
    ],
};

const CHARACTER_TYPES = [
    { id: "person", label: "Person", icon: UserRound },
    { id: "animal", label: "Animal", icon: PawPrint },
    { id: "object", label: "Object", icon: Package },
];

/* -------------------------------------------------------------------------- */
/*                              PANEL METADATA                                */
/* -------------------------------------------------------------------------- */

const PANEL_META = {
    age: { icon: Cake, heading: "Age group", description: "Select the perfect age range for your story." },
    theme: { icon: Palette, heading: "Theme", description: "What kind of world should your story explore?" },
    subject: { icon: BookOpen, heading: "Subject", description: "What should your story focus on?" },
    centralmsg: { icon: MessageCircleHeart, heading: "Central message", description: "What's the takeaway you want readers to feel?" },
    imageStyle: { icon: Image, heading: "Image style", description: "Select how your story should look." },
    language: { icon: Languages, heading: "Language", description: "Select the language for your story." },
    font: { icon: Type, heading: "Font style", description: "Pick the lettering that fits the mood." },
};

const STEPS = [
    {
        id: "age-theme",
        number: 1,
        title: "choose Your Age ",
        subtitle: "Who it's for, and the mood we're setting",
        categories: ["age", "theme"],
        image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760656/Screenshot_2026-09-07_111515-Photoroom_duoph2.png"
    },
    {
        id: "subject",
        number: 2,
        title: "Subject",
        subtitle: "What should your story focus on?",
        categories: ["subject"],
        image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760470/Screenshot_2026-09-07_111521-Photoroom_e5cpyr.png"
    },
    {
        id: "centralmsg",
        number: 3,
        title: "Central Message",
        subtitle: "What's the takeaway you want readers to feel?",
        categories: ["centralmsg"],
        image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760470/Screenshot_2026-09-07_111528-Photoroom_p6dh2j.png"
    },
    {
        id: "imageStyle",
        number: 4,
        title: "Image Style",
        subtitle: "Pick the art style that brings it to life",
        categories: ["imageStyle"],
        image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760656/Screenshot_2026-09-07_111532-Photoroom_yktpxn.png"
    },
];

const CHARACTER_STEP = {
    id: "character",
    number: 5,
    title: "Character",
    subtitle: "Give your hero a name and a face",
    categories: [],
    optional: true,
    image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760470/Screenshot_2026-09-07_111538-Photoroom_tehazn.png"
};

const ALL_STEPS = [...STEPS, CHARACTER_STEP];

// help logic

const isStepComplete = (step, selections, characters) => {
    if (step.id === "character") return characters.length > 0;
    return step.categories.every((categoryId) => !!selections[categoryId]);
};

const getStepPreview = (step, selections, characters) => {
    if (step.id === "character") {
        if (characters.length === 0) return null;
        return characters.length === 1 ? characters[0].name : `${characters.length} characters added`;
    }
    const labels = step.categories.map((categoryId) => selections[categoryId]?.label).filter(Boolean);
    if (labels.length === 0) return null;
    return labels.join(", ");
};

/* -------------------------------------------------------------------------- */
/*                        ANIMATION KEYFRAMES (once)                          */
/* -------------------------------------------------------------------------- */

const AnimationStyles = () => (
    <style>{`
        @keyframes chipDrop {
            0%   { transform: translateY(-14px) scale(0.85); opacity: 0; }
            55%  { transform: translateY(3px) scale(1.05);  opacity: 1; }
            75%  { transform: translateY(-2px) scale(0.98); }
            100% { transform: translateY(0) scale(1); }
        }
        .animate-chip-drop {
            animation: chipDrop 480ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .option-flying-ghost {
            transition-property: top, left, width, height, opacity, transform;
            transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes cardFadeIn {
            0%   { opacity: 0; transform: translateY(10px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-card-fade-in {
            animation: cardFadeIn 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes selectPulse {
            0%   { box-shadow: 0 0 0 0 rgba(105,71,215,0.35); }
            100% { box-shadow: 0 0 0 10px rgba(105,71,215,0); }
        }
        .animate-select-pulse {
            animation: selectPulse 600ms ease-out;
        }
    `}</style>
);
/* -------------------------------------------------------------------------- */
/*                          SELECTION SUMMARY (top bar)                       */
/* -------------------------------------------------------------------------- */

const SelectionSummaryBar = ({ step, selections, animatingSet, chipRefs }) => {
    return (
        <div className="mb-5 flex flex-wrap gap-3">
            {step.categories.map((categoryId) => {
                const meta = PANEL_META[categoryId];
                const Icon = meta?.icon;
                const option = selections[categoryId];
                const isAnimating = animatingSet.has(categoryId);
                const showValue = option && !isAnimating;

                return (
                    <div
                        key={categoryId}
                        ref={(el) => {
                            chipRefs.current[categoryId] = el;
                        }}
                        className={`
                            flex h-[56px] min-w-[168px] items-center gap-3 rounded-[16px] border px-3.5
                            transition-colors duration-200
                            ${showValue
                                ? "border-[#d9cdf5] bg-white shadow-[0_6px_16px_rgba(105,71,215,0.10)]"
                                : "border-dashed border-[#e2ddea] bg-[#faf8ff]"
                            }
                        `}
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eee9ff] text-[#6241cc]">
                            {Icon && <Icon size={16} />}
                        </div>

                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#a79fc0]">
                                {meta?.heading}
                            </p>
                            {showValue ? (
                                <p key={option.id} className="animate-chip-drop truncate text-[13px] font-bold text-[#3f3b53]">
                                    {option.label}
                                </p>
                            ) : (
                                <p className="text-[12px] text-[#b6afc4]">
                                    {isAnimating ? "…" : "Not selected"}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*                              FLYING GHOST LAYER                            */
/* -------------------------------------------------------------------------- */

const FlyingGhost = ({ ghost, onLanded }) => {
    const [landed, setLanded] = useState(false);

    useEffect(() => {
        const raf1 = requestAnimationFrame(() => {
            const raf2 = requestAnimationFrame(() => setLanded(true));
            return () => cancelAnimationFrame(raf2);
        });
        return () => cancelAnimationFrame(raf1);
    }, []);

    const rect = landed ? ghost.target : ghost.source;

    return (
        <div
            className="option-flying-ghost pointer-events-none fixed z-[999] flex items-center justify-center overflow-hidden rounded-[16px] border border-[#d9cdf5] bg-white shadow-[0_16px_34px_rgba(105,71,215,0.30)]"
            style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                opacity: landed ? 0.15 : 1,
                transitionDuration: "520ms",
            }}
            onTransitionEnd={(event) => {
                if (event.propertyName === "top") onLanded(ghost.key);
            }}
        >
            {ghost.option.image ? (
                <img src={ghost.option.image} alt="" className="h-8 w-8 object-contain" />
            ) : ghost.option.emoji ? (
                <span className="text-xl leading-none">{ghost.option.emoji}</span>
            ) : ghost.option.fontFamily ? (
                <span style={{ fontFamily: ghost.option.fontFamily }} className="text-lg font-bold">
                    Aa
                </span>
            ) : (
                <span className="text-[11px] font-bold text-[#6947d7]">{ghost.option.label}</span>
            )}
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*                                OPTION CARDS                                */
/* -------------------------------------------------------------------------- */

const CompactOptionCard = ({ option, isSelected, onSelect, index = 0 }) => {
    return (
        <button
            type="button"
            onClick={(event) => onSelect(option, event)}
            style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
            className={`
        group relative aspect-square
        animate-card-fade-in
        rounded-[20px] border 
        transition-all duration-200
        h-[150px] w-[150px]

        ${isSelected
                    ? "border-[#7252dc] bg-[#f6f2ff] shadow-[0_10px_24px_rgba(105,71,215,0.16)] animate-select-pulse"
                    : "border-[#e5e1eb] bg-white hover:-translate-y-0.5 hover:border-[#c9bce9] hover:shadow-[0_8px_20px_rgba(87,67,150,0.08)]"
                }
      `}
        >
            {isSelected && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#6947d7] text-white">
                    <Check size={14} strokeWidth={3} />
                </div>
            )}

            <div className="flex h-full flex-col items-center justify-center">
                <div className="flex h-[62%] items-center justify-center">
                    {option.fontFamily ? (
                        <span
                            style={{ fontFamily: option.fontFamily }}
                            className="text-[46px] font-bold leading-none text-[#4c4457]"
                        >
                            Aa
                        </span>
                    ) : option.image ? (
                        <img
                            src={option.image}
                            alt={option.label}
                            className="h-[70px] w-[70px] object-contain transition-transform duration-200 group-hover:scale-105"
                        />
                    ) : (
                        <span className="text-[52px] leading-none">{option.emoji}</span>
                    )}
                </div>

                <div className="flex min-h-[38px] items-center justify-center">
                    <span
                        className={`text-center text-[14px] font-bold leading-[1.25] ${isSelected ? "text-[#6041ca]" : "text-[#3f4254]"
                            }`}
                    >
                        {option.label}
                    </span>
                </div>
            </div>
        </button>
    );
};

/* Wider card, with a description line — used for Age. */
const AgeOptionCard = ({ option, isSelected, onSelect }) => {
    return (
        <button
            type="button"
            onClick={(event) => onSelect(option, event)}
            className={`
                group relative flex w-[240px] shrink-0 items-center gap-4
                rounded-[20px] border p-4 text-left
                transition-all duration-200

                ${isSelected
                    ? "border-[#7252dc] bg-[#f6f2ff] shadow-[0_10px_24px_rgba(105,71,215,0.16)]"
                    : "border-[#e5e1eb] bg-white hover:-translate-y-0.5 hover:border-[#c9bce9] hover:shadow-[0_8px_20px_rgba(87,67,150,0.08)]"
                }
            `}
        >
            {isSelected && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#6947d7] text-white">
                    <Check size={14} strokeWidth={3} />
                </div>
            )}

            <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-[16px] bg-[#faf8ff]">
                <img
                    src={option.image}
                    alt={option.label}
                    className="h-[46px] w-[46px] object-contain transition-transform duration-200 group-hover:scale-105"
                />
            </div>

            <div className="min-w-0">
                <p className={`text-[15px] font-bold leading-tight ${isSelected ? "text-[#6041ca]" : "text-[#3f4254]"}`}>
                    {option.label}
                </p>
                <p className="mt-1 text-[11.5px] leading-snug text-[#8d879a]">{option.description}</p>
            </div>
        </button>
    );
};

/* -------------------------------------------------------------------------- */
/*                              CATEGORY SECTIONS                             */
/* -------------------------------------------------------------------------- */

const AgeSection = ({ selectedOption, onSelect }) => {
    const meta = PANEL_META.age;
    const Icon = meta.icon;

    return (
        <div className="rounded-[22px] border border-[#eeeaf2] bg-white p-5">
            <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#eee9ff] text-[#6241cc]">
                    <Icon size={15} />
                </div>
                <div>
                    <h3 className="text-[14px] font-bold text-[#3f3b53]">{meta.heading}</h3>
                    <p className="text-[11px] text-[#928c9c]">{meta.description}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3.5">
                {STORY_OPTIONS.age.map((option) => (
                    <AgeOptionCard
                        key={option.id}
                        option={option}
                        isSelected={selectedOption?.id === option.id}
                        onSelect={(value, event) => onSelect("age", value, event)}
                    />
                ))}
            </div>
        </div>
    );
};

const ThemeSection = ({ selectedOption, onSelect }) => {
    const meta = PANEL_META.theme;
    const Icon = meta.icon;

    return (
        <div className="rounded-[22px] border border-[#eeeaf2] bg-[#fbfaff] p-5">
            <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#eee9ff] text-[#6241cc]">
                    <Icon size={15} />
                </div>

                <div>
                    <h3 className="text-[14px] font-bold text-[#3f3b53]">
                        {meta.heading}
                    </h3>
                    <p className="text-[11px] text-[#928c9c]">
                        {meta.description}
                    </p>
                </div>
            </div>

           /* ThemeSection — grid wrapper */
            <div
                className="
        grid
        w-full
        grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6
        gap-2
        overflow-hidden
        py-1
    "
            >
                {STORY_OPTIONS.theme.map((option) => (
                    <CompactOptionCard
                        key={option.id}
                        option={option}
                        isSelected={selectedOption?.id === option.id}
                        onSelect={(value, event) => onSelect("theme", value, event)}
                    />
                ))}
            </div>
        </div>
    );
};

/* Generic panel used for every other step (subject, centralmsg, imageStyle, language, font). */

const CategoryPanel = ({ categoryId, selectedOption, onSelect, showHeader }) => {
    const meta = PANEL_META[categoryId];
    const options = STORY_OPTIONS[categoryId] || [];
    const Icon = meta?.icon;

    return (
        <div
            className={
                showHeader
                    ? "rounded-[20px] border border-[#eeeaf2] bg-white p-5"
                    : ""
            }
        >
            {showHeader && (
                <div className="mb-4 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#eee9ff] text-[#6241cc]">
                        {Icon && <Icon size={15} />}
                    </div>
                    <div>
                        <h3 className="text-[14px] font-bold text-[#3f3b53]">{meta?.heading}</h3>
                        <p className="text-[11px] text-[#928c9c]">{meta?.description}</p>
                    </div>
                </div>
            )}

            <div className="
        grid
        w-full min-w-0
        grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
        gap-3.5
        overflow-hidden
        py-1
    "
            >
                {options.map((option, index) => (
                    <CompactOptionCard
                        key={option.id}
                        option={option}
                        index={
                            index
                        }
                        isSelected={selectedOption?.id === option.id}
                        onSelect={(value, event) => onSelect(categoryId, value, event)}
                    />
                ))}
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*                              STEP WORKSPACE                                */
/* -------------------------------------------------------------------------- */

const StepWorkspace = ({ step, selections, onSelect }) => {
    const hasMultiplePanels = step.categories.length > 1;
    const isAgeThemeStep = step.id === "age-theme";

    const chipRefs = useRef({});
    const [flyingGhosts, setFlyingGhosts] = useState([]);
    const [animatingSet, setAnimatingSet] = useState(() => new Set());

    const handleSelectWithFlight = (categoryId, option, event) => {
        const sourceEl = event?.currentTarget;
        const targetEl = chipRefs.current[categoryId];

        // Update the real selection right away so downstream logic
        // (step completion, auto-advance) is never blocked by the animation.
        onSelect(categoryId, option);

        if (!sourceEl || !targetEl) return;

        const sourceRect = sourceEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const key = `${categoryId}-${option.id}-${Date.now()}`;

        setAnimatingSet((previous) => new Set(previous).add(categoryId));

        setFlyingGhosts((previous) => [
            ...previous,
            {
                key,
                categoryId,
                option,
                source: {
                    top: sourceRect.top,
                    left: sourceRect.left,
                    width: sourceRect.width,
                    height: sourceRect.height,
                },
                target: {
                    top: targetRect.top + targetRect.height / 2 - 12,
                    left: targetRect.left + 10,
                    width: 24,
                    height: 24,
                },
            },
        ]);
    };

    const handleGhostLanded = (key) => {
        setFlyingGhosts((previous) => {
            const ghost = previous.find((item) => item.key === key);
            if (ghost) {
                setAnimatingSet((prevSet) => {
                    const next = new Set(prevSet);
                    next.delete(ghost.categoryId);
                    return next;
                });
            }
            return previous.filter((item) => item.key !== key);
        });
    };

    return (
        <section
            className="
        flex h-full min-h-0 flex-1 flex-col
        rounded-[26px] border border-[#e6e1ee] 
        p-6 shadow-[0_10px_30px_rgba(87,67,150,0.05)]
      "
        >
            <AnimationStyles />

            <div className="shrink-0 border-[#eeeaf2]">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#eee9ff] text-[#6241cc]">
                        <Sparkles size={19} />
                    </div>
                    <div>
                        <h2 className="text-[14px] text-[#291ef5]">{step.title}</h2>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-6">
                {/* <SelectionSummaryBar
                    step={step}
                    selections={selections}
                    animatingSet={animatingSet}
                    chipRefs={chipRefs}
                />

                {isAgeThemeStep ? (
                    <div className="space-y-5 overflow-hidden">
                        <AgeSection selectedOption={selections.age} onSelect={handleSelectWithFlight} />
                        <ThemeSection selectedOption={selections.theme} onSelect={handleSelectWithFlight} />
                    </div>
                ) : ( */}
                <div className="space-y-5">
                    {step.categories.map((categoryId) => (
                        <CategoryPanel
                            key={categoryId}
                            categoryId={categoryId}
                            selectedOption={selections[categoryId]}
                            onSelect={handleSelectWithFlight}
                            showHeader={hasMultiplePanels}
                        />
                    ))}
                </div>
                {/* )} */}
            </div>

            {flyingGhosts.map((ghost) => (
                <FlyingGhost key={ghost.key} ghost={ghost} onLanded={handleGhostLanded} />
            ))}
        </section>
    );
};

export const CharacterWorkspace = ({ characters, setCharacters }) => {
    const [characterType, setCharacterType] = useState("person");

    const [formData, setFormData] = useState({
        name: "",
        gender: "",
        age: "",
        hobbies: "",
        favouriteFood: "",
        photo: null,
    });

    const fileInputRef = useRef(null);

    // helpers
    const emptyForm = () => ({
        name: "",
        gender: "",
        age: "",
        hobbies: "",
        favouriteFood: "",
        photo: null,
    });

    const getCharacterForType = (type, source = characters) => {
        return source.find((character) => character.type === type);
    };

    //   onChange FUnctions
    const handleChange = (field, value) => {
        setFormData((previous) => ({
            ...previous,
            [field]: value,
        }));
    };
    // save current tab 
    const saveCurrentTab = (type = characterType, data = formData) => {
        // Don't create an empty character just because the user
        // clicked another tab.
        if (!data.name?.trim()) {
            return;
        }

        setCharacters((previous) => {
            const existingIndex = previous.findIndex(
                (character) => character.type === type
            );

            const character = {
                id:
                    existingIndex >= 0
                        ? previous[existingIndex].id
                        : Date.now(),
                type,
                ...data,
            };

            // UPDATE instead of adding another one.
            if (existingIndex >= 0) {
                return previous.map((item, index) =>
                    index === existingIndex ? character : item
                );
            }
            // First character for this type.
            return [...previous, character];
        });
    };
    // 

    const handleCharacterTypeChange = (nextType) => {
        if (nextType === characterType) return;

        /*
         * First store whatever the user entered in the current tab.
         */
        saveCurrentTab(characterType, formData);

        /*
         * Then load the saved character for the new tab.
         *
         * Because `characters` may contain the previously saved
         * character, find it here.
         */
        const savedCharacter = getCharacterForType(nextType);

        if (savedCharacter) {
            setFormData({
                name: savedCharacter.name || "",
                gender: savedCharacter.gender || "",
                age: savedCharacter.age || "",
                hobbies: savedCharacter.hobbies || "",
                favouriteFood: savedCharacter.favouriteFood || "",
                photo: savedCharacter.photo || null,
            });
        } else {
            setFormData(emptyForm());
        }

        setCharacterType(nextType);
    };

    //   photo upload
    const handlePhotoUpload = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        setFormData((previous) => {
            if (previous.photo?.preview) {
                URL.revokeObjectURL(previous.photo.preview);
            }
            return {
                ...previous,

                photo: {
                    file,
                    preview: URL.createObjectURL(file),
                    name: file.name,
                },
            };
        });

        event.target.value = "";
    };

    const removePhoto = () => {
        if (formData.photo?.preview) {
            URL.revokeObjectURL(formData.photo.preview);
        }

        setFormData((previous) => ({
            ...previous,
            photo: null,
        }));
    };


    const handleSaveCharacter = () => {
        if (!formData.name.trim()) return;

        setCharacters((previous) => {
            const existingIndex = previous.findIndex(
                (character) => character.type === characterType
            );

            const character = {
                id:
                    existingIndex >= 0
                        ? previous[existingIndex].id
                        : Date.now(),

                type: characterType,

                ...formData,
            };

            if (existingIndex >= 0) {
                return previous.map((item, index) =>
                    index === existingIndex ? character : item
                );
            }

            return [...previous, character];
        });
    };

    const genderOptions = [
        {
            id: "female",
            label: "Girl",
            emoji: "👧",
            selectedClass: "border-[#f7bfd1] bg-[#fff2f6]",
            dotClass: "border-[#ee7fa4]",
        },
        {
            id: "male",
            label: "Boy",
            emoji: "👦",
            selectedClass: "border-[#bfd8fb] bg-[#f1f7ff]",
            dotClass: "border-[#79a9ed]",
        },
        {
            id: "non-binary",
            label: "Other",
            emoji: "🌈",
            selectedClass: "border-[#cce7c9] bg-[#f3fbf1]",
            dotClass: "border-[#8fc58b]",
        },
    ];

    // styles
    const inputClass = `
        h-[52px]
        w-full
        rounded-[15px]
        border
        border-[#e3deea]
        bg-[#fcfbfd]
        text-[14px]
        text-[#4b4655]
        outline-none
        transition-all
        placeholder:text-[#b2acb9]
        focus:border-[#8062db]
        focus:bg-white
        focus:ring-4
        focus:ring-[#eee9ff]
    `;

    const textareaClass = `
        min-h-[108px]
        w-full
        resize-none
        rounded-[15px]
        border
        border-[#e3deea]
        bg-[#fcfbfd]
        px-11
        py-3.5
        text-[13px]
        leading-relaxed
        text-[#4b4655]
        outline-none
        transition-all
        placeholder:text-[#b2acb9]
        focus:border-[#8062db]
        focus:bg-white
        focus:ring-4
        focus:ring-[#eee9ff]
    `;

    //    check
    const currentCharacter = getCharacterForType(characterType);
    return (
        <section
            className="
                flex
                h-full
                min-h-0
                flex-1
                flex-col
                overflow-hidden
                rounded-[26px]
                border
                border-[#e6e1ee]
                bg-white
                shadow-[0_10px_30px_rgba(87,67,150,0.05)]
            "
        >
            {/* =========================================================
                HEADER
            ========================================================= */}

            <div
                className="
                    flex
                    shrink-0
                    items-center
                    justify-between
                    border-b
                    border-[#eeeaf3]
                    bg-gradient-to-r
                    from-[#faf8ff]
                    to-white
                    px-7
                    py-5
                "
            >
                <div className="flex items-center gap-4">
                    <div
                        className="
                            flex
                            h-11
                            w-11
                            items-center
                            justify-center
                            rounded-[14px]
                            bg-[#eee8ff]
                            text-[#6543cf]
                        "
                    >
                        <UserRound size={21} />
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-[22px] font-bold text-[#39354c]">
                                Character Illustration
                            </h2>

                            <Sparkles
                                size={17}
                                className="text-[#dba51e]"
                                fill="currentColor"
                            />
                        </div>

                        <p className="mt-1 text-[12px] text-[#90899c]">
                            Tell us about your character and we'll bring them
                            to life.
                        </p>
                    </div>
                </div>

                <div
                    className="
                        rounded-full
                        bg-[#f0ebff]
                        px-3
                        py-1.5
                        text-[11px]
                        font-semibold
                        text-[#6745d0]
                    "
                >
                    Optional
                </div>
            </div>

            {/* =========================================================
                CONTENT
            ========================================================= */}

            <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5">

                {/* =========================================================
    CHARACTER TYPE
    KEEPING THE ORIGINAL BUTTON DESIGN
========================================================= */}

                <div>
                    <div className="mb-3">
                        <h3 className="text-[14px] font-bold text-[#4b4658]">
                            Choose the type of character
                        </h3>

                        <p className="mt-1 text-[11px] text-[#9b95a5]">
                            Select what kind of character you want to create.
                        </p>
                    </div>

                    {/* ORIGINAL BUTTON STYLE */}
                    <div className="flex gap-3">
                        {CHARACTER_TYPES.map((type) => {
                            const Icon = type.icon;

                            const isSelected =
                                characterType === type.id;

                            return (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() =>
                                        handleCharacterTypeChange(type.id)
                                    }
                                    className={`
                        flex
                        h-[48px]
                        items-center
                        gap-2.5
                        rounded-[14px]
                        border
                        px-5
                        text-[14px]
                        font-semibold
                        transition-all
                        duration-200

                        ${isSelected
                                            ? `
                                    border-[#6947d7]
                                    bg-[#6947d7]
                                    text-white
                                    shadow-[0_7px_18px_rgba(105,71,215,0.22)]
                                `
                                            : `
                                    border-[#e2ddea]
                                    bg-white
                                    text-[#676174]
                                    hover:border-[#cbbdea]
                                    hover:bg-[#faf8ff]
                                `
                                        }
                    `}
                                >
                                    <Icon size={18} />

                                    {type.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="my-6 border-t border-dashed border-[#e7e1ed]" />
                <div className="my-6 border-t border-dashed border-[#e7e1ed]" />

                {/* =====================================================
                    CHARACTER DETAILS
                    ONLY DETAILS FOR CURRENT TAB
                ===================================================== */}

                <div>
                    <div className="mb-4 flex items-center gap-2">
                        <div
                            className="
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-[10px]
                                bg-[#f1edff]
                                text-[#6b4bd3]
                            "
                        >
                            <UserRound size={16} />
                        </div>

                        <div>
                            <h3 className="text-[15px] font-bold text-[#464151]">
                                {CHARACTER_TYPES.find(
                                    (type) => type.id === characterType
                                )?.label || "Character"}{" "}
                                details
                            </h3>

                            <p className="mt-0.5 text-[11px] text-[#9b95a5]">
                                {currentCharacter
                                    ? "Your saved details are shown below. You can update them anytime."
                                    : "Add the details you'd like to use for this character."}
                            </p>
                        </div>
                    </div>

                    {/* =================================================
                        NAME + AGE + GENDER
                    ================================================= */}

                    <div
                        className="
                            grid
                            grid-cols-[minmax(0,1.5fr)_minmax(110px,0.7fr)_minmax(300px,1.45fr)]
                            gap-4
                        "
                    >
                        {/* NAME */}

                        <div>
                            <label
                                className="
                                    mb-2
                                    flex
                                    items-center
                                    gap-1.5
                                    text-[12px]
                                    font-semibold
                                    text-[#585261]
                                "
                            >
                                <UserRound
                                    size={14}
                                    className="text-[#8870c9]"
                                />

                                Main character name
                            </label>

                            <div className="relative">
                                <UserRound
                                    size={17}
                                    className="
                                        pointer-events-none
                                        absolute
                                        left-4
                                        top-1/2
                                        -translate-y-1/2
                                        text-[#aaa2b2]
                                    "
                                />

                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(event) =>
                                        handleChange(
                                            "name",
                                            event.target.value
                                        )
                                    }
                                    placeholder="e.g. Emma, Leo, Luna..."
                                    className={`${inputClass} pl-11 pr-4`}
                                />
                            </div>
                        </div>

                        {/* AGE */}

                        <div>
                            <label
                                className="
                                    mb-2
                                    flex
                                    items-center
                                    gap-1.5
                                    text-[12px]
                                    font-semibold
                                    text-[#585261]
                                "
                            >
                                <CalendarDays
                                    size={14}
                                    className="text-[#8870c9]"
                                />

                                Age
                            </label>

                            <div className="relative">
                                <CalendarDays
                                    size={17}
                                    className="
                                        pointer-events-none
                                        absolute
                                        left-4
                                        top-1/2
                                        -translate-y-1/2
                                        text-[#aaa2b2]
                                    "
                                />

                                <input
                                    type="number"
                                    min="0"
                                    value={formData.age}
                                    onChange={(event) =>
                                        handleChange(
                                            "age",
                                            event.target.value
                                        )
                                    }
                                    placeholder="e.g. 7"
                                    className={`${inputClass} pl-11 pr-3`}
                                />
                            </div>
                        </div>

                        {/* GENDER */}

                        <div>
                            <label
                                className="
                                    mb-2
                                    flex
                                    items-center
                                    gap-1.5
                                    text-[12px]
                                    font-semibold
                                    text-[#585261]
                                "
                            >
                                <Users
                                    size={14}
                                    className="text-[#8870c9]"
                                />

                                Gender
                            </label>

                            <div className="grid h-[52px] grid-cols-3 gap-2">
                                {genderOptions.map((option) => {
                                    const isSelected =
                                        formData.gender === option.id;

                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() =>
                                                handleChange(
                                                    "gender",
                                                    option.id
                                                )
                                            }
                                            className={`
                                                flex
                                                min-w-0
                                                items-center
                                                justify-center
                                                gap-2
                                                rounded-[14px]
                                                border
                                                px-2.5
                                                text-[12px]
                                                font-semibold
                                                transition-all
                                                duration-200

                                                ${isSelected
                                                    ? option.selectedClass
                                                    : `
                                                            border-[#e3deea]
                                                            bg-[#fcfbfd]
                                                            text-[#686171]
                                                            hover:border-[#cfc5de]
                                                            hover:bg-white
                                                        `
                                                }
                                            `}
                                        >
                                            <span
                                                className={`
                                                    flex
                                                    h-[21px]
                                                    w-[21px]
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-full
                                                    border-2
                                                    bg-white
                                                    ${option.dotClass}
                                                `}
                                            >
                                                {isSelected && (
                                                    <span
                                                        className="
                                                            h-2.5
                                                            w-2.5
                                                            rounded-full
                                                            bg-current
                                                        "
                                                    />
                                                )}
                                            </span>

                                            <span className="text-[17px] leading-none">
                                                {option.emoji}
                                            </span>

                                            <span className="truncate">
                                                {option.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* =================================================
                        HOBBIES + FOOD
                    ================================================= */}

                    <div className="mt-5 grid grid-cols-2 gap-4">

                        {/* HOBBIES */}

                        <div>
                            <label
                                className="
                                    mb-2
                                    flex
                                    items-center
                                    gap-1.5
                                    text-[12px]
                                    font-semibold
                                    text-[#585261]
                                "
                            >
                                <Heart
                                    size={14}
                                    className="text-[#8870c9]"
                                />

                                Hobbies & interests

                                <span
                                    className="
                                        ml-0.5
                                        text-[10px]
                                        font-normal
                                        text-[#aaa3b0]
                                    "
                                >
                                    Optional
                                </span>
                            </label>

                            <div className="relative">
                                <Heart
                                    size={17}
                                    className="
                                        pointer-events-none
                                        absolute
                                        left-4
                                        top-4
                                        text-[#aaa2b2]
                                    "
                                />

                                <textarea
                                    value={formData.hobbies}
                                    onChange={(event) =>
                                        handleChange(
                                            "hobbies",
                                            event.target.value
                                        )
                                    }
                                    placeholder="e.g. Drawing, cycling, playing football..."
                                    className={textareaClass}
                                />
                            </div>
                        </div>

                        {/* FAVOURITE FOOD */}

                        <div>
                            <label
                                className="
                                    mb-2
                                    flex
                                    items-center
                                    gap-1.5
                                    text-[12px]
                                    font-semibold
                                    text-[#585261]
                                "
                            >
                                <Utensils
                                    size={14}
                                    className="text-[#8870c9]"
                                />

                                Favourite food

                                <span
                                    className="
                                        ml-0.5
                                        text-[10px]
                                        font-normal
                                        text-[#aaa3b0]
                                    "
                                >
                                    Optional
                                </span>
                            </label>

                            <div className="relative">
                                <Utensils
                                    size={17}
                                    className="
                                        pointer-events-none
                                        absolute
                                        left-4
                                        top-4
                                        text-[#aaa2b2]
                                    "
                                />

                                <textarea
                                    value={formData.favouriteFood}
                                    onChange={(event) =>
                                        handleChange(
                                            "favouriteFood",
                                            event.target.value
                                        )
                                    }
                                    placeholder="e.g. Pizza, ice cream, mangoes..."
                                    className={textareaClass}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    CHARACTER PHOTO
                ===================================================== */}

                <div className="mt-6">
                    <div className="mb-3">
                        <div className="flex items-center gap-2">
                            <div
                                className="
                                    flex
                                    h-8
                                    w-8
                                    items-center
                                    justify-center
                                    rounded-[10px]
                                    bg-[#f1edff]
                                    text-[#6b4bd3]
                                "
                            >
                                <ImagePlus size={16} />
                            </div>

                            <h3 className="text-[14px] font-bold text-[#4c4657]">
                                Character reference photo
                            </h3>

                            <span
                                className="
                                    rounded-full
                                    bg-[#f4f0fa]
                                    px-2
                                    py-0.5
                                    text-[10px]
                                    font-medium
                                    text-[#9991a3]
                                "
                            >
                                Optional
                            </span>
                        </div>

                        <p className="mt-1 text-[11px] text-[#9c96a5]">
                            Add a photo to help create a more personalised
                            character.
                        </p>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                    />

                    {/* =================================================
                        NO PHOTO
                    ================================================= */}

                    {!formData.photo ? (
                        <button
                            type="button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            className="
                                flex
                                h-[64px]
                                w-full
                                items-center
                                justify-between
                                rounded-[15px]
                                border
                                border-dashed
                                border-[#d9d1e4]
                                bg-[#fcfbfd]
                                px-4
                                text-left
                                transition-all
                                duration-200
                                hover:border-[#9278dc]
                                hover:bg-[#faf8ff]
                            "
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="
                                        flex
                                        h-9
                                        w-9
                                        items-center
                                        justify-center
                                        rounded-[11px]
                                        bg-[#eee9ff]
                                        text-[#6848cf]
                                    "
                                >
                                    <ImagePlus size={17} />
                                </div>

                                <div>
                                    <p
                                        className="
                                            text-[12px]
                                            font-semibold
                                            text-[#615b6d]
                                        "
                                    >
                                        Add character photo
                                    </p>

                                    <p
                                        className="
                                            mt-0.5
                                            text-[10px]
                                            text-[#aaa4b0]
                                        "
                                    >
                                        PNG, JPG or WEBP
                                    </p>
                                </div>
                            </div>

                            <div
                                className="
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-[10px]
                                    border
                                    border-[#e2dbe9]
                                    bg-white
                                    text-[#756b81]
                                    shadow-sm
                                "
                            >
                                <Paperclip size={17} />
                            </div>
                        </button>
                    ) : (


                        <div
                            className="
                                flex
                                items-center
                                gap-3
                                rounded-[15px]
                                border
                                border-[#ded5eb]
                                bg-[#faf8fd]
                                p-2.5
                            "
                        >
                            <img
                                src={formData.photo.preview}
                                alt="Selected character reference"
                                className="
                                    h-[48px]
                                    w-[48px]
                                    rounded-[10px]
                                    object-cover
                                "
                            />

                            <div className="min-w-0 flex-1">
                                <p
                                    className="
                                        text-[12px]
                                        font-semibold
                                        text-[#4d4757]
                                    "
                                >
                                    Photo selected
                                </p>

                                <p
                                    className="
                                        mt-0.5
                                        truncate
                                        text-[10px]
                                        text-[#96909f]
                                    "
                                >
                                    {formData.photo.name}
                                </p>
                            </div>

                            {/* CHANGE PHOTO */}

                            <button
                                type="button"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                className="
                                    flex
                                    h-8
                                    w-8
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-[9px]
                                    border
                                    border-[#e3dce9]
                                    bg-white
                                    text-[#756b81]
                                    hover:border-[#cbbde0]
                                    hover:text-[#6947d7]
                                "
                                title="Change photo"
                            >
                                <Paperclip size={15} />
                            </button>

                            {/* REMOVE PHOTO */}

                            <button
                                type="button"
                                onClick={removePhoto}
                                className="
                                    flex
                                    h-8
                                    w-8
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-[9px]
                                    border
                                    border-[#eee3e8]
                                    bg-white
                                    text-[#a19aa8]
                                    hover:border-[#efcaca]
                                    hover:text-[#d35d5d]
                                "
                                title="Remove photo"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    )}

                    <div
                        className="
                            mt-3
                            flex
                            items-start
                            gap-2.5
                            rounded-[13px]
                            border
                            border-[#eee3c9]
                            bg-[#fffaf0]
                            px-4
                            py-3
                        "
                    >
                        <Info
                            size={16}
                            className="mt-0.5 shrink-0 text-[#d79a24]"
                        />

                        <p
                            className="
                                text-[11px]
                                leading-relaxed
                                text-[#887c65]
                            "
                        >
                            For the best result, use a clear photo where
                            the character is clearly visible. A full-body
                            image works best for illustrations.
                        </p>
                    </div>
                </div>
            </div>

            {/* =========================================================
                FOOTER
            ========================================================= */}

            <div
                className="
                    flex
                    shrink-0
                    items-center
                    justify-between
                    border-t
                    border-[#eeeaf3]
                    bg-white
                    px-7
                    py-4
                "
            >
                <div>
                    {currentCharacter ? (
                        <p className="text-[11px] text-[#8e8798]">
                            {CHARACTER_TYPES.find(
                                (type) => type.id === characterType
                            )?.label}{" "}
                            character saved. You can update the details.
                        </p>
                    ) : (
                        <p className="text-[11px] text-[#a09aa9]">
                            You can create one character for each type.
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleSaveCharacter}
                    disabled={!formData.name.trim()}
                    className={`
                        flex
                        h-[46px]
                        items-center
                        gap-2
                        rounded-[13px]
                        px-5
                        text-[13px]
                        font-bold
                        transition-all

                        ${formData.name.trim()
                            ? `
                                    bg-[#6947d7]
                                    text-white
                                    shadow-[0_8px_18px_rgba(105,71,215,0.22)]
                                    hover:bg-[#5e3ccc]
                                `
                            : `
                                    cursor-not-allowed
                                    bg-[#eeebf4]
                                    text-[#aaa4b2]
                                `
                        }
                    `}
                >
                    <ImagePlus size={17} />

                    {currentCharacter
                        ? "Update Character"
                        : "Add Character"}
                </button>
            </div>
        </section>
    );
};
/* -------------------------------------------------------------------------- */
/*                                BOTTOM NAV                                  */
/* -------------------------------------------------------------------------- */

const BottomNav = ({ isFirst, isLast, primaryDisabled, primaryLabel, onBack, onPrimary }) => {
    return (
        <div className="flex shrink-0 items-center justify-between">
            <button
                type="button"
                onClick={onBack}
                disabled={isFirst}
                className={`
          flex h-[46px] items-center gap-2 rounded-[13px] px-5
          text-[13px] font-bold transition-all

          ${isFirst ? "invisible" : "border border-[#e2ddea] bg-white text-[#5d5670] hover:bg-[#faf8ff]"}
        `}
            >
                <ArrowLeft size={16} />
                Back
            </button>

            <button
                type="button"
                onClick={onPrimary}
                disabled={primaryDisabled}
                className={`
          flex h-[46px] items-center gap-2 rounded-[13px] px-6
          text-[13px] font-bold transition-all duration-200

          ${primaryDisabled
                        ? "cursor-not-allowed bg-[#eeeaf4] text-[#aaa4b5]"
                        : "bg-[#6947d7] text-white shadow-[0_8px_18px_rgba(105,71,215,0.22)] hover:-translate-y-0.5 hover:bg-[#5e3dcc]"
                    }
        `}
            >
                {primaryLabel}
                {!isLast && <ArrowRight size={16} />}
                {isLast && <Sparkles size={16} />}
            </button>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*                                MANUAL MODE                                 */
/* -------------------------------------------------------------------------- */

export const ManualMode = () => {
    const [activeStepId, setActiveStepId] = useState(STEPS[0].id);

    const [selections, setSelections] = useState({
        age: null,
        theme: null,
        subject: null,
        centralmsg: null,
        imageStyle: null,
        language: null,
        font: null,
    });

    const [characters, setCharacters] = useState([]);

    const activeStepIndex = useMemo(
        () => ALL_STEPS.findIndex((step) => step.id === activeStepId),
        [activeStepId],
    );

    const activeStep = ALL_STEPS[activeStepIndex];
    const isCharacterStep = activeStep.id === "character";
    const isFirstStep = activeStepIndex === 0;
    const isLastStep = activeStepIndex === ALL_STEPS.length - 1;

    const completedMainSteps = useMemo(
        () => STEPS.filter((step) => isStepComplete(step, selections, characters)).length,
        [selections, characters],
    );



    const handleOptionSelect = (categoryId, option) => {
        const ownerStep = STEPS.find((step) => step.categories.includes(categoryId));
        const stepNowComplete = ownerStep.categories.every((id) =>
            id === categoryId ? true : !!selections[id],
        );

        setSelections((previous) => ({ ...previous, [categoryId]: option }));

        if (stepNowComplete && ownerStep.id === activeStepId) {
            const ownerIndex = ALL_STEPS.findIndex((step) => step.id === ownerStep.id);
            const nextStep = ALL_STEPS[ownerIndex + 1];

            if (nextStep) {
                setTimeout(() => setActiveStepId(nextStep.id), 650);
            }
        }
    };

    /* ------------------------------- Clear step ------------------------------ */

    const handleClearStep = (step) => {
        if (step.id === "character") {
            setCharacters([]);
            return;
        }

        setSelections((previous) => {
            const next = { ...previous };
            step.categories.forEach((categoryId) => {
                next[categoryId] = null;
            });
            return next;
        });
    };

    /* -------------------------------- Nav ------------------------------------ */

    const goBack = () => {
        if (isFirstStep) return;
        setActiveStepId(ALL_STEPS[activeStepIndex - 1].id);
    };

    const handleCreateStory = () => {
        const missingSteps = STEPS.filter((step) => !isStepComplete(step, selections, characters));

        if (missingSteps.length > 0) {
            alert(`Please complete: ${missingSteps.map((step) => step.title).join(", ")}`);
            setActiveStepId(missingSteps[0].id);
            return;
        }

        console.log("Story Settings:", selections, "Characters:", characters);

        /*
          Navigate to next step:

          navigate("/create/generate", {
            state: { storySettings: selections, characters }
          });
        */
    };

    const handlePrimary = () => {
        if (isLastStep) {
            handleCreateStory();
            return;
        }

        setActiveStepId(ALL_STEPS[activeStepIndex + 1].id);
    };

    const currentStepComplete = isCharacterStep ? true : isStepComplete(activeStep, selections, characters);

    return (
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
            {/* Top Header */}
            <div className="flex shrink-0 items-center justify-between bg-white px-7 pt-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Sparkles size={19} className="text-[#e6a51b]" fill="currentColor" />
                        <h1 className="text-[20px] font-bold text-[#37334c]">Let's build your story, step by step</h1>
                    </div>
                </div>
            </div>

            {/* Step Rail */}
            <StepRail
                steps={ALL_STEPS}
                activeStepId={activeStepId}
                onSelectStep={setActiveStepId}
                selections={selections}
                characters={characters}
                onClearStep={handleClearStep}
            />

            {/* Main Content */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-5">
                <div className="min-h-0 flex-1 overflow-hidden">
                    {isCharacterStep ? (
                        <CharacterWorkspace characters={characters} setCharacters={setCharacters} />
                    ) : (
                        <StepWorkspace step={activeStep} selections={selections} onSelect={handleOptionSelect} />
                    )}
                </div>
            </div>
        </div>
    );
};