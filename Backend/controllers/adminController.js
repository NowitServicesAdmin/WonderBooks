import mongoose from "mongoose";
import { User } from "../models/user.js";
import Book from "../models/book.js";
import Order from "../models/order.js";
import { schedulePickupForOrder, cancelShipmentIfUnused } from "../services/shipmentService.js";
import Subscription from "../models/subscription.js";
import { deleteFromS3, normalizeS3Url } from "../services/s3Service.js";

const ORDER_STATUSES = ["pending_payment", "confirmed", "printing", "shipped", "delivered", "cancelled"];
const ADMIN_SETTABLE_ORDER_STATUSES = ["confirmed", "printing", "shipped", "delivered", "cancelled"];
const ROLES = ["user", "super admin"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePaging = (query, defaultLimit = 10) => {
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit) || defaultLimit, 1), 100);
    return { page, limit, skip: (page - 1) * limit };
};

const userCode = (id) => `U${String(id).slice(-6).toUpperCase()}`;
const bookCode = (id) => `B${String(id).slice(-6).toUpperCase()}`;

const userStatus = (u) => {
    if (u.isBlocked) return "Blocked";
    if (!u.isVerified) return "Pending";
    return "Active";
};

const toAdminUser = (u, extras = {}) => ({
    _id: u._id,
    code: userCode(u._id),
    name: u.name || "",
    email: u.email,
    role: u.role,
    status: userStatus(u),
    isBlocked: Boolean(u.isBlocked),
    isVerified: Boolean(u.isVerified),
    avatarUrl: normalizeS3Url(u.avatarUrl) || null,
    joinedAt: u.createdAt,
    ...extras,
});

const percentChange = (current, previous) => {
    if (!previous) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
};

const monthBounds = (offset = 0) => {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset + 1, 1));
    return { start, end };
};

const countInRange = (Model, field, range, extra = {}) =>
    Model.countDocuments({ ...extra, [field]: { $gte: range.start, $lt: range.end } });

export const getDashboardStats = async (req, res) => {
    try {
        const thisMonth = monthBounds(0);
        const lastMonth = monthBounds(-1);
        const now = new Date();

        const userFilter = { role: "user" };
        const paidOrder = { paymentStatus: "paid" };
        const activeSub = { status: "active", endDate: { $gt: now } };

        const [
            totalUsers,
            usersThis,
            usersLast,
            totalBooks,
            booksThis,
            booksLast,
            totalOrders,
            ordersThis,
            ordersLast,
            activeSubs,
            subsThis,
            subsLast,
            recentUsers,
            recentOrders,
            recentSubs,
        ] = await Promise.all([
            User.countDocuments(userFilter),
            countInRange(User, "createdAt", thisMonth, userFilter),
            countInRange(User, "createdAt", lastMonth, userFilter),
            Book.countDocuments({}),
            countInRange(Book, "createdAt", thisMonth),
            countInRange(Book, "createdAt", lastMonth),
            Order.countDocuments(paidOrder),
            countInRange(Order, "createdAt", thisMonth, paidOrder),
            countInRange(Order, "createdAt", lastMonth, paidOrder),
            Subscription.countDocuments(activeSub),
            countInRange(Subscription, "createdAt", thisMonth, activeSub),
            countInRange(Subscription, "createdAt", lastMonth, activeSub),
            User.find(userFilter).sort({ createdAt: -1 }).limit(5).select("name email createdAt").lean(),
            Order.find({ paymentStatus: "paid" }).sort({ createdAt: -1 }).limit(5).select("bookTitle createdAt").lean(),
            Subscription.find({ status: "active" })
                .sort({ updatedAt: -1 })
                .limit(5)
                .select("planDisplayName planName updatedAt")
                .lean(),
        ]);

        const activity = [
            ...recentUsers.map((u) => ({
                type: "user",
                title: "New user registered",
                detail: u.email,
                at: u.createdAt,
            })),
            ...recentOrders.map((o) => ({
                type: "order",
                title: "Book ordered",
                detail: o.bookTitle,
                at: o.createdAt,
            })),
            ...recentSubs.map((s) => ({
                type: "subscription",
                title: "Subscription activated",
                detail: s.planDisplayName || s.planName,
                at: s.updatedAt,
            })),
        ]
            .sort((a, b) => new Date(b.at) - new Date(a.at))
            .slice(0, 8);

        res.json({
            success: true,
            stats: {
                totalUsers: { value: totalUsers, change: percentChange(usersThis, usersLast) },
                totalBooks: { value: totalBooks, change: percentChange(booksThis, booksLast) },
                booksOrdered: { value: totalOrders, change: percentChange(ordersThis, ordersLast) },
                activeSubscriptions: { value: activeSubs, change: percentChange(subsThis, subsLast) },
            },
            activity,
        });
    } catch (err) {
        console.error("getDashboardStats error:", err);
        res.status(500).json({ success: false, message: "Failed to load dashboard stats" });
    }
};

