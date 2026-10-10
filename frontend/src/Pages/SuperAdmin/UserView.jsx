import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Pencil, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import {
    getUserDetail,
    setUserBlocked,
    deleteUser,
    apiErrorMessage,
} from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";
import { ConfirmAlert } from "../../Components/admin/ConfirmAlert";
import { UserFormDialog } from "../../Components/admin/userFormDialog";
import { formatDate } from "../../utils/adminFormat";

const ROLE_LABELS = { user: "User", "super admin": "Super Admin" };

const statusStyles = {
    Active: "bg-green-50 text-green-600",
    Blocked: "bg-red-50 text-red-600",
    Pending: "bg-amber-50 text-amber-600",
};

const Shell = ({ children }) => (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-[#e4e0ef] bg-linear-to-br from-[#fbfaff] via-[#f8f6fc] to-[#f0edf7] px-6 text-center">
        {children}
    </section>
);

// Profile photo, falling back to the first letter if there's no photo or it fails to load.
const Avatar = ({ url, name, size = "h-16 w-16" }) => {
    const [failed, setFailed] = useState(false);
    const initial = (name || "?").trim().charAt(0).toUpperCase();
    return url && !failed ? (
        <img
            src={url}
            alt={name || "User"}
            onError={() => setFailed(true)}
            className={`${size} shrink-0 rounded-full border border-[#e4e0ef] object-cover`}
        />
    ) : (
        <div
            className={`${size} flex shrink-0 items-center justify-center rounded-full bg-(--tint) text-xl font-extrabold text-(--accent)`}
        >
            {initial}
        </div>
    );
};

const Row = ({ label, value }) => (
    <div className="flex justify-between gap-4 border-b border-(--tint) py-3 text-sm last:border-0">
        <span className="text-(--text-muted)">{label}</span>
        <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
);

const Card = ({ title, children }) => (
    <div className="rounded-2xl border border-(--tint) bg-white p-5">
        <h2 className="mb-1 text-base font-bold text-(--ink)">{title}</h2>
        {children}
    </div>
);

export function SuperAdminUserView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: me } = useAuth();
    const isSelf = String(me?.id || me?._id) === String(id);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [dialog, setDialog] = useState(null); // 'edit' | 'block' | 'delete'
    const [busy, setBusy] = useState(false);
    const [dialogError, setDialogError] = useState("");

    const load = useCallback(async () => {
        try {
            const { data: res } = await getUserDetail(id);
            setData(res);
            setError("");
        } catch (err) {
            setError(
                err?.response?.status === 404
                    ? "We couldn't find this user. They may have been deleted."
                    : apiErrorMessage(err, "We couldn't load this user. Please try again.")
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const goBack = () => navigate("/superadmin/users");

    const closeDialog = () => {
        setDialog(null);
        setDialogError("");
        setBusy(false);
    };

    const openDialog = (type) => {
        setDialogError("");
        setDialog(type);
    };

    const confirmBlockToggle = async () => {
        setBusy(true);
        setDialogError("");
        try {
            await setUserBlocked(data.user._id, !data.user.isBlocked);
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
            await deleteUser(data.user._id);
            navigate("/superadmin/users", { replace: true });
        } catch (err) {
            setDialogError(apiErrorMessage(err, "Failed to delete user"));
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <Shell>
                <Loader2 size={28} className="animate-spin text-[#7f6ad0]" />
                <p className="mt-3 text-sm font-medium text-(--text-muted)">Loading user...</p>
            </Shell>
        );
    }

    if (error || !data?.user) {
        return (
            <Shell>
                <p className="text-base font-semibold text-[#4a4665]">{error || "User not found."}</p>
                <button
                    type="button"
                    onClick={goBack}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#5d2bc5] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#5122b4]"
                >
                    <ArrowLeft size={16} /> Back to Users
                </button>
            </Shell>
        );
    }

    const { user, subscription, recentBooks } = data;
    const willBlock = !user.isBlocked;
    const displayName = user.name || user.email;

    return (
        <div className="px-4 py-2">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={goBack}
                    aria-label="Back to Users"
                    title="Back to Users"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e4e0ef] bg-white text-[#5d2bc5] outline-none transition hover:bg-[#f7f3ff] focus-visible:ring-2 focus-visible:ring-[#a98aff]/50"
                >
                    <ArrowLeft size={18} />
                </button>

                <Avatar key={user.avatarUrl} url={user.avatarUrl} name={displayName} />

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="truncate text-xl font-extrabold text-(--ink)">{user.name || "—"}</h1>
                        <span className="rounded-full bg-(--tint) px-2.5 py-0.5 text-xs font-semibold text-(--text-muted)">
                            {user.code}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[user.status] || "bg-gray-100 text-gray-600"}`}>
                            {user.status}
                        </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-(--text-muted)">{user.email}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => openDialog("edit")}
                        className="inline-flex items-center gap-2 rounded-lg border border-(--tint) bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-(--tint) hover:text-(--accent)"
                    >
                        <Pencil size={15} /> Edit
                    </button>
                    {!isSelf && (
                        <>
                            <button
                                type="button"
                                onClick={() => openDialog("block")}
                                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                                    willBlock
                                        ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
                                        : "border-green-200 bg-white text-green-600 hover:bg-green-50"
                                }`}
                            >
                                {willBlock ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                                {willBlock ? "Block" : "Unblock"}
                            </button>
                            <button
                                type="button"
                                onClick={() => openDialog("delete")}
                                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                            >
                                <Trash2 size={15} /> Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Details */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card title="Profile">
                    <div className="flex items-center gap-4 border-b border-(--tint) py-4">
                        <Avatar key={user.avatarUrl} url={user.avatarUrl} name={displayName} size="h-20 w-20" />
                        <div className="min-w-0">
                            <div className="truncate text-base font-bold text-(--ink)">{user.name || "—"}</div>
                            <div className="truncate text-sm text-(--text-muted)">{user.email}</div>
                        </div>
                    </div>
                    <Row label="User ID" value={user.code} />
                    <Row label="Name" value={user.name || "—"} />
                    <Row label="Email" value={user.email} />
                    <Row label="Role" value={ROLE_LABELS[user.role] || user.role} />
                    <Row label="Status" value={user.status} />
                    <Row label="Joined" value={formatDate(user.joinedAt)} />
                </Card>

                <div className="flex flex-col gap-4">
                    <Card title="Activity">
                        <Row label="Books created" value={user.booksCount} />
                        <Row label="Orders placed" value={user.ordersCount} />
                    </Card>

                    <Card title="Subscription">
                        {subscription ? (
                            <>
                                <Row label="Plan" value={subscription.planName} />
                                <Row label="Billing" value={subscription.billingCycle} />
                                <Row label="Status" value={subscription.status} />
                                <Row label="Ends on" value={formatDate(subscription.endDate)} />
                            </>
                        ) : (
                            <p className="py-3 text-sm text-(--text-muted)">No subscription</p>
                        )}
                    </Card>
                </div>
            </div>

            {recentBooks?.length > 0 && (
                <div className="mt-4">
                    <Card title="Recent books">
                        <ul className="divide-y divide-(--tint) text-sm">
                            {recentBooks.map((b) => (
                                <li key={b._id} className="flex items-center justify-between gap-3 py-2.5">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/superadmin/books/${b._id}`)}
                                        className="truncate text-left font-medium text-(--accent) hover:underline"
                                    >
                                        {b.title}
                                    </button>
                                    <span className="shrink-0 text-xs text-(--text-muted)">{formatDate(b.createdAt)}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            )}

            {/* Dialogs */}
            {dialog === "edit" && (
                <UserFormDialog
                    user={user}
                    isSelf={isSelf}
                    onClose={closeDialog}
                    onSaved={() => {
                        closeDialog();
                        load();
                    }}
                />
            )}

            <ConfirmAlert
                open={dialog === "block"}
                type={willBlock ? "restricted" : "info"}
                title={willBlock ? "Block this user?" : "Unblock this user?"}
                message={
                    willBlock
                        ? `${displayName} will lose access to their account immediately. You can unblock them at any time.`
                        : `${displayName} will regain access to their account.`
                }
                error={dialogError}
                confirmText={willBlock ? "Yes, Block" : "Yes, Unblock"}
                cancelText="Cancel"
                busy={busy}
                onConfirm={confirmBlockToggle}
                onCancel={closeDialog}
            />

            <ConfirmAlert
                open={dialog === "delete"}
                type="danger"
                title="Delete this user?"
                message={`${displayName}'s account and subscription record will be permanently removed. Books that were ordered are kept so those orders can still be printed. This can't be undone.`}
                error={dialogError}
                confirmText="Yes, Delete"
                busy={busy}
                busyText="Deleting..."
                onConfirm={confirmDelete}
                onCancel={closeDialog}
            />
        </div>
    );
}