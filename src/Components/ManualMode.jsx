import React, { useMemo, useRef, useState } from "react";
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


const STORY_OPTIONS = {
    age: [
        { id: "0-3", label: "0–3 years", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598071/Screenshot_2026-09-05_141555-removebg-preview_svf4n5.png" },
        { id: "4-7", label: "4-7 years", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598071/Screenshot_2026-09-05_141555-removebg-preview_svf4n5.png" },
        { id: "8-13", label: "8-13 years", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598071/Screenshot_2026-09-05_141555-removebg-preview_svf4n5.png" },
        { id: "13-17", label: "13+ years", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598071/Screenshot_2026-09-05_141555-removebg-preview_svf4n5.png" },
        { id: "18-plus", label: "13+ years", image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788598071/Screenshot_2026-09-05_141555-removebg-preview_svf4n5.png" },

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
        {id:"normal",label:"Normal",image:"https://res.cloudinary.com/djdct0pxu/image/upload/v1788602715/ChatGPT_Image_Sep_5_2026_03_15_54_PM_lizdnq.png"},
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
        title: "Age & Theme",
        subtitle: "Who it's for, and the mood we're setting",
        categories: ["age", "theme"],
    },
    {
        id: "subject",
        number: 2,
        title: "Subject & Central Message",
        subtitle: "What's the story really about?",
        categories: ["subject", "centralmsg"],
    },
    {
        id: "imageStyle",
        number: 3,
        title: "Image Style",
        subtitle: "Pick the art style that brings it to life",
        categories: ["imageStyle"],
    },
   
];

const CHARACTER_STEP = {
    id: "character",
    number: 4,
    title: "Character",
    subtitle: "Give your hero a name and a face",
    categories: [],
    optional: true,
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

// step rail
const StepRail = ({
    steps,
    activeStepId,
    onSelectStep,
    selections,
    characters,
    onClearStep,
}) => {
    const activeIndex = steps.findIndex(
        (step) => step.id === activeStepId
    );

    const progressPercent =
        steps.length > 1
            ? (activeIndex / (steps.length - 1)) * 100
            : 0;

    return (
        <div className="shrink-0  border-[#ebe7f2] bg-white">
        

            {/* Stepper */}
            <div className="relative px-10 pb-7 pt-8">

                {/* Full Background Rail */}
                <div className="absolute left-[5%] right-[5%] top-[51px] h-[3px]">
                    <div className="relative h-full rounded-full bg-[#e8e4ef]">

                        {/* Progress Fill */}
                        <div
                            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#6947d7] to-[#8b6cf0] transition-all duration-500 ease-out"
                            style={{
                                width: `${progressPercent}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Starting Dot */}
                <div className="absolute left-[4.5%] top-[47px] z-10">
                    <div
                        className={`h-[10px] w-[10px] rounded-full border-2 border-white shadow-sm transition-all duration-300 ${
                            activeIndex >= 0
                                ? "bg-[#6947d7]"
                                : "bg-[#ddd8e6]"
                        }`}
                    />
                </div>

                {/* Ending Dot */}
                <div className="absolute right-[4.5%] top-[47px] z-10">
                    <div
                        className={`h-[10px] w-[10px] rounded-full border-2 border-white shadow-sm transition-all duration-300 ${
                            activeIndex === steps.length - 1
                                ? "bg-[#6947d7]"
                                : "bg-[#ddd8e6]"
                        }`}
                    />
                </div>

                {/* Steps */}
                <div className="relative z-20 flex items-start">

                    {steps.map((step, index) => {
                        const isActive = step.id === activeStepId;
                        const isDone = isStepComplete(
                            step,
                            selections,
                            characters
                        );

                        const preview = getStepPreview(
                            step,
                            selections,
                            characters
                        );

                        const isPast = index < activeIndex;

                        return (
                            <div
                                key={step.id}
                                className="flex flex-1 flex-col items-center text-center"
                            >

                                {/* Step Circle */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        onSelectStep(step.id)
                                    }
                                    className={`
                                        group relative flex h-[42px] w-[42px]
                                        items-center justify-center
                                        rounded-full border-2
                                        text-[14px] font-bold
                                        transition-all duration-300
                                        focus:outline-none

                                        ${
                                            isActive
                                                ? `
                                                    border-[#6947d7]
                                                    bg-white
                                                    text-[#6947d7]
                                                    shadow-[0_0_0_5px_rgba(105,71,215,0.10)]
                                                    scale-110
                                                  `
                                                : isDone || isPast
                                                ? `
                                                    border-[#6947d7]
                                                    bg-[#6947d7]
                                                    text-white
                                                    shadow-[0_4px_10px_rgba(105,71,215,0.20)]
                                                  `
                                                : `
                                                    border-[#ded8e7]
                                                    bg-white
                                                    text-[#aaa3b5]
                                                    hover:border-[#b8a9df]
                                                    hover:text-[#6947d7]
                                                  `
                                        }
                                    `}
                                >

                                    {/* Active pulse */}
                                    {isActive && (
                                        <span className="absolute inset-[-6px] rounded-full border border-[#6947d7]/20" />
                                    )}

                                    {/* Number / Check */}
                                    {isActive ? (
                                        step.number
                                    ) : isDone || isPast ? (
                                        <Check
                                            size={17}
                                            strokeWidth={3}
                                        />
                                    ) : (
                                        step.number
                                    )}
                                </button>

                                {/* Step Information */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        onSelectStep(step.id)
                                    }
                                    className="mt-4 flex flex-col items-center"
                                >
                                    <p
                                        className={`
                                            text-[13px] font-bold
                                            leading-tight transition-colors

                                            ${
                                                isActive
                                                    ? "text-[#2f294d]"
                                                    : isDone
                                                    ? "text-[#4d4562]"
                                                    : "text-[#777080]"
                                            }
                                        `}
                                    >
                                        {step.title}
                                    </p>

                                    {/* Optional Label */}
                                    {step.optional && !preview && (
                                        <span className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#b9b1c5]">
                                            Optional
                                        </span>
                                    )}
                                </button>

                                {/* Selection Preview */}
                                {preview && (
                                    <div className="mt-2.5 flex max-w-[175px] items-center gap-1.5 rounded-full border border-[#e4ddf7] bg-[#f5f2ff] px-2.5 py-1">
                                        
                                        <span className="truncate text-[10px] font-semibold text-[#6947d7]">
                                            {preview}
                                        </span>

                                        <button
                                            type="button"
                                            aria-label={`Clear ${step.title}`}
                                            className="flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full text-[#a294cb] transition hover:bg-[#e5def8] hover:text-[#6947d7]"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onClearStep(step);
                                            }}
                                        >
                                            <X size={11} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
/* -------------------------------------------------------------------------- */
/*                              OPTION CARD                                   */
/* -------------------------------------------------------------------------- */

const CompactOptionCard = ({ option, isSelected, onSelect }) => {
    return (
        <button
            type="button"
            onClick={() => onSelect(option)}
            className={`
        group relative aspect-square
        rounded-[20px] border 
        transition-all duration-200
        h-[150px] w-[150px]

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

/* -------------------------------------------------------------------------- */
/*                              CATEGORY PANEL                                */
/* -------------------------------------------------------------------------- */

const CategoryPanel = ({ categoryId, selectedOption, onSelect, showHeader }) => {
    const meta = PANEL_META[categoryId];
    const options = STORY_OPTIONS[categoryId] || [];
    const Icon = meta?.icon;
    return (
        <div className={showHeader ? "rounded-[20px] border border-[#eeeaf2] p-5" : ""}>
            {/* {showHeader && (
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#eee9ff] text-[#6241cc]">
                        {Icon && <Icon size={15} />}
                    </div>

                    <div>
                        <h3 className="text-[14px] font-bold text-[#3f3b53]">{meta?.heading}</h3>
                        <p className="text-[11px] text-[#928c9c]">{meta?.description}</p>
                    </div>
                </div>
            )} */}
            {/*  here it should choose age and choose theme  */}

            <div className="flex items-center  gap-4">
                {options.map((option) => (
                    <CompactOptionCard
                        key={option.id}
                        option={option}
                        isSelected={selectedOption?.id === option.id}
                        onSelect={(value) => onSelect(categoryId, value)}
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

    return (
        <section
            className="
        flex h-full min-h-0 flex-1 flex-col
        rounded-[26px] border border-[#e6e1ee] 
        p-6 shadow-[0_10px_30px_rgba(87,67,150,0.05)]
      "
        >
            <div className="shrink-0  border-[#eeeaf2]">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#eee9ff] text-[#6241cc]">
                        <Sparkles size={19} />
                    </div>

                    <div>
                        <h2 className="text-[24px] font-bold text-[#343348]">{step.title}</h2>
                        <p className="mt-1 text-[13px] text-[#858092]">{step.subtitle}</p>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pt-6">
                {step.categories.map((categoryId) => (
                    <CategoryPanel
                        key={categoryId}
                        categoryId={categoryId}
                        selectedOption={selections[categoryId]}
                        onSelect={onSelect}
                        showHeader={hasMultiplePanels}
                    />
                ))}
            </div>
        </section>
    );
};

/* -------------------------------------------------------------------------- */
/*                           CHARACTER WORKSPACE                              */
/* -------------------------------------------------------------------------- */

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

    const handleChange = (field, value) => {
        setFormData((previous) => ({ ...previous, [field]: value }));
    };

    const handlePhotoUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFormData((previous) => ({
            ...previous,
            photo: { file, preview: URL.createObjectURL(file) },
        }));
    };

    const handleSaveCharacter = () => {
        if (!formData.name.trim()) return;

        const character = { id: Date.now(), type: characterType, ...formData };

        setCharacters((previous) => [...previous, character]);

        setFormData({ name: "", gender: "", age: "", hobbies: "", favouriteFood: "", photo: null });
    };

    const removePhoto = () => {
        setFormData((previous) => ({ ...previous, photo: null }));
    };

    return (
        <section
            className="
        flex h-full min-h-0 flex-1 flex-col overflow-hidden
        rounded-[26px] border border-[#e6e1ee] bg-white
        shadow-[0_10px_30px_rgba(87,67,150,0.05)]
      "
        >
            <div className="flex shrink-0 items-center justify-between border-b border-[#eeeaf3] bg-gradient-to-r from-[#faf8ff] to-white px-7 py-5">
                <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#eee8ff] text-[#6543cf]">
                        <UserRound size={21} />
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-[22px] font-bold text-[#39354c]">Character Illustration</h2>
                            <Sparkles size={17} className="text-[#dba51e]" fill="currentColor" />
                        </div>

                        <p className="mt-1 text-[12px] text-[#90899c]">
                            Tell us about your character and we'll bring them to life.
                        </p>
                    </div>
                </div>

                <div className="rounded-full bg-[#f0ebff] px-3 py-1.5 text-[11px] font-semibold text-[#6745d0]">
                    Optional
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5">
                {characters.length > 0 && (
                    <div className="mb-6 flex flex-wrap gap-2">
                        {characters.map((character) => (
                            <div
                                key={character.id}
                                className="flex items-center gap-2 rounded-full border border-[#e5deef] bg-[#faf8ff] py-1.5 pl-1.5 pr-3"
                            >
                                {character.photo ? (
                                    <img
                                        src={character.photo.preview}
                                        alt={character.name}
                                        className="h-6 w-6 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eee9ff] text-[#6947d7]">
                                        <UserRound size={13} />
                                    </div>
                                )}

                                <span className="text-[12px] font-semibold text-[#4f4a5c]">{character.name}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div>
                    <div className="mb-3">
                        <h3 className="text-[14px] font-bold text-[#4b4658]">Choose the type of character</h3>
                        <p className="mt-1 text-[11px] text-[#9b95a5]">Select what kind of character you want to create.</p>
                    </div>

                    <div className="flex gap-3">
                        {CHARACTER_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isSelected = characterType === type.id;

                            return (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setCharacterType(type.id)}
                                    className={`
                    flex h-[48px] items-center gap-2.5 rounded-[14px] border px-5
                    text-[14px] font-semibold transition-all duration-200

                    ${isSelected
                                            ? "border-[#6947d7] bg-[#6947d7] text-white shadow-[0_7px_18px_rgba(105,71,215,0.22)]"
                                            : "border-[#e2ddea] bg-white text-[#676174] hover:border-[#cbbdea] hover:bg-[#faf8ff]"
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

                <div>
                    <h3 className="mb-4 text-[15px] font-bold text-[#464151]">Character details</h3>

                    <div className="mb-4">
                        <label className="mb-2 block text-[13px] font-semibold text-[#585261]">Main character name</label>

                        <input
                            type="text"
                            value={formData.name}
                            onChange={(event) => handleChange("name", event.target.value)}
                            placeholder="e.g. Emma, Leo, Luna..."
                            className="
                h-[50px] w-full rounded-[14px] border border-[#e2dce8] bg-[#fcfbfd]
                px-4 text-[14px] text-[#494351] outline-none transition-all
                placeholder:text-[#b0aab7] focus:border-[#8062db] focus:bg-white
                focus:ring-4 focus:ring-[#eee9ff]
              "
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-[13px] font-semibold text-[#585261]">Gender</label>

                            <select
                                value={formData.gender}
                                onChange={(event) => handleChange("gender", event.target.value)}
                                className="
                  h-[50px] w-full rounded-[14px] border border-[#e2dce8] bg-[#fcfbfd]
                  px-4 text-[14px] text-[#595360] outline-none transition-all
                  focus:border-[#8062db] focus:bg-white focus:ring-4 focus:ring-[#eee9ff]
                "
                            >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="non-binary">Non-binary</option>
                                <option value="prefer-not-to-say">Prefer not to say</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-[13px] font-semibold text-[#585261]">Age</label>

                            <input
                                type="number"
                                min="0"
                                value={formData.age}
                                onChange={(event) => handleChange("age", event.target.value)}
                                placeholder="e.g. 7"
                                className="
                  h-[50px] w-full rounded-[14px] border border-[#e2dce8] bg-[#fcfbfd]
                  px-4 text-[14px] outline-none transition-all placeholder:text-[#b0aab7]
                  focus:border-[#8062db] focus:bg-white focus:ring-4 focus:ring-[#eee9ff]
                "
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-5">
                    <label className="mb-2 block text-[13px] font-semibold text-[#585261]">
                        Hobbies & interests
                        <span className="ml-1 text-[11px] font-normal text-[#aaa3b0]">Optional</span>
                    </label>

                    <input
                        type="text"
                        value={formData.hobbies}
                        onChange={(event) => handleChange("hobbies", event.target.value)}
                        placeholder="e.g. Drawing, cycling, playing football..."
                        className="
              h-[50px] w-full rounded-[14px] border border-[#e2dce8] bg-[#fcfbfd]
              px-4 text-[14px] outline-none transition-all placeholder:text-[#b0aab7]
              focus:border-[#8062db] focus:bg-white focus:ring-4 focus:ring-[#eee9ff]
            "
                    />
                </div>

                <div className="mt-5">
                    <label className="mb-2 block text-[13px] font-semibold text-[#585261]">
                        Favourite food
                        <span className="ml-1 text-[11px] font-normal text-[#aaa3b0]">Optional</span>
                    </label>

                    <input
                        type="text"
                        value={formData.favouriteFood}
                        onChange={(event) => handleChange("favouriteFood", event.target.value)}
                        placeholder="e.g. Pizza, ice cream..."
                        className="
              h-[50px] w-full rounded-[14px] border border-[#e2dce8] bg-[#fcfbfd]
              px-4 text-[14px] outline-none transition-all placeholder:text-[#b0aab7]
              focus:border-[#8062db] focus:bg-white focus:ring-4 focus:ring-[#eee9ff]
            "
                    />
                </div>

                <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h3 className="text-[14px] font-bold text-[#4c4657]">Character reference photo</h3>
                            <p className="mt-1 text-[11px] text-[#9c96a5]">
                                Optional, but helps create a more personalised character.
                            </p>
                        </div>
                    </div>

                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

                    {!formData.photo ? (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="
                group flex h-[145px] w-full flex-col items-center justify-center
                rounded-[18px] border-2 border-dashed border-[#d7cfdf] bg-[#fcfbfd]
                transition-all duration-200 hover:border-[#9177df] hover:bg-[#faf8ff]
              "
                        >
                            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#eee9ff] text-[#6848cf] transition-transform group-hover:scale-105">
                                <Upload size={20} />
                            </div>

                            <p className="text-[13px] font-semibold text-[#615b6d]">Upload a character photo</p>
                            <p className="mt-1 text-[11px] text-[#aaa4b0]">PNG, JPG or WEBP</p>
                        </button>
                    ) : (
                        <div className="relative flex h-[145px] items-center gap-5 overflow-hidden rounded-[18px] border border-[#ddd5e8] bg-[#faf8fd] p-4">
                            <img
                                src={formData.photo.preview}
                                alt="Character preview"
                                className="h-[110px] w-[110px] rounded-[14px] object-cover"
                            />

                            <div>
                                <p className="text-[14px] font-bold text-[#4d4757]">Photo added successfully</p>
                                <p className="mt-1 text-[11px] text-[#96909f]">This image will be used as visual inspiration.</p>
                            </div>

                            <button
                                type="button"
                                onClick={removePhoto}
                                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#a19aa8] shadow-sm hover:text-[#d35d5d]"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    )}

                    <div className="mt-3 flex items-start gap-2.5 rounded-[13px] border border-[#eee3c9] bg-[#fffaf0] px-4 py-3">
                        <Info size={16} className="mt-0.5 shrink-0 text-[#d79a24]" />
                        <p className="text-[11px] leading-relaxed text-[#887c65]">
                            For the best result, use a clear photo where the character is clearly visible. A full-body image
                            works best for illustrations.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-[#eeeaf3] bg-white px-7 py-4">
                <p className="text-[11px] text-[#a09aa9]">You can add more characters later.</p>

                <button
                    type="button"
                    onClick={handleSaveCharacter}
                    disabled={!formData.name.trim()}
                    className={`
            flex h-[46px] items-center gap-2 rounded-[13px] px-5
            text-[13px] font-bold transition-all

            ${formData.name.trim()
                            ? "bg-[#6947d7] text-white shadow-[0_8px_18px_rgba(105,71,215,0.22)] hover:bg-[#5e3ccc]"
                            : "cursor-not-allowed bg-[#eeebf4] text-[#aaa4b2]"
                        }
          `}
                >
                    <ImagePlus size={17} />
                    Add Character
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

    /* ---------------------------- Select Option ----------------------------- */
    // NOTE: the auto-advance side effect (setTimeout) is intentionally kept
    // OUTSIDE the setSelections updater. Updater functions must be pure —
    // React can re-invoke them, and scheduling a timeout from inside one
    // was causing the step to sometimes jump forward more than intended.

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
                setTimeout(() => setActiveStepId(nextStep.id), 350);
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