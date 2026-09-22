import mongoose from "mongoose";

/*
  |--------------------------------------------------------------------------
  | PLAN
  |--------------------------------------------------------------------------
  | Managed entirely by super admin (see controllers/adminPlanController.js).
  | Users only ever READ this collection (GET /api/subscriptions/plans) -
  | nothing user-facing is allowed to write here, which is what keeps
  | pricing trustworthy: initiateSubscription() re-reads the price from
  | this collection server-side rather than trusting anything the client
  | sends.
  |
  | WonderBook only has one paid audience ("user"), so unlike a multi-role
  | product this is a flat list of plans - no per-role grouping needed.
  |
  | iconKey/ribbon/button are purely cosmetic and map 1:1 to the choices
  | already used in the SuperAdmin plan UI (see Pages/SuperAdmin/Subscription.jsx
  | and Client Settings' subscription panel).
*/
const planSchema = new mongoose.Schema(
    {
        // URL/DB-safe identifier, derived from `name` the first time a plan
        // is created (see slugify() in adminPlanController.js). Stable even
        // if the display name is edited later, since Subscription documents
        // reference plans by this id.
        planId: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        iconKey: {
            type: String,
            enum: ["star", "crown", "gem", "award", "zap"],
            default: "star",
        },

        // Base monthly price in INR. The yearly price is never stored - it's
        // always derived from this + the global yearlySaving% (see
        // PlanSettings / config/subscriptionPlans.js), both server-side and
        // client-side, so admin only ever has to edit one number per plan.
        monthlyPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        ribbon: {
            type: String,
            enum: ["blue", "purple", "orange"],
            default: "blue",
        },
        button: {
            type: String,
            enum: ["blue", "purple", "orange"],
            default: "blue",
        },

        popular: {
            type: Boolean,
            default: false,
        },

        features: {
            type: [String],
            default: [],
        },

        // Soft-delete flag. Kept (not hard-deleted) so historical
        // Subscription documents that reference this plan still resolve to
        // something sensible; inactive plans just stop showing up in the
        // user-facing catalog.
        active: {
            type: Boolean,
            default: true,
        },

        order: {
            type: Number,
            default: 0,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

const Plan = mongoose.model("Plan", planSchema);

export default Plan;
