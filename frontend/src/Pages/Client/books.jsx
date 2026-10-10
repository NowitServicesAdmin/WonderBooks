import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Heart, Search, Sparkles, Trash2 } from "lucide-react";
import { getMyBookList, acknowledgeBookFailures, toggleBookFavorite, deleteBook } from "../../services/bookService";
import WonderAlertModal from "../../Components/WonderAlertModal";

const AnimatedSearch = ({ search, setSearch, placeholder }) => (
  <div className="flex h-11 w-full items-center gap-2 rounded-xl border border-(--border) bg-(--tint) px-3.5 transition focus-within:border-[#b9b0f2] focus-within:bg-(--surface) focus-within:shadow-[0_0_0_4px_rgba(148,120,235,0.12)] sm:w-105">
    <Search size={18} strokeWidth={2} className="shrink-0 text-(--text-muted)" />
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-sm text-[#403b61] outline-none placeholder:text-[#aaa7b8]"
    />
  </div>
);

// How often the list refreshes while at least one book is still being created.
const POLL_INTERVAL_MS = 4000;

// Same footprint as a real book card (cover + page block + meta line) so the
// grid doesn't jump when the finished book replaces it.
const BookSkeleton = ({ progress = 5 }) => (
  <div className="min-w-0" aria-busy="true" aria-label="Creating your story">
    <div className="relative flex justify-center py-2">
      <div className="relative w-[88%] sm:w-[90%]">
        <div
          className="relative aspect-3/4 overflow-hidden rounded-t-[14px] bg-[#e4dff3]"
          style={{
            boxShadow: "2px 1px 0 #c9c1e4, 4px 8px 16px rgba(35,25,55,0.10)",
          }}
        >
          <div className="absolute inset-0 animate-pulse bg-linear-to-br from-[#ece8f8] via-[#e2dcf3] to-[#d6cfee]" />
          <div className="absolute inset-y-0 left-0 z-10 w-3.5 bg-[#c6bde6]" />

          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 px-5 text-center">
            <Sparkles size={24} className="animate-pulse text-[#7f6ad0]" />
            <p className="text-[13px] font-bold text-[#5f4da6]">
              Creating your story…
            </p>
            <p className="text-[28px] font-extrabold leading-none text-[#4d3a9e]">
              {progress}%
            </p>
            <p className="text-[11px] font-medium leading-4 text-[#8f84bd]">
              This may take a few minutes.
              <br />
              Please keep this page open.
            </p>
          </div>

          <div className="absolute inset-x-6 bottom-7 z-20">
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-white/60"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div
                className="h-full rounded-full bg-linear-to-r from-[#8a6ee0] to-[#5c3db4] transition-[width] duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div
          className="h-5 w-full animate-pulse rounded-b-[10px]"
          style={{
            borderTop: "2px solid #c6bde6",
            background:
              "repeating-linear-gradient(to bottom, #f6f3ec 0px, #f6f3ec 3px, #e3dccf 3px, #e3dccf 4px)",
          }}
        />
      </div>
    </div>

    <div className="mt-3 flex items-center justify-center gap-2">
      <span className="h-3.5 w-16 animate-pulse rounded bg-[#e6e2f0]" />
      <span className="h-3.5 w-20 animate-pulse rounded bg-[#e6e2f0]" />
    </div>
  </div>
);

// "2 hours ago", "3 days ago", or a short date for anything older than a month.
const formatUpdated = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const Books = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const fullPlaceholder = "Search Your Books";
  const [placeholder, setPlaceholder] = useState("");

  // myBooks has no `category` field, so filtering is by title / createdFor only.
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Books that failed to generate. The book itself is never listed; the user
  // gets an alert with the reason instead, one at a time.
  const [failureQueue, setFailureQueue] = useState([]);
  const seenFailureIds = useRef(new Set());

  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    const toBook = (b) => ({
      id: b._id,
      title: b.title,
      cover: b.coverImageUrl,
      isFavorite: Boolean(b.isFavorite),
      createdFor: b.createdFor ?? "",
      genre: b.theme ?? undefined,
      pages: b.pageCount ?? 0,
      // Same maths as the dashboard: share of pages finished (kept under 100
      // until the server marks the book completed).
      progress:
        b.status === "completed"
          ? 100
          : (b.pageCount ?? 0) > 0
            ? Math.min(99, Math.max(5, Math.round(((b.completedPages ?? 0) / b.pageCount) * 100)))
            : 5,
      updatedAt: formatUpdated(b.updatedAt ?? b.createdAt),
      status:
        b.status === "completed"
          ? "Completed"
          : b.status === "failed"
            ? "Failed"
            : "Generating",
    });

    const load = async (isFirstLoad = false) => {
      try {
        const { books: data, failures } = await getMyBookList();
        if (cancelled) return;

        const mapped = data.map(toBook);
        setBooks(mapped);
        setError("");

        const newFailures = failures.filter(
          (f) => !seenFailureIds.current.has(f._id)
        );
        if (newFailures.length > 0) {
          newFailures.forEach((f) => seenFailureIds.current.add(f._id));
          setFailureQueue((queue) => [...queue, ...newFailures]);
        }

        // Keep refreshing until every book has finished generating.
        if (mapped.some((book) => book.status === "Generating")) {
          timeoutId = setTimeout(load, POLL_INTERVAL_MS);
        }
      } catch {
        if (cancelled) return;
        if (isFirstLoad) {
          setError("We couldn't load your books. Please try again.");
        } else {
          // A failed background refresh shouldn't wipe the list - just retry.
          timeoutId = setTimeout(load, POLL_INTERVAL_MS);
        }
      } finally {
        if (!cancelled && isFirstLoad) setLoading(false);
      }
    };

    load(true);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return books;

    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        (book.createdFor ?? "").toLowerCase().includes(query)
    );
  }, [search, books]);

  useEffect(() => {
    let index = 0;
    let deleting = false;
    let timeoutId;
    const animate = () => {
      if (!deleting) {
        index++;
        setPlaceholder(fullPlaceholder.slice(0, index));
        if (index >= fullPlaceholder.length) {
          deleting = true;
          timeoutId = setTimeout(animate, 1800);
          return;
        }
        timeoutId = setTimeout(animate, 90);
      } else {
        index--;
        setPlaceholder(fullPlaceholder.slice(0, index));
        if (index <= 0) {
          deleting = false;
          timeoutId = setTimeout(animate, 500);
          return;
        }
        timeoutId = setTimeout(animate, 55);
      }
    };
    animate();
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleBookClick = (id) => navigate(`/books/${id}`);

  // Heart toggle: update instantly, save to the backend, undo if the save fails.
  const [heartBursts, setHeartBursts] = useState({});

  const handleToggleFavorite = async (event, id, next) => {
    event.stopPropagation();

    const setFavorite = (value) =>
      setBooks((current) =>
        current.map((b) => (b.id === id ? { ...b, isFavorite: value } : b))
      );

    setFavorite(next);

    if (next) {
      setHeartBursts((current) => ({ ...current, [id]: true }));
      setTimeout(() => setHeartBursts((current) => ({ ...current, [id]: false })), 1000);
    }

    try {
      await toggleBookFavorite(id, next);
    } catch (err) {
      console.error("Favorite toggle failed:", err);
      setFavorite(!next);
    }
  };

  // Delete: ask first, then remove from the list once the server confirms.
  const [bookToDelete, setBookToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const askDelete = (event, book) => {
    event.stopPropagation();
    setDeleteError("");
    setBookToDelete(book);
  };

  const closeDeleteAlert = () => {
    if (deleting) return;
    setBookToDelete(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!bookToDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteBook(bookToDelete.id);
      setBooks((current) => current.filter((b) => b.id !== bookToDelete.id));
      setBookToDelete(null);
    } catch (err) {
      console.error("Delete book failed:", err);
      setDeleteError("We couldn't delete this book. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const currentFailure = failureQueue[0] ?? null;

  // Close the alert: mark it as seen on the server, then show the next one.
  const dismissFailure = () => {
    if (!currentFailure) return;
    acknowledgeBookFailures([currentFailure._id]).catch(() => {});
    setFailureQueue((queue) => queue.slice(1));
  };

  return (
    <section className="w-full overflow-hidden rounded-2xl bg-transparent">
      <div className="p-3">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-(--text-heading) sm:text-3xl">
              Your Books
            </h2>
            <p className="mt-1.5 text-sm text-(--text-muted)">
              All the stories you've created.
            </p>
          </div>

          <AnimatedSearch
            search={search}
            setSearch={setSearch}
            placeholder={search ? "" : placeholder}
          />
        </div>

        {/* Grid */}

        {loading && (
          <p className="py-16 text-center text-sm font-medium text-(--text-muted)">
            Loading your books...
          </p>
        )}

        {!loading && error && (
          <p className="py-16 text-center text-sm font-medium text-[#d64545]">
            {error}
          </p>
        )}

        {!loading && !error && filteredBooks.length === 0 && (
          <p className="py-16 text-center text-sm font-medium text-(--text-muted)">
            {books.length === 0
              ? "No books yet. Create your first story!"
              : "No books match your search."}
          </p>
        )}

        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
  {filteredBooks.map((book) => {
    // Still being created -> loading skeleton (not clickable) until completed.
    if (book.status === "Generating") {
      return <BookSkeleton key={book.id} progress={book.progress} />;
    }

    const primary = book.themeColor ?? "#7563C9";
    const dark = book.spineDark ?? "#302454";
    const isEmpty = !book.cover;

    const subtitle =
      book.genre ??
      book.category ??
      "Adventure";

    return (
      <div key={book.id} className="group relative min-w-0">
        {/* FAVORITE HEART */}
        <button
          type="button"
          onClick={(event) => handleToggleFavorite(event, book.id, !book.isFavorite)}
          aria-label={book.isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={book.isFavorite}
          className="absolute right-[9%] top-5 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.16)] backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-90"
        >
          <Heart
            size={18}
            strokeWidth={1.8}
            className={`transition-all duration-300 ${
              book.isFavorite
                ? "scale-110 fill-[#F05B78] text-[#F05B78]"
                : "text-[#777387]"
            }`}
          />
        </button>

        {heartBursts[book.id] && (
          <div className="pointer-events-none absolute inset-0 z-40 overflow-visible">
            {[...Array(10)].map((_, index) => (
              <span key={index} className={`heart-burst heart-${index}`}>
                ♥
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => handleBookClick(book.id)}
          className="block w-full text-left outline-none"
        >
          {/* BOOK WRAPPER */}
          <div className="relative flex justify-center py-2">
            <div
              className="
                relative w-[88%]
                origin-center
                transition-transform
                duration-300
                ease-out
                group-hover:scale-[1.035]
                sm:w-[90%]
              "
            >
              {/* ================= BOOK COVER ================= */}
              <div
                className="
                  relative
                  aspect-3/4
                  overflow-hidden
                  rounded-t-[14px]
                "
                style={{
                  background: isEmpty
                    ? `linear-gradient(145deg, ${primary}, ${dark})`
                    : "#1f1b28",
                  boxShadow: `
                    2px 1px 0 ${dark},
                    4px 8px 16px rgba(35,25,55,0.15)
                  `,
                }}
              >
                {/* COVER IMAGE */}
                {!isEmpty && (
                  <img
                    src={book.cover}
                    alt={book.title ?? "Book cover"}
                    className="
                      absolute inset-0
                      z-1
                      h-full w-full
                      object-cover
                    "
                  />
                )}

                {/* =====================================
                    DARK COVER OVERLAY
                    Makes the title readable
                ====================================== */}
                <div
                  className="absolute inset-0 z-5"
                  style={{
                    background: isEmpty
                      ? "linear-gradient(to top, rgba(20,15,35,0.45), transparent 65%)"
                      : `
                        linear-gradient(
                          to top,
                          rgba(10,8,15,0.92) 0%,
                          rgba(10,8,15,0.72) 25%,
                          rgba(10,8,15,0.20) 55%,
                          transparent 78%
                        )
                      `,
                  }}
                />

                {/* =====================================
                    BOOK TITLE ON COVER
                ====================================== */}
                <div
                  className="
                    absolute
                    inset-x-0
                    bottom-0
                    z-20
                    px-5
                    pb-7
                    pt-16
                  "
                >
                  <div className="text-center">
                    {/* MAIN TITLE */}
                    <h3
                      className="
                        font-serif
                        text-[22px]
                        font-bold
                        leading-[1.05]
                        tracking-[0.01em]
                        text-white
                        drop-shadow-[0_2px_5px_rgba(0,0,0,0.65)]
                        sm:text-[24px]
                      "
                      style={{
                        textShadow:
                          "0 2px 5px rgba(0,0,0,0.65)",
                      }}
                    >
                      {book.title ?? "Untitled Story"}
                    </h3>

                    {/* SUBTITLE */}
                    <p
                      className="
                        mt-3
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.22em]
                        text-white/75
                        drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]
                      "
                    >
                      {subtitle}
                    </p>
                  </div>
                </div>

                {/* =====================================
                    BOOK SPINE
                ====================================== */}
                <div
                  className="absolute inset-y-0 left-0 z-30 w-3.5"
                  style={{
                    background: `
                      linear-gradient(
                        90deg,
                        ${dark} 0%,
                        ${primary} 32%,
                        ${primary} 78%,
                        rgba(255,255,255,0.16) 100%
                      )
                    `,
                    boxShadow: `
                      inset 2px 0 3px rgba(0,0,0,0.16),
                      2px 0 3px rgba(0,0,0,0.14)
                    `,
                  }}
                >
                  {/* subtle spine edge */}
                  <div
                    className="absolute inset-y-0 right-0 w-px"
                    style={{
                      background: "rgba(255,255,255,0.18)",
                    }}
                  />
                </div>

                {/* =====================================
                    CURVED BINDING MARKS
                ====================================== */}
                <svg
                  className="
                    pointer-events-none
                    absolute left-0 top-0
                    z-40
                    h-full w-5.5
                  "
                  viewBox="0 0 22 400"
                  preserveAspectRatio="none"
                >
                  {[65, 200, 335].map((y) => (
                    <path
                      key={y}
                      d={`
                        M -2 ${y}
                        C 7 ${y - 12}, 14 ${y - 10}, 15 ${y}
                        C 15 ${y + 8}, 8 ${y + 14}, -2 ${y + 24}
                      `}
                      stroke="rgba(255,255,255,0.30)"
                      strokeWidth="1.2"
                      fill="none"
                    />
                  ))}
                </svg>

                {/* =====================================
                    SPINE DEPTH
                ====================================== */}
                <div
                  className="
                    pointer-events-none
                    absolute inset-y-0
                    left-3.5
                    z-35
                    w-1.25
                  "
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(0,0,0,0.13), transparent)",
                  }}
                />

                {/* =====================================
                    DELETE (replaces the status badge)
                ====================================== */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Delete ${book.title ?? "this book"}`}
                  title="Delete book"
                  onClick={(event) => askDelete(event, book)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      askDelete(event, book);
                    }
                  }}
                  className="absolute left-5 top-3 z-50 flex cursor-pointer items-center gap-1.5 rounded-full bg-[#d64545] px-2.5 py-1 text-[20px] font-bold text-white shadow-[0_3px_8px_rgba(0,0,0,0.16)] transition hover:bg-[#c23636] active:scale-95"
                >
                  <Trash2 size={15} strokeWidth={2.4} />
                </div>

                {/* EMPTY BOOK DECORATION */}
                {isEmpty && (
                  <div className="absolute bottom-5 left-4 right-4 z-25">
                    <div className="flex justify-end gap-1">
                      <span className="h-0.75 w-5 rounded-full bg-white/30" />
                      <span className="h-0.75 w-2 rounded-full bg-white/30" />
                    </div>
                  </div>
                )}
              </div>

              {/* ================= PAGE BLOCK ================= */}
              <div
                className="
                  relative
                  h-5
                  w-full
                  overflow-visible
                  rounded-b-[10px]
                "
                style={{
                  borderTop: `2px solid ${primary}`,
                  background: `
                    repeating-linear-gradient(
                      to bottom,
                      #fffdf8 0px,
                      #fffdf8 3px,
                      #e6ddcd 3px,
                      #e6ddcd 4px
                    )
                  `,
                  boxShadow: `
                    2px 4px 6px rgba(35,25,55,0.12),
                    5px 8px 14px rgba(35,25,55,0.10)
                  `,
                }}
              >
                {/* PAGE DETAIL LINE 1 */}
                <div
                  className="
                    absolute
                    left-4 right-3
                    top-1.25
                    h-px
                  "
                  style={{
                    background:
                      "linear-gradient(to right, transparent, #d8cebc, transparent)",
                  }}
                />

                {/* PAGE DETAIL LINE 2 */}
                <div
                  className="
                    absolute
                    left-6 right-4
                    top-2.75
                    h-px
                  "
                  style={{
                    background:
                      "linear-gradient(to right, transparent, #d8cebc, transparent)",
                  }}
                />

                {/* =====================================
                    RIBBON SHADOW
                ====================================== */}
                <div
                  className="
                    absolute
                    left-6
                    -top-0.5
                    z-5
                    h-8.5
                    w-4
                  "
                  style={{
                    background: dark,
                    opacity: 0.22,
                    transform: "translate(2px, 2px)",
                    clipPath:
                      "polygon(0 0, 100% 0, 100% 76%, 50% 100%, 0 76%)",
                  }}
                />

                {/* =====================================
                    MAIN RIBBON
                ====================================== */}
                <div
                  className="
                    absolute
                    left-6
                    -top-0.5
                    z-20
                    h-8.5
                    w-4
                  "
                  style={{
                    background: `
                      linear-gradient(
                        90deg,
                        ${dark} 0%,
                        ${primary} 55%,
                        ${primary} 100%
                      )
                    `,
                    clipPath:
                      "polygon(0 0, 100% 0, 100% 76%, 50% 100%, 0 76%)",
                    boxShadow:
                      "1px 2px 3px rgba(0,0,0,0.18)",
                  }}
                />
              </div>
            </div>
          </div>
        </button>

        {/* ================= BOOK META INFORMATION ================= */}
        <div
          className="
            mt-3
            flex
            items-center
            justify-center
            gap-2
            whitespace-nowrap
            text-[13px]
            text-[#6b6680]
          "
        >
          <BookOpen
            size={15}
            className="shrink-0"
            style={{ color: primary }}
          />

          <span className="font-medium">
            {book.pages ?? book.pageCount ?? 0}{" "}
            {(book.pages ?? book.pageCount ?? 0) === 1 ? "Page" : "Pages"}
          </span>

          <span className="text-[#c7c3d4]">·</span>

          <Clock
            size={14}
            className="shrink-0 text-[#8c879b]"
          />

          <span>
            {book.updatedAt ?? "Not started yet"}
          </span>
        </div>
      </div>
    );
  })}
</div>
        {filteredBooks.length === 0 && (
          <div className="flex min-h-75 items-center justify-center">
            <div className="text-center">
              <p className="text-base font-semibold text-[#4a4665]">No books found</p>
              <p className="mt-1.5 text-sm text-(--text-muted)">Try another search.</p>
            </div>
          </div>
        )}
      </div>

      <WonderAlertModal
        isOpen={Boolean(currentFailure)}
        onClose={dismissFailure}
        type="error"
        title="We couldn't create your book"
        message={
          !currentFailure
            ? ""
            : currentFailure.title && currentFailure.title !== "Untitled Story"
              ? `"${currentFailure.title}"\n${currentFailure.reason}`
              : currentFailure.reason
        }
        primaryText="Try Again"
        onPrimary={() => {
          dismissFailure();
          navigate("/create");
        }}
      />

      <WonderAlertModal
        isOpen={Boolean(bookToDelete)}
        onClose={closeDeleteAlert}
        type="danger"
        title="Delete this book?"
        message={
          !bookToDelete
            ? ""
            : deleteError ||
              `"${bookToDelete.title ?? "Untitled Story"}" will be permanently deleted. This can't be undone.`
        }
        primaryText={deleting ? "Deleting..." : "Yes, Delete"}
        onPrimary={confirmDelete}
        secondaryText="No, Keep It"
        onSecondary={closeDeleteAlert}
      />
    </section>
  );
};