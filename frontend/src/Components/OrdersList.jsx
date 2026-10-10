import { useEffect, useMemo, useRef, useState } from "react";
import { Search, RefreshCw, ArrowUpDown, CalendarDays, BookOpen, ChevronRight, ChevronLeft, Loader2, Package } from "lucide-react";
import { StatusBadge, BookCover, ui, statusStyle } from "./orderUtils";
import { CartButton } from './CartButton';

const TABS = [
  { key: "All Orders", label: "All" }, // key = original tab name, label = new design
  { key: "In Progress", label: "In Progress" },
  { key: "Shipped", label: "Shipped" },
  { key: "Delivered", label: "Delivered" },
  { key: "Cancelled", label: "Cancelled" },
];
const PAGE_SIZE = 6; // 3 rows x 2 columns

const iconBtnBase = "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition";

export default function OrderList({ orders = [], loading = false, error = "", onSelectOrder }) {
  const [activeTab, setActiveTab] = useState("All Orders");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sort, setSort] = useState("newest"); // toggled by the arrow button
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const searchRef = useRef(null);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = orders.filter((o) => {
      const matchesTab = activeTab === "All Orders" || o.status === activeTab;
      const matchesSearch = (o.book?.title || "").toLowerCase().includes(q) || (o.orderId || "").toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
    return [...list].sort((a, b) =>
      sort === "newest" ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [orders, activeTab, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const toggleSearch = () => {
    if (showSearch) setSearch(""); // closing clears the filter
    setShowSearch((s) => !s);
    setPage(1);
  };
  const toggleSort = () => {
    setSort((s) => (s === "newest" ? "oldest" : "newest"));
    setPage(1);
  };
  const resetFilters = () => {
    setActiveTab("All Orders");
    setSearch("");
    setShowSearch(false);
    setSort("newest");
    setPage(1);
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <section className="flex min-h-full flex-col p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={`${ui.text} text-xl font-bold`}>My Orders</h1>
          <p className={`${ui.muted} mt-1 text-[13px]`}>Track and manage your physical book orders</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search expands to the LEFT of the icon buttons */}
          <CartButton/>
          <div
            aria-hidden={!showSearch}
            className={`overflow-hidden transition-all duration-300 ease-out ${
              showSearch ? "w-44 opacity-100 sm:w-64" : "-mr-3 w-0 opacity-0"
            }`}
          >
            <input
              ref={searchRef}
              tabIndex={showSearch ? 0 : -1}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => e.key === "Escape" && toggleSearch()}
              placeholder="Search your orders..."
              className={`${ui.input} h-11 w-full rounded-xl px-4 text-[13px] outline-none`}
            />
          </div>

          <button aria-label="Search orders" aria-pressed={showSearch} title="Search" onClick={toggleSearch}
            className={`${iconBtnBase} ${showSearch ? ui.iconBtnActive : ui.iconBtn}`}>
            <Search size={18} />
          </button>

          <button aria-label="Reset filters" title="Reset filters" onClick={resetFilters}
            className={`${iconBtnBase} ${refreshing ? ui.iconBtnActive : ui.iconBtn}`}>
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>

          <button aria-label="Toggle sort order" aria-pressed={sort === "oldest"}
            title={sort === "newest" ? "Newest first (click for oldest first)" : "Oldest first (click for newest first)"}
            onClick={toggleSort}
            className={`${iconBtnBase} ${sort === "oldest" ? ui.iconBtnActive : ui.iconBtn}`}>
            <ArrowUpDown size={18} className={`transition-transform duration-300 ${sort === "oldest" ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Underline tabs: outer div draws the line, inner div scrolls sideways only */}
      <div className={`${ui.divider} mt-6 border-b`}>
        <div className="flex gap-8 overflow-x-auto overflow-y-hidden scrollbar-none [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setPage(1); }}
                className={`relative shrink-0 pb-3 text-[13px] font-medium transition ${
                  active
                    ? "text-[#4f3fc4] dark:text-[#b3a6ff]"
                    : `${ui.muted} hover:text-[#4f3fc4] dark:hover:text-[#b3a6ff]`
                }`}
              >
                {t.label}
                {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#5b43d6] dark:bg-[#8b73ff]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards: 1 column on small screens, 2 columns from md up */}
      <div className="mt-5 grid grid-cols-1 gap-3 pb-4 md:grid-cols-2">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <Loader2 size={32} className="animate-spin text-violet-500" />
            <p className={`${ui.muted} mt-4 text-sm`}>Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <Package size={40} className={ui.subtle} />
            <h3 className={`${ui.text} mt-4 text-base font-bold`}>{error}</h3>
          </div>
        ) : visible.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <Package size={40} className={ui.subtle} />
            <h3 className={`${ui.text} mt-4 text-base font-bold`}>No orders found</h3>
            <p className={`${ui.muted} mt-2 text-sm`}>
              {orders.length === 0
                ? "Order a printed copy of one of your books to see it here."
                : "Try changing your search or filter."}
            </p>
          </div>
        ) : (
          visible.map((o) => {
            const st = statusStyle(o.status);
            const meta = [
              o.book?.binding || "Hardcover",
              o.book?.pages && `${o.book.pages} Pages`,
              o.book?.size && `${o.book.size} Size`,
              o.book?.language,
            ].filter(Boolean);

            return (
              <button
                key={o.orderId}
                onClick={() => onSelectOrder(o)}
                className={`${ui.surface} group relative flex min-h-32 w-full items-center gap-4 overflow-hidden rounded-2xl bg-linear-to-r ${st.card} to-white to-60% py-3 pl-6 pr-12 text-left transition hover:shadow-md dark:to-[#1b1830]`}
              >
                <span className={`absolute inset-y-0 left-0 w-1.5 ${st.bar}`} />

                <BookCover book={o.book} className="h-26 w-20" />

                <div className="min-w-0 flex-1 space-y-2.5">
                  <h3 className={`${ui.text} truncate pr-24 text-[15px] font-semibold`}>{o.book?.title}</h3>
                  <p className={`${ui.muted} flex flex-wrap items-center gap-x-2 text-xs`}>
                    <CalendarDays size={13} /> Ordered on {o.date} <span>•</span> {o.time}
                  </p>
                  <p className={`${ui.muted} flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]`}>
                    <BookOpen size={13} />
                    {meta.map((m, i) => (
                      <span key={m} className="flex items-center gap-2">
                        {i > 0 && <span>•</span>}
                        {m}
                      </span>
                    ))}
                  </p>
                </div>

                <StatusBadge status={o.status} className="absolute right-4 top-3" />
                <ChevronRight size={18} className={`${ui.subtle} absolute right-3 top-1/2 -translate-y-1/2 transition group-hover:translate-x-0.5`} />
                <span className={`${ui.text} absolute bottom-3 right-4 text-base font-bold`}>₹{o.price}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Pagination: pinned to the bottom */}
      {!loading && !error && orders.length > 0 && (
        <div className={`${ui.muted} sticky bottom-0 -mx-6 -mb-6 mt-auto flex items-center justify-between border-t border-[#ece8f7] bg-white/95 px-6 py-3 text-xs backdrop-blur dark:border-[#2e2a4a] dark:bg-[#13111f]`}>
          <span>Showing {filtered.length ? start + 1 : 0}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length} orders</span>
          <div className="flex items-center gap-2">
            <button disabled={safePage === 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page" className="rounded-lg p-2 hover:bg-[#f5f3ff] disabled:opacity-40 dark:hover:bg-[#262245]"><ChevronLeft size={16} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-8 w-8 rounded-lg text-xs font-medium ${
                  p === safePage
                    ? "bg-[#ebe5ff] text-[#4f3fc4] dark:bg-[#8b73ff]/25 dark:text-[#b3a6ff]"
                    : "hover:bg-[#f5f3ff] dark:hover:bg-[#262245]"
                }`}
              >
                {p}
              </button>
            ))}
            <button disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} aria-label="Next page" className="rounded-lg p-2 hover:bg-[#f5f3ff] disabled:opacity-40 dark:hover:bg-[#262245]"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </section>
  );
}