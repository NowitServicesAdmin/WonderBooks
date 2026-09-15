import { Check, X } from "lucide-react";

const STORY_STEPS = [
    {
        id: "age-theme",
        title: "Age & Theme",
        categories: ["age", "theme"],
        // image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760656/Screenshot_2026-09-07_111515-Photoroom_duoph2.png",
        image: "data:image/jpeg;base64,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"
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
                <div className="absolute left-[15%] top-[-40px] h-[240px] w-[420px] rounded-full bg-[#f3f0ff] blur-[110px]" />
                <div className="absolute right-[10%] top-[-20px] h-[180px] w-[320px] rounded-full bg-[#fdf3ff] blur-[100px]" />
            </div>


            <div className="relative z-10 mx-6 my-6 rounded-[28px] border border-[#eee9f7] bg-white/70 px-8 py-9 shadow-[0_12px_34px_rgba(105,71,215,0.06)] backdrop-blur-sm">

                <div className="relative">
                    {/* Dashed background rail */}

                    <div className="absolute left-[10%] right-[10%] top-[49px] h-[4px]">

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
                            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#8f6ff0] to-[#5f38d6] shadow-[0_1px_4px_rgba(95,56,214,0.4)] transition-all duration-700 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />

                    </div>


                    {/* Steps */}

                    <div className="relative z-10 grid grid-cols-5 gap-2">

                        {steps.map((step, index) => {

                            const status = getStepStatus(step, index);
                            const isActive = status === "active";
                            const isCompleted = status === "completed";
                            const preview = getPreview(step);


                            return (

                                <div
                                    key={step.id}
                                    className="flex min-w-0 flex-col items-center text-center"
                                >


                                    {/* Image */}

                                    <button
                                        type="button"
                                        onClick={() => onSelectStep?.(step.id)}
                                        className={`
                                            group relative flex h-[92px] w-[92px]
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
                                                absolute inset-[8px] rounded-full transition-colors duration-300
                                                ${isActive
                                                    ? "bg-gradient-to-br from-[#f1edff] to-[#e6ddfb]"
                                                    : isCompleted
                                                        ? "bg-[#f7f4fd]"
                                                        : "bg-[#f8f7fa]"
                                                }
                                            `}
                                        />

                                        <img
                                            src={step.image}
                                            alt={step.title}
                                            className="relative z-10 h-[68px] w-[68px] rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />

                                        {isCompleted && !isActive && (

                                            <div
                                                key={`badge-${step.id}`}
                                                className="animate-badge-pop absolute -right-1.5 -top-1.5 z-30 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white bg-[#2fa350] text-white shadow-[0_3px_8px_rgba(47,163,80,0.4)]"
                                            >

                                                <Check
                                                    size={16}
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
                                                whitespace-nowrap text-[15px] font-bold leading-tight transition-colors duration-200
                                                ${isActive ? "text-[#6846d7]" : "text-[#332f4d]"}
                                            `}
                                        >
                                            {step.title}
                                        </h3>

                                    </button>


                                    {/* Empty space / Preview */}

                                    <div className="mt-2.5 min-h-[34px]">

                                        {preview && (

                                            <div
                                                key={preview}
                                                className="
                                                    animate-preview-pop
                                                    flex max-w-[180px] items-center gap-1.5
                                                    rounded-full border border-[#ddd3f7] bg-gradient-to-r from-[#f4f1ff] to-[#ece3fb]
                                                    px-3 py-1.5 text-[12px] font-semibold text-[#54506d]
                                                    shadow-[0_2px_8px_rgba(105,71,215,0.10)]
                                                "
                                            >

                                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6947d7]" />

                                                <span className="truncate">
                                                    {preview}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={(event) =>
                                                        handleClear(event, step)
                                                    }
                                                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[#725ed0] transition-colors hover:bg-white hover:text-[#4b3a99]"
                                                >
                                                    <X size={13} />
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