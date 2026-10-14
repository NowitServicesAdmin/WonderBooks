/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    Gift,
    Info,
    Loader2,
    ShieldCheck,
    Truck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useRazorpayCheckout } from "../../hooks/useRazorpayCheckout";
import { getPrintOptions } from "../../services/cartService";
import { getAddresses } from "../../services/addressService";
import { getShippingQuote, initiateOrder, verifyOrder } from "../../services/orderService";
import { CheckoutSteps } from "../../Components/printOrder/CheckoutSteps";
import { ExtraArt } from "../../Components/printOrder/ExtraArt";
import { getCheckoutAddressId } from "../../utils/checkoutSession";
import { e164Phone } from "../../utils/phone";

const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const copies = (n) => `${n} ${n === 1 ? "copy" : "copies"}`;

const MAX_TEXT = 200;
// order the add-on tiles appear in
const EXTRA_ORDER = ["giftWrap", "dedication", "cover", "pages", "size"];
const orderIndex = (key) => {
    const index = EXTRA_ORDER.indexOf(key);
    return index === -1 ? EXTRA_ORDER.length : index;
};

// every paid choice of a group. The included default (soft cover, normal pages,
// A5, "none") is never shown as a card - it simply applies when nothing is picked.
const upgradesOf = (group) => group.choices.filter((c) => c.value !== group.default && !c.hidden);

// One selectable tile: illustration on top, checkbox in the corner, title, text and price
const ExtraTile = ({ kind, choice, checked, disabled, onToggle, radio = false }) => (
    <button
        type="button"
        role={radio ? "radio" : "checkbox"}
        aria-checked={checked}
        onClick={onToggle}
        disabled={disabled}
        className={`flex h-full flex-col rounded-xl border p-2 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:opacity-70 ${
            checked
                ? "border-(--accent) bg-(--tint) shadow-sm"
                : "border-(--border) bg-(--surface) hover:border-(--accent)"
        }`}
    >
        <span className="relative block aspect-16/10 w-full overflow-hidden rounded-lg bg-(--tint) xl:aspect-4/3">
            <ExtraArt kind={kind} choice={choice} />
            <span
                className={`absolute right-1.5 top-1.5 flex h-4.5 w-4.5 items-center justify-center border ${
                    radio ? "rounded-full" : "rounded-md"
                } ${
                    checked ? "border-(--accent) bg-(--accent) text-white" : "border-(--border) bg-(--surface)"
                }`}
            >
                {checked && <Check size={12} strokeWidth={3} />}
            </span>
        </span>
        <span className="mt-2 block text-[13px] font-extrabold leading-tight text-(--text-heading)">{choice.label}</span>
        {choice.description && (
            <span className="mt-0.5 block text-[11px] leading-snug text-(--text-muted)">{choice.description}</span>
        )}
        {choice.widthMm && (
            <span className="mt-0.5 block text-[11px] text-(--text-muted)">
                {choice.widthMm} × {choice.heightMm} mm
            </span>
        )}
        <span className="mt-auto pt-2 text-[13px] font-extrabold text-(--text-heading)">
            +{money(choice.price)}
        </span>
    </button>
);

const TextArea = ({ id, value, onChange, placeholder, disabled, rows = 2 }) => (
    <div className="relative">
        <textarea
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value.slice(0, MAX_TEXT))}
            placeholder={placeholder}
            rows={rows}
            maxLength={MAX_TEXT}
            disabled={disabled}
            className="w-full resize-none rounded-xl border border-(--border) bg-(--surface) px-3 py-2 pb-6 text-sm text-(--text-heading) outline-none transition placeholder:text-(--text-muted) focus:border-(--accent) disabled:opacity-70"
        />
        <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-(--text-muted)">
            {value.length}/{MAX_TEXT}
        </span>
    </div>
);

