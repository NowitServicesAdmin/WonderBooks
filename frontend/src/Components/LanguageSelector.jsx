import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { LANDING_LANGUAGES } from "../utils/landingTranslate";

/**
 * Landing-page language dropdown: globe + code + chevron trigger, and a white
 * rounded panel listing "FLAG  CODE - Language". Selected row is blue.
 * Controlled via value (e.g. "EN") / onChange(code).
 * `notranslate` keeps Google Translate from translating the language names themselves.
 */
export default function LanguageSelector({ value = "EN", onChange, className = "", align = "right" }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const choose = (lang) => {
        setOpen(false);
        onChange?.(lang.code);
    };

    return (
        <div ref={ref} translate="no" className={`notranslate relative ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="Select language"
                className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-[15px] font-medium text-[#1f2937] transition hover:bg-slate-100"
            >
                <Globe size={18} strokeWidth={1.8} />
                <span>{value}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <ul
                    role="listbox"
                    className={`absolute top-full z-60 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.18)] ${align === "right" ? "right-0" : "left-0"}`}
                >
                    {LANDING_LANGUAGES.map((lang) => {
                        const active = lang.code === value;
                        return (
                            <li key={lang.code} role="option" aria-selected={active}>
                                <button
                                    type="button"
                                    onClick={() => choose(lang)}
                                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] transition-colors ${active
                                        ? "bg-[#eaf2ff] font-semibold text-[#2563eb]"
                                        : "font-normal text-[#475569] hover:bg-slate-50"
                                        }`}
                                >
                                    <span className={`w-7 text-[13px] font-bold ${active ? "text-[#2563eb]" : "text-[#334155]"}`}>{lang.flag}</span>
                                    <span>{lang.code} - {lang.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}