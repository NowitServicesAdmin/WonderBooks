import axios from "axios";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

/*
|--------------------------------------------------------------------------
| Mode switch  ->  SHIPROCKET_MODE=test | live   (in .env)
|--------------------------------------------------------------------------
| Read at CALL time (not at import time) so it still works when dotenv is
| loaded after the imports. Anything other than "live" is treated as test,
| so a typo can never hit the real Shiprocket account by accident.
*/
export const getShiprocketMode = () =>
  String(process.env.SHIPROCKET_MODE || "test").trim().toLowerCase() === "live"
    ? "live"
    : "test";

export const isTestMode = () => getShiprocketMode() === "test";

let cachedToken = null;
let tokenExpiresAt = 0;

let loginBlockedUntil = 0;

const getShiprocketToken = async () => {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  // After a failed login, stop retrying for 10 minutes so Shiprocket doesn't block the user
  if (Date.now() < loginBlockedUntil) {
    throw new Error(
      "Shiprocket login paused after a failed attempt. Check SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD."
    );
  }

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/auth/login`,
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      },
      { headers: { "Content-Type": "application/json" }, timeout: 20000 }
    );

    cachedToken = response.data.token;
    // Shiprocket tokens last 10 days; refresh a day early.
    tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;
    return cachedToken;
  } catch (error) {
    loginBlockedUntil = Date.now() + 10 * 60 * 1000;
    throw error;
  }
};

// One place that adds the token, and retries once if the token was rejected.
const request = async (config, retry = true) => {
  const token = await getShiprocketToken();
  try {
    const response = await axios({
      baseURL: SHIPROCKET_BASE_URL,
      timeout: 20000,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...config,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401 && retry) {
      cachedToken = null;
      tokenExpiresAt = 0;
      return request(config, false);
    }
    throw error;
  }
};

const digits10 = (value) => String(value || "").replace(/\D/g, "").slice(-10);

const formatOrderDate = (value) => {
  const d = new Date(value || Date.now());
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/**
 * 1. SHIPPING RATES + ESTIMATED DAYS
 * Returns { data: { available_courier_companies: [...] } } in both modes.
 */
export const getShippingRates = async ({
  pickupPostcode,
  deliveryPostcode,
  weight,
  cod = 0,
  declaredValue,
}) => {
  if (isTestMode()) {
    const extra = Math.ceil(Math.max(Number(weight) - 0.5, 0) / 0.5) * 30;
    return {
      data: {
        available_courier_companies: [
          {
            courier_company_id: 101,
            courier_name: "Test Courier",
            rate: 80 + extra,
            etd: "3-5 days",
            estimated_delivery_days: "5",
            cod: 1,
            rating: 4.5,
            charge_weight: weight,
          },
          {
            courier_company_id: 102,
            courier_name: "Test Express",
            rate: 120 + extra,
            etd: "1-2 days",
            estimated_delivery_days: "2",
            cod: 1,
            rating: 4.8,
            charge_weight: weight,
          },
        ],
      },
    };
  }

  return request({
    method: "get",
    url: "/courier/serviceability/",
    params: {
      pickup_postcode: pickupPostcode,
      delivery_postcode: deliveryPostcode,
      weight,
      cod,
      ...(declaredValue ? { declared_value: declaredValue } : {}),
    },
  });
};

/**
 * 2. CREATE SHIPMENT
 * `orders` = every order created by ONE payment (one parcel, one shipment).
 */
export const createShiprocketOrder = async ({
  orders,
  email,
  pickupLocation,
}) => {
  const first = orders[0];

  if (isTestMode()) {
    return {
      order_id: `TEST-${first.orderNumber}`,
      shipment_id: `TEST-SHIP-${first.orderNumber}`,
    };
  }

  const address = first.shippingAddress;
  const [firstName, ...rest] = String(address.name || "Customer")
    .trim()
    .split(/\s+/);

  const subTotal = orders.reduce(
    (sum, o) => sum + (o.unitPrice || 0) * (o.quantity || 1),
    0
  );

  const payload = {
    order_id: first.orderNumber,
    order_date: formatOrderDate(first.createdAt),
    pickup_location: pickupLocation,

    billing_customer_name: firstName,
    billing_last_name: rest.join(" "),
    billing_address: address.line1,
    billing_address_2: address.line2 || "",
    billing_city: address.city,
    billing_pincode: address.postalCode,
    billing_state: address.state,
    billing_country: address.country || "India",
    billing_email: email || address.email || process.env.SHIPROCKET_EMAIL,
    billing_phone: digits10(address.phone),

    shipping_is_billing: true,

    order_items: orders.map((o) => ({
      name: o.bookTitle,
      sku: String(o.book),
      units: o.quantity || 1,
      selling_price: o.unitPrice || 0,
    })),

    payment_method: "Prepaid",
    sub_total: subTotal,

    length: first.shipping?.length || 10,
    breadth: first.shipping?.breadth || 10,
    height: first.shipping?.height || 10,
    weight: first.shipping?.weight || 0.5,
  };

  return request({
    method: "post",
    url: "/orders/create/adhoc",
    data: payload,
  });
};

/**
 * 3. ASSIGN COURIER / GENERATE AWB
 */
export const assignCourier = async ({ shipmentId, courierId, orderNumber }) => {
  if (isTestMode()) {
    return {
      response: {
        data: {
          awb_code: `TEST-AWB-${orderNumber}`,
          courier_name: "Test Courier",
        },
      },
    };
  }

  const data = { shipment_id: shipmentId };
  if (courierId) data.courier_id = Number(courierId);

  return request({ method: "post", url: "/courier/assign/awb", data });
};

/**
 * 4. SCHEDULE PICKUP
 */
export const schedulePickup = async ({ shipmentId }) => {
  if (isTestMode()) {
    return { pickup_scheduled: true, message: "Test pickup scheduled" };
  }

  return request({
    method: "post",
    url: "/courier/generate/pickup",
    data: { shipment_id: [Number(shipmentId)] },
  });
};

/**
 * 5. TRACK BY AWB  (live mode only; test mode has nothing to track)
 */
export const trackByAwb = async (awb) => {
  if (isTestMode()) return null;
  return request({ method: "get", url: `/courier/track/awb/${awb}` });
};

/**
 * 6. CANCEL SHIPROCKET ORDER(S)
 */
export const cancelShiprocketOrders = async ({ ids }) => {
  if (isTestMode()) return { message: "Test order cancelled" };
  return request({
    method: "post",
    url: "/orders/cancel",
    data: { ids: ids.map(Number) },
  });
};