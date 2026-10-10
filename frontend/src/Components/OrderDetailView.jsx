import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Printer, Truck, PackageCheck, CircleCheck, MapPin, FileText, Trash2, Loader2 } from "lucide-react";
import { StatusBadge, OrderTags, BookCover, ui } from "./orderUtils";
import { getOrderTracking } from "../services/orderService";
import { displayPhone } from "../utils/phone";

/* Backend statusStep: 0 confirmed, 1 printing, 2 shipped, 3 delivered, -1 cancelled.
   The design adds "Out for Delivery" between shipped and delivered. */
const STEPS = [
  { key: "confirmed", label: "Order Confirmed", icon: Check },
  { key: "printing", label: "Printing", icon: Printer },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out", label: "Out for Delivery", icon: PackageCheck },
  { key: "delivered", label: "Delivered", icon: CircleCheck },
];

const designIndex = (order) => {
  const s = order.statusStep;
  if (s === 3) return 4;
  if (s === 2 && /out[\s_]?for[\s_]?delivery/i.test(`${order.shipment?.shiprocketStatus || ""} ${order.shipment?.status || ""}`)) return 3;
  return s;
};

const prettyStatus = (value) =>
  String(value || "").replace(/_/g, " ").toLowerCase().replace(/^\w|\s\w/g, (c) => c.toUpperCase());

const card = `${ui.surface} rounded-2xl p-5`;
const iconWrap = `${ui.iconWrap} flex h-8 w-8 items-center justify-center rounded-full`;

