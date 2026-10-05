import crypto from "crypto";
import mongoose from "mongoose";
import razorpay from "../config/razorpayClient.js";
import Order from "../models/order.js";
import Book from "../models/book.js";
import Address from "../models/address.js";
import Cart from "../models/cart.js";
import {
  getCartTotals,
  getOrderTotals,
  normalizeQuantity,
  PRINT_CURRENCY,
} from "../config/printPricing.js";
import { loadBookSummaries, loadCartLines } from "../services/cartService.js";
import { notify } from "../services/alertService.js"; // ALERTS

const REQUIRED_ADDRESS_FIELDS = [
  "name",
  "phone",
  "line1",
  "city",
  "state",
  "postalCode",
];

const validateAddress = (address) => {
  if (!address || typeof address !== "object")
    return "Shipping address is required";
  for (const field of REQUIRED_ADDRESS_FIELDS) {
    if (!String(address[field] || "").trim()) {
      return `Shipping address is missing "${field}"`;
    }
  }
  return null;
};

// Google's formatted address already ends with city, state, pincode and country.
// Drop those trailing parts so the order's line1 doesn't repeat them.
const streetPart = (address) => {
  const parts = String(address.formattedAddress || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const tails = [address.country, address.state, address.city, address.pincode]
    .map((value) =>
      String(value || "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);

  while (parts.length > 1) {
    const last = parts[parts.length - 1].toLowerCase();
    const isTail =
      tails.includes(last) ||
      tails.some((tail) => last.includes(tail) && /\d/.test(tail));
    if (!isTail) break;
    parts.pop();
  }
  return parts.join(", ");
};

// Saved address -> the shipping snapshot stored on an order
const addressToShipping = (address) => ({
  name: address.fullName,
  phone: address.phone,
  line1: [address.doorNo, streetPart(address)].filter(Boolean).join(", "),
  line2: address.landmark ? `Near ${address.landmark}` : "",
  city: address.city,
  state: address.state,
  postalCode: address.pincode,
  country: address.country || "India",
  addressType: address.addressType || "",
  landmark: address.landmark || "",
  latitude: address.latitude ?? null,
  longitude: address.longitude ?? null,
  placeId: address.placeId || "",
});

// The cart page sends a saved addressId. A typed-in shippingAddress object
// is still accepted so older callers keep working.
const resolveShippingAddress = async ({
  userId,
  addressId,
  shippingAddress,
}) => {
  if (addressId) {
    if (!mongoose.isValidObjectId(addressId)) {
      return { error: "Please choose a delivery address" };
    }
    const saved = await Address.findOne({
      _id: addressId,
      user: userId,
    }).lean();
    if (!saved) return { error: "That delivery address wasn't found" };
    return { shipping: addressToShipping(saved) };
  }

  const error = validateAddress(shippingAddress);
  if (error) return { error };
  return { shipping: shippingAddress };
};

const generateOrderNumber = () => {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate(),
  ).padStart(2, "0")}`;
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `WB-ORD-${stamp}-${random}`;
};

const toClientOrder = (order) => ({
  _id: order._id,
  orderNumber: order.orderNumber,
  status: order.status,
  statusStep:
    order.status === "cancelled"
      ? -1
      : ({ confirmed: 0, printing: 1, shipped: 2, delivered: 3 }[
          order.status
        ] ?? -1),
  paymentStatus: order.paymentStatus,
  amount: order.amount,
  currency: order.currency,
  quantity: order.quantity || 1,
  unitPrice: order.unitPrice ?? null,
  shippingFee: order.shippingFee || 0,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  shippingAddress: order.shippingAddress,
  book: {
    _id: order.book,
    title: order.bookTitle,
    coverImageUrl: order.bookCoverImageUrl,
  },
});

// Loads a finished book that belongs to the user, or explains why not
const loadPrintableBook = async (bookId, userId) => {
  if (!bookId || !mongoose.isValidObjectId(bookId)) {
    return { status: 400, message: "A valid bookId is required" };
  }
  const book = await Book.findOne({ _id: bookId, user: userId }).lean();
  if (!book) return { status: 404, message: "Book not found" };
  if (book.status !== "completed") {
    return {
      status: 400,
      message:
        "This book isn't finished yet - it can't be printed until it's complete",
    };
  }
  return { book };
};

// GET /orders/quote/:bookId?quantity=2 - prices shown on the cart page
export const getOrderQuote = async (req, res) => {
  try {
    const { book, status, message } = await loadPrintableBook(
      req.params.bookId,
      req.userId,
    );
    if (!book) return res.status(status).json({ success: false, message });

    return res.json({
      success: true,
      book: {
        _id: book._id,
        title: book.title,
        coverImageUrl: book.coverImageUrl || null,
      },
      quote: getOrderTotals(book, req.query.quantity),
    });
  } catch (error) {
    console.error("getOrderQuote error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load the order details" });
  }
};

// "bookId:qty,bookId:qty" - what a Razorpay order carries about its items
const encodeItems = (lines) =>
  lines.map((line) => `${line.bookId}:${line.quantity}`).join(",");

const decodeItems = (notes = {}) => {
  if (notes.items) {
    return String(notes.items)
      .split(",")
      .map((part) => {
        const [bookId, qty] = part.split(":");
        return { bookId, quantity: normalizeQuantity(qty) };
      })
      .filter((item) => mongoose.isValidObjectId(item.bookId));
  }
  // Payments started before the cart existed carried a single book
  if (notes.bookId && mongoose.isValidObjectId(notes.bookId)) {
    return [
      { bookId: notes.bookId, quantity: normalizeQuantity(notes.quantity) },
    ];
  }
  return [];
};

// POST /orders/initiate
//   { addressId }                  -> pays for everything in the user's cart
//   { addressId, bookId, quantity } -> pays for just that one book ("buy now")
export const initiateOrder = async (req, res) => {
  try {
    const { bookId, addressId, shippingAddress } = req.body;

    const { error: addressError } = await resolveShippingAddress({
      userId: req.userId,
      addressId,
      shippingAddress,
    });
    if (addressError) {
      return res.status(400).json({ success: false, message: addressError });
    }

    let lines;
    if (bookId) {
      const { book, status, message } = await loadPrintableBook(
        bookId,
        req.userId,
      );
      if (!book) return res.status(status).json({ success: false, message });
      lines = [
        {
          bookId: String(book._id),
          quantity: req.body.quantity,
          pageCount: book.pages?.length || 0,
        },
      ];
    } else {
      lines = await loadCartLines(req.userId);
      if (!lines.length) {
        return res
          .status(400)
          .json({ success: false, message: "Your cart is empty" });
      }
    }

    const totals = getCartTotals(lines);

    const razorpayOrder = await razorpay.orders.create({
      amount: totals.total * 100, // paise
      currency: PRINT_CURRENCY,
      receipt: `print_${req.userId}_${Date.now()}`,
      notes: {
        userId: req.userId.toString(),
        items: encodeItems(totals.lines),
        shippingFee: String(totals.shippingFee),
      },
    });

    return res.status(200).json({
      success: true,
      order: razorpayOrder,
      keyId: process.env.RAZORPAY_KEY,
      amount: totals.total,
      currency: PRINT_CURRENCY,
      quantity: totals.itemCount,
    });
  } catch (error) {
    console.error("initiateOrder error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to start the order" });
  }
};

// One payment can cover several books. Each book becomes its own order
// (so it can be printed, shipped and tracked separately); they all share
// the Razorpay payment.
export const verifyOrder = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookId,
      addressId,
      shippingAddress,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Razorpay payment details" });
    }

    const { shipping, error: addressError } = await resolveShippingAddress({
      userId: req.userId,
      addressId,
      shippingAddress,
    });
    if (addressError) {
      return res.status(400).json({ success: false, message: addressError });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await notify.paymentFailed(req.userId, bookId); // ALERTS
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);

    if (razorpayOrder.notes?.userId !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Payment does not belong to this user",
      });
    }

    const items = decodeItems(razorpayOrder.notes);
    if (!items.length || (bookId && !items.some((i) => i.bookId === bookId))) {
      return res.status(400).json({
        success: false,
        message: "Book information not found in payment",
      });
    }

    const existing = await Order.find({
      razorpayOrderId: razorpay_order_id,
    }).sort({ createdAt: 1 });
    if (existing.length) {
      // Already confirmed earlier (and already alerted), so no alert here.
      return res.status(200).json({
        success: true,
        order: toClientOrder(existing[0]),
        orders: existing.map(toClientOrder),
      });
    }

    const summaries = await loadBookSummaries(
      req.userId,
      items.map((i) => i.bookId),
      { completedOnly: false },
    );
    const byId = new Map(summaries.map((b) => [String(b._id), b]));
    if (items.some((i) => !byId.has(i.bookId))) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found" });
    }

    const paid = razorpayOrder.amount / 100;
    const shippingFee = Number(razorpayOrder.notes?.shippingFee) || 0;
    const priced = getCartTotals(
      items.map((i) => ({
        bookId: i.bookId,
        quantity: i.quantity,
        pageCount: byId.get(i.bookId).pageCount,
      })),
    ).lines;

    // Delivery is charged once, so it sits on the first order. The first
    // order also absorbs any rounding so the orders always add up to what
    // was actually charged.
    const othersTotal = priced
      .slice(1)
      .reduce((sum, l) => sum + l.lineTotal, 0);

    const docs = priced.map((line, index) => {
      const book = byId.get(line.bookId);
      return {
        user: req.userId,
        book: book._id,
        bookTitle: book.title,
        bookCoverImageUrl: book.coverImageUrl || null,
        orderNumber: generateOrderNumber(),
        shippingAddress: shipping,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        shippingFee: index === 0 ? shippingFee : 0,
        amount: index === 0 ? paid - othersTotal : line.lineTotal,
        currency: razorpayOrder.currency || PRINT_CURRENCY,
        status: "confirmed",
        paymentStatus: "paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      };
    });

    const orders = await Order.create(docs);

    // These books are paid for, so take them out of the cart
    await Cart.updateOne(
      { user: req.userId },
      { $pull: { items: { book: { $in: orders.map((o) => o.book) } } } },
    );

    for (const order of orders) {
      await notify.orderConfirmed(req.userId, order); // ALERTS
    }

    return res.status(201).json({
      success: true,
      order: toClientOrder(orders[0]),
      orders: orders.map(toClientOrder),
    });
  } catch (error) {
    console.error("verifyOrder error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to confirm the order" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, orders: orders.map(toClientOrder) });
  } catch (error) {
    console.error("getMyOrders error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load your orders" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.userId,
    }).lean();
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    return res.json({ success: true, order: toClientOrder(order) });
  } catch (error) {
    console.error("getOrderById error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load this order" });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason = "" } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const order = await Order.findOne({ _id: orderId, user: req.userId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (!["confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "This order can no longer be cancelled",
      });
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    await order.save();

    await notify.orderCancelled(req.userId, order); // ALERTS

    return res.json({ success: true, order: toClientOrder(order) });
  } catch (error) {
    console.error("cancelOrder error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to cancel this order" });
  }
};
