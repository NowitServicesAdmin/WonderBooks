import Order from "../models/order.js";
import {
    getShippingRates,
    createShiprocketOrder,
    assignCourier,
    schedulePickup,
    trackByAwb,
    cancelShiprocketOrders,
    isTestMode,
} from "./shiprocketService.js";
import { getDeliveryExtraCharge } from "../config/printPricing.js";

const readNumber = (name, fallback) => {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
};

const errorText = (error) =>
    String(
        error?.response?.data?.message ||
        JSON.stringify(error?.response?.data?.errors || "") ||
        error?.message ||
        "Unknown Shiprocket error"
    ).slice(0, 300);

/*
|--------------------------------------------------------------------------
| Parcel size from the number of copies (all tunable in .env)
|--------------------------------------------------------------------------
*/
export const getParcelSpec = (copies = 1) => {
    const qty = Math.max(1, Number(copies) || 1);
    return {
        weight: Math.round(qty * readNumber("SHIPPING_WEIGHT_PER_COPY_KG", 0.5) * 100) / 100,
        //     weight:
        //   Math.round(
        //     (qty * readNumber("SHIPPING_WEIGHT_PER_COPY_KG", 0.5) +
        //       readNumber("SHIPPING_PACKAGING_WEIGHT_KG", 0)) * 100
        //   ) / 100,
        length: readNumber("SHIPPING_BOX_LENGTH_CM", 28),
        breadth: readNumber("SHIPPING_BOX_BREADTH_CM", 22),
        height: Math.max(3, Math.ceil(qty * readNumber("SHIPPING_BOX_HEIGHT_PER_COPY_CM", 2))),
    };
};

/*
|--------------------------------------------------------------------------
| Delivery quote = Shiprocket rate + SHIPROCKET_EXTRA_CHARGE (Rs 50)
|--------------------------------------------------------------------------
| SHIPROCKET_COURIER_ID set   -> always that courier (the "fixed partner")
| SHIPROCKET_COURIER_ID blank -> cheapest serviceable courier
*/
export const getDeliveryQuote = async ({ pincode, copies, declaredValue }) => {
    if (!/^\d{6}$/.test(String(pincode || "").trim())) {
        return { error: "Please choose an address with a valid 6-digit pincode" };
    }

    const parcel = getParcelSpec(copies);

    const result = await getShippingRates({
        pickupPostcode: process.env.SHIPROCKET_PICKUP_PINCODE,
        deliveryPostcode: String(pincode).trim(),
        weight: parcel.weight,
        cod: 0,
        declaredValue,
    });

    const couriers = result?.data?.available_courier_companies || [];
    //    console.table(
    //     couriers.map((c) => ({
    //       id: c.courier_company_id,
    //       name: c.courier_name,
    //       rate: c.rate,
    //       days: c.estimated_delivery_days,
    //       etd: c.etd,
    //       rating: c.rating,
    //     }))
    //   );
    if (!couriers.length) {
        return { error: "Sorry, we can't deliver to this pincode yet" };
    }

    const fixedId = String(process.env.SHIPROCKET_COURIER_ID || "").trim();
    let courier;
    if (fixedId) {
        courier = couriers.find((c) => String(c.courier_company_id) === fixedId);
        if (!courier) {
            return { error: "Delivery isn't available to this pincode right now" };
        }
    } else {
        courier = [...couriers].sort((a, b) => Number(a.rate) - Number(b.rate))[0];
    }

    const baseRate = Math.ceil(Number(courier.rate) || 0);
    const extraCharge = getDeliveryExtraCharge();

    return {
        quote: {
            courierId: String(courier.courier_company_id),
            courierName: courier.courier_name,
            baseRate,
            extraCharge,
            deliveryCharge: baseRate + extraCharge,
            estimatedDeliveryDays: Number(courier.estimated_delivery_days) || null,
            etd: courier.etd || null,
            ...parcel,
        },
    };
};

/*
|--------------------------------------------------------------------------
| Create ONE Shiprocket shipment for all orders from one payment
|--------------------------------------------------------------------------
| Never throws: the customer has already paid, so failures are written to
| shipping.status / shipping.remarks for the admin to retry.
*/
export const createShipmentForOrders = async (orders, { email } = {}) => {
    const first = orders[0];

    try {
        const sr = await createShiprocketOrder({
            orders,
            email,
            pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION,
        });

        if (!sr?.shipment_id) {
            throw new Error(sr?.message || "Shiprocket did not return a shipment id");
        }

        for (const o of orders) {
            o.shipping.shiprocketOrderId = String(sr.order_id);
            o.shipping.shiprocketShipmentId = String(sr.shipment_id);
            o.shipping.status = "shipment_created";
            o.shipping.remarks = "";
        }

        const awbRes = await assignCourier({
            shipmentId: sr.shipment_id,
            courierId: first.shipping.selectedCourierId,
            orderNumber: first.orderNumber,
        });

        const awb = awbRes?.response?.data || awbRes?.data || {};

        if (awb.awb_code) {
            for (const o of orders) {
                o.shipping.awbCode = awb.awb_code;
                o.shipping.trackingId = awb.awb_code;
                o.shipping.courierName = awb.courier_name || o.shipping.courierName;
                o.shipping.status = "awb_generated";
            }
        } else {
            for (const o of orders) {
                o.shipping.remarks = `AWB not generated: ${awbRes?.message || "unknown reason"}`.slice(0, 300);
            }
        }
    } catch (error) {
        console.error("Shiprocket shipment error:", first.orderNumber, error.response?.data || error.message);
        for (const o of orders) {
            if (!o.shipping.shiprocketShipmentId) o.shipping.status = "shipment_failed";
            o.shipping.remarks = errorText(error);
        }
    }

    await Promise.all(orders.map((o) => o.save()));
};