export const getDashboardSeries = async (req, res) => {
    try {
        const { metric = "users", month } = req.query;
        if (!["users", "orders"].includes(metric)) {
            return res.status(400).json({ success: false, message: "metric must be users or orders" });
        }

        const match = /^(\d{4})-(\d{2})$/.exec(month || "");
        const now = new Date();
        const year = match ? Number(match[1]) : now.getUTCFullYear();
        const monthIndex = match ? Number(match[2]) - 1 : now.getUTCMonth();
        if (monthIndex < 0 || monthIndex > 11) {
            return res.status(400).json({ success: false, message: "Invalid month" });
        }

        const start = new Date(Date.UTC(year, monthIndex, 1));
        const end = new Date(Date.UTC(year, monthIndex + 1, 1));
        const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

        const Model = metric === "users" ? User : Order;
        const baseFilter = metric === "users" ? { role: "user" } : { paymentStatus: "paid" };

        const daily = await Model.aggregate([
            { $match: { ...baseFilter, createdAt: { $gte: start, $lt: end } } },
            { $group: { _id: { $dayOfMonth: "$createdAt" }, count: { $sum: 1 } } },
        ]);
        const byDay = new Map(daily.map((d) => [d._id, d.count]));

        let running = metric === "users" ? await User.countDocuments({ ...baseFilter, createdAt: { $lt: start } }) : 0;

        const points = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const count = byDay.get(day) || 0;
            if (metric === "users") {
                running += count;
                points.push({ date: String(day), value: running });
            } else {
                points.push({ date: String(day), value: count });
            }
        }

        res.json({ success: true, metric, month: `${year}-${String(monthIndex + 1).padStart(2, "0")}`, points });
    } catch (err) {
        console.error("getDashboardSeries error:", err);
        res.status(500).json({ success: false, message: "Failed to load chart data" });
    }
};

export const listUsers = async (req, res) => {
    try {
        const { page, limit, skip } = parsePaging(req.query);
        const filter = {};

        const status = String(req.query.status || "").toLowerCase();
        if (status === "blocked") filter.isBlocked = true;
        else if (status === "pending") Object.assign(filter, { isBlocked: { $ne: true }, isVerified: false });
        else if (status === "active") Object.assign(filter, { isBlocked: { $ne: true }, isVerified: true });

        if (ROLES.includes(req.query.role)) filter.role = req.query.role;

        const search = String(req.query.search || "").trim();
        if (search) {
            const rx = new RegExp(escapeRegex(search), "i");
            const or = [{ name: rx }, { email: rx }];
            if (mongoose.isValidObjectId(search)) or.push({ _id: search });
            const codeMatch = /^u?([0-9a-f]{4,24})$/i.exec(search);
            if (codeMatch) {
                or.push({
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$_id" },
                            regex: `${escapeRegex(codeMatch[1])}$`,
                            options: "i",
                        },
                    },
                });
            }
            filter.$or = or;
        }

        const [users, total] = await Promise.all([
            User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            User.countDocuments(filter),
        ]);

        const ids = users.map((u) => u._id);
        const [bookCounts, subs] = await Promise.all([
            Book.aggregate([
                { $match: { user: { $in: ids } } },
                { $group: { _id: "$user", count: { $sum: 1 } } },
            ]),
            Subscription.find({ userId: { $in: ids } })
                .select("userId planName planDisplayName status endDate")
                .lean(),
        ]);
        const bookMap = new Map(bookCounts.map((b) => [String(b._id), b.count]));
        const subMap = new Map(subs.map((s) => [String(s.userId), s]));

        res.json({
            success: true,
            users: users.map((u) => {
                const sub = subMap.get(String(u._id));
                const active = sub && sub.status === "active" && sub.endDate && new Date(sub.endDate) > new Date();
                return toAdminUser(u, {
                    booksCount: bookMap.get(String(u._id)) || 0,
                    plan: active ? sub.planDisplayName || sub.planName : null,
                });
            }),
            total,
            page,
            pages: Math.ceil(total / limit) || 1,
            limit,
        });
    } catch (err) {
        console.error("listUsers error:", err);
        res.status(500).json({ success: false, message: "Failed to load users" });
    }
};

