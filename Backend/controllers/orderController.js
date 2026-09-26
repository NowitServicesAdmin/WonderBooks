import crypto from "crypto";
import mongoose from "mongoose";
import razorpay from "../config/razorpayClient.js";
import Order from "../models/order.js";
import Book from "../models/book.js";
import { getPrintPrice, PRINT_CURRENCY } from "../config/printPricing.js";

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
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  shippingAddress: order.shippingAddress,
  book: {
    _id: order.book,
    title: order.bookTitle,
    coverImageUrl: order.bookCoverImageUrl,
  },
});

export const initiateOrder = async (req, res) => {
  try {
    const { bookId, shippingAddress } = req.body;

    if (!bookId || !mongoose.isValidObjectId(bookId)) {
      return res
        .status(400)
        .json({ success: false, message: "A valid bookId is required" });
    }

    const addressError = validateAddress(shippingAddress);
    if (addressError) {
      return res.status(400).json({ success: false, message: addressError });
    }

    const book = await Book.findOne({ _id: bookId, user: req.userId }).lean();
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found" });
    }
    if (book.status !== "completed") {
      return res.status(400).json({
        success: false,
        message:
          "This book isn't finished yet - it can't be printed until it's complete",
      });
    }

    const amount = getPrintPrice(book);

    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: PRINT_CURRENCY,
      receipt: `print_${req.userId}_${Date.now()}`,
      notes: {
        userId: req.userId.toString(),
        bookId: book._id.toString(),
      },
    });

    return res.status(200).json({
      success: true,
      order: razorpayOrder,
      keyId: process.env.RAZORPAY_KEY,
      amount,
      currency: PRINT_CURRENCY,
    });
  } catch (error) {
    console.error("initiateOrder error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to start the order" });
  }
};

export const verifyOrder = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookId,
      shippingAddress,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Razorpay payment details" });
    }

    const addressError = validateAddress(shippingAddress);
    if (addressError) {
      return res.status(400).json({ success: false, message: addressError });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    const orderUserId = razorpayOrder.notes?.userId;
    const orderBookId = razorpayOrder.notes?.bookId;

    if (orderUserId !== req.userId.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Payment does not belong to this user",
        });
    }
    if (!orderBookId || (bookId && orderBookId !== bookId)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Book information not found in payment",
        });
    }

    const existing = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (existing) {
      return res
        .status(200)
        .json({ success: true, order: toClientOrder(existing) });
    }

    const book = await Book.findOne({
      _id: orderBookId,
      user: req.userId,
    }).lean();
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found" });
    }

    const amount = razorpayOrder.amount / 100;

    const order = await Order.create({
      user: req.userId,
      book: book._id,
      bookTitle: book.title,
      bookCoverImageUrl: book.coverImageUrl || null,
      orderNumber: generateOrderNumber(),
      shippingAddress,
      amount,
      currency: razorpayOrder.currency || PRINT_CURRENCY,
      status: "confirmed",
      paymentStatus: "paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    return res.status(201).json({ success: true, order: toClientOrder(order) });
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

    return res.json({ success: true, order: toClientOrder(order) });
  } catch (error) {
    console.error("cancelOrder error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to cancel this order" });
  }
};
