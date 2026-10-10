/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, ShoppingCart, X } from "lucide-react";
import { getPrintOptions } from "../services/cartService";

const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

// Small page-shaped preview so sizes are easy to compare at a glance
const SizeShape = ({ widthMm, heightMm }) => {
    const box = 34;
    const scale = box / Math.max(widthMm, heightMm);
    return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center" aria-hidden="true">
            <span
                className="rounded-[3px] border-2 border-current bg-(--tint)"
                style={{ width: widthMm * scale, height: heightMm * scale }}
            />
        </span>
    );
};

const Radio = ({ selected }) => (
    <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            selected ? "border-(--accent) bg-(--accent) text-white" : "border-(--border)"
        }`}
    >
        {selected && <Check size={12} strokeWidth={3} />}
    </span>
);

const Price = ({ price }) => (
    <span className={`text-xs ${price > 0 ? "font-semibold text-(--text-heading)" : "font-medium text-(--text-muted)"}`}>
        {price > 0 ? `+${money(price)}` : "Included"}
    </span>
);

const Choice = ({ choice, selected, onSelect, showShape }) => {
    const base = `relative w-full rounded-2xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) ${
        selected
            ? "border-(--accent) bg-(--tint)"
            : "border-(--border) bg-(--surface) hover:border-(--accent)"
    }`;

    // Sizes: a row on mobile/tablet, a vertical card on laptop (3 side by side)
    if (showShape && choice.widthMm) {
        return (
            <button type="button" role="radio" aria-checked={selected} onClick={onSelect} className={`${base} flex`}>
                {/* mobile + tablet: row */}
                <span className="flex w-full items-center gap-3 lg:hidden">
                    <span className={selected ? "text-(--accent)" : "text-(--text-muted)"}>
                        <SizeShape widthMm={choice.widthMm} heightMm={choice.heightMm} />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-(--text-heading)">{choice.label}</span>
                        <span className="block text-xs text-(--text-muted)">
                            {choice.widthMm} × {choice.heightMm} mm
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-(--text-muted)">{choice.description}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                        <Price price={choice.price} />
                        <Radio selected={selected} />
                    </span>
                </span>

                {/* laptop: vertical card */}
                <span className="hidden w-full flex-col gap-2 lg:flex">
                    <span className="flex items-start justify-between">
                        <span className={selected ? "text-(--accent)" : "text-(--text-muted)"}>
                            <SizeShape widthMm={choice.widthMm} heightMm={choice.heightMm} />
                        </span>
                        <Radio selected={selected} />
                    </span>
                    <span className="min-w-0">
                        <span className="block text-sm font-semibold text-(--text-heading)">{choice.label}</span>
                        <span className="block text-xs text-(--text-muted)">
                            {choice.widthMm} × {choice.heightMm} mm
                        </span>
                        <span className="mt-1 block text-xs leading-snug text-(--text-muted)">{choice.description}</span>
                    </span>
                    <span className="mt-auto pt-1">
                        <Price price={choice.price} />
                    </span>
                </span>
            </button>
        );
    }

    return (
        <button type="button" role="radio" aria-checked={selected} onClick={onSelect} className={`${base} flex items-center gap-3`}>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-(--text-heading)">{choice.label}</span>
                <span className="mt-0.5 block text-xs leading-snug text-(--text-muted)">{choice.description}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1.5">
                <Price price={choice.price} />
                <Radio selected={selected} />
            </span>
        </button>
    );
};

/**
 * "How should this book be printed?" modal.
 *
 * onConfirm(options) -> Promise<{ ok, message? }>. The modal stays open and
 * shows the message if the server says no; the parent closes it on success.
 */
export const PrintOptionsModal = ({
    isOpen,
    onClose,
    onConfirm,
    bookId,
    bookTitle,
    initialOptions = null,
    title = "Choose how to print your book",
    confirmLabel = "Add to cart",
}) => {
    const [config, setConfig] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [loadTick, setLoadTick] = useState(0);
    const [selected, setSelected] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Load the choices each time the modal opens
    useEffect(() => {
        if (!isOpen) return undefined;
        let cancelled = false;
        setConfig(null);
        setLoadError("");
        setError("");
        setSubmitting(false);

        getPrintOptions(bookId)
            .then(({ data }) => {
                if (cancelled) return;
                setConfig(data);
                setSelected(
                    Object.fromEntries(
                        data.groups.map((group) => [
                            group.key,
                            initialOptions?.[group.key] || group.default,
                        ]),
                    ),
                );
            })
            .catch(() => {
                if (!cancelled) setLoadError("Couldn't load the print options. Please try again.");
            });

        return () => {
            cancelled = true;
        };
        // initialOptions is read once per open on purpose
    }, [isOpen, bookId, loadTick]);

    // Esc closes, and the page behind doesn't scroll
    useEffect(() => {
        if (!isOpen) return undefined;
        const onKey = (event) => {
            if (event.key === "Escape" && !submitting) onClose();
        };
        document.addEventListener("keydown", onKey);
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previous;
        };
    }, [isOpen, submitting, onClose]);

    const extraPrice = useMemo(() => {
        if (!config) return 0;
        return config.groups.reduce((sum, group) => {
            const choice = group.choices.find((c) => c.value === selected[group.key]);
            return sum + (choice?.price || 0);
        }, 0);
    }, [config, selected]);

    if (!isOpen) return null;

    const unitPrice = config?.basePrice != null ? config.basePrice + extraPrice : null;

    const handleConfirm = async () => {
        if (!config || submitting) return;
        setSubmitting(true);
        setError("");
        const result = await onConfirm(selected);
        // on success the parent closes us; only a failure needs handling here
        if (!result?.ok) {
            setError(result?.message || "Something went wrong. Please try again.");
            setSubmitting(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !submitting) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="print-options-title"
                className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-(--border) bg-(--surface) shadow-2xl sm:max-w-2xl sm:rounded-3xl"
            >
                {/* header */}
                <div className="flex items-start justify-between gap-3 border-b border-(--border) px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                        <h2 id="print-options-title" className="text-lg font-semibold text-(--text-heading)">
                            {title}
                        </h2>
                        {bookTitle && (
                            <p className="mt-0.5 truncate text-xs text-(--text-muted)">
                                {bookTitle}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-(--text-muted) transition hover:bg-(--tint) disabled:opacity-40"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* body */}
                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                    {!config && !loadError && (
                        <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-(--text-muted)">
                            <Loader2 size={18} className="animate-spin" /> Loading options…
                        </div>
                    )}

                    {loadError && (
                        <div className="py-8 text-center">
                            <p className="text-sm font-semibold text-[#c0392b]">{loadError}</p>
                            <button
                                type="button"
                                onClick={() => setLoadTick((n) => n + 1)}
                                className="mt-3 rounded-xl border border-(--border) px-4 py-2 text-sm font-semibold text-(--accent) transition hover:bg-(--tint)"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {config?.groups.map((group) => (
                        <fieldset key={group.key}>
                            <legend className="mb-2 text-sm font-semibold text-(--text-heading)">
                                {group.label}
                            </legend>
                            <div
                                role="radiogroup"
                                aria-label={group.label}
                                className={`grid gap-2 ${group.key === "size" ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}
                            >
                                {group.choices.map((choice) => (
                                    <Choice
                                        key={choice.value}
                                        choice={choice}
                                        showShape={group.key === "size"}
                                        selected={selected[group.key] === choice.value}
                                        onSelect={() => setSelected((prev) => ({ ...prev, [group.key]: choice.value }))}
                                    />
                                ))}
                            </div>
                        </fieldset>
                    ))}
                </div>

                {/* footer */}
                <div className="border-t border-(--border) px-5 py-4 sm:px-6">
                    {error && <p className="mb-3 text-xs font-semibold text-[#c0392b]">{error}</p>}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs text-(--text-muted)">Price per copy</p>
                            <p className="text-lg font-semibold text-(--text-heading)">
                                {unitPrice != null ? money(unitPrice) : config ? `+${money(extraPrice)} options` : "—"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="h-10 rounded-xl border border-(--border) px-4 text-sm font-medium text-(--text-muted) transition hover:bg-(--tint) disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={!config || submitting}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-(--accent) px-4 text-sm font-semibold text-white transition hover:bg-(--accent-hover) disabled:opacity-50"
                            >
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                                {confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default PrintOptionsModal;