export const getUserDetail = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const user = await User.findById(id).lean();
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const [booksCount, ordersCount, subscription, recentBooks] = await Promise.all([
            Book.countDocuments({ user: id }),
            Order.countDocuments({ user: id, status: { $ne: "pending_payment" } }),
            Subscription.findOne({ userId: id }).lean(),
            Book.find({ user: id }).sort({ createdAt: -1 }).limit(5).select("title status createdAt").lean(),
        ]);

        res.json({
            success: true,
            user: toAdminUser(user, {
                about: user.about || "",
                language: user.language,
                ageGroup: user.ageGroup,
                booksCount,
                ordersCount,
            }),
            subscription: subscription
                ? {
                      planName: subscription.planDisplayName || subscription.planName,
                      billingCycle: subscription.billingCycle,
                      status: subscription.status,
                      startDate: subscription.startDate,
                      endDate: subscription.endDate,
                      cancelRequested: subscription.cancelRequested,
                  }
                : null,
            recentBooks,
        });
    } catch (err) {
        console.error("getUserDetail error:", err);
        res.status(500).json({ success: false, message: "Failed to load user" });
    }
};

export const createUser = async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const role = req.body.role || "user";

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ success: false, message: "A valid email address is required" });
        }
        if (!ROLES.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }
        if (await User.findOne({ email })) {
            return res.status(409).json({ success: false, message: "A user with this email already exists" });
        }

        const user = await User.create({ name, email, role, isVerified: true });
        res.status(201).json({ success: true, user: toAdminUser(user.toObject()) });
    } catch (err) {
        console.error("createUser error:", err);
        res.status(500).json({ success: false, message: "Failed to create user" });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const { name, email, role } = req.body;

        if (name !== undefined) user.name = String(name).trim();

        if (email !== undefined) {
            const normalized = String(email).trim().toLowerCase();
            if (!EMAIL_REGEX.test(normalized)) {
                return res.status(400).json({ success: false, message: "A valid email address is required" });
            }
            if (normalized !== user.email) {
                const clash = await User.findOne({ email: normalized, _id: { $ne: user._id } });
                if (clash) {
                    return res.status(409).json({ success: false, message: "That email is already in use" });
                }
                user.email = normalized;
            }
        }

        if (role !== undefined) {
            if (!ROLES.includes(role)) {
                return res.status(400).json({ success: false, message: "Invalid role" });
            }
            if (String(user._id) === String(req.user._id) && role !== user.role) {
                return res.status(400).json({ success: false, message: "You can't change your own role" });
            }
            user.role = role;
        }

        await user.save();
        res.json({ success: true, user: toAdminUser(user.toObject()) });
    } catch (err) {
        console.error("updateUser error:", err);
        res.status(500).json({ success: false, message: "Failed to update user" });
    }
};

