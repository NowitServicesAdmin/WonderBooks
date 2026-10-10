import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Eye, Loader2, MapPin, Package, Truck, User, Wallet } from "lucide-react";
import { getOrderDetail, apiErrorMessage } from "../../services/adminService";
import { formatDate, formatMoney } from "../../utils/adminFormat";
import { displayPhone } from "../../utils/phone";

const statusMeta = {
    pending_payment: { label: "Awaiting Payment", cls: "bg-gray-100 text-gray-500" },
    confirmed: { label: "Confirmed", cls: "bg-purple-50 text-purple-600" },
    printing: { label: "Printing", cls: "bg-orange-50 text-orange-500" },
    shipped: { label: "Shipped", cls: "bg-blue-50 text-blue-600" },
    delivered: { label: "Delivered", cls: "bg-green-50 text-green-600" },
    cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-500" },
};

const Card = ({ icon, title, children }) => {
    const Icon = icon;
    return (
        <div className="rounded-2xl border border-[#e4e0ef] bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-(--ink)">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--tint) text-(--accent)">
                    <Icon size={16} />
                </span>
                {title}
            </div>
            <div className="space-y-1.5 text-sm text-(--text-muted)">{children}</div>
        </div>
    );
};

const Row = ({ label, value, strong }) => (
    <div className="flex items-start justify-between gap-4">
        <span>{label}</span>
        <span className={`text-right ${strong ? "font-extrabold text-(--ink)" : "font-medium text-(--ink)"}`}>{value ?? "—"}</span>
    </div>
);

export function SuperAdminOrderView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await getOrderDetail(id);
                if (!cancelled) setOrder(data.order);
            } catch (err) {
                if (!cancelled) setError(apiErrorMessage(err, "We couldn't load this order."));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const goBack = () => navigate("/superadmin/orders");

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 size={28} className="animate-spin text-[#7f6ad0]" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="px-4 py-10 text-center">
                <p className="text-base font-semibold text-[#4a4665]">{error || "Order not found."}</p>
                <button
                    type="button"
                    onClick={goBack}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#5d2bc5] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#5122b4]"
                >
                    <ArrowLeft size={16} /> Back to Orders
                </button>
            </div>
        );
    }

    const meta = statusMeta[order.status] || { label: order.status, cls: "bg-gray-100 text-gray-500" };
    const a = order.shippingAddress || {};
    const info = order.bookInfo;
    const cur = order.currency;

    return (
        <div className="px-4 py-2">
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={goBack}
                    aria-label="Back to Orders"
                    title="Back to Orders"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e4e0ef] bg-white text-[#5d2bc5] outline-none transition hover:bg-[#f7f3ff] focus-visible:ring-2 focus-visible:ring-[#a98aff]/50"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-extrabold text-(--ink)">{order.orderNumber}</h1>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <p className="text-sm text-(--text-muted)">
                        Placed {formatDate(order.createdAt)} · Payment {order.paymentStatus}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* BOOK */}
                <div className="rounded-2xl border border-[#e4e0ef] bg-white p-5 lg:col-span-2">
                    <div className="flex flex-wrap items-center gap-4">
                        {order.book?.coverImageUrl ? (
                            <img src={order.book.coverImageUrl} alt="" className="h-24 w-18 rounded-lg object-cover shadow" />
                        ) : (
                            <div className="flex h-24 w-18 items-center justify-center rounded-lg bg-(--tint) text-(--accent)">
                                <BookOpen size={22} />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="text-lg font-extrabold text-(--ink)">{order.book?.title}</div>
                            <div className="text-sm text-(--text-muted)">Quantity: {order.quantity}</div>
                            {info?.exists && info.isDeleted && (
                                <span className="mt-1 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                                    Deleted by user{info.deletedAt ? ` on ${formatDate(info.deletedAt)}` : ""} · kept for printing
                                </span>
                            )}
                            {info && !info.exists && (
                                <span className="mt-1 inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                                    This book was permanently deleted
                                </span>
                            )}
                        </div>
                        {info?.exists && (
                            <button
                                type="button"
                                onClick={() => navigate(`/superadmin/books/${order.book._id}`)}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#5d2bc5] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#5122b4]"
                            >
                                <Eye size={16} /> View Book
                            </button>
                        )}
                    </div>
                </div>

                {/* CUSTOMER */}
                <Card icon={User} title="Customer">
                    <Row label="Name" value={order.user?.name || a.name} />
                    <Row label="Email" value={order.user?.email || "Deleted user"} />
                    <Row label="Phone" value={displayPhone(a)} />
                </Card>

                {/* ADDRESS */}
                <Card icon={MapPin} title="Shipping address">
                    <div className="font-semibold text-(--ink)">{a.name}</div>
                    <div>{[a.line1, a.line2].filter(Boolean).join(", ")}</div>
                    {a.landmark && <div>Landmark: {a.landmark}</div>}
                    <div>{[a.city, a.state, a.postalCode].filter(Boolean).join(", ")}</div>
                    <div>{a.country}</div>
                </Card>

                {/* PAYMENT */}
                <Card icon={Wallet} title="Payment">
                    <Row label="Unit price" value={order.unitPrice != null ? formatMoney(order.unitPrice, cur) : "—"} />
                    <Row label="Shipping" value={formatMoney(order.shippingFee, cur)} />
                    {order.gstAmount != null && <Row label="GST" value={formatMoney(order.gstAmount, cur)} />}
                    <div className="border-t border-(--tint) pt-1.5">
                        <Row label="Total" value={formatMoney(order.amount, cur)} strong />
                    </div>
                    {order.cancelReason && <Row label="Cancel reason" value={order.cancelReason} />}
                </Card>

                {/* SHIPMENT */}
                <Card icon={order.status === "shipped" || order.status === "delivered" ? Truck : Package} title="Shipment">
                    <Row label="Courier" value={order.shipping?.courier} />
                    <Row label="AWB" value={order.shipping?.awbCode} />
                    <Row label="Shipment status" value={order.shipping?.status?.replace(/_/g, " ")} />
                    {order.shipping?.trackingUrl && (
                        <a
                            href={order.shipping.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block pt-1 text-sm font-semibold text-(--accent) hover:underline"
                        >
                            Track shipment
                        </a>
                    )}
                </Card>
            </div>
        </div>
    );
}