/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import * as cartApi from "../services/cartService";

const EMPTY_TOTALS = {
    itemCount: 0,
    bookCount: 0,
    subtotal: 0,
    shippingFee: 0,
    total: 0,
    maxQuantity: 10,
    maxBooks: 8,
};

const EMPTY_ITEMS = [];

const CartContext = createContext(null);

const errorMessage = (err, fallback) => err?.response?.data?.message || fallback;

export const CartProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();

    // Only regular users have a cart (super admins never see it)
    const hasCart = isAuthenticated && user?.role === "user";

    const [rawItems, setItems] = useState([]);
    const [rawTotals, setTotals] = useState(EMPTY_TOTALS);
    const [rawLoaded, setLoaded] = useState(false);

    // Logged out / super admin: always look empty, whatever was cached
    const items = hasCart ? rawItems : EMPTY_ITEMS;
    const totals = hasCart ? rawTotals : EMPTY_TOTALS;
    const loaded = hasCart && rawLoaded;

    const apply = useCallback((data) => {
        setItems(data.items || []);
        setTotals(data.totals || EMPTY_TOTALS);
        setLoaded(true);
    }, []);

    const refresh = useCallback(async () => {
        if (!hasCart) return;
        try {
            const { data } = await cartApi.getCart();
            apply(data);
        } catch {
            // keep whatever we last had; the badge just won't update
            setLoaded(true);
        }
    }, [hasCart, apply]);

    // load the cart when a regular user signs in
    useEffect(() => {
        if (!hasCart) return undefined;
        let cancelled = false;
        cartApi
            .getCart()
            .then(({ data }) => {
                if (!cancelled) apply(data);
            })
            .catch(() => {
                if (!cancelled) setLoaded(true);
            });
        return () => {
            cancelled = true;
        };
    }, [hasCart, apply]);

    // Each action resolves to { ok, message?, alreadyInCart? } so callers can show feedback
    const addToCart = useCallback(
        async (bookId, printOptions) => {
            try {
                const { data } = await cartApi.addCartItem(bookId, 1, printOptions);
                apply(data);
                return { ok: true, alreadyInCart: Boolean(data.alreadyInCart) };
            } catch (err) {
                return { ok: false, message: errorMessage(err, "Couldn't add this book to your cart.") };
            }
        },
        [apply],
    );

    const updateQuantity = useCallback(
        async (bookId, quantity) => {
            try {
                const { data } = await cartApi.updateCartItem(bookId, quantity);
                apply(data);
                return { ok: true };
            } catch (err) {
                return { ok: false, message: errorMessage(err, "Couldn't update your cart.") };
            }
        },
        [apply],
    );

    const updatePrintOptions = useCallback(
        async (bookId, printOptions) => {
            try {
                const { data } = await cartApi.updateCartPrintOptions(bookId, printOptions);
                apply(data);
                return { ok: true };
            } catch (err) {
                return { ok: false, message: errorMessage(err, "Couldn't update the print options.") };
            }
        },
        [apply],
    );

    const removeItem = useCallback(
        async (bookId) => {
            try {
                const { data } = await cartApi.removeCartItem(bookId);
                apply(data);
                return { ok: true };
            } catch (err) {
                return { ok: false, message: errorMessage(err, "Couldn't remove that book.") };
            }
        },
        [apply],
    );

    const value = useMemo(
        () => ({
            hasCart,
            items,
            totals,
            loaded,
            count: totals.itemCount, // total copies, shown on the header badge
            isInCart: (bookId) => items.some((item) => item.book._id === bookId),
            refresh,
            addToCart,
            updateQuantity,
            updatePrintOptions,
            removeItem,
        }),
        [hasCart, items, totals, loaded, refresh, addToCart, updateQuantity, updatePrintOptions, removeItem],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};