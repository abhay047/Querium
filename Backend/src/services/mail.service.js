import nodemailer from "nodemailer";

export function getTransporter() {
    const user = (process.env.GOOGLE_USER || process.env.EMAIL_USER || "verify.querium@gmail.com").trim();
    const pass = (process.env.GOOGLE_APP_PASSWORD || process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();

    // Direct SSL Port 465 Transport for Cloud Hosts (Render, AWS, Vercel)
    if (pass) {
        return nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user,
                pass,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    // Fallback to OAuth2 only if explicitly configured
    if (process.env.GOOGLE_REFRESH_TOKEN && process.env.GOOGLE_CLIENT_ID) {
        return nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                type: "OAUTH2",
                user,
                clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
                clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
                refreshToken: (process.env.GOOGLE_REFRESH_TOKEN || "").trim(),
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    throw new Error("GOOGLE_APP_PASSWORD environment variable is missing on server.");
}

export async function sendEmail({ to, subject, html, text }) {
    const sender = (process.env.GOOGLE_USER || process.env.EMAIL_USER || "verify.querium@gmail.com").trim();
    const recipient = (typeof to === "string" ? to : to?.email || "").trim();

    if (!recipient) {
        throw new Error("Recipient email address (to) is missing or invalid.");
    }

    const transporter = getTransporter();
    const plainTextFallback = text || (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "");
    
    const mailOptions = {
        from: `Querium <${sender}>`,
        replyTo: sender,
        to: recipient,
        subject,
        html,
        text: plainTextFallback,
    };

    try {
        const details = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully from", sender, "to:", recipient, details.messageId || "");
        return details;
    } catch (err) {
        console.error("Failed to send email from", sender, "to:", recipient, err.message || err);
        throw err;
    }
}
