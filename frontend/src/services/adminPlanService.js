import api from "../api/axios";

const PLANS_BASE = "/admin/plans";
const SUBS_BASE = "/admin/subscriptions";

export const getAllPlans = () => api.get(PLANS_BASE);

export const createPlan = (planData) => api.post(PLANS_BASE, planData);

export const updatePlan = (id, planData) => api.put(`${PLANS_BASE}/${id}`, planData);

export const deletePlan = (id) => api.delete(`${PLANS_BASE}/${id}`);

export const updateYearlySaving = (yearlySaving) =>
    api.patch(`${PLANS_BASE}/settings`, { yearlySaving });

export const getAllSubscriptions = (params) => api.get(SUBS_BASE, { params });

export const getUserSubscriptionHistory = (userId) =>
    api.get(`${SUBS_BASE}/${userId}/history`);
