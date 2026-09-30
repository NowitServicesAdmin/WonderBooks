import mongoose from "mongoose";
import Alert from "../models/Alert.js";
import { User } from "../models/user.js";
import { createAlertForAllUsers } from "../services/alertService.js";

// GET /api/alerts?page=1&limit=20&unreadOnly=true
export const getMyAlerts = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
        const filter = { user: req.userId };
        if (req.query.unreadOnly === "true") filter.isRead = false;

        const [alerts, total, unreadCount] = await Promise.all([
            Alert.find(filter)
                .select("-dedupeKey -expiresAt -__v")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Alert.countDocuments(filter),
            Alert.countDocuments({ user: req.userId, isRead: false }),
        ]);

        return res.json({
            success: true,
            alerts,
            unreadCount,
            pagination: { page, limit, total, hasMore: page * limit < total },
        });
    } catch (error) {
        console.error("Get alerts error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch alerts" });
    }
};

// GET /api/alerts/unread-count  (for the bell badge)
export const getUnreadCount = async (req, res) => {
    try {
        const unreadCount = await Alert.countDocuments({ user: req.userId, isRead: false });
        return res.json({ success: true, unreadCount });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch count" });
    }
};

// PATCH /api/alerts/:alertId/read
export const markAlertRead = async (req, res) => {
    try {
        const { alertId } = req.params;
        if (!mongoose.isValidObjectId(alertId)) {
            return res.status(404).json({ success: false, message: "Alert not found" });
        }

        const alert = await Alert.findOneAndUpdate(
            { _id: alertId, user: req.userId },
            { $set: { isRead: true, readAt: new Date() } },
            { new: true }
        ).lean();

        if (!alert) {
            return res.status(404).json({ success: false, message: "Alert not found" });
        }
        return res.json({ success: true, alert });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to update alert" });
    }
};

// PATCH /api/alerts/read-all
export const markAllAlertsRead = async (req, res) => {
    try {
        const result = await Alert.updateMany(
            { user: req.userId, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );
        return res.json({ success: true, updated: result.modifiedCount });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to update alerts" });
    }
};

// DELETE /api/alerts/:alertId
export const deleteAlert = async (req, res) => {
    try {
        const { alertId } = req.params;
        if (!mongoose.isValidObjectId(alertId)) {
            return res.status(404).json({ success: false, message: "Alert not found" });
        }
        const result = await Alert.deleteOne({ _id: alertId, user: req.userId });
        if (!result.deletedCount) {
            return res.status(404).json({ success: false, message: "Alert not found" });
        }
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to delete alert" });
    }
};

// DELETE /api/alerts
export const clearMyAlerts = async (req, res) => {
    try {
        const result = await Alert.deleteMany({ user: req.userId });
        return res.json({ success: true, deleted: result.deletedCount });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to clear alerts" });
    }
};

// POST /api/alerts/broadcast   (super admin only) -> alert for ALL users
export const broadcastAlert = async (req, res) => {
    try {
        const admin = await User.findById(req.userId).select("role").lean();
        if (admin?.role !== "super admin") {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        const { title, message, severity, link } = req.body;
        if (!title?.trim()) {
            return res.status(400).json({ success: false, message: "Title is required" });
        }

        const sent = await createAlertForAllUsers({
            title: title.trim().slice(0, 120),
            message: (message || "").trim().slice(0, 500),
            severity: ["info", "success", "warning", "error"].includes(severity) ? severity : "info",
            link: link || null,
        });

        return res.json({ success: true, sent });
    } catch (error) {
        console.error("Broadcast error:", error);
        return res.status(500).json({ success: false, message: "Failed to broadcast" });
    }
};