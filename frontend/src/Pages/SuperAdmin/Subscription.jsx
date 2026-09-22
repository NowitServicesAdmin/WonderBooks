/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Star, Crown, Gem, Award, Zap, MoreVertical, Plus, X, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
    getAllPlans,
    createPlan,
    updatePlan,
    deletePlan,
    updateYearlySaving,
    getAllSubscriptions,
} from "../../services/adminPlanService";

const iconOptions = [
    { key: "star", icon: Star },
    { key: "crown", icon: Crown },
    { key: "gem", icon: Gem },
    { key: "award", icon: Award },
    { key: "zap", icon: Zap },
];

const iconByKey = Object.fromEntries(iconOptions.map(({ key, icon }) => [key, icon]));

const emptyDraft = {
    name: "",
    monthlyPrice: "",
    iconKey: "star",
    ribbon: "blue",
    button: "blue",
    popular: false,
    active: true,
    features: "",
};

const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const PlanFormDrawer = ({ mode, plan, onClose, onSave, saving }) => {
    const [draft, setDraft] = useState(
        mode === "edit"
            ? {
                  name: plan.name,
                  monthlyPrice: plan.monthlyPrice,
                  iconKey: plan.iconKey,
                  ribbon: plan.ribbon || "blue",
                  button: plan.button || "blue",
                  popular: !!plan.popular,
                  active: plan.active !== false,
                  features: plan.features.join("\n"),
              }
            : emptyDraft
    );
    const [error, setError] = useState("");

    const handleSave = () => {
        if (!draft.name.trim() || draft.monthlyPrice === "" || draft.monthlyPrice === null) {
            setError("Plan name and monthly price are required.");
            return;
        }
        if (Number(draft.monthlyPrice) < 0) {
            setError("Monthly price can't be negative.");
            return;
        }

        onSave({
            name: draft.name.trim(),
            monthlyPrice: Number(draft.monthlyPrice),
            iconKey: draft.iconKey,
            ribbon: draft.ribbon,
            button: draft.button,
            popular: draft.popular,
            active: draft.active,
            features: draft.features
                .split("\n")
                .map((f) => f.trim())
                .filter(Boolean),
        });
    };

    return (
        <div className="fixed inset-0 z-30">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />

            <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#eeeafa] px-6 py-5">
                    <h2 className="text-lg font-bold">{mode === "edit" ? "Edit Plan" : "Add Plan"}</h2>
                    <button onClick={onClose} className="text-[#70698a] hover:text-[#1c1730]">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <label className="mb-1 block text-sm font-semibold text-[#38314f]">Plan name</label>
                    <input
                        value={draft.name}
                        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        placeholder="e.g. Family Plan"
                        className="mb-4 w-full rounded-lg border border-[#eeeafa] px-3 py-2 text-sm focus:border-[#5426c7] focus:outline-none"
                    />

                    <label className="mb-1 block text-sm font-semibold text-[#38314f]">Icon</label>
                    <div className="mb-4 flex gap-2">
                        {iconOptions.map(({ key, icon: OptionIcon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setDraft((d) => ({ ...d, iconKey: key }))}
                                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                                    draft.iconKey === key
                                        ? "border-[#5426c7] bg-[#f0eaff] text-[#5426c7]"
                                        : "border-[#eeeafa] text-[#70698a] hover:bg-[#f5f1ff]"
                                }`}
                            >
                                <OptionIcon size={18} />
                            </button>
                        ))}
                    </div>

                    <div className="mb-4 flex gap-3">
                        <div className="flex-1">
                            <label className="mb-1 block text-sm font-semibold text-[#38314f]">Monthly price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                value={draft.monthlyPrice}
                                onChange={(e) => setDraft((d) => ({ ...d, monthlyPrice: e.target.value }))}
                                placeholder="9.99"
                                className="w-full rounded-lg border border-[#eeeafa] px-3 py-2 text-sm focus:border-[#5426c7] focus:outline-none"
                            />
                            <p className="mt-1 text-xs text-[#a39cc0]">
                                Yearly price is auto-calculated from the yearly saving % below.
                            </p>
                        </div>
                        <div className="flex-1">
                            <label className="mb-1 block text-sm font-semibold text-[#38314f]">Card color</label>
                            <select
                                value={draft.ribbon}
                                onChange={(e) => setDraft((d) => ({ ...d, ribbon: e.target.value, button: e.target.value }))}
                                className="w-full rounded-lg border border-[#eeeafa] px-3 py-2 text-sm focus:border-[#5426c7] focus:outline-none"
                            >
                                <option value="blue">Blue</option>
                                <option value="purple">Purple</option>
                                <option value="orange">Orange</option>
                            </select>
                        </div>
                    </div>

                    <label className="mb-1 block text-sm font-semibold text-[#38314f]">
                        Features <span className="font-normal text-[#70698a]">(one per line)</span>
                    </label>
                    <textarea
                        value={draft.features}
                        onChange={(e) => setDraft((d) => ({ ...d, features: e.target.value }))}
                        rows={5}
                        placeholder={"10 books download\n5 prints per month"}
                        className="mb-4 w-full resize-none rounded-lg border border-[#eeeafa] px-3 py-2 text-sm focus:border-[#5426c7] focus:outline-none"
                    />

                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#38314f]">
                        <input
                            type="checkbox"
                            checked={draft.popular}
                            onChange={(e) => setDraft((d) => ({ ...d, popular: e.target.checked }))}
                            className="h-4 w-4 rounded border-[#eeeafa] accent-[#5426c7]"
                        />
                        Mark as popular
                    </label>

                    <label className="flex items-center gap-2 text-sm font-semibold text-[#38314f]">
                        <input
                            type="checkbox"
                            checked={draft.active}
                            onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                            className="h-4 w-4 rounded border-[#eeeafa] accent-[#5426c7]"
                        />
                        Visible to users
                    </label>

                    {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-[#eeeafa] px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-[#eeeafa] px-4 py-2 text-sm font-semibold hover:bg-[#f5f1ff]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-lg bg-[#5426c7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4720a8] disabled:opacity-60"
                    >
                        {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Create plan"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PlansTab = () => {
    const [plans, setPlans] = useState([]);
    const [yearlySaving, setYearlySaving] = useState(15);
    const [savingInput, setSavingInput] = useState("15");
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [error, setError] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await getAllPlans();
            setPlans(data.plans || []);
            setYearlySaving(data.yearlySaving ?? 15);
            setSavingInput(String(data.yearlySaving ?? 15));
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleCreate = async (planData) => {
        setSaving(true);
        try {
            await createPlan(planData);
            setIsAddOpen(false);
            await load();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to create plan");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEdit = async (planData) => {
        setSaving(true);
        try {
            await updatePlan(editingPlan._id, planData);
            setEditingPlan(null);
            await load();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to update plan");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (plan) => {
        if (!window.confirm(`Delete "${plan.name}"? This can't be undone.`)) return;
        try {
            await deletePlan(plan._id);
            await load();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to delete plan");
        }
    };

    const handleSaveYearlySaving = async () => {
        const value = Number(savingInput);
        if (Number.isNaN(value) || value < 0 || value > 90) {
            setError("Yearly saving must be a number between 0 and 90.");
            return;
        }
        try {
            await updateYearlySaving(value);
            setYearlySaving(value);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to update yearly saving");
        }
    };

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 rounded-xl border border-[#eeeafa] bg-white px-3 py-2">
                    <label className="text-sm font-semibold text-[#38314f]">Yearly saving</label>
                    <input
                        type="number"
                        min="0"
                        max="90"
                        value={savingInput}
                        onChange={(e) => setSavingInput(e.target.value)}
                        className="w-16 rounded-lg border border-[#eeeafa] px-2 py-1 text-sm focus:border-[#5426c7] focus:outline-none"
                    />
                    <span className="text-sm text-[#70698a]">%</span>
                    {Number(savingInput) !== yearlySaving && (
                        <button
                            onClick={handleSaveYearlySaving}
                            className="rounded-lg bg-[#5426c7] px-3 py-1 text-xs font-semibold text-white hover:bg-[#4720a8]"
                        >
                            Save
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-[#5426c7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4720a8]"
                >
                    <Plus size={16} /> Add Plan
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-3 gap-5">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-65 animate-pulse rounded-2xl bg-[#f5f1ff]" />
                    ))}
                </div>
            ) : plans.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#eeeafa] p-10 text-center text-sm text-[#70698a]">
                    No plans yet. Click "Add Plan" to create the first one.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => {
                        const Icon = iconByKey[plan.iconKey] || Star;
                        return (
                            <div
                                key={plan._id}
                                onClick={() => setEditingPlan(plan)}
                                className={`relative cursor-pointer rounded-2xl border bg-white p-5 transition-shadow hover:shadow-md ${
                                    plan.active === false ? "opacity-50" : ""
                                }`}
                                style={{ borderColor: "#eeeafa" }}
                            >
                                {plan.popular && (
                                    <span className="absolute right-4 top-4 rounded-full bg-[#f0eaff] px-2.5 py-1 text-xs font-bold text-[#5426c7]">
                                        Popular
                                    </span>
                                )}
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0eaff] text-[#5426c7]">
                                    <Icon size={18} />
                                </div>
                                <div className="font-bold">{plan.name}</div>
                                <div className="mb-3 text-xl font-extrabold">
                                    ₹{plan.monthlyPrice} <span className="text-sm font-medium text-[#70698a]">/ month</span>
                                </div>
                                <ul className="mb-4 flex flex-col gap-1 text-sm text-[#70698a]">
                                    {plan.features.map((f) => (
                                        <li key={f}>• {f}</li>
                                    ))}
                                </ul>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-[#70698a]">
                                        {plan.active === false ? "Hidden" : "Visible"}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingPlan(plan);
                                            }}
                                            className="rounded-lg border border-[#eeeafa] px-3 py-1.5 text-xs font-semibold hover:bg-[#f5f1ff]"
                                        >
                                            Edit
                                        </button>
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === plan._id ? null : plan._id);
                                                }}
                                                className="text-[#70698a] hover:text-[#5426c7]"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {openMenuId === plan._id && (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="absolute right-0 top-6 z-10 w-32 rounded-lg border border-[#eeeafa] bg-white py-1 shadow-lg"
                                                >
                                                    <button
                                                        onClick={() => {
                                                            setOpenMenuId(null);
                                                            handleDelete(plan);
                                                        }}
                                                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50"
                                                    >
                                                        <Trash2 size={13} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {editingPlan && (
                <PlanFormDrawer
                    mode="edit"
                    plan={editingPlan}
                    saving={saving}
                    onClose={() => setEditingPlan(null)}
                    onSave={handleSaveEdit}
                />
            )}

            {isAddOpen && (
                <PlanFormDrawer mode="add" saving={saving} onClose={() => setIsAddOpen(false)} onSave={handleCreate} />
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// SUBSCRIBERS (HISTORY) TAB
// ---------------------------------------------------------------------------
const statusStyles = {
    active: "bg-emerald-50 text-emerald-700",
    expired: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-50 text-red-600",
    pending: "bg-amber-50 text-amber-700",
    trial: "bg-blue-50 text-blue-700",
};

const SubscribersTab = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await getAllSubscriptions({ page, search: search || undefined, status: status || undefined });
            setSubscriptions(data.subscriptions || []);
            setPages(data.pages || 1);
            setTotal(data.total || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, status]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        load();
    };

    return (
        <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-lg border border-[#eeeafa] bg-white px-3 py-2">
                        <Search size={15} className="text-[#70698a]" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or email"
                            className="w-56 text-sm outline-none"
                        />
                    </div>
                    <button type="submit" className="rounded-lg bg-[#5426c7] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4720a8]">
                        Search
                    </button>
                </form>

                <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                    }}
                    className="rounded-lg border border-[#eeeafa] px-3 py-2 text-sm"
                >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="pending">Pending</option>
                    <option value="trial">Trial</option>
                </select>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#eeeafa] bg-white">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-[#f7f4ff] text-[#5426c7]">
                            <th className="px-4 py-3 font-semibold">User</th>
                            <th className="px-4 py-3 font-semibold">Plan</th>
                            <th className="px-4 py-3 font-semibold">Billing</th>
                            <th className="px-4 py-3 font-semibold">Amount</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Started</th>
                            <th className="px-4 py-3 font-semibold">Ends</th>
                            <th className="px-4 py-3 font-semibold">Payments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-[#70698a]">
                                    Loading…
                                </td>
                            </tr>
                        ) : subscriptions.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-[#70698a]">
                                    No subscriptions found.
                                </td>
                            </tr>
                        ) : (
                            subscriptions.map((sub) => (
                                <tr key={sub._id} className="border-t border-[#eeeafa]">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-[#1c1730]">{sub.userId?.name || "—"}</div>
                                        <div className="text-xs text-[#70698a]">{sub.userId?.email}</div>
                                    </td>
                                    <td className="px-4 py-3 capitalize">{sub.planDisplayName || sub.planName}</td>
                                    <td className="px-4 py-3 capitalize">{sub.billingCycle}</td>
                                    <td className="px-4 py-3">₹{sub.amount}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[sub.status] || "bg-gray-100 text-gray-600"}`}>
                                            {sub.status}
                                            {sub.cancelRequested ? " · cancelling" : ""}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-[#70698a]">{formatDate(sub.startDate)}</td>
                                    <td className="px-4 py-3 text-xs text-[#70698a]">{formatDate(sub.endDate)}</td>
                                    <td className="px-4 py-3 text-xs text-[#70698a]">{sub.paymentHistory?.length || 0}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-[#70698a]">
                <span>{total} subscriptions</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#eeeafa] disabled:opacity-40"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span>
                        Page {page} of {pages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(pages, p + 1))}
                        disabled={page >= pages}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#eeeafa] disabled:opacity-40"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------
export const SuperAdminSubscriptions = () => {
    const [tab, setTab] = useState("plans");

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold">Subscriptions</h1>
                <p className="text-sm text-[#70698a]">Manage subscription plans and see who's subscribed</p>
            </div>

            <div className="mb-6 flex gap-2 border-b border-[#eeeafa]">
                <button
                    onClick={() => setTab("plans")}
                    className={`px-4 py-2 text-sm font-semibold ${
                        tab === "plans" ? "border-b-2 border-[#5426c7] text-[#5426c7]" : "text-[#70698a]"
                    }`}
                >
                    Plans
                </button>
                <button
                    onClick={() => setTab("subscribers")}
                    className={`px-4 py-2 text-sm font-semibold ${
                        tab === "subscribers" ? "border-b-2 border-[#5426c7] text-[#5426c7]" : "text-[#70698a]"
                    }`}
                >
                    Subscribers
                </button>
            </div>

            {tab === "plans" ? <PlansTab /> : <SubscribersTab />}
        </div>
    );
};
