import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, html, text }) {
    const sender = (process.env.GOOGLE_USER || "verify.querium@gmail.com").trim();
    const recipient = (typeof to === "string" ? to : to?.email || "").trim();

    if (!recipient) {
        throw new Error("Recipient email address (to) is missing or invalid.");
    }

    const plainTextFallback = text || (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "");

    // Transport 1: Brevo REST API via HTTPS — Best for Render (no SMTP port needed, pure HTTP)
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
                console.log("Email sent via Brevo REST API to:", recipient, brevoData.messageId);
                return { messageId: brevoData.messageId, provider: "brevo-api" };
            }
            console.warn("Brevo REST API failed:", JSON.stringify(brevoData));
        } catch (err) {
            console.warn("Brevo REST API error:", err.message);
        }
    }

    // Transport 2: Resend REST API via HTTPS — Alternative cloud option
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
                console.log("Email sent via Resend API to:", recipient, resendData.id);
                return { messageId: resendData.id, provider: "resend-api" };
            }
            console.warn("Resend API failed:", JSON.stringify(resendData));
        } catch (err) {
            console.warn("Resend API error:", err.message);
        }
    }

    // Transport 3: Brevo SMTP Port 587 — May be blocked on Render free tier
    if (process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS) {
        try {
            const brevoSmtp = nodemailer.createTransport({
                host: "smtp-relay.brevo.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.BREVO_SMTP_USER.trim(),
                    pass: process.env.BREVO_SMTP_PASS.trim(),
                },
            });
            const details = await brevoSmtp.sendMail({
                from: `Querium <${sender}>`,
                to: recipient,
                subject,
                html,
                text: plainTextFallback,
            });
            console.log("Email sent via Brevo SMTP to:", recipient, details.messageId || "");
            return details;
        } catch (err) {
            console.warn("Brevo SMTP failed:", err.message);
        }
    }

    // Transport 4: Gmail App Password — Works locally, usually blocked on Render
    const pass = (process.env.GOOGLE_APP_PASSWORD || process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();
    if (pass) {
        try {
            const gmailTransport = nodemailer.createTransport({
                service: "gmail",
                auth: { user: sender, pass },
                tls: { rejectUnauthorized: false }
            });
            const details = await gmailTransport.sendMail({
                from: `Querium <${sender}>`,
                replyTo: sender,
                to: recipient,
                subject,
                html,
                text: plainTextFallback
            });
            console.log("Email sent via Gmail App Password to:", recipient, details.messageId || "");
            return details;
        } catch (err) {
            console.error("Gmail App Password failed:", err.message);
        }
    }

    throw new Error("No working email transport. Add BREVO_API_KEY to Render environment variables.");
}
