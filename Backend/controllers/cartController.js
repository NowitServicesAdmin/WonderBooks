import mongoose from "mongoose";
import Cart from "../models/cart.js";
import Book from "../models/book.js";
import { MAX_CART_ITEMS, normalizeQuantity } from "../config/printPricing.js";
import { buildCartView, loadBookSummaries } from "../services/cartService.js";
import { getPrintPriceForPageCount } from "../config/printPricing.js";
import {
  MAX_DEDICATION_LENGTH,
  MAX_GIFT_MESSAGE_LENGTH,
  getPublicPrintOptions,
  parsePrintOptions,
} from "../config/printOptions.js";

const cleanText = (value, max) =>
  typeof value === "string" ? value.replace(/\r\n/g, "\n").trim().slice(0, max) : "";

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const sendCart = async (res, userId, extra = {}) => {
  const cart = await buildCartView(userId);
  return res.json({ success: true, ...cart, ...extra });
};

export const getCart = async (req, res) => {
  try {
    return await sendCart(res, req.userId);
  } catch (error) {
    console.error("getCart error:", error);
    return fail(res, 500, "Unable to load your cart");
  }
};

export const getPrintOptions = async (req, res) => {
  try {
    const { bookId } = req.query;
    let basePrice = null;

    if (bookId && mongoose.isValidObjectId(bookId)) {
      const [book] = await loadBookSummaries(req.userId, [bookId], { completedOnly: false });
      if (book) basePrice = getPrintPriceForPageCount(book.pageCount);
    }

    return res.json({ success: true, ...getPublicPrintOptions(), basePrice });
  } catch (error) {
    console.error("getPrintOptions error:", error);
    return fail(res, 500, "Unable to load the print options");
  }
};

export const addToCart = async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId || !mongoose.isValidObjectId(bookId)) {
      return fail(res, 400, "A valid bookId is required");
    }

    const parsed = parsePrintOptions(req.body.printOptions);
    if (parsed.error) return fail(res, 400, parsed.error);

    const book = await Book.findOne({ _id: bookId, user: req.userId, isDeleted: { $ne: true } })
      .select("status")
      .lean();
    if (!book) return fail(res, 404, "Book not found");
    if (book.status !== "completed") {
      return fail(
        res,
        400,
        "This book isn't finished yet - it can't be printed until it's complete",
      );
    }

    const cart = await Cart.findOneAndUpdate(
      { user: req.userId },
      { $setOnInsert: { user: req.userId, items: [] } },
      { upsert: true, new: true },
    );

    const existing = cart.items.find((item) => String(item.book) === String(bookId));
    if (existing) return await sendCart(res, req.userId, { alreadyInCart: true });

    if (cart.items.length >= MAX_CART_ITEMS) {
      return fail(
        res,
        400,
        `Your cart can hold up to ${MAX_CART_ITEMS} different books. Check out or remove one to add more.`,
      );
    }

    cart.items.push({
      book: bookId,
      quantity: normalizeQuantity(req.body.quantity),
      printOptions: parsed.options,
    });
    await cart.save();

    return await sendCart(res, req.userId, { alreadyInCart: false });
  } catch (error) {
    console.error("addToCart error:", error);
    return fail(res, 500, "Unable to add this book to your cart");
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { bookId } = req.params;
    if (!mongoose.isValidObjectId(bookId)) return fail(res, 404, "Item not found");

    const cart = await Cart.findOne({ user: req.userId });
    const item = cart?.items.find((i) => String(i.book) === String(bookId));
    if (!item) return fail(res, 404, "That book isn't in your cart");

    // Any field can be sent on its own: { quantity }, { printOptions }, { dedicationText }
    const { quantity, printOptions, dedicationText } = req.body;

    // Atomic $set (not cart.save()) so quick back-to-back updates can't clash
    const set = {};
    let dedicationOn = item.printOptions?.dedication === "added";

    if (printOptions !== undefined) {
      const parsed = parsePrintOptions(printOptions);
      if (parsed.error) return fail(res, 400, parsed.error);
      set["items.$.printOptions"] = parsed.options;
      dedicationOn = parsed.options.dedication === "added";
    }
    if (quantity !== undefined) {
      set["items.$.quantity"] = normalizeQuantity(quantity);
    }
    // the text only makes sense while the dedication add-on is on
    if (!dedicationOn) {
      set["items.$.dedicationText"] = "";
    } else if (dedicationText !== undefined) {
      set["items.$.dedicationText"] = cleanText(dedicationText, MAX_DEDICATION_LENGTH);
    }

    if (Object.keys(set).length) {
      await Cart.updateOne(
        { user: req.userId, "items.book": bookId },
        { $set: set },
      );
    }

    return await sendCart(res, req.userId);
  } catch (error) {
    console.error("updateCartItem error:", error);
    return fail(res, 500, "Unable to update your cart");
  }
};

export const updateGiftMessage = async (req, res) => {
  try {
    const giftMessage = cleanText(req.body.giftMessage, MAX_GIFT_MESSAGE_LENGTH);
    await Cart.findOneAndUpdate(
      { user: req.userId },
      { $set: { giftMessage } },
      { upsert: true },
    );
    return await sendCart(res, req.userId);
  } catch (error) {
    console.error("updateGiftMessage error:", error);
    return fail(res, 500, "Unable to save your gift message");
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { bookId } = req.params;
    if (mongoose.isValidObjectId(bookId)) {
      await Cart.updateOne({ user: req.userId }, { $pull: { items: { book: bookId } } });
    }
    return await sendCart(res, req.userId);
  } catch (error) {
    console.error("removeCartItem error:", error);
    return fail(res, 500, "Unable to remove this book from your cart");
  }
};

export const clearCart = async (req, res) => {
  try {
    await Cart.updateOne({ user: req.userId }, { $set: { items: [] } });
    return await sendCart(res, req.userId);
  } catch (error) {
    console.error("clearCart error:", error);
    return fail(res, 500, "Unable to clear your cart");
  }
};