import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    BookOpen,
    Check,
    Copy,
    Eye,
    Layers,
    Loader2,
    Mail,
    MapPin,
    Package,
    Phone,
    Ruler,
    Truck,
    Wallet,
} from "lucide-react";
import { getOrderDetail, apiErrorMessage } from "../../services/adminService";
import { formatDate, formatMoney } from "../../utils/adminFormat";
import { displayPhone } from "../../utils/phone";

const statusMeta = {
    pending_payment: { label: "Awaiting payment", cls: "bg-gray-100 text-gray-600" },
    confirmed: { label: "Confirmed", cls: "bg-purple-50 text-purple-700" },
    printing: { label: "Printing", cls: "bg-orange-50 text-orange-600" },
    shipped: { label: "Shipped", cls: "bg-blue-50 text-blue-600" },
    delivered: { label: "Delivered", cls: "bg-green-50 text-green-700" },
    cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-600" },
};

const paymentMeta = {
    paid: "bg-green-50 text-green-700",
    pending: "bg-amber-50 text-amber-700",
    failed: "bg-red-50 text-red-600",
    refunded: "bg-gray-100 text-gray-600",
};

const sentenceCase = (text) => {
    const clean = String(text || "").replace(/_/g, " ").trim();
    return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : null;
};

const Pill = ({ className = "", children }) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
        {children}
    </span>
);

// h-full + flex-col so the cards in one grid row always share the same height
const Card = ({ icon, title, className = "", children }) => {
    const Icon = icon;
    return (
        <section className={`flex h-full flex-col rounded-2xl border border-(--border) bg-(--surface) p-4 ${className}`}>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--ink)">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--tint) text-(--accent)">
                    <Icon size={15} />
                </span>
                {title}
            </div>
            {children}
        </section>
    );
};

const Row = ({ label, children, strong }) => (
    <div className="flex items-start justify-between gap-4 py-1.5 text-[13px]">
        <dt className="shrink-0 text-(--text-muted)">{label}</dt>
        <dd className={`min-w-0 text-right break-words ${strong ? "font-semibold text-(--ink)" : "text-(--ink)"}`}>
            {children ?? "—"}
        </dd>
    </div>
);

const SpecTile = ({ icon, label, value, hint }) => {
    const Icon = icon;
    return (
        <div className="min-w-0 rounded-xl border border-(--border) bg-(--tint)/50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-(--text-muted)">
                <Icon size={12} className="shrink-0 text-(--accent)" />
                <span className="truncate">{label}</span>
            </div>
            <div className="mt-1 truncate text-sm font-semibold text-(--ink)">{value}</div>
            <div className="truncate text-[11px] leading-tight text-(--text-muted)">{hint || "\u00A0"}</div>
        </div>
    );
};

