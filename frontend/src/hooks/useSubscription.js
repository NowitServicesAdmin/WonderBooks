import { useCallback, useEffect, useState } from "react";
import {
    getMySubscription,
    initiateSubscription,
    activateSubscription,
    cancelSubscription as cancelSubscriptionApi,
    restoreSubscription as restoreSubscriptionApi,
} from "../services/subscriptionService";
import { useRazorpayCheckout } from "./useRazorpayCheckout";

/*
  |--------------------------------------------------------------------------
  | useSubscription
  |--------------------------------------------------------------------------
  | Everything a component needs to render plans and let the user buy /
  | cancel / restore one, without knowing anything about Razorpay itself.
  |
  | Usage:
  |   const {
  |     subscription, loading, busyPlanId, error,
  |     isCurrentPlan, lockOtherPlans, buyPlan, cancelPlan, restorePlan,
  |   } = useSubscription(user);
  |
  |   <button onClick={() => buyPlan(plan, billing)} disabled={busyPlanId === plan.planId}>
  |     Buy now
  |   </button>
*/
export const useSubscription = (user) => {
    const { openCheckout } = useRazorpayCheckout();

    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busyPlanId, setBusyPlanId] = useState(null);
    const [error, setError] = useState("");

    const refresh = useCallback(async () => {
        try {
            const { data } = await getMySubscription();
            setSubscription(data.subscription);
        } catch (err) {
            console.error("Failed to load subscription:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const isCurrentPlan = useCallback(
        (planId) => subscription?.status === "active" && subscription?.planName === planId,
        [subscription]
    );

    // True whenever there's a paid-for, non-cancelled active plan - used to
    // lock every OTHER plan's Buy button. Clears the moment the user
    // cancels, so they're free to pick something else even though the
    // cancelled plan is still technically valid until its endDate.
    const lockOtherPlans = Boolean(
        subscription?.status === "active" && !subscription?.cancelRequested
    );

    const buyPlan = useCallback(
        async (plan, billingCycle) => {
            setError("");
            setBusyPlanId(plan.planId);

            try {
                const { data: initData } = await initiateSubscription(plan.planId, billingCycle);

                // Free plan - no Razorpay order was created, activate directly.
                if (!initData.requiresPayment) {
                    await activateSubscription({ planName: plan.planId, billingCycle });
                    await refresh();
                    setBusyPlanId(null);
                    return;
                }

                await openCheckout({
                    order: initData.order,
                    keyId: initData.keyId,
                    name: "WonderBook",
                    description: `${plan.name} - ${billingCycle} plan`,
                    theme: { color: "#5426c7" },
                    prefill: {
                        name: user?.name || "",
                        email: user?.email || "",
                    },
                    notes: { plan: plan.planId, billingCycle },
                    onSuccess: async (response) => {
                        try {
                            await activateSubscription({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                planName: plan.planId,
                                billingCycle,
                            });

                            await refresh();
                        } catch (err) {
                            setError(err.response?.data?.message || "Payment verification failed");
                        } finally {
                            setBusyPlanId(null);
                        }
                    },
                    onDismiss: () => setBusyPlanId(null),
                    onFailure: (rzpError) => {
                        setError(rzpError?.description || "Payment failed. Please try again.");
                        setBusyPlanId(null);
                    },
                });
            } catch (err) {
                setError(err.response?.data?.message || err.message || "Couldn't start checkout");
                setBusyPlanId(null);
            }
        },
        [openCheckout, refresh, user]
    );

    const cancelPlan = async (reason = "") => {
        try {
            setError("");
            setLoading(true);
            await cancelSubscriptionApi(reason);
            await refresh();
        } catch (err) {
            setError(err?.response?.data?.message || "Unable to cancel subscription");
        } finally {
            setLoading(false);
        }
    };

    const restorePlan = async () => {
        try {
            setError("");
            setLoading(true);
            await restoreSubscriptionApi();
            await refresh();
        } catch (err) {
            setError(err?.response?.data?.message || "Unable to restore subscription");
        } finally {
            setLoading(false);
        }
    };

    return {
        subscription,
        loading,
        busyPlanId,
        error,
        isCurrentPlan,
        lockOtherPlans,
        buyPlan,
        cancelPlan,
        restorePlan,
        refresh,
    };
};

export default useSubscription;
