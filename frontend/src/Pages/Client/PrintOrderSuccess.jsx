import { Link, Navigate, useLocation } from "react-router-dom";
import { BookOpen, CheckCircle2, MapPin, Package } from "lucide-react";

const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

export const PrintOrderSuccess = () => {
    const { state } = useLocation();

    // One payment can create several orders (one per book).
    // `order` is what single-book checkouts used to send.
    const orders = state?.orders || (state?.order ? [state.order] : []);

    // Opened directly or refreshed: there's nothing to show, so go to the orders list
    if (orders.length === 0) return <Navigate to="/orders" replace />;

    const address = orders[0].shippingAddress || {};
    const total = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const many = orders.length > 1;

    return (
        <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
            <div className="rounded-3xl border border-(--border) bg-(--surface) p-6 text-center sm:p-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 size={34} />
                </div>
                <h1 className="mt-4 text-2xl font-extrabold text-(--text-heading)">
                    {many ? "Orders placed!" : "Order placed!"}
                </h1>
                <p className="mt-1 text-sm text-(--text-muted)">
                    {many
                        ? "Thank you! We'll print your books and ship them to you soon."
                        : "Thank you! We'll print your book and ship it to you soon."}
                </p>
                {!many && (
                    <p className="mt-3 inline-block rounded-full bg-(--tint) px-4 py-1.5 text-xs font-extrabold text-(--accent)">
                        {orders[0].orderNumber}
                    </p>
                )}

                <div className="mt-6 space-y-4 text-left">
                    {orders.map((order) => {
                        const quantity = order.quantity || 1;
                        return (
                            <div
                                key={order._id}
                                className="flex items-center gap-4 rounded-2xl border border-(--border) p-4"
                            >
                                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-(--tint)">
                                    {order.book?.coverImageUrl ? (
                                        <img
                                            src={order.book.coverImageUrl}
                                            alt={order.book.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-(--accent)">
                                            <BookOpen size={22} />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-extrabold text-(--text-heading)">
                                        {order.book?.title}
                                    </p>
                                    <p className="text-xs text-(--text-muted)">
                                        {quantity} printed {quantity > 1 ? "copies" : "copy"}
                                        {many && ` · ${order.orderNumber}`}
                                    </p>
                                </div>
                                <p className="text-sm font-extrabold text-(--text-heading)">{money(order.amount)}</p>
                            </div>
                        );
                    })}

                    {many && (
                        <div className="flex items-center justify-between px-1 text-sm">
                            <span className="font-bold text-(--text-muted)">Total paid</span>
                            <span className="text-lg font-extrabold text-(--accent)">{money(total)}</span>
                        </div>
                    )}

                    <div className="flex gap-3 rounded-2xl border border-(--border) p-4">
                        <MapPin size={18} className="mt-0.5 shrink-0 text-(--accent)" />
                        <div className="min-w-0 text-xs leading-relaxed text-(--text-muted)">
                            <p className="text-sm font-extrabold text-(--text-heading)">Delivering to {address.name}</p>
                            <p>{address.line1}</p>
                            {address.line2 && <p>{address.line2}</p>}
                            <p>
                                {[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}
                            </p>
                            <p>{address.phone}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link
                        to="/orders"
                        className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-(--accent) text-sm font-bold text-white transition hover:bg-(--accent-hover)"
                    >
                        <Package size={17} />
                        {many ? "Track my orders" : "Track my order"}
                    </Link>
                    <Link
                        to="/books"
                        className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-(--border) text-sm font-bold text-(--accent) transition hover:bg-(--tint)"
                    >
                        <BookOpen size={17} />
                        Back to my books
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default PrintOrderSuccess;