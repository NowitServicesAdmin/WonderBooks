import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, BookOpen, Trash2 } from "lucide-react";
import { getBooks, deleteBook, apiErrorMessage } from "../../services/adminService";
import { useDebounce } from "../../hooks/useDebounce";
import { Pagination } from "../../Components/admin/Pagination";
import { TableState } from "../../Components/admin/TableState";
import { ConfirmAlert } from "../../Components/admin/ConfirmAlert";
import { formatDate } from "../../utils/adminFormat";

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
    { value: "", label: "All Status" },
    { value: "completed", label: "Completed" },
    { value: "generating", label: "Generating" },
    { value: "failed", label: "Failed" },
];

const VISIBILITY_FILTERS = [
    { value: "", label: "All Books" },
    { value: "false", label: "Active" },
    { value: "true", label: "Deleted by user" },
];

const statusMeta = {
    completed: { label: "Completed", cls: "bg-green-50 text-green-600" },
    generating: { label: "Generating", cls: "bg-amber-50 text-amber-600" },
    failed: { label: "Failed", cls: "bg-red-50 text-red-600" },
};

function StatusBadge({ status }) {
    const meta = statusMeta[status] || { label: status, cls: "bg-gray-100 text-gray-500" };
    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.cls}`}>{meta.label}</span>;
}

export function SuperAdminBooks() {
    const navigate = useNavigate();

    const [books, setBooks] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchInput, setSearchInput] = useState("");
    const search = useDebounce(searchInput);
    const [status, setStatus] = useState("");
    const [deleted, setDeleted] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { data } = await getBooks({ page, limit: PAGE_SIZE, search, status, deleted });
            setBooks(data.books);
            setTotal(data.total);
            setPages(data.pages);
        } catch (err) {
            setError(apiErrorMessage(err, "Failed to load books"));
        } finally {
            setLoading(false);
        }
    }, [page, search, status, deleted]);

    // Fetch-on-change; same pattern used elsewhere in the app.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    // Permanent delete: confirm first, then reload the current page.
    const [bookToDelete, setBookToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const closeDeleteAlert = () => {
        setBookToDelete(null);
        setDeleteError("");
    };

    const confirmDelete = async () => {
        if (!bookToDelete) return;
        setDeleting(true);
        setDeleteError("");
        try {
            await deleteBook(bookToDelete._id);
            setBookToDelete(null);
            // Deleting the last row of a page should step back one page.
            if (books.length === 1 && page > 1) setPage(page - 1);
            else await load();
        } catch (err) {
            setDeleteError(apiErrorMessage(err, "We couldn't delete this book. Please try again."));
        } finally {
            setDeleting(false);
        }
    };

    const activeStatus = STATUS_FILTERS.find((f) => f.value === status);
    const hasFilter = Boolean(status || deleted);

    return (
        <div className="px-4 py-2">
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-(--tint) text-(--accent)">
                    <BookOpen size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-(--ink)">Books</h1>
                    <p className="text-sm text-(--text-muted)">
                        View all generated books. Books users delete are kept here for printing.
                    </p>
                </div>
            </div>

            <div className="mb-2 flex items-center gap-3">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-(--tint) bg-white px-3 py-2.5 transition-colors focus-within:border-[#c9b8f5]">
                    <Search size={16} className="text-(--text-muted)" />
                    <input
                        value={searchInput}
                        onChange={(e) => {
                            setSearchInput(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search books by title, user or ID..."
                        className="w-full text-sm outline-none"
                    />
                </div>
                <div className="relative">
                    <button
                        onClick={() => setFilterOpen((o) => !o)}
                        className={`flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[#c9b8f5] hover:bg-(--tint) hover:text-(--accent) ${hasFilter ? "border-(--accent) text-(--accent)" : "border-(--tint)"
                            }`}
                    >
                        <Filter size={16} />
                        {hasFilter ? [activeStatus?.value && activeStatus.label, deleted && VISIBILITY_FILTERS.find((f) => f.value === deleted)?.label].filter(Boolean).join(" · ") : "Filter"}
                    </button>
                    {filterOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                            <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-(--tint) bg-white shadow-lg">
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
                                <div className="border-t border-(--tint)" />
                                {VISIBILITY_FILTERS.map((f) => (
                                    <button
                                        key={`v-${f.value}`}
                                        onClick={() => {
                                            setDeleted(f.value);
                                            setPage(1);
                                            setFilterOpen(false);
                                        }}
                                        className={`block w-full px-3 py-2 text-left text-sm font-medium hover:bg-(--tint) ${f.value === deleted ? "bg-(--tint) text-(--accent)" : ""
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
                <table className="w-full min-w-200 text-sm">
                    <thead>
                        <tr className="border-b border-(--tint) bg-(--tint) text-left text-[#5e5779]">
                            <th className="px-4 py-3.5 font-semibold">BookID</th>
                            <th className="px-4 py-3.5 font-semibold">Title</th>
                            <th className="px-4 py-3.5 font-semibold">Mode</th>
                            <th className="px-4 py-3.5 font-semibold">Pages</th>
                            <th className="px-4 py-3.5 font-semibold">Created By</th>
                            <th className="px-4 py-3.5 font-semibold">Created On</th>
                            <th className="px-4 py-3.5 font-semibold">Status</th>
                            <th className="px-4 py-3.5 font-semibold">Orders</th>
                            <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <TableState
                            loading={loading}
                            error={error}
                            empty={!loading && !error && books.length === 0}
                            colSpan={9}
                            onRetry={load}
                        />
                        {!loading &&
                            !error &&
                            books.map((book) => (
                                <tr
                                    key={book._id}
                                    className="border-b border-(--tint) transition-colors last:border-0 hover:bg-(--tint)"
                                >
                                    <td className="px-4 py-3">
                                        {book.status !== "completed" && book.pagesCount === 0 ? (
                                            <span className="text-(--text-muted)" title="Nothing to view yet">{book.code}</span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/superadmin/books/${book._id}`)}
                                                title="Open book"
                                                className="font-semibold text-(--accent) hover:underline"
                                            >
                                                {book.code}
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {book.coverImageUrl ? (
                                                <img
                                                    src={book.coverImageUrl}
                                                    alt=""
                                                    className="h-10 w-10 rounded-lg object-cover"
                                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--tint) text-(--accent)">
                                                    <BookOpen size={16} />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="font-semibold text-(--ink)">{book.title}</div>
                                                {book.isDeleted && (
                                                    <span
                                                        className="mt-0.5 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600"
                                                        title={book.deletedAt ? `Deleted by user on ${formatDate(book.deletedAt)}` : "Deleted by user"}
                                                    >
                                                        Deleted by user
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 capitalize text-(--text-muted)">{book.mode === "ai" ? "AI" : book.mode}</td>
                                    <td className="px-4 py-3 text-(--text-muted)">{book.pagesCount}</td>
                                    <td className="px-4 py-3 text-(--text-muted)">
                                        {book.createdBy?.email || "Deleted user"}
                                    </td>
                                    <td className="px-4 py-3 text-(--text-muted)">{formatDate(book.createdAt)}</td>
                                    <td className="px-4 py-3"><StatusBadge status={book.status} /></td>
                                    <td className="px-4 py-3 text-(--text-muted)">{book.orderCount}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDeleteError("");
                                                    setBookToDelete(book);
                                                }}
                                                disabled={book.status === "generating"}
                                                title={book.status === "generating" ? "Can't delete while generating" : "Delete permanently"}
                                                aria-label={`Delete ${book.title} permanently`}
                                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} label="books" onPage={setPage} />

            <ConfirmAlert
                open={Boolean(bookToDelete)}
                type="danger"
                title="Delete permanently?"
                message={
                    bookToDelete
                        ? `"${bookToDelete.title}" by ${bookToDelete.createdBy?.email || "a deleted user"} will be removed for good${bookToDelete.isDeleted ? "" : ", and the user will lose it too"
                        }. This can't be undone.`
                        : ""
                }
                error={deleteError}
                confirmText="Yes, Delete"
                busy={deleting}
                busyText="Deleting..."
                onConfirm={confirmDelete}
                onCancel={closeDeleteAlert}
            />
        </div>
    );
}
