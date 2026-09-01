import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, html, text }) {
    const sender = (process.env.GOOGLE_USER || "verify.querium@gmail.com").trim();
    const recipient = (typeof to === "string" ? to : to?.email || "").trim();

    if (!recipient) {
        throw new Error("Recipient email address (to) is missing or invalid.");
    }

    const plainTextFallback = text || (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "");

    // Transport 1: Brevo SMTP (Port 587 - Works on Render, 300 free emails/day)
    if (process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS) {
        try {
            const brevoTransporter = nodemailer.createTransport({
                host: "smtp-relay.brevo.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.BREVO_SMTP_USER.trim(),
                    pass: process.env.BREVO_SMTP_PASS.trim(),
                },
            });
            const details = await brevoTransporter.sendMail({
                from: `Querium <${sender}>`,
                to: recipient,
                subject,
                html,
                text: plainTextFallback,
            });
            console.log("Email sent via Brevo SMTP to:", recipient, details.messageId || "");
            return details;
        } catch (brevoErr) {
            console.warn("Brevo SMTP failed:", brevoErr.message);
        }
    }

    // Transport 2: Brevo HTTPS REST API
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
                return { messageId: brevoData.messageId, provider: "brevo" };
            }
            console.warn("Brevo REST API failed:", JSON.stringify(brevoData));
        } catch (brevoErr) {
            console.warn("Brevo REST API error:", brevoErr.message);
        }
    }

    // Transport 3: Resend HTTPS REST API
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
                return { messageId: resendData.id, provider: "resend" };
            }
            console.warn("Resend API failed:", JSON.stringify(resendData));
        } catch (resendErr) {
            console.warn("Resend API error:", resendErr.message);
        }
    }

    // Transport 4: Gmail App Password via Nodemailer (Works locally, may timeout on Render)
    const pass = (process.env.GOOGLE_APP_PASSWORD || process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();
    if (pass) {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: sender, pass },
            tls: { rejectUnauthorized: false }
        });
        try {
            const details = await transporter.sendMail({
                from: `Querium <${sender}>`,
                replyTo: sender,
                to: recipient,
                subject,
                html,
                text: plainTextFallback
            });
            console.log("Email sent via Gmail App Password to:", recipient, details.messageId || "");
            return details;
        } catch (gmailErr) {
            console.error("Gmail App Password failed:", gmailErr.message);
            throw gmailErr;
        }
    }

    // Transport 5: Google OAuth2
    if (process.env.GOOGLE_REFRESH_TOKEN && process.env.GOOGLE_CLIENT_ID) {
        const transporter = nodemailer.createTransport({
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
        try {
            const details = await transporter.sendMail({
                from: `Querium <${sender}>`,
                replyTo: sender,
                to: recipient,
                subject,
                html,
                text: plainTextFallback
            });
            console.log("Email sent via Google OAuth2 to:", recipient, details.messageId || "");
            return details;
        } catch (oauthErr) {
            console.error("Google OAuth2 failed:", oauthErr.message);
            throw oauthErr;
        }
    }

    throw new Error("No email transport configured. Please set BREVO_SMTP_USER + BREVO_SMTP_PASS, BREVO_API_KEY, RESEND_API_KEY, or GOOGLE_APP_PASSWORD.");
}
