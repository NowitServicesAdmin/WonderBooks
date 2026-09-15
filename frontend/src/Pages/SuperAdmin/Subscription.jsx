import { useState } from "react";
import { Star, Crown, Gem, Award, Zap, MoreVertical, Plus, X } from "lucide-react";

const iconOptions = [
    { key: "star", icon: Star },
    { key: "crown", icon: Crown },
    { key: "gem", icon: Gem },
    { key: "award", icon: Award },
    { key: "zap", icon: Zap },
];

const iconByKey = Object.fromEntries(iconOptions.map(({ key, icon }) => [key, icon]));

const initialPlans = [
    {
        name: "Free Plan", price: "0", period: "/ month", iconKey: "star", popular: true,
        features: ["2 books download", "1 print per month"],
    },
    {
        name: "Standard Plan", price: "9.99", period: "/ month", iconKey: "crown", users: 412,
        features: ["10 books download", "5 prints per month"],
    },
    {
        name: "Premium Plan", price: "39.99", period: "/ month", iconKey: "gem", users: 43,
        features: ["Unlimited downloads", "Unlimited prints"],
    },
];

const emptyDraft = {
    name: "",
    price: "",
    period: "/ month",
    iconKey: "star",
    popular: false,
    features: "",
};

// Shared right-side drawer used for both adding a new plan and editing an
// existing one. It works on a local draft copy so nothing changes until
// "Save changes" / "Create plan" is pressed.
const PlanFormDrawer = ({ mode, plan, onClose, onSave }) => {
    const [draft, setDraft] = useState(
        mode === "edit"
            ? {
                  name: plan.name,
                  price: plan.price,
                  period: plan.period,
                  iconKey: plan.iconKey,
                  popular: !!plan.popular,
                  features: plan.features.join("\n"),
              }
            : emptyDraft
    );
    const [error, setError] = useState("");

    const handleSave = () => {
        if (!draft.name.trim() || !draft.price.toString().trim()) {
            setError("Plan name and price are required.");
            return;
        }
        onSave({
            ...(mode === "edit" ? plan : {}),
            name: draft.name.trim(),
            price: draft.price.toString().trim(),
            period: draft.period,
            iconKey: draft.iconKey,
            popular: draft.popular,
            features: draft.features
                .split("\n")
                .map((f) => f.trim())
                .filter(Boolean),
        });
    };

    return (
        <div className="fixed inset-0 z-30">
            {/* dimmed backdrop, click to close */}
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
                            <label className="mb-1 block text-sm font-semibold text-[#38314f]">Price</label>
                            <input
                                value={draft.price}
                                onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                                placeholder="9.99"
                                className="w-full rounded-lg border border-[#eeeafa] px-3 py-2 text-sm focus:border-[#5426c7] focus:outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="mb-1 block text-sm font-semibold text-[#38314f]">Billing period</label>
                            <select
                                value={draft.period}
                                onChange={(e) => setDraft((d) => ({ ...d, period: e.target.value }))}
                                className="w-full rounded-lg border border-[#eeeafa] px-3 py-2 text-sm focus:border-[#5426c7] focus:outline-none"
                            >
                                <option value="/ month">/ month</option>
                                <option value="/ year">/ year</option>
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

                    <label className="flex items-center gap-2 text-sm font-semibold text-[#38314f]">
                        <input
                            type="checkbox"
                            checked={draft.popular}
                            onChange={(e) => setDraft((d) => ({ ...d, popular: e.target.checked }))}
                            className="h-4 w-4 rounded border-[#eeeafa] accent-[#5426c7]"
                        />
                        Mark as popular
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
                        className="rounded-lg bg-[#5426c7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4720a8]"
                    >
                        {mode === "edit" ? "Save changes" : "Create plan"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const SuperAdminSubscriptions = () => {
    const [plans, setPlans] = useState(initialPlans);
    const [editingIndex, setEditingIndex] = useState(null);
    const [isAddOpen, setIsAddOpen] = useState(false);

    const handleSaveEdit = (updatedPlan) => {
        setPlans((prev) => prev.map((p, i) => (i === editingIndex ? updatedPlan : p)));
        setEditingIndex(null);
    };

    const handleCreate = (newPlan) => {
        setPlans((prev) => [...prev, newPlan]);
        setIsAddOpen(false);
    };

    return (
        <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold">Subscriptions</h1>
                    <p className="text-sm text-[#70698a]">Manage subscription plans</p>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-[#5426c7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4720a8]"
                >
                    <Plus size={16} /> Add Plan
                </button>
            </div>

            <div className="grid grid-cols-3 gap-5">
                {plans.map((plan, index) => {
                    const Icon = iconByKey[plan.iconKey] || Star;
                    return (
                        <div
                            key={plan.name + index}
                            onClick={() => setEditingIndex(index)}
                            className="relative cursor-pointer rounded-2xl border border-[#eeeafa] bg-white p-5 transition-shadow hover:shadow-md"
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
                                ${plan.price} <span className="text-sm font-medium text-[#70698a]">{plan.period}</span>
                            </div>
                            <ul className="mb-4 flex flex-col gap-1 text-sm text-[#70698a]">
                                {plan.features.map((f) => (
                                    <li key={f}>• {f}</li>
                                ))}
                            </ul>
                            <div className="flex items-center justify-between">
                                {plan.users ? (
                                    <span className="text-xs font-semibold text-[#70698a]">{plan.users} users</span>
                                ) : <span />}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingIndex(index);
                                        }}
                                        className="rounded-lg border border-[#eeeafa] px-3 py-1.5 text-xs font-semibold hover:bg-[#f5f1ff]"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-[#70698a] hover:text-[#5426c7]"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {editingIndex !== null && (
                <PlanFormDrawer
                    mode="edit"
                    plan={plans[editingIndex]}
                    onClose={() => setEditingIndex(null)}
                    onSave={handleSaveEdit}
                />
            )}

            {isAddOpen && (
                <PlanFormDrawer mode="add" onClose={() => setIsAddOpen(false)} onSave={handleCreate} />
            )}
        </div>
    );
};