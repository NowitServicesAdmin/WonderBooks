import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HTMLFlipBook from "react-pageflip";
import {
    ChevronLeft,
    ChevronRight,
    Star,
    WandSparkles,
    Mic,
    BookOpen,
    ArrowLeft,
} from "lucide-react";
import { templates, buildPages,categoryThemes } from "../Data/Templatesdata";

const THUMBS_VISIBLE = 9;

export const TemplateDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const selectedTemplate = useMemo(
        () => templates.find((t) => String(t.id) === String(id)),
        [id]
    );

    const pages = useMemo(
        () => (selectedTemplate ? buildPages(selectedTemplate) : []),
        [selectedTemplate]
    );

    // Each "spread" becomes two leaves for react-pageflip: image leaf + content leaf,
    // so a flip reveals image-left / text-right, like turning one physical page.
    const leaves = useMemo(
        () =>
            pages.flatMap((page) => [
                { type: "image", page },
                { type: "content", page },
            ]),
        [pages]
    );

    const [pageIndex, setPageIndex] = useState(0); // spread index, not leaf index
    const [pageNavOpen, setPageNavOpen] = useState(false);

    const bookRef = useRef(null);
    const filmstripRef = useRef(null);

    const goBackToList = () => navigate("/templates");

    const goNextPage = () => bookRef.current?.pageFlip()?.flipNext();
    const goPrevPage = () => bookRef.current?.pageFlip()?.flipPrev();
    const goToSpread = (spreadIdx) =>
        bookRef.current?.pageFlip()?.turnToPage(spreadIdx * 2);

    const handleFlip = (e) => setPageIndex(Math.floor(e.data / 2));

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "ArrowRight") goNextPage();
            if (event.key === "ArrowLeft") goPrevPage();
            if (event.key === "Escape") goBackToList();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Keep the active thumbnail scrolled into view on the filmstrip
    useEffect(() => {
        if (!filmstripRef.current) return;
        const active = filmstripRef.current.querySelector(`[data-page="${pageIndex}"]`);
        if (active) active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }, [pageIndex]);

    // Template id not found (bad URL, deleted item, etc.)
    if (!selectedTemplate) {
        return (
            <section className="w-full overflow-hidden rounded-2xl border border-[#e6e3f2]  p-2 text-center shadow-[0_2px_10px_rgba(67,52,130,0.04)]">
                <p className="text-lg font-bold text-[#332f54]">Template not found</p>
                <p className="mt-2 text-sm text-[#9995aa]">
                    It may have been removed, or the link is incorrect.
                </p>
                <button
                    type="button"
                    onClick={goBackToList}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#5d2bc5] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#5122b4]"
                >
                    <ArrowLeft size={16} />
                    Back to Templates
                </button>
            </section>
        );
    }

    const bestForAge = selectedTemplate.age.replace(/^Ages\s*/i, "");
    const isFirstPage = pageIndex === 0;
    const isLastPage = pageIndex === pages.length - 1;

    const visibleThumbs = pages.slice(0, THUMBS_VISIBLE);
    const overflowCount = pages.length - THUMBS_VISIBLE;

    return (
        <section className="w-full rounded-2xl  p-0">
           

            <div className="flex min-h-[880px] flex-col">
                {/* Reader body: optional page-navigator drawer + flip book */}
                <div className="relative flex flex-1">
                    {pageNavOpen && (
                        <div className="flex w-[210px] shrink-0 flex-col overflow-y-auto border-r border-[#e6e2f5]">
                            <p className="px-4 text-[11px] font-bold uppercase tracking-wide text-[#a39fb5]">
                                Pages
                            </p>
                            <div className="flex-1 space-y-2.5 px-4 pb-4">
                                {pages.map((page, i) => {
                                    const active = i === pageIndex;
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => goToSpread(i)}
                                            className={`flex w-full items-center gap-3 rounded-xl  text-left transition ${
                                                active ? "bg-white shadow-[0_4px_14px_rgba(93,43,197,0.14)]" : "hover:bg-white/70"
                                            }`}
                                        >
                                            <span
                                                className={`w-4 shrink-0 text-[11px] font-bold ${
                                                    active ? "text-[#5d2bc5]" : "text-[#b3aec4]"
                                                }`}
                                            >
                                                {i + 1}
                                            </span>
                                            <div
                                                className={`aspect-[4/3] w-full overflow-hidden rounded-lg ${
                                                    active ? "border-2 border-[#5d2bc5]" : "border border-[#e4e1eb]"
                                                }`}
                                            >
                                                <img src={page.image} alt="" className="h-full w-full object-cover" />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {/* Book spread */}
                    <div className="relative flex flex-1 items-start justify-center">
                        <button
                            type="button"
                            onClick={goPrevPage}
                            disabled={isFirstPage}
                            className="absolute left-1 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#604bc0] shadow-md transition hover:bg-[#f5f2ff] disabled:opacity-30 disabled:hover:bg-white sm:left-4"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        {/* Hardcover-style frame around the flip book */}
                        <div
                            className="relative mx-auto h-[660px] w-full max-w-6xl rounded-[24px] bg-gradient-to-br from-[#fffefb] via-[#f8f4e9] to-[#efe8d5] p-3"
                            style={{
                                boxShadow: `
                                    0 35px 80px rgba(59,43,120,0.32),
                                    0 0 0 1px rgba(59,43,120,0.07),
                                    4px 4px 0 0 #f6f2e6,
                                    4px 4px 0 1px rgba(59,43,120,0.09),
                                    8px 8px 0 0 #eee6d0,
                                    8px 8px 0 1px rgba(59,43,120,0.07),
                                    -4px 4px 0 0 #f6f2e6,
                                    -4px 4px 0 1px rgba(59,43,120,0.09),
                                    -8px 8px 0 0 #eee6d0,
                                    -8px 8px 0 1px rgba(59,43,120,0.07)
                                `,
                            }}
                        >
                            <div className="relative h-full w-full overflow-hidden rounded-[16px] bg-[#fdfbf6]">
                                <HTMLFlipBook
                                    ref={bookRef}
                                    width={550}
                                    height={610}
                                    size="stretch"
                                    minWidth={320}
                                    maxWidth={1200}
                                    minHeight={400}
                                    maxHeight={900}
                                    showCover={false}
                                    usePortrait={false}
                                    mobileScrollSupport={true}
                                    drawShadow={true}
                                    flippingTime={600}
                                    onFlip={handleFlip}
                                    className="story-flipbook"
                                    style={{ margin: "0 auto" }}
                                >
                                    {leaves.map((leaf, i) => (
                                        <div className="flip-page" key={i}>
                                            {leaf.type === "image" ? (
                                                <div className="relative h-full w-full">
                                                    <img
                                                        src={leaf.page.image}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-[#5d2bc5] shadow-sm">
                                                        <Star size={11} fill="currentColor" />
                                                        {selectedTemplate.category}
                                                    </span>
                                                    {leaf.page.kind === "cover" && (
                                                        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                                                            <WandSparkles size={11} />
                                                            AI Generated
                                                        </span>
                                                    )}
                                                </div>
                                            ) : leaf.page.kind === "story" ? (
                                                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center sm:p-12">
                                                    <p className="font-serif text-[19px] leading-9 text-[#3c3860]">
                                                        {leaf.page.text}
                                                    </p>
                                                </div>
                                            ) : leaf.page.kind === "cover" ? (
                                                <div className="relative flex h-full flex-col items-center justify-center gap-4 overflow-y-auto p-8 text-center sm:p-10">
                                                    <span className="pointer-events-none absolute left-4 top-4 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-[#e3d5a8]" />
                                                    <span className="pointer-events-none absolute right-4 top-4 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-[#e3d5a8]" />
                                                    <span className="pointer-events-none absolute left-4 bottom-4 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-[#e3d5a8]" />
                                                    <span className="pointer-events-none absolute right-4 bottom-4 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-[#e3d5a8]" />

                                                    <h3 className="font-serif text-3xl font-bold leading-tight text-[#29254d] sm:text-4xl">
                                                        {leaf.page.heading}
                                                    </h3>

                                                    <div className="flex items-center gap-2 text-[#c9a24d]">
                                                        <span className="h-px w-8 bg-[#e3d5a8]" />
                                                        <span className="h-1.5 w-1.5 rounded-full bg-[#c9a24d]" />
                                                        <span className="h-px w-8 bg-[#e3d5a8]" />
                                                    </div>

                                                    <span className="rounded-full bg-[#f3edff] px-4 py-1 text-[12px] font-bold text-[#5d2bc5]">
                                                        {selectedTemplate.age}
                                                    </span>

                                                    <p className="max-w-xs text-[14px] leading-7 text-[#77738b]">
                                                        {selectedTemplate.description}
                                                    </p>

                                                    <div className="grid w-full max-w-xs grid-cols-3 gap-2 rounded-2xl border border-[#ece7f7] p-3">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <BookOpen size={15} className="text-[#5d2bc5]" />
                                                            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#a39fb5]">
                                                                Reading Time
                                                            </p>
                                                            <p className="text-[11.5px] font-bold text-[#332f54]">5–10 min</p>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1 border-x border-[#ece7f7]">
                                                            <WandSparkles size={15} className="text-[#5d2bc5]" />
                                                            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#a39fb5]">
                                                                Theme
                                                            </p>
                                                            <p className="text-[11.5px] font-bold text-[#332f54]">
                                                                {selectedTemplate.category}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Star size={15} className="text-[#5d2bc5]" />
                                                            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#a39fb5]">
                                                                Best For
                                                            </p>
                                                            <p className="text-[11.5px] font-bold text-[#332f54]">
                                                                Kids {bestForAge}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="w-full max-w-xs rounded-2xl border border-[#ece7f7] bg-[#faf9ff] p-3 text-left">
                                                        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#5d2bc5]">
                                                            <Mic size={12} />
                                                            Your Story Input
                                                        </div>
                                                        <p className="text-[12px] italic leading-6 text-[#6b6680]">
                                                            "{selectedTemplate.description}"
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative flex h-full flex-col items-center justify-center gap-3 p-8 text-center sm:p-12">
                                                    <span className="pointer-events-none absolute left-4 top-4 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-[#e3d5a8]" />
                                                    <span className="pointer-events-none absolute right-4 top-4 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-[#e3d5a8]" />
                                                    <span className="pointer-events-none absolute left-4 bottom-4 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-[#e3d5a8]" />
                                                    <span className="pointer-events-none absolute right-4 bottom-4 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-[#e3d5a8]" />
                                                    <h3 className="font-serif text-3xl font-bold leading-tight text-[#29254d] sm:text-4xl">
                                                        {leaf.page.heading}
                                                    </h3>
                                                    <p className="text-sm font-semibold text-[#9893a8]">
                                                        {leaf.page.sub}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </HTMLFlipBook>

                                {/* Center spine gutter — the fold shadow where the two pages meet */}
                                <div
                                    className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-10 -translate-x-1/2"
                                    style={{
                                        background: `linear-gradient(
                                            to right,
                                            rgba(40,30,90,0) 0%,
                                            rgba(40,30,90,0.12) 40%,
                                            rgba(40,30,90,0.22) 50%,
                                            rgba(40,30,90,0.12) 60%,
                                            rgba(40,30,90,0) 100%
                                        )`,
                                    }}
                                />
                            </div>

                            {/* Grounding contact shadow so the book looks lifted off the page */}
                            <div
                                className="pointer-events-none absolute -bottom-8 left-1/2 h-10 w-[78%] -translate-x-1/2 rounded-[100%] blur-2xl bg-white"
                                // style={{ background: "rgba(235, 232, 241, 0.22)" }}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={goNextPage}
                            disabled={isLastPage}
                            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#604bc0] shadow-md transition hover:bg-[#f5f2ff] disabled:opacity-30 disabled:hover:bg-white sm:right-6"
                        >
                            <ChevronRight size={22} />
                        </button>
                    </div>
                </div>

                {/* Bottom filmstrip navigator */}
                <div className="flex items-center gap-3 bg-white px-4 py-4 sm:px-8">
                    <button
                        type="button"
                        onClick={goPrevPage}
                        disabled={isFirstPage}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#9893a8] transition hover:bg-[#f5f2ff] disabled:opacity-30"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <div
                        ref={filmstripRef}
                        className="no-scrollbar flex flex-1 items-center gap-3 overflow-x-auto py-1"
                    >
                        {visibleThumbs.map((page, i) => {
                            const active = i === pageIndex;
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    data-page={i}
                                    onClick={() => goToSpread(i)}
                                    className="flex shrink-0 flex-col items-center gap-1"
                                >
                                    <div
                                        className={`overflow-hidden rounded-lg transition-all ${
                                            active
                                                ? "h-14 w-14 border-2 border-[#5d2bc5]"
                                                : "h-11 w-11 border border-[#e4e1eb] opacity-70 hover:opacity-100"
                                        }`}
                                    >
                                        <img src={page.image} alt="" className="h-full w-full object-cover" />
                                    </div>
                                    <span
                                        className={`text-[10px] font-bold ${
                                            active ? "text-[#5d2bc5]" : "text-[#b3aec4]"
                                        }`}
                                    >
                                        {i + 1}
                                    </span>
                                </button>
                            );
                        })}

                        {overflowCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setPageNavOpen(true)}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f3edff] text-[12px] font-bold text-[#5d2bc5] transition hover:bg-[#ece2ff]"
                            >
                                +{overflowCount}
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={goNextPage}
                        disabled={isLastPage}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#9893a8] transition hover:bg-[#f5f2ff] disabled:opacity-30"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </section>
    );
};