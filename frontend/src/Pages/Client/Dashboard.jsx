/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo, useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  Lightbulb,
  // MoreVertical,
  PenLine,
  Plus,
  RefreshCw,
  Sparkles,
  CalendarDays,
  ChevronLeft,
  X,
  ShoppingBagIcon,
} from "lucide-react";
import { templates } from "../../Data/Templatesdata";
import { suggestionIdeas } from "../../Data/storyIdeas";
import { getMyBooks } from "../../services/bookService";
import { ContinueCreating } from "../../Components/AnimatedBook";
import { useNavigate } from "react-router-dom";

// How many books the "My Books" block on the dashboard shows at most.
const MAX_DASHBOARD_BOOKS = 6;

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

const toDashboardBook = (b) => {
  const pageCount = b.pageCount || 0;
  const completedPages = b.completedPages || 0;

  return {
    id: b._id,
    title: b.title,
    cover: b.coverImageUrl,
    theme: b.theme || null,
    createdFor: b.createdFor || null,
    pageCount,
    completedPages,
    createdAt: b.createdAt || null,
    completedAt: b.completedAt || null,
    updatedAt: formatUpdated(b.updatedAt ?? b.createdAt) || "Updated recently",
    progress:
      b.status === "completed"
        ? 100
        : b.status === "failed"
          ? 0
          : pageCount > 0
            ? Math.max(5, Math.round((completedPages / pageCount) * 100))
            : 5,
    status:
      b.status === "completed"
        ? "Completed"
        : b.status === "failed"
          ? "Failed"
          : "In Progress",
  };
};

/* -------------------------------------------------------------------------- */
/*                               MAIN DASHBOARD                               */
/* -------------------------------------------------------------------------- */

