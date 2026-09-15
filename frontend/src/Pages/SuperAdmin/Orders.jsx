import { Search, Filter, MoreVertical } from "lucide-react";

const orders = [
    { id: "#WB1001", user: "Priya Sharma", books: 2, amount: "$35.00", status: "Dispatched" },
    { id: "#WB1002", user: "Rahul Mehta", books: 1, amount: "$18.00", status: "Processing" },
    { id: "#WB1003", user: "Ananya Iyer", books: 3, amount: "$52.00", status: "Delivered" },
    { id: "#WB1004", user: "Sneha Patel", books: 1, amount: "$20.00", status: "Dispatched" },
    { id: "#WB1005", user: "David Wilson", books: 2, amount: "$40.00", status: "Cancelled" },
    { id: "#WB1006", user: "Meera Nair", books: 1, amount: "$19.00", status: "Delivered" },
    { id: "#WB1007", user: "Arjun Reddy", books: 4, amount: "$72.00", status: "Processing" },
    { id: "#WB1008", user: "Lisa Brown", books: 1, amount: "$18.00", status: "Dispatched" },
    { id: "#WB1009", user: "Ahmed Khan", books: 2, amount: "$36.00", status: "Delivered" },
    { id: "#WB1010", user: "Karthik S", books: 3, amount: "$54.00", status: "Processing" },
];

const statusStyles = {
    Dispatched: "bg-blue-50 text-blue-600",
    Processing: "bg-orange-50 text-orange-500",
    Delivered: "bg-green-50 text-green-600",
    Cancelled: "bg-red-50 text-red-500",
};

function StatusBadge({ status }) {
    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>{status}</span>;
}

export function SuperAdminOrders() {
    return (
        <div className="px-4 py-2">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold">Orders</h1>
                <p className="text-sm text-[#70698a]">View and track all book orders</p>
            </div>

            <div className="mb-4 flex items-center gap-3">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-[#eeeafa] bg-white px-3 py-2.5">
                    <Search size={16} className="text-[#70698a]" />
                    <input placeholder="Search by order ID or user..." className="w-full text-sm outline-none" />
                </div>
                {/* <select className="rounded-lg border border-[#eeeafa] bg-white px-3 py-2.5 text-sm font-semibold">
                    <option>All Status</option>
                </select> */}
                <button className="flex items-center gap-2 rounded-lg border border-[#eeeafa] bg-white px-4 py-2.5 text-sm font-semibold">
                    <Filter size={16} /> Filter
                </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#eeeafa] bg-white">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#eeeafa] text-left text-[#70698a]">
                            <th className="px-4 py-3 font-semibold">Order ID</th>
                            <th className="px-4 py-3 font-semibold">User</th>
                            <th className="px-4 py-3 font-semibold">No. of Books</th>
                            <th className="px-4 py-3 font-semibold">Amount</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id} className="border-b border-[#eeeafa] last:border-0">
                                <td className="px-4 py-3 font-semibold">{order.id}</td>
                                <td className="px-4 py-3">{order.user}</td>
                                <td className="px-4 py-3 text-[#70698a]">{order.books}</td>
                                <td className="px-4 py-3 text-[#70698a]">{order.amount}</td>
                                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                                {/* <td className="px-4 py-3">
                                    <button className="text-[#70698a] hover:text-[#5426c7]"><MoreVertical size={16} /></button>
                                </td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-[#70698a]">
                <span>Showing 1–10 of 1,432 orders</span>
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((p) => (
                        <button key={p} className={`h-8 w-8 rounded-lg text-sm font-semibold ${p === 1 ? "bg-[#5426c7] text-white" : "hover:bg-[#f5f1ff]"}`}>
                            {p}
                        </button>
                    ))}
                    <span className="px-1">...</span>
                    <button className="h-8 w-8 rounded-lg text-sm font-semibold hover:bg-[#f5f1ff]">144</button>
                </div>
            </div>
        </div>
    );
}