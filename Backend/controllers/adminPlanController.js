import Plan from "../models/plan.js";
import PlanSettings, { getSettings } from "../models/planSettings.js";
import Subscription from "../models/subscription.js";
import { MIN_BOOK_LIMIT, MAX_BOOK_LIMIT } from "../config/subscriptionLimits.js";

const MAX_PLANS = 6;

// Turns "Family Plan" into "family-plan". If that slug is already taken by
// another plan, a short numeric suffix is appended until it's unique -
// this is what lets admin type a plan name without thinking about ids at
// all, same as the reference implementation's per-role slugifyRole().
const slugify = (text) =>
    String(text || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

const uniqueSlug = async (base) => {
    let slug = base || "plan";
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const existing = await Plan.findOne({ planId: slug });
        if (!existing) return slug;
        suffix += 1;
        slug = `${base}-${suffix}`;
    }
};

// A whole number from MIN_BOOK_LIMIT to MAX_BOOK_LIMIT, otherwise null
// (= invalid). Super admin must always choose a value in this range.
const parseBookLimit = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isInteger(n) && n >= MIN_BOOK_LIMIT && n <= MAX_BOOK_LIMIT ? n : null;
};

// A finite, non-negative price with at most 2 decimals, otherwise null.
const parsePrice = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

const BOOK_LIMIT_MESSAGE = `Book limit is required and must be a whole number from ${MIN_BOOK_LIMIT} to ${MAX_BOOK_LIMIT}.`;

// -------------------------------------------------------------------------
// GET /api/admin/plans
// Every plan (active + inactive) plus the current yearly-saving %, for the
// super admin management screen.
// -------------------------------------------------------------------------
export const getAllPlans = async (req, res) => {
    try {
        const [plans, settings] = await Promise.all([
            Plan.find().sort({ order: 1, createdAt: 1 }).lean(),
            getSettings(),
        ]);

        res.json({ success: true, plans, yearlySaving: settings.yearlySaving });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch plans", error: err.message });
    }
};

// -------------------------------------------------------------------------
// POST /api/admin/plans
// Body: { name, iconKey, monthlyPrice, ribbon, button, popular, features[] }
// Creates a new plan. planId is derived from `name` server-side.
// -------------------------------------------------------------------------
export const createPlan = async (req, res) => {
    try {
        const { name, iconKey, monthlyPrice, ribbon, button, popular, features, bookLimit } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: "Plan name is required" });
        }
        const price = parsePrice(monthlyPrice);
        if (price === null) {
            return res.status(400).json({ success: false, message: "A valid monthly price is required" });
        }

        if (parseBookLimit(bookLimit) === null) {
            return res.status(400).json({ success: false, message: BOOK_LIMIT_MESSAGE });
        }

        const count = await Plan.countDocuments();
        if (count >= MAX_PLANS) {
            return res.status(400).json({ success: false, message: `You can have at most ${MAX_PLANS} plans. Edit or remove one first.` });
        }

        const base = slugify(name) || "plan";
        const planId = await uniqueSlug(base);

        const lastOrder = await Plan.findOne().sort({ order: -1 }).select("order").lean();

        const plan = await Plan.create({
            planId,
            name: name.trim(),
            iconKey: iconKey || "star",
            monthlyPrice: price,
            ribbon: ribbon || "blue",
            button: button || "blue",
            popular: !!popular,
            features: Array.isArray(features) ? features.filter(Boolean) : [],
            limits: { book: parseBookLimit(bookLimit) },
            order: (lastOrder?.order ?? -1) + 1,
            updatedBy: req.user._id,
        });

        res.status(201).json({ success: true, plan });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to create plan", error: err.message });
    }
};

