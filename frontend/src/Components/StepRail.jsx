import { Check, X } from "lucide-react";

const STORY_STEPS = [
    {
        id: "age-theme",
        title: "Age & Theme",
        categories: ["age", "theme"],
        image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760656/Screenshot_2026-09-07_111515-Photoroom_duoph2.png",
    },
    {
        id: "subject",
        title: "Subject",
        categories: ["subject"],
        image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760470/Screenshot_2026-09-07_111521-Photoroom_e5cpyr.png",
    },
    {
        id: "centralmsg",
        title: "Central Message",
        categories: ["centralmsg"],
        image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760470/Screenshot_2026-09-07_111528-Photoroom_p6dh2j.png",
    },
    {
        id: "imageStyle",
        title: "Image Style",
        categories: ["imageStyle"],
        image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760656/Screenshot_2026-09-07_111532-Photoroom_yktpxn.png",
    },
    {
        id: "character",
        title: "Characters",
        categories: [],
        image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760470/Screenshot_2026-09-07_111538-Photoroom_tehazn.png",
    },
];

const StepRailAnimationStyles = () => (
    <style>{`
        @keyframes previewPopIn {
            0%   { opacity: 0; transform: translateY(-6px) scale(0.85); }
            60%  { opacity: 1; transform: translateY(1px) scale(1.04); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-preview-pop {
            animation: previewPopIn 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes badgePopIn {
            0%   { opacity: 0; transform: scale(0.4) rotate(-14deg); }
            70%  { opacity: 1; transform: scale(1.12) rotate(4deg); }
            100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .animate-badge-pop {
            animation: badgePopIn 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes activePulse {
            0%   { box-shadow: 0 0 0 0 rgba(104,70,215,0.25); }
            70%  { box-shadow: 0 0 0 12px rgba(104,70,215,0); }
            100% { box-shadow: 0 0 0 0 rgba(104,70,215,0); }
        }
        .animate-active-pulse {
            animation: activePulse 2.2s ease-out infinite;
        }
    `}</style>
);

