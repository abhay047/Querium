import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, html, text }) {
    const sender = (process.env.GOOGLE_USER || process.env.EMAIL_USER || "verify.querium@gmail.com").trim();
    const recipient = (typeof to === "string" ? to : to?.email || "").trim();

    if (!recipient) {
        throw new Error("Recipient email address (to) is missing or invalid.");
    }

    const plainTextFallback = text || (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "");

    // Transport 1: Resend HTTPS REST API (Highest reliability for cloud platforms like Render)
    if (process.env.RESEND_API_KEY) {
        try {
            const resendRes = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.RESEND_API_KEY.trim()}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    from: process.env.RESEND_FROM || "Querium <onboarding@resend.dev>",
                    to: [recipient],
                    subject,
                    html,
                    text: plainTextFallback
                })
            });
            const resendData = await resendRes.json();
            if (resendRes.ok) {
                console.log("Email sent successfully via Resend API to:", recipient, resendData.id);
                return { messageId: resendData.id, provider: "resend" };
            }
            console.warn("Resend API failed, falling back to Gmail SMTP:", resendData);
        } catch (resendErr) {
            console.warn("Resend API error:", resendErr.message);
        }
    }

    // Transport 2: Brevo HTTPS REST API (Free 300 emails/day)
    if (process.env.BREVO_API_KEY) {
        try {
            const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                    "api-key": process.env.BREVO_API_KEY.trim(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    sender: { name: "Querium", email: sender },
                    to: [{ email: recipient }],
                    subject,
                    htmlContent: html,
                    textContent: plainTextFallback
                })
            });
            const brevoData = await brevoRes.json();
            if (brevoRes.ok) {
                console.log("Email sent successfully via Brevo API to:", recipient, brevoData.messageId);
                return { messageId: brevoData.messageId, provider: "brevo" };
            }
            console.warn("Brevo API failed, falling back to Gmail SMTP:", brevoData);
        } catch (brevoErr) {
            console.warn("Brevo API error:", brevoErr.message);
        }
    }

    // Transport 3: Standard Gmail Nodemailer (App Password / OAuth2)
    const pass = (process.env.GOOGLE_APP_PASSWORD || process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();
    if (pass || process.env.GOOGLE_REFRESH_TOKEN) {
        let transporter;
        if (pass) {
            transporter = nodemailer.createTransport({
                service: "gmail",
                auth: { user: sender, pass },
                tls: { rejectUnauthorized: false }
            });
        } else {
            transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    type: "OAUTH2",
                    user: sender,
                    clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
                    clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
                    refreshToken: (process.env.GOOGLE_REFRESH_TOKEN || "").trim(),
                },
                tls: { rejectUnauthorized: false }
            });
        }

        try {
            const details = await transporter.sendMail({
                from: `Querium <${sender}>`,
                replyTo: sender,
                to: recipient,
                subject,
                html,
                text: plainTextFallback
            });
            console.log("Email sent successfully via Nodemailer Gmail to:", recipient, details.messageId || "");
            return details;
        } catch (gmailErr) {
            console.error("Nodemailer Gmail failed:", gmailErr.message || gmailErr);
            throw gmailErr;
        }
    }

    console.warn("No email service configured. Simulated email dispatch for:", recipient);
    return { messageId: "simulated_" + Date.now(), provider: "none" };
}
