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
    Languages,
    Type,
} from "lucide-react";
import { useState, useRef } from "react";

const CHARACTER_TYPES = [
    { id: "person", label: "Person", icon: UserRound },
    { id: "animal", label: "Animal", icon: PawPrint },
    { id: "object", label: "Object", icon: Package },
];

const GENDER_OPTIONS = [
    { id: "female", label: "Girl", emoji: "👧", selectedClass: "border-[#f7bfd1] bg-[#fff2f6]", dotClass: "border-[#ee7fa4]" },
    { id: "male", label: "Boy", emoji: "👦", selectedClass: "border-[#bfd8fb] bg-[#f1f7ff]", dotClass: "border-[#79a9ed]" },
    { id: "non-binary", label: "Other", emoji: "🌈", selectedClass: "border-[#cce7c9] bg-[#f3fbf1]", dotClass: "border-[#8fc58b]" },
];

const emptyForm = () => ({
    name: "",
    gender: "",
    age: "",
    hobbies: "",
    favouriteFood: "",
    photo: null,
});

// shared styles
const labelClass =
    "mb-1.5 flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-(--text-muted)";

const fieldBase = `
    w-full rounded-[13px] border border-(--border) bg-(--surface)
    text-[14px] text-[#4b4655] outline-none transition-all
    placeholder:text-[#b2acb9]
    focus:border-[#8062db] focus:bg-white focus:ring-4 focus:ring-(--tint)
`;
const inputClass = `${fieldBase} h-11 px-4`;
const textareaClass = `${fieldBase} min-h-[84px] resize-none px-4 py-3 text-[13px] leading-relaxed`;

