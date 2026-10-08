import { useEffect, useMemo, useState } from "react";
import { Star, Crown, Gem, Award, Zap, Check, Clock } from "lucide-react";

import { useSubscriptionContext } from "../../context/SubscriptionContext";
import { usePlanCatalog } from "../../hooks/usePlanCatalog";
import { getMyPaymentHistory } from "../../services/subscriptionService";
import WonderAlertModal from "../../Components/WonderAlertModal";

const tokens = {
    ink: "var(--ink)",
    inkSoft: "#5B5372",
    purple: "#6D28D9",
    purpleDeep: "#4C1D95",
    purpleTint: "var(--tint)",
    line: "#E8E1F7",
};

const iconByKey = {
    star: Star,
    crown: Crown,
    gem: Gem,
    award: Award,
    zap: Zap,
};

const buttonBg = {
    blue: "linear-gradient(90deg,#287FF0,#29CDE7)",
    purple: "linear-gradient(90deg,#8639ED,#C93EE7)",
    orange: "linear-gradient(90deg,#FF792B,#FFD020)",
};

const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const SubscriptionPanel = () => {
    const [billing, setBilling] = useState("monthly");
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(true);

    // Custom WonderAlertModal state
    const [alert, setAlert] = useState({
        isOpen: false,
        type: "confirm",
        title: "",
        message: "",
        primaryText: "",
        secondaryText: "",
        onPrimary: null,
        onSecondary: null,
    });

    const {
        subscription: mySubscription,
        bookAccess,
        refresh: refreshSubscription,
        loading: subLoading,
        busyPlanId,
        error,
        isCurrentPlan: isCurrentPlanId,
        hasLivePlan,
        lockOtherPlans,
        buyPlan,
        cancelPlan,
        restorePlan,
        hasCancelledActivePlan
    } = useSubscriptionContext();

    useEffect(() => {
        refreshSubscription?.();
    }, [refreshSubscription]);

    const {
        plans: rawPlans,
        yearlySaving,
        loading: plansLoading,
        error: plansError,
        getYearlyPrice,
    } = usePlanCatalog();

    useEffect(() => {
        let mounted = true;

        getMyPaymentHistory()
            .then(({ data }) => {
                if (mounted) setPayments(data.payments || []);
            })
            .catch(() => { })
            .finally(() => mounted && setPaymentsLoading(false));

        return () => {
            mounted = false;
        };
    }, [mySubscription]);


    const plans = useMemo(() => {
        return [...rawPlans]
            .sort(
                (a, b) =>
                    (a.monthlyPrice ?? 0) - (b.monthlyPrice ?? 0)
            )
            .map((plan) => ({
                ...plan,
                price:
                    billing === "monthly"
                        ? plan.monthlyPrice
                        : getYearlyPrice(plan.monthlyPrice),
            }));
    }, [rawPlans, billing, getYearlyPrice]);

    const isCurrentPlan = (plan) => isCurrentPlanId(plan.planId);

    const closeAlert = () =>
        setAlert((prev) => ({
            ...prev,
            isOpen: false,
        }));

    const handleBuy = (plan) => {
        if (hasCancelledActivePlan) {
            if (isCurrentPlan(plan)) {
                handleSubscriptionAction("restore");
                return;
            }

            // A different plan: let the user choose - restore the plan they
            // already paid for, or go ahead and buy the new one.
            const currentName =
                mySubscription?.planDisplayName || mySubscription?.planName;

            setAlert({
                isOpen: true,
                type: "info",
                title: "Restore or buy new?",
                message: `${currentName} is cancelled but active until ${formatDate(
                    mySubscription?.endDate
                )}. Restore it, or buy ${plan.name} now - it starts right away and replaces ${currentName} (no refund for the remaining time).`,
                primaryText: "Buy new plan",
                secondaryText: "Restore plan",
                onPrimary: () => {
                    closeAlert();
                    buyPlan(plan, billing);
                },
                onSecondary: async () => {
                    closeAlert();
                    await restorePlan();
                },
            });

            return;
        }

        buyPlan(plan, billing);
    };

    // Confirm before cancelling/restoring the subscription
    const handleSubscriptionAction = (action) => {
        const isCancel = action === "cancel";

        setAlert({
            isOpen: true,
            type: isCancel ? "confirm" : "info",
            title: isCancel ? "Cancel plan?" : "Restore plan?",
            message: isCancel
                ? "Are you sure you want to cancel your plan?"
                : "Are you sure you want to restore your plan?",
            primaryText: isCancel ? "Cancel plan" : "Restore plan",
            secondaryText: "No",
            onPrimary: async () => {
                setAlert((prev) => ({
                    ...prev,
                    isOpen: false,
                }));

                if (isCancel) {
                    await cancelPlan("");
                } else {
                    await restorePlan();
                }
            },
            onSecondary: () => {
                setAlert((prev) => ({
                    ...prev,
                    isOpen: false,
                }));
            },
        });
    };

    return (
        <div>
            {/* Billing toggle */}
            <div className="mb-5 flex items-center justify-between gap-3">
                <p
                    className="text-sm"
                    style={{ color: tokens.inkSoft }}
                >
                    Choose the plan that fits you best.
                </p>

                <div
                    className="flex h-9 w-47.5 shrink-0 rounded-full border p-1"
                    style={{ borderColor: tokens.line }}
                >
                    <button
                        type="button"
                        onClick={() => setBilling("monthly")}
                        className="flex flex-1 items-center justify-center rounded-full text-xs font-semibold transition-colors"
                        style={{
                            background:
                                billing === "monthly"
                                    ? tokens.purple
                                    : "transparent",
                            color:
                                billing === "monthly"
                                    ? "var(--surface)"
                                    : tokens.ink,
                        }}
                    >
                        Monthly
                    </button>

                    <button
                        type="button"
                        onClick={() => setBilling("yearly")}
                        className="flex flex-1 items-center justify-center rounded-full text-xs font-semibold transition-colors"
                        style={{
                            background:
                                billing === "yearly"
                                    ? tokens.purple
                                    : "transparent",
                            color:
                                billing === "yearly"
                                    ? "var(--surface)"
                                    : tokens.ink,
                        }}
                    >
                        Yearly
                    </button>
                </div>
            </div>

            {/* Plan cards */}
            {plansLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="h-70 animate-pulse rounded-2xl bg-(--tint)"
                        />
                    ))}
                </div>
            ) : plans.length === 0 ? (
                <div
                    className="rounded-xl border border-dashed p-6 text-center text-sm"
                    style={{
                        borderColor: tokens.line,
                        color: tokens.inkSoft,
                    }}
                >
                    {plansError ||
                        "No plans are available right now."}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => {
                        const Icon =
                            iconByKey[plan.iconKey] || Star;

                        const isFree =
                            plan.monthlyPrice === 0;

                        const owned = isCurrentPlan(plan);

                        // Cancelled but still running: its own card offers Restore.
                        const restorable = owned && hasCancelledActivePlan;

                        const isBusy =
                            busyPlanId === plan.planId;

                        const lockedByOtherPlan =
                            !isFree &&
                            !owned &&
                            lockOtherPlans;

                        const lockedFree =
                            isFree &&
                            !owned &&
                            hasLivePlan;

                        const locked =
                            lockedByOtherPlan || lockedFree;

                        let buttonLabel = "Buy now";

                        if (restorable)
                            buttonLabel = "Restore plan";
                        else if (owned)
                            buttonLabel = "Current Plan";
                        else if (isBusy)
                            buttonLabel = "Processing…";
                        else if (lockedFree)
                            buttonLabel =
                                "Available after your plan ends";
                        else if (lockedByOtherPlan)
                            buttonLabel =
                                "Cancel current plan first";
                        else if (isFree)
                            buttonLabel = "Start free";

                        return (
                            <div
                                key={plan.planId}
                                className="relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                                style={{
                                    borderColor: plan.popular
                                        ? tokens.purple
                                        : tokens.line,
                                }}
                            >
                                {plan.popular && (
                                    <span
                                        className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
                                        style={{
                                            background:
                                                tokens.purple,
                                        }}
                                    >
                                        Popular
                                    </span>
                                )}

                                <div
                                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                                    style={{
                                        background:
                                            tokens.purpleTint,
                                        color: tokens.purple,
                                    }}
                                >
                                    <Icon size={18} />
                                </div>

                                <div
                                    className="font-bold"
                                    style={{
                                        color: tokens.ink,
                                    }}
                                >
                                    {plan.name}
                                </div>

                                <div
                                    className="mb-1 text-2xl font-extrabold"
                                    style={{
                                        color: tokens.ink,
                                    }}
                                >
                                    {isFree
                                        ? "Free"
                                        : `₹${plan.price}`}{" "}
                                    {!isFree && (
                                        <span
                                            className="text-sm font-medium"
                                            style={{
                                                color:
                                                    tokens.inkSoft,
                                            }}
                                        >
                                            /{" "}
                                            {billing === "monthly"
                                                ? "month"
                                                : "year"}
                                        </span>
                                    )}
                                </div>

                                {!isFree &&
                                    billing === "yearly" &&
                                    yearlySaving > 0 && (
                                        <div className="mb-2 text-xs font-semibold text-emerald-600">
                                            Save {yearlySaving}%
                                            yearly
                                        </div>
                                    )}

                                <ul
                                    className="mb-4 mt-2 flex flex-1 flex-col gap-2 text-sm"
                                    style={{
                                        color: tokens.inkSoft,
                                    }}
                                >
                                    {plan.features.map(
                                        (f, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start gap-2"
                                            >
                                                <Check
                                                    size={15}
                                                    className="mt-0.5 shrink-0"
                                                    style={{
                                                        color:
                                                            tokens.purple,
                                                    }}
                                                />
                                                <span>
                                                    {f}
                                                </span>
                                            </li>
                                        )
                                    )}
                                </ul>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleBuy(plan)
                                    }
                                    disabled={
                                        (owned && !restorable) ||
                                        isBusy ||
                                        subLoading ||
                                        locked
                                    }
                                    title={
                                        lockedByOtherPlan
                                            ? "Cancel your current plan to switch"
                                            : lockedFree
                                                ? "You can switch to the free plan once your current plan ends"
                                                : undefined
                                    }
                                    className="h-10 w-full rounded-xl text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                                    style={{
                                        background: owned && !restorable
                                            ? tokens.inkSoft
                                            : buttonBg[
                                            plan.button
                                            ] ||
                                            buttonBg.blue,
                                    }}
                                >
                                    {buttonLabel}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Current plan status */}
            {mySubscription && hasLivePlan && (
                <div
                    className="mt-5 flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{
                        borderColor: tokens.line,
                        background: tokens.purpleTint,
                    }}
                >
                    <div
                        className="text-sm"
                        style={{ color: tokens.ink }}
                    >
                        {mySubscription.cancelRequested ? (
                            <>
                                <span className="font-bold text-amber-700">
                                    Cancelled
                                </span>{" "}
                                — you'll keep{" "}
                                <span className="font-semibold capitalize">
                                    {mySubscription.planDisplayName ||
                                        mySubscription.planName}
                                </span>{" "}
                                access until{" "}
                                <span className="font-semibold">
                                    {formatDate(
                                        mySubscription.endDate
                                    )}
                                </span>
                                . No refund is issued, but you can
                                restore it any time before then.
                            </>
                        ) : (
                            <>
                                Current plan:{" "}
                                <span className="font-semibold capitalize">
                                    {mySubscription.planDisplayName ||
                                        mySubscription.planName}
                                </span>{" "}
                                ({mySubscription.billingCycle}) —
                                valid until{" "}
                                <span className="font-semibold">
                                    {formatDate(
                                        mySubscription.endDate
                                    )}
                                </span>
                            </>
                        )}

                        {bookAccess &&
                            bookAccess.limit !== 0 && (
                                <div className="mt-1 text-xs font-semibold">
                                    Books created:{" "}
                                    {bookAccess.currentUsage} of{" "}
                                    {bookAccess.limit}
                                </div>
                            )}
                    </div>

                    {mySubscription.planName !== undefined &&
                        mySubscription.amount > 0 &&
                        (mySubscription.cancelRequested ? (
                            <button
                                type="button"
                                onClick={() =>
                                    handleSubscriptionAction(
                                        "restore"
                                    )
                                }
                                disabled={subLoading}
                                className="h-9 shrink-0 rounded-lg px-4 text-xs font-bold text-white shadow-sm disabled:opacity-60"
                                style={{
                                    background: tokens.purple,
                                }}
                            >
                                Restore plan
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() =>
                                    handleSubscriptionAction(
                                        "cancel"
                                    )
                                }
                                disabled={subLoading}
                                className="h-9 shrink-0 rounded-lg border border-red-200 bg-white px-4 text-xs font-bold text-red-500 shadow-sm disabled:opacity-60"
                            >
                                Cancel subscription
                            </button>
                        ))}
                </div>
            )}

            {error && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-600">
                    {error}
                </div>
            )}

            {/* Payment history */}
            <div className="mt-8">
                <h3
                    className="mb-3 text-sm font-bold"
                    style={{ color: tokens.ink }}
                >
                    Payment history
                </h3>

                {paymentsLoading ? (
                    <div className="h-16 animate-pulse rounded-xl bg-(--tint)" />
                ) : payments.length === 0 ? (
                    <div
                        className="flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm"
                        style={{
                            borderColor: tokens.line,
                            color: tokens.inkSoft,
                        }}
                    >
                        <Clock size={15} /> No payments yet.
                    </div>
                ) : (
                    <div
                        className="overflow-x-auto rounded-xl border"
                        style={{ borderColor: tokens.line }}
                    >
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr
                                    style={{
                                        background:
                                            tokens.purpleTint,
                                        color:
                                            tokens.purpleDeep,
                                    }}
                                >
                                    <th className="px-4 py-2 font-semibold">
                                        Plan
                                    </th>
                                    <th className="px-4 py-2 font-semibold">
                                        Billing
                                    </th>
                                    <th className="px-4 py-2 font-semibold">
                                        Amount
                                    </th>
                                    <th className="px-4 py-2 font-semibold">
                                        Status
                                    </th>
                                    <th className="px-4 py-2 font-semibold">
                                        Paid on
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {payments.map((p, i) => (
                                    <tr
                                        key={p._id || i}
                                        className="border-t"
                                        style={{
                                            borderColor:
                                                tokens.line,
                                        }}
                                    >
                                        <td
                                            className="px-4 py-2 capitalize"
                                            style={{
                                                color:
                                                    tokens.ink,
                                            }}
                                        >
                                            {p.planName}
                                        </td>

                                        <td
                                            className="px-4 py-2 capitalize"
                                            style={{
                                                color:
                                                    tokens.inkSoft,
                                            }}
                                        >
                                            {p.billingCycle}
                                        </td>

                                        <td
                                            className="px-4 py-2"
                                            style={{
                                                color:
                                                    tokens.ink,
                                            }}
                                        >
                                            ₹{p.amount}
                                        </td>

                                        <td
                                            className="px-4 py-2 capitalize"
                                            style={{
                                                color:
                                                    tokens.inkSoft,
                                            }}
                                        >
                                            {p.status}
                                        </td>

                                        <td
                                            className="px-4 py-2"
                                            style={{
                                                color:
                                                    tokens.inkSoft,
                                            }}
                                        >
                                            {formatDate(
                                                p.paidAt ||
                                                p.createdAt
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Custom Wonder Books confirmation modal */}
            <WonderAlertModal
                isOpen={alert.isOpen}
                onClose={() =>
                    setAlert((prev) => ({
                        ...prev,
                        isOpen: false,
                    }))
                }
                type={alert.type}
                title={alert.title}
                message={alert.message}
                primaryText={alert.primaryText}
                secondaryText={alert.secondaryText}
                onPrimary={alert.onPrimary}
                onSecondary={alert.onSecondary}
            />
        </div>
    );
};

export default SubscriptionPanel;