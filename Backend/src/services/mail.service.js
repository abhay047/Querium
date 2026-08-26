import nodemailer from "nodemailer";

export function getTransporter() {
    const user = (process.env.GOOGLE_USER || process.env.EMAIL_USER || "verify.querium@gmail.com").trim();
    const pass = (process.env.GOOGLE_APP_PASSWORD || process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();

    // If Gmail App Password is provided (Recommended for ultra-fast & cloud delivery)
    if (pass) {
        return nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            auth: {
                user,
                pass,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    // High-speed OAuth2 setup with Direct SSL configuration for cloud platforms
    return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        auth: {
            type: "OAUTH2",
            user,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}

const defaultTransporter = getTransporter();

export async function sendEmail({ to, subject, html, text }) {
    const sender = (process.env.GOOGLE_USER || process.env.EMAIL_USER || "verify.querium@gmail.com").trim();
    const plainTextFallback = text || (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "");
    
    const mailOptions = {
        from: `Querium <${sender}>`,
        replyTo: sender,
        to,
        subject,
        html,
        text: plainTextFallback,
    };

    try {
        const details = await defaultTransporter.sendMail(mailOptions);
        console.log("Email sent successfully from", sender, "to:", to, details.messageId);
        return details;
    } catch (err) {
        console.error("Failed to send email from", sender, "to:", to, err.message || err);
        throw err;
    }
}