export const Dashboard = () => {
  const navigate = useNavigate();
  const [ideasOpen, setIdeasOpen] = useState(false);

  const [allBooks, setAllBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getMyBooks();
        if (cancelled) return;
        setAllBooks(data.map(toDashboardBook));
        setBooksError("");
      } catch {
        if (cancelled) return;
        setBooksError("We couldn't load your books.");
      } finally {
        if (!cancelled) setBooksLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Only the most recent MAX_DASHBOARD_BOOKS show up here - the full list lives on /books.
  const dashboardBooks = useMemo(
    () => allBooks.slice(0, MAX_DASHBOARD_BOOKS),
    [allBooks]
  );

  const templateCards = useMemo(
    () => templates.slice(0, 6),
    []
  );

  // The story to show in "Continue Creating" - latest non-failed book,
  // whether it's still generating or just finished.
  const continueBook = useMemo(
    () => allBooks.find((b) => b.status !== "Failed") || null,
    [allBooks]
  );

  // While that book is still generating, poll for its progress so the
  // percentage updates on its own instead of needing a page reload.
  useEffect(() => {
    if (!continueBook || continueBook.status !== "In Progress") return;

    const interval = setInterval(async () => {
      try {
        const data = await getMyBooks();
        setAllBooks(data.map(toDashboardBook));
      } catch {
        // Silent - keep showing the last known progress and try again next tick.
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [continueBook?.id, continueBook?.status]);

  return (
    <>
      <main className="min-h-full px-4  sm:px-5 lg:px-6 xl:px-6 2xl:px-7">
        <div className="mx-auto w-full max-w-362.5">

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_342px]">
            <div className="min-w-0 space-y-4">
              <ContinueCreating
                book={continueBook}
                onGetIdeas={() => setIdeasOpen(true)}
                onCreateNew={() => navigate("/create")}
              />

              <MyBooksSection
                books={dashboardBooks}
                loading={booksLoading}
                error={booksError}
                onViewAll={() => navigate("/books")}
              />

              {/* <TemplatesSection templates={templateCards} /> */}
            </div>

            <aside className="space-y-4">
              <QuickActions onAiIdeas={() => setIdeasOpen(true)} />
              <JourneyCard books={allBooks} />
              {/* <PrintBookCard /> */}
            </aside>
          </div>
        </div>
      </main>

      <IdeasDrawer open={ideasOpen} onClose={() => setIdeasOpen(false)} />

    </>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  MY BOOKS                                  */
/* -------------------------------------------------------------------------- */

const MyBooksSection = ({ books, loading, error, onViewAll }) => (
  <section className="rounded-[20px] border border-(--border) bg-(--surface) px-5 py-5 shadow-[0_7px_24px_rgba(61,48,104,0.04)] sm:px-6">
    <SectionHeader
      icon={BookOpen}
      title="My Books"
      onViewAll={onViewAll}
    />

    {loading && (
      <div className="flex min-h-52 items-center justify-center">
        <p className="text-sm font-medium text-(--text-muted)">
          Loading your books...
        </p>
      </div>
    )}

    {!loading && error && (
      <div className="flex min-h-52 items-center justify-center">
        <p className="text-sm font-medium text-[#d64545]">
          {error}
        </p>
      </div>
    )}

    {!loading && !error && books.length === 0 && (
      <div className="flex min-h-52 flex-col items-center justify-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--tint) text-(--accent-hover)">
          <BookOpen size={25} strokeWidth={1.8} />
        </div>

        <p className="mt-3 text-sm font-semibold text-(--text)">
          No books yet
        </p>

        <p className="mt-1 text-xs text-(--text-muted)">
          Create your first magical story!
        </p>
      </div>
    )}

    {!loading && !error && books.length > 0 && (
      <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {books.map((book) => (
          <DashboardBookCard
            key={book.id}
            book={book}
          />
        ))}
      </div>
    )}
  </section>
);

const DashboardBookCard = ({ book }) => {
  const navigate = useNavigate();
  const status = book.status || "Completed";

  return (
    <button
      type="button"
      onClick={() => navigate(`/books/${book.id}`)}
      className="group min-w-0 text-left"
    >
      <div className="flex h-47 items-end justify-center">
        <SmallBook book={book} />
      </div>

      <div className="mt-3 min-w-0">
        <h3
          title={book.title}
          className="truncate text-[13px] font-bold leading-5 text-(--text) transition-colors group-hover:text-(--accent-hover)"
        >
          {book.title}
        </h3>

        <div className="mt-2">
          <StatusBadge status={status} />
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-(--text-muted)">
          <Clock3 size={12} strokeWidth={1.8} />
          <span className="truncate">
            {book.updatedAt || "Updated recently"}
          </span>
        </div>
      </div>
    </button>
  );
};


const SectionHeader = ({ icon: Icon, title, onViewAll }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && (<Icon size={25} strokeWidth={1.9} className="text-(--accent-hover)"/>)}
      <h2 className="text-[20px] font-bold text-(--text)">{title}</h2>
    </div>

    <button type="button" onClick={onViewAll} className="group flex items-center gap-1.5 text-[13px] font-semibold text-(--accent-hover) transition-colors hover:text-(--accent)">
      View All
      <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5"/>
    </button>
  </div>
);


const SmallBook = ({ book }) => (
  <div className="group/book relative h-45 w-33 transition-transform duration-300 group-hover:-translate-y-1.5">
    {/* Ground shadow */}
    <div className="absolute bottom-1 left-1/2 h-3 w-27 -translate-x-1/2 rounded-full bg-black/20 blur-md" />

    {/* Back cover */}
    <div className="absolute bottom-1.5 left-0.5 h-42 w-31.5 rounded-[8px_10px_10px_8px] border border-[#bcb5c7] bg-[#ded9e5] shadow-[3px_5px_8px_rgba(0,0,0,0.14)] dark:border-[#40384d] dark:bg-[#292531]" />

    {/* Page block - only a small amount should be visible */}
    <div className="absolute bottom-2 right-0.5 h-41 w-2.25 rounded-r-md border-y border-r border-[#d5ccbd] bg-[#f7f1e7] shadow-[1px_2px_4px_rgba(0,0,0,0.12)]">
      <div className="absolute inset-y-2 left-0.5 w-px bg-[#e1d8c9]" />
      <div className="absolute inset-y-2 left-1.25 w-px bg-[#ebe3d7]" />
    </div>

    {/* Spine - attached to the cover, not floating separately */}
    <div className="absolute bottom-1.5 left-px z-10 h-42 w-4.25 rounded-[8px_2px_2px_8px] border border-[#403654] bg-linear-to-r from-[#302744] via-[#4a3d61] to-[#5b4d70] shadow-[-2px_4px_7px_rgba(0,0,0,0.22)]">
      <div className="absolute left-1.25 top-3 h-36 w-px bg-white/10" />
      <div className="absolute bottom-3.5 left-1 right-1 h-px bg-white/10" />
    </div>

    {/* Main hardcover */}
    <div className="absolute bottom-2 left-2.25 z-20 h-41 w-29 overflow-hidden rounded-[4px_8px_8px_4px] border border-black/25 bg-[#f5f1e9] shadow-[5px_7px_12px_rgba(30,23,45,0.25)] transition-all duration-300 group-hover/book:shadow-[7px_10px_16px_rgba(30,23,45,0.32)]">
      <img
        src={book.cover}
        alt={book.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover/book:scale-[1.02]"
      />

      {/* Very subtle cover depth */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/10" />

      {/* Inner cover edge */}
      <div className="pointer-events-none absolute inset-0.75 rounded-[2px_6px_6px_2px] border border-white/15" />
    </div>

    {/* Bookmark attached to the bottom of the cover */}
{/* Bookmark */}
<div className="absolute left-4 top-2 z-30 h-7.75 w-2.75 bg-[#f3a21b] shadow-[1px_2px_3px_rgba(0,0,0,0.16)] [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)] transition-transform duration-300 group-hover/book:translate-y-1" />
</div>
);

/* -------------------------------------------------------------------------- */
/*                               RIGHT SIDEBAR                                */
/* -------------------------------------------------------------------------- */

const QuickActions = ({ onAiIdeas }) => {
  const navigate = useNavigate()
  const actions = [
    { title: "Create New Book", subtitle: "Start a new magical story", icon: Plus, navigation: '/create' },
    { title: "AI Story Ideas", subtitle: "Get inspired with ideas", icon: Sparkles, onClick: onAiIdeas },
    { title: "Templates", subtitle: "Choose from beautiful templates", icon: FileText, navigation: '/templates' },
    { title: "MY Orders", subtitle: "View your complete orders", icon: ShoppingBagIcon, navigation: '/orders' },
  ];

  return (
    <section className="rounded-[20px] border border-[#e4e1ea] bg-(--surface) p-5 shadow-[0_7px_24px_rgba(61,48,104,0.045)]">
      <div className="mb-4 flex items-center gap-3">
        <Sparkles size={26} className="text-[#4f2aad]" />
        <h2 className="text-[21px] font-bold text-[#33385c]">Quick Actions</h2>
      </div>

      <div className="divide-y divide-(--tint)">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button key={action.title} onClick={() => (action.onClick ? action.onClick() : navigate(action.navigation))} className="flex w-full items-center gap-3 py-4 text-left first:pt-1 last:pb-1 group">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f0edfa] text-[#5736b1] transition group-hover:bg-[#e8e2fa]">
                <Icon size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-[#3d435f]">{action.title}</span>
                <span className="mt-1 block truncate text-[13px] text-[#68708c]">{action.subtitle}</span>
              </span>
              <ChevronRight size={20} className="text-[#6d6596]" />
            </button>
          );
        })}
      </div>
    </section>
  );
};

// Rough estimate only (no real time-tracking yet): ~4 minutes of "imagining"
// per completed page, shown as hours.
const MINUTES_PER_PAGE_ESTIMATE = 4;

const JourneyCard = ({ books = [] }) => {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const pickerRef = useRef(null);

  // Stories are bucketed by the month they were started (createdAt); completions
  // are bucketed by the month they actually finished (completedAt).
  const stats = useMemo(() => {
    const inSelectedMonth = (isoDate) => {
      if (!isoDate) return false;
      const d = new Date(isoDate);
      return (
        !Number.isNaN(d.getTime()) &&
        d.getMonth() === selectedMonth &&
        d.getFullYear() === selectedYear
      );
    };

    const startedThisMonth = books.filter((b) => inSelectedMonth(b.createdAt));
    const completedThisMonth = books.filter((b) => inSelectedMonth(b.completedAt));

    const pagesWritten = startedThisMonth.reduce(
      (sum, b) => sum + (b.completedPages || 0),
      0
    );

    const hoursImagined = (pagesWritten * MINUTES_PER_PAGE_ESTIMATE) / 60;

    return [
      { label: "Stories Created", value: String(startedThisMonth.length), icon: FileText },
      { label: "Pages Written", value: String(pagesWritten), icon: PenLine },
      { label: "Books Completed", value: String(completedThisMonth.length), icon: BookOpen },
      { label: "Hours Imagined", value: hoursImagined.toFixed(1), icon: Clock3 },
    ];
  }, [books, selectedMonth, selectedYear]);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsMonthPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMonthSelect = (index) => {
    setSelectedMonth(index);
    setIsMonthPickerOpen(false);
    // Stats above recompute automatically from `books` for the new month/year.
  };

  const displayLabel =
    selectedMonth === currentMonth && selectedYear === currentYear
      ? "This Month"
      : `${months[selectedMonth].slice(0, 3)} ${selectedYear}`;

  return (
    <section className="relative rounded-[20px] border border-[#e4e1ea] bg-(--surface) p-5 shadow-[0_7px_24px_rgba(61,48,104,0.045)]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-[#34395d]">
            Your Journey
          </h2>
          <p className="mt-1 text-[12px] text-[#9296a8]">
            Your creative progress
          </p>
        </div>

        {/* Month Selector */}
        <div ref={pickerRef} className="relative">
          <button
            onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
            className={`flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[12px] font-medium transition-all ${isMonthPickerOpen
              ? "border-[#8b6ee8] bg-(--tint) text-(--accent-hover)"
              : "border-(--border) bg-(--surface) text-[#646b85] hover:border-[#b9a9e8]"
              }`}
          >
            <CalendarDays size={14} />
            {displayLabel}
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isMonthPickerOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {/* Month Picker Dropdown */}
          {isMonthPickerOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-72.5 rounded-2xl border border-[#e7e3ee] bg-(--surface) p-4 shadow-[0_16px_40px_rgba(61,48,104,0.15)]">

              {/* Year Navigation */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setSelectedYear(selectedYear - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#72778c] transition hover:bg-(--tint) hover:text-(--accent-hover)"
                >
                  <ChevronLeft size={17} />
                </button>

                <span className="text-[15px] font-bold text-[#34395d]">
                  {selectedYear}
                </span>

                <button
                  disabled={selectedYear >= currentYear}
                  onClick={() => setSelectedYear(selectedYear + 1)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${selectedYear >= currentYear
                    ? "cursor-not-allowed text-[#d4d1db]"
                    : "text-[#72778c] hover:bg-(--tint) hover:text-(--accent-hover)"
                    }`}
                >
                  <ChevronRight size={17} />
                </button>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => {
                  const isSelected = selectedMonth === index;

                  const isFutureMonth =
                    selectedYear === currentYear &&
                    index > currentMonth;

                  return (
                    <button
                      key={month}
                      disabled={isFutureMonth}
                      onClick={() => handleMonthSelect(index)}
                      className={`rounded-[9px] px-2 py-2.5 text-[12px] font-medium transition-all ${isSelected
                        ? "bg-(--accent-hover) text-white shadow-[0_4px_10px_rgba(89,57,177,0.25)]"
                        : isFutureMonth
                          ? "cursor-not-allowed text-[#d8d5df]"
                          : "text-[#626880] hover:bg-[#f2eff9] hover:text-(--accent-hover)"
                        }`}
                    >
                      {month.slice(0, 3)}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-4 border-t border-(--tint) pt-3">
                <button
                  onClick={() => {
                    setSelectedMonth(currentMonth);
                    setSelectedYear(currentYear);
                    setIsMonthPickerOpen(false);
                  }}
                  className="w-full rounded-[9px] bg-(--tint) py-2 text-[12px] font-semibold text-(--accent-hover) transition hover:bg-[#ebe6f7]"
                >
                  Go to Current Month
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 divide-y divide-(--tint)">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <button
              key={stat.label}
              className="group flex w-full items-center gap-3 py-4 text-left transition"
            >
              <span className="flex h-9.5 w-9.5 items-center justify-center rounded-[10px] bg-[#f1eef9] text-(--accent-hover) transition group-hover:scale-105 group-hover:bg-[#e9e3fa]">
                <Icon size={18} />
              </span>

              <span className="flex-1 text-[14px] font-medium text-[#4c536f]">
                {stat.label}
              </span>

              <span className="text-[16px] font-bold text-[#303651]">
                {stat.value}
              </span>

              {/* <ChevronRight
                size={18}
                className="text-[#b0b2bf] transition group-hover:translate-x-0.5 group-hover:text-(--accent-hover)"
              /> */}
            </button>
          );
        })}
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*                                IDEAS DRAWER                                */
/* -------------------------------------------------------------------------- */

// How many story ideas the drawer shows at a time.
const IDEAS_PER_VIEW = 5;

// Fisher-Yates shuffle on a copy, so the source list is never mutated.
const shuffleIdeas = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const IdeasDrawer = ({ open, onClose }) => {
  const navigate = useNavigate();
  const listRef = useRef(null);
  const [shuffled, setShuffled] = useState(() => shuffleIdeas(suggestionIdeas));
  const [page, setPage] = useState(0);

  const pageCount = Math.ceil(shuffled.length / IDEAS_PER_VIEW);
  const visibleIdeas = shuffled.slice(
    page * IDEAS_PER_VIEW,
    (page + 1) * IDEAS_PER_VIEW
  );

  // Picking an idea opens AI creation mode - same destination and state as the header search.
  const handleSelect = (idea) => {
    onClose();
    navigate("/create/bookcreation", { state: { mode: "ai", idea } });
  };

  // Next group of ideas; reshuffle once every idea has been seen.
  const handleMore = () => {
    if (page + 1 < pageCount) {
      setPage(page + 1);
    } else {
      setShuffled(shuffleIdeas(suggestionIdeas));
      setPage(0);
    }
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-[#20173d]/20 backdrop-blur-[1px] transition ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside className={`fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-107.5 flex-col border-l border-[#e7e2ef] bg-[#fcfbff] shadow-[-16px_0_45px_rgba(37,26,69,0.14)] transition-transform duration-500 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-start justify-between border-b border-[#ece8f2] p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-(--tint) text-[#5735b0]"><Lightbulb size={22} /></span>
            <div>
              <h2 className="text-[20px] font-bold text-[#343955]">Story Ideas</h2>
              <p className="mt-1 text-[12px] text-[#7d8296]">Fresh inspiration for your adventure</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-[#6d7186] hover:bg-[#f1eff5]"><X size={20} /></button>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto p-6">
          <div className="rounded-[14px] border border-[#e3ddf5] bg-(--tint) p-4">
            <div className="flex gap-3"><Sparkles className="shrink-0 text-[#6749bf]" size={20} /><div><h3 className="font-bold text-[#454b67]">Where should the story go next?</h3><p className="mt-1 text-[12px] leading-5 text-[#777d92]">Pick an idea and we&apos;ll start creating it with AI.</p></div></div>
          </div>
          <div className="mt-5 space-y-3">
            {visibleIdeas.map((idea, index) => (
              <button key={idea} onClick={() => handleSelect(idea)} className="w-full rounded-[14px] border border-[#e7e3ed] bg-(--surface) p-4 text-left transition hover:-translate-y-px hover:shadow-md">
                <div className="flex items-start justify-between gap-3"><h3 className="text-[14px] font-bold leading-5 text-[#414661]">{idea}</h3><span className="text-[#6749bf]">{String(index + 1).padStart(2, "0")}</span></div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#ece8f2] p-6">
          <button onClick={handleMore} className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#4e299f] py-3.5 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(78,41,159,0.2)]"><RefreshCw size={16} />Generate More Ideas</button>
        </div>
      </aside>
    </>
  );
};


const StatusBadge = ({ status }) => {
  const styles = {
    Completed:"bg-[#eaf7ef] text-[#408467] dark:bg-[#aad8c3] dark:text-[#01220f]",
    "In Progress":"bg-[#fff6e7] text-[#c68830] dark:bg-[#3d301b] dark:text-[#f1bd62]",
    Draft:"bg-[#eef1f7] text-[#5d6684] dark:bg-[#292c39] dark:text-[#adb5ca]",
    Failed:"bg-[#fdecec] text-[#c0392b] dark:bg-[#402326] dark:text-[#ef8585]",
  };

  const dots = {
    Completed: "bg-[#55b77b]",
    "In Progress": "bg-[#e6a43a]",
    Draft: "bg-[#8991aa]",
    Failed: "bg-[#d95757]",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${ styles[status] || styles.Draft }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ dots[status] || dots.Draft }`}/>
      {status}
    </span>
  );
};
export default Dashboard;