
const DEFAULT_BOOK_PAGE_COUNT = 2;
const MAX_BOOK_PAGE_COUNT = 10;

export const getBookPageCount = () => {
    const n = Math.floor(Number(process.env.BOOK_PAGE_COUNT));
    if (!Number.isFinite(n) || n < 1) return DEFAULT_BOOK_PAGE_COUNT;
    return Math.min(n, MAX_BOOK_PAGE_COUNT);
};