export const setUserBlocked = async (req, res) => {
    try {
        const { id } = req.params;
        const { blocked } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (typeof blocked !== "boolean") {
            return res.status(400).json({ success: false, message: "blocked must be true or false" });
        }
        if (String(id) === String(req.user._id)) {
            return res.status(400).json({ success: false, message: "You can't block your own account" });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.isBlocked = blocked;
        user.blockedAt = blocked ? new Date() : null;
        await user.save();

        res.json({ success: true, user: toAdminUser(user.toObject()) });
    } catch (err) {
        console.error("setUserBlocked error:", err);
        res.status(500).json({ success: false, message: "Failed to update user status" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (String(id) === String(req.user._id)) {
            return res.status(400).json({ success: false, message: "You can't delete your own account here" });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const { avatarStorageKey, avatarStorageProvider } = user;

        await Promise.all([
            Book.deleteMany({ user: user._id }),
            Subscription.deleteMany({ userId: user._id }),
            User.findByIdAndDelete(user._id),
        ]);

        if (avatarStorageKey && avatarStorageProvider === "s3") {
            deleteFromS3(avatarStorageKey).catch((e) => console.error("Avatar cleanup failed:", e));
        }

        res.json({ success: true, message: "User deleted" });
    } catch (err) {
        console.error("deleteUser error:", err);
        res.status(500).json({ success: false, message: "Failed to delete user" });
    }
};

export const listBooks = async (req, res) => {
    try {
        const { page, limit, skip } = parsePaging(req.query);
        const filter = {};

        if (["generating", "completed", "failed"].includes(req.query.status)) {
            filter.status = req.query.status;
        }
        if (["ai", "manual"].includes(req.query.mode)) filter.mode = req.query.mode;

        const search = String(req.query.search || "").trim();
        if (search) {
            const rx = new RegExp(escapeRegex(search), "i");
            const or = [{ title: rx }];

            const matchedUsers = await User.find({ $or: [{ email: rx }, { name: rx }] })
                .select("_id")
                .limit(200)
                .lean();
            if (matchedUsers.length) or.push({ user: { $in: matchedUsers.map((u) => u._id) } });

            if (mongoose.isValidObjectId(search)) or.push({ _id: search });
            const codeMatch = /^b?([0-9a-f]{4,24})$/i.exec(search);
            if (codeMatch) {
                or.push({
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$_id" },
                            regex: `${escapeRegex(codeMatch[1])}$`,
                            options: "i",
                        },
                    },
                });
            }
            filter.$or = or;
        }

        const [books, total] = await Promise.all([
            Book.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("title mode status coverImageUrl user createdAt completedAt pages.status")
                .populate("user", "name email")
                .lean(),
            Book.countDocuments(filter),
        ]);

        res.json({
            success: true,
            books: books.map((b) => ({
                _id: b._id,
                code: bookCode(b._id),
                title: b.title,
                mode: b.mode,
                status: b.status,
                coverImageUrl: normalizeS3Url(b.coverImageUrl) || null,
                pagesCount: b.pages?.length || 0,
                createdBy: b.user ? { _id: b.user._id, name: b.user.name || "", email: b.user.email } : null,
                createdAt: b.createdAt,
                completedAt: b.completedAt,
            })),
            total,
            page,
            pages: Math.ceil(total / limit) || 1,
            limit,
        });
    } catch (err) {
        console.error("listBooks error:", err);
        res.status(500).json({ success: false, message: "Failed to load books" });
    }
};

const toAdminOrder = (o) => ({
    _id: o._id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    amount: o.amount,
    currency: o.currency,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    cancelReason: o.cancelReason || "",
    shippingAddress: o.shippingAddress,
    book: { _id: o.book, title: o.bookTitle, coverImageUrl: o.bookCoverImageUrl },
    user: o.user && o.user._id ? { _id: o.user._id, name: o.user.name || "", email: o.user.email } : null,
});

export const listOrders = async (req, res) => {
    try {
        const { page, limit, skip } = parsePaging(req.query);
        const filter = {};

        if (ORDER_STATUSES.includes(req.query.status)) filter.status = req.query.status;
        else filter.status = { $ne: "pending_payment" };

        const search = String(req.query.search || "").trim();
        if (search) {
            const rx = new RegExp(escapeRegex(search), "i");
            const matchedUsers = await User.find({ $or: [{ email: rx }, { name: rx }] })
                .select("_id")
                .limit(200)
                .lean();
            filter.$or = [
                { orderNumber: rx },
                { bookTitle: rx },
                { "shippingAddress.name": rx },
                ...(matchedUsers.length ? [{ user: { $in: matchedUsers.map((u) => u._id) } }] : []),
            ];
        }

        const [orders, total, revenueAgg] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("user", "name email")
                .lean(),
            Order.countDocuments(filter),
            Order.aggregate([
                { $match: { paymentStatus: "paid", status: { $ne: "cancelled" } } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
        ]);

        res.json({
            success: true,
            orders: orders.map(toAdminOrder),
            total,
            page,
            pages: Math.ceil(total / limit) || 1,
            limit,
            revenue: revenueAgg[0]?.total || 0,
        });
    } catch (err) {
        console.error("listOrders error:", err);
        res.status(500).json({ success: false, message: "Failed to load orders" });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (!ADMIN_SETTABLE_ORDER_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `status must be one of: ${ADMIN_SETTABLE_ORDER_STATUSES.join(", ")}`,
            });
        }

        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        if (order.paymentStatus !== "paid" && status !== "cancelled") {
            return res.status(400).json({ success: false, message: "This order hasn't been paid yet" });
        }
        if (order.status === "delivered" && status !== "delivered") {
            return res.status(400).json({ success: false, message: "Delivered orders can't be changed" });
        }
        if (order.status === "cancelled" && status !== "cancelled") {
            return res.status(400).json({ success: false, message: "Cancelled orders can't be reopened" });
        }

        order.status = status;
        if (status === "cancelled") {
            order.cancelledAt = order.cancelledAt || new Date();
            order.cancelReason = String(reason || order.cancelReason || "Cancelled by admin").slice(0, 300);
        }
        await order.save();

        if (status === "cancelled") await cancelShipmentIfUnused(order);

        // Book is printed and handed over -> ask Shiprocket's courier to pick it up
        if (status === "shipped") {
            try {
                await schedulePickupForOrder(order);
            } catch (pickupError) {
                console.error("schedulePickup error:", pickupError.response?.data || pickupError.message);
            }
        }

        await order.populate("user", "name email");
        res.json({ success: true, order: toAdminOrder(order.toObject()) });
    } catch (err) {
        console.error("updateOrderStatus error:", err);
        res.status(500).json({ success: false, message: "Failed to update order" });
    }
};