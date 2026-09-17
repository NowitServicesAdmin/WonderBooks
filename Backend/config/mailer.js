import nodemailer from "nodemailer";

const hasEmailConfig = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

let transporter = null;

if (hasEmailConfig) {
    transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}


export const sendEmail = async ({ to, subject, html, text }) => {
    if (!transporter) {
        console.log("\n===== EMAIL (Gmail not configured, dev mode) =====");
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log(text || html);
        console.log("====================================================\n");
        return { delivered: false, dev: true };
    }

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html,
        text,
    });

    return { delivered: true, dev: false };
};
