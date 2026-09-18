
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
    X,
} from "lucide-react";

import {
    templates,
    buildPages,
} from "../Data/Templatesdata";
const THUMBS_VISIBLE = 6;


export const TemplateDetail = () => {
    const { id } = useParams();

    const selectedTemplate = useMemo(
        () => templates.find((t) => String(t.id) === String(id)),
        [id]
    );
    const navigate = useNavigate();
    const bookRef = useRef(null);
    const [pageIndex, setPageIndex] = useState(0);
    const [pageNavOpen, setPageNavOpen] = useState(false);
    const [selectedBook,setSelectedBook]=useState(selectedTemplate)

   
    const pages = useMemo(
        () => selectedTemplate ? buildPages(selectedTemplate) : [],
        [selectedTemplate]
    );


    const leaves = useMemo(
        () =>
            pages.flatMap((page) => [
                {
                    type: "image",
                    page,
                },
                {
                    type: "content",
                    page,
                },
            ]),
        [pages]
    );

    const goBackToList = () => {
        navigate("/templates");
    };

    const goNextPage = () => {
        bookRef.current?.pageFlip()?.flipNext();
    };

    const goPrevPage = () => {
        bookRef.current?.pageFlip()?.flipPrev();
    };

    const goToSpread = (index) => {
        bookRef.current?.pageFlip()?.turnToPage(index * 2);
        setPageIndex(index);
        setPageNavOpen(false);
    };


    const handleFlip = (event) => {
        setPageIndex(Math.floor(event.data / 2));
    };


    /* =========================================================
       KEYBOARD
    ========================================================= */

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "ArrowRight") {
                goNextPage();
            }

            if (event.key === "ArrowLeft") {
                goPrevPage();
            }

            if (event.key === "Escape") {
                if (pageNavOpen) {
                    setPageNavOpen(false);
                } else {
                    goBackToList();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [pageNavOpen]);


    //    notfound
    if (!selectedTemplate) {
        return (
            <section className="flex min-h-[500px] w-full items-center justify-center rounded-2xl border border-[#e6e3f2] bg-white p-8 text-center">
                <div>
                    <p className="text-lg font-bold text-[#332f54]">
                        Template not found
                    </p>

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
                </div>
            </section>
        );
    }

    // values

    const bestForAge = selectedTemplate.age.replace(/^Ages\s*/i, "");

    const isFirstPage = pageIndex === 0;

    const isLastPage = pageIndex === pages.length - 1;

    const visibleThumbs = pages.slice(0, THUMBS_VISIBLE);

    const overflowCount = Math.max(
        0,
        pages.length - THUMBS_VISIBLE
    );


    return (
        <section className="relative w-full overflow-hidden rounded-[24px] border border-[#e4e0ef] bg-gradient-to-br from-[#fbfaff] via-[#f8f6fc] to-[#f0edf7]
        max-h-[100%]">

            <div className="relative flex h-[860px] w-full items-center justify-center overflow-hidden px-4 pt-2 pb-24">

                {/* =================================================
                    BOOK + NAVIGATION
                ================================================= */}

                <div className="relative flex h-full w-full max-w-[1600px] items-center justify-center gap-4">


                    {/* =================================================
    3D BOOK BACKGROUND
================================================= */}

                    <div className="relative flex h-[690px] min-w-0 flex-1 items-center justify-center">

                        {/* =================================================
        BLUE HARD COVER
    ================================================= */}

                        <div className="pointer-events-none absolute bottom-[8px] left-[1.4%] right-[1.4%] top-[10px] z-0 rounded-[29px] bg-[#163971] shadow-[0_24px_38px_rgba(22,57,113,0.28)]" />

                        <div className="pointer-events-none absolute bottom-[15px] left-[1.8%] right-[1.8%] top-[15px] z-[1] rounded-[27px] bg-[#163971]" />


                        {/* =================================================
        BACK PAGE — SAME FAMILY AS WHITE PAGE
        These are NOT gray cards.
    ================================================= */}

                        <div className="pointer-events-none absolute bottom-[26px] left-[2.25%] right-[2.25%] top-[17px] z-[2] rounded-[25px] bg-[#e9e7e1] shadow-[0_2px_4px_rgba(45,42,35,0.14)]" />

                        <div className="pointer-events-none absolute bottom-[28px] left-[2.1%] right-[2.1%] top-[15px] z-[3] rounded-[24px] bg-[#efede8]" />

                        <div className="pointer-events-none absolute bottom-[30px] left-[1.95%] right-[1.95%] top-[13px] z-[4] rounded-[23px] bg-[#f4f2ed]" />

                        <div className="pointer-events-none absolute bottom-[32px] left-[1.8%] right-[1.8%] top-[11px] z-[5] rounded-[22px] bg-[#f8f7f3]" />


                        {/* =================================================
        LEFT INVISIBLE PAGE EDGES

        Very thin — these should read as paper.
    ================================================= */}

                        <div className="pointer-events-none absolute bottom-[38px] left-[1.95%] top-[23px] z-[8] w-[2px] rounded-l-full bg-[#dedbd4]" />

                        <div className="pointer-events-none absolute bottom-[41px] left-[2.18%] top-[20px] z-[8] w-[1px] rounded-l-full bg-[#ebe9e4]" />

                        <div className="pointer-events-none absolute bottom-[44px] left-[2.38%] top-[17px] z-[8] w-[1px] rounded-l-full bg-[#d8d5ce]" />

                        <div className="pointer-events-none absolute bottom-[47px] left-[2.57%] top-[14px] z-[8] w-[1px] rounded-l-full bg-[#f0eee9]" />


                        {/* =================================================
        RIGHT INVISIBLE PAGE EDGES
    ================================================= */}

                        <div className="pointer-events-none absolute bottom-[38px] right-[1.95%] top-[23px] z-[8] w-[2px] rounded-r-full bg-[#dedbd4]" />

                        <div className="pointer-events-none absolute bottom-[41px] right-[2.18%] top-[20px] z-[8] w-[1px] rounded-r-full bg-[#ebe9e4]" />

                        <div className="pointer-events-none absolute bottom-[44px] right-[2.38%] top-[17px] z-[8] w-[1px] rounded-r-full bg-[#d8d5ce]" />

                        <div className="pointer-events-none absolute bottom-[47px] right-[2.57%] top-[14px] z-[8] w-[1px] rounded-r-full bg-[#f0eee9]" />


                        {/* =================================================
        BOTTOM PAPER BLOCK

        Thin curved layers, NOT gray bars.
    ================================================= */}

                        <div className="pointer-events-none absolute bottom-[25px] left-[4.2%] right-[4.2%] z-[7] h-[10px] rounded-b-[45%] bg-[#dedbd5]" />

                        <div className="pointer-events-none absolute bottom-[28px] left-[4.35%] right-[4.35%] z-[8] h-[7px] rounded-b-[45%] bg-[#ebe9e4]" />

                        <div className="pointer-events-none absolute bottom-[31px] left-[4.5%] right-[4.5%] z-[9] h-[5px] rounded-b-[45%] bg-[#f4f2ed]" />

                        <div className="pointer-events-none absolute bottom-[34px] left-[4.65%] right-[4.65%] z-[10] h-[3px] rounded-b-[45%] bg-[#faf9f6]" />


                        {/* =================================================
        ACTUAL OPEN BOOK
    ================================================= */}

                        <div className="relative z-20 h-[640px] w-[92%] overflow-hidden rounded-[22px] bg-white shadow-[0_9px_24px_rgba(35,35,70,0.14)]">

                            <HTMLFlipBook
                                ref={bookRef}
                                width={600}
                                height={640}
                                size="stretch"
                                minWidth={300}
                                maxWidth={1100}
                                minHeight={420}
                                maxHeight={700}
                                showCover={false}
                                usePortrait={false}
                                mobileScrollSupport={false}
                                drawShadow={true}
                                maxShadowOpacity={0.28}
                                flippingTime={650}
                                startPage={0}
                                onFlip={handleFlip}
                                className="story-flipbook h-full w-full"
                                style={{ margin: 0 }}
                            >

                                {leaves.map((leaf, index) => (

                                    <div
                                        key={index}
                                        className="relative h-full w-full overflow-hidden bg-white"
                                    >

                                        {/* =================================================
                        IMAGE PAGE
                    ================================================= */}

                                        {leaf.type === "image" ? (

                                            <div className="relative h-full w-full overflow-hidden bg-white">

                                                <img
                                                    src={leaf.page.image}
                                                    alt=""
                                                    draggable={false}
                                                    className="h-full w-full object-cover"
                                                />

                                                <span className="absolute left-6 top-5 inline-flex items-center gap-1 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] font-bold text-[#5d2bc5] shadow-sm">
                                                    <Star size={11} fill="currentColor" />
                                                    {selectedTemplate.category}
                                                </span>

                                                {leaf.page.kind === "cover" && (
                                                    <span className="absolute bottom-5 left-5 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                                                        <WandSparkles size={11} />
                                                        AI Generated
                                                    </span>
                                                )}

                                            </div>

                                        ) : leaf.page.kind === "story" ? (

                                            /* =================================================
                                                STORY PAGE
                                            ================================================= */

                                            <div className="flex h-full w-full items-center justify-center bg-white px-14 text-center">

                                                <p className="max-w-[470px] font-serif text-[19px] leading-9 text-[#3c3860]">
                                                    {leaf.page.text}
                                                </p>

                                            </div>

                                        ) : leaf.page.kind === "cover" ? (

                                            /* =================================================
                                                INFORMATION PAGE
                                            ================================================= */

                                            <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-white px-12 text-center">

                                                {/* CORNERS */}

                                                <span className="pointer-events-none absolute left-7 top-7 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-[#dfcf9d]" />

                                                <span className="pointer-events-none absolute right-7 top-7 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-[#dfcf9d]" />

                                                <span className="pointer-events-none absolute bottom-7 left-7 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-[#dfcf9d]" />

                                                <span className="pointer-events-none absolute bottom-7 right-7 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-[#dfcf9d]" />


                                                {/* TITLE */}

                                                <h3 className="max-w-[570px] font-serif text-[40px] font-bold leading-[1.12] text-[#29254d]">
                                                    {leaf.page.heading}
                                                </h3>


                                                {/* DIVIDER */}

                                                <div className="my-5 flex items-center gap-3">
                                                    <span className="h-px w-12 bg-[#dfcf9d]" />
                                                    <span className="h-2 w-2 rounded-full bg-[#c9a24d]" />
                                                    <span className="h-px w-12 bg-[#dfcf9d]" />
                                                </div>


                                                {/* AGE */}

                                                <span className="rounded-full bg-[#f0e8ff] px-5 py-1.5 text-[12px] font-bold text-[#5d2bc5]">
                                                    {selectedTemplate.age}
                                                </span>


                                                {/* DESCRIPTION */}

                                                <p className="mt-6 max-w-[520px] text-[14px] leading-7 text-[#77738b]">
                                                    {selectedTemplate.description}
                                                </p>


                                                {/* INFO */}

                                                <div className="mt-6 grid w-full max-w-[520px] grid-cols-3 rounded-[20px] border border-[#e8e2f2] bg-white p-4">

                                                    <div className="flex flex-col items-center gap-1">
                                                        <BookOpen size={18} className="text-[#5d2bc5]" />
                                                        <p className="text-[9px] font-semibold uppercase tracking-wide text-[#a39fb5]">
                                                            Reading Time
                                                        </p>
                                                        <p className="text-[12px] font-bold text-[#332f54]">
                                                            5–10 min
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col items-center gap-1 border-x border-[#e8e2f2]">
                                                        <WandSparkles size={18} className="text-[#5d2bc5]" />
                                                        <p className="text-[9px] font-semibold uppercase tracking-wide text-[#a39fb5]">
                                                            Theme
                                                        </p>
                                                        <p className="text-[12px] font-bold text-[#332f54]">
                                                            {selectedTemplate.category}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col items-center gap-1">
                                                        <Star size={18} className="text-[#5d2bc5]" />
                                                        <p className="text-[9px] font-semibold uppercase tracking-wide text-[#a39fb5]">
                                                            Best For
                                                        </p>
                                                        <p className="text-[12px] font-bold text-[#332f54]">
                                                            Kids {bestForAge}
                                                        </p>
                                                    </div>

                                                </div>


                                                {/* STORY INPUT */}

                                                <div className="mt-5 w-full max-w-[520px] rounded-[20px] border border-[#e7e0f4] bg-[#faf9ff] p-4 text-left">

                                                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-[#5d2bc5]">
                                                        <Mic size={13} />
                                                        Your Story Input
                                                    </div>

                                                    <p className="text-[12px] italic leading-6 text-[#6b6680]">
                                                        "{selectedTemplate.description}"
                                                    </p>

                                                </div>

                                            </div>

                                        ) : (

                                            /* =================================================
                                                GENERIC PAGE
                                            ================================================= */

                                            <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 bg-white px-12 text-center">

                                                <span className="pointer-events-none absolute left-7 top-7 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-[#dfcf9d]" />

                                                <span className="pointer-events-none absolute right-7 top-7 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-[#dfcf9d]" />

                                                <span className="pointer-events-none absolute bottom-7 left-7 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-[#dfcf9d]" />

                                                <span className="pointer-events-none absolute bottom-7 right-7 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-[#dfcf9d]" />

                                                <h3 className="max-w-[520px] font-serif text-[40px] font-bold leading-tight text-[#29254d]">
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


                            {/* =================================================
            CENTER PAGE CREASE
        ================================================= */}

                            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-[50] w-[52px] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#38334b]/10 to-transparent" />

                            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-[51] w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-[#4b4656]/10 to-transparent" />


                            {/* =================================================
            LEFT ARROW
        ================================================= */}

                            <button
                                type="button"
                                onClick={goPrevPage}
                                disabled={isFirstPage}
                                aria-label="Previous page"
                                className="absolute left-5 top-1/2 z-[100] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#5d2bc5] shadow-[0_7px_22px_rgba(50,40,100,0.20)] transition-all hover:scale-105 hover:bg-[#f7f3ff] disabled:pointer-events-none disabled:opacity-20"
                            >
                                <ChevronLeft size={25} />
                            </button>


                            {/* =================================================
            RIGHT ARROW
        ================================================= */}

                            <button
                                type="button"
                                onClick={goNextPage}
                                disabled={isLastPage}
                                aria-label="Next page"
                                className="absolute right-5 top-1/2 z-[100] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#5d2bc5] shadow-[0_7px_22px_rgba(50,40,100,0.20)] transition-all hover:scale-105 hover:bg-[#f7f3ff] disabled:pointer-events-none disabled:opacity-20"
                            >
                                <ChevronRight size={25} />
                            </button>

                        </div>


                        {/* =================================================
        SMALL BLUE COVER LIP
    ================================================= */}

                        <div className="pointer-events-none absolute bottom-[8px] left-[4%] right-[4%] z-[16] h-[10px] rounded-b-[18px] bg-[#163971]" />


                        {/* =================================================
        SOFT FLOOR SHADOW
    ================================================= */}

                        <div className="pointer-events-none absolute -bottom-6 left-1/2 z-[-1] h-[28px] w-[78%] -translate-x-1/2 rounded-full bg-[#535064]/25 blur-2xl" />

                    </div>

                    {/* =================================================
                        SEPARATE PAGE NAVIGATION
                    ================================================= */}

                    <aside className="relative z-30 flex h-[650px] w-[78px] shrink-0 flex-col items-center justify-center bg-transparent">

                        <div className="flex w-full flex-col items-center gap-3">

                            {visibleThumbs.map((page, index) => {

                                const active = index === pageIndex;

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => goToSpread(index)}
                                        aria-label={`Open page ${index + 1}`}
                                        className="group flex flex-col items-center gap-1 outline-none"
                                    >

                                        <div className={`relative overflow-hidden rounded-[9px] bg-white transition-all duration-200 ${active ? "h-[58px] w-[68px] border-2 border-[#5d2bc5] shadow-[0_5px_16px_rgba(93,43,197,0.25)]" : "h-[54px] w-[64px] border border-transparent opacity-65 hover:border-[#b9a9df] hover:opacity-100"}`}>
                                            <img src={page.image} alt="" draggable={false} className="h-full w-full object-cover" />
                                        </div>

                                        <span className={`text-[10px] font-bold ${active ? "text-[#5d2bc5]" : "text-[#aaa5b8]"}`}>
                                            {index + 1}
                                        </span>

                                    </button>
                                );
                            })}


                            {overflowCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setPageNavOpen(true)}
                                    className="flex h-[34px] w-[62px] items-center justify-center rounded-lg border border-[#ded7ef] bg-transparent text-[10px] font-bold text-[#5d2bc5] transition hover:bg-white/60"
                                >
                                    +{overflowCount}
                                </button>
                            )}

                        </div>

                    </aside>

                </div>


                {/* =====================================================
                    BOTTOM END INDICATOR
                ===================================================== */}

                <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
                    <span className="h-px w-20 bg-[#d8d3e3]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#b9b2cb]" />
                    <span className="h-px w-20 bg-[#d8d3e3]" />
                </div>

            </div>


            {/* =========================================================
                ALL PAGES POPUP
            ========================================================== */}

            {pageNavOpen && (
                <div
                    className="absolute inset-0 z-[200] flex items-center justify-center bg-[#29254d]/20 p-6 backdrop-blur-[3px]"
                    onClick={() => setPageNavOpen(false)}
                >

                    <div
                        className="relative max-h-[620px] w-[600px] overflow-hidden rounded-[24px] border border-[#e5dff2] bg-white p-6 shadow-[0_30px_80px_rgba(40,30,80,0.28)]"
                        onClick={(event) => event.stopPropagation()}
                    >

                        <div className="mb-5 flex items-center justify-between">

                            <div>
                                <p className="text-sm font-bold text-[#332f54]">
                                    Book Pages
                                </p>

                                <p className="mt-1 text-[11px] text-[#9b96aa]">
                                    Choose a page to open
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPageNavOpen(false)}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-[#9893a8] transition hover:bg-[#f5f2ff] hover:text-[#5d2bc5]"
                            >
                                <X size={18} />
                            </button>

                        </div>


                        <div className="grid grid-cols-4 gap-4">

                            {pages.map((page, index) => {

                                const active = index === pageIndex;

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => goToSpread(index)}
                                        className="group flex flex-col items-center gap-1.5"
                                    >

                                        <div className={`aspect-[4/3] w-full overflow-hidden rounded-xl bg-white transition-all ${active ? "border-2 border-[#5d2bc5] shadow-[0_5px_15px_rgba(93,43,197,0.18)]" : "border border-[#e4e1eb] group-hover:border-[#b9a9df]"}`}>
                                            <img src={page.image} alt="" draggable={false} className="h-full w-full object-cover" />
                                        </div>

                                        <span className={`text-[10px] font-bold ${active ? "text-[#5d2bc5]" : "text-[#aaa5b8]"}`}>
                                            Page {index + 1}
                                        </span>

                                    </button>
                                );
                            })}

                        </div>

                    </div>

                </div>
            )}

        </section>
    );
};


export default TemplateDetail;