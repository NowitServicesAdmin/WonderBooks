import { getPrintOptionsPrice } from "./printOptions.js";

const BASE_PRICE = 499;
const BASE_PAGE_LIMIT = 10;
const PRICE_PER_EXTRA_PAGE = 15;

export const SHIPPING_FEE = 0;

export const MAX_COPIES_PER_ORDER = 10;

export const MAX_CART_ITEMS = 8;

export const PRINT_CURRENCY = "INR";

export const getPrintPriceForPageCount = (pageCount = 0, printOptions) => {
    const extraPages = Math.max(0, Number(pageCount) - BASE_PAGE_LIMIT);
    return BASE_PRICE + extraPages * PRICE_PER_EXTRA_PAGE + getPrintOptionsPrice(printOptions);
};

export const getPrintPrice = (book, printOptions) =>
    getPrintPriceForPageCount(book?.pages?.length || 0, printOptions);

export const normalizeQuantity = (value) => {
    const qty = Math.floor(Number(value));
    if (!Number.isFinite(qty) || qty < 1) return 1;
    return Math.min(qty, MAX_COPIES_PER_ORDER);
};

export const getOrderTotals = (book, quantity = 1, printOptions) => {
    const qty = normalizeQuantity(quantity);
    const unitPrice = getPrintPrice(book, printOptions);
    const subtotal = unitPrice * qty;
    const shippingFee = SHIPPING_FEE;
    return {
        quantity: qty,
        unitPrice,
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
        currency: PRINT_CURRENCY,
        pageCount: book?.pages?.length || 0,
        maxQuantity: MAX_COPIES_PER_ORDER,
    };
};

export const getCartTotals = (lines = []) => {
    const priced = lines.map((line) => {
        const quantity = normalizeQuantity(line.quantity);
        const unitPrice = getPrintPriceForPageCount(line.pageCount, line.printOptions);
        return {
            ...line,
            quantity,
            unitPrice,
            lineTotal: unitPrice * quantity,
        };
    });
    const subtotal = priced.reduce((sum, line) => sum + line.lineTotal, 0);
    const shippingFee = priced.length ? SHIPPING_FEE : 0;
    return {
        lines: priced,
        itemCount: priced.reduce((sum, line) => sum + line.quantity, 0), // total copies
        bookCount: priced.length,
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
        currency: PRINT_CURRENCY,
        maxQuantity: MAX_COPIES_PER_ORDER,
        maxBooks: MAX_CART_ITEMS,
    };
};

/*
|--------------------------------------------------------------------------
| GST + delivery (read from .env at call time, so dotenv load order is safe)
|--------------------------------------------------------------------------
| GST_PERCENT             e.g. 18
| SHIPROCKET_EXTRA_CHARGE e.g. 50  (added on top of Shiprocket's rate)
*/
const readNumber = (name, fallback) => {
    const raw = process.env[name];
    if (raw === undefined || String(raw).trim() === "") return fallback;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
};

export const getGstPercent = () => readNumber("GST_PERCENT", 0);

export const getDeliveryExtraCharge = () => readNumber("SHIPROCKET_EXTRA_CHARGE", 50);
// console.log("GST_PERCENT:", getGstPercent(), "SHIPROCKET_EXTRA_CHARGE:", getDeliveryExtraCharge());

// subtotal + delivery charge, then GST on both. All amounts are whole rupees.
export const getCheckoutTotals = (subtotal, deliveryCharge = 0) => {
    const gstPercent = getGstPercent();
    const taxable = subtotal + deliveryCharge;
    const gstAmount = Math.round((taxable * gstPercent) / 100);
    return {
        subtotal,
        deliveryCharge,
        gstPercent,
        gstAmount,
        total: taxable + gstAmount,
        currency: PRINT_CURRENCY,
    };
};