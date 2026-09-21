import Plan from "../models/plan.js";
import { getSettings } from "../models/planSettings.js";

/*
  |--------------------------------------------------------------------------
  | SERVER-SIDE PLAN CONFIG (DB-backed)
  |--------------------------------------------------------------------------
  | Plans + the global yearly-saving % live in Mongo, managed by super
  | admin via adminPlanController.js. This is the read/lookup layer
  | everything else (the public catalog endpoint, initiateSubscription)
  | calls through - getPlanPrice() is what initiateSubscription trusts for
  | the real charge amount, never anything the client sends.
*/

// Returns { plans, yearlySaving } for the public catalog. `plans` only
// includes active ones and is sorted the way admin ordered them.
export const getPlanConfig = async () => {
    const [plans, settings] = await Promise.all([
        Plan.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean(),
        getSettings(),
    ]);

    return {
        plans,
        yearlySaving: settings.yearlySaving,
    };
};

// Rounds the same way the frontend preview does (usePlanCatalog.js), so
// the number a user sees before paying matches what they're actually
// charged.
export const computeYearlyPrice = (monthlyPrice, yearlySaving) => {
    if (!monthlyPrice) return 0;
    const yearlyWithoutDiscount = monthlyPrice * 12;
    const discounted = yearlyWithoutDiscount * (1 - yearlySaving / 100);
    return Math.round(discounted / 10) * 10;
};

// Returns null if the plan doesn't exist or is inactive - callers must
// treat null as "invalid request", never as "free".
export const getPlanPrice = async (planId, billingCycle = "monthly") => {
    const plan = await Plan.findOne({ planId, active: true }).lean();
    if (!plan) return null;

    if (billingCycle === "monthly") return plan.monthlyPrice;

    if (!plan.monthlyPrice) return 0;

    const settings = await getSettings();
    return computeYearlyPrice(plan.monthlyPrice, settings.yearlySaving);
};
