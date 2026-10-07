// import { useEffect, useRef, useState } from "react";
// import {
//   Check,
//   ChevronDown,
//   Download,
//   Loader2,
//   Printer,
//   ShoppingCartIcon,
//   Volume2,
// } from "lucide-react";
// import { downloadBookPdf, printBook } from "../utils/bookExport";
// import { PrintOrderModal } from "./PrintOrderModal";
// import { useTTS } from "../hooks/useTTs";

// const BTN =
//   "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition disabled:pointer-events-none disabled:opacity-50 sm:px-4";
// const BTN_IDLE = "border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] hover:bg-[var(--tint)]";
// const BTN_ACTIVE = "border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]";

// // Who reads the story aloud. Only the picker exists so far - the reading itself comes later.
// const READER_VOICES = [
//   { id: "grandmother", label: "Grandmother", icons: "" },
//   { id: "grandfather", label: "Grandfather", icons: "" },
//   { id: "mother", label: "Mother", icons: "" },
//   { id: "father", label: "Father", icons: "" },
//   { id: "brother", label: "Brother", icons: "" },
//   { id: "sister", label: "Sister", icons: "" },
// ];

// export const BookActions = ({ book, pages }) => {
//   const language = book.storyData?.language || "English";
//   const font = book.storyData?.font;

//   const [downloading, setDownloading] = useState(false);
//   const [notice, setNotice] = useState(null); // { tone: "ok" | "error", text }
//   const noticeTimer = useRef(null);

//   const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);
//   const [voice, setVoice] = useState(null);
//   const voiceMenuRef = useRef(null);

//   const [orderModalOpen, setOrderModalOpen] = useState(false);

//   const { speak, stop, speakingVoiceId, error: ttsError } = useTTS();

//   useEffect(() => {
//     if (ttsError) flash("error", ttsError);
//   }, [ttsError]);

//   useEffect(() => () => clearTimeout(noticeTimer.current), []);

//   // close the voice menu on outside click / Escape
//   useEffect(() => {
//     if (!voiceMenuOpen) return;
//     const onPointerDown = (event) => {
//       if (!voiceMenuRef.current?.contains(event.target)) setVoiceMenuOpen(false);
//     };
//     const onKeyDown = (event) => {
//       if (event.key === "Escape") setVoiceMenuOpen(false);
//     };
//     document.addEventListener("pointerdown", onPointerDown);
//     document.addEventListener("keydown", onKeyDown);
//     return () => {
//       document.removeEventListener("pointerdown", onPointerDown);
//       document.removeEventListener("keydown", onKeyDown);
//     };
//   }, [voiceMenuOpen]);

//   const flash = (tone, text) => {
//     setNotice({ tone, text });
//     clearTimeout(noticeTimer.current);
//     noticeTimer.current = setTimeout(() => setNotice(null), 4000);
//   };

//   const handleDownload = async () => {
//     if (downloading) return;
//     setDownloading(true);
//     try {
//       await downloadBookPdf({ bookId: book._id, title: book.title, pages, language, font });
//     } catch {
//       flash("error", "Couldn't create the PDF. Please try again.");
//     } finally {
//       setDownloading(false);
//     }
//   };

//   const handlePrint = async () => {
//     try {
//       await printBook({ title: book.title, pages, language, font });
//     } catch {
//       flash("error", "Couldn't open the print dialog. Please try again.");
//     }
//   };

//   const handleOrderSuccess = (order) => {
//     setOrderModalOpen(false);
//     flash("ok", `Order placed! We'll print "${book.title}" and ship it your way.`);
//   };

//   const handleVoiceSelect = (option) => {
//     console.log(option,"option Here")
//     const currentPage = pages[1];
//     const pageId = currentPage?.imageKey ?? "cover";
//     const pageText =
//       currentPage?.kind === "story"
//         ? currentPage.text
//         : currentPage?.heading || currentPage?.sub || "";

//     if (speakingVoiceId === option.voiceId) {
//       stop(); // clicking the currently-playing voice again stops it
//       setVoice(null);
//       return;
//     }

