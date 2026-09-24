import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  Loader2,
  Printer,
  Volume2,
} from "lucide-react";
import { downloadBookPdf, printBook } from "../utils/bookExport";

const BTN =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition disabled:pointer-events-none disabled:opacity-50 sm:px-4";
const BTN_IDLE = "border-[#e4e0ef] bg-white text-[#5d2bc5] hover:bg-[#f7f3ff]";
const BTN_ACTIVE = "border-[#5d2bc5] bg-[#5d2bc5] text-white hover:bg-[#5122b4]";

// Who reads the story aloud. Only the picker exists so far - the reading itself comes later.
const READER_VOICES = [
  { id: "grandmother", label: "Grandmother" },
  { id: "grandfather", label: "Grandfather" },
  { id: "mother", label: "Mother" },
  { id: "father", label: "Father" },
  { id: "brother", label: "Brother" },
  { id: "sister", label: "Sister" },
];

export const BookActions = ({ book, pages }) => {
  const language = book.storyData?.language || "English";

  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState(null); // { tone: "ok" | "error", text }
  const noticeTimer = useRef(null);

  const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);
  const [voice, setVoice] = useState(null);
  const voiceMenuRef = useRef(null);

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

  const flash = (tone, text) => {
    setNotice({ tone, text });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4000);
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadBookPdf({ bookId: book._id, title: book.title, pages, language });
    } catch {
      flash("error", "Couldn't create the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    try {
      await printBook({ title: book.title, pages, language });
    } catch {
      flash("error", "Couldn't open the print dialog. Please try again.");
    }
  };

  const handleVoiceSelect = (id) => {
    setVoice(id);
    setVoiceMenuOpen(false);
    // TODO: start reading the book aloud in the chosen voice.
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {notice && (
        <span
          role="status"
          className={`mr-auto text-xs font-semibold ${notice.tone === "error" ? "text-[#c0392b]" : "text-[#5d2bc5]"}`}
        >
          {notice.text}
        </span>
      )}

      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className={`${BTN} ${BTN_IDLE}`}
      >
        {downloading ? (
          <Loader2 size={17} className="animate-spin" />
        ) : (
          <Download size={17} />
        )}
        <span className="hidden sm:inline">
          {downloading ? "Preparing..." : "Download"}
        </span>
      </button>

      <button type="button" onClick={handlePrint} className={`${BTN} ${BTN_IDLE}`}>
        <Printer size={17} />
        <span className="hidden sm:inline">Print</span>
      </button>

      {/* Read Aloud: pick who reads the story */}
      <div ref={voiceMenuRef} className="relative">
        <button
          type="button"
          onClick={() => setVoiceMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={voiceMenuOpen}
          className={`${BTN} ${voiceMenuOpen ? BTN_ACTIVE : BTN_IDLE}`}
        >
          <Volume2 size={17} />
          <span className="hidden sm:inline">Read Aloud</span>
          <ChevronDown
            size={15}
            className={`transition-transform ${voiceMenuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {voiceMenuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-300 mt-2 w-48 overflow-hidden rounded-2xl border border-[#e5dff2] bg-white p-1.5 shadow-[0_18px_40px_rgba(40,30,80,0.18)]"
          >
            <p className="px-3 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wide text-[#9b96aa]">
              Read by
            </p>
            {READER_VOICES.map((option) => {
              const active = voice === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => handleVoiceSelect(option.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                    active
                      ? "bg-[#f3edff] text-[#5d2bc5]"
                      : "text-[#332f54] hover:bg-[#f7f3ff]"
                  }`}
                >
                  {option.label}
                  {active && <Check size={16} />}
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