import crypto from "crypto";
import mongoose from "mongoose";
import razorpay from "../config/razorpayClient.js";
import Order from "../models/order.js";
import Book from "../models/book.js";
import Address from "../models/address.js";
import Cart from "../models/cart.js";
import { User } from "../models/user.js";
import {
  getCartTotals,
  getCheckoutTotals,
  getOrderTotals,
  normalizeQuantity,
  PRINT_CURRENCY,
} from "../config/printPricing.js";
import { loadBookSummaries, loadCartLines } from "../services/cartService.js";
import {
  decodePrintOptions,
  describePrintOptions,
  encodePrintOptions,
  normalizePrintOptions,
  snapshotPrintOptions,
} from "../config/printOptions.js";
import { notify } from "../services/alertService.js"; // ALERTS
import {
  getDeliveryQuote,
  createShipmentForOrders,
  refreshTracking,
  cancelShipmentIfUnused,
} from "../services/shipmentService.js";


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
  // older saved addresses have no country - they were all Indian numbers
  phoneCountry: address.phoneCountry || "IN",
  phoneCode: address.phoneCode || "91",
  phoneE164:
    address.phoneE164 ||
    `+${address.phoneCode || "91"}${String(address.phone || "").replace(/\D/g, "")}`,
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


const trackUrlFor = (awb) =>
  awb ? `https://shiprocket.co/tracking/${awb}` : null;

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
  printOptions: order.printOptions || snapshotPrintOptions(),
  printOptionLabels: describePrintOptions(order.printOptions),
  subtotal: order.subtotal ?? null,
  shippingFee: order.shippingFee || 0,
  gstPercent: order.gst || 0,
  gstAmount: order.gstAmount || 0,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  shippingAddress: order.shippingAddress,
  shipment: {
    status: order.shipping?.status || null,
    courierName: order.shipping?.courierName || null,
    awbCode: order.shipping?.awbCode || null,
    estimatedDeliveryDays: order.shipping?.estimatedDeliveryDays || null,
    estimatedDelivery: order.shipping?.estimatedDelivery || null,
    shiprocketStatus: order.shipping?.shiprocketStatus || null,
    trackUrl: trackUrlFor(order.shipping?.awbCode),
  },
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
  const book = await Book.findOne({ _id: bookId, user: userId, isDeleted: { $ne: true } }).lean();
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
      quote: getOrderTotals(book, req.query.quantity, normalizePrintOptions(req.query)),
    });
  } catch (error) {
    console.error("getOrderQuote error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load the order details" });
  }
};

// Lines to charge for: one book ("buy now") or the whole cart
const loadCheckoutLines = async ({ userId, bookId, quantity, printOptions }) => {
  if (bookId) {
    const { book, status, message } = await loadPrintableBook(bookId, userId);
    if (!book) return { status, message };
    return {
      lines: [
        {
          bookId: String(book._id),
          quantity,
          pageCount: book.pages?.length || 0,
          printOptions: normalizePrintOptions(printOptions),
        },
      ],
    };
  }

  const lines = await loadCartLines(userId);
  if (!lines.length) return { status: 400, message: "Your cart is empty" };
  return { lines };
};

const buildCheckoutQuote = async ({ userId, bookId, quantity, printOptions, addressId, shippingAddress }) => {
  const { shipping, error } = await resolveShippingAddress({
    userId,
    addressId,
    shippingAddress,
  });
  if (error) return { status: 400, message: error };

  const loaded = await loadCheckoutLines({ userId, bookId, quantity, printOptions });
  if (!loaded.lines) return loaded;

  const totals = getCartTotals(loaded.lines);

  const { quote, error: deliveryError } = await getDeliveryQuote({
  pincode: shipping.postalCode,
  copies: totals.itemCount,
  declaredValue: totals.subtotal,
});
  if (deliveryError) return { status: 400, message: deliveryError };

  return {
    shipping,
    totals,
    delivery: quote,
    checkout: getCheckoutTotals(totals.subtotal, quote.deliveryCharge),
  };
};

const NOTE_VALUE_LIMIT = 250;

