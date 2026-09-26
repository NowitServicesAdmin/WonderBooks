const BASE_PRICE = 599; 
const BASE_PAGE_LIMIT = 20;
const PRICE_PER_EXTRA_PAGE = 15;

export const getPrintPrice = (book) => {
    const pageCount = book?.pages?.length || 0;
    const extraPages = Math.max(0, pageCount - BASE_PAGE_LIMIT);
    return BASE_PRICE + extraPages * PRICE_PER_EXTRA_PAGE;
};

export const PRINT_CURRENCY = "INR";
