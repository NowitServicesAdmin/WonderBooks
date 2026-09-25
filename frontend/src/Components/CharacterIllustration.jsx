import {
    CalendarDays,
    Heart,
    Paperclip,
    Users,
    Utensils,
    UserRound,
    PawPrint,
    Package,
    ImagePlus,
    Info,
    X,
    Sparkles,
    Languages,
    Type,
} from "lucide-react";
import { useState } from "react";
import { useRef } from "react";

const CHARACTER_TYPES = [
    { id: "person", label: "Person", icon: UserRound },
    { id: "animal", label: "Animal", icon: PawPrint },
    { id: "object", label: "Object", icon: Package },
];

export const CharacterWorkspace = ({
    characters,
    setCharacters,
    selections = {},
    onSelect,
    languageOptions = [],
    fontOptions = [],
}) => {
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
        border-[var(--border)]
        bg-[var(--surface)]
        text-[14px]
        text-[#4b4655]
        outline-none
        transition-all
        placeholder:text-[#b2acb9]
        focus:border-[#8062db]
        focus:bg-white
        focus:ring-4
        focus:ring-[var(--tint)]
    `;

    const textareaClass = `
        min-h-[108px]
        w-full
        resize-none
        rounded-[15px]
        border
        border-[var(--border)]
        bg-[var(--surface)]
        px-5
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
        focus:ring-[var(--tint)]
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
                    bg-linear-to-r
                    from-[var(--tint)]
                    to-white
                    px-4
                    py-4
                    sm:px-7
                    sm:py-5
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
                            bg-[var(--tint)]
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

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-7 sm:py-5">

                {/* =========================================================
    CHARACTER TYPE
    KEEPING THE ORIGINAL BUTTON DESIGN
========================================================= */}

                <div>
                    <div className="mb-3">
                        <h3 className="text-[14px] font-bold text-[#4b4658]">
                            Choose the type of character
                        </h3>

                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                            Select what kind of character you want to create.
                        </p>
                    </div>

                    {/* ORIGINAL BUTTON STYLE */}
                    <div className="flex flex-wrap gap-3">
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
                        h-12
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
                                    border-[var(--accent-hover)]
                                    bg-[var(--accent-hover)]
                                    text-white
                                    shadow-[0_7px_18px_rgba(105,71,215,0.22)]
                                `
                                            : `
                                    border-[#e2ddea]
                                    bg-white
                                    text-[#676174]
                                    hover:border-[#cbbdea]
                                    hover:bg-[var(--tint)]
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
                                bg-[var(--tint)]
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

                            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
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
                            grid-cols-1
                            gap-4
                            sm:grid-cols-[1.5fr_0.7fr_1.45fr]
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
                                    text-[var(--text-muted)]
                                "
                            >
                                <UserRound
                                    size={14}
                                    className="text-[#8870c9]"
                                />

                                Main character name
                            </label>

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
                                    className={`${inputClass} pl-5 pr-4`}
                                />
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
                                    text-[var(--text-muted)]
                                "
                            >
                                <CalendarDays
                                    size={14}
                                    className="text-[#8870c9]"
                                />

                                Age
                            </label>

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
                                    className={`${inputClass} pl-5 pr-3`}
                                />
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
                                    text-[var(--text-muted)]
                                "
                            >
                                <Users
                                    size={14}
                                    className="text-[#8870c9]"
                                />

                                Gender
                            </label>

                            <div className="grid h-13 grid-cols-3 gap-1.5">
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
                                                gap-1
                                                rounded-[14px]
                                                border
                                                px-1
                                                text-[10px]
                                                lg:px-2.5
                                                lg:text-[12px]
                                                lg:gap-2
                                                font-semibold
                                                transition-all
                                                duration-200

                                                ${isSelected
                                                    ? option.selectedClass
                                                    : `
                                                            border-[var(--border)]
                                                            bg-[var(--surface)]
                                                            text-[#686171]
                                                            hover:border-[#cfc5de]
                                                            hover:bg-white
                                                        `
                                                }
                                            `}
                                        >
                                            <span
                                                className={`
                                                    hidden
                                                    h-4.5
                                                    w-4.5
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-full
                                                    border-2
                                                    bg-white
                                                    lg:flex
                                                    ${option.dotClass}
                                                `}
                                            >
                                                {isSelected && (
                                                    <span
                                                        className="
                                                            h-2
                                                            w-2
                                                            rounded-full
                                                            bg-current
                                                        "
                                                    />
                                                )}
                                            </span>

                                            <span className="text-[14px] leading-none lg:text-[17px]">
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

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

                        {/* HOBBIES */}

                        <div>
                            <label
                                className="
                                    mb-2
                                    flex
                                    flex-wrap
                                    items-center
                                    gap-1.5
                                    text-[12px]
                                    font-semibold
                                    text-[var(--text-muted)]
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

                        {/* FAVOURITE FOOD */}

                        <div>
                            <label
                                className="
                                    mb-2
                                    flex
                                    flex-wrap
                                    items-center
                                    gap-1.5
                                    text-[12px]
                                    font-semibold
                                    text-[var(--text-muted)]
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
                                    bg-[var(--tint)]
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
                            Add a photo to help create a more personalized
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
                                h-16
                                w-full
                                items-center
                                justify-between
                                rounded-[15px]
                                border
                                border-dashed
                                border-[#d9d1e4]
                                bg-[var(--surface)]
                                px-4
                                text-left
                                transition-all
                                duration-200
                                hover:border-[#9278dc]
                                hover:bg-[var(--tint)]
                            "
                        >
                            <div className="flex items-center gap-3">
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
                                bg-[var(--tint)]
                                p-2.5
                            "
                        >
                            <img
                                src={formData.photo.preview}
                                alt="Selected character reference"
                                className="
                                    h-12
                                    w-12
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
                                    hover:text-[var(--accent-hover)]
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

                {/* =====================================================
                    LANGUAGE & FONT
                ===================================================== */}

                <div className="mt-6">
                    <div className="mb-3 border-t border-dashed border-[#e7e1ed] pt-6">
                        <h3 className="text-[14px] font-bold text-[#4b4658]">
                            Story language & lettering
                        </h3>
                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                            These apply to the whole story, not just this character.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                        {/* LANGUAGE */}

                        <div>
                            <label
                                className="
                                    mb-2
                                    flex
                                    items-center
                                    gap-1.5
                                    text-[12px]
                                    font-semibold
                                    text-[var(--text-muted)]
                                "
                            >
                                <Languages
                                    size={14}
                                    className="text-[#8870c9]"
                                />
                                Language
                            </label>

                            <div className="grid grid-cols-2 gap-2">
                                {languageOptions.map((option) => {
                                    const isSelected =
                                        selections?.language?.id === option.id;

                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() =>
                                                onSelect?.("language", option)
                                            }
                                            className={`
                                                flex
                                                h-12
                                                items-center
                                                justify-center
                                                gap-2
                                                rounded-[14px]
                                                border
                                                text-[13px]
                                                font-semibold
                                                transition-all
                                                duration-200

                                                ${isSelected
                                                    ? `
                                                        border-[var(--accent-hover)]
                                                        bg-[var(--tint)]
                                                        text-[#5e3ccc]
                                                        shadow-[0_6px_14px_rgba(105,71,215,0.14)]
                                                    `
                                                    : `
                                                        border-[var(--border)]
                                                        bg-[var(--surface)]
                                                        text-[#686171]
                                                        hover:border-[#cbbde0]
                                                        hover:bg-white
                                                    `
                                                }
                                            `}
                                        >
                                            <span className="text-[17px] leading-none">
                                                {option.emoji}
                                            </span>
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* FONT */}

                        <div>
                            <label
                                className="
                                    mb-2
                                    flex
                                    items-center
                                    gap-1.5
                                    text-[12px]
                                    font-semibold
                                    text-[var(--text-muted)]
                                "
                            >
                                <Type
                                    size={14}
                                    className="text-[#8870c9]"
                                />
                                Font style
                            </label>

                            <div className="grid grid-cols-2 gap-2">
                                {fontOptions.map((option) => {
                                    const isSelected =
                                        selections?.font?.id === option.id;

                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() =>
                                                onSelect?.("font", option)
                                            }
                                            className={`
                                                flex
                                                h-12
                                                items-center
                                                justify-center
                                                gap-2
                                                rounded-[14px]
                                                border
                                                px-2
                                                text-[12px]
                                                font-semibold
                                                transition-all
                                                duration-200

                                                ${isSelected
                                                    ? `
                                                        border-[var(--accent-hover)]
                                                        bg-[var(--tint)]
                                                        text-[#5e3ccc]
                                                        shadow-[0_6px_14px_rgba(105,71,215,0.14)]
                                                    `
                                                    : `
                                                        border-[var(--border)]
                                                        bg-[var(--surface)]
                                                        text-[#686171]
                                                        hover:border-[#cbbde0]
                                                        hover:bg-white
                                                    `
                                                }
                                            `}
                                        >
                                            <span
                                                style={{ fontFamily: option.fontFamily }}
                                                className="text-[16px] font-bold leading-none"
                                            >
                                                Aa
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
                        h-11.5
                        items-center
                        gap-2
                        rounded-[13px]
                        px-5
                        text-[13px]
                        font-bold
                        transition-all

                        ${formData.name.trim()
                            ? `
                                    bg-[var(--accent-hover)]
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