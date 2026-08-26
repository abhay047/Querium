import nodemailer from "nodemailer";

export function getTransporter() {
    const user = (process.env.GOOGLE_USER || process.env.EMAIL_USER || "").trim();
    const pass = (process.env.GOOGLE_APP_PASSWORD || process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();

    // If Gmail App Password is provided (16-character App Password)
    if (pass) {
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user,
                pass,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    // High-speed OAuth2 setup
    return nodemailer.createTransport({
        service: "gmail",
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

export async function sendEmail({ to, subject, html, text }) {
    const sender = (process.env.GOOGLE_USER || process.env.EMAIL_USER || "").trim();
    if (!sender) {
        throw new Error("GOOGLE_USER environment variable is missing. Please set your Gmail address in environment variables.");
    }

    const transporter = getTransporter();
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
        const details = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully from", sender, "to:", to, details.messageId);
        return details;
    } catch (err) {
        console.error("Failed to send email from", sender, "to:", to, err.message || err);
        throw err;
    }
}
