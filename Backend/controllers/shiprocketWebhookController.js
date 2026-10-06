import crypto from "crypto";
import { applyShipmentStatus } from "../services/shipmentService.js";

// Shiprocket sends the token you typed in its webhook settings as the
// "x-api-key" header. It must equal SHIPROCKET_WEBHOOK_KEY in .env.
const keyMatches = (received) => {
  const expected = String(process.env.SHIPROCKET_WEBHOOK_KEY || "");
  const got = String(received || "");
  if (!expected || expected.length !== got.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(got));
};

export const shiprocketWebhook = async (req, res) => {
  try {
    if (!keyMatches(req.headers["x-api-key"])) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { awb, courier_name, current_status, shipment_status, etd } =
      req.body || {};

    // Always answer 200 once authorised, otherwise Shiprocket keeps retrying.
    if (!awb) {
      return res.status(200).json({ success: true, message: "No AWB, ignored" });
    }

    await applyShipmentStatus({
      awb: String(awb),
      statusText: current_status || shipment_status,
      courierName: courier_name,
      etd,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Shiprocket webhook error:", error);
    return res.status(500).json({ success: false });
  }
};