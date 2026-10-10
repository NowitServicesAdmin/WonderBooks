import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    // National number (digits only) + the country it belongs to
    phone: { type: String, required: true, trim: true },
    phoneCountry: { type: String, default: "IN", uppercase: true, trim: true }, // ISO 3166-1 alpha-2
    phoneCode: { type: String, default: "91", trim: true }, // dial code without "+"
    phoneE164: { type: String, default: "", trim: true }, // e.g. +919876543210

    // Typed by the user
    doorNo: { type: String, required: true, trim: true },
    landmark: { type: String, default: "", trim: true },

    // From the location picker (Google Places)
    placeId: { type: String, default: "" },
    formattedAddress: { type: String, required: true, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    area: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, default: "", trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, default: "India", trim: true },
    pincode: { type: String, required: true, trim: true },

    addressType: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Address", addressSchema);