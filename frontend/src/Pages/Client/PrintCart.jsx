/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    BookOpen,
    Check,
    Loader2,
    Minus,
    Settings2,
    Plus,
    ShieldCheck,
    ShoppingCart,
    Trash2,
    Truck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useRazorpayCheckout } from "../../hooks/useRazorpayCheckout";
import { getShippingQuote, initiateOrder, verifyOrder } from "../../services/orderService";
import { deleteAddress, getAddresses } from "../../services/addressService";
import { AddressSection } from "../../Components/printOrder/AddressSection";
import { AddressFormModal } from "../../Components/printOrder/AddressFormModal";
import { e164Phone } from "../../utils/phone";
import { PrintOptionsModal } from "../../Components/PrintOptionsModal";

const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const copies = (n) => `${n} ${n === 1 ? "copy" : "copies"}`;

// Cart -> Delivery -> Payment progress strip
const Steps = ({ current }) => {
    const steps = ["Cart", "Delivery", "Payment"];
    return (
        <ol className="flex items-center gap-2 text-xs font-bold">
            {steps.map((label, index) => {
                const done = index < current;
                const active = index === current;
                return (
                    <li key={label} className="flex items-center gap-2">
                        <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${done || active
                                ? "bg-(--accent) text-white"
                                : "border border-(--border) text-(--text-muted)"
                                }`}
                        >
                            {done ? <Check size={13} /> : index + 1}
                        </span>
                        <span className={active || done ? "text-(--text-heading)" : "text-(--text-muted)"}>{label}</span>
                        {index < steps.length - 1 && <span className="mx-1 h-px w-5 bg-(--border) sm:w-8" />}
                    </li>
                );
            })}
        </ol>
    );
};

// One book in the cart
const CartItem = ({ item, maxQuantity, disabled, onQuantity, onRemove, onOpen, onEditOptions }) => {
    const { book, quantity } = item;
    return (
        <section className="rounded-3xl border border-(--border) bg-(--surface) p-4 sm:p-6">
            <div className="flex gap-4">
                <button
                    type="button"
                    onClick={() => onOpen(book._id)}
                    aria-label={`Open ${book.title}`}
                    className="h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-(--border) bg-(--tint) sm:h-32 sm:w-28"
                >
                    {book.coverImageUrl ? (
                        <img src={book.coverImageUrl} alt={book.title} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-(--accent)">
                            <BookOpen size={28} />
                        </div>
                    )}
                </button>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="truncate text-base font-extrabold text-(--text-heading) sm:text-lg">
                                {book.title}
                            </h2>
                            <p className="mt-0.5 text-xs text-(--text-muted)">
                                Printed storybook · {item.pageCount} story pages
                            </p>
                            <p className="mt-1 text-sm font-bold text-(--accent)">{money(item.unitPrice)} each</p>

                            {item.printOptionLabels?.length > 0 && (
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    {item.printOptionLabels.map((label) => (
                                        <span
                                            key={label}
                                            className="rounded-full bg-(--tint) px-2.5 py-0.5 text-[11px] font-bold text-(--accent)"
                                        >
                                            {label}
                                        </span>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => onEditOptions(item)}
                                        disabled={disabled}
                                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-(--text-muted) underline-offset-2 transition hover:text-(--accent) hover:underline disabled:opacity-40"
                                    >
                                        <Settings2 size={12} /> Change
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemove(book._id)}
                            disabled={disabled}
                            aria-label={`Remove ${book.title} from cart`}
                            title="Remove"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-(--text-muted) transition hover:bg-(--tint) hover:text-[#c0392b] disabled:opacity-40"
                        >
                            <Trash2 size={17} />
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-xl border border-(--border)">
                            <button
                                type="button"
                                onClick={() => onQuantity(book._id, quantity - 1)}
                                disabled={quantity <= 1 || disabled}
                                aria-label="Decrease quantity"
                                className="flex h-10 w-10 items-center justify-center text-(--accent) transition hover:bg-(--tint) disabled:opacity-40"
                            >
                                <Minus size={16} />
                            </button>
                            <span className="w-10 text-center text-sm font-extrabold text-(--text-heading)">
                                {quantity}
                            </span>
                            <button
                                type="button"
                                onClick={() => onQuantity(book._id, quantity + 1)}
                                disabled={quantity >= maxQuantity || disabled}
                                aria-label="Increase quantity"
                                className="flex h-10 w-10 items-center justify-center text-(--accent) transition hover:bg-(--tint) disabled:opacity-40"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <p className="text-base font-extrabold text-(--text-heading)">{money(item.lineTotal)}</p>
                    </div>
                </div>
            </div>

            {quantity >= maxQuantity && (
                <p className="mt-3 text-xs font-semibold text-(--text-muted)">
                    You can order up to {maxQuantity} copies of a book at a time.
                </p>
            )}
        </section>
    );
};

export const PrintCart = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { items, totals, loaded, refresh, updateQuantity, updatePrintOptions, removeItem } = useCart();
    const { openCheckout } = useRazorpayCheckout();

    // the cart item whose print options are being changed (null = modal closed)
    const [editingItem, setEditingItem] = useState(null);

    const [cartBusy, setCartBusy] = useState(false);
    const [cartError, setCartError] = useState("");

    const [addresses, setAddresses] = useState([]);
    const [addressesLoading, setAddressesLoading] = useState(true);
    const [selectedId, setSelectedId] = useState("");
    const [formState, setFormState] = useState({ open: false, address: null });

    const [paying, setPaying] = useState(false);
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
                if (!cancelled) applyAddresses(data.addresses || []);
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
        if (cartBusy || paying) return;
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

    const handleSaveOptions = async (printOptions) => {
        const result = await updatePrintOptions(editingItem.book._id, printOptions);
        if (result.ok) setEditingItem(null);
        return result;
    };

    const handleDeleteAddress = async (address) => {
        try {
            await deleteAddress(address._id);
            await loadAddresses();
        } catch {
            setPayError("Couldn't delete that address. Please try again.");
        }
    };

    const handlePay = async () => {
        if (paying || cartBusy) return;
        if (!selectedAddress) {
            setPayError("Please choose a delivery address first.");
            return;
        }
        if (!quote) {
            setPayError(quoteError || "Delivery charges are still loading. Please wait a moment.");
            return;
        }

        setPaying(true);
        setPayError("");

        try {
            // no bookId: the server charges for whatever is in the cart
            const { data } = await initiateOrder({ addressId: selectedAddress._id });

            await openCheckout({
                order: data.order,
                keyId: data.keyId,
                name: "Wonder Books",
                description:
                    items.length === 1
                        ? `${copies(totals.itemCount)} of "${items[0].book.title}"`
                        : `${totals.bookCount} printed books (${copies(totals.itemCount)})`,
                prefill: {
                    name: selectedAddress.fullName,
                    email: user?.email || "",
                    contact: e164Phone(selectedAddress),
                },
                onSuccess: async (response) => {
                    try {
                        const verifyRes = await verifyOrder({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            addressId: selectedAddress._id,
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
            setPayError(err.response?.data?.message || "Couldn't start the order. Please try again.");
        }
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

    // Cart is done once it loads; Delivery is active until an address is chosen; then Payment
    const step = paying || selectedAddress ? 2 : 1;
    const locked = cartBusy || paying;

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
            <button
                type="button"
                onClick={() => navigate("/books")}
                className="inline-flex items-center gap-2 text-sm font-bold text-(--accent) transition hover:text-(--accent-hover)"
            >
                <ArrowLeft size={16} />
                Continue browsing my books
            </button>

            <div className="mb-6 mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-(--text-heading) sm:text-3xl">
                        <ShoppingCart size={26} className="text-(--accent)" />
                        Your cart
                        <span className="text-base font-bold text-(--text-muted)">
                            ({totals.bookCount} {totals.bookCount === 1 ? "book" : "books"})
                        </span>
                    </h1>
                    <p className="mt-1 text-sm text-(--text-muted)">
                        Review your printed books, pick a delivery address and pay.
                    </p>
                </div>
                <Steps current={step} />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="space-y-5 lg:col-span-2">
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
                            onEditOptions={setEditingItem}
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
                <aside className="h-fit rounded-3xl border border-(--border) bg-(--surface) p-5 sm:p-6 lg:sticky lg:top-4">
                    <h2 className="text-lg font-extrabold text-(--text-heading)">Order summary</h2>

                    <dl className="mt-4 space-y-3 text-sm">
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
                        <div className="flex justify-between gap-3 border-t border-(--border) pt-3">
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
                        <div className="flex items-center justify-between gap-3 border-t border-(--border) pt-4">
                            <dt className="text-base font-extrabold text-(--text-heading)">Total</dt>
                            <dd className="text-xl font-extrabold text-(--accent)">
                                {money(quote ? quote.total : totals.subtotal)}
                            </dd>
                        </div>
                    </dl>

                    {selectedAddress && (
                        <div className="mt-4 rounded-2xl bg-(--tint) p-3 text-xs leading-relaxed text-(--text-muted)">
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
                        onClick={handlePay}
                        disabled={paying || cartBusy || addressesLoading || !selectedAddress || quoteLoading || !quote}
                        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-(--accent) text-sm font-bold text-white transition hover:bg-(--accent-hover) disabled:pointer-events-none disabled:opacity-50"
                    >
                        {paying ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
                        {paying ? "Processing..." : quote ? `Pay ${money(quote.total)}` : "Pay"}
                    </button>

                    {!selectedAddress && !addressesLoading && (
                        <p className="mt-2 text-center text-xs text-(--text-muted)">Add a delivery address to continue.</p>
                    )}

                    <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-(--text-muted)">
                        <ShieldCheck size={12} />
                        Secure payment via Razorpay
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

            <PrintOptionsModal
                isOpen={Boolean(editingItem)}
                onClose={() => setEditingItem(null)}
                onConfirm={handleSaveOptions}
                bookId={editingItem?.book._id}
                bookTitle={editingItem?.book.title}
                initialOptions={editingItem?.printOptions}
                title="Change print options"
                confirmLabel="Save changes"
            />
        </div>
    );
};

export default PrintCart;