/* ----------------------------- Shipment tracking ----------------------------- */
const ShipmentCard = ({ order }) => {
  const [live, setLive] = useState(null);
  const [activities, setActivities] = useState([]);
  const awb = order.shipment?.awbCode;

  useEffect(() => {
    if (!awb) return undefined;
    let cancelled = false;
    getOrderTracking(order._id)
      .then(({ data }) => {
        if (cancelled) return;
        setLive(data.shipment || null);
        setActivities(data.activities || []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [order._id, awb]);

  if (!awb) return null;
  const shipment = live || order.shipment;
  const days = shipment.estimatedDeliveryDays;

  return (
    <div className={`${card} mt-4`}>
      <div className="flex items-center justify-between">
        <h3 className={`${ui.text} text-sm font-semibold`}>Shipment tracking</h3>
        {shipment.trackUrl && (
          <a href={shipment.trackUrl} target="_blank" rel="noreferrer" className={`${ui.link} text-sm font-medium`}>
            Track on courier site
          </a>
        )}
      </div>
      <div className={`${ui.muted} mt-3 space-y-1.5 text-[13px]`}>
        <p>Status: <span className={`${ui.text} font-semibold`}>{shipment.shiprocketStatus || prettyStatus(shipment.status)}</span></p>
        {shipment.courierName && <p>Courier: {shipment.courierName}</p>}
        <p>Tracking number (AWB): {awb}</p>
        {shipment.estimatedDelivery ? (
          <p>Expected delivery: {shipment.estimatedDelivery}</p>
        ) : (
          days && <p>Expected delivery: about {days} days after dispatch</p>
        )}
      </div>
      {activities.length > 0 && (
        <ul className={`${ui.muted} ${ui.divider} mt-4 space-y-2 border-t pt-3 text-[13px]`}>
          {activities.slice(0, 6).map((a, i) => (
            <li key={`${a.date}-${i}`}>
              <span className={`${ui.text} font-semibold`}>{a.activity || a.status}</span>
              {a.location ? ` · ${a.location}` : ""}
              <span className={`${ui.subtle} block text-xs`}>{a.date}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* -------------------------------- Detail view -------------------------------- */
export default function OrderDetailView({ order, onBack, onCancel, cancelling = false, error = "", onChangeAddress }) {
  if (!order) return null;

  const isCancelled = order.status === "Cancelled";
  const step = order.statusStep; // drives the status message (original behaviour)
  const current = designIndex(order);
  const addr = order.shippingAddress || {};

  return (
    <section className="p-6">
      <button onClick={onBack} className={`${ui.text} flex items-center gap-2 text-sm font-medium hover:text-[#4f3fc4] dark:hover:text-[#b3a6ff]`}>
        <ArrowLeft size={16} /> Back to Orders
      </button>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className={`${ui.text} text-xl font-bold`}>Order Details</h1>
          <p className={`${ui.muted} mt-1 text-[13px]`}>View your order information and tracking status</p>
        </div>
        <StatusBadge status={order.status} className="px-4 py-2 text-xs" />
      </div>

      {error && <p className={`${ui.error} mt-4 rounded-xl px-4 py-3 text-sm`}>{error}</p>}

      {/* Summary */}
      <div className={`${card} mt-5 flex items-start gap-5`}>
        <BookCover book={order.book} className="h-34 w-24" />
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className={`${ui.text} text-lg font-semibold`}>{order.book?.title}</h2>
          <p className={`${ui.muted} text-[13px]`}>Order ID: {order.orderId}</p>
          <p className={`${ui.muted} flex items-center gap-2 text-[13px]`}>
            <CalendarDays size={14} /> Ordered on {order.date} <span>•</span> {order.time}
          </p>
          <OrderTags book={order.book} />
        </div>
        <div className="text-right">
          <p className={`${ui.text} text-xl font-bold`}>₹{order.price}</p>
          <p className={`${ui.muted} text-[13px]`}>{order.quantity} Book</p>
        </div>
      </div>

      {/* Tracking timeline (hidden when cancelled, as before) */}
      {!isCancelled && (
        <>
          <div className={`${card} mt-4`}>
            <ol className="flex justify-between">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = i < current || (i === current && i === STEPS.length - 1);
                const active = i === current && !done;
                return (
                  <li key={s.key} className="relative flex flex-1 flex-col items-center gap-2 text-center">
                    {i > 0 && <span aria-hidden className={`absolute right-1/2 top-6 h-0 w-full border-t-2 border-dashed ${i <= current ? "border-[#5b43d6] dark:border-[#8b73ff]" : "border-[#d9d0f3] dark:border-[#433d6b]"}`} />}
                    <span className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full ${done ? "bg-[#5b43d6] text-white ring-4 ring-[#dcd3fb] dark:ring-[#8b73ff]/30" : active ? "bg-[#ebe5ff] text-[#4f3fc4] ring-4 ring-[#dcd3fb] dark:bg-[#8b73ff]/25 dark:text-[#b3a6ff] dark:ring-[#8b73ff]/30" : "bg-[#f1f0f6] text-[#8d93ab] dark:bg-[#2a2645] dark:text-[#8480aa]"}`}>
                      {done && i !== STEPS.length - 1 ? <Check size={20} strokeWidth={3} /> : <Icon size={20} />}
                    </span>
                    <span className={`text-xs ${done || active ? "font-semibold text-[#4f3fc4] dark:text-[#b3a6ff]" : ui.subtle}`}>{s.label}</span>
                    {i === 0 && (
                      <span className={`${ui.subtle} -mt-1 text-[11px]`}>{order.date.replace(/,?\s*\d{4}$/, "")}, {order.time}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Status message */}
          <div className={`${ui.notice} mt-4 flex items-center gap-4 rounded-2xl px-5 py-4`}>
            <span className={iconWrap}><Printer size={16} /></span>
            <div>
              <p className={`${ui.text} text-[13px] font-medium`}>
                {step === 0 && "Your order has been confirmed!"}
                {step === 1 && "Your book is being printed with care!"}
                {step === 2 && "Your book is on its way!"}
                {step === 3 && "Your book has been delivered!"}
              </p>
              <p className={`${ui.muted} mt-0.5 text-xs`}>
                {step === 1 && "We'll ship it soon and notify you once it's on the way."}
                {step === 2 && "It will reach you soon. Please keep an eye on delivery updates."}
                {step === 3 && "We hope you enjoy reading your personalized Wonder Book!"}
              </p>
            </div>
          </div>

          <ShipmentCard order={order} />
        </>
      )}

      {/* Address + payment */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className={card}>
          <div className="flex items-center justify-between">
            <h3 className={`${ui.text} flex items-center gap-2 text-sm font-semibold`}>
              <span className={iconWrap}><MapPin size={16} /></span> Delivery Address
            </h3>
            <button onClick={() => onChangeAddress?.(order)} className={`${ui.link} text-sm font-medium`}>Change</button>
          </div>
          <div className={`${ui.muted} mt-3 space-y-0.5 pl-10 text-[13px]`}>
            <p className={`${ui.text} font-medium`}>{addr.name}</p>
            <p>{addr.line1}</p>
            {addr.line2 && <p>{addr.line2}</p>}
            <p>{[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}</p>
            <p>{addr.country}</p>
            {addr.phone && <p>Phone: {displayPhone(addr)}</p>}
          </div>
        </div>

        <div className={card}>
          <h3 className={`${ui.text} flex items-center gap-2 text-sm font-semibold`}>
            <span className={iconWrap}><FileText size={16} /></span> Order Summary
          </h3>
          <dl className={`${ui.muted} mt-4 space-y-2 text-[13px]`}>
            <div className="flex justify-between"><dt>Book Price</dt><dd>₹{order.subtotal}</dd></div>
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{order.shippingFee > 0 ? `₹${order.shippingFee}` : <span className={`${ui.green} font-semibold`}>FREE</span>}</dd>
            </div>
            {order.gstAmount > 0 && (
              <div className="flex justify-between"><dt>GST ({order.gstPercent}%)</dt><dd>₹{order.gstAmount}</dd></div>
            )}
            <div className={`${ui.text} flex justify-between border-t border-[#d9d0f3] pt-3 text-sm font-bold dark:border-[#433d6b]`}>
              <dt>Total Paid</dt><dd>₹{order.price}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Items */}
      {/* <div className={`${card} mt-4`}>
        <h3 className={`${ui.text} text-sm font-semibold`}>Order Items</h3>
        <div className="mt-3 flex items-center gap-4">
          <BookCover book={order.book} className="h-19 w-15" />
          <div className="min-w-0 flex-1 space-y-2">
            <p className={`${ui.text} text-sm font-semibold`}>{order.book?.title}</p>
            <OrderTags book={order.book} />
          </div>
          <span className={`${ui.muted} text-[13px]`}>Qty: {order.quantity}</span>
          <span className={`${ui.text} text-base font-bold`}>₹{order.price}</span>
        </div>
      </div> */}

      {/* Cancel (only while still "confirmed", as before) */}
      {order.rawStatus === "confirmed" && (
        <div className="mt-4">
          <button
            onClick={onCancel}
            disabled={cancelling}
            className={`${ui.danger} flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition disabled:pointer-events-none disabled:opacity-50`}
          >
            {cancelling ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        </div>
      )}
    </section>
  );
}