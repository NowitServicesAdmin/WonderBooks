


import { useEffect, useState } from "react";
import OrderList from "../../Components/OrdersList";
import OrderDetailView from "../../Components/OrderDetailView";
import {
  getMyOrders,
  cancelOrder as cancelOrderRequest,
} from "../../services/orderService";

/* -------------------------------------------------------------------------- */
/*                                  ORDER DATA                                */
/* -------------------------------------------------------------------------- */

// Backend status -> UI label
const STATUS_LABELS = {
  confirmed: "In Progress",
  printing: "In Progress",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Shapes a /api/orders row into what the components expect.
const mapOrder = (apiOrder) => {
  const created = new Date(apiOrder.createdAt);

  return {
    orderId: apiOrder.orderNumber,
    _id: apiOrder._id,
    status: STATUS_LABELS[apiOrder.status] || "In Progress",
    rawStatus: apiOrder.status,
    createdAt: apiOrder.createdAt, // used for Newest/Oldest sorting
    date: created.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }),
    time: created.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
    price: apiOrder.amount,
    quantity: apiOrder.quantity || 1,
    subtotal:
      apiOrder.subtotal ??
      apiOrder.amount - (apiOrder.shippingFee || 0) - (apiOrder.gstAmount || 0),
    shippingFee: apiOrder.shippingFee || 0,
    gstPercent: apiOrder.gstPercent || 0,
    gstAmount: apiOrder.gstAmount || 0,
    shipment: apiOrder.shipment || null,
    statusStep: apiOrder.statusStep,
    shippingAddress: apiOrder.shippingAddress,
    book: {
      title: apiOrder.book?.title,
      cover: apiOrder.book?.coverImageUrl,
      // optional – tags are hidden if the API doesn't send them
      binding: apiOrder.printOptions?.coverLabel || apiOrder.book?.binding,
      pagesFinish: apiOrder.printOptions?.pagesLabel,
      language: apiOrder.book?.language,
      ageRange: apiOrder.book?.ageRange,
      pages: apiOrder.book?.pageCount,
      size: apiOrder.printOptions?.widthMm
        ? `${apiOrder.printOptions.sizeLabel} · ${apiOrder.printOptions.widthMm} × ${apiOrder.printOptions.heightMm} mm`
        : apiOrder.book?.size,
    },
  };
};

/* ========================================================================== */
/*                              MAIN ORDERS PAGE                              */
/* ========================================================================== */

export const Orders = ({ onChangeAddress }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await getMyOrders();
        if (cancelled) return;
        setOrders((data.orders || []).map(mapOrder));
        setError("");
      } catch {
        if (!cancelled) setError("We couldn't load your orders. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCancelOrder = async () => {
    if (!selectedOrder || cancelling) return;
    setCancelling(true);
    setCancelError("");
    try {
      await cancelOrderRequest(selectedOrder._id);
      const patch = { status: "Cancelled", rawStatus: "cancelled", statusStep: -1 };
      setOrders((prev) =>
        prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...patch } : o))
      );
      setSelectedOrder((prev) => (prev ? { ...prev, ...patch } : prev));
    } catch {
      setCancelError("Couldn't cancel this order. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const openOrder = (order) => {
    setCancelError("");
    setSelectedOrder(order);
  };
  
  console.log(selectedOrder,"selectedOrder@jj")

  if (selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
        onCancel={handleCancelOrder}
        cancelling={cancelling}
        error={cancelError}
        onChangeAddress={onChangeAddress}
      />
    );
  }

  return (
    <OrderList
      orders={orders}
      loading={loading}
      error={error}
      onSelectOrder={openOrder}
    />
  );
};

export default Orders;