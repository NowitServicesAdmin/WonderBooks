import { useState } from "react";
import { Star } from "lucide-react";
import { categories, categoryThemes } from "../../Data/Templatesdata";
import { setBookSample, apiErrorMessage } from "../../services/adminService";

const SAMPLE_CATEGORIES = categories.filter((c) => c !== "All");

export const SampleDialog = ({ book, onClose, onSaved }) => {
    const [category, setCategory] = useState(book?.sampleCategory || "");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    if (!book) return null;

    const close = () => !busy && onClose();

    const save = async () => {
        setBusy(true);
        setError("");
        try {
            await setBookSample(book._id, true, category);
            onSaved();
        } catch (err) {
            setError(apiErrorMessage(err, "We couldn't save this. Please try again."));
            setBusy(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={close}
            role="presentation"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="sample-dialog-title"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl border border-(--tint) bg-white p-6 shadow-xl"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--tint) text-(--accent)">
                        <Star size={18} />
                    </div>
                    <div className="min-w-0">
                        <h2 id="sample-dialog-title" className="text-lg font-extrabold text-(--ink)">
                            {book.isSample ? "Change sample category" : "Show on Samples page"}
                        </h2>
                        <p className="truncate text-sm text-(--text-muted)">{book.title}</p>
                    </div>
                </div>

                <p className="mt-4 text-sm text-(--text-muted)">
                    Every user will be able to read this book (its story and pictures) from the Samples
                    page. Check it doesn&apos;t include anything private, like a child&apos;s real name.
                </p>

                <p className="mt-4 text-sm font-semibold text-(--ink)">Category</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    {SAMPLE_CATEGORIES.map((c) => {
                        const active = category === c;
                        return (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setCategory(c)}
                                aria-pressed={active}
                                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-bold transition ${active
                                        ? "border-(--accent) bg-(--tint) text-(--accent)"
                                        : "border-(--tint) bg-white text-(--text-muted) hover:bg-(--tint)"
                                    }`}
                            >
                                <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: categoryThemes[c]?.primary }}
                                />
                                {c}
                            </button>
                        );
                    })}
                </div>

                {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={close}
                        disabled={busy}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-(--text-muted) transition hover:bg-(--tint) disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={save}
                        disabled={!category || busy}
                        className="rounded-lg bg-(--accent) px-4 py-2 text-sm font-bold text-white transition hover:bg-(--accent-hover) disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy ? "Saving..." : book.isSample ? "Save" : "Add to Samples"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SampleDialog;
