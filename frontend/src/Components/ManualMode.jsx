import { useEffect, useMemo, useRef, useState } from "react";
import {
    Cake,
    Palette,
    BookOpen,
    Image,
    Languages,
    Type,
    Check,
    Sparkles,
    MessageCircleHeart,
} from "lucide-react";
import { StepRail } from "./StepRail";
import { CharacterWorkspace } from "./CharacterIllustration";
import { createBook } from "../services/bookService";

/* -------------------------------------------------------------------------- */
/*                                STORY OPTIONS                               */
/* -------------------------------------------------------------------------- */

const STORY_OPTIONS = {
    age: [
        {
            id: "0-3",
            label: "0–3 years",
            description: "Big pictures, simple words, gentle rhythms.",
            image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1789547390/Screenshot_2026-09-16_135738_olllpc.png",
        },
        {
            id: "4-7",
            label: "4–7 years",
            description: "Playful plots with easy, repeatable vocabulary.",
            image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1789547400/Screenshot_2026-09-16_135805_mthjaq.png",
        },
        {
            id: "8-13",
            label: "8–13 years",
            description: "Longer stories with richer plots and humor.",
            image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1789547825/Screenshot_2026-09-16_135812_sa78oo.png",
        },
        {
            id: "13-17",
            label: "13–17 years",
            description: "Bigger themes for confident young readers.",
            image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1789547418/Screenshot_2026-09-16_135819_vs2sod.png",
        },
        {
            id: "18-plus",
            label: "18+ years",
            description: "Nuanced, grown-up storytelling and tone.",
            image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1789547428/Screenshot_2026-09-16_135856_zvjkuw.png",
        },
    ],

    theme: [
        { id: "fairy-tales", label: "Fairy Tales", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598956/fairy-tales-unicorn_zzfzys.png" },
        { id: "adventure", label: "Adventure", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/adventure-map_ngbnx0.png" },
        { id: "activities", label: "Activities", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/activities-playground_iu5nus.png" },
        { id: "worlds", label: "Worlds", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/worlds-globe_dihbim.png" },
        { id: "holidays", label: "Holidays", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/holidays-christmas-tree_ybo5qq.png" },
        { id: "family", label: "Family", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599390/family_bhsktq.png" },
        { id: "education", label: "Education", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599353/educational-alphabet-blocks_vyzp4a.png" },
        { id: "feelings", label: "Feelings", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599299/feelings-emotions_ce92zg.png" },
    ],

    // subject options, grouped by theme id
    subject: {
        "fairy-tales": [
            { id: "princess", label: "Princesses & Princes", image: "https://res.cloudinary.com/dkk0hqyat/image/upload/v1789623346/image_1_efvvse.png" },
            { id: "magic", label: "Magic & Spells", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598956/fairy-tales-unicorn_zzfzys.png" },
            { id: "dragons", label: "Dragons", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598956/fairy-tales-unicorn_zzfzys.png" },
            { id: "unicorns", label: "Unicorns", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598956/fairy-tales-unicorn_zzfzys.png" },
            { id: "enchanted-forest", label: "Enchanted Forest", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598956/fairy-tales-unicorn_zzfzys.png" },
            { id: "talking-animals", label: "Talking Animals", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598956/fairy-tales-unicorn_zzfzys.png" },
        ],
        adventure: [
            { id: "treasure-hunt", label: "Treasure Hunt", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/adventure-map_ngbnx0.png" },
            { id: "space", label: "Space Journey", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/adventure-map_ngbnx0.png" },
            { id: "jungle", label: "Jungle Expedition", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/adventure-map_ngbnx0.png" },
            { id: "ocean", label: "Underwater Adventure", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/adventure-map_ngbnx0.png" },
            { id: "mountains", label: "Mountain Expedition", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/adventure-map_ngbnx0.png" },
            { id: "mystery", label: "Mystery & Exploration", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/adventure-map_ngbnx0.png" },
        ],
        activities: [
            { id: "camping", label: "Camping", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/activities-playground_iu5nus.png" },
            { id: "sports", label: "Sports", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/activities-playground_iu5nus.png" },
            { id: "cooking", label: "Cooking", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/activities-playground_iu5nus.png" },
            { id: "art", label: "Art & Drawing", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/activities-playground_iu5nus.png" },
            { id: "music", label: "Music & Dancing", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/activities-playground_iu5nus.png" },
            { id: "school-trip", label: "School Trip", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/activities-playground_iu5nus.png" },
        ],
        worlds: [
            { id: "space-world", label: "Outer Space", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/worlds-globe_dihbim.png" },
            { id: "underwater-world", label: "Underwater World", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/worlds-globe_dihbim.png" },
            { id: "dinosaur-world", label: "Dinosaur World", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/worlds-globe_dihbim.png" },
            { id: "robot-world", label: "Robot World", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/worlds-globe_dihbim.png" },
            { id: "fantasy-world", label: "Fantasy World", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/worlds-globe_dihbim.png" },
            { id: "future-world", label: "Future World", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/worlds-globe_dihbim.png" },
        ],
        holidays: [
            { id: "christmas", label: "Christmas", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/holidays-christmas-tree_ybo5qq.png" },
            { id: "halloween", label: "Halloween", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/holidays-christmas-tree_ybo5qq.png" },
            { id: "birthday", label: "Birthday", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/holidays-christmas-tree_ybo5qq.png" },
            { id: "new-year", label: "New Year", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/holidays-christmas-tree_ybo5qq.png" },
            { id: "diwali", label: "Diwali", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/holidays-christmas-tree_ybo5qq.png" },
            { id: "vacation", label: "Holiday Vacation", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599300/holidays-christmas-tree_ybo5qq.png" },
        ],
        family: [
            { id: "family-trip", label: "Family Trip", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599390/family_bhsktq.png" },
            { id: "siblings", label: "Brothers & Sisters", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599390/family_bhsktq.png" },
            { id: "grandparents", label: "Grandparents", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599390/family_bhsktq.png" },
            { id: "family-pet", label: "Family Pet", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599390/family_bhsktq.png" },
            { id: "new-baby", label: "New Baby", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599390/family_bhsktq.png" },
            { id: "family-day", label: "Family Day", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599390/family_bhsktq.png" },
        ],
        education: [
            { id: "science", label: "Science", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599353/educational-alphabet-blocks_vyzp4a.png" },
            { id: "math", label: "Math & Numbers", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599353/educational-alphabet-blocks_vyzp4a.png" },
            { id: "reading", label: "Reading", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599353/educational-alphabet-blocks_vyzp4a.png" },
            { id: "history", label: "History", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599353/educational-alphabet-blocks_vyzp4a.png" },
            { id: "nature", label: "Nature & Animals", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599353/educational-alphabet-blocks_vyzp4a.png" },
            { id: "problem-solving", label: "Problem Solving", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599353/educational-alphabet-blocks_vyzp4a.png" },
        ],
        feelings: [
            { id: "friendship", label: "Friendship", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599299/feelings-emotions_ce92zg.png" },
            { id: "confidence", label: "Confidence", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599299/feelings-emotions_ce92zg.png" },
            { id: "kindness", label: "Kindness", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599299/feelings-emotions_ce92zg.png" },
            { id: "jealousy", label: "Jealousy", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599299/feelings-emotions_ce92zg.png" },
            { id: "fear", label: "Overcoming Fear", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599299/feelings-emotions_ce92zg.png" },
            { id: "empathy", label: "Empathy", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788599299/feelings-emotions_ce92zg.png" },
        ],
    },

    // central message options, grouped by theme id
    centralmsg: {
        "fairy-tales": [
            { id: "believe", label: "Believe in Yourself" },
            { id: "kindness", label: "Kindness Wins" },
            { id: "courage", label: "Be Brave" },
            { id: "friendship", label: "True Friendship" },
            { id: "hope", label: "Never Lose Hope" },
            { id: "goodness", label: "Goodness Overcomes Evil" },
        ],
        adventure: [
            { id: "courage", label: "Courage" },
            { id: "perseverance", label: "Never Give Up" },
            { id: "teamwork", label: "Teamwork" },
            { id: "curiosity", label: "Stay Curious" },
            { id: "confidence", label: "Believe in Yourself" },
            { id: "responsibility", label: "Take Responsibility" },
        ],
        activities: [
            { id: "teamwork", label: "Working Together" },
            { id: "practice", label: "Practice Makes Progress" },
            { id: "creativity", label: "Be Creative" },
            { id: "patience", label: "Be Patient" },
            { id: "sharing", label: "Sharing With Others" },
            { id: "fun", label: "Enjoy the Journey" },
        ],
        worlds: [
            { id: "curiosity", label: "Explore the Unknown" },
            { id: "friendship", label: "Friendship Across Worlds" },
            { id: "teamwork", label: "Teamwork" },
            { id: "discovery", label: "Learning Through Discovery" },
            { id: "courage", label: "Face the Unknown With Courage" },
            { id: "imagination", label: "The Power of Imagination" },
        ],
        holidays: [
            { id: "togetherness", label: "Togetherness" },
            { id: "gratitude", label: "Be Grateful" },
            { id: "giving", label: "The Joy of Giving" },
            { id: "family", label: "Family Matters" },
            { id: "kindness", label: "Spread Kindness" },
            { id: "celebration", label: "Celebrate Life" },
        ],
        family: [
            { id: "love", label: "Family Love" },
            { id: "togetherness", label: "Together Is Better" },
            { id: "respect", label: "Respect Each Other" },
            { id: "forgiveness", label: "Learn to Forgive" },
            { id: "helping", label: "Help One Another" },
            { id: "gratitude", label: "Appreciate Your Family" },
        ],
        education: [
            { id: "curiosity", label: "Stay Curious" },
            { id: "learning", label: "Learning Is an Adventure" },
            { id: "perseverance", label: "Keep Trying" },
            { id: "problem-solving", label: "Think of Solutions" },
            { id: "confidence", label: "Believe You Can Learn" },
            { id: "creativity", label: "Think Creatively" },
        ],
        feelings: [
            { id: "friendship", label: "Friendship" },
            { id: "empathy", label: "Understand Others" },
            { id: "confidence", label: "Believe in Yourself" },
            { id: "kindness", label: "Choose Kindness" },
            { id: "emotional-awareness", label: "Understand Your Feelings" },
            { id: "resilience", label: "Be Strong Through Challenges" },
        ],
    },

    imageStyle: [
        { id: "normal", label: "Normal", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788602715/ChatGPT_Image_Sep_5_2026_03_15_54_PM_lizdnq.png" },
        { id: "3d", label: "3D Animation", image: "https://cdn-icons-png.flaticon.com/512/2489/2489756.png" },
        { id: "watercolor", label: "Watercolour", image: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png" },
        { id: "geometric", label: "Geometric", image: "https://cdn-icons-png.flaticon.com/512/201/201623.png" },
        { id: "claymation", label: "Claymation", image: "https://cdn-icons-png.flaticon.com/512/3145/3145765.png" },
        { id: "storybook", label: "Classic Storybook", image: "https://cdn-icons-png.flaticon.com/512/3145/3145765.png" },
    ],

    language: [
        { id: "english", label: "English", emoji: "🇬🇧" },
        { id: "spanish", label: "Spanish", emoji: "🇪🇸" },
        { id: "french", label: "French", emoji: "🇫🇷" },
        { id: "german", label: "German", emoji: "🇩🇪" },
        { id: "italian", label: "Italian", emoji: "🇮🇹" },
        { id: "portuguese", label: "Portuguese", emoji: "🇵🇹" },
        { id: "dutch", label: "Dutch", emoji: "🇳🇱" },
        { id: "hindi", label: "Hindi", emoji: "🇮🇳" },
        { id: "arabic", label: "Arabic", emoji: "🇸🇦" },
        { id: "japanese", label: "Japanese", emoji: "🇯🇵" },
        { id: "chinese", label: "Chinese", emoji: "🇨🇳" },
        { id: "korean", label: "Korean", emoji: "🇰🇷" },
    ],

    font: [
        { id: "rounded", label: "Rounded & Playful", fontFamily: '"Baloo 2", "Comic Sans MS", cursive' },
        { id: "serif", label: "Classic Storybook", fontFamily: 'Georgia, "Times New Roman", serif' },
        { id: "handwritten", label: "Handwritten", fontFamily: '"Segoe Script", "Bradley Hand", cursive' },
        { id: "sans", label: "Clean & Modern", fontFamily: '"Poppins", "Helvetica Neue", Arial, sans-serif' },
        { id: "bubbly", label: "Bubbly & Bold", fontFamily: '"Fredoka One", "Baloo 2", cursive' },
        { id: "whimsical", label: "Whimsical", fontFamily: '"Chewy", "Comic Sans MS", cursive' },
        { id: "elegant", label: "Elegant Script", fontFamily: '"Dancing Script", "Segoe Script", cursive' },
        { id: "typewriter", label: "Typewriter", fontFamily: '"Courier New", Courier, monospace' },
    ],
};

// Pastel background tints cycled across the image-style cards (see screenshot reference).
const IMAGE_STYLE_PALETTE = ["#f7ded1", "#dbe6e7", "#f6d9e1", "#f3dee1", "#e4dcf2", "#dcecdd"];

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
        title: "Choose Your Age & Theme",
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

// Categories whose available options depend on the selected theme.
const THEME_DEPENDENT_CATEGORIES = new Set(["subject", "centralmsg"]);

// Returns the option list for a category, resolving theme-dependent ones
// (subject / centralmsg) against the currently selected theme.
const getOptionsForCategory = (categoryId, selections) => {
    const source = STORY_OPTIONS[categoryId];
    if (!source) return [];
    if (THEME_DEPENDENT_CATEGORIES.has(categoryId)) {
        const themeId = selections?.theme?.id;
        return (themeId && source[themeId]) || [];
    }
    return source;
};

// help logic
const isStepComplete = (step, selections, characters) => {
    if (step.id === "character") return characters.length > 0;
    return step.categories.every((categoryId) => !!selections[categoryId]);
};
// styles
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
// animation
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

// optionCards

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

// image Card
const ImageStyleCard = ({ option, isSelected, onSelect, index = 0 }) => {
    const tint = IMAGE_STYLE_PALETTE[index % IMAGE_STYLE_PALETTE.length];

    return (
        <button
            type="button"
            onClick={(event) => onSelect(option, event)}
            style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
            className={`
        group relative flex w-full flex-col overflow-hidden rounded-[20px]
        border-2 bg-white text-left
        animate-card-fade-in
        transition-all duration-200
        ${isSelected
                    ? "border-[#e6791b] shadow-[0_10px_26px_rgba(230,121,27,0.22)]"
                    : "border-transparent hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(87,67,150,0.10)]"
                }
      `}
        >
            {/* Image + label live on the tinted panel */}
            <div
                className="flex flex-col gap-3 rounded-t-[18px] p-3 pb-4"
                style={{ backgroundColor: tint }}
            >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[14px] bg-white/40">
                    {option.image && (
                        <img
                            src={option.image}
                            alt={option.label}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                    )}
                    {isSelected && (
                        <div className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#e6791b] text-white shadow-sm">
                            <Check size={14} strokeWidth={3} />
                        </div>
                    )}
                </div>

                <span
                    className={`text-center text-[15px] font-bold leading-tight ${isSelected ? "text-[#e6791b]" : "text-[#332f42]"
                        }`}
                >
                    {option.label}
                </span>
            </div>

            {/* Footer strip */}
            <div className="border-t border-black/5 bg-[#fdfbf7] px-3 py-2.5 text-center">
                <span className="text-[12px] font-medium text-[#9a94a3] group-hover:text-[#6947d7] group-hover:underline">
                    View example
                </span>
            </div>
        </button>
    );
};


const CategoryPanel = ({ categoryId, selections, onSelect, showHeader }) => {
    const meta = PANEL_META[categoryId];
    const options = getOptionsForCategory(categoryId, selections);
    const selectedOption = selections[categoryId];
    const Icon = meta?.icon;
    const isImageStyle = categoryId === "imageStyle";
    const themeMissing = THEME_DEPENDENT_CATEGORIES.has(categoryId) && !selections?.theme;

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

            {themeMissing ? (
                <div className="rounded-[16px] border border-dashed border-[#e5e1eb] bg-[#faf8fd] p-6 text-center text-[13px] text-[#928c9c]">
                    Pick a theme first to see matching options here.
                </div>
            ) : isImageStyle ? (
                <div
                    className="
                grid
                w-full min-w-0
                grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
                gap-4
                overflow-hidden
                py-1
            "
                >
                    {options.map((option, index) => (
                        <ImageStyleCard
                            key={option.id}
                            option={option}
                            index={index}
                            isSelected={selectedOption?.id === option.id}
                            onSelect={(value, event) => onSelect(categoryId, value, event)}
                        />
                    ))}
                </div>
            ) : (
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
            )}
        </div>
    );
};

// step work space 
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
                <div className="space-y-5">
                    {step.categories.map((categoryId) => (
                        <CategoryPanel
                            key={categoryId}
                            categoryId={categoryId}
                            selections={selections}
                            onSelect={handleSelectWithFlight}
                            showHeader={hasMultiplePanels}
                        />
                    ))}
                </div>
            </div>

            {flyingGhosts.map((ghost) => (
                <FlyingGhost key={ghost.key} ghost={ghost} onLanded={handleGhostLanded} />
            ))}
        </section>
    );
};

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


    const handleOptionSelect = (categoryId, option) => {
        const ownerStep = STEPS.find((step) => step.categories.includes(categoryId));

        setSelections((previous) => {
            const next = { ...previous, [categoryId]: option };

            // Changing the theme invalidates any previously chosen subject /
            // central message, since those lists are theme-specific.
            if (categoryId === "theme" && previous.theme?.id !== option.id) {
                next.subject = null;
                next.centralmsg = null;
            }

            return next;
        });

        if (!ownerStep) return; // language/font: just store, no auto-advance/step logic

        const stepNowComplete = ownerStep.categories.every((id) =>
            id === categoryId ? true : !!selections[id],
        );

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

    const handleCreateStory = async () => {
        const missingSteps = STEPS.filter(
            (step) => !isStepComplete(step, selections, characters)
        );

        if (missingSteps.length > 0) {
            alert(
                `Please complete: ${missingSteps
                    .map((step) => step.title)
                    .join(", ")}`
            );

            setActiveStepId(missingSteps[0].id);
            return;
        }

        const formData = new FormData();

        formData.append("mode", "manual");

        formData.append(
            "storySettings",
            JSON.stringify(selections)
        );

        formData.append(
            "characters",
            JSON.stringify(
                characters.map((character) => ({
                    id: character.id,
                    type: character.type,
                    name: character.name,
                    gender: character.gender || "",
                    age: character.age || "",
                    hobbies: character.hobbies || "",
                    favouriteFood: character.favouriteFood || "",
                    hasPhoto: Boolean(character.photo?.file)
                }))
            )
        );

        characters.forEach((character) => {
            if (character.photo?.file) {
                formData.append(
                    `characterPhoto-${character.id}`,
                    character.photo.file
                );
            }
        });

        console.log("FormData @j");

        for (const [key, value] of formData.entries()) {
            console.log(key, value);
        }

        try {
            const response = await createBook(formData);

            console.log(response, "Response @j");
        } catch (error) {
            console.error("Failed to create story:", error);

            alert(
                "Something went wrong while creating your story. Please try again."
            );
        }
    };

    // const handleCreateStory = async () => {
    //     // const missingSteps = STEPS.filter((step) => !isStepComplete(step, selections, characters));

    //     // if (missingSteps.length > 0) {
    //     //     alert(`Please complete: ${missingSteps.map((step) => step.title).join(", ")}`);
    //     //     setActiveStepId(missingSteps[0].id);
    //     //     return;
    //     // }

    //     // TEMPORARY: hardcoded test object matching exactly what generateStoryPrompt expects
    //     const testStoryData = {
    //         ageGroup: "4-7 years",
    //         theme: "Fairy Tales",
    //         genre: "Adventure",
    //         subject: "Courage",
    //         centralMessage: "Being brave means doing the right thing even when you're scared.",
    //         tone: "Warm, gentle, and a little magical",
    //         storySummary: "A shy young girl named Mira discovers that the village's magical Heart-Tree has stopped glowing. To save it, she must journey into the Whispering Woods, face her fear of the dark, and find the courage to help her community, even though she feels small and unsure of herself.",
    //         recommendedPages: 8,
    //         characters: [
    //             {
    //                 name: "Mira",
    //                 role: "Main character",
    //                 description: "A quiet, kind-hearted 6-year-old girl who loves collecting pretty stones and is scared of the dark, but has a big heart.",
    //             },
    //         ],
    //     };

    //     const payload = {
    //         mode: "manual",
    //         storySettings: testStoryData, // sent straight through as storyData on backend
    //         characters,
    //     };

    //     try {
    //         const response = await createBook(payload);
    //         console.log(response, "Response @jesus");
    //     } catch (error) {
    //         console.error("Failed to create story:", error);
    //         alert("Something went wrong while creating your story. Please try again.");
    //     }
    // };

    const handlePrimary = () => {
        // if (isLastStep) {
        handleCreateStory();
        //     return;
        // }

        setActiveStepId(ALL_STEPS[activeStepIndex + 1].id);
    };

    // console.log(selections, "Selections All going on here......")
    return (
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
            {/* Top Header */}
            <div className="flex shrink-0 items-center justify-between  px-7 pt-4">
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
                        <CharacterWorkspace
                            characters={characters}
                            setCharacters={setCharacters}
                            selections={selections}          // ← must be passed
                            onSelect={handleOptionSelect}    // ← must be passed
                            languageOptions={STORY_OPTIONS.language}
                            fontOptions={STORY_OPTIONS.font}
                        />
                    ) : (
                        <StepWorkspace step={activeStep} selections={selections} onSelect={handleOptionSelect} />
                    )}
                </div>

                {/* Footer action bar */}
                <div className="flex shrink-0 items-center justify-between border-t border-[#eeeaf2] pt-4">
                    <button
                        type="button"
                        disabled={isFirstStep}
                        onClick={() => setActiveStepId(ALL_STEPS[activeStepIndex - 1].id)}
                        className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-[#6947d7] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Back
                    </button>

                    <button
                        type="button"
                        onClick={handlePrimary}
                        disabled={!isLastStep && !isStepComplete(activeStep, selections, characters)}
                        className="rounded-full bg-gradient-to-r from-[#8f6ff0] to-[#5f38d6] px-7 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(105,71,215,0.25)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isLastStep ? "Create My Story ✨" : "Next"}
                    </button>
                </div>
            </div>
        </div>
    );
};