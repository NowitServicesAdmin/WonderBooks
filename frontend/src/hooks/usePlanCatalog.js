import { useCallback, useEffect, useState } from "react";
import { getPlans } from "../services/subscriptionService";

/*
  |--------------------------------------------------------------------------
  | usePlanCatalog
  |--------------------------------------------------------------------------
  | Plans are managed by super admin (Pages/SuperAdmin/Subscription.jsx /
  | adminPlanService.js) and stored in the Plan collection - this just
  | fetches whatever's currently active.
  |
  | Returns raw plans (monthlyPrice only) plus yearlySaving; yearlyPrice
  | per plan is computed client-side with the same rounding rule the
  | backend uses, purely for display - the backend re-derives and
  | re-validates the real charge amount independently on /initiate.
*/
export const usePlanCatalog = () => {
    const [plans, setPlans] = useState([]);
    const [yearlySaving, setYearlySaving] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const refresh = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { data } = await getPlans();
            setPlans(data.plans || []);
            setYearlySaving(data.yearlySaving || 0);
        } catch (err) {
            if (err?.response?.status === 404) {
                setPlans([]);
                setYearlySaving(0);
                setError("No plans are configured yet.");
            } else {
                setError(err?.response?.data?.message || "Couldn't load plans");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const getYearlyPrice = useCallback(
        (monthlyPrice) => {
            if (!monthlyPrice) return 0;
            const yearlyWithoutDiscount = monthlyPrice * 12;
            const discounted = yearlyWithoutDiscount * (1 - yearlySaving / 100);
            return Math.round(discounted / 10) * 10;
        },
        [yearlySaving]
    );

    return { plans, yearlySaving, loading, error, getYearlyPrice, refresh };
};

export default usePlanCatalog;
