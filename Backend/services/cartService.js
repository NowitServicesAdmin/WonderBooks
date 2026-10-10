import mongoose from "mongoose";
import Cart from "../models/cart.js";
import Book from "../models/book.js";
import { getCartTotals } from "../config/printPricing.js";
import { normalizePrintOptions, describePrintOptions } from "../config/printOptions.js";

const toObjectIds = (ids) => ids.map((id) => new mongoose.Types.ObjectId(String(id)));

export const loadBookSummaries = async (userId, bookIds, { completedOnly = true } = {}) => {
    if (!bookIds.length) return [];
    const match = {
        _id: { $in: toObjectIds(bookIds) },
        user: new mongoose.Types.ObjectId(String(userId)),
        isDeleted: { $ne: true },
    };
    if (completedOnly) match.status = "completed";

    return Book.aggregate([
        { $match: match },
        {
            $project: {
                title: 1,
                coverImageUrl: 1,
                pageCount: { $size: { $ifNull: ["$pages", []] } },
            },
        },
    ]);
};

export const loadCartLines = async (userId) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart || !cart.items.length) return [];

    const summaries = await loadBookSummaries(
        userId,
        cart.items.map((item) => item.book)
    );
    const byId = new Map(summaries.map((b) => [String(b._id), b]));

    const lines = [];
    const kept = [];
    for (const item of cart.items) {
        const book = byId.get(String(item.book));
        if (!book) continue;
        kept.push(item);
        lines.push({
            bookId: String(book._id),
            title: book.title,
            coverImageUrl: book.coverImageUrl || null,
            pageCount: book.pageCount,
            quantity: item.quantity,
            printOptions: normalizePrintOptions(item.printOptions),
        });
    }

    if (kept.length !== cart.items.length) {
        cart.items = kept;
        await cart.save();
    }
    return lines;
};

export const buildCartView = async (userId) => {
    const lines = await loadCartLines(userId);
    const totals = getCartTotals(lines);

    return {
        items: totals.lines.map((line) => ({
            book: {
                _id: line.bookId,
                title: line.title,
                coverImageUrl: line.coverImageUrl,
            },
            pageCount: line.pageCount,
            quantity: line.quantity,
            printOptions: line.printOptions,
            printOptionLabels: describePrintOptions(line.printOptions),
            unitPrice: line.unitPrice,
            lineTotal: line.lineTotal,
        })),
        totals: {
            itemCount: totals.itemCount,
            bookCount: totals.bookCount,
            subtotal: totals.subtotal,
            shippingFee: totals.shippingFee,
            total: totals.total,
            currency: totals.currency,
            maxQuantity: totals.maxQuantity,
            maxBooks: totals.maxBooks,
        },
    };
};