/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    // Check,
    Loader2,
    Minus,
    Plus,
    ShieldCheck,
    ShoppingCart,
    Trash2,
    Truck,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { getShippingQuote } from "../../services/orderService";
import { deleteAddress, getAddresses } from "../../services/addressService";
import { AddressSection } from "../../Components/printOrder/AddressSection";
import { AddressFormModal } from "../../Components/printOrder/AddressFormModal";
import { CheckoutSteps } from "../../Components/printOrder/CheckoutSteps";
import { getCheckoutAddressId, setCheckoutAddressId } from "../../utils/checkoutSession";

const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const copies = (n) => `${n} ${n === 1 ? "copy" : "copies"}`;

// One book in the cart
const CartItem = ({ item, maxQuantity, disabled, onQuantity, onRemove, onOpen }) => {
    const { book, quantity } = item;
    return (
        <section className="rounded-2xl border border-(--border) bg-(--surface) p-3 sm:p-4">
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => onOpen(book._id)}
                    aria-label={`Open ${book.title}`}
                    className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-(--border) bg-(--tint) sm:h-24 sm:w-20"
                >
                    {book.coverImageUrl ? (
                        <img src={book.coverImageUrl} alt={book.title} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-(--accent)">
                            <BookOpen size={22} />
                        </div>
                    )}
                </button>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="truncate text-sm font-extrabold text-(--text-heading) sm:text-base">
                                {book.title}
                            </h2>
                            <p className="mt-0.5 text-xs text-(--text-muted)">
                                Printed storybook · {item.pageCount} story pages
                            </p>
                            <p className="mt-0.5 text-xs font-bold text-(--accent)">{money(item.unitPrice)} each</p>

                            {item.printOptionLabels?.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                    {item.printOptionLabels.map((label) => (
                                        <span
                                            key={label}
                                            className="rounded-full bg-(--tint) px-2 py-0.5 text-[10px] font-bold text-(--accent)"
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemove(book._id)}
                            disabled={disabled}
                            aria-label={`Remove ${book.title} from cart`}
                            title="Remove"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-(--text-muted) transition hover:bg-(--tint) hover:text-[#c0392b] disabled:opacity-40"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-lg border border-(--border)">
                            <button
                                type="button"
                                onClick={() => onQuantity(book._id, quantity - 1)}
                                disabled={quantity <= 1 || disabled}
                                aria-label="Decrease quantity"
                                className="flex h-8 w-8 items-center justify-center text-(--accent) transition hover:bg-(--tint) disabled:opacity-40"
                            >
                                <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-extrabold text-(--text-heading)">
                                {quantity}
                            </span>
                            <button
                                type="button"
                                onClick={() => onQuantity(book._id, quantity + 1)}
                                disabled={quantity >= maxQuantity || disabled}
                                aria-label="Increase quantity"
                                className="flex h-8 w-8 items-center justify-center text-(--accent) transition hover:bg-(--tint) disabled:opacity-40"
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        <p className="text-sm font-extrabold text-(--text-heading)">{money(item.lineTotal)}</p>
                    </div>
                </div>
            </div>

            {quantity >= maxQuantity && (
                <p className="mt-2 text-xs font-semibold text-(--text-muted)">
                    You can order up to {maxQuantity} copies of a book at a time.
                </p>
            )}
        </section>
    );
};

export const PrintCart = () => {
    const navigate = useNavigate();
    const { items, totals, loaded, refresh, updateQuantity, removeItem } = useCart();

    const [cartBusy, setCartBusy] = useState(false);
    const [cartError, setCartError] = useState("");

    const [addresses, setAddresses] = useState([]);
    const [addressesLoading, setAddressesLoading] = useState(true);
    const [selectedId, setSelectedId] = useState("");
    const [formState, setFormState] = useState({ open: false, address: null });

    const [payError, setPayError] = useState("");

    // delivery charge + estimated days + GST for the selected address
    const [quote, setQuote] = useState(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteError, setQuoteError] = useState("");

    // always show the latest cart when this page opens
    useEffect(() => {
        refresh();
    }, [refresh]);

    const applyAddresses = useCallback((list, preferId) => {
        setAddresses(list);
        setSelectedId((current) => {
            const wanted = preferId || current;
            if (wanted && list.some((a) => a._id === wanted)) return wanted;
            return (list.find((a) => a.isDefault) || list[0])?._id || "";
        });
    }, []);

    // refresh after adding / editing / deleting an address
    const loadAddresses = useCallback(
        async (preferId) => {
            try {
                const { data } = await getAddresses();
                applyAddresses(data.addresses || [], preferId);
            } catch {
                setPayError("We couldn't load your saved addresses. Please refresh the page.");
            }
        },
        [applyAddresses],
    );

    // first load of saved addresses
    useEffect(() => {
        let cancelled = false;
        getAddresses()
            .then(({ data }) => {
                if (!cancelled) applyAddresses(data.addresses || [], getCheckoutAddressId());
            })
            .catch(() => {
                if (!cancelled) setPayError("We couldn't load your saved addresses. Please refresh the page.");
            })
            .finally(() => {
                if (!cancelled) setAddressesLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [applyAddresses]);

    const selectedAddress = useMemo(
        () => addresses.find((a) => a._id === selectedId) || null,
        [addresses, selectedId],
    );

    // Re-price whenever the address or the number of copies changes
    useEffect(() => {
        if (!selectedId || items.length === 0) {
            setQuote(null);
            setQuoteError("");
            return undefined;
        }
        let cancelled = false;
        setQuoteLoading(true);
        setQuoteError("");
        getShippingQuote({ addressId: selectedId })
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
    }, [selectedId, items.length, totals.itemCount, totals.subtotal]);

    const runCartAction = async (action) => {
        if (cartBusy) return;
        setCartBusy(true);
        setCartError("");
        const result = await action();
        if (!result.ok) setCartError(result.message);
        setCartBusy(false);
    };

    const handleQuantity = (bookId, next) => {
        const clamped = Math.min(totals.maxQuantity, Math.max(1, next));
        return runCartAction(() => updateQuantity(bookId, clamped));
    };

    const handleRemove = (bookId) => runCartAction(() => removeItem(bookId));

    const handleDeleteAddress = async (address) => {
        try {
            await deleteAddress(address._id);
            await loadAddresses();
        } catch {
            setPayError("Couldn't delete that address. Please try again.");
        }
    };

    // Cart + delivery are done: remember the address and go pick extras
    const handleContinue = () => {
        if (cartBusy) return;
        if (!selectedAddress) {
            setPayError("Please choose a delivery address first.");
            return;
        }
        if (!quote) {
            setPayError(quoteError || "Delivery charges are still loading. Please wait a moment.");
            return;
        }
        setPayError("");
        setCheckoutAddressId(selectedAddress._id);
        navigate("/orders/extras");
    };

    const closeForm = () => setFormState({ open: false, address: null });

    if (!loaded) {
        return (
            <div className="flex h-full min-h-80 flex-col items-center justify-center">
                <Loader2 size={30} className="animate-spin text-(--accent)" />
                <p className="mt-3 text-sm font-medium text-(--text-muted)">Getting your cart ready...</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex h-full min-h-80 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--tint) text-(--accent)">
                    <ShoppingCart size={30} />
                </div>
                <p className="mt-4 text-lg font-extrabold text-(--text-heading)">Your cart is empty</p>
                <p className="mt-1 max-w-sm text-sm text-(--text-muted)">
                    Open a finished book and tap the cart button to order a printed copy.
                </p>
                <button
                    type="button"
                    onClick={() => navigate("/books")}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-(--accent) px-5 py-2.5 text-sm font-bold text-white transition hover:bg-(--accent-hover)"
                >
                    <ArrowLeft size={16} />
                    Go to my books
                </button>
            </div>
        );
    }

    const locked = cartBusy;

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
            <button
                type="button"
                onClick={() => navigate("/books")}
                className="inline-flex items-center gap-2 text-sm font-bold text-(--accent) transition hover:text-(--accent-hover)"
            >
                <ArrowLeft size={16} />
                Continue browsing my books
            </button>

            <div className="mb-4 mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2.5 text-xl font-extrabold text-(--text-heading) sm:text-2xl">
                        <ShoppingCart size={22} className="text-(--accent)" />
                        Your cart
                        <span className="text-sm font-bold text-(--text-muted)">
                            ({totals.bookCount} {totals.bookCount === 1 ? "book" : "books"})
                        </span>
                    </h1>
                    <p className="mt-1 text-sm text-(--text-muted)">
                        Review your printed books, pick a delivery address and pay.
                    </p>
                </div>
                <CheckoutSteps current={1} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-3 lg:col-span-2">
                    {/* ---------------- cart items ---------------- */}
                    {items.map((item) => (
                        <CartItem
                            key={item.book._id}
                            item={item}
                            maxQuantity={totals.maxQuantity}
                            disabled={locked}
                            onQuantity={handleQuantity}
                            onRemove={handleRemove}
                            onOpen={(id) => navigate(`/books/${id}`)}
                        />
                    ))}
                    {cartError && <p className="text-xs font-semibold text-[#c0392b]">{cartError}</p>}

                    {/* ---------------- delivery address ---------------- */}
                    <AddressSection
                        loading={addressesLoading}
                        addresses={addresses}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onAdd={() => setFormState({ open: true, address: null })}
                        onEdit={(address) => setFormState({ open: true, address })}
                        onDelete={handleDeleteAddress}
                    />
                </div>

                {/* ---------------- order summary ---------------- */}
                <aside className="h-fit rounded-2xl border border-(--border) bg-(--surface) p-4 lg:sticky lg:top-4">
                    <h2 className="text-base font-extrabold text-(--text-heading)">Order summary</h2>

                    <dl className="mt-3 space-y-2 text-sm">
                        {items.map((item) => (
                            <div key={item.book._id} className="flex justify-between gap-3">
                                <dt className="min-w-0 text-(--text-muted)">
                                    <span className="block truncate">
                                        {item.book.title} × {item.quantity}
                                    </span>
                                    {item.printOptionLabels?.length > 0 && (
                                        <span className="block text-[11px]">{item.printOptionLabels.join(" · ")}</span>
                                    )}
                                </dt>
                                <dd className="shrink-0 font-bold text-(--text-heading)">{money(item.lineTotal)}</dd>
                            </div>
                        ))}
                        <div className="flex justify-between gap-3 border-t border-(--border) pt-2">
                            <dt className="text-(--text-muted)">Subtotal ({copies(totals.itemCount)})</dt>
                            <dd className="font-bold text-(--text-heading)">{money(totals.subtotal)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="inline-flex items-center gap-1.5 text-(--text-muted)">
                                <Truck size={14} />
                                Delivery
                            </dt>
                            <dd className="font-bold text-(--text-heading)">
                                {!selectedAddress
                                    ? "Choose address"
                                    : quoteLoading
                                        ? "Calculating..."
                                        : quote
                                            ? money(quote.deliveryCharge)
                                            : "—"}
                            </dd>
                        </div>
                        {quote && !quoteLoading && quote.estimatedDeliveryDays && (
                            <div className="-mt-1 text-xs text-(--text-muted)">
                                Estimated delivery in about {quote.estimatedDeliveryDays}{" "}
                                {quote.estimatedDeliveryDays === 1 ? "day" : "days"} after dispatch
                            </div>
                        )}
                        {quote && !quoteLoading && quote.gstAmount > 0 && (
                            <div className="flex justify-between gap-3">
                                <dt className="text-(--text-muted)">GST ({quote.gstPercent}%)</dt>
                                <dd className="font-bold text-(--text-heading)">{money(quote.gstAmount)}</dd>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-3 border-t border-(--border) pt-3">
                            <dt className="text-sm font-extrabold text-(--text-heading)">Total</dt>
                            <dd className="text-lg font-extrabold text-(--accent)">
                                {money(quote ? quote.total : totals.subtotal)}
                            </dd>
                        </div>
                    </dl>

                    {selectedAddress && (
                        <div className="mt-3 rounded-xl bg-(--tint) p-2.5 text-xs leading-relaxed text-(--text-muted)">
                            <p className="font-extrabold text-(--text-heading)">Delivering to {selectedAddress.fullName}</p>
                            <p>
                                {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                            </p>
                        </div>
                    )}

                    {quoteError && <p className="mt-4 text-xs font-semibold text-[#c0392b]">{quoteError}</p>}
                    {payError && <p className="mt-4 text-xs font-semibold text-[#c0392b]">{payError}</p>}

                    <button
                        type="button"
                        onClick={handleContinue}
                        disabled={cartBusy || addressesLoading || !selectedAddress || quoteLoading || !quote}
                        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-(--accent) text-sm font-bold text-white transition hover:bg-(--accent-hover) disabled:pointer-events-none disabled:opacity-50"
                    >
                        Continue
                        <ArrowRight size={15} />
                    </button>

                    {!selectedAddress && !addressesLoading && (
                        <p className="mt-2 text-center text-xs text-(--text-muted)">Add a delivery address to continue.</p>
                    )}

                    <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-(--text-muted)">
                        <ShieldCheck size={12} />
                        Next: personalize & add extras, then pay securely via Razorpay
                    </p>
                </aside>
            </div>

            {formState.open && (
                <AddressFormModal
                    address={formState.address}
                    isFirstAddress={addresses.length === 0}
                    onClose={closeForm}
                    onSaved={async (saved) => {
                        closeForm();
                        await loadAddresses(saved?._id);
                    }}
                />
            )}
        </div>
    );
};

export default PrintCart;