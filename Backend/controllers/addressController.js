import mongoose from "mongoose";
import Address from "../models/address.js";

const EDITABLE_FIELDS = [
  "fullName",
  "phone",
  "phoneCountry",
  "phoneCode",
  "doorNo",
  "landmark",
  "placeId",
  "formattedAddress",
  "latitude",
  "longitude",
  "area",
  "city",
  "district",
  "state",
  "country",
  "pincode",
  "addressType",
];

const pick = (body) =>
  EDITABLE_FIELDS.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});

const digitsOnly = (value) => String(value ?? "").replace(/\D/g, "");

// Works out the phone fields to save (national number + country + dial code + E.164).
// Returns { error } or { fields }. On update, anything not sent falls back to the saved value.
const resolvePhone = (data, existing = {}) => {
  const touched = ["phone", "phoneCountry", "phoneCode"].some(
    (key) => data[key] !== undefined,
  );
  if (!touched) return { fields: {} };

  const country = String(data.phoneCountry ?? existing.phoneCountry ?? "IN")
    .trim()
    .toUpperCase();
  const code = digitsOnly(data.phoneCode ?? existing.phoneCode ?? "91");
  let phone = digitsOnly(data.phone ?? existing.phone);

  if (!/^[A-Z]{2}$/.test(country) || !/^\d{1,4}$/.test(code)) {
    return { error: "Please choose a valid country for the phone number" };
  }

  if (code === "91") {
    // India: 10-digit mobile number
    phone = phone.slice(-10);
    if (phone.length !== 10) {
      return { error: "Please enter a valid 10-digit phone number" };
    }
  } else if (phone.length < 4 || phone.length + code.length > 15) {
    return { error: "Please enter a valid phone number" };
  }

  return {
    fields: {
      phone,
      phoneCountry: country,
      phoneCode: code,
      phoneE164: `+${code}${phone}`,
    },
  };
};

// Returns an error message, or null when the address is good to save
const validate = (data, { partial = false } = {}) => {
  const required = [
    "fullName",
    "phone",
    "doorNo",
    "formattedAddress",
    "city",
    "state",
    "pincode",
  ];
  for (const field of required) {
    if (partial && data[field] === undefined) continue;
    if (!String(data[field] ?? "").trim()) {
      return field === "formattedAddress"
        ? "Please pick a delivery location"
        : `Please fill in "${field}"`;
    }
  }
  return null;
};

const invalidId = (res) =>
  res.status(404).json({ success: false, message: "Address not found" });

export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
    return res.json({ success: true, addresses });
  } catch (error) {
    console.error("getAddresses error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load your addresses" });
  }
};

export const addAddress = async (req, res) => {
  try {
    const data = pick(req.body);
    const error = validate(data);
    if (error) return res.status(400).json({ success: false, message: error });
    const phoneResult = resolvePhone(data);
    if (phoneResult.error) {
      return res.status(400).json({ success: false, message: phoneResult.error });
    }
    Object.assign(data, phoneResult.fields);

    const hasAny = await Address.exists({ user: req.userId });
    // The first address is always the default
    const makeDefault = Boolean(req.body.isDefault) || !hasAny;
    if (makeDefault) {
      await Address.updateMany({ user: req.userId }, { isDefault: false });
    }

    const address = await Address.create({
      ...data,
      user: req.userId,
      isDefault: makeDefault,
    });
    return res.status(201).json({ success: true, address });
  } catch (error) {
    console.error("addAddress error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to save this address" });
  }
};

export const updateAddress = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return invalidId(res);

    const address = await Address.findOne({
      _id: req.params.id,
      user: req.userId,
    });
    if (!address) return invalidId(res);

    const data = pick(req.body);
    const error = validate(data, { partial: true });
    if (error) return res.status(400).json({ success: false, message: error });
    const phoneResult = resolvePhone(data, address);
    if (phoneResult.error) {
      return res.status(400).json({ success: false, message: phoneResult.error });
    }
    Object.assign(data, phoneResult.fields);

    if (req.body.isDefault) {
      await Address.updateMany({ user: req.userId }, { isDefault: false });
      address.isDefault = true;
    }

    Object.assign(address, data);
    await address.save();
    return res.json({ success: true, address });
  } catch (error) {
    console.error("updateAddress error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to update this address" });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return invalidId(res);

    const address = await Address.findOne({
      _id: req.params.id,
      user: req.userId,
    });
    if (!address) return invalidId(res);

    const wasDefault = address.isDefault;
    await address.deleteOne();

    // Keep one default around if any addresses are left
    if (wasDefault) {
      const next = await Address.findOne({ user: req.userId }).sort({
        createdAt: -1,
      });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("deleteAddress error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to delete this address" });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return invalidId(res);

    const address = await Address.findOne({
      _id: req.params.id,
      user: req.userId,
    });
    if (!address) return invalidId(res);

    await Address.updateMany({ user: req.userId }, { isDefault: false });
    address.isDefault = true;
    await address.save();
    return res.json({ success: true, address });
  } catch (error) {
    console.error("setDefaultAddress error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to set the default address" });
  }
};