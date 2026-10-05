const BASE_PRICE = 599;
const BASE_PAGE_LIMIT = 20;
const PRICE_PER_EXTRA_PAGE = 15;

export const SHIPPING_FEE = 0;

export const MAX_COPIES_PER_ORDER = 10;

export const MAX_CART_ITEMS = 8;

export const PRINT_CURRENCY = "INR";

export const getPrintPriceForPageCount = (pageCount = 0) => {
    const extraPages = Math.max(0, Number(pageCount) - BASE_PAGE_LIMIT);
    return BASE_PRICE + extraPages * PRICE_PER_EXTRA_PAGE;
};

export const getPrintPrice = (book) => getPrintPriceForPageCount(book?.pages?.length || 0);

export const normalizeQuantity = (value) => {
    const qty = Math.floor(Number(value));
    if (!Number.isFinite(qty) || qty < 1) return 1;
    return Math.min(qty, MAX_COPIES_PER_ORDER);
};

export const getOrderTotals = (book, quantity = 1) => {
    const qty = normalizeQuantity(quantity);
    const unitPrice = getPrintPrice(book);
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
        const unitPrice = getPrintPriceForPageCount(line.pageCount);
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