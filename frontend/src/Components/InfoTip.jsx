import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";

/**
 * InfoTip – an (i) icon that shows instructions.
 *  - Desktop: opens on hover / keyboard focus
 *  - Touch:   opens on tap (toggle), closes on outside tap or Esc
 *
 * Props:
 *  title  – small heading in the popover
 *  steps  – array of strings shown as a numbered list
 *  note   – optional footer line
 *  label  – text displayed next to the icon
 */
export const InfoTip = ({ title, steps = [], note, label }) => {
  const [pinned, setPinned] = useState(false); // opened by click/tap
  const [hovered, setHovered] = useState(false); // opened by hover/focus
  const wrapRef = useRef(null);
  const tipId = useId();
  const open = pinned || hovered;

  // Close on outside click/tap or Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setPinned(false);
        setHovered(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setPinned(false);
        setHovered(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative mt-5 flex h-5.5 items-center justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={() => setPinned((p) => !p)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        className="flex cursor-pointer items-center gap-3 rounded-full text-[14px] text-[#5a5792] outline-none focus-visible:ring-2 focus-visible:ring-[#5636c7]/50"
      >
        <Info size={18} className="text-[#5636c7]" />
        <span>{label}</span>
      </button>

      {open && (
        <div
          id={tipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-30 mb-3 w-72 max-w-[calc(100vw-3rem)] -translate-x-1/2 rounded-2xl border border-(--accent-border) bg-(--surface) px-4 py-3 text-left text-[13px] leading-normal text-(--ink) shadow-[0_14px_35px_rgba(83,55,160,0.22)]"
        >
          {title && <p className="mb-1.5 text-[14px] font-bold text-(--text-heading)">{title}</p>}

          <ol className="list-decimal space-y-1 pl-4 marker:font-semibold marker:text-(--accent)">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>

          {note && <p className="mt-2 border-t border-(--border) pt-2 text-(--text-muted)">{note}</p>}

          {/* arrow */}
          <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1.5 rotate-45 border-b border-r border-(--accent-border) bg-(--surface)" />
        </div>
      )}
    </div>
  );
};