const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard blocked: nothing useful to do
        }
    };
    return (
        <button
            type="button"
            onClick={copy}
            aria-label="Copy AWB number"
            title={copied ? "Copied" : "Copy"}
            className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-(--text-muted) transition hover:bg-(--tint) hover:text-(--accent)"
        >
            {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
    );
};

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
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#5d2bc5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5122b4]"
                >
                    <ArrowLeft size={16} /> Back to Orders
                </button>
            </div>
        );
    }

    const meta = statusMeta[order.status] || { label: sentenceCase(order.status), cls: "bg-gray-100 text-gray-600" };
    const a = order.shippingAddress || {};
    const info = order.bookInfo;
    const cur = order.currency;
    const spec = order.printOptions;
    const quantity = order.quantity || 1;
    const bookSubtotal = order.subtotal ?? (order.unitPrice != null ? order.unitPrice * quantity : null);
    const shipmentStatus = sentenceCase(order.shipping?.status);

    return (
        <div className="px-4 pt-3 pb-4">
            {/* ---------------- header ---------------- */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={goBack}
                    aria-label="Back to Orders"
                    title="Back to Orders"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-(--border) bg-(--surface) text-(--accent) outline-none transition hover:bg-(--tint) focus-visible:ring-2 focus-visible:ring-[#a98aff]/50"
                >
                    <ArrowLeft size={17} />
                </button>

                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
                    <h1 className="text-lg font-bold tracking-tight text-(--ink) sm:text-xl">{order.orderNumber}</h1>
                    <Pill className={meta.cls}>{meta.label}</Pill>
                    <Pill className={paymentMeta[order.paymentStatus] || "bg-gray-100 text-gray-600"}>
                        Payment {order.paymentStatus}
                    </Pill>
                    <span className="text-xs text-(--text-muted)">Placed on {formatDate(order.createdAt)}</span>
                </div>

                {info?.exists && (
                    <button
                        type="button"
                        onClick={() => navigate(`/superadmin/books/${order.book._id}`)}
                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#5d2bc5] px-4 text-sm font-semibold text-white transition hover:bg-[#5122b4]"
                    >
                        <Eye size={15} /> View book
                    </button>
                )}
            </div>

            {/* 3 columns on laptop (2 rows), 2 on tablet, 1 on phone */}
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* book + print specification */}
                <section className="rounded-2xl border border-(--border) bg-(--surface) p-4 md:col-span-2">
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
                        {order.book?.coverImageUrl ? (
                            <img
                                src={order.book.coverImageUrl}
                                alt=""
                                className="h-24 w-[4.25rem] rounded-lg object-cover shadow-md sm:row-span-2 sm:h-28 sm:w-20"
                            />
                        ) : (
                            <div className="flex h-24 w-[4.25rem] items-center justify-center rounded-lg bg-(--tint) text-(--accent) sm:row-span-2 sm:h-28 sm:w-20">
                                <BookOpen size={22} />
                            </div>
                        )}

                        <div className="min-w-0 self-center sm:self-start">
                            <h2 className="truncate text-base font-semibold text-(--ink)">{order.book?.title}</h2>
                            <p className="text-xs text-(--text-muted)">
                                {quantity} {quantity === 1 ? "copy" : "copies"} ordered
                                {!spec && " · no print options recorded (print the standard format)"}
                            </p>
                            {info?.exists && info.isDeleted && (
                                <Pill className="mt-1.5 bg-amber-50 text-amber-700">
                                    Deleted by user{info.deletedAt ? ` on ${formatDate(info.deletedAt)}` : ""} · kept for printing
                                </Pill>
                            )}
                            {info && !info.exists && (
                                <Pill className="mt-1.5 bg-red-50 text-red-600">This book was permanently deleted</Pill>
                            )}
                        </div>

                        {spec && (
                            <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1 sm:grid-cols-4">
                                <SpecTile icon={BookOpen} label="Cover" value={spec.coverLabel} />
                                <SpecTile icon={Layers} label="Page finish" value={spec.pagesLabel} />
                                <SpecTile
                                    icon={Ruler}
                                    label="Size"
                                    value={spec.sizeLabel}
                                    hint={spec.widthMm ? `${spec.widthMm} × ${spec.heightMm} mm` : null}
                                />
                                <SpecTile icon={Copy} label="Copies" value={quantity} />
                            </div>
                        )}
                    </div>
                </section>

                {/* customer */}
                <Card icon={Mail} title="Customer">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--tint) text-sm font-semibold text-(--accent)">
                            {(order.user?.name || a.name || "?").charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-(--ink)">{order.user?.name || a.name}</div>
                            <div className="truncate text-xs text-(--text-muted)">{order.user?.email || "Deleted user"}</div>
                        </div>
                    </div>
                    <div className="mt-auto flex items-center gap-2 border-t border-(--border) pt-3 text-[13px] text-(--ink)">
                        <Phone size={13} className="shrink-0 text-(--text-muted)" />
                        {displayPhone(a) || "—"}
                    </div>
                </Card>

                {/* shipment */}
                <Card icon={order.status === "shipped" || order.status === "delivered" ? Truck : Package} title="Shipment">
                    <dl className="divide-y divide-(--border)">
                        <Row label="Courier">{order.shipping?.courier}</Row>
                        <Row label="AWB number">
                            {order.shipping?.awbCode ? (
                                <span className="inline-flex items-center">
                                    <span className="font-mono text-xs break-all">{order.shipping.awbCode}</span>
                                    <CopyButton text={order.shipping.awbCode} />
                                </span>
                            ) : null}
                        </Row>
                        <Row label="Status">
                            {shipmentStatus && <Pill className="bg-(--tint) text-(--accent)">{shipmentStatus}</Pill>}
                        </Row>
                    </dl>
                    {order.shipping?.trackingUrl && (
                        <a
                            href={order.shipping.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-auto inline-flex items-center gap-1.5 pt-2 text-[13px] font-medium text-(--accent) hover:underline"
                        >
                            <Truck size={13} /> Track shipment
                        </a>
                    )}
                </Card>

                {/* address */}
                <Card icon={MapPin} title="Shipping address">
                    <address className="space-y-0.5 text-[13px] leading-snug text-(--text-muted) not-italic">
                        <div className="font-semibold text-(--ink)">{a.name}</div>
                        <div>{[a.line1, a.line2].filter(Boolean).join(", ")}</div>
                        {a.landmark && <div>Landmark: {a.landmark}</div>}
                        <div>{[a.city, a.state, a.postalCode].filter(Boolean).join(", ")}</div>
                        <div>{a.country}</div>
                    </address>
                </Card>

                {/* payment */}
                <Card icon={Wallet} title="Payment" className="md:col-span-2 lg:col-span-1">
                    <dl className="divide-y divide-(--border)">
                        {order.unitPrice != null && (
                            <Row label={`Book price (${formatMoney(order.unitPrice, cur)} × ${quantity})`}>
                                {bookSubtotal != null ? formatMoney(bookSubtotal, cur) : "—"}
                            </Row>
                        )}
                        <Row label="Shipping">{formatMoney(order.shippingFee, cur)}</Row>
                        {order.gstAmount != null && <Row label="GST">{formatMoney(order.gstAmount, cur)}</Row>}
                    </dl>
                    <div className="mt-auto flex items-center justify-between rounded-xl bg-(--tint) px-3.5 py-2.5">
                        <span className="text-sm font-medium text-(--ink)">Total paid</span>
                        <span className="text-base font-bold text-(--accent)">{formatMoney(order.amount, cur)}</span>
                    </div>
                    {order.cancelReason && (
                        <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                            Cancelled: {order.cancelReason}
                        </p>
                    )}
                </Card>
            </div>
        </div>
    );
}