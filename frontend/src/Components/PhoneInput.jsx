import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { COUNTRIES, dialCodeOf, flagUrl, formatNational, digitsOf, parsePhoneInput } from "../utils/phone";

function Flag({ code }) {
    return (
        <img
            src={flagUrl(code)}
            srcSet={`${flagUrl(code)} 1x, ${flagUrl(code, 80)} 2x`}
            alt=""
            aria-hidden="true"
            width="22"
            height="16"
            loading="lazy"
            draggable="false"
            onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
            }}
            className="h-4 w-5.5 shrink-0 rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(20,15,92,0.12)]"
        />
    );
}
Flag.propTypes = { code: PropTypes.string.isRequired };

/* Country picker: flag button that opens a searchable list (same as the landing contact form) */
function CountryPicker({ value, onChange, rootRef }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const listRef = useRef(null);
    const searchRef = useRef(null);
    const selected = COUNTRIES.find((c) => c.code === value);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase().replace(/^\+/, "");
        if (!q) return COUNTRIES;
        return COUNTRIES.filter(
            (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q || String(c.dial).startsWith(q)
        );
    }, [query]);

    useEffect(() => {
        if (!open) return;
        const onDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("touchstart", onDown);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("touchstart", onDown);
        };
    }, [open, rootRef]);

    useEffect(() => {
        if (open) searchRef.current?.focus();
    }, [open]);

    useEffect(() => {
        if (open) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
    }, [open, active]);

    const openList = () => {
        setQuery("");
        setActive(Math.max(0, COUNTRIES.findIndex((c) => c.code === value)));
        setOpen(true);
    };

    const choose = (c) => {
        onChange(c.code);
        setOpen(false);
    };

    const onKeyDown = (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!results.length) return;
            const step = e.key === "ArrowDown" ? 1 : -1;
            setActive((i) => (i + step + results.length) % results.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (results[active]) choose(results[active]);
        } else if (e.key === "Escape") {
            e.stopPropagation();
            setOpen(false);
        }
    };

    return (
        <>
            <button
                type="button"
                aria-label={`Country code: ${selected?.name || ""} +${selected?.dial || ""}`}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => (open ? setOpen(false) : openList())}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg pl-2 pr-1.5 outline-none transition hover:bg-(--tint) focus-visible:ring-2 focus-visible:ring-(--accent)/30"
            >
                <Flag code={value} />
                <ChevronDown
                    className={`h-3.5 w-3.5 text-(--text-muted) transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 min-w-64 overflow-hidden rounded-2xl border border-(--border) bg-(--surface) shadow-[0_18px_40px_-12px_rgba(20,15,92,0.35)]">
                    <div className="relative border-b border-(--border) p-2">
                        <Search className="pointer-events-none absolute left-4.5 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-muted)" />
                        <input
                            ref={searchRef}
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setActive(0);
                            }}
                            onKeyDown={onKeyDown}
                            placeholder="Search country or code"
                            translate="no"
                            className="h-9 w-full rounded-lg bg-(--tint) pl-8 pr-3 text-[13px] text-(--text-heading) outline-none placeholder:text-(--text-muted) focus:ring-2 focus:ring-(--accent)/25"
                        />
                    </div>
                    <ul ref={listRef} role="listbox" className="max-h-56 overflow-y-auto p-1.5">
                        {results.length === 0 && (
                            <li className="px-3 py-3 text-center text-[13px] text-(--text-muted)">No country found</li>
                        )}
                        {results.map((c, i) => {
                            const isSelected = c.code === value;
                            return (
                                <li
                                    key={c.code}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => choose(c)}
                                    onMouseEnter={() => setActive(i)}
                                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${isSelected
                                            ? "bg-(--accent-bg) font-semibold text-(--text-heading)"
                                            : i === active
                                                ? "bg-(--tint) text-(--text-heading)"
                                                : "text-(--text-muted)"
                                        }`}
                                >
                                    <Flag code={c.code} />
                                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                                    <span className="shrink-0 text-xs text-(--text-muted)">+{c.dial}</span>
                                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-(--accent)" />}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </>
    );
}
CountryPicker.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    rootRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
};

/* Phone field with a country flag picker.
   value   - the national number as shown in the box
   country - ISO code of the picked country (e.g. "IN")
   onChange({ value, country }) fires for typing, pasting a "+<code>" number, or picking a country */
export function PhoneInput({ id, value, country, onChange, placeholder = "Phone number", hasError = false }) {
    const rootRef = useRef(null);

    const handleType = (e) => onChange(parsePhoneInput(e.target.value, country));
    const handleCountry = (code) => onChange({ country: code, value: formatNational(digitsOf(value), code) });

    return (
        <div
            ref={rootRef}
            className={`relative flex h-11 w-full items-center rounded-xl border bg-(--surface) pl-1.5 pr-3 transition focus-within:border-(--accent) focus-within:ring-2 focus-within:ring-(--tint) ${hasError ? "border-[#c0392b]" : "border-(--border)"
                }`}
        >
            <CountryPicker value={country} onChange={handleCountry} rootRef={rootRef} />
            {!value.startsWith("+") && (
                <span translate="no" className="mx-2 text-[13px] font-medium text-(--text-heading)">
                    +{dialCodeOf(country)}
                </span>
            )}
            <input
                id={id}
                type="tel"
                inputMode="tel"
                maxLength={22}
                value={value}
                onChange={handleType}
                placeholder={placeholder}
                translate="no"
                autoComplete="tel-national"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-(--text-heading) outline-none placeholder:text-(--text-muted)"
            />
        </div>
    );
}

PhoneInput.propTypes = {
    id: PropTypes.string,
    value: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    hasError: PropTypes.bool,
};

export default PhoneInput;