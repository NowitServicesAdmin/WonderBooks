import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BookViewer } from "../../Components/BookViewer";
import { BookInfoPage } from "../../Components/BookInfoPage";
import { BookActions } from "../../Components/BookActions";
import { getBookById } from "../../services/bookService";

const POLL_MS = 5000;

// Same frame as the template preview, used for loading / error / progress states.
const Shell = ({ children }) => (
  <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-[#e4e0ef] bg-linear-to-br from-[#fbfaff] via-[#f8f6fc] to-[#f0edf7] px-6 text-center">
    {children}
  </section>
);

const BackButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#5d2bc5] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#5122b4]"
  >
    <ArrowLeft size={16} />
    Back to Books
  </button>
);

export const BookReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load the book, and keep polling while the backend is still generating it.
  useEffect(() => {
    let cancelled = false;
    let timer;

    const load = async () => {
      try {
        const data = await getBookById(id);
        if (cancelled) return;
        setBook(data);
        setError("");
        setLoading(false);
        if (data.status === "generating") {
          timer = setTimeout(load, POLL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err.response?.status === 404
            ? "We couldn't find this book."
            : "We couldn't load this book. Please try again."
        );
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  const goBack = () => navigate("/books");

  // Same page shape the template preview uses: cover, story pages, end.
  const pages = useMemo(() => {
    if (!book) return [];
    const theme = book.storyData?.theme || "Story";
    return [
      { kind: "cover", imageKey: "cover", image: book.coverImageUrl, heading: book.title, sub: theme },
      ...book.pages.map((p, i) => ({
        kind: "story",
        imageKey: String(i),
        image: p.imageUrl,
        text: p.content,
      })),
      { kind: "end", image: book.coverImageUrl, heading: "The End", sub: "Thanks for reading!" },
    ];
  }, [book]);

  if (loading) {
    return (
      <Shell>
        <Loader2 className="animate-spin text-[#5d2bc5]" size={30} />
        <p className="mt-3 text-sm font-medium text-[#9995aa]">Opening your book...</p>
      </Shell>
    );
  }

  if (error || !book) {
    return (
      <Shell>
        <p className="text-lg font-bold text-[#332f54]">{error || "Book not found."}</p>
        <BackButton onClick={goBack} />
      </Shell>
    );
  }

  if (book.status === "generating") {
    const done = book.pages.filter((p) => p.status === "completed").length;
    return (
      <Shell>
        <Loader2 className="animate-spin text-[#5d2bc5]" size={32} />
        <h2 className="mt-4 font-serif text-2xl font-bold text-[#29254d]">{book.title}</h2>
        <p className="mt-1.5 text-sm text-[#9995aa]">
          Creating illustrations... {done} of {book.pages.length} pages ready
        </p>
        <BackButton onClick={goBack} />
      </Shell>
    );
  }

  // Front-page details from what was saved with the book
  const sd = book.storyData || {};
  const ageRaw = (sd.age || "").trim();
  const ageLabel = ageRaw ? (/^ages?\b/i.test(ageRaw) ? ageRaw : `Ages ${ageRaw}`) : "";
  const ageOnly = ageRaw.replace(/^ages?\s*/i, "");
  const words = book.pages.reduce(
    (sum, p) => sum + (p.content || "").split(/\s+/).filter(Boolean).length,
    0
  );
  const readingTime = `${Math.max(1, Math.round(words / 120))} min`;
  const characterNames = (sd.characters || []).map((c) => c.name).filter(Boolean);
  const description =
    sd.subject ||
    sd.centralMessage ||
    (characterNames.length ? `A story starring ${characterNames.join(", ")}.` : "");
  const inputText = sd.storyIdea || (sd.subject ? sd.centralMessage : "") || "";

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back to Books"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4e0ef] bg-white text-[#5d2bc5] transition hover:bg-[#f7f3ff]"
        >
          <ArrowLeft size={18} />
        </button>
        <BookActions book={book} pages={pages} />
      </div>
      <div className="min-h-0 flex-1">
        <BookViewer
          pages={pages}
          badge={sd.theme || "Story"}
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
};