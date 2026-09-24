import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config.db.js";
import { User } from "../models/user.js";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
    console.error("Usage: node scripts/promoteToSuperAdmin.js <email>");
    process.exit(1);
}

try {
    await connectDB();

    const user = await User.findOneAndUpdate(
        { email },
        { role: "super admin" },
        { new: true }
    );

    if (!user) {
        console.error(`No account found for ${email}. They need to sign up first.`);
        process.exit(1);
    }

    console.log(`${user.email} is now a super admin.`);
} catch (error) {
    console.error("Failed to promote user:", error.message);
    process.exit(1);
} finally {
    await mongoose.disconnect();
}