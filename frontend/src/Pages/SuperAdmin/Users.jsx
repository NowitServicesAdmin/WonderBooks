import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter } from "lucide-react";
import { getUsers, apiErrorMessage } from "../../services/adminService";
import { useDebounce } from "../../hooks/useDebounce";
import { Pagination } from "../../Components/admin/Pagination";
import { TableState } from "../../Components/admin/TableState";
import { UserFormDialog } from "../../Components/admin/userFormDialog";
import { formatDate } from "../../utils/adminFormat";

const PAGE_SIZE = 10;
const STATUS_FILTERS = [
    { value: "", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "blocked", label: "Blocked" },
    { value: "pending", label: "Pending" },
];
const ROLE_LABELS = { user: "User", "super admin": "Super Admin" };

const statusStyles = {
    Active: "bg-green-50 text-green-600",
    Blocked: "bg-red-50 text-red-600",
    Pending: "bg-amber-50 text-amber-600",
};

const StatusBadge = ({ status }) => (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
    </span>
);

export function SuperAdminUsers() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchInput, setSearchInput] = useState("");
    const search = useDebounce(searchInput);
    const [status, setStatus] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);

    const [addOpen, setAddOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { data } = await getUsers({ page, limit: PAGE_SIZE, search, status });
            setUsers(data.users);
            setTotal(data.total);
            setPages(data.pages);
        } catch (err) {
            setError(apiErrorMessage(err, "Failed to load users"));
        } finally {
            setLoading(false);
        }
    }, [page, search, status]);

    // Fetch-on-change; same pattern used elsewhere in the app.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const activeFilter = STATUS_FILTERS.find((f) => f.value === status);

    return (
        <div className="px-4 py-2">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold">Users</h1>
                    <p className="text-sm text-(--text-muted)">View and manage all users of the platform</p>
                </div>
                <button
                    onClick={() => setAddOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-(--accent) px-4 py-2.5 text-sm font-semibold text-white"
                >
                    <Plus size={16} /> Add User
                </button>
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
                        placeholder="Search users by name, email or ID..."
                        className="w-full text-sm outline-none"
                    />
                </div>
                <div className="relative">
                    <button
                        onClick={() => setFilterOpen((o) => !o)}
                        className={`flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold ${status ? "border-(--accent) text-(--accent)" : "border-(--tint)"
                            }`}
                    >
                        <Filter size={16} /> {status ? activeFilter.label : "Filter"}
                    </button>
                    {filterOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                            <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-lg border border-(--tint) bg-white shadow-lg">
                                {STATUS_FILTERS.map((f) => (
                                    <button
                                        key={f.value}
                                        onClick={() => {
                                            setStatus(f.value);
                                            setPage(1);
                                            setFilterOpen(false);
                                        }}
                                        className={`block w-full px-3 py-2 text-left text-sm font-medium hover:bg-(--tint) ${f.value === status ? "bg-(--tint) text-(--accent)" : ""
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

            <div className="overflow-x-auto rounded-2xl border border-(--tint) bg-white">
                <table className="w-full min-w-150 text-sm">
                    <thead className="border-(--tint) bg-(--tint) ">
                        <tr className="border-b border-(--tint) text-left text-(--text-muted)">
                            <th className="px-4 py-3 font-semibold">UserID</th>
                            <th className="px-4 py-3 font-semibold">Name</th>
                            <th className="px-4 py-3 font-semibold">Email</th>
                            <th className="px-4 py-3 font-semibold">Role</th>
                            <th className="px-4 py-3 font-semibold">Plan</th>
                            <th className="px-4 py-3 font-semibold">Joined On</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <TableState
                            loading={loading}
                            error={error}
                            empty={!loading && !error && users.length === 0}
                            colSpan={7}
                            onRetry={load}
                        />
                        {!loading &&
                            !error &&
                            users.map((user) => (
                                <tr
                                    key={user._id}
                                    className="border-b border-(--tint) transition-colors last:border-0 hover:bg-(--tint)"
                                >
                                    <td className="px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/superadmin/users/${user._id}`)}
                                            title="Open user"
                                            className="font-semibold text-(--accent) hover:underline"
                                        >
                                            {user.code}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2 font-semibold">{user.name || "—"}</div>
                                    </td>
                                    <td className="px-4 py-3 text-(--text-muted)">{user.email}</td>
                                    <td className="px-4 py-3 text-(--text-muted)">{ROLE_LABELS[user.role] || user.role}</td>
                                    <td className="px-4 py-3 text-(--text-muted)">{user.plan || "—"}</td>
                                    <td className="px-4 py-3 text-(--text-muted)">{formatDate(user.joinedAt)}</td>
                                    <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} label="users" onPage={setPage} />

            {addOpen && (
                <UserFormDialog
                    user={null}
                    isSelf={false}
                    onClose={() => setAddOpen(false)}
                    onSaved={() => {
                        setAddOpen(false);
                        load();
                    }}
                />
            )}
        </div>
    );
}
