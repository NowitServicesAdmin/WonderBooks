const KEY = "wonderbooks.checkout.addressId";

export const getCheckoutAddressId = () => {
    try {
        return sessionStorage.getItem(KEY) || "";
    } catch {
        return "";
    }
};

export const setCheckoutAddressId = (id) => {
    try {
        if (id) sessionStorage.setItem(KEY, id);
        else sessionStorage.removeItem(KEY);
    } catch {
        /* storage unavailable - the extras page will send the user back to pick an address */
    }
};