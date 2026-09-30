// NEW FILE: Backend/config/sms.js
const {
    SMSLOGIN_USERNAME,
    SMSLOGIN_AUTH_KEY,
    SMSLOGIN_SENDER_ID,
    SMSLOGIN_TEMPLATE_ID,
} = process.env;

export const isSmsConfigured = () =>
    Boolean(SMSLOGIN_USERNAME && SMSLOGIN_AUTH_KEY && SMSLOGIN_SENDER_ID && SMSLOGIN_TEMPLATE_ID);

// phone: canonical "+91XXXXXXXXXX". smslogin wants "91XXXXXXXXXX" (no "+").
export const sendSms = async ({ phone, message }) => {
    if (!isSmsConfigured()) {
        console.log("\n===== SMS (smslogin not configured, dev mode) =====");
        console.log("To:", phone);
        console.log(message);
        console.log("===================================================\n");
        return { delivered: false, dev: true };
    }

    const params = new URLSearchParams({
        username: SMSLOGIN_USERNAME,
        apikey: SMSLOGIN_AUTH_KEY,
        senderid: SMSLOGIN_SENDER_ID,
        mobile: phone.replace(/^\+/, ""),
        message,
        templateid: SMSLOGIN_TEMPLATE_ID,
    });

    const res = await fetch(`https://smslogin.co/v3/api.php?${params.toString()}`);
    const body = await res.text();

    if (!res.ok) {
        console.error("SMS provider error:", res.status, body);
        throw new Error(`SMS provider responded with ${res.status}`);
    }

    console.log("SMS provider response:", body);
    return { delivered: true, dev: false, body };
};