//     setVoice(option.id);
//     setVoiceMenuOpen(false);
//     speak({ bookId: book._id, pageId, text: pageText, voiceId: option.id });
//   };

//   return (
//     <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
//       {notice && (
//         <span
//           role="status"
//           className={`mr-auto text-xs font-semibold ${notice.tone === "error" ? "text-[#c0392b]" : "text-(--accent)"}`}
//         >
//           {notice.text}
//         </span>
//       )}

//       <button
//         type="button"
//         onClick={handleDownload}
//         disabled={downloading}
//         className={`${BTN} ${BTN_IDLE}`}
//       >
//         {downloading ? (
//           <Loader2 size={17} className="animate-spin" />
//         ) : (
//           <Download size={17} />
//         )}
//         {/* <span className="hidden sm:inline">
//           {downloading ? "Preparing..." : "Download"}
//         </span> */}
//       </button>

//       <button type="button" onClick={handlePrint} className={`${BTN} ${BTN_IDLE}`}>
//         <Printer size={17} />
//         {/* <span className="hidden sm:inline">Print</span> */}
//       </button>

//       <button
//         type="button"
//         onClick={() => setOrderModalOpen(true)}
//         disabled={book.status !== "completed"}
//         title={book.status !== "completed" ? "Finish the book to order a printed copy" : "Order a printed copy"}
//         className={`${BTN} ${BTN_IDLE}`}
//       >
//         <ShoppingCartIcon size={17} />
//       </button>

//       {/* Read Aloud: pick who reads the story */}
//       <div ref={voiceMenuRef} className="relative">
//         {/* Read Aloud button — shows a spinner while audio is generating/playing */}
//         <button
//           type="button"
//           onClick={() => setVoiceMenuOpen((open) => !open)}
//           aria-haspopup="menu"
//           aria-expanded={voiceMenuOpen}
//           className={`${BTN} ${voiceMenuOpen || speakingVoiceId ? BTN_ACTIVE : BTN_IDLE}`}
//         >
//           {speakingVoiceId ? (
//             <Loader2 size={17} className="animate-spin" />
//           ) : (
//             <Volume2 size={17} />
//           )}
//           <span className="hidden sm:inline">
//             {speakingVoiceId ? "Playing..." : "Read Aloud"}
//           </span>
//           <ChevronDown size={15} className={`transition-transform ${voiceMenuOpen ? "rotate-180" : ""}`} />
//         </button>

//         {voiceMenuOpen && (
//           <div
//             role="menu"
//             className="absolute right-0 top-full z-300 mt-2 w-48 overflow-hidden rounded-2xl border border-(--border) bg-(--surface) p-1.5 shadow-[0_18px_40px_rgba(40,30,80,0.18)]"
//           >
//             <p className="px-3 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wide text-(--text-muted)">
//               Read by
//             </p>
//             {READER_VOICES.map((option) => {
//               const isPlaying = speakingVoiceId === option.voiceId;
//               const active = voice === option.id;
//               return (
//                 <button
//                   key={option.id}
//                   type="button"
//                   role="menuitemradio"
//                   aria-checked={active}
//                   onClick={() => handleVoiceSelect(option)}
//                   className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${active ? "bg-(--tint) text-(--accent)" : "text-(--text-heading) hover:bg-(--tint)"
//                     }`}
//                 >
//                   {option.label}
//                   {isPlaying && <Loader2 size={14} className="ml-auto animate-spin" />}
//                   {!isPlaying && active && <Check size={16} className="ml-auto" />}
//                 </button>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       <PrintOrderModal
//         book={book}
//         isOpen={orderModalOpen}
//         onClose={() => setOrderModalOpen(false)}
//         onSuccess={handleOrderSuccess}
//       />
//     </div>
//   );
// };

// export default BookActions;
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  Loader2,
  Pause,
  Play,
  Printer,
  ShoppingCartIcon,
  Square,
  Volume2,
} from "lucide-react";
import { downloadBookPdf, printBook } from "../utils/bookExport";
import { useNavigate } from "react-router-dom";
import { useTTS } from "../hooks/useTTs";
import { useCart } from "../context/CartContext";
const BTN =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition disabled:pointer-events-none disabled:opacity-50 sm:px-4";
const BTN_IDLE = "border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] hover:bg-[var(--tint)]";
const BTN_ACTIVE = "border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]";