// -------------------------------------------------------------------------
// PUT /api/admin/plans/:id
// Body: { name, iconKey, monthlyPrice, ribbon, button, popular, features[], active }
// Full update of an existing plan, identified by Mongo _id. planId (the
// slug used by real Subscription documents) never changes here, even if
// the display name is edited - that's what keeps historical subscriptions
// pointing at the right plan.
// -------------------------------------------------------------------------
export const updatePlan = async (req, res) => {
    try {
        const { name, iconKey, monthlyPrice, ribbon, button, popular, features, active, bookLimit } = req.body;

        const plan = await Plan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ success: false, message: "Plan not found" });
        }

        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({ success: false, message: "Plan name can't be empty" });
            }
            plan.name = name.trim();
        }
        if (iconKey !== undefined) plan.iconKey = iconKey;
        if (monthlyPrice !== undefined) {
            const price = parsePrice(monthlyPrice);
            if (price === null) {
                return res.status(400).json({ success: false, message: "Monthly price must be a number that isn't negative" });
            }
            plan.monthlyPrice = price;
        }
        if (ribbon !== undefined) plan.ribbon = ribbon;
        if (button !== undefined) plan.button = button;
        if (popular !== undefined) plan.popular = !!popular;
        if (features !== undefined) plan.features = Array.isArray(features) ? features.filter(Boolean) : [];
        if (active !== undefined) plan.active = !!active;
        if (bookLimit !== undefined) {
            const parsed = parseBookLimit(bookLimit);
            if (parsed === null) {
                return res.status(400).json({ success: false, message: BOOK_LIMIT_MESSAGE });
            }
            plan.set("limits.book", parsed);
        }

        plan.updatedBy = req.user._id;
        await plan.save();

        res.json({ success: true, plan });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to update plan", error: err.message });
    }
};

// -------------------------------------------------------------------------
// DELETE /api/admin/plans/:id
// Hard-deletes the plan document. Existing Subscription rows keep their
// snapshot (planName/planDisplayName/amount), they just won't resolve to
// a live Plan for display purposes going forward - that's fine since
// paymentHistory already stores its own planName/amount per entry.
// -------------------------------------------------------------------------
export const deletePlan = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ success: false, message: "Plan not found" });
        }

        const inUse = await Subscription.countDocuments({
            planName: plan.planId,
            status: "active",
            endDate: { $gt: new Date() },
        });
        if (inUse > 0) {
            return res.status(409).json({
                success: false,
                message: `${inUse} user${inUse === 1 ? " is" : "s are"} currently on this plan. Deactivate it instead so they keep access until their plan ends.`,
            });
        }

        await plan.deleteOne();
        res.json({ success: true, message: "Plan deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to delete plan", error: err.message });
    }
};

// -------------------------------------------------------------------------
// PATCH /api/admin/plans/settings
// Body: { yearlySaving }
// The one cross-plan pricing knob: % discount for paying yearly.
// -------------------------------------------------------------------------
export const updateSettings = async (req, res) => {
    try {
        const { yearlySaving } = req.body;

        if (yearlySaving === undefined || yearlySaving < 0 || yearlySaving > 90) {
            return res.status(400).json({ success: false, message: "yearlySaving must be between 0 and 90" });
        }

        const settings = await getSettings();
        settings.yearlySaving = yearlySaving;
        settings.updatedBy = req.user._id;
        await settings.save();

        res.json({ success: true, yearlySaving: settings.yearlySaving });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to update settings", error: err.message });
    }
};

// -------------------------------------------------------------------------
// GET /api/admin/subscriptions
// Every user's subscription (current status + embedded payment history),
// newest-first, paginated. This is the "super admin sees user
// subscription history" screen. Optional ?status= / ?planName= / ?search=
// (matches user name/email) filters.
// -------------------------------------------------------------------------
export const getAllSubscriptions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.planName) filter.planName = req.query.planName;

        let query = Subscription.find(filter)
            .populate("userId", "name email role")
            .sort({ createdAt: -1 });

        let subscriptions = await query.lean();

        if (req.query.search) {
            const term = req.query.search.toLowerCase();
            subscriptions = subscriptions.filter(
                (s) =>
                    s.userId?.name?.toLowerCase().includes(term) ||
                    s.userId?.email?.toLowerCase().includes(term)
            );
        }

        const total = subscriptions.length;
        const paged = subscriptions.slice((page - 1) * limit, page * limit);

        res.json({ success: true, subscriptions: paged, total, page, pages: Math.ceil(total / limit) || 1 });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch subscriptions", error: err.message });
    }
};

// -------------------------------------------------------------------------
// GET /api/admin/subscriptions/:userId/history
// One user's full subscription doc (payment history + current status) -
// used when admin drills into a single user from the Users screen.
// -------------------------------------------------------------------------
export const getUserSubscriptionHistory = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ userId: req.params.userId })
            .populate("userId", "name email role")
            .lean();

        res.json({ success: true, subscription: subscription || null });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch user subscription", error: err.message });
    }
};