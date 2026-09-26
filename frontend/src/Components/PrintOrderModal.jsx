import { useState } from "react";
import { Loader2, MapPin, ShoppingCartIcon, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useRazorpayCheckout } from "../hooks/useRazorpayCheckout";
import { initiateOrder, verifyOrder } from "../services/orderService";

const FIELD =
  "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-heading)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--tint)]";
const LABEL = "mb-1 block text-xs font-bold text-[var(--text-muted)]";

const EMPTY_ADDRESS = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

export const PrintOrderModal = ({ book, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { openCheckout } = useRazorpayCheckout();

  const [address, setAddress] = useState(() => ({
    ...EMPTY_ADDRESS,
    name: user?.name || "",
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const update = (field) => (event) =>
    setAddress((prev) => ({ ...prev, [field]: event.target.value }));

  const isValid =
    address.name.trim() &&
    address.phone.trim() &&
    address.line1.trim() &&
    address.city.trim() &&
    address.state.trim() &&
    address.postalCode.trim();

  const handleClose = () => {
    if (submitting) return;
    setError("");
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const { data } = await initiateOrder(book._id, address);

      await openCheckout({
        order: data.order,
        keyId: data.keyId,
        name: "Wonder Books",
        description: `Printed copy of "${book.title}"`,
        prefill: {
          name: address.name,
          email: user?.email || "",
          contact: address.phone,
        },
        onSuccess: async (response) => {
          try {
            const verifyRes = await verifyOrder({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookId: book._id,
              shippingAddress: address,
            });
            onSuccess?.(verifyRes.data.order);
          } catch {
            setError("Payment succeeded, but we couldn't confirm your order. Please contact support.");
          } finally {
            setSubmitting(false);
          }
        },
        onDismiss: () => setSubmitting(false),
        onFailure: () => {
          setSubmitting(false);
          setError("The payment didn't go through. Please try again.");
        },
      });
    } catch (err) {
      setSubmitting(false);
      setError(err.response?.data?.message || "Couldn't start the order. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-[#2a2360]/50 p-4 backdrop-blur-[3px]"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-120 rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-[0_24px_70px_rgba(37,19,112,0.28)]"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-(--text-muted) transition hover:bg-(--tint)"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--tint) text-(--accent)">
            <ShoppingCartIcon size={20} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-(--text-heading)">
              Order a printed copy
            </h2>
            <p className="text-xs text-(--text-muted)">
              "{book.title}" — delivered to your door
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-(--text-muted)">
            <MapPin size={13} />
            Shipping address
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className={LABEL}>Full name</label>
              <input className={FIELD} value={address.name} onChange={update("name")} required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={LABEL}>Phone number</label>
              <input className={FIELD} value={address.phone} onChange={update("phone")} required />
            </div>
          </div>

          <div>
            <label className={LABEL}>Address line 1</label>
            <input className={FIELD} value={address.line1} onChange={update("line1")} required />
          </div>

          <div>
            <label className={LABEL}>Address line 2 (optional)</label>
            <input className={FIELD} value={address.line2} onChange={update("line2")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>City</label>
              <input className={FIELD} value={address.city} onChange={update("city")} required />
            </div>
            <div>
              <label className={LABEL}>State</label>
              <input className={FIELD} value={address.state} onChange={update("state")} required />
            </div>
            <div>
              <label className={LABEL}>Postal code</label>
              <input
                className={FIELD}
                value={address.postalCode}
                onChange={update("postalCode")}
                required
              />
            </div>
            <div>
              <label className={LABEL}>Country</label>
              <input className={FIELD} value={address.country} onChange={update("country")} required />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-[#c0392b]">{error}</p>}

          <button
            type="submit"
            disabled={!isValid || submitting}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-(--accent) text-sm font-bold text-white transition hover:bg-(--accent-hover) disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? <Loader2 size={17} className="animate-spin" /> : <ShoppingCartIcon size={17} />}
            {submitting ? "Processing..." : "Continue to payment"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PrintOrderModal;
