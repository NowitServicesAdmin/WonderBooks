import Razorpay from "razorpay";

// Single shared Razorpay instance. RAZORPAY_KEY / RAZORPAY_SECRET come from
// Razorpay Dashboard -> Settings -> API Keys. Set them in .env.
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

export default razorpay;
