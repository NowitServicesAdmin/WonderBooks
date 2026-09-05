import { useState, useMemo } from "react";
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
import { LineChart, Line, BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";

const statCards = [
    {
        label: "Total Users",
        value: "1,248",
        change: "12%",
        icon: Users,
        iconBg: "bg-[#efeafd]",
        iconColor: "text-[#7c3aed]",
    },
    {
        label: "Total Books Generated",
        value: "5,892",
        change: "18%",
        icon: BookOpen,
        iconBg: "bg-[#efeafd]",
        iconColor: "text-[#7c3aed]",
    },
    {
        label: "Books Ordered",
        value: "1,432",
        change: "10%",
        icon: ShoppingCart,
        iconBg: "bg-[#fef3e2]",
        iconColor: "text-[#f5a524]",
    },
    {
        label: "Active Subscriptions",
        value: "856",
        change: "8%",
        icon: Crown,
        iconBg: "bg-[#fef3e2]",
        iconColor: "text-[#f5a524]",
    },
];

const MONTHS = ["May", "June", "July", "August", "September"];

// Mock per-month datasets so the dropdown selection actually changes the charts.
const userGrowthByMonth = {
    May: [
        { date: "1", value: 40 }, { date: "5", value: 55 }, { date: "10", value: 70 },
        { date: "15", value: 95 }, { date: "20", value: 120 }, { date: "25", value: 150 }, { date: "30", value: 180 },
    ],
    June: [
        { date: "1", value: 60 }, { date: "5", value: 80 }, { date: "10", value: 100 },
        { date: "15", value: 130 }, { date: "20", value: 160 }, { date: "25", value: 200 }, { date: "30", value: 240 },
    ],
    July: [
        { date: "1", value: 70 }, { date: "5", value: 95 }, { date: "10", value: 115 },
        { date: "15", value: 150 }, { date: "20", value: 190 }, { date: "25", value: 230 }, { date: "30", value: 270 },
    ],
    August: [
        { date: "1", value: 80 }, { date: "5", value: 110 }, { date: "10", value: 140 },
        { date: "15", value: 175 }, { date: "20", value: 220 }, { date: "25", value: 280 }, { date: "30", value: 330 },
    ],
    September: [
        { date: "1", value: 90 }, { date: "5", value: 130 }, { date: "10", value: 160 },
        { date: "15", value: 210 }, { date: "20", value: 260 }, { date: "25", value: 340 }, { date: "30", value: 400 },
    ],
};

const bookOrdersByMonth = {
    May: [
        { date: "1", value: 30 }, { date: "5", value: 45 }, { date: "10", value: 40 },
        { date: "15", value: 60 }, { date: "20", value: 75 }, { date: "25", value: 90 }, { date: "30", value: 100 },
    ],
    June: [
        { date: "1", value: 40 }, { date: "5", value: 60 }, { date: "10", value: 55 },
        { date: "15", value: 85 }, { date: "20", value: 100 }, { date: "25", value: 120 }, { date: "30", value: 135 },
    ],
    July: [
        { date: "1", value: 45 }, { date: "5", value: 70 }, { date: "10", value: 60 },
        { date: "15", value: 95 }, { date: "20", value: 110 }, { date: "25", value: 135 }, { date: "30", value: 150 },
    ],
    August: [
        { date: "1", value: 50 }, { date: "5", value: 80 }, { date: "10", value: 65 },
        { date: "15", value: 105 }, { date: "20", value: 125 }, { date: "25", value: 150 }, { date: "30", value: 170 },
    ],
    September: [
        { date: "1", value: 60 }, { date: "5", value: 90 }, { date: "10", value: 70 },
        { date: "15", value: 120 }, { date: "20", value: 140 }, { date: "25", value: 170 }, { date: "30", value: 190 },
    ],
};

const recentActivity = [
    { icon: UserPlus, title: "New user registered", detail: "priya.k@gmail.com", time: "2 minutes ago" },
    { icon: ShoppingCart, title: "Book ordered", detail: "The Brave Little Explorer", time: "12 minutes ago" },
    { icon: Star, title: "Subscription upgraded", detail: "Family Plan", time: "25 minutes ago" },
];

const quickActions = [
    { icon: Users, label: "Manage Users", route: "/superadmin/users" },
    { icon: ShoppingBag, label: "View Orders", route: "/superadmin/orders" },
    { icon: Crown, label: "Add Subscription", route: "/superadmin/subscriptions" },
];

// Small reusable dropdown for picking a month. Selection is kept in the
// parent's state so it persists as the user interacts with the dashboard.
const MonthDropdown = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-lg border border-[#eeeafa] px-3 py-1.5 text-sm font-semibold text-[#38314f] hover:bg-[#f5f1ff]"
            >
                {value}
                <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <>
                    {/* click-away layer */}
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-lg border border-[#eeeafa] bg-white shadow-lg">
                        {MONTHS.map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => {
                                    onChange(m);
                                    setOpen(false);
                                }}
                                className={`block w-full px-3 py-2 text-left text-sm font-medium hover:bg-[#f5f1ff] ${m === value ? "bg-[#f0eaff] text-[#5426c7]" : "text-[#38314f]"
                                    }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export const SuperAdminDashboard = ({ onNavigate }) => {
    const [userGrowthMonth, setUserGrowthMonth] = useState("September");
    const [bookOrdersMonth, setBookOrdersMonth] = useState("September");

    const userGrowthData = useMemo(() => userGrowthByMonth[userGrowthMonth], [userGrowthMonth]);
    const bookOrdersData = useMemo(() => bookOrdersByMonth[bookOrdersMonth], [bookOrdersMonth]);

    // Falls back to a normal client-side route change if no onNavigate prop
    // is supplied by the parent app.
    const handleQuickAction = (route) => {
        if (onNavigate) {
            onNavigate(route);
        } else {
            window.location.href = route;
        }
    };

    return (
        <div className="p-2">
            {/* Stat Cards */}
            <div className="mb-6 grid grid-cols-4 gap-5">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className="relative overflow-hidden rounded-2xl border border-[#eeeafa] bg-white p-2"
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

                            <div className="relative mt-3 text-3xl font-extrabold text-[#1c1730]">{card.value}</div>

                            <div className="relative mt-1 text-sm font-semibold text-green-600">
                                ↑ {card.change} this month
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts */}
            <div className="mb-6 grid grid-cols-2 gap-5">
                <div className="rounded-2xl border border-[#eeeafa] bg-white p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold">User Growth</h3>
                        <MonthDropdown value={userGrowthMonth} onChange={setUserGrowthMonth} />
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={userGrowthData}>
                            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#70698a" }} axisLine={false} tickLine={false} />
                            <Line type="monotone" dataKey="value" stroke="#5426c7" strokeWidth={2.5} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="rounded-2xl border border-[#eeeafa] bg-white p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold">Book Orders</h3>
                        <MonthDropdown value={bookOrdersMonth} onChange={setBookOrdersMonth} />
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={bookOrdersData}>
                            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#70698a" }} axisLine={false} tickLine={false} />
                            <Bar dataKey="value" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Activity + Quick Actions */}
            <div className="grid grid-cols-2 gap-5">
                <div className="rounded-2xl border border-[#eeeafa] bg-white p-5">
                    <h3 className="mb-4 text-lg font-bold">Recent Activity</h3>
                    <div className="flex flex-col gap-4">
                        {recentActivity.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <div key={i} className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0eaff] text-[#5426c7]">
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <div className="text-base font-semibold">{item.title}</div>
                                            <div className="text-sm text-[#70698a]">{item.detail}</div>
                                        </div>
                                    </div>
                                    <span className="text-sm text-[#70698a]">{item.time}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-2xl border border-[#eeeafa] bg-white p-5">
                    <h3 className="mb-4 text-lg font-bold">Quick Actions</h3>
                    <div className="flex flex-col gap-2">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.label}
                                    onClick={() => handleQuickAction(action.route)}
                                    className="flex items-center justify-between rounded-xl border border-[#eeeafa] px-4 py-3 text-base font-semibold hover:bg-[#f5f1ff]"
                                >
                                    <span className="flex items-center gap-3">
                                        <Icon size={18} className="text-[#5426c7]" />
                                        {action.label}
                                    </span>
                                    <ChevronRight size={18} className="text-[#70698a]" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};