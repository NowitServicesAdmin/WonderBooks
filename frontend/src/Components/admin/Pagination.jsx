// Shared footer for super admin tables: "Showing a-b of N" + page buttons.
const pageWindow = (page, pages) => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const set = new Set([1, pages, page - 1, page, page + 1]);
    const list = [...set].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
    const out = [];
    list.forEach((p, i) => {
        if (i > 0 && p - list[i - 1] > 1) out.push("...");
        out.push(p);
    });
    return out;
};

export const Pagination = ({ page, pages, total, limit, label, onPage }) => {
    const from = total === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);

    return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-(--text-muted)">
            <span>
                Showing {from}–{to} of {total.toLocaleString("en-IN")} {label}
            </span>
            {pages > 1 && (
                <div className="flex items-center gap-1">
                    <button
                        disabled={page <= 1}
                        onClick={() => onPage(page - 1)}
                        className="h-8 rounded-lg px-2 text-sm font-semibold hover:bg-(--tint) disabled:opacity-40"
                    >
                        Prev
                    </button>
                    {pageWindow(page, pages).map((p, i) =>
                        p === "..." ? (
                            <span key={`gap-${i}`} className="px-1">...</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onPage(p)}
                                className={`h-8 w-8 rounded-lg text-sm font-semibold ${
                                    p === page ? "bg-(--accent) text-white" : "hover:bg-(--tint)"
                                }`}
                            >
                                {p}
                            </button>
                        )
                    )}
                    <button
                        disabled={page >= pages}
                        onClick={() => onPage(page + 1)}
                        className="h-8 rounded-lg px-2 text-sm font-semibold hover:bg-(--tint) disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};
