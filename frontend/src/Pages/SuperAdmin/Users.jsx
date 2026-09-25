import { useState, useRef, useEffect } from "react";
import { Plus, Search, Filter, MoreVertical, Eye, Pencil, ShieldOff, ShieldCheck, Trash2 } from "lucide-react";

const initialUsers = [
    { id: "U1001", name: "Priya Kapoor", email: "priya.k@gmail.com", role: "Parent", joined: "Jan 12, 2026", status: "Active" },
    { id: "U1002", name: "Rahul Mehta", email: "rahul.mehta@gmail.com", role: "Parent", joined: "Feb 03, 2026", status: "Active" },
    { id: "U1003", name: "Ananya Rao", email: "ananya.rao@gmail.com", role: "Educator", joined: "Feb 20, 2026", status: "Blocked" },
    { id: "U1004", name: "Vikram Singh", email: "vikram.singh@gmail.com", role: "Parent", joined: "Mar 08, 2026", status: "Active" },
    { id: "U1005", name: "Sneha Iyer", email: "sneha.iyer@gmail.com", role: "Parent", joined: "Mar 21, 2026", status: "Pending" },
];

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

// Small popover of actions anchored under the "..." button for a single row.
const ActionMenu = ({ user, onClose, onBlockToggle }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const isBlocked = user.status === "Blocked";

    return (
        <div
            ref={menuRef}
            className="absolute right-4 top-10 z-20 w-44 overflow-hidden rounded-xl border border-[var(--tint)] bg-white shadow-lg"
        >
            <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium hover:bg-[var(--tint)]">
                <Eye size={15} className="text-[var(--text-muted)]" /> View Profile
            </button>
            <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium hover:bg-[var(--tint)]">
                <Pencil size={15} className="text-[var(--text-muted)]" /> Edit User
            </button>
            <button
                onClick={() => onBlockToggle(user)}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium hover:bg-[var(--tint)] ${
                    isBlocked ? "text-green-600" : "text-red-600"
                }`}
            >
                {isBlocked ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
                {isBlocked ? "Unblock User" : "Block User"}
            </button>
            <button className="flex w-full items-center gap-2 border-t border-[var(--tint)] px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-[var(--tint)]">
                <Trash2 size={15} /> Delete User
            </button>
        </div>
    );
};

// Confirmation dialog shown before a block/unblock action is applied.
const ConfirmBlockDialog = ({ user, onCancel, onConfirm }) => {
    const willBlock = user.status !== "Blocked";

    return (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                <h2 className="text-lg font-bold text-[var(--ink)]">
                    {willBlock ? "Block this user?" : "Unblock this user?"}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {willBlock
                        ? `${user.name} will lose access to their account immediately. You can unblock them at any time.`
                        : `${user.name} will regain access to their account.`}
                </p>
                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="rounded-lg border border-[var(--tint)] px-4 py-2 text-sm font-semibold hover:bg-[var(--tint)]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                            willBlock ? "bg-red-600 hover:bg-red-700" : "bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
                        }`}
                    >
                        {willBlock ? "Block User" : "Unblock User"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export function SuperAdminUsers() {
    const [users, setUsers] = useState(initialUsers);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [pendingBlockUser, setPendingBlockUser] = useState(null);

    const handleActionClick = (userId) => {
        setOpenMenuId((prev) => (prev === userId ? null : userId));
    };

    // Opens the confirmation dialog instead of applying the change right away.
    const handleBlockToggle = (user) => {
        setOpenMenuId(null);
        setPendingBlockUser(user);
    };

    const confirmBlockToggle = () => {
        setUsers((prev) =>
            prev.map((u) =>
                u.id === pendingBlockUser.id
                    ? { ...u, status: u.status === "Blocked" ? "Active" : "Blocked" }
                    : u
            )
        );
        setPendingBlockUser(null);
    };

    return (
        <div className="px-4 py-2">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold">Users</h1>
                    <p className="text-sm text-[var(--text-muted)]">View and manage all users of the platform</p>
                </div>
                <button className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">
                    <Plus size={16} /> Add User
                </button>
            </div>

            <div className="mb-4 flex items-center gap-3">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--tint)] bg-white px-3 py-2.5">
                    <Search size={16} className="text-[var(--text-muted)]" />
                    <input placeholder="Search users by name, email or ID..." className="w-full text-sm outline-none" />
                </div>
                <button className="flex items-center gap-2 rounded-lg border border-[var(--tint)] bg-white px-4 py-2.5 text-sm font-semibold">
                    <Filter size={16} /> Filter
                </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[var(--tint)] bg-white">
                <table className="w-full min-w-150 text-sm">
                    <thead className="border-[var(--tint)] bg-[var(--tint)] ">
                        <tr className="border-b border-[var(--tint)] text-left text-[var(--text-muted)]">
                            <th className="px-4 py-3 font-semibold">UserID</th>
                            <th className="px-4 py-3 font-semibold">Name</th>
                            <th className="px-4 py-3 font-semibold">Email</th>
                            <th className="px-4 py-3 font-semibold">Role</th>
                            <th className="px-4 py-3 font-semibold">Joined On</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                className="relative border-b border-[var(--tint)] transition-colors last:border-0 hover:bg-[var(--tint)]"
                            >
                                <td className="px-4 py-3">{user.id}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 font-semibold">{user.name}</div>
                                </td>
                                <td className="px-4 py-3 text-[var(--text-muted)]">{user.email}</td>
                                <td className="px-4 py-3 text-[var(--text-muted)]">{user.role}</td>
                                <td className="px-4 py-3 text-[var(--text-muted)]">{user.joined}</td>
                                <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                                <td className="relative px-4 py-3">
                                    <button
                                        className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--tint)] hover:text-[var(--accent)]"
                                        onClick={() => handleActionClick(user.id)}
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    {openMenuId === user.id && (
                                        <ActionMenu
                                            user={user}
                                            onClose={() => setOpenMenuId(null)}
                                            onBlockToggle={handleBlockToggle}
                                        />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-muted)]">
                <span>Showing 1–{users.length} of 1,248 users</span>
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((p) => (
                        <button key={p} className={`h-8 w-8 rounded-lg text-sm font-semibold ${p === 1 ? "bg-[var(--accent)] text-white" : "hover:bg-[var(--tint)]"}`}>
                            {p}
                        </button>
                    ))}
                    <span className="px-1">...</span>
                    <button className="h-8 w-8 rounded-lg text-sm font-semibold hover:bg-[var(--tint)]">125</button>
                </div>
            </div>

            {pendingBlockUser && (
                <ConfirmBlockDialog
                    user={pendingBlockUser}
                    onCancel={() => setPendingBlockUser(null)}
                    onConfirm={confirmBlockToggle}
                />
            )}
        </div>
    );
}