export const StepRail = ({
    steps,
    activeStepId,
    onSelectStep,
    selections = {},
    characters = [],
    onClearStep,
}) => {

    const activeIndex = steps.findIndex(
        (step) => step.id === activeStepId
    );
    const getStepStatus = (step, index) => {
        if (step.id === activeStepId) return "active";
        if (
            step.id === "characters" &&
            characters.length > 0
        ) {
            return "completed";
        }
        if (
            step.categories?.length &&
            step.categories.every(
                (category) => selections[category]
            )
        ) {
            return "completed";
        }
        return index < activeIndex
            ? "completed"
            : "upcoming";
    };


    const getPreview = (step) => {

        if (step.id === "characters") {
            if (!characters.length) return null;

            return characters.length === 1
                ? characters[0].name
                : `${characters.length} Characters`;
        }

        const labels = step.categories
            ?.map((category) => selections[category]?.label)
            .filter(Boolean);

        return labels?.length
            ? labels.join(", ")
            : null;
    };


    const handleClear = (event, step) => {
        event.stopPropagation();
        onClearStep?.(step);
    };


    const progressPercent =
        activeIndex > 0
            ? (activeIndex / (steps.length - 1)) * 100
            : 0;


    return (
        <section className="relative overflow-hidden">

            <StepRailAnimationStyles />

            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[15%] -top-10 h-60 w-105 rounded-full bg-[#f3f0ff] blur-[110px]" />
                <div className="absolute right-[10%] -top-5 h-45 w-80 rounded-full bg-[#fdf3ff] blur-[100px]" />
            </div>


            <div className="relative z-10 mx-3 my-4 rounded-[22px] border border-[#eee9f7] bg-white/70 px-4 py-5 shadow-[0_12px_34px_rgba(105,71,215,0.06)] backdrop-blur-sm lg:mx-6 lg:my-6 lg:rounded-[28px] lg:px-8 lg:py-9">

                <div className="relative">
                    {/* Dashed background rail (large desktop only — mobile
                        AND tablet now share the compact scrolling layout,
                        so an absolutely positioned rail can't track it
                        reliably at those sizes) */}

                    <div className="absolute left-[10%] right-[10%] top-12.25 hidden h-1 lg:block">

                        {/* Dotted background rail */}
                        <div
                            className="h-full w-full rounded-full"
                            style={{
                                backgroundImage:
                                    "radial-gradient(circle, #ded8ef 1.5px, transparent 2.5px)",
                                backgroundSize: "12px 4px",
                            }}
                        />

                        {/* Gradient completed progress */}
                        <div
                            className="absolute left-0 top-0 h-full rounded-full bg-linear-to-r from-[#8f6ff0] to-[#5f38d6] shadow-[0_1px_4px_rgba(95,56,214,0.4)] transition-all duration-700 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />

                    </div>


                    {/* Steps: a swipeable row on mobile and tablet, a
                        fixed 5-column grid from lg: (1024px) up */}

                    <div className="scrollbar-hide relative z-10 flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-5 lg:gap-2 lg:overflow-visible lg:pb-0">

                        {steps.map((step, index) => {

                            const status = getStepStatus(step, index);
                            const isActive = status === "active";
                            const isCompleted = status === "completed";
                            const preview = getPreview(step);


                            return (

                                <div
                                    key={step.id}
                                    className="flex w-21 shrink-0 flex-col items-center text-center lg:w-auto lg:min-w-0 lg:shrink"
                                >


                                    {/* Image */}

                                    <button
                                        type="button"
                                        onClick={() => onSelectStep?.(step.id)}
                                        className={`
                                            group relative flex h-13 w-13 lg:h-23 lg:w-23
                                          items-center justify-center
                                            rounded-full border-[3px] bg-white
                                            transition-all duration-300
                                            ${isActive
                                                ? "animate-active-pulse scale-[1.06] border-[#6846d7]"
                                                : isCompleted
                                                    ? "border-[#c9bdf0] hover:border-[#a894e8]"
                                                    : "border-[#e5e1ee] hover:border-[#cabdea]"
                                            }
                                        `}
                                    >

                                        <div
                                            className={`
                                                absolute inset-1.25 rounded-full transition-colors duration-300 lg:inset-2
                                                ${isActive
                                                    ? "bg-linear-to-br from-(--tint) to-[#e6ddfb]"
                                                    : isCompleted
                                                        ? "bg-[#f7f4fd]"
                                                        : "bg-[#f8f7fa]"
                                                }
                                            `}
                                        />

                                        <img
                                            src={step.image}
                                            alt={step.title}
                                            className="relative z-10 h-9.5 w-9.5 rounded-full object-cover transition-transform duration-300 group-hover:scale-105 lg:h-17 lg:w-17"
                                        />

                                        {isCompleted && !isActive && (

                                            <div
                                                key={`badge-${step.id}`}
                                                className="animate-badge-pop absolute -right-1 -top-1 z-30 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-white bg-[#2fa350] text-white shadow-[0_3px_8px_rgba(47,163,80,0.4)] lg:-right-1.5 lg:-top-1.5 lg:h-7.5 lg:w-7.5"
                                            >

                                                <Check
                                                    size={12}
                                                    strokeWidth={3.5}
                                                />

                                            </div>

                                        )}

                                    </button>


                                    {/* Title */}

                                    <button
                                        type="button"
                                        onClick={() => onSelectStep?.(step.id)}
                                        className="mt-3 hover:opacity-80"
                                    >

                                        <h3
                                            className={`
                                                text-[10px] font-bold leading-tight transition-colors duration-200 lg:text-[13px] xl:text-[15px]
                                                ${isActive ? "text-[#6846d7]" : "text-[#332f4d]"}
                                            `}
                                        >
                                            {step.title}
                                        </h3>

                                    </button>


                                    {/* Empty space / Preview */}

                                    <div className="mt-2.5 min-h-8.5 w-full">

                                        {preview && (

                                            <div
                                                key={preview}
                                                className="
                                                    animate-preview-pop
                                                    flex w-full max-w-full items-center gap-1 lg:max-w-45 lg:gap-1.5
                                                    rounded-full border border-[#ddd3f7] bg-linear-to-r from-[#f4f1ff] to-[#ece3fb]
                                                    px-2 py-1 text-[9px] font-semibold text-[#54506d] lg:px-3 lg:py-1.5 lg:text-[12px]
                                                    shadow-[0_2px_8px_rgba(105,71,215,0.10)]
                                                "
                                            >

                                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--accent-hover)" />

                                                <span className="min-w-0 flex-1 truncate">
                                                    {preview}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={(event) =>
                                                        handleClear(event, step)
                                                    }
                                                    className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[#725ed0] transition-colors hover:bg-white hover:text-[#4b3a99] lg:h-4 lg:w-4"
                                                >
                                                    <X size={11} />
                                                </button>

                                            </div>

                                        )}

                                    </div>

                                </div>

                            );

                        })}

                    </div>

                </div>

            </div>

        </section>
    );
};