export const PrintExtras = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { items, totals, loaded, giftMessage: savedGiftMessage, refresh, updatePrintOptions, updateGiftMessage } =
        useCart();
    const { openCheckout } = useRazorpayCheckout();

    // choices (cover / page finish / size / gift wrap / dedication) with prices, from the server
    const [config, setConfig] = useState(null);
    const [configError, setConfigError] = useState("");
    // one selection that applies to every book in the cart
    const [selected, setSelected] = useState(null);
    const [dedicationText, setDedicationText] = useState("");
    const [giftMessage, setGiftMessage] = useState("");
    const [syncing, setSyncing] = useState(false);
    const [extrasError, setExtrasError] = useState("");
    const syncTimer = useRef(null);
    const pendingSave = useRef(null); // latest change waiting to be saved
    const saving = useRef(false); // a save loop is running
    const itemsRef = useRef(items);
    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    const [addresses, setAddresses] = useState([]);
    const [addressesLoading, setAddressesLoading] = useState(true);
    const addressId = useMemo(() => getCheckoutAddressId(), []);
    const address = useMemo(() => addresses.find((a) => a._id === addressId) || null, [addresses, addressId]);

    const [quote, setQuote] = useState(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteError, setQuoteError] = useState("");

    const [paying, setPaying] = useState(false);
    const [payError, setPayError] = useState("");

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        let cancelled = false;
        getPrintOptions()
            .then(({ data }) => {
                if (!cancelled) setConfig(data);
            })
            .catch(() => {
                if (!cancelled) setConfigError("Couldn't load the extras. Please refresh the page.");
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        getAddresses()
            .then(({ data }) => {
                if (!cancelled) setAddresses(data.addresses || []);
            })
            .catch(() => {
                if (!cancelled) setPayError("We couldn't load your delivery address. Please go back and try again.");
            })
            .finally(() => {
                if (!cancelled) setAddressesLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => () => clearTimeout(syncTimer.current), []);

    const groups = useMemo(() => config?.groups || [], [config]);

    // Start from what the cart already has (defaults apply to every book)
    useEffect(() => {
        if (selected || !config || !loaded || items.length === 0) return;
        setSelected(
            Object.fromEntries(
                config.groups.map((group) => [group.key, items[0].printOptions?.[group.key] || group.default]),
            ),
        );
        setDedicationText(items[0].dedicationText || "");
        setGiftMessage(savedGiftMessage || "");
    }, [selected, config, loaded, items, savedGiftMessage]);

    const choiceOf = useCallback(
        (group, value) => group.choices.find((c) => c.value === value) || group.choices[0],
        [],
    );

    // extra rupees per copy for a set of options
    const extraPerCopy = useCallback(
        (options) => groups.reduce((sum, group) => sum + (choiceOf(group, options?.[group.key])?.price || 0), 0),
        [groups, choiceOf],
    );

    // Everything below is calculated from what is selected right now:
    //   one copy = the book's base price (by page count) + every chosen option
    // so the summary is right the moment a choice is made, and it is the same
    // formula the server uses when it charges.
    const pricing = useMemo(() => {
        const perCopyExtras = extraPerCopy(selected);
        const bookLines = items.map((item) => {
            const base = item.basePrice ?? item.unitPrice - extraPerCopy(item.printOptions);
            return { item, base, baseTotal: base * item.quantity, lineTotal: (base + perCopyExtras) * item.quantity };
        });
        const copyCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const baseTotal = bookLines.reduce((sum, line) => sum + line.baseTotal, 0);
        const subtotal = bookLines.reduce((sum, line) => sum + line.lineTotal, 0);
        const delivery = quote ? Number(quote.deliveryCharge) || 0 : 0;
        const gstPercent = quote ? Number(quote.gstPercent) || 0 : 0;
        const gstAmount = Math.round(((subtotal + delivery) * gstPercent) / 100);
        return {
            bookLines,
            copyCount,
            baseTotal,
            subtotal,
            delivery,
            gstPercent,
            gstAmount,
            total: subtotal + delivery + gstAmount,
        };
    }, [items, selected, quote, extraPerCopy]);

    // Re-price the delivery whenever the cart (and so the weight / subtotal) changes
    useEffect(() => {
        if (!address || items.length === 0) {
            setQuote(null);
            setQuoteError("");
            return undefined;
        }
        let cancelled = false;
        setQuoteLoading(true);
        setQuoteError("");
        getShippingQuote({ addressId: address._id })
            .then(({ data }) => {
                if (!cancelled) setQuote(data.quote);
            })
            .catch((err) => {
                if (cancelled) return;
                setQuote(null);
                setQuoteError(err.response?.data?.message || "Couldn't calculate delivery charges. Please try again.");
            })
            .finally(() => {
                if (!cancelled) setQuoteLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [address, items.length, totals.itemCount, totals.subtotal]);

    // Save options + dedication to every book and the gift message to the cart
    const saveAll = useCallback(
        async (options, dedication, gift) => {
            const text = options.dedication === "added" ? dedication.trim() : "";
            for (const item of itemsRef.current) {
                const result = await updatePrintOptions(item.book._id, options, text);
                if (!result.ok) return { ok: false, message: result.message };
            }
            return updateGiftMessage(gift.trim());
        },
        [updatePrintOptions, updateGiftMessage],
    );

    // Runs the saves strictly one after another (never two at once) until the
    // latest change has been saved, and ALWAYS clears the "Updating..." state.
    const runSaves = useCallback(async () => {
        if (saving.current) return; // the running loop will pick up the newest change
        saving.current = true;
        try {
            while (pendingSave.current) {
                const job = pendingSave.current;
                pendingSave.current = null;
                const result = await saveAll(job.options, job.dedication, job.gift);
                if (!result?.ok) setExtrasError(result?.message || "Couldn't save your choices. Please try again.");
            }
        } catch {
            setExtrasError("Couldn't save your choices. Please try again.");
        } finally {
            saving.current = false;
            setSyncing(false);
        }
    }, [saveAll]);

    // Debounced save (latest change wins)
    const scheduleSync = useCallback(
        (options, dedication, gift, delay = 250) => {
            pendingSave.current = { options, dedication, gift };
            clearTimeout(syncTimer.current);
            setSyncing(true);
            setExtrasError("");
            syncTimer.current = setTimeout(runSaves, delay);
        },
        [runSaves],
    );

    const choose = (groupKey, value) => {
        if (!selected || paying) return;
        const next = { ...selected, [groupKey]: value };
        setSelected(next);
        scheduleSync(next, dedicationText, giftMessage);
    };

    const changeDedication = (text) => {
        setDedicationText(text);
        scheduleSync(selected, text, giftMessage, 700);
    };

    const changeGiftMessage = (text) => {
        setGiftMessage(text);
        scheduleSync(selected, dedicationText, text, 700);
    };

    // override = { options } -> pay with those options and no messages ("Skip extras")
    const startPayment = async (override) => {
        if (paying) return;
        if (!address) {
            setPayError("Please choose a delivery address first.");
            return;
        }
        setPaying(true);
        setPayError("");

        try {
            // make sure the server cart matches what's on screen before charging
            clearTimeout(syncTimer.current);
            pendingSave.current = null;
            while (saving.current) await new Promise((resolve) => setTimeout(resolve, 50));
            const saved = await saveAll(
                override ? override.options : selected,
                override ? "" : dedicationText,
                override ? "" : giftMessage,
            );
            if (!saved.ok) throw new Error(saved.message);
            setSyncing(false);

            // no bookId: the server charges for whatever is in the cart
            const { data } = await initiateOrder({ addressId: address._id });

            await openCheckout({
                order: data.order,
                keyId: data.keyId,
                name: "Wonder Books",
                description:
                    items.length === 1
                        ? `${copies(totals.itemCount)} of "${items[0].book.title}"`
                        : `${totals.bookCount} printed books (${copies(totals.itemCount)})`,
                prefill: {
                    name: address.fullName,
                    email: user?.email || "",
                    contact: e164Phone(address),
                },
                onSuccess: async (response) => {
                    try {
                        const verifyRes = await verifyOrder({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            addressId: address._id,
                        });
                        const placed = verifyRes.data.orders || [verifyRes.data.order];
                        navigate("/orders/success", { replace: true, state: { orders: placed } });
                        refresh(); // the server has emptied the paid items out of the cart
                    } catch {
                        setPayError("Payment succeeded, but we couldn't confirm your order. Please contact support.");
                        setPaying(false);
                    }
                },
                onDismiss: () => setPaying(false),
                onFailure: () => {
                    setPaying(false);
                    setPayError("The payment didn't go through. Please try again.");
                },
            });
        } catch (err) {
            setPaying(false);
            setPayError(err.response?.data?.message || err.message || "Couldn't start the order. Please try again.");
        }
    };

    const handleSkip = () => {
        if (!config || paying) return;
        const defaults = Object.fromEntries(config.groups.map((group) => [group.key, group.default]));
        setSelected(defaults);
        setDedicationText("");
        setGiftMessage("");
        startPayment({ options: defaults });
    };

    // ----------------------------------------------------------------- render
    if (loaded && items.length === 0 && !paying) return <Navigate to="/orders/cart" replace />;
    if (!addressesLoading && !address && !payError) return <Navigate to="/orders/cart" replace />;

    if (!loaded || !config || !selected || addressesLoading) {
        return (
            <div className="flex h-full min-h-80 flex-col items-center justify-center px-6 text-center">
                {configError ? (
                    <p className="text-sm font-semibold text-[#c0392b]">{configError}</p>
                ) : (
                    <>
                        <Loader2 size={30} className="animate-spin text-(--accent)" />
                        <p className="mt-3 text-sm font-medium text-(--text-muted)">Getting your extras ready...</p>
                    </>
                )}
            </div>
        );
    }

    // One flat list of add-on tiles, all in the same grid: gift wrap, dedication,
    // hard cover, laminated pages, A4, square. Tapping a tile adds it, tapping it
    // again removes it (back to the included default). Sizes exclude each other.
    const sortedGroups = groups.slice().sort((a, b) => orderIndex(a.key) - orderIndex(b.key));
    const tilesOf = (list) => list.flatMap((group) => upgradesOf(group).map((choice) => ({ group, choice })));

    // step 1: gift wrap, dedication, hard cover, laminated pages
    const extraTiles = tilesOf(sortedGroups.filter((g) => g.key !== "size"));
    // step 2: size (A4, square) - the included A5 isn't shown
    const sizeGroup = sortedGroups.find((g) => g.key === "size");
    const sizeTiles = sizeGroup ? tilesOf([sizeGroup]) : [];

    const hasExtras = extraTiles.length > 0;
    const hasSizes = sizeTiles.length > 0;
    const sizeSectionNo = hasExtras ? 2 : 1;
    const giftSectionNo = (hasExtras ? 1 : 0) + (hasSizes ? 1 : 0) + 1;

    const chosenExtras = groups
        .map((group) => ({ group, choice: choiceOf(group, selected[group.key]) }))
        .filter(({ choice }) => choice.price > 0);

    const chipLabels = groups
        .map((group) => choiceOf(group, selected[group.key]))
        .filter((choice) => !choice.hidden)
        .map((choice) => (choice.widthMm ? `${choice.label} (${choice.widthMm} × ${choice.heightMm} mm)` : choice.label));

    const dedicationOn = selected.dedication === "added";
    const dedicationMissing = dedicationOn && !dedicationText.trim();

    const locked = paying;
    const busy = syncing || paying;
    const canPay = !busy && !!address && !quoteLoading && !!quote && !dedicationMissing;

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
            <button
                type="button"
                onClick={() => navigate("/orders/cart")}
                disabled={locked}
                className="inline-flex items-center gap-2 text-sm font-bold text-(--accent) transition hover:text-(--accent-hover) disabled:opacity-50"
            >
                <ArrowLeft size={16} />
                Back to delivery
            </button>

            <div className="mb-4 mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-xl font-extrabold text-(--text-heading) sm:text-2xl">Personalize &amp; Add Extras</h1>
                    <p className="mt-1 text-sm text-(--text-muted)">
                        Make your book even more special with these optional add-ons.
                    </p>
                </div>
                <CheckoutSteps current={2} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-3 lg:col-span-2">
                    {/* ---------------- the book(s) ---------------- */}
                    {items.map((item) => {
                        const baseUnit = item.unitPrice - extraPerCopy(item.printOptions);
                        return (
                            <section
                                key={item.book._id}
                                className="flex items-center gap-3 rounded-2xl border border-(--border) bg-(--surface) p-3 sm:p-4"
                            >
                                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-(--border) bg-(--tint) sm:h-20 sm:w-16">
                                    {item.book.coverImageUrl ? (
                                        <img src={item.book.coverImageUrl} alt={item.book.title} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-(--accent)">
                                            <BookOpen size={22} />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-sm font-extrabold text-(--text-heading) sm:text-base">
                                        {item.book.title}
                                    </h2>
                                    <p className="mt-0.5 text-xs text-(--text-muted)">
                                        Printed storybook · {item.pageCount} story pages · {copies(item.quantity)}
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                        {chipLabels.map((label) => (
                                            <span
                                                key={label}
                                                className="rounded-full bg-(--tint) px-2 py-0.5 text-[10px] font-bold text-(--accent)"
                                            >
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-[11px] text-(--text-muted)">Base price</p>
                                    <p className="text-base font-extrabold text-(--text-heading)">{money(baseUnit)}</p>
                                </div>
                            </section>
                        );
                    })}

                    {items.length > 1 && (
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-(--text-muted)">
                            <Info size={13} />
                            Your choices below apply to all {items.length} books in your cart.
                        </p>
                    )}

                    {/* ---------------- 1. extras ---------------- */}
                    {hasExtras && (
                        <section>
                            <div className="mb-1 flex items-center gap-2">
                                <h2 className="text-base font-extrabold text-(--text-heading)">1. Choose extras for your book</h2>
                                {/* <span className="rounded-full bg-(--accent) px-2 py-0.5 text-[10px] font-bold text-white">
                                    Optional
                                </span> */}
                            </div>
                            <p className="mb-3 text-xs text-(--text-muted)">Select one or more add-ons.</p>
                            <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
                                {extraTiles.map(({ group, choice }) => {
                                    const checked = selected[group.key] === choice.value;
                                    return (
                                        <ExtraTile
                                            key={`${group.key}-${choice.value}`}
                                            kind={group.key}
                                            choice={choice}
                                            checked={checked}
                                            disabled={locked}
                                            onToggle={() => choose(group.key, checked ? group.default : choice.value)}
                                        />
                                    );
                                })}
                            </div>

                            {dedicationOn && (
                                <div className="mt-3 rounded-xl border border-(--accent-border) bg-(--tint) p-3">
                                    <label htmlFor="dedication-text" className="mb-1.5 block text-xs font-extrabold text-(--text-heading)">
                                        Your dedication <span className="font-medium text-(--text-muted)">(printed inside the book)</span>
                                    </label>
                                    <TextArea
                                        id="dedication-text"
                                        value={dedicationText}
                                        onChange={changeDedication}
                                        placeholder="e.g. To Aarav, may your story take you on a new adventure! With love, Mom"
                                        disabled={locked}
                                    />
                                    {dedicationMissing && (
                                        <p className="mt-1.5 text-xs font-semibold text-[#c0392b]">
                                            Write your dedication message to continue.
                                        </p>
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {/* ---------------- 2. size ---------------- */}
                    {hasSizes && (
                        <section>
                            <h2 className="mb-1 text-base font-extrabold text-(--text-heading)">
                                {sizeSectionNo}. Choose size
                            </h2>
                            <p className="mb-3 text-xs text-(--text-muted)">
                                The standard {choiceOf(sizeGroup, sizeGroup.default).label} is included. Pick a different size if you&apos;d like.
                            </p>
                            <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
                                {sizeTiles.map(({ group, choice }) => {
                                    const checked = selected[group.key] === choice.value;
                                    return (
                                        <ExtraTile
                                            key={choice.value}
                                            kind={choice.value}
                                            choice={choice}
                                            checked={checked}
                                            disabled={locked}
                                            onToggle={() => choose(group.key, checked ? group.default : choice.value)}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ---------------- last: gift message ---------------- */}
                    <section>
                        <div className="mb-1 flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--tint) text-(--accent)">
                                <Gift size={17} />
                            </span>
                            <div>
                                <h2 className="text-base font-extrabold text-(--text-heading)">
                                    {giftSectionNo}. Add a gift message{" "}
                                    <span className="text-sm font-medium text-(--text-muted)">(Optional)</span>
                                </h2>
                                <p className="text-xs text-(--text-muted)">Write a short message to include with the package.</p>
                            </div>
                        </div>
                        <div className="mt-2">
                            <TextArea
                                id="gift-message"
                                value={giftMessage}
                                onChange={changeGiftMessage}
                                placeholder="Write your gift message here..."
                                disabled={locked}
                                rows={2}
                            />
                        </div>
                    </section>

                    {extrasError && <p className="text-xs font-semibold text-[#c0392b]">{extrasError}</p>}

                    <div className="flex flex-col gap-2 rounded-xl bg-(--tint) p-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="flex items-center gap-2 text-xs text-(--text-muted)">
                            <Info size={15} className="shrink-0 text-(--accent)" />
                            You can skip add-ons and continue to payment if you don&apos;t want any extras.
                        </p>
                        <button
                            type="button"
                            onClick={handleSkip}
                            disabled={!address || paying || syncing}
                            className="h-8 shrink-0 rounded-lg border border-(--accent) px-4 text-xs font-bold text-(--accent) transition hover:bg-(--surface) disabled:pointer-events-none disabled:opacity-50"
                        >
                            Skip extras
                        </button>
                    </div>
                </div>

                {/* ---------------- order summary ---------------- */}
                <aside className="h-fit rounded-2xl border border-(--border) bg-(--surface) p-4 lg:sticky lg:top-4">
                    <h2 className="text-base font-extrabold text-(--text-heading)">Order summary</h2>

                    <dl className="mt-3 space-y-2 text-sm">
                        {pricing.bookLines.map(({ item, baseTotal }) => (
                            <div key={item.book._id} className="flex justify-between gap-3">
                                <dt className="min-w-0 text-(--text-muted)">
                                    <span className="block truncate">
                                        {item.book.title} × {item.quantity}
                                    </span>
                                </dt>
                                <dd className="shrink-0 font-bold text-(--text-heading)">{money(baseTotal)}</dd>
                            </div>
                        ))}

                        <div className="border-t border-(--border) pt-2">
                            <dt className="mb-1 text-xs font-extrabold text-(--text-heading)">Add-ons</dt>
                            {chosenExtras.length === 0 ? (
                                <dd className="text-xs text-(--text-muted)">No add-ons selected</dd>
                            ) : (
                                chosenExtras.map(({ group, choice }) => (
                                    <div key={group.key} className="flex justify-between gap-3 py-0.5">
                                        <dt className="min-w-0 text-(--text-muted)">
                                            {choice.label}
                                            {pricing.copyCount > 1 && (
                                                <span className="block text-[11px]">
                                                    {money(choice.price)} × {copies(pricing.copyCount)}
                                                </span>
                                            )}
                                        </dt>
                                        <dd className="shrink-0 font-bold text-(--text-heading)">
                                            {money(choice.price * pricing.copyCount)}
                                        </dd>
                                    </div>
                                ))
                            )}
                            {giftMessage.trim() && (
                                <div className="flex justify-between gap-3 py-0.5 text-(--text-muted)">
                                    <dt>Gift message</dt>
                                    <dd className="font-bold text-(--text-heading)">Free</dd>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between gap-3 border-t border-(--border) pt-2">
                            <dt className="text-(--text-muted)">Subtotal ({copies(pricing.copyCount)})</dt>
                            <dd className="font-bold text-(--text-heading)">{money(pricing.subtotal)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="inline-flex items-center gap-1.5 text-(--text-muted)">
                                <Truck size={14} />
                                Delivery
                            </dt>
                            <dd className="font-bold text-(--text-heading)">
                                {quoteLoading ? "Calculating..." : quote ? money(pricing.delivery) : "—"}
                            </dd>
                        </div>
                        {quote && !quoteLoading && quote.estimatedDeliveryDays && (
                            <div className="-mt-1 text-xs text-(--text-muted)">
                                Estimated delivery in about {quote.estimatedDeliveryDays}{" "}
                                {quote.estimatedDeliveryDays === 1 ? "day" : "days"} after dispatch
                            </div>
                        )}
                        {quote && !quoteLoading && pricing.gstAmount > 0 && (
                            <div className="flex justify-between gap-3">
                                <dt className="text-(--text-muted)">GST ({pricing.gstPercent}%)</dt>
                                <dd className="font-bold text-(--text-heading)">{money(pricing.gstAmount)}</dd>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-3 border-t border-(--border) pt-3">
                            <dt className="text-sm font-extrabold text-(--text-heading)">Total</dt>
                            <dd className="text-lg font-extrabold text-(--accent)">
                                {money(quote ? pricing.total : pricing.subtotal)}
                            </dd>
                        </div>
                    </dl>

                    {address && (
                        <div className="mt-3 rounded-xl bg-(--tint) p-2.5 text-xs leading-relaxed text-(--text-muted)">
                            <p className="font-extrabold text-(--text-heading)">Delivering to {address.fullName}</p>
                            <p>
                                {address.city}, {address.state} - {address.pincode}
                            </p>
                        </div>
                    )}

                    {quoteError && <p className="mt-3 text-xs font-semibold text-[#c0392b]">{quoteError}</p>}
                    {extrasError && <p className="mt-3 text-xs font-semibold text-[#c0392b]">{extrasError}</p>}
                    {payError && <p className="mt-3 text-xs font-semibold text-[#c0392b]">{payError}</p>}

                    <button
                        type="button"
                        onClick={() => startPayment(null)}
                        disabled={!canPay}
                        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-(--accent) text-sm font-bold text-white transition hover:bg-(--accent-hover) disabled:pointer-events-none disabled:opacity-50"
                    >
                        {paying ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                        {paying ? "Processing..." : quote ? `Continue to payment · ${money(pricing.total)}` : "Continue to payment"}
                        {!paying && <ArrowRight size={15} />}
                    </button>
                    {dedicationMissing && (
                        <p className="mt-2 text-center text-xs text-(--text-muted)">Add your dedication message to continue.</p>
                    )}

                    <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-(--text-muted)">
                        <ShieldCheck size={12} />
                        Secure payment via Razorpay
                    </p>
                </aside>
            </div>
        </div>
    );
};

export default PrintExtras;