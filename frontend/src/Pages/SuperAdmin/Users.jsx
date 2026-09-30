import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Search, Filter, MoreVertical, Eye, Pencil, ShieldOff, ShieldCheck, Trash2, X } from "lucide-react";
import {
    getUsers,
    getUserDetail,
    createUser,
    updateUser,
    setUserBlocked,
    deleteUser,
    apiErrorMessage,
} from "../../services/adminService";
import { useDebounce } from "../../hooks/useDebounce";
import { useAuth } from "../../context/AuthContext";
import { Pagination } from "../../Components/admin/Pagination";
import { TableState } from "../../Components/admin/TableState";
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

// Generic centered modal shell used by every dialog on this page.
const Modal = ({ title, onClose, children, width = "max-w-sm" }) => (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className={`relative w-full ${width} rounded-2xl bg-white p-6 shadow-2xl`}>
            <div className="mb-3 flex items-start justify-between">
                <h2 className="text-lg font-bold text-(--ink)">{title}</h2>
                <button onClick={onClose} className="text-(--text-muted) hover:text-(--accent)">
                    <X size={18} />
                </button>
            </div>
            {children}
        </div>
    </div>
);

// Small popover of actions anchored under the "..." button for a single row.
const ActionMenu = ({ user, isSelf, onClose, onView, onEdit, onBlockToggle, onDelete }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const isBlocked = user.isBlocked;

    return (
        <div
            ref={menuRef}
            className="absolute right-4 top-10 z-20 w-44 overflow-hidden rounded-xl border border-(--tint) bg-white shadow-lg"
        >
            <button onClick={() => onView(user)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium hover:bg-(--tint)">
                <Eye size={15} className="text-(--text-muted)" /> View Profile
            </button>
            <button onClick={() => onEdit(user)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium hover:bg-(--tint)">
                <Pencil size={15} className="text-(--text-muted)" /> Edit User
            </button>
            {!isSelf && (
                <>
                    <button
                        onClick={() => onBlockToggle(user)}
                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium hover:bg-(--tint) ${
                            isBlocked ? "text-green-600" : "text-red-600"
                        }`}
                    >
                        {isBlocked ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
                        {isBlocked ? "Unblock User" : "Block User"}
                    </button>
                    <button
                        onClick={() => onDelete(user)}
                        className="flex w-full items-center gap-2 border-t border-(--tint) px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-(--tint)"
                    >
                        <Trash2 size={15} /> Delete User
                    </button>
                </>
            )}
        </div>
    );
};

const ConfirmDialog = ({ title, message, confirmLabel, danger, busy, error, onCancel, onConfirm }) => (
    <Modal title={title} onClose={onCancel}>
        <p className="text-sm text-(--text-muted)">{message}</p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
            <button onClick={onCancel} className="rounded-lg border border-(--tint) px-4 py-2 text-sm font-semibold hover:bg-(--tint)">
                Cancel
            </button>
            <button
                onClick={onConfirm}
                disabled={busy}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                    danger ? "bg-red-600 hover:bg-red-700" : "bg-(--accent) hover:bg-(--accent-hover)"
                }`}
            >
                {busy ? "Please wait…" : confirmLabel}
            </button>
        </div>
    </Modal>
);

// Used for both "Add User" (user = null) and "Edit User".
const UserFormDialog = ({ user, isSelf, onClose, onSaved }) => {
    const editing = Boolean(user);
    const [form, setForm] = useState({
        name: user?.name || "",
        email: user?.email || "",
        role: user?.role || "user",
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            if (editing) await updateUser(user._id, form);
            else await createUser(form);
            onSaved();
        } catch (err) {
            setError(apiErrorMessage(err, "Failed to save user"));
            setBusy(false);
        }
    };

    const inputCls = "w-full rounded-lg border border-[var(--tint)] px-3 py-2 text-sm outline-none focus:border-[#c9b8f5]";

    return (
        <Modal title={editing ? "Edit User" : "Add User"} onClose={onClose}>
            <form onSubmit={submit} className="flex flex-col gap-3">
                <label className="text-sm font-semibold">
                    Name
                    <input className={`${inputCls} mt-1 font-normal`} value={form.name} onChange={set("name")} />
                </label>
                <label className="text-sm font-semibold">
                    Email
                    <input type="email" required className={`${inputCls} mt-1 font-normal`} value={form.email} onChange={set("email")} />
                </label>
                <label className="text-sm font-semibold">
                    Role
                    <select
                        className={`${inputCls} mt-1 font-normal`}
                        value={form.role}
                        onChange={set("role")}
                        disabled={isSelf}
                    >
                        <option value="user">User</option>
                        <option value="super admin">Super Admin</option>
                    </select>
                </label>
                {!editing && (
                    <p className="text-xs text-(--text-muted)">
                        The user can sign in with this email using the normal one-time code login.
                    </p>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="mt-2 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-lg border border-(--tint) px-4 py-2 text-sm font-semibold hover:bg-(--tint)">
                        Cancel
                    </button>
                    <button type="submit" disabled={busy} className="rounded-lg bg-(--accent) px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                        {busy ? "Saving…" : editing ? "Save Changes" : "Add User"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const ProfileRow = ({ label, value }) => (
    <div className="flex justify-between gap-4 border-b border-(--tint) py-2 text-sm last:border-0">
        <span className="text-(--text-muted)">{label}</span>
        <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
);

const ProfileDialog = ({ userId, onClose }) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        getUserDetail(userId)
            .then(({ data }) => !cancelled && setData(data))
            .catch((err) => !cancelled && setError(apiErrorMessage(err, "Failed to load profile")));
        return () => { cancelled = true; };
    }, [userId]);

    return (
        <Modal title="User Profile" onClose={onClose} width="max-w-md">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!data && !error && <p className="text-sm text-(--text-muted)">Loading…</p>}
            {data && (
                <div>
                    <ProfileRow label="User ID" value={data.user.code} />
                    <ProfileRow label="Name" value={data.user.name || "—"} />
                    <ProfileRow label="Email" value={data.user.email} />
                    <ProfileRow label="Role" value={ROLE_LABELS[data.user.role]} />
                    <ProfileRow label="Status" value={data.user.status} />
                    <ProfileRow label="Joined" value={formatDate(data.user.joinedAt)} />
                    <ProfileRow label="Books created" value={data.user.booksCount} />
                    <ProfileRow label="Orders placed" value={data.user.ordersCount} />
                    <ProfileRow
                        label="Subscription"
                        value={
                            data.subscription
                                ? `${data.subscription.planName} (${data.subscription.status}${
                                      data.subscription.endDate ? `, until ${formatDate(data.subscription.endDate)}` : ""
                                  })`
                                : "No subscription"
                        }
                    />
                    {data.recentBooks.length > 0 && (
                        <div className="mt-3">
                            <div className="mb-1 text-sm font-semibold">Recent books</div>
                            <ul className="text-sm text-(--text-muted)">
                                {data.recentBooks.map((b) => (
                                    <li key={b._id}>{b.title}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

export function SuperAdminUsers() {
    const { user: me } = useAuth();
    const meId = me?.id || me?._id;

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

    const [openMenuId, setOpenMenuId] = useState(null);
    const [dialog, setDialog] = useState(null); // { type: 'profile'|'edit'|'add'|'block'|'delete', user }
    const [busy, setBusy] = useState(false);
    const [dialogError, setDialogError] = useState("");

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

    const closeDialog = () => {
        setDialog(null);
        setDialogError("");
        setBusy(false);
    };

    const openDialog = (type, user = null) => {
        setOpenMenuId(null);
        setDialogError("");
        setDialog({ type, user });
    };

    const confirmBlockToggle = async () => {
        setBusy(true);
        setDialogError("");
        try {
            await setUserBlocked(dialog.user._id, !dialog.user.isBlocked);
            closeDialog();
            load();
        } catch (err) {
            setDialogError(apiErrorMessage(err, "Failed to update user"));
            setBusy(false);
        }
    };

    const confirmDelete = async () => {
        setBusy(true);
        setDialogError("");
        try {
            await deleteUser(dialog.user._id);
            closeDialog();
            // Step back a page if we just removed the last row on this one.
            if (users.length === 1 && page > 1) setPage(page - 1);
            else load();
        } catch (err) {
            setDialogError(apiErrorMessage(err, "Failed to delete user"));
            setBusy(false);
        }
    };

    const willBlock = dialog?.user && !dialog.user.isBlocked;
    const activeFilter = STATUS_FILTERS.find((f) => f.value === status);

    return (
        <div className="px-4 py-2">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold">Users</h1>
                    <p className="text-sm text-(--text-muted)">View and manage all users of the platform</p>
                </div>
                <button
                    onClick={() => openDialog("add")}
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
                        className={`flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold ${
                            status ? "border-(--accent) text-(--accent)" : "border-(--tint)"
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
                            <th className="px-4 py-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <TableState
                            loading={loading}
                            error={error}
                            empty={!loading && !error && users.length === 0}
                            colSpan={8}
                            onRetry={load}
                        />
                        {!loading &&
                            !error &&
                            users.map((user) => (
                                <tr
                                    key={user._id}
                                    className="relative border-b border-(--tint) transition-colors last:border-0 hover:bg-(--tint)"
                                >
                                    <td className="px-4 py-3">{user.code}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2 font-semibold">{user.name || "—"}</div>
                                    </td>
                                    <td className="px-4 py-3 text-(--text-muted)">{user.email}</td>
                                    <td className="px-4 py-3 text-(--text-muted)">{ROLE_LABELS[user.role] || user.role}</td>
                                    <td className="px-4 py-3 text-(--text-muted)">{user.plan || "—"}</td>
                                    <td className="px-4 py-3 text-(--text-muted)">{formatDate(user.joinedAt)}</td>
                                    <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                                    <td className="relative px-4 py-3">
                                        <button
                                            className="rounded-lg p-1.5 text-(--text-muted) transition-colors hover:bg-(--tint) hover:text-(--accent)"
                                            onClick={() => setOpenMenuId((prev) => (prev === user._id ? null : user._id))}
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        {openMenuId === user._id && (
                                            <ActionMenu
                                                user={user}
                                                isSelf={String(user._id) === String(meId)}
                                                onClose={() => setOpenMenuId(null)}
                                                onView={(u) => openDialog("profile", u)}
                                                onEdit={(u) => openDialog("edit", u)}
                                                onBlockToggle={(u) => openDialog("block", u)}
                                                onDelete={(u) => openDialog("delete", u)}
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} label="users" onPage={setPage} />

            {dialog?.type === "profile" && <ProfileDialog userId={dialog.user._id} onClose={closeDialog} />}

            {(dialog?.type === "add" || dialog?.type === "edit") && (
                <UserFormDialog
                    user={dialog.user}
                    isSelf={Boolean(dialog.user) && String(dialog.user._id) === String(meId)}
                    onClose={closeDialog}
                    onSaved={() => {
                        closeDialog();
                        load();
                    }}
                />
            )}

            {dialog?.type === "block" && (
                <ConfirmDialog
                    title={willBlock ? "Block this user?" : "Unblock this user?"}
                    message={
                        willBlock
                            ? `${dialog.user.name || dialog.user.email} will lose access to their account immediately. You can unblock them at any time.`
                            : `${dialog.user.name || dialog.user.email} will regain access to their account.`
                    }
                    confirmLabel={willBlock ? "Block User" : "Unblock User"}
                    danger={willBlock}
                    busy={busy}
                    error={dialogError}
                    onCancel={closeDialog}
                    onConfirm={confirmBlockToggle}
                />
            )}

            {dialog?.type === "delete" && (
                <ConfirmDialog
                    title="Delete this user?"
                    message={`${dialog.user.name || dialog.user.email}'s account, books and subscription record will be permanently removed. Past orders are kept for records. This can't be undone.`}
                    confirmLabel="Delete User"
                    danger
                    busy={busy}
                    error={dialogError}
                    onCancel={closeDialog}
                    onConfirm={confirmDelete}
                />
            )}
        </div>
    );
}
