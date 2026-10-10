import { Clock, Truck, Ban } from "lucide-react";

/* ---------------------------------------------------------------------------
   Shared Tailwind class sets (light + dark:) used by the list and detail view.
   Dark colours are tuned to the app's dark theme (deep navy-purple).
--------------------------------------------------------------------------- */
export const ui = {
  text: "text-[#1e2140] dark:text-[#f3f1ff]",
  muted: "text-[#5f6783] dark:text-[#b0acd0]",
  subtle: "text-[#8d93ab] dark:text-[#8480aa]",
  link: "text-[#4f3fc4] hover:underline dark:text-[#b3a6ff]",
  green: "text-[#2f7d5f] dark:text-[#6fd3a8]",
  surface:
    "border border-[#ece8f7] bg-white shadow-sm dark:border-[#2e2a4a] dark:bg-[#1b1830] dark:shadow-black/40",
  divider: "border-[#ece8f7] dark:border-[#2e2a4a]",
  iconWrap: "bg-[#ebe5ff] text-[#4f3fc4] dark:bg-[#8b73ff]/25 dark:text-[#b3a6ff]",
  iconBtn:
    "border border-[#ddd6fe] bg-white text-[#1e2140] hover:bg-[#f5f3ff] dark:border-[#3a3563] dark:bg-[#1b1830] dark:text-[#f3f1ff] dark:hover:bg-[#262245]",
  iconBtnActive:
    "border border-[#8b7be0] bg-[#ede9fe] text-[#4f3fc4] dark:border-[#8b73ff] dark:bg-[#8b73ff]/20 dark:text-[#b3a6ff]",
  input:
    "border border-[#8b7be0] bg-white text-[#1e2140] placeholder:text-[#8d93ab] focus:ring-4 focus:ring-[#dcd3fb] dark:border-[#8b73ff] dark:bg-[#1b1830] dark:text-[#f3f1ff] dark:focus:ring-[#8b73ff]/30",
  notice:
    "border border-[#d9d0f3] bg-[#f8f6ff] dark:border-[#8b73ff]/30 dark:bg-[#8b73ff]/10",
  danger:
    "border border-[#f1bebe] text-[#c95752] hover:bg-[#fff5f5] dark:border-red-400/40 dark:text-[#ff9b95] dark:hover:bg-red-500/10",
  error:
    "border border-[#f1bebe] bg-[#fff5f5] text-[#c95752] dark:border-red-400/40 dark:bg-red-500/10 dark:text-[#ff9b95]",
};

const STATUS = {
  "In Progress": {
    icon: Clock,
    badge: "border-orange-300/70 bg-orange-500/10 text-orange-600 dark:border-orange-400/40 dark:text-orange-300",
    card: "from-orange-500/10 dark:from-orange-500/15",
    bar: "bg-orange-400",
  },
  Shipped: {
    icon: Truck,
    badge: "border-sky-300/70 bg-sky-500/10 text-sky-600 dark:border-sky-400/40 dark:text-sky-300",
    card: "from-blue-500/10 dark:from-blue-500/15",
    bar: "bg-blue-500",
  },
  Delivered: {
    icon: Truck,
    badge: "border-green-300/70 bg-green-500/10 text-green-700 dark:border-green-400/40 dark:text-green-300",
    card: "from-green-500/10 dark:from-green-500/15",
    bar: "bg-green-500",
  },
  Cancelled: {
    icon: Ban,
    badge: "border-red-300/70 bg-red-500/10 text-red-600 dark:border-red-400/40 dark:text-red-300",
    card: "from-red-500/10 dark:from-red-500/15",
    bar: "bg-red-400",
  },
};
export const statusStyle = (status) => STATUS[status] || STATUS["In Progress"];

export function StatusBadge({ status, className = "" }) {
  const s = statusStyle(status);
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium ${s.badge} ${className}`}>
      <Icon size={14} /> {status}
    </span>
  );
}

const TAG = "rounded-md px-2 py-0.5 text-[11px] font-medium";
export function OrderTags({ book }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className={`${TAG} bg-violet-500/10 text-violet-700 dark:text-violet-300`}>{book?.binding || "Hardcover"}</span>
      {book?.language && <span className={`${TAG} bg-sky-500/10 text-sky-700 dark:text-sky-300`}>{book.language}</span>}
      {book?.ageRange && <span className={`${TAG} bg-orange-500/10 text-orange-700 dark:text-orange-300`}>Ages {book.ageRange}</span>}
    </div>
  );
}

export function BookCover({ book, className = "" }) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <div className="absolute -right-1 bottom-1 top-1 w-1.5 rounded-r-sm bg-[#eee7da] shadow dark:bg-[#8f8aa8]" />
      {book?.cover ? (
        <img src={book.cover} alt={book.title} className="h-full w-full rounded-l-sm rounded-r-md object-cover shadow-[4px_6px_10px_rgba(20,15,40,0.35)]" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-l-sm rounded-r-md bg-gradient-to-br from-violet-400 to-indigo-600 p-2 text-center text-[10px] font-semibold text-white shadow-md">
          {book?.title}
        </div>
      )}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-2 rounded-l-sm bg-gradient-to-r from-black/35 to-transparent" />
    </div>
  );
}