const encodeItemNotes = (lines) => {
  const parts = lines.map(
    (line) => `${line.bookId}:${line.quantity}:${encodePrintOptions(line.printOptions)}`,
  );
  const chunks = [];
  let current = "";
  for (const part of parts) {
    const next = current ? `${current},${part}` : part;
    if (current && next.length > NOTE_VALUE_LIMIT) {
      chunks.push(current);
      current = part;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);

  return Object.fromEntries(
    chunks.map((chunk, index) => [index === 0 ? "items" : `items${index + 1}`, chunk]),
  );
};

const readItemNotes = (notes = {}) => {
  const chunks = [];
  for (let n = 1; ; n += 1) {
    const value = notes[n === 1 ? "items" : `items${n}`];
    if (!value) break;
    chunks.push(String(value));
  }
  return chunks.join(",");
};

const decodeItems = (notes = {}) => {
  const encoded = readItemNotes(notes);
  if (encoded) {
    return encoded
      .split(",")
      .map((part) => {
        const [bookId, qty, opts] = part.split(":");
        return {
          bookId,
          quantity: normalizeQuantity(qty),
          printOptions: decodePrintOptions(opts),
        };
      })
      .filter((item) => mongoose.isValidObjectId(item.bookId));
  }
  // Payments started before the cart existed carried a single book
  if (notes.bookId && mongoose.isValidObjectId(notes.bookId)) {
    return [
      {
        bookId: notes.bookId,
        quantity: normalizeQuantity(notes.quantity),
        printOptions: decodePrintOptions(),
      },
    ];
  }
  return [];
};

// POST /orders/initiate
//   { addressId }                  -> pays for everything in the user's cart
//   { addressId, bookId, quantity } -> pays for just that one book ("buy now")
// Delivery charge + GST are calculated HERE, never taken from the browser.
export const initiateOrder = async (req, res) => {
  try {
    const { bookId, addressId, shippingAddress, quantity, printOptions } = req.body;

    const result = await buildCheckoutQuote({
      userId: req.userId,
      bookId,
      quantity,
      printOptions,
      addressId,
      shippingAddress,
    });
    if (!result.checkout) {
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    }

    const { totals, delivery, checkout } = result;

    const razorpayOrder = await razorpay.orders.create({
      amount: checkout.total * 100, // paise
      currency: PRINT_CURRENCY,
      receipt: `print_${req.userId}_${Date.now()}`,
      notes: {
        userId: req.userId.toString(),
        ...encodeItemNotes(totals.lines),

        shippingFee: String(delivery.deliveryCharge), // what the customer pays
        baseRate: String(delivery.baseRate), // what Shiprocket charges us
        gstPercent: String(checkout.gstPercent),
        gstAmount: String(checkout.gstAmount),

        courierId: delivery.courierId,
        courierName: delivery.courierName,
        estimatedDeliveryDays: String(delivery.estimatedDeliveryDays || ""),

        weight: String(delivery.weight),
        length: String(delivery.length),
        breadth: String(delivery.breadth),
        height: String(delivery.height),
      },
    });

    return res.status(200).json({
      success: true,
      order: razorpayOrder,
      keyId: process.env.RAZORPAY_KEY,
      amount: checkout.total,
      currency: PRINT_CURRENCY,
      quantity: totals.itemCount,
    });
  } catch (error) {
    console.error("initiateOrder error:", error.response?.data || error);
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
    const notes = razorpayOrder.notes || {};

    const deliveryCharge = Number(notes.shippingFee) || 0;
    const baseRate = Number(notes.baseRate) || 0;
    const gstPercent = Number(notes.gstPercent) || 0;
    const gstAmount = Number(notes.gstAmount) || 0;

    const courierId = notes.courierId || null;
    const courierName = notes.courierName || null;
    const estimatedDeliveryDays = notes.estimatedDeliveryDays || null;

    const weight = Number(notes.weight) || 0.5;
    const length = Number(notes.length) || 10;
    const breadth = Number(notes.breadth) || 10;
    const height = Number(notes.height) || 10;

    const priced = getCartTotals(
      items.map((i) => ({
        bookId: i.bookId,
        quantity: i.quantity,
        pageCount: byId.get(i.bookId).pageCount,
        printOptions: i.printOptions,
      })),
    ).lines;

    // Delivery + GST are charged once, so they sit on the first order. The
    // first order also absorbs any rounding so the orders always add up to
    // what was actually charged.
    const othersTotal = priced
      .slice(1)
      .reduce((sum, l) => sum + l.lineTotal, 0);

    const docs = priced.map((line, index) => {
      const book = byId.get(line.bookId);
      const first = index === 0;
      return {
        user: req.userId,
        book: book._id,
        bookTitle: book.title,
        bookCoverImageUrl: book.coverImageUrl || null,
        orderNumber: generateOrderNumber(),
        shippingAddress: shipping,

        quantity: line.quantity,
        unitPrice: line.unitPrice,
        printOptions: snapshotPrintOptions(line.printOptions),
        subtotal: line.lineTotal,
        shippingFee: first ? deliveryCharge : 0,
        gst: gstPercent, // existing schema field holds the GST %
        gstAmount: first ? gstAmount : 0,
        amount: first ? paid - othersTotal : line.lineTotal,
        currency: razorpayOrder.currency || PRINT_CURRENCY,

        status: "confirmed",
        paymentStatus: "paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,

        shipping: {
          courierId,
          courierName,
          selectedCourier: courierName,
          selectedCourierId: courierId,
          shippingCharge: first ? deliveryCharge : 0, // paid by customer
          selectedRate: first ? baseRate : 0, // paid to Shiprocket
          estimatedDeliveryDays,
          weight,
          length,
          breadth,
          height,
          paymentMode: "Prepaid",
          status: "rate_selected",
        },
      };
    });

    const orders = await Order.create(docs);

    // ONE Shiprocket shipment for the whole payment: create order, assign
    // the fixed courier, generate AWB. Never throws (customer already paid).
    const buyer = await User.findById(req.userId).select("email").lean();
    await createShipmentForOrders(orders, { email: buyer?.email });

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

    await cancelShipmentIfUnused(order); // cancels at Shiprocket when the whole shipment is cancelled

    await notify.orderCancelled(req.userId, order); // ALERTS

    return res.json({ success: true, order: toClientOrder(order) });
  } catch (error) {
    console.error("cancelOrder error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to cancel this order" });
  }
};