const READER_VOICES = [
  { id: "grandmother", label: "Grandmother" },
  { id: "grandfather", label: "Grandfather" },
  { id: "mother", label: "Mother" },
  { id: "father", label: "Father" },
  { id: "brother", label: "Brother" },
  { id: "sister", label: "Sister" },
];

// Little animated "sound bars" shown while audio is playing
const Equalizer = ({ className = "" }) => (
  <span className={`inline-flex h-4 items-end gap-[2px] ${className}`} aria-hidden="true">
    <style>{`@keyframes eqbar{0%,100%{height:30%}50%{height:100%}}`}</style>
    {[0, 0.2, 0.4, 0.1].map((delay, i) => (
      <span
        key={i}
        className="w-[3px] rounded-full bg-current"
        style={{ height: "30%", animation: `eqbar 0.9s ease-in-out ${delay}s infinite` }}
      />
    ))}
  </span>
);

export const BookActions = ({ book, pages, currentPageIndex = 0 }) => {
  const language = book.storyData?.language || "English";
  const font = book.storyData?.font;

  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState(null); // { tone: "ok" | "error", text }
  const noticeTimer = useRef(null);

  const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null); // voice id, stays selected after audio ends
  const voiceMenuRef = useRef(null);

  const navigate = useNavigate();

  const { addToCart, isInCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  // Templates are previews, not saved books, so they can't be printed
  const isTemplate = String(book._id).startsWith("template-");
  const inCart = isInCart(book._id);

  const { speak, pause, resume, stop, status, voiceId: activeVoiceId, error: ttsError } = useTTS();

  const isLoading = status === "loading";
  const isPlaying = status === "playing";
  const isPaused = status === "paused";
  const isBusy = status !== "idle";
  const selectedOption = READER_VOICES.find((v) => v.id === selectedVoice);

  const flash = (tone, text) => {
    setNotice({ tone, text });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4000);
  };

  useEffect(() => {
    if (ttsError) flash("error", ttsError);
  }, [ttsError]);

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  // close the voice menu on outside click / Escape
  useEffect(() => {
    if (!voiceMenuOpen) return;
    const onPointerDown = (event) => {
      if (!voiceMenuRef.current?.contains(event.target)) setVoiceMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setVoiceMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [voiceMenuOpen]);

  // Reading a different page: stop the old audio (the user presses play for the new page)
  useEffect(() => {
    stop();
  }, [currentPageIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const readCurrentPage = (voiceId) => {
    const page = pages[currentPageIndex];
    const pageId = page?.imageKey ?? (page?.kind === "end" ? "end" : String(currentPageIndex));
    const text =
      page?.kind === "story" ? page.text : page?.heading || page?.sub || "";
    if (!text?.trim()) {
      flash("error", "There's no text to read on this page.");
      return;
    }
    speak({ bookId: book._id, pageId, text, voiceId,language:book.storyData?.language || "English" });
  };

  const handleVoiceSelect = (option) => {
    setVoiceMenuOpen(false);
    setSelectedVoice(option.id);
    readCurrentPage(option.id); // picking a voice starts reading right away
  };

  const handlePlayPause = () => {
    if (isLoading) return;
    if (isPlaying) return pause();
    if (isPaused) return resume();
    if (selectedVoice) readCurrentPage(selectedVoice); // finished before: replay
    else setVoiceMenuOpen(true); // no voice chosen yet
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadBookPdf({ bookId: book._id, title: book.title, pages, language, font });
    } catch {
      flash("error", "Couldn't create the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleCart = async () => {
    if (addingToCart) return;
    if (inCart) {
      navigate("/cart"); // already added: the button now takes you to the cart
      return;
    }
    setAddingToCart(true);
    const result = await addToCart(book._id);
    setAddingToCart(false);
    if (result.ok) flash("ok", "Added to your cart.");
    else flash("error", result.message);
  };

  const handlePrint = async () => {
    try {
      await printBook({ title: book.title, pages, language, font });
    } catch {
      flash("error", "Couldn't open the print dialog. Please try again.");
    }
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {notice && (
        <span
          role="status"
          className={`mr-auto text-xs font-semibold ${notice.tone === "error" ? "text-[#c0392b]" : "text-(--accent)"}`}
        >
          {notice.text}
        </span>
      )}

      <button type="button" onClick={handleDownload} disabled={downloading} className={`${BTN} ${BTN_IDLE}`}>
        {downloading ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
      </button>

      <button type="button" onClick={handlePrint} className={`${BTN} ${BTN_IDLE}`}>
        <Printer size={17} />
      </button>

      <button
        type="button"
        onClick={handleCart}
        disabled={book.status !== "completed" || isTemplate || addingToCart}
        aria-label={inCart ? "View cart" : "Add to cart"}
        title={
          isTemplate
            ? "Templates can't be printed - create your own book to order a copy"
            : book.status !== "completed"
              ? "Finish the book to order a printed copy"
              : inCart
                ? "In your cart - view cart"
                : "Add a printed copy to your cart"
        }
        className={`${BTN} ${inCart ? BTN_ACTIVE : BTN_IDLE}`}
      >
        {addingToCart ? (
          <Loader2 size={17} className="animate-spin" />
        ) : inCart ? (
          <Check size={17} />
        ) : (
          <ShoppingCartIcon size={17} />
        )}
      </button>

      {/* Play / Pause / Stop: shown once a voice has been picked */}
      {selectedVoice && (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={handlePlayPause}
            disabled={isLoading}
            aria-label={isPlaying ? "Pause" : isPaused ? "Resume" : "Play"}
            title={isLoading ? "Getting the voice ready..." : isPlaying ? "Pause" : isPaused ? "Resume" : "Play"}
            className={`${BTN} ${isBusy ? BTN_ACTIVE : BTN_IDLE}`}
          >
            {isLoading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={17} />
            ) : (
              <Play size={17} />
            )}
          </button>

          {isBusy && (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop"
              title="Stop"
              className={`${BTN} ${BTN_IDLE}`}
            >
              <Square size={15} />
            </button>
          )}
        </div>
      )}

      {/* Read Aloud: pick who reads the story */}
      <div ref={voiceMenuRef} className="relative">
        <button
          type="button"
          onClick={() => setVoiceMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={voiceMenuOpen}
          className={`${BTN} ${voiceMenuOpen || isBusy ? BTN_ACTIVE : BTN_IDLE}`}
        >
          {isLoading ? (
            <Loader2 size={17} className="animate-spin" />
          ) : isPlaying ? (
            <Equalizer />
          ) : (
            <Volume2 size={17} />
          )}
          <span className="hidden sm:inline">
            {isLoading
              ? "Loading..."
              : isPlaying
                ? `${selectedOption?.label ?? "Playing"} reading`
                : isPaused
                  ? "Paused"
                  : selectedOption?.label }
          </span>
          <ChevronDown size={15} className={`transition-transform ${voiceMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {voiceMenuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-300 mt-2 w-52 overflow-hidden rounded-2xl border border-(--border) bg-(--surface) p-1.5 shadow-[0_18px_40px_rgba(40,30,80,0.18)]"
          >
            <p className="px-3 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wide text-(--text-muted)">
              Read by
            </p>
            {READER_VOICES.map((option) => {
              const active = selectedVoice === option.id;
              const thisVoiceActive = activeVoiceId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => handleVoiceSelect(option)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                    active ? "bg-(--tint) text-(--accent)" : "text-(--text-heading) hover:bg-(--tint)"
                  }`}
                >
                  {option.label}
                  <span className="ml-auto flex items-center">
                    {active && thisVoiceActive && isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : active && thisVoiceActive && isPlaying ? (
                      <Equalizer />
                    ) : active && thisVoiceActive && isPaused ? (
                      <Pause size={14} />
                    ) : active ? (
                      <Check size={16} />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookActions;