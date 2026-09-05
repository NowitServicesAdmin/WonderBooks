import { Search, Filter, BookOpen } from "lucide-react";

const books = [
    { id: 1, title: "Aarya's Space Adventure", cover: "https://placehold.co/60x60/f0eaff/5426c7", createdBy: "priya.k@gmail.com", createdOn: "Sep 28, 2025", status: "Published" },
    { id: 2, title: "The Enchanted Forest", cover: "https://placehold.co/60x60/fde68a/92400e", createdBy: "rahul.m@gmail.com", createdOn: "Sep 27, 2025", status: "Downloaded" },
    { id: 3, title: "My Birthday Surprise", cover: "https://placehold.co/60x60/fecaca/991b1b", createdBy: "ananya.iyer@gmail.com", createdOn: "Sep 26, 2025", status: "Published" },
    { id: 4, title: "Unicorn Dreams", cover: "https://placehold.co/60x60/e0e7ff/3730a3", createdBy: "meera.n@gmail.com", createdOn: "Sep 25, 2025", status: "Draft" },
    { id: 5, title: "Pirate Magic", cover: "https://placehold.co/60x60/bbf7d0/166534", createdBy: "david.w@gmail.com", createdOn: "Sep 24, 2025", status: "Downloaded" },
    { id: 6, title: "The Kindness Tree", cover: "https://placehold.co/60x60/fbcfe8/9d174d", createdBy: "sneha.p@gmail.com", createdOn: "Sep 23, 2025", status: "Published" },
    { id: 7, title: "Dino Friends", cover: "https://placehold.co/60x60/bae6fd/075985", createdBy: "karthik.s@gmail.com", createdOn: "Sep 22, 2025", status: "Published" },
    { id: 8, title: "A Day with Grandma", cover: "https://placehold.co/60x60/fed7aa/9a3412", createdBy: "lisa.b@gmail.com", createdOn: "Sep 21, 2025", status: "Draft" },
];

const statusStyles = {
    Published: "bg-green-50 text-green-600",
    Draft: "bg-gray-100 text-gray-500",
    Downloaded: "bg-blue-50 text-blue-600",
};

function StatusBadge({ status }) {
    return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status] || "bg-gray-100 text-gray-500"}`}>
            {status}
        </span>
    );
}

export function SuperAdminBooks() {
    return (
        <div className="px-4 py-2">
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0eaff] text-[#5426c7]">
                    <BookOpen size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-[#1c1730]">Books</h1>
                    <p className="text-sm text-[#70698a]">View all generated books</p>
                </div>
            </div>

            <div className="mb-2 flex items-center gap-3">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-[#eeeafa] bg-white px-3 py-2.5 transition-colors focus-within:border-[#c9b8f5]">
                    <Search size={16} className="text-[#70698a]" />
                    <input placeholder="Search books by title, user or ID..." className="w-full text-sm outline-none" />
                </div>
                <button className="flex items-center gap-2 rounded-lg border border-[#eeeafa] bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[#c9b8f5] hover:bg-[#f5f1ff] hover:text-[#5426c7]">
                    <Filter size={16} /> Filter
                </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#eeeafa] bg-white">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#eeeafa] bg-[#faf8ff] text-left text-[#5e5779]">
                            <th className="px-4 py-3.5 font-semibold">BookID</th>
                            <th className="px-4 py-3.5 font-semibold">Title</th>
                            <th className="px-4 py-3.5 font-semibold">Created By</th>
                            <th className="px-4 py-3.5 font-semibold">Created On</th>
                            <th className="px-4 py-3.5 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {books.map((book) => (
                            <tr
                                key={book.id}
                                className="border-b border-[#eeeafa] transition-colors last:border-0 hover:bg-[#faf8ff]"
                            >
                                <td className="px-4 py-3 text-[#70698a]">{book.id}</td>
                                <td className="px-4 py-3 font-semibold text-[#1c1730]">{book.title}</td>
                                <td className="px-4 py-3 text-[#70698a]">{book.createdBy}</td>
                                <td className="px-4 py-3 text-[#70698a]">{book.createdOn}</td>
                                <td className="px-4 py-3"><StatusBadge status={book.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-[#70698a]">
                <span>Showing 1–8 of 5,892 books</span>
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((p) => (
                        <button
                            key={p}
                            className={`h-8 w-8 rounded-lg text-sm font-semibold transition-colors ${
                                p === 1 ? "bg-[#5426c7] text-white" : "hover:bg-[#f5f1ff]"
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                    <span className="px-1">...</span>
                    <button className="h-8 w-8 rounded-lg text-sm font-semibold transition-colors hover:bg-[#f5f1ff]">737</button>
                </div>
            </div>
        </div>
    );
}