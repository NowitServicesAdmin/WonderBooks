import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    BookOpen,
    ShoppingBag,
    Crown,
    ChevronRight,
    ChevronDown,
    UserPlus,
    ShoppingCart,
    Star,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getDashboardStats, getDashboardSeries, apiErrorMessage } from "../../services/adminService";
import { timeAgo } from "../../utils/adminFormat";

const CARD_META = [
    { key: "totalUsers", label: "Total Users", icon: Users, iconBg: "bg-[var(--tint)]", iconColor: "text-[#7c3aed]" },
    { key: "totalBooks", label: "Total Books Generated", icon: BookOpen, iconBg: "bg-[var(--tint)]", iconColor: "text-[#7c3aed]" },
    { key: "booksOrdered", label: "Books Ordered", icon: ShoppingCart, iconBg: "bg-[#fef3e2]", iconColor: "text-[#f5a524]" },
    { key: "activeSubscriptions", label: "Active Subscriptions", icon: Crown, iconBg: "bg-[#fef3e2]", iconColor: "text-[#f5a524]" },
];

const ACTIVITY_ICONS = { user: UserPlus, order: ShoppingCart, subscription: Star };

// Last 5 calendar months (oldest first), as { value: "YYYY-MM", label: "September" }.
const buildMonthOptions = () => {
    const now = new Date();
    return Array.from({ length: 5 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
        return {
            value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            label: d.toLocaleString("en-US", { month: "long" }),
        };
    });
};

const quickActions = [
    { icon: Users, label: "Manage Users", route: "/superadmin/users" },
    { icon: ShoppingBag, label: "View Orders", route: "/superadmin/orders" },
    { icon: Crown, label: "Add Subscription", route: "/superadmin/subscriptions" },
];

// Small reusable dropdown for picking a month. Selection is kept in the
// parent's state so it persists as the user interacts with the dashboard.
const MonthDropdown = ({ value, options, onChange }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-lg border border-(--tint) px-3 py-1.5 text-sm font-semibold text-(--text-heading) hover:bg-(--tint)"
            >
                {options.find((o) => o.value === value)?.label}
                <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <>
                    {/* click-away layer */}
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-lg border border-(--tint) bg-white shadow-lg">
                        {options.map((m) => (
                            <button
                                key={m.value}
                                type="button"
                                onClick={() => {
                                    onChange(m.value);
                                    setOpen(false);
                                }}
                                className={`block w-full px-3 py-2 text-left text-sm font-medium hover:bg-(--tint) ${m.value === value ? "bg-(--tint) text-(--accent)" : "text-(--text-heading)"
                                    }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const monthOptions = useMemo(() => buildMonthOptions(), []);
    const currentMonth = monthOptions[monthOptions.length - 1].value;

    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const [userGrowthMonth, setUserGrowthMonth] = useState(currentMonth);
    const [bookOrdersMonth, setBookOrdersMonth] = useState(currentMonth);
    const [userGrowthData, setUserGrowthData] = useState([]);
    const [bookOrdersData, setBookOrdersData] = useState([]);

    const loadStats = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { data } = await getDashboardStats();
            setStats(data.stats);
            setActivity(data.activity || []);
        } catch (err) {
            setError(apiErrorMessage(err, "Failed to load dashboard"));
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch-on-change; same pattern used elsewhere in the app.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadStats();
    }, [loadStats]);

    useEffect(() => {
        let cancelled = false;
        getDashboardSeries("users", userGrowthMonth)
            .then(({ data }) => !cancelled && setUserGrowthData(data.points))
            .catch(() => !cancelled && setUserGrowthData([]));
        return () => { cancelled = true; };
    }, [userGrowthMonth]);

    useEffect(() => {
        let cancelled = false;
        getDashboardSeries("orders", bookOrdersMonth)
            .then(({ data }) => !cancelled && setBookOrdersData(data.points))
            .catch(() => !cancelled && setBookOrdersData([]));
        return () => { cancelled = true; };
    }, [bookOrdersMonth]);

    const handleQuickAction = (route) => navigate(route);

    return (
        <div className="p-2">
            {/* Stat Cards */}
            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {error && (
                    <div className="col-span-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}{" "}
                        <button onClick={loadStats} className="font-semibold underline">Retry</button>
                    </div>
                )}
                {CARD_META.map((card) => {
                    const Icon = card.icon;
                    const stat = stats?.[card.key];
                    const change = stat?.change ?? 0;
                    return (
                        <div
                            key={card.label}
                            className="relative overflow-hidden rounded-2xl border border-(--tint) bg-white p-2"
                        >
                            {/* faded watermark icon in the background */}
                            <Icon
                                size={50}
                                strokeWidth={1.5}
                                className="pointer-events-none absolute -right-1 text-[#f2eefd] opacity-70"
                            />

                            <div className="relative flex items-center gap-3">
                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="text-sm font-medium text-[#8b84a3]">{card.label}</div>
                            </div>

                            <div className="relative mt-3 text-3xl font-extrabold text-(--ink)">{loading ? "…" : (stat?.value ?? 0).toLocaleString("en-IN")}</div>

                            {!loading && stat && (
                                <div className={`relative mt-1 text-sm font-semibold ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
                                    {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% vs last month
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Charts */}
            <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-(--tint) bg-white p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold">User Growth</h3>
                        <MonthDropdown value={userGrowthMonth} options={monthOptions} onChange={setUserGrowthMonth} />
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={userGrowthData}>
                            <XAxis dataKey="date" interval={4} tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                            <Tooltip labelFormatter={(d) => `Day ${d}`} formatter={(v) => [v, "Total users"]} />
                            <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="rounded-2xl border border-(--tint) bg-white p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold">Book Orders</h3>
                        <MonthDropdown value={bookOrdersMonth} options={monthOptions} onChange={setBookOrdersMonth} />
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={bookOrdersData}>
                            <XAxis dataKey="date" interval={4} tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                            <Tooltip labelFormatter={(d) => `Day ${d}`} formatter={(v) => [v, "Orders"]} />
                            <Bar dataKey="value" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Activity + Quick Actions */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-(--tint) bg-white p-5">
                    <h3 className="mb-4 text-lg font-bold">Recent Activity</h3>
                    <div className="flex flex-col gap-4">
                        {!loading && activity.length === 0 && (
                            <div className="text-sm text-(--text-muted)">No recent activity yet.</div>
                        )}
                        {activity.map((item, i) => {
                            const Icon = ACTIVITY_ICONS[item.type] || Star;
                            return (
                                <div key={i} className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--tint) text-(--accent)">
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <div className="text-base font-semibold">{item.title}</div>
                                            <div className="text-sm text-(--text-muted)">{item.detail}</div>
                                        </div>
                                    </div>
                                    <span className="text-sm text-(--text-muted)">{timeAgo(item.at)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-2xl border border-(--tint) bg-white p-5">
                    <h3 className="mb-4 text-lg font-bold">Quick Actions</h3>
                    <div className="flex flex-col gap-2">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.label}
                                    onClick={() => handleQuickAction(action.route)}
                                    className="flex items-center justify-between rounded-xl border border-(--tint) px-4 py-3 text-base font-semibold hover:bg-(--tint)"
                                >
                                    <span className="flex items-center gap-3">
                                        <Icon size={18} className="text-(--accent)" />
                                        {action.label}
                                    </span>
                                    <ChevronRight size={18} className="text-(--text-muted)" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};