import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Trash2, ExternalLink } from "lucide-react";
import { BookViewer } from "../../Components/BookViewer";
import { BookInfoPage } from "../../Components/BookInfoPage";
import { getBookDetail, apiErrorMessage } from "../../services/adminService";
import { formatDate, formatMoney } from "../../utils/adminFormat";

const orderStatusLabel = {
    pending_payment: "Awaiting Payment",
    confirmed: "Confirmed",
    printing: "Printing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

const Shell = ({ children }) => (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-[#e4e0ef] bg-linear-to-br from-[#fbfaff] via-[#f8f6fc] to-[#f0edf7] px-6 text-center">
        {children}
    </section>
);

export function SuperAdminBookView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data: res } = await getBookDetail(id);
                if (cancelled) return;
                setData(res);
            } catch (err) {
                if (cancelled) return;
                setError(
                    err?.response?.status === 404
                        ? "We couldn't find this book. It may have been deleted permanently."
                        : apiErrorMessage(err, "We couldn't load this book. Please try again.")
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const book = data?.book;

    const pages = useMemo(() => {
        if (!book) return [];
        const theme = book.storyData?.theme || "Story";
        return [
            { kind: "cover", imageKey: "cover", image: book.coverImageUrl, heading: book.title, sub: theme },
            ...book.pages.map((p, i) => ({
                kind: "story",
                imageKey: String(i),
                pageId: p._id,
                image: p.imageUrl,
                text: p.content,
            })),
            { kind: "end", image: book.coverImageUrl, heading: "The End", sub: "Thanks for reading!" },
        ];
    }, [book]);

    const goBack = () => navigate("/superadmin/books");

    if (loading) {
        return (
            <Shell>
                <Loader2 size={28} className="animate-spin text-[#7f6ad0]" />
                <p className="mt-3 text-sm font-medium text-(--text-muted)">Loading book...</p>
            </Shell>
        );
    }

    if (error || !book) {
        return (
            <Shell>
                <p className="text-base font-semibold text-[#4a4665]">{error || "Book not found."}</p>
                <button
                    type="button"
                    onClick={goBack}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#5d2bc5] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#5122b4]"
                >
                    <ArrowLeft size={16} /> Back to Books
                </button>
            </Shell>
        );
    }

    const sd = book.storyData || {};
    const ageRaw = (sd.age || "").trim();
    const ageLabel = ageRaw ? (/^ages?\b/i.test(ageRaw) ? ageRaw : `Ages ${ageRaw}`) : "";
    const ageOnly = ageRaw.replace(/^ages?\s*/i, "");
    const words = book.pages.reduce((sum, p) => sum + (p.content || "").split(/\s+/).filter(Boolean).length, 0);
    const readingTime = `${Math.max(1, Math.round(words / 120))} min`;
    const characterNames = (sd.characters || []).map((c) => c.name).filter(Boolean);
    const description =
        sd.subject ||
        sd.centralMessage ||
        (characterNames.length ? `A story starring ${characterNames.join(", ")}.` : "");
    const inputText = sd.storyIdea || (sd.subject ? sd.centralMessage : "") || "";

    return (
        <div className="flex h-full w-full flex-col gap-3 px-4 py-2">
            {/* Header */}
            <div className="flex shrink-0 flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={goBack}
                    aria-label="Back to Books"
                    title="Back to Books"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e4e0ef] bg-white text-[#5d2bc5] outline-none transition hover:bg-[#f7f3ff] focus-visible:ring-2 focus-visible:ring-[#a98aff]/50"
                >
                    <ArrowLeft size={18} />
                </button>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="truncate text-xl font-extrabold text-(--ink)">{book.title}</h1>
                        <span className="rounded-full bg-(--tint) px-2.5 py-0.5 text-xs font-semibold text-(--text-muted)">
                            {book.code}
                        </span>
                        {book.isDeleted && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                                <Trash2 size={11} /> Deleted by user{book.deletedAt ? ` on ${formatDate(book.deletedAt)}` : ""}
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-(--text-muted)">
                        By {book.createdBy?.email || "a deleted user"} · {book.pages.length} pages · Created {formatDate(book.createdAt)}
                    </p>
                </div>

                {data.orders.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-(--text-muted)">Orders:</span>
                        {data.orders.map((o) => (
                            <button
                                key={o._id}
                                type="button"
                                onClick={() => navigate(`/superadmin/orders/${o._id}`)}
                                title={`${orderStatusLabel[o.status] || o.status} · ${formatMoney(o.amount, o.currency)}`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#e4e0ef] bg-white px-3 py-1.5 text-xs font-bold text-[#5d2bc5] transition hover:bg-[#f7f3ff]"
                            >
                                {o.orderNumber}
                                <span className="font-semibold text-(--text-muted)">{orderStatusLabel[o.status] || o.status}</span>
                                <ExternalLink size={12} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Book */}
            <div className="min-h-0 flex-1">
                <BookViewer
                    pages={pages}
                    badge={sd.theme || "Story"}
                    font={sd.font}
                    onExit={goBack}
                    renderInfoPage={(page) => (
                        <BookInfoPage
                            title={page.heading}
                            ageLabel={ageLabel}
                            description={description}
                            readingTime={readingTime}
                            theme={sd.theme || "Story"}
                            bestFor={ageOnly ? `Kids ${ageOnly}` : "All kids"}
                            inputLabel={sd.storyIdea ? "Your Story Input" : "Central Message"}
                            inputText={inputText !== description ? inputText : ""}
                        />
                    )}
                />
            </div>
        </div>
    );
}
