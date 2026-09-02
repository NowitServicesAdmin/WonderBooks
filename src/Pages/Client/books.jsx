import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Crown, BookOpen, Clock, Search, MoreHorizontal } from "lucide-react";
import { myBooks } from "./../../Data/Templatesdata";

export const Books = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [heartBursts, setHeartBursts] = useState({});
  const fullPlaceholder = "Search Your Books";
  const [placeholder, setPlaceholder] = useState("");

  // myBooks has no `category` field, so filtering is by title / createdFor only.
  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return myBooks;

    return myBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        (book.createdFor ?? "").toLowerCase().includes(query)
    );
  }, [search]);

  const AnimatedSearch = ({ search, setSearch }) => (
    <div className="flex h-11 w-[420px] items-center gap-2 rounded-xl border border-[#e4e1ed] bg-[#faf9fc] px-3.5 transition focus-within:border-[#b9b0f2] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(148,120,235,0.12)]">
      <Search size={18} strokeWidth={2} className="shrink-0 text-[#8c87a3]" />
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-[#403b61] outline-none placeholder:text-[#aaa7b8]"
      />
    </div>
  );

  useEffect(() => {
    if (search) {
      setPlaceholder("");
      return;
    }
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

  const handleBookClick = (id) => navigate(`/templates/${id}`);

  const toggleFavorite = (event, id) => {
    event.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };


  return (
    <section className="w-full overflow-hidden rounded-2xl bg-transparent">
      <div className="p-3">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#29264d] sm:text-3xl">
              Your Books
            </h2>
            <p className="mt-1.5 text-sm text-[#8f8ba3]">
              All the stories you've created.
            </p>
          </div>

          <AnimatedSearch search={search} setSearch={setSearch} />
        </div>

        {/* Grid */}

        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
  {filteredBooks.map((book) => {
    const primary = book.themeColor ?? "#7563C9";
    const dark = book.spineDark ?? "#302454";
    const isEmpty = !book.cover;

    const status =
      book.status ??
      (book.progress === 100
        ? "Completed"
        : book.progress > 0
          ? "Draft"
          : "Generating");

    const statusColor =
      status === "Completed"
        ? "#2f9e5c"
        : status === "Draft"
          ? "#7563C9"
          : "#e0862e";

    const subtitle =
      book.genre ??
      book.category ??
      "Adventure";

    return (
      <div key={book.id} className="group min-w-0">
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
                  aspect-[3/4]
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
                      z-[1]
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
                  className="absolute inset-0 z-[5]"
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
                    z-[20]
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
                  className="absolute inset-y-0 left-0 z-30 w-[14px]"
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
                    className="absolute inset-y-0 right-0 w-[1px]"
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
                    h-full w-[22px]
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
                    left-[14px]
                    z-[35]
                    w-[5px]
                  "
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(0,0,0,0.13), transparent)",
                  }}
                />

                {/* =====================================
                    STATUS
                ====================================== */}
                <div className="absolute left-5 top-3 z-50">
                  <div
                    className="
                      flex items-center gap-1.5
                      rounded-full
                      px-2.5 py-1
                      text-[11px]
                      font-bold
                      text-white
                      shadow-[0_3px_8px_rgba(0,0,0,0.16)]
                    "
                    style={{
                      backgroundColor: statusColor,
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                    {status}
                  </div>
                </div>

                {/* EMPTY BOOK DECORATION */}
                {isEmpty && (
                  <div className="absolute bottom-5 left-4 right-4 z-[25]">
                    <div className="flex justify-end gap-1">
                      <span className="h-[3px] w-5 rounded-full bg-white/30" />
                      <span className="h-[3px] w-2 rounded-full bg-white/30" />
                    </div>
                  </div>
                )}
              </div>

              {/* ================= PAGE BLOCK ================= */}
              <div
                className="
                  relative
                  h-[20px]
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
                    top-[5px]
                    h-[1px]
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
                    top-[11px]
                    h-[1px]
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
                    top-[-2px]
                    z-[5]
                    h-[34px]
                    w-[16px]
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
                    top-[-2px]
                    z-20
                    h-[34px]
                    w-[16px]
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
            {book.pages ?? book.pageCount ?? 0} Pages
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
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <p className="text-base font-semibold text-[#4a4665]">No books found</p>
              <p className="mt-1.5 text-sm text-[#9995aa]">Try another search.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};