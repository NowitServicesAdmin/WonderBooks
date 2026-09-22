import { useCallback, useRef } from "react";

// Loads the Razorpay Checkout script once and caches the promise so
// multiple hook instances / re-renders don't re-inject the tag.
let razorpayScriptPromise = null;
const loadRazorpayScript = () => {
    if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(true);
    if (razorpayScriptPromise) return razorpayScriptPromise;

    razorpayScriptPromise = new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => {
            razorpayScriptPromise = null; // allow retry on next call
            resolve(false);
        };
        document.body.appendChild(script);
    });

    return razorpayScriptPromise;
};

/*
  |--------------------------------------------------------------------------
  | useRazorpayCheckout
  |--------------------------------------------------------------------------
  | Usage:
  |   const { openCheckout } = useRazorpayCheckout();
  |
  |   await openCheckout({
  |     order,                 // Razorpay order object from your backend
  |     keyId,                 // process.env.RAZORPAY_KEY, from backend
  |     name: "WonderBook",
  |     description: "Pro plan - monthly",
  |     prefill: { name, email },
  |     notes: { plan: "pro" },
  |     onSuccess: async (response) => { ...verify with backend... },
  |     onDismiss: () => { ...user closed the modal without paying... },
  |     onFailure: (error) => { ...payment.failed event... },
  |   });
*/
export const useRazorpayCheckout = () => {
    // Guards against a double-open if something triggers openCheckout twice
    // in quick succession (e.g. a fast double-click before disabled kicks in).
    const openingRef = useRef(false);

    const openCheckout = useCallback(
        async ({
            order,
            keyId,
            name = "",
            description = "",
            prefill = {},
            notes = {},
            theme = { color: "#5426c7" },
            onSuccess,
            onDismiss,
            onFailure,
        }) => {
            if (!order || !keyId) {
                throw new Error(
                    "Missing Razorpay order or keyId - check your backend's /initiate response."
                );
            }

            const scriptOk = await loadRazorpayScript();
            if (!scriptOk) {
                throw new Error("Couldn't load the Razorpay Checkout script. Check your connection.");
            }

            if (openingRef.current) return;
            openingRef.current = true;

            const rzp = new window.Razorpay({
                key: keyId,
                amount: order.amount,
                currency: order.currency,
                order_id: order.id,
                name,
                description,
                prefill,
                notes,
                theme,
                handler: async (response) => {
                    openingRef.current = false;
                    if (onSuccess) await onSuccess(response);
                },
                modal: {
                    ondismiss: () => {
                        openingRef.current = false;
                        if (onDismiss) onDismiss();
                    },
                },
            });

            rzp.on("payment.failed", (resp) => {
                openingRef.current = false;
                if (onFailure) onFailure(resp?.error);
            });

            rzp.open();
        },
        []
    );

    return { openCheckout };
};

export default useRazorpayCheckout;
