import { Check, X } from "lucide-react";

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
    const activeIndex = steps.findIndex((step) => step.id === activeStepId);

    // A step only shows the tick when the user has actually filled it in.
    // Merely moving past a step (Next / clicking the rail) does not complete it.
    const getStepStatus = (step) => {
        if (step.id === activeStepId) return "active";

        const isFilled =
            step.id === "character"
                ? characters.length > 0
                : Boolean(step.categories?.length) &&
                  step.categories.every((category) => selections[category]);

        return isFilled ? "completed" : "upcoming";
    };

    const getPreview = (step) => {
        if (step.id === "character") {
            if (!characters.length) return null;

            return characters.length === 1
                ? characters[0].name
                : `${characters.length} Characters`;
        }

        const labels = step.categories
            ?.map((category) => selections[category]?.label)
            .filter(Boolean);

        return labels?.length ? labels.join(", ") : null;
    };

    // Only reserve vertical space for the preview chips once at least one exists.
    const hasAnyPreview = steps.some((step) => Boolean(getPreview(step)));

    const handleClear = (event, step) => {
        event.stopPropagation();
        onClearStep?.(step);
    };

    const progressPercent =
        activeIndex > 0 ? (activeIndex / (steps.length - 1)) * 100 : 0;

    return (
        <section className="relative shrink-0 overflow-hidden">
            <StepRailAnimationStyles />

            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[15%] -top-10 h-60 w-105 rounded-full bg-[#f3f0ff] blur-[110px]" />
                <div className="absolute right-[10%] -top-5 h-45 w-80 rounded-full bg-[#fdf3ff] blur-[100px]" />
            </div>

            <div className="relative z-10 mx-3 my-1.5 rounded-[20px] border border-[#eee9f7] bg-white/70 px-4 py-2.5 shadow-[0_8px_24px_rgba(105,71,215,0.06)] backdrop-blur-sm lg:mx-6 lg:my-2 lg:rounded-[24px] lg:px-8 lg:py-3">
                <div className="relative">
                    {/* Dashed background rail (large desktop only) */}
                    <div className="absolute left-[10%] right-[10%] top-6.5 hidden h-1 lg:block">
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

                    {/* Steps: swipeable row on mobile/tablet, 5-column grid from lg: up */}
                    <div className="scrollbar-hide relative z-10 flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-5 lg:gap-2 lg:overflow-visible lg:pb-0">
                        {steps.map((step) => {
                            const status = getStepStatus(step);
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
                                            group relative flex h-12 w-12 lg:h-14 lg:w-14
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
                                                absolute inset-1.25 rounded-full transition-colors duration-300 lg:inset-1.5
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
                                            className="relative z-10 h-8 w-8 rounded-full object-cover transition-transform duration-300 group-hover:scale-105 lg:h-9 lg:w-9"
                                        />

                                        {isCompleted && !isActive && (
                                            <div
                                                key={`badge-${step.id}`}
                                                className="animate-badge-pop absolute -right-1 -top-1 z-30 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-white bg-[#2fa350] text-white shadow-[0_3px_8px_rgba(47,163,80,0.4)] lg:-right-1 lg:-top-1 lg:h-5.5 lg:w-5.5"
                                            >
                                                <Check size={12} strokeWidth={3.5} />
                                            </div>
                                        )}
                                    </button>

                                    {/* Title */}
                                    <button
                                        type="button"
                                        onClick={() => onSelectStep?.(step.id)}
                                        className="mt-1.5 hover:opacity-80"
                                    >
                                        <h3
                                            className={`
                                                text-[10px] font-bold leading-tight transition-colors duration-200 lg:text-[13px]
                                                ${isActive ? "text-[#6846d7]" : "text-[#332f4d]"}
                                            `}
                                        >
                                            {step.title}
                                        </h3>
                                    </button>

                                    {/* Preview slot: only takes space once something is selected */}
                                    {hasAnyPreview && (
                                        <div className="mt-1.5 min-h-6 w-full">
                                            {preview && (
                                                <div
                                                    key={preview}
                                                    className="
                                                        animate-preview-pop mx-auto
                                                        flex w-full max-w-full items-center gap-1 lg:max-w-45 lg:gap-1.5
                                                        rounded-full border border-[#ddd3f7] bg-linear-to-r from-[#f4f1ff] to-[#ece3fb]
                                                        px-2 py-0.5 text-[9px] font-semibold text-[#54506d] lg:px-3 lg:py-1 lg:text-[12px]
                                                        shadow-[0_2px_8px_rgba(105,71,215,0.10)]
                                                    "
                                                >
                                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--accent-hover)" />

                                                    <span className="min-w-0 flex-1 truncate">
                                                        {preview}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={(event) => handleClear(event, step)}
                                                        className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[#725ed0] transition-colors hover:bg-white hover:text-[#4b3a99] lg:h-4 lg:w-4"
                                                    >
                                                        <X size={11} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};