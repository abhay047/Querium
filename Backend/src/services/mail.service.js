import nodemailer from "nodemailer";

function createTransporter() {
    const user = process.env.GOOGLE_USER || process.env.EMAIL_USER || "verify.querium@gmail.com";

    // If Gmail App Password is provided (recommended for production)
    if (process.env.GOOGLE_APP_PASSWORD || process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user,
                pass: process.env.GOOGLE_APP_PASSWORD || process.env.EMAIL_PASS,
            },
        });
    }

    // OAuth2 setup
    return nodemailer.createTransport({
        service: "gmail",
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
        console.log("Email transporter is ready to send emails");
    })
    .catch((err) => {
        console.error("Email transporter verification failed on server startup:", err.message || err);
        console.warn("Please verify that GOOGLE_USER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN (or GOOGLE_APP_PASSWORD) are set in Render Environment variables.");
    });

export async function sendEmail({ to, subject, html, text }) {
    const sender = process.env.GOOGLE_USER || process.env.EMAIL_USER || "verify.querium@gmail.com";
    const mailOptions = {
        from: `Querium <${sender}>`,
        to,
        subject,
        html,
        text,
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
