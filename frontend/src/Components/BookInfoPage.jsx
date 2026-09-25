import { BookOpen, Mic, Star, WandSparkles } from "lucide-react";

export const BookInfoPage = ({
    title,
    ageLabel,
    description,
    readingTime,
    theme,
    bestFor,
    inputLabel = "Your Story Input",
    inputText,
}) => (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-white px-12 text-center">
        {/* CORNERS */}
        <span className="pointer-events-none absolute left-7 top-7 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-[#dfcf9d]" />
        <span className="pointer-events-none absolute right-7 top-7 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-[#dfcf9d]" />
        <span className="pointer-events-none absolute bottom-7 left-7 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-[#dfcf9d]" />
        <span className="pointer-events-none absolute bottom-7 right-7 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-[#dfcf9d]" />

        {/* TITLE */}
        <h3 className="max-w-142.5 font-serif text-[40px] font-bold leading-[1.12] text-[var(--text-heading)]">
            {title}
        </h3>

        {/* DIVIDER */}
        <div className="my-5 flex items-center gap-3">
            <span className="h-px w-12 bg-[#dfcf9d]" />
            <span className="h-2 w-2 rounded-full bg-[#c9a24d]" />
            <span className="h-px w-12 bg-[#dfcf9d]" />
        </div>

        {/* AGE */}
        {ageLabel && (
            <span className="rounded-full bg-[#f0e8ff] px-5 py-1.5 text-[12px] font-bold text-[var(--accent)]">
                {ageLabel}
            </span>
        )}

        {/* DESCRIPTION */}
        {description && (
            <p className="mt-6 line-clamp-4 max-w-130 text-[14px] leading-7 text-[#77738b]">
                {description}
            </p>
        )}

        {/* INFO */}
        <div className="mt-6 grid w-full max-w-130 grid-cols-3 rounded-[20px] border border-[#e8e2f2] bg-white p-4">
            <div className="flex flex-col items-center gap-1">
                <BookOpen size={18} className="text-[var(--accent)]" />
                <p className="text-[9px] font-semibold uppercase tracking-wide text-[#a39fb5]">Reading Time</p>
                <p className="text-[12px] font-bold text-[var(--text-heading)]">{readingTime}</p>
            </div>
            <div className="flex flex-col items-center gap-1 border-x border-[#e8e2f2]">
                <WandSparkles size={18} className="text-[var(--accent)]" />
                <p className="text-[9px] font-semibold uppercase tracking-wide text-[#a39fb5]">Theme</p>
                <p className="text-[12px] font-bold text-[var(--text-heading)]">{theme}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
                <Star size={18} className="text-[var(--accent)]" />
                <p className="text-[9px] font-semibold uppercase tracking-wide text-[#a39fb5]">Best For</p>
                <p className="text-[12px] font-bold text-[var(--text-heading)]">{bestFor}</p>
            </div>
        </div>

        {/* STORY INPUT */}
        {inputText && (
            <div className="mt-5 w-full max-w-130 rounded-[20px] border border-[#e7e0f4] bg-[var(--tint)] p-4 text-left">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-[var(--accent)]">
                    <Mic size={13} />
                    {inputLabel}
                </div>
                <p className="line-clamp-4 text-[12px] italic leading-6 text-[#6b6680]">
                    &quot;{inputText}&quot;
                </p>
            </div>
        )}
    </div>
);

export default BookInfoPage;
