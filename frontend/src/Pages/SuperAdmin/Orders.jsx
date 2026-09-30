import { useState, useEffect, useCallback } from "react";
import { Search, Filter } from "lucide-react";
import { getOrders, updateOrderStatus, apiErrorMessage } from "../../services/adminService";
import { useDebounce } from "../../hooks/useDebounce";
import { Pagination } from "../../Components/admin/Pagination";
import { TableState } from "../../Components/admin/TableState";
import { formatDate, formatMoney } from "../../utils/adminFormat";

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
    { value: "", label: "All Status" },
    { value: "confirmed", label: "Confirmed" },
    { value: "printing", label: "Printing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "pending_payment", label: "Awaiting Payment" },
];

const statusMeta = {
    pending_payment: { label: "Awaiting Payment", cls: "bg-gray-100 text-gray-500" },
    confirmed: { label: "Confirmed", cls: "bg-purple-50 text-purple-600" },
    printing: { label: "Printing", cls: "bg-orange-50 text-orange-500" },
    shipped: { label: "Shipped", cls: "bg-blue-50 text-blue-600" },
    delivered: { label: "Delivered", cls: "bg-green-50 text-green-600" },
    cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-500" },
};

// Statuses admin can move an order to (paid orders only; see backend rules).
const UPDATE_OPTIONS = ["confirmed", "printing", "shipped", "delivered", "cancelled"];

function StatusBadge({ status }) {
    const meta = statusMeta[status] || { label: status, cls: "bg-gray-100 text-gray-500" };
    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.cls}`}>{meta.label}</span>;
}

export function SuperAdminOrders() {
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [revenue, setRevenue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);

    const [searchInput, setSearchInput] = useState("");
    const search = useDebounce(searchInput);
    const [status, setStatus] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { data } = await getOrders({ page, limit: PAGE_SIZE, search, status });
            setOrders(data.orders);
            setTotal(data.total);
            setPages(data.pages);
            setRevenue(data.revenue);
        } catch (err) {
            setError(apiErrorMessage(err, "Failed to load orders"));
        } finally {
            setLoading(false);
        }
    }, [page, search, status]);

    // Fetch-on-change; same pattern used elsewhere in the app.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const changeStatus = async (order, next) => {
        if (next === order.status) return;
        if (next === "cancelled" && !window.confirm(`Cancel order ${order.orderNumber}? This can't be undone.`)) return;

        setUpdatingId(order._id);
        setActionError("");
        try {
            const { data } = await updateOrderStatus(order._id, next);
            setOrders((prev) => prev.map((o) => (o._id === order._id ? data.order : o)));
        } catch (err) {
            setActionError(apiErrorMessage(err, "Failed to update order"));
        } finally {
            setUpdatingId(null);
        }
    };

    const activeFilter = STATUS_FILTERS.find((f) => f.value === status);

    return (
        <div className="px-4 py-2">
            <div className="mb-6 flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold">Orders</h1>
                    <p className="text-sm text-(--text-muted)">View and track all book orders</p>
                </div>
                <div className="text-right">
                    <div className="text-xs font-medium text-(--text-muted)">Total revenue</div>
                    <div className="text-xl font-extrabold text-(--ink)">{formatMoney(revenue)}</div>
                </div>
            </div>

            <div className="mb-4 flex items-center gap-3">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-(--tint) bg-white px-3 py-2.5">
                    <Search size={16} className="text-(--text-muted)" />
                    <input
                        value={searchInput}
                        onChange={(e) => {
                            setSearchInput(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search by order ID, book or user..."
                        className="w-full text-sm outline-none"
                    />
                </div>
                <div className="relative">
                    <button
                        onClick={() => setFilterOpen((o) => !o)}
                        className={`flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold ${
                            status ? "border-(--accent) text-(--accent)" : "border-(--tint)"
                        }`}
                    >
                        <Filter size={16} /> {status ? activeFilter.label : "Filter"}
                    </button>
                    {filterOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                            <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-(--tint) bg-white shadow-lg">
                                {STATUS_FILTERS.map((f) => (
                                    <button
                                        key={f.value}
                                        onClick={() => {
                                            setStatus(f.value);
                                            setPage(1);
                                            setFilterOpen(false);
                                        }}
                                        className={`block w-full px-3 py-2 text-left text-sm font-medium hover:bg-(--tint) ${
                                            f.value === status ? "bg-(--tint) text-(--accent)" : ""
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {actionError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                    {actionError}
                </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-(--tint) bg-white">
                <table className="w-full min-w-150 text-sm">
                    <thead>
                        <tr className="border-b border-(--tint) text-left text-(--text-muted)">
                            <th className="px-4 py-3 font-semibold">Order ID</th>
                            <th className="px-4 py-3 font-semibold">User</th>
                            <th className="px-4 py-3 font-semibold">Book</th>
                            <th className="px-4 py-3 font-semibold">Date</th>
                            <th className="px-4 py-3 font-semibold">Amount</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Update</th>
                        </tr>
                    </thead>
                    <tbody>
                        <TableState
                            loading={loading}
                            error={error}
                            empty={!loading && !error && orders.length === 0}
                            colSpan={7}
                            onRetry={load}
                        />
                        {!loading &&
                            !error &&
                            orders.map((order) => {
                                const locked =
                                    order.status === "delivered" ||
                                    order.status === "cancelled" ||
                                    order.paymentStatus !== "paid";
                                return (
                                    <tr key={order._id} className="border-b border-(--tint) last:border-0">
                                        <td className="px-4 py-3 font-semibold">{order.orderNumber}</td>
                                        <td className="px-4 py-3">
                                            <div>{order.user?.name || order.shippingAddress?.name || "—"}</div>
                                            <div className="text-xs text-(--text-muted)">{order.user?.email || "Deleted user"}</div>
                                        </td>
                                        <td className="px-4 py-3 text-(--text-muted)">{order.book?.title}</td>
                                        <td className="px-4 py-3 text-(--text-muted)">{formatDate(order.createdAt)}</td>
                                        <td className="px-4 py-3 text-(--text-muted)">{formatMoney(order.amount, order.currency)}</td>
                                        <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                                        <td className="px-4 py-3">
                                            {locked ? (
                                                <span className="text-xs text-(--text-muted)">—</span>
                                            ) : (
                                                <select
                                                    value={order.status}
                                                    disabled={updatingId === order._id}
                                                    onChange={(e) => changeStatus(order, e.target.value)}
                                                    className="rounded-lg border border-(--tint) bg-white px-2 py-1.5 text-xs font-semibold disabled:opacity-50"
                                                >
                                                    {UPDATE_OPTIONS.map((s) => (
                                                        <option key={s} value={s}>
                                                            {statusMeta[s].label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} label="orders" onPage={setPage} />
        </div>
    );
}