const SectionTitle = ({ icon: Icon, children, optional }) => (
    <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-(--tint) text-[#6b4bd3]">
            <Icon size={15} />
        </div>
        <h3 className="text-[14px] font-bold text-[#464151]">{children}</h3>
        {optional && (
            <span className="rounded-full bg-[#f4f0fa] px-2 py-0.5 text-[10px] font-medium text-[#9991a3]">
                Optional
            </span>
        )}
    </div>
);

export const CharacterWorkspace = ({
    characters,
    setCharacters,
    selections = {},
    onSelect,
    languageOptions = [],
    fontOptions = [],
}) => {
    const [characterType, setCharacterType] = useState("person");
    const [formData, setFormData] = useState(emptyForm());
    const fileInputRef = useRef(null);

    const getCharacterForType = (type, source = characters) =>
        source.find((character) => character.type === type);

    const handleChange = (field, value) => {
        setFormData((previous) => ({ ...previous, [field]: value }));
    };

    // save current tab
    const saveCurrentTab = (type = characterType, data = formData) => {
        // Don't create an empty character just because the user clicked another tab.
        if (!data.name?.trim()) return;

        setCharacters((previous) => {
            const existingIndex = previous.findIndex((c) => c.type === type);

            const character = {
                id: existingIndex >= 0 ? previous[existingIndex].id : Date.now(),
                type,
                ...data,
                // objects have no gender
                gender: type === "object" ? "" : data.gender,
            };

            if (existingIndex >= 0) {
                return previous.map((item, index) =>
                    index === existingIndex ? character : item
                );
            }
            return [...previous, character];
        });
    };

    const handleCharacterTypeChange = (nextType) => {
        if (nextType === characterType) return;

        saveCurrentTab(characterType, formData);

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

    // photo upload
    const handlePhotoUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFormData((previous) => {
            if (previous.photo?.preview) {
                URL.revokeObjectURL(previous.photo.preview);
            }
            return {
                ...previous,
                photo: { file, preview: URL.createObjectURL(file), name: file.name },
            };
        });

        event.target.value = "";
    };

    const removePhoto = () => {
        if (formData.photo?.preview) {
            URL.revokeObjectURL(formData.photo.preview);
        }
        setFormData((previous) => ({ ...previous, photo: null }));
    };

    const handleSaveCharacter = () => {
        if (!formData.name.trim()) return;
        saveCurrentTab(characterType, formData);
    };

    const currentCharacter = getCharacterForType(characterType);
    const typeLabel =
        CHARACTER_TYPES.find((type) => type.id === characterType)?.label || "Character";
    const canSave = Boolean(formData.name.trim());
    const showGender = characterType !== "object";

    return (
        <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] border border-[#e6e1ee] bg-white shadow-[0_10px_30px_rgba(87,67,150,0.05)]">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                {/* ---------------- CHARACTER TYPE ---------------- */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-[14px] font-bold text-[#4b4658]">
                            Choose the type of character
                        </h3>
                        <p className="mt-0.5 text-[11px] text-(--text-muted)">
                            Select what kind of character you want to create.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {CHARACTER_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isSelected = characterType === type.id;

                            return (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => handleCharacterTypeChange(type.id)}
                                    className={`
                                        flex h-10 items-center gap-2 rounded-[12px] border px-4
                                        text-[13px] font-semibold transition-all duration-200
                                        ${isSelected
                                            ? "border-(--accent-hover) bg-(--accent-hover) text-white shadow-[0_6px_16px_rgba(105,71,215,0.22)]"
                                            : "border-[#e2ddea] bg-white text-[#676174] hover:border-[#cbbdea] hover:bg-(--tint)"
                                        }
                                    `}
                                >
                                    <Icon size={16} />
                                    {type.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="my-4 border-t border-dashed border-[#e7e1ed]" />

                {/* ---------------- DETAILS + PHOTO (2 columns on large screens) ---------------- */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1fr]">
                    {/* DETAILS */}
                    <div className="min-w-0">
                        <SectionTitle icon={UserRound}>{typeLabel} details</SectionTitle>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_130px]">
                            <div>
                                <label className={labelClass}>
                                    <UserRound size={14} className="text-[#8870c9]" />
                                    Main character name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    placeholder="e.g. Emma, Leo, Luna..."
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>
                                    <CalendarDays size={14} className="text-[#8870c9]" />
                                    Age
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.age}
                                    onChange={(e) => handleChange("age", e.target.value)}
                                    placeholder="e.g. 7"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {showGender && (
                        <div className="mt-4">
                            <label className={labelClass}>
                                <Users size={14} className="text-[#8870c9]" />
                                Gender
                            </label>

                            <div className="grid h-11 grid-cols-3 gap-2">
                                {GENDER_OPTIONS.map((option) => {
                                    const isSelected = formData.gender === option.id;

                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => handleChange("gender", option.id)}
                                            className={`
                                                flex min-w-0 items-center justify-center gap-2 rounded-[13px] border px-2
                                                text-[12px] font-semibold transition-all duration-200
                                                ${isSelected
                                                    ? option.selectedClass
                                                    : "border-(--border) bg-(--surface) text-[#686171] hover:border-[#cfc5de] hover:bg-white"
                                                }
                                            `}
                                        >
                                            <span
                                                className={`hidden h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 bg-white sm:flex ${option.dotClass}`}
                                            >
                                                {isSelected && (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                )}
                                            </span>
                                            <span className="text-[16px] leading-none">{option.emoji}</span>
                                            <span className="truncate">{option.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        )}

                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>
                                    <Heart size={14} className="text-[#8870c9]" />
                                    Hobbies & interests
                                    <span className="text-[10px] font-normal text-[#aaa3b0]">Optional</span>
                                </label>
                                <textarea
                                    value={formData.hobbies}
                                    onChange={(e) => handleChange("hobbies", e.target.value)}
                                    placeholder="e.g. Drawing, cycling, playing football..."
                                    className={textareaClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>
                                    <Utensils size={14} className="text-[#8870c9]" />
                                    Favourite food
                                    <span className="text-[10px] font-normal text-[#aaa3b0]">Optional</span>
                                </label>
                                <textarea
                                    value={formData.favouriteFood}
                                    onChange={(e) => handleChange("favouriteFood", e.target.value)}
                                    placeholder="e.g. Pizza, ice cream, mangoes..."
                                    className={textareaClass}
                                />
                            </div>
                        </div>
                    </div>

                    {/* PHOTO */}
                    <div className="min-w-0 lg:border-l lg:border-dashed lg:border-[#e7e1ed] lg:pl-6">
                        <SectionTitle icon={ImagePlus} optional>
                            Reference photo
                        </SectionTitle>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                        />

                        {!formData.photo ? (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="
                                    flex h-32 w-full flex-col items-center justify-center gap-1.5
                                    rounded-[15px] border border-dashed border-[#d9d1e4] bg-(--surface)
                                    text-center transition-all duration-200
                                    hover:border-[#9278dc] hover:bg-(--tint)
                                "
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#e2dbe9] bg-white text-[#756b81] shadow-sm">
                                    <Paperclip size={17} />
                                </div>
                                <p className="text-[12px] font-semibold text-[#615b6d]">
                                    Add character photo
                                </p>
                                <p className="text-[10px] text-[#aaa4b0]">PNG, JPG or WEBP</p>
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 rounded-[15px] border border-[#ded5eb] bg-(--tint) p-2.5">
                                <img
                                    src={formData.photo.preview}
                                    alt="Selected character reference"
                                    className="h-14 w-14 rounded-[10px] object-cover"
                                />

                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-semibold text-[#4d4757]">
                                        Photo selected
                                    </p>
                                    <p className="mt-0.5 truncate text-[10px] text-[#96909f]">
                                        {formData.photo.name}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-[#e3dce9] bg-white text-[#756b81] hover:border-[#cbbde0] hover:text-(--accent-hover)"
                                    title="Change photo"
                                >
                                    <Paperclip size={15} />
                                </button>

                                <button
                                    type="button"
                                    onClick={removePhoto}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-[#eee3e8] bg-white text-[#a19aa8] hover:border-[#efcaca] hover:text-[#d35d5d]"
                                    title="Remove photo"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        )}

                        <div className="mt-3 flex items-start gap-2.5 rounded-[13px] border border-[#eee3c9] bg-[#fffaf0] px-3.5 py-2.5">
                            <Info size={15} className="mt-0.5 shrink-0 text-[#d79a24]" />
                            <p className="text-[11px] leading-relaxed text-[#887c65]">
                                Use a clear photo where the character is fully visible. A full-body
                                image works best for illustrations.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ---------------- LANGUAGE & FONT ---------------- */}
                <div className="mt-5 border-t border-dashed border-[#e7e1ed] pt-4">
                    <div className="mb-3">
                        <h3 className="text-[14px] font-bold text-[#4b4658]">
                            Story language & lettering
                        </h3>
                        <p className="mt-0.5 text-[11px] text-(--text-muted)">
                            These apply to the whole story, not just this character.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
                        {/* LANGUAGE */}
                        <div>
                            <label className={labelClass}>
                                <Languages size={14} className="text-[#8870c9]" />
                                Language
                            </label>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                                {languageOptions.map((option) => {
                                    const isSelected = selections?.language?.id === option.id;

                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => onSelect?.("language", option)}
                                            className={`
                                                flex h-10 items-center justify-center gap-2 rounded-[12px] border
                                                text-[12px] font-semibold transition-all duration-200
                                                ${isSelected
                                                    ? "border-(--accent-hover) bg-(--tint) text-[#5e3ccc] shadow-[0_6px_14px_rgba(105,71,215,0.14)]"
                                                    : "border-(--border) bg-(--surface) text-[#686171] hover:border-[#cbbde0] hover:bg-white"
                                                }
                                            `}
                                        >
                                            <span className="text-[16px] leading-none">{option.emoji}</span>
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* FONT */}
                        <div>
                            <label className={labelClass}>
                                <Type size={14} className="text-[#8870c9]" />
                                Font style
                            </label>

                            <div className="grid grid-cols-2 gap-2">
                                {fontOptions.map((option) => {
                                    const isSelected = selections?.font?.id === option.id;

                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => onSelect?.("font", option)}
                                            className={`
                                                flex h-10 items-center justify-center gap-2 rounded-[12px] border px-2
                                                text-[12px] font-semibold transition-all duration-200
                                                ${isSelected
                                                    ? "border-(--accent-hover) bg-(--tint) text-[#5e3ccc] shadow-[0_6px_14px_rgba(105,71,215,0.14)]"
                                                    : "border-(--border) bg-(--surface) text-[#686171] hover:border-[#cbbde0] hover:bg-white"
                                                }
                                            `}
                                        >
                                            <span
                                                style={{ fontFamily: option.fontFamily }}
                                                className="text-[15px] font-bold leading-none"
                                            >
                                                Aa
                                            </span>
                                            <span className="truncate">{option.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ---------------- FOOTER ---------------- */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#eeeaf3] bg-white px-4 py-3 sm:px-6">
                <p className="text-[11px] text-[#8e8798]">
                    {currentCharacter
                        ? `${typeLabel} character saved. You can update the details.`
                        : "You can create one character for each type."}
                </p>

                <button
                    type="button"
                    onClick={handleSaveCharacter}
                    disabled={!canSave}
                    className={`
                        flex h-11 shrink-0 items-center gap-2 rounded-[13px] px-5
                        text-[13px] font-bold transition-all
                        ${canSave
                            ? "bg-(--accent-hover) text-white shadow-[0_8px_18px_rgba(105,71,215,0.22)] hover:bg-[#5e3ccc]"
                            : "cursor-not-allowed bg-[#eeebf4] text-[#aaa4b2]"
                        }
                    `}
                >
                    <ImagePlus size={17} />
                    {currentCharacter ? "Update Character" : "Add Character"}
                </button>
            </div>
        </section>
    );
};