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

    console.log(selections, "Selections All going on here......")
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