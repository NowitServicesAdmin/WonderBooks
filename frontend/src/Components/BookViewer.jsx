/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";

import { ChevronLeft, ChevronRight, ImageOff, Star, WandSparkles, X } from "lucide-react";

const THUMBS_VISIBLE = 6;
const PAGE_W = 600;
const PAGE_H = 800; 
const FRAME_V = 48; 
const BOOK_MAX_W = 900;
const THUMB_SLOT = 85; 
const PORTRAIT_BELOW = 600;
const TEXT_MAX = 32; 
const TEXT_MIN = 11;

export const BookViewer = ({ pages, badge = "", onExit, renderInfoPage }) => {
    const bookRef = useRef(null);
    const [leafIndex, setLeafIndex] = useState(0);
    const pageIndex = Math.floor(leafIndex / 2);
    const [pageNavOpen, setPageNavOpen] = useState(false);

    const stageRef = useRef(null);
    const [stage, setStage] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const el = stageRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setStage({ w: Math.floor(width), h: Math.floor(height) });
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const portrait = stage.w > 0 && stage.w < PORTRAIT_BELOW;
    const fitW = portrait
        ? Math.min(stage.w * 0.92, (stage.h - FRAME_V) * 0.75, BOOK_MAX_W / 2)
        : Math.min(stage.w * 0.92, (stage.h - FRAME_V) * 1.5, BOOK_MAX_W);
    const bookW = Math.max(0, 2 * Math.floor(fitW / 2));
    const bookH = Math.round(portrait ? (bookW * 4) / 3 : bookW / 1.5);
    const frameW = Math.round(bookW / 0.92); // the frame is ~8% wider than the pages
    const frameH = bookH + FRAME_V;
    const pageScale = (portrait ? bookW : bookW / 2) / PAGE_W;
    const flipMinWidth = portrait ? Math.max(1, Math.ceil(bookW * 0.75)) : 50;

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            try {
                bookRef.current?.pageFlip()?.update();
            } catch {
                /* book not ready yet */
            }
        });
        return () => cancelAnimationFrame(frame);
    }, [bookW, portrait]);

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

    const goBackToList = () => onExit?.();

    const goNextPage = () => {
        bookRef.current?.pageFlip()?.flipNext();
    };

    const goPrevPage = () => {
        bookRef.current?.pageFlip()?.flipPrev();
    };

    const goToSpread = (index) => {
        bookRef.current?.pageFlip()?.turnToPage(index * 2);
        setLeafIndex(index * 2);
        setPageNavOpen(false);
    };


    const handleFlip = (event) => {
        setLeafIndex(event.data);
    };
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


    // values

    const isFirstPage = leafIndex === 0;

    const isLastPage = portrait ? leafIndex >= leaves.length - 1 : pageIndex >= pages.length - 1;

    const maxThumbs = Math.max(1, Math.min(THUMBS_VISIBLE, Math.floor((stage.h - 8) / THUMB_SLOT)));
    const thumbCount = pages.length <= maxThumbs ? pages.length : Math.max(1, maxThumbs - 1);
    const visibleThumbs = pages.slice(0, thumbCount);

    const overflowCount = Math.max(
        0,
        pages.length - thumbCount
    );


    return (
        <section className="relative h-full w-full overflow-hidden rounded-3xl border border-[#e4e0ef] bg-linear-to-br from-[#fbfaff] via-[#f8f6fc] to-[#f0edf7]">

            <div className="relative flex h-full w-full items-center justify-center overflow-hidden px-2 pt-2 pb-8 sm:px-4 sm:pb-9">
                <div className="relative flex h-full w-full max-w-400 items-center justify-center gap-4">
                    <div ref={stageRef} className="relative flex h-full min-w-0 flex-1 items-center justify-center">
                    {/* wb-keep-light: the book is a paper object, it stays light in dark mode */}
                    <div className="wb-keep-light relative flex shrink-0 items-center justify-center" style={{ width: frameW, height: frameH }}>
                        <div className="pointer-events-none absolute bottom-2 left-[1.4%] right-[1.4%] top-2.5 z-0 rounded-[29px] bg-[#163971] shadow-[0_24px_38px_rgba(22,57,113,0.28)]" />
                        <div className="pointer-events-none absolute bottom-3.75 left-[1.8%] right-[1.8%] top-3.75 z-1 rounded-[27px] bg-[#163971]" />

                        <div className="pointer-events-none absolute bottom-6.5 left-[2.25%] right-[2.25%] top-4.25 z-2 rounded-[25px] bg-[#e9e7e1] shadow-[0_2px_4px_rgba(45,42,35,0.14)]" />
                        <div className="pointer-events-none absolute bottom-7 left-[2.1%] right-[2.1%] top-3.75 z-3 rounded-3xl bg-[#efede8]" />
                        <div className="pointer-events-none absolute bottom-7.5 left-[1.95%] right-[1.95%] top-3.25 z-4 rounded-[23px] bg-[#f4f2ed]" />
                        <div className="pointer-events-none absolute bottom-8 left-[1.8%] right-[1.8%] top-2.75 z-5 rounded-[22px] bg-[#f8f7f3]" />

                        <div className="pointer-events-none absolute bottom-9.5 left-[1.95%] top-5.75 z-8 w-0.5 rounded-l-full bg-[#dedbd4]" />
                        <div className="pointer-events-none absolute bottom-10.25 left-[2.18%] top-5 z-8 w-px rounded-l-full bg-[#ebe9e4]" />
                        <div className="pointer-events-none absolute bottom-11 left-[2.38%] top-4.25 z-8 w-px rounded-l-full bg-[#d8d5ce]" />
                        <div className="pointer-events-none absolute bottom-11.75 left-[2.57%] top-3.5 z-8 w-px rounded-l-full bg-[#f0eee9]" />

                        <div className="pointer-events-none absolute bottom-9.5 right-[1.95%] top-5.75 z-8 w-0.5 rounded-r-full bg-[#dedbd4]" />
                        <div className="pointer-events-none absolute bottom-10.25 right-[2.18%] top-5 z-8 w-px rounded-r-full bg-[#ebe9e4]" />
                        <div className="pointer-events-none absolute bottom-11 right-[2.38%] top-4.25 z-8 w-px rounded-r-full bg-[#d8d5ce]" />
                        <div className="pointer-events-none absolute bottom-11.75 right-[2.57%] top-3.5 z-8 w-px rounded-r-full bg-[#f0eee9]" />

                        <div className="pointer-events-none absolute bottom-6.25 left-[4.2%] right-[4.2%] z-7 h-2.5 rounded-b-[45%] bg-[#dedbd5]" />
                        <div className="pointer-events-none absolute bottom-7 left-[4.35%] right-[4.35%] z-8 h-1.75 rounded-b-[45%] bg-[#ebe9e4]" />
                        <div className="pointer-events-none absolute bottom-7.75 left-[4.5%] right-[4.5%] z-9 h-1.25 rounded-b-[45%] bg-[#f4f2ed]" />
                        <div className="pointer-events-none absolute bottom-8.5 left-[4.65%] right-[4.65%] z-10 h-0.75 rounded-b-[45%] bg-[#faf9f6]" />

                        <div className="relative z-20 overflow-hidden rounded-[22px] bg-white shadow-[0_9px_24px_rgba(35,35,70,0.14)]" style={{ width: bookW, height: bookH }}>
                            {stage.w > 0 && (
<HTMLFlipBook key={portrait ? `portrait-${bookW}` : "spread"} ref={bookRef} width={PAGE_W} height={PAGE_H} size="stretch" minWidth={flipMinWidth} maxWidth={2000} minHeight={50} maxHeight={3000} showCover={false} usePortrait={portrait} mobileScrollSupport={false} drawShadow={true} maxShadowOpacity={0.28} flippingTime={650} startPage={leafIndex} onFlip={handleFlip} className="story-book h-full w-full" style={{ margin: 0 }}>
                                {leaves.map((leaf, index) => (
                                    <div key={index} className="relative h-full w-full overflow-hidden bg-white">
                                        <ScaledPage fallbackScale={pageScale}>
                                        {leaf.type === "image" ? (
                                            <div className="relative h-full w-full overflow-hidden bg-white">
                                                <PageImage src={leaf.page.image} />
                                                <span className="absolute left-6 top-5 inline-flex items-center gap-1 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] font-bold text-[#5d2bc5] shadow-sm">
                                                    <Star size={11} fill="currentColor" />
                                                    {badge}
                                                </span>
                                                {leaf.page.kind === "cover" && (
                                                    <span className="absolute bottom-5 left-5 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                                                        <WandSparkles size={11} />
                                                        AI Generated
                                                    </span>
                                                )}
                                            </div>
                                        ) : leaf.page.kind === "story" ? (
                                            <div className="h-full w-full bg-white px-14 py-16">
                                                <FitText text={leaf.page.text} />
                                            </div>
                                        ) : leaf.page.kind === "cover" && renderInfoPage ? (
                                            renderInfoPage(leaf.page)
) : (
                                            <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 bg-white px-12 text-center">
                                                <span className="pointer-events-none absolute left-7 top-7 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-[#dfcf9d]" />
                                                <span className="pointer-events-none absolute right-7 top-7 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-[#dfcf9d]" />
                                                <span className="pointer-events-none absolute bottom-7 left-7 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-[#dfcf9d]" />
                                                <span className="pointer-events-none absolute bottom-7 right-7 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-[#dfcf9d]" />
                                                <h3 className="max-w-130 font-serif text-[40px] font-bold leading-tight text-[#29254d]">
                                                    {leaf.page.heading}
                                                </h3>
                                                <p className="text-sm font-semibold text-[#9893a8]">
                                                    {leaf.page.sub}
                                                </p>
                                            </div>
                                        )}
                                        </ScaledPage>
                                    </div>
                                ))}
                            </HTMLFlipBook>
                            )}
                            {!portrait && (
                                <>
                                    <div className="pointer-events-none absolute inset-y-0 left-1/2 z-50 w-13 -translate-x-1/2 bg-linear-to-r from-transparent via-[#38334b]/10 to-transparent" />
                                    <div className="pointer-events-none absolute inset-y-0 left-1/2 z-51 w-0.5 -translate-x-1/2 bg-linear-to-b from-transparent via-[#4b4656]/10 to-transparent" />
                                </>
                            )}
                            <button type="button" onClick={goPrevPage} disabled={isFirstPage} aria-label="Previous page" className="absolute left-2 top-1/2 z-100 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full sm:left-5 sm:h-12 sm:w-12 bg-white text-[#5d2bc5] shadow-[0_7px_22px_rgba(50,40,100,0.20)] transition-all hover:scale-105 hover:bg-[#f7f3ff] disabled:pointer-events-none disabled:opacity-20">
                                <ChevronLeft size={25} />
                            </button>

                            <button type="button" onClick={goNextPage} disabled={isLastPage} aria-label="Next page" className="absolute right-2 top-1/2 z-100 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full sm:right-5 sm:h-12 sm:w-12 bg-white text-[#5d2bc5] shadow-[0_7px_22px_rgba(50,40,100,0.20)] transition-all hover:scale-105 hover:bg-[#f7f3ff] disabled:pointer-events-none disabled:opacity-20">
                                <ChevronRight size={25} />
                            </button>
                        </div>
                        <div className="pointer-events-none absolute bottom-2 left-[4%] right-[4%] z-16 h-2.5 rounded-b-[18px] bg-[#163971]" />
                        <div className="pointer-events-none absolute -bottom-6 left-1/2 z-[-1] h-7 w-[78%] -translate-x-1/2 rounded-full bg-[#535064]/25 blur-2xl" />
                    </div>
                    </div>

                    <aside className="relative z-30 hidden h-full w-19.5 shrink-0 flex-col items-center justify-center bg-transparent sm:flex">
                        <div className="flex w-full flex-col items-center gap-2 sm:gap-3">
                            {visibleThumbs.map((page, index) => {
                                const active = index === pageIndex;
                                return (
                                    <button key={index} type="button" onClick={() => goToSpread(index)} aria-label={`Open page ${index + 1}`} className="group flex flex-col items-center gap-1 outline-none">
                                        <div className={`relative overflow-hidden rounded-[9px] bg-white transition-all duration-200 ${active ? "h-10.5 w-12 border-2 border-[#5d2bc5] shadow-[0_5px_16px_rgba(93,43,197,0.25)] sm:h-14.5 sm:w-17" : "h-9.5 w-11 border border-transparent opacity-65 hover:border-[#b9a9df] hover:opacity-100 sm:h-13.5 sm:w-16"}`}>
                                            <PageImage src={page.image} />
                                        </div>
                                        <span className={`text-[10px] font-bold ${active ? "text-[#5d2bc5]" : "text-[#aaa5b8]"}`}>
                                            {index + 1}
                                        </span>
                                    </button>
                                );
                            })}
                            {overflowCount > 0 && (
                                <button type="button" onClick={() => setPageNavOpen(true)} className="flex h-8.5 w-15.5 items-center justify-center rounded-lg border border-[#ded7ef] bg-transparent text-[10px] font-bold text-[#5d2bc5] transition hover:bg-white/60">
                                    +{overflowCount}
                                </button>
                            )}
                        </div>
                    </aside>
                </div>

                <button type="button" onClick={() => setPageNavOpen(true)} className="absolute bottom-1.5 left-1/2 z-40 -translate-x-1/2 rounded-full border border-[#ded7ef] bg-white/90 px-3.5 py-1 text-[11px] font-bold text-[#5d2bc5] shadow-sm sm:hidden">
                    Page {pageIndex + 1} / {pages.length}
                </button>

                <div className="pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 items-center gap-2 sm:flex">
                    <span className="h-px w-20 bg-[#d8d3e3]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#b9b2cb]" />
                    <span className="h-px w-20 bg-[#d8d3e3]" />
                </div>
            </div>
            {pageNavOpen && (
                <div className="absolute inset-0 z-200 flex items-center justify-center bg-[#29254d]/20 p-6 backdrop-blur-[3px]" onClick={() => setPageNavOpen(false)}>
                    <div className="relative max-h-[85%] w-full max-w-150 overflow-y-auto rounded-3xl border border-[#e5dff2] bg-white p-4 shadow-[0_30px_80px_rgba(40,30,80,0.28)] sm:p-6" onClick={(event) => event.stopPropagation()}>
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-[#332f54]">
                                    Book Pages
                                </p>
                                <p className="mt-1 text-[11px] text-[#9b96aa]">
                                    Choose a page to open
                                </p>
                            </div>
                            <button type="button" onClick={() => setPageNavOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-[#9893a8] transition hover:bg-[#f5f2ff] hover:text-[#5d2bc5]">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
                            {pages.map((page, index) => {
                                const active = index === pageIndex;
                                return (
                                    <button key={index} type="button" onClick={() => goToSpread(index)} className="group flex flex-col items-center gap-1.5">
                                        <div className={`aspect-4/3 w-full overflow-hidden rounded-xl bg-white transition-all ${active ? "border-2 border-[#5d2bc5] shadow-[0_5px_15px_rgba(93,43,197,0.18)]" : "border border-[#e4e1eb] group-hover:border-[#b9a9df]"}`}>
                                            <PageImage src={page.image} />
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

const ScaledPage = ({ fallbackScale, children }) => {
    const ref = useRef(null);
    const [size, setSize] = useState(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) setSize({ w: width, h: height });
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const scale = size ? size.w / PAGE_W : fallbackScale;
    const canvasH = size ? size.h / scale : PAGE_H;

    return (
        <div ref={ref} className="relative h-full w-full overflow-hidden bg-white">
            <div
                className="relative overflow-hidden bg-white"
                style={{ width: PAGE_W, height: canvasH, transform: `scale(${scale})`, transformOrigin: "top left" }}
            >
                {children}
            </div>
        </div>
    );
};

/**
 * Story text that shrinks (or grows) until it fits its box, so nothing is cut off.
 * It re-fits whenever the box gets a real size, because react-pageflip builds pages
 * off-screen first (size 0) and only then moves them into the book.
 */
const FitText = ({ text = "" }) => {
    const boxRef = useRef(null);
    const textRef = useRef(null);

    useLayoutEffect(() => {
        const box = boxRef.current;
        const el = textRef.current;
        if (!box || !el) return;

        const fit = () => {
            if (!box.clientHeight || !box.clientWidth) return; // not laid out yet

            // largest font size (in design px) whose text still fits the box
            let lo = TEXT_MIN;
            let hi = TEXT_MAX;
            while (lo < hi) {
                const mid = Math.ceil((lo + hi) / 2);
                el.style.fontSize = `${mid}px`;
                if (el.scrollHeight <= box.clientHeight) lo = mid;
                else hi = mid - 1;
            }
            el.style.fontSize = `${lo}px`;
        };

        fit();
        const observer = new ResizeObserver(fit);
        observer.observe(box);
        document.fonts?.ready?.then(fit);

        return () => observer.disconnect();
    }, [text]);

    return (
        <div ref={boxRef} className="flex h-full w-full items-center justify-center overflow-hidden">
            <p ref={textRef} className="w-full text-center font-serif leading-normal text-[#3c3860]">
                {text}
            </p>
        </div>
    );
};

const PageImage = ({ src }) =>
    src ? (
        <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
    ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#f5f2ff] text-[#b3aec8]">
            <ImageOff size={22} />
        </div>
    );

export default BookViewer;