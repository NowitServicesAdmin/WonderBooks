import { useState } from "react";
import { X } from "lucide-react";
import { createUser, updateUser, apiErrorMessage } from "../../services/adminService";

// Generic centered modal shell used by the SuperAdmin dialogs.
export const Modal = ({ title, onClose, children, width = "max-w-sm" }) => (
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

// Used for both "Add User" (user = null) and "Edit User".
export const UserFormDialog = ({ user, isSelf, onClose, onSaved }) => {
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
