import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    contactNo: {
      type: String,
      required: true,
      trim: true,
    },
    timeZone: {
      type: String,
      required: true,
    },
    preferredTime: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

export const ContactMessage = mongoose.model(
  "ContactMessage",
  contactMessageSchema
);