import Alert from "../models/Alert.js";
import { User } from "../models/user.js"; // adjust path/export to your project

/** Create one alert for one user. Never throws. */
export const createAlert = async ({
    userId,
    type,
    severity = "info",
    title,
    message = "",
    link = null,
    meta = {},
    dedupeKey,
}) => {
    try {
        if (!userId) return null;

        return await Alert.create({
            user: userId,
            type,
            severity,
            title,
            message,
            link,
            meta,
            ...(dedupeKey ? { dedupeKey } : {}),
        });
    } catch (error) {
        if (error?.code === 11000) return null; // duplicate, already created
        console.error("createAlert failed:", error);
        return null;
    }
};

/** Same alert to a list of users. */
export const createAlertForUsers = async (userIds = [], payload) => {
    try {
        if (!userIds.length) return 0;
        const docs = userIds.map((id) => ({ ...payload, user: id }));
        const result = await Alert.insertMany(docs, { ordered: false });
        return result.length;
    } catch (error) {
        console.error("createAlertForUsers failed:", error);
        return 0;
    }
};

/** Same alert to ALL users (announcements). Batched so it scales. */
export const createAlertForAllUsers = async ({
    type = "announcement",
    severity = "info",
    title,
    message = "",
    link = null,
    meta = {},
}) => {
    let total = 0;
    let batch = [];

    const flush = async () => {
        if (!batch.length) return;
        try {
            await Alert.insertMany(batch, { ordered: false });
            total += batch.length;
        } catch (error) {
            console.error("Broadcast batch failed:", error);
        }
        batch = [];
    };

    try {
        const cursor = User.find({ isVerified: true }).select("_id").cursor();

        for await (const u of cursor) {
            batch.push({
                user: u._id,
                type,
                severity,
                title,
                message,
                link,
                meta,
                isBroadcast: true,
            });
            if (batch.length >= 500) await flush();
        }
        await flush();
    } catch (error) {
        console.error("createAlertForAllUsers failed:", error);
    }

    return total;
};

/* ---------- Ready-made templates: customize the wording here ---------- */

export const notify = {
    welcome: (userId, name) =>
        createAlert({
            userId,
            type: "welcome",
            severity: "success",
            title: "Welcome to Bookie! 🎉",
            message: `Hi ${name || "there"}, create your first personalised story book.`,
            link: "/create",
            dedupeKey: "welcome",
        }),

    profileUpdated: (userId) =>
        createAlert({
            userId,
            type: "profile_updated",
            title: "Profile updated",
            message: "Your profile details were saved successfully.",
            link: "/profile",
        }),

    avatarUpdated: (userId) =>
        createAlert({
            userId,
            type: "avatar_updated",
            title: "Profile photo updated",
            message: "Your new profile photo is live.",
            link: "/profile",
        }),

    dataExportRequested: (userId) =>
        createAlert({
            userId,
            type: "data_export_requested",
            title: "Data export requested",
            message: "We're preparing your data. You'll be notified when it's ready.",
        }),

    bookStarted: (userId, bookId) =>
        createAlert({
            userId,
            type: "book_generation_started",
            title: "Your story is being created ✨",
            message: "We're writing and illustrating your book. This can take a few minutes.",
            link: "/books",
            meta: { bookId },
            dedupeKey: `book-started:${bookId}`,
        }),

    bookCompleted: (userId, bookId, title) =>
        createAlert({
            userId,
            type: "book_completed",
            severity: "success",
            title: "Your book is ready! 📖",
            message: `"${title}" has been created. Open it and start reading.`,
            link: `/books/${bookId}`,
            meta: { bookId },
            dedupeKey: `book-completed:${bookId}`,
        }),

    bookPartiallyFailed: (userId, bookId, title, failedPages) =>
        createAlert({
            userId,
            type: "book_partially_failed",
            severity: "warning",
            title: "Your book couldn't be fully finished",
            message: `"${title}": ${failedPages} page image(s) failed to generate. Please try again.`,
            link: "/books",
            meta: { bookId, failedPages },
            dedupeKey: `book-failed:${bookId}`,
        }),

    bookFailed: (userId, bookId, title = "Your story") =>
        createAlert({
            userId,
            type: "book_failed",
            severity: "error",
            title: "Book creation failed",
            message: `Something went wrong while creating "${title}". Please try again.`,
            link: "/create",
            meta: { bookId },
            dedupeKey: `book-failed:${bookId}`,
        }),

    planLimitReached: (userId, access) =>
        createAlert({
            userId,
            type: "plan_limit_reached",
            severity: "warning",
            title: "Book limit reached",
            message:
                access?.message ||
                "You've used all the books in your plan. Upgrade to create more.",
            link: "/pricing",
            meta: { limit: access?.limit, currentUsage: access?.currentUsage },
        }),
};