/*
|--------------------------------------------------------------------------
| Pickup is scheduled when admin marks the order "shipped" (book is printed)
|--------------------------------------------------------------------------
*/
export const schedulePickupForOrder = async (order) => {
    const s = order.shipping;
    if (!s?.shiprocketShipmentId || !s?.awbCode || s.pickupScheduled) {
        return { skipped: true };
    }
    if (!["awb_generated", "shipment_created"].includes(s.status)) {
        return { skipped: true };
    }

    await schedulePickup({ shipmentId: s.shiprocketShipmentId });

    await Order.updateMany(
        { "shipping.shiprocketShipmentId": s.shiprocketShipmentId },
        { $set: { "shipping.pickupScheduled": true, "shipping.status": "pickup_scheduled" } }
    );
    return { scheduled: true };
};

/*
|--------------------------------------------------------------------------
| Shiprocket status text -> our shipping.status / order.status
|--------------------------------------------------------------------------
| Order matters: more specific patterns first ("UNDELIVERED" contains
| "DELIVERED", "RTO DELIVERED" contains both, etc).
*/
const STATUS_RULES = [
    [/\bRTO\b.*DELIVERED/, "rto_delivered", null],
    [/\bRTO\b|RETURN/, "rto", null],
    [/UNDELIVERED|DELIVERY ATTEMPT/, "undelivered", null],
    [/OUT FOR DELIVERY/, "out_for_delivery", "shipped"],
    [/DELIVERED/, "delivered", "delivered"],
    [/OUT FOR PICKUP|PICKUP SCHEDULED|PICKUP GENERATED|PICKUP QUEUED|PICKUP RESCHEDULED/, "pickup_scheduled", null],
    [/PICKED UP|PICKUP DONE/, "picked_up", "shipped"],
    [/IN TRANSIT|SHIPPED|REACHED|MISROUTED/, "in_transit", "shipped"],
    [/CANCEL/, "cancelled", null],
];

export const mapShiprocketStatus = (raw) => {
    const text = String(raw || "").toUpperCase().replace(/_/g, " ").trim();
    if (!text) return null;
    for (const [pattern, shipping, order] of STATUS_RULES) {
        if (pattern.test(text)) return { shipping, order };
    }
    return null;
};

// Used by the webhook AND the tracking refresh.
export const applyShipmentStatus = async ({ awb, statusText, courierName, etd }) => {
    const orders = await Order.find({ "shipping.awbCode": String(awb) });
    if (!orders.length) return { matched: 0 };

    const mapped = mapShiprocketStatus(statusText);

    for (const order of orders) {
        const s = order.shipping;
        if (courierName) s.courierName = courierName;
        if (statusText) s.shiprocketStatus = String(statusText);
        if (etd) s.estimatedDelivery = String(etd);

        if (mapped) {
            s.status = mapped.shipping;

            const locked = ["cancelled", "delivered"].includes(order.status);
            if (mapped.order && !locked) order.status = mapped.order;

            if (mapped.shipping === "delivered" && !s.deliveredDate) {
                s.deliveredDate = new Date().toISOString().split("T")[0];
                s.deliveredTime = new Date().toTimeString().slice(0, 8);
            }
        }

        s.updatedAt = new Date();
        await order.save();
    }

    return { matched: orders.length };
};

// Pulls the latest scans from Shiprocket (live mode) and saves the status.
export const refreshTracking = async (awb) => {
    if (isTestMode() || !awb) return { activities: [] };

    const result = await trackByAwb(awb);
    const data = result?.tracking_data;
    if (!data) return { activities: [] };

    const latest = data.shipment_track?.[0];
    const statusText = latest?.current_status || data.track_status;

    if (statusText) {
        await applyShipmentStatus({
            awb,
            statusText,
            courierName: latest?.courier_name,
            etd: data.etd || latest?.edd,
        });
    }

    const activities = (data.shipment_track_activities || []).map((a) => ({
        date: a.date,
        status: a.status,
        activity: a.activity || a["sr-status-label"] || "",
        location: a.location || "",
    }));

    return { activities };
};

// When every order in a shipment is cancelled, cancel it at Shiprocket too.
export const cancelShipmentIfUnused = async (order) => {
    const srId = order.shipping?.shiprocketOrderId;
    if (!srId) return;

    const stillActive = await Order.countDocuments({
        "shipping.shiprocketOrderId": srId,
        status: { $ne: "cancelled" },
    });
    if (stillActive) return;

    try {
        await cancelShiprocketOrders({ ids: [srId] });
        await Order.updateMany(
            { "shipping.shiprocketOrderId": srId },
            { $set: { "shipping.status": "cancelled" } }
        );
    } catch (error) {
        console.error("Shiprocket cancel error:", srId, error.response?.data || error.message);
    }
};