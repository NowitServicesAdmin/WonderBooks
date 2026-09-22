import api from "../api/axios";

export const getPlans = () => api.get("/subscriptions/plans");

export const getMySubscription = () => api.get("/subscriptions/me");

export const getMySubscriptionHistory = () => api.get("/subscriptions/history");

export const getMyPaymentHistory = () => api.get("/subscriptions/payment-history");

export const initiateSubscription = (planName, billingCycle) =>
    api.post("/subscriptions/initiate", { planName, billingCycle });

export const activateSubscription = (data) => api.post("/subscriptions/activate", data);

export const cancelSubscription = (reason) => api.patch("/subscriptions/cancel", { reason });

export const restoreSubscription = () => api.patch("/subscriptions/restore");