/*
|--------------------------------------------------------------------------
| GET /orders/shipping-rates?addressId=...            (cart)
| GET /orders/shipping-rates?addressId=...&bookId=...&quantity=2   (buy now)
|--------------------------------------------------------------------------
| Returns delivery charge (Shiprocket rate + extra), estimated days, GST
| and the final total for the chosen address.
*/
export const getShippingRatesForOrder = async (req, res) => {
  try {
    const { addressId, bookId, quantity } = req.query;

    const result = await buildCheckoutQuote({
      userId: req.userId,
      bookId,
      quantity,
      addressId,
    });
    if (!result.checkout) {
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    }

    const { delivery, checkout } = result;

    return res.json({
      success: true,
      quote: {
        subtotal: checkout.subtotal,
        deliveryCharge: checkout.deliveryCharge,
        estimatedDeliveryDays: delivery.estimatedDeliveryDays,
        etd: delivery.etd,
        gstPercent: checkout.gstPercent,
        gstAmount: checkout.gstAmount,
        total: checkout.total,
        currency: checkout.currency,
      },
    });
  } catch (error) {
    console.error("getShippingRatesForOrder error:", error.response?.data || error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to calculate delivery charges" });
  }
};

/*
|--------------------------------------------------------------------------
| GET /orders/:orderId/tracking
|--------------------------------------------------------------------------
| Refreshes from Shiprocket (live mode) and returns status + scan history.
| If Shiprocket is unreachable we still return what we have saved.
*/
export const getOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    let order = await Order.findOne({ _id: orderId, user: req.userId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    let activities = [];
    if (order.shipping?.awbCode) {
      try {
        ({ activities } = await refreshTracking(order.shipping.awbCode));
        order = await Order.findById(order._id);
      } catch (trackError) {
        console.error("refreshTracking error:", trackError.response?.data || trackError.message);
      }
    }

    return res.json({
      success: true,
      order: toClientOrder(order),
      shipment: toClientOrder(order).shipment,
      activities,
    });
  } catch (error) {
    console.error("getOrderTracking error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load tracking" });
  }
};