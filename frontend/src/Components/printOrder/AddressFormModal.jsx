import { useState } from "react";
import { Briefcase, Home, Loader2, MapPin, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { addAddress, updateAddress } from "../../services/addressService";
import { LocationPicker } from "../LocationPicker";
import { PhoneInput } from "../PhoneInput";
import { DEFAULT_COUNTRY, formatNational, digitsOf, isValidPhone, toStorablePhone } from "../../utils/phone";

const FIELD =
    "h-11 w-full rounded-xl border border-(--border) bg-(--surface) px-3 text-sm text-(--text-heading) outline-none transition placeholder:text-(--text-muted) focus:border-(--accent) focus:ring-2 focus:ring-(--tint)";
const LABEL = "mb-1 block text-xs font-bold text-(--text-muted)";

const TYPES = [
    { label: "Home", icon: Home },
    { label: "Work", icon: Briefcase },
    { label: "Other", icon: MapPin },
];

// What the location picker hands back, rebuilt from a saved address (edit mode)
const locationFromAddress = (address) =>
    address
        ? {
            placeId: address.placeId || "",
            address: address.formattedAddress,
            latitude: address.latitude,
            longitude: address.longitude,
            area: address.area || "",
            district: address.district || "",
            country: address.country || "India",
        }
        : null;

// Add / edit a delivery address. Render it only while open - it starts fresh each time.
export const AddressFormModal = ({ address = null, isFirstAddress = false, onClose, onSaved }) => {
    const { user } = useAuth();
    const editing = Boolean(address);

    const [form, setForm] = useState(() => ({
        fullName: address?.fullName || user?.name || "",
        // national number as shown in the box + the country it belongs to (older addresses are Indian)
        phoneCountry: address?.phoneCountry || DEFAULT_COUNTRY,
        phone: address?.phone ? formatNational(digitsOf(address.phone), address?.phoneCountry || DEFAULT_COUNTRY) : "",
        location: locationFromAddress(address),
        city: address?.city || "",
        state: address?.state || "",
        pincode: address?.pincode || "",
        doorNo: address?.doorNo || "",
        landmark: address?.landmark || "",
        addressType: address?.addressType || "Home",
        isDefault: address?.isDefault || isFirstAddress,
    }));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

    const handleLocation = (location) =>
        setForm((prev) => ({
            ...prev,
            location,
            // fill from the chosen place; the user can still correct them below
            city: location ? location.city || prev.city : "",
            state: location ? location.state || prev.state : "",
            pincode: location ? location.pincode || prev.pincode : "",
        }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (saving) return;

        if (!form.fullName.trim() || !form.doorNo.trim() || !form.location) {
            setError("Please fill in your name, delivery location and flat / house number.");
            return;
        }
        if (!isValidPhone(form.phone, form.phoneCountry)) {
            setError("Please enter a valid phone number for the selected country.");
            return;
        }
        const storable = toStorablePhone(form.phone, form.phoneCountry);
        if (!storable) {
            setError("Please enter a valid phone number for the selected country.");
            return;
        }
        if (!form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
            setError("City, state and pincode are needed for delivery.");
            return;
        }

        const payload = {
            fullName: form.fullName.trim(),
            phone: storable.phone,
            phoneCountry: storable.phoneCountry,
            phoneCode: storable.phoneCode,
            doorNo: form.doorNo.trim(),
            landmark: form.landmark.trim(),
            addressType: form.addressType,
            isDefault: form.isDefault,
            placeId: form.location.placeId || "",
            formattedAddress: form.location.address,
            latitude: form.location.latitude ?? null,
            longitude: form.location.longitude ?? null,
            area: form.location.area || "",
            district: form.location.district || "",
            country: form.location.country || "India",
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: form.pincode.trim(),
        };

        setSaving(true);
        setError("");
        try {
            const { data } = editing
                ? await updateAddress(address._id, payload)
                : await addAddress(payload);
            onSaved?.(data.address);
        } catch (err) {
            setError(err.response?.data?.message || "Couldn't save this address. Please try again.");
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-9999 flex items-center justify-center bg-[#2a2360]/50 p-3 backdrop-blur-[3px] sm:p-4"
            onClick={() => !saving && onClose?.()}
        >
            <div
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
                className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-[0_24px_70px_rgba(37,19,112,0.28)] sm:p-6"
            >
                <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    aria-label="Close"
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-(--text-muted) transition hover:bg-(--tint)"
                >
                    <X size={16} />
                </button>

                <div className="flex items-center gap-3 pr-8">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--tint) text-(--accent)">
                        <MapPin size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-extrabold text-(--text-heading)">
                            {editing ? "Edit delivery address" : "Add delivery address"}
                        </h2>
                        <p className="text-xs text-(--text-muted)">Where should we send your printed book?</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                            <label className={LABEL}>Full name</label>
                            <input className={FIELD} value={form.fullName} onChange={set("fullName")} />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className={LABEL}>Phone number</label>
                            <PhoneInput
                                value={form.phone}
                                country={form.phoneCountry}
                                onChange={({ value, country }) =>
                                    setForm((prev) => ({ ...prev, phone: value, phoneCountry: country }))
                                }
                                placeholder="Mobile number"
                            />
                        </div>
                    </div>

                    <LocationPicker
                        label="Delivery location"
                        required
                        value={form.location}
                        onChange={handleLocation}
                    />

                    {form.location && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div>
                                <label className={LABEL}>City</label>
                                <input className={FIELD} value={form.city} onChange={set("city")} />
                            </div>
                            <div>
                                <label className={LABEL}>State</label>
                                <input className={FIELD} value={form.state} onChange={set("state")} />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className={LABEL}>Pincode</label>
                                <input className={FIELD} value={form.pincode} onChange={set("pincode")} inputMode="numeric" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className={LABEL}>Flat / house no. / building</label>
                        <input
                            className={FIELD}
                            value={form.doorNo}
                            onChange={set("doorNo")}
                            placeholder="e.g. Flat 302, Sunrise Apartments"
                        />
                    </div>

                    <div>
                        <label className={LABEL}>Landmark (optional)</label>
                        <input
                            className={FIELD}
                            value={form.landmark}
                            onChange={set("landmark")}
                            placeholder="Nearby landmark for easy delivery"
                        />
                    </div>

                    <div>
                        <p className={LABEL}>Address type</p>
                        <div className="flex flex-wrap gap-2">
                            {TYPES.map(({ label, icon: Icon }) => {
                                const active = form.addressType === label;
                                return (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => setForm((prev) => ({ ...prev, addressType: label }))}
                                        className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${active
                                            ? "border-(--accent) bg-(--tint) text-(--accent)"
                                            : "border-(--border) text-(--text-muted) hover:bg-(--tint)"
                                            }`}
                                    >
                                        <Icon size={15} />
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm font-semibold text-(--text-heading)">
                        <input
                            type="checkbox"
                            checked={form.isDefault}
                            onChange={(event) => setForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
                            className="h-4 w-4 accent-(--accent)"
                        />
                        Make this my default address
                    </label>

                    {error && <p className="text-xs font-semibold text-[#c0392b]">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="h-12 flex-1 rounded-xl border border-(--border) text-sm font-bold text-(--text-muted) transition hover:bg-(--tint) disabled:opacity-50 sm:flex-none sm:px-6"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-(--accent) text-sm font-bold text-white transition hover:bg-(--accent-hover) disabled:pointer-events-none disabled:opacity-50"
                        >
                            {saving && <Loader2 size={17} className="animate-spin" />}
                            {saving ? "Saving..." : editing ? "Save changes" : "Save address"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddressFormModal;