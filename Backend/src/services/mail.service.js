import nodemailer from "nodemailer";

function createTransporter() {
    const user = process.env.GOOGLE_USER || process.env.EMAIL_USER || "verify.querium@gmail.com";

    // If Gmail App Password is provided (Recommended for ultra-fast delivery)
    if (process.env.GOOGLE_APP_PASSWORD || process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            service: "gmail",
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            auth: {
                user,
                pass: process.env.GOOGLE_APP_PASSWORD || process.env.EMAIL_PASS,
            },
        });
    }

    // High-speed OAuth2 setup
    return nodemailer.createTransport({
        service: "gmail",
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        auth: {
            type: "OAUTH2",
            user,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            clientId: process.env.GOOGLE_CLIENT_ID,
        },
    });
}

const transporter = createTransporter();

transporter.verify()
    .then(() => {
        console.log("High-speed email transporter pool is ready to send emails");
    })
    .catch((err) => {
        console.error("Email transporter verification failed on server startup:", err.message || err);
        console.warn("Please verify that GOOGLE_USER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN (or GOOGLE_APP_PASSWORD) are set in Render Environment variables.");
    });

export async function sendEmail({ to, subject, html, text }) {
    const sender = process.env.GOOGLE_USER || process.env.EMAIL_USER || "verify.querium@gmail.com";
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
        console.log("Email sent successfully to:", to, details.messageId);
        return details;
    } catch (err) {
        console.error("Failed to send email to:", to, err.message || err);
        throw err;
    }
}
