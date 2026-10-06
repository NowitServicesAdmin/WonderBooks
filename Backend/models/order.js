import mongoose from "mongoose";

const ShippingAddressSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        email: { type: String, default: "", trim: true },

        line1: { type: String, required: true, trim: true },
        line2: { type: String, default: "", trim: true },

        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        postalCode: { type: String, required: true, trim: true },
        country: { type: String, default: "India", trim: true },

        // Saved address / location picker
        addressType: { type: String, default: "" },
        landmark: { type: String, default: "" },
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
        placeId: { type: String, default: "" },
    },
    { _id: false }
);

const OrderSchema = new mongoose.Schema(
    {
        // User
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Book
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true,
        },

        bookTitle: {
            type: String,
            required: true,
        },

        bookCoverImageUrl: {
            type: String,
            default: null,
        },

        // Order
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },

        // Shipping address
        shippingAddress: {
            type: ShippingAddressSchema,
            required: true,
        },

        // Quantity / price
        quantity: {
            type: Number,
            default: 1,
            min: 1,
        },

        unitPrice: {
            type: Number,
            default: null,
        },

        shippingFee: {
            type: Number,
            default: 0,
        },

        subtotal: {
            type: Number,
            default: 0,
        },

        // GST
        gst: {
            type: Number,
            default: 0,
        },

        gstAmount: {
            type: Number,
            default: 0,
        },

        cgst: {
            type: Number,
            default: 0,
        },

        sgst: {
            type: Number,
            default: 0,
        },

        igst: {
            type: Number,
            default: 0,
        },

        // Final amount
        amount: {
            type: Number,
            required: true,
        },

        totalAmount: {
            type: Number,
            default: 0,
        },

        currency: {
            type: String,
            default: "INR",
        },

        // Order status
        status: {
            type: String,
            enum: [
                "pending_payment",
                "confirmed",
                "printing",
                "shipped",
                "delivered",
                "cancelled",
            ],
            default: "pending_payment",
        },

        // Payment
        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "paid",
                "failed",
                "refunded",
            ],
            default: "pending",
        },

        razorpayOrderId: {
            type: String,
            default: null,
        },

        razorpayPaymentId: {
            type: String,
            default: null,
        },

        razorpaySignature: {
            type: String,
            default: null,
        },

        // Cancellation
        cancelledAt: {
            type: Date,
            default: null,
        },

        cancelReason: {
            type: String,
            default: "",
        },

        /*
        |--------------------------------------------------------------------------
        | Shiprocket
        |--------------------------------------------------------------------------
        */

        shipping: {

            // Delivery partner
            courierId: {
                type: String,
                default: null,
            },

            courierPartner: {
                type: String,
                default: null,
            },

            courierName: {
                type: String,
                default: null,
            },

            // Shipping price
            shippingCharge: {
                type: Number,
                default: 0,
            },

            rate: {
                type: Number,
                default: 0,
            },

            freightCharge: {
                type: Number,
                default: 0,
            },

            codCharges: {
                type: Number,
                default: 0,
            },

            otherCharges: {
                type: Number,
                default: 0,
            },

            // Estimated delivery
            estimatedDelivery: {
                type: String,
                default: null,
            },

            estimatedDeliveryDays: {
                type: String,
                default: null,
            },

            // Shiprocket IDs
            shiprocketOrderId: {
                type: String,
                default: null,
            },

            shiprocketShipmentId: {
                type: String,
                default: null,
            },

            // AWB / tracking
            awbCode: {
                type: String,
                default: null,
                index: true,
            },

            trackingId: {
                type: String,
                default: null,
            },

            trackingUrl: {
                type: String,
                default: null,
            },

            // Shipment status
            status: {
                type: String,
                enum: [
                    "pending",
                    "rate_selected",
                    "shipment_created",
                    "awb_generated",
                    "pickup_scheduled",
                    "picked_up",
                    "in_transit",
                    "out_for_delivery",
                    "delivered",
                    "cancelled",
                    "rto",
                    "returned",
                ],
                default: "pending",
            },

            // Original Shiprocket status
            shiprocketStatus: {
                type: String,
                default: "NEW",
            },

            // Pickup / dispatch
            dispatchDate: {
                type: String,
                default: null,
            },

            dispatchTime: {
                type: String,
                default: null,
            },

            pickupDate: {
                type: String,
                default: null,
            },

            // Delivery
            deliveredDate: {
                type: String,
                default: null,
            },

            deliveredTime: {
                type: String,
                default: null,
            },

            // Return
            returnReason: {
                type: String,
                default: "",
            },

            remarks: {
                type: String,
                default: "",
            },

            // Webhook
            updatedBy: {
                type: String,
                default: null,
            },

            updatedAt: {
                type: Date,
                default: null,
            },

            // Address sent to Shiprocket
            shipmentName: {
                type: String,
                default: null,
            },

            shipmentPhone: {
                type: String,
                default: null,
            },

            shipmentEmail: {
                type: String,
                default: null,
            },

            shipmentAddress: {
                type: String,
                default: null,
            },

            shipmentCity: {
                type: String,
                default: null,
            },

            shipmentPincode: {
                type: String,
                default: null,
            },

            shipmentState: {
                type: String,
                default: null,
            },

            shipmentCountry: {
                type: String,
                default: "India",
            },

            // Package details
            weight: {
                type: Number,
                default: 0,
            },

            length: {
                type: Number,
                default: 0,
            },

            breadth: {
                type: Number,
                default: 0,
            },

            height: {
                type: Number,
                default: 0,
            },

            // COD / Prepaid
            paymentMode: {
                type: String,
                enum: ["COD", "Prepaid"],
                default: "Prepaid",
            },

            // Selected courier
            selectedRate: {
                type: Number,
                default: 0,
            },

            selectedCourier: {
                type: String,
                default: null,
            },

            selectedCourierId: {
                type: String,
                default: null,
            },
        },
    },
    {
        timestamps: true,
    }
);

OrderSchema.methods.statusStep = function () {
    const steps = {
        confirmed: 0,
        printing: 1,
        shipped: 2,
        delivered: 3,
    };

    if (this.status === "cancelled") return -1;

    return steps[this.status] ?? -1;
};

export default mongoose.model("Order", OrderSchema);